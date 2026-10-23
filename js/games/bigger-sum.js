/* מה גדול יותר? — compare two arithmetic expressions (logic). Untimed. */
(function () {
  'use strict';

  var TRIALS = 12;
  var EQUAL_RATE = 0.15;
  var TIMES = '✕';   // ✕
  var MINUS = '−';   // −
  var DIV = '÷';     // ÷
  var SP = ' ';      // thin space keeps long expressions on one line

  // Per level (1–20): which expression kinds may appear, the value range and how
  // close the two sides are (maxDiff). Each step adds a little size or a new kind.
  var LEVELS = [
    { kinds: ['num'], min: 2, max: 20, diff: 6, noEqual: true },               // 1
    { kinds: ['num', 'add'], min: 3, max: 12, diff: 4 },                       // 2
    { kinds: ['add'], min: 4, max: 15, diff: 4 },                              // 3
    { kinds: ['num', 'add', 'sub'], min: 3, max: 15, diff: 3 },                // 4
    { kinds: ['add', 'sub'], min: 4, max: 20, diff: 3 },                       // 5
    { kinds: ['add', 'sub'], min: 8, max: 30, diff: 3 },                       // 6
    { kinds: ['add', 'sub'], min: 10, max: 40, diff: 2 },                      // 7
    { kinds: ['num', 'mul'], min: 4, max: 25, diff: 3, mulMax: 5 },            // 8
    { kinds: ['add', 'mul'], min: 6, max: 30, diff: 3, mulMax: 6 },            // 9
    { kinds: ['add', 'sub', 'mul'], min: 6, max: 36, diff: 3, mulMax: 6 },     // 10
    { kinds: ['sub', 'mul'], min: 10, max: 50, diff: 2, mulMax: 8 },           // 11
    { kinds: ['add', 'sub', 'mul'], min: 12, max: 64, diff: 2, mulMax: 9 },    // 12
    { kinds: ['mul', 'mulAdd'], min: 8, max: 40, diff: 3, mulMax: 6, cMax: 6 },          // 13
    { kinds: ['sub', 'mul', 'mulAdd'], min: 10, max: 50, diff: 2, mulMax: 7, cMax: 8 },  // 14
    { kinds: ['add', 'mulAdd', 'mulSub'], min: 10, max: 60, diff: 2, mulMax: 8, cMax: 9 },              // 15
    { kinds: ['mul', 'mulAdd', 'mulSub', 'addSub'], min: 12, max: 70, diff: 2, mulMax: 9, cMax: 10 },   // 16
    { kinds: ['mulAdd', 'mulSub', 'div'], min: 4, max: 60, diff: 2, mulMax: 9, cMax: 10 },              // 17
    { kinds: ['mulAdd', 'mulSub', 'addSub', 'div'], min: 6, max: 70, diff: 2, mulMax: 9, cMax: 12 },    // 18
    { kinds: ['mulAdd', 'mulSub', 'mulMul', 'div'], min: 8, max: 80, diff: 1, mulMax: 9, cMax: 15 },    // 19
    { kinds: ['mulAdd', 'mulSub', 'mulMul', 'addSub', 'div'], min: 10, max: 90, diff: 1, mulMax: 9, cMax: 20 } // 20
  ];

  function ri(rng, a, b) { return a + Math.floor(rng() * (b - a + 1)); }
  function pk(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }
  function j() { return Array.prototype.slice.call(arguments).join(SP); }

  // Try to build an expression of `kind` whose value is exactly v. Returns {text, value} or null.
  function build(kind, v, spec, rng) {
    var mm = spec.mulMax || 9, cm = spec.cMax || 10, a, b, c, opts, i, p;
    switch (kind) {
      case 'num':
        return { text: String(v), value: v };
      case 'add':
        if (v < 2) return null;
        a = ri(rng, 1, v - 1);
        return { text: j(a, '+', v - a), value: v };
      case 'sub':
        b = ri(rng, 1, Math.max(2, Math.min(20, Math.round(v * 0.8) + 2)));
        return { text: j(v + b, MINUS, b), value: v };
      case 'mul':
        opts = [];
        for (a = 2; a <= mm; a++) if (v % a === 0 && v / a >= 2 && v / a <= mm) opts.push(a);
        if (!opts.length) return null;
        a = pk(rng, opts);
        return { text: j(a, TIMES, v / a), value: v };
      case 'mulAdd':
      case 'mulSub':
        for (i = 0; i < 30; i++) {
          a = ri(rng, 2, mm); b = ri(rng, 2, mm); p = a * b;
          c = kind === 'mulAdd' ? v - p : p - v;
          if (c >= 1 && c <= cm) {
            return { text: j(a, TIMES, b, kind === 'mulAdd' ? '+' : MINUS, c), value: v };
          }
        }
        return null;
      case 'addSub':
        c = ri(rng, 2, cm);
        if (v + c < 3) return null;
        a = ri(rng, 1, v + c - 1);
        return { text: j(a, '+', v + c - a, MINUS, c), value: v };
      case 'mulMul': // a × b − c × d  (two products)
        for (i = 0; i < 40; i++) {
          a = ri(rng, 2, mm); b = ri(rng, 2, mm);
          c = ri(rng, 2, 5); var d = ri(rng, 2, 5);
          if (a * b - c * d === v) return { text: j(a, TIMES, b, MINUS, c, TIMES, d), value: v };
        }
        return null;
      case 'div':
        b = ri(rng, 2, Math.min(mm, 9));
        if (v > 12) return null;
        return { text: j(v * b, DIV, b), value: v };
    }
    return null;
  }

  function makeTrial(level, rng, wantEqual) {
    var spec = LEVELS[level - 1];
    for (var tries = 0; tries < 400; tries++) {
      var kL = pk(rng, spec.kinds), kR = pk(rng, spec.kinds);
      var vL = ri(rng, spec.min, spec.max);
      var eq = wantEqual && !spec.noEqual;
      var vR = eq ? vL : vL + (rng() < 0.5 ? -1 : 1) * ri(rng, 1, spec.diff);
      if (vR < 1 || vR > spec.max + spec.diff) continue;
      var L = build(kL, vL, spec, rng), R = build(kR, vR, spec, rng);
      if (!L || !R || L.text === R.text) continue;
      if (eq && kL === 'num' && kR === 'num') continue;
      if (rng() < 0.5) { var t = L; L = R; R = t; }
      return { a: L, b: R, answer: L.value > R.value ? 'a' : (L.value < R.value ? 'b' : 'eq') };
    }
    return { a: { text: '7', value: 7 }, b: { text: j(3, '+', 2), value: 5 }, answer: 'a' };
  }

  var css = [
    '.bs-wrap{width:100%;max-width:30rem;display:flex;flex-direction:column;align-items:center;gap:.9rem;}',
    '.bs-row{width:100%;display:grid;grid-template-columns:1fr 1fr;gap:.7rem;}',
    '.bs-board{min-height:7.5rem;padding:.8rem .3rem;border-radius:var(--radius);border:3px solid var(--line);',
    'background:var(--surface-2);color:var(--ink);cursor:pointer;display:flex;flex-direction:column;',
    'align-items:center;justify-content:center;gap:.35rem;font-family:var(--font-display);',
    'transition:background-color .2s,border-color .2s;}',
    '.bs-board:hover:not(:disabled){border-color:var(--logic);background:var(--logic-soft);}',
    '.bs-board:disabled{cursor:default;}',
    '.bs-expr{direction:ltr;unicode-bidi:isolate;white-space:nowrap;font-weight:900;line-height:1.15;',
    'font-variant-numeric:tabular-nums;font-size:2.4rem;}',
    '.bs-expr.bs-m{font-size:1.75rem;}',
    '.bs-expr.bs-s{font-size:1.4rem;}',
    '.bs-expr.bs-xs{font-size:1.15rem;}',
    '.bs-val{direction:ltr;unicode-bidi:isolate;font-size:1.25rem;font-weight:800;color:var(--ink-soft);min-height:1.5rem;}',
    '.bs-board.is-correct{border-color:var(--good);background:var(--good-soft);}',
    '.bs-board.is-correct .bs-val{color:var(--good);}',
    '.bs-board.is-wrong{border-color:var(--bad);background:var(--bad-soft);}',
    '.bs-row.bs-stack{grid-template-columns:1fr;gap:.6rem;}',
    '.bs-stack .bs-board{min-height:4.6rem;flex-direction:row;gap:.8rem;direction:ltr;}',
    '.bs-stack .bs-expr,.bs-stack .bs-expr.bs-s,.bs-stack .bs-expr.bs-xs{font-size:1.9rem;}',
    '.bs-stack .bs-val:empty{display:none;}',
    '.bs-eq{min-width:9rem;}',
    '.bs-explain{font-size:1.2rem;font-weight:700;text-align:center;min-height:1.6rem;}'
  ].join('');

  function sizeClass(text) {
    var n = text.length;
    if (n <= 4) return '';
    if (n <= 7) return ' bs-m';
    if (n <= 11) return ' bs-s';
    return ' bs-xs';
  }

  BrainGames.register({
    id: 'bigger-sum',
    name: 'מה גדול יותר?',
    skill: 'logic',
    tagline: 'השוו בין שני תרגילים ובחרו את הגדול',
    benefit: 'חשבון בראש, השוואה והחלטה',
    instructions: [
      'יופיעו שני לוחות, ובכל אחד מספר או תרגיל.',
      'חשבו בראש כמה יוצא בכל לוח.',
      'לחצו על הלוח שהתוצאה שלו גדולה יותר.',
      'אם התוצאות שוות, לחצו "שווים". אין מגבלת זמן.'
    ],
    css: css,
    _makeTrial: makeTrial,
    _levels: LEVELS.length,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var rng = Math.random;
      // Exactly ~15% equal trials, spread randomly through the session.
      var equalCount = LEVELS[level - 1].noEqual ? 0 : Math.round(TRIALS * EQUAL_RATE);
      var plan = [];
      for (var i = 0; i < TRIALS; i++) plan.push(i < equalCount);
      plan = ctx.shuffle(plan);

      var round = 0, score = 0;

      function nextRound() {
        if (round >= TRIALS) {
          ctx.finish({
            correct: score, total: TRIALS,
            note: 'השוויתם נכון ' + score + ' מתוך ' + TRIALS + ' זוגות של תרגילים'
          });
          return;
        }
        round++;
        ctx.setProgress(round, TRIALS);
        playRound(makeTrial(level, rng, plan[round - 1]));
      }

      function playRound(t) {
        root.innerHTML = '';
        ctx.setStatus('מה גדול יותר?');
        var answered = false;

        function board(side, e) {
          var val = el('div', { class: 'bs-val' }, '');
          var b = el('button', {
            class: 'bs-board', type: 'button',
            'aria-label': 'תרגיל ' + e.text.replace(/ /g, ' '),
            onclick: function () { choose(side); }
          }, [el('div', { class: 'bs-expr' + sizeClass(e.text) }, e.text), val]);
          b._val = val;
          return b;
        }
        // Long two-step expressions get full-width boards (one above the other) so the digits stay big.
        var stack = Math.max(t.a.text.length, t.b.text.length) > 9;
        var A = board('a', t.a), B = board('b', t.b);
        var eqBtn = el('button', {
          class: 'g-choice bs-eq', type: 'button', onclick: function () { choose('eq'); }
        }, 'שווים');
        var explain = el('p', { class: 'bs-explain', 'aria-live': 'polite' }, '');
        var actions = el('div', { class: 'g-actions' });

        root.appendChild(el('div', { class: 'bs-wrap' }, [
          el('div', { class: 'bs-row' + (stack ? ' bs-stack' : '') }, [A, B]), eqBtn, explain, actions
        ]));

        function choose(side) {
          if (answered) return;
          answered = true;
          ctx.sound('tap');
          A.disabled = B.disabled = eqBtn.disabled = true;
          var ok = side === t.answer;
          if (ok) score++;
          A._val.textContent = '= ' + t.a.value;
          B._val.textContent = '= ' + t.b.value;
          var mark = { a: A, b: B, eq: eqBtn };
          mark[t.answer].classList.add('is-correct');
          if (t.answer === 'eq') { A.classList.add('is-correct'); B.classList.add('is-correct'); }
          if (!ok) mark[side].classList.add('is-wrong');

          var big = t.answer === 'a' ? t.a : t.b, small = t.answer === 'a' ? t.b : t.a;
          var msg = t.answer === 'eq'
            ? 'שתי התוצאות שוות: ' + t.a.value
            : big.value + ' גדול מ־' + small.value;
          explain.textContent = msg;
          ctx.setStatus(ok ? 'נכון!' : 'הנה החישוב');

          ctx.feedback(ok, ok ? undefined : msg).then(function () {
            if (ok) return ctx.wait(700).then(nextRound);
            // After a mistake the player decides when to move on.
            var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: nextRound }, 'הלאה');
            actions.appendChild(next);
            try { next.focus(); } catch (e) {}
          });
        }
      }

      nextRound();
    }
  });
})();
