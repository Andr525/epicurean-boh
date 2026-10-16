// Explicit source-field policies. A mapped parent never classifies an unknown child.
// Original values always remain in the private snapshot, including unresolved ones.
export function accountSource(raw,marks){
 const rows=[],unresolved=[];
 const emit=(path,disposition,targetIds,reason)=>rows.push({path,disposition,targetIds,reason});
 const walkValue=(value,path,status,ids,reason)=>{emit(path,status,ids,reason);if(value&&typeof value==='object')for(const [k,v]of Object.entries(value))walkValue(v,path+'/'+k,status,ids,reason);};
 const mappedProduct=new Set('id dishId num name description desc photos photoUrl photo labelUrl allergens verified allergenVerified modGroupIds temperatureGroupId tempGroupId station dietary diet voiceKeyword voiceAliases askTemp chooseCount cookNote cookMin cookTime fireEach fireAfter code vin lin vintage producer region country varietal grape size unit group kind category i18n active visible available eightySixed is86 soldOut stock ozOnHand activeFrom activeTo timezone ingredients price upcharge taxIds catIds course pairing pairWhite pairRed pairDessert'.split(' '));
 const privateFields=new Set('privateMemo cost bottleCost unitCost ingredientsCost margin par story storyUrl sourceUrl moreUrl vintageUrl notes order createdAt updatedAt byTheGlass scaliniOnly bottleOz glassOz shortName'.split(' '));
 const config={
  product:{fields:mappedProduct,children:{scoops:'scoop'}},
  scoop:{fields:new Set('id name allergens verified allergenVerified desc voiceKeyword kind'.split(' ')),children:{}},
  wineComponent:{fields:new Set('id wineId pourOz'.split(' ')),children:{}},
  group:{fields:new Set('id name kind min max required multi'.split(' ')),children:{options:'modifier'}},
  modifier:{fields:new Set('id name up priceDelta allergens verified allergenVerified'.split(' ')),children:{}},
  tax:{fields:new Set('id name rate isDefault'.split(' ')),children:{}},
  book:{fields:new Set('id name kind presentationGroup active groupIds catIds taxIds'.split(' ')),children:{}},
  category:{fields:new Set('id name bookId visible kind posName'.split(' ')),children:{offeringRefs:'offeringRef'}},
  offeringRef:{fields:new Set('sourceType sourceId pour'.split(' ')),children:{}},
  menu:{fields:new Set('id name price active visible subtitle desc service mealPeriod dessertAfter dessertMenuId duration version welcomeFireEach i18n presentationGroup taxIds'.split(' ')),children:{courses:'course',courseGroups:'course',dishes:'product',pairings:'pairing'}},
  course:{fields:new Set([...mappedProduct,...'label mode choose pending headingOnly dishIds'.split(' ')]),children:{options:'product',scoops:'scoop'}},
  pairing:{fields:new Set([...mappedProduct,'wineId','pourOz']),children:{wines:'wineComponent',scoops:'scoop'}},
  wine:{fields:new Set([...mappedProduct,'bottlePrice','glassPrice','price']),children:{}},
  flight:{fields:new Set([...mappedProduct,'pourOz']),children:{wines:'wineComponent'}},
  profile:{fields:new Set('voiceKeyword voiceAliases sourceId sourceType family active key'.split(' ')),children:{}}
 };
 function record(value,path,type,ownerIds=[]){
  const descriptor=config[type],direct=marks.get(path),ids=direct?.targetIds||ownerIds;
  // Nested typed options are explicitly modeled in their group's canonical options.
  const nested=['modifier','scoop','wineComponent'].includes(type);
  if(!descriptor||!direct&&!nested){walkValue(value,path,'unresolved',[],'No direct modeled record mapping');unresolved.push(path+': record is not directly modeled');return;}
  emit(path,'mapped',ids,'Explicit '+type+' representation; fields classified independently');
  if(!value||typeof value!=='object'){if(type==='wineComponent'&&typeof value==='string')return;unresolved.push(path+': invalid '+type+' record');return;}
  for(const [field,v]of Object.entries(value)){
   const p=path+'/'+field;
   if(descriptor.children[field]){emit(p,'mapped',ids,'Typed '+field+' collection');if(v===null&&field==='scoops')continue;if(!Array.isArray(v)){unresolved.push(p+': collection expected');continue;}v.forEach((item,i)=>record(item,p+'/'+i,descriptor.children[field],ids));}
   else if(type==='product'&&((field==='glassPrice'&&Number(v)===Number(value.price))||(field==='bottlePrice'&&Number(v)===0)))walkValue(v,p,'preserved',[],'Redundant legacy price alias or explicitly disabled pour; standalone offering price is modeled');
   else if(descriptor.fields.has(field))walkValue(v,p,'mapped',ids,'Explicit '+type+'.'+field+' representation');
   else if(privateFields.has(field)||type==='profile'&&['origin','seedVersion','updatedAt'].includes(field))walkValue(v,p,'preserved',[],'Private source metadata; not used for ordering/pricing/tax/kitchen decisions');
   else {walkValue(v,p,'unresolved',[],'Unrepresented source field: must classify before publication');unresolved.push(p+': unrepresented field');}
  }
 }
 const types={menuItems:'product',menuCats:'category',menuBooks:'book',modGroups:'group',taxRates:'tax',retail:'product',wineFlights:'flight',bar:'product',wines:'wine',prixFixeMenus:'menu',tastingMenus:'menu',dailySpecials:'product'};
 const wrappers={items:'product',cats:'category',books:'book',modGroups:'group',taxRates:'tax'};
 function collection(values,path,type){emit(path,'mapped',[],'Explicit source collection');if(!Array.isArray(values)){unresolved.push(path+': source array required');return;}values.forEach((v,i)=>record(v,path+'/'+i,type));}
 for(const [key,value]of Object.entries(raw)){
  const path='/'+key;if(key==='provenance')continue;
  if(types[key])collection(value,path,types[key]);
  else if(key==='menu'){emit(path,'mapped',[],'Legacy source wrapper');for(const [k,v]of Object.entries(value))if(wrappers[k])collection(v,path+'/'+k,wrappers[k]);else{walkValue(v,path+'/'+k,'unresolved',[],'Unknown source collection');unresolved.push(path+'/'+k);}}
  else if(key==='photos'||key==='menuPhotos'){emit(path,'mapped',[],'Explicit photo collection');for(const [k,v]of Object.entries(value||{})){const mark=marks.get(path+'/'+k);walkValue(v,path+'/'+k,mark?'mapped':'unresolved',mark?.targetIds||[],'Explicit photo identity mapping');if(!mark)unresolved.push(path+'/'+k);}}
  else if(key==='voiceProfiles'){emit(path,'mapped',[],'Voice metadata container');for(const [k,v]of Object.entries(value||{})){if(k==='profiles'){emit(path+'/'+k,'mapped',[],'Explicit profiles');for(const [id,profile]of Object.entries(v))record(profile,path+'/'+k+'/'+id,'profile');}else if(['schemaVersion','seeds','updatedAt'].includes(k))walkValue(v,path+'/'+k,'preserved',[],'Private voice seed/revision metadata');else{walkValue(v,path+'/'+k,'unresolved',[],'Unknown voice source metadata');unresolved.push(path+'/'+k);}}}
  else if(['ingredients','retiredVins','retiredLins','cellarVer','voiceActiveRevision'].includes(key))walkValue(value,path,'preserved',[],'Private inventory/revision reference, not a sale offering');
  else {walkValue(value,path,'unresolved',[],'Unknown source collection');unresolved.push(path);}
 }
 return {sourceRecords:rows.sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0),unresolved};
}
