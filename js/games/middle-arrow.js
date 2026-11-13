/* החץ האמצעי — which way does the middle arrow point? Untimed flanker task (attention). */
(function () {
  'use strict';

  var TRIALS = 16;

  // Formations: cells as [col, row] offsets from the middle arrow (which is always [0, 0]).
  var FORMS = {
    row3: [[-1, 0], [1, 0]],
    row5: [[-2, 0], [-1, 0], [1, 0], [2, 0]],
    row7: [[-3, 0], [-2, 0], [-1, 0], [1, 0], [2, 0], [3, 0]],
    plus5: [[-1, 0], [1, 0], [0, -1], [0, 1]],
    plus9: [[-2, 0], [-1, 0], [1, 0], [2, 0], [0, -2], [0, -1], [0, 1], [0, 2]],
    x9: [[-2, -2], [-1, -1], [1, 1], [2, 2], [2, -2], [1, -1], [-1, 1], [-2, 2]],
    box9: [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]],
    diamond13: [[-2, 0], [-1, 0], [1, 0], [2, 0], [0, -2], [0, -1], [0, 1], [0, 2], [-1, -1], [1, -1], [-1, 1], [1, 1]]
  };

  // Per level: formation(s), number of directions, share of trials whose surrounding arrows point
  // another way (inc), share of those where they point every which way (mixed), ring around the
  // middle (levels 1–3 only), shift = the formation sits off-centre in a larger field. Nothing is
  // timed: difficulty comes from stronger distraction and a middle that is harder to locate.
  var LEVELS = [
    { forms: ['row3'], dirs: 2, inc: 0.3, mixed: 0, ring: true, shift: false },                         // 1
    { forms: ['row3'], dirs: 2, inc: 0.5, mixed: 0, ring: true, shift: false },                         // 2
    { forms: ['row5'], dirs: 2, inc: 0.5, mixed: 0, ring: true, shift: false },                         // 3
    { forms: ['row5'], dirs: 2, inc: 0.6, mixed: 0, ring: false, shift: false },                        // 4
    { forms: ['row5', 'plus5'], dirs: 4, inc: 0.6, mixed: 0, ring: false, shift: false },               // 5
    { forms: ['plus5', 'plus9'], dirs: 4, inc: 0.65, mixed: 0.2, ring: false, shift: false },           // 6
    { forms: ['plus9', 'row7'], dirs: 4, inc: 0.7, mixed: 0.3, ring: false, shift: false },             // 7
    { forms: ['plus9', 'box9'], dirs: 4, inc: 0.7, mixed: 0.35, ring: false, shift: false },            // 8
    { forms: ['row7', 'box9', 'x9'], dirs: 4, inc: 0.75, mixed: 0.4, ring: false, shift: false },       // 9
    { forms: ['box9', 'x9', 'plus9'], dirs: 4, inc: 0.75, mixed: 0.45, ring: false, shift: true },      // 10
    { forms: ['plus9', 'box9', 'x9'], dirs: 4, inc: 0.8, mixed: 0.5, ring: false, shift: true },        // 11
    { forms: ['row7', 'box9', 'x9'], dirs: 4, inc: 0.8, mixed: 0.5, ring: false, shift: true },         // 12
    { forms: ['plus9', 'box9', 'x9'], dirs: 4, inc: 0.85, mixed: 0.55, ring: false, shift: true },      // 13
    { forms: ['row7', 'box9', 'x9'], dirs: 4, inc: 0.85, mixed: 0.6, ring: false, shift: true },        // 14
    { forms: ['box9', 'x9', 'plus9'], dirs: 4, inc: 0.85, mixed: 0.65, ring: false, shift: true },      // 15
    { forms: ['box9', 'x9', 'diamond13'], dirs: 4, inc: 0.9, mixed: 0.65, ring: false, shift: true },   // 16
    { forms: ['x9', 'diamond13', 'row7'], dirs: 4, inc: 0.9, mixed: 0.7, ring: false, shift: true },    // 17
    { forms: ['box9', 'diamond13'], dirs: 4, inc: 0.9, mixed: 0.7, ring: false, shift: true },          // 18
    { forms: ['diamond13', 'x9'], dirs: 4, inc: 0.95, mixed: 0.75, ring: false, shift: true },          // 19
    { forms: ['diamond13'], dirs: 4, inc: 0.95, mixed: 0.8, ring: false, shift: true },                 // 20
    // 21–30: on some cards (outer) the question flips: which way do the arrows AROUND the middle point?
    { forms: ['diamond13', 'x9'], dirs: 4, inc: 0.95, mixed: 0.8, ring: false, shift: true, outer: 0.15 }, // 21
    { forms: ['diamond13', 'box9'], dirs: 4, inc: 0.95, mixed: 0.8, ring: false, shift: true, outer: 0.2 }, // 22
    { forms: ['diamond13'], dirs: 4, inc: 0.95, mixed: 0.8, ring: false, shift: true, outer: 0.25 }, // 23
    { forms: ['diamond13', 'x9'], dirs: 4, inc: 0.95, mixed: 0.85, ring: false, shift: true, outer: 0.25 }, // 24
    { forms: ['diamond13'], dirs: 4, inc: 0.95, mixed: 0.85, ring: false, shift: true, outer: 0.3 }, // 25
    { forms: ['diamond13', 'box9'], dirs: 4, inc: 1, mixed: 0.85, ring: false, shift: true, outer: 0.3 }, // 26
    { forms: ['diamond13'], dirs: 4, inc: 1, mixed: 0.85, ring: false, shift: true, outer: 0.35 }, // 27
    { forms: ['diamond13', 'x9'], dirs: 4, inc: 1, mixed: 0.9, ring: false, shift: true, outer: 0.35 }, // 28
    { forms: ['diamond13'], dirs: 4, inc: 1, mixed: 0.9, ring: false, shift: true, outer: 0.4 }, // 29
    { forms: ['diamond13'], dirs: 4, inc: 1, mixed: 0.9, ring: false, shift: true, outer: 0.45 }  // 30
  ];

  var FIELD = 7;   // largest field side when the formation is shifted off-centre
  var DIRS = ['left', 'right', 'up', 'down'];
  var PAD_ORDER = ['left', 'up', 'down', 'right']; // one row of buttons, left to right
  var ANGLE = { right: 0, down: 90, left: 180, up: 270 };
  var WORD = { left: 'שמאלה', right: 'ימינה', up: 'למעלה', down: 'למטה' };
  var ARROW = '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
    '<path d="M10 40h46V18l36 32-36 32V60H10z" fill="currentColor"/></svg>';

  function arrowSvg(dir) {
    return '<span class="ma-rot" style="transform:rotate(' + ANGLE[dir] + 'deg)">' + ARROW + '</span>';
  }

  /* One trial. kind: 'same' (all arrows agree), 'opp' (surrounding arrows share another direction)
     or 'mixed' (surrounding arrows point every which way, never like the middle). */
  function makeTrial(spec, kind, rand) {
    rand = rand || Math.random;
    function any(list) { return list[Math.floor(rand() * list.length)]; }
    var dirs = DIRS.slice(0, spec.dirs);
    var mid = any(dirs);
    var others = dirs.filter(function (d) { return d !== mid; });
    var flank = kind === 'same' ? mid : any(others);
    var form = any(spec.forms);
    var cells = FORMS[form];
    // rows of arrows can stand upright at 4-direction levels
    var vertical = /^row/.test(form) && spec.dirs === 4 && rand() < 0.5;
    if (vertical) cells = cells.map(function (c) { return [c[1], c[0]]; });
    var minC = 0, maxC = 0, minR = 0, maxR = 0;
    cells.forEach(function (c) {
      minC = Math.min(minC, c[0]); maxC = Math.max(maxC, c[0]);
      minR = Math.min(minR, c[1]); maxR = Math.max(maxR, c[1]);
    });
    var cols = maxC - minC + 1, rows = maxR - minR + 1;
    var offC = -minC, offR = -minR; // where the middle sits in the grid
    if (spec.shift) {
      var w = Math.min(FIELD, cols + (cols <= 3 ? 2 : 1)), h = Math.min(FIELD, rows + (rows <= 3 ? 2 : 1));
      w = Math.max(w, cols); h = Math.max(h, rows);
      offC += Math.floor(rand() * (w - cols + 1));
      offR += Math.floor(rand() * (h - rows + 1));
      cols = w; rows = h;
    }
    var items = [{ c: offC, r: offR, dir: mid, middle: true }];
    var used = {};
    cells.forEach(function (c) {
      var d = kind === 'mixed' ? any(others) : flank;
      used[d] = true;
      items.push({ c: offC + c[0], r: offR + c[1], dir: d, middle: false });
    });
    // a "mixed" board needs at least two surrounding directions, or it is just 'opp'
    if (kind === 'mixed' && Object.keys(used).length < 2) {
      items[1].dir = others.filter(function (d) { return d !== items[1].dir; })[0];
    }
    return { kind: kind, mid: mid, form: form, vertical: vertical, cols: cols, rows: rows, items: items };
  }

  function makeSession(spec, rand) {
    rand = rand || Math.random;
    var nInc = Math.round(spec.inc * TRIALS);
    var nMixed = spec.dirs === 4 ? Math.round(spec.mixed * nInc) : 0;
    var kinds = [];
    for (var i = 0; i < TRIALS; i++) kinds.push(i < nMixed ? 'mixed' : i < nInc ? 'opp' : 'same');
    for (var k = kinds.length - 1; k > 0; k--) {
      var j = Math.floor(rand() * (k + 1)); var t = kinds[k]; kinds[k] = kinds[j]; kinds[j] = t;
    }
    // "Outer" cards (levels 21+): the surrounding arrows all share one direction, never the middle's.
    var nOuter = Math.round((spec.outer || 0) * TRIALS);
    var slots = [];
    for (var s = 1; s < TRIALS; s++) slots.push(s); // never the first card
    for (var m = slots.length - 1; m > 0; m--) {
      var q = Math.floor(rand() * (m + 1)); var u = slots[m]; slots[m] = slots[q]; slots[q] = u;
    }
    var outer = {};
    slots.slice(0, nOuter).forEach(function (p) { outer[p] = true; kinds[p] = 'opp'; });
    return kinds.map(function (kind, p) {
      var tr = makeTrial(spec, kind, rand);
      if (outer[p]) { tr.outer = true; tr.answer = tr.items[1].dir; } else tr.answer = tr.mid;
      return tr;
    });
  }

  var css = [
    '.ma-field{display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:.3rem;',
    'width:min(100%,calc(var(--cols) * 4.2rem),calc((100svh - 19rem) * var(--cols) / var(--rows)));direction:ltr;}',
    '.ma-cell{aspect-ratio:1;display:grid;place-items:center;color:var(--ink);border-radius:50%;}',
    '.ma-cell .ma-rot{display:block;width:90%;height:90%;}',
    '.ma-cell svg{display:block;width:100%;height:100%;}',
    '.ma-ring{box-shadow:0 0 0 3px var(--attention-soft),inset 0 0 0 2px var(--attention);}',
    '.ma-cell.ma-show{background:var(--sun-soft);box-shadow:0 0 0 3px var(--sun);}',
    '.ma-rule{display:inline-block;padding:.3rem 1rem;border-radius:999px;font-weight:800;font-size:1.1rem;',
    'background:var(--attention-soft);color:var(--attention);border:2px solid var(--attention);}',
    '.ma-rule.is-outer{background:var(--logic-soft);color:var(--logic);border-color:var(--logic);}',
    '.ma-rule.is-changed{box-shadow:0 0 0 4px var(--sun);}',
    '.ma-rule + .ma-field{width:min(100%,calc(var(--cols) * 4.2rem),calc((100svh - 21.5rem) * var(--cols) / var(--rows)));}',
    '.ma-pad{display:grid;gap:.6rem;direction:ltr;width:100%;max-width:20rem;}',
    '.ma-pad2{grid-template-columns:1fr 1fr;}',
    '.ma-pad4{grid-template-columns:repeat(4,1fr);max-width:24rem;}',
    '.ma-btn{min-height:4.4rem;display:grid;place-items:center;padding:.4rem;color:var(--ink);}',
    '.ma-btn .ma-rot{display:block;width:2.6rem;height:2.6rem;}',
    '.ma-btn svg{display:block;width:100%;height:100%;}',
    '.ma-btn.is-correct,.ma-btn.is-wrong{color:inherit;}'
  ].join('');

  BrainGames.register({
    id: 'middle-arrow',
    name: 'החץ האמצעי',
    skill: 'attention',
    tagline: 'לאן מצביע החץ שבאמצע?',
    benefit: 'קשב ממוקד והתעלמות מהסחות',
    instructions: [
      'יופיעו כמה חיצים יחד. הסתכלו רק על החץ שבאמצע.',
      'החיצים מסביב באים להטעות: לפעמים הם מצביעים לכיוון אחר, ולפעמים לכל הכיוונים.',
      'לחצו על הכפתור עם הכיוון של החץ האמצעי. אין שעון, קחו את הזמן.',
      'ברמות הגבוהות לפעמים שואלים דווקא על החיצים שמסביב. קראו את הכלל בכל כרטיס.'
    ],
    css: css,
    _makeSession: makeSession,   // exposed for tests
    _levels: LEVELS,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var trials = makeSession(spec);
      var idx = 0;
      var score = 0;

      function next() {
        if (idx >= trials.length) {
          ctx.finish({
            correct: score,
            total: TRIALS,
            note: spec.outer ? 'עניתם נכון על ' + score + ' מתוך ' + TRIALS + ' כרטיסים'
              : 'זיהיתם נכון את כיוון החץ האמצעי ' + score + ' מתוך ' + TRIALS + ' פעמים'
          });
          return;
        }
        idx++;
        ctx.setProgress(idx, TRIALS);
        play(trials[idx - 1]);
      }

      function play(tr) {
        root.innerHTML = '';
        var prevOuter = idx > 1 && trials[idx - 2].outer;
        ctx.setStatus(tr.outer ? 'שימו לב: לאן מצביעים החיצים שמסביב?' : 'לאן מצביע החץ שבאמצע?');
        var cells = [];
        var byPos = {};
        tr.items.forEach(function (it) { byPos[it.r * tr.cols + it.c] = it; });
        var midCell = null;
        for (var p = 0; p < tr.cols * tr.rows; p++) {
          var it = byPos[p];
          var cls = 'ma-cell';
          if (it && it.middle && spec.ring) cls += ' ma-ring';
          var cell = el('span', { class: cls, html: it ? arrowSvg(it.dir) : '' });
          if (it && it.middle) midCell = cell;
          cells.push(cell);
        }
        var field = el('div', {
          class: 'ma-field', role: 'img', style: { '--cols': String(tr.cols), '--rows': String(tr.rows) },
          'aria-label': 'חיצים. החץ האמצעי מצביע ' + WORD[tr.mid]
        }, cells);

        var dirs = spec.dirs === 4 ? PAD_ORDER : DIRS.slice(0, 2);
        var buttons = {};
        var btns = dirs.map(function (d) {
          var b = el('button', {
            class: 'g-choice ma-btn', type: 'button', 'aria-label': WORD[d],
            html: arrowSvg(d),
            onclick: function () { answer(d); }
          });
          buttons[d] = b;
          return b;
        });
        var pad = el('div', { class: 'ma-pad ma-pad' + spec.dirs }, btns);
        if (spec.outer) {
          root.appendChild(el('span', {
            class: 'ma-rule' + (tr.outer ? ' is-outer' : '') + (!!tr.outer !== !!prevOuter ? ' is-changed' : '')
          }, tr.outer ? 'הכלל: החיצים שמסביב' : 'הכלל: החץ שבאמצע'));
        }
        root.appendChild(field);
        root.appendChild(pad);

        function answer(d) {
          btns.forEach(function (b) { b.disabled = true; });
          var ok = d === tr.answer;
          if (ok) {
            score++;
            buttons[d].classList.add('is-correct');
            ctx.sound('good');
            ctx.wait(700).then(next);
            return;
          }
          buttons[d].classList.add('is-wrong');
          buttons[tr.answer].classList.add('is-correct');
          if (tr.outer) {
            ctx.setStatus('הפעם שאלנו על החיצים שמסביב');
          } else {
            midCell.classList.add('ma-show');
            ctx.setStatus('החץ האמצעי מסומן בצהוב');
          }
          ctx.feedback(false, tr.outer ? 'החיצים שמסביב הצביעו ' + WORD[tr.answer] : 'החץ האמצעי הצביע ' + WORD[tr.mid]).then(function () {
            return ctx.wait(900);
          }).then(next);
        }
      }

      next();
    }
  });
})();
