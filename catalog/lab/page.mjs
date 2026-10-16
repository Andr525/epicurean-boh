// Generates an opt-in fixture page from the REAL BOH application. Never serves index.html directly.
export function buildLabPage(html, fixture){
 const marker=html.indexOf('firebase-storage-compat.js');
 if(marker<0)throw Error('BOH backend boundary changed');
 const start=html.indexOf('<script>',marker);
 const end=html.indexOf('</script>',start);
 if(start<0||end<0)throw Error('BOH backend boundary changed');
 const helperStart=html.indexOf('function isDisplayablePhotoUrl',start);
 if(helperStart<start||helperStart>end)throw Error('BOH helper boundary changed');
 const helpers=html.slice(helperStart,end);
 html=html.slice(0,start)+'<script>var fbReady=false,fbDb=null;'+helpers+'</script>'+html.slice(end+9);
 html=html.replace(/<script\b[^>]*src=["']https?:[^>]*><\/script>/g,'').replace(/<link\b[^>]*href=["']https?:[^>]*>/g,'');
 html=html.replace(/var MASTER_CODE = '[^']*';/,"var MASTER_CODE = '5000';");
 html=html.replace('ensureScaliniDiningMenus();','/* lab: no seed resurrection */');
 html=html.replace(/if\(document.readyState==='loading'\)document.addEventListener\('DOMContentLoaded',boot\); else boot\(\);/,'/* controlled module bootstrap below */');
 html=html.replace('function lsGet(k, fb){',"function lsGet(k, fb){ k='epicurean.boh.fixture.'+k;");
 html=html.replace('function lsSet(k, v){',"function lsSet(k, v){ k='epicurean.boh.fixture.'+k;");
 const data=JSON.stringify(fixture).replace(/</g,'\\u003c');
 const security=`<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; font-src 'self'; object-src 'none'; frame-src 'none'; worker-src 'none'; form-action 'none'; base-uri 'none'">`;
 const pre=`<script>Object.defineProperty(window,'EPICUREAN_CATALOG_LAB',{value:Object.freeze({fixtureOnly:true})});window.BOH_FIXTURE=${data};window.fetch=()=>Promise.reject(Error('Lab network blocked'));window.XMLHttpRequest=function(){throw Error('Lab network blocked')};window.WebSocket=window.EventSource=function(){throw Error('Lab network blocked')};navigator.sendBeacon=()=>false;window.open=()=>null;document.addEventListener('click',e=>{const a=e.target.closest('a');if(a&&a.href&&!a.href.startsWith(location.origin))e.preventDefault()},true);</script>`;
 if(/firebaseConfig|firebaseapp\.com|gstatic\.com/.test(html))throw Error('Unexpected backend content in fixture page');
 return html.replace('<head>','<head>'+security+pre).replace('</body>','<script type="module" src="catalog/boh-integration.mjs"></script></body>');
}
