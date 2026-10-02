import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const ops = require(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'ops-codes.js'));

function seedState() {
  return {
    wines: [
      { id: 'w2148', vin: '2148', name: 'Krug Grande Cuvée', size: '750ml' },
      { id: 'w2148m', vin: '2148', name: 'Krug Grande Cuvée', size: '1.5L' },
      { id: 'wnew', vin: '', name: 'House White' }
    ],
    bar: [
      { id: 'b1', kind: 'Cocktail', name: 'Pisco Sour' },
      { id: 's1', kind: 'Spirit', name: 'Hibiki', lin: '' },
      { id: 's2', kind: 'Spirit', name: 'Reposado' }
    ],
    retiredVins: ['55555'],
    retiredLins: ['2746']
  };
}

const state = seedState();
const r = ops.ensureOperationalIds(state);
assert.equal(r.changed, true);
assert.equal(state.wines[0].vin, '2148');
assert.equal(state.wines[1].vin, '2148');
const assigned = String(state.wines[2].vin);
const assignedN = Number(assigned);
assert.ok(assignedN >= ops.VIN_NEW_MIN && assignedN <= ops.VIN_NEW_MAX, 'new VIN in 20000-89999');
assert.notEqual(assigned, '2148');
assert.notEqual(assigned, '55555');
assert.ok(ops.hasOpsCode(state.bar[1].lin));
assert.ok(ops.hasOpsCode(state.bar[2].lin));
assert.notEqual(state.bar[1].lin, state.bar[2].lin);
const hibikiLin = String(state.bar[1].lin);
[state.bar[1].lin, state.bar[2].lin].forEach(function (lin) {
  const n = Number(lin);
  assert.ok(n >= ops.LIN_NEW_MIN && n <= ops.LIN_NEW_MAX, 'LIN in 1000-89999');
  assert.notEqual(lin, '2746');
});
assert.equal(state.bar[0].lin, undefined);

const again = ops.ensureOperationalIds(state);
assert.equal(again.changed, false);
assert.equal(state.wines[2].vin, assigned);

ops.deleteWine(state, 'wnew');
assert.ok(state.retiredVins.indexOf(assigned) >= 0);
assert.ok(!state.wines.some(function (w) { return w.id === 'wnew'; }));
const reused = ops.assignVin(state);
assert.notEqual(reused, assigned);
assert.notEqual(reused, '55555');

ops.deleteBar(state, 's1');
assert.ok(state.retiredLins.indexOf(hibikiLin) >= 0);
assert.ok(!state.bar.some(function (b) { return b.id === 's1'; }));
const newLin = ops.assignLin(state);
assert.notEqual(newLin, hibikiLin);
assert.notEqual(newLin, '2746');

const seen = {};
state.bar.filter(function (b) { return ops.isSpiritBar(b); }).forEach(function (b) {
  if (!b.lin) return;
  assert.ok(!seen[b.lin], 'LIN unique among remaining spirits');
  seen[b.lin] = 1;
});

console.log('ops-codes.mjs ok');
console.log(JSON.stringify({
  keptBinwise: ['2148', '2148'],
  assignedVin: assigned,
  retiredVins: state.retiredVins,
  retiredLins: state.retiredLins,
  remainingSpiritLin: state.bar.filter(function (b) { return ops.isSpiritBar(b); }).map(function (b) { return b.lin; })
}));
