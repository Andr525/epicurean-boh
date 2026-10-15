import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {importLegacy,exportBohState} from '../legacy-adapter.mjs';
import {validate,copy,emptyCatalog,cents,addMenu,addSection,addOffering,removeMenu,removeSection,removeOffering} from '../contract.mjs';
import {MemoryPublicationStore,publish,readRelease,project,buildRelease} from '../publication.mjs';
import {calculatePrice} from '../pricing.mjs';
import {schema} from '../schema.mjs';
import {assertShape} from '../schema-validation.mjs';
import {authenticFixture,authenticStateFixture} from './fixture.mjs';
const release=async c=>{const store=new MemoryPublicationStore();const p=await publish(c,store);return readRelease(store,p.releaseId);};
function priced(){
 // Synthetic verification assertion is confined to these pricing tests; no authentic record is updated.
 const c=importLegacy(authenticStateFixture());const p=c.products[0];p.allergenVerified=true;p.allergenDataStatus='verified';return c;
}
function pkg(){const c=priced(),m=addMenu(c,{id:'package-test',name:'Simulated package',orderingRuleId:'fixed-price',basePriceCents:c.menus[0].sectionIds.length?8900:0});c.orderingRules.push({id:'one',kind:'selection',min:1,max:1,automatic:false,deferred:false},{id:'later',kind:'selection',min:1,max:1,automatic:false,deferred:true});const s=addSection(c,m.id,{id:'included',name:'Included',orderingRuleId:'one'}),later=addSection(c,m.id,{id:'later',name:'Later',orderingRuleId:'later'}),extra=addSection(c,m.id,{id:'extra',name:'Extra',pricing:'individual'});addOffering(c,s.id,{id:'included',productId:c.products[0].id,upchargeCents:200});addOffering(c,later.id,{id:'later',productId:c.products[0].id});addOffering(c,extra.id,{id:'extra',productId:c.products[0].id,priceCents:1000,upchargeCents:100});return c;}

test('R1: empty, false, missing or string verification never implies allergen safety',async()=>{
 for(const [allergens,verified]of [[[],undefined],[[],false],[[],true],[['Fish'],false],[['Fish'],undefined]]){
  const state=authenticStateFixture();state.menuItems[0].allergens=allergens;if(verified===undefined)delete state.menuItems[0].verified;else state.menuItems[0].verified=verified;
  const c=importLegacy(state),r=await release(c);assert.equal(c.products[0].allergenVerified,false);for(const channel of ['pos','voice','digital'])assert.equal(project(r,{channel}).menus[0].sections[0].offerings[0].orderable,false);
  const before=copy(c);assert.throws(()=>calculatePrice(r,{menuId:c.menus[0].id,lines:[{offeringId:c.offerings[0].id}]}),/Unverified/);assert.deepEqual(c,before);
 }
 const state=authenticStateFixture();state.menuItems[0].verified='true';assert.throws(()=>importLegacy(state),/boolean/);
});
test('R2: one price function handles packages, extras, upcharges, signed modifiers and quantity',async()=>{
 const c=pkg(),r=await release(c),lines=[{offeringId:'included',modifiers:[{groupId:'fixture-mod',optionIds:['credit']}]},{offeringId:'later'},{offeringId:'extra',quantity:2}];
 const q=calculatePrice(r,{menuId:'package-test',lines});assert.equal(q.packageBaseCents,8900);assert.equal(q.lines[0].modifierDeltaCents,-125);assert.equal(q.lines[0].totalCents,75);assert.equal(q.totalCents,11175);assert.equal(q.complete,true);
 const initial=calculatePrice(r,{menuId:'package-test',lines:[lines[0]],phase:'initial'});assert.deepEqual(initial.pendingSections,['later']);assert.throws(()=>calculatePrice(r,{menuId:'package-test',lines:[lines[0]]}),/Required section/);
 assert.throws(()=>calculatePrice(r,{menuId:'package-test',lines:[]}),/Required section/);
 assert.throws(()=>calculatePrice(r,{menuId:'package-test',lines:[...lines,{offeringId:'included'}]}),/Too many/);
 assert.throws(()=>calculatePrice(r,{menuId:'package-test',lines:[{offeringId:'included',modifiers:[{groupId:'unknown',optionIds:[]}]}]}),/not attached/);
 assert.equal(cents('-1.25',{signed:true}),-125);assert.throws(()=>cents('-1.25'));assert.throws(()=>cents('1.001'));
});
test('R2: inconsistent menu/section prices and unsafe modifier totals are rejected',async()=>{
 for(const mutate of [c=>c.menus[0].basePriceCents=100,c=>c.sections[0].pricing='included',c=>c.offerings[0].priceCents=null,c=>c.modifierGroups[0].options[0].priceDeltaCents=-0.5,c=>c.modifierGroups[0].options[0].priceDeltaCents=Number.MAX_SAFE_INTEGER+1]){const c=priced();mutate(c);assert.throws(()=>validate(c));}
 const c=priced();c.modifierGroups[0].options[0].priceDeltaCents=-10000;const r=await release(c);assert.throws(()=>calculatePrice(r,{menuId:c.menus[0].id,lines:[{offeringId:c.offerings[0].id,modifiers:[{groupId:'fixture-mod',optionIds:['credit']}]}]}),/line total/);
});
test('R3/4: actual STATE exporter covers catalog collections and excludes personal data',async()=>{
 const state=authenticStateFixture(),before=copy(state);state.staff=[{secret:'PRIVATE_STAFF'}];state.guests=[{secret:'PRIVATE_GUEST'}];state.sales=[{secret:'PRIVATE_SALES'}];
 const exported=exportBohState(state);assert(!JSON.stringify(exported).includes('PRIVATE_'));assert.deepEqual(exported,before);const c=importLegacy(exported);validate(c);
 for(const k of ['menuItems','menuCats','menuBooks','modGroups','taxRates','menuPhotos','retail','wineFlights','bar','wines'])assert(c.importReport.sourceRecords.some(r=>r.path.startsWith('/'+k+'/')));
 assert.equal(c.importReport.unresolved.length,0);assert(c.products.some(p=>p.id==='product/flight/fixture-flight'));assert.equal(c.modifierGroups[0].options[0].priceDeltaCents,-125);assert.equal(c.taxRules[0].ratePercent,8.875);assert.deepEqual((await release(c)).catalog.legacySnapshots[0].records,exported);
});
test('R4: orphan source records, missing references and unsupported fields block publication',async()=>{
 for(const mutate of [s=>s.menuItems[0].catIds=['missing'],s=>s.menuItems[0].catIds.push('missing'),s=>s.menuBooks[0].groupIds.push('missing'),s=>s.menuPhotos.orphan='https://example.org/lost.jpg',s=>s.wineFlights[0].wines=['missing']]){const s=authenticStateFixture();mutate(s);const c=importLegacy(s),store=new MemoryPublicationStore();await assert.rejects(publish(c,store),/Unresolved|missing products/);assert.equal(store.pointer().releaseId,null);}
 assert.throws(()=>exportBohState({...authenticStateFixture(),unknownCatalogRecords:[{id:'lost'}]}),/Unclassified/);
 const c=importLegacy(authenticStateFixture());c.importReport.sourceRecords.pop();assert.throws(()=>validate(c),/accounting incomplete/);
 const f=authenticFixture();f.prixFixeMenus[0].courseGroups[0].options=copy(f.prixFixeMenus[0].courseGroups[0].options);f.prixFixeMenus[0].courseGroups[0].options.push({...copy(f.prixFixeMenus[0].dishes[0]),id:'unplaced-mirror'});await assert.rejects(release(importLegacy(f)),/unplaced mirror/);
});
test('R5: one dish identity survives multiple books, prix fixe and tasting menus',async()=>{
 const f=authenticFixture(),c=importLegacy(f),id='product/food/'+f.tastingMenus[0].courses[0].dishId;assert.equal(c.products.filter(p=>p.id===id).length,1);const refs=c.offerings.filter(o=>o.productId===id);assert(refs.length>=2);assert(new Set(refs.map(o=>c.sections.find(s=>s.id===o.sectionId).menuId)).size>=2);
 const state=authenticStateFixture();state.menuBooks.push({...state.menuBooks[0],id:'second',name:'Second arbitrary menu'});const d=importLegacy(state);assert.equal(d.products.filter(p=>p.id==='product/food/'+state.menuItems[0].id).length,1);assert.equal(d.offerings.filter(o=>o.productId===d.products[0].id).length,2);await release(d);
});
test('R6: required prix-fixe and deferred dessert rules plus chooseCount are enforced',async()=>{
 const c=importLegacy(authenticFixture());for(const s of c.sections.filter(s=>s.pricing==='included')){const rule=c.orderingRules.find(r=>r.id===s.orderingRuleId);assert(rule.min>0);if(!rule.automatic)assert.equal(rule.min,1);}
 const tasting=c.menus.find(m=>m.id.startsWith('tasting/')),later=c.sections.find(s=>s.menuId===tasting.id&&c.orderingRules.find(r=>r.id===s.orderingRuleId).deferred&&s.name==='Dolce');assert(later);assert(later.offeringIds.length>0);
 const p=c.products.find(p=>p.chooseCount===3);assert(p);assert.equal(p.choices.length,6);const d=priced(),target=d.products[0];target.chooseCount=p.chooseCount;target.choices=copy(p.choices.filter(x=>x.allergens.length)).map(x=>({...x,allergenVerified:true}));const r=await release(d),line={offeringId:d.offerings[0].id};assert.throws(()=>calculatePrice(r,{menuId:d.menus[0].id,lines:[line]}),/chooseCount/);const quote=calculatePrice(r,{menuId:d.menus[0].id,lines:[{...line,choiceIds:target.choices.slice(0,3).map(x=>x.id)}]});assert(quote.complete);assert.throws(()=>calculatePrice(r,{menuId:d.menus[0].id,lines:[{...line,choiceIds:[target.choices[0].id,target.choices[0].id,target.choices[0].id]}]}),/chooseCount/);
});
test('R7: structured temperatures, aliases, dietary, fire timing and wine groupings survive',async()=>{
 const state=authenticStateFixture();state.menuItems[0].askTemp='Choose temperature';state.menuItems[0].temperatureGroupId='fixture-mod';state.menuItems[0].diet=['Source dietary statement'];state.menuItems[0].voiceKeyword='SOURCE';state.menuItems[0].voiceAliases=['source alias'];state.voiceProfiles={profiles:{a:{sourceId:state.menuItems[0].id,voiceKeyword:'OVERRIDE',voiceAliases:['owner alias'],active:true}}};
 const c=importLegacy(state),r=await release(c);for(const channel of ['pos','voice','digital']){const p=project(r,{channel}).menus[0].sections[0].offerings[0].product;assert.equal(p.temperature.groupId,'fixture-mod');assert.equal(p.temperature.prompt,'Choose temperature');assert.deepEqual(p.dietary,state.menuItems[0].diet);assert.equal(p.voiceKeyword,'OVERRIDE');assert.deepEqual(p.voiceAliases,['owner alias']);}
 const a=importLegacy(authenticFixture());assert(a.sections.some(s=>s.fireTiming.fireAfter==='meat'));assert(a.products.some(p=>p.displayMetadata.group==='Sparkling'));assert(c.products.find(p=>p.id==='product/flight/fixture-flight').wineComponents.length===1);
});
test('R8: voice/digital projections cannot leak costs, raw availability, legacy or arbitrary metadata',async()=>{
 const s=authenticStateFixture();s.menuItems[0].cost=98765;s.menuItems[0].privateMemo='PRIVATE_COST_NOTE';s.modGroups[0].privateMemo='PRIVATE_MOD';s.taxRates[0].privateMemo='PRIVATE_TAX';s.menuBooks[0].privateMemo='PRIVATE_BOOK';const c=importLegacy(s);c.menus[0].metadata.cost='PRIVATE_MENU';c.sections[0].metadata.cost='PRIVATE_SECTION';const r=await release(c);
 for(const channel of ['voice','digital']){const text=JSON.stringify(project(r,{channel}));for(const secret of ['98765','PRIVATE_','legacy','ozOnHand','importReport'])assert(!text.includes(secret),channel+' leaked '+secret);assert(!('routes'in project(r,{channel})));}
});
test('R8/12: media URLs and projection field types fail closed at publication boundary',async()=>{
 for(const mutate of [c=>c.products[0].photos=['javascript:alert(1)'],c=>c.products[0].photos=['data:image/svg+xml,test'],c=>c.products[0].photos=['https://user:pass@example.org/x'],c=>c.products[0].voiceAliases=[{cost:1}],c=>c.products[0].displayMetadata.producer={cost:1},c=>c.products[0].translations.en={name:'x',cost:1},c=>c.products[0].allergens=[12],c=>c.products[0].description={cost:1},c=>c.offerings[0].cost=1]){const c=priced();mutate(c);await assert.rejects(release(c));}
});
test('R9: 86/stock/inactive availability blocked in projections and direct pricing, without mutation',async()=>{
 for(const mutate of [p=>p.availability.eightySixed=true,p=>p.availability.available=false,p=>p.availability.active=false,p=>p.availability.stock=0,p=>p.availability.ozOnHand=0]){const c=priced();mutate(c.products[0]);const r=await release(c),before=copy(r);for(const channel of ['pos','voice','digital'])assert.equal(project(r,{channel}).menus[0].sections[0].offerings.length,0);assert.throws(()=>calculatePrice(r,{menuId:c.menus[0].id,lines:[{offeringId:c.offerings[0].id}]}),/unavailable/);assert.deepEqual(r,before);}
 const c=pkg(),store=new MemoryPublicationStore();await publish(c,store);const before=store.pointer();c.products[0].availability.eightySixed=true;await assert.rejects(publish(c,store),/unsatisfiable/);assert.deepEqual(store.pointer(),before);
});
test('R9: schedule-dependent required section is explicitly non-orderable, never silently satisfied',async()=>{
 const c=pkg();c.availabilityPolicies.push({id:'window',timezone:'America/New_York',windows:[{days:[3],start:'10:00',end:'11:00'}]});c.offerings.find(o=>o.id==='included').availabilityPolicyId='window';const r=await release(c),at=new Date('2026-10-14T15:00:00Z');const m=project(r,{at}).menus.find(m=>m.id==='package-test');assert.equal(m.orderable,false);assert.equal(m.sections[0].satisfiable,false);assert.throws(()=>calculatePrice(r,{menuId:m.id,lines:[{offeringId:'included'},{offeringId:'later'}],at}),/unavailable/);
});
test('R10: editing/deletion retains immutable source evidence and rejects required-section damage',async()=>{
 const c=importLegacy(authenticStateFixture()),source=copy(c.legacySnapshots);removeOffering(c,c.offerings[0].id);validate(c);removeSection(c,c.sections[0].id);validate(c);removeMenu(c,c.menus[0].id);validate(c);assert.deepEqual(c.legacySnapshots,source);const r=await release(c);assert(!r.catalog.menus.some(m=>m.id==='book/fixture-book'));
 const d=pkg();removeOffering(d,'included');assert.throws(()=>validate(d),/unsatisfiable/);
});
test('R12: schema artifact equals runtime schema; independent Draft 2020-12 validator agrees on shapes',async()=>{
 const disk=JSON.parse(readFileSync(new URL('../schema.json',import.meta.url)));assert.deepEqual(disk,schema);
 const c=priced(),built=await buildRelease(c),cases=[{definition:'Catalog',value:c,valid:true},{definition:'Release',value:built,valid:true}];
 for(const mutate of [x=>x.products[0].voiceAliases=[{}],x=>x.offerings[0].priceCents=1.2,x=>x.modifierGroups[0].options[0].priceDeltaCents=-125,x=>delete x.products[0].allergenVerified,x=>x.products[0].photos=['javascript:alert(1)'],x=>x.products[0].photos=['https://user:pass@example.org/x']]){const value=copy(c);mutate(value);let valid=true;try{assertShape(value);}catch{valid=false;}cases.push({definition:'Catalog',value,valid});}
 const code=`import sys,json\nfrom jsonschema import Draft202012Validator,FormatChecker\nfrom urllib.parse import urlsplit\nf=FormatChecker()\n@f.checks('media-url',raises=ValueError)\ndef media_url(value):\n if not isinstance(value,str):return True\n u=urlsplit(value);p=u.port\n return u.scheme=='https' and bool(u.hostname) and u.username is None and u.password is None\ns=json.load(open('catalog/schema.json'));Draft202012Validator.check_schema(s)\nfor c in json.load(sys.stdin):\n t={**s,'oneOf':[{'$ref':'#/$defs/'+c['definition']}]};v=Draft202012Validator(t,format_checker=f);ok=not list(v.iter_errors(c['value']));assert ok==c['valid'],c['definition']\nprint('Independent schema parity: '+str(8)+' cases PASS')`;
 const result=spawnSync('python',['-c',code],{input:JSON.stringify(cases),encoding:'utf8'});assert.equal(result.status,0,result.stderr);assert.match(result.stdout,/PASS/);
});

test('R1/R7: ingredient modifiers retain allergens and cannot use unknown/empty verification',async()=>{
 const c=priced(),g=c.modifierGroups[0];g.kind='ingredient';g.options[0].allergens=['Dairy'];g.options[0].allergenVerified=false;let r=await release(c);const request={menuId:c.menus[0].id,lines:[{offeringId:c.offerings[0].id,modifiers:[{groupId:g.id,optionIds:['credit']}]}]};assert.throws(()=>calculatePrice(r,request),/Unverified modifier/);g.min=1;r=await release(c);assert.equal(project(r).menus[0].sections[0].offerings[0].orderable,false);g.options[0].allergenVerified=true;r=await release(c);assert.equal(calculatePrice(r,request).lines[0].modifierDeltaCents,-125);for(const channel of ['voice','digital'])assert.deepEqual(project(r,{channel}).modifierGroups[0].options[0].allergens,['Dairy']);g.options[0].allergens=[];assert.throws(()=>validate(c),/Empty modifier/);
});
