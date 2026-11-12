/* חיבור נקודות — tap the dots in order: 1-2-3…, then numbers and letters in turn (1-א-2-ב…) (executive),
   numbers and days of the week, and counting down: switching between two sequences. Untimed. */
(function () {
  'use strict';

  var ROUNDS = 3;
  var LETTERS = 'אבגדהוזחטיכל'.split('');
  var DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

  /* Per level (1–30): kind and number of dots.
     num = 1, 2, 3… · mix = 1, א, 2, ב… · days = 1, ראשון, 2, שני… · down = 5, ה, 4, ד… (counting down) */
  var LEVELS = [
    { kind: 'num', n: 5 }, { kind: 'num', n: 6 }, { kind: 'num', n: 7 }, { kind: 'num', n: 8 }, { kind: 'num', n: 9 },      // 1–5
    { kind: 'num', n: 10 }, { kind: 'num', n: 12 }, { kind: 'mix', n: 6 }, { kind: 'mix', n: 8 }, { kind: 'num', n: 14 },   // 6–10
    { kind: 'mix', n: 10 }, { kind: 'mix', n: 10 }, { kind: 'num', n: 16 }, { kind: 'mix', n: 12 }, { kind: 'mix', n: 12 }, // 11–15
    { kind: 'mix', n: 14 }, { kind: 'mix', n: 14 }, { kind: 'mix', n: 16 }, { kind: 'mix', n: 16 }, { kind: 'mix', n: 16 }, // 16–20
    { kind: 'days', n: 8 }, { kind: 'days', n: 10 }, { kind: 'days', n: 12 }, { kind: 'days', n: 14 }, { kind: 'days', n: 14 }, // 21–25
    { kind: 'down', n: 8 }, { kind: 'down', n: 10 }, { kind: 'down', n: 12 }, { kind: 'down', n: 14 }, { kind: 'down', n: 16 } // 26–30
  ];

  function labels(kind, n) {
    var out = [], half = Math.ceil(n / 2);
    if (kind === 'num') { for (var i = 1; i <= n; i++) out.push(String(i)); return out; }
    for (var k = 0; k < half; k++) {
      var num = kind === 'down' ? half - k : k + 1;
      out.push(String(num));
      if (out.length < n) out.push(kind === 'days' ? DAYS[num - 1] : LETTERS[num - 1]);
    }
    return out;
  }

  /* Random dot positions (in %, inside the board) at least `gap` apart. */
  function layout(n, rnd) {
    var gap = n <= 8 ? 26 : n <= 12 ? 22 : 19;
    for (var attempt = 0; attempt < 200; attempt++) {
      var pts = [];
      for (var t = 0; t < 4000 && pts.length < n; t++) {
        var p = [rnd() * 82 + 9, rnd() * 84 + 8];
        if (pts.every(function (q) { var dx = q[0] - p[0], dy = (q[1] - p[1]) * 1.25; return dx * dx + dy * dy >= gap * gap; })) pts.push(p);
      }
      if (pts.length === n) return pts;
      gap -= 1;
    }
    return null;
  }

  var css = [
    '.dt-board{position:relative;width:100%;max-width:24rem;height:min(30rem,calc(100dvh - 17rem));min-height:20rem;',
    'background:var(--surface-2);border:2px solid var(--line);border-radius:var(--radius);touch-action:manipulation;}',
    '.dt-lines{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}',
    '.dt-lines line{stroke:var(--attention);stroke-width:1;stroke-linecap:round;vector-effect:non-scaling-stroke;}',
    '.dt-dot{position:absolute;transform:translate(-50%,-50%);min-width:3.3rem;height:3.3rem;padding:0 .35rem;border-radius:999px;',
    'border:3px solid var(--ink-soft);background:var(--surface);color:var(--ink);font-weight:900;font-size:1.25rem;line-height:1;cursor:pointer;',
    'display:grid;place-items:center;white-space:nowrap;}',
    '.dt-dot.dt-word{font-size:1.05rem;}',
    '.dt-dot.is-done{background:var(--attention);border-color:var(--attention);color:var(--surface);}',
    '.dt-dot.is-last{box-shadow:0 0 0 4px var(--attention-soft);}',
    '.dt-dot.is-next-hint{border-color:var(--sun);box-shadow:0 0 0 5px var(--sun);}',
    '.dt-dot.is-miss{animation:dt-shake .35s;}',
    '@keyframes dt-shake{25%{transform:translate(-56%,-50%)}75%{transform:translate(-44%,-50%)}}',
    '@media (prefers-reduced-motion: reduce){.dt-dot.is-miss{animation:none;}}',
    '.dt-next{margin:0;font-size:1.15rem;font-weight:800;text-align:center;min-height:1.6rem;}'
  ].join('');

  var INTRO = {
    num: 'חברו את המספרים לפי הסדר: 1, 2, 3…',
    mix: 'לסירוגין מספר ואות: 1, א, 2, ב, 3, ג…',
    days: 'לסירוגין מספר ויום: 1, ראשון, 2, שני…',
    down: 'סופרים לאחור, לסירוגין מספר ואות: 4, ד, 3, ג…'
  };

  BrainGames.register({
    id: 'dot-trail',
    name: 'חיבור נקודות',
    skill: 'executive',
    tagline: 'חברו את הנקודות לפי הסדר',
    benefit: 'קשב, סריקה ומעבר בין שני רצפים',
    startLevel: 1,
    instructions: [
      'על הלוח מפוזרות נקודות עם מספרים (ובהמשך גם אותיות או ימים).',
      'לחצו על הנקודות לפי הסדר. קו יחבר ביניהן.',
      'בשלבים מתקדמים עוברים לסירוגין: 1, א, 2, ב… או 1, ראשון, 2, שני…, ובסוף גם סופרים לאחור.',
      'אין שעון. לחיצה לא נכונה לא מוחקת כלום, פשוט ממשיכים.'
    ],
    css: css,
    _labels: labels,
    _levels: LEVELS,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var order = labels(spec.kind, spec.n);
      var round = 0, good = 0, totalMiss = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({
            correct: good, total: ROUNDS,
            note: 'חיברתם ' + ROUNDS + ' לוחות של ' + spec.n + ' נקודות' + (totalMiss ? ', עם ' + totalMiss + ' לחיצות לא נכונות' : ' בלי אף טעות!')
          });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        play(layout(order.length, Math.random));
      }

      function play(pts) {
        root.innerHTML = '';
        var pos = 0, misses = 0, stepMiss = 0;
        var SVGNS = 'http://www.w3.org/2000/svg';
        var lines = document.createElementNS(SVGNS, 'svg');
        lines.setAttribute('class', 'dt-lines');
        lines.setAttribute('viewBox', '0 0 100 100');
        lines.setAttribute('preserveAspectRatio', 'none');
        lines.setAttribute('aria-hidden', 'true');
        // dots are listed in a random DOM order, so the reading order gives nothing away
        var idx = ctx.shuffle(order.map(function (_, i) { return i; }));
        var dots = [];
        idx.forEach(function (i) {
          var lab = order[i];
          dots[i] = el('button', {
            class: 'dt-dot' + (lab.length > 2 ? ' dt-word' : ''), type: 'button', 'aria-label': lab,
            style: { left: pts[i][0] + '%', top: pts[i][1] + '%' }, onclick: function () { tap(i); }
          }, lab);
        });
        var board = el('div', { class: 'dt-board' }, [lines].concat(idx.map(function (i) { return dots[i]; })));
        var next = el('p', { class: 'dt-next', 'aria-live': 'polite' });
        root.appendChild(board);
        root.appendChild(next);
        ctx.setStatus(INTRO[spec.kind]);
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
          if (pos < order.length) { ctx.setStatus(INTRO[spec.kind]); return; }
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
