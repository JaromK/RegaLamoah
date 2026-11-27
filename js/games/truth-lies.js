/* אמת ושקר — in this neighbourhood everyone either always tells the truth or always lies. Each neighbour says one
   sentence; work out who tells the truth and who lies. Every puzzle has exactly one answer. Logic. Untimed. */
(function () {
  'use strict';

  var PEOPLE = [
    { name: 'דוד', f: false, e: '👨' }, { name: 'רינה', f: true, e: '👩' }, { name: 'משה', f: false, e: '👴' },
    { name: 'שרה', f: true, e: '👵' }, { name: 'יוסי', f: false, e: '🧔' }, { name: 'חנה', f: true, e: '👧' },
    { name: 'אבי', f: false, e: '👦' }, { name: 'רות', f: true, e: '👩‍🦰' }, { name: 'עמוס', f: false, e: '👨‍🦳' },
    { name: 'מירי', f: true, e: '👩‍🦳' }, { name: 'דני', f: false, e: '👨‍🦱' }, { name: 'יעל', f: true, e: '👩‍🦱' }
  ];

  /* Level 1–50: k = neighbours, kinds = sentences that may be said. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    // "X lies" / "X tells the truth" alone always fit two ways (everyone the other way round), so every level also
    // has a sentence that breaks the tie: "at least one of us lies" or "X and I are the same kind"
    if (L <= 10) return { k: 2, kinds: ['liar', 'honest', 'someLiar'] };
    if (L <= 22) return { k: 3, kinds: ['liar', 'honest', 'someLiar', 'same'] };
    if (L <= 35) return { k: 3, kinds: ['liar', 'honest', 'both', 'same', 'someLiar'] };
    return { k: 4, kinds: ['liar', 'honest', 'both', 'same', 'oneOf', 'someLiar'] };
  }

  // the truth of a sentence in a world (w[i] = true if neighbour i tells the truth)
  function truth(st, w) {
    switch (st.t) {
      case 'liar': return !w[st.a];
      case 'honest': return w[st.a];
      case 'both': return w[st.a] && w[st.b];
      case 'same': return w[st.s] === w[st.a];
      case 'oneOf': return (!w[st.a]) !== (!w[st.b]);
      case 'someLiar': return w.some(function (x) { return !x; });
    }
    return false;
  }
  function worldsFitting(k, says) {
    var out = [];
    for (var mask = 0; mask < (1 << k); mask++) {
      var w = []; for (var i = 0; i < k; i++) w.push(!!(mask & (1 << i)));
      if (says.every(function (st) { return truth(st, w) === w[st.s]; })) out.push(w);
    }
    return out;
  }
  function makePuzzle(sp, rnd) {
    var k = sp.k;
    for (var attempt = 0; attempt < 500; attempt++) {
      var w = []; for (var i = 0; i < k; i++) w.push(rnd.randInt(0, 1) === 1);
      if (w.every(Boolean) && rnd.randInt(0, 2)) continue; // everyone honest is dull: rarely
      var says = [];
      for (var s = 0; s < k; s++) {
        // a sentence whose truth matches the speaker (true for an honest one, false for a liar)
        var opts = [];
        for (var t = 0; t < 30; t++) {
          var kind = rnd.pick(sp.kinds), others = [];
          for (var j = 0; j < k; j++) if (j !== s) others.push(j);
          others = rnd.shuffle(others);
          var st = { s: s, t: kind, a: others[0], b: others[1] };
          if ((kind === 'both' || kind === 'oneOf') && others.length < 2) continue;
          if (kind === 'someLiar' && says.some(function (x) { return x.t === 'someLiar'; })) continue; // not the same sentence twice
          if (truth(st, w) === w[s]) opts.push(st);
        }
        if (!opts.length) break;
        says.push(rnd.pick(opts));
      }
      if (says.length < k) continue;
      if (worldsFitting(k, says).length === 1) return { k: k, w: w, says: says };
    }
    return null;
  }

  var css = [
    '.tl-list{display:flex;flex-direction:column;gap:.4rem;width:100%;max-width:30rem;}',
    '.tl-p{display:grid;grid-template-columns:auto 1fr auto;grid-template-areas:"face say pick";gap:.2rem .45rem;align-items:center;',
    'background:var(--surface-2);border-radius:var(--radius-sm);padding:.35rem .5rem;}',
    '.tl-face{grid-area:face;display:flex;flex-direction:column;align-items:center;font-size:1.6rem;line-height:1;min-width:2.8rem;}',
    '.tl-verdict{grid-area:pick;font-weight:900;font-size:1rem;white-space:nowrap;padding:.2rem .5rem;border-radius:999px;}',
    '.tl-verdict.t{background:var(--c-green-soft);color:var(--c-green);}.tl-verdict.l{background:var(--c-red-soft);color:var(--c-red);}',
    '.tl-say b{font-weight:900;}.tl-say b.t{color:var(--c-green);}.tl-say b.l{color:var(--c-red);}',
    '.tl-face small{font-size:.95rem;font-weight:800;margin-top:.15rem;}',
    '.tl-say{grid-area:say;margin:0;background:var(--surface);border-radius:12px;padding:.3rem .55rem;font-weight:700;font-size:1rem;line-height:1.3;position:relative;}',
    '.tl-say.is-tip{box-shadow:inset 0 0 0 3px var(--c-purple);}',
    '.tl-pick{grid-area:pick;display:flex;flex-direction:column;gap:.25rem;}',
    '.tl-pick button{min-height:2.35rem;min-width:4.2rem;padding:0 .4rem;border-radius:999px;border:2px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;font-weight:800;font-size:1rem;cursor:pointer;}',
    '.tl-pick button.is-on.t{background:var(--c-green-soft);border-color:var(--c-green);}',
    '.tl-pick button.is-on.l{background:var(--c-red-soft);border-color:var(--c-red);}',
    '.tl-p.is-right{box-shadow:inset 0 0 0 3px var(--c-green);}.tl-p.is-wrong{box-shadow:inset 0 0 0 3px var(--c-red);}',
    '.tl-acts{flex-wrap:nowrap;gap:.3rem;width:100%;max-width:30rem;}.tl-acts .btn{flex:1 1 auto;min-width:0;padding-inline:.4rem;font-size:.95rem;white-space:nowrap;}'
  ].join('');

  BrainGames.register({
    id: 'truth-lies',
    name: 'אמת ושקר',
    skill: 'logic',
    isNew: true,
    tagline: 'מי דובר אמת ומי משקר? לפי מה שהם אומרים',
    benefit: 'חשיבה לוגית והסקת מסקנות',
    instructions: [
      'בשכונה הזאת כל אחד או תמיד אומר אמת, או תמיד משקר.',
      'כל שכן אומר משפט אחד. מי שאומר אמת: המשפט שלו נכון. מי שמשקר: המשפט שלו לא נכון.',
      'סמנו לכל אחד "אמת" או "שקר", ולחצו "בדיקה". טיפ: נניחו שמישהו דובר אמת, ובדקו אם הכול מסתדר.',
      'יש "רמז". אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makePuzzle: makePuzzle, worldsFitting: worldsFitting, truth: truth },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = sp.k === 2 ? 4 : 3, round = 0, good = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) { ctx.finish({ correct: good, total: ROUNDS, note: 'פתרתם ' + good + ' מתוך ' + ROUNDS + ' חידות' }); return; }
        ctx.setProgress(round, ROUNDS);
        var P = null;
        for (var t = 0; t < 10 && !P; t++) P = makePuzzle(sp, ctx);
        play(P);
      }

      function play(P) {
        root.innerHTML = '';
        root.__tl = P; // read by the automated tests
        var k = P.k, ppl = ctx.fresh('people', PEOPLE, k, function (x) { return x.name; });
        var pick = P.w.map(function () { return null; }), done = false, hints = 0, tipAt = -1;
        function N(i) { return ppl[i].name; }
        function liar(i) { return ppl[i].f ? 'משקרת' : 'משקר'; }
        function honest(i) { return ppl[i].f ? 'דוברת אמת' : 'דובר אמת'; }
        function sentence(st) {
          switch (st.t) {
            case 'liar': return N(st.a) + ' ' + liar(st.a);
            case 'honest': return N(st.a) + ' ' + honest(st.a);
            case 'both': return N(st.a) + ' ו' + N(st.b) + ' שניהם דוברי אמת';
            case 'same': return 'אני ו' + N(st.a) + ': שנינו אמת, או שנינו שקר';
            case 'oneOf': return 'בדיוק אחד מ' + N(st.a) + ' ו' + N(st.b) + ' משקר';
            case 'someLiar': return 'לפחות אחד מאיתנו משקר';
          }
          return '';
        }
        var cards = [], sayEls = [];
        P.says.forEach(function (st, i) {
          var tBtn = el('button', { class: 't', type: 'button', onclick: function () { set(i, true); } }, '✓ אמת');
          var lBtn = el('button', { class: 'l', type: 'button', onclick: function () { set(i, false); } }, '✗ שקר');
          var say = el('p', { class: 'tl-say' }, '"' + sentence(st) + '"');
          sayEls.push(say);
          var pickEl = el('div', { class: 'tl-pick' }, [tBtn, lBtn]);
          var card = el('div', { class: 'tl-p' }, [el('span', { class: 'tl-face', 'aria-hidden': 'true' }, [ppl[i].e, el('small', null, N(i))]), say, pickEl]);
          card._t = tBtn; card._l = lBtn; card._pick = pickEl; card._say = say;
          cards.push(card);
        });
        var list = el('div', { class: 'tl-list' }, cards);
        var checkBtn = el('button', { class: 'btn btn-primary', type: 'button', onclick: check }, 'בדיקה');
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var acts = el('div', { class: 'g-actions tl-acts' }, [checkBtn, hintBtn]);
        root.appendChild(list); root.appendChild(acts);
        ctx.setStatus('מי אומר אמת ומי משקר?');
        draw();

        function draw() {
          cards.forEach(function (c, i) {
            c._t.classList.toggle('is-on', pick[i] === true); c._l.classList.toggle('is-on', pick[i] === false);
            c._t.disabled = c._l.disabled = done;
            sayEls[i].classList.toggle('is-tip', i === tipAt);
          });
          checkBtn.disabled = done || pick.some(function (x) { return x === null; });
          hintBtn.disabled = done;
        }
        function set(i, v) { if (done) return; ctx.sound('tap'); pick[i] = pick[i] === v ? null : v; tipAt = -1; draw(); }
        /* a hint: test an assumption. Start from what the player marked; show the first sentence that does not fit it */
        function hint() {
          if (done) return;
          hints++;
          if (pick.every(function (x) { return x !== null; })) {
            var bad = P.says.filter(function (st) { return truth(st, pick) !== pick[st.s]; })[0];
            if (bad) {
              tipAt = bad.s;
              ctx.setStatus('רמז: לפי מה שסימנתם, ' + N(bad.s) + ' ' + (pick[bad.s] ? honest(bad.s) : liar(bad.s)) + ', אבל המשפט ' + (ppl[bad.s].f ? 'שלה' : 'שלו') + ' ' + (truth(bad, pick) ? 'נכון' : 'לא נכון') + '. משהו לא מסתדר');
              draw(); return;
            }
          }
          var i0 = pick.indexOf(null) >= 0 ? pick.indexOf(null) : 0;
          tipAt = i0;
          ctx.setStatus('רמז: נניח ש' + N(i0) + ' ' + honest(i0) + '. אז המשפט ' + (ppl[i0].f ? 'שלה' : 'שלו') + ' נכון. מה זה אומר על האחרים? ואם זה מוביל לסתירה, ' + (ppl[i0].f ? 'היא משקרת' : 'הוא משקר'));
          draw();
        }
        function check() {
          if (done || pick.some(function (x) { return x === null; })) return;
          var ok1 = pick.every(function (v, i) { return v === P.w[i]; });
          done = true;
          var ok = ok1 && hints <= 1;
          if (ok) good++;
          cards.forEach(function (c, i) {
            c.classList.add(pick[i] === P.w[i] ? 'is-right' : 'is-wrong');
            // why: the answer instead of the buttons, and whether the sentence is true (it is for the honest ones)
            var tv = truth(P.says[i], P.w);
            c._pick.replaceWith(el('span', { class: 'tl-verdict ' + (P.w[i] ? 't' : 'l') }, P.w[i] ? '✓ אמת' : '✗ שקר'));
            c._say.appendChild(document.createTextNode(' '));
            c._say.appendChild(el('b', { class: tv ? 't' : 'l' }, tv ? '(נכון)' : '(לא נכון)'));
          });
          if (ok1) {
            ctx.setStatus('נכון!');
            draw();
            ctx.feedback(ok, ok ? undefined : 'נכון, בעזרת רמזים').then(function () { return ctx.wait(1800); }).then(nextRound);
            return;
          }
          // the answer, and why every sentence fits it
          pick = P.w.slice(); draw();
          ctx.setStatus('לא בדיוק. דובר אמת אומר משפט נכון, ושקרן משפט לא נכון');
          acts.hidden = true;
          ctx.feedback(false, 'הפתרון מסומן').then(function () { return ctx.next(round >= ROUNDS ? 'לסיכום' : 'לחידה הבאה'); }).then(nextRound);
        }
      }

      nextRound();
    }
  });
})();
