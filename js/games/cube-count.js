/* כמה קוביות? — count the cubes in a 3D stack, including the hidden ones underneath (perception). Untimed.
   Stacks are built so that every column's top can be seen (back columns are never lower than the
   ones in front), so the count can always be worked out: no cube floats in the air. */
(function () {
  'use strict';

  var ROUNDS = 7;

  /* Per level (1–30): grid w × d, tallest stack, gaps = some places stay empty,
     ask: count (how many cubes), box (how many are missing to fill a w × d × h box), diff (two stacks). */
  var LEVELS = [
    { w: 2, d: 2, h: 1, ask: 'count' }, { w: 2, d: 2, h: 2, ask: 'count' }, { w: 3, d: 2, h: 2, ask: 'count' },
    { w: 3, d: 3, h: 2, ask: 'count' }, { w: 3, d: 3, h: 2, ask: 'count', gaps: true }, { w: 3, d: 3, h: 3, ask: 'count' },
    { w: 4, d: 3, h: 2, ask: 'count' }, { w: 4, d: 3, h: 3, ask: 'count' }, { w: 4, d: 4, h: 2, ask: 'count' },
    { w: 4, d: 4, h: 3, ask: 'count' }, { w: 4, d: 3, h: 3, ask: 'count', gaps: true }, { w: 4, d: 4, h: 3, ask: 'count', gaps: true },
    { w: 4, d: 4, h: 4, ask: 'count' }, { w: 4, d: 4, h: 4, ask: 'count', gaps: true }, { w: 5, d: 4, h: 3, ask: 'count' },
    { w: 5, d: 4, h: 4, ask: 'count' }, { w: 5, d: 4, h: 4, ask: 'count', gaps: true }, { w: 5, d: 5, h: 3, ask: 'count' },
    { w: 5, d: 5, h: 4, ask: 'count' }, { w: 5, d: 5, h: 4, ask: 'count', gaps: true },
    { w: 3, d: 2, h: 2, ask: 'box' }, { w: 3, d: 3, h: 2, ask: 'box' }, { w: 3, d: 3, h: 3, ask: 'box' },
    { w: 4, d: 3, h: 3, ask: 'box' }, { w: 4, d: 4, h: 3, ask: 'box' },
    { w: 3, d: 3, h: 2, ask: 'diff' }, { w: 3, d: 3, h: 3, ask: 'diff' }, { w: 4, d: 3, h: 3, ask: 'diff' },
    { w: 4, d: 3, h: 3, ask: 'diff', gaps: true }, { w: 4, d: 4, h: 3, ask: 'diff' }
  ];

  /* heights[y][x]: x to the right, y going back. Back rows and left columns are never lower. */
  function makeStack(spec, rnd) {
    for (var attempt = 0; attempt < 200; attempt++) {
      var H = [];
      for (var y = spec.d - 1; y >= 0; y--) H[y] = [];
      for (var yy = spec.d - 1; yy >= 0; yy--) {
        for (var x = 0; x < spec.w; x++) {
          var cap = spec.h;
          if (yy < spec.d - 1) cap = Math.min(cap, H[yy + 1][x]);   // the row behind is not lower
          if (x > 0) cap = Math.min(cap, H[yy][x - 1]);             // the column to the left is not lower
          var lo = spec.gaps ? 0 : Math.min(1, cap);
          H[yy][x] = rnd.randInt(lo, cap);
        }
      }
      var total = count(H);
      if (total < 2) continue;
      if (spec.h > 1 && !H.some(function (row) { return row.some(function (v) { return v >= 2; }); })) continue;
      return H;
    }
    return [[1]];
  }
  function count(H) { return H.reduce(function (s, row) { return s + row.reduce(function (a, b) { return a + b; }, 0); }, 0); }
  // cubes with at least one face that can be seen (top, front or right side)
  function visible(H) {
    var v = 0, d = H.length, w = H[0].length;
    for (var y = 0; y < d; y++) for (var x = 0; x < w; x++) for (var z = 0; z < H[y][x]; z++) {
      var top = z === H[y][x] - 1;
      var front = y === 0 || H[y - 1][x] <= z;
      var right = x === w - 1 || H[y][x + 1] <= z;
      if (top || front || right) v++;
    }
    return v;
  }

  /* ---------- isometric drawing ---------- */
  var NS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) { var e = document.createElementNS(NS, tag); Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
  var C30 = Math.cos(Math.PI / 6), S30 = 0.5;
  // x goes to the front-right (down-right on screen), y goes back (up-right), z up
  function proj(x, y, z) { return [(x + y) * C30, (x - y) * S30 - z]; }
  function drawStack(H, ghostH) {
    var d = H.length, w = H[0].length;
    var s = svgEl('svg', { class: 'cc-svg', 'aria-hidden': 'true' });
    var polys = [];
    var top = ghostH || 0;
    var maxZ = Math.max(top, H.reduce(function (m, r) { return Math.max(m, Math.max.apply(null, r)); }, 0));
    function face(pts, cls) { polys.push(svgEl('polygon', { points: pts.map(function (p) { return p[0].toFixed(3) + ',' + p[1].toFixed(3); }).join(' '), class: cls })); }
    // draw from the back (large y, small x) to the front
    var cellsOrder = [];
    for (var y = 0; y < d; y++) for (var x = 0; x < w; x++) cellsOrder.push([x, y]);
    // farther columns first: depth grows with y and shrinks with x
    cellsOrder.sort(function (a, b) { return ((b[1] - b[0]) - (a[1] - a[0])) || (a[0] - b[0]); });
    cellsOrder.forEach(function (c) {
      for (var z = 0; z < H[c[1]][c[0]]; z++) {
        var X = c[0], Y = c[1];
        // points of the cube at (X..X+1, Y..Y+1, z..z+1); seen from the front-right
        var p = function (dx, dy, dz) { return proj(X + dx, Y + dy, z + dz); };
        face([p(0, 0, 1), p(1, 0, 1), p(1, 1, 1), p(0, 1, 1)], 'cc-top');
        face([p(0, 0, 0), p(1, 0, 0), p(1, 0, 1), p(0, 0, 1)], 'cc-front');
        face([p(1, 0, 0), p(1, 1, 0), p(1, 1, 1), p(1, 0, 1)], 'cc-side');
      }
    });
    if (ghostH) {
      // outline of the full box to fill
      var b = function (dx, dy, dz) { return proj(dx, dy, dz); };
      var edges = [[b(0, 0, top), b(w, 0, top)], [b(w, 0, top), b(w, d, top)], [b(w, d, top), b(0, d, top)], [b(0, d, top), b(0, 0, top)],
        [b(0, 0, 0), b(0, 0, top)], [b(w, 0, 0), b(w, 0, top)], [b(w, d, 0), b(w, d, top)], [b(0, 0, 0), b(w, 0, 0)], [b(w, 0, 0), b(w, d, 0)]];
      edges.forEach(function (e) { polys.push(svgEl('line', { x1: e[0][0], y1: e[0][1], x2: e[1][0], y2: e[1][1], class: 'cc-box' })); });
    }
    polys.forEach(function (pl) { s.appendChild(pl); });
    // view box around everything
    var xs = [], ys = [];
    [[0, 0], [w, 0], [0, d], [w, d]].forEach(function (q) { [0, maxZ].forEach(function (z) { var pp = proj(q[0], q[1], z); xs.push(pp[0]); ys.push(pp[1]); }); });
    var minX = Math.min.apply(null, xs) - 0.2, minY = Math.min.apply(null, ys) - 0.2;
    s.setAttribute('viewBox', minX + ' ' + minY + ' ' + (Math.max.apply(null, xs) - minX + 0.2) + ' ' + (Math.max.apply(null, ys) - minY + 0.2));
    return s;
  }

  function numberChoices(ans, lures, rnd) {
    var out = [ans];
    lures.forEach(function (v) { if (v > 0 && out.indexOf(v) === -1 && out.length < 3) out.push(v); });
    rnd.shuffle([ans - 1, ans + 1, ans - 2, ans + 2, ans + 3]).forEach(function (v) { if (v >= 0 && out.indexOf(v) === -1 && out.length < 4) out.push(v); });
    return out.sort(function (a, b) { return a - b; });
  }

  function makeRound(spec, rnd) {
    if (spec.ask === 'diff') {
      var A = makeStack(spec, rnd), B, tries = 0;
      do { B = makeStack(spec, rnd); tries++; } while ((count(B) >= count(A)) && tries < 50);
      if (count(B) > count(A)) { var t = A; A = B; B = t; }
      if (count(B) === count(A)) {
        // take one cube off B's front-right corner (the lowest spot, so no cube is left hanging)
        for (var yy = 0; yy < B.length && count(B) === count(A); yy++) {
          for (var xx = B[0].length - 1; xx >= 0; xx--) if (B[yy][xx] > 0) { B[yy][xx]--; break; }
        }
      }
      var diff = count(A) - count(B);
      return { ask: 'diff', A: A, B: B, answer: diff, options: numberChoices(diff, [visible(A) - visible(B)], rnd),
        explain: 'בבניין א יש ' + count(A) + ' קוביות ובבניין ב ' + count(B) + ', ההפרש ' + diff + '.' };
    }
    var Hs = makeStack(spec, rnd);
    var total = count(Hs);
    if (spec.ask === 'box') {
      var full = spec.w * spec.d * spec.h;
      var miss = full - total;
      if (miss <= 0) return makeRound(spec, rnd);
      return { ask: 'box', H: Hs, full: spec.h, answer: miss, options: numberChoices(miss, [full - visible(Hs), total], rnd),
        explain: 'תיבה מלאה: ' + spec.w + '×' + spec.d + '×' + spec.h + ' = ' + full + ' קוביות. יש ' + total + ', אז חסרות ' + miss + '.' };
    }
    return { ask: 'count', H: Hs, answer: total, options: numberChoices(total, [visible(Hs)], rnd),
      explain: 'יש ' + total + ' קוביות, כולל אלה שמתחת ומאחור.' };
  }

  var css = [
    '.cc-fig{width:100%;max-width:min(20rem,calc(100dvh - 22rem));display:flex;justify-content:center;}',
    '.cc-two{display:grid;grid-template-columns:1fr 1fr;gap:.6rem;width:100%;max-width:26rem;}',
    '.cc-two figure{margin:0;display:flex;flex-direction:column;align-items:center;gap:.2rem;}',
    '.cc-two figcaption{font-weight:800;font-size:1.15rem;}',
    '.cc-svg{width:100%;height:auto;max-height:calc(100dvh - 24rem);display:block;}',
    '.cc-top{fill:var(--perception-soft);stroke:var(--ink);stroke-width:.03;stroke-linejoin:round;}',
    '.cc-front{fill:var(--perception);fill-opacity:.55;stroke:var(--ink);stroke-width:.03;stroke-linejoin:round;}',
    '.cc-side{fill:var(--perception);stroke:var(--ink);stroke-width:.03;stroke-linejoin:round;}',
    '.cc-box{stroke:var(--ink-soft);stroke-width:.04;stroke-dasharray:.12 .08;}',
    '.cc-choices{grid-template-columns:repeat(4,minmax(0,1fr));max-width:24rem;}',
    '.cc-choices .g-choice{font-size:1.7rem;font-variant-numeric:tabular-nums;}',
    '.cc-explain{margin:0;font-size:1.1rem;font-weight:700;text-align:center;text-wrap:balance;min-height:1.5rem;}'
  ].join('');

  BrainGames.register({
    id: 'cube-count',
    name: 'כמה קוביות?',
    skill: 'perception',
    tagline: 'ספרו את הקוביות, גם את אלה שמוסתרות',
    benefit: 'תפיסה מרחבית ודמיון בשלושה ממדים',
    instructions: [
      'יופיע בניין של קוביות. כל קובייה עומדת על הרצפה או על קובייה אחרת, אין קוביות באוויר.',
      'ספרו את כל הקוביות, גם את אלה שמסתתרות מתחת ומאחור.',
      'ברמות הגבוהות שואלים כמה קוביות חסרות כדי למלא תיבה, או כמה יותר יש בבניין אחד מבשני.',
      'בחרו את המספר. אין שעון.'
    ],
    css: css,
    _makeRound: makeRound,
    _levels: LEVELS,
    _count: count,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var round = 0, correct = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: correct, total: ROUNDS, note: 'ספרתם נכון ' + correct + ' מתוך ' + ROUNDS + ' בניינים' });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var R = makeRound(spec, ctx);
        root.innerHTML = '';
        if (R.ask === 'diff') {
          ctx.setStatus('כמה קוביות יש בבניין א יותר מבבניין ב?');
          var fa = el('figure'), fb = el('figure');
          fa.appendChild(drawStack(R.A)); fa.appendChild(el('figcaption', null, 'א'));
          fb.appendChild(drawStack(R.B)); fb.appendChild(el('figcaption', null, 'ב'));
          root.appendChild(el('div', { class: 'cc-two' }, [fa, fb]));
        } else {
          ctx.setStatus(R.ask === 'box' ? 'כמה קוביות חסרות כדי למלא את התיבה המקווקוות?' : 'כמה קוביות יש בבניין?');
          var fig = el('div', { class: 'cc-fig', role: 'img', 'aria-label': 'בניין קוביות' });
          fig.appendChild(drawStack(R.H, R.ask === 'box' ? R.full : 0));
          root.appendChild(fig);
        }
        var explain = el('p', { class: 'cc-explain', 'aria-live': 'polite' });
        var answered = false;
        var buttons = R.options.map(function (v) {
          return el('button', { class: 'g-choice', type: 'button', onclick: function () { choose(v, this); } }, String(v));
        });
        root.appendChild(el('div', { class: 'g-choices cc-choices' }, buttons));
        root.appendChild(explain);

        function choose(v, btn) {
          if (answered) return;
          answered = true;
          var ok = v === R.answer;
          if (ok) correct++;
          buttons.forEach(function (b) { b.disabled = true; if (+b.textContent === R.answer) b.classList.add('is-correct'); });
          if (!ok) btn.classList.add('is-wrong');
          explain.textContent = R.explain;
          ctx.feedback(ok, ok ? undefined : 'התשובה: ' + R.answer).then(function () { return ctx.wait(ok ? 700 : 1800); }).then(nextRound);
        }
      }

      nextRound();
    }
  });
})();
