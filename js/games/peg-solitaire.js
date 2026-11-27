/* סוליטר — a board of holes with balls in some of them. A ball jumps over a ball next to it (along a row or a
   column) into an empty hole, and the ball jumped over leaves the board. Finish with one ball. Every board is built
   backwards from one ball, so it can always be solved. Planning. Untimed. */
(function () {
  'use strict';

  // board shapes: '#' = a hole
  var SHAPES = {
    sq4: ['####', '####', '####', '####'],
    sq5: ['#####', '#####', '#####', '#####', '#####'],
    cross7: ['..###..', '..###..', '#######', '#######', '#######', '..###..', '..###..']
  };
  function board(name) {
    var rows = SHAPES[name], R = rows.length, C = rows[0].length, hole = [];
    for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) hole.push(rows[r].charAt(c) === '#');
    return { name: name, R: R, C: C, hole: hole };
  }
  var DIRS = [[0, 1], [1, 0], [0, -1], [-1, 0]];
  // the jumps possible: { from, over, to }
  function moves(B, peg) {
    var out = [];
    for (var i = 0; i < peg.length; i++) {
      if (!peg[i]) continue;
      var r = Math.floor(i / B.C), c = i % B.C;
      DIRS.forEach(function (d) {
        var r1 = r + d[0], c1 = c + d[1], r2 = r + 2 * d[0], c2 = c + 2 * d[1];
        if (r2 < 0 || c2 < 0 || r2 >= B.R || c2 >= B.C) return;
        var o = r1 * B.C + c1, t = r2 * B.C + c2;
        if (B.hole[o] && B.hole[t] && peg[o] && !peg[t]) out.push({ from: i, over: o, to: t });
      });
    }
    return out;
  }
  function apply(peg, m) { var p = peg.slice(); p[m.from] = 0; p[m.over] = 0; p[m.to] = 1; return p; }
  function count(peg) { var n = 0; for (var i = 0; i < peg.length; i++) n += peg[i]; return n; }
  // a way from here to one ball (a list of jumps), or null; dead ends are remembered
  function solve(B, peg, dead) {
    dead = dead || {};
    if (count(peg) === 1) return [];
    var key = peg.join('');
    if (dead[key]) return null;
    var ms = moves(B, peg);
    for (var i = 0; i < ms.length; i++) {
      var rest = solve(B, apply(peg, ms[i]), dead);
      if (rest) return [ms[i]].concat(rest);
    }
    dead[key] = true;
    return null;
  }
  // built backwards from one ball ("un-jumps"), so every board can be solved
  function makeBoard(B, n, rnd) {
    for (var attempt = 0; attempt < 200; attempt++) {
      var peg = B.hole.map(function () { return 0; });
      var cells = []; B.hole.forEach(function (h, i) { if (h) cells.push(i); });
      peg[rnd.pick(cells)] = 1;
      var ok = true;
      for (var step = 1; step < n && ok; step++) {
        var opts = [];
        for (var z = 0; z < peg.length; z++) {
          if (!peg[z]) continue;
          var r = Math.floor(z / B.C), c = z % B.C;
          for (var k = 0; k < 4; k++) {
            var d = DIRS[k], r1 = r + d[0], c1 = c + d[1], r2 = r + 2 * d[0], c2 = c + 2 * d[1];
            if (r2 < 0 || c2 < 0 || r2 >= B.R || c2 >= B.C) continue;
            var y = r1 * B.C + c1, x = r2 * B.C + c2;
            if (B.hole[y] && B.hole[x] && !peg[y] && !peg[x]) opts.push([z, y, x]);
          }
        }
        if (!opts.length) { ok = false; break; }
        var o = rnd.pick(opts);
        peg[o[0]] = 0; peg[o[1]] = 1; peg[o[2]] = 1;
      }
      if (ok) return peg;
    }
    return null;
  }
  // how often random jumping still ends with one ball (lower = more traps = harder)
  function luck(B, peg, rnd, tries) {
    var win = 0;
    for (var t = 0; t < tries; t++) {
      var p = peg;
      for (;;) { var ms = moves(B, p); if (!ms.length) break; p = apply(p, rnd.pick(ms)); }
      if (count(p) === 1) win++;
    }
    return win / tries;
  }

  /* Level 1–50: shape, n = balls, minLuck = random jumping must still win this often (keeps the first levels gentle) */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    if (L <= 3) return { shape: 'sq4', n: 3, minLuck: 0.5 };
    if (L <= 7) return { shape: 'sq4', n: 4, minLuck: 0.3 };
    if (L <= 12) return { shape: 'sq5', n: 5, minLuck: 0.1 };
    if (L <= 18) return { shape: 'sq5', n: 6, minLuck: 0 };
    if (L <= 24) return { shape: 'sq5', n: 7, minLuck: 0 };
    if (L <= 30) return { shape: 'cross7', n: 8, minLuck: 0 };
    if (L <= 36) return { shape: 'cross7', n: 10, minLuck: 0 };
    if (L <= 42) return { shape: 'cross7', n: 12, minLuck: 0 };
    if (L <= 47) return { shape: 'cross7', n: 14, minLuck: 0 };
    return { shape: 'cross7', n: 16, minLuck: 0 };
  }
  function makePuzzle(sp, rnd) {
    var B = board(sp.shape), best = null;
    for (var t = 0; t < 30; t++) {
      var peg = makeBoard(B, sp.n, rnd);
      if (!peg) continue;
      if (sp.minLuck && luck(B, peg, rnd, 60) < sp.minLuck) { best = best || peg; continue; }
      return { B: B, peg: peg };
    }
    return { B: B, peg: best || makeBoard(B, sp.n, rnd) };
  }

  var css = [
    '.ps-board{display:grid;grid-template-columns:repeat(var(--c),var(--cs));grid-auto-rows:var(--cs);gap:2px;direction:ltr;',
    'padding:6px;background:var(--c-yellow-soft);border-radius:18px;border:2px solid var(--line);}',
    '.ps-cell{display:grid;place-items:center;padding:0;border:0;background:transparent;cursor:pointer;font:inherit;}',
    '.ps-cell.off{visibility:hidden;cursor:default;}',
    '.ps-cell::before{content:"";width:46%;height:46%;border-radius:50%;background:rgba(0,0,0,.18);box-shadow:inset 0 2px 3px rgba(0,0,0,.3);}',
    '.ps-cell.peg::before{width:84%;height:84%;background:radial-gradient(circle at 35% 30%,#7fb3ff,var(--c-blue) 55%,#123c8a);box-shadow:0 2px 3px rgba(0,0,0,.35);}',
    '.ps-cell.is-sel::before{background:radial-gradient(circle at 35% 30%,#ffe58a,var(--c-yellow) 55%,#a06b00);box-shadow:0 0 0 4px var(--c-yellow-soft),0 0 0 7px var(--ink);}',
    '.ps-cell.is-to::before{width:70%;height:70%;background:var(--c-green-soft);box-shadow:inset 0 0 0 3px var(--c-green);}',
    '.ps-cell.is-tip::before{box-shadow:0 0 0 4px var(--surface),0 0 0 7px var(--c-purple);}',
    '.ps-cell.gone::before{animation:ps-gone .4s ease-out;}',
    '@keyframes ps-gone{from{transform:scale(1.6);background:var(--c-red);}to{transform:scale(1);}}',
    '.ps-left{margin:0;font-weight:800;font-size:1.05rem;text-align:center;}',
    '.ps-acts{flex-wrap:wrap;gap:.3rem;width:100%;max-width:26rem;}.ps-acts .btn{flex:1 1 auto;min-width:0;padding-inline:.4rem;font-size:.95rem;white-space:nowrap;}',
    '@media (min-width:900px){.g-split .ps-board{--cs:min(calc((100svh - 15rem) / var(--r)), 6rem) !important;}.g-split .ps-acts{flex-direction:column;width:14rem;}}'
  ].join('');

  BrainGames.register({
    id: 'peg-solitaire',
    name: 'סוליטר',
    skill: 'executive',
    isNew: true,
    tagline: 'קופצים מעל הכדורים עד שנשאר אחד',
    benefit: 'תכנון כמה צעדים קדימה',
    instructions: [
      'כדור קופץ מעל כדור שצמוד אליו, אל חור ריק שמאחוריו (בשורה או בטור, לא באלכסון). הכדור שקפצו מעליו יוצא מהלוח.',
      'לחצו על כדור, ואז על אחד החורים הירוקים.',
      'המטרה: שיישאר כדור אחד בלבד. כל לוח אפשר לפתור.',
      'טעיתם? "↶ בטלו" או "מההתחלה". יש "רמז". אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makePuzzle: makePuzzle, board: board, moves: moves, apply: apply, solve: solve, count: count, luck: luck },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = sp.n <= 6 ? 3 : 2, round = 0, good = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) { ctx.finish({ correct: good, total: ROUNDS, note: 'פתרתם ' + good + ' מתוך ' + ROUNDS + ' לוחות' }); return; }
        ctx.setProgress(round, ROUNDS);
        play(makePuzzle(sp, ctx));
      }

      function play(P) {
        root.innerHTML = '';
        root.__ps = P; // read by the automated tests
        var B = P.B, peg = P.peg.slice(), hist = [], sel = -1, tip = -1, gone = -1, hints = 0, done = false, giveUp = null;
        var cs = 'min(calc((100vw - 2.6rem - ' + ((B.C - 1) * 2 + 16) + 'px) / ' + B.C + '), calc((100svh - 21rem) / ' + B.R + '), 4.6rem)';
        var cells = B.hole.map(function (h, i) {
          var b = el('button', { class: 'ps-cell' + (h ? '' : ' off'), type: 'button', onclick: function () { tap(i); } });
          if (!h) b.tabIndex = -1;
          return b;
        });
        var grid = el('div', { class: 'ps-board', style: { '--c': B.C, '--r': B.R, '--cs': cs } }, cells);
        var left = el('p', { class: 'ps-left' });
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var undoBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: undo }, '↶ בטלו');
        var resetBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: reset }, 'מההתחלה');
        var acts = el('div', { class: 'g-actions ps-acts' }, [hintBtn, undoBtn, resetBtn]);
        root.classList.add('g-split');
        root.appendChild(grid);
        root.appendChild(el('div', { class: 'g-side' }, [left, acts]));
        ctx.setStatus('לחצו על כדור, ואז על חור ירוק');
        draw();

        function targets(i) { return moves(B, peg).filter(function (m) { return m.from === i; }); }
        function draw() {
          var to = sel >= 0 ? targets(sel).map(function (m) { return m.to; }) : [];
          cells.forEach(function (c, i) {
            if (!B.hole[i]) return;
            c.className = 'ps-cell' + (peg[i] ? ' peg' : '') + (i === sel ? ' is-sel' : '') + (to.indexOf(i) !== -1 ? ' is-to' : '') +
              (i === tip ? ' is-tip' : '') + (i === gone ? ' gone' : '');
            c.setAttribute('aria-label', peg[i] ? 'כדור' : to.indexOf(i) !== -1 ? 'חור ריק, אפשר לקפוץ לכאן' : 'חור ריק');
          });
          var n = count(peg);
          left.textContent = n === 1 ? 'נשאר כדור אחד!' : 'על הלוח ' + n + ' כדורים. המטרה: כדור אחד';
          undoBtn.disabled = resetBtn.disabled = done || !hist.length;
          hintBtn.disabled = done;
          gone = -1;
        }
        function tap(i) {
          if (done || !B.hole[i]) return;
          if (peg[i]) {
            ctx.sound('tap');
            sel = sel === i ? -1 : i; tip = -1;
            if (sel >= 0 && !targets(sel).length) ctx.setStatus('לכדור הזה אין לאן לקפוץ. צריך כדור צמוד אליו, וחור ריק מיד אחריו');
            else if (sel >= 0) ctx.setStatus('עכשיו לחצו על חור ירוק');
            draw(); return;
          }
          if (sel < 0) { ctx.setStatus('קודם לחצו על כדור'); return; }
          var m = targets(sel).filter(function (x) { return x.to === i; })[0];
          if (!m) { ctx.setStatus('לשם אי אפשר לקפוץ. החורים הירוקים הם המקומות האפשריים'); return; }
          hist.push(peg); peg = apply(peg, m); sel = -1; tip = -1; gone = m.over;
          ctx.sound('tap');
          after();
        }
        function after() {
          var n = count(peg);
          if (n === 1) { win(); return; }
          if (!moves(B, peg).length) {
            ctx.sound('bad');
            ctx.setStatus('אין יותר קפיצות, ונשארו ' + n + ' כדורים. לחצו "↶ בטלו" כדי לנסות דרך אחרת');
            draw(); showGiveUp(); return;
          }
          ctx.setStatus('נשארו ' + n + ' כדורים');
          draw();
        }
        function showGiveUp() {
          if (giveUp) return;
          giveUp = el('button', { class: 'btn btn-quiet', type: 'button', onclick: function () {
            done = true; draw(); acts.hidden = true;
            ctx.feedback(false, 'נעבור ללוח אחר').then(nextRound);
          } }, round >= ROUNDS ? 'לסיכום' : 'ללוח הבא');
          acts.appendChild(giveUp);
        }
        function undo() {
          if (done || !hist.length) return;
          ctx.sound('tap'); peg = hist.pop(); sel = -1; tip = -1;
          ctx.setStatus('חזרנו צעד אחד'); draw();
        }
        function reset() {
          if (done || !hist.length) return;
          ctx.sound('tap'); peg = hist[0]; hist = []; sel = -1; tip = -1;
          ctx.setStatus('מתחילים מחדש. לחצו על כדור'); draw();
        }
        /* a hint: which ball starts a way to the end (not where it goes); or how far back to go from a dead end */
        function hint() {
          if (done) return;
          hints++;
          var way = solve(B, peg);
          if (way) {
            tip = way[0].from; sel = -1;
            ctx.setStatus('רמז: הכדור המסומן בסגול יכול לקפוץ בדרך שמובילה לכדור אחד. לאיזה חור?' +
              (hints === 1 && !hist.length ? ' (טיפ: אל תשאירו כדור לבד, רחוק מכולם)' : ''));
            draw(); return;
          }
          for (var back = 1; back <= hist.length; back++) {
            if (solve(B, hist[hist.length - back])) {
              ctx.setStatus('רמז: מכאן כבר אי אפשר להגיע לכדור אחד. לחצו "↶ בטלו" ' + (back === 1 ? 'פעם אחת' : back + ' פעמים') + ', ונסו קפיצה אחרת');
              return;
            }
          }
        }
        function win() {
          done = true; draw();
          var ok = hints <= 1;
          if (ok) good++;
          acts.hidden = true;
          ctx.sound('good');
          ctx.setStatus('נשאר כדור אחד. פתרתם!');
          ctx.feedback(ok, ok ? undefined : 'פתרתם, בעזרת רמזים').then(function () { return ctx.wait(600); }).then(nextRound);
        }
      }

      nextRound();
    }
  });
})();
