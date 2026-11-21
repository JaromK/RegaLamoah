/* תמונת מראה — pick the exact left↔right mirror image of a pattern (perception). */
(function () {
  'use strict';

  var ROUNDS = 7;

  // Per level (1–50): grid size, filled cells, options shown, colours (1–3),
  // and `near` = the "one cell moved" distractor moves only to a neighbouring cell (subtler).
  var LEVELS = [
    { size: 3, count: 3,  options: 3, colors: 1, near: false }, // 1
    { size: 3, count: 4,  options: 3, colors: 1, near: false }, // 2
    { size: 3, count: 5,  options: 3, colors: 1, near: false }, // 3
    { size: 4, count: 4,  options: 3, colors: 1, near: false }, // 4
    { size: 4, count: 5,  options: 3, colors: 1, near: false }, // 5
    { size: 4, count: 5,  options: 4, colors: 1, near: false }, // 6
    { size: 4, count: 6,  options: 4, colors: 1, near: false }, // 7
    { size: 4, count: 7,  options: 4, colors: 1, near: false }, // 8
    { size: 4, count: 6,  options: 4, colors: 2, near: false }, // 9
    { size: 4, count: 7,  options: 4, colors: 2, near: false }, // 10
    { size: 5, count: 6,  options: 4, colors: 1, near: false }, // 11
    { size: 5, count: 7,  options: 4, colors: 1, near: true },  // 12
    { size: 5, count: 8,  options: 4, colors: 1, near: true },  // 13
    { size: 5, count: 7,  options: 4, colors: 2, near: true },  // 14
    { size: 5, count: 8,  options: 4, colors: 2, near: true },  // 15
    { size: 5, count: 9,  options: 4, colors: 2, near: true },  // 16
    { size: 5, count: 10, options: 4, colors: 2, near: true },  // 17
    { size: 5, count: 11, options: 4, colors: 2, near: true },  // 18
    { size: 5, count: 12, options: 4, colors: 2, near: true },  // 19
    { size: 5, count: 13, options: 4, colors: 2, near: true },  // 20
    // 21–30: the easy wrong answers (the unchanged picture, the upside-down one) give way to near
    // misses: another cell moved, or two colours swapped (hard = how many easy answers are replaced)
    { size: 5, count: 12, options: 4, colors: 2, near: true, hard: 1 }, // 21
    { size: 5, count: 13, options: 4, colors: 2, near: true, hard: 1 }, // 22
    { size: 5, count: 14, options: 4, colors: 2, near: true, hard: 1 }, // 23
    { size: 5, count: 11, options: 4, colors: 2, near: true, hard: 2 }, // 24
    { size: 5, count: 12, options: 4, colors: 2, near: true, hard: 2 }, // 25
    { size: 5, count: 13, options: 4, colors: 2, near: true, hard: 2 }, // 26
    { size: 5, count: 14, options: 4, colors: 2, near: true, hard: 2 }, // 27
    { size: 5, count: 15, options: 4, colors: 2, near: true, hard: 2 }, // 28
    { size: 5, count: 16, options: 4, colors: 2, near: true, hard: 2 }, // 29
    { size: 5, count: 17, options: 4, colors: 2, near: true, hard: 2 }, // 30
    // 31–50: three colours (31+), then two of the three wrong answers are colour swaps (hard 3, 34+); from 39
    // some rounds use a mirror below the picture (ud = share: top and bottom swap), and from 46 the
    // swapped colours sit side by side (nearSwap)
    { size: 5, count: 15, options: 4, colors: 3, near: true, hard: 2 }, // 31
    { size: 5, count: 16, options: 4, colors: 3, near: true, hard: 2 }, // 32
    { size: 5, count: 17, options: 4, colors: 3, near: true, hard: 2 }, // 33
    { size: 5, count: 14, options: 4, colors: 3, near: true, hard: 3 }, // 34
    { size: 5, count: 15, options: 4, colors: 3, near: true, hard: 3 }, // 35
    { size: 5, count: 16, options: 4, colors: 3, near: true, hard: 3 }, // 36
    { size: 5, count: 17, options: 4, colors: 3, near: true, hard: 3 }, // 37
    { size: 5, count: 18, options: 4, colors: 3, near: true, hard: 3 }, // 38
    { size: 5, count: 17, options: 4, colors: 3, near: true, hard: 3, ud: 0.25 }, // 39
    { size: 5, count: 18, options: 4, colors: 3, near: true, hard: 3, ud: 0.3 }, // 40
    { size: 5, count: 16, options: 4, colors: 3, near: true, hard: 3, ud: 0.4 }, // 41
    { size: 5, count: 17, options: 4, colors: 3, near: true, hard: 3, ud: 0.4 }, // 42
    { size: 5, count: 17, options: 4, colors: 3, near: true, hard: 3, ud: 0.4 }, // 43
    { size: 5, count: 18, options: 4, colors: 3, near: true, hard: 3, ud: 0.4 }, // 44
    { size: 5, count: 18, options: 4, colors: 3, near: true, hard: 3, ud: 0.4 }, // 45
    { size: 5, count: 17, options: 4, colors: 3, near: true, hard: 3, ud: 0.5, nearSwap: true }, // 46
    { size: 5, count: 18, options: 4, colors: 3, near: true, hard: 3, ud: 0.5, nearSwap: true }, // 47
    { size: 5, count: 18, options: 4, colors: 3, near: true, hard: 3, ud: 0.5, nearSwap: true }, // 48
    { size: 5, count: 19, options: 4, colors: 3, near: true, hard: 3, ud: 0.5, nearSwap: true }, // 49
    { size: 5, count: 19, options: 4, colors: 3, near: true, hard: 3, ud: 0.5, nearSwap: true } // 50
  ];

  var css = [
    '.mi-stage{display:flex;direction:ltr;align-items:stretch;justify-content:center;gap:.6rem;width:100%;max-width:22rem;}',
    '.mi-side{flex:0 1 auto;width:min(8rem,17svh);min-width:0;display:flex;flex-direction:column;align-items:center;gap:.25rem;}',
    '.mi-cap{direction:rtl;font-size:1.1rem;line-height:1.3;color:var(--ink-soft);font-weight:700;}',
    '.mi-mirror{flex:0 0 auto;width:.55rem;border-radius:.3rem;background:repeating-linear-gradient(to bottom,var(--accent) 0 .7rem,var(--accent-soft) .7rem 1.1rem);}',
    '.mi-q{width:100%;aspect-ratio:1;border:3px dashed var(--line);border-radius:var(--radius-sm);display:grid;place-items:center;',
    'font-size:clamp(2.2rem,9vw,3rem);font-weight:900;color:var(--ink-soft);background:var(--surface);}',
    '.mi-grid{--n:3;display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:3px;direction:ltr;width:100%;',
    'padding:4px;border-radius:var(--radius-sm);background:var(--surface);border:2px solid var(--line);}',
    '.mi-cell{aspect-ratio:1;border-radius:3px;background:var(--surface-2);}',
    '.mi-cell.mi-a{background:var(--c-blue);}',
    '.mi-cell.mi-b{background:var(--c-yellow);}',
    '.mi-cell.mi-c{background:var(--c-red);}',
    /* mirror below the picture (top ↔ bottom) */
    '.mi-stage.mi-ud{flex-direction:column;align-items:center;gap:.3rem;}',
    '.mi-ud .mi-mirror{width:min(8rem,17svh);height:.55rem;background:repeating-linear-gradient(to right,var(--accent) 0 .7rem,var(--accent-soft) .7rem 1.1rem);}',
    '.mi-hint{margin:0;font-size:1.1rem;line-height:1.3;}',
    /* options: 2×2 grid sized by screen height so the whole round fits one phone screen */
    '.mi-opts{display:flex;flex-wrap:wrap;justify-content:center;gap:.7rem;width:100%;max-width:20rem;}',
    '.mi-opts .mi-opt.g-choice{flex:none;position:relative;padding:.5rem;min-height:0;display:flex;align-items:center;justify-content:center;}',
    '.mi-opt .mi-grid{width:min(7rem,16svh);border-color:transparent;}',
    '.mi-mark{position:absolute;top:-.75rem;left:50%;transform:translateX(-50%);white-space:nowrap;',
    'font-size:1.1rem;font-weight:900;line-height:1.3;padding:0 .45rem;border-radius:999px;background:var(--surface);border:2px solid currentColor;}',
    '.mi-mark:empty{display:none;}'
  ].join('');

  /* ---------- pattern helpers (pattern = flat array, 0 empty / 1 colour A / 2 colour B / 3 colour C) ---------- */
  function keyOf(p) { return p.join(''); }

  function flipLR(p, n) {
    var out = [];
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) out.push(p[r * n + (n - 1 - c)]);
    return out;
  }

  function flipUD(p, n) {
    var out = [];
    for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) out.push(p[(n - 1 - r) * n + c]);
    return out;
  }

  function makePattern(n, count, colors, ctx) {
    var idx = [];
    for (var i = 0; i < n * n; i++) idx.push(i);
    var cells = ctx.shuffle(idx).slice(0, count);
    var p = [];
    for (i = 0; i < n * n; i++) p.push(0);
    if (colors > 2) {
      // three colours, about a third each (each at least 2)
      var third = Math.floor(count / 3);
      var c3 = Math.max(2, third - ctx.randInt(0, 1)), c2 = Math.max(2, third + ctx.randInt(0, 1) - ctx.randInt(0, 1));
      cells.forEach(function (cell, k) { p[cell] = k < c3 ? 3 : k < c3 + c2 ? 2 : 1; });
      return p;
    }
    var bCount = colors > 1 ? Math.max(1, Math.floor(count / 2) - ctx.randInt(0, 1)) : 0;
    cells.forEach(function (cell, k) { p[cell] = k < bCount ? 2 : 1; });
    return p;
  }

  // Move one filled cell of `p` to an empty cell (a neighbouring one when `near`).
  function moveOne(p, n, near, ctx) {
    var filled = [], k;
    for (k = 0; k < p.length; k++) if (p[k]) filled.push(k);
    var tries = ctx.shuffle(filled);
    for (var t = 0; t < tries.length; t++) {
      var from = tries[t];
      var targets = [];
      for (k = 0; k < p.length; k++) {
        if (p[k]) continue;
        if (near) {
          var dr = Math.abs(Math.floor(k / n) - Math.floor(from / n));
          var dc = Math.abs((k % n) - (from % n));
          if (dr + dc !== 1) continue;
        }
        targets.push(k);
      }
      if (targets.length) {
        var to = ctx.pick(targets);
        var out = p.slice();
        out[to] = out[from];
        out[from] = 0;
        return out;
      }
    }
    return null;
  }

  // Swap the colours of two cells of different colours (same shape, colours in the wrong places).
  // adjacent: only two cells side by side or one above the other (subtler).
  function colorSwap(p, ctx, n, adjacent) {
    var pairs = [];
    for (var i = 0; i < p.length; i++) for (var j = i + 1; j < p.length; j++) {
      if (!p[i] || !p[j] || p[i] === p[j]) continue;
      if (adjacent && Math.abs(Math.floor(i / n) - Math.floor(j / n)) + Math.abs((i % n) - (j % n)) !== 1) continue;
      pairs.push([i, j]);
    }
    if (!pairs.length) return adjacent ? colorSwap(p, ctx, n, false) : null;
    var pr = ctx.pick(pairs);
    var out = p.slice();
    out[pr[0]] = p[pr[1]]; out[pr[1]] = p[pr[0]];
    return out;
  }

  // Build one round: original, answer (mirror) and distinct distractors.
  // axis: 'lr' = the usual mirror at the side (left ↔ right), 'ud' = a mirror below (top ↔ bottom);
  // the "wrong mirror" distractor is then the flip the other way.
  function buildRound(spec, ctx, axis) {
    var n = spec.size;
    for (var attempt = 0; attempt < 400; attempt++) {
      var orig = makePattern(n, spec.count, spec.colors, ctx);
      var answer = axis === 'ud' ? flipUD(orig, n) : flipLR(orig, n);
      var upDown = axis === 'ud' ? flipLR(orig, n) : flipUD(orig, n);
      var seen = {};
      seen[keyOf(answer)] = true;
      // a left↔right symmetric pattern looks the same in the mirror — regenerate
      if (seen[keyOf(orig)]) continue;
      seen[keyOf(orig)] = true;
      if (seen[keyOf(upDown)]) continue;
      seen[keyOf(upDown)] = true;
      var moved = null;
      for (var m = 0; m < 20 && !moved; m++) {
        var cand = moveOne(answer, n, spec.near, ctx);
        if (cand && !seen[keyOf(cand)]) moved = cand;
      }
      if (!moved) continue;
      var distractors = [
        { p: orig, kind: 'same' },
        { p: upDown, kind: 'updown' },
        { p: moved, kind: 'moved' }
      ];
      if (spec.hard) {
        var near = [];
        for (var h = 0; h < 30 && near.length < spec.hard; h++) {
          // hard 3 (34+): both extra near misses are colour swaps, the subtlest change
          var wantMove = spec.hard < 3 && near.length % 2 === 0;
          var c2 = wantMove ? moveOne(answer, n, true, ctx) : colorSwap(answer, ctx, n, spec.nearSwap);
          var swapKind = wantMove ? 'moved' : 'swap';
          if (c2 && !seen[keyOf(c2)] && keyOf(c2) !== keyOf(moved)) { seen[keyOf(c2)] = true; near.push({ p: c2, kind: swapKind }); }
        }
        if (near.length < spec.hard) continue;
        // keep the "moved" one; hard 1 replaces the unchanged picture, hard 2 also the upside-down one,
        // hard 3 makes both of the others colour swaps
        distractors = [{ p: moved, kind: 'moved' }].concat(near);
        if (spec.hard < 2) distractors.push({ p: upDown, kind: 'updown' });
        distractors = distractors.slice(0, 3);
      }
      distractors = ctx.shuffle(distractors).slice(0, spec.options - 1);
      var options = ctx.shuffle([{ p: answer, kind: 'answer' }].concat(distractors));
      return { orig: orig, options: options, axis: axis === 'ud' ? 'ud' : 'lr' };
    }
    return null;
  }

  BrainGames.register({
    id: 'mirror-image',
    name: 'תמונת מראה',
    skill: 'perception',
    tagline: 'מצאו איך הציור נראה במראה',
    benefit: 'תפיסה מרחבית ודמיון חזותי',
    instructions: [
      'משמאל יש ציור של משבצות, ולידו קו של מראה.',
      'דמיינו איך הציור ייראה במראה: מה שבצד שמאל יעבור לצד ימין.',
      'לחצו על התמונה שנראית בדיוק כמו במראה.',
      'אין שעון. הסתכלו בנחת לפני שבוחרים.',
      'ברמות הגבוהות לפעמים המראה מתחת לציור: אז מה שלמעלה עובר למטה, וימין ושמאל נשארים.'
    ],
    css: css,
    _model: { LEVELS: LEVELS, buildRound: buildRound, flipLR: flipLR, flipUD: flipUD },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var n = spec.size;
      var round = 0;
      var score = 0;

      function gridNode(p) {
        var cells = p.map(function (v) {
          return el('div', { class: 'mi-cell' + (v === 1 ? ' mi-a' : v === 2 ? ' mi-b' : v === 3 ? ' mi-c' : '') });
        });
        return el('div', { class: 'mi-grid', style: { '--n': String(n) }, 'aria-hidden': 'true' }, cells);
      }

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({
            correct: score,
            total: ROUNDS,
            note: 'מצאתם את תמונת המראה ' + score + ' מתוך ' + ROUNDS + ' פעמים, בלוח של ' + n + '×' + n
          });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        playRound();
      }

      function playRound() {
        root.innerHTML = '';
        var ud = spec.ud && Math.random() < spec.ud;
        var data = buildRound(spec, ctx, ud ? 'ud' : 'lr');
        if (!data) { nextRound(); return; } // practically unreachable

        ctx.setStatus(ud ? 'המראה למטה: איך הציור ייראה בה?' : 'איך הציור ייראה במראה?');

        // a mirror below the picture: no "?" box and no caption, just the picture and the mirror line under it
        var stage = ud ? el('div', { class: 'mi-stage mi-ud' }, [
          el('div', { class: 'mi-side', 'aria-label': 'הציור, והמראה מתחתיו' }, [gridNode(data.orig)]),
          el('div', { class: 'mi-mirror', 'aria-hidden': 'true' })
        ]) : el('div', { class: 'mi-stage' }, [
          el('div', { class: 'mi-side' }, [el('span', { class: 'mi-cap' }, 'הציור'), gridNode(data.orig)]),
          el('div', { class: 'mi-mirror', 'aria-hidden': 'true' }),
          el('div', { class: 'mi-side' }, [el('span', { class: 'mi-cap' }, 'במראה'), el('div', { class: 'mi-q', 'aria-hidden': 'true' }, '?')])
        ]);

        var answered = false;
        var buttons = data.options.map(function (opt, i) {
          var mark = el('span', { class: 'mi-mark', 'aria-hidden': 'true' }, '');
          var b = el('button', {
            class: 'g-choice mi-opt', type: 'button', 'aria-label': 'אפשרות ' + (i + 1),
            onclick: function () { choose(i); }
          }, [gridNode(opt.p), mark]);
          b._mark = mark;
          return b;
        });
        var opts = el('div', { class: 'mi-opts' }, buttons);

        root.appendChild(stage);
        root.appendChild(el('p', { class: 'g-hint mi-hint' }, ud ? 'רק למעלה ולמטה מתחלפים.' : 'רק ימין ושמאל מתחלפים.'));
        root.appendChild(opts);

        function choose(i) {
          if (answered) return;
          answered = true;
          ctx.sound('tap');
          buttons.forEach(function (b) { b.disabled = true; });
          var chosen = data.options[i];
          var ok = chosen.kind === 'answer';
          if (ok) score++;
          data.options.forEach(function (opt, j) {
            if (opt.kind === 'answer') { buttons[j].classList.add('is-correct'); buttons[j]._mark.textContent = '✓ במראה'; }
          });
          if (!ok) { buttons[i].classList.add('is-wrong'); buttons[i]._mark.textContent = '✗'; }
          var msg;
          if (!ok) {
            if (chosen.kind === 'same') msg = 'זה הציור עצמו, בלי מראה. התשובה מסומנת בירוק';
            else if (chosen.kind === 'updown') msg = (ud ? 'זה הפוך מימין לשמאל.' : 'זה הפוך מלמעלה למטה.') + ' התשובה מסומנת בירוק';
            else if (chosen.kind === 'swap') msg = 'כמעט! שני צבעים התחלפו. התשובה מסומנת בירוק';
            else msg = 'כמעט! משבצת אחת זזה. התשובה מסומנת בירוק';
          }
          ctx.setStatus(ok ? 'מצוין, בדיוק כמו במראה!' : 'הנה התמונה הנכונה');
          ctx.feedback(ok, msg).then(function () {
            return ctx.wait(ok ? 600 : 1400);
          }).then(nextRound);
        }
      }

      nextRound();
    }
  });
})();
