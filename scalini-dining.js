/* Scalini Fedeli prix fixe $89 + Regional Tasting $128.
   Shared by BOH, POS, and the iPad menu. Photo URLs stay empty for chef upload. */
(function (root) {
  var GM = 'Cold / Garde Manger';
  var SA = 'Sauté';
  var GR = 'Grill';
  var FR = 'Fry';
  var PA = 'Pastry';

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
      pairing: extra.pairing || '',
      order: extra.order || 0,
      allergens: extra.allergens || [],
      dietary: extra.dietary || [],
      chooseCount: extra.chooseCount || 0,
      scoops: extra.scoops || null,
      cookNote: extra.cookNote || '',
      cookTime: extra.cookTime || 0,
      i18n: extra.i18n || {}
    };
  }

  var GELATO_SCOOPS = [
    { id: 'scoop_apple', name: 'Green apple', allergens: [] },
    { id: 'scoop_lemon', name: 'Lemon', allergens: [] },
    { id: 'scoop_vanilla', name: 'Vanilla', allergens: ['Dairy'] },
    { id: 'scoop_caramel', name: 'Caramel', allergens: ['Dairy'] },
    { id: 'scoop_hazelnut', name: 'Hazelnut', allergens: ['Tree Nut', 'Dairy'] }
  ];

  var dishes = [
    d('sf_w_salmon', 'Smoked salmon', 'Lemon-chive crema over brioche toast', 'Welcome', GM, {
      order: 1, allergens: ['Fish', 'Gluten', 'Dairy'],
      i18n: {
        es: { name: 'Salmón ahumado', desc: 'Crema de limón y cebollino sobre tostada de brioche' },
        fr: { name: 'Saumon fumé', desc: 'Crème citron-ciboulette sur toast de brioche' },
        zh: { name: '烟熏三文鱼', desc: '柠檬香葱奶油酱，配法式奶油吐司' }
      }
    }),
    d('sf_w_zucchini', 'Zucchini Milanese', 'Tomato-basil sauce, chili oil', 'Welcome', FR, {
      order: 2, allergens: ['Gluten', 'Egg'],
      i18n: {
        es: { name: 'Calabacín a la milanesa', desc: 'Salsa de tomate y albahaca, aceite de chile' },
        fr: { name: 'Courgette milanaise', desc: 'Sauce tomate-basilic, huile de piment' },
        zh: { name: '米兰式西葫芦', desc: '番茄罗勒酱，辣椒油' }
      }
    }),
    d('sf_w_shrimp', 'Shrimp in sherry-mustard sauce', 'Pickled Tropea onion', 'Welcome', SA, {
      order: 3, allergens: ['Shellfish'],
      i18n: {
        es: { name: 'Gambas en salsa de jerez y mostaza', desc: 'Cebolla Tropea encurtida' },
        fr: { name: 'Crevettes sauce xérès-moutarde', desc: 'Oignon Tropea mariné' },
        zh: { name: '雪利酒芥末酱大虾', desc: '腌制特罗佩亚洋葱' }
      }
    }),

    d('sf_p_carpaccio', 'Warm scallop carpaccio', 'Olive oil & citrus emulsion, Ligurian olives, roasted pepper and Calabrian chili oil', 'Primi', GM, {
      order: 10, allergens: ['Shellfish'],
      i18n: {
        es: { name: 'Carpaccio tibio de vieiras', desc: 'Emulsión de aceite de oliva y cítricos, aceitunas ligures, pimiento asado y aceite de chile calabrés' },
        fr: { name: 'Carpaccio tiède de Saint-Jacques', desc: 'Émulsion agrumes et huile d’olive, olives ligures, poivron rôti et huile de piment calabrais' },
        zh: { name: '热扇贝生食', desc: '橄榄油与柑橘乳化酱、利古里亚橄榄、烤彩椒、卡拉布里亚辣椒油' }
      }
    }),
    d('sf_p_rosso', '“Rosso – Bianco”', 'Trevisano radicchio, roasted beet, and goat cheese with a blood orange dressing, toasted pignoli nuts', 'Primi', GM, {
      order: 11, allergens: ['Dairy', 'Tree Nut'],
      i18n: {
        es: { name: '“Rosso – Bianco”', desc: 'Radicchio Trevisano, remolacha asada y queso de cabra con vinagreta de naranja sanguina y piñones tostados' },
        fr: { name: '« Rosso – Bianco »', desc: 'Radicchio de Trévise, betterave rôtie et chèvre, vinaigrette à l’orange sanguine, pignons torréfiés' },
        zh: { name: '红与白', desc: '特雷维索菊苣、烤甜菜、山羊奶酪、血橙酱、松子' }
      }
    }),
    d('sf_p_arugula', 'Arugula and buffalo mozzarella salad', 'Prosciutto di Parma, tomatoes and toasted pistachios with aged balsamic and extra virgin olive oil', 'Primi', GM, {
      order: 12, allergens: ['Dairy', 'Tree Nut'],
      i18n: {
        es: { name: 'Ensalada de rúcula y mozzarella de búfala', desc: 'Prosciutto di Parma, tomates y pistachos tostados con balsámico añejo y aceite de oliva virgen extra' },
        fr: { name: 'Salade de roquette et mozzarella de bufflonne', desc: 'Prosciutto di Parma, tomates et pistaches grillées, vinaigre balsamique vieilli et huile d’olive extra vierge' },
        zh: { name: '芝麻菜与水牛乳鲜奶酪沙拉', desc: '帕尔玛火腿、番茄、开心果、陈年香醋与特级初榨橄榄油' }
      }
    }),
    d('sf_p_lobster', 'Ecuadorian shrimp and ½ Maine lobster tail', 'Spicy garlic, parsley and Vermentino sauce with Calabrian chili over capelli d’angelo', 'Primi', SA, {
      order: 13, upcharge: 8, allergens: ['Shellfish', 'Gluten', 'Fish'],
      i18n: {
        es: { name: 'Gambas ecuatorianas y media cola de langosta de Maine', desc: 'Salsa picante de ajo, perejil y Vermentino con chile calabrés sobre capelli d’angelo' },
        fr: { name: 'Crevettes d’Équateur et demi-queue de homard du Maine', desc: 'Sauce pimentée à l’ail, persil et Vermentino, piment calabrais, capelli d’angelo' },
        zh: { name: '厄瓜多尔大虾与缅因龙虾半尾', desc: '大蒜、欧芹、维门蒂诺辣味酱、卡拉布里亚辣椒、天使细面' }
      }
    }),
    d('sf_p_raviolo', 'Soft egg yolk raviolo', 'Truffle butter sauce with grated black truffle', 'Primi', SA, {
      order: 14, upcharge: 8, allergens: ['Gluten', 'Egg', 'Dairy'],
      i18n: {
        es: { name: 'Raviolo de yema blanda', desc: 'Mantequilla de trufa con trufa negra rallada' },
        fr: { name: 'Raviolo au jaune d’œuf coulant', desc: 'Beurre à la truffe et truffe noire râpée' },
        zh: { name: '半熟蛋黄馄饨', desc: '黑松露黄油酱，黑松露刨片' }
      }
    }),
    d('sf_p_porcini', 'Porcini ravioli', 'Wild mushroom and black truffle sauce', 'Primi', SA, {
      order: 15, allergens: ['Gluten', 'Dairy'],
      i18n: {
        es: { name: 'Ravioli de porcini', desc: 'Salsa de setas silvestres y trufa negra' },
        fr: { name: 'Ravioli aux cèpes', desc: 'Sauce aux champignons sauvages et truffe noire' },
        zh: { name: '牛肝菌馄饨', desc: '野生蘑菇与黑松露酱' }
      }
    }),
    d('sf_p_agnolotti', 'Butternut squash agnolotti', 'Sage butter, crushed amaretti and buffalo mozzarella', 'Primi', SA, {
      order: 16, allergens: ['Gluten', 'Dairy', 'Tree Nut', 'Egg'],
      i18n: {
        es: { name: 'Agnolotti de calabaza', desc: 'Mantequilla de salvia, amaretti triturado y mozzarella de búfala' },
        fr: { name: 'Agnolotti au potimarron', desc: 'Beurre sauge, amaretti concassés et mozzarella de bufflonne' },
        zh: { name: '南瓜馅小馄饨', desc: '鼠尾草黄油、碎杏仁饼干、水牛乳鲜奶酪' }
      }
    }),
    d('sf_p_gnocchi', 'Ricotta gnocchi', 'Light tomato & basil sauce, arugula and goat cheese', 'Primi', SA, {
      order: 17, allergens: ['Gluten', 'Dairy', 'Egg'],
      i18n: {
        es: { name: 'Ñoquis de ricotta', desc: 'Salsa ligera de tomate y albahaca, rúcula y queso de cabra' },
        fr: { name: 'Gnocchi de ricotta', desc: 'Sauce légère tomate-basilic, roquette et chèvre' },
        zh: { name: '乳清奶酪团子', desc: '清淡番茄罗勒酱、芝麻菜与山羊奶酪' }
      }
    }),
    d('sf_p_alice', 'Bucatini “Alice”', 'Sicilian-style sauce with anchovies, garlic, raisins and pignoli nuts, finished with bread crumbs', 'Primi', SA, {
      order: 18, allergens: ['Gluten', 'Fish', 'Tree Nut'],
      i18n: {
        es: { name: 'Bucatini “Alice”', desc: 'Salsa siciliana con anchoas, ajo, pasas y piñones, pan rallado' },
        fr: { name: 'Bucatini « Alice »', desc: 'Sauce sicilienne aux anchois, ail, raisins secs et pignons, chapelure' },
        zh: { name: '粗通心粉「阿利切」', desc: '西西里风味：凤尾鱼、大蒜、葡萄干、松子、面包糠' }
      }
    }),
    d('sf_p_arrabbiata', 'Spaghettini “Arrabbiata”', 'Spicy tomato and basil sauce with olives, mushroom and anchovies', 'Primi', SA, {
      order: 19, allergens: ['Gluten', 'Fish'],
      i18n: {
        es: { name: 'Espaguetini “Arrabbiata”', desc: 'Salsa picante de tomate y albahaca con aceitunas, champiñones y anchoas' },
        fr: { name: 'Spaghettini « Arrabbiata »', desc: 'Sauce tomate-basilic pimentée, olives, champignons et anchois' },
        zh: { name: '细意面「阿拉比亚塔」', desc: '辣味番茄罗勒、橄榄、蘑菇、凤尾鱼' }
      }
    }),
    d('sf_p_bolognese', 'Tagliatelle “Bolognese”', 'Traditional meat sauce with crispy sage & whipped ricotta', 'Primi', SA, {
      order: 20, allergens: ['Gluten', 'Dairy'],
      i18n: {
        es: { name: 'Tagliatelle “Boloñesa”', desc: 'Ragú tradicional con salvia crujiente y ricotta montada' },
        fr: { name: 'Tagliatelle « Bolognese »', desc: 'Ragù traditionnel, sauge croustillante et ricotta fouettée' },
        zh: { name: '宽带面「博洛尼亚」', desc: '传统肉酱、酥鼠尾草与打发乳清奶酪' }
      }
    }),
    d('sf_p_pappardelle', 'Pappardelle', 'Braised veal and pork shank ragù with a hint of orange, mascarpone', 'Primi', SA, {
      order: 21, allergens: ['Gluten', 'Dairy'],
      i18n: {
        es: { name: 'Pappardelle', desc: 'Ragú de jarrete de ternera y cerdo, toque de naranja y mascarpone' },
        fr: { name: 'Pappardelle', desc: 'Ragù de jarret de veau et de porc, zeste d’orange, mascarpone' },
        zh: { name: '宽面', desc: '小牛与猪腱炖肉、橙香、马斯卡彭' }
      }
    }),
    d('sf_p_linguini', 'Linguini in spicy pescatore sauce', 'Shrimp and mushrooms', 'Primi', SA, {
      order: 22, allergens: ['Gluten', 'Shellfish'],
      i18n: {
        es: { name: 'Linguini en salsa pescatore picante', desc: 'Gambas y champiñones' },
        fr: { name: 'Linguine sauce pescatore pimentée', desc: 'Crevettes et champignons' },
        zh: { name: '扁意面 辣味渔夫', desc: '大虾与蘑菇' }
      }
    }),
    d('sf_p_stracci', 'Hand-made stracci pasta', 'Sausage and porcini mushrooms in a light tomato and basil sauce, grated pecorino', 'Primi', SA, {
      order: 23, allergens: ['Gluten', 'Dairy'],
      i18n: {
        es: { name: 'Pasta stracci hecha a mano', desc: 'Salchicha y porcini en salsa ligera de tomate y albahaca, pecorino rallado' },
        fr: { name: 'Stracci faits maison', desc: 'Saucisse et cèpes, sauce légère tomate-basilic, pecorino râpé' },
        zh: { name: '手擀扭纹面', desc: '香肠与牛肝菌、清淡番茄罗勒酱、佩科里诺奶酪' }
      }
    }),
    d('sf_p_fusilli', 'Calabrian fusilli alla vodka', 'Hand-made twisted pasta in a tomato cream sauce with chili pepper and vodka', 'Primi', SA, {
      order: 24, allergens: ['Gluten', 'Dairy'],
      i18n: {
        es: { name: 'Fusilli calabreses alla vodka', desc: 'Pasta trenzada hecha a mano en salsa cremosa de tomate con chile y vodka' },
        fr: { name: 'Fusilli calabrais à la vodka', desc: 'Pâtes torsadées maison, crème tomate, piment et vodka' },
        zh: { name: '卡拉布里亚螺旋面 伏特加奶油', desc: '手擀螺旋面，辣椒与伏特加番茄奶油酱' }
      }
    }),

    d('sf_m_sole', 'Filet of sole “Livornese”', 'Olives and anchovy in a light saffron tomato broth over braised fennel', 'Piatti Principale', SA, {
      order: 30, allergens: ['Fish'],
      i18n: {
        es: { name: 'Filete de lenguado “Livornese”', desc: 'Aceitunas y anchoa en caldo ligero de tomate y azafrán sobre hinojo braseado' },
        fr: { name: 'Filet de sole « Livornese »', desc: 'Olives et anchois, bouillon léger tomate-safran, fenouil braisé' },
        zh: { name: '龙利鱼柳「里窝那」', desc: '橄榄与凤尾鱼、藏红花番茄高汤、烩茴香' }
      }
    }),
    d('sf_m_genovese', 'Toasted pignoli crusted salmon “Genovese”', 'White wine sauce finished with fresh basil, over pecorino and zucchini puree', 'Piatti Principale', SA, {
      order: 31, allergens: ['Fish', 'Tree Nut', 'Dairy'],
      i18n: {
        es: { name: 'Salmón “Genovese” con costra de piñones', desc: 'Salsa de vino blanco y albahaca, puré de pecorino y calabacín' },
        fr: { name: 'Saumon « Genovese » en croûte de pignons', desc: 'Sauce vin blanc et basilic, purée de pecorino et courgette' },
        zh: { name: '松子脆皮三文鱼「热那亚」', desc: '白葡萄酒酱、罗勒、佩科里诺与西葫芦泥' }
      }
    }),
    d('sf_m_scallops', 'Dayboat sea scallops “Saltimbocca”', 'Prosciutto, sage and white wine, braised artichoke', 'Piatti Principale', SA, {
      order: 32, allergens: ['Shellfish'],
      i18n: {
        es: { name: 'Vieiras “Saltimbocca”', desc: 'Prosciutto, salvia y vino blanco, alcachofa braseada' },
        fr: { name: 'Saint-Jacques « Saltimbocca »', desc: 'Prosciutto, sauge et vin blanc, artichaut braisé' },
        zh: { name: '扇贝「跳入口中」', desc: '火腿、鼠尾草、白葡萄酒、烩洋蓟' }
      }
    }),
    d('sf_m_forestiere', 'Filet of Faroe Island salmon “Forestiere”', 'Wild mushroom & black truffle crust over spinach and roasted beets', 'Piatti Principale', SA, {
      order: 33, allergens: ['Fish', 'Dairy'],
      i18n: {
        es: { name: 'Salmón de las Islas Feroe “Forestiere”', desc: 'Costra de setas silvestres y trufa negra, espinacas y remolacha asada' },
        fr: { name: 'Saumon des Féroé « Forestiere »', desc: 'Croûte champignons sauvages et truffe noire, épinards et betteraves rôties' },
        zh: { name: '法罗群岛三文鱼「林间」', desc: '野生蘑菇与黑松露脆皮、菠菜与烤甜菜' }
      }
    }),
    d('sf_m_zafferano', 'Butter and thyme braised Ecuadorian shrimp “Zafferano”', 'Roasted butternut squash and shallot puree, light orange-scented saffron sauce', 'Piatti Principale', SA, {
      order: 34, allergens: ['Shellfish', 'Dairy'],
      i18n: {
        es: { name: 'Gambas ecuatorianas “Zafferano”', desc: 'Puré de calabaza y chalota, salsa ligera de azafrán al aroma de naranja' },
        fr: { name: 'Crevettes d’Équateur « Zafferano »', desc: 'Purée de potimarron et échalote, sauce safran légèrement parfumée à l’orange' },
        zh: { name: '厄瓜多尔大虾「藏红花」', desc: '南瓜与青葱泥、橙香藏红花酱' }
      }
    }),
    d('sf_m_pork', '14 oz. roasted pork chop “San Domenico”', 'Mascarpone-vodka sauce with chives', 'Piatti Principale', GR, {
      order: 35, allergens: ['Dairy'],
      i18n: {
        es: { name: 'Chuleta de cerdo 14 oz. “San Domenico”', desc: 'Salsa de mascarpone y vodka con cebollino' },
        fr: { name: 'Côte de porc 14 oz « San Domenico »', desc: 'Sauce mascarpone-vodka à la ciboulette' },
        zh: { name: '14盎司猪排「圣多梅尼科」', desc: '马斯卡彭伏特加酱、香葱' }
      }
    }),
    d('sf_m_chicken', 'Boneless breast of chicken strips “Scarpariello”', 'Sautéed with mushrooms, sausage and crispy potatoes', 'Piatti Principale', SA, {
      order: 36, allergens: [],
      i18n: {
        es: { name: 'Tiras de pechuga de pollo “Scarpariello”', desc: 'Salteadas con champiñones, salchicha y patatas crujientes' },
        fr: { name: 'Lanières de poulet « Scarpariello »', desc: 'Sautées aux champignons, saucisse et pommes de terre croustillantes' },
        zh: { name: '鸡胸「鞋匠」', desc: '蘑菇、香肠、酥土豆炒' }
      }
    }),
    d('sf_m_veal_val', 'Veal scallopini “Valdostano”', 'Prosciutto di Parma and fontina in a wild mushroom–Madeira wine sauce', 'Piatti Principale', SA, {
      order: 37, allergens: ['Dairy'],
      i18n: {
        es: { name: 'Escalope de ternera “Valdostano”', desc: 'Prosciutto di Parma y fontina en salsa de setas y Madeira' },
        fr: { name: 'Escalope de veau « Valdostano »', desc: 'Prosciutto di Parma et fontina, sauce champignons sauvages au madère' },
        zh: { name: '小牛肉片「瓦尔多斯塔诺」', desc: '帕尔玛火腿与冯蒂纳奶酪、蘑菇马德拉酱' }
      }
    }),
    d('sf_m_duck', 'Slow roasted Long Island duck breast “Modena”', 'Braised endive, port sauce with Amarena cherries from Bologna', 'Piatti Principale', GR, {
      order: 38, allergens: [],
      i18n: {
        es: { name: 'Pechuga de pato de Long Island “Modena”', desc: 'Endivia braseada, salsa de Oporto con cerezas Amarena de Bolonia' },
        fr: { name: 'Magret de canard de Long Island « Modena »', desc: 'Endive braisée, sauce porto aux cerises Amarena de Bologne' },
        zh: { name: '长岛鸭胸「摩德纳」', desc: '烩菊苣、博洛尼亚黑樱桃波特酒酱' }
      }
    }),
    d('sf_m_saggio', '14 oz. roasted rib veal chop “Saggio”', 'Crispy shallots and sage, Dijon mustard and porcini mushroom sauce', 'Piatti Principale', GR, {
      order: 39, upcharge: 25, allergens: [],
      i18n: {
        es: { name: 'Chuletón de ternera 14 oz. “Saggio”', desc: 'Chalotas crujientes y salvia, salsa de mostaza Dijon y porcini' },
        fr: { name: 'Côte de veau 14 oz « Saggio »', desc: 'Échalotes croustillantes et sauge, sauce moutarde de Dijon et cèpes' },
        zh: { name: '14盎司小牛肋排「萨焦」', desc: '酥青葱与鼠尾草、第戎芥末牛肝菌酱' }
      }
    }),
    d('sf_m_giambotta', 'Split 10 oz. filet mignon “Giambotta”', 'Spicy wine sauce with mushrooms, onions and hot & sweet peppers', 'Piatti Principale', GR, {
      order: 40, upcharge: 15, allergens: [],
      story: 'This 10 oz. filet mignon is from Dutton Ranch in South Carolina. The Dutton family has raised cattle on the same land for generations — grass-fed, finished with care, and sent north so we can serve a steak that still tastes like the pasture it came from. Giambotta is the Neapolitan “little mix”: mushrooms, onions, and hot and sweet peppers in a spicy wine sauce.',
      i18n: {
        es: { name: 'Filet mignon 10 oz. “Giambotta”', desc: 'Salsa de vino picante con champiñones, cebolla y pimientos dulces y picantes' },
        fr: { name: 'Filet mignon 10 oz « Giambotta »', desc: 'Sauce au vin pimentée, champignons, oignons et poivrons doux et forts' },
        zh: { name: '10盎司菲力牛排「江博塔」', desc: '蘑菇、洋葱、甜椒与辣椒的辣味葡萄酒酱' }
      }
    }),

    d('sf_e_sorbet', 'Coconut–lime sorbet with rum glazed pineapple', 'Entremets served to every guest before dessert. Contains rum and nuts on the plate — check allergies before firing.', 'Entremets', PA, {
      order: 50, allergens: ['Tree Nut'], cookNote: 'Allergy check: nuts and rum. Do not fire if the guest has a nut allergy unless confirmed.',
      i18n: {
        es: { name: 'Sorbete de coco y lima con piña al ron', desc: 'Entremets para todos antes del postre. Contiene ron y frutos secos — verificar alergias.' },
        fr: { name: 'Sorbet coco-citron vert, ananas au rhum', desc: 'Entremets servi à tous avant le dessert. Rhum et fruits à coque — vérifier les allergies.' },
        zh: { name: '椰奶青柠雪芭配朗姆酒菠萝', desc: '甜品前的过渡小食。含朗姆酒与坚果，请确认过敏。' }
      }
    }),

    d('sf_d_napoleon', 'Napoleon of chocolate painted fillo', 'Layered with chocolate-espresso mousse, bitter chocolate crumbs and praline cream', 'Dolce', PA, {
      order: 60, allergens: ['Gluten', 'Dairy', 'Egg', 'Tree Nut'],
      i18n: {
        es: { name: 'Napoleón de chocolate sobre fillo', desc: 'Mousse de chocolate y espresso, migas de chocolate amargo y crema praliné' },
        fr: { name: 'Napoléon au chocolat sur filo', desc: 'Mousse chocolat-espresso, éclats de chocolat amer et crème praliné' },
        zh: { name: '巧克力千层酥（菲罗饼皮）', desc: '巧克力浓缩咖啡慕斯、苦巧克力碎、果仁糖奶油' }
      }
    }),
    d('sf_d_cake', 'Warm flourless chocolate cake', 'Fleur de sel, pistachio gelato and Amarena cherries from Emilia Romagna', 'Dolce', PA, {
      order: 61, allergens: ['Dairy', 'Egg', 'Tree Nut'],
      i18n: {
        es: { name: 'Pastel de chocolate sin harina, caliente', desc: 'Flor de sal, helado de pistacho y cerezas Amarena de Emilia-Romaña' },
        fr: { name: 'Moelleux au chocolat sans farine', desc: 'Fleur de sel, glace pistache et cerises Amarena d’Émilie-Romagne' },
        zh: { name: '热熔无粉巧克力蛋糕', desc: '海盐花、开心果冰淇淋、艾米利亚－罗马涅黑樱桃' }
      }
    }),
    d('sf_d_souffle', 'Flourless bittersweet chocolate soufflé', 'Allow 12 minutes', 'Dolce', PA, {
      order: 62, upcharge: 5, allergens: ['Dairy', 'Egg'], cookTime: 12, cookNote: 'Allow 12 minutes',
      i18n: {
        es: { name: 'Soufflé de chocolate amargo sin harina', desc: 'Requiere 12 minutos' },
        fr: { name: 'Soufflé au chocolat amer sans farine', desc: 'Prévoir 12 minutes' },
        zh: { name: '无粉苦巧克力舒芙蕾', desc: '需等候约12分钟' }
      }
    }),
    d('sf_d_tart', 'Chocolate–blood orange–caramel tart', 'Toasted hazelnuts and whipped cream', 'Dolce', PA, {
      order: 63, allergens: ['Gluten', 'Dairy', 'Tree Nut', 'Egg'],
      i18n: {
        es: { name: 'Tarta de chocolate, naranja sanguina y caramelo', desc: 'Avellanas tostadas y nata montada' },
        fr: { name: 'Tarte chocolat–orange sanguine–caramel', desc: 'Noisettes torréfiées et crème fouettée' },
        zh: { name: '巧克力、血橙与焦糖挞', desc: '烤榛子与鲜奶油' }
      }
    }),
    d('sf_d_panino', '“Panino”', 'Crisp pistachio and hazelnut caramel wafers layered with hazelnut gelato', 'Dolce', PA, {
      order: 64, allergens: ['Gluten', 'Dairy', 'Tree Nut', 'Egg'],
      i18n: {
        es: { name: '“Panino”', desc: 'Barquillos crujientes de pistacho y avellana con helado de avellana' },
        fr: { name: '« Panino »', desc: 'Gaufrettes caramel pistache-noisette, glace noisette' },
        zh: { name: '「帕尼诺」', desc: '开心果与榛子焦糖威化、榛子冰淇淋' }
      }
    }),
    d('sf_d_pineapple', 'Warm pineapple tart', 'Cold zabaglione and vanilla gelato, crushed amaretti', 'Dolce', PA, {
      order: 65, allergens: ['Gluten', 'Dairy', 'Egg', 'Tree Nut'],
      i18n: {
        es: { name: 'Tarta tibia de piña', desc: 'Zabaione frío, helado de vainilla y amaretti triturado' },
        fr: { name: 'Tarte tiède à l’ananas', desc: 'Zabaione froid, glace vanille et amaretti concassés' },
        zh: { name: '热菠萝挞', desc: '冰镇沙巴雍、香草冰淇淋、碎杏仁饼干' }
      }
    }),
    d('sf_d_banana', 'Thinly sliced bananas', 'Lightly brûléed in a crispy fillo crust with lemon-mascarpone cream', 'Dolce', PA, {
      order: 66, allergens: ['Gluten', 'Dairy', 'Egg'],
      i18n: {
        es: { name: 'Plátano en láminas', desc: 'Ligeramente quemado en fillo crujiente con crema de limón y mascarpone' },
        fr: { name: 'Bananes en fines tranches', desc: 'Légèrement brûlées, croûte de filo, crème citron-mascarpone' },
        zh: { name: '薄片香蕉', desc: '菲罗酥皮、柠檬马斯卡彭奶油、轻焦糖' }
      }
    }),
    d('sf_d_gelato', 'Sorbetti e gelati — three scoops', 'Choose three: green apple, lemon, vanilla, caramel, hazelnut', 'Dolce', PA, {
      order: 67, allergens: ['Dairy', 'Tree Nut'], chooseCount: 3, scoops: GELATO_SCOOPS,
      i18n: {
        es: { name: 'Sorbete y gelato — tres bolas', desc: 'Elija tres: manzana verde, limón, vainilla, caramelo, avellana' },
        fr: { name: 'Sorbets et gelati — trois boules', desc: 'Trois parfums au choix : pomme verte, citron, vanille, caramel, noisette' },
        zh: { name: '雪芭与冰淇淋（三球）', desc: '任选三种：青苹果、柠檬、香草、焦糖、榛子' }
      }
    }),
    d('sf_d_formaggio', 'Formaggio', 'Gorgonzola Dolce (Lombardy, cow), Parmigiano Reggiano (Emilia Romagna, cow), Mozzarella di Bufala (Campania, buffalo)', 'Dolce', GM, {
      order: 68, upcharge: 8, allergens: ['Dairy'],
      i18n: {
        es: { name: 'Formaggio', desc: 'Gorgonzola Dolce (Lombardía, vaca), Parmigiano Reggiano (Emilia-Romaña, vaca), Mozzarella di Bufala (Campania, búfala)' },
        fr: { name: 'Formaggio', desc: 'Gorgonzola Dolce (Lombardie, vache), Parmigiano Reggiano (Émilie-Romagne, vache), Mozzarella di Bufala (Campanie, bufflonne)' },
        zh: { name: '奶酪拼盘', desc: '甜 Gorgonzola（伦巴第，牛乳）、帕尔马干酪（艾米利亚－罗马涅，牛乳）、水牛乳鲜奶酪（坎帕尼亚）' }
      }
    })
  ];

  var courses = [
    { id: 'pfc_welcome', label: 'Welcome', order: 0, mode: 'auto', fireEach: true },
    { id: 'pfc_primi', label: 'Primi', order: 1, mode: 'choose' },
    { id: 'pfc_main', label: 'Piatti Principale', order: 2, mode: 'choose' },
    { id: 'pfc_entremets', label: 'Entremets', order: 3, mode: 'entremets' },
    { id: 'pfc_dolce', label: 'Dolce', order: 4, mode: 'later', fireAfter: 'main' }
  ];

  courses.forEach(function (c) {
    c.options = dishes.filter(function (x) { return x.course === c.label; }).sort(function (a, b) { return a.order - b.order; }).map(function (x) {
      return {
        id: x.id,
        name: x.name,
        desc: x.desc,
        station: x.station,
        upcharge: x.upcharge,
        pairing: x.pairing,
        photoUrl: x.photoUrl,
        story: x.story,
        allergens: x.allergens,
        dietary: x.dietary,
        chooseCount: x.chooseCount,
        scoops: x.scoops,
        cookNote: x.cookNote,
        cookTime: x.cookTime,
        i18n: x.i18n
      };
    });
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
      allergens: extra.allergens || [],
      mode: extra.mode || 'auto',
      pending: !!extra.pending,
      fireAfter: extra.fireAfter || '',
      cookNote: extra.cookNote || '',
      cookTime: extra.cookTime || 0,
      dishId: extra.dishId || '',
      i18n: extra.i18n || {}
    };
  }

  var tastingCourses = [
    tc(1, 'Smoked salmon', 'Lemon-chive crema over brioche toast. Welcome course — fire alone.', GM, {
      allergens: ['Fish', 'Gluten', 'Dairy'], dishId: 'sf_w_salmon',
      i18n: { es: { name: 'Salmón ahumado', desc: 'Crema de limón y cebollino sobre tostada de brioche. Entrada de bienvenida — disparar sola.' }, fr: { name: 'Saumon fumé', desc: 'Crème citron-ciboulette sur brioche. Mise en bouche — envoyer seule.' }, zh: { name: '烟熏三文鱼', desc: '柠檬香葱奶油酱，配奶油吐司。欢迎菜 — 单独出餐。' } }
    }),
    tc(2, 'Zucchini Milanese', 'Tomato-basil sauce, chili oil. Welcome course — fire alone.', FR, {
      allergens: ['Gluten', 'Egg'], dishId: 'sf_w_zucchini',
      i18n: { es: { name: 'Calabacín a la milanesa', desc: 'Salsa de tomate y albahaca, aceite de chile. Bienvenida — disparar sola.' }, fr: { name: 'Courgette milanaise', desc: 'Sauce tomate-basilic, huile de piment. Mise en bouche — envoyer seule.' }, zh: { name: '米兰式西葫芦', desc: '番茄罗勒、辣椒油。欢迎菜 — 单独出餐。' } }
    }),
    tc(3, 'Shrimp in sherry-mustard sauce', 'Pickled Tropea onion. Welcome course — fire alone.', SA, {
      allergens: ['Shellfish'], dishId: 'sf_w_shrimp',
      i18n: { es: { name: 'Gambas en salsa de jerez y mostaza', desc: 'Cebolla Tropea encurtida. Bienvenida — disparar sola.' }, fr: { name: 'Crevettes sauce xérès-moutarde', desc: 'Oignon Tropea mariné. Mise en bouche — envoyer seule.' }, zh: { name: '雪利酒芥末酱大虾', desc: '腌制特罗佩亚洋葱。欢迎菜 — 单独出餐。' } }
    }),
    tc(4, 'Porcini mushroom ravioli — Piemonte', 'Wild mushroom and black truffle sauce', SA, {
      allergens: ['Gluten', 'Dairy'], dishId: 'sf_p_porcini',
      i18n: { es: { name: 'Ravioli de porcini — Piamonte', desc: 'Salsa de setas silvestres y trufa negra' }, fr: { name: 'Ravioli aux cèpes — Piémont', desc: 'Sauce champignons sauvages et truffe noire' }, zh: { name: '牛肝菌馄饨 — 皮埃蒙特', desc: '野生蘑菇与黑松露酱' } }
    }),
    tc(5, 'Butternut agnolotti with sage — Emilia Romagna', 'Sage butter, crushed amaretti and buffalo mozzarella', SA, {
      allergens: ['Gluten', 'Dairy', 'Tree Nut', 'Egg'], dishId: 'sf_p_agnolotti',
      i18n: { es: { name: 'Agnolotti de calabaza con salvia — Emilia-Romaña', desc: 'Mantequilla de salvia, amaretti y mozzarella de búfala' }, fr: { name: 'Agnolotti au potimarron, sauge — Émilie-Romagne', desc: 'Beurre sauge, amaretti et mozzarella de bufflonne' }, zh: { name: '鼠尾草南瓜馄饨 — 艾米利亚－罗马涅', desc: '鼠尾草黄油、杏仁饼干、水牛乳鲜奶酪' } }
    }),
    tc(6, 'Salmon topped with wild mushrooms & black truffle — Umbria', 'Filet of Faroe Island salmon “Forestiere” over spinach and roasted beets', SA, {
      allergens: ['Fish', 'Dairy'], dishId: 'sf_m_forestiere',
      i18n: { es: { name: 'Salmón con setas silvestres y trufa negra — Umbría', desc: 'Salmón de las Islas Feroe “Forestiere”, espinacas y remolacha asada' }, fr: { name: 'Saumon aux champignons et truffe noire — Ombrie', desc: 'Saumon des Féroé « Forestiere », épinards et betteraves rôties' }, zh: { name: '蘑菇黑松露三文鱼 — 翁布里亚', desc: '法罗群岛三文鱼「林间」，菠菜与烤甜菜' } }
    }),
    tc(7, 'Pan roasted filet mignon “Giambotta” — Toscana', 'Spicy wine sauce with mushrooms, onions and hot & sweet peppers. Take dessert after this meat course.', GR, {
      allergens: [], dishId: 'sf_m_giambotta', fireAfter: '',
      i18n: { es: { name: 'Filet mignon “Giambotta” — Toscana', desc: 'Salsa de vino picante con champiñones, cebolla y pimientos. Tomar el postre después de este plato de carne.' }, fr: { name: 'Filet mignon « Giambotta » — Toscane', desc: 'Sauce au vin pimentée, champignons, oignons et poivrons. Prendre le dessert après cette viande.' }, zh: { name: '菲力牛排「江博塔」— 托斯卡纳', desc: '辣味葡萄酒酱。此肉菜之后再点甜品。' } }
    }),
    tc(8, 'Coconut–lime sorbet with rum glazed pineapple', 'Entremets for every guest before dessert. Nuts and rum — check allergies.', PA, {
      allergens: ['Tree Nut'], mode: 'entremets', pending: true, fireAfter: 'meat', dishId: 'sf_e_sorbet',
      cookNote: 'Allergy check: nuts and rum.',
      i18n: { es: { name: 'Sorbete de coco y lima con piña al ron', desc: 'Entremets para todos. Frutos secos y ron — verificar alergias.' }, fr: { name: 'Sorbet coco-citron vert, ananas au rhum', desc: 'Entremets pour tous. Fruits à coque et rhum — vérifier les allergies.' }, zh: { name: '椰奶青柠雪芭', desc: '全桌过渡小食。含坚果与朗姆酒 — 请确认过敏。' } }
    }),
    tc(9, 'Dolce', 'Dessert is included. Take the order after the meat course; guest chooses from the chocolate, seasonal, gelato, or cheese menus.', PA, {
      mode: 'later', pending: true, fireAfter: 'meat',
      i18n: { es: { name: 'Dolce', desc: 'Postre incluido. Tomar el pedido después de la carne; elija chocolate, de temporada, gelato o queso.' }, fr: { name: 'Dolce', desc: 'Dessert inclus. Prendre la commande après la viande : chocolat, saison, gelato ou fromage.' }, zh: { name: '甜品', desc: '含甜品。肉菜之后点单：巧克力、时令、冰淇淋或奶酪。' } }
    })
  ];

  var prixFixe = {
    id: 'pf_scalini_89',
    name: 'Scalini Fedeli',
    subtitle: 'Prix fixe dinner. Welcome bites fire one by one; dessert after the main.',
    desc: 'Three welcome bites are sent automatically, one at a time. Choose a primo and a main. Dessert is taken after the main. Coconut–lime sorbet is served as entremets before dessert.',
    price: 89,
    service: 'dinner',
    mealPeriod: 'dinner',
    active: true,
    createdAt: Date.now(),
    welcomeFireEach: true,
    dessertAfter: 'main',
    i18n: {
      es: {
        subtitle: 'Cena prix fixe. Las bienvenidas se envían una a una; postre después del principal.',
        desc: 'Tres bocados de bienvenida se sirven solos, uno a uno. Elija un primo y un principal. El postre se toma después del principal. El sorbete de coco y lima se sirve como entremets antes del postre.'
      },
      fr: {
        subtitle: 'Dîner prix fixe. Les mises en bouche partent une par une ; dessert après le plat.',
        desc: 'Trois mises en bouche partent automatiquement, une à la fois. Choisissez un primo et un plat. Le dessert se prend après le plat. Le sorbet coco-citron vert est servi en entremets avant le dessert.'
      },
      zh: {
        subtitle: '套餐晚餐。欢迎菜逐道出品。甜品在主菜之后。',
        desc: '三道欢迎菜自动逐道出品。请选择头盘与主菜。甜品在主菜之后。椰奶青柠雪芭是甜品前的过渡小食。'
      }
    },
    courses: courses,
    dishes: dishes,
    courseGroups: courses.map(function (c) {
      var choose = c.mode === 'choose' ? 1 : (c.mode === 'later' ? 1 : 0);
      return { label: c.label, choose: choose, mode: c.mode, fireEach: !!c.fireEach, fireAfter: c.fireAfter || '', options: c.options };
    })
  };

  var tasting = {
    id: 'tm_scalini_128',
    name: 'Scalini Fedeli Regional Tasting',
    subtitle: 'Welcome bites, then Piemonte, Emilia Romagna, Umbria, Toscana',
    price: 128,
    duration: '~3 hours',
    service: 'dinner',
    mealPeriod: 'dinner',
    active: true,
    createdAt: Date.now(),
    welcomeFireEach: true,
    dessertAfter: 'meat',
    dessertMenuId: 'pf_scalini_89',
    i18n: {
      es: { subtitle: 'Bienvenida, luego Piamonte, Emilia-Romaña, Umbría, Toscana' },
      fr: { subtitle: 'Mise en bouche, puis Piémont, Émilie-Romagne, Ombrie, Toscane' },
      zh: { subtitle: '欢迎菜之后：皮埃蒙特、艾米利亚－罗马涅、翁布里亚、托斯卡纳' }
    },
    courses: tastingCourses,
    pairings: []
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
      welcome: 'Welcome',
      dolce: 'Dolce',
      callServer: 'Call Server',
      viewMenu: 'View Menu',
      selectTable: 'Select table',
      table: 'Table',
      orderPadTitle: 'Write your order',
      orderPadHint: 'Write in Spanish, French, or Chinese. English for your Food Master appears on the right.',
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
      aiExplain: 'What this dish is'
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
      welcome: 'Bienvenida',
      dolce: 'Dolce',
      callServer: 'Llamar al camarero',
      viewMenu: 'Ver menú',
      selectTable: 'Elegir mesa',
      table: 'Mesa',
      orderPadTitle: 'Escriba su pedido',
      orderPadHint: 'Escríbalo en su idioma. A la derecha aparece el inglés para su Food Master.',
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
      aiExplain: 'Qué es este plato'
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
      welcome: 'Mise en bouche',
      dolce: 'Dolce',
      callServer: 'Appeler le serveur',
      viewMenu: 'Voir le menu',
      selectTable: 'Choisir une table',
      table: 'Table',
      orderPadTitle: 'Écrivez votre commande',
      orderPadHint: 'Écrivez dans votre langue. L’anglais pour votre Food Master apparaît à droite.',
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
      aiExplain: 'Ce que c’est'
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
      welcome: '欢迎菜',
      dolce: '甜品',
      callServer: '呼叫服务员',
      viewMenu: '查看菜单',
      selectTable: '选择桌号',
      table: '桌号',
      orderPadTitle: '写下您的订单',
      orderPadHint: '请用您的语言书写。右侧会译成英文，供厨房主管阅读。',
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
      aiExplain: '这道菜是什么'
    }
  };

  root.EPICUREAN_SCALINI = {
    version: 20260902,
    dummyPrixFixeIds: ['pf_lunch', 'pf_brunch', 'pf1', 'pf2'],
    dummyTastingIds: ['tm_chef7', 'tm_choc5', 'tm1', 'tm2'],
    prixFixe: prixFixe,
    tasting: tasting,
    gelatoScoops: GELATO_SCOOPS,
    ui: ui
  };
})(typeof window !== 'undefined' ? window : this);
