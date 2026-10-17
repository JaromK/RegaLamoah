/*
 * השלם את הסדרה — find the missing number in a sequence.
 */
(function () {
  'use strict';

  var ROUNDS = 7;
  var TIMES = '×';

  /* Isolate a math snippet as LTR inside Hebrew text (LRI ... PDI). */
  function ltr(s) { return '⁦' + s + '⁩'; }

  var MAX_L = 20;

  /* Per level: pattern pool, difficulty of the numbers (d, the old 1–10 scale),
     sequence length n, and how often the gap is in the middle instead of the end. */
  var LEVELS = {
    1:  { pool: ['add'], d: 1, n: 5, mid: 0 },
    2:  { pool: ['add', 'sub'], d: 2, n: 5, mid: 0 },
    3:  { pool: ['add', 'sub'], d: 3, n: 5, mid: 0 },
    4:  { pool: ['add', 'sub'], d: 4, n: 6, mid: 0 },
    5:  { pool: ['add', 'sub', 'mul'], d: 4, n: 6, mid: 0 },
    6:  { pool: ['add', 'sub', 'mul', 'alt'], d: 5, n: 6, mid: 0 },
    7:  { pool: ['add', 'mul', 'alt', 'incdiff'], d: 6, n: 6, mid: 0 },
    8:  { pool: ['sub', 'mul', 'alt', 'incdiff'], d: 6, n: 6, mid: 0.3 },
    9:  { pool: ['mul', 'alt', 'incdiff', 'squares'], d: 7, n: 6, mid: 0.3 },
    10: { pool: ['add', 'alt', 'incdiff', 'squares'], d: 8, n: 6, mid: 0.3 },
    11: { pool: ['add', 'alt', 'incdiff', 'squares', 'fib'], d: 8, n: 6, mid: 0.3 },
    12: { pool: ['sub', 'mul', 'alt', 'incdiff', 'squares', 'fib'], d: 8, n: 6, mid: 0.3 },
    13: { pool: ['sub', 'mul', 'alt', 'incdiff', 'squares', 'fib'], d: 9, n: 6, mid: 0.3 },
    14: { pool: ['mul', 'alt', 'incdiff', 'squares', 'fib'], d: 9, n: 6, mid: 0.3 },
    15: { pool: ['mul', 'alt', 'incdiff', 'squares', 'fib'], d: 10, n: 6, mid: 0.45 },
    16: { pool: ['inter', 'mul', 'incdiff', 'squares', 'fib'], d: 10, n: 6, mid: 0.45 },
    17: { pool: ['inter', 'altops', 'incdiff', 'squares', 'fib'], d: 10, n: 6, mid: 0.45 },
    18: { pool: ['primes', 'inter', 'altops', 'fib'], d: 10, n: 6, mid: 0.45 },
    19: { pool: ['inter', 'altops', 'dbl1', 'primes', 'squares'], d: 11, n: 6, mid: 0.5 },
    20: { pool: ['inter', 'altops', 'dbl1', 'primes', 'fib', 'squares'], d: 12, n: 6, mid: 0.5 }
  };

  var PRIMES = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];

  var HINTS = {
    inter: 'רמז: אולי יש כאן שתי סדרות שמשתלבות, בדקו כל מספר שני',
    primes: 'רמז: מספר ראשוני מתחלק רק ב־1 ובעצמו'
  };

  function build(type, L, n, R) {
    var seq = [], i, explain, step = 1;
    if (type === 'inter') {
      // two interleaved series (positions 0,2,4… and 1,3,5…)
      var a0 = R.randInt(1, 15), d1 = R.randInt(2, 6);
      var down = L >= 11 && R.randInt(0, 1);
      var d2 = R.randInt(2, 6);
      while (d2 === d1) d2 = R.randInt(2, 6);
      var b0 = down ? R.randInt(40, 70) : a0 + R.randInt(15, 30);
      for (i = 0; i < n; i++) {
        var k = Math.floor(i / 2);
        seq.push(i % 2 === 0 ? a0 + k * d1 : b0 + (down ? -1 : 1) * k * d2);
      }
      step = d1;
      explain = 'שתי סדרות לסירוגין: באחת מוסיפים ' + d1 + ', ובשנייה ' + (down ? 'מורידים ' : 'מוסיפים ') + d2;
    } else if (type === 'altops') {
      // ×f then +k, alternating
      var f = L >= 12 && R.randInt(0, 2) === 0 ? 3 : 2;
      var v0 = f === 3 ? R.randInt(1, 3) : R.randInt(1, 5);
      var kk = R.randInt(1, f === 3 ? 3 : 4);
      seq.push(v0);
      for (i = 1; i < n; i++) seq.push(i % 2 === 1 ? seq[i - 1] * f : seq[i - 1] + kk);
      step = kk;
      explain = 'לסירוגין: כופלים ב־' + f + ', ואז מוסיפים ' + kk;
    } else if (type === 'dbl1') {
      // each number = previous × 2 + 1
      var x0 = R.randInt(1, 6);
      seq.push(x0);
      for (i = 1; i < n; i++) seq.push(seq[i - 1] * 2 + 1);
      step = seq[n - 2];
      explain = 'כל מספר הוא המספר שלפניו כפול 2, ועוד 1';
    } else if (type === 'primes') {
      var p0 = R.randInt(0, Math.min(PRIMES.length - n, L >= 12 ? 12 : 6));
      seq = PRIMES.slice(p0, p0 + n);
      step = 2;
      explain = 'אלה מספרים ראשוניים, שמתחלקים רק ב־1 ובעצמם';
    } else if (type === 'add') {
      step = L <= 2 ? R.randInt(2, 5) : L <= 6 ? R.randInt(3, 9) : R.randInt(6, 15);
      var s0 = L <= 2 ? R.randInt(1, 10) : R.randInt(1, 40);
      for (i = 0; i < n; i++) seq.push(s0 + i * step);
      explain = 'כל פעם מוסיפים ' + step;
    } else if (type === 'sub') {
      step = L <= 3 ? R.randInt(2, 5) : R.randInt(3, 12);
      var top = step * n + R.randInt(1, 20);
      for (i = 0; i < n; i++) seq.push(top - i * step);
      explain = 'כל פעם מורידים ' + step;
    } else if (type === 'mul') {
      var f = L >= 9 && R.randInt(0, 1) ? 3 : 2;
      var m0 = f === 3 ? R.randInt(1, 3) : R.randInt(1, L >= 8 ? 6 : 4);
      for (i = 0; i < n; i++) seq.push(m0 * Math.pow(f, i));
      step = seq[n - 1] - seq[n - 2];
      explain = 'כל מספר גדול פי ' + f + ' מהמספר שלפניו';
    } else if (type === 'alt') {
      var a = L <= 6 ? R.randInt(1, 5) : R.randInt(2, 9);
      var b = L <= 6 ? R.randInt(1, 5) : R.randInt(2, 9);
      while (b === a) b = R.randInt(1, L <= 6 ? 5 : 9);
      var mixed = L >= 8 && R.randInt(0, 1);
      if (mixed && a <= b) { var t = a; a = b; b = t; }
      var v = R.randInt(1, 20) + (mixed ? 10 : 0);
      for (i = 0; i < n; i++) {
        seq.push(v);
        v += i % 2 === 0 ? a : (mixed ? -b : b);
      }
      step = a;
      explain = mixed
        ? 'לסירוגין: מוסיפים ' + a + ' ואז מורידים ' + b
        : 'מוסיפים לסירוגין ' + a + ' ואז ' + b;
    } else if (type === 'squares') {
      var k0 = R.randInt(1, L >= 9 ? 6 : 4);
      for (i = 0; i < n; i++) seq.push((k0 + i) * (k0 + i));
      step = 2 * (k0 + n - 1) - 1;
      explain = 'כל מספר כפול עצמו: ' + ltr(k0 + TIMES + k0 + ', ' + (k0 + 1) + TIMES + (k0 + 1) + ', ' + (k0 + 2) + TIMES + (k0 + 2) + '…');
    } else if (type === 'fib') {
      var x = R.randInt(1, L >= 9 ? 5 : 3), y = x + R.randInt(0, 3);
      seq.push(x, y);
      for (i = 2; i < n; i++) seq.push(seq[i - 1] + seq[i - 2]);
      step = seq[n - 2];
      explain = 'כל מספר הוא סכום שני המספרים שלפניו';
    } else { // incdiff
      var d0 = R.randInt(1, L >= 9 ? 4 : 3);
      var w = R.randInt(1, 12);
      for (i = 0; i < n; i++) { seq.push(w); w += d0 + i; }
      step = d0 + n - 2;
      explain = 'ההפרש גדל כל פעם ב־1: ' + ltr('+' + d0 + ', +' + (d0 + 1) + ', +' + (d0 + 2) + '…');
    }
    return { seq: seq, explain: explain, step: step };
  }

  function makeDistractors(ans, step, R) {
    var seen = {}; seen[ans] = true;
    var out = [];
    function take(v) { if (v > 0 && v === Math.round(v) && !seen[v] && out.length < 3) { seen[v] = true; out.push(v); } }
    var smart = R.shuffle([ans + step, ans - step, ans + 10, ans - 10].filter(function (v) { return v > 0; }));
    if (smart.length) take(smart[0]);
    R.shuffle([ans + 1, ans - 1, ans + 2, ans - 2, smart[1]]).forEach(function (v) { if (v !== undefined) take(v); });
    var g = 0;
    while (out.length < 3 && g++ < 50) take(ans + R.randInt(3, 9) * (R.randInt(0, 1) ? 1 : -1));
    g = 0;
    while (out.length < 3 && g++ < 50) take(ans + R.randInt(3, 20));
    return out;
  }

  function makeQuestion(level, R, prevType) {
    var lv = Math.max(1, Math.min(MAX_L, level | 0)) || 1;
    var cfg = LEVELS[lv] || LEVELS[1];
    var pool = cfg.pool;
    var type = R.pick(pool);
    var tries = 0;
    while (pool.length > 1 && type === prevType && tries++ < 10) type = R.pick(pool);
    var n = cfg.n;
    var b = build(type, cfg.d, n, R);
    var missing = n - 1;
    if (R.randInt(1, 100) <= cfg.mid * 100) missing = R.randInt(2, n - 2);
    var ans = b.seq[missing];
    return {
      type: type,
      seq: b.seq,
      missing: missing,
      answer: ans,
      explain: b.explain,
      hint: HINTS[type] || null,
      choices: R.shuffle([ans].concat(makeDistractors(ans, b.step, R)))
    };
  }

  BrainGames.register({
    id: 'number-series',
    name: 'השלם את הסדרה',
    skill: 'logic',
    tagline: 'גלו את החוקיות ומצאו את המספר החסר',
    benefit: 'חשיבה לוגית וזיהוי דפוסים',
    instructions: [
      'הסתכלו על שורת המספרים, משמאל לימין.',
      'חפשו את החוקיות: מה משתנה ממספר למספר?',
      'בחרו את המספר שמתאים במקום סימן השאלה.',
      'אחרי כל תשובה יופיע הסבר קצר. לחצו "לשאלה הבאה" כשתהיו מוכנים.'
    ],
    css: [
      '.ns-row{display:flex;flex-wrap:wrap;justify-content:center;gap:.5rem;width:100%;direction:ltr}',
      '.ns-box{min-width:3.6rem;height:3.6rem;padding:0 .5rem;display:grid;place-items:center;border-radius:var(--radius-sm);',
      'border:2px solid var(--line);background:var(--surface-2);color:var(--ink);font-family:var(--font-display);font-weight:900;',
      'font-size:1.7rem;font-variant-numeric:tabular-nums;line-height:1}',
      '.ns-missing{border:3px dashed var(--accent);background:var(--accent-soft);color:var(--accent)}',
      '.ns-missing.ns-solved{border-style:solid;border-color:var(--good);background:var(--good-soft);color:var(--good)}',
      '.ns-choices{grid-template-columns:repeat(2,minmax(0,1fr));max-width:26rem}',
      '.ns-choices .g-choice{font-size:1.7rem;font-variant-numeric:tabular-nums}',
      '.ns-explain{font-size:1.2rem;font-weight:700;text-align:center;background:var(--sun-soft);color:var(--ink);',
      'padding:.8rem 1.1rem;border-radius:var(--radius);max-width:100%;text-wrap:balance}',
      '.ns-after{display:flex;flex-direction:column;align-items:center;gap:.75rem;width:100%}',
      '.ns-after:empty{display:none}'
    ].join(''),
    generate: makeQuestion,
    start: function (root, ctx) {
      var round = 0;
      var correct = 0;
      var prevType = null;

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: correct, total: ROUNDS, note: 'השלמתם נכון ' + correct + ' סדרות מתוך ' + ROUNDS + '.' });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var q = makeQuestion(ctx.level, ctx, prevType);
        ctx.setStatus(q.hint || 'איזה מספר חסר בסדרה?');
        prevType = q.type;

        root.innerHTML = '';
        var missingBox = null;
        var row = ctx.el('div', { class: 'ns-row', dir: 'ltr' }, q.seq.map(function (v, i) {
          if (i === q.missing) {
            missingBox = ctx.el('span', { class: 'ns-box ns-missing', 'aria-label': 'מספר חסר' }, '?');
            return missingBox;
          }
          return ctx.el('span', { class: 'ns-box' }, String(v));
        }));
        root.appendChild(row);

        var buttons = [];
        var answered = false;
        var grid = ctx.el('div', { class: 'g-choices ns-choices' });
        q.choices.forEach(function (val) {
          var b = ctx.el('button', {
            class: 'g-choice', type: 'button', dir: 'ltr',
            onclick: function () { choose(val, b); }
          }, String(val));
          buttons.push({ val: val, btn: b });
          grid.appendChild(b);
        });
        root.appendChild(grid);

        var after = ctx.el('div', { class: 'ns-after', 'aria-live': 'polite' });
        root.appendChild(after);

        function choose(val, btn) {
          if (answered) return;
          answered = true;
          buttons.forEach(function (o) {
            o.btn.disabled = true;
            if (o.val === q.answer) o.btn.classList.add('is-correct');
          });
          missingBox.textContent = String(q.answer);
          missingBox.classList.add('ns-solved');
          missingBox.removeAttribute('aria-label');
          var ok = val === q.answer;
          if (ok) correct++;
          else btn.classList.add('is-wrong');

          after.appendChild(ctx.el('p', { class: 'ns-explain' },
            (ok ? '' : 'התשובה הנכונה: ' + q.answer + '. ') + q.explain + '.'));
          var nextBtn = ctx.el('button', {
            class: 'btn btn-primary btn-lg', type: 'button',
            onclick: function () { nextBtn.disabled = true; nextRound(); }
          }, round >= ROUNDS ? 'לסיכום' : 'לשאלה הבאה');
          after.appendChild(nextBtn);
          ctx.feedback(ok, ok ? 'נכון! ' + q.explain : 'התשובה הנכונה: ' + q.answer);
          ctx.wait(50).then(function () { try { nextBtn.focus({ preventScroll: true }); } catch (e) { /* ignore */ } });
        }
      }

      nextRound();
    }
  });
})();
