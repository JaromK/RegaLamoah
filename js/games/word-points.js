/* מילים בנקודות — build a Hebrew word from letter tiles on a row of bonus squares (language).
   Every tile has points; some squares double or triple a letter or the whole word. Untimed. */
(function () {
  'use strict';

  var ROUNDS = 5;

  /* Words the game accepts (standard ktiv male, 2–8 letters), gathered from the other games'
     word lists plus common everyday words. Final letters are compared as regular letters. */
  var DICT = 'אב אבא אבוקדו אבטיח אביון אבן אגודל אגם אגס אגסים אגרוף אדום אדיב אהב אהבה אוהל אווירה אוזן אוטובוס אויב אוכל' +
    ' אוכמניות אומץ אונייה אוסטרליה אופה אופנוע אופניים אוקיינוס אור אורז אורן אושר אות אותיות אז אח אחד אחות אחיין' +
    ' אחריות אחת אי איום איטי איטליה אייל אילת אימה אינטרנט איש אישה איתן אך אכזבה אכל אלון אלמוני אם אמא אמבולנס' +
    ' אמבטיה אמיד אמיץ אמנון אמסטרדם אמר אמת אנגליה אננס אנפה אסף אסר אף אפה אפונה אפור אפל אפלה אפרסק אפרסקים אפשר' +
    ' אצבע אקדח אקורדיון אקליפטוס ארגון ארגז ארגנטינה ארובה ארוחה ארוך ארון ארז אריה ארכיון ארמון ארנב ארנק ארץ אש' +
    ' אשדוד אשכולית אשל אשקלון אתונה אתמול בא באגט באיטיות בבקשה בגד בגוף בדידות בהיר בובה בוגדני בודפשט בוטנים בוקר' +
    ' בורג בורדו בורי בורקס בושה בטוח בטטה בטלן בטן ביאר ביוב ביטוח בייגל בייגלה ביישנות בימה בינה ביסלי ביצה ביצוע' +
    ' ביצים ביקור ביקר בירה בירור בישל בית בכה בלון במבה במהירות במקום בן בנה בננה בננות בנק בעל בצוותא בצל בקבוק' +
    ' ברבור ברד ברווז ברוקולי ברוש ברזיל ברזל בריאות ברך ברלין ברק ברשימה בשפע בשר בת גאווה גב גבוה גבינה גביע גבעה' +
    ' גג גדול גדוש גדל גובה גוון גוזל גולה גולף גומה גומי גונן גוף גופייה גור גורילה גורל גזר גיחך גיטרה גילה גינה' +
    ' גל גלגל גלגלת גלויה גלידה גלים גלימה גלעין גלריה גלשן גם גמל גמר גן גנן געגוע גרב גרביים גרון גרזן גרם גרמניה' +
    ' גשם גשר דב דבורה דבק דבש דג דגים דגימה דגירה דגל דגם דגן דהר דואר דוב דובדבן דובדבנים דובי דוד דודה דוור' +
    ' דולפין דומם דחוק דיבר דייג דילג דימונה דל דלי דליל דליפה דלעת דלפק דלק דלקת דלת דם דממה דניס דף דקה דקל דרור' +
    ' דרך האותיות הבאה הבהיר הביט הבין הגביר הגדיל הגון הגיע הגן הדור הודו הולנד הומה הון הורים הזדמנות הזדרז החביא' +
    ' החל החמיא החריב היום הילל היפופוטם היתולי הלאה הלך המבורגר המולה המציאות המשיך המתין הנאה הסביר הסכים הסתיר' +
    ' הסתכל העניק הפחית הפסיד הפסיק הפריע הפתעה הצליח הקטין הקים הקלה הר הרבה הרהר הרס הרצליה הרשה השיב השליך השלים' +
    ' השתהה השתתפות התבונן התחיל התחלה התיר התמהמה התעמלות התרגשות וופלים וטרינר וילון וינה ומקום ומשחק ופל ורד ורוד' +
    ' ושתייה זאב זבוב זברה זהב זוהר זועם זחל זיתים זכה זכר זמר זניח זעיר זעם זעק זקן זר זריז זריחה זרק חביתה חבצלת' +
    ' חבר חברה חג חגב חגורה חד חדגוני חדווה חדיש חדל חדר חדרה חדש חודש חוזה חוזק חוט חוכמה חול חולי חולים חולצה' +
    ' חולשה חום חומה חומוס חוף חושך חותמת חותן חזק חזר חי חיבב חיים חיכה חילזון חיפה חיפושית חיפש חיש חכם חלב חלול' +
    ' חלום חלון חלוץ חלוק חלזון חליל חליפה חלל חלקה חלש חם חמאה חמור חמנייה חמסין חן חנוכה חנות חסה חסון חסידה חפץ' +
    ' חצאית חצוף חצוצרה חציל חצילים חקלאי חרון חרוץ חריצות חרישי חרצית חשב חשבון חשוב חשוך חשמל חשמלאי חשף חשש חתול' +
    ' חתונה חתירה חתן טבח טבעת טבריה טוב טווס טון טונה טורקיה טורקיז טוש טחינה טיול טייל טייס טיל טיפה טיפס טיפש' +
    ' טירה טירמיסו טכנאי טל טלוויזיה טלסקופ טלפון טניס טס טעות טעים טפל טרומבון טריאתלון טרקטור יבש יבשת יגון יגע יד' +
    ' ידוע ידיד ידע יהיר יהירות יהלום יוגה יוון יום יונה יושר יחד ייאוש ייבב יין ילד ילדה ילקוט ים ינשוף יסמין יער' +
    ' יפה יפן יצא ירד ירוק ירושלים ירח יריב ירפה ישב ישיש ישן ישר יתוש כאב כבאי כבאית כביר כביש כבש כבשה כד כדור' +
    ' כדורגל כדוריד כדורסל כדורעף כובע כוונה כוורת כוח כוכב כונן כוננית כוס כועס כורסה כותל כותרת כזב כחול כחוש' +
    ' כינור כיסא כל כלב כלה כלוב כלור כלי כליה כלכלה כלל כלנית כן כנראה כסיל כסף כעס כעת כף כפית כפפה כפפות כפר כרוב' +
    ' כרובית כרוז כרזה כרטיס כריך כריש כרית כרך כרכרה כרם כרס כתב כתובת כתום כתף כתר לא לאט לב לבד לבוש לביבה לבן' +
    ' לבש לה להחזיר לוהט לוויתן לוטרה לונדון לוקוס לזיהוי לח לחוד לחם לחש לטאה ליבנה ליגה ליווי ליטוף ליטר לילה לימד' +
    ' לימון לימונדה לימונים ליסבון ליצן ליקוי ליקט למד לפתע לקח לשון מאוורר מאוחר מאושר מאזניים מאפינס מבחנה מברג' +
    ' מגדל מגהץ מגנט מגף מגפיים מגרפה מדבר מדוכדך מדף מדפסת מדרגות מדריד מהדק מהולל מהותי מהזיכרון מהיר מהנדס מהר' +
    ' מואר מוזר מוח מונית מוס מופלא מוקדם מורא מורה מורכב מושט מזגן מזוהם מזוודה מזון מזכירה מזלג מזרקה מחברת מחבת' +
    ' מחדד מחל מחלה מחק מחר מחרוזת מחריד מחשב מחשבון מטאטא מטבח מטבע מטוטלת מטונף מטוס מטמון מטפה מטפחת מטר מטרה' +
    ' מטרייה מטרפה מיאן מיהר מיושן מיותרות מיותרת מיטה מייגע מיליליטר מילימטר מים מיץ מיקרוגל מכאוב מכולת מכונית' +
    ' מכוער מכוש מכחול מכלול מכנסיים מכסה מכר מכרז מכשיר מכתב מכתש מלא מלאווח מלאכה מלבוש מלוכלך מלון מלח מלחמה' +
    ' מלטשת מלפפון מלפפונים מלצר ממון מנגו מנוחה מנומס מנורה מנחה מנעול מסובך מסוק מסור מסיבה מסלול מסננת מסע מספרה' +
    ' מספריים מעבורת מעדר מעון מעט מעטפה מעיל מענה מעניין מערה מערוך מעשייה מפוחית מפורסם מפל מפעל מפרשית מפתח מצא' +
    ' מצוחצח מצוי מצחיק מצילתיים מצלמה מצפן מצקת מצרים מקדחה מקום מקלדת מקלחת מקסיקו מקרר מראה מרווח מרפאה מרפסת' +
    ' מרפק מרק מרשמלו מרתף מרתק משאית משגה משונה משחק משי משכורת משכן משמעות משמעותי משמש משעמם משענת משעשע משפחה' +
    ' משפט משקל משקפיים מת מתכון מתכנת מתמהמה מתנה מתנשא נאה נאות נאמן נאמנות נבוב נבון נבל נגר נדיב נדיבות נדיר נהג' +
    ' נהדר נהר נוגה נודע נוכל נועז נוקשה נורא נורה נורית נזם נח נחפז נחש נטל נטש ניידת נינוח ניצח ניקה נישא נכד נכדה' +
    ' נכדים נכנס נכשל נמוך נמלה נמר נסע נעורים נעילה נעימה נעל נעליים נענע נעץ נער נערה נפוץ נפלא נצרת נקי נקניקיות' +
    ' נקניקייה נר נרגז נרחב נרקיס נשר נתיב נתן נתניה סבא סבוך סבון סביבה סביון סביח סבך סבל סבלנות סברה סבתא סגול' +
    ' סגר סוד סודה סוודר סוכות סוכר סוכריות סוכרייה סוללה סוללות סולם סוס סוף סופגניות סופגנייה סופה סחלב סיום סיוע' +
    ' סיים סייע סיכה סיכון סין סיף סיפור סיר סירב סירה סכין סכנה סל סלח סלט סליחה סלמון סלע סלק סנאי סנדל סנונית' +
    ' סנטימטר סנטר סף ספה ספוג ספוגים ספורט ספינה ספל ספסל ספק ספר ספרד ספרייה ספרים ספרנית סקי סקסופון סקרנות סרגל' +
    ' סרדין סרטן עבד עבודה עגבניות עגבנייה עגול עגום עגורן עגיל עגילים עגינה עגלה עגלון עד עוגב עוגה עוגיות עוגייה' +
    ' עוגן עונג עוף עוצמה עור עורב עז עזב עזר עזרה עט עטלף עייף עין עיפרון עיר עיתון עיתונאי עכביש עכבר עכו עכשיו' +
    ' עלה עליז עליצות עם עמד עמוס עמל עמק ענב ענבים ענה ענוג ענווה עני עניבה עניו ענן ענק עפולה עפעף עץ עצב עצוב' +
    ' עצום עצל עצלות עצלן עצמאות עקרב עקשנות ערב ערמון ערמונים ערפל ערק עשור עשיר עתה עתיק פאזל פארק פה פודינג' +
    ' פומפייה פופקורן פורטוגל פורים פורל פח פחד פחדן פטיש פטריות פטרייה פיגום פיוס פיזר פיל פינגווין פינה פיצה פיקוח' +
    ' פיקוס פיקח פירות פיתה פיתוי פיתות פך פלאפל פלמינגו פלס פלפל פלפלים פנס פסח פסטה פסיכולוג פסנתר פעוט פעם פעמון' +
    ' פראג פרג פרגוד פרדס פרה פרוזדור פרוסה פרח פרי פריז פרס פרפר פרק פשוט פתאום פתח פתיתים צב צבא צבי צביון צביטה' +
    ' צבירה צבע צבעוני צבר צבת צדף צהוב צהריים צוהל צוואר צוללת צונן צחיח צחק צייר ציפור ציפורן צלחת צלם צמח צמיד' +
    ' צמצם צמר צנום צנון צנוע צעיף צעיר צעק צער צפצפה צפרדע צפת צר צרח צרעה צרפת צרצר קהילה קו קובה קובייה קוטר קולב' +
    ' קולה קולפן קומה קומקום קוסם קוף קופה קוקוס קורה קורנס קורנפלקס קורקינט קטן קטנוע קטנטן קיבץ קיווי קילוגרם' +
    ' קילומטר קיפוד קיר קישוא קישוט קל קלמנטינה קלמר קלקל קלרינט קם קמצן קמצנות קן קנאה קנגורו קנדה קנה קניות קערה' +
    ' קפה קפץ קץ קציצה קצר קצת קקטוס קר קרא קרב קרואסון קרחון קרנף קרסול קרפיון קשה קשיח קשיש קשת ראה ראש ראשית רב' +
    ' רגוע רגיל רגל רדיו רוב רוויה רוח רוחב רוטב רומא רומן רוסיה רועש רופא רופאה רוקח רושם רותח רז רזה רחב רחוב' +
    ' רחובות רחץ רטוב ריאות ריבה רימון ריסים ריצה ריק ריקה ריקוד רך רכבל רכבת רכיבה רכש רם רמאי רמזור רמזים רע רעם' +
    ' רענן רעננה רעש רפה רץ רצה רצפה רק רקד רקפת שאון שאל שאלה שבוע שבועות שבר שבת שגיאה שגרתי שגשג שד שדה שוב' +
    ' שווארמה שווייץ שוחח שוטה שוטר שולחן שולי שום שועל שוק שוקו שוקולד שור שזיף שחור שחייה שחמט שחף שחצן שחקן שט' +
    ' שטיח שטף שי שיבח שידה שיחק שילם שימורים שימפנזה שינה שיפץ שיר שכח שכיח שכנים שכתבתם שלב שלג שלד שלה שלו שלווה' +
    ' שלולית שלום שלושה שלט שלכת שם שמורה שמח שמחה שמיים שמיכה שמלה שמן שמנת שמע שמפו שמר שמרטף שמש שן שנא שנה שנייה' +
    ' שניצל שעה שעון שעועית שפירית שפתיים שקדן שקט שקיעה שקית שקמה שקר שקרן שקשוקה שר שרב שרברב שרימפס שרפרף שרשרת' +
    ' שתה שתייה שתק תאומים תאונה תאנה תאריך תבונה תדיר תה תודה תוכי תוכנית תום תוף תות תותים תחבורה תחילה תיעב תיק' +
    ' תיקן תירס תכלת תל תליון תלתן תמוה תמיד תמנון תנור תנין תעודה תעוזה תפאורה תפוז תפוזים תפוח תפוחים תפוקה תפזורת' +
    ' תפילה תפנית תפס תפקיד תפריט תקווה תקרה תרופה תרנגול תרנגולת תשובה תשורה תשוש';

  var TO_REG = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
  var TO_FIN = { 'כ': 'ך', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ' };
  function norm(w) { return w.split('').map(function (c) { return TO_REG[c] || c; }).join(''); }
  function withFinal(s) {
    var l = s.charAt(s.length - 1);
    return TO_FIN[l] ? s.slice(0, -1) + TO_FIN[l] : s;
  }

  var WORDS = {};      // normalized -> display form
  var LIST = [];
  DICT.split(' ').forEach(function (w) {
    if (!w) return;
    var n = norm(w);
    if (!WORDS[n]) { WORDS[n] = w; LIST.push(n); }
  });

  // Points per letter: common letters 1, less common 2, rare 3.
  var VALUE = {};
  'אהוילמנרשת'.split('').forEach(function (l) { VALUE[l] = 1; });
  'בדכעקס'.split('').forEach(function (l) { VALUE[l] = 2; });
  'גזחטפצ'.split('').forEach(function (l) { VALUE[l] = 3; });
  // Extra tiles are drawn mostly from common letters.
  var FILL = 'אאההווייללממננררששתתבדכעקסגזחטפצ';

  /* Bonus squares by row length (index 0 = the first, rightmost square). */
  var BONUS = {
    5: ['', 'L2', '', '', 'W2'],
    6: ['', 'L2', '', 'W2', '', 'L3'],
    7: ['', 'L2', '', 'W2', '', 'L3', ''],
    8: ['', 'L2', '', 'W2', '', 'L3', '', 'W2']
  };
  var BONUS_TEXT = { L2: 'אות פי 2', L3: 'אות פי 3', W2: 'מילה פי 2' };

  /* Per level (1–30): tiles in the rack (= squares on the row), and the goal:
     len = a word of at least that many letters (bonuses shown but not needed),
     pts = at least that share of the best possible score with these tiles (1 = the best word). */
  var LEVELS = [
    { r: 5, len: 2 }, { r: 5, len: 3 }, { r: 6, len: 3 }, { r: 6, len: 3 }, { r: 6, len: 4 },   // 1–5
    { r: 6, len: 4 }, { r: 7, len: 4 }, { r: 7, len: 4 }, { r: 6, pts: 0.4 }, { r: 6, pts: 0.45 }, // 6–10
    { r: 7, pts: 0.45 }, { r: 7, pts: 0.5 }, { r: 7, pts: 0.55 }, { r: 7, pts: 0.6 }, { r: 7, pts: 0.65 }, // 11–15
    { r: 8, pts: 0.6 }, { r: 8, pts: 0.65 }, { r: 8, pts: 0.7 }, { r: 8, pts: 0.72 }, { r: 8, pts: 0.75 }, // 16–20
    { r: 8, pts: 0.78 }, { r: 8, pts: 0.8 }, { r: 8, pts: 0.83 }, { r: 8, pts: 0.85 }, { r: 8, pts: 0.88 }, // 21–25
    { r: 8, pts: 0.9 }, { r: 8, pts: 0.93 }, { r: 8, pts: 0.95 }, { r: 8, pts: 0.97 }, { r: 8, pts: 1 }      // 26–30
  ];

  function score(word, bonus) {
    var sum = 0, wm = 1;
    for (var i = 0; i < word.length; i++) {
      var v = VALUE[word.charAt(i)] || 1, b = bonus[i];
      sum += v * (b === 'L2' ? 2 : b === 'L3' ? 3 : 1);
      if (b === 'W2') wm *= 2;
    }
    return sum * wm;
  }

  function canMake(word, rack) {
    var left = rack.slice();
    for (var i = 0; i < word.length; i++) {
      var k = left.indexOf(word.charAt(i));
      if (k === -1) return false;
      left.splice(k, 1);
    }
    return true;
  }

  /* All dictionary words the rack can make, best first. */
  function options(rack, bonus) {
    return LIST.filter(function (w) { return w.length <= rack.length && canMake(w, rack); })
      .map(function (w) { return { w: w, s: score(w, bonus) }; })
      .sort(function (a, b) { return b.s - a.s || b.w.length - a.w.length; });
  }

  /* A rack built around a real word, so there is always a good answer. */
  function makeRack(spec, pick, shuffle) {
    var bonus = BONUS[spec.r];
    for (var t = 0; t < 200; t++) {
      var minL = spec.len || 3;
      var pool = LIST.filter(function (w) { return w.length >= minL && w.length <= spec.r; });
      var seed = pick(pool);
      var rack = seed.split('');
      while (rack.length < spec.r) rack.push(pick(FILL.split('')));
      rack = shuffle(rack);
      var opts = options(rack, bonus);
      var ok = spec.len ? opts.filter(function (o) { return o.w.length >= spec.len; }) : opts;
      if (!ok.length) continue;
      var best = opts[0].s;
      var goal = spec.len ? 0 : Math.max(2, Math.ceil(best * spec.pts));
      return { rack: rack, bonus: bonus, opts: opts, best: best, goal: goal };
    }
    return null;
  }

  var css = [
    '.wpt-wrap{width:100%;display:flex;flex-direction:column;align-items:center;gap:.7rem;}',
    '.wpt-explain:not(:empty)~.wpt-score{display:none;}',
    '.wpt-wrap .g-actions{flex-wrap:nowrap;gap:.5rem;}',
    '.wpt-wrap .g-actions .btn{min-width:0;padding-inline:.9rem;}',
    '.wpt-goal{margin:0;font-size:1.2rem;font-weight:800;text-align:center;background:var(--language-soft);color:var(--language);',
    'padding:.35rem 1rem;border-radius:999px;}',
    '.wpt-row{display:grid;grid-template-columns:repeat(4,minmax(0,3.6rem));gap:.45rem;justify-content:center;direction:rtl;width:100%;}',
    '.wpt-sq{position:relative;height:3.5rem;border-radius:var(--radius-sm);border:2px dashed var(--line);background:var(--surface-2);',
    'display:grid;place-items:center;padding:0;font-family:var(--font-display);font-weight:900;font-size:1.9rem;color:var(--ink);cursor:pointer;}',
    '.wpt-sq:disabled{cursor:default;}',
    '.wpt-sq.b-L2{background:var(--logic-soft);border-color:var(--logic);}',
    '.wpt-sq.b-L3{background:var(--memory-soft);border-color:var(--memory);}',
    '.wpt-sq.b-W2{background:var(--attention-soft);border-color:var(--attention);}',
    '.wpt-sq .wpt-b{position:absolute;bottom:2px;inset-inline:0;font-family:var(--font-body);font-size:.7rem;font-weight:800;color:var(--ink-soft);line-height:1;}',
    '.wpt-sq.is-filled{border-style:solid;background:var(--surface);}',
    '.wpt-sq.is-filled .wpt-b{display:none;}',
    '.wpt-rack{display:grid;grid-template-columns:repeat(4,minmax(0,3.6rem));gap:.5rem;justify-content:center;direction:rtl;width:100%;}',
    '.wpt-tile{position:relative;height:3.6rem;padding:0;border-radius:var(--radius-sm);border:2px solid var(--sun);background:var(--sun-soft);',
    'box-shadow:var(--shadow);font-family:var(--font-display);font-weight:900;font-size:2rem;color:var(--ink);cursor:pointer;line-height:1;}',
    '.wpt-tile.is-used{visibility:hidden;}',
    '.wpt-v,.wpt-sq .wpt-v{position:absolute;bottom:3px;left:5px;font-family:var(--font-body);font-size:.8rem;font-weight:800;color:var(--ink-soft);}',
    '.wpt-score{margin:0;font-size:1.15rem;font-weight:800;text-align:center;font-variant-numeric:tabular-nums;min-height:1.5rem;}',
    '.wpt-explain{margin:0;font-size:1.1rem;font-weight:600;text-align:center;text-wrap:balance;padding:.35rem .8rem;border-radius:var(--radius-sm);width:100%;max-width:30rem;}',
    '.wpt-explain:empty{display:none;}',
    '.wpt-explain.is-good{background:var(--good-soft);color:var(--good);}',
    '.wpt-explain.is-bad{background:var(--bad-soft);color:var(--ink);}',
    '.wpt-explain.is-info{background:var(--surface-2);}'
  ].join('');

  BrainGames.register({
    id: 'word-points',
    name: 'מילים בנקודות',
    skill: 'language',
    tagline: 'בנו מילה מהאותיות וצברו נקודות',
    benefit: 'שליפת מילים, איות ותכנון',
    startLevel: 1,
    instructions: [
      'למטה יש אותיות, ולכל אות מספר נקודות (בפינה).',
      'לחצו על אותיות כדי לבנות מילה בשורה, מימין לשמאל. משבצות צבעוניות מכפילות נקודות.',
      'לחיצה על אות בשורה מחזירה אותה. כשהמילה מוכנה לחצו "זו המילה".',
      'בהתחלה צריך מילה באורך מסוים, ובהמשך מספר נקודות. אין שעון.'
    ],
    css: css,
    _model: { LIST: LIST, score: score, options: options, makeRack: makeRack, LEVELS: LEVELS },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var round = 0, correct = 0, helped = 0;
      var usedSeeds = {};

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({
            correct: correct, total: ROUNDS,
            note: 'הצלחתם ב-' + correct + ' מתוך ' + ROUNDS + ' סבבים' + (helped ? ' (ב-' + helped + ' בעזרת רמז)' : '')
          });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var R;
        for (var t = 0; t < 10; t++) {
          R = makeRack(spec, ctx.pick, ctx.shuffle);
          if (R && !usedSeeds[R.rack.slice().sort().join('')]) break;
        }
        usedSeeds[R.rack.slice().sort().join('')] = true;
        play(R);
      }

      function play(R) {
        root.innerHTML = '';
        var n = R.rack.length;
        var slots = [];          // tile index per square, or -1
        for (var i = 0; i < n; i++) slots.push(-1);
        var used = R.rack.map(function () { return false; });
        var answered = false, hinted = false, misses = 0;

        var goalText = spec.len ? 'בנו מילה של ' + spec.len + ' אותיות או יותר' : 'השיגו לפחות ' + R.goal + ' נקודות';
        var goal = el('p', { class: 'wpt-goal' }, goalText);
        var squares = R.bonus.map(function (b, j) {
          return el('button', { class: 'wpt-sq' + (b ? ' b-' + b : ''), type: 'button', onclick: function () { onSquare(j); } });
        });
        var row = el('div', { class: 'wpt-row', 'aria-label': 'שורת המילה' }, squares);
        var tiles = R.rack.map(function (l, ti) {
          return el('button', { class: 'wpt-tile', type: 'button', 'aria-label': 'האות ' + l + ', ' + VALUE[l] + ' נקודות', onclick: function () { onTile(ti); } },
            [l, el('span', { class: 'wpt-v', 'aria-hidden': 'true' }, String(VALUE[l]))]);
        });
        var rack = el('div', { class: 'wpt-rack', 'aria-label': 'האותיות שלכם' }, tiles);
        var scoreLine = el('p', { class: 'wpt-score', 'aria-live': 'polite' });
        var explain = el('p', { class: 'wpt-explain', 'aria-live': 'polite' });
        var submitBtn = el('button', { class: 'btn btn-primary', type: 'button', onclick: submit }, 'זו המילה');
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var giveUpBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: giveUp }, 'הראו לי');
        var actions = el('div', { class: 'g-actions' }, [submitBtn, hintBtn, giveUpBtn]);

        ctx.setStatus(spec.len ? 'בנו מילה מהאותיות' : 'בנו מילה ששווה מספיק נקודות');
        // a message takes the score line's place (see css), so the board does not grow mid-round
        root.appendChild(el('div', { class: 'wpt-wrap' }, [goal, row, explain, scoreLine, rack, actions]));
        render();

        function word() {
          var s = '';
          for (var j = 0; j < n && slots[j] !== -1; j++) s += R.rack[slots[j]];
          return s;
        }

        function render() {
          var w = word();
          squares.forEach(function (sq, j) {
            var ti = slots[j];
            sq.innerHTML = '';
            sq.classList.toggle('is-filled', ti !== -1);
            if (ti !== -1) {
              var l = R.rack[ti];
              var isLast = j === n - 1 || slots[j + 1] === -1;
              sq.appendChild(document.createTextNode(isLast && TO_FIN[l] ? TO_FIN[l] : l));
              sq.appendChild(el('span', { class: 'wpt-v', 'aria-hidden': 'true' }, String(VALUE[l])));
            } else if (R.bonus[j]) {
              sq.appendChild(el('span', { class: 'wpt-b' }, BONUS_TEXT[R.bonus[j]]));
            }
            sq.disabled = answered || ti === -1;
          });
          tiles.forEach(function (t, ti) { t.classList.toggle('is-used', used[ti]); t.disabled = answered || used[ti]; });
          scoreLine.textContent = w.length ? '"' + withFinal(w) + '" · ' + score(w, R.bonus) + ' נקודות' : '';
          submitBtn.disabled = answered || w.length < 2;
          hintBtn.disabled = answered;
          giveUpBtn.disabled = answered;
        }

        function onTile(ti) {
          if (answered || used[ti]) return;
          var j = slots.indexOf(-1);
          if (j === -1) return;
          ctx.sound('tap');
          slots[j] = ti; used[ti] = true;
          explain.className = 'wpt-explain'; explain.textContent = '';
          render();
        }

        // Removing a letter from the middle closes the gap, so the word stays in one piece.
        function onSquare(j) {
          if (answered || slots[j] === -1) return;
          used[slots[j]] = false;
          slots.splice(j, 1);
          slots.push(-1);
          render();
        }

        function goodEnough(w) {
          return spec.len ? w.length >= spec.len : score(w, R.bonus) >= R.goal;
        }

        function bestFitting() {
          return R.opts.filter(function (o) { return goodEnough(o.w); })[0];
        }

        function submit() {
          if (answered) return;
          var w = word();
          if (!WORDS[w]) {
            explain.className = 'wpt-explain is-bad';
            explain.textContent = '"' + withFinal(w) + '" לא במילון של המשחק. נסו מילה אחרת.';
            ctx.feedback(false, 'נסו מילה אחרת');
            return;
          }
          if (!goodEnough(w)) {
            misses++;
            explain.className = 'wpt-explain is-bad';
            explain.textContent = spec.len
              ? '"' + WORDS[w] + '" היא מילה, אבל צריך לפחות ' + spec.len + ' אותיות.'
              : '"' + WORDS[w] + '" שווה ' + score(w, R.bonus) + ' נקודות. צריך לפחות ' + R.goal + '.';
            ctx.feedback(false, 'עוד לא מספיק');
            return;
          }
          finishRound(true, w);
        }

        function hint() {
          if (answered) return;
          var b = bestFitting();
          // clear the row and put the first letter of a good word in place
          slots.forEach(function (ti) { if (ti !== -1) used[ti] = false; });
          for (var j = 0; j < n; j++) slots[j] = -1;
          var first = b.w.charAt(0), ti = -1;
          R.rack.forEach(function (l, k) { if (ti === -1 && l === first) ti = k; });
          slots[0] = ti; used[ti] = true;
          hinted = true;
          explain.className = 'wpt-explain is-info';
          explain.textContent = 'יש מילה טובה שמתחילה ב"' + first + '" ויש בה ' + b.w.length + ' אותיות.';
          render();
        }

        function giveUp() { if (!answered) finishRound(false, null); }

        function finishRound(ok, w) {
          answered = true;
          if (ok) { correct++; if (hinted) helped++; }
          var best = R.opts[0];
          var b = bestFitting();
          explain.className = 'wpt-explain ' + (ok ? 'is-good' : 'is-info');
          explain.textContent = ok
            ? 'מצוין! "' + WORDS[w] + '" שווה ' + score(w, R.bonus) + ' נקודות.' +
              (best.w !== w ? ' המילה הכי שווה כאן: "' + WORDS[best.w] + '" (' + best.s + ').' : ' זו המילה הכי שווה!')
            : 'למשל: "' + WORDS[b.w] + '" (' + b.s + ' נקודות).' + (best.w !== b.w ? ' הכי שווה: "' + WORDS[best.w] + '" (' + best.s + ').' : '');
          render();
          ctx.feedback(ok, ok ? undefined : 'למשל: ' + WORDS[b.w]).then(function () {
            var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { next.disabled = true; nextRound(); } },
              round >= ROUNDS ? 'לסיכום' : 'הלאה');
            actions.innerHTML = '';
            actions.appendChild(next);
          });
        }
      }

      nextRound();
    }
  });
})();
