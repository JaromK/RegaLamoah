/* תרגיל המטרה — reach the target number: combine two number tiles with + − × ÷ into a new tile, again and
   again, until one tile equals the target (logic, arithmetic, planning). Every target is reachable (checked
   by a full search), and the hint shows the next step of a real solution. Untimed. */
(function () {
  'use strict';

  var SIGN = { '+': '+', '-': '−', '*': '×', '/': '÷' };

  /* Level 1–50: n tiles, numbers lo…hi, allowed ops, how many steps the target needs at the least (minS…maxS),
     largest target, and (high levels) one big tile such as 25 or 50. */
  function spec(level) {
    var L = level;
    if (L <= 2) return { n: 3, lo: 1, hi: 5 + L, ops: ['+'], minS: 1, maxS: 1, maxT: 20 };
    if (L <= 4) return { n: 3, lo: 1, hi: 9, ops: ['+'], minS: 2, maxS: 2, maxT: 25 };
    if (L <= 9) return { n: 3, lo: 1, hi: 10, ops: ['+', '-'], minS: L <= 6 ? 1 : 2, maxS: 2, maxT: 25, needSub: L >= 7 };
    if (L <= 14) return { n: 4, lo: 1, hi: 10, ops: ['+', '-'], minS: 2, maxS: L <= 11 ? 2 : 3, maxT: 30 };
    if (L <= 20) return { n: 4, lo: 1, hi: 10, ops: ['+', '-', '*'], minS: 2, maxS: L <= 17 ? 2 : 3, maxT: 50, needMul: true };
    if (L <= 27) return { n: 4, lo: 1, hi: 10, ops: ['+', '-', '*', '/'], minS: L <= 23 ? 2 : 3, maxS: 3, maxT: 100, needDiv: L >= 24 };
    if (L <= 34) return { n: 5, lo: 1, hi: 10, ops: ['+', '-', '*', '/'], minS: 3, maxS: 3, maxT: 100 };
    if (L <= 42) return { n: 5, lo: 1, hi: 10, ops: ['+', '-', '*', '/'], minS: 3, maxS: 4, maxT: 200, big: [10, 15, 20, 25], minT: 20 };
    return { n: 5, lo: 1, hi: 10, ops: ['+', '-', '*', '/'], minS: 4, maxS: 4, maxT: 300, big: [25, 50, 75, 100], minT: 30 };
  }

  // a op b, or null when the result is not a positive whole number
  function apply(a, op, b) {
    if (op === '+') return a + b;
    if (op === '-') return a > b ? a - b : null;
    if (op === '*') return a * b;
    if (op === '/') return b > 0 && a % b === 0 ? a / b : null;
    return null;
  }

  /* Breadth-first search over the tile sets. Returns { value: path } with the shortest path (list of
     {a, op, b, r}) to every value that some tile can take. stopAt: stop as soon as this value is found. */
  function reach(nums, ops, stopAt) {
    var best = {}, seen = {}, layer = [{ t: nums.slice(), path: [] }];
    nums.forEach(function (v) { best[v] = []; });
    if (stopAt !== undefined && best[stopAt]) return best;
    while (layer.length) {
      var next = [];
      for (var s = 0; s < layer.length; s++) {
        var st = layer[s], t = st.t;
        for (var i = 0; i < t.length; i++) for (var j = 0; j < t.length; j++) {
          if (i === j) continue;
          for (var o = 0; o < ops.length; o++) {
            var op = ops[o];
            if ((op === '+' || op === '*') && j < i) continue; // same as the other order
            var r = apply(t[i], op, t[j]);
            if (r === null || r > 100000) continue;
            var rest = [];
            for (var k = 0; k < t.length; k++) if (k !== i && k !== j) rest.push(t[k]);
            rest.push(r);
            var path = st.path.concat([{ a: t[i], op: op, b: t[j], r: r }]);
            if (best[r] === undefined) best[r] = path;
            if (stopAt !== undefined && r === stopAt) return best;
            var key = rest.slice().sort(function (x, y) { return x - y; }).join(',');
            if (seen[key] || rest.length < 2) continue;
            seen[key] = true;
            next.push({ t: rest, path: path });
          }
        }
      }
      layer = next;
    }
    return best;
  }

  // the shortest way from these tiles to the target, or null
  function solve(nums, ops, target) {
    var b = reach(nums, ops, target);
    return b[target] === undefined ? null : b[target];
  }

  function makePuzzle(sp, rnd) {
    for (var attempt = 0; attempt < 400; attempt++) {
      var nums = [];
      for (var i = 0; i < sp.n; i++) nums.push(rnd.randInt(sp.lo, sp.hi));
      if (sp.big) nums[0] = rnd.pick(sp.big);
      var best = reach(nums, sp.ops);
      var cands = Object.keys(best).map(Number).filter(function (v) {
        var p = best[v];
        if (p.length < sp.minS || p.length > sp.maxS || v > sp.maxT || v < (sp.minT || 2)) return false;
        if (nums.indexOf(v) !== -1) return false;
        if (sp.needSub && !p.some(function (s) { return s.op === '-'; })) return false;
        if (sp.needMul && !p.some(function (s) { return s.op === '*'; })) return false;
        if (sp.needDiv && !p.some(function (s) { return s.op === '/'; })) return false;
        return true;
      });
      if (!cands.length) continue;
      var target = rnd.pick(cands);
      return { nums: rnd.shuffle(nums), target: target, solution: best[target], ops: sp.ops };
    }
    return null;
  }

  function stepText(s) { return s.a + ' ' + SIGN[s.op] + ' ' + s.b + ' = ' + s.r; }

  var css = [
    '.tn-target{display:flex;align-items:center;gap:.7rem;font-size:1.3rem;font-weight:800;}',
    '.tn-target b{font-family:var(--font-display);font-size:2.6rem;font-weight:900;min-width:5rem;text-align:center;padding:.1rem .8rem;',
    'border:3px solid var(--c-red);border-radius:var(--radius);color:var(--c-red);background:var(--c-red-soft);line-height:1.2;}',
    /* the exercise being built: [number] [operation] [number] = [result], filled in as the player taps */
    '.tn-build{display:flex;align-items:center;justify-content:center;gap:.35rem;direction:ltr;width:100%;max-width:24rem;}',
    '.tn-slot{min-width:3.6rem;height:3.2rem;padding:0 .4rem;border:3px dashed var(--line);border-radius:var(--radius-sm);display:grid;place-items:center;',
    'font-family:var(--font-display);font-size:1.7rem;font-weight:900;color:var(--ink);background:var(--surface);}',
    '.tn-slot.is-empty{font-family:var(--font-body);font-size:.85rem;font-weight:800;color:var(--ink-soft);}',
    '.tn-slot.is-next{border-color:var(--sun);box-shadow:0 0 0 3px var(--sun-soft);}',
    '.tn-slot.s-num{border-style:solid;border-color:var(--c-blue);background:var(--c-blue-soft);}',
    '.tn-slot.s-op{min-width:2.8rem;border-style:solid;border-color:var(--c-purple);background:var(--c-purple-soft);}',
    '.tn-slot.s-res{border-style:solid;border-color:var(--c-green);background:var(--c-green-soft);}',
    '.tn-eq{font-size:1.7rem;font-weight:900;}',
    '.tn-tiles{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:.5rem;width:100%;max-width:26rem;direction:ltr;}',
    '.tn-tile{min-height:4.4rem;font-family:var(--font-display);font-size:2rem;font-weight:900;padding:.1rem;border-radius:var(--radius);',
    'border:3px solid var(--c-blue);background:var(--c-blue-soft);color:var(--ink);cursor:pointer;}',
    '.tn-tile.is-a{background:var(--c-blue);color:#fff;}',
    '.tn-tile.is-new{border-color:var(--c-green);}',
    '.tn-tile.is-hint{border-color:var(--c-yellow);box-shadow:0 0 0 4px var(--c-yellow);}',
    '.tn-tile.is-win{background:var(--c-green);border-color:var(--c-green);color:#fff;}',
    '.tn-tile:disabled{cursor:default;}',
    '.tn-tile.is-long{font-size:1.5rem;}',
    '.tn-ops{display:grid;grid-template-columns:repeat(var(--k),minmax(0,1fr));gap:.5rem;width:100%;max-width:22rem;}',
    '.tn-op{min-height:3.6rem;font-size:2rem;font-weight:900;border-radius:var(--radius);border:3px solid var(--line);background:var(--surface-2);color:var(--ink);cursor:pointer;line-height:1;}',
    '.tn-op.is-on{border-color:var(--c-purple);background:var(--c-purple);color:#fff;}',
    '.tn-op.is-hint{box-shadow:0 0 0 4px var(--c-yellow);}',
    '.tn-log{display:flex;flex-direction:column;align-items:center;gap:.1rem;min-height:1.5rem;font-size:1.15rem;font-weight:800;direction:ltr;color:var(--ink-soft);}',
    '.tn-log.is-sol{color:var(--ink);background:var(--sun-soft);border:2px solid var(--sun);border-radius:var(--radius-sm);padding:.3rem .9rem;}',
    '.tn-acts .btn{min-height:3.2rem;padding-inline:1rem;}'
  ].join('');

  BrainGames.register({
    id: 'target-number',
    name: 'תרגיל המטרה',
    skill: 'logic',
    isNew: true,
    tagline: 'חברו, חסרו, כפלו וחלקו מספרים עד שמגיעים למטרה',
    benefit: 'חשבון בראש, תכנון וחשיבה גמישה',
    instructions: [
      'למעלה יש מספר מטרה, ולמטה כמה כרטיסי מספרים.',
      'בונים תרגיל בשלושה צעדים: לוחצים על מספר, אחר כך על פעולה (+ − × ÷), ואז על מספר שני. התרגיל נבנה בתיבות שעל המסך.',
      'למשל, כדי להגיע ל-10 מהמספרים 6 ו-4: לוחצים 6, אחר כך +, אחר כך 4. שני הכרטיסים הופכים לכרטיס אחד: 10.',
      'ממשיכים כך עד שאחד הכרטיסים שווה למטרה. התוצאה חייבת להיות מספר שלם וחיובי.',
      'טעיתם? "ביטול" מחזיר צעד אחורה. יש גם "רמז". אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makePuzzle: makePuzzle, reach: reach, solve: solve, apply: apply },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = 4, round = 0, solved = 0;

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({ correct: solved, total: ROUNDS, note: 'הגעתם למטרה ב-' + solved + ' מתוך ' + ROUNDS + ' תרגילים' });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        var P = null;
        for (var t = 0; t < 5 && !P; t++) P = makePuzzle(sp, ctx);
        play(P);
      }

      function play(P) {
        root.innerHTML = '';
        var uid = 0;
        function tile(v) { return { v: v, id: ++uid }; }
        var tiles = P.nums.map(tile), history = [], log = [];
        var selA = null, op = null, hints = 0, done = false, hintStep = null, lastNew = null;

        var targetBox = el('div', { class: 'tn-target' }, ['המטרה:', el('b', null, String(P.target))]);
        var tilesBox = el('div', { class: 'tn-tiles' });
        tilesBox._p = P; // read by automated tests only
        var opsBox = el('div', { class: 'tn-ops', style: { '--k': P.ops.length } });
        var opBtns = {};
        P.ops.forEach(function (o) {
          opBtns[o] = el('button', { class: 'tn-op', type: 'button', 'aria-label': SIGN[o], onclick: function () { pickOp(o); } }, SIGN[o]);
          opsBox.appendChild(opBtns[o]);
        });
        var logBox = el('div', { class: 'tn-log', 'aria-live': 'polite' });
        var buildBox = el('div', { class: 'tn-build', 'aria-label': 'התרגיל שאתם בונים' });
        var shownStep = null; // the exercise just done, shown in the boxes until the next tap
        // the very first exercise on the easy levels gets a small example
        var example = level <= 5 && round === 1;
        var undoBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: undo }, 'ביטול');
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var showBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: reveal }, 'פתרון');
        var actions = el('div', { class: 'g-actions tn-acts' }, [undoBtn, hintBtn, showBtn]);
        [targetBox, tilesBox, buildBox, opsBox, logBox, actions].forEach(function (n) { root.appendChild(n); });
        status();
        render();

        function status(t) {
          ctx.setStatus(t || (selA === null ? '1. בחרו מספר' : op === null ? '2. בחרו פעולה: + − × ÷' : '3. בחרו את המספר השני'));
        }
        function slot(text, cls, empty, next) {
          return el('span', { class: 'tn-slot ' + cls + (empty ? ' is-empty' : '') + (next ? ' is-next' : '') }, text);
        }
        function drawBuild() {
          buildBox.innerHTML = '';
          if (shownStep) { // the step just made: 3 + 4 = 7
            buildBox.appendChild(slot(String(shownStep.a), 's-num'));
            buildBox.appendChild(slot(SIGN[shownStep.op], 's-op'));
            buildBox.appendChild(slot(String(shownStep.b), 's-num'));
            buildBox.appendChild(el('span', { class: 'tn-eq' }, '='));
            buildBox.appendChild(slot(String(shownStep.r), 's-res'));
            return;
          }
          var a = selA === null ? null : tiles.filter(function (x) { return x.id === selA; })[0];
          buildBox.appendChild(a ? slot(String(a.v), 's-num') : slot('מספר', '', true, true));
          buildBox.appendChild(op ? slot(SIGN[op], 's-op') : slot('פעולה', '', true, !!a));
          buildBox.appendChild(slot('מספר', '', true, !!(a && op)));
          buildBox.appendChild(el('span', { class: 'tn-eq' }, '='));
          buildBox.appendChild(slot('?', '', true));
        }
        function render() {
          tilesBox.innerHTML = '';
          tilesBox.style.setProperty('--n', Math.max(3, tiles.length));
          tiles.forEach(function (t) {
            var cls = 'tn-tile';
            if (selA === t.id) cls += ' is-a';
            if (lastNew === t.id) cls += ' is-new';
            if (hintStep && !done && t.id === hintStep.bId && selA === hintStep.aId) cls += ' is-hint';
            if (done && t.v === P.target) cls += ' is-win';
            if (t.v >= 100) cls += ' is-long';
            tilesBox.appendChild(el('button', { class: cls, type: 'button', disabled: done ? 'disabled' : null, onclick: function () { pickTile(t); } }, String(t.v)));
          });
          P.ops.forEach(function (o) {
            opBtns[o].classList.toggle('is-on', op === o);
            opBtns[o].classList.toggle('is-hint', !!hintStep && hintStep.op === o && op !== o && !done);
            opBtns[o].disabled = done;
          });
          drawBuild();
          logBox.innerHTML = '';
          logBox.classList.remove('is-sol');
          if (example && !log.length && selA === null) logBox.appendChild(el('div', null, 'דוגמה: 6 + 4 = 10. לוחצים 6, אחר כך +, אחר כך 4'));
          // earlier steps (the latest one is in the boxes above)
          log.slice(shownStep ? -3 : -2, shownStep ? -1 : undefined).forEach(function (s) { logBox.appendChild(el('div', null, stepText(s))); });
          undoBtn.disabled = done || !history.length;
          hintBtn.disabled = showBtn.disabled = done;
        }
        function pickTile(t) {
          if (done) return;
          ctx.sound('tap');
          shownStep = null;
          if (selA === null || (op === null && selA !== t.id)) { selA = t.id; status(); render(); return; }
          if (selA === t.id) { selA = null; op = null; status(); render(); return; }
          var a = tiles.filter(function (x) { return x.id === selA; })[0];
          var r = apply(a.v, op, t.v);
          if (r === null) {
            status(op === '/' ? a.v + ' ÷ ' + t.v + ' לא יוצא מספר שלם. נסו אחרת' : a.v + ' − ' + t.v + ' לא יוצא מספר חיובי. נסו אחרת');
            op = null; render(); return;
          }
          history.push({ tiles: tiles.slice(), log: log.slice() });
          var nt = tile(r);
          tiles = tiles.filter(function (x) { return x.id !== a.id; }).map(function (x) { return x.id === t.id ? nt : x; });
          log.push({ a: a.v, op: op, b: t.v, r: r });
          shownStep = log[log.length - 1];
          lastNew = nt.id; selA = null; op = null; hintStep = null;
          if (r === P.target) { win(); return; }
          if (tiles.length === 1) status('לא הגענו ל-' + P.target + '. לחצו "ביטול" ונסו דרך אחרת');
          else status();
          render();
        }
        function pickOp(o) {
          if (done) return;
          ctx.sound('tap');
          if (selA === null) { status('קודם בחרו מספר, ואחר כך פעולה'); return; }
          shownStep = null;
          op = op === o ? null : o;
          status(); render();
        }
        function undo() {
          if (done || !history.length) return;
          ctx.sound('tap');
          var h = history.pop();
          tiles = h.tiles; log = h.log; selA = null; op = null; lastNew = null; hintStep = null; shownStep = null;
          status(); render();
        }
        function hint() {
          if (done) return;
          var vals = tiles.map(function (t) { return t.v; });
          var path = solve(vals, P.ops, P.target);
          if (!path) { // a dead end: go back to the start
            tiles = P.nums.map(tile); log = []; history = [];
            vals = P.nums.slice();
            path = solve(vals, P.ops, P.target);
          }
          hints++;
          var s = path[0];
          var aT = tiles.filter(function (t) { return t.v === s.a; })[0];
          var bT = tiles.filter(function (t) { return t.v === s.b && t.id !== aT.id; })[0];
          selA = aT.id; op = s.op; lastNew = null; shownStep = null;
          hintStep = { aId: aT.id, bId: bT.id, op: s.op };
          status('רמז: ' + s.a + ' ' + SIGN[s.op] + ' ' + s.b + ' — לחצו על ' + s.b);
          render();
        }
        function reveal() {
          if (done) return;
          done = true; hints = 99;
          render();
          logBox.innerHTML = '';
          logBox.classList.add('is-sol');
          buildBox.hidden = opsBox.hidden = true; // room for the solution steps
          P.solution.forEach(function (s) { logBox.appendChild(el('div', null, stepText(s))); });
          status('כך אפשר להגיע ל-' + P.target + ':');
          ctx.feedback(false, 'הנה פתרון אחד').then(nextBtn);
        }
        function win() {
          done = true;
          var ok = hints <= 1;
          if (ok) solved++;
          render();
          status(ok ? 'מצוין! הגעתם ל-' + P.target : 'הגעתם ל-' + P.target + ', בעזרת רמזים');
          ctx.feedback(ok, ok ? undefined : 'הגעתם, עם כמה רמזים').then(function () { return ctx.wait(600); }).then(nextRound);
        }
        function nextBtn() {
          actions.innerHTML = '';
          var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { next.disabled = true; nextRound(); } },
            round >= ROUNDS ? 'לסיכום' : 'לתרגיל הבא');
          actions.appendChild(next);
        }
      }

      nextRound();
    }
  });
})();
