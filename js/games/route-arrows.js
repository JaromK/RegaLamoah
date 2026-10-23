/*
 * מסלול — follow direction steps on a small map and say where you arrive.
 */
(function () {
  'use strict';

  var ROUNDS = 7;

  function clampLevel(l) {
    l = Math.round(Number(l));
    if (!isFinite(l)) l = 3;
    return Math.max(1, Math.min(20, l));
  }

  var LANDMARKS = [
    { e: '🏠', n: 'בית' }, { e: '🏪', n: 'מכולת' }, { e: '🌳', n: 'עץ' }, { e: '⛲', n: 'מזרקה' },
    { e: '🏥', n: 'בית חולים' }, { e: '🏫', n: 'בית ספר' }, { e: '🏦', n: 'בנק' }, { e: '🏤', n: 'דואר' },
    { e: '🎡', n: 'גלגל ענק' }, { e: '🏨', n: 'מלון' }, { e: '🌷', n: 'גינה' }, { e: '🏰', n: 'טירה' },
    { e: '🍦', n: 'גלידרייה' }, { e: '🚏', n: 'תחנת אוטובוס' }
  ];

  /* 0 up, 1 right, 2 down, 3 left — real screen directions. */
  var DR = [-1, 0, 1, 0], DC = [0, 1, 0, -1];
  var DIR_NAME = ['למעלה', 'ימינה', 'למטה', 'שמאלה'];
  var FACE_NAME = ['למעלה', 'ימינה', 'למטה', 'שמאלה'];

  var STEPS = [0, 2, 2, 3, 3, 3, 4, 4, 4, 5, 5, 5, 6, 6, 6, 7, 4, 5, 5, 6, 7];

  function params(L) {
    return {
      N: L <= 5 ? 4 : L <= 11 ? 5 : 6,
      steps: STEPS[L],
      maxDist: L <= 8 ? 2 : 3,
      relative: L >= 16,
      extra: L <= 2 ? 0 : L <= 5 ? 1 : L <= 11 ? 2 : L <= 15 ? 3 : 4
    };
  }

  function inside(N, r, c) { return r >= 0 && c >= 0 && r < N && c < N; }

  /* Walk a list of absolute moves; returns end cell or null if it leaves the grid. */
  function walk(N, r, c, moves, flipC, flipR) {
    for (var i = 0; i < moves.length; i++) {
      var d = moves[i].dir;
      r += (flipR ? -DR[d] : DR[d]) * moves[i].n;
      c += (flipC ? -DC[d] : DC[d]) * moves[i].n;
      if (!inside(N, r, c)) return null;
    }
    return [r, c];
  }

  function buildRoute(P, R) {
    var N = P.N;
    for (var attempt = 0; attempt < 200; attempt++) {
      var r = R.randInt(0, N - 1), c = R.randInt(0, N - 1);
      var start = [r, c];
      var facing = R.randInt(0, 3);
      var moves = [];
      var path = [[r, c]];
      var prev = -1;
      var ok = true;
      for (var s = 0; s < P.steps; s++) {
        var options = [];
        var turns = P.relative ? (s === 0 ? ['none', 'right', 'left'] : ['right', 'left']) : [null];
        var dirs = P.relative ? [] : [0, 1, 2, 3].filter(function (d) { return prev < 0 || (d !== prev && d !== (prev + 2) % 4); });
        if (P.relative) {
          turns.forEach(function (t) {
            var d = t === 'none' ? facing : t === 'right' ? (facing + 1) % 4 : (facing + 3) % 4;
            dirs.push(d);
          });
        }
        dirs.forEach(function (d, i) {
          var room = 0;
          while (inside(N, r + DR[d] * (room + 1), c + DC[d] * (room + 1))) room++;
          if (room > 0) options.push({ dir: d, turn: P.relative ? turns[i] : null, room: room });
        });
        if (!options.length) { ok = false; break; }
        var o = R.pick(options);
        var n = R.randInt(1, Math.min(P.maxDist, o.room));
        for (var k = 0; k < n; k++) { r += DR[o.dir]; c += DC[o.dir]; path.push([r, c]); }
        moves.push({ dir: o.dir, n: n, turn: o.turn });
        facing = o.dir;
        prev = o.dir;
      }
      if (!ok || (r === start[0] && c === start[1])) continue;
      return { start: start, facing0: P.relative ? (moves[0].turn === 'none' ? moves[0].dir : (moves[0].turn === 'right' ? (moves[0].dir + 3) % 4 : (moves[0].dir + 1) % 4)) : null, moves: moves, path: path, end: [r, c] };
    }
    return null;
  }

  function makeQuestion(level, R) {
    var L = clampLevel(level);
    var P = params(L);
    var route = null;
    while (!route) route = buildRoute(P, R);
    var N = P.N;
    var key = function (rc) { return rc[0] * N + rc[1]; };
    var startK = key(route.start), endK = key(route.end);

    // likely mistakes
    var mv = route.moves;
    var cands = [];
    cands.push(walk(N, route.start[0], route.start[1], mv.slice(0, -1)));          // stopped one step early
    cands.push(walk(N, route.start[0], route.start[1], mv, true, false));          // left/right swapped
    cands.push(walk(N, route.start[0], route.start[1], mv, false, true));          // up/down swapped
    var last = mv[mv.length - 1];
    var more = mv.slice(0, -1).concat([{ dir: last.dir, n: last.n + 1 }]);
    var less = mv.slice(0, -1).concat([{ dir: last.dir, n: last.n - 1 }]);
    cands.push(walk(N, route.start[0], route.start[1], R.randInt(0, 1) ? more : less));
    if (mv.length > 1) {
      var mid = mv.slice(); var j = R.randInt(0, mv.length - 2);
      mid[j] = { dir: mid[j].dir, n: mid[j].n + (R.randInt(0, 1) ? 1 : -1) };
      cands.push(walk(N, route.start[0], route.start[1], mid));
    }
    var used = {}; used[startK] = true; used[endK] = true;
    var dis = [];
    R.shuffle(cands.slice(0, 3)).concat(cands.slice(3)).forEach(function (rc) {
      if (!rc || dis.length >= 3) return;
      var k = key(rc);
      if (!used[k]) { used[k] = true; dis.push(k); }
    });
    var free = [];
    for (var i = 0; i < N * N; i++) if (!used[i]) free.push(i);
    free = R.shuffle(free);
    while (dis.length < 3) { var f = free.shift(); used[f] = true; dis.push(f); }

    var lms = R.shuffle(LANDMARKS.slice());
    var cells = {};
    cells[endK] = lms[0];
    dis.forEach(function (k, idx) { cells[k] = lms[idx + 1]; });
    var extra = Math.min(P.extra, free.length, lms.length - 4);
    for (var x = 0; x < extra; x++) cells[free[x]] = lms[4 + x];

    return {
      level: L, N: N, start: route.start, startK: startK, end: route.end, endK: endK,
      relative: P.relative, facing: route.facing0, moves: mv, path: route.path,
      cells: cells, answer: lms[0],
      choices: R.shuffle([lms[0], lms[1], lms[2], lms[3]])
    };
  }

  /* ---------- icons (SVG, colors via currentColor) ---------- */
  function arrowSvg(dir) {
    return '<svg class="ra-ico" viewBox="0 0 24 24" aria-hidden="true" style="transform:rotate(' + (dir * 90) + 'deg)">' +
      '<path d="M12 20V5M5.5 11.5 12 5l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function turnSvg(turn) {
    var d = turn === 'right' ? 'M7 21v-8a4 4 0 0 1 4-4h9M15 4l5 5-5 5' : 'M17 21v-8a4 4 0 0 0-4-4H4M9 4 4 9l5 5';
    return '<svg class="ra-ico" viewBox="0 0 24 24" aria-hidden="true"><path d="' + d +
      '" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }
  function cellsWord(n) { return n === 1 ? 'משבצת אחת' : n + ' משבצות'; }

  function stepParts(m, relative) {
    if (!relative) return { icon: arrowSvg(m.dir), text: DIR_NAME[m.dir] + ' ', count: cellsWord(m.n) };
    if (m.turn === 'none') return { icon: arrowSvg(0), text: 'ישר קדימה ', count: cellsWord(m.n) };
    return { icon: turnSvg(m.turn), text: (m.turn === 'right' ? 'פנו ימינה' : 'פנו שמאלה') + ' והתקדמו ', count: cellsWord(m.n) };
  }

  BrainGames.register({
    id: 'route-arrows',
    name: 'מסלול',
    skill: 'logic',
    tagline: 'עקבו אחרי ההוראות במפה ומצאו לאן הגעתם',
    benefit: 'התמצאות במרחב ומעקב אחרי הוראות',
    instructions: [
      'מצאו במפה את ההולך 🚶. משם מתחילים.',
      'עקבו אחרי הצעדים לפי הסדר. החץ מראה לאן לזוז במסך, והמספר לידו מראה כמה משבצות.',
      'בחרו לאיזה מקום הגעתם בסוף.'
    ],
    css: [
      '.ra-map{display:grid;grid-template-columns:repeat(var(--n),var(--ra-t));gap:4px;direction:ltr;padding:5px;',
      'border-radius:var(--radius);background:var(--surface-2);border:1px solid var(--line)}',
      '.ra-cell{position:relative;width:var(--ra-t);height:var(--ra-t);border-radius:8px;',
      'border:2px solid var(--line);background:var(--surface);color:var(--ink);display:grid;place-items:center;',
      'font-size:calc(var(--ra-t) * .58);line-height:1;transition:background-color .2s,border-color .2s}',
      '.ra-cell.ra-path{background:var(--logic-soft);border-color:var(--logic)}',
      '.ra-cell.ra-start{border-color:var(--logic);border-width:3px}',
      '.ra-cell.is-correct{background:var(--good-soft);border-color:var(--good);border-width:3px}',
      '.ra-cell.is-wrong{background:var(--bad-soft);border-color:var(--bad);border-width:3px}',
      '.ra-num{position:absolute;top:1px;left:3px;font-size:12px;font-weight:800;color:var(--logic);font-family:var(--font-body)}',
      '.ra-badge{position:absolute;bottom:-2px;right:-2px;width:22px;height:22px;border-radius:50%;background:var(--logic);',
      'color:var(--surface);display:grid;place-items:center}',
      '.ra-badge .ra-ico{width:16px;height:16px}',
      '.ra-facing{display:flex;align-items:center;gap:.5rem;font-weight:800;font-size:1.1rem;background:var(--logic-soft);color:var(--ink);',
      'padding:.35rem .8rem;border-radius:var(--radius-sm)}',
      '.ra-facing .ra-ico{width:1.6rem;height:1.6rem;color:var(--logic)}',
      '.ra-steps{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;justify-content:center;gap:.45rem;max-width:22rem}',
      '.ra-step{display:flex;align-items:center;gap:.15rem;padding:.1rem .5rem .1rem .35rem;border-radius:999px;',
      'background:var(--surface-2);border:1px solid var(--line);font-size:1.35rem;font-weight:900;font-variant-numeric:tabular-nums}',
      '.ra-step-n{flex:none;width:1.6rem;height:1.6rem;border-radius:50%;background:var(--logic);color:var(--surface);',
      'display:grid;place-items:center;font-size:1.1rem;font-weight:800}',
      '.ra-step .ra-ico{flex:none;width:1.6rem;height:1.6rem;color:var(--logic)}',
      '.g-choices.ra-choices{grid-template-columns:repeat(2,minmax(0,1fr));max-width:28rem}',
      '.g-choices.ra-choices .g-choice{min-height:3.2rem;display:flex;align-items:center;justify-content:center;gap:.4rem;font-size:1.2rem;line-height:1.15;padding:.3rem .4rem;white-space:nowrap}',
      '.ra-choices .g-choice span:first-child{font-size:1.6rem;line-height:1}',
      '.ra-explain{font-size:1.15rem;font-weight:700;text-align:center;margin:0;text-wrap:balance}',
      '.ra-after{display:flex;flex-direction:column;align-items:center;gap:.4rem;width:100%}',
      '.ra-after:empty{display:none}'
    ].join(''),
    generate: makeQuestion,
    _consts: { DR: DR, DC: DC },
    start: function (root, ctx) {
      var round = 0;
      var correct = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: correct, total: ROUNDS, note: 'הגעתם ליעד הנכון ב־' + correct + ' מסלולים מתוך ' + ROUNDS + '.' });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var q = makeQuestion(ctx.level, ctx);
        ctx.setStatus('לאן הגעתם?');
        root.innerHTML = '';

        var N = q.N;
        var answered = false;
        // Map tiles are look-only (not buttons) so the screen stays calm; sized to fit a phone.
        var map = ctx.el('div', {
          class: 'ra-map', dir: 'ltr', role: 'img', 'aria-label': 'מפה',
          style: { '--n': N, '--ra-t': 'min(' + (N > 5 ? 40 : 46) + 'px, calc((100vw - 96px) / ' + N + '))' }
        });
        var cellEls = [];
        for (var i = 0; i < N * N; i++) {
          var kids = [];
          var label = 'שורה ' + (Math.floor(i / N) + 1) + ', משבצת ' + (i % N + 1) + ' משמאל';
          if (i === q.startK) {
            kids.push(ctx.el('span', { 'aria-hidden': 'true' }, '🚶'));
            if (q.relative) kids.push(ctx.el('span', { class: 'ra-badge', html: arrowSvg(q.facing) }));
            label += ', נקודת ההתחלה';
          } else if (q.cells[i]) {
            kids.push(ctx.el('span', { 'aria-hidden': 'true' }, q.cells[i].e));
            label += ', ' + q.cells[i].n;
          }
          var cell = ctx.el('div', { class: 'ra-cell' + (i === q.startK ? ' ra-start' : ''), title: label }, kids);
          cellEls.push(cell);
          map.appendChild(cell);
        }
        root.appendChild(map);

        if (q.relative) {
          root.appendChild(ctx.el('div', { class: 'ra-facing', html: '<span>בהתחלה ההולך מסתכל ' + FACE_NAME[q.facing] + '</span>' + arrowSvg(q.facing) }));
        }
        var list = ctx.el('ol', { class: 'ra-steps' });
        q.moves.forEach(function (m, idx) {
          var p = stepParts(m, q.relative);
          list.appendChild(ctx.el('li', { class: 'ra-step', 'aria-label': (idx + 1) + ': ' + p.text + p.count }, [
            ctx.el('span', { html: p.icon, style: { display: 'contents' } }),
            ctx.el('span', { 'aria-hidden': 'true' }, String(m.n))
          ]));
        });
        root.appendChild(list);

        var buttons = [];
        var grid = ctx.el('div', { class: 'g-choices ra-choices' });
        q.choices.forEach(function (lm) {
          var b = ctx.el('button', {
            class: 'g-choice', type: 'button',
            onclick: function () { choose(lm); }
          }, [ctx.el('span', { 'aria-hidden': 'true' }, lm.e), ctx.el('span', null, lm.n)]);
          buttons.push({ lm: lm, btn: b });
          grid.appendChild(b);
        });
        root.appendChild(grid);
        var after = ctx.el('div', { class: 'ra-after', 'aria-live': 'polite' });
        root.appendChild(after);

        function cellOf(lm) {
          for (var k in q.cells) if (q.cells[k] === lm) return Number(k);
          return -1;
        }

        function choose(lm) {
          if (answered) return;
          answered = true;
          buttons.forEach(function (o) { o.btn.disabled = true; });
          q.path.forEach(function (rc) {
            var k = rc[0] * N + rc[1];
            if (k !== q.startK) cellEls[k].classList.add('ra-path');
          });
          // number each stop where a step ends
          var r = q.start[0], c = q.start[1];
          q.moves.forEach(function (m, idx) {
            r += DR[m.dir] * m.n; c += DC[m.dir] * m.n;
            cellEls[r * N + c].appendChild(ctx.el('span', { class: 'ra-num', 'aria-hidden': 'true' }, String(idx + 1)));
          });
          cellEls[q.endK].classList.add('is-correct');
          var ok = lm === q.answer;
          if (ok) correct++;
          else {
            var wk = cellOf(lm);
            if (wk >= 0) cellEls[wk].classList.add('is-wrong');
          }
          // The answer buttons make way for one short line + the next button, so the round stays on one screen.
          grid.style.display = 'none';
          var msg = ok ? 'נכון! הדרך מסומנת במפה.' : 'התשובה: ' + q.answer.e + ' ' + q.answer.n;
          after.appendChild(ctx.el('p', { class: 'ra-explain' }, msg));
          var nextBtn = ctx.el('button', {
            class: 'btn btn-primary btn-lg', type: 'button',
            onclick: function () { nextBtn.disabled = true; nextRound(); }
          }, round >= ROUNDS ? 'לסיכום' : 'למסלול הבא');
          after.appendChild(nextBtn);
          var tip = ok ? 'נכון! הגעתם ל' + q.answer.n : 'הגעתם ל' + q.answer.n + ' ' + q.answer.e;
          if (q.relative && !ok) tip += '. במסך: ' + q.moves.map(function (m) { return DIR_NAME[m.dir] + ' ' + m.n; }).join(', ');
          ctx.feedback(ok, tip);
          ctx.wait(50).then(function () { try { nextBtn.focus({ preventScroll: true }); } catch (e) { /* ignore */ } });
        }
      }

      nextRound();
    }
  });
})();
