/* משבצות זוכרות — remember which grid cells lit up (memory). */
(function () {
  'use strict';

  var ROUNDS = 6;
  var MIN_TAP = 56; // px, smallest tile we allow

  // Per level (1–20): grid columns × rows and how many cells light up.
  // Lit count and grid size take turns growing, so each level-up is a small step.
  var LEVELS = [
    { cols: 3, rows: 3, count: 3 },  // 1
    { cols: 3, rows: 4, count: 3 },  // 2
    { cols: 3, rows: 3, count: 4 },  // 3
    { cols: 3, rows: 4, count: 4 },  // 4
    { cols: 4, rows: 4, count: 4 },  // 5
    { cols: 4, rows: 4, count: 5 },  // 6
    { cols: 4, rows: 5, count: 5 },  // 7
    { cols: 5, rows: 5, count: 5 },  // 8
    { cols: 4, rows: 4, count: 6 },  // 9
    { cols: 4, rows: 5, count: 6 },  // 10
    { cols: 5, rows: 5, count: 6 },  // 11
    { cols: 4, rows: 5, count: 7 },  // 12
    { cols: 5, rows: 5, count: 7 },  // 13
    { cols: 5, rows: 6, count: 7 },  // 14
    { cols: 5, rows: 5, count: 8 },  // 15
    { cols: 5, rows: 6, count: 8 },  // 16
    { cols: 5, rows: 6, count: 9 },  // 17
    { cols: 6, rows: 6, count: 9 },  // 18
    { cols: 6, rows: 6, count: 10 }, // 19
    { cols: 6, rows: 6, count: 11 }  // 20
  ];

  function contentWidth(node) {
    try {
      var cs = window.getComputedStyle(node);
      var w = node.clientWidth - parseFloat(cs.paddingLeft || 0) - parseFloat(cs.paddingRight || 0);
      return w > 0 ? w : 300;
    } catch (e) { return 300; }
  }

  function remPx() {
    try { return parseFloat(window.getComputedStyle(document.documentElement).fontSize) || 16; }
    catch (e) { return 16; }
  }

  var css = [
    '.gm-grid{max-width:24rem;}',
    '.gm-grid.gm-tall{max-width:20rem;}',
    '.gm-grid.gm-wide{max-width:28rem;}',
    '.gm-grid .g-tile{font-weight:900;color:var(--ink);}',
    '.gm-grid .g-tile.gm-picked{background:var(--memory-soft);border-color:var(--memory);border-width:3px;color:var(--memory);}',
    '.gm-grid .g-tile.is-correct{color:var(--good);border-width:3px;}',
    '.gm-grid .g-tile.is-wrong{color:var(--bad);border-width:3px;}',
    '.gm-grid .g-tile.gm-missed{background:var(--sun-soft);border:3px dashed var(--sun);color:var(--ink);}',
    '.gm-count{font-size:1.2rem;font-weight:700;text-align:center;font-variant-numeric:tabular-nums;}',
    '.gm-legend{display:flex;flex-wrap:wrap;gap:.4rem 1rem;justify-content:center;color:var(--ink-soft);font-size:.95rem;}'
  ].join('');

  BrainGames.register({
    id: 'grid-memory',
    name: 'משבצות זוכרות',
    skill: 'memory',
    tagline: 'זכרו אילו משבצות נדלקו',
    benefit: 'זיכרון חזותי-מרחבי',
    instructions: [
      'כמה משבצות יידלקו בצהוב. זכרו איפה הן.',
      'כשתהיו מוכנים לחצו "זכרתי, הלאה" (או חכו, והן ייעלמו לבד).',
      'לחצו על המשבצות שזכרתם. לחיצה נוספת מבטלת בחירה.',
      'כשתבחרו את כל המשבצות נבדוק יחד.'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var cols = spec.cols, rows = spec.rows;
      // Six columns only where tiles stay big enough; otherwise 5 × 7 (about the same number of cells).
      if (cols > 5 && cols * MIN_TAP + (cols - 1) * 0.6 * remPx() > contentWidth(root)) {
        rows = Math.round(cols * rows / 5);
        cols = 5;
      }
      var count = Math.min(spec.count, cols * rows - 1);
      var showMs = 3500 + 500 * count;

      var round = 0;
      var score = 0;

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({
            correct: score,
            total: ROUNDS,
            note: 'זכרתם נכון ' + score + ' מתוך ' + ROUNDS + ' לוחות של ' + count + ' משבצות'
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
        var all = [];
        for (var i = 0; i < n; i++) all.push(i);
        var targets = {};
        ctx.shuffle(all).slice(0, count).forEach(function (i) { targets[i] = true; });

        var picked = {};
        var pickedCount = 0;
        var accepting = false;

        var tiles = all.map(function (i) {
          var r = Math.floor(i / cols) + 1, c = (i % cols) + 1;
          return el('button', {
            class: 'g-tile', type: 'button', disabled: true,
            'aria-label': 'שורה ' + r + ', טור ' + c,
            onclick: function () { onTap(i); }
          });
        });
        var grid = el('div', {
          class: 'g-grid gm-grid' + (cols >= 6 ? ' gm-wide' : (cols === 3 && rows > 3 ? ' gm-tall' : '')),
          style: { '--cols': cols }
        }, tiles);
        grid.style.setProperty('--cols', String(cols)); // custom props need setProperty
        var countLine = el('p', { class: 'gm-count', 'aria-live': 'polite' }, '');
        var doneResolve = null;
        var readyBtn = el('button', {
          class: 'btn btn-primary btn-lg', type: 'button',
          onclick: function () { if (doneResolve) doneResolve(); }
        }, 'זכרתי, הלאה');
        var actions = el('div', { class: 'g-actions' }, readyBtn);

        root.appendChild(grid);
        root.appendChild(countLine);
        root.appendChild(actions);

        // Memorise phase.
        ctx.setStatus('זכרו את המשבצות הצהובות');
        countLine.textContent = count + ' משבצות דלוקות';
        Object.keys(targets).forEach(function (i) { tiles[i].classList.add('is-lit'); });

        var early = new Promise(function (resolve) { doneResolve = resolve; });
        Promise.race([ctx.wait(showMs), early]).then(function () {
          doneResolve = null;
          actions.hidden = true;
          tiles.forEach(function (t) { t.classList.remove('is-lit'); });
          return ctx.wait(400);
        }).then(function () {
          ctx.setStatus('לחצו על המשבצות שזכרתם');
          updateCount();
          tiles.forEach(function (t) { t.disabled = false; });
          accepting = true;
        });

        function updateCount() {
          countLine.textContent = 'בחרתם ' + pickedCount + ' מתוך ' + count;
        }

        function onTap(i) {
          if (!accepting) return;
          ctx.sound('tap');
          if (picked[i]) {
            delete picked[i];
            pickedCount--;
            tiles[i].classList.remove('gm-picked');
          } else {
            picked[i] = true;
            pickedCount++;
            tiles[i].classList.add('gm-picked');
          }
          updateCount();
          if (pickedCount >= count) check();
        }

        function check() {
          accepting = false;
          tiles.forEach(function (t) { t.disabled = true; });
          ctx.wait(400).then(function () {
            var hits = 0, wrong = 0;
            tiles.forEach(function (t, i) {
              t.classList.remove('gm-picked');
              if (picked[i] && targets[i]) { t.classList.add('is-correct'); t.textContent = '✓'; hits++; }
              else if (picked[i]) { t.classList.add('is-wrong'); t.textContent = '✗'; wrong++; }
              else if (targets[i]) { t.classList.add('gm-missed'); t.textContent = '●'; }
            });
            var ok = wrong === 0 && hits === count;
            if (ok) score++;
            countLine.textContent = 'זכרתם ' + hits + ' מתוך ' + count;
            if (!ok) {
              root.appendChild(el('div', { class: 'gm-legend' }, [
                el('span', null, '✓ נכון'),
                el('span', null, '✗ לא היה דלוק'),
                el('span', null, '● היה דלוק')
              ]));
            }
            ctx.setStatus(ok ? 'מצוין!' : 'הנה מה שהיה דלוק');
            return ctx.feedback(ok, ok ? undefined : 'זכרתם ' + hits + ' מתוך ' + count);
          }).then(function () {
            return ctx.wait(1200);
          }).then(nextRound);
        }
      }

      nextRound();
    }
  });
})();
