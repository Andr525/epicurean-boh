// New test-only runner. No application functions are replaced. The existing offline transport is reused.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {isDeepStrictEqual} from 'node:util';
import {launch,transform,openPage} from '../serve.mjs';
export const clone=value=>JSON.parse(JSON.stringify(value));
export const tick=page=>page.waitForTimeout(100); // drain mock snapshot notifications, not a substitute for startup readiness
export async function waitIdle(page){await page.evaluate(async()=>{await Promise.all(Object.values(window.DOC_WRITE_CHAIN||{}));await new Promise(r=>setTimeout(r,100));});}
export function sourceInfo(root,baseline){
 const git=(...args)=>execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
 const raw=fs.readFileSync(path.join(root,'index.html'));
 return {root,revision:git('rev-parse','HEAD'),baseline,indexSha256:createHash('sha256').update(raw).digest('hex'),indexMatchesBaseline:Buffer.from(execFileSync('git',['-C',root,'show',baseline+':index.html'])).equals(raw),changedTrackedFiles:git('diff','--name-only',baseline).split('\n').filter(Boolean),baselineDeltaOutsideNewSuite:git('diff','--name-only',baseline).split('\n').filter(f=>f&&!f.startsWith('test/acceptance/regression-targets/'))};
}
export async function suite({name,root,baseline,ids}){
 const contractRaw=fs.readFileSync(new URL('./contract.json',import.meta.url));const contract=JSON.parse(contractRaw),repo=name.includes('-boh-')?'boh':'pos';
 if(!isDeepStrictEqual(contract.cases.filter(c=>c.repo===repo).map(c=>c.id),ids))throw Error('Suite IDs differ from frozen contract');
 const browser=await launch(),results=[],registered=[];let port=9870;
 const onlyAt=process.argv.indexOf('--only'),only=onlyAt>=0?process.argv[onlyAt+1]:null;
 if(only&&!ids.includes(only))throw Error('Unknown --only ID '+only);
 const info=sourceInfo(root,baseline);
 if(process.argv.includes('--baseline')&&(!info.indexMatchesBaseline||info.baselineDeltaOutsideNewSuite.length))throw Error('Application index is not the pinned failing baseline');
 async function open(seed,{extraHead='',login=null,failedReads=false,table='1'}={}){
  const security=`<meta http-equiv="Content-Security-Policy" content="connect-src 'none'; frame-src 'none'; worker-src 'none'; object-src 'none'; form-action 'none'">`;
  const html=transform(fs.readFileSync(path.join(root,'index.html'),'utf8'),{seed,extraHead:security+(failedReads?'<script>window.__MOCK_FAIL_READS__=true;</script>':'')+extraHead});
  const o=await openPage(browser,{root,html,origin:'http://127.0.0.1:'+(port++)});
  await o.page.waitForFunction(()=>window.__MOCK_DB__&&typeof STATE!=='undefined'&&fbDb===window.__MOCK_DB__);
  if(login==='boh'){
   await o.page.waitForFunction(()=>CLOUD_SYNC_STATE==='ok'||CLOUD_SYNC_STATE==='failed');
   await waitIdle(o.page);
   await o.page.locator('#mgr-code').fill('EPICUREAN2024');await o.page.locator('#mgr-go').click();
   await o.page.waitForFunction(()=>SESSION.user?.isOwner===true);
  }else if(login==='pos'){
   await o.page.waitForFunction(()=>STATE.staff?.some(s=>String(s.code)==='3001'));
   for(const digit of '3001')await o.page.getByRole('button',{name:digit,exact:true}).first().click();
   await o.page.waitForFunction(()=>String(STATE.currentServer?.code)==='3001');
   await o.page.evaluate(t=>selectTable(t),table);const guests=o.page.locator('button[onclick="chooseGuestCount(2)"]:visible');if(await guests.count())await guests.first().click();await tick(o.page);
  }
  return o;
 }
 async function run(id,title,fn){
  registered.push(id);if(only&&only!==id){results.push({id,title,status:'UNRUN',assertions:[]});return;}
  const assertions=[],pages=[],started=Date.now();let error=null;
  const check=(label,actual,expected,{control=false}={})=>{assertions.push({label,kind:control?'control':'target',pass:isDeepStrictEqual(actual,expected),actual,expected});};
  const ctx={check,open:async(...args)=>{const o=await open(...args);pages.push(o);return o;},tick,waitIdle};
  try{await fn(ctx);if(!assertions.some(a=>a.kind==='target'))throw Error('No business assertions executed');const labels=new Set(assertions.map(a=>a.label));for(const label of contract.cases.find(c=>c.id===id).requiredAssertions)if(!labels.has(label))throw Error('Missing required assertion: '+label);}
  catch(e){error={name:e.name,message:e.message,stack:e.stack};}
  const browserErrors=pages.flatMap(p=>p.errors),blockedExternal=pages.flatMap(p=>p.external);
  // Errors from an injected failed SEND are a business failure, never silently ignored.
  check('application produces no uncaught browser errors',browserErrors,[]);
  for(const p of pages)await p.context.close();
  const status=error?'ERROR':assertions.some(a=>!a.pass)?'FAIL':'PASS';
  const row={id,title,status,durationMs:Date.now()-started,error,assertions,blockedExternal};results.push(row);
  console.log(status+' '+id+' '+title);for(const a of assertions.filter(a=>!a.pass))console.log('  '+a.label+' expected='+JSON.stringify(a.expected)?.slice(0,600)+' actual='+JSON.stringify(a.actual)?.slice(0,600));if(error)console.error(error.message);
 }
 async function finish(){
  await browser.close();
  if(!isDeepStrictEqual(registered,ids))throw Error('Registered case IDs differ from fixed acceptance matrix');
  const summary={suite:name,at:new Date().toISOString(),source:info,contractSha256:createHash('sha256').update(contractRaw).digest('hex'),testCodeSha256:Object.fromEntries(['harness.mjs',repo+'.mjs','contract.json'].map(file=>[file,createHash('sha256').update(fs.readFileSync(new URL('./'+file,import.meta.url))).digest('hex')])),selected:only||'ALL',mockOnly:true,physicalDeviceTested:false,realPaymentsTested:false,results,passed:results.filter(r=>r.status==='PASS').length,failed:results.filter(r=>r.status==='FAIL').length,errors:results.filter(r=>r.status==='ERROR').length,unrun:results.filter(r=>r.status==='UNRUN').length,controlFailures:results.flatMap(r=>r.assertions).filter(a=>a.kind==='control'&&!a.pass).length};
  const output=process.env.RESULTS_FILE||path.join(os.tmpdir(),name+'-'+Date.now()+'.json');fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(summary,null,2)+'\n');
  console.log(JSON.stringify({passed:summary.passed,failed:summary.failed,errors:summary.errors,unrun:summary.unrun,controlFailures:summary.controlFailures,output}));
  if(summary.failed||summary.errors)process.exitCode=1;
  return summary;
 }
 return {run,finish,info};
}
