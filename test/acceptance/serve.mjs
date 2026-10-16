// Offline page builder + Playwright route. No listener; every non-local request is aborted and logged.
import fs from 'node:fs';import {resolve,relative} from 'node:path';import {pathToFileURL} from 'node:url';
const HERE=new URL('.',import.meta.url).pathname;
export const mockJs=fs.readFileSync(HERE+'mockfb.js','utf8');
export function transform(html,{seed={},extraHead=''}={}){
 const n0=html.length;
 html=html.replace(/<script[^>]*src="https:\/\/www\.gstatic\.com\/firebasejs[^"]*"><\/script>/g,'');
 html=html.replace(/<script[^>]*src="https:\/\/[^"]*"><\/script>/g,'');
 const swap='fbDb = createNamedFirestoreAdapter();';if(!html.includes(swap))throw Error('adapter boundary changed');
 html=html.replace(swap,'fbDb = window.__MOCK_DB__; /* review harness: in-memory mock */');
 const head=`<head><script>window.__MOCK_SEED__=${JSON.stringify(seed).replace(/</g,'\\u003c')};window.open=function(u){(window.__opened=window.__opened||[]).push(String(u));return null;};window.print=function(){window.__printed=(window.__printed||0)+1;};</script><script>${mockJs}</script>${extraHead}`;
 if(!html.includes('<head>'))throw Error('no head');
 return html.replace('<head>',head);
}
export async function launch(){const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));return chromium.launch({executablePath:process.env.CHROMIUM_PATH,headless:true,args:['--no-sandbox']});}
export async function openPage(browser,{root,html,origin}){
 const context=await browser.newContext({viewport:{width:1366,height:1024}}),page=await context.newPage(),errors=[],external=[],dialogs=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>{dialogs.push(d.type()+': '+d.message());d.type()==='prompt'?d.accept(page.__nextPrompt??''):d.accept();});
 await context.route('**/*',route=>{const url=new URL(route.request().url());if(url.origin!==origin){external.push(url.host);return route.abort();}
  if(url.pathname==='/index.html'||url.pathname==='/')return route.fulfill({body:html,contentType:'text/html; charset=utf-8'});
  const p=resolve(root,'.'+decodeURIComponent(url.pathname));if(relative(root,p).startsWith('..'))return route.abort();
  try{return route.fulfill({body:fs.readFileSync(p),contentType:p.endsWith('.css')?'text/css':p.endsWith('.png')?'image/png':p.endsWith('.json')?'application/json':'text/javascript; charset=utf-8'});}catch{return route.fulfill({status:404,body:''});}});
 await page.goto(origin+'/index.html');return {context,page,errors,external,dialogs};
}
