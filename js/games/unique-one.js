/* היחיד מסוגו — every picture appears at least twice except one; find it (attention / visual search). */
(function () {
  'use strict';

  var ROUNDS = 8;

  // Feature values. Colours come from the shared strong palette (style.css --c-*), far apart in hue and
  // lightness so older eyes tell them apart; no red/green pairing (green is not used).
  var SHAPES = ['circle', 'square', 'triangle', 'star'];
  var COLORS = ['--c-red', '--c-blue', '--c-yellow', '--c-black'];
  var COLOR_WORDS = { '--c-red': 'אדום', '--c-blue': 'כחול', '--c-yellow': 'צהוב', '--c-black': 'שחור' };
  var SHAPE_WORDS = { circle: 'עיגול', square: 'ריבוע', triangle: 'משולש', star: 'כוכב' };
  var FEATURES = ['shape', 'color', 'fill', 'count'];

  // Per level: n items, columns (3 up to 12 items, so the pictures stay big on a phone), active features, values per shape/colour (fill has 2, count has 3),
  // gs = usual group size (3 = triples, 2 = pairs), sim = how close the unique one is to a group
  // ('far' differs in every feature where possible, 'any' random, 'near' differs from a group in one feature).
  var LEVELS = [
    { n: 6, cols: 3, f: ['shape', 'color'], v: 3, gs: 3, sim: 'far' },            // 1
    { n: 8, cols: 3, f: ['shape', 'color'], v: 3, gs: 3, sim: 'far' },            // 2
    { n: 8, cols: 3, f: ['shape', 'color'], v: 3, gs: 2, sim: 'any' },            // 3
    { n: 9, cols: 3, f: ['shape', 'color'], v: 3, gs: 2, sim: 'any' },            // 4
    { n: 9, cols: 3, f: ['shape', 'color'], v: 4, gs: 2, sim: 'near' },           // 5
    { n: 9, cols: 3, f: ['shape', 'color', 'fill'], v: 3, gs: 3, sim: 'far' },    // 6
    { n: 12, cols: 3, f: ['shape', 'color', 'fill'], v: 3, gs: 3, sim: 'any' },   // 7
    { n: 12, cols: 3, f: ['shape', 'color', 'fill'], v: 3, gs: 2, sim: 'any' },   // 8
    { n: 12, cols: 3, f: ['shape', 'color', 'fill'], v: 3, gs: 2, sim: 'near' },  // 9
    { n: 12, cols: 3, f: ['shape', 'color', 'count'], v: 3, gs: 2, sim: 'near' }, // 10
    { n: 12, cols: 3, f: ['shape', 'fill', 'count'], v: 3, gs: 2, sim: 'near' },  // 11
    { n: 16, cols: 4, f: ['shape', 'color', 'fill'], v: 3, gs: 3, sim: 'near' },  // 12
    { n: 16, cols: 4, f: ['shape', 'color', 'fill'], v: 3, gs: 2, sim: 'near' },  // 13
    { n: 16, cols: 4, f: ['shape', 'color', 'count'], v: 3, gs: 2, sim: 'near' }, // 14
    { n: 16, cols: 4, f: ['color', 'fill', 'count'], v: 3, gs: 2, sim: 'near' },  // 15
    { n: 16, cols: 4, f: ['shape', 'color', 'fill'], v: 4, gs: 2, sim: 'near' },  // 16
    { n: 16, cols: 4, f: ['shape', 'color', 'count'], v: 4, gs: 2, sim: 'near' }, // 17
    { n: 16, cols: 4, f: ['shape', 'fill', 'count'], v: 4, gs: 2, sim: 'near' },  // 18
    { n: 16, cols: 4, f: null, v: 4, gs: 2, sim: 'near' },                        // 19: any 3 features
    { n: 16, cols: 4, f: null, v: 4, gs: 2, sim: 'near2' },                       // 20: near to two groups
    // 21–30: all four features at once (f: 'all'); 'cluster' builds the groups from look-alike items,
    // and 'near3' means the unique one differs by a single feature from three groups
    { n: 16, cols: 4, f: 'all', v: 3, gs: 2, sim: 'near' },                       // 21
    { n: 16, cols: 4, f: 'all', v: 3, gs: 2, sim: 'near2' },                      // 22
    { n: 16, cols: 4, f: 'all', v: 4, gs: 2, sim: 'near' },                       // 23
    { n: 16, cols: 4, f: 'all', v: 4, gs: 2, sim: 'near2' },                      // 24
    { n: 16, cols: 4, f: null, v: 4, gs: 2, sim: 'near2', cluster: true },        // 25
    { n: 16, cols: 4, f: 'all', v: 3, gs: 2, sim: 'near2', cluster: true },       // 26
    { n: 16, cols: 4, f: 'all', v: 4, gs: 2, sim: 'near2', cluster: true },       // 27
    { n: 16, cols: 4, f: 'all', v: 3, gs: 2, sim: 'near3', cluster: true },       // 28
    { n: 16, cols: 4, f: 'all', v: 4, gs: 2, sim: 'near3', cluster: true },       // 29
    { n: 16, cols: 4, f: 'all', v: 4, gs: 2, sim: 'near4', cluster: true },       // 30
    // 31–50 are built around the single picture(s) (build: true), so the look-alikes are guaranteed:
    // 31–40: the single picture differs by one feature from five, six, then all seven of the groups.
    // 41–50 (two: true): TWO pictures appear only once; find both (each is one feature away from 3–4
    // groups). twin: the two singles differ in just one feature, so at a glance they look like a pair.
    // tight: every group is at most two features away from the singles.
    { n: 16, cols: 4, f: 'all', v: 4, gs: 2, sim: 'near5', build: true },       // 31
    { n: 16, cols: 4, f: 'all', v: 3, gs: 2, sim: 'near5', build: true },       // 32
    { n: 16, cols: 4, f: 'all', v: 4, gs: 2, sim: 'near5', build: true, tight: true }, // 33
    { n: 16, cols: 4, f: 'all', v: 4, gs: 2, sim: 'near6', build: true },       // 34
    { n: 16, cols: 4, f: 'all', v: 3, gs: 2, sim: 'near6', build: true },       // 35
    { n: 16, cols: 4, f: 'all', v: 4, gs: 2, sim: 'near6', build: true, tight: true }, // 36
    { n: 16, cols: 4, f: 'all', v: 4, gs: 2, sim: 'near7', build: true },       // 37
    { n: 16, cols: 4, f: 'all', v: 3, gs: 2, sim: 'near7', build: true },       // 38
    { n: 16, cols: 4, f: 'all', v: 4, gs: 2, sim: 'near7', build: true, tight: true }, // 39
    { n: 16, cols: 4, f: 'all', v: 4, gs: 2, sim: 'near7', build: true, tight: true }, // 40
    { n: 16, cols: 4, f: 'all', v: 4, gs: 2, sim: 'near3', build: true, two: true },               // 41
    { n: 16, cols: 4, f: 'all', v: 3, gs: 2, sim: 'near3', build: true, two: true },               // 42
    { n: 16, cols: 4, f: 'all', v: 4, gs: 2, sim: 'near4', build: true, two: true },               // 43
    { n: 16, cols: 4, f: 'all', v: 3, gs: 2, sim: 'near4', build: true, two: true, tight: true },  // 44
    { n: 16, cols: 4, f: 'all', v: 4, gs: 2, sim: 'near3', build: true, two: true, twin: true },   // 45
    { n: 16, cols: 4, f: 'all', v: 3, gs: 2, sim: 'near3', build: true, two: true, twin: true },   // 46
    { n: 16, cols: 4, f: 'all', v: 4, gs: 2, sim: 'near4', build: true, two: true, twin: true },   // 47
    { n: 16, cols: 4, f: 'all', v: 3, gs: 2, sim: 'near4', build: true, two: true, twin: true },   // 48
    { n: 16, cols: 4, f: 'all', v: 4, gs: 2, sim: 'near4', build: true, two: true, twin: true, tight: true }, // 49
    { n: 16, cols: 4, f: 'all', v: 3, gs: 2, sim: 'near4', build: true, two: true, twin: true, tight: true }  // 50
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
    var feats = spec.f === 'all' ? FEATURES.slice() : spec.f || shuffle(FEATURES).slice(0, 3);
    // fixed look for the features that are not in play
    var base = { shape: any(SHAPES.slice(0, 2)), color: '--c-black', fill: 'solid', count: 1 };
    if (feats.indexOf('color') === -1 && feats.indexOf('fill') !== -1) base.color = any(['--c-blue', '--c-red']);

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
    var singles = spec.two ? 2 : 1;
    var rest = spec.n - singles;
    var gCount = Math.max(1, Math.floor(rest / spec.gs));
    gCount = Math.min(gCount, combos.length - singles);
    var sizes = [];
    for (var g = 0; g < gCount; g++) sizes.push(Math.floor(rest / gCount));
    for (var r = 0; r < rest % gCount; r++) sizes[r]++;

    if (spec.build) return buildRound();

    for (var attempt = 0; attempt < 400; attempt++) {
      var pool = shuffle(combos);
      if (spec.cluster) {
        // look-alike groups: everything within two features of one random item
        var seed = pool[0];
        var close = pool.filter(function (c) { return diff(c, seed, feats) <= 2; });
        if (close.length >= gCount + 4) pool = close.concat(pool.filter(function (c) { return diff(c, seed, feats) > 2; }));
      }
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
      } else if (/^near\d?$/.test(spec.sim)) {
        var need = Number(spec.sim.slice(4)) || 1; // 'near' = 1, 'near2'…'near7'
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

    /* Levels 31–50: pick the single(s) first, then take `need` groups among each single's one-feature
       neighbours, and fill up with groups close to the singles. Always succeeds within a few tries. */
    function buildRound() {
      var need = Number(spec.sim.slice(4)) || 1;
      for (var tryNo = 0; tryNo < 400; tryNo++) {
        var pool = shuffle(combos);
        var u1 = pool[0];
        var singlesList = [u1];
        if (spec.two) {
          var c2 = pool.filter(function (c) { return c !== u1 && (spec.twin ? diff(c, u1, feats) === 1 : diff(c, u1, feats) >= 2); });
          if (!c2.length) continue;
          singlesList.push(c2[0]);
        }
        var others = pool.filter(function (c) { return singlesList.indexOf(c) === -1; });
        var groups = [];
        singlesList.forEach(function (u) {
          var have = groups.filter(function (g) { return diff(g, u, feats) === 1; }).length;
          others.forEach(function (c) {
            if (have < need && groups.indexOf(c) === -1 && diff(c, u, feats) === 1) { groups.push(c); have++; }
          });
        });
        if (groups.length > gCount) continue;
        var near = function (c) {
          return Math.min.apply(null, singlesList.map(function (u) { return diff(c, u, feats); }));
        };
        var fill = others.filter(function (c) { return groups.indexOf(c) === -1; })
          .sort(function (a, b) { return spec.tight ? near(a) - near(b) : 0; });
        if (spec.tight) fill = fill.filter(function (c) { return near(c) <= 2; });
        for (var f = 0; groups.length < gCount && f < fill.length; f++) groups.push(fill[f]);
        if (groups.length < gCount) continue;
        var good = singlesList.every(function (u) {
          return groups.filter(function (g) { return diff(g, u, feats) === 1; }).length >= need;
        });
        if (!good) continue;
        var items = [];
        groups.forEach(function (gr, i) {
          for (var k = 0; k < sizes[i]; k++) items.push({ shape: gr.shape, color: gr.color, fill: gr.fill, count: gr.count, unique: false });
        });
        singlesList.forEach(function (u) { items.push({ shape: u.shape, color: u.color, fill: u.fill, count: u.count, unique: true }); });
        return { items: shuffle(items), feats: feats };
      }
      return null;
    }
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

  var SPOTS = { 1: [[50, 50, 40]], 2: [[29, 29, 25], [71, 71, 25]], 3: [[21, 21, 17], [50, 50, 17], [79, 79, 17]] };

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
    /* 16rem = header, status, card padding and the "next" button that shows after a miss */
    '.uo-grid{max-width:min(26rem,calc((100svh - 16rem) * var(--cols) / var(--rows)));gap:.45rem;}',
    '.uo-grid .g-tile{background:var(--surface);}',
    '.uo-grid .g-tile svg{width:92%;height:92%;display:block;overflow:visible;}',
    '.uo-grid .g-tile.is-correct{border-width:4px;box-shadow:0 0 0 3px var(--good-soft);}',
    '.uo-grid .g-tile.is-wrong{border-width:4px;}',
    '.uo-grid .g-tile.uo-twin{border:4px dashed var(--ink);}', /* not yellow: yellow is a picture colour */
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
      'לחצו על הציור היחיד מסוגו. אין שעון.',
      'ברמות הגבוהות יש שני ציורים שמופיעים פעם אחת בלבד: מצאו את שניהם.'
    ],
    css: css,
    _makeRound: makeRound,   // exposed for tests
    _levels: LEVELS,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var round = 0;
      var score = 0;

      function next() {
        if (round >= ROUNDS) {
          ctx.finish({
            correct: score,
            total: ROUNDS,
            note: (spec.two ? 'מצאתם את שני היחידים מסוגם ב-' : 'מצאתם את היחיד מסוגו ב-') + score + ' מתוך ' + ROUNDS + ' לוחות של ' + spec.n + ' ציורים'
          });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        play(makeRound(spec) || makeRound(LEVELS[29]));
      }

      function play(data) {
        root.innerHTML = '';
        var two = !!spec.two;
        ctx.setStatus(two ? 'שני ציורים מופיעים רק פעם אחת. מצאו את שניהם' : 'איזה ציור מופיע רק פעם אחת?');
        var items = data.items;
        var accepting = true;
        var foundOne = -1;
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
          if (!accepting || i === foundOne) return;
          if (two && foundOne === -1 && items[i].unique) {
            // the first of two singles: mark it and keep looking
            foundOne = i;
            tiles[i].classList.add('is-correct');
            tiles[i].disabled = true;
            ctx.sound('tap');
            ctx.setStatus('מצאתם אחד! יש עוד ציור אחד שמופיע רק פעם אחת');
            return;
          }
          accepting = false;
          tiles.forEach(function (t) { t.disabled = true; });
          items.forEach(function (it, k) { if (it.unique) tiles[k].classList.add('is-correct'); });
          if (items[i].unique) {
            score++;
            ctx.setStatus('מצאתם!');
            ctx.feedback(true).then(function () { return ctx.wait(400); }).then(next);
            return;
          }
          tiles[i].classList.add('is-wrong');
          var k0 = key(items[i]);
          items.forEach(function (it, k) { if (k !== i && key(it) === k0) tiles[k].classList.add('uo-twin'); });
          ctx.setStatus(two ? 'היחידים מסוגם בירוק, הזוג במסגרת מקווקוות' : 'היחיד מסוגו בירוק, הזוג במסגרת מקווקוות');
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
