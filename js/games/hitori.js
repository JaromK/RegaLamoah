/* מחיקת כפולים — shade squares so that no number appears twice in a row or a column. Shaded squares never touch
   side by side, and all the white squares stay joined together. Every puzzle has exactly one solution.
   Logic, attention. Untimed. */
(function () {
  'use strict';

  /* Level 1–50: n = board side. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    return { n: L <= 8 ? 4 : L <= 22 ? 5 : L <= 38 ? 6 : 7 };
  }

  function joined(n, shade) {
    var start = -1;
    for (var i = 0; i < n * n; i++) if (!shade[i]) { start = i; break; }
    if (start < 0) return false;
    var seen = {}, stack = [start], k = 0;
    seen[start] = true;
    while (stack.length) {
      var x = stack.pop(); k++;
      var r = Math.floor(x / n), c = x % n;
      [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(function (p) {
        if (p[0] < 0 || p[1] < 0 || p[0] >= n || p[1] >= n) return;
        var y = p[0] * n + p[1];
        if (!shade[y] && !seen[y]) { seen[y] = true; stack.push(y); }
      });
    }
    return k === shade.filter(function (v) { return !v; }).length;
  }
  // number of shadings that keep the rules (up to `limit`)
  function count(n, g, limit) {
    var shade = g.map(function () { return 0; }), found = 0;
    // only squares whose number repeats in their row or column can be shaded; the others are always white
    var maybe = [], isMaybe = {};
    for (var i = 0; i < n * n; i++) {
      var r = Math.floor(i / n), c = i % n, dup = false;
      for (var k = 0; k < n; k++) { if (k !== c && g[r * n + k] === g[i]) dup = true; if (k !== r && g[k * n + c] === g[i]) dup = true; }
      if (dup) { maybe.push(i); isMaybe[i] = true; }
    }
    var state = {}; // maybe square → 1 white, 2 shaded (decided so far)
    function white(x) { return !isMaybe[x] || state[x] === 1; }
    // can x stay white: no white twin in its row or column among the squares known so far
    function canWhite(x) {
      var r = Math.floor(x / n), c = x % n;
      for (var k = 0; k < n; k++) {
        var a = r * n + k, b = k * n + c;
        if (a !== x && g[a] === g[x] && white(a)) return false;
        if (b !== x && g[b] === g[x] && white(b)) return false;
      }
      return true;
    }
    (function go(j) {
      if (found >= limit) return;
      if (j === maybe.length) { if (joined(n, shade)) found++; return; }
      var x = maybe[j], r = Math.floor(x / n), c = x % n;
      if (canWhite(x)) { state[x] = 1; go(j + 1); delete state[x]; }
      var nbShaded = (r > 0 && shade[x - n]) || (r < n - 1 && shade[x + n]) || (c > 0 && shade[x - 1]) || (c < n - 1 && shade[x + 1]);
      if (!nbShaded) { state[x] = 2; shade[x] = 1; go(j + 1); shade[x] = 0; delete state[x]; }
    })(0);
    return found;
  }
  function makePuzzle(sp, rnd) {
    var n = sp.n;
    for (var attempt = 0; attempt < 300; attempt++) {
      var rows = rnd.shuffle(Array.apply(null, { length: n }).map(function (_, i) { return i; }));
      var cols = rnd.shuffle(rows.slice()), nums = rnd.shuffle(rows.map(function (x) { return x + 1; }));
      var g = [];
      for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) g.push(nums[(rows[r] + cols[c]) % n]);
      // shade about a fifth of the squares, never side by side, keeping the white joined
      var shade = g.map(function () { return 0; });
      rnd.shuffle(g.map(function (_, i) { return i; })).forEach(function (i) {
        if (shade.filter(Boolean).length >= Math.round(n * n * 0.22)) return;
        var rr = Math.floor(i / n), cc = i % n;
        if ((rr > 0 && shade[i - n]) || (rr < n - 1 && shade[i + n]) || (cc > 0 && shade[i - 1]) || (cc < n - 1 && shade[i + 1])) return;
        shade[i] = 1;
        if (!joined(n, shade)) shade[i] = 0;
      });
      // a shaded square takes a number that is already in its row or column, so it has to go
      var ok = true;
      for (var i = 0; i < n * n && ok; i++) {
        if (!shade[i]) continue;
        var rr = Math.floor(i / n), cc = i % n, opts = [];
        for (var k = 0; k < n; k++) { if (k !== cc && !shade[rr * n + k]) opts.push(g[rr * n + k]); if (k !== rr && !shade[k * n + cc]) opts.push(g[k * n + cc]); }
        if (!opts.length) ok = false; else g[i] = rnd.pick(opts);
      }
      if (!ok) continue;
      if (count(n, g, 2) === 1) return { n: n, g: g, shade: shade };
    }
    return null;
  }

  var css = [
    '.hi-grid{--n:5;display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:4px;width:min(100%,calc(100svh - 18rem),26rem);direction:ltr;}',
    '.hi-cell{aspect-ratio:1;min-width:0;border-radius:10px;border:2px solid var(--line);background:var(--surface);padding:0;cursor:pointer;',
    'display:grid;place-items:center;font-family:var(--font-display);font-weight:900;font-size:calc(min(100vw - 3rem,26rem) / var(--n) * .5);line-height:1;color:var(--ink);}',
    '.hi-cell.is-shade{background:var(--c-black);border-color:var(--c-black);color:var(--ink-soft);}',
    '.hi-cell.is-keep{box-shadow:inset 0 0 0 4px var(--c-green);border-radius:50%;}',
    '.hi-cell.is-dup{color:var(--c-red);}',
    '.hi-cell.is-touch{outline:4px solid var(--c-yellow);outline-offset:-4px;}',
    '.hi-cell.is-tip{box-shadow:0 0 0 4px var(--c-purple);}',
    '.hi-cell.is-wrong{box-shadow:0 0 0 4px var(--c-red);}',
    '.hi-rule{margin:0;font-weight:700;font-size:1rem;text-align:center;max-width:26rem;line-height:1.35;}',
    '.hi-acts{flex-wrap:nowrap;gap:.3rem;width:100%;max-width:26rem;}.hi-acts .btn{flex:1 1 auto;min-width:0;padding-inline:.4rem;font-size:.95rem;white-space:nowrap;}',
    '@media (min-width:900px){.g-split .hi-grid{width:min(calc(100svh - 12.5rem),34rem);flex:none;}.g-split .hi-cell{font-size:calc(min(100svh - 12.5rem,34rem) / var(--n) * .5);}}'
  ].join('');

  BrainGames.register({
    id: 'hitori',
    name: 'מחיקת כפולים',
    skill: 'attention',
    isNew: true,
    tagline: 'השחירו משבצות עד שאין מספר כפול בשורה',
    benefit: 'קשב לפרטים וחשיבה לוגית',
    instructions: [
      'השחירו משבצות כך שבכל שורה ובכל טור אף מספר לא יופיע פעמיים (מספרים כפולים נצבעים אדום).',
      'שתי משבצות שחורות לא נוגעות זו בזו מהצד. כל המשבצות הלבנות נשארות מחוברות יחד.',
      'לחיצה על משבצת: פעם אחת שחורה, פעם שנייה עיגול ירוק (בטוח נשארת), פעם שלישית רגילה.',
      'יש "רמז", "↶ בטלו" ו"נקו". אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makePuzzle: makePuzzle, count: count, joined: joined },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = sp.n <= 5 ? 3 : 2, round = 0, good = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) { ctx.finish({ correct: good, total: ROUNDS, note: 'פתרתם ' + good + ' מתוך ' + ROUNDS + ' לוחות' }); return; }
        ctx.setProgress(round, ROUNDS);
        var P = null;
        for (var t = 0; t < 5 && !P; t++) P = makePuzzle(sp, ctx);
        play(P);
      }

      function play(P) {
        root.innerHTML = '';
        root.__hi = P; // read by the automated tests
        var n = P.n, N = n * n, g = P.g;
        var m = g.map(function () { return 0; }); // 0 normal, 1 shaded, 2 kept
        var done = false, hints = 0, past = [], tip = null;
        var cells = [];
        for (var i = 0; i < N; i++) (function (i) {
          cells.push(el('button', { class: 'hi-cell', type: 'button', onclick: function () { tap(i); } }, String(g[i])));
        })(i);
        var grid = el('div', { class: 'hi-grid', style: { '--n': n } }, cells);
        var rule = el('p', { class: 'hi-rule' }, 'בלי מספר כפול בשורה או בטור. שחורות לא נוגעות מהצד, והלבנות מחוברות.');
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var undoBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: undo }, '↶ בטלו');
        var clearBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: clearAll }, 'נקו');
        var acts = el('div', { class: 'g-actions hi-acts' }, [hintBtn, undoBtn, clearBtn]);
        root.classList.add('g-split');
        root.appendChild(grid);
        root.appendChild(el('div', { class: 'g-side' }, [rule, acts]));
        ctx.setStatus('השחירו את המספרים הכפולים');
        draw();

        function shadeArr() { return m.map(function (v) { return v === 1 ? 1 : 0; }); }
        function draw() {
          var dup = {}, touch = {};
          for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) {
            var i = r * n + c; if (m[i] === 1) {
              if (c < n - 1 && m[i + 1] === 1) touch[i] = touch[i + 1] = true;
              if (r < n - 1 && m[i + n] === 1) touch[i] = touch[i + n] = true;
              continue;
            }
            for (var k = 0; k < n; k++) {
              var a = r * n + k, b = k * n + c;
              if (k !== c && m[a] !== 1 && g[a] === g[i]) dup[i] = true;
              if (k !== r && m[b] !== 1 && g[b] === g[i]) dup[i] = true;
            }
          }
          cells.forEach(function (b, i) {
            b.className = 'hi-cell' + (m[i] === 1 ? ' is-shade' : m[i] === 2 ? ' is-keep' : '') + (dup[i] ? ' is-dup' : '') + (touch[i] ? ' is-touch' : '') +
              (tip && (tip.i === i || (tip.cells && tip.cells.indexOf(i) !== -1)) ? (tip.wrong ? ' is-wrong' : ' is-tip') : '');
            b.setAttribute('aria-label', g[i] + (m[i] === 1 ? ', מושחר' : m[i] === 2 ? ', נשאר' : ''));
            b.disabled = done;
          });
          undoBtn.disabled = done || !past.length;
          clearBtn.disabled = done || !m.some(Boolean);
          hintBtn.disabled = done;
        }
        function tap(i) {
          if (done) return;
          ctx.sound('tap'); past.push(m.slice()); tip = null;
          m[i] = (m[i] + 1) % 3;
          draw(); check();
        }
        function undo() { if (done || !past.length) return; ctx.sound('tap'); m = past.pop(); tip = null; draw(); }
        function clearAll() { if (done) return; ctx.sound('tap'); past.push(m.slice()); m = m.map(function () { return 0; }); tip = null; ctx.setStatus('הלוח נוקה (אפשר "בטלו")'); draw(); }
        function check() {
          var sh = shadeArr();
          for (var i = 0; i < N; i++) if ((sh[i] === 1) !== !!P.shade[i]) {
            // a different shading that keeps every rule counts too
            var okRules = true;
            for (var r = 0; r < n && okRules; r++) { var sr = {}, sc = {}; for (var k = 0; k < n; k++) {
              var a = r * n + k, b = k * n + r;
              if (!sh[a]) { if (sr[g[a]]) okRules = false; sr[g[a]] = true; }
              if (!sh[b]) { if (sc[g[b]]) okRules = false; sc[g[b]] = true; }
              if (sh[a] && ((k < n - 1 && sh[a + 1]) || (r < n - 1 && sh[a + n]))) okRules = false;
            } }
            if (!okRules) return;
            if (!joined(n, sh)) { ctx.setStatus('אין כפולים, אבל המשבצות הלבנות לא מחוברות כולן'); return; }
            break;
          }
          done = true; draw();
          var ok = hints <= 2;
          if (ok) good++;
          ctx.setStatus('מצוין! אין יותר כפולים');
          ctx.feedback(ok, ok ? undefined : 'פתרתם, בעזרת רמזים').then(function () { return ctx.wait(700); }).then(nextRound);
        }
        /* a hint: a wrong mark first; else one rule that decides a square, without deciding it */
        function hint() {
          if (done) return;
          hints++;
          for (var i = 0; i < N; i++) if ((m[i] === 1 && !P.shade[i]) || (m[i] === 2 && P.shade[i])) {
            tip = { i: i, wrong: true }; ctx.setStatus(m[i] === 1 ? 'רמז: את המשבצת המסומנת באדום לא צריך להשחיר' : 'רמז: דווקא את המשבצת המסומנת באדום צריך להשחיר'); draw(); return;
          }
          // next to a shaded square: stays white
          for (i = 0; i < N; i++) {
            if (m[i] !== 1) continue;
            var r = Math.floor(i / n), c = i % n, nb = [];
            [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].forEach(function (p) { if (p[0] >= 0 && p[1] >= 0 && p[0] < n && p[1] < n && !m[p[0] * n + p[1]]) nb.push(p[0] * n + p[1]); });
            if (nb.length) { tip = { cells: nb }; ctx.setStatus('רמז: משבצות שחורות לא נוגעות מהצד, אז המשבצות המסומנות ליד השחורה נשארות לבנות. סמנו אותן בעיגול'); draw(); return; }
          }
          // a number between two equal numbers: the middle one stays white
          for (i = 0; i < N; i++) {
            if (m[i]) continue;
            r = Math.floor(i / n); c = i % n;
            if ((c > 0 && c < n - 1 && g[i - 1] === g[i + 1]) || (r > 0 && r < n - 1 && g[i - n] === g[i + n])) {
              tip = { i: i }; ctx.setStatus('רמז: המשבצת המסומנת נמצאת בין שני מספרים זהים. אחד מהם יושחר, והוא נוגע בה, אז היא נשארת לבנה');
              draw(); return;
            }
          }
          // a number with no twin in its row or column: always white
          for (i = 0; i < N; i++) {
            if (m[i]) continue;
            r = Math.floor(i / n); c = i % n;
            var twin = false;
            for (var k = 0; k < n; k++) { if (k !== c && g[r * n + k] === g[i]) twin = true; if (k !== r && g[k * n + c] === g[i]) twin = true; }
            if (!twin) { tip = { i: i }; ctx.setStatus('רמז: למספר במשבצת המסומנת אין כפיל בשורה ובטור שלו, אז לא צריך להשחיר אותו'); draw(); return; }
          }
          ctx.setStatus('רמז: חפשו שני מספרים זהים צמודים: אחד מהם יושחר, אז כל מספר זהה אחר באותה שורה יושחר');
        }
      }

      nextRound();
      return function cleanup() { root.classList.remove('g-split'); };
    }
  });
})();
