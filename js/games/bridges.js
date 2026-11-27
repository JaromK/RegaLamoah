/* גשרים — islands with numbers. Join them with straight bridges (across or down, one or two between the same two
   islands) so every island has as many bridges as its number, no bridges cross, and all the islands are joined
   into one. Any arrangement that keeps the rules counts. Logic, planning. Untimed. */
(function () {
  'use strict';

  /* Level 1–50: n = board side, k = islands. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    if (L <= 6) return { n: 6, k: 5 };
    if (L <= 14) return { n: 7, k: 7 };
    if (L <= 26) return { n: 7, k: 9 };
    if (L <= 38) return { n: 8, k: 11 };
    return { n: 9, k: 13 };
  }

  /* islands: [{ r, c, need }]; edges: [{ a, b, horiz, cells: [i…] }] between islands that see each other */
  function edgesOf(n, islands) {
    var at = {}; islands.forEach(function (s, i) { at[s.r * n + s.c] = i; });
    var out = [];
    islands.forEach(function (s, i) {
      [[0, 1], [1, 0]].forEach(function (d) {
        var cells = [], r = s.r + d[0], c = s.c + d[1];
        while (r < n && c < n && at[r * n + c] === undefined) { cells.push(r * n + c); r += d[0]; c += d[1]; }
        if (r < n && c < n && cells.length) out.push({ a: i, b: at[r * n + c], horiz: d[0] === 0, cells: cells });
      });
    });
    return out;
  }
  function crosses(e, f) { return e.horiz !== f.horiz && e.cells.some(function (x) { return f.cells.indexOf(x) !== -1; }); }
  function connected(islands, edges, val) {
    var seen = { 0: true }, stack = [0];
    while (stack.length) {
      var i = stack.pop();
      edges.forEach(function (e, k) {
        if (!val[k]) return;
        var j = e.a === i ? e.b : e.b === i ? e.a : -1;
        if (j >= 0 && !seen[j]) { seen[j] = true; stack.push(j); }
      });
    }
    return Object.keys(seen).length === islands.length;
  }
  // number of ways to build the bridges, up to `limit`
  function count(islands, edges, limit) {
    var val = edges.map(function () { return 0; }), sum = islands.map(function () { return 0; }), found = 0;
    var cap = islands.map(function () { return 0; });
    edges.forEach(function (e) { cap[e.a] += 2; cap[e.b] += 2; });
    (function go(k) {
      if (found >= limit) return;
      if (k === edges.length) {
        if (islands.every(function (s, i) { return sum[i] === s.need; }) && connected(islands, edges, val)) found++;
        return;
      }
      var e = edges[k];
      for (var v = 0; v <= 2; v++) {
        if (v && edges.some(function (f, j) { return j < k && val[j] && crosses(e, f); })) break;
        if (sum[e.a] + v > islands[e.a].need || sum[e.b] + v > islands[e.b].need) break;
        // what is still free for each end after this edge must be able to reach its number
        cap[e.a] -= 2; cap[e.b] -= 2; sum[e.a] += v; sum[e.b] += v; val[k] = v;
        if (sum[e.a] + cap[e.a] >= islands[e.a].need && sum[e.b] + cap[e.b] >= islands[e.b].need) go(k + 1);
        cap[e.a] += 2; cap[e.b] += 2; sum[e.a] -= v; sum[e.b] -= v; val[k] = 0;
      }
    })(0);
    return found;
  }
  function makePuzzle(sp, rnd) {
    var n = sp.n;
    for (var attempt = 0; attempt < 200; attempt++) {
      var islands = [{ r: rnd.randInt(0, n - 1), c: rnd.randInt(0, n - 1), need: 0 }];
      var used = {}; used[islands[0].r * n + islands[0].c] = 'I';
      var bridges = [];
      for (var t = 0; t < 400 && islands.length < sp.k; t++) {
        var from = rnd.pick(islands), d = rnd.pick([[0, 1], [0, -1], [1, 0], [-1, 0]]), len = rnd.randInt(2, Math.max(2, n - 2));
        var r = from.r + d[0] * len, c = from.c + d[1] * len;
        if (r < 0 || c < 0 || r >= n || c >= n || used[r * n + c]) continue;
        var path = [], okp = true;
        for (var s = 1; s < len; s++) { var x = (from.r + d[0] * s) * n + from.c + d[1] * s; if (used[x]) { okp = false; break; } path.push(x); }
        // no island right next to another one (keeps the board readable)
        var near = [[0, 1], [1, 0], [0, -1], [-1, 0]].some(function (q) { var rr = r + q[0], cc = c + q[1]; return rr >= 0 && cc >= 0 && rr < n && cc < n && used[rr * n + cc] === 'I'; });
        if (!okp || near) continue;
        var w = rnd.randInt(1, 2);
        path.forEach(function (x) { used[x] = 'B'; });
        used[r * n + c] = 'I';
        var isl = { r: r, c: c, need: w }; from.need += w;
        islands.push(isl);
        bridges.push({ a: islands.indexOf(from), b: islands.length - 1, w: w });
      }
      if (islands.length < sp.k) continue;
      var E = edgesOf(n, islands);
      if (count(islands, E, 2) !== 1) continue;
      var sol = E.map(function (e) { var b = bridges.filter(function (x) { return (x.a === e.a && x.b === e.b) || (x.a === e.b && x.b === e.a); })[0]; return b ? b.w : 0; });
      return { n: n, islands: islands, edges: E, sol: sol };
    }
    return null;
  }

  var css = [
    '.br2-wrap{width:min(100%,calc(100svh - 17rem),30rem);aspect-ratio:1;}',
    '.br2-svg{width:100%;height:100%;display:block;touch-action:manipulation;}',
    '.br2-grid{stroke:var(--line);stroke-width:.02;}',
    '.br2-bridge{stroke:var(--ink);stroke-width:.09;stroke-linecap:round;pointer-events:none;}',
    '.br2-maybe{stroke:var(--ink-soft);stroke-width:.05;stroke-dasharray:.12 .14;opacity:.55;pointer-events:none;}',
    '.br2-maybe.is-near{stroke:var(--c-blue);opacity:1;stroke-width:.07;}',
    '.br2-hit{stroke:transparent;stroke-width:.55;cursor:pointer;}',
    '.br2-isl.is-reach circle{stroke:var(--c-blue);stroke-width:.11;fill:var(--c-blue-soft);}',
    '.br2-isl circle{fill:var(--surface);stroke:var(--ink);stroke-width:.06;cursor:pointer;}',
    '.br2-isl{cursor:pointer;}',
    '.br2-isl text{font-family:var(--font-display);font-weight:900;font-size:.56px;fill:var(--ink);pointer-events:none;}',
    '.br2-isl.is-sel circle{fill:var(--c-yellow-soft);stroke:var(--c-yellow);stroke-width:.11;}',
    '.br2-isl.is-ok circle{fill:var(--c-green-soft);stroke:var(--c-green);}',
    '.br2-isl.is-over circle{fill:var(--c-red-soft);stroke:var(--c-red);}',
    '.br2-isl.is-tip circle{stroke:var(--c-purple);stroke-width:.13;}',
    '.br2-acts{flex-wrap:nowrap;gap:.3rem;width:100%;max-width:30rem;}.br2-acts .btn{flex:1 1 auto;min-width:0;padding-inline:.4rem;font-size:.95rem;white-space:nowrap;}',
    '@media (min-width:900px){.g-split .br2-wrap{width:min(calc(100svh - 12.5rem),38rem);flex:none;}}'
  ].join('');

  BrainGames.register({
    id: 'bridges',
    name: 'גשרים',
    skill: 'executive',
    isNew: true,
    tagline: 'חברו את האיים בגשרים לפי המספרים',
    benefit: 'תכנון וחשיבה לוגית',
    instructions: [
      'על כל אי כתוב כמה גשרים יוצאים ממנו. גשרים עוברים רק ישר: לרוחב או לאורך.',
      'הקווים המקווקווים מראים איפה אפשר לבנות גשר. לחצו על קו: גשר. עוד לחיצה: גשר כפול. עוד לחיצה: הגשר נמחק. (אפשר גם ללחוץ על אי ואז על אי מודגש.)',
      'גשרים לא חוצים זה את זה, ובסוף כל האיים מחוברים יחד. אי נצבע ירוק כשיש לו בדיוק מספיק גשרים.',
      'יש "רמז", "↶ בטלו" ו"נקו". אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makePuzzle: makePuzzle, count: count, edgesOf: edgesOf },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = sp.k <= 7 ? 3 : 2, round = 0, good = 0;
      var NS = 'http://www.w3.org/2000/svg';

      function nextRound() {
        round++;
        if (round > ROUNDS) { ctx.finish({ correct: good, total: ROUNDS, note: 'חיברתם ' + good + ' מתוך ' + ROUNDS + ' ארכיפלגים' }); return; }
        ctx.setProgress(round, ROUNDS);
        var P = null;
        for (var t = 0; t < 10 && !P; t++) P = makePuzzle(sp, ctx);
        play(P);
      }

      function play(P) {
        root.innerHTML = '';
        root.__br = P; // read by the automated tests
        var n = P.n, I = P.islands, E = P.edges;
        var val = E.map(function () { return 0; }), sel = -1, done = false, hints = 0, past = [], tip = -1;
        var wrap = el('div', { class: 'br2-wrap' });
        var svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '-0.5 -0.5 ' + n + ' ' + n); svg.setAttribute('class', 'br2-svg');
        svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'איים וגשרים');
        wrap.appendChild(svg);
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var undoBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: undo }, '↶ בטלו');
        var clearBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: clearAll }, 'נקו');
        var acts = el('div', { class: 'g-actions br2-acts' }, [hintBtn, undoBtn, clearBtn]);
        root.classList.add('g-split');
        root.appendChild(wrap);
        root.appendChild(el('div', { class: 'g-side' }, [acts]));
        ctx.setStatus('לחצו על קו מקווקו בין שני איים כדי לבנות גשר');
        draw();

        function add(tag, attrs, parent) {
          var e = document.createElementNS(NS, tag);
          Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
          (parent || svg).appendChild(e); return e;
        }
        function sums() { var s = I.map(function () { return 0; }); E.forEach(function (e, k) { s[e.a] += val[k]; s[e.b] += val[k]; }); return s; }
        function draw() {
          while (svg.firstChild) svg.removeChild(svg.firstChild);
          for (var g = 0; g < n; g++) {
            add('line', { x1: g, y1: -0.5, x2: g, y2: n - 0.5, class: 'br2-grid' });
            add('line', { x1: -0.5, y1: g, x2: n - 0.5, y2: g, class: 'br2-grid' });
          }
          // every place a bridge can go: a faint dashed line (not where it would cross a bridge); the bridges drawn;
          // and over each a wide invisible strip, so a tap anywhere between two islands builds or changes that bridge
          E.forEach(function (e, k) {
            var A = I[e.a], B = I[e.b];
            var blocked = !val[k] && E.some(function (f, j) { return val[j] && crosses(e, f); });
            if (!val[k] && !blocked) add('line', { x1: A.c, y1: A.r, x2: B.c, y2: B.r, class: 'br2-maybe' + (sel >= 0 && (e.a === sel || e.b === sel) ? ' is-near' : '') });
            var off = val[k] === 2 ? [-0.11, 0.11] : val[k] ? [0] : [];
            off.forEach(function (o) {
              add('line', { x1: A.c + (e.horiz ? 0 : o), y1: A.r + (e.horiz ? o : 0), x2: B.c + (e.horiz ? 0 : o), y2: B.r + (e.horiz ? o : 0), class: 'br2-bridge' });
            });
            if (blocked) return;
            var hit = add('line', { x1: A.c, y1: A.r, x2: B.c, y2: B.r, class: 'br2-hit', role: 'button',
              'aria-label': 'גשר בין ' + A.need + ' ל-' + B.need + (val[k] ? ' (' + val[k] + ')' : '') });
            hit.addEventListener('click', function () { tapEdge(k); });
          });
          var s = sums();
          I.forEach(function (isl, i) {
            var reach = sel >= 0 && i !== sel && E.some(function (e) { return (e.a === sel && e.b === i) || (e.b === sel && e.a === i); });
            var cls = 'br2-isl' + (i === sel ? ' is-sel' : '') + (reach ? ' is-reach' : '') + (s[i] === isl.need ? ' is-ok' : s[i] > isl.need ? ' is-over' : '') + (i === tip ? ' is-tip' : '');
            var gEl = add('g', { class: cls, role: 'button', 'aria-label': 'אי ' + isl.need + (s[i] === isl.need ? ', מלא' : '') });
            add('rect', { x: isl.c - 0.5, y: isl.r - 0.5, width: 1, height: 1, fill: 'transparent' }, gEl); // the whole square is the target
            add('circle', { cx: isl.c, cy: isl.r, r: 0.44 }, gEl);
            var t = add('text', { x: isl.c, y: isl.r + 0.2, 'text-anchor': 'middle' }, gEl); t.textContent = String(isl.need);
            gEl.addEventListener('click', function () { tapIsland(i); });
          });
          undoBtn.disabled = done || !past.length;
          clearBtn.disabled = done || !val.some(Boolean);
          hintBtn.disabled = done;
        }
        function tapIsland(i) {
          if (done) return;
          ctx.sound('tap'); tip = -1;
          if (sel < 0 || sel === i) { sel = sel === i ? -1 : i; draw(); return; }
          var k = E.findIndex(function (e) { return (e.a === sel && e.b === i) || (e.a === i && e.b === sel); });
          if (k < 0) { ctx.setStatus('לאי הזה אין קו מקווקו מהאי שבחרתם. בחרו אחד מהאיים המודגשים'); sel = i; draw(); return; }
          sel = -1;
          tapEdge(k);
        }
        // a tap on the line between two islands: no bridge → bridge → double bridge → none
        function tapEdge(k) {
          if (done) return;
          ctx.sound('tap'); tip = -1;
          var nv = (val[k] + 1) % 3;
          if (nv && E.some(function (f, j) { return val[j] && crosses(E[k], f); })) { ctx.setStatus('הגשר הזה היה חוצה גשר אחר'); sel = -1; draw(); return; }
          past.push(val.slice());
          val[k] = nv; sel = -1;
          ctx.setStatus(nv === 2 ? 'גשר כפול' : nv === 1 ? 'גשר' : 'הגשר נמחק');
          draw(); check();
        }
        function undo() { if (done || !past.length) return; ctx.sound('tap'); val = past.pop(); sel = -1; tip = -1; draw(); }
        function clearAll() { if (done) return; ctx.sound('tap'); past.push(val.slice()); val = val.map(function () { return 0; }); sel = -1; tip = -1; ctx.setStatus('כל הגשרים נמחקו (אפשר "בטלו")'); draw(); }
        function check() {
          var s = sums();
          if (!I.every(function (isl, i) { return s[i] === isl.need; })) return;
          if (!connected(I, E, val)) { ctx.setStatus('לכל האיים יש מספיק גשרים, אבל הם לא מחוברים כולם יחד'); return; }
          done = true; draw();
          var ok = hints <= 2;
          if (ok) good++;
          ctx.setStatus('מצוין! כל האיים מחוברים');
          ctx.feedback(ok, ok ? undefined : 'חיברתם, בעזרת רמזים').then(function () { return ctx.wait(700); }).then(nextRound);
        }
        /* a hint: an island whose bridges are already decided by its number and its free neighbours */
        function hint() {
          if (done) return;
          hints++;
          var s = sums();
          for (var i = 0; i < I.length; i++) {
            var left = I[i].need - s[i]; if (left <= 0) continue;
            // how many more bridges each neighbour could still take
            var room = 0, nb = 0;
            E.forEach(function (e, k) {
              if (e.a !== i && e.b !== i) return;
              var j = e.a === i ? e.b : e.a;
              if (val[k] === 0 && E.some(function (f, q) { return val[q] && crosses(e, f); })) return;
              var r = Math.min(2 - val[k], I[j].need - s[j]);
              if (r > 0) { room += r; nb++; }
            });
            if (room === left) { tip = i; ctx.setStatus('רמז: לאי המסומן חסרים ' + left + ' גשרים, ובדיוק כך הוא עוד יכול לקבל מהשכנים שלו. איפה הם?'); draw(); return; }
            if (nb === 1) { tip = i; ctx.setStatus('רמז: לאי המסומן נשאר רק שכן אחד שאפשר לבנות אליו גשר. כמה גשרים צריך?'); draw(); return; }
          }
          ctx.setStatus('רמז: חפשו אי עם מספר גדול ומעט שכנים: 4 עם שני שכנים בלבד = גשר כפול לכל אחד');
        }
      }

      nextRound();
      return function cleanup() { root.classList.remove('g-split'); };
    }
  });
})();
