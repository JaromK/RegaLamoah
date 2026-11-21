/* קיפול ונקב — a sheet is folded, a hole is punched; which sheet do you get when you open it? (perception)
   Folds: V = the right half over the left, H = the top half down, D = along the diagonal (top-right corner
   onto bottom-left). From level 31 also L = the left half over the right, U = the bottom half up, and
   E = along the other diagonal (top-left corner onto bottom-right). Answers come from exact mirror steps. Untimed. */
(function () {
  'use strict';

  var ROUNDS = 7;

  /* Per level (1–50): sheet size (cells), folds in order (R = V or H at random, X = one V and one H in
     random order; from 31: Y = V or L, Z = H or U, W = one Y and one Z in random order, T = D or E),
     holes, near = all wrong sheets are near misses (one hole moved or missing) instead of the typical
     mistakes, near2 = two wrong sheets are perfectly folded-and-opened sheets whose hole was punched one
     cell away (they look just as symmetric as the answer), rev = rounds (of 7) that ask the other way:
     the opened sheet is shown and the player picks where the hole was punched in the folded sheet. */
  var LEVELS = [
    { n: 4, folds: 'V', holes: 1 }, { n: 4, folds: 'H', holes: 1 }, { n: 4, folds: 'R', holes: 1 },     // 1–3
    { n: 4, folds: 'V', holes: 2 }, { n: 4, folds: 'VH', holes: 1 }, { n: 4, folds: 'HV', holes: 1 },    // 4–6
    { n: 4, folds: 'VH', holes: 2 }, { n: 4, folds: 'D', holes: 1 }, { n: 4, folds: 'VHV', holes: 1 },   // 7–9
    { n: 4, folds: 'HVH', holes: 1 }, { n: 8, folds: 'VH', holes: 1 }, { n: 8, folds: 'VH', holes: 2 },  // 10–12
    { n: 8, folds: 'VHV', holes: 1 }, { n: 8, folds: 'HVH', holes: 1 }, { n: 8, folds: 'D', holes: 2 },  // 13–15
    { n: 8, folds: 'HVD', holes: 1 }, { n: 8, folds: 'VHD', holes: 2 }, { n: 8, folds: 'VHV', holes: 2 }, // 16–18
    { n: 8, folds: 'HVH', holes: 2 }, { n: 8, folds: 'VHVH', holes: 1 },                                 // 19–20
    // 21–30: near-miss answers; at most 16 holes on an opened sheet so it stays readable
    { n: 8, folds: 'VHD', holes: 1, near: true }, { n: 8, folds: 'HVD', holes: 2, near: true },            // 21–22
    { n: 8, folds: 'RRR', holes: 2, near: true }, { n: 8, folds: 'XD', holes: 2, near: true },             // 23–24
    { n: 8, folds: 'XX', holes: 1, near: true }, { n: 8, folds: 'RRR', holes: 2, near: true },             // 25–26
    { n: 8, folds: 'XD', holes: 2, near: true }, { n: 8, folds: 'XX', holes: 1, near: true },              // 27–28
    { n: 8, folds: 'XD', holes: 2, near: true }, { n: 8, folds: 'XX', holes: 1, near: true },             // 29–30
    // 31–34: folds may go either way (left over right, bottom up) and along the other diagonal
    { n: 8, folds: 'WW', holes: 1, near: true }, { n: 8, folds: 'WD', holes: 2, near: true },              // 31–32
    { n: 8, folds: 'WY', holes: 2, near: true }, { n: 8, folds: 'WE', holes: 2, near: true },              // 33–34
    // 35–40: two wrong sheets are symmetric too (hole punched one cell away)
    { n: 8, folds: 'WW', holes: 1, near2: true }, { n: 8, folds: 'WT', holes: 2, near2: true },            // 35–36
    { n: 8, folds: 'WY', holes: 2, near2: true }, { n: 8, folds: 'WZ', holes: 2, near2: true },            // 37–38
    { n: 8, folds: 'WT', holes: 2, near2: true }, { n: 8, folds: 'WW', holes: 1, near2: true },            // 39–40
    // 41–50: mixed with rounds that ask the other way (where was the hole punched?)
    { n: 8, folds: 'WW', holes: 1, near2: true, rev: 2 }, { n: 8, folds: 'WT', holes: 2, near2: true, rev: 2 }, // 41–42
    { n: 8, folds: 'WY', holes: 2, near2: true, rev: 2 }, { n: 8, folds: 'WW', holes: 1, near2: true, rev: 3 }, // 43–44
    { n: 8, folds: 'WT', holes: 2, near2: true, rev: 3 }, { n: 8, folds: 'WZ', holes: 2, near2: true, rev: 3 }, // 45–46
    { n: 8, folds: 'WW', holes: 1, near2: true, rev: 3 }, { n: 8, folds: 'WT', holes: 2, near2: true, rev: 4 }, // 47–48
    { n: 8, folds: 'WY', holes: 2, near2: true, rev: 4 }, { n: 8, folds: 'WT', holes: 2, near2: true, rev: 4 }  // 49–50
  ];

  /* ---------- model: a region is { x, y, w, h } in cells (x from the left, y from the top) ---------- */
  function foldOnce(reg, f) {
    if (f === 'V') return { x: reg.x, y: reg.y, w: reg.w / 2, h: reg.h };       // right half goes over the left
    if (f === 'L') return { x: reg.x + reg.w / 2, y: reg.y, w: reg.w / 2, h: reg.h }; // left half goes over the right
    if (f === 'H') return { x: reg.x, y: reg.y + reg.h / 2, w: reg.w, h: reg.h / 2 }; // top half comes down
    if (f === 'U') return { x: reg.x, y: reg.y, w: reg.w, h: reg.h / 2 };       // bottom half goes up
    if (f === 'E') return { x: reg.x, y: reg.y, w: reg.w, h: reg.h, tri: 'r' }; // other diagonal: keep lower-right triangle
    return { x: reg.x, y: reg.y, w: reg.w, h: reg.h, tri: true };              // diagonal: keep lower-left triangle
  }
  // the cell that lies on top of (r, c) before fold f was made on region reg
  function mirror(reg, f, r, c) {
    if (f === 'V' || f === 'L') return [r, reg.x + reg.w - 1 - (c - reg.x)];
    if (f === 'H' || f === 'U') return [reg.y + reg.h - 1 - (r - reg.y), c];
    if (f === 'E') return [reg.y + (reg.w - 1 - (c - reg.x)), reg.x + (reg.h - 1 - (r - reg.y))];
    return [reg.y + (c - reg.x), reg.x + (r - reg.y)];
  }
  function inRegion(reg, r, c) {
    if (r < reg.y || r >= reg.y + reg.h || c < reg.x || c >= reg.x + reg.w) return false;
    if (reg.tri === 'r') return (c - reg.x) + (r - reg.y) >= reg.w - 1;
    return !reg.tri || (c - reg.x) <= (r - reg.y);
  }
  function regionCells(n, reg) {
    var cells = [];
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (inRegion(reg, r, c)) cells.push([r, c]);
    return cells;
  }
  function regions(n, folds) {
    var regs = [{ x: 0, y: 0, w: n, h: n }];
    folds.forEach(function (f) { regs.push(foldOnce(regs[regs.length - 1], f)); });
    return regs;
  }
  function key(h) { return h[0] + ',' + h[1]; }
  function setOf(list) { var s = {}; list.forEach(function (h) { s[key(h)] = h; }); return Object.keys(s).sort().map(function (k) { return s[k]; }); }
  // open the sheet: undo the folds from the last to the first, each one doubling the holes
  function unfold(holes, regs, folds, skip, axisSwap) {
    var hs = holes.slice();
    for (var i = folds.length - 1; i >= 0; i--) {
      if (skip === i) continue;
      var f = folds[i];
      if (axisSwap && f !== 'D' && f !== 'E') f = (f === 'V' || f === 'L') ? 'H' : 'V';
      var add = hs.map(function (h) { return mirror(axisSwap ? { x: 0, y: 0, w: regs[0].w, h: regs[0].h } : regs[i], f, h[0], h[1]); });
      hs = setOf(hs.concat(add));
    }
    return hs;
  }
  function sig(hs) { return setOf(hs).map(key).join(';'); }

  // the same holes with one of them moved to a free neighbouring cell of the folded sheet (null if none)
  function shiftOne(holes, reg, rnd) {
    var taken = {}; holes.forEach(function (h) { taken[key(h)] = true; });
    var order = rnd.shuffle(holes.map(function (h, i) { return i; }));
    for (var a = 0; a < order.length; a++) {
      var h = holes[order[a]];
      var ds = rnd.shuffle([[0, 1], [0, -1], [1, 0], [-1, 0]]);
      for (var d = 0; d < ds.length; d++) {
        var nh = [h[0] + ds[d][0], h[1] + ds[d][1]];
        if (!inRegion(reg, nh[0], nh[1]) || taken[key(nh)]) continue;
        var out = holes.slice(); out[order[a]] = nh;
        return out;
      }
    }
    return null;
  }

  function makeRound(spec, rnd, rev) {
    var n = spec.n;
    var folds = [];
    spec.folds.split('').forEach(function (f) {
      if (f === 'R') folds.push(rnd.pick(['V', 'H']));
      else if (f === 'X') folds = folds.concat(rnd.shuffle(['V', 'H']));
      else if (f === 'Y') folds.push(rnd.pick(['V', 'L']));
      else if (f === 'Z') folds.push(rnd.pick(['H', 'U']));
      else if (f === 'W') folds = folds.concat(rnd.shuffle([rnd.pick(['V', 'L']), rnd.pick(['H', 'U'])]));
      else if (f === 'T') folds.push(rnd.pick(['D', 'E']));
      else folds.push(f);
    });
    var regs = regions(n, folds);
    var last = regs[regs.length - 1];
    var cells = regionCells(n, last);
    if (rev) return makeRevRound(spec, rnd, n, folds, regs, last, cells);
    for (var attempt = 0; attempt < 100; attempt++) {
      var holes = rnd.shuffle(cells).slice(0, Math.min(spec.holes, cells.length));
      var answer = unfold(holes, regs, folds);
      var seen = {}; seen[sig(answer)] = true;
      var wrong = [];
      function add(hs) { var s = sig(hs); if (hs.length && !seen[s] && wrong.length < 3) { seen[s] = true; wrong.push(setOf(hs)); } }
      if (spec.near2) {
        // perfectly symmetric wrong sheets: the hole was punched one cell away
        for (var t3 = 0; t3 < 12 && wrong.length < 2; t3++) {
          var sh = shiftOne(holes, last, rnd);
          if (sh) add(unfold(sh, regs, folds));
        }
      }
      if (spec.near || spec.near2) {
        for (var t = 0; t < 40 && wrong.length < 3; t++) {
          var hs = answer.slice();
          if (rnd.randInt(0, 1) && hs.length > 1) hs.splice(rnd.randInt(0, hs.length - 1), 1);        // one hole missing
          else {                                                                                      // one hole moved
            var i = rnd.randInt(0, hs.length - 1), d = rnd.pick([[0, 1], [0, -1], [1, 0], [-1, 0]]);
            var nh = [hs[i][0] + d[0], hs[i][1] + d[1]];
            if (nh[0] < 0 || nh[0] >= n || nh[1] < 0 || nh[1] >= n) continue;
            hs = hs.slice(); hs[i] = nh;
          }
          add(hs);
        }
      }
      add(holes);                                       // forgot to open the sheet
      add(unfold(holes, regs, folds, 0));               // opened one fold too few
      add(unfold(holes, regs, folds, null, true));      // opened along the wrong line
      add(answer.map(function (h) { return [h[0], n - 1 - h[1]]; }));   // the whole sheet mirrored
      add(answer.map(function (h) { return [n - 1 - h[0], h[1]]; }));
      for (var t2 = 0; t2 < 30 && wrong.length < 3; t2++) {
        var hs2 = answer.slice(), j = rnd.randInt(0, hs2.length - 1);
        hs2[j] = [rnd.randInt(0, n - 1), rnd.randInt(0, n - 1)];
        add(hs2);
      }
      if (wrong.length < 3) continue;
      var opts = rnd.shuffle([{ h: answer, ok: true }].concat(wrong.map(function (w) { return { h: w, ok: false }; })));
      return { n: n, folds: folds, regs: regs, holes: holes, answer: answer, options: opts };
    }
    return null;
  }

  /* The other way round: the opened sheet is shown; the options are the folded sheet with the hole(s) in
     different places. Every cell of the folded sheet opens to its own set of holes, so a different set of
     holes on the folded sheet always gives a different opened sheet: exactly one option is right. */
  function makeRevRound(spec, rnd, n, folds, regs, last, cells) {
    for (var attempt = 0; attempt < 100; attempt++) {
      var holes = setOf(rnd.shuffle(cells).slice(0, Math.min(spec.holes, cells.length)));
      var seen = {}; seen[sig(holes)] = true;
      var wrong = [];
      function add(hs) { if (!hs) return; var s = sig(hs); if (hs.length === holes.length && !seen[s] && wrong.length < 3) { seen[s] = true; wrong.push(setOf(hs)); } }
      for (var t = 0; t < 12 && wrong.length < 2; t++) add(shiftOne(holes, last, rnd));   // one hole a cell away
      // the holes mirrored inside the folded sheet (a typical mix-up of the sides)
      add(holes.map(function (h) { return [h[0], last.x + last.w - 1 - (h[1] - last.x)]; }).filter(function (h) { return inRegion(last, h[0], h[1]); }));
      add(holes.map(function (h) { return [last.y + last.h - 1 - (h[0] - last.y), h[1]]; }).filter(function (h) { return inRegion(last, h[0], h[1]); }));
      for (var t2 = 0; t2 < 40 && wrong.length < 3; t2++) {
        var hs = holes.slice(); hs[rnd.randInt(0, hs.length - 1)] = rnd.pick(cells);
        add(setOf(hs));
      }
      if (wrong.length < 3) continue;
      var opts = rnd.shuffle([{ h: holes, ok: true }].concat(wrong.map(function (w) { return { h: w, ok: false }; })));
      return { rev: true, n: n, folds: folds, regs: regs, holes: holes, answer: unfold(holes, regs, folds), options: opts };
    }
    return null;
  }

  /* ---------- drawing ---------- */
  var NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) { var e = document.createElementNS(NS, tag); Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
  function regionPath(reg) {
    if (!reg.tri) return 'M' + reg.x + ' ' + reg.y + 'h' + reg.w + 'v' + reg.h + 'h' + (-reg.w) + 'z';
    if (reg.tri === 'r') return 'M' + (reg.x + reg.w) + ' ' + reg.y + 'L' + (reg.x + reg.w) + ' ' + (reg.y + reg.h) + 'L' + reg.x + ' ' + (reg.y + reg.h) + 'z';
    return 'M' + reg.x + ' ' + reg.y + 'L' + reg.x + ' ' + (reg.y + reg.h) + 'L' + (reg.x + reg.w) + ' ' + (reg.y + reg.h) + 'z';
  }
  function sheet(n, opts) {
    // opts: { reg, next (fold to show), holes, full, zoom (show only the folded sheet, big) }
    var reg = opts.reg || { x: 0, y: 0, w: n, h: n };
    var vb = '-0.3 -0.3 ' + (n + 0.6) + ' ' + (n + 0.6);
    if (opts.zoom) {
      var side = Math.max(reg.w, reg.h);
      vb = (reg.x - (side - reg.w) / 2 - 0.3) + ' ' + (reg.y - (side - reg.h) / 2 - 0.3) + ' ' + (side + 0.6) + ' ' + (side + 0.6);
    }
    var s = svg('svg', { viewBox: vb, class: 'pf-svg', 'aria-hidden': 'true' });
    if (!opts.full && !opts.zoom) s.appendChild(svg('rect', { x: 0, y: 0, width: n, height: n, class: 'pf-ghost' }));
    s.appendChild(svg('path', { d: regionPath(reg), class: 'pf-paper' }));
    (opts.holes || []).forEach(function (h) { s.appendChild(svg('circle', { cx: h[1] + 0.5, cy: h[0] + 0.5, r: n <= 4 ? 0.28 : 0.32, class: 'pf-hole' })); });
    if (opts.next) {
      var f = opts.next, x0 = reg.x, y0 = reg.y, w = reg.w, h = reg.h;
      var vert = f === 'V' || f === 'L', horiz = f === 'H' || f === 'U';
      var line = vert ? [x0 + w / 2, y0, x0 + w / 2, y0 + h] : horiz ? [x0, y0 + h / 2, x0 + w, y0 + h / 2]
        : f === 'E' ? [x0 + w, y0, x0, y0 + h] : [x0, y0, x0 + w, y0 + h];
      s.appendChild(svg('line', { x1: line[0], y1: line[1], x2: line[2], y2: line[3], class: 'pf-fold' }));
      // arrow: which part moves where
      var a = f === 'V' ? [x0 + w * 0.85, y0 + h / 2, x0 + w * 0.2, y0 + h / 2]
        : f === 'L' ? [x0 + w * 0.15, y0 + h / 2, x0 + w * 0.8, y0 + h / 2]
        : f === 'H' ? [x0 + w / 2, y0 + h * 0.15, x0 + w / 2, y0 + h * 0.8]
        : f === 'U' ? [x0 + w / 2, y0 + h * 0.85, x0 + w / 2, y0 + h * 0.2]
        : f === 'E' ? [x0 + w * 0.2, y0 + h * 0.2, x0 + w * 0.75, y0 + h * 0.75]
        : [x0 + w * 0.8, y0 + h * 0.2, x0 + w * 0.25, y0 + h * 0.75];
      s.appendChild(svg('path', { d: 'M' + a[0] + ' ' + a[1] + 'Q' + ((a[0] + a[2]) / 2 + (horiz ? w * 0.25 : 0)) + ' ' + ((a[1] + a[3]) / 2 - (horiz ? 0 : h * 0.25)) + ' ' + a[2] + ' ' + a[3], class: 'pf-arrow', 'marker-end': 'url(#pf-head)' }));
    }
    var defs = svg('defs');
    var m = svg('marker', { id: 'pf-head', viewBox: '0 0 10 10', refX: 7, refY: 5, markerWidth: 4, markerHeight: 4, orient: 'auto-start-reverse' });
    m.appendChild(svg('path', { d: 'M0 0L10 5L0 10z', class: 'pf-head' }));
    defs.appendChild(m);
    s.insertBefore(defs, s.firstChild);
    return s;
  }

  var css = [
    '.pf-steps{display:flex;flex-wrap:wrap;justify-content:center;gap:.4rem;direction:rtl;width:100%;max-width:26rem;}',
    '.pf-step{width:min(5.4rem,22vw);display:flex;flex-direction:column;align-items:center;gap:.1rem;}',
    '.pf-step span{font-size:.95rem;font-weight:700;color:var(--ink-soft);direction:rtl;}',
    '.pf-svg{width:100%;height:auto;display:block;}',
    '.pf-ghost{fill:none;stroke:var(--line);stroke-width:.06;stroke-dasharray:.2 .15;}',
    '.pf-paper{fill:var(--sun-soft);stroke:var(--ink-soft);stroke-width:.08;stroke-linejoin:round;}',
    '.pf-hole{fill:var(--ink);}',
    '.pf-fold{stroke:var(--perception);stroke-width:.1;stroke-dasharray:.3 .2;}',
    '.pf-arrow{fill:none;stroke:var(--perception);stroke-width:.12;}',
    '.pf-head{fill:var(--perception);}',
    '.pf-opts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.6rem;width:100%;max-width:min(20rem,max(calc(100svh - 21rem), 82vw));}',
    '.pf-opts.is-tall{max-width:min(20rem,max(calc(100svh - 25.5rem), 82vw));}',
    '.pf-opt{padding:.3rem;border-radius:var(--radius-sm);border:3px solid var(--line);background:var(--surface);cursor:pointer;}',
    '.pf-opt.is-correct{border-color:var(--good);background:var(--good-soft);}',
    '.pf-opt.is-wrong{border-color:var(--bad);background:var(--bad-soft);}'
  ].join('');

  var FOLD_WORD = { V: 'מקפלים ימין על שמאל', H: 'מקפלים למעלה על למטה', D: 'מקפלים באלכסון',
    L: 'מקפלים שמאל על ימין', U: 'מקפלים למטה על למעלה', E: 'מקפלים באלכסון השני' };

  BrainGames.register({
    id: 'paper-fold',
    name: 'קיפול ונקב',
    skill: 'perception',
    tagline: 'מקפלים דף, מנקבים, ופותחים',
    benefit: 'דמיון מרחבי והבנת סימטריה',
    instructions: [
      'למעלה רואים דף שמקפלים, שלב אחרי שלב. הקו המקווקו הוא קו הקיפול, והחץ מראה לאן מקפלים.',
      'בסוף מנקבים חור בדף המקופל. החור עובר דרך כל השכבות.',
      'דמיינו שפותחים את הדף, ובחרו איך הוא ייראה עם כל החורים.',
      'אין שעון. אפשר להסתכל על השלבים כמה שרוצים.',
      'ברמות הגבוהות מקפלים גם משמאל לימין, מלמטה למעלה ובאלכסון השני. לפעמים השאלה הפוכה: רואים את הדף הפתוח ובוחרים איפה ניקבו את הדף המקופל.'
    ],
    css: css,
    _makeRound: makeRound,
    _levels: LEVELS,
    _unfold: unfold,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var round = 0, correct = 0;
      // which rounds ask the other way (never the first one)
      var revPlan = [false];
      for (var k = 1; k < ROUNDS; k++) revPlan.push(k <= (spec.rev || 0));
      revPlan = [false].concat(ctx.shuffle(revPlan.slice(1)));

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: correct, total: ROUNDS, note: 'פתחתם נכון ' + correct + ' מתוך ' + ROUNDS + ' דפים' });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var R = makeRound(spec, ctx, revPlan[round - 1]);
        root.innerHTML = '';
        ctx.setStatus(R.rev ? 'איפה ניקבו את הדף המקופל?' : 'איך ייראה הדף כשנפתח אותו?');
        var steps = el('div', { class: 'pf-steps' });
        R.folds.forEach(function (f, i) {
          var st = el('div', { class: 'pf-step' }, [el('span', null, 'קיפול ' + (i + 1))]);
          st.insertBefore(sheet(R.n, { reg: R.regs[i], next: f }), st.firstChild);
          st.setAttribute('aria-label', FOLD_WORD[f]);
          steps.appendChild(st);
        });
        var punch = el('div', { class: 'pf-step' }, [el('span', null, R.rev ? 'פתוח' : 'חור')]);
        punch.insertBefore(R.rev ? sheet(R.n, { holes: R.answer, full: true })
          : sheet(R.n, { reg: R.regs[R.regs.length - 1], holes: R.holes }), punch.firstChild);
        steps.appendChild(punch);
        var answered = false;
        var buttons = R.options.map(function (o, i) {
          var b = el('button', { class: 'pf-opt', type: 'button', 'aria-label': 'אפשרות ' + (i + 1), onclick: function () { choose(o, b); } });
          b.appendChild(R.rev ? sheet(R.n, { reg: R.regs[R.regs.length - 1], holes: o.h, zoom: true }) : sheet(R.n, { holes: o.h, full: true }));
          return b;
        });
        root.appendChild(steps);
        // more than three steps wrap to a second row; the answers give up that row's height
        root.appendChild(el('div', { class: 'pf-opts' + (steps.children.length > 3 ? ' is-tall' : '') }, buttons));

        function choose(o, btn) {
          if (answered) return;
          answered = true;
          if (o.ok) correct++;
          buttons.forEach(function (b, i) { b.disabled = true; if (R.options[i].ok) b.classList.add('is-correct'); });
          if (!o.ok) btn.classList.add('is-wrong');
          ctx.feedback(o.ok, o.ok ? undefined : (R.rev ? 'המקום הנכון מסומן בירוק' : 'הדף הנכון מסומן בירוק')).then(function () { return ctx.wait(o.ok ? 500 : 1500); }).then(nextRound);
        }
      }

      nextRound();
    }
  });
})();
