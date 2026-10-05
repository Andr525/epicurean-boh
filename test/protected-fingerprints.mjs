/* Stage A protection proof.
   Voice metadata is additive, so every protected record must still hash to the
   Build 55 baseline (origin/main @ 884a884). These fingerprints cover beverage
   ids/counts/categories/prices/stock, VIN/LIN allocation ranges, the wine
   chunking rule, the cellar payload, and the Daily Specials vocabulary. */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function sha(s) { return crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 32); }
function fileSha(name) { return sha(fs.readFileSync(path.join(root, name))); }

/* 1. Files that Stage A is forbidden from touching. */
const PROTECTED_FILE_SHA = {
  'cellar.js': '9f8735ae1e507160b4fa4c3cde9d0901',
  'ops-codes.js': '71ea49b03b8b3bb47146c57fe866772a',
  'scalini-dining.js': '4073c2157582157c0cfc1f817b83decf'
};
Object.keys(PROTECTED_FILE_SHA).forEach((f) => {
  assert.equal(fileSha(f), PROTECTED_FILE_SHA[f], f + ' must not change in Stage A');
});

global.window = globalThis;
require(path.join(root, 'cellar.js'));
require(path.join(root, 'scalini-dining.js'));
const ops = require(path.join(root, 'ops-codes.js'));
const voice = require(path.join(root, 'voice-vocab.js'));

const CELLAR = globalThis.BINWISE_CELLAR;
const SCALINI = globalThis.EPICUREAN_SCALINI;

/* 2. Cellar inventory: ids, VIN, prices, stock, ounces, sizes, active flags. */
function wineFingerprint(list) {
  return sha((list || []).map((w) => [
    w.id, w.vin, w.name, w.vintage, w.region, w.bottlePrice, w.glassPrice,
    w.stock, w.bottleOz, w.ozOnHand, w.openOz, w.size, w.active
  ].join('|')).join('\n'));
}
function barFingerprint(list) {
  return sha((list || []).map((b) => [
    b.id, b.code, b.kind, b.name, b.price, b.cost, b.stock, b.unit, b.bottleOz, b.ozOnHand, b.active
  ].join('|')).join('\n'));
}

const CELLAR_BASELINE = {
  v: 'binwise-375-park-v1',
  wines: 3612,
  beers: 18,
  spirits: 89,
  flights: 0,
  winesSha: 'b3a418113a0ce93ba8ebc6b0ac29337a',
  beersSha: 'ac9bb44a1ab190b52efcc7a752b745f0',
  spiritsSha: '75ae164003018bca6d82738d6fc7e835',
  vinSha: '1691d7027ec0b66b5c422f25c84cce6e',
  bottlePriceTotal: 7412595,
  stockTotal: 28038,
  ozTotal: 747697.4
};
assert.equal(CELLAR.v, CELLAR_BASELINE.v, 'cellar version');
assert.equal(CELLAR.wines.length, CELLAR_BASELINE.wines, 'cellar bottle count');
assert.equal((CELLAR.beers || []).length, CELLAR_BASELINE.beers, 'cellar beer count');
assert.equal((CELLAR.spirits || []).length, CELLAR_BASELINE.spirits, 'cellar spirit count');
assert.equal((CELLAR.flights || []).length, CELLAR_BASELINE.flights, 'cellar flight count');
assert.equal(wineFingerprint(CELLAR.wines), CELLAR_BASELINE.winesSha, 'cellar bottle records');
assert.equal(barFingerprint(CELLAR.beers), CELLAR_BASELINE.beersSha, 'cellar beer records');
assert.equal(barFingerprint(CELLAR.spirits), CELLAR_BASELINE.spiritsSha, 'cellar spirit records');
assert.equal(sha(CELLAR.wines.map((w) => w.vin).join(',')), CELLAR_BASELINE.vinSha, 'cellar VIN sequence');
assert.equal(
  CELLAR.wines.reduce((n, w) => n + (Number(w.bottlePrice) || 0), 0),
  CELLAR_BASELINE.bottlePriceTotal, 'cellar bottle price total'
);
assert.equal(CELLAR.wines.reduce((n, w) => n + (Number(w.stock) || 0), 0), CELLAR_BASELINE.stockTotal, 'cellar stock total');
assert.equal(CELLAR.wines.reduce((n, w) => n + (Number(w.ozOnHand) || 0), 0), CELLAR_BASELINE.ozTotal, 'cellar ounces total');

/* 3. Printed beverage families: by-the-glass groups, prices, approved keywords. */
const BTG_BASELINE = {
  count: 21,
  groups: 'Sparkling:3|White Wine:4|Red Wine:3|Library Selection:3|Dessert:4|Port:4',
  sha: '2947e41786c506d96d9821ff501aae75'
};
const btgGroups = {};
(SCALINI.winesByGlass || []).forEach((w) => { btgGroups[w.group] = (btgGroups[w.group] || 0) + 1; });
assert.equal((SCALINI.winesByGlass || []).length, BTG_BASELINE.count, 'wines-by-the-glass count');
assert.equal(
  Object.keys(btgGroups).map((g) => g + ':' + btgGroups[g]).join('|'),
  BTG_BASELINE.groups, 'wines-by-the-glass families'
);
assert.equal(sha((SCALINI.winesByGlass || []).map((w) => [
  w.id, w.group, w.name, w.producer, w.vintage, w.varietal, w.glassPrice, w.bottlePrice, w.price, w.category, w.station
].join('|')).join('\n')), BTG_BASELINE.sha, 'wines-by-the-glass records');

/* 4. Build 55 approved Voice vocabulary is the seed input and must be verbatim. */
const VOCAB_BASELINE = {
  keywordCount: 65,
  keywordSha: 'a6b54929b24bdacc0c95aeb2006c639e',
  aliasSha: '22025423a9ae12acb65b97f5f6fc2805'
};
assert.equal(Object.keys(voice.APPROVED_KEYWORDS).length, VOCAB_BASELINE.keywordCount, 'approved keyword count');
assert.equal(sha(Object.keys(voice.APPROVED_KEYWORDS).sort().map((k) => k + '=' + voice.APPROVED_KEYWORDS[k]).join('|')), VOCAB_BASELINE.keywordSha, 'approved keywords');
assert.equal(sha(Object.keys(voice.APPROVED_ALIASES).sort().map((k) => k + '=' + voice.APPROVED_ALIASES[k].join(',')).join('|')), VOCAB_BASELINE.aliasSha, 'approved aliases');

/* 5. VIN/LIN semantics and allocation windows. */
assert.equal(ops.VIN_NEW_MIN, 20000);
assert.equal(ops.VIN_NEW_MAX, 89999);
assert.equal(ops.LIN_NEW_MIN, 1000);
assert.equal(ops.LIN_NEW_MAX, 89999);
const vinState = {
  wines: [{ id: 'w1', vin: '2148', name: 'Krug', size: '750ml' }, { id: 'w2', vin: '', name: 'New' }],
  bar: [{ id: 'b1', kind: 'Cocktail', name: 'Pisco Sour' }, { id: 's1', kind: 'Spirit', name: 'Hibiki' }],
  retiredVins: [], retiredLins: []
};
ops.ensureOperationalIds(vinState);
assert.equal(vinState.wines[0].vin, '2148', 'existing VIN is never reassigned');
assert.ok(Number(vinState.wines[1].vin) >= 20000 && Number(vinState.wines[1].vin) <= 89999, 'new VIN window');
assert.equal(vinState.bar[0].lin, undefined, 'cocktails get no LIN');
assert.ok(ops.hasOpsCode(vinState.bar[1].lin), 'spirits get a LIN');

/* 6. Wine chunking rule used by saveWines is unchanged. */
const WINE_CHUNK = 250;
assert.equal(Math.max(1, Math.ceil(CELLAR.wines.length / WINE_CHUNK)), 15, 'cellar still writes 15 wine chunks');

/* 7. Daily Specials availability rules. */
const now = new Date('2026-10-04T19:00:00');
assert.equal(voice.dailySpecialIsLive({ name: 'Venison', active: true }, now), true);
assert.equal(voice.dailySpecialIsLive({ name: 'Venison', active: false }, now), false);
assert.equal(voice.dailySpecialIsLive({ name: 'Venison', active: true, activeFrom: '2026-10-05' }, now), false);
assert.equal(voice.dailySpecialIsLive({ name: 'Venison', active: true, activeTo: '2026-10-03' }, now), false);
assert.equal(voice.dailySpecialIsLive({ name: 'Lunch only', active: true, service: 'lunch' }, now), false);

/* 8. Stage A adds no POS-facing surface: the shared vocabulary API is unchanged. */
assert.deepEqual(Object.keys(voice).sort(), [
  'APPROVED_ALIASES', 'APPROVED_KEYWORDS', 'applyApprovedKeywords', 'applyOntoScalini',
  'dailySpecialIsLive', 'findKeywordConflicts', 'gelatoNeedLabel', 'matchVoiceCatalog',
  'normKeyword', 'normalizeSpokenVin', 'suggestVoiceKeyword'
], 'voice-vocab public API');

console.log('protected-fingerprints.mjs ok');
console.log(JSON.stringify({
  protectedFiles: Object.keys(PROTECTED_FILE_SHA).map((f) => f + '=' + fileSha(f)),
  cellar: { wines: CELLAR.wines.length, beers: CELLAR.beers.length, spirits: CELLAR.spirits.length, winesSha: wineFingerprint(CELLAR.wines) },
  btg: { count: (SCALINI.winesByGlass || []).length, groups: Object.keys(btgGroups).map((g) => g + ':' + btgGroups[g]).join('|') },
  vocab: { approved: Object.keys(voice.APPROVED_KEYWORDS).length }
}, null, 1));
