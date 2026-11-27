/* טנגרם — fill a silhouette with the seven classic pieces (perception, spatial reasoning). Untimed.
   Pieces turn in eighths (45°). A piece turned 0, 90, 180 or 270° sits on the board's grid; turned 45° more it sits
   on a second grid, tilted 45° (ORIGIN = where that grid starts). Positions are whole steps of the piece's grid,
   so placing snaps exactly, and any arrangement that covers the silhouette counts. From level 15 some figures
   are tilted 45° as a whole, and then the pieces must be turned in eighths too. */
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

  /* Per level (1–50): pieces in the figure (all placed by the player; no grey pieces are given), lines = the
     outline of every piece is drawn inside the silhouette (only up to level 10: from 11 the shadow is whole, user request), turn = pieces in the tray start turned,
     max = largest figure size (smaller = more compact, harder). pre stays 0 (kept for the model/tests).
     31–50: nogrid = no grid lines on the board, spare = the tray holds the whole classic set but the figure
     uses one piece less (that piece stays in the tray), compact = build that many figures and keep the most
     compact one (the shortest outline gives the fewest clues). */
  var LEVELS = [
    { pieces: 2, pre: 0, lines: true },                  // 1
    { pieces: 2, pre: 0, lines: true },                  // 2
    { pieces: 3, pre: 0, lines: true },                  // 3
    { pieces: 2, pre: 0, lines: true, turn: true },      // 4
    { pieces: 3, pre: 0, lines: true, turn: true },      // 5
    { pieces: 3, pre: 0, lines: true, turn: true },      // 6
    { pieces: 3, pre: 0 },                               // 7
    { pieces: 3, pre: 0, turn: true },                   // 8
    { pieces: 4, pre: 0, lines: true, turn: true },      // 9
    { pieces: 4, pre: 0, lines: true, turn: true },      // 10
    { pieces: 4, pre: 0, turn: true },                   // 11
    { pieces: 4, pre: 0, turn: true },                   // 12
    { pieces: 5, pre: 0, turn: true },      // 13
    { pieces: 5, pre: 0, turn: true },                   // 14
    { pieces: 5, pre: 0, turn: true },                   // 15
    { pieces: 6, pre: 0, turn: true },      // 16
    { pieces: 6, pre: 0, turn: true },                   // 17
    { pieces: 6, pre: 0, turn: true },                   // 18
    { pieces: 6, pre: 0, turn: true, max: 7 },           // 19
    { pieces: 7, pre: 0, turn: true },      // 20
    { pieces: 7, pre: 0, turn: true },                   // 21
    { pieces: 7, pre: 0, turn: true },                   // 22
    { pieces: 7, pre: 0, turn: true, max: 7 },           // 23
    { pieces: 7, pre: 0, turn: true, max: 7 },           // 24
    { pieces: 7, pre: 0, turn: true, max: 7 },           // 25
    { pieces: 7, pre: 0, turn: true, max: 6 },           // 26
    { pieces: 7, pre: 0, turn: true, max: 6 },           // 27
    { pieces: 7, pre: 0, turn: true, max: 6 },           // 28
    { pieces: 7, pre: 0, turn: true, max: 5 },           // 29
    { pieces: 7, pre: 0, turn: true, max: 5 },           // 30
    { pieces: 7, pre: 0, turn: true, max: 5, nogrid: true },                          // 31
    { pieces: 7, pre: 0, turn: true, max: 5, nogrid: true },                          // 32
    { pieces: 7, pre: 0, turn: true, max: 5, nogrid: true, compact: 2 },              // 33
    { pieces: 6, pre: 0, turn: true, max: 5, spare: 1 },                              // 34
    { pieces: 6, pre: 0, turn: true, max: 5, spare: 1 },                              // 35
    { pieces: 6, pre: 0, turn: true, max: 5, spare: 1, compact: 2 },                  // 36
    { pieces: 6, pre: 0, turn: true, max: 5, spare: 1, nogrid: true },                // 37
    { pieces: 6, pre: 0, turn: true, max: 5, spare: 1, nogrid: true },                // 38
    { pieces: 6, pre: 0, turn: true, max: 5, spare: 1, nogrid: true, compact: 2 },    // 39
    { pieces: 6, pre: 0, turn: true, max: 5, spare: 1, nogrid: true, compact: 2 },    // 40
    { pieces: 6, pre: 0, turn: true, max: 5, spare: 1, nogrid: true, compact: 3 },    // 41
    { pieces: 6, pre: 0, turn: true, max: 5, spare: 1, nogrid: true, compact: 3 },    // 42
    { pieces: 6, pre: 0, turn: true, max: 5, spare: 1, nogrid: true, compact: 4 },    // 43
    { pieces: 6, pre: 0, turn: true, max: 5, spare: 1, nogrid: true, compact: 4 },    // 44
    { pieces: 6, pre: 0, turn: true, max: 5, spare: 1, nogrid: true, compact: 5 },    // 45
    { pieces: 6, pre: 0, turn: true, max: 5, spare: 1, nogrid: true, compact: 6 },    // 46
    { pieces: 6, pre: 0, turn: true, max: 5, spare: 1, nogrid: true, compact: 7 },    // 47
    { pieces: 6, pre: 0, turn: true, max: 5, spare: 1, nogrid: true, compact: 8 },    // 48
    { pieces: 6, pre: 0, turn: true, max: 5, spare: 1, nogrid: true, compact: 9 },    // 49
    { pieces: 6, pre: 0, turn: true, max: 5, spare: 1, nogrid: true, compact: 10 }    // 50
  ];

  /* ---------- geometry (pure) ---------- */
  function normalize(pts) {
    var mx = Infinity, my = Infinity;
    pts.forEach(function (p) { mx = Math.min(mx, p[0]); my = Math.min(my, p[1]); });
    return pts.map(function (p) { return [p[0] - mx, p[1] - my]; });
  }
  // orientation: rot 0–7 eighths of a turn, flip (mirror) first. The corners are given in the piece's own grid:
  // for an odd rot that is the tilted grid (the shape of rot - 1, laid on the tilted grid)
  function oriented(type, rot, flip) {
    var pts = SHAPES[type].map(function (p) { return flip ? [-p[0], p[1]] : [p[0], p[1]]; });
    for (var i = 0; i < Math.floor(rot / 2); i++) pts = pts.map(function (p) { return [-p[1], p[0]]; });
    return normalize(pts);
  }
  var R = Math.SQRT1_2;
  var ORIGIN = [0, 0]; // where the tilted grid starts on the board (set for each figure)
  function tilt(p) { return [ORIGIN[0] + (p[0] - p[1]) * R, ORIGIN[1] + (p[0] + p[1]) * R]; }
  function untilt(q) { var a = q[0] - ORIGIN[0], b = q[1] - ORIGIN[1]; return [(a + b) * R, (b - a) * R]; }
  // a board point in the grid of piece pc (and back)
  function toGrid(pc, q) { return pc.rot % 2 ? untilt(q) : q; }
  function toBoard(pc, p) { return pc.rot % 2 ? tilt(p) : p; }
  function placed(pc) {
    return oriented(pc.type, pc.rot, pc.flip).map(function (p) { return toBoard(pc, [p[0] + pc.x, p[1] + pc.y]); });
  }
  // the shape as it looks (for the tray), corners from 0
  function looks(type, rot, flip) {
    var o = oriented(type, rot, flip);
    if (rot % 2) o = o.map(function (p) { return [(p[0] - p[1]) * R, (p[0] + p[1]) * R]; });
    return normalize(o);
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
    for (var i = Math.floor(minX * RES); i < Math.ceil(maxX * RES); i++) {
      for (var j = Math.floor(minY * RES); j < Math.ceil(maxY * RES); j++) {
        // a sample point a hair off the centre, so it never sits exactly on an edge (tilted edges are not exact)
        if (inside(pts, (i + 0.5371) / RES, (j + 0.5213) / RES)) out.push(i + ',' + j);
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
      var pcs = [{ type: types[0], rot: 2 * rnd.randInt(0, 3), flip: types[0] === 'PG' && rnd.randInt(0, 1) === 1, x: 2, y: 2 }];
      var map = coverage(pcs);
      var ok = true;
      for (var t = 1; t < types.length && ok; t++) {
        var placedOne = false;
        for (var tries = 0; tries < 150 && !placedOne; tries++) {
          var pc = { type: types[t], rot: 2 * rnd.randInt(0, 3), flip: types[t] === 'PG' && rnd.randInt(0, 1) === 1,
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
  /* Length of the silhouette's outline, in sample-cell edges (shorter = more compact, fewer clues). */
  function outline(pcs) {
    var map = coverage(pcs), n = 0;
    Object.keys(map).forEach(function (k) {
      var p = k.split(','), i = +p[0], j = +p[1];
      if (!map[(i + 1) + ',' + j]) n++;
      if (!map[(i - 1) + ',' + j]) n++;
      if (!map[i + ',' + (j + 1)]) n++;
      if (!map[i + ',' + (j - 1)]) n++;
    });
    return n;
  }
  /* The level's figure: with `compact`, the most compact of that many tries. */
  function makePuzzle(spec, rnd) {
    var best = null, bestLen = Infinity;
    for (var k = 0; k < (spec.compact || 1); k++) {
      var f = null;
      for (var t = 0; t < 5 && !f; t++) f = makeFigure(spec, rnd);
      if (!f) continue;
      var len = spec.compact ? outline(f) : 0;
      if (len < bestLen) { best = f; bestLen = len; }
    }
    return best;
  }
  /* Turn a whole figure 45° (onto the tilted grid) and centre it, if it still fits the board. */
  function tiltFigure(fig) {
    var keep = ORIGIN;
    ORIGIN = [0, 0];
    var t = fig.map(function (pc) { return { type: pc.type, rot: pc.rot + 1, flip: pc.flip, x: pc.x, y: pc.y }; });
    var b = bounds(t);
    if (b.w > BOARD - 0.6 || b.h > BOARD - 0.6) { ORIGIN = keep; return null; }
    ORIGIN = [(BOARD - b.w) / 2 - b.x, (BOARD - b.h) / 2 - b.y];
    return t;
  }
  /* The tray's spare pieces: the classic set minus the pieces the figure uses. */
  function spareTypes(fig) {
    var left = SET.slice();
    fig.forEach(function (pc) { left.splice(left.indexOf(pc.type), 1); });
    return left;
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
    '.tg-nogrid .tg-grid{display:none;}',
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
      '"סובבו" מסובב את החלק שנבחר שמינית סיבוב (45°), ו"הפכו" הופך את המקבילית כמו במראה. ברמות הגבוהות יש צלליות עקומות ב-45°.',
      'כשהצללית מלאה בדיוק, החלקים נצבעים בירוק. אפשר לבקש רמז אחד בכל צללית. אין שעון.',
      'ברמות הגבוהות אין קווי עזר בלוח, ויש במגש חלק אחד מיותר שנשאר בחוץ.'
    ],
    css: css,
    _model: { makeFigure: makeFigure, makePuzzle: makePuzzle, outline: outline, spareTypes: spareTypes, matches: matches, coverage: coverage, LEVELS: LEVELS,
      tiltFigure: tiltFigure, placed: placed },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var tiltLevel = level >= 15; // from 15 about half the figures are turned 45° as a whole
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
        ORIGIN = [0, 0];
        var fig = makePuzzle(spec, ctx);
        if (!fig) fig = makeFigure({ pieces: Math.min(4, spec.pieces), pre: 0 }, ctx);
        if (tiltLevel && ctx.randInt(0, 1)) fig = tiltFigure(fig) || fig;
        play(fig);
      }

      function play(fig) {
        root.innerHTML = '';
        var targetMap = coverage(fig);
        var order = ctx.shuffle(fig.map(function (_, i) { return i; }));
        var preSet = {};
        order.slice(0, Math.min(spec.pre || 0, fig.length - 1)).forEach(function (i) { preSet[i] = true; });
        function startRot() { return tiltLevel ? ctx.randInt(0, 7) : 2 * ctx.randInt(0, 3); }
        // the player's pieces: same types as the figure's open pieces, starting in the tray
        var mine = [];
        fig.forEach(function (pc, i) {
          if (preSet[i]) return;
          mine.push({
            type: pc.type, sol: i,
            rot: spec.turn ? startRot() : pc.rot,
            flip: pc.type === 'PG' ? (spec.turn ? ctx.randInt(0, 1) === 1 : pc.flip) : false,
            x: 0, y: 0, onBoard: false
          });
        });
        // spare pieces (levels 34–50): in the tray, not part of the figure
        if (spec.spare) spareTypes(fig).forEach(function (type) {
          mine.push({ type: type, sol: -1, rot: startRot(), flip: type === 'PG' && ctx.randInt(0, 1) === 1, x: 0, y: 0, onBoard: false });
        });
        var needOnBoard = mine.length - (spec.spare ? spareTypes(fig).length : 0);
        mine = ctx.shuffle(mine);
        var sel = -1, done = false, hints = 0;

        var svg = svgEl('svg', { viewBox: '0 0 ' + BOARD + ' ' + BOARD, class: 'tg-board' + (spec.nogrid ? ' tg-nogrid' : ''), role: 'img', 'aria-label': 'לוח הטנגרם' });
        var tray = el('div', { class: 'tg-tray', 'aria-label': 'חלקים' });
        var rotBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: rotateSel }, 'סובבו ↻');
        var flipBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: flipSel }, 'הפכו ⇆');
        var backBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: backSel }, 'החזירו');
        var hintBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: hint }, 'רמז');
        var againBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: startOver }, 'התחלה מחדש');
        // board, tray and rotate/flip stay on screen while playing; undo, hint and solution sit below
        // (scroll down for them), so the board can stay big on a phone
        var actions = el('div', { class: 'g-actions tg-actions' }, [rotBtn, flipBtn]);
        var extra = el('div', { class: 'g-actions tg-actions tg-extra' }, [backBtn, againBtn, hintBtn]);
        root.appendChild(svg);
        root.appendChild(tray);
        root.appendChild(actions);
        root.appendChild(extra);
        ctx.setStatus(spec.spare ? 'מלאו את הצללית. חלק אחד מיותר' : 'מלאו את הצללית האפורה');

        function draw() {
          while (svg.firstChild) svg.removeChild(svg.firstChild);
          if (fig[0].rot % 2) { // the figure is tilted: so are the help lines
            for (var k = -14; k <= 14; k++) {
              var a1 = tilt([k, -14]), a2 = tilt([k, 14]), b1 = tilt([-14, k]), b2 = tilt([14, k]);
              svg.appendChild(svgEl('line', { x1: a1[0], y1: a1[1], x2: a2[0], y2: a2[1], class: 'tg-grid' }));
              svg.appendChild(svgEl('line', { x1: b1[0], y1: b1[1], x2: b2[0], y2: b2[1], class: 'tg-grid' }));
            }
          } else for (var g = 1; g < BOARD; g++) {
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
            var o = looks(pc.type, pc.rot, pc.flip), s = size(o), m = Math.max(s[0], s[1], 2);
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
          againBtn.disabled = done || !mine.some(function (pc) { return pc.onBoard; });
          hintBtn.disabled = done;
        }

        function clampPiece(pc) {
          if (!(pc.rot % 2)) {
            var s = size(oriented(pc.type, pc.rot, pc.flip));
            pc.x = Math.max(0, Math.min(BOARD - s[0], pc.x));
            pc.y = Math.max(0, Math.min(BOARD - s[1], pc.y));
            return;
          }
          // on the tilted grid: step back onto the board (each step moves √2 left/right or up/down)
          for (var k = 0; k < 40; k++) {
            var b = bounds([pc]), e = 0.01;
            if (b.x < -e) { pc.x++; pc.y--; } else if (b.x + b.w > BOARD + e) { pc.x--; pc.y++; }
            else if (b.y < -e) { pc.x++; pc.y++; } else if (b.y + b.h > BOARD + e) { pc.x--; pc.y--; }
            else return;
          }
        }
        var turnAt = null; // the middle that a run of turns keeps
        // move a piece so that its middle is at board point q (snapped to its grid)
        function centreAt(pc, q) {
          var s = size(oriented(pc.type, pc.rot, pc.flip)), g = toGrid(pc, q);
          pc.x = Math.round(g[0] - s[0] / 2); pc.y = Math.round(g[1] - s[1] / 2);
          clampPiece(pc);
        }
        // the middle that centreAt places by (the middle of the piece's box in its own grid), on the board
        function middle(pc) { var s = size(oriented(pc.type, pc.rot, pc.flip)); return toBoard(pc, [pc.x + s[0] / 2, pc.y + s[1] / 2]); }

        function takeOut(i) {
          if (done) return;
          ctx.sound('tap');
          var pc = mine[i];
          sel = i;
          if (!pc.onBoard) {
            // drop it in a corner of the board, away from the silhouette when possible
            centreAt(pc, [BOARD - 1.2, BOARD - 1.2]);
            pc.onBoard = true;
          }
          ctx.setStatus('לחצו בלוח כדי להניח את ה' + NAME[pc.type]);
          draw();
        }

        function rotateSel() {
          if (sel < 0 || done) return;
          var pc = mine[sel];
          // turning again and again keeps the same middle, so eight turns bring the piece back where it was
          var m = turnAt && turnAt.pc === pc ? turnAt.m : middle(pc);
          pc.rot = (pc.rot + 1) % 8; // an eighth of a turn, around its middle
          centreAt(pc, m);
          turnAt = { pc: pc, m: m };
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
        // every piece back to the tray, to start the figure again
        function startOver() {
          if (done || !mine.some(function (pc) { return pc.onBoard; })) return;
          ctx.sound('tap');
          mine.forEach(function (pc) { pc.onBoard = false; });
          sel = -1;
          ctx.setStatus('כל החלקים חזרו למטה. מתחילים מחדש');
          draw();
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
            var gp = toGrid(pc, p);
            drag = { dx: gp[0] - pc.x, dy: gp[1] - pc.y, moved: false };
            try { svg.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
            draw();
            return;
          }
          if (sel >= 0 && mine[sel].onBoard) {
            centreAt(mine[sel], p); turnAt = null;
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
          var pc = mine[sel], gq = toGrid(pc, p);
          var nx = Math.round(gq[0] - drag.dx), ny = Math.round(gq[1] - drag.dy);
          if (nx !== pc.x || ny !== pc.y) { pc.x = nx; pc.y = ny; clampPiece(pc); drag.moved = true; turnAt = null; draw(); }
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
          if (done) return;
          var on = mine.filter(function (pc) { return pc.onBoard; }).length;
          // with a spare piece another set of pieces may fill the figure too, so any count is checked
          if (on < needOnBoard && !spec.spare) return;
          if (!matches(allPieces(), targetMap)) {
            if (on > needOnBoard) ctx.setStatus('חלק אחד מיותר: החזירו אותו למגש');
            else if (on === needOnBoard) ctx.setStatus('כמעט! הזיזו או סובבו חלק');
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
          ctx.feedback(hints <= 1, hints > 1 ? 'הפעם בעזרת רמזים. בפעם הבאה נסו עם רמז אחד לכל היותר' : undefined).then(function () { return ctx.wait(700); }).then(nextRound);
        }

        // Hint: put one piece where it is in our solution (moving away anything in its way is up to the player).
        function hint() {
          if (done) return;
          var wrong = mine.filter(function (pc) {
            if (pc.sol < 0) return false;
            var s = fig[pc.sol];
            return !(pc.onBoard && pc.x === s.x && pc.y === s.y && pc.rot === s.rot && pc.flip === s.flip);
          });
          if (!wrong.length) {
            // every figure piece is in place: the spare piece on the board goes back to the tray
            var sp = mine.filter(function (pc) { return pc.sol < 0 && pc.onBoard; })[0];
            if (!sp) return;
            sp.onBoard = false; sel = -1; hints++;
            ctx.setStatus('ה' + NAME[sp.type] + ' מיותר, הוא חזר למגש');
            draw(); checkDone();
            return;
          }
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
          mine.forEach(function (pc) {
            if (pc.sol < 0) { pc.onBoard = false; return; }
            var s = fig[pc.sol]; pc.rot = s.rot; pc.flip = s.flip; pc.x = s.x; pc.y = s.y; pc.onBoard = true;
          });
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
