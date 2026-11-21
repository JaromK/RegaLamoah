/* מבוך — lead the blue token through a maze to the house (perception, planning). Mazes are generated (one way
   between any two places), grow from 5×5 to 14×14, then add a key to fetch first, stars to collect, and at the
   top levels a fog that shows only the part of the maze around the token. Untimed. */
(function () {
  'use strict';

  var N = 1, E = 2, S = 4, W = 8;
  var DR = { 1: -1, 2: 0, 4: 1, 8: 0 }, DC = { 1: 0, 2: 1, 4: 0, 8: -1 }, OPP = { 1: 4, 2: 8, 4: 1, 8: 2 };

  /* Level 1–50: size × size cells; items to visit before the house; fog radius (0 = none), remember = cells once
     seen stay visible; slack = how much longer than the shortest walk still counts as a success. */
  function spec(level) {
    var L = level;
    var size = Math.min(14, 5 + Math.floor((L - 1) / 3));
    var items = [];
    if (L >= 11 && L <= 20) items = ['key'];
    else if (L >= 21 && L <= 30) items = L % 2 ? ['star', 'star'] : ['key'];
    else if (L >= 31 && L <= 40) items = ['key', 'star'];
    else if (L >= 41) items = ['key'];
    var fog = L >= 41 ? (L >= 46 ? 2 : 3) : 0;
    if (L >= 41) size = 12 + Math.floor((L - 41) / 5); // 12, then 13 with a smaller window
    return { size: size, items: items, fog: fog, remember: L >= 41 && L <= 45 ? true : L >= 46 ? false : true, slack: fog ? 3 : 2 };
  }

  // recursive backtracker → cells[r][c] = bit mask of open sides
  function makeMaze(R, C, rnd) {
    var cells = [], seen = [], r, c;
    for (r = 0; r < R; r++) { cells.push([]); seen.push([]); for (c = 0; c < C; c++) { cells[r].push(0); seen[r].push(false); } }
    var stack = [[0, 0]];
    seen[0][0] = true;
    while (stack.length) {
      var top = stack[stack.length - 1], opts = [];
      [N, E, S, W].forEach(function (d) {
        var nr = top[0] + DR[d], nc = top[1] + DC[d];
        if (nr >= 0 && nr < R && nc >= 0 && nc < C && !seen[nr][nc]) opts.push(d);
      });
      if (!opts.length) { stack.pop(); continue; }
      var d = rnd.pick(opts), nr2 = top[0] + DR[d], nc2 = top[1] + DC[d];
      cells[top[0]][top[1]] |= d; cells[nr2][nc2] |= OPP[d];
      seen[nr2][nc2] = true;
      stack.push([nr2, nc2]);
    }
    return cells;
  }

  // distances from (r, c) to every cell, and the previous cell on the way
  function bfs(cells, r0, c0) {
    var R = cells.length, C = cells[0].length, dist = [], prev = [], q = [[r0, c0]];
    for (var r = 0; r < R; r++) { dist.push([]); prev.push([]); for (var c = 0; c < C; c++) { dist[r].push(-1); prev[r].push(null); } }
    dist[r0][c0] = 0;
    for (var i = 0; i < q.length; i++) {
      var cur = q[i];
      [N, E, S, W].forEach(function (d) {
        if (!(cells[cur[0]][cur[1]] & d)) return;
        var nr = cur[0] + DR[d], nc = cur[1] + DC[d];
        if (dist[nr][nc] >= 0) return;
        dist[nr][nc] = dist[cur[0]][cur[1]] + 1; prev[nr][nc] = cur; q.push([nr, nc]);
      });
    }
    return { dist: dist, prev: prev };
  }
  function pathTo(b, r, c) { var out = []; var p = [r, c]; while (p) { out.unshift(p); p = b.prev[p[0]][p[1]]; } return out; }

  // the shortest walk: start → every item (key/star in any order) → house
  function bestRoute(cells, start, items, goal) {
    var pts = [start].concat(items.map(function (it) { return [it.r, it.c]; }));
    var dists = pts.map(function (p) { return bfs(cells, p[0], p[1]).dist; });
    function d(i, p) { return dists[i][p[0]][p[1]]; }
    if (!items.length) return d(0, goal);
    if (items.length === 1) return d(0, pts[1]) + d(1, goal);
    return Math.min(d(0, pts[1]) + d(1, pts[2]) + d(2, goal), d(0, pts[2]) + d(2, pts[1]) + d(1, goal));
  }

  function makePuzzle(sp, rnd) {
    var R = sp.size, C = sp.size;
    var cells = makeMaze(R, C, rnd);
    var start = [0, C - 1]; // top right: where a Hebrew reader starts
    var fromStart = bfs(cells, start[0], start[1]);
    var goal = [0, 0], far = -1;
    for (var r = 0; r < R; r++) for (var c = 0; c < C; c++) if (fromStart.dist[r][c] > far) { far = fromStart.dist[r][c]; goal = [r, c]; }
    // items sit off the main way, so they need a detour
    var main = {};
    pathTo(fromStart, goal[0], goal[1]).forEach(function (p) { main[p[0] + ',' + p[1]] = true; });
    var mainList = Object.keys(main).map(function (k) { return k.split(',').map(Number); });
    var off = [];
    for (r = 0; r < R; r++) for (c = 0; c < C; c++) {
      if (main[r + ',' + c]) continue;
      var b = bfs(cells, r, c), m = 1e9;
      mainList.forEach(function (p) { m = Math.min(m, b.dist[p[0]][p[1]]); });
      off.push({ r: r, c: c, d: m });
    }
    off.sort(function (a, b2) { return b2.d - a.d; });
    var items = [];
    sp.items.forEach(function (kind) {
      var pool = off.filter(function (o) {
        return !items.some(function (it) { return Math.abs(it.r - o.r) + Math.abs(it.c - o.c) < 3; });
      });
      // a fair detour: not right on the way, but not in the farthest corner either
      var mid = pool.filter(function (o) { return o.d >= 2; });
      mid = mid.slice(Math.floor(mid.length * 0.2), Math.max(1, Math.ceil(mid.length * 0.6)));
      var o = rnd.pick(mid.length ? mid : pool.length ? pool : off);
      items.push({ kind: kind, r: o.r, c: o.c });
    });
    return { R: R, C: C, cells: cells, start: start, goal: goal, items: items, best: bestRoute(cells, start, items, goal) };
  }

  /* One arrow press: walk on in that direction through a straight corridor, stop at a turn, a crossing, a
     dead end, an item or the house. Returns the list of cells walked into. */
  function slide(P, r, c, d, stopAt) {
    var out = [];
    while (P.cells[r][c] & d) {
      r += DR[d]; c += DC[d];
      out.push([r, c]);
      if (stopAt(r, c)) break;
      var open = P.cells[r][c];
      var deg = (open & N ? 1 : 0) + (open & E ? 1 : 0) + (open & S ? 1 : 0) + (open & W ? 1 : 0);
      if (deg !== 2 || !(open & d)) break;
    }
    return out;
  }

  var ICON = { key: '🔑', star: '⭐' };

  var css = [
    '.mz-wrap{width:min(100%,max(calc(100svh - 19rem), 82vw),30rem);aspect-ratio:1;position:relative;}',
    '.mz-svg{width:100%;height:100%;display:block;touch-action:manipulation;cursor:pointer;}',
    '.mz-bg{fill:var(--surface);}',
    '.mz-seen{fill:var(--c-blue-soft);}',
    '.mz-wall{stroke:var(--ink);stroke-width:4px;stroke-linecap:round;fill:none;}',
    '.mz-fog{fill:var(--surface-2);}',
    '.mz-help{stroke:var(--c-yellow);stroke-width:5px;stroke-dasharray:2 8;stroke-linecap:round;fill:none;}',
    '.mz-tok{fill:var(--c-blue);stroke:var(--surface);stroke-width:2px;}',
    '.mz-pad{display:grid;grid-template-columns:repeat(3,4.2rem);grid-template-rows:repeat(2,3.6rem);gap:.4rem;direction:ltr;justify-content:center;}',
    '.mz-arrow{border-radius:var(--radius);border:3px solid var(--c-blue);background:var(--c-blue-soft);color:var(--ink);font-size:2rem;font-weight:900;cursor:pointer;line-height:1;padding:0;}',
    '.mz-arrow:disabled{opacity:.35;cursor:default;}',
    '.mz-help-btn{border-radius:var(--radius);border:2px solid var(--line);background:var(--surface);color:var(--ink);font:inherit;font-weight:800;font-size:1.05rem;cursor:pointer;}',
    '.mz-bag{min-width:4.2rem;display:flex;align-items:center;justify-content:center;font-size:1.6rem;gap:.1rem;}'
  ].join('');

  BrainGames.register({
    id: 'maze',
    name: 'מבוך',
    skill: 'perception',
    isNew: true,
    tagline: 'מצאו את הדרך במבוך אל הבית',
    benefit: 'תפיסה מרחבית ותכנון דרך',
    instructions: [
      'העיגול הכחול הוא אתם. הובילו אותו אל הבית 🏠.',
      'לחצו על החצים. העיגול ממשיך בדרך הישרה עד פנייה או צומת. אפשר גם ללחוץ על משבצת בשורה שלו או בטור שלו.',
      'ברמות גבוהות: קודם לוקחים את המפתח 🔑 או אוספים כוכבים ⭐, ורק אחר כך הולכים הביתה.',
      'אין שעון. מנסים להגיע בלי להסתובב יותר מדי. יש כפתור "עזרה" שמראה את הדרך.'
    ],
    css: css,
    _model: { spec: spec, makePuzzle: makePuzzle, makeMaze: makeMaze, bfs: bfs, slide: slide, bestRoute: bestRoute },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = sp.size <= 8 ? 3 : 2, round = 0, solved = 0;
      var NS = 'http://www.w3.org/2000/svg';

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({ correct: solved, total: ROUNDS, note: 'יצאתם מ-' + ROUNDS + ' מבוכים, ' + solved + ' מהם בדרך קצרה' });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        play(makePuzzle(sp, ctx));
      }

      function play(P) {
        root.innerHTML = '';
        var pos = P.start.slice(), steps = 0, helped = false, done = false, helpPath = null;
        var got = P.items.map(function () { return false; });
        var seen = {}, visited = {};
        visited[pos[0] + ',' + pos[1]] = true;

        var wrap = el('div', { class: 'mz-wrap' });
        wrap._mz = P; // read by automated tests only
        var svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '-1 -1 ' + (P.C * 10 + 2) + ' ' + (P.R * 10 + 2));
        svg.setAttribute('class', 'mz-svg');
        svg.setAttribute('role', 'img');
        svg.setAttribute('aria-label', 'מבוך');
        svg.addEventListener('click', tapMaze);
        wrap.appendChild(svg);

        var arrows = {};
        function arrow(d, ch, label) {
          arrows[d] = el('button', { class: 'mz-arrow', type: 'button', 'aria-label': label, onclick: function () { move(d); } }, ch);
          return arrows[d];
        }
        var bag = el('div', { class: 'mz-bag', 'aria-live': 'polite' });
        var helpBtn = el('button', { class: 'mz-help-btn', type: 'button', onclick: help }, 'עזרה');
        var pad = el('div', { class: 'mz-pad' }, [helpBtn, arrow(N, '↑', 'למעלה'), bag, arrow(W, '←', 'שמאלה'), arrow(S, '↓', 'למטה'), arrow(E, '→', 'ימינה')]);
        root.appendChild(wrap);
        root.appendChild(pad);
        status();
        draw();

        function need() { return P.items.filter(function (_, i) { return !got[i]; }); }
        function status(t) {
          if (t) { ctx.setStatus(t); return; }
          var left = need();
          if (!left.length) ctx.setStatus(P.items.length ? 'עכשיו הביתה 🏠' : 'הובילו את העיגול הכחול הביתה 🏠');
          else if (left[0].kind === 'key' && left.length === 1) ctx.setStatus('קודם קחו את המפתח 🔑, ואז הביתה');
          else if (left.some(function (it) { return it.kind === 'key'; })) ctx.setStatus('קחו את המפתח 🔑 ואת הכוכב ⭐, ואז הביתה');
          else ctx.setStatus(left.length === 2 ? 'אספו את שני הכוכבים ⭐, ואז הביתה' : 'קחו את הכוכב ⭐, ואז הביתה');
        }
        function visible(r, c) {
          if (!sp.fog) return true;
          if (Math.max(Math.abs(r - pos[0]), Math.abs(c - pos[1])) <= sp.fog) return true;
          return sp.remember && seen[r + ',' + c];
        }
        function add(tag, attrs, text) {
          var n = document.createElementNS(NS, tag);
          Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
          if (text) n.textContent = text;
          svg.appendChild(n);
          return n;
        }
        function emoji(r, c, ch, size) {
          add('text', { x: c * 10 + 5, y: r * 10 + 5.4, 'font-size': size || 7, 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, ch);
        }
        function draw() {
          while (svg.firstChild) svg.removeChild(svg.firstChild);
          var r, c;
          if (sp.fog) for (r = 0; r < P.R; r++) for (c = 0; c < P.C; c++)
            if (Math.max(Math.abs(r - pos[0]), Math.abs(c - pos[1])) <= sp.fog) seen[r + ',' + c] = true;
          add('rect', { x: 0, y: 0, width: P.C * 10, height: P.R * 10, class: 'mz-bg' });
          Object.keys(visited).forEach(function (k) {
            var p = k.split(',').map(Number);
            add('rect', { x: p[1] * 10, y: p[0] * 10, width: 10, height: 10, class: 'mz-seen' });
          });
          var dpath = 'M0 0H' + P.C * 10 + 'V' + P.R * 10 + 'H0Z';
          for (r = 0; r < P.R; r++) for (c = 0; c < P.C; c++) {
            if (!(P.cells[r][c] & E) && c < P.C - 1) dpath += 'M' + (c * 10 + 10) + ' ' + r * 10 + 'v10';
            if (!(P.cells[r][c] & S) && r < P.R - 1) dpath += 'M' + c * 10 + ' ' + (r * 10 + 10) + 'h10';
          }
          add('path', { d: dpath, class: 'mz-wall', 'vector-effect': 'non-scaling-stroke' });
          if (helpPath) add('path', { d: helpPath.map(function (p, i) { return (i ? 'L' : 'M') + (p[1] * 10 + 5) + ' ' + (p[0] * 10 + 5); }).join(''), class: 'mz-help', 'vector-effect': 'non-scaling-stroke' });
          // fog hides the walls only: the house and the things to collect always show where to head
          if (sp.fog) for (r = 0; r < P.R; r++) for (c = 0; c < P.C; c++)
            if (!visible(r, c)) add('rect', { x: c * 10 - 0.6, y: r * 10 - 0.6, width: 11.2, height: 11.2, class: 'mz-fog' });
          var big = P.C <= 8 ? 7 : 8;
          P.items.forEach(function (it, i) { if (!got[i]) emoji(it.r, it.c, ICON[it.kind], big); });
          emoji(P.goal[0], P.goal[1], '🏠', big);
          if (need().some(function (it) { return it.kind === 'key'; })) emoji(P.goal[0] + 0.3, P.goal[1] + 0.25, '🔒', 4);
          add('circle', { cx: pos[1] * 10 + 5, cy: pos[0] * 10 + 5, r: 3.4, class: 'mz-tok', 'vector-effect': 'non-scaling-stroke' });
          [N, E, S, W].forEach(function (d) { arrows[d].disabled = done || !(P.cells[pos[0]][pos[1]] & d); });
          helpBtn.disabled = done;
          bag.textContent = P.items.filter(function (_, i) { return got[i]; }).map(function (it) { return ICON[it.kind]; }).join('');
        }
        function stopAt(r, c) {
          if (r === P.goal[0] && c === P.goal[1]) return true;
          return P.items.some(function (it, i) { return !got[i] && it.r === r && it.c === c; });
        }
        function walk(list) {
          if (!list.length) return;
          ctx.sound('tap');
          helpPath = null;
          list.forEach(function (p) {
            steps++;
            pos = p;
            visited[p[0] + ',' + p[1]] = true;
            P.items.forEach(function (it, i) {
              if (!got[i] && it.r === p[0] && it.c === p[1]) { got[i] = true; ctx.sound('note', 880); }
            });
          });
          var atHome = pos[0] === P.goal[0] && pos[1] === P.goal[1];
          if (atHome && !need().length) { finish(); return; }
          if (atHome) status(need().some(function (it) { return it.kind === 'key'; }) ? 'הבית נעול. צריך קודם את המפתח 🔑' : 'עוד לא. קודם אספו את הכוכבים ⭐');
          else status();
          draw();
        }
        function move(d) {
          if (done || !(P.cells[pos[0]][pos[1]] & d)) return;
          walk(slide(P, pos[0], pos[1], d, stopAt));
        }
        function tapMaze(ev) {
          if (done) return;
          var rect = svg.getBoundingClientRect();
          var unitX = rect.width / (P.C * 10 + 2), unitY = rect.height / (P.R * 10 + 2);
          var c = Math.floor(((ev.clientX - rect.left) / unitX - 1) / 10), r = Math.floor(((ev.clientY - rect.top) / unitY - 1) / 10);
          if (r < 0 || c < 0 || r >= P.R || c >= P.C || (r === pos[0] && c === pos[1])) return;
          if (r !== pos[0] && c !== pos[1]) { status('לחצו על משבצת באותה שורה או באותו טור של העיגול'); return; }
          var d = r < pos[0] ? N : r > pos[0] ? S : c > pos[1] ? E : W, list = [], cr = pos[0], cc = pos[1];
          while (cr !== r || cc !== c) {
            if (!(P.cells[cr][cc] & d)) { status('יש קיר בדרך'); return; }
            cr += DR[d]; cc += DC[d];
            list.push([cr, cc]);
            if (stopAt(cr, cc)) break;
          }
          walk(list);
        }
        function help() {
          if (done) return;
          helped = true;
          var left = need(), b = bfs(P.cells, pos[0], pos[1]), target = P.goal;
          if (left.length) { // the nearest thing still to collect
            left.sort(function (a, c) { return b.dist[a.r][a.c] - b.dist[c.r][c.c]; });
            target = [left[0].r, left[0].c];
          }
          helpPath = pathTo(b, target[0], target[1]);
          if (sp.fog) helpPath.forEach(function (p) { seen[p[0] + ',' + p[1]] = true; });
          status('הקו הצהוב מראה את הדרך');
          draw();
        }
        function finish() {
          done = true;
          draw();
          var ok = !helped && steps <= P.best * sp.slack;
          if (ok) solved++;
          ctx.setStatus(ok ? 'הגעתם הביתה! ' + steps + ' צעדים' : helped ? 'הגעתם הביתה, בעזרת הקו הצהוב' : 'הגעתם הביתה, בדרך ארוכה (' + steps + ' צעדים, הקצרה: ' + P.best + ')');
          ctx.feedback(ok, ok ? undefined : 'הגעתם! בפעם הבאה נסו דרך קצרה יותר').then(function () {
            pad.remove();
            var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { next.disabled = true; nextRound(); } },
              round >= ROUNDS ? 'לסיכום' : 'למבוך הבא');
            root.appendChild(el('div', { class: 'g-actions' }, next));
          });
        }
      }

      nextRound();
    }
  });
})();
