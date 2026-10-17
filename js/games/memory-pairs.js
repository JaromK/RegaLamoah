/* זוגות — classic card-flip matching (memory). */
(function () {
  'use strict';

  // Picture families. Same-family cards look more alike, so they are used to make
  // a level harder without adding cards.
  var FAMILIES = {
    food: [
      { e: '🍎', n: 'תפוח' }, { e: '🍌', n: 'בננה' }, { e: '🍇', n: 'ענבים' }, { e: '🍓', n: 'תות' },
      { e: '🍉', n: 'אבטיח' }, { e: '🍋', n: 'לימון' }, { e: '🍐', n: 'אגס' }, { e: '🥕', n: 'גזר' },
      { e: '🍒', n: 'דובדבנים' }, { e: '🍑', n: 'אפרסק' }, { e: '🍍', n: 'אננס' }, { e: '🥝', n: 'קיווי' },
      { e: '🍊', n: 'תפוז' }, { e: '🥒', n: 'מלפפון' }, { e: '🍅', n: 'עגבנייה' }, { e: '🌽', n: 'תירס' }
    ],
    animals: [
      { e: '🐶', n: 'כלב' }, { e: '🐱', n: 'חתול' }, { e: '🐟', n: 'דג' }, { e: '🐦', n: 'ציפור' },
      { e: '🐢', n: 'צב' }, { e: '🐘', n: 'פיל' }, { e: '🦋', n: 'פרפר' }, { e: '🐴', n: 'סוס' },
      { e: '🐄', n: 'פרה' }, { e: '🐑', n: 'כבשה' }, { e: '🐰', n: 'ארנב' }, { e: '🦁', n: 'אריה' },
      { e: '🐸', n: 'צפרדע' }, { e: '🐔', n: 'תרנגולת' }, { e: '🦒', n: "ג'ירפה" }, { e: '🐝', n: 'דבורה' }
    ],
    home: [
      { e: '🔑', n: 'מפתח' }, { e: '☂️', n: 'מטרייה' }, { e: '⏰', n: 'שעון מעורר' }, { e: '☕', n: 'כוס קפה' },
      { e: '💡', n: 'נורה' }, { e: '📚', n: 'ספרים' }, { e: '🪑', n: 'כיסא' }, { e: '🏠', n: 'בית' },
      { e: '✂️', n: 'מספריים' }, { e: '🎈', n: 'בלון' }, { e: '📞', n: 'טלפון' }, { e: '🕯️', n: 'נר' },
      { e: '🧦', n: 'גרביים' }, { e: '👓', n: 'משקפיים' }, { e: '🎁', n: 'מתנה' }, { e: '🔔', n: 'פעמון' }
    ]
  };
  var BASE = ['food', 'animals', 'home'];

  // Look-alike sets: same shape, small differences.
  var LOOKALIKE = [
    [
      { e: '😀', n: 'פרצוף מחייך' }, { e: '😃', n: 'פרצוף מחייך בעיניים גדולות' }, { e: '😄', n: 'פרצוף צוחק' },
      { e: '😁', n: 'פרצוף עם שיניים' }, { e: '😆', n: 'פרצוף צוחק בעיניים עצומות' }, { e: '😊', n: 'פרצוף נבוך' },
      { e: '🙂', n: 'חיוך קטן' }, { e: '😉', n: 'פרצוף קורץ' }, { e: '😍', n: 'פרצוף מאוהב' },
      { e: '😎', n: 'פרצוף עם משקפי שמש' }, { e: '😮', n: 'פרצוף מופתע' }, { e: '😢', n: 'פרצוף בוכה' }
    ],
    [
      { e: '🔴', n: 'עיגול אדום' }, { e: '🟠', n: 'עיגול כתום' }, { e: '🟡', n: 'עיגול צהוב' }, { e: '🟢', n: 'עיגול ירוק' },
      { e: '🔵', n: 'עיגול כחול' }, { e: '🟣', n: 'עיגול סגול' }, { e: '🟤', n: 'עיגול חום' }, { e: '⚫', n: 'עיגול שחור' },
      { e: '🟥', n: 'ריבוע אדום' }, { e: '🟧', n: 'ריבוע כתום' }, { e: '🟨', n: 'ריבוע צהוב' }, { e: '🟩', n: 'ריבוע ירוק' },
      { e: '🟦', n: 'ריבוע כחול' }, { e: '🟪', n: 'ריבוע סגול' }, { e: '🟫', n: 'ריבוע חום' }, { e: '⬛', n: 'ריבוע שחור' }
    ]
  ];

  // Per level (1–20): number of pairs + how alike the pictures are.
  // mix: 0 = mixed families, 1 = two families, 2 = one family, 3 = look-alikes, 'word' = picture + its name.
  var LEVELS = [
    { pairs: 3, mix: 0 },  // 1
    { pairs: 3, mix: 2 },  // 2
    { pairs: 4, mix: 0 },  // 3
    { pairs: 4, mix: 1 },  // 4
    { pairs: 4, mix: 2 },  // 5
    { pairs: 6, mix: 0 },  // 6
    { pairs: 6, mix: 1 },  // 7
    { pairs: 6, mix: 2 },  // 8
    { pairs: 6, mix: 3 },  // 9
    { pairs: 8, mix: 0 },  // 10
    { pairs: 8, mix: 1 },  // 11
    { pairs: 8, mix: 2 },  // 12
    { pairs: 8, mix: 3 },  // 13
    { pairs: 10, mix: 0 }, // 14
    { pairs: 10, mix: 1 }, // 15
    { pairs: 10, mix: 2 }, // 16
    { pairs: 12, mix: 0 }, // 17
    { pairs: 12, mix: 1 }, // 18
    { pairs: 12, mix: 2 }, // 19
    { pairs: 12, mix: 'word' } // 20
  ];

  var MIN_TAP = 56; // px, smallest card we allow

  var css = [
    '.mp-board{width:100%;max-width:26rem;gap:.55rem;}',
    '.mp-board.mp-wide{max-width:34rem;}',
    '.mp-card{position:relative;aspect-ratio:1;width:100%;min-width:0;padding:0;border:0;background:none;cursor:pointer;perspective:700px;border-radius:var(--radius-sm);}',
    '.mp-card:disabled{cursor:default;}',
    '.mp-inner{position:absolute;inset:0;display:block;transform-style:preserve-3d;transition:transform .45s ease;}',
    '.mp-card.is-up .mp-inner{transform:rotateY(180deg);}',
    '.mp-side{position:absolute;inset:0;display:grid;place-items:center;border-radius:var(--radius-sm);border:2px solid var(--line);backface-visibility:hidden;-webkit-backface-visibility:hidden;}',
    '.mp-back{background:var(--memory-soft);border-color:var(--memory);color:var(--memory);font-size:clamp(1.3rem,6vw,1.9rem);font-weight:900;}',
    '.mp-card:hover:not(:disabled) .mp-back{border-color:var(--accent);}',
    '.mp-face{background:var(--surface);transform:rotateY(180deg);font-size:clamp(2rem,10vw,3rem);line-height:1;}',
    '.mp-small .mp-face{font-size:clamp(1.7rem,8vw,2.6rem);}',
    '.mp-face.mp-word{font-size:clamp(.85rem,3.6vw,1.15rem);font-weight:800;color:var(--ink);line-height:1.15;padding:.2rem;text-align:center;overflow-wrap:anywhere;}',
    '.mp-card.is-match .mp-face{background:var(--good-soft);border-color:var(--good);border-width:3px;}',
    '.mp-card.is-miss .mp-face{background:var(--bad-soft);border-color:var(--bad);border-width:3px;}',
    '@media (prefers-reduced-motion: reduce){.mp-inner{transition:none;}}'
  ].join('');

  function clampLevel(lv) {
    lv = Math.round(Number(lv)) || 1;
    return Math.max(1, Math.min(LEVELS.length, lv));
  }

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

  // Columns: the widest layout that keeps cards at least MIN_TAP wide.
  function pickCols(cards, width, gapPx) {
    var options;
    if (cards <= 6) options = [3];
    else if (cards <= 16) options = [4];
    else if (cards <= 20) options = [5, 4];
    else options = [6, 4];
    for (var i = 0; i < options.length; i++) {
      var c = options[i];
      if (cards % c === 0 && c * MIN_TAP + (c - 1) * gapPx <= width) return c;
    }
    return options[options.length - 1];
  }

  function choosePictures(ctx, pairs, mix) {
    var fams = ctx.shuffle(BASE);
    var list;
    if (mix === 3) {
      list = ctx.shuffle(ctx.pick(LOOKALIKE.filter(function (s) { return s.length >= pairs; })));
    } else if (mix === 2) {
      list = ctx.shuffle(FAMILIES[fams[0]]);
    } else if (mix === 1) {
      var half = Math.ceil(pairs / 2);
      list = ctx.shuffle(FAMILIES[fams[0]]).slice(0, half)
        .concat(ctx.shuffle(FAMILIES[fams[1]]).slice(0, pairs - half));
    } else {
      // Mixed: deal round-robin from all families so no family dominates.
      var decks = fams.map(function (f) {
        var d = FAMILIES[f];
        if (mix === 'word') d = d.filter(function (p) { return p.n.indexOf(' ') === -1; });
        return ctx.shuffle(d);
      });
      list = [];
      for (var i = 0; list.length < pairs && i < 64; i++) {
        var d = decks[i % decks.length];
        if (d.length) list.push(d.shift());
      }
    }
    return list.slice(0, pairs);
  }

  BrainGames.register({
    id: 'memory-pairs',
    name: 'זוגות',
    skill: 'memory',
    tagline: 'מצאו את הזוגות של הקלפים',
    benefit: 'זיכרון עבודה חזותי וזיכרון מיקום',
    instructions: [
      'כל הקלפים הפוכים. לחצו על קלף כדי להפוך אותו.',
      'הפכו שני קלפים. אם התמונות זהות — הן נשארות פתוחות.',
      'אם הן שונות — זכרו איפה הן, והן יתהפכו בחזרה.',
      'מצאו את כל הזוגות. אין שעון, קחו את הזמן.'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var spec = LEVELS[clampLevel(ctx.level) - 1];
      var wordMode = spec.mix === 'word';

      var chosen = choosePictures(ctx, spec.pairs, spec.mix);
      var pairs = chosen.length;
      var deck = ctx.shuffle(
        chosen.map(function (p) { return { pic: p, word: false }; })
          .concat(chosen.map(function (p) { return { pic: p, word: wordMode }; }))
      );

      var gapPx = 0.55 * remPx();
      var cols = pickCols(deck.length, contentWidth(root), gapPx);

      var found = 0;
      var mistakes = 0;
      var open = [];
      var locked = false;
      var baseStatus = wordMode ? 'מצאו תמונה ואת השם שלה' : 'הפכו שני קלפים ומצאו זוג';

      var hint = el('p', { class: 'g-hint' }, 'זוגות שנמצאו: 0 מתוך ' + pairs);
      var grid = el('div', {
        class: 'g-grid mp-board' + (cols >= 5 ? ' mp-wide' : '') + (deck.length > 16 ? ' mp-small' : ''),
        style: { '--cols': cols }
      });
      grid.style.setProperty('--cols', String(cols)); // custom props need setProperty

      var cards = deck.map(function (item, i) {
        var btn = el('button', {
          class: 'mp-card', type: 'button', 'aria-label': 'קלף ' + (i + 1) + ', הפוך',
          onclick: function () { flip(card); }
        }, el('span', { class: 'mp-inner', 'aria-hidden': 'true' }, [
          el('span', { class: 'mp-side mp-back' }, '?'),
          el('span', { class: 'mp-side mp-face' + (item.word ? ' mp-word' : '') }, item.word ? item.pic.n : item.pic.e)
        ]));
        var card = { btn: btn, pic: item.pic, word: item.word, index: i, up: false, done: false };
        grid.appendChild(btn);
        return card;
      });

      root.appendChild(grid);
      root.appendChild(hint);

      ctx.setStatus(wordMode
        ? 'שימו לב: הפעם כל זוג הוא תמונה והשם שלה. מצאו את שניהם'
        : baseStatus);
      ctx.setProgress(1, pairs);

      function show(card, up) {
        card.up = up;
        card.btn.classList.toggle('is-up', up);
        card.btn.setAttribute('aria-label', 'קלף ' + (card.index + 1) +
          (up ? ': ' + (card.word ? 'המילה ' : '') + card.pic.n : ', הפוך'));
      }

      function flip(card) {
        if (locked || card.up || card.done) return;
        ctx.sound('tap');
        show(card, true);
        open.push(card);
        if (open.length < 2) return;

        locked = true;
        var a = open[0], b = open[1];
        open = [];

        if (a.pic === b.pic) {
          found++;
          ctx.wait(350).then(function () {
            a.done = b.done = true;
            a.btn.classList.add('is-match'); b.btn.classList.add('is-match');
            a.btn.disabled = true; b.btn.disabled = true;
            ctx.sound('good');
            hint.textContent = 'זוגות שנמצאו: ' + found + ' מתוך ' + pairs;
            if (found >= pairs) {
              ctx.setProgress(pairs, pairs);
              ctx.setStatus('כל הכבוד! מצאתם את כל הזוגות');
              return ctx.wait(1200).then(end);
            }
            ctx.setProgress(found + 1, pairs);
            ctx.setStatus('יפה! זה זוג. המשיכו');
            locked = false;
          });
        } else {
          mistakes++;
          ctx.wait(350).then(function () {
            a.btn.classList.add('is-miss'); b.btn.classList.add('is-miss');
            ctx.setStatus('לא זוג. זכרו איפה הם');
            return ctx.wait(1500);
          }).then(function () {
            a.btn.classList.remove('is-miss'); b.btn.classList.remove('is-miss');
            show(a, false); show(b, false);
            ctx.setStatus(baseStatus);
            locked = false;
          });
        }
      }

      function end() {
        var tries = found + mistakes;
        ctx.finish({
          correct: Math.max(0, pairs - Math.max(0, mistakes - pairs)),
          total: pairs,
          note: 'מצאתם את כל הזוגות ב-' + tries + ' ניסיונות'
        });
      }
    }
  });
})();
