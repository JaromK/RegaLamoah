/* זוכרים סיפור — read a short everyday story, then answer questions about it from memory (memory). Untimed.
   Stories are put together from parts (who, when, where, what was bought…), so every answer is known exactly. */
(function () {
  'use strict';

  var NAMES = {
    m: ['יוסי', 'דוד', 'משה', 'אבי', 'שמעון', 'חיים', 'בני', 'רפי', 'עמוס', 'יעקב'],
    f: ['רחל', 'שרה', 'אסתר', 'חנה', 'נורית', 'רינה', 'מירב', 'דנה', 'אורית', 'ציפי']
  };
  var DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
  var PLACES = ['שוק', 'סופר', 'מכולת', 'קניון', 'יריד']; // "לשוק": ל + ה merge in Hebrew
  var RIDES = ['באוטובוס', 'ברכבת', 'במונית', 'באופניים', 'במכונית'];
  var TIMES = ['8:00', '8:30', '9:00', '9:30', '10:00', '10:30', '11:00', '11:30'];
  var ITEMS = ['תפוזים', 'תפוחים', 'ביצים', 'עגבניות', 'מלפפונים', 'לחמניות', 'בננות', 'לימונים'];
  var EXTRA = ['חלב', 'גבינה', 'לחם', 'דבש', 'קפה', 'אורז', 'שמן זית', 'סוכר'];
  var RELATIONS = {
    m: ['השכן', 'החבר', 'האחיין', 'הנכד', 'הבן דוד'],
    f: ['השכנה', 'החברה', 'האחיינית', 'הנכדה', 'הבת דודה']
  };
  var WEATHER = [['גשום', 'מטרייה'], ['חם', 'כובע'], ['קר', 'מעיל'], ['סוער', 'צעיף']];
  var EVENING = [['בישל מרק', 'בישלה מרק'], ['קרא עיתון', 'קראה עיתון'], ['ראה סרט', 'ראתה סרט'],
    ['התקשר לנכדים', 'התקשרה לנכדים'], ['אפה עוגה', 'אפתה עוגה'], ['שיחק שחמט', 'שיחקה שחמט']];
  // verb forms: [masculine, feminine]
  var V = {
    went: ['יצא', 'יצאה'], rode: ['נסע', 'נסעה'], arrived: ['הגיע', 'הגיעה'], met: ['פגש', 'פגשה'],
    bought: ['קנה', 'קנתה'], took: ['לקח', 'לקחה'], paid: ['שילם', 'שילמה'], back: ['חזר', 'חזרה']
  };
  var FACT_ORDER = ['day', 'place', 'time', 'meet', 'buy', 'weather', 'pay', 'evening'];

  /* Per level (1–30): facts in the story, questions about it, lure = wrong choices taken from other
     details of the same story, not = one "what did NOT happen?" question, two = a second person in the story. */
  var LEVELS = [
    { facts: 3, q: 3 }, { facts: 3, q: 3 }, { facts: 4, q: 3 }, { facts: 4, q: 4 }, { facts: 4, q: 4 },            // 1–5
    { facts: 5, q: 4 }, { facts: 5, q: 4 }, { facts: 5, q: 5 }, { facts: 6, q: 4 }, { facts: 6, q: 5 },            // 6–10
    { facts: 6, q: 5, lure: true }, { facts: 6, q: 5, lure: true }, { facts: 7, q: 5, lure: true },                 // 11–13
    { facts: 7, q: 5, lure: true }, { facts: 7, q: 6, lure: true }, { facts: 8, q: 5, lure: true },                 // 14–16
    { facts: 8, q: 6, lure: true }, { facts: 8, q: 6, lure: true }, { facts: 8, q: 6, lure: true }, { facts: 8, q: 6, lure: true }, // 17–20
    { facts: 7, q: 5, lure: true, not: true }, { facts: 8, q: 5, lure: true, not: true }, { facts: 8, q: 6, lure: true, not: true },  // 21–23
    { facts: 8, q: 6, lure: true, not: true }, { facts: 8, q: 6, lure: true, not: true },                         // 24–25
    { facts: 6, q: 5, lure: true, two: true }, { facts: 7, q: 5, lure: true, two: true }, { facts: 7, q: 6, lure: true, two: true }, // 26–28
    { facts: 8, q: 6, lure: true, two: true }, { facts: 8, q: 6, lure: true, two: true, not: true }               // 29–30
  ];

  function v(key, g) { return V[key][g === 'f' ? 1 : 0]; }

  /* One person's details. */
  function person(rnd, g, avoid) {
    avoid = avoid || {};
    function fresh(list, key) { var l = list.filter(function (x) { return x !== avoid[key]; }); return rnd.pick(l.length ? l : list); }
    var g2 = rnd.pick(['m', 'f']);
    var w = rnd.pick(WEATHER.filter(function (x) { return x[0] !== avoid.weather; }));
    return {
      g: g, name: fresh(NAMES[g].filter(function (n) { return n !== avoid.name; }), 'x'),
      day: fresh(DAYS, 'day'), place: fresh(PLACES, 'place'), ride: fresh(RIDES, 'ride'), time: fresh(TIMES, 'time'),
      friend: rnd.pick(NAMES[g2].filter(function (n) { return n !== avoid.name && n !== avoid.friend; })), rel: rnd.pick(RELATIONS[g2]), g2: g2,
      count: rnd.randInt(2, 12), item: fresh(ITEMS, 'item'), extra: fresh(EXTRA, 'extra'),
      weather: w[0], object: w[1], price: rnd.randInt(4, 30) * 5, evening: rnd.randInt(0, EVENING.length - 1)
    };
  }

  function sentence(p, fact, pron) {
    var g = p.g, he = pron ? (g === 'f' ? 'היא' : 'הוא') : p.name;
    switch (fact) {
      case 'day': return p.name + ' ' + v('went', g) + ' מהבית ביום ' + p.day + ' בבוקר.';
      case 'place': return he + ' ' + v('rode', g) + ' ל' + p.place + ' ' + p.ride + '.';
      case 'time': return he + ' ' + v('arrived', g) + ' בשעה ' + p.time + '.';
      case 'meet': return 'שם ' + he + ' ' + v('met', g) + ' את ' + p.friend + ', ' + p.rel + ' ' + (g === 'f' ? 'שלה' : 'שלו') + '.';
      case 'buy': return he + ' ' + v('bought', g) + ' ' + p.count + ' ' + p.item + ' וגם ' + p.extra + '.';
      case 'weather': return 'היה יום ' + p.weather + ', אז ' + he + ' ' + v('took', g) + ' ' + p.object + '.';
      case 'pay': return 'בקופה ' + he + ' ' + v('paid', g) + ' ' + p.price + ' שקלים.';
      default: return 'בערב ' + he + ' ' + v('back', g) + ' הביתה ו' + EVENING[p.evening][g === 'f' ? 1 : 0] + '.';
    }
  }

  /* Question about one fact: { q, a, pool (same kind of answers), lures (from the story) } */
  function question(p, fact, other) {
    var g = p.g, who = p.name;
    var qs = {
      day: { q: 'באיזה יום ' + who + ' ' + v('went', g) + ' מהבית?', a: 'ביום ' + p.day, pool: DAYS.map(function (d) { return 'ביום ' + d; }) },
      place: { q: 'לאן ' + who + ' ' + v('rode', g) + '?', a: 'ל' + p.place, pool: PLACES.map(function (x) { return 'ל' + x; }) },
      ride: { q: 'איך ' + who + ' ' + v('rode', g) + '?', a: p.ride, pool: RIDES.slice() },
      time: { q: 'באיזו שעה ' + who + ' ' + v('arrived', g) + '?', a: p.time, pool: TIMES.slice() },
      meet: { q: 'את מי ' + who + ' ' + v('met', g) + '?', a: p.friend, pool: NAMES.m.concat(NAMES.f) },
      rel: { q: (p.g2 === 'f' ? 'מי הייתה ' : 'מי היה ') + p.friend + '?', a: p.rel, pool: RELATIONS[p.g2].slice() },
      count: { q: 'כמה ' + p.item + ' ' + who + ' ' + v('bought', g) + '?', a: String(p.count),
        pool: [p.count - 2, p.count - 1, p.count + 1, p.count + 2, p.count + 3].filter(function (x) { return x > 0; }).map(String) },
      item: { q: 'מה ' + who + ' ' + v('bought', g) + ' בכמות של ' + p.count + '?', a: p.item, pool: ITEMS.slice() },
      extra: { q: 'מה עוד ' + who + ' ' + v('bought', g) + ' חוץ מה' + p.item + '?', a: p.extra, pool: EXTRA.slice() },
      object: { q: 'מה ' + who + ' ' + v('took', g) + ' בגלל מזג האוויר?', a: p.object, pool: WEATHER.map(function (x) { return x[1]; }) },
      price: { q: 'כמה ' + who + ' ' + v('paid', g) + '?', a: p.price + ' שקלים',
        pool: [p.price - 10, p.price - 5, p.price + 5, p.price + 10, p.price + 15].filter(function (x) { return x > 0; }).map(function (x) { return x + ' שקלים'; }) },
      evening: { q: 'מה ' + who + ' ' + (g === 'f' ? 'עשתה' : 'עשה') + ' בערב?', a: EVENING[p.evening][g === 'f' ? 1 : 0],
        pool: EVENING.map(function (x) { return x[g === 'f' ? 1 : 0]; }) }
    };
    var item = qs[fact];
    // lures: the same kind of detail from elsewhere in the story (or from the other person)
    var lures = [];
    if (fact === 'item' || fact === 'extra') lures.push(fact === 'item' ? p.extra : p.item);
    if (other) {
      // the other person's detail, in this person's words (gender), e.g. what the other one did in the evening
      var asP = {}; Object.keys(other).forEach(function (k) { asP[k] = other[k]; });
      asP.g = p.g; asP.name = p.name;
      var oq = question(asP, fact, null);
      if (oq.a !== item.a) lures.push(oq.a);
    }
    if (fact === 'meet' && other) lures.push(other.name);
    item.lures = lures;
    return item;
  }

  // which question kinds a fact allows
  var Q_OF = { day: ['day'], place: ['place', 'ride'], time: ['time'], meet: ['meet', 'rel'], buy: ['count', 'item', 'extra'],
    weather: ['object'], pay: ['price'], evening: ['evening'] };

  function choices(item, lure, rnd) {
    var out = [item.a];
    if (lure) item.lures.forEach(function (l) { if (out.length < 3 && out.indexOf(l) === -1) out.push(l); });
    rnd.shuffle(item.pool).forEach(function (x) { if (out.length < 4 && out.indexOf(x) === -1) out.push(x); });
    return rnd.shuffle(out);
  }

  /* A whole story: text and questions. */
  function makeStory(spec, rnd) {
    var g = rnd.pick(['m', 'f']);
    var A = person(rnd, g);
    var facts = ['day', 'place'].concat(rnd.shuffle(FACT_ORDER.slice(2)).slice(0, spec.facts - 2));
    facts = FACT_ORDER.filter(function (f) { return facts.indexOf(f) !== -1; });
    var lines = facts.map(function (f, i) { return sentence(A, f, i > 0 && i % 2 === 1); });
    var B = null, bFacts = [];
    if (spec.two) {
      B = person(rnd, g === 'f' ? 'm' : 'f', A);
      B.place = A.place; B.day = A.day;
      bFacts = ['buy', 'evening'].concat(facts.indexOf('time') !== -1 ? ['time'] : []);
      lines.push('גם ' + B.name + ' ' + (B.g === 'f' ? 'הייתה' : 'היה') + ' שם באותו יום. ' + (B.g === 'f' ? 'היא' : 'הוא') + ' ' + v('arrived', B.g) + ' בשעה ' + B.time +
        ', ' + v('bought', B.g) + ' ' + B.count + ' ' + B.item + ' וגם ' + B.extra + ', ובערב ' + EVENING[B.evening][B.g === 'f' ? 1 : 0] + '.');
    }
    // questions: one per fact kind, spread over the story
    var pool = [];
    facts.forEach(function (f) { Q_OF[f].forEach(function (k) { pool.push({ p: A, k: k, other: B }); }); });
    bFacts.forEach(function (f) { Q_OF[f].forEach(function (k) { pool.push({ p: B, k: k, other: A }); }); });
    pool = rnd.shuffle(pool);
    var qs = [], usedK = {};
    pool.forEach(function (x) {
      var key = x.p.name + x.k;
      if (qs.length < spec.q - (spec.not ? 1 : 0) && !usedK[key] && !(x.k === 'rel' && usedK[A.name + 'meet'])) {
        usedK[key] = true;
        var it = question(x.p, x.k, x.other);
        qs.push({ q: it.q, a: it.a, options: choices(it, spec.lure, rnd) });
      }
    });
    if (spec.not) {
      // three things that happened and one that did not (a detail swapped)
      var told = facts.map(function (f) { return sentence(A, f, false); });
      var trueOnes = rnd.shuffle(told).slice(0, 3);
      var falseOne = null;
      for (var tries = 0; tries < 30 && (!falseOne || told.indexOf(falseOne) !== -1); tries++) {
        var fake = person(rnd, g, A);
        fake.name = A.name;
        falseOne = sentence(fake, rnd.pick(facts.filter(function (f) { return f !== 'day'; })), false);
      }
      qs.push({ q: 'מה מהדברים האלה לא קרה בסיפור?', a: falseOne, options: rnd.shuffle(trueOnes.concat([falseOne])), long: true });
    }
    return { text: lines, questions: rnd.shuffle(qs), name: A.name };
  }

  var css = [
    '.sr-story{width:100%;max-width:32rem;background:var(--memory-soft);border:2px solid var(--memory);border-radius:var(--radius);',
    'padding:.6rem .9rem;font-size:1.1rem;line-height:1.45;margin:0;}',
    '.sr-story p{margin:0 0 .15rem;}',
    '.sr-q{font-size:1.35rem;font-weight:800;text-align:center;margin:0;text-wrap:balance;}',
    '.sr-choices{max-width:30rem;}',
    '.sr-choices.is-long{grid-template-columns:1fr;}',
    '.sr-choices.is-long .g-choice{font-size:1.1rem;text-align:start;min-height:3.4rem;}',
    '.sr-count{margin:0;color:var(--ink-soft);font-weight:700;}'
  ].join('');

  BrainGames.register({
    id: 'story-recall',
    name: 'זוכרים סיפור',
    skill: 'memory',
    tagline: 'קראו סיפור קצר וענו על שאלות מהזיכרון',
    benefit: 'זיכרון של פרטים ושל סיפור יומיומי',
    startLevel: 1,
    instructions: [
      'יופיע סיפור קצר על יום אחד של מישהו. קראו אותו בנחת, אפשר גם פעמיים.',
      'כשתהיו מוכנים, לחצו "קראתי, לשאלות". הסיפור ייעלם.',
      'ענו על השאלות מהזיכרון. אחרי כל תשובה תראו את התשובה הנכונה.',
      'ברמות הגבוהות יש בסיפור יותר פרטים, ולפעמים שני אנשים.'
    ],
    css: css,
    _makeStory: makeStory,
    _levels: LEVELS,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var STORIES = 2;
      var story = 0, correct = 0, total = 0;

      function nextStory() {
        story++;
        if (story > STORIES) {
          ctx.finish({ correct: correct, total: total, note: 'זכרתם ' + correct + ' מתוך ' + total + ' פרטים' });
          return;
        }
        ctx.setProgress(story, STORIES);
        var S = makeStory(spec, ctx);
        root.innerHTML = '';
        ctx.setStatus('קראו את הסיפור וזכרו את הפרטים');
        var box = el('div', { class: 'sr-story' }, S.text.map(function (t) { return el('p', null, t); }));
        var ready = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { ready.disabled = true; ask(S, 0); } }, 'קראתי, לשאלות');
        root.appendChild(box);
        root.appendChild(el('div', { class: 'g-actions' }, ready));
        ctx.studyTimer(ready, 6000 + 3500 * S.text.length);
      }

      function ask(S, i) {
        if (i >= S.questions.length) { nextStory(); return; }
        var Q = S.questions[i];
        root.innerHTML = '';
        ctx.setStatus('שאלה ' + (i + 1) + ' מתוך ' + S.questions.length);
        var answered = false;
        var buttons = Q.options.map(function (o) {
          return el('button', { class: 'g-choice', type: 'button', onclick: function () { choose(o, this); } }, o);
        });
        root.appendChild(el('p', { class: 'sr-q' }, Q.q));
        root.appendChild(el('div', { class: 'g-choices sr-choices' + (Q.long ? ' is-long' : '') }, buttons));

        function choose(o, btn) {
          if (answered) return;
          answered = true;
          total++;
          var ok = o === Q.a;
          if (ok) correct++;
          buttons.forEach(function (b) { b.disabled = true; if (b.textContent === Q.a) b.classList.add('is-correct'); });
          if (!ok) btn.classList.add('is-wrong');
          ctx.feedback(ok, ok ? undefined : (Q.long ? 'זה לא קרה: ' + Q.a : 'התשובה: ' + Q.a))
            .then(function () { return ctx.wait(ok ? 300 : 900); })
            .then(function () { ask(S, i + 1); });
        }
      }

      nextStory();
    }
  });
})();
