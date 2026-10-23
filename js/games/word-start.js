/* מתחילים מילה — pick the real Hebrew words that start with the given two letters (language). */
(function () {
  'use strict';

  var ROUNDS = 7;

  // Per opening: [very common words, common words, rarer words, made-up decoys (not words)].
  // Decoys were checked so they are not words, not word + prefix (ב/כ/ל/מ/ש/ה/ו) and not slang.
  var POOL = {
    'של': ['שלום שלג שלושה', 'שלט שלב שלולית', 'שלד שלווה שלכת', 'שלצוט שלקפיג שלגבוע שלמיזק שלתופג'],
    'בי': ['בית ביצה בירה', 'ביטוח ביקור בימה', 'ביצוע בירור ביוב', 'ביזגוט ביפקה ביטקון בילגוף ביסעוג'],
    'מש': ['משפחה משחק משקפיים', 'משקל משפט משאית', 'משכורת משמעות משענת', 'משגוט משפזה משלקוג משעוטן משזבור'],
    'כו': ['כוס כובע כוכב', 'כותרת כורסה כוונה', 'כוורת כותל כונן', 'כוזפה כוטגה כופלוג כוחזב כוגליץ'],
    'תפ': ['תפוח תפוז תפילה', 'תפריט תפקיד תפאורה', 'תפנית תפוקה תפזורת', 'תפדוק תפכוט תפזיג תפגטה תפקוזה'],
    'גל': ['גלידה גלגל גלים', 'גלויה גלימה גלשן', 'גלעין גלריה גלגלת', 'גלפוט גלזיק גלטוף גלצוב גלקפת'],
    'חל': ['חלון חלב חלום', 'חלוק חליפה חלל', 'חלוץ חלזון חלקה', 'חלפוג חלזיט חלגדה חלטמון חלעזק'],
    'מכ': ['מכונית מכתב מכנסיים', 'מכשיר מכולת מכסה', 'מכתש מכלול מכרז', 'מכזוט מכפוגה מכגיץ מכטלוף מכזדה'],
    'רו': ['רופא רוח רוב', 'רוטב רושם רוקח', 'רומן רוחב רוויה', 'רוזפק רוגטה רוצבק רוקזב רוטזה'],
    'סב': ['סבתא סבא סבון', 'סבל סביבה סבלנות', 'סביון סבך סברה', 'סבזוט סבקזע סבטוח סבצוג סבפוז'],
    'פר': ['פרח פרה פרי', 'פרפר פרס פרק', 'פרגוד פרוסה פרדס', 'פרזוג פרגוץ פרדוט פרקזה פרטוג'],
    'שמ': ['שמש שמיים שמלה', 'שמן שמיכה שמחה', 'שמרטף שמורה שמנת', 'שמזקוב שמפעג שמגלוט שמטקה שמצפוד'],
    'דג': ['דגל דגים', 'דגם דגן', 'דגימה דגירה', 'דגזפה דגסוק דגטלון דגצוב דגחזר'],
    'כל': ['כלב כלי כלה', 'כלוב כלכלה כלל', 'כליה כלנית כלור', 'כלזוט כלפגה כלגדוץ כלטמוף כלשגבה'],
    'ספ': ['ספר ספה ספורט', 'ספרייה ספינה ספל', 'ספוג ספק ספסל', 'ספגוט ספדלה ספזגה ספכוט ספטזון'],
    'אר': ['ארון ארנק ארוחה', 'ארגז ארנב ארץ', 'ארמון ארכיון ארגון', 'ארשגוב ארפוץ ארקזה ארטבוג ארדזה'],
    'מט': ['מטבח מטוס מטרייה', 'מטבע מטרה מטאטא', 'מטמון מטפחת מטוטלת', 'מטזוג מטפוץ מטגלה מטקוז מטצבה'],
    'כר': ['כרטיס כרית כרוב', 'כריך כרם כרזה', 'כרכרה כרוז כרס', 'כרפוט כרגפה כרטזון כרצוב כרקפון'],
    'גו': ['גוף גור גומי', 'גובה גורל גוון', 'גוזל גומה גולה', 'גוזפק גוטבה גוצלף גוקזה גופדוג'],
    'חו': ['חול חולצה חום', 'חוף חוט חודש', 'חומה חוזה חותמת', 'חוזגה חופלוג חושגפה חוקדזה חוטלוץ'],
    'נע': ['נעל נעליים נער', 'נערה נענע נעילה', 'נעורים נעימה', 'נעמבוט נעגוט נעפקור נעטבה נעדזוג'],
    'צב': ['צבע צבי צבא', 'צבעוני צבת צביטה', 'צבר צביון צבירה', 'צבזוג צבגלה צבפוט צבטקה צבקזון'],
    'קו': ['קופה קומה קוף', 'קובייה קוסם קולב', 'קורה קוטר קורנס', 'קומפגה קוגטה קופלוז קוגבוז קודזיג'],
    'לי': ['לימון לילה ליצן', 'ליטר ליגה ליווי', 'ליקוי ליטוף ליבנה', 'ליזגוט ליפקטה ליטקוז ליצבפה ליסגוף'],
    'עג': ['עגבנייה עגלה עגיל', 'עגול עגורן', 'עגלון עגינה', 'עגשבוט עגטפז עגפלוק עגצמה עגדוז'],
    'פי': ['פיל פיצה פינה', 'פיתה פירות פיקוח', 'פיגום פיוס פיתוי', 'פיזגה פיקזוט פידלף פיגצה פיעזוב'],
    'דל': ['דלת דלי דלעת', 'דלק דלפק דלקת', 'דליפה דליל', 'דלמגוש דלגוט דלפוז דלצבה דלקטון']
  };

  // Per level (1–20): options on screen, how many are real words, which word tiers to prefer
  // (0 = very common, 1 = common, 2 = rarer). At most 5 options so the screen stays calm.
  var LEVELS = [
    { options: 4, correct: 1, tiers: [0] },    // 1
    { options: 4, correct: 1, tiers: [0, 1] }, // 2
    { options: 4, correct: 2, tiers: [0] },    // 3
    { options: 4, correct: 2, tiers: [0, 1] }, // 4
    { options: 5, correct: 2, tiers: [0] },    // 5
    { options: 5, correct: 2, tiers: [0, 1] }, // 6
    { options: 5, correct: 2, tiers: [1] },    // 7
    { options: 5, correct: 3, tiers: [0] },    // 8
    { options: 5, correct: 3, tiers: [0, 1] }, // 9
    { options: 5, correct: 2, tiers: [1, 2] }, // 10
    { options: 5, correct: 3, tiers: [1] },    // 11
    { options: 5, correct: 2, tiers: [2] },    // 12
    { options: 5, correct: 3, tiers: [1, 2] }, // 13
    { options: 5, correct: 3, tiers: [1, 2] }, // 14
    { options: 5, correct: 2, tiers: [2] },    // 15
    { options: 5, correct: 3, tiers: [2, 1] }, // 16
    { options: 5, correct: 3, tiers: [2, 1] }, // 17
    { options: 5, correct: 3, tiers: [2] },    // 18
    { options: 5, correct: 3, tiers: [2] },    // 19
    { options: 5, correct: 3, tiers: [2] }     // 20
  ];

  function words(str) { return str.split(' ').filter(Boolean); }
  function realWords(open) { var p = POOL[open]; return words(p[0]).concat(words(p[1]), words(p[2])); }

  // Build one round for an opening: { open, options: [{w, real}], real: [words shown], more: [other real words] }.
  function makeRound(open, spec, rnd) {
    var p = POOL[open];
    var picked = [];
    // preferred tiers first (shuffled together), then the remaining tiers nearest to them
    var order = spec.tiers.slice();
    [0, 1, 2].sort(function (a, b) {
      return Math.abs(a - spec.tiers[0]) - Math.abs(b - spec.tiers[0]);
    }).forEach(function (t) { if (order.indexOf(t) === -1) order.push(t); });
    var preferred = [];
    spec.tiers.forEach(function (t) { preferred = preferred.concat(words(p[t])); });
    rnd.shuffle(preferred).forEach(function (w) { if (picked.length < spec.correct) picked.push(w); });
    order.forEach(function (t) {
      rnd.shuffle(words(p[t])).forEach(function (w) {
        if (picked.length < spec.correct && picked.indexOf(w) === -1) picked.push(w);
      });
    });
    var fakes = rnd.shuffle(words(p[3])).slice(0, spec.options - picked.length);
    var options = rnd.shuffle(picked.map(function (w) { return { w: w, real: true }; })
      .concat(fakes.map(function (w) { return { w: w, real: false }; })));
    var more = rnd.shuffle(realWords(open).filter(function (w) { return picked.indexOf(w) === -1; })).slice(0, 2);
    return { open: open, options: options, real: picked, more: more };
  }

  var css = [
    '.ws-open{font-family:var(--font-display);font-weight:900;font-size:clamp(2.4rem,9vw,3.2rem);line-height:1.1;letter-spacing:.04em;}',
    '.ws-open .ws-gap{color:var(--ink-soft);letter-spacing:.1em;}',
    '.ws-opts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;width:100%;max-width:24rem;}',
    '.ws-opts.ws-odd .ws-opt:last-child{grid-column:1 / -1;justify-self:center;width:calc(50% - .375rem);}',
    '.ws-opt.g-choice{min-height:3.75rem;font-size:1.45rem;padding:.5rem .6rem;}',
    '.ws-opt .ws-lead{color:var(--language);}',
    '.ws-opt.is-correct .ws-lead,.ws-opt.is-wrong .ws-lead{color:inherit;}',
    '.ws-opt.ws-missed{border-style:dashed;}',
    '.ws-mark{margin-inline-start:.35rem;}',
    '.ws-more{font-size:1.1rem;}'
  ].join('');

  BrainGames.register({
    id: 'word-start',
    name: 'מתחילים מילה',
    skill: 'language',
    tagline: 'מצאו מילים אמיתיות שמתחילות באותיות',
    benefit: 'שליפת מילים ואוצר מילים',
    instructions: [
      'למעלה יופיעו שתי אותיות פתיחה.',
      'מתחת יש כמה מילים. רק חלקן מילים אמיתיות.',
      'בחרו את המילים האמיתיות. כתוב כמה לבחור.',
      'לחצו "בדיקה" כשתסיימו.'
    ],
    css: css,
    _model: { POOL: POOL, LEVELS: LEVELS, makeRound: makeRound, realWords: realWords },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var openings = ctx.shuffle(Object.keys(POOL)).slice(0, ROUNDS);
      var round = 0, score = 0;

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({
            correct: score,
            total: ROUNDS,
            note: 'זיהיתם נכון את כל המילים ב-' + score + ' מתוך ' + ROUNDS + ' סבבים'
          });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        playRound(makeRound(openings[round - 1], spec, ctx));
      }

      function playRound(R) {
        root.innerHTML = '';
        var need = R.real.length;
        var selected = {};
        var count = 0;
        var done = false;

        var head = el('div', { class: 'ws-open', 'aria-label': 'מילים שמתחילות ב' + R.open }, [
          R.open, el('span', { class: 'ws-gap', 'aria-hidden': 'true' }, '__')
        ]);
        var buttons = R.options.map(function (o, i) {
          return el('button', {
            class: 'g-choice ws-opt', type: 'button', 'aria-pressed': 'false',
            onclick: function () { toggle(i); }
          }, [el('span', { class: 'ws-lead' }, o.w.slice(0, 2)), o.w.slice(2)]);
        });
        var opts = el('div', { class: 'ws-opts' + (buttons.length % 2 ? ' ws-odd' : '') }, buttons);
        var checkBtn = el('button', {
          class: 'btn btn-primary btn-lg', type: 'button', disabled: true, onclick: check
        }, 'בדיקה');
        var actions = el('div', { class: 'g-actions' }, checkBtn);

        root.appendChild(head);
        root.appendChild(opts);
        root.appendChild(actions);
        ctx.setStatus(need === 1 ? 'בחרו מילה אחת אמיתית' : 'בחרו ' + need + ' מילים אמיתיות');

        function toggle(i) {
          if (done) return;
          ctx.sound('tap');
          if (selected[i]) { delete selected[i]; count--; }
          else {
            if (need === 1) { // a single answer: switch the choice instead of blocking
              Object.keys(selected).forEach(function (k) {
                delete selected[k]; count--;
                buttons[k].classList.remove('is-selected');
                buttons[k].setAttribute('aria-pressed', 'false');
              });
            } else if (count >= need) return;
            selected[i] = true; count++;
          }
          buttons[i].classList.toggle('is-selected', !!selected[i]);
          buttons[i].setAttribute('aria-pressed', selected[i] ? 'true' : 'false');
          checkBtn.disabled = count !== need;
        }

        function check() {
          if (done || count !== need) return;
          done = true;
          actions.remove();
          var hits = 0;
          buttons.forEach(function (b, i) {
            b.disabled = true;
            b.classList.remove('is-selected');
            var o = R.options[i];
            if (o.real) {
              b.classList.add('is-correct');
              if (selected[i]) hits++; else b.classList.add('ws-missed');
              b.appendChild(el('span', { class: 'ws-mark', 'aria-hidden': 'true' }, '✓'));
            } else if (selected[i]) {
              b.classList.add('is-wrong');
              b.appendChild(el('span', { class: 'ws-mark', 'aria-hidden': 'true' }, '✗'));
            }
          });
          var ok = hits === need;
          if (ok) score++;
          if (R.more.length) {
            root.appendChild(el('p', { class: 'g-hint ws-more' }, 'עוד מילים: ' + R.more.join(', ')));
          }
          ctx.setStatus(ok ? 'מצוין!' : 'המילים האמיתיות מסומנות בירוק');
          ctx.feedback(ok, ok ? undefined : 'המילים האמיתיות: ' + R.real.join(', ')).then(function () {
            return ctx.wait(1500);
          }).then(nextRound);
        }
      }

      nextRound();
    }
  });
})();
