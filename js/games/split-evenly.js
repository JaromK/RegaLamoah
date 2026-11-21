/* חלוקה שווה — share a pile of items equally between baskets (logic). Untimed. */
(function () {
  'use strict';

  var ROUNDS = 8;
  var ITEMS = ['🍎', '🍓', '🍊', '🍋', '🍒', '🍐', '🍑', '🍌', '🥝'];
  var BASKET = '🧺';
  // Toast text is plain RTL, so explanations use words ("חלקי") rather than ÷ symbols.

  // Per level (1–50): item range, basket range and question kinds.
  // share = "how many in each basket?" (always divides evenly)
  // can   = "can it be split evenly?" (yes / no)
  // left  = "how many are left over?"
  // Items are capped (20 up to level 15, 24 above) so the pile stays readable and fits one
  // screen; top levels grow harder through more baskets and more remainder questions.
  var LEVELS = [
    { min: 4, max: 6, pMin: 2, pMax: 2, kinds: ['share'] },                    // 1
    { min: 4, max: 8, pMin: 2, pMax: 2, kinds: ['share'] },                    // 2
    { min: 6, max: 10, pMin: 2, pMax: 3, kinds: ['share'] },                   // 3
    { min: 6, max: 12, pMin: 2, pMax: 3, kinds: ['share'] },                   // 4
    { min: 6, max: 12, pMin: 2, pMax: 3, kinds: ['share', 'can'] },            // 5
    { min: 8, max: 15, pMin: 2, pMax: 3, kinds: ['share', 'can'] },            // 6
    { min: 8, max: 16, pMin: 2, pMax: 4, kinds: ['share', 'can'] },            // 7
    { min: 8, max: 18, pMin: 3, pMax: 4, kinds: ['share', 'can'] },            // 8
    { min: 9, max: 18, pMin: 3, pMax: 4, kinds: ['share', 'can', 'left'] },    // 9
    { min: 10, max: 20, pMin: 2, pMax: 4, kinds: ['share', 'can', 'left'] },   // 10
    { min: 10, max: 20, pMin: 3, pMax: 5, kinds: ['share', 'can', 'left'] },   // 11
    { min: 11, max: 20, pMin: 3, pMax: 5, kinds: ['share', 'can', 'left'] },   // 12
    { min: 12, max: 20, pMin: 3, pMax: 5, kinds: ['share', 'can', 'left'] },   // 13
    { min: 12, max: 20, pMin: 3, pMax: 6, kinds: ['share', 'can', 'left'] },   // 14
    { min: 12, max: 20, pMin: 4, pMax: 6, kinds: ['share', 'left', 'left'] },  // 15
    { min: 15, max: 24, pMin: 4, pMax: 6, kinds: ['share', 'can', 'left'] },   // 16
    { min: 16, max: 24, pMin: 4, pMax: 6, kinds: ['left', 'can', 'left'] },    // 17
    { min: 16, max: 24, pMin: 5, pMax: 6, kinds: ['share', 'left', 'left'] },  // 18
    { min: 18, max: 24, pMin: 5, pMax: 6, kinds: ['can', 'left', 'left'] },    // 19
    { min: 18, max: 24, pMin: 5, pMax: 6, kinds: ['left', 'left', 'share'] },  // 20
    // 21–30: the same pile (at most 24); new questions: how many to add so it splits evenly (need),
    // and how many are missing so every basket gets T (target)
    { min: 18, max: 24, pMin: 5, pMax: 6, kinds: ['left', 'need', 'share'] },  // 21
    { min: 18, max: 24, pMin: 5, pMax: 6, kinds: ['need', 'left', 'need'] },   // 22
    { min: 20, max: 24, pMin: 4, pMax: 6, kinds: ['need', 'can', 'left'] },    // 23
    { min: 20, max: 24, pMin: 5, pMax: 6, kinds: ['need', 'need', 'left'] },   // 24
    { min: 20, max: 24, pMin: 5, pMax: 6, kinds: ['need', 'left', 'share'] },  // 25
    { min: 20, max: 24, pMin: 5, pMax: 6, kinds: ['target', 'need', 'left'] }, // 26
    { min: 20, max: 24, pMin: 5, pMax: 6, kinds: ['target', 'need', 'target'] }, // 27
    { min: 21, max: 24, pMin: 5, pMax: 6, kinds: ['target', 'need', 'left'] }, // 28
    { min: 21, max: 24, pMin: 6, pMax: 6, kinds: ['target', 'target', 'need'] }, // 29
    { min: 22, max: 24, pMin: 6, pMax: 6, kinds: ['target', 'need', 'target'] }, // 30
    // 31–40: plus  = "one more basket arrives: how many in each?" (the new basket is not drawn),
    //        which = "into how many baskets does it split evenly?" (one of four numbers),
    //        mix   = two kinds of fruit, every basket gets the same of each kind: how many are left over?
    { min: 20, max: 24, pMin: 4, pMax: 6, kinds: ['target', 'need', 'plus'] },  // 31
    { min: 20, max: 24, pMin: 4, pMax: 6, kinds: ['plus', 'need', 'target'] },  // 32
    { min: 20, max: 24, pMin: 4, pMax: 6, kinds: ['plus', 'which', 'need'] },   // 33
    { min: 20, max: 24, pMin: 4, pMax: 6, kinds: ['which', 'plus', 'target'] }, // 34
    { min: 20, max: 24, pMin: 3, pMax: 5, kinds: ['mix', 'plus', 'need'] },     // 35
    { min: 20, max: 24, pMin: 3, pMax: 5, kinds: ['mix', 'which', 'target'] },  // 36
    { min: 20, max: 24, pMin: 3, pMax: 6, kinds: ['mix', 'plus', 'which'] },    // 37
    { min: 20, max: 24, pMin: 3, pMax: 6, kinds: ['mix', 'mix', 'plus'] },      // 38
    { min: 20, max: 24, pMin: 4, pMax: 6, kinds: ['mix', 'which', 'target'] },  // 39
    { min: 20, max: 24, pMin: 4, pMax: 6, kinds: ['mix', 'plus', 'mix'] },      // 40
    // 41–50: mixneed = two kinds: how many to add so that each kind splits evenly;
    //        mix3 = three kinds of fruit: how many are left over in all?
    { min: 20, max: 24, pMin: 3, pMax: 5, kinds: ['mixneed', 'mix', 'plus'] },     // 41
    { min: 20, max: 24, pMin: 3, pMax: 6, kinds: ['mixneed', 'which', 'mix'] },    // 42
    { min: 20, max: 24, pMin: 3, pMax: 6, kinds: ['mixneed', 'mix', 'target'] },   // 43
    { min: 20, max: 24, pMin: 4, pMax: 6, kinds: ['mixneed', 'mixneed', 'mix'] },  // 44
    { min: 20, max: 24, pMin: 4, pMax: 6, kinds: ['mixneed', 'mix', 'plus'] },     // 45
    { min: 20, max: 24, pMin: 3, pMax: 5, kinds: ['mix3', 'mixneed', 'mix'] },     // 46
    { min: 20, max: 24, pMin: 3, pMax: 5, kinds: ['mix3', 'mixneed', 'plus'] },    // 47
    { min: 20, max: 24, pMin: 3, pMax: 6, kinds: ['mix3', 'mixneed', 'mix'] },     // 48
    { min: 20, max: 24, pMin: 3, pMax: 6, kinds: ['mix3', 'mix3', 'mixneed'] },    // 49
    { min: 20, max: 24, pMin: 4, pMax: 6, kinds: ['mix3', 'mixneed', 'mix3'] }     // 50
  ];

  function uniqChoices(answer, cands, min) {
    var u = [];
    cands.forEach(function (v) { if (v >= min && v !== answer && u.indexOf(v) === -1) u.push(v); });
    var extra = 1;
    while (u.length < 3) { [answer + extra, answer - extra].forEach(function (v) { if (v >= min && v !== answer && u.indexOf(v) === -1 && u.length < 3) u.push(v); }); extra++; }
    return [answer].concat(u.slice(0, 3)).sort(function (a, b) { return a - b; });
  }

  /* Levels 31–50: the kinds with more than one step (pure, also used by tests). */
  function makeHardRound(level, rng, kind) {
    var s = LEVELS[level - 1], plates, t;
    if (kind === 'plus') {
      plates = ri(rng, s.pMin, s.pMax);
      var items = ri(rng, s.min, s.max);
      var n2 = plates + 1, q2 = Math.floor(items / n2);
      return { kind: kind, items: items, plates: plates, newPlates: n2, each: q2, rest: items % n2, goal: 0, answer: q2,
        choices: uniqChoices(q2, [Math.floor(items / plates), q2 + 1, q2 - 1, q2 + 2], 1) };
    }
    if (kind === 'which') {
      for (t = 0; t < 300; t++) {
        var n = ri(rng, s.min, s.max);
        var divs = [], non = [];
        for (var d = 2; d <= 9; d++) (n % d === 0 ? divs : non).push(d);
        if (!divs.length || non.length < 3) continue;
        var ans = pk(rng, divs);
        var wrong = [];
        while (wrong.length < 3) { var w = pk(rng, non); if (wrong.indexOf(w) === -1) wrong.push(w); }
        return { kind: kind, items: n, plates: ans, each: n / ans, rest: 0, goal: 0, answer: ans,
          choices: [ans].concat(wrong).sort(function (a, b) { return a - b; }) };
      }
    }
    // mix, mixneed, mix3: several kinds of fruit; each kind is shared on its own
    var nk = kind === 'mix3' ? 3 : 2;
    for (t = 0; t < 500; t++) {
      plates = ri(rng, s.pMin, kind === 'mix3' ? Math.min(5, s.pMax) : s.pMax);
      var groups = [];
      for (var g = 0; g < nk; g++) groups.push(nk === 3 ? ri(rng, 5, 9) : ri(rng, 7, 14));
      var total = groups.reduce(function (a, b) { return a + b; }, 0);
      if (total < s.min || total > s.max) continue;
      var rests = groups.map(function (x) { return x % plates; });
      var adds = rests.map(function (r) { return r ? plates - r : 0; });
      var restSum = rests.reduce(function (a, b) { return a + b; }, 0);
      var addSum = adds.reduce(function (a, b) { return a + b; }, 0);
      // the rule must matter: sharing the kinds separately gives another answer than one big pile
      if (kind === 'mixneed') {
        var lump = total % plates ? plates - total % plates : 0;
        if (rests.filter(Boolean).length < 2 || addSum === lump) continue;
        return { kind: kind, items: total, plates: plates, groups: groups, rests: rests, adds: adds, goal: 0,
          each: Math.floor(total / plates), rest: 0, answer: addSum,
          choices: uniqChoices(addSum, [lump, addSum + 1, addSum - 1, adds[0], addSum + plates], 1) };
      }
      if (rests.filter(Boolean).length < 2 || restSum === total % plates) continue;
      return { kind: kind, items: total, plates: plates, groups: groups, rests: rests, goal: 0,
        each: Math.floor(total / plates), rest: restSum, answer: restSum,
        choices: uniqChoices(restSum, [total % plates, restSum + 1, restSum - 1, rests[0], restSum + 2], 0) };
    }
    return null;
  }

  function ri(rng, a, b) { return a + Math.floor(rng() * (b - a + 1)); }
  function pk(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

  // Build one round. `kind` may be forced (so a session mixes kinds evenly).
  function makeRound(level, rng, kind) {
    var s = LEVELS[level - 1];
    kind = kind || pk(rng, s.kinds);
    if (/^(plus|which|mix|mixneed|mix3)$/.test(kind)) return makeHardRound(level, rng, kind);
    var plates, items, i, t;
    var wantYes = rng() < 0.5;
    for (t = 0; t < 300; t++) {
      plates = ri(rng, s.pMin, s.pMax);
      if (kind === 'share') {
        var each = ri(rng, Math.max(1, Math.ceil(s.min / plates)), Math.floor(s.max / plates));
        items = plates * each;
      } else {
        items = ri(rng, s.min, s.max);
      }
      if (items < s.min || items > s.max || items < plates) continue;
      if (kind === 'can' && (items % plates === 0) !== wantYes) continue;
      if (kind === 'need' && items % plates === 0) continue;
      break;
    }
    var q = Math.floor(items / plates), r = items % plates;
    var answer, choices, goal = 0;
    if (kind === 'need' || kind === 'target') {
      goal = kind === 'need' ? q + 1 : q + ri(rng, r ? 1 : 2, 2);
      answer = plates * goal - items;
      var c2 = [answer - 1, answer + 1, r, plates, answer + plates, answer - plates, answer + 2].filter(function (v) {
        return v >= 1 && v !== answer;
      });
      var u2 = [];
      c2.forEach(function (v) { if (u2.indexOf(v) === -1) u2.push(v); });
      choices = [answer].concat(u2.slice(0, 3)).sort(function (a, b) { return a - b; });
    } else if (kind === 'share') {
      answer = q;
      var cand = [q - 1, q + 1, q + 2, q - 2, plates, items - plates].filter(function (v) {
        return v >= 1 && v !== q;
      });
      var uniq = [];
      cand.forEach(function (v) { if (uniq.indexOf(v) === -1) uniq.push(v); });
      choices = [q].concat(uniq.slice(0, 3)).sort(function (a, b) { return a - b; });
    } else if (kind === 'can') {
      answer = r === 0 ? 'yes' : 'no';
      choices = ['yes', 'no'];
    } else {
      answer = r;
      var top = Math.max(3, Math.min(plates - 1, r + 2));
      choices = [];
      for (i = top - 3; i <= top; i++) choices.push(i);
      if (choices.indexOf(r) === -1) choices[0] = r;
      choices.sort(function (a, b) { return a - b; });
    }
    return { kind: kind, items: items, plates: plates, each: q, rest: r, goal: goal, answer: answer, choices: choices };
  }

  var css = [
    '.se-wrap{width:100%;max-width:26rem;display:flex;flex-direction:column;align-items:center;gap:.7rem;}',
    '.se-pile{width:100%;box-sizing:border-box;display:flex;flex-wrap:wrap;justify-content:center;gap:.3rem .7rem;padding:.5rem .4rem;',
    'border-radius:var(--radius);background:var(--surface-2);border:2px solid var(--line);direction:ltr;}',
    '.se-five{display:flex;gap:.1rem;}',
    '.se-it{width:1.75rem;font-size:1.55rem;line-height:1.15;text-align:center;user-select:none;-webkit-user-select:none;}',
    '.se-baskets{width:100%;display:flex;justify-content:center;gap:.3rem;}',
    '.se-basket{flex:1 1 0;min-width:0;max-width:3.8rem;padding:.2rem 0;border-radius:var(--radius-sm);background:var(--logic-soft);',
    'border:2px solid var(--logic);display:flex;flex-direction:column;align-items:center;}',
    '.se-basket-ic{font-size:1.55rem;line-height:1.15;}',
    '.se-basket-n{font-size:1.15rem;font-weight:900;min-height:1.4rem;font-variant-numeric:tabular-nums;color:var(--ink);}',
    '.se-q{font-size:1.25rem;font-weight:700;text-align:center;margin:0;text-wrap:balance;}',
    '.se-q.se-done{font-size:1.35rem;}',
    '.se-eq{direction:ltr;unicode-bidi:isolate;font-weight:900;font-variant-numeric:tabular-nums;}',
    '.se-choices{grid-template-columns:repeat(4,minmax(0,1fr));gap:.5rem;}',
    '.se-choices.se-yn{grid-template-columns:repeat(2,minmax(0,1fr));}',
    '.se-choices .g-choice{min-height:3.6rem;padding:.5rem .2rem;font-size:1.7rem;font-variant-numeric:tabular-nums;}',
    '.se-choices.se-yn .g-choice{font-size:1.25rem;}',
    '.se-break{flex-basis:100%;height:0;border-top:2px dashed var(--line);margin:.1rem 0;}',
    '.se-basket.se-new{border-style:dashed;}'
  ].join('');

  function eqText(r) {
    return r.items + ' ÷ ' + r.plates + ' = ' + r.each;
  }

  // Short Hebrew explanation, used in the toast after a mistake.
  function explain(r) {
    if (r.kind === 'plus') {
      return 'עם עוד סלסלה יש ' + r.newPlates + ' סלסלות: ' + r.items + ' חלקי ' + r.newPlates + ' הם ' + r.each +
        (r.rest ? ', ונשארים ' + r.rest : '');
    }
    if (r.kind === 'which') {
      return r.items + ' חלקי ' + r.answer + ' הם ' + r.each + ' בלי שארית. עם המספרים האחרים נשארת שארית';
    }
    if (r.kind === 'mix' || r.kind === 'mix3') {
      return r.groups.map(function (g, i) { return r.icons[i] + ' ' + g + ': נשארים ' + r.rests[i]; }).join(' · ') +
        '. בסך הכול נשארים ' + r.answer;
    }
    if (r.kind === 'mixneed') {
      return r.groups.map(function (g, i) { return r.icons[i] + ' ' + g + ': חסרים ' + r.adds[i]; }).join(' · ') +
        '. בסך הכול צריך להוסיף ' + r.answer;
    }
    if (r.kind === 'need' || r.kind === 'target') {
      return 'כדי שבכל סלסלה יהיו ' + r.goal + ' צריך ' + r.plates + ' כפול ' + r.goal + ' = ' + (r.plates * r.goal) +
        ' פירות. יש ' + r.items + ', אז חסרים ' + r.answer;
    }
    if (r.rest === 0) {
      return r.items + ' חלקי ' + r.plates + ' הם ' + r.each +
        (r.kind === 'can' ? ', בלי שארית' : r.kind === 'left' ? ', לא נשאר כלום' : '');
    }
    return 'כל סלסלה מקבלת ' + r.each + ', ונשארים ' + r.rest;
  }

  BrainGames.register({
    id: 'split-evenly',
    name: 'חלוקה שווה',
    skill: 'logic',
    tagline: 'חלקו את הפירות שווה בשווה בין הסלסלות',
    benefit: 'חילוק, שארית וחשיבה כמותית',
    instructions: [
      'יופיעו ערימה של פירות וכמה סלסלות.',
      'הפירות מסודרים בקבוצות של 5 כדי שיהיה קל לספור.',
      'חשבו איך מחלקים אותם שווה בשווה, וענו על השאלה.',
      'אין מגבלת זמן. אפשר לספור כמה פעמים שרוצים.',
      'ברמות הגבוהות יש שאלות של כמה שלבים: מה קורה אם מגיעה עוד סלסלה, לכמה סלסלות אפשר לחלק, ופירות מכמה סוגים, שכל סוג מתחלק לחוד.'
    ],
    css: css,
    _makeRound: makeRound,
    _model: { LEVELS: LEVELS, makeRound: makeRound },
    _levels: LEVELS.length,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var kinds = LEVELS[level - 1].kinds;
      // Spread the question kinds evenly through the session.
      var plan = [];
      for (var i = 0; i < ROUNDS; i++) plan.push(kinds[i % kinds.length]);
      plan = ctx.shuffle(plan);
      var round = 0, score = 0;

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({
            correct: score, total: ROUNDS,
            note: 'חילקתם נכון ' + score + ' מתוך ' + ROUNDS + ' ערימות'
          });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        playRound(makeRound(level, Math.random, plan[round - 1]));
      }

      function playRound(r) {
        root.innerHTML = '';
        var icon = ctx.pick(ITEMS);
        r.icons = ctx.shuffle(ITEMS).slice(0, 3);
        if (r.groups) icon = r.icons[0];
        ctx.setStatus({
          plus: 'אם תגיע עוד סלסלה אחת, כמה פירות יהיו בכל סלסלה?',
          which: 'לכמה סלסלות אפשר לחלק את כל הפירות שווה בשווה, בלי שארית?',
          mix: 'כל סלסלה מקבלת אותו מספר מכל סוג. כמה פירות יישארו בחוץ?',
          mix3: 'כל סלסלה מקבלת אותו מספר מכל סוג. כמה פירות יישארו בחוץ?',
          mixneed: 'כל סוג צריך להתחלק שווה. כמה פירות צריך להוסיף, לכל הפחות?',
          share: 'כמה יהיו בכל סלסלה?',
          can: 'אפשר לחלק שווה בלי שארית?',
          left: 'כמה יישארו בחוץ?',
          need: 'כמה פירות צריך להוסיף, לכל הפחות, כדי שהחלוקה תצא שווה?',
          target: 'כמה פירות חסרים כדי שבכל סלסלה יהיו ' + r.goal + '?'
        }[r.kind]);

        var blocks = [];
        (r.groups || [r.items]).forEach(function (cnt, gi) {
          var ic = r.groups ? r.icons[gi] : icon;
          if (gi > 0) blocks.push(el('div', { class: 'se-break', 'aria-hidden': 'true' }));
          for (var k = 0; k < cnt; k += 5) {
            var five = [];
            for (var m = k; m < Math.min(cnt, k + 5); m++) {
              five.push(el('span', { class: 'se-it', 'aria-hidden': 'true' }, ic));
            }
            blocks.push(el('div', { class: 'se-five' }, five));
          }
        });
        var pile = el('div', { class: 'se-pile', role: 'img', 'aria-label': r.groups ? r.groups.join(' ו־') + ' פירות' : r.items + ' פירות' }, blocks);

        var counts = [];
        var baskets = [];
        // "which": the number of baskets is the question, so no baskets are drawn until the answer
        for (var p = 0; p < (r.kind === 'which' ? 0 : r.plates); p++) {
          var n = el('span', { class: 'se-basket-n' }, '');
          counts.push(n);
          baskets.push(el('div', { class: 'se-basket' }, [
            el('span', { class: 'se-basket-ic', 'aria-hidden': 'true' }, BASKET), n
          ]));
        }

        var basketRow = el('div', { class: 'se-baskets' }, baskets);
        var qText = r.kind === 'which' ? r.items + ' פירות'
          : r.groups ? r.groups.map(function (g, i) { return g + ' ' + r.icons[i]; }).join(' ו־') + ', ' + r.plates + ' סלסלות'
          : r.items + ' פירות, ' + r.plates + ' סלסלות';
        var qLine = el('p', { class: 'se-q', 'aria-live': 'polite' }, qText);

        var answered = false;
        var labels = { yes: 'כן, בלי שארית', no: 'לא, תישאר שארית' };
        var buttons = r.choices.map(function (c) {
          return el('button', {
            class: 'g-choice', type: 'button',
            onclick: function () { choose(c, this); }
          }, labels[c] || String(c));
        });
        var actions = el('div', { class: 'g-actions' });

        root.appendChild(el('div', { class: 'se-wrap' }, [
          pile,
          basketRow,
          qLine,
          el('div', { class: 'g-choices se-choices' + (r.kind === 'can' ? ' se-yn' : '') }, buttons),
          actions
        ]));

        function choose(c, btn) {
          if (answered) return;
          answered = true;
          ctx.sound('tap');
          var ok = c === r.answer;
          if (ok) score++;
          buttons.forEach(function (b, i) {
            b.disabled = true;
            if (r.choices[i] === r.answer) b.classList.add('is-correct');
          });
          if (!ok) btn.classList.add('is-wrong');
          // Show the fair share in every basket and the division on one line.
          var adding = r.kind === 'need' || r.kind === 'target';
          // plus / which: draw the baskets of the answer (the new one, or all of them)
          var addB = r.kind === 'plus' ? 1 : r.kind === 'which' ? r.plates : 0;
          for (var nb = 0; nb < addB; nb++) {
            var cn = el('span', { class: 'se-basket-n' }, '');
            counts.push(cn);
            basketRow.appendChild(el('div', { class: 'se-basket' + (r.kind === 'plus' ? ' se-new' : '') }, [
              el('span', { class: 'se-basket-ic', 'aria-hidden': 'true' }, BASKET), cn]));
          }
          counts.forEach(function (n) {
            n.textContent = r.kind === 'mix' || r.kind === 'mix3' ? r.groups.map(function (g) { return Math.floor(g / r.plates); }).join('+')
              : r.kind === 'mixneed' ? r.groups.map(function (g, i) { return (g + r.adds[i]) / r.plates; }).join('+')
              : String(adding ? r.goal : r.each);
          });
          qLine.innerHTML = '';
          qLine.classList.add('se-done');
          if (r.kind === 'mix' || r.kind === 'mix3') {
            qLine.appendChild(document.createTextNode('נשארים '));
            qLine.appendChild(el('span', { class: 'se-eq' }, r.rests.join(' + ') + ' = ' + r.answer));
          } else if (r.kind === 'mixneed') {
            qLine.appendChild(document.createTextNode('מוסיפים '));
            qLine.appendChild(el('span', { class: 'se-eq' }, r.adds.join(' + ') + ' = ' + r.answer));
          } else if (r.kind === 'plus' || r.kind === 'which') {
            qLine.appendChild(el('span', { class: 'se-eq' }, r.items + ' ÷ ' + (r.newPlates || r.plates) + ' = ' + r.each));
            if (r.rest) qLine.appendChild(document.createTextNode('  ·  נשארים ' + r.rest));
          } else if (adding) {
            qLine.appendChild(el('span', { class: 'se-eq' }, r.plates + ' × ' + r.goal + ' = ' + (r.plates * r.goal)));
            qLine.appendChild(document.createTextNode('  ·  חסרים ' + r.answer));
          } else {
            qLine.appendChild(el('span', { class: 'se-eq' }, eqText(r)));
            if (r.rest) qLine.appendChild(document.createTextNode('  ·  נשארים ' + r.rest));
          }
          ctx.setStatus(ok ? 'נכון!' : r.kind === 'which' ? 'אפשר לחלק ל־' + r.answer + ' סלסלות'
            : r.kind === 'plus' ? 'בכל סלסלה ' + r.each : r.kind === 'mixneed' ? 'צריך להוסיף ' + r.answer
            : adding ? 'חסרים ' + r.answer : (r.rest ? 'נשארים ' + r.rest : 'מתחלק בדיוק'));
          ctx.feedback(ok, ok ? undefined : explain(r)).then(function () {
            if (ok) return ctx.wait(900).then(nextRound);
            // After a mistake the player decides when to move on.
            var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: nextRound }, 'הלאה');
            actions.appendChild(next);
            try { next.focus(); } catch (e) {}
          });
        }
      }

      nextRound();
    }
  });
})();
