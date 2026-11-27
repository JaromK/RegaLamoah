/* כלובי חשבון — fill the grid: every number once in each row and column, and every cage reaches its
   target with its operation (logic, arithmetic). Untimed. Each puzzle has exactly one solution. */
(function () {
  'use strict';

  var PLUS = '+', MINUS = '−', TIMES = '×', DIV = '÷';

  /* Per level (1–50): n × n grid (at most 5 × 5 so cells stay big), operations, largest cage,
     given = cells filled in at the start, single = cages of one cell allowed (they are free hints),
     big = mostly cages of 3 or more cells, hide = share of cages whose sign is hidden ("12?": any of the
     four operations may be meant, and the solver checks the puzzle still has one solution that way). */
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
    { n: 5, ops: '-x/', max: 4, given: 0, big: true },     // 30: mostly 3–4 cell cages
    // 31–50: cages of up to 5 cells, then more and more cages with a hidden sign (all of them at 50)
    { n: 5, ops: '-x/', max: 5, given: 0, big: true }, // 31
    { n: 5, ops: '-x/', max: 5, given: 0, big: true }, // 32
    { n: 5, ops: '-x/', max: 5, given: 0, big: true, hide: 0.15 }, // 33
    { n: 5, ops: '-x/', max: 5, given: 0, big: true, hide: 0.2 }, // 34
    { n: 5, ops: '-x/', max: 5, given: 0, big: true, hide: 0.25 }, // 35
    { n: 5, ops: '-x/', max: 5, given: 0, big: true, hide: 0.3 }, // 36
    { n: 5, ops: '-x/', max: 5, given: 0, big: true, hide: 0.35 }, // 37
    { n: 5, ops: '-x/', max: 5, given: 0, big: true, hide: 0.4 }, // 38
    { n: 5, ops: '-x/', max: 5, given: 0, big: true, hide: 0.45 }, // 39
    { n: 5, ops: '-x/', max: 5, given: 0, big: true, hide: 0.5 }, // 40
    { n: 5, ops: '-x/', max: 5, given: 0, big: true, hide: 0.55 }, // 41
    { n: 5, ops: '-x/', max: 5, given: 0, big: true, hide: 0.6 }, // 42
    { n: 5, ops: '-x/', max: 5, given: 0, big: true, hide: 0.65 }, // 43
    { n: 5, ops: '-x/', max: 5, given: 0, big: true, hide: 0.7 }, // 44
    { n: 5, ops: '-x/', max: 5, given: 0, big: true, hide: 0.75 }, // 45
    { n: 5, ops: '-x/', max: 5, given: 0, big: true, hide: 0.8 }, // 46
    { n: 5, ops: '-x/', max: 5, given: 0, big: true, hide: 0.85 }, // 47
    { n: 5, ops: '-x/', max: 5, given: 0, big: true, hide: 0.9 }, // 48
    { n: 5, ops: '-x/', max: 5, given: 0, big: true, hide: 0.95 }, // 49
    { n: 5, ops: '-x/', max: 5, given: 0, big: true, hide: 1 } // 50
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
      if (spec.hide && cg.op && rnd.randInt(1, 100) <= spec.hide * 100) cg.hidden = true;
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

  // the operations a hidden-sign cage of k cells may mean
  function hiddenOps(k) { return k === 2 ? [PLUS, MINUS, TIMES, DIV] : [PLUS, TIMES]; }
  function reaches(vals, op, target) {
    if (op === DIV) { var a = Math.max(vals[0], vals[1]), b = Math.min(vals[0], vals[1]); if (a % b) return false; }
    return calc(vals, op) === target;
  }

  // can the cage still reach its target, given the values placed so far (0 = empty)?
  function cageOk(cg, vals) {
    if (cg.hidden) {
      var ops = hiddenOps(vals.length);
      if (vals.every(function (v) { return v; })) return ops.some(function (op) { return reaches(vals, op, cg.target); });
      if (vals.length === 2) return true;
      return cageOk({ op: PLUS, target: cg.target }, vals) || cageOk({ op: TIMES, target: cg.target }, vals);
    }
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
    '.mc-grid{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));grid-template-rows:repeat(var(--n),minmax(0,1fr));width:min(100%,calc(var(--n) * 4.2rem),max(calc(100svh - 21rem), 82vw));',
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
    '.mc-cell.is-focus{box-shadow:inset 0 0 0 4px var(--c-purple);}',
    '.mc-cell.is-bad{box-shadow:inset 0 0 0 4px var(--c-red);}',
    '.mc-tip{margin:0;max-width:30rem;font-size:1.05rem;font-weight:700;line-height:1.35;text-align:center;background:var(--c-purple-soft);',
    'border:2px solid var(--c-purple);border-radius:var(--radius-sm);padding:.4rem .7rem;}',
    '.mc-cell.is-clash{color:var(--bad);}',
    '.mc-lab{position:absolute;top:2px;right:4px;font-family:var(--font-body);font-size:clamp(.75rem,3.2vw,.95rem);font-weight:800;',
    'color:var(--logic);line-height:1;direction:ltr;}',
    '.mc-done .mc-cell{background:var(--good-soft);}',
    '.mc-pad{display:grid;grid-template-columns:repeat(var(--k),minmax(0,1fr));gap:.45rem;width:100%;max-width:24rem;}',
    '.mc-pad .g-choice{min-height:3.5rem;font-size:1.6rem;padding:.2rem;}',
    '.mc-actions{flex-wrap:nowrap;gap:.3rem;width:100%;max-width:26rem;}.mc-actions .btn{flex:1 1 auto;min-width:0;padding-inline:.45rem;font-size:.95rem;white-space:nowrap;}'
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
      'כשהלוח מלא ונכון, הוא נצבע בירוק. אין שעון.',
      'ברמות הגבוהות יש כלובים עם סימן שאלה, למשל "6?": הסימן מוסתר, ואחת מארבע הפעולות נותנת את התוצאה.'
    ],
    css: css,
    _model: { makePuzzle: makePuzzle, countSolutions: countSolutions, calc: calc, cageOk: cageOk, LEVELS: LEVELS },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var ROUNDS = spec.n <= 3 ? 4 : 3;
      var move = null; // the arrow keys, for the board on show
      ctx.arrows(function (dx, dy) { if (move) move(dx, dy); });
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
        var sel = -1, done = false, hints = 0, focus = null; // focus = the hinted cell { k, step, bad }

        var labelAt = {};
        pz.cages.forEach(function (cg) {
          // label in the cage's top-right cell (rtl: the smallest row, then the smallest column = rightmost)
          var first = cg.cells.slice().sort(function (a, b) { return Math.floor(a / n) - Math.floor(b / n) || (a % n) - (b % n); })[0];
          labelAt[first] = cg.hidden ? cg.target + '?' : cg.op ? cg.target + cg.op : String(cg.target);
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
        var showBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: reveal }, 'פתרון');
        var undoBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: undo }, '↶ בטלו');
        var clearBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: clearAll }, 'נקו הכול');
        var actions = el('div', { class: 'g-actions mc-actions' }, [hintBtn, undoBtn, clearBtn, showBtn]);
        var past = []; // earlier boards, for "בטלו"
        var tip = el('p', { class: 'mc-tip', 'aria-live': 'polite', hidden: true });
        root.appendChild(grid);
        root.appendChild(tip);
        root.appendChild(pad);
        root.appendChild(actions);
        ctx.setStatus('לחצו על משבצת ריקה, ואז על מספר');
        sel = -1; // the player picks where to start
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
            b.classList.toggle('is-focus', !!focus && focus.k === k && !done);
            b.classList.toggle('is-bad', !!focus && !!focus.bad && focus.k === k && !done);
            b.disabled = done;
          });
          [].forEach.call(pad.children, function (b) { b.disabled = done || sel < 0; });
          hintBtn.disabled = showBtn.disabled = done;
          undoBtn.disabled = done || !past.length;
          clearBtn.disabled = done || !anyPlayed();
        }
        function anyPlayed() {
          for (var k = 0; k < n * n; k++) if (g[Math.floor(k / n)][k % n] && !pz.fixed[Math.floor(k / n)][k % n]) return true;
          return false;
        }
        function snapshot() { past.push(g.map(function (row) { return row.slice(); })); }
        function undo() {
          if (done || !past.length) return;
          ctx.sound('tap');
          g = past.pop();
          if (focus && !focus.bad && val(focus.k)) { focus = null; tip.hidden = true; }
          ctx.setStatus('הצעד האחרון בוטל');
          render();
        }
        // every number the player wrote goes; the numbers given at the start stay
        function clearAll() {
          if (done || !anyPlayed()) return;
          ctx.sound('tap');
          snapshot();
          g = g.map(function (row, r) { return row.map(function (v, c) { return pz.fixed[r][c] ? v : 0; }); });
          focus = null; tip.hidden = true;
          ctx.setStatus('הלוח נוקה. אפשר להתחיל מחדש (או "בטלו")');
          render();
        }

        // the arrow keys move the picked square (skipping squares that cannot be picked)
        function stepTo(r0, c0, dr, dc, R, Cn, ok) {
          var r = r0, c = c0;
          for (var k = 0; k < Math.max(R, Cn); k++) { r += dr; c += dc; if (r < 0 || c < 0 || r >= R || c >= Cn) return -1; if (ok(r, c)) return r * Cn + c; }
          return -1;
        }
        move = function (dx, dy) {
          if (done) return;
          var free = function (r, c) { return !pz.fixed[r][c]; };
          if (sel < 0) { for (var q = 0; q < n * n; q++) if (free(Math.floor(q / n), q % n)) { sel = q; break; } render(); return; }
          var to = stepTo(Math.floor(sel / n), sel % n, dy, -dx, n, n, free); // the board reads right to left
          if (to >= 0) { sel = to; render(); }
        };
        function select(k) {
          if (done || pz.fixed[Math.floor(k / n)][k % n]) return;
          ctx.sound('tap');
          sel = k;
          render();
        }

        function put(v) {
          if (done || sel < 0) return;
          ctx.sound('tap');
          if (focus && focus.k === sel) { focus = null; tip.hidden = true; }
          if (g[Math.floor(sel / n)][sel % n] === v) return;
          snapshot();
          g[Math.floor(sel / n)][sel % n] = v;
          // the same cell stays picked: the player chooses where to go next
          render();
          checkDone();
        }

        /* ---------- hints that teach: point at one cell and explain how to work it out, never fill it in ---------- */
        function val(k) { return g[Math.floor(k / n)][k % n]; }
        function right(k) { return val(k) && val(k) === pz.sol[Math.floor(k / n)][k % n]; }
        // numbers still missing from k's row and column (only correct numbers count)
        function lineOpts(k) {
          var r = Math.floor(k / n), c = k % n, out = [];
          for (var d = 1; d <= n; d++) {
            var used = false;
            for (var i = 0; i < n; i++) if ((i !== c && right(r * n + i) && val(r * n + i) === d) || (i !== r && right(i * n + c) && val(i * n + c) === d)) used = true;
            if (!used) out.push(d);
          }
          return out;
        }
        // numbers k can take so that its cage can still reach its target
        function cageOpts(k) {
          var cg = pz.cages[pz.owner[k]], cs = cg.cells, out = {};
          var opts = cs.map(function (x) { return x === k ? lineOpts(x) : right(x) ? [val(x)] : lineOpts(x); });
          var cur = [];
          (function walk(i) {
            if (i === cs.length) { if (cageOk(cg, cur)) out[cur[cs.indexOf(k)]] = true; return; }
            opts[i].forEach(function (d) {
              // no number twice in a row or column inside the cage
              for (var j = 0; j < i; j++) if (cur[j] === d && (Math.floor(cs[j] / n) === Math.floor(cs[i] / n) || cs[j] % n === cs[i] % n)) return;
              cur[i] = d; walk(i + 1);
            });
          })(0);
          return Object.keys(out).map(Number).sort(function (a, b) { return a - b; });
        }
        function cageLabel(k) {
          var cg = pz.cages[pz.owner[k]];
          return cg.hidden ? cg.target + '?' : cg.op ? cg.target + cg.op : String(cg.target);
        }
        function listOrAsk(name, list) { return list.length === 1 ? name + ' מתאים רק מספר אחד. איזה?' : name + ' אפשר: ' + list.join(', '); }
        function hint() {
          if (done) return;
          // 1. a wrong number comes first: mark it, without saying what is right
          for (var b = 0; b < n * n; b++) if (val(b) && !right(b)) {
            hints++;
            focus = { k: b, step: 1, bad: true }; sel = b;
            var br = Math.floor(b / n), bc = b % n;
            showTip('המספר ' + val(b) + ' במשבצת המסומנת באדום לא מתאים. ' +
              (clash(br, bc) ? 'הוא כבר מופיע באותה שורה או באותו טור.' : 'בדקו שוב את החשבון של הכלוב שלה (' + cageLabel(b) + ').') + ' מחקו אותו (⌫) ונסו מספר אחר.');
            render(); return;
          }
          // 2. pressing again on the same cell: what fits the row and column, and what fits the cage
          if (focus && !focus.bad && !val(focus.k) && focus.step === 1) {
            hints++;
            focus.step = 2;
            var lo2 = lineOpts(focus.k), co2 = cageOpts(focus.k);
            showTip(lo2.length === 1 || co2.length === 1
              ? (co2.length === 1 ? listOrAsk('לכלוב ' + cageLabel(focus.k), co2) : listOrAsk('לשורה ולטור', lo2))
              : listOrAsk('לפי השורה והטור', lo2) + '. ' + listOrAsk('לפי הכלוב ' + cageLabel(focus.k), co2) + '. איזה מספר מתאים לשניהם?');
            render(); return;
          }
          // 3. a new cell: the empty cell with the fewest possible numbers
          var bestK = -1, bestN = 99;
          for (var k = 0; k < n * n; k++) {
            if (val(k)) continue;
            var lo = lineOpts(k), co = cageOpts(k);
            var both = lo.filter(function (d) { return co.indexOf(d) !== -1; }).length;
            if (both < bestN) { bestN = both; bestK = k; }
          }
          if (bestK < 0) return;
          hints++;
          focus = { k: bestK, step: 1 }; sel = bestK;
          var r = Math.floor(bestK / n), c = bestK % n, emptyRow = 0, emptyCol = 0;
          for (var i = 0; i < n; i++) { if (!right(r * n + i)) emptyRow++; if (!right(i * n + c)) emptyCol++; }
          var cg = pz.cages[pz.owner[bestK]];
          var emptyCage = cg.cells.filter(function (x) { return !right(x); }).length;
          var text;
          if (cg.cells.length === 1) {
            text = 'נסו את המשבצת המסומנת: היא כלוב של משבצת אחת. במשבצת כזאת כותבים בדיוק את המספר של הכלוב.';
          } else if (emptyRow === 1 || emptyCol === 1) {
            text = 'נסו את המשבצת המסומנת: ' + (emptyRow === 1 ? 'בשורה' : 'בטור') + ' שלה חסר רק מספר אחד. איזה מספר מ-1 עד ' + n + ' עוד לא כתוב שם?';
          } else if (emptyCage === 1 && cg.cells.length > 1) {
            text = 'נסו את המשבצת המסומנת: בכלוב שלה (' + cageLabel(bestK) + ') חסר רק מספר אחד. חשבו איזה מספר משלים את החשבון.';
          } else {
            text = 'נסו את המשבצת המסומנת. חשבו אילו מספרים מתאימים לכלוב שלה (' + cageLabel(bestK) + '), ואילו עוד חסרים בשורה ובטור שלה.' +
              ' (לחיצה נוספת על "רמז" תראה את האפשרויות)';
          }
          showTip(text);
          render();
        }
        function showTip(t) { tip.textContent = t; tip.hidden = false; ctx.setStatus('רמז'); }

        function reveal() {
          if (done) return;
          g = pz.sol.map(function (row) { return row.slice(); });
          hints = 99; focus = null; tip.hidden = true;
          checkDone();
        }

        function checkDone() {
          for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (g[r][c] !== pz.sol[r][c]) {
            var full = g.every(function (row) { return row.every(function (v) { return v; }); });
            if (full) ctx.setStatus('הלוח מלא, אבל משהו לא מסתדר. בדקו שורות, טורים וכלובים');
            return;
          }
          done = true;
          var ok = hints <= 2; // one cell explained twice still counts as solved alone
          focus = null; tip.hidden = true;
          if (ok) solved++;
          grid.classList.add('mc-done');
          render();
          ctx.setStatus(hints === 99 ? 'זה הפתרון' : ok ? 'מצוין! הלוח פתור' : 'הלוח פתור, בעזרת רמזים');
          ctx.feedback(ok, hints === 99 ? 'הנה הפתרון' : ok ? undefined : 'בפעם הבאה נסו עם פחות רמזים').then(function () {
            actions.innerHTML = '';
            if (hints !== 99) { ctx.wait(600).then(nextRound); return; } // a correct answer moves on by itself
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
