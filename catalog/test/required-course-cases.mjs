import {seedStateFixture} from './fixture.mjs';
// Price probes simulate recipe verification only in private fixture copies.
export function seedPriceCatalog(api){const c=api.importLegacy(seedStateFixture({normalize:false}));for(const p of c.products){if(p.allergens.length){p.allergenVerified=true;p.allergenDataStatus='verified';}for(const option of p.choices)if(option.allergens.length)option.allergenVerified=true;}return c;}
export function requiredLines(c,menuId,quantity=1){
 const m=c.menus.find(m=>m.id===menuId),lines=[];
 const eligible=p=>p.allergenVerified&&p.routeId&&(!p.temperature.prompt||p.temperature.groupId)&&!p.chooseCount&&p.modifierGroupIds.every(id=>{const g=c.modifierGroups.find(g=>g.id===id);return g.min===0||g.kind==='temperature';});
 for(const id of m.sectionIds){const s=c.sections.find(s=>s.id===id),r=c.orderingRules.find(r=>r.id===s.orderingRuleId);const options=s.offeringIds.map(id=>c.offerings.find(o=>o.id===id));const chosen=r.automatic?options:options.filter(o=>eligible(c.products.find(p=>p.id===o.productId))).slice(0,r.min);if(chosen.length<r.min)throw Error('Fixture needs explicit supported selection '+s.name);for(const o of chosen)lines.push({offeringId:o.id,quantity,modifiers:c.products.find(p=>p.id===o.productId).modifierGroupIds.map(id=>c.modifierGroups.find(g=>g.id===id)).filter(g=>g.min>0).map(g=>({groupId:g.id,optionIds:g.options.slice(0,g.min).map(o=>o.id)}))});}
 return lines;
}

// Explicit price-test-only temperature assignments use existing BOH choices, not inferred recipes.
export function assignFixtureTemperatures(c){const ids={salmon:'mg_fish_temp',pork:'mg_meat_temp',steak:'mg_meat_temp'};for(const p of c.products)if(p.temperature.prompt&&!p.temperatureGroupId){const id=ids[p.temperature.prompt];if(!id)throw Error('Unknown fixture prompt');p.temperatureGroupId=id;p.temperature.groupId=id;if(!p.modifierGroupIds.includes(id))p.modifierGroupIds.push(id);}return c;}
