/* מה זה? — see a picture (an animal, a tool, a vehicle…) and build its name from letter tiles.
   Practises recalling the names of everyday things (memory / word retrieval). */
(function () {
  'use strict';

  var ROUNDS = 6;

  /* Picture bank: 'emoji name' pairs by category and tier
     (1 = everyday and short, 2 = common, 3 = less frequent or longer).
     One-word names only, no geresh, standard ktiv male. */
  var BANK = [
    { label: 'בעל חיים', tiers: [
      '🐶 כלב,🐱 חתול,🐟 דג,🐴 סוס,🐄 פרה,🐑 כבשה,🐘 פיל,🐭 עכבר,🐢 צב,🦁 אריה,🐻 דוב,🐒 קוף,🐍 נחש,🐰 ארנב,🦆 ברווז,🐝 דבורה,🐦 ציפור,🐐 עז',
      '🦓 זברה,🐪 גמל,🐊 תנין,🦋 פרפר,🐌 חילזון,🦉 ינשוף,🐬 דולפין,🐋 לוויתן,🦀 סרטן,🐜 נמלה,🦊 שועל,🐺 זאב,🦅 נשר,🦜 תוכי,🦚 טווס,🦘 קנגורו,🐸 צפרדע,🐓 תרנגול,🦈 כריש,🦢 ברבור,🐛 זחל,🐆 נמר,🦏 קרנף,🐙 תמנון,🐧 פינגווין',
      '🦔 קיפוד,🦇 עטלף,🦎 לטאה,🦂 עקרב,🦟 יתוש,🦦 לוטרה,🦥 עצלן,🦗 צרצר,🦛 היפופוטם,🦩 פלמינגו,🦌 אייל,🐂 שור'
    ] },
    { label: 'פרי', tiers: [
      '🍎 תפוח,🍌 בננה,🍇 ענבים,🍓 תות,🍉 אבטיח,🍋 לימון,🍐 אגס,🍊 תפוז',
      '🍑 אפרסק,🍒 דובדבן,🍍 אננס,🥝 קיווי,🥥 קוקוס,🥑 אבוקדו',
      '🌰 ערמון'
    ] },
    { label: 'ירק', tiers: [
      '🥕 גזר,🌽 תירס,🍅 עגבנייה,🥒 מלפפון',
      '🍆 חציל,🧅 בצל,🧄 שום,🌶️ פלפל,🥦 ברוקולי,🍄 פטרייה,🥜 בוטנים',
      ''
    ] },
    { label: 'אוכל ושתייה', tiers: [
      '🍞 לחם,🧀 גבינה,🥚 ביצה,🍕 פיצה,🎂 עוגה,🍦 גלידה,☕ קפה,🍵 תה,🥛 חלב,🍯 דבש',
      '🍔 המבורגר,🌭 נקניקייה,🍪 עוגייה,🍫 שוקולד,🍬 סוכרייה,🧂 מלח,🍷 יין,🍾 בקבוק',
      '🥨 בייגלה,🥐 קרואסון'
    ] },
    { label: 'בבית', tiers: [
      '🚪 דלת,🛏️ מיטה,🛋️ ספה,🪑 כיסא,⏰ שעון,📺 טלוויזיה,☎️ טלפון,💡 נורה,🔑 מפתח,📖 ספר,🎁 מתנה,🎈 בלון,🕯️ נר,☂️ מטרייה,👓 משקפיים',
      '🛁 אמבטיה,🚿 מקלחת,🧸 דובי,💻 מחשב,📷 מצלמה,🔔 פעמון,✉️ מעטפה,🧳 מזוודה,🎒 ילקוט,👜 תיק,💍 טבעת,👑 כתר,🧹 מטאטא,🧽 ספוג,🔒 מנעול,📻 רדיו,🔋 סוללה,🖨️ מדפסת,⌨️ מקלדת,🧺 סל',
      '🧯 מטפה,🧷 סיכה,📌 נעץ,🧵 חוט,🧶 צמר,🛒 עגלה'
    ] },
    { label: 'כלי עבודה', tiers: [
      '🔨 פטיש,✂️ מספריים,🔪 סכין,🥄 כף,🍳 מחבת,✏️ עיפרון,🖊️ עט',
      '🔦 פנס,📏 סרגל,🔩 בורג,🧲 מגנט,🪓 גרזן,⚖️ מאזניים,📎 מהדק',
      '🖌️ מכחול,🧭 מצפן,🔭 טלסקופ,🔬 מיקרוסקופ,🧪 מבחנה,⛏️ מכוש,⚓ עוגן'
    ] },
    { label: 'כלי תחבורה', tiers: [
      '🚗 מכונית,🚌 אוטובוס,🚲 אופניים,✈️ מטוס,🚂 רכבת,🚢 ספינה,🚕 מונית,🚚 משאית',
      '🚁 מסוק,🚀 טיל,🛵 קטנוע,🏍️ אופנוע,🚑 אמבולנס,🚜 טרקטור,🚤 סירה,🛴 קורקינט',
      '⛵ מפרשית,🚠 רכבל,🚒 כבאית,🚓 ניידת'
    ] },
    { label: 'בטבע', tiers: [
      '☀️ שמש,🌙 ירח,⭐ כוכב,☁️ ענן,🔥 אש,🌳 עץ,🌹 ורד,🌈 קשת',
      '⚡ ברק,💧 טיפה,🌊 גל,🌵 קקטוס,🌴 דקל,🍁 עלה,⛰️ הר,🏝️ אי',
      '🌻 חמנייה,🌷 צבעוני,🍀 תלתן,🌲 אורן'
    ] },
    { label: 'בגד', tiers: [
      '👕 חולצה,👗 שמלה,🧦 גרביים,🧥 מעיל,🧢 כובע,👖 מכנסיים,👟 נעל',
      '🧣 צעיף,🧤 כפפות,👢 מגף',
      ''
    ] },
    { label: 'חלק בגוף', tiers: [
      '👁️ עין,👂 אוזן,👃 אף,✋ יד,🦵 רגל,❤️ לב,🦷 שן,👅 לשון',
      '🧠 מוח',
      ''
    ] },
    { label: 'בניין ומקום', tiers: [
      '🏠 בית',
      '⛺ אוהל,🏰 טירה,🌉 גשר',
      '💎 יהלום,🚦 רמזור,⛲ מזרקה,🗼 מגדל,🏭 מפעל'
    ] },
    { label: 'מוזיקה ומשחק', tiers: [
      '🥁 תוף,⚽ כדור',
      '🎸 גיטרה,🎹 פסנתר,🎻 כינור,🎺 חצוצרה,🏆 גביע,🎲 קובייה,🧩 פאזל',
      '🎷 סקסופון'
    ] }
  ];

  var TO_REG = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
  var TO_FIN = { 'כ': 'ך', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ' };
  var DECOYS = 'אבגדהוזחטילמנסעפצקרשת'.split('');
  // Letters that look or sound alike, for the hardest extra tiles.
  var LOOK = {
    'ה': ['ח', 'ת'], 'ח': ['ה', 'ת'], 'ת': ['ח', 'ט'], 'ט': ['ת'], 'ב': ['כ', 'פ'], 'כ': ['ב', 'ק'], 'ק': ['כ'],
    'פ': ['ב'], 'ס': ['ש', 'ם'], 'ש': ['ס'], 'ד': ['ר'], 'ר': ['ד'], 'א': ['ע'], 'ע': ['א'], 'ו': ['ז', 'י'],
    'ז': ['ו'], 'י': ['ו'], 'מ': ['ס'], 'נ': ['ג'], 'ג': ['נ'], 'צ': ['ע']
  };

  function normLetters(w) { return w.split('').map(function (c) { return TO_REG[c] || c; }); }
  function withFinal(letters) {
    var a = letters.slice();
    var last = a.length - 1;
    if (last >= 0 && TO_FIN[a[last]]) a[last] = TO_FIN[a[last]];
    return a.join('');
  }

  var ITEMS = [];
  BANK.forEach(function (c) {
    c.tiers.forEach(function (list, t) {
      list.split(',').forEach(function (pair) {
        pair = pair.trim();
        if (!pair) return;
        var sp = pair.indexOf(' ');
        var e = pair.slice(0, sp), w = pair.slice(sp + 1);
        var n = normLetters(w);
        ITEMS.push({ e: e, w: w, n: n, len: n.length, tier: t + 1, label: c.label });
      });
    });
  });

  /* Per level (1–30): word tiers, word length, extra letter tiles (dec), how many of those look like
     letters of the word (look), the category hint (cat, up to level 8) and the first letter given (first).
     Up to level 15 at most 8 tiles, later at most 12, so the picture, the word and the tiles fit one screen. */
  var LEVELS = [
    { t: [1], len: [2, 3], dec: 0, cat: true, first: true }, // 1
    { t: [1], len: [2, 4], dec: 0, cat: true, first: true }, // 2
    { t: [1], len: [3, 4], dec: 0, cat: true },              // 3
    { t: [1], len: [3, 4], dec: 0, cat: true },              // 4
    { t: [1], len: [3, 5], dec: 0, cat: true },              // 5
    { t: [1, 2], len: [3, 5], dec: 0, cat: true },           // 6
    { t: [1, 2], len: [3, 5], dec: 1, cat: true },           // 7
    { t: [1, 2], len: [4, 5], dec: 1, cat: true },           // 8
    { t: [2], len: [3, 5], dec: 1 },                         // 9
    { t: [2], len: [4, 5], dec: 1 },                         // 10
    { t: [2], len: [4, 6], dec: 1 },                         // 11
    { t: [2], len: [4, 6], dec: 2 },                         // 12
    { t: [1, 2], len: [5, 6], dec: 2 },                      // 13
    { t: [2], len: [5, 6], dec: 2 },                         // 14
    { t: [2, 3], len: [4, 6], dec: 2 },                      // 15
    { t: [2, 3], len: [5, 7], dec: 2 },                      // 16
    { t: [3], len: [4, 6], dec: 2 },                         // 17
    { t: [2, 3], len: [5, 7], dec: 3 },                      // 18
    { t: [3], len: [4, 7], dec: 3 },                         // 19
    { t: [3], len: [5, 7], dec: 3 },                         // 20
    { t: [3], len: [5, 8], dec: 3 },                         // 21
    { t: [3], len: [4, 7], dec: 3, look: 1 },                // 22
    { t: [2, 3], len: [6, 8], dec: 3, look: 1 },             // 23
    { t: [3], len: [5, 8], dec: 3, look: 2 },                // 24
    { t: [3], len: [5, 8], dec: 4, look: 2 },                // 25
    { t: [3], len: [6, 8], dec: 4, look: 2 },                // 26
    { t: [3], len: [5, 8], dec: 4, look: 3 },                // 27
    { t: [2, 3], len: [6, 9], dec: 3, look: 3 },             // 28
    { t: [2, 3], len: [6, 9], dec: 4, look: 3 },             // 29
    { t: [2, 3], len: [7, 9], dec: 4, look: 4 }              // 30
  ];

  /* Tiles: the word's letters plus extra letters that are not in the word; never in the right order. */
  function makeTiles(letters, nDecoy, nLook, shuffle, pick) {
    var tiles = letters.slice();
    var extra = [];
    for (var d = 0; d < nDecoy; d++) {
      var near = [];
      if (d < nLook) {
        letters.forEach(function (l) {
          (LOOK[l] || []).forEach(function (x) {
            if (tiles.indexOf(x) === -1 && extra.indexOf(x) === -1 && near.indexOf(x) === -1 && !TO_REG[x]) near.push(x);
          });
        });
      }
      var free = near.length ? near : DECOYS.filter(function (l) { return tiles.indexOf(l) === -1 && extra.indexOf(l) === -1; });
      extra.push(pick(free));
    }
    tiles = tiles.concat(extra);
    var target = letters.join('');
    for (var tries = 0; tries < 100; tries++) {
      var order = shuffle(tiles.map(function (_, i) { return i; }));
      var seq = order.filter(function (i) { return i < letters.length; }).map(function (i) { return tiles[i]; }).join('');
      if (seq !== target || letters.length < 2) return order.map(function (i) { return tiles[i]; });
    }
    return tiles.slice().reverse();
  }

  var CSS = [
    '.wt-wrap{width:100%;display:flex;flex-direction:column;align-items:center;gap:.6rem}',
    /* picture in the middle, hint / clear on its sides: one row instead of three */
    '.wt-top{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:.5rem;width:100%}',
    '.wt-top .btn{min-width:0;padding-inline:.6rem}',
    '.wt-mid{display:flex;flex-direction:column;align-items:center;gap:.4rem}',
    '.wt-pic{width:6.25rem;height:6.25rem;display:grid;place-items:center;border-radius:var(--radius);',
    'background:var(--memory-soft);border:3px solid var(--memory);font-size:4.2rem;line-height:1}',
    '.wt-cat{display:inline-block;padding:.25rem 1rem;border-radius:999px;background:var(--memory-soft);color:var(--memory);font-weight:800;font-size:1.1rem}',
    /* at most 5 slots per line; longer names wrap instead of shrinking the slots */
    '.wt-slots{--n:4;display:grid;grid-template-columns:repeat(var(--n),minmax(2.9rem,3.4rem));gap:.5rem;justify-content:center;width:100%;direction:rtl}',
    '.wt-slot{min-width:0;height:3.2rem;padding:0;border-radius:var(--radius-sm);border:2px dashed var(--line);background:var(--surface-2);',
    'color:var(--ink);font-family:var(--font-display);font-weight:900;font-size:1.8rem;cursor:pointer;line-height:1}',
    '.wt-slot.is-filled{border-style:solid;border-color:var(--accent);background:var(--accent-soft)}',
    '.wt-slot.is-hint{border-style:solid;border-color:var(--sun);background:var(--sun-soft);cursor:default}',
    '.wt-slot.is-correct{border-style:solid;border-color:var(--good);background:var(--good-soft);color:var(--good)}',
    '.wt-slot.is-wrong{border-style:solid;border-color:var(--bad);background:var(--bad-soft);color:var(--bad)}',
    '.wt-slot:disabled{cursor:default}',
    '.wt-tiles{display:flex;flex-wrap:wrap;justify-content:center;gap:.5rem;width:100%;max-width:17rem;direction:rtl}',
    '.wt-tile{width:3.6rem;height:3.6rem;padding:0;border-radius:var(--radius-sm);border:2px solid var(--line);background:var(--surface);',
    'box-shadow:var(--shadow);color:var(--ink);font-family:var(--font-display);font-weight:900;font-size:2.1rem;line-height:1;cursor:pointer;',
    'transition:background-color .2s,border-color .2s}',
    '.wt-tile:hover:not(:disabled){border-color:var(--accent);background:var(--accent-soft)}',
    '.wt-tile.is-used{background:transparent;border-style:dashed;box-shadow:none;color:transparent}',
    '.wt-tile:disabled{cursor:default}',
  ].join('');

  BrainGames.register({
    id: 'what-is-this',
    name: 'מה זה?',
    skill: 'memory',
    tagline: 'הסתכלו בתמונה וכתבו איך קוראים לה',
    benefit: 'שליפת שמות של דברים מהזיכרון',
    startLevel: 1,
    instructions: [
      'תופיע תמונה: בעל חיים, כלי, כלי תחבורה ועוד.',
      'לחצו על האותיות לפי הסדר כדי לכתוב את השם שלה, מימין לשמאל.',
      'ברמות מתקדמות יש גם אותיות מיותרות. לחיצה על אות שהנחתם מחזירה אותה.',
      'לא נזכרים? לחצו "רמז" ותקבלו את האות הבאה. אין שעון.'
    ],
    css: CSS,
    _items: ITEMS,
    _levels: LEVELS,
    start: function (root, ctx) {
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var maxTiles = level <= 15 ? 8 : 12;
      var round = 0;
      var correct = 0;
      var hintRounds = 0;
      var usedWords = {};
      var usedLabels = [];

      function pickItem() {
        function fits(o, anyTier) {
          return !usedWords[o.w] && o.len >= spec.len[0] && o.len <= spec.len[1] && (anyTier || spec.t.indexOf(o.tier) !== -1);
        }
        var pool = ITEMS.filter(function (o) { return fits(o, false); });
        if (pool.length < 2) pool = ITEMS.filter(function (o) { return fits(o, true); });
        if (!pool.length) pool = ITEMS.filter(function (o) { return !usedWords[o.w]; });
        var fresh = pool.filter(function (o) { return usedLabels.indexOf(o.label) === -1; });
        var it = ctx.pick(fresh.length ? fresh : pool);
        usedWords[it.w] = true;
        usedLabels.push(it.label);
        return it;
      }

      function finish() {
        var note = 'זיהיתם ' + correct + ' מתוך ' + ROUNDS + ' תמונות.';
        if (hintRounds > 0) note += ' ב-' + hintRounds + ' מהן נעזרתם ברמז.';
        else if (correct === ROUNDS) note += ' בלי אף רמז!';
        ctx.finish({ correct: correct, total: ROUNDS, note: note });
      }

      function nextRound() {
        round++;
        if (round > ROUNDS) { finish(); return; }
        ctx.setProgress(round, ROUNDS);

        var item = pickItem();
        var target = item.n;
        var n = target.length;
        var nDecoy = Math.max(0, Math.min(spec.dec, maxTiles - n));
        var tiles = makeTiles(target, nDecoy, Math.min(spec.look || 0, nDecoy), ctx.shuffle, ctx.pick);
        var tileUsed = tiles.map(function () { return false; });
        var slots = [];
        for (var i = 0; i < n; i++) slots.push(null);
        var hints = 0;
        var attempts = 0;
        var busy = false;
        var answered = false;

        var slotCols = Math.ceil(n / Math.ceil(n / 5));
        var slotsEl = ctx.el('div', { class: 'wt-slots', style: { '--n': slotCols }, 'aria-label': 'השם שכתבתם' });
        var tilesEl = ctx.el('div', { class: 'wt-tiles', 'aria-label': 'אותיות' });
        // messages go to the status line above the board, so the board never grows mid-round
        var baseStatus = spec.first ? 'מה זה? האות הראשונה כבר במקום'
          : nDecoy ? 'מה זה? ' + (nDecoy === 1 ? 'יש אות אחת מיותרת' : 'יש ' + nDecoy + ' אותיות מיותרות')
            : 'מה זה? כתבו את השם בעזרת האותיות';
        function say(text) { ctx.setStatus(text || baseStatus); }
        var clearBtn = ctx.el('button', { class: 'btn btn-quiet', type: 'button', onclick: onClear }, 'ניקוי');
        var hintBtn = ctx.el('button', { class: 'btn btn-secondary', type: 'button', 'aria-label': 'רמז: גלו את האות הבאה', onclick: onHint }, 'רמז');
        var slotBtns = [];
        var tileBtns = [];

        for (var s = 0; s < n; s++) {
          (function (j) {
            var b = ctx.el('button', { class: 'wt-slot', type: 'button', onclick: function () { onSlot(j); } });
            slotBtns.push(b);
            slotsEl.appendChild(b);
          })(s);
        }
        tiles.forEach(function (l, ti) {
          var b = ctx.el('button', { class: 'wt-tile', type: 'button', text: l, onclick: function () { onTile(ti); } });
          tileBtns.push(b);
          tilesEl.appendChild(b);
        });

        if (spec.first) placeLocked(0);

        say();

        root.innerHTML = '';
        root.appendChild(ctx.el('div', { class: 'wt-wrap' }, [
          ctx.el('div', { class: 'wt-top' }, [
            hintBtn,
            ctx.el('div', { class: 'wt-mid' }, [
              ctx.el('div', { class: 'wt-pic', role: 'img', 'aria-label': 'תמונה לזיהוי' }, ctx.el('span', { 'aria-hidden': 'true' }, item.e)),
              ctx.el('span', { class: 'wt-cat', text: (spec.cat ? item.label + ' · ' : '') + n + ' אותיות' })
            ]),
            clearBtn
          ]),
          slotsEl,
          tilesEl
        ]));
        render();

        function letterAt(j) { return slots[j] ? tiles[slots[j].ti] : ''; }

        function render() {
          for (var j = 0; j < n; j++) {
            var b = slotBtns[j];
            var l = letterAt(j);
            if (l && j === n - 1 && TO_FIN[l]) l = TO_FIN[l];
            b.textContent = l;
            b.className = 'wt-slot' + (slots[j] ? (slots[j].locked ? ' is-hint' : ' is-filled') : '');
            b.setAttribute('aria-label', slots[j] ? 'אות ' + l + (slots[j].locked ? ' (רמז)' : ', לחצו כדי להחזיר') : 'משבצת ריקה');
          }
          tileBtns.forEach(function (b, ti) {
            b.classList.toggle('is-used', tileUsed[ti]);
            b.disabled = answered || tileUsed[ti];
          });
          hintBtn.disabled = answered;
          clearBtn.disabled = answered || !slots.some(function (o) { return o && !o.locked; });
        }

        function firstEmpty() {
          for (var j = 0; j < n; j++) if (!slots[j]) return j;
          return -1;
        }

        function onTile(ti) {
          if (answered || busy || tileUsed[ti]) return;
          var j = firstEmpty();
          if (j === -1) return;
          ctx.sound('tap');
          slots[j] = { ti: ti, locked: false };
          tileUsed[ti] = true;
          say();
          render();
          if (firstEmpty() === -1) check();
        }

        function onSlot(j) {
          if (answered || busy || !slots[j] || slots[j].locked) return;
          tileUsed[slots[j].ti] = false;
          slots[j] = null;
          render();
        }

        function onClear() {
          if (answered || busy) return;
          for (var j = 0; j < n; j++) {
            if (slots[j] && !slots[j].locked) { tileUsed[slots[j].ti] = false; slots[j] = null; }
          }
          say();
          render();
        }

        /* Puts the correct letter into slot j and locks it. */
        function placeLocked(j) {
          if (slots[j]) { tileUsed[slots[j].ti] = false; slots[j] = null; }
          var need = target[j];
          var ti = -1;
          for (var t = 0; t < tiles.length; t++) if (!tileUsed[t] && tiles[t] === need) { ti = t; break; }
          if (ti === -1) {
            for (var k = 0; k < n; k++) {
              if (slots[k] && !slots[k].locked && tiles[slots[k].ti] === need) { ti = slots[k].ti; slots[k] = null; break; }
            }
          }
          if (ti === -1) return;
          slots[j] = { ti: ti, locked: true };
          tileUsed[ti] = true;
        }

        function onHint() {
          if (answered || busy) return;
          var j = -1;
          for (var k = 0; k < n; k++) {
            if (!slots[k] || tiles[slots[k].ti] !== target[k]) { j = k; break; }
          }
          if (j === -1) return;
          hints++;
          ctx.sound('tap');
          placeLocked(j);
          say('האות במקום ' + (j + 1) + ' היא ' + (j === n - 1 && TO_FIN[target[j]] ? TO_FIN[target[j]] : target[j]) + '.');
          render();
          if (firstEmpty() === -1) check();
        }

        function setSlotState(cls) {
          slotBtns.forEach(function (b) { b.classList.remove('is-filled', 'is-hint'); b.classList.add(cls); });
        }

        function check() {
          var built = [];
          for (var j = 0; j < n; j++) built.push(tiles[slots[j].ti]);
          var ok = built.join('') === target.join('');
          if (ok) {
            answered = true;
            correct++;
            if (hints > 0) hintRounds++;
            render();
            setSlotState('is-correct');
            slotBtns.forEach(function (b) { b.disabled = true; });
            say('נכון! זה ' + item.w + (hints > 0 ? ' (בעזרת ' + (hints === 1 ? 'רמז אחד' : hints + ' רמזים') + ')' : '') + '.');
            ctx.feedback(true).then(function () { return ctx.wait(800); }).then(nextRound);
            return;
          }
          attempts++;
          if (attempts < 2) {
            busy = true;
            setSlotState('is-wrong');
            say('"' + withFinal(built) + '" לא נכון. נסו שוב');
            ctx.feedback(false, 'עוד לא, נסו שוב').then(function () { busy = false; render(); });
            return;
          }
          // Second wrong attempt: show the name.
          answered = true;
          for (var r = 0; r < n; r++) { if (slots[r]) tileUsed[slots[r].ti] = false; slots[r] = null; }
          for (var q = 0; q < n; q++) placeLocked(q);
          render();
          setSlotState('is-correct');
          slotBtns.forEach(function (b) { b.disabled = true; });
          say('זה ' + item.w + ' (' + item.label + ').');
          ctx.feedback(false, 'זה ' + item.w).then(function () { return ctx.wait(1800); }).then(nextRound);
        }
      }

      nextRound();
      return function cleanup() { root.innerHTML = ''; };
    }
  });
})();
