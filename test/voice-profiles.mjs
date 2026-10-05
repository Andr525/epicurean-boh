/* Stage A — BOH Voice profile schema, seed, suggestions, collisions,
   modifier metadata, and versioned snapshot publication. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

global.window = globalThis;
require(path.join(root, 'cellar.js'));
require(path.join(root, 'scalini-dining.js'));
const voice = require(path.join(root, 'voice-vocab.js'));
const VP = require(path.join(root, 'voice-profiles.js'));

const CELLAR = globalThis.BINWISE_CELLAR;
const SCALINI = globalThis.EPICUREAN_SCALINI;
const log = [];
function section(name) { log.push('— ' + name); }
function clone(v) { return JSON.parse(JSON.stringify(v)); }

/* The fixture is the real Build 55 shape: printed by-the-glass list, the 375
   Park Ave cellar, bar kinds, flights, scoops, prix fixe and tasting dishes. */
function fixtureState() {
  return {
    bar: clone([
      { id: 'b1', code: 'C01', kind: 'Cocktail', name: 'Pisco Sour', price: 14, stock: 40, active: true },
      { id: 'b2', code: 'B01', kind: 'Beer', name: 'Local Lager', price: 8, stock: 120, active: true },
      { id: 'b3', code: 'S01', kind: 'Spirit', name: 'Reposado Tequila', price: 12, stock: 60, lin: '4821', active: true },
      { id: 'b4', kind: 'Cocktail', name: 'Negroni Sbagliato', price: 16, stock: 10, active: false }
    ].concat(CELLAR.beers.slice(0, 3)).concat(CELLAR.spirits.slice(0, 3))),
    wines: clone(CELLAR.wines).concat([
      { id: 'wglass1', vin: '40001', name: 'House Vermentino', varietal: 'Vermentino', glassPrice: 16, bottlePrice: 60, stock: 12, active: true }
    ]),
    wineFlights: [{ id: 'fl_chablis', name: 'Chablis Flight', price: 38, pourOz: 2, wines: [] }],
    menuItems: [
      { id: 'm_bass', name: 'Sea Bass Ceviche', price: 22, active: true },
      { id: 'm_wagyu', name: 'Wagyu Burger', price: 34, active: true }
    ],
    prixFixeMenus: [{
      id: 'pf1', name: 'Scalini',
      dishes: (SCALINI.prixFixe.dishes || []).map((d) => ({ id: d.id, name: d.name, course: d.course }))
    }],
    tastingMenus: [{
      id: 'tm1', name: 'Tasting',
      courses: (SCALINI.tasting.courses || []).map((c) => ({
        id: c.dishId || c.id, name: c.name, group: c.group, headingOnly: c.headingOnly
      }))
    }],
    dailySpecials: [
      { id: 'ds_venison', name: 'Venison special', course: 'Piatti Principale', price: 42, active: true },
      { id: 'ds_old', name: 'Retired lamb special', course: 'Piatti Principale', price: 38, active: false }
    ],
    retail: [{ id: 'r1', name: 'Bonbon box', category: 'Bonbons', price: 28, active: true }],
    modGroups: [
      { id: 'mg_meat_temp', name: 'Meat temperature', required: true, multi: false, options: [
        { id: 'mo_rare', name: 'Rare', up: 0 }, { id: 'mo_mr', name: 'Medium rare', up: 0 }
      ] },
      { id: 'mg_sides', name: 'Sides', required: false, multi: true, options: [
        { id: 'mo_truffle', name: 'Add truffle', up: 18 }, { id: 'mo_spinach', name: 'Creamed spinach', up: 0 }
      ] }
    ]
  };
}

function fixtureSources(state) {
  return VP.collectVoiceSources({ state: state, scalini: SCALINI });
}

/* ============================================================
   1. Seed: one-time, versioned, idempotent, non-destructive
   ============================================================ */
section('seed');
{
  const state = fixtureState();
  const sources = fixtureSources(state);
  const store = VP.emptyProfileStore();

  const first = VP.seedVoiceProfiles(store, sources, { now: 1000 });
  assert.equal(first.changed, true, 'first seed runs');
  assert.equal(first.alreadySeeded, false);
  assert.equal(store.seeds[VP.SEED_VERSION], 1000, 'seed is version stamped');
  assert.equal(store.schemaVersion, VP.SCHEMA_VERSION);

  const approvedIds = Object.keys(voice.APPROVED_KEYWORDS);
  approvedIds.forEach((id) => {
    const matches = sources.filter((s) => s.sourceId === id);
    assert.ok(matches.length, 'approved id ' + id + ' resolves to a live source');
    // The same dish identity can sit on both the prix fixe and tasting menus;
    // every place it appears must carry the approved keyword.
    matches.forEach((src) => {
      const p = VP.getProfile(store, src.sourceType, id);
      assert.ok(p, 'profile exists for ' + src.sourceType + ':' + id);
      assert.equal(p.voiceKeyword, voice.normKeyword(voice.APPROVED_KEYWORDS[id]), 'seeded keyword for ' + id);
      assert.equal(p.origin, 'seed');
      assert.equal(p.seedVersion, VP.SEED_VERSION);
      assert.equal(p.sourceId, id, 'profile keys off the existing item identity');
    });
  });
  const sharedIdentities = approvedIds.filter((id) => sources.filter((s) => s.sourceId === id).length > 1);
  assert.ok(sharedIdentities.length > 0, 'Build 55 shares dish identities across menus');
  log.push('  ' + sharedIdentities.length + ' dish identities appear on more than one menu and are seeded in each place');
  assert.deepEqual(
    VP.getProfile(store, 'pfdish', 'sf_d_formaggio').voiceAliases,
    ['GORGONZOLA', 'PARMIGIANO', 'MOZZARELLA'], 'approved aliases are seeded'
  );
  log.push('  seeded ' + first.added + ' profiles from ' + approvedIds.length + ' approved ids');

  // Idempotence: a second run is a no-op, byte for byte.
  const after = clone(store);
  const second = VP.seedVoiceProfiles(store, sources, { now: 2000 });
  assert.equal(second.changed, false, 'second seed is a no-op');
  assert.equal(second.alreadySeeded, true);
  assert.deepEqual(store, after, 'second seed mutates nothing');

  // Manager edit then a forced re-run of the same seed version.
  VP.upsertProfile(store, sources.filter((s) => s.sourceId === 'btg_spark_beck')[0],
    { voiceKeyword: 'graham', voiceAliases: 'bubbles, brut' }, { now: 3000 });
  const edited = VP.getProfile(store, 'btg', 'btg_spark_beck');
  assert.equal(edited.voiceKeyword, 'GRAHAM', 'manager edit is normalized and stored');
  assert.deepEqual(edited.voiceAliases, ['BUBBLES', 'BRUT']);
  assert.equal(edited.origin, 'manager');

  const forced = VP.seedVoiceProfiles(store, sources, { now: 4000, force: true });
  assert.equal(forced.changed, true, 'forced re-seed runs');
  assert.equal(VP.getProfile(store, 'btg', 'btg_spark_beck').voiceKeyword, 'GRAHAM',
    'seed never overwrites a manager-edited keyword');
  assert.deepEqual(VP.getProfile(store, 'btg', 'btg_spark_beck').voiceAliases, ['BUBBLES', 'BRUT'],
    'seed never overwrites manager-edited aliases');
  assert.ok(forced.preserved > 0, 'forced re-seed reports preserved manager values');
  log.push('  forced re-seed preserved ' + forced.preserved + ' existing values');

  // A store that already holds values but has never recorded the seed version.
  const partial = VP.emptyProfileStore();
  VP.upsertProfile(partial, sources.filter((s) => s.sourceId === 'btg_port_bin27')[0],
    { voiceKeyword: 'BINTWENTYSEVEN' }, { now: 10 });
  VP.seedVoiceProfiles(partial, sources, { now: 20 });
  assert.equal(VP.getProfile(partial, 'btg', 'btg_port_bin27').voiceKeyword, 'BINTWENTYSEVEN',
    'pre-existing nonblank value survives the first seed');
  assert.equal(VP.getProfile(partial, 'btg', 'btg_port_croft').voiceKeyword, 'CROFT',
    'blank neighbours still get the approved keyword');
}

/* ============================================================
   2. Family coverage and editable persistence
   ============================================================ */
section('families');
{
  const state = fixtureState();
  const sources = fixtureSources(state);
  const counts = {};
  VP.FAMILIES.forEach((f) => { counts[f.id] = VP.sourcesByFamily(sources, f.id).length; });

  // Every beverage family that exists in Build 55 data is represented.
  ['btg-sparkling', 'btg-white', 'btg-red', 'btg-library', 'btg-dessert', 'btg-port',
    'cocktail', 'beer', 'spirit', 'wine-bottle', 'wine-flight'].forEach((id) => {
    assert.ok(counts[id] > 0, 'family ' + id + ' has sources');
    assert.ok(VP.familyInfo(id).beverage, 'family ' + id + ' is a beverage family');
  });
  assert.equal(counts['btg-sparkling'], 3);
  assert.equal(counts['btg-white'], 4);
  assert.equal(counts['btg-red'], 3);
  assert.equal(counts['btg-library'], 3);
  assert.equal(counts['btg-dessert'], 4);
  assert.equal(counts['btg-port'], 4);
  assert.equal(counts['wine-bottle'], CELLAR.wines.length + 1);
  assert.equal(counts['wine-flight'], 1);
  assert.equal(counts['gelato-scoop'], 6);

  // Catch-all families stay reachable so a new group cannot fall out of the UI.
  assert.equal(VP.familyFor('btg', { group: 'Orange Wine' }), 'btg-other');
  assert.equal(VP.familyFor('bar', { kind: 'Amaro' }), 'bar-other');
  assert.equal(VP.familyFor('bar', { kind: 'Coffee' }), 'coffee');
  assert.equal(VP.familyFor('bar', { kind: 'mocktail' }), 'mocktail');
  assert.equal(VP.familyFor('bar', { kind: 'after-dinner' }), 'after-dinner');
  assert.equal(VP.familyFor('bar', { kind: 'soft' }), 'soft-drink');
  assert.equal(VP.familyFor('btg', { group: 'Port' }), 'btg-port');
  assert.equal(VP.familyFor('bar', { kind: 'Spirit' }), 'spirit');
  assert.equal(counts['btg-other'], 0);
  assert.equal(counts['bar-other'], 0);
  assert.equal(counts['coffee'], 0, 'coffee is a family without inventing bar inventory');
  assert.equal(counts['mocktail'], 0);
  assert.equal(counts['after-dinner'], 0);
  assert.equal(counts['soft-drink'], 0);
  const salmonPf = VP.findSource(sources, 'sf_w_salmon', 'pfdish');
  const salmonTm = VP.findSource(sources, 'sf_w_salmon', 'tmcourse');
  assert.equal(salmonPf.sourceType, 'pfdish');
  assert.equal(salmonTm.sourceType, 'tmcourse');
  assert.notEqual(salmonPf.key, salmonTm.key, 'shared dish ids stay separate profiles');

  // Every beverage family shares one spoken scope, so a keyword is unique
  // across the whole drinks list rather than only inside its own group.
  VP.beverageFamilies().forEach((f) => assert.equal(VP.scopeFor(f.id), 'beverage'));
  // Build 55 keeps prix fixe, tasting, à la carte, specials, and scoops in
  // separate contexts, so the scopes stay separate too.
  assert.equal(VP.scopeFor('pf-dish'), 'pf');
  assert.equal(VP.scopeFor('tasting-course'), 'tasting');
  assert.equal(VP.scopeFor('food'), 'food');
  assert.equal(VP.scopeFor('daily-special'), 'special');
  assert.equal(VP.scopeFor('gelato-scoop'), 'scoop');

  // Editable persistence for every beverage family, surviving a JSON round-trip.
  const store = VP.emptyProfileStore();
  VP.seedVoiceProfiles(store, sources, { now: 1 });
  const edits = [];
  VP.beverageFamilies().forEach((f, i) => {
    const src = VP.sourcesByFamily(sources, f.id)[0];
    if (!src) return;
    const kw = 'FAMTEST' + i;
    VP.upsertProfile(store, src, { voiceKeyword: kw, voiceAliases: ['ALIAS' + i] }, { now: 100 + i });
    edits.push([src.sourceType, src.sourceId, kw, 'ALIAS' + i]);
  });
  const reloaded = VP.normalizeProfileStore(JSON.parse(JSON.stringify(store)));
  edits.forEach((e) => {
    const p = VP.getProfile(reloaded, e[0], e[1]);
    assert.equal(p.voiceKeyword, e[2], 'edited keyword persists for ' + e[1]);
    assert.deepEqual(p.voiceAliases, [e[3]], 'edited aliases persist for ' + e[1]);
    assert.equal(p.origin, 'manager');
  });
  log.push('  ' + edits.length + ' beverage families edited and round-tripped');

  // A manager clear stays on the profile. The stale dish keyword must not win.
  const salmon = sources.filter((s) => s.sourceType === 'pfdish' && s.sourceId === 'sf_w_salmon')[0];
  VP.upsertProfile(store, salmon, { voiceKeyword: 'LOX', voiceAliases: ['CURED'] }, { now: 180 });
  const staleDish = { voiceKeyword: 'SMOKED', voiceAliases: [] };
  const shown = VP.editorVoice(VP.getProfile(store, 'pfdish', 'sf_w_salmon'), staleDish);
  assert.equal(shown.voiceKeyword, 'LOX');
  assert.deepEqual(shown.voiceAliases, ['CURED']);
  assert.equal(shown.fromProfile, true);
  VP.upsertProfile(store, salmon, shown, { now: 190 });
  assert.equal(VP.getProfile(store, 'pfdish', 'sf_w_salmon').voiceKeyword, 'LOX', 'saving the editor value keeps the manager keyword');
  VP.upsertProfile(store, salmon, { voiceKeyword: '', voiceAliases: [] }, { now: 200 });
  const cleared = VP.editorVoice(VP.getProfile(store, 'pfdish', 'sf_w_salmon'), staleDish);
  assert.equal(cleared.voiceKeyword, '', 'a cleared profile hides the stale dish keyword');
  assert.deepEqual(cleared.voiceAliases, []);
  VP.seedVoiceProfiles(store, sources, { now: 210, force: true });
  assert.equal(VP.getProfile(store, 'pfdish', 'sf_w_salmon').voiceKeyword, '', 'seed does not restore a manager-cleared keyword');
  assert.equal(VP.keywordFieldIsUserOwned(VP.getProfile(store, 'pfdish', 'sf_w_salmon'), { voiceKeyword: '' }), true,
    'a cleared profile stays user-owned so a rename cannot suggest over it');
  assert.equal(VP.keywordFieldIsUserOwned(null, { voiceKeyword: '' }), false, 'a brand-new dish can still take a suggestion');
  const untouched = VP.emptyProfileStore();
  untouched.profiles['food:blank'] = { key: 'food:blank', sourceType: 'food', sourceId: 'blank', family: 'food', voiceKeyword: '', voiceAliases: [], active: true, origin: '', seedVersion: '', updatedAt: 1 };
  assert.equal(VP.pruneEmptyProfiles(untouched), 1, 'an untouched empty profile can be pruned');
  assert.equal(VP.pruneEmptyProfiles(store), 0, 'a manager-cleared profile is kept');
  assert.ok(VP.getProfile(store, 'pfdish', 'sf_w_salmon'));
}

/* ============================================================
   3. Suggestions
   ============================================================ */
section('suggestions');
{
  const state = fixtureState();
  const sources = fixtureSources(state);
  const store = VP.emptyProfileStore();
  VP.seedVoiceProfiles(store, sources, { now: 1 });
  const before = clone(store);

  const suggestions = VP.suggestForSources(store, sources);
  assert.deepEqual(store, before, 'suggestions are proposals and never written to the store');

  const byKey = {};
  suggestions.forEach((s) => { byKey[s.key] = s.suggestion; });

  // New eligible beverages get a suggestion.
  assert.equal(byKey['bar:b1'], 'PISCO', 'cocktail suggestion');
  assert.ok(byKey['bar:b2'], 'beer suggestion');
  assert.ok(byKey['bar:b3'], 'spirit suggestion');
  assert.ok(byKey['flight:fl_chablis'], 'flight suggestion');
  assert.equal(byKey['wine:wglass1'], 'VERMENTINO', 'by-the-glass bottle suggestion uses the varietal');
  assert.ok(byKey['food:m_bass'], 'new food item suggestion');
  assert.equal(byKey['special:ds_venison'], 'VENISON', 'daily special suggestion');

  // Inactive sources are skipped.
  assert.equal(byKey['bar:b4'], undefined, 'inactive cocktail gets no suggestion');
  assert.equal(byKey['special:ds_old'], undefined, 'inactive special gets no suggestion');

  // Items that already hold a keyword are left alone.
  assert.equal(byKey['btg:btg_spark_beck'], undefined, 'seeded item needs no suggestion');

  // Cellar bottles stay VIN-addressed: 3612 labels produce no suggestions.
  const bottleSuggestions = suggestions.filter((s) => s.family === 'wine-bottle');
  assert.equal(bottleSuggestions.length, 1, 'only the by-the-glass bottle is suggested');
  assert.equal(VP.isSuggestEligible({ sourceId: 'w1', name: 'Krug', family: 'wine-bottle', active: true }), false);
  assert.equal(VP.isSuggestEligible({ sourceId: 'w1', name: 'Krug', family: 'wine-bottle', active: true, byTheGlass: true }), true);

  // A suggestion never duplicates a keyword already live in its scope.
  const liveBeverage = {};
  Object.keys(store.profiles).forEach((k) => {
    const p = store.profiles[k];
    if (VP.scopeFor(p.family) === 'beverage' && p.voiceKeyword) liveBeverage[p.voiceKeyword] = 1;
  });
  suggestions.filter((s) => VP.scopeFor(s.family) === 'beverage').forEach((s) => {
    assert.ok(!liveBeverage[s.suggestion], s.suggestion + ' must not collide with a live beverage keyword');
  });
  // ...and two suggestions produced in one pass do not collide with each other.
  const seen = {};
  suggestions.forEach((s) => {
    const k = VP.scopeFor(s.family) + '/' + s.suggestion;
    assert.ok(!seen[k], 'suggestion ' + s.suggestion + ' issued twice in ' + VP.scopeFor(s.family));
    seen[k] = 1;
  });

  // A name that would land on a taken keyword is nudged aside.
  const bumpState = fixtureState();
  bumpState.bar.push({ id: 'b_champ', kind: 'Cocktail', name: 'Champagne Fizz', price: 19, active: true });
  const bumpSources = fixtureSources(bumpState);
  const bumped = VP.suggestForSources(store, bumpSources, { family: 'cocktail' })
    .filter((s) => s.sourceId === 'b_champ')[0];
  assert.ok(bumped, 'the new cocktail is suggested');
  assert.notEqual(bumped.suggestion, 'CHAMPAGNE', 'suggestion avoids the live by-the-glass keyword');
  log.push('  ' + suggestions.length + ' suggestions, ' + bottleSuggestions.length + ' of ' + CELLAR.wines.length + ' cellar bottles');

  const coffeeState = fixtureState();
  coffeeState.bar.push({ id: 'cf_new', kind: 'Coffee', name: 'Espresso', price: 5, stock: 10, active: true });
  const coffeeHit = VP.suggestForSources(store, fixtureSources(coffeeState), { family: 'coffee' })
    .filter((s) => s.sourceId === 'cf_new')[0];
  assert.ok(coffeeHit, 'a new coffee item receives a suggestion');
  assert.equal(coffeeHit.suggestion, 'ESPRESSO');
  assert.equal(coffeeState.bar[coffeeState.bar.length - 1].price, 5, 'suggestion does not rewrite the drink price');

  // Family scoping.
  const onlyBeer = VP.suggestForSources(store, sources, { family: 'beer' });
  assert.ok(onlyBeer.length > 0);
  onlyBeer.forEach((s) => assert.equal(s.family, 'beer'));
}

/* ============================================================
   4. Collisions
   ============================================================ */
section('collisions');
{
  const state = fixtureState();
  const sources = fixtureSources(state);
  const store = VP.emptyProfileStore();
  VP.seedVoiceProfiles(store, sources, { now: 1 });

  const clean = VP.detectCollisions(store, sources);
  assert.equal(clean.level, 'ok', 'the approved Build 55 vocabulary is collision free');
  assert.equal(clean.conflicts.length, 0);

  // Build 55 ships Smoked Salmon on both the prix fixe and tasting menus under
  // the one approved keyword. Those contexts are separate, as they were before.
  assert.equal(VP.getProfile(store, 'pfdish', 'sf_w_salmon').voiceKeyword, 'SMOKED');
  assert.equal(VP.getProfile(store, 'tmcourse', 'sf_w_salmon').voiceKeyword, 'SMOKED');
  assert.equal(clean.conflicts.length, 0, 'a dish on two menus is not a collision');

  // Two different dishes on the same menu do collide.
  const samePf = VP.detectCollisions(store, sources, {
    overrides: { 'pfdish:sf_p_fusilli': { sourceType: 'pfdish', sourceId: 'sf_p_fusilli', family: 'pf-dish', name: 'Fusilli', voiceKeyword: 'PORCINI' } }
  });
  assert.equal(samePf.conflicts.length, 1, 'two prix fixe dishes cannot share a keyword');
  assert.equal(samePf.conflicts[0].scope, 'pf');

  // An in-progress edit that duplicates a live beverage keyword warns.
  const dup = VP.detectCollisions(store, sources, {
    overrides: { 'bar:b1': { sourceType: 'bar', sourceId: 'b1', family: 'cocktail', name: 'Pisco Sour', voiceKeyword: 'CHAMPAGNE' } }
  });
  assert.equal(dup.level, 'warn');
  assert.equal(dup.conflicts.length, 1);
  assert.equal(dup.conflicts[0].keyword, 'CHAMPAGNE');
  assert.equal(dup.conflicts[0].scope, 'beverage');
  assert.deepEqual(dup.conflicts[0].items.map((i) => i.key).sort(), ['bar:b1', 'btg:btg_spark_beck']);
  assert.ok(dup.conflicts[0].suggestion, 'a replacement is offered');
  assert.notEqual(voice.normKeyword(dup.conflicts[0].suggestion), 'CHAMPAGNE');

  // An alias collides just like a keyword.
  const aliasDup = VP.detectCollisions(store, sources, {
    overrides: { 'bar:b2': { sourceType: 'bar', sourceId: 'b2', family: 'beer', name: 'Local Lager', voiceKeyword: 'LAGER', voiceAliases: 'PROSECCO' } }
  });
  assert.equal(aliasDup.level, 'warn');
  assert.equal(aliasDup.conflicts[0].keyword, 'PROSECCO');

  // Overrides replace the stored profile instead of doubling it.
  const self = VP.detectCollisions(store, sources, {
    overrides: { 'btg:btg_spark_beck': { sourceType: 'btg', sourceId: 'btg_spark_beck', family: 'btg-sparkling', name: 'Graham Beck Brut', voiceKeyword: 'CHAMPAGNE' } }
  });
  assert.equal(self.conflicts.length, 0, 'an unchanged editor row does not conflict with itself');

  // Scopes are independent: a dish and a drink may share a word.
  const crossScope = VP.detectCollisions(store, sources, {
    overrides: {
      'bar:b1': { sourceType: 'bar', sourceId: 'b1', family: 'cocktail', name: 'Pisco Sour', voiceKeyword: 'MIRROR' },
      'food:m_bass': { sourceType: 'food', sourceId: 'm_bass', family: 'food', name: 'Sea Bass Ceviche', voiceKeyword: 'MIRROR' }
    }
  });
  assert.equal(crossScope.conflicts.length, 0, 'beverage and food scopes do not cross-collide');

  // Two drinks in different families but the same scope do collide.
  const sameScope = VP.detectCollisions(store, sources, {
    overrides: {
      'bar:b1': { sourceType: 'bar', sourceId: 'b1', family: 'cocktail', name: 'Pisco Sour', voiceKeyword: 'MIRROR' },
      'bar:b2': { sourceType: 'bar', sourceId: 'b2', family: 'beer', name: 'Local Lager', voiceKeyword: 'MIRROR' }
    }
  });
  assert.equal(sameScope.conflicts.length, 1, 'cocktail and beer share the beverage scope');
  assert.equal(sameScope.conflicts[0].keyword, 'MIRROR');

  // Switched-off and inactive rows drop out of collision detection.
  const offStore = VP.normalizeProfileStore(clone(store));
  VP.upsertProfile(offStore, sources.filter((s) => s.sourceId === 'btg_spark_beck')[0], { active: false }, { now: 5 });
  const offRes = VP.detectCollisions(offStore, sources, {
    overrides: { 'bar:b1': { sourceType: 'bar', sourceId: 'b1', family: 'cocktail', name: 'Pisco Sour', voiceKeyword: 'CHAMPAGNE' } }
  });
  assert.equal(offRes.conflicts.length, 0, 'an inactive profile frees its keyword');

  const inactiveSourceStore = VP.normalizeProfileStore(clone(store));
  VP.upsertProfile(inactiveSourceStore, { sourceType: 'bar', sourceId: 'b4', family: 'cocktail' }, { voiceKeyword: 'CHAMPAGNE' }, { now: 6 });
  assert.equal(VP.detectCollisions(inactiveSourceStore, sources).conflicts.length, 0,
    'a profile on an inactive item does not collide');
  log.push('  collision matrix verified across scopes, aliases, overrides, and inactive rows');
}

/* ============================================================
   5. Modifier metadata — additive fields and explicit up-price only
   ============================================================ */
section('modifiers');
{
  const group = {
    id: 'mg_sides', name: 'Sides', required: false, multi: true,
    options: [
      { id: 'mo_truffle', name: 'Add truffle', up: 18, voiceAliases: 'truffle, shaved truffle, truffle', itemRef: { sourceType: 'food', sourceId: 'm_bass' } },
      { id: 'mo_spinach', name: 'Creamed spinach', up: 0 },
      { id: 'mo_broken', name: 'Broken ref', up: 4, itemRef: { sourceType: 'food' } }
    ]
  };
  const original = clone(group);
  VP.normalizeModifierVoice(group);

  // Existing configuration is untouched.
  assert.equal(group.id, original.id);
  assert.equal(group.name, original.name);
  assert.equal(group.required, original.required);
  assert.equal(group.multi, original.multi);
  assert.equal(group.options.length, original.options.length);
  group.options.forEach((o, i) => {
    assert.equal(o.id, original.options[i].id, 'option id preserved');
    assert.equal(o.name, original.options[i].name, 'option name preserved');
  });

  // Only the four approved additions appear.
  assert.equal(group.voiceRole, '', 'voiceRole defaults to none');
  assert.deepEqual(group.options[0].voiceAliases, ['TRUFFLE', 'SHAVED TRUFFLE'], 'aliases normalized and deduped');
  assert.deepEqual(group.options[0].itemRef, { sourceType: 'food', sourceId: 'm_bass' }, 'existing-item reference kept');
  assert.deepEqual(group.options[1].voiceAliases, []);
  assert.equal(group.options[2].itemRef, undefined, 'an incomplete reference is dropped');
  assert.deepEqual(
    Object.keys(group.options[0]).sort(),
    ['id', 'itemRef', 'name', 'up', 'voiceAliases'],
    'no field beyond the approved additions is introduced'
  );

  // Up-price stays exactly as configured and is never taken from the ref target.
  assert.equal(group.options[0].up, 18, 'explicit up-price preserved');
  assert.equal(group.options[1].up, 0, 'zero up-price stays zero');
  const refTarget = { id: 'm_bass', price: 22 };
  assert.notEqual(group.options[0].up, refTarget.price, 'up-price is not inferred from the referenced item');
  const blankUp = { id: 'g', name: 'g', options: [{ id: 'o', name: 'o', itemRef: { sourceType: 'food', sourceId: 'm_bass' } }] };
  VP.normalizeModifierVoice(blankUp);
  assert.equal(blankUp.options[0].up, 0, 'an unconfigured up-price stays 0, never the referenced price');

  // Invalid roles normalize away; valid ones survive.
  const roled = { id: 'mg_spirit', name: 'Spirit', required: false, multi: false, voiceRole: 'spirit', options: [{ id: 'mo_goose', name: 'Grey Goose', up: 4 }] };
  VP.normalizeModifierVoice(roled);
  assert.equal(roled.voiceRole, 'spirit');
  roled.voiceRole = 'temperature';
  VP.normalizeModifierVoice(roled);
  assert.equal(roled.voiceRole, '', 'a role outside the beverage contract is rejected');
  ['spirit', 'preparation', 'service', 'garnish', 'mixer'].forEach((role) => {
    assert.ok(VP.MODIFIER_VOICE_ROLES.indexOf(role) > 0, role + ' is an authorized voice role');
  });

  // Round-trip through the published shape.
  const meta = VP.modifierVoiceMetadata([group, { id: 'mg_spirit', name: 'Spirit', required: false, multi: false, voiceRole: 'spirit', options: [{ id: 'mo_goose', name: 'Grey Goose', up: 4, itemRef: { sourceType: 'bar', sourceId: 'b3' } }] }]);
  const reloaded = JSON.parse(JSON.stringify(meta));
  assert.deepEqual(reloaded, meta, 'modifier metadata survives a JSON round-trip');
  assert.deepEqual(reloaded[0], {
    id: 'mg_sides', name: 'Sides', required: false, multi: true, voiceRole: '',
    options: [
      { id: 'mo_truffle', name: 'Add truffle', up: 18, voiceAliases: ['TRUFFLE', 'SHAVED TRUFFLE'], itemRef: { sourceType: 'food', sourceId: 'm_bass' } },
      { id: 'mo_spinach', name: 'Creamed spinach', up: 0 },
      { id: 'mo_broken', name: 'Broken ref', up: 4 }
    ]
  });
  assert.equal(reloaded[1].voiceRole, 'spirit');
  assert.equal(reloaded[1].options[0].up, 4, 'spirit up-price stays explicit');
  assert.deepEqual(reloaded[1].options[0].itemRef, { sourceType: 'bar', sourceId: 'b3' });

  const roleClash = VP.detectModifierCollisions([
    { id: 'mg_spirit', name: 'Spirit', voiceRole: 'spirit', options: [
      { id: 'o1', name: 'Grey Goose' },
      { id: 'o2', name: 'Belvedere', voiceAliases: ['Grey Goose'] }
    ] },
    { id: 'mg_garnish', name: 'Garnish', voiceRole: 'garnish', options: [
      { id: 'o3', name: 'Twist' },
      { id: 'o4', name: 'Grey Goose' }
    ] }
  ]);
  assert.equal(roleClash.conflicts.length, 1, 'a spirit alias collides inside its role');
  assert.equal(roleClash.conflicts[0].keyword, 'GREY GOOSE');
  assert.equal(roleClash.conflicts[0].scope, 'role:spirit');
  assert.deepEqual(roleClash.conflicts[0].items.map((i) => i.key).sort(), ['mg_spirit:o1', 'mg_spirit:o2']);
  const separateRoles = VP.detectModifierCollisions([
    { id: 'mg_prep', name: 'Preparation', voiceRole: 'preparation', options: [{ id: 'o5', name: 'Very Dry' }] },
    { id: 'mg_service', name: 'Service', voiceRole: 'service', options: [{ id: 'o6', name: 'Up' }] },
    { id: 'mg_garnish', name: 'Garnish', voiceRole: 'garnish', options: [{ id: 'o7', name: 'Twist' }] }
  ]);
  assert.equal(separateRoles.conflicts.length, 0, 'preparation, service, and garnish do not cross-collide');
  log.push('  modifier metadata round-trips with explicit up-prices only');
}

/* ============================================================
   6. Snapshot publication — immutable chunks, atomic pointer
   ============================================================ */
section('publication');
{
  const state = fixtureState();
  const sources = fixtureSources(state);
  const store = VP.emptyProfileStore();
  VP.seedVoiceProfiles(store, sources, { now: 1 });

  const snap = VP.buildVoiceSnapshot({ store: store, sources: sources, modGroups: state.modGroups, now: 10, maxChunkEntries: 20 });
  assert.equal(snap.schemaVersion, VP.SCHEMA_VERSION);
  assert.ok(snap.entryCount > 0);
  assert.equal(snap.chunks.length, Math.ceil(snap.entryCount / 20), 'entries split by the chunk limit');
  assert.equal(snap.control.docId, VP.CONTROL_DOC_ID);
  assert.deepEqual(snap.control.data.chunkIds, snap.chunks.map((c) => c.docId), 'control lists its chunks');
  assert.equal(snap.control.data.activeRevision, snap.revision);
  assert.equal(snap.control.data.chunkCount, snap.chunks.length);
  assert.equal(snap.control.data.entryCount, snap.entryCount);
  snap.chunks.forEach((c, i) => {
    assert.equal(c.docId, VP.CHUNK_DOC_PREFIX + snap.revision + '_' + i, 'chunk doc id carries the revision');
    assert.equal(c.data.revision, snap.revision);
    assert.equal(c.data.chunkIndex, i);
    assert.ok(c.data.entries.length <= 20);
    assert.ok(JSON.stringify(c.data).length < VP.CHUNK_BYTE_BUDGET, 'chunk stays under the Firestore budget');
  });
  assert.equal(snap.chunks[0].data.modifiers.length, 2, 'modifier metadata rides in the first chunk');

  // Deterministic: identical content republishes to the identical revision and
  // byte-identical chunk documents, so a chunk is never rewritten in place.
  const again = VP.buildVoiceSnapshot({ store: store, sources: sources, modGroups: state.modGroups, now: 99, maxChunkEntries: 20 });
  assert.equal(again.revision, snap.revision, 'same content keeps the same revision');
  assert.deepEqual(again.chunks.map((c) => c.data), snap.chunks.map((c) => c.data), 'chunk documents are immutable');

  // Same ids, edited metadata → a new revision and new chunk doc ids.
  const edited = VP.normalizeProfileStore(clone(store));
  VP.upsertProfile(edited, sources.filter((s) => s.sourceId === 'btg_spark_beck')[0], { voiceAliases: ['BUBBLES'] }, { now: 50 });
  const snapEdited = VP.buildVoiceSnapshot({ store: edited, sources: sources, modGroups: state.modGroups, now: 10, maxChunkEntries: 20 });
  assert.notEqual(snapEdited.revision, snap.revision, 'an alias edit on the same id yields a new revision');
  assert.equal(snapEdited.entryCount, snap.entryCount, 'the id set is unchanged');
  snapEdited.chunks.forEach((c) => {
    assert.ok(snap.chunks.every((old) => old.docId !== c.docId), 'a new revision never reuses a chunk doc id');
  });

  // A modifier metadata edit alone also produces a new revision.
  const modEdit = clone(state.modGroups);
  modEdit[0].voiceRole = 'preparation';
  const snapMod = VP.buildVoiceSnapshot({ store: store, sources: sources, modGroups: modEdit, now: 10, maxChunkEntries: 20 });
  assert.notEqual(snapMod.revision, snap.revision, 'a modifier voiceRole edit yields a new revision');

  // Inactive profiles and inactive items stay out of the published vocabulary.
  const filtered = VP.normalizeProfileStore(clone(store));
  VP.upsertProfile(filtered, sources.filter((s) => s.sourceId === 'btg_port_croft')[0], { active: false }, { now: 60 });
  VP.upsertProfile(filtered, { sourceType: 'bar', sourceId: 'b4', family: 'cocktail' }, { voiceKeyword: 'NEGRONI' }, { now: 61 });
  VP.upsertProfile(filtered, { sourceType: 'special', sourceId: 'ds_old', family: 'daily-special' }, { voiceKeyword: 'OLDLAMB' }, { now: 62 });
  const snapFiltered = VP.buildVoiceSnapshot({ store: filtered, sources: sources, modGroups: state.modGroups, now: 10 });
  const publishedKeys = {};
  snapFiltered.chunks.forEach((c) => c.data.entries.forEach((e) => { publishedKeys[e.key] = e; }));
  assert.equal(publishedKeys['btg:btg_port_croft'], undefined, 'an inactive profile is not published');
  assert.equal(publishedKeys['bar:b4'], undefined, 'a profile on an inactive drink is not published');
  assert.equal(publishedKeys['special:ds_old'], undefined, 'a profile on an inactive special is not published');
  assert.ok(publishedKeys['btg:btg_port_bin27'], 'active siblings are still published');
  assert.equal(snapFiltered.entryCount, snap.entryCount - 1);
  Object.keys(publishedKeys).forEach((k) => {
    assert.ok(publishedKeys[k].voiceKeyword, 'published entries always carry a keyword');
    assert.ok(publishedKeys[k].scope, 'published entries carry their spoken scope');
  });

  // Blank keywords never reach a chunk.
  const blankStore = VP.normalizeProfileStore(clone(store));
  VP.upsertProfile(blankStore, sources.filter((s) => s.sourceId === 'btg_white_fiano')[0], { voiceKeyword: '' }, { now: 70 });
  const snapBlank = VP.buildVoiceSnapshot({ store: blankStore, sources: sources, modGroups: state.modGroups, now: 10 });
  assert.equal(snapBlank.entryCount, snap.entryCount - 1);

  // Byte budget forces more chunks without losing an entry.
  const tiny = VP.buildVoiceSnapshot({ store: store, sources: sources, modGroups: state.modGroups, now: 10, chunkBudget: 300 });
  assert.ok(tiny.chunks.length > snap.chunks.length, 'a smaller budget produces more chunks');
  assert.equal(tiny.chunks.reduce((n, c) => n + c.data.entries.length, 0), snap.entryCount, 'no entry is lost when rechunking');

  // Publish order: every chunk first, control last.
  const order = [];
  const written = {};
  await VP.publishVoiceSnapshot(snap, {
    writeChunk: (id, data) => { order.push('chunk:' + id); written[id] = data; return Promise.resolve(true); },
    writeControl: (id, data) => { order.push('control:' + id); written[id] = data; return Promise.resolve(true); }
  }).then((r) => {
    assert.equal(r.ok, true);
    assert.equal(r.revision, snap.revision);
    assert.equal(r.chunksWritten.length, snap.chunks.length);
  });
  assert.equal(order.length, snap.chunks.length + 1);
  assert.equal(order[order.length - 1], 'control:' + VP.CONTROL_DOC_ID, 'the pointer flips last');
  order.slice(0, -1).forEach((o) => assert.ok(o.indexOf('chunk:') === 0, 'everything before the pointer is a chunk'));
  assert.equal(written[VP.CONTROL_DOC_ID].activeRevision, snap.revision);
  log.push('  publish wrote ' + snap.chunks.length + ' chunks then flipped activeRevision to ' + snap.revision);

  // Partial-write safety: a failing chunk leaves the old pointer in place.
  const live = { [VP.CONTROL_DOC_ID]: { activeRevision: 'r_previous', chunkCount: 1, chunkIds: ['voice_vocab_r_previous_0'] } };
  const attempted = [];
  let controlWrites = 0;
  let failed = null;
  await VP.publishVoiceSnapshot(snapEdited, {
    writeChunk: (id, data) => {
      attempted.push(id);
      if (attempted.length === 2) return Promise.reject(new Error('network'));
      live[id] = data;
      return Promise.resolve(true);
    },
    writeControl: (id, data) => { controlWrites += 1; live[id] = data; return Promise.resolve(true); }
  }).catch((e) => { failed = e; });
  assert.ok(failed, 'the publish rejects');
  assert.equal(controlWrites, 0, 'the control document is never written after a chunk failure');
  assert.equal(live[VP.CONTROL_DOC_ID].activeRevision, 'r_previous', 'the old active revision still stands');
  assert.equal(attempted.length, 2, 'the write chain stops at the failure');
  assert.ok(live['voice_vocab_' + snapEdited.revision + '_0'], 'the orphaned chunk is inert, not referenced');
  assert.ok(Object.keys(live).every((k) => k === VP.CONTROL_DOC_ID || live[VP.CONTROL_DOC_ID].chunkIds.indexOf(k) < 0 || k.indexOf('r_previous') > 0),
    'nothing overwrote a chunk of the live revision');

  // A writer that reports false rather than throwing is treated as a failure.
  let falseControl = 0;
  let falseErr = null;
  await VP.publishVoiceSnapshot(snap, {
    writeChunk: () => Promise.resolve(false),
    writeControl: () => { falseControl += 1; return Promise.resolve(true); }
  }).catch((e) => { falseErr = e; });
  assert.ok(falseErr, 'a false chunk result rejects');
  assert.equal(falseControl, 0, 'the pointer is untouched when a chunk reports false');
  log.push('  partial-write safety verified: chunk failure leaves r_previous active');
}

/* ============================================================
   7. Stage A touches no POS-facing or operational behaviour
   ============================================================ */
section('containment');
{
  const state = fixtureState();
  const beforeState = clone(state);
  const sources = fixtureSources(state);
  const store = VP.emptyProfileStore();
  VP.seedVoiceProfiles(store, sources, { now: 1 });
  VP.suggestForSources(store, sources);
  VP.detectCollisions(store, sources);
  VP.buildVoiceSnapshot({ store: store, sources: sources, modGroups: state.modGroups, now: 1 });
  assert.deepEqual(state.wines, beforeState.wines, 'wines untouched by the Voice pipeline');
  assert.deepEqual(state.bar, beforeState.bar, 'bar untouched by the Voice pipeline');
  assert.deepEqual(state.wineFlights, beforeState.wineFlights, 'flights untouched');
  assert.deepEqual(state.dailySpecials, beforeState.dailySpecials, 'daily specials untouched');
  assert.deepEqual(state.menuItems, beforeState.menuItems, 'menu items untouched');
  assert.deepEqual(state.retail, beforeState.retail, 'retail untouched');

  // Profiles only ever reference an existing identity.
  const known = {};
  sources.forEach((s) => { known[s.key] = 1; });
  Object.keys(store.profiles).forEach((k) => {
    assert.ok(known[k], 'profile ' + k + ' references a live item identity');
    const p = store.profiles[k];
    assert.deepEqual(Object.keys(p).sort(), [
      'active', 'family', 'key', 'origin', 'seedVersion', 'sourceId', 'sourceType', 'updatedAt', 'voiceAliases', 'voiceKeyword'
    ], 'profile carries only Voice fields');
    assert.equal(p.key, VP.profileKey(p.sourceType, p.sourceId));
  });

  // The published entry shape holds no price, stock, or inventory code.
  const snap = VP.buildVoiceSnapshot({ store: store, sources: sources, modGroups: state.modGroups, now: 1 });
  const allowedEntryKeys = ['family', 'key', 'scope', 'sourceId', 'sourceType', 'voiceAliases', 'voiceKeyword'];
  const entryKeys = {};
  snap.chunks.forEach((c) => c.data.entries.forEach((e) => {
    assert.deepEqual(Object.keys(e).sort(), allowedEntryKeys, 'published entry shape');
    Object.keys(e).forEach((k) => { entryKeys[k] = 1; });
  }));
  assert.deepEqual(Object.keys(entryKeys).sort(), allowedEntryKeys);
  ['price', 'bottlePrice', 'glassPrice', 'stock', 'vin', 'lin', 'cost', 'ozOnHand', 'category']
    .forEach((f) => assert.equal(entryKeys[f], undefined, f + ' must never appear in a chunk entry'));
  log.push('  no operational record mutated; published entries hold Voice fields only');
}

console.log('voice-profiles.mjs ok');
console.log(log.join('\n'));
