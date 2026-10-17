/* מילה מבולגנת — rebuild a Hebrew word from its shuffled letters. */
(function () {
  'use strict';

  var ROUNDS = 6;

  /* Word bank by category. The label is shown as "רמז: <label>".
     Words were chosen so their letters do not spell another common word
     (e.g. no בצל/צלב, רופא/אפור, חום/מוח). */
  var BANK = [
    { label: 'פרי', words: 'תות אגס תפוח בננה מלון שזיף תאנה תפוז אננס מנגו משמש רימון אבטיח אפרסק לימון ענבים קיווי דובדבן אבוקדו אשכולית קלמנטינה אוכמניות' },
    { label: 'ירק', words: 'שום חסה סלק גזר פלפל חציל צנון תירס דלעת בטטה קישוא אפונה מלפפון כרובית שעועית עגבנייה ברוקולי פטרוזיליה' },
    { label: 'בעל חיים', words: 'פיל סוס דוב כלב נמר זאב קוף נחש כבש צבי חתול אריה ארנב זברה סנאי תנין קרנף עכבר אייל צפרדע תמנון עכביש גורילה קנגורו דולפין לוויתן חילזון שימפנזה היפופוטם' },
    { label: 'ציפור', words: 'נשר יונה תוכי דרור טווס ברווז ינשוף חסידה תרנגול סנונית פלמינגו תרנגולת פינגווין' },
    { label: 'חלק בגוף', words: 'עין בטן אוזן גרון מרפק אצבע לשון סנטר עפעף צוואר קרסול ריסים אגודל ריאות שפתיים ציפורן' },
    { label: 'בגד', words: 'שמלה מעיל כובע צעיף סנדל חולצה חצאית עניבה סוודר חליפה כפפות חגורה מטפחת גופייה נעליים מגפיים מכנסיים' },
    { label: 'רהיט', words: 'ספה מדף כיסא מיטה שידה שולחן כורסה ספרייה' },
    { label: 'בבית', words: 'דלת מראה שטיח כרית מקרר מזגן חלון מפתח שעון מנורה וילון שמיכה מקלחת מרפסת אמבטיה מדרגות טלוויזיה' },
    { label: 'כלי מטבח', words: 'סיר מזלג כפית צלחת מחבת מצקת מסננת מערוך קולפן בקבוק מטרפה קומקום מיקרוגל פומפייה' },
    { label: 'מקצוע', words: 'נגר צלם גנן רופא מורה שוטר טייס רוקח כבאי אופה צייר שחקן מלצר דייג חקלאי שרברב מתכנת מהנדס טכנאי חשמלאי ספרנית וטרינר עיתונאי פסיכולוג' },
    { label: 'כלי תחבורה', words: 'רכבת מטוס מסוק רכבל משאית מונית ספינה צוללת מכונית אופנוע טרקטור מעבורת אוטובוס אופניים קורקינט אמבולנס' },
    { label: 'בטבע', words: 'נהר פרח שמש ירח יער אגם חוף עמק מפל סלע ענן רעם קשת כוכב מדבר מערה גבעה ערפל סופה יבשת שקיעה זריחה קרחון אוקיינוס' },
    { label: 'צבע', words: 'זהב כסף כחול ירוק צהוב סגול כתום ורוד שחור תכלת בורדו טורקיז' },
    { label: 'ספורט', words: 'סקי טניס ריצה יוגה שחמט גולף שחייה אגרוף חתירה רכיבה כדורגל כדורסל כדורעף כדוריד התעמלות טריאתלון' },
    { label: 'כלי נגינה', words: 'תוף חליל עוגב גיטרה פסנתר כינור חצוצרה מפוחית קלרינט סקסופון טרומבון אקורדיון מצילתיים' },
    { label: 'רגש', words: 'כעס פחד שמחה אהבה קנאה בושה הקלה תקווה געגוע הפתעה גאווה אכזבה ייאוש שלווה סקרנות בדידות סבלנות התרגשות' },
    { label: 'משפחה', words: 'אמא אבא סבא דוד נכד כלה חתן בעל סבתא אחות דודה נכדה חותן הורים אחיין נכדים משפחה תאומים' },
    { label: 'מאכל', words: 'מרק סלט דבש פיצה ביצה פסטה עוגה ריבה חומוס פלאפל גבינה גלידה שניצל בורקס חביתה לביבה קציצה טחינה שקשוקה מלאווח פתיתים עוגייה שוקולד סופגנייה' },
    { label: 'עיר בישראל', words: 'צפת עכו חיפה אילת נצרת חדרה נתניה טבריה אשדוד רעננה עפולה הרצליה רחובות דימונה אשקלון ירושלים' },
    { label: 'ארץ', words: 'סין צרפת ספרד יוון הודו קנדה מצרים ברזיל רוסיה הולנד איטליה גרמניה טורקיה אנגליה שווייץ מקסיקו פורטוגל ארגנטינה אוסטרליה' },
    { label: 'חג', words: 'פסח פורים חנוכה סוכות שבועות' },
    { label: 'כלי עבודה', words: 'צבת פטיש מברג מסור מעדר סולם מקדחה מגרפה מלטשת מספריים' },
    { label: 'ציוד לבית הספר', words: 'מחדד סרגל קלמר מחשב מחברת ילקוט עיפרון מחשבון' }
  ];

  var TO_REG = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
  var TO_FIN = { 'כ': 'ך', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ' };
  var DECOYS = 'אבגדהזחטילמנסעפקרשת'.split('');

  function normLetters(w) { return w.split('').map(function (c) { return TO_REG[c] || c; }); }
  function normWord(w) { return normLetters(w).join(''); }
  /* Builds the displayed word from regular letters, with a final form at the end. */
  function withFinal(letters) {
    var a = letters.slice();
    var last = a.length - 1;
    if (last >= 0 && TO_FIN[a[last]]) a[last] = TO_FIN[a[last]];
    return a.join('');
  }

  var WORDS = [];
  var NORM_SET = {};
  BANK.forEach(function (c) {
    c.words.split(' ').forEach(function (w) {
      if (!w) return;
      var n = normLetters(w);
      WORDS.push({ w: w, n: n, len: n.length, label: c.label });
      NORM_SET[n.join('')] = w;
    });
  });

  /* Word length range by level (index = level - 1). */
  var LEN = [[3, 3], [3, 3], [3, 4], [4, 4], [4, 4], [4, 5], [5, 5], [5, 5], [5, 6], [5, 6],
             [6, 6], [6, 6], [6, 7], [6, 7], [7, 7], [7, 7], [7, 8], [7, 8], [8, 9], [8, 9]];
  // Extra letter tiles that do not belong to the word.
  var DECOY_N = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1];

  /* Shuffle tile order so the word letters never appear in the original order
     and never spell any word from the bank. */
  function scrambleOrder(letters, nDecoy, shuffle) {
    var tiles = letters.slice();
    for (var d = 0; d < nDecoy; d++) {
      var free = DECOYS.filter(function (l) { return tiles.indexOf(l) === -1; });
      tiles.push(free[Math.floor(Math.random() * free.length)]);
    }
    var target = letters.join('');
    var order = null;
    for (var tries = 0; tries < 200; tries++) {
      var cand = shuffle(tiles.map(function (_, i) { return i; }));
      var seq = cand.filter(function (i) { return i < letters.length; })
        .map(function (i) { return tiles[i]; }).join('');
      if (seq !== target && !NORM_SET[seq]) { order = cand; break; }
    }
    if (!order) { // fallback: reverse, rotated if needed
      order = tiles.map(function (_, i) { return tiles.length - 1 - i; });
    }
    return order.map(function (i) { return tiles[i]; });
  }

  var CSS = [
    '.ws-wrap{width:100%;display:flex;flex-direction:column;align-items:center;gap:1.1rem}',
    '.ws-cat{display:inline-block;padding:.3rem 1rem;border-radius:999px;background:var(--language-soft);color:var(--language);font-weight:800;font-size:1.1rem}',
    /* long words wrap onto a second line instead of shrinking the slots below a comfortable tap size */
    '.ws-slots{--n:4;display:grid;grid-template-columns:repeat(var(--n),minmax(2.5rem,3.6rem));gap:.3rem;justify-content:center;width:100%;direction:rtl}',
    '.ws-slot{min-width:0;height:3.8rem;padding:0;border-radius:var(--radius-sm);border:2px dashed var(--line);background:var(--surface-2);',
    'color:var(--ink);font-family:var(--font-display);font-weight:900;font-size:1.9rem;cursor:pointer;line-height:1}',
    '.ws-slot.is-filled{border-style:solid;border-color:var(--accent);background:var(--accent-soft)}',
    '.ws-slot.is-hint{border-style:solid;border-color:var(--sun);background:var(--sun-soft);cursor:default}',
    '.ws-slot.is-correct{border-style:solid;border-color:var(--good);background:var(--good-soft);color:var(--good)}',
    '.ws-slot.is-wrong{border-style:solid;border-color:var(--bad);background:var(--bad-soft);color:var(--bad)}',
    '.ws-slot:disabled{cursor:default}',
    '.ws-tiles{display:flex;flex-wrap:wrap;justify-content:center;gap:.6rem;width:100%;max-width:30rem;direction:rtl}',
    '.ws-tile{width:3.8rem;height:3.8rem;padding:0;border-radius:var(--radius-sm);border:2px solid var(--line);background:var(--surface);',
    'box-shadow:var(--shadow);color:var(--ink);font-family:var(--font-display);font-weight:900;font-size:2.1rem;line-height:1;cursor:pointer;',
    'transition:background-color .2s,border-color .2s}',
    '.ws-tile:hover:not(:disabled){border-color:var(--accent);background:var(--accent-soft)}',
    '.ws-tile.is-used{background:transparent;border-style:dashed;box-shadow:none;color:transparent}',
    '.ws-tile:disabled{cursor:default}',
    '.ws-explain{min-height:3rem;font-size:1.1rem;font-weight:600;text-align:center;text-wrap:balance;color:var(--ink);',
    'padding:.6rem 1rem;border-radius:var(--radius-sm);max-width:34rem;width:100%}',
    '.ws-explain.is-good{background:var(--good-soft);color:var(--good)}',
    '.ws-explain.is-bad{background:var(--bad-soft);color:var(--ink)}',
    '.ws-explain.is-info{background:var(--surface-2)}'
  ].join('');

  BrainGames.register({
    id: 'word-scramble',
    name: 'מילה מבולגנת',
    skill: 'language',
    tagline: 'סדרו את האותיות למילה הנכונה',
    benefit: 'שליפת מילים, איות וגמישות מחשבתית',
    instructions: [
      'האותיות של מילה אחת מעורבבות. הרמז אומר לאיזה תחום היא שייכת.',
      'לחצו על האותיות לפי הסדר כדי לבנות את המילה, מימין לשמאל.',
      'לחצו על אות שכבר הנחתם כדי להחזיר אותה, או על "ניקוי" כדי להתחיל מחדש.',
      'נתקעתם? לחצו "רמז" ותקבלו את האות הבאה.'
    ],
    css: CSS,
    start: function (root, ctx) {
      var level = Math.max(1, Math.min(20, Math.round(Number(ctx.level) || 1)));
      var range = LEN[level - 1];
      var nDecoy = DECOY_N[level - 1];
      var round = 0;
      var correct = 0;
      var hintRounds = 0;
      var usedWords = {};
      var usedLabels = [];

      function pickWord() {
        var pool = WORDS.filter(function (o) { return o.len >= range[0] && o.len <= range[1] && !usedWords[o.w]; });
        var fresh = pool.filter(function (o) { return usedLabels.indexOf(o.label) === -1; });
        var w = ctx.pick(fresh.length ? fresh : pool);
        usedWords[w.w] = true;
        usedLabels.push(w.label);
        return w;
      }

      function finish() {
        var note = 'סידרתם ' + correct + ' מילים מתוך ' + ROUNDS + '.';
        if (hintRounds > 0) note += ' ב-' + hintRounds + ' מהן נעזרתם ברמז.';
        else if (correct === ROUNDS) note += ' בלי אף רמז!';
        ctx.finish({ correct: correct, total: ROUNDS, note: note });
      }

      function nextRound() {
        round++;
        if (round > ROUNDS) { finish(); return; }
        ctx.setProgress(round, ROUNDS);
        ctx.setStatus('סדרו את האותיות למילה');

        var word = pickWord();
        var target = word.n;           // regular letter forms
        var n = target.length;
        var tiles = scrambleOrder(target, nDecoy, ctx.shuffle);
        var tileUsed = tiles.map(function () { return false; });
        var slots = [];                // n entries: null or { ti, locked }
        for (var i = 0; i < n; i++) slots.push(null);
        var hints = 0;
        var attempts = 0;
        var busy = false;
        var answered = false;

        // up to 6 letters on one line; longer words split evenly over two lines so slots stay tappable on phones
        var slotCols = n <= 6 ? n : Math.ceil(n / 2);
        var slotsEl = ctx.el('div', { class: 'ws-slots', style: { '--n': slotCols }, 'aria-label': 'המילה שבניתם' });
        var tilesEl = ctx.el('div', { class: 'ws-tiles', 'aria-label': 'אותיות' });
        var explain = ctx.el('p', { class: 'ws-explain', 'aria-live': 'polite' });
        var clearBtn = ctx.el('button', { class: 'btn btn-quiet', type: 'button', onclick: onClear }, 'ניקוי');
        var hintBtn = ctx.el('button', { class: 'btn btn-secondary', type: 'button', 'aria-label': 'רמז: גלו את האות הבאה', onclick: onHint }, 'רמז');
        var slotBtns = [];
        var tileBtns = [];

        for (var s = 0; s < n; s++) {
          (function (j) {
            var b = ctx.el('button', { class: 'ws-slot', type: 'button', onclick: function () { onSlot(j); } });
            slotBtns.push(b);
            slotsEl.appendChild(b);
          })(s);
        }
        tiles.forEach(function (l, ti) {
          var b = ctx.el('button', { class: 'ws-tile', type: 'button', text: l, onclick: function () { onTile(ti); } });
          tileBtns.push(b);
          tilesEl.appendChild(b);
        });

        // Warm-up level 1: the first letter is already in place.
        if (level === 1) placeLocked(0);

        var hintText = nDecoy
          ? 'שימו לב: יש כאן אות אחת מיותרת שלא שייכת למילה.'
          : (level === 1 ? 'האות הראשונה כבר במקום. השלימו את השאר.' : 'המילה נבנית מימין לשמאל.');

        root.innerHTML = '';
        root.appendChild(ctx.el('div', { class: 'ws-wrap' }, [
          ctx.el('span', { class: 'ws-cat', text: 'רמז: ' + word.label }),
          ctx.el('p', { class: 'g-hint', text: hintText + ' (' + n + ' אותיות)' }),
          slotsEl,
          tilesEl,
          ctx.el('div', { class: 'g-actions' }, [hintBtn, clearBtn]),
          explain
        ]));
        render();

        function letterAt(j) { return slots[j] ? tiles[slots[j].ti] : ''; }

        function render() {
          for (var j = 0; j < n; j++) {
            var b = slotBtns[j];
            var l = letterAt(j);
            if (l && j === n - 1 && TO_FIN[l]) l = TO_FIN[l];
            b.textContent = l;
            b.className = 'ws-slot' + (slots[j] ? (slots[j].locked ? ' is-hint' : ' is-filled') : '');
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
          explain.className = 'ws-explain';
          explain.textContent = '';
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
          explain.className = 'ws-explain';
          explain.textContent = '';
          render();
        }

        /* Puts the correct letter into slot j and locks it. */
        function placeLocked(j) {
          if (slots[j]) { tileUsed[slots[j].ti] = false; slots[j] = null; }
          var need = target[j];
          var ti = -1;
          for (var t = 0; t < tiles.length; t++) if (!tileUsed[t] && tiles[t] === need) { ti = t; break; }
          if (ti === -1) { // the letter sits in another (unlocked) slot: take it from there
            for (var k = 0; k < n; k++) {
              if (slots[k] && !slots[k].locked && tiles[slots[k].ti] === need) {
                ti = slots[k].ti; slots[k] = null; break;
              }
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
          explain.className = 'ws-explain is-info';
          explain.textContent = 'האות במקום ' + (j + 1) + ' היא ' + (j === n - 1 && TO_FIN[target[j]] ? TO_FIN[target[j]] : target[j]) + '.';
          render();
          if (firstEmpty() === -1) check();
        }

        function setSlotState(cls) {
          slotBtns.forEach(function (b) { b.classList.remove('is-filled', 'is-hint'); b.classList.add(cls); });
        }

        function check() {
          var built = [];
          for (var j = 0; j < n; j++) built.push(tiles[slots[j].ti]);
          var str = built.join('');
          var ok = str === target.join('') || !!NORM_SET[str];
          var shown = withFinal(built);
          if (ok) {
            answered = true;
            correct++;
            if (hints > 0) hintRounds++;
            render();
            setSlotState('is-correct');
            slotBtns.forEach(function (b) { b.disabled = true; });
            var alt = str !== target.join('');
            explain.className = 'ws-explain is-good';
            explain.textContent = alt
              ? 'גם "' + shown + '" היא מילה נכונה! (חשבנו על "' + word.w + '")'
              : 'נכון! המילה היא "' + word.w + '"' + (hints > 0 ? ' (בעזרת ' + (hints === 1 ? 'רמז אחד' : hints + ' רמזים') + ')' : '') + '.';
            ctx.feedback(true).then(function () { return ctx.wait(800); }).then(nextRound);
            return;
          }
          attempts++;
          if (attempts < 2) {
            busy = true;
            setSlotState('is-wrong');
            explain.className = 'ws-explain is-bad';
            explain.textContent = '"' + shown + '" זו לא המילה. לחצו על אות כדי להחזיר אותה, או על "רמז".';
            ctx.feedback(false, 'עוד לא, נסו שוב').then(function () { busy = false; render(); });
            return;
          }
          // Second wrong attempt: show the answer.
          answered = true;
          for (var r = 0; r < n; r++) { if (slots[r]) tileUsed[slots[r].ti] = false; slots[r] = null; }
          for (var q = 0; q < n; q++) placeLocked(q);
          render();
          setSlotState('is-correct');
          slotBtns.forEach(function (b) { b.disabled = true; });
          explain.className = 'ws-explain is-bad';
          explain.textContent = 'המילה הנכונה היא "' + word.w + '" (' + word.label + ').';
          ctx.feedback(false, 'המילה היא: ' + word.w).then(function () { return ctx.wait(1800); }).then(nextRound);
        }
      }

      nextRound();
      return function cleanup() { root.innerHTML = ''; };
    }
  });

})();
