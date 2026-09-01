/* Menu manager overlay — Menus → Groups → Items → Modifiers.
   Loaded after index.html so PAGE_menu and related helpers are replaced. */
var MENU_CAT_FILTER = 'all';
var MM = { tab: 'full', sel: { type: 'book', id: 'mb_dinner' }, q: '', open: {} };

function ensureMenuManager() {
  var dirty = false;
  if (!Array.isArray(STATE.taxRates) || !STATE.taxRates.length) { STATE.taxRates = seedTaxRates(); dirty = true; }
  if (!Array.isArray(STATE.menuBooks) || !STATE.menuBooks.length) { STATE.menuBooks = seedMenuBooks(); dirty = true; }
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
    if (!raw && /\b(steak|ribeye|filet|sirloin|burger|hamburger|wagyu|porterhouse|strip steak)\b/.test(n)) {
      if (it.modGroupIds.indexOf('mg_meat_temp') < 0) { it.modGroupIds.push('mg_meat_temp'); dirty = true; }
    }
    if (!raw && /\b(salmon|tuna|ahi|halibut|cod|branzino|sea bass)\b/.test(n)) {
      if (it.modGroupIds.indexOf('mg_fish_temp') < 0) { it.modGroupIds.push('mg_fish_temp'); dirty = true; }
    }
  });
  if (MM.open.mb_dinner === undefined) MM.open.mb_dinner = true;
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
  if (keepQ && $('mm-q')) {
    $('mm-q').focus();
    try { $('mm-q').setSelectionRange(start, end); } catch (e) {}
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
}

function PAGE_menu() {
  ensureMenuManager();
  return { title: 'Menu manager', sub: 'Menus · groups · items · modifiers', body: mmBody(), bind: null };
}
function mmBody() {
  var tabs = ['full', 'items', 'modifiers', 'taxes'].map(function (t) {
    var label = { full: 'Full menu', items: 'Items', modifiers: 'Modifiers', taxes: 'Taxes' }[t];
    return '<button class="mm-tab' + (MM.tab === t ? ' on' : '') + '" onclick="mmTab(\'' + t + '\')">' + label + '</button>';
  }).join('');
  var crumb = 'Home / Menu manager';
  if (MM.sel && MM.sel.type === 'item') {
    var it = mmFindItem(MM.sel.id);
    crumb = 'Home / Menu manager / ' + (it ? it.name : 'Item');
  }
  return '<div class="mm-app">' +
    '<div class="mm-top">' +
      '<div style="display:flex;align-items:center;gap:12px;min-width:0">' +
        '<div class="menu-toggle" onclick="toggleSidebar()">☰</div>' +
        '<div><div class="mm-crumb">' + esc(crumb) + '</div><div class="mm-title">Menu manager</div></div>' +
      '</div>' +
      '<div class="mm-actions">' +
        '<input class="mm-search" id="mm-q" placeholder="Find a menu, group, or item" value="' + esc(MM.q || '') + '" oninput="MM.q=this.value; mmFlush(); mmPaint()">' +
        '<button class="btn btn-ghost btn-sm" onclick="openAiSettings()">AI</button>' +
        '<button class="btn btn-ghost btn-sm" onclick="mmFlush(); saveMenu(); toast(\'Saved\',\'success\')">Save</button>' +
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
      (STATE.wines || []).forEach(function (w) {
        if (mmQ() && !mmMatch(w.name)) return;
        html += '<div class="mm-row indent-2' + (mmSelIs('wine', w.id) ? ' on' : '') + '" onclick="mmSelect(\'wine\',\'' + w.id + '\')"><span>' + esc(w.name) + '</span><span class="mm-kind">Item</span></div>';
      });
    } else if (book.kind === 'retail') {
      (STATE.retail || []).forEach(function (p) {
        if (mmQ() && !mmMatch(p.name)) return;
        html += '<div class="mm-row indent-1' + (mmSelIs('retail', p.id) ? ' on' : '') + '" onclick="mmSelect(\'retail\',\'' + p.id + '\')"><span>' + esc(p.name) + '</span><span class="mm-kind">Item</span></div>';
      });
    } else if (book.kind === 'prixfixe') {
      (STATE.prixFixeMenus || []).forEach(function (pf) {
        html += '<div class="mm-row indent-1" onclick="go(\'tasting\')"><span>' + esc(pf.name) + ' · ' + money(pf.price) + '</span><span class="mm-kind">Menu</span></div>';
      });
    } else if (book.kind === 'tasting') {
      (STATE.tastingMenus || []).forEach(function (tm) {
        html += '<div class="mm-row indent-1" onclick="go(\'tasting\')"><span>' + esc(tm.name) + ' · ' + money(tm.price) + '</span><span class="mm-kind">Menu</span></div>';
      });
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
  if (book.kind === 'prixfixe') count = (STATE.prixFixeMenus || []).length;
  if (book.kind === 'tasting') count = (STATE.tastingMenus || []).length;
  return '<div class="mm-card"><h3>MENU ' + esc(book.name) + '</h3>' +
    '<p class="mm-hint">' + count + ' item' + (count === 1 ? '' : 's') + ' · click a group on the left, then an item to edit name, description, price, tax, and modifiers.</p>' +
    (book.kind === 'food' ? '<button class="btn btn-ghost btn-sm" onclick="mmAddGroup(\'' + book.id + '\')">+ Add group</button> ' : '') +
    ((book.kind === 'prixfixe' || book.kind === 'tasting') ? '<button class="btn btn-gold btn-sm" onclick="go(\'tasting\')">Open tasting &amp; prix fixe editor</button>' : '') +
    '</div>';
}
function mmGroupEditor(id) {
  if (id === 'c_wine_glass' || id === 'c_wine_bottle') {
    var glass = id === 'c_wine_glass';
    var rows = (STATE.wines || []).map(function (w) {
      return '<div class="mm-item-card" onclick="mmSelect(\'wine\',\'' + w.id + '\')"><div><div class="mm-item-name">' + esc(w.name) + '</div><div class="mm-item-meta">' + esc(w.producer || '') + '</div></div><div class="mm-price">' + (glass ? money(w.glassPrice) : money(w.bottlePrice)) + '</div></div>';
    }).join('');
    return '<div class="mm-card"><h3>SUBGROUP ' + (glass ? 'Wine by the glass' : 'Wine by the bottle') + '</h3>' +
      '<p class="mm-hint">Click a wine to edit bottle and glass prices.</p>' + (rows || '<div class="mm-empty">No wines yet.</div>') + '</div>';
  }
  var g = mmFindGroup(id);
  if (!g) return '<div class="mm-empty">Group not found.</div>';
  var items = mmItemsInGroup(g.id);
  var list = items.map(function (it) {
    return '<div class="mm-item-card' + (mmSelIs('item', it.id) ? ' on' : '') + '" onclick="mmSelect(\'item\',\'' + it.id + '\')">' +
      (it.photoUrl ? '<img class="mm-thumb" src="' + esc(it.photoUrl) + '">' : '<div class="mm-thumb"></div>') +
      '<div><div class="mm-item-name">ITEM ' + esc(it.name) + '</div><div class="mm-item-meta">' + (it.modGroupIds || []).length + ' modifier group' + ((it.modGroupIds || []).length === 1 ? '' : 's') + '</div></div>' +
      '<div class="mm-price">' + money(it.price) + '</div></div>';
  }).join('');
  return '<form id="mm-editor" data-type="group" data-id="' + g.id + '">' +
    '<div class="mm-card"><h3>MENU GROUP ' + esc(g.name) + '</h3>' +
    fld('Group name', '<input class="input" id="mm-g-name" value="' + esc(g.name) + '">') +
    fld('POS name (button label)', '<input class="input" id="mm-g-pos" value="' + esc(g.posName || '') + '" placeholder="Optional shorter name on POS">') +
    '<label class="cbx"><input type="checkbox" id="mm-g-vis"' + (g.visible !== false ? ' checked' : '') + '> Show on POS &amp; iPad</label>' +
    '<div style="margin-top:12px"><button type="button" class="btn btn-gold btn-sm" onclick="mmSaveGroupFromForm(\'' + g.id + '\',true)">Save group</button> ' +
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
    fld('Description (POS &amp; iPad)', '<textarea class="input" id="ie-desc" rows="4">' + esc(it.desc || '') + '</textarea>') +
    '<div class="ff-row cols-3">' + fld('Price ($)', '<input class="input" id="ie-price" type="number" step="0.01" value="' + it.price + '">') +
      fld('Cost ($)', '<input class="input" id="ie-cost" type="number" step="0.01" value="' + (it.cost || 0) + '">') +
      fld('Item code', '<input class="input" id="ie-code" value="' + esc(it.code || '') + '">') + '</div>' +
    fld('Taxes', '<div class="cbx-grid">' + taxChecks + '</div>') +
    '<div class="ff-row cols-2">' + fld('Cook time (min)', '<input class="input" id="ie-cook" type="number" value="' + (it.cookMin || 0) + '">') +
      fld('Kitchen station', '<select class="input" id="ie-station">' + opts(KITCHEN_STATIONS, it.station) + '</select>') + '</div>' +
    fld('Photo', '<div class="mc-photo-row" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"><input class="input" id="ie-photo" value="' + esc(it.photoUrl || '') + '" placeholder="Paste URL or Upload" style="flex:1;" oninput="showPhotoPreview(this,this.value)"><button type="button" class="btn btn-gold btn-sm" onclick="uploadPhoto(document.getElementById(\'ie-photo\'))">📷 Upload</button>' + (it.photoUrl ? '<img src="' + esc(it.photoUrl) + '" class="upload-preview" style="width:80px;height:56px;object-fit:cover;border-radius:6px;">' : '') + '</div>') +
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
      '<button type="button" class="btn btn-gold btn-sm" onclick="mmSaveItemFromForm(\'' + it.id + '\',true)">Save item</button>' +
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
      fld('Glass price', '<input class="input" id="w-gp" type="number" step="0.01" value="' + w.glassPrice + '">') +
      fld('Stock', '<input class="input" id="w-stock" type="number" value="' + w.stock + '">') + '</div>' +
    '<button type="button" class="btn btn-gold btn-sm" onclick="mmSaveWineFromForm(\'' + w.id + '\',true)">Save wine</button></div></form>';
}
function mmBarPanel(id) {
  var b = (STATE.bar || []).filter(function (x) { return x.id === id; })[0];
  if (!b) return '<div class="mm-empty">Drink not found.</div>';
  return '<form id="mm-editor" data-type="bar" data-id="' + b.id + '"><div class="mm-card"><h3>ITEM ' + esc(b.name) + '</h3>' +
    fld('Name', '<input class="input" id="b-name" value="' + esc(b.name) + '">') +
    fld('Description', '<input class="input" id="b-desc" value="' + esc(b.desc || '') + '">') +
    '<div class="ff-row cols-3">' + fld('Price', '<input class="input" id="b-price" type="number" step="0.01" value="' + b.price + '">') +
      fld('Cost', '<input class="input" id="b-cost" type="number" step="0.01" value="' + b.cost + '">') +
      fld('Type', '<select class="input" id="b-kind">' + opts(['Cocktail', 'Beer', 'Spirit'], b.kind) + '</select>') + '</div>' +
    '<button type="button" class="btn btn-gold btn-sm" onclick="mmSaveBarFromForm(\'' + b.id + '\',true)">Save drink</button></div></form>';
}
function mmRetailPanel(id) {
  var p = (STATE.retail || []).filter(function (x) { return x.id === id; })[0];
  if (!p) return '<div class="mm-empty">Product not found.</div>';
  return '<form id="mm-editor" data-type="retail" data-id="' + p.id + '"><div class="mm-card"><h3>ITEM ' + esc(p.name) + '</h3>' +
    fld('Name', '<input class="input" id="r-name" value="' + esc(p.name) + '">') +
    '<div class="ff-row cols-3">' + fld('Price', '<input class="input" id="r-price" type="number" step="0.01" value="' + p.price + '">') +
      fld('Category', '<input class="input" id="r-cat" value="' + esc(p.category || '') + '">') +
      fld('Stock', '<input class="input" id="r-stock" type="number" value="' + p.stock + '">') + '</div>' +
    '<button type="button" class="btn btn-gold btn-sm" onclick="mmSaveRetailFromForm(\'' + p.id + '\',true)">Save product</button></div></form>';
}
function mmItemsView() {
  var rows = (STATE.menuItems || []).filter(function (it) { return !mmQ() || mmMatch(it.name) || mmMatch(it.desc); }).map(function (it) {
    return '<tr onclick="MM.tab=\'full\'; mmSelect(\'item\',\'' + it.id + '\')">' +
      '<td><input class="input" value="' + esc(it.name) + '" onclick="event.stopPropagation()" onchange="mmInlineRename(\'' + it.id + '\',this.value)"></td>' +
      '<td><input class="input" type="number" step="0.01" value="' + it.price + '" onclick="event.stopPropagation()" onchange="mmInlinePrice(\'' + it.id + '\',this.value)" style="width:110px"></td>' +
      '<td>' + esc((it.catIds || []).map(catName).filter(Boolean).join(', ')) + '</td>' +
      '<td>' + esc((it.modGroupIds || []).map(function (id) { var g = mmFindMod(id); return g ? g.name : ''; }).filter(Boolean).join(', ')) + '</td>' +
      '<td>' + esc((it.taxIds || []).map(function (id) { var t = (STATE.taxRates || []).filter(function (x) { return x.id === id; })[0]; return t ? t.name : ''; }).filter(Boolean).join(', ')) + '</td>' +
    '</tr>';
  }).join('');
  return '<div class="mm-detail" style="grid-column:1/-1">' +
    '<div class="mm-card"><h3>All items</h3><p class="mm-hint">Click a name or price to edit inline. Click the row to open the full item (description, taxes, modifiers).</p>' +
    '<div class="table-wrap"><table class="dt"><thead><tr><th>Name</th><th>Price</th><th>Groups</th><th>Modifiers</th><th>Taxes</th></tr></thead><tbody>' +
    (rows || '<tr><td colspan="5" class="mm-empty">No items.</td></tr>') + '</tbody></table></div>' +
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
function mmSaveItemFromForm(id, toastOk) {
  var it = mmFindItem(id); if (!it || !$('ie-name')) return;
  var name = $('ie-name').value.trim();
  if (!name) { if (toastOk) toast('Enter a name', 'error'); return false; }
  it.name = name; it.desc = $('ie-desc').value.trim();
  it.photoUrl = $('ie-photo') ? $('ie-photo').value.trim() : (it.photoUrl || '');
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
  if (toastOk) { toast('Item saved', 'success'); mmPaint(); }
}
function mmSaveGroupFromForm(id, toastOk) {
  var g = mmFindGroup(id); if (!g || !$('mm-g-name')) return;
  g.name = $('mm-g-name').value.trim() || g.name;
  g.posName = $('mm-g-pos').value.trim();
  g.visible = $('mm-g-vis').checked;
  saveMenu();
  if (toastOk) { toast('Group saved', 'success'); mmPaint(); }
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
  w.bottlePrice = parseFloat($('w-bp').value) || 0; w.glassPrice = parseFloat($('w-gp').value) || 0; w.stock = parseInt($('w-stock').value, 10) || 0;
  saveWines();
  if (toastOk) { toast('Wine saved', 'success'); mmPaint(); }
}
function mmSaveBarFromForm(id, toastOk) {
  var b = (STATE.bar || []).filter(function (x) { return x.id === id; })[0];
  if (!b || !$('b-name')) return;
  b.name = $('b-name').value.trim() || b.name; b.desc = $('b-desc').value.trim();
  b.price = parseFloat($('b-price').value) || 0; b.cost = parseFloat($('b-cost').value) || 0; b.kind = $('b-kind').value;
  saveBar();
  if (toastOk) { toast('Drink saved', 'success'); mmPaint(); }
}
function mmSaveRetailFromForm(id, toastOk) {
  var p = (STATE.retail || []).filter(function (x) { return x.id === id; })[0];
  if (!p || !$('r-name')) return;
  p.name = $('r-name').value.trim() || p.name; p.category = $('r-cat').value.trim();
  p.price = parseFloat($('r-price').value) || 0; p.stock = parseInt($('r-stock').value, 10) || 0;
  saveRetail();
  if (toastOk) { toast('Product saved', 'success'); mmPaint(); }
}
function menuBody() { return mmBody(); }
function setMenuCat(id) { MENU_CAT_FILTER = id; mmPaint(); }
