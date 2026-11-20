/* שברים — fractions: read a fraction from a picture, add and subtract, compare, multiply, divide and take a
   fraction of a number. A "how to solve" button shows a worked example of the same question, and every wrong
   answer shows the full solution step by step (logic, arithmetic). Untimed. */
(function () {
  'use strict';

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a || 1; }
  function F(n, d) { var g = gcd(n, d); if (d < 0) { n = -n; d = -d; } return { n: n / g, d: d / g }; }
  function raw(n, d) { return { n: n, d: d, raw: true }; } // a fraction shown as is (not reduced)
  function add(a, b) { return F(a.n * b.d + b.n * a.d, a.d * b.d); }
  function sub(a, b) { return F(a.n * b.d - b.n * a.d, a.d * b.d); }
  function mul(a, b) { return F(a.n * b.n, a.d * b.d); }
  function div(a, b) { return F(a.n * b.d, a.d * b.n); }
  function eq(a, b) { return a.n * b.d === b.n * a.d; }
  function lcm(a, b) { return a / gcd(a, b) * b; }
  function key(f) { var r = F(f.n, f.d); return r.n + '/' + r.d; }

  /* Level 1–50 → the kinds of questions and the largest denominator. */
  function spec(level) {
    var L = level;
    if (L <= 4) return { kinds: ['read'], maxD: 4 + L };
    if (L <= 8) return { kinds: ['same'], maxD: 4 + L, sub: L >= 7 };
    if (L <= 12) return { kinds: ['simplify', 'compare'], maxD: 6 + (L - 8) };
    if (L <= 18) return { kinds: ['easy'], maxD: 8 + (L - 12), sub: L >= 15 };      // 1/2 + 1/4: one denominator divides the other
    if (L <= 25) return { kinds: ['any', 'easy'], maxD: 6 + (L - 18), sub: L >= 21 }; // 1/4 + 2/3
    if (L <= 30) return { kinds: ['mul', 'of'], maxD: 6 + (L - 25) };
    if (L <= 35) return { kinds: ['div', 'mul'], maxD: 6 + (L - 30) };
    if (L <= 42) return { kinds: ['mixed', 'any', 'of'], maxD: 6 + Math.floor((L - 35) / 2), sub: true };
    return { kinds: ['any', 'mul', 'div', 'mixed', 'of', 'compare'], maxD: 8 + Math.floor((L - 42) / 2), sub: true };
  }

  function properFrac(rnd, maxD, minD) {
    var d = rnd.randInt(minD || 2, maxD);
    return { n: rnd.randInt(1, d - 1), d: d };
  }

  /* A question: { kind, text, parts (what is shown), answer, options, steps (worked solution) }.
     steps: list of { t: Hebrew text, m: math tokens } where a math token is a fraction {n,d}, a number or a sign. */
  function makeQuestion(sp, rnd) {
    var kind = rnd.pick(sp.kinds), a, b, ans, steps, op, parts, m;
    if (kind === 'read') {
      a = properFrac(rnd, sp.maxD, 3);
      return finish({ kind: kind, text: 'איזה חלק מהמלבן צבוע?', bar: a, parts: [], answer: raw(a.n, a.d),
        // typical slips: counting the white parts, colored out of white, one part too many
        traps: [raw(a.d - a.n, a.d), raw(a.n, a.d - a.n), raw(a.n, a.d + 1), raw(a.n + 1, a.d), raw(Math.max(1, a.n - 1), a.d)],
        steps: [{ t: 'המלבן מחולק ל-' + a.d + ' חלקים שווים. זה המכנה (המספר למטה).' },
          { t: a.n + ' חלקים צבועים. זה המונה (המספר למעלה).', m: [raw(a.n, a.d)] }] }, rnd, true);
    }
    if (kind === 'same') {
      var d = rnd.randInt(3, sp.maxD);
      op = sp.sub && rnd.randInt(0, 1) ? '−' : '+';
      var n1 = rnd.randInt(1, d - 1), n2 = rnd.randInt(1, d - 1);
      if (op === '+' && n1 + n2 > d) n2 = Math.max(1, d - n1);
      if (op === '−' && n2 >= n1) { var t = n1; n1 = Math.max(n2, 2); n2 = Math.min(t, n1 - 1); if (n2 < 1) n2 = 1; }
      a = raw(n1, d); b = raw(n2, d);
      var rn = op === '+' ? n1 + n2 : n1 - n2;
      ans = F(rn, d);
      steps = [{ t: 'למספרים יש אותו מכנה (' + d + '), אז הוא נשאר. ' + (op === '+' ? 'מחברים' : 'מחסרים') + ' רק את המונים:', m: [n1 + ' ' + op + ' ' + n2 + ' = ' + rn] },
        { t: 'התוצאה:', m: [raw(rn, d)].concat(gcd(rn, d) > 1 ? ['=', ans] : []) }];
      if (gcd(rn, d) > 1) steps.push({ t: 'מצמצמים: מחלקים את המונה ואת המכנה ב-' + gcd(rn, d) + '.' });
      return finish({ kind: kind, parts: [a, op, b], answer: ans, steps: steps, bars: d <= 12 }, rnd);
    }
    if (kind === 'simplify') {
      var base = properFrac(rnd, Math.max(3, Math.floor(sp.maxD / 2)));
      base = F(base.n, base.d);
      var k = rnd.randInt(2, 4);
      a = raw(base.n * k, base.d * k);
      return finish({ kind: kind, text: 'צמצמו את השבר עד הסוף', parts: [a, '='], answer: base,
        steps: [{ t: 'מחפשים מספר שמחלק גם את ' + a.n + ' וגם את ' + a.d + ': ' + k + '.' },
          { t: 'מחלקים את שניהם ב-' + k + ':', m: [a.n + ' ÷ ' + k + ' = ' + base.n, ',', a.d + ' ÷ ' + k + ' = ' + base.d] },
          { t: 'התוצאה:', m: [a, '=', base] }] }, rnd);
    }
    if (kind === 'compare') {
      a = properFrac(rnd, sp.maxD); a = F(a.n, a.d);
      do { b = properFrac(rnd, sp.maxD); b = F(b.n, b.d); } while (eq(a, b));
      var L2 = lcm(a.d, b.d);
      var big = a.n * b.d > b.n * a.d ? a : b;
      return {
        kind: kind, text: 'איזה שבר גדול יותר?', parts: [], answer: big, options: [a, b],
        steps: [{ t: 'מביאים למכנה משותף ' + L2 + ':', m: [a, '=', raw(a.n * L2 / a.d, L2), ',', b, '=', raw(b.n * L2 / b.d, L2)] },
          { t: 'עכשיו משווים רק את המונים: ' + (a.n * L2 / a.d) + ' ו-' + (b.n * L2 / b.d) + '. הגדול:', m: [big] }]
      };
    }
    if (kind === 'easy' || kind === 'any' || kind === 'mixed') {
      op = sp.sub && rnd.randInt(0, 1) ? '−' : '+';
      for (var guard = 0; guard < 50; guard++) {
        a = properFrac(rnd, sp.maxD); b = properFrac(rnd, sp.maxD);
        a = F(a.n, a.d); b = F(b.n, b.d);
        if (a.d === b.d) continue;
        if (kind === 'easy' && a.d % b.d && b.d % a.d) continue;
        if (op === '−' && a.n * b.d <= b.n * a.d) { var tt = a; a = b; b = tt; }
        if (op === '−' && eq(a, b)) continue;
        break;
      }
      var wa = 0, wb = 0;
      if (kind === 'mixed') { wa = rnd.randInt(1, 3); wb = rnd.randInt(1, 2); if (op === '−' && wb >= wa) wa = wb + 1; }
      var A = F(a.n + wa * a.d, a.d), B = F(b.n + wb * b.d, b.d);
      ans = op === '+' ? add(A, B) : sub(A, B);
      var cd = lcm(A.d, B.d);
      steps = [];
      if (kind === 'mixed') steps.push({ t: 'הופכים מספר מעורב לשבר: שלם × מכנה + מונה.', m: [mixedTok(wa, a), '=', raw(A.n, A.d), ',', mixedTok(wb, b), '=', raw(B.n, B.d)] });
      steps.push({ t: 'מכנה משותף: המספר הקטן ביותר שמתחלק גם ב-' + A.d + ' וגם ב-' + B.d + ' הוא ' + cd + '.' });
      steps.push({ t: 'מרחיבים כל שבר כדי שהמכנה יהיה ' + cd + ':', m: [raw(A.n, A.d), '=', raw(A.n * cd / A.d, cd), ',', raw(B.n, B.d), '=', raw(B.n * cd / B.d, cd)] });
      var rr = op === '+' ? A.n * cd / A.d + B.n * cd / B.d : A.n * cd / A.d - B.n * cd / B.d;
      steps.push({ t: (op === '+' ? 'מחברים' : 'מחסרים') + ' את המונים:', m: [raw(A.n * cd / A.d, cd), op, raw(B.n * cd / B.d, cd), '=', raw(rr, cd)].concat(gcd(rr, cd) > 1 ? ['=', ans] : []) });
      return finish({ kind: kind, parts: kind === 'mixed' ? [mixedTok(wa, a), op, mixedTok(wb, b)] : [a, op, b], answer: ans, steps: steps, wrongSum: kind !== 'mixed' ? F(a.n + b.n, a.d + b.d) : null }, rnd);
    }
    if (kind === 'mul' || kind === 'div') {
      a = properFrac(rnd, sp.maxD); b = properFrac(rnd, sp.maxD);
      a = F(a.n, a.d); b = F(b.n, b.d);
      if (kind === 'mul') {
        ans = mul(a, b);
        steps = [{ t: 'בכפל: מונה כפול מונה, ומכנה כפול מכנה.', m: [a, '×', b, '=', raw(a.n * b.n, a.d * b.d)].concat(gcd(a.n * b.n, a.d * b.d) > 1 ? ['=', ans] : []) }];
        if (gcd(a.n * b.n, a.d * b.d) > 1) steps.push({ t: 'ומצמצמים עד הסוף.' });
        return finish({ kind: kind, parts: [a, '×', b], answer: ans, steps: steps }, rnd);
      }
      ans = div(a, b);
      var inv = raw(b.d, b.n);
      steps = [{ t: 'בחילוק: הופכים את השבר השני (מונה ומכנה מתחלפים) וכופלים.', m: [a, '÷', b, '=', a, '×', inv] },
        { t: 'כופלים מונה במונה ומכנה במכנה:', m: [raw(a.n * b.d, a.d * b.n)].concat(gcd(a.n * b.d, a.d * b.n) > 1 || a.n * b.d > a.d * b.n ? ['=', ans] : []) }];
      return finish({ kind: kind, parts: [a, '÷', b], answer: ans, steps: steps }, rnd);
    }
    // of: a fraction of a whole number, e.g. 3/4 of 20
    a = properFrac(rnd, Math.min(10, sp.maxD)); a = F(a.n, a.d);
    var whole = a.d * rnd.randInt(2, 8);
    var part = whole / a.d, res = part * a.n;
    return {
      kind: kind, text: 'כמה זה?', parts: [a, 'מתוך', whole], answer: res, numeric: true,
      options: rnd.shuffle(numOpts(res, [part, whole - res, res + part].filter(function (x) { return x > 0 && x !== res; }), rnd)),
      steps: [{ t: 'מחלקים את ' + whole + ' ל-' + a.d + ' חלקים שווים:', m: [whole + ' ÷ ' + a.d + ' = ' + part] },
        { t: 'לוקחים ' + a.n + ' חלקים:', m: [part + ' × ' + a.n + ' = ' + res] }]
    };
  }

  function mixedTok(w, f) { return { w: w, n: f.n, d: f.d, raw: true }; }

  function numOpts(res, near, rnd) {
    var out = [res];
    near.forEach(function (x) { if (out.indexOf(x) === -1 && out.length < 4) out.push(x); });
    while (out.length < 4) { var v = res + rnd.randInt(-6, 6); if (v > 0 && out.indexOf(v) === -1) out.push(v); }
    return out;
  }

  // four different answers: the right one and typical mistakes
  function finish(q, rnd, keepRaw) {
    var ans = q.answer, seen = {}, opts = [];
    function push(f) {
      if (!f || f.d <= 0 || f.n <= 0) return;
      var g = keepRaw ? f : F(f.n, f.d);
      var k = keepRaw ? g.n + '/' + g.d : key(g);
      if (seen[k] || opts.length >= 4) return;
      // an equal value written differently would also be right: skip it
      if (eq(g, ans) && opts.length) return;
      seen[k] = true; opts.push(g);
    }
    push(ans);
    (q.traps || []).forEach(function (t) { if (t.n < t.d) push(t); });
    if (q.wrongSum) push(q.wrongSum);                 // adding the tops and the bottoms
    push({ n: ans.n + 1, d: ans.d });
    push({ n: ans.d, d: ans.n > 0 ? ans.n : 1 });      // upside down
    push({ n: Math.max(1, ans.n - 1), d: ans.d });
    push({ n: ans.n, d: ans.d + 1 });
    push({ n: ans.n * 2, d: ans.d * 3 });
    for (var t = 0; opts.length < 4 && t < 30; t++) push({ n: rnd.randInt(1, ans.d + 2), d: rnd.randInt(2, ans.d + 3) });
    q.options = rnd.shuffle(opts);
    return q;
  }


  /* "How to solve" guides: the method for each kind of question, with an example of its own (not the answer). */
  var GUIDE = {
    read: [{ t: 'סופרים לכמה חלקים שווים מחולק המלבן. זה המכנה, המספר שלמטה.' },
      { t: 'סופרים כמה חלקים צבועים. זה המונה, המספר שלמעלה.' },
      { t: 'דוגמה: 3 חלקים צבועים מתוך 5:', m: [raw(3, 5)] }],
    same: [{ t: 'כשהמכנים (המספרים שלמטה) שווים, המכנה נשאר כמו שהוא.' },
      { t: 'מחברים או מחסרים רק את המונים (המספרים שלמעלה).' },
      { t: 'דוגמה:', m: [raw(1, 7), '+', raw(3, 7), '=', raw(4, 7)] },
      { t: 'אם אפשר, מצמצמים בסוף: מחלקים מונה ומכנה באותו מספר.' }],
    simplify: [{ t: 'מחפשים מספר שמחלק גם את המונה וגם את המכנה, ומחלקים את שניהם בו.' },
      { t: 'ממשיכים עד שאין יותר מספר כזה (חוץ מ-1).' },
      { t: 'דוגמה: את 6 ואת 8 אפשר לחלק ב-2:', m: [raw(6, 8), '=', raw(3, 4)] }],
    compare: [{ t: 'מביאים את שני השברים לאותו מכנה, ואז משווים רק את המונים.' },
      { t: 'דוגמה: 2/3 ו-3/4. מכנה משותף 12:', m: [raw(2, 3), '=', raw(8, 12), ',', raw(3, 4), '=', raw(9, 12)] },
      { t: '9 גדול מ-8, ולכן 3/4 גדול יותר.' }],
    easy: [{ t: 'כשהמכנים שונים, קודם מוצאים מכנה משותף: מספר שמתחלק בשני המכנים.' },
      { t: 'מרחיבים כל שבר: כופלים את המונה ואת המכנה באותו מספר.' },
      { t: 'דוגמה:', m: [raw(1, 2), '+', raw(1, 6), '=', raw(3, 6), '+', raw(1, 6), '=', raw(4, 6), '=', raw(2, 3)] }],
    any: [{ t: 'כשהמכנים שונים, קודם מוצאים מכנה משותף: מספר שמתחלק בשני המכנים (אפשר תמיד לכפול אותם זה בזה).' },
      { t: 'מרחיבים כל שבר למכנה החדש, ואז מחברים או מחסרים את המונים.' },
      { t: 'דוגמה:', m: [raw(1, 2), '+', raw(1, 3), '=', raw(3, 6), '+', raw(2, 6), '=', raw(5, 6)] }],
    mixed: [{ t: 'הופכים כל מספר מעורב לשבר: השלם כפול המכנה, ועוד המונה.' },
      { t: 'דוגמה:', m: [{ w: 1, n: 1, d: 2, raw: true }, '=', raw(3, 2)] },
      { t: 'אחר כך ממשיכים כמו בחיבור שברים: מכנה משותף, ואז מחברים או מחסרים מונים.' }],
    mul: [{ t: 'בכפל שברים: מונה כפול מונה, ומכנה כפול מכנה.' },
      { t: 'דוגמה:', m: [raw(2, 3), '×', raw(3, 4), '=', raw(6, 12), '=', raw(1, 2)] },
      { t: 'ובסוף מצמצמים.' }],
    div: [{ t: 'בחילוק שברים: הופכים את השבר השני (המונה והמכנה מתחלפים), ובמקום לחלק כופלים.' },
      { t: 'דוגמה:', m: [raw(1, 2), '÷', raw(1, 4), '=', raw(1, 2), '×', raw(4, 1), '=', raw(4, 2), '=', 2] }],
    of: [{ t: 'כדי למצוא חלק ממספר: מחלקים את המספר במכנה, ואז כופלים במונה.' },
      { t: 'דוגמה: 2/3 מתוך 12. קודם 12 ÷ 3 = 4, ואז 4 × 2 = 8.' }]
  };

  var css = [
    '.fr-q{display:flex;align-items:center;justify-content:center;gap:.6rem;direction:ltr;font-size:1.8rem;font-weight:900;flex-wrap:wrap;}',
    '.fr-q .fr-word{font-size:1.3rem;font-weight:800;direction:rtl;}',
    '.fr{display:inline-flex;flex-direction:column;align-items:center;line-height:1.05;font-family:var(--font-display);font-weight:900;vertical-align:middle;}',
    '.fr .t{border-bottom:3px solid currentColor;padding:0 .2em;}',
    '.fr .b{padding:0 .2em;}',
    '.fr-mixed{display:inline-flex;align-items:center;gap:.12em;direction:ltr;}',
    '.fr-q .fr{font-size:2.2rem;}',
    '.fr-bar{display:flex;width:100%;max-width:22rem;height:3rem;border:3px solid var(--ink);border-radius:8px;overflow:hidden;direction:ltr;}',
    '.fr-bar i{flex:1;border-inline-start:2px solid var(--ink);background:var(--surface);}',
    '.fr-bar i:first-child{border-inline-start:0;}',
    '.fr-bar i.on{background:var(--c-blue);}',
    '.fr-bar.b2 i.on{background:var(--c-red);}',
    '.fr-bars{display:flex;flex-direction:column;gap:.3rem;width:100%;align-items:center;}',
    '.fr-opts{width:100%;max-width:26rem;}',
    '.fr-opts .g-choice{min-height:5.2rem;font-size:1.8rem;}',
    /* once answered, the options shrink so the explanation fits under them */
    '.fr-opts.fr-answered .g-choice{min-height:3.2rem;font-size:1.25rem;padding:.15rem;}',
    '.fr-answered .fr .t,.fr-answered .fr .b{padding:0 .1em;}',
    '.fr-hide{display:none !important;}',
    '.fr-steps{width:100%;max-width:28rem;background:var(--sun-soft);border:2px solid var(--sun);border-radius:var(--radius-sm);padding:.5rem .7rem;',
    'display:flex;flex-direction:column;gap:.3rem;font-size:1rem;font-weight:700;line-height:1.3;}',
    '.fr-steps h3{margin:0;font-size:1.1rem;}',
    '.fr-step .m{display:flex;align-items:center;justify-content:center;gap:.35rem;direction:ltr;flex-wrap:wrap;font-size:1.25rem;font-weight:900;margin-top:.15rem;}',
    '.fr-step .m .fr{font-size:1.25rem;}'
  ].join('');

  BrainGames.register({
    id: 'fractions',
    name: 'שברים',
    skill: 'logic',
    isNew: true,
    tagline: 'חיבור, חיסור, כפל וחילוק של שברים, עם הסבר',
    benefit: 'חשבון, הבנת חלקים ושלם',
    instructions: [
      'שבר כמו 3/4 אומר: חילקנו ל-4 חלקים שווים ולקחנו 3. המספר למטה הוא המכנה, והמספר למעלה הוא המונה.',
      'דוגמה: 1/4 + 2/3. מכנה משותף הוא 12. 1/4 = 3/12, ו-2/3 = 8/12. מחברים מונים: 3/12 + 8/12 = 11/12.',
      'בכל שאלה יש כפתור "איך פותרים?" שמסביר את הדרך עם דוגמה אחרת. אחרי טעות מופיע הפתרון המלא של השאלה.',
      'מתחילים בקריאת שבר מציור, וממשיכים לחיבור, חיסור, כפל, חילוק ומספרים מעורבים. אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makeQuestion: makeQuestion, F: F },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var Q = 8, q = 0, good = 0;

      function frac(f) {
        if (typeof f === 'number') return el('span', null, String(f));
        if (typeof f === 'string') return el('span', { class: /[א-ת]/.test(f) ? 'fr-word' : '' }, f);
        var n = f.n, d = f.d, w = f.w || 0;
        if (!f.raw && !w && n >= d && d > 1) { w = Math.floor(n / d); n = n % d; } // 7/4 → 1 3/4
        if (d === 1) return el('span', { class: 'fr' }, String(n + w * 1));
        var body = el('span', { class: 'fr' }, [el('span', { class: 't' }, String(n)), el('span', { class: 'b' }, String(d))]);
        if (!w) return body;
        if (!n) return el('span', null, String(w));
        return el('span', { class: 'fr-mixed' }, [el('span', { class: 'fr' }, String(w)), body]);
      }
      function bar(f, cls) {
        var cells = [];
        for (var i = 0; i < f.d; i++) cells.push(el('i', { class: i < f.n ? 'on' : '' }));
        return el('div', { class: 'fr-bar ' + (cls || ''), 'aria-hidden': 'true' }, cells);
      }
      function stepsBox(it, title) {
        return el('div', { class: 'fr-steps', role: 'note' }, [el('h3', null, title)].concat(it.steps.map(function (s) {
          return el('div', { class: 'fr-step' }, [el('div', null, s.t), s.m ? el('div', { class: 'm' }, s.m.map(frac)) : null]);
        })));
      }

      function nextQ() {
        if (q >= Q) { ctx.finish({ correct: good, total: Q, note: 'עניתם נכון על ' + good + ' מתוך ' + Q + ' שאלות' }); return; }
        q++;
        ctx.setProgress(q, Q);
        var it = makeQuestion(sp, ctx);
        root.innerHTML = '';
        if (it.bar) root.appendChild(bar(it.bar));
        if (it.parts.length) root.appendChild(el('div', { class: 'fr-q', style: it.kind === 'of' ? { direction: 'rtl' } : null }, it.parts.map(frac).concat(it.kind === 'compare' || it.kind === 'simplify' || it.kind === 'of' ? [] : [el('span', null, '= ?')])));
        if (it.bars && it.kind === 'same') root.appendChild(el('div', { class: 'fr-bars' }, [bar(it.parts[0]), bar(it.parts[2], 'b2')]));
        ctx.setStatus(it.text || 'כמה זה?');
        var box = el('div', { class: 'g-choices fr-opts' });
        it.options.forEach(function (o) {
          var b = el('button', { class: 'g-choice', type: 'button', onclick: function () { answer(o, b); } }, frac(o));
          b._val = o;
          box.appendChild(b);
        });
        root.appendChild(box);
        var help = el('button', { class: 'btn btn-secondary', type: 'button', onclick: function () {
          help.remove(); root.insertBefore(stepsBox({ steps: GUIDE[it.kind] }, 'איך פותרים שאלה כזאת?'), actions);
        } }, 'איך פותרים?');
        var actions = el('div', { class: 'g-actions' }, help);
        root.appendChild(actions);
        var done = false;

        function same(x, y) {
          if (typeof x === 'number' || typeof y === 'number') return x === y;
          return x.raw && it.kind === 'read' ? x.n === y.n && x.d === y.d : eq(x, y);
        }
        function answer(o, b) {
          if (done) return;
          done = true;
          var ok = same(o, it.answer);
          if (ok) good++;
          [].forEach.call(box.children, function (x) { x.disabled = true; if (same(x._val, it.answer)) x.classList.add('is-correct'); });
          if (!ok) b.classList.add('is-wrong');
          actions.innerHTML = '';
          box.classList.add('fr-answered');
          // after a wrong answer only the chosen and the right answer stay, to leave room for the explanation
          if (!ok) [].forEach.call(box.children, function (x) { if (x !== b && !same(x._val, it.answer)) x.classList.add('fr-hide'); });
          [].forEach.call(root.querySelectorAll('.fr-bars'), function (x) { x.classList.add('fr-hide'); });
          if (!ok) {
            var guideBox = root.querySelector('.fr-steps');
            if (guideBox) guideBox.remove();
            root.insertBefore(stepsBox(it, 'כך פותרים את השאלה הזאת:'), actions);
          }
          var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { next.disabled = true; nextQ(); } },
            q >= Q ? 'לסיכום' : 'לשאלה הבאה');
          ctx.feedback(ok).then(function () { actions.appendChild(next); if (!ok) next.scrollIntoView({ block: 'nearest' }); });
        }
      }
      nextQ();
    }
  });
})();
