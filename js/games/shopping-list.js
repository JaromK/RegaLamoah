/* רשימת קניות — memorise a shopping list, then pick its items from the shelf (memory). */
(function () {
  'use strict';

  var ROUNDS = 6;

  /* Store categories. Each entry: "emoji word". Every emoji is unique across the bank. */
  var CATEGORIES = {
    veg: ['🍅 עגבניות', '🥒 מלפפונים', '🥕 גזר', '🧅 בצל', '🧄 שום', '🥔 תפוחי אדמה', '🫑 פלפלים',
      '🥬 חסה', '🥦 ברוקולי', '🌽 תירס', '🍆 חצילים', '🍄 פטריות', '🥑 אבוקדו'],
    fruit: ['🍎 תפוחים', '🍌 בננות', '🍊 תפוזים', '🍋 לימונים', '🍇 ענבים', '🍓 תותים', '🍉 אבטיח',
      '🍐 אגסים', '🍑 אפרסקים', '🍒 דובדבנים', '🍍 אננס', '🥝 קיווי', '🥭 מנגו', '🫐 אוכמניות', '🥥 קוקוס', '🍈 מלון'],
    fridge: ['🥛 חלב', '🧀 גבינה צהובה', '🧈 חמאה', '🥚 ביצים', '🍗 עוף', '🥩 בשר', '🐟 דגים', '🌭 נקניקיות', '🍤 שרימפס'],
    bakery: ['🍞 לחם', '🥖 באגט', '🥐 קרואסונים', '🥯 בייגל', '🫓 פיתות', '🥨 בייגלה', '🧇 וופלים', '🍰 עוגה', '🧁 מאפינס'],
    pantry: ['🍚 אורז', '🍝 פסטה', '🫒 זיתים', '🥫 שימורים', '🍯 דבש', '🧂 מלח', '🥜 בוטנים', '🌰 ערמונים', '🥣 קורנפלקס'],
    drinks: ['🧃 מיץ', '🥤 משקה קל', '💧 מים מינרליים', '🍷 יין', '🍺 בירה', '☕ קפה', '🍵 תה'],
    sweets: ['🍫 שוקולד', '🍬 סוכריות', '🍭 סוכרייה על מקל', '🍪 עוגיות', '🍩 סופגניות', '🍦 גלידה', '🍿 פופקורן'],
    home: ['🧻 נייר טואלט', '🧼 סבון', '🧽 ספוגים', '🧴 שמפו', '🪥 מברשת שיניים', '🧹 מטאטא', '🔋 סוללות', '💡 נורה', '🧺 סל כביסה']
  };

  var BANK = [];
  Object.keys(CATEGORIES).forEach(function (cat) {
    CATEGORIES[cat].forEach(function (s, i) {
      var sp = s.indexOf(' ');
      BANK.push({ id: cat + i, cat: cat, emoji: s.slice(0, sp), word: s.slice(sp + 1) });
    });
  });

  var css = [
    '.sl2-note{width:100%;max-width:30rem;background:var(--sun-soft);border:2px solid var(--sun);border-radius:var(--radius);padding:.7rem .9rem;}',
    '.sl2-note-title{font-weight:800;font-size:1.15rem;text-align:center;margin:0 0 .4rem;}',
    /* two columns so even the longest list fits one phone screen */
    '.sl2-list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.1rem 1rem;}',
    '.sl2-list li{display:flex;align-items:center;gap:.4rem;font-size:1.2rem;line-height:1.2;font-weight:700;padding:.3rem 0;border-bottom:1px dashed var(--line);min-width:0;}',
    '.sl2-list .sl2-em{font-size:1.5rem;line-height:1;flex:none;}',
    '.sl2-shelf{width:100%;max-width:26rem;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.6rem;}',
    '.sl2-item{min-height:4.6rem;padding:.2rem .25rem;border-radius:var(--radius-sm);border:2px solid var(--line);background:var(--surface);',
    'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.1rem;cursor:pointer;color:var(--ink);font:inherit;min-width:0;',
    '}',
    '.sl2-item:hover:not(:disabled){border-color:var(--accent);}',
    '.sl2-item:disabled{cursor:default;}',
    '.sl2-item .sl2-em{font-size:1.85rem;line-height:1.1;}',
    '.sl2-item .sl2-word{font-size:1.1rem;font-weight:700;line-height:1.1;text-align:center;overflow-wrap:break-word;max-width:100%;}',
    '.sl2-item.sl2-picked{background:var(--memory-soft);border-color:var(--memory);border-width:3px;}',
    '.sl2-item.is-correct{background:var(--good-soft);border-color:var(--good);border-width:3px;color:var(--good);}',
    '.sl2-item.is-wrong{background:var(--bad-soft);border-color:var(--bad);border-width:3px;color:var(--bad);}',
    '.sl2-item.sl2-missed{background:var(--surface);border:3px dashed var(--sun);}',
    '.sl2-item.sl2-dim{opacity:.45;}',
    '.sl2-qty{font-weight:900;color:var(--memory);margin-inline-start:auto;font-variant-numeric:tabular-nums;}',
    '.sl2-count{font-size:1rem;font-weight:900;color:var(--memory);min-height:1.1rem;line-height:1.1;}',
    '.sl2-item.is-correct .sl2-count{color:var(--good);}',
    '.sl2-legend{display:flex;flex-wrap:wrap;gap:.3rem .9rem;justify-content:center;color:var(--ink-soft);font-size:1.1rem;line-height:1.3;margin:0;}',
    '.sl2-legend span{display:inline-flex;align-items:center;gap:.35rem;}',
    '.sl2-sw{display:inline-block;width:1rem;height:1rem;border-radius:4px;border:2px solid var(--line);}',
    '.sl2-sw.g{background:var(--good-soft);border-color:var(--good);}',
    '.sl2-sw.m{border:2px dashed var(--sun);}',
    '.sl2-sw.w{background:var(--bad-soft);border-color:var(--bad);}'
  ].join('');

  function clampLevel(l) {
    l = Math.round(Number(l) || 1);
    return Math.max(1, Math.min(30, l));
  }

  BrainGames.register({
    id: 'shopping-list',
    name: 'רשימת קניות',
    skill: 'memory',
    tagline: 'זכרו מה צריך לקנות במכולת',
    benefit: 'זיכרון לטווח קצר וזיכרון של משימות יומיומיות',
    instructions: [
      'תופיע רשימת קניות. קראו וזכרו את כל הפריטים.',
      'כשתהיו מוכנים לחצו "זכרתי, הלאה".',
      'על המדף יופיעו מוצרים רבים. לחצו על כל מה שהיה ברשימה.',
      'לחצו "בדיקה" כדי לראות מה זכרתם. ברמות הגבוהות זכרו גם כמה: כל לחיצה מוסיפה עוד אחד.'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = clampLevel(ctx.level);
      // Levels 21–30 keep the level-20 shelf (15 tiles, no extra scrolling) and add quantities:
      // some items must be bought 2 or 3 times ("חלב ×2"); a tap adds one, a tap past 3 clears.
      var QTY_LEN = [6, 7, 7, 8, 8, 8, 9, 9, 10, 10];
      var QTY_SHARE = [0.3, 0.4, 0.4, 0.5, 0.5, 0.6, 0.6, 0.7, 0.7, 0.8];
      var withQty = level >= 21;
      var listLen = withQty ? QTY_LEN[level - 21] : Math.round(3 + (level - 1) * 7 / 19); // 3 → 10
      // Shelf size is capped so every tile stays big and the round fits one phone screen
      // (12 tiles = 4 rows of 3 up to level 15; at 16–20 a little scrolling is allowed).
      var shelfMax = level <= 15 ? 12 : 15;
      var distractors = Math.min(listLen + Math.floor((level - 1) / 6), shelfMax - listLen);
      var sameCatRatio = Math.min(0.9, 0.9 * (level - 1) / 19);          // 0 → 0.9

      var round = 0;
      var score = 0;
      var itemsHit = 0;
      var itemsTotal = 0;

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({
            correct: score,
            total: ROUNDS,
            note: 'זכרתם רשימה מלאה ב-' + score + ' מתוך ' + ROUNDS + ' סבבים, ובסך הכול ' +
              itemsHit + ' מתוך ' + itemsTotal + ' פריטים'
          });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        playRound();
      }

      function buildRound() {
        var list = ctx.shuffle(BANK).slice(0, listLen);
        var inList = {}, cats = {};
        list.forEach(function (it) { inList[it.id] = true; cats[it.cat] = true; });
        var rest = BANK.filter(function (it) { return !inList[it.id]; });
        var same = ctx.shuffle(rest.filter(function (it) { return cats[it.cat]; }));
        var other = ctx.shuffle(rest.filter(function (it) { return !cats[it.cat]; }));
        var nSame = Math.min(same.length, Math.round(distractors * sameCatRatio));
        var picks = same.slice(0, nSame);
        var fromOther = other.slice(0, distractors - picks.length);
        picks = picks.concat(fromOther);
        if (picks.length < distractors) picks = picks.concat(same.slice(nSame, nSame + distractors - picks.length));
        var qty = {};
        list.forEach(function (it) { qty[it.id] = 1; });
        if (withQty) {
          var nQty = Math.max(1, Math.round(listLen * QTY_SHARE[level - 21]));
          ctx.shuffle(list).slice(0, nQty).forEach(function (it) { qty[it.id] = ctx.randInt(2, 3); });
        }
        return { list: list, inList: inList, qty: qty, shelf: ctx.shuffle(list.concat(picks)) };
      }

      function playRound() {
        root.innerHTML = '';
        var data = buildRound();

        // Memorise phase.
        ctx.setStatus('זכרו את רשימת הקניות');
        var note = el('div', { class: 'sl2-note' }, [
          el('p', { class: 'sl2-note-title' }, '🛒 צריך לקנות (' + listLen + ' פריטים):'),
          el('ul', { class: 'sl2-list' }, data.list.map(function (it) {
            return el('li', null, [
              el('span', { class: 'sl2-em', 'aria-hidden': 'true' }, it.emoji), el('span', null, it.word),
              data.qty[it.id] > 1 ? el('span', { class: 'sl2-qty' }, '×' + data.qty[it.id]) : null
            ]);
          }))
        ]);
        var readyBtn = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: startPick }, 'זכרתי, הלאה');
        root.appendChild(note);
        if (!ctx.timed) root.appendChild(el('p', { class: 'g-hint', style: { margin: '0' } }, 'אין מגבלת זמן.'));
        root.appendChild(el('div', { class: 'g-actions' }, readyBtn));
        ctx.studyTimer(readyBtn, 3000 + 1500 * data.list.length);

        var started = false;
        function startPick() {
          if (started) return;
          started = true;
          readyBtn.disabled = true;
          ctx.sound('tap');
          root.innerHTML = '';
          ctx.wait(300).then(showShelf);
        }

        function showShelf() {
          ctx.setStatus(withQty ? 'לחצו על המוצרים שברשימה. לחיצה נוספת מוסיפה עוד אחד'
            : 'לחצו על ' + listLen + ' המוצרים שהיו ברשימה');
          var picked = {};
          var pickedCount = 0;
          var accepting = true;

          var buttons = data.shelf.map(function (it) {
            var b = el('button', {
              class: 'sl2-item', type: 'button', 'aria-pressed': 'false',
              onclick: function () { toggle(it, b); }
            }, [el('span', { class: 'sl2-em', 'aria-hidden': 'true' }, it.emoji), el('span', { class: 'sl2-word' }, it.word),
              withQty ? el('span', { class: 'sl2-count', 'aria-hidden': 'true' }) : null]);
            return b;
          });
          var shelf = el('div', { class: 'sl2-shelf' }, buttons);
          var checkBtn = el('button', { class: 'btn btn-primary btn-lg', type: 'button', disabled: true, onclick: check, 'aria-live': 'polite' }, 'בדיקה');
          var actions = el('div', { class: 'g-actions' }, checkBtn);
          root.appendChild(shelf);
          root.appendChild(actions);
          updateCount();

          function updateCount() {
            checkBtn.textContent = pickedCount ? 'בדיקה (נבחרו ' + pickedCount + ')' : 'בדיקה';
            checkBtn.disabled = pickedCount === 0;
          }

          function toggle(it, b) {
            if (!accepting) return;
            ctx.sound('tap');
            if (withQty) {
              // 1 → 2 → 3 → none
              var c = ((picked[it.id] || 0) + 1) % 4;
              if (!picked[it.id]) pickedCount++;
              if (c) picked[it.id] = c; else { delete picked[it.id]; pickedCount--; }
              b.classList.toggle('sl2-picked', !!c);
              b.setAttribute('aria-pressed', c ? 'true' : 'false');
              b.setAttribute('aria-label', it.word + (c ? ', כמות ' + c : ''));
              b.querySelector('.sl2-count').textContent = c ? '×' + c : '';
              updateCount();
              return;
            }
            if (picked[it.id]) { delete picked[it.id]; pickedCount--; b.classList.remove('sl2-picked'); b.setAttribute('aria-pressed', 'false'); }
            else { picked[it.id] = true; pickedCount++; b.classList.add('sl2-picked'); b.setAttribute('aria-pressed', 'true'); }
            updateCount();
          }

          function check() {
            if (!accepting || pickedCount === 0) return;
            accepting = false;
            checkBtn.disabled = true;
            buttons.forEach(function (b) { b.disabled = true; });
            var hits = 0, wrong = 0, badQty = 0;
            data.shelf.forEach(function (it, i) {
              var b = buttons[i];
              b.classList.remove('sl2-picked');
              if (withQty && picked[it.id] && data.inList[it.id] && picked[it.id] !== data.qty[it.id]) {
                // right product, wrong amount: show the amount that was on the list
                b.classList.add('sl2-missed');
                b.querySelector('.sl2-count').textContent = '×' + data.qty[it.id] + ' (לא ×' + picked[it.id] + ')';
                badQty++;
              } else if (picked[it.id] && data.inList[it.id]) { b.classList.add('is-correct'); hits++; }
              else if (picked[it.id]) { b.classList.add('is-wrong'); wrong++; }
              else if (data.inList[it.id]) {
                b.classList.add('sl2-missed');
                if (withQty && data.qty[it.id] > 1) b.querySelector('.sl2-count').textContent = '×' + data.qty[it.id];
              }
              else { b.classList.add('sl2-dim'); }
            });
            itemsHit += hits;
            itemsTotal += listLen;
            var ok = hits === listLen && wrong === 0;
            if (ok) score++;
            var msg;
            if (ok) msg = undefined;
            else {
              msg = 'זכרתם ' + hits + ' מתוך ' + listLen;
              if (badQty) msg += badQty === 1 ? ', במוצר אחד הכמות לא נכונה' : ', ב-' + badQty + ' מוצרים הכמות לא נכונה';
              if (wrong) msg += wrong === 1 ? ', ומוצר אחד לא היה ברשימה' : ', ו-' + wrong + ' מוצרים לא היו ברשימה';
            }
            ctx.setStatus(ok ? 'מצוין! זכרתם את כל הרשימה' : 'זכרתם ' + hits + ' מתוך ' + listLen + (wrong ? ' · ' + (wrong === 1 ? 'טעות אחת' : wrong + ' טעויות') : ''));
            var legend = el('p', { class: 'sl2-legend' }, [
              el('span', null, [el('i', { class: 'sl2-sw g', 'aria-hidden': 'true' }), 'נכון']),
              hits < listLen ? el('span', null, [el('i', { class: 'sl2-sw m', 'aria-hidden': 'true' }), 'נשכח']) : null,
              wrong ? el('span', null, [el('i', { class: 'sl2-sw w', 'aria-hidden': 'true' }), 'לא ברשימה']) : null
            ]);
            root.insertBefore(legend, actions);
            ctx.feedback(ok, msg).then(function () {
              var nextBtn = el('button', {
                class: 'btn btn-primary btn-lg', type: 'button',
                onclick: function () { nextBtn.disabled = true; ctx.sound('tap'); nextRound(); }
              }, round >= ROUNDS ? 'לתוצאות' : 'לרשימה הבאה');
              actions.innerHTML = '';
              actions.appendChild(nextBtn);
            });
          }
        }
      }

      nextRound();
    }
  });
})();
