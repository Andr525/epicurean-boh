// Four fixed review findings. Expected behavior is correct business behavior, NOT the known defect.
import fs from 'node:fs';import {fileURLToPath} from 'node:url';
import {suite,clone} from './harness.mjs';
const root=process.env.BOH_ROOT||fileURLToPath(new URL('../../../',import.meta.url));
const baseline='0cb055830ca6551f4e435d93bfe597af9150fc1d';
const established=JSON.parse(fs.readFileSync(new URL('../fixtures/established-cloud.json',import.meta.url)));
const s=await suite({name:'phase0-boh-regression-targets',root,baseline,ids:['B01','B02','B03','I01']});
const seeded=()=>clone(established);
const db=p=>p.evaluate(()=>__MOCK_DB__.__dump());
async function publish(p){return p.evaluate(async()=>{try{return {ok:await publishMenusToFrontOfHouse()};}catch(e){return {ok:false,error:e.message};}});}
async function resetModifier(p){
 await p.evaluate(async()=>{
  const menu=JSON.parse(JSON.stringify(__MOCK_DB__.__dump().boh_shared.menu));
  menu.modGroups=menu.modGroups.filter(g=>g.id!=='review-modifier');
  menu.modGroups.push({id:'review-modifier',name:'MOCK regression modifier',required:false,multi:true,options:[{id:'review-a',name:'MOCK first',up:1.5,allergens:['Fish'],verified:true},{id:'review-b',name:'MOCK second',up:2,allergens:['Tree Nut'],verified:true}]});
  __MOCK_DB__.__rawSet('boh_shared','menu',menu);await syncFromCloud();go('menu');mmSelect('mod','review-modifier');
 });
}
await s.run('B01','Startup loads cloud flights/settings before allowing edits; retry preserves pending work',async({open,check,waitIdle})=>{
 const source=seeded();source.boh_shared.wine_flights={list:[{id:'review-cloud-flight',name:'MOCK existing flight',price:12,wines:[]}],updatedAt:1};
 source.boh_shared.payroll_settings={settings:{federalPct:17.25,statePct:5,ssPct:6.2,medicarePct:1.45,otherAmt:0,otMultiplier:1.5,otThreshold:40},updatedAt:1};
 const o=await open(source,{login:'boh'}),p=o.page;
 check('control: established menu price remains authoritative',await p.evaluate(()=>STATE.menuItems.find(i=>i.id==='m2').price),99,{control:true});
 check('startup loads every existing flight',await p.evaluate(()=>STATE.wineFlights.map(f=>f.id)),['review-cloud-flight']);
 check('startup loads cloud payroll fields',await p.evaluate(()=>payrollSettings().federalPct),17.25);
 await p.evaluate(()=>mmAddWineFlight());await waitIdle(p);
 const after=await db(p);check('adding a flight retains existing cloud flight',after.boh_shared.wine_flights.list.some(f=>f.id==='review-cloud-flight'),true);
 check('adding one flight preserves both records exactly once',after.boh_shared.wine_flights.list.length,2);
 await p.evaluate(()=>go('payroll_settings'));await p.locator('#set-state').fill('9.25');await p.getByRole('button',{name:'Save Settings',exact:true}).click();await waitIdle(p);
 check('editing State percentage retains untouched Federal percentage',(await db(p)).boh_shared.payroll_settings.settings.federalPct,17.25);
 check('control: requested payroll field is saved',(await db(p)).boh_shared.payroll_settings.settings.statePct,9.25,{control:true});
 const failed=await open(source,{login:'boh',failedReads:true}),q=failed.page;
 await q.evaluate(()=>{STATE.wineFlights.push({id:'review-pending',name:'MOCK offline draft',price:12,wines:[]});fbSetDoc('boh_shared','wine_flights',{list:STATE.wineFlights});});await waitIdle(q);
 check('control: failed startup cannot overwrite cloud flights',(await db(q)).boh_shared.wine_flights.list.map(f=>f.id),['review-cloud-flight'],{control:true});
 await q.evaluate(async()=>{window.__MOCK_FAIL_READS__=false;await retryCloudSync();});await waitIdle(q);
 check('retry applies the existing cloud flight to STATE',await q.evaluate(()=>STATE.wineFlights.some(f=>f.id==='review-cloud-flight')),true);
 check('offline draft remains available for reconciliation',await q.evaluate(()=>JSON.stringify(pendingEdits()).includes('review-pending')),true);
 // A new device observes both records; its later edit must not erase the first device's additions.
 const fresh=await open(after,{login:'boh'});check('second device loads the complete published flight list',await fresh.page.evaluate(()=>STATE.wineFlights.map(f=>f.id).sort()),after.boh_shared.wine_flights.list.map(f=>f.id).sort());
});
await s.run('B02','Explicitly empty published prix-fixe/tasting menus stay empty through startup, publish and retry',async({open,check,waitIdle})=>{
 const normal=await open(seeded(),{login:'boh'});
 check('control: ordinary published prix-fixe menu survives',await normal.page.evaluate(()=>STATE.prixFixeMenus.some(m=>m.id==='pf_scalini_89')),true,{control:true});
 check('control: ordinary published tasting menu survives',await normal.page.evaluate(()=>STATE.tastingMenus.some(m=>m.id==='tm_scalini_128')),true,{control:true});
 const empty=seeded();empty.boh_shared.prix_fixe_menus={list:[],updatedAt:2};empty.boh_shared.tasting_menus={list:[],updatedAt:2};
 for(const recovery of [false,true]){
  const o=await open(empty,{login:'boh',failedReads:recovery}),p=o.page;
  if(recovery){check('control: failed reads leave empty cloud documents untouched',[(await db(p)).boh_shared.prix_fixe_menus.list.length,(await db(p)).boh_shared.tasting_menus.list.length],[0,0],{control:true});await p.evaluate(async()=>{window.__MOCK_FAIL_READS__=false;await retryCloudSync();});await waitIdle(p);}
  const label=recovery?'retry':'startup';const before=await db(p);
  check(label+': cloud lists remain intentionally empty',[before.boh_shared.prix_fixe_menus.list,before.boh_shared.tasting_menus.list],[[],[]]);
  check(label+': UI state does not resurrect bundled dishes',await p.evaluate(()=>[STATE.prixFixeMenus.length,STATE.tastingMenus.length]),[0,0]);
  check(label+': no automatic publication of these documents',await p.evaluate(()=>__MOCK_DB__.log.filter(r=>r.c==='boh_shared'&&['prix_fixe_menus','tasting_menus'].includes(r.id)&&r.op!=='raw-other-device').length),0);
  await publish(p);await waitIdle(p);const after=await db(p);
  check(label+': explicit Publish preserves empty owner intent',[after.boh_shared.prix_fixe_menus.list,after.boh_shared.tasting_menus.list],[[],[]]);
 }
 const second=await open(empty,{login:'boh'});check('a second device also sees empty menus',await second.page.evaluate(()=>[STATE.prixFixeMenus.length,STATE.tastingMenus.length]),[0,0]);
});
await s.run('B03','Modifier validation rejects destructive/malformed edits and preserves valid identities, signed cents and allergens',async({open,check,waitIdle})=>{
 const {page:p}=await open(seeded(),{login:'boh'});await resetModifier(p);
 const original=(await db(p)).boh_shared.menu.modGroups.find(g=>g.id==='review-modifier');
 await p.locator('.mopt-name').first().fill('');await p.evaluate(()=>mmSaveModFromForm('review-modifier',false));await waitIdle(p);
 check('blanking a name does not delete its option identity',await p.evaluate(()=>STATE.modGroups.find(g=>g.id==='review-modifier').options.some(o=>o.id==='review-a')),true);
 check('blank name edit cannot change the published group',(await db(p)).boh_shared.menu.modGroups.find(g=>g.id==='review-modifier'),original);
 await resetModifier(p);await p.locator('.mopt-up').first().fill('');await p.evaluate(()=>mmSaveModFromForm('review-modifier',false));await waitIdle(p);
 check('blank price edit cannot turn the published $1.50 delta into zero',(await db(p)).boh_shared.menu.modGroups.find(g=>g.id==='review-modifier').options[0].up,1.5);
 // Direct publish boundary must reject bad STATE as well as invalid form input.
 const invalid=[['nonnumeric price','up','not money'],['null price','up',null],['fractional cent','up',1.234],['non-list allergens','allergens','Fish'],['non-string allergen','allergens',[{name:'Fish'}]],['empty allergen label','allergens',['']]];
 for(const [label,key,value]of invalid){
  await resetModifier(p);await p.evaluate(([key,value])=>{const o=STATE.modGroups.find(g=>g.id==='review-modifier').options[0];o[key]=value;},[key,value]);
  const before=(await db(p)).boh_shared.menu;const result=await publish(p);await waitIdle(p);
  check(label+': publish must report rejection',result.ok,false);
  check(label+': last valid published menu remains unchanged',(await db(p)).boh_shared.menu,before);
 }
 await resetModifier(p);await p.locator('.mopt-up').first().fill('-1.50');await p.evaluate(()=>mmSaveModFromForm('review-modifier',false));await waitIdle(p);
 const signed=(await db(p)).boh_shared.menu.modGroups.find(g=>g.id==='review-modifier').options[0];
 check('control: explicit signed dollar delta preserves exact cents',{id:signed.id,up:signed.up,allergens:signed.allergens},{id:'review-a',up:-1.5,allergens:['Fish']},{control:true});
 await resetModifier(p);await p.evaluate(()=>mmDropModOpt('review-modifier','review-a'));await waitIdle(p);
 const left=(await db(p)).boh_shared.menu.modGroups.find(g=>g.id==='review-modifier').options;
 check('control: explicit Delete removes only the chosen identity',left.map(o=>({id:o.id,up:o.up,allergens:o.allergens})),[{id:'review-b',up:2,allergens:['Tree Nut']}],{control:true});
 const fresh=await open(await db(p),{login:'boh'});check('control: legitimate deletion persists on a second device',await fresh.page.evaluate(()=>STATE.modGroups.find(g=>g.id==='review-modifier').options.map(o=>o.id)),['review-b'],{control:true});
});
await s.run('I01','Post-write observations never authorize a later stale overwrite; refusal retains a recoverable edit',async({open,check,waitIdle})=>{
 const {page:p}=await open(seeded(),{login:'boh'});
 // Instrument only MOCK transport. Insert another device's edit after our commit, before our confirmation read.
 await p.evaluate(()=>{
  const original=__MOCK_DB__.collection.bind(__MOCK_DB__);window.__reviewInjectionCount=0;
  __MOCK_DB__.collection=function(name){const c=original(name);if(name!=='boh_shared')return c;const doc=c.doc;c.doc=function(id){const ref=doc(id);if(id==='menu'){const set=ref.set;ref.set=function(data,opts){return set(data,opts).then(()=>{if(!window.__reviewInjectionCount){window.__reviewInjectionCount++;const remote=JSON.parse(JSON.stringify(__MOCK_DB__.__dump().boh_shared.menu));remote.items.find(i=>i.id==='m2').price=77;__MOCK_DB__.__rawSet('boh_shared','menu',remote);}});};}return ref;};return c;};
  STATE.menuItems.find(i=>i.id==='m1').price=21;
 });
 await p.evaluate(()=>saveMenu());await waitIdle(p);
 check('control: deterministic other-device write was injected once',await p.evaluate(()=>window.__reviewInjectionCount),1,{control:true});
 check('control: first commit did not prevent the remote edit',(await db(p)).boh_shared.menu.items.find(i=>i.id==='m2').price,77,{control:true});
 const stale=await p.evaluate(()=>STATE.menuItems.find(i=>i.id==='m2').price!==77);
 const result=await p.evaluate(async()=>{STATE.menuItems.find(i=>i.id==='m1').price=22;return saveMenu();});await waitIdle(p);
 check('second edit cannot erase the observed remote $77 price',(await db(p)).boh_shared.menu.items.find(i=>i.id==='m2').price,77);
 if(stale){check('unrebased stale state must be refused',result,false);check('refused local edit is retained for review',await p.evaluate(()=>JSON.stringify(pendingEdits()).includes('"price":22')),true);}
 else check('rebased STATE retains the remote value before publishing',await p.evaluate(()=>STATE.menuItems.find(i=>i.id==='m2').price),77);
 // Reconciliation after an ordinary conflict must adopt cloud without silently discarding the saved local copy.
 const {page:q}=await open(seeded(),{login:'boh'});
 await q.evaluate(async()=>{const remote=JSON.parse(JSON.stringify(__MOCK_DB__.__dump().boh_shared.menu));remote.items.find(i=>i.id==='m2').price=66;__MOCK_DB__.__rawSet('boh_shared','menu',remote);STATE.menuItems.find(i=>i.id==='m1').price=23;await saveMenu();});await waitIdle(q);
 check('control: ordinary stale write is refused',(await db(q)).boh_shared.menu.items.find(i=>i.id==='m2').price,66,{control:true});
 await q.evaluate(()=>keepCloudVersion('boh_shared/menu'));await waitIdle(q);
 check('control: reconciliation adopts the current cloud value',await q.evaluate(()=>STATE.menuItems.find(i=>i.id==='m2').price),66,{control:true});
 check('control: superseded local copy is archived',await q.evaluate(()=>JSON.stringify(lsGet('eh_archived_local_edits',[])).includes('"price":23')),true,{control:true});
});
await s.finish();
