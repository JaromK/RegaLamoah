/* מלאו שורות — place coloured blocks (each with a symbol) on a board, with no clock and nothing falling. A full row or
   column is cleared. The goal names which lines count: any full line, a line of one colour, a line of one symbol, or a
   line that is one colour AND one symbol. A board has a number of blocks to use (planning, flexible thinking). */
(function () {
  'use strict';

  var COLORS = ['red', 'blue', 'yellow', 'purple'];
  var CNAME = { red: 'אדום', blue: 'כחול', yellow: 'צהוב', purple: 'סגול' };
  var SYMS = ['★', '●', '▲', '♥'];
  var SNAME = { '★': 'כוכב', '●': 'עיגול', '▲': 'משולש', '♥': 'לב' };

  /* shapes as [row, col] cells; every block may be turned */
  var SHAPES = {
    1: [[[0, 0]]],
    2: [[[0, 0], [0, 1]]],
    3: [[[0, 0], [0, 1], [0, 2]], [[0, 0], [1, 0], [1, 1]]],
    4: [[[0, 0], [0, 1], [0, 2], [0, 3]], [[0, 0], [0, 1], [1, 0], [1, 1]], [[0, 0], [1, 0], [2, 0], [2, 1]], [[0, 0], [0, 1], [0, 2], [1, 1]]]
  };

  /* Level 1–50: n = board side, k = colours, free = colour and symbol vary separately (otherwise each colour has its
     own symbol), goals = [{ t: 'any' | 'color' | 'symbol' | 'both', n }], blocks = blocks to use, big = largest block. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    if (L <= 6) return { n: 6, k: 3, free: false, goals: [{ t: 'any', n: 2 }], blocks: 12, big: 3 };
    if (L <= 12) return { n: 6, k: 3, free: false, goals: [{ t: 'any', n: 3 }], blocks: 14, big: 4 };
    if (L <= 18) return { n: 6, k: 2, free: false, goals: [{ t: 'color', n: 2 }], blocks: 14, big: 4 };
    if (L <= 24) return { n: 6, k: 3, free: false, goals: [{ t: 'color', n: 2 }], blocks: 15, big: 4 };
    if (L <= 30) return { n: 6, k: 3, free: false, goals: [{ t: 'color', n: 3 }], blocks: 20, big: 4 };
    if (L <= 35) return { n: 6, k: 3, free: true, goals: [{ t: 'symbol', n: 2 }], blocks: 16, big: 4 };
    if (L <= 40) return { n: 6, k: 3, free: true, goals: [{ t: 'color', n: 1 }, { t: 'symbol', n: 1 }], blocks: 15, big: 4 };
    if (L <= 45) return { n: 7, k: 3, free: true, goals: [{ t: 'color', n: 2 }, { t: 'symbol', n: 1 }], blocks: 22, big: 4 };
    return { n: 7, k: 3, free: true, goals: [{ t: 'both', n: 1 }, { t: 'color', n: 1 }, { t: 'symbol', n: 1 }], blocks: 26, big: 4 };
  }

  function turn(cells) { // a quarter turn, moved back to the top-left corner
    var t = cells.map(function (x) { return [x[1], -x[0]]; });
    var r0 = Math.min.apply(null, t.map(function (x) { return x[0]; })), c0 = Math.min.apply(null, t.map(function (x) { return x[1]; }));
    return t.map(function (x) { return [x[0] - r0, x[1] - c0]; });
  }
  function dims(cells) {
    return { h: 1 + Math.max.apply(null, cells.map(function (x) { return x[0]; })), w: 1 + Math.max.apply(null, cells.map(function (x) { return x[1]; })) };
  }

  /* which goals a full line meets */
  function lineKind(cells) {
    var c0 = cells[0].c, s0 = cells[0].s;
    var oneC = cells.every(function (x) { return x.c === c0; }), oneS = cells.every(function (x) { return x.s === s0; });
    return { color: oneC, symbol: oneS, c: c0, s: s0 };
  }
  function meets(t, kind, goal) {
    if (t === 'any') return true;
    if (t === 'color') return kind.color;
    if (t === 'symbol') return kind.symbol;
    return kind.color && kind.symbol && (!goal || (kind.c === goal.c && kind.s === goal.s));
  }
  // the full sentence (status line, messages) and the short label on the goal chip
  function goalText(g) {
    var many = g.n > 1 ? g.n + ' ' : '';
    if (g.t === 'any') return g.n > 1 ? g.n + ' שורות מלאות' : 'שורה מלאה';
    if (g.t === 'color') return many + (g.n > 1 ? 'שורות' : 'שורה') + ' בצבע אחד';
    if (g.t === 'symbol') return many + (g.n > 1 ? 'שורות' : 'שורה') + ' עם סימן אחד';
    return many + (g.n > 1 ? 'שורות' : 'שורה') + ' של ' + g.s + ' ' + CNAME[g.c] + ' בלבד';
  }
  function goalShort(g) {
    return g.t === 'any' ? 'שורה מלאה' : g.t === 'color' ? 'צבע אחד' : g.t === 'symbol' ? 'סימן אחד' : 'בלבד'; // after a swatch that shows the colour and the symbol
  }

  var css = [
    '.br-goals{display:flex;flex-wrap:wrap;justify-content:center;gap:.3rem;width:100%;max-width:30rem;}',
    '.br-goal{display:flex;align-items:center;gap:.3rem;background:var(--surface-2);border:2px solid var(--line);border-radius:999px;padding:.15rem .55rem;',
    'font-weight:800;font-size:1rem;line-height:1.25;white-space:nowrap;}',
    '.br-goal b{font-variant-numeric:tabular-nums;background:var(--surface);border-radius:999px;padding:0 .45rem;}',
    '.br-goal.is-met{border-color:var(--good);background:var(--good-soft);}',
    '.br-goal .sw{display:inline-grid;place-items:center;width:1.5rem;height:1.5rem;border-radius:5px;font-size:.95rem;color:#fff;}',
    '.br-left{font-weight:700;color:var(--ink-soft);font-size:1rem;text-align:center;line-height:1.15;}',
    '.br-board{--n:6;display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:3px;padding:4px;background:var(--line);border-radius:var(--radius-sm);',
    'width:min(100%,calc(100svh - 25rem),30rem);min-width:min(100%,17rem);direction:ltr;touch-action:none;}',
    '.br-cell{aspect-ratio:1;min-width:0;border:0;padding:0;border-radius:6px;background:var(--surface);display:grid;place-items:center;cursor:pointer;',
    'font-size:calc(min(100vw - 3rem,30rem) / var(--n) * .5);line-height:1;color:#fff;position:relative;}',
    '.br-cell.is-ghost{opacity:.55;box-shadow:inset 0 0 0 3px var(--ink);}',
    '.br-cell.is-ghost.is-block{opacity:1;box-shadow:inset 0 0 0 4px var(--bad);}',
    '.br-cell.is-ghost-bad{box-shadow:inset 0 0 0 3px var(--bad);}',
    '.br-cell.is-clear{animation:br-flash .7s ease-in-out;}',
    '.br-cell.is-clear.is-count::after{content:"✓";position:absolute;inset:0;display:grid;place-items:center;background:rgba(19,137,58,.55);border-radius:6px;font-size:1.1em;}',
    '@keyframes br-flash{0%,100%{transform:scale(1);}50%{transform:scale(.82);}}',
    '.br-red{background:var(--c-red);}.br-blue{background:var(--c-blue);}.br-yellow{background:var(--c-yellow);color:var(--c-on-yellow);}.br-purple{background:var(--c-purple);}',
    '.br-tray{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.5rem;width:100%;max-width:30rem;}',
    '.br-slot{min-height:4.8rem;border:3px solid var(--line);border-radius:var(--radius-sm);background:var(--surface);display:grid;place-items:center;cursor:pointer;padding:.3rem;touch-action:none;}',
    '.br-slot.is-sel{border-color:var(--ink);box-shadow:0 0 0 3px var(--ink);}',
    '.br-slot:disabled{opacity:.35;cursor:default;}',
    '.br-mini{display:grid;gap:2px;direction:ltr;pointer-events:none;}',
    '.br-mini span{width:1.2rem;height:1.2rem;border-radius:4px;display:grid;place-items:center;font-size:.85rem;color:#fff;line-height:1;}',
    '.br-mini span.e{background:transparent;}',
    '.br-mini span.br-yellow,.br-goal .sw.br-yellow{color:var(--c-on-yellow);}',
    '.br-acts{flex-wrap:nowrap;gap:.6rem;align-items:center;width:100%;max-width:30rem;justify-content:space-between;}.br-acts .btn{white-space:nowrap;padding-inline:.8rem;}',
    '.br-drag{position:fixed;z-index:60;pointer-events:none;opacity:.85;}',
    /* a computer screen: the board on one side, the goals and blocks on the other, so the board can be big */
    '@media (min-width:900px){',
    '.br-playing .app{max-width:72rem;}',
    '.play-board.br-wide{display:grid;grid-template-columns:auto minmax(20rem,26rem);grid-template-areas:"board goals" "board tray" "board acts";',
    'justify-content:center;align-content:center;align-items:center;column-gap:2.5rem;row-gap:1rem;}',
    '.br-wide .br-board{grid-area:board;width:min(calc(100svh - 12.5rem),40rem);}',
    '.br-wide .br-cell{font-size:calc(min(100svh - 12.5rem,40rem) / var(--n) * .5);}',
    '.br-wide .br-goals{grid-area:goals;}.br-wide .br-tray{grid-area:tray;}.br-wide .br-acts{grid-area:acts;}',
    '.br-wide .br-slot{min-height:7rem;}.br-wide .br-mini span{width:1.7rem;height:1.7rem;font-size:1.05rem;}',
    '}'
  ].join('');

  BrainGames.register({
    id: 'block-rows',
    name: 'מלאו שורות',
    skill: 'executive',
    isNew: true,
    tagline: 'הניחו חלקים צבעוניים ומלאו שורות לפי המטרה',
    benefit: 'תכנון, גמישות מחשבתית וראייה מרחבית',
    instructions: [
      'בחרו חלק למטה ולחצו על הלוח: יופיע צל של החלק. לחיצה נוספת על הצל מניחה אותו. אפשר גם לגרור.',
      'שורה או טור שמתמלאים נמחקים, ומפנים מקום. אין שעון ושום דבר לא נופל.',
      'המטרה כתובה למעלה: למשל "שורה בצבע אחד" או "שורה עם סימן אחד". רק שורות כאלה נספרות.',
      '"סובבו" מסובב את החלק, ו"בטלו" מחזיר את הצעד האחרון.'
    ],
    css: css,
    _model: { spec: spec, SHAPES: SHAPES, turn: turn, meets: meets },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = 2, round = 0, good = 0;
      var dragCleanup = null;
      root.classList.add('br-wide');
      document.body.classList.add('br-playing');

      function nextRound() {
        round++;
        if (round > ROUNDS) { ctx.finish({ correct: good, total: ROUNDS, note: 'השגתם את המטרה ב-' + good + ' מתוך ' + ROUNDS + ' לוחות' }); return; }
        ctx.setProgress(round, ROUNDS);
        play();
      }

      function play() {
        root.innerHTML = '';
        var n = sp.n;
        var colors = ctx.shuffle(COLORS).slice(0, sp.k), syms = ctx.shuffle(SYMS).slice(0, sp.k);
        var symOf = {};
        colors.forEach(function (c, i) { symOf[c] = syms[i]; });
        var goals = sp.goals.map(function (g) {
          var x = { t: g.t, n: g.n, got: 0 };
          if (g.t === 'both') { x.c = ctx.pick(colors); x.s = ctx.pick(syms); }
          return x;
        });
        var bothGoal = goals.filter(function (g) { return g.t === 'both'; })[0];
        var grid = [];
        for (var i = 0; i < n * n; i++) grid.push(null);
        var left = sp.blocks; // blocks still to come, the tray included
        var tray = [null, null, null], sel = -1, ghost = null, done = false, history = [];

        function newBlock() {
          var size = ctx.pick([1, 2, 2, 3, 3, 3, 4, 4].filter(function (s) { return s <= sp.big; }));
          var cells = ctx.pick(SHAPES[size]);
          for (var t = ctx.randInt(0, 3); t > 0; t--) cells = turn(cells);
          var c = ctx.pick(colors), s = sp.free ? ctx.pick(syms) : symOf[c];
          if (bothGoal && ctx.randInt(1, 100) <= 35) { c = bothGoal.c; s = bothGoal.s; } // the wanted kind comes more often
          return { cells: cells, c: c, s: s };
        }
        function fill() {
          for (var j = 0; j < 3; j++) if (!tray[j] && left - tray.filter(Boolean).length > 0) tray[j] = newBlock();
          // never stuck: if no block fits anywhere, the last one becomes a single square
          if (!tray.some(function (b) { return b && fitsAnywhere(b); })) {
            var j2 = tray.map(function (b) { return !!b; }).lastIndexOf(true);
            if (j2 >= 0) tray[j2] = { cells: [[0, 0]], c: tray[j2].c, s: tray[j2].s };
          }
        }
        function fits(b, r0, c0) {
          return b.cells.every(function (x) {
            var r = r0 + x[0], c = c0 + x[1];
            return r >= 0 && c >= 0 && r < n && c < n && !grid[r * n + c];
          });
        }
        function fitsAnywhere(b) {
          for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) if (fits(b, r, c)) return true;
          return false;
        }

        // ---- screen ----
        var goalRow = el('div', { class: 'br-goals' });
        var leftEl = el('div', { class: 'br-left' });
        var cellEls = [];
        for (i = 0; i < n * n; i++) (function (i) {
          cellEls.push(el('button', { class: 'br-cell', type: 'button', onclick: function () { tapCell(i); } }));
        })(i);
        var board = el('div', { class: 'br-board', style: { '--n': n } }, cellEls);
        var slots = [0, 1, 2].map(function (j) {
          var b = el('button', { class: 'br-slot', type: 'button', onclick: function () { if (justDragged) return; pickSlot(j); } });
          b.addEventListener('pointerdown', function (e) { startDrag(e, j); });
          return b;
        });
        var trayEl = el('div', { class: 'br-tray' }, slots);
        var turnBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: rotate }, 'סובבו ↻');
        var undoBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: undo }, '↶ בטלו');
        var acts = el('div', { class: 'g-actions br-acts' }, [turnBtn, leftEl, undoBtn]);
        root.appendChild(goalRow); root.appendChild(board); root.appendChild(trayEl); root.appendChild(acts);
        fill();
        ctx.setStatus(goals.length > 1 ? 'מלאו שורות לפי המטרות שלמעלה' : 'המטרה: ' + goalText(goals[0]));
        draw();

        function swatch(c, s) { return el('span', { class: 'sw br-' + c }, s); }
        function draw() {
          goalRow.innerHTML = '';
          goals.forEach(function (g) {
            var kids = [];
            if (g.t === 'both') kids.push(swatch(g.c, g.s));
            // with two or three goals the chips need the short words to share one line
            kids.push(el('span', null, goals.length > 1 ? goalShort(g) : goalText({ t: g.t, n: 1, c: g.c, s: g.s })));
            // a goal of several lines shows how many are done; a goal of one line just gets a ✓
            if (g.n > 1 || g.got >= g.n) kids.push(el('b', null, g.got >= g.n ? '✓' : g.got + '/' + g.n));
            goalRow.appendChild(el('div', { class: 'br-goal' + (g.got >= g.n ? ' is-met' : '') }, kids));
          });
          var ghostCells = {}, ghostOk = ghost && fits(tray[sel], ghost.r, ghost.c);
          if (ghost && sel >= 0) tray[sel].cells.forEach(function (x) {
            var r = ghost.r + x[0], c = ghost.c + x[1];
            if (r < n && c < n) ghostCells[r * n + c] = true;
          });
          cellEls.forEach(function (b, k) {
            var v = grid[k], g = ghostCells[k];
            b.className = 'br-cell' + (v ? ' is-block br-' + v.c : g ? ' br-' + tray[sel].c : '') + (g ? ' is-ghost' : '') + (g && !ghostOk && !v ? ' is-ghost-bad' : '');
            b.textContent = v ? v.s : g ? tray[sel].s : '';
            b.disabled = done;
          });
          slots.forEach(function (b, j) {
            b.innerHTML = '';
            b.classList.toggle('is-sel', j === sel && !done);
            b.disabled = done || !tray[j];
            if (!tray[j]) return;
            var d = dims(tray[j].cells), on = {};
            tray[j].cells.forEach(function (x) { on[x[0] + ',' + x[1]] = true; });
            var mini = el('div', { class: 'br-mini', style: { gridTemplateColumns: 'repeat(' + d.w + ',auto)' } });
            for (var r = 0; r < d.h; r++) for (var c = 0; c < d.w; c++) {
              mini.appendChild(on[r + ',' + c] ? el('span', { class: 'br-' + tray[j].c }, tray[j].s) : el('span', { class: 'e' }));
            }
            b.appendChild(mini);
            b.setAttribute('aria-label', 'חלק ' + CNAME[tray[j].c] + ' של ' + tray[j].cells.length + ' משבצות');
          });
          leftEl.textContent = 'נשארו ' + left + ' חלקים';
          leftEl.setAttribute('aria-live', 'polite');
          turnBtn.disabled = done || sel < 0;
          undoBtn.disabled = done || !history.length;
        }

        function pickSlot(j) {
          if (done || !tray[j]) return;
          ctx.sound('tap');
          sel = sel === j ? -1 : j;
          ghost = null;
          ctx.setStatus(sel < 0 ? 'בחרו חלק למטה' : 'לחצו על הלוח במקום שבו תרצו להניח את החלק');
          draw();
        }
        function rotate() {
          if (done || sel < 0) return;
          ctx.sound('tap');
          tray[sel] = { cells: turn(tray[sel].cells), c: tray[sel].c, s: tray[sel].s };
          if (ghost) aim(ghost.at);
          draw();
        }
        // the shadow of the block, around the square that was tapped and always inside the board
        function aim(k) {
          if (sel < 0) return;
          var d = dims(tray[sel].cells), r = Math.floor(k / n), c = k % n;
          ghost = { at: k, r: Math.max(0, Math.min(n - d.h, r - Math.floor((d.h - 1) / 2))), c: Math.max(0, Math.min(n - d.w, c - Math.floor((d.w - 1) / 2))) };
          draw();
        }
        function tapCell(k) {
          if (done) return;
          if (sel < 0) { ctx.setStatus('קודם בחרו חלק למטה'); return; }
          var inGhost = ghost && tray[sel].cells.some(function (x) { return (ghost.r + x[0]) * n + ghost.c + x[1] === k; });
          if (inGhost && fits(tray[sel], ghost.r, ghost.c)) { place(); return; }
          ctx.sound('tap');
          aim(k);
          ctx.setStatus(fits(tray[sel], ghost.r, ghost.c) ? 'לחצו שוב על הצל כדי להניח כאן' : 'החלק לא נכנס כאן. נסו מקום אחר, או סובבו אותו');
        }

        function place() {
          var b = tray[sel];
          history.push({ grid: grid.slice(), tray: tray.slice(), left: left, got: goals.map(function (g) { return g.got; }) });
          b.cells.forEach(function (x) { grid[(ghost.r + x[0]) * n + ghost.c + x[1]] = { c: b.c, s: b.s }; });
          tray[sel] = null; left--;
          sel = -1; ghost = null;
          ctx.sound('tap');
          // full rows and columns
          var lines = [];
          for (var r = 0; r < n; r++) {
            var row = []; for (var c = 0; c < n; c++) row.push(r * n + c);
            if (row.every(function (k) { return grid[k]; })) lines.push(row);
          }
          for (var c2 = 0; c2 < n; c2++) {
            var col = []; for (var r2 = 0; r2 < n; r2++) col.push(r2 * n + c2);
            if (col.every(function (k) { return grid[k]; })) lines.push(col);
          }
          var msgs = [];
          lines.forEach(function (ln) {
            var kind = lineKind(ln.map(function (k) { return grid[k]; }));
            // the most demanding goal still open that this line meets
            var order = ['both', 'color', 'symbol', 'any'], hit = null;
            order.forEach(function (t) {
              if (hit) return;
              goals.forEach(function (g) { if (!hit && g.t === t && g.got < g.n && meets(t, kind, g)) hit = g; });
            });
            if (hit) { hit.got++; msgs.push('נספרה: ' + goalText({ t: hit.t, n: 1, c: hit.c, s: hit.s }) + ' ✓'); }
            else if (goals.some(function (g) { return g.got < g.n; })) msgs.push(whyNot(kind));
            ln.hit = !!hit;
          });
          var won = goals.every(function (g) { return g.got >= g.n; });
          if (lines.length) {
            done = true; // a short pause while the full lines flash
            draw();
            lines.forEach(function (ln) { ln.forEach(function (k) { cellEls[k].classList.add('is-clear'); if (ln.hit) cellEls[k].classList.add('is-count'); }); });
            ctx.sound(lines.some(function (ln) { return ln.hit; }) ? 'good' : 'tap');
            ctx.setStatus(msgs.join(' · ') || 'השורה נמחקה');
            ctx.wait(900).then(function () {
              lines.forEach(function (ln) { ln.forEach(function (k) { grid[k] = null; }); });
              done = false;
              after(won);
            });
          } else {
            ctx.setStatus('בחרו את החלק הבא');
            after(won);
          }
        }
        function whyNot(kind) {
          var open = goals.filter(function (g) { return g.got < g.n && g.t !== 'any'; })[0];
          if (!open) return 'השורה נמחקה';
          if (open.t === 'color') return 'השורה התמלאה, אבל לא בצבע אחד, אז היא לא נספרת';
          if (open.t === 'symbol') return 'השורה התמלאה, אבל לא עם סימן אחד, אז היא לא נספרת';
          return 'השורה התמלאה, אבל לא כולה ' + open.s + ' ' + CNAME[open.c] + ', אז היא לא נספרת';
        }
        function after(won) {
          if (won) { finishBoard(true); return; }
          fill();
          if (!left) { finishBoard(false); return; }
          draw();
        }
        function undo() {
          if (done || !history.length) return;
          ctx.sound('tap');
          var h = history.pop();
          grid = h.grid; tray = h.tray; left = h.left;
          goals.forEach(function (g, j) { g.got = h.got[j]; });
          sel = -1; ghost = null;
          ctx.setStatus('הצעד האחרון בוטל');
          draw();
        }

        // drag a block from the tray onto the board
        var dragging = false, justDragged = false;
        function startDrag(e, j) {
          if (done || !tray[j] || e.button > 0) return;
          var x0 = e.clientX, y0 = e.clientY, fly = null;
          function move(ev) {
            if (!fly) {
              if (Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) < 12) return;
              sel = j; dragging = true; draw();
              fly = slots[j].querySelector('.br-mini').cloneNode(true);
              fly.classList.add('br-drag');
              document.body.appendChild(fly);
            }
            ev.preventDefault();
            fly.style.left = (ev.clientX - fly.offsetWidth / 2) + 'px';
            fly.style.top = (ev.clientY - fly.offsetHeight - 30) + 'px';
            // the board square under the block (a little above the finger, so the finger does not hide it)
            var under = document.elementFromPoint(ev.clientX, ev.clientY - 30);
            var k = cellEls.indexOf(under);
            if (k >= 0 && (!ghost || ghost.at !== k)) aim(k);
          }
          function up() {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            document.removeEventListener('pointercancel', up);
            dragCleanup = null;
            if (!fly) return;
            fly.remove(); dragging = false;
            justDragged = true; ctx.wait(350).then(function () { justDragged = false; });
            if (ghost && sel >= 0 && fits(tray[sel], ghost.r, ghost.c)) place();
            else { ghost = null; draw(); ctx.setStatus('החלק לא נכנס שם. נסו שוב'); }
          }
          document.addEventListener('pointermove', move, { passive: false });
          document.addEventListener('pointerup', up);
          document.addEventListener('pointercancel', up);
          dragCleanup = function () { document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', up); document.removeEventListener('pointercancel', up); if (fly) fly.remove(); };
        }

        function finishBoard(won) {
          done = true; sel = -1; ghost = null;
          draw();
          if (won) good++;
          ctx.setStatus(won ? 'כל הכבוד! השגתם את המטרה' : 'נגמרו החלקים לפני שהשגתם את המטרה');
          ctx.feedback(won, won ? 'השגתם את המטרה!' : 'נגמרו החלקים').then(function () {
            if (won) { ctx.wait(600).then(nextRound); return; }
            ctx.setStatus('נגמרו החלקים. טיפ: חשבו לאיזו שורה מתאים כל חלק, לפי ' +
              (goals.some(function (g) { return g.t === 'symbol'; }) ? 'הסימן שלו' : goals.some(function (g) { return g.t === 'any'; }) ? 'המקום הפנוי' : 'הצבע שלו'));
            acts.hidden = trayEl.hidden = true; // the continue button takes the place of the empty tray and the buttons
            ctx.next(round >= ROUNDS ? 'לסיכום' : 'ללוח הבא').then(nextRound);
          });
        }
      }

      nextRound();
      return function cleanup() { if (dragCleanup) dragCleanup(); root.classList.remove('br-wide'); document.body.classList.remove('br-playing'); };
    }
  });
})();
