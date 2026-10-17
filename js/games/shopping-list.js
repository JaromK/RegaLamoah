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
    '.sl2-note{width:100%;max-width:30rem;background:var(--sun-soft);border:2px solid var(--sun);border-radius:var(--radius);padding:1rem 1.1rem;}',
    '.sl2-note-title{font-weight:800;font-size:1.15rem;text-align:center;margin:0 0 .6rem;}',
    '.sl2-list{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(7.5rem,1fr));gap:.2rem 1rem;}',
    '.sl2-list li{display:flex;align-items:center;gap:.5rem;font-size:1.3rem;font-weight:700;padding:.3rem 0;border-bottom:1px dashed var(--line);min-width:0;}',
    '.sl2-list .sl2-em{font-size:1.7rem;line-height:1;flex:none;}',
    '.sl2-shelf{width:100%;max-width:34rem;display:grid;grid-template-columns:repeat(auto-fill,minmax(5.4rem,1fr));gap:.5rem;}',
    '.sl2-item{min-height:5.4rem;padding:.45rem .3rem;border-radius:var(--radius-sm);border:2px solid var(--line);background:var(--surface);',
    'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.2rem;cursor:pointer;color:var(--ink);font:inherit;min-width:0;',
    '}',
    '.sl2-item:hover:not(:disabled){border-color:var(--accent);}',
    '.sl2-item:disabled{cursor:default;}',
    '.sl2-item .sl2-em{font-size:2rem;line-height:1.1;}',
    '.sl2-item .sl2-word{font-size:.95rem;font-weight:700;line-height:1.2;text-align:center;overflow-wrap:break-word;max-width:100%;}',
    '.sl2-item.sl2-picked{background:var(--memory-soft);border-color:var(--memory);border-width:3px;}',
    '.sl2-item.is-correct{background:var(--good-soft);border-color:var(--good);border-width:3px;color:var(--good);}',
    '.sl2-item.is-wrong{background:var(--bad-soft);border-color:var(--bad);border-width:3px;color:var(--bad);}',
    '.sl2-item.sl2-missed{background:var(--surface);border:3px dashed var(--sun);}',
    '.sl2-item.sl2-dim{opacity:.45;}',
    '.sl2-count{font-size:1.15rem;font-weight:700;text-align:center;font-variant-numeric:tabular-nums;margin:0;}',
    '.sl2-legend{display:flex;flex-wrap:wrap;gap:.4rem 1rem;justify-content:center;color:var(--ink-soft);font-size:.95rem;}',
    '.sl2-legend span{display:inline-flex;align-items:center;gap:.35rem;}',
    '.sl2-sw{display:inline-block;width:1rem;height:1rem;border-radius:4px;border:2px solid var(--line);}',
    '.sl2-sw.g{background:var(--good-soft);border-color:var(--good);}',
    '.sl2-sw.m{border:2px dashed var(--sun);}',
    '.sl2-sw.w{background:var(--bad-soft);border-color:var(--bad);}'
  ].join('');

  function clampLevel(l) {
    l = Math.round(Number(l) || 1);
    return Math.max(1, Math.min(20, l));
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
      'לחצו "בדיקה" כדי לראות מה זכרתם.'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = clampLevel(ctx.level);
      var listLen = Math.round(3 + (level - 1) * 7 / 19);              // 3 → 10
      var distractors = Math.min(listLen + Math.floor((level - 1) / 6), 20 - listLen);
      var sameCatRatio = 0.9 * (level - 1) / 19;                         // 0 → 0.9

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
        return { list: list, inList: inList, shelf: ctx.shuffle(list.concat(picks)) };
      }

      function playRound() {
        root.innerHTML = '';
        var data = buildRound();

        // Memorise phase.
        ctx.setStatus('זכרו את רשימת הקניות');
        var note = el('div', { class: 'sl2-note' }, [
          el('p', { class: 'sl2-note-title' }, '🛒 צריך לקנות (' + listLen + ' פריטים):'),
          el('ul', { class: 'sl2-list' }, data.list.map(function (it) {
            return el('li', null, [el('span', { class: 'sl2-em', 'aria-hidden': 'true' }, it.emoji), el('span', null, it.word)]);
          }))
        ]);
        var readyBtn = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: startPick }, 'זכרתי, הלאה');
        root.appendChild(note);
        if (!ctx.timed) root.appendChild(el('p', { class: 'g-hint' }, 'אין מגבלת זמן. קחו את הזמן שאתם צריכים.'));
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
          ctx.setStatus('לחצו על כל מה שהיה ברשימה');
          var picked = {};
          var pickedCount = 0;
          var accepting = true;

          var buttons = data.shelf.map(function (it) {
            var b = el('button', {
              class: 'sl2-item', type: 'button', 'aria-pressed': 'false',
              onclick: function () { toggle(it, b); }
            }, [el('span', { class: 'sl2-em', 'aria-hidden': 'true' }, it.emoji), el('span', { class: 'sl2-word' }, it.word)]);
            return b;
          });
          var shelf = el('div', { class: 'sl2-shelf' }, buttons);
          var countLine = el('p', { class: 'sl2-count', 'aria-live': 'polite' }, '');
          var checkBtn = el('button', { class: 'btn btn-primary btn-lg', type: 'button', disabled: true, onclick: check }, 'בדיקה');
          var actions = el('div', { class: 'g-actions' }, checkBtn);
          root.appendChild(shelf);
          root.appendChild(countLine);
          root.appendChild(actions);
          updateCount();

          function updateCount() {
            countLine.textContent = 'בחרתם ' + pickedCount + ' מוצרים · ברשימה היו ' + listLen;
            checkBtn.disabled = pickedCount === 0;
          }

          function toggle(it, b) {
            if (!accepting) return;
            ctx.sound('tap');
            if (picked[it.id]) { delete picked[it.id]; pickedCount--; b.classList.remove('sl2-picked'); b.setAttribute('aria-pressed', 'false'); }
            else { picked[it.id] = true; pickedCount++; b.classList.add('sl2-picked'); b.setAttribute('aria-pressed', 'true'); }
            updateCount();
          }

          function check() {
            if (!accepting || pickedCount === 0) return;
            accepting = false;
            checkBtn.disabled = true;
            buttons.forEach(function (b) { b.disabled = true; });
            var hits = 0, wrong = 0;
            data.shelf.forEach(function (it, i) {
              var b = buttons[i];
              b.classList.remove('sl2-picked');
              if (picked[it.id] && data.inList[it.id]) { b.classList.add('is-correct'); hits++; }
              else if (picked[it.id]) { b.classList.add('is-wrong'); wrong++; }
              else if (data.inList[it.id]) { b.classList.add('sl2-missed'); }
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
              if (wrong) msg += wrong === 1 ? ', ומוצר אחד לא היה ברשימה' : ', ו-' + wrong + ' מוצרים לא היו ברשימה';
            }
            countLine.textContent = 'זכרתם ' + hits + ' מתוך ' + listLen + ' פריטים' + (wrong ? ' · ' + wrong + ' בחירות שגויות' : '');
            ctx.setStatus(ok ? 'מצוין! זכרתם את כל הרשימה' : 'כך נראתה הרשימה');
            var legend = el('div', { class: 'sl2-legend' }, [
              el('span', null, [el('i', { class: 'sl2-sw g', 'aria-hidden': 'true' }), 'בחרתם נכון']),
              hits < listLen ? el('span', null, [el('i', { class: 'sl2-sw m', 'aria-hidden': 'true' }), 'היה ברשימה ונשכח']) : null,
              wrong ? el('span', null, [el('i', { class: 'sl2-sw w', 'aria-hidden': 'true' }), 'לא היה ברשימה']) : null
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
