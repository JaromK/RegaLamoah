/* משבצות זוכרות — remember which grid cells lit up (memory). */
(function () {
  'use strict';

  var ROUNDS = 6;

  // Per level (1–50): grid columns × rows and how many cells light up.
  // At most 4 columns, so tiles stay ≥ 56px with roomy gaps on a 360px phone; up to level 15 the
  // grid stays 4 × 5 (one screen) and difficulty grows through the number of lit cells.
  var LEVELS = [
    { cols: 3, rows: 3, count: 3 },  // 1
    { cols: 3, rows: 4, count: 3 },  // 2
    { cols: 3, rows: 3, count: 4 },  // 3
    { cols: 3, rows: 4, count: 4 },  // 4
    { cols: 4, rows: 4, count: 4 },  // 5
    { cols: 4, rows: 4, count: 5 },  // 6
    { cols: 4, rows: 5, count: 5 },  // 7
    { cols: 4, rows: 4, count: 6 },  // 8
    { cols: 4, rows: 5, count: 6 },  // 9
    { cols: 4, rows: 5, count: 7 },  // 10
    { cols: 4, rows: 4, count: 7 },  // 11
    { cols: 4, rows: 5, count: 7 },  // 12
    { cols: 4, rows: 5, count: 8 },  // 13
    { cols: 4, rows: 5, count: 8 },  // 14
    { cols: 4, rows: 5, count: 9 },  // 15
    { cols: 4, rows: 6, count: 8 },  // 16
    { cols: 4, rows: 6, count: 9 },  // 17
    { cols: 4, rows: 6, count: 9 },  // 18
    { cols: 4, rows: 6, count: 10 }, // 19
    { cols: 4, rows: 6, count: 11 }, // 20
    // 21–30: the same 4 × 6 board, a few more cells to remember
    { cols: 4, rows: 6, count: 12 }, // 21
    { cols: 4, rows: 6, count: 12 }, // 22
    { cols: 4, rows: 6, count: 12 }, // 23
    { cols: 4, rows: 6, count: 13 }, // 24
    { cols: 4, rows: 6, count: 13 }, // 25
    { cols: 4, rows: 6, count: 13 }, // 26
    { cols: 4, rows: 6, count: 13 }, // 27
    { cols: 4, rows: 6, count: 14 }, // 28
    { cols: 4, rows: 6, count: 14 }, // 29
    { cols: 4, rows: 6, count: 14 }, // 30
    // 31–50: the lit cells come in colours (2, then 3 from 41). Only after they go dark do you learn
    // which colour to find (ask = how many colours, one after the other, from 46)
    { cols: 4, rows: 6, count: 14, colors: 2, ask: 1 }, // 31
    { cols: 4, rows: 6, count: 14, colors: 2, ask: 1 }, // 32
    { cols: 4, rows: 6, count: 14, colors: 2, ask: 1 }, // 33
    { cols: 4, rows: 6, count: 15, colors: 2, ask: 1 }, // 34
    { cols: 4, rows: 6, count: 15, colors: 2, ask: 1 }, // 35
    { cols: 4, rows: 6, count: 15, colors: 2, ask: 1 }, // 36
    { cols: 4, rows: 6, count: 15, colors: 2, ask: 1 }, // 37
    { cols: 4, rows: 6, count: 16, colors: 2, ask: 1 }, // 38
    { cols: 4, rows: 6, count: 16, colors: 2, ask: 1 }, // 39
    { cols: 4, rows: 6, count: 16, colors: 2, ask: 1 }, // 40
    { cols: 4, rows: 6, count: 14, colors: 3, ask: 1 }, // 41
    { cols: 4, rows: 6, count: 14, colors: 3, ask: 1 }, // 42
    { cols: 4, rows: 6, count: 15, colors: 3, ask: 1 }, // 43
    { cols: 4, rows: 6, count: 15, colors: 3, ask: 1 }, // 44
    { cols: 4, rows: 6, count: 16, colors: 3, ask: 1 }, // 45
    { cols: 4, rows: 6, count: 14, colors: 3, ask: 2 }, // 46
    { cols: 4, rows: 6, count: 15, colors: 3, ask: 2 }, // 47
    { cols: 4, rows: 6, count: 15, colors: 3, ask: 2 }, // 48
    { cols: 4, rows: 6, count: 16, colors: 3, ask: 2 }, // 49
    { cols: 4, rows: 6, count: 16, colors: 3, ask: 2 } // 50
  ];

  var css = [
    '.gm-grid{max-width:16rem;}',
    '.gm-grid.gm-tall{max-width:13rem;}',
    '.gm-grid .g-tile{font-weight:900;color:var(--ink);}',
    '.gm-grid .g-tile.gm-picked{background:var(--memory-soft);border-color:var(--memory);border-width:3px;color:var(--memory);}',
    '.gm-grid .g-tile.is-correct{color:var(--good);border-width:3px;}',
    '.gm-grid .g-tile.is-wrong{color:var(--bad);border-width:3px;}',
    '.gm-grid .g-tile.gm-missed{background:var(--sun-soft);border:3px dashed var(--sun);color:var(--ink);}',
    '.gm-count{font-size:1.2rem;font-weight:700;text-align:center;margin:0;font-variant-numeric:tabular-nums;}',
    '.gm-grid .g-tile.gm-col-y{background:var(--c-yellow);border-color:var(--c-yellow);color:var(--c-on-yellow);}',
    '.gm-grid .g-tile.gm-col-b{background:var(--c-blue);border-color:var(--c-blue);color:#fff;}',
    '.gm-grid .g-tile.gm-col-r{background:var(--c-red);border-color:var(--c-red);color:#fff;}',
    '.gm-grid .g-tile.gm-done{background:var(--surface);border:3px solid var(--ink-soft);color:var(--ink-soft);}',
    '.gm-grid .g-tile.gm-soft{opacity:.45;}',
    '.gm-ask{font-size:1.25rem;font-weight:800;margin:0;padding:.25rem .9rem;border-radius:999px;border:3px solid var(--line);}',
    '.gm-ask.gm-col-y{background:var(--c-yellow-soft);border-color:var(--c-yellow);color:var(--ink);}',
    '.gm-ask.gm-col-b{background:var(--c-blue-soft);border-color:var(--c-blue);color:var(--ink);}',
    '.gm-ask.gm-col-r{background:var(--c-red-soft);border-color:var(--c-red);color:var(--ink);}',
    '.gm-legend{display:flex;flex-wrap:wrap;gap:.2rem 1rem;justify-content:center;color:var(--ink-soft);font-size:1.1rem;}'
  ].join('');

  BrainGames.register({
    id: 'grid-memory',
    name: 'משבצות זוכרות',
    skill: 'memory',
    tagline: 'זכרו אילו משבצות נדלקו',
    benefit: 'זיכרון חזותי-מרחבי',
    instructions: [
      'כמה משבצות יידלקו בצהוב. זכרו איפה הן.',
      'קחו את הזמן, וכשתהיו מוכנים לחצו "זכרתי, הלאה".',
      'לחצו על המשבצות שזכרתם. לחיצה נוספת מבטלת בחירה.',
      'כשתבחרו את כל המשבצות נבדוק יחד.',
      'ברמות הגבוהות המשבצות בכמה צבעים. רק אחרי שהן נכבות תדעו איזה צבע לחפש, אז זכרו גם את הצבע.'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var cols = spec.cols, rows = spec.rows;
      var count = Math.min(spec.count, cols * rows - 1);
      var showMs = 3500 + 500 * count + (spec.colors ? 3000 : 0);
      // colour levels: [class, name of the colour for the cells, symbol for those who see colours poorly]
      var COLS = [['gm-col-y', 'צהובות', '◆'], ['gm-col-b', 'כחולות', '■'], ['gm-col-r', 'אדומות', '▲']];

      var round = 0;
      var score = 0;

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({
            correct: score,
            total: ROUNDS,
            note: 'זכרתם נכון ' + score + ' מתוך ' + ROUNDS + ' לוחות של ' + count + ' משבצות' +
              (spec.colors ? ' ב־' + spec.colors + ' צבעים' : '')
          });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        playRound();
      }

      function playRound() {
        root.innerHTML = '';
        if (spec.colors) { playColourRound(); return; }
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
          class: 'g-grid gm-grid' + (cols === 3 && rows > 3 ? ' gm-tall' : ''),
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

        // The player sets the pace; only timer mode hides the squares automatically.
        var early = new Promise(function (resolve) { doneResolve = resolve; });
        ctx.studyTimer(readyBtn, showMs);
        early.then(function () {
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

      // 31–50: cells light up in 2–3 colours; after they go dark the player is told which colour to
      // find (from 46: two colours, one after the other). A board counts only when every pick is right.
      function playColourRound() {
        var n = cols * rows;
        var all = [];
        for (var i = 0; i < n; i++) all.push(i);
        var colourOf = {};
        var lit = ctx.shuffle(all).slice(0, count);
        var order = ctx.shuffle(COLS.slice(0, spec.colors).map(function (_, k) { return k; }));
        lit.forEach(function (cell, k) { colourOf[cell] = order[k % spec.colors]; });
        var asks = ctx.shuffle(order.slice()).slice(0, spec.ask || 1);
        var phase = 0;
        var picks = [];          // one {cell: true} per asked colour
        var accepting = false;

        var tiles = all.map(function (i) {
          var r = Math.floor(i / cols) + 1, c = (i % cols) + 1;
          return el('button', {
            class: 'g-tile', type: 'button', disabled: true,
            'aria-label': 'שורה ' + r + ', טור ' + c,
            onclick: function () { onTap(i); }
          });
        });
        var grid = el('div', { class: 'g-grid gm-grid' }, tiles);
        grid.style.setProperty('--cols', String(cols));
        var askLine = el('p', { class: 'gm-ask', 'aria-live': 'polite' }, '');
        var countLine = el('p', { class: 'gm-count', 'aria-live': 'polite' }, '');
        var doneResolve = null;
        var readyBtn = el('button', {
          class: 'btn btn-primary btn-lg', type: 'button',
          onclick: function () { if (doneResolve) doneResolve(); }
        }, 'זכרתי, הלאה');
        var actions = el('div', { class: 'g-actions' }, readyBtn);
        // the colour to find is shown under the board once the button is gone (keeps the screen height)
        askLine.hidden = true;
        root.appendChild(grid);
        root.appendChild(countLine);
        root.appendChild(actions);
        root.appendChild(askLine);

        function paint(t, k) { t.classList.add(COLS[k][0]); t.textContent = COLS[k][2]; }
        function unpaint(t) { COLS.forEach(function (c) { t.classList.remove(c[0]); }); t.textContent = ''; }
        function need(k) { return lit.filter(function (cell) { return colourOf[cell] === k; }).length; }

        ctx.setStatus('זכרו איפה כל משבצת, ובאיזה צבע');
        countLine.textContent = count + ' משבצות ב־' + spec.colors + ' צבעים';
        lit.forEach(function (cell) { paint(tiles[cell], colourOf[cell]); });

        var early = new Promise(function (resolve) { doneResolve = resolve; });
        ctx.studyTimer(readyBtn, showMs);
        early.then(function () {
          doneResolve = null;
          actions.hidden = true;
          tiles.forEach(unpaint);
          return ctx.wait(400);
        }).then(function () { startPhase(); });

        function startPhase() {
          var k = asks[phase];
          picks[phase] = {};
          askLine.hidden = false;
          askLine.className = 'gm-ask ' + COLS[k][0];
          askLine.textContent = COLS[k][2] + ' המשבצות ה' + COLS[k][1];
          ctx.setStatus(phase === 0 ? 'לחצו על המשבצות שהיו ' + COLS[k][1] : 'ועכשיו: המשבצות שהיו ' + COLS[k][1]);
          updateCount();
          tiles.forEach(function (t, i) { t.disabled = isTaken(i); });
          accepting = true;
        }
        function isTaken(i) { for (var p = 0; p < phase; p++) if (picks[p][i]) return true; return false; }
        function pickedNow() { return Object.keys(picks[phase]).length; }
        function updateCount() { countLine.textContent = 'בחרתם ' + pickedNow() + ' מתוך ' + need(asks[phase]); }

        function onTap(i) {
          if (!accepting || isTaken(i)) return;
          ctx.sound('tap');
          if (picks[phase][i]) { delete picks[phase][i]; tiles[i].classList.remove('gm-picked'); }
          else { picks[phase][i] = true; tiles[i].classList.add('gm-picked'); }
          updateCount();
          if (pickedNow() >= need(asks[phase])) {
            accepting = false;
            if (phase + 1 < asks.length) {
              // this colour is set aside (grey frame) and the next colour is asked
              Object.keys(picks[phase]).forEach(function (c) {
                tiles[c].classList.remove('gm-picked'); tiles[c].classList.add('gm-done'); tiles[c].disabled = true;
              });
              phase++;
              ctx.wait(500).then(startPhase);
            } else check();
          }
        }

        function check() {
          tiles.forEach(function (t) { t.disabled = true; });
          ctx.wait(400).then(function () {
            var hits = 0, wrong = 0, total = 0;
            askLine.hidden = true;
            tiles.forEach(function (t) { t.classList.remove('gm-picked', 'gm-done'); });
            asks.forEach(function (k, p) {
              total += need(k);
              tiles.forEach(function (t, i) {
                if (!picks[p][i]) return;
                if (colourOf[i] === k) { t.classList.add('is-correct'); t.textContent = '✓'; hits++; }
                else { t.classList.add('is-wrong'); t.textContent = '✗'; wrong++; }
              });
            });
            // every lit cell not picked shows its colour again; an asked one that was missed gets ●
            lit.forEach(function (cell) {
              var t = tiles[cell];
              if (t.classList.contains('is-correct') || t.classList.contains('is-wrong')) return;
              paint(t, colourOf[cell]);
              if (asks.indexOf(colourOf[cell]) !== -1) t.textContent = '●';
              else t.classList.add('gm-soft');
            });
            var ok = wrong === 0 && hits === total;
            if (ok) score++;
            countLine.textContent = 'זכרתם ' + hits + ' מתוך ' + total;
            if (!ok) {
              root.appendChild(el('div', { class: 'gm-legend' }, [
                el('span', null, '✓ נכון'),
                el('span', null, '✗ טעות'),
                el('span', null, '● לא נבחרה')
              ]));
            }
            ctx.setStatus(ok ? 'מצוין!' : 'הנה מה שהיה דלוק, בצבעים');
            return ctx.feedback(ok, ok ? undefined : 'זכרתם ' + hits + ' מתוך ' + total);
          }).then(function () {
            return ctx.wait(1200);
          }).then(nextRound);
        }
      }

      nextRound();
    }
  });
})();
