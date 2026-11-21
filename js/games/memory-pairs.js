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

  // Faces with short names, for the hardest picture + name levels (31+): the names differ in one word.
  var FACES = [
    { e: '😀', n: 'מחייך' }, { e: '😃', n: 'עיניים גדולות' }, { e: '😄', n: 'צוחק' }, { e: '😁', n: 'שיניים' },
    { e: '😆', n: 'עיניים עצומות' }, { e: '😊', n: 'נבוך' }, { e: '🙂', n: 'חיוך קטן' }, { e: '😉', n: 'קורץ' },
    { e: '😍', n: 'מאוהב' }, { e: '😎', n: 'משקפי שמש' }, { e: '😮', n: 'מופתע' }, { e: '😢', n: 'בוכה' }
  ];

  // Per level (1–50): number of pairs + how alike the pictures are.
  // mix: 0 = mixed families, 1 = two families, 2 = one family, 3 = look-alikes, 'word' = picture + its name;
  // 'word2' / 'word1' = picture + name from two families / one family, 'wordLook' = coloured circles and
  // squares with their names ("עיגול ירוק"); 'wordLook2' = the same, always six colours as both a circle
  // and a square; 'wordFace' = smiling faces and their names. swap (38+) = after every `swap` misses two
  // face-down cards trade places, and both are marked so the player can follow.
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
    { pairs: 12, mix: 'word' }, // 20
    // 21–30: always 12 pairs; the pictures get more alike, and the picture must be matched with its name
    { pairs: 12, mix: 3 },        // 21
    { pairs: 12, mix: 3 },        // 22
    { pairs: 12, mix: 'word2' },  // 23
    { pairs: 12, mix: 'word2' },  // 24
    { pairs: 12, mix: 'word1' },  // 25
    { pairs: 12, mix: 'word1' },  // 26
    { pairs: 12, mix: 'word1' },  // 27
    { pairs: 12, mix: 'wordLook' }, // 28
    { pairs: 12, mix: 'wordLook' }, // 29
    { pairs: 12, mix: 'wordLook' }, // 30
    // 31–50: still 12 pairs; look-alike colours, then faces, then two cards trade places now and then
    { pairs: 12, mix: 'wordLook2' }, // 31
    { pairs: 12, mix: 'wordLook2' }, // 32
    { pairs: 12, mix: 'wordLook2' }, // 33
    { pairs: 12, mix: 'wordFace' }, // 34
    { pairs: 12, mix: 'wordFace' }, // 35
    { pairs: 12, mix: 'wordFace' }, // 36
    { pairs: 12, mix: 'wordFace' }, // 37
    { pairs: 12, mix: 'wordLook2', swap: 4 }, // 38
    { pairs: 12, mix: 'wordLook2', swap: 4 }, // 39
    { pairs: 12, mix: 'wordLook2', swap: 4 }, // 40
    { pairs: 12, mix: 'wordLook2', swap: 3 }, // 41
    { pairs: 12, mix: 'wordFace', swap: 4 }, // 42
    { pairs: 12, mix: 'wordFace', swap: 4 }, // 43
    { pairs: 12, mix: 'wordFace', swap: 4 }, // 44
    { pairs: 12, mix: 'wordFace', swap: 3 }, // 45
    { pairs: 12, mix: 'wordFace', swap: 3 }, // 46
    { pairs: 12, mix: 'wordFace', swap: 3 }, // 47
    { pairs: 12, mix: 'wordFace', swap: 3 }, // 48
    { pairs: 12, mix: 'wordFace', swap: 2 }, // 49
    { pairs: 12, mix: 'wordFace', swap: 2 } // 50
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
    '.mp-card.mp-swapped .mp-back{background:var(--c-purple-soft);border:4px solid var(--c-purple);color:var(--c-purple);}',
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
    var oneWord = function (p) { return p.n.indexOf(' ') === -1; };
    if (mix === 'wordLook') return ctx.shuffle(LOOKALIKE[1]).slice(0, pairs);
    if (mix === 'wordFace') return ctx.shuffle(FACES).slice(0, pairs);
    if (mix === 'wordLook2') {
      // circles and squares of the same colours: k colours twice, the rest once
      var cl = LOOKALIKE[1].slice(0, 8), sq = LOOKALIKE[1].slice(8);
      var colours = ctx.shuffle([0, 1, 2, 3, 4, 5, 6, 7]);
      var both = Math.min(8, Math.floor(pairs / 2));
      var out = [];
      colours.slice(0, both).forEach(function (c) { out.push(cl[c], sq[c]); });
      colours.slice(both).forEach(function (c, k) { if (out.length < pairs) out.push(k % 2 ? cl[c] : sq[c]); });
      return ctx.shuffle(out.slice(0, pairs));
    }
    if (mix === 'word1') {
      // one family: pick the family with enough one-word names
      var f1 = fams.filter(function (f) { return FAMILIES[f].filter(oneWord).length >= pairs; })[0] || fams[0];
      return ctx.shuffle(FAMILIES[f1].filter(oneWord)).slice(0, pairs);
    }
    if (mix === 'word2') {
      var h = Math.ceil(pairs / 2);
      return ctx.shuffle(FAMILIES[fams[0]].filter(oneWord)).slice(0, h)
        .concat(ctx.shuffle(FAMILIES[fams[1]].filter(oneWord)).slice(0, pairs - h));
    }
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
      'מצאו את כל הזוגות. אין שעון, קחו את הזמן.',
      'ברמות הגבוהות, אחרי כמה טעויות שני קלפים הפוכים מחליפים מקום. הם יסומנו בסגול ⇄, אז עדכנו את הזיכרון.'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var spec = LEVELS[clampLevel(ctx.level) - 1];
      var wordMode = typeof spec.mix === 'string';

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
        var card = { btn: btn, pic: item.pic, word: item.word, index: i, up: false, done: false, seen: false };
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
        card.seen = true;
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
            if (spec.swap && mistakes % spec.swap === 0) return ctx.wait(500).then(swapTwo);
          }).then(function () { locked = false; });
        }
      }

      // 38+: two face-down cards trade places (cards the player has already seen when possible).
      // Both get a purple frame and ⇄ for a while, so the change can be followed.
      function swapTwo() {
        var free = cards.filter(function (c) { return !c.done && !c.up; });
        if (free.length < 4) return null;
        var seen = ctx.shuffle(free.filter(function (c) { return c.seen; }));
        var a = seen[0] || ctx.pick(free);
        var b = ctx.shuffle(free.filter(function (c) { return c !== a && c.pic !== a.pic && (c.seen || seen.length < 2); }))[0];
        if (!b) return null;
        var pa = a.pic, wa = a.word;
        a.pic = b.pic; a.word = b.word; b.pic = pa; b.word = wa;
        [a, b].forEach(function (c) {
          var face = c.btn.querySelector('.mp-face');
          face.textContent = c.word ? c.pic.n : c.pic.e;
          face.classList.toggle('mp-word', c.word);
          c.btn.classList.add('mp-swapped');
          c.btn.querySelector('.mp-back').textContent = '⇄';
        });
        ctx.sound('tap');
        ctx.setStatus('שימו לב: שני הקלפים הסגולים החליפו מקום');
        return ctx.wait(2200).then(function () {
          [a, b].forEach(function (c) {
            c.btn.classList.remove('mp-swapped');
            c.btn.querySelector('.mp-back').textContent = '?';
          });
          ctx.setStatus(baseStatus);
        });
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
