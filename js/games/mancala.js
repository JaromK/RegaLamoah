/* מנקלה — the old sowing game, against the computer (the Kalah rules). Take all the seeds from one of your pits and
   sow them one by one into the next pits; a seed that ends in your store gives another turn, a seed that ends in an
   empty pit of yours takes the seeds across from it. Whoever has more seeds in the store at the end wins.
   Planning. Untimed. */
(function () {
  'use strict';

  /* pits 0–5 are the player's, 6 the player's store; 7–12 the computer's, 13 its store. Sowing goes up the numbers. */
  var STORE = [6, 13];
  function mine(who, i) { return who === 0 ? i >= 0 && i <= 5 : i >= 7 && i <= 12; }
  function sideEmpty(s, who) { for (var i = who * 7; i < who * 7 + 6; i++) if (s[i]) return false; return true; }
  // one move: the new board, where each seed fell, and what happened
  function sow(s0, pit, who) {
    var s = s0.slice(), n = s[pit], i = pit, path = [];
    s[pit] = 0;
    while (n > 0) {
      i = (i + 1) % 14;
      if (i === STORE[1 - who]) continue; // never into the other's store
      s[i]++; n--; path.push(i);
    }
    var res = { s: s, path: path, last: i, again: i === STORE[who], took: 0, over: false };
    if (mine(who, i) && s[i] === 1 && s[12 - i] > 0) { // the last seed in an empty pit of yours: take what is across
      res.took = s[12 - i] + 1; res.across = 12 - i;
      s[STORE[who]] += res.took; s[i] = 0; s[12 - i] = 0;
    }
    if (sideEmpty(s, 0) || sideEmpty(s, 1)) { // the end: what is left goes to the store of its side
      res.over = true;
      for (var w = 0; w < 2; w++) for (var j = w * 7; j < w * 7 + 6; j++) { s[STORE[w]] += s[j]; s[j] = 0; }
    }
    return res;
  }
  function legal(s, who) { var out = []; for (var i = who * 7; i < who * 7 + 6; i++) if (s[i]) out.push(i); return out; }
  // the best move for "who", looking "depth" moves ahead (another turn counts as a move of the same player)
  function search(s, who, depth, a, b) {
    var ms = legal(s, who);
    if (depth === 0 || !ms.length) return { v: s[STORE[who]] - s[STORE[1 - who]] };
    var best = { v: -1e9, m: ms[0] };
    // moves that give another turn first: alpha-beta cuts more
    ms.sort(function (x, y) { return ((y + s[y]) % 13 === STORE[who] % 13 ? 1 : 0) - ((x + s[x]) % 13 === STORE[who] % 13 ? 1 : 0); });
    for (var k = 0; k < ms.length; k++) {
      var r = sow(s, ms[k], who), v;
      if (r.over) v = r.s[STORE[who]] - r.s[STORE[1 - who]];
      else if (r.again) v = search(r.s, who, depth - 1, a, b).v;
      else v = -search(r.s, 1 - who, depth - 1, -b, -a).v;
      if (v > best.v) best = { v: v, m: ms[k] };
      if (v > a) a = v;
      if (a >= b) break;
    }
    return best;
  }

  /* Level 1–50: seeds = seeds in each pit at the start, depth = how far the computer looks ahead (0 = it plays at random),
     slip = how often it plays a careless move instead */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    if (L <= 8) return { seeds: 3, depth: 0, slip: 0 };
    if (L <= 14) return { seeds: 3, depth: 1, slip: 0.3 };
    if (L <= 20) return { seeds: 3, depth: 2, slip: 0.3 };
    if (L <= 26) return { seeds: 4, depth: 2, slip: 0.15 };
    if (L <= 32) return { seeds: 4, depth: 3, slip: 0.2 };
    if (L <= 38) return { seeds: 4, depth: 4, slip: 0.15 };
    if (L <= 44) return { seeds: 4, depth: 5, slip: 0.05 };
    return { seeds: 4, depth: 8, slip: 0 };
  }
  function computerMove(s, sp, rnd) {
    var ms = legal(s, 1);
    if (!sp.depth) {
      // the weakest computer: mostly any pit, sometimes one that gives it another turn
      var again = ms.filter(function (m) { return sow(s, m, 1).again; });
      return again.length && rnd.randInt(0, 2) === 0 ? again[0] : rnd.pick(ms);
    }
    if (sp.slip && rnd.randInt(0, 99) < sp.slip * 100) return rnd.pick(ms); // now and then a careless move
    return search(s, 1, sp.depth, -1e9, 1e9).m;
  }

  // where each pit stands: on a phone two columns (yours on the right, going down), on a computer two rows
  function place(i) {
    if (i === 13) return { r: '1', c: '1 / 3', pr: '1 / 3', pc: '1' };
    if (i === 6) return { r: '8', c: '1 / 3', pr: '1 / 3', pc: '8' };
    if (i < 6) return { r: String(2 + i), c: '2', pr: '2', pc: String(2 + i) };
    return { r: String(7 - (i - 7)), c: '1', pr: '1', pc: String(7 - (i - 7)) };
  }

  var css = [
    '.mn-board{display:grid;grid-template-columns:1fr 1fr;grid-template-rows:auto repeat(6,var(--ph)) auto;gap:4px;direction:ltr;',
    '--ph:max(2.7rem,min(calc((100svh - 31rem) / 6), 4.2rem));width:min(100%,22rem);padding:6px;background:#b07a45;border-radius:22px;',
    'box-shadow:inset 0 2px 0 rgba(255,255,255,.25),0 3px 8px rgba(0,0,0,.2);}',
    '.mn-pit{grid-row:var(--r);grid-column:var(--c);position:relative;border-radius:16px;border:0;padding:.2rem .4rem;font:inherit;color:var(--ink);',
    'background:#f3e2c7;box-shadow:inset 0 3px 6px rgba(0,0,0,.28);display:flex;align-items:center;gap:.35rem;direction:rtl;min-width:0;}',
    '.mn-pit .n{font-weight:900;font-size:1.55rem;min-width:1.6rem;text-align:center;line-height:1;}',
    '.mn-dots{display:flex;flex-wrap:wrap;gap:2px;align-content:center;flex:1;min-width:0;max-height:100%;overflow:hidden;}',
    '.mn-dots i{width:.6rem;height:.6rem;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff6,transparent 45%),var(--seed);flex:none;}',
    '.mn-pit.me{--seed:var(--c-blue);cursor:pointer;}.mn-pit.cpu{--seed:var(--c-red);}',
    '.mn-pit.me:not(:disabled){box-shadow:inset 0 3px 6px rgba(0,0,0,.28),0 0 0 3px var(--c-blue);}',
    '.mn-pit:disabled{cursor:default;opacity:1;}',
    '.mn-pit .ar{position:absolute;top:2px;inset-inline-start:6px;font-size:.75rem;color:#7a5530;font-weight:900;}',
    '.mn-pit.me .ar::after{content:"↓";}.mn-pit.cpu .ar::after{content:"↑";}',
    '.mn-store{min-height:2.6rem;justify-content:center;background:#ecd3ac;}',
    '.mn-store .who{font-weight:800;font-size:.95rem;}',
    '.mn-store.me{--seed:var(--c-blue);cursor:default;}.mn-store.cpu{--seed:var(--c-red);}',
    '.mn-pit.is-drop{background:var(--c-yellow-soft);}',
    '.mn-pit.is-tip{box-shadow:inset 0 3px 6px rgba(0,0,0,.28),0 0 0 4px var(--c-purple) !important;}',
    '.mn-pit.is-last{background:var(--c-green-soft);}',
    '.app:has(.mn-board){max-width:72rem;}',
    '.mn-acts{flex-wrap:nowrap;gap:.3rem;width:100%;max-width:22rem;}.mn-acts .btn{flex:1 1 auto;min-width:0;font-size:.95rem;white-space:nowrap;min-height:2.7rem;padding-block:.3rem;}',
    '@media (min-width:900px){',
    '.mn-board{grid-template-columns:6rem repeat(6,5.6rem) 6rem;grid-template-rows:6.4rem 6.4rem;width:auto;--ph:auto;}',
    '.mn-pit{grid-row:var(--pr);grid-column:var(--pc);flex-direction:column;justify-content:center;padding:.4rem;}',
    '.mn-pit .n{font-size:2rem;}.mn-dots{flex:none;justify-content:center;max-width:5.5rem;}.mn-dots i{width:.75rem;height:.75rem;}',
    '.mn-pit.me .ar::after{content:"→";}.mn-pit.cpu .ar::after{content:"←";}}'
  ].join('');

  BrainGames.register({
    id: 'mancala',
    name: 'מנקלה',
    skill: 'executive',
    isNew: true,
    tagline: 'משחק הזריעה העתיק, מול המחשב',
    benefit: 'תכנון, ספירה וחשיבה קדימה',
    instructions: [
      'הגומות הכחולות שלכם, האדומות של המחשב. לכל אחד יש מחסן.',
      'בתורכם לחצו על גומה שלכם: כל הזרעים שבה מתפזרים אחד אחד בגומות הבאות, לפי כיוון החצים, וגם למחסן שלכם.',
      'הזרע האחרון נפל במחסן שלכם? עוד תור! נפל בגומה ריקה שלכם? אתם לוקחים גם את הזרעים שמולה.',
      'כשצד אחד מתרוקן המשחק נגמר. מי שיש לו יותר זרעים במחסן מנצח. יש "רמז". אין שעון.'
    ],
    css: css,
    _model: { spec: spec, sow: sow, legal: legal, search: search, computerMove: computerMove },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var s = [], hints = 0, busy = false, over = false, tip = -1;
      for (var i = 0; i < 14; i++) s.push(i === 6 || i === 13 ? 0 : sp.seeds);
      ctx.setProgress(1, 1);

      var pits = [];
      for (var j = 0; j < 14; j++) (function (j) {
        var p = place(j), store = j === 6 || j === 13, me = j <= 6;
        var kids = [el('span', { class: 'n' }), el('span', { class: 'mn-dots' })];
        if (store) kids.unshift(el('span', { class: 'who' }, me ? '🙂 המחסן שלכם' : '🤖 המחסן של המחשב'));
        else kids.push(el('span', { class: 'ar', 'aria-hidden': 'true' }));
        var b = el('button', { class: 'mn-pit ' + (me ? 'me' : 'cpu') + (store ? ' mn-store' : ''), type: 'button',
          style: { '--r': p.r, '--c': p.c, '--pr': p.pr, '--pc': p.pc }, onclick: function () { if (j < 6) play(j); } }, kids);
        pits.push(b);
      })(j);
      var boardEl = el('div', { class: 'mn-board' }, pits);
      var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
      var acts = el('div', { class: 'g-actions mn-acts' }, [hintBtn]);
      root.appendChild(boardEl); root.appendChild(acts);
      root.__mn = { get s() { return s.slice(); }, get busy() { return busy; }, get over() { return over; } }; // for the automated tests
      draw();
      yourTurn();

      function draw(drop, last) {
        pits.forEach(function (b, i) {
          b.querySelector('.n').textContent = String(s[i]);
          var dots = b.querySelector('.mn-dots'), want = Math.min(s[i], i === 6 || i === 13 ? 24 : 12);
          if (dots.children.length !== want) { dots.innerHTML = ''; for (var k = 0; k < want; k++) dots.appendChild(el('i')); }
          b.classList.toggle('is-drop', i === drop);
          b.classList.toggle('is-last', i === last);
          b.classList.toggle('is-tip', i === tip);
          if (i < 6) b.disabled = busy || over || !s[i];
          else b.disabled = true;
          b.setAttribute('aria-label', (i === 6 ? 'המחסן שלכם' : i === 13 ? 'המחסן של המחשב' : (i < 6 ? 'גומה שלכם' : 'גומה של המחשב')) + ': ' + s[i] + ' זרעים');
        });
        hintBtn.disabled = busy || over;
      }
      function yourTurn() {
        busy = false; draw();
        ctx.setStatus('תורכם: לחצו על גומה כחולה');
      }
      // the seeds go one by one, so the move can be followed
      function animate(r) {
        var at = 0;
        s = s.slice(); s[r.pit] = 0; draw(r.pit);
        function step() {
          if (at >= r.path.length) return ctx.wait(350);
          s[r.path[at]]++; draw(r.path[at]); ctx.sound('tap'); at++;
          return ctx.wait(r.path.length > 8 ? 170 : 240).then(step);
        }
        // the end of the move: what was taken, and the last pit marked
        return ctx.wait(250).then(step).then(function () { s = r.s.slice(); draw(-1, r.last); });
      }
      function play(pit) {
        if (busy || over || pit > 5 || !s[pit]) return;
        busy = true; tip = -1;
        var r = sow(s, pit, 0); r.pit = pit;
        animate(r).then(function () {
          if (r.took) ctx.setStatus('הזרע האחרון נפל בגומה ריקה שלכם: לקחתם ' + r.took + ' זרעים!');
          if (r.over) return end();
          if (r.again) { ctx.setStatus((r.took ? '' : 'הזרע האחרון נפל במחסן שלכם. ') + 'עוד תור!'); ctx.sound('good'); return ctx.wait(500).then(yourTurn); }
          return ctx.wait(r.took ? 1200 : 300).then(computer);
        });
      }
      function computer() {
        ctx.setStatus('🤖 המחשב חושב…');
        return ctx.wait(500).then(function () {
          var m = computerMove(s, sp, ctx), r = sow(s, m, 1); r.pit = m;
          tip = m; draw(); tip = -1;
          return ctx.wait(400).then(function () { return animate(r); }).then(function () {
            if (r.took) ctx.setStatus('🤖 המחשב לקח ' + r.took + ' זרעים מהגומה שמול הגומה הריקה שלו');
            if (r.over) return end();
            if (r.again) { ctx.setStatus('🤖 הזרע האחרון של המחשב נפל במחסן שלו, אז הוא משחק שוב'); return ctx.wait(1300).then(computer); }
            return ctx.wait(r.took ? 1600 : 200).then(yourTurn);
          });
        });
      }
      /* a hint explains a good move: another turn, taking seeds, or not leaving seeds to be taken */
      function hint() {
        if (busy || over) return;
        hints++;
        var ms = legal(s, 0);
        var again = ms.filter(function (m) { return sow(s, m, 0).again; });
        var takes = ms.map(function (m) { return { m: m, r: sow(s, m, 0) }; }).filter(function (x) { return x.r.took; })
          .sort(function (a, b) { return b.r.took - a.r.took; });
        if (again.length) {
          tip = again[again.length - 1]; draw();
          ctx.setStatus('רמז: ספרו! מהגומה המסומנת הזרע האחרון נופל במחסן שלכם. עוד תור');
        } else if (takes.length) {
          tip = takes[0].m; draw();
          ctx.setStatus('רמז: מהגומה המסומנת הזרע האחרון נופל בגומה ריקה שלכם. תיקחו ' + takes[0].r.took + ' זרעים');
        } else {
          tip = search(s, 0, 4, -1e9, 1e9).m; draw();
          ctx.setStatus('רמז: הגומה המסומנת בטוחה: היא לא משאירה למחשב הרבה זרעים לקחת');
        }
      }
      function end() {
        over = true; busy = false; draw();
        var me = s[6], cpu = s[13], won = me > cpu;
        var msg = 'המשחק נגמר: לכם ' + me + ' זרעים, למחשב ' + cpu + '. ' + (won ? 'ניצחתם!' : me === cpu ? 'תיקו!' : 'המחשב ניצח הפעם');
        ctx.setStatus(msg);
        acts.hidden = true;
        var result = { correct: won ? 1 : 0, total: 1, note: 'לכם ' + me + ' זרעים, למחשב ' + cpu };
        if (won) { ctx.sound('good'); return ctx.feedback(true, 'ניצחתם!').then(function () { return ctx.wait(1500); }).then(function () { ctx.finish(result); }); }
        return ctx.feedback(false, me === cpu ? 'תיקו' : 'הפעם המחשב ניצח').then(function () { return ctx.next('לסיכום'); }).then(function () { ctx.finish(result); });
      }
    }
  });
})();
