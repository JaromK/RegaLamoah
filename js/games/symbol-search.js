/* חיפוש סמלים — find every copy of a target symbol in a grid, no clock (attention / visual scanning). */
(function () {
  'use strict';

  var ROUNDS = 6;

  // Inline SVG shapes (viewBox 0 0 100 100) drawn in currentColor, so they follow var(--ink).
  var RING = '<circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="8"/>';
  var BOX = '<rect x="12" y="12" width="76" height="76" rx="8" fill="none" stroke="currentColor" stroke-width="8"/>';
  var SHAPES = {
    circle: '<circle cx="50" cy="50" r="38"/>',
    square: '<rect x="14" y="14" width="72" height="72" rx="6"/>',
    ring: '<circle cx="50" cy="50" r="32" fill="none" stroke="currentColor" stroke-width="12"/>',
    star: '<polygon points="50,6 62,38 95,38 68,58 78,92 50,72 22,92 32,58 5,38 38,38"/>',
    plus: '<path d="M38 10h24v28h28v24H62v28H38V62H10V38h28z"/>',
    diamond: '<polygon points="50,6 92,50 50,94 8,50"/>',
    heart: '<path d="M50 90 L13 54 A21 21 0 0 1 50 24 A21 21 0 0 1 87 54 Z"/>',
    // half-filled circles
    hl: RING + '<path d="M50 12 A38 38 0 0 0 50 88 Z"/>',
    hr: RING + '<path d="M50 12 A38 38 0 0 1 50 88 Z"/>',
    ht: RING + '<path d="M12 50 A38 38 0 0 1 88 50 Z"/>',
    hb: RING + '<path d="M12 50 A38 38 0 0 0 88 50 Z"/>',
    // triangles
    tu: '<polygon points="50,10 92,86 8,86"/>',
    td: '<polygon points="50,90 92,14 8,14"/>',
    tl: '<polygon points="10,50 86,8 86,92"/>',
    tr: '<polygon points="90,50 14,8 14,92"/>',
    // outlined square with a dot in one corner
    c1: BOX + '<circle cx="33" cy="33" r="12"/>',
    c2: BOX + '<circle cx="67" cy="33" r="12"/>',
    c3: BOX + '<circle cx="33" cy="67" r="12"/>',
    c4: BOX + '<circle cx="67" cy="67" r="12"/>'
  };

  var EASY = ['circle', 'square', 'ring', 'star', 'plus', 'diamond', 'heart'];
  var SHAPE_FAMILIES = [['hl', 'hr', 'ht', 'hb'], ['tu', 'td', 'tl', 'tr'], ['c1', 'c2', 'c3', 'c4']];
  var LETTER_FAMILIES = [['ב', 'כ', 'פ'], ['ה', 'ח', 'ת'], ['ד', 'ר', 'ך'], ['ו', 'ז', 'ן'], ['ס', 'ם', 'ט']];
  var LETTER_TWINS = [['ה', 'ח'], ['ד', 'ר'], ['ב', 'כ'], ['ו', 'ז'], ['ם', 'ס'], ['ח', 'ת']];

  // Per level: grid, number of targets, distractor similarity.
  //  sim0: plain shapes, all different · sim1: shape family target, few look-alikes · sim2: half look-alikes
  //  sim3: look-alikes only · sim4: similar Hebrew letters · sim5: the single closest letter twin
  // At most 4 columns × 5 rows (20 tiles): on a 360px phone that keeps tiles ≥ 56px with roomy gaps
  // and the whole board on one screen. Past level 7 difficulty rises through targets and look-alikes.
  var LEVELS = [
    { cols: 4, rows: 3, t: 2, sim: 0 }, // 1
    { cols: 4, rows: 3, t: 3, sim: 0 }, // 2
    { cols: 4, rows: 3, t: 3, sim: 1 }, // 3
    { cols: 4, rows: 4, t: 3, sim: 1 }, // 4
    { cols: 4, rows: 4, t: 4, sim: 1 }, // 5
    { cols: 4, rows: 4, t: 4, sim: 2 }, // 6
    { cols: 4, rows: 5, t: 4, sim: 2 }, // 7
    { cols: 4, rows: 5, t: 5, sim: 2 }, // 8
    { cols: 4, rows: 5, t: 5, sim: 3 }, // 9
    { cols: 4, rows: 5, t: 6, sim: 3 }, // 10
    { cols: 4, rows: 5, t: 6, sim: 3 }, // 11
    { cols: 4, rows: 5, t: 6, sim: 4 }, // 12
    { cols: 4, rows: 5, t: 7, sim: 4 }, // 13
    { cols: 4, rows: 5, t: 5, sim: 5 }, // 14
    { cols: 4, rows: 5, t: 6, sim: 5 }, // 15
    { cols: 4, rows: 5, t: 7, sim: 3 }, // 16
    { cols: 4, rows: 5, t: 7, sim: 4 }, // 17
    { cols: 4, rows: 5, t: 6, sim: 5 }, // 18
    { cols: 4, rows: 5, t: 7, sim: 5 }, // 19
    { cols: 4, rows: 5, t: 8, sim: 5 }  // 20
  ];

  var css = [
    '.ss-top{display:flex;align-items:center;justify-content:center;gap:1rem;}',
    '.ss-target{flex:none;width:4.2rem;height:4.2rem;display:grid;place-items:center;color:var(--ink);background:var(--attention-soft);',
    'border:3px solid var(--attention);border-radius:var(--radius);}',
    '.ss-target .ss-svg{width:66%;}',
    '.ss-target .ss-letter{font-size:2.8rem;}',
    '.ss-svg{display:block;width:60%;height:auto;fill:currentColor;}',
    '.ss-letter{font-family:var(--font-body);font-weight:800;line-height:1;font-size:clamp(1.5rem,7vw,2.3rem);}',
    '.ss-grid{max-width:15.5rem;}',
    '.ss-grid .g-tile{color:var(--ink);background:var(--surface);position:relative;}',
    '.ss-grid .g-tile.ss-picked{background:var(--attention-soft);border-color:var(--attention);border-width:3px;}',
    '.ss-grid .g-tile.is-correct{background:var(--good-soft);border-color:var(--good);border-width:3px;}',
    '.ss-grid .g-tile.is-wrong{background:var(--bad-soft);border-color:var(--bad);border-width:3px;}',
    '.ss-grid .g-tile.ss-missed{background:var(--sun-soft);border:3px dashed var(--sun);}',
    '.ss-mark{position:absolute;top:2px;inset-inline-start:4px;font-size:.85rem;font-weight:900;line-height:1;}',
    '.g-tile.is-correct .ss-mark{color:var(--good);}',
    '.g-tile.is-wrong .ss-mark{color:var(--bad);}',
    '.g-tile.ss-missed .ss-mark{color:var(--ink);}',
    '.ss-count{font-size:1.15rem;font-weight:700;margin:0;white-space:pre-line;font-variant-numeric:tabular-nums;}',
    '.ss-side{display:flex;flex-direction:column;gap:.15rem;min-width:0}',
    '.ss-side .g-hint{margin:0;font-size:1.1rem}'
  ].join('');

  function glyph(el, sym) {
    if (!SHAPES.hasOwnProperty(sym)) return el('span', { class: 'ss-letter', 'aria-hidden': 'true' }, sym);
    return el('span', {
      'aria-hidden': 'true', style: { display: 'contents' },
      html: '<svg class="ss-svg" viewBox="0 0 100 100" focusable="false">' + SHAPES[sym] + '</svg>'
    });
  }

  BrainGames.register({
    id: 'symbol-search',
    name: 'חיפוש סמלים',
    skill: 'attention',
    tagline: 'מצאו את כל הסמלים הזהים',
    benefit: 'סריקה חזותית וקשב לפרטים',
    instructions: [
      'למעלה מופיע סמל אחד. בלוח שמתחת יש כמה סמלים זהים לו.',
      'מצאו וסמנו את כל הסמלים הזהים: לחצו על כל אחד מהם. לחיצה נוספת מבטלת סימון.',
      'שימו לב לסמלים שדומים אבל לא זהים, ואל תסמנו אותם.',
      'כשתסיימו לחצו "סיימתי". אין שעון — קחו את הזמן.'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var cols = spec.cols, rows = spec.rows;
      var count = Math.min(spec.t, cols * rows - 2);

      var round = 0;
      var score = 0;
      var totalHits = 0;
      var totalTargets = 0;

      // Returns the target plus where distractors come from: `pool`, and `siblings` (look-alikes) with probability `share`.
      function makeSet() {
        var sim = spec.sim;
        var target, siblings, easy;
        if (sim === 0) {
          target = ctx.pick(EASY);
          easy = EASY.filter(function (s) { return s !== target; });
          return { target: target, pool: easy, siblings: [], share: 0 };
        }
        if (sim <= 3) {
          var fam = ctx.pick(SHAPE_FAMILIES);
          target = ctx.pick(fam);
          siblings = fam.filter(function (s) { return s !== target; });
          return { target: target, pool: EASY, siblings: siblings, share: [0, 0.2, 0.5, 1][sim] };
        }
        var lf = sim === 4 ? ctx.pick(LETTER_FAMILIES) : ctx.shuffle(ctx.pick(LETTER_TWINS).slice());
        target = sim === 4 ? ctx.pick(lf) : lf[0];
        siblings = lf.filter(function (s) { return s !== target; });
        return { target: target, pool: siblings, siblings: siblings, share: 1 };
      }

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({
            correct: score,
            total: ROUNDS,
            note: 'לוחות מושלמים: ' + score + ' מתוך ' + ROUNDS + ' · מצאתם ' + totalHits + ' מתוך ' + totalTargets + ' סמלים'
          });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        playRound();
      }

      function playRound() {
        root.innerHTML = '';
        var n = cols * rows;
        var set = makeSet();
        var cells = [];
        var i;
        for (i = 0; i < count; i++) cells.push(set.target);
        var others = [];
        for (i = 0; i < n - count; i++) {
          var useSib = set.siblings.length && Math.random() < set.share;
          others.push(ctx.pick(useSib ? set.siblings : set.pool));
        }
        // Make sure at least one look-alike shows up whenever the level calls for them.
        if (set.siblings.length && set.siblings.every(function (s) { return others.indexOf(s) === -1; })) {
          others[0] = ctx.pick(set.siblings);
        }
        cells = ctx.shuffle(cells.concat(others));

        var picked = {};
        var pickedCount = 0;
        var accepting = true;

        var tiles = cells.map(function (sym, idx) {
          var r = Math.floor(idx / cols) + 1, c = (idx % cols) + 1;
          return el('button', {
            class: 'g-tile', type: 'button',
            'aria-label': 'שורה ' + r + ', טור ' + c,
            'aria-pressed': 'false',
            onclick: function () { onTap(idx); }
          }, glyph(el, sym));
        });
        var grid = el('div', {
          class: 'g-grid ss-grid',
          style: { '--cols': String(cols) }
        }, tiles);

        var countLine = el('p', { class: 'ss-count', 'aria-live': 'polite' }, '');
        var doneBtn = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: check }, 'סיימתי');
        var actions = el('div', { class: 'g-actions' }, doneBtn);

        ctx.setStatus('מצאו וסמנו את כל הסמלים הזהים');
        // The target, the running count and (early levels) the hint share one compact row above the board.
        root.appendChild(el('div', { class: 'ss-top' }, [
          el('div', { class: 'ss-target', role: 'img', 'aria-label': 'הסמל לחיפוש' }, glyph(el, set.target)),
          el('div', { class: 'ss-side' }, [
            level <= 5 ? el('p', { class: 'g-hint' }, 'יש ' + count + ' כאלה בלוח') : null,
            countLine
          ])
        ]));
        root.appendChild(grid);
        root.appendChild(actions);
        updateCount();

        function updateCount() {
          countLine.textContent = 'סימנתם ' + pickedCount;
        }

        function onTap(idx) {
          if (!accepting) return;
          ctx.sound('tap');
          if (picked[idx]) {
            delete picked[idx];
            pickedCount--;
            tiles[idx].classList.remove('ss-picked');
            tiles[idx].setAttribute('aria-pressed', 'false');
          } else {
            picked[idx] = true;
            pickedCount++;
            tiles[idx].classList.add('ss-picked');
            tiles[idx].setAttribute('aria-pressed', 'true');
          }
          updateCount();
        }

        function mark(t, cls, sign) {
          t.classList.add(cls);
          t.appendChild(el('span', { class: 'ss-mark', 'aria-hidden': 'true' }, sign));
        }

        function check() {
          if (!accepting) return;
          accepting = false;
          actions.hidden = true;
          var hits = 0, wrong = 0, missed = 0;
          tiles.forEach(function (t, idx) {
            t.disabled = true;
            t.classList.remove('ss-picked');
            var isTarget = cells[idx] === set.target;
            if (picked[idx] && isTarget) { mark(t, 'is-correct', '✓'); hits++; }
            else if (picked[idx]) { mark(t, 'is-wrong', '✗'); wrong++; }
            else if (isTarget) { mark(t, 'ss-missed', '●'); missed++; }
          });
          totalHits += hits;
          totalTargets += count;
          var ok = hits === count && wrong === 0;
          if (ok) score++;

          var parts = ['מצאתם ' + hits + ' מתוך ' + count];
          if (missed) parts.push('● פספסתם ' + missed);
          if (wrong) parts.push('✗ שגויות: ' + wrong);
          countLine.textContent = parts.join(String.fromCharCode(10));
          ctx.setStatus(ok ? 'מצוין! מצאתם את כולם' : 'הנה התוצאה');
          ctx.feedback(ok, ok ? undefined : parts.join(' · ')).then(function () {
            if (ok) return ctx.wait(900).then(nextRound);
            var nextBtn = el('button', {
              class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { nextBtn.disabled = true; nextRound(); }
            }, round >= ROUNDS ? 'לסיכום' : 'ללוח הבא');
            root.appendChild(el('div', { class: 'g-actions' }, nextBtn));
          });
        }
      }

      nextRound();
    }
  });
})();
