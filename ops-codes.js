/* VIN / LIN operational lookup codes.
   VIN = wine.vin (digits). LIN = liquor/spirit bar.lin.
   Existing Binwise VINs stay as-is, including size/vintage duplicates.
   New codes are random in namespace and never reuse retired values. */
(function (root) {
  'use strict';
  var VIN_NEW_MIN = 20000;
  var VIN_NEW_MAX = 89999;
  var LIN_NEW_MIN = 1000;
  var LIN_NEW_MAX = 89999;

  function opsCodeDigits(v) {
    var s = String(v == null ? '' : v).trim();
    return /^\d+$/.test(s) ? s : '';
  }
  function hasOpsCode(v) {
    return String(v == null ? '' : v).trim() !== '';
  }
  function isSpiritBar(b) {
    if (!b) return false;
    var k = String(b.kind || '').toLowerCase();
    return k === 'spirit' || k === 'spirits' || k === 'liquor' || /after[\s-]?dinner/.test(k);
  }
  function markUsed(set, v) {
    var d = opsCodeDigits(v);
    if (!d) d = String(v == null ? '' : v).trim();
    if (d) set[d] = 1;
    return set;
  }
  function usedVinSet(state) {
    var set = {};
    (state.retiredVins || []).forEach(function (v) { markUsed(set, v); });
    (state.wines || []).forEach(function (w) { if (w) markUsed(set, w.vin); });
    return set;
  }
  function usedLinSet(state) {
    var set = {};
    (state.retiredLins || []).forEach(function (v) { markUsed(set, v); });
    (state.bar || []).forEach(function (b) {
      if (isSpiritBar(b)) markUsed(set, b.lin);
    });
    return set;
  }
  function randomOpsCode(min, max, used) {
    var span = max - min + 1;
    var i, n, s;
    for (i = 0; i < 80; i++) {
      n = min + Math.floor(Math.random() * span);
      s = String(n);
      if (!used[s]) { used[s] = 1; return s; }
    }
    for (n = min; n <= max; n++) {
      s = String(n);
      if (!used[s]) { used[s] = 1; return s; }
    }
    throw new Error('operational code namespace exhausted');
  }
  function assignVin(state) {
    return randomOpsCode(VIN_NEW_MIN, VIN_NEW_MAX, usedVinSet(state));
  }
  function assignLin(state) {
    return randomOpsCode(LIN_NEW_MIN, LIN_NEW_MAX, usedLinSet(state));
  }
  function retireCode(list, v) {
    var d = opsCodeDigits(v) || String(v == null ? '' : v).trim();
    if (!d) return list;
    if (list.indexOf(d) < 0) list.push(d);
    return list;
  }
  function retireVin(state, vin) {
    state.retiredVins = Array.isArray(state.retiredVins) ? state.retiredVins : [];
    retireCode(state.retiredVins, vin);
    return state.retiredVins;
  }
  function retireLin(state, lin) {
    state.retiredLins = Array.isArray(state.retiredLins) ? state.retiredLins : [];
    retireCode(state.retiredLins, lin);
    return state.retiredLins;
  }
  function deleteWine(state, id) {
    var w = (state.wines || []).filter(function (x) { return x && x.id === id; })[0];
    if (w && hasOpsCode(w.vin)) retireVin(state, w.vin);
    state.wines = (state.wines || []).filter(function (x) { return !x || x.id !== id; });
    return w || null;
  }
  function deleteBar(state, id) {
    var b = (state.bar || []).filter(function (x) { return x && x.id === id; })[0];
    if (b && isSpiritBar(b) && hasOpsCode(b.lin)) retireLin(state, b.lin);
    state.bar = (state.bar || []).filter(function (x) { return !x || x.id !== id; });
    return b || null;
  }
  function ensureOperationalIds(state) {
    state.retiredVins = Array.isArray(state.retiredVins) ? state.retiredVins : [];
    state.retiredLins = Array.isArray(state.retiredLins) ? state.retiredLins : [];
    var winesChanged = false;
    var barChanged = false;
    var usedV = usedVinSet(state);
    (state.wines || []).forEach(function (w) {
      if (!w || hasOpsCode(w.vin)) return;
      w.vin = randomOpsCode(VIN_NEW_MIN, VIN_NEW_MAX, usedV);
      winesChanged = true;
    });
    var usedL = usedLinSet(state);
    (state.bar || []).forEach(function (b) {
      if (!isSpiritBar(b) || hasOpsCode(b.lin)) return;
      b.lin = randomOpsCode(LIN_NEW_MIN, LIN_NEW_MAX, usedL);
      barChanged = true;
    });
    return { wines: winesChanged, bar: barChanged, changed: winesChanged || barChanged };
  }

  var api = {
    VIN_NEW_MIN: VIN_NEW_MIN,
    VIN_NEW_MAX: VIN_NEW_MAX,
    LIN_NEW_MIN: LIN_NEW_MIN,
    LIN_NEW_MAX: LIN_NEW_MAX,
    opsCodeDigits: opsCodeDigits,
    hasOpsCode: hasOpsCode,
    isSpiritBar: isSpiritBar,
    usedVinSet: usedVinSet,
    usedLinSet: usedLinSet,
    randomOpsCode: randomOpsCode,
    assignVin: assignVin,
    assignLin: assignLin,
    retireVin: retireVin,
    retireLin: retireLin,
    deleteWine: deleteWine,
    deleteBar: deleteBar,
    ensureOperationalIds: ensureOperationalIds
  };
  root.EpicureanOpsCodes = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
