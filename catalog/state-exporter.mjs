const copy=x=>JSON.parse(JSON.stringify(x));
export const catalogKeys=['menuItems','menuCats','menuBooks','modGroups','taxRates','menuPhotos','retail','wineFlights','bar','wines','prixFixeMenus','tastingMenus','dailySpecials','ingredients','voiceProfiles','voiceActiveRevision','retiredVins','retiredLins','cellarVer'];
const nonCatalog=new Set(['staff','punches','guests','rooms','roomObjs','stations','sales']);
// Pure, explicitly invoked export. Never reads globals/storage or runs seeds.
export function exportBohState(state){
 if(!state||typeof state!=='object'||Array.isArray(state))throw Error('Expected BOH STATE object');
 const unknown=Object.keys(state).filter(k=>!catalogKeys.includes(k)&&!nonCatalog.has(k)&&k!=='provenance');
 if(unknown.length)throw Error('Unclassified STATE fields: '+unknown.join(', '));
 const out={};for(const k of catalogKeys)if(k in state)out[k]=copy(state[k]);
 if(state.provenance)out.provenance=copy(state.provenance);
 return out;
}
export function sourceRecords(raw){const paths=[];const visit=(v,path)=>{paths.push(path);if(v&&typeof v==='object')for(const [k,value]of Object.entries(v))visit(value,path+'/'+k);};for(const [k,v]of Object.entries(raw))if(k!=='provenance')visit(v,'/'+k);return paths.sort();}
