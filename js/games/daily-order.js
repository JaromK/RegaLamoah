/* סדר הפעולות — put the steps of an everyday task in order (executive). */
(function () {
  'use strict';

  var ROUNDS = 6;

  // Per level (1–20): how many steps of the task to order. Small steps, never speed.
  var LEVELS = [3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 8, 8];
  // Levels 21–50 never show more than the 8 lines of level 20: n real steps plus extra steps that
  // belong to a different task (intr) and must be left without a number; noTitle hides the task name.
  var EXTRA = [
    { n: 5, intr: 1 }, { n: 6, intr: 1 }, { n: 7, intr: 1 },                                  // 21–23
    { n: 6, intr: 1, noTitle: true }, { n: 7, intr: 1, noTitle: true },                       // 24–25
    { n: 5, intr: 2 }, { n: 6, intr: 2 },                                                     // 26–27
    { n: 5, intr: 2, noTitle: true }, { n: 6, intr: 2, noTitle: true }, { n: 6, intr: 2, noTitle: true }, // 28–30
    // 31–50: the extra steps come from a SIMILAR task (same group: kitchen with kitchen…), and from 41 the steps
    // are numbered backwards, from the last to the first. Still at most 8 lines on screen.
    { n: 6, intr: 1, near: true }, { n: 7, intr: 1, near: true }, { n: 6, intr: 1, near: true, noTitle: true },  // 31–33
    { n: 7, intr: 1, near: true, noTitle: true }, { n: 6, intr: 2, near: true },                                 // 34–35
    { n: 6, intr: 2, near: true, noTitle: true }, { n: 6, intr: 2, near: true, noTitle: true },                  // 36–37
    { n: 7, intr: 1, near: true, noTitle: true }, { n: 6, intr: 2, near: true, noTitle: true },                  // 38–39
    { n: 6, intr: 2, near: true, noTitle: true },                                                                 // 40
    { n: 5, rev: true }, { n: 6, rev: true }, { n: 7, rev: true }, { n: 6, intr: 1, rev: true },                 // 41–44
    { n: 7, intr: 1, rev: true, noTitle: true },                                                                  // 45
    { n: 6, intr: 1, near: true, rev: true }, { n: 6, intr: 2, near: true, rev: true },                          // 46–47
    { n: 6, intr: 2, near: true, rev: true, noTitle: true }, { n: 6, intr: 2, near: true, rev: true, noTitle: true }, // 48–49
    { n: 6, intr: 2, near: true, rev: true, noTitle: true }                                                       // 50
  ];
  var MAX_LEVEL = LEVELS.length + EXTRA.length;

  // Intruder steps come from a task in another group, so they cannot fit the current task.
  var GROUP = {
    'הכנת כוס תה': 'k', 'אפיית עוגה': 'k', 'הכנת סלט': 'k', 'הכנת חביתה': 'k', 'בישול פסטה': 'k',
    'הכנת כריך': 'k', 'הכנת מיץ תפוזים': 'k', 'שטיפת כלים': 'k',
    'כביסה': 'h', 'החלפת נורה': 'h', 'צחצוח שיניים': 'h', 'השקיית הגינה': 'h', 'שתילת פרח': 'h',
    'סידור המיטה': 'h', 'תליית תמונה': 'h', 'עטיפת מתנה': 'h'
  }; // everything else (errands, phone, travel) is group 'o'

  // Content words of a text, without one leading prefix letter (ה, ו, ב, ל, מ, ש, כ).
  function stems(text) {
    var out = {};
    text.replace(/[^\u05d0-\u05ea ]/g, ' ').split(' ').forEach(function (w) {
      if (w.length < 3) return;
      out[w] = true;
      if (w.length >= 4 && 'הובלמשכ'.indexOf(w.charAt(0)) !== -1) out[w.slice(1)] = true;
    });
    return out;
  }
  function sharesWord(a, b) {
    var sa = stems(a), sb = stems(b);
    return Object.keys(sa).some(function (w) { return sb[w]; });
  }

  // Each task lists its steps in the only sensible order. Every step clearly depends on the one
  // before it, so any subsequence of steps also has exactly one right order.
  var TASKS = [
    { title: 'הכנת כוס תה', steps: [
      'למלא את הקומקום במים',
      'להדליק את הקומקום',
      'לחכות שהמים ירתחו',
      'לשפוך את המים הרותחים לכוס עם שקית התה',
      'לחכות כמה דקות שהתה יחלחל',
      'להוציא את שקית התה מהכוס',
      'לשתות את התה'
    ] },
    { title: 'שליחת מכתב', steps: [
      'לכתוב את המכתב על דף',
      'לקפל את הדף',
      'להכניס את הדף המקופל למעטפה',
      'לסגור את המעטפה',
      'להדביק בול על המעטפה הסגורה',
      'ללכת עם המכתב לתיבת הדואר',
      'להכניס את המכתב לתיבה'
    ] },
    { title: 'אפיית עוגה', steps: [
      'לשבור את הביצים לקערה',
      'להוסיף לביצים קמח וסוכר',
      'לערבב הכול לבלילה חלקה',
      'לשפוך את הבלילה לתבנית',
      'להכניס את התבנית לתנור החם',
      'להוציא את העוגה האפויה מהתנור',
      'לחכות שהעוגה תתקרר',
      'לחתוך את העוגה לפרוסות'
    ] },
    { title: 'שתילת פרח', steps: [
      'לבחור מקום שמשי בגינה',
      'לחפור גומה במקום שבחרתם',
      'להכניס את השתיל לגומה',
      'לכסות את השורשים באדמה',
      'ללחוץ קלות על האדמה מסביב לשתיל',
      'להשקות את השתיל',
      'לראות אחרי כמה שבועות את הפרח פורח'
    ] },
    { title: 'כביסה', steps: [
      'למיין את הבגדים לפי צבעים',
      'להכניס את הבגדים למכונת הכביסה',
      'לסגור את דלת המכונה',
      'להפעיל את המכונה',
      'לחכות שהכביסה תסתיים',
      'להוציא את הבגדים הרטובים מהמכונה',
      'לתלות את הבגדים על החבל',
      'לקפל את הבגדים היבשים'
    ] },
    { title: 'נסיעה באוטובוס', steps: [
      'לבדוק באיזה קו לנסוע',
      'ללכת לתחנת האוטובוס',
      'לחכות בתחנה עד שהאוטובוס מגיע',
      'לעלות לאוטובוס',
      'לתקף את הכרטיס',
      'לשבת במקום פנוי',
      'ללחוץ על כפתור העצירה לפני התחנה',
      'לרדת מהאוטובוס'
    ] },
    { title: 'הכנת סלט', steps: [
      'להוציא את הירקות מהמקרר',
      'לשטוף את הירקות',
      'לחתוך את הירקות לקוביות',
      'להעביר את הירקות החתוכים לקערה',
      'לתבל בשמן, לימון ומלח',
      'לערבב את הסלט',
      'להגיש את הסלט לשולחן'
    ] },
    { title: 'החלפת נורה', steps: [
      'לשים לב שהנורה לא נדלקת',
      'לכבות את המתג',
      'לחכות שהנורה תתקרר',
      'להוציא את הנורה השרופה',
      'להבריג נורה חדשה במקומה',
      'להדליק את המתג',
      'לראות שהחדר מואר'
    ] },
    { title: 'ביקור אצל הרופא', steps: [
      'להחליט שצריך לראות רופא',
      'להתקשר לקופת החולים',
      'לבחור מועד פנוי לתור',
      'לרשום את התור ביומן',
      'להגיע למרפאה ביום התור',
      'להציג את כרטיס הקופה בקבלה',
      'לחכות עד שקוראים בשמכם',
      'להיכנס לחדר הרופא'
    ] },
    { title: 'אריזת מזוודה לטיסה', steps: [
      'להוציא את המזוודה מהארון',
      'לפתוח את המזוודה על המיטה',
      'לסדר את הבגדים בתוך המזוודה',
      'לסגור את הרוכסן של המזוודה',
      'לנסוע עם המזוודה לשדה התעופה',
      'למסור את המזוודה בדלפק',
      'לאסוף את המזוודה בסוף הטיסה'
    ] },
    { title: 'שטיפת כלים', steps: [
      'לאסוף את הכלים מהשולחן',
      'לפנות את שאריות האוכל לפח',
      'לשפשף את הכלים בספוג עם סבון',
      'לשטוף את הסבון מהכלים במים',
      'להניח את הכלים במתקן הייבוש',
      'לחכות שהכלים יתייבשו',
      'להחזיר את הכלים לארון'
    ] },
    { title: 'צחצוח שיניים', steps: [
      'לפתוח את משחת השיניים',
      'לשים משחה על המברשת',
      'לצחצח את השיניים כשתי דקות',
      'לירוק את המשחה לכיור',
      'לשטוף את הפה במים',
      'לנגב את הפה במגבת'
    ] },
    { title: 'הכנת חביתה', steps: [
      'להוציא ביצים מהמקרר',
      'לשבור את הביצים לקערה',
      'לטרוף את הביצים במזלג',
      'לשפוך את הביצים הטרופות למחבת החמה',
      'לחכות שהחביתה תתייצב',
      'להפוך את החביתה לצד השני',
      'להעביר את החביתה לצלחת',
      'לאכול את החביתה'
    ] },
    { title: 'קנייה בסופר', steps: [
      'לבחור מוצרים מהמדפים ולשים אותם בעגלה',
      'לגשת לקופה',
      'להניח את המוצרים על המסוע',
      'לחכות שהקופאית תעביר את כל המוצרים',
      'לשמוע כמה צריך לשלם',
      'לשלם בכרטיס או במזומן',
      'לקחת את הקבלה',
      'לצאת מהסופר עם הקניות'
    ] },
    { title: 'השקיית הגינה', steps: [
      'לחבר את הצינור לברז',
      'לפתוח את הברז',
      'להשקות את הצמחים',
      'לסגור את הברז',
      'לנתק את הצינור מהברז',
      'לגלגל את הצינור',
      'להחזיר את הצינור המגולגל למקומו'
    ] },
    { title: 'שיחת טלפון', steps: [
      'למצוא את המספר ברשימת אנשי הקשר',
      'ללחוץ על כפתור החיוג',
      'לחכות שיענו',
      'לומר שלום ולהציג את עצמכם',
      'לשוחח',
      'להיפרד לשלום',
      'לנתק את השיחה'
    ] },
    { title: 'עטיפת מתנה', steps: [
      'לקנות מתנה',
      'לגזור נייר עטיפה בגודל המתאים',
      'לעטוף את המתנה בנייר',
      'להדביק את קצוות הנייר בסלוטייפ',
      'לקשור סרט סביב החבילה',
      'להעניק את המתנה'
    ] },
    { title: 'סידור המיטה', steps: [
      'לקום מהמיטה',
      'להוריד את השמיכה והכריות מהמיטה',
      'ליישר את הסדין',
      'לפרוש את השמיכה על הסדין',
      'להניח את הכריות על השמיכה',
      'לפרוש כיסוי מיטה מעל הכול'
    ] },
    { title: 'בישול פסטה', steps: [
      'למלא סיר במים',
      'להעמיד את הסיר על האש',
      'לחכות שהמים ירתחו',
      'להכניס את הפסטה למים הרותחים',
      'לבשל כעשר דקות ולערבב מדי פעם',
      'לסנן את הפסטה במסננת',
      'להעביר את הפסטה לצלחת',
      'לשפוך רוטב על הפסטה שבצלחת'
    ] },
    { title: 'משיכת כסף בבנק', steps: [
      'לשים את תעודת הזהות בתיק',
      'לצאת מהבית לסניף הבנק',
      'לקחת מספר תור מהמכונה',
      'לחכות שהמספר יופיע על המסך',
      'לגשת לפקיד',
      'להציג את תעודת הזהות',
      'לקבל את הכסף מהפקיד',
      'לספור את הכסף ולשים אותו בארנק'
    ] },
    { title: 'הכנת כריך', steps: [
      'להוציא את הלחם מהשקית',
      'לפרוס שתי פרוסות',
      'למרוח חמאה על הפרוסות',
      'להניח גבינה ועגבנייה על פרוסה אחת',
      'לכסות בפרוסה השנייה',
      'לחתוך את הכריך לשניים',
      'להניח את הכריך על צלחת',
      'לאכול את הכריך'
    ] },
    { title: 'שליחת הודעה בטלפון', steps: [
      'לפתוח את נעילת הטלפון',
      'להיכנס ליישומון ההודעות',
      'לבחור את האדם שרוצים לכתוב לו',
      'להקליד את ההודעה',
      'ללחוץ על "שליחה"',
      'לחכות לתשובה',
      'לקרוא את התשובה שהגיעה'
    ] },
    { title: 'תליית תמונה', steps: [
      'לבחור מקום על הקיר',
      'לסמן נקודה בעיפרון',
      'לקדוח חור בנקודה שסימנתם',
      'להכניס דיבל לחור',
      'להבריג בורג לתוך הדיבל',
      'לתלות את התמונה על הבורג',
      'ליישר את התמונה'
    ] },
    { title: 'הכנת מיץ תפוזים', steps: [
      'לשטוף את התפוזים',
      'לחצות את התפוזים',
      'לסחוט את החצאים במסחטה',
      'למזוג את המיץ לכוס',
      'לשתות את המיץ',
      'לשטוף את הכוס הריקה'
    ] }
  ];

  var css = [
    '.do-wrap{width:100%;max-width:34rem;display:flex;flex-direction:column;gap:.45rem;}',
    '.play-board:has(.do-wrap){gap:.6rem;padding-block:.75rem;}', /* up to 8 steps + the check button fit one phone screen */
    '.do-wrap .g-actions .btn-lg,.play-board:has(.do-wrap) .btn-lg{min-height:3.3rem;padding-block:.4rem;}',
    '.do-title{font-size:1.2rem;font-weight:800;text-align:center;color:var(--executive);margin:0;line-height:1.25;}',
    /* full-width rows: 2.8rem (50px) tall is still an easy target */
    '.do-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.3rem;}',
    '.do-list .do-step{width:100%;min-height:2.7rem;display:flex;align-items:center;gap:.5rem;font-size:1.05rem;font-weight:700;',
    'text-align:start;padding:.15rem .5rem;line-height:1.1;}',
    '.do-num{flex:none;width:1.9rem;height:1.9rem;display:grid;place-items:center;border-radius:50%;',
    'border:2px dashed var(--line);font-weight:800;font-size:1.15rem;font-variant-numeric:tabular-nums;}',
    '.do-text{flex:1;min-width:0;}',
    '.do-from{flex:none;font-size:.9rem;font-weight:700;color:var(--ink-soft);}',
    '.do-step.is-placed{border-color:var(--executive);background:var(--executive-soft);}',
    '.do-step.is-placed .do-num{border:0;background:var(--executive);color:var(--surface);}',
    '.do-step.is-correct .do-num{border:0;background:var(--good);color:var(--surface);}',
    '.do-step.is-wrong .do-num{border:0;background:var(--bad);color:var(--surface);}'
  ].join('');

  BrainGames.register({
    id: 'daily-order',
    name: 'סדר הפעולות',
    skill: 'executive',
    tagline: 'סדרו את שלבי המשימה לפי הסדר',
    benefit: 'תכנון ורצף פעולות',
    instructions: [
      'מופיעה משימה יומיומית, והשלבים שלה מעורבבים.',
      'לחצו על השלבים לפי הסדר: קודם הראשון, אחר כך השני, וכן הלאה. כל שלב מקבל מספר.',
      'טעיתם? לחצו שוב על שלב ממוספר כדי לבטל את המספר שלו.',
      'כשכל השלבים במקום, לחצו "בדיקה". ברמות הגבוהות יש שלב שלא שייך למשימה: השאירו אותו בלי מספר.',
      'ברמות הגבוהות מאוד מסדרים מהסוף להתחלה: מספר 1 הוא השלב האחרון.'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(MAX_LEVEL, Math.round(Number(ctx.level)) || 1));
      var extra = level > LEVELS.length ? EXTRA[level - LEVELS.length - 1] : null;
      var count = extra ? extra.n : LEVELS[level - 1];
      var nIntr = extra ? extra.intr || 0 : 0;
      var rev = !!(extra && extra.rev);

      var pool = TASKS.filter(function (t) { return t.steps.length >= count; });
      var tasks = ctx.shuffle(pool).slice(0, ROUNDS);
      while (tasks.length < ROUNDS) tasks.push(ctx.pick(pool)); // safety; every level has enough tasks

      var round = 0;
      var score = 0;

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({
            correct: score,
            total: ROUNDS,
            note: 'סידרתם נכון ' + score + ' מתוך ' + ROUNDS + ' משימות של ' + count + ' שלבים' +
              (nIntr ? ' (ומצאתם את מה שלא שייך)' : '')
          });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        playRound(tasks[round - 1]);
      }

      // Ordered subsequence of `n` steps that keeps the first and the last.
      function chooseSteps(steps, n) {
        n = Math.min(n, steps.length);
        var middle = [];
        for (var i = 1; i < steps.length - 1; i++) middle.push(i);
        var keep = ctx.shuffle(middle).slice(0, n - 2).sort(function (a, b) { return a - b; });
        return [steps[0]].concat(keep.map(function (i) { return steps[i]; }), [steps[steps.length - 1]]);
      }

      // Steps from other-group tasks that share no word with the current task.
      function intruders(task, k) {
        var g = GROUP[task.title] || 'o';
        var all = task.title + ' ' + task.steps.join(' ');
        var pool = [];
        TASKS.forEach(function (t) {
          if (t.title === task.title) return;
          // usually from another group; at 31+ ('near') from a similar task of the same group
          if (((GROUP[t.title] || 'o') === g) !== !!(extra && extra.near)) return;
          t.steps.forEach(function (s) { if (!sharesWord(s, all)) pool.push({ s: s, from: t.title }); });
        });
        var out = [];
        ctx.shuffle(pool).forEach(function (p) {
          if (out.length < k && out.every(function (o) { return o.from !== p.from && !sharesWord(o.s, p.s); })) out.push(p);
        });
        return out;
      }

      function playRound(task) {
        root.innerHTML = '';
        var steps = chooseSteps(task.steps, count);
        var n = steps.length;          // real steps, indexes 0..n-1 in the right order
        var extraSteps = nIntr ? intruders(task, nIntr) : [];
        extraSteps.forEach(function (p) { steps.push(p.s); }); // intruders: indexes n, n+1
        var total = steps.length;
        var order = [];
        for (var i = 0; i < total; i++) order.push(i);
        var shuffled = ctx.shuffle(order);
        // Never show the steps already in the right order.
        while (total > 1 && shuffled.join() === order.join()) shuffled = ctx.shuffle(order);

        var placed = []; // step indexes in the order the player chose
        var locked = false;

        // One list only: the steps stay where they are and get a number when tapped.
        var items = {};
        var list = el('ol', { class: 'do-list', 'aria-label': 'שלבי המשימה' });
        shuffled.forEach(function (idx) {
          var num = el('span', { class: 'do-num', 'aria-hidden': 'true' });
          var b = el('button', {
            class: 'g-choice do-step', type: 'button',
            onclick: function () { toggle(idx); }
          }, [num, el('span', { class: 'do-text' }, steps[idx])]);
          items[idx] = { btn: b, num: num, li: el('li', null, b) };
          list.appendChild(items[idx].li);
        });

        var checkBtn = el('button', { class: 'btn btn-primary btn-lg', type: 'button', disabled: true, onclick: check }, 'בדיקה');
        var actions = el('div', { class: 'g-actions' }, checkBtn);

        var titleEl = el('p', { class: 'do-title' }, extra && extra.noTitle ? 'איזו משימה זו? ❓' : task.title);
        var wrap = el('div', { class: 'do-wrap' }, [
          titleEl,
          list,
          actions
        ]);
        root.appendChild(wrap);

        ctx.setStatus(rev ? (extraSteps.length ? 'מהסוף להתחלה, ' + (extraSteps.length === 1 ? 'ושלב אחד מיותר' : 'ו-2 שלבים מיותרים') : 'מהסוף להתחלה: קודם השלב האחרון')
          : !extraSteps.length ? 'לחצו על השלבים לפי הסדר הנכון'
          : extraSteps.length === 1 ? 'יש שלב אחד מיותר, דלגו עליו'
            : 'יש 2 שלבים מיותרים, דלגו עליהם');
        render();

        function render() {
          shuffled.forEach(function (idx) {
            var pos = placed.indexOf(idx);
            var it = items[idx];
            it.num.textContent = pos === -1 ? '' : String(pos + 1);
            it.btn.classList.toggle('is-placed', pos !== -1);
            it.btn.setAttribute('aria-label', steps[idx] + (pos === -1 ? '' : '. מספר ' + (pos + 1) + ', לחצו כדי לבטל'));
          });
          checkBtn.disabled = placed.length !== n;
        }

        function toggle(idx) {
          if (locked) return;
          ctx.sound('tap');
          var pos = placed.indexOf(idx);
          if (pos === -1) {
            if (placed.length >= n) { ctx.setStatus('כבר מספרתם ' + n + ' שלבים. השאר לא שייך'); return; }
            placed.push(idx);
          } else placed.splice(pos, 1);
          render();
          if (placed.length === n) ctx.setStatus(extraSteps.length ? 'השאר לא שייך. לחצו "בדיקה"' : 'הכול ממוספר? לחצו "בדיקה"');
          else if (pos === -1) ctx.setStatus('ומה השלב הבא?');
          else ctx.setStatus('בוטל. בחרו את שלב ' + (placed.length + 1));
        }

        function check() {
          if (locked || placed.length !== n) return;
          locked = true;
          var ok = true;
          // Rearrange the list into the right order; mark each step by where the player put it.
          // backwards levels: the k-th tap should be the k-th step from the end
          for (var k = 0; k < n; k++) {
            var idx = rev ? n - 1 - k : k;
            var it = items[idx];
            var chosen = placed.indexOf(idx);
            var right = chosen === k;
            if (!right) ok = false;
            it.btn.disabled = true;
            it.btn.classList.remove('is-placed');
            it.btn.classList.add(right ? 'is-correct' : 'is-wrong');
            it.num.textContent = String(k + 1);
            it.btn.setAttribute('aria-label', 'שלב ' + (k + 1) + ': ' + steps[idx] + (right ? '' : '. שמתם אותו במקום ' + (chosen + 1)));
            list.appendChild(it.li);
          }
          // The steps from another task go last, marked "לא שייך" (green if left without a number).
          for (var x = n; x < total; x++) {
            var ix = items[x];
            var left = placed.indexOf(x) === -1;
            if (!left) ok = false;
            ix.btn.disabled = true;
            ix.btn.classList.remove('is-placed');
            ix.btn.classList.add(left ? 'is-correct' : 'is-wrong');
            ix.num.textContent = '✗';
            ix.btn.setAttribute('aria-label', 'לא שייך: ' + steps[x] + ' (מתוך "' + extraSteps[x - n].from + '")');
            ix.btn.appendChild(el('span', { class: 'do-from' }, 'לא שייך')); // short, so the row stays one line
            list.appendChild(ix.li);
          }
          titleEl.textContent = task.title;
          if (ok) score++;
          ctx.setStatus(ok ? 'מצוין! זה הסדר הנכון' : rev ? 'כמעט. כך הסדר מהסוף להתחלה' : 'כמעט. כך הסדר הנכון');
          checkBtn.hidden = true;
          ctx.feedback(ok, ok ? undefined : 'הרשימה מסודרת עכשיו נכון').then(function () {
            if (ok) return ctx.wait(900).then(nextRound);
            // Let the player read the right order at their own pace.
            var nextBtn = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () {
              nextBtn.disabled = true;
              nextRound();
            } }, round >= ROUNDS ? 'לסיכום' : 'הלאה');
            actions.appendChild(nextBtn);
          });
        }
      }

      nextRound();
    }
  });
})();
