/* בניינים — every square is a building 1 to N floors high; every row and column has each height once. A number at
   the edge says how many buildings are seen from there (a tall building hides the shorter ones behind it).
   Every puzzle has exactly one solution. Logic, spatial thinking. Untimed. */
(function () {
  'use strict';

  /* Level 1–50: n = board side, keep = share of the edge numbers shown, givens = buildings shown at the start. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    if (L <= 6) return { n: 3, keep: 0.75, givens: 1 };
    if (L <= 15) return { n: 4, keep: 0.7, givens: 2 };
    if (L <= 25) return { n: 4, keep: 0.5, givens: 0 };
    if (L <= 38) return { n: 5, keep: 0.65, givens: 2 };
    return { n: 5, keep: 0.5, givens: 1 };
  }

  function seen(line) { var top = 0, k = 0; line.forEach(function (v) { if (v > top) { top = v; k++; } }); return k; }
  // clues: { top: [..n], bottom, left, right } with 0 = no number. Lines are read from the side the number is on.
  function lineOf(g, n, side, k) {
    var out = [];
    for (var j = 0; j < n; j++) {
      if (side === 'top') out.push(g[j * n + k]);
      else if (side === 'bottom') out.push(g[(n - 1 - j) * n + k]);
      else if (side === 'left') out.push(g[k * n + j]);
      else out.push(g[k * n + (n - 1 - j)]);
    }
    return out;
  }
  // can a partly filled line still meet its number? (filled from the clue side, before the first gap)
  function lineOk(line, clue, n) {
    if (!clue) return true;
    if (line.every(Boolean)) return seen(line) === clue;
    var top = 0, k = 0;
    for (var j = 0; j < line.length && line[j]; j++) { if (line[j] > top) { top = line[j]; k++; } }
    if (k > clue) return false;
    // even in the best case the rest cannot add more than (n - top) new tops, nor fewer than 0 / 1
    if (top < n && k + (line.length - j) < clue) return false;
    if (top === n && k !== clue) return false;
    return true;
  }
  function count(n, fixed, clues, limit) {
    var g = fixed.slice(), found = 0;
    function okAt(i) {
      var r = Math.floor(i / n), c = i % n, v = g[i];
      for (var k = 0; k < n; k++) { if (k !== c && g[r * n + k] === v) return false; if (k !== r && g[k * n + c] === v) return false; }
      return lineOk(lineOf(g, n, 'left', r), clues.left[r], n) && lineOk(lineOf(g, n, 'right', r), clues.right[r], n) &&
        lineOk(lineOf(g, n, 'top', c), clues.top[c], n) && lineOk(lineOf(g, n, 'bottom', c), clues.bottom[c], n);
    }
    (function go() {
      if (found >= limit) return;
      var best = -1, bestOpts = null;
      for (var i = 0; i < n * n; i++) {
        if (g[i]) continue;
        var opts = [];
        for (var v = 1; v <= n; v++) { g[i] = v; if (okAt(i)) opts.push(v); g[i] = 0; }
        if (!opts.length) return;
        if (!bestOpts || opts.length < bestOpts.length) { best = i; bestOpts = opts; if (opts.length === 1) break; }
      }
      if (best < 0) { found++; return; }
      for (var k = 0; k < bestOpts.length && found < limit; k++) { g[best] = bestOpts[k]; go(); g[best] = 0; }
    })();
    return found;
  }
  function makePuzzle(sp, rnd) {
    var n = sp.n;
    var rows = rnd.shuffle(Array.apply(null, { length: n }).map(function (_, i) { return i; }));
    var cols = rnd.shuffle(rows.slice()), nums = rnd.shuffle(rows.map(function (x) { return x + 1; }));
    var sol = [];
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) sol.push(nums[(rows[r] + cols[c]) % n]);
    var clues = {};
    ['top', 'bottom', 'left', 'right'].forEach(function (side) { clues[side] = []; for (var k = 0; k < n; k++) clues[side].push(seen(lineOf(sol, n, side, k))); });
    var fixed = sol.map(function () { return 0; });
    rnd.shuffle(sol.map(function (_, k) { return k; })).slice(0, sp.givens).forEach(function (k) { fixed[k] = sol[k]; });
    if (count(n, fixed, clues, 2) !== 1) return null;
    var slots = [];
    ['top', 'bottom', 'left', 'right'].forEach(function (side) { for (var k = 0; k < n; k++) slots.push([side, k]); });
    var target = Math.round(slots.length * sp.keep), shown = slots.length;
    rnd.shuffle(slots).forEach(function (s) {
      if (shown <= target) return;
      var keep = clues[s[0]][s[1]];
      clues[s[0]][s[1]] = 0;
      if (count(n, fixed, clues, 2) === 1) shown--; else clues[s[0]][s[1]] = keep;
    });
    return { n: n, sol: sol, fixed: fixed, clues: clues };
  }

  var css = [
    /* the edge numbers take a narrow strip (0.6 of a square), so the buildings get the room */
    '.sk-grid{--cl:calc(var(--cs) * .5);display:grid;grid-template-columns:var(--cl) repeat(var(--n),var(--cs)) var(--cl);',
    'grid-template-rows:var(--cl) repeat(var(--n),var(--cs)) var(--cl);gap:2px;direction:ltr;justify-content:center;}',
    '@media (min-width:900px){.g-split .sk-grid{--cs:min(calc((100svh - 13rem) / (var(--n) + 1)), 7rem) !important;flex:none;}',
    '.g-split .sk-pad{width:min(24rem,100%);}}',
    '.sk-cell{border:2px solid var(--line);border-radius:8px;padding:0;cursor:pointer;position:relative;overflow:hidden;background:var(--surface);',
    'font-family:var(--font-display);font-weight:900;font-size:calc(var(--cs) * .5);color:var(--ink);display:grid;place-items:center;line-height:1;}',
    /* a filled square is drawn as a building: the taller the number, the higher the blue */
    '.sk-cell .bld{position:absolute;left:12%;right:12%;bottom:0;background:var(--c-blue-soft);border:2px solid var(--c-blue);border-bottom:0;border-radius:4px 4px 0 0;}',
    '.sk-cell .num{position:relative;}',
    '.sk-cell.is-fixed{background:var(--surface-2);cursor:default;}',
    '.sk-cell.is-sel{border-color:var(--c-yellow);box-shadow:0 0 0 3px var(--c-yellow);}',
    '.sk-cell.is-bad .num{color:var(--c-red);}',
    '.sk-cell.is-tip{box-shadow:0 0 0 4px var(--c-purple);}',
    '.sk-cell.is-wrong{box-shadow:0 0 0 4px var(--c-red);}',
    '.sk-clue{display:grid;place-items:center;font-weight:900;font-size:calc(var(--cs) * .46);color:var(--c-red);line-height:1;}',
    '.sk-clue small{display:none;}', // the narrow strip leaves no room for the little arrows; the number is what matters
    '.sk-clue.is-ok{color:var(--c-green);}',
    '.sk-pad{display:grid;grid-template-columns:repeat(calc(var(--n) + 1),minmax(0,1fr));gap:.4rem;width:100%;max-width:22rem;}',
    '.sk-pad .g-choice{min-height:3.2rem;font-size:1.5rem;padding:.2rem;}',
    '.sk-acts{flex-wrap:nowrap;gap:.3rem;width:100%;max-width:22rem;}.sk-acts .btn{flex:1 1 auto;min-width:0;padding-inline:.4rem;font-size:.95rem;white-space:nowrap;}'
  ].join('');

  BrainGames.register({
    id: 'skyscrapers',
    name: 'בניינים',
    skill: 'logic',
    isNew: true,
    tagline: 'בנו את העיר לפי כמה בניינים רואים מכל צד',
    benefit: 'חשיבה לוגית ודמיון מרחבי',
    instructions: [
      'בכל משבצת יש בניין בגובה 1 עד המספר הגדול. בכל שורה ובכל טור יש כל גובה פעם אחת.',
      'המספר בשוליים אומר כמה בניינים רואים משם, כשמסתכלים פנימה. בניין גבוה מסתיר את הנמוכים שמאחוריו.',
      'לחצו על משבצת ואז על מספר (אפשר גם במקלדת). מספר בשוליים נצבע ירוק כשהשורה שלו נכונה.',
      'יש "רמז", "↶ בטלו" ו"נקו". אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makePuzzle: makePuzzle, count: count, seen: seen, lineOf: lineOf },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = sp.n <= 4 ? 3 : 2, round = 0, good = 0;
      var move = null; // the arrow keys, for the board on show
      ctx.arrows(function (dx, dy) { if (move) move(dx, dy); });

      function nextRound() {
        round++;
        if (round > ROUNDS) { ctx.finish({ correct: good, total: ROUNDS, note: 'בניתם ' + good + ' מתוך ' + ROUNDS + ' ערים' }); return; }
        ctx.setProgress(round, ROUNDS);
        var P = null;
        for (var t = 0; t < 30 && !P; t++) P = makePuzzle(sp, ctx);
        play(P);
      }

      function play(P) {
        root.innerHTML = '';
        root.__sk = P; // read by the automated tests
        var n = P.n, g = P.fixed.slice(), sel = -1, done = false, hints = 0, past = [], tip = null;
        var cs = 'min(calc((100vw - 3.2rem - ' + (n + 1) * 2 + 'px) / ' + (n + 1) + '), calc((100svh - 23.5rem) / ' + (n + 1) + '), 5.5rem)';
        var grid = el('div', { class: 'sk-grid', style: { '--n': n, '--cs': cs } });
        var cellEls = [], clueEls = { top: [], bottom: [], left: [], right: [] };
        function clueEl(side, k, arrow) {
          var v = P.clues[side][k];
          var e = el('span', { class: 'sk-clue', 'aria-label': v ? 'רואים ' + v : '' }, v ? [String(v), el('small', null, arrow)] : '');
          clueEls[side][k] = e; return e;
        }
        grid.appendChild(el('span'));
        for (var c = 0; c < n; c++) grid.appendChild(clueEl('top', c, '↓'));
        grid.appendChild(el('span'));
        for (var r = 0; r < n; r++) {
          grid.appendChild(clueEl('left', r, '→'));
          for (c = 0; c < n; c++) (function (i) {
            var b = el('button', { class: 'sk-cell', type: 'button', onclick: function () { pick(i); } });
            cellEls[i] = b; grid.appendChild(b);
          })(r * n + c);
          grid.appendChild(clueEl('right', r, '←'));
        }
        grid.appendChild(el('span'));
        for (c = 0; c < n; c++) grid.appendChild(clueEl('bottom', c, '↑'));
        grid.appendChild(el('span'));
        var pad = el('div', { class: 'sk-pad', style: { '--n': n } });
        for (var v = 1; v <= n; v++) (function (v) { pad.appendChild(el('button', { class: 'g-choice', type: 'button', onclick: function () { put(v); } }, String(v))); })(v);
        pad.appendChild(el('button', { class: 'g-choice', type: 'button', 'aria-label': 'מחיקה', onclick: function () { put(0); } }, '⌫'));
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var undoBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: undo }, '↶ בטלו');
        var clearBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: clearAll }, 'נקו');
        var acts = el('div', { class: 'g-actions sk-acts' }, [hintBtn, undoBtn, clearBtn]);
        // on a computer the number pad and buttons sit beside the city (shared .g-split layout)
        root.classList.add('g-split');
        root.appendChild(grid); root.appendChild(el('div', { class: 'g-side' }, [pad, acts]));
        ctx.setStatus('לחצו על משבצת, ואז על גובה הבניין');
        draw();

        function dup(i) {
          var v = g[i]; if (!v) return false;
          var r = Math.floor(i / n), c = i % n;
          for (var k = 0; k < n; k++) { if (k !== c && g[r * n + k] === v) return true; if (k !== r && g[k * n + c] === v) return true; }
          return false;
        }
        function draw() {
          cellEls.forEach(function (b, i) {
            b.innerHTML = '';
            if (g[i]) {
              b.appendChild(el('span', { class: 'bld', style: { height: Math.round(g[i] / n * 82) + '%' } }));
              b.appendChild(el('span', { class: 'num' }, String(g[i])));
            }
            b.className = 'sk-cell' + (P.fixed[i] ? ' is-fixed' : '') + (i === sel && !done ? ' is-sel' : '') + (dup(i) ? ' is-bad' : '') +
              (tip && tip.i === i ? (tip.wrong ? ' is-wrong' : ' is-tip') : '');
            b.setAttribute('aria-label', g[i] ? 'בניין בגובה ' + g[i] : 'משבצת ריקה');
            b.disabled = done;
          });
          ['top', 'bottom', 'left', 'right'].forEach(function (side) {
            for (var k = 0; k < n; k++) {
              var line = lineOf(g, n, side, k);
              clueEls[side][k].classList.toggle('is-ok', !!P.clues[side][k] && line.every(Boolean) && seen(line) === P.clues[side][k]);
            }
          });
          [].forEach.call(pad.children, function (b) { b.disabled = done || sel < 0; });
          undoBtn.disabled = done || !past.length;
          clearBtn.disabled = done || !g.some(function (v, i) { return v && !P.fixed[i]; });
          hintBtn.disabled = done;
        }
        // the arrow keys move the picked square (skipping squares that cannot be picked)
        function stepTo(r0, c0, dr, dc, R, Cn, ok) {
          var r = r0, c = c0;
          for (var k = 0; k < Math.max(R, Cn); k++) { r += dr; c += dc; if (r < 0 || c < 0 || r >= R || c >= Cn) return -1; if (ok(r, c)) return r * Cn + c; }
          return -1;
        }
        move = function (dx, dy) {
          if (done) return;
          if (sel < 0) { sel = P.fixed.findIndex(function (v) { return !v; }); draw(); return; }
          var to = stepTo(Math.floor(sel / n), sel % n, dy, dx, n, n, function (r, c) { return !P.fixed[r * n + c]; });
          if (to >= 0) { sel = to; draw(); }
        };
        function pick(i) { if (done || P.fixed[i]) return; ctx.sound('tap'); sel = i; draw(); }
        function put(v) {
          if (done || sel < 0 || g[sel] === v) return;
          ctx.sound('tap'); past.push(g.slice()); tip = null;
          g[sel] = v;
          draw(); check();
        }
        function undo() { if (done || !past.length) return; ctx.sound('tap'); g = past.pop(); tip = null; draw(); }
        function clearAll() { if (done) return; ctx.sound('tap'); past.push(g.slice()); g = P.fixed.slice(); tip = null; ctx.setStatus('העיר נוקתה (אפשר "בטלו")'); draw(); }
        function check() {
          if (g.some(function (v) { return !v; })) return;
          var ok1 = !g.some(function (_, i) { return dup(i); }) && ['top', 'bottom', 'left', 'right'].every(function (side) {
            for (var k = 0; k < n; k++) if (P.clues[side][k] && seen(lineOf(g, n, side, k)) !== P.clues[side][k]) return false;
            return true;
          });
          if (!ok1) { ctx.setStatus('העיר מלאה, אבל משהו לא מתאים. מספר בשוליים שלא ירוק מראה איפה'); return; }
          done = true; sel = -1; draw();
          var ok = hints <= 2;
          if (ok) good++;
          ctx.setStatus('מצוין! העיר בנויה');
          ctx.feedback(ok, ok ? undefined : 'פתרתם, בעזרת רמזים').then(function () { return ctx.wait(700); }).then(nextRound);
        }
        /* a hint: a wrong building first; else a square with few heights possible, and why */
        function hint() {
          if (done) return;
          hints++;
          var wrong = g.map(function (v, i) { return v && v !== P.sol[i] ? i : -1; }).filter(function (i) { return i >= 0; })[0];
          if (wrong !== undefined) { tip = { i: wrong, wrong: true }; sel = wrong; ctx.setStatus('רמז: הבניין במשבצת המסומנת לא בגובה הנכון'); draw(); return; }
          // an edge "1": the first building is the tallest; an edge equal to N: they rise 1, 2, 3…
          var sides = ['left', 'right', 'top', 'bottom'];
          for (var s = 0; s < 4; s++) for (var k = 0; k < n; k++) {
            var cl = P.clues[sides[s]][k];
            if (cl !== 1 && cl !== n) continue;
            var first = sides[s] === 'left' ? k * n : sides[s] === 'right' ? k * n + n - 1 : sides[s] === 'top' ? k : (n - 1) * n + k;
            if (g[first]) continue;
            tip = { i: first }; sel = first;
            ctx.setStatus(cl === 1 ? 'רמז: מהמספר 1 ליד המשבצת המסומנת רואים רק בניין אחד, אז הוא מסתיר את כולם: זה הבניין הכי גבוה. כמה קומות יש לו?'
              : 'רמז: מהמספר ' + n + ' רואים את כל הבניינים, אז הם עולים מ-1 עד ' + n + '. כמה במשבצת המסומנת?');
            draw(); return;
          }
          // else the square whose right height is easiest: one that is the last open one in its row or column
          for (var i = 0; i < n * n; i++) {
            if (g[i]) continue;
            var r = Math.floor(i / n), c = i % n, rowOpen = 0, colOpen = 0;
            for (var j = 0; j < n; j++) { if (!g[r * n + j]) rowOpen++; if (!g[j * n + c]) colOpen++; }
            if (rowOpen === 1 || colOpen === 1) { tip = { i: i }; sel = i; ctx.setStatus('רמז: ב' + (rowOpen === 1 ? 'שורה' : 'טור') + ' של המשבצת המסומנת חסר רק גובה אחד. איזה?'); draw(); return; }
          }
          ctx.setStatus('רמז: חפשו מספר קטן בשוליים: 2 אומר שהבניין הכי גבוה הוא השני או אחריו. ליד מספר גדול הבניינים הראשונים נמוכים');
        }
      }

      nextRound();
    }
  });
})();
