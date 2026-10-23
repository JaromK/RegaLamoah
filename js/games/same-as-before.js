/* כמו קודם? — is this card the same as the one N cards back? Untimed n-back (memory). */
(function () {
  'use strict';

  var BLOCKS = 3;     // progress steps; each block starts a fresh run of cards
  var ANSWERS = 6;    // answers per block (exactly half are "same") → 18 answers per session

  // Inline SVG shapes (viewBox 0 0 100 100), drawn in currentColor so they follow var(--ink).
  var SHAPES = {
    circle: '<circle cx="50" cy="50" r="40"/>',
    triangle: '<polygon points="50,8 94,88 6,88"/>',
    square: '<rect x="12" y="12" width="76" height="76" rx="6"/>',
    star: '<polygon points="50,6 62,38 95,38 68,58 78,92 50,72 22,92 32,58 5,38 38,38"/>',
    heart: '<path d="M50 90 L13 54 A21 21 0 0 1 50 24 A21 21 0 0 1 87 54 Z"/>',
    plus: '<path d="M38 8h24v30h30v24H62v30H38V62H8V38h30z"/>',
    moon: '<path d="M60 8 A42 42 0 1 0 92 64 A34 34 0 1 1 60 8 Z"/>',
    // look-alikes, added at higher levels
    ring: '<circle cx="50" cy="50" r="34" fill="none" stroke="currentColor" stroke-width="12"/>',
    tridown: '<polygon points="50,92 94,12 6,12"/>',
    diamond: '<polygon points="50,4 94,50 50,96 6,50"/>',
    cross: '<path d="M50 33 L72 11 L89 28 L67 50 L89 72 L72 89 L50 67 L28 89 L11 72 L33 50 L11 28 L28 11 Z"/>',
    hexagon: '<polygon points="50,6 89,28 89,72 50,94 11,72 11,28"/>'
  };
  // Order matters: the pool for a level is the first `pool` entries.
  var ORDER = ['circle', 'triangle', 'square', 'star', 'heart', 'plus', 'moon', 'ring', 'tridown', 'diamond', 'cross', 'hexagon'];
  var TWIN = { circle: 'ring', ring: 'circle', triangle: 'tridown', tridown: 'triangle', square: 'diamond', diamond: 'square', plus: 'cross', cross: 'plus', hexagon: 'circle' };

  // Per level: n = how many cards back, pool = how many symbols, lure = chance a "different" card is a look-alike.
  var LEVELS = [
    { n: 1, pool: 3, lure: 0 },    // 1
    { n: 1, pool: 4, lure: 0 },    // 2
    { n: 1, pool: 5, lure: 0 },    // 3
    { n: 1, pool: 6, lure: 0 },    // 4
    { n: 1, pool: 7, lure: 0 },    // 5
    { n: 1, pool: 8, lure: 0.3 },  // 6
    { n: 1, pool: 9, lure: 0.45 }, // 7
    { n: 1, pool: 10, lure: 0.6 }, // 8
    { n: 2, pool: 3, lure: 0 },    // 9
    { n: 2, pool: 4, lure: 0 },    // 10
    { n: 2, pool: 5, lure: 0.2 },  // 11
    { n: 2, pool: 6, lure: 0.3 },  // 12
    { n: 2, pool: 7, lure: 0.4 },  // 13
    { n: 2, pool: 8, lure: 0.45 }, // 14
    { n: 2, pool: 9, lure: 0.5 },  // 15
    { n: 2, pool: 10, lure: 0.6 }, // 16
    { n: 3, pool: 4, lure: 0.2 },  // 17
    { n: 3, pool: 5, lure: 0.3 },  // 18
    { n: 3, pool: 6, lure: 0.45 }, // 19
    { n: 3, pool: 8, lure: 0.6 }   // 20
  ];

  var BACK_WORDS = { 1: 'קלף אחד', 2: 'שני קלפים', 3: 'שלושה קלפים' };
  var QUESTION = {
    1: 'האם זה כמו הקלף הקודם?',
    2: 'האם זה כמו הקלף של שניים לפני?',
    3: 'האם זה כמו הקלף של שלושה לפני?'
  };

  function svg(name) {
    return '<svg viewBox="0 0 100 100" fill="currentColor" aria-hidden="true" focusable="false">' + SHAPES[name] + '</svg>';
  }

  /* One block: n starting cards to memorise, then ANSWERS cards to judge, exactly half "same". */
  function makeBlock(spec, rand) {
    rand = rand || Math.random;
    var pool = ORDER.slice(0, spec.pool);
    function any(list) { return list[Math.floor(rand() * list.length)]; }
    var seq = [];
    for (var s = 0; s < spec.n; s++) seq.push(any(pool));
    var matches = [];
    for (var m = 0; m < ANSWERS; m++) matches.push(m < ANSWERS / 2);
    for (var i = matches.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1)); var t = matches[i]; matches[i] = matches[j]; matches[j] = t;
    }
    matches.forEach(function (same) {
      var target = seq[seq.length - spec.n];
      if (same) { seq.push(target); return; }
      var others = pool.filter(function (p) { return p !== target; });
      var card = null;
      if (rand() < spec.lure) {
        var twin = TWIN[target];
        if (twin && pool.indexOf(twin) !== -1) card = twin;
        // n ≥ 2: a recent card that is not the right one is a strong lure
        else if (spec.n > 1 && seq[seq.length - 1] !== target) card = seq[seq.length - 1];
      }
      seq.push(card || any(others));
    });
    return { seq: seq, matches: matches };
  }

  var css = [
    '.sab-card{width:min(11rem,55vw,calc(100dvh - 22rem));aspect-ratio:1;border-radius:var(--radius);border:3px solid var(--line);',
    'background:var(--surface-2);display:grid;place-items:center;color:var(--ink);box-shadow:var(--shadow);',
    'transition:opacity .25s,transform .25s;}',
    '.sab-card svg{width:62%;height:62%;}',
    '.sab-card.sab-out{opacity:0;transform:scale(.85);}',
    '.sab-count{color:var(--ink-soft);font-weight:700;font-size:1.1rem;text-align:center;}',
    '.sab-answers{grid-template-columns:1fr 1fr;max-width:26rem;}',
    '.sab-answers .g-choice{min-height:4.4rem;padding:.6rem .5rem;font-size:1.25rem;}',
    '.sab-back{display:flex;align-items:center;gap:.75rem;justify-content:center;flex-wrap:wrap;',
    'background:var(--sun-soft);border:2px dashed var(--sun);border-radius:var(--radius-sm);padding:.5rem 1rem;font-weight:700;}',
    '.sab-mini{width:3.2rem;height:3.2rem;border-radius:var(--radius-sm);border:2px solid var(--line);',
    'background:var(--surface);display:grid;place-items:center;color:var(--ink);flex:none;}',
    '.sab-mini svg{width:66%;height:66%;}',
    '.sab-mini.sab-hit{border-color:var(--memory);border-width:3px;background:var(--memory-soft);}',
    '.sab-demo{display:flex;flex-direction:column;align-items:center;gap:.6rem;}',
    '.sab-demo-row{display:flex;gap:.5rem;direction:rtl;}',
    '.sab-demo-cap{color:var(--ink-soft);font-size:1.1rem;text-align:center;}',
    '.sab-text{font-size:1.15rem;text-align:center;text-wrap:balance;max-width:24rem;}'
  ].join('');

  BrainGames.register({
    id: 'same-as-before',
    name: 'כמו קודם?',
    skill: 'memory',
    tagline: 'האם הקלף זהה לקלף שהיה קודם?',
    benefit: 'זיכרון עבודה ועדכון מידע',
    instructions: [
      'בכל פעם יופיע קלף אחד עם צורה. הקלפים הקודמים נעלמים.',
      'בדקו: האם הצורה זהה לצורה שהייתה בקלף הקודם?',
      'לחצו "כן, אותו דבר" או "לא, שונה". אין שעון.',
      'בשלבים מתקדמים משווים לקלף של שניים או שלושה צעדים אחורה.'
    ],
    css: css,
    _makeBlock: makeBlock,   // exposed for tests
    _levels: LEVELS,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var N = spec.n;
      var block = 0;
      var score = 0;
      var total = BLOCKS * ANSWERS;

      function finish() {
        ctx.finish({
          correct: score,
          total: total,
          note: 'עניתם נכון ' + score + ' מתוך ' + total + ' · השוואה ל' + BACK_WORDS[N] + ' אחורה'
        });
      }

      function nextBlock() {
        if (block >= BLOCKS) { finish(); return; }
        block++;
        ctx.setProgress(block, BLOCKS);
        playBlock(makeBlock(spec));
      }

      function explain() {
        // Before an n ≥ 2 session: a short worked example.
        root.innerHTML = '';
        ctx.setStatus(N === 2 ? 'זכרו שני קלפים אחורה' : 'זכרו שלושה קלפים אחורה');
        var demo = N === 2 ? ['star', 'circle', 'star'] : ['heart', 'square', 'circle', 'heart'];
        var row = el('div', { class: 'sab-demo-row', 'aria-hidden': 'true' }, demo.map(function (name, i) {
          return el('span', { class: 'sab-mini' + (i === 0 || i === demo.length - 1 ? ' sab-hit' : ''), html: svg(name) });
        }));
        root.appendChild(el('p', { class: 'sab-text' },
          'לא לקלף שממש לפני, אלא ל' + (N === 2 ? 'זה שלפניו' : 'זה ששלושה לפני') + '.'));
        root.appendChild(el('div', { class: 'sab-demo' }, [
          row,
          el('p', { class: 'sab-demo-cap' }, 'הקלפים המסומנים זהים, לכן בקלף האחרון עונים "כן"')
        ]));
        root.appendChild(el('div', { class: 'g-actions' }, el('button', {
          class: 'btn btn-primary btn-lg', type: 'button', onclick: nextBlock
        }, 'הבנתי, מתחילים')));
      }

      function playBlock(data) {
        var seq = data.seq;
        var pos = 0;
        root.innerHTML = '';
        var card = el('div', { class: 'sab-card', role: 'img', 'aria-label': 'קלף' });
        var count = el('p', { class: 'sab-count', 'aria-live': 'polite' }, '');
        var area = el('div', { class: 'sab-area' });
        root.appendChild(card);
        root.appendChild(count);
        root.appendChild(area);
        area.style.display = 'contents';

        function showCard(i) {
          card.classList.add('sab-out');
          return ctx.wait(300).then(function () {
            card.innerHTML = svg(seq[i]);
            count.textContent = 'קלף ' + (i + 1);
            card.classList.remove('sab-out');
          });
        }

        function memorise() {
          area.innerHTML = '';
          showCard(pos).then(function () {
            ctx.setStatus(pos === 0 ? 'זכרו את הקלף הזה' : 'זכרו גם את הקלף הזה');
            var btn = el('button', {
              class: 'btn btn-primary btn-lg', type: 'button',
              onclick: function () { btn.disabled = true; pos++; step(); }
            }, 'זכרתי, הלאה');
            area.appendChild(el('div', { class: 'g-actions' }, btn));
            ctx.studyTimer(btn, 3500);
          });
        }

        function step() {
          if (pos < N) { memorise(); return; }
          if (pos >= seq.length) { nextBlock(); return; }
          ask();
        }

        function ask() {
          area.innerHTML = '';
          var i = pos;
          var same = seq[i] === seq[i - N];
          showCard(i).then(function () {
            ctx.setStatus(QUESTION[N]);
            var yes = el('button', { class: 'g-choice', type: 'button', onclick: function () { answer(true); } }, 'כן, אותו דבר');
            var no = el('button', { class: 'g-choice', type: 'button', onclick: function () { answer(false); } }, 'לא, שונה');
            area.appendChild(el('div', { class: 'g-choices sab-answers' }, [yes, no]));

            function answer(saidSame) {
              yes.disabled = true; no.disabled = true;
              var ok = saidSame === same;
              var chosen = saidSame ? yes : no;
              if (ok) {
                score++;
                chosen.classList.add('is-correct');
                ctx.sound('good');
                ctx.wait(800).then(function () { pos++; step(); });
                return;
              }
              chosen.classList.add('is-wrong');
              (saidSame ? no : yes).classList.add('is-correct');
              ctx.feedback(false, same ? 'זה היה אותו דבר' : 'זה היה שונה').then(function () {
                // Swap the answer buttons for the card they should have compared with + a next button.
                area.innerHTML = '';
                var nextBtn = el('button', {
                  class: 'btn btn-primary btn-lg', type: 'button',
                  onclick: function () { nextBtn.disabled = true; pos++; step(); }
                }, 'הבנתי, הלאה');
                ctx.setStatus(same ? 'זה היה אותו דבר' : 'זה היה שונה');
                area.appendChild(el('div', { class: 'sab-back' }, [
                  el('span', null, N === 1 ? 'הקלף הקודם:' : 'לפני ' + BACK_WORDS[N] + ':'),
                  el('span', { class: 'sab-mini', html: svg(seq[i - N]) }),
                  nextBtn
                ]));
              });
            }
          });
        }

        step();
      }

      if (N > 1) explain(); else nextBlock();
    }
  });
})();
