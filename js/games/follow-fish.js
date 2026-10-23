/* עקבו אחרי הדגים — follow a few marked fish while they all swim (attention, object tracking). */
(function () {
  'use strict';

  var ROUNDS = 6;

  // Per level (1–20): fish in the pond, how many to follow, swim time (ms),
  // speed (share of the pond width per second) and gentle wandering from level 11.
  // At most 8 big fish; past that, swim time and wandering grow instead. Speed barely moves.
  var LEVELS = [
    { n: 4, k: 1, ms: 4000, speed: 0.14, wander: 0 }, // 1
    { n: 5, k: 1, ms: 4000, speed: 0.14, wander: 0 }, // 2
    { n: 5, k: 2, ms: 4500, speed: 0.15, wander: 0 }, // 3
    { n: 6, k: 2, ms: 4500, speed: 0.15, wander: 0 }, // 4
    { n: 6, k: 2, ms: 5000, speed: 0.16, wander: 0 }, // 5
    { n: 6, k: 2, ms: 5500, speed: 0.16, wander: 0 }, // 6
    { n: 6, k: 3, ms: 5500, speed: 0.17, wander: 0 }, // 7
    { n: 7, k: 3, ms: 6000, speed: 0.17, wander: 0 }, // 8
    { n: 7, k: 3, ms: 6500, speed: 0.18, wander: 0 }, // 9
    { n: 7, k: 3, ms: 7000, speed: 0.18, wander: 0 }, // 10
    { n: 7, k: 3, ms: 7000, speed: 0.18, wander: 0.3 }, // 11
    { n: 8, k: 3, ms: 7500, speed: 0.19, wander: 0.4 }, // 12
    { n: 8, k: 3, ms: 8000, speed: 0.19, wander: 0.5 }, // 13
    { n: 8, k: 4, ms: 7500, speed: 0.19, wander: 0.4 }, // 14
    { n: 8, k: 4, ms: 8000, speed: 0.2, wander: 0.5 }, // 15
    { n: 8, k: 4, ms: 8500, speed: 0.2, wander: 0.6 }, // 16
    { n: 8, k: 4, ms: 8500, speed: 0.21, wander: 0.7 }, // 17
    { n: 8, k: 4, ms: 9000, speed: 0.21, wander: 0.8 }, // 18
    { n: 8, k: 4, ms: 9000, speed: 0.22, wander: 0.9 }, // 19
    { n: 8, k: 4, ms: 9000, speed: 0.22, wander: 1 }  // 20
  ];

  var STEP_MS = 550; // reduced motion: show a new position only this often

  function reducedMotion() {
    try { return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches); }
    catch (e) { return false; }
  }

  var css = [
    '.ff-pond{position:relative;width:100%;max-width:min(30rem,calc((100dvh - 21rem) * 4 / 3));aspect-ratio:4/3;border-radius:var(--radius);',
    'background:var(--attention-soft);border:2px solid var(--line);overflow:hidden;touch-action:manipulation;}',
    '.ff-fish{position:absolute;top:0;left:0;display:grid;place-items:center;padding:0;border-radius:50%;',
    'border:3px solid transparent;background:transparent;cursor:pointer;will-change:transform;',
    'transition:background-color .25s,border-color .25s;}',
    '.ff-fish:disabled{cursor:default;}',
    '.ff-body{display:block;line-height:1;pointer-events:none;}',
    '.ff-fish.ff-target{background:var(--sun);border-color:var(--sun);}',
    '.ff-fish.ff-picked{background:var(--surface);border-color:var(--attention);}',
    '.ff-fish.is-correct{background:var(--good-soft);border-color:var(--good);}',
    '.ff-fish.is-wrong{background:var(--bad-soft);border-color:var(--bad);}',
    '.ff-fish.ff-missed{background:var(--sun-soft);border:3px dashed var(--sun);}',
    '.ff-mark{position:absolute;top:-.35rem;inset-inline-end:-.35rem;min-width:1.5rem;height:1.5rem;border-radius:999px;',
    'display:grid;place-items:center;font-size:1rem;font-weight:900;background:var(--surface);color:var(--ink);',
    'border:2px solid currentColor;pointer-events:none;}',
    '.ff-fish.is-correct .ff-mark{color:var(--good);}',
    '.ff-fish.is-wrong .ff-mark{color:var(--bad);}',
    '.ff-count{font-size:1.2rem;font-weight:700;text-align:center;font-variant-numeric:tabular-nums;}'
  ].join('');

  BrainGames.register({
    id: 'follow-fish',
    name: 'עקבו אחרי הדגים',
    skill: 'attention',
    startLevel: 1,
    tagline: 'עקבו בעיניים אחרי הדגים המסומנים',
    benefit: 'קשב מתמשך ומעקב אחרי כמה דברים יחד',
    instructions: [
      'כמה דגים יסומנו בצהוב. זכרו אותם ולחצו "מוכנים".',
      'כל הדגים ייראו אותו דבר וישחו לאט בבריכה. עקבו בעיניים אחרי הדגים שלכם.',
      'כשהדגים יעצרו, לחצו על הדגים שעקבתם אחריהם.',
      'אין מגבלת זמן לבחירה. קחו את הזמן.'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var N = spec.n, K = spec.k;
      var calm = reducedMotion();

      var round = 0;
      var score = 0;
      var rafId = null;
      var dead = false;

      function stopLoop() {
        if (rafId !== null) { window.cancelAnimationFrame(rafId); rafId = null; }
      }

      function nextRound() {
        if (dead || !ctx.isActive()) return;
        if (round >= ROUNDS) {
          ctx.finish({
            correct: score,
            total: ROUNDS,
            note: 'עקבתם נכון ' + score + ' מתוך ' + ROUNDS + ' פעמים אחרי ' +
              (K === 1 ? 'דג אחד' : K + ' דגים') + ' מתוך ' + N
          });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        playRound();
      }

      function playRound() {
        root.innerHTML = '';
        stopLoop();

        var pond = el('div', { class: 'ff-pond', role: 'group', 'aria-label': 'בריכה' });
        var countLine = el('p', { class: 'ff-count', 'aria-live': 'polite' }, '');
        var readyBtn = el('button', { class: 'btn btn-primary btn-lg', type: 'button' }, 'מוכנים');
        var actions = el('div', { class: 'g-actions' }, readyBtn);
        root.appendChild(pond);
        root.appendChild(countLine);
        root.appendChild(actions);

        var W = pond.clientWidth || 300;
        var H = pond.clientHeight || Math.round(W * 0.75);
        // Hit area at least 56px; a little larger in roomy ponds.
        var size = Math.max(56, Math.min(68, Math.floor(W / 5.5)));
        var r = size / 2;
        var speed = spec.speed * W; // px per second

        var targets = {};
        ctx.shuffle(range(N)).slice(0, K).forEach(function (i) { targets[i] = true; });

        var fish = placeFish(N, W, H, r).map(function (p, i) {
          var a = Math.random() * Math.PI * 2;
          var btn = el('button', {
            class: 'ff-fish', type: 'button', disabled: true, 'aria-label': 'דג',
            style: { width: size + 'px', height: size + 'px' },
            onclick: function () { onTap(i); }
          }, el('span', { class: 'ff-body', 'aria-hidden': 'true', style: { fontSize: Math.round(size * 0.62) + 'px' } }, '🐟'));
          pond.appendChild(btn);
          return { x: p.x, y: p.y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, turn: 0, btn: btn, body: btn.firstChild };
        });
        render();

        // Study phase: the marked fish are shown until the player is ready.
        ctx.setStatus(K === 1 ? 'זכרו את הדג הצהוב' : 'זכרו את ' + K + ' הדגים הצהובים');
        countLine.textContent = K === 1 ? 'עקבו אחרי דג אחד' : 'עקבו אחרי ' + K + ' דגים';
        fish.forEach(function (f, i) { if (targets[i]) f.btn.classList.add('ff-target'); });

        var started = false;
        readyBtn.addEventListener('click', function () {
          if (started) return;
          started = true;
          actions.hidden = true;
          fish.forEach(function (f) { f.btn.classList.remove('ff-target'); });
          ctx.setStatus('עקבו בעיניים אחרי הדגים שלכם');
          countLine.textContent = 'הדגים שוחים…';
          ctx.wait(700).then(swim);
        });
        ctx.studyTimer(readyBtn, 4000 + 1000 * K);

        function render() {
          fish.forEach(function (f) {
            f.btn.style.transform = 'translate(' + (f.x - r).toFixed(1) + 'px,' + (f.y - r).toFixed(1) + 'px)';
            // The emoji faces left; mirror it when swimming right.
            f.body.style.transform = f.vx > 0 ? 'scaleX(-1)' : 'none';
          });
        }

        function physics(dt) { // dt in seconds
          fish.forEach(function (f) {
            if (spec.wander) {
              // a slowly drifting turn rate keeps the path smooth
              f.turn += (Math.random() - 0.5) * 4 * dt;
              f.turn = Math.max(-spec.wander, Math.min(spec.wander, f.turn));
              var c = Math.cos(f.turn * dt), s = Math.sin(f.turn * dt);
              var vx = f.vx * c - f.vy * s;
              f.vy = f.vx * s + f.vy * c;
              f.vx = vx;
            }
            f.x += f.vx * dt;
            f.y += f.vy * dt;
            if (f.x < r) { f.x = r; f.vx = Math.abs(f.vx); }
            if (f.x > W - r) { f.x = W - r; f.vx = -Math.abs(f.vx); }
            if (f.y < r) { f.y = r; f.vy = Math.abs(f.vy); }
            if (f.y > H - r) { f.y = H - r; f.vy = -Math.abs(f.vy); }
          });
          // Fish bump into each other gently instead of overlapping (equal-mass elastic bounce).
          for (var a = 0; a < fish.length; a++) {
            for (var b = a + 1; b < fish.length; b++) {
              var p = fish[a], q = fish[b];
              var dx = q.x - p.x, dy = q.y - p.y;
              var d = Math.sqrt(dx * dx + dy * dy);
              var min = 2 * r;
              if (d < min && d > 0.0001) {
                var nx = dx / d, ny = dy / d;
                var push = (min - d) / 2;
                p.x -= nx * push; p.y -= ny * push;
                q.x += nx * push; q.y += ny * push;
                var rel = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny;
                if (rel > 0) {
                  p.vx -= rel * nx; p.vy -= rel * ny;
                  q.vx += rel * nx; q.vy += rel * ny;
                }
              }
            }
          }
          fish.forEach(function (f) {
            f.x = Math.max(r, Math.min(W - r, f.x));
            f.y = Math.max(r, Math.min(H - r, f.y));
          });
        }

        function swim() {
          var elapsed = 0, last = null, sinceDraw = 0;
          function frame(t) {
            rafId = null;
            if (dead || !ctx.isActive()) return;
            // Hidden tabs pause rAF; clamping dt means no jump and no lost swim time.
            var dtMs = last === null ? 16 : Math.max(0, Math.min(50, t - last));
            last = t;
            elapsed += dtMs;
            var steps = Math.max(1, Math.ceil(dtMs / 17));
            for (var s = 0; s < steps; s++) physics(dtMs / 1000 / steps);
            sinceDraw += dtMs;
            if (!calm || sinceDraw >= STEP_MS) { sinceDraw = 0; render(); }
            if (elapsed >= spec.ms) { render(); stopSwim(); return; }
            rafId = window.requestAnimationFrame(frame);
          }
          rafId = window.requestAnimationFrame(frame);
        }

        var picked = {};
        var pickedCount = 0;
        var accepting = false;

        function stopSwim() {
          ctx.setStatus(K === 1 ? 'לחצו על הדג שעקבתם אחריו' : 'לחצו על ' + K + ' הדגים שעקבתם אחריהם');
          updateCount();
          fish.forEach(function (f) { f.btn.disabled = false; });
          accepting = true;
        }

        function updateCount() {
          countLine.textContent = 'בחרתם ' + pickedCount + ' מתוך ' + K;
        }

        function onTap(i) {
          if (!accepting) return;
          ctx.sound('tap');
          if (picked[i]) {
            delete picked[i];
            pickedCount--;
            fish[i].btn.classList.remove('ff-picked');
          } else {
            picked[i] = true;
            pickedCount++;
            fish[i].btn.classList.add('ff-picked');
          }
          updateCount();
          if (pickedCount >= K) check();
        }

        function check() {
          accepting = false;
          fish.forEach(function (f) { f.btn.disabled = true; });
          ctx.wait(400).then(function () {
            var hits = 0;
            fish.forEach(function (f, i) {
              f.btn.classList.remove('ff-picked');
              var mark = null;
              if (picked[i] && targets[i]) { f.btn.classList.add('is-correct'); mark = '✓'; hits++; }
              else if (picked[i]) { f.btn.classList.add('is-wrong'); mark = '✗'; }
              else if (targets[i]) { f.btn.classList.add('ff-missed'); }
              if (mark) f.btn.appendChild(el('span', { class: 'ff-mark', 'aria-hidden': 'true' }, mark));
            });
            var ok = hits === K;
            if (ok) score++;
            countLine.textContent = 'מצאתם ' + hits + ' מתוך ' + K;
            ctx.setStatus(ok ? 'מצוין!' : 'המסגרת המקווקוות: הדגים שלכם');
            return ctx.feedback(ok, ok ? undefined : 'מצאתם ' + hits + ' מתוך ' + K);
          }).then(function () {
            return ctx.wait(1300);
          }).then(nextRound);
        }
      }

      nextRound();

      return function cleanup() {
        dead = true;
        stopLoop();
      };
    }
  });

  function range(n) {
    var a = [];
    for (var i = 0; i < n; i++) a.push(i);
    return a;
  }

  // Random spots that don't overlap; falls back to an even spread.
  function placeFish(n, W, H, r) {
    for (var attempt = 0; attempt < 60; attempt++) {
      var pts = [];
      for (var tries = 0; tries < 400 && pts.length < n; tries++) {
        var p = { x: r + Math.random() * (W - 2 * r), y: r + Math.random() * (H - 2 * r) };
        var ok = pts.every(function (q) {
          var dx = p.x - q.x, dy = p.y - q.y;
          return dx * dx + dy * dy >= (2 * r + 6) * (2 * r + 6);
        });
        if (ok) pts.push(p);
      }
      if (pts.length === n) return pts;
    }
    var cols = Math.ceil(Math.sqrt(n * W / H)), rows = Math.ceil(n / cols);
    var out = [];
    for (var i = 0; i < n; i++) {
      out.push({
        x: r + (W - 2 * r) * ((i % cols) + 0.5) / cols,
        y: r + (H - 2 * r) * (Math.floor(i / cols) + 0.5) / rows
      });
    }
    return out;
  }
})();
