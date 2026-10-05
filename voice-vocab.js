/* Epicurean Rapid Voice Phase 1 — shared vocabulary.
   Identical copy in BOH and POS. Approved nicknames live here, keyed by BOH id. */
(function (root) {
  var APPROVED_KEYWORDS = {
    sf_w_salmon: 'SMOKED',
    sf_w_zucchini: 'ZUCCHINI',
    sf_w_shrimp: 'SHERRY',
    sf_p_rosso: 'ROSSO',
    sf_p_arugula: 'ARUGULA',
    sf_p_lobster: 'LOBSTER',
    sf_p_raviolo: 'RAVIOLO',
    sf_p_porcini: 'PORCINI',
    sf_p_agnolotti: 'AGNOLOTTI',
    sf_p_arrabbiata: 'ARRABBIATA',
    sf_p_bolognese: 'BOLOGNESE',
    sf_p_pappardelle: 'PAPPARDELLE',
    sf_p_linguini: 'PESCATORE',
    sf_p_fusilli: 'FUSILLI',
    sf_p_amatriciana: 'RIGATONI',
    sf_m_sole: 'SOLE',
    sf_m_scallops: 'SCALLOPS',
    sf_m_forestiere: 'SALMON',
    sf_m_zafferano: 'SHRIMP',
    sf_m_genovese: 'GENOESE',
    sf_m_pork: 'PORKCHOP',
    sf_m_chicken: 'CHICKEN',
    sf_m_veal_val: 'VEAL',
    sf_m_osso: 'LAMB',
    sf_m_giambotta: 'FILET',
    sf_m_reggiano: 'MEDALLIONS',
    sf_m_duck: 'DUCK',
    sf_e_sorbet: 'SORBET',
    sf_d_napoleon: 'NAPOLEON',
    sf_d_cake: 'FLOURLESS',
    sf_d_tart: 'RASPBERRY',
    sf_d_basque: 'CHEESECAKE',
    sf_d_pistachio_tart: 'BRULEE',
    sf_d_panino: 'PANINO',
    sf_d_pineapple: 'PINEAPPLE',
    sf_d_banana: 'BANANA',
    sf_d_gelato: 'GELATO',
    sf_d_formaggio: 'FORMAGGIO',
    scoop_apple: 'APPLE',
    scoop_vanilla: 'VANILLA',
    scoop_caramel: 'CARAMEL',
    scoop_hazelnut: 'HAZELNUT',
    scoop_pistachio: 'PISTACHIO',
    scoop_lemon: 'LEMON',
    btg_spark_beck: 'CHAMPAGNE',
    btg_spark_zardetto: 'PROSECCO',
    btg_spark_concerto: 'LAMBRUSCO',
    btg_white_walch: 'PINOT BIANCO',
    btg_white_friulano: 'FRIULANO',
    btg_white_fiano: 'FIANO',
    btg_white_hartford: 'CHARDONNAY',
    btg_red_core: 'AGLIANICO',
    btg_red_fumanelli: 'VALPOLICELLA',
    btg_red_planeta: 'MERLOT',
    btg_lib_sudtirol: 'PINOT NOIR',
    btg_lib_fizzano: 'CHIANTI',
    btg_lib_barbera: 'BARBERA',
    btg_des_spinetta: 'MOSCATO',
    btg_des_vidal: 'VIDAL',
    btg_des_riesling: 'RIESLING',
    btg_des_franc: 'CABERNET',
    btg_port_bin27: 'RUBY',
    btg_port_croft: 'CROFT',
    btg_port_tawny10: 'TAWNY10',
    btg_port_tawny20: 'TAWNY20'
  };

  var APPROVED_ALIASES = {
    sf_d_formaggio: ['GORGONZOLA', 'PARMIGIANO', 'MOZZARELLA']
  };

  var STOP = {
    a: 1, an: 1, the: 1, and: 1, or: 1, of: 1, with: 1, in: 1,
    alla: 1, di: 1, del: 1, over: 1, sauce: 1, oz: 1, split: 1
  };

  var GENERIC = {
    beef: 1, chicken: 1, pork: 1, veal: 1, lamb: 1, duck: 1, fish: 1,
    filet: 1, wine: 1, cream: 1, roasted: 1, braised: 1, sauteed: 1,
    sautéed: 1, warm: 1, thinly: 1, sliced: 1, house: 1, style: 1,
    served: 1, topped: 1, light: 1, spicy: 1, fresh: 1, three: 1,
    scoops: 1, choose: 1, crust: 1, tart: 1, cake: 1
  };

  var WORD_DIGITS = {
    zero: '0', oh: '0', o: '0', one: '1', two: '2', three: '3', four: '4',
    five: '5', six: '6', seven: '7', eight: '8', nine: '9'
  };

  function asArr(v) {
    if (!v) return [];
    if (Array.isArray(v)) return v.filter(function (x) { return x != null && String(x).trim() !== ''; });
    return String(v).split(/[,;]/).map(function (s) { return s.trim(); }).filter(Boolean);
  }

  function normKeyword(s) {
    return String(s == null ? '' : s)
      .toUpperCase()
      .replace(/[^\w\s0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokens(name) {
    return String(name || '')
      .replace(/[\u201c\u201d\u2018\u2019"'`]/g, '')
      .replace(/[^A-Za-z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function usedSet(list) {
    var out = {};
    asArr(list).forEach(function (k) {
      var n = normKeyword(k);
      if (n) out[n] = 1;
    });
    return out;
  }

  function pickUnused(candidate, used) {
    var n = normKeyword(candidate);
    if (!n) return '';
    if (!used[n]) return n;
    var i = 2;
    while (used[n + i]) i += 1;
    return n + i;
  }

  function wineSuggest(name, opts, used) {
    var grape = String(opts.varietal || opts.grape || '');
    var blob = (name + ' ' + grape).replace(/\s+/g, ' ').trim();
    var tawny = blob.match(/tawny\s*[-]?\s*(\d+)/i);
    if (tawny) return pickUnused('TAWNY' + tawny[1], used);
    var pinot = blob.match(/pinot\s+(bianco|noir|grigio|nero)/i);
    if (pinot) return pickUnused('PINOT ' + pinot[1].toUpperCase(), used);
    var grapeToks = tokens(grape).filter(function (t) { return !STOP[t.toLowerCase()]; });
    if (grapeToks.length === 2 && /^pinot$/i.test(grapeToks[0])) {
      return pickUnused('PINOT ' + grapeToks[1].toUpperCase(), used);
    }
    if (grapeToks.length) return pickUnused(grapeToks[0].toUpperCase(), used);
    var nameToks = tokens(name).filter(function (t) { return !STOP[t.toLowerCase()]; });
    if (nameToks.length === 2 && /^pinot$/i.test(nameToks[0])) {
      return pickUnused('PINOT ' + nameToks[1].toUpperCase(), used);
    }
    return pickUnused((nameToks[0] || name || '').toUpperCase(), used);
  }

  function suggestVoiceKeyword(name, opts) {
    opts = opts || {};
    var used = usedSet(opts.used);
    var kind = String(opts.kind || '').toLowerCase();
    if (kind === 'wine' || kind === 'btg' || opts.varietal || opts.grape) {
      return wineSuggest(name, opts, used);
    }
    var toks = tokens(name);
    var i;
    for (i = 0; i < toks.length; i++) {
      if (/^wellington$/i.test(toks[i])) return pickUnused('WELLINGTON', used);
    }
    var tawny = String(name || '').match(/tawny\s*[-]?\s*(\d+)/i);
    if (tawny) return pickUnused('TAWNY' + tawny[1], used);
    var pinot = String(name || '').match(/pinot\s+(bianco|noir|grigio|nero)/i);
    if (pinot) return pickUnused('PINOT ' + pinot[1].toUpperCase(), used);
    var distinctive = [];
    var hasNonFilet = toks.some(function (t) {
      var low = t.toLowerCase();
      return !STOP[low] && low !== 'filet';
    });
    toks.forEach(function (t, idx) {
      var low = t.toLowerCase();
      if (STOP[low]) return;
      if (low === 'filet' && hasNonFilet) return;
      var score = t.length + (idx === 0 ? 4 : 0);
      if (GENERIC[low]) score -= 8;
      distinctive.push({ t: t.toUpperCase(), score: score, idx: idx });
    });
    distinctive.sort(function (a, b) {
      if (b.score !== a.score) return b.score - a.score;
      return a.idx - b.idx;
    });
    if (distinctive.length) return pickUnused(distinctive[0].t, used);
    return pickUnused(normKeyword(name), used);
  }

  function itemWords(it) {
    var out = [];
    var kw = normKeyword(it && it.keyword);
    if (kw) out.push(kw);
    asArr(it && it.aliases).forEach(function (a) {
      var n = normKeyword(a);
      if (n) out.push(n);
    });
    return out;
  }

  function findKeywordConflicts(entries) {
    entries = entries || [];
    var byCtx = {};
    entries.forEach(function (it) {
      if (!it) return;
      var ctx = String(it.context || '');
      if (!byCtx[ctx]) byCtx[ctx] = [];
      byCtx[ctx].push(it);
    });
    var conflicts = [];
    Object.keys(byCtx).forEach(function (ctx) {
      var buckets = {};
      byCtx[ctx].forEach(function (it) {
        itemWords(it).forEach(function (word) {
          if (!buckets[word]) buckets[word] = [];
          if (buckets[word].indexOf(it) < 0) buckets[word].push(it);
        });
      });
      Object.keys(buckets).forEach(function (word) {
        var items = buckets[word];
        if (items.length < 2) return;
        var used = [word];
        var suggestion = suggestVoiceKeyword(items[1].name || word, { used: used });
        conflicts.push({
          level: 'warn',
          keyword: word,
          items: items,
          suggestion: suggestion,
          context: ctx
        });
      });
    });
    var first = conflicts[0];
    return {
      level: first ? 'warn' : 'ok',
      keyword: first ? first.keyword : '',
      items: first ? first.items : [],
      suggestion: first ? first.suggestion : '',
      conflicts: conflicts
    };
  }

  function itemKey(item) {
    if (!item) return '';
    return String(item.id || item.dishId || item.code || '');
  }

  function applyApprovedKeywords(item) {
    if (!item) return item;
    var id = itemKey(item);
    if (id && !item.voiceKeyword && APPROVED_KEYWORDS[id]) {
      item.voiceKeyword = APPROVED_KEYWORDS[id];
    }
    if (id && APPROVED_ALIASES[id] && (!item.voiceAliases || !item.voiceAliases.length)) {
      item.voiceAliases = APPROVED_ALIASES[id].slice();
    }
    return item;
  }

  function ymd(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1);
    var day = String(d.getDate());
    if (m.length < 2) m = '0' + m;
    if (day.length < 2) day = '0' + day;
    return y + '-' + m + '-' + day;
  }

  function dailySpecialIsLive(it, now) {
    if (!it || it.active === false) return false;
    var d = now instanceof Date ? now : (now ? new Date(now) : new Date());
    if (isNaN(d.getTime())) d = new Date();
    var day = ymd(d);
    if (it.activeFrom && String(it.activeFrom) && day < String(it.activeFrom)) return false;
    if (it.activeTo && String(it.activeTo) && day > String(it.activeTo)) return false;
    var period = String(it.service || it.mealPeriod || '').toLowerCase();
    if (period && period !== 'all' && period !== 'all day') {
      var h = d.getHours();
      if (period === 'lunch' && (h < 10 || h >= 16)) return false;
      if (period === 'dinner' && h < 15) return false;
      if (period === 'brunch' && (h < 9 || h >= 15)) return false;
      if (period === 'breakfast' && h >= 12) return false;
    }
    return true;
  }

  function normalizeSpokenVin(text) {
    var s = String(text || '').trim().toLowerCase();
    if (!s) return null;
    var kind = null;
    var m = s.match(/^\s*(vin|lin)\b[:#\-\s]*/i);
    if (m) {
      kind = m[1].toLowerCase();
      s = s.slice(m[0].length);
    } else {
      return null;
    }
    s = s.replace(/\b(zero|oh|o|one|two|three|four|five|six|seven|eight|nine)\b/g, function (w) {
      return WORD_DIGITS[w] != null ? WORD_DIGITS[w] : w;
    });
    var code = s.replace(/\D+/g, '');
    if (!code) return null;
    return { kind: kind, code: code };
  }

  function gelatoNeedLabel(flavors, chooseCount) {
    var n = (flavors || []).length;
    var need = Number(chooseCount) || 3;
    if (n >= need) return '';
    return 'GELATO — ' + n + ' OF ' + need + ' FLAVORS';
  }

  function matchVoiceCatalog(query, catalog) {
    var vin = normalizeSpokenVin(query);
    if (vin) return { status: 'vin', items: [], need: '', vin: vin };
    var q = normKeyword(query);
    if (!q) return { status: 'missing', items: [] };
    var hits = [];
    (catalog || []).forEach(function (it) {
      if (!it) return;
      applyApprovedKeywords(it);
      var kw = normKeyword(it.voiceKeyword);
      var aliases = asArr(it.voiceAliases).map(normKeyword);
      if (kw === q || aliases.indexOf(q) >= 0) hits.push(it);
    });
    if (!hits.length) return { status: 'missing', items: [] };
    if (hits.length > 1) return { status: 'ambiguous', items: hits };
    var item = hits[0];
    var flavors = asArr(item.flavors);
    var need = '';
    if ((Number(item.chooseCount) || 0) > 0) {
      need = gelatoNeedLabel(flavors, item.chooseCount);
    }
    return { status: 'high', items: hits, need: need };
  }

  function applyOntoScalini(S) {
    if (!S) return;
    function walk(x) { applyApprovedKeywords(x); }
    if (S.prixFixe) {
      (S.prixFixe.dishes || []).forEach(walk);
      (S.prixFixe.courses || []).forEach(function (c) {
        walk(c);
        (c.options || []).forEach(walk);
      });
      (S.prixFixe.courseGroups || []).forEach(function (c) {
        (c.options || []).forEach(walk);
      });
    }
    if (S.tasting) (S.tasting.courses || []).forEach(walk);
    (S.winesByGlass || []).forEach(walk);
    (S.gelatoScoops || []).forEach(walk);
  }

  var api = {
    APPROVED_KEYWORDS: APPROVED_KEYWORDS,
    APPROVED_ALIASES: APPROVED_ALIASES,
    normKeyword: normKeyword,
    suggestVoiceKeyword: suggestVoiceKeyword,
    findKeywordConflicts: findKeywordConflicts,
    applyApprovedKeywords: applyApprovedKeywords,
    dailySpecialIsLive: dailySpecialIsLive,
    normalizeSpokenVin: normalizeSpokenVin,
    matchVoiceCatalog: matchVoiceCatalog,
    gelatoNeedLabel: gelatoNeedLabel,
    applyOntoScalini: applyOntoScalini
  };

  root.EPICUREAN_VOICE = api;
  if (typeof globalThis !== 'undefined') globalThis.EPICUREAN_VOICE = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  applyOntoScalini(root.EPICUREAN_SCALINI);
})(typeof window !== 'undefined' ? window : (typeof globalThis !== 'undefined' ? globalThis : this));
