/* סדר הפעולות — put the steps of an everyday task in order (executive). */
(function () {
  'use strict';

  var ROUNDS = 6;

  // Per level (1–20): how many steps of the task to order. Small steps, never speed.
  var LEVELS = [3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 7, 7, 7, 8, 8];

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
    '.do-wrap{width:100%;max-width:34rem;display:flex;flex-direction:column;gap:.6rem;}',
    '.do-title{font-size:1.2rem;font-weight:800;text-align:center;color:var(--executive);margin:0;line-height:1.25;}',
    '.do-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.6rem;}',
    '.do-list .do-step{width:100%;min-height:3.2rem;display:flex;align-items:center;gap:.5rem;font-size:1.1rem;font-weight:700;',
    'text-align:start;padding:.25rem .6rem;line-height:1.15;}',
    '.do-num{flex:none;width:2.1rem;height:2.1rem;display:grid;place-items:center;border-radius:50%;',
    'border:2px dashed var(--line);font-weight:800;font-size:1.15rem;font-variant-numeric:tabular-nums;}',
    '.do-text{flex:1;min-width:0;}',
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
      'כשכל השלבים במקום, לחצו "בדיקה".'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var count = LEVELS[level - 1];

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
            note: 'סידרתם נכון ' + score + ' מתוך ' + ROUNDS + ' משימות של ' + count + ' שלבים'
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

      function playRound(task) {
        root.innerHTML = '';
        var steps = chooseSteps(task.steps, count);
        var n = steps.length;
        var order = [];
        for (var i = 0; i < n; i++) order.push(i);
        var shuffled = ctx.shuffle(order);
        // Never show the steps already in the right order.
        while (n > 1 && shuffled.join() === order.join()) shuffled = ctx.shuffle(order);

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

        var wrap = el('div', { class: 'do-wrap' }, [
          el('p', { class: 'do-title' }, task.title),
          list,
          actions
        ]);
        root.appendChild(wrap);

        ctx.setStatus('לחצו על השלבים לפי הסדר הנכון');
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
          if (pos === -1) placed.push(idx);
          else placed.splice(pos, 1);
          render();
          if (placed.length === n) ctx.setStatus('הכול ממוספר? לחצו "בדיקה"');
          else if (pos === -1) ctx.setStatus('ומה השלב הבא?');
          else ctx.setStatus('בוטל. בחרו את שלב ' + (placed.length + 1));
        }

        function check() {
          if (locked || placed.length !== n) return;
          locked = true;
          var ok = true;
          // Rearrange the list into the right order; mark each step by where the player put it.
          for (var idx = 0; idx < n; idx++) {
            var it = items[idx];
            var chosen = placed.indexOf(idx);
            var right = chosen === idx;
            if (!right) ok = false;
            it.btn.disabled = true;
            it.btn.classList.remove('is-placed');
            it.btn.classList.add(right ? 'is-correct' : 'is-wrong');
            it.num.textContent = String(idx + 1);
            it.btn.setAttribute('aria-label', 'שלב ' + (idx + 1) + ': ' + steps[idx] + (right ? '' : '. שמתם אותו במקום ' + (chosen + 1)));
            list.appendChild(it.li);
          }
          if (ok) score++;
          ctx.setStatus(ok ? 'מצוין! זה הסדר הנכון' : 'כמעט. כך הסדר הנכון');
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
