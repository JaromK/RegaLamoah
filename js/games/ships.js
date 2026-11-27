/* ספינות — a fleet is hidden on the sea. The numbers at the edges say how many ship squares are in each row and
   column; ships never touch, not even at a corner. A few squares are shown at the start. Every puzzle has exactly
   one solution. Logic. Untimed. */
(function () {
  'use strict';

  /* Level 1–50: n = sea size, fleet = ship lengths, extra = squares shown beyond what makes the answer unique. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    if (L <= 8) return { n: 6, fleet: [3, 2, 2, 1, 1], extra: 3 };
    if (L <= 18) return { n: 6, fleet: [3, 2, 2, 1, 1, 1], extra: 1 };
    if (L <= 30) return { n: 7, fleet: [4, 3, 2, 2, 1, 1], extra: 1 };
    if (L <= 40) return { n: 7, fleet: [4, 3, 2, 2, 1, 1], extra: 0 };
    return { n: 8, fleet: [4, 3, 3, 2, 2, 1, 1], extra: 0 };
  }

  // the squares of a ship of length len at r, c (down = vertical), or null if it leaves the sea
  function shipCells(n, r, c, len, down) {
    var out = [];
    for (var k = 0; k < len; k++) {
      var rr = r + (down ? k : 0), cc = c + (down ? 0 : k);
      if (rr >= n || cc >= n) return null;
      out.push(rr * n + cc);
    }
    return out;
  }
  function touching(n, i) {
    var r = Math.floor(i / n), c = i % n, out = [];
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      var rr = r + dr, cc = c + dc;
      if ((dr || dc) && rr >= 0 && rr < n && cc >= 0 && cc < n) out.push(rr * n + cc);
    }
    return out;
  }
  // number of fleets that fit the edge numbers and the shown squares (shown: i → 1 ship, 2 water), up to `limit`
  function count(n, fleet, rows, cols, shown, limit) {
    var occ = Array.apply(null, { length: n * n }).map(function () { return 0; }); // 1 ship, 2 blocked (next to a ship)
    var rowN = rows.map(function () { return 0; }), colN = cols.map(function () { return 0; }), found = 0;
    var order = fleet.slice().sort(function (a, b) { return b - a; });
    (function go(k, minPos) {
      if (found >= limit) return;
      if (k === order.length) {
        for (var i = 0; i < n; i++) if (rowN[i] !== rows[i] || colN[i] !== cols[i]) return;
        for (var s in shown) if (shown[s] === 1 && occ[s] !== 1) return;
        found++; return;
      }
      var len = order[k];
      // ships of the same length are placed in order, so each fleet is counted once
      var start = k > 0 && order[k - 1] === len ? minPos : 0;
      for (var pos = start; pos < n * n * 2; pos++) {
        var down = pos % 2 === 1, cell = Math.floor(pos / 2);
        if (len === 1 && down) continue;
        var cs = shipCells(n, Math.floor(cell / n), cell % n, len, down);
        if (!cs || cs.some(function (x) { return occ[x] || shown[x] === 2; })) continue;
        var bad = cs.some(function (x) { var r = Math.floor(x / n), c = x % n; return rowN[r] + 1 > rows[r] || colN[c] + 1 > cols[c]; });
        if (bad) continue;
        // place: mark it and the squares around it
        var marked = [];
        cs.forEach(function (x) { occ[x] = 1; rowN[Math.floor(x / n)]++; colN[x % n]++; });
        cs.forEach(function (x) { touching(n, x).forEach(function (y) { if (!occ[y]) { occ[y] = 2; marked.push(y); } }); });
        go(k + 1, pos + 1);
        marked.forEach(function (y) { occ[y] = 0; });
        cs.forEach(function (x) { occ[x] = 0; rowN[Math.floor(x / n)]--; colN[x % n]--; });
        if (found >= limit) return;
      }
    })(0, 0);
    return found;
  }
  function makePuzzle(sp, rnd) {
    var n = sp.n;
    for (var attempt = 0; attempt < 80; attempt++) {
      var occ = Array.apply(null, { length: n * n }).map(function () { return 0; }), ship = {}, ok = true;
      sp.fleet.slice().sort(function (a, b) { return b - a; }).forEach(function (len) {
        if (!ok) return;
        for (var t = 0; t < 200; t++) {
          var cs = shipCells(n, rnd.randInt(0, n - 1), rnd.randInt(0, n - 1), len, rnd.randInt(0, 1) === 1);
          if (!cs || cs.some(function (x) { return occ[x]; })) continue;
          cs.forEach(function (x) { occ[x] = 1; ship[x] = true; });
          cs.forEach(function (x) { touching(n, x).forEach(function (y) { if (!occ[y]) occ[y] = 2; }); });
          return;
        }
        ok = false;
      });
      if (!ok) continue;
      var rows = [], cols = [];
      for (var i = 0; i < n; i++) { rows.push(0); cols.push(0); }
      Object.keys(ship).forEach(function (x) { rows[Math.floor(x / n)]++; cols[x % n]++; });
      // show squares (ship ones first) until the fleet is the only one, then a few more for the easy levels
      var shown = {}, order = rnd.shuffle(Array.apply(null, { length: n * n }).map(function (_, k) { return k; }));
      order.sort(function (a, b) { return (ship[b] ? 1 : 0) - (ship[a] ? 1 : 0); });
      var pool = order.slice(), guard = 0;
      while (count(n, sp.fleet, rows, cols, shown, 2) !== 1 && guard++ < 30) {
        var pickI = pool.splice(rnd.randInt(0, Math.min(pool.length - 1, 8)), 1)[0];
        shown[pickI] = ship[pickI] ? 1 : 2;
      }
      if (guard >= 30) continue;
      // drop shown squares that are not needed
      rnd.shuffle(Object.keys(shown)).forEach(function (k) {
        var v = shown[k]; delete shown[k];
        if (count(n, sp.fleet, rows, cols, shown, 2) !== 1) shown[k] = v;
      });
      for (var e = 0; e < sp.extra && pool.length; e++) { var x = pool.shift(); if (shown[x] === undefined) shown[x] = ship[x] ? 1 : 2; }
      return { n: n, fleet: sp.fleet, ship: ship, rows: rows, cols: cols, shown: shown };
    }
    return null;
  }

  var css = [
    '.sh2-grid{display:grid;grid-template-columns:repeat(calc(var(--n) + 1),var(--cs));grid-auto-rows:var(--cs);gap:2px;direction:ltr;justify-content:center;}',
    '.sh2-cell{border:1px solid var(--c-blue-soft);border-radius:5px;background:var(--surface);padding:0;cursor:pointer;display:grid;place-items:center;',
    'font-size:calc(var(--cs) * .55);line-height:1;color:var(--c-blue);}',
    '.sh2-cell.is-ship{background:var(--c-blue);border-color:var(--c-blue);border-radius:30%;}',
    '.sh2-cell.is-water{background:var(--c-blue-soft);}',
    '.sh2-cell.is-shown{box-shadow:inset 0 0 0 3px var(--ink);cursor:default;}',
    '.sh2-cell.is-tip{box-shadow:0 0 0 3px var(--c-purple);}',
    '.sh2-cell.is-wrong{box-shadow:0 0 0 3px var(--c-red);}',
    '.sh2-num{display:grid;place-items:center;font-weight:900;font-size:calc(var(--cs) * .5);color:var(--ink);}',
    '.sh2-num.is-ok{color:var(--c-green);}.sh2-num.is-over{color:var(--c-red);}',
    '.sh2-fleet{display:flex;flex-wrap:wrap;gap:.35rem .6rem;justify-content:center;max-width:26rem;direction:ltr;}',
    '.sh2-boat{display:flex;gap:2px;}.sh2-boat span{width:.95rem;height:.95rem;border-radius:3px;background:var(--c-blue);}',
    '.sh2-acts{flex-wrap:nowrap;gap:.3rem;width:100%;max-width:26rem;}.sh2-acts .btn{flex:1 1 auto;min-width:0;padding-inline:.4rem;font-size:.95rem;white-space:nowrap;}'
  ].join('');

  BrainGames.register({
    id: 'ships',
    name: 'ספינות',
    skill: 'logic',
    isNew: true,
    tagline: 'מצאו את הספינות לפי המספרים בשוליים',
    benefit: 'הסקת מסקנות ותכנון',
    instructions: [
      'בים מוסתרות הספינות שבתמונה למטה. המספר בשוליים אומר כמה משבצות ספינה יש באותה שורה או טור.',
      'ספינות לא נוגעות זו בזו, גם לא בפינה. חלק מהמשבצות כבר גלויות (במסגרת שחורה).',
      'לחיצה על משבצת: פעם אחת ספינה ■, פעם שנייה מים ≈, פעם שלישית ריקה. מספר נצבע ירוק כשהשורה מלאה נכון.',
      'יש "רמז", "↶ בטלו" ו"נקו". אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makePuzzle: makePuzzle, count: count },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = sp.n === 6 ? 3 : 2, round = 0, good = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) { ctx.finish({ correct: good, total: ROUNDS, note: 'מצאתם את הצי ב-' + good + ' מתוך ' + ROUNDS + ' ימים' }); return; }
        ctx.setProgress(round, ROUNDS);
        var P = null;
        for (var t = 0; t < 10 && !P; t++) P = makePuzzle(sp, ctx);
        play(P);
      }

      function play(P) {
        root.innerHTML = '';
        root.__sh = P; // read by the automated tests
        var n = P.n, N = n * n;
        var m = Array.apply(null, { length: N }).map(function (_, i) { return P.shown[i] || 0; }); // 1 ship, 2 water
        var done = false, hints = 0, past = [], tip = null;
        var cs = 'min(calc((100vw - 3rem) / ' + (n + 1) + ' - 2px), calc((100svh - 23rem) / ' + (n + 1) + '), 3.4rem)';
        var grid = el('div', { class: 'sh2-grid', style: { '--n': n, '--cs': cs } });
        var cells = [], rowEls = [], colEls = [];
        grid.appendChild(el('span'));
        for (var c = 0; c < n; c++) { colEls.push(el('span', { class: 'sh2-num' }, String(P.cols[c]))); grid.appendChild(colEls[c]); }
        for (var r = 0; r < n; r++) {
          rowEls.push(el('span', { class: 'sh2-num' }, String(P.rows[r]))); grid.appendChild(rowEls[r]);
          for (c = 0; c < n; c++) (function (i) {
            var b = el('button', { class: 'sh2-cell', type: 'button', onclick: function () { tap(i); } });
            cells[i] = b; grid.appendChild(b);
          })(r * n + c);
        }
        var fleet = el('div', { class: 'sh2-fleet', 'aria-label': 'הספינות: ' + P.fleet.join(', ') }, P.fleet.map(function (len) {
          return el('span', { class: 'sh2-boat' }, Array.apply(null, { length: len }).map(function () { return el('span'); }));
        }));
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var undoBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: undo }, '↶ בטלו');
        var clearBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: clearAll }, 'נקו');
        var acts = el('div', { class: 'g-actions sh2-acts' }, [hintBtn, undoBtn, clearBtn]);
        root.appendChild(grid); root.appendChild(fleet); root.appendChild(acts);
        ctx.setStatus('מצאו את ' + P.fleet.length + ' הספינות');
        draw();

        function lineCount(isRow, k, v) {
          var t = 0;
          for (var j = 0; j < n; j++) if (m[isRow ? k * n + j : j * n + k] === v) t++;
          return t;
        }
        function draw() {
          cells.forEach(function (b, i) {
            b.className = 'sh2-cell' + (m[i] === 1 ? ' is-ship' : m[i] === 2 ? ' is-water' : '') + (P.shown[i] ? ' is-shown' : '') +
              (tip && (tip.i === i || (tip.cells && tip.cells.indexOf(i) !== -1)) ? (tip.wrong ? ' is-wrong' : ' is-tip') : '');
            b.textContent = m[i] === 2 ? '≈' : '';
            b.setAttribute('aria-label', m[i] === 1 ? 'ספינה' : m[i] === 2 ? 'מים' : 'לא ידוע');
            b.disabled = done || !!P.shown[i];
          });
          for (var k = 0; k < n; k++) {
            var rs = lineCount(true, k, 1), cs2 = lineCount(false, k, 1);
            rowEls[k].className = 'sh2-num' + (rs === P.rows[k] ? ' is-ok' : rs > P.rows[k] ? ' is-over' : '');
            colEls[k].className = 'sh2-num' + (cs2 === P.cols[k] ? ' is-ok' : cs2 > P.cols[k] ? ' is-over' : '');
          }
          undoBtn.disabled = done || !past.length;
          clearBtn.disabled = done || !m.some(function (v, i) { return v && !P.shown[i]; });
          hintBtn.disabled = done;
        }
        function tap(i) {
          if (done || P.shown[i]) return;
          ctx.sound('tap'); past.push(m.slice()); tip = null;
          m[i] = (m[i] + 1) % 3;
          draw(); check();
        }
        function undo() { if (done || !past.length) return; ctx.sound('tap'); m = past.pop(); tip = null; draw(); }
        function clearAll() { if (done) return; ctx.sound('tap'); past.push(m.slice()); m = m.map(function (_, i) { return P.shown[i] || 0; }); tip = null; ctx.setStatus('הים נוקה (אפשר "בטלו")'); draw(); }
        function check() {
          for (var i = 0; i < N; i++) if ((m[i] === 1) !== !!P.ship[i]) return;
          done = true; draw();
          var ok = hints <= 2;
          if (ok) good++;
          ctx.setStatus('מצאתם את כל הספינות!');
          ctx.feedback(ok, ok ? undefined : 'מצאתם, בעזרת רמזים').then(function () { return ctx.wait(700); }).then(nextRound);
        }
        /* a hint: a wrong mark first; else a rule that decides some squares, and where; it never marks them */
        function hint() {
          if (done) return;
          hints++;
          for (var i = 0; i < N; i++) if (m[i] && (m[i] === 1) !== !!P.ship[i]) {
            tip = { i: i, wrong: true }; ctx.setStatus(m[i] === 1 ? 'רמז: במשבצת המסומנת באדום אין ספינה' : 'רמז: דווקא במשבצת המסומנת באדום יש ספינה'); draw(); return;
          }
          // around a ship square: the corners are always water
          for (i = 0; i < N; i++) {
            if (m[i] !== 1) continue;
            var r = Math.floor(i / n), c = i % n, corners = [];
            [[-1, -1], [-1, 1], [1, -1], [1, 1]].forEach(function (d) {
              var rr = r + d[0], cc = c + d[1];
              if (rr >= 0 && rr < n && cc >= 0 && cc < n && !m[rr * n + cc]) corners.push(rr * n + cc);
            });
            if (corners.length) { tip = { cells: corners }; ctx.setStatus('רמז: ספינות לא נוגעות בפינות, אז בפינות של משבצת ספינה תמיד יש מים. מה בסימון הסגול?'); draw(); return; }
          }
          // a line that is already full (the rest is water) or that needs all its open squares
          for (var k = 0; k < 2 * n; k++) {
            var isRow = k < n, idx = isRow ? k : k - n, need = isRow ? P.rows[idx] : P.cols[idx];
            var line = []; for (var j = 0; j < n; j++) line.push(isRow ? idx * n + j : j * n + idx);
            var ships = line.filter(function (x) { return m[x] === 1; }).length, open = line.filter(function (x) { return !m[x]; });
            if (!open.length) continue;
            var name = isRow ? 'בשורה' : 'בטור';
            if (ships === need) { tip = { cells: open }; ctx.setStatus('רמז: ' + name + ' המסומנת כבר יש ' + need + ' משבצות ספינה, כמו המספר. מה יש בשאר?'); draw(); return; }
            if (ships + open.length === need) { tip = { cells: open }; ctx.setStatus('רמז: ' + name + ' המסומנת חסרות ' + (need - ships) + ' משבצות ספינה, ובדיוק כך נשארו פתוחות. מה יש בהן?'); draw(); return; }
          }
          ctx.setStatus('רמז: התחילו מהספינה הגדולה ביותר: איפה יש מספיק מקום בשורה או בטור בשבילה?');
        }
      }

      nextRound();
    }
  });
})();
