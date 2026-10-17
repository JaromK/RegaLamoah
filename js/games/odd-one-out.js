/* מי לא שייך? — find the word that does not belong to the category of the others. */
(function () {
  'use strict';

  var ROUNDS = 8;

  /* Word bank. Every word appears in exactly one category.
     f: true marks a feminine-plural label ("כל השאר הן ...").
     rel: closely related categories, used as the source of the odd word in hard rounds. */
  var CATS = [
    { id: 'fruit', label: 'פירות', rel: ['veg', 'sweets'],
      words: ['תפוח', 'בננה', 'אגס', 'ענבים', 'אבטיח', 'מלון', 'תות', 'אפרסק', 'שזיף', 'דובדבן', 'מנגו', 'אננס', 'קיווי', 'רימון', 'תאנה', 'תפוז'] },
    { id: 'veg', label: 'ירקות', rel: ['fruit', 'flowers'],
      words: ['גזר', 'מלפפון', 'חסה', 'כרוב', 'בצל', 'שום', 'פלפל', 'חציל', 'קישוא', 'תפוח אדמה', 'ברוקולי', 'כרובית', 'צנון', 'סלק'] },
    { id: 'mammals', label: 'יונקים', rel: ['birds', 'fish', 'insects'],
      words: ['אריה', 'פיל', "ג'ירפה", 'זברה', 'סוס', 'פרה', 'כבש', 'עז', 'ארנב', 'דוב', 'קוף', 'נמר', 'גמל', 'חמור'] },
    { id: 'birds', label: 'ציפורים', f: true, rel: ['mammals', 'insects', 'fish'],
      words: ['נשר', 'יונה', 'תוכי', 'דרור', 'ינשוף', 'פינגווין', 'עורב', 'חסידה', 'תרנגול', 'ברווז', 'שחף', 'פלמינגו', 'אנפה'] },
    { id: 'fish', label: 'דגים', rel: ['mammals', 'birds'],
      words: ['סלמון', 'טונה', 'כריש', 'בורי', 'דניס', 'לוקוס', 'סרדין', 'אמנון', 'קרפיון', 'מושט', 'פורל', 'דג זהב'] },
    { id: 'insects', label: 'חרקים', rel: ['birds', 'mammals'],
      words: ['נמלה', 'דבורה', 'פרפר', 'זבוב', 'יתוש', 'חיפושית', 'חגב', "ג'וק", 'צרצר', 'שפירית', 'צרעה'] },
    { id: 'kitchen', label: 'כלי מטבח', rel: ['appliances', 'tools', 'office'],
      words: ['מחבת', 'סיר', 'מזלג', 'כפית', 'סכין', 'מצקת', 'קולפן', 'מסננת', 'קערה', 'צלחת', 'מערוך', 'קרש חיתוך', 'פומפייה', 'מטרפה'] },
    { id: 'appliances', label: 'מכשירי חשמל', rel: ['kitchen', 'furniture'],
      words: ['מקרר', 'תנור', 'מיקרוגל', 'מכונת כביסה', 'מייבש כביסה', 'מדיח כלים', 'מזגן', 'שואב אבק', 'מאוורר', 'טלוויזיה', 'מגהץ'] },
    { id: 'furniture', label: 'רהיטים', rel: ['house', 'appliances'],
      words: ['כיסא', 'שולחן', 'ספה', 'מיטה', 'ארון', 'שידה', 'כורסה', 'מדף', 'כוננית', 'שרפרף', 'ספסל'] },
    { id: 'house', label: 'חלקי בית', rel: ['furniture'],
      words: ['גג', 'קיר', 'חלון', 'דלת', 'רצפה', 'תקרה', 'מרפסת', 'מדרגות', 'ארובה', 'מרתף', 'עליית גג', 'פרוזדור'] },
    { id: 'clothes', label: 'בגדים', rel: ['jewelry'],
      words: ['חולצה', 'מכנסיים', 'שמלה', 'חצאית', 'מעיל', 'סוודר', 'גרביים', 'כובע', 'צעיף', 'עניבה', 'חליפה', "פיג'מה", 'גופייה'] },
    { id: 'jewelry', label: 'תכשיטים', rel: ['clothes'],
      words: ['טבעת', 'שרשרת', 'צמיד', 'עגילים', 'תליון', 'נזם', 'מחרוזת', 'סיכת דש'] },
    { id: 'music', label: 'כלי נגינה', rel: [],
      words: ['גיטרה', 'פסנתר', 'כינור', 'חליל', 'תוף', 'חצוצרה', 'סקסופון', "צ'לו", 'נבל', 'אקורדיון', 'מפוחית', 'קלרינט', 'עוגב', 'טרומבון'] },
    { id: 'jobs', label: 'מקצועות', rel: ['sports'],
      words: ['רופא', 'מורה', 'נהג', 'טבח', 'שוטר', 'נגר', 'חשמלאי', 'טייס', 'עורך דין', 'רוקח', 'צלם', 'דוור', 'חקלאי', 'כבאי', 'אופה', 'שרברב'] },
    { id: 'il-cities', label: 'ערים בישראל', f: true, rel: ['eu-cities', 'countries'],
      words: ['חיפה', 'תל אביב', 'ירושלים', 'באר שבע', 'אילת', 'נתניה', 'טבריה', 'צפת', 'עכו', 'אשדוד', 'הרצליה', 'רחובות', 'נצרת', 'דימונה'] },
    { id: 'eu-cities', label: 'ערים באירופה', f: true, rel: ['il-cities', 'countries'],
      words: ['פריז', 'רומא', 'לונדון', 'מדריד', 'אתונה', 'ברלין', 'וינה', 'אמסטרדם', 'פראג', 'ליסבון', 'בודפשט'] },
    { id: 'countries', label: 'ארצות', f: true, rel: ['eu-cities', 'il-cities'],
      words: ['צרפת', 'איטליה', 'ספרד', 'יוון', 'מצרים', 'יפן', 'סין', 'הודו', 'ברזיל', 'קנדה', 'גרמניה', 'רוסיה', 'ארגנטינה', 'טורקיה'] },
    { id: 'colors', label: 'צבעים', rel: [],
      words: ['אדום', 'כחול', 'ירוק', 'צהוב', 'סגול', 'כתום', 'ורוד', 'שחור', 'לבן', 'אפור', 'תכלת', 'טורקיז'] },
    { id: 'flowers', label: 'פרחים', rel: ['trees', 'veg'],
      words: ['ורד', 'חמנייה', 'צבעוני', 'כלנית', 'רקפת', 'נרקיס', 'סחלב', 'חרצית', 'יסמין', 'פרג', 'חבצלת', 'סביון', 'נורית'] },
    { id: 'trees', label: 'עצים', rel: ['flowers'],
      words: ['אלון', 'אורן', 'ברוש', 'אקליפטוס', 'ארז', 'אשל', 'צפצפה', 'דקל', 'שקמה', 'פיקוס'] },
    { id: 'transport', label: 'כלי תחבורה', rel: [],
      words: ['מכונית', 'אוטובוס', 'רכבת', 'מטוס', 'אופניים', 'אופנוע', 'משאית', 'מונית', 'ספינה', 'סירה', 'מסוק', 'קורקינט', 'טרקטור', 'רכבל'] },
    { id: 'sports', label: 'ענפי ספורט', rel: ['jobs'],
      words: ['כדורגל', 'כדורסל', 'טניס', 'שחייה', 'ריצה', 'אגרוף', "ג'ודו", 'התעמלות', 'כדורעף', 'גולף', 'סקי', 'כדוריד', 'סיף', 'חתירה'] },
    { id: 'holidays', label: 'חגים', rel: [],
      words: ['פסח', 'שבועות', 'סוכות', 'חנוכה', 'פורים', 'ראש השנה', 'יום כיפור', 'ט"ו בשבט', 'ל"ג בעומר', 'שמחת תורה', 'יום העצמאות'] },
    { id: 'body', label: 'איברי גוף', rel: [],
      words: ['יד', 'רגל', 'ראש', 'אף', 'אוזן', 'עין', 'פה', 'כתף', 'ברך', 'מרפק', 'אצבע', 'צוואר', 'בטן', 'גב'] },
    { id: 'weather', label: 'תופעות מזג אוויר', f: true, rel: [],
      words: ['גשם', 'שלג', 'ברד', 'רוח', 'ערפל', 'ברק', 'רעם', 'סופה', 'טל', 'קשת בענן', 'שרב', 'חמסין'] },
    { id: 'tools', label: 'כלי עבודה', rel: ['kitchen', 'office'],
      words: ['פטיש', 'מברג', 'מסור', 'מקדחה', 'צבת', 'מפתח ברגים', 'מלטשת', 'פלס', 'מעדר', 'מגרפה'] },
    { id: 'office', label: 'ציוד משרדי', rel: ['tools', 'kitchen'],
      words: ['עיפרון', 'מחק', 'מחדד', 'סרגל', 'מספריים', 'דבק', 'מחברת', 'קלמר', 'עט', 'מהדק', 'טוש'] },
    { id: 'drinks', label: 'משקאות', rel: ['il-food', 'sweets'],
      words: ['מים', 'חלב', 'קפה', 'תה', 'מיץ', 'לימונדה', 'סודה', 'יין', 'בירה', 'שוקו', 'ערק', 'קולה'] },
    { id: 'il-food', label: 'מאכלים ישראליים', rel: ['sweets', 'drinks'],
      words: ['פלאפל', 'חומוס', 'שקשוקה', 'שווארמה', 'בורקס', 'סביח', 'מלאווח', "ג'חנון", 'קובה', 'טחינה', 'פתיתים', 'במבה', 'ביסלי'] },
    { id: 'sweets', label: 'קינוחים', rel: ['il-food', 'fruit'],
      words: ['עוגה', 'גלידה', 'עוגיות', 'שוקולד', 'פודינג', 'מוס', 'מרשמלו', 'סוכרייה', 'ופל', 'טירמיסו'] },
    /* Abstract categories (abs: true) are used only from level 17. */
    { id: 'feelings', label: 'רגשות', abs: true, rel: ['traits'],
      words: ['שמחה', 'עצב', 'כעס', 'פחד', 'קנאה', 'בושה', 'הפתעה', 'געגוע', 'אהבה', 'תקווה', 'ייאוש', 'בדידות', 'אכזבה', 'התרגשות'] },
    { id: 'traits', label: 'תכונות אופי', f: true, abs: true, rel: ['feelings'],
      words: ['נדיבות', 'קמצנות', 'אומץ', 'סבלנות', 'יושר', 'ענווה', 'עקשנות', 'חריצות', 'עצלות', 'נאמנות', 'סקרנות', 'ביישנות', 'יהירות'] },
    { id: 'time', label: 'יחידות זמן', f: true, abs: true, rel: ['units'],
      words: ['שנייה', 'דקה', 'שעה', 'יום', 'שבוע', 'חודש', 'שנה', 'עשור'] },
    { id: 'units', label: 'יחידות מידה', f: true, abs: true, rel: ['time'],
      words: ['מטר', 'סנטימטר', 'קילומטר', 'מילימטר', 'גרם', 'קילוגרם', 'טון', 'ליטר', 'מיליליטר'] }
  ];

  /* Difficulty by level (index = level - 1).
     Levels 1-15 spread the original 10-level curve in small steps; 16-20 add new challenges. */
  var N_WORDS = [4, 4, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 6, 6, 6, 6, 6];
  // Chance that the odd word comes from a closely related category.
  var P_HARD = [0, 0, 0, 0, 0.1, 0.2, 0.3, 0.4, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 1, 1, 1, 1, 1, 1];
  // Rounds (out of 8) whose base group is an abstract category (feelings, traits, units...).
  var ABS_ROUNDS = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 2, 2, 3];
  // Rounds (out of 8) that use the second rule: "which word does not start with the same letter?".
  var LETTER_ROUNDS = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 3];
  // From level 19 the odd word in letter rounds starts with a look-alike or sound-alike letter.
  var NEAR = {
    'ב': ['כ', 'פ'], 'כ': ['ב', 'ק'], 'ק': ['כ'], 'פ': ['ב'], 'ט': ['ת'], 'ת': ['ט', 'ח'], 'ס': ['ש'],
    'ש': ['ס'], 'ד': ['ר'], 'ר': ['ד'], 'ה': ['ח', 'א'], 'ח': ['ה', 'ת'], 'א': ['ע', 'ה'], 'ע': ['א'],
    'ו': ['ז'], 'ז': ['ו'], 'מ': ['נ'], 'נ': ['מ', 'ג'], 'ג': ['נ'], 'י': ['ו']
  };

  /* Words by first letter, for letter rounds. Words like ג'ירפה are skipped (sound differs from the letter). */
  var BY_LETTER = {};
  CATS.forEach(function (c) {
    c.words.forEach(function (w) {
      if (w.charAt(1) === "'") return;
      var l = w.charAt(0);
      (BY_LETTER[l] = BY_LETTER[l] || []).push({ w: w, cat: c.id });
    });
  });
  function catCount(list) {
    var s = {};
    list.forEach(function (o) { s[o.cat] = true; });
    return Object.keys(s).length;
  }

  var BY_ID = {};
  CATS.forEach(function (c) { BY_ID[c.id] = c; });

  var CSS = [
    '.oo-wrap{width:100%;display:flex;flex-direction:column;align-items:center;gap:1.1rem}',
    '.oo-choices{max-width:34rem}',
    '.oo-choice{font-size:clamp(1.25rem,5vw,1.5rem);min-height:4.6rem;overflow-wrap:anywhere}',
    '.oo-explain{min-height:3.2rem;font-size:1.1rem;font-weight:600;text-align:center;text-wrap:balance;color:var(--ink);',
    'padding:.6rem 1rem;border-radius:var(--radius-sm);background:var(--surface-2);max-width:34rem;width:100%}',
    '.oo-explain:empty{background:transparent}',
    '.oo-explain.is-good{background:var(--good-soft);color:var(--good)}',
    '.oo-explain.is-bad{background:var(--bad-soft);color:var(--ink)}'
  ].join('');

  BrainGames.register({
    id: 'odd-one-out',
    name: 'מי לא שייך?',
    skill: 'language',
    tagline: 'מצאו את המילה שלא שייכת לקבוצה',
    benefit: 'חשיבה מילולית, מיון למושגים ואוצר מילים',
    instructions: [
      'קראו את כל המילים שעל המסך.',
      'רוב המילים שייכות לאותה קבוצה, למשל פירות או רהיטים.',
      'לחצו על המילה היחידה שלא שייכת לקבוצה.',
      'בשלבים מתקדמים הקבוצות קרובות יותר, ולפעמים השאלה משתנה. קראו את השאלה בכל שלב.'
    ],
    css: CSS,
    start: function (root, ctx) {
      var level = Math.max(1, Math.min(20, Math.round(Number(ctx.level) || 1)));
      var nWords = N_WORDS[level - 1];
      var pHard = P_HARD[level - 1];
      var round = 0;
      var correct = 0;
      var hardTotal = 0;
      var hardCorrect = 0;
      var usedBase = [];
      var usedLetters = [];
      var prevKind = 'cat';

      // Which rounds use the letter rule / an abstract base group (never round 1 for the letter rule).
      var kinds = [];
      var nLetter = LETTER_ROUNDS[level - 1];
      var nAbs = ABS_ROUNDS[level - 1];
      for (var k = 0; k < ROUNDS - 1; k++) kinds.push(k < nLetter ? 'letter' : (k < nLetter + nAbs ? 'abs' : 'cat'));
      kinds = ['cat'].concat(ctx.shuffle(kinds));

      function pickCats(hard, abs) {
        var pool = CATS.filter(function (c) { return usedBase.indexOf(c.id) === -1 && !!c.abs === abs; });
        if (!pool.length) pool = CATS.filter(function (c) { return !!c.abs === abs; });
        if (hard) {
          var withRel = pool.filter(function (c) { return c.rel.length > 0; });
          if (withRel.length) pool = withRel;
        }
        var base = ctx.pick(pool);
        usedBase.push(base.id);
        var odd;
        if (hard && base.rel.length) {
          odd = BY_ID[ctx.pick(base.rel)];
        } else {
          odd = ctx.pick(CATS.filter(function (c) {
            return c.id !== base.id && !c.abs && base.rel.indexOf(c.id) === -1 && c.rel.indexOf(base.id) === -1;
          }));
        }
        return { base: base, odd: odd, hard: hard && base.rel.length > 0 };
      }

      /* Letter round: nWords - 1 words starting with the same letter (from different groups),
         plus one word that starts with another letter. */
      function pickLetterRound() {
        var need = nWords - 1;
        var letters = Object.keys(BY_LETTER).filter(function (l) {
          return BY_LETTER[l].length >= need + 1 && catCount(BY_LETTER[l]) >= need;
        });
        var fresh = letters.filter(function (l) { return usedLetters.indexOf(l) === -1; });
        var letter = ctx.pick(fresh.length ? fresh : letters);
        usedLetters.push(letter);

        var usedCats = {};
        var base = [];
        var rest = [];
        ctx.shuffle(BY_LETTER[letter]).forEach(function (o) {
          if (base.length < need && !usedCats[o.cat]) { usedCats[o.cat] = true; base.push(o); }
          else rest.push(o);
        });
        while (base.length < need && rest.length) base.push(rest.shift());

        var others = [];
        var near = level >= 19 ? (NEAR[letter] || []) : [];
        near.forEach(function (l) { others = others.concat(BY_LETTER[l] || []); });
        if (!others.length) {
          Object.keys(BY_LETTER).forEach(function (l) { if (l !== letter) others = others.concat(BY_LETTER[l]); });
        }
        // Prefer an odd word from the same group as one of the others, so the group gives no clue.
        var sameGroup = others.filter(function (o) { return usedCats[o.cat]; });
        var odd = ctx.pick(sameGroup.length ? sameGroup : others);
        return { letter: letter, words: base.map(function (o) { return o.w; }), oddWord: odd.w, oddLetter: odd.w.charAt(0) };
      }

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          var note = hardTotal > 0
            ? 'בסבבים עם קבוצות קרובות: ' + hardCorrect + ' מתוך ' + hardTotal + ' נכונות.'
            : 'מצאתם ' + correct + ' מילים יוצאות דופן מתוך ' + ROUNDS + '.';
          ctx.finish({ correct: correct, total: ROUNDS, note: note });
          return;
        }
        ctx.setProgress(round, ROUNDS);

        var kind = kinds[round - 1] || 'cat';
        var isLetter = kind === 'letter';
        var changed = level >= 18 && (isLetter ? 'letter' : 'cat') !== prevKind;
        prevKind = isLetter ? 'letter' : 'cat';

        var pickRes, base, odd, words, oddWord, lr;
        if (isLetter) {
          lr = pickLetterRound();
          words = lr.words;
          oddWord = lr.oddWord;
          pickRes = { hard: false };
          ctx.setStatus((changed ? 'שימו לב, שאלה אחרת: ' : '') + 'איזו מילה לא מתחילה באותה אות?');
        } else {
          pickRes = pickCats(Math.random() < pHard, kind === 'abs');
          base = pickRes.base;
          odd = pickRes.odd;
          if (pickRes.hard) hardTotal++;
          words = ctx.shuffle(base.words).slice(0, nWords - 1);
          oddWord = ctx.pick(odd.words);
          ctx.setStatus((changed ? 'שימו לב, חוזרים לשאלה: ' : '') + 'איזו מילה לא שייכת?');
        }
        var all = ctx.shuffle(words.concat([oddWord]));

        var explain = ctx.el('p', { class: 'oo-explain', 'aria-live': 'polite' });
        var buttons = [];
        var answered = false;

        var choices = ctx.el('div', { class: 'g-choices oo-choices' });
        all.forEach(function (w) {
          var b = ctx.el('button', {
            class: 'g-choice oo-choice',
            type: 'button',
            text: w,
            onclick: function () { answer(w, b); }
          });
          buttons.push({ word: w, btn: b });
          choices.appendChild(b);
        });

        root.innerHTML = '';
        root.appendChild(ctx.el('div', { class: 'oo-wrap' }, [
          ctx.el('p', { class: 'g-hint', text: isLetter
            ? 'כל המילים חוץ מאחת מתחילות באותה אות. בדקו רק את האות הראשונה.'
            : 'כל המילים חוץ מאחת שייכות לאותה קבוצה.' }),
          choices,
          explain
        ]));

        function answer(w, btn) {
          if (answered) return;
          answered = true;
          buttons.forEach(function (o) { o.btn.disabled = true; });
          var ok = w === oddWord;
          var reason = isLetter
            ? 'כל השאר מתחילות באות ' + lr.letter + '. המילה "' + oddWord + '" מתחילה באות ' + lr.oddLetter + '.'
            : (base.f ? 'כל השאר הן ' : 'כל השאר הם ') + base.label +
              '. המילה "' + oddWord + '" שייכת ל' + odd.label + '.';
          buttons.forEach(function (o) {
            if (o.word === oddWord) o.btn.classList.add('is-correct');
          });
          if (ok) {
            correct++;
            if (pickRes.hard) hardCorrect++;
            explain.className = 'oo-explain is-good';
            explain.textContent = 'נכון! ' + reason;
          } else {
            btn.classList.add('is-wrong');
            explain.className = 'oo-explain is-bad';
            explain.textContent = reason;
          }
          ctx.feedback(ok, ok ? null : 'לא הפעם. "' + oddWord + '" היא המילה שלא שייכת.')
            .then(function () { return ctx.wait(ok ? 900 : 2200); })
            .then(nextRound);
        }
      }

      nextRound();
      return function cleanup() { root.innerHTML = ''; };
    }
  });
})();
