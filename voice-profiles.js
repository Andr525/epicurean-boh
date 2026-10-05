/* Epicurean BOH Voice profiles — Stage A.
   BOH owns Voice metadata. Profiles are additive and reference stable existing
   item identities (sourceType + sourceId); nothing here duplicates a product,
   a price, stock, a VIN/LIN, or any cellar record. */
(function (root) {
  var SCHEMA_VERSION = 1;
  var SEED_VERSION = 'build55-approved-v1';
  var PROFILE_DOC_ID = 'voice_profiles';
  var CONTROL_DOC_ID = 'voice_vocab_active';
  var CHUNK_DOC_PREFIX = 'voice_vocab_';
  var SHARED_COLLECTION = 'boh_shared';
  /* Firestore caps a document at 1 MiB. Stay well under it so a chunk can never
     be rejected for size after the revision id is already committed to. */
  var CHUNK_BYTE_BUDGET = 700000;
  var CHUNK_MAX_ENTRIES = 400;

  /* Every family a Voice profile can belong to. `beverage` families are the
     ones Stage A must cover end to end; the rest are listed so food, specials,
     and scoops keep working against the same store. `suggest` marks families
     where a keyword is the spoken handle. Cellar bottles are addressed by VIN,
     so only a bottle that is also poured by the glass gets a suggestion.
     `scope` is the set a keyword must be unique inside. The prix fixe, tasting,
     à la carte, special, and scoop scopes are kept separate because Build 55
     already ships the same dish on both the prix fixe and tasting menus under
     one approved keyword; collapsing them would flag approved data. */
  var FAMILIES = [
    { id: 'btg-sparkling', label: 'Wine by the glass · Sparkling', sourceType: 'btg', scope: 'beverage', beverage: true, suggest: true, match: 'Sparkling' },
    { id: 'btg-white', label: 'Wine by the glass · White', sourceType: 'btg', scope: 'beverage', beverage: true, suggest: true, match: 'White Wine' },
    { id: 'btg-red', label: 'Wine by the glass · Red', sourceType: 'btg', scope: 'beverage', beverage: true, suggest: true, match: 'Red Wine' },
    { id: 'btg-library', label: 'Wine by the glass · Library Selection', sourceType: 'btg', scope: 'beverage', beverage: true, suggest: true, match: 'Library Selection' },
    { id: 'btg-dessert', label: 'Wine by the glass · Dessert', sourceType: 'btg', scope: 'beverage', beverage: true, suggest: true, match: 'Dessert' },
    { id: 'btg-port', label: 'Wine by the glass · Port', sourceType: 'btg', scope: 'beverage', beverage: true, suggest: true, match: 'Port' },
    { id: 'btg-other', label: 'Wine by the glass · Other', sourceType: 'btg', scope: 'beverage', beverage: true, suggest: true, match: '*' },
    { id: 'cocktail', label: 'Bar · Cocktails', sourceType: 'bar', scope: 'beverage', beverage: true, suggest: true, match: 'Cocktail' },
    { id: 'beer', label: 'Bar · Beer', sourceType: 'bar', scope: 'beverage', beverage: true, suggest: true, match: 'Beer' },
    { id: 'spirit', label: 'Bar · Spirits', sourceType: 'bar', scope: 'beverage', beverage: true, suggest: true, match: 'Spirit' },
    { id: 'mocktail', label: 'Bar · Mocktails', sourceType: 'bar', scope: 'beverage', beverage: true, suggest: true, match: ['mocktail', 'mocktails'] },
    { id: 'coffee', label: 'Bar · Coffee', sourceType: 'bar', scope: 'beverage', beverage: true, suggest: true, match: ['coffee', 'coffees'] },
    { id: 'after-dinner', label: 'Bar · After Dinner', sourceType: 'bar', scope: 'beverage', beverage: true, suggest: true, match: ['after-dinner', 'after dinner'] },
    { id: 'soft-drink', label: 'Bar · Soft Drinks', sourceType: 'bar', scope: 'beverage', beverage: true, suggest: true, match: ['soft', 'soft drink', 'soft drinks'] },
    { id: 'bar-other', label: 'Bar · Other', sourceType: 'bar', scope: 'beverage', beverage: true, suggest: true, match: '*' },
    { id: 'wine-bottle', label: 'Wine by the bottle (cellar · VIN)', sourceType: 'wine', scope: 'beverage', beverage: true, suggest: false, match: '*' },
    { id: 'wine-flight', label: 'Wine flights', sourceType: 'flight', scope: 'beverage', beverage: true, suggest: true, match: '*' },
    { id: 'gelato-scoop', label: 'Gelato & sorbetto scoops', sourceType: 'scoop', scope: 'scoop', beverage: false, suggest: true, match: '*' },
    { id: 'food', label: 'À la carte food', sourceType: 'food', scope: 'food', beverage: false, suggest: true, match: '*' },
    { id: 'pf-dish', label: 'Prix fixe dishes', sourceType: 'pfdish', scope: 'pf', beverage: false, suggest: true, match: '*' },
    { id: 'tasting-course', label: 'Tasting courses', sourceType: 'tmcourse', scope: 'tasting', beverage: false, suggest: true, match: '*' },
    { id: 'daily-special', label: 'Daily Specials', sourceType: 'special', scope: 'special', beverage: false, suggest: true, match: '*' },
    { id: 'retail', label: 'Retail', sourceType: 'retail', scope: 'retail', beverage: false, suggest: false, match: '*' }
  ];

  var FAMILY_BY_ID = {};
  FAMILIES.forEach(function (f) { FAMILY_BY_ID[f.id] = f; });

  function voice() {
    if (root && root.EPICUREAN_VOICE) return root.EPICUREAN_VOICE;
    if (typeof globalThis !== 'undefined' && globalThis.EPICUREAN_VOICE) return globalThis.EPICUREAN_VOICE;
    return null;
  }

  function normKeyword(s) {
    var v = voice();
    if (v) return v.normKeyword(s);
    return String(s == null ? '' : s).toUpperCase().replace(/[^\w\s0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function aliasList(v) {
    if (!v) return [];
    var arr = Array.isArray(v) ? v : String(v).split(/[,;]/);
    var seen = {};
    var out = [];
    arr.forEach(function (a) {
      var n = normKeyword(a);
      if (!n || seen[n]) return;
      seen[n] = 1;
      out.push(n);
    });
    return out;
  }

  function isBlank(s) { return String(s == null ? '' : s).trim() === ''; }

  function profileKey(sourceType, sourceId) {
    return String(sourceType || '') + ':' + String(sourceId || '');
  }

  function familyFor(sourceType, item) {
    item = item || {};
    var bucket = '';
    if (sourceType === 'btg') bucket = String(item.group || '');
    if (sourceType === 'bar') bucket = String(item.kind || '');
    var bucketNorm = bucket.toLowerCase();
    var fallback = null;
    for (var i = 0; i < FAMILIES.length; i++) {
      var f = FAMILIES[i];
      if (f.sourceType !== sourceType) continue;
      if (f.match === '*') { fallback = fallback || f; continue; }
      var matches = Array.isArray(f.match) ? f.match : [f.match];
      for (var j = 0; j < matches.length; j++) {
        if (String(matches[j]).toLowerCase() === bucketNorm) return f.id;
      }
    }
    return fallback ? fallback.id : '';
  }

  function familyInfo(id) { return FAMILY_BY_ID[id] || null; }
  function beverageFamilies() { return FAMILIES.filter(function (f) { return f.beverage; }); }

  function scopeFor(familyId) {
    var f = FAMILY_BY_ID[familyId];
    return f ? f.scope : 'food';
  }

  /* Approved Build 55 ids were minted before profiles existed; when a source is
     no longer in state we still keep its vocabulary rather than dropping it. */
  function inferSourceType(id) {
    var s = String(id || '');
    if (s.indexOf('btg_') === 0) return 'btg';
    if (s.indexOf('scoop_') === 0) return 'scoop';
    if (s.indexOf('sf_') === 0) return 'pfdish';
    if (/^w\d/.test(s)) return 'wine';
    if (s.indexOf('b') === 0 && /^b\d+$/.test(s)) return 'bar';
    return 'food';
  }

  function emptyProfileStore() {
    return { schemaVersion: SCHEMA_VERSION, seeds: {}, profiles: {}, updatedAt: 0 };
  }

  function normalizeProfileStore(raw) {
    var store = emptyProfileStore();
    if (!raw || typeof raw !== 'object') return store;
    store.schemaVersion = Number(raw.schemaVersion) || SCHEMA_VERSION;
    store.seeds = (raw.seeds && typeof raw.seeds === 'object') ? raw.seeds : {};
    store.updatedAt = Number(raw.updatedAt) || 0;
    var profiles = (raw.profiles && typeof raw.profiles === 'object') ? raw.profiles : {};
    Object.keys(profiles).forEach(function (k) {
      var p = profiles[k];
      if (!p) return;
      store.profiles[k] = {
        key: k,
        sourceType: String(p.sourceType || ''),
        sourceId: String(p.sourceId || ''),
        family: String(p.family || ''),
        voiceKeyword: normKeyword(p.voiceKeyword),
        voiceAliases: aliasList(p.voiceAliases),
        active: p.active !== false,
        origin: String(p.origin || ''),
        seedVersion: String(p.seedVersion || ''),
        updatedAt: Number(p.updatedAt) || 0
      };
    });
    return store;
  }

  function getProfile(store, sourceType, sourceId) {
    if (!store || !store.profiles) return null;
    return store.profiles[profileKey(sourceType, sourceId)] || null;
  }

  function blankProfile(src) {
    return {
      key: profileKey(src.sourceType, src.sourceId),
      sourceType: src.sourceType,
      sourceId: src.sourceId,
      family: src.family || familyFor(src.sourceType, src),
      voiceKeyword: '',
      voiceAliases: [],
      active: true,
      origin: '',
      seedVersion: '',
      updatedAt: 0
    };
  }

  /* ---------- source collection: stable existing identities only ---------- */

  function pushSource(out, seen, src) {
    if (!src || !src.sourceId) return;
    var key = profileKey(src.sourceType, src.sourceId);
    if (seen[key]) return;
    seen[key] = 1;
    src.key = key;
    src.family = src.family || familyFor(src.sourceType, src);
    out.push(src);
  }

  function collectVoiceSources(ctx) {
    ctx = ctx || {};
    var state = ctx.state || {};
    var scalini = ctx.scalini || null;
    var out = [];
    var seen = {};

    (scalini && scalini.winesByGlass ? scalini.winesByGlass : []).forEach(function (w) {
      pushSource(out, seen, {
        sourceType: 'btg', sourceId: w.id, name: w.name || '', group: w.group || '',
        varietal: w.varietal || w.grape || '', kind: 'wine', active: w.active !== false,
        seedKeyword: w.voiceKeyword || '', seedAliases: w.voiceAliases || []
      });
    });
    (state.bar || []).forEach(function (b) {
      pushSource(out, seen, {
        sourceType: 'bar', sourceId: b.id, name: b.name || '', kind: b.kind || '',
        active: b.active !== false, seedKeyword: b.voiceKeyword || '', seedAliases: b.voiceAliases || []
      });
    });
    (state.wines || []).forEach(function (w) {
      pushSource(out, seen, {
        sourceType: 'wine', sourceId: w.id, name: w.name || '', varietal: w.varietal || '',
        kind: 'wine', active: w.active !== false,
        byTheGlass: !!(w.byTheGlass || Number(w.glassPrice) > 0),
        seedKeyword: w.voiceKeyword || '', seedAliases: w.voiceAliases || []
      });
    });
    (state.wineFlights || []).forEach(function (f) {
      pushSource(out, seen, {
        sourceType: 'flight', sourceId: f.id, name: f.name || '', active: f.active !== false,
        seedKeyword: f.voiceKeyword || '', seedAliases: f.voiceAliases || []
      });
    });
    (scalini && scalini.gelatoScoops ? scalini.gelatoScoops : []).forEach(function (s) {
      pushSource(out, seen, {
        sourceType: 'scoop', sourceId: s.id, name: s.name || '', active: s.active !== false,
        seedKeyword: s.voiceKeyword || '', seedAliases: s.voiceAliases || []
      });
    });
    (state.menuItems || []).forEach(function (it) {
      pushSource(out, seen, {
        sourceType: 'food', sourceId: it.id, name: it.name || '', active: it.active !== false,
        seedKeyword: it.voiceKeyword || '', seedAliases: it.voiceAliases || []
      });
    });
    (state.prixFixeMenus || []).forEach(function (pf) {
      (pf.dishes || []).forEach(function (d) {
        pushSource(out, seen, {
          sourceType: 'pfdish', sourceId: d.id, name: d.name || '', parentId: pf.id,
          active: d.active !== false && !d.headingOnly,
          seedKeyword: d.voiceKeyword || '', seedAliases: d.voiceAliases || []
        });
      });
    });
    (state.tastingMenus || []).forEach(function (tm) {
      (tm.courses || []).forEach(function (c) {
        pushSource(out, seen, {
          sourceType: 'tmcourse', sourceId: c.dishId || c.id, name: c.name || '', parentId: tm.id,
          active: c.active !== false && !c.headingOnly,
          seedKeyword: c.voiceKeyword || '', seedAliases: c.voiceAliases || []
        });
      });
    });
    (state.dailySpecials || []).forEach(function (s) {
      pushSource(out, seen, {
        sourceType: 'special', sourceId: s.id, name: s.name || '', active: s.active !== false,
        seedKeyword: s.voiceKeyword || '', seedAliases: s.voiceAliases || []
      });
    });
    (state.retail || []).forEach(function (p) {
      pushSource(out, seen, {
        sourceType: 'retail', sourceId: p.id, name: p.name || '', active: p.active !== false,
        seedKeyword: p.voiceKeyword || '', seedAliases: p.voiceAliases || []
      });
    });
    return out;
  }

  function sourcesByFamily(sources, familyId) {
    return (sources || []).filter(function (s) { return s.family === familyId; });
  }

  /* The same item id can exist in more than one source type (a prix fixe dish
     that is also a tasting course). A requested type always wins. */
  function findSource(sources, sourceId, sourceType) {
    var id = String(sourceId || '');
    if (!id) return null;
    var fallback = null;
    var typed = null;
    (sources || []).forEach(function (s) {
      if (!s || String(s.sourceId) !== id) return;
      if (!fallback) fallback = s;
      if (sourceType && s.sourceType === sourceType) typed = s;
    });
    return sourceType ? typed : fallback;
  }

  /* An item is eligible for a generated suggestion when its family is spoken by
     name. Cellar bottles stay VIN-addressed unless they also pour by the glass. */
  function isSuggestEligible(src) {
    if (!src || !src.sourceId || isBlank(src.name)) return false;
    if (src.active === false) return false;
    var f = FAMILY_BY_ID[src.family];
    if (!f) return false;
    if (f.id === 'wine-bottle') return !!src.byTheGlass;
    return !!f.suggest;
  }

  /* ---------- one-time, versioned, idempotent seed ---------- */

  function seedInputs(sources) {
    var v = voice();
    var approvedKw = (v && v.APPROVED_KEYWORDS) || {};
    var approvedAl = (v && v.APPROVED_ALIASES) || {};
    /* Build 55 keys its approved vocabulary by dish identity, and the same dish
       identity can appear in more than one place (a prix fixe dish that is also
       a tasting course). Every source carrying that identity is seeded. */
    var byId = {};
    (sources || []).forEach(function (s) {
      if (!byId[s.sourceId]) byId[s.sourceId] = [];
      byId[s.sourceId].push(s);
    });

    var inputs = {};
    function addOne(src, sourceType, sourceId, kw, al) {
      var family = src ? src.family : familyFor(sourceType, {});
      var key = profileKey(sourceType, sourceId);
      if (!inputs[key]) {
        inputs[key] = { key: key, sourceType: sourceType, sourceId: sourceId, family: family, voiceKeyword: '', voiceAliases: [] };
      }
      if (kw && !inputs[key].voiceKeyword) inputs[key].voiceKeyword = kw;
      al.forEach(function (a) { if (inputs[key].voiceAliases.indexOf(a) < 0) inputs[key].voiceAliases.push(a); });
    }
    function add(sourceId, keyword, aliases, src) {
      var kw = normKeyword(keyword);
      var al = aliasList(aliases);
      if (!kw && !al.length) return;
      if (src) { addOne(src, src.sourceType, sourceId, kw, al); return; }
      var known = byId[sourceId];
      if (known && known.length) {
        known.forEach(function (s) { addOne(s, s.sourceType, sourceId, kw, al); });
        return;
      }
      addOne(null, inferSourceType(sourceId), sourceId, kw, al);
    }

    Object.keys(approvedKw).forEach(function (id) { add(id, approvedKw[id], approvedAl[id] || []); });
    Object.keys(approvedAl).forEach(function (id) { add(id, approvedKw[id] || '', approvedAl[id]); });
    (sources || []).forEach(function (s) { add(s.sourceId, s.seedKeyword, s.seedAliases, s); });
    return inputs;
  }

  /* Never overwrites a nonblank value already on a profile: manager edits and
     any previously seeded value win over the seed input. */
  function seedVoiceProfiles(store, sources, opts) {
    opts = opts || {};
    var now = Number(opts.now) || Date.now();
    var version = opts.seedVersion || SEED_VERSION;
    store.seeds = store.seeds || {};
    store.profiles = store.profiles || {};
    if (store.seeds[version] && !opts.force) {
      return { changed: false, alreadySeeded: true, seedVersion: version, added: 0, filled: 0, preserved: 0 };
    }
    var inputs = seedInputs(sources);
    var added = 0;
    var filled = 0;
    var preserved = 0;
    Object.keys(inputs).forEach(function (key) {
      var input = inputs[key];
      var p = store.profiles[key];
      if (!p) {
        p = blankProfile(input);
        store.profiles[key] = p;
        added += 1;
      }
      if (!p.family) p.family = input.family;
      var touched = false;
      if (isBlank(p.voiceKeyword)) {
        if (input.voiceKeyword) { p.voiceKeyword = input.voiceKeyword; touched = true; }
      } else if (p.voiceKeyword !== input.voiceKeyword && input.voiceKeyword) {
        preserved += 1;
      }
      if (!p.voiceAliases.length && input.voiceAliases.length) {
        p.voiceAliases = input.voiceAliases.slice();
        touched = true;
      } else if (p.voiceAliases.length && input.voiceAliases.length) {
        preserved += 1;
      }
      if (touched) {
        filled += 1;
        if (!p.origin) p.origin = 'seed';
        if (!p.seedVersion) p.seedVersion = version;
        if (!p.updatedAt) p.updatedAt = now;
      }
    });
    store.seeds[version] = now;
    store.schemaVersion = SCHEMA_VERSION;
    store.updatedAt = now;
    return { changed: true, alreadySeeded: false, seedVersion: version, added: added, filled: filled, preserved: preserved };
  }

  /* ---------- manager edits ---------- */

  function upsertProfile(store, src, patch, opts) {
    opts = opts || {};
    var now = Number(opts.now) || Date.now();
    store.profiles = store.profiles || {};
    var key = profileKey(src.sourceType, src.sourceId);
    var p = store.profiles[key] || blankProfile(src);
    store.profiles[key] = p;
    p.family = src.family || p.family || familyFor(src.sourceType, src);
    var changed = false;
    if (patch && Object.prototype.hasOwnProperty.call(patch, 'voiceKeyword')) {
      var kw = normKeyword(patch.voiceKeyword);
      if (kw !== p.voiceKeyword) { p.voiceKeyword = kw; changed = true; }
    }
    if (patch && Object.prototype.hasOwnProperty.call(patch, 'voiceAliases')) {
      var al = aliasList(patch.voiceAliases);
      if (al.join('|') !== p.voiceAliases.join('|')) { p.voiceAliases = al; changed = true; }
    }
    if (patch && Object.prototype.hasOwnProperty.call(patch, 'active')) {
      var act = patch.active !== false;
      if (act !== p.active) { p.active = act; changed = true; }
    }
    if (changed) {
      p.origin = opts.origin || 'manager';
      p.updatedAt = now;
      store.updatedAt = now;
    }
    return { profile: p, changed: changed };
  }

  function pruneEmptyProfiles(store) {
    var removed = 0;
    Object.keys(store.profiles || {}).forEach(function (k) {
      var p = store.profiles[k];
      if (p && isBlank(p.voiceKeyword) && !(p.voiceAliases || []).length && p.active !== false) {
        delete store.profiles[k];
        removed += 1;
      }
    });
    return removed;
  }

  /* ---------- suggestions ---------- */

  function usedKeywordsInScope(store, sources, scope, exceptKey) {
    var used = [];
    var byKey = {};
    (sources || []).forEach(function (s) { byKey[s.key] = s; });
    Object.keys(store.profiles || {}).forEach(function (k) {
      if (k === exceptKey) return;
      var p = store.profiles[k];
      if (!p || p.active === false) return;
      if (scopeFor(p.family) !== scope) return;
      if (p.voiceKeyword) used.push(p.voiceKeyword);
      (p.voiceAliases || []).forEach(function (a) { used.push(a); });
    });
    return used;
  }

  function suggestForSource(store, sources, src) {
    var v = voice();
    if (!v) return '';
    var scope = scopeFor(src.family);
    var used = usedKeywordsInScope(store, sources, scope, src.key);
    return v.suggestVoiceKeyword(src.name || '', {
      used: used,
      kind: src.kind || '',
      varietal: src.varietal || ''
    });
  }

  /* Suggestions are proposals only — they are returned for the manager to edit
     and accept, never written into the store here. */
  function suggestForSources(store, sources, opts) {
    opts = opts || {};
    var familyId = opts.family || '';
    var out = [];
    var pending = [];
    (sources || []).forEach(function (s) {
      if (familyId && s.family !== familyId) return;
      if (!isSuggestEligible(s)) return;
      var p = getProfile(store, s.sourceType, s.sourceId);
      if (p && !isBlank(p.voiceKeyword)) return;
      pending.push(s);
    });
    /* Mirror of the live store so two suggestions in one pass cannot collide. */
    var shadow = { profiles: {} };
    Object.keys(store.profiles || {}).forEach(function (k) { shadow.profiles[k] = store.profiles[k]; });
    pending.forEach(function (s) {
      var kw = suggestForSource(shadow, sources, s);
      if (!kw) return;
      shadow.profiles[s.key] = {
        key: s.key, sourceType: s.sourceType, sourceId: s.sourceId, family: s.family,
        voiceKeyword: kw, voiceAliases: [], active: true
      };
      out.push({ key: s.key, sourceType: s.sourceType, sourceId: s.sourceId, family: s.family, name: s.name, suggestion: kw });
    });
    return out;
  }

  /* ---------- collision detection ---------- */

  /* `overrides` lets an open editor be checked before it is saved: a keyed
     entry replaces the stored profile of the same key instead of doubling it. */
  function detectCollisions(store, sources, opts) {
    opts = opts || {};
    var overrides = opts.overrides || {};
    var byKey = {};
    (sources || []).forEach(function (s) { byKey[s.key] = s; });
    var entries = [];
    function push(key, data, family) {
      var src = byKey[key];
      if (data.active === false) return;
      if (src && src.active === false) return;
      var kw = normKeyword(data.voiceKeyword);
      var al = aliasList(data.voiceAliases);
      if (!kw && !al.length) return;
      entries.push({
        id: key,
        name: data.name || (src && src.name) || data.sourceId || key,
        keyword: kw,
        aliases: al,
        context: scopeFor(family),
        family: family
      });
    }
    Object.keys(store.profiles || {}).forEach(function (k) {
      if (Object.prototype.hasOwnProperty.call(overrides, k)) return;
      var p = store.profiles[k];
      if (!p) return;
      push(k, p, p.family);
    });
    Object.keys(overrides).forEach(function (k) {
      var o = overrides[k] || {};
      var stored = (store.profiles || {})[k];
      var family = o.family || (stored && stored.family) || (byKey[k] && byKey[k].family) || '';
      push(k, o, family);
    });
    var v = voice();
    if (!v) return { level: 'ok', conflicts: [] };
    var res = v.findKeywordConflicts(entries);
    return {
      level: res.level,
      keyword: res.keyword,
      suggestion: res.suggestion,
      conflicts: (res.conflicts || []).map(function (c) {
        return {
          level: 'warn',
          keyword: c.keyword,
          scope: c.context,
          suggestion: c.suggestion,
          items: (c.items || []).map(function (i) { return { key: i.id, name: i.name, family: i.family }; })
        };
      })
    };
  }

  /* ---------- modifier metadata (additive only) ---------- */

  var MODIFIER_VOICE_ROLES = ['', 'spirit', 'preparation', 'service', 'garnish', 'mixer'];

  function normalizeItemRef(ref) {
    if (!ref) return null;
    var sourceType = String(ref.sourceType || '').trim();
    var sourceId = String(ref.sourceId || '').trim();
    if (!sourceType || !sourceId) return null;
    return { sourceType: sourceType, sourceId: sourceId };
  }

  /* Keeps id/name/required/multi/options/up exactly as configured; only adds the
     four approved Voice fields. Up-price stays whatever the manager typed — it
     is never inferred from a referenced item. */
  function normalizeModifierVoice(group) {
    if (!group) return group;
    var role = String(group.voiceRole || '');
    group.voiceRole = MODIFIER_VOICE_ROLES.indexOf(role) >= 0 ? role : '';
    group.options = group.options || [];
    group.options.forEach(function (o) {
      if (!o) return;
      o.voiceAliases = aliasList(o.voiceAliases);
      var ref = normalizeItemRef(o.itemRef);
      if (ref) o.itemRef = ref; else delete o.itemRef;
      o.up = Number(o.up) || 0;
    });
    return group;
  }

  function modifierWords(opt) {
    var seen = {};
    var out = [];
    function add(w) {
      var n = normKeyword(w);
      if (!n || seen[n]) return;
      seen[n] = 1;
      out.push(n);
    }
    add(opt && opt.name);
    aliasList(opt && opt.voiceAliases).forEach(add);
    return out;
  }

  /* Spoken modifier words collide inside one voice role. A group with no role
     stays inside its own group, so unrelated groups do not warn each other. */
  function detectModifierCollisions(groups) {
    var entries = [];
    (groups || []).forEach(function (g) {
      if (!g) return;
      var role = String(g.voiceRole || '');
      if (MODIFIER_VOICE_ROLES.indexOf(role) < 0) role = '';
      var scope = role ? ('role:' + role) : ('group:' + String(g.id || ''));
      (g.options || []).forEach(function (o) {
        if (!o) return;
        var words = modifierWords(o);
        if (!words.length) return;
        entries.push({
          id: String(g.id || '') + ':' + String(o.id || o.name || ''),
          name: (g.name ? g.name + ' · ' : '') + (o.name || ''),
          keyword: words[0],
          aliases: words.slice(1),
          context: scope,
          family: role || String(g.id || '')
        });
      });
    });
    var v = voice();
    if (!v) return { level: 'ok', conflicts: [] };
    var res = v.findKeywordConflicts(entries);
    return {
      level: res.level,
      conflicts: (res.conflicts || []).map(function (c) {
        return {
          level: 'warn',
          keyword: c.keyword,
          scope: c.context,
          suggestion: c.suggestion,
          items: (c.items || []).map(function (i) { return { key: i.id, name: i.name, family: i.family }; })
        };
      })
    };
  }

  function modifierVoiceMetadata(groups) {
    return (groups || []).map(function (g) {
      normalizeModifierVoice(g);
      return {
        id: g.id,
        name: g.name || '',
        required: !!g.required,
        multi: !!g.multi,
        voiceRole: g.voiceRole || '',
        options: (g.options || []).map(function (o) {
          var out = { id: o.id, name: o.name || '', up: Number(o.up) || 0 };
          if ((o.voiceAliases || []).length) out.voiceAliases = o.voiceAliases.slice();
          if (o.itemRef) out.itemRef = { sourceType: o.itemRef.sourceType, sourceId: o.itemRef.sourceId };
          return out;
        })
      };
    });
  }

  /* ---------- immutable, chunked, versioned snapshots ---------- */

  function stableStringify(value) {
    if (value === null || typeof value !== 'object') return JSON.stringify(value);
    if (Array.isArray(value)) return '[' + value.map(stableStringify).join(',') + ']';
    var keys = Object.keys(value).sort();
    return '{' + keys.map(function (k) {
      return JSON.stringify(k) + ':' + stableStringify(value[k]);
    }).join(',') + '}';
  }

  function hashString(s) {
    var h1 = 0x811c9dc5;
    var h2 = 5381;
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      h1 ^= c;
      h1 = (h1 + ((h1 << 1) + (h1 << 4) + (h1 << 7) + (h1 << 8) + (h1 << 24))) >>> 0;
      h2 = (((h2 << 5) + h2) ^ c) >>> 0;
    }
    function hex(n) { var s2 = (n >>> 0).toString(16); while (s2.length < 8) s2 = '0' + s2; return s2; }
    return hex(h1) + hex(h2);
  }

  function snapshotEntries(store, sources) {
    var byKey = {};
    (sources || []).forEach(function (s) { byKey[s.key] = s; });
    var out = [];
    Object.keys(store.profiles || {}).sort().forEach(function (k) {
      var p = store.profiles[k];
      if (!p) return;
      if (p.active === false) return;
      if (isBlank(p.voiceKeyword)) return;
      var src = byKey[k];
      if (src && src.active === false) return;
      out.push({
        key: k,
        sourceType: p.sourceType,
        sourceId: p.sourceId,
        family: p.family,
        scope: scopeFor(p.family),
        voiceKeyword: p.voiceKeyword,
        voiceAliases: (p.voiceAliases || []).slice()
      });
    });
    return out;
  }

  function chunkEntries(entries, budget, maxEntries) {
    budget = Number(budget) || CHUNK_BYTE_BUDGET;
    maxEntries = Number(maxEntries) || CHUNK_MAX_ENTRIES;
    var chunks = [];
    var current = [];
    var size = 0;
    entries.forEach(function (e) {
      var bytes = stableStringify(e).length + 1;
      if (current.length && (current.length >= maxEntries || size + bytes > budget)) {
        chunks.push(current);
        current = [];
        size = 0;
      }
      current.push(e);
      size += bytes;
    });
    if (current.length || !chunks.length) chunks.push(current);
    return chunks;
  }

  function chunkDocId(revision, index) {
    return CHUNK_DOC_PREFIX + revision + '_' + index;
  }

  function buildVoiceSnapshot(opts) {
    opts = opts || {};
    var store = opts.store || emptyProfileStore();
    var sources = opts.sources || [];
    var entries = snapshotEntries(store, sources);
    var modifiers = modifierVoiceMetadata(opts.modGroups || []);
    var parts = chunkEntries(entries, opts.chunkBudget, opts.maxChunkEntries);
    var body = {
      schemaVersion: SCHEMA_VERSION,
      entries: entries,
      modifiers: modifiers
    };
    var revision = 'r' + hashString(stableStringify(body));
    var chunks = parts.map(function (list, i) {
      return {
        index: i,
        docId: chunkDocId(revision, i),
        collection: SHARED_COLLECTION,
        data: {
          schemaVersion: SCHEMA_VERSION,
          revision: revision,
          chunkIndex: i,
          chunkCount: parts.length,
          entries: list,
          modifiers: i === 0 ? modifiers : []
        }
      };
    });
    return {
      schemaVersion: SCHEMA_VERSION,
      revision: revision,
      entryCount: entries.length,
      modifierGroupCount: modifiers.length,
      chunks: chunks,
      control: {
        collection: SHARED_COLLECTION,
        docId: CONTROL_DOC_ID,
        data: {
          schemaVersion: SCHEMA_VERSION,
          activeRevision: revision,
          chunkCount: chunks.length,
          chunkIds: chunks.map(function (c) { return c.docId; }),
          entryCount: entries.length,
          publishedAt: Number(opts.now) || Date.now()
        }
      }
    };
  }

  /* Chunks are written first and the control document is flipped only after
     every chunk resolves, so a failed chunk write leaves the previous
     activeRevision pointing at its own intact chunks. */
  function publishVoiceSnapshot(snapshot, io) {
    io = io || {};
    var writeChunk = io.writeChunk;
    var writeControl = io.writeControl;
    if (typeof writeChunk !== 'function' || typeof writeControl !== 'function') {
      return Promise.reject(new Error('publishVoiceSnapshot needs writeChunk and writeControl'));
    }
    var written = [];
    return snapshot.chunks.reduce(function (chain, c) {
      return chain.then(function () {
        return Promise.resolve(writeChunk(c.docId, c.data, c)).then(function (r) {
          if (r === false) throw new Error('chunk write failed: ' + c.docId);
          written.push(c.docId);
        });
      });
    }, Promise.resolve()).then(function () {
      return Promise.resolve(writeControl(snapshot.control.docId, snapshot.control.data, snapshot.control));
    }).then(function (r) {
      if (r === false) throw new Error('control write failed');
      return { ok: true, revision: snapshot.revision, chunksWritten: written };
    });
  }

  var api = {
    SCHEMA_VERSION: SCHEMA_VERSION,
    SEED_VERSION: SEED_VERSION,
    SHARED_COLLECTION: SHARED_COLLECTION,
    PROFILE_DOC_ID: PROFILE_DOC_ID,
    CONTROL_DOC_ID: CONTROL_DOC_ID,
    CHUNK_DOC_PREFIX: CHUNK_DOC_PREFIX,
    CHUNK_BYTE_BUDGET: CHUNK_BYTE_BUDGET,
    CHUNK_MAX_ENTRIES: CHUNK_MAX_ENTRIES,
    FAMILIES: FAMILIES,
    MODIFIER_VOICE_ROLES: MODIFIER_VOICE_ROLES,
    familyInfo: familyInfo,
    familyFor: familyFor,
    beverageFamilies: beverageFamilies,
    scopeFor: scopeFor,
    profileKey: profileKey,
    normKeyword: normKeyword,
    aliasList: aliasList,
    emptyProfileStore: emptyProfileStore,
    normalizeProfileStore: normalizeProfileStore,
    collectVoiceSources: collectVoiceSources,
    sourcesByFamily: sourcesByFamily,
    findSource: findSource,
    isSuggestEligible: isSuggestEligible,
    getProfile: getProfile,
    seedVoiceProfiles: seedVoiceProfiles,
    upsertProfile: upsertProfile,
    pruneEmptyProfiles: pruneEmptyProfiles,
    suggestForSource: suggestForSource,
    suggestForSources: suggestForSources,
    detectCollisions: detectCollisions,
    normalizeModifierVoice: normalizeModifierVoice,
    detectModifierCollisions: detectModifierCollisions,
    modifierVoiceMetadata: modifierVoiceMetadata,
    stableStringify: stableStringify,
    chunkDocId: chunkDocId,
    buildVoiceSnapshot: buildVoiceSnapshot,
    publishVoiceSnapshot: publishVoiceSnapshot
  };

  root.EPICUREAN_VOICE_PROFILES = api;
  if (typeof globalThis !== 'undefined') globalThis.EPICUREAN_VOICE_PROFILES = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
