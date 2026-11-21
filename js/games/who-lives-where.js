/* מי גר איפה? — a small logic-grid puzzle: a street of numbered, coloured houses; read the clues and put every
   person (and at higher levels every pet) in the right house (logic, deduction). The generator checks every
   possible street, so each puzzle has exactly one answer, and clues that add nothing are left out. Untimed. */
(function () {
  'use strict';

  var PEOPLE = [
    { name: 'רינה', f: true, e: '👩' }, { name: 'משה', f: false, e: '👴' }, { name: 'דוד', f: false, e: '👨' },
    { name: 'שרה', f: true, e: '👵' }, { name: 'יוסי', f: false, e: '🧔' }, { name: 'חנה', f: true, e: '👧' },
    { name: 'רות', f: true, e: '👩‍🦰' }, { name: 'אבי', f: false, e: '👦' }
  ];
  var PETS = [
    { name: 'כלב', e: '🐕' }, { name: 'חתול', e: '🐈' }, { name: 'תוכי', e: '🦜' }, { name: 'דג', e: '🐟' }, { name: 'ארנב', e: '🐇' }
  ];
  var COLORS = [
    { c: 'red', name: 'האדום' }, { c: 'blue', name: 'הכחול' }, { c: 'yellow', name: 'הצהוב' },
    { c: 'green', name: 'הירוק' }, { c: 'purple', name: 'הסגול' }
  ];

  /* Level 1–50: n houses, pets (second thing to place), kinds of clues, colour = clues may name a house by its
     colour, maxAt = most clues that tell a place straight out, maxClues = what fits on the screen. */
  function spec(level) {
    var L = level, n, pets;
    if (L <= 6) { n = 3; pets = false; }
    else if (L <= 14) { n = 4; pets = false; }
    else if (L <= 22) { n = 3; pets = true; }
    else if (L <= 30) { n = 5; pets = false; }
    else if (L <= 38) { n = 4; pets = true; }
    else { n = 5; pets = true; }
    var kinds = ['at', 'not', 'next'];
    if (pets) kinds.push('with');
    if (L >= 4) kinds.push('end', 'notnext');
    if (L >= 9) kinds.push('more');
    if (L >= 17) kinds.push('plus1', 'notend');
    if (pets && L >= 17) kinds.push('notwith');
    // inside every band the clues get fewer straight answers as the level rises
    var band = L <= 6 ? (L - 1) / 5 : L <= 14 ? (L - 7) / 7 : L <= 22 ? (L - 15) / 7 : L <= 30 ? (L - 23) / 7 : L <= 38 ? (L - 31) / 7 : (L - 39) / 11;
    var maxAt = Math.max(0, Math.round((n - 1) * (1 - band) - (L >= 30 ? 1 : 0)));
    if (L <= 3) maxAt = n - 1;
    var maxClues = n === 3 ? (pets ? 7 : 5) : n === 4 ? (pets ? 8 : 6) : (pets ? 8 : 7);
    return { n: n, pets: pets, kinds: kinds, colour: L >= 10, maxAt: maxAt, maxClues: maxClues };
  }

  function perms(n) {
    var out = [];
    (function rec(a, used) {
      if (a.length === n) { out.push(a.slice()); return; }
      for (var i = 0; i < n; i++) if (!used[i]) { used[i] = true; a.push(i); rec(a, used); a.pop(); used[i] = false; }
    })([], []);
    return out;
  }

  /* Every possible street: pos[0..n-1] = house of each person, pos[n..2n-1] = house of each pet. */
  function allStreets(n, pets) {
    var P = perms(n), out = [];
    P.forEach(function (p) {
      if (!pets) out.push(p);
      else P.forEach(function (q) { out.push(p.concat(q)); });
    });
    return out;
  }

  // entity e: 0..n-1 people, n..2n-1 pets
  function holds(cl, pos, n) {
    var a = pos[cl.x], b = cl.y !== undefined ? pos[cl.y] : 0;
    switch (cl.t) {
      case 'at': return a === cl.h;
      case 'not': return a !== cl.h;
      case 'next': return Math.abs(a - b) === 1;
      case 'notnext': return Math.abs(a - b) > 1;
      case 'with': return a === b;
      case 'notwith': return a !== b;
      case 'more': return a > b;
      case 'plus1': return a === b + 1;
      case 'end': return a === 0 || a === n - 1;
      case 'notend': return a !== 0 && a !== n - 1;
    }
    return false;
  }

  // all true clues about the solution
  function cluePool(sol, sp, rnd) {
    var n = sp.n, E = sp.pets ? 2 * n : n, pool = [], x, y, h;
    function add(c) { if (sp.kinds.indexOf(c.t) !== -1 && holds(c, sol, n)) pool.push(c); }
    for (x = 0; x < E; x++) {
      for (h = 0; h < n; h++) {
        add({ t: 'at', x: x, h: h, col: sp.colour && rnd.randInt(0, 1) === 1 });
        add({ t: 'not', x: x, h: h, col: sp.colour && rnd.randInt(0, 2) === 0 });
      }
      add({ t: 'end', x: x }); add({ t: 'notend', x: x });
      for (y = 0; y < E; y++) {
        if (y === x) continue;
        var cross = (x < n) !== (y < n);
        if (y > x) { add({ t: 'next', x: x, y: y }); if (!cross) add({ t: 'notnext', x: x, y: y }); }
        if (cross && x < n) { add({ t: 'with', x: x, y: y }); add({ t: 'notwith', x: x, y: y }); }
        add({ t: 'more', x: x, y: y }); add({ t: 'plus1', x: x, y: y });
      }
    }
    return pool;
  }

  function makePuzzle(sp, rnd) {
    var n = sp.n, streets = allStreets(n, sp.pets), S = streets.length, best = null, t0 = Date.now();
    for (var attempt = 0; attempt < 40; attempt++) {
      var sol = streets[rnd.randInt(0, S - 1)];
      var pool = rnd.shuffle(cluePool(sol, sp, rnd));
      // truth of each clue on every street, worked out only when the clue is looked at
      var masks = [];
      var maskOf = function (k) {
        if (!masks[k]) {
          var m = new Uint8Array(S), c = pool[k];
          for (var i = 0; i < S; i++) m[i] = holds(c, streets[i], n) ? 1 : 0;
          masks[k] = m;
        }
        return masks[k];
      };
      var alive = new Uint8Array(S).fill(1), count = S, chosen = [], nAt = 0;
      for (var k = 0; k < pool.length && count > 1; k++) {
        var c = pool[k];
        if (c.t === 'at' && nAt >= sp.maxAt) continue;
        var cut = 0, mk = maskOf(k);
        for (var i = 0; i < S; i++) if (alive[i] && !mk[i]) cut++;
        if (!cut) continue;
        // a clue that settles almost everything at once is too easy: skip it while others remain
        if (count - cut === 1 && chosen.length < 2 && k < pool.length - 1) continue;
        for (i = 0; i < S; i++) if (!mk[i]) alive[i] = 0;
        count -= cut; chosen.push(k);
        if (c.t === 'at') nAt++;
      }
      if (count !== 1) continue;
      // drop clues that the others already imply
      var order = rnd.shuffle(chosen.slice());
      order.forEach(function (k) {
        var rest = chosen.filter(function (j) { return j !== k; });
        if (uniqueWith(rest)) chosen = rest;
      });
      if (chosen.length > sp.maxClues) continue;
      var clues = chosen.map(function (k) { return pool[k]; });
      var P = { n: n, pets: sp.pets, sol: sol, clues: rnd.shuffle(clues) };
      if (!best || clues.length < best.clues.length) best = P;
      if (attempt >= 3 || (best && Date.now() - t0 > 500)) break;
    }
    return best;

    function uniqueWith(list) {
      var c = 0;
      for (var i = 0; i < S; i++) {
        var ok = true;
        for (var j = 0; j < list.length && ok; j++) if (!masks[list[j]][i]) ok = false;
        if (ok && ++c > 1) return false;
      }
      return c === 1;
    }
  }

  // how many streets fit the clues (for tests)
  function countSolutions(P) {
    return allStreets(P.n, P.pets).filter(function (s) {
      return P.clues.every(function (c) { return holds(c, s, P.n); });
    }).length;
  }

  /* Puzzle cast: which people and pets (by index into PEOPLE/PETS) play entity 0..n-1 / n..2n-1.
     "אחרי" = a house with a bigger number, "מיד אחרי" = the next house, "ליד" = the house right next to it. */
  function clueText(c, P, cast) {
    var n = P.n;
    function ent(x) { return x < n ? PEOPLE[cast.people[x]] : PETS[cast.pets[x - n]]; }
    function subj(x) { return x < n ? ent(x).name : 'ה' + ent(x).name; }
    function verb(x) { return x < n && ent(x).f ? 'גרה' : 'גר'; }
    function house(h, col) { return col ? 'בבית ' + COLORS[cast.colors[h]].name : 'בבית מספר ' + (h + 1); }
    var X = subj(c.x), V = verb(c.x), Y = c.y !== undefined ? subj(c.y) : '';
    var flip = c.y !== undefined && (c.x + c.y) % 2 === 1; // say it the other way round: "Y לפני X"
    switch (c.t) {
      case 'at': return X + ' ' + V + ' ' + house(c.h, c.col);
      case 'not': return X + ' לא ' + V + ' ' + house(c.h, c.col);
      case 'next': return X + ' ' + V + ' ליד ' + Y;
      case 'notnext': return X + ' לא ' + V + ' ליד ' + Y;
      case 'with': return 'ל' + X + ' יש ' + ent(c.y).name;
      case 'notwith': return 'ל' + X + ' אין ' + ent(c.y).name;
      case 'more': return flip ? Y + ' ' + verb(c.y) + ' לפני ' + X : X + ' ' + V + ' אחרי ' + Y;
      case 'plus1': return flip ? Y + ' ' + verb(c.y) + ' מיד לפני ' + X : X + ' ' + V + ' מיד אחרי ' + Y;
      case 'end': return X + ' ' + V + ' בקצה הרחוב';
      case 'notend': return X + ' לא ' + V + ' בקצה הרחוב';
    }
    return '';
  }

  var css = [
    '.wl-street{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:.35rem;width:100%;max-width:28rem;direction:rtl;}',
    '.wl-house{display:flex;flex-direction:column;align-items:stretch;min-width:0;}',
    '.wl-roof{height:1.7rem;clip-path:polygon(50% 0,100% 100%,0 100%);background:var(--hc);display:flex;align-items:flex-end;justify-content:center;',
    'color:#fff;font-weight:900;font-size:1.15rem;line-height:1;padding-bottom:.15rem;}',
    '.wl-house.c-yellow .wl-roof{color:var(--c-on-yellow);}',
    '.wl-body{border:3px solid var(--hc);border-top:0;background:var(--surface);border-radius:0 0 8px 8px;display:flex;flex-direction:column;',
    'gap:.2rem;padding:.2rem .15rem;}',
    '.wl-slot{display:flex;flex-direction:column;align-items:center;justify-content:center;height:3rem;overflow:hidden;width:100%;padding:0;border-radius:6px;line-height:1.05;',
    'border:3px solid transparent;background:var(--surface-2);color:var(--ink);font:inherit;cursor:pointer;}',
    '.wl-slot.is-empty{border:3px dashed var(--ink-soft);font-size:1.5rem;font-weight:900;color:var(--ink-soft);}',
    '.wl-slot .e{font-size:1.35rem;line-height:1.1;}',
    '.wl-slot .nm{font-size:1.05rem;font-weight:800;white-space:nowrap;}',
    '.wl-slot.is-open{border:3px solid var(--c-blue);background:var(--c-blue-soft);}',
    '.wl-slot.is-wrong{background:var(--c-red-soft);border:3px solid var(--c-red);}',
    '.wl-slot.is-right{background:var(--good-soft);}',
    '.wl-house.c-red{--hc:var(--c-red);} .wl-house.c-blue{--hc:var(--c-blue);} .wl-house.c-yellow{--hc:var(--c-yellow);}',
    '.wl-house.c-green{--hc:var(--c-green);} .wl-house.c-purple{--hc:var(--c-purple);}',
    '.wl-clues{list-style:none;margin:0;padding:0;width:100%;max-width:28rem;display:flex;flex-direction:column;gap:.2rem;}',
    '.wl-clue{display:flex;gap:.45rem;align-items:center;width:100%;text-align:start;padding:.15rem .5rem;border-radius:8px;border:0;background:var(--surface-2);',
    'color:var(--ink);font:inherit;font-size:1.1rem;font-weight:700;line-height:1.25;cursor:pointer;min-height:1.75rem;}',
    '.wl-clue .ck{flex:none;width:1.4rem;height:1.4rem;border:2px solid var(--ink-soft);border-radius:4px;display:grid;place-items:center;font-size:.95rem;}',
    '.wl-clue.is-done{opacity:.55;}',
    '.wl-clue.is-done .ck{background:var(--good);border-color:var(--good);color:var(--surface);}',
    '.wl-acts .btn{min-height:3.2rem;padding-inline:1rem;}',
    /* the chooser opens over the bottom of the screen */
    '.wl-sheet{position:fixed;inset-inline:0;bottom:0;z-index:15;background:var(--surface);border-top:3px solid var(--c-blue);box-shadow:var(--shadow);',
    'padding:.8rem .8rem 1rem;display:flex;flex-direction:column;gap:.6rem;align-items:center;}',
    '.wl-sheet h3{font-family:var(--font-body);font-size:1.2rem;font-weight:800;}',
    '.wl-opts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.45rem;width:100%;max-width:26rem;}',
    '.wl-opt{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:4rem;padding:.2rem;border-radius:var(--radius-sm);',
    'border:2px solid var(--line);background:var(--surface-2);color:var(--ink);font:inherit;font-weight:800;font-size:1.1rem;cursor:pointer;line-height:1.15;}',
    '.wl-opt .e{font-size:1.7rem;}',
    '.wl-opt .w{font-size:.95rem;font-weight:700;color:var(--ink-soft);}',
    '.wl-opt.is-here{border-color:var(--c-blue);background:var(--c-blue-soft);}'
  ].join('');

  BrainGames.register({
    id: 'who-lives-where',
    name: 'מי גר איפה?',
    skill: 'logic',
    isNew: true,
    tagline: 'קראו את הרמזים וגלו מי גר בכל בית',
    benefit: 'חשיבה לוגית והסקת מסקנות',
    instructions: [
      'ברחוב יש בתים עם מספרים וצבעים. מתחת לבתים כתובים רמזים. לחצו על משבצת בבית ובחרו מי גר שם.',
      '"ליד" = בבית הצמוד. "אחרי" = בבית עם מספר גדול יותר, ו"מיד אחרי" = בבית הבא. "לפני" = מספר קטן יותר.',
      '"בקצה הרחוב" = בבית הראשון או בבית האחרון.',
      'כשכולם במקום, לחצו "בדיקה". אפשר לסמן ✓ על רמז שכבר השתמשתם בו. אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makePuzzle: makePuzzle, countSolutions: countSolutions, clueText: clueText, holds: holds, PEOPLE: PEOPLE, PETS: PETS },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = 2, round = 0, solved = 0, sheet = null;

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({ correct: solved, total: ROUNDS, note: 'פתרתם ' + solved + ' מתוך ' + ROUNDS + ' רחובות' });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        var P = null;
        for (var t = 0; t < 6 && !P; t++) P = makePuzzle(sp, ctx);
        play(P);
      }

      function play(P) {
        root.innerHTML = '';
        var n = P.n, E = P.pets ? 2 * n : n;
        var cast = {
          people: ctx.shuffle(PEOPLE.map(function (_, i) { return i; })).slice(0, n),
          pets: ctx.shuffle(PETS.map(function (_, i) { return i; })).slice(0, n),
          colors: ctx.shuffle([0, 1, 2, 3, 4]).slice(0, n)
        };
        function ent(x) { return x < n ? PEOPLE[cast.people[x]] : PETS[cast.pets[x - n]]; }
        function label(x) { return x < n ? ent(x).name : 'ה' + ent(x).name; }
        var at = [];   // at[x] = house of entity x, or -1
        for (var x = 0; x < E; x++) at.push(-1);
        var wrong = 0, hints = 0, done = false, marks = {}, showWrong = false, open = null;

        var street = el('div', { class: 'wl-street', style: { '--n': n } });
        street._wl = { sol: P.sol, n: n, clues: P.clues.length }; // read by automated tests only
        var clueList = el('ul', { class: 'wl-clues' });
        P.clues.forEach(function (c, i) {
          clueList.appendChild(el('li', null, el('button', { class: 'wl-clue', type: 'button', onclick: function () {
            marks[i] = !marks[i]; ctx.sound('tap'); render();
          } }, [el('span', { class: 'ck', 'aria-hidden': 'true' }), el('span', null, clueText(c, P, cast))])));
        });
        var checkBtn = el('button', { class: 'btn btn-primary', type: 'button', onclick: check }, 'בדיקה');
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var showBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: reveal }, 'פתרון');
        var actions = el('div', { class: 'g-actions wl-acts' }, [checkBtn, hintBtn, showBtn]);
        [street, clueList, actions].forEach(function (nd) { root.appendChild(nd); });
        var baseStatus = 'לחצו על בית ובחרו מי גר שם';
        ctx.setStatus(baseStatus);
        render();

        function who(h, pets) {
          for (var x = 0; x < E; x++) if (at[x] === h && (x >= n) === pets) return x;
          return -1;
        }
        function slot(h, pets) {
          var x = who(h, pets);
          var cls = 'wl-slot' + (x < 0 ? ' is-empty' : '');
          if (open && open.h === h && open.pets === pets) cls += ' is-open';
          if (x >= 0 && showWrong && at[x] !== P.sol[x]) cls += ' is-wrong';
          if (x >= 0 && done) cls += ' is-right';
          var kids = x < 0 ? (pets ? '🐾' : '?') : [el('span', { class: 'e', 'aria-hidden': 'true' }, ent(x).e), el('span', { class: 'nm' }, ent(x).name)];
          return el('button', { class: cls, type: 'button', disabled: done ? 'disabled' : null,
            'aria-label': 'בית ' + (h + 1) + (pets ? ', חיה' : ', אדם') + (x >= 0 ? ': ' + ent(x).name : ''),
            onclick: function () { openSheet(h, pets); } }, kids);
        }
        function render() {
          street.innerHTML = '';
          for (var h = 0; h < n; h++) {
            street.appendChild(el('div', { class: 'wl-house c-' + COLORS[cast.colors[h]].c }, [
              el('span', { class: 'wl-roof' }, String(h + 1)),
              el('div', { class: 'wl-body' }, [slot(h, false), P.pets ? slot(h, true) : null])
            ]));
          }
          [].forEach.call(clueList.querySelectorAll('.wl-clue'), function (b, i) {
            b.classList.toggle('is-done', !!marks[i]);
            b.firstChild.textContent = marks[i] ? '✓' : '';
          });
          checkBtn.disabled = hintBtn.disabled = showBtn.disabled = done;
        }
        function closeSheet() { if (sheet) sheet.remove(); sheet = null; open = null; }
        function openSheet(h, pets) {
          if (done) return;
          ctx.sound('tap');
          closeSheet();
          open = { h: h, pets: pets }; showWrong = false;
          var opts = [];
          for (var x = (pets ? n : 0); x < (pets ? E : n); x++) (function (x) {
            var here = at[x] === h;
            opts.push(el('button', { class: 'wl-opt' + (here ? ' is-here' : ''), type: 'button', onclick: function () { place(x, h); } }, [
              el('span', { class: 'e', 'aria-hidden': 'true' }, ent(x).e), el('span', null, ent(x).name),
              at[x] >= 0 && !here ? el('span', { class: 'w' }, 'בבית ' + (at[x] + 1)) : null
            ]));
          })(x);
          if (who(h, pets) >= 0) opts.push(el('button', { class: 'wl-opt', type: 'button', onclick: function () { place(-1, h); } }, [el('span', { class: 'e', 'aria-hidden': 'true' }, '✕'), 'לרוקן']));
          sheet = el('div', { class: 'wl-sheet', role: 'dialog' }, [
            el('h3', null, (pets ? 'איזו חיה גרה בבית ' : 'מי גר בבית ') + (h + 1) + '?'),
            el('div', { class: 'wl-opts' }, opts),
            el('button', { class: 'btn btn-quiet', type: 'button', onclick: function () { closeSheet(); render(); } }, 'סגירה')
          ]);
          root.appendChild(sheet);
          render();
        }
        function place(x, h) {
          ctx.sound('tap');
          var pets = open ? open.pets : x >= n;
          var old = who(h, pets);
          if (x < 0) { if (old >= 0) at[old] = -1; }
          else {
            if (old >= 0 && old !== x) at[old] = at[x]; // swap: whoever lived here moves to x's old house (or out)
            at[x] = h;
          }
          closeSheet();
          var left = at.filter(function (v) { return v < 0; }).length;
          ctx.setStatus(left ? baseStatus : 'כולם במקום? לחצו "בדיקה"');
          render();
        }
        function check() {
          if (done) return;
          closeSheet();
          if (at.some(function (v) { return v < 0; })) { ctx.setStatus('קודם שימו את כולם בבתים'); render(); return; }
          var bad = at.filter(function (v, x) { return v !== P.sol[x]; }).length;
          if (!bad) { win(); return; }
          wrong++; showWrong = true;
          render();
          ctx.setStatus(bad === 1 ? 'אחד לא במקום. בדקו את האדום' : bad + ' לא במקום. בדקו את האדומים');
          ctx.sound('bad');
        }
        function hint() {
          if (done) return;
          closeSheet();
          var xs = [];
          for (var x = 0; x < E; x++) if (at[x] !== P.sol[x]) xs.push(x);
          if (!xs.length) return;
          hints++;
          var ppl = xs.filter(function (v) { return v < n; });
          var x2 = ctx.pick(ppl.length ? ppl : xs);
          var h = P.sol[x2], old = who(h, x2 >= n);
          if (old >= 0) at[old] = -1;
          at[x2] = h; showWrong = false;
          ctx.setStatus('רמז: ' + label(x2) + ' ' + (x2 < n && ent(x2).f ? 'גרה' : 'גר') + ' בבית מספר ' + (h + 1));
          render();
          if (at.every(function (v, i) { return v === P.sol[i]; })) win();
        }
        function reveal() {
          if (done) return;
          closeSheet();
          at = P.sol.slice(); hints = 99; done = true; showWrong = false;
          render();
          ctx.setStatus('זה הפתרון');
          ctx.feedback(false, 'הנה הפתרון').then(nextBtn);
        }
        function win() {
          done = true; showWrong = false;
          var ok = hints + wrong <= 1;
          if (ok) solved++;
          render();
          ctx.setStatus(ok ? 'מצוין! כולם בבית הנכון' : 'כולם בבית הנכון, בעזרת רמזים');
          ctx.feedback(ok, ok ? undefined : 'פתרתם, עם קצת עזרה').then(nextBtn);
        }
        function nextBtn() {
          actions.innerHTML = '';
          var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { next.disabled = true; nextRound(); } },
            round >= ROUNDS ? 'לסיכום' : 'לרחוב הבא');
          actions.appendChild(next);
        }
      }

      nextRound();
      return function cleanup() { if (sheet) sheet.remove(); };
    }
  });
})();
