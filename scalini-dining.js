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
        ja: { name: 'スモークサーモン', desc: 'レモンとチャイブのクレマ、ブリオッシュトースト' }
      }
    }),
    d('sf_w_zucchini', 'Zucchini Milanese', 'Tomato-basil sauce, chili oil', 'Welcome', FR, {
      order: 2, allergens: ['Gluten', 'Egg'],
      i18n: {
        es: { name: 'Calabacín a la milanesa', desc: 'Salsa de tomate y albahaca, aceite de chile' },
        fr: { name: 'Courgette milanaise', desc: 'Sauce tomate-basilic, huile de piment' },
        ja: { name: 'ズッキーニのミラネーゼ', desc: 'トマトバジルソース、チリオイル' }
      }
    }),
    d('sf_w_shrimp', 'Shrimp in sherry-mustard sauce', 'Pickled Tropea onion', 'Welcome', SA, {
      order: 3, allergens: ['Shellfish'],
      i18n: {
        es: { name: 'Gambas en salsa de jerez y mostaza', desc: 'Cebolla Tropea encurtida' },
        fr: { name: 'Crevettes sauce xérès-moutarde', desc: 'Oignon Tropea mariné' },
        ja: { name: '海老のシェリーマスタードソース', desc: 'ピクルスにしたトロペアオニオン' }
      }
    }),

    d('sf_p_carpaccio', 'Warm scallop carpaccio', 'Olive oil & citrus emulsion, Ligurian olives, roasted pepper and Calabrian chili oil', 'Primi', GM, {
      order: 10, allergens: ['Shellfish'],
      i18n: {
        es: { name: 'Carpaccio tibio de vieiras', desc: 'Emulsión de aceite de oliva y cítricos, aceitunas ligures, pimiento asado y aceite de chile calabrés' },
        fr: { name: 'Carpaccio tiède de Saint-Jacques', desc: 'Émulsion agrumes et huile d’olive, olives ligures, poivron rôti et huile de piment calabrais' },
        ja: { name: 'ホタテの温製カルパッチョ', desc: 'オリーブオイルと柑橘のエマルジョン、リグーリア産オリーブ、ローストピーマン、カラブリアチリオイル' }
      }
    }),
    d('sf_p_rosso', '“Rosso – Bianco”', 'Trevisano radicchio, roasted beet, and goat cheese with a blood orange dressing, toasted pignoli nuts', 'Primi', GM, {
      order: 11, allergens: ['Dairy', 'Tree Nut'],
      i18n: {
        es: { name: '“Rosso – Bianco”', desc: 'Radicchio Trevisano, remolacha asada y queso de cabra con vinagreta de naranja sanguina y piñones tostados' },
        fr: { name: '« Rosso – Bianco »', desc: 'Radicchio de Trévise, betterave rôtie et chèvre, vinaigrette à l’orange sanguine, pignons torréfiés' },
        ja: { name: 'ロッソ・ビアンコ', desc: 'トレビザーノ、ローストビーツ、山羊チーズ、ブラッドオレンジドレッシング、松の実' }
      }
    }),
    d('sf_p_arugula', 'Arugula and buffalo mozzarella salad', 'Prosciutto di Parma, tomatoes and toasted pistachios with aged balsamic and extra virgin olive oil', 'Primi', GM, {
      order: 12, allergens: ['Dairy', 'Tree Nut'],
      i18n: {
        es: { name: 'Ensalada de rúcula y mozzarella de búfala', desc: 'Prosciutto di Parma, tomates y pistachos tostados con balsámico añejo y aceite de oliva virgen extra' },
        fr: { name: 'Salade de roquette et mozzarella de bufflonne', desc: 'Prosciutto di Parma, tomates et pistaches grillées, vinaigre balsamique vieilli et huile d’olive extra vierge' },
        ja: { name: 'ルッコラと水牛乳モッツァレラのサラダ', desc: 'パルマハム、トマト、ピスタチオ、熟成バルサミコとエキストラバージンオリーブオイル' }
      }
    }),
    d('sf_p_lobster', 'Ecuadorian shrimp and ½ Maine lobster tail', 'Spicy garlic, parsley and Vermentino sauce with Calabrian chili over capelli d’angelo', 'Primi', SA, {
      order: 13, upcharge: 8, allergens: ['Shellfish', 'Gluten', 'Fish'],
      i18n: {
        es: { name: 'Gambas ecuatorianas y media cola de langosta de Maine', desc: 'Salsa picante de ajo, perejil y Vermentino con chile calabrés sobre capelli d’angelo' },
        fr: { name: 'Crevettes d’Équateur et demi-queue de homard du Maine', desc: 'Sauce pimentée à l’ail, persil et Vermentino, piment calabrais, capelli d’angelo' },
        ja: { name: 'エクアドル海老とメイン産ロブスターハーフテール', desc: 'ニンニク、パセリ、ヴェルメンティーノのスパイシーソース、カラブリアチリ、カペッリダンジェロ' }
      }
    }),
    d('sf_p_raviolo', 'Soft egg yolk raviolo', 'Truffle butter sauce with grated black truffle', 'Primi', SA, {
      order: 14, upcharge: 8, allergens: ['Gluten', 'Egg', 'Dairy'],
      i18n: {
        es: { name: 'Raviolo de yema blanda', desc: 'Mantequilla de trufa con trufa negra rallada' },
        fr: { name: 'Raviolo au jaune d’œuf coulant', desc: 'Beurre à la truffe et truffe noire râpée' },
        ja: { name: '半熟卵黄のラヴィオロ', desc: '黒トリュフバターソース、黒トリュフの削り' }
      }
    }),
    d('sf_p_porcini', 'Porcini ravioli', 'Wild mushroom and black truffle sauce', 'Primi', SA, {
      order: 15, allergens: ['Gluten', 'Dairy'],
      i18n: {
        es: { name: 'Ravioli de porcini', desc: 'Salsa de setas silvestres y trufa negra' },
        fr: { name: 'Ravioli aux cèpes', desc: 'Sauce aux champignons sauvages et truffe noire' },
        ja: { name: 'ポルチーニのラヴィオリ', desc: '野生キノコと黒トリュフのソース' }
      }
    }),
    d('sf_p_agnolotti', 'Butternut squash agnolotti', 'Sage butter, crushed amaretti and buffalo mozzarella', 'Primi', SA, {
      order: 16, allergens: ['Gluten', 'Dairy', 'Tree Nut', 'Egg'],
      i18n: {
        es: { name: 'Agnolotti de calabaza', desc: 'Mantequilla de salvia, amaretti triturado y mozzarella de búfala' },
        fr: { name: 'Agnolotti au potimarron', desc: 'Beurre sauge, amaretti concassés et mozzarella de bufflonne' },
        ja: { name: 'バターナッツスクアッシュのアニョロッティ', desc: 'セージバター、クラッシュアマレッティ、水牛乳モッツァレラ' }
      }
    }),
    d('sf_p_gnocchi', 'Ricotta gnocchi', 'Light tomato & basil sauce, arugula and goat cheese', 'Primi', SA, {
      order: 17, allergens: ['Gluten', 'Dairy', 'Egg'],
      i18n: {
        es: { name: 'Ñoquis de ricotta', desc: 'Salsa ligera de tomate y albahaca, rúcula y queso de cabra' },
        fr: { name: 'Gnocchi de ricotta', desc: 'Sauce légère tomate-basilic, roquette et chèvre' },
        ja: { name: 'リコッタのニョッキ', desc: 'トマトとバジルの軽いソース、ルッコラと山羊チーズ' }
      }
    }),
    d('sf_p_alice', 'Bucatini “Alice”', 'Sicilian-style sauce with anchovies, garlic, raisins and pignoli nuts, finished with bread crumbs', 'Primi', SA, {
      order: 18, allergens: ['Gluten', 'Fish', 'Tree Nut'],
      i18n: {
        es: { name: 'Bucatini “Alice”', desc: 'Salsa siciliana con anchoas, ajo, pasas y piñones, pan rallado' },
        fr: { name: 'Bucatini « Alice »', desc: 'Sauce sicilienne aux anchois, ail, raisins secs et pignons, chapelure' },
        ja: { name: 'ブカティーニ “アリーチェ”', desc: 'シチリア風：アンチョビ、ニンニク、レーズン、松の実、パン粉' }
      }
    }),
    d('sf_p_arrabbiata', 'Spaghettini “Arrabbiata”', 'Spicy tomato and basil sauce with olives, mushroom and anchovies', 'Primi', SA, {
      order: 19, allergens: ['Gluten', 'Fish'],
      i18n: {
        es: { name: 'Espaguetini “Arrabbiata”', desc: 'Salsa picante de tomate y albahaca con aceitunas, champiñones y anchoas' },
        fr: { name: 'Spaghettini « Arrabbiata »', desc: 'Sauce tomate-basilic pimentée, olives, champignons et anchois' },
        ja: { name: 'スパゲッティーニ “アラビアータ”', desc: 'スパイシートマトバジル、オリーブ、きのこ、アンチョビ' }
      }
    }),
    d('sf_p_bolognese', 'Tagliatelle “Bolognese”', 'Traditional meat sauce with crispy sage & whipped ricotta', 'Primi', SA, {
      order: 20, allergens: ['Gluten', 'Dairy'],
      i18n: {
        es: { name: 'Tagliatelle “Boloñesa”', desc: 'Ragú tradicional con salvia crujiente y ricotta montada' },
        fr: { name: 'Tagliatelle « Bolognese »', desc: 'Ragù traditionnel, sauge croustillante et ricotta fouettée' },
        ja: { name: 'タリアテッレ “ボロネーゼ”', desc: '伝統的なミートソース、クリスピーセージとホイップリコッタ' }
      }
    }),
    d('sf_p_pappardelle', 'Pappardelle', 'Braised veal and pork shank ragù with a hint of orange, mascarpone', 'Primi', SA, {
      order: 21, allergens: ['Gluten', 'Dairy'],
      i18n: {
        es: { name: 'Pappardelle', desc: 'Ragú de jarrete de ternera y cerdo, toque de naranja y mascarpone' },
        fr: { name: 'Pappardelle', desc: 'Ragù de jarret de veau et de porc, zeste d’orange, mascarpone' },
        ja: { name: 'パッパードッレ', desc: '仔牛と豚スネのラグー、オレンジの香り、マスカルポーネ' }
      }
    }),
    d('sf_p_linguini', 'Linguini in spicy pescatore sauce', 'Shrimp and mushrooms', 'Primi', SA, {
      order: 22, allergens: ['Gluten', 'Shellfish'],
      i18n: {
        es: { name: 'Linguini en salsa pescatore picante', desc: 'Gambas y champiñones' },
        fr: { name: 'Linguine sauce pescatore pimentée', desc: 'Crevettes et champignons' },
        ja: { name: 'リングイネ スパイシー・ペスカトーレ', desc: '海老ときのこ' }
      }
    }),
    d('sf_p_stracci', 'Hand-made stracci pasta', 'Sausage and porcini mushrooms in a light tomato and basil sauce, grated pecorino', 'Primi', SA, {
      order: 23, allergens: ['Gluten', 'Dairy'],
      i18n: {
        es: { name: 'Pasta stracci hecha a mano', desc: 'Salchicha y porcini en salsa ligera de tomate y albahaca, pecorino rallado' },
        fr: { name: 'Stracci faits maison', desc: 'Saucisse et cèpes, sauce légère tomate-basilic, pecorino râpé' },
        ja: { name: '手打ちストラッチ', desc: 'ソーセージとポルチーニ、トマトバジルの軽いソース、ペコリーノ' }
      }
    }),
    d('sf_p_fusilli', 'Calabrian fusilli alla vodka', 'Hand-made twisted pasta in a tomato cream sauce with chili pepper and vodka', 'Primi', SA, {
      order: 24, allergens: ['Gluten', 'Dairy'],
      i18n: {
        es: { name: 'Fusilli calabreses alla vodka', desc: 'Pasta trenzada hecha a mano en salsa cremosa de tomate con chile y vodka' },
        fr: { name: 'Fusilli calabrais à la vodka', desc: 'Pâtes torsadées maison, crème tomate, piment et vodka' },
        ja: { name: 'カラブリア風フジッリ アラ・ウォッカ', desc: '手打ちツイストパスタ、チリとウォッカのトマトクリームソース' }
      }
    }),

    d('sf_m_sole', 'Filet of sole “Livornese”', 'Olives and anchovy in a light saffron tomato broth over braised fennel', 'Piatti Principale', SA, {
      order: 30, allergens: ['Fish'],
      i18n: {
        es: { name: 'Filete de lenguado “Livornese”', desc: 'Aceitunas y anchoa en caldo ligero de tomate y azafrán sobre hinojo braseado' },
        fr: { name: 'Filet de sole « Livornese »', desc: 'Olives et anchois, bouillon léger tomate-safran, fenouil braisé' },
        ja: { name: 'ソールのフィレ “リヴォルネーゼ”', desc: 'オリーブとアンチョビ、サフランのトマトブロス、ブレズしたフェンネル' }
      }
    }),
    d('sf_m_genovese', 'Toasted pignoli crusted salmon “Genovese”', 'White wine sauce finished with fresh basil, over pecorino and zucchini puree', 'Piatti Principale', SA, {
      order: 31, allergens: ['Fish', 'Tree Nut', 'Dairy'],
      i18n: {
        es: { name: 'Salmón “Genovese” con costra de piñones', desc: 'Salsa de vino blanco y albahaca, puré de pecorino y calabacín' },
        fr: { name: 'Saumon « Genovese » en croûte de pignons', desc: 'Sauce vin blanc et basilic, purée de pecorino et courgette' },
        ja: { name: '松の実クラストのサーモン “ジェノヴェーゼ”', desc: '白ワインソース、バジル、ペコリーノとズッキーニのピュレ' }
      }
    }),
    d('sf_m_scallops', 'Dayboat sea scallops “Saltimbocca”', 'Prosciutto, sage and white wine, braised artichoke', 'Piatti Principale', SA, {
      order: 32, allergens: ['Shellfish'],
      i18n: {
        es: { name: 'Vieiras “Saltimbocca”', desc: 'Prosciutto, salvia y vino blanco, alcachofa braseada' },
        fr: { name: 'Saint-Jacques « Saltimbocca »', desc: 'Prosciutto, sauge et vin blanc, artichaut braisé' },
        ja: { name: 'ホタテの “サルティンボッカ”', desc: 'プロシュート、セージ、白ワイン、ブレズしたアーティチョーク' }
      }
    }),
    d('sf_m_forestiere', 'Filet of Faroe Island salmon “Forestiere”', 'Wild mushroom & black truffle crust over spinach and roasted beets', 'Piatti Principale', SA, {
      order: 33, allergens: ['Fish', 'Dairy'],
      i18n: {
        es: { name: 'Salmón de las Islas Feroe “Forestiere”', desc: 'Costra de setas silvestres y trufa negra, espinacas y remolacha asada' },
        fr: { name: 'Saumon des Féroé « Forestiere »', desc: 'Croûte champignons sauvages et truffe noire, épinards et betteraves rôties' },
        ja: { name: 'フェロー諸島サーモン “フォレスティエール”', desc: '野生キノコと黒トリュフのクラスト、ほうれん草とローストビーツ' }
      }
    }),
    d('sf_m_zafferano', 'Butter and thyme braised Ecuadorian shrimp “Zafferano”', 'Roasted butternut squash and shallot puree, light orange-scented saffron sauce', 'Piatti Principale', SA, {
      order: 34, allergens: ['Shellfish', 'Dairy'],
      i18n: {
        es: { name: 'Gambas ecuatorianas “Zafferano”', desc: 'Puré de calabaza y chalota, salsa ligera de azafrán al aroma de naranja' },
        fr: { name: 'Crevettes d’Équateur « Zafferano »', desc: 'Purée de potimarron et échalote, sauce safran légèrement parfumée à l’orange' },
        ja: { name: 'エクアドル海老の “ザッフェラーノ”', desc: 'バターナッツとエシャロットのピュレ、オレンジ香るサフランソース' }
      }
    }),
    d('sf_m_pork', '14 oz. roasted pork chop “San Domenico”', 'Mascarpone-vodka sauce with chives', 'Piatti Principale', GR, {
      order: 35, allergens: ['Dairy'],
      i18n: {
        es: { name: 'Chuleta de cerdo 14 oz. “San Domenico”', desc: 'Salsa de mascarpone y vodka con cebollino' },
        fr: { name: 'Côte de porc 14 oz « San Domenico »', desc: 'Sauce mascarpone-vodka à la ciboulette' },
        ja: { name: '14オンス ポークチョップ “サン・ドメニコ”', desc: 'マスカルポーネとウォッカのソース、チャイブ' }
      }
    }),
    d('sf_m_chicken', 'Boneless breast of chicken strips “Scarpariello”', 'Sautéed with mushrooms, sausage and crispy potatoes', 'Piatti Principale', SA, {
      order: 36, allergens: [],
      i18n: {
        es: { name: 'Tiras de pechuga de pollo “Scarpariello”', desc: 'Salteadas con champiñones, salchicha y patatas crujientes' },
        fr: { name: 'Lanières de poulet « Scarpariello »', desc: 'Sautées aux champignons, saucisse et pommes de terre croustillantes' },
        ja: { name: '鶏むね肉の “スカルパリエッロ”', desc: 'きのこ、ソーセージ、クリスピーポテトのソテー' }
      }
    }),
    d('sf_m_veal_val', 'Veal scallopini “Valdostano”', 'Prosciutto di Parma and fontina in a wild mushroom–Madeira wine sauce', 'Piatti Principale', SA, {
      order: 37, allergens: ['Dairy'],
      i18n: {
        es: { name: 'Escalope de ternera “Valdostano”', desc: 'Prosciutto di Parma y fontina en salsa de setas y Madeira' },
        fr: { name: 'Escalope de veau « Valdostano »', desc: 'Prosciutto di Parma et fontina, sauce champignons sauvages au madère' },
        ja: { name: '仔牛のスカロッピーニ “ヴァルドスターノ”', desc: 'パルマハムとフォンティナ、きのこマデイラソース' }
      }
    }),
    d('sf_m_duck', 'Slow roasted Long Island duck breast “Modena”', 'Braised endive, port sauce with Amarena cherries from Bologna', 'Piatti Principale', GR, {
      order: 38, allergens: [],
      i18n: {
        es: { name: 'Pechuga de pato de Long Island “Modena”', desc: 'Endivia braseada, salsa de Oporto con cerezas Amarena de Bolonia' },
        fr: { name: 'Magret de canard de Long Island « Modena »', desc: 'Endive braisée, sauce porto aux cerises Amarena de Bologne' },
        ja: { name: 'ロングアイランド鴨胸肉 “モデナ”', desc: 'ブレズしたエンダイブ、ボローニャ産アマレーナチェリーのポートソース' }
      }
    }),
    d('sf_m_saggio', '14 oz. roasted rib veal chop “Saggio”', 'Crispy shallots and sage, Dijon mustard and porcini mushroom sauce', 'Piatti Principale', GR, {
      order: 39, upcharge: 25, allergens: [],
      i18n: {
        es: { name: 'Chuletón de ternera 14 oz. “Saggio”', desc: 'Chalotas crujientes y salvia, salsa de mostaza Dijon y porcini' },
        fr: { name: 'Côte de veau 14 oz « Saggio »', desc: 'Échalotes croustillantes et sauge, sauce moutarde de Dijon et cèpes' },
        ja: { name: '14オンス 仔牛リブチョップ “サッジョ”', desc: 'クリスピーシャロットとセージ、ディジョンマスタードとポルチーニソース' }
      }
    }),
    d('sf_m_giambotta', 'Split 10 oz. filet mignon “Giambotta”', 'Spicy wine sauce with mushrooms, onions and hot & sweet peppers', 'Piatti Principale', GR, {
      order: 40, upcharge: 15, allergens: [],
      i18n: {
        es: { name: 'Filet mignon 10 oz. “Giambotta”', desc: 'Salsa de vino picante con champiñones, cebolla y pimientos dulces y picantes' },
        fr: { name: 'Filet mignon 10 oz « Giambotta »', desc: 'Sauce au vin pimentée, champignons, oignons et poivrons doux et forts' },
        ja: { name: '10オンス フィレミニョン “ジャンボッタ”', desc: 'きのこ、玉ねぎ、甘唐辛子と辛唐辛子のスパイシーワインソース' }
      }
    }),

    d('sf_e_sorbet', 'Coconut–lime sorbet with rum glazed pineapple', 'Entremets served to every guest before dessert. Contains rum and nuts on the plate — check allergies before firing.', 'Entremets', PA, {
      order: 50, allergens: ['Tree Nut'], cookNote: 'Allergy check: nuts and rum. Do not fire if the guest has a nut allergy unless confirmed.',
      i18n: {
        es: { name: 'Sorbete de coco y lima con piña al ron', desc: 'Entremets para todos antes del postre. Contiene ron y frutos secos — verificar alergias.' },
        fr: { name: 'Sorbet coco-citron vert, ananas au rhum', desc: 'Entremets servi à tous avant le dessert. Rhum et fruits à coque — vérifier les allergies.' },
        ja: { name: 'ココナッツライムソルベとラムのパイナップル', desc: 'デザート前のアントルメ。ラムとナッツを含むためアレルギーを確認。' }
      }
    }),

    d('sf_d_napoleon', 'Napoleon of chocolate painted fillo', 'Layered with chocolate-espresso mousse, bitter chocolate crumbs and praline cream', 'Dolce', PA, {
      order: 60, allergens: ['Gluten', 'Dairy', 'Egg', 'Tree Nut'],
      i18n: {
        es: { name: 'Napoleón de chocolate sobre fillo', desc: 'Mousse de chocolate y espresso, migas de chocolate amargo y crema praliné' },
        fr: { name: 'Napoléon au chocolat sur filo', desc: 'Mousse chocolat-espresso, éclats de chocolat amer et crème praliné' },
        ja: { name: 'チョコレートナポレオン（フィロ）', desc: 'チョコレートエスプレッソムース、ビターチョコクラム、プラリネクリーム' }
      }
    }),
    d('sf_d_cake', 'Warm flourless chocolate cake', 'Fleur de sel, pistachio gelato and Amarena cherries from Emilia Romagna', 'Dolce', PA, {
      order: 61, allergens: ['Dairy', 'Egg', 'Tree Nut'],
      i18n: {
        es: { name: 'Pastel de chocolate sin harina, caliente', desc: 'Flor de sal, helado de pistacho y cerezas Amarena de Emilia-Romaña' },
        fr: { name: 'Moelleux au chocolat sans farine', desc: 'Fleur de sel, glace pistache et cerises Amarena d’Émilie-Romagne' },
        ja: { name: '温かい粉なしチョコレートケーキ', desc: 'フルール・ド・セル、ピスタチオジェラート、エミリア＝ロマーニャのアマレーナチェリー' }
      }
    }),
    d('sf_d_souffle', 'Flourless bittersweet chocolate soufflé', 'Allow 12 minutes', 'Dolce', PA, {
      order: 62, upcharge: 5, allergens: ['Dairy', 'Egg'], cookTime: 12, cookNote: 'Allow 12 minutes',
      i18n: {
        es: { name: 'Soufflé de chocolate amargo sin harina', desc: 'Requiere 12 minutos' },
        fr: { name: 'Soufflé au chocolat amer sans farine', desc: 'Prévoir 12 minutes' },
        ja: { name: '粉なしビターチョコレートスフレ', desc: '12分お待ちください' }
      }
    }),
    d('sf_d_tart', 'Chocolate–blood orange–caramel tart', 'Toasted hazelnuts and whipped cream', 'Dolce', PA, {
      order: 63, allergens: ['Gluten', 'Dairy', 'Tree Nut', 'Egg'],
      i18n: {
        es: { name: 'Tarta de chocolate, naranja sanguina y caramelo', desc: 'Avellanas tostadas y nata montada' },
        fr: { name: 'Tarte chocolat–orange sanguine–caramel', desc: 'Noisettes torréfiées et crème fouettée' },
        ja: { name: 'チョコレート、ブラッドオレンジ、キャラメルのタルト', desc: 'ローストヘーゼルナッツとホイップクリーム' }
      }
    }),
    d('sf_d_panino', '“Panino”', 'Crisp pistachio and hazelnut caramel wafers layered with hazelnut gelato', 'Dolce', PA, {
      order: 64, allergens: ['Gluten', 'Dairy', 'Tree Nut', 'Egg'],
      i18n: {
        es: { name: '“Panino”', desc: 'Barquillos crujientes de pistacho y avellana con helado de avellana' },
        fr: { name: '« Panino »', desc: 'Gaufrettes caramel pistache-noisette, glace noisette' },
        ja: { name: '“パニーノ”', desc: 'ピスタチオとヘーゼルナッツのキャラメルウエハース、ヘーゼルナッツジェラート' }
      }
    }),
    d('sf_d_pineapple', 'Warm pineapple tart', 'Cold zabaglione and vanilla gelato, crushed amaretti', 'Dolce', PA, {
      order: 65, allergens: ['Gluten', 'Dairy', 'Egg', 'Tree Nut'],
      i18n: {
        es: { name: 'Tarta tibia de piña', desc: 'Zabaione frío, helado de vainilla y amaretti triturado' },
        fr: { name: 'Tarte tiède à l’ananas', desc: 'Zabaione froid, glace vanille et amaretti concassés' },
        ja: { name: '温かいパイナップルタルト', desc: '冷たいザバイオーネ、バニラジェラート、クラッシュアマレッティ' }
      }
    }),
    d('sf_d_banana', 'Thinly sliced bananas', 'Lightly brûléed in a crispy fillo crust with lemon-mascarpone cream', 'Dolce', PA, {
      order: 66, allergens: ['Gluten', 'Dairy', 'Egg'],
      i18n: {
        es: { name: 'Plátano en láminas', desc: 'Ligeramente quemado en fillo crujiente con crema de limón y mascarpone' },
        fr: { name: 'Bananes en fines tranches', desc: 'Légèrement brûlées, croûte de filo, crème citron-mascarpone' },
        ja: { name: '薄切りバナナ', desc: 'フィロのクリスピークラスト、レモンマスカルポーネクリーム、軽いブリュレ' }
      }
    }),
    d('sf_d_gelato', 'Sorbetti e gelati — three scoops', 'Choose three: green apple, lemon, vanilla, caramel, hazelnut', 'Dolce', PA, {
      order: 67, allergens: ['Dairy', 'Tree Nut'], chooseCount: 3, scoops: GELATO_SCOOPS,
      i18n: {
        es: { name: 'Sorbete y gelato — tres bolas', desc: 'Elija tres: manzana verde, limón, vainilla, caramelo, avellana' },
        fr: { name: 'Sorbets et gelati — trois boules', desc: 'Trois parfums au choix : pomme verte, citron, vanille, caramel, noisette' },
        ja: { name: 'ソルベとジェラート（3スクープ）', desc: '3つ選択：青りんご、レモン、バニラ、キャラメル、ヘーゼルナッツ' }
      }
    }),
    d('sf_d_formaggio', 'Formaggio', 'Gorgonzola Dolce (Lombardy, cow), Parmigiano Reggiano (Emilia Romagna, cow), Mozzarella di Bufala (Campania, buffalo)', 'Dolce', GM, {
      order: 68, upcharge: 8, allergens: ['Dairy'],
      i18n: {
        es: { name: 'Formaggio', desc: 'Gorgonzola Dolce (Lombardía, vaca), Parmigiano Reggiano (Emilia-Romaña, vaca), Mozzarella di Bufala (Campania, búfala)' },
        fr: { name: 'Formaggio', desc: 'Gorgonzola Dolce (Lombardie, vache), Parmigiano Reggiano (Émilie-Romagne, vache), Mozzarella di Bufala (Campanie, bufflonne)' },
        ja: { name: 'フォルマッジョ', desc: 'ゴルゴンゾーラ・ドルチェ（ロンバルディア、牛乳）、パルミジャーノ・レッジャーノ（エミリア＝ロマーニャ、牛乳）、水牛乳モッツァレラ（カンパニア）' }
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
      photoUrl: '',
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
      i18n: { es: { name: 'Salmón ahumado', desc: 'Crema de limón y cebollino sobre tostada de brioche. Entrada de bienvenida — disparar sola.' }, fr: { name: 'Saumon fumé', desc: 'Crème citron-ciboulette sur brioche. Mise en bouche — envoyer seule.' }, ja: { name: 'スモークサーモン', desc: 'レモンとチャイブのクレマ、ブリオッシュ。ウェルカム — 単独でファイア。' } }
    }),
    tc(2, 'Zucchini Milanese', 'Tomato-basil sauce, chili oil. Welcome course — fire alone.', FR, {
      allergens: ['Gluten', 'Egg'], dishId: 'sf_w_zucchini',
      i18n: { es: { name: 'Calabacín a la milanesa', desc: 'Salsa de tomate y albahaca, aceite de chile. Bienvenida — disparar sola.' }, fr: { name: 'Courgette milanaise', desc: 'Sauce tomate-basilic, huile de piment. Mise en bouche — envoyer seule.' }, ja: { name: 'ズッキーニのミラネーゼ', desc: 'トマトバジル、チリオイル。ウェルカム — 単独でファイア。' } }
    }),
    tc(3, 'Shrimp in sherry-mustard sauce', 'Pickled Tropea onion. Welcome course — fire alone.', SA, {
      allergens: ['Shellfish'], dishId: 'sf_w_shrimp',
      i18n: { es: { name: 'Gambas en salsa de jerez y mostaza', desc: 'Cebolla Tropea encurtida. Bienvenida — disparar sola.' }, fr: { name: 'Crevettes sauce xérès-moutarde', desc: 'Oignon Tropea mariné. Mise en bouche — envoyer seule.' }, ja: { name: '海老のシェリーマスタードソース', desc: 'ピクルスにしたトロペアオニオン。ウェルカム — 単独でファイア。' } }
    }),
    tc(4, 'Porcini mushroom ravioli — Piemonte', 'Wild mushroom and black truffle sauce', SA, {
      allergens: ['Gluten', 'Dairy'], dishId: 'sf_p_porcini',
      i18n: { es: { name: 'Ravioli de porcini — Piamonte', desc: 'Salsa de setas silvestres y trufa negra' }, fr: { name: 'Ravioli aux cèpes — Piémont', desc: 'Sauce champignons sauvages et truffe noire' }, ja: { name: 'ポルチーニのラヴィオリ — ピエモンテ', desc: '野生キノコと黒トリュフのソース' } }
    }),
    tc(5, 'Butternut agnolotti with sage — Emilia Romagna', 'Sage butter, crushed amaretti and buffalo mozzarella', SA, {
      allergens: ['Gluten', 'Dairy', 'Tree Nut', 'Egg'], dishId: 'sf_p_agnolotti',
      i18n: { es: { name: 'Agnolotti de calabaza con salvia — Emilia-Romaña', desc: 'Mantequilla de salvia, amaretti y mozzarella de búfala' }, fr: { name: 'Agnolotti au potimarron, sauge — Émilie-Romagne', desc: 'Beurre sauge, amaretti et mozzarella de bufflonne' }, ja: { name: 'セージのアニョロッティ — エミリア＝ロマーニャ', desc: 'セージバター、アマレッティ、水牛乳モッツァレラ' } }
    }),
    tc(6, 'Salmon topped with wild mushrooms & black truffle — Umbria', 'Filet of Faroe Island salmon “Forestiere” over spinach and roasted beets', SA, {
      allergens: ['Fish', 'Dairy'], dishId: 'sf_m_forestiere',
      i18n: { es: { name: 'Salmón con setas silvestres y trufa negra — Umbría', desc: 'Salmón de las Islas Feroe “Forestiere”, espinacas y remolacha asada' }, fr: { name: 'Saumon aux champignons et truffe noire — Ombrie', desc: 'Saumon des Féroé « Forestiere », épinards et betteraves rôties' }, ja: { name: 'きのこ黒トリュフのサーモン — ウンブリア', desc: 'フェロー諸島サーモン “フォレスティエール”、ほうれん草とローストビーツ' } }
    }),
    tc(7, 'Pan roasted filet mignon “Giambotta” — Toscana', 'Spicy wine sauce with mushrooms, onions and hot & sweet peppers. Take dessert after this meat course.', GR, {
      allergens: [], dishId: 'sf_m_giambotta', fireAfter: '',
      i18n: { es: { name: 'Filet mignon “Giambotta” — Toscana', desc: 'Salsa de vino picante con champiñones, cebolla y pimientos. Tomar el postre después de este plato de carne.' }, fr: { name: 'Filet mignon « Giambotta » — Toscane', desc: 'Sauce au vin pimentée, champignons, oignons et poivrons. Prendre le dessert après cette viande.' }, ja: { name: 'フィレミニョン “ジャンボッタ” — トスカーナ', desc: 'スパイシーワインソース。この肉料理の後にデザートを取る。' } }
    }),
    tc(8, 'Coconut–lime sorbet with rum glazed pineapple', 'Entremets for every guest before dessert. Nuts and rum — check allergies.', PA, {
      allergens: ['Tree Nut'], mode: 'entremets', pending: true, fireAfter: 'meat', dishId: 'sf_e_sorbet',
      cookNote: 'Allergy check: nuts and rum.',
      i18n: { es: { name: 'Sorbete de coco y lima con piña al ron', desc: 'Entremets para todos. Frutos secos y ron — verificar alergias.' }, fr: { name: 'Sorbet coco-citron vert, ananas au rhum', desc: 'Entremets pour tous. Fruits à coque et rhum — vérifier les allergies.' }, ja: { name: 'ココナッツライムソルベ', desc: '全員のアントルメ。ナッツとラム — アレルギー確認。' } }
    }),
    tc(9, 'Dolce', 'Dessert is included. Take the order after the meat course; guest chooses from the chocolate, seasonal, gelato, or cheese menus.', PA, {
      mode: 'later', pending: true, fireAfter: 'meat',
      i18n: { es: { name: 'Dolce', desc: 'Postre incluido. Tomar el pedido después de la carne; elija chocolate, de temporada, gelato o queso.' }, fr: { name: 'Dolce', desc: 'Dessert inclus. Prendre la commande après la viande : chocolat, saison, gelato ou fromage.' }, ja: { name: 'ドルチェ', desc: 'デザート込み。肉料理の後に注文。チョコレート、季節、ジェラート、またはチーズ。' } }
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
      dolce: 'Dolce'
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
      dolce: 'Dolce'
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
      dolce: 'Dolce'
    },
    ja: {
      prixFixe: 'プリフィクス',
      tasting: 'テイスティング',
      setMenus: 'セットメニュー',
      tastingMenus: 'テイスティングメニュー',
      perPerson: 'お一人様',
      choose: 'お選びください',
      included: '込み',
      servedAuto: '自動で提供 — キッチンは一品ずつファイア',
      dessertLater: 'メインの後にお取りします',
      tastingDessertLater: '肉料理の後にお取りします',
      entremetsNote: 'デザート前に皆様へ。ラムのパイナップルとナッツ入り — ナッツアレルギーはお知らせください。',
      threeScoops: '3スクープをお選びください',
      supplement: '追加',
      experience: 'コース',
      allergies: 'アレルギー',
      welcome: 'ウェルカム',
      dolce: 'ドルチェ'
    }
  };

  root.EPICUREAN_SCALINI = {
    version: 20260901,
    dummyPrixFixeIds: ['pf_lunch', 'pf_brunch', 'pf1', 'pf2'],
    dummyTastingIds: ['tm_chef7', 'tm_choc5', 'tm1', 'tm2'],
    prixFixe: prixFixe,
    tasting: tasting,
    gelatoScoops: GELATO_SCOOPS,
    ui: ui
  };
})(typeof window !== 'undefined' ? window : this);
