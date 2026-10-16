import test from 'node:test';import assert from 'node:assert/strict';
import {seedStateFixture} from './fixture.mjs';import {importLegacy} from '../legacy-adapter.mjs';import {validate,copy} from '../contract.mjs';import {reconcileTemperature} from '../temperature-policy.mjs';import {MemoryPublicationStore,publish,readRelease,project} from '../publication.mjs';
const expected={sf_m_forestiere:'mg_fish_temp',sf_m_sole:null,sf_m_genovese:null,sf_w_salmon:null};
test('Reviewed stable identities reconcile actual normalized Scalini temperatures without changing original STATE',async()=>{
 const source=seedStateFixture(),before=copy(source),c=importLegacy(source);assert.deepEqual(c.importReport.unresolved,[]);validate(c);
 for(const [id,group]of Object.entries(expected)){const p=c.products.find(p=>p.sourceId===id);assert(p);assert.equal(p.temperatureGroupId,group);assert.equal(p.temperature.groupId,group);assert.deepEqual(p.modifierGroupIds.filter(id=>['mg_meat_temp','mg_fish_temp','mg_temp'].includes(id)),group?[group]:[]);}
 const store=new MemoryPublicationStore();await publish(c,store);const loaded=await readRelease(store,store.pointer().releaseId);for(const channel of ['pos','voice','digital']){const offerings=project(loaded,{channel}).menus.flatMap(m=>m.sections).flatMap(s=>s.offerings);for(const [id,group]of Object.entries(expected)){const refs=offerings.filter(o=>o.product.sourceId===id);assert(refs.length);for(const o of refs)assert.equal(o.product.temperatureGroupId,group);}}
 assert.deepEqual(source,before);assert.deepEqual(loaded.catalog.legacySnapshots[0].records,before);assert(c.provenance.some(p=>p.kind==='temperature-reconciliation'&&p.sourceId==='sf_m_sole'&&p.resolvedGroupId===null));
});
test('Temperature policy never uses names: stable IDs and explicit metadata survive renaming',()=>{
 const groups=seedStateFixture().modGroups;
 const resolved=(record,sourceId,scope='food')=>reconcileTemperature(record,{groups,sourceId,scope,path:'/fixture'});
 assert.equal(resolved({name:'Filet salmon steak',askTemp:'',modGroupIds:[]},'new-owner-product').groupId,null);
 assert.equal(resolved({name:'Soup',askTemp:'salmon',modGroupIds:['mg_meat_temp','mg_fish_temp']},'sf_m_forestiere').groupId,'mg_fish_temp');
 assert.equal(resolved({name:'Soup',askTemp:'pork',modGroupIds:[]},'new-owner-product').groupId,'mg_meat_temp');
 assert.equal(resolved({name:'Filet salmon',askTemp:'',modGroupIds:['mg_meat_temp']},'sf_m_sole').groupId,null);
 // Explicit source links without an askTemp prompt remain explicit configuration, not name guesses.
 assert.equal(resolved({name:'Changed label',modGroupIds:['mg_meat_temp']},'m3').groupId,'mg_meat_temp');
});
test('Contradictory temperature metadata or absent authentic choices block publication',async()=>{
 for(const patch of [
  s=>s.prixFixeMenus[0].dishes.find(d=>d.id==='sf_m_forestiere').temperatureGroupId='mg_meat_temp',
  s=>s.prixFixeMenus[0].dishes.find(d=>d.id==='sf_m_forestiere').askTemp='steak',
  s=>s.prixFixeMenus[0].dishes.find(d=>d.id==='sf_m_sole').askTemp='salmon',
  s=>s.modGroups=s.modGroups.filter(g=>g.id!=='mg_fish_temp')
 ]){const source=seedStateFixture();patch(source);const before=copy(source),c=importLegacy(source);assert(c.importReport.unresolved.some(r=>/temperature|askTemp/.test(r)));const store=new MemoryPublicationStore();await assert.rejects(publish(c,store),/Unresolved|missing modifierGroups/);assert.equal(store.pointer().releaseId,null);assert.deepEqual(source,before);}
 const groups=seedStateFixture().modGroups;const unknown=reconcileTemperature({name:'Filet',askTemp:'unmapped prompt',modGroupIds:[]},{groups,sourceId:'unknown',scope:'food',path:'/unknown'});assert(unknown.issues.some(i=>i.includes('no explicit supported')));
 const generic=reconcileTemperature({askTemp:'',modGroupIds:['mg_temp']},{groups,sourceId:'sf_m_sole',scope:'food',path:'/reviewed'});assert(generic.issues.some(i=>i.includes('conflict')));
 const conflict=reconcileTemperature({askTemp:'salmon',modGroupIds:['mg_meat_temp']},{groups,sourceId:'unreviewed-id',scope:'food',path:'/unknown'});assert(conflict.issues.some(i=>i.includes('conflict')));assert.deepEqual(conflict.modifierGroupIds,['mg_meat_temp']);
});
