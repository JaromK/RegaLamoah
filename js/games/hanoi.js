/* מגדלי האנוי — three pegs and discs of different sizes: move the discs one at a time, never a big disc on a
   small one, until they stand as in the small picture (executive function, planning). The fewest moves is
   found with a full search. Untimed. */
(function () {
  'use strict';

  /* Level 1–50: n = discs, mode 'tower' = the classic game (a whole tower moves to another peg),
     'start' = discs start scattered and must become one tower, 'both' = scattered start and a scattered target
     shown in the small picture; lo…hi = fewest moves needed (for the random modes); slack = extra moves that
     still count as success (share of the fewest). */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    var s;
    if (L <= 3) s = { n: 2, mode: 'tower' };
    else if (L <= 8) s = { n: 3, mode: 'tower' };
    else if (L <= 12) s = { n: 3, mode: 'start', lo: 4, hi: 7 };
    else if (L <= 16) s = { n: 4, mode: 'tower' };
    else if (L <= 22) s = { n: 4, mode: 'both', lo: 6, hi: 11 };
    else if (L <= 28) s = { n: 5, mode: 'start', lo: 9, hi: 15 };
    else if (L <= 34) s = { n: 5, mode: 'both', lo: 10, hi: 17 };
    else if (L <= 40) s = { n: 5, mode: L % 2 ? 'both' : 'start', lo: 13, hi: 20 };
    else s = { n: 6, mode: 'both', lo: Math.min(22, 12 + (L - 41)), hi: Math.min(28, 18 + (L - 41)) };
    s.slackShare = L <= 8 ? 1 : L <= 16 ? 0.6 : L <= 28 ? 0.4 : L <= 40 ? 0.3 : 0.25;
    return s;
  }
  function slack(sp, opt) { return Math.max(2, Math.ceil(opt * sp.slackShare)); }

  /* A position = array pos[d] = peg (0–2) of disc d (0 = smallest). Any such array is legal: each peg's discs
     sit largest at the bottom. */
  function key(p) { return p.join(''); }
  function tops(p) {
    var t = [-1, -1, -1];
    for (var d = p.length - 1; d >= 0; d--) t[p[d]] = d; // smallest disc on each peg ends up last
    return t;
  }
  function moves(p) {
    var t = tops(p), out = [];
    for (var a = 0; a < 3; a++) {
      if (t[a] < 0) continue;
      for (var b = 0; b < 3; b++) if (b !== a && (t[b] < 0 || t[b] > t[a])) out.push({ from: a, to: b, d: t[a] });
    }
    return out;
  }
  function apply(p, m) { var q = p.slice(); q[m.d] = m.to; return q; }

  /* Breadth-first search; returns fewest moves from p to goal and the path. */
  function solve(p, goal) {
    var g = key(goal);
    if (key(p) === g) return { d: 0, path: [] };
    var prev = {}, q = [p];
    prev[key(p)] = null;
    for (var h = 0; h < q.length; h++) {
      var s = q[h], ms = moves(s);
      for (var i = 0; i < ms.length; i++) {
        var b = apply(s, ms[i]), kb = key(b);
        if (kb in prev) continue;
        prev[kb] = { from: s, m: ms[i] };
        if (kb === g) {
          var path = [], cur = b;
          while (prev[key(cur)]) { path.unshift(prev[key(cur)].m); cur = prev[key(cur)].from; }
          return { d: path.length, path: path };
        }
        q.push(b);
      }
    }
    return null;
  }
  function distances(goal) {
    var dist = {}, q = [goal];
    dist[key(goal)] = 0;
    for (var h = 0; h < q.length; h++) {
      var ms = moves(q[h]);
      for (var i = 0; i < ms.length; i++) {
        var b = apply(q[h], ms[i]), kb = key(b);
        if (dist[kb] === undefined) { dist[kb] = dist[key(q[h])] + 1; q.push(b); }
      }
    }
    return dist;
  }
  function tower(n, peg) { var p = []; for (var d = 0; d < n; d++) p.push(peg); return p; }
  function randomPos(n, rnd) { var p = []; for (var d = 0; d < n; d++) p.push(rnd.randInt(0, 2)); return p; }

  function makePuzzle(sp, rnd) {
    var n = sp.n;
    if (sp.mode === 'tower') {
      var a = rnd.randInt(0, 2), b = (a + rnd.randInt(1, 2)) % 3;
      return { n: n, start: tower(n, a), goal: tower(n, b), opt: (1 << n) - 1 };
    }
    for (var relax = 0; relax < 8; relax++) {
      var lo = Math.max(2, sp.lo - relax), hi = sp.hi + relax;
      for (var t = 0; t < 60; t++) {
        var goal = sp.mode === 'start' ? tower(n, rnd.randInt(0, 2)) : randomPos(n, rnd);
        // a scattered target should use at least two pegs, so it really is a new picture
        if (sp.mode === 'both' && goal.every(function (x) { return x === goal[0]; })) continue;
        var dist = distances(goal), cands = [];
        Object.keys(dist).forEach(function (k) {
          if (dist[k] < lo || dist[k] > hi) return;
          var p = k.split('').map(Number);
          if (p.every(function (x) { return x === p[0]; })) return; // start is scattered
          cands.push(p);
        });
        if (!cands.length) continue;
        var start = rnd.pick(cands);
        return { n: n, start: start, goal: goal, opt: dist[key(start)] };
      }
    }
    return null;
  }

  var css = [
    '.hn-wrap{display:flex;flex-direction:column;align-items:center;gap:.6rem;width:100%;}',
    '.hn-top{display:flex;align-items:center;gap:.7rem;justify-content:center;width:100%;}',
    '.hn-top p{margin:0;font-weight:800;font-size:1.1rem;line-height:1.35;}',
    '.hn-top>div:last-child{flex:1;min-width:0;}',
    '.hn-mini{display:flex;gap:4px;align-items:flex-end;padding:.35rem .4rem .3rem;background:var(--surface-2);border:2px solid var(--line);border-radius:var(--radius-sm);direction:ltr;}',
    '.hn-mpeg{position:relative;width:2.5rem;display:flex;flex-direction:column-reverse;align-items:center;border-bottom:3px solid var(--ink-soft);}',
    '.hn-mpeg::before{content:"";position:absolute;bottom:0;left:50%;width:3px;margin-left:-1.5px;height:100%;background:var(--ink-soft);}',
    '.hn-md{position:relative;height:12px;border-radius:3px;margin-top:1px;}',
    '.hn-board{display:flex;width:100%;max-width:26rem;direction:ltr;gap:4px;}',
    '.hn-peg{flex:1;position:relative;display:flex;flex-direction:column-reverse;align-items:center;background:none;border:0;padding:0 0 .5rem;cursor:pointer;',
    'border-radius:var(--radius-sm);min-width:0;}',
    '.hn-peg::before{content:"";position:absolute;bottom:.5rem;left:50%;width:10px;margin-left:-5px;top:calc(var(--lift) + .4rem);background:var(--ink-soft);border-radius:5px 5px 0 0;}',
    '.hn-peg::after{content:"";position:absolute;bottom:0;left:4%;right:4%;height:.5rem;background:var(--ink);border-radius:4px;}',
    '.hn-peg.is-target{background:var(--c-yellow-soft);}',
    '.hn-peg.is-hint{box-shadow:inset 0 0 0 4px var(--c-green);}',
    '.hn-d{position:relative;height:var(--dh);border-radius:10px;border:2px solid var(--surface);color:#fff;font-weight:900;font-size:1.05rem;',
    'display:flex;align-items:center;justify-content:center;transition:transform .15s;}',
    '.hn-d.is-up{transform:translateY(calc(-1 * var(--up)));box-shadow:0 0 0 4px var(--sun);}',
    '.hn-c0{background:var(--c-red);}.hn-c1{background:var(--c-blue);}.hn-c2{background:var(--c-yellow);color:var(--c-on-yellow);}',
    '.hn-c3{background:var(--c-green);}.hn-c4{background:var(--c-purple);}.hn-c5{background:var(--c-black);color:var(--surface);}',
    '.hn-count{font-weight:700;color:var(--ink-soft);font-size:1.05rem;}',
    '.hn-row{display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;width:100%;}',
    '.hn-row .btn{min-height:3.2rem;padding-inline:.7rem;font-size:1.1rem;flex:0 1 auto;white-space:nowrap;}',
    '.hn-actions{flex-wrap:nowrap;gap:.4rem;}',
    '.hn-done .hn-peg::after{background:var(--c-green);}'
  ].join('');

  BrainGames.register({
    id: 'hanoi',
    name: 'מגדלי האנוי',
    skill: 'executive',
    isNew: true,
    tagline: 'העבירו את הדיסקים, אף פעם לא גדול על קטן',
    benefit: 'תכנון, סבלנות וחשיבה כמה צעדים קדימה',
    instructions: [
      'יש שלושה עמודים ועליהם דיסקים בגדלים שונים.',
      'לחצו על עמוד כדי להרים את הדיסק העליון שלו, ואז על עמוד אחר כדי להניח אותו שם.',
      'אסור להניח דיסק גדול על דיסק קטן ממנו.',
      'סדרו את הדיסקים כמו בתמונה הקטנה, בכמה שפחות מהלכים. אין שעון, ויש "בטלו" ו"רמז".'
    ],
    css: css,
    _model: { spec: spec, makePuzzle: makePuzzle, solve: solve, moves: moves, apply: apply, slack: slack },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = sp.n <= 3 ? 3 : 2, round = 0, good = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: good, total: ROUNDS, note: 'סידרתם ' + good + ' מתוך ' + ROUNDS + ' במספר מהלכים טוב' });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var P = null;
        for (var t = 0; t < 5 && !P; t++) P = makePuzzle(sp, ctx);
        play(P);
      }

      function play(P) {
        root.innerHTML = '';
        var n = P.n, cur = P.start.slice(), hist = [], held = -1, hints = 0, done = false;
        var budget = P.opt + slack(sp, P.opt);
        var dh = n <= 3 ? 40 : n === 4 ? 36 : n === 5 ? 32 : 30; // disc height in px
        var up = 16;
        var pegH = n * (dh + 2) + up + dh + 14;
        function width(d) { return (34 + 62 * (n === 1 ? 1 : d / (n - 1))) + '%'; }

        // the small target picture
        var mini = el('div', { class: 'hn-mini', 'aria-label': 'כך זה צריך להיראות' });
        for (var g = 0; g < 3; g++) {
          var mp = el('div', { class: 'hn-mpeg', style: { height: (n * 13 + 14) + 'px' } });
          for (var d = n - 1; d >= 0; d--) if (P.goal[d] === g) {
            mp.appendChild(el('div', { class: 'hn-md hn-c' + d, style: { width: (30 + 66 * (n === 1 ? 1 : d / (n - 1))) + '%' } }));
          }
          mini.appendChild(mp);
        }
        var towerGoal = P.goal.every(function (x) { return x === P.goal[0]; });
        var countEl = el('div', { class: 'hn-count' });
        var top = el('div', { class: 'hn-top' }, [mini, el('div', null, [
          el('p', null, towerGoal ? 'כל הדיסקים לעמוד הצהוב' : 'סדרו את הדיסקים כמו בתמונה'), countEl])]);
        var pegs = [];
        for (var p = 0; p < 3; p++) (function (p) {
          pegs.push(el('button', { class: 'hn-peg' + (towerGoal && P.goal[0] === p ? ' is-target' : ''), type: 'button',
            style: { height: pegH + 'px', '--lift': (up + dh) + 'px' }, 'aria-label': 'עמוד ' + (p + 1), onclick: function () { tapPeg(p); } }));
        })(p);
        var board = el('div', { class: 'hn-board' }, pegs);
        var undoBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: undo }, 'בטלו');
        var resetBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: reset }, 'התחלה מחדש');
        var hintBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: hint }, 'רמז');
        var actions = el('div', { class: 'hn-row hn-actions' }, [undoBtn, resetBtn, hintBtn]);
        var wrap = el('div', { class: 'hn-wrap' }, [top, board, actions]);
        root.appendChild(wrap);
        var baseStatus = 'לחצו על עמוד כדי להרים דיסק';
        ctx.setStatus(baseStatus);
        draw();

        function topOf(peg) { for (var d = 0; d < n; d++) if (cur[d] === peg) return d; return -1; }
        function clearHint() { pegs.forEach(function (b) { b.classList.remove('is-hint'); }); }
        function draw() {
          pegs.forEach(function (b, p) {
            b.innerHTML = '';
            for (var d = n - 1; d >= 0; d--) if (cur[d] === p) {
              b.appendChild(el('div', { class: 'hn-d hn-c' + d + (d === held ? ' is-up' : ''),
                style: { width: width(d), '--dh': dh + 'px', '--up': up + 'px' } }, String(d + 1)));
            }
            b.disabled = done;
          });
          countEl.textContent = 'מהלכים: ' + hist.length + ' · אפשר ב-' + P.opt;
          undoBtn.disabled = resetBtn.disabled = done || !hist.length;
          hintBtn.disabled = done;
        }
        function tapPeg(p) {
          if (done) return;
          if (held < 0) {
            var d = topOf(p);
            if (d < 0) { ctx.setStatus('העמוד הזה ריק. לחצו על עמוד שיש בו דיסק'); return; }
            held = d; ctx.sound('tap');
            ctx.setStatus('עכשיו לחצו על העמוד שאליו מעבירים');
            draw(); return;
          }
          var from = cur[held];
          if (from === p) { held = -1; ctx.setStatus(baseStatus); draw(); return; }
          var t = topOf(p);
          if (t >= 0 && t < held) {
            ctx.sound('bad');
            ctx.setStatus('אי אפשר: דיסק גדול לא עולה על דיסק קטן. בחרו עמוד אחר');
            return;
          }
          hist.push(cur);
          cur = apply(cur, { d: held, to: p });
          held = -1;
          clearHint();
          ctx.sound('tap');
          ctx.setStatus(baseStatus);
          draw(); check();
        }
        function undo() { if (done || !hist.length) return; cur = hist.pop(); held = -1; clearHint(); ctx.setStatus(baseStatus); draw(); }
        function reset() { if (done) return; cur = P.start.slice(); hist = []; held = -1; clearHint(); ctx.setStatus(baseStatus); draw(); }
        function hint() {
          if (done) return;
          var res = solve(cur, P.goal);
          if (!res || !res.path.length) return;
          hints++;
          var m = res.path[0];
          clearHint();
          held = m.d;
          draw();
          pegs[m.to].classList.add('is-hint');
          ctx.setStatus('רמז: הדיסק המורם עובר לעמוד המסומן בירוק');
        }
        function check() {
          if (key(cur) !== key(P.goal)) return;
          done = true;
          var ok = hist.length <= budget && hints <= 1;
          if (ok) good++;
          wrap.classList.add('hn-done');
          draw();
          ctx.setStatus(ok ? 'מצוין! הדיסקים במקום' : hints > 1 ? 'סידרתם, בעזרת רמזים' : 'סידרתם, אבל אפשר בפחות מהלכים');
          ctx.feedback(ok, ok ? (hist.length <= P.opt ? 'במספר המהלכים הקטן ביותר!' : 'כל הכבוד!') : 'אפשר היה ב-' + P.opt + ' מהלכים').then(function () {
            actions.innerHTML = '';
            var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { next.disabled = true; nextRound(); } },
              round >= ROUNDS ? 'לסיכום' : 'לסידור הבא');
            actions.appendChild(next);
          });
        }
      }

      nextRound();
    }
  });
})();
