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

  var ALL = ['liar', 'honest', 'same', 'diff', 'both', 'eitherLiar', 'oneOf', 'someLiar', 'someHonest', 'allLiars', 'count'];
  /* Level 1–50: k = neighbours, kinds = sentences that may be said, assume = how many times the solver must say
     "suppose X tells the truth… that cannot be" (min–max). The early levels had only two riddles and repeated them
     (user report), so: many kinds of sentences, three neighbours from level 5, and assumptions needed from level 13. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    if (L <= 4) return { k: 2, kinds: ['liar', 'honest', 'same', 'diff', 'someLiar', 'someHonest', 'allLiars'], assume: [0, 1] };
    if (L <= 12) return { k: 3, kinds: ['liar', 'honest', 'same', 'diff', 'both', 'eitherLiar', 'someLiar', 'allLiars'], assume: [0, 0] };
    if (L <= 20) return { k: 3, kinds: ALL, assume: [1, 2] };
    if (L <= 27) return { k: 4, kinds: ALL, assume: [0, 1] };
    if (L <= 35) return { k: 4, kinds: ALL, assume: [1, 3] };
    if (L <= 42) return { k: 5, kinds: ALL, assume: [0, 1] };
    return { k: 5, kinds: ALL, assume: L <= 46 ? [1, 3] : [2, 3] };
  }

  // which neighbours a sentence talks about (all of them for "one of us…" sentences)
  var GLOBAL = { someLiar: 1, someHonest: 1, allLiars: 1, count: 1 };
  function varsOf(st, k) {
    if (GLOBAL[st.t]) { var all = []; for (var i = 0; i < k; i++) all.push(i); return all; }
    var v = [st.s, st.a]; if (st.b !== undefined && (st.t === 'both' || st.t === 'oneOf' || st.t === 'eitherLiar')) v.push(st.b);
    return v;
  }
  // the truth of a sentence in a world (w[i] = true if neighbour i tells the truth)
  function truth(st, w) {
    switch (st.t) {
      case 'liar': return !w[st.a];
      case 'honest': return w[st.a];
      case 'both': return w[st.a] && w[st.b];
      case 'eitherLiar': return !w[st.a] || !w[st.b];
      case 'same': return w[st.s] === w[st.a];
      case 'diff': return w[st.s] !== w[st.a];
      case 'oneOf': return (!w[st.a]) !== (!w[st.b]);
      case 'someLiar': return w.some(function (x) { return !x; });
      case 'someHonest': return w.some(function (x) { return x; });
      case 'allLiars': return w.every(function (x) { return !x; });
      case 'count': return w.filter(function (x) { return !x; }).length === st.n;
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

  /* How a person solves it, step by step (used for the explanation after a mistake, and for the hints).
     A step reads one sentence: what it settles given what is already known. When nothing can be read off,
     assume someone tells the truth (or lies), follow the sentences until one cannot fit, and conclude the opposite.
     Step kinds: A = the speaker is known, so the sentence is true/false → settles others;
     B = what is known makes the sentence true/false → settles the speaker;
     C = only one of "honest"/"liar" can say this sentence → settles the speaker;
     D = either way, the sentence settles someone else; X = an assumption that ends in a contradiction. */
  function readSentence(says, i, known, k) {
    var st = says[i], V = varsOf(st, k), un = V.filter(function (v) { return known[v] === null; });
    var fits = [];
    for (var m = 0; m < (1 << un.length); m++) {
      var w = known.slice();
      un.forEach(function (v, j) { w[v] = !!(m & (1 << j)); });
      for (var z = 0; z < k; z++) if (w[z] === null) w[z] = true; // not used by this sentence
      if (truth(st, w) === w[st.s]) fits.push(w);
    }
    if (!fits.length) return { bad: true };
    var settled = un.filter(function (v) { return fits.every(function (w) { return w[v] === fits[0][v]; }); })
      .map(function (v) { return [v, fits[0][v]]; });
    return { settled: settled, un: un };
  }
  function propagate(says, known, out, k) {
    for (var guard = 0; guard < 50; guard++) {
      var moved = false;
      for (var i = 0; i < says.length; i++) {
        var r = readSentence(says, i, known, k);
        if (r.bad) return { bad: i };
        if (!r.settled.length) continue;
        var s = says[i].s, sp = r.settled.filter(function (x) { return x[0] === s; })[0], step;
        if (known[s] !== null) step = { kind: 'A', i: i, set: r.settled };
        else if (sp) step = { kind: r.un.length === 1 ? 'B' : 'C', i: i, set: [sp] }; // settle the speaker first
        else step = { kind: 'D', i: i, set: r.settled };
        step.set.forEach(function (x) { known[x[0]] = x[1]; });
        step.sv = known[s];
        out.push(step); moved = true; break;
      }
      if (!moved) return {};
    }
    return {};
  }
  function explain(says, k) {
    var known = [], steps = [], assumes = 0;
    for (var i = 0; i < k; i++) known.push(null);
    for (var round = 0; round < 10; round++) {
      var r = propagate(says, known, steps, k);
      if (r.bad !== undefined) return null; // cannot happen for a puzzle with an answer
      if (known.every(function (x) { return x !== null; })) return { steps: steps, assumes: assumes };
      var best = null;
      for (var x = 0; x < k; x++) {
        if (known[x] !== null) continue;
        [true, false].forEach(function (v) {
          var kn = known.slice(), sub = [];
          kn[x] = v;
          var rr = propagate(says, kn, sub, k);
          if (rr.bad !== undefined && (!best || sub.length < best.sub.length)) best = { kind: 'X', x: x, v: v, sub: sub, bad: rr.bad, known: kn };
        });
      }
      if (!best) return null; // needs two assumptions at once: too hard to explain, not used
      assumes++;
      known[best.x] = !best.v;
      steps.push(best);
    }
    return null;
  }

  function makeCandidate(k, kinds, rnd) {
    for (var attempt = 0; attempt < 400; attempt++) {
      var w = []; for (var i = 0; i < k; i++) w.push(rnd.randInt(0, 1) === 1);
      if (w.every(Boolean)) continue; // everyone honest is dull
      var says = [], used = {};
      for (var s = 0; s < k; s++) {
        var opts = [];
        for (var t = 0; t < 40; t++) {
          var kind = rnd.pick(kinds), others = [];
          for (var j = 0; j < k; j++) if (j !== s) others.push(j);
          others = rnd.shuffle(others);
          if ((kind === 'both' || kind === 'oneOf' || kind === 'eitherLiar') && others.length < 2) continue;
          var st = { s: s, t: kind, a: others[0], b: others[1] };
          if (kind === 'count') st.n = rnd.randInt(1, k - 1);
          if (GLOBAL[kind] && used[kind + (st.n || '')]) continue; // "one of us…" sentences: each only once
          if (truth(st, w) === w[s]) opts.push(st);
        }
        if (!opts.length) break;
        var chosen = rnd.pick(opts);
        if (GLOBAL[chosen.t]) used[chosen.t + (chosen.n || '')] = 1;
        says.push(chosen);
      }
      if (says.length < k || worldsFitting(k, says).length !== 1) continue;
      var ex = explain(says, k);
      if (!ex) continue;
      return { k: k, w: w, says: says, ex: ex };
    }
    return null;
  }
  // the same riddle whatever the names: who says what about whom, and who lies
  function puzzleKey(P) {
    return P.says.map(function (st) { return st.t + (st.n || '') + (GLOBAL[st.t] ? '' : st.a) + (st.b !== undefined && varsOf(st, P.k).length > 2 ? st.b : ''); }).join(' ') + '|' + P.w.map(Number).join('');
  }

  function makePuzzle(sp, rnd, avoid) {
    var fallback = null;
    for (var t = 0; t < 300; t++) {
      var P = makeCandidate(sp.k, sp.kinds, rnd);
      if (!P) continue;
      fallback = fallback || P;
      if (P.ex.assumes < sp.assume[0] || P.ex.assumes > sp.assume[1]) continue;
      if (avoid && avoid(puzzleKey(P))) continue;
      return P;
    }
    return fallback;
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
    '.tl-why{width:100%;max-width:30rem;padding:.45rem .65rem;background:var(--c-yellow-soft);border-radius:var(--radius-sm);',
    'display:flex;flex-direction:column;gap:.3rem;}',
    '.tl-why-head{margin:0;font-weight:800;font-size:.9rem;color:var(--c-purple);}',
    '.tl-why-text p{margin:0;font-weight:700;font-size:1rem;line-height:1.4;}.tl-why-text p.is-end{font-weight:900;color:var(--c-green);margin-top:.2rem;}',
    '.tl-why-nav{display:flex;align-items:center;justify-content:space-between;gap:.4rem;}.tl-why-n{font-size:.85rem;font-weight:800;color:var(--ink-soft);}',
    /* four or five neighbours: slimmer cards so all fit on a phone */
    '.tl-many .tl-face{font-size:1.3rem;min-width:2.4rem;}.tl-many .tl-face small{font-size:.85rem;}',
    '.tl-many .tl-p{padding:.2rem .35rem;gap:.15rem .3rem;}.tl-many .tl-say{font-size:.93rem;padding:.15rem .4rem;line-height:1.25;}',
    '.tl-list.tl-many{gap:.22rem;}.tl-why-nav .btn{white-space:nowrap;}.tl-why-n{white-space:nowrap;}',
    '.tl-many .tl-pick{gap:.2rem;}.tl-many .tl-pick button{min-height:2.1rem;min-width:3.7rem;font-size:.92rem;}',
    '.is-solved .tl-p{padding:.2rem .45rem;}.is-solved .tl-face{font-size:1.25rem;}.is-solved .tl-list{gap:.25rem;}',
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
    _model: { spec: spec, makePuzzle: makePuzzle, worldsFitting: worldsFitting, truth: truth, explain: explain, puzzleKey: puzzleKey },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = sp.k === 2 ? 4 : sp.k === 3 ? 3 : 2, round = 0, good = 0, seen = {};

      function nextRound() {
        round++;
        if (round > ROUNDS) { ctx.finish({ correct: good, total: ROUNDS, note: 'פתרתם ' + good + ' מתוך ' + ROUNDS + ' חידות' }); return; }
        ctx.setProgress(round, ROUNDS);
        // never the same riddle twice in a game, and not the ones of the last games either (ctx.fresh remembers them)
        var cands = [];
        for (var t = 0; t < 8; t++) {
          var Q = makePuzzle(sp, ctx, function (key) { return seen[key] || cands.some(function (c) { return puzzleKey(c) === key; }); });
          if (Q && !seen[puzzleKey(Q)] && !cands.some(function (c) { return puzzleKey(c) === puzzleKey(Q); })) cands.push(Q);
        }
        var P = cands.length ? ctx.fresh('riddle-' + sp.k, cands, 1, puzzleKey)[0] : makePuzzle(sp, ctx);
        seen[puzzleKey(P)] = true;
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
        function stat(i, v) { return v ? honest(i) : liar(i); }
        function his(i) { return ppl[i].f ? 'שלה' : 'שלו'; }
        function he(i) { return ppl[i].f ? 'היא' : 'הוא'; }
        function TF(v) { return v ? 'נכון' : 'לא נכון'; }
        function who(set) { return set.map(function (x, j) { return (j ? 'ו' : '') + N(x[0]) + ' ' + stat(x[0], x[1]); }).join(' '); }
        function meaning(sa, v) {
          var NUM = ['', 'אחד', 'שניים', 'שלושה', 'ארבעה'];
          switch (sa.t) {
            case 'allLiars': return v ? 'כולם משקרים' : 'לא כולם משקרים';
            case 'someLiar': return v ? 'לפחות אחד משקר' : 'אף אחד לא משקר';
            case 'someHonest': return v ? 'לפחות אחד דובר אמת' : 'כולם משקרים';
            case 'count': return (v ? '' : 'לא ') + 'בדיוק ' + NUM[sa.n] + (sa.n === 1 ? ' משקר' : ' משקרים');
            case 'both': case 'eitherLiar':
              var two = N(sa.a) + ' ו' + N(sa.b), fem = ppl[sa.a].f && ppl[sa.b].f;
              return (sa.t === 'both') === v ? two + (fem ? ' שתיהן דוברות אמת' : ' שניהם דוברי אמת') : 'לפחות אחד מ' + N(sa.a) + ' ו' + N(sa.b) + ' משקר';
            case 'oneOf': return v ? 'בדיוק אחד מ' + N(sa.a) + ' ו' + N(sa.b) + ' משקר' : N(sa.a) + ' ו' + N(sa.b) + ': שניהם אמת, או שניהם שקר';
          }
          return '';
        }
        /* one line of the solution: what a sentence tells, in words */
        function stepText(st) {
          var sa = P.says[st.i], z = sa.s, m = meaning(sa, st.sv);
          if (st.kind === 'A') return N(z) + ' ' + stat(z, st.sv) + ', אז המשפט ' + his(z) + ' ' + TF(st.sv) + (m ? ': ' + m : '') + '. לכן ' + who(st.set) + '.';
          if (st.kind === 'B') return 'לפי מה שידוע עד עכשיו, המשפט של ' + N(z) + ' "' + sentence(sa) + '" ' + TF(st.sv) + '. לכן ' + N(z) + ' ' + stat(z, st.sv) + '.';
          if (st.kind === 'C') return 'אם ' + N(z) + ' ' + stat(z, !st.sv) + ', המשפט ' + his(z) + ' צריך להיות ' + TF(!st.sv) + '. אבל אז "' + sentence(sa) +
            '" דווקא ' + TF(st.sv) + '. לכן ' + N(z) + ' ' + stat(z, st.sv) + '.';
          return 'בין אם ' + N(z) + ' ' + honest(z) + ' ובין אם ' + liar(z) + ', מהמשפט ' + his(z) + ' יוצא ש' + who(st.set) + '.';
        }
        function clashText(X) {
          var sa = P.says[X.bad], z = sa.s, kn = X.known;
          if (kn[z] === null) return 'אבל אז המשפט של ' + N(z) + ' לא מסתדר בשום מצב. זה לא ייתכן!';
          var all = varsOf(sa, k).every(function (v) { return kn[v] !== null; });
          return 'אבל אז ' + N(z) + ' ' + stat(z, kn[z]) + ', והמשפט ' + his(z) + (all ? ' ' + TF(truth(sa, kn)) : ' לא יכול להיות ' + TF(kn[z])) + '. זה לא ייתכן!';
        }
        /* the whole solution as pages, one step each: { head (an assumption being followed), lines, hl = the sentence used } */
        function solution() {
          var pages = [];
          P.ex.steps.forEach(function (st) {
            if (st.kind !== 'X') { pages.push({ lines: [stepText(st)], hl: P.says[st.i].s }); return; }
            var head = 'נניח ש' + N(st.x) + ' ' + stat(st.x, st.v) + ', ונבדוק:';
            pages.push({ lines: ['אי אפשר לדעת ישר. ננסה הנחה: נניח ש' + N(st.x) + ' ' + stat(st.x, st.v) + '.'], hl: st.x });
            st.sub.forEach(function (x) { pages.push({ head: head, lines: [stepText(x)], hl: P.says[x.i].s }); });
            pages.push({ head: head, lines: [clashText(st), 'לכן ההנחה לא נכונה: ' + N(st.x) + ' ' + stat(st.x, !st.v) + '.'], hl: P.says[st.bad].s, end: true });
          });
          return pages;
        }
        function sentence(st) {
          switch (st.t) {
            case 'liar': return N(st.a) + ' ' + liar(st.a);
            case 'honest': return N(st.a) + ' ' + honest(st.a);
            case 'both': return N(st.a) + ' ו' + N(st.b) + (ppl[st.a].f && ppl[st.b].f ? ' שתיהן דוברות אמת' : ' שניהם דוברי אמת');
            case 'same': return 'אני ו' + N(st.a) + ': שנינו אמת, או שנינו שקר';
            case 'diff': return 'אני ו' + N(st.a) + ': אחד מאיתנו אמת והשני שקר';
            case 'oneOf': return 'בדיוק אחד מ' + N(st.a) + ' ו' + N(st.b) + ' משקר';
            case 'eitherLiar': return 'לפחות אחד מ' + N(st.a) + ' ו' + N(st.b) + ' משקר';
            case 'someLiar': return 'לפחות אחד מאיתנו משקר';
            case 'someHonest': return 'לפחות אחד מאיתנו דובר אמת';
            case 'allLiars': return k === 2 ? 'שנינו משקרים' : 'כולנו משקרים';
            case 'count': return st.n === 1 ? 'בדיוק אחד מאיתנו משקר' : 'בדיוק ' + ['', '', 'שניים', 'שלושה', 'ארבעה'][st.n] + ' מאיתנו משקרים';
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
        var list = el('div', { class: 'tl-list' + (k >= 4 ? ' tl-many' : '') }, cards);
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
          var st = P.ex.steps.filter(function (x) {
            var set = x.kind === 'X' ? [[x.x, !x.v]] : x.set;
            return set.some(function (y) { return pick[y[0]] !== y[1]; });
          })[0] || P.ex.steps[0];
          var z = st.kind === 'X' ? st.x : P.says[st.i].s, msg;
          if (st.kind === 'X') msg = 'נסו להניח ש' + N(z) + ' ' + honest(z) + ', ולבדוק לפי זה את המשפטים של כולם. ואז להניח ש' + he(z) + ' ' + liar(z) + '. רק הנחה אחת מסתדרת בלי סתירה';
          else if (st.kind === 'A') msg = N(z) + ' ' + stat(z, st.sv) + '. אז האם המשפט ' + his(z) + ' נכון? ומה זה אומר על ' + st.set.map(function (y) { return N(y[0]); }).join(' ו') + '?';
          else if (st.kind === 'B') msg = 'לפי מה שכבר ידוע, האם המשפט של ' + N(z) + ' נכון? מי שאומר משפט נכון דובר אמת';
          else if (st.kind === 'C') msg = 'הסתכלו על המשפט של ' + N(z) + '. אם ' + he(z) + ' ' + liar(z) + ', המשפט צריך להיות לא נכון. האם זה אפשרי? ואם ' + he(z) + ' ' + honest(z) + '?';
          else msg = 'הסתכלו על המשפט של ' + N(z) + '. בדקו את שתי האפשרויות: ' + he(z) + ' ' + honest(z) + ', או ' + liar(z) + '. מה יוצא בשתיהן?';
          tipAt = z;
          ctx.setStatus('רמז: ' + msg);
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
          // the answer, and how to reach it, step by step
          pick = P.w.slice(); draw();
          ctx.setStatus('לא בדיוק. ככה פותרים:');
          acts.hidden = true;
          root.classList.add('is-solved');
          var pages = solution(), at = 0;
          var whyHead = el('p', { class: 'tl-why-head' }), whyText = el('div', { class: 'tl-why-text' }), whyCount = el('span', { class: 'tl-why-n' });
          var prevBtn = el('button', { class: 'btn btn-quiet btn-sm', type: 'button', onclick: function () { show(at - 1); } }, '→ הקודם');
          var nextBtn = el('button', { class: 'btn btn-secondary btn-sm', type: 'button', onclick: function () { show(at + 1); } }, 'הבא ←');
          var why = el('div', { class: 'tl-why', 'aria-live': 'polite' }, [whyHead, whyText, el('div', { class: 'tl-why-nav' }, [prevBtn, whyCount, nextBtn])]);
          root.appendChild(why);
          function show(n) {
            at = Math.max(0, Math.min(pages.length - 1, n));
            var pg = pages[at];
            whyHead.textContent = pg.head || ''; whyHead.hidden = !pg.head;
            whyText.innerHTML = '';
            pg.lines.forEach(function (t, j) { whyText.appendChild(el('p', { class: pg.end && j ? 'is-end' : '' }, t)); });
            whyCount.textContent = 'צעד ' + (at + 1) + ' מתוך ' + pages.length;
            prevBtn.disabled = at === 0; nextBtn.disabled = at === pages.length - 1;
            tipAt = pg.hl; draw();
          }
          show(0);
          ctx.feedback(false, 'הפתרון מסומן').then(function () { return ctx.next(round >= ROUNDS ? 'לסיכום' : 'לחידה הבאה'); }).then(nextRound);
        }
      }

      nextRound();
    }
  });
})();
