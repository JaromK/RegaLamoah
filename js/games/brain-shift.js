/* החלפת משימה — the number's position decides which question to answer (executive, task switching). */
(function () {
  'use strict';

  var TRIALS = 16;
  var NUMBERS = [1, 2, 3, 4, 6, 7, 8, 9]; // 5 is left out so "greater than 5" is never ambiguous

  // Per level (1–30): how many times the number moves to the other half during the 16 cards,
  // and how strongly the halves are colour-coded (2 = full colour, 1 = faint, 0 = neutral).
  var LEVELS = [
    { switches: 2,  color: 2 }, // 1
    { switches: 2,  color: 2 }, // 2
    { switches: 3,  color: 2 }, // 3
    { switches: 3,  color: 2 }, // 4
    { switches: 4,  color: 2 }, // 5
    { switches: 5,  color: 2 }, // 6
    { switches: 6,  color: 2 }, // 7
    { switches: 7,  color: 2 }, // 8
    { switches: 8,  color: 2 }, // 9
    { switches: 9,  color: 2 }, // 10
    { switches: 9,  color: 1 }, // 11
    { switches: 10, color: 1 }, // 12
    { switches: 11, color: 1 }, // 13
    { switches: 12, color: 1 }, // 14
    { switches: 12, color: 1 }, // 15
    { switches: 13, color: 0 }, // 16
    { switches: 13, color: 0 }, // 17
    { switches: 14, color: 0 }, // 18
    { switches: 14, color: 0 }, // 19
    { switches: 15, color: 0 }, // 20 — the half changes on every card
    // 21–30: a short sum (later also a subtraction) instead of the number: first solve, then answer.
    { switches: 15, color: 0, expr: 0.25 },                      // 21
    { switches: 15, color: 0, expr: 0.4 },                       // 22
    { switches: 15, color: 0, expr: 0.55 },                      // 23
    { switches: 15, color: 0, expr: 0.7 },                       // 24
    { switches: 15, color: 0, expr: 0.85 },                      // 25
    { switches: 15, color: 0, expr: 1, sub: 0.25 },              // 26
    { switches: 15, color: 0, expr: 1, sub: 0.4 },               // 27
    { switches: 15, color: 0, expr: 1, sub: 0.5, big: true },    // 28
    { switches: 15, color: 0, expr: 1, sub: 0.55, big: true },   // 29
    { switches: 15, color: 0, expr: 1, sub: 0.6, big: true }     // 30
  ];

  var QUESTIONS = {
    top: { label: 'למעלה:', text: 'האם המספר זוגי?' },
    bottom: { label: 'למטה:', text: 'האם המספר גדול מ-5?' }
  };

  function answerFor(half, num) {
    return half === 'top' ? num % 2 === 0 : num > 5;
  }

  function explain(half, num, text) {
    var pre = text ? '⁦' + text + ' = ' + num + '⁩. ' : ''; // LTR-isolated "3+4 = 7"
    if (half === 'top') return pre + num + (num % 2 === 0 ? ' הוא זוגי' : ' הוא אי-זוגי');
    return pre + num + (num > 5 ? ' גדול מ-5' : ' קטן מ-5');
  }

  var MINUS = '−';

  // A short exercise whose result is num (1–9, never 5), e.g. "3+4" or (big) "14−6".
  function exprFor(num, spec, randInt) {
    if (Math.random() < (spec.sub || 0)) {
      var b = spec.big ? randInt(3, 9) : randInt(1, Math.min(5, 9 - 1));
      if (num + b > (spec.big ? 18 : 9)) b = Math.max(1, (spec.big ? 18 : 9) - num);
      return (num + b) + MINUS + b;
    }
    if (num < 2) return null;
    var a = randInt(1, num - 1);
    return a + '+' + (num - a);
  }

  // Which half each card appears in, with exactly `switches` changes.
  // With few changes, avoid single-card blocks so the early levels feel like calm runs.
  function makeHalves(switches, shuffle) {
    var points = [];
    for (var i = 1; i < TRIALS; i++) points.push(i);
    var chosen = null;
    for (var attempt = 0; attempt < 200; attempt++) {
      var pick = shuffle(points).slice(0, switches).sort(function (a, b) { return a - b; });
      var spaced = true;
      if (switches <= 7) {
        for (var j = 1; j < pick.length; j++) if (pick[j] - pick[j - 1] < 2) spaced = false;
      }
      if (spaced) { chosen = pick; break; }
    }
    if (!chosen) chosen = shuffle(points).slice(0, switches);
    var isSwitch = {};
    chosen.forEach(function (p) { isSwitch[p] = true; });
    var half = Math.random() < 0.5 ? 'top' : 'bottom';
    var out = [];
    for (var t = 0; t < TRIALS; t++) {
      if (isSwitch[t]) half = half === 'top' ? 'bottom' : 'top';
      out.push(half);
    }
    return out;
  }

  var css = [
    '.bsh-card{width:100%;max-width:24rem;display:flex;flex-direction:column;gap:.45rem;}',
    '.bsh-half{position:relative;min-height:6.6rem;border-radius:var(--radius);border:3px solid var(--line);',
    'background:var(--surface-2);display:flex;flex-direction:column;align-items:center;gap:.4rem;padding:.4rem .75rem;}',
    '.bsh-label{font-size:1.1rem;font-weight:700;text-align:center;color:var(--ink-soft);text-wrap:balance;}',
    '.bsh-label b{font-weight:900;}',
    '.bsh-slot{flex:1;display:grid;place-items:center;width:100%;}',
    '.bsh-num{min-width:4rem;height:4rem;border-radius:var(--radius);display:grid;place-items:center;',
    'background:var(--surface);border:3px solid var(--ink);color:var(--ink);font-family:var(--font-display);',
    'font-weight:900;font-size:2.8rem;line-height:1;font-variant-numeric:tabular-nums;box-shadow:var(--shadow);}',
    /* full colour */
    '.bsh-c2 .bsh-top{background:var(--logic-soft);border-color:var(--logic);}',
    '.bsh-c2 .bsh-top .bsh-label{color:var(--logic);}',
    '.bsh-c2 .bsh-bottom{background:var(--sun-soft);border-color:var(--sun);}',
    '.bsh-c2 .bsh-bottom .bsh-label{color:var(--ink);}',
    /* faint: only the frame keeps a hint of colour */
    '.bsh-c1 .bsh-top{border-color:var(--logic);}',
    '.bsh-c1 .bsh-bottom{border-color:var(--sun);}',
    /* neutral (level 16+): the plain grey of .bsh-half */
    '.bsh-half.bsh-active{box-shadow:0 0 0 2px var(--surface),0 0 0 4px var(--ink-soft);}',
    '.bsh-num.bsh-expr{padding:0 .6rem;font-size:2.4rem;white-space:nowrap;}',
    '.bsh-answers{width:100%;max-width:24rem;grid-template-columns:1fr 1fr;}',
    '.bsh-answers .g-choice{min-height:4.2rem;font-size:1.6rem;}'
  ].join('');

  BrainGames.register({
    id: 'brain-shift',
    name: 'החלפת משימה',
    skill: 'executive',
    tagline: 'עברו בין שתי שאלות לפי מקום המספר',
    benefit: 'גמישות מחשבתית ומעבר בין משימות',
    instructions: [
      'מספר יופיע בחצי העליון או בחצי התחתון של הכרטיס. ברמות הגבוהות יופיע תרגיל קצר: פתרו אותו קודם.',
      'למעלה ענו: האם המספר זוגי? למטה ענו: האם המספר גדול מ-5?',
      'לחצו "כן" או "לא". השאלות כתובות תמיד על הכרטיס.',
      'אין שעון — חשבו רגע לפני שעונים.'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];

      var halves = makeHalves(spec.switches, ctx.shuffle);
      var nums = [];
      var texts = []; // the exercise shown instead of the number (levels 21+), or null
      for (var i = 0; i < TRIALS; i++) {
        var choices = NUMBERS.filter(function (n) { return n !== nums[i - 1]; });
        nums.push(ctx.pick(choices));
        texts.push(spec.expr && Math.random() < spec.expr ? exprFor(nums[i], spec, ctx.randInt) : null);
      }

      var trial = 0;
      var score = 0;
      var switchTotal = 0, switchRight = 0;
      var accepting = false;

      function half(name) {
        var q = QUESTIONS[name];
        var slot = el('div', { class: 'bsh-slot' });
        var box = el('div', { class: 'bsh-half bsh-' + name }, [
          el('p', { class: 'bsh-label' }, [el('b', null, q.label), ' ' + q.text]),
          slot
        ]);
        return { box: box, slot: slot };
      }

      var top = half('top');
      var bottom = half('bottom');
      var card = el('div', { class: 'bsh-card bsh-c' + spec.color, role: 'group', 'aria-label': 'כרטיס' }, [top.box, bottom.box]);
      var yesBtn = el('button', { class: 'g-choice', type: 'button', disabled: true, onclick: function () { answer(true, yesBtn); } }, 'כן');
      var noBtn = el('button', { class: 'g-choice', type: 'button', disabled: true, onclick: function () { answer(false, noBtn); } }, 'לא');
      var answers = el('div', { class: 'g-choices bsh-answers' }, [yesBtn, noBtn]);
      root.appendChild(card);
      root.appendChild(answers);

      function showTrial() {
        if (trial >= TRIALS) {
          var note = 'ענו נכון על ' + score + ' מתוך ' + TRIALS + ' כרטיסים';
          if (switchTotal > 0) note += ' · במעבר בין השאלות: ' + switchRight + ' מתוך ' + switchTotal;
          ctx.finish({ correct: score, total: TRIALS, note: note });
          return;
        }
        ctx.setProgress(trial + 1, TRIALS);
        var h = halves[trial];
        top.slot.innerHTML = '';
        bottom.slot.innerHTML = '';
        top.box.classList.toggle('bsh-active', h === 'top');
        bottom.box.classList.toggle('bsh-active', h === 'bottom');
        (h === 'top' ? top : bottom).slot.appendChild(el('div', {
          class: 'bsh-num' + (texts[trial] ? ' bsh-expr' : ''), 'data-num': nums[trial], dir: 'ltr'
        }, texts[trial] || String(nums[trial])));
        ctx.setStatus(h === 'top' ? 'למעלה: זוגי?' : 'למטה: גדול מ-5?');
        [yesBtn, noBtn].forEach(function (b) { b.className = 'g-choice'; b.disabled = false; });
        accepting = true;
      }

      function answer(said, btn) {
        if (!accepting) return;
        accepting = false;
        yesBtn.disabled = true;
        noBtn.disabled = true;
        var h = halves[trial], num = nums[trial], text = texts[trial];
        var right = answerFor(h, num);
        var ok = said === right;
        var switched = trial > 0 && halves[trial - 1] !== h;
        if (switched) switchTotal++;
        if (ok) { score++; if (switched) switchRight++; }
        btn.classList.add(ok ? 'is-correct' : 'is-wrong');
        if (!ok) (right ? yesBtn : noBtn).classList.add('is-correct');
        var done;
        if (ok) {
          ctx.sound('good');
          ctx.setStatus('✓ ' + explain(h, num, text));
          done = ctx.wait(800);
        } else {
          ctx.setStatus((h === 'top' ? 'למעלה: ' : 'למטה: ') + explain(h, num, text));
          done = ctx.feedback(false, explain(h, num, text)).then(function () { return ctx.wait(500); });
        }
        done.then(function () {
          top.slot.innerHTML = '';
          bottom.slot.innerHTML = '';
          return ctx.wait(300);
        }).then(function () {
          trial++;
          showTrial();
        });
      }

      ctx.wait(300).then(showTrial);
    }
  });
})();
