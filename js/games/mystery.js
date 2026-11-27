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
    { e: '🎂', who: 'מי שלקח את העוגה של סבתא' }, { e: '🪴', who: 'מי ששבר את העציץ של השכנה' },
    { e: '📰', who: 'מי שלקח את העיתון של סבא' }, { e: '🚲', who: 'מי שלקח את האופניים של הנכד' },
    { e: '🍪', who: 'מי שלקח את העוגיות' }, { e: '🎈', who: 'מי שהוריד את הבלונים' },
    { e: '🐈', who: 'מי שפתח את השער לחתול' }, { e: '🌷', who: 'מי שקטף את הפרחים בגינה' }
  ];

  /* Level 1–50: n = suspects (and places, and things), items = things too, types = kinds of clue,
     noDirect = no clue that names the answer straight away. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    var full = L >= 13; // from 13 the clues settle everything (who was where, with what), not only the answer
    var s = spec0(L); s.full = full; return s;
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
    var q = !sp.items ? 'who' : rnd.pick(['who', 'item', 'place']);
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
    if (clues.length < 2 || clues.length > (n === 3 ? 6 : 8)) return null; // 8 clues at most: they must fit a phone
    return { n: n, items: sp.items, sol: sol, culprit: c, q: q, fact: fact, answer: ans, clues: rnd.shuffle(clues), worlds: worlds };
  }

  var css = [
    '.my-case{display:flex;align-items:center;gap:.5rem;width:100%;max-width:30rem;background:var(--c-yellow-soft);border-radius:var(--radius-sm);padding:.2rem .55rem;}',
    '.my-case .e{font-size:1.7rem;line-height:1;flex:none;}',
    '.my-case p{margin:0;font-weight:800;font-size:.95rem;line-height:1.25;}',

    '.my-main{display:flex;flex-direction:column;align-items:center;gap:.4rem;width:100%;}',
    '.my-clues{list-style:none;margin:0;padding:0;width:100%;max-width:30rem;display:flex;flex-direction:column;gap:.1rem;}',
    '.my-clue{background:var(--surface-2);border-radius:8px;padding:.05rem .5rem;font-weight:700;font-size:.97rem;line-height:1.3;}',
    '.play-board.g-split:has(.my-book){gap:.55rem;}',
    '.my-clue.is-tip{background:var(--c-purple-soft);box-shadow:inset 0 0 0 3px var(--c-purple);}',
    /* the switch between places and things sits in the empty top corner of the notebook */
    '.my-switch{border:2px solid var(--c-blue);border-radius:8px;background:var(--c-blue-soft);color:var(--ink);font:inherit;font-size:1.1rem;line-height:1;',
    'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:.1rem 0;cursor:pointer;}',
    '.my-switch small{font-size:.62rem;font-weight:800;white-space:nowrap;}',
    '.my-book{display:grid;grid-template-columns:3.4rem repeat(var(--n),2.35rem);gap:3px;direction:rtl;}',
    '.my-h{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;font-size:1.35rem;line-height:1.05;text-align:center;}',
    '.my-h small{font-size:.66rem;font-weight:800;color:var(--ink-soft);white-space:nowrap;}',
    '.my-row{display:flex;flex-direction:column;align-items:center;justify-content:center;font-size:1.3rem;line-height:1;}',
    '.my-row{flex-direction:row;gap:.15rem;font-size:1.1rem;}.my-row small{font-size:.8rem;font-weight:800;}',
    '.my-cell{height:2.3rem;border:2px solid var(--line);border-radius:6px;background:var(--surface);color:var(--ink);font:inherit;font-size:1.4rem;font-weight:900;',
    'cursor:pointer;padding:0;line-height:1;}',
    '.my-cell.is-x{color:var(--c-red);}.my-cell.is-x.is-auto{color:var(--ink-soft);opacity:.6;}',
    '.my-cell.is-v{color:var(--c-green);background:var(--c-green-soft);}',
    '.my-cell.is-tip{box-shadow:0 0 0 3px var(--c-purple);}',
    '.my-cell.is-bad{box-shadow:0 0 0 3px var(--c-red);}',
    '.my-acts{flex-wrap:nowrap;gap:.3rem;width:100%;max-width:30rem;}.my-acts .btn{flex:1 1 auto;min-width:0;min-height:2.9rem;padding-inline:.4rem;font-size:.95rem;white-space:nowrap;}',
    '.my-sheet{position:fixed;inset-inline:0;bottom:0;z-index:15;background:var(--surface);border-top:3px solid var(--c-blue);box-shadow:var(--shadow);',
    'padding:.8rem .8rem 1rem;display:flex;flex-direction:column;gap:.6rem;align-items:center;}',
    '.my-sheet h3{font-family:var(--font-body);font-size:1.2rem;font-weight:800;margin:0;}',
    '.my-opts{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.45rem;width:100%;max-width:26rem;}',
    '.my-opt{display:flex;align-items:center;justify-content:center;gap:.4rem;min-height:3.6rem;border-radius:var(--radius-sm);border:2px solid var(--line);',
    'background:var(--surface-2);color:var(--ink);font:inherit;font-weight:800;font-size:1.15rem;cursor:pointer;}',
    '.my-opt .e{font-size:1.7rem;}',
    '@media (min-width:900px){.my-main{max-width:30rem;}.g-split .my-book{grid-template-columns:4rem repeat(var(--n),3.4rem);}.g-split .my-cell{height:3.4rem;}}'
  ].join('');

  BrainGames.register({
    id: 'mystery',
    name: 'תעלומה בשכונה',
    skill: 'logic',
    isNew: true,
    tagline: 'קראו את הרמזים ופתרו את התעלומה',
    benefit: 'חשיבה לוגית והסקת מסקנות',
    instructions: [
      'משהו קרה בשכונה (העוגה נעלמה, העציץ נשבר…). כל חשוד היה במקום אחר (ובהמשך גם החזיק חפץ אחר). דבר אחד ידוע על מי שעשה את זה.',
      'קראו את הרמזים וגלו מי עשה את זה, או באיזה חפץ השתמש, או איפה זה קרה.',
      'במחברת הבלש לחצו על משבצת: פעם אחת ✗ (לא), פעם שנייה ✓ (כן). ✓ מסמן ✗ בשאר השורה והטור.',
      'כשאתם יודעים, לחצו "פתרתי!". יש "רמז", "↶ בטלו" ו"נקו". אין שעון.'
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
        var factText = C.fact.t === 'place' ? cs.who + ' היה ' + plc[C.fact.v].in + '.' : cs.who + ' החזיק את ' + IT(C.fact.v) + '.';
        var QTEXT = { who: 'מי זה היה?', item: 'איזה חפץ הוא החזיק?', place: 'איפה הוא היה?' };

        // the notebook: marks.place[s][j] / marks.item[s][j] = 0 empty, 1 ✗, 2 ✓; auto = ✗ put by a ✓
        function grid() { return Array.apply(null, { length: n }).map(function () { return Array.apply(null, { length: n }).map(function () { return 0; }); }); }
        var marks = { place: grid(), item: grid() }, auto = { place: grid(), item: grid() };
        var tab = 'place', hints = 0, done = false, past = [], tip = null;

        var caseEl = el('div', { class: 'my-case' }, [el('span', { class: 'e', 'aria-hidden': 'true' }, cs.e),
          el('p', null, factText)]);
        var ASK = QTEXT[C.q];
        var clueEls = C.clues.map(function (c) { return el('li', { class: 'my-clue' }, clueText(c)); });
        var clueList = el('ul', { class: 'my-clues' }, clueEls);
        var book = el('div', { class: 'my-book', style: { '--n': n }, 'aria-label': 'מחברת הבלש' });
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var undoBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: undo }, '↶ בטלו');
        var clearBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: clearAll }, 'נקו');
        var solveBtn = el('button', { class: 'btn btn-primary', type: 'button', onclick: openAnswer }, 'פתרתי!');
        var acts = el('div', { class: 'g-actions my-acts' }, [solveBtn, hintBtn, undoBtn, clearBtn]);
        root.classList.add('g-split');
        root.appendChild(el('div', { class: 'my-main' }, [caseEl, clueList]));
        root.appendChild(el('div', { class: 'g-side' }, [book, acts]));
        ctx.setStatus(ASK);
        var sheet = null;
        draw();

        function setTab(t) { tab = t; ctx.sound('tap'); draw(); }
        function draw() {
          book.innerHTML = '';
          var cols = tab === 'place' ? plc : its;
          // the top corner: with things too, a switch that shows the other page of the notebook
          book.appendChild(!C.items ? el('span') : el('button', { class: 'my-switch', type: 'button', disabled: done,
            'aria-label': tab === 'place' ? 'לעבור לחפצים' : 'לעבור למקומות', onclick: function () { setTab(tab === 'place' ? 'item' : 'place'); } },
            [tab === 'place' ? '🧰' : '📍', el('small', null, tab === 'place' ? 'לחפצים' : 'למקומות')]));
          cols.forEach(function (x) { book.appendChild(el('span', { class: 'my-h' }, [x.e, el('small', null, x.name)])); });
          for (var s = 0; s < n; s++) {
            book.appendChild(el('span', { class: 'my-row' }, [ppl[s].e, el('small', null, ppl[s].name)]));
            for (var j = 0; j < n; j++) (function (s, j) {
              var m = marks[tab][s][j];
              var cls = 'my-cell' + (m === 1 ? ' is-x' + (auto[tab][s][j] ? ' is-auto' : '') : m === 2 ? ' is-v' : '') +
                (tip && tip.tab === tab && tip.s === s && tip.j === j ? (tip.bad ? ' is-bad' : ' is-tip') : '');
              book.appendChild(el('button', { class: cls, type: 'button', disabled: done,
                'aria-label': ppl[s].name + ', ' + cols[j].name + (m === 1 ? ': לא' : m === 2 ? ': כן' : ''),
                onclick: function () { tapCell(s, j); } }, m === 1 ? '✗' : m === 2 ? '✓' : ''));
            })(s, j);
          }
          var any = ['place', 'item'].some(function (t) { return marks[t].some(function (r) { return r.some(Boolean); }); });
          undoBtn.disabled = done || !past.length;
          clearBtn.disabled = done || !any;
          hintBtn.disabled = solveBtn.disabled = done;
        }
        function snapshot() { past.push(JSON.stringify({ marks: marks, auto: auto })); }
        function tapCell(s, j) {
          if (done) return;
          ctx.sound('tap');
          snapshot();
          if (tip) ctx.setStatus(ASK);
          clearTip();
          var m = marks[tab];
          m[s][j] = (m[s][j] + 1) % 3;
          auto[tab][s][j] = 0;
          if (m[s][j] === 2) { // ✓: the rest of the row and the column cannot be
            for (var k = 0; k < n; k++) {
              if (k !== j && !m[s][k]) { m[s][k] = 1; auto[tab][s][k] = 1; }
              if (k !== s && !m[k][j]) { m[k][j] = 1; auto[tab][k][j] = 1; }
            }
          }
          draw();
        }
        function undo() {
          if (done || !past.length) return;
          ctx.sound('tap'); clearTip();
          var p = JSON.parse(past.pop()); marks = p.marks; auto = p.auto;
          ctx.setStatus('הצעד האחרון בוטל');
          draw();
        }
        function clearAll() {
          if (done) return;
          ctx.sound('tap'); clearTip(); snapshot();
          marks = { place: grid(), item: grid() }; auto = { place: grid(), item: grid() };
          ctx.setStatus('המחברת נוקתה (אפשר "בטלו")');
          draw();
        }
        function clearTip() { tip = null; clueEls.forEach(function (x) { x.classList.remove('is-tip'); }); }

        /* ---------- hints that teach one step: never the answer itself ---------- */
        function truth(t, s, j) { return (t === 'place' ? C.sol.pl[s] : C.sol.it[s]) === j; }
        // the worlds that fit some clues and the right marks of the notebook
        function fitting(clues) {
          return C.worlds.filter(function (w) {
            if (!clues.every(function (c) { return holds(c, w); })) return false;
            for (var s = 0; s < n; s++) for (var j = 0; j < n; j++) {
              var mp = marks.place[s][j], mi = marks.item[s][j];
              if (mp && (mp === 2) === truth('place', s, j) && (mp === 2) !== (w.pl[s] === j)) return false;
              if (C.items && mi && (mi === 2) === truth('item', s, j) && (mi === 2) !== (w.it[s] === j)) return false;
            }
            return true;
          });
        }
        function sureCells(ws) { // cells every fitting world agrees on, and not marked right yet
          var out = [];
          (C.items ? ['place', 'item'] : ['place']).forEach(function (t) {
            for (var s = 0; s < n; s++) for (var j = 0; j < n; j++) {
              var m = marks[t][s][j];
              if (m && (m === 2) === truth(t, s, j)) continue;
              var v = ws.length ? (t === 'place' ? ws[0].pl[s] === j : ws[0].it[s] === j) : null;
              if (ws.length && ws.every(function (w) { return (t === 'place' ? w.pl[s] === j : w.it[s] === j) === v; })) out.push({ t: t, s: s, j: j, v: v });
            }
          });
          return out;
        }
        function hint() {
          if (done) return;
          clearTip();
          // a wrong mark first: say which, not what is right
          var kinds = C.items ? ['place', 'item'] : ['place'];
          for (var ti = 0; ti < kinds.length; ti++) {
            var t = kinds[ti];
            for (var s = 0; s < n; s++) for (var j = 0; j < n; j++) {
              var m = marks[t][s][j];
              if (m && (m === 2) !== truth(t, s, j)) {
                hints++;
                tab = t; tip = { tab: t, s: s, j: j, bad: true };
                ctx.setStatus('רמז: הסימון במשבצת האדומה לא נכון. קראו שוב את הרמזים על ' + S(s));
                draw(); return;
              }
            }
          }
          // one step that follows from one clue (with what is already marked); else from all the clues together
          // what a clue says in so many words ("דוד לא היה בגינה") is a weaker hint than what follows from it
          function literal(c, ci) {
            var cl = C.clues[ci];
            return (cl.t === 'spN' && c.t === 'place' && !c.v && cl.s === c.s && cl.p === c.j) ||
              (cl.t === 'spY' && c.t === 'place' && c.v && cl.s === c.s && cl.p === c.j) ||
              (cl.t === 'siN' && c.t === 'item' && !c.v && cl.s === c.s && cl.i === c.j) ||
              (cl.t === 'siY' && c.t === 'item' && c.v && cl.s === c.s && cl.i === c.j);
          }
          var firstLiteral = null;
          for (var k = 0; k < C.clues.length; k++) {
            var sure = sureCells(fitting([C.clues[k]]));
            var deduced = sure.filter(function (c) { return !literal(c, k); });
            if (deduced.length) { give(deduced[0], k); return; }
            if (sure.length && !firstLiteral) firstLiteral = { c: sure[0], k: k };
          }
          var both = sureCells(fitting(C.clues));
          if (both.length && !firstLiteral) { give(both[0], -1); return; }
          if (firstLiteral) { give(firstLiteral.c, firstLiteral.k); return; }
          ctx.setStatus('רמז: במחברת כבר יש כל מה שצריך. מי ' + (C.fact.t === 'place' ? 'היה ' + plc[C.fact.v].in : 'החזיק את ' + IT(C.fact.v)) + '?');
        }
        function give(c, ci) {
          hints++;
          tab = c.t; tip = { tab: c.t, s: c.s, j: c.j };
          if (ci >= 0) clueEls[ci].classList.add('is-tip');
          var what = c.t === 'place' ? (c.v ? was(c.s) + ' ' : 'לא ' + was(c.s) + ' ') + plc[c.j].in : (c.v ? held(c.s) + ' את ' : 'לא ' + held(c.s) + ' את ') + IT(c.j);
          ctx.setStatus('רמז: ' + (ci >= 0 ? 'מהרמז המסומן' : 'משני רמזים יחד') + ' אפשר לדעת ש' + S(c.s) + ' ' + what + '. סמנו ' + (c.v ? '✓' : '✗') + ' במשבצת המסומנת');
          draw();
        }

        /* ---------- the answer ---------- */
        function closeSheet() { if (sheet) sheet.remove(); sheet = null; }
        function openAnswer() {
          if (done) return;
          ctx.sound('tap');
          closeSheet();
          var list = C.q === 'who' ? ppl : C.q === 'item' ? its : plc;
          sheet = el('div', { class: 'my-sheet', role: 'dialog' }, [
            el('h3', null, QTEXT[C.q]),
            el('div', { class: 'my-opts' }, list.map(function (x, i) {
              return el('button', { class: 'my-opt', type: 'button', onclick: function () { answer(i); } }, [el('span', { class: 'e', 'aria-hidden': 'true' }, x.e), x.name]);
            })),
            el('button', { class: 'btn btn-quiet', type: 'button', onclick: closeSheet }, 'עוד לא, סגירה')
          ]);
          root.appendChild(sheet);
        }
        function answer(i) {
          closeSheet();
          done = true; clearTip();
          var ok = i === C.answer;
          if (ok && hints <= 2) good++;
          // the whole solution goes into the notebook
          for (var s = 0; s < n; s++) for (var j = 0; j < n; j++) {
            marks.place[s][j] = C.sol.pl[s] === j ? 2 : 1; auto.place[s][j] = 0;
            if (C.items) { marks.item[s][j] = C.sol.it[s] === j ? 2 : 1; auto.item[s][j] = 0; }
          }
          tab = C.fact.t === 'item' && C.q !== 'place' ? 'item' : C.q === 'item' ? 'item' : 'place';
          draw();
          var c = C.culprit;
          var why = C.q === 'who'
            ? S(c) + ' ' + (C.fact.t === 'place' ? was(c) + ' ' + plc[C.fact.v].in : held(c) + ' את ' + IT(C.fact.v)) + ', ולכן ' + (ppl[c].f ? 'היא' : 'הוא') + ' ' + (ppl[c].f ? 'עשתה' : 'עשה') + ' את זה'
            : C.q === 'item' ? 'מי שהיה ' + plc[C.fact.v].in + ' ' + (ppl[c].f ? 'הייתה' : 'היה') + ' ' + S(c) + ', ' + (ppl[c].f ? 'והיא החזיקה' : 'והוא החזיק') + ' את ' + IT(C.sol.it[c])
            : 'את ' + IT(C.fact.v) + ' ' + held(c) + ' ' + S(c) + ', ' + (ppl[c].f ? 'והיא הייתה ' : 'והוא היה ') + plc[C.sol.pl[c]].in;
          ctx.setStatus((ok ? 'נכון! ' : 'לא בדיוק. ') + why + '.');
          acts.hidden = true; // the case is closed: the continue button takes the place of the buttons
          ctx.feedback(ok, ok ? (hints > 2 ? 'נכון, בעזרת רמזים' : 'פתרתם את התעלומה!') : 'הפתרון במחברת').then(function () {
            return ok ? ctx.wait(2200) : ctx.next(round >= ROUNDS ? 'לסיכום' : 'לתעלומה הבאה');
          }).then(nextRound);
        }
      }

      nextRound();
      return function cleanup() { root.classList.remove('g-split'); };
    }
  });
})();
