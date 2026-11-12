/* כלובי חשבון — fill the grid: every number once in each row and column, and every cage reaches its
   target with its operation (logic, arithmetic). Untimed. Each puzzle has exactly one solution. */
(function () {
  'use strict';

  var PLUS = '+', MINUS = '−', TIMES = '×', DIV = '÷';

  /* Per level (1–30): n × n grid (at most 5 × 5 so cells stay big), operations, largest cage,
     given = cells filled in at the start, single = cages of one cell allowed (they are free hints). */
  var LEVELS = [
    { n: 3, ops: '+', max: 2, given: 3, single: true },    // 1
    { n: 3, ops: '+', max: 2, given: 2, single: true },    // 2
    { n: 3, ops: '+', max: 3, given: 1, single: true },    // 3
    { n: 3, ops: '+', max: 3, given: 0, single: true },    // 4
    { n: 4, ops: '+', max: 2, given: 4, single: true },    // 5
    { n: 4, ops: '+', max: 2, given: 2, single: true },    // 6
    { n: 4, ops: '+', max: 3, given: 1, single: true },    // 7
    { n: 4, ops: '+', max: 3, given: 0, single: true },    // 8
    { n: 4, ops: '+-', max: 2, given: 2, single: true },   // 9
    { n: 4, ops: '+-', max: 3, given: 0, single: true },   // 10
    { n: 4, ops: '+-', max: 3, given: 0 },                 // 11
    { n: 5, ops: '+', max: 2, given: 5, single: true },    // 12
    { n: 5, ops: '+', max: 3, given: 3, single: true },    // 13
    { n: 5, ops: '+-', max: 3, given: 3, single: true },   // 14
    { n: 4, ops: '+-x', max: 3, given: 1, single: true },  // 15
    { n: 4, ops: '+-x', max: 3, given: 0 },                // 16
    { n: 5, ops: '+-x', max: 3, given: 3, single: true },  // 17
    { n: 5, ops: '+-x', max: 3, given: 2, single: true },  // 18
    { n: 5, ops: '+-x', max: 3, given: 1, single: true },  // 19
    { n: 5, ops: '+-x', max: 3, given: 0, single: true },  // 20
    { n: 4, ops: '+-x/', max: 3, given: 0 },               // 21
    { n: 5, ops: '+-x/', max: 3, given: 2, single: true }, // 22
    { n: 5, ops: '+-x/', max: 3, given: 1, single: true }, // 23
    { n: 5, ops: '+-x/', max: 3, given: 0, single: true }, // 24
    { n: 5, ops: '+-x/', max: 3, given: 0 },               // 25
    { n: 5, ops: '+-x/', max: 4, given: 1 },               // 26
    { n: 5, ops: '+-x/', max: 4, given: 0, single: true }, // 27
    { n: 5, ops: '+-x/', max: 4, given: 0 },               // 28
    { n: 5, ops: '-x/', max: 4, given: 0 },                // 29: no plain sums when another op fits
    { n: 5, ops: '-x/', max: 4, given: 0, big: true }      // 30: mostly 3–4 cell cages
  ];

  /* ---------- pure model ---------- */
  function latin(n, rnd) {
    var base = [];
    for (var i = 0; i < n; i++) base.push(i + 1);
    var rows = [];
    var shift = rnd.shuffle(base.map(function (_, i) { return i; }));
    for (var r = 0; r < n; r++) rows.push(base.map(function (_, c) { return base[(c + shift[r]) % n]; }));
    // shuffle rows, columns and symbols
    rows = rnd.shuffle(rows);
    var colOrder = rnd.shuffle(base.map(function (_, i) { return i; }));
    var sym = rnd.shuffle(base.slice());
    return rows.map(function (row) { return colOrder.map(function (c) { return sym[row[c] - 1]; }); });
  }

  function makeCages(sol, spec, rnd) {
    var n = spec.n, owner = [], cages = [];
    for (var i = 0; i < n * n; i++) owner.push(-1);
    var order = rnd.shuffle(owner.map(function (_, i) { return i; }));
    order.forEach(function (start) {
      if (owner[start] !== -1) return;
      // one-cell cages give their number away, so they stay rare (and none at all without spec.single)
      var want = spec.big ? rnd.randInt(3, spec.max)
        : spec.single && rnd.randInt(1, 100) <= 15 ? 1 : rnd.randInt(2, spec.max);
      var cells = [start];
      owner[start] = cages.length;
      while (cells.length < want) {
        var nb = [];
        cells.forEach(function (k) {
          var r = Math.floor(k / n), c = k % n;
          [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(function (p) {
            if (p[0] >= 0 && p[0] < n && p[1] >= 0 && p[1] < n && owner[p[0] * n + p[1]] === -1) nb.push(p[0] * n + p[1]);
          });
        });
        if (!nb.length) break;
        var k2 = rnd.pick(nb);
        owner[k2] = cages.length;
        cells.push(k2);
      }
      cages.push({ cells: cells });
    });
    // a lone cell that could not grow: merge it into a neighbour when singles are not allowed
    if (!spec.single) {
      cages.forEach(function (cg, ci) {
        if (cg.cells.length !== 1 || !cg.cells.length) return;
        var k = cg.cells[0], r = Math.floor(k / n), c = k % n;
        var nbs = [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(function (p) { return p[0] >= 0 && p[0] < n && p[1] >= 0 && p[1] < n; })
          .map(function (p) { return owner[p[0] * n + p[1]]; }).filter(function (o) { return o !== ci && cages[o].cells.length; });
        if (!nbs.length) return;
        var to = rnd.pick(nbs);
        cages[to].cells.push(k); owner[k] = to; cg.cells = [];
      });
      cages = cages.filter(function (cg) { return cg.cells.length; });
      owner = owner.map(function () { return -1; });
      cages.forEach(function (cg, ci) { cg.cells.forEach(function (k) { owner[k] = ci; }); });
    }
    cages.forEach(function (cg) {
      var vals = cg.cells.map(function (k) { return sol[Math.floor(k / n)][k % n]; });
      cg.op = chooseOp(vals, spec.ops, rnd);
      cg.target = calc(vals, cg.op);
    });
    return { cages: cages, owner: owner };
  }

  function chooseOp(vals, ops, rnd) {
    if (vals.length === 1) return '';
    var opts = [];
    if (vals.length === 2) {
      var a = Math.max(vals[0], vals[1]), b = Math.min(vals[0], vals[1]);
      if (ops.indexOf('/') !== -1 && a % b === 0 && b > 1) opts.push(DIV, DIV);
      if (ops.indexOf('-') !== -1) opts.push(MINUS, MINUS);
    }
    if (ops.indexOf('x') !== -1) opts.push(TIMES);
    if (ops.indexOf('+') !== -1 || !opts.length) opts.push(PLUS);
    return rnd.pick(opts);
  }

  function calc(vals, op) {
    if (op === '') return vals[0];
    if (op === PLUS) return vals.reduce(function (s, v) { return s + v; }, 0);
    if (op === TIMES) return vals.reduce(function (s, v) { return s * v; }, 1);
    var a = Math.max(vals[0], vals[1]), b = Math.min(vals[0], vals[1]);
    return op === MINUS ? a - b : a / b;
  }

  // can the cage still reach its target, given the values placed so far (0 = empty)?
  function cageOk(cg, vals) {
    var full = vals.every(function (v) { return v; });
    if (full) return calc(vals, cg.op) === cg.target;
    var known = vals.filter(function (v) { return v; });
    if (cg.op === PLUS) return known.reduce(function (s, v) { return s + v; }, 0) < cg.target;
    if (cg.op === TIMES) { var p = known.reduce(function (s, v) { return s * v; }, 1); return cg.target % p === 0; }
    return true;
  }

  // number of solutions (stops at 2)
  function countSolutions(n, cages, owner, fixed) {
    var g = fixed.map(function (row) { return row.slice(); });
    var count = 0;
    function ok(r, c, v) {
      for (var i = 0; i < n; i++) if (g[r][i] === v || g[i][c] === v) return false;
      g[r][c] = v;
      var cg = cages[owner[r * n + c]];
      var good = cageOk(cg, cg.cells.map(function (k) { return g[Math.floor(k / n)][k % n]; }));
      g[r][c] = 0;
      return good;
    }
    (function rec(k) {
      if (count > 1) return;
      while (k < n * n && g[Math.floor(k / n)][k % n]) k++;
      if (k === n * n) { count++; return; }
      var r = Math.floor(k / n), c = k % n;
      for (var v = 1; v <= n; v++) {
        if (ok(r, c, v)) { g[r][c] = v; rec(k + 1); g[r][c] = 0; if (count > 1) return; }
      }
    })(0);
    return count;
  }

  function makePuzzle(spec, rnd) {
    var n = spec.n;
    for (var attempt = 0; attempt < 60; attempt++) {
      var sol = latin(n, rnd);
      var cg = makeCages(sol, spec, rnd);
      var fixed = sol.map(function (row) { return row.map(function () { return 0; }); });
      var cells = rnd.shuffle(fixedCells(n));
      var g = 0;
      // the level's given cells, then more only if needed for a single solution
      for (; g < spec.given; g++) { var k = cells[g]; fixed[Math.floor(k / n)][k % n] = sol[Math.floor(k / n)][k % n]; }
      while (countSolutions(n, cg.cages, cg.owner, fixed) > 1 && g < cells.length) {
        var k2 = cells[g++]; fixed[Math.floor(k2 / n)][k2 % n] = sol[Math.floor(k2 / n)][k2 % n];
      }
      // needed too many extra givens: try other cages (the last try is kept whatever it needed)
      if (g > spec.given + (n >= 5 ? 2 : 1) && attempt < 59) continue;
      return { n: n, sol: sol, cages: cg.cages, owner: cg.owner, fixed: fixed };
    }
    return null;
  }
  function fixedCells(n) { var a = []; for (var i = 0; i < n * n; i++) a.push(i); return a; }

  var css = [
    '.mc-grid{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));grid-template-rows:repeat(var(--n),minmax(0,1fr));width:min(100%,calc(var(--n) * 4.2rem),calc(100dvh - 21rem));',
    'aspect-ratio:1;direction:rtl;border:3px solid var(--ink);border-radius:var(--radius-sm);overflow:hidden;background:var(--ink);gap:0;}',
    '.mc-cell{position:relative;min-height:0;min-width:0;padding:0;border:0;background:var(--surface);color:var(--ink);font-family:var(--font-display);',
    'font-weight:900;font-size:clamp(1.5rem,7vw,2.1rem);cursor:pointer;display:grid;place-items:center;',
    'box-shadow:inset 0 0 0 1px var(--line);}',
    '.mc-cell.bt{border-top:3px solid var(--ink);}',
    '.mc-cell.bb{border-bottom:3px solid var(--ink);}',
    '.mc-cell.br{border-right:3px solid var(--ink);}',
    '.mc-cell.bl{border-left:3px solid var(--ink);}',
    '.mc-cell.is-fixed{color:var(--ink-soft);cursor:default;background:var(--surface-2);}',
    '.mc-cell.is-sel{background:var(--sun-soft);box-shadow:inset 0 0 0 3px var(--sun);}',
    '.mc-cell.is-clash{color:var(--bad);}',
    '.mc-lab{position:absolute;top:2px;right:4px;font-family:var(--font-body);font-size:clamp(.75rem,3.2vw,.95rem);font-weight:800;',
    'color:var(--logic);line-height:1;direction:ltr;}',
    '.mc-done .mc-cell{background:var(--good-soft);}',
    '.mc-pad{display:grid;grid-template-columns:repeat(var(--k),minmax(0,1fr));gap:.45rem;width:100%;max-width:24rem;}',
    '.mc-pad .g-choice{min-height:3.5rem;font-size:1.6rem;padding:.2rem;}'
  ].join('');

  BrainGames.register({
    id: 'math-cages',
    name: 'כלובי חשבון',
    skill: 'logic',
    tagline: 'מלאו את הלוח לפי החשבון בכל כלוב',
    benefit: 'חשבון, חשיבה לוגית והסקת מסקנות',
    instructions: [
      'מלאו מספרים בלוח: בכל שורה ובכל טור כל מספר מופיע פעם אחת בלבד.',
      'הלוח מחולק לכלובים בקו עבה. המספר בפינה והסימן אומרים מה התוצאה: "5+" פירושו שסכום המספרים בכלוב הוא 5.',
      'לחצו על משבצת ואז על מספר. ב"−" וב"÷" מחסרים או מחלקים את הגדול בקטן.',
      'כשהלוח מלא ונכון, הוא נצבע בירוק. אין שעון.'
    ],
    css: css,
    _model: { makePuzzle: makePuzzle, countSolutions: countSolutions, calc: calc, LEVELS: LEVELS },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var ROUNDS = spec.n <= 3 ? 4 : 3;
      var round = 0, solved = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: solved, total: ROUNDS, note: 'פתרתם ' + solved + ' מתוך ' + ROUNDS + ' לוחות' });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var pz = null;
        for (var t = 0; t < 5 && !pz; t++) pz = makePuzzle(spec, ctx);
        play(pz);
      }

      function play(pz) {
        root.innerHTML = '';
        var n = pz.n;
        var g = pz.fixed.map(function (row) { return row.slice(); });
        var sel = -1, done = false, hints = 0;

        var labelAt = {};
        pz.cages.forEach(function (cg) {
          // label in the cage's top-right cell (rtl: the smallest row, then the smallest column = rightmost)
          var first = cg.cells.slice().sort(function (a, b) { return Math.floor(a / n) - Math.floor(b / n) || (a % n) - (b % n); })[0];
          labelAt[first] = cg.op ? cg.target + cg.op : String(cg.target);
        });
        var cells = [];
        for (var k = 0; k < n * n; k++) {
          (function (k) {
            var r = Math.floor(k / n), c = k % n, o = pz.owner[k];
            var same = function (rr, cc) { return rr >= 0 && rr < n && cc >= 0 && cc < n && pz.owner[rr * n + cc] === o; };
            // grid is rtl: column c-1 is to the right, c+1 to the left
            var cls = 'mc-cell' + (same(r - 1, c) ? '' : ' bt') + (same(r + 1, c) ? '' : ' bb') +
              (same(r, c - 1) ? '' : ' br') + (same(r, c + 1) ? '' : ' bl') + (pz.fixed[r][c] ? ' is-fixed' : '');
            var b = el('button', { class: cls, type: 'button', 'aria-label': 'שורה ' + (r + 1) + ', משבצת ' + (c + 1) + (labelAt[k] ? ', כלוב ' + labelAt[k] : ''),
              onclick: function () { select(k); } });
            cells.push(b);
          })(k);
        }
        var grid = el('div', { class: 'mc-grid', style: { '--n': n } }, cells);
        var pad = el('div', { class: 'mc-pad', style: { '--k': n + 1 } });
        for (var v = 1; v <= n; v++) {
          (function (v) { pad.appendChild(el('button', { class: 'g-choice', type: 'button', onclick: function () { put(v); } }, String(v))); })(v);
        }
        pad.appendChild(el('button', { class: 'g-choice', type: 'button', 'aria-label': 'מחיקה', onclick: function () { put(0); } }, '⌫'));
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var showBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: reveal }, 'הראו פתרון');
        var actions = el('div', { class: 'g-actions' }, [hintBtn, showBtn]);
        root.appendChild(grid);
        root.appendChild(pad);
        root.appendChild(actions);
        ctx.setStatus('לחצו על משבצת ריקה, ואז על מספר');
        // first empty cell is selected, so the pad works right away
        for (var e = 0; e < n * n; e++) if (!g[Math.floor(e / n)][e % n]) { sel = e; break; }
        render();

        function clash(r, c) {
          var v = g[r][c];
          if (!v) return false;
          for (var i = 0; i < n; i++) if ((i !== c && g[r][i] === v) || (i !== r && g[i][c] === v)) return true;
          return false;
        }

        function render() {
          cells.forEach(function (b, k) {
            var r = Math.floor(k / n), c = k % n;
            b.innerHTML = '';
            if (labelAt[k]) b.appendChild(el('span', { class: 'mc-lab' }, labelAt[k]));
            if (g[r][c]) b.appendChild(document.createTextNode(String(g[r][c])));
            b.classList.toggle('is-sel', k === sel && !done);
            b.classList.toggle('is-clash', clash(r, c));
            b.disabled = done;
          });
          [].forEach.call(pad.children, function (b) { b.disabled = done || sel < 0; });
          hintBtn.disabled = showBtn.disabled = done;
        }

        function select(k) {
          if (done || pz.fixed[Math.floor(k / n)][k % n]) return;
          ctx.sound('tap');
          sel = k;
          render();
        }

        function put(v) {
          if (done || sel < 0) return;
          ctx.sound('tap');
          g[Math.floor(sel / n)][sel % n] = v;
          // move on to the next empty cell
          if (v) for (var s = 1; s <= n * n; s++) { var k = (sel + s) % (n * n); if (!g[Math.floor(k / n)][k % n]) { sel = k; break; } }
          render();
          checkDone();
        }

        function hint() {
          if (done) return;
          for (var k = 0; k < n * n; k++) {
            var r = Math.floor(k / n), c = k % n;
            if (g[r][c] !== pz.sol[r][c]) {
              g[r][c] = pz.sol[r][c];
              hints++;
              sel = k;
              ctx.setStatus('רמז: הוספנו מספר אחד נכון');
              render();
              checkDone();
              return;
            }
          }
        }

        function reveal() {
          if (done) return;
          g = pz.sol.map(function (row) { return row.slice(); });
          hints = 99;
          checkDone();
        }

        function checkDone() {
          for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (g[r][c] !== pz.sol[r][c]) {
            var full = g.every(function (row) { return row.every(function (v) { return v; }); });
            if (full) ctx.setStatus('הלוח מלא, אבל משהו לא מסתדר. בדקו שורות, טורים וכלובים');
            return;
          }
          done = true;
          var ok = hints <= 1;
          if (ok) solved++;
          grid.classList.add('mc-done');
          render();
          ctx.setStatus(hints === 99 ? 'זה הפתרון' : ok ? 'מצוין! הלוח פתור' : 'הלוח פתור, בעזרת רמזים');
          ctx.feedback(ok, hints === 99 ? 'הנה הפתרון' : ok ? undefined : 'בפעם הבאה נסו עם רמז אחד לכל היותר').then(function () {
            actions.innerHTML = '';
            var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { next.disabled = true; nextRound(); } },
              round >= ROUNDS ? 'לסיכום' : 'ללוח הבא');
            actions.appendChild(next);
          });
        }
      }

      nextRound();
    }
  });
})();
