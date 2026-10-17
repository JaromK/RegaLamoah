/* מילים נרדפות — pick the word with the same (or, from level 8, the opposite) meaning. */
(function () {
  'use strict';

  var ROUNDS = 8;

  /* Meaning groups. Each group: [id, part of speech, 'word+tier|word+tier...', opposite id].
     Tier 1 = everyday word, 2 = richer, 3 = literary / rare.
     a = adjective (masc. sing.), v = verb (past, 3rd masc. sing.), n = noun, d = adverb. */
  var GROUPS = [
    // adjectives
    ['happy', 'a', 'שמח1|מאושר1|עליז2|צוהל3', 'sad'],
    ['sad', 'a', 'עצוב1|עגום2|מדוכדך3|נוגה3', 'happy'],
    ['big', 'a', 'גדול1|ענק1|עצום2|כביר3', 'small'],
    ['small', 'a', 'קטן1|קטנטן1|זעיר2|פעוט3', 'big'],
    ['fast', 'a', 'מהיר1|זריז1', 'slow'],
    ['slow', 'a', 'איטי1|מתמהמה3', 'fast'],
    ['strong', 'a', 'חזק1|חסון2|איתן2', 'weak'],
    ['weak', 'a', 'חלש1|רפה3', 'strong'],
    ['smart', 'a', 'חכם1|נבון2|פיקח2', 'stupid'],
    ['stupid', 'a', 'טיפש1|שוטה2|כסיל3', 'smart'],
    ['pretty', 'a', 'יפה1|נאה2|הדור3', 'ugly'],
    ['ugly', 'a', 'מכוער1', 'pretty'],
    ['brave', 'a', 'אמיץ1|נועז2', 'coward'],
    ['coward', 'a', 'פחדן1|מוג לב3', 'brave'],
    ['rich', 'a', 'עשיר1|אמיד2', 'poor'],
    ['poor', 'a', 'עני1|דל2|אביון3', 'rich'],
    ['elderly', 'a', 'זקן1|קשיש2|ישיש2', 'young'],
    ['young', 'a', 'צעיר1', 'elderly'],
    ['oldthing', 'a', 'ישן1|עתיק2|מיושן2', 'newthing'],
    ['newthing', 'a', 'חדש1|חדיש2', 'oldthing'],
    ['tired', 'a', 'עייף1|תשוש2|יגע3', 'fresh'],
    ['fresh', 'a', 'רענן1', 'tired'],
    ['quiet', 'a', 'שקט1|דומם2|חרישי3', 'noisy'],
    ['noisy', 'a', 'רועש1|הומה3', 'quiet'],
    ['calm', 'a', 'רגוע1|שלו2|נינוח2', 'angry'],
    ['angry', 'a', 'כועס1|זועם2|נרגז2', 'calm'],
    ['easy', 'a', 'קל1|פשוט1', 'hard'],
    ['hard', 'a', 'קשה1|מסובך1|מורכב2|סבוך3', 'easy'],
    ['clean', 'a', 'נקי1|מצוחצח3', 'dirty'],
    ['dirty', 'a', 'מלוכלך1|מטונף2|מזוהם2', 'clean'],
    ['hot', 'a', 'חם1|לוהט2|רותח2', 'cold'],
    ['cold', 'a', 'קר1|צונן2', 'hot'],
    ['full', 'a', 'מלא1|גדוש2|עמוס2', 'empty'],
    ['empty', 'a', 'ריק1|חלול2|נבוב3', 'full'],
    ['tall', 'a', 'גבוה1|רם3|נישא3', 'low'],
    ['low', 'a', 'נמוך1', 'tall'],
    ['wide', 'a', 'רחב1|נרחב2|מרווח2', 'narrow'],
    ['narrow', 'a', 'צר1|דחוק3', 'wide'],
    ['generous', 'a', 'נדיב1', 'stingy'],
    ['stingy', 'a', 'קמצן1|צר עין3', 'generous'],
    ['honest', 'a', 'ישר1|הגון2', 'dishonest'],
    ['dishonest', 'a', 'שקרן1|רמאי1|נוכל2', 'honest'],
    ['lazy', 'a', 'עצלן1|עצל2|בטלן2', 'diligent'],
    ['diligent', 'a', 'חרוץ1|שקדן2', 'lazy'],
    ['famous', 'a', 'מפורסם1|ידוע1|נודע2|מהולל3', 'unknown'],
    ['unknown', 'a', 'אלמוני2', 'famous'],
    ['strange', 'a', 'מוזר1|משונה2|תמוה3', 'ordinary'],
    ['ordinary', 'a', 'רגיל1|שגרתי2', 'strange'],
    ['important', 'a', 'חשוב1|משמעותי1|מהותי2', 'minor'],
    ['minor', 'a', 'שולי2|זניח2|טפל3', 'important'],
    ['dark', 'a', 'חשוך1|אפל2', 'bright'],
    ['bright', 'a', 'מואר1|בהיר1', 'dark'],
    ['wet', 'a', 'רטוב1|לח2', 'dry'],
    ['dry', 'a', 'יבש1|צחיח3', 'wet'],
    ['polite', 'a', 'מנומס1|אדיב1', 'rude'],
    ['rude', 'a', 'חצוף1|גס רוח2', 'polite'],
    ['terrible', 'a', 'נורא1|איום1|מחריד2', 'wonderful'],
    ['wonderful', 'a', 'נפלא1|נהדר1|מופלא3', 'terrible'],
    ['thin', 'a', 'רזה1|צנום2|כחוש3', 'fat'],
    ['fat', 'a', 'שמן1', 'thin'],
    ['rare', 'a', 'נדיר1|יקר המציאות3', 'common'],
    ['common', 'a', 'נפוץ1|שכיח2|מצוי3', 'rare'],
    ['modest', 'a', 'צנוע1|עניו2', 'arrogant'],
    ['arrogant', 'a', 'יהיר2|שחצן2|מתנשא2', 'modest'],
    ['loyal', 'a', 'נאמן1|מסור2', 'traitor'],
    ['traitor', 'a', 'בוגדני2', 'loyal'],
    ['funny', 'a', 'מצחיק1|משעשע2|היתולי3', null],
    ['boring', 'a', 'משעמם1|מייגע2|חדגוני3', 'interesting'],
    ['interesting', 'a', 'מעניין1|מרתק1', 'boring'],
    ['soft', 'a', 'רך1|ענוג3', 'rigid'],
    ['rigid', 'a', 'נוקשה2|קשיח2', 'soft'],
    // verbs
    ['start', 'v', 'התחיל1|החל2', 'finish'],
    ['finish', 'v', 'סיים1|גמר1|השלים2', 'start'],
    ['look', 'v', 'הסתכל1|הביט1|התבונן2', null],
    ['run', 'v', 'רץ1|דהר2', null],
    ['speak', 'v', 'דיבר1|שוחח1', 'silent'],
    ['silent', 'v', 'שתק1', 'speak'],
    ['shout', 'v', 'צעק1|צרח2|זעק2', 'whisper'],
    ['whisper', 'v', 'לחש1', 'shout'],
    ['help', 'v', 'עזר1|סייע2', 'hinder'],
    ['hinder', 'v', 'הפריע1', 'help'],
    ['want', 'v', 'רצה1|חפץ3', null],
    ['understand', 'v', 'הבין1|תפס2', null],
    ['think', 'v', 'חשב1|הרהר2', null],
    ['build', 'v', 'בנה1|הקים1', 'destroy'],
    ['destroy', 'v', 'הרס1|החריב3', 'build'],
    ['climb', 'v', 'עלה1|טיפס1', 'descend'],
    ['descend', 'v', 'ירד1', 'climb'],
    ['win', 'v', 'ניצח1|זכה2', 'lose'],
    ['lose', 'v', 'הפסיד1', 'win'],
    ['love', 'v', 'אהב1|חיבב2', 'hate'],
    ['hate', 'v', 'שנא1|תיעב3', 'love'],
    ['give', 'v', 'נתן1|העניק2', 'take'],
    ['take', 'v', 'לקח1|נטל3', 'give'],
    ['buy', 'v', 'קנה1|רכש2', 'sell'],
    ['sell', 'v', 'מכר1', 'buy'],
    ['agree', 'v', 'הסכים1|נאות3', 'refuse'],
    ['refuse', 'v', 'סירב1|מיאן3', 'agree'],
    ['hide', 'v', 'הסתיר1|החביא1', 'reveal'],
    ['reveal', 'v', 'גילה1|חשף2', 'hide'],
    ['fix', 'v', 'תיקן1|שיפץ2', 'break'],
    ['break', 'v', 'קלקל1|שבר1', 'fix'],
    ['grow', 'v', 'גדל1|צמח1', null],
    ['arrive', 'v', 'הגיע1|בא1', 'leave'],
    ['leave', 'v', 'עזב1|נטש2', 'arrive'],
    ['ask', 'v', 'שאל1', 'reply'],
    ['reply', 'v', 'ענה1|השיב2', 'ask'],
    ['praise', 'v', 'החמיא1|שיבח2|הילל2', 'condemn'],
    ['condemn', 'v', 'גינה2', 'praise'],
    ['cry', 'v', 'בכה1|ייבב3', 'laugh'],
    ['laugh', 'v', 'צחק1|גיחך3', 'cry'],
    ['hurry', 'v', 'מיהר1|הזדרז2|נחפז3', 'linger'],
    ['linger', 'v', 'התמהמה3|השתהה3', 'hurry'],
    ['wait', 'v', 'חיכה1|המתין2', null],
    ['collect', 'v', 'אסף1|ליקט2|קיבץ3', 'scatter'],
    ['scatter', 'v', 'פיזר2', 'collect'],
    ['increase', 'v', 'הגדיל1|הגביר2', 'decrease'],
    ['decrease', 'v', 'הקטין1|הפחית2|צמצם2', 'increase'],
    ['forgive', 'v', 'סלח1|מחל2', null],
    ['succeed', 'v', 'הצליח1|שגשג3', 'fail'],
    ['fail', 'v', 'נכשל1', 'succeed'],
    ['protect', 'v', 'שמר1|הגן1|גונן3', null],
    ['explain', 'v', 'הסביר1|הבהיר2|ביאר3', null],
    ['allow', 'v', 'הרשה1|התיר2', 'forbid'],
    ['forbid', 'v', 'אסר1', 'allow'],
    ['stop', 'v', 'הפסיק1|חדל3', 'continue'],
    ['continue', 'v', 'המשיך1', 'stop'],
    ['jump', 'v', 'קפץ1|דילג2', null],
    ['throw', 'v', 'זרק1|השליך2', null],
    // nouns
    ['friend', 'n', 'חבר1|ידיד1', 'enemy'],
    ['enemy', 'n', 'אויב1|יריב2', 'friend'],
    ['house', 'n', 'בית1|מעון3|משכן3', null],
    ['fear', 'n', 'פחד1|חשש2|אימה2|מורא3', 'courage'],
    ['courage', 'n', 'אומץ1|תעוזה2', 'fear'],
    ['joy', 'n', 'שמחה1|אושר1|עליצות2|חדווה3', 'sorrow'],
    ['sorrow', 'n', 'עצב1|צער1|יגון3', 'joy'],
    ['road', 'n', 'דרך1|נתיב2|מסלול2', null],
    ['gift', 'n', 'מתנה1|שי2|תשורה3|מנחה3', null],
    ['end', 'n', 'סוף1|סיום1|תום2|קץ3', 'beginning'],
    ['beginning', 'n', 'התחלה1|ראשית2|תחילה2', 'end'],
    ['light', 'n', 'אור1|זוהר2', 'darkness'],
    ['darkness', 'n', 'חושך1|אפלה2', 'light'],
    ['strength', 'n', 'כוח1|חוזק1|עוצמה2', 'weakness'],
    ['weakness', 'n', 'חולשה1', 'strength'],
    ['money', 'n', 'כסף1|הון2|ממון3', null],
    ['mistake', 'n', 'טעות1|שגיאה1|משגה3', null],
    ['war', 'n', 'מלחמה1|קרב2', 'peace'],
    ['peace', 'n', 'שלום1', 'war'],
    ['answer', 'n', 'תשובה1|מענה2', 'question'],
    ['question', 'n', 'שאלה1', 'answer'],
    ['story', 'n', 'סיפור1|מעשייה2', null],
    ['helpn', 'n', 'עזרה1|סיוע2', null],
    ['truth', 'n', 'אמת1', 'lie'],
    ['lie', 'n', 'שקר1|כזב3', 'truth'],
    ['wisdom', 'n', 'חוכמה1|תבונה2|בינה2', null],
    ['city', 'n', 'עיר1|כרך3', null],
    ['hope', 'n', 'תקווה1', 'despair'],
    ['despair', 'n', 'ייאוש2', 'hope'],
    ['danger', 'n', 'סכנה1|סיכון2', null],
    ['clothes', 'n', 'בגד1|לבוש2|מלבוש3', null],
    ['noise', 'n', 'רעש1|המולה2|שאון3', 'silence'],
    ['silence', 'n', 'דממה2', 'noise'],
    ['illness', 'n', 'מחלה1|חולי3', 'health'],
    ['health', 'n', 'בריאות1', 'illness'],
    ['food', 'n', 'אוכל1|מזון1', null],
    ['work', 'n', 'עבודה1|מלאכה2|עמל3', 'rest'],
    ['rest', 'n', 'מנוחה1', 'work'],
    ['pain', 'n', 'כאב1|מכאוב3', null],
    ['anger', 'n', 'כעס1|זעם2|חרון3', null],
    ['secret', 'n', 'סוד1|רז3', null],
    ['pleasure', 'n', 'הנאה1|עונג2', null],
    ['trip', 'n', 'טיול1|מסע2', null],
    // adverbs
    ['quickly', 'd', 'מהר1|במהירות1|חיש3', 'slowly'],
    ['slowly', 'd', 'לאט1|באיטיות1', 'quickly'],
    ['always', 'd', 'תמיד1|תדיר3', 'never'],
    ['never', 'd', 'אף פעם1', 'always'],
    ['now', 'd', 'עכשיו1|כעת2|עתה2', null],
    ['alot', 'd', 'הרבה1|בשפע2', 'little'],
    ['little', 'd', 'מעט1|קצת1', 'alot'],
    ['together', 'd', 'יחד1|בצוותא3', 'alone'],
    ['alone', 'd', 'לבד1|לחוד2', 'together'],
    ['early', 'd', 'מוקדם1', 'late'],
    ['late', 'd', 'מאוחר1', 'early'],
    ['suddenly', 'd', 'פתאום1|לפתע2', null]
  ];

  /* Groups that are close in meaning; never used as distractors for each other. */
  var NEAR = [
    'quiet calm', 'elderly oldthing', 'young newthing', 'big tall', 'big wide', 'big strong',
    'small low', 'small narrow', 'small thin', 'fast diligent', 'slow lazy', 'weak tired',
    'pretty wonderful', 'honest loyal', 'polite modest', 'rude arrogant', 'strange rare',
    'ordinary common', 'ordinary boring', 'dark sad', 'hard rigid', 'stingy narrow',
    'speak explain', 'reply explain', 'reveal explain', 'shout cry', 'understand think',
    'destroy break', 'climb increase', 'climb grow', 'grow increase', 'win succeed', 'lose fail',
    'take collect', 'hide protect', 'finish stop', 'leave stop', 'hurry run', 'linger wait',
    'joy pleasure', 'sorrow pain', 'illness pain', 'strength courage', 'road trip', 'mistake lie',
    'anger sorrow', 'helpn gift', 'quickly early', 'quickly now', 'quickly suddenly', 'always alot',
    'now suddenly', 'fear danger'
  ];

  var BY_ID = {};
  GROUPS.forEach(function (g) {
    BY_ID[g[0]] = {
      id: g[0], pos: g[1], opp: g[3], near: {},
      words: g[2].split('|').map(function (s) { return { w: s.slice(0, -1), t: Number(s.slice(-1)) }; })
    };
  });
  NEAR.forEach(function (pair) {
    var p = pair.split(' ');
    BY_ID[p[0]].near[p[1]] = true;
    BY_ID[p[1]].near[p[0]] = true;
  });
  var ALL = GROUPS.map(function (g) { return BY_ID[g[0]]; });

  /* Difficulty by level (index = level - 1). */
  var MAX_T = [1, 1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3];
  // Chance a round must include at least a tier-2 word / a tier-3 word.
  var P2 = [0, 0, 0, 0.25, 0.5, 0.7, 0.85, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  var P3 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0.15, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 1, 1, 1, 1];
  // Antonym rounds per session.
  var ANT = [0, 0, 0, 0, 0, 0, 0, 2, 2, 3, 3, 3, 4, 4, 4, 4, 4, 4, 4, 4];
  // Chance of a "trap" choice (the opposite in a synonym round, a synonym in an antonym round).
  var TRAP = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0.25, 0.35, 0.45, 0.55, 0.7, 0.7, 0.8, 0.8, 0.9];

  var CSS = [
    '.sy-wrap{width:100%;display:flex;flex-direction:column;align-items:center;gap:1.1rem}',
    '.sy-rule{display:inline-block;padding:.35rem 1.1rem;border-radius:999px;font-weight:800;font-size:1.15rem}',
    '.sy-rule.is-syn{background:var(--language-soft);color:var(--language)}',
    '.sy-rule.is-ant{background:var(--sun);color:var(--ink)}',
    '.sy-word{overflow-wrap:anywhere}',
    '.sy-choices{max-width:30rem;grid-template-columns:repeat(2,minmax(0,1fr))}',
    '.sy-choice{font-size:clamp(1.25rem,5vw,1.5rem);min-height:4.4rem;overflow-wrap:anywhere;padding-inline:.5rem}',
    '.sy-explain{min-height:3rem;font-size:1.1rem;font-weight:600;text-align:center;text-wrap:balance;color:var(--ink);',
    'padding:.6rem 1rem;border-radius:var(--radius-sm);max-width:34rem;width:100%}',
    '.sy-explain.is-good{background:var(--good-soft);color:var(--good)}',
    '.sy-explain.is-bad{background:var(--bad-soft);color:var(--ink)}'
  ].join('');

  BrainGames.register({
    id: 'synonyms',
    name: 'מילים נרדפות',
    skill: 'language',
    tagline: 'מצאו מילה עם משמעות דומה',
    benefit: 'אוצר מילים, שליפת מילים וגמישות לשונית',
    instructions: [
      'קראו את המילה הגדולה שבמרכז.',
      'בחרו מבין ארבע האפשרויות את המילה שדומה לה במשמעות.',
      'בשלבים מתקדמים תתבקשו לפעמים לבחור דווקא מילה הפוכה. קראו את השאלה בכל שלב.'
    ],
    css: CSS,
    start: function (root, ctx) {
      var level = Math.max(1, Math.min(20, Math.round(Number(ctx.level) || 1)));
      var maxT = MAX_T[level - 1];
      var round = 0;
      var correct = 0;
      var antTotal = 0;
      var antCorrect = 0;
      var usedGroups = {};
      var prevKind = 'syn';

      var kinds = [];
      for (var k = 0; k < ROUNDS - 1; k++) kinds.push(k < ANT[level - 1] ? 'ant' : 'syn');
      kinds = ['syn'].concat(ctx.shuffle(kinds));

      function within(list) { return list.filter(function (o) { return o.t <= maxT; }); }

      /* Every (prompt, answer) pair for a group, with the hardest tier in the pair. */
      function pairs(g, kind) {
        var out = [];
        var src = within(g.words);
        if (kind === 'syn') {
          src.forEach(function (a) { src.forEach(function (b) { if (a !== b) out.push({ p: a, a: b, t: Math.max(a.t, b.t) }); }); });
        } else if (g.opp) {
          var tgt = within(BY_ID[g.opp].words);
          src.forEach(function (a) { tgt.forEach(function (b) { out.push({ p: a, a: b, t: Math.max(a.t, b.t) }); }); });
        }
        return out;
      }

      function pickQuestion(kind) {
        var need = Math.random() < P3[level - 1] ? 3 : (Math.random() < P2[level - 1] ? 2 : 1);
        for (; need >= 1; need--) {
          var cands = [];
          ALL.forEach(function (g) {
            if (usedGroups[g.id] || (g.opp && usedGroups[g.opp])) return;
            pairs(g, kind).forEach(function (pr) { if (pr.t >= need) cands.push({ g: g, pr: pr }); });
          });
          if (cands.length) {
            var c = ctx.pick(cands);
            usedGroups[c.g.id] = true;
            return c;
          }
        }
        return null;
      }

      /* Three wrong choices of the same part of speech, never from the same,
         opposite or near-meaning groups. */
      function pickDistractors(g, ans, kind) {
        var block = {};
        block[g.id] = true;
        if (g.opp) block[g.opp] = true;
        Object.keys(g.near).forEach(function (id) { block[id] = true; });
        if (g.opp) Object.keys(BY_ID[g.opp].near).forEach(function (id) { block[id] = true; });
        var minT = level >= 18 ? 2 : 1;
        var pool = [];
        ALL.forEach(function (o) {
          if (o.pos !== g.pos || block[o.id]) return;
          o.words.forEach(function (w) { if (w.t <= maxT) pool.push({ w: w.w, t: w.t, gid: o.id }); });
        });
        // Prefer words of the same tier as the answer, so the answer does not stand out.
        var ranked = ctx.shuffle(pool).sort(function (x, y) {
          var dx = Math.abs(x.t - ans.t) + (x.t < minT ? 2 : 0);
          var dy = Math.abs(y.t - ans.t) + (y.t < minT ? 2 : 0);
          return dx - dy;
        });
        var out = [];
        var usedG = {};
        var trap = null;
        if (Math.random() < TRAP[level - 1]) {
          var trapGroup = kind === 'syn' ? (g.opp && BY_ID[g.opp]) : g;
          if (trapGroup) {
            var tw = within(trapGroup.words).filter(function (w) { return w.w !== ans.w; });
            if (kind === 'ant') tw = tw.filter(function (w) { return w.w !== currentPrompt; });
            if (tw.length) { trap = ctx.pick(tw).w; out.push(trap); }
          }
        }
        for (var i = 0; i < ranked.length && out.length < 3; i++) {
          var r = ranked[i];
          if (usedG[r.gid] || out.indexOf(r.w) !== -1 || r.w === ans.w) continue;
          usedG[r.gid] = true;
          out.push(r.w);
        }
        return { list: out, trap: trap };
      }

      var currentPrompt = '';

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          var note = 'ענו נכון על ' + correct + ' מתוך ' + ROUNDS + '.';
          if (antTotal) note += ' שאלות "הפוכה במשמעות": ' + antCorrect + ' מתוך ' + antTotal + '.';
          ctx.finish({ correct: correct, total: ROUNDS, note: note });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var kind = kinds[round - 1];
        var q = pickQuestion(kind);
        if (!q && kind === 'ant') { kind = 'syn'; q = pickQuestion(kind); }
        if (!q) { usedGroups = {}; q = pickQuestion(kind); }
        var isAnt = kind === 'ant';
        if (isAnt) antTotal++;
        var changed = level >= 8 && kind !== prevKind;
        prevKind = kind;

        var g = q.g;
        var prompt = q.pr.p.w;
        var ans = q.pr.a;
        currentPrompt = prompt;
        var dis = pickDistractors(g, ans, kind);
        var choiceWords = ctx.shuffle([ans.w].concat(dis.list));

        var question = isAnt ? 'איזו מילה הפוכה במשמעות?' : 'איזו מילה דומה במשמעות?';
        ctx.setStatus((changed ? 'שימו לב! ' : '') + question);

        var explain = ctx.el('p', { class: 'sy-explain', 'aria-live': 'polite' });
        var choices = ctx.el('div', { class: 'g-choices sy-choices' });
        var buttons = [];
        var answered = false;
        choiceWords.forEach(function (w) {
          var b = ctx.el('button', { class: 'g-choice sy-choice', type: 'button', text: w, onclick: function () { answer(w, b); } });
          buttons.push({ w: w, btn: b });
          choices.appendChild(b);
        });

        root.innerHTML = '';
        root.appendChild(ctx.el('div', { class: 'sy-wrap' }, [
          ctx.el('span', { class: 'sy-rule ' + (isAnt ? 'is-ant' : 'is-syn'), text: isAnt ? '↔ מילה הפוכה' : '= מילה דומה' }),
          ctx.el('p', { class: 'g-big sy-word', text: prompt }),
          choices,
          explain
        ]));

        function answer(w, btn) {
          if (answered) return;
          answered = true;
          var ok = w === ans.w;
          buttons.forEach(function (o) {
            o.btn.disabled = true;
            if (o.w === ans.w) o.btn.classList.add('is-correct');
          });
          if (!ok) btn.classList.add('is-wrong');
          var reason = isAnt
            ? '"' + ans.w + '" הפוכה ל"' + prompt + '".'
            : '"' + ans.w + '" ו"' + prompt + '" דומות במשמעות.';
          if (!ok && w === dis.trap) {
            reason += isAnt
              ? ' "' + w + '" דווקא דומה ל"' + prompt + '".'
              : ' "' + w + '" היא דווקא ההפך.';
          }
          if (ok) {
            correct++;
            if (isAnt) antCorrect++;
            explain.className = 'sy-explain is-good';
            explain.textContent = 'נכון! ' + reason;
          } else {
            explain.className = 'sy-explain is-bad';
            explain.textContent = reason;
          }
          ctx.feedback(ok, ok ? null : 'התשובה הנכונה: ' + ans.w)
            .then(function () { return ctx.wait(ok ? 900 : 2000); })
            .then(nextRound);
        }
      }

      nextRound();
      return function cleanup() { root.innerHTML = ''; };
    }
  });
})();
