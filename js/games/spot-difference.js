/*
 * מצאו את ההבדל — two emoji grids that differ in exactly one cell.
 */
(function () {
  'use strict';

  var ROUNDS = 8;

  function clampLevel(l) {
    l = Math.round(Number(l));
    if (!isFinite(l)) l = 3;
    return Math.max(1, Math.min(50, l));
  }

  /* [rows, cols] per level (index = level). */
  /* [rows, cols] per level (index = level): from level 4 a 3 × 4 picture. Kept small in count so that on a phone
     both pictures fit one screen with big tiles (older eyes); difficulty keeps rising through ever more similar
     changes (see kindsFor). */
  var SIZES = [null, [2, 3], [3, 3], [3, 3]];
  for (var lv = 4; lv <= 50; lv++) SIZES.push([3, 4]);

  /* Which kinds of change can appear at each level (similarity rises with level). */
  function kindsFor(L) {
    if (L <= 3) return ['far'];
    if (L === 4) return ['far', 'family'];
    if (L <= 7) return ['family'];
    if (L <= 9) return ['family', 'twin'];
    if (L <= 11) return ['twin', 'rot180'];
    if (L <= 13) return ['twin', 'rot180', 'mirror'];
    if (L <= 15) return ['twin', 'mirror', 'rot90'];
    if (L <= 20) return ['subtle', 'mirror', 'rot90'];
    // 21–30: two pictures trade places ('swap'), or one is only slightly tilted ('tilt')
    if (L <= 22) return ['subtle', 'mirror', 'rot90', 'swap'];
    if (L <= 25) return ['subtle', 'swap', 'mirror', 'tilt'];
    if (L <= 30) return ['subtle', 'swap', 'tilt'];
    // 31–50: one picture slightly smaller ('size'); two near-identical pictures trade places ('swapsub');
    // from 46 the grid holds only two near-identical pictures ('subtle2'). Tilt and size get subtler.
    if (L <= 35) return ['subtle', 'swap', 'tilt', 'size'];
    if (L <= 45) return ['subtle', 'swapsub', 'tilt', 'size'];
    return ['subtle2', 'swapsub', 'tilt', 'size'];
  }
  function tiltDeg(L) { return L >= 46 ? 12 : L >= 41 ? 14 : L >= 31 ? 16 : L >= 28 ? 20 : 30; }
  function sizeScale(L) { return L >= 46 ? 0.85 : L >= 41 ? 0.83 : 0.8; }

  // a neighbour of `target` with a different picture, or -1
  function swapNeighbour(cells, target, cols, n, R) {
    var nbs = [];
    if (target % cols > 0) nbs.push(target - 1);
    if (target % cols < cols - 1) nbs.push(target + 1);
    if (target >= cols) nbs.push(target - cols);
    if (target + cols < n) nbs.push(target + cols);
    nbs = nbs.filter(function (k) { return cells[k] !== cells[target]; });
    return nbs.length ? R.pick(nbs) : -1;
  }

  var FAMILIES = [
    ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒', '🍑', '🍍', '🥝'],
    ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵'],
    ['🚗', '🚕', '🚙', '🚌', '🚓', '🚑', '🚒', '🚜', '🚲', '🛵', '🚂', '🚀'],
    ['🌸', '🌻', '🌼', '🌷', '🌹', '🌵', '🌲', '🌳', '🍀', '🍁', '🍄', '🌴'],
    ['🍕', '🍔', '🍟', '🌭', '🍩', '🍪', '🎂', '🍰', '🍦', '🧀', '🥐', '🍞'],
    ['⚽', '🏀', '🎈', '🎁', '🔔', '🎸', '🎺', '📷', '💡', '🔑', '⏰', '🎩']
  ];

  /* Look-alike pairs. */
  var TWINS = [
    ['🍎', '🍅'], ['🍏', '🍐'], ['🌸', '🌺'], ['🌼', '🌻'], ['🚗', '🚙'], ['🚌', '🚎'],
    ['🐭', '🐹'], ['🐯', '🦁'], ['📕', '📗'], ['🍪', '🍩'], ['🍦', '🍧'], ['🌕', '🌝'],
    ['⚽', '🏐'], ['🐻', '🐨'], ['🍋', '🍌'], ['🚓', '🚑'], ['🎂', '🍰'], ['🐮', '🐷']
  ];

  /* Ordered groups of near-identical emoji; a swap uses a neighbour in the list. */
  var SUBTLE = [
    ['😀', '😃', '😄', '😁', '😆'],
    ['🙂', '😊', '😌', '😐', '😑'],
    ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'],
    ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'],
    ['💙', '💜', '💚', '💛', '🧡'],
    ['📕', '📙', '📒', '📗', '📘'],
    ['🔴', '🟠', '🟡', '🟢', '🔵', '🟣']
  ];

  /* Side-profile emoji: clearly change when mirrored. */
  var DIRECTIONAL = ['🐟', '🐠', '🐌', '🦆', '🐓', '🐘', '🦒', '🐎', '🐕', '🐈', '🐢', '🐊',
    '🐇', '🦔', '🚗', '🚕', '🚌', '🚲', '🛵', '🚜', '🚚', '🚂', '🦜', '🐁'];
  /* Emoji that clearly change when turned. */
  var ROTATABLE = DIRECTIONAL.concat(['🍌', '🍐', '🌵', '🍄', '🌲', '🎈', '🔔', '🔑', '🍦', '🏠', '🚀', '🥕']);

  function familyOf(e) {
    for (var i = 0; i < FAMILIES.length; i++) if (FAMILIES[i].indexOf(e) !== -1) return i;
    return -1;
  }

  function fillDistinct(pool, n, R) {
    var out = [];
    while (out.length < n) out = out.concat(R.shuffle(pool));
    return out.slice(0, n);
  }

  function fillRepeat(pool, n, R) {
    var out = [];
    for (var i = 0; i < n; i++) out.push(R.pick(pool));
    return out;
  }

  function makeQuestion(level, R, prevKind) {
    var L = clampLevel(level);
    var size = SIZES[L];
    var rows = size[0], cols = size[1], n = rows * cols;
    var kinds = kindsFor(L);
    var kind = R.pick(kinds);
    var tries = 0;
    while (kinds.length > 1 && kind === prevKind && tries++ < 10) kind = R.pick(kinds);
    var target = R.randInt(0, n - 1);
    var a, b, cellsA, transform = '', explain, from, to, target2 = -1;

    if (kind === 'far' || kind === 'family') {
      var fams = R.shuffle(FAMILIES.map(function (f, i) { return i; }));
      var useF = fams.slice(0, L <= 3 ? 2 : 3);
      var pool = [];
      useF.forEach(function (fi) { pool = pool.concat(FAMILIES[fi]); });
      cellsA = fillDistinct(pool, n, R);
      from = cellsA[target];
      var fam = familyOf(from);
      var cand;
      if (kind === 'far') {
        cand = [];
        fams.forEach(function (fi) { if (useF.indexOf(fi) === -1) cand = cand.concat(FAMILIES[fi]); });
      } else {
        cand = FAMILIES[fam].filter(function (e) { return e !== from && cellsA.indexOf(e) === -1; });
        if (!cand.length) cand = FAMILIES[fam].filter(function (e) { return e !== from; });
      }
      to = R.pick(cand);
      explain = from + ' הוחלף ב־' + to;
    } else if (kind === 'twin') {
      var pair = R.shuffle(R.pick(TWINS).slice());
      var mixed = [];
      FAMILIES.forEach(function (f) { mixed = mixed.concat(f); });
      mixed = mixed.filter(function (e) { return e !== pair[0] && e !== pair[1]; });
      cellsA = fillDistinct(mixed, n, R);
      from = pair[0]; to = pair[1];
      cellsA[target] = from;
      explain = from + ' הוחלף ב־' + to + ' שדומה לו';
    } else if (kind === 'swap') {
      // two neighbouring, different pictures trade places
      var swapPool = R.shuffle(R.pick(FAMILIES)).slice(0, R.randInt(5, 7));
      for (var sw = 0; sw < 50; sw++) {
        cellsA = fillRepeat(swapPool, n, R);
        var nbs = [];
        if (target % cols > 0) nbs.push(target - 1);
        if (target % cols < cols - 1) nbs.push(target + 1);
        if (target >= cols) nbs.push(target - cols);
        if (target + cols < n) nbs.push(target + cols);
        nbs = nbs.filter(function (k) { return cellsA[k] !== cellsA[target]; });
        if (nbs.length) { target2 = R.pick(nbs); break; }
      }
      if (target2 < 0) { target2 = target === 0 ? 1 : target - 1; cellsA[target2] = swapPool[0] === cellsA[target] ? swapPool[1] : swapPool[0]; }
      from = cellsA[target]; to = cellsA[target2];
      explain = from + ' ו־' + to + ' החליפו מקומות';
    } else if (kind === 'swapsub') {
      // two neighbouring near-identical pictures trade places
      var sg = R.pick(SUBTLE), st = R.randInt(0, sg.length - 3);
      var subPool = sg.slice(st, st + 3);
      for (var sw2 = 0; sw2 < 50; sw2++) {
        cellsA = fillRepeat(subPool, n, R);
        target2 = swapNeighbour(cellsA, target, cols, n, R);
        if (target2 >= 0) break;
      }
      if (target2 < 0) { target2 = target === 0 ? 1 : target - 1; cellsA[target2] = subPool[0] === cellsA[target] ? subPool[1] : subPool[0]; }
      from = cellsA[target]; to = cellsA[target2];
      explain = from + ' ו־' + to + ' החליפו מקומות';
    } else if (kind === 'subtle2') {
      // only two near-identical pictures on the whole grid; one cell shows the other one
      var g2 = R.pick(SUBTLE), i2 = R.randInt(0, g2.length - 2);
      var two = R.shuffle([g2[i2], g2[i2 + 1]]);
      cellsA = fillRepeat(two, n, R);
      from = cellsA[target];
      to = from === two[0] ? two[1] : two[0];
      explain = from + ' הוחלף ב־' + to + ' שנראה כמעט אותו דבר';
    } else if (kind === 'subtle') {
      var grp = R.pick(SUBTLE);
      cellsA = fillRepeat(grp, n, R);
      from = cellsA[target];
      var idx = grp.indexOf(from);
      var nb = [];
      if (idx > 0) nb.push(grp[idx - 1]);
      if (idx < grp.length - 1) nb.push(grp[idx + 1]);
      to = R.pick(nb);
      explain = from + ' הוחלף ב־' + to + ' שנראה כמעט אותו דבר';
    } else {
      var src = kind === 'mirror' ? DIRECTIONAL : ROTATABLE;
      var distinct = L >= 41 ? R.randInt(3, 4) : L >= 16 ? R.randInt(4, 6) : L >= 14 ? R.randInt(7, 10) : n;
      var some = R.shuffle(src).slice(0, Math.min(distinct, src.length));
      cellsA = L >= 14 ? fillRepeat(some, n, R) : fillDistinct(some, n, R);
      from = to = cellsA[target];
      if (kind === 'mirror') { transform = 'scaleX(-1)'; explain = from + ' הפוך, כמו בראי'; }
      else if (kind === 'rot180') { transform = 'rotate(180deg)'; explain = from + ' עומד על הראש (הפוך)'; }
      else if (kind === 'size') { transform = 'scale(' + sizeScale(L) + ')'; explain = from + ' קטן יותר משאר התמונות'; }
      else if (kind === 'tilt') {
        var deg = tiltDeg(L);
        transform = 'rotate(' + (R.randInt(0, 1) ? deg : -deg) + 'deg)'; explain = from + ' מוטה קצת הצידה';
      }
      else { transform = R.randInt(0, 1) ? 'rotate(90deg)' : 'rotate(-90deg)'; explain = from + ' שוכב על הצד'; }
    }

    var cellsB = cellsA.slice();
    cellsB[target] = to;
    if (target2 >= 0) cellsB[target2] = from;
    return {
      kind: kind, rows: rows, cols: cols, target: target, target2: target2,
      a: cellsA, b: cellsB, transform: transform, explain: explain,
      row: Math.floor(target / cols) + 1, col: (target % cols) + 1
    };
  }

  BrainGames.register({
    id: 'spot-difference',
    name: 'מצאו את ההבדל',
    skill: 'attention',
    tagline: 'שתי תמונות כמעט זהות. מה השתנה?',
    benefit: 'קשב לפרטים וסריקה חזותית מסודרת',
    instructions: [
      'השוו בין תמונה א לתמונה ב, משבצת אחרי משבצת.',
      'בכל סיבוב יש הבדל אחד בלבד: פרט שהוחלף, הפוך, מסובב, קטן יותר, או שני פרטים שהחליפו מקומות.',
      'לחצו על המשבצת השונה בתמונה ב (התחתונה).',
      'אין שעון. סרקו בנחת, שורה אחרי שורה.'
    ],
    css: [
      '.sd-wrap{display:flex;flex-direction:column;align-items:center;gap:.6rem;width:100%}',
      /* both pictures the same, big size; a short label above each */
      '.sd-panel{display:flex;flex-direction:column;align-items:center;gap:2px;max-width:100%;padding:2px 4px 4px;border-radius:var(--radius);border:1px solid var(--line)}',
      '.sd-panel-a{background:var(--surface-2)}',
      '.sd-label{font-weight:800;font-size:1rem;color:var(--ink);line-height:1.25;text-align:center}',
      '.sd-grid{display:grid;grid-template-columns:repeat(var(--cols),var(--sd-t));gap:5px;direction:ltr}',
      /* a computer screen: the two pictures side by side */
      '.sd-grid{--sd-t:var(--tp)}',
      '@media (min-width:760px){.sd-wrap{flex-direction:row;justify-content:center;align-items:center;gap:1.2rem}.sd-grid{--sd-t:var(--tw)}}',
      '.sd-next{font-size:1.2rem;padding-inline:2rem}',
      '.sd-tile{width:var(--sd-t);height:var(--sd-t);border-radius:var(--radius-sm);',
      'border:2px solid var(--line);background:var(--surface);color:var(--ink);display:grid;place-items:center;',
      'padding:0;cursor:pointer;font-size:calc(var(--sd-t) * .64);line-height:1;transition:background-color .2s,border-color .2s}',
      '.sd-panel-a .sd-tile{cursor:default;border-width:1px}',
      '.sd-tile:hover:not(:disabled):not(div){border-color:var(--attention)}',
      '.sd-tile:disabled{cursor:default}',
      '.sd-tile.is-correct{background:var(--good-soft);border-color:var(--good);border-width:3px}',
      '.sd-tile.is-wrong{background:var(--bad-soft);border-color:var(--bad);border-width:3px}',
      '.sd-emo{display:inline-block;font-family:"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif}'
    ].join(''),
    generate: makeQuestion,
    start: function (root, ctx) {
      var round = 0;
      var correct = 0;
      var prevKind = null;

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: correct, total: ROUNDS, note: 'מצאתם ' + correct + ' הבדלים מתוך ' + ROUNDS + '.' });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        ctx.setStatus('מה השתנה? לחצו עליו בתמונה ב');
        var q = makeQuestion(ctx.level, ctx, prevKind);
        prevKind = q.kind;

        root.innerHTML = '';
        // Picture A is look-only and compact; only picture B is tapped, with big tiles.
        // one tile size for both pictures: as big as the width and the height of the screen allow
        var tileP = 'min(' + (q.cols <= 3 ? 96 : 90) + 'px, calc((100vw - 4.3rem - ' + (q.cols - 1) * 5 + 'px) / ' + q.cols + '), max(calc((100svh - 19.5rem) / ' + (2 * q.rows) + ' - 5px), 52px))';
        // side by side on a computer: the height of one picture and half the width
        var tileW = 'min(100px, calc((100svh - 16rem) / ' + q.rows + ' - 5px), calc((min(100vw, 46rem) - 9rem - ' + (2 * q.cols) * 5 + 'px) / ' + (2 * q.cols) + '))';
        var wrap = ctx.el('div', { class: 'sd-wrap' });
        var tiles = { a: [], b: [] };
        var answered = false;

        function panel(which, label, cells) {
          var grid = ctx.el('div', { class: 'sd-grid', dir: 'ltr', style: { '--cols': q.cols, '--tp': tileP, '--tw': tileW } });
          cells.forEach(function (emo, i) {
            var r = Math.floor(i / q.cols) + 1, c = (i % q.cols) + 1;
            var span = ctx.el('span', { class: 'sd-emo', 'aria-hidden': 'true' }, emo);
            if (which === 'b' && i === q.target && q.transform) span.style.transform = q.transform;
            var t = which === 'a'
              ? ctx.el('div', { class: 'sd-tile' }, span)
              : ctx.el('button', {
                class: 'sd-tile', type: 'button',
                'aria-label': label + ', שורה ' + r + ', משבצת ' + c,
                onclick: function () { choose(i); }
              }, span);
            tiles[which].push(t);
            grid.appendChild(t);
          });
          var lab = ctx.el('div', { class: 'sd-label' }, label);
          return ctx.el('div', { class: 'sd-panel sd-panel-' + which, role: which === 'a' ? 'img' : null, 'aria-label': which === 'a' ? label : null }, [lab, grid]);
        }

        wrap.appendChild(panel('a', 'תמונה א', q.a));
        wrap.appendChild(panel('b', 'תמונה ב', q.b));
        root.appendChild(wrap);

        function choose(i) {
          if (answered) return;
          answered = true;
          tiles.b.forEach(function (t) { t.disabled = true; });
          tiles.a[q.target].classList.add('is-correct');
          tiles.b[q.target].classList.add('is-correct');
          if (q.target2 >= 0) {
            tiles.a[q.target2].classList.add('is-correct');
            tiles.b[q.target2].classList.add('is-correct');
          }
          var ok = i === q.target || i === q.target2;
          if (ok) correct++;
          else tiles.b[i].classList.add('is-wrong');
          // Explanation goes to the status line + toast; the board only gains the next button.
          ctx.setStatus((ok ? 'נכון! ' : '') + q.explain);
          var nextBtn = ctx.el('button', {
            class: 'btn btn-primary sd-next', type: 'button',
            onclick: function () { nextBtn.disabled = true; nextRound(); }
          }, round >= ROUNDS ? 'לסיכום' : 'לתמונה הבאה');
          root.appendChild(nextBtn);
          ctx.feedback(ok, ok ? 'נכון! מצאתם את ההבדל' : 'ההבדל מסומן בירוק');
          // a correct answer moves on by itself after the toast; after a mistake the button waits
          if (ok) { nextBtn.hidden = true; ctx.wait(2300).then(function () { if (!nextBtn.disabled) { nextBtn.disabled = true; nextRound(); } }); }
          ctx.wait(50).then(function () { try { nextBtn.focus({ preventScroll: true }); } catch (e) { /* ignore */ } });
        }
      }

      nextRound();
    }
  });
})();
