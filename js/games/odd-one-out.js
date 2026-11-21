/* מי לא שייך? — find the word that does not belong to the category of the others. */
(function () {
  'use strict';

  var ROUNDS = 8;

  /* Word bank. Every word appears in exactly one category.
     f: true marks a feminine-plural label ("כל השאר הן ...").
     rel: closely related categories, used as the source of the odd word in hard rounds. */
  var CATS = [
    { id: 'fruit', label: 'פירות', rel: ['veg', 'sweets'],
      words: ['תפוח', 'בננה', 'אגס', 'ענבים', 'אבטיח', 'מלון', 'תות', 'אפרסק', 'שזיף', 'דובדבן', 'מנגו', 'אננס', 'קיווי', 'רימון', 'תאנה', 'תפוז'] },
    { id: 'veg', label: 'ירקות', rel: ['fruit', 'flowers'],
      words: ['גזר', 'מלפפון', 'חסה', 'כרוב', 'בצל', 'שום', 'פלפל', 'חציל', 'קישוא', 'תפוח אדמה', 'ברוקולי', 'כרובית', 'צנון', 'סלק'] },
    { id: 'mammals', label: 'יונקים', rel: ['birds', 'fish', 'insects'],
      words: ['אריה', 'פיל', "ג'ירפה", 'זברה', 'סוס', 'פרה', 'כבש', 'עז', 'ארנב', 'דוב', 'קוף', 'נמר', 'גמל', 'חמור'] },
    { id: 'birds', label: 'ציפורים', f: true, rel: ['mammals', 'insects', 'fish'],
      words: ['נשר', 'יונה', 'תוכי', 'דרור', 'ינשוף', 'פינגווין', 'עורב', 'חסידה', 'תרנגול', 'ברווז', 'שחף', 'פלמינגו', 'אנפה'] },
    { id: 'fish', label: 'דגים', rel: ['mammals', 'birds'],
      words: ['סלמון', 'טונה', 'כריש', 'בורי', 'דניס', 'לוקוס', 'סרדין', 'אמנון', 'קרפיון', 'מושט', 'פורל', 'דג זהב'] },
    { id: 'insects', label: 'חרקים', rel: ['birds', 'mammals'],
      words: ['נמלה', 'דבורה', 'פרפר', 'זבוב', 'יתוש', 'חיפושית', 'חגב', "ג'וק", 'צרצר', 'שפירית', 'צרעה'] },
    { id: 'kitchen', label: 'כלי מטבח', rel: ['appliances', 'tools', 'office'],
      words: ['מחבת', 'סיר', 'מזלג', 'כפית', 'סכין', 'מצקת', 'קולפן', 'מסננת', 'קערה', 'צלחת', 'מערוך', 'קרש חיתוך', 'פומפייה', 'מטרפה'] },
    { id: 'appliances', label: 'מכשירי חשמל', rel: ['kitchen', 'furniture'],
      words: ['מקרר', 'תנור', 'מיקרוגל', 'מכונת כביסה', 'מייבש כביסה', 'מדיח כלים', 'מזגן', 'שואב אבק', 'מאוורר', 'טלוויזיה', 'מגהץ'] },
    { id: 'furniture', label: 'רהיטים', rel: ['house', 'appliances'],
      words: ['כיסא', 'שולחן', 'ספה', 'מיטה', 'ארון', 'שידה', 'כורסה', 'מדף', 'כוננית', 'שרפרף', 'ספסל'] },
    { id: 'house', label: 'חלקי בית', rel: ['furniture'],
      words: ['גג', 'קיר', 'חלון', 'דלת', 'רצפה', 'תקרה', 'מרפסת', 'מדרגות', 'ארובה', 'מרתף', 'עליית גג', 'פרוזדור'] },
    { id: 'clothes', label: 'בגדים', rel: ['jewelry'],
      words: ['חולצה', 'מכנסיים', 'שמלה', 'חצאית', 'מעיל', 'סוודר', 'גרביים', 'כובע', 'צעיף', 'עניבה', 'חליפה', "פיג'מה", 'גופייה'] },
    { id: 'jewelry', label: 'תכשיטים', rel: ['clothes'],
      words: ['טבעת', 'שרשרת', 'צמיד', 'עגילים', 'תליון', 'נזם', 'מחרוזת', 'סיכת דש'] },
    { id: 'music', label: 'כלי נגינה', rel: [],
      words: ['גיטרה', 'פסנתר', 'כינור', 'חליל', 'תוף', 'חצוצרה', 'סקסופון', "צ'לו", 'נבל', 'אקורדיון', 'מפוחית', 'קלרינט', 'עוגב', 'טרומבון'] },
    { id: 'jobs', label: 'מקצועות', rel: ['sports'],
      words: ['רופא', 'מורה', 'נהג', 'טבח', 'שוטר', 'נגר', 'חשמלאי', 'טייס', 'עורך דין', 'רוקח', 'צלם', 'דוור', 'חקלאי', 'כבאי', 'אופה', 'שרברב'] },
    { id: 'il-cities', label: 'ערים בישראל', f: true, rel: ['eu-cities', 'countries'],
      words: ['חיפה', 'תל אביב', 'ירושלים', 'באר שבע', 'אילת', 'נתניה', 'טבריה', 'צפת', 'עכו', 'אשדוד', 'הרצליה', 'רחובות', 'נצרת', 'דימונה'] },
    { id: 'eu-cities', label: 'ערים באירופה', f: true, rel: ['il-cities', 'countries'],
      words: ['פריז', 'רומא', 'לונדון', 'מדריד', 'אתונה', 'ברלין', 'וינה', 'אמסטרדם', 'פראג', 'ליסבון', 'בודפשט'] },
    { id: 'countries', label: 'ארצות', f: true, rel: ['eu-cities', 'il-cities'],
      words: ['צרפת', 'איטליה', 'ספרד', 'יוון', 'מצרים', 'יפן', 'סין', 'הודו', 'ברזיל', 'קנדה', 'גרמניה', 'רוסיה', 'ארגנטינה', 'טורקיה'] },
    { id: 'colors', label: 'צבעים', rel: [],
      words: ['אדום', 'כחול', 'ירוק', 'צהוב', 'סגול', 'כתום', 'ורוד', 'שחור', 'לבן', 'אפור', 'תכלת', 'טורקיז'] },
    { id: 'flowers', label: 'פרחים', rel: ['trees', 'veg'],
      words: ['ורד', 'חמנייה', 'צבעוני', 'כלנית', 'רקפת', 'נרקיס', 'סחלב', 'חרצית', 'יסמין', 'פרג', 'חבצלת', 'סביון', 'נורית'] },
    { id: 'trees', label: 'עצים', rel: ['flowers'],
      words: ['אלון', 'אורן', 'ברוש', 'אקליפטוס', 'ארז', 'אשל', 'צפצפה', 'דקל', 'שקמה', 'פיקוס'] },
    { id: 'transport', label: 'כלי תחבורה', rel: [],
      words: ['מכונית', 'אוטובוס', 'רכבת', 'מטוס', 'אופניים', 'אופנוע', 'משאית', 'מונית', 'ספינה', 'סירה', 'מסוק', 'קורקינט', 'טרקטור', 'רכבל'] },
    { id: 'sports', label: 'ענפי ספורט', rel: ['jobs'],
      words: ['כדורגל', 'כדורסל', 'טניס', 'שחייה', 'ריצה', 'אגרוף', "ג'ודו", 'התעמלות', 'כדורעף', 'גולף', 'סקי', 'כדוריד', 'סיף', 'חתירה'] },
    { id: 'holidays', label: 'חגים', rel: [],
      words: ['פסח', 'שבועות', 'סוכות', 'חנוכה', 'פורים', 'ראש השנה', 'יום כיפור', 'ט"ו בשבט', 'ל"ג בעומר', 'שמחת תורה', 'יום העצמאות'] },
    { id: 'body', label: 'איברי גוף', rel: [],
      words: ['יד', 'רגל', 'ראש', 'אף', 'אוזן', 'עין', 'פה', 'כתף', 'ברך', 'מרפק', 'אצבע', 'צוואר', 'בטן', 'גב'] },
    { id: 'weather', label: 'תופעות מזג אוויר', f: true, rel: [],
      words: ['גשם', 'שלג', 'ברד', 'רוח', 'ערפל', 'ברק', 'רעם', 'סופה', 'טל', 'קשת בענן', 'שרב', 'חמסין'] },
    { id: 'tools', label: 'כלי עבודה', rel: ['kitchen', 'office'],
      words: ['פטיש', 'מברג', 'מסור', 'מקדחה', 'צבת', 'מפתח ברגים', 'מלטשת', 'פלס', 'מעדר', 'מגרפה'] },
    { id: 'office', label: 'ציוד משרדי', rel: ['tools', 'kitchen'],
      words: ['עיפרון', 'מחק', 'מחדד', 'סרגל', 'מספריים', 'דבק', 'מחברת', 'קלמר', 'עט', 'מהדק', 'טוש'] },
    { id: 'drinks', label: 'משקאות', rel: ['il-food', 'sweets'],
      words: ['מים', 'חלב', 'קפה', 'תה', 'מיץ', 'לימונדה', 'סודה', 'יין', 'בירה', 'שוקו', 'ערק', 'קולה'] },
    { id: 'il-food', label: 'מאכלים ישראליים', rel: ['sweets', 'drinks'],
      words: ['פלאפל', 'חומוס', 'שקשוקה', 'שווארמה', 'בורקס', 'סביח', 'מלאווח', "ג'חנון", 'קובה', 'טחינה', 'פתיתים', 'במבה', 'ביסלי'] },
    { id: 'sweets', label: 'קינוחים', rel: ['il-food', 'fruit'],
      words: ['עוגה', 'גלידה', 'עוגיות', 'שוקולד', 'פודינג', 'מוס', 'מרשמלו', 'סוכרייה', 'ופל', 'טירמיסו'] },
    /* Abstract categories (abs: true) are used only from level 17. */
    { id: 'feelings', label: 'רגשות', abs: true, rel: ['traits'],
      words: ['שמחה', 'עצב', 'כעס', 'פחד', 'קנאה', 'בושה', 'הפתעה', 'געגוע', 'אהבה', 'תקווה', 'ייאוש', 'בדידות', 'אכזבה', 'התרגשות'] },
    { id: 'traits', label: 'תכונות אופי', f: true, abs: true, rel: ['feelings'],
      words: ['נדיבות', 'קמצנות', 'אומץ', 'סבלנות', 'יושר', 'ענווה', 'עקשנות', 'חריצות', 'עצלות', 'נאמנות', 'סקרנות', 'ביישנות', 'יהירות'] },
    { id: 'time', label: 'יחידות זמן', f: true, abs: true, rel: ['units'],
      words: ['שנייה', 'דקה', 'שעה', 'יום', 'שבוע', 'חודש', 'שנה', 'עשור'] },
    { id: 'units', label: 'יחידות מידה', f: true, abs: true, rel: ['time'],
      words: ['מטר', 'סנטימטר', 'קילומטר', 'מילימטר', 'גרם', 'קילוגרם', 'טון', 'ליטר', 'מיליליטר'] }
  ];

  /* Levels 31–50: "fine" rounds. Every word on the screen comes from the same wide field (fruit, music,
     countries...), but the odd word belongs to a sister group inside it: all are citrus fruits except
     one stone fruit, all are string instruments except one wind instrument.
     g: the field (the odd word always comes from another group of the same field). Words never repeat
     between sister groups, so every round has exactly one odd word. */
  var FINE = [
    { id: 'citrus', g: 'fruit', label: 'פירות הדר', words: ['תפוז', 'לימון', 'אשכולית', 'קלמנטינה', 'פומלה', 'ליים', 'מנדרינה'] },
    { id: 'stone', g: 'fruit', label: 'פירות עם גלעין', words: ['אפרסק', 'שזיף', 'דובדבן', 'משמש', 'נקטרינה', 'זית', 'תמר'] },
    { id: 'berries', g: 'fruit', label: 'פירות יער', words: ['תות', 'פטל', 'אוכמניות', 'דומדמניות', 'חמוציות'] },
    { id: 'root', g: 'veg', label: 'ירקות שגדלים מתחת לאדמה', words: ['גזר', 'סלק', 'צנון', 'תפוח אדמה', 'בטטה', 'לפת', 'שום'] },
    { id: 'leafy', g: 'veg', label: 'ירקות עלים', words: ['חסה', 'כרוב', 'תרד', 'מנגולד', 'עולש', 'רוקט', 'כרוב סיני'] },
    { id: 'farm', g: 'animals', f: true, label: 'חיות משק', words: ['פרה', 'כבש', 'עז', 'חמור', 'תרנגולת', 'אווז', 'תרנגול הודו', 'שור'] },
    { id: 'wild', g: 'animals', f: true, label: 'חיות בר', words: ['אריה', 'נמר', 'זאב', 'שועל', 'צבי', 'דוב', 'צבוע', "ג'ירפה", 'זברה'] },
    { id: 'strings', g: 'music', label: 'כלי מיתר', words: ['גיטרה', 'כינור', "צ'לו", 'נבל', 'קונטרבס', 'ויולה', 'מנדולינה'] },
    { id: 'winds', g: 'music', label: 'כלי נשיפה', words: ['חליל', 'חצוצרה', 'סקסופון', 'קלרינט', 'טרומבון', 'אבוב', 'בסון', 'שופר'] },
    { id: 'drums', g: 'music', label: 'כלי הקשה', words: ['תוף', 'מצילתיים', 'קסילופון', 'דרבוקה', 'טמבורין'] },
    { id: 'north', g: 'il', f: true, label: 'ערים בצפון הארץ', words: ['צפת', 'נהריה', 'עכו', 'טבריה', 'כרמיאל', 'קריית שמונה', 'עפולה', 'נצרת'] },
    { id: 'south', g: 'il', f: true, label: 'ערים בדרום הארץ', words: ['באר שבע', 'אילת', 'דימונה', 'ערד', 'אופקים', 'שדרות', 'נתיבות', 'קריית גת'] },
    { id: 'europe', g: 'countries', f: true, label: 'ארצות באירופה', words: ['צרפת', 'איטליה', 'ספרד', 'יוון', 'גרמניה', 'הולנד', 'פולין', 'שוודיה', 'פורטוגל', 'אוסטריה'] },
    { id: 'asia', g: 'countries', f: true, label: 'ארצות באסיה', words: ['יפן', 'סין', 'הודו', 'תאילנד', 'וייטנאם', 'קוריאה', 'אינדונזיה', 'מונגוליה'] },
    { id: 'america', g: 'countries', f: true, label: 'ארצות ביבשת אמריקה', words: ['ברזיל', 'קנדה', 'ארגנטינה', 'מקסיקו', "צ'ילה", 'פרו', 'קולומביה', 'קובה'] },
    { id: 'africa', g: 'countries', f: true, label: 'ארצות באפריקה', words: ['מצרים', 'מרוקו', 'אתיופיה', 'קניה', 'ניגריה', 'טוניסיה', 'גאנה', 'דרום אפריקה'] },
    { id: 'eat', g: 'kitchen', label: 'כלי אוכל והגשה', words: ['מזלג', 'כף', 'כפית', 'צלחת', 'כוס', 'ספל', 'צלוחית', 'קנקן'] },
    { id: 'cook', g: 'kitchen', label: 'כלי בישול ואפייה', words: ['סיר', 'מחבת', 'מצקת', 'מטרפה', 'מערוך', 'פומפייה', 'מסננת', 'תבנית'] },
    { id: 'shoes', g: 'wear', label: 'סוגי נעליים', words: ['מגפיים', 'סנדלים', 'כפכפים', 'נעלי בית', 'נעלי ספורט', 'נעלי עקב'] },
    { id: 'hats', g: 'wear', label: 'כיסויי ראש', words: ['כובע', 'כומתה', 'כיפה', 'מטפחת', 'קסדה', 'כובע קש'] },
    { id: 'ball', g: 'sport', label: 'ענפי ספורט עם כדור', words: ['כדורגל', 'כדורסל', 'טניס', 'כדורעף', 'גולף', 'כדוריד', 'באולינג', 'פינג פונג'] },
    { id: 'noball', g: 'sport', label: 'ענפי ספורט בלי כדור', words: ['שחייה', 'ריצה', 'אגרוף', "ג'ודו", 'סקי', 'סיף', 'חתירה', 'הרמת משקולות'] },
    { id: 'land', g: 'transport', label: 'כלי תחבורה ביבשה', words: ['מכונית', 'אוטובוס', 'רכבת', 'אופניים', 'אופנוע', 'משאית', 'מונית', 'טרקטור'] },
    { id: 'sea', g: 'transport', label: 'כלי שיט', words: ['ספינה', 'סירה', 'מעבורת', 'צוללת', 'יאכטה', 'קאנו', 'רפסודה', 'אונייה'] },
    { id: 'air', g: 'transport', label: 'כלי טיס', words: ['מטוס', 'מסוק', 'כדור פורח', 'רחפן', 'דאון'] },
    { id: 'medical', g: 'jobs', label: 'אנשי רפואה', words: ['רופא', 'אחות', 'רוקח', 'רופא שיניים', 'פיזיותרפיסט', 'מיילדת', 'פרמדיק'] },
    { id: 'crafts', g: 'jobs', label: 'בעלי מלאכה', words: ['נגר', 'חשמלאי', 'שרברב', 'מסגר', 'סנדלר', 'חייט', 'זגג'] },
    { id: 'torah', g: 'holidays', label: 'חגים שכתובים בתורה', words: ['פסח', 'שבועות', 'סוכות', 'ראש השנה', 'יום כיפור', 'שמיני עצרת'] },
    { id: 'later', g: 'holidays', label: 'חגים שלא כתובים בתורה', words: ['חנוכה', 'פורים', 'ט"ו בשבט', 'ל"ג בעומר', 'יום העצמאות', 'יום ירושלים'] },
    { id: 'inner', g: 'body', label: 'איברים פנימיים', words: ['לב', 'ריאות', 'כבד', 'כליות', 'קיבה', 'טחול', 'מעיים'] },
    { id: 'face', g: 'body', label: 'חלקי הפנים', words: ['אף', 'עין', 'פה', 'לחי', 'מצח', 'סנטר', 'גבה', 'שפתיים'] },
    { id: 'limbs', g: 'body', label: 'חלקי הידיים והרגליים', words: ['מרפק', 'ברך', 'קרסול', 'כף רגל', 'ירך', 'עקב', 'אצבע', 'כף יד'] },
    { id: 'length', g: 'units', f: true, label: 'יחידות אורך', words: ['מטר', 'סנטימטר', 'קילומטר', 'מילימטר', "אינץ'", 'מייל'] },
    { id: 'weight', g: 'units', f: true, label: 'יחידות משקל', words: ['גרם', 'קילוגרם', 'טון', 'מיליגרם', 'ליברה', 'אונקיה'] },
    { id: 'volume', g: 'units', f: true, label: 'יחידות נפח', words: ['ליטר', 'מיליליטר', 'סמ"ק', 'גלון', 'מטר מעוקב'] },
    { id: 'goodfeel', g: 'feel', label: 'רגשות נעימים', words: ['שמחה', 'אהבה', 'תקווה', 'רוגע', 'הקלה', 'סיפוק', 'אושר'] },
    { id: 'badfeel', g: 'feel', label: 'רגשות קשים', words: ['עצב', 'כעס', 'פחד', 'קנאה', 'בושה', 'ייאוש', 'בדידות', 'אכזבה', 'דאגה'] },
    { id: 'goodtrait', g: 'trait', f: true, label: 'תכונות טובות', words: ['נדיבות', 'אומץ', 'סבלנות', 'יושר', 'ענווה', 'חריצות', 'נאמנות'] },
    { id: 'badtrait', g: 'trait', f: true, label: 'תכונות רעות', words: ['קמצנות', 'עצלות', 'יהירות', 'אנוכיות', 'רמאות', 'פחדנות', 'גסות רוח'] }
  ];
  var FINE_BY_G = {};
  FINE.forEach(function (c) { (FINE_BY_G[c.g] = FINE_BY_G[c.g] || []).push(c); });

  /* One fine round (pure, also used by tests). R has pick/shuffle; used = ids already used as the base group. */
  function pickFineRound(R, used) {
    var pool = FINE.filter(function (c) { return used.indexOf(c.id) === -1; });
    if (!pool.length) pool = FINE;
    var base = R.pick(pool);
    used.push(base.id);
    var odd = R.pick(FINE_BY_G[base.g].filter(function (c) { return c.id !== base.id; }));
    return { base: base, odd: odd, hard: true, words: R.shuffle(base.words).slice(0, 5), oddWord: R.pick(odd.words) };
  }

  /* Difficulty by level (index = level - 1).
     Levels 1-15 spread the original 10-level curve in small steps; 16-20 add new challenges. */
  var N_WORDS = [4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6,
    6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6];
  // Chance that the odd word comes from a closely related category.
  var P_HARD = [0, 0, 0, 0, 0.1, 0.2, 0.3, 0.4, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  // Rounds (out of 8) whose base group is an abstract category (feelings, traits, units...).
  // Levels 21–30 keep six words and fill more rounds with the harder kinds (abstract groups, letters).
  var ABS_ROUNDS = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 2, 2, 3, 3, 3, 4, 3, 4, 4, 4, 4, 4, 4,
    3, 3, 3, 3, 3, 2, 2, 2, 2, 1, 2, 2, 1, 1, 1, 0, 0, 1, 0, 0];
  // Rounds (out of 8) that use the second rule: "which word does not start with the same letter?".
  var LETTER_ROUNDS = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 3, 3, 3, 2, 3, 3, 3, 3, 3, 3, 3,
    3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 1, 1, 1];
  // Levels 31–50: rounds (out of 8) with sister groups of one field (FINE), more and more of them.
  // Up to level 40 the hint says that all the words share a field; from 41 only the plain hint is shown.
  var FINE_ROUNDS = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    1, 1, 2, 2, 2, 3, 3, 3, 3, 4, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6];
  // From level 19 the odd word in letter rounds starts with a look-alike or sound-alike letter.
  var NEAR = {
    'ב': ['כ', 'פ'], 'כ': ['ב', 'ק'], 'ק': ['כ'], 'פ': ['ב'], 'ט': ['ת'], 'ת': ['ט', 'ח'], 'ס': ['ש'],
    'ש': ['ס'], 'ד': ['ר'], 'ר': ['ד'], 'ה': ['ח', 'א'], 'ח': ['ה', 'ת'], 'א': ['ע', 'ה'], 'ע': ['א'],
    'ו': ['ז'], 'ז': ['ו'], 'מ': ['נ'], 'נ': ['מ', 'ג'], 'ג': ['נ'], 'י': ['ו']
  };

  /* Words by first letter, for letter rounds. Words like ג'ירפה are skipped (sound differs from the letter). */
  var BY_LETTER = {};
  CATS.forEach(function (c) {
    c.words.forEach(function (w) {
      if (w.charAt(1) === "'") return;
      var l = w.charAt(0);
      (BY_LETTER[l] = BY_LETTER[l] || []).push({ w: w, cat: c.id });
    });
  });
  function catCount(list) {
    var s = {};
    list.forEach(function (o) { s[o.cat] = true; });
    return Object.keys(s).length;
  }

  var BY_ID = {};
  CATS.forEach(function (c) { BY_ID[c.id] = c; });

  var CSS = [
    '.oo-wrap{width:100%;display:flex;flex-direction:column;align-items:center;gap:1.1rem}',
    '.oo-choices{max-width:34rem}',
    '.oo-choice{font-size:clamp(1.25rem,5vw,1.5rem);min-height:4.6rem;overflow-wrap:anywhere}',
    '.oo-explain{min-height:3.2rem;font-size:1.1rem;font-weight:600;text-align:center;text-wrap:balance;color:var(--ink);',
    'padding:.6rem 1rem;border-radius:var(--radius-sm);background:var(--surface-2);max-width:34rem;width:100%}',
    '.oo-explain:empty{background:transparent}',
    '.oo-explain.is-good{background:var(--good-soft);color:var(--good)}',
    '.oo-explain.is-bad{background:var(--bad-soft);color:var(--ink)}'
  ].join('');

  BrainGames.register({
    id: 'odd-one-out',
    name: 'מי לא שייך?',
    skill: 'language',
    tagline: 'מצאו את המילה שלא שייכת לקבוצה',
    benefit: 'חשיבה מילולית, מיון למושגים ואוצר מילים',
    instructions: [
      'קראו את כל המילים שעל המסך.',
      'רוב המילים שייכות לאותה קבוצה, למשל פירות או רהיטים.',
      'לחצו על המילה היחידה שלא שייכת לקבוצה.',
      'בשלבים מתקדמים הקבוצות קרובות יותר, ולפעמים השאלה משתנה. קראו את השאלה בכל שלב.',
      'בשלבים הגבוהים ביותר כל המילים מאותו תחום, למשל כולן ארצות, ואחת מהן מקבוצה אחרת בתוכו: ארץ באסיה בין ארצות באירופה.'
    ],
    css: CSS,
    _model: { FINE: FINE, CATS: CATS, pickFineRound: pickFineRound, FINE_ROUNDS: FINE_ROUNDS, N_WORDS: N_WORDS,
      ABS_ROUNDS: ABS_ROUNDS, LETTER_ROUNDS: LETTER_ROUNDS, P_HARD: P_HARD },
    start: function (root, ctx) {
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level) || 1)));
      var nWords = N_WORDS[level - 1];
      var pHard = P_HARD[level - 1];
      var round = 0;
      var correct = 0;
      var hardTotal = 0;
      var hardCorrect = 0;
      var usedBase = [];
      var usedLetters = [];
      var prevKind = 'cat';

      // Which rounds use the letter rule / an abstract base group (never round 1 for the letter rule).
      var kinds = [];
      var nLetter = LETTER_ROUNDS[level - 1];
      var nAbs = ABS_ROUNDS[level - 1];
      var nFine = FINE_ROUNDS[level - 1];
      var usedFine = [];
      for (var k = 0; k < ROUNDS - 1; k++) {
        kinds.push(k < nLetter ? 'letter' : k < nLetter + nAbs ? 'abs' : k < nLetter + nAbs + nFine ? 'fine' : 'cat');
      }
      kinds = ['cat'].concat(ctx.shuffle(kinds));

      function pickCats(hard, abs) {
        var pool = CATS.filter(function (c) { return usedBase.indexOf(c.id) === -1 && !!c.abs === abs; });
        if (!pool.length) pool = CATS.filter(function (c) { return !!c.abs === abs; });
        if (hard) {
          var withRel = pool.filter(function (c) { return c.rel.length > 0; });
          if (withRel.length) pool = withRel;
        }
        var base = ctx.pick(pool);
        usedBase.push(base.id);
        var odd;
        if (hard && base.rel.length) {
          odd = BY_ID[ctx.pick(base.rel)];
        } else {
          odd = ctx.pick(CATS.filter(function (c) {
            return c.id !== base.id && !c.abs && base.rel.indexOf(c.id) === -1 && c.rel.indexOf(base.id) === -1;
          }));
        }
        return { base: base, odd: odd, hard: hard && base.rel.length > 0 };
      }

      /* Letter round: nWords - 1 words starting with the same letter (from different groups),
         plus one word that starts with another letter. */
      function pickLetterRound() {
        var need = nWords - 1;
        var letters = Object.keys(BY_LETTER).filter(function (l) {
          return BY_LETTER[l].length >= need + 1 && catCount(BY_LETTER[l]) >= need;
        });
        var fresh = letters.filter(function (l) { return usedLetters.indexOf(l) === -1; });
        var letter = ctx.pick(fresh.length ? fresh : letters);
        usedLetters.push(letter);

        var usedCats = {};
        var base = [];
        var rest = [];
        ctx.shuffle(BY_LETTER[letter]).forEach(function (o) {
          if (base.length < need && !usedCats[o.cat]) { usedCats[o.cat] = true; base.push(o); }
          else rest.push(o);
        });
        while (base.length < need && rest.length) base.push(rest.shift());

        var others = [];
        var near = level >= 19 ? (NEAR[letter] || []) : [];
        near.forEach(function (l) { others = others.concat(BY_LETTER[l] || []); });
        if (!others.length) {
          Object.keys(BY_LETTER).forEach(function (l) { if (l !== letter) others = others.concat(BY_LETTER[l]); });
        }
        // Prefer an odd word from the same group as one of the others, so the group gives no clue.
        var sameGroup = others.filter(function (o) { return usedCats[o.cat]; });
        var odd = ctx.pick(sameGroup.length ? sameGroup : others);
        return { letter: letter, words: base.map(function (o) { return o.w; }), oddWord: odd.w, oddLetter: odd.w.charAt(0) };
      }

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          var note = hardTotal > 0
            ? 'בסבבים עם קבוצות קרובות: ' + hardCorrect + ' מתוך ' + hardTotal + ' נכונות.'
            : 'מצאתם ' + correct + ' מילים יוצאות דופן מתוך ' + ROUNDS + '.';
          ctx.finish({ correct: correct, total: ROUNDS, note: note });
          return;
        }
        ctx.setProgress(round, ROUNDS);

        var kind = kinds[round - 1] || 'cat';
        var isLetter = kind === 'letter';
        var isFine = kind === 'fine';
        var changed = level >= 18 && (isLetter ? 'letter' : 'cat') !== prevKind;
        prevKind = isLetter ? 'letter' : 'cat';

        var pickRes, base, odd, words, oddWord, lr;
        if (isLetter) {
          lr = pickLetterRound();
          words = lr.words;
          oddWord = lr.oddWord;
          pickRes = { hard: false };
          ctx.setStatus((changed ? 'שימו לב, שאלה אחרת: ' : '') + 'איזו מילה לא מתחילה באותה אות?');
        } else if (isFine) {
          pickRes = pickFineRound(ctx, usedFine);
          base = pickRes.base;
          odd = pickRes.odd;
          hardTotal++;
          words = pickRes.words;
          oddWord = pickRes.oddWord;
          ctx.setStatus((changed ? 'שימו לב, חוזרים לשאלה: ' : '') + 'איזו מילה לא שייכת?');
        } else {
          pickRes = pickCats(Math.random() < pHard, kind === 'abs');
          base = pickRes.base;
          odd = pickRes.odd;
          if (pickRes.hard) hardTotal++;
          words = ctx.shuffle(base.words).slice(0, nWords - 1);
          oddWord = ctx.pick(odd.words);
          ctx.setStatus((changed ? 'שימו לב, חוזרים לשאלה: ' : '') + 'איזו מילה לא שייכת?');
        }
        var all = ctx.shuffle(words.concat([oddWord]));

        var explain = ctx.el('p', { class: 'oo-explain', 'aria-live': 'polite' });
        var buttons = [];
        var answered = false;

        var choices = ctx.el('div', { class: 'g-choices oo-choices' });
        all.forEach(function (w) {
          var b = ctx.el('button', {
            class: 'g-choice oo-choice',
            type: 'button',
            text: w,
            onclick: function () { answer(w, b); }
          });
          buttons.push({ word: w, btn: b });
          choices.appendChild(b);
        });

        root.innerHTML = '';
        root.appendChild(ctx.el('div', { class: 'oo-wrap' }, [
          ctx.el('p', { class: 'g-hint', text: isLetter
            ? 'כל המילים חוץ מאחת מתחילות באותה אות. בדקו רק את האות הראשונה.'
            : isFine && level <= 40 ? 'כל המילים מאותו תחום, אבל אחת מקבוצה אחרת בתוכו.'
            : 'כל המילים חוץ מאחת שייכות לאותה קבוצה.' }),
          choices,
          explain
        ]));

        function answer(w, btn) {
          if (answered) return;
          answered = true;
          buttons.forEach(function (o) { o.btn.disabled = true; });
          var ok = w === oddWord;
          var reason = isLetter
            ? 'כל השאר מתחילות באות ' + lr.letter + '. המילה "' + oddWord + '" מתחילה באות ' + lr.oddLetter + '.'
            : (base.f ? 'כל השאר הן ' : 'כל השאר הם ') + base.label +
              '. המילה "' + oddWord + '" שייכת ל' + odd.label + '.';
          buttons.forEach(function (o) {
            if (o.word === oddWord) o.btn.classList.add('is-correct');
          });
          if (ok) {
            correct++;
            if (pickRes.hard) hardCorrect++;
            explain.className = 'oo-explain is-good';
            explain.textContent = 'נכון! ' + reason;
          } else {
            btn.classList.add('is-wrong');
            explain.className = 'oo-explain is-bad';
            explain.textContent = reason;
          }
          ctx.feedback(ok, ok ? null : 'לא הפעם. "' + oddWord + '" היא המילה שלא שייכת.')
            .then(function () { return ctx.wait(ok ? 900 : 2200); })
            .then(nextRound);
        }
      }

      nextRound();
      return function cleanup() { root.innerHTML = ''; };
    }
  });
})();
