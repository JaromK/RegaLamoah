/* כתיב נכון — pick the correctly spelled word (language). Untimed. */
(function () {
  'use strict';

  var ROUNDS = 8;

  // Word pool in standard ktiv male. Format: 'correct|wrong1,wrong2,wrong3|sentence with ___'.
  // Wrong spellings swap letters that sound alike (ט/ת, כ/ח, ק/כ, ס/ש, א/ע, ב/ו, ה/א)
  // or add a letter where it does not belong, and are not real Hebrew words.
  var TIERS = [
    [ // tier 1: everyday words
      'תפוח|טפוח,תפוך,טפוך|אכלתי ___ אדום ומתוק.',
      'שולחן|שולכן,סולחן,סולכן|הצלחות כבר על ה___.',
      'חלון|כלון,הלון,חאלון|פתחו את ה___, חם כאן.',
      'מכתב|מחתב,מקתב,מכטב|קיבלתי ___ מהנכדה.',
      'עיתון|איתון,עיטון,איטון|סבא קורא ___ בכל בוקר.',
      'תודה|טודה,תודא,טודא|___ רבה על העזרה.',
      'כיסא|חיסא,כישא,קיסא|שבו על ה___ ליד החלון.',
      'מטבח|מתבח,מטבך,מתבך|אמא מבשלת מרק ב___.',
      'עוגה|אוגה,עוגא,אוגא|אפינו ___ ליום ההולדת.',
      'חתול|כתול,חטול,כטול|ה___ ישן על הספה.',
      'שמש|סמש,שמס,שאמש|ה___ זורחת בבוקר.',
      'רכבת|רכבט,רקבט,רחבט|נסענו ב___ לחיפה.',
      'סבתא|שבתא,סבטא,סבתה|___ אפתה עוגיות לנכדים.',
      'כפית|חפית,כפיט,קפית|ערבבו את התה ב___.',
      'מתנה|מטנה,מתנא,מטנא|קיבלתי ___ ליום ההולדת.',
      'מחברת|מכברת,מחברט,מכברט|כתבתי ב___ החדשה.',
      'שקית|סקית,סכית,שקיט|שימו את הלחם ב___.',
      'צלחת|צלכת,צלחט,צלכט|שימו את העוגה על ה___.',
      'סכין|שכין,סחין,סכיין|חתכו את הלחם ב___.',
      'חשמל|כשמל,חסמל,כסמל|הייתה הפסקת ___ בערב.',
      'בבקשה|בווקשה,בבכשה,בבקסה|___, שבו כאן.',
      'מחשב|מכשב,מחסב,מכסב|כתבתי מכתב ב___.',
      'טעים|תעים,טאים,טעיים|האוכל ___ מאוד.',
      'גשם|גסם,גשאם,גסאם|ירד ___ חזק כל הלילה.'
    ],
    [ // tier 2: longer everyday words
      'אקדח|עקדח,אכדח,אקדך|',
      'תאריך|טאריך,טעריך,תאריח|מה ה___ היום?',
      'מתכון|מטכון,מתחון,מתקון|קיבלתי ___ לעוגה מסבתא.',
      'בטוח|בתוח,בטוך,בטואח|אני ___ שיהיה בסדר.',
      'מאוחר|מעוחר,מאוכר,מאוהר|כבר ___, הולכים לישון.',
      'התחלה|הטחלה,הטכלה,התחלא|כל ___ קשה.',
      'עכשיו|אכשיו,עחשיו,עכשו|___ אני פנוי לשיחה.',
      'אוטובוס|עוטובוס,אותובוס,אוטובוש|חיכינו ל___ בתחנה.',
      'טלפון|תלפון,טלפוון,תלפוון|דיברתי ב___ עם הבת.',
      'שוקולד|שוכולד,סוקולד,סוכולד|הנכד אוהב ___ מריר.',
      'ארוחה|ערוחה,ארוהה,ארוחא|___ הבוקר מוכנה.',
      'מזכירה|מזחירה,מזקירה,מזכירא|ה___ ענתה לטלפון.',
      'חשבון|כשבון,חסבון,כסבון|שילמנו את ה___ במסעדה.',
      'תוכנית|טוכנית,תוחנית,תוכניט|מה ה___ שלכם למחר?',
      'עכביש|אכביש,עחביש,עכביס|___ טווה קורים בפינה.',
      'מזלג|מזלק,מסלג,מזלאג|אוכלים סלט עם ___.',
      'מעיל|מאיל,מעייל,מאייל|קר בחוץ, לבשו ___.',
      'משקפיים|משכפיים,מסקפיים,משקפאיים|סבא מרכיב ___ לקריאה.',
      'תרופה|תרופא,טרופא,תרוופה|קחו את ה___ אחרי האוכל.',
      'רופא|רופה,רופע,רוופא|הלכתי ל___ המשפחה.',
      'אחות|אכות,אחוט,עחות|ה___ מדדה לי לחץ דם.',
      'מכונית|מחונית,מקונית,מכוניט|החנינו את ה___ ליד הבית.',
      'כתובת|חתובת,כטובת,כתובט|רשמו את ה___ על המעטפה.',
      'מעטפה|מאטפה,מעתפה,מעטפא|שמתי את המכתב ב___.',
      'מקרר|מכרר,מקראר,מכראר|החלב נמצא ב___.',
      'אבטיח|עבטיח,אבתיח,אבטיך|בקיץ אוכלים ___ קר.',
      'מקלחת|מכלחת,מקלכת,מקלחט|אחרי ההליכה נכנסתי ל___.',
      'חתונה|כתונה,חטונה,כטונה|רקדנו כל הלילה ב___.',
      'סליחה|סליכה,סליהה,סאליחה|___, איפה התחנה?',
      'עניבה|אניבה,עניוה,אניוה|סבא ענד ___ לחתונה.'
    ],
    [ // tier 3: longer, abstract and borrowed words
      'סבלנות|שבלנות,סבלנוט,סבלאנות|צריך ___ כדי לגדל צמחים.',
      'עצמאות|אצמאות,עצמעות,עצמאוט|חגגנו את יום ה___.',
      'כנראה|חנראה,כנרעה,קנראה|___ ירד גשם מחר.',
      'בריאות|בריעות,בריאוט,ברייאות|העיקר ה___.',
      'התעמלות|התאמלות,הטעמלות,התעמלוט|___ בוקר עושה טוב לגוף.',
      'אחריות|עחריות,אכריות,אחריוט|',
      'השתתפות|השטתפות,הסתתפות,השתטפות|תודה על ה___ בפעילות.',
      'הזדמנות|הסדמנות,הזדמנוט,הזדמאנות|כל יום הוא ___ חדשה.',
      'תעודה|טעודה,תאודה,טאודה|קיבלנו ___ הצטיינות.',
      'קישוט|כישוט,קישות,קיסוט|תלינו ___ על הדלת.',
      'קהילה|כהילה,קהילא,קאילה|כל ה___ התאספה לחגוג.',
      'אינטרנט|אינתרנט,אינטרנת,עינטרנט|קראתי את החדשות ב___.',
      'טלוויזיה|תלוויזיה,טלביזיה,תלביזיה|ראינו סרט ב___.',
      'אמבולנס|עמבולנס,אמבולנש,אמבולנז|ה___ הגיע מהר.',
      'תאונה|טאונה,תעונה,תאונא|הייתה ___ קטנה בצומת.',
      'אפשר|עפשר,אפשאר,עפסר|___ לעזור לכם?',
      'מקלדת|מכלדת,מקלדט,מכלדט|הקלדתי את המכתב ב___.',
      'אמבטיה|עמבטיה,אמבתיה,עמבתיה|התרחצנו ב___ חמה.',
      'מתכנת|מטכנת,מתחנת,מתקנט|',
      'התרגשות|הטרגשות,התרגסות,התרגשוט|הייתה ___ גדולה בחתונה.',
      'תשובה|טשובה,תסובה,תשוואה|כתבו ___ על השאלה.',
      'מספרה|משפרה,מספרא,משפרא|הסתפרתי ב___ ליד הבית.',
      'אווירה|עווירה,עוירה,אווירא|הייתה ___ טובה במסיבה.',
      'שכנים|סכנים,שחנים,סחנים|ה___ הביאו לנו עוגה.'
    ]
  ];

  function parse(line, tier) {
    var p = line.split('|');
    return { word: p[0], wrong: p[1].split(','), sentence: p[2] || '', tier: tier };
  }
  var POOL = [];
  TIERS.forEach(function (list, t) { list.forEach(function (l) { POOL.push(parse(l, t + 1)); }); });

  // Per level: which tiers to draw from and how many options to show.
  var LEVELS = [];
  (function () {
    for (var lv = 1; lv <= 20; lv++) {
      var tiers = lv <= 4 ? [1] : lv <= 7 ? [1, 2] : lv <= 11 ? [2] : lv <= 14 ? [2, 3] : [3, 2, 3];
      LEVELS.push({ tiers: tiers, options: lv <= 9 ? 3 : 4, blankFirst: lv <= 12 });
    }
  })();

  function pickWords(level, shuffle) {
    var spec = LEVELS[level - 1];
    var pool = POOL.filter(function (w) { return spec.tiers.indexOf(w.tier) !== -1; });
    return shuffle(pool).slice(0, ROUNDS);
  }

  function makeOptions(item, n, shuffle) {
    return shuffle([item.word].concat(shuffle(item.wrong.slice()).slice(0, n - 1)));
  }

  var css = [
    '.sf-wrap{width:100%;max-width:28rem;display:flex;flex-direction:column;align-items:center;gap:1rem;}',
    '.sf-sentence{font-size:1.45rem;font-weight:700;text-align:center;line-height:1.6;text-wrap:balance;}',
    '.sf-blank{display:inline-block;min-width:4.5rem;border-bottom:3px solid var(--language);margin:0 .2rem;}',
    '.sf-fill{color:var(--good);font-weight:900;border-bottom:3px solid var(--good);padding:0 .15rem;}',
    '.sf-choices{grid-template-columns:repeat(2,minmax(0,1fr));}',
    '.sf-choices .g-choice{font-size:1.6rem;letter-spacing:.02em;}',
    '.sf-hint{font-size:1.05rem;}'
  ].join('');

  BrainGames.register({
    id: 'spelling-fix',
    name: 'כתיב נכון',
    skill: 'language',
    tagline: 'בחרו את המילה שכתובה נכון',
    benefit: 'אוצר מילים, קריאה מדויקת ותשומת לב לפרטים',
    instructions: [
      'יופיעו כמה דרכים לכתוב אותה מילה. רק אחת מהן נכונה.',
      'קראו כל אפשרות לאט ובדקו כל אות.',
      'לחצו על המילה שכתובה נכון. אין מגבלת זמן.'
    ],
    css: css,
    _pool: POOL,
    _levels: LEVELS,
    _makeOptions: makeOptions,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var words = pickWords(level, ctx.shuffle);
      var total = Math.min(ROUNDS, words.length);
      var round = 0, score = 0;

      function sentenceNode(item, filled) {
        var parts = item.sentence.split('___');
        var mid = filled
          ? el('span', { class: 'sf-fill' }, item.word)
          : el('span', { class: 'sf-blank', 'aria-label': 'מילה חסרה' }, ' ');
        return el('p', { class: 'sf-sentence' }, [parts[0], mid, parts[1] || '']);
      }

      function nextRound() {
        if (round >= total) {
          ctx.finish({
            correct: score, total: total,
            note: 'בחרתם כתיב נכון ב־' + score + ' מתוך ' + total + ' מילים'
          });
          return;
        }
        round++;
        ctx.setProgress(round, total);
        playRound(words[round - 1]);
      }

      function playRound(item) {
        root.innerHTML = '';
        // Easier levels show the word inside a sentence; harder levels alternate with the word alone.
        var withSentence = item.sentence && (spec.blankFirst || round % 2 === 1);
        ctx.setStatus(withSentence ? 'איזו מילה חסרה? בחרו את הכתיב הנכון' : 'איזו מילה כתובה נכון?');
        var wrap = el('div', { class: 'sf-wrap' });
        var top = el('div', null, withSentence ? sentenceNode(item, false) : null);
        var options = makeOptions(item, spec.options, ctx.shuffle);
        var answered = false;
        var buttons = options.map(function (w) {
          return el('button', {
            class: 'g-choice', type: 'button', lang: 'he',
            onclick: function () { choose(w, this); }
          }, w);
        });
        var after = el('div', { class: 'g-actions' });
        wrap.appendChild(top);
        wrap.appendChild(el('div', { class: 'g-choices sf-choices' }, buttons));
        wrap.appendChild(after);
        root.appendChild(wrap);

        function choose(w, btn) {
          if (answered) return;
          answered = true;
          ctx.sound('tap');
          var ok = w === item.word;
          if (ok) score++;
          buttons.forEach(function (b) {
            b.disabled = true;
            if (b.textContent === item.word) b.classList.add('is-correct');
          });
          if (!ok) btn.classList.add('is-wrong');
          // Show the word in its sentence on the answer screen.
          top.innerHTML = '';
          if (item.sentence) top.appendChild(sentenceNode(item, true));
          else top.appendChild(el('p', { class: 'g-big' }, item.word));
          ctx.setStatus(ok ? 'נכון!' : 'הכתיב הנכון: ' + item.word);
          ctx.feedback(ok, ok ? undefined : 'הכתיב הנכון: ' + item.word).then(function () {
            if (ok) return ctx.wait(900).then(nextRound);
            var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: nextRound }, 'הלאה');
            after.appendChild(next);
            try { next.focus(); } catch (e) {}
          });
        }
      }

      nextRound();
    }
  });
})();
