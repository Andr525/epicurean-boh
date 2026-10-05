import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const voice = require(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'voice-vocab.js'));

const now = new Date('2026-10-04T19:00:00');
assert.equal(voice.dailySpecialIsLive({ name: 'Venison', active: true }, now), true);
assert.equal(voice.dailySpecialIsLive({ name: 'Venison' }, now), true);
assert.equal(voice.dailySpecialIsLive({ name: 'Venison', active: false }, now), false);
assert.equal(voice.dailySpecialIsLive({ name: 'Venison', active: true, activeFrom: '2026-10-05' }, now), false);
assert.equal(voice.dailySpecialIsLive({ name: 'Venison', active: true, activeTo: '2026-10-03' }, now), false);
assert.equal(voice.dailySpecialIsLive({ name: 'Venison', active: true, activeFrom: '2026-10-01', activeTo: '2026-10-10' }, now), true);

function saveDailySpecialsShape(list) {
  return { list: list, updatedAt: Date.now() };
}
const payload = saveDailySpecialsShape([
  {
    id: 'ds1', name: 'Venison special', shortName: 'Venison', desc: 'Cranberry',
    price: 42, course: 'Piatti Principale', station: 'Grill',
    voiceKeyword: 'VENISON', voiceAliases: ['DEER'], askTemp: 'steak',
    modGroupIds: [], ingredients: 'venison', allergens: [], diet: [],
    active: true, activeFrom: '2026-10-04', activeTo: '', createdAt: Date.now()
  }
]);
assert.ok(Array.isArray(payload.list));
assert.equal(typeof payload.updatedAt, 'number');
assert.equal(payload.list[0].voiceKeyword, 'VENISON');
assert.equal(payload.list[0].active, true);

console.log('daily-specials.mjs ok');
