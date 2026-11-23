/* כמה יש? — count one kind of object in a cluttered picture (attention). */
(function () {
  'use strict';

  var ROUNDS = 6;

  // Families of look-alike emoji (single codepoint, no variation selectors).
  var FAMILIES = [
    ['🍎', '🍅', '🍓', '🍒'],
    ['🍋', '🍊', '🍌', '🍑'],
    ['🥒', '🥦', '🥝', '🍏', '🍐'],
    ['🐭', '🐹', '🐰', '🐱'],
    ['🐞', '🐝', '🦋', '🐜'],
    ['🐟', '🐠', '🐡', '🐬'],
    ['⚽', '🏀', '🏐', '⚾', '🎾'],
    ['🌸', '🌺', '🌻', '🌷', '🌼'],
    ['🚗', '🚕', '🚙', '🚌']
  ];

  var css = [
    '.ci-board{position:relative;width:100%;max-width:26rem;aspect-ratio:1;background:var(--surface-2);',
    'border:2px solid var(--line);border-radius:var(--radius);overflow:hidden;container-type:inline-size;}',
    '.ci-item{position:absolute;line-height:1;transform:translate(-50%,-50%) rotate(var(--rot,0deg)) scale(var(--sc,1)) scaleX(var(--sx,1));',
    'font-size:1.6rem;font-size:calc(100cqw / var(--cols) * .62);user-select:none;-webkit-user-select:none;',
    'border-radius:50%;}',
    '.ci-board.ci-done .ci-item{opacity:.35;}',
    '.ci-board.ci-done .ci-item.ci-hit{opacity:1;background:var(--good-soft);box-shadow:0 0 0 3px var(--good);}',
    /* after a mistake every counted picture gets its number, so the player can count along */
    '.ci-num{position:absolute;transform:translate(10%,-115%);min-width:1.45rem;height:1.45rem;padding:0 .2rem;border-radius:999px;',
    'background:var(--c-blue);color:#fff;font:900 .95rem/1.45rem var(--font-body);text-align:center;pointer-events:none;z-index:2;}',
    '.ci-go{grid-column:span 2;min-height:3.6rem;font-size:1.1rem;padding:.3rem .6rem;}',
    '.ci-num.is-low{transform:translate(10%,15%);}',
    '.ci-num.k1{background:var(--c-red);}.ci-num.k2{background:var(--c-purple);}',
    '.ci-q{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.35rem;margin:0;}',
    '.ci-q .ci-em{font-size:2rem;line-height:1;}',
    '.ci-choices{max-width:26rem;grid-template-columns:repeat(4,minmax(0,1fr));}',
    '.ci-choices .g-choice{font-size:1.7rem;padding:.6rem .2rem;font-variant-numeric:tabular-nums;}'
  ].join('');

  function clampLevel(l) {
    l = Math.round(Number(l) || 1);
    return Math.max(1, Math.min(50, l));
  }

  BrainGames.register({
    id: 'count-items',
    name: 'כמה יש?',
    skill: 'attention',
    tagline: 'ספרו פריט אחד מתוך תמונה עמוסה',
    benefit: 'קשב חזותי, סריקה מסודרת ועמידה בהסחות',
    instructions: [
      'תופיע תמונה עם הרבה ציורים קטנים.',
      'קראו את השאלה וספרו רק את מה שמבקשים.',
      'בחרו את המספר הנכון. אין מגבלת זמן, והתמונה נשארת מול העיניים.',
      'ברמות הגבוהות שימו לב לגודל ולכיוון: לפעמים סופרים רק את הגדולים, או רק את אלה שפונים לאותו צד.'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = clampLevel(ctx.level);
      var cols = Math.min(7, 4 + Math.floor((level - 1) / 4));         // 4 → 7
      var cells = cols * cols;
      // The picture never grows past 7 × 7; levels 21–30 get a little denser and ask harder questions.
      var totalItems = Math.round(cells * Math.min(level > 30 ? 0.76 : 0.7, 0.35 + 0.015 * (level - 1))); // 6 → 31 → 34 → 37
      var tLo = Math.min(9, 2 + Math.floor((level - 1) / 3));             // 2 → 8 → 9
      var tHi = Math.min(14, tLo + 2 + Math.floor(level / 8));            // 4 → 12 → 14
      var sameFamilyRatio = Math.max(0, Math.min(0.85, (level - 3) / 12));
      var distractorKinds = Math.min(5, 2 + Math.floor((level - 1) / 5)); // 2 → 5

      var round = 0;
      var score = 0;

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({ correct: score, total: ROUNDS, note: 'ספרתם נכון ' + score + ' מתוך ' + ROUNDS + ' תמונות' });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        playRound();
      }

      function choiceSet(ans) {
        var opts = [ans];
        var near = ctx.shuffle([ans - 1, ans + 1]);
        var far = ctx.shuffle([ans - 2, ans + 2, ans + 3, ans - 3]);
        near.concat(far).forEach(function (v) {
          if (opts.length < 4 && v >= 1 && opts.indexOf(v) === -1) opts.push(v);
        });
        var v = ans + 4;
        while (opts.length < 4) { if (opts.indexOf(v) === -1) opts.push(v); v++; }
        return opts.sort(function (a, b) { return a - b; });
      }

      function playRound() {
        root.innerHTML = '';
        // mode: 'one' kind, 'two' kinds added, 'diff' = how many more of one kind, 'three' kinds added
        var mode = level >= 16 && (round % 2 === 0 || level >= 19) ? 'two' : 'one';
        if (level >= 23 && level <= 25 && round % 2 === 0) mode = 'diff';
        if (level >= 26) mode = round % (level >= 28 ? 2 : 3) === 0 ? 'three' : (round % 2 ? 'diff' : 'two');
        // 31–50: count only the big ones ('size') or only those facing one way ('face'); from 46 all kinds mixed
        if (level >= 31) {
          var band = level <= 35 ? ['size', 'two', 'size', 'diff', 'size', 'three']
            : level <= 40 ? ['face', 'diff', 'face', 'size', 'face', 'three']
            : level <= 45 ? ['face', 'size', 'three', 'face', 'size', 'diff']
            : ['face', 'size', 'face', 'three', 'size', 'diff'];
          mode = band[(round - 1) % band.length];
        }
        var single = mode === 'one' || mode === 'size' || mode === 'face';
        var twoKind = !single;
        // facing needs pictures that look clearly different in a mirror: fish and cars (side views)
        var famIdx = mode === 'face' ? ctx.pick([5, 8]) : ctx.randInt(0, FAMILIES.length - 1);
        var fam = ctx.shuffle(FAMILIES[famIdx]);
        var targets = fam.slice(0, mode === 'three' ? 3 : twoKind ? 2 : 1);
        var sameRest = fam.slice(targets.length);
        var otherKinds = ctx.shuffle(FAMILIES.filter(function (_, i) { return i !== famIdx; })
          .map(function (f) { return ctx.pick(f); }));

        var answer = Math.min(ctx.randInt(tLo, tHi), totalItems - 2);
        var counts = {};
        if (mode === 'diff') {
          // more of the first kind than the second; the answer is the difference
          var big = Math.min(answer - 2, Math.ceil(answer / 2) + ctx.randInt(1, 3));
          counts[targets[0]] = big;
          counts[targets[1]] = answer - big;
          answer = big - (answer - big);
        } else if (mode === 'three') {
          var a3 = ctx.randInt(2, Math.max(2, Math.floor(answer / 2) - 1));
          var b3 = ctx.randInt(2, Math.max(2, answer - a3 - 2));
          counts[targets[0]] = a3;
          counts[targets[1]] = b3;
          counts[targets[2]] = Math.max(1, answer - a3 - b3);
          answer = a3 + b3 + counts[targets[2]];
        } else if (twoKind) {
          var a = ctx.randInt(Math.max(1, Math.floor(answer / 3)), answer - 1);
          counts[targets[0]] = a;
          counts[targets[1]] = answer - a;
        } else {
          counts[targets[0]] = answer;
        }

        // Distractor kinds: some from the same family (look-alikes), the rest from other families.
        var nSameKinds = Math.min(sameRest.length, Math.round(distractorKinds * sameFamilyRatio));
        var kinds = sameRest.slice(0, nSameKinds).concat(otherKinds.slice(0, distractorKinds - nSameKinds));
        var targetCount = Object.keys(counts).reduce(function (s, k) { return s + counts[k]; }, 0);
        // size/face: the same picture also appears small or mirrored, and those do not count
        var twins = mode === 'size' || mode === 'face' ? Math.max(2, Math.round(answer * 0.6)) : 0;
        var distractCount = totalItems - targetCount - twins;
        var pieces = [];
        Object.keys(counts).forEach(function (k) { for (var i = 0; i < counts[k]; i++) pieces.push({ e: k, hit: true }); });
        for (var t = 0; t < twins; t++) pieces.push({ e: targets[0], hit: false, small: mode === 'size', flip: mode === 'face' });
        for (var d = 0; d < distractCount; d++) pieces.push({ e: kinds[d % kinds.length], hit: false, small: mode === 'size' && Math.random() < 0.4 });
        pieces = ctx.shuffle(pieces);

        // Jittered grid placement: one item per cell, never overlapping.
        var cellIdx = ctx.shuffle(Array.apply(null, { length: cells }).map(function (_, i) { return i; }));
        var board = el('div', { class: 'ci-board', role: 'img', 'aria-label': 'תמונה לספירה' });
        board.style.setProperty('--cols', cols);
        pieces.forEach(function (pc, i) {
          var c = cellIdx[i];
          var r = Math.floor(c / cols), col = c % cols;
          var jx = (Math.random() - 0.5) * 0.3, jy = (Math.random() - 0.5) * 0.3;
          var x = (col + 0.5 + jx) / cols * 100;
          var y = (r + 0.5 + jy) / cols * 100;
          pc.x = x; pc.y = y;
          var node = el('span', {
            class: 'ci-item' + (pc.hit ? ' ci-hit' : ''), 'aria-hidden': 'true',
            style: { left: x + '%', top: y + '%' }
          }, pc.e);
          node.style.setProperty('--rot', ctx.randInt(level >= 46 ? -35 : -18, level >= 46 ? 35 : 18) + 'deg');
          if (pc.small) node.style.setProperty('--sc', '.58');
          if (pc.flip) node.style.setProperty('--sx', '-1');
          board.appendChild(node);
        });

        function em(t) { return el('span', { class: 'ci-em' }, t); }
        var question = mode === 'diff'
          ? el('p', { class: 'g-prompt ci-q' }, ['כמה', em(targets[0]), 'יש יותר מ־', em(targets[1]), '?'])
          : mode === 'three'
            ? el('p', { class: 'g-prompt ci-q' }, ['כמה', em(targets[0]), 'ועוד', em(targets[1]), 'ועוד', em(targets[2]), 'יש ביחד?'])
            : twoKind
              ? el('p', { class: 'g-prompt ci-q' }, ['כמה', em(targets[0]), 'ועוד', em(targets[1]), 'יש ביחד?'])
              : mode === 'size'
                ? el('p', { class: 'g-prompt ci-q' }, ['כמה', em(targets[0]), 'גדולים יש?'])
                : mode === 'face'
                  ? el('p', { class: 'g-prompt ci-q' }, ['כמה', em(targets[0]), 'פונים לאותו צד כמו כאן?'])
                  : el('p', { class: 'g-prompt ci-q' }, ['כמה', em(targets[0]), 'יש בתמונה?']);
        ctx.setStatus(mode === 'diff' ? 'ספרו כל סוג לחוד, ואז בדקו את ההפרש'
          : mode === 'three' ? 'ספרו את שלושת הסוגים יחד'
            : mode === 'size' ? 'ספרו רק את הגדולים, לא את הקטנים'
            : mode === 'face' ? 'ספרו רק את מי שפונה לאותו צד כמו בשאלה'
            : twoKind ? 'ספרו את שני הסוגים יחד' : 'ספרו בעיון, אין מגבלת זמן');

        var opts = choiceSet(answer);
        var answered = false;
        var buttons = opts.map(function (v) {
          return el('button', { class: 'g-choice', type: 'button', onclick: function () { choose(v); } }, String(v));
        });
        root.appendChild(question);
        root.appendChild(board);
        root.appendChild(el('div', { class: 'g-choices ci-choices' }, buttons));

        function choose(v) {
          if (answered) return;
          answered = true;
          buttons.forEach(function (b) { b.disabled = true; });
          var ok = v === answer;
          if (ok) score++;
          opts.forEach(function (o, k) {
            if (o === answer) buttons[k].classList.add('is-correct');
            else if (o === v) buttons[k].classList.add('is-wrong');
          });
          board.classList.add('ci-done');
          var msg;
          if (mode === 'diff') {
            msg = 'היו ' + counts[targets[0]] + ' ' + targets[0] + ' ו־' + counts[targets[1]] + ' ' + targets[1] + ', כלומר ' + answer + ' יותר';
          } else if (mode === 'three') {
            msg = 'היו ' + counts[targets[0]] + ' ' + targets[0] + ' ועוד ' + counts[targets[1]] + ' ' + targets[1] +
              ' ועוד ' + counts[targets[2]] + ' ' + targets[2] + ' = ' + answer;
          } else if (twoKind) {
            msg = 'היו ' + counts[targets[0]] + ' ' + targets[0] + ' ועוד ' + counts[targets[1]] + ' ' + targets[1] + ' = ' + answer;
          } else if (mode === 'size') {
            msg = 'היו ' + answer + ' ' + targets[0] + ' גדולים (ועוד ' + twins + ' קטנים)';
          } else if (mode === 'face') {
            msg = 'היו ' + answer + ' ' + targets[0] + ' שפונים לאותו צד (ועוד ' + twins + ' הפוכים)';
          } else {
            msg = 'היו ' + answer + ' ' + targets[0];
          }
          if (ok) {
            ctx.setStatus('נכון! ' + msg);
            ctx.feedback(true).then(nextRound);
            return;
          }
          // a mistake: number every picture that counts (each kind in its own colour), explain, and wait
          var targetsShown = mode === 'size' || mode === 'face' ? [targets[0]] : targets;
          targetsShown.forEach(function (kind, ki) {
            var hits = pieces.filter(function (pc) { return pc.hit && pc.e === kind; });
            // number them top to bottom, right to left, the way one counts
            hits.sort(function (p, q) { return Math.round(p.y / 12) - Math.round(q.y / 12) || q.x - p.x; });
            hits.forEach(function (pc, i) {
              board.appendChild(el('span', { class: 'ci-num k' + ki + (pc.y < 14 ? ' is-low' : ''), 'aria-hidden': 'true', style: { left: pc.x + '%', top: pc.y + '%' } }, String(i + 1)));
            });
          });
          // the explanation goes to the status line (no extra row), so the picture and the button still fit
          ctx.setStatus(msg + '. כל אחד מסומן במספר.');
          ctx.feedback(false, 'בחרתם ' + v + '. התשובה: ' + answer).then(function () {
            // only the chosen and the right number stay; the button takes the place of the others (same row, nothing moves)
            buttons.forEach(function (b, k) { if (opts[k] !== v && opts[k] !== answer) b.hidden = true; });
            var go = el('button', { class: 'btn btn-primary ci-go', type: 'button', onclick: function () { go.disabled = true; nextRound(); } }, 'הבנתי, ממשיכים');
            buttons[0].parentNode.appendChild(go);
          });
        }
      }

      nextRound();
    }
  });
})();
