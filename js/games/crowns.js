/* כתרים — the board is split into coloured areas. Put one crown in every row, every column and every area, and no
   two crowns may touch, not even at a corner. Every puzzle has exactly one solution. Logic. Untimed. */
(function () {
  'use strict';

  // area colours: soft fills (the crowns stay clear on them) with thick borders between areas
  var FILL = ['var(--c-red-soft)', 'var(--c-blue-soft)', 'var(--c-yellow-soft)', 'var(--c-green-soft)', 'var(--c-purple-soft)',
    'var(--c-black-soft)', 'var(--perception-soft)', 'var(--executive-soft)'];
  var AREA = ['האדום', 'הכחול', 'הצהוב', 'הירוק', 'הסגול', 'האפור', 'הוורוד', 'הכתום'];

  /* Level 1–50: n = board side (and number of crowns). */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    return { n: L <= 8 ? 5 : L <= 20 ? 6 : L <= 35 ? 7 : 8 };
  }

  // all ways to put n crowns, one per row and column, none touching, each area once (stop at `limit`)
  function solve(area, n, limit) {
    var out = [], col = [], usedC = {}, usedA = {};
    (function go(r) {
      if (out.length >= limit) return;
      if (r === n) { out.push(col.slice()); return; }
      for (var c = 0; c < n; c++) {
        if (usedC[c] || usedA[area[r][c]]) continue;
        if (r > 0 && Math.abs(col[r - 1] - c) <= 1) continue;
        col[r] = c; usedC[c] = usedA[area[r][c]] = true;
        go(r + 1);
        usedC[c] = usedA[area[r][c]] = false;
      }
    })(0);
    return out;
  }
  function makePuzzle(sp, rnd) {
    var n = sp.n;
    for (var attempt = 0; attempt < 400; attempt++) {
      // crowns: a random placement with no two touching
      var col = null;
      for (var t = 0; t < 50 && !col; t++) {
        var p = rnd.shuffle(Array.apply(null, { length: n }).map(function (_, i) { return i; }));
        if (p.every(function (c, r) { return r === 0 || Math.abs(p[r - 1] - c) > 1; })) col = p;
      }
      if (!col) continue;
      // areas grow from each crown, one square at a time, at uneven speeds (small areas make the puzzle unique)
      var area = Array.apply(null, { length: n }).map(function () { return Array.apply(null, { length: n }).map(function () { return -1; }); });
      var weight = col.map(function () { return rnd.randInt(1, 9); });
      col.forEach(function (c, r) { area[r][c] = r; });
      var left = n * n - n;
      while (left > 0) {
        var a = (function () { var total = weight.reduce(function (s, w) { return s + w; }, 0), x = rnd.randInt(1, total); for (var i = 0; i < n; i++) { x -= weight[i]; if (x <= 0) return i; } return n - 1; })();
        var edge = [];
        for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (area[r][c] === -1) {
          if ((r > 0 && area[r - 1][c] === a) || (r < n - 1 && area[r + 1][c] === a) || (c > 0 && area[r][c - 1] === a) || (c < n - 1 && area[r][c + 1] === a)) edge.push([r, c]);
        }
        if (!edge.length) { weight[a] = 0; if (weight.every(function (w) { return !w; })) break; continue; }
        var e = rnd.pick(edge); area[e[0]][e[1]] = a; left--;
      }
      if (left > 0) continue;
      if (solve(area, n, 2).length === 1) return { n: n, area: area, sol: col };
    }
    return null;
  }

  var css = [
    '.cr-grid{--n:6;display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));width:min(100%,calc(100svh - 18rem),28rem);direction:ltr;',
    'border:3px solid var(--ink);border-radius:8px;overflow:hidden;}',
    '.cr-cell{aspect-ratio:1;min-width:0;border:1px solid rgba(0,0,0,.12);padding:0;cursor:pointer;display:grid;place-items:center;',
    'font-size:calc(min(100vw - 3rem,28rem) / var(--n) * .52);line-height:1;color:var(--ink);}',
    '.cr-cell.bt{border-top:3px solid var(--ink);}.cr-cell.bb{border-bottom:3px solid var(--ink);}.cr-cell.bl{border-left:3px solid var(--ink);}.cr-cell.br{border-right:3px solid var(--ink);}',
    '.cr-cell.is-x{color:var(--ink-soft);font-size:calc(min(100vw - 3rem,28rem) / var(--n) * .4);}',
    '.cr-cell.is-bad{box-shadow:inset 0 0 0 4px var(--c-yellow);}',
    '.cr-cell.is-tip{box-shadow:inset 0 0 0 4px var(--c-purple);}',
    '.cr-cell.is-wrong{box-shadow:inset 0 0 0 4px var(--c-red);}',
    '.cr-rule{margin:0;font-weight:700;font-size:1rem;text-align:center;max-width:28rem;line-height:1.35;}',
    '.cr-acts{flex-wrap:nowrap;gap:.3rem;width:100%;max-width:28rem;}.cr-acts .btn{flex:1 1 auto;min-width:0;padding-inline:.4rem;font-size:.95rem;white-space:nowrap;}',
    '@media (min-width:900px){.g-split .cr-grid{width:min(calc(100svh - 12.5rem),36rem);flex:none;}.g-split .cr-cell{font-size:calc(min(100svh - 12.5rem,36rem) / var(--n) * .52);}}'
  ].join('');

  BrainGames.register({
    id: 'crowns',
    name: 'כתרים',
    skill: 'logic',
    isNew: true,
    tagline: 'כתר אחד בכל שורה, טור ואזור צבע',
    benefit: 'חשיבה לוגית ותכנון',
    instructions: [
      'הלוח מחולק לאזורים צבעוניים. שימו כתר 👑 אחד בכל שורה, בכל טור ובכל אזור.',
      'שני כתרים לא נוגעים זה בזה, גם לא באלכסון.',
      'לחיצה על משבצת: פעם אחת ✗ (אין כאן כתר), פעם שנייה 👑, פעם שלישית ריקה.',
      'כלל שנשבר מסומן בצהוב. יש "רמז", "↶ בטלו" ו"נקו". אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makePuzzle: makePuzzle, solve: solve },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = sp.n <= 6 ? 3 : 2, round = 0, good = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) { ctx.finish({ correct: good, total: ROUNDS, note: 'פתרתם ' + good + ' מתוך ' + ROUNDS + ' לוחות' }); return; }
        ctx.setProgress(round, ROUNDS);
        var P = null;
        for (var t = 0; t < 12 && !P; t++) P = makePuzzle(sp, ctx);
        if (!P) P = makePuzzle({ n: sp.n - 1 }, ctx) || makePuzzle({ n: 5 }, ctx); // very rare: a smaller board
        play(P);
      }

      function play(P) {
        root.innerHTML = '';
        root.__cr = P; // read by the automated tests
        var n = P.n, A = P.area;
        var colorOf = ctx.shuffle(FILL.map(function (_, i) { return i; })).slice(0, n); // area → colour
        var m = Array.apply(null, { length: n * n }).map(function () { return 0; }); // 0 empty, 1 ✗, 2 crown
        var done = false, hints = 0, past = [], tip = null;
        var cells = [];
        for (var i = 0; i < n * n; i++) (function (i) {
          var r = Math.floor(i / n), c = i % n, a = A[r][c];
          var cls = 'cr-cell' + (r === 0 || A[r - 1][c] !== a ? ' bt' : '') + (r === n - 1 || A[r + 1][c] !== a ? ' bb' : '') +
            (c === 0 || A[r][c - 1] !== a ? ' bl' : '') + (c === n - 1 || A[r][c + 1] !== a ? ' br' : '');
          cells.push(el('button', { class: cls, type: 'button', style: { background: FILL[colorOf[a]] }, onclick: function () { tap(i); } }));
        })(i);
        var grid = el('div', { class: 'cr-grid', style: { '--n': n } }, cells);
        var rule = el('p', { class: 'cr-rule' }, 'כתר 👑 אחד בכל שורה, בכל טור ובכל אזור צבע. כתרים לא נוגעים, גם לא באלכסון.');
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var undoBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: undo }, '↶ בטלו');
        var clearBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: clearAll }, 'נקו');
        var acts = el('div', { class: 'g-actions cr-acts' }, [hintBtn, undoBtn, clearBtn]);
        root.classList.add('g-split');
        root.appendChild(grid);
        root.appendChild(el('div', { class: 'g-side' }, [rule, acts]));
        ctx.setStatus('שימו ' + n + ' כתרים');
        draw();

        function crowns() { var out = []; m.forEach(function (v, i) { if (v === 2) out.push(i); }); return out; }
        function clash(i, j) {
          var ri = Math.floor(i / n), ci = i % n, rj = Math.floor(j / n), cj = j % n;
          return ri === rj || ci === cj || A[ri][ci] === A[rj][cj] || (Math.abs(ri - rj) <= 1 && Math.abs(ci - cj) <= 1);
        }
        function draw() {
          var cs = crowns(), bad = {};
          cs.forEach(function (i) { cs.forEach(function (j) { if (i !== j && clash(i, j)) bad[i] = bad[j] = true; }); });
          cells.forEach(function (b, i) {
            b.classList.toggle('is-x', m[i] === 1);
            b.classList.toggle('is-bad', !!bad[i]);
            b.classList.toggle('is-tip', !!tip && !tip.wrong && (tip.i === i || (!!tip.cells && tip.cells.indexOf(i) !== -1)));
            b.classList.toggle('is-wrong', !!tip && tip.i === i && !!tip.wrong);
            b.textContent = m[i] === 2 ? '👑' : m[i] === 1 ? '✗' : '';
            b.setAttribute('aria-label', 'שורה ' + (Math.floor(i / n) + 1) + ', טור ' + (i % n + 1) + (m[i] === 2 ? ': כתר' : m[i] === 1 ? ': אין כתר' : ''));
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
          var cs = crowns();
          if (cs.length < n) { ctx.setStatus('שמתם ' + cs.length + ' מתוך ' + n + ' כתרים'); return; }
          if (cs.some(function (i) { return cs.some(function (j) { return i !== j && clash(i, j); }); })) { ctx.setStatus('יש כתרים שנוגעים או חולקים שורה, טור או אזור (מסומנים בצהוב)'); return; }
          if (cs.length > n) return;
          done = true; draw();
          var ok = hints <= 2;
          if (ok) good++;
          ctx.setStatus('מצוין! כל הכתרים במקום');
          ctx.feedback(ok, ok ? undefined : 'פתרתם, בעזרת רמזים').then(function () { return ctx.wait(700); }).then(nextRound);
        }
        /* a hint points at a line or an area with one place left, or at a crown in the wrong place; never puts a crown */
        function hint() {
          if (done) return;
          hints++;
          var right = {};
          P.sol.forEach(function (c, r) { right[r * n + c] = true; });
          var wrong = crowns().filter(function (i) { return !right[i]; })[0];
          if (wrong !== undefined) { tip = { i: wrong, wrong: true }; ctx.setStatus('רמז: הכתר המסומן באדום לא במקום הנכון'); draw(); return; }
          // the squares where a crown can still go, given the right crowns already placed
          var good0 = crowns();
          var free = function (i) { return m[i] !== 2 && !good0.some(function (j) { return clash(i, j); }); };
          var groups = [];
          for (var r = 0; r < n; r++) groups.push({ name: 'בשורה ' + (r + 1), cells: Array.apply(null, { length: n }).map(function (_, c) { return r * n + c; }) });
          for (var c = 0; c < n; c++) groups.push({ name: 'בטור ' + (c + 1), cells: Array.apply(null, { length: n }).map(function (_, rr) { return rr * n + c; }) });
          for (var a = 0; a < n; a++) {
            var cs = []; for (var k = 0; k < n * n; k++) if (A[Math.floor(k / n)][k % n] === a) cs.push(k);
            groups.push({ name: 'באזור ' + AREA[colorOf[a]], cells: cs });
          }
          var done1 = function (g) { return g.cells.some(function (i) { return m[i] === 2; }); };
          var one = groups.filter(function (g) { return !done1(g) && g.cells.filter(free).length === 1; })[0];
          if (one) { tip = { i: one.cells.filter(free)[0] }; ctx.setStatus('רמז: ' + one.name + ' נשאר רק מקום אחד לכתר (מסומן)'); draw(); return; }
          // else the smallest area or line still open
          var small = groups.filter(function (g) { return !done1(g); }).sort(function (x, y) { return x.cells.filter(free).length - y.cells.filter(free).length; })[0];
          if (small) {
            var opts = small.cells.filter(free);
            tip = { cells: opts }; // every place still possible there, not one of them
            ctx.setStatus('רמז: ' + small.name + ' יש רק ' + opts.length + ' מקומות לכתר. נסו לבדוק כל אחד מהם');
            draw(); return;
          }
          ctx.setStatus('רמז: סמנו ✗ במשבצות שנוגעות בכתרים, וחפשו אזור שנשאר בו מקום אחד');
        }
      }

      nextRound();
      return function cleanup() { root.classList.remove('g-split'); };
    }
  });
})();
