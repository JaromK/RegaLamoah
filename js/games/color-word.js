/* צבע המילה — a calm Stroop task: name the ink colour (or, at higher levels, the written word). */
(function () {
  'use strict';

  var ROUNDS = 10;

  var COLORS = [
    { id: 'red', name: 'אדום' },
    { id: 'blue', name: 'כחול' },
    { id: 'green', name: 'ירוק' },
    { id: 'yellow', name: 'צהוב' },
    { id: 'purple', name: 'סגול' },
    { id: 'orange', name: 'כתום' }
  ];

  /* Ink colours are the one documented exception to "variables only":
     they are defined here as game tokens, with separate light and dark values. */
  var INK_LIGHT = '--cw-red:#c62828;--cw-blue:#1f57c9;--cw-green:#1d7f36;--cw-yellow:#c99a00;' +
    '--cw-purple:#7a3db5;--cw-orange:#e0640d;--cw-outline:rgba(23,40,43,.55);';
  var INK_DARK = '--cw-red:#ff7070;--cw-blue:#6fa8ff;--cw-green:#62d37f;--cw-yellow:#ffd84d;' +
    '--cw-purple:#c9a0ff;--cw-orange:#ff9d42;--cw-outline:rgba(0,0,0,.6);';

  var CSS = [
    ':root{' + INK_LIGHT + '}',
    '@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){' + INK_DARK + '}}',
    ':root[data-theme="dark"]{' + INK_DARK + '}',
    '.cw-wrap{width:100%;display:flex;flex-direction:column;align-items:center;gap:1.1rem}',
    '.cw-rule{display:inline-block;padding:.35rem 1.1rem;border-radius:999px;font-weight:800;font-size:1.1rem;',
    'border:2px solid transparent;text-align:center}',
    '.cw-rule-ink{background:var(--attention-soft);color:var(--attention);border-color:var(--attention)}',
    '.cw-rule-word{background:var(--logic-soft);color:var(--logic);border-color:var(--logic)}',
    '.cw-rule-match{background:var(--language-soft);color:var(--language);border-color:var(--language)}',
    '.cw-rule.is-changed{box-shadow:0 0 0 4px var(--sun)}',
    '.cw-word{font-family:var(--font-display);font-weight:900;font-size:clamp(3.2rem,16vw,5.2rem);line-height:1.15;',
    'text-align:center;padding:.4rem 1.2rem;min-height:1.3em}',
    '.cw-ink-yellow{text-shadow:0 0 1px var(--cw-outline),0 0 2px var(--cw-outline)}',
    '.cw-choices{max-width:30rem;grid-template-columns:repeat(auto-fit,minmax(8rem,1fr))}',
    '.cw-choice{display:flex;align-items:center;justify-content:center;gap:.6rem;color:var(--ink)}',
    '.cw-swatch{width:1.1rem;height:1.1rem;border-radius:50%;flex:none;border:1px solid var(--line)}'
  ].join('');

  function inkVar(id) { return 'var(--cw-' + id + ')'; }

  /* Difficulty by level (index = level - 1).
     Levels 1-15 spread the original 10-level curve in small steps; 16-20 switch rules more often
     and, from 18, add a third rule: "is the ink the same as the word? yes / no". */
  var N_CHOICES = [3, 3, 4, 4, 4, 5, 5, 5, 5, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6];
  var P_CONGRUENT = [0.8, 0.7, 0.7, 0.6, 0.5, 0.5, 0.4, 0.4, 0.3, 0.3, 0.25, 0.2, 0.15, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1, 0.1];
  // Levels 1-15: chance of the "word" rule in a round. Levels 16-20: chance that the rule changes.
  var P_WORD = [0, 0, 0, 0, 0, 0, 0, 0.2, 0.25, 0.25, 0.3, 0.35, 0.4, 0.4, 0.45];
  var P_SWITCH = { 16: 0.45, 17: 0.55, 18: 0.55, 19: 0.6, 20: 0.65 };
  var P_MATCH = { 18: 0.25, 19: 0.3, 20: 0.35 }; // share of rule changes that go to the yes/no rule

  var RULES = {
    ink: { cls: 'cw-rule-ink', q: 'באיזה צבע כתובה המילה?', pill: 'בחרו את צבע הכתב' },
    word: { cls: 'cw-rule-word', q: 'מה כתוב במילה?', pill: 'בחרו את מה שכתוב' },
    match: { cls: 'cw-rule-match', q: 'האם צבע הכתב זהה למה שכתוב?', pill: 'ענו כן או לא: הצבע זהה למילה?' }
  };
  var YES = { id: 'yes', name: 'כן' };
  var NO = { id: 'no', name: 'לא' };

  BrainGames.register({
    id: 'color-word',
    name: 'צבע המילה',
    skill: 'attention',
    tagline: 'שימו לב לצבע, לא למה שכתוב',
    benefit: 'קשב סלקטיבי ועיכוב תגובה אוטומטית',
    instructions: [
      'על המסך תופיע מילה של צבע, כתובה בצבע כלשהו.',
      'בחרו את הצבע שבו המילה כתובה, ולא את מה שכתוב בה.',
      'בשלבים מתקדמים הכלל מתחלף לפעמים. קראו את הכלל המודגש בכל שלב.',
      'אין שעון. קחו את הזמן.'
    ],
    css: CSS,
    start: function (root, ctx) {
      var level = Math.max(1, Math.min(20, Math.round(Number(ctx.level) || 1)));
      var nChoices = N_CHOICES[level - 1];
      var pCongruent = P_CONGRUENT[level - 1];
      var pWordRule = level <= 15 ? P_WORD[level - 1] : 0;
      var pSwitch = P_SWITCH[level] || 0;
      var pMatch = P_MATCH[level] || 0;
      var round = 0;
      var correct = 0;
      var conflictTotal = 0;
      var conflictCorrect = 0;
      var prevRule = 'ink';
      var usedMatch = false;

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          var note = conflictTotal > 0
            ? 'במילים שצבען שונה ממה שכתוב: ' + conflictCorrect + ' מתוך ' + conflictTotal + ' נכונות.'
            : 'עניתם נכון על ' + correct + ' מתוך ' + ROUNDS + '.';
          ctx.finish({ correct: correct, total: ROUNDS, note: note });
          return;
        }
        ctx.setProgress(round, ROUNDS);

        var rule;
        if (round === 1) {
          rule = 'ink';
        } else if (level <= 15) {
          rule = Math.random() < pWordRule ? 'word' : 'ink';
        } else if (pMatch && !usedMatch && round >= 5 && prevRule !== 'match') {
          rule = 'match'; // make sure the third rule shows up at least once at levels 18-20
        } else if (Math.random() < pSwitch) {
          if (prevRule !== 'match' && Math.random() < pMatch) rule = 'match';
          else if (prevRule === 'match') rule = ctx.pick(['ink', 'word']);
          else rule = prevRule === 'ink' ? 'word' : 'ink';
        } else {
          rule = prevRule;
        }
        var changed = rule !== prevRule;
        prevRule = rule;
        if (rule === 'match') usedMatch = true;

        var word = ctx.pick(COLORS);
        // The yes/no rule uses an even mix so both answers are equally likely.
        var congruent = Math.random() < (rule === 'match' ? 0.5 : pCongruent);
        var ink = congruent ? word : ctx.pick(COLORS.filter(function (c) { return c.id !== word.id; }));
        if (!congruent && rule !== 'match') conflictTotal++;
        var target = rule === 'ink' ? ink : rule === 'word' ? word : (congruent ? YES : NO);

        var opts;
        if (rule === 'match') {
          opts = [YES, NO];
        } else {
          // Options always include both the written word and the ink colour.
          opts = [word];
          if (ink.id !== word.id) opts.push(ink);
          ctx.shuffle(COLORS).forEach(function (c) {
            if (opts.length < nChoices && opts.indexOf(c) === -1) opts.push(c);
          });
          opts = ctx.shuffle(opts);
        }

        ctx.setStatus((changed && rule === 'match' ? 'שאלה חדשה: ' : '') + RULES[rule].q);

        var pill = ctx.el('span', {
          class: 'cw-rule ' + RULES[rule].cls + (changed ? ' is-changed' : ''),
          text: (changed ? 'שימו לב, הכלל השתנה: ' : 'הכלל: ') + RULES[rule].pill
        });

        var wordEl = ctx.el('div', {
          class: 'cw-word cw-ink-' + ink.id,
          style: { color: inkVar(ink.id) },
          'aria-label': 'המילה ' + word.name + ' כתובה בצבע ' + ink.name
        }, word.name);

        var answered = false;
        var buttons = [];
        var choices = ctx.el('div', { class: 'g-choices cw-choices' });
        opts.forEach(function (c) {
          var b = ctx.el('button', {
            class: 'g-choice cw-choice',
            type: 'button',
            onclick: function () { answer(c, b); }
          }, [
            rule === 'match' ? null
              : ctx.el('span', { class: 'cw-swatch', 'aria-hidden': 'true', style: { background: inkVar(c.id) } }),
            ctx.el('span', null, c.name)
          ]);
          buttons.push({ color: c, btn: b });
          choices.appendChild(b);
        });

        root.innerHTML = '';
        root.appendChild(ctx.el('div', { class: 'cw-wrap' }, [pill, wordEl, choices]));

        function answer(c, btn) {
          if (answered) return;
          answered = true;
          buttons.forEach(function (o) {
            o.btn.disabled = true;
            if (o.color === target) o.btn.classList.add('is-correct');
          });
          var ok = c === target;
          if (ok) {
            correct++;
            if (!congruent) conflictCorrect++;
          } else {
            btn.classList.add('is-wrong');
          }
          var msg = ok ? null : (rule === 'ink'
            ? 'המילה כתובה בצבע ' + ink.name
            : rule === 'word'
              ? 'כתוב במילה: "' + word.name + '"'
              : 'כתוב "' + word.name + '" בצבע ' + ink.name + ', לכן התשובה: ' + target.name);
          ctx.feedback(ok, msg)
            .then(function () { return ctx.wait(ok ? 400 : 900); })
            .then(nextRound);
        }
      }

      nextRound();
      return function cleanup() { root.innerHTML = ''; };
    }
  });
})();
