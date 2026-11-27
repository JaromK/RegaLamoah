/* תעלומה בשכונה — a small mystery in the neighbourhood (the cake vanished, the bicycle was taken…). Each suspect was
   in a different place and, from level 21, held a different thing. The clues tell who was where and with what; one
   fact about the one who did it is known. Work out who it was, which thing, or where. A detective's notebook
   (✗ / ✓) helps. Logic, deduction. Every case has exactly one answer. Untimed. */
(function () {
  'use strict';

  var PEOPLE = [
    { name: 'דוד', f: false, e: '👨' }, { name: 'רינה', f: true, e: '👩' }, { name: 'משה', f: false, e: '👴' },
    { name: 'שרה', f: true, e: '👵' }, { name: 'יוסי', f: false, e: '🧔' }, { name: 'חנה', f: true, e: '👧' },
    { name: 'אבי', f: false, e: '👦' }, { name: 'רות', f: true, e: '👩‍🦰' }, { name: 'עמוס', f: false, e: '👨‍🦳' },
    { name: 'מירי', f: true, e: '👩‍🦳' }, { name: 'דני', f: false, e: '👨‍🦱' }, { name: 'יעל', f: true, e: '👩‍🦱' },
    { name: 'גיל', f: false, e: '👱‍♂️' }, { name: 'תמר', f: true, e: '👱‍♀️' }
  ];
  // in = how the place is said after "היה" ("בגינה")
  var PLACES = [
    { name: 'גינה', in: 'בגינה', e: '🌳' }, { name: 'מכולת', in: 'במכולת', e: '🏪' }, { name: 'בית קפה', in: 'בבית הקפה', e: '☕' },
    { name: 'דואר', in: 'בדואר', e: '📮' }, { name: 'תחנה', in: 'בתחנה', e: '🚏' }, { name: 'מרפאה', in: 'במרפאה', e: '🏥' },
    { name: 'בריכה', in: 'בבריכה', e: '🏊' }, { name: 'שוק', in: 'בשוק', e: '🍉' }
  ];
  var ITEMS = [
    { name: 'מפתח', e: '🔑' }, { name: 'סולם', e: '🪜' }, { name: 'מטרייה', e: '☂️' }, { name: 'פנס', e: '🔦' },
    { name: 'כפפות', e: '🧤' }, { name: 'סל', e: '🧺' }, { name: 'תיק', e: '🎒' }, { name: 'צעיף', e: '🧣' }
  ];
  // who = the one who did it, said in a few words (one line on a phone together with the known fact)
  var CASES = [
    { e: '🎂', what: 'העוגה של סבתא נעלמה!', who: 'מי שלקח אותה' }, { e: '🪴', what: 'העציץ של השכנה נשבר!', who: 'מי ששבר אותו' },
    { e: '📰', what: 'העיתון של סבא נעלם!', who: 'מי שלקח אותו' }, { e: '🚲', what: 'האופניים של הנכד נעלמו!', who: 'מי שלקח אותם' },
    { e: '🍪', what: 'העוגיות נעלמו מהצנצנת!', who: 'מי שלקח אותן' }, { e: '🎈', what: 'הבלונים של המסיבה נעלמו!', who: 'מי שלקח אותם' },
    { e: '🐈', what: 'השער נפתח והחתול ברח!', who: 'מי שפתח אותו' }, { e: '🌷', what: 'הפרחים בגינה נקטפו!', who: 'מי שקטף אותם' }
  ];

  /* Level 1–50: n = suspects (and places, and things), items = things too, types = kinds of clue,
     noDirect = no clue that names the answer straight away. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    // the clues always settle everything (who was where, with what): the player fills in every suspect's card
    var s = spec0(L); s.full = true; return s;
  }
  function spec0(L) {
    if (L <= 5) return { n: 3, items: false, types: ['spY', 'spN'], noDirect: false };
    if (L <= 10) return { n: 3, items: false, types: ['spY', 'spN', 'spOr'], noDirect: true };
    if (L <= 15) return { n: 4, items: false, types: ['spY', 'spN', 'spOr'], noDirect: true };
    if (L <= 20) return { n: 4, items: false, types: ['spN', 'spOr'], noDirect: true };
    if (L <= 25) return { n: 3, items: true, types: ['spY', 'spN', 'siY', 'siN', 'piY'], noDirect: true };
    if (L <= 30) return { n: 3, items: true, types: ['spN', 'siN', 'spOr', 'piY', 'piN'], noDirect: true };
    if (L <= 40) return { n: 4, items: true, types: ['spY', 'spN', 'siY', 'siN', 'spOr', 'piY', 'piN'], noDirect: true };
    return { n: 4, items: true, types: ['spN', 'siN', 'spOr', 'piY', 'piN'], noDirect: true };
  }

  function perms(n) {
    var out = [];
    (function go(a, rest) {
      if (!rest.length) { out.push(a); return; }
      rest.forEach(function (x, i) { go(a.concat([x]), rest.slice(0, i).concat(rest.slice(i + 1))); });
    })([], Array.apply(null, { length: n }).map(function (_, i) { return i; }));
    return out;
  }

  // does a world { pl, it } meet a clue?
  function holds(c, w) {
    switch (c.t) {
      case 'spY': return w.pl[c.s] === c.p;
      case 'spN': return w.pl[c.s] !== c.p;
      case 'spOr': return w.pl[c.s] === c.p || w.pl[c.s] === c.p2;
      case 'siY': return w.it[c.s] === c.i;
      case 'siN': return w.it[c.s] !== c.i;
      case 'piY': return w.it[w.pl.indexOf(c.p)] === c.i;
      case 'piN': return w.it[w.pl.indexOf(c.p)] !== c.i;
    }
    return true;
  }
  // the answer in a world: q = 'who' | 'item' | 'place'; fact = { t: 'place' | 'item', v }
  function culpritIn(w, fact) { return fact.t === 'place' ? w.pl.indexOf(fact.v) : w.it.indexOf(fact.v); }
  function answerIn(w, q, fact) {
    var s = culpritIn(w, fact);
    return q === 'who' ? s : q === 'item' ? w.it[s] : w.pl[s];
  }

  function makeCase(sp, rnd) {
    var n = sp.n, P = perms(n);
    var worlds = [];
    P.forEach(function (pl) { (sp.items ? P : [null]).forEach(function (it) { worlds.push({ pl: pl, it: it || pl }); }); });
    var sol = rnd.pick(worlds);
    var c = rnd.randInt(0, n - 1);
    var q = 'who'; // the question is always who did it (the clearest one)
    var fact = q === 'place' ? { t: 'item', v: sol.it[c] } : q === 'item' ? { t: 'place', v: sol.pl[c] } : rnd.pick([{ t: 'place', v: sol.pl[c] }].concat(sp.items ? [{ t: 'item', v: sol.it[c] }] : []));
    var ans = answerIn(sol, q, fact);
    // every true clue of the allowed kinds
    var pool = [];
    for (var s = 0; s < n; s++) for (var j = 0; j < n; j++) {
      if (sp.types.indexOf('spY') >= 0 && sol.pl[s] === j) pool.push({ t: 'spY', s: s, p: j });
      if (sp.types.indexOf('spN') >= 0 && sol.pl[s] !== j) pool.push({ t: 'spN', s: s, p: j });
      if (sp.items && sp.types.indexOf('siY') >= 0 && sol.it[s] === j) pool.push({ t: 'siY', s: s, i: j });
      if (sp.items && sp.types.indexOf('siN') >= 0 && sol.it[s] !== j) pool.push({ t: 'siN', s: s, i: j });
      if (sp.types.indexOf('spOr') >= 0 && sol.pl[s] !== j) pool.push({ t: 'spOr', s: s, p: Math.min(j, sol.pl[s]), p2: Math.max(j, sol.pl[s]) });
    }
    for (var p = 0; p < n; p++) for (var i = 0; i < n; i++) {
      var holder = sol.pl.indexOf(p);
      if (sp.items && sp.types.indexOf('piY') >= 0 && sol.it[holder] === i) pool.push({ t: 'piY', p: p, i: i });
      if (sp.items && sp.types.indexOf('piN') >= 0 && sol.it[holder] !== i) pool.push({ t: 'piN', p: p, i: i });
    }
    // no clue that gives the answer away in one step
    if (sp.noDirect) pool = pool.filter(function (cl) {
      if (q === 'who' && fact.t === 'place' && cl.t === 'spY' && cl.p === fact.v) return false;
      if (q === 'who' && fact.t === 'item' && cl.t === 'siY' && cl.i === fact.v) return false;
      if (q === 'item' && cl.t === 'piY' && cl.p === fact.v) return false;
      return true;
    });
    function unique(clues) {
      if (sp.full) { // exactly one world fits
        var count = 0;
        for (var k0 = 0; k0 < worlds.length && count < 2; k0++) if (clues.every(function (cl) { return holds(cl, worlds[k0]); })) count++;
        return count === 1;
      }
      var seen = null;
      for (var k = 0; k < worlds.length; k++) {
        var w = worlds[k];
        if (!clues.every(function (cl) { return holds(cl, w); })) continue;
        var a = answerIn(w, q, fact);
        if (seen === null) seen = a; else if (seen !== a) return false;
      }
      return true;
    }
    var clues = [];
    rnd.shuffle(pool).forEach(function (cl) { if (!unique(clues)) clues.push(cl); });
    if (!unique(clues)) return null;
    // drop the clues that are not needed
    rnd.shuffle(clues.slice()).forEach(function (cl) {
      var rest = clues.filter(function (x) { return x !== cl; });
      if (unique(rest)) clues = rest;
    });
    if (clues.length < 2 || clues.length > (n === 3 ? 6 : 7)) return null; // 7 clues at most: they must fit a phone
    return { n: n, items: sp.items, sol: sol, culprit: c, q: q, fact: fact, answer: ans, clues: rnd.shuffle(clues), worlds: worlds };
  }

  var css = [
    /* the story: what happened, the big clue, the goal */
    '.my-story{width:100%;max-width:32rem;background:var(--c-yellow-soft);border-radius:14px;padding:.35rem .6rem;display:flex;gap:.5rem;align-items:center;}',
    '.my-story .e{font-size:2rem;line-height:1;flex:none;}',
    '.my-story p{margin:0;font-weight:800;font-size:.98rem;line-height:1.25;}',
    '.my-story .big{display:block;margin-top:.15rem;color:var(--c-red);}',
    /* suspects: a card each, with the places (and things) to fill in */
    /* one row per suspect: who, where, (what) */
    '.my-cards{display:flex;flex-direction:column;gap:.22rem;width:100%;max-width:32rem;}',
    '.my-card{background:var(--surface-2);border-radius:12px;padding:.1rem .3rem;display:grid;grid-template-columns:5.2rem repeat(var(--k),minmax(0,1fr));gap:.3rem;align-items:center;border:3px solid transparent;}',
    '.my-card.is-bad{border-color:var(--c-red);}.my-card.is-ok{border-color:var(--c-green);}.my-card.is-tip{border-color:var(--c-purple);}',
    '.my-card.is-culprit{background:var(--c-yellow-soft);border-color:var(--c-yellow);}',
    '.my-who{display:flex;align-items:center;gap:.3rem;font-weight:900;font-size:1rem;min-width:0;}',
    '.my-who .e{font-size:1.5rem;line-height:1;}',
    '.my-slot{display:flex;align-items:center;justify-content:center;gap:.25rem;min-height:2.55rem;border-radius:10px;border:2px dashed var(--ink-soft);background:var(--surface);',
    'color:var(--ink);font:inherit;font-weight:800;font-size:.95rem;padding:.05rem .3rem;cursor:pointer;white-space:nowrap;overflow:hidden;min-width:0;min-height:2.2rem;}',
    '.my-slot.is-set{border-style:solid;border-color:var(--c-blue);background:var(--c-blue-soft);}',
    '.my-slot .e{font-size:1.25rem;}',
    '.my-slot:disabled{cursor:default;}',
    '.my-clues{list-style:none;margin:0;padding:0;width:100%;max-width:32rem;display:flex;flex-direction:column;gap:.15rem;}',
    '.my-clue{display:flex;gap:.4rem;align-items:center;width:100%;text-align:start;padding:.05rem .45rem;border-radius:8px;border:0;background:var(--surface-2);',
    'color:var(--ink);font:inherit;font-size:.95rem;font-weight:700;line-height:1.28;cursor:pointer;}',
    '.my-clue .ck{flex:none;width:1.25rem;height:1.25rem;border:2px solid var(--ink-soft);border-radius:4px;display:grid;place-items:center;font-size:.85rem;}',
    '.my-clue.is-done{opacity:.55;}.my-clue.is-done .ck{background:var(--good);border-color:var(--good);color:#fff;}',
    '.my-clue.is-tip{background:var(--c-purple-soft);box-shadow:inset 0 0 0 3px var(--c-purple);opacity:1;}',
    '.my-clue.is-broken{background:var(--c-red-soft);box-shadow:inset 0 0 0 3px var(--c-red);opacity:1;}',
    '.my-acts{flex-wrap:nowrap;gap:.3rem;width:100%;max-width:32rem;}.my-acts .btn{flex:1 1 auto;min-width:0;padding-inline:.4rem;font-size:.95rem;white-space:nowrap;}',
    /* the chooser at the bottom of the screen */
    '.my-sheet{position:fixed;inset-inline:0;bottom:0;z-index:15;background:var(--surface);border-top:3px solid var(--c-blue);box-shadow:var(--shadow);',
    'padding:.8rem .8rem 1rem;display:flex;flex-direction:column;gap:.6rem;align-items:center;}',
    '.my-sheet h3{font-family:var(--font-body);font-size:1.2rem;font-weight:800;margin:0;}',
    '.my-opts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.45rem;width:100%;max-width:26rem;}',
    '.my-opt{display:flex;align-items:center;justify-content:center;gap:.4rem;min-height:3.4rem;border-radius:var(--radius-sm);border:2px solid var(--line);',
    'background:var(--surface-2);color:var(--ink);font:inherit;font-weight:800;font-size:1.1rem;cursor:pointer;}',
    '.my-opt .e{font-size:1.6rem;}.my-opt small{font-size:.8rem;color:var(--ink-soft);font-weight:700;}',
    '.my-opt.is-here{border-color:var(--c-blue);background:var(--c-blue-soft);}',
    '@media (min-width:900px){.my-main,.my-side{max-width:32rem;width:100%;display:flex;flex-direction:column;gap:.6rem;align-items:center;}}'
  ].join('');

  BrainGames.register({
    id: 'mystery',
    name: 'תעלומה בשכונה',
    skill: 'logic',
    isNew: true,
    tagline: 'קראו את הרמזים וגלו מי עשה את זה',
    benefit: 'חשיבה לוגית והסקת מסקנות',
    instructions: [
      'משהו קרה בשכונה, ויש כמה חשודים. כל חשוד היה במקום אחר (ובהמשך גם החזיק חפץ אחר).',
      'הרמז הגדול אומר איפה היה מי שעשה את זה. הרמזים הקטנים מספרים על החשודים.',
      'לחצו על "איפה?" בכרטיס של כל חשוד ובחרו מקום. כשכולם במקום, לחצו "בדיקה".',
      'מי שנמצא במקום של הרמז הגדול, הוא עשה את זה! יש "רמז", "↶ בטלו" ו"נקו". אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makeCase: makeCase, holds: holds, answerIn: answerIn },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = level <= 20 ? 3 : 2, round = 0, good = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) { ctx.finish({ correct: good, total: ROUNDS, note: 'פתרתם ' + good + ' מתוך ' + ROUNDS + ' תעלומות' }); return; }
        ctx.setProgress(round, ROUNDS);
        var C = null;
        for (var t = 0; t < 40 && !C; t++) C = makeCase(sp, ctx);
        play(C);
      }

      function play(C) {
        root.innerHTML = '';
        root.__my = C; // read by the automated tests
        var n = C.n;
        // people, places, things and the story: not the ones of the last rounds and games
        var ppl = ctx.fresh('people', PEOPLE, n, function (x) { return x.name; });
        var plc = ctx.fresh('places', PLACES, n, function (x) { return x.name; });
        var its = ctx.fresh('items', ITEMS, n, function (x) { return x.name; });
        var cs = ctx.fresh('case', CASES, 1, function (x) { return x.e; })[0];
        function S(s) { return ppl[s].name; }
        function was(s) { return ppl[s].f ? 'הייתה' : 'היה'; }
        function held(s) { return ppl[s].f ? 'החזיקה' : 'החזיק'; }
        function IT(i) { return 'ה' + its[i].name; }
        function clueText(c) {
          switch (c.t) {
            case 'spY': return S(c.s) + ' ' + was(c.s) + ' ' + plc[c.p].in;
            case 'spN': return S(c.s) + ' לא ' + was(c.s) + ' ' + plc[c.p].in;
            case 'spOr': return S(c.s) + ' ' + was(c.s) + ' ' + plc[c.p].in + ' או ' + plc[c.p2].in;
            case 'siY': return S(c.s) + ' ' + held(c.s) + ' את ' + IT(c.i);
            case 'siN': return S(c.s) + ' לא ' + held(c.s) + ' את ' + IT(c.i);
            case 'piY': return 'מי שהיה ' + plc[c.p].in + ' החזיק את ' + IT(c.i);
            case 'piN': return 'מי שהיה ' + plc[c.p].in + ' לא החזיק את ' + IT(c.i);
          }
          return '';
        }
        var bigClue = C.fact.t === 'place' ? cs.who + ' היה ' + plc[C.fact.v].in : cs.who + ' החזיק את ' + IT(C.fact.v);

        // what the player wrote on each card: pl[s] = place index or -1, it[s] = thing index or -1
        var pl = ppl.map(function () { return -1; }), it = ppl.map(function () { return -1; });
        var marks = {}, done = false, hints = 0, checks = 0, past = [], tipS = -1, tipClue = -1, bad = {}, broken = -1, sheet = null;

        var story = el('div', { class: 'my-story' }, [
          el('p', null, [cs.e + ' ' + (cs.what || ''), el('span', { class: 'big' }, '🔍 הרמז הגדול: ' + bigClue + '.')])]);
        var cardsEl = el('div', { class: 'my-cards', style: { '--k': C.items ? 2 : 1 } });
        var clueEls = C.clues.map(function (c, i) {
          return el('li', null, el('button', { class: 'my-clue', type: 'button', onclick: function () { marks[i] = !marks[i]; ctx.sound('tap'); draw(); } },
            [el('span', { class: 'ck', 'aria-hidden': 'true' }), el('span', null, clueText(c))]));
        });
        var clueList = el('ul', { class: 'my-clues' }, clueEls);
        var checkBtn = el('button', { class: 'btn btn-primary', type: 'button', onclick: check }, 'בדיקה');
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var undoBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: undo }, '↶ בטלו');
        var clearBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: clearAll }, 'נקו');
        var acts = el('div', { class: 'g-actions my-acts' }, [checkBtn, hintBtn, undoBtn, clearBtn]);
        root.classList.add('g-split');
        root.appendChild(el('div', { class: 'my-main' }, [story, cardsEl]));
        root.appendChild(el('div', { class: 'g-side my-side' }, [clueList, acts]));
        ctx.setStatus('גלו מי זה! לחצו על "איפה?" ליד כל חשוד');
        draw();

        function draw() {
          cardsEl.innerHTML = '';
          ppl.forEach(function (p, s) {
            var kids = [el('span', { class: 'my-who' }, [el('span', { class: 'e', 'aria-hidden': 'true' }, p.e), p.name])];
            kids.push(el('button', { class: 'my-slot' + (pl[s] >= 0 ? ' is-set' : ''), type: 'button', disabled: done, onclick: function () { open(s, 'place'); } },
              pl[s] >= 0 ? [el('span', { class: 'e', 'aria-hidden': 'true' }, plc[pl[s]].e), plc[pl[s]].name] : '📍 איפה?'));
            if (C.items) kids.push(el('button', { class: 'my-slot' + (it[s] >= 0 ? ' is-set' : ''), type: 'button', disabled: done, onclick: function () { open(s, 'item'); } },
              it[s] >= 0 ? [el('span', { class: 'e', 'aria-hidden': 'true' }, its[it[s]].e), its[it[s]].name] : '🧰 מה?'));
            var culprit = done && s === C.culprit;
            cardsEl.appendChild(el('div', { class: 'my-card' + (bad[s] ? ' is-bad' : '') + (s === tipS ? ' is-tip' : '') + (culprit ? ' is-culprit' : done ? ' is-ok' : '') }, kids));
          });
          clueEls.forEach(function (li, i) {
            var b = li.firstChild;
            b.classList.toggle('is-done', !!marks[i]); b.firstChild.textContent = marks[i] ? '✓' : '';
            b.classList.toggle('is-tip', i === tipClue); b.classList.toggle('is-broken', i === broken);
          });
          var full = pl.every(function (v) { return v >= 0; }) && (!C.items || it.every(function (v) { return v >= 0; }));
          checkBtn.disabled = done || !full;
          undoBtn.disabled = done || !past.length;
          clearBtn.disabled = done || !(pl.some(function (v) { return v >= 0; }) || it.some(function (v) { return v >= 0; }));
          hintBtn.disabled = done;
        }
        function closeSheet() { if (sheet) sheet.remove(); sheet = null; }
        function open(s, kind) {
          if (done) return;
          ctx.sound('tap'); closeSheet();
          var list = kind === 'place' ? plc : its, cur = kind === 'place' ? pl : it;
          sheet = el('div', { class: 'my-sheet', role: 'dialog' }, [
            el('h3', null, kind === 'place' ? 'איפה ' + was(s) + ' ' + S(s) + '?' : 'מה ' + held(s) + ' ' + S(s) + '?'),
            el('div', { class: 'my-opts' }, list.map(function (x, j) {
              var who = cur.indexOf(j);
              return el('button', { class: 'my-opt' + (cur[s] === j ? ' is-here' : ''), type: 'button', onclick: function () { set(s, kind, j); } },
                [el('span', { class: 'e', 'aria-hidden': 'true' }, x.e), el('span', null, [x.name, who >= 0 && who !== s ? el('small', null, ' (' + S(who) + ')') : null])]);
            }).concat(cur[s] >= 0 ? [el('button', { class: 'my-opt', type: 'button', onclick: function () { set(s, kind, -1); } }, 'עוד לא יודעים')] : [])),
            el('button', { class: 'btn btn-quiet', type: 'button', onclick: function () { closeSheet(); } }, 'סגירה')
          ]);
          root.appendChild(sheet);
        }
        function snapshot() { past.push(JSON.stringify({ pl: pl, it: it })); }
        // one place (and one thing) per suspect: choosing a taken one swaps it with that suspect
        function set(s, kind, j) {
          ctx.sound('tap'); snapshot(); closeSheet();
          var cur = kind === 'place' ? pl : it;
          var other = j >= 0 ? cur.indexOf(j) : -1;
          if (other >= 0 && other !== s) cur[other] = cur[s];
          cur[s] = j;
          bad = {}; broken = -1; tipS = -1; tipClue = -1;
          ctx.setStatus(cur.every(function (v) { return v >= 0; }) && (!C.items || (pl.concat(it)).every(function (v) { return v >= 0; })) ? 'כולם במקום? לחצו "בדיקה"' : 'איפה היה כל חשוד? לחצו על "איפה?"');
          draw();
        }
        function undo() { if (done || !past.length) return; ctx.sound('tap'); var p = JSON.parse(past.pop()); pl = p.pl; it = p.it; bad = {}; broken = -1; draw(); }
        function clearAll() { if (done) return; ctx.sound('tap'); snapshot(); pl = pl.map(function () { return -1; }); it = it.map(function () { return -1; }); bad = {}; broken = -1; ctx.setStatus('הכרטיסים נוקו (אפשר "בטלו")'); draw(); }
        function world() { return { pl: pl.slice(), it: C.items ? it.slice() : pl.slice() }; }
        function check() {
          if (done) return;
          checks++;
          var w = world();
          var wrong = {}, any = false;
          ppl.forEach(function (_, s) { if (pl[s] !== C.sol.pl[s] || (C.items && it[s] !== C.sol.it[s])) { wrong[s] = true; any = true; } });
          if (any) {
            // a clue the cards break, if there is one: that is where to look
            broken = C.clues.findIndex(function (c) { return !holds(c, w); });
            bad = wrong;
            ctx.sound('bad');
            ctx.setStatus('משהו לא מתאים. תקנו את הכרטיסים האדומים'); // the clue they break is marked in red too
            draw(); return;
          }
          done = true; closeSheet();
          var c = C.culprit, ok = checks <= 2 && hints <= 2;
          if (ok) good++;
          draw();
          var why = C.fact.t === 'place' ? S(c) + ' ' + was(c) + ' ' + plc[C.fact.v].in : S(c) + ' ' + held(c) + ' את ' + IT(C.fact.v);
          ctx.setStatus('פתרתם! ' + why + ', אז ' + S(c) + ' ' + (ppl[c].f ? 'עשתה' : 'עשה') + ' את זה 🕵️');
          acts.hidden = true;
          ctx.feedback(ok, ok ? 'פתרתם את התעלומה!' : 'פתרתם, בעזרת רמזים').then(function () { return ctx.wait(2600); }).then(nextRound);
        }
        /* a hint: a card that is wrong first; else the clue that settles one card, and whose card it is */
        function hint() {
          if (done) return;
          hints++; closeSheet(); bad = {}; broken = -1;
          for (var s = 0; s < n; s++) {
            if ((pl[s] >= 0 && pl[s] !== C.sol.pl[s]) || (C.items && it[s] >= 0 && it[s] !== C.sol.it[s])) {
              tipS = s; tipClue = -1;
              ctx.setStatus('רמז: משהו בכרטיס של ' + S(s) + ' לא נכון. קראו שוב את הרמזים עליו'); draw(); return;
            }
          }
          // the worlds that fit the right cards so far (and some clues)
          function fitting(clues) {
            return C.worlds.filter(function (w) {
              for (var q = 0; q < n; q++) { if (pl[q] >= 0 && w.pl[q] !== pl[q]) return false; if (C.items && it[q] >= 0 && w.it[q] !== it[q]) return false; }
              return clues.every(function (c) { return holds(c, w); });
            });
          }
          function settled(ws) { // an empty slot that every fitting world agrees on
            for (var q = 0; q < n; q++) {
              if (pl[q] < 0 && ws.length && ws.every(function (w) { return w.pl[q] === ws[0].pl[q]; })) return { s: q, kind: 'place' };
              if (C.items && it[q] < 0 && ws.length && ws.every(function (w) { return w.it[q] === ws[0].it[q]; })) return { s: q, kind: 'item' };
            }
            return null;
          }
          for (var k = 0; k < C.clues.length; k++) {
            var one = settled(fitting([C.clues[k]]));
            if (one) {
              tipS = one.s; tipClue = k;
              ctx.setStatus('רמז: מהרמז המסומן אפשר לדעת ' + (one.kind === 'place' ? 'איפה ' + was(one.s) : 'מה ' + held(one.s)) + ' ' + S(one.s) + '. נסו!');
              draw(); return;
            }
          }
          var all = settled(fitting(C.clues));
          if (all) {
            tipS = all.s; tipClue = -1;
            ctx.setStatus('רמז: אם מחברים כמה רמזים, אפשר לדעת ' + (all.kind === 'place' ? 'איפה ' + was(all.s) : 'מה ' + held(all.s)) + ' ' + S(all.s) + '. נסו מה מתאים לכולם');
            draw(); return;
          }
          ctx.setStatus('רמז: הכול כבר כתוב. לחצו "בדיקה"');
        }
      }

      nextRound();
      return function cleanup() { root.classList.remove('g-split'); };
    }
  });
})();
