// Reviewed against tracked scalini-dining.js, not product-name substrings.
// These entries reconcile known legacy mmAttachTemps heuristic artifacts only.
export const reviewedTemperaturePolicies=Object.freeze({
 sf_m_forestiere:Object.freeze({askTemp:'salmon',groupId:'mg_fish_temp'}),
 sf_m_sole:Object.freeze({askTemp:'',groupId:null}),
 sf_m_genovese:Object.freeze({askTemp:'',groupId:null}),
 sf_w_salmon:Object.freeze({askTemp:'',groupId:null})
});
const promptGroups=Object.freeze({salmon:'mg_fish_temp',pork:'mg_meat_temp',steak:'mg_meat_temp'});
const heuristicIds=new Set(['mg_meat_temp','mg_fish_temp']);
const legacyIds=new Set(['mg_meat_temp','mg_fish_temp','mg_temp']);
export function reconcileTemperature(record,{sourceId,scope,groups,path}={}){
 const ids=[...(record.modGroupIds||[])],issues=[],changes=[];
 const isTemperature=id=>legacyIds.has(id)||groups.find(g=>g.id===id)?.kind==='temperature';
 const existing=ids.filter(isTemperature),explicit=record.temperatureGroupId||record.tempGroupId||null;
 const ask=record.askTemp||'',review=scope==='food'?reviewedTemperaturePolicies[sourceId]:null;
 let desired=null,basis='explicit modifier-group metadata';
 if(record.temperatureGroupId&&record.tempGroupId&&record.temperatureGroupId!==record.tempGroupId)issues.push('conflicting explicit temperature references');
 if(review){
  basis='reviewed stable product identity';desired=review.groupId;
  if(ask!==review.askTemp)issues.push('askTemp conflicts with reviewed stable-identity policy');
  if(explicit!==null&&explicit!==desired)issues.push('explicit temperature group conflicts with reviewed identity/askTemp');
  // Unknown/custom group links are not assumed to have come from the old heuristic.
  if(existing.some(id=>!heuristicIds.has(id)&&id!==desired))issues.push('custom/generic temperature group conflicts with reviewed identity');
 }else if(Object.hasOwn(promptGroups,ask)){
  basis='explicit askTemp token';desired=promptGroups[ask];
  if(explicit&&explicit!==desired||existing.some(id=>id!==desired))issues.push('temperature groups conflict with explicit askTemp');
 }else{
  desired=explicit||existing[0]||null;
  if(existing.length>1||explicit&&existing.some(id=>id!==explicit))issues.push('ambiguous temperature groups');
  if(ask&&!desired)issues.push('askTemp has no explicit supported temperature group');
 }
 if(desired&&!groups.some(g=>g.id===desired))issues.push('missing authentic temperature group '+desired);
 if(issues.length)return {groupId:explicit||existing[0]||null,modifierGroupIds:ids,issues:issues.map(issue=>path+': '+issue),changes};
 const resolved=ids.filter(id=>!isTemperature(id));if(desired&&!resolved.includes(desired))resolved.push(desired);
 if(JSON.stringify(ids)!==JSON.stringify(resolved)||explicit!==desired&&desired!==null)changes.push({kind:'temperature-reconciliation',path,sourceId,basis,originalGroupIds:existing,resolvedGroupId:desired,askTemp:ask});
 return {groupId:desired,modifierGroupIds:resolved,issues,changes};
}
