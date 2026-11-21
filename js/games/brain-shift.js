/* החלפת משימה — task switching. A card shows a coloured shape (later with a number). A cue says which feature
   counts now: צבע, צורה or מספר. The two answer buttons stay the same all session; each shows one value of every
   feature (e.g. red + circle + "זוגי" against blue + square + "אי-זוגי"), so the player must switch which feature
   they look at. The cue gets less explicit with the level: word + icon → icon only → the card's place on the board.
   Untimed (executive). */
(function () {
  'use strict';

  var TRIALS = 16;
  var NUMS = [1, 2, 3, 4, 6, 7, 8, 9]; // 5 is left out so "greater than 5" is never in doubt

  var RULE = {
    color: { word: 'צבע', icon: '🎨' },
    shape: { word: 'צורה', icon: '◯▢' },
    num: { word: 'מספר', icon: '123' }
  };

  /* Level 1–50 → rules in play, how often the rule changes, how the cue is shown, how tricky the cards are.
     cue: 'word' (big banner: icon + word) · 'icon' (icon only) · 'pos' (the card's row on the board says the rule;
     posWords = the rows are labelled with words too). numKind: 'parity' (זוגי / אי-זוגי) or 'big' (גדול / קטן מ-5).
     tricky = share of cards on which the other features point to the other button. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, Math.round(Number(level)) || 1));
    var s = { level: L };
    if (L <= 10) {
      s.rules = ['color', 'shape'];
      s.switches = [1, 2, 2, 3, 4, 5, 6, 7, 8, 9][L - 1];
    } else if (L <= 20) {
      s.rules = ['color', 'shape', 'num'];
      s.switches = 4 + (L - 11);               // 4 … 13
    } else {
      s.rules = ['color', 'shape', 'num'];
      s.switches = Math.min(15, 9 + ((L - 21) % 5) + Math.floor((L - 21) / 10)); // a new cue style starts calmer
    }
    s.cue = L <= 25 ? 'word' : L <= 35 ? 'icon' : 'pos';
    s.posWords = L <= 42;
    s.numKind = L >= 21 && L % 2 === 0 ? 'big' : 'parity';
    s.tricky = L <= 4 ? 0 : Math.min(0.9, 0.3 + (L - 5) * 0.02);
    s.mixPairs = L >= 21; // which shape goes with which colour on the buttons changes per session
    return s;
  }

  /* The rule for each of the 16 cards, with exactly s.switches changes. With few changes, runs are long. */
  function makeRules(s, R) {
    var points = [];
    for (var i = 1; i < TRIALS; i++) points.push(i);
    var chosen = null;
    for (var a = 0; a < 300 && !chosen; a++) {
      var pick = R.shuffle(points).slice(0, s.switches).sort(function (x, y) { return x - y; });
      var minGap = s.switches <= 3 ? 3 : s.switches <= 6 ? 2 : 1;
      var okGap = pick.every(function (p, j) { return j === 0 ? p >= minGap : p - pick[j - 1] >= minGap; });
      if (okGap) chosen = pick;
    }
    if (!chosen) chosen = R.shuffle(points).slice(0, s.switches);
    var sw = {};
    chosen.forEach(function (p) { sw[p] = true; });
    var rule = R.pick(s.rules), out = [];
    for (var t = 0; t < TRIALS; t++) {
      if (sw[t]) { var cur = rule; rule = R.pick(s.rules.filter(function (r) { return r !== cur; })); }
      out.push(rule);
    }
    // every rule in play should come up at least once
    s.rules.forEach(function (r) {
      if (out.indexOf(r) === -1) {
        // turn the longest run's middle into this rule (adds switches only when needed)
        var best = 0, bestLen = 0;
        for (var k = 0; k < TRIALS;) { var e = k; while (e < TRIALS && out[e] === out[k]) e++; if (e - k > bestLen) { bestLen = e - k; best = k; } k = e; }
        for (var m = best + Math.floor(bestLen / 3); m < best + Math.floor(bestLen / 3) + Math.max(2, Math.floor(bestLen / 3)) && m < TRIALS; m++) out[m] = r;
      }
    });
    return out;
  }

  /* The two buttons: each holds one value of every feature. */
  function makeButtons(s, R) {
    var shapes = s.mixPairs && R.randInt(0, 1) ? ['square', 'circle'] : ['circle', 'square'];
    var nums = s.numKind === 'big' ? ['big', 'small'] : ['even', 'odd'];
    return [{ color: 'red', shape: shapes[0], num: nums[0] }, { color: 'blue', shape: shapes[1], num: nums[1] }];
  }

  function numValue(n, kind) { return kind === 'big' ? (n > 5 ? 'big' : 'small') : (n % 2 === 0 ? 'even' : 'odd'); }
  function valueOf(card, rule, s) { return rule === 'num' ? numValue(card.n, s.numKind) : card[rule]; }
  /* index (0/1) of the right button */
  function answerFor(card, rule, s, buttons) { return buttons[0][rule] === valueOf(card, rule, s) ? 0 : 1; }

  /* A card for this rule. Tricky cards: some other feature in play points to the other button. */
  function makeCard(rule, s, buttons, R, prev) {
    for (var t = 0; t < 100; t++) {
      var c = { color: R.pick(['red', 'blue']), shape: R.pick(['circle', 'square']), n: R.pick(NUMS) };
      if (prev && c.color === prev.color && c.shape === prev.shape && c.n === prev.n) continue;
      var right = answerFor(c, rule, s, buttons);
      var other = s.rules.filter(function (r) { return r !== rule; }).some(function (r) { return answerFor(c, r, s, buttons) !== right; });
      var wantTricky = R.randInt(0, 99) < s.tricky * 100;
      if (wantTricky && !other && t < 90) continue;
      return c;
    }
    return c;
  }

  var COLOR_NAME = { red: 'אדום', blue: 'כחול' };
  var SHAPE_NAME = { circle: 'עיגול', square: 'ריבוע' };
  var NUM_NAME = { even: 'זוגי', odd: 'אי-זוגי', big: 'גדול מ-5', small: 'קטן מ-5' };

  function explain(card, rule, s) {
    if (rule === 'color') return 'הכלל עכשיו: צבע. הצבע ' + COLOR_NAME[card.color] + ', ולכן הכפתור ה' + COLOR_NAME[card.color] + '.';
    if (rule === 'shape') return 'הכלל עכשיו: צורה. זה ' + SHAPE_NAME[card.shape] + ', ולכן הכפתור עם ה' + SHAPE_NAME[card.shape] + '.';
    var v = numValue(card.n, s.numKind);
    return 'הכלל עכשיו: מספר. ' + card.n + (s.numKind === 'big' ? (v === 'big' ? ' גדול מ-5' : ' קטן מ-5') : (v === 'even' ? ' הוא זוגי' : ' הוא אי-זוגי')) +
      ', ולכן "' + NUM_NAME[v] + '".';
  }

  /* a coloured shape as SVG (with an optional number) */
  function shapeSvg(color, shape, num) {
    var fill = 'var(--c-' + color + ')';
    var body = shape === 'circle'
      ? '<circle cx="50" cy="50" r="46" fill="' + fill + '"/>'
      : '<rect x="6" y="6" width="88" height="88" rx="8" fill="' + fill + '"/>';
    if (num != null) body += '<text x="50" y="52" text-anchor="middle" dominant-baseline="central" fill="#fff" font-size="56" font-weight="900">' + num + '</text>';
    return '<svg viewBox="0 0 100 100" aria-hidden="true">' + body + '</svg>';
  }

  var css = [
    '.bsh-stage{width:100%;max-width:24rem;display:flex;flex-direction:column;align-items:center;gap:.6rem;min-height:var(--bsh-stage,17rem);justify-content:center;}',
    '.bsh-cue{display:flex;align-items:center;justify-content:center;gap:.6rem;min-width:13rem;padding:.35rem 1.2rem;border-radius:var(--radius);',
    'border:3px solid var(--ink);background:var(--surface);font-size:1.9rem;font-weight:900;line-height:1.2;}',
    '.bsh-cue .bsh-ico{font-size:1.7rem;}',
    '.bsh-cue.bsh-icon-only{min-width:7rem;font-size:2.4rem;}',
    '.bsh-cue.bsh-icon-only .bsh-ico{font-size:2.4rem;}',
    '.bsh-cue.is-new{animation:bsh-pop .45s ease-out;}',
    '@keyframes bsh-pop{0%{transform:scale(.85)}60%{transform:scale(1.08)}100%{transform:scale(1)}}',
    '@media (prefers-reduced-motion: reduce){.bsh-cue.is-new{animation:none;}}',
    '.bsh-ico{font-weight:900;letter-spacing:.02em;direction:ltr;}',
    '.bsh-card{width:9.5rem;height:9.5rem;}',
    '.bsh-card svg,.bsh-btn svg,.bsh-mini svg{width:100%;height:100%;display:block;}',
    '.bsh-card text{font-family:var(--font-display);}',
    /* cue by place: three rows, each one a rule */
    '.bsh-rows{width:100%;display:flex;flex-direction:column;gap:.35rem;}',
    '.bsh-row{display:flex;align-items:center;gap:.5rem;height:6.3rem;border:3px solid var(--line);border-radius:var(--radius);background:var(--surface-2);padding:0 .6rem;}',
    '.bsh-row-lab{width:5rem;flex:none;display:flex;flex-direction:column;align-items:center;font-weight:900;font-size:1.15rem;color:var(--ink-soft);}',
    '.bsh-row-lab .bsh-ico{font-size:1.5rem;color:var(--ink);}',
    '.bsh-row-slot{flex:1;display:grid;place-items:center;height:100%;}',
    '.bsh-row .bsh-card{width:5.4rem;height:5.4rem;}',
    '.bsh-row.is-on{border-color:var(--ink);background:var(--surface);}',
    /* the two fixed answer buttons */
    '.bsh-answers{width:100%;max-width:24rem;display:grid;grid-template-columns:1fr 1fr;gap:.7rem;}',
    '.bsh-btn{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.25rem;min-height:6.6rem;padding:.4rem;}',
    '.bsh-btn .bsh-mini{width:3.4rem;height:3.4rem;}',
    '.bsh-btn .bsh-word{font-size:1.35rem;font-weight:900;line-height:1.1;}',
    /* explanation after a wrong answer */
    '.bsh-why{width:100%;display:flex;flex-direction:column;align-items:center;gap:.6rem;background:var(--sun-soft);border:2px solid var(--sun);',
    'border-radius:var(--radius);padding:.7rem .8rem;text-align:center;font-size:1.2rem;font-weight:800;line-height:1.35;}',
    '.bsh-why .bsh-card{width:5rem;height:5rem;}'
  ].join('');

  BrainGames.register({
    id: 'brain-shift',
    name: 'החלפת משימה',
    skill: 'executive',
    tagline: 'הכלל מתחלף: פעם הצבע קובע, פעם הצורה ופעם המספר',
    benefit: 'גמישות מחשבתית ומעבר בין משימות',
    instructions: [
      'בכל פעם תופיע צורה צבעונית (ובהמשך עם מספר). שלט גדול אומר מה קובע עכשיו: צבע, צורה או מספר.',
      'שני הכפתורים למטה לא משתנים. בכל כפתור יש צבע, צורה (ובהמשך גם מילה כמו "זוגי").',
      'לחצו על הכפתור שמתאים לצורה רק לפי מה שקובע עכשיו. למשל כשהשלט אומר "צבע" ויש עיגול כחול, לוחצים על הכפתור הכחול.',
      'הכלל מתחלף מדי פעם. בשלבים הגבוהים רואים רק סמל, ואחר כך המקום של הצורה על הלוח אומר מה קובע. אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makeRules: makeRules, makeButtons: makeButtons, makeCard: makeCard, answerFor: answerFor, explain: explain },
    start: function (root, ctx) {
      var el = ctx.el;
      var s = spec(ctx.level);
      var rules = makeRules(s, ctx);
      var buttons = makeButtons(s, ctx);
      var showNum = s.rules.indexOf('num') !== -1;
      var trial = 0, score = 0, switchTotal = 0, switchRight = 0, accepting = false, prevCard = null;
      var ROW_ORDER = ['color', 'shape', 'num'];

      var stage = el('div', { class: 'bsh-stage', style: { '--bsh-stage': s.cue === 'pos' ? '20.2rem' : '16.5rem' } });
      var btnEls = buttons.map(function (b, i) {
        var kids = [el('span', { class: 'bsh-mini', html: shapeSvg(b.color, b.shape) })];
        if (showNum) kids.push(el('span', { class: 'bsh-word' }, NUM_NAME[b.num]));
        var label = COLOR_NAME[b.color] + ', ' + SHAPE_NAME[b.shape] + (showNum ? ', ' + NUM_NAME[b.num] : '');
        return el('button', { class: 'g-choice bsh-btn', type: 'button', disabled: true, 'aria-label': label, onclick: function () { answer(i); } }, kids);
      });
      root.appendChild(stage);
      root.appendChild(el('div', { class: 'bsh-answers' }, btnEls));

      function cardEl(c) { return el('div', { class: 'bsh-card', html: shapeSvg(c.color, c.shape, showNum ? c.n : null) }); }

      function showTrial() {
        if (trial >= TRIALS) {
          var note = 'עניתם נכון על ' + score + ' מתוך ' + TRIALS + ' צורות';
          if (switchTotal) note += ' · מיד אחרי החלפת כלל: ' + switchRight + ' מתוך ' + switchTotal;
          ctx.finish({ correct: score, total: TRIALS, note: note });
          return;
        }
        ctx.setProgress(trial + 1, TRIALS);
        var rule = rules[trial];
        var changed = trial > 0 && rules[trial - 1] !== rule;
        var c = makeCard(rule, s, buttons, ctx, prevCard);
        prevCard = c;
        stage.innerHTML = '';
        if (s.cue === 'pos') {
          var rowsEls = ROW_ORDER.filter(function (r) { return s.rules.indexOf(r) !== -1; }).map(function (r) {
            var lab = el('div', { class: 'bsh-row-lab' }, [el('span', { class: 'bsh-ico' }, RULE[r].icon)].concat(s.posWords ? [el('span', null, RULE[r].word)] : []));
            var slot = el('div', { class: 'bsh-row-slot' }, r === rule ? cardEl(c) : null);
            return el('div', { class: 'bsh-row' + (r === rule ? ' is-on' : '') }, [lab, slot]);
          });
          stage.appendChild(el('div', { class: 'bsh-rows' }, rowsEls));
          ctx.setStatus('השורה של הצורה אומרת מה קובע');
        } else {
          var cue = el('div', { class: 'bsh-cue' + (s.cue === 'icon' ? ' bsh-icon-only' : '') + (changed ? ' is-new' : ''), 'aria-label': 'הכלל: ' + RULE[rule].word },
            [el('span', { class: 'bsh-ico' }, RULE[rule].icon)].concat(s.cue === 'word' ? [el('span', null, RULE[rule].word)] : []));
          stage.appendChild(cue);
          stage.appendChild(cardEl(c));
          ctx.setStatus(changed && s.level <= 10 ? 'שימו לב: הכלל התחלף!' : 'לחצו לפי ה' + (s.cue === 'word' ? RULE[rule].word : 'סמל'));
        }
        btnEls.forEach(function (b) { b.className = 'g-choice bsh-btn'; b.disabled = false; });
        accepting = true;
        showTrial.card = c;
      }

      function answer(i) {
        if (!accepting) return;
        accepting = false;
        btnEls.forEach(function (b) { b.disabled = true; });
        var rule = rules[trial], c = showTrial.card;
        var right = answerFor(c, rule, s, buttons);
        var ok = i === right;
        var switched = trial > 0 && rules[trial - 1] !== rule;
        if (switched) switchTotal++;
        if (ok) { score++; if (switched) switchRight++; }
        btnEls[i].classList.add(ok ? 'is-correct' : 'is-wrong');
        if (ok) {
          ctx.sound('good');
          ctx.wait(750).then(function () { trial++; showTrial(); });
          return;
        }
        btnEls[right].classList.add('is-correct');
        ctx.sound('bad');
        ctx.setStatus('לא נורא, הנה ההסבר');
        stage.innerHTML = '';
        var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { next.disabled = true; trial++; showTrial(); } },
          trial + 1 >= TRIALS ? 'לסיכום' : 'הבא');
        stage.appendChild(el('div', { class: 'bsh-why', role: 'note' }, [
          el('span', { class: 'bsh-ico', style: { fontSize: '1.6rem' } }, RULE[rule].icon), cardEl(c), el('p', { style: { margin: 0 } }, explain(c, rule, s)), next]));
      }

      ctx.wait(300).then(showTrial);
    }
  });
})();
