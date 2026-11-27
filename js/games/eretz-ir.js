/* ארץ עיר — the classic: one letter, and for each category (country, city, animal, plant, name, profession,
   vehicle…) type a word that starts with it. The game checks the word against its lists, forgiving small
   spelling differences; a word it does not know can still be accepted by the player (language). Untimed. */
(function () {
  'use strict';

  /* Categories in the order they open up with the levels. Words: space-separated, "_" = a space inside a name. */
  var CATS = [
    { id: 'land', name: 'ארץ', words: 'אנגליה אוסטרליה אוסטריה איטליה אירלנד איסלנד אינדונזיה איראן אוקראינה אוגנדה אלג׳יריה ארגנטינה ארמניה אתיופיה אקוודור ' +
      'ברזיל בלגיה בולגריה בוליביה בריטניה בלארוס גרמניה גאנה גאורגיה גוואטמלה גרינלנד דנמרק דרום_אפריקה דרום_קוריאה הולנד הודו הונגריה האיטי ' +
      'וייטנאם ונצואלה ויילס זמביה זימבבואה חילה טורקיה טנזניה טייוואן טוניסיה יפן יוון ירדן ישראל כוויית קטאר לבנון לוב לטביה ליטא לוקסמבורג ' +
      'מצרים מקסיקו מרוקו מונגוליה מלזיה מלטה מולדובה נורבגיה ניגריה נפאל ניו_זילנד ניקרגואה סין ספרד סוריה סקוטלנד סרביה סלובניה סלובקיה סודן ' +
      'סינגפור סעודיה עיראק עומאן פולין פורטוגל פרו פינלנד פקיסטן פנמה פיליפינים פרגוואי צרפת צ׳כיה צ׳ילה קנדה קפריסין קובה קניה קולומביה ' +
      'קמבודיה קרואטיה קזחסטן רוסיה רומניה רואנדה שוודיה שווייץ תאילנד תוניסיה תימן טורקמניסטן' },
    { id: 'city', name: 'עיר', words: 'אילת אשדוד אשקלון אריאל אום_אל_פחם אופקים אור_יהודה אמסטרדם אתונה אנקרה ' +
      'באר_שבע בני_ברק בת_ים בית_שמש בית_שאן ברלין בודפשט ברצלונה בוקרשט בריסל בוסטון גבעתיים גדרה גבעת_שמואל ג׳נבה ' +
      'דימונה דמשק דבלין הרצליה הוד_השרון הוליווד ונציה וינה ורשה וושינגטון זכרון_יעקב חיפה חולון חדרה חברון טבריה טירת_כרמל טוקיו טורונטו טייבה ' +
      'ירושלים יבנה יקנעם יהוד כרמיאל כפר_סבא כפר_יונה לוד לונדון ליסבון לוס_אנג׳לס לימה מדריד מילאנו מודיעין מעלות מגדל_העמק מוסקבה מינכן מונטריאול ' +
      'נתניה נהריה נצרת נס_ציונה נתיבות ניו_יורק נאפולי סידני סטוקהולם סכנין סנט_פטרסבורג סן_פרנסיסקו עכו עפולה ערד עראבה עמאן ' +
      'פריז פתח_תקווה פראג פירנצה פרדס_חנה צפת ציריך צור קריית_שמונה קריית_גת קריית_אתא קיסריה קהיר קייב קרקוב ' +
      'ראשון_לציון רמלה רחובות רומא רעננה רמת_גן רהט ריו_דה_ז׳נרו שדרות שפרעם שוהם שיקגו שנגחאי תל_אביב תבריז' },
    { id: 'animal', name: 'חי', words: 'אריה ארנב אייל איילה אווז אנקור אלפקה ברווז בואש בבון ברדלס גמל גורילה גדי דב דג דולפין דבורה דורבן דוכיפת ' +
      'היפופוטם זברה זאב זבוב זיקית חתול חמור חסידה חילזון חרגול חזיר חגב טווס טיגריס טלה טריטון ינשוף יען יונה יעל יגואר ' +
      'כלב כבש כריש כלבלב לטאה לוויתן לאמה לוטרה מדוזה נמר נחש נמלה נשר נחליאלי סוס סנאי סרטן סלמנדרה סייח ' +
      'עכבר עז עורב עקרב עגל עטלף עכביש פיל פרה פרפר פינגווין פנדה פשפש צב צבי צפרדע צרעה ציפור קוף קיפוד קנגורו קרנף קואלה קרפיון ' +
      'ראם רקון שועל שפן שחף שבלול שממית תנין תוכי תרנגול תולעת תן תיש תנשמת' },
    { id: 'plant', name: 'צומח', words: 'אורן אלון אגס אשל אקליפטוס אבטיח אפרסק אפרסמון אוכמנית ארז אלה ברוש בצל בננה במבוק ברוקולי ' +
      'גזר גפן גויאבה גרניום גומי דקל דובדבן דלעת דשא הדס הרדוף ורד ורבנה זית זעתר זעפרן חמנייה חסה חרצית חציל חרוב ' +
      'טופח טוליפ יסמין יערה כרוב כלנית כרפס כוסברה כרובית לימון לבנדר לוטוס ליצ׳י מלפפון מנגו מנטה מרווה מישמש מלון ' +
      'נרקיס נענע נורית סביון סחלב סלק סלרי סרפד סיגלית עגבנייה ערבה עירית עדשים פטרוזיליה פלפל פטל פטרייה פרג פומלה ' +
      'צבר צנונית צבעוני צפצפה קקטוס קישוא קלמנטינה קינמון קוקוס רקפת רימון ריחן רוזמרין שקד שושן שום שעורה שיטה שיפון שזיף ' +
      'תפוח תמר תות תאנה תירס תפוז תלתן' },
    // a boy's name and a girl's name are two categories; names for both (טל, שי, עדי…) are in both lists
    { id: 'boy', name: 'שם של בן', names: true, words: 'אברהם אורי אליהו אהרון אבי אמנון אריה אלון אייל אסף איתן אבנר בני ברוך בועז בנימין ברק בצלאל גדעון גבי גיל גד גלעד גל גיורא דוד דני דניאל דן דורון דב הלל הראל הדר הרצל ויקטור וולף זאב זלמן זיו זכריה זוהר חיים חנן חזי חגי חנוך טוביה טל טוני יוסף יצחק יעקב ירון יואב יונתן יהודה ישראל יונה יגאל כפיר כרמל לאון ליאור לוי לביא מאיר משה מיכאל מנחם מרדכי מתן נחום ניסים נתן נועם ניר נדב סשה סמי סער ספי סלים עמוס עוזי עומר עידו עמית עזרא עדי פנחס פרץ פיני פסח צבי צחי ציון צור קובי קלמן קדם רפאל רון רוני רועי ראובן רם שלמה שמעון שמואל שאול שי שלום שגיא תומר תמיר תם אביגדור אביחי' },
    { id: 'girl', name: 'שם של בת', names: true, words: 'אסתר אילנה אביבה אורית אירית אלה אדווה אושרת בתיה בלהה ברכה בת_שבע בתיה גילה גאולה גלית גל גבריאלה דבורה דנה דליה דפנה דינה הדסה הילה הדס הגר ויקי ורדה ורד זהבה זיוה זהבית חנה חוה חגית חיה חן טובה טליה טל טלי יעל יהודית יפה יונה ימימה כרמלה כרמית כנרת לאה לבנה לימור לילך מרים מיכל מלכה מירב מאיה נעמי נורית נועה נגה סיגל סמדר סבינה סיון סתיו עדינה עליזה ענת עדי ענבל עפרה פנינה פזית פולה צביה ציונה צילה ציפי קרן קלרה קטי רחל רבקה רונית רות רינה רוני שרה שושנה שולמית שירה שי שלומית תמר תקווה תהילה תרצה אביגיל אביטל אסנת אורנה' },
    { id: 'job', name: 'מקצוע', words: 'אופה אדריכל אחות איכר אסטרונאוט ביולוג בנאי בלש ברמן גנן גזבר דוור דייג דיילת הנדסאי ' +
      'וטרינר זמר זגג חייט חשמלאי חקלאי חזן חייל טבח טייס טכנאי ירקן כבאי כתב לבורנט לוחם מורה מכונאי מלצר מתכנת מהנדס מנהל ' +
      'נגר נהג נגן ספר סנדלר ספרן סוכן סופר עורך_דין עיתונאי פסל פקיד פסיכולוג פרמדיק צייר צלם צורף קצב קוסם קופאי ' +
      'רופא רוקח רואה_חשבון רב שוטר שען שחקן שרברב שף שדרן תופרת תזונאי תקליטן תסריטאי' },
    { id: 'vehicle', name: 'כלי תחבורה', words: 'אוטובוס אופנוע אופניים אונייה אמבולנס אווירון אוטו בלון_פורח גלגיליות גרר דוגית דחפור הליקופטר ' +
      'זחל חללית טרקטור טנק טרקטורון טיסן יאכטה כרכרה כדור_פורח לימוזינה מכונית משאית מטוס מסוק מונית מעבורת מזחלת מנוף ' +
      'סירה ספינה סקוטר סוס סירת_מפרש עגלה פרד צוללת קורקינט קרון קטנוע קאנו קרוואן קלנועית ' +
      'רכבת רכב רכבל רפסודה רכבת_תחתית תלת_אופן' },
    { id: 'food', name: 'מאכל', words: 'אורז אטריות אפונה בורקס במבה ביצה בייגלה ביסלי גלידה גבינה גפילטע דבש דג דייסה ' +
      'המבורגר חומוס חלה חביתה חמין חריימה טחינה טוסט טבולה יוגורט כנאפה כופתאות כבד לחם לביבה לחמנייה ' +
      'מרק מלוואח מקלובה מאפה מוסקה מטבוחה נקניק נקניקייה סלט סופגנייה סביח סושי סטייק עוגה עוף עוגייה עראיס ' +
      'פיצה פלאפל פסטה פשטידה פתיתים פיתה צ׳יפס צלי ציר קציצה קוסקוס קובה קרואסון קבב רוגלך ריבה ' +
      'שקשוקה שניצל שוקולד שווארמה שעועית תפוצ׳יפס תבשיל' },
    { id: 'thing', name: 'חפץ', words: 'ארון אגרטל אהיל בקבוק ברז בובה גרב גיטרה גפרור דלת דלי דף הגה וילון זכוכית זר חבל טלפון טלוויזיה ' +
      'ידית ילקוט יהלום כיסא כרית כוס כפית כדור לוח לבנה מנורה מפתח מזלג מגבת מחשב מספריים מראה נעל נר ספל ספר סיר סכין סל ' +
      'עט עיפרון עציץ פטיש פח פנס צלחת ציור קומקום קערה קופסה רדיו רהיט שולחן שעון שטיח שמיכה תיק תנור תמונה' },
    { id: 'clothes', name: 'בגד', words: 'אפודה אוברול ברדס בגד_ים בגד_גוף גרב גופייה גלימה גרביונים ז׳קט חולצה חליפה חצאית חגורה חזייה ' +
      'טוניקה טלית טייץ טוקסידו כובע כפפות כותונת כפכפים מעיל מכנסיים מגפיים מקטורן מטפחת נעל נעלי_בית סוודר סנדל סינר ' +
      'עניבה פיג׳מה פרווה צעיף קפוצ׳ון קימונו קסדה רדיד שמלה שכמייה תחתונים תרבוש' },
    { id: 'music', name: 'כלי נגינה', words: 'אקורדיון אורגן בנג׳ו בס גיטרה גונג דרבוקה הרמוניקה ויולה ויולונצ׳לו חליל חצוצרה טמבורין טרומבון טובה ' +
      'כינור כנור מנדולינה מפוחית משולש נבל סקסופון עוגב עוד פסנתר פעמון פיקולו צ׳לו צימבל קסילופון קלרינט קונטרבס קחון שופר תוף תופים' },
    { id: 'body', name: 'חלק בגוף', words: 'אף אוזן אצבע אגודל בטן ברך בוהן גב גרון גבה דם זרוע זקן חזה חך טחול ' +
      'יד ירך כתף כף_יד כף_רגל כבד כליה לב לחי לשון לסת מצח מרפק מוח מותן נחיר סנטר עין עפעף עקב עור עצם ' +
      'פה פנים ציפורן צוואר צלע קרסול קרקפת ראש רגל ריאה ריס שן שיער שפה שריר שוק תוספתן' },
    { id: 'sport', name: 'ספורט', words: 'אגרוף אתלטיקה איגרוף אופניים בייסבול באולינג בדמינטון גולף גלישה ג׳ודו התעמלות הוקי הליכה ' +
      'החלקה_על_קרח חתירה טניס טניס_שולחן טאקוונדו יוגה ירי_בקשת כדורגל כדורסל כדורעף כדוריד כדורמים ' +
      'מרוץ מרתון ניווט סקי סיף סנוקר סקווש פינג_פונג פוטבול פילאטיס צלילה קרטה קריקט קפיצה_לגובה קפיצה_לרוחק ' +
      'ריצה ריקוד רכיבה שחייה שחמט שייט' }
  ].map(function (c) { return { id: c.id, name: c.name, names: !!c.names, words: c.words.split(' ').filter(Boolean).map(function (w) { return w.replace(/_/g, ' '); }) }; });

  var FIN = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
  // the same word written a little differently: no spaces or marks, no final letters
  function norm(w) {
    return String(w || '').trim().replace(/[\s'"׳״\-־.]/g, '').split('').map(function (c) { return FIN[c] || c; }).join('');
  }
  // full and short spelling (כתיב מלא / חסר) look alike: drop ו and י after the first letter
  function loose(w) { var n = norm(w); return n.charAt(0) + n.slice(1).replace(/[וי]/g, ''); }

  function dist(a, b) {
    var m = a.length, n = b.length, d = [];
    for (var i = 0; i <= m; i++) { d.push([i]); for (var j = 1; j <= n; j++) d[i].push(i ? 0 : j); }
    for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    return d[m][n];
  }

  // the word in the category list that the typed word matches, or null
  function match(cat, typed) {
    var n = norm(typed), l = loose(typed);
    if (!n) return null;
    var best = null;
    cat.words.forEach(function (w) {
      if (!best && (norm(w) === n || loose(w) === l)) best = w;
    });
    if (best) return best;
    // one letter off, for longer words (a typo)
    if (n.length >= 5) cat.words.forEach(function (w) { if (!best && norm(w).charAt(0) === n.charAt(0) && dist(norm(w), n) <= 1) best = w; });
    if (best) return best;
    // the big word lists from Wikidata (js/eretz-ir-words.js): exact or full/short spelling only
    var ex = extra(cat);
    return ex.byNorm[n] || ex.byLoose[l] || null;
  }

  var extraCache = {};
  function extra(cat) {
    if (extraCache[cat.id]) return extraCache[cat.id];
    var e = { byNorm: {}, byLoose: {} };
    // the big list of given names does not say boy or girl: it serves both, except names our lists give only to the other
    var src = window.EretzIrWords && window.EretzIrWords[cat.names ? 'name' : cat.id];
    var notThis = {}; // by loose spelling, so "מישה" is not a girl's name because "משה" is a boy's
    if (cat.names) {
      var mine = {};
      cat.words.forEach(function (w) { mine[loose(w)] = true; });
      CATS.forEach(function (o) { if (o.names && o !== cat) o.words.forEach(function (w) { if (!mine[loose(w)]) notThis[loose(w)] = true; }); });
    }
    if (src) src.split('|').forEach(function (w) { if (notThis[loose(w)]) return; e.byNorm[norm(w)] = w; e.byLoose[loose(w)] = w; });
    return (extraCache[cat.id] = e);
  }

  function startsWith(cat, letter) {
    return cat.words.filter(function (w) { return norm(w).charAt(0) === letter; });
  }

  /* Level 1–50: open = how many categories exist at this level (new ones join as levels go up),
     per = categories asked for each letter, letters = letters per session. */
  function spec(level) {
    var L = level;
    var open = L <= 5 ? 4 : L <= 10 ? 6 : L <= 15 ? 7 : L <= 20 ? 8 : L <= 25 ? 9 : L <= 30 ? 10 : L <= 35 ? 11 : L <= 40 ? 13 : 14;
    var per = L <= 5 ? 3 : L <= 15 ? 4 : L <= 30 ? 5 : 6;
    return { open: open, per: per, letters: 2, newest: L > 5 };
  }

  var css = [
    '.ei-top{display:flex;align-items:center;gap:.7rem;}',
    '.ei-letter{width:3.6rem;height:3.6rem;border-radius:50%;display:grid;place-items:center;background:var(--c-blue);color:#fff;',
    'font-family:var(--font-display);font-size:2.3rem;font-weight:900;line-height:1;flex:none;}',
    '.ei-top p{margin:0;font-weight:800;font-size:1.1rem;}',
    '.ei-sheet{width:100%;max-width:26rem;border:2px solid var(--line);border-radius:var(--radius-sm);overflow:hidden;background:var(--surface);}',
    '.ei-row{display:grid;grid-template-columns:6.4rem 1fr;min-height:2.4rem;border-top:1px solid var(--line);align-items:center;}',
    '.ei-row:first-child{border-top:0;}',
    '.ei-cat{font-weight:800;padding:0 .5rem;background:var(--surface-2);height:100%;display:flex;align-items:center;line-height:1.15;}',
    '.ei-ans{padding:.2rem .5rem;font-weight:800;font-size:1.15rem;min-width:0;}',
    '.ei-row.is-now{box-shadow:inset 0 0 0 3px var(--sun);}',
    '.ei-row.is-ok .ei-ans{color:var(--good);}',
    '.ei-row.is-skip .ei-ans{color:var(--ink-soft);}',
    '.ei-input{width:100%;min-width:0;font:inherit;font-size:1.3rem;font-weight:800;padding:.35rem .5rem;border:2px solid var(--line);border-radius:8px;',
    'background:var(--surface);color:var(--ink);}',
    '.ei-input:focus{outline:3px solid var(--sun);border-color:var(--sun);}',
    '.ei-msg{margin:0;min-height:1.4rem;text-align:center;font-weight:700;max-width:26rem;}',
    '.ei-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:.5rem;}'
  ].join('');

  BrainGames.register({
    id: 'eretz-ir',
    name: 'ארץ עיר',
    skill: 'language',
    isNew: true,
    tagline: 'אות אחת: כתבו ארץ, עיר, חי, צומח…',
    benefit: 'שליפת מילים, ידע כללי וגמישות',
    instructions: [
      'למעלה מופיעה אות. בכל שורה יש קטגוריה: ארץ, עיר, חי, צומח, ובהמשך גם שם של בן, שם של בת, מקצוע, כלי תחבורה, מאכל ועוד.',
      'הקלידו מילה שמתחילה באות ושייכת לקטגוריה, ולחצו "בדיקה". טעות כתיב קטנה לא נחשבת טעות.',
      'אם המשחק לא מכיר מילה נכונה, לחצו "התשובה שלי נכונה". לא מצליחים? "דלגו" ונראה לכם דוגמה.',
      'אין שעון. חשבו בנחת.'
    ],
    css: css,
    _model: { CATS: CATS, spec: spec, match: match, norm: norm },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var open = CATS.slice(0, sp.open);
      // letters with an answer in enough of the open categories
      var letters = ctx.shuffle('אבגדהזחטיכלמנסעפצקרשת'.split('').filter(function (l) {
        return open.filter(function (c) { return startsWith(c, l).length; }).length >= sp.per;
      })).slice(0, sp.letters);
      var plan = letters.map(function (l) {
        var cats = open.filter(function (c) { return startsWith(c, l).length; });
        // always include the newest category that fits, so a new level shows something new
        var newest = sp.newest ? cats[cats.length - 1] : null;
        var pick = ctx.shuffle(cats.filter(function (c) { return c !== newest; })).slice(0, sp.per - (newest ? 1 : 0));
        if (newest) pick.push(newest);
        return { letter: l, cats: cats.filter(function (c) { return pick.indexOf(c) !== -1; }) };
      });
      var total = plan.reduce(function (s, p) { return s + p.cats.length; }, 0);
      var asked = 0, good = 0;

      function playLetter(pi) {
        if (pi >= plan.length) { ctx.finish({ correct: good, total: total, note: 'מילאתם נכון ' + good + ' מתוך ' + total + ' משבצות' }); return; }
        var P = plan[pi];
        root.innerHTML = '';
        var rows = P.cats.map(function (c) {
          var ans = el('span', { class: 'ei-ans' });
          return { row: el('div', { class: 'ei-row' }, [el('span', { class: 'ei-cat' }, c.name), ans]), ans: ans };
        });
        var input = el('input', { class: 'ei-input', type: 'text', autocomplete: 'off', autocorrect: 'off', spellcheck: 'false', enterkeyhint: 'done', lang: 'he', dir: 'rtl' });
        var msg = el('p', { class: 'ei-msg', 'aria-live': 'polite' });
        var actions = el('div', { class: 'ei-actions' });
        root.appendChild(el('div', { class: 'ei-top' }, [el('span', { class: 'ei-letter', 'aria-hidden': 'true' }, P.letter),
          el('p', null, 'כל המילים מתחילות באות ' + P.letter)]));
        root.appendChild(el('div', { class: 'ei-sheet' }, rows.map(function (r) { return r.row; })));
        root.appendChild(msg);
        root.appendChild(actions);

        function ask(ci) {
          if (ci >= P.cats.length) {
            actions.innerHTML = '';
            msg.textContent = 'סיימתם את האות ' + P.letter + '!';
            var nx = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { nx.disabled = true; playLetter(pi + 1); } },
              pi + 1 >= plan.length ? 'לסיכום' : 'לאות הבאה');
            actions.appendChild(nx);
            // the filled sheet stays a moment, then the next letter comes by itself
            ctx.wait(2200).then(function () { if (!nx.disabled) nx.click(); });
            return;
          }
          asked++;
          ctx.setProgress(asked, total);
          var cat = P.cats[ci];
          rows.forEach(function (r, i) { r.row.classList.toggle('is-now', i === ci); });
          rows[ci].ans.innerHTML = '';
          // the letter is already written in the box and cannot be deleted (user request): the player types the rest
          input.value = P.letter;
          input.setAttribute('aria-label', cat.name + ' שמתחיל באות ' + P.letter);
          input.placeholder = '';
          rows[ci].ans.appendChild(input);
          ctx.setStatus(cat.name + ' באות ' + P.letter);
          msg.textContent = '';
          var tries = 0, settled = false, hints = 0, hintWord = null;
          var checkBtn = el('button', { class: 'btn btn-primary', type: 'button', onclick: check }, 'בדיקה');
          var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
          var skipBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: skip }, 'דלגו');
          var mineBtn = el('button', { class: 'btn btn-secondary', type: 'button', hidden: true, onclick: mine }, 'התשובה שלי נכונה');
          actions.innerHTML = '';
          [checkBtn, hintBtn, mineBtn, skipBtn].forEach(function (b) { actions.appendChild(b); });
          function keepCaret() { // never before the letter
            try { if (input.selectionStart < 1 || input.selectionEnd < 1) input.setSelectionRange(Math.max(1, input.selectionStart), Math.max(1, input.selectionEnd)); } catch (e) { /* not a text box */ }
          }
          input.onkeydown = function (e) {
            if (e.key === 'Enter') { e.preventDefault(); check(); return; }
            if (e.key === 'Backspace' && input.selectionStart <= 1 && input.selectionEnd <= 1) e.preventDefault();
          };
          input.oninput = function () {
            if (input.value.charAt(0) !== P.letter) {
              input.value = P.letter + input.value.replace(/^\s+/, '');
              try { input.setSelectionRange(input.value.length, input.value.length); } catch (e) { /* not a text box */ }
            }
          };
          input.onclick = input.onkeyup = input.onfocus = keepCaret;
          try { input.focus({ preventScroll: true }); input.setSelectionRange(1, 1); } catch (e) { /* old browsers */ }

          function settle(text, cls, ok, note) {
            if (settled) return;
            settled = true;
            if (ok) good++;
            rows[ci].ans.innerHTML = '';
            rows[ci].ans.textContent = text;
            rows[ci].row.classList.remove('is-now');
            rows[ci].row.classList.add(cls);
            msg.textContent = note || '';
            actions.innerHTML = '';
            (ok ? ctx.feedback(true) : ctx.wait(note ? 1800 : 300)).then(function () { ask(ci + 1); });
          }
          function check() {
            if (settled) return;
            var typed = input.value.trim();
            if (typed.length <= 1) { msg.textContent = 'הקלידו את המשך המילה, או לחצו "דלגו"'; return; }
            // typed the first letter again out of habit ("בבננה"): drop the extra letter when that makes a word we know
            if (typed.charAt(1) === P.letter && !match(cat, typed) && match(cat, typed.slice(1))) typed = typed.slice(1);
            if (norm(typed).charAt(0) !== P.letter) {
              ctx.sound('bad');
              msg.textContent = '"' + typed + '" לא מתחיל באות ' + P.letter + '. נסו שוב';
              return;
            }
            var hit = match(cat, typed);
            // right at the first try counts; one hint is fine, more is help
            if (hit) { settle(hit, 'is-ok', tries === 0 && hints <= 1, hit !== typed ? 'נכון! (' + hit + ')' : ''); return; }
            tries++;
            ctx.sound('bad');
            // maybe it is a real answer we do not know: let the player decide
            var other = CATS.filter(function (c) { return c !== cat && match(c, typed); })[0];
            msg.textContent = other ? '"' + typed + '" מוכר לנו בתור ' + other.name + ', לא ' + cat.name + '. נסו מילה אחרת'
              : 'לא מצאנו את "' + typed + '" ברשימה שלנו. בדקו את הכתיב, או לחצו "התשובה שלי נכונה"';
            mineBtn.hidden = !!other;
          }
          function mine() { if (!settled && input.value.trim().length > 1) settle(input.value.trim(), 'is-ok', hints <= 1, 'קיבלנו את התשובה שלכם'); }
          /* "רמז": one answer we know, given a little at a time: first how long it is and how it starts, then one more
             letter. The player still types it. */
          function hint() {
            if (settled) return;
            if (!hintWord) { // a one-word answer when there is one
              var pool = startsWith(cat, P.letter), single = pool.filter(function (w) { return w.indexOf(' ') === -1; });
              hintWord = ctx.pick(single.length ? single : pool);
            }
            hints++;
            var letters = hintWord.split(''), len = letters.filter(function (c) { return c !== ' '; }).length;
            var show = Math.min(len - 1, (len <= 3 ? 1 : 2) + (hints - 1)); // never the whole word
            var shown = 0;
            var pat = letters.map(function (c) { if (c === ' ') return ' '; shown++; return shown <= show ? c : '_'; }).join(' ');
            msg.textContent = 'רמז: למשל מילה של ' + len + ' אותיות: ' + pat + (show >= len - 1 ? '' : ' (לחיצה נוספת תגלה עוד אות)');
            if (show >= len - 1) hintBtn.disabled = true;
            try { input.focus({ preventScroll: true }); } catch (e) { /* old browsers */ }
          }
          function skip() {
            var ex = ctx.shuffle(startsWith(cat, P.letter)).slice(0, 2);
            settle(ex[0], 'is-skip', false, 'דוגמאות: ' + ex.join(', '));
          }
        }
        ask(0);
      }
      playLetter(0);
    }
  });
})();
