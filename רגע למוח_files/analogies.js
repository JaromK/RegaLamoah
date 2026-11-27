/* זה כמו זה — word analogies: "כלב זה לגור כמו פרה זה ל...?" (language, reasoning). Untimed. */
(function () {
  'use strict';

  var ROUNDS = 8;

  /* Relations: every pair a:b in one relation works the same way, and each a has one clear b.
     tier 1 = everyday, 2 = needs a little thought, 3 = less common words. */
  var RELATIONS = [
    { id: 'young', tier: 1, why: 'הוא הגור של', pairs: 'כלב:גור|חתול:חתלתול|פרה:עגל|סוס:סייח|כבשה:טלה|תרנגולת:אפרוח|ברווז:ברווזון|עז:גדי|צפרדע:ראשן' },
    { id: 'opp', tier: 1, why: 'הוא ההפך של', pairs: 'חם:קר|גדול:קטן|גבוה:נמוך|יום:לילה|מהיר:איטי|שמח:עצוב|פתוח:סגור|רטוב:יבש|כבד:קל|ארוך:קצר|עשיר:עני|חזק:חלש|מלא:ריק' },
    { id: 'female', tier: 1, why: 'היא הנקבה של', pairs: 'מלך:מלכה|אבא:אמא|סבא:סבתא|חתן:כלה|אח:אחות|דוד:דודה|בן:בת|נכד:נכדה' },
    { id: 'home', tier: 2, why: 'הוא הבית של', pairs: 'דבורה:כוורת|ציפור:קן|כלב:מלונה|סוס:אורווה|פרה:רפת|תרנגולת:לול|אריה:מאורה' },
    { id: 'work', tier: 2, why: 'הוא מקום העבודה של', pairs: 'מורה:כיתה|טבח:מטבח|טייס:מטוס|מלצר:מסעדה|ספרן:ספרייה|חקלאי:שדה|שחקן:במה|כורה:מכרה' },
    { id: 'tool', tier: 2, why: 'זה מה שעושים עם', pairs: 'מספריים:לגזור|עט:לכתוב|מטאטא:לטאטא|סכין:לחתוך|מסור:לנסר|מגהץ:לגהץ|מפתח:לפתוח' },
    { id: 'sense', tier: 2, why: 'זה מה שעושים עם', pairs: 'עין:לראות|אוזן:לשמוע|אף:להריח|לשון:לטעום|רגל:ללכת|שיניים:ללעוס' },
    { id: 'sound', tier: 3, why: 'הוא הקול של', pairs: 'כלב:נביחה|חתול:יללה|פרה:געייה|סוס:צהלה|אריה:שאגה|חמור:נעירה|נחש:לחישה' },
    { id: 'lang', tier: 3, why: 'היא השפה של', pairs: 'צרפת:צרפתית|ספרד:ספרדית|איטליה:איטלקית|יוון:יוונית|רוסיה:רוסית|גרמניה:גרמנית|סין:סינית|ישראל:עברית' },
    { id: 'part', tier: 3, why: 'הוא חלק מ', pairs: 'אות:מילה|מילה:משפט|דקה:שעה|קומה:בניין|עמוד:ספר|שחקן:קבוצה|חייל:צבא' },
    { id: 'more', tier: 3, why: 'הוא הרבה יותר מ', pairs: 'גדול:ענק|קטן:זעיר|קר:קפוא|חם:לוהט|טוב:מצוין|עייף:מותש' }
  ];
  RELATIONS.forEach(function (r) { r.list = r.pairs.split('|').map(function (p) { return p.split(':'); }); });

  /* Per level (1–30): tiers to use, how the wrong answers are chosen (easy: other kinds of words,
     mid: one from the same kind, hard: all from the same kind, e.g. other baby animals), and rev =
     rounds that ask "which pair works the same way?" (hardRev: wrong pairs are reversed or mixed up). */
  var LEVELS = [
    { tiers: [1], d: 'easy' }, { tiers: [1], d: 'easy' }, { tiers: [1], d: 'easy' }, { tiers: [1], d: 'mid' }, { tiers: [1], d: 'mid' },       // 1–5
    { tiers: [1, 2], d: 'easy' }, { tiers: [1, 2], d: 'mid' }, { tiers: [1, 2], d: 'mid' }, { tiers: [2], d: 'mid' }, { tiers: [2], d: 'mid' }, // 6–10
    { tiers: [1, 2], d: 'hard' }, { tiers: [2], d: 'hard' }, { tiers: [2], d: 'hard' }, { tiers: [2, 3], d: 'mid' }, { tiers: [2, 3], d: 'mid' }, // 11–15
    { tiers: [2, 3], d: 'hard' }, { tiers: [3], d: 'mid' }, { tiers: [3], d: 'hard' }, { tiers: [2, 3], d: 'hard' }, { tiers: [3], d: 'hard' },   // 16–20
    { tiers: [2, 3], d: 'hard', rev: 2 }, { tiers: [3], d: 'hard', rev: 2 }, { tiers: [2, 3], d: 'hard', rev: 3 },                                  // 21–23
    { tiers: [3], d: 'hard', rev: 3 }, { tiers: [1, 2, 3], d: 'hard', rev: 4 },                                                                   // 24–25
    { tiers: [2, 3], d: 'hard', rev: 3, hardRev: true }, { tiers: [3], d: 'hard', rev: 3, hardRev: true },                                         // 26–27
    { tiers: [2, 3], d: 'hard', rev: 4, hardRev: true }, { tiers: [3], d: 'hard', rev: 4, hardRev: true }, { tiers: [1, 2, 3], d: 'hard', rev: 5, hardRev: true } // 28–30
  ];

  function makeRound(spec, kind, rnd, usedRel) {
    var rels = RELATIONS.filter(function (r) { return spec.tiers.indexOf(r.tier) !== -1; });
    var fresh = rels.filter(function (r) { return !usedRel[r.id]; });
    var rel = rnd.pick(fresh.length ? fresh : rels);
    usedRel[rel.id] = true;
    var two = rnd.shuffle(rel.list.slice()).slice(0, 2);
    var A = two[0], C = two[1];
    // relations that mean the same thing (tool → use, body part → use) count as one family
    var others = RELATIONS.filter(function (r) { return r.why !== rel.why; });
    if (kind === 'rev') {
      // which pair works like A:B?
      var right = C[0] + ' : ' + C[1];
      var wrong = [];
      if (spec.hardRev) {
        wrong.push(C[1] + ' : ' + C[0]);                                                // backwards
        var third = rnd.pick(rel.list.filter(function (p) { return p !== A && p !== C; }));
        wrong.push(C[0] + ' : ' + third[1]);                                            // mixed up
      }
      rnd.shuffle(others).forEach(function (r) {
        if (wrong.length < 3) { var p = rnd.pick(r.list); var s = p[0] + ' : ' + p[1]; if (s !== right && wrong.indexOf(s) === -1) wrong.push(s); }
      });
      return { kind: 'rev', rel: rel, A: A, C: C, answer: right, options: rnd.shuffle([right].concat(wrong.slice(0, 3))) };
    }
    var answer = C[1];
    var same = rel.list.filter(function (p) { return p !== C && p[1] !== answer; }).map(function (p) { return p[1]; });
    var other = [];
    rnd.shuffle(others).forEach(function (r) { other.push(rnd.pick(r.list)[1]); });
    var lure = A[1];                       // the answer of the first pair: a common slip
    var picks = [];
    function add(w) { if (w && w !== answer && w !== C[0] && picks.indexOf(w) === -1 && picks.length < 3) picks.push(w); }
    if (spec.d === 'hard') { add(lure); rnd.shuffle(same).forEach(add); }
    else if (spec.d === 'mid') { add(rnd.pick(same)); }
    rnd.shuffle(other).forEach(add);
    return { kind: 'fwd', rel: rel, A: A, C: C, answer: answer, options: rnd.shuffle([answer].concat(picks)) };
  }

  var css = [
    '.an-card{display:flex;flex-direction:column;align-items:center;gap:.35rem;width:100%;max-width:26rem;padding:.8rem 1rem;',
    'border-radius:var(--radius);background:var(--language-soft);border:2px solid var(--language);}',
    '.an-pair{font-family:var(--font-display);font-weight:900;font-size:clamp(1.6rem,7vw,2.1rem);line-height:1.2;}',
    '.an-pair .an-colon{color:var(--language);margin:0 .4rem;}',
    '.an-q{color:var(--language);}',
    '.an-mid{font-size:1.1rem;font-weight:700;color:var(--ink-soft);}',
    '.an-choices{max-width:28rem;}',
    '.an-choices .g-choice{font-size:1.35rem;}',
    '.an-why{margin:0;font-size:1.15rem;font-weight:700;text-align:center;text-wrap:balance;min-height:1.6rem;}'
  ].join('');

  BrainGames.register({
    id: 'analogies',
    name: 'זה כמו זה',
    skill: 'language',
    tagline: 'מצאו את המילה שמשלימה את ההשוואה',
    benefit: 'חשיבה מילולית ומציאת קשרים',
    instructions: [
      'למעלה יש זוג מילים, למשל "כלב : גור". חשבו מה הקשר ביניהן.',
      'מתחת יש מילה אחת וסימן שאלה. בחרו את המילה שיוצרת איתה אותו קשר בדיוק.',
      'למשל: כלב זה לגור כמו פרה זה ל... עגל.',
      'ברמות הגבוהות לפעמים בוחרים זוג שלם שעובד באותה דרך. אין שעון.'
    ],
    css: css,
    _makeRound: makeRound,
    _levels: LEVELS,
    _relations: RELATIONS,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var kinds = [];
      for (var k = 0; k < ROUNDS - 1; k++) kinds.push(k < (spec.rev || 0) ? 'rev' : 'fwd');
      kinds = ['fwd'].concat(ctx.shuffle(kinds));
      var round = 0, correct = 0, usedRel = {};

      function pair(a, b) {
        return el('div', { class: 'an-pair' }, [el('span', null, a), el('span', { class: 'an-colon' }, ':'), el('span', { class: b === '?' ? 'an-q' : '' }, b)]);
      }

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: correct, total: ROUNDS, note: 'השלמתם נכון ' + correct + ' מתוך ' + ROUNDS + ' השוואות' });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        if (Object.keys(usedRel).length >= RELATIONS.filter(function (r) { return spec.tiers.indexOf(r.tier) !== -1; }).length) usedRel = {};
        var R = makeRound(spec, kinds[round - 1], ctx, usedRel);
        root.innerHTML = '';
        var card;
        if (R.kind === 'rev') {
          ctx.setStatus('שימו לב, שאלה אחרת: איזה זוג עובד באותה דרך?');
          card = el('div', { class: 'an-card' }, [pair(R.A[0], R.A[1]), el('span', { class: 'an-mid' }, 'כמו איזה זוג?')]);
        } else {
          ctx.setStatus('איזו מילה משלימה את ההשוואה?');
          card = el('div', { class: 'an-card' }, [pair(R.A[0], R.A[1]), el('span', { class: 'an-mid' }, 'כמו'), pair(R.C[0], '?')]);
        }
        var why = el('p', { class: 'an-why', 'aria-live': 'polite' });
        var answered = false;
        var buttons = R.options.map(function (o) {
          return el('button', { class: 'g-choice', type: 'button', onclick: function () { choose(o, this); } }, o);
        });
        root.appendChild(card);
        root.appendChild(el('div', { class: 'g-choices an-choices' }, buttons));
        root.appendChild(why);

        function choose(o, btn) {
          if (answered) return;
          answered = true;
          var ok = o === R.answer;
          if (ok) correct++;
          buttons.forEach(function (b) { b.disabled = true; if (b.textContent === R.answer) b.classList.add('is-correct'); });
          if (!ok) btn.classList.add('is-wrong');
          // the relation in words: "גור הוא הגור של כלב, ועגל הוא הגור של פרה"
          why.textContent = R.A[1] + ' ' + R.rel.why + ' ' + R.A[0] + ', ו' + R.C[1] + ' ' + R.rel.why + ' ' + R.C[0] + '.';
          ctx.feedback(ok, ok ? undefined : 'התשובה: ' + R.answer).then(function () { return ctx.wait(ok ? 900 : 1800); }).then(nextRound);
        }
      }

      nextRound();
    }
  });
})();
