/* אוצרות — treasures are hidden in the squares. Some squares are open and show how many treasures touch them
   (also at the corners). Mark every treasure; no exploding, only working it out. Every puzzle has exactly one
   solution. Logic. Untimed. */
(function () {
  'use strict';

  /* Level 1–50: n = board side, dens = share of squares with a treasure, open = share of the other squares shown. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    if (L <= 6) return { n: 5, dens: 0.2, open: 0.75 };
    if (L <= 12) return { n: 5, dens: 0.24, open: 0.55 };
    if (L <= 22) return { n: 6, dens: 0.22, open: 0.55 };
    if (L <= 32) return { n: 6, dens: 0.25, open: 0.4 };
    if (L <= 42) return { n: 7, dens: 0.22, open: 0.45 };
    return { n: 7, dens: 0.25, open: 0.33 };
  }

  function around(n, i) {
    var r = Math.floor(i / n), c = i % n, out = [];
    for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
      if (!dr && !dc) continue;
      var rr = r + dr, cc = c + dc;
      if (rr >= 0 && rr < n && cc >= 0 && cc < n) out.push(rr * n + cc);
    }
    return out;
  }
  // number of ways to place the treasures (open squares hold none), stop at `limit`
  function count(n, opens, nums, total, limit) {
    var unknown = [], val = {}, found = 0;
    for (var i = 0; i < n * n; i++) if (!opens[i]) unknown.push(i);
    var cons = [];
    for (i = 0; i < n * n; i++) if (opens[i]) cons.push({ k: nums[i], cells: around(n, i).filter(function (x) { return !opens[x]; }) });
    var byCell = {}; unknown.forEach(function (x) { byCell[x] = []; });
    cons.forEach(function (c) { c.cells.forEach(function (x) { byCell[x].push(c); }); });
    // cells that touch numbers first
    unknown.sort(function (a, b) { return byCell[b].length - byCell[a].length; });
    function ok(c) {
      var t = 0, u = 0;
      c.cells.forEach(function (x) { if (val[x] === 1) t++; else if (val[x] === undefined) u++; });
      return t <= c.k && t + u >= c.k;
    }
    var placed = 0;
    (function go(j) {
      if (found >= limit) return;
      if (placed > total || placed + (unknown.length - j) < total) return;
      if (j === unknown.length) { found++; return; }
      var x = unknown[j];
      for (var v = 0; v <= 1; v++) {
        val[x] = v; if (v) placed++;
        if (byCell[x].every(ok)) go(j + 1);
        if (v) placed--;
        delete val[x];
      }
    })(0);
    return found;
  }
  function makePuzzle(sp, rnd) {
    var n = sp.n, N = n * n;
    var total = Math.max(3, Math.round(N * sp.dens));
    var cells = rnd.shuffle(Array.apply(null, { length: N }).map(function (_, i) { return i; }));
    var treasure = {}; cells.slice(0, total).forEach(function (i) { treasure[i] = true; });
    var nums = [];
    for (var i = 0; i < N; i++) nums.push(around(n, i).filter(function (x) { return treasure[x]; }).length);
    var opens = {}; for (i = 0; i < N; i++) if (!treasure[i]) opens[i] = true;
    if (count(n, opens, nums, total, 2) !== 1) return null;
    var safe = Object.keys(opens).map(Number), target = Math.round(safe.length * sp.open), shown = safe.length;
    rnd.shuffle(safe).forEach(function (i) {
      if (shown <= target) return;
      delete opens[i];
      if (count(n, opens, nums, total, 2) === 1) shown--; else opens[i] = true;
    });
    return { n: n, treasure: treasure, opens: opens, nums: nums, total: total };
  }

  var css = [
    '.ts-grid{--n:6;display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:3px;width:min(100%,calc(100svh - 18rem),27rem);direction:ltr;}',
    '.ts-cell{aspect-ratio:1;min-width:0;border-radius:8px;border:2px solid var(--line);background:var(--c-green-soft);padding:0;cursor:pointer;',
    'display:grid;place-items:center;font-size:calc(min(100vw - 3rem,27rem) / var(--n) * .48);line-height:1;color:var(--ink);font-family:var(--font-display);font-weight:900;}',
    '.ts-cell.is-open{background:var(--surface);border-color:var(--surface-2);cursor:default;color:var(--c-blue);}',
    '.ts-cell.is-open.n0{color:var(--ink-soft);}',
    '.ts-cell.is-x{color:var(--ink-soft);font-size:calc(min(100vw - 3rem,27rem) / var(--n) * .38);}',
    '.ts-cell.is-full{color:var(--c-green);}',
    '.ts-cell.is-over{color:var(--c-red);}',
    '.ts-cell.is-tip{box-shadow:0 0 0 4px var(--c-purple);}',
    '.ts-cell.is-wrong{box-shadow:0 0 0 4px var(--c-red);}',
    '.ts-count{margin:0;font-weight:800;font-size:1.05rem;}',
    '.ts-acts{flex-wrap:nowrap;gap:.3rem;width:100%;max-width:27rem;}.ts-acts .btn{flex:1 1 auto;min-width:0;padding-inline:.4rem;font-size:.95rem;white-space:nowrap;}',
    '@media (min-width:900px){.g-split .ts-grid{width:min(calc(100svh - 12.5rem),36rem);flex:none;}.g-split .ts-cell{font-size:calc(min(100svh - 12.5rem,36rem) / var(--n) * .48);}}'
  ].join('');

  BrainGames.register({
    id: 'treasures',
    name: 'אוצרות',
    skill: 'logic',
    isNew: true,
    tagline: 'מספרים מגלים כמה אוצרות מסביב. מצאו את כולם',
    benefit: 'הסקת מסקנות וריכוז',
    instructions: [
      'במשבצות הירוקות מוסתרים אוצרות. מספר במשבצת פתוחה אומר כמה אוצרות נוגעים בה (גם באלכסון).',
      'לחיצה על משבצת ירוקה: פעם אחת 💎 (יש כאן אוצר), פעם שנייה ✗ (אין), פעם שלישית ריקה.',
      'מספר נצבע ירוק כשסביבו בדיוק מספיק אוצרות, ואדום כשיש יותר מדי. למעלה כתוב כמה אוצרות יש בסך הכול.',
      'שום דבר לא מתפוצץ. יש "רמז", "↶ בטלו" ו"נקו". אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makePuzzle: makePuzzle, count: count },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = sp.n === 5 ? 3 : 2, round = 0, good = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) { ctx.finish({ correct: good, total: ROUNDS, note: 'מצאתם את כל האוצרות ב-' + good + ' מתוך ' + ROUNDS + ' לוחות' }); return; }
        ctx.setProgress(round, ROUNDS);
        var P = null;
        for (var t = 0; t < 60 && !P; t++) P = makePuzzle(sp, ctx);
        play(P);
      }

      function play(P) {
        root.innerHTML = '';
        root.__ts = P; // read by the automated tests
        var n = P.n, N = n * n;
        var m = Array.apply(null, { length: N }).map(function () { return 0; }); // 0 none, 1 treasure, 2 ✗
        var done = false, hints = 0, past = [], tip = null;
        var cells = [];
        for (var i = 0; i < N; i++) (function (i) {
          cells.push(el('button', { class: 'ts-cell', type: 'button', onclick: function () { tap(i); } }));
        })(i);
        var grid = el('div', { class: 'ts-grid', style: { '--n': n } }, cells);
        var countEl = el('p', { class: 'ts-count' });
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var undoBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: undo }, '↶ בטלו');
        var clearBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: clearAll }, 'נקו');
        var acts = el('div', { class: 'g-actions ts-acts' }, [hintBtn, undoBtn, clearBtn]);
        root.classList.add('g-split');
        root.appendChild(grid);
        root.appendChild(el('div', { class: 'g-side' }, [countEl, acts]));
        ctx.setStatus('מצאו ' + P.total + ' אוצרות');
        draw();

        function draw() {
          var marked = m.filter(function (v) { return v === 1; }).length;
          cells.forEach(function (b, i) {
            var open = !!P.opens[i], cls = 'ts-cell';
            if (open) {
              var k = P.nums[i], have = around(n, i).filter(function (x) { return m[x] === 1; }).length;
              cls += ' is-open n' + k + (k && have === k ? ' is-full' : have > k ? ' is-over' : '');
              b.textContent = String(k);
              b.setAttribute('aria-label', k + ' אוצרות מסביב');
            } else {
              cls += m[i] === 2 ? ' is-x' : '';
              b.textContent = m[i] === 1 ? '💎' : m[i] === 2 ? '✗' : '';
              b.setAttribute('aria-label', m[i] === 1 ? 'אוצר' : m[i] === 2 ? 'אין אוצר' : 'משבצת סגורה');
            }
            if (tip && (tip.i === i || (tip.cells && tip.cells.indexOf(i) !== -1))) cls += tip.wrong ? ' is-wrong' : ' is-tip';
            b.className = cls;
            b.disabled = done || open;
          });
          countEl.textContent = 'סימנתם ' + marked + ' מתוך ' + P.total + ' אוצרות';
          undoBtn.disabled = done || !past.length;
          clearBtn.disabled = done || !m.some(Boolean);
          hintBtn.disabled = done;
        }
        function tap(i) {
          if (done || P.opens[i]) return;
          ctx.sound('tap'); past.push(m.slice()); tip = null;
          m[i] = (m[i] + 1) % 3;
          draw(); check();
        }
        function undo() { if (done || !past.length) return; ctx.sound('tap'); m = past.pop(); tip = null; draw(); }
        function clearAll() { if (done) return; ctx.sound('tap'); past.push(m.slice()); m = m.map(function () { return 0; }); tip = null; ctx.setStatus('הלוח נוקה (אפשר "בטלו")'); draw(); }
        function check() {
          for (var i = 0; i < N; i++) if (!P.opens[i] && (m[i] === 1) !== !!P.treasure[i]) {
            if (m.filter(function (v) { return v === 1; }).length === P.total) ctx.setStatus('סימנתם ' + P.total + ' אוצרות, אבל לא כולם במקום. בדקו את המספרים');
            return;
          }
          done = true; draw();
          var ok = hints <= 2;
          if (ok) good++;
          ctx.setStatus('מצאתם את כל האוצרות!');
          ctx.feedback(ok, ok ? undefined : 'מצאתם, בעזרת רמזים').then(function () { return ctx.wait(700); }).then(nextRound);
        }
        /* a hint: a wrong mark first; else a number that decides its closed neighbours, and why; never marks */
        function hint() {
          if (done) return;
          hints++;
          for (var i = 0; i < N; i++) if (!P.opens[i] && m[i] && (m[i] === 1) !== !!P.treasure[i]) {
            tip = { i: i, wrong: true };
            ctx.setStatus(m[i] === 1 ? 'רמז: במשבצת המסומנת באדום אין אוצר' : 'רמז: דווקא במשבצת המסומנת באדום יש אוצר');
            draw(); return;
          }
          for (i = 0; i < N; i++) {
            if (!P.opens[i]) continue;
            var nb = around(n, i).filter(function (x) { return !P.opens[x]; });
            var have = nb.filter(function (x) { return m[x] === 1; }).length, free = nb.filter(function (x) { return !m[x]; });
            var k = P.nums[i];
            if (!free.length) continue;
            if (k && have + free.length === k) {
              tip = { i: i, cells: free };
              ctx.setStatus('רמז: סביב המספר ' + k + ' המסומן ' + (k === 1 ? 'נשארה רק משבצת אחת שיכול להיות בה אוצר' : 'יש בדיוק ' + k + ' משבצות שיכול להיות בהן אוצר') + '. מה זה אומר?');
              draw(); return;
            }
            if (have === k) {
              tip = { i: i, cells: free };
              ctx.setStatus(k ? 'רמז: סביב המספר ' + k + ' המסומן כבר ' + (k === 1 ? 'יש אוצר אחד' : 'יש ' + k + ' אוצרות') + '. מה זה אומר על שאר המשבצות שסביבו?'
                : 'רמז: המספר 0 המסומן אומר שאין אף אוצר סביבו. מה לסמן במשבצות שמסביב?');
              draw(); return;
            }
          }
          ctx.setStatus('רמז: חפשו שני מספרים שכנים ותשוו ביניהם: משבצת שנוגעת רק באחד מהם מגלה משהו');
        }
      }

      nextRound();
      return function cleanup() { root.classList.remove('g-split'); };
    }
  });
})();
