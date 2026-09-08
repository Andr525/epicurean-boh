/* Scalini Fedeli prix fixe $89 + Regional Tasting $115.
   Shared by BOH, POS, and the iPad menu. Printed menu 2026-09-08. */
(function (root) {
  var VERSION = 20260908;
  var GM = 'Cold / Garde Manger';
  var SA = 'Sauté';
  var GR = 'Grill';
  var FR = 'Fry';
  var PA = 'Pastry';
  var MAIN = 'Piatti Principale';

  var PW_BIANCO = 'Pinot Grigio “Selvamica” Elena Walch 2022 · $16';
  var PW_GRIGIO = 'Pinot Grigio “Selvamica” Elena Walch 2022 · $16';
  var PW_SAUV = 'Roero Arneis “Sibilla” Vietti 2021 · $20';
  var PW_CHARD = 'Chardonnay “Four Hearts” Russian River Valley, Hartford Court 2021 · $40';
  var PS_PROSECCO = 'Graham Beck Brut · $16';
  var PS_BECK = 'Graham Beck Brut · $16';
  var PR_MONTE = 'Montepulciano d’Abruzzo “Umani Ronchi” 2020 · $18';
  var PR_VALPO = 'Valpolicella Classico Superiore, Masi “Brolo Campofiorin Oro” 2019 · $19';
  var PR_MERLOT = 'Merlot, Plumpjack 2019 · $36';
  var PR_BARBERA = 'Nebbiolo del Monferrato Superiore “Vignot” Cascina Valpane 2016 · $32';
  var PR_CHIANTI = 'Chianti Classico Riserva, Toscolo “Tenuta” Rocca delle Macie 2018 · $19';
  var PR_BRUNELLO = 'Merlot, Plumpjack 2019 · $36';
  var PD_MOSCATO = 'Moscato d’Asti “Bera” La Spinetta 2021 · $12';
  var PD_VIDAL = 'Inniskillin Ice Wine “Vidal Pearl” 2021 · $35';
  var PD_PORT = 'Fonseca Tawny 10 Years · $20';

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
    d('sf_w_salmon', 'Smoked Salmon', 'Served over brioche toast with lemon-chive crema', 'Primi Piccolo', GM, {
      order: 1, allergens: ['Fish', 'Gluten', 'Dairy'],
      ingredients: 'smoked salmon, lemon, chive, crema, brioche',
      pairWhite: PS_PROSECCO,
      i18n: ix('Salmón ahumado', 'Sobre brioche tostado con crema de limón y cebollino', 'Saumon fumé', 'Sur brioche toastée, crème citron-ciboulette', '烟熏三文鱼', '奶油吐司配柠檬香葱奶油酱')
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

    d('sf_m_sole', 'Filet of sole “Francese”', 'Sole filet sautéed with a light egg-flour crust in a white wine lemon and caper sauce', MAIN, SA, {
      order: 30, allergens: ['Fish', 'Egg', 'Gluten'],
      ingredients: 'sole, egg, flour, white wine, lemon, caper',
      pairWhite: PW_BIANCO,
      i18n: ix('Filete de lenguado “Francese”', 'Filete salteado con ligera costra de huevo y harina, salsa de vino blanco, limón y alcaparras', 'Filet de sole « Francese »', 'Filet sauté, légère croûte œuf-farine, sauce vin blanc citron-câpres', '龙利鱼柳「法兰西」', '薄蛋粉衣煎龙利鱼，白葡萄酒柠檬刺山柑酱')
    }),
    d('sf_m_scallops', 'Dayboat sea scallops “Bianco - Nero”', 'Celery root puree, roasted sunchokes, prosecco and black truffle jus', MAIN, SA, {
      order: 31, allergens: ['Shellfish'],
      ingredients: 'scallop, celery root, sunchoke, prosecco, black truffle',
      pairWhite: PW_CHARD,
      i18n: ix('Vieiras “Bianco - Nero”', 'Puré de apionabo, topinambur asados, jugo de prosecco y trufa negra', 'Saint-Jacques « Bianco - Nero »', 'Purée de céleri-rave, topinambours rôtis, jus de prosecco et truffe noire', '扇贝「白与黑」', '芹菜根泥、烤菊芋、普罗塞克与黑松露汁')
    }),
    d('sf_m_forestiere', 'Filet of Faroe Island salmon “Forrestiere”', 'Wild mushroom and black truffle crust over spinach and roasted beets', MAIN, SA, {
      order: 32, allergens: ['Fish', 'Dairy'], askTemp: 'salmon',
      ingredients: 'salmon, wild mushroom, black truffle, spinach, beet',
      pairWhite: PW_CHARD, pairRed: PR_BARBERA,
      i18n: ix('Salmón de las islas Feroe “Forrestiere”', 'Costra de setas silvestres y trufa negra sobre espinacas y remolacha asada', 'Saumon des îles Féroé « Forrestiere »', 'Croûte champignons sauvages et truffe noire, épinards et betteraves rôties', '法罗群岛三文鱼「林间」', '野生蘑菇与黑松露脆皮，配菠菜与烤甜菜')
    }),
    d('sf_m_zafferano', 'Butter and thyme braised Ecuadorian shrimp “Zafferano”', 'Butternut squash and apple puree, light orange-scented saffron sauce', MAIN, SA, {
      order: 33, allergens: ['Shellfish'],
      ingredients: 'shrimp, butter, thyme, butternut squash, apple, orange, saffron',
      pairWhite: PW_SAUV,
      i18n: ix('Gambas ecuatorianas “Zafferano”', 'Puré de calabaza y manzana, salsa ligera de azafrán al aroma de naranja', 'Crevettes d’Équateur « Zafferano »', 'Purée de potimarron et pomme, sauce safran parfumée à l’orange', '厄瓜多尔大虾「藏红花」', '南瓜与苹果泥、橙香藏红花酱')
    }),
    d('sf_m_genovese', 'Toasted pignoli crusted filet of sole “Genovese”', 'Tomato-basil broth over winter caponata', MAIN, SA, {
      order: 34, allergens: ['Fish', 'Tree Nut'],
      ingredients: 'sole, pignoli, tomato, basil, caponata',
      pairWhite: PW_GRIGIO,
      i18n: ix('Lenguado “Genovese” con costra de piñones', 'Caldo de tomate y albahaca sobre caponata de invierno', 'Sole « Genovese » en croûte de pignons', 'Bouillon tomate-basilic sur caponata d’hiver', '松子脆皮龙利鱼「热那亚」', '番茄罗勒高汤，配冬季卡波纳塔')
    }),
    d('sf_m_pork', '14 oz. roasted pork chop “San Domenico”', 'Mascarpone-vodka sauce with chives', MAIN, GR, {
      order: 35, allergens: ['Dairy'], askTemp: 'pork',
      ingredients: 'pork, mascarpone, vodka, chive',
      pairRed: PR_CHIANTI,
      i18n: ix('Chuleta de cerdo 14 oz. “San Domenico”', 'Salsa de mascarpone y vodka con cebollino', 'Côte de porc 14 oz « San Domenico »', 'Sauce mascarpone-vodka à la ciboulette', '14盎司猪排「圣多梅尼科」', '马斯卡彭伏特加酱、香葱')
    }),
    d('sf_m_chicken', 'Boneless breast of chicken strips “Scarpariello”', 'Sautéed with sausage and gratin of potatoes', MAIN, SA, {
      order: 36, allergens: ['Dairy'],
      ingredients: 'chicken, sausage, potato, cream, cheese',
      pairRed: PR_VALPO,
      i18n: ix('Tiras de pechuga de pollo “Scarpariello”', 'Salteado con salchicha y gratinado de patata', 'Lanières de poulet « Scarpariello »', 'Sautées avec saucisse et gratin de pommes de terre', '鸡胸「鞋匠」', '香肠与土豆焗')
    }),
    d('sf_m_veal_val', 'Veal scallopini “Valdostana”', 'Prosciutto di Parma and fontina in a wild mushroom–Madeira wine sauce', MAIN, SA, {
      order: 37, allergens: ['Dairy'],
      ingredients: 'veal, prosciutto, fontina, wild mushroom, Madeira',
      pairRed: PR_BARBERA,
      i18n: ix('Escalope de ternera “Valdostana”', 'Prosciutto di Parma y fontina en salsa de setas y Madeira', 'Escalope de veau « Valdostana »', 'Prosciutto di Parma et fontina, sauce champignons sauvages au madère', '小牛肉片「瓦尔多斯塔纳」', '帕尔玛火腿与冯蒂纳奶酪、蘑菇马德拉酱')
    }),
    d('sf_m_osso', 'Slowly braised lamb “Osso Bucco”', 'Off the bone, braised lentils, spicy Sicilian sauce and porcini mushroom reduction — $8 supp', MAIN, GR, {
      order: 38, upcharge: 8, allergens: [],
      ingredients: 'lamb, lentil, Sicilian olive, porcini',
      pairRed: PR_BRUNELLO,
      i18n: ix('Cordero “Osso Bucco”', 'Deshuesado, lentejas braseadas, salsa siciliana picante y reducción de porcini — $8 supl.', 'Agneau « Osso Bucco »', 'Désossé, lentilles braisées, sauce sicilienne pimentée et réduction de cèpes — $8 suppl.', '羊肉「骨髓管」', '去骨、烩扁豆、西西里辣酱与牛肝菌浓缩汁 — 加价 $8')
    }),
    d('sf_m_giambotta', 'Split 10 oz. filet mignon “Giambotta”', 'Spicy wine sauce with mushrooms, onions and hot & sweet peppers — $10 supp', MAIN, GR, {
      order: 40, upcharge: 10, allergens: [], askTemp: 'steak',
      ingredients: 'filet mignon, mushroom, onion, hot pepper, sweet pepper, wine',
      pairRed: PR_BRUNELLO,
      story: 'This 10 oz. filet mignon is from Dutton Ranch in South Carolina. Giambotta is the Neapolitan “little mix”: mushrooms, onions, and hot and sweet peppers in a spicy wine sauce.',
      storyUrl: 'https://en.wikipedia.org/wiki/Filet_mignon',
      i18n: ix('Filet mignon 10 oz. “Giambotta”', 'Salsa de vino picante con champiñones, cebolla y pimientos dulces y picantes — $10 supl.', 'Filet mignon 10 oz « Giambotta »', 'Sauce au vin pimentée, champignons, oignons et poivrons — $10 suppl.', '10盎司菲力牛排「江博塔」', '蘑菇、洋葱、甜椒与辣椒的辣味葡萄酒酱 — 加价 $10')
    }),
    d('sf_m_reggiano', 'Medallions of pork “Reggiano”', 'Parmigiano crust, garlic sage cognac, endive, apple and hazelnut salad', MAIN, SA, {
      order: 41, allergens: ['Dairy', 'Tree Nut'], askTemp: 'pork',
      ingredients: 'pork, Parmigiano, garlic, sage, cognac, endive, apple, hazelnut',
      pairRed: PR_CHIANTI,
      i18n: ix('Medallones de cerdo “Reggiano”', 'Costra de parmesano, ajo, salvia y coñac, ensalada de endibia, manzana y avellana', 'Médaillons de porc « Reggiano »', 'Croûte de parmesan, ail, sauge et cognac, salade d’endive, pomme et noisette', '猪里脊「雷焦」', '帕尔马干酪脆皮、大蒜鼠尾草干邑、菊苣苹果榛子沙拉')
    }),
    d('sf_m_duck', 'Duck legs “Murphy”', 'Sausage, mushrooms, cherry peppers, potatoes, spicy wine sauce', MAIN, GR, {
      order: 42, allergens: [],
      ingredients: 'duck, sausage, mushroom, cherry pepper, potato, wine',
      pairRed: PR_VALPO,
      i18n: ix('Muslos de pato “Murphy”', 'Salchicha, champiñones, pimientos cherry, patatas, salsa de vino picante', 'Cuisses de canard « Murphy »', 'Saucisse, champignons, piments cerise, pommes de terre, sauce au vin pimentée', '鸭腿「墨菲」', '香肠、蘑菇、樱桃椒、土豆、辣味葡萄酒酱')
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
    { id: 'pfc_main', label: MAIN, order: 2, mode: 'choose' },
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
    tc(1, 'Smoked Salmon', 'Served over brioche toast with lemon-chive crema. Welcome course — fire alone.', GM, {
      allergens: ['Fish', 'Gluten', 'Dairy'], dishId: 'sf_w_salmon', group: 'Welcome',
      ingredients: 'smoked salmon, lemon, chive, crema, brioche', pairWhite: PS_BECK,
      i18n: ix('Salmón ahumado', 'Sobre brioche tostado con crema de limón y cebollino. Bienvenida — disparar sola.', 'Saumon fumé', 'Sur brioche toastée, crème citron-ciboulette. Mise en bouche — envoyer seule.', '烟熏三文鱼', '奶油吐司配柠檬香葱奶油酱。欢迎菜 — 单独出餐。')
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
    tc(5, 'Salmon topped with wild mushroom & black truffle — Umbria', 'Faroe Island salmon “Forrestiere” over spinach and roasted beets', SA, {
      allergens: ['Fish', 'Dairy'], dishId: 'sf_m_forestiere', group: 'Courses', askTemp: 'salmon',
      pairWhite: PW_CHARD, pairRed: PR_BARBERA,
      i18n: ix('Salmón con setas silvestres y trufa negra — Umbría', 'Salmón de las Feroe “Forrestiere”, espinacas y remolacha asada', 'Saumon aux champignons et truffe noire — Ombrie', 'Saumon des Féroé « Forrestiere », épinards et betteraves rôties', '蘑菇黑松露三文鱼 — 翁布里亚', '法罗群岛三文鱼「林间」，菠菜与烤甜菜')
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
    subtitle: 'Smoked salmon and zucchini, then Piemonte, Emilia Romagna, Umbria, Toscana',
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
      es: { subtitle: 'Salmón ahumado y calabacín, luego Piamonte, Emilia-Romaña, Umbría, Toscana' },
      fr: { subtitle: 'Saumon fumé et courgette, puis Piémont, Émilie-Romagne, Ombrie, Toscane' },
      zh: { subtitle: '烟熏三文鱼与西葫芦之后：皮埃蒙特、艾米利亚－罗马涅、翁布里亚、托斯卡纳' }
    },
    courses: tastingCourses,
    pairings: []
  };

  function wg(id, group, name, producer, vintage, region, country, varietal, glass, bottle) {
    return {
      id: id,
      group: group,
      name: name,
      producer: producer || '',
      vintage: vintage || 'NV',
      region: region || '',
      country: country || '',
      varietal: varietal || '',
      grape: varietal || '',
      glassPrice: glass,
      bottlePrice: bottle || 0,
      price: glass,
      byTheGlass: true,
      scaliniOnly: true,
      kind: 'wine',
      category: 'wine-glass',
      station: 'Bar',
      allergens: ['Sulfites'],
      desc: [producer, vintage && vintage !== 'NV' ? vintage : '', region, varietal].filter(Boolean).join(' · ')
    };
  }

  var winesByGlass = [
    wg('btg_spark_beck', 'Sparkling', 'Graham Beck Brut', 'Graham Beck', 'NV', 'Western Cape', 'South Africa', 'Chardonnay / Pinot Noir', 16, 63),
    wg('btg_spark_roederer', 'Sparkling', 'Roederer Estate Brut', 'Roederer Estate', 'NV', 'Anderson Valley', 'USA', 'Chardonnay / Pinot Noir', 20, 76),
    wg('btg_spark_lanson', 'Sparkling', 'Lanson Le Black Réserve Brut NV', 'Lanson', 'NV', 'Champagne', 'France', 'Pinot Noir / Chardonnay / Pinot Meunier', 28, 108),
    wg('btg_white_selvamica', 'White Wine', 'Pinot Grigio “Selvamica” Elena Walch 2022', 'Elena Walch', '2022', 'Alto Adige / Südtirol', 'Italy', 'Pinot Grigio', 16, 63),
    wg('btg_white_lugana', 'White Wine', 'Trebbiano di Lugana, Cà dei Frati 2022', 'Cà dei Frati', '2022', 'Lugana', 'Italy', 'Turbiana (Trebbiano di Lugana)', 19, 75),
    wg('btg_white_arneis', 'White Wine', 'Roero Arneis “Sibilla” Vietti 2021', 'Vietti', '2021', 'Roero, Piemonte', 'Italy', 'Arneis', 20, 78),
    wg('btg_white_hartford', 'White Wine', 'Chardonnay “Four Hearts” Russian River Valley, Hartford Court 2021', 'Hartford Court', '2021', 'Russian River Valley', 'USA', 'Chardonnay', 40, 160),
    wg('btg_red_cora', 'Red Wine', 'Montepulciano d’Abruzzo “Umani Ronchi” 2020', 'Umani Ronchi', '2020', 'Abruzzo', 'Italy', 'Montepulciano', 18, 70),
    wg('btg_red_masi', 'Red Wine', 'Valpolicella Classico Superiore, Masi “Brolo Campofiorin Oro” 2019', 'Masi', '2019', 'Valpolicella, Veneto', 'Italy', 'Corvina blend', 19, 75),
    wg('btg_red_plumpjack', 'Red Wine', 'Merlot, Plumpjack 2019', 'Plumpjack', '2019', 'Napa Valley', 'USA', 'Merlot', 36, 130),
    wg('btg_lib_gunderloch', 'Library Selection', 'Gunderloch Riesling Spätlese, Rothenberg Nackenheim 2015', 'Gunderloch', '2015', 'Nackenheim, Rheinhessen', 'Germany', 'Riesling', 22, 85),
    wg('btg_lib_sudtirol', 'Library Selection', 'Südtirol Blauburgunder Riserva Gottfried 2019', 'Gottfried', '2019', 'Südtirol', 'Italy', 'Blauburgunder (Pinot Nero)', 28, 110),
    wg('btg_lib_macie', 'Library Selection', 'Chianti Classico Riserva, Toscolo “Tenuta” Rocca delle Macie 2018', 'Rocca delle Macie', '2018', 'Chianti Classico, Tuscany', 'Italy', 'Sangiovese', 19, 75),
    wg('btg_lib_vignot', 'Library Selection', 'Nebbiolo del Monferrato Superiore “Vignot” Cascina Valpane 2016', 'Cascina Valpane', '2016', 'Monferrato, Piemonte', 'Italy', 'Nebbiolo', 32, 120),
    wg('btg_des_spinetta', 'Dessert', 'Moscato d’Asti “Bera” La Spinetta 2021', 'La Spinetta', '2021', 'Asti, Piemonte', 'Italy', 'Moscato Bianco', 12, 45),
    wg('btg_des_vidal', 'Dessert', 'Inniskillin Ice Wine “Vidal Pearl” 2021', 'Inniskillin', '2021', 'Niagara Peninsula', 'Canada', 'Vidal', 35, 120),
    wg('btg_des_riesling', 'Dessert', 'Inniskillin Ice Wine “Riesling” 2021', 'Inniskillin', '2021', 'Niagara Peninsula', 'Canada', 'Riesling', 45, 158),
    wg('btg_des_franc', 'Dessert', 'Inniskillin Ice Wine “Cabernet Franc” 2019', 'Inniskillin', '2019', 'Niagara Peninsula', 'Canada', 'Cabernet Franc', 50, 175),
    wg('btg_port_bin27', 'Port', 'Fonseca Ruby Reserve Bin 27', 'Fonseca', 'NV', 'Porto', 'Portugal', 'Touriga Nacional blend', 12, 42),
    wg('btg_port_cockburn', 'Port', 'Cockburn’s Special Reserve', 'Cockburn’s', 'NV', 'Porto', 'Portugal', 'Touriga Nacional blend', 15, 52),
    wg('btg_port_tawny10', 'Port', 'Fonseca Tawny 10 Years', 'Fonseca', 'NV', 'Porto', 'Portugal', 'Tawny Port blend', 20, 70),
    wg('btg_port_tawny20', 'Port', 'Fonseca Tawny 20 Years', 'Fonseca', 'NV', 'Porto', 'Portugal', 'Tawny Port blend', 25, 88)
  ];

  var wineNotes = {
    btg_spark_beck: 'Graham Beck is a South African house in the Western Cape. This Brut is a traditional-method blend of Chardonnay and Pinot Noir — citrus, green apple, and a clean, dry finish. It is the house sparkler with Scalini’s prix fixe.',
    btg_spark_roederer: 'Roederer Estate is the Anderson Valley, California house of Champagne Louis Roederer. The Brut is Chardonnay and Pinot Noir, aged on lees — orchard fruit, brioche, and a finer mousse than most California sparkling.',
    btg_spark_lanson: 'Lanson is a Champagne house in Reims. Le Black Réserve is a Pinot-led NV Brut: red fruit, lemon zest, and a dry, chalky finish typical of the house style that skips malolactic fermentation.',
    btg_white_selvamica: 'Elena Walch farms in Alto Adige — Südtirol, Italy’s German-speaking alpine north. Selvamica is Pinot Grigio from 2022: pear, white flowers, and a stony finish, drier and more precise than bulk Pinot Grigio.',
    btg_white_lugana: 'Cà dei Frati sits on Lake Garda. Lugana is made from Turbiana (Trebbiano di Lugana). The 2022 is almond, citrus, and a saline edge from the lake — a classic Italian white with fish and sole.',
    btg_white_arneis: 'Vietti is a Barolo family who also bottle Roero Arneis. Sibilla 2021 is the white grape of Roero in Piemonte: pear, hazelnut, and a bitter-almond finish. Arneis means “little rascal” — once nearly extinct, now the region’s signature white.',
    btg_white_hartford: 'Hartford Court farms the Russian River Valley in Sonoma. Four Hearts 2021 is a richer California Chardonnay — ripe apple, citrus, and oak spice. Pair with scallops, salmon, or anything with truffle.',
    btg_red_cora: 'Umani Ronchi is a Marche and Abruzzo house. Montepulciano d’Abruzzo 2020 is the grape, not the Tuscan town: dark cherry, soft tannin, and a warm Mediterranean finish. Everyday Italian red with pasta and chicken.',
    btg_red_masi: 'Masi’s Brolo Campofiorin Oro is a Valpolicella Classico Superiore from the Veneto. Corvina and related grapes are partly dried (appassimento) for cherry, spice, and a plush texture — not as heavy as Amarone.',
    btg_red_plumpjack: 'Plumpjack is a Napa Valley estate. The 2019 Merlot is ripe plum, cocoa, and fine tannin. A California library pour for steak, lamb, and Giambotta.',
    btg_lib_gunderloch: 'Gunderloch’s Rothenberg vineyard in Nackenheim, Rheinhessen, is a red-slate slope on the Rhine. The 2015 Riesling Spätlese is late-harvest: lime, peach, honey, and bright acidity. A library white with duck or cheese.',
    btg_lib_sudtirol: 'Südtirol is South Tyrol, the alpine Italian province that also speaks German. Blauburgunder is Pinot Nero (Pinot Noir). Gottfried’s 2019 Riserva is pale, cherry-scented, and earthy — cooler-climate Pinot from the mountains, not Burgundy.',
    btg_lib_macie: 'Rocca delle Macie farms Chianti Classico in Tuscany. Toscolo Tenuta Riserva 2018 is Sangiovese: sour cherry, leather, and savory herbs. Riserva means extra barrel time. Pair with pork, lamb, or the Bolognese.',
    btg_lib_vignot: 'Cascina Valpane is in Monferrato, Piemonte. Vignot 2016 is Nebbiolo — the grape of Barolo — grown here as Nebbiolo del Monferrato Superiore: tar, rose, and firm tannin with six extra years of age in the library.',
    btg_des_spinetta: 'La Spinetta’s Bera is Moscato d’Asti from Piemonte, 2021. Moscato Bianco, lightly sparkling and low alcohol, smells of peach, orange blossom, and honey. A dessert glass, not a dry table white.',
    btg_des_vidal: 'Inniskillin, Niagara Peninsula, Canada. Vidal Pearl 2021 is ice wine: grapes frozen on the vine, pressed for a tiny yield of honeyed apricot nectar. Vidal is a hardy hybrid used for Canadian ice wine. This is a sweet dessert glass.',
    btg_des_riesling: 'Inniskillin Riesling Ice Wine 2021, Niagara. Frozen Riesling grapes give lime, pineapple, and petrol notes with electric acidity so the sweetness does not cloy. A glass of Canadian ice wine with chocolate or cheese.',
    btg_des_franc: 'Inniskillin Cabernet Franc Ice Wine 2019, Niagara. Red ice wine is rare: frozen Cabernet Franc yields strawberry, raspberry, and tea-leaf notes with residual sugar. Dessert glass only.',
    btg_port_bin27: 'Fonseca Bin 27 is a Ruby Reserve Port from the Douro Valley, Portugal. Touriga Nacional and related grapes, bottled young for ripe blackberry and chocolate. Served slightly cool, after dinner.',
    btg_port_cockburn: 'Cockburn’s Special Reserve is a Portuguese Port house style: rich, sweet, and spicy, meant as a ready-to-drink reserve rather than a vintage that needs decades.',
    btg_port_tawny10: 'Fonseca 10 Year Tawny is aged in wood until nutty, caramel, and dried-fig. Serve slightly chilled with cheese or chocolate. Porto, Portugal.',
    btg_port_tawny20: 'Fonseca 20 Year Tawny is longer in cask: walnut, orange peel, and toffee, silkier than the 10 Year. A library Port glass from the Douro.'
  };

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
    'celery root': 'Celeriac, a mild celery-flavored root, pureed under the scallops.',
    sunchoke: 'Sunchokes (Jerusalem artichokes) are roasted nutty tubers with the scallops Bianco-Nero.',
    prosecco: 'Prosecco in the scallop jus — a sparkling Italian white reduced with black truffle.',
    thyme: 'Thyme is the herb braised with the Ecuadorian shrimp.',
    caponata: 'Winter caponata is a Sicilian sweet-sour stew of eggplant, tomato, and olive under the Genovese sole.',
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
    wine: 'When listed on a dish, this is wine reduced into that dish’s sauce — not a glass of wine from the list.',
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
      aboutWine: 'About this wine',
      fromTheKitchen: 'From the kitchen',
      tapForStory: 'Tap to add this dish',
      tapForWine: 'Tap to add this glass',
      aiExplain: 'More about this dish',
      aiExplainWine: 'More about this wine',
      learnMore: 'Learn more',
      learnMoreWine: 'Learn more about this vintage',
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
      bottlePrice: 'bottle',
      scaliniGlass: 'Scalini Fedeli — by the glass',
      wineMetaVintage: 'Vintage',
      wineMetaRegion: 'Region',
      wineMetaCountry: 'Country',
      wineMetaGrape: 'Grape'
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
      aboutWine: 'Sobre este vino',
      fromTheKitchen: 'Desde la cocina',
      tapForStory: 'Toque para añadir este plato',
      tapForWine: 'Toque para añadir esta copa',
      aiExplain: 'Más sobre este plato',
      aiExplainWine: 'Más sobre este vino',
      learnMore: 'Saber más',
      learnMoreWine: 'Saber más de esta añada',
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
      bottlePrice: 'botella',
      scaliniGlass: 'Scalini Fedeli — por copa',
      wineMetaVintage: 'Añada',
      wineMetaRegion: 'Región',
      wineMetaCountry: 'País',
      wineMetaGrape: 'Uva'
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
      aboutWine: 'À propos de ce vin',
      fromTheKitchen: 'De la cuisine',
      tapForStory: 'Touchez pour ajouter ce plat',
      tapForWine: 'Touchez pour ajouter ce verre',
      aiExplain: 'En savoir plus sur ce plat',
      aiExplainWine: 'En savoir plus sur ce vin',
      learnMore: 'En savoir plus',
      learnMoreWine: 'En savoir plus sur ce millésime',
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
      bottlePrice: 'bouteille',
      scaliniGlass: 'Scalini Fedeli — au verre',
      wineMetaVintage: 'Millésime',
      wineMetaRegion: 'Région',
      wineMetaCountry: 'Pays',
      wineMetaGrape: 'Cépage'
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
      aboutWine: '关于这款酒',
      fromTheKitchen: '厨房故事',
      tapForStory: '点击加入这道菜',
      tapForWine: '点击将这杯酒加入订单',
      aiExplain: '了解这道菜',
      aiExplainWine: '了解这款酒',
      learnMore: '了解更多',
      learnMoreWine: '了解这一年份',
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
      bottlePrice: '瓶',
      scaliniGlass: 'Scalini Fedeli — 杯装',
      wineMetaVintage: '年份',
      wineMetaRegion: '产区',
      wineMetaCountry: '国家',
      wineMetaGrape: '葡萄品种'
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
    wineNotes: wineNotes,
    ingredientNotes: ingredientNotes,
    ui: ui,
    mergeMenu: mergeMenu,
    mergeList: mergeList
  };
})(typeof window !== 'undefined' ? window : this);
