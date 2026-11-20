/* ארץ עיר — the classic: one letter, and for each category (country, city, animal, plant…) find a word that
   starts with it. Here the player picks it from a few options (language, word retrieval). Untimed. */
(function () {
  'use strict';

  var CATS = [
    { id: 'land', name: 'ארץ', words: 'אנגליה אוסטרליה אוסטריה איטליה אירלנד ארגנטינה אתיופיה ברזיל בלגיה בולגריה גרמניה גאנה דנמרק הולנד הודו הונגריה וייטנאם ונצואלה זמביה חילה טורקיה טנזניה יפן יוון ירדן כוויית לבנון לוב מצרים מקסיקו מרוקו נורבגיה ניגריה נפאל סין ספרד סוריה סקוטלנד עיראק עומאן פולין פורטוגל פרו פינלנד צרפת צ׳כיה קנדה קפריסין קובה קניה רוסיה רומניה שוודיה שווייץ תאילנד תוניסיה' },
    { id: 'city', name: 'עיר', words: 'אילת אשדוד אשקלון אמסטרדם אתונה באר_שבע בני_ברק בת_ים ברלין בודפשט גבעתיים גדרה דימונה הרצליה הוד_השרון ונציה וינה זכרון_יעקב חיפה חולון חדרה טבריה טוקיו טורונטו ירושלים יבנה כרמיאל כפר_סבא לוד לונדון מדריד מילאנו מודיעין נתניה נהריה ניו_יורק נצרת סידני סטוקהולם עכו עפולה ערד פריז פתח_תקווה פראג צפת ציריך קריית_שמונה קהיר ראשון_לציון רמלה רחובות רומא רעננה שדרות שפרעם תל_אביב' },
    { id: 'animal', name: 'חי', words: 'אריה ארנב ברווז בואש גמל גורילה דב דג דולפין היפופוטם זברה זאב זבוב חתול חמור חסידה טווס טיגריס ינשוף יען כלב כבש לטאה לוויתן מרגלית נמר נחש נמלה סוס סנאי עכבר עז עורב פיל פרה פרפר פינגווין צב צבי צפרדע קוף קיפוד קנגורו ראם שועל שפן תנין תוכי תרנגול תולעת' },
    { id: 'plant', name: 'צומח', words: 'אורן אלון אגס ברוש בצל בננה גזר גפן דקל דובדבן הדס ורד זית חמנייה חסה חרצית טופח יסמין כרוב כלנית לימון לבנדר מלפפון מנגו נרקיס נענע סביון סחלב עגבנייה ערבה פטרוזיליה פלפל צבר צנונית קקטוס קישוא רקפת רימון שקד שושן שום תפוח תמר תות תאנה' },
    { id: 'name', name: 'שם', words: 'אברהם אסתר בתיה ברוך גילה גדעון דוד דבורה הדסה הלל ורדה זהבה זאב חנה חיים טובה טל יוסף יעל כרמלה לאה לאון מרים משה נעמי נחום סיגל סמדר עדינה עמוס פנינה פנחס צביה ציונה קרן קובי רחל רפאל שרה שלמה תמר תומר' },
    { id: 'job', name: 'מקצוע', words: 'אופה אדריכל בנאי גנן דוור דייג וטרינר זמר חייט חשמלאי טבח טייס ירקן כבאי לבורנט מורה מכונאי נגר נהג ספר סנדלר עורך_דין עיתונאי פסל פקיד צייר צלם קצב קוסם רופא רוקח שוטר שען שחקן תופרת תזונאי' },
    { id: 'thing', name: 'חפץ', words: 'ארון אגרטל בקבוק ברז גרב גיטרה דלת דלי הגה וילון זכוכית חולצה חבל טלפון טלוויזיה ידית ילקוט כיסא כרית לוח מנורה מפתח מזלג נעל נר סיר סכין עט עיפרון פטיש פח צלחת צעיף קומקום קערה רדיו שולחן שעון תיק תנור' }
  ].map(function (c) { return { id: c.id, name: c.name, words: c.words.split(' ').map(function (w) { return w.replace(/_/g, ' '); }) }; });

  // letters that sound alike: the hard levels use them for the wrong options
  var ALIKE = { 'א': 'ע', 'ע': 'א', 'כ': 'ק', 'ק': 'כ', 'ח': 'כ', 'ת': 'ט', 'ט': 'ת', 'ס': 'ש', 'ש': 'ס', 'ב': 'ו', 'ו': 'ב', 'צ': 'ס', 'ג': 'ק', 'פ': 'ב', 'ד': 'ת', 'ה': 'א', 'ל': 'ר', 'ר': 'ל', 'מ': 'נ', 'נ': 'מ', 'י': 'א', 'ז': 'צ' };

  function first(w) { return w.charAt(0); }
  function of(cat, letter) { return cat.words.filter(function (w) { return first(w) === letter; }); }

  /* Level 1–50: cats = categories per letter, opts = options per question,
     alike = share of wrong options that start with a sound-alike letter,
     cross = share of wrong options with the right letter but from another category. */
  function spec(level) {
    var L = level;
    return {
      cats: L <= 5 ? 4 : L <= 15 ? 5 : L <= 30 ? 6 : 7,
      opts: L <= 6 ? 3 : 4,
      alike: L <= 15 ? 0 : Math.min(1, (L - 15) * 0.04),
      cross: L <= 8 ? 0 : Math.min(0.6, (L - 8) * 0.03),
      letters: 2
    };
  }

  function makeQuestion(cat, letter, sp, rnd) {
    var right = rnd.pick(of(cat, letter));
    var wrong = [];
    var guard = 0;
    function fits(w) { return w && w !== right && wrong.indexOf(w) === -1 && !(first(w) === letter && cat.words.indexOf(w) !== -1); }
    function alike() { return ALIKE[letter] ? rnd.pick(of(cat, ALIKE[letter]).filter(fits).concat([null])) : null; }
    function cross() {
      var pool = [];
      CATS.forEach(function (c) { if (c !== cat) pool = pool.concat(of(c, letter)); });
      return rnd.pick(pool.filter(fits).concat([null]));
    }
    function plain() { return rnd.pick(cat.words.filter(function (x) { return first(x) !== letter && fits(x); })); }
    while (wrong.length < sp.opts - 1 && guard++ < 60) {
      var r = rnd.randInt(1, 100) / 100;
      // the wanted kind of trap, or the next kind when it has run out of words
      var w = r <= sp.alike ? (alike() || cross() || plain()) : r <= sp.alike + sp.cross ? (cross() || plain()) : plain();
      // a wrong option must really be wrong: not a word of this category that starts with the letter
      if (fits(w)) wrong.push(w);
    }
    return { cat: cat, letter: letter, right: right, options: rnd.shuffle([right].concat(wrong)) };
  }

  var css = [
    '.ei-top{display:flex;align-items:center;gap:.8rem;}',
    '.ei-letter{width:4rem;height:4rem;border-radius:50%;display:grid;place-items:center;background:var(--c-blue);color:#fff;',
    'font-family:var(--font-display);font-size:2.6rem;font-weight:900;line-height:1;}',
    '.ei-sheet{width:100%;max-width:26rem;border:2px solid var(--line);border-radius:var(--radius-sm);overflow:hidden;background:var(--surface);}',
    '.ei-row{display:grid;grid-template-columns:5rem 1fr;min-height:2.3rem;border-top:1px solid var(--line);align-items:center;}',
    '.ei-row:first-child{border-top:0;}',
    '.ei-cat{font-weight:800;padding:0 .6rem;background:var(--surface-2);height:100%;display:flex;align-items:center;}',
    '.ei-ans{padding:0 .6rem;font-weight:800;font-size:1.15rem;}',
    '.ei-row.is-now{box-shadow:inset 0 0 0 3px var(--sun);}',
    '.ei-row.is-ok .ei-ans{color:var(--good);}',
    '.ei-row.is-bad .ei-ans{color:var(--bad);}',
    '.ei-opts{width:100%;max-width:26rem;}',
    '.ei-opts .g-choice{min-height:3.6rem;font-size:1.35rem;}'
  ].join('');

  BrainGames.register({
    id: 'eretz-ir',
    name: 'ארץ עיר',
    skill: 'language',
    isNew: true,
    tagline: 'אות אחת, והרבה קטגוריות: ארץ, עיר, חי, צומח…',
    benefit: 'שליפת מילים, ידע כללי וגמישות',
    instructions: [
      'למעלה מופיעה אות. בכל שורה יש קטגוריה: ארץ, עיר, חי, צומח, שם, מקצוע, חפץ.',
      'לכל קטגוריה בחרו את המילה שמתחילה באות ושייכת לקטגוריה.',
      'שימו לב: חלק מהתשובות מתחילות באות שנשמעת דומה (ט ו-ת, כ ו-ק, ס ו-ש), או שהן מקטגוריה אחרת.',
      'הדף מתמלא בתשובות שלכם. אין שעון.'
    ],
    css: css,
    _model: { CATS: CATS, spec: spec, makeQuestion: makeQuestion },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      // letters that have words in enough categories
      var letters = ctx.shuffle('אבגדהזחטיכלמנסעפצקרשת'.split('').filter(function (l) {
        return CATS.filter(function (c) { return of(c, l).length; }).length >= sp.cats;
      })).slice(0, sp.letters);
      var plan = [];
      letters.forEach(function (l) {
        var cats = CATS.filter(function (c) { return of(c, l).length; });
        // keep the classic order (ארץ, עיר, חי…) for the chosen categories
        var chosen = ctx.shuffle(cats).slice(0, sp.cats);
        chosen = cats.filter(function (c) { return chosen.indexOf(c) !== -1; });
        plan.push({ letter: l, cats: chosen });
      });
      var total = plan.reduce(function (s, p) { return s + p.cats.length; }, 0);
      var asked = 0, good = 0;

      function playLetter(pi) {
        if (pi >= plan.length) { ctx.finish({ correct: good, total: total, note: 'מילאתם נכון ' + good + ' מתוך ' + total + ' משבצות' }); return; }
        var P = plan[pi];
        root.innerHTML = '';
        var rows = P.cats.map(function (c) {
          var ans = el('span', { class: 'ei-ans' });
          return { row: el('div', { class: 'ei-row' }, [el('span', { class: 'ei-cat' }, c.name), ans]), ans: ans };
        });
        root.appendChild(el('div', { class: 'ei-top' }, [el('span', { class: 'ei-letter', 'aria-label': 'האות ' + P.letter }, P.letter)]));
        root.appendChild(el('div', { class: 'ei-sheet' }, rows.map(function (r) { return r.row; })));
        var box = el('div', { class: 'g-choices ei-opts' });
        root.appendChild(box);

        function ask(ci) {
          if (ci >= P.cats.length) { ctx.wait(900).then(function () { playLetter(pi + 1); }); return; }
          asked++;
          ctx.setProgress(asked, total);
          rows.forEach(function (r, i) { r.row.classList.toggle('is-now', i === ci); });
          var q = makeQuestion(P.cats[ci], P.letter, sp, ctx);
          ctx.setStatus(P.cats[ci].name + ' שמתחיל/ה ב-' + P.letter);
          box.innerHTML = '';
          var done = false;
          q.options.forEach(function (o) {
            var b = el('button', { class: 'g-choice', type: 'button', onclick: function () {
              if (done) return;
              done = true;
              var ok = o === q.right;
              if (ok) good++;
              [].forEach.call(box.children, function (x) { x.disabled = true; if (x.textContent === q.right) x.classList.add('is-correct'); });
              if (!ok) b.classList.add('is-wrong');
              rows[ci].ans.textContent = q.right;
              rows[ci].row.classList.add(ok ? 'is-ok' : 'is-bad');
              var why = ok ? undefined : first(o) !== P.letter ? '"' + o + '" מתחיל ב-' + first(o) + ', לא ב-' + P.letter : '"' + o + '" הוא לא ' + P.cats[ci].name;
              ctx.feedback(ok, why).then(function () { ask(ci + 1); });
            } }, o);
            box.appendChild(b);
          });
        }
        ask(0);
      }
      playLetter(0);
    }
  });
})();
