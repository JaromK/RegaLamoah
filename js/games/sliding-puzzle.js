/* פאזל הזזה — the classic sliding puzzle: tiles in a frame with one empty place; slide tiles until the
   numbers are in order (later a real photo is whole again). Executive function, planning. Boards are mixed by
   legal moves from the solved board, so they can always be solved. Untimed. */
(function () {
  'use strict';

  /* Level 1–50: R × C board, k = random moves used to mix it, photo = a real photo on the tiles,
     numbers = numbers shown on the tiles, mark = tiles in their place get a green frame. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    var s;
    if (L <= 12) s = { R: 3, C: 3, k: 4 + Math.round((L - 1) * 1.4) };
    else if (L <= 24) s = { R: 4, C: 3, k: 12 + Math.round((L - 13) * 1.3) };
    else s = { R: 4, C: 4, k: 16 + Math.round((L - 25) * 1.1) };
    s.photo = L >= 16;
    s.numbers = L < 31;
    s.mark = L < 21;
    s.slackShare = L <= 12 ? 1 : L <= 24 ? 0.75 : 0.5;
    return s;
  }
  function budgetOf(sp, opt) { return opt + Math.max(6, Math.ceil(opt * sp.slackShare)); }

  function solved(R, C) { var a = []; for (var i = 1; i < R * C; i++) a.push(i); a.push(0); return a; }
  function neighbours(R, C, p) {
    var r = Math.floor(p / C), c = p % C, out = [];
    if (r > 0) out.push(p - C);
    if (r < R - 1) out.push(p + C);
    if (c > 0) out.push(p - 1);
    if (c < C - 1) out.push(p + 1);
    return out;
  }

  /* Mix by k random moves of the empty place, never straight back. Returns the board and the path of the
     empty place (from solved to now): walking it backwards solves the board. */
  function scramble(R, C, k, rnd) {
    var a = solved(R, C), b = R * C - 1, trail = [b];
    for (var i = 0; i < k; i++) {
      var prev = trail.length > 1 ? trail[trail.length - 2] : -1;
      var opts = neighbours(R, C, b).filter(function (q) { return q !== prev; });
      var q = rnd.pick(opts);
      a[b] = a[q]; a[q] = 0; b = q;
      trail.push(b);
    }
    return { tiles: a, trail: trail };
  }

  /* Manhattan distance plus linear conflicts (an estimate that never overshoots). Row and column tables are
     kept per board size so the search does no division. */
  var tables = {};
  function tableFor(R, C) {
    var k = R + 'x' + C;
    if (tables[k]) return tables[k];
    var row = [], col = [], N = R * C;
    for (var i = 0; i < N; i++) { row.push((i / C) | 0); col.push(i % C); }
    return (tables[k] = { row: row, col: col });
  }
  function lis(x) { // longest increasing subsequence of a short list
    var best = [], m = 0;
    for (var i = 0; i < x.length; i++) {
      best[i] = 1;
      for (var j = 0; j < i; j++) if (x[j] < x[i] && best[j] + 1 > best[i]) best[i] = best[j] + 1;
      if (best[i] > m) m = best[i];
    }
    return m;
  }
  function heuristic(a, R, C) {
    var T = tableFor(R, C), row = T.row, col = T.col, N = a.length;
    var h = 0, i, j, t, u, d;
    for (i = 0; i < N; i++) {
      t = a[i];
      if (!t) continue;
      d = row[t - 1] - row[i]; h += d < 0 ? -d : d;
      d = col[t - 1] - col[i]; h += d < 0 ? -d : d;
    }
    // in each line, the tiles that belong to it but stand in the wrong order: all but the longest run in order
    // must step out of the line and back (2 moves each)
    var seq = [], r, c;
    for (r = 0; r < R; r++) {
      seq.length = 0;
      for (c = 0; c < C; c++) { t = a[r * C + c]; if (t && row[t - 1] === r) seq.push(col[t - 1]); }
      h += 2 * (seq.length - lis(seq));
    }
    for (c = 0; c < C; c++) {
      seq.length = 0;
      for (r = 0; r < R; r++) { t = a[r * C + c]; if (t && col[t - 1] === c) seq.push(row[t - 1]); }
      h += 2 * (seq.length - lis(seq));
    }
    return h;
  }

  /* IDA*: the fewest moves and the path (positions the empty place visits). Gives up (null) after
     maxNodes nodes. */
  function solve(tiles, R, C, maxNodes) {
    var a = tiles.slice(), b = a.indexOf(0), nodes = 0, path = [], N = a.length;
    var bound = heuristic(a, R, C), nb = [];
    for (var p = 0; p < N; p++) nb.push(neighbours(R, C, p));
    var FOUND = -1, ABORT = -2;
    function goal() { for (var i = 0; i < N - 1; i++) if (a[i] !== i + 1) return false; return true; }
    function dfs(g, prev) {
      var h = heuristic(a, R, C), f = g + h;
      if (f > bound) return f;
      if (h === 0 && goal()) return FOUND;
      if (++nodes > maxNodes) return ABORT;
      var min = Infinity, list = nb[b];
      for (var i = 0; i < list.length; i++) {
        var q = list[i];
        if (q === prev) continue;
        var from = b;
        a[b] = a[q]; a[q] = 0; b = q; path.push(q);
        var t = dfs(g + 1, from);
        if (t === FOUND) return FOUND;
        path.pop(); a[q] = a[from]; a[from] = 0; b = from;
        if (t === ABORT) return ABORT;
        if (t < min) min = t;
      }
      return min;
    }
    for (;;) {
      var t = dfs(0, -1);
      if (t === FOUND) return { d: path.length, path: path.slice() };
      if (t === ABORT || t === Infinity) return null;
      bound = t;
    }
  }

  var GEN_NODES = 400000, HINT_NODES = 150000;

  function makePuzzle(sp, rnd) {
    var best = null;
    for (var t = 0; t < 12; t++) {
      var s = scramble(sp.R, sp.C, sp.k, rnd);
      var res = solve(s.tiles, sp.R, sp.C, GEN_NODES);
      var opt = res ? res.d : null;
      // need a real puzzle: at least 3 moves and most of the mixing kept
      var minOpt = Math.max(3, Math.floor(sp.k * 0.55));
      var P = { R: sp.R, C: sp.C, tiles: s.tiles, trail: s.trail, opt: opt };
      if (opt !== null && opt >= minOpt) return P;
      if (opt !== null && (!best || best.opt === null || opt > best.opt)) best = P;
      if (opt === null && !best) best = P;
    }
    return best;
  }

  var css = [
    '.sp-wrap{display:flex;flex-direction:column;align-items:center;gap:.6rem;width:100%;}',
    '.sp-top{display:flex;align-items:center;gap:.7rem;justify-content:center;order:-1;}', // above the board on a phone
    '.sp-info{display:flex;flex-direction:column;gap:.2rem;}',
    '.sp-top p{margin:0;font-weight:800;font-size:1.1rem;line-height:1.3;}',
    '.sp-peek{height:4.6rem;border-radius:var(--radius-sm);border:2px solid var(--line);background-size:cover;background-position:center;flex:none;}',
    /* the numbers target: as tall as the photo (4.6rem) whatever the number of rows */
    '.sp-goal{--g:calc((4.4rem - (var(--r) + 1) * 2px) / var(--r));display:grid;grid-template-columns:repeat(var(--c),var(--g));gap:2px;padding:2px;',
    'background:var(--ink);border-radius:6px;direction:ltr;flex:none;}',
    '.sp-goal span{height:var(--g);display:grid;place-items:center;background:var(--surface);color:var(--c-blue);border-radius:3px;font-weight:900;font-size:calc(var(--g) * .62);line-height:1;}',
    '.sp-goal span.is-blank{background:var(--ink-soft);}',
    '.sp-count{font-weight:700;color:var(--ink-soft);font-size:1.05rem;}',
    '.sp-board{display:grid;grid-template-columns:repeat(var(--c),minmax(0,1fr));gap:4px;padding:4px;background:var(--ink);border-radius:var(--radius-sm);',
    'width:min(100%,calc((100svh - var(--room)) * var(--c) / var(--r)),24rem);direction:ltr;}',
    '.sp-t{aspect-ratio:1;min-width:0;border:0;padding:0;border-radius:8px;background:var(--surface);color:var(--c-blue);cursor:pointer;position:relative;',
    'font-family:var(--font-display);font-weight:900;font-size:calc(min(100vw - 3rem,24rem) / var(--c) * .5);line-height:1;display:grid;place-items:center;',
    'background-repeat:no-repeat;}',
    '.sp-t.is-home{box-shadow:inset 0 0 0 4px var(--c-green);}',
    '.sp-t.is-hint{outline:5px solid var(--sun);outline-offset:-5px;z-index:1;}',
    '.sp-t.is-photo{font-size:1.05rem;}',
    '.sp-t.is-photo span{position:absolute;top:3px;right:3px;min-width:1.6rem;padding:0 .25rem;border-radius:999px;background:var(--surface);color:var(--ink);font-family:var(--font-body);font-weight:800;line-height:1.6rem;}',
    '.sp-blank{aspect-ratio:1;min-width:0;border-radius:8px;background:var(--ink-soft);}',
    '.sp-done .sp-board{gap:0;padding:0;}',
    '.sp-done .sp-t{border-radius:0;box-shadow:none;}',
    '.sp-row{display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;width:100%;}',
    '.sp-row .btn{min-height:3.2rem;padding-inline:.7rem;font-size:1.1rem;flex:0 1 auto;white-space:nowrap;}',
    '.sp-actions{flex-wrap:nowrap;gap:.4rem;}',
    /* a computer: the board as big as the screen allows, the target big beside it */
    '@media (min-width:900px){',
    '.app:has(.sp-wrap){max-width:72rem;}',
    '.sp-wrap{flex-direction:row;justify-content:center;align-items:center;gap:2.5rem;}',
    '.sp-wrap .sp-board{width:min(calc((100svh - 12.5rem) * var(--c) / var(--r)),38rem);flex:none;}',
    '.sp-wrap .sp-t{font-size:calc(min((100svh - 12.5rem) * var(--c) / var(--r),38rem) / var(--c) * .45);}',
    '.sp-wrap .sp-t.is-photo{font-size:1.2rem;}',
    '.sp-side{display:flex;flex-direction:column;align-items:center;gap:1.2rem;width:min(24rem,40%);}',
    '.sp-side .sp-top{flex-direction:column;text-align:center;}',
    '.sp-side .sp-peek{width:auto;height:min(18rem,calc(100svh - 26rem));}',
    '.sp-side .sp-goal{--g:2.6rem;}',
    '.sp-side .sp-top p{font-size:1.2rem;}',
    '}'
  ].join('');

  BrainGames.register({
    id: 'sliding-puzzle',
    name: 'פאזל הזזה',
    skill: 'executive',
    isNew: true,
    tagline: 'החליקו את המשבצות עד שהכול מסודר',
    benefit: 'תכנון, סדר פעולות וסבלנות',
    instructions: [
      'במסגרת יש משבצות ומקום אחד ריק.',
      'לחצו על משבצת שליד המקום הריק כדי להחליק אותה אליו. לחיצה על משבצת באותה שורה או באותו טור מזיזה את כל השורה.',
      'סדרו את המספרים לפי הסדר: 1, 2, 3... משמאל לימין ומלמעלה למטה. בהמשך מסדרים תמונה.',
      'אין שעון. אם נתקעים, יש "רמז".'
    ],
    css: css,
    _model: { spec: spec, scramble: scramble, solve: solve, heuristic: heuristic, makePuzzle: makePuzzle, budgetOf: budgetOf, solved: solved },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = sp.R * sp.C <= 9 ? 3 : 2, round = 0, good = 0;
      var photos = ctx.shuffle(((window.PhotoBank && window.PhotoBank.items) || []).filter(function (p) { return p.tier <= 2; }));
      if (!photos.length) sp.photo = false, sp.numbers = true;

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: good, total: ROUNDS, note: 'סידרתם ' + good + ' מתוך ' + ROUNDS + ' לוחות בלי הרבה עזרה' });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        play(makePuzzle(sp, ctx), sp.photo ? photos[(round - 1) % photos.length] : null);
      }

      function play(P, photo) {
        root.innerHTML = '';
        var R = P.R, C = P.C, N = R * C, a = P.tiles.slice(), trail = P.trail.slice(), moves = 0, hints = 0, done = false;
        var budget = P.opt !== null ? budgetOf(sp, P.opt) : budgetOf(sp, trail.length - 1);
        var M = Math.max(R, C), ox = (M - C) / 2, oy = (M - R) / 2;
        // the target is always shown: the whole photo, or the numbers in order
        var target;
        if (photo) target = el('div', { class: 'sp-peek', style: { backgroundImage: 'url(' + photo.src + ')', aspectRatio: C + ' / ' + R }, 'aria-hidden': 'true' });
        else {
          target = el('div', { class: 'sp-goal', style: { '--c': C, '--r': R }, 'aria-hidden': 'true' });
          for (var g0 = 1; g0 <= N; g0++) target.appendChild(el('span', { class: g0 === N ? 'is-blank' : '' }, g0 === N ? '' : String(g0)));
        }
        var countEl = el('div', { class: 'sp-count' });
        var top = el('div', { class: 'sp-top' }, [target, el('div', { class: 'sp-info' }, [
          el('p', null, photo ? 'המטרה: ' + photo.w : 'המטרה: המספרים לפי הסדר'), countEl])]);
        var board = el('div', { class: 'sp-board', style: { '--c': C, '--r': R, '--room': '22rem' } });
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var actions = el('div', { class: 'sp-row' }, [hintBtn]);
        // the board first; the target, the count and the button in a side part (beside the board on a computer)
        var wrap = el('div', { class: 'sp-wrap' }, [board, el('div', { class: 'g-side sp-side' }, [top, actions])]);
        root.appendChild(wrap);
        var baseStatus = photo && !sp.numbers ? 'לחצו על חלק ליד המקום הריק' : 'לחצו על משבצת ליד המקום הריק';
        ctx.setStatus(baseStatus);
        var hintAt = -1;
        draw();

        function draw() {
          board.innerHTML = '';
          for (var p = 0; p < N; p++) (function (p) {
            var t = a[p];
            if (!t) { board.appendChild(el('div', { class: 'sp-blank' })); return; }
            var cls = 'sp-t' + (photo ? ' is-photo' : '') + (sp.mark && t === p + 1 && !done ? ' is-home' : '') + (p === hintAt ? ' is-hint' : '');
            var style = {};
            if (photo) {
              var g = t - 1, pr = Math.floor(g / C), pc = g % C;
              style.backgroundImage = 'url(' + photo.src + ')';
              style.backgroundSize = (M * 100) + '% ' + (M * 100) + '%';
              style.backgroundPosition = ((pc + ox) / (M - 1) * 100) + '% ' + ((pr + oy) / (M - 1) * 100) + '%';
            }
            var label = photo ? (sp.numbers && !done ? el('span', null, String(t)) : null) : String(t);
            board.appendChild(el('button', { class: cls, type: 'button', style: style, 'aria-label': 'משבצת ' + t, disabled: done, onclick: function () { tap(p); } }, label));
          })(p);
          countEl.textContent = 'הזזות: ' + moves + (P.opt !== null ? ' · אפשר ב-' + P.opt : '');
          hintBtn.disabled = done;
        }
        function step(q) { // slide the tile at q into the empty place
          var b = a.indexOf(0);
          a[b] = a[q]; a[q] = 0;
          moves++;
          if (trail.length > 1 && trail[trail.length - 2] === q) trail.pop(); else trail.push(q);
        }
        function tap(p) {
          if (done) return;
          var b = a.indexOf(0);
          var br = Math.floor(b / C), bc = b % C, pr = Math.floor(p / C), pc = p % C;
          if (br !== pr && bc !== pc) { ctx.setStatus('אפשר להזיז רק משבצת שבשורה או בטור של המקום הריק'); return; }
          ctx.sound('tap');
          // move the tiles one by one, starting with the one next to the empty place
          var dr = Math.sign(pr - br), dc = Math.sign(pc - bc);
          while (a.indexOf(0) !== p) { var e = a.indexOf(0); step(e + dr * C + dc); }
          hintAt = -1;
          ctx.setStatus(baseStatus);
          draw(); check();
        }
        function hint() {
          if (done) return;
          hints++;
          var res = solve(a, R, C, HINT_NODES);
          var q = res && res.path.length ? res.path[0] : trail[trail.length - 2];
          hintAt = q;
          ctx.setStatus('רמז: לחצו על המשבצת המסומנת בצהוב');
          draw();
        }
        function check() {
          for (var i = 0; i < N - 1; i++) if (a[i] !== i + 1) return;
          done = true;
          var ok = hints <= 1 || (hints <= 3 && moves <= budget);
          if (ok) good++;
          wrap.classList.add('sp-done');
          // the empty corner is filled in when the picture is whole
          if (photo) a[N - 1] = N;
          draw();
          ctx.setStatus(ok ? 'מצוין! הכול מסודר' : 'סידרתם, בעזרת הרבה רמזים');
          ctx.feedback(ok, ok ? 'כל הכבוד!' : 'בפעם הבאה נסו עם פחות רמזים').then(function () {
            actions.innerHTML = '';
            { ctx.wait(600).then(nextRound); return; } // a correct answer moves on by itself
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
