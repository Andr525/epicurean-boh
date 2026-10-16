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

async function boh({seed = {}, failReads = false, login = 'EPICUREAN2024'} = {}) {
  const extra = failReads ? '<script>window.__MOCK_FAIL_READS__=true;</script>' : '';
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
