/* רצף אורות — Simon-style light sequence (memory). */
(function () {
  'use strict';

  var ROUNDS = 6;
  var ON_MS = 900;   // each light stays on (never faster)
  var GAP_MS = 400;  // pause between lights

  var PADS = [
    { hue: 'memory',    label: '1', shape: '●', name: 'עיגול',  freq: 330 },
    { hue: 'attention', label: '2', shape: '▲', name: 'משולש', freq: 392 },
    { hue: 'logic',     label: '3', shape: '■', name: 'ריבוע',  freq: 494 },
    { hue: 'language',  label: '4', shape: '◆', name: 'מעוין',  freq: 587 },
    { hue: 'sun',       label: '5', shape: '★', name: 'כוכב',   freq: 659 },
    { hue: 'accent',    label: '6', shape: '♥', name: 'לב',     freq: 784 }
  ];

  // Per level (1–20): sequence length + number of pads.
  // Each length is played on 4, then 5, then 6 pads, so every level-up is a small step.
  var LEVELS = [
    { len: 3, pads: 4 }, { len: 3, pads: 5 }, { len: 3, pads: 6 },   // 1–3
    { len: 4, pads: 4 }, { len: 4, pads: 5 }, { len: 4, pads: 6 },   // 4–6
    { len: 5, pads: 4 }, { len: 5, pads: 5 }, { len: 5, pads: 6 },   // 7–9
    { len: 6, pads: 4 }, { len: 6, pads: 5 }, { len: 6, pads: 6 },   // 10–12
    { len: 7, pads: 4 }, { len: 7, pads: 5 }, { len: 7, pads: 6 },   // 13–15
    { len: 8, pads: 4 }, { len: 8, pads: 5 }, { len: 8, pads: 6 },   // 16–18
    { len: 9, pads: 5 }, { len: 9, pads: 6 }                         // 19–20
  ];

  var css = [
    '.sl-pads{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.8rem;width:100%;max-width:22rem;}',
    '.sl-pads.sl-six{grid-template-columns:repeat(6,minmax(0,1fr));max-width:26rem;}',
    '.sl-six .sl-pad{grid-column:span 2;}',
    '.sl-six.sl-five .sl-pad:nth-child(4){grid-column:2 / span 2;}',
    '.sl-pad{aspect-ratio:1;min-width:0;width:100%;border-radius:var(--radius);border:3px solid var(--line);cursor:pointer;padding:.4rem;',
    'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.1rem;font-weight:900;line-height:1;',
    'transition:background-color .15s,transform .15s,box-shadow .15s;}',
    '.sl-pad:disabled{cursor:default;}',
    '.sl-num{font-size:clamp(1.8rem,9vw,2.6rem);font-family:var(--font-display);}',
    '.sl-shape{font-size:clamp(1.3rem,6vw,1.8rem);}',
    '.sl-memory{background:var(--memory-soft);border-color:var(--memory);color:var(--memory);}',
    '.sl-attention{background:var(--attention-soft);border-color:var(--attention);color:var(--attention);}',
    '.sl-logic{background:var(--logic-soft);border-color:var(--logic);color:var(--logic);}',
    '.sl-language{background:var(--language-soft);border-color:var(--language);color:var(--language);}',
    '.sl-sun{background:var(--sun-soft);border-color:var(--sun);color:var(--ink);}',
    '.sl-accent{background:var(--accent-soft);border-color:var(--accent);color:var(--accent);}',
    '.sl-memory.is-on{background:var(--memory);}',
    '.sl-attention.is-on{background:var(--attention);}',
    '.sl-logic.is-on{background:var(--logic);}',
    '.sl-language.is-on{background:var(--language);}',
    '.sl-sun.is-on{background:var(--sun);}',
    '.sl-accent.is-on{background:var(--accent);}',
    '.sl-pad.is-on{color:var(--surface);transform:scale(1.05);box-shadow:0 0 0 5px var(--sun);}',
    '.sl-sun.is-on{color:var(--ink);box-shadow:0 0 0 5px var(--ink);}',
    '.sl-dots{display:flex;gap:.45rem;justify-content:center;flex-wrap:wrap;min-height:1rem;}',
    '.sl-dot{width:.9rem;height:.9rem;border-radius:50%;border:2px solid var(--ink-soft);}',
    '.sl-dot.is-done{background:var(--accent);border-color:var(--accent);}',
    '@media (prefers-reduced-motion: reduce){.sl-pad.is-on{transform:none;}}'
  ].join('');

  BrainGames.register({
    id: 'sequence-lights',
    name: 'רצף אורות',
    skill: 'memory',
    tagline: 'צפו ברצף האורות וחזרו עליו',
    benefit: 'זיכרון עבודה וזיכרון רצפים',
    instructions: [
      'צפו: הכפתורים יידלקו אחד אחרי השני, לאט.',
      'זכרו את הסדר. לכל כפתור יש מספר וצורה משלו.',
      'כשכתוב "עכשיו תורכם" — לחצו על הכפתורים באותו סדר.',
      'שכחתם? לחצו "הראו לי שוב" פעם אחת בכל שלב.'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var length = LEVELS[level - 1].len;
      var padCount = Math.max(2, Math.min(PADS.length, LEVELS[level - 1].pads));
      var pads = PADS.slice(0, padCount);

      var round = 0;
      var score = 0;
      var seq = [];
      var pos = 0;
      var accepting = false;
      var replayUsed = false;

      var padEls = pads.map(function (p, i) {
        return el('button', {
          class: 'sl-pad sl-' + p.hue, type: 'button', disabled: true,
          'aria-label': p.label + ' ' + p.name,
          onclick: function () { onTap(i); }
        }, [
          el('span', { class: 'sl-num', 'aria-hidden': 'true' }, p.label),
          el('span', { class: 'sl-shape', 'aria-hidden': 'true' }, p.shape)
        ]);
      });
      var padsWrap = el('div', {
        class: 'sl-pads' + (padCount > 4 ? ' sl-six' : '') + (padCount === 5 ? ' sl-five' : '')
      }, padEls);
      var dots = el('div', { class: 'sl-dots', 'aria-hidden': 'true' });
      var hint = el('p', { class: 'g-hint' }, '');
      var replayBtn = el('button', {
        class: 'btn btn-secondary', type: 'button', disabled: true, onclick: replay
      }, 'הראו לי שוב');

      root.appendChild(padsWrap);
      root.appendChild(dots);
      root.appendChild(hint);
      root.appendChild(el('div', { class: 'g-actions' }, replayBtn));

      function setPads(enabled) {
        padEls.forEach(function (b) { b.disabled = !enabled; });
      }

      function renderDots() {
        dots.innerHTML = '';
        for (var i = 0; i < seq.length; i++) {
          dots.appendChild(el('span', { class: 'sl-dot' + (i < pos ? ' is-done' : '') }));
        }
      }

      function makeSequence() {
        var s = [];
        for (var i = 0; i < length; i++) {
          var n;
          do { n = ctx.randInt(0, padCount - 1); }
          while (i >= 2 && n === s[i - 1] && n === s[i - 2]); // no triple repeats
          s.push(n);
        }
        return s;
      }

      function playSequence() {
        accepting = false;
        setPads(false);
        replayBtn.disabled = true;
        pos = 0;
        renderDots();
        ctx.setStatus(round === 1 && !replayUsed && padCount > 4
          ? 'שימו לב: הפעם יש ' + padCount + ' כפתורים. צפו ברצף…'
          : 'צפו ברצף…');
        hint.textContent = 'ברצף יש ' + seq.length + ' אורות';
        var chain = ctx.wait(800);
        seq.forEach(function (idx) {
          chain = chain.then(function () {
            padEls[idx].classList.add('is-on');
            ctx.sound('note', pads[idx].freq);
            return ctx.wait(ON_MS);
          }).then(function () {
            padEls[idx].classList.remove('is-on');
            return ctx.wait(GAP_MS);
          });
        });
        return chain.then(function () {
          ctx.setStatus('עכשיו תורכם');
          hint.textContent = 'לחצו על הכפתורים באותו סדר';
          setPads(true);
          replayBtn.disabled = replayUsed;
          accepting = true;
        });
      }

      function replay() {
        if (!accepting || replayUsed) return;
        replayUsed = true;
        playSequence();
      }

      function flash(idx) {
        var b = padEls[idx];
        b.classList.add('is-on');
        ctx.wait(300).then(function () { b.classList.remove('is-on'); });
      }

      function onTap(idx) {
        if (!accepting) return;
        flash(idx);
        ctx.sound('note', pads[idx].freq);

        if (idx !== seq[pos]) {
          endRound(false);
          return;
        }
        pos++;
        renderDots();
        if (pos >= seq.length) endRound(true);
      }

      function endRound(ok) {
        accepting = false;
        setPads(false);
        replayBtn.disabled = true;
        if (ok) score++;
        var msg = ok ? null : 'הרצף היה: ' + seq.map(function (i) { return pads[i].label; }).join(' ← ');
        ctx.wait(400).then(function () {
          return ctx.feedback(ok, msg || undefined);
        }).then(function () {
          return ctx.wait(500);
        }).then(nextRound);
      }

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({
            correct: score,
            total: ROUNDS,
            note: 'חזרתם נכון על ' + score + ' מתוך ' + ROUNDS + ' רצפים של ' + length + ' אורות'
          });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        replayUsed = false;
        seq = makeSequence();
        playSequence();
      }

      nextRound();
    }
  });
})();
