/* גימטריה — every Hebrew letter has a number value (א=1 … י=10, כ=20 … ק=100, ר=200, ש=300, ת=400).
   Work out the value of a word (logic, arithmetic, language). Untimed. */
(function () {
  'use strict';

  var VAL = { 'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10, 'כ': 20, 'ך': 20, 'ל': 30,
    'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90, 'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400 };
  var TABLE = 'אבגדהוזחטיכלמנסעפצקרשת'.split('');

  // words people know, with a small note for the famous ones
  var FAMOUS = { 'חי': 'לכן נותנים מתנות בכפולות של 18', 'אהבה': '', 'אחד': '', 'יין': 'כמו "סוד" (70)', 'סוד': 'כמו "יין" (70)' };
  var WORDS = ('חי אב אם בן בת יד גן דג שן לב עץ אור אש מים ים שיר בית ספר עיר אחד אהבה שלום שבת חלב לחם יין סוד גשם ' +
    'שמש ירח כוכב פרח ילד אמא אבא סבא סבתא משפחה חבר מזל טוב חג ברכה תודה שמחה בריאות כסף זהב עט דלת חלון כיסא שולחן ' +
    'כלב חתול סוס פרה דבש תפוח רימון גפן זית תמר חטה אדם ארץ שמים לילה בוקר ערב יום שנה חודש שעה').split(' ');

  function value(w) { return w.split('').reduce(function (s, ch) { return s + (VAL[ch] || 0); }, 0); }

  /* Level 1–50: kind = what is asked, table = the letter values are shown on screen.
     letter: the value of one letter · pair: two letters · word: a whole word (len = its letters)
     which: which word is worth N · compare: which of two words is worth more */
  function spec(level) {
    var L = level;
    if (L <= 4) return { kinds: ['letter'], pool: L <= 2 ? 10 : 22, table: true };
    if (L <= 8) return { kinds: ['letter', 'pair'], pool: 22, table: true };
    if (L <= 14) return { kinds: ['word'], len: [2, 3], table: true };
    if (L <= 20) return { kinds: ['word', 'which'], len: [3, 4], table: true };
    if (L <= 26) return { kinds: ['word', 'compare'], len: [3, 5], table: true };
    if (L <= 32) return { kinds: ['letter', 'pair', 'word'], len: [2, 3], table: false, pool: 22 };
    if (L <= 40) return { kinds: ['word', 'which', 'compare'], len: [3, 4], table: false };
    return { kinds: ['word', 'which', 'compare'], len: [4, 6], table: false, close: true };
  }

  function wordsOfLen(len) { return WORDS.filter(function (w) { return w.length >= len[0] && w.length <= len[1]; }); }

  // 4 different numbers near the answer
  function near(ans, rnd, close) {
    var set = [ans], steps = close ? [1, 2, 9, 10, 11, 20, 30] : [1, 5, 10, 20, 30, 50, 100];
    while (set.length < 4) {
      var d = rnd.pick(steps) * (rnd.randInt(0, 1) ? 1 : -1), v = ans + d;
      if (v > 0 && set.indexOf(v) === -1) set.push(v);
    }
    return rnd.shuffle(set.map(String));
  }

  function makeQuestion(sp, rnd) {
    var kind = rnd.pick(sp.kinds);
    if (kind === 'letter') {
      var l = rnd.pick(TABLE.slice(0, sp.pool || 22));
      return { show: l, ask: 'כמה שווה האות ' + l + '?', answer: String(VAL[l]), options: near(VAL[l], rnd), explain: l + ' = ' + VAL[l] };
    }
    if (kind === 'pair') {
      var a = rnd.pick(TABLE), b = rnd.pick(TABLE), v = VAL[a] + VAL[b];
      return { show: a + ' + ' + b, ask: 'כמה שוות שתי האותיות יחד?', answer: String(v), options: near(v, rnd), explain: VAL[a] + ' + ' + VAL[b] + ' = ' + v };
    }
    if (kind === 'word') {
      var w = rnd.pick(wordsOfLen(sp.len)), wv = value(w);
      return { show: w, ask: 'כמה שווה המילה בגימטריה?', answer: String(wv), options: near(wv, rnd, sp.close),
        explain: w.split('').map(function (ch) { return VAL[ch]; }).join(' + ') + ' = ' + wv + (FAMOUS[w] ? ' (' + FAMOUS[w] + ')' : '') };
    }
    if (kind === 'which') {
      var pool = rnd.shuffle(wordsOfLen(sp.len));
      var target = pool[0], tv = value(target);
      var others = pool.slice(1).filter(function (x) { return value(x) !== tv; });
      if (sp.close) others.sort(function (x, y) { return Math.abs(value(x) - tv) - Math.abs(value(y) - tv); });
      var opts = rnd.shuffle([target].concat(others.slice(0, 3)));
      return { show: String(tv), ask: 'איזו מילה שווה ' + tv + '?', answer: target, options: opts, words: true,
        explain: target + ': ' + target.split('').map(function (ch) { return VAL[ch]; }).join(' + ') + ' = ' + tv };
    }
    // compare
    var p2 = rnd.shuffle(wordsOfLen(sp.len)), x1 = p2[0];
    var x2 = p2.slice(1).filter(function (x) { return value(x) !== value(x1) && (!sp.close || Math.abs(value(x) - value(x1)) <= 60); })[0] ||
      p2.slice(1).filter(function (x) { return value(x) !== value(x1); })[0];
    var big = value(x1) > value(x2) ? x1 : x2;
    return { show: x1 + ' / ' + x2, ask: 'איזו מילה שווה יותר?', answer: big, options: [x1, x2], words: true,
      explain: x1 + ' = ' + value(x1) + ', ' + x2 + ' = ' + value(x2) };
  }

  var css = [
    '.gm-table{display:grid;grid-template-columns:repeat(11,minmax(0,1fr));gap:2px;width:100%;max-width:30rem;direction:rtl;}',
    '.gm-t{display:flex;flex-direction:column;align-items:center;background:var(--surface-2);border-radius:6px;padding:.1rem 0;line-height:1.05;}',
    '.gm-t b{font-family:var(--font-display);font-size:1.25rem;}',
    '.gm-t span{font-size:.85rem;font-weight:700;color:var(--ink-soft);}',
    '.gm-show{font-family:var(--font-display);font-weight:900;font-size:clamp(2.4rem,11vw,3.4rem);line-height:1.1;text-align:center;}',
    '.gm-ask{margin:0;font-size:1.25rem;font-weight:800;text-align:center;}',
    '.gm-opts{width:100%;max-width:26rem;}',
    '.gm-opts .g-choice{min-height:4rem;font-size:1.7rem;}',
    '.gm-opts.gm-words .g-choice{font-family:var(--font-display);}',
    '.gm-explain{margin:0;font-size:1.2rem;font-weight:700;text-align:center;min-height:1.6rem;direction:rtl;}'
  ].join('');

  BrainGames.register({
    id: 'gematria',
    name: 'גימטריה',
    skill: 'logic',
    isNew: true,
    tagline: 'כמה שווה המילה? חשבון עם אותיות',
    benefit: 'חשבון בראש, זיכרון ושפה',
    instructions: [
      'לכל אות יש ערך: א=1, ב=2 … י=10, כ=20, ל=30 … ק=100, ר=200, ש=300, ת=400.',
      'ערך של מילה הוא סכום האותיות שלה. למשל: חי = ח (8) + י (10) = 18.',
      'בחרו את התשובה הנכונה. ברמות הראשונות טבלת הערכים מופיעה על המסך, ובהמשך זוכרים אותה בעל פה.',
      'אותיות סופיות (ך ם ן ף ץ) שוות כמו האותיות הרגילות. אין שעון.'
    ],
    css: css,
    _model: { value: value, spec: spec, makeQuestion: makeQuestion },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var Q = 8, q = 0, good = 0, last = '';

      function nextQ() {
        if (q >= Q) { ctx.finish({ correct: good, total: Q, note: 'עניתם נכון על ' + good + ' מתוך ' + Q + ' שאלות' }); return; }
        q++;
        ctx.setProgress(q, Q);
        var it;
        for (var t = 0; t < 10; t++) { it = makeQuestion(sp, ctx); if (it.show !== last) break; }
        last = it.show;
        root.innerHTML = '';
        if (sp.table) {
          root.appendChild(el('div', { class: 'gm-table', 'aria-label': 'טבלת ערכים' }, TABLE.map(function (l) {
            return el('div', { class: 'gm-t' }, [el('b', null, l), el('span', null, String(VAL[l]))]);
          })));
        }
        root.appendChild(el('div', { class: 'gm-show' }, it.show));
        root.appendChild(el('p', { class: 'gm-ask' }, it.ask));
        var explain = el('p', { class: 'gm-explain', 'aria-live': 'polite' });
        var box = el('div', { class: 'g-choices gm-opts' + (it.words ? ' gm-words' : '') });
        it.options.forEach(function (o) {
          var b = el('button', { class: 'g-choice', type: 'button', onclick: function () { answer(o, b); } }, o);
          box.appendChild(b);
        });
        root.appendChild(box);
        root.appendChild(explain);
        ctx.setStatus(sp.table ? 'היעזרו בטבלה שלמעלה' : 'בלי טבלה: זוכרים בעל פה');
        var done = false;
        function answer(o, b) {
          if (done) return;
          done = true;
          var ok = o === it.answer;
          if (ok) good++;
          [].forEach.call(box.children, function (x) { x.disabled = true; if (x.textContent === it.answer) x.classList.add('is-correct'); });
          if (!ok) b.classList.add('is-wrong');
          explain.textContent = it.explain;
          ctx.feedback(ok).then(function () { return ctx.wait(1400); }).then(nextQ);
        }
      }
      nextQ();
    }
  });
})();
