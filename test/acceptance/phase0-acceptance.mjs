// BOH Phase 0 acceptance: startup synchronization (D7) and the modifier editor (D8), driven
// through the real BOH screens against a CLEARLY IDENTIFIED in-memory mock Firestore. Offline.
// Usage: PLAYWRIGHT_MODULE=... CHROMIUM_PATH=... [BOH_ROOT=..] [LABEL=..] node phase0-acceptance.mjs [filterRegex]
import fs from 'node:fs';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import {transform, launch, openPage} from './serve.mjs';
const HERE = new URL('.', import.meta.url).pathname;
const BOH_ROOT = resolve(process.env.BOH_ROOT || resolve(HERE, '../..'));
const only = process.argv[2] ? new RegExp(process.argv[2]) : null;
const label = process.env.LABEL || 'unlabelled';
const rev = () => { try { return execFileSync('git', ['-C', BOH_ROOT, 'rev-parse', '--short', 'HEAD'], {encoding: 'utf8'}).trim() + (execFileSync('git', ['-C', BOH_ROOT, 'status', '--porcelain', '--', 'index.html', 'menu-manager.js'], {encoding: 'utf8'}).trim() ? '+wip' : ''); } catch { return 'n/a'; } };
const browser = await launch(); let port = 9800; const results = [];

async function boh({seed = {}, failReads = false, login = 'EPICUREAN2024', extraHead = ''} = {}) {
  const extra = (failReads ? '<script>window.__MOCK_FAIL_READS__=true;</script>' : '') + extraHead;
  const html = transform(fs.readFileSync(BOH_ROOT + '/index.html', 'utf8'), {seed, extraHead: extra});
  const o = await openPage(browser, {root: BOH_ROOT, html, origin: 'http://127.0.0.1:' + (port++)});
  const p = o.page;
  await p.waitForFunction(() => typeof STATE !== 'undefined' && typeof go === 'function', null, {timeout: 30000});
  await p.waitForTimeout(2000);
  o.bootWrites = await p.evaluate(() => __MOCK_DB__.log.map(l => l.op + ' ' + l.c + '/' + l.id));
  if (login) { await p.locator('#mgr-code').fill(login); await p.locator('#mgr-go').click(); await p.waitForTimeout(600); }
  o.ev = (f, a) => p.evaluate(f, a);
  o.db = () => p.evaluate(() => __MOCK_DB__.__dump());
  o.writes = () => p.evaluate(() => __MOCK_DB__.log.map(l => l.op + ' ' + l.c + '/' + l.id));
  o.toast = () => p.evaluate(() => { const t = document.getElementById('toast') || document.querySelector('.toast'); return t ? t.innerText : ''; });
  return o;
}
async function T(id, defect, title, fn, opts = {}) {
  if (only && !only.test(id)) return;
  const o = await boh(opts); const r = {id, defect, title};
  try { const out = await fn(o.page, o); r.pass = !!out.pass; r.evidence = out.evidence; }
  catch (e) { r.pass = false; r.evidence = 'ERROR: ' + String(e.message).split('\n')[0].slice(0, 200); }
  r.pageErrors = o.errors.slice(0, 3); r.external = [...new Set(o.external)].filter(h => !/fonts\.(googleapis|gstatic)|cdn\.jsdelivr/.test(h));
  if (r.pageErrors.length) r.pass = false;
  await o.context.close(); results.push(r);
  console.log((r.pass ? 'PASS ' : 'FAIL ') + id + ' ' + title + ' :: ' + r.evidence + (r.pageErrors.length ? ' | pageErrors=' + r.pageErrors.join(';') : ''));
}
// An established cloud: a previously published BOH, with an owner price ($99 torte) and a photo.
const cloud = JSON.parse(fs.readFileSync(HERE + 'fixtures/established-cloud.json', 'utf8'));
const optionsOf = async (o, gid) => o.ev(g => STATE.modGroups.find(x => x.id === g).options.map(x => ({id: x.id, name: x.name, up: x.up, allergens: x.allergens || null, verified: x.verified})), gid);
async function openMod(p, o, gid) { await o.ev(() => go('menu')); await p.waitForTimeout(500); await o.ev(g => mmSelect('mod', g), gid); await p.waitForTimeout(300); }

// ---- 7. Startup synchronization ----
await T('D7a', 7, 'Fresh device boot never overwrites the established cloud menu, prices or photos', async (p, o) => {
  const d = await o.db(); const t = d.boh_shared.menu.items.find(i => i.id === 'm2');
  const seedWrites = o.bootWrites.filter(w => /boh_shared\/(menu|menu_photos|wines|bar|retail|tasting_menus|prix_fixe_menus|daily_specials|tables|staff_clock)$/.test(w.replace(/^\S+ /, '')));
  const local = await o.ev(() => STATE.menuItems.find(i => i.id === 'm2').price);
  return {pass: t.price === 99 && Object.keys(d.boh_shared.menu_photos.urls).length === 1 && seedWrites.length === 0 && local === 99, evidence: `cloud torte=$${t.price} (expected 99); local torte=$${local}; cloud photos=${Object.keys(d.boh_shared.menu_photos.urls).length}; catalog writes during boot=${JSON.stringify(seedWrites)}`};
}, {seed: cloud, login: null});
await T('D7b', 7, 'Cloud unreachable at boot: no cloud writes at all; an edit is kept locally', async (p, o) => {
  await o.ev(() => go('menu')); await p.waitForTimeout(400); await o.ev(() => mmSelect('item', 'm2')); await p.waitForTimeout(300);
  await p.locator('#ie-price').fill('15'); await o.ev(() => mmSaveItemFromForm('m2', true)); await p.waitForTimeout(300);
  const toast = await o.toast(); const w = await o.writes(); const local = await o.ev(() => JSON.parse(localStorage.getItem(Object.keys(localStorage).find(k => /eh_menu_items$/.test(k)))).find(i => i.id === 'm2').price);
  return {pass: w.length === 0 && local === 15, evidence: `cloud writes=${JSON.stringify(w)}; saved locally=$${local}; toast="${toast.slice(0, 80)}"`};
}, {seed: cloud, failReads: true});
await T('D7c', 7, 'Empty (new) cloud: seeds stay local until the owner explicitly publishes', async (p, o) => {
  // Menus/photos are owner data: never auto-published. (The pre-existing bundled Binwise cellar
  // migration may still publish wines/bar to a cloud that has NO cellar at all; recorded below.)
  const before = o.bootWrites.filter(w => /boh_shared\/(menu|menu_photos|tasting_menus|prix_fixe_menus|daily_specials)$/.test(w.replace(/^\S+ /, '')));
  const cellar = o.bootWrites.filter(w => /boh_shared\/(wines|bar)$/.test(w.replace(/^\S+ /, '')));
  await o.ev(() => publishMenusToFrontOfHouse()); await p.waitForTimeout(500); const d = await o.db();
  return {pass: before.length === 0 && d.boh_shared && d.boh_shared.menu && d.boh_shared.menu.items.length > 0, evidence: `menu writes during boot=${JSON.stringify(before)}; cellar migration writes (empty cloud only)=${JSON.stringify(cellar)}; after explicit Publish menu items=${d.boh_shared && d.boh_shared.menu && d.boh_shared.menu.items.length}`};
}, {seed: {}});
// ---- 7 (conditions). Fail closed, keep local edits separately, reconcile safely ----
const keptOnDevice = (o) => o.ev(() => { const out = {}; for (const k of ['eh_pending_cloud_edits', 'eh_pending_cloud_writes', 'eh_archived_local_edits']) { try { out[k] = JSON.parse(localStorage.getItem(k) || 'null'); } catch (e) { out[k] = 'unreadable'; } } return out; });
const menuEditKept = (kept, id, price) => { let hit = false; const walk = v => { if (hit || !v || typeof v !== 'object') return; if (!Array.isArray(v) && v.id === id && v.price === price) { hit = true; return; } Object.values(v).forEach(walk); }; walk(kept); return hit; };
async function editItemPrice(p, o, id, price) { await o.ev(() => go('menu')); await p.waitForTimeout(400); await o.ev(i => mmSelect('item', i), id); await p.waitForTimeout(300); await p.locator('#ie-price').fill(String(price)); await o.ev(i => mmSaveItemFromForm(i, true), id); await p.waitForTimeout(300); await p.getByRole('button', {name: 'Publish all changes'}).first().click(); await p.waitForTimeout(900); }
async function banner(p, label) { const b = p.locator('#cloud-sync-banner button', {hasText: label}); if (!(await b.count())) return false; await b.first().click(); await p.waitForTimeout(900); return true; }
await T('D7d', 7, 'Cloud unreachable: every local edit is kept on the device (no 50-entry cap), nothing is written', async (p, o) => {
  await editItemPrice(p, o, 'm2', 15);
  const rid = await o.ev(() => (STATE.retail || [])[0] && STATE.retail[0].id);
  for (let i = 0; i < 55; i++) { await o.ev(([r, v]) => { mmSelect('retail', r); document.getElementById('r-price').value = String(v); mmSaveRetailFromForm(r, false); }, [rid, 10 + i]); }
  const kept = await keptOnDevice(o); const w = (await o.writes()).filter(x => !/raw-other-device/.test(x));
  return {pass: w.length === 0 && menuEditKept(kept, 'm2', 15) && JSON.stringify(kept).includes('"price":64'), evidence: `cloud writes=${w.length}; menu edit (torte $15) still kept=${menuEditKept(kept, 'm2', 15)}; last retail edit kept=${JSON.stringify(kept).includes('"price":64')}; stored entries=${JSON.stringify(Object.fromEntries(Object.entries(kept).map(([k, v]) => [k, v ? (Array.isArray(v) ? v.length : Object.keys(v).length) : 0])))}`};
}, {seed: cloud, failReads: true});
await T('D7e', 7, 'Edit kept while the cloud was unreachable; another device then changed the cloud → review offers only Keep cloud (archived)', async (p, o) => {
  await o.ev(() => { window.__MOCK_FAIL_READS__ = true; }); await editItemPrice(p, o, 'm1', 21);
  await o.ev(c => { const m = JSON.parse(JSON.stringify(__MOCK_DB__.__dump().boh_shared.menu)); m.items.find(i => i.id === 'm2').price = 77; m.updatedAt = Date.now(); __MOCK_DB__.__rawSet('boh_shared', 'menu', m); }, null);
  await o.ev(() => { window.__MOCK_FAIL_READS__ = false; });
  const opened = await banner(p, 'Review changes'); const row = p.locator('.cloud-edit-row', {hasText: /menu/i}).first();
  const canPublish = await row.getByRole('button', {name: 'Publish my change'}).count(); const text = (await row.innerText().catch(() => '')).replace(/\s+/g, ' ');
  await row.getByRole('button', {name: 'Keep cloud version'}).click().catch(() => {}); await p.waitForTimeout(700);
  const d = await o.db(); const kept = await keptOnDevice(o);
  return {pass: opened && canPublish === 0 && /changed/i.test(text) && d.boh_shared.menu.items.find(i => i.id === 'm2').price === 77 && d.boh_shared.menu.items.find(i => i.id === 'm1').price === 18 && menuEditKept({a: kept.eh_archived_local_edits}, 'm1', 21) && !JSON.stringify(kept.eh_pending_cloud_edits || {}).includes('boh_shared/menu"'), evidence: `review opened=${opened}; publish offered=${canPublish}; row="${text.slice(0, 120)}"; cloud torte=$${d.boh_shared.menu.items.find(i => i.id === 'm2').price} ceviche=$${d.boh_shared.menu.items.find(i => i.id === 'm1').price}; my $21 archived=${menuEditKept({a: kept.eh_archived_local_edits}, 'm1', 21)}`};
}, {seed: cloud});
await T('D7f', 7, 'Edit kept while the cloud was unreachable; cloud unchanged → Publish my change (confirmed) publishes it', async (p, o) => {
  await o.ev(() => { window.__MOCK_FAIL_READS__ = true; }); await editItemPrice(p, o, 'm1', 21); const mid = (await o.db()).boh_shared.menu.items.find(i => i.id === 'm1').price;
  await o.ev(() => { window.__MOCK_FAIL_READS__ = false; });
  const opened = await banner(p, 'Review changes'); const row = p.locator('.cloud-edit-row', {hasText: /menu/i}).first();
  const btn = row.getByRole('button', {name: 'Publish my change'}); const had = await btn.count(); if (had) { await btn.click(); await p.waitForTimeout(1500); }
  const d = await o.db(); const kept = await keptOnDevice(o);
  const asked = (o.dialogs || []).filter(x => /^confirm/.test(x)); return {pass: mid === 18 && opened && had === 1 && asked.length === 1 && d.boh_shared.menu.items.find(i => i.id === 'm1').price === 21 && d.boh_shared.menu.items.find(i => i.id === 'm2').price === 99 && !JSON.stringify(kept.eh_pending_cloud_edits || {}).includes('boh_shared/menu"'), evidence: `cloud ceviche while offline=$${mid}; review opened=${opened}; publish offered=${had}; confirmation asked="${asked.join('|').slice(0, 90)}"; after publish ceviche=$${d.boh_shared.menu.items.find(i => i.id === 'm1').price} torte=$${d.boh_shared.menu.items.find(i => i.id === 'm2').price}`};
}, {seed: cloud});
await T('D7g', 7, 'Another device changed the menu after this device loaded it → this device\'s publish is refused, nothing overwritten', async (p, o) => {
  await o.ev(() => { const m = JSON.parse(JSON.stringify(__MOCK_DB__.__dump().boh_shared.menu)); m.items.find(i => i.id === 'm2').price = 77; m.updatedAt = Date.now(); __MOCK_DB__.__rawSet('boh_shared', 'menu', m); });
  await editItemPrice(p, o, 'm1', 21); const t = await o.toast();
  const d = await o.db(); const kept = await keptOnDevice(o);
  // Resolve: keep the cloud version, then edit again — the new edit is based on the cloud copy and publishes.
  await banner(p, 'Review changes'); await p.locator('.cloud-edit-row', {hasText: /menu/i}).first().getByRole('button', {name: 'Keep cloud version'}).click().catch(() => {}); await p.waitForTimeout(1200);
  await o.ev(() => closeModal()); const shown = await o.ev(() => STATE.menuItems.find(i => i.id === 'm2').price);
  await editItemPrice(p, o, 'm1', 22); const d2 = await o.db();
  return {pass: d.boh_shared.menu.items.find(i => i.id === 'm2').price === 77 && d.boh_shared.menu.items.find(i => i.id === 'm1').price === 18 && menuEditKept(kept, 'm1', 21) && shown === 77 && d2.boh_shared.menu.items.find(i => i.id === 'm1').price === 22 && d2.boh_shared.menu.items.find(i => i.id === 'm2').price === 77, evidence: `cloud torte=$${d.boh_shared.menu.items.find(i => i.id === 'm2').price} (other device set 77); cloud ceviche=$${d.boh_shared.menu.items.find(i => i.id === 'm1').price}; my edit kept=${menuEditKept(kept, 'm1', 21)}; toast="${t.replace(/\s+/g, ' ').slice(0, 90)}"; after Keep cloud device torte=$${shown}; next edit published ceviche=$${d2.boh_shared.menu.items.find(i => i.id === 'm1').price} torte still $${d2.boh_shared.menu.items.find(i => i.id === 'm2').price}`};
}, {seed: cloud});
await T('D7h', 7, 'Photos that exist only on this device do not override cloud photos (kept for review)', async (p, o) => {
  const d = await o.db(); const local = await o.ev(() => STATE.menuPhotos); const kept = await keptOnDevice(o); const w = (await o.writes()).filter(x => /menu_photos/.test(x));
  const cloudUrl = Object.values(cloud.boh_shared.menu_photos.urls)[0]; const k0 = Object.keys(cloud.boh_shared.menu_photos.urls)[0];
  return {pass: d.boh_shared.menu_photos.urls[k0] === cloudUrl && !d.boh_shared.menu_photos.urls.m3 && local[k0] === cloudUrl && w.length === 0 && JSON.stringify(kept.eh_pending_cloud_edits || {}).includes('https://local.example/m3.jpg'), evidence: `cloud ${k0}=${d.boh_shared.menu_photos.urls[k0] === cloudUrl ? 'kept' : 'CHANGED'}; device ${k0}=${local[k0] === cloudUrl ? 'cloud photo' : local[k0]}; local-only m3 kept for review=${JSON.stringify(kept.eh_pending_cloud_edits || {}).includes('https://local.example/m3.jpg')}; photo writes=${w.length}`};
}, {seed: cloud, login: 'EPICUREAN2024', extraHead: `<script>localStorage.setItem('eh_menu_photos', JSON.stringify({${JSON.stringify(Object.keys(cloud.boh_shared.menu_photos.urls)[0])}: 'https://local.example/stale.jpg', m3: 'https://local.example/m3.jpg'}));</script>`});
await T('D7i', 7, 'Boot with the cloud down, edit, then Retry cloud sync → the edit needs review and is never auto-published', async (p, o) => {
  await editItemPrice(p, o, 'm1', 21);
  await o.ev(() => { window.__MOCK_FAIL_READS__ = false; }); const retried = await banner(p, 'Retry cloud sync'); await p.waitForTimeout(600);
  const row = p.locator('.cloud-edit-row', {hasText: /menu/i}).first(); const shown = await row.count(); const canPublish = shown ? await row.getByRole('button', {name: 'Publish my change'}).count() : -1;
  const d = await o.db(); const local = await o.ev(() => STATE.menuItems.find(i => i.id === 'm2').price); const w = (await o.writes()).filter(x => /boh_shared\/menu$/.test(x));
  return {pass: retried && shown === 1 && canPublish === 0 && d.boh_shared.menu.items.find(i => i.id === 'm1').price === 18 && local === 99 && w.length === 0, evidence: `retry tapped=${retried}; review row=${shown}; publish offered=${canPublish} (base unknown, cloud exists); cloud ceviche=$${d.boh_shared.menu.items.find(i => i.id === 'm1').price}; device now shows cloud torte=$${local}; menu writes=${w.length}`};
}, {seed: cloud, failReads: true});
// ---- 8. Modifier editor ----
await T('D8a', 8, 'Delete option ✕ removes it; other ids, prices and allergens stay attached', async (p, o) => {
  await o.ev(() => { const g = STATE.modGroups.find(x => x.id === 'mg_add'); g.options[0].allergens = ['Dairy']; g.options[1].allergens = ['Pork']; g.options[2].allergens = ['Avocado']; });
  await openMod(p, o, 'mg_add'); const before = await optionsOf(o, 'mg_add');
  await p.locator('.mm-mod-opt').first().locator('button').click(); await p.waitForTimeout(400);
  await o.ev(() => mmFlush()); await p.waitForTimeout(200); const after = await optionsOf(o, 'mg_add');
  const ok = after.length === 2 && after[0].id === 'mo_bac' && after[0].name === 'Bacon' && after[0].allergens.join() === 'Pork' && after[0].up === 2 && after[1].id === 'mo_avo' && after[1].name === 'Avocado' && after[1].allergens.join() === 'Avocado';
  return {pass: ok, evidence: `before=${JSON.stringify(before.map(x => x.id + '=' + x.name + ':' + x.allergens))} after=${JSON.stringify(after.map(x => x.id + '=' + x.name + ':' + x.allergens + ':$' + x.up))}`};
});
await T('D8b', 8, '+ Add option adds a row; saving creates a new option without disturbing others', async (p, o) => {
  await openMod(p, o, 'mg_add'); const n0 = await p.locator('.mm-mod-opt').count();
  await p.getByRole('button', {name: /\+ ?(Add )?option/i}).first().click(); await p.waitForTimeout(400);
  const n1 = await p.locator('.mm-mod-opt').count();
  await p.locator('.mopt-name').last().fill('Fried Egg'); await p.locator('.mopt-up').last().fill('2');
  await o.ev(() => mmSaveModFromForm('mg_add', true)); await p.waitForTimeout(300); const after = await optionsOf(o, 'mg_add');
  return {pass: n1 === n0 + 1 && after.length === 4 && after.slice(0, 3).map(x => x.id).join() === 'mo_chz,mo_bac,mo_avo' && after[3].name === 'Fried Egg' && after[3].up === 2 && !['mo_chz', 'mo_bac', 'mo_avo'].includes(after[3].id), evidence: `rows ${n0}→${n1}; options=${JSON.stringify(after.map(x => x.id + '=' + x.name + ':$' + x.up))}`};
});
await T('D8c', 8, 'Renaming an option keeps its id and allergens and resets verification', async (p, o) => {
  await o.ev(() => { const g = STATE.modGroups.find(x => x.id === 'mg_add'); g.options[0].allergens = ['Dairy']; g.options[0].verified = true; g.options[0].itemRef = {sourceType: 'retail', sourceId: 'r1'}; });
  await openMod(p, o, 'mg_add'); await p.locator('.mopt-name').first().fill('Aged Cheddar'); await o.ev(() => mmSaveModFromForm('mg_add', true)); await p.waitForTimeout(300);
  const o0 = await o.ev(() => STATE.modGroups.find(x => x.id === 'mg_add').options[0]);
  return {pass: o0.id === 'mo_chz' && o0.name === 'Aged Cheddar' && (o0.allergens || []).join() === 'Dairy' && o0.verified === false, evidence: JSON.stringify(o0)};
});
await T('D8d', 8, 'Opening the Voice tab does not modify saved modifier data or write to the cloud', async (p, o) => {
  await o.ev(() => go('menu')); await p.waitForTimeout(500); const before = await o.ev(() => JSON.stringify(STATE.modGroups)); const w0 = (await o.writes()).length;
  await p.getByRole('button', {name: 'Voice', exact: true}).first().click(); await p.waitForTimeout(800);
  const after = await o.ev(() => JSON.stringify(STATE.modGroups)); const w = (await o.writes()).slice(w0);
  return {pass: before === after && w.length === 0, evidence: `modGroups unchanged=${before === after}; writes caused by opening Voice=${JSON.stringify(w)}`};
});
const verifiedCheeseCloud = (() => { const c = JSON.parse(JSON.stringify(cloud)); const g = c.boh_shared.menu.modGroups.find(x => x.id === 'mg_add'); g.options[0].verified = true; g.options[0].allergens = ['Dairy']; return c; })();
await T('D8e', 8, 'Corrupt modifier records (duplicate id; renamed option still verified) are refused at publish', async (p, o) => {
  await o.ev(() => { const g = STATE.modGroups.find(x => x.id === 'mg_add'); g.options[1].id = g.options[0].id; }); // what the old ✕ delete produced: ids shifted onto other options
  await o.ev(() => go('menu')); await p.waitForTimeout(400); await p.getByRole('button', {name: 'Publish all changes'}).first().click(); await p.waitForTimeout(800);
  const t1 = await o.toast(); const d1 = await o.db();
  await o.ev(() => { const g = STATE.modGroups.find(x => x.id === 'mg_add'); g.options[1].id = 'mo_bac'; g.options[0].name = 'Aged Cheddar'; g.options[0].verified = true; });
  await p.getByRole('button', {name: 'Publish all changes'}).first().click(); await p.waitForTimeout(800);
  const t2 = await o.toast(); const d2 = await o.db(); const opt = d2.boh_shared.menu.modGroups.find(g => g.id === 'mg_add').options;
  return {pass: JSON.stringify(d1.boh_shared.menu) === JSON.stringify(verifiedCheeseCloud.boh_shared.menu) && JSON.stringify(d2.boh_shared.menu) === JSON.stringify(verifiedCheeseCloud.boh_shared.menu) && /used twice/.test(t1) && /still marked verified/.test(t2), evidence: `dup id: cloud menu unchanged=${JSON.stringify(d1.boh_shared.menu) === JSON.stringify(verifiedCheeseCloud.boh_shared.menu)} toast="${t1.replace(/\s+/g, ' ').slice(0, 110)}"; renamed+verified: cloud unchanged=${JSON.stringify(d2.boh_shared.menu) === JSON.stringify(verifiedCheeseCloud.boh_shared.menu)} options=${opt.map(x => x.id + '=' + x.name).join(',')} toast="${t2.replace(/\s+/g, ' ').slice(0, 110)}"`};
}, {seed: verifiedCheeseCloud});
// ---- Regression on existing working BOH functions ----
await T('R1', 'reg', 'Item price edit → Publish all changes reaches boh_shared/menu', async (p, o) => {
  await o.ev(() => go('menu')); await p.waitForTimeout(400); await o.ev(() => mmSelect('item', 'm2')); await p.waitForTimeout(300);
  await p.locator('#ie-price').fill('13.5'); await o.ev(() => mmSaveItemFromForm('m2', true)); await p.getByRole('button', {name: 'Publish all changes'}).first().click(); await p.waitForTimeout(700);
  const d = await o.db(); return {pass: d.boh_shared.menu.items.find(i => i.id === 'm2').price === 13.5, evidence: `published torte=$${d.boh_shared.menu.items.find(i => i.id === 'm2').price}`};
}, {seed: cloud});
await T('R2', 'reg', 'Prix fixe price edit, add item, floor publish', async (p, o) => {
  await o.ev(() => go('menu')); await p.waitForTimeout(400); await o.ev(() => mmSelect('pfmenu', 'pf_scalini_89')); await p.waitForTimeout(300); await p.locator('#pf-price').fill('95'); await o.ev(() => mmSavePfMenu('pf_scalini_89', true));
  const n0 = await o.ev(() => STATE.menuItems.length); await o.ev(() => mmAddItem('c_des')); await p.waitForTimeout(300); const n1 = await o.ev(() => STATE.menuItems.length);
  await o.ev(() => go('floor')); await p.waitForTimeout(400); await o.ev(() => { addFloorObj('table-round'); flushFloorCloud(); }); await p.waitForTimeout(600);
  await o.ev(() => publishMenusToFrontOfHouse()); await p.waitForTimeout(500); const d = await o.db();
  return {pass: d.boh_shared.prix_fixe_menus.list.find(x => x.id === 'pf_scalini_89').price === 95 && n1 === n0 + 1 && Object.values(d.boh_shared.tables.roomObjs).flat().length > Object.values(cloud.boh_shared.tables.roomObjs).flat().length, evidence: `pf=$${d.boh_shared.prix_fixe_menus.list.find(x => x.id === 'pf_scalini_89').price}; items ${n0}→${n1}; floor objects=${Object.values(d.boh_shared.tables.roomObjs).flat().length}`};
}, {seed: cloud});
await T('R3', 'reg', 'Owner login; wrong code refused; floor map renders from cloud', async (p, o) => {
  const u = await o.ev(() => SESSION.user && SESSION.user.name); await o.ev(() => go('floor')); await p.waitForTimeout(400);
  const n = await o.ev(() => allTables().length); return {pass: u === 'Owner' && n === Object.values(cloud.boh_shared.tables.roomObjs).flat().filter(x => /table|stool|outdoor|couch/.test(x.type)).length, evidence: `user=${u}; tables=${n}`};
}, {seed: cloud});

const summary = {label, at: new Date().toISOString(), boh: rev(), passed: results.filter(r => r.pass).length, failed: results.filter(r => !r.pass).length, results};
fs.appendFileSync(HERE + 'runs.jsonl', JSON.stringify(summary) + '\n');
console.log(`\n${label}: ${summary.passed} passed, ${summary.failed} failed (BOH ${summary.boh})`);
await browser.close();
