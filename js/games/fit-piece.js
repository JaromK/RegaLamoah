/* החלק החסר — pick the piece that fills the hole in the board exactly (perception). */
(function () {
  'use strict';

  var ROUNDS = 7;

  // Per level (1–20): board size, hole size (cells), options shown, rotation allowed.
  var LEVELS = [
    { n: 4, hole: 2, options: 3, rot: false }, // 1
    { n: 4, hole: 3, options: 3, rot: false }, // 2
    { n: 4, hole: 3, options: 3, rot: false }, // 3
    { n: 4, hole: 4, options: 3, rot: false }, // 4
    { n: 5, hole: 4, options: 3, rot: false }, // 5
    { n: 5, hole: 4, options: 4, rot: false }, // 6
    { n: 5, hole: 5, options: 4, rot: false }, // 7
    { n: 5, hole: 5, options: 4, rot: false }, // 8
    { n: 5, hole: 6, options: 4, rot: false }, // 9
    { n: 5, hole: 6, options: 4, rot: false }, // 10
    { n: 4, hole: 3, options: 3, rot: true },  // 11
    { n: 4, hole: 4, options: 3, rot: true },  // 12
    { n: 5, hole: 4, options: 4, rot: true },  // 13
    { n: 5, hole: 5, options: 4, rot: true },  // 14
    { n: 5, hole: 5, options: 4, rot: true },  // 15
    { n: 5, hole: 6, options: 4, rot: true },  // 16
    { n: 5, hole: 6, options: 4, rot: true },  // 17
    { n: 5, hole: 6, options: 4, rot: true },  // 18
    { n: 5, hole: 7, options: 4, rot: true },  // 19
    { n: 5, hole: 7, options: 4, rot: true }   // 20
  ];
  var MAX_EXTENT = 4; // pieces stay within a 4 × 4 box so the option cards stay readable

  /* ---------- shape helpers (shape = array of [row, col]) ---------- */
  var DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  function normalize(s) {
    var minR = Infinity, minC = Infinity;
    s.forEach(function (p) { if (p[0] < minR) minR = p[0]; if (p[1] < minC) minC = p[1]; });
    return s.map(function (p) { return [p[0] - minR, p[1] - minC]; })
      .sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
  }
  function keyOf(s) { return normalize(s).map(function (p) { return p[0] + ',' + p[1]; }).join(';'); }
  function rot90(s) { return normalize(s.map(function (p) { return [p[1], -p[0]]; })); }
  function rotate(s, q) { var out = normalize(s); for (var i = 0; i < q; i++) out = rot90(out); return out; }
  function reflect(s) { return normalize(s.map(function (p) { return [p[0], -p[1]]; })); }
  function extent(s) {
    var h = 0, w = 0;
    s.forEach(function (p) { if (p[0] + 1 > h) h = p[0] + 1; if (p[1] + 1 > w) w = p[1] + 1; });
    return { h: h, w: w };
  }
  function small(s) { var e = extent(normalize(s)); return e.h <= MAX_EXTENT && e.w <= MAX_EXTENT; }
  function has(s, r, c) { for (var i = 0; i < s.length; i++) if (s[i][0] === r && s[i][1] === c) return true; return false; }
  function connected(s) {
    if (!s.length) return false;
    var seen = [s[0]], stack = [s[0]];
    while (stack.length) {
      var p = stack.pop();
      DIRS.forEach(function (d) {
        var r = p[0] + d[0], c = p[1] + d[1];
        if (has(s, r, c) && !has(seen, r, c)) { seen.push([r, c]); stack.push([r, c]); }
      });
    }
    return seen.length === s.length;
  }
  // Class key: with rotation allowed, all 4 turns count as the same piece.
  function classKey(s, rot) {
    if (!rot) return keyOf(s);
    var ks = [0, 1, 2, 3].map(function (q) { return keyOf(rotate(s, q)); }).sort();
    return ks[0];
  }
  function neighbours(s) {
    var out = [];
    s.forEach(function (p) {
      DIRS.forEach(function (d) {
        var r = p[0] + d[0], c = p[1] + d[1];
        if (!has(s, r, c) && !has(out, r, c)) out.push([r, c]);
      });
    });
    return out;
  }

  // Random connected hole of k cells inside an n × n board (absolute board coordinates).
  function growHole(n, k, rnd) {
    for (var attempt = 0; attempt < 300; attempt++) {
      var s = [[rnd.randInt(0, n - 1), rnd.randInt(0, n - 1)]];
      var guard = 0;
      while (s.length < k && guard++ < 200) {
        var nb = neighbours(s).filter(function (p) { return p[0] >= 0 && p[0] < n && p[1] >= 0 && p[1] < n; });
        if (!nb.length) break;
        var cand = s.concat([rnd.pick(nb)]);
        if (small(cand)) s = cand;
      }
      if (s.length === k) return s;
    }
    return null;
  }

  function addCell(s, rnd) {
    var nb = rnd.shuffle(neighbours(s));
    for (var i = 0; i < nb.length; i++) { var c = s.concat([nb[i]]); if (small(c)) return normalize(c); }
    return null;
  }
  function removeCell(s, rnd) {
    if (s.length < 2) return null;
    var idx = rnd.shuffle(s.map(function (p, i) { return i; }));
    for (var i = 0; i < idx.length; i++) {
      var rest = s.filter(function (p, j) { return j !== idx[i]; });
      if (connected(rest)) return normalize(rest);
    }
    return null;
  }
  function moveCell(s, rnd) {
    var idx = rnd.shuffle(s.map(function (p, i) { return i; }));
    for (var i = 0; i < idx.length; i++) {
      var rest = s.filter(function (p, j) { return j !== idx[i]; });
      if (!connected(rest)) continue;
      var nb = rnd.shuffle(neighbours(rest));
      for (var k = 0; k < nb.length; k++) {
        if (nb[k][0] === s[idx[i]][0] && nb[k][1] === s[idx[i]][1]) continue;
        var cand = rest.concat([nb[k]]);
        if (small(cand)) return normalize(cand);
      }
    }
    return null;
  }

  // Build one round: { n, hole (board coords), options: [shape], answer: index }.
  function makeRound(spec, rnd) {
    for (var attempt = 0; attempt < 300; attempt++) {
      var hole = growHole(spec.n, spec.hole, rnd);
      if (!hole) continue;
      var shape = normalize(hole);
      var target = classKey(shape, spec.rot);
      var used = {}; used[target] = true;
      var distractors = [];
      function tryAdd(s) {
        if (!s || !small(s) || distractors.length >= spec.options - 1) return;
        var k = classKey(s, spec.rot);
        if (used[k]) return;
        used[k] = true;
        distractors.push(normalize(s));
      }
      // 1. Same cell count, different look: the mirror image, or (without rotation) a turned copy.
      var near = [reflect(shape)];
      if (!spec.rot) near.push(rotate(shape, 1), rotate(shape, 2), rotate(shape, 3));
      rnd.shuffle(near).forEach(function (s) { if (distractors.length < 1) tryAdd(s); });
      // 2. Same count, one cell moved.
      tryAdd(moveCell(shape, rnd));
      // 3. One cell more or fewer (as a last resort only when needed).
      var extra = rnd.shuffle([function () { return addCell(shape, rnd); }, function () { return removeCell(shape, rnd); }]);
      for (var e = 0; e < 4 && distractors.length < spec.options - 1; e++) tryAdd(moveCell(shape, rnd));
      extra.forEach(function (f) { tryAdd(f()); });
      for (var g = 0; g < 10 && distractors.length < spec.options - 1; g++) tryAdd(rnd.pick(extra)());
      if (distractors.length < spec.options - 1) continue;
      var correct = spec.rot ? rotate(shape, rnd.randInt(0, 3)) : shape;
      var shown = distractors.map(function (s) { return spec.rot ? rotate(s, rnd.randInt(0, 3)) : s; });
      var options = rnd.shuffle([correct].concat(shown));
      return { n: spec.n, hole: hole, options: options, answer: options.indexOf(correct), rot: spec.rot };
    }
    return null;
  }

  // Does `piece` fill `hole` exactly? (the rule the player is judged by)
  function fitsHole(piece, hole, rot) {
    var hk = keyOf(hole);
    for (var q = 0; q < (rot ? 4 : 1); q++) if (keyOf(rotate(piece, q)) === hk) return true;
    return false;
  }

  var css = [
    '.fp-board{--n:4;display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:3px;direction:ltr;',
    'width:100%;max-width:min(13rem,calc(100dvh - 28rem));min-width:10rem;padding:5px;border-radius:var(--radius-sm);',
    'background:var(--surface);border:2px solid var(--line);}',
    '.fp-cell{aspect-ratio:1;border-radius:4px;background:var(--perception);}',
    '.fp-cell.fp-hole{background:var(--surface);border:2px dashed var(--ink-soft);}',
    '.fp-cell.fp-filled{background:var(--good);border:none;}',
    '.fp-cell.fp-filled-bad{background:var(--sun);border:none;}',
    '.fp-opts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.75rem;width:100%;max-width:20rem;}',
    '.fp-opts.fp-three{grid-template-columns:repeat(3,minmax(0,1fr));max-width:22rem;}',
    '.fp-opt.g-choice{min-height:3.5rem;padding:.6rem;display:flex;align-items:center;justify-content:center;position:relative;}',
    '.fp-mini{--n:4;display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:2px;direction:ltr;width:100%;max-width:4.2rem;}',
    '.fp-mini .fp-cell{background:transparent;}',
    '.fp-mini .fp-cell.fp-on{background:var(--perception);}',
    '.fp-opt.is-correct .fp-cell.fp-on{background:var(--good);}',
    '.fp-opt.is-wrong .fp-cell.fp-on{background:var(--bad);}',
    '.fp-mark{position:absolute;top:.2rem;inset-inline-start:.4rem;font-size:1.2rem;font-weight:900;line-height:1;}'
  ].join('');

  BrainGames.register({
    id: 'fit-piece',
    name: 'החלק החסר',
    skill: 'perception',
    tagline: 'מצאו את החלק שממלא את החור',
    benefit: 'תפיסת צורות והתאמה מרחבית',
    instructions: [
      'בלוח חסר חלק, והוא מסומן בקו מקווקו.',
      'מתחת ללוח יש כמה חלקים. רק אחד ממלא את החור בדיוק.',
      'לחצו על החלק המתאים.',
      'בשלבים מתקדמים החלק מוצג מסובב, ואפשר לסובב אותו בדמיון.'
    ],
    css: css,
    _model: { LEVELS: LEVELS, makeRound: makeRound, fitsHole: fitsHole, normalize: normalize },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var round = 0, score = 0;

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({
            correct: score,
            total: ROUNDS,
            note: 'השלמתם ' + score + ' מתוך ' + ROUNDS + ' לוחות עם חור של ' + spec.hole + ' משבצות'
          });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        playRound();
      }

      function playRound() {
        root.innerHTML = '';
        var R = makeRound(spec, ctx);
        var n = R.n;
        var holeMap = {};
        R.hole.forEach(function (p) { holeMap[p[0] * n + p[1]] = true; });
        var cells = [];
        for (var i = 0; i < n * n; i++) {
          cells.push(el('div', { class: 'fp-cell' + (holeMap[i] ? ' fp-hole' : '') }));
        }
        var board = el('div', { class: 'fp-board', style: { '--n': n }, role: 'img', 'aria-label': 'לוח עם חור של ' + R.hole.length + ' משבצות' }, cells);

        // all option cards share one box size so the pieces keep the same scale
        var box = 1;
        R.options.forEach(function (s) { var e = extent(s); box = Math.max(box, e.h, e.w); });
        var marks = [];
        var buttons = R.options.map(function (s, idx) {
          var e = extent(s);
          var offR = Math.floor((box - e.h) / 2), offC = Math.floor((box - e.w) / 2);
          var mini = [];
          for (var r = 0; r < box; r++) for (var c = 0; c < box; c++) {
            mini.push(el('div', { class: 'fp-cell' + (has(s, r - offR, c - offC) ? ' fp-on' : '') }));
          }
          var mark = el('span', { class: 'fp-mark', 'aria-hidden': 'true' }, '');
          marks.push(mark);
          return el('button', {
            class: 'g-choice fp-opt', type: 'button',
            'aria-label': 'חלק ' + (idx + 1) + ' (' + s.length + ' משבצות)',
            onclick: function () { onPick(idx); }
          }, [el('div', { class: 'fp-mini', style: { '--n': box } }, mini), mark]);
        });
        var opts = el('div', { class: 'fp-opts' + (buttons.length === 3 ? ' fp-three' : '') }, buttons);

        root.appendChild(board);
        root.appendChild(opts);
        ctx.setStatus(spec.rot ? 'איזה חלק מתאים? אפשר לסובב' : 'איזה חלק ממלא את החור?');

        var done = false;
        function onPick(idx) {
          if (done) return;
          done = true;
          ctx.sound('tap');
          buttons.forEach(function (b) { b.disabled = true; });
          var ok = idx === R.answer;
          if (ok) score++;
          buttons[idx].classList.add(ok ? 'is-correct' : 'is-wrong');
          marks[idx].textContent = ok ? '✓' : '✗';
          if (!ok) { buttons[R.answer].classList.add('is-correct'); marks[R.answer].textContent = '✓'; }
          R.hole.forEach(function (p) {
            var c = cells[p[0] * n + p[1]];
            c.classList.remove('fp-hole');
            c.classList.add('fp-filled');
          });
          ctx.setStatus(ok ? 'מצוין! החלק נכנס בדיוק' : 'החלק הירוק נכנס בדיוק');
          var why = '';
          if (!ok) {
            var picked = R.options[idx];
            if (picked.length !== R.hole.length) why = 'בחלק הזה ' + picked.length + ' משבצות, ובחור ' + R.hole.length;
            else why = 'הצורה של החלק שונה מהחור';
          }
          ctx.feedback(ok, ok ? undefined : why).then(function () {
            return ctx.wait(900);
          }).then(nextRound);
        }
      }

      nextRound();
    }
  });
})();
