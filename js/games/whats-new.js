/* מה חדש? — remember a set of objects, then spot the one that was added. */
(function () {
  'use strict';

  var ROUNDS = 7;

  /* Everyday emoji: no flags, no people, no skin-tone or gender variants.
     Items sharing a group look alike, so at most one per group is used in a round.
     The category (CAT_OF, below) is used at levels 17-20, where most items come from one category. */
  var BANK = [
    ['🍎', 'redfruit'], ['🍓', 'redfruit'], ['🍒', 'redfruit'], ['🍅', 'redfruit'],
    ['🍌', 'banana'], ['🍇', 'grapes'], ['🍉', 'melon'], ['🍍', 'pineapple'], ['🍋', 'lemon'],
    ['🥕', 'carrot'], ['🌽', 'corn'], ['🍄', 'mushroom'], ['🥦', 'broccoli'],
    ['🍞', 'bread'], ['🧀', 'cheese'], ['🍕', 'pizza'], ['🍔', 'burger'],
    ['🍦', 'icecream'], ['🎂', 'cake'], ['🍩', 'donut'], ['☕', 'cup'], ['🥛', 'cup'],
    ['🐶', 'face-a'], ['🐱', 'face-a'], ['🐭', 'face-b'], ['🐰', 'face-b'],
    ['🐻', 'face-c'], ['🐼', 'face-c'], ['🐸', 'frog'], ['🐵', 'monkey'],
    ['🐔', 'bird'], ['🐧', 'bird'], ['🐢', 'turtle'], ['🐟', 'fish'], ['🦋', 'butterfly'],
    ['🐌', 'snail'], ['🐘', 'elephant'], ['🦒', 'giraffe'],
    ['🐝', 'bee'], ['🐞', 'ladybug'], ['🦀', 'crab'], ['🐙', 'octopus'], ['🐑', 'sheep'],
    ['🚗', 'car'], ['🚌', 'car'], ['🚲', 'bike'], ['✈️', 'plane'], ['🚀', 'rocket'], ['⛵', 'boat'], ['🚂', 'train'],
    ['⚽', 'ball'], ['🏀', 'ball'], ['🎈', 'balloon'], ['🎁', 'gift'],
    ['🎸', 'guitar'], ['🥁', 'drum'], ['🎹', 'piano'], ['🎺', 'trumpet'],
    ['📚', 'books'], ['✏️', 'pencil'], ['✂️', 'scissors'], ['🔑', 'key'], ['🔒', 'lock'],
    ['💡', 'bulb'], ['⏰', 'clock'], ['☂️', 'umbrella'], ['👓', 'glasses'], ['👟', 'shoe'],
    ['🎩', 'hat'], ['👑', 'crown'], ['💍', 'ring'], ['🏠', 'house'], ['🌳', 'tree'],
    ['🌵', 'cactus'], ['🌻', 'flower'], ['🌙', 'moon'], ['⭐', 'star'], ['☀️', 'sun'],
    ['⚓', 'anchor'], ['🔔', 'bell'], ['🧲', 'magnet'], ['📷', 'camera'], ['📞', 'phone'],
    ['🧸', 'teddy'], ['🕯️', 'candle'], ['🎃', 'pumpkin'], ['🌈', 'rainbow'], ['🔨', 'hammer']
  ];

  /* Category of each look-alike group (groups not listed are 'other'). */
  var CATS = {
    food: ['redfruit', 'banana', 'grapes', 'melon', 'pineapple', 'lemon', 'carrot', 'corn', 'mushroom', 'broccoli',
      'bread', 'cheese', 'pizza', 'burger', 'icecream', 'cake', 'donut', 'cup'],
    animals: ['face-a', 'face-b', 'face-c', 'frog', 'monkey', 'bird', 'turtle', 'fish', 'butterfly', 'snail',
      'elephant', 'giraffe', 'bee', 'ladybug', 'crab', 'octopus', 'sheep'],
    objects: ['books', 'pencil', 'scissors', 'key', 'lock', 'bulb', 'clock', 'umbrella', 'glasses', 'shoe', 'hat',
      'crown', 'ring', 'anchor', 'bell', 'magnet', 'camera', 'phone', 'teddy', 'candle', 'hammer', 'gift', 'balloon']
  };
  var CAT_OF = {};
  Object.keys(CATS).forEach(function (c) { CATS[c].forEach(function (g) { CAT_OF[g] = c; }); });

  /* Difficulty by level (index = level - 1).
     Levels 1-15 spread the original 10-level curve in small steps; 16-20 add new challenges. */
  // Items shown first (the second screen adds one more, or one disappears).
  var COUNTS = [3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 7, 7, 8, 8, 9, 10, 10, 11, 11, 12];
  // From level 17 the items come from a single category, so they are harder to tell apart.
  var SAME_CAT_FROM = 17;
  // Rounds (out of 7) that ask "what disappeared?" instead of "what is new?".
  var GONE_ROUNDS = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 3];
  var N_DECOYS = 3; // extra candidates in a "what disappeared?" round

  var CSS = [
    '.wn-wrap{width:100%;display:flex;flex-direction:column;align-items:center;gap:1.2rem}',
    '.wn-grid{max-width:26rem}',
    '.wn-tile{font-size:clamp(2.1rem,10vw,3.2rem);line-height:1}',
    '.wn-static{cursor:default}',
    '.wn-static:hover{border-color:var(--line)}',
    '.wn-tile.is-correct{box-shadow:0 0 0 4px var(--good)}',
    '.wn-cands{max-width:22rem;padding-top:.4rem;border-top:2px dashed var(--line)}'
  ].join('');

  function colsFor(n) {
    if (n <= 4) return 2;
    if (n <= 9) return 3;
    return 4;
  }

  BrainGames.register({
    id: 'whats-new',
    name: 'מה חדש?',
    skill: 'attention',
    tagline: 'זכרו את הפריטים ומצאו את החדש',
    benefit: 'קשב חזותי וזיכרון לפרטים',
    instructions: [
      'הסתכלו על הפריטים שעל המסך, כמה זמן שתרצו.',
      'כשאתם מוכנים, לחצו "זכרתי, הלאה".',
      'הפריטים יופיעו שוב בסדר אחר, ואיתם פריט אחד חדש.',
      'לחצו על הפריט החדש. בשלבים הגבוהים לפעמים פריט נעלם, ואז בוחרים איזה נעלם.'
    ],
    css: CSS,
    start: function (root, ctx) {
      var level = Math.max(1, Math.min(20, Math.round(Number(ctx.level) || 1)));
      var count = COUNTS[level - 1];
      var sameCat = level >= SAME_CAT_FROM;
      var round = 0;
      var correct = 0;
      var goneTotal = 0;
      var goneCorrect = 0;
      var recent = []; // emoji used as the answer in recent rounds
      var prevCat = null;

      // Round types: 'new' (spot the added item) or 'gone' (what disappeared?). Round 1 is always 'new'.
      var kinds = [];
      for (var k = 0; k < ROUNDS - 1; k++) kinds.push(k < GONE_ROUNDS[level - 1] ? 'gone' : 'new');
      kinds = ['new'].concat(ctx.shuffle(kinds));

      /* n items, at most one per look-alike group. In same-category mode, items come from one category
         (a different one from the previous round when possible). */
      function pickItems(n) {
        var pool = BANK;
        if (sameCat) {
          var cats = Object.keys(CATS).filter(function (c) { return CATS[c].length >= n && c !== prevCat; });
          if (cats.length) {
            var cat = ctx.pick(cats);
            prevCat = cat;
            pool = BANK.filter(function (it) { return CAT_OF[it[1]] === cat; });
          }
        }
        var groups = {};
        var out = [];
        ctx.shuffle(pool).concat(ctx.shuffle(BANK)).forEach(function (it) {
          if (out.length < n && !groups[it[1]]) {
            groups[it[1]] = true;
            out.push(it[0]);
          }
        });
        return out;
      }

      // Take the answer from the end of the list, preferring one that was not the answer recently.
      function takeAnswer(items) {
        var idx = items.length - 1;
        for (var i = items.length - 1; i >= 0; i--) {
          if (recent.indexOf(items[i]) === -1) { idx = i; break; }
        }
        var ans = items.splice(idx, 1)[0];
        recent.push(ans);
        if (recent.length > 3) recent.shift();
        return ans;
      }

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({
            correct: correct,
            total: ROUNDS,
            note: goneTotal > 0
              ? 'עניתם נכון ב-' + correct + ' מתוך ' + ROUNDS + ' שלבים. בשאלות "מה נעלם?": ' +
                goneCorrect + ' מתוך ' + goneTotal + '.'
              : 'מצאתם את הפריט החדש ב-' + correct + ' מתוך ' + ROUNDS + ' שלבים.'
          });
          return;
        }
        ctx.setProgress(round, ROUNDS);

        if (kinds[round - 1] === 'gone') {
          goneTotal++;
          var pool = pickItems(count + N_DECOYS);
          var decoys = pool.splice(count, N_DECOYS);
          var shown = pool.slice();
          var gone = takeAnswer(pool); // pool now holds the items that stay
          showStudy(shown, function () { showGoneTest(pool, gone, decoys); }, true);
          return;
        }

        var items = pickItems(count + 1);
        var newItem = takeAnswer(items);
        showStudy(items, function () { showTest(items, newItem); }, false);
      }

      function showStudy(items, next, isGone) {
        ctx.setStatus(isGone
          ? 'שימו לב, הפעם פריט אחד ייעלם. זכרו את כל הפריטים'
          : GONE_ROUNDS[level - 1] > 0
            ? 'זכרו את הפריטים. הפעם יתווסף פריט חדש'
            : 'הסתכלו היטב וזכרו את הפריטים');
        var grid = ctx.el('div', { class: 'g-grid wn-grid', style: { '--cols': colsFor(items.length) } });
        items.forEach(function (e) {
          grid.appendChild(ctx.el('div', { class: 'g-tile wn-tile wn-static', 'aria-hidden': 'true' }, e));
        });
        var go = ctx.el('button', {
          class: 'btn btn-primary btn-lg',
          type: 'button',
          onclick: function () {
            go.disabled = true;
            ctx.sound('tap');
            next();
          }
        }, 'זכרתי, הלאה');

        root.innerHTML = '';
        root.appendChild(ctx.el('div', { class: 'wn-wrap' }, [
          ctx.el('p', { class: 'g-hint', text: items.length + ' פריטים.' + (ctx.timed ? '' : ' אין שעון, קחו את הזמן.') +
            (isGone ? ' אחר כך תבחרו איזה פריט נעלם.' : '') }),
          grid,
          ctx.el('div', { class: 'g-actions' }, go)
        ]));
        ctx.studyTimer(go, 3000 + 1000 * items.length);
        go.focus({ preventScroll: true });
      }

      function showTest(items, newItem) {
        ctx.setStatus('איזה פריט חדש? לחצו עליו');
        var all = ctx.shuffle(items.concat([newItem]));
        var grid = ctx.el('div', { class: 'g-grid wn-grid', style: { '--cols': colsFor(all.length) } });
        var tiles = [];
        var answered = false;

        all.forEach(function (e) {
          var t = ctx.el('button', {
            class: 'g-tile wn-tile',
            type: 'button',
            onclick: function () { answer(e, t); }
          }, e);
          tiles.push({ emoji: e, btn: t });
          grid.appendChild(t);
        });

        root.innerHTML = '';
        root.appendChild(ctx.el('div', { class: 'wn-wrap' }, [
          ctx.el('p', { class: 'g-hint', text: 'פריט אחד לא היה קודם.' }),
          grid
        ]));

        function answer(e, btn) {
          if (answered) return;
          answered = true;
          var ok = e === newItem;
          tiles.forEach(function (o) {
            o.btn.disabled = true;
            if (o.emoji === newItem) o.btn.classList.add('is-correct');
          });
          if (ok) correct++;
          else btn.classList.add('is-wrong');
          ctx.feedback(ok, ok ? null : 'הפריט החדש מסומן בירוק')
            .then(function () { return ctx.wait(ok ? 400 : 1300); })
            .then(nextRound);
        }
      }

      /* "What disappeared?": the remaining items stay on screen; pick the missing one from candidates
         (the missing item plus decoys that were never shown). */
      function showGoneTest(remaining, gone, decoys) {
        ctx.setStatus('איזה פריט נעלם? בחרו אותו למטה');
        var rest = ctx.shuffle(remaining);
        var restGrid = ctx.el('div', { class: 'g-grid wn-grid', style: { '--cols': colsFor(rest.length) } });
        rest.forEach(function (e) {
          restGrid.appendChild(ctx.el('div', { class: 'g-tile wn-tile wn-static', 'aria-hidden': 'true' }, e));
        });

        var cands = ctx.shuffle(decoys.concat([gone]));
        var candGrid = ctx.el('div', { class: 'g-grid wn-grid wn-cands', style: { '--cols': cands.length } });
        var tiles = [];
        var answered = false;
        cands.forEach(function (e) {
          var t = ctx.el('button', {
            class: 'g-tile wn-tile',
            type: 'button',
            onclick: function () { answer(e, t); }
          }, e);
          tiles.push({ emoji: e, btn: t });
          candGrid.appendChild(t);
        });

        root.innerHTML = '';
        root.appendChild(ctx.el('div', { class: 'wn-wrap' }, [
          ctx.el('p', { class: 'g-hint', text: 'אלה הפריטים שנשארו:' }),
          restGrid,
          ctx.el('p', { class: 'g-prompt', text: 'מי מאלה היה קודם ונעלם?' }),
          candGrid
        ]));

        function answer(e, btn) {
          if (answered) return;
          answered = true;
          var ok = e === gone;
          tiles.forEach(function (o) {
            o.btn.disabled = true;
            if (o.emoji === gone) o.btn.classList.add('is-correct');
          });
          if (ok) { correct++; goneCorrect++; }
          else btn.classList.add('is-wrong');
          ctx.feedback(ok, ok ? null : 'הפריט שנעלם מסומן בירוק')
            .then(function () { return ctx.wait(ok ? 400 : 1300); })
            .then(nextRound);
        }
      }

      nextRound();
      return function cleanup() { root.innerHTML = ''; };
    }
  });
})();
