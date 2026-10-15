import {validate,productAvailable} from './contract.mjs';
const integer=(n,min=0)=>Number.isSafeInteger(n)&&n>=min;
// A quote is not permission to SEND/FIRE. No mutation or transport is performed.
// Package base is charged once per package quantity; included lines contribute only
// upcharges and selected signed modifier deltas. Individual sections add their prices.
export function calculatePrice(release,{menuId,lines,packageQuantity=1,phase='complete',at=new Date()}={}){
 const c=validate(release.catalog),m=c.menus.find(m=>m.id===menuId);
 if(!m||!m.active||!integer(packageQuantity,1)||!Array.isArray(lines)||!['initial','complete'].includes(phase))throw Error('Invalid price request');
 if(!policyAvailable(c,m.availabilityPolicyId,at))throw Error('Menu unavailable');
 const fixed=c.orderingRules.find(r=>r.id===m.orderingRuleId).kind==='fixed-price';
 if(!fixed&&packageQuantity!==1)throw Error('Package quantity on individual menu');
 const counts=new Map(),quoted=[];
 for(const line of lines){
  const o=c.offerings.find(o=>o.id===line.offeringId),s=c.sections.find(s=>s.id===o?.sectionId),p=c.products.find(p=>p.id===o?.productId),q=line.quantity??1;
  if(!o||s?.menuId!==m.id||!o.active||!productAvailable(p,at)||!policyAvailable(c,o.availabilityPolicyId,at)||!integer(q,1))throw Error('Offering unavailable or invalid quantity');
  if(p.wineComponents.some(w=>{const component=c.products.find(p=>p.id===w.productId);return !component||!productAvailable(component,at)||!component.allergenVerified;}))throw Error('Flight component unavailable or unverified');
  if(!productOrderable(c,p,at))throw Error('Unverified allergens or missing routing; not orderable');
  counts.set(s.id,(counts.get(s.id)||0)+q);
  const selections=line.modifiers||[];if(!Array.isArray(selections))throw Error('Invalid modifier selections');
  if(new Set(selections.map(x=>x.groupId)).size!==selections.length)throw Error('Duplicate modifier group');
  let modifier=0;
  for(const selection of selections)if(!p.modifierGroupIds.includes(selection.groupId))throw Error('Modifier not attached to product');
  for(const id of p.modifierGroupIds){const g=c.modifierGroups.find(g=>g.id===id),picks=selections.find(x=>x.groupId===id)?.optionIds||[];if(!Array.isArray(picks)||new Set(picks).size!==picks.length||picks.length<g.min||picks.length>g.max)throw Error('Invalid modifier bounds');for(const id of picks){const option=g.options.find(x=>x.id===id);if(!option)throw Error('Unknown modifier');if(['ingredient','unknown'].includes(g.kind)&&!option.allergenVerified)throw Error('Unverified modifier allergens');modifier+=option.priceDeltaCents;}}
  const choices=line.choiceIds||[];if(!Array.isArray(choices)||choices.length!==p.chooseCount||new Set(choices).size!==choices.length)throw Error('Required chooseCount not satisfied');
  for(const id of choices){const option=p.choices.find(x=>x.id===id);if(!option||!option.allergenVerified)throw Error('Unknown/unverified product choice');}
  const base=s.pricing==='included'?0:o.priceCents,unit=base+o.upchargeCents+modifier;
  if(!Number.isSafeInteger(unit)||s.pricing==='individual'&&unit<0)throw Error('Invalid line total');
  const total=unit*q;if(!Number.isSafeInteger(total))throw Error('Unsafe line total');
  quoted.push({offeringId:o.id,productId:p.id,sectionId:s.id,quantity:q,basePriceCents:base,upchargeCents:o.upchargeCents,modifierDeltaCents:modifier,unitPriceCents:unit,totalCents:total});
 }
 const pendingSections=[];
 for(const id of m.sectionIds){const s=c.sections.find(s=>s.id===id),r=c.orderingRules.find(r=>r.id===s.orderingRuleId),n=counts.get(id)||0,min=r.min*(fixed?packageQuantity:1),max=r.max===null?Infinity:r.max*(fixed?packageQuantity:1);if(n>max)throw Error('Too many selections '+id);if(n<min){if(phase==='initial'&&r.deferred)pendingSections.push(id);else throw Error('Required section selection '+id);}}
 const packageBaseCents=fixed?m.basePriceCents*packageQuantity:0,totalCents=packageBaseCents+quoted.reduce((n,l)=>n+l.totalCents,0);
 if(!integer(totalCents)||!integer(packageBaseCents))throw Error('Invalid package total');
 return Object.freeze({releaseId:release.releaseId,currency:c.currency,menuId,packageQuantity,packageBaseCents,lines:Object.freeze(quoted.map(Object.freeze)),totalCents,pendingSections,complete:pendingSections.length===0});
}
export function policyAvailable(c,id,at){const policy=c.availabilityPolicies.find(p=>p.id===id);if(!policy)return true;const parts=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:policy.timezone,weekday:'short',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(at).map(p=>[p.type,p.value]));const day=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(parts.weekday),time=parts.hour+':'+parts.minute;return policy.windows.some(w=>w.start<w.end?w.days.includes(day)&&time>=w.start&&time<w.end:(w.days.includes(day)&&time>=w.start||w.days.includes((day+6)%7)&&time<w.end));}
export function offeringAvailable(c,o,at=new Date()){const p=c.products.find(p=>p.id===o.productId);return !!(o.active&&p&&productAvailable(p,at)&&policyAvailable(c,o.availabilityPolicyId,at));}

export function productOrderable(c,p,at=new Date(),seen=new Set()){if(!p||seen.has(p.id)||!productAvailable(p,at)||!p.allergenVerified||!p.routeId||p.temperature.prompt&&!p.temperature.groupId)return false;seen.add(p.id);return p.modifierGroupIds.every(id=>{const g=c.modifierGroups.find(g=>g.id===id);return g&&g.options.filter(o=>!['ingredient','unknown'].includes(g.kind)||o.allergenVerified).length>=g.min;})&&p.choices.filter(x=>x.allergenVerified).length>=p.chooseCount&&p.wineComponents.every(w=>productOrderable(c,c.products.find(x=>x.id===w.productId),at,new Set(seen)));}
