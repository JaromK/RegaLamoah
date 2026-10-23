/* מיון לפי כלל — match a card to a target by the rule shown on screen; the rule changes now and then
   (cognitive flexibility, Wisconsin-card style but the rule is always visible). */
(function () {
  'use strict';

  // Per level (1–20):
  //   dims    – 2 = shape & colour, 3 = also number of shapes
  //   targets – target cards on top (3 or 4)
  //   sw      – [min, max] trials between rule switches
  //   trials  – trials in the session
  //   quiet   – the switch is shown only by the rule label changing (never hidden)
  var LEVELS = [
    { dims: 2, targets: 3, sw: [6, 6], trials: 12 }, // 1
    { dims: 2, targets: 3, sw: [6, 6], trials: 12 }, // 2
    { dims: 2, targets: 3, sw: [5, 5], trials: 12 }, // 3
    { dims: 2, targets: 3, sw: [4, 5], trials: 12 }, // 4
    { dims: 2, targets: 4, sw: [4, 4], trials: 12 }, // 5
    { dims: 3, targets: 3, sw: [6, 6], trials: 12 }, // 6
    { dims: 3, targets: 3, sw: [5, 5], trials: 14 }, // 7
    { dims: 3, targets: 3, sw: [4, 5], trials: 14 }, // 8
    { dims: 3, targets: 4, sw: [5, 5], trials: 14 }, // 9
    { dims: 3, targets: 4, sw: [4, 5], trials: 14 }, // 10
    { dims: 3, targets: 4, sw: [4, 4], trials: 15 }, // 11
    { dims: 3, targets: 4, sw: [3, 4], trials: 15 }, // 12
    { dims: 3, targets: 4, sw: [3, 3], trials: 15 }, // 13
    { dims: 3, targets: 4, sw: [3, 3], trials: 16 }, // 14
    { dims: 3, targets: 4, sw: [2, 3], trials: 16 }, // 15
    { dims: 3, targets: 4, sw: [4, 4], trials: 16, quiet: true }, // 16
    { dims: 3, targets: 4, sw: [3, 4], trials: 16, quiet: true }, // 17
    { dims: 3, targets: 4, sw: [3, 3], trials: 16, quiet: true }, // 18
    { dims: 3, targets: 4, sw: [2, 3], trials: 16, quiet: true }, // 19
    { dims: 3, targets: 4, sw: [2, 3], trials: 16, quiet: true }  // 20
  ];

  var SHAPES = ['circle', 'square', 'triangle', 'star'];
  var SHAPE_NAMES = {
    circle: ['עיגול', 'עיגולים'], square: ['ריבוע', 'ריבועים'],
    triangle: ['משולש', 'משולשים'], star: ['כוכב', 'כוכבים']
  };
  var COLORS = ['memory', 'attention', 'logic', 'language'];
  var RULE_NAMES = { shape: 'צורה', color: 'צבע', num: 'מספר' };
  var NUM_WORDS = ['', 'אחד', 'שניים', 'שלושה', 'ארבעה'];

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var STAR_POINTS = (function () {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var r = i % 2 === 0 ? 18 : 7.5;
      var a = -Math.PI / 2 + i * Math.PI / 5;
      pts.push((20 + r * Math.cos(a)).toFixed(1) + ',' + (21.5 + r * Math.sin(a)).toFixed(1));
    }
    return pts.join(' ');
  })();

  function shapeSvg(shape) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 40 40');
    svg.setAttribute('class', 'sr-shape');
    svg.setAttribute('aria-hidden', 'true');
    var node;
    if (shape === 'circle') {
      node = document.createElementNS(SVG_NS, 'circle');
      node.setAttribute('cx', '20'); node.setAttribute('cy', '20'); node.setAttribute('r', '16');
    } else if (shape === 'square') {
      node = document.createElementNS(SVG_NS, 'rect');
      node.setAttribute('x', '5'); node.setAttribute('y', '5');
      node.setAttribute('width', '30'); node.setAttribute('height', '30'); node.setAttribute('rx', '3');
    } else if (shape === 'triangle') {
      node = document.createElementNS(SVG_NS, 'polygon');
      node.setAttribute('points', '20,3 37,35 3,35');
    } else {
      node = document.createElementNS(SVG_NS, 'polygon');
      node.setAttribute('points', STAR_POINTS);
    }
    node.setAttribute('fill', 'currentColor');
    svg.appendChild(node);
    return svg;
  }

  function describe(card) {
    var nm = SHAPE_NAMES[card.shape];
    return card.num === 1 ? nm[0] : (card.num + ' ' + nm[1]);
  }

  var css = [
    '.sr-targets{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:.6rem;width:100%;max-width:32rem;}',
    '.sr-face{display:flex;flex-wrap:wrap;justify-content:center;align-content:center;gap:.15rem;width:100%;}',
    '.sr-target{min-height:7rem;padding:.5rem .3rem;border-radius:var(--radius);border:3px solid var(--line);',
    'background:var(--surface);cursor:pointer;display:grid;place-items:center;transition:background-color .2s,border-color .2s;}',
    '.sr-target:hover:not(:disabled){border-color:var(--accent);background:var(--accent-soft);}',
    '.sr-target:disabled{cursor:default;}',
    '.sr-target.is-correct{border-color:var(--good);background:var(--good-soft);}',
    '.sr-target.is-wrong{border-color:var(--bad);background:var(--bad-soft);}',
    '.sr-target .sr-face{max-width:4.6rem;}',
    '.sr-target .sr-shape{width:2.1rem;height:2.1rem;}',
    '.sr-target .sr-face.sr-one .sr-shape{width:3rem;height:3rem;}',
    '.sr-rule{display:flex;flex-direction:column;align-items:center;gap:.2rem;padding:.6rem 1.4rem;border-radius:var(--radius);',
    'background:var(--executive-soft);border:2px solid var(--executive);color:var(--ink);text-align:center;}',
    '.sr-rule-label{font-size:1.1rem;color:var(--ink-soft);font-weight:700;}',
    '.sr-rule-name{font-family:var(--font-display);font-size:2.2rem;font-weight:900;line-height:1.1;color:var(--executive);}',
    '.sr-rule.sr-flash{animation:sr-flash .9s ease-in-out 2;}',
    '@keyframes sr-flash{0%,100%{transform:scale(1);}50%{transform:scale(1.08);border-color:var(--sun);background:var(--sun-soft);}}',
    '.sr-rule.sr-changed .sr-rule-label{color:var(--executive);font-weight:900;font-size:1.15rem;}',
    '.sr-card{width:9rem;min-height:9rem;padding:.8rem;border-radius:var(--radius);border:3px dashed var(--ink-soft);',
    'background:var(--surface);display:grid;place-items:center;}',
    '.sr-card .sr-face{max-width:6.4rem;gap:.3rem;}',
    '.sr-card .sr-shape{width:2.9rem;height:2.9rem;}',
    '.sr-card .sr-face.sr-one .sr-shape{width:4.6rem;height:4.6rem;}',
    '.sr-card.sr-hidden{visibility:hidden;}',
    '@media (max-width:380px){.sr-target{min-height:6rem;}.sr-target .sr-shape{width:1.8rem;height:1.8rem;}',
    '.sr-target .sr-face{max-width:3.9rem;}.sr-rule-name{font-size:1.9rem;}}'
  ].join('');

  BrainGames.register({
    id: 'sort-rule',
    name: 'מיון לפי כלל',
    skill: 'executive',
    tagline: 'התאימו כרטיסים לפי הכלל, גם כשהוא משתנה',
    benefit: 'גמישות מחשבתית ומעבר בין כללים',
    instructions: [
      'למטה מופיע כרטיס, ולמעלה כמה כרטיסי מטרה.',
      'הכלל כתוב באמצע: מיינו לפי צורה, צבע או מספר.',
      'לחצו על כרטיס המטרה שמתאים לכרטיס לפי הכלל הזה בלבד.',
      'מדי פעם הכלל משתנה. הסתכלו על הכלל לפני כל לחיצה.'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var dims = spec.dims === 3 ? ['shape', 'color', 'num'] : ['shape', 'color'];
      var nTargets = spec.targets;
      var total = spec.trials;
      var quiet = !!spec.quiet;

      // Targets differ from one another on every dimension, so the card can match each of them
      // on at most one dimension, and exactly one target by the active rule.
      var shapes = ctx.shuffle(SHAPES.slice());
      var colors = ctx.shuffle(COLORS.slice());
      var nums = ctx.shuffle([1, 2, 3, 4]);
      var targets = [];
      for (var t = 0; t < nTargets; t++) {
        targets.push({ shape: shapes[t], color: colors[t], num: spec.dims === 3 ? nums[t] : 1 });
      }

      var trial = 0;
      var score = 0;
      var switches = 0;
      var rule = ctx.pick(dims);
      var untilSwitch = ctx.randInt(spec.sw[0], spec.sw[1]);
      var lastCardKey = '';

      function face(card) {
        var f = el('div', { class: 'sr-face' + (card.num === 1 ? ' sr-one' : ''), style: { color: 'var(--' + card.color + ')' } });
        for (var i = 0; i < card.num; i++) f.appendChild(shapeSvg(card.shape));
        return f;
      }

      // Build the board once; only the card and rule label change between trials.
      root.innerHTML = '';
      var targetBtns = targets.map(function (tg, i) {
        return el('button', {
          class: 'sr-target', type: 'button', disabled: true,
          'aria-label': describe(tg),
          onclick: function () { onPick(i); }
        }, face(tg));
      });
      var targetRow = el('div', { class: 'sr-targets', style: { '--n': String(nTargets) } }, targetBtns);
      var ruleName = el('span', { class: 'sr-rule-name' }, RULE_NAMES[rule]);
      // The rule label doubles as the "rule changed" notice, so the board never grows.
      var ruleLabel = el('span', { class: 'sr-rule-label' }, 'מיינו לפי:');
      var ruleBox = el('div', { class: 'sr-rule', 'aria-live': 'polite' }, [ruleLabel, ruleName]);
      var card = el('div', { class: 'sr-card sr-hidden', role: 'img', 'aria-label': 'הכרטיס למיון' });
      root.appendChild(targetRow);
      root.appendChild(ruleBox);
      root.appendChild(card);

      var current = null;   // { card, answer }
      var accepting = false;

      function makeCard() {
        for (var tries = 0; tries < 20; tries++) {
          var order = ctx.shuffle(targets.map(function (_, i) { return i; }));
          var c = { shape: null, color: null, num: 1 };
          var answer = -1;
          dims.forEach(function (d, k) {
            c[d] = targets[order[k]][d];
            if (d === rule) answer = order[k];
          });
          var key = c.shape + c.color + c.num;
          if (key !== lastCardKey) { lastCardKey = key; return { card: c, answer: answer }; }
        }
        return { card: c, answer: answer };
      }

      function setStatusForRule() {
        ctx.setStatus('לחצו על הכרטיס שמתאים לפי ' + RULE_NAMES[rule]);
      }

      function nextTrial() {
        if (trial >= total) {
          ctx.finish({
            correct: score,
            total: total,
            note: 'מיינתם נכון ' + score + ' מתוך ' + total + ' כרטיסים, והכלל התחלף ' + switches + ' פעמים'
          });
          return;
        }
        var announce = null;
        if (trial > 0) {
          untilSwitch--;
          if (untilSwitch <= 0) {
            var others = dims.filter(function (d) { return d !== rule; });
            rule = ctx.pick(others);
            untilSwitch = ctx.randInt(spec.sw[0], spec.sw[1]);
            switches++;
            announce = rule;
          }
        }
        trial++;
        ctx.setProgress(trial, total);
        targetBtns.forEach(function (b) { b.classList.remove('is-correct', 'is-wrong'); });
        card.classList.add('sr-hidden');
        ruleName.textContent = RULE_NAMES[rule];

        var ready;
        if (announce && !quiet) {
          ctx.setStatus('שימו לב: הכלל השתנה!');
          ruleLabel.textContent = 'הכלל השתנה! עכשיו לפי:';
          ruleBox.classList.add('sr-changed');
          ruleBox.classList.remove('sr-flash');
          void ruleBox.offsetWidth; // restart the animation
          ruleBox.classList.add('sr-flash');
          ctx.sound('note', 587);
          ready = ctx.wait(2000);
        } else {
          ruleLabel.textContent = 'מיינו לפי:';
          ruleBox.classList.remove('sr-changed');
          ready = ctx.wait(trial === 1 ? 200 : 350);
        }

        ready.then(function () {
          // At the top levels only the rule label itself changes, so the status stays generic.
          if (quiet) ctx.setStatus('לחצו על הכרטיס המתאים לפי הכלל');
          else setStatusForRule();
          current = makeCard();
          card.innerHTML = '';
          card.appendChild(face(current.card));
          card.setAttribute('aria-label', describe(current.card));
          card.classList.remove('sr-hidden');
          targetBtns.forEach(function (b) { b.disabled = false; });
          accepting = true;
        });
      }

      function onPick(i) {
        if (!accepting || !current) return;
        accepting = false;
        targetBtns.forEach(function (b) { b.disabled = true; });
        var ok = i === current.answer;
        if (ok) score++;
        targetBtns[current.answer].classList.add('is-correct');
        if (!ok) targetBtns[i].classList.add('is-wrong');
        var msg;
        if (!ok) {
          var c = current.card;
          var why = rule === 'shape' ? 'אותה צורה: ' + SHAPE_NAMES[c.shape][0]
            : rule === 'num' ? 'אותו מספר: ' + NUM_WORDS[c.num]
            : 'אותו צבע';
          msg = 'הכלל: ' + RULE_NAMES[rule] + ' — ' + why;
        }
        ctx.feedback(ok, msg).then(nextTrial);
      }

      setStatusForRule();
      nextTrial();
    }
  });
})();
