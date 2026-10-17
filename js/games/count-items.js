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
    '.ci-item{position:absolute;line-height:1;transform:translate(-50%,-50%) rotate(var(--rot,0deg));',
    'font-size:1.6rem;font-size:calc(100cqw / var(--cols) * .62);user-select:none;-webkit-user-select:none;',
    'border-radius:50%;}',
    '.ci-board.ci-done .ci-item{opacity:.35;}',
    '.ci-board.ci-done .ci-item.ci-hit{opacity:1;background:var(--good-soft);box-shadow:0 0 0 3px var(--good);}',
    '.ci-q{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:.35rem;margin:0;}',
    '.ci-q .ci-em{font-size:2rem;line-height:1;}',
    '.ci-choices{max-width:26rem;grid-template-columns:repeat(4,minmax(0,1fr));}',
    '.ci-choices .g-choice{font-size:1.7rem;padding:.6rem .2rem;font-variant-numeric:tabular-nums;}'
  ].join('');

  function clampLevel(l) {
    l = Math.round(Number(l) || 1);
    return Math.max(1, Math.min(20, l));
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
      'בחרו את המספר הנכון. אין מגבלת זמן, והתמונה נשארת מול העיניים.'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = clampLevel(ctx.level);
      var cols = Math.min(7, 4 + Math.floor((level - 1) / 4));         // 4 → 7
      var cells = cols * cols;
      var totalItems = Math.round(cells * (0.35 + 0.015 * (level - 1))); // 6 → 31
      var tLo = 2 + Math.floor((level - 1) / 3);                          // 2 → 8
      var tHi = tLo + 2 + Math.floor(level / 8);                          // 4 → 12
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
        var twoKind = level >= 16 && (round % 2 === 0 || level >= 19);
        var famIdx = ctx.randInt(0, FAMILIES.length - 1);
        var fam = ctx.shuffle(FAMILIES[famIdx]);
        var targets = twoKind ? fam.slice(0, 2) : fam.slice(0, 1);
        var sameRest = fam.slice(targets.length);
        var otherKinds = ctx.shuffle(FAMILIES.filter(function (_, i) { return i !== famIdx; })
          .map(function (f) { return ctx.pick(f); }));

        var answer = Math.min(ctx.randInt(tLo, tHi), totalItems - 2);
        var counts = {};
        if (twoKind) {
          var a = ctx.randInt(Math.max(1, Math.floor(answer / 3)), answer - 1);
          counts[targets[0]] = a;
          counts[targets[1]] = answer - a;
        } else {
          counts[targets[0]] = answer;
        }

        // Distractor kinds: some from the same family (look-alikes), the rest from other families.
        var nSameKinds = Math.min(sameRest.length, Math.round(distractorKinds * sameFamilyRatio));
        var kinds = sameRest.slice(0, nSameKinds).concat(otherKinds.slice(0, distractorKinds - nSameKinds));
        var distractCount = totalItems - answer;
        var pieces = [];
        Object.keys(counts).forEach(function (k) { for (var i = 0; i < counts[k]; i++) pieces.push({ e: k, hit: true }); });
        for (var d = 0; d < distractCount; d++) pieces.push({ e: kinds[d % kinds.length], hit: false });
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
          var node = el('span', {
            class: 'ci-item' + (pc.hit ? ' ci-hit' : ''), 'aria-hidden': 'true',
            style: { left: x + '%', top: y + '%' }
          }, pc.e);
          node.style.setProperty('--rot', ctx.randInt(-18, 18) + 'deg');
          board.appendChild(node);
        });

        var question = twoKind
          ? el('p', { class: 'g-prompt ci-q' }, ['כמה', el('span', { class: 'ci-em' }, targets[0]), 'ועוד',
            el('span', { class: 'ci-em' }, targets[1]), 'יש ביחד?'])
          : el('p', { class: 'g-prompt ci-q' }, ['כמה', el('span', { class: 'ci-em' }, targets[0]), 'יש בתמונה?']);
        ctx.setStatus(twoKind ? 'ספרו את שני הסוגים יחד' : 'ספרו בעיון, אין מגבלת זמן');

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
          if (twoKind) {
            msg = 'היו ' + counts[targets[0]] + ' ' + targets[0] + ' ועוד ' + counts[targets[1]] + ' ' + targets[1] + ' = ' + answer;
          } else {
            msg = 'היו ' + answer + ' ' + targets[0];
          }
          ctx.setStatus(ok ? 'נכון! ' + msg : msg + ' (מסומנים בתמונה)');
          ctx.feedback(ok, ok ? undefined : 'התשובה הנכונה: ' + answer).then(function () {
            return ctx.wait(1500);
          }).then(nextRound);
        }
      }

      nextRound();
    }
  });
})();
