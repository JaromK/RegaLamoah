/* קופסת תרופות — fill a weekly pill box from the doctor's note: which pill, which days, what time of day
   (executive, planning, attention to detail). Untimed. */
(function () {
  'use strict';

  var DAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  var DAY_NAMES = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  var ALL_TIMES = ['בוקר', 'צהריים', 'ערב', 'לילה'];
  // the time slots in a box with T rows: two rows are morning and evening
  function slots(T) { return T === 2 ? ['בוקר', 'ערב'] : ALL_TIMES.slice(0, T); }
  var PILLS = [
    { name: 'אדום', c: '--c-red' }, { name: 'כחול', c: '--c-blue' }, { name: 'צהוב', c: '--c-yellow' }, { name: 'שחור', c: '--c-black' }
  ];

  /* Level 1–50: pills = how many kinds, times = time slots in the box, rules = which kinds of rules may appear. */
  function spec(level) {
    var L = level;
    var pills = L <= 5 ? 1 : L <= 14 ? 2 : L <= 30 ? 3 : 4;
    var times = L <= 8 ? 2 : L <= 24 ? 3 : 4;
    var rules = ['daily'];
    if (L >= 4) rules.push('twice');
    if (L >= 10) rules.push('days', 'except');
    if (L >= 18) rules.push('weekdays', 'other');
    if (L >= 26) rules.push('weekend', 'three');
    if (L >= 38) rules.push('notWith');
    return { pills: pills, times: times, rules: rules };
  }

  // a rule → { text, cells: set of "day,time" }
  function makeRule(kind, sp, rnd, used, prev) {
    var T = sp.times, TIMES = slots(T), t = rnd.randInt(0, T - 1), cells = {}, d, text;
    function add(day, time) { cells[day + ',' + time] = true; }
    if (kind === 'daily') { for (d = 0; d < 7; d++) add(d, t); text = 'כל יום ב' + TIMES[t]; }
    else if (kind === 'twice') {
      var a = 0, b = TIMES.indexOf('ערב');
      for (d = 0; d < 7; d++) { add(d, a); add(d, b); }
      text = 'פעמיים ביום: ב' + TIMES[a] + ' וב' + TIMES[b];
    } else if (kind === 'three') {
      for (d = 0; d < 7; d++) { add(d, 0); add(d, 1); add(d, 2); }
      text = 'שלוש פעמים ביום: בוקר, צהריים וערב';
    } else if (kind === 'days') {
      var set = rnd.pick([[0, 2, 4], [1, 3, 5], [0, 3], [1, 4], [2, 5]]);
      set.forEach(function (x) { add(x, t); });
      text = 'רק בימים ' + set.map(function (x) { return DAY_NAMES[x]; }).join(', ') + ', ב' + TIMES[t];
    } else if (kind === 'except') {
      var skip = rnd.randInt(0, 6);
      for (d = 0; d < 7; d++) if (d !== skip) add(d, t);
      text = 'כל יום ב' + TIMES[t] + ', חוץ מיום ' + DAY_NAMES[skip];
    } else if (kind === 'weekdays') {
      for (d = 0; d < 5; d++) add(d, t);
      text = 'בימי ראשון עד חמישי, ב' + TIMES[t];
    } else if (kind === 'weekend') {
      add(5, t); add(6, t);
      text = 'רק בשישי ובשבת, ב' + TIMES[t];
    } else if (kind === 'other') {
      var start = rnd.randInt(0, 1);
      for (d = start; d < 7; d += 2) add(d, t);
      text = 'יום כן ויום לא, ב' + TIMES[t] + ', מתחילים ביום ' + DAY_NAMES[start];
    } else { // notWith: on the days the previous pill is not taken (at any time)
      var daysOf = {};
      Object.keys(prev.cells).forEach(function (k) { daysOf[k.split(',')[0]] = true; });
      for (d = 0; d < 7; d++) if (!daysOf[d]) add(d, t);
      text = 'רק בימים שבהם אין כדור ' + prev.pill.name + ', ב' + TIMES[t];
      if (!Object.keys(cells).length) return null;
    }
    return { text: text, cells: cells };
  }

  function makeNote(sp, rnd) {
    var note = [];
    for (var i = 0; i < sp.pills; i++) {
      var r = null;
      for (var t = 0; t < 20 && !r; t++) {
        var kinds = sp.rules.filter(function (k) { return k !== 'notWith' || (i > 0 && note[i - 1] && Object.keys(note[i - 1].cells).length < 7 * 2); });
        r = makeRule(rnd.pick(kinds), sp, rnd, null, note[i - 1]);
        // two pills with the very same schedule would be dull
        if (r && note.some(function (n) { return n.text === r.text; })) r = null;
      }
      r.pill = PILLS[i];
      note.push(r);
    }
    return note;
  }

  var css = [
    '.pb-note{width:100%;max-width:28rem;background:var(--surface);border:2px solid var(--line);border-radius:var(--radius-sm);padding:.3rem;margin:0;',
    'display:flex;flex-direction:column;gap:.1rem;}',
    '.pb-line{display:flex;gap:.45rem;align-items:flex-start;font:inherit;font-weight:700;font-size:1rem;line-height:1.2;text-align:start;',
    'background:transparent;border:2px solid transparent;border-radius:8px;padding:.2rem .35rem;color:var(--ink);cursor:pointer;}',
    '.pb-line[aria-pressed="true"]{border-color:var(--sun);background:var(--sun-soft);}',
    '.pb-dot{display:inline-block;width:1.1rem;height:1.1rem;border-radius:50%;flex:none;margin-top:.15rem;border:2px solid var(--ink);}',
    '.pb-box{display:grid;grid-template-columns:3.6rem repeat(7,minmax(0,1fr));gap:3px;width:100%;max-width:28rem;direction:rtl;}',
    '.pb-h{font-weight:800;text-align:center;font-size:1rem;align-self:center;}',
    '.pb-t{font-weight:800;font-size:.9rem;align-self:center;}',
    '.pb-cell{min-height:2.3rem;min-width:0;padding:2px;border:2px solid var(--line);border-radius:8px;background:var(--surface-2);cursor:pointer;',
    'display:flex;flex-wrap:wrap;align-content:center;justify-content:center;gap:2px;}',
    '.pb-cell .pb-dot{width:.85rem;height:.85rem;margin:0;border-width:1.5px;}',
    '.pb-cell.is-bad{border-color:var(--c-red);box-shadow:inset 0 0 0 2px var(--c-red);}',
    '.pb-cell.is-good{border-color:var(--good);}',
    '.pb-pick{display:flex;flex-wrap:wrap;gap:.4rem;justify-content:center;}',
    '.pb-pick .btn{display:inline-flex;align-items:center;gap:.4rem;}',
    '.pb-pick .btn[aria-pressed="true"]{box-shadow:0 0 0 4px var(--sun);}'
  ].join('');

  BrainGames.register({
    id: 'pill-box',
    name: 'קופסת תרופות',
    skill: 'executive',
    isNew: true,
    tagline: 'מלאו את קופסת התרופות השבועית לפי הרופא',
    benefit: 'תכנון, הקפדה על פרטים וזיכרון עבודה',
    instructions: [
      'בפתק של הרופא כתוב איזה כדור לוקחים, באילו ימים ובאיזו שעה ביום.',
      'לחצו על שורה בפתק כדי לבחור כדור, ואז על המשבצות בקופסה שבהן הוא צריך להיות. לחיצה נוספת מוציאה אותו.',
      'כשהקופסה מוכנה לחצו "בדיקה". משבצת עם טעות תסומן באדום, ואפשר לתקן.',
      'אין שעון. קראו את הפתק בעיון.'
    ],
    css: css,
    _model: { spec: spec, makeNote: makeNote },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = 2, round = 0, good = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) { ctx.finish({ correct: good, total: ROUNDS, note: 'מילאתם נכון ' + good + ' מתוך ' + ROUNDS + ' קופסאות' }); return; }
        ctx.setProgress(round, ROUNDS);
        play(makeNote(sp, ctx));
      }

      function dot(p) { return el('span', { class: 'pb-dot', style: { background: 'var(' + p.c + ')' }, 'aria-hidden': 'true' }); }

      function play(note) {
        root.innerHTML = '';
        var box = {}; // "day,time" → { pillIndex: true }
        var cur = 0, checks = 0, done = false;
        // each line of the note is also the button that picks its pill
        var pickBtns = note.map(function (n, i) {
          return el('button', { class: 'pb-line', type: 'button', 'aria-pressed': i === 0 ? 'true' : 'false',
            onclick: function () { cur = i; ctx.sound('tap'); pickBtns.forEach(function (b, j) { b.setAttribute('aria-pressed', j === i ? 'true' : 'false'); }); } },
            [dot(n.pill), el('span', null, [el('b', null, n.pill.name + ': '), n.text])]);
        });
        root.appendChild(el('div', { class: 'pb-note', 'aria-label': 'הפתק של הרופא' }, pickBtns));
        var cells = {}, TIMES = slots(sp.times);
        var grid = [el('span')].concat(DAYS.map(function (d) { return el('span', { class: 'pb-h' }, d); }));
        for (var t = 0; t < sp.times; t++) {
          grid.push(el('span', { class: 'pb-t' }, TIMES[t]));
          for (var d = 0; d < 7; d++) (function (k, d, t) {
            cells[k] = el('button', { class: 'pb-cell', type: 'button', 'aria-label': 'יום ' + DAY_NAMES[d] + ', ' + TIMES[t], onclick: function () { toggle(k); } });
            grid.push(cells[k]);
          })(d + ',' + t, d, t);
        }
        root.appendChild(el('div', { class: 'pb-box' }, grid));
        var checkBtn = el('button', { class: 'btn btn-primary', type: 'button', onclick: check }, 'בדיקה');
        var actions = el('div', { class: 'g-actions' }, checkBtn);
        root.appendChild(actions);
        ctx.setStatus(note.length > 1 ? 'בחרו כדור בפתק, ואז את המשבצות שלו' : 'לחצו על המשבצות שבהן צריך כדור');

        function draw(k) {
          var c = cells[k];
          c.innerHTML = '';
          note.forEach(function (n, i) { if (box[k] && box[k][i]) c.appendChild(dot(n.pill)); });
        }
        function toggle(k) {
          if (done) return;
          ctx.sound('tap');
          box[k] = box[k] || {};
          if (box[k][cur]) delete box[k][cur]; else box[k][cur] = true;
          cells[k].classList.remove('is-bad');
          draw(k);
        }
        function check() {
          if (done) return;
          checks++;
          var bad = 0;
          Object.keys(cells).forEach(function (k) {
            var wrong = note.some(function (n, i) { return !!(n.cells[k]) !== !!(box[k] && box[k][i]); });
            cells[k].classList.toggle('is-bad', wrong);
            if (wrong) bad++;
          });
          if (bad) {
            ctx.sound('bad');
            ctx.setStatus(bad === 1 ? 'משבצת אחת לא נכונה (מסומנת באדום). תקנו ובדקו שוב' : bad + ' משבצות לא נכונות (מסומנות באדום). תקנו ובדקו שוב');
            if (checks >= 3) showAnswer();
            return;
          }
          finishBox(checks === 1);
        }
        function showAnswer() {
          Object.keys(cells).forEach(function (k) {
            box[k] = {};
            note.forEach(function (n, i) { if (n.cells[k]) box[k][i] = true; });
            draw(k);
            cells[k].classList.remove('is-bad');
          });
          finishBox(false, 'כך הקופסה צריכה להיראות');
        }
        function finishBox(ok, msg) {
          done = true;
          if (ok) good++;
          Object.keys(cells).forEach(function (k) { cells[k].disabled = true; });
          ctx.setStatus(msg || (ok ? 'הקופסה מוכנה ומדויקת!' : 'הקופסה מוכנה, אחרי תיקון'));
          ctx.feedback(ok, msg).then(function () {
            actions.innerHTML = '';
            if (ok) { ctx.wait(600).then(nextRound); return; } // a correct answer moves on by itself
            var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { next.disabled = true; nextRound(); } },
              round >= ROUNDS ? 'לסיכום' : 'לקופסה הבאה');
            actions.appendChild(next);
          });
        }
      }
      nextRound();
    }
  });
})();
