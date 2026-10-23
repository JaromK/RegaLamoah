/* היחיד מסוגו — every picture appears at least twice except one; find it (attention / visual search). */
(function () {
  'use strict';

  var ROUNDS = 8;

  // Feature values. Colours are CSS custom properties so dark mode works; no red/green pairing.
  var SHAPES = ['circle', 'square', 'triangle', 'star'];
  var COLORS = ['--logic', '--attention', '--ink', '--memory'];
  var COLOR_WORDS = { '--logic': 'כחול', '--attention': 'כתום', '--ink': 'כהה', '--memory': 'סגול' };
  var SHAPE_WORDS = { circle: 'עיגול', square: 'ריבוע', triangle: 'משולש', star: 'כוכב' };
  var FEATURES = ['shape', 'color', 'fill', 'count'];

  // Per level: n items, columns, active features, values per shape/colour (fill has 2, count has 3),
  // gs = usual group size (3 = triples, 2 = pairs), sim = how close the unique one is to a group
  // ('far' differs in every feature where possible, 'any' random, 'near' differs from a group in one feature).
  var LEVELS = [
    { n: 6, cols: 3, f: ['shape', 'color'], v: 3, gs: 3, sim: 'far' },            // 1
    { n: 8, cols: 4, f: ['shape', 'color'], v: 3, gs: 3, sim: 'far' },            // 2
    { n: 8, cols: 4, f: ['shape', 'color'], v: 3, gs: 2, sim: 'any' },            // 3
    { n: 9, cols: 3, f: ['shape', 'color'], v: 3, gs: 2, sim: 'any' },            // 4
    { n: 9, cols: 3, f: ['shape', 'color'], v: 4, gs: 2, sim: 'near' },           // 5
    { n: 9, cols: 3, f: ['shape', 'color', 'fill'], v: 3, gs: 3, sim: 'far' },    // 6
    { n: 12, cols: 4, f: ['shape', 'color', 'fill'], v: 3, gs: 3, sim: 'any' },   // 7
    { n: 12, cols: 4, f: ['shape', 'color', 'fill'], v: 3, gs: 2, sim: 'any' },   // 8
    { n: 12, cols: 4, f: ['shape', 'color', 'fill'], v: 3, gs: 2, sim: 'near' },  // 9
    { n: 12, cols: 4, f: ['shape', 'color', 'count'], v: 3, gs: 2, sim: 'near' }, // 10
    { n: 12, cols: 4, f: ['shape', 'fill', 'count'], v: 3, gs: 2, sim: 'near' },  // 11
    { n: 16, cols: 4, f: ['shape', 'color', 'fill'], v: 3, gs: 3, sim: 'near' },  // 12
    { n: 16, cols: 4, f: ['shape', 'color', 'fill'], v: 3, gs: 2, sim: 'near' },  // 13
    { n: 16, cols: 4, f: ['shape', 'color', 'count'], v: 3, gs: 2, sim: 'near' }, // 14
    { n: 16, cols: 4, f: ['color', 'fill', 'count'], v: 3, gs: 2, sim: 'near' },  // 15
    { n: 16, cols: 4, f: ['shape', 'color', 'fill'], v: 4, gs: 2, sim: 'near' },  // 16
    { n: 16, cols: 4, f: ['shape', 'color', 'count'], v: 4, gs: 2, sim: 'near' }, // 17
    { n: 16, cols: 4, f: ['shape', 'fill', 'count'], v: 4, gs: 2, sim: 'near' },  // 18
    { n: 16, cols: 4, f: null, v: 4, gs: 2, sim: 'near' },                        // 19: any 3 features
    { n: 16, cols: 4, f: null, v: 4, gs: 2, sim: 'near2' }                        // 20: near to two groups
  ];

  function valuesOf(feature, v) {
    if (feature === 'shape') return SHAPES.slice(0, v);
    if (feature === 'color') return COLORS.slice(0, v);
    if (feature === 'fill') return ['solid', 'outline'];
    return [1, 2, 3];
  }

  function key(item) { return item.shape + '|' + item.color + '|' + item.fill + '|' + item.count; }

  function diff(a, b, feats) {
    var d = 0;
    feats.forEach(function (f) { if (a[f] !== b[f]) d++; });
    return d;
  }

  /* One board: items (shuffled) with exactly one unique combination. */
  function makeRound(spec, rand) {
    rand = rand || Math.random;
    function any(list) { return list[Math.floor(rand() * list.length)]; }
    function shuffle(a) {
      a = a.slice();
      for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
      return a;
    }
    var feats = spec.f || shuffle(FEATURES).slice(0, 3);
    // fixed look for the features that are not in play
    var base = { shape: any(SHAPES.slice(0, 2)), color: '--ink', fill: 'solid', count: 1 };
    if (feats.indexOf('color') === -1 && feats.indexOf('fill') !== -1) base.color = any(['--logic', '--memory']);

    // every combination of the active features
    var combos = [base];
    feats.forEach(function (f) {
      var next = [];
      combos.forEach(function (c) {
        valuesOf(f, spec.v).forEach(function (val) {
          var o = { shape: c.shape, color: c.color, fill: c.fill, count: c.count };
          o[f] = val;
          next.push(o);
        });
      });
      combos = next;
    });

    // group sizes: as many groups of `gs` as fit into n - 1, leftovers spread over groups
    var rest = spec.n - 1;
    var gCount = Math.max(1, Math.floor(rest / spec.gs));
    gCount = Math.min(gCount, combos.length - 1);
    var sizes = [];
    for (var g = 0; g < gCount; g++) sizes.push(Math.floor(rest / gCount));
    for (var r = 0; r < rest % gCount; r++) sizes[r]++;

    for (var attempt = 0; attempt < 200; attempt++) {
      var pool = shuffle(combos);
      var groups = pool.slice(0, gCount);
      var candidates = pool.slice(gCount);
      var scored = candidates.map(function (c) {
        var near = 0, minD = 99, sumD = 0;
        groups.forEach(function (gr) {
          var d = diff(c, gr, feats);
          if (d === 1) near++;
          minD = Math.min(minD, d);
          sumD += d;
        });
        return { c: c, near: near, minD: minD, sumD: sumD };
      });
      var unique = null;
      if (spec.sim === 'far') {
        scored.sort(function (a, b) { return b.minD - a.minD || b.sumD - a.sumD; });
        unique = scored[0] && scored[0].c;
      } else if (spec.sim === 'near' || spec.sim === 'near2') {
        var need = spec.sim === 'near2' ? 2 : 1;
        var ok = scored.filter(function (s) { return s.near >= need; });
        if (!ok.length) continue;
        unique = any(ok).c;
      } else {
        unique = scored.length ? any(scored).c : null;
      }
      if (!unique) continue;
      var items = [];
      groups.forEach(function (gr, i) {
        for (var k = 0; k < sizes[i]; k++) items.push(gr);
      });
      items = items.map(function (it) { return { shape: it.shape, color: it.color, fill: it.fill, count: it.count, unique: false }; });
      items.push({ shape: unique.shape, color: unique.color, fill: unique.fill, count: unique.count, unique: true });
      // a few cells of each group in a row is fine, but avoid twins sitting side by side too often
      return { items: shuffle(items), feats: feats };
    }
    return null;
  }

  function shapeSvg(shape, color, fill, cx, cy, s) {
    // s = half size
    var paint = fill === 'solid'
      ? 'fill="var(' + color + ')" stroke="var(' + color + ')" stroke-width="2"'
      : 'fill="none" stroke="var(' + color + ')" stroke-width="' + Math.max(3, s * 0.22).toFixed(1) + '" stroke-linejoin="round"';
    var k = fill === 'solid' ? s : s * 0.88;
    if (shape === 'circle') return '<circle cx="' + cx + '" cy="' + cy + '" r="' + k.toFixed(1) + '" ' + paint + '/>';
    if (shape === 'square') {
      var q = k * 0.86;
      return '<rect x="' + (cx - q).toFixed(1) + '" y="' + (cy - q).toFixed(1) + '" width="' + (2 * q).toFixed(1) +
        '" height="' + (2 * q).toFixed(1) + '" rx="' + (q * 0.12).toFixed(1) + '" ' + paint + '/>';
    }
    var pts = [];
    if (shape === 'triangle') {
      pts = [[0, -1], [0.95, 0.8], [-0.95, 0.8]];
    } else {
      for (var i = 0; i < 10; i++) {
        var a = -Math.PI / 2 + i * Math.PI / 5;
        var rr = i % 2 ? 0.45 : 1.05;
        pts.push([Math.cos(a) * rr, Math.sin(a) * rr + 0.08]);
      }
    }
    return '<polygon points="' + pts.map(function (p) {
      return (cx + p[0] * k).toFixed(1) + ',' + (cy + p[1] * k).toFixed(1);
    }).join(' ') + '" ' + paint + '/>';
  }

  var SPOTS = { 1: [[50, 50, 34]], 2: [[30, 30, 20], [70, 70, 20]], 3: [[25, 25, 16], [50, 50, 16], [75, 75, 16]] };

  function itemSvg(it) {
    return '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' + SPOTS[it.count].map(function (p) {
      return shapeSvg(it.shape, it.color, it.fill, p[0], p[1], p[2]);
    }).join('') + '</svg>';
  }

  function describe(it, feats) {
    var parts = [];
    if (feats.indexOf('count') !== -1) parts.push(it.count === 1 ? 'אחד' : it.count === 2 ? 'שניים' : 'שלושה');
    parts.push(SHAPE_WORDS[it.shape]);
    if (feats.indexOf('color') !== -1) parts.push(COLOR_WORDS[it.color]);
    if (feats.indexOf('fill') !== -1) parts.push(it.fill === 'solid' ? 'מלא' : 'חלול');
    return parts.join(' ');
  }

  var css = [
    '.uo-grid{max-width:min(24rem,calc((100dvh - 19rem) * var(--cols) / var(--rows)));gap:.6rem;}',
    '.uo-grid .g-tile{background:var(--surface);}',
    '.uo-grid .g-tile svg{width:84%;height:84%;display:block;}',
    '.uo-grid .g-tile.is-correct{border-width:4px;box-shadow:0 0 0 3px var(--good-soft);}',
    '.uo-grid .g-tile.is-wrong{border-width:4px;}',
    '.uo-grid .g-tile.uo-twin{border:3px dashed var(--sun);background:var(--sun-soft);}',
  ].join('');

  BrainGames.register({
    id: 'unique-one',
    name: 'היחיד מסוגו',
    skill: 'attention',
    tagline: 'מצאו את הציור שאין לו זוג',
    benefit: 'סריקה חזותית וקשב לפרטים',
    instructions: [
      'על הלוח יש ציורים. כמעט כל ציור מופיע לפחות פעמיים.',
      'רק ציור אחד מופיע פעם אחת בלבד.',
      'שימו לב לצורה, לצבע, למילוי ולמספר הצורות.',
      'לחצו על הציור היחיד מסוגו. אין שעון.'
    ],
    css: css,
    _makeRound: makeRound,   // exposed for tests
    _levels: LEVELS,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var round = 0;
      var score = 0;

      function next() {
        if (round >= ROUNDS) {
          ctx.finish({
            correct: score,
            total: ROUNDS,
            note: 'מצאתם את היחיד מסוגו ב-' + score + ' מתוך ' + ROUNDS + ' לוחות של ' + spec.n + ' ציורים'
          });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        play(makeRound(spec));
      }

      function play(data) {
        root.innerHTML = '';
        ctx.setStatus('איזה ציור מופיע רק פעם אחת?');
        var items = data.items;
        var accepting = true;
        var tiles = items.map(function (it, i) {
          return el('button', {
            class: 'g-tile', type: 'button', html: itemSvg(it),
            'aria-label': describe(it, data.feats),
            onclick: function () { tap(i); }
          });
        });
        var grid = el('div', { class: 'g-grid uo-grid', style: { '--cols': String(spec.cols), '--rows': String(Math.ceil(spec.n / spec.cols)) } }, tiles);
        root.appendChild(grid);

        function tap(i) {
          if (!accepting) return;
          accepting = false;
          tiles.forEach(function (t) { t.disabled = true; });
          var uIdx = 0;
          items.forEach(function (it, k) { if (it.unique) uIdx = k; });
          tiles[uIdx].classList.add('is-correct');
          if (items[i].unique) {
            score++;
            ctx.setStatus('מצאתם!');
            ctx.feedback(true).then(function () { return ctx.wait(400); }).then(next);
            return;
          }
          tiles[i].classList.add('is-wrong');
          var k0 = key(items[i]);
          items.forEach(function (it, k) { if (k !== i && key(it) === k0) tiles[k].classList.add('uo-twin'); });
          ctx.setStatus('היחיד מסוגו בירוק, הזוג בצהוב');
          var btn = el('button', {
            class: 'btn btn-primary btn-lg', type: 'button',
            onclick: function () { btn.disabled = true; next(); }
          }, 'הבנתי, הלאה');
          ctx.feedback(false, 'לציור הזה יש זוג').then(function () {
            root.appendChild(el('div', { class: 'g-actions' }, btn));
          });
        }
      }

      next();
    }
  });
})();
