/* לאן יגיע הכדור? — follow a ball through a board of diagonal bumpers (perception). */
(function () {
  'use strict';

  var ROUNDS = 6;
  var MIN_TAP = 48; // px, smallest exit slot / cell we allow (board is at most 5 × 5)

  // Per level (1–20): board size, number of bumpers, the fewest bumpers the ball must hit,
  // and whether the bumpers are hidden while answering (memorise first).
  var LEVELS = [
    { n: 4, bumpers: 1, hits: 1, hide: false }, // 1
    { n: 4, bumpers: 2, hits: 1, hide: false }, // 2
    { n: 4, bumpers: 2, hits: 2, hide: false }, // 3
    { n: 4, bumpers: 3, hits: 2, hide: false }, // 4
    { n: 5, bumpers: 3, hits: 2, hide: false }, // 5
    { n: 5, bumpers: 3, hits: 3, hide: false }, // 6
    { n: 5, bumpers: 4, hits: 3, hide: false }, // 7
    { n: 5, bumpers: 4, hits: 4, hide: false }, // 8
    { n: 5, bumpers: 5, hits: 4, hide: false }, // 9
    { n: 5, bumpers: 5, hits: 5, hide: false }, // 10
    { n: 4, bumpers: 2, hits: 1, hide: true },  // 11
    { n: 4, bumpers: 2, hits: 2, hide: true },  // 12
    { n: 4, bumpers: 3, hits: 2, hide: true },  // 13
    { n: 5, bumpers: 3, hits: 2, hide: true },  // 14
    { n: 5, bumpers: 3, hits: 3, hide: true },  // 15
    { n: 5, bumpers: 4, hits: 3, hide: true },  // 16
    { n: 5, bumpers: 4, hits: 4, hide: true },  // 17
    { n: 5, bumpers: 5, hits: 4, hide: true },  // 18
    { n: 5, bumpers: 6, hits: 4, hide: true },  // 19
    { n: 5, bumpers: 6, hits: 5, hide: true }   // 20
  ];

  // Edge slots: T (top, by column), B (bottom), L (left, by row), R (right). Grid is always drawn LTR.
  var EDGES = ['T', 'R', 'B', 'L'];
  var EDGE_NAME = { T: 'למעלה', B: 'למטה', L: 'משמאל', R: 'מימין' };
  var IN_ARROW = { T: '▼', B: '▲', L: '▶', R: '◀' };

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

  /* ---------- pure model ---------- */
  function slotKey(edge, i) { return edge + i; }

  // Ball enters from slot (edge, i); returns { cells: [[r,c],...], exit: {edge, i}, hits }.
  function trace(n, board, edge, i) {
    var r, c, dr, dc;
    if (edge === 'T') { r = 0; c = i; dr = 1; dc = 0; }
    else if (edge === 'B') { r = n - 1; c = i; dr = -1; dc = 0; }
    else if (edge === 'L') { r = i; c = 0; dr = 0; dc = 1; }
    else { r = i; c = n - 1; dr = 0; dc = -1; }
    var cells = [], hits = 0, steps = 0;
    while (r >= 0 && r < n && c >= 0 && c < n) {
      if (++steps > 4 * n * n + 4) return null; // can't happen with mirrors; guard anyway
      cells.push([r, c]);
      var b = board[r][c];
      if (b === '/') { var t = dr; dr = -dc; dc = -t; hits++; }
      else if (b === '\\') { var u = dr; dr = dc; dc = u; hits++; }
      r += dr; c += dc;
    }
    var exit;
    if (r < 0) exit = { edge: 'T', i: c };
    else if (r >= n) exit = { edge: 'B', i: c };
    else if (c < 0) exit = { edge: 'L', i: r };
    else exit = { edge: 'R', i: r };
    return { cells: cells, exit: exit, hits: hits };
  }

  function makeRound(n, bumpers, minHits, rnd) {
    var best = null;
    for (var attempt = 0; attempt < 4000; attempt++) {
      var board = [];
      for (var r = 0; r < n; r++) { board.push([]); for (var c = 0; c < n; c++) board[r].push(''); }
      var cells = [];
      for (var k = 0; k < n * n; k++) cells.push(k);
      rnd.shuffle(cells).slice(0, bumpers).forEach(function (k) {
        board[Math.floor(k / n)][k % n] = rnd.pick(['/', '\\']);
      });
      var edge = rnd.pick(EDGES), i = rnd.randInt(0, n - 1);
      var path = trace(n, board, edge, i);
      if (!path || (path.exit.edge === edge && path.exit.i === i)) continue;
      var round = { n: n, board: board, entry: { edge: edge, i: i }, path: path };
      if (path.hits >= minHits) return round;
      if (path.hits >= 1 && (!best || path.hits > best.path.hits)) best = round;
    }
    return best;
  }

  var css = [
    '.bp-wrap{width:calc(100% + 1.5rem);max-width:min(28rem,calc(100dvh - 15rem));min-width:17rem;margin-inline:-.75rem;}',
    '.bp-board{--n:4;--slot:3rem;display:grid;direction:ltr;gap:4px;width:100%;',
    'grid-template-columns:var(--slot) repeat(var(--n),minmax(0,1fr)) var(--slot);}',
    '.bp-cell{aspect-ratio:1;position:relative;background:var(--surface-2);border:1px solid var(--line);border-radius:4px;overflow:hidden;',
    'display:flex;align-items:center;justify-content:center;transition:background .25s ease;}',
    '.bp-corner{visibility:hidden;}',
    '.bp-tb{height:var(--slot);}',
    '.bp-lr{min-height:var(--slot);}',
    '.bp-slot{width:100%;height:100%;min-height:3rem;min-width:3rem;padding:0;border-radius:var(--radius-sm);',
    'border:2px solid var(--line);background:var(--surface);color:var(--ink-soft);font-size:1.1rem;font-weight:900;cursor:pointer;',
    'display:flex;align-items:center;justify-content:center;position:relative;}',
    '.bp-slot:hover:not(:disabled){border-color:var(--perception);background:var(--perception-soft);}',
    '.bp-slot:disabled{cursor:default;}',
    '.bp-slot.bp-entry{background:var(--accent);border-color:var(--accent);color:var(--accent-ink);font-size:1.3rem;}',
    '.bp-slot.is-correct{background:var(--good-soft);border-color:var(--good);color:var(--good);border-width:3px;}',
    '.bp-slot.is-wrong{background:var(--bad-soft);border-color:var(--bad);color:var(--bad);border-width:3px;}',
    '.bp-dot{width:.55rem;height:.55rem;border-radius:50%;background:var(--line);}',
    '.bp-bar{position:absolute;left:50%;top:50%;width:120%;height:.45rem;border-radius:999px;background:var(--perception);}',
    '.bp-bar.bp-slash{transform:translate(-50%,-50%) rotate(-45deg);}',
    '.bp-bar.bp-back{transform:translate(-50%,-50%) rotate(45deg);}',
    '.bp-hidden .bp-bar{visibility:hidden;}',
    '.bp-cell.bp-trail{background:var(--sun-soft);}',
    '.bp-ball{position:relative;z-index:1;width:55%;height:55%;max-width:1.6rem;max-height:1.6rem;border-radius:50%;',
    'background:var(--sun);border:2px solid var(--ink);}',
    '.bp-slot .bp-ball{position:absolute;}',
    '@media (prefers-reduced-motion: reduce){.bp-cell{transition:none;}}'
  ].join('');

  BrainGames.register({
    id: 'bumper-path',
    name: 'לאן יגיע הכדור?',
    skill: 'perception',
    tagline: 'עקבו אחרי הכדור שנתקל במחסומים',
    benefit: 'תפיסה מרחבית ותכנון מסלול בראש',
    instructions: [
      'כדור נכנס ללוח מהחץ ונע בקו ישר.',
      'כשהכדור פוגע בקו אלכסוני הוא פונה הצידה.',
      'לחצו על הפתח שממנו הכדור ייצא מהלוח.',
      'בשלבים מתקדמים: זכרו איפה הקווים, ואז הם יוסתרו.'
    ],
    css: css,
    _model: { LEVELS: LEVELS, trace: trace, makeRound: makeRound },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var n = spec.n;
      // Keep every cell and slot at least 44px wide: on narrow screens use a smaller board.
      var rem = remPx();
      var avail = Math.min(contentWidth(root) + 1.5 * rem, 28 * rem);
      try { if (window.innerHeight) avail = Math.min(avail, Math.max(17 * rem, window.innerHeight - 15 * rem)); } catch (e) { /* ignore */ }
      while (n > 4 && (avail - 2 * 3 * rem - (n + 1) * 4) / n < MIN_TAP) n--;
      var bumpers = Math.min(spec.bumpers, n === 4 ? 5 : 6);

      var round = 0, score = 0;

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({
            correct: score,
            total: ROUNDS,
            note: 'מצאתם את היציאה הנכונה ב-' + score + ' מתוך ' + ROUNDS + ' לוחות'
          });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        playRound();
      }

      function playRound() {
        root.innerHTML = '';
        var R = makeRound(n, bumpers, spec.hits, ctx);
        var accepting = false;
        var slots = {};
        var cellEls = [];

        var grid = el('div', { class: 'bp-board', style: { '--n': n } });
        function corner() { return el('div', { class: 'bp-corner', 'aria-hidden': 'true' }); }
        function slot(edge, i) {
          var isEntry = R.entry.edge === edge && R.entry.i === i;
          var pos = (edge === 'T' || edge === 'B') ? 'טור ' + (i + 1) : 'שורה ' + (i + 1);
          var b = el('button', {
            class: 'bp-slot' + (isEntry ? ' bp-entry' : ''), type: 'button', disabled: true,
            'aria-label': isEntry ? 'כאן הכדור נכנס (' + EDGE_NAME[edge] + ', ' + pos + ')' : 'יציאה ' + EDGE_NAME[edge] + ', ' + pos,
            onclick: function () { onPick(edge, i); }
          }, isEntry ? IN_ARROW[edge] : el('span', { class: 'bp-dot' }));
          slots[slotKey(edge, i)] = b;
          return el('div', { class: (edge === 'T' || edge === 'B') ? 'bp-tb' : 'bp-lr' }, b);
        }

        grid.appendChild(corner());
        for (var c = 0; c < n; c++) grid.appendChild(slot('T', c));
        grid.appendChild(corner());
        for (var r = 0; r < n; r++) {
          grid.appendChild(slot('L', r));
          cellEls.push([]);
          for (c = 0; c < n; c++) {
            var b = R.board[r][c];
            var cell = el('div', { class: 'bp-cell', 'aria-hidden': 'true' },
              b ? el('span', { class: 'bp-bar ' + (b === '/' ? 'bp-slash' : 'bp-back') }) : null);
            cellEls[r].push(cell);
            grid.appendChild(cell);
          }
          grid.appendChild(slot('R', r));
        }
        grid.appendChild(corner());
        for (c = 0; c < n; c++) grid.appendChild(slot('B', c));
        grid.appendChild(corner());

        var wrap = el('div', { class: 'bp-wrap' }, grid);
        root.appendChild(wrap);

        function startAnswer() {
          ctx.setStatus(spec.hide ? 'לאן הכדור ייצא? דמיינו את הקווים' : 'לאן הכדור ייצא?');
          Object.keys(slots).forEach(function (k) {
            if (!slots[k].classList.contains('bp-entry')) slots[k].disabled = false;
          });
          accepting = true;
        }

        if (spec.hide) {
          ctx.setStatus('זכרו איפה ' + bumpers + ' הקווים');
          var doneResolve = null;
          var readyBtn = el('button', {
            class: 'btn btn-primary btn-lg', type: 'button',
            onclick: function () { if (doneResolve) doneResolve(); }
          }, 'זכרתי, הלאה');
          var actions = el('div', { class: 'g-actions' }, readyBtn);
          root.appendChild(actions);
          var ready = new Promise(function (resolve) { doneResolve = resolve; });
          ctx.studyTimer(readyBtn, 4000 + 1200 * bumpers);
          ready.then(function () {
            doneResolve = null;
            actions.remove();
            grid.classList.add('bp-hidden');
            return ctx.wait(350);
          }).then(startAnswer);
        } else {
          startAnswer();
        }

        function onPick(edge, i) {
          if (!accepting) return;
          accepting = false;
          ctx.sound('tap');
          Object.keys(slots).forEach(function (k) { slots[k].disabled = true; });
          var ex = R.path.exit;
          var ok = ex.edge === edge && ex.i === i;
          if (ok) score++;
          var picked = slots[slotKey(edge, i)];
          picked.classList.add(ok ? 'is-correct' : 'is-wrong');
          if (!ok) picked.textContent = '✗';
          grid.classList.remove('bp-hidden');
          ctx.setStatus('כך הכדור עובר בלוח');
          animate().then(function () {
            var exitSlot = slots[slotKey(ex.edge, ex.i)];
            exitSlot.classList.remove('is-wrong');
            exitSlot.classList.add('is-correct');
            ctx.setStatus(ok ? 'מצוין! הכדור יצא בדיוק שם' : 'הכדור יצא בפתח הירוק');
            return ctx.feedback(ok, ok ? undefined : 'הכדור יצא בפתח הירוק');
          }).then(function () {
            return ctx.wait(900);
          }).then(nextRound);
        }

        function animate() {
          var ball = el('span', { class: 'bp-ball', 'aria-hidden': 'true' });
          var p = Promise.resolve();
          var steps = R.path.cells;
          steps.forEach(function (rc) {
            p = p.then(function () {
              var cell = cellEls[rc[0]][rc[1]];
              cell.classList.add('bp-trail');
              cell.appendChild(ball);
              return ctx.wait(steps.length > 10 ? 220 : 300);
            });
          });
          return p.then(function () {
            var ex = R.path.exit;
            slots[slotKey(ex.edge, ex.i)].appendChild(ball);
            return ctx.wait(350);
          });
        }
      }

      nextRound();
    }
  });
})();
