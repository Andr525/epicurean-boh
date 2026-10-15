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
export function sourceRecords(raw){
 const rows=[];
 const walk=(value,path)=>{if(Array.isArray(value)){value.forEach((v,i)=>{const p=path+'/'+i;rows.push(p);if(v&&typeof v==='object')walk(v,p);});}else if(value&&typeof value==='object')for(const [k,v]of Object.entries(value))if(v&&typeof v==='object')walk(v,path+'/'+k);};
 for(const [k,v]of Object.entries(raw)){if(k==='provenance')continue;if(k==='menuPhotos'||k==='photos'){for(const id of Object.keys(v||{}))rows.push('/'+k+'/'+id);}else {if(k==='voiceProfiles')for(const id of Object.keys(v?.profiles||{}))rows.push('/voiceProfiles/profiles/'+id);walk(v,'/'+k);}}
 return rows.sort();
}
