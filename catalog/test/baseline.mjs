// Reproduce defects against the immutable reviewed commit, without checking it out.
import {execFileSync} from 'node:child_process';
import {mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {authenticFixture,authenticStateFixture} from './fixture.mjs';
const dir=mkdtempSync(join(tmpdir(),'boh-reviewed-baseline-'));
try{
 for(const name of ['contract.mjs','legacy-adapter.mjs','publication.mjs'])writeFileSync(join(dir,name),execFileSync('git',['show','8e85e56:catalog/'+name]));
 const {importLegacy}=await import(pathToFileURL(join(dir,'legacy-adapter.mjs')));
 const {buildRelease,MemoryPublicationStore,publish,readRelease,project}=await import(pathToFileURL(join(dir,'publication.mjs')));
 const source=authenticFixture(),state=authenticStateFixture(),old=importLegacy(source),actual=importLegacy(state);
 const emptySource={menu:{books:[{id:'b',name:'Test',groupIds:['c']}],cats:[{id:'c',name:'Test'}],items:[{id:'p',name:'Test',catIds:['c'],price:1,station:'Bar',allergens:[],verified:false}],modGroups:[],taxRates:[]}};
 const empty=importLegacy(emptySource),store=new MemoryPublicationStore();await publish(empty,store);const r=await readRelease(store,store.pointer().releaseId);
 let signedRejected=false;try{const s=structuredClone(emptySource);s.menu.modGroups=[{id:'g',name:'Test',options:[{id:'o',name:'Test',up:-1}]}];await buildRelease(importLegacy(s));}catch{signedRejected=true;}
 empty.products[0].legacy.privateCost='PRIVATE_COST_SENTINEL';empty.products[0].operationalAvailability={eightySixed:true};const st=new MemoryPublicationStore();await publish(empty,st);const view=project(await readRelease(st,st.pointer().releaseId),{channel:'voice'});
 const findings={emptyUnverifiedIsOrderable:project(r).menus[0].sections[0].offerings[0].orderable,actualStateFoodMissing:!actual.products.some(p=>p.sourceId===state.menuItems[0].id),requiredChoicesHaveZeroMinimum:old.orderingRules.some(r=>r.kind==='selection'&&!r.automatic&&r.min===0),sharedDishDuplicated:old.products.filter(p=>p.sourceId===source.tastingMenus[0].courses[0].dishId).length>1,signedModifierRejected:signedRejected,voiceLeaksInternalCost:JSON.stringify(view).includes('PRIVATE_COST_SENTINEL'),unavailableProductStillOrderable:view.menus[0].sections[0].offerings[0].orderable};
 if(Object.values(findings).some(x=>x!==true))throw Error('Baseline finding did not reproduce '+JSON.stringify(findings));
 console.log(JSON.stringify({commit:'8e85e56',result:'7 defects reproduced',findings},null,2));
}finally{rmSync(dir,{recursive:true,force:true});}
