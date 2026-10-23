/* תמונת מראה — pick the exact left↔right mirror image of a pattern (perception). */
(function () {
  'use strict';

  var ROUNDS = 7;

  // Per level (1–20): grid size, filled cells, options shown, colours (1–2),
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
    { size: 5, count: 13, options: 4, colors: 2, near: true }   // 20
  ];

  var css = [
    '.mi-stage{display:flex;direction:ltr;align-items:stretch;justify-content:center;gap:.6rem;width:100%;max-width:22rem;}',
    '.mi-side{flex:0 1 auto;width:min(8rem,17dvh);min-width:0;display:flex;flex-direction:column;align-items:center;gap:.25rem;}',
    '.mi-cap{direction:rtl;font-size:1.1rem;line-height:1.3;color:var(--ink-soft);font-weight:700;}',
    '.mi-mirror{flex:0 0 auto;width:.55rem;border-radius:.3rem;background:repeating-linear-gradient(to bottom,var(--accent) 0 .7rem,var(--accent-soft) .7rem 1.1rem);}',
    '.mi-q{width:100%;aspect-ratio:1;border:3px dashed var(--line);border-radius:var(--radius-sm);display:grid;place-items:center;',
    'font-size:clamp(2.2rem,9vw,3rem);font-weight:900;color:var(--ink-soft);background:var(--surface);}',
    '.mi-grid{--n:3;display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:3px;direction:ltr;width:100%;',
    'padding:4px;border-radius:var(--radius-sm);background:var(--surface);border:2px solid var(--line);}',
    '.mi-cell{aspect-ratio:1;border-radius:3px;background:var(--surface-2);}',
    '.mi-cell.mi-a{background:var(--perception);}',
    '.mi-cell.mi-b{background:var(--sun);}',
    '.mi-hint{margin:0;font-size:1.1rem;line-height:1.3;}',
    /* options: 2×2 grid sized by screen height so the whole round fits one phone screen */
    '.mi-opts{display:flex;flex-wrap:wrap;justify-content:center;gap:.7rem;width:100%;max-width:20rem;}',
    '.mi-opts .mi-opt.g-choice{flex:none;position:relative;padding:.5rem;min-height:0;display:flex;align-items:center;justify-content:center;}',
    '.mi-opt .mi-grid{width:min(7rem,16dvh);border-color:transparent;}',
    '.mi-mark{position:absolute;top:-.75rem;left:50%;transform:translateX(-50%);white-space:nowrap;',
    'font-size:1.1rem;font-weight:900;line-height:1.3;padding:0 .45rem;border-radius:999px;background:var(--surface);border:2px solid currentColor;}',
    '.mi-mark:empty{display:none;}'
  ].join('');

  /* ---------- pattern helpers (pattern = flat array, 0 empty / 1 colour A / 2 colour B) ---------- */
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

  // Build one round: original, answer (mirror) and distinct distractors.
  function buildRound(spec, ctx) {
    var n = spec.size;
    for (var attempt = 0; attempt < 400; attempt++) {
      var orig = makePattern(n, spec.count, spec.colors, ctx);
      var answer = flipLR(orig, n);
      var upDown = flipUD(orig, n);
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
      distractors = ctx.shuffle(distractors).slice(0, spec.options - 1);
      var options = ctx.shuffle([{ p: answer, kind: 'answer' }].concat(distractors));
      return { orig: orig, options: options };
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
      'אין שעון. הסתכלו בנחת לפני שבוחרים.'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var n = spec.size;
      var round = 0;
      var score = 0;

      function gridNode(p) {
        var cells = p.map(function (v) {
          return el('div', { class: 'mi-cell' + (v === 1 ? ' mi-a' : v === 2 ? ' mi-b' : '') });
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
        var data = buildRound(spec, ctx);
        if (!data) { nextRound(); return; } // practically unreachable

        ctx.setStatus('איך הציור ייראה במראה?');

        var stage = el('div', { class: 'mi-stage' }, [
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
        root.appendChild(el('p', { class: 'g-hint mi-hint' }, 'רק ימין ושמאל מתחלפים.'));
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
            else if (chosen.kind === 'updown') msg = 'זה הפוך מלמעלה למטה. התשובה מסומנת בירוק';
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
