import {emptyCatalog,copy,cents,canonical,addMenu,addSection,addOffering} from './contract.mjs';
import {exportBohState,sourceRecords,catalogKeys} from './state-exporter.mjs';
export {exportBohState} from './state-exporter.mjs';
import {reconcileTemperature} from './temperature-policy.mjs';
import {accountSource} from './import-accounting.mjs';
const sid=(scope,id)=>scope+'/'+encodeURIComponent(String(id));
const nonempty=x=>x!==undefined&&x!==null&&x!=='';
export function importLegacy(source){
 const isState=catalogKeys.some(k=>k.startsWith('menu')&&k in source);
 const raw=isState?exportBohState(source):copy(source);
 const allowed=new Set(['menu','photos','provenance','prixFixeMenus','tastingMenus','bar','wines','retail','wineFlights','ingredients','dailySpecials',...catalogKeys]);
 const unknown=Object.keys(raw).filter(k=>!allowed.has(k));if(unknown.length)throw Error('Unclassified source fields: '+unknown.join(', '));
 if(raw.menu&&Object.keys(raw.menu).some(k=>!['items','cats','books','modGroups','taxRates'].includes(k)))throw Error('Unclassified legacy menu fields');
 const c=emptyCatalog();c.legacySnapshots=[{id:'legacy-source',records:raw}];c.provenance=copy(raw.provenance||[]);
 const unresolved=c.importReport.unresolved,mark=new Map();
 const mapped=(path,...ids)=>mark.set(path,{targetIds:ids,disposition:'mapped',reason:'Explicit source mapping'});
 const menu=raw.menu||{items:raw.menuItems||[],cats:raw.menuCats||[],books:raw.menuBooks||[],modGroups:raw.modGroups||[],taxRates:raw.taxRates||[]};
 for(const key of ['items','cats','books','modGroups','taxRates'])if(!Array.isArray(menu[key]||[]))throw Error('Invalid source array '+key);
 const root=k=>raw.menu?'/menu/'+k:'/'+({items:'menuItems',cats:'menuCats',books:'menuBooks',modGroups:'modGroups',taxRates:'taxRates'}[k]);
 const photos=raw.menuPhotos||raw.photos||{};
 const route=station=>{if(!station)return null;if(typeof station!=='string')throw Error('Invalid station');const id=sid('route',station);if(!c.routes.some(r=>r.id===id))c.routes.push({id,name:station});return id;};
 function product(record,path,fallbackId,scope='food'){
  for(const key of ['active','available','visible','eightySixed','is86','soldOut','verified','allergenVerified'])if(key in record&&typeof record[key]!=='boolean')throw Error('Invalid source boolean '+path+'.'+key);
  for(const key of ['allergens','modGroupIds','voiceAliases','diet','dietary','scoops'])if(record[key]!=null&&!Array.isArray(record[key]))throw Error('Invalid source array '+path+'.'+key);
  for(const key of ['voiceKeyword','askTemp','cookNote','fireAfter'])if(record[key]!=null&&typeof record[key]!=='string')throw Error('Invalid source string '+path+'.'+key);
  if(record.chooseCount!=null&&(!Number.isSafeInteger(record.chooseCount)||record.chooseCount<0))throw Error('Invalid chooseCount '+path);

  if(record.temperatureGroupId&&record.tempGroupId&&record.temperatureGroupId!==record.tempGroupId)unresolved.push(path+': conflicting temperature references');
  if(record.wines&&record.wineId)unresolved.push(path+': ambiguous wine component sources');
  const original=record.dishId||record.id||fallbackId;if(!original)throw Error('Product lacks stable identity '+path);
  const id=sid('product/'+scope,original),verified=(record.verified===true||record.allergenVerified===true)&&Array.isArray(record.allergens)&&record.allergens.length>0;
  const allergens=copy(record.allergens||[]);if(!Array.isArray(allergens))throw Error('Invalid allergens '+path);
  const temperature=reconcileTemperature(record,{sourceId:String(original),scope,groups:menu.modGroups||[],path}),group=temperature.groupId;unresolved.push(...temperature.issues);c.provenance.push(...temperature.changes);
  const av={active:record.active!==false&&record.visible!==false,available:record.available!==false,eightySixed:record.eightySixed===true||record.is86===true||record.soldOut===true,stock:record.stock??null,ozOnHand:record.ozOnHand??null,startDate:record.activeFrom||null,endDate:record.activeTo||null,timezone:record.timezone||null};
  const photo=record.photoUrl||record.photo||record.labelUrl||photos[original]||photos['pfdish:'+original]||photos['tmcourse:'+original];
  const p={id,sourceId:String(original),name:record.name,description:record.description??record.desc??'',photos:[...new Set([...(record.photos||[]),...(photo?[photo]:[])])],allergens,allergenVerified:verified,allergenDataStatus:verified?'verified':allergens.length?'declared':'unknown',modifierGroupIds:temperature.modifierGroupIds,temperatureGroupId:group,routeId:route(record.station),dietary:copy(record.diet??record.dietary??[]),voiceKeyword:record.voiceKeyword||'',voiceAliases:copy(record.voiceAliases||[]),temperature:{prompt:record.askTemp||'',groupId:group},chooseCount:record.chooseCount||0,choices:(record.scoops||[]).map(x=>({id:x.id,name:x.name,allergens:copy(x.allergens||[]),allergenVerified:(x.verified===true||x.allergenVerified===true)&&Array.isArray(x.allergens)&&x.allergens.length>0,description:x.desc||'',voiceKeyword:x.voiceKeyword||'',kind:x.kind||''})),ingredients:record.ingredients||'',pairingSuggestions:[['pairing','pairing'],['pairWhite','white'],['pairRed','red'],['pairDessert','dessert']].filter(([field])=>record[field]).map(([field,kind])=>({kind,label:record[field]})),requiresWineComponents:['flight','pairing'].includes(scope),wineComponents:['flight','pairing'].includes(scope)?(record.wines||(record.wineId?[{id:record.wineId,pourOz:record.pourOz}]:[])).map(w=>({productId:sid('product/wine',typeof w==='string'?w:w.id||w.wineId),pourOz:(typeof w==='object'?w.pourOz:null)??record.pourOz??0})):[],cookNote:record.cookNote||'',cookMinutes:record.cookMin??record.cookTime??0,fireTiming:{fireEach:!!record.fireEach,fireAfter:record.fireAfter||''},displayMetadata:Object.fromEntries(['code','vin','lin','vintage','producer','region','country','varietal','grape','size','unit','group','kind','category'].filter(k=>record[k]!=null).map(k=>[k,record[k]])),translations:copy(record.i18n||{}),availability:av,legacy:copy(record)};
  const prior=c.products.find(x=>x.id===id);
  if(prior){
   // Same BOH dish ID is one product in every menu. Preserve all source variants privately.
   // Menu-specific labels are retained on offerings; source identity remains shared.
   prior.allergens=[...new Set([...prior.allergens,...p.allergens])];prior.allergenVerified=prior.allergenVerified&&p.allergenVerified;prior.allergenDataStatus=prior.allergenVerified?'verified':prior.allergens.length?'declared':'unknown';
   prior.availability.active&&=av.active;prior.availability.available&&=av.available;prior.availability.eightySixed||=av.eightySixed;
   for(const k of ['stock','ozOnHand'])if(av[k]!==null)prior.availability[k]=prior.availability[k]===null?av[k]:Math.min(prior.availability[k],av[k]);
   if(canonical(prior.modifierGroupIds)!==canonical(p.modifierGroupIds)||prior.temperatureGroupId!==p.temperatureGroupId||prior.chooseCount!==p.chooseCount||canonical(prior.choices)!==canonical(p.choices))unresolved.push(path+': conflicting ordering metadata '+id);
   if(!prior.routeId)prior.routeId=p.routeId;else if(p.routeId&&prior.routeId!==p.routeId)unresolved.push(path+': conflicting route '+id);
   prior.pairingSuggestions=[...new Map([...prior.pairingSuggestions,...p.pairingSuggestions].map(s=>[canonical(s),s])).values()];
   prior.voiceAliases=[...new Set([...prior.voiceAliases,...p.voiceAliases])];if(p.voiceKeyword&&p.voiceKeyword!==prior.voiceKeyword)prior.voiceAliases=[...new Set([...prior.voiceAliases,p.voiceKeyword])];prior.photos=[...new Set([...prior.photos,...p.photos])];if(p.cookNote&&!prior.cookNote.includes(p.cookNote))prior.cookNote=[prior.cookNote,p.cookNote].filter(Boolean).join(' / ');
   prior.legacy.variants=prior.legacy.variants||[];prior.legacy.variants.push(copy(record));
  }else c.products.push(p);
  mapped(path,...new Set([...(mark.get(path)?.targetIds||[]),id]));return id;
 }
 for(const [i,g]of (menu.modGroups||[]).entries()){for(const key of ['required','multi'])if(key in g&&typeof g[key]!=='boolean')throw Error('Invalid modifier boolean '+key);const options=(g.options||[]).map((o,j)=>({id:String(o.id??g.id+'-option-'+j),name:o.name,priceDeltaCents:cents(o.up??o.priceDelta??0,{signed:true}),allergens:copy(o.allergens||[]),allergenVerified:(o.verified===true||o.allergenVerified===true)&&Array.isArray(o.allergens)&&o.allergens.length>0}));c.modifierGroups.push({id:g.id,name:g.name,kind:g.kind||(['mg_meat_temp','mg_fish_temp','mg_temp'].includes(g.id)?'temperature':'unknown'),min:g.min??(g.required?1:0),max:g.max??(g.multi?options.length:1),options,legacy:copy(g)});mapped(root('modGroups')+'/'+i,g.id);}
 c.taxRules=(menu.taxRates||[]).map((t,i)=>{mapped(root('taxRates')+'/'+i,t.id);return {id:t.id,name:t.name,ratePercent:t.rate,isDefault:!!t.isDefault,legacy:copy(t)};});
 const books=menu.books||[],cats=menu.cats||[],items=menu.items||[];for(const cat of cats)if('visible'in cat&&typeof cat.visible!=='boolean')throw Error('Invalid category visibility');
 for(const [i,b]of books.entries())for(const id of b.groupIds||b.catIds||[])if(!cats.some(c=>c.id===id))unresolved.push(root('books')+'/'+i+': missing category '+id);
 for(const [i,cat]of cats.entries())if(cat.bookId&&!books.some(b=>b.id===cat.bookId))unresolved.push(root('cats')+'/'+i+': missing parent book');
 for(const [i,it]of items.entries())for(const id of it.catIds||[])if(!cats.some(c=>c.id===id))unresolved.push(root('items')+'/'+i+': missing category '+id);
 const itemIds=items.map((r,i)=>product(r,root('items')+'/'+i));
 const selection=(id,{min=1,max=1,automatic=false,deferred=false}={})=>{c.orderingRules.push({id,kind:'selection',min,max,automatic,deferred});return id;};
 function regular(book,index){if('active'in book&&typeof book.active!=='boolean')throw Error('Invalid book active flag');const m=addMenu(c,{id:sid('book',book.id),name:book.name,presentationGroup:book.presentationGroup||book.name});m.active=book.active!==false;m.taxRuleIds=copy(book.taxIds||[]);m.metadata={kind:book.kind||''};mapped(root('books')+'/'+index,m.id);return m;}
 for(const [bi,b]of books.entries()){
  const m=regular(b,bi);
  for(const [ci,cat]of cats.entries())if(cat.bookId===b.id||(b.groupIds||b.catIds||[]).includes(cat.id)){
   const s=addSection(c,m.id,{id:sid(m.id,cat.id),name:cat.name});mapped(root('cats')+'/'+ci,s.id);
   items.forEach((it,i)=>{if((it.catIds||[]).includes(cat.id)){const o=addOffering(c,s.id,{id:sid(s.id,it.id),productId:itemIds[i],priceCents:cents(it.price),taxRuleIds:copy(it.taxIds||[])});o.active=it.active!==false&&it.visible!==false&&cat.visible!==false;}});
  }
 }
 for(const [ci,cat]of cats.entries())if(!mark.has(root('cats')+'/'+ci)){const m=addMenu(c,{id:sid('category-menu',cat.id),name:cat.name}),s=addSection(c,m.id,{id:sid(m.id,'section'),name:cat.name});m.active=cat.visible!==false;mapped(root('cats')+'/'+ci,s.id);items.forEach((it,i)=>{if((it.catIds||[]).includes(cat.id)){const o=addOffering(c,s.id,{id:sid(s.id,it.id),productId:itemIds[i],priceCents:cents(it.price),taxRuleIds:copy(it.taxIds||[])});o.active=it.active!==false&&it.visible!==false;}});}
 items.forEach((it,i)=>{if(!c.offerings.some(o=>o.productId===itemIds[i]))unresolved.push(root('items')+'/'+i+': no menu placement');});
 for(const [kind,key]of [['pf','prixFixeMenus'],['tasting','tastingMenus']])for(const [mi,src]of (raw[key]||[]).entries()){
  for(const flag of ['active','visible'])if(flag in src&&typeof src[flag]!=='boolean')throw Error('Invalid menu visibility '+src.id);
  const path='/'+key+'/'+mi,m=addMenu(c,{id:sid(kind,src.id),name:src.name,orderingRuleId:'fixed-price',basePriceCents:cents(src.price),presentationGroup:src.presentationGroup||'FOOD'});m.active=src.active!==false&&src.visible!==false;m.taxRuleIds=copy(src.taxIds||[]);m.metadata=copy(Object.fromEntries(['subtitle','desc','service','mealPeriod','dessertAfter','dessertMenuId','duration','version','welcomeFireEach','i18n'].filter(k=>src[k]!=null).map(k=>[k,src[k]])));mapped(path,m.id);
  (src.dishes||[]).forEach((dish,di)=>product(dish,path+'/dishes/'+di));
  const courses=src.courses||src.courseGroups||[],courseKey=src.courses?'courses':'courseGroups';
  if(!courses.length&&(src.dishes||[]).length)unresolved.push(path+': dishes without course mapping');
  courses.forEach((course,ci)=>{
   const cp=path+'/'+courseKey+'/'+ci;for(const flag of ['visible','fireEach','pending','headingOnly'])if(flag in course&&typeof course[flag]!=='boolean')throw Error('Invalid course boolean '+cp+'.'+flag);if(course.mode&&!['auto','choose','later','entremets'].includes(course.mode))unresolved.push(cp+': unknown course behavior '+course.mode);
   let options=course.options;
   if(!options&&course.dishIds)options=course.dishIds.map(id=>(src.dishes||[]).find(d=>d.id===id));
   if(!options&&kind==='pf')options=(src.dishes||[]).filter(d=>d.course===(course.label||course.name));
   if(course.headingOnly){const dessert=(raw.prixFixeMenus||[]).find(x=>x.id===src.dessertMenuId);const match=dessert?.courses?.find(x=>x.label===(course.group||course.name));options=match?.options;if(!options?.length)unresolved.push(cp+': deferred heading has no explicit dessert source');}
   if(kind==='tasting'&&!course.headingOnly)options=course.options||[course];
   options=options||[];if(options.some(x=>!x))throw Error('Missing course dish '+cp);
   const auto=course.mode==='auto'||course.mode==='entremets'||!!course.fireEach||(kind==='tasting'&&!course.headingOnly&&!course.options&&course.mode!=='later');
   const deferred=course.mode==='later'||course.mode==='entremets'||!!course.pending;
   for(const field of ['choose','chooseCount'])if(course[field]!=null&&(!Number.isSafeInteger(course[field])||course[field]<0))throw Error('Invalid course selection count '+cp);if(!options.length&&src.active!==false)unresolved.push(cp+': required course has no offerings');
   const count=auto?options.length:(course.chooseCount>0?course.chooseCount:course.choose>0?course.choose:1);
   const s=addSection(c,m.id,{id:sid(m.id,course.id??course.num??ci),name:course.label||course.group||course.course||course.name||String(course.num),orderingRuleId:selection(sid(m.id,'rule-'+ci),{min:count,max:count,automatic:auto,deferred})});s.fireTiming={fireEach:!!course.fireEach,fireAfter:course.fireAfter||''};s.metadata={sourceMode:course.mode||'',headingOnly:!!course.headingOnly};mapped(cp,s.id);
   options.forEach((it,oi)=>{if(it.price!=null&&it.upcharge!=null&&cents(it.price)!==cents(it.upcharge))unresolved.push(cp+'/options/'+oi+': conflicting included price/upcharge');const pid=product(it,(kind==='tasting'&&!course.options&&!course.headingOnly)?cp:cp+'/options/'+oi,it.dishId||sid(src.id,it.num??ci));const o=addOffering(c,s.id,{id:sid(s.id,it.id||it.dishId||oi),productId:pid,priceCents:null,upchargeCents:cents(it.upcharge??it.price??0),taxRuleIds:copy(it.taxIds||[])});o.displayName=it.name;o.description=it.desc||it.description||'';o.active=it.active!==false&&it.visible!==false&&course.visible!==false;});
  });
  if(src.courses&&src.courseGroups)src.courseGroups.forEach((group,gi)=>{const target=c.sections.find(s=>s.menuId===m.id&&s.name===group.label);if(!target)unresolved.push(path+'/courseGroups/'+gi+': unmatched mirror course');else {mapped(path+'/courseGroups/'+gi,target.id);for(const [oi,o]of (group.options||[]).entries()){const pid=sid('product/food',o.dishId||o.id);if(!c.offerings.some(x=>x.sectionId===target.id&&x.productId===pid))unresolved.push(path+'/courseGroups/'+gi+'/options/'+oi+': unplaced mirror product');else {const offering=c.offerings.find(x=>x.sectionId===target.id&&x.productId===pid);if(offering.upchargeCents!==cents(o.upcharge??o.price??0)||canonical(offering.taxRuleIds)!==canonical(o.taxIds||[]))unresolved.push(path+'/courseGroups/'+gi+'/options/'+oi+': conflicting mirrored price/tax');product(o,path+'/courseGroups/'+gi+'/options/'+oi);}}}});

  if((src.pairings||[]).length){const section=addSection(c,m.id,{id:sid(m.id,'pairings'),name:'Wine pairings',pricing:'individual'});src.pairings.forEach((pairing,pi)=>{const pp=path+'/pairings/'+pi;if(!pairing.id)throw Error('Stable pairing ID required '+pp);const pid=product(pairing,pp,null,'pairing');addOffering(c,section.id,{id:sid(section.id,pairing.id),productId:pid,priceCents:cents(pairing.price),taxRuleIds:copy(pairing.taxIds||[])});});}
  (src.dishes||[]).forEach((d,di)=>{const pid=sid('product/food',d.id);const placements=c.offerings.filter(o=>o.productId===pid&&c.sections.find(s=>s.id===o.sectionId)?.menuId===m.id);if(!placements.length)unresolved.push(path+'/dishes/'+di+': unmapped dish');else if(placements.some(o=>o.upchargeCents!==cents(d.upcharge??d.price??0)||d.course&&c.sections.find(s=>s.id===o.sectionId)?.name!==d.course||canonical(o.taxRuleIds)!==canonical(d.taxIds||[])))unresolved.push(path+'/dishes/'+di+': conflicting dish price/tax/course placement');else mapped(path+'/dishes/'+di,pid);});
 }
 function collection(key,scope,kind){
  const groups=new Map();(raw[key]||[]).forEach((it,i)=>{const label=key==='wines'?(it.group||it.category||it.kind||'Wine'):(it.kind||it.category||kind);if(!groups.has(label))groups.set(label,[]);groups.get(label).push([it,i]);});
  for(const [label,rows]of groups){const candidate=books.find(b=>b.kind===kind),m=candidate?c.menus.find(m=>m.id===sid('book',candidate.id)):addMenu(c,{id:sid(key,label),name:label,presentationGroup:kind==='retail'?'RETAIL':'DRINKS'});const s=addSection(c,m.id,{id:sid(m.id,key+'-'+label),name:label});for(const [it,i]of rows){const pid=product(it,'/'+key+'/'+i,null,scope);if(key==='wines'){let count=0;for(const [pour,v]of [['bottle',it.bottlePrice],['glass',it.glassPrice]])if(nonempty(v)&&Number(v)>0){const o=addOffering(c,s.id,{id:sid(s.id,it.id+'/'+pour),productId:pid,priceCents:cents(v),taxRuleIds:copy(it.taxIds||[])});o.pour=pour;count++;}if(!count)unresolved.push('/'+key+'/'+i+': no sale price');}else addOffering(c,s.id,{id:sid(s.id,it.id),productId:pid,priceCents:cents(it.price),taxRuleIds:copy(it.taxIds||[])});}}
 }
 collection('bar','bar','bar');collection('wines','wine','wine');collection('retail','retail','retail');collection('dailySpecials','food','special');collection('wineFlights','flight','wine');
 for(const [i,f]of (raw.wineFlights||[]).entries())for(const id of f.wines||[])if(!(raw.wines||[]).some(w=>w.id===(typeof id==='string'?id:id.id||id.wineId)))unresolved.push('/wineFlights/'+i+': unresolved wine reference');
 for(const [key,url]of Object.entries(photos)){let id=key.replace(/^(pfdish:|tmcourse:)/,'');if(id.includes('|')){const [menuId,recordId]=id.split('|');const tm=(raw.tastingMenus||[]).find(m=>m.id===menuId);const course=tm?.courses?.find(c=>String(c.id??c.num)===recordId);id=course?(course.dishId||course.id||sid(menuId,course.num)):recordId;}const matches=c.products.filter(p=>p.sourceId===id);const p=matches[0];if(matches.length>1){unresolved.push('/'+(raw.menuPhotos?'menuPhotos':'photos')+'/'+key+': ambiguous photo identity');continue;}if(!p)unresolved.push('/'+(raw.menuPhotos?'menuPhotos':'photos')+'/'+key+': orphan photo');else {if(!p.photos.includes(url))p.photos.push(url);mapped('/'+(raw.menuPhotos?'menuPhotos':'photos')+'/'+key,p.id);}}

 for(const [key,profile]of Object.entries(raw.voiceProfiles?.profiles||{})){
  const sourceId=String(profile.sourceId||'').split('|').at(-1),targets=c.products.filter(p=>p.sourceId===sourceId);
  if(!targets.length){unresolved.push('/voiceProfiles/profiles/'+key+': unresolved voice identity');continue;}
  if(profile.active!==false)for(const p of targets){if(profile.voiceKeyword)p.voiceKeyword=profile.voiceKeyword;if(profile.voiceAliases)p.voiceAliases=copy(profile.voiceAliases);}
  mapped('/voiceProfiles/profiles/'+key,...targets.map(p=>p.id));
 }
 const report=accountSource(raw,mark);c.importReport={sourceRecords:report.sourceRecords,unresolved:[...unresolved,...report.unresolved]};
 return c;
}
