/*
 * חשבון בראש — mental arithmetic with four answer choices.
 */
(function () {
  'use strict';

  var ROUNDS = 8;
  var PLUS = '+';
  var MINUS = '−';
  var TIMES = '×';
  var DIV = '÷';

  function swapDigits(n) {
    var s = String(n);
    if (s.length < 2) return null;
    var a = s.charAt(s.length - 2), b = s.charAt(s.length - 1);
    if (a === b) return null;
    var t = s.slice(0, s.length - 2) + b + a;
    if (t.charAt(0) === '0') return null;
    return parseInt(t, 10);
  }

  /* Pick 3 plausible, unique, positive wrong answers. */
  function makeDistractors(ans, extras, R) {
    var seen = {};
    seen[ans] = true;
    function ok(v) { return typeof v === 'number' && isFinite(v) && v === Math.round(v) && v > 0 && !seen[v]; }
    var out = [];
    function take(v) { if (ok(v) && out.length < 3) { seen[v] = true; out.push(v); } }

    // up to one "smart" mistake (wrong order of operations, neighbouring table fact, digit swap)
    var smart = R.shuffle((extras || []).concat([swapDigits(ans)]).filter(ok));
    if (smart.length) take(smart[0]);
    if (smart.length > 1 && R.randInt(0, 1)) take(smart[1]);

    var near = R.shuffle([ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10]);
    near.forEach(take);
    var guard = 0;
    while (out.length < 3 && guard++ < 50) take(ans + R.randInt(3, 9) * (R.randInt(0, 1) ? 1 : -1));
    guard = 0;
    while (out.length < 3 && guard++ < 50) take(ans + R.randInt(3, 20));
    return out;
  }

  function simple(a, sym, b) {
    var ans = sym === PLUS ? a + b : sym === MINUS ? a - b : sym === TIMES ? a * b : a / b;
    var extras = [];
    if (sym === TIMES) extras.push(a * (b + 1), a * (b - 1), (a + 1) * b);
    if (sym === MINUS && b < 10 && a > 10) extras.push(a - b + 10, a - b - 10);
    return { text: a + ' ' + sym + ' ' + b, answer: ans, extras: extras, twoStep: false };
  }

  function addSub(R, aMin, aMax, bMin, bMax, allowSub) {
    var a = R.randInt(aMin, aMax), b = R.randInt(bMin, bMax);
    if (allowSub && R.randInt(0, 1)) {
      if (a <= b) { var t = a; a = b; b = t; }
      if (a === b) a += R.randInt(1, 5);
      return simple(a, MINUS, b);
    }
    return simple(a, PLUS, b);
  }

  function times(R, max) {
    var a = R.randInt(2, max), b = R.randInt(2, max);
    if (max > 6 && a < 6 && b < 6) a = R.randInt(6, max);
    return R.randInt(0, 1) ? simple(a, TIMES, b) : simple(b, TIMES, a);
  }

  function twoStep(R, level) {
    var kinds = level >= 10 ? ['a+bc', 'a-bc', 'ab+c', 'ab-c', 'paren', 'ab+cd'] : ['a+bc', 'a-bc', 'ab+c', 'ab-c'];
    var k = R.pick(kinds);
    var a, b, c, d, ans, wrong, text;
    var max = level >= 10 ? 9 : 7;
    if (k === 'a+bc') {
      a = R.randInt(2, 20); b = R.randInt(2, max); c = R.randInt(2, max);
      text = a + ' ' + PLUS + ' ' + b + ' ' + TIMES + ' ' + c; ans = a + b * c; wrong = (a + b) * c;
    } else if (k === 'a-bc') {
      b = R.randInt(2, max); c = R.randInt(2, max); a = b * c + R.randInt(2, 25);
      text = a + ' ' + MINUS + ' ' + b + ' ' + TIMES + ' ' + c; ans = a - b * c; wrong = (a - b) * c;
    } else if (k === 'ab+c') {
      a = R.randInt(2, max); b = R.randInt(2, max); c = R.randInt(2, 20);
      // put the addend first sometimes: c + a × b is covered by a+bc
      text = a + ' ' + TIMES + ' ' + b + ' ' + PLUS + ' ' + c; ans = a * b + c; wrong = a * (b + c);
    } else if (k === 'ab-c') {
      a = R.randInt(2, max); b = R.randInt(3, max); c = R.randInt(1, Math.min(20, a * b - 1));
      text = a + ' ' + TIMES + ' ' + b + ' ' + MINUS + ' ' + c; ans = a * b - c; wrong = a * (b - c);
    } else if (k === 'paren') {
      a = R.randInt(2, 12); b = R.randInt(2, 9); c = R.randInt(2, 6);
      text = '(' + a + ' ' + PLUS + ' ' + b + ') ' + TIMES + ' ' + c; ans = (a + b) * c; wrong = a + b * c;
    } else {
      a = R.randInt(2, 6); b = R.randInt(2, 9); c = R.randInt(2, 6); d = R.randInt(2, 9);
      text = a + ' ' + TIMES + ' ' + b + ' ' + PLUS + ' ' + c + ' ' + TIMES + ' ' + d; ans = a * b + c * d; wrong = (a * b + c) * d;
    }
    return { text: text, answer: ans, extras: [wrong], twoStep: true };
  }

  var MAX_L = 20;

  /* two-digit + one-digit without carrying, or minus without borrowing */
  function noCarrySmall(R, allowSub) {
    var t = R.randInt(1, 8) * 10;
    if (!allowSub || R.randInt(0, 1)) { var u = R.randInt(1, 7); return simple(t + u, PLUS, R.randInt(1, 9 - u)); }
    var u2 = R.randInt(3, 9);
    return simple(t + u2, MINUS, R.randInt(1, u2 - 1));
  }

  /* two-digit + one-digit WITH carrying, or minus WITH borrowing */
  function carrySmall(R) {
    if (R.randInt(0, 1)) {
      var u = R.randInt(2, 9), a = R.randInt(1, 8) * 10 + u;
      return simple(a, PLUS, R.randInt(Math.max(2, 10 - u + 1), 9));
    }
    var u2 = R.randInt(0, 7), a2 = R.randInt(2, 9) * 10 + u2;
    return simple(a2, MINUS, R.randInt(u2 + 1, 9));
  }

  /* two-digit ± two-digit without carrying / borrowing */
  function noCarryBig(R) {
    var t1 = R.randInt(1, 7), t2 = R.randInt(1, 8 - t1), u1 = R.randInt(0, 8), u2 = R.randInt(1, 9 - u1);
    if (R.randInt(0, 2)) return simple(t1 * 10 + u1, PLUS, t2 * 10 + u2);
    var ta = R.randInt(3, 9), tb = R.randInt(1, ta - 1), ua = R.randInt(2, 9), ub = R.randInt(0, ua - 1);
    return simple(ta * 10 + ua, MINUS, tb * 10 + ub);
  }

  /* two-digit + two-digit WITH carrying */
  function carryBig(R) {
    var u1 = R.randInt(2, 9), u2 = R.randInt(Math.max(1, 10 - u1), 9);
    var t1 = R.randInt(1, 5), t2 = R.randInt(1, 8 - t1);
    return simple(t1 * 10 + u1, PLUS, t2 * 10 + u2);
  }

  function easyTables(R) {
    var a = R.pick([2, 5, 10]), b = R.randInt(2, 10);
    return R.randInt(0, 1) ? simple(a, TIMES, b) : simple(b, TIMES, a);
  }

  function division(R, max) {
    var p = R.randInt(3, max), q = R.randInt(3, max);
    var e = simple(p * q, DIV, p);
    e.extras = [q + 1, q - 1, p];
    return e;
  }

  /* doubling / halving a large number */
  function doubleHalf(R, big) {
    var e;
    if (R.randInt(0, 1)) {
      var n = big ? R.randInt(126, 1250) : R.randInt(26, 480);
      e = simple(n, TIMES, 2);
      e.extras = [n * 2 + 10, n * 2 - 10, n * 2 + 100];
    } else {
      var m = (big ? R.randInt(126, 999) : R.randInt(26, 480)) * 2;
      e = simple(m, DIV, 2);
      e.extras = [m / 2 + 10, m / 2 - 10, m / 2 + 5, m / 2 - 5];
    }
    e.hint = 'רמז: × 2 זה כפול, ÷ 2 זה חצי';
    return e;
  }

  var PCT_HINTS = {
    10: 'רמז: 10% זה עשירית, כלומר מחלקים ב־10',
    20: 'רמז: 20% זה פעמיים 10%',
    25: 'רמז: 25% זה רבע, כלומר חצי של החצי',
    50: 'רמז: 50% זה חצי',
    75: 'רמז: 75% זה שלושה רבעים'
  };

  /* percentage of a round number; result is always whole */
  function percent(R, pcts) {
    var p = R.pick(pcts), n;
    if (p === 10) n = R.randInt(2, 90) * 10;
    else if (p === 20) n = R.randInt(2, 45) * 10;
    else if (p === 50) n = R.randInt(10, 200) * 2;
    else n = R.randInt(2, p === 75 ? 20 : 30) * 20; // 25% / 75%
    var ans = n * p / 100;
    var extras = [10, 20, 25, 50, 75].filter(function (o) { return o !== p; })
      .map(function (o) { return n * o / 100; });
    extras.push(n - ans);
    return { text: p + '% ' + TIMES + ' ' + n, answer: ans, extras: extras, twoStep: false, hint: PCT_HINTS[p] };
  }

  /* three operations, mind the order */
  function threeStep(R) {
    var k = R.pick(['a+bc-d', 'ab-c+d', 'ab-cd', 'paren-d', 'ab+c/d']);
    var a, b, c, d, ans, wrong, text, hint = 'זכרו: קודם כפל וחילוק, ואחר כך חיבור וחיסור משמאל לימין';
    if (k === 'a+bc-d') {
      a = R.randInt(2, 30); b = R.randInt(2, 9); c = R.randInt(2, 9); d = R.randInt(1, Math.min(30, a + b * c - 1));
      text = a + ' ' + PLUS + ' ' + b + ' ' + TIMES + ' ' + c + ' ' + MINUS + ' ' + d;
      ans = a + b * c - d; wrong = (a + b) * c - d;
    } else if (k === 'ab-c+d') {
      a = R.randInt(3, 9); b = R.randInt(3, 9); c = R.randInt(1, Math.min(25, a * b - 1)); d = R.randInt(2, 25);
      text = a + ' ' + TIMES + ' ' + b + ' ' + MINUS + ' ' + c + ' ' + PLUS + ' ' + d;
      ans = a * b - c + d; wrong = a * b - (c + d);
    } else if (k === 'ab-cd') {
      a = R.randInt(4, 9); b = R.randInt(4, 9); c = R.randInt(2, 6); d = R.randInt(2, 6);
      if (c * d >= a * b) { c = 2; d = 2; }
      text = a + ' ' + TIMES + ' ' + b + ' ' + MINUS + ' ' + c + ' ' + TIMES + ' ' + d;
      ans = a * b - c * d; wrong = (a * b - c) * d;
    } else if (k === 'paren-d') {
      a = R.randInt(2, 12); b = R.randInt(2, 9); c = R.randInt(2, 6); d = R.randInt(1, Math.min(30, (a + b) * c - 1));
      text = '(' + a + ' ' + PLUS + ' ' + b + ') ' + TIMES + ' ' + c + ' ' + MINUS + ' ' + d;
      ans = (a + b) * c - d; wrong = a + b * c - d;
      hint = 'זכרו: קודם מה שבסוגריים, אחר כך כפל, ובסוף חיסור';
    } else {
      a = R.randInt(2, 9); b = R.randInt(2, 9); d = R.randInt(2, 6); c = d * R.randInt(2, 9);
      text = a + ' ' + TIMES + ' ' + b + ' ' + PLUS + ' ' + c + ' ' + DIV + ' ' + d;
      ans = a * b + c / d; wrong = (a * b + c) / d;
    }
    return { text: text, answer: ans, extras: [wrong], twoStep: true, hint: hint };
  }

  function makeExercise(level, R) {
    var L = Math.max(1, Math.min(MAX_L, level | 0));
    var r;
    switch (L) {
      case 1: // sums and differences up to 10
        if (R.randInt(0, 1)) { var a = R.randInt(1, 8); return simple(a, PLUS, R.randInt(1, 10 - a)); }
        var x = R.randInt(3, 9); return simple(x, MINUS, R.randInt(1, x - 1));
      case 2: return addSub(R, 2, 9, 2, 9, true);              // single digits
      case 3: return noCarrySmall(R, false);                    // 43 + 5
      case 4: return noCarrySmall(R, true);                     // 43 + 5, 47 − 3
      case 5: return carrySmall(R);                             // 47 + 6, 42 − 7
      case 6: return R.randInt(0, 2) ? noCarryBig(R) : carrySmall(R); // 32 + 45
      case 7: return R.randInt(0, 2) ? carryBig(R) : noCarryBig(R);   // 38 + 27
      case 8: return R.randInt(0, 1) ? easyTables(R) : carryBig(R);   // tables of 2, 5, 10
      case 9: return R.randInt(0, 1) ? times(R, 5) : addSub(R, 11, 69, 11, 29, false);
      case 10: return R.randInt(0, 2) ? addSub(R, 21, 89, 11, 49, true) : times(R, 9);
      case 11: return R.randInt(0, 1) ? times(R, 12) : addSub(R, 25, 99, 12, 69, true);
      case 12:
        r = R.randInt(0, 2);
        return r === 0 ? times(R, 12) : r === 1 ? division(R, 9) : addSub(R, 25, 99, 12, 69, true);
      case 13:
        r = R.randInt(0, 3);
        return r === 0 ? times(R, 12) : r === 1 ? division(R, 12) : addSub(R, 35, 99, 15, 89, true);
      case 14: return R.randInt(0, 3) === 0 ? times(R, 12) : twoStep(R, 9);
      case 15: return twoStep(R, 10);
      case 16: return R.randInt(0, 4) < 3 ? doubleHalf(R, false) : twoStep(R, 10);
      case 17: return R.randInt(0, 2) ? percent(R, [10, 50]) : doubleHalf(R, false);
      case 18: return R.randInt(0, 3) ? percent(R, [10, 20, 25, 50]) : doubleHalf(R, true);
      case 19: return R.randInt(0, 3) ? threeStep(R) : percent(R, [10, 20, 25, 50]);
      default:
        r = R.randInt(0, 9);
        return r < 5 ? threeStep(R) : r < 8 ? percent(R, [10, 20, 25, 50, 75]) : doubleHalf(R, true);
    }
  }

  function makeQuestion(level, R) {
    var ex = makeExercise(level, R);
    var wrong = makeDistractors(ex.answer, ex.extras, R);
    return {
      text: ex.text,
      answer: ex.answer,
      twoStep: ex.twoStep,
      hint: ex.hint || null,
      choices: R.shuffle([ex.answer].concat(wrong))
    };
  }

  BrainGames.register({
    id: 'mental-math',
    name: 'חשבון בראש',
    skill: 'logic',
    tagline: 'פתרו תרגילי חשבון קצרים בלי דף ועט',
    benefit: 'זיכרון עבודה, חישוב מהיר וגמישות מספרית',
    instructions: [
      'הסתכלו על התרגיל שבמרכז המסך.',
      'פתרו אותו בראש, בלי למהר.',
      'לחצו על התשובה הנכונה מבין ארבע האפשרויות.'
    ],
    css: [
      '.mm-expr{display:inline-block;direction:ltr;unicode-bidi:isolate;white-space:nowrap;font-size:min(4rem,12vw)}',
      '.mm-expr.mm-m{font-size:min(3.4rem,9vw)}',
      '.mm-expr.mm-l{font-size:min(3rem,7.5vw)}',
      '.mm-expr.mm-xl{font-size:min(2.6rem,6.2vw)}',
      '.mm-q{color:var(--accent)}',
      '.mm-q.mm-done{color:var(--good)}',
      '.mm-choices{grid-template-columns:repeat(2,minmax(0,1fr));max-width:26rem}',
      '.mm-choices .g-choice{font-size:1.7rem;font-variant-numeric:tabular-nums;direction:ltr}'
    ].join('\n'),
    generate: makeQuestion,
    start: function (root, ctx) {
      var round = 0;
      var correct = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: correct, total: ROUNDS, note: 'פתרתם נכון ' + correct + ' תרגילים מתוך ' + ROUNDS + '.' });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var q = makeQuestion(ctx.level, ctx);
        ctx.setStatus(q.hint || (q.twoStep ? 'זכרו: קודם כפל, ואחר כך חיבור וחיסור' : 'כמה זה?'));

        root.innerHTML = '';
        var len = (q.text + ' = ?').length;
        var qMark = ctx.el('span', { class: 'mm-q' }, '?');
        var expr = ctx.el('span', { class: 'mm-expr' + (len > 18 ? ' mm-xl' : len > 13 ? ' mm-l' : len > 8 ? ' mm-m' : ''), dir: 'ltr' },
          [q.text + ' = ', qMark]);
        root.appendChild(ctx.el('div', { class: 'g-big', 'aria-live': 'polite' }, expr));

        var buttons = [];
        var answered = false;
        var grid = ctx.el('div', { class: 'g-choices mm-choices' });
        q.choices.forEach(function (val) {
          var b = ctx.el('button', {
            class: 'g-choice', type: 'button', dir: 'ltr',
            onclick: function () { choose(val, b); }
          }, String(val));
          buttons.push({ val: val, btn: b });
          grid.appendChild(b);
        });
        root.appendChild(grid);

        function choose(val, btn) {
          if (answered) return;
          answered = true;
          buttons.forEach(function (o) {
            o.btn.disabled = true;
            if (o.val === q.answer) o.btn.classList.add('is-correct');
          });
          qMark.textContent = String(q.answer);
          qMark.classList.add('mm-done');
          var ok = val === q.answer;
          if (ok) correct++;
          else btn.classList.add('is-wrong');
          ctx.feedback(ok, ok ? null : 'התשובה הנכונה: ' + q.answer)
            .then(function () { return ctx.wait(ok ? 400 : 1200); })
            .then(nextRound);
        }
      }

      nextRound();
    }
  });
})();
