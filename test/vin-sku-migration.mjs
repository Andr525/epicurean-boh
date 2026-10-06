import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
global.window = globalThis;
require(path.join(root, 'cellar.js'));
const data = globalThis.BINWISE_CELLAR;
const wines = data.wines.filter((w) => String(w.id).length < 80);
const monster = data.wines.find((w) => String(w.id).length > 80);

assert.equal(data.wines.reduce((n, w) => n + (Number(w.bottlePrice) || 0), 0), 7412595);
assert.equal(data.wines.reduce((n, w) => n + (Number(w.stock) || 0), 0), 28038);
assert.equal(data.wines.reduce((n, w) => n + (Number(w.ozOnHand) || 0), 0), 747697.4);
assert.equal(data.v, 'binwise-375-park-v3');
assert.equal(data.wines.length, 3612);
const byId = Object.fromEntries(wines.map((w) => [w.id, w]));
assert.equal(byId.w2148NV750ml.vin, '2148');
assert.equal(byId.w2148NV375ml.vin, '400');
assert.equal(byId.w15542021750ml.vin, '100');
assert.equal(byId.w179182024750ml.vin, '101');
assert.equal(byId.w161362022750ml.vin, '200');
assert.equal(byId.w162702022750ml.vin, '201');
assert.equal(byId.w92822018375ml.vin, '500');
assert.equal(byId.w15541999750ml.vin, '1554');
assert.equal(byId.w179182018750ml.vin, '17918');
assert.equal(byId.w2148NV375ml.name, 'Grande Cuvée (375ml)');
assert.equal(byId.w2148NV375ml.bottlePrice, 275);
assert.equal(byId.w2148NV375ml.stock, 12);

const counts = {};
wines.forEach((w) => {
  if (!/^\d+$/.test(String(w.vin))) return;
  counts[w.vin] = (counts[w.vin] || 0) + 1;
});
assert.deepEqual(Object.keys(counts).filter((vin) => counts[vin] > 1).sort(), ['9416']);
Object.keys(counts).forEach((vin) => {
  const n = Number(vin);
  assert.ok(n < 20000 || n > 20257, 'temporary VIN remains ' + vin);
});
assert.equal(byId.wx6e6df6d12021750ml.vin, 'x6e6df6d1');
assert.equal(byId.wxe9bc315bNV750ml.vin, 'xe9bc315b');
assert.match(monster.name, /Hibiki/);
const hibiki = data.spirits.find((b) => b.id === 'sphibikiHarmony');
assert.equal(hibiki.stock, 4);
assert.equal(hibiki.price, 24);
assert.equal(fs.readFileSync(path.join(root, 'voice-vocab.js'), 'utf8').includes('20007'), false);

console.log('vin-sku-migration.mjs ok');
