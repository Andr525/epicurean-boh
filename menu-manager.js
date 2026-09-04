/* Menu manager overlay — Menus → Groups → Items → Modifiers.
   Loaded after index.html so PAGE_menu and related helpers are replaced. */
var MENU_CAT_FILTER = 'all';
var MM = { tab: 'full', sel: { type: 'book', id: 'mb_dinner' }, q: '', open: {} };

function ensureMenuManager() {
  var dirty = false;
  if (!Array.isArray(STATE.taxRates) || !STATE.taxRates.length) { STATE.taxRates = seedTaxRates(); dirty = true; }
  if (!Array.isArray(STATE.menuBooks) || !STATE.menuBooks.length) { STATE.menuBooks = seedMenuBooks(); dirty = true; }
  var haveBooks = {};
  (STATE.menuBooks || []).forEach(function (b) { if (b && b.id) haveBooks[b.id] = 1; });
  seedMenuBooks().forEach(function (b) {
    if (!haveBooks[b.id]) { STATE.menuBooks.push(b); dirty = true; }
  });
  var byId = {};
  (STATE.modGroups || []).forEach(function (g) { if (g && g.id) byId[g.id] = g; });
  seedModifierGroups().forEach(function (g) {
    if (!byId[g.id]) { STATE.modGroups.push(g); byId[g.id] = g; dirty = true; }
  });
  var meat = byId.mg_meat_temp, fish = byId.mg_fish_temp;
  if (meat && (!meat.options || meat.options.length < 5)) { meat.options = seedModifierGroups()[0].options; dirty = true; }
  if (fish && (!fish.options || fish.options.length < 4)) { fish.options = seedModifierGroups()[1].options; dirty = true; }
  var have = {};
  (STATE.menuCats || []).forEach(function (c) { have[c.id] = 1; });
  seedMenuCats().forEach(function (c) { if (!have[c.id]) { STATE.menuCats.push(c); dirty = true; } });
  var names = {};
  (STATE.menuItems || []).forEach(function (it) { names[(it.name || '').toLowerCase()] = 1; });
  seedMenuItems().forEach(function (it) {
    if (!names[(it.name || '').toLowerCase()]) { STATE.menuItems.push(JSON.parse(JSON.stringify(it))); dirty = true; }
  });
  (STATE.menuItems || []).forEach(function (it) {
    it.modGroupIds = it.modGroupIds || [];
    if (!it.taxIds) {
      it.taxIds = (STATE.taxRates || []).filter(function (t) { return t.isDefault; }).map(function (t) { return t.id; });
      dirty = true;
    }
    it.catIds = it.catIds || [];
    var n = (it.name || '').toLowerCase();
    var raw = /tartare|crudo|carpaccio|ceviche/.test(n);
    if (!raw && /\b(steak|ribeye|filet|sirloin|burger|hamburger|wagyu|porterhouse|strip steak|filet mignon|pork chop|pork medallion)\b/.test(n)) {
      if (it.modGroupIds.indexOf('mg_meat_temp') < 0) { it.modGroupIds.push('mg_meat_temp'); dirty = true; }
    }
    if (!raw && /\b(salmon|tuna|ahi|halibut|cod|branzino|sea bass)\b/.test(n)) {
      if (it.modGroupIds.indexOf('mg_fish_temp') < 0) { it.modGroupIds.push('mg_fish_temp'); dirty = true; }
    }
  });
  if (MM.open.mb_dinner === undefined) MM.open.mb_dinner = true;
  (STATE.prixFixeMenus || []).forEach(mmRebuildPf);
  (STATE.tastingMenus || []).forEach(mmNormTm);
  if (typeof applyMenuPhotos === 'function') applyMenuPhotos();
  lsSet('eh_prix_fixe_menus', STATE.prixFixeMenus || []);
  lsSet('eh_tasting_menus', STATE.tastingMenus || []);
  if (dirty) {
    lsSet('eh_menu_cats', STATE.menuCats);
    lsSet('eh_menu_items', STATE.menuItems);
    lsSet('eh_mod_groups', STATE.modGroups);
    lsSet('eh_tax_rates', STATE.taxRates || []);
    lsSet('eh_menu_books', STATE.menuBooks || []);
    if (typeof fbReady !== 'undefined' && fbReady) saveMenu();
  }
}

function mmSelIs(type, id) { return MM.sel && MM.sel.type === type && MM.sel.id === id; }
function mmSelect(type, id) {
  mmFlush();
  MM.sel = { type: type, id: id };
  if (type === 'book') MM.open[id] = true;
  if (type === 'pfmenu' || type === 'pfcourse' || type === 'pfdish') {
    MM.open.mb_pf = true;
    if (type !== 'pfmenu') MM.open['pf:' + mmJoinParent(id)] = true;
    else MM.open['pf:' + id] = true;
  }
  if (type === 'tmmenu' || type === 'tmcourse' || type === 'tmpair' || type === 'tmgroup' || type === 'tmpairgroup') {
    MM.open.mb_tm = true;
    if (type !== 'tmmenu') MM.open['tm:' + mmJoinParent(id)] = true;
    else MM.open['tm:' + id] = true;
  }
  mmPaint();
}
function mmTab(tab) { mmFlush(); MM.tab = tab; mmPaint(); }
function mmToggleBook(id, ev) {
  if (ev) ev.stopPropagation();
  MM.open[id] = !MM.open[id];
  mmPaint();
}
function mmPaint() {
  var c = $('content');
  if (!c || ROUTE !== 'menu') return;
  var qEl = $('mm-q');
  var keepQ = qEl && document.activeElement === qEl;
  var start = keepQ ? qEl.selectionStart : null;
  var end = keepQ ? qEl.selectionEnd : null;
  c.innerHTML = mmBody();
  mmHydratePhotos();
  if (keepQ && $('mm-q')) {
    $('mm-q').focus();
    try { $('mm-q').setSelectionRange(start, end); } catch (e) {}
  } else {
    var on = document.querySelector('.mm-row.on');
    if (on) on.scrollIntoView({ block: 'nearest' });
  }
}
function mmFlush() {
  var form = $('mm-editor');
  if (!form) return;
  var type = form.getAttribute('data-type');
  var id = form.getAttribute('data-id');
  if (type === 'item') mmSaveItemFromForm(id, false);
  if (type === 'group') mmSaveGroupFromForm(id, false);
  if (type === 'mod') mmSaveModFromForm(id, false);
  if (type === 'tax') mmSaveTaxesFromForm(false);
  if (type === 'wine') mmSaveWineFromForm(id, false);
  if (type === 'bar') mmSaveBarFromForm(id, false);
  if (type === 'retail') mmSaveRetailFromForm(id, false);
  if (type === 'pfmenu') mmSavePfMenu(id, false);
  if (type === 'pfcourse') mmSavePfCourse(id, false);
  if (type === 'pfdish') mmSavePfDish(id, false);
  if (type === 'tmmenu') mmSaveTmMenu(id, false);
  if (type === 'tmgroup') mmSaveTmGroup(id, false);
  if (type === 'tmcourse') mmSaveTmCourse(id, false);
  if (type === 'tmpair') mmSaveTmPair(id, false);
}

function PAGE_menu() {
  ensureMenuManager();
  return { title: 'Menu manager', sub: 'Menus · groups · items · modifiers', body: mmBody(), bind: function () { mmHydratePhotos(); } };
}
function mmBookForGroup(gid) {
  var books = STATE.menuBooks || [];
  var hit = books.filter(function (b) { return (b.groupIds || []).indexOf(gid) > -1; })[0];
  if (hit) return hit;
  if (gid === 'c_wine_glass' || gid === 'c_wine_bottle' || gid === 'c_wine_flights') return books.filter(function (b) { return b.kind === 'wine'; })[0];
  return books.filter(function (b) { return b.kind === 'food'; })[0] || books[0];
}
function mmParentSel(sel) {
  sel = sel || MM.sel || {};
  if (sel.type === 'item') {
    var it = mmFindItem(sel.id);
    var gid = it && (it.catIds || [])[0];
    if (gid) return { type: 'group', id: gid };
    return { type: 'book', id: 'mb_dinner' };
  }
  if (sel.type === 'pfdish') {
    var pf = mmFindPf(mmJoinParent(sel.id));
    var d = mmFindPfDish(sel.id);
    var g = pf && d && (pf.courses || []).filter(function (c) { return c.label === d.course; })[0];
    if (g) return { type: 'pfcourse', id: mmJoin(pf.id, g.id) };
    return pf ? { type: 'pfmenu', id: pf.id } : { type: 'book', id: 'mb_pf' };
  }
  if (sel.type === 'tmcourse') {
    var tm = mmFindTm(mmJoinParent(sel.id));
    var c = mmFindTmCourse(sel.id);
    if (tm && c) return { type: 'tmgroup', id: mmJoin(tm.id, encodeURIComponent(mmTmGroupName(tm, c))) };
    return tm ? { type: 'tmmenu', id: tm.id } : { type: 'book', id: 'mb_tm' };
  }
  if (sel.type === 'tmpair') return { type: 'tmpairgroup', id: mmJoin(mmJoinParent(sel.id), 'pairings') };
  if (sel.type === 'pfcourse') return { type: 'pfmenu', id: mmJoinParent(sel.id) };
  if (sel.type === 'tmgroup' || sel.type === 'tmpairgroup') return { type: 'tmmenu', id: mmJoinParent(sel.id) };
  if (sel.type === 'pfmenu') return { type: 'book', id: 'mb_pf' };
  if (sel.type === 'tmmenu') return { type: 'book', id: 'mb_tm' };
  if (sel.type === 'group') {
    var book = mmBookForGroup(sel.id);
    return { type: 'book', id: book ? book.id : 'mb_dinner' };
  }
  if (sel.type === 'wine') return { type: 'book', id: 'mb_wine' };
  if (sel.type === 'bar') return { type: 'book', id: 'mb_bar' };
  if (sel.type === 'retail') return { type: 'book', id: 'mb_retail' };
  if (sel.type === 'book') return { type: 'home' };
  if (sel.type === 'mod') return null;
  return null;
}
function mmCanBack() {
  if (MM.tab !== 'full') return true;
  return !!mmParentSel(MM.sel);
}
function mmBack() {
  mmFlush();
  if (MM.tab !== 'full') { MM.tab = 'full'; mmPaint(); return; }
  var p = mmParentSel(MM.sel);
  if (p && p.type === 'home') { go('overview'); return; }
  if (p) MM.sel = p;
  mmPaint();
}
function mmAfterSave() {
  MM.tab = 'full';
  var p = mmParentSel(MM.sel);
  if (p) MM.sel = p;
  mmPaint();
}
function mmPhotoKey() {
  var s = MM.sel || {};
  if (s.type === 'item' || s.type === 'wine' || s.type === 'bar' || s.type === 'retail') return s.id;
  if (s.type === 'pfdish' || s.type === 'tmcourse' || s.type === 'tmpair') return s.type + ':' + s.id;
  return s.id || '';
}
function applyPhotoUrlToCurrent(url) {
  if (!url) return;
  var s = MM.sel || {};
  if (s.type === 'item') { var it = mmFindItem(s.id); if (it) it.photoUrl = url; }
  if (s.type === 'pfdish') {
    var d = mmFindPfDish(s.id); if (d) d.photoUrl = url;
    var pf = mmFindPf(mmJoinParent(s.id)); if (pf) mmRebuildPf(pf);
  }
  if (s.type === 'tmcourse') { var c = mmFindTmCourse(s.id); if (c) c.photoUrl = url; }
  if (s.type === 'wine') { var w = (STATE.wines || []).filter(function (x) { return x.id === s.id; })[0]; if (w) w.photoUrl = url; }
  if (s.type === 'bar') { var b = (STATE.bar || []).filter(function (x) { return x.id === s.id; })[0]; if (b) b.photoUrl = url; }
  if (s.type === 'retail') { var p = (STATE.retail || []).filter(function (x) { return x.id === s.id; })[0]; if (p) p.photoUrl = url; }
  if (typeof rememberMenuPhoto === 'function') rememberMenuPhoto(mmPhotoKey(), url);
  if (typeof saveMenuPhotos === 'function') saveMenuPhotos();
  var inp = $('ie-photo');
  if (inp && typeof showPhotoPreview === 'function') showPhotoPreview(inp, url);
}
function mmPhotoLooksValid(url) {
  return typeof isDisplayablePhotoUrl === 'function' ? isDisplayablePhotoUrl(url) : !!(url && (url.indexOf('http') === 0 || url.indexOf('data:image/') === 0));
}
function mmResolveItemPhoto(obj, key) {
  if (!obj) return '';
  if (mmPhotoLooksValid(obj.photoUrl)) return obj.photoUrl;
  var map = STATE.menuPhotos || {};
  var k = key || obj.id;
  if (k && mmPhotoLooksValid(map[k])) return map[k];
  return '';
}
function mmLookupPhotoUrl(id) {
  if (!id) return '';
  var it = mmFindItem(id);
  if (it) return mmResolveItemPhoto(it);
  var d = mmFindPfDish(id);
  if (d) return mmResolveItemPhoto(d, 'pfdish:' + id);
  var c = mmFindTmCourse(id);
  if (c) return mmResolveItemPhoto(c, 'tmcourse:' + id);
  var map = STATE.menuPhotos || {};
  var keys = [id, 'pfdish:' + id, 'tmcourse:' + id];
  for (var i = 0; i < keys.length; i++) {
    if (mmPhotoLooksValid(map[keys[i]])) return map[keys[i]];
  }
  return '';
}
function mmThumbHtml(obj, key) {
  var k = key || (obj && obj.id) || '';
  return '<img class="mm-thumb" data-photo-id="' + esc(k) + '" alt="">';
}
function mmHydratePhotos() {
  if (typeof applyMenuPhotos === 'function') applyMenuPhotos();
  document.querySelectorAll('.mm-thumb[data-photo-id]').forEach(function (el) {
    var url = mmLookupPhotoUrl(el.getAttribute('data-photo-id'));
    if (url) {
      el.src = url;
      el.onerror = function () {
        var fallback = (STATE.menuPhotos || {})[el.getAttribute('data-photo-id')] || (STATE.menuPhotos || {})['pfdish:' + el.getAttribute('data-photo-id')] || '';
        if (fallback && fallback.indexOf('data:image/') === 0 && el.src !== fallback) el.src = fallback;
      };
    }
  });
  var hero = document.querySelector('.mc-photo-row .upload-preview');
  if (!hero) return;
  var url = '';
  var s = MM.sel || {};
  if (s.type === 'item') url = mmResolveItemPhoto(mmFindItem(s.id));
  else if (s.type === 'pfdish') url = mmResolveItemPhoto(mmFindPfDish(s.id), 'pfdish:' + s.id);
  else if (s.type === 'tmcourse') url = mmResolveItemPhoto(mmFindTmCourse(s.id), 'tmcourse:' + s.id);
  if (!url) url = mmLookupPhotoUrl(mmPhotoKey()) || ((STATE.menuPhotos || {})[mmPhotoKey()] || '');
  if (mmPhotoLooksValid(url)) {
    hero.src = url;
    hero.style.display = 'block';
  }
}
function mmPhotoField(url) {
  var inputVal = typeof photoInputDisplayValue === 'function' ? photoInputDisplayValue(url) : ((url && url.indexOf('http') === 0) ? url : '');
  var attached = mmPhotoLooksValid(url) && !inputVal;
  return fld('Photo',
    '<div class="mc-photo-row">' +
      '<div class="mc-photo-controls">' +
        '<input class="input" id="ie-photo" value="' + esc(inputVal) + '" placeholder="' + (attached ? 'Photo attached — upload to replace' : 'Paste URL or Upload') + '" style="flex:1;" oninput="showPhotoPreview(this,this.value); if(typeof applyPhotoUrlToCurrent===\'function\') applyPhotoUrlToCurrent(this.value)">' +
        '<label class="btn btn-gold btn-sm mm-photo-pick">📷 Upload' +
          '<input type="file" accept="image/*" onchange="handleMenuItemPhotoPick(this)">' +
        '</label>' +
      '</div>' +
      '<img class="upload-preview mm-photo-hero" alt="Dish photo">' +
    '</div>');
}
function mmBody() {
  var tabs = ['full', 'items', 'modifiers', 'taxes'].map(function (t) {
    var label = { full: 'Full menu', items: 'Items', modifiers: 'Modifiers', taxes: 'Taxes' }[t];
    return '<button class="mm-tab' + (MM.tab === t ? ' on' : '') + '" onclick="mmTab(\'' + t + '\')">' + label + '</button>';
  }).join('');
  var crumb = '<button type="button" class="mm-clink" onclick="go(\'overview\')">Home</button> / <button type="button" class="mm-clink" onclick="MM.tab=\'full\'; MM.sel={type:\'book\',id:(MM.sel&&MM.sel.type===\'book\'?MM.sel.id:\'mb_dinner\')}; mmPaint()">Menu manager</button>';
  var here = '';
  if (MM.sel && MM.sel.type === 'item') { var it = mmFindItem(MM.sel.id); here = it ? it.name : 'Item'; }
  else if (MM.sel && MM.sel.type === 'pfdish') { var d = mmFindPfDish(MM.sel.id); here = d ? d.name : 'Item'; }
  else if (MM.sel && MM.sel.type === 'tmcourse') { var c = mmFindTmCourse(MM.sel.id); here = c ? c.name : 'Item'; }
  else if (MM.sel && MM.sel.type === 'group') { var g = mmFindGroup(MM.sel.id); here = g ? g.name : (MM.sel.id === 'c_wine_glass' ? 'Wine by the glass' : MM.sel.id === 'c_wine_bottle' ? 'Wine by the bottle' : 'Group'); }
  else if (MM.sel && MM.sel.type === 'book') { var bk = (STATE.menuBooks || []).filter(function (b) { return b.id === MM.sel.id; })[0]; here = bk ? bk.name : ''; }
  else if (MM.sel && MM.sel.type === 'pfmenu') { var pfm = mmFindPf(MM.sel.id); here = pfm ? pfm.name : 'Prix fixe'; }
  else if (MM.sel && MM.sel.type === 'tmmenu') { var tmm = mmFindTm(MM.sel.id); here = tmm ? tmm.name : 'Tasting'; }
  if (here) crumb += ' / ' + esc(here);
  var backBtn = mmCanBack() ? '<button type="button" class="mm-back" onclick="mmBack()">← Back</button>' : '';
  return '<div class="mm-app">' +
    '<div class="mm-top">' +
      '<div style="display:flex;align-items:center;gap:12px;min-width:0">' +
        '<div class="menu-toggle" onclick="toggleSidebar()">☰</div>' +
        backBtn +
        '<div><div class="mm-crumb">' + crumb + '</div><div class="mm-title">Menu manager</div></div>' +
      '</div>' +
      '<div class="mm-actions">' +
        '<input class="mm-search" id="mm-q" placeholder="Find a menu, group, or item" value="' + esc(MM.q || '') + '" oninput="MM.q=this.value; mmFlush(); mmPaint()">' +
        '<button class="btn btn-ghost btn-sm" onclick="openAiSettings()">AI</button>' +
        '<button class="btn btn-ghost btn-sm" onclick="mmSaveWorkspace()">Save</button>' +
        '<button class="btn btn-gold btn-sm" onclick="mmFlush(); publishMenusToFrontOfHouse()">Publish all changes</button>' +
      '</div>' +
    '</div>' +
    '<div class="mm-tabs">' + tabs + '</div>' +
    (MM.tab === 'full' ? mmFullView() : MM.tab === 'items' ? mmItemsView() : MM.tab === 'modifiers' ? mmModsView() : mmTaxesView()) +
  '</div>';
}
function mmQ() { return (MM.q || '').trim().toLowerCase(); }
function mmMatch(s) { var q = mmQ(); if (!q) return true; return (s || '').toLowerCase().indexOf(q) > -1; }
function mmFindItem(id) { return (STATE.menuItems || []).filter(function (x) { return x.id === id; })[0]; }
function mmFindGroup(id) { return (STATE.menuCats || []).filter(function (x) { return x.id === id; })[0]; }
function mmFindMod(id) { return (STATE.modGroups || []).filter(function (x) { return x.id === id; })[0]; }
function mmJoin(a, b) { return a + '|' + b; }
function mmJoinParent(id) { var i = String(id || '').indexOf('|'); return i < 0 ? id : id.slice(0, i); }
function mmJoinChild(id) { var i = String(id || '').indexOf('|'); return i < 0 ? '' : id.slice(i + 1); }
function mmDefaultTaxes() { return (STATE.taxRates || []).filter(function (t) { return t.isDefault; }).map(function (t) { return t.id; }); }
function mmFindPf(id) { return (STATE.prixFixeMenus || []).filter(function (x) { return x.id === id; })[0]; }
function mmFindTm(id) { return (STATE.tastingMenus || []).filter(function (x) { return x.id === id; })[0]; }
function mmFindPfDish(joinId) {
  var pf = mmFindPf(mmJoinParent(joinId)); if (!pf) return null;
  var id = mmJoinChild(joinId);
  return (pf.dishes || []).filter(function (d) { return d.id === id; })[0] || null;
}
function mmFindTmCourse(joinId) {
  var tm = mmFindTm(mmJoinParent(joinId)); if (!tm) return null;
  var id = mmJoinChild(joinId);
  return (tm.courses || []).filter(function (c) { return c.id === id; })[0] || null;
}
function mmAttachTemps(it) {
  if (!it) return;
  it.modGroupIds = it.modGroupIds || [];
  var n = (it.name || '').toLowerCase();
  var raw = /tartare|crudo|carpaccio|ceviche/.test(n);
  if (!raw && /\b(steak|ribeye|filet|sirloin|burger|hamburger|wagyu|porterhouse|strip steak|filet mignon|pork chop|pork medallion)\b/.test(n)) {
    if (it.modGroupIds.indexOf('mg_meat_temp') < 0) it.modGroupIds.push('mg_meat_temp');
  }
  if (!raw && /\b(salmon|tuna|ahi|halibut|cod|branzino|sea bass)\b/.test(n)) {
    if (it.modGroupIds.indexOf('mg_fish_temp') < 0) it.modGroupIds.push('mg_fish_temp');
  }
}
function mmTmInferGroup(tm, c) {
  if (c.mode === 'entremets') return 'Entremets';
  if (c.mode === 'later') return 'Dolce';
  var did = String(c.dishId || '');
  if (did.indexOf('_w_') >= 0 || did.indexOf('sf_w_') >= 0) return 'Welcome';
  if (tm && tm.welcomeFireEach && (c.num || 99) <= 3) return 'Welcome';
  return 'Courses';
}
function mmTmGroupName(tm, c) { return (c && c.group) || mmTmInferGroup(tm, c); }
function mmTmGroups(tm) {
  var names = [];
  (tm.courses || []).forEach(function (c) {
    var g = mmTmGroupName(tm, c);
    if (names.indexOf(g) < 0) names.push(g);
  });
  if (!names.length) names.push('Courses');
  return names;
}
function mmRebuildPf(pf) {
  if (!pf) return;
  pf.dishes = pf.dishes || [];
  pf.courses = pf.courses || [];
  if (!pf.dishes.length && pf.courses.some(function (c) { return c.options && c.options.length; })) {
    pf.courses.forEach(function (c, ci) {
      (c.options || []).forEach(function (o, oi) {
        pf.dishes.push({
          id: o.id || uid('pfd'), name: o.name, desc: o.desc || '', upcharge: o.upcharge || 0,
          photoUrl: o.photoUrl || '', story: o.story || '', storyUrl: o.storyUrl || '', course: c.label, station: o.station || KITCHEN_STATIONS[0],
          pairing: o.pairing || '', pairWhite: o.pairWhite || '', pairRed: o.pairRed || '', pairDessert: o.pairDessert || '',
          ingredients: o.ingredients || '', askTemp: o.askTemp || '',
          allergens: o.allergens || [], cookNote: o.cookNote || '',
          chooseCount: o.chooseCount || 0, scoops: o.scoops || null, dietary: o.dietary || [],
          cookTime: o.cookTime || 0, cookMin: o.cookTime || 0, i18n: o.i18n || {},
          modGroupIds: o.modGroupIds || [], taxIds: o.taxIds || mmDefaultTaxes(), order: oi, active: true
        });
      });
    });
  }
  pf.courses.forEach(function (c, i) {
    if (!c.id) c.id = uid('pfc');
    if (c.order === undefined) c.order = i;
  });
  pf.dishes.forEach(function (d, i) {
    if (!d.id) d.id = uid('pfd');
    if (d.order === undefined) d.order = i;
    if (!d.taxIds) d.taxIds = mmDefaultTaxes();
    d.modGroupIds = d.modGroupIds || [];
    mmAttachTemps(d);
  });
  var haveLabel = {};
  pf.courses.forEach(function (c) { if (c.label) haveLabel[c.label] = 1; });
  pf.dishes.forEach(function (d) {
    if (d.course && !haveLabel[d.course]) {
      pf.courses.push({ id: uid('pfc'), label: d.course, order: pf.courses.length, mode: 'choose', visible: true });
      haveLabel[d.course] = 1;
    }
  });
  pf.courses.forEach(function (c) {
    c.options = pf.dishes.filter(function (d) { return d.course === c.label; }).sort(function (a, b) { return (a.order || 0) - (b.order || 0); }).map(function (d) {
      return {
        id: d.id, name: d.name, desc: d.desc, station: d.station, upcharge: d.upcharge || 0,
        pairing: d.pairing || '', pairWhite: d.pairWhite || '', pairRed: d.pairRed || '', pairDessert: d.pairDessert || '',
        photoUrl: d.photoUrl || '', story: d.story || '', storyUrl: d.storyUrl || '',
        ingredients: d.ingredients || '', askTemp: d.askTemp || '',
        allergens: d.allergens || [],
        cookNote: d.cookNote || '', chooseCount: d.chooseCount || 0, scoops: d.scoops || null,
        dietary: d.diet || d.dietary || [], cookTime: d.cookMin || d.cookTime || 0, i18n: d.i18n || {},
        modGroupIds: d.modGroupIds || [], taxIds: d.taxIds || []
      };
    });
  });
  pf.courseGroups = pf.courses.map(function (c) {
    return { label: c.label, choose: c.mode === 'choose' || c.mode === 'later' ? 1 : 0, mode: c.mode, fireEach: !!c.fireEach, fireAfter: c.fireAfter || '', options: c.options };
  });
  pf.welcomeFireEach = pf.courses.some(function (c) { return c.mode === 'auto'; });
}
function mmNormTm(tm) {
  if (!tm) return;
  tm.courses = tm.courses || [];
  tm.pairings = tm.pairings || [];
  tm.courses.forEach(function (c, i) {
    if (!c.id) c.id = 'tmc_' + (c.num || (i + 1)) + '_' + (tm.id || 'tm');
    if (!c.group) c.group = mmTmInferGroup(tm, c);
    if (!c.taxIds) c.taxIds = mmDefaultTaxes();
    c.modGroupIds = c.modGroupIds || [];
    mmAttachTemps(c);
  });
}
function mmItemsInGroup(gid) { return (STATE.menuItems || []).filter(function (it) { return (it.catIds || []).indexOf(gid) > -1 && it.active !== false; }); }
function mmFoodGroups(book) {
  var ids = book.groupIds || [];
  return (STATE.menuCats || []).filter(function (c) {
    if ((c.kind || 'food') === 'wine') return false;
    if (ids.length) return ids.indexOf(c.id) > -1;
    return true;
  });
}
function mmFullView() {
  return '<div class="mm-body"><div class="mm-tree">' + mmTreeHtml() + '</div><div class="mm-detail">' + mmDetailHtml() + '</div></div>';
}
function mmTreeHtml() {
  var html = '';
  (STATE.menuBooks || []).forEach(function (book) {
    if (mmQ() && !mmMatch(book.name) && !mmBookHasQuery(book)) return;
    var open = MM.open[book.id];
    html += '<div class="mm-row' + (mmSelIs('book', book.id) ? ' on' : '') + '" onclick="mmSelect(\'book\',\'' + book.id + '\')">' +
      '<span class="mm-caret" onclick="mmToggleBook(\'' + book.id + '\',event)">' + (open ? '▾' : '▸') + '</span>' +
      '<span>' + esc(book.name) + '</span><span class="mm-kind">Menu</span></div>';
    if (!open) return;
    if (book.kind === 'food') {
      mmFoodGroups(book).forEach(function (g) {
        if (mmQ() && !mmMatch(g.name) && !mmItemsInGroup(g.id).some(function (it) { return mmMatch(it.name); })) return;
        html += '<div class="mm-row indent-1' + (mmSelIs('group', g.id) ? ' on' : '') + '" onclick="mmSelect(\'group\',\'' + g.id + '\')">' +
          '<span class="mm-caret">▸</span><span>' + esc(g.name) + '</span><span class="mm-kind">Group</span></div>';
        mmItemsInGroup(g.id).forEach(function (it) {
          if (!mmMatch(it.name) && mmQ()) return;
          html += '<div class="mm-row indent-2' + (mmSelIs('item', it.id) ? ' on' : '') + '" onclick="mmSelect(\'item\',\'' + it.id + '\')">' +
            '<span>' + esc(it.name) + '</span><span class="mm-kind">Item</span></div>';
        });
        html += '<button class="mm-add" onclick="event.stopPropagation(); mmAddItem(\'' + g.id + '\')">+ Add item</button>';
      });
      html += '<button class="mm-add" onclick="event.stopPropagation(); mmAddGroup(\'' + book.id + '\')">+ Add group to ' + esc(book.name) + '</button>';
    } else if (book.kind === 'bar') {
      ['Cocktail', 'Beer', 'Spirit'].forEach(function (k) {
        html += '<div class="mm-row indent-1"><span>' + k + '</span><span class="mm-kind">Group</span></div>';
        (STATE.bar || []).filter(function (b) { return b.kind === k && (!mmQ() || mmMatch(b.name)); }).forEach(function (b) {
          html += '<div class="mm-row indent-2' + (mmSelIs('bar', b.id) ? ' on' : '') + '" onclick="mmSelect(\'bar\',\'' + b.id + '\')"><span>' + esc(b.name) + '</span><span class="mm-kind">Item</span></div>';
        });
      });
    } else if (book.kind === 'wine') {
      html += '<div class="mm-row indent-1' + (mmSelIs('group', 'c_wine_glass') ? ' on' : '') + '" onclick="mmSelect(\'group\',\'c_wine_glass\')"><span>Wine by the glass</span><span class="mm-kind">Subgroup</span></div>';
      html += '<div class="mm-row indent-1' + (mmSelIs('group', 'c_wine_bottle') ? ' on' : '') + '" onclick="mmSelect(\'group\',\'c_wine_bottle\')"><span>Wine by the bottle</span><span class="mm-kind">Subgroup</span></div>';
      html += '<div class="mm-row indent-1' + (mmSelIs('group', 'c_wine_flights') ? ' on' : '') + '" onclick="mmSelect(\'group\',\'c_wine_flights\')"><span>Wine flights</span><span class="mm-kind">Subgroup</span></div>';
      var q = mmQ();
      if (!q) {
        html += '<div class="mm-row indent-2"><span style="opacity:.7">Type in Find to list ' + (STATE.wines || []).length + ' bottles</span></div>';
      } else {
        var shown = 0;
        (STATE.wines || []).forEach(function (w) {
          if (shown >= 80) return;
          if (!mmMatch(w.name + ' ' + (w.vin || '') + ' ' + (w.region || '') + ' ' + (w.vintage || ''))) return;
          shown += 1;
          html += '<div class="mm-row indent-2' + (mmSelIs('wine', w.id) ? ' on' : '') + '" onclick="mmSelect(\'wine\',\'' + w.id + '\')"><span>' + esc(w.name) + '</span><span class="mm-kind">' + (w.stock || 0) + ' btl</span></div>';
        });
      }
    } else if (book.kind === 'retail') {
      (STATE.retail || []).forEach(function (p) {
        if (mmQ() && !mmMatch(p.name)) return;
        html += '<div class="mm-row indent-1' + (mmSelIs('retail', p.id) ? ' on' : '') + '" onclick="mmSelect(\'retail\',\'' + p.id + '\')"><span>' + esc(p.name) + '</span><span class="mm-kind">Item</span></div>';
      });
    } else if (book.kind === 'prixfixe') {
      (STATE.prixFixeMenus || []).forEach(function (pf) {
        if (mmQ() && !mmMatch(pf.name) && !(pf.dishes || []).some(function (d) { return mmMatch(d.name); })) return;
        var popen = MM.open['pf:' + pf.id];
        html += '<div class="mm-row indent-1' + (mmSelIs('pfmenu', pf.id) ? ' on' : '') + '" onclick="mmSelect(\'pfmenu\',\'' + pf.id + '\')">' +
          '<span class="mm-caret" onclick="MM.open[\'pf:' + pf.id + '\']=!MM.open[\'pf:' + pf.id + '\']; event.stopPropagation(); mmPaint()">' + (popen ? '▾' : '▸') + '</span>' +
          '<span>' + esc(pf.name) + '</span><span class="mm-kind">Menu</span></div>';
        if (!popen) return;
        (pf.courses || []).sort(function (a, b) { return (a.order || 0) - (b.order || 0); }).forEach(function (g) {
          var gid = mmJoin(pf.id, g.id);
          html += '<div class="mm-row indent-2' + (mmSelIs('pfcourse', gid) ? ' on' : '') + '" onclick="mmSelect(\'pfcourse\',\'' + gid + '\')">' +
            '<span class="mm-caret">▸</span><span>' + esc(g.label) + '</span><span class="mm-kind">Group</span></div>';
          (pf.dishes || []).filter(function (d) { return d.course === g.label; }).forEach(function (d) {
            if (mmQ() && !mmMatch(d.name)) return;
            var did = mmJoin(pf.id, d.id);
            html += '<div class="mm-row indent-3' + (mmSelIs('pfdish', did) ? ' on' : '') + '" onclick="mmSelect(\'pfdish\',\'' + did + '\')">' +
              '<span>' + esc(d.name) + '</span><span class="mm-kind">Item</span></div>';
          });
          html += '<button class="mm-add" onclick="event.stopPropagation(); mmAddPfDish(\'' + pf.id + '\',\'' + encodeURIComponent(g.label) + '\')">+ Add item</button>';
        });
        html += '<button class="mm-add" onclick="event.stopPropagation(); mmAddPfCourse(\'' + pf.id + '\')">+ Add group to ' + esc(pf.name) + '</button>';
      });
      html += '<button class="mm-add" onclick="event.stopPropagation(); mmAddPfMenu()">+ Add prix fixe menu</button>';
    } else if (book.kind === 'tasting') {
      (STATE.tastingMenus || []).forEach(function (tm) {
        if (mmQ() && !mmMatch(tm.name) && !(tm.courses || []).some(function (c) { return mmMatch(c.name); })) return;
        var topen = MM.open['tm:' + tm.id];
        html += '<div class="mm-row indent-1' + (mmSelIs('tmmenu', tm.id) ? ' on' : '') + '" onclick="mmSelect(\'tmmenu\',\'' + tm.id + '\')">' +
          '<span class="mm-caret" onclick="MM.open[\'tm:' + tm.id + '\']=!MM.open[\'tm:' + tm.id + '\']; event.stopPropagation(); mmPaint()">' + (topen ? '▾' : '▸') + '</span>' +
          '<span>' + esc(tm.name) + '</span><span class="mm-kind">Menu</span></div>';
        if (!topen) return;
        mmTmGroups(tm).forEach(function (gname) {
          var gid = mmJoin(tm.id, encodeURIComponent(gname));
          html += '<div class="mm-row indent-2' + (mmSelIs('tmgroup', gid) ? ' on' : '') + '" onclick="mmSelect(\'tmgroup\',\'' + gid + '\')">' +
            '<span class="mm-caret">▸</span><span>' + esc(gname) + '</span><span class="mm-kind">Group</span></div>';
          (tm.courses || []).filter(function (c) { return mmTmGroupName(tm, c) === gname; }).forEach(function (c) {
            if (mmQ() && !mmMatch(c.name)) return;
            var cid = mmJoin(tm.id, c.id);
            html += '<div class="mm-row indent-3' + (mmSelIs('tmcourse', cid) ? ' on' : '') + '" onclick="mmSelect(\'tmcourse\',\'' + cid + '\')">' +
              '<span>' + esc(c.name) + '</span><span class="mm-kind">Item</span></div>';
          });
          html += '<button class="mm-add" onclick="event.stopPropagation(); mmAddTmCourse(\'' + tm.id + '\',\'' + encodeURIComponent(gname) + '\')">+ Add item</button>';
        });
        var pairGid = mmJoin(tm.id, 'pairings');
        html += '<div class="mm-row indent-2' + (mmSelIs('tmpairgroup', pairGid) ? ' on' : '') + '" onclick="mmSelect(\'tmpairgroup\',\'' + pairGid + '\')">' +
          '<span class="mm-caret">▸</span><span>Wine pairings</span><span class="mm-kind">Group</span></div>';
        (tm.pairings || []).forEach(function (p) {
          if (mmQ() && !mmMatch(p.name)) return;
          var pid = mmJoin(tm.id, p.id || p.name);
          html += '<div class="mm-row indent-3' + (mmSelIs('tmpair', pid) ? ' on' : '') + '" onclick="mmSelect(\'tmpair\',\'' + pid + '\')"><span>' + esc(p.name) + '</span><span class="mm-kind">Item</span></div>';
        });
        html += '<button class="mm-add" onclick="event.stopPropagation(); mmAddTmPair(\'' + tm.id + '\')">+ Add pairing</button>';
        html += '<button class="mm-add" onclick="event.stopPropagation(); mmAddTmGroup(\'' + tm.id + '\')">+ Add group to ' + esc(tm.name) + '</button>';
      });
      html += '<button class="mm-add" onclick="event.stopPropagation(); mmAddTmMenu()">+ Add tasting menu</button>';
    }
  });
  return html || '<div class="mm-empty">No menus yet.</div>';
}
function mmBookHasQuery(book) {
  if (book.kind === 'food') {
    return mmFoodGroups(book).some(function (g) {
      return mmMatch(g.name) || mmItemsInGroup(g.id).some(function (it) { return mmMatch(it.name); });
    });
  }
  if (book.kind === 'wine') return (STATE.wines || []).some(function (w) { return mmMatch(w.name); });
  if (book.kind === 'bar') return (STATE.bar || []).some(function (b) { return mmMatch(b.name); });
  if (book.kind === 'retail') return (STATE.retail || []).some(function (p) { return mmMatch(p.name); });
  if (book.kind === 'prixfixe') {
    return (STATE.prixFixeMenus || []).some(function (pf) {
      return mmMatch(pf.name) || (pf.dishes || []).some(function (d) { return mmMatch(d.name); });
    });
  }
  if (book.kind === 'tasting') {
    return (STATE.tastingMenus || []).some(function (tm) {
      return mmMatch(tm.name) || (tm.courses || []).some(function (c) { return mmMatch(c.name); });
    });
  }
  return false;
}
function mmDetailHtml() {
  var s = MM.sel || {};
  if (s.type === 'item') return mmItemEditor(s.id);
  if (s.type === 'group') return mmGroupEditor(s.id);
  if (s.type === 'mod') return mmModEditor(s.id);
  if (s.type === 'wine') return mmWineEditor(s.id);
  if (s.type === 'bar') return mmBarPanel(s.id);
  if (s.type === 'retail') return mmRetailPanel(s.id);
  if (s.type === 'book') return mmBookPanel(s.id);
  if (s.type === 'pfmenu') return mmPfMenuEditor(s.id);
  if (s.type === 'pfcourse') return mmPfCourseEditor(s.id);
  if (s.type === 'pfdish') return mmPfDishEditor(s.id);
  if (s.type === 'tmmenu') return mmTmMenuEditor(s.id);
  if (s.type === 'tmgroup') return mmTmGroupEditor(s.id);
  if (s.type === 'tmcourse') return mmTmCourseEditor(s.id);
  if (s.type === 'tmpair') return mmTmPairEditor(s.id);
  if (s.type === 'tmpairgroup') return mmTmPairGroupEditor(s.id);
  return '<div class="mm-empty">Select a menu, group, or item on the left.</div>';
}
function mmBookPanel(id) {
  var book = (STATE.menuBooks || []).filter(function (b) { return b.id === id; })[0];
  if (!book) return '<div class="mm-empty">Menu not found.</div>';
  var count = 0;
  if (book.kind === 'food') mmFoodGroups(book).forEach(function (g) { count += mmItemsInGroup(g.id).length; });
  if (book.kind === 'wine') count = (STATE.wines || []).length;
  if (book.kind === 'bar') count = (STATE.bar || []).length;
  if (book.kind === 'retail') count = (STATE.retail || []).length;
  if (book.kind === 'prixfixe') count = (STATE.prixFixeMenus || []).reduce(function (n, pf) { return n + (pf.dishes || []).length; }, 0);
  if (book.kind === 'tasting') count = (STATE.tastingMenus || []).reduce(function (n, tm) { return n + (tm.courses || []).length; }, 0);
  return '<div class="mm-card"><h3>MENU ' + esc(book.name) + '</h3>' +
    '<p class="mm-hint">' + count + ' item' + (count === 1 ? '' : 's') + ' · click a group on the left, then an item to edit name, description, price, tax, and modifiers.</p>' +
    (book.kind === 'food' ? '<button class="btn btn-ghost btn-sm" onclick="mmAddGroup(\'' + book.id + '\')">+ Add group</button> ' : '') +
    (book.kind === 'prixfixe' ? '<button class="btn btn-ghost btn-sm" onclick="mmAddPfMenu()">+ Add prix fixe menu</button>' : '') +
    (book.kind === 'tasting' ? '<button class="btn btn-ghost btn-sm" onclick="mmAddTmMenu()">+ Add tasting menu</button>' : '') +
    '</div>';
}
function mmGroupEditor(id) {
  if (id === 'c_wine_flights') {
    var flights = (STATE.wineFlights || []).map(function (f) {
      return '<div class="mm-item-card"><div><div class="mm-item-name">' + esc(f.name) + '</div><div class="mm-item-meta">' + ((f.wines || []).length) + ' wines · ' + (f.pourOz || 2) + ' oz each</div></div><div class="mm-price">' + money(f.price) + '</div></div>';
    }).join('');
    return '<div class="mm-card"><h3>SUBGROUP Wine flights</h3>' +
      '<p class="mm-hint">Flights will pour 2 oz tastes from the same bottle inventory (25 oz per 750ml). Add flights after the by-the-glass list is loaded.</p>' +
      (flights || '<div class="mm-empty">No flights yet.</div>') +
      '<button type="button" class="mm-add" onclick="mmAddWineFlight()">+ Add flight</button></div>';
  }
  if (id === 'c_wine_glass' || id === 'c_wine_bottle') {
    var glass = id === 'c_wine_glass';
    if (glass) {
      var btg = (STATE.wines || []).filter(function (w) { return w && (w.byTheGlass || Number(w.glassPrice) > 0); });
      var grow = btg.map(function (w) {
        return '<div class="mm-item-card" onclick="mmSelect(\'wine\',\'' + w.id + '\')"><div><div class="mm-item-name">' + esc(w.name) + '</div><div class="mm-item-meta">' + (w.stock || 0) + ' bottles · 6 oz / 2 oz pours</div></div><div class="mm-price">' + money(w.glassPrice) + '</div></div>';
      }).join('');
      return '<div class="mm-card"><h3>SUBGROUP Wine by the glass</h3>' +
        '<p class="mm-hint">Not loaded yet. When the by-the-glass page is uploaded, glasses (6 oz) and tastes (2 oz) will decrement these bottles. Each bottle holds 25 oz.</p>' +
        (grow || '<div class="mm-empty">No wines by the glass yet.</div>') + '</div>';
    }
    var q = mmQ();
    var list = (STATE.wines || []).filter(function (w) { return !q || mmMatch(w.name + ' ' + (w.vin || '') + ' ' + (w.region || '') + ' ' + (w.vintage || '')); });
    var extra = list.length > 80 ? list.length - 80 : 0;
    var rows = list.slice(0, 80).map(function (w) {
      return '<div class="mm-item-card" onclick="mmSelect(\'wine\',\'' + w.id + '\')"><div><div class="mm-item-name">' + esc(w.name) + '</div><div class="mm-item-meta">' + esc(w.vintage || '') + ' · ' + esc(w.region || '') + ' · ' + (w.stock || 0) + ' bottles</div></div><div class="mm-price">' + money(w.bottlePrice) + '</div></div>';
    }).join('');
    return '<div class="mm-card"><h3>SUBGROUP Wine by the bottle</h3>' +
      '<p class="mm-hint">' + (STATE.wines || []).length + ' labels. Search in Find to jump to a bottle. Stock is editable and drops when POS sells one.</p>' +
      (rows || '<div class="mm-empty">Type a name, bin, or vintage in Find.</div>') +
      (extra ? '<p class="mm-hint">+' + extra + ' more — refine the search.</p>' : '') + '</div>';
  }
  var g = mmFindGroup(id);
  if (!g) return '<div class="mm-empty">Group not found.</div>';
  var items = mmItemsInGroup(g.id);
  var list = items.map(function (it) {
    return '<div class="mm-item-card' + (mmSelIs('item', it.id) ? ' on' : '') + '" onclick="mmSelect(\'item\',\'' + it.id + '\')">' +
      mmThumbHtml(it) +
      '<div><div class="mm-item-name">ITEM ' + esc(it.name) + '</div><div class="mm-item-meta">' + (it.modGroupIds || []).length + ' modifier group' + ((it.modGroupIds || []).length === 1 ? '' : 's') + '</div></div>' +
      '<div class="mm-price">' + money(it.price) + '</div></div>';
  }).join('');
  return '<form id="mm-editor" data-type="group" data-id="' + g.id + '">' +
    '<div class="mm-card"><h3>MENU GROUP ' + esc(g.name) + '</h3>' +
    fld('Group name', '<input class="input" id="mm-g-name" value="' + esc(g.name) + '">') +
    fld('POS name (button label)', '<input class="input" id="mm-g-pos" value="' + esc(g.posName || '') + '" placeholder="Optional shorter name on POS">') +
    '<label class="cbx"><input type="checkbox" id="mm-g-vis"' + (g.visible !== false ? ' checked' : '') + '> Show on POS &amp; iPad</label>' +
    '<div style="margin-top:12px"><button type="button" class="btn btn-gold btn-sm" onclick="mmSaveGroupFromForm(\'' + g.id + '\',true)">Save group</button> ' +
    '<button type="button" class="mm-back" onclick="mmBack()">← Back</button> ' +
    '<button type="button" class="btn btn-danger btn-sm" onclick="deleteCat(\'' + g.id + '\')">Delete group</button></div></div>' +
    '<div class="mm-card"><h3>Items in this group</h3>' + (list || '<div class="mm-empty">No items yet.</div>') +
    '<button type="button" class="mm-add" onclick="mmAddItem(\'' + g.id + '\')">+ Add item</button></div></form>';
}
function mmItemEditor(id) {
  var it = mmFindItem(id);
  if (!it) return '<div class="mm-empty">Item not found. Click an item in the tree.</div>';
  var catChecks = STATE.menuCats.filter(function (c) { return (c.kind || 'food') !== 'wine'; }).map(function (c) {
    return '<label class="cbx"><input type="checkbox" class="ie-cat" value="' + c.id + '"' + ((it.catIds || []).indexOf(c.id) > -1 ? ' checked' : '') + '> ' + esc(c.name) + '</label>';
  }).join('');
  var modChecks = STATE.modGroups.map(function (g) {
    return '<label class="cbx"><input type="checkbox" class="ie-mod" value="' + g.id + '"' + ((it.modGroupIds || []).indexOf(g.id) > -1 ? ' checked' : '') + '> ' + esc(g.name) + (g.required ? ' <span class="mm-pill">required</span>' : '') + '</label>';
  }).join('');
  var taxChecks = (STATE.taxRates || []).map(function (t) {
    return '<label class="cbx"><input type="checkbox" class="ie-tax" value="' + t.id + '"' + ((it.taxIds || []).indexOf(t.id) > -1 ? ' checked' : '') + '> ' + esc(t.name) + ' (' + t.rate + '%)</label>';
  }).join('');
  return '<form id="mm-editor" data-type="item" data-id="' + it.id + '">' +
    '<div class="mm-card"><h3>ITEM ' + esc(it.name) + '</h3>' +
    fld('Name', '<input class="input" id="ie-name" value="' + esc(it.name) + '" placeholder="Dish name">') +
    mmPhotoField(mmResolveItemPhoto(it, mmPhotoKey())) +
    fld('Description (POS &amp; iPad)', '<textarea class="input" id="ie-desc" rows="4">' + esc(it.desc || '') + '</textarea>') +
    fld('Story for iPad (origin, farm, family — guests see this when they tap the dish)', '<textarea class="input" id="ie-story" rows="4" placeholder="e.g. Filet mignon from Dutton Ranch in South Carolina. The Dutton family has raised cattle on the same land for generations…">' + esc(it.story || '') + '</textarea>') +
    fld('Story link (optional farm, village, or producer URL)', '<input class="input" id="ie-story-url" value="' + esc(it.storyUrl || '') + '" placeholder="https://…">') +
    '<div class="ff-row cols-3">' + fld('Price ($)', '<input class="input" id="ie-price" type="number" step="0.01" value="' + it.price + '">') +
      fld('Cost ($)', '<input class="input" id="ie-cost" type="number" step="0.01" value="' + (it.cost || 0) + '">') +
      fld('Item code', '<input class="input" id="ie-code" value="' + esc(it.code || '') + '">') + '</div>' +
    fld('Taxes', '<div class="cbx-grid">' + taxChecks + '</div>') +
    '<div class="ff-row cols-2">' + fld('Cook time (min)', '<input class="input" id="ie-cook" type="number" value="' + (it.cookMin || 0) + '">') +
      fld('Kitchen station', '<select class="input" id="ie-station">' + opts(KITCHEN_STATIONS, it.station) + '</select>') + '</div>' +
    '</div>' +
    '<div class="mm-card"><h3>Groups</h3>' + fld('Menu groups', '<div class="cbx-grid">' + catChecks + '</div>') + '</div>' +
    '<div class="mm-card"><h3>Modifier groups</h3><p class="mm-hint">Steaks, hamburgers, salmon, and tuna should include a temperature group.</p>' +
    fld('Attach modifiers', '<div class="cbx-grid">' + modChecks + '</div>') +
    '<button type="button" class="mm-add" onclick="mmTab(\'modifiers\')">Manage modifier options</button></div>' +
    '<div class="mm-card"><h3>Allergens &amp; kitchen</h3>' +
    fld('Ingredients', '<textarea class="input" id="ie-ing" rows="2">' + esc(it.ingredients || '') + '</textarea>') +
    '<button class="btn-analyze" type="button" onclick="runAnalysis(mmFindItem(\'' + it.id + '\'))">✨ Analyze Allergens &amp; Dietary</button>' +
    '<div id="ie-analysis" class="analysis-box">' + renderAnalysis(it.allergens, it.diet, it.verified, '') + '</div>' +
    '<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">' +
      '<button type="button" class="btn btn-gold btn-sm" onclick="mmSaveItemFromForm(\'' + it.id + '\',true)">Save item</button> ' +
      '<button type="button" class="mm-back" onclick="mmBack()">← Back</button> ' +
      '<button type="button" class="btn btn-danger btn-sm" onclick="deleteMenuItem(\'' + it.id + '\')">Delete item</button></div>' +
    '</div></form>';
}
function mmWineEditor(id) {
  var w = (STATE.wines || []).filter(function (x) { return x.id === id; })[0];
  if (!w) return '<div class="mm-empty">Wine not found.</div>';
  return '<form id="mm-editor" data-type="wine" data-id="' + w.id + '"><div class="mm-card"><h3>ITEM ' + esc(w.name) + '</h3>' +
    fld('Name', '<input class="input" id="w-name" value="' + esc(w.name) + '">') +
    '<div class="ff-row cols-2">' + fld('Producer', '<input class="input" id="w-prod" value="' + esc(w.producer || '') + '">') + fld('Vintage', '<input class="input" id="w-vintage" value="' + esc(w.vintage || '') + '">') + '</div>' +
    fld('Region', '<input class="input" id="w-region" value="' + esc(w.region || '') + '">') +
    '<div class="ff-row cols-3">' + fld('Bottle price', '<input class="input" id="w-bp" type="number" step="0.01" value="' + w.bottlePrice + '">') +
      fld('Bottles in stock', '<input class="input" id="w-stock" type="number" value="' + (w.stock || 0) + '">') +
      fld('Oz per bottle', '<input class="input" id="w-boz" type="number" step="0.1" value="' + (w.bottleOz || 25) + '">') + '</div>' +
    '<p class="mm-hint">' + esc(w.size || '750ml') + ' · glass pours (6 oz / 2 oz) stay off until the by-the-glass list is loaded.</p>' +
    '<button type="button" class="btn btn-gold btn-sm" onclick="mmSaveWineFromForm(\'' + w.id + '\',true)">Save wine</button> <button type="button" class="mm-back" onclick="mmBack()">← Back</button></div></form>';
}
function mmBarPanel(id) {
  var b = (STATE.bar || []).filter(function (x) { return x.id === id; })[0];
  if (!b) return '<div class="mm-empty">Drink not found.</div>';
  return '<form id="mm-editor" data-type="bar" data-id="' + b.id + '"><div class="mm-card"><h3>ITEM ' + esc(b.name) + '</h3>' +
    fld('Name', '<input class="input" id="b-name" value="' + esc(b.name) + '">') +
    fld('Description', '<input class="input" id="b-desc" value="' + esc(b.desc || '') + '">') +
    '<div class="ff-row cols-3">' + fld('Price', '<input class="input" id="b-price" type="number" step="0.01" value="' + b.price + '">') +
      fld('Cost', '<input class="input" id="b-cost" type="number" step="0.01" value="' + b.cost + '">') +
      fld('Stock (bottles)', '<input class="input" id="b-stock" type="number" value="' + (b.stock || 0) + '">') + '</div>' +
      fld('Type', '<select class="input" id="b-kind">' + opts(['Cocktail', 'Beer', 'Spirit'], b.kind) + '</select>') +
    '<button type="button" class="btn btn-gold btn-sm" onclick="mmSaveBarFromForm(\'' + b.id + '\',true)">Save drink</button> <button type="button" class="mm-back" onclick="mmBack()">← Back</button></div></form>';
}
function mmRetailPanel(id) {
  var p = (STATE.retail || []).filter(function (x) { return x.id === id; })[0];
  if (!p) return '<div class="mm-empty">Product not found.</div>';
  return '<form id="mm-editor" data-type="retail" data-id="' + p.id + '"><div class="mm-card"><h3>ITEM ' + esc(p.name) + '</h3>' +
    fld('Name', '<input class="input" id="r-name" value="' + esc(p.name) + '">') +
    '<div class="ff-row cols-3">' + fld('Price', '<input class="input" id="r-price" type="number" step="0.01" value="' + p.price + '">') +
      fld('Category', '<input class="input" id="r-cat" value="' + esc(p.category || '') + '">') +
      fld('Stock', '<input class="input" id="r-stock" type="number" value="' + p.stock + '">') + '</div>' +
    '<button type="button" class="btn btn-gold btn-sm" onclick="mmSaveRetailFromForm(\'' + p.id + '\',true)">Save product</button> <button type="button" class="mm-back" onclick="mmBack()">← Back</button></div></form>';
}
function mmTaxNames(ids) {
  return (ids || []).map(function (id) { var t = (STATE.taxRates || []).filter(function (x) { return x.id === id; })[0]; return t ? t.name : ''; }).filter(Boolean).join(', ');
}
function mmModNames(ids) {
  return (ids || []).map(function (id) { var g = mmFindMod(id); return g ? g.name : ''; }).filter(Boolean).join(', ');
}
function mmItemRow(kind, id, name, price, groups, mods, taxes) {
  return '<tr onclick="MM.tab=\'full\'; mmSelect(\'' + kind + '\',\'' + id + '\')">' +
    '<td><input class="input" value="' + esc(name) + '" onclick="event.stopPropagation()" onchange="mmInlineRenameKind(\'' + kind + '\',\'' + id + '\',this.value)"></td>' +
    '<td><input class="input" type="number" step="0.01" value="' + (price || 0) + '" onclick="event.stopPropagation()" onchange="mmInlinePriceKind(\'' + kind + '\',\'' + id + '\',this.value)" style="width:110px"></td>' +
    '<td>' + esc(groups || '') + '</td>' +
    '<td>' + esc(mods || '') + '</td>' +
    '<td>' + esc(taxes || '') + '</td>' +
  '</tr>';
}
function mmItemsView() {
  var rows = [];
  (STATE.menuItems || []).forEach(function (it) {
    if (mmQ() && !mmMatch(it.name) && !mmMatch(it.desc)) return;
    rows.push(mmItemRow('item', it.id, it.name, it.price, (it.catIds || []).map(catName).filter(Boolean).join(', '), mmModNames(it.modGroupIds), mmTaxNames(it.taxIds)));
  });
  (STATE.prixFixeMenus || []).forEach(function (pf) {
    (pf.dishes || []).forEach(function (d) {
      if (mmQ() && !mmMatch(d.name) && !mmMatch(d.desc) && !mmMatch(pf.name)) return;
      rows.push(mmItemRow('pfdish', mmJoin(pf.id, d.id), d.name, d.upcharge || 0, [pf.name, d.course].filter(Boolean).join(' · '), mmModNames(d.modGroupIds), mmTaxNames(d.taxIds)));
    });
  });
  (STATE.tastingMenus || []).forEach(function (tm) {
    (tm.courses || []).forEach(function (c) {
      if (mmQ() && !mmMatch(c.name) && !mmMatch(c.desc) && !mmMatch(tm.name)) return;
      rows.push(mmItemRow('tmcourse', mmJoin(tm.id, c.id), c.name, c.upcharge || c.price || 0, [tm.name, mmTmGroupName(tm, c)].filter(Boolean).join(' · '), mmModNames(c.modGroupIds), mmTaxNames(c.taxIds)));
    });
  });
  return '<div class="mm-detail" style="grid-column:1/-1">' +
    '<div class="mm-card"><h3>All items</h3><p class="mm-hint">À la carte, prix fixe, and tasting dishes. Click a name or price to edit inline. Click the row to open the full item (description, taxes, modifiers).</p>' +
    '<div class="table-wrap"><table class="dt"><thead><tr><th>Name</th><th>Price</th><th>Groups</th><th>Modifiers</th><th>Taxes</th></tr></thead><tbody>' +
    (rows.join('') || '<tr><td colspan="5" class="mm-empty">No items.</td></tr>') + '</tbody></table></div>' +
    '<button class="mm-add" onclick="mmAddItem(null)">+ Add item</button></div></div>';
}
function mmModsView() {
  var cards = (STATE.modGroups || []).map(function (g) {
    var optHtml = (g.options || []).map(function (o) { return '<span class="mm-pill">' + esc(o.name) + (o.up ? ' +' + money(o.up) : '') + '</span>'; }).join(' ');
    return '<div class="mm-item-card' + (mmSelIs('mod', g.id) ? ' on' : '') + '" onclick="mmSelect(\'mod\',\'' + g.id + '\')">' +
      '<div><div class="mm-item-name">' + esc(g.name) + '</div><div class="mm-item-meta">' + (g.required ? 'Required · ' : '') + (g.multi ? 'multi' : 'single') + '</div></div><div>' + optHtml + '</div></div>';
  }).join('');
  var editor = MM.sel && MM.sel.type === 'mod' ? mmModEditor(MM.sel.id) : '<div class="mm-hint">Select a modifier group to edit options (meat temperature, fish temperature, sides).</div>';
  return '<div class="mm-body"><div class="mm-tree" style="padding:14px">' + cards +
    '<button class="mm-add" onclick="mmAddMod()">+ Add modifier group</button></div><div class="mm-detail">' + editor + '</div></div>';
}
function mmModEditor(id) {
  var g = mmFindMod(id);
  if (!g) return '<div class="mm-empty">Pick a modifier group.</div>';
  var optRows = (g.options || []).map(function (o, i) {
    return '<div class="mm-mod-opt"><input class="input mopt-name" data-i="' + i + '" value="' + esc(o.name) + '" placeholder="Option">' +
      '<input class="input mopt-up" data-i="' + i + '" type="number" step="0.01" value="' + (o.up || 0) + '" style="width:100px" placeholder="$">' +
      '<button type="button" class="btn btn-ghost btn-sm" onclick="mmDropModOpt(\'' + g.id + '\',' + i + ')">✕</button></div>';
  }).join('');
  return '<form id="mm-editor" data-type="mod" data-id="' + g.id + '"><div class="mm-card"><h3>MODIFIERS · ' + esc(g.name) + '</h3>' +
    fld('Group name', '<input class="input" id="mg-name" value="' + esc(g.name) + '">') +
    '<label class="cbx"><input type="checkbox" id="mg-req"' + (g.required ? ' checked' : '') + '> Required on POS</label>' +
    '<label class="cbx"><input type="checkbox" id="mg-multi"' + (g.multi ? ' checked' : '') + '> Allow multiple selections</label>' +
    '<div class="ff" style="margin-top:12px"><label>Options</label>' + optRows +
    '<button type="button" class="mm-add" onclick="mmAddModOpt(\'' + g.id + '\')">+ Add option</button></div>' +
    '<button type="button" class="btn btn-gold btn-sm" onclick="mmSaveModFromForm(\'' + g.id + '\',true)">Save modifiers</button> ' +
    '<button type="button" class="btn btn-danger btn-sm" onclick="deleteModGroup(\'' + g.id + '\')">Delete group</button></div></form>';
}
function mmTaxesView() {
  var rows = (STATE.taxRates || []).map(function (t, i) {
    return '<tr><td><input class="input tx-name" data-i="' + i + '" value="' + esc(t.name) + '"></td>' +
      '<td><input class="input tx-rate" data-i="' + i + '" type="number" step="0.001" value="' + t.rate + '" style="width:110px"></td>' +
      '<td><label class="cbx"><input type="checkbox" class="tx-def" data-i="' + i + '"' + (t.isDefault ? ' checked' : '') + '> Default</label></td>' +
      '<td><button class="btn btn-ghost btn-sm" onclick="mmDropTax(' + i + ')">✕</button></td></tr>';
  }).join('');
  return '<div class="mm-detail" style="grid-column:1/-1"><form id="mm-editor" data-type="tax" data-id="all"><div class="mm-card"><h3>Tax rates</h3>' +
    '<p class="mm-hint">Assign these on each item. Default rates apply to new dishes. You can change them anytime.</p>' +
    '<div class="table-wrap"><table class="dt"><thead><tr><th>Name</th><th>Rate %</th><th>Default?</th><th></th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="4" class="mm-empty">No tax rates.</td></tr>') + '</tbody></table></div>' +
    '<button type="button" class="mm-add" onclick="mmAddTax()">+ Add tax rate</button> ' +
    '<button type="button" class="btn btn-gold btn-sm" onclick="mmSaveTaxesFromForm(true)">Save taxes</button></div></form></div>';
}
function mmAddGroup(bookId) {
  var c = { id: uid('c'), name: 'New group', visible: true };
  STATE.menuCats.push(c);
  var book = (STATE.menuBooks || []).filter(function (b) { return b.id === bookId; })[0];
  if (book) { book.groupIds = book.groupIds || []; book.groupIds.push(c.id); }
  MM.open[bookId] = true;
  mmSelect('group', c.id);
}
function mmAddItem(groupId) {
  var defaults = (STATE.taxRates || []).filter(function (t) { return t.isDefault; }).map(function (t) { return t.id; });
  var it = { id: uid('m'), code: '', name: 'New item', desc: '', price: 0, cost: 0, catIds: groupId ? [groupId] : [], cookMin: 10, station: KITCHEN_STATIONS[0], ingredients: '', allergens: [], diet: [], verified: false, modGroupIds: [], taxIds: defaults, active: true };
  STATE.menuItems.push(it);
  MM.tab = 'full';
  mmSelect('item', it.id);
}
function mmAddMod() {
  var g = { id: uid('mg'), name: 'New modifier group', required: false, multi: false, options: [{ id: uid('mo'), name: 'Option', up: 0 }] };
  STATE.modGroups.push(g);
  MM.tab = 'modifiers';
  mmSelect('mod', g.id);
}
function mmAddModOpt(id) {
  mmSaveModFromForm(id, false);
  var g = mmFindMod(id);
  if (!g) return;
  g.options = g.options || [];
  g.options.push({ id: uid('mo'), name: '', up: 0 });
  mmSelect('mod', id);
}
function mmDropModOpt(id, i) {
  mmSaveModFromForm(id, false);
  var g = mmFindMod(id);
  if (!g) return;
  g.options.splice(i, 1);
  mmSelect('mod', id);
}
function mmAddTax() {
  mmSaveTaxesFromForm(false);
  STATE.taxRates.push({ id: uid('tx'), name: 'New tax', rate: 0, isDefault: false });
  mmPaint();
}
function mmDropTax(i) {
  mmSaveTaxesFromForm(false);
  STATE.taxRates.splice(i, 1);
  mmPaint();
}
function mmPersistPf() {
  lsSet('eh_prix_fixe_menus', STATE.prixFixeMenus);
  if (typeof fbReady !== 'undefined' && fbReady) {
    return fbSetDoc('boh_shared', 'prix_fixe_menus', { list: withoutEmbeddedPhotos(STATE.prixFixeMenus), updatedAt: Date.now() });
  }
  return Promise.resolve(true);
}
function mmPersistTm() {
  lsSet('eh_tasting_menus', STATE.tastingMenus);
  if (typeof fbReady !== 'undefined' && fbReady) {
    return fbSetDoc('boh_shared', 'tasting_menus', { list: withoutEmbeddedPhotos(STATE.tastingMenus), updatedAt: Date.now() });
  }
  return Promise.resolve(true);
}
function mmSaveWorkspace() {
  mmFlush();
  saveMenu();
  mmPersistPf();
  mmPersistTm();
  toast('Saved', 'success');
}
function mmInlineRename(id, name) {
  var it = mmFindItem(id); if (!it) return;
  it.name = (name || '').trim() || it.name;
  saveMenu();
}
function mmInlinePrice(id, val) {
  var it = mmFindItem(id); if (!it) return;
  it.price = parseFloat(val) || 0;
  saveMenu();
}
function mmInlineRenameKind(kind, id, name) {
  name = (name || '').trim();
  if (kind === 'item') return mmInlineRename(id, name);
  if (kind === 'pfdish') {
    var d = mmFindPfDish(id); if (!d) return;
    d.name = name || d.name;
    mmRebuildPf(mmFindPf(mmJoinParent(id)));
    mmPersistPf();
    return;
  }
  if (kind === 'tmcourse') {
    var c = mmFindTmCourse(id); if (!c) return;
    c.name = name || c.name;
    mmPersistTm();
  }
}
function mmInlinePriceKind(kind, id, val) {
  var n = parseFloat(val) || 0;
  if (kind === 'item') return mmInlinePrice(id, val);
  if (kind === 'pfdish') {
    var d = mmFindPfDish(id); if (!d) return;
    d.upcharge = n; d.price = n;
    mmRebuildPf(mmFindPf(mmJoinParent(id)));
    mmPersistPf();
    return;
  }
  if (kind === 'tmcourse') {
    var c = mmFindTmCourse(id); if (!c) return;
    c.upcharge = n; c.price = n;
    mmPersistTm();
  }
}
function mmSaveItemFromForm(id, toastOk) {
  var it = mmFindItem(id); if (!it || !$('ie-name')) return;
  var name = $('ie-name').value.trim();
  if (!name) { if (toastOk) toast('Enter a name', 'error'); return false; }
  it.name = name; it.desc = $('ie-desc').value.trim();
  it.story = $('ie-story') ? $('ie-story').value.trim() : (it.story || '');
  it.storyUrl = $('ie-story-url') ? $('ie-story-url').value.trim() : (it.storyUrl || '');
  it.photoUrl = typeof readPhotoUrlFromForm === 'function' ? readPhotoUrlFromForm(it.photoUrl, it.id) : (it.photoUrl || '');
  if (it.photoUrl && typeof rememberMenuPhoto === 'function') rememberMenuPhoto(it.id, it.photoUrl);
  it.price = parseFloat($('ie-price').value) || 0; it.cost = parseFloat($('ie-cost').value) || 0;
  it.code = $('ie-code').value.trim();
  it.cookMin = parseInt($('ie-cook').value, 10) || 0; it.station = $('ie-station').value;
  it.ingredients = $('ie-ing') ? $('ie-ing').value.trim() : '';
  it.catIds = Array.prototype.slice.call(document.querySelectorAll('.ie-cat:checked')).map(function (x) { return x.value; });
  it.modGroupIds = Array.prototype.slice.call(document.querySelectorAll('.ie-mod:checked')).map(function (x) { return x.value; });
  it.taxIds = Array.prototype.slice.call(document.querySelectorAll('.ie-tax:checked')).map(function (x) { return x.value; });
  var ab = $('ie-analysis');
  if (ab) {
    it.allergens = (ab.getAttribute('data-al') || '').split('|').filter(Boolean);
    it.diet = (ab.getAttribute('data-diet') || '').split('|').filter(Boolean);
    it.verified = $('an-verify') ? $('an-verify').checked : it.verified;
  }
  saveMenu();
  if (toastOk) { toast('Item saved', 'success'); mmAfterSave(); }
}
function mmSaveGroupFromForm(id, toastOk) {
  var g = mmFindGroup(id); if (!g || !$('mm-g-name')) return;
  g.name = $('mm-g-name').value.trim() || g.name;
  g.posName = $('mm-g-pos').value.trim();
  g.visible = $('mm-g-vis').checked;
  saveMenu();
  if (toastOk) { toast('Group saved', 'success'); mmAfterSave(); }
}
function mmSaveModFromForm(id, toastOk) {
  var g = mmFindMod(id); if (!g || !$('mg-name')) return;
  g.name = $('mg-name').value.trim() || g.name;
  g.required = $('mg-req') ? $('mg-req').checked : !!g.required;
  g.multi = $('mg-multi') ? $('mg-multi').checked : !!g.multi;
  var names = document.querySelectorAll('.mopt-name'), ups = document.querySelectorAll('.mopt-up');
  var next = [];
  for (var i = 0; i < names.length; i++) {
    var nm = names[i].value.trim();
    if (nm) next.push({ id: (g.options[i] && g.options[i].id) || uid('mo'), name: nm, up: parseFloat(ups[i].value) || 0 });
  }
  g.options = next;
  saveMenu();
  if (toastOk) { toast('Modifiers saved', 'success'); mmPaint(); }
}
function mmSaveTaxesFromForm(toastOk) {
  if (!$('mm-editor') || $('mm-editor').getAttribute('data-type') !== 'tax') return;
  var names = document.querySelectorAll('.tx-name'), rates = document.querySelectorAll('.tx-rate'), defs = document.querySelectorAll('.tx-def');
  for (var i = 0; i < names.length; i++) {
    if (!STATE.taxRates[i]) continue;
    STATE.taxRates[i].name = names[i].value.trim() || STATE.taxRates[i].name;
    STATE.taxRates[i].rate = parseFloat(rates[i].value) || 0;
    STATE.taxRates[i].isDefault = defs[i].checked;
  }
  saveMenu();
  if (toastOk) toast('Taxes saved', 'success');
}
function mmSaveWineFromForm(id, toastOk) {
  var w = (STATE.wines || []).filter(function (x) { return x.id === id; })[0];
  if (!w || !$('w-name')) return;
  w.name = $('w-name').value.trim() || w.name;
  w.producer = $('w-prod').value.trim(); w.vintage = $('w-vintage').value.trim(); w.region = $('w-region').value.trim();
  w.bottlePrice = parseFloat($('w-bp').value) || 0;
  w.stock = parseInt($('w-stock').value, 10) || 0;
  w.bottleOz = parseFloat($('w-boz') && $('w-boz').value) || w.bottleOz || 25;
  w.ozOnHand = Math.round(w.stock * w.bottleOz * 10) / 10;
  saveWines();
  if (toastOk) { toast('Wine saved', 'success'); mmAfterSave(); }
}
function mmAddWineFlight() {
  STATE.wineFlights = STATE.wineFlights || [];
  var f = { id: uid('fl'), name: 'New flight', price: 0, pourOz: 2, wines: [] };
  STATE.wineFlights.push(f);
  lsSet('eh_wine_flights', STATE.wineFlights);
  if (typeof fbSetDoc === 'function') fbSetDoc('boh_shared', 'wine_flights', { list: STATE.wineFlights, updatedAt: Date.now() });
  toast('Flight added — pick wines after the by-the-glass list is loaded', 'success');
  mmSelect('group', 'c_wine_flights');
}
function mmSaveBarFromForm(id, toastOk) {
  var b = (STATE.bar || []).filter(function (x) { return x.id === id; })[0];
  if (!b || !$('b-name')) return;
  b.name = $('b-name').value.trim() || b.name; b.desc = $('b-desc').value.trim();
  b.price = parseFloat($('b-price').value) || 0; b.cost = parseFloat($('b-cost').value) || 0; b.kind = $('b-kind').value;
  if ($('b-stock')) { b.stock = parseInt($('b-stock').value, 10) || 0; b.ozOnHand = (Number(b.bottleOz) || 25) * b.stock; }
  saveBar();
  if (toastOk) { toast('Drink saved', 'success'); mmAfterSave(); }
}
function mmSaveRetailFromForm(id, toastOk) {
  var p = (STATE.retail || []).filter(function (x) { return x.id === id; })[0];
  if (!p || !$('r-name')) return;
  p.name = $('r-name').value.trim() || p.name; p.category = $('r-cat').value.trim();
  p.price = parseFloat($('r-price').value) || 0; p.stock = parseInt($('r-stock').value, 10) || 0;
  saveRetail();
  if (toastOk) { toast('Product saved', 'success'); mmAfterSave(); }
}

function mmModTaxHtml(it) {
  var modChecks = (STATE.modGroups || []).map(function (g) {
    return '<label class="cbx"><input type="checkbox" class="ie-mod" value="' + g.id + '"' + ((it.modGroupIds || []).indexOf(g.id) > -1 ? ' checked' : '') + '> ' + esc(g.name) + (g.required ? ' <span class="mm-pill">required</span>' : '') + '</label>';
  }).join('');
  var taxChecks = (STATE.taxRates || []).map(function (t) {
    return '<label class="cbx"><input type="checkbox" class="ie-tax" value="' + t.id + '"' + ((it.taxIds || []).indexOf(t.id) > -1 ? ' checked' : '') + '> ' + esc(t.name) + ' (' + t.rate + '%)</label>';
  }).join('');
  return { mods: modChecks, taxes: taxChecks };
}
function mmWinePairOpts(sel) {
  var glassWines = (STATE.wines || []).map(function (w) { return w.name + ' (' + (w.varietal || '') + ', $' + (w.glassPrice || 12) + '/glass)'; });
  return '<option value="">— None —</option>' + glassWines.map(function (w) {
    return '<option value="' + esc(w) + '"' + (sel === w ? ' selected' : '') + '>' + esc(w) + '</option>';
  }).join('');
}
function mmReadDishCommon(it) {
  it.name = $('ie-name').value.trim() || it.name;
  it.desc = $('ie-desc') ? $('ie-desc').value.trim() : (it.desc || '');
  it.story = $('ie-story') ? $('ie-story').value.trim() : (it.story || '');
  it.storyUrl = $('ie-story-url') ? $('ie-story-url').value.trim() : (it.storyUrl || '');
  it.photoUrl = typeof readPhotoUrlFromForm === 'function' ? readPhotoUrlFromForm(it.photoUrl, mmPhotoKey()) : (it.photoUrl || '');
  it.station = $('ie-station') ? $('ie-station').value : (it.station || '');
  it.cookMin = $('ie-cook') ? (parseInt($('ie-cook').value, 10) || 0) : (it.cookMin || 0);
  it.cookTime = it.cookMin;
  it.cookNote = $('ie-note') ? $('ie-note').value.trim() : (it.cookNote || '');
  it.pairing = $('ie-pairing') ? $('ie-pairing').value : (it.pairing || '');
  it.pairWhite = $('ie-pair-white') ? $('ie-pair-white').value.trim() : (it.pairWhite || '');
  it.pairRed = $('ie-pair-red') ? $('ie-pair-red').value.trim() : (it.pairRed || '');
  it.pairDessert = $('ie-pair-dessert') ? $('ie-pair-dessert').value.trim() : (it.pairDessert || '');
  it.ingredients = $('ie-ing') ? $('ie-ing').value.trim() : (it.ingredients || '');
  it.modGroupIds = Array.prototype.slice.call(document.querySelectorAll('.ie-mod:checked')).map(function (x) { return x.value; });
  it.taxIds = Array.prototype.slice.call(document.querySelectorAll('.ie-tax:checked')).map(function (x) { return x.value; });
  var ab = $('ie-analysis');
  if (ab) {
    it.allergens = (ab.getAttribute('data-al') || '').split('|').filter(Boolean);
    it.diet = (ab.getAttribute('data-diet') || '').split('|').filter(Boolean);
    it.dietary = it.diet;
    it.verified = $('an-verify') ? $('an-verify').checked : it.verified;
  }
  mmAttachTemps(it);
}

function mmSetDishEditor(it, priceLabel, extraTop, extraMid, saveClick, delClick) {
  var mt = mmModTaxHtml(it);
  extraTop = extraTop || '';
  extraMid = extraMid || '';
  return '<div class="mm-card"><h3>ITEM ' + esc(it.name) + '</h3>' +
    fld('Name', '<input class="input" id="ie-name" value="' + esc(it.name) + '" placeholder="Dish name">') +
    mmPhotoField(mmResolveItemPhoto(it, mmPhotoKey())) +
    fld('Description (POS &amp; iPad)', '<textarea class="input" id="ie-desc" rows="4">' + esc(it.desc || '') + '</textarea>') +
    fld('Story for iPad (origin, farm, family — guests see this when they tap the dish)', '<textarea class="input" id="ie-story" rows="4" placeholder="e.g. Filet mignon from Dutton Ranch in South Carolina. The Dutton family has raised cattle on the same land for generations…">' + esc(it.story || '') + '</textarea>') +
    fld('Story link (optional farm, village, or producer URL)', '<input class="input" id="ie-story-url" value="' + esc(it.storyUrl || '') + '" placeholder="https://…">') +
    extraTop +
    '<div class="ff-row cols-3">' + fld(priceLabel, '<input class="input" id="ie-price" type="number" step="0.01" value="' + (it.upcharge != null ? it.upcharge : (it.price || 0)) + '">') +
      fld('Cook time (min)', '<input class="input" id="ie-cook" type="number" value="' + (it.cookMin || it.cookTime || 0) + '">') +
      fld('Kitchen station', '<select class="input" id="ie-station">' + opts(KITCHEN_STATIONS, it.station || KITCHEN_STATIONS[0]) + '</select>') + '</div>' +
    fld('Taxes', '<div class="cbx-grid">' + mt.taxes + '</div>') +
    extraMid +
    '</div>' +
    '<div class="mm-card"><h3>Modifier groups</h3><p class="mm-hint">Steaks, hamburgers, salmon, and tuna should include a temperature group.</p>' +
    fld('Attach modifiers', '<div class="cbx-grid">' + mt.mods + '</div>') +
    '<button type="button" class="mm-add" onclick="mmTab(\'modifiers\')">Manage modifier options</button></div>' +
    '<div class="mm-card"><h3>Allergens &amp; kitchen</h3>' +
    fld('Kitchen note', '<input class="input" id="ie-note" value="' + esc(it.cookNote || '') + '" placeholder="e.g. Allow 12 minutes">') +
    fld('Ingredients', '<textarea class="input" id="ie-ing" rows="2">' + esc(it.ingredients || (it.desc || '')) + '</textarea>') +
    '<button class="btn-analyze" type="button" onclick="runAnalysis({})">✨ Analyze Allergens &amp; Dietary</button>' +
    '<div id="ie-analysis" class="analysis-box">' + renderAnalysis(it.allergens, it.diet || it.dietary, it.verified, '') + '</div>' +
    '<div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">' +
      '<button type="button" class="btn btn-gold btn-sm" onclick="' + saveClick + '">Save item</button> ' +
      '<button type="button" class="mm-back" onclick="mmBack()">← Back</button> ' +
      '<button type="button" class="btn btn-danger btn-sm" onclick="' + delClick + '">Delete item</button></div>' +
    '</div>';
}

function mmPfMenuEditor(id) {
  var pf = mmFindPf(id);
  if (!pf) return '<div class="mm-empty">Prix fixe menu not found.</div>';
  var mt = mmModTaxHtml(pf);
  var groups = (pf.courses || []).sort(function (a, b) { return (a.order || 0) - (b.order || 0); }).map(function (g) {
    var n = (pf.dishes || []).filter(function (d) { return d.course === g.label; }).length;
    return '<div class="mm-item-card" onclick="mmSelect(\'pfcourse\',\'' + mmJoin(pf.id, g.id) + '\')"><div><div class="mm-item-name">GROUP ' + esc(g.label) + '</div><div class="mm-item-meta">' + n + ' item' + (n === 1 ? '' : 's') + ' · ' + esc(g.mode || 'choose') + '</div></div></div>';
  }).join('');
  return '<form id="mm-editor" data-type="pfmenu" data-id="' + pf.id + '">' +
    '<div class="mm-card"><h3>MENU ' + esc(pf.name) + '</h3>' +
    fld('Name', '<input class="input" id="pf-name" value="' + esc(pf.name) + '">') +
    fld('Subtitle', '<input class="input" id="pf-sub" value="' + esc(pf.subtitle || '') + '">') +
    fld('Description', '<textarea class="input" id="pf-desc" rows="3">' + esc(pf.desc || '') + '</textarea>') +
    '<div class="ff-row cols-3">' + fld('Price ($ per person)', '<input class="input" id="pf-price" type="number" step="0.01" value="' + (pf.price || 0) + '">') +
      fld('Service', '<select class="input" id="pf-service">' + opts(['breakfast', 'brunch', 'lunch', 'dinner', 'all day'], pf.service || 'dinner') + '</select>') +
      fld('Status', '<select class="input" id="pf-active">' + opts(['Active', 'Inactive'], pf.active !== false ? 'Active' : 'Inactive') + '</select>') + '</div>' +
    fld('Taxes', '<div class="cbx-grid">' + mt.taxes + '</div>') +
    '<label class="cbx"><input type="checkbox" id="pf-vis"' + (pf.active !== false ? ' checked' : '') + '> Show on POS &amp; iPad</label>' +
    '<div style="margin-top:12px"><button type="button" class="btn btn-gold btn-sm" onclick="mmSavePfMenu(\'' + pf.id + '\',true)">Save menu</button> ' +
    '<button type="button" class="mm-back" onclick="mmBack()">← Back</button> ' +
    '<button type="button" class="btn btn-danger btn-sm" onclick="mmDelPfMenu(\'' + pf.id + '\')">Delete menu</button></div></div>' +
    '<div class="mm-card"><h3>Groups (courses)</h3>' + (groups || '<div class="mm-empty">No groups yet.</div>') +
    '<button type="button" class="mm-add" onclick="mmAddPfCourse(\'' + pf.id + '\')">+ Add group</button></div></form>';
}
function mmPfCourseEditor(joinId) {
  var pf = mmFindPf(mmJoinParent(joinId));
  if (!pf) return '<div class="mm-empty">Menu not found.</div>';
  var gid = mmJoinChild(joinId);
  var g = (pf.courses || []).filter(function (c) { return c.id === gid; })[0];
  if (!g) return '<div class="mm-empty">Group not found.</div>';
  var items = (pf.dishes || []).filter(function (d) { return d.course === g.label; });
  var list = items.map(function (d) {
    return '<div class="mm-item-card" onclick="mmSelect(\'pfdish\',\'' + mmJoin(pf.id, d.id) + '\')">' +
      mmThumbHtml(d, mmJoin(pf.id, d.id)) +
      '<div><div class="mm-item-name">ITEM ' + esc(d.name) + '</div><div class="mm-item-meta">' + ((d.modGroupIds || []).length) + ' modifier group' + ((d.modGroupIds || []).length === 1 ? '' : 's') + '</div></div>' +
      '<div class="mm-price">' + (d.upcharge ? ('+' + money(d.upcharge)) : 'Included') + '</div></div>';
  }).join('');
  return '<form id="mm-editor" data-type="pfcourse" data-id="' + joinId + '">' +
    '<div class="mm-card"><h3>MENU GROUP ' + esc(g.label) + '</h3>' +
    fld('Group name', '<input class="input" id="mm-g-name" value="' + esc(g.label) + '">') +
    fld('POS name (button label)', '<input class="input" id="mm-g-pos" value="' + esc(g.posName || '') + '" placeholder="Optional shorter name on POS">') +
    fld('How this course fires', '<select class="input" id="mm-g-mode">' + opts(['choose', 'auto', 'entremets', 'later'], g.mode || 'choose') + '</select>') +
    '<label class="cbx"><input type="checkbox" id="mm-g-vis"' + (g.visible !== false ? ' checked' : '') + '> Show on POS &amp; iPad</label>' +
    '<div style="margin-top:12px"><button type="button" class="btn btn-gold btn-sm" onclick="mmSavePfCourse(\'' + joinId + '\',true)">Save group</button> ' +
    '<button type="button" class="mm-back" onclick="mmBack()">← Back</button> ' +
    '<button type="button" class="btn btn-danger btn-sm" onclick="mmDelPfCourse(\'' + joinId + '\')">Delete group</button></div></div>' +
    '<div class="mm-card"><h3>Items in this group</h3>' + (list || '<div class="mm-empty">No items yet.</div>') +
    '<button type="button" class="mm-add" onclick="mmAddPfDish(\'' + pf.id + '\',\'' + encodeURIComponent(g.label) + '\')">+ Add item</button></div></form>';
}
function mmPfDishEditor(joinId) {
  var pf = mmFindPf(mmJoinParent(joinId));
  var d = mmFindPfDish(joinId);
  if (!pf || !d) return '<div class="mm-empty">Item not found.</div>';
  var groupSel = '<select class="input" id="ie-course">' + (pf.courses || []).map(function (c) {
    return '<option value="' + esc(c.label) + '"' + (d.course === c.label ? ' selected' : '') + '>' + esc(c.label) + '</option>';
  }).join('') + '</select>';
  var extra = fld('Menu group', groupSel) +
    fld('Wine pairing (legacy)', '<select class="input" id="ie-pairing">' + mmWinePairOpts(d.pairing) + '</select>') +
    fld('Suggested white (by the glass)', '<input class="input" id="ie-pair-white" value="' + esc(d.pairWhite || '') + '" placeholder="Pinot Bianco Haberle · $18">') +
    fld('Suggested red (by the glass)', '<input class="input" id="ie-pair-red" value="' + esc(d.pairRed || '') + '" placeholder="Valpolicella Classico · $18">') +
    fld('Dessert wine', '<input class="input" id="ie-pair-dessert" value="' + esc(d.pairDessert || '') + '" placeholder="Moscato d’Asti · $14">');
  return '<form id="mm-editor" data-type="pfdish" data-id="' + joinId + '">' +
    mmSetDishEditor(d, 'Price / upcharge ($)', extra, '<p class="mm-hint">0.00 means the dish is included in the ' + money(pf.price) + ' menu price.</p>',
      'mmSavePfDish(\'' + joinId + '\',true)', 'mmDelPfDish(\'' + joinId + '\')') +
    '</form>';
}
function mmTmMenuEditor(id) {
  var tm = mmFindTm(id);
  if (!tm) return '<div class="mm-empty">Tasting menu not found.</div>';
  var mt = mmModTaxHtml(tm);
  var groups = mmTmGroups(tm).map(function (gname) {
    var n = (tm.courses || []).filter(function (c) { return mmTmGroupName(tm, c) === gname; }).length;
    return '<div class="mm-item-card" onclick="mmSelect(\'tmgroup\',\'' + mmJoin(tm.id, encodeURIComponent(gname)) + '\')"><div><div class="mm-item-name">GROUP ' + esc(gname) + '</div><div class="mm-item-meta">' + n + ' item' + (n === 1 ? '' : 's') + '</div></div></div>';
  }).join('');
  groups += '<div class="mm-item-card" onclick="mmSelect(\'tmpairgroup\',\'' + mmJoin(tm.id, 'pairings') + '\')"><div><div class="mm-item-name">GROUP Wine pairings</div><div class="mm-item-meta">' + (tm.pairings || []).length + ' item' + ((tm.pairings || []).length === 1 ? '' : 's') + '</div></div></div>';
  return '<form id="mm-editor" data-type="tmmenu" data-id="' + tm.id + '">' +
    '<div class="mm-card"><h3>MENU ' + esc(tm.name) + '</h3>' +
    fld('Name', '<input class="input" id="tm-name" value="' + esc(tm.name) + '">') +
    fld('Subtitle', '<input class="input" id="tm-sub" value="' + esc(tm.subtitle || '') + '">') +
    '<div class="ff-row cols-3">' + fld('Price ($ per person)', '<input class="input" id="tm-price" type="number" step="0.01" value="' + (tm.price || 0) + '">') +
      fld('Duration', '<input class="input" id="tm-dur" value="' + esc(tm.duration || '') + '">') +
      fld('Service', '<select class="input" id="tm-service">' + opts(['breakfast', 'brunch', 'lunch', 'dinner', 'all day'], tm.service || 'dinner') + '</select>') + '</div>' +
    fld('Taxes', '<div class="cbx-grid">' + mt.taxes + '</div>') +
    '<label class="cbx"><input type="checkbox" id="tm-vis"' + (tm.active !== false ? ' checked' : '') + '> Show on POS &amp; iPad</label>' +
    '<div style="margin-top:12px"><button type="button" class="btn btn-gold btn-sm" onclick="mmSaveTmMenu(\'' + tm.id + '\',true)">Save menu</button> ' +
    '<button type="button" class="mm-back" onclick="mmBack()">← Back</button> ' +
    '<button type="button" class="btn btn-danger btn-sm" onclick="mmDelTmMenu(\'' + tm.id + '\')">Delete menu</button></div></div>' +
    '<div class="mm-card"><h3>Groups</h3>' + (groups || '<div class="mm-empty">No groups yet.</div>') +
    '<button type="button" class="mm-add" onclick="mmAddTmGroup(\'' + tm.id + '\')">+ Add group</button></div></form>';
}
function mmTmGroupEditor(joinId) {
  var tm = mmFindTm(mmJoinParent(joinId));
  if (!tm) return '<div class="mm-empty">Menu not found.</div>';
  var gname = decodeURIComponent(mmJoinChild(joinId));
  var items = (tm.courses || []).filter(function (c) { return mmTmGroupName(tm, c) === gname; });
  var list = items.map(function (c) {
    return '<div class="mm-item-card" onclick="mmSelect(\'tmcourse\',\'' + mmJoin(tm.id, c.id) + '\')">' +
      mmThumbHtml(c, mmJoin(tm.id, c.id)) +
      '<div><div class="mm-item-name">ITEM ' + esc(c.name) + '</div><div class="mm-item-meta">' + ((c.modGroupIds || []).length) + ' modifier group' + ((c.modGroupIds || []).length === 1 ? '' : 's') + '</div></div>' +
      '<div class="mm-price">' + (c.upcharge ? ('+' + money(c.upcharge)) : 'Included') + '</div></div>';
  }).join('');
  return '<form id="mm-editor" data-type="tmgroup" data-id="' + joinId + '">' +
    '<div class="mm-card"><h3>MENU GROUP ' + esc(gname) + '</h3>' +
    fld('Group name', '<input class="input" id="mm-g-name" value="' + esc(gname) + '">') +
    fld('POS name (button label)', '<input class="input" id="mm-g-pos" value="' + esc((items[0] && items[0].posName) || '') + '" placeholder="Optional shorter name on POS">') +
    '<label class="cbx"><input type="checkbox" id="mm-g-vis" checked> Show on POS &amp; iPad</label>' +
    '<div style="margin-top:12px"><button type="button" class="btn btn-gold btn-sm" onclick="mmSaveTmGroup(\'' + joinId + '\',true)">Save group</button> ' +
    '<button type="button" class="mm-back" onclick="mmBack()">← Back</button> ' +
    '<button type="button" class="btn btn-danger btn-sm" onclick="mmDelTmGroup(\'' + joinId + '\')">Delete group</button></div></div>' +
    '<div class="mm-card"><h3>Items in this group</h3>' + (list || '<div class="mm-empty">No items yet.</div>') +
    '<button type="button" class="mm-add" onclick="mmAddTmCourse(\'' + tm.id + '\',\'' + encodeURIComponent(gname) + '\')">+ Add item</button></div></form>';
}
function mmTmCourseEditor(joinId) {
  var tm = mmFindTm(mmJoinParent(joinId));
  var c = mmFindTmCourse(joinId);
  if (!tm || !c) return '<div class="mm-empty">Item not found.</div>';
  var groupSel = '<select class="input" id="ie-course">' + mmTmGroups(tm).map(function (g) {
    return '<option value="' + esc(g) + '"' + (mmTmGroupName(tm, c) === g ? ' selected' : '') + '>' + esc(g) + '</option>';
  }).join('') + '</select>';
  c.upcharge = c.upcharge || 0;
  return '<form id="mm-editor" data-type="tmcourse" data-id="' + joinId + '">' +
    mmSetDishEditor(c, 'Price / upcharge ($)', fld('Menu group', groupSel), '<p class="mm-hint">0.00 means included in the ' + money(tm.price) + ' tasting price. Courses fire to the kitchen in list order.</p>',
      'mmSaveTmCourse(\'' + joinId + '\',true)', 'mmDelTmCourse(\'' + joinId + '\')') +
    '</form>';
}
function mmTmPairGroupEditor(joinId) {
  var tm = mmFindTm(mmJoinParent(joinId));
  if (!tm) return '<div class="mm-empty">Menu not found.</div>';
  var list = (tm.pairings || []).map(function (p) {
    var pid = mmJoin(tm.id, p.id || p.name);
    return '<div class="mm-item-card' + (mmSelIs('tmpair', pid) ? ' on' : '') + '" onclick="mmSelect(\'tmpair\',\'' + pid + '\')">' +
      '<div><div class="mm-item-name">ITEM ' + esc(p.name) + '</div><div class="mm-item-meta">' + esc(p.desc || '') + '</div></div>' +
      '<div class="mm-price">' + money(p.price || 0) + '</div></div>';
  }).join('');
  return '<div class="mm-card"><h3>MENU GROUP Wine pairings</h3>' +
    '<p class="mm-hint">Optional wines sold with this tasting. Same name, description, and price fields as other items.</p>' +
    (list || '<div class="mm-empty">No pairings yet.</div>') +
    '<button type="button" class="mm-add" onclick="mmAddTmPair(\'' + tm.id + '\')">+ Add item</button></div>';
}
function mmTmPairEditor(joinId) {
  var tm = mmFindTm(mmJoinParent(joinId));
  if (!tm) return '<div class="mm-empty">Menu not found.</div>';
  var pid = mmJoinChild(joinId);
  var p = (tm.pairings || []).filter(function (x) { return (x.id || x.name) === pid; })[0];
  if (!p) return '<div class="mm-empty">Pairing not found.</div>';
  return '<form id="mm-editor" data-type="tmpair" data-id="' + joinId + '"><div class="mm-card"><h3>ITEM ' + esc(p.name) + '</h3>' +
    fld('Name', '<input class="input" id="p-name" value="' + esc(p.name) + '">') +
    fld('Description', '<input class="input" id="p-desc" value="' + esc(p.desc || '') + '">') +
    fld('Price ($)', '<input class="input" id="p-price" type="number" step="0.01" value="' + (p.price || 0) + '">') +
    '<button type="button" class="btn btn-gold btn-sm" onclick="mmSaveTmPair(\'' + joinId + '\',true)">Save item</button> ' +
    '<button type="button" class="mm-back" onclick="mmBack()">← Back</button> ' +
    '<button type="button" class="btn btn-danger btn-sm" onclick="mmDelTmPair(\'' + joinId + '\')">Delete item</button></div></form>';
}

function mmAddPfMenu() {
  var pf = { id: uid('pf'), name: 'New prix fixe', subtitle: '', desc: '', price: 0, service: 'dinner', active: true, createdAt: Date.now(), courses: [{ id: uid('pfc'), label: 'New group', order: 0, mode: 'choose' }], dishes: [], taxIds: mmDefaultTaxes() };
  STATE.prixFixeMenus = STATE.prixFixeMenus || [];
  STATE.prixFixeMenus.push(pf);
  mmRebuildPf(pf);
  MM.open.mb_pf = true;
  MM.open['pf:' + pf.id] = true;
  mmPersistPf();
  mmSelect('pfmenu', pf.id);
}
function mmAddTmMenu() {
  var tm = { id: uid('tm'), name: 'New tasting', subtitle: '', price: 0, duration: '~2 hours', service: 'dinner', active: true, createdAt: Date.now(), courses: [], pairings: [], taxIds: mmDefaultTaxes() };
  STATE.tastingMenus = STATE.tastingMenus || [];
  STATE.tastingMenus.push(tm);
  MM.open.mb_tm = true;
  MM.open['tm:' + tm.id] = true;
  mmPersistTm();
  mmSelect('tmmenu', tm.id);
}
function mmAddPfCourse(pfId) {
  var pf = mmFindPf(pfId); if (!pf) return;
  var g = { id: uid('pfc'), label: 'New group', order: (pf.courses || []).length, mode: 'choose', visible: true };
  pf.courses = pf.courses || [];
  pf.courses.push(g);
  mmRebuildPf(pf);
  MM.open['pf:' + pfId] = true;
  mmPersistPf();
  mmSelect('pfcourse', mmJoin(pfId, g.id));
}
function mmAddPfDish(pfId, courseEnc) {
  var pf = mmFindPf(pfId); if (!pf) return;
  var label = decodeURIComponent(courseEnc || '');
  var d = { id: uid('pfd'), name: 'New item', desc: '', story: '', upcharge: 0, course: label, station: KITCHEN_STATIONS[0], photoUrl: '', pairing: '', allergens: [], cookNote: '', cookMin: 10, modGroupIds: [], taxIds: mmDefaultTaxes(), order: (pf.dishes || []).length, active: true };
  pf.dishes = pf.dishes || [];
  pf.dishes.push(d);
  mmRebuildPf(pf);
  MM.open['pf:' + pfId] = true;
  mmPersistPf();
  mmSelect('pfdish', mmJoin(pfId, d.id));
}
function mmAddTmGroup(tmId) {
  var tm = mmFindTm(tmId); if (!tm) return;
  var name = 'New group';
  var n = 1;
  while (mmTmGroups(tm).indexOf(name) >= 0) { n += 1; name = 'New group ' + n; }
  mmAddTmCourse(tmId, encodeURIComponent(name));
}
function mmAddTmCourse(tmId, groupEnc) {
  var tm = mmFindTm(tmId); if (!tm) return;
  var gname = decodeURIComponent(groupEnc || 'Courses');
  var c = { id: uid('tmc'), num: (tm.courses || []).length + 1, name: 'New item', desc: '', story: '', station: KITCHEN_STATIONS[0], upcharge: 0, photoUrl: '', allergens: [], group: gname, mode: gname === 'Welcome' ? 'auto' : (gname === 'Entremets' ? 'entremets' : (gname === 'Dolce' ? 'later' : 'auto')), modGroupIds: [], taxIds: mmDefaultTaxes() };
  tm.courses = tm.courses || [];
  tm.courses.push(c);
  MM.open['tm:' + tmId] = true;
  mmPersistTm();
  mmSelect('tmcourse', mmJoin(tmId, c.id));
}
function mmAddTmPair(tmId) {
  var tm = mmFindTm(tmId); if (!tm) return;
  var p = { id: uid('p'), name: 'New pairing', desc: '', price: 0 };
  tm.pairings = tm.pairings || [];
  tm.pairings.push(p);
  mmPersistTm();
  mmSelect('tmpair', mmJoin(tmId, p.id));
}

function mmSavePfMenu(id, toastOk) {
  var pf = mmFindPf(id); if (!pf || !$('pf-name')) return;
  pf.name = $('pf-name').value.trim() || pf.name;
  pf.subtitle = $('pf-sub') ? $('pf-sub').value.trim() : pf.subtitle;
  pf.desc = $('pf-desc') ? $('pf-desc').value.trim() : pf.desc;
  pf.price = parseFloat($('pf-price').value) || 0;
  pf.service = $('pf-service') ? $('pf-service').value : pf.service;
  pf.active = $('pf-vis') ? $('pf-vis').checked : ($('pf-active') ? $('pf-active').value === 'Active' : pf.active);
  pf.taxIds = Array.prototype.slice.call(document.querySelectorAll('.ie-tax:checked')).map(function (x) { return x.value; });
  mmRebuildPf(pf);
  mmPersistPf();
  if (toastOk) { toast('Menu saved', 'success'); mmAfterSave(); }
}
function mmSavePfCourse(joinId, toastOk) {
  var pf = mmFindPf(mmJoinParent(joinId)); if (!pf || !$('mm-g-name')) return;
  var g = (pf.courses || []).filter(function (c) { return c.id === mmJoinChild(joinId); })[0];
  if (!g) return;
  var old = g.label;
  g.label = $('mm-g-name').value.trim() || g.label;
  g.posName = $('mm-g-pos') ? $('mm-g-pos').value.trim() : '';
  g.mode = $('mm-g-mode') ? $('mm-g-mode').value : (g.mode || 'choose');
  g.fireEach = g.mode === 'auto';
  g.fireAfter = (g.mode === 'later' || g.mode === 'entremets') ? 'main' : '';
  g.visible = $('mm-g-vis') ? $('mm-g-vis').checked : true;
  if (old !== g.label) {
    (pf.dishes || []).forEach(function (d) { if (d.course === old) d.course = g.label; });
  }
  mmRebuildPf(pf);
  mmPersistPf();
  if (toastOk) { toast('Group saved', 'success'); mmAfterSave(); }
}
function mmSavePfDish(joinId, toastOk) {
  var pf = mmFindPf(mmJoinParent(joinId));
  var d = mmFindPfDish(joinId);
  if (!pf || !d || !$('ie-name')) return;
  mmReadDishCommon(d);
  if (d.photoUrl && typeof rememberMenuPhoto === 'function') rememberMenuPhoto('pfdish:' + joinId, d.photoUrl);
  d.upcharge = parseFloat($('ie-price').value) || 0;
  d.price = d.upcharge;
  if ($('ie-course')) d.course = $('ie-course').value;
  mmRebuildPf(pf);
  mmPersistPf();
  if (toastOk) { toast('Item saved', 'success'); mmAfterSave(); }
}
function mmSaveTmMenu(id, toastOk) {
  var tm = mmFindTm(id); if (!tm || !$('tm-name')) return;
  tm.name = $('tm-name').value.trim() || tm.name;
  tm.subtitle = $('tm-sub') ? $('tm-sub').value.trim() : tm.subtitle;
  tm.price = parseFloat($('tm-price').value) || 0;
  tm.duration = $('tm-dur') ? $('tm-dur').value.trim() : tm.duration;
  tm.service = $('tm-service') ? $('tm-service').value : tm.service;
  tm.active = $('tm-vis') ? $('tm-vis').checked : true;
  tm.taxIds = Array.prototype.slice.call(document.querySelectorAll('.ie-tax:checked')).map(function (x) { return x.value; });
  mmPersistTm();
  if (toastOk) { toast('Menu saved', 'success'); mmAfterSave(); }
}
function mmSaveTmGroup(joinId, toastOk) {
  var tm = mmFindTm(mmJoinParent(joinId)); if (!tm || !$('mm-g-name')) return;
  var old = decodeURIComponent(mmJoinChild(joinId));
  var next = $('mm-g-name').value.trim() || old;
  (tm.courses || []).forEach(function (c) {
    if (mmTmGroupName(tm, c) === old) c.group = next;
  });
  mmPersistTm();
  if (toastOk) { toast('Group saved', 'success'); MM.sel = { type: 'tmgroup', id: mmJoin(tm.id, encodeURIComponent(next)) }; mmAfterSave(); }
}
function mmSaveTmCourse(joinId, toastOk) {
  var tm = mmFindTm(mmJoinParent(joinId));
  var c = mmFindTmCourse(joinId);
  if (!tm || !c || !$('ie-name')) return;
  mmReadDishCommon(c);
  if (c.photoUrl && typeof rememberMenuPhoto === 'function') rememberMenuPhoto('tmcourse:' + joinId, c.photoUrl);
  c.upcharge = parseFloat($('ie-price').value) || 0;
  c.price = c.upcharge;
  if ($('ie-course')) {
    c.group = $('ie-course').value;
    if (c.group === 'Welcome') c.mode = 'auto';
    if (c.group === 'Entremets') c.mode = 'entremets';
    if (c.group === 'Dolce') c.mode = 'later';
  }
  mmPersistTm();
  if (toastOk) { toast('Item saved', 'success'); mmAfterSave(); }
}
function mmSaveTmPair(joinId, toastOk) {
  var tm = mmFindTm(mmJoinParent(joinId)); if (!tm || !$('p-name')) return;
  var pid = mmJoinChild(joinId);
  var p = (tm.pairings || []).filter(function (x) { return (x.id || x.name) === pid; })[0];
  if (!p) return;
  p.name = $('p-name').value.trim() || p.name;
  p.desc = $('p-desc') ? $('p-desc').value.trim() : '';
  p.price = parseFloat($('p-price').value) || 0;
  mmPersistTm();
  if (toastOk) { toast('Item saved', 'success'); mmAfterSave(); }
}

function mmDelPfMenu(id) {
  if (!confirm('Delete this prix fixe menu?')) return;
  STATE.prixFixeMenus = (STATE.prixFixeMenus || []).filter(function (x) { return x.id !== id; });
  mmPersistPf();
  MM.sel = { type: 'book', id: 'mb_pf' };
  mmPaint();
  toast('Menu deleted', 'success');
}
function mmDelPfCourse(joinId) {
  if (!confirm('Delete this group? Items in it are removed.')) return;
  var pf = mmFindPf(mmJoinParent(joinId)); if (!pf) return;
  var g = (pf.courses || []).filter(function (c) { return c.id === mmJoinChild(joinId); })[0];
  if (!g) return;
  pf.dishes = (pf.dishes || []).filter(function (d) { return d.course !== g.label; });
  pf.courses = (pf.courses || []).filter(function (c) { return c.id !== g.id; });
  mmRebuildPf(pf);
  mmPersistPf();
  mmSelect('pfmenu', pf.id);
  toast('Group deleted', 'success');
}
function mmDelPfDish(joinId) {
  if (!confirm('Delete this item?')) return;
  var pf = mmFindPf(mmJoinParent(joinId)); if (!pf) return;
  var id = mmJoinChild(joinId);
  pf.dishes = (pf.dishes || []).filter(function (d) { return d.id !== id; });
  mmRebuildPf(pf);
  mmPersistPf();
  mmSelect('pfmenu', pf.id);
  toast('Item deleted', 'success');
}
function mmDelTmMenu(id) {
  if (!confirm('Delete this tasting menu?')) return;
  STATE.tastingMenus = (STATE.tastingMenus || []).filter(function (x) { return x.id !== id; });
  mmPersistTm();
  MM.sel = { type: 'book', id: 'mb_tm' };
  mmPaint();
  toast('Menu deleted', 'success');
}
function mmDelTmGroup(joinId) {
  if (!confirm('Delete this group? Items in it are removed.')) return;
  var tm = mmFindTm(mmJoinParent(joinId)); if (!tm) return;
  var gname = decodeURIComponent(mmJoinChild(joinId));
  tm.courses = (tm.courses || []).filter(function (c) { return mmTmGroupName(tm, c) !== gname; });
  mmPersistTm();
  mmSelect('tmmenu', tm.id);
  toast('Group deleted', 'success');
}
function mmDelTmCourse(joinId) {
  if (!confirm('Delete this item?')) return;
  var tm = mmFindTm(mmJoinParent(joinId)); if (!tm) return;
  var id = mmJoinChild(joinId);
  tm.courses = (tm.courses || []).filter(function (c) { return c.id !== id; });
  mmPersistTm();
  mmSelect('tmmenu', tm.id);
  toast('Item deleted', 'success');
}
function mmDelTmPair(joinId) {
  if (!confirm('Delete this item?')) return;
  var tm = mmFindTm(mmJoinParent(joinId)); if (!tm) return;
  var pid = mmJoinChild(joinId);
  tm.pairings = (tm.pairings || []).filter(function (x) { return (x.id || x.name) !== pid; });
  mmPersistTm();
  mmSelect('tmmenu', tm.id);
  toast('Item deleted', 'success');
}

function menuBody() { return mmBody(); }
function setMenuCat(id) { MENU_CAT_FILTER = id; mmPaint(); }
