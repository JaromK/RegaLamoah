/* שלישיות — find three cards that match the rule: in every feature (shape, colour, count, fill)
   the three are either all the same or all different (logic, visual reasoning). Untimed. */
(function () {
  'use strict';

  var FEATS = ['shape', 'color', 'count', 'fill'];
  var NAMES = { shape: 'צורה', color: 'צבע', count: 'מספר', fill: 'מילוי' };
  var SHAPES = ['circle', 'square', 'triangle'];
  var SHAPE_WORDS = [['עיגול', 'עיגולים'], ['ריבוע', 'ריבועים'], ['משולש', 'משולשים']];
  // the classic trio colours: red, green, purple (tokens defined in the css below, with dark-mode shades)
  var COLORS = ['--tr-red', '--tr-green', '--tr-purple'];
  var COLOR_WORDS = [['אדום', 'אדומים'], ['ירוק', 'ירוקים'], ['סגול', 'סגולים']];
  var FILL_WORDS = [['מלא', 'מלאים'], ['ריק', 'ריקים'], ['בהיר', 'בהירים']];

  /* Per level (1–30): f = features in play (2: shape + colour, 3: + count, 4: + fill), n = cards,
     give = one card of a trio is already chosen, uniq = the board has exactly one trio,
     find = trios to find on one board, exact = the board has exactly that many,
     hard = every trio on the board differs in at least three features (fewer easy "same" clues).
     Boards have 6, 9 or 12 cards in three columns, so the cards stay big. */
  var LEVELS = [
    { f: 2, n: 6, give: true },                         // 1
    { f: 2, n: 6 },                                     // 2
    { f: 2, n: 9 },                                     // 3
    { f: 3, n: 6, give: true },                         // 4
    { f: 3, n: 6 },                                     // 5
    { f: 3, n: 9, give: true },                         // 6
    { f: 3, n: 9 },                                     // 7
    { f: 3, n: 9, uniq: true },                         // 8
    { f: 3, n: 9, uniq: true, hard: true },             // 9
    { f: 4, n: 6, give: true },                         // 10
    { f: 4, n: 6 },                                     // 11
    { f: 4, n: 9, give: true },                         // 12
    { f: 4, n: 9 },                                     // 13
    { f: 4, n: 9, uniq: true },                         // 14
    { f: 4, n: 12 },                                    // 15
    { f: 4, n: 12, uniq: true },                        // 16
    { f: 4, n: 12, uniq: true, hard: true },            // 17
    { f: 4, n: 12, find: 2 },                           // 18
    { f: 4, n: 12, find: 2, exact: true },              // 19
    { f: 4, n: 12, find: 2, exact: true, hard: true },  // 20
    { f: 4, n: 12, find: 3 },                           // 21
    { f: 4, n: 12, find: 3, exact: true },              // 22
    { f: 4, n: 12, find: 3, exact: true, hard: true },  // 23
    { f: 4, n: 12, find: 4 },                           // 24
    { f: 4, n: 12, find: 4, exact: true },              // 25
    { f: 4, n: 12, find: 4, exact: true, hard: true },  // 26
    { f: 4, n: 12, find: 5 },                           // 27
    { f: 4, n: 12, find: 5, exact: true },              // 28
    { f: 4, n: 12, find: 5, exact: true, hard: true },  // 29
    { f: 4, n: 12, find: 6, exact: true }               // 30
  ];
  // Boards per session, so a session stays about the same length.
  var BOARDS = { 1: 7, 2: 5, 3: 4, 4: 3, 5: 3, 6: 2 };

  /* ---------- pure model: a card is [shape, color, count, fill], each 0–2 ---------- */
  function isTrio(a, b, c, f) {
    for (var i = 0; i < f; i++) {
      // values are 0–2: all the same or all different is exactly "the sum divides by 3"
      if ((a[i] + b[i] + c[i]) % 3 !== 0) return false;
    }
    return true;
  }
  function sameCount(a, b, c, f) {
    var k = 0;
    for (var i = 0; i < f; i++) if (a[i] === b[i] && b[i] === c[i]) k++;
    return k;
  }
  function allTrios(cards, f) {
    var out = [];
    for (var i = 0; i < cards.length; i++)
      for (var j = i + 1; j < cards.length; j++)
        for (var k = j + 1; k < cards.length; k++)
          if (isTrio(cards[i], cards[j], cards[k], f)) out.push([i, j, k]);
    return out;
  }
  function keyOf(t) { return t.slice().sort(function (a, b) { return a - b; }).join(','); }

  function deck(f) {
    var out = [[]];
    for (var i = 0; i < 4; i++) {
      var next = [];
      out.forEach(function (c) {
        (i < f ? [0, 1, 2] : [0]).forEach(function (v) { next.push(c.concat([v])); });
      });
      out = next;
    }
    return out;
  }

  /* A board that satisfies the level's rules (falls back to "at least `find` trios"). */
  function makeBoard(spec, shuffle) {
    var f = spec.f, need = spec.find || 1;
    var all = deck(f);
    var best = null;
    for (var attempt = 0; attempt < 6000; attempt++) {
      var cards = shuffle(all).slice(0, spec.n);
      var trios = allTrios(cards, f);
      if (trios.length < need) continue;
      if (!best) best = { cards: cards, trios: trios };
      if ((spec.uniq || spec.exact) && trios.length !== need) continue;
      if (spec.hard && trios.some(function (t) { return sameCount(cards[t[0]], cards[t[1]], cards[t[2]], f) > 1; })) continue;
      return { cards: cards, trios: trios };
    }
    return best;
  }

  /* ---------- drawing ---------- */
  function shapeSvg(card, f) {
    var shape = SHAPES[card[0]], color = 'var(' + COLORS[f >= 2 ? card[1] : 0] + ')';
    var count = f >= 3 ? card[2] + 1 : 1, fill = f >= 4 ? card[3] : 0;
    var paint = fill === 0 ? 'fill="' + color + '" stroke="' + color + '" stroke-width="3"'
      : fill === 1 ? 'fill="none" stroke="' + color + '" stroke-width="5"'
        : 'fill="' + color + '" fill-opacity=".3" stroke="' + color + '" stroke-width="4"';
    var xs = count === 1 ? [50] : count === 2 ? [32, 68] : [17, 50, 83];
    var r = 13;
    var parts = xs.map(function (x) {
      if (shape === 'circle') return '<circle cx="' + x + '" cy="30" r="' + r + '" ' + paint + '/>';
      if (shape === 'square') return '<rect x="' + (x - r + 1) + '" y="' + (31 - r) + '" width="' + (2 * r - 2) + '" height="' + (2 * r - 2) + '" rx="2" ' + paint + '/>';
      return '<polygon points="' + x + ',' + (30 - r - 1) + ' ' + (x + r + 1) + ',' + (30 + r) + ' ' + (x - r - 1) + ',' + (30 + r) + '" stroke-linejoin="round" ' + paint + '/>';
    });
    return '<svg viewBox="0 0 100 60" aria-hidden="true" focusable="false">' + parts.join('') + '</svg>';
  }

  function describe(card, f) {
    var count = f >= 3 ? card[2] + 1 : 1, pl = count > 1 ? 1 : 0;
    var s = (count > 1 ? count + ' ' : '') + SHAPE_WORDS[card[0]][pl];
    if (f >= 2) s += ' ' + COLOR_WORDS[card[1]][pl];
    if (f >= 4) s += ' ' + FILL_WORDS[card[3]][pl];
    return s;
  }

  /* Why three cards are not a trio: "צבע: שניים זהים ואחד שונה". */
  function whyNot(a, b, c, f) {
    var bad = [];
    for (var i = 0; i < f; i++) {
      var same = a[i] === b[i] && b[i] === c[i], diff = a[i] !== b[i] && b[i] !== c[i] && a[i] !== c[i];
      if (!same && !diff) bad.push(NAMES[FEATS[i]]);
    }
    return bad.length ? 'ב' + bad.join(' וב') + ': שניים זהים ואחד שונה' : '';
  }

  var css = [
    '.tr-rule{margin:0;font-size:1.1rem;font-weight:700;text-align:center;color:var(--ink-soft);text-wrap:balance;}',
    '.tr-board{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.55rem;width:100%;max-width:24rem;}',
    '.tr-card{--tr-red:#d42a2f;--tr-green:#16924a;--tr-purple:#6a2c91;}',
    '@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .tr-card{--tr-red:#ff6f6a;--tr-green:#5ad283;--tr-purple:#c18df2;}}',
    ':root[data-theme="dark"] .tr-card{--tr-red:#ff6f6a;--tr-green:#5ad283;--tr-purple:#c18df2;}',
    '.tr-card{aspect-ratio:5/3;min-height:56px;padding:.2rem;border-radius:var(--radius-sm);border:3px solid var(--line);',
    'background:var(--surface);cursor:pointer;display:grid;place-items:center;transition:border-color .15s,background-color .15s;}',
    '.tr-card svg{width:100%;height:100%;display:block;}',
    '.tr-card:hover:not(:disabled){border-color:var(--accent);}',
    '.tr-card:disabled{cursor:default;}',
    '.tr-card.is-picked{border-color:var(--logic);background:var(--logic-soft);box-shadow:0 0 0 2px var(--logic);}',
    '.tr-card.is-given{border-style:dashed;}',
    '.tr-card.is-correct{border-color:var(--good);background:var(--good-soft);}',
    '.tr-card.is-wrong{border-color:var(--bad);background:var(--bad-soft);}',
    '.tr-card.is-shown{border-color:var(--sun);background:var(--sun-soft);}',
    '.tr-count{margin:0;font-size:1.15rem;font-weight:800;text-align:center;font-variant-numeric:tabular-nums;}',
    '.tr-found{display:flex;flex-wrap:wrap;justify-content:center;gap:.3rem .8rem;margin:0;font-size:1rem;color:var(--ink-soft);}'
  ].join('');

  BrainGames.register({
    id: 'trios',
    name: 'שלישיות',
    skill: 'logic',
    tagline: 'מצאו שלושה קלפים שמתאימים לפי הכלל',
    benefit: 'חשיבה לוגית, השוואה וקשב לפרטים',
    instructions: [
      'על הלוח יש קלפים עם צורות. לכל קלף צורה, צבע, ובהמשך גם מספר ומילוי.',
      'מצאו שלושה קלפים שבכל תכונה הם או כולם זהים, או כולם שונים.',
      'למשל: שלושה עיגולים בשלושה צבעים שונים. שני אדומים ואחד ירוק, לא מתאים.',
      'לחצו על שלושת הקלפים. אין שעון. ברמות הגבוהות מוצאים כמה שלישיות בכל לוח.'
    ],
    css: css,
    _levels: LEVELS,
    _model: { isTrio: isTrio, allTrios: allTrios, makeBoard: makeBoard, sameCount: sameCount },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var f = spec.f, need = spec.find || 1;
      var boards = BOARDS[need] || 3;
      var board = 0, found = 0, total = boards * need;
      var feats = FEATS.slice(0, f).map(function (k) { return NAMES[k]; });
      var ruleText = 'בכל תכונה (' + feats.join(', ') + '): כולם זהים או כולם שונים';

      function nextBoard() {
        if (board >= boards) {
          ctx.finish({
            correct: found, total: total,
            note: 'מצאתם ' + found + ' מתוך ' + total + ' שלישיות' + (need > 1 ? ' (' + need + ' בכל לוח)' : '')
          });
          return;
        }
        board++;
        ctx.setProgress(board, boards);
        play(makeBoard(spec, ctx.shuffle));
      }

      function play(B) {
        root.innerHTML = '';
        var picked = [];
        var given = -1;
        var foundKeys = {};
        var foundHere = 0;
        var wrongTries = 0;
        var busy = false;

        var buttons = B.cards.map(function (c, i) {
          return el('button', {
            class: 'tr-card', type: 'button', 'aria-pressed': 'false', 'aria-label': describe(c, f),
            html: shapeSvg(c, f), onclick: function () { tap(i); }
          });
        });
        var countLine = el('p', { class: 'tr-count', 'aria-live': 'polite' });
        root.appendChild(el('p', { class: 'tr-rule' }, ruleText));
        root.appendChild(el('div', { class: 'tr-board' }, buttons));
        root.appendChild(countLine);

        function remaining() { return B.trios.filter(function (t) { return !foundKeys[keyOf(t)]; }); }

        function startTrio() {
          picked = [];
          wrongTries = 0;
          buttons.forEach(function (b) { b.classList.remove('is-picked', 'is-given', 'is-wrong', 'is-shown'); b.setAttribute('aria-pressed', 'false'); });
          given = -1;
          if (spec.give) {
            given = ctx.pick(remaining())[ctx.randInt(0, 2)];
            picked = [given];
            buttons[given].classList.add('is-picked', 'is-given');
            buttons[given].setAttribute('aria-pressed', 'true');
          }
          countLine.textContent = need > 1 ? 'מצאתם ' + foundHere + ' מתוך ' + need : '';
          ctx.setStatus(spec.give ? 'קלף אחד כבר נבחר. מצאו עוד שניים שמתאימים לו'
            : need > 1 ? 'מצאו ' + need + ' שלישיות שונות בלוח' : 'מצאו שלושה קלפים שמתאימים');
        }

        function tap(i) {
          if (busy || i === given) return;
          ctx.sound('tap');
          var pos = picked.indexOf(i);
          if (pos !== -1) {
            picked.splice(pos, 1);
            buttons[i].classList.remove('is-picked');
            buttons[i].setAttribute('aria-pressed', 'false');
            return;
          }
          picked.push(i);
          buttons[i].classList.add('is-picked');
          buttons[i].setAttribute('aria-pressed', 'true');
          if (picked.length === 3) check();
        }

        function check() {
          busy = true;
          var a = B.cards[picked[0]], b = B.cards[picked[1]], c = B.cards[picked[2]];
          var trio = picked.slice();
          if (isTrio(a, b, c, f)) {
            var k = keyOf(trio);
            if (foundKeys[k]) {
              ctx.feedback(false, 'את השלישייה הזאת כבר מצאתם. חפשו אחרת').then(clearPick);
              return;
            }
            foundKeys[k] = true;
            foundHere++;
            if (wrongTries < 2) found++;
            trio.forEach(function (i) { buttons[i].classList.remove('is-picked'); buttons[i].classList.add('is-correct'); });
            ctx.setStatus('נכון! השלושה מתאימים לכלל');
            ctx.feedback(true).then(function () { return ctx.wait(600); }).then(afterFound);
            return;
          }
          wrongTries++;
          trio.forEach(function (i) { buttons[i].classList.add('is-wrong'); });
          var why = whyNot(a, b, c, f);
          if (wrongTries >= 2) {
            // show one trio that is still missing, then go on
            var show = remaining()[0];
            ctx.feedback(false, why + '. הנה שלישייה מתאימה').then(function () {
              trio.forEach(function (i) { buttons[i].classList.remove('is-wrong', 'is-picked'); });
              show.forEach(function (i) { buttons[i].classList.add('is-shown'); });
              foundKeys[keyOf(show)] = true;
              foundHere++;
              ctx.setStatus('השלישייה המסומנת בצהוב מתאימה לכלל');
              return ctx.wait(2200);
            }).then(function () {
              show.forEach(function (i) { buttons[i].classList.remove('is-shown'); });
              afterFound();
            });
            return;
          }
          ctx.setStatus(why);
          ctx.feedback(false, why).then(clearPick);
        }

        function clearPick() {
          picked.forEach(function (i) {
            if (i === given) return;
            buttons[i].classList.remove('is-picked', 'is-wrong');
            buttons[i].setAttribute('aria-pressed', 'false');
          });
          picked = given >= 0 ? [given] : [];
          busy = false;
        }

        function afterFound() {
          busy = false;
          if (foundHere >= need || !remaining().length) {
            buttons.forEach(function (bt) { bt.disabled = true; });
            ctx.wait(400).then(nextBoard);
            return;
          }
          // found cards stay on the board: a card can be part of more than one trio
          buttons.forEach(function (bt) { bt.classList.remove('is-correct'); });
          startTrio();
        }

        startTrio();
      }

      nextBoard();
    }
  });
})();
