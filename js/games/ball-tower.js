/* מגדל הכדורים — Tower of London: plan moves to copy a target arrangement (executive). */
(function () {
  'use strict';

  // Three pegs: tall, middle, short.
  var CAPS = [3, 2, 1];
  // Ball colours come from skill hues; each also carries a symbol so colour is never the only cue.
  var BALLS = [
    { cls: 'bt-b0', sym: '▲', name: 'הכדור הכתום' },
    { cls: 'bt-b1', sym: '■', name: 'הכדור הכחול' },
    { cls: 'bt-b2', sym: '★', name: 'הכדור הירוק' }
  ];
  var PEG_NAMES = ['המוט הגבוה', 'המוט האמצעי', 'המוט הקצר'];

  // Per level (1–20): shortest solution length and how many extra moves still count as success.
  // Moves grow in small steps; the allowance shrinks at 7 and 14 so those are small steps too.
  var LEVELS = [
    { opt: 2, slack: 2 }, // 1
    { opt: 2, slack: 2 }, // 2
    { opt: 3, slack: 2 }, // 3
    { opt: 3, slack: 2 }, // 4
    { opt: 3, slack: 2 }, // 5
    { opt: 4, slack: 2 }, // 6
    { opt: 4, slack: 1 }, // 7
    { opt: 4, slack: 1 }, // 8
    { opt: 5, slack: 1 }, // 9
    { opt: 5, slack: 1 }, // 10
    { opt: 5, slack: 1 }, // 11
    { opt: 6, slack: 1 }, // 12
    { opt: 6, slack: 1 }, // 13
    { opt: 5, slack: 0 }, // 14
    { opt: 6, slack: 0 }, // 15
    { opt: 6, slack: 0 }, // 16
    { opt: 7, slack: 0 }, // 17
    { opt: 7, slack: 0 }, // 18
    { opt: 7, slack: 0 }, // 19
    { opt: 8, slack: 0 }  // 20
  ];

  /* --- puzzle generator --- */
  // A state is an array of three strings, one per peg, listing ball ids bottom → top ("02", "1", "").
  function keyOf(state) { return state.join('|'); }
  function fromKey(key) { return key.split('|'); }

  function allStates() {
    var out = [];
    var seen = {};
    var perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    for (var p = 0; p < perms.length; p++) {
      // split the ordered balls into three stacks within capacity
      for (var a = 0; a <= 3; a++) {
        for (var b = 0; a + b <= 3; b++) {
          var c = 3 - a - b;
          if (a > CAPS[0] || b > CAPS[1] || c > CAPS[2]) continue;
          var s = perms[p].join('');
          var k = s.slice(0, a) + '|' + s.slice(a, a + b) + '|' + s.slice(a + b);
          if (!seen[k]) { seen[k] = true; out.push(k); }
        }
      }
    }
    return out;
  }

  function neighbours(key) {
    var pegs = fromKey(key);
    var out = [];
    for (var a = 0; a < 3; a++) {
      if (!pegs[a].length) continue;
      for (var b = 0; b < 3; b++) {
        if (a === b || pegs[b].length >= CAPS[b]) continue;
        var n = pegs.slice();
        n[b] = n[b] + n[a].charAt(n[a].length - 1);
        n[a] = n[a].slice(0, -1);
        out.push(keyOf(n));
      }
    }
    return out;
  }

  // Breadth-first search from `start`: distance and parent for every reachable state.
  function bfs(start) {
    var dist = {}, parent = {};
    dist[start] = 0;
    var queue = [start];
    for (var i = 0; i < queue.length; i++) {
      var x = queue[i];
      var ns = neighbours(x);
      for (var j = 0; j < ns.length; j++) {
        if (!(ns[j] in dist)) { dist[ns[j]] = dist[x] + 1; parent[ns[j]] = x; queue.push(ns[j]); }
      }
    }
    return { dist: dist, parent: parent };
  }

  function shortestPath(from, to) {
    var r = bfs(from);
    if (!(to in r.dist)) return [];
    var path = [to];
    while (path[0] !== from) path.unshift(r.parent[path[0]]);
    return path;
  }

  var STATES = allStates();

  // Random start and target whose shortest solution is exactly `opt` moves. `used` avoids repeats.
  function makePuzzle(opt, used, shuffle) {
    var starts = shuffle(STATES);
    for (var s = 0; s < starts.length; s++) {
      var d = bfs(starts[s]).dist;
      var targets = [];
      for (var k in d) if (d[k] === opt && !used[starts[s] + '>' + k]) targets.push(k);
      if (targets.length) {
        var t = shuffle(targets)[0];
        used[starts[s] + '>' + t] = true;
        return { start: starts[s], target: t };
      }
    }
    return null;
  }
  /* --- end generator --- */

  var css = [
    '.bt-wrap{width:100%;display:flex;flex-direction:column;align-items:center;gap:.9rem;}',
    '.bt-top{display:flex;align-items:center;justify-content:center;gap:.8rem;width:100%;}',
    '.bt-info{display:flex;flex-direction:column;gap:.3rem;flex:1 1 0;min-width:0;max-width:12rem;}',
    '.bt-info .g-hint{font-size:1.1rem;line-height:1.35;margin:0;}',
    '.bt-target{flex:none;display:flex;flex-direction:column;align-items:center;gap:.25rem;padding:.4rem .8rem .6rem;',
    'background:var(--surface-2);border:2px solid var(--line);border-radius:var(--radius);}',
    '.bt-target-label{font-weight:700;color:var(--ink-soft);font-size:1rem;}',
    '.bt-pegs{display:flex;align-items:flex-end;justify-content:center;gap:.6rem;width:100%;max-width:24rem;',
    'border-bottom:7px solid var(--executive);border-radius:0 0 4px 4px;padding:0 .3rem;}',
    '.bt-peg{--ball:min(3.6rem,18vw);--gap:.3rem;flex:1 1 0;min-width:0;position:relative;display:flex;',
    'flex-direction:column-reverse;align-items:center;justify-content:flex-start;gap:var(--gap);',
    'padding:.3rem .2rem;height:calc(var(--cap) * (var(--ball) + var(--gap)) + 1.8rem);',
    'background:transparent;border:2px solid transparent;border-bottom:0;border-radius:var(--radius) var(--radius) 0 0;',
    'cursor:pointer;color:inherit;font:inherit;transition:background-color .2s,border-color .2s;}',
    '.bt-peg::before{content:"";position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:.55rem;',
    'height:calc(var(--cap) * (var(--ball) + var(--gap)) + .4rem);background:var(--executive-soft);',
    'border:2px solid var(--executive);border-bottom:0;border-radius:.4rem .4rem 0 0;}',
    '.bt-play .bt-peg:hover:not(:disabled){border-color:var(--line);}',
    '.bt-peg.is-from{background:var(--accent-soft);border-color:var(--accent);}',
    '.bt-peg.is-from:hover:not(:disabled){border-color:var(--accent);}',
    '.bt-peg:disabled{cursor:default;}',
    '.bt-ball{position:relative;z-index:1;flex:none;width:var(--ball);height:var(--ball);border-radius:50%;',
    'display:grid;place-items:center;color:var(--surface);font-size:calc(var(--ball) * .46);line-height:1;',
    'font-weight:900;border:2px solid var(--surface);transition:transform .15s;}',
    '.bt-b0{background:var(--attention);}',
    '.bt-b1{background:var(--logic);}',
    '.bt-b2{background:var(--language);}',
    '.bt-ball.is-lifted{transform:translateY(-1.1rem);outline:4px solid var(--sun);outline-offset:2px;}',
    '.bt-mini{width:8.5rem;max-width:8.5rem;gap:.45rem;border-bottom-width:4px;}',
    '.bt-mini .bt-peg{--ball:1.7rem;--gap:.15rem;cursor:default;padding:.15rem .1rem;',
    'height:calc(var(--cap) * (var(--ball) + var(--gap)) + .5rem);}',
    '.bt-mini .bt-peg::before{width:.35rem;border-width:1px;height:calc(var(--cap) * (var(--ball) + var(--gap)) + .25rem);}',
    '.bt-mini .bt-ball{border-width:1px;}',
    '.bt-count{font-size:1.2rem;line-height:1.4;font-weight:700;margin:0;font-variant-numeric:tabular-nums;}',
    '.bt-count span{display:block;white-space:nowrap;}',
    '.bt-play.is-solved .bt-pegs{border-bottom-color:var(--good);}'
  ].join('');

  BrainGames.register({
    id: 'ball-tower',
    name: 'מגדל הכדורים',
    skill: 'executive',
    tagline: 'סדרו את הכדורים כמו בתמונה',
    benefit: 'תכנון מראש וחשיבה כמה צעדים קדימה',
    instructions: [
      'למעלה מופיעה תמונה קטנה: כך הכדורים צריכים להיות מסודרים.',
      'לחצו על מוט כדי להרים את הכדור העליון, ואז על מוט אחר כדי להניח אותו.',
      'בכל מוט נכנס מספר מוגבל של כדורים. לחיצה על אותו מוט מבטלת.',
      'תכננו מראש ונסו להגיע לתמונה במעט מהלכים. אין מהירות, יש מחשבה.'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var opt = spec.opt, slack = spec.slack;
      var limit = opt + slack;
      var ROUNDS = opt >= 6 ? 5 : 6;

      var used = {};
      var round = 0;
      var score = 0;
      var perfect = 0;

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({
            correct: score,
            total: ROUNDS,
            note: 'פתרתם ' + score + ' מתוך ' + ROUNDS + ' חידות של ' + opt + ' מהלכים' +
              (perfect ? ' (' + perfect + ' במספר המהלכים המדויק)' : '')
          });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        playRound();
      }

      function drawPegs(container, state, pegButtons, lifted) {
        for (var p = 0; p < 3; p++) {
          var peg = pegButtons ? pegButtons[p] : el('div', { class: 'bt-peg', style: { '--cap': String(CAPS[p]) } });
          peg.innerHTML = '';
          var stack = state[p];
          for (var i = 0; i < stack.length; i++) {
            var b = BALLS[Number(stack.charAt(i))];
            var isTop = i === stack.length - 1;
            peg.appendChild(el('span', {
              class: 'bt-ball ' + b.cls + (lifted === p && isTop ? ' is-lifted' : ''),
              'aria-hidden': 'true'
            }, b.sym));
          }
          if (pegButtons) {
            peg.classList.toggle('is-from', lifted === p);
            var names = [];
            for (var j = stack.length - 1; j >= 0; j--) names.push(BALLS[Number(stack.charAt(j))].name);
            peg.setAttribute('aria-label', PEG_NAMES[p] + ' (' + stack.length + ' מתוך ' + CAPS[p] + '): ' +
              (names.length ? 'מלמעלה ' + names.join(', ') : 'ריק'));
          } else {
            container.appendChild(peg);
          }
        }
      }

      function describe(state) {
        var parts = [];
        for (var p = 0; p < 3; p++) {
          var names = [];
          for (var j = 0; j < state[p].length; j++) names.push(BALLS[Number(state[p].charAt(j))].name);
          parts.push(PEG_NAMES[p] + ': ' + (names.length ? 'מלמטה ' + names.join(', ') : 'ריק'));
        }
        return parts.join('. ');
      }

      function playRound() {
        root.innerHTML = '';
        var puzzle = makePuzzle(opt, used, ctx.shuffle) || makePuzzle(opt, {}, ctx.shuffle);
        var start = fromKey(puzzle.start);
        var target = fromKey(puzzle.target);
        var state = start.slice();
        var moves = 0;
        var held = null;
        var busy = false;

        var mini = el('div', { class: 'bt-pegs bt-mini', role: 'img', 'aria-label': 'המטרה. ' + describe(target) });
        drawPegs(mini, target, null, null);
        var targetBox = el('div', { class: 'bt-target' }, [
          el('span', { class: 'bt-target-label' }, 'המטרה'),
          mini
        ]);

        var pegs = CAPS.map(function (cap, p) {
          return el('button', {
            class: 'bt-peg', type: 'button', style: { '--cap': String(cap) },
            onclick: function () { onPeg(p); }
          });
        });
        var playPegs = el('div', { class: 'bt-pegs' }, pegs);
        var play = el('div', { class: 'bt-play bt-wrap' }, playPegs);

        var countLine = el('p', { class: 'bt-count', 'aria-live': 'polite' }, '');
        var hint = el('p', { class: 'g-hint' },
          slack > 0 ? 'הצלחה: עד ' + limit + ' מהלכים' : 'נסו בדיוק ב-' + opt);

        var resetBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: onReset }, 'התחלה מחדש');
        var skipBtn = el('button', { class: 'btn btn-quiet', type: 'button', hidden: true, onclick: onSkip }, 'דילוג');
        var actions = el('div', { class: 'g-actions' }, [resetBtn, skipBtn]);

        var top = el('div', { class: 'bt-top' }, [targetBox, el('div', { class: 'bt-info' }, [countLine, hint])]);
        root.appendChild(el('div', { class: 'bt-wrap' }, [top, play, actions]));

        ctx.setStatus('סדרו את הכדורים כמו בתמונה הקטנה');
        render();

        function render() {
          drawPegs(null, state, pegs, held);
          countLine.innerHTML = '';
          countLine.appendChild(el('span', null, 'מהלכים: ' + moves));
          countLine.appendChild(el('span', null, 'אפשר ב-' + opt));
        }

        function setLocked(locked) {
          busy = locked;
          pegs.forEach(function (b) { b.disabled = locked; });
          resetBtn.disabled = locked;
          skipBtn.disabled = locked;
        }

        function onPeg(p) {
          if (busy) return;
          if (held === null) {
            if (!state[p].length) { ctx.setStatus('במוט הזה אין כדור. בחרו מוט אחר'); return; }
            ctx.sound('tap');
            held = p;
            ctx.setStatus('לאן להעביר? לחצו על מוט אחר');
          } else if (held === p) {
            held = null;
            ctx.setStatus('בוטל. בחרו מוט להרים ממנו');
          } else if (state[p].length >= CAPS[p]) {
            ctx.setStatus('המוט הזה מלא. בחרו מוט אחר');
            return;
          } else {
            ctx.sound('tap');
            state[p] = state[p] + state[held].charAt(state[held].length - 1);
            state[held] = state[held].slice(0, -1);
            held = null;
            moves++;
            ctx.setStatus('סדרו את הכדורים כמו בתמונה הקטנה');
            if (moves > limit + 6) skipBtn.hidden = false;
          }
          render();
          if (keyOf(state) === puzzle.target) solved();
        }

        function onReset() {
          if (busy) return;
          ctx.sound('tap');
          state = start.slice();
          moves = 0;
          held = null;
          ctx.setStatus('מתחילים מחדש. תכננו בנחת');
          render();
        }

        function solved() {
          setLocked(true);
          play.classList.add('is-solved');
          var ok = moves <= limit;
          if (ok) score++;
          if (moves === opt) perfect++;
          var msg;
          if (moves === opt) msg = 'מושלם! בדיוק ' + opt + ' מהלכים';
          else if (ok) msg = 'כל הכבוד! פתרתם ב-' + moves + ' מהלכים';
          else msg = 'פתרתם ב-' + moves + ' מהלכים. אפשר גם ב-' + opt;
          ctx.setStatus(ok ? 'הצלחתם!' : 'פתרתם! נסו לתכנן קדימה');
          ctx.feedback(ok, msg).then(function () {
            return ctx.wait(900);
          }).then(nextRound);
        }

        // Show a shortest way from where the player is now, then move on (counts as not solved).
        function onSkip() {
          if (busy) return;
          setLocked(true);
          held = null;
          render();
          ctx.setStatus('הנה דרך קצרה לפתרון');
          var path = shortestPath(keyOf(state), puzzle.target);
          var i = 1;
          function step() {
            if (i >= path.length) {
              play.classList.add('is-solved');
              return ctx.wait(1400).then(nextRound);
            }
            return ctx.wait(900).then(function () {
              state = fromKey(path[i]);
              i++;
              ctx.sound('tap');
              render();
              return step();
            });
          }
          step();
        }
      }

      nextRound();
    }
  });
})();
