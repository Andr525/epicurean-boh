import {importLegacy} from './legacy-adapter.mjs';
import {validate,canonical} from './contract.mjs';
import {MemoryPublicationStore,publish,readRelease,rollback,project} from './publication.mjs';
import {exportBohState,catalogKeys as supportedCatalogKeys} from './state-exporter.mjs';
import {reconcileTemperature} from './temperature-policy.mjs';
// Not loaded by normal BOH. Refuse activation without the generated fixture page.
if(window.EPICUREAN_CATALOG_LAB?.fixtureOnly!==true||!window.BOH_FIXTURE)throw Error('Fixture-only BOH page required');
const w=window,key='epicurean.boh.catalog.integration.v1',copy=x=>JSON.parse(JSON.stringify(x));
for(const [k,v] of Object.entries(w.BOH_FIXTURE))w.STATE[k]=copy(v);
const catalogKeys=supportedCatalogKeys.filter(k=>k in w.STATE);if('provenance'in w.STATE)catalogKeys.push('provenance');
w.STATE.staff=[];w.STATE.guests=[];w.STATE.punches=[];w.STATE.sales=[];
let saved=localStorage.getItem(key),store=new MemoryPublicationStore(),history=[],busy=false,stale=false,status='Fixture-only. No cloud publishing or real orders.';
if(saved){try{const s=JSON.parse(saved);store=MemoryPublicationStore.restoreLocal(s.store);if(store.pointer().releaseId)await readRelease(store,store.pointer().releaseId);history=s.history;for(const k of catalogKeys)if(k in s.state)w.STATE[k]=copy(s.state[k]);}catch(e){stale=true;status='Restore failed; publication blocked: '+e.message;}}
const source=()=>exportBohState(w.STATE);
const requireEditor=()=>{if(!w.SESSION.user||!w.can('menu')||busy||stale)throw Error('Owner/menu permission, current draft and idle publisher required');};
const persist=(next=store,nextHistory=history,state=source())=>{const value=JSON.stringify({state,store:next.exportLocal(),history:nextHistory});if(localStorage.getItem(key)!==saved)throw Error('Stale draft: reload before editing');localStorage.setItem(key,value);saved=value;};
const paint=()=>{if(w.SESSION.user&&w.ROUTE==='menu')w.mmPaint();};
const act=fn=>{try{requireEditor();fn();persist();status='Fixture draft saved; published release unchanged.';paint();}catch(e){status=e.message;paint();}};
w.fbGetDoc=()=>Promise.resolve(null);w.fbSetDoc=()=>Promise.resolve(false);
w.syncFromCloud=()=>Promise.resolve();
for(const name of ['publishVoiceVocabulary','mmVoicePublish','openAiSettings','openRecordSale','resolveSale','decrementStock','consumeWineSale','consumeBarSale','uploadMenuPhoto','uploadPhoto','photoCloudUpload'])w[name]=()=>{status='Unavailable in fixture-only catalog lab';paint();return false;};
w.ensureMenuManager=()=>{}; // Explicitly empty menus remain empty. No legacy heuristic seeding.
w.mmAttachTemps=record=>{const r=reconcileTemperature(record,{sourceId:record.dishId||record.id,scope:'food',groups:w.STATE.modGroups,path:'dish/'+record.id});if(r.issues.length)throw Error(r.issues.join('\n'));record.modGroupIds=r.modifierGroupIds;};
w.mmFoodGroups=book=>(w.STATE.menuCats||[]).filter(g=>(book.groupIds||[]).includes(g.id)||g.bookId===book.id);
const oldAddItem=w.mmAddItem;
w.mmAddItem=function(...args){requireEditor();w.mmFlush();return oldAddItem.apply(this,args);};
const oldBody=w.mmBody,oldBook=w.mmBookPanel,oldGroup=w.mmGroupEditor,oldItem=w.mmItemEditor,oldSave=w.mmSaveItemFromForm;
const esc=w.esc;
w.mmBody=()=>`<style>#catalog-publication{padding:16px;background:#f5f8fb}#catalog-publication button{padding:8px 12px;border:1px solid #b7a36d;border-radius:7px;margin:4px}#catalog-publication input,#catalog-publication select{padding:8px;max-width:100%}.catalog-refs{padding:12px;border:1px solid #ddd;margin:12px 0}</style><div class="mm-card" id="catalog-publication"><strong>ISOLATED CATALOG — FIXTURES ONLY</strong><p id="catalog-status" role="status">${esc(status)}</p><button id="catalog-publish" onclick="bohCatalog.publish()" ${busy||stale?'disabled':''}>Validate & publish local release</button> <select id="catalog-history">${history.map(h=>`<option value="${h.id}">${esc(h.time)} · ${h.id.slice(0,12)}</option>`).join('')}</select> <button id="catalog-rollback" onclick="bohCatalog.rollback()" ${busy||stale?'disabled':''}>Restore selected release</button><p>Local revision ${store.pointer().revision}. Existing legacy publications are untouched. Unknown allergens remain non-orderable.</p><label>Consumer <select id="catalog-channel"><option>pos</option><option>voice</option><option>digital</option></select></label><button onclick="bohCatalog.preview()">Preview shared contract</button><pre id="catalog-preview" style="max-height:220px;overflow:auto;white-space:pre-wrap"></pre><label>New menu name <input id="catalog-menu-name"></label><button id="catalog-create-menu" onclick="bohCatalog.createMenu()">Create menu</button></div>`+oldBody();
w.mmBookPanel=id=>oldBook(id)+`<div class="mm-card"><label>Menu name <input id="catalog-book-name" value="${esc(w.mmFindBook?.(id)?.name||(w.STATE.menuBooks.find(b=>b.id===id)?.name||''))}"></label><button id="catalog-rename-menu" onclick="bohCatalog.renameMenu('${id}')">Rename</button><button id="catalog-delete-menu" onclick="bohCatalog.deleteMenu('${id}')">Delete menu (preserve products)</button><p>Existing specialised food, wine, bar, retail, prix-fixe and tasting editors remain available.</p></div>`;
w.mmGroupEditor=id=>oldGroup(id)+`<div class="catalog-refs"><strong>Attached source offerings</strong>${(w.STATE.menuCats.find(g=>g.id===id)?.offeringRefs||[]).map((r,i)=>`<p>${esc(w.STATE[r.sourceType]?.find(p=>p.id===r.sourceId)?.name||'UNRESOLVED SOURCE')} ${esc(r.pour)} <button onclick="bohCatalog.detach('${id}',${i})">Remove from section</button></p>`).join('')||'<p>No additional source references.</p>'}</div>`+`<div class="mm-card"><label>Attach existing offering <select id="catalog-product">${w.STATE.menuItems.map(p=>`<option value="${esc(JSON.stringify({type:'food',id:p.id,pour:''}))}">${esc(p.name)}</option>`).join('')}${['wines','bar','retail'].map(type=>(w.STATE[type]||[]).flatMap(p=>(type==='wines'?['glass','bottle'].filter(pour=>Number(p[pour+'Price'])>0):['']).map(pour=>`<option value="${esc(JSON.stringify({type,id:p.id,pour}))}">${esc(p.name)} ${pour}</option>`)).join('')).join('')}</select></label><button id="catalog-attach" onclick="bohCatalog.attach('${id}')">Attach published source item</button><p>References reuse source identity and source prices. No product is cloned.</p><button onclick="bohCatalog.moveSection('${id}',-1)">Move up</button><button onclick="bohCatalog.moveSection('${id}',1)">Move down</button></div>`;
w.mmItemEditor=id=>oldItem(id)+`<div class="mm-card"><label>Explicit cooking-temperature prompt <select id="catalog-temperature"><option value="">No temperature request</option>${['steak','pork','salmon'].map(t=>`<option ${w.mmFindItem(id)?.askTemp===t?'selected':''}>${t}</option>`).join('')}<option value="REVIEW">Ambiguous — review required</option></select></label><p>Dish names never determine temperatures. Existing conflicting metadata blocks publication.</p></div>`;
w.mmSaveItemFromForm=(id,toastOk)=>{
 try{
  requireEditor();
  const field=document.getElementById('ie-price');
  if(field&&!/^\d+(\.\d{1,2})?$/.test(field.value.trim()))throw Error('Enter an explicit valid dollar price');
  const item=w.mmFindItem(id),temp=document.getElementById('catalog-temperature')?.value;
  const proposed=copy(item);proposed.modGroupIds=[...document.querySelectorAll('.ie-mod:checked')].map(x=>x.value);
  if(temp!==undefined)proposed.askTemp=temp;
  const result=reconcileTemperature(proposed,{sourceId:item.dishId||id,scope:'food',groups:w.STATE.modGroups,path:'dish/'+id});
  if(result.issues.length)throw Error(result.issues.join('\n'));
  oldSave(id,false);item.askTemp=proposed.askTemp||'';item.modGroupIds=result.modifierGroupIds;
  persist();if(toastOk)w.mmAfterSave();return true;
 }catch(e){status='Item edit rejected: '+e.message;const node=document.getElementById('catalog-status');if(node)node.textContent=status;throw e;}
};
// The legacy form reconstructs options; preserve fields it does not expose instead of erasing allergens.
const oldSaveModifier=w.mmSaveModFromForm;
w.mmSaveModFromForm=(id,toastOk)=>{
 requireEditor();const group=w.mmFindMod(id);if(!group)return;
 const before=copy(group),save=w.saveMenu;
 try{
  for(const input of document.querySelectorAll('.mopt-up'))if(!/^-?\d+(\.\d{1,2})?$/.test(input.value.trim()))throw Error('Enter an explicit signed modifier dollar delta');
  w.saveMenu=()=>{}; // Synchronous form conversion only; no partial metadata snapshot is persisted.
  try{oldSaveModifier(id,false);}finally{w.saveMenu=save;}
  group.options=group.options.map(option=>{
   const prior=before.options.find(o=>o.id===option.id);if(!prior)return option;
   const preserved=Object.fromEntries(Object.entries(prior).filter(([k])=>!['id','name','up','voiceAliases','itemRef'].includes(k)));
   return {...preserved,...option,...(prior.name!==option.name?{verified:false,allergenVerified:false}:{})};
  });
  save();if(toastOk)w.mmPaint();
 }catch(e){w.saveMenu=save;for(const k of Object.keys(group))delete group[k];Object.assign(group,before);status='Modifier edit rejected: '+e.message;const node=document.getElementById('catalog-status');if(node)node.textContent=status;throw e;}
};
function archiveSection(id){
 let archive=w.STATE.menuBooks.find(b=>b.id==='catalog-owner-archive');
 if(!archive){archive={id:'catalog-owner-archive',name:'Unpublished owner archive',kind:'food',active:false,groupIds:[]};w.STATE.menuBooks.push(archive);}
 if(!archive.groupIds.includes(id))archive.groupIds.push(id);const section=w.STATE.menuCats.find(g=>g.id===id);if(section)section.bookId=archive.id;
}
w.deleteCat=id=>act(()=>{w.mmFlush();for(const book of w.STATE.menuBooks)book.groupIds=(book.groupIds||[]).filter(g=>g!==id);archiveSection(id);w.MM.sel=null;});
// Item deletion archives the existing source instead of destroying authentic records.
w.deleteMenuItem=id=>act(()=>{const item=w.mmFindItem(id);if(item){item.active=false;item.visible=false;}w.MM.sel=null;});
async function localPublish(){try{requireEditor();w.mmFlush();const snapshot=source(),fingerprint=canonical(snapshot),draft=importLegacy(snapshot);validate(draft);busy=true;status='Validating and staging complete local release…';paint();const next=MemoryPublicationStore.restoreLocal(store.exportLocal());await publish(draft,next);if(canonical(source())!==fingerprint)throw Error('Draft changed during publication; retry');const nextHistory=[{id:next.pointer().releaseId,time:new Date().toISOString()},...history.filter(h=>h.id!==next.pointer().releaseId)];const release=await readRelease(next,next.pointer().releaseId);for(const channel of ['pos','voice','digital'])project(release,{channel});persist(next,nextHistory);store=next;history=nextHistory;status='Local release activated — POS, voice and digital shared projections validated (not deployed apps)';}catch(e){status='Publication rejected: '+e.message;}finally{busy=false;paint();}}
w.publishMenusToFrontOfHouse=localPublish;
w.bohCatalog={preview:async()=>{try{const channel=document.getElementById('catalog-channel').value;document.getElementById('catalog-preview').textContent=JSON.stringify(await w.bohCatalog.consumer(channel),null,2);}catch(e){document.getElementById('catalog-preview').textContent=e.message;}},publish:localPublish,pointer:()=>store.pointer(),source,history:()=>copy(history),consumer:async channel=>project(await readRelease(store,store.pointer().releaseId),{channel}),
createMenu:()=>act(()=>{const name=document.getElementById('catalog-menu-name').value.trim();if(!name)throw Error('Menu name required');const id=w.uid('owner-menu');w.STATE.menuBooks.push({id,name,kind:'food',groupIds:[]});w.MM.sel={type:'book',id};}),
renameMenu:id=>act(()=>{w.mmFlush();const b=w.STATE.menuBooks.find(b=>b.id===id),name=document.getElementById('catalog-book-name').value.trim();if(!name)throw Error('Menu name required');b.name=name;}),
deleteMenu:id=>act(()=>{const book=w.STATE.menuBooks.find(b=>b.id===id);w.STATE.menuBooks=w.STATE.menuBooks.filter(b=>b.id!==id);for(const gid of new Set([...(book.groupIds||[]),...w.STATE.menuCats.filter(g=>g.bookId===id).map(g=>g.id)])){const other=w.STATE.menuBooks.find(b=>b.groupIds?.includes(gid));if(!other)archiveSection(gid);else{const section=w.STATE.menuCats.find(g=>g.id===gid);if(section?.bookId===id)section.bookId=other.id;}}w.MM.sel=null;}),
attach:id=>act(()=>{w.mmFlush();const {type,id:pid,pour}=JSON.parse(document.getElementById('catalog-product').value);if(type==='food'){const p=w.STATE.menuItems.find(p=>p.id===pid);if(!p.catIds.includes(id))p.catIds.push(id);}else{const g=w.STATE.menuCats.find(g=>g.id===id);g.offeringRefs=g.offeringRefs||[];if(!g.offeringRefs.some(r=>r.sourceType===type&&r.sourceId===pid&&r.pour===(pour||'')))g.offeringRefs.push({sourceType:type,sourceId:pid,pour:pour||''});}}),
detach:(id,index)=>act(()=>{w.mmFlush();w.STATE.menuCats.find(g=>g.id===id).offeringRefs.splice(index,1);}),
moveSection:(id,delta)=>act(()=>{const b=w.STATE.menuBooks.find(b=>b.groupIds?.includes(id));if(!b)return;const i=b.groupIds.indexOf(id),j=i+delta;if(j>=0&&j<b.groupIds.length)[b.groupIds[i],b.groupIds[j]]=[b.groupIds[j],b.groupIds[i]];}),
rollback:async()=>{try{requireEditor();const id=document.getElementById('catalog-history').value;busy=true;const next=MemoryPublicationStore.restoreLocal(store.exportLocal());await rollback(next,id,next.pointer().revision);const release=await readRelease(next,id),raw=release.catalog.legacySnapshots.find(s=>s.id==='legacy-source').records;const restored=Object.fromEntries(catalogKeys.map(k=>[k,copy(raw[k]??w.STATE[k])]));persist(next,history,restored);for(const k of catalogKeys)w.STATE[k]=restored[k];store=next;status='Selected local release restored; original publications untouched';}catch(e){status='Rollback rejected: '+e.message;}finally{busy=false;paint();}}};
w.addEventListener('storage',e=>{if(e.key===key&&e.newValue!==saved){stale=true;status='Stale draft: reload before editing or publishing';paint();}});
for(const name of ['saveMenu','saveMenuPhotos','saveBar','saveWines','saveRetail','saveIngredients','saveDailySpecials','saveTastingMenus','savePrixFixeMenus','saveVoiceProfiles','mmPersistPf','mmPersistTm']){
 const original=w[name];if(typeof original==='function')w[name]=function(...args){requireEditor();const result=original.apply(this,args);persist();return result;};
}
// Save controls remain original controls, but only fixture-local storage and no cloud SDK exist.
w.SESSION.user=null;w.ROUTE='overview';w.render();
