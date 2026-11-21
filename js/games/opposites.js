/* הפכים — a board of word tiles that make opposite pairs (חם / קר). Tap two opposites to match them; a wrong
   pair just shakes. Higher levels: more pairs, abstract opposites, pairs that start with the same letter and
   look-alike tiles that have no partner (language). Untimed. */
(function () {
  'use strict';

  /* word/opposite[/near-synonym of the first word, shown at high levels as a tile without a partner][#group]
     Pairs with the same #group mean nearly the same thing, so they never share a board. Three tiers. */
  var BANK = [
    [ // 1: everyday, concrete
      'חם/קר/לוהט', 'גדול/קטן/ענק', 'גבוה/נמוך', 'ארוך/קצר', 'יום/לילה#day', 'למעלה/למטה#up', 'פתוח/סגור', 'מלא/ריק/גדוש',
      'שמח/עצוב/עליז#happy', 'חדש/ישן/טרי', 'מהר/לאט/בזריזות#fast', 'רטוב/יבש/לח', 'כבד/קל', 'רך/קשה', 'לבן/שחור', 'ימין/שמאל',
      'בוקר/ערב#day', 'קיץ/חורף', 'נקי/מלוכלך/מצוחצח#clean', 'חזק/חלש/שרירי', 'עשיר/עני/אמיד#rich', 'צעיר/זקן#age', 'שמן/רזה/שמנמן',
      'רחוק/קרוב#near', 'מתוק/מר', 'נכנס/יוצא#in', 'לפני/אחרי', 'מעל/מתחת#up', 'בפנים/בחוץ#in2', 'אור/חושך#light', 'שקט/רועש/שליו#quiet',
      'הרבה/מעט#rich', 'ראשון/אחרון', 'טוב/רע/מצוין', 'שבע/רעב', 'עלה/ירד#up2', 'ישב/עמד', 'בריא/חולה', 'ער/ישן', 'חיים/מוות#life',
      'קדימה/אחורה#front', 'צפון/דרום', 'נתן/לקח#give', 'קנה/מכר'
    ],
    [ // 2: a step harder
      'אהבה/שנאה/חיבה#love', 'מלחמה/שלום/קרב', 'ישר/עקום', 'חכם/טיפש/נבון', 'אמיץ/פחדן/גיבור', 'עבה/דק', 'רחב/צר/מרווח', 'עמוק/רדוד/תהומי',
      'זול/יקר', 'שאל/ענה#ask', 'הדליק/כיבה', 'זכר/שכח', 'ניצח/הפסיד#win', 'התחיל/סיים#start', 'בכה/צחק', 'זרק/תפס', 'דחף/משך',
      'מוקדם/מאוחר#early', 'מותר/אסור', 'אמת/שקר#true', 'חבר/אויב', 'מצא/איבד', 'כניסה/יציאה#in', 'שאלה/תשובה#ask', 'התחלה/סוף#start',
      'הכול/כלום', 'חד/קהה', 'חלק/מחוספס', 'פשוט/מסובך#easy', 'קל/קשה#easy', 'עייף/רענן', 'יחיד/רבים', 'עליון/תחתון#up',
      'מזרח/מערב', 'שווה/שונה', 'חיבור/חיסור#add', 'שותק/מדבר#voice', 'לוחש/צועק#voice', 'בטוח/מסוכן/מוגן#sure', 'הצליח/נכשל#success', 'מכניס/מוציא#in',
      'מגדיל/מקטין#add', 'מנצח/מפסיד#win', 'חשוך/מואר#light', 'נולד/מת#life', 'נדיר/נפוץ', 'הוסיף/הוריד#add', 'קדמי/אחורי#front'
    ],
    [ // 3: abstract
      'אופטימי/פסימי', 'ענווה/גאווה#proud', 'נדיב/קמצן/נדבן', 'זהיר/פזיז', 'חרוץ/עצלן/שקדן', 'רגוע/נסער#quiet', 'חופש/עבדות', 'עבר/עתיד',
      'זמני/קבוע', 'פרטי/ציבורי', 'מקור/העתק', 'מופשט/מוחשי#real', 'אמון/חשד', 'תקווה/ייאוש', 'ניצחון/תבוסה#win', 'הצלחה/כישלון#success',
      'רווח/הפסד#win', 'יתרון/חיסרון', 'פרס/עונש', 'מחמאה/עלבון', 'ברכה/קללה', 'גלוי/נסתר', 'ודאי/מסופק#sure', 'קיצוני/מתון', 'יציב/רעוע',
      'שלם/שבור/תקין', 'מסודר/מבולגן/מאורגן#clean', 'ממשי/מדומה#real', 'מתוח/רפוי#quiet', 'נאמן/בוגד', 'רחמן/אכזר/רחום', 'צנוע/יהיר#proud', 'פנימי/חיצוני#in2',
      'מאושר/אומלל#happy', 'שיא/שפל', 'פתאומי/הדרגתי', 'ברור/מעורפל/צלול', 'אמיתי/מזויף#true', 'טבעי/מלאכותי#true', 'חיובי/שלילי',
      'מעשי/עיוני#real', 'שגרתי/חריג', 'מקדים/מאחר#early', 'מוסיף/מחסיר#add', 'מתקרב/מתרחק#near', 'מעודד/מייאש', 'שקט/שאון#quiet', 'מוכר/זר',
      'אוהב/שונא#love', 'מבוגר/ילד#age', 'שופע/דל#rich', 'מרוכז/מפוזר#clean'
    ]
  ];

  var PAIRS = [];
  BANK.forEach(function (list, ti) {
    list.forEach(function (s) {
      if (!s) return;
      var g = s.split('#'), p = g[0].split('/');
      PAIRS.push({ a: p[0], b: p[1], syn: p[2] || '', group: g[1] || p[0], tier: ti + 1, same: p[0].charAt(0) === p[1].charAt(0) });
    });
  });

  /* Level 1–50: pairs on the board, which tiers, how many look-alike tiles, how many same-letter pairs. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    var s = { pairs: Math.min(8, 3 + Math.floor((L - 1) / 6)), decoys: L >= 36 ? 2 : L >= 26 ? 1 : 0, same: 0 };
    if (L <= 10) s.tiers = [1];
    else if (L <= 20) s.tiers = [1, 2];
    else if (L <= 30) s.tiers = [1, 2, 3];
    else s.tiers = [2, 3];
    if (L >= 41) s.same = L >= 46 ? 4 : 3;
    s.boards = L <= 15 ? 3 : 2;
    s.allowed = s.pairs >= 6 ? 2 : 1;
    return s;
  }

  /* One board: { pairs:[...], decoys:[{w, of}], tiles:[{w, pair|-1, decoy}] } with every word once. */
  function makeBoard(sp, rnd) {
    for (var attempt = 0; attempt < 50; attempt++) {
      var pool = rnd.shuffle(PAIRS.filter(function (p) { return sp.tiers.indexOf(p.tier) >= 0; }));
      // first the pairs that start with the same letter, then pairs with a look-alike word, then the rest
      var front = [], fg = {};
      pool.forEach(function (p) { if (p.same && front.length < sp.same && !fg[p.group]) { fg[p.group] = 1; front.push(p); } });
      front = front.concat(pool.filter(function (p) { return p.syn && front.indexOf(p) < 0; }).slice(0, sp.decoys));
      pool = front.concat(rnd.shuffle(pool.filter(function (p) { return front.indexOf(p) < 0; })));
      var chosen = [], words = {}, groups = {};
      for (var i = 0; i < pool.length && chosen.length < sp.pairs; i++) {
        var p = pool[i];
        if (words[p.a] || words[p.b] || groups[p.group]) continue;
        if (p.syn && (words[p.syn])) continue;
        chosen.push(p); words[p.a] = words[p.b] = 1; groups[p.group] = 1;
      }
      if (chosen.length < sp.pairs) continue;
      var decoys = [];
      chosen.forEach(function (p) {
        if (decoys.length < sp.decoys && p.syn && !words[p.syn]) { decoys.push({ w: p.syn, of: p }); words[p.syn] = 1; }
      });
      if (decoys.length < sp.decoys) continue;
      var tiles = [];
      chosen.forEach(function (p, k) { tiles.push({ w: p.a, pair: k }); tiles.push({ w: p.b, pair: k }); });
      decoys.forEach(function (d) { tiles.push({ w: d.w, pair: -1, decoy: d }); });
      return { pairs: chosen, decoys: decoys, tiles: rnd.shuffle(tiles) };
    }
    return null;
  }

  var HUES = ['--c-blue', '--c-red', '--c-green', '--c-purple', '--c-yellow', '--c-black'];

  var css = [
    '.op-grid{display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:.55rem;width:100%;max-width:30rem;direction:rtl;}',
    '.op-tile{min-height:3.3rem;padding:.3rem .25rem;border:3px solid var(--line);border-radius:var(--radius-sm);background:var(--surface-2);',
    'color:var(--ink);font-size:1.3rem;font-weight:800;line-height:1.15;cursor:pointer;touch-action:manipulation;word-break:break-word;}',
    '.op-grid.is-three .op-tile{font-size:1.15rem;}',
    '.op-tile.is-sel{background:var(--c-yellow);border-color:var(--c-yellow);color:var(--c-on-yellow);}',
    '.op-tile.is-done{cursor:default;color:var(--ink);}',
    '.op-tile.is-extra{opacity:.55;border-style:dashed;}',
    '.op-tile.is-shake{animation:op-shake .45s;border-color:var(--c-red);}',
    '@keyframes op-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-7px)}40%{transform:translateX(7px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}',
    '.op-note{margin:0;font-size:1.1rem;font-weight:700;color:var(--ink-soft);text-align:center;}'
  ].join('');

  BrainGames.register({
    id: 'opposites',
    name: 'הפכים',
    skill: 'language',
    isNew: true,
    tagline: 'מצאו את זוגות המילים ההפוכות',
    benefit: 'אוצר מילים, הבנת משמעות וחשיבה גמישה',
    instructions: [
      'על הלוח יש מילים. כל מילה יש לה מילה הפוכה בלוח, כמו חם וקר.',
      'לחצו על מילה ואחר כך על ההפך שלה. זוג נכון נצבע.',
      'בשלבים מתקדמים יש גם מילים בלי זוג. אותן משאירים בצד.',
      'אין שעון. טעיתם? פשוט נסו שוב.'
    ],
    css: css,
    _model: { spec: spec, makeBoard: makeBoard, pairs: PAIRS },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = sp.boards;
      var round = 0, good = 0;

      function next() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: good, total: ROUNDS, note: 'פתרתם ' + good + ' מתוך ' + ROUNDS + ' לוחות כמעט בלי טעויות' });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var B = null;
        for (var t = 0; t < 5 && !B; t++) B = makeBoard(sp, ctx);
        play(B);
      }

      function play(B) {
        root.innerHTML = '';
        root.__op = B; // read by the automated tests
        var sel = -1, found = 0, mistakes = 0, done = false, busy = false;
        var cols = B.tiles.length > 8 ? 3 : 2;
        var tiles = B.tiles.map(function (t, i) {
          return el('button', { class: 'op-tile', type: 'button', onclick: function () { tap(i); } }, t.w);
        });
        var grid = el('div', { class: 'op-grid' + (cols === 3 ? ' is-three' : ''), style: { '--cols': cols } }, tiles);
        var note = el('p', { class: 'op-note' }, B.decoys.length ? 'יש ' + (B.decoys.length === 1 ? 'מילה אחת' : B.decoys.length + ' מילים') + ' בלי זוג' : 'מצאו ' + B.pairs.length + ' זוגות');
        var acts = el('div', { class: 'g-actions' });
        root.appendChild(grid);
        root.appendChild(note);
        root.appendChild(acts);
        ctx.setStatus('לחצו על מילה ואחר כך על ההפך שלה');

        function tap(i) {
          if (done || busy || tiles[i].classList.contains('is-done')) return;
          if (sel < 0) { sel = i; tiles[i].classList.add('is-sel'); ctx.sound('tap'); return; }
          if (sel === i) { tiles[i].classList.remove('is-sel'); sel = -1; return; }
          var a = B.tiles[sel], b = B.tiles[i], first = sel;
          tiles[first].classList.remove('is-sel');
          sel = -1;
          if (a.pair >= 0 && a.pair === b.pair) {
            var hue = HUES[found % HUES.length];
            found++;
            [first, i].forEach(function (k) {
              tiles[k].classList.add('is-done');
              tiles[k].style.background = 'var(' + hue + '-soft)';
              tiles[k].style.borderColor = 'var(' + hue + ')';
            });
            ctx.sound('good');
            if (found === B.pairs.length) { finishBoard(); return; }
            ctx.setStatus('נכון: ' + a.w + ' ↔ ' + b.w + '. נשארו ' + (B.pairs.length - found));
            return;
          }
          mistakes++;
          ctx.sound('bad');
          var d = a.decoy ? a : b.decoy ? b : null, other = d === a ? b : a;
          if (d && d.decoy.of.b === other.w) ctx.setStatus('קרוב! אבל ל"' + other.w + '" יש הפך מדויק יותר');
          else ctx.setStatus('"' + a.w + '" ו"' + b.w + '" הם לא הפכים. נסו שוב');
          busy = true;
          [first, i].forEach(function (k) { tiles[k].classList.add('is-shake'); });
          ctx.wait(500).then(function () {
            busy = false;
            [first, i].forEach(function (k) { tiles[k].classList.remove('is-shake'); });
          });
        }

        function finishBoard() {
          done = true;
          var ok = mistakes <= sp.allowed;
          if (ok) good++;
          tiles.forEach(function (t, k) { t.disabled = true; if (B.tiles[k].pair < 0) t.classList.add('is-extra'); });
          note.remove(); // its place goes to the "next" button, so the full board still fits
          ctx.setStatus((ok ? 'מצאתם את כל הזוגות!' : 'מצאתם הכול, עם כמה טעויות בדרך') + (mistakes ? ' (טעויות: ' + mistakes + ')' : ' בלי אף טעות'));
          ctx.feedback(ok).then(function () {
            var nb = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { nb.disabled = true; next(); } },
              round >= ROUNDS ? 'לסיכום' : 'ללוח הבא');
            acts.appendChild(nb);
          });
        }
      }

      next();
    }
  });
})();
