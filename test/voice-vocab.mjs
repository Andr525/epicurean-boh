import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
require(path.join(root, 'scalini-dining.js'));
const voice = require(path.join(root, 'voice-vocab.js'));

assert.equal(voice.suggestVoiceKeyword('Venison with cranberry sauce'), 'VENISON');
assert.equal(voice.suggestVoiceKeyword('Beef Wellington'), 'WELLINGTON');
const pinot = voice.normKeyword(voice.suggestVoiceKeyword('Pinot Bianco', { kind: 'wine', varietal: 'Pinot Bianco' }));
assert.equal(pinot, 'PINOT BIANCO');

const pfWarn = voice.findKeywordConflicts([
  { id: 'a', name: 'Salmon Forrestiere', keyword: 'SALMON', aliases: [], context: 'pf:Piatti Principale' },
  { id: 'b', name: 'House salmon', keyword: 'SALMON', aliases: [], context: 'pf:Piatti Principale' }
]);
assert.equal(pfWarn.level, 'warn');
assert.ok(pfWarn.suggestion);
assert.notEqual(voice.normKeyword(pfWarn.suggestion), 'SALMON');

const cross = voice.findKeywordConflicts([
  { id: 't', name: 'Tasting salmon', keyword: 'SALMON', aliases: [], context: 'tasting:Courses' },
  { id: 'p', name: 'PF salmon', keyword: 'SALMON', aliases: [], context: 'pf:Piatti Principale' }
]);
assert.notEqual(cross.level, 'reject');
assert.equal(cross.conflicts.length, 0);

const S = globalThis.EPICUREAN_SCALINI;
assert.ok(S);
const byId = {};
(S.prixFixe.dishes || []).forEach((d) => { byId[d.id] = d; });
(S.tasting.courses || []).forEach((c) => { byId[c.dishId || c.id] = c; });
(S.gelatoScoops || []).forEach((s) => { byId[s.id] = s; });
(S.winesByGlass || []).forEach((w) => { byId[w.id] = w; });
Object.keys(voice.APPROVED_KEYWORDS).forEach((id) => {
  const item = byId[id] || { id: id };
  voice.applyApprovedKeywords(item);
  assert.equal(item.voiceKeyword, voice.APPROVED_KEYWORDS[id], id + ' keyword');
});
assert.deepEqual((byId.sf_d_formaggio.voiceAliases || []).map((a) => voice.normKeyword(a)), ['GORGONZOLA', 'PARMIGIANO', 'MOZZARELLA']);
const dolce = (S.tasting.courses || []).find((c) => c.headingOnly || /^dolce$/i.test(c.name));
assert.ok(dolce);
assert.equal(dolce.voiceKeyword || '', '');

console.log('voice-vocab.mjs ok');
