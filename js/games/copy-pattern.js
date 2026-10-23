/* העתקת דוגמה — copy a coloured pattern onto an empty grid (visual-spatial construction). */
(function () {
  'use strict';

  var ROUNDS = 6;

  // Per level (1–20): grid columns × rows, coloured cells, and how many colours (1 or 2).
  // At most 4 columns so every tile stays at least 56px wide on a phone, and at most 4×4 up to
  // level 15 so the model, the board and the button fit one screen. From level 11 a second colour
  // appears (the count drops back a little), and from 16 the board grows to 4×5.
  var LEVELS = [
    { cols: 3, rows: 3, count: 3, colors: 1 },  // 1
    { cols: 3, rows: 3, count: 4, colors: 1 },  // 2
    { cols: 3, rows: 3, count: 5, colors: 1 },  // 3
    { cols: 4, rows: 4, count: 5, colors: 1 },  // 4
    { cols: 4, rows: 4, count: 6, colors: 1 },  // 5
    { cols: 4, rows: 4, count: 6, colors: 1 },  // 6
    { cols: 4, rows: 4, count: 7, colors: 1 },  // 7
    { cols: 4, rows: 4, count: 7, colors: 1 },  // 8
    { cols: 4, rows: 4, count: 8, colors: 1 },  // 9
    { cols: 4, rows: 4, count: 8, colors: 1 },  // 10
    { cols: 4, rows: 4, count: 6, colors: 2 },  // 11
    { cols: 4, rows: 4, count: 7, colors: 2 },  // 12
    { cols: 4, rows: 4, count: 7, colors: 2 },  // 13
    { cols: 4, rows: 4, count: 8, colors: 2 },  // 14
    { cols: 4, rows: 4, count: 8, colors: 2 },  // 15
    { cols: 4, rows: 5, count: 9, colors: 2 },  // 16
    { cols: 4, rows: 5, count: 10, colors: 2 }, // 17
    { cols: 4, rows: 5, count: 11, colors: 2 }, // 18
    { cols: 4, rows: 5, count: 12, colors: 2 }, // 19
    { cols: 4, rows: 5, count: 13, colors: 2 }  // 20
  ];

  var css = [
    // Top row: the small model beside a short info column (label, count, legend).
    '.cp-top{display:flex;align-items:center;justify-content:center;gap:.8rem;width:100%;}',
    '.cp-model{flex:none;display:grid;grid-template-columns:repeat(var(--cols),1.6rem);gap:.25rem;',
    'padding:.45rem;border-radius:var(--radius);background:var(--surface);border:2px solid var(--perception);}',
    '.cp-mcell{aspect-ratio:1;border-radius:5px;background:var(--surface-2);border:1px solid var(--line);',
    'display:grid;place-items:center;line-height:1;}',
    '.cp-info{display:flex;flex-direction:column;gap:.3rem;min-width:0;font-size:1.1rem;line-height:1.3;}',
    '.cp-label{font-weight:800;color:var(--perception);margin:0;}',
    '.cp-count{font-weight:700;margin:0;font-variant-numeric:tabular-nums;}',
    '.cp-legend{display:flex;flex-direction:column;gap:.2rem;color:var(--ink-soft);margin:0;}',
    '.cp-legend:empty{display:none;}',
    '.cp-legend span{display:inline-flex;align-items:center;gap:.4rem;white-space:nowrap;}',
    '.cp-sw{display:inline-grid;place-items:center;width:1.3rem;height:1.3rem;border-radius:5px;border:2px solid var(--line);background:var(--surface-2);}',
    '.cp-board{max-width:calc(var(--cols) * 3.3rem + (var(--cols) - 1) * .6rem);',
    'min-width:calc(var(--cols) * 56px + (var(--cols) - 1) * .6rem);}',
    '.cp-board .g-tile{font-weight:900;position:relative;}',
    '.cp-c1{background:var(--perception) !important;border-color:var(--perception) !important;color:var(--surface);}',
    '.cp-c2{background:var(--logic) !important;border-color:var(--logic) !important;color:var(--surface);}',
    '.cp-c2::before{content:"";width:34%;aspect-ratio:1;border-radius:50%;background:var(--surface);}',
    '.cp-board .g-tile.cp-c2::before{width:30%;}',
    '.cp-board .g-tile.cp-ok{box-shadow:0 0 0 3px var(--good);}',
    '.cp-board .g-tile.cp-ok::after{content:"✓";position:absolute;font-size:1.4rem;color:var(--surface);}',
    '.cp-board .g-tile.cp-c2.cp-ok::before{display:none;}',
    '.cp-board .g-tile.cp-wrong{background:var(--bad-soft) !important;border:3px solid var(--bad) !important;color:var(--bad);}',
    '.cp-board .g-tile.cp-wrong::before{display:none;}',
    '.cp-board .g-tile.cp-missed{background:var(--sun-soft);border:3px dashed var(--sun);color:var(--ink);}'
  ].join('');

  BrainGames.register({
    id: 'copy-pattern',
    name: 'העתקת דוגמה',
    skill: 'perception',
    tagline: 'העתיקו את הציור ללוח הריק',
    benefit: 'תפיסה חזותית-מרחבית והעתקה מדויקת',
    instructions: [
      'למעלה יש דוגמה קטנה עם משבצות צבועות. היא נשארת על המסך כל הזמן.',
      'לחצו על משבצות בלוח הגדול כדי לצבוע אותן בדיוק כמו בדוגמה.',
      'בשלבים מתקדמים יש שני צבעים: לחיצה אחת, שתיים, ושלישית מנקה.',
      'כשסיימתם לחצו "בדיקה".'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var cols = spec.cols, rows = spec.rows;
      var n = cols * rows;
      var count = Math.min(spec.count, n - 1);
      var colors = spec.colors === 2 ? 2 : 1;

      var round = 0;
      var score = 0;

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({
            correct: score,
            total: ROUNDS,
            note: 'העתקתם בדיוק ' + score + ' מתוך ' + ROUNDS + ' דוגמאות של ' + count + ' משבצות' +
              (colors === 2 ? ' בשני צבעים' : '')
          });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        playRound();
      }

      function swatch(state) {
        return el('span', { class: 'cp-sw' + (state ? ' cp-c' + state : '') });
      }

      function playRound() {
        root.innerHTML = '';
        var all = [];
        for (var i = 0; i < n; i++) all.push(i);

        // model[i]: 0 empty, 1 colour A, 2 colour B. With two colours both appear.
        var model = all.map(function () { return 0; });
        var chosen = ctx.shuffle(all.slice()).slice(0, count);
        var bCount = colors === 2 ? Math.max(2, Math.floor(count * ctx.randInt(35, 50) / 100)) : 0;
        chosen.forEach(function (idx, k) { model[idx] = k < bCount ? 2 : 1; });

        var player = all.map(function () { return 0; });
        var accepting = true;

        var modelCells = all.map(function (idx) {
          return el('div', { class: 'cp-mcell' + (model[idx] ? ' cp-c' + model[idx] : '') });
        });
        var modelGrid = el('div', {
          class: 'cp-model', role: 'img', 'aria-label': 'הדוגמה',
          style: { '--cols': String(cols) }
        }, modelCells);

        var tiles = all.map(function (idx) {
          var r = Math.floor(idx / cols) + 1, c = (idx % cols) + 1;
          return el('button', {
            class: 'g-tile', type: 'button',
            'aria-label': 'שורה ' + r + ', טור ' + c,
            onclick: function () { onTap(idx); }
          });
        });
        var board = el('div', { class: 'g-grid cp-board', style: { '--cols': String(cols) } }, tiles);

        var countLine = el('p', { class: 'cp-count', 'aria-live': 'polite' }, '');
        var legend = el('div', { class: 'cp-legend' }, colors === 2 ? [
          el('span', null, [swatch(1), 'לחיצה 1']),
          el('span', null, [swatch(2), 'לחיצה 2']),
          el('span', null, [swatch(0), 'לחיצה 3'])
        ] : []);
        var info = el('div', { class: 'cp-info' }, [el('p', { class: 'cp-label' }, 'הדוגמה'), countLine, legend]);
        var checkBtn = el('button', {
          class: 'btn btn-primary btn-lg', type: 'button', disabled: true,
          onclick: check
        }, 'בדיקה');
        var actions = el('div', { class: 'g-actions' }, checkBtn);

        root.appendChild(el('div', { class: 'cp-top' }, [modelGrid, info]));
        root.appendChild(board);
        root.appendChild(actions);

        ctx.setStatus(colors === 2 ? 'העתיקו את הדוגמה, שימו לב לצבעים' : 'העתיקו את הדוגמה ללוח הגדול');
        updateCount();

        function filled() {
          var f = 0;
          player.forEach(function (s) { if (s) f++; });
          return f;
        }

        function updateCount() {
          var f = filled();
          countLine.textContent = 'צבעתם ' + f + ' מתוך ' + count;
          checkBtn.disabled = f === 0;
        }

        function onTap(idx) {
          if (!accepting) return;
          ctx.sound('tap');
          var t = tiles[idx];
          t.classList.remove('cp-c' + player[idx]);
          player[idx] = (player[idx] + 1) % (colors + 1);
          if (player[idx]) t.classList.add('cp-c' + player[idx]);
          updateCount();
        }

        function check() {
          if (!accepting) return;
          accepting = false;
          checkBtn.disabled = true;
          tiles.forEach(function (t) { t.disabled = true; });
          var wrong = 0, missed = 0, right = 0;
          tiles.forEach(function (t, idx) {
            var m = model[idx], p = player[idx];
            if (m && p === m) { t.classList.add('cp-ok'); right++; }
            else if (p) {
              t.classList.remove('cp-c' + p);
              t.classList.add('cp-wrong');
              t.textContent = '✗';
              wrong++;
            } else if (m) {
              t.classList.add('cp-missed');
              t.textContent = '●';
              missed++;
            }
          });
          var ok = wrong === 0 && missed === 0;
          if (ok) score++;
          checkBtn.hidden = true;
          countLine.textContent = 'נכון ' + right + ' מתוך ' + count;
          legend.innerHTML = '';
          if (!ok) {
            legend.appendChild(el('span', null, '✓ נכון'));
            legend.appendChild(el('span', null, colors === 2 ? '✗ לא נכון' : '✗ מיותר'));
            legend.appendChild(el('span', null, '● חסר'));
          }
          ctx.setStatus(ok ? 'מצוין, העתקה מדויקת!' : 'השוו לדוגמה');
          var msg;
          if (!ok) {
            var parts = [];
            if (wrong) parts.push(wrong + ' לא במקום');
            if (missed) parts.push(missed + ' חסרות');
            msg = parts.join(', ');
          }
          ctx.feedback(ok, msg).then(function () {
            if (ok) return ctx.wait(700).then(nextRound);
            // Let the player look at the mistakes as long as they like.
            var nextBtn = el('button', {
              class: 'btn btn-primary btn-lg', type: 'button',
              onclick: function () { nextBtn.disabled = true; nextRound(); }
            }, round >= ROUNDS ? 'לסיום' : 'לדוגמה הבאה');
            actions.appendChild(nextBtn);
          });
        }
      }

      nextRound();
    }
  });
})();
