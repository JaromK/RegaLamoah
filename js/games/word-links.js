/* צירופי מילים — complete a common Hebrew word pair / smichut / idiom (language). */
(function () {
  'use strict';

  var ROUNDS = 8;
  var BLANK = '\u00a0'; // keeps the empty blank its height

  /* Each item: 'first|answer|d1,d2,d3,d4' (+ '|meaning' for idioms).
     Every distractor was chosen so that it does NOT form a known expression with the first word
     (e.g. no "קפה" after "בית" – "בית קפה" is real). Keep at least four distractors per item.
     Tier 1 = everyday pairs, 2 = well-known but less obvious, 3 = idioms and sayings. */
  var T1 = [
    'בית|ספר|עיפרון,מזלג,ענן,כרית',
    'יום|הולדת|חלון,מזלג,עגבנייה,סולם',
    'כדור|רגל|אוזן,מרפק,כתף,סנטר',
    'עורך|דין|חוק,שופט,מזל,צדק',
    'תפוח|אדמה|חול,אבן,שמיים,ים',
    'ארוחת|בוקר|שבוע,חודש,שנה,רגע',
    'גן|חיות|מכוניות,ספרים,כלים,נעליים',
    'ראש|ממשלה|מספרה,מכולת,חנות,מאפייה',
    'שעון|מעורר|מטייל,רוקד,צוחק,מבשל',
    'כוכב|לכת|ריצה,שינה,נסיעה,הליכה',
    'תחנת|אוטובוס|מטבח,ספרים,שמלה,גינה',
    'מכונת|כביסה|רחצה,מנוחה,טיול,שמחה',
    'עוגת|גבינה|מלפפון,צנון,חסה,פלפל',
    'כרטיס|אשראי|חלון,עננים,שולחן,כיסא',
    'שמן|זית|תפוח,אגס,מלפפון,עגבנייה',
    'חדר|שינה|קפיצה,שחייה,טיסה,צעקה',
    'עגלת|קניות|שירה,שינה,חלון,ציור',
    'שיעורי|בית|חצר,גג,רחוב,מרפסת',
    'ספר|טלפונים|נעליים,עננים,מכוניות,כוסות',
    'מעיל|גשם|שמש,ירח,חול,ענן',
    'משקפי|שמש|ירח,כוכב,ענן,רוח',
    'מברשת|שיניים|אוזניים,ברכיים,מרפקים,כתפיים',
    'כף|יד|אוזן,אף,ברך,בטן',
    'בגד|ים|נהר,הר,מדבר,יער',
    'נעלי|בית|גג,חלון,מקרר,ארון',
    'שולחן|כתיבה|שינה,רחצה,נסיעה,ריצה',
    'מנורת|לילה|בוקר,צהריים,שבוע,קיץ',
    'כלב|שמירה|בישול,שירה,קריאה,כתיבה',
    'ים|המלח|הסוכר,הפלפל,השמן,הקמח',
    'מצב|רוח|מים,שמש,גשם,חול',
    'מגן|דוד|שלמה,משה,יוסף,יעקב',
    'קופת|חולים|בריאים,רופאים,מורים,ספרים',
    'מספר|טלפון|מזלג,ענן,פרח,כרית',
    'פח|זבל|פרחים,ספרים,צעצועים,כלים',
    'קרם|הגנה|התקפה,נסיעה,שמירה,ריצה',
    'מקל|הליכה|שינה,שחייה,קריאה,כתיבה',
    'הר|געש|רעש,אש,עשן,ברק',
    'כלי|נגינה|שינה,צחוק,חלום,שמחה',
    'ספינת|חלל|ענן,גשם,שלג,אבק',
    'תיבת|דואר|שינה,פרחים,ענן,צחוק',
    'רופא|שיניים|ספרים,כביסה,חלונות,כיסאות',
    'ליל|הסדר|השולחן,הכוס,הקערה,המצה',
    'מגילת|אסתר|שרה,רבקה,לאה,רחל',
    'חולצת|טריקו|שמלה,סוודר,גרב,כובע',
    'קפה|הפוך|ישר,עגול,שבור,הולך',
    'סלט|ירקות|עוגות,גלידה,שוקולד,ופלים',
    'אלף|בית|גימל,דלת,חית,טית',
    'שלט|רחוק|קרוב,ארוך,גבוה,עמוק',
    'מוצאי|שבת|ראשון,שלישי,רביעי,חמישי',
    'שוטר|תנועה|גשר,פרחים,מטבח,אוכל'
  ];

  var T2 = [
    'שומר|ראש|רגל,אוזן,בטן,אף',
    'כובע|גרב|נעל,חולצה,מכנס,כפפה',
    'אוצר|מילים|מספרים,כוסות,נעליים,סירות',
    'נקודת|מבט|שמיעה,ריח,טעם,נשימה',
    'עין|הרע|הקר,החם,הגדול,הישן',
    'לב|זהב|נחושת,פלסטיק,נייר,חרס',
    'יד|ימין|קדימה,אחורה,למעלה,צפון',
    'גל|חום|שמש,חול,עשן,מלח',
    'בן|זוג|שולחן,כיסא,חלון,מזלג',
    'יושב|ראש|גב,ברך,כתף,בטן',
    'חוש|הומור|כביסה,מטבח,שולחן,סבון',
    'כסף|קטן|ארוך,רחב,גבוה,עגול',
    'מכתב|המלצה|שינה,צחוק,ריצה,קפיצה',
    'דמי|כיס|ארנק,תיק,מגירה,קופסה',
    'תעודת|זהות|פנים,שם,כתובת,צבע',
    'עיר|בירה|ספסל,מגדל,מדרכה,רמזור',
    'תחבורה|ציבורית|חגיגית,מתוקה,רכה,צבעונית',
    'דג|זהב|נחושת,ברזל,חרס,נייר',
    'עץ|הדעת|השמחה,הכוח,הזמן,הבית',
    'סל|כביסה|ריצה,שינה,טלוויזיה,מקרר',
    'גלגל|הצלה|ניקיון,בישול,כתיבה,ספורט',
    'אבן|דרך|רחוב,שביל,כביש,גשר',
    'רכבת|הרים|עמקים,גבעות,ימים,מדבריות',
    'שיר|ערש|מיטה,כרית,שמיכה,סדין',
    'חתול|רחוב|מטבח,ספרייה,מרפסת,משרד',
    'תיק|גב|מטבח,סלון,מרפסת,גינה',
    'פנס|רחוב|מטבח,ארון,מקרר,ספה',
    'שן|בינה|שמחה,תקווה,נחת,שלווה',
    'אוזן|קשבת|רכה,רחבה,עגולה,שמחה',
    'פרי|הדר|חן,יופי,אור,זוהר',
    'ראשון|לציון|לירושלים,לחיפה,לגליל,לנגב',
    'בת|יענה|נשר,ברווז,תרנגול,אווז',
    'שבוע|הספר|המחברת,העיתון,הדף,העט',
    'שוק|הפשפשים|היתושים,הנמלים,הזבובים,הדבורים',
    'תשעה|באב|בניסן,בתשרי,באדר,באלול',
    'ברכת|המזון|הכלים,השולחן,הכיסא,המטבח',
    'פסל|החירות|האחווה,השמחה,החלום,התקווה',
    'תולעת|ספרים|מחברות,עיתונים,מכתבים,מילים',
    'רב|מכר|מחיר,דף,ספר,קורא',
    'מילה|במילה|בשורה,בדף,בספר,במשפט',
    'עולם|הבא|הקודם,הרחוק,הגבוה,הנמוך',
    'בלי|נדר|חלום,שיר,ספר,מזלג'
  ];

  var T3 = [
    'חבל|על הזמן|על השעון,על הספה,על הכיסא,על הענן|בסלנג: נהדר, מצוין. וגם: בזבוז זמן.',
    'קשה|עורף|כתף,ברך,מרפק,אף|עקשן, שלא מוותר בקלות.',
    'דמעות|תנין|נמר,פיל,ארנב,צב|בכי מזויף, צער שאינו אמיתי.',
    'סוס|טרויאני|רומאי,מצרי,פרסי,סיני|דבר שנראה תמים אבל מסתיר סכנה.',
    'עקב|אכילס|הרקולס,זאוס,הומרוס,אפולו|נקודת התורפה, המקום החלש.',
    'כבשת|הרש|הנגר,הצייר,המלך,השוטר|הדבר היחיד והיקר שיש לאדם.',
    'עם|הספר|הדף,המכתב,העיתון,המחברת|כינוי לעם היהודי, שאוהב ללמוד.',
    'ארץ זבת|חלב ודבש|מים ולחם,שמן ויין,חלב ולחם,מלח ודבש|ארץ עשירה ופורייה.',
    'טיפה|בים|בנהר,באגם,בבריכה,בדלי|כמות קטנה מאוד לעומת מה שצריך.',
    'מחט|בערימת שחת|בערימת חול,בשק קמח,בקופסת סוכר,בסל כביסה|דבר שכמעט אי אפשר למצוא.',
    'שושנת|יעקב|יצחק,אברהם,משה,דוד|כינוי עתיק לעם ישראל, מתוך פיוט לפורים.',
    'חוט|השדרה|הגב,הצוואר,הבטן,הכתף|חלק מרכזי בגוף. בהשאלה: עמידה איתנה על עקרונות.',
    'ציפור|נפשו|ביתו,ידו,חלונו,גינתו|הדבר היקר לו ביותר.',
    'כבד|פה|יד,רגל,גב,ברך|מתקשה לדבר, כמו שנאמר על משה רבנו.',
    'בדל|אוזן|אף,עין,יד,רגל|חלק קטנטן, כמעט כלום.',
    'שעת|כושר|עוצמה,חוזק,גבורה,חוסן|הזדמנות טובה לפעול.',
    'ברכה|לבטלה|למחר,לשבוע,לבוקר,לשולחן|דבר מיותר שנעשה לשווא.',
    'אוהל|מועד|מקום,מפגש,זמן,חג|המשכן שבו נפגש משה עם האל במדבר.',
    'אחרית|הימים|השבוע,החודש,הלילות,הבקרים|העתיד הרחוק, סוף הזמנים.',
    'כחוט|השערה|הצמר,המשי,הכותנה,הנייר|במרחק קטן מאוד, כמעט.',
    'קריאת|תיגר|חרב,מגן,אויב,צבא|ערעור גלוי על סמכות, הזמנה לעימות.',
    'גשם|זלעפות|מרפסות,עדשות,מחשבות,ציפורים|גשם חזק מאוד.',
    'לחם|חוקו|ביתו,חלומו,שירו,גינתו|הדבר שאדם עושה או צריך בכל יום.',
    'שבעה|מדורי גיהנום|חדרי שינה,מדפי ספרים,שבילי גן,קומות בניין|סבל קשה מאוד ("עבר שבעה מדורי גיהנום").',
    'חרב|פיפיות|חלומות,שירים,צבעים,נוצות|דבר שיכול לפגוע גם במי שמשתמש בו.',
    'אור|לגויים|לשכנים,לחברים,לרחובות,לבתים|דוגמה ומופת לעמים אחרים.'
  ];

  function parse(list, tier) {
    return list.map(function (s) {
      var p = s.split('|');
      return { w: p[0], a: p[1], d: p[2].split(','), m: p[3] || '', t: tier };
    });
  }
  var POOL = parse(T1, 1).concat(parse(T2, 2), parse(T3, 3));

  /* Per level (1–20): number of choices and the chance of each tier [t1, t2, t3]. */
  var LEVELS = [
    { n: 3, p: [1, 0, 0] },        // 1
    { n: 3, p: [1, 0, 0] },        // 2
    { n: 3, p: [0.9, 0.1, 0] },    // 3
    { n: 3, p: [0.8, 0.2, 0] },    // 4
    { n: 3, p: [0.65, 0.35, 0] },  // 5
    { n: 4, p: [0.7, 0.3, 0] },    // 6
    { n: 4, p: [0.55, 0.45, 0] },  // 7
    { n: 4, p: [0.4, 0.6, 0] },    // 8
    { n: 4, p: [0.3, 0.6, 0.1] },  // 9
    { n: 4, p: [0.2, 0.65, 0.15] },// 10
    { n: 4, p: [0.15, 0.6, 0.25] },// 11
    { n: 4, p: [0.1, 0.55, 0.35] },// 12
    { n: 5, p: [0.2, 0.55, 0.25] },// 13
    { n: 5, p: [0.1, 0.55, 0.35] },// 14
    { n: 5, p: [0.1, 0.45, 0.45] },// 15
    { n: 5, p: [0, 0.5, 0.5] },    // 16
    { n: 5, p: [0, 0.4, 0.6] },    // 17
    { n: 5, p: [0, 0.35, 0.65] },  // 18
    { n: 5, p: [0, 0.25, 0.75] },  // 19
    { n: 5, p: [0, 0.2, 0.8] }     // 20
  ];

  function pickTier(p) {
    var r = Math.random();
    if (r < p[0]) return 1;
    if (r < p[0] + p[1]) return 2;
    return 3;
  }

  var CSS = [
    '.wl-wrap{width:100%;display:flex;flex-direction:column;align-items:center;gap:1.1rem}',
    '.wl-phrase{display:flex;flex-wrap:wrap;justify-content:center;align-items:baseline;gap:.2em .45em;margin:0;',
    'overflow-wrap:anywhere;font-size:clamp(2rem,9vw,3.4rem)}',
    '.wl-blank{display:inline-block;min-width:2.4em;border-bottom:.1em solid var(--language);color:var(--language);',
    'text-align:center;line-height:1.05}',
    '.wl-blank.is-filled{border-bottom-style:solid;background:var(--language-soft);border-radius:var(--radius-sm) var(--radius-sm) 0 0;',
    'padding:0 .2em;min-width:0}',
    '.wl-choices{max-width:30rem;grid-template-columns:repeat(auto-fit,minmax(min(100%,7rem),1fr))}',
    '.wl-choice{font-size:clamp(1.25rem,5vw,1.5rem);min-height:4.4rem;overflow-wrap:anywhere;padding-inline:.5rem}',
    '.wl-explain{font-size:1.1rem;font-weight:600;text-align:center;text-wrap:balance;line-height:1.55;',
    'padding:.6rem 1rem;border-radius:var(--radius-sm);max-width:34rem;width:100%;margin:0}',
    '.wl-explain:empty{display:none}',
    '.wl-explain.is-good{background:var(--good-soft);color:var(--good)}',
    '.wl-explain.is-bad{background:var(--bad-soft);color:var(--ink)}',
    '.wl-explain strong{font-weight:900;font-family:inherit;font-size:inherit}',
    '.wl-meaning{display:block;font-weight:500;color:var(--ink);margin-top:.25rem}'
  ].join('');

  BrainGames.register({
    id: 'word-links',
    name: 'צירופי מילים',
    skill: 'language',
    tagline: 'השלימו את הצירוף המוכר',
    benefit: 'שליפת מילים, אוצר מילים וזיכרון לשוני',
    instructions: [
      'קראו את המילה הגדולה. אחריה חסרה מילה.',
      'בחרו את המילה שיוצרת איתה צירוף מוכר, כמו "בית ספר".',
      'רק אפשרות אחת יוצרת צירוף נכון.',
      'אחרי כל תשובה נראה את הצירוף המלא.'
    ],
    css: CSS,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var round = 0;
      var correct = 0;
      var used = {};
      var usedFirst = {};

      function pickItem() {
        var tier = pickTier(spec.p);
        for (var t = tier; t >= 1; t--) {
          var cands = POOL.filter(function (it) {
            return it.t === t && !used[it.w + '|' + it.a] && !usedFirst[it.w];
          });
          if (cands.length) return ctx.pick(cands);
        }
        used = {}; usedFirst = {};
        return ctx.pick(POOL.filter(function (it) { return it.t <= Math.max(1, tier); }));
      }

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({
            correct: correct,
            total: ROUNDS,
            note: 'השלמתם נכון ' + correct + ' מתוך ' + ROUNDS + ' צירופים'
          });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var item = pickItem();
        used[item.w + '|' + item.a] = true;
        usedFirst[item.w] = true;
        var options = ctx.shuffle([item.a].concat(ctx.shuffle(item.d).slice(0, spec.n - 1)));
        var full = item.w + ' ' + item.a;

        ctx.setStatus('איזו מילה משלימה צירוף מוכר?');

        var blank = el('span', { class: 'wl-blank', 'aria-label': 'מילה חסרה' }, BLANK);
        var phrase = el('p', { class: 'g-big wl-phrase' }, [el('span', null, item.w), blank]);
        var choices = el('div', { class: 'g-choices wl-choices' });
        var explain = el('p', { class: 'wl-explain', 'aria-live': 'polite' });
        var buttons = [];
        var answered = false;

        options.forEach(function (w) {
          var b = el('button', { class: 'g-choice wl-choice', type: 'button', onclick: function () { answer(w, b); } }, w);
          buttons.push({ w: w, btn: b });
          choices.appendChild(b);
        });

        root.innerHTML = '';
        root.appendChild(el('div', { class: 'wl-wrap' }, [phrase, choices, explain]));

        function answer(w, btn) {
          if (answered) return;
          answered = true;
          var ok = w === item.a;
          buttons.forEach(function (o) {
            o.btn.disabled = true;
            if (o.w === item.a) o.btn.classList.add('is-correct');
          });
          if (!ok) btn.classList.add('is-wrong');
          blank.textContent = item.a;
          blank.classList.add('is-filled');
          blank.removeAttribute('aria-label');

          explain.innerHTML = '';
          if (ok) {
            correct++;
            explain.className = 'wl-explain is-good';
            explain.appendChild(document.createTextNode('נכון! הצירוף הוא '));
          } else {
            explain.className = 'wl-explain is-bad';
            explain.appendChild(document.createTextNode('"' + item.w + ' ' + w + '" אינו צירוף מוכר. הצירוף הנכון: '));
          }
          explain.appendChild(el('strong', null, '"' + full + '"'));
          if (item.m) explain.appendChild(el('span', { class: 'wl-meaning' }, item.m));

          ctx.setStatus(ok ? 'מצוין!' : 'הנה הצירוף המלא');
          ctx.feedback(ok, ok ? null : 'התשובה הנכונה: ' + full)
            .then(function () { return ctx.wait((ok ? 900 : 2000) + (item.m ? 1500 : 0)); })
            .then(nextRound);
        }
      }

      nextRound();
      return function cleanup() { root.innerHTML = ''; };
    }
  });
})();
