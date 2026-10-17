/*
 * מצאו את ההבדל — two emoji grids that differ in exactly one cell.
 */
(function () {
  'use strict';

  var ROUNDS = 8;

  function clampLevel(l) {
    l = Math.round(Number(l));
    if (!isFinite(l)) l = 3;
    return Math.max(1, Math.min(20, l));
  }

  /* [rows, cols] per level (index = level). */
  var SIZES = [null,
    [2, 3], [3, 3], [3, 3], [3, 4], [3, 4],
    [4, 4], [4, 4], [4, 4], [4, 5], [4, 5],
    [5, 5], [5, 5], [5, 5], [5, 5], [5, 5],
    [5, 5], [5, 5], [5, 5], [5, 5], [5, 5]];

  /* Which kinds of change can appear at each level (similarity rises with level). */
  function kindsFor(L) {
    if (L <= 3) return ['far'];
    if (L === 4) return ['far', 'family'];
    if (L <= 7) return ['family'];
    if (L <= 9) return ['family', 'twin'];
    if (L <= 11) return ['twin', 'rot180'];
    if (L <= 13) return ['twin', 'rot180', 'mirror'];
    if (L <= 15) return ['twin', 'mirror', 'rot90'];
    return ['subtle', 'mirror', 'rot90'];
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
    var a, b, cellsA, transform = '', explain, from, to;

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
      var distinct = L >= 16 ? R.randInt(4, 6) : L >= 14 ? R.randInt(7, 10) : n;
      var some = R.shuffle(src).slice(0, Math.min(distinct, src.length));
      cellsA = L >= 14 ? fillRepeat(some, n, R) : fillDistinct(some, n, R);
      from = to = cellsA[target];
      if (kind === 'mirror') { transform = 'scaleX(-1)'; explain = from + ' הפוך, כמו בראי'; }
      else if (kind === 'rot180') { transform = 'rotate(180deg)'; explain = from + ' עומד על הראש (הפוך)'; }
      else { transform = R.randInt(0, 1) ? 'rotate(90deg)' : 'rotate(-90deg)'; explain = from + ' שוכב על הצד'; }
    }

    var cellsB = cellsA.slice();
    cellsB[target] = to;
    return {
      kind: kind, rows: rows, cols: cols, target: target,
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
      'בכל סיבוב יש הבדל אחד בלבד: פרט שהוחלף, הפוך או מסובב.',
      'לחצו על המשבצת השונה, באחת משתי התמונות.',
      'אין שעון. סרקו בנחת, שורה אחרי שורה.'
    ],
    css: [
      '.sd-wrap{display:flex;flex-wrap:wrap;justify-content:center;gap:16px;width:100%}',
      '.sd-panel{display:flex;flex-direction:column;align-items:center;gap:6px;padding:8px;border-radius:var(--radius);',
      'background:var(--surface-2);border:1px solid var(--line);max-width:100%}',
      '.sd-label{font-weight:800;font-size:1.1rem;color:var(--ink)}',
      '.sd-grid{display:grid;grid-template-columns:repeat(var(--cols),var(--sd-t));gap:4px;direction:ltr}',
      '.sd-tile{width:var(--sd-t);height:var(--sd-t);min-width:40px;min-height:40px;border-radius:var(--radius-sm);',
      'border:2px solid var(--line);background:var(--surface);color:var(--ink);display:grid;place-items:center;',
      'padding:0;cursor:pointer;font-size:calc(var(--sd-t) * .58);line-height:1;transition:background-color .2s,border-color .2s}',
      '.sd-tile:hover:not(:disabled){border-color:var(--attention)}',
      '.sd-tile:disabled{cursor:default}',
      '.sd-tile.is-correct{background:var(--good-soft);border-color:var(--good);border-width:3px}',
      '.sd-tile.is-wrong{background:var(--bad-soft);border-color:var(--bad);border-width:3px}',
      '.sd-emo{display:inline-block;font-family:"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif}',
      '.sd-explain{font-size:1.2rem;font-weight:700;text-align:center;background:var(--sun-soft);color:var(--ink);',
      'padding:.8rem 1.1rem;border-radius:var(--radius);max-width:100%;text-wrap:balance}',
      '.sd-after{display:flex;flex-direction:column;align-items:center;gap:.75rem;width:100%}',
      '.sd-after:empty{display:none}'
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
        ctx.setStatus('מצאו את המשבצת השונה ולחצו עליה');
        var q = makeQuestion(ctx.level, ctx, prevKind);
        prevKind = q.kind;

        root.innerHTML = '';
        var maxT = q.cols <= 3 ? 64 : q.cols === 4 ? 58 : 52;
        var tile = 'min(' + maxT + 'px, calc((100vw - 120px) / ' + q.cols + '))';
        var wrap = ctx.el('div', { class: 'sd-wrap', style: { '--sd-t': tile } });
        var tiles = { a: [], b: [] };
        var answered = false;

        function panel(which, label, cells) {
          var grid = ctx.el('div', { class: 'sd-grid', dir: 'ltr', style: { '--cols': q.cols } });
          cells.forEach(function (emo, i) {
            var r = Math.floor(i / q.cols) + 1, c = (i % q.cols) + 1;
            var span = ctx.el('span', { class: 'sd-emo', 'aria-hidden': 'true' }, emo);
            if (which === 'b' && i === q.target && q.transform) span.style.transform = q.transform;
            var t = ctx.el('button', {
              class: 'sd-tile', type: 'button',
              'aria-label': label + ', שורה ' + r + ', משבצת ' + c,
              onclick: function () { choose(i, which); }
            }, span);
            tiles[which].push(t);
            grid.appendChild(t);
          });
          return ctx.el('div', { class: 'sd-panel' }, [ctx.el('div', { class: 'sd-label' }, label), grid]);
        }

        wrap.appendChild(panel('a', 'תמונה א', q.a));
        wrap.appendChild(panel('b', 'תמונה ב', q.b));
        root.appendChild(wrap);
        var after = ctx.el('div', { class: 'sd-after', 'aria-live': 'polite' });
        root.appendChild(after);

        function choose(i, which) {
          if (answered) return;
          answered = true;
          tiles.a.concat(tiles.b).forEach(function (t) { t.disabled = true; });
          tiles.a[q.target].classList.add('is-correct');
          tiles.b[q.target].classList.add('is-correct');
          var ok = i === q.target;
          if (ok) correct++;
          else tiles[which][i].classList.add('is-wrong');
          var where = 'שורה ' + q.row + ', משבצת ' + q.col + ' משמאל';
          after.appendChild(ctx.el('p', { class: 'sd-explain' },
            (ok ? 'נכון! ' : 'ההבדל מסומן בירוק. ') + 'בתמונה ב: ' + q.explain + ' (' + where + ').'));
          var nextBtn = ctx.el('button', {
            class: 'btn btn-primary btn-lg', type: 'button',
            onclick: function () { nextBtn.disabled = true; nextRound(); }
          }, round >= ROUNDS ? 'לסיכום' : 'לתמונה הבאה');
          after.appendChild(nextBtn);
          ctx.feedback(ok, ok ? 'נכון! מצאתם את ההבדל' : 'ההבדל מסומן בירוק');
          ctx.wait(50).then(function () { try { nextBtn.focus({ preventScroll: true }); } catch (e) { /* ignore */ } });
        }
      }

      nextRound();
    }
  });
})();
