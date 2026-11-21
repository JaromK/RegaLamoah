/* מזיגת מים — jugs of different sizes, a tap and a sink: reach exactly the target amount of water
   (executive function, planning). Every puzzle is built with a full search, so the fewest moves is known.
   Untimed. */
(function () {
  'use strict';

  /* Level 1–50: n = jugs, capMax = biggest jug, lo…hi = fewest moves needed, tap = a tap and a sink exist
     (otherwise the water is already in the jugs and may only be poured), named = the target must be in one
     given jug, slack = extra moves still counted as success. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    var s;
    if (L <= 4) s = { n: 2, capMax: 5, lo: 2, hi: 3 };
    else if (L <= 9) s = { n: 2, capMax: 7, lo: 3, hi: 4 };
    else if (L <= 14) s = { n: 2, capMax: 9, lo: 4, hi: 6 };
    else if (L <= 20) s = { n: 2, capMax: 11, lo: 5, hi: 8 };
    else if (L <= 26) s = { n: 3, capMax: 8, lo: 4, hi: 6 };
    else if (L <= 32) s = { n: 3, capMax: 10, lo: 5, hi: 7 };
    else if (L <= 40) s = { n: 3, capMax: 12, lo: 6, hi: 9 };
    else s = { n: 3, capMax: 12, lo: 8, hi: 12 };
    s.tap = !(L >= 36 && L % 2 === 0);      // from 36, every other level: no tap, only pouring
    s.named = (L >= 17 && L <= 20) || (L >= 29 && L % 3 !== 0) || L >= 41;
    s.slack = L <= 8 ? 4 : L <= 18 ? 3 : L <= 30 ? 2 : 1;
    return s;
  }

  function key(a) { return a.join(','); }

  /* All moves from state a: fill i, empty i, pour i→j (until i is empty or j is full). */
  function moves(caps, a, tap) {
    var out = [];
    for (var i = 0; i < a.length; i++) {
      if (tap && a[i] < caps[i]) out.push({ t: 'fill', i: i });
      if (tap && a[i] > 0) out.push({ t: 'empty', i: i });
      for (var j = 0; j < a.length; j++) if (i !== j && a[i] > 0 && a[j] < caps[j]) out.push({ t: 'pour', i: i, j: j });
    }
    return out;
  }
  function apply(caps, a, m) {
    var b = a.slice();
    if (m.t === 'fill') b[m.i] = caps[m.i];
    else if (m.t === 'empty') b[m.i] = 0;
    else { var x = Math.min(b[m.i], caps[m.j] - b[m.j]); b[m.i] -= x; b[m.j] += x; }
    return b;
  }
  function isGoal(a, target) {
    if (target.jug >= 0) return a[target.jug] === target.T;
    return a.indexOf(target.T) >= 0;
  }

  /* Breadth-first search from a; returns the fewest moves to the goal and that path (or null). */
  function solve(caps, a, tap, target) {
    if (isGoal(a, target)) return { d: 0, path: [] };
    var seen = {}, q = [a], prev = {};
    seen[key(a)] = true;
    for (var h = 0; h < q.length; h++) {
      var s = q[h], ms = moves(caps, s, tap);
      for (var k = 0; k < ms.length; k++) {
        var b = apply(caps, s, ms[k]), kb = key(b);
        if (seen[kb]) continue;
        seen[kb] = true; prev[kb] = { from: s, m: ms[k] };
        if (isGoal(b, target)) {
          var path = [], cur = b;
          while (key(cur) !== key(a)) { var p = prev[key(cur)]; path.unshift(p.m); cur = p.from; }
          return { d: path.length, path: path };
        }
        q.push(b);
      }
    }
    return null;
  }

  /* Distances from the start to every reachable state. */
  function distances(caps, a, tap) {
    var dist = {}, q = [a];
    dist[key(a)] = 0;
    for (var h = 0; h < q.length; h++) {
      var s = q[h], ms = moves(caps, s, tap);
      for (var k = 0; k < ms.length; k++) {
        var b = apply(caps, s, ms[k]), kb = key(b);
        if (dist[kb] === undefined) { dist[kb] = dist[key(s)] + 1; q.push(b); }
      }
    }
    return { dist: dist, states: q };
  }

  function makePuzzle(sp, rnd) {
    for (var relax = 0; relax < 6; relax++) {
      var lo = Math.max(2, sp.lo - relax), hi = sp.hi + relax;
      for (var tries = 0; tries < 120; tries++) {
        var pool = [];
        for (var c = 2; c <= sp.capMax; c++) pool.push(c);
        var caps = rnd.shuffle(pool).slice(0, sp.n).sort(function (x, y) { return x - y; });
        if (caps[caps.length - 1] < sp.capMax - 2) continue; // keep the big jug big
        var start = caps.map(function () { return 0; });
        if (!sp.tap) {
          // the biggest jug starts full, sometimes another jug holds some water too
          start[sp.n - 1] = caps[sp.n - 1];
          if (sp.n > 2 && rnd.randInt(0, 1)) start[0] = rnd.randInt(1, caps[0]);
        }
        var D = distances(caps, start, sp.tap), cands = [];
        var best = {}; // "T" or "T@k" → fewest moves
        D.states.forEach(function (s) {
          var d = D.dist[key(s)];
          s.forEach(function (v, k) {
            if (v <= 0) return;
            if (!sp.named) { if (best[v] === undefined || d < best[v]) best[v] = d; }
            else if (v < caps[k] && v !== start[k]) { var kk = v + '@' + k; if (best[kk] === undefined || d < best[kk]) best[kk] = d; }
          });
        });
        Object.keys(best).forEach(function (t) {
          var d = best[t];
          if (d < lo || d > hi) return;
          var parts = t.split('@');
          var target = { T: Number(parts[0]), jug: parts.length > 1 ? Number(parts[1]) : -1 };
          if (target.jug < 0 && start.indexOf(target.T) >= 0) return;
          cands.push({ target: target, d: d });
        });
        if (!cands.length) continue;
        // prefer the harder ones of the range
        cands.sort(function (x, y) { return y.d - x.d; });
        var top = cands.filter(function (x) { return x.d >= cands[0].d - 1; });
        var pick = rnd.pick(top);
        return { caps: caps, start: start, tap: sp.tap, target: pick.target, opt: pick.d };
      }
    }
    return null;
  }

  var css = [
    '.wp-wrap{display:flex;flex-direction:column;align-items:center;gap:.7rem;width:100%;}',
    '.wp-goal{background:var(--c-blue-soft);border-radius:var(--radius);padding:.35rem .7rem;text-align:center;font-weight:800;font-size:1.2rem;line-height:1.35;width:100%;}',
    '.wp-goal b{font-family:var(--font-display);font-size:1.6rem;color:var(--c-blue);}',
    '.wp-count{font-weight:700;color:var(--ink-soft);font-size:1.05rem;}',
    '.wp-jugs{display:flex;justify-content:center;align-items:flex-end;gap:.9rem;width:100%;direction:rtl;}',
    '.wp-jugbtn{display:flex;flex-direction:column;align-items:center;gap:.25rem;background:none;border:0;padding:.35rem .3rem;border-radius:var(--radius);cursor:pointer;color:var(--ink);font:inherit;min-width:5.6rem;}',
    '.wp-jug{position:relative;width:5rem;border:4px solid var(--ink);border-top:0;border-radius:0 0 14px 14px;background:var(--surface);overflow:hidden;',
    'background-image:repeating-linear-gradient(to top,transparent 0,transparent calc(var(--u) - 2px),var(--line) calc(var(--u) - 2px),var(--line) var(--u));}',
    '.wp-water{position:absolute;left:0;right:0;bottom:0;background:var(--c-blue);transition:height .35s;',
    'background-image:repeating-linear-gradient(to top,transparent 0,transparent calc(var(--u) - 2px),var(--c-blue-soft) calc(var(--u) - 2px),var(--c-blue-soft) var(--u));opacity:.9;}',
    '.wp-amt{position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;font-family:var(--font-display);font-weight:900;font-size:2rem;color:var(--ink);',
    'text-shadow:0 0 4px var(--surface),0 0 4px var(--surface);}',
    '.wp-cap{font-weight:800;font-size:1.1rem;}',
    '.wp-jugbtn.is-sel{background:var(--sun-soft);box-shadow:0 0 0 4px var(--sun);}',
    '.wp-jugbtn.is-sel .wp-jug{transform:translateY(-6px);}',
    '.wp-jugbtn.is-hint{box-shadow:0 0 0 4px var(--c-green);}',
    '.wp-jugbtn.is-goal .wp-cap{background:var(--c-yellow);color:var(--c-on-yellow);border-radius:999px;padding:0 .55rem;}',
    '.wp-jugbtn.is-done .wp-jug{border-color:var(--c-green);}',
    '.wp-row{display:flex;gap:.5rem;justify-content:center;flex-wrap:wrap;width:100%;}',
    '.wp-row .btn{min-height:3.2rem;padding-inline:.7rem;font-size:1.1rem;flex:0 1 auto;white-space:nowrap;}',
    '.wp-actions{flex-wrap:nowrap;gap:.4rem;}',
    '.wp-row .btn.is-hint{box-shadow:0 0 0 4px var(--c-green);}'
  ].join('');

  BrainGames.register({
    id: 'water-pour',
    name: 'מזיגת מים',
    skill: 'executive',
    isNew: true,
    tagline: 'מזגו בין הכדים עד שתגיעו בדיוק לכמות הנכונה',
    benefit: 'תכנון כמה צעדים קדימה וגמישות מחשבתית',
    instructions: [
      'יש כדים בגדלים שונים. המטרה: להגיע בדיוק לכמות המים שכתובה למעלה.',
      'לחצו על כד כדי לבחור אותו, ואז על כד אחר כדי למזוג אליו. מוזגים עד שהכד הראשון מתרוקן או שהשני מתמלא.',
      'אפשר גם למלא כד מהברז או לרוקן אותו לכיור, בכפתורים שמתחת לכדים.',
      'אין שעון. יש "בטלו", "התחלה מחדש" ו"רמז".'
    ],
    css: css,
    _model: { spec: spec, makePuzzle: makePuzzle, solve: solve, moves: moves, apply: apply, isGoal: isGoal },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = 3, round = 0, good = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: good, total: ROUNDS, note: 'פתרתם ' + good + ' מתוך ' + ROUNDS + ' חידות במספר מהלכים טוב' });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var P = null;
        for (var t = 0; t < 5 && !P; t++) P = makePuzzle(sp, ctx);
        play(P);
      }

      function play(P) {
        root.innerHTML = '';
        var caps = P.caps, n = caps.length, cur = P.start.slice(), hist = [], sel = -1, hints = 0, done = false;
        var budget = P.opt + sp.slack;
        var big = caps[n - 1];
        var unit = Math.max(14, Math.min(40, Math.floor(190 / big)));
        var T = P.target.T;
        var goalText = P.target.jug >= 0
          ? ['המטרה: בדיוק ', el('b', null, String(T)), ' ליטר בכד של ' + caps[P.target.jug] + ' ליטר']
          : ['המטרה: בדיוק ', el('b', null, String(T)), ' ליטר בכד כלשהו'];
        var countEl = el('div', { class: 'wp-count' });
        var goal = el('div', { class: 'wp-goal' }, [el('div', null, goalText), countEl]);
        var jugBtns = [], waters = [], amts = [];
        for (var i = 0; i < n; i++) (function (i) {
          waters[i] = el('div', { class: 'wp-water', style: { '--u': unit + 'px' } });
          amts[i] = el('div', { class: 'wp-amt' });
          var jug = el('div', { class: 'wp-jug', style: { height: caps[i] * unit + 'px', '--u': unit + 'px' } }, [waters[i], amts[i]]);
          jugBtns[i] = el('button', { class: 'wp-jugbtn' + (P.target.jug === i ? ' is-goal' : ''), type: 'button', onclick: function () { tapJug(i); } },
            [jug, el('div', { class: 'wp-cap' }, 'כד ' + caps[i] + ' ל׳')]);
        })(i);
        var jugs = el('div', { class: 'wp-jugs' }, jugBtns);
        var fillBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: function () { tapTap('fill'); } }, 'מלאו מהברז');
        var emptyBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: function () { tapTap('empty'); } }, 'רוקנו לכיור');
        var tapRow = P.tap ? el('div', { class: 'wp-row' }, [fillBtn, emptyBtn]) : null;
        var undoBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: undo }, 'בטלו');
        var resetBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: reset }, 'התחלה מחדש');
        var hintBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: hint }, 'רמז');
        var actions = el('div', { class: 'wp-row wp-actions' }, [undoBtn, resetBtn, hintBtn]);
        var wrap = el('div', { class: 'wp-wrap' }, [goal, jugs, tapRow, actions]);
        root.appendChild(wrap);
        var baseStatus = P.tap ? 'בחרו כד, ואז לאן למזוג' : 'אין ברז: רק מוזגים מכד לכד';
        ctx.setStatus(baseStatus);
        draw();

        function clearHint() { wrap.querySelectorAll('.is-hint').forEach(function (b) { b.classList.remove('is-hint'); }); }
        function draw() {
          for (var i = 0; i < n; i++) {
            waters[i].style.height = (cur[i] / caps[i] * 100) + '%';
            amts[i].textContent = String(cur[i]);
            jugBtns[i].classList.toggle('is-sel', i === sel && !done);
            jugBtns[i].disabled = done;
          }
          countEl.textContent = 'מהלכים: ' + hist.length + ' · אפשר ב-' + P.opt;
          fillBtn.disabled = done || sel < 0 || cur[sel] === caps[sel];
          emptyBtn.disabled = done || sel < 0 || cur[sel] === 0;
          undoBtn.disabled = resetBtn.disabled = done || !hist.length;
          hintBtn.disabled = done;
        }
        function doMove(m) {
          hist.push(cur);
          cur = apply(caps, cur, m);
          sel = -1;
          clearHint();
          ctx.sound('tap');
          ctx.setStatus(baseStatus);
          draw();
          check();
        }
        function tapJug(i) {
          if (done) return;
          if (sel < 0) {
            if (!P.tap && cur[i] === 0) { ctx.setStatus('הכד הזה ריק. בחרו כד שיש בו מים'); return; }
            sel = i; ctx.sound('tap');
            ctx.setStatus(P.tap ? 'לחצו על כד אחר, או מלאו / רוקנו' : 'לחצו על הכד שאליו מוזגים');
            draw(); return;
          }
          if (sel === i) { sel = -1; ctx.setStatus(baseStatus); draw(); return; }
          if (cur[sel] === 0) { ctx.setStatus('הכד שבחרתם ריק, אין מה למזוג'); sel = i; draw(); return; }
          if (cur[i] === caps[i]) { ctx.setStatus('הכד הזה כבר מלא'); return; }
          doMove({ t: 'pour', i: sel, j: i });
        }
        function tapTap(t) {
          if (done || sel < 0) return;
          doMove({ t: t, i: sel });
        }
        function undo() { if (done || !hist.length) return; cur = hist.pop(); sel = -1; clearHint(); ctx.setStatus(baseStatus); draw(); }
        function reset() { if (done) return; cur = P.start.slice(); hist = []; sel = -1; clearHint(); ctx.setStatus(baseStatus); draw(); }
        function hint() {
          if (done) return;
          var res = solve(caps, cur, P.tap, P.target);
          if (!res || !res.path.length) return;
          hints++;
          var m = res.path[0];
          clearHint();
          sel = m.i;
          draw();
          if (m.t === 'pour') {
            jugBtns[m.j].classList.add('is-hint');
            ctx.setStatus('רמז: מזגו מכד ' + caps[m.i] + ' לכד ' + caps[m.j]);
          } else if (m.t === 'fill') {
            fillBtn.classList.add('is-hint');
            ctx.setStatus('רמז: מלאו את כד ' + caps[m.i] + ' מהברז');
          } else {
            emptyBtn.classList.add('is-hint');
            ctx.setStatus('רמז: רוקנו את כד ' + caps[m.i] + ' לכיור');
          }
        }
        function check() {
          if (!isGoal(cur, P.target)) return;
          done = true;
          var ok = hist.length <= budget && hints <= 1;
          if (ok) good++;
          for (var i = 0; i < n; i++) if (cur[i] === T && (P.target.jug < 0 || P.target.jug === i)) jugBtns[i].classList.add('is-done');
          draw();
          ctx.setStatus(ok ? 'מצוין! בדיוק ' + T + ' ליטר' : 'הגעתם ל-' + T + ' ליטר' + (hints > 1 ? ', בעזרת רמזים' : ', אבל אפשר בפחות מהלכים'));
          ctx.feedback(ok, ok ? (hist.length <= P.opt ? 'במספר המהלכים הקטן ביותר!' : 'כל הכבוד!') : 'אפשר היה ב-' + P.opt + ' מהלכים').then(function () {
            actions.innerHTML = '';
            if (tapRow) tapRow.remove();
            var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { next.disabled = true; nextRound(); } },
              round >= ROUNDS ? 'לסיכום' : 'לחידה הבאה');
            actions.appendChild(next);
          });
        }
      }

      nextRound();
    }
  });
})();
