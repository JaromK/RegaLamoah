/* צמדי מילים — remember which two unrelated words were shown together (associative memory). */
(function () {
  'use strict';

  // Concrete, simple nouns in six categories. Pairs are always built across categories,
  // and a "lure" distractor (same category as the answer) is used at the higher levels.
  var CATS = {
    animal: ['כלב', 'חתול', 'סוס', 'פרה', 'ארנב', 'ג\'ירפה', 'פיל', 'אריה', 'תרנגול', 'צב', 'דב', 'קוף', 'ינשוף', 'זברה'],
    food: ['תפוח', 'בננה', 'עגבנייה', 'גזר', 'לחם', 'גבינה', 'אבטיח', 'תות', 'ענבים', 'תירס', 'מלפפון', 'עוגה', 'לימון', 'אגס'],
    home: ['כיסא', 'שולחן', 'מנורה', 'שעון', 'מראה', 'כרית', 'מיטה', 'ספה', 'וילון', 'מפתח', 'ארון', 'שטיח', 'סל', 'פעמון'],
    wear: ['כובע', 'נעל', 'חולצה', 'מעיל', 'גרב', 'צעיף', 'כפפה', 'חגורה', 'משקפיים', 'עניבה', 'שמלה', 'מכנסיים', 'ארנק', 'טבעת'],
    nature: ['עץ', 'פרח', 'הר', 'אבן', 'נהר', 'ענן', 'כוכב', 'ירח', 'שמש', 'חול', 'עלה', 'צדף', 'אגם', 'מערה'],
    thing: ['אופניים', 'רכבת', 'מטוס', 'סירה', 'אוטובוס', 'ספר', 'עיפרון', 'מספריים', 'פטיש', 'גיטרה', 'תוף', 'כדור', 'בלון', 'מזוודה']
  };

  // Cross-category pairs that are still too easy to link by meaning.
  var RELATED = [
    ['סירה', 'נהר'], ['סירה', 'אגם'], ['סירה', 'צדף'], ['קוף', 'בננה'], ['ארנב', 'גזר'], ['פרה', 'גבינה'],
    ['כלב', 'כדור'], ['שמש', 'משקפיים'], ['שמש', 'כובע'], ['מטוס', 'ענן'], ['מנורה', 'שמש'], ['ינשוף', 'ירח'],
    ['ינשוף', 'עץ'], ['קוף', 'עץ'], ['שעון', 'טבעת'], ['מיטה', 'ירח'], ['מעיל', 'ענן'], ['כפפה', 'כדור'],
    ['סל', 'ענבים'], ['סל', 'לחם'], ['שולחן', 'לחם'], ['שולחן', 'עוגה'], ['תרנגול', 'שמש'], ['מזוודה', 'מטוס'],
    ['מזוודה', 'רכבת'], ['ספר', 'מנורה'], ['גיטרה', 'כיסא'], ['פרח', 'שמלה'], ['כוכב', 'בלון'], ['צב', 'אבן'],
    ['דב', 'מערה'], ['אריה', 'מערה'], ['פרה', 'פעמון'], ['אופניים', 'כובע'], ['חול', 'סל'], ['עלה', 'תות']
  ];

  var CAT_OF = {};
  var POOL = [];
  Object.keys(CATS).forEach(function (c) {
    CATS[c].forEach(function (w) { CAT_OF[w] = c; POOL.push(w); });
  });
  var RELATED_SET = {};
  RELATED.forEach(function (p) { RELATED_SET[p[0] + '|' + p[1]] = true; RELATED_SET[p[1] + '|' + p[0]] = true; });

  // Per level: n = pairs per study screen, d = distractor difficulty, rev = also ask from the second word.
  //  d0: 3 unseen words · d1: 1 shown + 2 unseen · d2: 2 shown + 1 unseen · d3: 3 shown · d4: 2 shown + a same-category lure
  var LEVELS = [
    { n: 2, d: 0 }, // 1
    { n: 2, d: 1 }, // 2
    { n: 3, d: 1 }, // 3
    { n: 3, d: 2 }, // 4
    { n: 4, d: 1 }, // 5
    { n: 4, d: 2 }, // 6
    { n: 4, d: 3 }, // 7
    { n: 5, d: 2 }, // 8
    { n: 5, d: 3 }, // 9
    { n: 5, d: 4 }, // 10
    { n: 6, d: 2 }, // 11
    { n: 6, d: 3 }, // 12
    { n: 6, d: 4 }, // 13
    { n: 7, d: 3 }, // 14
    { n: 7, d: 4 }, // 15
    { n: 7, d: 4, rev: true }, // 16
    { n: 8, d: 3 }, // 17
    { n: 8, d: 4 }, // 18
    { n: 8, d: 3, rev: true }, // 19
    { n: 8, d: 4, rev: true }, // 20
    // 21–30: still 8 pairs. d5: all wrong choices were on the study screen, one of them from the answer's
    // category; d6: two of them from that category. cats: the pairs use only 4, 3 or 2 categories.
    { n: 8, d: 5 },                     // 21
    { n: 8, d: 5, rev: true },          // 22
    { n: 8, d: 5, rev: true, cats: 4 }, // 23
    { n: 8, d: 5, cats: 3 },            // 24
    { n: 8, d: 5, rev: true, cats: 3 }, // 25
    { n: 8, d: 6, cats: 3 },            // 26
    { n: 8, d: 6, rev: true, cats: 3 }, // 27
    { n: 8, d: 6, cats: 2 },            // 28
    { n: 8, d: 6, rev: true, cats: 2 }, // 29
    { n: 8, d: 6, rev: true, cats: 2, flipAll: true }, // 30: every question asks from the second word
    // 31–50: yn = share of "were these two a pair?" questions (the wrong ones mix words of two pairs),
    // pause = short sums between the study screen and the questions (not scored), so the pairs must be held longer.
    { n: 8, d: 6, rev: true, cats: 3, yn: 0.3 },                       // 31
    { n: 8, d: 6, rev: true, cats: 2, yn: 0.3 },                       // 32
    { n: 8, d: 6, rev: true, cats: 2, yn: 0.4 },                       // 33
    { n: 8, d: 6, rev: true, cats: 3, yn: 0.3, pause: 1 },             // 34
    { n: 8, d: 6, rev: true, cats: 2, yn: 0.4, pause: 1 },             // 35
    { n: 8, d: 6, rev: true, cats: 2, yn: 0.5, pause: 1 },             // 36
    { n: 8, d: 6, rev: true, cats: 2, yn: 0.4, pause: 2 },             // 37
    { n: 8, d: 6, cats: 2, flipAll: true, yn: 0.4, pause: 2 },         // 38
    { n: 8, d: 6, cats: 2, flipAll: true, yn: 0.5, pause: 2 },         // 39
    { n: 8, d: 6, cats: 2, flipAll: true, yn: 0.5, pause: 2 },         // 40
    { n: 8, d: 6, rev: true, cats: 2, yn: 0.5, pause: 3 },             // 41
    { n: 8, d: 6, rev: true, cats: 2, yn: 0.6, pause: 3 },             // 42
    { n: 8, d: 6, cats: 2, flipAll: true, yn: 0.5, pause: 3 },         // 43
    { n: 8, d: 6, cats: 2, flipAll: true, yn: 0.6, pause: 3 },         // 44
    { n: 8, d: 6, cats: 2, flipAll: true, yn: 0.6, pause: 3 },         // 45
    { n: 8, d: 6, rev: true, cats: 2, yn: 0.6, pause: 4 },             // 46
    { n: 8, d: 6, cats: 2, flipAll: true, yn: 0.6, pause: 4 },         // 47
    { n: 8, d: 6, cats: 2, flipAll: true, yn: 0.7, pause: 4 },         // 48
    { n: 8, d: 6, cats: 2, flipAll: true, yn: 0.7, pause: 4 },         // 49
    { n: 8, d: 6, cats: 2, flipAll: true, yn: 0.7, pause: 5 }          // 50
  ];

  var css = [
    '.wp-pairs{width:100%;max-width:34rem;display:grid;grid-template-columns:repeat(auto-fill,minmax(13rem,1fr));gap:.6rem;}',
    '.wp-pair{display:flex;align-items:center;justify-content:center;gap:.6rem;flex-wrap:wrap;background:var(--memory-soft);',
    'border:2px solid var(--memory);border-radius:var(--radius);padding:.25rem .6rem;text-align:center;}',
    '.wp-word{font-size:1.4rem;line-height:1.25;font-weight:800;color:var(--ink);}',
    '.wp-dash{font-size:1.3rem;line-height:1;font-weight:700;color:var(--memory);}',
    '.wp-cue{font-size:clamp(2rem,9vw,2.8rem);font-weight:900;color:var(--ink);background:var(--memory-soft);',
    'border:3px solid var(--memory);border-radius:var(--radius);padding:.5rem 1.6rem;text-align:center;}',
    '.wp-choices{max-width:28rem;grid-template-columns:repeat(2,minmax(0,1fr));}',
    '.wp-choices .g-choice{padding:.7rem .4rem;overflow-wrap:break-word;}',
    '.wp-count{font-size:1.15rem;font-weight:700;color:var(--ink-soft);text-align:center;}'
  ].join('');

  function clampLevel(l) {
    l = Math.round(Number(l) || 1);
    return Math.max(1, Math.min(LEVELS.length, l));
  }

  BrainGames.register({
    id: 'word-pairs',
    name: 'צמדי מילים',
    skill: 'memory',
    tagline: 'זכרו אילו מילים הופיעו יחד',
    benefit: 'זיכרון אסוציאטיבי — קישור בין פרטים',
    instructions: [
      'יופיעו כמה צמדים של מילים. זכרו אילו שתי מילים באו יחד.',
      'טיפ: דמיינו תמונה מצחיקה שמחברת את שתי המילים.',
      'כשתהיו מוכנים לחצו "זכרתי, הלאה".',
      'לכל מילה בחרו את המילה שהייתה איתה בצמד.',
      'ברמות הגבוהות שואלים גם "האם אלה היו צמד?", ויש הפסקה קצרה של חשבון לפני השאלות.'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var spec = LEVELS[clampLevel(ctx.level) - 1];
      var n = spec.n;
      var cycles = n <= 5 ? 3 : 2;
      var studyMs = 4000 + 3000 * n;

      var cycle = 0;
      var correct = 0;
      var total = 0;
      var usedWords = {};

      function related(a, b) { return CAT_OF[a] === CAT_OF[b] || RELATED_SET[a + '|' + b]; }

      function makePairs() {
        var catPool = POOL;
        if (spec.cats) {
          var useCats = ctx.shuffle(Object.keys(CATS)).slice(0, spec.cats);
          catPool = POOL.filter(function (w) { return useCats.indexOf(CAT_OF[w]) !== -1; });
        }
        var avail = catPool.filter(function (w) { return !usedWords[w]; });
        if (avail.length < n * 2 + (spec.cats ? 0 : 6)) { usedWords = {}; avail = catPool.slice(); }
        var best = [];
        for (var attempt = 0; attempt < 40; attempt++) {
          var list = ctx.shuffle(avail.slice());
          var taken = {};
          var pairs = [];
          for (var i = 0; i < list.length && pairs.length < n; i++) {
            var a = list[i];
            if (taken[a]) continue;
            for (var j = i + 1; j < list.length; j++) {
              var b = list[j];
              if (taken[b] || related(a, b)) continue;
              taken[a] = taken[b] = true;
              pairs.push([a, b]);
              break;
            }
          }
          if (pairs.length > best.length) best = pairs;
          if (best.length >= n) break;
        }
        best.forEach(function (p) { usedWords[p[0]] = usedWords[p[1]] = true; });
        return best;
      }

      function buildChoices(cue, answer, shownWords) {
        var shownSet = {};
        shownWords.forEach(function (w) { shownSet[w] = true; });
        var shownOthers = ctx.shuffle(shownWords.filter(function (w) { return w !== cue && w !== answer; }));
        var unseen = ctx.shuffle(POOL.filter(function (w) { return !shownSet[w]; }));
        var lures = unseen.filter(function (w) { return CAT_OF[w] === CAT_OF[answer]; });
        var others = unseen.filter(function (w) { return CAT_OF[w] !== CAT_OF[answer]; });

        if (spec.d >= 5) {
          // every wrong choice was on the study screen; 1 (d5) or 2 (d6) from the answer's category
          var sameShown = shownOthers.filter(function (w) { return CAT_OF[w] === CAT_OF[answer]; });
          var pick5 = sameShown.slice(0, spec.d === 6 ? 2 : 1);
          shownOthers.forEach(function (w) { if (pick5.length < 3 && pick5.indexOf(w) === -1) pick5.push(w); });
          return ctx.shuffle(pick5.concat([answer]));
        }
        var wantShown = [0, 1, 2, 3, 2][spec.d];
        var wantLure = spec.d === 4 ? 1 : 0;
        var picked = shownOthers.slice(0, wantShown);
        if (wantLure && lures.length) picked.push(lures[0]);
        var fill = others.concat(lures.slice(wantLure));
        for (var k = 0; picked.length < 3 && k < fill.length; k++) {
          if (picked.indexOf(fill[k]) === -1) picked.push(fill[k]);
        }
        return ctx.shuffle(picked.concat([answer]));
      }

      function nextCycle() {
        if (cycle >= cycles) {
          ctx.finish({
            correct: correct,
            total: total,
            note: 'זכרתם נכון ' + correct + ' מתוך ' + total + ' צמדי מילים'
          });
          return;
        }
        cycle++;
        ctx.setProgress(cycle, cycles);
        study(makePairs());
      }

      function study(pairs) {
        root.innerHTML = '';
        ctx.setStatus('זכרו את ' + pairs.length + ' הצמדים');
        var list = el('div', { class: 'wp-pairs' }, pairs.map(function (p) {
          return el('div', { class: 'wp-pair' }, [
            el('span', { class: 'wp-word' }, p[0]),
            el('span', { class: 'wp-dash', 'aria-hidden': 'true' }, '—'),
            el('span', { class: 'wp-word' }, p[1])
          ]);
        }));
        var done = false;
        var readyBtn = el('button', {
          class: 'btn btn-primary btn-lg', type: 'button',
          onclick: function () {
            if (done) return;
            done = true;
            if (cancelTimer) cancelTimer();
            if (spec.pause) pauseSums(spec.pause, function () { test(pairs); }); else test(pairs);
          }
        }, 'זכרתי, הלאה');
        root.appendChild(list);
        root.appendChild(el('div', { class: 'g-actions' }, readyBtn));
        var cancelTimer = ctx.studyTimer(readyBtn, studyMs);
      }

      // a few easy sums between studying and answering (not scored): the pairs must be held a bit longer
      function pauseSums(k, then) {
        var left = k;
        function one() {
          if (left-- <= 0) { then(); return; }
          var a = ctx.randInt(2, 9), b = ctx.randInt(2, 9), ans = a + b;
          var opts = ctx.shuffle([ans, ans + 1, ans - 1, ans + 2]);
          root.innerHTML = '';
          ctx.setStatus('רגע של חשבון, ואז השאלות על הצמדים');
          var bs = opts.map(function (v) {
            return el('button', { class: 'g-choice', type: 'button', onclick: function () {
              bs.forEach(function (x) { x.disabled = true; if (Number(x.textContent) === ans) x.classList.add('is-correct'); });
              if (v !== ans) this.classList.add('is-wrong');
              ctx.sound(v === ans ? 'good' : 'tap');
              ctx.wait(600).then(one);
            } }, String(v));
          });
          root.appendChild(el('p', { class: 'wp-count' }, 'חשבון ' + (k - left) + ' מתוך ' + k));
          root.appendChild(el('div', { class: 'wp-cue', dir: 'ltr' }, a + ' + ' + b));
          root.appendChild(el('div', { class: 'g-choices wp-choices' }, bs));
        }
        one();
      }

      function test(pairs) {
        var shownWords = [];
        pairs.forEach(function (p) { shownWords.push(p[0], p[1]); });
        var questions = ctx.shuffle(pairs.map(function (p, i) {
          var flip = spec.flipAll || (spec.rev && Math.random() < 0.5);
          if (spec.yn && Math.random() < spec.yn) {
            // yes/no: either the real pair, or this word with a word from another pair
            var real = Math.random() < 0.5;
            var other = pairs[(i + 1 + ctx.randInt(0, pairs.length - 2)) % pairs.length];
            return { yn: true, a: p[0], b: real ? p[1] : other[1], real: real, pair: p, other: other };
          }
          return flip ? { cue: p[1], answer: p[0], pair: p } : { cue: p[0], answer: p[1], pair: p };
        }));
        var qi = 0;

        function ask() {
          if (qi >= questions.length) {
            ctx.wait(300).then(nextCycle);
            return;
          }
          var q = questions[qi];
          qi++;
          root.innerHTML = '';
          if (q.yn) { askYesNo(q); return; }
          ctx.setStatus('איזו מילה הייתה בצמד עם המילה הזאת?');
          var answered = false;
          var buttons = [];
          buildChoices(q.cue, q.answer, shownWords).forEach(function (w) {
            buttons.push(el('button', {
              class: 'g-choice', type: 'button',
              onclick: function () { choose(w, this); }
            }, w));
          });
          root.appendChild(el('p', { class: 'wp-count' }, 'מילה ' + qi + ' מתוך ' + questions.length));
          root.appendChild(el('div', { class: 'wp-cue' }, q.cue));
          root.appendChild(el('div', { class: 'g-choices wp-choices' }, buttons));

          function choose(w, btn) {
            if (answered) return;
            answered = true;
            var ok = w === q.answer;
            total++;
            if (ok) correct++;
            buttons.forEach(function (b) {
              b.disabled = true;
              if (b.textContent === q.answer) b.classList.add('is-correct');
            });
            if (!ok) btn.classList.add('is-wrong');
            ctx.feedback(ok, ok ? undefined : 'הצמד היה: ' + q.pair[0] + ' — ' + q.pair[1])
              .then(function () { return ctx.wait(400); })
              .then(ask);
          }
        }

        function askYesNo(q) {
          ctx.setStatus('האם שתי המילים האלה היו צמד?');
          var answered = false;
          var yes = el('button', { class: 'g-choice', type: 'button', onclick: function () { choose(true, yes); } }, 'כן, היו יחד');
          var no = el('button', { class: 'g-choice', type: 'button', onclick: function () { choose(false, no); } }, 'לא');
          root.appendChild(el('p', { class: 'wp-count' }, 'מילה ' + qi + ' מתוך ' + questions.length));
          root.appendChild(el('div', { class: 'wp-cue' }, q.a + ' — ' + q.b));
          root.appendChild(el('div', { class: 'g-choices wp-choices' }, [yes, no]));
          function choose(said, btn) {
            if (answered) return;
            answered = true;
            var ok = said === q.real;
            total++;
            if (ok) correct++;
            yes.disabled = no.disabled = true;
            (q.real ? yes : no).classList.add('is-correct');
            if (!ok) btn.classList.add('is-wrong');
            ctx.feedback(ok, ok ? undefined : q.real ? 'כן, הם היו צמד' : 'לא. הצמדים היו: ' + q.pair[0] + ' — ' + q.pair[1] + ', ' + q.other[0] + ' — ' + q.other[1])
              .then(function () { return ctx.wait(400); })
              .then(ask);
          }
        }

        ask();
      }

      nextCycle();
    }
  });
})();
