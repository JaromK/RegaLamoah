/* גדול או קטן — fill each row and column with the numbers 1 to N, each once, so that every < or > sign between two
   squares is true. Every puzzle has exactly one solution. Logic. Untimed. */
(function () {
  'use strict';

  /* Level 1–50: n = board side, keepSigns = share of the signs left, givens = numbers shown at the start. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    if (L <= 4) return { n: 4, keepSigns: 0.7, givens: 3 };
    if (L <= 8) return { n: 4, keepSigns: 0.5, givens: 1 };
    if (L <= 16) return { n: 5, keepSigns: 0.6, givens: 2 };
    if (L <= 25) return { n: 5, keepSigns: 0.4, givens: 0 };
    if (L <= 38) return { n: 6, keepSigns: 0.5, givens: 1 };
    return { n: 6, keepSigns: 0.36, givens: 1 };
  }

  // signs: list of { a: cell, b: cell } meaning value(a) < value(b); cells are r * n + c
  function count(n, fixed, signs, limit) {
    var g = fixed.slice(), found = 0, sol = null;
    var bySq = []; for (var i = 0; i < n * n; i++) bySq.push([]);
    signs.forEach(function (s) { bySq[s.a].push(s); bySq[s.b].push(s); });
    function okAt(i, v) {
      var r = Math.floor(i / n), c = i % n;
      for (var k = 0; k < n; k++) { if (k !== c && g[r * n + k] === v) return false; if (k !== r && g[k * n + c] === v) return false; }
      return bySq[i].every(function (s) {
        var other = s.a === i ? s.b : s.a, ov = g[other];
        if (!ov) return s.a === i ? v < n : v > 1;
        return s.a === i ? v < ov : v > ov;
      });
    }
    // always fill the square with the fewest possible numbers first (fast enough for 6 × 6 with few signs)
    (function go() {
      if (found >= limit) return;
      var best = -1, bestOpts = null;
      for (var i = 0; i < n * n; i++) {
        if (g[i]) continue;
        var opts = [];
        for (var v = 1; v <= n; v++) if (okAt(i, v)) opts.push(v);
        if (!opts.length) return;
        if (!bestOpts || opts.length < bestOpts.length) { best = i; bestOpts = opts; if (opts.length === 1) break; }
      }
      if (best < 0) { found++; sol = g.slice(); return; }
      for (var k = 0; k < bestOpts.length && found < limit; k++) { g[best] = bestOpts[k]; go(); g[best] = 0; }
    })();
    return { n: found, sol: sol };
  }
  function makePuzzle(sp, rnd) {
    var n = sp.n;
    // a random Latin square: a shifted base, rows, columns and numbers shuffled
    var rows = rnd.shuffle(Array.apply(null, { length: n }).map(function (_, i) { return i; }));
    var cols = rnd.shuffle(rows.slice()), nums = rnd.shuffle(rows.map(function (x) { return x + 1; }));
    var sol = [];
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) sol.push(nums[(rows[r] + cols[c]) % n]);
    // every sign between neighbours, then take signs away while the solution stays the only one
    var all = [];
    for (r = 0; r < n; r++) for (c = 0; c < n; c++) {
      var i = r * n + c;
      if (c < n - 1) all.push(sol[i] < sol[i + 1] ? { a: i, b: i + 1 } : { a: i + 1, b: i });
      if (r < n - 1) all.push(sol[i] < sol[i + n] ? { a: i, b: i + n } : { a: i + n, b: i });
    }
    var fixed = sol.map(function () { return 0; });
    rnd.shuffle(sol.map(function (_, k) { return k; })).slice(0, sp.givens).forEach(function (k) { fixed[k] = sol[k]; });
    var signs = all.slice();
    if (count(n, fixed, signs, 2).n !== 1) return null;
    var target = Math.round(all.length * sp.keepSigns);
    rnd.shuffle(all.slice()).forEach(function (s) {
      if (signs.length <= target) return;
      var rest = signs.filter(function (x) { return x !== s; });
      if (count(n, fixed, rest, 2).n === 1) signs = rest;
    });
    // still more signs than wanted: a given number can stand in for several of them
    return { n: n, sol: sol, fixed: fixed, signs: signs };
  }

  var css = [
    '.gl-grid{--n:5;display:grid;grid-template-columns:repeat(calc(var(--n) * 2 - 1),auto);justify-content:center;align-items:center;direction:ltr;}',
    '.gl-cell{width:var(--cs);height:var(--cs);border:2px solid var(--line);border-radius:10px;background:var(--surface);color:var(--c-blue);',
    'font-family:var(--font-display);font-weight:900;font-size:calc(var(--cs) * .55);display:grid;place-items:center;padding:0;cursor:pointer;line-height:1;}',
    '.gl-cell.is-fixed{color:var(--ink);background:var(--surface-2);cursor:default;}',
    '.gl-cell.is-sel{border-color:var(--c-yellow);box-shadow:0 0 0 3px var(--c-yellow);}',
    '.gl-cell.is-bad{color:var(--c-red);}',
    '.gl-cell.is-tip{box-shadow:0 0 0 4px var(--c-purple);}',
    '.gl-cell.is-wrong{box-shadow:0 0 0 4px var(--c-red);}',
    '.gl-sign{width:1rem;height:var(--cs);display:grid;place-items:center;font-weight:900;font-size:1.15rem;color:var(--c-red);}',
    '.gl-vsign{width:var(--cs);height:1.05rem;display:grid;place-items:center;font-weight:900;font-size:1.05rem;color:var(--c-red);line-height:1;}',
    '.gl-gap{width:1rem;height:1.05rem;}',
    '.gl-pad{display:grid;grid-template-columns:repeat(calc(var(--n) + 1),minmax(0,1fr));gap:.4rem;width:100%;max-width:24rem;}',
    '.gl-pad .g-choice{min-height:3.2rem;font-size:1.5rem;padding:.2rem;}',
    '.gl-acts{flex-wrap:nowrap;gap:.3rem;width:100%;max-width:24rem;}.gl-acts .btn{flex:1 1 auto;min-width:0;padding-inline:.4rem;font-size:.95rem;white-space:nowrap;}',
    '.gl-tip{margin:0;max-width:24rem;font-size:1rem;font-weight:700;text-align:center;}'
  ].join('');

  BrainGames.register({
    id: 'greater-less',
    name: 'גדול או קטן',
    skill: 'logic',
    isNew: true,
    tagline: 'מספרים בשורות ובטורים, לפי סימני גדול וקטן',
    benefit: 'חשיבה לוגית וחשבון',
    instructions: [
      'מלאו בכל שורה ובכל טור את המספרים מ-1 עד המספר הגדול, כל מספר פעם אחת.',
      'בין חלק מהמשבצות יש סימן: < או > (ולמעלה-למטה ∧ או ∨). הפה הפתוח פונה תמיד למספר הגדול יותר.',
      'לחצו על משבצת ואז על מספר. אפשר גם להקליד במקלדת.',
      'יש "רמז", "↶ בטלו" ו"נקו". אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makePuzzle: makePuzzle, count: count },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = sp.n === 4 ? 3 : 2, round = 0, good = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) { ctx.finish({ correct: good, total: ROUNDS, note: 'פתרתם ' + good + ' מתוך ' + ROUNDS + ' לוחות' }); return; }
        ctx.setProgress(round, ROUNDS);
        var P = null;
        for (var t = 0; t < 30 && !P; t++) P = makePuzzle(sp, ctx);
        play(P);
      }

      function play(P) {
        root.innerHTML = '';
        root.__gl = P; // read by the automated tests
        var n = P.n, g = P.fixed.slice(), sel = -1, done = false, hints = 0, past = [], tip = null;
        var less = {}; P.signs.forEach(function (s) { less[s.a + '<' + s.b] = true; });
        function signBetween(i, j) { return less[i + '<' + j] ? '<' : less[j + '<' + i] ? '>' : ''; }
        // the board: squares with sign slots between them (left to right, top to bottom)
        var cs = 'min(calc((100vw - 3rem - ' + (n - 1) + 'rem) / ' + n + '), calc((100svh - 25rem) / ' + n + '), 3.6rem)';
        var grid = el('div', { class: 'gl-grid', style: { '--n': n, '--cs': cs } });
        var cellEls = [];
        for (var r = 0; r < n; r++) {
          for (var c = 0; c < n; c++) {
            var i = r * n + c;
            (function (i) {
              var b = el('button', { class: 'gl-cell', type: 'button', onclick: function () { pick(i); } });
              cellEls[i] = b; grid.appendChild(b);
            })(i);
            if (c < n - 1) grid.appendChild(el('span', { class: 'gl-sign', 'aria-hidden': 'true' }, signBetween(i, i + 1)));
          }
          if (r < n - 1) for (c = 0; c < n; c++) {
            var s = signBetween(r * n + c, (r + 1) * n + c);
            grid.appendChild(el('span', { class: 'gl-vsign', 'aria-hidden': 'true' }, s === '<' ? '∧' : s === '>' ? '∨' : ''));
            if (c < n - 1) grid.appendChild(el('span', { class: 'gl-gap' }));
          }
        }
        var pad = el('div', { class: 'gl-pad', style: { '--n': n } });
        for (var v = 1; v <= n; v++) (function (v) { pad.appendChild(el('button', { class: 'g-choice', type: 'button', onclick: function () { put(v); } }, String(v))); })(v);
        pad.appendChild(el('button', { class: 'g-choice', type: 'button', 'aria-label': 'מחיקה', onclick: function () { put(0); } }, '⌫'));
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var undoBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: undo }, '↶ בטלו');
        var clearBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: clearAll }, 'נקו');
        var acts = el('div', { class: 'g-actions gl-acts' }, [hintBtn, undoBtn, clearBtn]);
        root.appendChild(grid); root.appendChild(pad); root.appendChild(acts);
        ctx.setStatus('לחצו על משבצת ריקה, ואז על מספר');
        draw();

        function bad(i) {
          var v = g[i]; if (!v) return false;
          var r = Math.floor(i / n), c = i % n;
          for (var k = 0; k < n; k++) { if (k !== c && g[r * n + k] === v) return true; if (k !== r && g[k * n + c] === v) return true; }
          return P.signs.some(function (s) { return (s.a === i || s.b === i) && g[s.a] && g[s.b] && !(g[s.a] < g[s.b]); });
        }
        function draw() {
          cellEls.forEach(function (b, i) {
            b.textContent = g[i] ? String(g[i]) : '';
            b.className = 'gl-cell' + (P.fixed[i] ? ' is-fixed' : '') + (i === sel && !done ? ' is-sel' : '') + (bad(i) ? ' is-bad' : '') +
              (tip && tip.i === i ? (tip.wrong ? ' is-wrong' : ' is-tip') : '');
            b.disabled = done;
          });
          [].forEach.call(pad.children, function (b) { b.disabled = done || sel < 0; });
          undoBtn.disabled = done || !past.length;
          clearBtn.disabled = done || !g.some(function (v, i) { return v && !P.fixed[i]; });
          hintBtn.disabled = done;
        }
        function pick(i) { if (done || P.fixed[i]) return; ctx.sound('tap'); sel = i; draw(); }
        function put(v) {
          if (done || sel < 0 || g[sel] === v) return;
          ctx.sound('tap'); past.push(g.slice()); tip = null;
          g[sel] = v; // the same square stays picked
          draw(); check();
        }
        function undo() { if (done || !past.length) return; ctx.sound('tap'); g = past.pop(); tip = null; draw(); }
        function clearAll() { if (done) return; ctx.sound('tap'); past.push(g.slice()); g = P.fixed.slice(); tip = null; ctx.setStatus('הלוח נוקה (אפשר "בטלו")'); draw(); }
        function check() {
          if (g.some(function (v) { return !v; })) return;
          if (g.some(function (_, i) { return bad(i); })) { ctx.setStatus('הלוח מלא, אבל יש מספר שלא מתאים (באדום)'); return; }
          done = true; sel = -1; draw();
          var ok = hints <= 2;
          if (ok) good++;
          ctx.setStatus('מצוין! הלוח פתור');
          ctx.feedback(ok, ok ? undefined : 'פתרתם, בעזרת רמזים').then(function () { return ctx.wait(700); }).then(nextRound);
        }
        /* a hint: a wrong number first; else the square with the fewest possible numbers, and why */
        function hint() {
          if (done) return;
          hints++;
          var wrong = g.map(function (v, i) { return v && v !== P.sol[i] ? i : -1; }).filter(function (i) { return i >= 0; })[0];
          if (wrong !== undefined) { tip = { i: wrong, wrong: true }; sel = wrong; ctx.setStatus('רמז: המספר במשבצת המסומנת לא נכון'); draw(); return; }
          var right = function (i) { return g[i] && g[i] === P.sol[i]; };
          var best = null;
          for (var i = 0; i < n * n; i++) {
            if (g[i]) continue;
            var r = Math.floor(i / n), c = i % n, opts = [];
            for (var v = 1; v <= n; v++) {
              var okv = true;
              for (var k = 0; k < n && okv; k++) { if (right(r * n + k) && g[r * n + k] === v) okv = false; if (right(k * n + c) && g[k * n + c] === v) okv = false; }
              P.signs.forEach(function (s) {
                if (!okv) return;
                if (s.a === i) { if (v === n || (right(s.b) && v >= g[s.b])) okv = false; }
                if (s.b === i) { if (v === 1 || (right(s.a) && v <= g[s.a])) okv = false; }
              });
              if (okv) opts.push(v);
            }
            if (!best || opts.length < best.opts.length) best = { i: i, opts: opts };
          }
          if (!best) return;
          tip = { i: best.i }; sel = best.i;
          ctx.setStatus(best.opts.length === 1 ? 'רמז: במשבצת המסומנת מתאים רק מספר אחד. בדקו את השורה, הטור והסימנים שלה'
            : 'רמז: במשבצת המסומנת מתאימים רק ' + best.opts.join(' או ') + '. בדקו את הסימנים שלידה');
          draw();
        }
      }

      nextRound();
    }
  });
})();
