// Repeatable offline verification; no listener, backend, installs or paid services.
import {spawnSync} from 'node:child_process';import fs from 'node:fs';import {resolve} from 'node:path';
const root=resolve(new URL('../..',import.meta.url).pathname),dir=root+'/catalog/evidence/milestone2';fs.mkdirSync(dir,{recursive:true});
const tests=fs.readdirSync(root+'/catalog/test').filter(f=>f.endsWith('.test.mjs')).map(f=>'catalog/test/'+f);
const tasks=[['contracts',['--test',...tests]],['pilot-browser',['catalog/test/browser.mjs']],...Array.from({length:3},(_,i)=>['boh-browser-'+(i+1),['catalog/test/boh-interface-browser.mjs']])];let failed=false;const batch=new Date().toISOString().replaceAll(':','-');
for(const [name,args]of tasks){const start=Date.now(),run=spawnSync(process.execPath,args,{cwd:root,env:process.env,encoding:'utf8',timeout:180000,maxBuffer:2e6});const result={batch,name,log:name+'-'+batch+'.log',result:run.status===0?'PASS':'FAIL',exitCode:run.status,durationMs:Date.now()-start,error:run.error?.message||null};fs.writeFileSync(dir+'/'+result.log,(run.stdout||'')+(run.stderr||''));fs.appendFileSync(dir+'/runs.jsonl',JSON.stringify(result)+'\n');console.log(JSON.stringify(result));if(run.status!==0)failed=true;}
if(failed)process.exitCode=1;
