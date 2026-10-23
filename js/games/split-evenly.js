/* חלוקה שווה — share a pile of items equally between baskets (logic). Untimed. */
(function () {
  'use strict';

  var ROUNDS = 8;
  var ITEMS = ['🍎', '🍓', '🍊', '🍋', '🍒', '🍐', '🍑', '🍌', '🥝'];
  var BASKET = '🧺';
  // Toast text is plain RTL, so explanations use words ("חלקי") rather than ÷ symbols.

  // Per level (1–20): item range, basket range and question kinds.
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
    { min: 18, max: 24, pMin: 5, pMax: 6, kinds: ['left', 'left', 'share'] }   // 20
  ];

  function ri(rng, a, b) { return a + Math.floor(rng() * (b - a + 1)); }
  function pk(rng, arr) { return arr[Math.floor(rng() * arr.length)]; }

  // Build one round. `kind` may be forced (so a session mixes kinds evenly).
  function makeRound(level, rng, kind) {
    var s = LEVELS[level - 1];
    kind = kind || pk(rng, s.kinds);
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
      break;
    }
    var q = Math.floor(items / plates), r = items % plates;
    var answer, choices;
    if (kind === 'share') {
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
    return { kind: kind, items: items, plates: plates, each: q, rest: r, answer: answer, choices: choices };
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
    '.se-choices.se-yn .g-choice{font-size:1.25rem;}'
  ].join('');

  function eqText(r) {
    return r.items + ' ÷ ' + r.plates + ' = ' + r.each;
  }

  // Short Hebrew explanation, used in the toast after a mistake.
  function explain(r) {
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
      'אין מגבלת זמן. אפשר לספור כמה פעמים שרוצים.'
    ],
    css: css,
    _makeRound: makeRound,
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
        ctx.setStatus({
          share: 'כמה יהיו בכל סלסלה?',
          can: 'אפשר לחלק שווה בלי שארית?',
          left: 'כמה יישארו בחוץ?'
        }[r.kind]);

        var blocks = [];
        for (var k = 0; k < r.items; k += 5) {
          var five = [];
          for (var m = k; m < Math.min(r.items, k + 5); m++) {
            five.push(el('span', { class: 'se-it', 'aria-hidden': 'true' }, icon));
          }
          blocks.push(el('div', { class: 'se-five' }, five));
        }
        var pile = el('div', { class: 'se-pile', role: 'img', 'aria-label': r.items + ' פירות' }, blocks);

        var counts = [];
        var baskets = [];
        for (var p = 0; p < r.plates; p++) {
          var n = el('span', { class: 'se-basket-n' }, '');
          counts.push(n);
          baskets.push(el('div', { class: 'se-basket' }, [
            el('span', { class: 'se-basket-ic', 'aria-hidden': 'true' }, BASKET), n
          ]));
        }

        var qLine = el('p', { class: 'se-q', 'aria-live': 'polite' }, r.items + ' פירות, ' + r.plates + ' סלסלות');

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
          el('div', { class: 'se-baskets' }, baskets),
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
          counts.forEach(function (n) { n.textContent = String(r.each); });
          qLine.innerHTML = '';
          qLine.classList.add('se-done');
          qLine.appendChild(el('span', { class: 'se-eq' }, eqText(r)));
          if (r.rest) qLine.appendChild(document.createTextNode('  ·  נשארים ' + r.rest));
          ctx.setStatus(ok ? 'נכון!' : (r.rest ? 'נשארים ' + r.rest : 'מתחלק בדיוק'));
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
