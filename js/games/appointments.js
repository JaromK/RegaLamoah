/* יומן פגישות — plan a week: put every appointment in a free slot of the diary so that all its rules hold
   ("רק בבוקר", "לא ביום שישי", "יום אחרי הקניות", "לא יותר מפגישה אחת ביום"). Any placement that keeps every rule
   is accepted; puzzles are built from a hidden solution and checked with a solver (executive, planning). Untimed. */
(function () {
  'use strict';

  var DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
  var DAY_SHORT = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳'];
  var TIMES = ['בוקר', 'צהריים', 'ערב'];
  var AT_TIME = ['בבוקר', 'בצהריים', 'בערב'];

  var APPTS = [
    ['🦷', 'רופא שיניים', 'רופא השיניים'], ['🏦', 'בנק', 'הבנק'], ['🛒', 'קניות', 'הקניות'],
    ['👪', 'ביקור משפחה', 'ביקור המשפחה'], ['💇', 'מספרה', 'המספרה'], ['🩺', 'רופאה', 'הרופאה'],
    ['📮', 'דואר', 'הדואר'], ['🏊', 'בריכה', 'הבריכה'], ['☕', 'קפה עם חנה', 'הקפה עם חנה'], ['🎵', 'חוג שירה', 'חוג השירה'],
    ['🧪', 'בדיקת דם', 'בדיקת הדם'], ['💊', 'בית מרקחת', 'בית המרקחת']
  ].map(function (a) { return { em: a[0], name: a[1], the: a[2] }; });

  var UNARY = { onlyTime: 1, notTime: 1, notDay: 1, onDay: 1, days2: 1 };
  var STRONG = { onDay: 1, onlyTime: 1, dayAfter: 1, sameDay: 1, days2: 1 };
  var CAP = 1500;

  /* Level 1–50 → diary size, appointments, rule kinds, busy slots, "one a day" rule, how tight the puzzle must be. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    var kinds = ['onlyTime', 'notDay', 'onDay'];
    if (L >= 6) kinds.push('notTime', 'days2');
    if (L >= 13) kinds.push('dayAfter', 'sameDay');
    if (L >= 18) kinds.push('before', 'after');
    if (L >= 31) kinds.push('notSameDay');
    var oneADay = L >= 41 ? 'often' : L >= 26 ? 'sometimes' : 'never';
    return {
      days: L <= 3 ? 3 : L <= 6 ? 4 : L <= 9 ? 5 : 6,
      times: L <= 4 ? [0, 2] : [0, 1, 2],
      appts: L <= 4 ? 2 : L <= 9 ? 3 : L <= 15 ? 4 : L <= 25 ? 5 : 6,
      kinds: kinds,
      busy: L <= 12 ? 0 : L <= 16 ? 1 : L <= 20 ? 3 : L <= 25 ? 4 : L <= 30 ? 6 : L <= 40 ? 7 : 8,
      oneADay: oneADay,
      target: L <= 10 ? Infinity : L <= 20 ? 60 : L <= 30 ? 40 : L <= 40 ? 25 : 12,
      relational: L >= 13 ? (L >= 31 ? 0.6 : 0.4) : 0
    };
  }

  function slotOrder(p) { return p.d * 3 + p.t; }

  // does rule r hold for placement pos (array of {d,t})?
  function holds(r, pos) {
    var a = pos[r.a], b = r.b !== undefined ? pos[r.b] : null;
    switch (r.kind) {
      case 'onlyTime': return a.t === r.t;
      case 'notTime': return a.t !== r.t;
      case 'notDay': return a.d !== r.d;
      case 'onDay': return a.d === r.d;
      case 'days2': return a.d === r.days[0] || a.d === r.days[1];
      case 'dayAfter': return a.d === b.d + 1;
      case 'sameDay': return a.d === b.d;
      case 'notSameDay': return a.d !== b.d;
      case 'before': return slotOrder(a) < slotOrder(b);
      case 'after': return slotOrder(a) > slotOrder(b);
    }
    return true;
  }

  function ruleText(r, P) {
    var B = r.b !== undefined ? P.appts[r.b] : null;
    switch (r.kind) {
      case 'onlyTime': return 'רק ' + AT_TIME[r.t];
      case 'notTime': return 'לא ' + AT_TIME[r.t];
      case 'notDay': return 'לא ביום ' + DAY_SHORT[r.d];
      case 'onDay': return 'ביום ' + DAY_SHORT[r.d];
      case 'days2': return 'ביום ' + DAY_SHORT[Math.min(r.days[0], r.days[1])] + ' או ' + DAY_SHORT[Math.max(r.days[0], r.days[1])];
      case 'dayAfter': return 'יום אחרי ' + B.the;
      case 'sameDay': return 'באותו יום כמו ' + B.the;
      case 'notSameDay': return 'לא באותו יום כמו ' + B.the;
      case 'before': return 'לפני ' + B.the;
      case 'after': return 'אחרי ' + B.the;
    }
    return '';
  }

  // a plain reason why the rule is broken now
  function whyText(r, P, pos) {
    var a = pos[r.a], b = r.b !== undefined ? pos[r.b] : null, B = b ? P.appts[r.b] : null;
    if (r.kind === 'onlyTime' || r.kind === 'notTime') return 'עכשיו זה ' + AT_TIME[a.t];
    if (UNARY[r.kind]) return 'עכשיו זה ביום ' + DAY_SHORT[a.d];
    if (r.kind === 'dayAfter') return B.the + ' ביום ' + DAY_SHORT[b.d] + (b.d + 1 < P.days ? ', אז צריך ' + DAY_SHORT[b.d + 1] : ', ואין יום אחריו');
    if (r.kind === 'sameDay' || r.kind === 'notSameDay') return B.the + ' ביום ' + DAY_SHORT[b.d];
    return B.the + ' ביום ' + DAY_SHORT[b.d] + ' ' + AT_TIME[b.t];
  }

  /* Count placements that keep every rule (stops at cap). Slots are numbered; each two-appointment rule becomes a
     table of allowed (slot, slot) pairs, so the search only does lookups. */
  function countSolutions(P, cap) {
    var n = P.appts.length, slots = [];
    for (var d = 0; d < P.days; d++) P.times.forEach(function (t) { if (!P.busy[d + ',' + t]) slots.push({ d: d, t: t }); });
    var S = slots.length, unary = [], links = [], i;
    for (i = 0; i < n; i++) { unary.push([]); links.push([]); }
    P.rules.forEach(function (r) {
      if (UNARY[r.kind]) { unary[r.a].push(r); return; }
      var tab = new Uint8Array(S * S), pos = [];
      for (var x = 0; x < S; x++) for (var y = 0; y < S; y++) { pos[r.a] = slots[x]; pos[r.b] = slots[y]; tab[x * S + y] = holds(r, pos) ? 1 : 0; }
      links[r.a].push({ o: r.b, tab: tab, first: true });
      links[r.b].push({ o: r.a, tab: tab, first: false });
    });
    var dom = unary.map(function (us, i) {
      var out = [];
      slots.forEach(function (s, k) { var pos = []; pos[i] = s; if (us.every(function (r) { return holds(r, pos); })) out.push(k); });
      return out;
    });
    var order = dom.map(function (x, i) { return i; }).sort(function (x, y) { return dom[x].length - dom[y].length; });
    var at = new Int8Array(n).fill(-1), used = new Uint8Array(S), dayUse = new Uint8Array(P.days), count = 0, one = !!P.oneADay;
    function rec(k) {
      if (k === n) { count++; return; }
      var i = order[k], D = dom[i], L = links[i];
      for (var j = 0; j < D.length && count < cap; j++) {
        var s = D[j];
        if (used[s] || (one && dayUse[slots[s].d])) continue;
        var ok = true;
        for (var q = 0; q < L.length; q++) {
          var o = at[L[q].o];
          if (o < 0) continue;
          if (!(L[q].first ? L[q].tab[s * S + o] : L[q].tab[o * S + s])) { ok = false; break; }
        }
        if (!ok) continue;
        at[i] = s; used[s] = 1; dayUse[slots[s].d]++;
        rec(k + 1);
        at[i] = -1; used[s] = 0; dayUse[slots[s].d]--;
      }
    }
    rec(0);
    return count;
  }

  // every rule of an allowed kind that holds for the hidden solution
  function candidates(P, sol, kinds) {
    var out = [];
    function add(r) { if (kinds.indexOf(r.kind) !== -1 && holds(r, sol)) out.push(r); }
    P.appts.forEach(function (x, a) {
      P.times.forEach(function (t) { add({ kind: 'onlyTime', a: a, t: t }); if (P.times.length > 2) add({ kind: 'notTime', a: a, t: t }); });
      for (var d = 0; d < P.days; d++) {
        add({ kind: 'notDay', a: a, d: d }); add({ kind: 'onDay', a: a, d: d });
        for (var e = d + 1; e < P.days; e++) add({ kind: 'days2', a: a, days: [d, e] });
      }
      P.appts.forEach(function (y, b) {
        if (a === b) return;
        ['dayAfter', 'before', 'after'].forEach(function (k) { add({ kind: k, a: a, b: b }); });
        if (!P.oneADay) ['sameDay', 'notSameDay'].forEach(function (k) { add({ kind: k, a: a, b: b }); });
      });
    });
    return out;
  }

  /* A diary puzzle: { days, times, appts, busy: {"d,t": true}, oneADay, rules: [{kind, a, b?, ...}], solution } */
  function makePuzzle(sp, rnd) {
    var best = null;
    // decided once, so easy-to-tighten diaries are not preferred
    var oneADay = sp.oneADay === 'always' || (sp.oneADay === 'often' && rnd.randInt(0, 2) > 0) || (sp.oneADay === 'sometimes' && rnd.randInt(0, 1) === 1);
    for (var attempt = 0; attempt < 20; attempt++) {
      var nA = sp.appts;
      if (oneADay) nA = Math.min(nA, 6);
      var P = { days: sp.days, times: sp.times, appts: rnd.shuffle(APPTS).slice(0, nA), busy: {}, oneADay: oneADay, rules: [] };
      var cells = [];
      for (var d = 0; d < P.days; d++) sp.times.forEach(function (t) { cells.push({ d: d, t: t }); });
      cells = rnd.shuffle(cells);
      // the hidden solution first, then busy slots elsewhere
      var sol = [], usedDay = {};
      for (var c = 0; c < cells.length && sol.length < nA; c++) {
        if (oneADay && usedDay[cells[c].d]) continue;
        usedDay[cells[c].d] = true; sol.push(cells[c]);
      }
      if (sol.length < nA) continue;
      var rest = cells.filter(function (x) { return sol.indexOf(x) === -1; });
      for (var b = 0; b < sp.busy && b < rest.length; b++) P.busy[rest[b].d + ',' + rest[b].t] = true;

      var cand = rnd.shuffle(candidates(P, sol, sp.kinds));
      var per = P.appts.map(function () { return 0; });
      var rel = cand.filter(function (r) { return !UNARY[r.kind]; }), un = cand.filter(function (r) { return UNARY[r.kind]; });
      function sameRule(x, y) { return x.kind === y.kind && x.a === y.a && x.b === y.b; }
      // keep every card short enough for about two lines on a phone
      function cardLen(a, r) {
        var rs = P.rules.filter(function (q) { return q.a === a; }).concat(r ? [r] : []);
        return P.appts[a].name.length + 2 + rs.map(function (q) { return ruleText(q, P).length + 2; }).reduce(function (x, y) { return x + y; }, 0);
      }
      // one card may take two lines; the others must fit one line
      function fits(a, r) {
        var n = cardLen(a, r);
        if (n <= 27) return true;
        return n <= 36 && !P.appts.some(function (x, j) { return j !== a && cardLen(j) > 27; });
      }
      function addRule(r) { P.rules.push(r); per[r.a]++; }
      // one rule for every appointment (some of them relational at higher levels)
      rnd.shuffle(P.appts.map(function (x, i) { return i; })).forEach(function (a) {
        var useRel = sp.relational && rnd.randInt(0, 99) < sp.relational * 100;
        var pool = (useRel ? rel : un).filter(function (r) { return r.a === a; });
        if (!pool.length) pool = cand.filter(function (r) { return r.a === a; });
        // a relational rule must not point back at an appointment that already points here (a↔b loops read badly)
        function noLoop(r) { return r.b === undefined || !P.rules.some(function (q) { return q.a === r.b && q.b === a; }); }
        var ok = pool.filter(noLoop).filter(function (r) { return fits(a, r); });
        if (!ok.length) ok = un.filter(function (r) { return r.a === a; }).filter(function (r) { return fits(a, r); });
        if (!ok.length) ok = un.filter(function (r) { return r.a === a; });
        if (!ok.length) return;
        if (sp.target === Infinity) { addRule(ok[0]); return; }
        // tight levels: of a few allowed rules, take the one that leaves the fewest placements
        var bestR = ok[0], bestC = Infinity;
        ok.slice(0, 6).forEach(function (r) {
          P.rules.push(r);
          var k = countSolutions(P, Math.min(bestC, CAP));
          P.rules.pop();
          if (k < bestC) { bestC = k; bestR = r; }
        });
        addRule(bestR);
      });
      var count = countSolutions(P, CAP);
      // tighten: add the rule that cuts the most solutions, at most 2 rules per appointment
      var extra = 0, maxExtra = nA;
      while (count > sp.target && extra < maxExtra) {
        var pickR = null, pickC = count, strong = null;
        rnd.shuffle(cand).filter(function (r) { return per[r.a] < 2 && fits(r.a, r); }).slice(0, 60).forEach(function (r) {
          if (P.rules.some(function (q) { return sameRule(q, r) || (q.a === r.a && UNARY[q.kind] && UNARY[r.kind] && q.kind === r.kind); })) return;
          if (r.b !== undefined && P.rules.some(function (q) { return q.a === r.b && q.b === r.a; })) return;
          if (!strong && STRONG[r.kind]) strong = r;
          P.rules.push(r);
          var k = countSolutions(P, pickC);
          P.rules.pop();
          if (k < pickC) { pickC = k; pickR = r; }
        });
        // too many placements to tell the rules apart: add a strong rule and count again
        if (!pickR && count >= CAP && strong) { addRule(strong); count = countSolutions(P, CAP); extra++; continue; }
        if (!pickR) break;
        addRule(pickR); count = pickC; extra++;
      }
      P.solution = sol;
      P.count = count;
      if (count <= sp.target) return P;
      if (!best || count < best.count) best = P;
    }
    return best;
  }

  /* Check a placement: { missing: [appt index], broken: [rule], crowded: [day] } */
  function check(P, pos) {
    var missing = [], broken = [], crowded = [];
    P.appts.forEach(function (x, i) { if (!pos[i]) missing.push(i); });
    if (missing.length) return { missing: missing, broken: broken, crowded: crowded };
    P.rules.forEach(function (r) { if (!holds(r, pos)) broken.push(r); });
    if (P.oneADay) {
      var per = {};
      pos.forEach(function (p) { per[p.d] = (per[p.d] || 0) + 1; });
      Object.keys(per).forEach(function (d) { if (per[d] > 1) crowded.push(+d); });
    }
    return { missing: missing, broken: broken, crowded: crowded };
  }

  var css = [
    '.ap-wrap{display:flex;flex-direction:column;align-items:center;gap:.3rem;width:100%;}',
    '.ap-note{font-weight:800;font-size:1.05rem;background:var(--sun-soft);border:2px solid var(--sun);border-radius:var(--radius-sm);padding:.15rem .6rem;}',
    '.ap-foot{display:flex;align-items:center;gap:.5rem;width:100%;max-width:28rem;}',
    '.ap-foot .ap-note{flex:1;line-height:1.25;padding:.2rem .5rem;}',
    '.ap-foot .g-actions{flex:none;}',
    '.ap-note.is-bad{background:var(--c-red-soft);border-color:var(--c-red);}',
    '.ap-list{display:flex;flex-direction:column;gap:.2rem;width:100%;max-width:28rem;}',
    '.ap-card{display:flex;align-items:flex-start;gap:.3rem;width:100%;text-align:start;font:inherit;font-size:1.05rem;font-weight:700;line-height:1.25;',
    'color:var(--ink);background:var(--surface);border:2px solid var(--line);border-radius:var(--radius-sm);padding:.2rem .4rem;cursor:pointer;min-height:2.1rem;}',
    '.ap-card .ap-em{font-size:1.25rem;line-height:1.1;flex:none;}',
    '.ap-card b{font-weight:900;}',
    '.ap-card[aria-pressed="true"]{border-color:var(--sun);background:var(--sun-soft);box-shadow:0 0 0 2px var(--sun);}',
    '.ap-card.ap-placed{background:var(--surface-2);}',
    '.ap-card.ap-placed .ap-mark::before{content:"✓ ";color:var(--good);font-weight:900;}',
    '.ap-card.is-bad{border-color:var(--c-red);}',
    '.ap-rule.is-bad{color:var(--c-red);text-decoration:underline wavy;}',
    '.ap-grid{display:grid;gap:3px;width:100%;max-width:28rem;direction:rtl;}',
    '.ap-h{font-weight:800;text-align:center;font-size:1.05rem;}',
    '.ap-t{font-weight:800;font-size:.95rem;align-self:center;}',
    '.ap-cell{min-height:2.55rem;min-width:0;padding:0;border:2px solid var(--line);border-radius:8px;background:var(--surface-2);cursor:pointer;',
    'font-size:1.6rem;line-height:1;display:flex;align-items:center;justify-content:center;color:var(--ink);}',
    '.ap-cell.ap-full{background:var(--c-blue-soft);border-color:var(--c-blue);}',
    '.ap-cell.ap-busy{cursor:default;font-size:.95rem;font-weight:800;color:var(--ink-soft);',
    'background:repeating-linear-gradient(45deg,var(--surface-2),var(--surface-2) 5px,var(--line) 5px,var(--line) 7px);}',
    '.ap-cell.is-bad{border-color:var(--c-red);box-shadow:inset 0 0 0 2px var(--c-red);}',
    '.ap-check{min-height:3.3rem;font-size:1.2rem;padding-inline:2rem;}',
    '.ap-cell.is-good{border-color:var(--good);background:var(--good-soft);}'
  ].join('');

  BrainGames.register({
    id: 'appointments',
    name: 'יומן פגישות',
    skill: 'executive',
    isNew: true,
    maxLevel: 50,
    tagline: 'שבצו את הפגישות ביומן לפי הכללים',
    benefit: 'תכנון, חשיבה מראש ושמירה על כמה כללים יחד',
    instructions: [
      'ביומן יש ימים (א׳ עד ו׳) ושעות ביום: בוקר, צהריים וערב. ליד כל פגישה כתוב הכלל שלה, למשל "רק בבוקר".',
      'לחצו על פגישה ואז על משבצת פנויה ביומן. לחיצה על פגישה שביומן מוציאה אותה.',
      'כשכל הפגישות ביומן לחצו "בדיקה". כלל שלא מתקיים יסומן באדום עם הסבר, ואפשר לתקן.',
      'כל סידור ששומר על כל הכללים נכון. ברמות הגבוהות יש כללים כמו "יום אחרי הקניות". אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makePuzzle: makePuzzle, countSolutions: countSolutions, check: check, holds: holds, ruleText: ruleText, whyText: whyText },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = 2, round = 0, good = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) { ctx.finish({ correct: good, total: ROUNDS, note: 'סידרתם נכון ' + good + ' מתוך ' + ROUNDS + ' יומנים בבדיקה הראשונה' }); return; }
        ctx.setProgress(round, ROUNDS);
        play(makePuzzle(sp, ctx));
      }

      function play(P) {
        root._apPuzzle = P; // lets automated tests read the puzzle
        root.innerHTML = '';
        var pos = P.appts.map(function () { return null; });
        var cur = 0, checks = 0, done = false, why = {};
        var w = el('div', { class: 'ap-wrap' });
        root.appendChild(w);
        var note = P.oneADay ? el('div', { class: 'ap-note' }, '📌 לא יותר מפגישה אחת ביום') : null;
        var ruleEls = [];
        var cards = P.appts.map(function (A, i) {
          var mine = P.rules.filter(function (r) { return r.a === i; });
          var parts = [el('span', { class: 'ap-em', 'aria-hidden': 'true' }, A.em)];
          var text = el('span', null, [el('b', { class: 'ap-mark' }, A.name + (mine.length ? ': ' : ''))]);
          mine.forEach(function (r, k) {
            var s = el('span', { class: 'ap-rule' }, ruleText(r, P));
            ruleEls.push({ r: r, el: s, card: i });
            if (k) text.appendChild(document.createTextNode(', '));
            text.appendChild(s);
          });
          parts.push(text);
          return el('button', { class: 'ap-card', type: 'button', 'aria-pressed': 'false', onclick: function () { select(i); } }, parts);
        });
        w.appendChild(el('div', { class: 'ap-list' }, cards));
        var cells = {};
        var grid = el('div', { class: 'ap-grid', style: { gridTemplateColumns: '4.2rem repeat(' + P.days + ',minmax(0,1fr))' } });
        grid.appendChild(el('span'));
        for (var d = 0; d < P.days; d++) grid.appendChild(el('span', { class: 'ap-h' }, DAY_SHORT[d]));
        P.times.forEach(function (t) {
          grid.appendChild(el('span', { class: 'ap-t' }, TIMES[t]));
          for (var d2 = 0; d2 < P.days; d2++) (function (d, t) {
            var k = d + ',' + t, busy = P.busy[k];
            cells[k] = el('button', { class: 'ap-cell' + (busy ? ' ap-busy' : ''), type: 'button', 'aria-label': 'יום ' + DAYS[d] + ', ' + TIMES[t] + (busy ? ', תפוס' : ''),
              onclick: function () { tapCell(d, t); } }, busy ? 'תפוס' : '');
            grid.appendChild(cells[k]);
          })(d2, t);
        });
        w.appendChild(grid);
        var checkBtn = el('button', { class: 'btn btn-primary ap-check', type: 'button', onclick: doCheck }, 'בדיקה');
        var actions = el('div', { class: 'g-actions' }, checkBtn);
        // the "one a day" rule sits beside the button, to keep the diary on one screen
        if (note) w.appendChild(el('div', { class: 'ap-foot' }, [note, actions])); else w.appendChild(actions);
        ctx.setStatus('בחרו פגישה, ואז משבצת ביומן');
        select(0, true);

        // why a red card is wrong, in plain words
        function explain(i) { return '✗ ' + P.appts[i].name + ': ' + why[i]; }
        function select(i, quiet) {
          if (done) return;
          if (!quiet) ctx.sound('tap');
          if (!quiet && why[i]) ctx.setStatus(explain(i));
          else if (!quiet) ctx.setStatus('עכשיו: ' + P.appts[i].em + ' ' + P.appts[i].name + (pos[i] ? ' (לחצו על משבצת אחרת כדי להזיז)' : ''));
          cur = i;
          cards.forEach(function (c, j) { c.setAttribute('aria-pressed', j === i ? 'true' : 'false'); });
        }
        function clearMarks() {
          cards.forEach(function (c) { c.classList.remove('is-bad'); });
          ruleEls.forEach(function (x) { x.el.classList.remove('is-bad'); });
          why = {};
          Object.keys(cells).forEach(function (k) { cells[k].classList.remove('is-bad'); });
          if (note) note.classList.remove('is-bad');
        }
        function draw() {
          Object.keys(cells).forEach(function (k) { if (!P.busy[k]) { cells[k].textContent = ''; cells[k].classList.remove('ap-full'); } });
          pos.forEach(function (p, i) {
            cards[i].classList.toggle('ap-placed', !!p);
            if (!p) return;
            var c = cells[p.d + ',' + p.t];
            c.textContent = P.appts[i].em; c.classList.add('ap-full');
            c.setAttribute('aria-label', 'יום ' + DAYS[p.d] + ', ' + TIMES[p.t] + ': ' + P.appts[i].name);
          });
        }
        function who(d, t) { for (var i = 0; i < pos.length; i++) if (pos[i] && pos[i].d === d && pos[i].t === t) return i; return -1; }
        function tapCell(d, t) {
          if (done || P.busy[d + ',' + t]) return;
          clearMarks();
          var there = who(d, t);
          if (there !== -1) { // take it out of the diary
            pos[there] = null; ctx.sound('tap'); draw(); select(there, true);
            ctx.setStatus('הוצאתם את ' + P.appts[there].name + '. בחרו משבצת אחרת');
            return;
          }
          ctx.sound('tap');
          pos[cur] = { d: d, t: t };
          draw();
          // move on to the next appointment that is not in the diary yet
          var nxt = -1;
          for (var k = 1; k <= pos.length; k++) { var j = (cur + k) % pos.length; if (!pos[j]) { nxt = j; break; } }
          if (nxt !== -1) { select(nxt, true); ctx.setStatus('עכשיו: ' + P.appts[nxt].em + ' ' + P.appts[nxt].name); }
          else ctx.setStatus('כל הפגישות ביומן. לחצו "בדיקה"');
        }
        function doCheck() {
          if (done) return;
          clearMarks();
          var res = check(P, pos), crowdMsg = '';
          if (res.missing.length) {
            ctx.sound('bad');
            ctx.setStatus('עוד לא שיבצתם: ' + res.missing.map(function (i) { return P.appts[i].name; }).join(', '));
            select(res.missing[0], true);
            return;
          }
          checks++;
          if (!res.broken.length && !res.crowded.length) { finishDiary(checks === 1); return; }
          ctx.sound('bad');
          res.broken.forEach(function (r) {
            var x = ruleEls.filter(function (y) { return y.r === r; })[0];
            x.el.classList.add('is-bad');
            why[r.a] = (why[r.a] ? why[r.a] + '; ' : '') + whyText(r, P, pos);
            cards[r.a].classList.add('is-bad');
            var p = pos[r.a]; cells[p.d + ',' + p.t].classList.add('is-bad');
          });
          res.crowded.forEach(function (d) {
            crowdMsg = crowdMsg || 'ביום ' + DAY_SHORT[d] + ' יש יותר מפגישה אחת';
            note.classList.add('is-bad');
            pos.forEach(function (p) { if (p.d === d) cells[p.d + ',' + p.t].classList.add('is-bad'); });
          });
          var n = res.broken.length + res.crowded.length;
          if (checks >= 3) { showSolution(); return; }
          var first = res.broken.length ? res.broken[0].a : -1;
          ctx.setStatus(first !== -1 ? explain(first) : '✗ ' + crowdMsg);
        }
        function showSolution() {
          clearMarks();
          P.solution.forEach(function (s, i) { pos[i] = s; });
          draw();
          finishDiary(false, 'כך אפשר לסדר את היומן');
        }
        function finishDiary(ok, msg) {
          done = true;
          if (ok) good++;
          cards.forEach(function (c) { c.disabled = true; c.setAttribute('aria-pressed', 'false'); });
          Object.keys(cells).forEach(function (k) { cells[k].disabled = true; });
          pos.forEach(function (p) { cells[p.d + ',' + p.t].classList.add('is-good'); });
          ctx.setStatus(msg || (ok ? 'כל הכללים מתקיימים!' : 'עכשיו כל הכללים מתקיימים'));
          ctx.feedback(ok, msg).then(function () {
            actions.innerHTML = '';
            var nb = el('button', { class: 'btn btn-primary ap-check', type: 'button', onclick: function () { nb.disabled = true; nextRound(); } },
              round >= ROUNDS ? 'לסיכום' : 'ליומן הבא');
            actions.appendChild(nb);
          });
        }
      }
      nextRound();
    }
  });
})();
