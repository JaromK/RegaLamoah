/* שני צבעים — fill the grid with red ● and blue ■: never three of the same colour in a row (across or down), and
   every row and column has as many red as blue. Every puzzle has exactly one solution. Logic. Untimed. */
(function () {
  'use strict';

  /* Level 1–50: n = grid side, keep = share of squares given at the start. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    if (L <= 6) return { n: 4, keep: 0.5 - (L - 1) * 0.03 };
    if (L <= 12) return { n: 6, keep: 0.55 - (L - 7) * 0.03 };
    if (L <= 25) return { n: 6, keep: 0.4 - (L - 13) * 0.012 };
    if (L <= 30) return { n: 8, keep: 0.48 - (L - 26) * 0.012 };
    // 31–50 harder (user request): fewer squares at the start, and boards that the three obvious rules alone would
    // finish are mostly thrown away (hard = share of boards that need more than those rules)
    if (L <= 35) return { n: 8, keep: 0.28 - (L - 31) * 0.01, hard: 0.6 };
    if (L <= 40) return { n: 8, keep: 0.23 - (L - 36) * 0.008, hard: 0.8 };
    return { n: 8, keep: 0.19 - (L - 41) * 0.003, hard: 1 };
  }

  // can value v go at (r, c) of grid g (0 empty, 1 red, 2 blue) without breaking a rule?
  function fits(g, n, r, c, v) {
    var row = g[r], k;
    if (c >= 2 && row[c - 1] === v && row[c - 2] === v) return false;
    if (c >= 1 && c + 1 < n && row[c - 1] === v && row[c + 1] === v) return false;
    if (c + 2 < n && row[c + 1] === v && row[c + 2] === v) return false;
    if (r >= 2 && g[r - 1][c] === v && g[r - 2][c] === v) return false;
    if (r >= 1 && r + 1 < n && g[r - 1][c] === v && g[r + 1][c] === v) return false;
    if (r + 2 < n && g[r + 1][c] === v && g[r + 2][c] === v) return false;
    var inRow = 0, inCol = 0;
    for (k = 0; k < n; k++) { if (row[k] === v) inRow++; if (g[k][c] === v) inCol++; }
    return inRow < n / 2 && inCol < n / 2;
  }
  // number of solutions (stops at `limit`)
  function count(g, n, limit) {
    var found = 0;
    (function go(i) {
      if (found >= limit) return;
      while (i < n * n && g[Math.floor(i / n)][i % n]) i++;
      if (i === n * n) { found++; return; }
      var r = Math.floor(i / n), c = i % n;
      for (var v = 1; v <= 2; v++) if (fits(g, n, r, c, v)) { g[r][c] = v; go(i + 1); g[r][c] = 0; }
    })(0);
    return found;
  }
  function empty(n) { return Array.apply(null, { length: n }).map(function () { return Array.apply(null, { length: n }).map(function () { return 0; }); }); }
  /* Do the three obvious rules alone (two in a row, between two, half already there) fill the board? */
  function obvious(given, n) {
    var g = given.map(function (r) { return r.slice(); }), changed = true, lines = [];
    for (var i = 0; i < n; i++) {
      lines.push(Array.apply(null, { length: n }).map(function (_, j) { return [i, j]; }));
      lines.push(Array.apply(null, { length: n }).map(function (_, j) { return [j, i]; }));
    }
    while (changed) {
      changed = false;
      lines.forEach(function (L) {
        var v = L.map(function (p) { return g[p[0]][p[1]]; });
        for (var k = 0; k < n; k++) if (!v[k]) {
          for (var col = 1; col <= 2; col++) {
            if ((k >= 2 && v[k - 1] === col && v[k - 2] === col) || (k + 2 < n && v[k + 1] === col && v[k + 2] === col) ||
                (k >= 1 && k + 1 < n && v[k - 1] === col && v[k + 1] === col)) { g[L[k][0]][L[k][1]] = 3 - col; v[k] = 3 - col; changed = true; break; }
          }
        }
        for (var c2 = 1; c2 <= 2; c2++) if (v.filter(function (x) { return x === c2; }).length === n / 2) {
          L.forEach(function (p, k) { if (!v[k]) { g[p[0]][p[1]] = 3 - c2; v[k] = 3 - c2; changed = true; } });
        }
      });
    }
    return g.every(function (r) { return r.every(Boolean); });
  }
  function makePuzzle(sp, rnd) {
    var wantHard = rnd.randInt(1, 100) <= (sp.hard || 0) * 100;
    for (var tries = 0; tries < 40; tries++) {
      var P = makeOne(sp, rnd);
      if (P && (!wantHard || !obvious(P.given, P.n))) return P;
    }
    return makeOne(sp, rnd);
  }
  function makeOne(sp, rnd) {
    var n = sp.n, g = empty(n);
    // a random full grid
    var ok = (function go(i) {
      if (i === n * n) return true;
      var r = Math.floor(i / n), c = i % n;
      var vs = rnd.shuffle([1, 2]);
      for (var k = 0; k < 2; k++) if (fits(g, n, r, c, vs[k])) { g[r][c] = vs[k]; if (go(i + 1)) return true; g[r][c] = 0; }
      return false;
    })(0);
    if (!ok) return null;
    var sol = g.map(function (row) { return row.slice(); });
    // take squares away while the solution stays the only one, down to the level's share
    var cells = rnd.shuffle(Array.apply(null, { length: n * n }).map(function (_, i) { return i; }));
    var keepN = Math.max(2, Math.round(n * n * sp.keep));
    var left = n * n;
    for (var t = 0; t < cells.length && left > keepN; t++) {
      var r = Math.floor(cells[t] / n), c = cells[t] % n, v = g[r][c];
      g[r][c] = 0;
      if (count(g.map(function (row) { return row.slice(); }), n, 2) !== 1) g[r][c] = v; else left--;
    }
    return { n: n, sol: sol, given: g };
  }

  var css = [
    '.tc-grid{--n:6;display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:4px;width:min(100%,calc(100svh - 19rem),26rem);direction:ltr;}',
    '.tc-cell{aspect-ratio:1;min-width:0;border-radius:10px;border:2px solid var(--line);background:var(--surface);padding:0;cursor:pointer;',
    'display:grid;place-items:center;font-size:calc(min(100vw - 3rem,26rem) / var(--n) * .42);color:#fff;line-height:1;}',
    '.tc-cell.v1{background:var(--c-red);border-color:var(--c-red);}',
    '.tc-cell.v2{background:var(--c-blue);border-color:var(--c-blue);}',
    '.tc-cell.is-given{box-shadow:inset 0 0 0 3px rgba(0,0,0,.35);cursor:default;}',
    '.tc-cell.is-bad{outline:4px solid var(--c-yellow);outline-offset:-4px;}',
    '.tc-cell.is-tip{outline:5px solid var(--c-purple);outline-offset:1px;}',
    '.tc-cell.is-wrong{outline:5px dashed var(--c-black);outline-offset:-5px;}',
    '.tc-rule{margin:0;font-weight:700;font-size:1rem;text-align:center;max-width:26rem;line-height:1.35;}',
    '.tc-rule span{display:inline-block;width:1.1rem;height:1.1rem;border-radius:4px;vertical-align:-.15rem;color:#fff;font-size:.75rem;line-height:1.1rem;}',
    '.tc-acts{flex-wrap:nowrap;gap:.3rem;width:100%;max-width:26rem;}.tc-acts .btn{flex:1 1 auto;min-width:0;padding-inline:.4rem;font-size:.95rem;white-space:nowrap;}',
    '@media (min-width:900px){.g-split .tc-grid{width:min(calc(100svh - 12.5rem),36rem);flex:none;}.g-split .tc-cell{font-size:calc(min(100svh - 12.5rem,36rem) / var(--n) * .42);}}'
  ].join('');

  BrainGames.register({
    id: 'two-colors',
    name: 'שני צבעים',
    skill: 'logic',
    isNew: true,
    tagline: 'מלאו את הלוח באדום ובכחול לפי שני כללים',
    benefit: 'חשיבה לוגית וקשב לפרטים',
    instructions: [
      'מלאו כל משבצת באדום ● או בכחול ■. לחיצה על משבצת מחליפה: אדום, כחול, ריקה.',
      'כלל 1: אף פעם לא שלוש משבצות באותו צבע ברצף (לרוחב או לאורך).',
      'כלל 2: בכל שורה ובכל טור יש אותו מספר של אדומות ושל כחולות.',
      'שבירת כלל מסומנת בצהוב. יש "רמז", "↶ בטלו" ו"נקו". אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makePuzzle: makePuzzle, count: count, fits: fits, obvious: obvious },
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
        for (var t = 0; t < 20 && !P; t++) P = makePuzzle(sp, ctx);
        play(P);
      }

      function play(P) {
        root.innerHTML = '';
        root.__tc = P; // read by the automated tests
        var n = P.n, g = P.given.map(function (r) { return r.slice(); });
        var done = false, hints = 0, past = [], tip = null;
        var cells = [];
        for (var i = 0; i < n * n; i++) (function (i) {
          cells.push(el('button', { class: 'tc-cell', type: 'button', onclick: function () { tap(i); } }));
        })(i);
        var grid = el('div', { class: 'tc-grid', style: { '--n': n } }, cells);
        var rule = el('p', { class: 'tc-rule' }, ['לא שלוש באותו צבע ברצף, ובכל שורה וטור חצי ',
          el('span', { style: { background: 'var(--c-red)' } }, '●'), ' וחצי ', el('span', { style: { background: 'var(--c-blue)' } }, '■')]);
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var undoBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: undo }, '↶ בטלו');
        var clearBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: clearAll }, 'נקו');
        var acts = el('div', { class: 'g-actions tc-acts' }, [hintBtn, undoBtn, clearBtn]);
        root.classList.add('g-split');
        root.appendChild(grid);
        root.appendChild(el('div', { class: 'g-side' }, [rule, acts]));
        ctx.setStatus('לחצו על משבצת כדי לצבוע אותה');
        draw();

        function given(i) { return !!P.given[Math.floor(i / n)][i % n]; }
        // squares that break a rule now: three in a row, or more than half of one colour in a line
        function badSet() {
          var bad = {}, r, c, k;
          for (r = 0; r < n; r++) for (c = 0; c < n; c++) {
            var v = g[r][c]; if (!v) continue;
            if (c + 2 < n && g[r][c + 1] === v && g[r][c + 2] === v) { bad[r * n + c] = bad[r * n + c + 1] = bad[r * n + c + 2] = true; }
            if (r + 2 < n && g[r + 1][c] === v && g[r + 2][c] === v) { bad[r * n + c] = bad[(r + 1) * n + c] = bad[(r + 2) * n + c] = true; }
          }
          for (k = 0; k < n; k++) for (var v2 = 1; v2 <= 2; v2++) {
            var rowN = 0, colN = 0, rowFull = true, colFull = true;
            for (var j = 0; j < n; j++) { if (g[k][j] === v2) rowN++; if (g[j][k] === v2) colN++; if (!g[k][j]) rowFull = false; if (!g[j][k]) colFull = false; }
            // from level 41 too many of one colour shows only when the line is full (no free warning while guessing)
            if (level >= 41) { if (!rowFull) rowN = 0; if (!colFull) colN = 0; }
            if (rowN > n / 2) for (j = 0; j < n; j++) if (g[k][j] === v2) bad[k * n + j] = true;
            if (colN > n / 2) for (j = 0; j < n; j++) if (g[j][k] === v2) bad[j * n + k] = true;
          }
          return bad;
        }
        function draw() {
          var bad = badSet();
          cells.forEach(function (b, i) {
            var v = g[Math.floor(i / n)][i % n];
            b.className = 'tc-cell' + (v ? ' v' + v : '') + (given(i) ? ' is-given' : '') + (bad[i] ? ' is-bad' : '') +
              (tip && tip.i === i ? (tip.wrong ? ' is-wrong' : ' is-tip') : '');
            b.textContent = v === 1 ? '●' : v === 2 ? '■' : '';
            b.setAttribute('aria-label', (v === 1 ? 'אדום' : v === 2 ? 'כחול' : 'ריקה') + (given(i) ? ', נתונה' : ''));
            b.disabled = done;
          });
          undoBtn.disabled = done || !past.length;
          clearBtn.disabled = done || !cells.some(function (_, i) { return !given(i) && g[Math.floor(i / n)][i % n]; });
          hintBtn.disabled = done;
        }
        function snapshot() { past.push(JSON.stringify(g)); }
        function tap(i) {
          if (done || given(i)) return;
          ctx.sound('tap'); snapshot(); tip = null;
          var r = Math.floor(i / n), c = i % n;
          g[r][c] = (g[r][c] + 1) % 3;
          draw(); check();
        }
        function undo() { if (done || !past.length) return; ctx.sound('tap'); g = JSON.parse(past.pop()); tip = null; draw(); }
        function clearAll() {
          if (done) return;
          ctx.sound('tap'); snapshot(); tip = null;
          g = P.given.map(function (r) { return r.slice(); });
          ctx.setStatus('הלוח נוקה (אפשר "בטלו")');
          draw();
        }
        function check() {
          for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (!g[r][c]) { ctx.setStatus(Object.keys(badSet()).length ? 'יש כלל שנשבר (מסומן בצהוב)' : 'לחצו על משבצת כדי לצבוע אותה'); return; }
          if (Object.keys(badSet()).length) { ctx.setStatus('הלוח מלא, אבל יש כלל שנשבר (מסומן בצהוב)'); return; }
          done = true; draw();
          var ok = hints <= 2;
          if (ok) good++;
          ctx.setStatus('מצוין! הלוח פתור');
          ctx.feedback(ok, ok ? undefined : 'פתרתם, בעזרת רמזים').then(function () { return ctx.wait(700); }).then(nextRound);
        }
        /* a hint names the rule that decides one square, and marks it; it does not colour it */
        function hint() {
          if (done) return;
          hints++;
          // a wrong colour first
          for (var i = 0; i < n * n; i++) {
            var r = Math.floor(i / n), c = i % n;
            if (g[r][c] && g[r][c] !== P.sol[r][c]) { tip = { i: i, wrong: true }; ctx.setStatus('רמז: הצבע במשבצת המסומנת לא נכון. נסו את הצבע השני'); draw(); return; }
          }
          var NM = { 1: 'אדומות', 2: 'כחולות' };
          var best = null;
          for (i = 0; i < n * n && !best; i++) {
            r = Math.floor(i / n); c = i % n;
            if (g[r][c]) continue;
            for (var v = 1; v <= 2 && !best; v++) {
              var why = null;
              if ((c >= 2 && g[r][c - 1] === v && g[r][c - 2] === v) || (c + 2 < n && g[r][c + 1] === v && g[r][c + 2] === v) ||
                  (r >= 2 && g[r - 1][c] === v && g[r - 2][c] === v) || (r + 2 < n && g[r + 1][c] === v && g[r + 2][c] === v)) why = 'לידה שתי ' + NM[v] + ' ברצף';
              else if ((c >= 1 && c + 1 < n && g[r][c - 1] === v && g[r][c + 1] === v) || (r >= 1 && r + 1 < n && g[r - 1][c] === v && g[r + 1][c] === v)) why = 'היא בין שתי ' + NM[v];
              else {
                var rowN = 0, colN = 0;
                for (var j = 0; j < n; j++) { if (g[r][j] === v) rowN++; if (g[j][c] === v) colN++; }
                if (rowN === n / 2) why = 'בשורה שלה כבר יש ' + n / 2 + ' ' + NM[v];
                else if (colN === n / 2) why = 'בטור שלה כבר יש ' + n / 2 + ' ' + NM[v];
              }
              if (why) best = { i: i, why: why };
            }
          }
          if (best) { tip = { i: best.i }; ctx.setStatus('רמז: במשבצת המסומנת: ' + best.why + '. איזה צבע חייב להיות בה?'); draw(); return; }
          ctx.setStatus('רמז: חפשו שורה או טור שחסרים בהם מעט צבעים, ובדקו איזה סידור לא יוצר שלוש ברצף');
        }
      }

      nextRound();
      return function cleanup() { root.classList.remove('g-split'); };
    }
  });
})();
