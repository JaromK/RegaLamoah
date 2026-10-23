/* מסלול חלוקה — plan a short route that delivers every parcel and returns to the depot (executive, planning). */
(function () {
  'use strict';

  var ROUNDS = 5;

  // Per level (1–20): grid columns × rows, houses to deliver to, blocked cells (trees),
  // and how many extra steps beyond the shortest route still count as a good route.
  // Per level (1–20): grid columns × rows (never more than 5 × 5, so cells stay big),
  // houses to deliver to, blocked cells (trees), and how many extra steps beyond the
  // shortest route still count as a good route. From level 16 the maps are picked so that
  // "always go to the nearest house" is NOT the shortest route — real planning is needed.
  var LEVELS = [
    { cols: 4, rows: 4, k: 1, walls: 1, slack: 4 }, // 1
    { cols: 4, rows: 4, k: 2, walls: 2, slack: 4 }, // 2
    { cols: 4, rows: 4, k: 2, walls: 3, slack: 3 }, // 3
    { cols: 5, rows: 4, k: 2, walls: 3, slack: 3 }, // 4
    { cols: 5, rows: 4, k: 3, walls: 3, slack: 3 }, // 5
    { cols: 5, rows: 5, k: 3, walls: 3, slack: 2 }, // 6
    { cols: 5, rows: 5, k: 3, walls: 4, slack: 2 }, // 7
    { cols: 5, rows: 5, k: 3, walls: 5, slack: 2 }, // 8
    { cols: 5, rows: 5, k: 4, walls: 4, slack: 2 }, // 9
    { cols: 5, rows: 5, k: 4, walls: 5, slack: 2 }, // 10
    { cols: 5, rows: 5, k: 4, walls: 6, slack: 1 }, // 11
    { cols: 5, rows: 5, k: 4, walls: 7, slack: 1 }, // 12
    { cols: 5, rows: 5, k: 5, walls: 5, slack: 1 }, // 13
    { cols: 5, rows: 5, k: 5, walls: 6, slack: 1 }, // 14
    { cols: 5, rows: 5, k: 5, walls: 7, slack: 1 }, // 15
    { cols: 5, rows: 5, k: 5, walls: 6, slack: 0, tricky: true }, // 16
    { cols: 5, rows: 5, k: 5, walls: 7, slack: 0, tricky: true }, // 17
    { cols: 5, rows: 5, k: 5, walls: 8, slack: 0, tricky: true }, // 18
    { cols: 5, rows: 5, k: 5, walls: 8, slack: 0, tricky: true }, // 19
    { cols: 5, rows: 5, k: 5, walls: 9, slack: 0, tricky: true }  // 20
  ];

  /* ---------- map helpers (pure) ---------- */

  function neighbours(i, cols, rows) {
    var r = Math.floor(i / cols), c = i % cols, out = [];
    if (r > 0) out.push(i - cols);
    if (r < rows - 1) out.push(i + cols);
    if (c > 0) out.push(i - 1);
    if (c < cols - 1) out.push(i + 1);
    return out;
  }

  // Shortest distances (and parents for path rebuilding) from `start` over open cells.
  function bfs(start, open, cols, rows) {
    var dist = [], par = [];
    for (var i = 0; i < open.length; i++) { dist.push(-1); par.push(-1); }
    dist[start] = 0;
    var queue = [start];
    for (var h = 0; h < queue.length; h++) {
      var u = queue[h];
      neighbours(u, cols, rows).forEach(function (v) {
        if (open[v] && dist[v] < 0) { dist[v] = dist[u] + 1; par[v] = u; queue.push(v); }
      });
    }
    return { dist: dist, par: par };
  }

  function permutations(arr) {
    if (arr.length <= 1) return [arr.slice()];
    var out = [];
    arr.forEach(function (x, i) {
      var rest = arr.slice(0, i).concat(arr.slice(i + 1));
      permutations(rest).forEach(function (p) { out.push([x].concat(p)); });
    });
    return out;
  }

  // Shortest tour depot → all houses → depot. Returns { steps, order }.
  function bestTour(depot, houses, open, cols, rows) {
    var keys = [depot].concat(houses);
    var D = keys.map(function (k) { return bfs(k, open, cols, rows).dist; });
    var best = null;
    permutations(houses.map(function (_, i) { return i + 1; })).forEach(function (perm) {
      var at = 0, sum = 0;
      perm.forEach(function (j) { sum += D[at][keys[j]]; at = j; });
      sum += D[at][depot];
      if (!best || sum < best.steps) best = { steps: sum, order: perm.map(function (j) { return keys[j]; }) };
    });
    return best;
  }

  // Steps when always heading to the nearest remaining house (a tempting shortcut).
  function greedyTour(depot, houses, open, cols, rows) {
    var left = houses.slice(), at = depot, sum = 0;
    while (left.length) {
      var d = bfs(at, open, cols, rows).dist;
      left.sort(function (a, b) { return d[a] - d[b]; });
      sum += d[left[0]];
      at = left.shift();
    }
    return sum + bfs(at, open, cols, rows).dist[depot];
  }

  // Cell-by-cell walk for a tour order (depot excluded at start, included at the end).
  function tourPath(depot, order, open, cols, rows) {
    var path = [], at = depot;
    order.concat([depot]).forEach(function (goal) {
      var par = bfs(goal, open, cols, rows).par; // walk from `at` toward `goal` along parents
      var u = at;
      while (u !== goal) { u = par[u]; path.push(u); }
      at = goal;
    });
    return path;
  }

  function makeMap(spec, cols, rows, rand) {
    var n = cols * rows;
    var k = Math.min(spec.k, 5);
    for (var attempt = 0; attempt < 400; attempt++) {
      var open = [];
      for (var i = 0; i < n; i++) open.push(true);
      var cells = rand.shuffle(rangeArr(n));
      var walls = Math.min(spec.walls, n - k - 3);
      cells.slice(0, walls).forEach(function (c) { open[c] = false; });
      var free = cells.slice(walls);
      var depot = free[0];
      var reach = bfs(depot, open, cols, rows).dist;
      // every open cell must be reachable from the depot
      if (!open.every(function (o, c) { return !o || reach[c] >= 0; })) continue;
      // houses: not next to the depot, and not touching each other when possible
      var pool = rand.shuffle(free.slice(1).filter(function (c) { return reach[c] >= 2; }));
      var houses = [];
      pool.forEach(function (c) {
        if (houses.length >= k) return;
        var close = houses.some(function (h) { return neighbours(h, cols, rows).indexOf(c) >= 0; });
        if (!close || attempt > 200) houses.push(c);
      });
      if (houses.length < k) continue;
      var tour = bestTour(depot, houses, open, cols, rows);
      // skip maps where the route is trivially just "there and back" for multi-house levels
      if (k >= 2 && tour.steps < 2 * k + 2 && attempt < 300) continue;
      if (spec.tricky && attempt < 300 && greedyTour(depot, houses, open, cols, rows) <= tour.steps) continue;
      return { open: open, depot: depot, houses: houses, tour: tour };
    }
    return null;
  }

  function rangeArr(n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(i);
    return a;
  }

  var css = [
    '.dr-grid{--rows:5;gap:.4rem;max-width:min(22rem,calc((100dvh - 18rem) * var(--cols) / var(--rows)));}',
    '.dr-cell{position:relative;background:var(--surface);font-size:clamp(1.5rem,7vw,2.1rem);line-height:1;}',
    '.dr-cell.dr-wall{background:var(--surface-2);border-color:var(--surface-2);}',
    '.dr-cell.dr-depot{background:var(--executive-soft);border-color:var(--executive);}',
    '.dr-cell.dr-house{background:var(--sun-soft);border-color:var(--sun);}',
    '.dr-cell.dr-done{background:var(--good-soft);border-color:var(--good);}',
    '.dr-cell.dr-next{border:3px dashed var(--accent);background:var(--accent-soft);}',
    '.dr-cell.dr-house.dr-next{background:var(--sun-soft);}',
    '.dr-cell.dr-goal{border:3px solid var(--executive);}',
    '.dr-cell.dr-walked::after{content:"";position:absolute;width:22%;height:22%;border-radius:50%;',
    'background:var(--executive);opacity:.35;bottom:8%;inset-inline-start:8%;}',
    '.dr-cell.dr-path{box-shadow:inset 0 0 0 4px var(--good);}',
    '.dr-badge{position:absolute;top:2px;inset-inline-end:2px;font-size:.55em;line-height:1;}',
    '.dr-bike{position:absolute;inset:0;display:grid;place-items:center;font-size:1.05em;',
    'background:var(--surface);border-radius:calc(var(--radius-sm) - 2px);box-shadow:inset 0 0 0 3px var(--executive);}',
    '.dr-actions{flex-wrap:nowrap;width:100%;max-width:22rem;}',
    '.dr-actions .btn{flex:1 1 0;min-width:0;padding-inline:.5rem;}'
  ].join('');

  BrainGames.register({
    id: 'delivery-route',
    name: 'מסלול חלוקה',
    skill: 'executive',
    tagline: 'תכננו את הדרך הקצרה לחלוקת החבילות',
    benefit: 'תכנון מראש וחשיבה כמה צעדים קדימה',
    instructions: [
      'האופניים יוצאים מהסניף 🏤. כל בית עם 📦 מחכה לחבילה.',
      'לחצו על משבצת שכנה כדי לנסוע אליה. אי אפשר לעבור דרך עצים.',
      'בקרו בכל הבתים וחזרו לסניף בכמה שפחות צעדים.',
      'אפשר לחזור צעד אחורה או להתחיל מחדש בכל רגע.'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var cols = spec.cols, rows = spec.rows;
      var slack = spec.slack;
      var rand = { shuffle: ctx.shuffle };

      var round = 0;
      var score = 0;

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({
            correct: score,
            total: ROUNDS,
            note: 'תכננתם מסלול קצר ב-' + score + ' מתוך ' + ROUNDS + ' מפות'
          });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        playRound();
      }

      function playRound() {
        root.innerHTML = '';
        var map = makeMap(spec, cols, rows, rand) ||
          makeMap({ k: spec.k, walls: 0, slack: spec.slack }, cols, rows, rand);
        var n = cols * rows;
        var open = map.open, depot = map.depot;
        var isHouse = {};
        map.houses.forEach(function (h) { isHouse[h] = true; });
        var best = map.tour.steps;
        var K = map.houses.length;

        var pos = depot;
        var trail = [depot];     // cells visited, in order
        var delivered = {};
        var accepting = true;

        var cells = rangeArr(n).map(function (i) {
          var r = Math.floor(i / cols) + 1, c = (i % cols) + 1;
          return el('button', {
            class: 'g-tile dr-cell', type: 'button',
            'data-cell': open[i] ? (i === depot ? 'depot' : (isHouse[i] ? 'house' : 'road')) : 'wall',
            'aria-label': 'שורה ' + r + ', טור ' + c,
            onclick: function () { onTap(i); }
          });
        });
        var grid = el('div', { class: 'g-grid dr-grid', style: { '--cols': cols, '--rows': rows } }, cells);
        var undoBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: undo }, 'צעד אחורה');
        var resetBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: reset }, 'התחלה מחדש');
        var actions = el('div', { class: 'g-actions dr-actions' }, [undoBtn, resetBtn]);

        root.appendChild(grid);
        root.appendChild(actions);

        draw();

        function steps() { return trail.length - 1; }

        function recompute() {
          delivered = {};
          trail.forEach(function (c) { if (isHouse[c]) delivered[c] = true; });
          pos = trail[trail.length - 1];
        }

        function remaining() {
          return map.houses.filter(function (h) { return !delivered[h]; }).length;
        }

        function draw() {
          var next = {};
          if (accepting) neighbours(pos, cols, rows).forEach(function (v) { if (open[v]) next[v] = true; });
          var walked = {};
          trail.forEach(function (c) { walked[c] = true; });
          cells.forEach(function (b, i) {
            b.className = 'g-tile dr-cell';
            b.innerHTML = '';
            if (!open[i]) { b.classList.add('dr-wall'); b.textContent = '🌳'; b.disabled = true; return; }
            if (i === depot) { b.classList.add('dr-depot'); b.appendChild(el('span', { 'aria-hidden': 'true' }, '🏤')); }
            else if (isHouse[i]) {
              b.classList.add(delivered[i] ? 'dr-done' : 'dr-house');
              b.appendChild(el('span', { 'aria-hidden': 'true' }, '🏠'));
              b.appendChild(el('span', { class: 'dr-badge', 'aria-hidden': 'true' }, delivered[i] ? '✓' : '📦'));
            } else if (walked[i]) b.classList.add('dr-walked');
            if (next[i]) b.classList.add('dr-next');
            if (i === pos) b.appendChild(el('span', { class: 'dr-bike', 'aria-hidden': 'true' }, '🚲'));
            b.disabled = !next[i];
          });
          if (accepting) {
            var left = remaining();
            if (left === 0 && pos !== depot) cells[depot].classList.add('dr-goal');
            ctx.setStatus((left === 0 ? 'חזרו לסניף · ' : '') + 'צעדים: ' + steps() + ' · אפשר ב-' + best);
          }
          undoBtn.disabled = !accepting || trail.length <= 1;
          resetBtn.disabled = !accepting || trail.length <= 1;
        }

        function onTap(i) {
          if (!accepting || !open[i]) return;
          if (neighbours(pos, cols, rows).indexOf(i) < 0) return;
          var fresh = isHouse[i] && !delivered[i];
          trail.push(i);
          recompute();
          ctx.sound(fresh ? 'good' : 'tap');
          if (pos === depot && remaining() === 0) { accepting = false; draw(); finishRound(); return; }
          draw();
        }

        function undo() {
          if (!accepting || trail.length <= 1) return;
          trail.pop();
          recompute();
          ctx.sound('tap');
          draw();
        }

        function reset() {
          if (!accepting) return;
          trail = [depot];
          recompute();
          draw();
        }

        function finishRound() {
          var s = steps();
          var ok = s <= best + slack;
          if (ok) score++;
          var msg;
          if (s === best) msg = 'מסלול מושלם! ' + s + ' צעדים';
          else if (ok) msg = 'יפה! ' + s + ' צעדים (אפשר ב-' + best + ')';
          else msg = 'הגעתם ב-' + s + ' צעדים. אפשר היה ב-' + best;
          if (!ok) {
            // Show one shortest route.
            tourPath(depot, map.tour.order, open, cols, rows).forEach(function (c) { cells[c].classList.add('dr-path'); });
            ctx.setStatus('המסגרת הירוקה מראה דרך קצרה');
          } else {
            ctx.setStatus(s === best ? 'מסלול מושלם!' : 'כל החבילות נמסרו!');
          }
          ctx.feedback(ok, ok ? (s === best ? 'מסלול מושלם!' : undefined) : msg).then(function () {
            ctx.setStatus(msg);
            return ctx.wait(ok ? 900 : 2200);
          }).then(nextRound);
        }
      }

      nextRound();
    }
  });
})();
