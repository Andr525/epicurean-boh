/* Scalini Fedeli prix fixe $89 + Regional Tasting $115.
   Shared by BOH, POS, and the iPad menu. Printed menu 2026-09. */
(function (root) {
  var VERSION = 20260904;
  var GM = 'Cold / Garde Manger';
  var SA = 'Sauté';
  var GR = 'Grill';
  var FR = 'Fry';
  var PA = 'Pastry';

  var PW_BIANCO = 'Pinot Bianco “Haberle” Elena Walch 2019 · $18';
  var PW_GRIGIO = 'Pinot Grigio delle Venezie “Terre di Baccio” 2021 · $15';
  var PW_SAUV = 'Sauvignon Blanc “Vette” Tenuta San Leonardo 2021 · $17';
  var PW_CHARD = 'Chardonnay Russian River Valley Hartford Court 2020 · $24';
  var PS_PROSECCO = 'Prosecco Zardetto Brut · $17';
  var PS_BECK = 'Graham Beck Brut · $15';
  var PR_MONTE = 'Montepulciano d’Abruzzo “Cora” Velenosi 2019 · $16';
  var PR_VALPO = 'Valpolicella Classico Superiore Marchesi Fumanelli 2020 · $18';
  var PR_MERLOT = 'Merlot “Pianetto” 2018 · $15';
  var PR_BARBERA = 'Barbera del Monferrato Superiore “Vulpis” Cascina Valpane 2010 · $21';
  var PR_CHIANTI = 'Chianti Classico Riserva “Vigneti” Rocca delle Macie 2009 · $30';
  var PR_BRUNELLO = 'Brunello di Montalcino Riserva Galtelli 2015 · $38';
  var PD_MOSCATO = 'Moscato d’Asti “Bricco Quaglia” La Spinetta 2022 · $14';
  var PD_VIDAL = 'Inniskillin Ice Wine Vidal Pearl 2021 · $18';
  var PD_PORT = 'Fonseca Tawny 10 Years · $16';

  function ix(esN, esD, frN, frD, zhN, zhD) {
    return {
      es: { name: esN, desc: esD },
      fr: { name: frN, desc: frD },
      zh: { name: zhN, desc: zhD }
    };
  }

  function d(id, name, desc, course, station, extra) {
    extra = extra || {};
    return {
      id: id,
      name: name,
      desc: desc,
      course: course,
      station: station,
      upcharge: extra.upcharge || 0,
      photoUrl: extra.photoUrl || '',
      story: extra.story || extra.notes || extra.descriptionLong || '',
      storyUrl: extra.storyUrl || '',
      pairing: extra.pairing || extra.pairWhite || extra.pairRed || extra.pairDessert || '',
      pairWhite: extra.pairWhite || '',
      pairRed: extra.pairRed || '',
      pairDessert: extra.pairDessert || '',
      order: extra.order || 0,
      allergens: extra.allergens || [],
      dietary: extra.dietary || [],
      chooseCount: extra.chooseCount || 0,
      scoops: extra.scoops || null,
      cookNote: extra.cookNote || '',
      cookTime: extra.cookTime || 0,
      ingredients: extra.ingredients || '',
      askTemp: extra.askTemp || '',
      i18n: extra.i18n || {}
    };
  }

  var GELATO_SCOOPS = [
    { id: 'scoop_apple', name: 'Green apple', allergens: [] },
    { id: 'scoop_lemon', name: 'Lemon', allergens: [] },
    { id: 'scoop_vanilla', name: 'Vanilla', allergens: ['Dairy'] },
    { id: 'scoop_caramel', name: 'Caramel', allergens: ['Dairy'] },
    { id: 'scoop_hazelnut', name: 'Hazelnut', allergens: ['Tree Nut', 'Dairy'] },
    { id: 'scoop_pistachio', name: 'Pistachio', allergens: ['Tree Nut', 'Dairy'] }
  ];

  var dishes = [
    d('sf_w_salmon', 'Smoked salmon', 'Lemon-chive crema, brioche', 'Primi Piccolo', GM, {
      order: 1, allergens: ['Fish', 'Gluten', 'Dairy'],
      ingredients: 'smoked salmon, lemon, chive, crema, brioche',
      pairWhite: PS_PROSECCO,
      i18n: ix('Salmón ahumado', 'Crema de limón y cebollino, brioche', 'Saumon fumé', 'Crème citron-ciboulette, brioche', '烟熏三文鱼', '柠檬香葱奶油酱，配奶油吐司')
    }),
    d('sf_w_zucchini', 'Zucchini Milanese', 'Tomato-basil, chili oil', 'Primi Piccolo', FR, {
      order: 2, allergens: ['Gluten', 'Egg'],
      ingredients: 'zucchini, bread crumbs, egg, tomato, basil, chili oil',
      pairWhite: PW_GRIGIO,
      i18n: ix('Calabacín a la milanesa', 'Tomate-albahaca, aceite de chile', 'Courgette milanaise', 'Tomate-basilic, huile de piment', '米兰式西葫芦', '番茄罗勒，辣椒油')
    }),
    d('sf_w_shrimp', 'Shrimp in sherry-mustard sauce', 'Pickled Tropea onion', 'Primi Piccolo', SA, {
      order: 3, allergens: ['Shellfish'],
      ingredients: 'shrimp, sherry, mustard, Tropea onion',
      pairWhite: PW_SAUV,
      i18n: ix('Gambas en salsa de jerez y mostaza', 'Cebolla Tropea encurtida', 'Crevettes sauce xérès-moutarde', 'Oignon Tropea mariné', '雪利酒芥末酱大虾', '腌制特罗佩亚洋葱')
    }),
    d('sf_w_crostini', 'Crostini assortiti', 'Assorted toasted breads with house toppings — the tasting welcome', 'Tasting Welcome', GM, {
      order: 4, allergens: ['Gluten'],
      ingredients: 'bread, olive oil, tomato, cheese',
      pairWhite: PS_BECK,
      i18n: ix('Crostini surtidos', 'Panes tostados con toppings de la casa — bienvenida de la cata', 'Crostini assortis', 'Pains grillés et garnitures maison — mise en bouche de la dégustation', '什锦烤面包', '各式烤面包配店内浇头 — 品鉴欢迎菜')
    }),

    d('sf_p_rosso', '“Rosso – Bianco”', 'Trevisano radicchio, roasted beet, and goat cheese with a blood orange dressing, toasted pignoli nuts', 'Primi', GM, {
      order: 11, allergens: ['Dairy', 'Tree Nut'],
      ingredients: 'radicchio, beet, goat cheese, blood orange, pignoli',
      pairWhite: PW_BIANCO, pairRed: PR_VALPO,
      i18n: ix('“Rosso – Bianco”', 'Radicchio Trevisano, remolacha asada y queso de cabra, vinagreta de naranja sanguina, piñones', '« Rosso – Bianco »', 'Radicchio de Trévise, betterave rôtie et chèvre, vinaigrette à l’orange sanguine, pignons', '红与白', '特雷维索菊苣、烤甜菜、山羊奶酪、血橙酱、松子')
    }),
    d('sf_p_arugula', 'Arugula and buffalo mozzarella salad', 'Prosciutto di Parma, tomatoes and toasted pistachios with aged balsamic and extra virgin olive oil', 'Primi', GM, {
      order: 12, allergens: ['Dairy', 'Tree Nut'],
      ingredients: 'arugula, buffalo mozzarella, prosciutto, tomato, pistachio, balsamic, olive oil',
      pairWhite: PW_GRIGIO,
      i18n: ix('Ensalada de rúcula y mozzarella de búfala', 'Prosciutto di Parma, tomates y pistachos tostados, balsámico añejo y aceite de oliva', 'Salade de roquette et mozzarella de bufflonne', 'Prosciutto di Parma, tomates et pistaches, balsamique vieilli et huile d’olive', '芝麻菜与水牛乳鲜奶酪沙拉', '帕尔玛火腿、番茄、开心果、陈年香醋与橄榄油')
    }),
    d('sf_p_lobster', 'Ecuadorian shrimp and ½ Maine lobster tail', 'Spicy garlic, parsley and Vermentino sauce with Calabrian chili over capelli d’angelo', 'Primi', SA, {
      order: 13, upcharge: 10, allergens: ['Shellfish', 'Gluten', 'Fish'],
      ingredients: 'shrimp, lobster, garlic, parsley, Vermentino, Calabrian chili, capelli d’angelo',
      pairWhite: PW_CHARD,
      i18n: ix('Gambas ecuatorianas y media cola de langosta de Maine', 'Ajo picante, perejil y Vermentino con chile calabrés sobre capelli d’angelo', 'Crevettes d’Équateur et demi-queue de homard du Maine', 'Ail pimenté, persil et Vermentino, piment calabrais, capelli d’angelo', '厄瓜多尔大虾与缅因龙虾半尾', '大蒜、欧芹、维门蒂诺辣味酱、卡拉布里亚辣椒、天使细面')
    }),
    d('sf_p_raviolo', 'Soft egg yolk raviolo', 'Truffle butter sauce with grated black truffle', 'Primi', SA, {
      order: 14, upcharge: 8, allergens: ['Gluten', 'Egg', 'Dairy'],
      ingredients: 'egg yolk, pasta, butter, black truffle',
      pairWhite: PW_CHARD,
      i18n: ix('Raviolo de yema blanda', 'Mantequilla de trufa con trufa negra rallada', 'Raviolo au jaune d’œuf coulant', 'Beurre à la truffe et truffe noire râpée', '半熟蛋黄馄饨', '黑松露黄油酱，黑松露刨片')
    }),
    d('sf_p_porcini', 'Porcini ravioli', 'Wild mushroom and black truffle sauce', 'Primi', SA, {
      order: 15, allergens: ['Gluten', 'Dairy'],
      ingredients: 'porcini, pasta, wild mushroom, black truffle',
      pairWhite: PW_CHARD, pairRed: PR_BARBERA,
      i18n: ix('Ravioli de porcini', 'Salsa de setas silvestres y trufa negra', 'Ravioli aux cèpes', 'Sauce aux champignons sauvages et truffe noire', '牛肝菌馄饨', '野生蘑菇与黑松露酱')
    }),
    d('sf_p_agnolotti', 'Butternut squash agnolotti', 'Sage butter, crushed amaretti and buffalo mozzarella', 'Primi', SA, {
      order: 16, allergens: ['Gluten', 'Dairy', 'Tree Nut', 'Egg'],
      ingredients: 'butternut squash, pasta, sage, amaretti, buffalo mozzarella',
      pairWhite: PW_CHARD,
      i18n: ix('Agnolotti de calabaza', 'Mantequilla de salvia, amaretti triturado y mozzarella de búfala', 'Agnolotti au potimarron', 'Beurre sauge, amaretti concassés et mozzarella de bufflonne', '南瓜馅小馄饨', '鼠尾草黄油、碎杏仁饼干、水牛乳鲜奶酪')
    }),
    d('sf_p_arrabbiata', 'Spaghettini “Arrabbiata”', 'Spicy tomato and basil sauce with olives, mushroom and anchovies', 'Primi', SA, {
      order: 19, allergens: ['Gluten', 'Fish'],
      ingredients: 'spaghettini, tomato, basil, olive, mushroom, anchovy',
      pairRed: PR_MONTE,
      i18n: ix('Espaguetini “Arrabbiata”', 'Salsa picante de tomate y albahaca con aceitunas, champiñones y anchoas', 'Spaghettini « Arrabbiata »', 'Sauce tomate-basilic pimentée, olives, champignons et anchois', '细意面「阿拉比亚塔」', '辣味番茄罗勒、橄榄、蘑菇、凤尾鱼')
    }),
    d('sf_p_bolognese', 'Tagliatelle “Bolognese”', 'Traditional meat sauce with crispy sage & whipped ricotta', 'Primi', SA, {
      order: 20, allergens: ['Gluten', 'Dairy'],
      ingredients: 'tagliatelle, veal, pork, sage, ricotta',
      pairRed: PR_VALPO,
      i18n: ix('Tagliatelle “Boloñesa”', 'Ragú tradicional con salvia crujiente y ricotta montada', 'Tagliatelle « Bolognese »', 'Ragù traditionnel, sauge croustillante et ricotta fouettée', '宽带面「博洛尼亚」', '传统肉酱、酥鼠尾草与打发乳清奶酪')
    }),
    d('sf_p_pappardelle', 'Pappardelle', 'Braised veal and pork shank ragù with a hint of orange, mascarpone', 'Primi', SA, {
      order: 21, allergens: ['Gluten', 'Dairy'],
      ingredients: 'pappardelle, veal, pork, orange, mascarpone',
      pairRed: PR_CHIANTI,
      i18n: ix('Pappardelle', 'Ragú de jarrete de ternera y cerdo, toque de naranja y mascarpone', 'Pappardelle', 'Ragù de jarret de veau et de porc, zeste d’orange, mascarpone', '宽面', '小牛与猪腱炖肉、橙香、马斯卡彭')
    }),
    d('sf_p_linguini', 'Linguini in spicy pescatore sauce', 'Shrimp and mushrooms', 'Primi', SA, {
      order: 22, allergens: ['Gluten', 'Shellfish'],
      ingredients: 'linguini, shrimp, mushroom, tomato, chili',
      pairWhite: PW_SAUV,
      i18n: ix('Linguini en salsa pescatore picante', 'Gambas y champiñones', 'Linguine sauce pescatore pimentée', 'Crevettes et champignons', '扁意面 辣味渔夫', '大虾与蘑菇')
    }),
    d('sf_p_fusilli', 'Calabrian fusilli alla vodka', 'Hand-made twisted pasta in a tomato cream sauce with chili pepper and vodka', 'Primi', SA, {
      order: 24, allergens: ['Gluten', 'Dairy'],
      ingredients: 'fusilli, tomato, cream, Calabrian chili, vodka',
      pairRed: PR_MONTE,
      i18n: ix('Fusilli calabreses alla vodka', 'Pasta trenzada hecha a mano en salsa cremosa de tomate con chile y vodka', 'Fusilli calabrais à la vodka', 'Pâtes torsadées maison, crème tomate, piment et vodka', '卡拉布里亚螺旋面 伏特加奶油', '手擀螺旋面，辣椒与伏特加番茄奶油酱')
    }),
    d('sf_p_amatriciana', 'Rigatoni “Amatriciana”', 'Guanciale, Tropea onion, tomato, Calabrian chili', 'Primi', SA, {
      order: 25, allergens: ['Gluten'],
      ingredients: 'rigatoni, guanciale, Tropea onion, tomato, Calabrian chili',
      pairRed: PR_MONTE,
      i18n: ix('Rigatoni “Amatriciana”', 'Guanciale, cebolla Tropea, tomate, chile calabrés', 'Rigatoni « Amatriciana »', 'Guanciale, oignon Tropea, tomate, piment calabrais', '通心粉「阿玛特里恰纳」', '猪颊肉、特罗佩亚洋葱、番茄、卡拉布里亚辣椒')
    }),

    d('sf_m_sole', 'Filet of sole “Francese”', 'Light egg-flour crust, white wine lemon caper sauce', 'Pasti Principali', SA, {
      order: 30, allergens: ['Fish', 'Egg', 'Gluten'],
      ingredients: 'sole, egg, flour, white wine, lemon, caper',
      pairWhite: PW_BIANCO,
      i18n: ix('Filete de lenguado “Francese”', 'Ligera costra de huevo y harina, salsa de vino blanco, limón y alcaparras', 'Filet de sole « Francese »', 'Légère croûte œuf-farine, sauce vin blanc citron-câpres', '龙利鱼柳「法兰西」', '薄蛋粉衣，白葡萄酒柠檬刺山柑酱')
    }),
    d('sf_m_scallops', 'Dayboat sea scallops “Maitre d’hotel”', 'Celery root and pea puree, roasted mushrooms, porcini and black truffle jus', 'Pasti Principali', SA, {
      order: 31, allergens: ['Shellfish'],
      ingredients: 'scallop, celery root, pea, mushroom, porcini, black truffle',
      pairWhite: PW_CHARD,
      i18n: ix('Vieiras “Maitre d’hotel”', 'Puré de apionabo y guisante, setas asadas, jugo de porcini y trufa negra', 'Saint-Jacques « Maître d’hôtel »', 'Purée de céleri-rave et pois, champignons rôtis, jus de cèpes et truffe noire', '扇贝「主厨」', '芹菜根与豌豆泥、烤蘑菇、牛肝菌与黑松露汁')
    }),
    d('sf_m_forestiere', 'Farm-raised salmon “Piemontese”', 'Wild mushroom and black truffle crust, baby spinach, roasted beets', 'Pasti Principali', SA, {
      order: 32, allergens: ['Fish', 'Dairy'], askTemp: 'salmon',
      ingredients: 'salmon, wild mushroom, black truffle, spinach, beet',
      pairWhite: PW_CHARD, pairRed: PR_BARBERA,
      i18n: ix('Salmón de criadero “Piemontese”', 'Costra de setas silvestres y trufa negra, espinacas baby, remolacha asada', 'Saumon d’élevage « Piemontese »', 'Croûte champignons sauvages et truffe noire, épinards, betteraves rôties', '养殖三文鱼「皮埃蒙特」', '野生蘑菇与黑松露脆皮、嫩菠菜、烤甜菜')
    }),
    d('sf_m_zafferano', 'Ecuadorian shrimp “Zafferano”', 'Butternut squash and apple puree, orange-scented saffron', 'Pasti Principali', SA, {
      order: 33, allergens: ['Shellfish'],
      ingredients: 'shrimp, butternut squash, apple, orange, saffron',
      pairWhite: PW_SAUV,
      i18n: ix('Gambas ecuatorianas “Zafferano”', 'Puré de calabaza y manzana, azafrán al aroma de naranja', 'Crevettes d’Équateur « Zafferano »', 'Purée de potimarron et pomme, safran parfumé à l’orange', '厄瓜多尔大虾「藏红花」', '南瓜与苹果泥、橙香藏红花')
    }),
    d('sf_m_genovese', 'Pignoli-crusted sole “Genovese”', 'Tomato-basil broth over white asparagus', 'Pasti Principali', SA, {
      order: 34, allergens: ['Fish', 'Tree Nut'],
      ingredients: 'sole, pignoli, tomato, basil, white asparagus',
      pairWhite: PW_GRIGIO,
      i18n: ix('Lenguado “Genovese” con costra de piñones', 'Caldo de tomate y albahaca sobre espárragos blancos', 'Sole « Genovese » en croûte de pignons', 'Bouillon tomate-basilic sur asperges blanches', '松子脆皮龙利鱼「热那亚」', '番茄罗勒高汤，配白芦笋')
    }),
    d('sf_m_pork', '16 oz. roasted pork chop “San Domenico”', 'Mascarpone-vodka sauce with chives', 'Pasti Principali', GR, {
      order: 35, allergens: ['Dairy'], askTemp: 'pork',
      ingredients: 'pork, mascarpone, vodka, chive',
      pairRed: PR_CHIANTI,
      i18n: ix('Chuleta de cerdo 16 oz. “San Domenico”', 'Salsa de mascarpone y vodka con cebollino', 'Côte de porc 16 oz « San Domenico »', 'Sauce mascarpone-vodka à la ciboulette', '16盎司猪排「圣多梅尼科」', '马斯卡彭伏特加酱、香葱')
    }),
    d('sf_m_chicken', 'Boneless breast of chicken strips “Scarpariello”', 'Sausage and potato gratin', 'Pasti Principali', SA, {
      order: 36, allergens: ['Dairy'],
      ingredients: 'chicken, sausage, potato, cream, cheese',
      pairRed: PR_VALPO,
      i18n: ix('Tiras de pechuga de pollo “Scarpariello”', 'Salchicha y gratinado de patata', 'Lanières de poulet « Scarpariello »', 'Saucisse et gratin de pommes de terre', '鸡胸「鞋匠」', '香肠与土豆焗')
    }),
    d('sf_m_veal_val', 'Veal scaloppini “Valdostana”', 'Prosciutto di Parma and fontina in a wild mushroom–Madeira wine sauce', 'Pasti Principali', SA, {
      order: 37, allergens: ['Dairy'],
      ingredients: 'veal, prosciutto, fontina, wild mushroom, Madeira',
      pairRed: PR_BARBERA,
      i18n: ix('Escalope de ternera “Valdostana”', 'Prosciutto di Parma y fontina en salsa de setas y Madeira', 'Escalope de veau « Valdostana »', 'Prosciutto di Parma et fontina, sauce champignons sauvages au madère', '小牛肉片「瓦尔多斯塔纳」', '帕尔玛火腿与冯蒂纳奶酪、蘑菇马德拉酱')
    }),
    d('sf_m_osso', 'Lamb “Osso Buco”', 'Off the bone, braised lentils, spicy Sicilian olive and porcini reduction', 'Pasti Principali', GR, {
      order: 38, upcharge: 8, allergens: [],
      ingredients: 'lamb, lentil, Sicilian olive, porcini',
      pairRed: PR_BRUNELLO,
      i18n: ix('Cordero “Osso Buco”', 'Deshuesado, lentejas braseadas, reducción picante de aceituna siciliana y porcini', 'Agneau « Osso Buco »', 'Désossé, lentilles braisées, réduction pimentée d’olive sicilienne et cèpes', '羊肉「骨髓管」', '去骨、烩扁豆、西西里橄榄与牛肝菌浓缩汁')
    }),
    d('sf_m_giambotta', 'Split 10 oz. filet mignon “Giambotta”', 'Spicy wine sauce with mushrooms, onions and hot & sweet peppers', 'Pasti Principali', GR, {
      order: 40, upcharge: 18, allergens: [], askTemp: 'steak',
      ingredients: 'filet mignon, mushroom, onion, hot pepper, sweet pepper, wine',
      pairRed: PR_BRUNELLO,
      story: 'This 10 oz. filet mignon is from Dutton Ranch in South Carolina. The Dutton family has raised cattle on the same land for generations — grass-fed, finished with care, and sent north so we can serve a steak that still tastes like the pasture it came from. Giambotta is the Neapolitan “little mix”: mushrooms, onions, and hot and sweet peppers in a spicy wine sauce.',
      storyUrl: 'https://en.wikipedia.org/wiki/Filet_mignon',
      i18n: ix('Filet mignon 10 oz. “Giambotta”', 'Salsa de vino picante con champiñones, cebolla y pimientos dulces y picantes', 'Filet mignon 10 oz « Giambotta »', 'Sauce au vin pimentée, champignons, oignons et poivrons doux et forts', '10盎司菲力牛排「江博塔」', '蘑菇、洋葱、甜椒与辣椒的辣味葡萄酒酱')
    }),
    d('sf_m_reggiano', 'Pork medallions “Reggiano”', 'Parmigiano crust, garlic sage cognac, endive, apple and hazelnut salad', 'Pasti Principali', SA, {
      order: 41, allergens: ['Dairy', 'Tree Nut'], askTemp: 'pork',
      ingredients: 'pork, Parmigiano, garlic, sage, cognac, endive, apple, hazelnut',
      pairRed: PR_CHIANTI,
      i18n: ix('Medallones de cerdo “Reggiano”', 'Costra de parmesano, ajo, salvia y coñac, ensalada de endibia, manzana y avellana', 'Médaillons de porc « Reggiano »', 'Croûte de parmesan, ail, sauge et cognac, salade d’endive, pomme et noisette', '猪里脊「雷焦」', '帕尔马干酪脆皮、大蒜鼠尾草干邑、菊苣苹果榛子沙拉')
    }),
    d('sf_m_duck', 'Duck legs “Murphy”', 'Sausage, mushrooms, cherry peppers, potatoes, spicy wine', 'Pasti Principali', GR, {
      order: 42, allergens: [],
      ingredients: 'duck, sausage, mushroom, cherry pepper, potato, wine',
      pairRed: PR_VALPO,
      i18n: ix('Muslos de pato “Murphy”', 'Salchicha, champiñones, pimientos cherry, patatas, vino picante', 'Cuisses de canard « Murphy »', 'Saucisse, champignons, piments cerise, pommes de terre, vin pimenté', '鸭腿「墨菲」', '香肠、蘑菇、樱桃椒、土豆、辣味葡萄酒')
    }),

    d('sf_e_sorbet', 'Coconut–lime sorbet with rum glazed pineapple', 'Entremets served to every guest before dessert. Contains rum and nuts on the plate — check allergies before firing.', 'Entremets', PA, {
      order: 50, allergens: ['Tree Nut'], cookNote: 'Allergy check: nuts and rum. Do not fire if the guest has a nut allergy unless confirmed.',
      ingredients: 'coconut, lime, rum, pineapple, nut',
      pairDessert: PD_MOSCATO,
      i18n: ix('Sorbete de coco y lima con piña al ron', 'Entremets para todos antes del postre. Contiene ron y frutos secos — verificar alergias.', 'Sorbet coco-citron vert, ananas au rhum', 'Entremets servi à tous avant le dessert. Rhum et fruits à coque — vérifier les allergies.', '椰奶青柠雪芭配朗姆酒菠萝', '甜品前的过渡小食。含朗姆酒与坚果，请确认过敏。')
    }),

    d('sf_d_napoleon', 'Napoleon of chocolate painted fillo', 'Layered with chocolate-espresso mousse, bitter chocolate crumbs and praline cream', 'Dolce', PA, {
      order: 60, allergens: ['Gluten', 'Dairy', 'Egg', 'Tree Nut'],
      ingredients: 'chocolate, fillo, espresso, praline',
      pairDessert: PD_VIDAL,
      i18n: ix('Napoleón de chocolate sobre fillo', 'Mousse de chocolate y espresso, migas de chocolate amargo y crema praliné', 'Napoléon au chocolat sur filo', 'Mousse chocolat-espresso, éclats de chocolat amer et crème praliné', '巧克力千层酥（菲罗饼皮）', '巧克力浓缩咖啡慕斯、苦巧克力碎、果仁糖奶油')
    }),
    d('sf_d_cake', 'Warm flourless chocolate cake', 'Fleur de sel, pistachio gelato and Amarena cherries from Emilia Romagna', 'Dolce', PA, {
      order: 61, allergens: ['Dairy', 'Egg', 'Tree Nut'],
      ingredients: 'chocolate, fleur de sel, pistachio, Amarena cherry',
      pairDessert: PD_VIDAL,
      i18n: ix('Pastel de chocolate sin harina, caliente', 'Flor de sal, helado de pistacho y cerezas Amarena de Emilia-Romaña', 'Moelleux au chocolat sans farine', 'Fleur de sel, glace pistache et cerises Amarena d’Émilie-Romagne', '热熔无粉巧克力蛋糕', '海盐花、开心果冰淇淋、艾米利亚－罗马涅黑樱桃')
    }),
    d('sf_d_tart', 'Chocolate–raspberry–caramel tart', 'Toasted hazelnuts and whipped cream', 'Dolce', PA, {
      order: 63, allergens: ['Gluten', 'Dairy', 'Tree Nut', 'Egg'],
      ingredients: 'chocolate, raspberry, caramel, hazelnut, cream',
      pairDessert: PD_VIDAL,
      i18n: ix('Tarta de chocolate, frambuesa y caramelo', 'Avellanas tostadas y nata montada', 'Tarte chocolat–framboise–caramel', 'Noisettes torréfiées et crème fouettée', '巧克力、覆盆子与焦糖挞', '烤榛子与鲜奶油')
    }),
    d('sf_d_basque', 'Basque cheesecake', 'Mascarpone, balsamic strawberries', 'Dolce', PA, {
      order: 63.5, allergens: ['Dairy', 'Egg'],
      ingredients: 'mascarpone, cream cheese, egg, strawberry, balsamic',
      pairDessert: PD_MOSCATO,
      i18n: ix('Tarta de queso vasca', 'Mascarpone, fresas al balsámico', 'Gâteau basque au fromage', 'Mascarpone, fraises au balsamique', '巴斯克芝士蛋糕', '马斯卡彭、香醋草莓')
    }),
    d('sf_d_pistachio_tart', 'Pistachio crème brûlée tart', 'Caramelized sugar over pistachio custard in a tart shell', 'Dolce', PA, {
      order: 63.6, allergens: ['Gluten', 'Dairy', 'Egg', 'Tree Nut'],
      ingredients: 'pistachio, cream, egg, sugar, tart shell',
      pairDessert: PD_MOSCATO,
      i18n: ix('Tarta de crème brûlée de pistacho', 'Azúcar caramelizado sobre crema de pistacho', 'Tarte crème brûlée à la pistache', 'Sucre caramélisé sur crème pistache', '开心果焦糖布丁挞', '开心果蛋奶馅，焦糖脆面')
    }),
    d('sf_d_panino', '“Panino”', 'Crisp pistachio and hazelnut caramel wafers layered with hazelnut gelato', 'Dolce', PA, {
      order: 64, allergens: ['Gluten', 'Dairy', 'Tree Nut', 'Egg'],
      ingredients: 'pistachio, hazelnut, caramel, gelato, wafer',
      pairDessert: PD_VIDAL,
      i18n: ix('“Panino”', 'Barquillos crujientes de pistacho y avellana con helado de avellana', '« Panino »', 'Gaufrettes caramel pistache-noisette, glace noisette', '「帕尼诺」', '开心果与榛子焦糖威化、榛子冰淇淋')
    }),
    d('sf_d_pineapple', 'Warm pineapple tart', 'Cold zabaglione and vanilla gelato, crushed amaretti', 'Dolce', PA, {
      order: 65, allergens: ['Gluten', 'Dairy', 'Egg', 'Tree Nut'],
      ingredients: 'pineapple, zabaglione, vanilla, amaretti',
      pairDessert: PD_MOSCATO,
      i18n: ix('Tarta tibia de piña', 'Zabaione frío, helado de vainilla y amaretti triturado', 'Tarte tiède à l’ananas', 'Zabaione froid, glace vanille et amaretti concassés', '热菠萝挞', '冰镇沙巴雍、香草冰淇淋、碎杏仁饼干')
    }),
    d('sf_d_banana', 'Thinly sliced bananas', 'Lightly brûléed in a crispy fillo crust with lemon-mascarpone cream', 'Dolce', PA, {
      order: 66, allergens: ['Gluten', 'Dairy', 'Egg'],
      ingredients: 'banana, fillo, lemon, mascarpone',
      pairDessert: PD_MOSCATO,
      i18n: ix('Plátano en láminas', 'Ligeramente quemado en fillo crujiente con crema de limón y mascarpone', 'Bananes en fines tranches', 'Légèrement brûlées, croûte de filo, crème citron-mascarpone', '薄片香蕉', '菲罗酥皮、柠檬马斯卡彭奶油、轻焦糖')
    }),
    d('sf_d_gelato', 'Sorbetti e gelati — three scoops', 'Choose three: green apple, lemon, vanilla, caramel, hazelnut, pistachio', 'Dolce', PA, {
      order: 67, allergens: ['Dairy', 'Tree Nut'], chooseCount: 3, scoops: GELATO_SCOOPS,
      ingredients: 'gelato, milk, pistachio, hazelnut',
      pairDessert: PD_MOSCATO,
      i18n: ix('Sorbete y gelato — tres bolas', 'Elija tres: manzana verde, limón, vainilla, caramelo, avellana, pistacho', 'Sorbets et gelati — trois boules', 'Trois parfums : pomme verte, citron, vanille, caramel, noisette, pistache', '雪芭与冰淇淋（三球）', '任选三种：青苹果、柠檬、香草、焦糖、榛子、开心果')
    }),
    d('sf_d_formaggio', 'Formaggio', 'Gorgonzola Dolce (Lombardy, cow), Parmigiano Reggiano (Emilia Romagna, cow), Mozzarella di Bufala (Campania, buffalo)', 'Dolce', GM, {
      order: 68, upcharge: 8, allergens: ['Dairy'],
      ingredients: 'Gorgonzola, Parmigiano, buffalo mozzarella',
      pairDessert: PD_PORT,
      i18n: ix('Formaggio', 'Gorgonzola Dolce (Lombardía, vaca), Parmigiano Reggiano (Emilia-Romaña, vaca), Mozzarella di Bufala (Campania, búfala)', 'Formaggio', 'Gorgonzola Dolce (Lombardie, vache), Parmigiano Reggiano (Émilie-Romagne, vache), Mozzarella di Bufala (Campanie, bufflonne)', '奶酪拼盘', '甜 Gorgonzola（伦巴第，牛乳）、帕尔马干酪（艾米利亚－罗马涅，牛乳）、水牛乳鲜奶酪（坎帕尼亚）')
    })
  ];

  var courses = [
    { id: 'pfc_welcome', label: 'Primi Piccolo', order: 0, mode: 'auto', fireEach: true },
    { id: 'pfc_primi', label: 'Primi', order: 1, mode: 'choose' },
    { id: 'pfc_main', label: 'Pasti Principali', order: 2, mode: 'choose' },
    { id: 'pfc_entremets', label: 'Entremets', order: 3, mode: 'entremets' },
    { id: 'pfc_dolce', label: 'Dolce', order: 4, mode: 'later', fireAfter: 'main' }
  ];

  function optionFromDish(x) {
    return {
      id: x.id,
      name: x.name,
      desc: x.desc,
      station: x.station,
      upcharge: x.upcharge,
      pairing: x.pairing,
      pairWhite: x.pairWhite,
      pairRed: x.pairRed,
      pairDessert: x.pairDessert,
      photoUrl: x.photoUrl,
      story: x.story,
      storyUrl: x.storyUrl,
      allergens: x.allergens,
      dietary: x.dietary,
      chooseCount: x.chooseCount,
      scoops: x.scoops,
      cookNote: x.cookNote,
      cookTime: x.cookTime,
      ingredients: x.ingredients,
      askTemp: x.askTemp,
      i18n: x.i18n
    };
  }

  courses.forEach(function (c) {
    c.options = dishes.filter(function (x) { return x.course === c.label; }).sort(function (a, b) { return a.order - b.order; }).map(optionFromDish);
  });

  function tc(num, name, desc, station, extra) {
    extra = extra || {};
    return {
      num: num,
      name: name,
      desc: desc,
      station: station,
      upcharge: extra.upcharge || 0,
      photoUrl: extra.photoUrl || '',
      story: extra.story || extra.notes || extra.descriptionLong || '',
      storyUrl: extra.storyUrl || '',
      allergens: extra.allergens || [],
      mode: extra.mode || 'auto',
      pending: !!extra.pending,
      fireAfter: extra.fireAfter || '',
      cookNote: extra.cookNote || '',
      cookTime: extra.cookTime || 0,
      dishId: extra.dishId || '',
      group: extra.group || '',
      pairWhite: extra.pairWhite || '',
      pairRed: extra.pairRed || '',
      pairDessert: extra.pairDessert || '',
      ingredients: extra.ingredients || '',
      askTemp: extra.askTemp || '',
      i18n: extra.i18n || {}
    };
  }

  var tastingCourses = [
    tc(1, 'Crostini assortiti', 'Assorted toasted breads with house toppings. Welcome course — fire alone.', GM, {
      allergens: ['Gluten'], dishId: 'sf_w_crostini', group: 'Welcome',
      ingredients: 'bread, olive oil, tomato, cheese', pairWhite: PS_BECK,
      i18n: ix('Crostini surtidos', 'Panes tostados con toppings de la casa. Bienvenida — disparar sola.', 'Crostini assortis', 'Pains grillés et garnitures maison. Mise en bouche — envoyer seule.', '什锦烤面包', '各式烤面包配店内浇头。欢迎菜 — 单独出餐。')
    }),
    tc(2, 'Breaded zucchini Milanese', 'Tomato-basil sauce, chili oil. Welcome course — fire alone.', FR, {
      allergens: ['Gluten', 'Egg'], dishId: 'sf_w_zucchini', group: 'Welcome',
      ingredients: 'zucchini, bread crumbs, egg, tomato, basil, chili oil', pairWhite: PW_GRIGIO,
      i18n: ix('Calabacín a la milanesa empanado', 'Salsa de tomate y albahaca, aceite de chile. Bienvenida — disparar sola.', 'Courgette milanaise panée', 'Sauce tomate-basilic, huile de piment. Mise en bouche — envoyer seule.', '米兰式炸西葫芦', '番茄罗勒、辣椒油。欢迎菜 — 单独出餐。')
    }),
    tc(3, 'Porcini ravioli — Piemonte', 'Wild mushroom and black truffle sauce', SA, {
      allergens: ['Gluten', 'Dairy'], dishId: 'sf_p_porcini', group: 'Courses',
      pairWhite: PW_CHARD, pairRed: PR_BARBERA,
      i18n: ix('Ravioli de porcini — Piamonte', 'Salsa de setas silvestres y trufa negra', 'Ravioli aux cèpes — Piémont', 'Sauce champignons sauvages et truffe noire', '牛肝菌馄饨 — 皮埃蒙特', '野生蘑菇与黑松露酱')
    }),
    tc(4, 'Butternut agnolotti with sage — Emilia Romagna', 'Sage butter, crushed amaretti and buffalo mozzarella', SA, {
      allergens: ['Gluten', 'Dairy', 'Tree Nut', 'Egg'], dishId: 'sf_p_agnolotti', group: 'Courses',
      pairWhite: PW_CHARD,
      i18n: ix('Agnolotti de calabaza con salvia — Emilia-Romaña', 'Mantequilla de salvia, amaretti y mozzarella de búfala', 'Agnolotti au potimarron, sauge — Émilie-Romagne', 'Beurre sauge, amaretti et mozzarella de bufflonne', '鼠尾草南瓜馄饨 — 艾米利亚－罗马涅', '鼠尾草黄油、杏仁饼干、水牛乳鲜奶酪')
    }),
    tc(5, 'Salmon wild mushroom & black truffle — Umbria', 'Farm-raised salmon “Piemontese” over baby spinach and roasted beets', SA, {
      allergens: ['Fish', 'Dairy'], dishId: 'sf_m_forestiere', group: 'Courses', askTemp: 'salmon',
      pairWhite: PW_CHARD, pairRed: PR_BARBERA,
      i18n: ix('Salmón con setas silvestres y trufa negra — Umbría', 'Salmón “Piemontese”, espinacas baby y remolacha asada', 'Saumon aux champignons et truffe noire — Ombrie', 'Saumon « Piemontese », épinards et betteraves rôties', '蘑菇黑松露三文鱼 — 翁布里亚', '养殖三文鱼「皮埃蒙特」，嫩菠菜与烤甜菜')
    }),
    tc(6, 'Pan roasted filet mignon “Giambotta” — Toscana', 'Spicy wine sauce with mushrooms, onions and hot & sweet peppers. Take dessert after this meat course.', GR, {
      allergens: [], dishId: 'sf_m_giambotta', group: 'Courses', askTemp: 'steak',
      pairRed: PR_BRUNELLO,
      i18n: ix('Filet mignon “Giambotta” — Toscana', 'Salsa de vino picante con champiñones, cebolla y pimientos. Tomar el postre después de este plato de carne.', 'Filet mignon « Giambotta » — Toscane', 'Sauce au vin pimentée, champignons, oignons et poivrons. Prendre le dessert après cette viande.', '菲力牛排「江博塔」— 托斯卡纳', '辣味葡萄酒酱。此肉菜之后再点甜品。')
    }),
    tc(7, 'Lime & coconut sorbet with rum pineapple', 'Entremets for every guest before dessert. Nuts and rum — check allergies.', PA, {
      allergens: ['Tree Nut'], mode: 'entremets', pending: true, fireAfter: 'meat', dishId: 'sf_e_sorbet', group: 'Entremets',
      cookNote: 'Allergy check: nuts and rum.', pairDessert: PD_MOSCATO,
      i18n: ix('Sorbete de lima y coco con piña al ron', 'Entremets para todos. Frutos secos y ron — verificar alergias.', 'Sorbet citron vert-coco, ananas au rhum', 'Entremets pour tous. Fruits à coque et rhum — vérifier les allergies.', '青柠椰奶雪芭配朗姆菠萝', '全桌过渡小食。含坚果与朗姆酒 — 请确认过敏。')
    }),
    tc(8, 'Dolce', 'Dessert is included. Take the order after the meat course; guest chooses from the chocolate, seasonal, gelato, or cheese menus.', PA, {
      mode: 'later', pending: true, fireAfter: 'meat', group: 'Dolce',
      i18n: ix('Dolce', 'Postre incluido. Tomar el pedido después de la carne; elija chocolate, de temporada, gelato o queso.', 'Dolce', 'Dessert inclus. Prendre la commande après la viande : chocolat, saison, gelato ou fromage.', '甜品', '含甜品。肉菜之后点单：巧克力、时令、冰淇淋或奶酪。')
    })
  ];

  var prixFixe = {
    id: 'pf_scalini_89',
    version: VERSION,
    name: 'Scalini Fedeli',
    subtitle: 'Prix fixe dinner $89. Primi Piccolo fire one by one; dessert after the main.',
    desc: 'Three Primi Piccolo bites are sent automatically, one at a time. Choose a primo and a main. Dessert is taken after the main. Coconut–lime sorbet is served as entremets before dessert.',
    price: 89,
    service: 'dinner',
    mealPeriod: 'dinner',
    active: true,
    createdAt: Date.now(),
    welcomeFireEach: true,
    dessertAfter: 'main',
    i18n: {
      es: {
        subtitle: 'Cena prix fixe $89. Primi Piccolo se envían uno a uno; postre después del principal.',
        desc: 'Tres bocados de Primi Piccolo se sirven solos, uno a uno. Elija un primo y un principal. El postre se toma después del principal. El sorbete de coco y lima se sirve como entremets antes del postre.'
      },
      fr: {
        subtitle: 'Dîner prix fixe $89. Les Primi Piccolo partent un par un ; dessert après le plat.',
        desc: 'Trois Primi Piccolo partent automatiquement, un à la fois. Choisissez un primo et un plat. Le dessert se prend après le plat. Le sorbet coco-citron vert est servi en entremets avant le dessert.'
      },
      zh: {
        subtitle: '套餐晚餐 $89。小头盘逐道出品。甜品在主菜之后。',
        desc: '三道小头盘自动逐道出品。请选择头盘与主菜。甜品在主菜之后。椰奶青柠雪芭是甜品前的过渡小食。'
      }
    },
    courses: courses,
    dishes: dishes.filter(function (x) { return x.course !== 'Tasting Welcome'; }),
    courseGroups: courses.map(function (c) {
      var choose = c.mode === 'choose' ? 1 : (c.mode === 'later' ? 1 : 0);
      return { label: c.label, choose: choose, mode: c.mode, fireEach: !!c.fireEach, fireAfter: c.fireAfter || '', options: c.options };
    })
  };

  var tasting = {
    id: 'tm_scalini_128',
    version: VERSION,
    name: 'Scalini Fedeli Regional Tasting',
    subtitle: 'Crostini and zucchini, then Piemonte, Emilia Romagna, Umbria, Toscana',
    price: 115,
    duration: '~3 hours',
    service: 'dinner',
    mealPeriod: 'dinner',
    active: true,
    createdAt: Date.now(),
    welcomeFireEach: true,
    dessertAfter: 'meat',
    dessertMenuId: 'pf_scalini_89',
    i18n: {
      es: { subtitle: 'Crostini y calabacín, luego Piamonte, Emilia-Romaña, Umbría, Toscana' },
      fr: { subtitle: 'Crostini et courgette, puis Piémont, Émilie-Romagne, Ombrie, Toscane' },
      zh: { subtitle: '烤面包与西葫芦之后：皮埃蒙特、艾米利亚－罗马涅、翁布里亚、托斯卡纳' }
    },
    courses: tastingCourses,
    pairings: []
  };

  function wg(id, group, name, producer, vintage, region, varietal, glass) {
    return {
      id: id,
      group: group,
      name: name,
      producer: producer || '',
      vintage: vintage || 'NV',
      region: region || '',
      varietal: varietal || '',
      glassPrice: glass,
      bottlePrice: 0,
      price: glass,
      byTheGlass: true,
      scaliniOnly: true,
      category: 'wine-glass',
      station: 'Bar',
      allergens: ['Sulfites'],
      desc: [producer, vintage && vintage !== 'NV' ? vintage : '', region, varietal].filter(Boolean).join(' · ')
    };
  }

  var winesByGlass = [
    wg('btg_spark_beck', 'Sparkling', 'Graham Beck Brut', 'Graham Beck', 'NV', 'South Africa', 'Sparkling', 15),
    wg('btg_spark_zardetto', 'Sparkling', 'Prosecco Zardetto Brut', 'Zardetto', 'NV', 'Veneto', 'Prosecco', 17),
    wg('btg_spark_laherte', 'Sparkling', 'Laherte-Frères “Ultradition” Brut Nature 2019', 'Laherte-Frères', '2019', 'Champagne', 'Brut Nature', 29),
    wg('btg_white_haberle', 'White', 'Pinot Bianco “Haberle” Elena Walch 2019', 'Elena Walch', '2019', 'Alto Adige', 'Pinot Bianco', 18),
    wg('btg_white_baccio', 'White', 'Pinot Grigio delle Venezie “Terre di Baccio” 2021', 'Terre di Baccio', '2021', 'Veneto', 'Pinot Grigio', 15),
    wg('btg_white_vette', 'White', 'Sauvignon Blanc “Vette” Tenuta San Leonardo 2021', 'Tenuta San Leonardo', '2021', 'Trentino', 'Sauvignon Blanc', 17),
    wg('btg_white_hartford', 'White', 'Chardonnay “Russian River Valley” Hartford Court 2020', 'Hartford Court', '2020', 'Russian River Valley', 'Chardonnay', 24),
    wg('btg_red_cora', 'Red', 'Montepulciano d’Abruzzo “Cora” Velenosi 2019', 'Velenosi', '2019', 'Abruzzo', 'Montepulciano', 16),
    wg('btg_red_fumanelli', 'Red', 'Valpolicella Classico Superiore Marchesi Fumanelli 2020', 'Marchesi Fumanelli', '2020', 'Veneto', 'Valpolicella', 18),
    wg('btg_red_pianetto', 'Red', 'Merlot “Pianetto” 2018', 'Pianetto', '2018', 'Sicily', 'Merlot', 15),
    wg('btg_lib_galtelli', 'Library', 'Brunello di Montalcino Riserva Galtelli 2015', 'Galtelli', '2015', 'Montalcino', 'Sangiovese', 38),
    wg('btg_lib_macie', 'Library', 'Chianti Classico Riserva “Vigneti” Rocca delle Macie 2009', 'Rocca delle Macie', '2009', 'Chianti Classico', 'Sangiovese', 30),
    wg('btg_lib_vulpis', 'Library', 'Barbera del Monferrato Superiore “Vulpis” Cascina Valpane 2010', 'Cascina Valpane', '2010', 'Monferrato', 'Barbera', 21),
    wg('btg_des_spinetta', 'Dessert', 'Moscato d’Asti “Bricco Quaglia” La Spinetta 2022', 'La Spinetta', '2022', 'Asti', 'Moscato', 14),
    wg('btg_des_vidal', 'Dessert', 'Inniskillin Ice Wine Vidal Pearl 2021', 'Inniskillin', '2021', 'Niagara', 'Vidal', 18),
    wg('btg_des_riesling', 'Dessert', 'Inniskillin Ice Wine Riesling 2021', 'Inniskillin', '2021', 'Niagara', 'Riesling', 20),
    wg('btg_des_franc', 'Dessert', 'Inniskillin Ice Wine Cabernet Franc 2022', 'Inniskillin', '2022', 'Niagara', 'Cabernet Franc', 25),
    wg('btg_port_bin27', 'Port', 'Fonseca Ruby Reserve Bin 27', 'Fonseca', 'NV', 'Porto', 'Ruby Port', 12),
    wg('btg_port_croft', 'Port', 'Croft Distinction Special Reserve', 'Croft', 'NV', 'Porto', 'Reserve Port', 14),
    wg('btg_port_tawny10', 'Port', 'Fonseca Tawny 10 Years', 'Fonseca', 'NV', 'Porto', 'Tawny Port', 16),
    wg('btg_port_tawny20', 'Port', 'Fonseca Tawny 20 Years', 'Fonseca', 'NV', 'Porto', 'Tawny Port', 22)
  ];

  var ingredientNotes = {
    'smoked salmon': 'Salmon that has been cured and smoked — silky, salty, and served cold as a welcome bite.',
    salmon: 'Salmon is an oily fish. On this menu it is cooked to the temperature you choose.',
    lemon: 'Lemon brightens rich sauces with citrus acidity.',
    chive: 'Chives are a mild onion herb, often folded into cream.',
    crema: 'A light cream sauce — dairy-based and silky.',
    brioche: 'A rich egg-and-butter bread, toasted here under the salmon.',
    zucchini: 'Zucchini (summer squash) is breaded and fried Milanese-style.',
    'bread crumbs': 'Dried crumbs that fry into a crisp golden crust.',
    egg: 'Egg binds the crust or the pasta filling. Soft yolk raviolo is meant to run when cut.',
    tomato: 'Ripe tomato is the base of many Italian sauces on this menu.',
    basil: 'Fresh basil is the green herb of Genoa and summer tomato sauces.',
    'chili oil': 'Chili oil is olive oil steeped with hot pepper — a little heat on the plate.',
    shrimp: 'Ecuadorian shrimp are sweet shellfish. Tell us if you cannot eat shellfish.',
    sherry: 'Sherry is a fortified wine from Spain; it gives a nutty sweetness to the mustard sauce.',
    mustard: 'Mustard adds sharp, tangy heat to the shrimp sauce.',
    'tropea onion': 'Tropea onions from Calabria are sweet red onions, pickled here for bite.',
    bread: 'Toasted bread is the base of crostini — Italian for “little toasts.”',
    'olive oil': 'Extra virgin olive oil is the house fat: fruity, peppery, never heavy.',
    cheese: 'Italian cheeses on this menu range from fresh mozzarella to aged Parmigiano.',
    radicchio: 'Trevisano radicchio is a bitter red chicory from the Veneto — the “rosso” in Rosso–Bianco.',
    beet: 'Roasted beet is sweet and earthy, the “bianco/rosso” contrast with goat cheese.',
    'goat cheese': 'Fresh goat cheese is tangy and creamy against bitter greens.',
    'blood orange': 'Blood orange is a winter citrus with raspberry notes, used in the salad dressing.',
    pignoli: 'Pignoli are pine nuts, toasted for crunch. They are tree nuts.',
    arugula: 'Arugula (rocket) is a peppery salad green.',
    'buffalo mozzarella': 'Mozzarella di bufala is fresh cheese made from water-buffalo milk in Campania.',
    prosciutto: 'Prosciutto di Parma is salt-cured ham, sliced paper-thin.',
    pistachio: 'Pistachio is a green tree nut, toasted on the salad and used in pastry.',
    balsamic: 'Aged balsamic vinegar from Emilia-Romagna is sweet-tart and syrupy.',
    lobster: 'Maine lobster tail is sweet shellfish. This primo carries a supplement.',
    garlic: 'Garlic is sautéed as the base of many house sauces.',
    parsley: 'Flat-leaf parsley is the fresh green finish on seafood pasta.',
    vermentino: 'Vermentino is a crisp Italian white wine used in the seafood sauce.',
    'calabrian chili': 'Calabrian chili is a spicy-sweet pepper from southern Italy.',
    'capelli d’angelo': 'Capelli d’angelo is “angel hair” — the thinnest pasta.',
    'egg yolk': 'A whole soft yolk sealed inside pasta; cut it and the sauce becomes richer.',
    pasta: 'House pasta is wheat and egg unless noted otherwise.',
    butter: 'Butter sauces are dairy. Truffle butter is butter scented with black truffle.',
    'black truffle': 'Black truffle is an earthy fungus shaved or infused into sauces. It is not a mushroom allergy by itself, but tell us any fungus allergy.',
    porcini: 'Porcini are meaty wild mushrooms (cèpes), classic to Piemonte.',
    'wild mushroom': 'A mix of forest mushrooms — earthy, sautéed, sometimes with truffle.',
    'butternut squash': 'Butternut squash is a sweet winter squash, pureed into pasta filling or a seafood puree.',
    sage: 'Sage is an aromatic herb used with butter, squash, pork, and veal.',
    amaretti: 'Amaretti are crisp almond cookies crushed over pasta. They contain tree nuts.',
    spaghettini: 'Thin spaghetti.',
    olive: 'Olives add salt and bitterness to Arrabbiata and seafood sauces.',
    mushroom: 'Cultivated or wild mushrooms, sautéed for sauce or garnish.',
    anchovy: 'Salt-cured fish that melts into the sauce — you taste savoriness more than “fish.”',
    tagliatelle: 'Ribbon pasta from Emilia-Romagna, the classic partner for Bolognese.',
    veal: 'Veal is tender meat from young cattle, milder than beef. Used in scaloppini and some ragùs.',
    pork: 'Pork is cooked to the temperature you choose on chops and medallions.',
    ricotta: 'Fresh whey cheese, whipped so it is light on the Bolognese.',
    pappardelle: 'Very wide ribbon pasta, made for slow braises.',
    orange: 'A hint of orange zest lifts the veal-and-pork ragù.',
    mascarpone: 'A rich double-cream cheese from Lombardy.',
    linguini: 'Flat spaghetti, used here for spicy seafood sauce.',
    chili: 'Hot pepper. Ask if you want it milder.',
    fusilli: 'Twisted pasta that holds creamy vodka sauce.',
    cream: 'Dairy cream. Tell us about lactose or dairy allergies.',
    vodka: 'A splash of vodka in the tomato-cream sauce; most of the alcohol cooks off.',
    rigatoni: 'Ridged tubes of pasta that catch Amatriciana sauce.',
    guanciale: 'Cured pork jowl — the traditional meat in Amatriciana, richer than bacon.',
    sole: 'A delicate flatfish. Francese is egg-and-flour; Genovese is pine-nut crusted.',
    flour: 'Wheat flour in the Francese crust. Not gluten-free.',
    'white wine': 'Dry white wine reduced into a pan sauce with lemon and capers.',
    caper: 'Pickled flower buds — salty and floral with lemon.',
    scallop: 'Day-boat sea scallops are sweet and seared. Shellfish.',
    'celery root': 'Celeriac, a mild celery-flavored root, pureed with peas.',
    pea: 'Sweet green peas in the puree under the scallops.',
    spinach: 'Baby spinach wilted under the salmon.',
    apple: 'Apple in the squash puree (Zafferano) or in the endive salad (Reggiano).',
    saffron: 'Saffron is the orange-red spice of risotto Milanese, used here with shrimp.',
    'white asparagus': 'Pale asparagus, more delicate than green, in a tomato-basil broth.',
    chive: 'Mild onion herb.',
    chicken: 'Boneless chicken breast cut into strips, Scarpariello-style with sausage.',
    sausage: 'Italian pork sausage, sautéed with the chicken or duck.',
    potato: 'Potato gratin is sliced potato baked with dairy until brown.',
    fontina: 'A mountain melting cheese from Valle d’Aosta, stuffed into Valdostana.',
    madeira: 'A fortified wine that gives a nutty, caramel depth to mushroom sauce.',
    lamb: 'Lamb shank in the style of osso buco, taken off the bone, with lentils.',
    lentil: 'Braised lentils are earthy legumes under the lamb.',
    'sicilian olive': 'Olives from Sicily, spicy in the lamb reduction.',
    'filet mignon': 'The tenderloin of beef — this 10 oz. split filet is from Dutton Ranch in South Carolina.',
    onion: 'Onions in the Giambotta mix with peppers and mushrooms.',
    'hot pepper': 'Chili peppers for heat in Giambotta.',
    'sweet pepper': 'Bell-style peppers for sweetness in Giambotta.',
    wine: 'Reduced wine in the pan sauce. Library reds by the glass pair with steak and lamb.',
    parmigiano: 'Parmigiano Reggiano is aged cow’s-milk cheese from Emilia-Romagna, grated into a crust here.',
    cognac: 'Brandy flambéed with garlic and sage for the pork medallions.',
    endive: 'Bitter Belgian endive, sliced into the apple-hazelnut salad.',
    hazelnut: 'Toasted hazelnuts — a tree nut — on salad and pastry.',
    duck: 'Duck legs braised “Murphy” with sausage, mushrooms, cherry peppers, and potatoes.',
    'cherry pepper': 'Pickled hot cherry peppers.',
    coconut: 'Coconut milk or puree in the lime sorbet.',
    lime: 'Lime is tart citrus in the entremets sorbet.',
    rum: 'Rum glazes the pineapple. Contains alcohol.',
    pineapple: 'Caramelized pineapple with rum on the entremets, or warm in a tart.',
    nut: 'Tree nuts may garnish the entremets plate. Tell your server about nut allergies.',
    chocolate: 'Dark chocolate in Napoleon, flourless cake, and the raspberry-caramel tart.',
    fillo: 'Paper-thin pastry (phyllo). Contains gluten.',
    espresso: 'Coffee folded into chocolate mousse.',
    praline: 'Caramelized nuts ground into cream. Tree nuts.',
    'fleur de sel': 'Delicate sea salt crystals on the warm chocolate cake.',
    'amarena cherry': 'Sour cherries in syrup from Emilia-Romagna.',
    raspberry: 'Fresh or cooked raspberries with chocolate and caramel.',
    caramel: 'Cooked sugar, buttery and bitter-sweet.',
    strawberry: 'Balsamic strawberries with the Basque cheesecake.',
    'cream cheese': 'The dense dairy base of Basque cheesecake, with mascarpone.',
    banana: 'Thin banana slices, brûléed in fillo.',
    zabaglione: 'A light foam of egg yolk, sugar, and wine, served cold on the pineapple tart.',
    vanilla: 'Vanilla gelato or custard.',
    gelato: 'Italian ice cream. Dairy unless it is a fruit sorbet.',
    gorgonzola: 'Gorgonzola Dolce is a creamy blue cheese from Lombardy.',
    'buffalo mozzarella': 'Fresh Campania mozzarella from water-buffalo milk.'
  };

  var ui = {
    en: {
      prixFixe: 'Prix Fixe',
      tasting: 'Tasting',
      setMenus: 'Set Menus',
      tastingMenus: 'Tasting Menus',
      perPerson: 'per person',
      choose: 'choose',
      included: 'Included',
      servedAuto: 'Served automatically — kitchen fires one by one',
      dessertLater: 'Ordered after the main course',
      tastingDessertLater: 'Ordered after the meat course',
      entremetsNote: 'Served to everyone before dessert. Contains rum-glazed pineapple and nuts — tell your server about nut allergies.',
      threeScoops: 'Choose three scoops',
      supplement: 'supp',
      experience: 'Experience',
      allergies: 'Allergies',
      welcome: 'Primi Piccolo',
      dolce: 'Dolce',
      callServer: 'Call Server',
      viewMenu: 'View Menu',
      selectTable: 'Select table',
      table: 'Table',
      orderPadTitle: 'Write your order',
      orderPadHint: 'Tap a dish to add it here, or write in your language. English for your Food Master appears on the right.',
      orderPadPlaceholder: 'Example: I would like the smoked salmon, no onions, and I am allergic to nuts',
      orderPadSend: 'Send to Food Master',
      orderPadSending: 'Translating and sending…',
      orderPadSent: 'Sent to your Food Master in English',
      orderPadEmpty: 'Please write your order first',
      orderPadFail: 'Could not send. Please call your server.',
      guestLang: 'Your language',
      englishForKitchen: 'English for Food Master',
      translatingLive: 'Translating…',
      aboutDish: 'About this dish',
      fromTheKitchen: 'From the kitchen',
      tapForStory: 'Tap to learn about this dish',
      tapForWine: 'Tap to add this glass to your order',
      aiExplain: 'What this dish is',
      addToOrder: 'Add to my order',
      addedToOrder: 'Added to your order',
      chooseTemp: 'How would you like it cooked?',
      winesByGlass: 'Wines by the Glass',
      wineBottles: 'Wine',
      suggestedWhite: 'Suggested white',
      suggestedRed: 'Suggested red',
      dessertWine: 'Dessert wine',
      ingredientsTitle: 'Ingredients',
      storyLink: 'Read more',
      glassPrice: 'glass',
      scaliniGlass: 'Scalini Fedeli — by the glass'
    },
    es: {
      prixFixe: 'Menú degustación a precio fijo',
      tasting: 'Menú degustación',
      setMenus: 'Menús fijos',
      tastingMenus: 'Menús degustación',
      perPerson: 'por persona',
      choose: 'elija',
      included: 'Incluido',
      servedAuto: 'Se sirve automáticamente — la cocina dispara uno a uno',
      dessertLater: 'Se pide después del plato principal',
      tastingDessertLater: 'Se pide después del plato de carne',
      entremetsNote: 'Se sirve a todos antes del postre. Incluye piña al ron y frutos secos — avise si tiene alergia a los frutos secos.',
      threeScoops: 'Elija tres bolas',
      supplement: 'supl.',
      experience: 'Experiencia',
      allergies: 'Alergias',
      welcome: 'Primi Piccolo',
      dolce: 'Dolce',
      callServer: 'Llamar al camarero',
      viewMenu: 'Ver menú',
      selectTable: 'Elegir mesa',
      table: 'Mesa',
      orderPadTitle: 'Escriba su pedido',
      orderPadHint: 'Toque un plato para añadirlo, o escríbalo en su idioma. A la derecha aparece el inglés para su Food Master.',
      orderPadPlaceholder: 'Ejemplo: quiero el salmón ahumado, sin cebolla, y soy alérgico a los frutos secos',
      orderPadSend: 'Enviar al Food Master',
      orderPadSending: 'Traduciendo y enviando…',
      orderPadSent: 'Enviado a su Food Master en inglés',
      orderPadEmpty: 'Escriba su pedido primero',
      orderPadFail: 'No se pudo enviar. Llame a su camarero.',
      guestLang: 'Su idioma',
      englishForKitchen: 'Inglés para el Food Master',
      translatingLive: 'Traduciendo…',
      aboutDish: 'Sobre este plato',
      fromTheKitchen: 'Desde la cocina',
      tapForStory: 'Toque para conocer este plato',
      tapForWine: 'Toque para añadir esta copa a su pedido',
      aiExplain: 'Qué es este plato',
      addToOrder: 'Añadir a mi pedido',
      addedToOrder: 'Añadido a su pedido',
      chooseTemp: '¿Cómo lo quiere cocinado?',
      winesByGlass: 'Vinos por copa',
      wineBottles: 'Vino',
      suggestedWhite: 'Blanco sugerido',
      suggestedRed: 'Tinto sugerido',
      dessertWine: 'Vino de postre',
      ingredientsTitle: 'Ingredientes',
      storyLink: 'Leer más',
      glassPrice: 'copa',
      scaliniGlass: 'Scalini Fedeli — por copa'
    },
    fr: {
      prixFixe: 'Menu prix fixe',
      tasting: 'Menu dégustation',
      setMenus: 'Menus',
      tastingMenus: 'Menus dégustation',
      perPerson: 'par personne',
      choose: 'choisir',
      included: 'Inclus',
      servedAuto: 'Servi automatiquement — la cuisine envoie un par un',
      dessertLater: 'Commandé après le plat principal',
      tastingDessertLater: 'Commandé après la viande',
      entremetsNote: 'Servi à tous avant le dessert. Ananas au rhum et fruits à coque — signaler toute allergie aux noix.',
      threeScoops: 'Choisir trois boules',
      supplement: 'suppl.',
      experience: 'Expérience',
      allergies: 'Allergies',
      welcome: 'Primi Piccolo',
      dolce: 'Dolce',
      callServer: 'Appeler le serveur',
      viewMenu: 'Voir le menu',
      selectTable: 'Choisir une table',
      table: 'Table',
      orderPadTitle: 'Écrivez votre commande',
      orderPadHint: 'Touchez un plat pour l’ajouter, ou écrivez dans votre langue. L’anglais pour votre Food Master apparaît à droite.',
      orderPadPlaceholder: 'Exemple : je voudrais le saumon fumé, sans oignon, et je suis allergique aux noix',
      orderPadSend: 'Envoyer au Food Master',
      orderPadSending: 'Traduction et envoi…',
      orderPadSent: 'Envoyé à votre Food Master en anglais',
      orderPadEmpty: 'Écrivez d’abord votre commande',
      orderPadFail: 'Envoi impossible. Appelez votre serveur.',
      guestLang: 'Votre langue',
      englishForKitchen: 'Anglais pour le Food Master',
      translatingLive: 'Traduction…',
      aboutDish: 'À propos de ce plat',
      fromTheKitchen: 'De la cuisine',
      tapForStory: 'Touchez pour découvrir ce plat',
      tapForWine: 'Touchez pour ajouter ce verre à votre commande',
      aiExplain: 'Ce que c’est',
      addToOrder: 'Ajouter à ma commande',
      addedToOrder: 'Ajouté à votre commande',
      chooseTemp: 'Quelle cuisson souhaitez-vous ?',
      winesByGlass: 'Vins au verre',
      wineBottles: 'Vin',
      suggestedWhite: 'Blanc suggéré',
      suggestedRed: 'Rouge suggéré',
      dessertWine: 'Vin de dessert',
      ingredientsTitle: 'Ingrédients',
      storyLink: 'En savoir plus',
      glassPrice: 'verre',
      scaliniGlass: 'Scalini Fedeli — au verre'
    },
    zh: {
      prixFixe: '套餐',
      tasting: '品鉴菜单',
      setMenus: '套餐菜单',
      tastingMenus: '品鉴菜单',
      perPerson: '每位',
      choose: '请选择',
      included: '已包含',
      servedAuto: '自动出品 — 厨房逐道出餐',
      dessertLater: '主菜之后再点',
      tastingDessertLater: '肉菜之后再点',
      entremetsNote: '甜品前供全桌。含朗姆菠萝与坚果 — 如对坚果过敏请告知服务员。',
      threeScoops: '请选三球',
      supplement: '加价',
      experience: '体验',
      allergies: '过敏',
      welcome: '小头盘',
      dolce: '甜品',
      callServer: '呼叫服务员',
      viewMenu: '查看菜单',
      selectTable: '选择桌号',
      table: '桌号',
      orderPadTitle: '写下您的订单',
      orderPadHint: '点选一道菜加入订单，或用您的语言书写。右侧会译成英文，供厨房主管阅读。',
      orderPadPlaceholder: '例如：我想要烟熏三文鱼，不要洋葱，我对坚果过敏',
      orderPadSend: '发送给厨房主管',
      orderPadSending: '正在翻译并发送…',
      orderPadSent: '已用英文发送给厨房主管',
      orderPadEmpty: '请先写下您的订单',
      orderPadFail: '无法发送。请呼叫服务员。',
      guestLang: '您的语言',
      englishForKitchen: '英文（厨房主管）',
      translatingLive: '正在翻译…',
      aboutDish: '关于这道菜',
      fromTheKitchen: '厨房故事',
      tapForStory: '点击了解这道菜',
      tapForWine: '点击将这杯酒加入订单',
      aiExplain: '这道菜是什么',
      addToOrder: '加入我的订单',
      addedToOrder: '已加入订单',
      chooseTemp: '您希望几成熟？',
      winesByGlass: '杯装葡萄酒',
      wineBottles: '葡萄酒',
      suggestedWhite: '推荐白葡萄酒',
      suggestedRed: '推荐红葡萄酒',
      dessertWine: '甜酒',
      ingredientsTitle: '食材',
      storyLink: '了解更多',
      glassPrice: '杯',
      scaliniGlass: 'Scalini Fedeli — 杯装'
    }
  };

  function collectById(menu) {
    var map = {};
    function add(x) { if (x && x.id) map[x.id] = x; }
    if (!menu) return map;
    (menu.dishes || []).forEach(add);
    (menu.courses || []).forEach(function (c) {
      add(c);
      (c.options || []).forEach(add);
    });
    (menu.courseGroups || []).forEach(function (c) {
      (c.options || []).forEach(add);
    });
    return map;
  }

  function copyLiveMediaOnto(seedMenu, liveMenu) {
    var live = collectById(liveMenu);
    function apply(x) {
      if (!x || !x.id || !live[x.id]) return;
      var L = live[x.id];
      if (L.photoUrl) { x.photoUrl = L.photoUrl; x.photo = L.photoUrl; }
      else if (L.photo) { x.photo = L.photo; x.photoUrl = L.photo; }
      if (L.story) x.story = L.story;
      if (L.storyUrl) x.storyUrl = L.storyUrl;
    }
    (seedMenu.dishes || []).forEach(apply);
    (seedMenu.courses || []).forEach(function (c) {
      apply(c);
      (c.options || []).forEach(apply);
    });
    (seedMenu.courseGroups || []).forEach(function (c) {
      (c.options || []).forEach(apply);
    });
  }

  function overlayMissingOnto(live, seed) {
    if (!live || !seed) return live;
    if (seed.i18n) {
      live.i18n = live.i18n || {};
      Object.keys(seed.i18n).forEach(function (lang) {
        if (!live.i18n[lang]) live.i18n[lang] = seed.i18n[lang];
      });
    }
    var seedById = collectById(seed);
    function fill(d) {
      var s = d && d.id && seedById[d.id];
      if (!d || !s) return;
      if (s.story && !d.story) d.story = s.story;
      if (s.storyUrl && !d.storyUrl) d.storyUrl = s.storyUrl;
      if (s.pairWhite && !d.pairWhite) d.pairWhite = s.pairWhite;
      if (s.pairRed && !d.pairRed) d.pairRed = s.pairRed;
      if (s.pairDessert && !d.pairDessert) d.pairDessert = s.pairDessert;
      if (s.ingredients && !d.ingredients) d.ingredients = s.ingredients;
      if (s.askTemp && !d.askTemp) d.askTemp = s.askTemp;
      if (s.i18n) {
        d.i18n = d.i18n || {};
        Object.keys(s.i18n).forEach(function (lang) {
          if (!d.i18n[lang]) d.i18n[lang] = s.i18n[lang];
        });
      }
      var u = s.photoUrl || s.photo;
      if (u && !d.photoUrl && !d.photo) { d.photoUrl = u; d.photo = u; }
    }
    (live.dishes || []).forEach(fill);
    (live.courses || []).forEach(function (c) {
      fill(c);
      (c.options || []).forEach(fill);
    });
    (live.courseGroups || []).forEach(function (c) {
      (c.options || []).forEach(fill);
    });
    return live;
  }

  function mergeMenu(live, seed) {
    if (!seed) return live;
    var seedCopy = JSON.parse(JSON.stringify(seed));
    var sv = Number(seedCopy.version) || VERSION;
    seedCopy.version = sv;
    if (!live) return seedCopy;
    var lv = Number(live.version) || 0;
    if (sv > lv) {
      copyLiveMediaOnto(seedCopy, live);
      return seedCopy;
    }
    overlayMissingOnto(live, seedCopy);
    if (!live.version) live.version = lv;
    return live;
  }

  function mergeList(list, seed, dummyIds) {
    seed = seed ? JSON.parse(JSON.stringify(seed)) : null;
    dummyIds = dummyIds || [];
    list = (list || []).filter(function (x) { return x && dummyIds.indexOf(x.id) < 0; });
    if (seed && !list.some(function (x) { return x.id === seed.id; })) list.unshift(seed);
    else if (seed) list = list.map(function (item) { return item && item.id === seed.id ? mergeMenu(item, seed) : item; });
    return list.filter(function (x) { return x && x.active !== false; });
  }

  root.EPICUREAN_SCALINI = {
    version: VERSION,
    dummyPrixFixeIds: ['pf_lunch', 'pf_brunch', 'pf1', 'pf2'],
    dummyTastingIds: ['tm_chef7', 'tm_choc5', 'tm1', 'tm2'],
    prixFixe: prixFixe,
    tasting: tasting,
    gelatoScoops: GELATO_SCOOPS,
    winesByGlass: winesByGlass,
    ingredientNotes: ingredientNotes,
    ui: ui,
    mergeMenu: mergeMenu,
    mergeList: mergeList
  };
})(typeof window !== 'undefined' ? window : this);
