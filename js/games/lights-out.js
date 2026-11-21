/* כבו את האורות — a grid of lamps; pressing a lamp switches it and its neighbours. Turn all the lamps off
   (later: all on, or neighbours on the diagonals). Logic, planning. Every board is made by pressing lamps of a
   solved board, so it can always be solved; the fewest presses is found by solving the equations over GF(2).
   Untimed. */
(function () {
  'use strict';

  /* Level 1–50: R × C lamps, lo…hi = fewest presses needed, shape 'plus' (up, down, right, left) or 'x'
     (the four diagonals), on = the goal is all lamps on, slack = extra presses still counted as success. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    var s;
    if (L <= 4) s = { R: 3, C: 3, lo: 1, hi: 2 };
    else if (L <= 8) s = { R: 3, C: 3, lo: 2, hi: 4 };
    else if (L <= 14) s = { R: 4, C: 4, lo: 2, hi: 4 };
    else if (L <= 20) s = { R: 4, C: 4, lo: 4, hi: 6 };
    else if (L <= 26) s = { R: 5, C: 5, lo: 3, hi: 5 };
    else if (L <= 32) s = { R: 5, C: 5, lo: 5, hi: 7 };
    else if (L <= 40) s = { R: 5, C: 5, lo: 5, hi: 8 };
    else if (L <= 44) s = { R: 4, C: 4, lo: 3, hi: 6 };
    else s = { R: 5, C: 5, lo: 4, hi: 8 };
    s.shape = L >= 41 ? 'x' : 'plus';
    s.on = (L >= 33 && L <= 40 && L % 2 === 1) || (L >= 45 && L % 2 === 0);
    s.slack = L <= 10 ? 3 : 2;
    return s;
  }

  /* Cells switched by pressing cell i. */
  function effect(R, C, shape, i) {
    var r = Math.floor(i / C), c = i % C, out = [i];
    var d = shape === 'x' ? [[-1, -1], [-1, 1], [1, -1], [1, 1]] : [[-1, 0], [1, 0], [0, -1], [0, 1]];
    d.forEach(function (v) {
      var rr = r + v[0], cc = c + v[1];
      if (rr >= 0 && rr < R && cc >= 0 && cc < C) out.push(rr * C + cc);
    });
    return out;
  }
  function press(R, C, shape, state, i) {
    var s = state.slice();
    effect(R, C, shape, i).forEach(function (k) { s[k] = s[k] ? 0 : 1; });
    return s;
  }

  /* Fewest presses that turn state into goal (all = goalVal): Gaussian elimination over GF(2), then every
     choice of the free presses is tried. Returns the list of cells to press, or null. */
  function solve(R, C, shape, state, goalVal) {
    var N = R * C, rows = [], i, j;
    for (i = 0; i < N; i++) {
      // row i: which presses switch cell i (pressing is symmetric), bit N = must switch
      var row = 0;
      effect(R, C, shape, i).forEach(function (k) { row |= 1 << k; });
      if ((state[i] ? 1 : 0) !== goalVal) row |= 1 << N;
      rows.push(row);
    }
    var pivots = [], r = 0;
    for (var col = 0; col < N && r < N; col++) {
      var p = -1;
      for (i = r; i < N; i++) if (rows[i] & (1 << col)) { p = i; break; }
      if (p < 0) continue;
      var t = rows[p]; rows[p] = rows[r]; rows[r] = t;
      for (i = 0; i < N; i++) if (i !== r && (rows[i] & (1 << col))) rows[i] ^= rows[r];
      pivots.push(col); r++;
    }
    for (i = r; i < N; i++) if (rows[i] & (1 << N)) return null; // no solution
    var isPivot = {};
    pivots.forEach(function (c) { isPivot[c] = true; });
    var free = [];
    for (j = 0; j < N; j++) if (!isPivot[j]) free.push(j);
    var best = null, bestW = 1e9;
    for (var m = 0; m < (1 << free.length); m++) {
      var x = 0;
      free.forEach(function (f, b) { if (m & (1 << b)) x |= 1 << f; });
      for (i = 0; i < pivots.length; i++) {
        var rhs = (rows[i] >> N) & 1;
        var rest = rows[i] & x & ~(1 << pivots[i]);
        var par = 0; while (rest) { par ^= 1; rest &= rest - 1; }
        if (rhs ^ par) x |= 1 << pivots[i];
      }
      var w = 0, y = x; while (y) { w++; y &= y - 1; }
      if (w < bestW) { bestW = w; best = x; }
    }
    var out = [];
    for (j = 0; j < N; j++) if (best & (1 << j)) out.push(j);
    return out;
  }

  function makePuzzle(sp, rnd) {
    var N = sp.R * sp.C, goalVal = sp.on ? 1 : 0;
    for (var relax = 0; relax < 6; relax++) {
      var lo = Math.max(1, sp.lo - relax);
      for (var t = 0; t < 80; t++) {
        var k = rnd.randInt(sp.lo, sp.hi), cells = [];
        for (var i = 0; i < N; i++) cells.push(i);
        var picks = rnd.shuffle(cells).slice(0, k);
        var state = cells.map(function () { return goalVal; });
        picks.forEach(function (p) { state = press(sp.R, sp.C, sp.shape, state, p); });
        var sol = solve(sp.R, sp.C, sp.shape, state, goalVal);
        if (!sol || sol.length < lo || sol.length > sp.hi) continue;
        return { R: sp.R, C: sp.C, shape: sp.shape, goal: goalVal, start: state, opt: sol.length };
      }
    }
    return null;
  }

  var css = [
    '.lo-wrap{display:flex;flex-direction:column;align-items:center;gap:.65rem;width:100%;}',
    '.lo-rule{display:flex;align-items:center;gap:.7rem;background:var(--surface-2);border-radius:var(--radius);padding:.45rem .7rem;width:100%;max-width:26rem;}',
    '.lo-rule p{margin:0;font-weight:700;font-size:1.05rem;line-height:1.35;}',
    '.lo-rule b{font-weight:900;}',
    '.lo-mini{display:grid;grid-template-columns:repeat(3,1rem);gap:2px;flex:none;}',
    '.lo-mini span{width:1rem;height:1rem;border-radius:3px;background:var(--line);}',
    '.lo-mini span.on{background:var(--c-yellow);}',
    '.lo-mini span.me{background:var(--c-yellow);box-shadow:0 0 0 2px var(--ink);}',
    '.lo-grid{display:grid;grid-template-columns:repeat(var(--c),minmax(0,1fr));gap:.4rem;width:min(100%,max(calc((100svh - 24rem) * var(--c) / var(--r)), 82vw),24rem);direction:ltr;}',
    '.lo-lamp{aspect-ratio:1;min-width:0;border-radius:50%;border:3px solid var(--line);background:var(--surface-2);cursor:pointer;padding:0;transition:background .15s,box-shadow .15s;}',
    '.lo-lamp.is-on{background:var(--c-yellow);border-color:var(--c-yellow);box-shadow:0 0 14px var(--c-yellow);}',
    '.lo-lamp.is-hint{outline:5px solid var(--c-green);outline-offset:2px;}',
    '.lo-count{font-weight:700;color:var(--ink-soft);font-size:1.05rem;}',
    '.lo-row{display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;width:100%;}',
    '.lo-row .btn{min-height:3.2rem;padding-inline:.7rem;font-size:1.1rem;flex:0 1 auto;white-space:nowrap;}',
    '.lo-actions{flex-wrap:nowrap;gap:.4rem;}'
  ].join('');

  BrainGames.register({
    id: 'lights-out',
    name: 'כבו את האורות',
    skill: 'logic',
    isNew: true,
    tagline: 'כל לחיצה מחליפה מנורה ואת השכנות שלה',
    benefit: 'חשיבה לוגית ותכנון',
    instructions: [
      'לחיצה על מנורה מדליקה או מכבה אותה, וגם את המנורות שצמודות אליה: למעלה, למטה, ימין ושמאל.',
      'המטרה: לכבות את כל האורות, בכמה שפחות לחיצות.',
      'בהמשך יש לוחות שבהם צריך להדליק את כולן, או שהשכנות הן באלכסון. הכלל כתוב תמיד מעל הלוח.',
      'אין שעון. יש "בטלו", "התחלה מחדש" ו"רמז".'
    ],
    css: css,
    _model: { spec: spec, makePuzzle: makePuzzle, solve: solve, press: press, effect: effect },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = 3, round = 0, good = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: good, total: ROUNDS, note: 'פתרתם ' + good + ' מתוך ' + ROUNDS + ' לוחות במספר לחיצות טוב' });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var P = null;
        for (var t = 0; t < 5 && !P; t++) P = makePuzzle(sp, ctx);
        play(P);
      }

      function play(P) {
        root.innerHTML = '';
        var R = P.R, C = P.C, N = R * C, cur = P.start.slice(), hist = [], hints = 0, done = false;
        var budget = P.opt + sp.slack;
        var mini = el('div', { class: 'lo-mini', 'aria-hidden': 'true' });
        var pat = effect(3, 3, P.shape, 4);
        for (var i = 0; i < 9; i++) mini.appendChild(el('span', { class: i === 4 ? 'me' : pat.indexOf(i) >= 0 ? 'on' : '' }));
        var rule = el('div', { class: 'lo-rule' }, [mini, el('p', null,
          P.shape === 'x' ? ['כל לחיצה מחליפה את המנורה ואת השכנות שלה ', el('b', null, 'באלכסון'), ' (צורת X)']
            : 'כל לחיצה מחליפה את המנורה ואת השכנות שלה: למעלה, למטה, ימין ושמאל')]);
        var countEl = el('div', { class: 'lo-count' });
        var lamps = [];
        for (i = 0; i < N; i++) (function (i) {
          lamps.push(el('button', { class: 'lo-lamp', type: 'button', 'aria-label': 'מנורה ' + (i + 1), onclick: function () { tap(i); } }));
        })(i);
        var grid = el('div', { class: 'lo-grid', style: { '--c': C, '--r': R } }, lamps);
        var undoBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: undo }, 'בטלו');
        var resetBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: reset }, 'התחלה מחדש');
        var hintBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: hint }, 'רמז');
        var actions = el('div', { class: 'lo-row lo-actions' }, [undoBtn, resetBtn, hintBtn]);
        root.appendChild(el('div', { class: 'lo-wrap' }, [rule, countEl, grid, actions]));
        var baseStatus = P.goal ? 'הפעם הפוך: הדליקו את כל המנורות' : 'כבו את כל המנורות';
        ctx.setStatus(baseStatus);
        draw();

        function clearHint() { lamps.forEach(function (b) { b.classList.remove('is-hint'); }); }
        function draw() {
          lamps.forEach(function (b, i) {
            b.classList.toggle('is-on', !!cur[i]);
            b.setAttribute('aria-pressed', cur[i] ? 'true' : 'false');
            b.disabled = done;
          });
          countEl.textContent = 'לחיצות: ' + hist.length + ' · אפשר ב-' + P.opt;
          undoBtn.disabled = resetBtn.disabled = done || !hist.length;
          hintBtn.disabled = done;
        }
        function tap(i) {
          if (done) return;
          ctx.sound('tap');
          hist.push(cur);
          cur = press(R, C, P.shape, cur, i);
          clearHint();
          ctx.setStatus(baseStatus);
          draw(); check();
        }
        function undo() { if (done || !hist.length) return; cur = hist.pop(); clearHint(); ctx.setStatus(baseStatus); draw(); }
        function reset() { if (done) return; cur = P.start.slice(); hist = []; clearHint(); ctx.setStatus(baseStatus); draw(); }
        function hint() {
          if (done) return;
          var sol = solve(R, C, P.shape, cur, P.goal);
          if (!sol || !sol.length) return;
          hints++;
          clearHint();
          lamps[ctx.pick(sol)].classList.add('is-hint');
          ctx.setStatus('רמז: לחצו על המנורה בעיגול הירוק');
        }
        function check() {
          for (var i = 0; i < N; i++) if (cur[i] !== P.goal) return;
          done = true;
          var ok = hist.length <= budget && hints <= 1;
          if (ok) good++;
          draw();
          ctx.setStatus(ok ? (P.goal ? 'מצוין! כל האורות דולקים' : 'מצוין! כל האורות כבויים') : hints > 1 ? 'פתרתם, בעזרת רמזים' : 'פתרתם, אבל אפשר בפחות לחיצות');
          ctx.feedback(ok, ok ? (hist.length <= P.opt ? 'במספר הלחיצות הקטן ביותר!' : 'כל הכבוד!') : 'אפשר היה ב-' + P.opt + ' לחיצות').then(function () {
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
