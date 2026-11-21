/* סיבוב צורות — find the same shape, only rotated (perception). */
(function () {
  'use strict';

  var ROUNDS = 7;

  // Per level (1–50): cells in the shape, box (shape fits box × box), options shown,
  // turn270 (allow 90°/270° quarter turns both ways; otherwise only 90° and 180°),
  // mirrors (how many mirror-image distractors), near (the "different shape" is the
  // original with one cell moved — a subtle near miss).
  // From 31: sym = the shape is almost symmetric: its mirror image differs from it by at most this many
  // cells, so mirror images look almost like the answer; odd = rounds (of 7) that ask the other way:
  // three options are the shape turned, one is its mirror image — which one is NOT the same shape?
  var LEVELS = [
    { cells: 4, box: 3, options: 3, turn270: false, mirrors: 1, near: false }, // 1
    { cells: 4, box: 3, options: 3, turn270: false, mirrors: 1, near: false }, // 2
    { cells: 5, box: 3, options: 3, turn270: false, mirrors: 1, near: false }, // 3
    { cells: 5, box: 4, options: 3, turn270: false, mirrors: 1, near: false }, // 4
    { cells: 5, box: 4, options: 3, turn270: true,  mirrors: 1, near: false }, // 5
    { cells: 5, box: 4, options: 4, turn270: true,  mirrors: 1, near: false }, // 6
    { cells: 6, box: 4, options: 4, turn270: true,  mirrors: 1, near: false }, // 7
    { cells: 6, box: 4, options: 4, turn270: true,  mirrors: 1, near: false }, // 8
    { cells: 6, box: 4, options: 4, turn270: true,  mirrors: 1, near: true },  // 9
    { cells: 6, box: 4, options: 4, turn270: true,  mirrors: 2, near: false }, // 10
    { cells: 7, box: 4, options: 4, turn270: true,  mirrors: 1, near: false }, // 11
    { cells: 7, box: 4, options: 4, turn270: true,  mirrors: 1, near: true },  // 12
    { cells: 7, box: 5, options: 4, turn270: true,  mirrors: 1, near: true },  // 13
    { cells: 7, box: 5, options: 4, turn270: true,  mirrors: 2, near: true },  // 14
    { cells: 8, box: 5, options: 4, turn270: true,  mirrors: 1, near: false }, // 15
    { cells: 8, box: 5, options: 4, turn270: true,  mirrors: 1, near: true },  // 16
    { cells: 8, box: 5, options: 4, turn270: true,  mirrors: 2, near: true },  // 17
    { cells: 8, box: 4, options: 4, turn270: true,  mirrors: 1, near: true },  // 18
    { cells: 8, box: 4, options: 4, turn270: true,  mirrors: 2, near: true },  // 19
    { cells: 8, box: 4, options: 4, turn270: true,  mirrors: 2, near: true },  // 20
    // 21–30: bigger shapes; from 23 every other wrong shape is a near miss (one cell moved)
    { cells: 9, box: 5, options: 4, turn270: true,  mirrors: 1, near: true }, // 21
    { cells: 9, box: 5, options: 4, turn270: true,  mirrors: 2, near: true }, // 22
    { cells: 9, box: 4, options: 4, turn270: true,  mirrors: 2, near: true, nearAll: true }, // 23
    { cells: 10, box: 5, options: 4, turn270: true,  mirrors: 1, near: true, nearAll: true }, // 24
    { cells: 10, box: 5, options: 4, turn270: true,  mirrors: 2, near: true, nearAll: true }, // 25
    { cells: 10, box: 4, options: 4, turn270: true,  mirrors: 1, near: true, nearAll: true }, // 26
    { cells: 10, box: 4, options: 4, turn270: true,  mirrors: 2, near: true, nearAll: true }, // 27
    { cells: 11, box: 5, options: 4, turn270: true,  mirrors: 1, near: true, nearAll: true }, // 28
    { cells: 11, box: 5, options: 4, turn270: true,  mirrors: 2, near: true, nearAll: true }, // 29
    { cells: 12, box: 5, options: 4, turn270: true,  mirrors: 2, near: true, nearAll: true }, // 30
    // 31–40: almost symmetric shapes, so the mirror images look nearly the same as the answer
    { cells: 12, box: 5, options: 4, turn270: true, mirrors: 2, near: true, nearAll: true, sym: 3 }, // 31
    { cells: 12, box: 5, options: 4, turn270: true, mirrors: 2, near: true, nearAll: true, sym: 3 }, // 32
    { cells: 13, box: 5, options: 4, turn270: true, mirrors: 2, near: true, nearAll: true, sym: 3 }, // 33
    { cells: 12, box: 5, options: 4, turn270: true, mirrors: 2, near: true, nearAll: true, sym: 2 }, // 34
    { cells: 13, box: 5, options: 4, turn270: true, mirrors: 2, near: true, nearAll: true, sym: 2 }, // 35
    { cells: 12, box: 5, options: 4, turn270: true, mirrors: 3, near: true, nearAll: true, sym: 2 }, // 36
    { cells: 13, box: 5, options: 4, turn270: true, mirrors: 3, near: true, nearAll: true, sym: 2 }, // 37
    { cells: 12, box: 5, options: 4, turn270: true, mirrors: 2, near: true, nearAll: true, sym: 1 }, // 38
    { cells: 13, box: 5, options: 4, turn270: true, mirrors: 2, near: true, nearAll: true, sym: 1 }, // 39
    { cells: 13, box: 5, options: 4, turn270: true, mirrors: 3, near: true, nearAll: true, sym: 1 }, // 40
    // 41–50: mixed with "which one is NOT the same shape?" rounds
    { cells: 12, box: 5, options: 4, turn270: true, mirrors: 2, near: true, nearAll: true, sym: 2, odd: 2 }, // 41
    { cells: 13, box: 5, options: 4, turn270: true, mirrors: 2, near: true, nearAll: true, sym: 2, odd: 2 }, // 42
    { cells: 12, box: 5, options: 4, turn270: true, mirrors: 2, near: true, nearAll: true, sym: 1, odd: 2 }, // 43
    { cells: 13, box: 5, options: 4, turn270: true, mirrors: 2, near: true, nearAll: true, sym: 1, odd: 3 }, // 44
    { cells: 13, box: 5, options: 4, turn270: true, mirrors: 3, near: true, nearAll: true, sym: 1, odd: 3 }, // 45
    { cells: 12, box: 5, options: 4, turn270: true, mirrors: 2, near: true, nearAll: true, sym: 1, odd: 3, oddNear: true }, // 46
    { cells: 13, box: 5, options: 4, turn270: true, mirrors: 2, near: true, nearAll: true, sym: 1, odd: 3, oddNear: true }, // 47
    { cells: 13, box: 5, options: 4, turn270: true, mirrors: 3, near: true, nearAll: true, sym: 1, odd: 4, oddNear: true }, // 48
    { cells: 14, box: 5, options: 4, turn270: true, mirrors: 2, near: true, nearAll: true, sym: 1, odd: 4, oddNear: true }, // 49
    { cells: 14, box: 5, options: 4, turn270: true, mirrors: 3, near: true, nearAll: true, sym: 1, odd: 4, oddNear: true }  // 50
  ];

  var css = [
    '.rs-target{display:flex;flex-direction:column;align-items:center;gap:.25rem;}',
    '.rs-cap{font-size:1.1rem;line-height:1.3;color:var(--ink-soft);font-weight:700;}',
    '.rs-grid{--n:3;display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:3px;direction:ltr;width:100%;',
    'padding:4px;border-radius:var(--radius-sm);background:var(--surface);border:2px solid var(--line);}',
    '.rs-cell{aspect-ratio:1;border-radius:3px;background:var(--surface-2);}',
    '.rs-cell.rs-on{background:var(--perception);}',
    '.rs-target .rs-grid{width:min(8.5rem,18svh);border-color:var(--perception);border-width:3px;}',
    '.rs-hint{margin:0;font-size:1.1rem;line-height:1.3;}',
    /* options: two per row, sized by screen height so the whole round fits one phone screen */
    '.rs-opts{display:flex;flex-wrap:wrap;justify-content:center;gap:.7rem;width:100%;max-width:20rem;}',
    '.rs-opts .rs-opt.g-choice{flex:none;position:relative;padding:.5rem;min-height:0;display:flex;align-items:center;justify-content:center;}',
    '.rs-opt .rs-grid{width:min(7rem,16svh);border-color:transparent;}',
    '.rs-mark{position:absolute;top:-.75rem;left:50%;transform:translateX(-50%);white-space:nowrap;',
    'font-size:1.1rem;font-weight:900;line-height:1.3;padding:0 .45rem;border-radius:999px;background:var(--surface);border:2px solid currentColor;}',
    '.rs-mark:empty{display:none;}'
  ].join('');

  /* ---------- shape helpers (shape = array of [row, col]) ---------- */
  function normalize(s) {
    var minR = Infinity, minC = Infinity;
    s.forEach(function (p) { if (p[0] < minR) minR = p[0]; if (p[1] < minC) minC = p[1]; });
    return s.map(function (p) { return [p[0] - minR, p[1] - minC]; })
      .sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
  }
  function keyOf(s) { return normalize(s).map(function (p) { return p[0] + ',' + p[1]; }).join(';'); }
  function rot90(s) { return normalize(s.map(function (p) { return [p[1], -p[0]]; })); }
  function rotate(s, quarters) { var out = normalize(s); for (var i = 0; i < quarters; i++) out = rot90(out); return out; }
  function reflect(s) { return normalize(s.map(function (p) { return [p[0], -p[1]]; })); }
  function extent(s) {
    var h = 0, w = 0;
    s.forEach(function (p) { if (p[0] + 1 > h) h = p[0] + 1; if (p[1] + 1 > w) w = p[1] + 1; });
    return { h: h, w: w };
  }
  // keys of the 4 rotations
  function rotationKeys(s) { var k = {}; for (var q = 0; q < 4; q++) k[keyOf(rotate(s, q))] = true; return k; }
  // keys of all 8 rotations + reflections
  function allKeys(s) {
    var k = rotationKeys(s), m = rotationKeys(reflect(s));
    Object.keys(m).forEach(function (x) { k[x] = true; });
    return k;
  }
  function has(s, r, c) { for (var i = 0; i < s.length; i++) if (s[i][0] === r && s[i][1] === c) return true; return false; }
  function connected(s) {
    if (!s.length) return false;
    var seen = [s[0]], stack = [s[0]];
    function inSeen(r, c) { return has(seen, r, c); }
    while (stack.length) {
      var p = stack.pop();
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
        var r = p[0] + d[0], c = p[1] + d[1];
        if (has(s, r, c) && !inSeen(r, c)) { seen.push([r, c]); stack.push([r, c]); }
      });
    }
    return seen.length === s.length;
  }
  function fits(s, box) { var e = extent(normalize(s)); return e.h <= box && e.w <= box; }

  // Grow a random connected shape of `n` cells that fits in box × box.
  function growShape(n, box, ctx) {
    for (var attempt = 0; attempt < 200; attempt++) {
      var s = [[0, 0]];
      var guard = 0;
      while (s.length < n && guard++ < 200) {
        var base = ctx.pick(s);
        var d = ctx.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
        var r = base[0] + d[0], c = base[1] + d[1];
        if (has(s, r, c)) continue;
        var cand = s.concat([[r, c]]);
        if (fits(cand, box)) s = cand;
      }
      if (s.length === n) return normalize(s);
    }
    return null;
  }

  // Move one cell of `s` elsewhere so it stays connected, same size, fits the box.
  function nearMiss(s, box, ctx) {
    var cells = ctx.shuffle(s.map(function (p, i) { return i; }));
    for (var t = 0; t < cells.length; t++) {
      var rest = s.filter(function (p, i) { return i !== cells[t]; });
      if (!connected(rest)) continue;
      var spots = [];
      rest.forEach(function (p) {
        [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) {
          var r = p[0] + d[0], c = p[1] + d[1];
          if (!has(rest, r, c) && !(r === s[cells[t]][0] && c === s[cells[t]][1])) spots.push([r, c]);
        });
      });
      spots = ctx.shuffle(spots);
      for (var k = 0; k < spots.length; k++) {
        var cand = rest.concat([spots[k]]);
        if (fits(cand, box)) return normalize(cand);
      }
    }
    return null;
  }

  function randomTurn(s, ctx) { return rotate(s, ctx.randInt(0, 3)); }

  // How many cells of the mirror image cannot be laid over the shape (best turn and shift): 0 = symmetric.
  function mirrorDiff(s) {
    var best = 0, m = reflect(s);
    for (var q = 0; q < 4; q++) {
      var t = rotate(m, q);
      for (var dr = -5; dr <= 5; dr++) for (var dc = -5; dc <= 5; dc++) {
        var over = 0;
        t.forEach(function (p) { if (has(s, p[0] + dr, p[1] + dc)) over++; });
        if (over > best) best = over;
      }
    }
    return s.length - best;
  }

  /* "Which one is NOT the same shape?": three different turns of the shape and one mirror image
     (or, with oddNear, sometimes a near miss). */
  function buildOddRound(spec, ctx) {
    for (var attempt = 0; attempt < 400; attempt++) {
      var shape = growShape(spec.cells, spec.box, ctx);
      if (!shape) continue;
      var rot = rotationKeys(shape);
      if (Object.keys(rot).length < 4) continue;            // every turn must look different
      var mirror = reflect(shape);
      if (rot[keyOf(mirror)]) continue;
      if (spec.sym && mirrorDiff(shape) > spec.sym) continue;
      var options = [1, 2, 3].map(function (q) { return { s: rotate(shape, q), kind: 'answer' }; });
      var odd = null;
      if (spec.oddNear && ctx.randInt(0, 1)) {
        var nm = nearMiss(shape, spec.box, ctx);
        if (nm) {
          var banned = allKeys(shape), clash = false;
          Object.keys(allKeys(nm)).forEach(function (k) { if (banned[k]) clash = true; });
          if (!clash) odd = { s: randomTurn(nm, ctx), kind: 'other' };
        }
      }
      if (!odd) odd = { s: rotate(mirror, ctx.randInt(0, 3)), kind: 'mirror' };
      options.push(odd);
      var box = spec.box;
      options.forEach(function (o) { var e = extent(o.s); box = Math.max(box, e.h, e.w); });
      return { shape: shape, options: ctx.shuffle(options), box: box, odd: true };
    }
    return null;
  }

  function buildRound(spec, ctx) {
    var turns = spec.turn270 ? [1, 2, 3] : [1, 2];
    for (var attempt = 0; attempt < 300; attempt++) {
      var shape = growShape(spec.cells, spec.box, ctx);
      if (!shape) continue;
      var origRot = rotationKeys(shape);
      var mirror = reflect(shape);
      // chiral check: the mirror image must not be reachable by rotation
      if (origRot[keyOf(mirror)]) continue;
      if (spec.sym && attempt < 290 && mirrorDiff(shape) > spec.sym) continue;

      var origKey = keyOf(shape);
      // the answer should look different from the original (a real turn)
      var answerTurns = ctx.shuffle(turns).filter(function (q) { return keyOf(rotate(shape, q)) !== origKey; });
      if (!answerTurns.length) continue;
      var answer = rotate(shape, answerTurns[0]);

      var used = {};
      used[keyOf(answer)] = true;
      var options = [{ s: answer, kind: 'answer' }];
      var wantMirrors = Math.min(spec.mirrors, spec.options - 1);
      var mirrorTurns = ctx.shuffle([0, 1, 2, 3]);
      for (var m = 0; m < mirrorTurns.length && options.length - 1 < wantMirrors; m++) {
        var ms = rotate(mirror, mirrorTurns[m]);
        if (used[keyOf(ms)]) continue;
        used[keyOf(ms)] = true;
        options.push({ s: ms, kind: 'mirror' });
      }

      // fill the rest with different shapes of the same size
      var banned = allKeys(shape);
      var guard = 0;
      var nearUsed = false;
      while (options.length < spec.options && guard++ < 200) {
        var other = (spec.near && (spec.nearAll || !nearUsed)) ? nearMiss(shape, spec.box, ctx) : growShape(spec.cells, spec.box, ctx);
        if (spec.near && !nearUsed) nearUsed = true;
        if (!other) continue;
        var ok = true;
        var otherKeys = allKeys(other);
        Object.keys(otherKeys).forEach(function (k) { if (banned[k]) ok = false; });
        if (!ok) continue;
        Object.keys(otherKeys).forEach(function (k) { banned[k] = true; });
        other = randomTurn(other, ctx);
        options.push({ s: other, kind: 'other' });
      }
      if (options.length < spec.options) continue;

      var box = spec.box;
      options.forEach(function (o) { var e = extent(o.s); box = Math.max(box, e.h, e.w); });
      return { shape: shape, options: ctx.shuffle(options), box: box };
    }
    return null;
  }

  BrainGames.register({
    id: 'rotate-shape',
    name: 'סיבוב צורות',
    skill: 'perception',
    tagline: 'מצאו את אותה צורה, רק מסובבת',
    benefit: 'סיבוב מנטלי ותפיסה מרחבית',
    instructions: [
      'למעלה תופיע צורה צבעונית.',
      'דמיינו שאתם מסובבים אותה על השולחן, בלי להפוך אותה.',
      'לחצו על הצורה שהיא אותה צורה בדיוק, רק מסובבת.',
      'שימו לב: צורה הפוכה כמו במראה היא לא אותה צורה.',
      'בשלבים הגבוהים יש גם שאלה הפוכה: שלוש צורות הן אותה צורה מסובבת, ואחת שונה. לחצו על השונה.'
    ],
    css: css,
    _model: { LEVELS: LEVELS, buildRound: buildRound, buildOddRound: buildOddRound, mirrorDiff: mirrorDiff,
      allKeys: allKeys, rotationKeys: rotationKeys, keyOf: keyOf, connected: connected },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var round = 0;
      var score = 0;
      // which rounds ask "which one is NOT the same?" (never the first one)
      var oddPlan = [];
      for (var k = 1; k < ROUNDS; k++) oddPlan.push(k <= (spec.odd || 0));
      oddPlan = [false].concat(ctx.shuffle(oddPlan));

      function gridNode(s, box) {
        var e = extent(s);
        var offR = Math.floor((box - e.h) / 2), offC = Math.floor((box - e.w) / 2);
        var cells = [];
        for (var r = 0; r < box; r++) {
          for (var c = 0; c < box; c++) {
            cells.push(el('div', { class: 'rs-cell' + (has(s, r - offR, c - offC) ? ' rs-on' : '') }));
          }
        }
        return el('div', { class: 'rs-grid', style: { '--n': String(box) }, 'aria-hidden': 'true' }, cells);
      }

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({
            correct: score,
            total: ROUNDS,
            note: 'זיהיתם ' + score + ' מתוך ' + ROUNDS + ' צורות מסובבות של ' + spec.cells + ' משבצות'
          });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        playRound();
      }

      function playRound() {
        root.innerHTML = '';
        var data = (oddPlan[round - 1] && buildOddRound(spec, ctx)) || buildRound(spec, ctx);
        if (!data) { nextRound(); return; } // practically unreachable
        var isOdd = !!data.odd;

        ctx.setStatus(isOdd ? 'שאלה הפוכה: איזו צורה שונה?' : 'איזו צורה היא אותה צורה, רק מסובבת?');

        var target = el('div', { class: 'rs-target' }, [
          el('span', { class: 'rs-cap' }, 'הצורה'),
          gridNode(data.shape, data.box)
        ]);

        var answered = false;
        var buttons = data.options.map(function (opt, i) {
          var mark = el('span', { class: 'rs-mark', 'aria-hidden': 'true' }, '');
          var b = el('button', {
            class: 'g-choice rs-opt', type: 'button', 'aria-label': 'אפשרות ' + (i + 1),
            onclick: function () { choose(i); }
          }, [gridNode(opt.s, data.box), mark]);
          b._mark = mark;
          return b;
        });
        var opts = el('div', { class: 'rs-opts' }, buttons);

        root.appendChild(target);
        root.appendChild(el('p', { class: 'g-hint rs-hint' }, isOdd ? 'שלוש מסובבות, אחת שונה.' : 'מותר לסובב, אסור להפוך.'));
        root.appendChild(opts);

        function choose(i) {
          if (answered) return;
          answered = true;
          ctx.sound('tap');
          buttons.forEach(function (b) { b.disabled = true; });
          var chosen = data.options[i];
          var ok = isOdd ? chosen.kind !== 'answer' : chosen.kind === 'answer';
          if (ok) score++;
          var msg;
          if (isOdd) {
            data.options.forEach(function (opt, j) {
              if (opt.kind !== 'answer') { buttons[j].classList.add('is-correct'); buttons[j]._mark.textContent = opt.kind === 'mirror' ? '✓ הפוכה' : '✓ אחרת'; }
            });
            if (!ok) {
              buttons[i].classList.add('is-wrong');
              buttons[i]._mark.textContent = '✗ מסובבת';
              msg = 'זו אותה צורה, רק מסובבת. השונה מסומנת בירוק';
            }
          } else {
            data.options.forEach(function (opt, j) {
              if (opt.kind === 'answer') { buttons[j].classList.add('is-correct'); buttons[j]._mark.textContent = '✓ מסובבת'; }
            });
            if (!ok) {
              buttons[i].classList.add('is-wrong');
              buttons[i]._mark.textContent = chosen.kind === 'mirror' ? '✗ הפוכה' : '✗ אחרת';
              msg = chosen.kind === 'mirror'
                ? 'זו תמונת מראה: הצורה הפוכה, לא מסובבת. התשובה מסומנת בירוק'
                : 'זו צורה אחרת. התשובה מסומנת בירוק';
            }
          }
          ctx.setStatus(ok ? (isOdd ? 'מצוין, זו הצורה השונה!' : 'מצוין, זו אותה צורה!') : (isOdd ? 'הנה הצורה השונה' : 'הנה הצורה המסובבת'));
          ctx.feedback(ok, msg).then(function () {
            return ctx.wait(ok ? 600 : 1400);
          }).then(nextRound);
        }
      }

      nextRound();
    }
  });
})();
