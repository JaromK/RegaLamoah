/* חיבור נקודות — tap the dots in order: 1-2-3…, then numbers and letters in turn (1-א-2-ב…) (executive),
   numbers and days of the week, and counting down: switching between two sequences. Untimed. */
(function () {
  'use strict';

  var LETTERS = 'אבגדהוזחטיכלמנסעפצקרשת'.split(''); // the whole alphabet: mixed boards reach 44 dots
  var DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  /* Per level (1–30). Difficulty grows by dot count (up to 50, dots shrink to fit) and by rules, never by time:
     num  = from, from+step, … (n dots); step < 0 counts down. decoys = extra numbers in the same range that are
            not in the sequence (tapping one is a mistake).
     mix  = 1, א, 2, ב… · down = counting down, number and letter: 5, ה, 4, ד…
     days = 1, ראשון, 2, שני… · tri = 1, א, ראשון, 2, ב, שני… (three sequences in turn) */
  var LEVELS = [
    { kind: 'num', n: 8 },                                  // 1
    { kind: 'num', n: 12 },                                 // 2
    { kind: 'num', n: 16 },                                 // 3
    { kind: 'num', n: 20 },                                 // 4
    { kind: 'num', n: 25 },                                 // 5
    { kind: 'mix', n: 12 },                                 // 6
    { kind: 'num', n: 30 },                                 // 7
    { kind: 'num', n: 15, from: 2, step: 2, decoys: 5 },    // 8  2, 4, 6…
    { kind: 'mix', n: 16 },                                 // 9
    { kind: 'num', n: 35 },                                 // 10
    { kind: 'num', n: 14, from: 3, step: 3, decoys: 8 },    // 11 3, 6, 9…
    { kind: 'mix', n: 20 },                                 // 12
    { kind: 'num', n: 40 },                                 // 13
    { kind: 'days', n: 12 },                                // 14
    { kind: 'mix', n: 24 },                                 // 15
    { kind: 'num', n: 12, from: 5, step: 5, decoys: 10 },   // 16 5, 10, 15…
    { kind: 'num', n: 45 },                                 // 17
    { kind: 'down', n: 16 },                                // 18
    { kind: 'mix', n: 30 },                                 // 19
    { kind: 'num', n: 50 },                                 // 20
    { kind: 'num', n: 30, from: 50, step: -1 },             // 21 50, 49, 48…
    { kind: 'num', n: 18, from: 50, step: -2, decoys: 12 }, // 22 50, 48, 46…
    { kind: 'mix', n: 36 },                                 // 23
    { kind: 'num', n: 18, from: 4, step: 4, decoys: 14 },   // 24 4, 8, 12…
    { kind: 'num', n: 50, from: 50, step: -1 },             // 25 50 … 1
    { kind: 'down', n: 24 },                                // 26
    { kind: 'tri', n: 15 },                                 // 27 1, א, ראשון…
    { kind: 'mix', n: 44 },                                 // 28
    { kind: 'num', n: 20, from: 60, step: -3, decoys: 16 }, // 29 60, 57, 54…
    { kind: 'tri', n: 21 }                                  // 30
  ];

  /* The sequence to tap, in order. */
  function labels(spec) {
    var kind = spec.kind, n = spec.n, out = [], i;
    if (kind === 'num') {
      var from = spec.from || 1, step = spec.step || 1;
      for (i = 0; i < n; i++) out.push(String(from + i * step));
      return out;
    }
    if (kind === 'tri') {
      for (i = 0; out.length < n; i++) {
        out.push(String(i + 1));
        if (out.length < n) out.push(LETTERS[i]);
        if (out.length < n) out.push(DAYS[i]);
      }
      return out;
    }
    var half = Math.ceil(n / 2);
    for (var k = 0; k < half; k++) {
      var num = kind === 'down' ? half - k : k + 1;
      out.push(String(num));
      if (out.length < n) out.push(kind === 'days' ? DAYS[num - 1] : LETTERS[num - 1]);
    }
    return out;
  }

  /* Decoys: numbers inside the sequence's range that the sequence skips (e.g. odd numbers among 2, 4, 6…). */
  function decoys(spec, order, shuffle) {
    if (!spec.decoys) return [];
    var nums = order.map(Number);
    var lo = Math.min.apply(null, nums), hi = Math.max.apply(null, nums);
    var pool = [];
    for (var v = lo; v <= hi; v++) if (nums.indexOf(v) === -1) pool.push(String(v));
    return shuffle(pool).slice(0, spec.decoys);
  }

  /* Dot centres (in % of the board) and diameters (px) for a W×H px board. The board is cut into a loose
     grid with a few more cells than dots; each dot gets its own random cell, a random size (68–100% of the
     largest that fits, at most 70px) and a random spot inside the cell, so dots never overlap or line up.
     wide = some labels are words (days), which need a wider pill. */
  function layout(n, W, H, rnd, wide) {
    var a = wide ? 1.8 : 1; // wanted cell width / height
    var cols = Math.max(1, Math.round(Math.sqrt(n * W / (H * a))));
    var rows = Math.ceil(n / cols);
    while (cols * rows < n + Math.ceil(n / 8)) { if (W / cols / a > H / rows) cols++; else rows++; }
    var cw = W / cols, ch = H / rows;
    var cells = [];
    for (var c = 0; c < cols * rows; c++) cells.push(c);
    for (var i = cells.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var t = cells[i]; cells[i] = cells[j]; cells[j] = t; }
    var big = Math.min(70, ch - 4, (wide ? cw / 1.8 : cw) - 4);
    var pts = [], sizes = [];
    for (var k = 0; k < n; k++) {
      var cell = cells[k], cx = cell % cols, cy = Math.floor(cell / cols);
      var d = Math.round(big * (0.68 + rnd() * 0.32));
      var w = wide ? d * 1.8 : d;
      var x = cx * cw + w / 2 + 2 + rnd() * Math.max(0, cw - w - 4);
      var y = cy * ch + d / 2 + 2 + rnd() * Math.max(0, ch - d - 4);
      pts.push([x / W * 100, y / H * 100]);
      sizes.push(d);
    }
    return { pts: pts, sizes: sizes };
  }

  var css = [
    '.dt-board{position:relative;width:100%;max-width:24rem;height:min(30rem,calc(100svh - 17rem));min-height:20rem;',
    'background:var(--surface-2);border:2px solid var(--line);border-radius:var(--radius);touch-action:manipulation;}',
    '.dt-lines{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}',
    '.dt-lines line{stroke:var(--attention);stroke-width:1;stroke-linecap:round;vector-effect:non-scaling-stroke;}',
    /* each dot has its own size (--d); the label scales with it */
    '.dt-dot{--d:3.3rem;position:absolute;transform:translate(-50%,-50%);min-width:var(--d);height:var(--d);padding:0 .3rem;border-radius:999px;',
    'border:3px solid var(--ink-soft);background:var(--surface);color:var(--ink);font-weight:900;font-size:calc(var(--d) * .42);line-height:1;cursor:pointer;',
    'display:grid;place-items:center;white-space:nowrap;}',
    '.dt-dot.dt-word{font-size:calc(var(--d) * .3);}',
    '.dt-dot.is-done{background:var(--attention);border-color:var(--attention);color:var(--surface);}',
    '.dt-dot.is-last{box-shadow:0 0 0 4px var(--attention-soft);}',
    '.dt-dot.is-next-hint{border-color:var(--sun);box-shadow:0 0 0 5px var(--sun);}',
    '.dt-dot.is-miss{animation:dt-shake .35s;}',
    '@keyframes dt-shake{25%{transform:translate(-56%,-50%)}75%{transform:translate(-44%,-50%)}}',
    '@media (prefers-reduced-motion: reduce){.dt-dot.is-miss{animation:none;}}',
    '.dt-next{margin:0;font-size:1.15rem;font-weight:800;text-align:center;min-height:1.6rem;}'
  ].join('');

  function intro(spec, order) {
    if (spec.kind === 'down') return 'סופרים לאחור, לסירוגין מספר ואות: ' + order.slice(0, 4).join(', ') + '…';
    if (spec.kind !== 'num') return INTRO[spec.kind];
    var step = spec.step || 1, seq = order.slice(0, 3).join(', ') + '…';
    if (step === 1) return 'חברו את המספרים לפי הסדר: ' + seq;
    if (step === -1) return 'סופרים לאחור: ' + seq;
    return (step > 0 ? 'קופצים ב-' + step : 'קופצים לאחור ב-' + (-step)) + ': ' + seq + (spec.decoys ? ' (יש גם מספרים מיותרים)' : '');
  }

  var INTRO = {
    mix: 'לסירוגין מספר ואות: 1, א, 2, ב, 3, ג…',
    days: 'לסירוגין מספר ויום: 1, ראשון, 2, שני…',
    down: 'סופרים לאחור, לסירוגין מספר ואות: 4, ד, 3, ג…',
    tri: 'שלושה רצפים לסירוגין: 1, א, ראשון, 2, ב, שני…'
  };

  BrainGames.register({
    id: 'dot-trail',
    name: 'חיבור נקודות',
    skill: 'executive',
    tagline: 'חברו את הנקודות לפי הסדר',
    benefit: 'קשב, סריקה ומעבר בין שני רצפים',
    instructions: [
      'על הלוח מפוזרות נקודות עם מספרים (ובהמשך גם אותיות או ימים).',
      'לחצו על הנקודות לפי הסדר. קו יחבר ביניהן.',
      'בשלבים מתקדמים עוברים לסירוגין (1, א, 2, ב…), קופצים במספרים (2, 4, 6…) בין מספרים מיותרים, וסופרים לאחור.',
      'אין שעון. לחיצה לא נכונה לא מוחקת כלום, פשוט ממשיכים.'
    ],
    css: css,
    _labels: labels,
    _levels: LEVELS,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var order = labels(spec);
      var ROUNDS = spec.n + (spec.decoys || 0) > 30 ? 2 : 3; // big boards take longer; keep a session short
      var round = 0, good = 0, totalMiss = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({
            correct: good, total: ROUNDS,
            note: 'חיברתם ' + ROUNDS + ' לוחות של ' + order.length + ' נקודות' + (totalMiss ? ', עם ' + totalMiss + ' לחיצות לא נכונות' : ' בלי אף טעות!')
          });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        play();
      }

      function play() {
        root.innerHTML = '';
        var pos = 0, misses = 0, stepMiss = 0;
        var SVGNS = 'http://www.w3.org/2000/svg';
        var lines = document.createElementNS(SVGNS, 'svg');
        lines.setAttribute('class', 'dt-lines');
        lines.setAttribute('viewBox', '0 0 100 100');
        lines.setAttribute('preserveAspectRatio', 'none');
        lines.setAttribute('aria-hidden', 'true');
        // all labels: the sequence first (index = its place in the order), then the decoys
        var all = order.concat(decoys(spec, order, ctx.shuffle));
        var board = el('div', { class: 'dt-board' }, lines);
        var next = el('p', { class: 'dt-next', 'aria-live': 'polite' });
        root.appendChild(board);
        root.appendChild(next);
        // place the dots once the board has its real size
        var L = layout(all.length, board.clientWidth || 300, board.clientHeight || 400, Math.random,
          spec.kind === 'days' || spec.kind === 'tri');
        var pts = L.pts;
        // dots are listed in a random DOM order, so the reading order gives nothing away
        var idx = ctx.shuffle(all.map(function (_, i) { return i; }));
        var dots = [];
        idx.forEach(function (i) {
          var lab = all[i];
          dots[i] = el('button', {
            class: 'dt-dot' + (lab.length > 2 && isNaN(Number(lab)) ? ' dt-word' : ''), type: 'button', 'aria-label': lab,
            style: { left: pts[i][0] + '%', top: pts[i][1] + '%', '--d': L.sizes[i] + 'px' }, onclick: function () { tap(i); }
          }, lab);
          board.appendChild(dots[i]);
        });
        var INTRO_TEXT = intro(spec, order);
        ctx.setStatus(INTRO_TEXT);
        update();

        function update() {
          next.textContent = pos < order.length ? 'הבא בתור: ' + (pos === 0 ? order[0] : '?') : '';
          if (pos > 0 && pos < order.length) next.textContent = 'אחרי ' + order[pos - 1] + ' בא…';
        }

        function tap(i) {
          if (pos >= order.length) return;
          if (i < pos) return; // already connected
          if (i !== pos) {
            misses++; stepMiss++; totalMiss++;
            ctx.sound('bad');
            var d = dots[i];
            d.classList.remove('is-miss'); void d.offsetWidth; d.classList.add('is-miss');
            if (stepMiss >= 3) {
              dots[pos].classList.add('is-next-hint');
              ctx.setStatus('הנקודה הבאה מסומנת בצהוב: ' + order[pos]);
            } else {
              ctx.setStatus('לא זו. ' + (pos === 0 ? 'מתחילים ב-' + order[0] : 'מה בא אחרי ' + order[pos - 1] + '?'));
            }
            return;
          }
          ctx.sound('tap');
          stepMiss = 0;
          dots[i].classList.remove('is-next-hint');
          if (pos > 0) {
            dots[pos - 1].classList.remove('is-last');
            var ln = document.createElementNS(SVGNS, 'line');
            ln.setAttribute('x1', pts[pos - 1][0]); ln.setAttribute('y1', pts[pos - 1][1]);
            ln.setAttribute('x2', pts[pos][0]); ln.setAttribute('y2', pts[pos][1]);
            lines.appendChild(ln);
          }
          dots[i].classList.add('is-done', 'is-last');
          pos++;
          update();
          if (pos < order.length) { ctx.setStatus(INTRO_TEXT); return; }
          var ok = misses <= 1;
          if (ok) good++;
          ctx.setStatus(misses ? 'סיימתם! (' + misses + ' לחיצות לא נכונות)' : 'מצוין! בלי אף טעות');
          ctx.feedback(ok, ok ? undefined : 'סיימתם. בפעם הבאה לאט ובזהירות').then(function () { return ctx.wait(600); }).then(nextRound);
        }
      }

      nextRound();
    }
  });
})();
