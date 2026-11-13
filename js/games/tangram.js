/* טנגרם — fill a silhouette with the seven classic pieces (perception, spatial reasoning). Untimed.
   Pieces turn in quarter turns, so every corner stays on whole grid points: placing snaps exactly,
   and any arrangement that covers the silhouette counts, not only the one we built it from. */
(function () {
  'use strict';

  var ROUNDS = 4;
  var BOARD = 9;      // board is 9 × 9 units
  var RES = 4;        // coverage samples per unit (for checking)

  // Base shapes (integer corners). The classic set: 2 large, 1 medium, 2 small triangles, square, parallelogram.
  var SHAPES = {
    LT: [[0, 0], [4, 0], [2, 2]],
    MT: [[0, 0], [2, 0], [0, 2]],
    ST: [[0, 0], [2, 0], [1, 1]],
    SQ: [[1, 0], [2, 1], [1, 2], [0, 1]],
    PG: [[0, 0], [2, 0], [3, 1], [1, 1]]
  };
  var SET = ['LT', 'LT', 'MT', 'ST', 'ST', 'SQ', 'PG'];
  var HUE = { LT: 'c-blue', MT: 'c-red', ST: 'c-yellow', SQ: 'c-green', PG: 'c-purple' }; // shared strong palette
  var NAME = { LT: 'משולש גדול', MT: 'משולש בינוני', ST: 'משולש קטן', SQ: 'ריבוע', PG: 'מקבילית' };

  /* Per level (1–30): pieces in the figure, pre = pieces already in place, lines = the outline of every
     piece is drawn inside the silhouette, turn = pieces in the tray start turned, max = largest figure size. */
  var LEVELS = [
    { pieces: 2, pre: 1, lines: true },                  // 1
    { pieces: 3, pre: 2, lines: true },                  // 2
    { pieces: 3, pre: 1, lines: true },                  // 3
    { pieces: 3, pre: 1, lines: true, turn: true },      // 4
    { pieces: 4, pre: 2, lines: true, turn: true },      // 5
    { pieces: 4, pre: 1, lines: true, turn: true },      // 6
    { pieces: 4, pre: 2 },                               // 7
    { pieces: 4, pre: 1, turn: true },                   // 8
    { pieces: 5, pre: 2, lines: true, turn: true },      // 9
    { pieces: 5, pre: 2, turn: true },                   // 10
    { pieces: 5, pre: 1, turn: true },                   // 11
    { pieces: 5, pre: 0, turn: true },                   // 12
    { pieces: 6, pre: 2, lines: true, turn: true },      // 13
    { pieces: 6, pre: 2, turn: true },                   // 14
    { pieces: 6, pre: 1, turn: true },                   // 15
    { pieces: 6, pre: 0, turn: true },                   // 16
    { pieces: 7, pre: 3, lines: true, turn: true },      // 17
    { pieces: 7, pre: 3, turn: true },                   // 18
    { pieces: 7, pre: 2, turn: true },                   // 19
    { pieces: 7, pre: 2, turn: true, max: 7 },           // 20
    { pieces: 7, pre: 1, turn: true },                   // 21
    { pieces: 7, pre: 1, turn: true, max: 7 },           // 22
    { pieces: 7, pre: 1, turn: true, max: 6 },           // 23
    { pieces: 7, pre: 0, turn: true },                   // 24
    { pieces: 7, pre: 0, turn: true, max: 7 },           // 25
    { pieces: 7, pre: 0, turn: true, max: 7 },           // 26
    { pieces: 7, pre: 0, turn: true, max: 6 },           // 27
    { pieces: 7, pre: 0, turn: true, max: 6 },           // 28
    { pieces: 7, pre: 0, turn: true, max: 5 },           // 29
    { pieces: 7, pre: 0, turn: true, max: 5 }            // 30
  ];

  /* ---------- geometry (pure) ---------- */
  function normalize(pts) {
    var mx = Infinity, my = Infinity;
    pts.forEach(function (p) { mx = Math.min(mx, p[0]); my = Math.min(my, p[1]); });
    return pts.map(function (p) { return [p[0] - mx, p[1] - my]; });
  }
  // orientation: rot 0–3 quarter turns, flip (mirror) first
  function oriented(type, rot, flip) {
    var pts = SHAPES[type].map(function (p) { return flip ? [-p[0], p[1]] : [p[0], p[1]]; });
    for (var i = 0; i < rot; i++) pts = pts.map(function (p) { return [-p[1], p[0]]; });
    return normalize(pts);
  }
  function placed(pc) {
    return oriented(pc.type, pc.rot, pc.flip).map(function (p) { return [p[0] + pc.x, p[1] + pc.y]; });
  }
  function size(pts) {
    var w = 0, h = 0;
    pts.forEach(function (p) { w = Math.max(w, p[0]); h = Math.max(h, p[1]); });
    return [w, h];
  }
  function inside(pts, x, y) {
    var c = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) c = !c;
    }
    return c;
  }
  // sample cells (centres of a fine grid) covered by a polygon
  function cells(pts) {
    var out = [];
    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    pts.forEach(function (p) { minX = Math.min(minX, p[0]); minY = Math.min(minY, p[1]); maxX = Math.max(maxX, p[0]); maxY = Math.max(maxY, p[1]); });
    for (var i = minX * RES; i < maxX * RES; i++) {
      for (var j = minY * RES; j < maxY * RES; j++) {
        if (inside(pts, (i + 0.5) / RES, (j + 0.5) / RES)) out.push(i + ',' + j);
      }
    }
    return out;
  }
  function coverage(pieces) {
    var map = {};
    pieces.forEach(function (pc) { cells(placed(pc)).forEach(function (k) { map[k] = (map[k] || 0) + 1; }); });
    return map;
  }
  // does `pieces` cover exactly the same cells as `target`, with no overlaps?
  function matches(pieces, targetMap) {
    var map = coverage(pieces);
    var keys = Object.keys(map);
    if (keys.length !== Object.keys(targetMap).length) return false;
    for (var i = 0; i < keys.length; i++) if (map[keys[i]] !== 1 || !targetMap[keys[i]]) return false;
    return true;
  }

  /* A random connected figure: each new piece touches the figure along an edge and never overlaps it. */
  function makeFigure(spec, rnd) {
    var types = rnd.shuffle(SET.slice()).slice(0, spec.pieces);
    var max = spec.max || 8;
    for (var attempt = 0; attempt < 400; attempt++) {
      var pcs = [{ type: types[0], rot: rnd.randInt(0, 3), flip: types[0] === 'PG' && rnd.randInt(0, 1) === 1, x: 2, y: 2 }];
      var map = coverage(pcs);
      var ok = true;
      for (var t = 1; t < types.length && ok; t++) {
        var placedOne = false;
        for (var tries = 0; tries < 150 && !placedOne; tries++) {
          var pc = { type: types[t], rot: rnd.randInt(0, 3), flip: types[t] === 'PG' && rnd.randInt(0, 1) === 1,
            x: rnd.randInt(0, BOARD - 2), y: rnd.randInt(0, BOARD - 2) };
          var cs = cells(placed(pc));
          if (cs.some(function (k) { return map[k]; })) continue;
          // touching: enough of its cells sit right next to the figure
          var touch = 0;
          cs.forEach(function (k) {
            var p = k.split(','), i = +p[0], j = +p[1];
            if (map[(i + 1) + ',' + j] || map[(i - 1) + ',' + j] || map[i + ',' + (j + 1)] || map[i + ',' + (j - 1)]) touch++;
          });
          if (touch < RES) continue;
          var all = pcs.concat([pc]);
          var b = bounds(all);
          if (b.w > max || b.h > max) continue;
          pcs = all;
          cs.forEach(function (k) { map[k] = 1; });
          placedOne = true;
        }
        if (!placedOne) ok = false;
      }
      if (!ok) continue;
      // centre the figure on the board
      var bb = bounds(pcs);
      var dx = Math.floor((BOARD - bb.w) / 2) - bb.x, dy = Math.floor((BOARD - bb.h) / 2) - bb.y;
      pcs.forEach(function (p) { p.x += dx; p.y += dy; });
      return pcs;
    }
    return null;
  }
  function bounds(pcs) {
    var x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    pcs.forEach(function (pc) {
      placed(pc).forEach(function (p) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); });
    });
    return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
  }

  /* ---------- drawing ---------- */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) {
    var n = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    return n;
  }
  function pts2str(pts) { return pts.map(function (p) { return p[0] + ',' + p[1]; }).join(' '); }

  var css = [
    '.tg-board{width:min(100%,22rem);min-width:11rem;aspect-ratio:1;display:block;touch-action:none;',
    'background:var(--surface);border:2px solid var(--line);border-radius:var(--radius);}',
    '.tg-grid{stroke:var(--line);stroke-width:.03;}',
    '.tg-sil{fill:var(--ink-soft);fill-opacity:.28;}',
    '.tg-line{fill:none;stroke:var(--surface);stroke-width:.08;stroke-linejoin:round;}',
    '.tg-pre{fill:var(--ink-soft);fill-opacity:.55;stroke:var(--surface);stroke-width:.06;}',
    '.tg-pc{fill-opacity:.85;stroke:var(--surface);stroke-width:.07;stroke-linejoin:round;cursor:grab;}',
    '.tg-pc.is-sel{stroke:var(--sun);stroke-width:.16;fill-opacity:1;}',
    '.tg-done .tg-pc{fill:var(--good);cursor:default;}',
    '.tg-tray{display:flex;flex-wrap:wrap;justify-content:center;gap:.2rem;width:100%;max-width:24rem;min-height:3.1rem;}',
    '.tg-tbtn{width:3.1rem;height:3.1rem;padding:.25rem;border-radius:var(--radius-sm);border:2px solid var(--line);background:var(--surface-2);cursor:pointer;touch-action:none;}',
    '.tg-tbtn svg{width:100%;height:100%;display:block;}',
    '.tg-tbtn.is-sel{border-color:var(--sun);box-shadow:0 0 0 3px var(--sun);}',
    '.tg-actions .btn{min-width:0;padding-inline:.8rem;}'
  ].join('');

  BrainGames.register({
    id: 'tangram',
    name: 'טנגרם',
    skill: 'perception',
    tagline: 'מלאו את הצללית בחלקי הטנגרם',
    benefit: 'תפיסה מרחבית, סיבוב בדמיון ותכנון',
    instructions: [
      'על הלוח יש צללית אפורה. צריך למלא אותה בדיוק בחלקים שלמטה.',
      'לחצו על חלק כדי להוציא אותו ללוח, ואז לחצו על המקום בלוח שאליו הוא צריך לזוז (אפשר גם לגרור).',
      '"סובבו" מסובב את החלק שנבחר רבע סיבוב, ו"הפכו" הופך את המקבילית כמו במראה.',
      'כשהצללית מלאה בדיוק, החלקים נצבעים בירוק. אפשר לבקש רמז אחד בכל צללית. אין שעון.'
    ],
    css: css,
    _model: { makeFigure: makeFigure, matches: matches, coverage: coverage, LEVELS: LEVELS },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var round = 0, solved = 0, hintRounds = 0;
      var cleanupDrag = null;

      function nextRound() {
        if (cleanupDrag) { cleanupDrag(); cleanupDrag = null; }
        round++;
        if (round > ROUNDS) {
          ctx.finish({
            correct: solved, total: ROUNDS,
            note: 'מילאתם ' + solved + ' מתוך ' + ROUNDS + ' צלליות' + (hintRounds ? ' (ב-' + hintRounds + ' נעזרתם ברמז)' : '')
          });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var fig = null;
        for (var t = 0; t < 5 && !fig; t++) fig = makeFigure(spec, ctx);
        if (!fig) fig = makeFigure({ pieces: Math.min(4, spec.pieces), pre: 0 }, ctx);
        play(fig);
      }

      function play(fig) {
        root.innerHTML = '';
        var targetMap = coverage(fig);
        var order = ctx.shuffle(fig.map(function (_, i) { return i; }));
        var preSet = {};
        order.slice(0, Math.min(spec.pre || 0, fig.length - 1)).forEach(function (i) { preSet[i] = true; });
        // the player's pieces: same types as the figure's open pieces, starting in the tray
        var mine = [];
        fig.forEach(function (pc, i) {
          if (preSet[i]) return;
          mine.push({
            type: pc.type, sol: i,
            rot: spec.turn ? ctx.randInt(0, 3) : pc.rot,
            flip: pc.type === 'PG' ? (spec.turn ? ctx.randInt(0, 1) === 1 : pc.flip) : false,
            x: 0, y: 0, onBoard: false
          });
        });
        mine = ctx.shuffle(mine);
        var sel = -1, done = false, hints = 0;

        var svg = svgEl('svg', { viewBox: '0 0 ' + BOARD + ' ' + BOARD, class: 'tg-board', role: 'img', 'aria-label': 'לוח הטנגרם' });
        var tray = el('div', { class: 'tg-tray', 'aria-label': 'חלקים' });
        var rotBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: rotateSel }, 'סובבו ↻');
        var flipBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: flipSel }, 'הפכו ⇆');
        var backBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: backSel }, 'החזירו');
        var hintBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: hint }, 'רמז');
        // board, tray and rotate/flip stay on screen while playing; undo, hint and solution sit below
        // (scroll down for them), so the board can stay big on a phone
        var actions = el('div', { class: 'g-actions tg-actions' }, [rotBtn, flipBtn]);
        var extra = el('div', { class: 'g-actions tg-actions tg-extra' }, [backBtn, hintBtn]);
        root.appendChild(svg);
        root.appendChild(tray);
        root.appendChild(actions);
        root.appendChild(extra);
        ctx.setStatus('מלאו את הצללית האפורה');

        function draw() {
          while (svg.firstChild) svg.removeChild(svg.firstChild);
          for (var g = 1; g < BOARD; g++) {
            svg.appendChild(svgEl('line', { x1: g, y1: 0, x2: g, y2: BOARD, class: 'tg-grid' }));
            svg.appendChild(svgEl('line', { x1: 0, y1: g, x2: BOARD, y2: g, class: 'tg-grid' }));
          }
          fig.forEach(function (pc) { svg.appendChild(svgEl('polygon', { points: pts2str(placed(pc)), class: 'tg-sil' })); });
          if (spec.lines) fig.forEach(function (pc) { svg.appendChild(svgEl('polygon', { points: pts2str(placed(pc)), class: 'tg-line' })); });
          fig.forEach(function (pc, i) { if (preSet[i]) svg.appendChild(svgEl('polygon', { points: pts2str(placed(pc)), class: 'tg-pre' })); });
          mine.forEach(function (pc, i) {
            if (!pc.onBoard) return;
            var poly = svgEl('polygon', { points: pts2str(placed(pc)), class: 'tg-pc' + (i === sel ? ' is-sel' : ''),
              fill: 'var(--' + HUE[pc.type] + ')', 'data-i': i });
            svg.appendChild(poly);
          });
          // keep the selected piece on top
          var top = svg.querySelector('.tg-pc.is-sel');
          if (top) svg.appendChild(top);
          tray.innerHTML = '';
          mine.forEach(function (pc, i) {
            if (pc.onBoard) return;
            var o = oriented(pc.type, pc.rot, pc.flip), s = size(o), m = Math.max(s[0], s[1], 2);
            var mini = svgEl('svg', { viewBox: (-(m - s[0]) / 2 - .3) + ' ' + (-(m - s[1]) / 2 - .3) + ' ' + (m + .6) + ' ' + (m + .6), 'aria-hidden': 'true' });
            mini.appendChild(svgEl('polygon', { points: pts2str(o), fill: 'var(--' + HUE[pc.type] + ')' }));
            var b = el('button', { class: 'tg-tbtn' + (i === sel ? ' is-sel' : ''), type: 'button', 'aria-label': NAME[pc.type], onclick: function () { takeOut(i); } });
            // press and drag straight from the tray onto the board (a plain tap still works, see takeOut)
            b.addEventListener('pointerdown', function (ev) { trayPress = { i: i, x: ev.clientX, y: ev.clientY }; });
            b.appendChild(mini);
            tray.appendChild(b);
          });
          var s0 = mine[sel];
          rotBtn.disabled = done || sel < 0;
          flipBtn.disabled = done || sel < 0 || s0.type !== 'PG';
          backBtn.disabled = done || sel < 0 || !s0.onBoard;
          hintBtn.disabled = done;
        }

        function clampPiece(pc) {
          var s = size(oriented(pc.type, pc.rot, pc.flip));
          pc.x = Math.max(0, Math.min(BOARD - s[0], pc.x));
          pc.y = Math.max(0, Math.min(BOARD - s[1], pc.y));
        }

        function takeOut(i) {
          if (done) return;
          ctx.sound('tap');
          var pc = mine[i];
          sel = i;
          if (!pc.onBoard) {
            // drop it in a corner of the board, away from the silhouette when possible
            var s = size(oriented(pc.type, pc.rot, pc.flip));
            pc.x = 0; pc.y = 0;
            pc.x = BOARD - s[0]; pc.y = BOARD - s[1];
            pc.onBoard = true;
          }
          ctx.setStatus('לחצו בלוח כדי להניח את ה' + NAME[pc.type]);
          draw();
        }

        function rotateSel() {
          if (sel < 0 || done) return;
          var pc = mine[sel];
          var s0 = size(oriented(pc.type, pc.rot, pc.flip));
          pc.rot = (pc.rot + 1) % 4;
          var s1 = size(oriented(pc.type, pc.rot, pc.flip));
          // turn around its middle
          pc.x += Math.round((s0[0] - s1[0]) / 2); pc.y += Math.round((s0[1] - s1[1]) / 2);
          clampPiece(pc);
          ctx.sound('tap');
          draw(); checkDone();
        }
        function flipSel() {
          if (sel < 0 || done || mine[sel].type !== 'PG') return;
          mine[sel].flip = !mine[sel].flip;
          clampPiece(mine[sel]);
          ctx.sound('tap');
          draw(); checkDone();
        }
        function backSel() {
          if (sel < 0 || done) return;
          mine[sel].onBoard = false;
          sel = -1;
          draw();
        }

        function svgPoint(ev) {
          var r = svg.getBoundingClientRect();
          if (!r.width) return null;
          return [(ev.clientX - r.left) / r.width * BOARD, (ev.clientY - r.top) / r.height * BOARD];
        }

        // Tap on the board: move the selected piece so its middle lands on the tap. Drag: move along.
        // Dragging also works from the tray: once the finger moves, the piece comes onto the board under it.
        var drag = null, trayPress = null;
        function onDown(ev) {
          if (done) return;
          var t = ev.target;
          var p = svgPoint(ev);
          if (!p) return;
          if (t && t.getAttribute && t.getAttribute('data-i') !== null) {
            sel = +t.getAttribute('data-i');
            var pc = mine[sel];
            drag = { dx: p[0] - pc.x, dy: p[1] - pc.y, moved: false };
            try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
            draw();
            return;
          }
          if (sel >= 0 && mine[sel].onBoard) {
            var q = mine[sel], s = size(oriented(q.type, q.rot, q.flip));
            q.x = Math.round(p[0] - s[0] / 2); q.y = Math.round(p[1] - s[1] / 2);
            clampPiece(q);
            ctx.sound('tap');
            draw(); checkDone();
          }
        }
        function onMove(ev) {
          if (trayPress && !drag) {
            if (Math.abs(ev.clientX - trayPress.x) + Math.abs(ev.clientY - trayPress.y) < 10) return;
            var i = trayPress.i, t = mine[i], ts = size(oriented(t.type, t.rot, t.flip));
            trayPress = null;
            if (done || t.onBoard) return;
            sel = i; t.onBoard = true;
            drag = { dx: ts[0] / 2, dy: ts[1] / 2, moved: true };
            ctx.sound('tap');
          }
          if (!drag || sel < 0) return;
          var p = svgPoint(ev);
          if (!p) return;
          var pc = mine[sel];
          var nx = Math.round(p[0] - drag.dx), ny = Math.round(p[1] - drag.dy);
          if (nx !== pc.x || ny !== pc.y) { pc.x = nx; pc.y = ny; clampPiece(pc); drag.moved = true; draw(); }
        }
        function onUp() {
          trayPress = null;
          if (!drag) return;
          drag = null;
          checkDone();
        }
        // moves and releases are watched on the whole page, so a drag can start in the tray
        svg.addEventListener('pointerdown', onDown);
        document.addEventListener('pointermove', onMove);
        document.addEventListener('pointerup', onUp);
        document.addEventListener('pointercancel', onUp);
        cleanupDrag = function () {
          svg.removeEventListener('pointerdown', onDown);
          document.removeEventListener('pointermove', onMove);
          document.removeEventListener('pointerup', onUp);
          document.removeEventListener('pointercancel', onUp);
        };

        function allPieces() {
          return fig.filter(function (_, i) { return preSet[i]; }).concat(mine.filter(function (pc) { return pc.onBoard; }));
        }

        function checkDone() {
          if (done || mine.some(function (pc) { return !pc.onBoard; })) return;
          if (!matches(allPieces(), targetMap)) {
            ctx.setStatus('כמעט! הזיזו או סובבו חלק');
            return;
          }
          done = true;
          sel = -1;
          svg.classList.add('tg-done');
          // one hint is fine; a figure filled mostly by hints does not count as solved
          if (hints <= 1) solved++;
          if (hints) hintRounds++;
          draw();
          ctx.setStatus(hints > 1 ? 'הצללית מלאה, בעזרת רמזים' : 'מצוין! הצללית מלאה');
          ctx.feedback(hints <= 1, hints > 1 ? 'הפעם בעזרת רמזים. בפעם הבאה נסו עם רמז אחד לכל היותר' : undefined).then(function () { return ctx.wait(700); }).then(showNext);
        }

        // Hint: put one piece where it is in our solution (moving away anything in its way is up to the player).
        function hint() {
          if (done) return;
          var wrong = mine.filter(function (pc) {
            var s = fig[pc.sol];
            return !(pc.onBoard && pc.x === s.x && pc.y === s.y && pc.rot === s.rot && pc.flip === s.flip);
          });
          if (!wrong.length) return;
          var pc = wrong[0], s = fig[pc.sol];
          pc.rot = s.rot; pc.flip = s.flip; pc.x = s.x; pc.y = s.y; pc.onBoard = true;
          sel = mine.indexOf(pc);
          hints++;
          ctx.setStatus('ה' + NAME[pc.type] + ' במקום');
          draw(); checkDone();
        }

        function showNext() {
          actions.innerHTML = '';
          extra.remove();
          var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { next.disabled = true; nextRound(); } },
            round >= ROUNDS ? 'לסיכום' : 'לצללית הבאה');
          actions.appendChild(next);
        }

        // Stuck: show the solution after asking.
        var giveUp = el('button', { class: 'btn btn-quiet', type: 'button', onclick: function () {
          if (done) return;
          done = true;
          mine.forEach(function (pc) { var s = fig[pc.sol]; pc.rot = s.rot; pc.flip = s.flip; pc.x = s.x; pc.y = s.y; pc.onBoard = true; });
          sel = -1;
          draw();
          ctx.setStatus('כך החלקים ממלאים את הצללית');
          ctx.feedback(false, 'הנה פתרון אחד').then(showNext);
        } }, 'הראו פתרון');
        extra.appendChild(giveUp);
        draw();
        fitBoard();
      }

      /* Once per round (and when the screen size really changes): shrink the board so the board, the tray
         and the rotate/flip row fit one screen; the other buttons may sit below the fold. The height is the
         small viewport (svh, address bar showing), so the board does not jump when the phone's bar hides. */
      var lastW = 0, lastH = 0;
      function screenH() {
        var probe = document.createElement('div');
        probe.style.cssText = 'position:fixed;top:0;height:100svh;width:0;visibility:hidden;pointer-events:none';
        document.body.appendChild(probe);
        var h = probe.offsetHeight || window.innerHeight;
        probe.remove();
        return h;
      }
      function fitBoard() {
        var svg = root.querySelector('.tg-board');
        var keep = root.querySelector('.tg-actions');
        if (!svg || !keep) return;
        lastW = window.innerWidth; lastH = screenH();
        svg.style.width = '';
        var over = keep.getBoundingClientRect().bottom + window.scrollY + 12 - lastH;
        if (over > 0) svg.style.width = Math.max(0, svg.getBoundingClientRect().width - over) + 'px';
      }
      function onResize() { if (window.innerWidth !== lastW || screenH() !== lastH) fitBoard(); }
      window.addEventListener('resize', onResize);

      nextRound();
      return function cleanup() { if (cleanupDrag) cleanupDrag(); window.removeEventListener('resize', onResize); };
    }
  });
})();
