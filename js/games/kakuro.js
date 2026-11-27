/* קאקורו — a crossword of numbers: each row-run and column-run of white cells adds up to the number in the
   dark clue cell next to it, with no number twice in a run (logic, arithmetic). Every puzzle has one solution.
   Untimed; the player may pick any level on the intro screen. */
(function () {
  'use strict';

  /* Level 1–50: h × w white area (plus one clue row and column), dmax = numbers 1…dmax,
     black = share of extra dark cells inside, givens = share of white cells filled in at the start. */
  function spec(level) {
    var L = level;
    var size = L <= 6 ? 3 : L <= 14 ? 4 : L <= 24 ? 5 : L <= 36 ? 6 : 7;
    var dmax = L <= 4 ? 5 : L <= 10 ? 6 : L <= 18 ? 8 : 9;
    var givens = Math.max(0, 0.34 - L * 0.012);
    return { h: size, w: size, dmax: dmax, black: size <= 3 ? 0.12 : size <= 5 ? 0.22 : 0.28, givens: givens };
  }

  /* Model: R = h+1 rows, C = w+1 columns; row 0 and column 0 are clue cells. Column 0 is the rightmost
     (the grid is shown right-to-left), so an across run reads from its clue towards the left. */
  function runsOf(white, R, C) {
    var runs = [];
    for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) {
      if (white[r][c]) continue;
      // across run starting right after (r, c)
      var cells = [];
      for (var cc = c + 1; cc < C && white[r][cc]; cc++) cells.push(r * C + cc);
      if (cells.length >= 2) runs.push({ clue: r * C + c, dir: 'a', cells: cells });
      cells = [];
      for (var rr = r + 1; rr < R && white[rr][c]; rr++) cells.push(rr * C + c);
      if (cells.length >= 2) runs.push({ clue: r * C + c, dir: 'd', cells: cells });
    }
    return runs;
  }

  function makePattern(sp, rnd) {
    var R = sp.h + 1, C = sp.w + 1;
    for (var attempt = 0; attempt < 200; attempt++) {
      var white = [];
      for (var r = 0; r < R; r++) { white.push([]); for (var c = 0; c < C; c++) white[r].push(r > 0 && c > 0 && rnd.randInt(1, 100) > sp.black * 100); }
      // every white cell must sit in a run of 2+ cells, and runs may not be longer than dmax
      var changed = true;
      while (changed) {
        changed = false;
        for (r = 1; r < R; r++) for (c = 1; c < C; c++) {
          if (!white[r][c]) continue;
          var a = 1, d = 1, k;
          for (k = c - 1; k > 0 && white[r][k]; k--) a++;
          for (k = c + 1; k < C && white[r][k]; k++) a++;
          for (k = r - 1; k > 0 && white[k][c]; k--) d++;
          for (k = r + 1; k < R && white[k][c]; k++) d++;
          if ((a < 2 && d < 2) || a > sp.dmax || d > sp.dmax) { white[r][c] = false; changed = true; }
        }
      }
      var count = 0;
      for (r = 1; r < R; r++) for (c = 1; c < C; c++) if (white[r][c]) count++;
      if (count >= sp.h * sp.w * 0.6) return { white: white, R: R, C: C };
    }
    return null;
  }

  // runs of every white cell (1 or 2)
  function cellRuns(runs) {
    var map = {};
    runs.forEach(function (run, i) { run.cells.forEach(function (k) { (map[k] = map[k] || []).push(i); }); });
    return map;
  }

  /* combos[D][k * 64 + s] = bit masks of k different digits 1…D that add up to s (bit v = digit v). */
  var combos = {};
  function combosFor(D) {
    if (combos[D]) return combos[D];
    var t = {};
    for (var m = 2; m < (1 << (D + 1)); m += 2) {
      var k = 0, s = 0;
      for (var v = 1; v <= D; v++) if (m & (1 << v)) { k++; s += v; }
      (t[k * 64 + s] = t[k * 64 + s] || []).push(m);
    }
    return (combos[D] = t);
  }
  function bits(m) { var c = 0; while (m) { m &= m - 1; c++; } return c; }

  /* Counts solutions (up to limit). fixed = {cell: digit}. With rnd (and no sums yet) it makes a random filling.
     Each step fills the cell with the fewest possible digits; a run's possible digits come from the digit
     combinations that still reach its sum. */
  function search(P, fixed, limit, rnd) {
    var D = P.dmax, FULL = ((1 << (D + 1)) - 1) & ~1, table = combosFor(D);
    var runs = P.runs, map = P.map, cells = P.cells;
    var val = {}, used = [], filled = [], sumv = [], count = 0, first = null, second = null, nodes = 0, LIMIT = 60000;
    runs.forEach(function () { used.push(0); filled.push(0); sumv.push(0); });
    function place(k, v, sign) {
      map[k].forEach(function (ri) {
        if (sign > 0) { used[ri] |= 1 << v; filled[ri]++; sumv[ri] += v; }
        else { used[ri] &= ~(1 << v); filled[ri]--; sumv[ri] -= v; }
      });
      if (sign > 0) val[k] = v; else delete val[k];
    }
    var bad = false;
    Object.keys(fixed).forEach(function (k) {
      k = Number(k);
      if (map[k].some(function (ri) { return used[ri] & (1 << fixed[k]); })) bad = true;
      place(k, fixed[k], 1);
    });
    if (bad) return { count: 0 };
    function allowed(ri) {
      var run = runs[ri];
      if (run.sum === undefined) return FULL & ~used[ri];
      var list = table[(run.cells.length - filled[ri]) * 64 + (run.sum - sumv[ri])], out = 0;
      if (!list) return 0;
      for (var i = 0; i < list.length; i++) if (!(list[i] & used[ri])) out |= list[i];
      return out;
    }
    function rec() {
      if (count >= limit || nodes++ > LIMIT) return;
      var best = -1, bestDom = 0, bestN = 99;
      for (var i = 0; i < cells.length; i++) {
        var k = cells[i];
        if (val[k]) continue;
        var dom = FULL;
        for (var j = 0; j < map[k].length; j++) dom &= allowed(map[k][j]);
        var n = bits(dom);
        if (n < bestN) { best = k; bestDom = dom; bestN = n; if (n === 0) return; }
      }
      if (best < 0) { count++; if (!first) first = Object.assign({}, val); else if (!second) second = Object.assign({}, val); return; }
      var digits = [];
      for (var v = 1; v <= D; v++) if (bestDom & (1 << v)) digits.push(v);
      if (rnd) digits = rnd.shuffle(digits);
      for (var d = 0; d < digits.length; d++) {
        place(best, digits[d], 1);
        rec();
        place(best, digits[d], -1);
        if (count >= limit) return;
      }
    }
    rec();
    // too long a search: report it as unknown so the caller tries another board
    if (nodes > LIMIT) return { count: -1 };
    return { count: count, first: first, second: second };
  }

  function makePuzzle(sp, rnd) {
    // try boards for a short while and keep the one that needs the fewest numbers filled in for us
    var best = null, t0 = Date.now();
    for (var attempt = 0; attempt < 60 && (attempt < 3 || Date.now() - t0 < 1200); attempt++) {
      var pat = makePattern(sp, rnd);
      if (!pat) continue;
      var runs = runsOf(pat.white, pat.R, pat.C);
      var cells = [];
      for (var r = 1; r < pat.R; r++) for (var c = 1; c < pat.C; c++) if (pat.white[r][c]) cells.push(r * pat.C + c);
      var P = { R: pat.R, C: pat.C, white: pat.white, runs: runs, map: cellRuns(runs), cells: cells, dmax: sp.dmax };
      var fill = search(P, {}, 1, rnd).first;
      if (!fill) continue;
      runs.forEach(function (run) { run.sum = run.cells.reduce(function (s, k) { return s + fill[k]; }, 0); });
      var fixed = {};
      var order = rnd.shuffle(cells.slice());
      var want = Math.round(cells.length * sp.givens);
      for (var g = 0; g < want; g++) fixed[order[g]] = fill[order[g]];
      // while there is more than one answer, give away a cell where two answers differ
      var extra = 0;
      for (;;) {
        var res = search(P, fixed, 2);
        if (res.count === -1) { extra = 999; break; }
        if (res.count <= 1) break;
        var other = res.first[order[0]] !== undefined && sameFill(res.first, fill, cells) ? res.second : res.first;
        var diff = cells.filter(function (k) { return other[k] !== fill[k]; });
        var k2 = rnd.pick(diff);
        fixed[k2] = fill[k2]; extra++;
      }
      if (extra === 999) continue;
      P.sol = fill; P.fixed = fixed; P.extra = extra;
      if (!best || extra < best.extra) best = P;
      if (extra <= Math.ceil(cells.length * 0.06)) break;
    }
    return best;
  }
  function sameFill(a, b, cells) { return cells.every(function (k) { return a[k] === b[k]; }); }

  var css = [
    /* the grid is a size container: cell text scales with the real cell size (100cqw / columns) */
    '.kk-grid{display:grid;grid-template-columns:repeat(var(--c),minmax(0,1fr));gap:2px;width:min(100%,30rem);',
    'direction:rtl;background:var(--ink);border:3px solid var(--ink);border-radius:var(--radius-sm);overflow:hidden;container-type:inline-size;}',
    '.kk-cell{aspect-ratio:1;min-width:0;padding:0;border:0;background:var(--surface);color:var(--c-blue);font-family:var(--font-display);font-weight:900;',
    'font-size:calc(100cqw / var(--c) * .58);line-height:1;cursor:pointer;display:grid;place-items:center;}',
    '.kk-cell.is-given{color:var(--ink);background:var(--surface-2);cursor:default;}',
    '.kk-cell.is-sel{background:var(--sun);color:var(--c-on-yellow);}',
    '.kk-cell.is-run{background:var(--c-blue-soft);}',
    '.kk-cell.is-clash{color:var(--c-red);text-decoration:underline;}',
    '.kk-black{aspect-ratio:1;min-width:0;background:var(--ink-soft);position:relative;}',
    /* a clue cell: each sum with an arrow to where it counts — "10◂" for the row to its left, "9▾" for the column below */
    '.kk-clue{background:var(--ink);color:var(--surface);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4%;}',
    '.kk-n{display:flex;align-items:center;gap:.05em;font-weight:900;font-size:calc(100cqw / var(--c) * .4);line-height:1;direction:ltr;white-space:nowrap;}',
    '.kk-n i{font-style:normal;font-size:.9em;color:var(--sun);}',
    '.kk-done .kk-cell{background:var(--good-soft);}',
    /* small numbers (notes): up to 9 little digits in a 3 × 3 pattern, 1 at the top right */
    '.kk-notes{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);width:92%;height:92%;direction:rtl;',
    'font-family:var(--font-body);font-weight:800;font-size:calc(100cqw / var(--c) * .24);line-height:1;color:var(--ink-soft);}',
    '.kk-notes span{display:grid;place-items:center;}',
    '.kk-cell.is-sel .kk-notes{color:var(--c-on-yellow);}',
    '.kk-cell.is-focus{box-shadow:inset 0 0 0 4px var(--c-purple);}',
    '.kk-cell.is-focus-run{background:var(--c-purple-soft);}',
    '.kk-cell.is-bad{box-shadow:inset 0 0 0 4px var(--c-red);}',
    '.kk-pad.is-notes .g-choice{font-size:1rem;color:var(--ink-soft);border-style:dashed;}',
    '.kk-note-btn[aria-pressed="true"]{background:var(--c-purple-soft);border-color:var(--c-purple);color:var(--ink);}',
    '.kk-actions{gap:.3rem;flex-wrap:nowrap;}.kk-actions .btn{padding-inline:.55rem;white-space:nowrap;font-size:.9rem;min-width:0;}',
    '.kk-tip{margin:0;max-width:30rem;font-size:1.05rem;font-weight:700;line-height:1.35;text-align:center;background:var(--c-purple-soft);',
    'border:2px solid var(--c-purple);border-radius:var(--radius-sm);padding:.4rem .7rem;}',
    '.kk-pad{display:grid;grid-template-columns:repeat(var(--k),minmax(0,1fr));gap:.35rem;width:100%;max-width:30rem;}',
    '.kk-pad .g-choice{min-height:2.75rem;font-size:1.45rem;padding:0;}'
  ].join('');

  BrainGames.register({
    id: 'kakuro',
    name: 'קאקורו',
    skill: 'logic',
    isNew: true,
    tagline: 'תשבץ של מספרים: כל שורה וטור מגיעים לסכום',
    benefit: 'חשבון, חשיבה לוגית ותכנון',
    instructions: [
      'במשבצות הכהות כתובים סכומים. החץ מראה לאן הסכום שייך: ◂ למשבצות שמשמאלו באותה שורה, ▾ למשבצות שמתחתיו באותו טור.',
      'מלאו מספרים במשבצות הלבנות כך שכל שורה וכל טור יגיעו לסכום שלהם.',
      'אסור לחזור על אותו מספר באותה שורה או באותו טור. לחצו על משבצת ואז על מספר.',
      'רוצים לרשום אפשרויות? לחצו "✏️ טיוטה" ואז על מספרים, והם ייכתבו קטן במשבצת. "↶ בטלו" מבטל את הצעד האחרון.',
      'תקועים? "רמז" מסמן משבצת ומסביר איך לחשוב עליה, בלי לגלות את התשובה. אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makePuzzle: makePuzzle, search: search },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = sp.h <= 4 ? 3 : sp.h <= 5 ? 2 : 1;
      var move = null; // the arrow keys, for the board on show
      ctx.arrows(function (dx, dy) { if (move) move(dx, dy); });
      var round = 0, solved = 0;
      // clue cells show each sum with an arrow (see css)

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: solved, total: ROUNDS, note: 'פתרתם ' + solved + ' מתוך ' + ROUNDS + (ROUNDS === 1 ? ' לוח' : ' לוחות') });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var P = null;
        for (var t = 0; t < 4 && !P; t++) P = makePuzzle(sp, ctx);
        play(P);
      }

      function play(P) {
        root.innerHTML = '';
        var val = Object.assign({}, P.fixed), sel = -1, hints = 0, done = false;
        var notes = {}, noteMode = false, focus = null; // focus = the hinted cell { k, step, bad }
        var undoStack = []; // { val, notes, sel } before each change, for "בטלו"
        var across = {}, down = {};
        P.runs.forEach(function (run) { (run.dir === 'a' ? across : down)[run.clue] = run.sum; });
        var btn = {}, kids = [];
        for (var r = 0; r < P.R; r++) for (var c = 0; c < P.C; c++) {
          (function (k) {
            if (P.white[r][c]) {
              btn[k] = el('button', { class: 'kk-cell' + (P.fixed[k] ? ' is-given' : ''), type: 'button', onclick: function () { pick(k); } });
              kids.push(btn[k]);
            } else if (across[k] || down[k]) {
              var label = (across[k] ? 'סכום שמאלה ' + across[k] : '') + (down[k] ? ' סכום למטה ' + down[k] : '');
              // ltr inside the span: the arrow sits on the side it points to
              kids.push(el('div', { class: 'kk-black kk-clue', 'aria-label': label }, [
                across[k] ? el('span', { class: 'kk-n a' }, [el('i', null, '◂'), String(across[k])]) : null,
                down[k] ? el('span', { class: 'kk-n d' }, [String(down[k]), el('i', null, '▾')]) : null
              ]));
            } else kids.push(el('div', { class: 'kk-black', 'aria-hidden': 'true' }));
          })(r * P.C + c);
        }
        var grid = el('div', { class: 'kk-grid', style: { '--c': P.C, '--r': P.R } }, kids);
        var pad = el('div', { class: 'kk-pad', style: { '--k': P.dmax >= 8 ? 5 : P.dmax + 1 } });
        for (var v = 1; v <= P.dmax; v++) (function (v) {
          pad.appendChild(el('button', { class: 'g-choice', type: 'button', onclick: function () { put(v); } }, String(v)));
        })(v);
        pad.appendChild(el('button', { class: 'g-choice', type: 'button', 'aria-label': 'מחיקה', onclick: function () { put(0); } }, '⌫'));
        var noteBtn = el('button', { class: 'btn btn-quiet btn-sm kk-note-btn', type: 'button', 'aria-pressed': 'false', onclick: function () {
          noteMode = !noteMode; noteBtn.setAttribute('aria-pressed', String(noteMode)); pad.classList.toggle('is-notes', noteMode);
          ctx.setStatus(noteMode ? 'טיוטה: לחצו על מספר כדי לרשום אותו קטן במשבצת, או למחוק אותו' : 'מלאו מספרים מ-1 עד ' + P.dmax);
        } }, '✏️ טיוטה');
        var hintBtn = el('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: hint }, 'רמז');
        var showBtn = el('button', { class: 'btn btn-quiet btn-sm', type: 'button', onclick: reveal }, 'פתרון');
        var undoBtn = el('button', { class: 'btn btn-quiet btn-sm', type: 'button', onclick: undo }, '↶ בטלו');
        var clearBtn = el('button', { class: 'btn btn-quiet btn-sm', type: 'button', 'aria-label': 'נקו הכול', onclick: clearAll }, 'נקו');
        var actions = el('div', { class: 'g-actions kk-actions' }, [undoBtn, clearBtn, noteBtn, hintBtn, showBtn]);
        var tip = el('p', { class: 'kk-tip', 'aria-live': 'polite', hidden: true });
        root.appendChild(grid); root.appendChild(tip); root.appendChild(pad); root.appendChild(actions);
        ctx.setStatus('בחרו משבצת, ואז מספר');
        sel = -1; // the player picks where to start
        render();

        function clash(k) {
          if (!val[k]) return false;
          return P.map[k].some(function (ri) {
            var run = P.runs[ri];
            if (run.cells.some(function (x) { return x !== k && val[x] === val[k]; })) return true;
            var full = run.cells.every(function (x) { return val[x]; });
            return full && run.cells.reduce(function (s, x) { return s + val[x]; }, 0) !== run.sum;
          });
        }
        function render() {
          var runCells = {};
          if (sel >= 0 && !done) P.map[sel].forEach(function (ri) { P.runs[ri].cells.forEach(function (x) { runCells[x] = true; }); });
          var focusRun = {};
          if (focus && !done) P.map[focus.k].forEach(function (ri) { P.runs[ri].cells.forEach(function (x) { focusRun[x] = true; }); });
          P.cells.forEach(function (k) {
            var b = btn[k];
            b.textContent = val[k] ? String(val[k]) : '';
            if (!val[k] && notes[k] && !done) {
              var box = el('span', { class: 'kk-notes', 'aria-hidden': 'true' });
              for (var d = 1; d <= 9; d++) box.appendChild(el('span', null, notes[k][d] ? String(d) : ''));
              b.appendChild(box);
            }
            b.classList.toggle('is-focus', !!focus && focus.k === k && !done);
            b.classList.toggle('is-focus-run', !!focusRun[k] && !(focus && focus.k === k) && k !== sel);
            b.classList.toggle('is-bad', !!focus && !!focus.bad && focus.k === k && !done);
            b.classList.toggle('is-sel', k === sel && !done);
            b.classList.toggle('is-run', !!runCells[k] && k !== sel);
            b.classList.toggle('is-clash', clash(k));
            b.disabled = done;
          });
          [].forEach.call(pad.children, function (b) { b.disabled = done || sel < 0; });
          hintBtn.disabled = showBtn.disabled = done;
          undoBtn.disabled = done || !undoStack.length;
          clearBtn.disabled = done || !P.cells.some(function (k) { return (val[k] && !P.fixed[k]) || notes[k]; });
        }
        // the arrow keys move the picked square (skipping squares that cannot be picked)
        function stepTo(r0, c0, dr, dc, R, Cn, ok) {
          var r = r0, c = c0;
          for (var k = 0; k < Math.max(R, Cn); k++) { r += dr; c += dc; if (r < 0 || c < 0 || r >= R || c >= Cn) return -1; if (ok(r, c)) return r * Cn + c; }
          return -1;
        }
        move = function (dx, dy) {
          if (done) return;
          var isCell = function (r, c) { var k = r * P.C + c; return P.cells.indexOf(k) !== -1 && !P.fixed[k]; };
          if (sel < 0) { sel = P.cells.filter(function (k) { return !P.fixed[k]; })[0]; render(); return; }
          var to = stepTo(Math.floor(sel / P.C), sel % P.C, dy, -dx, P.R, P.C, isCell); // the board reads right to left
          if (to >= 0) { sel = to; render(); }
        };
        function pick(k) { if (done || P.fixed[k]) return; ctx.sound('tap'); sel = k; render(); }
        function put(v) {
          if (done || sel < 0) return;
          ctx.sound('tap');
          undoStack.push({ val: Object.assign({}, val), notes: JSON.parse(JSON.stringify(notes)), sel: sel });
          if (noteMode && !val[sel]) { // small numbers: write or erase one, or clear them all with ⌫
            if (!v) delete notes[sel];
            else { notes[sel] = notes[sel] || {}; notes[sel][v] = !notes[sel][v]; }
            render(); return;
          }
          if (focus && focus.k === sel) { focus = null; tip.hidden = true; }
          if (v) val[sel] = v; else delete val[sel];
          if (v) { // the number is now used in this row and column: drop it from their small numbers
            P.map[sel].forEach(function (ri) { P.runs[ri].cells.forEach(function (x) { if (notes[x]) notes[x][v] = false; }); });
          }
          // the same cell stays picked: the player chooses where to go next
          render(); check();
        }
        // every number and small number the player wrote goes; the given numbers stay (can be undone)
        function clearAll() {
          if (done) return;
          ctx.sound('tap');
          undoStack.push({ val: Object.assign({}, val), notes: JSON.parse(JSON.stringify(notes)), sel: sel });
          val = Object.assign({}, P.fixed); notes = {};
          focus = null; tip.hidden = true;
          ctx.setStatus('הלוח נוקה. אפשר להתחיל מחדש (או "בטלו")');
          render();
        }
        function undo() {
          if (done || !undoStack.length) return;
          ctx.sound('tap');
          var u = undoStack.pop();
          val = u.val; notes = u.notes; sel = u.sel;
          if (focus && val[focus.k] && !focus.bad) { focus = null; tip.hidden = true; }
          render();
        }
        /* ---------- hints that teach: point at one cell and explain how to work it out, never fill it in ---------- */
        var NAME = { a: 'בשורה', d: 'בטור' };
        // digits that can still go in cell k as far as one run is concerned (only correct numbers count as placed)
        function runOptions(ri, k) {
          var run = P.runs[ri], used = [], empty = 0, rest = run.sum;
          run.cells.forEach(function (x) {
            if (x !== k && val[x] && val[x] === P.sol[x]) { used.push(val[x]); rest -= val[x]; } else empty++;
          });
          var out = [];
          for (var d = 1; d <= P.dmax; d++) {
            if (used.indexOf(d) !== -1) continue;
            if (canFill(empty - 1, rest - d, used.concat([d]), 1)) out.push(d);
          }
          return { opts: out, empty: empty, rest: rest, used: used, run: run };
        }
        function canFill(n, sum, used, from) {
          if (n === 0) return sum === 0;
          for (var d = from; d <= P.dmax; d++) {
            if (used.indexOf(d) !== -1 || d > sum) continue;
            if (canFill(n - 1, sum - d, used.concat([d]), d + 1)) return true;
          }
          return false;
        }
        // the ways to fill a run's empty cells (sorted digit lists, at most 2 are needed), to spot "only one way" sums
        function combos(n, sum, used, from, acc, out) {
          if (n === 0) { if (sum === 0) out.push(acc.slice()); return out; }
          for (var d = from; d <= P.dmax && out.length < 2; d++) {
            if (used.indexOf(d) !== -1 || d > sum) continue;
            acc.push(d); combos(n - 1, sum - d, used, d + 1, acc, out); acc.pop();
          }
          return out;
        }
        function hint() {
          if (done) return;
          // 1. a wrong number comes first: mark it, without saying what is right
          var bad = P.cells.filter(function (x) { return val[x] && val[x] !== P.sol[x]; })[0];
          if (bad !== undefined) {
            hints++;
            focus = { k: bad, step: 1, bad: true }; sel = bad;
            var dup = P.map[bad].some(function (ri) { return P.runs[ri].cells.some(function (x) { return x !== bad && val[x] === val[bad]; }); });
            showTip('המספר ' + val[bad] + ' במשבצת המסומנת באדום לא מתאים. ' +
              (dup ? 'הוא כבר מופיע באותה שורה או באותו טור.' : 'בדקו שוב את הסכום של השורה ושל הטור שלה.') + ' מחקו אותו (⌫) ונסו מספר אחר.');
            render(); return;
          }
          // 2. pressing again on the same cell: list what fits its row and what fits its column
          if (focus && !focus.bad && !val[focus.k] && focus.step === 1) {
            hints++;
            focus.step = 2;
            var infos2 = P.map[focus.k].map(function (ri) { return runOptions(ri, focus.k); });
            var last = infos2.filter(function (o) { return o.empty === 1; })[0];
            if (last) { // one number missing: write out the sum to work out, not the answer
              showTip('חשבו: ' + last.run.sum + (last.used.length ? ' − ' + last.used.join(' − ') : '') + ' = ?');
            } else {
              // a list with a single number would give the answer away: say only how many fit
              showTip(infos2.map(function (o) {
                return o.opts.length === 1 ? NAME[o.run.dir] + ' מתאים רק מספר אחד. איזה?' : NAME[o.run.dir] + ' אפשר רק: ' + o.opts.join(', ');
              }).join('. ') + (infos2.length > 1 ? '. איזה מספר מתאים לשניהם?' : ''));
            }
            render(); return;
          }
          // 3. a new cell: the empty cell with the fewest possible numbers
          var bestK = -1, bestN = 99;
          P.cells.forEach(function (x) {
            if (val[x]) return;
            var set = null;
            P.map[x].forEach(function (ri) {
              var o = runOptions(ri, x).opts;
              set = set ? set.filter(function (d) { return o.indexOf(d) !== -1; }) : o;
            });
            if (set.length < bestN) { bestN = set.length; bestK = x; }
          });
          if (bestK < 0) return;
          hints++;
          focus = { k: bestK, step: 1 }; sel = bestK;
          var infos = P.map[bestK].map(function (ri) { return runOptions(ri, bestK); });
          var one = infos.filter(function (o) { return o.empty === 1; })[0];
          var text;
          if (one) {
            text = 'נסו את המשבצת המסומנת: ' + NAME[one.run.dir] + ' שלה חסר רק מספר אחד. הסכום הוא ' + one.run.sum +
              (one.used.length ? ' וכבר כתוב שם ' + one.used.join(' + ') : '') + '. כמה חסר?';
          } else {
            var uniq = infos.filter(function (o) { return combos(o.empty, o.rest, o.used, 1, [], []).length === 1; })[0];
            if (uniq) {
              var c = combos(uniq.empty, uniq.rest, uniq.used, 1, [], [])[0];
              var other = infos.filter(function (o) { return o !== uniq; })[0];
              text = 'נסו את המשבצת המסומנת. ' + NAME[uniq.run.dir] + ' שלה ' + uniq.empty + ' משבצות ריקות שסכומן ' + uniq.rest +
                ', ויש לזה רק דרך אחת: ' + c.join(' + ') + '.' +
                (other ? ' עכשיו בדקו את ' + (other.run.dir === 'a' ? 'השורה' : 'הטור') + ' שלה: איזה מהמספרים האלה מתאים גם שם?' : '');
            } else {
              text = 'נסו את המשבצת המסומנת. חשבו אילו מספרים מתאימים לשורה שלה ואילו לטור שלה. רק מעט מספרים מתאימים לשניהם.' +
                ' (לחיצה נוספת על "רמז" תראה את האפשרויות)';
            }
          }
          showTip(text);
          render();
        }
        function showTip(t) { tip.textContent = t; tip.hidden = false; ctx.setStatus('רמז'); }
        function reveal() { if (done) return; val = Object.assign({}, P.sol); hints = 99; focus = null; tip.hidden = true; render(); check(); }
        function check() {
          if (P.cells.some(function (k) { return !val[k]; })) return;
          // any filling that meets every sum is right, even if it differs from ours
          var good = P.cells.every(function (k) { return !clash(k); });
          if (!good) { ctx.setStatus('הלוח מלא, אבל יש סכום שלא מסתדר. המספרים האדומים צריכים תיקון'); return; }
          done = true;
          tip.hidden = true; focus = null;
          var ok = hints <= (P.cells.length > 20 ? 3 : 2);
          if (ok) solved++;
          grid.classList.add('kk-done');
          render();
          ctx.setStatus(hints === 99 ? 'זה הפתרון' : ok ? 'מצוין! כל הסכומים נכונים' : 'הלוח פתור, בעזרת רמזים');
          ctx.feedback(ok, hints === 99 ? 'הנה הפתרון' : undefined).then(function () {
            actions.innerHTML = '';
            if (hints !== 99) { ctx.wait(600).then(nextRound); return; } // a correct answer moves on by itself
            var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { next.disabled = true; nextRound(); } },
              round >= ROUNDS ? 'לסיכום' : 'ללוח הבא');
            actions.appendChild(next);
          });
        }
      }

      nextRound();
    }
  });
})();
