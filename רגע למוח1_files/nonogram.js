/* ציור נסתר — a small nonogram: colour the cells by the number clues to reveal a picture (logic). Untimed.
   Row clues are on the right and read right to left; column clues read top to bottom.
   Every puzzle is checked to be solvable line by line, without guessing. */
(function () {
  'use strict';

  /* Per level (1–30): rows × cols (at most 6 × 5 so cells stay about 52px on a phone), share of filled
     cells, the fewest solving passes (how many times all lines must be revisited: more = harder),
     autoX = finished lines get their empty cells crossed automatically (a help for the early levels). */
  var LEVELS = [
    { r: 3, c: 3, fill: 0.6, passes: 1, autoX: true },   // 1
    { r: 3, c: 3, fill: 0.55, passes: 1, autoX: true },  // 2
    { r: 4, c: 4, fill: 0.6, passes: 1, autoX: true },   // 3
    { r: 4, c: 4, fill: 0.55, passes: 2, autoX: true },  // 4
    { r: 4, c: 4, fill: 0.5, passes: 2, autoX: true },   // 5
    { r: 5, c: 4, fill: 0.55, passes: 2, autoX: true },  // 6
    { r: 5, c: 5, fill: 0.6, passes: 2, autoX: true },   // 7
    { r: 5, c: 5, fill: 0.55, passes: 2, autoX: true },  // 8
    { r: 5, c: 5, fill: 0.5, passes: 3, autoX: true },   // 9
    { r: 5, c: 5, fill: 0.5, passes: 3 },                // 10
    { r: 6, c: 5, fill: 0.55, passes: 2 },               // 11
    { r: 6, c: 5, fill: 0.5, passes: 3 },                // 12
    { r: 6, c: 5, fill: 0.5, passes: 3 },                // 13
    { r: 6, c: 5, fill: 0.55, passes: 3 },               // 14
    { r: 6, c: 5, fill: 0.5, passes: 3 },                // 15
    { r: 6, c: 5, fill: 0.5, passes: 4 },                // 16
    { r: 6, c: 5, fill: 0.48, passes: 4 },               // 17
    { r: 6, c: 5, fill: 0.48, passes: 4 },               // 18
    { r: 6, c: 5, fill: 0.46, passes: 5 },               // 19
    { r: 6, c: 5, fill: 0.46, passes: 5 },               // 20
    { r: 6, c: 5, fill: 0.45, passes: 5 },               // 21
    { r: 6, c: 5, fill: 0.45, passes: 6 },               // 22
    { r: 6, c: 5, fill: 0.44, passes: 6 },               // 23
    { r: 6, c: 5, fill: 0.44, passes: 6 },               // 24
    { r: 6, c: 5, fill: 0.43, passes: 7 },               // 25
    { r: 6, c: 5, fill: 0.43, passes: 7 },               // 26
    { r: 6, c: 5, fill: 0.42, passes: 7 },               // 27
    { r: 6, c: 5, fill: 0.42, passes: 7 },               // 28
    { r: 6, c: 5, fill: 0.4, passes: 7 },                // 29
    { r: 6, c: 5, fill: 0.4, passes: 7 }                 // 30
  ];

  /* ---------- pure model ---------- */
  function runs(line) {
    var out = [], k = 0;
    line.forEach(function (v) { if (v) k++; else if (k) { out.push(k); k = 0; } });
    if (k) out.push(k);
    return out.length ? out : [0];
  }
  // all ways to place the runs in a line of length n
  function placements(clue, n) {
    if (clue.length === 1 && clue[0] === 0) { var z = []; for (var i = 0; i < n; i++) z.push(0); return [z]; }
    var out = [];
    (function rec(idx, pos, acc) {
      if (idx === clue.length) { var a = acc.slice(); while (a.length < n) a.push(0); out.push(a); return; }
      var len = clue[idx];
      var rest = 0;
      for (var j = idx + 1; j < clue.length; j++) rest += clue[j] + 1;
      for (var s = pos; s + len + rest <= n; s++) {
        var a2 = acc.slice();
        while (a2.length < s) a2.push(0);
        for (var t = 0; t < len; t++) a2.push(1);
        if (idx < clue.length - 1) a2.push(0);
        rec(idx + 1, a2.length, a2);
      }
    })(0, 0, []);
    return out;
  }
  // line-by-line solving; returns { solved, passes }
  function solve(rowClues, colClues, R, C) {
    var g = [];
    for (var r = 0; r < R; r++) { g.push([]); for (var c = 0; c < C; c++) g[r].push(-1); }
    var rowP = rowClues.map(function (cl) { return placements(cl, C); });
    var colP = colClues.map(function (cl) { return placements(cl, R); });
    function apply(cands, get, set, n) {
      var known = [];
      for (var i = 0; i < n; i++) known.push(get(i));
      var ok = cands.filter(function (p) { for (var i = 0; i < n; i++) if (known[i] !== -1 && known[i] !== p[i]) return false; return true; });
      var changed = false;
      if (!ok.length) return { ok: [], changed: false, bad: true };
      for (var j = 0; j < n; j++) {
        if (known[j] !== -1) continue;
        var v = ok[0][j];
        if (ok.every(function (p) { return p[j] === v; })) { set(j, v); changed = true; }
      }
      return { ok: ok, changed: changed };
    }
    var passes = 0, changed = true;
    while (changed && passes < 30) {
      changed = false; passes++;
      for (var rr = 0; rr < R; rr++) {
        var res = apply(rowP[rr], function (i) { return g[rr][i]; }, function (i, v) { g[rr][i] = v; }, C);
        if (res.bad) return { solved: false, passes: passes };
        rowP[rr] = res.ok; changed = changed || res.changed;
      }
      for (var cc = 0; cc < C; cc++) {
        var res2 = apply(colP[cc], function (i) { return g[i][cc]; }, function (i, v) { g[i][cc] = v; }, R);
        if (res2.bad) return { solved: false, passes: passes };
        colP[cc] = res2.ok; changed = changed || res2.changed;
      }
    }
    var solved = g.every(function (row) { return row.every(function (v) { return v !== -1; }); });
    return { solved: solved, passes: passes - 1 };
  }

  // The grid is drawn right to left (column 0 is the rightmost), so a row's clue read right to left
  // is simply runs(row): the run nearest the right edge comes first.
  function rowClue(row) { return runs(row); }
  function colClue(grid, c) { return runs(grid.map(function (row) { return row[c]; })); }

  function makePuzzle(spec, rnd) {
    var best = null;
    for (var attempt = 0; attempt < 3000; attempt++) {
      var grid = [];
      for (var r = 0; r < spec.r; r++) {
        grid.push([]);
        for (var c = 0; c < spec.c; c++) grid[r].push(rnd() < spec.fill ? 1 : 0);
      }
      var filled = grid.reduce(function (s, row) { return s + row.reduce(function (a, b) { return a + b; }, 0); }, 0);
      if (filled < 2) continue;
      var rc = grid.map(function (row) { return runs(row); });     // solver works left to right
      var cc = [];
      for (var k = 0; k < spec.c; k++) cc.push(colClue(grid, k));
      var res = solve(rc, cc, spec.r, spec.c);
      if (!res.solved) continue;
      var pz = { grid: grid, passes: res.passes };
      if (res.passes >= spec.passes) return pz;
      if (!best || res.passes > best.passes) best = pz;
    }
    return best;
  }

  var css = [
    '.ng-wrap{display:grid;grid-template-columns:auto auto;gap:.3rem;direction:rtl;align-items:end;justify-content:center;}',
    '.ng-corner{grid-column:1;grid-row:1;}',
    '.ng-colclues{grid-column:2;grid-row:1;display:grid;grid-template-columns:repeat(var(--c),var(--ng));gap:3px;direction:rtl;align-items:end;}',
    '.ng-cc{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;font-weight:800;font-size:1.05rem;line-height:1.15;',
    'font-variant-numeric:tabular-nums;color:var(--logic);}',
    '.ng-grid{grid-column:2;grid-row:2;display:grid;grid-template-columns:repeat(var(--c),var(--ng));gap:3px;direction:rtl;}',
    '.ng-rowclues{grid-column:1;grid-row:2;display:grid;grid-auto-rows:var(--ng);gap:3px;}',
    '.ng-rc{display:flex;align-items:center;justify-content:flex-end;gap:.35rem;padding-inline-end:.3rem;font-weight:800;font-size:1.05rem;',
    'font-variant-numeric:tabular-nums;color:var(--logic);white-space:nowrap;}',
    '.ng-cell{width:var(--ng);height:var(--ng);padding:0;border-radius:6px;border:2px solid var(--line);background:var(--surface);',
    'cursor:pointer;font-size:1.3rem;font-weight:900;color:var(--ink-soft);display:grid;place-items:center;position:relative;}',
    '.ng-cell.is-on{background:var(--ink);border-color:var(--ink);}',
    '.ng-cell.is-x::after{content:"";position:absolute;inset:24%;',
    'background:linear-gradient(45deg,transparent calc(50% - 1.5px),var(--ink-soft) calc(50% - 1.5px),var(--ink-soft) calc(50% + 1.5px),transparent calc(50% + 1.5px)),',
    'linear-gradient(-45deg,transparent calc(50% - 1.5px),var(--ink-soft) calc(50% - 1.5px),var(--ink-soft) calc(50% + 1.5px),transparent calc(50% + 1.5px));}',
    '.ng-cell:disabled{cursor:default;}',
    '.ng-done .ng-cell.is-on{background:var(--good);border-color:var(--good);}',
    '.ng-done .ng-cell.is-x::after{content:"";}',
    '.ng-line-ok{opacity:.45;}',
    '.ng-hint{margin:0;font-size:1.05rem;color:var(--ink-soft);text-align:center;}'
  ].join('');

  BrainGames.register({
    id: 'nonogram',
    name: 'ציור נסתר',
    skill: 'logic',
    tagline: 'צבעו משבצות לפי המספרים וגלו ציור',
    benefit: 'חשיבה לוגית שלב אחרי שלב',
    instructions: [
      'המספרים מימין לכל שורה ומעל כל טור אומרים כמה משבצות צבועות ברצף יש שם, לפי הסדר.',
      'למשל "2 1": קודם שתי משבצות צבועות צמודות, אחר כך לפחות משבצת ריקה, ואז עוד אחת.',
      'לחיצה צובעת משבצת, לחיצה שנייה מסמנת ✗ (בטוח ריקה), ושלישית מנקה.',
      'כשכל המשבצות הנכונות צבועות, הציור מתגלה. אין שעון.'
    ],
    css: css,
    _model: { runs: runs, solve: solve, makePuzzle: makePuzzle, LEVELS: LEVELS },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var ROUNDS = level <= 9 ? 4 : 3;
      var round = 0, solved = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: solved, total: ROUNDS, note: 'גיליתם ' + solved + ' מתוך ' + ROUNDS + ' ציורים' });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        play(makePuzzle(spec, Math.random));
      }

      function play(pz) {
        root.innerHTML = '';
        var R = spec.r, C = spec.c, grid = pz.grid;
        var state = grid.map(function (row) { return row.map(function () { return 0; }); }); // 0 empty, 1 on, 2 x
        var done = false, hints = 0;
        var cellPx = 'min(3.4rem, calc((100vw - 7.5rem) / ' + C + '), calc((100svh - 22rem) / ' + (R + 1.6) + '))';

        var colClues = [], rowClues = [], cellBtns = [];
        for (var c = 0; c < C; c++) {
          colClues.push(el('div', { class: 'ng-cc' }, colClue(grid, c).map(function (n) { return el('span', null, String(n)); })));
        }
        var cells = [];
        for (var r = 0; r < R; r++) {
          cellBtns.push([]);
          for (c = 0; c < C; c++) {
            (function (r, c) {
              var b = el('button', { class: 'ng-cell', type: 'button', 'aria-label': 'שורה ' + (r + 1) + ', טור ' + (c + 1), onclick: function () { tap(r, c); } });
              cellBtns[r].push(b);
              cells.push(b);
            })(r, c);
          }
          rowClues.push(el('div', { class: 'ng-rc' }, rowClue(grid[r]).map(function (n) { return el('span', null, String(n)); })));
        }
        // grid is drawn right to left (dir: rtl), so column 0 is the rightmost; rows read the same way
        var wrap = el('div', { class: 'ng-wrap', style: { '--c': C, '--ng': cellPx } }, [
          el('div', { class: 'ng-corner' }),
          el('div', { class: 'ng-colclues' }, colClues),
          el('div', { class: 'ng-rowclues' }, rowClues),
          el('div', { class: 'ng-grid' }, cells)
        ]);
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var clearBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: clearAll }, 'ניקוי');
        var showBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: reveal }, 'הראו את הציור');
        var actions = el('div', { class: 'g-actions' }, [hintBtn, clearBtn, showBtn]);
        root.appendChild(wrap);
        root.appendChild(actions);
        ctx.setStatus('צבעו את המשבצות לפי המספרים');
        render();

        // the grid buttons are in DOM order r, c (c = 0 rightmost in rtl): grid[r][c] uses the same c
        function lineOk(arr, clue) { return runs(arr).join() === clue.join(); }

        function render() {
          for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) {
            var b = cellBtns[r][c];
            b.classList.toggle('is-on', state[r][c] === 1);
            b.classList.toggle('is-x', state[r][c] === 2);
            b.disabled = done;
          }
          // dim the clues of lines that are already right
          for (r = 0; r < R; r++) {
            var on = state[r].map(function (v) { return v === 1 ? 1 : 0; });
            rowClues[r].classList.toggle('ng-line-ok', lineOk(on, runs(grid[r])));
          }
          for (var c2 = 0; c2 < C; c2++) {
            var col = state.map(function (row) { return row[c2] === 1 ? 1 : 0; });
            colClues[c2].classList.toggle('ng-line-ok', lineOk(col, colClue(grid, c2)));
          }
        }

        function autoCross() {
          if (!spec.autoX) return;
          for (var r = 0; r < R; r++) {
            var on = state[r].map(function (v) { return v === 1 ? 1 : 0; });
            if (lineOk(on, runs(grid[r]))) for (var c = 0; c < C; c++) if (state[r][c] === 0) state[r][c] = 2;
          }
          for (var c2 = 0; c2 < C; c2++) {
            var col = state.map(function (row) { return row[c2] === 1 ? 1 : 0; });
            if (lineOk(col, colClue(grid, c2))) for (var r2 = 0; r2 < R; r2++) if (state[r2][c2] === 0) state[r2][c2] = 2;
          }
        }

        function tap(r, c) {
          if (done) return;
          ctx.sound('tap');
          state[r][c] = (state[r][c] + 1) % 3;
          if (state[r][c] === 1) autoCross();
          render();
          checkDone();
        }

        function clearAll() {
          if (done) return;
          state.forEach(function (row) { for (var c = 0; c < C; c++) row[c] = 0; });
          render();
        }

        // Hint: fix one cell that is wrong or still open (a filled one first).
        function hint() {
          if (done) return;
          var pick = null;
          for (var r = 0; r < R && !pick; r++) for (var c = 0; c < C && !pick; c++) {
            if (grid[r][c] === 1 && state[r][c] !== 1) pick = [r, c];
          }
          for (r = 0; r < R && !pick; r++) for (c = 0; c < C && !pick; c++) {
            if (grid[r][c] === 0 && state[r][c] === 1) pick = [r, c];
          }
          if (!pick) return;
          hints++;
          state[pick[0]][pick[1]] = grid[pick[0]][pick[1]] ? 1 : 2;
          ctx.setStatus('רמז: שורה ' + (pick[0] + 1) + ', טור ' + (pick[1] + 1) + ' מימין');
          render();
          checkDone();
        }

        // Stuck: show the picture (the round does not count as solved).
        function reveal() {
          if (done) return;
          for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) state[r][c] = grid[r][c] ? 1 : 0;
          hints = 99;
          checkDone();
        }

        function checkDone() {
          for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) if ((state[r][c] === 1) !== (grid[r][c] === 1)) return;
          done = true;
          if (hints <= 1) solved++;
          wrap.classList.add('ng-done');
          for (r = 0; r < R; r++) for (c = 0; c < C; c++) if (state[r][c] === 2) state[r][c] = 0;
          render();
          ctx.setStatus(hints === 99 ? 'זה הציור' : hints > 1 ? 'הציור התגלה, בעזרת רמזים' : 'מצוין! גיליתם את הציור');
          ctx.feedback(hints <= 1, hints === 99 ? 'הנה הציור' : hints > 1 ? 'בפעם הבאה נסו עם רמז אחד לכל היותר' : undefined).then(function () {
            actions.innerHTML = '';
            var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { next.disabled = true; nextRound(); } },
              round >= ROUNDS ? 'לסיכום' : 'לציור הבא');
            actions.appendChild(next);
          });
        }
      }

      nextRound();
    }
  });
})();
