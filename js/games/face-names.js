/* פנים ושמות — remember who is who: name (and at higher levels profession and city) (memory).
   Levels 1–20 add people and details, 21–30 make them easier to mix up, and 31–50 ask harder questions:
   wrong answers that differ in one detail only, a detail asked by the name alone, and (41+) linking two
   details without the face or the name ("what does the one from Haifa do?"). */
(function () {
  'use strict';

  var MAX_QUESTIONS = 8;
  var MIN_QUESTIONS = 6;

  // Single-codepoint characters only (no skin-tone or ZWJ sequences). g: m / f / n (either).
  var CHARS = [
    { e: '👮', g: 'm' }, { e: '👷', g: 'm' }, { e: '💂', g: 'm' }, { e: '🧙', g: 'm' }, { e: '🧛', g: 'm' },
    { e: '🤴', g: 'm' }, { e: '🎅', g: 'm' }, { e: '🧞', g: 'm' }, { e: '🤵', g: 'm' }, { e: '👴', g: 'm' },
    { e: '👦', g: 'm' }, { e: '🧔', g: 'm' },
    { e: '👸', g: 'f' }, { e: '🤶', g: 'f' }, { e: '🧚', g: 'f' }, { e: '👰', g: 'f' }, { e: '👵', g: 'f' },
    { e: '👧', g: 'f' }, { e: '👩', g: 'f' },
    { e: '🐻', g: 'n' }, { e: '🦊', g: 'n' }, { e: '🐼', g: 'n' }, { e: '🐸', g: 'n' }, { e: '🦉', g: 'n' },
    { e: '🐯', g: 'n' }, { e: '🦁', g: 'n' }, { e: '🐨', g: 'n' }, { e: '🐰', g: 'n' }, { e: '🐵', g: 'n' }
  ];

  var NAMES = {
    m: ['יוסי', 'דני', 'משה', 'אבי', 'רוני', 'איתי', 'עומר', 'גיל', 'אורי', 'נועם', 'יונתן', 'דוד',
      'שמעון', 'אלון', 'עידו', 'רפי', 'מיכאל', 'חיים', 'בני', 'צביקה'],
    f: ['נועה', 'מיכל', 'שירה', 'רחל', 'תמר', 'יעל', 'אורית', 'דנה', 'רותי', 'שרה', 'ליאת', 'מירב',
      'הדס', 'אסתר', 'נורית', 'גלית', 'סיגל', 'ענת', 'רינה', 'חנה']
  };

  // [masculine, feminine]
  var PROFS = [
    ['נגר', 'נגרית'], ['טבח', 'טבחית'], ['רופא', 'רופאה'], ['מורה', 'מורה'], ['צלם', 'צלמת'],
    ['ספר', 'ספרית'], ['אופה', 'אופה'], ['נהג', 'נהגת'], ['חשמלאי', 'חשמלאית'], ['רואה חשבון', 'רואת חשבון'],
    ['עורך דין', 'עורכת דין'], ['טייס', 'טייסת'], ['זמר', 'זמרת'], ['צייר', 'ציירת'], ['ספרן', 'ספרנית'],
    ['רוקח', 'רוקחת'], ['חקלאי', 'חקלאית'], ['מהנדס', 'מהנדסת'], ['וטרינר', 'וטרינרית'], ['מתכנת', 'מתכנתת']
  ];

  var CITIES = ['חיפה', 'ירושלים', 'תל אביב', 'באר שבע', 'אילת', 'נתניה', 'טבריה', 'אשדוד', 'רחובות',
    'צפת', 'עכו', 'הרצליה', 'חולון', 'כפר סבא', 'רעננה', 'עפולה'];

  var css = [
    '.fn-people{width:100%;max-width:34rem;display:grid;grid-template-columns:repeat(auto-fill,minmax(7.5rem,1fr));gap:.6rem;}',
    '.fn-card{background:var(--memory-soft);border:2px solid var(--memory);border-radius:var(--radius);padding:.6rem .4rem;',
    'display:flex;flex-direction:column;align-items:center;gap:.3rem;text-align:center;min-width:0;}',
    '.fn-face{font-size:2.8rem;line-height:1.1;}',
    '.fn-name{font-size:1.4rem;font-weight:800;color:var(--ink);}',
    '.fn-detail{font-size:1.1rem;font-weight:600;color:var(--ink-soft);line-height:1.3;overflow-wrap:break-word;max-width:100%;}',
    /* with profession (and city): one compact row per person, so up to 8 people fit one screen */
    '.fn-people.fn-list{grid-template-columns:1fr;max-width:24rem;gap:.35rem;}',
    '.fn-list .fn-card{flex-direction:row;padding:.15rem .7rem;gap:.6rem;text-align:start;}',
    '.fn-list .fn-face{font-size:1.9rem;line-height:1;flex:none;}',
    '.fn-text{display:flex;flex-wrap:wrap;align-items:baseline;gap:0 .5rem;min-width:0;line-height:1.2;}',
    '.fn-list .fn-name{font-size:1.25rem;}',
    '.fn-list .fn-detail{font-size:1.05rem;line-height:1.2;}',
    '.fn-ask{display:flex;flex-direction:column;align-items:center;gap:.4rem;}',
    '.fn-ask .fn-face{font-size:5rem;background:var(--memory-soft);border:3px solid var(--memory);border-radius:50%;',
    'width:8rem;height:8rem;display:grid;place-items:center;}',
    '.fn-choices{max-width:30rem;}',
    '.fn-label-q{font-size:1.45rem;font-weight:800;text-align:center;background:var(--memory-soft);border:2px solid var(--memory);',
    'border-radius:var(--radius);padding:.6rem 1.2rem;margin:0;text-wrap:balance;}',
    '.fn-choices.fn-faces{grid-template-columns:repeat(2,minmax(0,1fr));max-width:20rem;}',
    '.fn-face-choice .fn-face{font-size:3rem;}',
    '.fn-choices.fn-wide{grid-template-columns:1fr;}',
    '.fn-choices .g-choice{font-size:1.25rem;line-height:1.3;}'
  ].join('');

  function clampLevel(l) {
    l = Math.round(Number(l) || 1);
    return Math.max(1, Math.min(50, l));
  }

  BrainGames.register({
    id: 'face-names',
    name: 'פנים ושמות',
    skill: 'memory',
    tagline: 'זכרו מי זה מי',
    benefit: 'זיכרון שמות וקישור בין פנים למידע',
    instructions: [
      'יופיעו כמה דמויות, ולכל אחת שם (ובשלבים מתקדמים גם מקצוע ועיר).',
      'זכרו מי זה מי, ולחצו "זכרתי, הלאה" כשתהיו מוכנים.',
      'כל דמות תופיע שוב לבד. בחרו את השם הנכון מתוך ארבע אפשרויות (ברמות הגבוהות לפעמים להפך: בחרו את הדמות).',
      'ברמות הגבוהות ביותר יש גם שאלות בלי פנים: "מה המקצוע של רחל?" או "מה המקצוע של מי שגרה בחיפה?".'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = clampLevel(ctx.level);
      var n = Math.min(8, 2 + Math.round((level - 1) * 6 / 19));   // 2 → 8 people
      var withProf = level >= 8;
      var withCity = level >= 15;
      // Levels 21–30 keep 8 people but make them easier to mix up: everyone on a board is the same
      // gender (21+), the names sound alike (24+), and some questions go the other way (26+):
      // the details are shown and the player picks the face.
      var sameGender = level >= 21;
      var similarNames = level >= 24;
      var reverseShare = level >= 26 ? (level >= 35 ? 0.25 : level >= 28 ? 0.5 : 0.35) : 0;
      // 31–50: every wrong answer differs from the right one in one detail only (31+); some questions
      // show only the name and ask one detail (35+); some link two details with no face and no name
      // (41+, more of them each level). The rest are the usual "who is this?" questions.
      var oneSwap = level >= 31;
      var detailShare = level >= 35 ? 0.25 : 0;
      var chainShare = level >= 41 ? 0.2 + (level - 41) * 0.03 : 0;
      var totalQ = n >= MIN_QUESTIONS ? n : Math.min(MAX_QUESTIONS, n * Math.ceil(MIN_QUESTIONS / n));

      var asked = 0;
      var score = 0;

      function profOf(p) { return PROFS[p.prof][p.g === 'f' ? 1 : 0]; }
      function detailOf(p) {
        var s = '';
        if (withProf) s += profOf(p);
        if (withCity) s += ' מ' + CITIES[p.city];
        return s;
      }
      function labelOf(p) {
        var d = detailOf(p);
        return d ? p.name + ', ' + d : p.name;
      }

      // Names that share a first letter with another name (רחל, רותי, רינה...), shuffled within groups.
      function similarNameList(g) {
        var groups = {};
        NAMES[g].forEach(function (nm) { (groups[nm.charAt(0)] = groups[nm.charAt(0)] || []).push(nm); });
        var out = [];
        ctx.shuffle(Object.keys(groups)).forEach(function (k) {
          if (groups[k].length >= 2) out = out.concat(ctx.shuffle(groups[k]));
        });
        return out;
      }

      function makePeople() {
        if (sameGender) {
          var g0 = ctx.pick(['m', 'f']);
          // faces and names not used in the last rounds and games, so the new ones do not mix with the old
          var pool = ctx.fresh('face', CHARS.filter(function (c) { return c.g === g0 || c.g === 'n'; }), n, function (c) { return c.e; });
          var names = similarNames ? similarNameList(g0) : ctx.fresh('name-' + g0, NAMES[g0], n);
          if (names.length < n) names = names.concat(ctx.shuffle(NAMES[g0].filter(function (x) { return names.indexOf(x) === -1; })));
          var profs0 = ctx.shuffle(PROFS.map(function (_, i) { return i; }));
          var cities0 = ctx.shuffle(CITIES.map(function (_, i) { return i; }));
          return pool.map(function (c, i) {
            return { emoji: c.e, g: g0, name: names[i], prof: profs0[i], city: cities0[i] };
          });
        }
        var chars = ctx.fresh('face', CHARS, n, function (c) { return c.e; });
        var gs = chars.map(function (c) { return c.g === 'n' ? ctx.pick(['m', 'f']) : c.g; });
        var count = function (g) { return gs.filter(function (x) { return x === g; }).length; };
        var freshNames = { m: ctx.fresh('name-m', NAMES.m, count('m')), f: ctx.fresh('name-f', NAMES.f, count('f')) };
        var usedNames = {};
        var profs = ctx.shuffle(PROFS.map(function (_, i) { return i; }));
        var cities = ctx.shuffle(CITIES.map(function (_, i) { return i; }));
        return chars.map(function (c, i) {
          var g = gs[i];
          var name = freshNames[g].shift();
          while (!name || usedNames[name]) name = ctx.pick(NAMES[g]);
          usedNames[name] = true;
          return { emoji: c.e, g: g, name: name, prof: profs[i], city: cities[i] };
        });
      }

      function randomOtherName(exclude) {
        var g = ctx.pick(['m', 'f']);
        var pool = NAMES[g].filter(function (x) { return !exclude[x]; });
        return { name: ctx.pick(pool), g: g };
      }

      function buildChoices(p, people) {
        var others = ctx.shuffle(people.filter(function (q) { return q !== p; }));
        var exclude = {};
        people.forEach(function (q) { exclude[q.name] = true; });
        var seen = {};
        var out = [];
        seen[labelOf(p)] = true;
        function add(c) {
          var lab = labelOf(c);
          if (seen[lab] || out.length >= 3) return;
          seen[lab] = true;
          out.push(c);
        }
        function otherName(k) {
          if (others[k]) return { name: others[k].name, g: others[k].g };
          var r = randomOtherName(exclude);
          exclude[r.name] = true;
          return r;
        }
        function otherProf(k) {
          if (others[k]) return others[k].prof;
          var i; do { i = ctx.randInt(0, PROFS.length - 1); } while (i === p.prof);
          return i;
        }
        function otherCity(k) {
          if (others[k]) return others[k].city;
          var i; do { i = ctx.randInt(0, CITIES.length - 1); } while (i === p.city);
          return i;
        }
        var tries = 0;
        if (!withProf) {
          while (out.length < 3 && tries++ < 50) {
            var on = otherName(out.length);
            add({ name: on.name, g: on.g, prof: p.prof, city: p.city });
          }
          return ctx.shuffle([p].concat(out));
        }
        var cands = [];
        if (oneSwap) {
          // 31+: each wrong answer changes exactly one thing, taken from another person on the board
          var swaps = [];
          others.forEach(function (q) {
            swaps.push({ name: q.name, g: q.g, prof: p.prof, city: p.city });
            swaps.push({ name: p.name, g: p.g, prof: q.prof, city: p.city });
            if (withCity) swaps.push({ name: p.name, g: p.g, prof: p.prof, city: q.city });
          });
          // one of each kind first, so name, profession and city are all tested
          var kinds = withCity ? 3 : 2;
          for (var s0 = 0; s0 < kinds; s0++) add(swaps[s0]);
          ctx.shuffle(swaps).forEach(add);
          if (out.length >= 3) return ctx.shuffle([p].concat(out));
        }
        // Mix of "right name, wrong detail" and "wrong name, right detail" so both links are tested.
        var a = otherName(0), b = otherName(1);
        cands.push({ name: p.name, g: p.g, prof: otherProf(0), city: p.city });
        cands.push({ name: a.name, g: a.g, prof: p.prof, city: p.city });
        if (withCity) cands.push({ name: p.name, g: p.g, prof: p.prof, city: otherCity(1) });
        cands.push({ name: a.name, g: a.g, prof: otherProf(0), city: withCity ? otherCity(0) : p.city });
        cands.push({ name: b.name, g: b.g, prof: otherProf(1), city: p.city });
        cands.forEach(add);
        while (out.length < 3 && tries++ < 80) {
          var r = otherName(ctx.randInt(0, 3));
          add({ name: r.name, g: r.g, prof: ctx.randInt(0, PROFS.length - 1), city: ctx.randInt(0, CITIES.length - 1) });
        }
        return ctx.shuffle([p].concat(out));
      }

      function nextBoard() {
        if (asked >= totalQ) {
          ctx.finish({
            correct: score,
            total: totalQ,
            note: 'זיהיתם נכון ' + score + ' מתוך ' + totalQ + ' דמויות' +
              (withProf ? (withCity ? ' (שם, מקצוע ועיר)' : ' (שם ומקצוע)') : '')
          });
          return;
        }
        ctx.setProgress(asked + 1, totalQ);
        root.innerHTML = '';
        var people = makePeople();
        var count = Math.min(n, totalQ - asked);

        ctx.setStatus(withProf ? (withCity ? 'זכרו שם, מקצוע ועיר של כל אחד' : 'זכרו את השם והמקצוע של כל אחד')
          : 'זכרו את השם של כל אחד');
        var cards = people.map(function (p) {
          var face = el('span', { class: 'fn-face', 'aria-hidden': 'true' }, p.emoji);
          if (withProf) {
            return el('div', { class: 'fn-card' }, [face, el('span', { class: 'fn-text' }, [
              el('span', { class: 'fn-name' }, p.name),
              el('span', { class: 'fn-detail' }, detailOf(p))
            ])]);
          }
          return el('div', { class: 'fn-card' }, [face, el('span', { class: 'fn-name' }, p.name)]);
        });
        var readyBtn = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: go }, 'זכרתי, הלאה');
        root.appendChild(el('div', { class: 'fn-people' + (withProf ? ' fn-list' : '') }, cards));
        if (!ctx.timed && !withProf) root.appendChild(el('p', { class: 'g-hint' }, 'אין מגבלת זמן. קחו את הזמן שאתם צריכים.'));
        root.appendChild(el('div', { class: 'g-actions' }, readyBtn));
        ctx.studyTimer(readyBtn, 4000 + people.length * (withCity ? 4500 : withProf ? 3500 : 2500));

        var started = false;
        function go() {
          if (started) return;
          started = true;
          readyBtn.disabled = true;
          ctx.sound('tap');
          root.innerHTML = '';
          var order = ctx.shuffle(people).slice(0, count);
          ctx.wait(400).then(function () { ask(order, 0, people); });
        }
      }

      function ask(order, i, people) {
        if (i >= order.length) { nextBoard(); return; }
        var p = order[i];
        ctx.setProgress(asked + 1, totalQ);
        root.innerHTML = '';
        var she = p.g === 'f';
        var roll = Math.random();
        if (roll < chainShare) { askChain(order, i, people); return; }
        if (roll < chainShare + detailShare) { askDetail(order, i, people); return; }
        if (roll < chainShare + detailShare + reverseShare) { askFace(order, i, people); return; }
        ctx.setStatus(withProf ? (she ? 'מי זאת?' : 'מי זה?') : (she ? 'איך קוראים לה?' : 'איך קוראים לו?'));
        var choices = buildChoices(p, people);
        var answered = false;
        var buttons = choices.map(function (c) {
          return el('button', {
            class: 'g-choice', type: 'button',
            onclick: function () { choose(c); }
          }, labelOf(c));
        });
        root.appendChild(el('div', { class: 'fn-ask' }, [
          el('span', { class: 'fn-face', 'aria-hidden': 'true' }, p.emoji),
          el('p', { class: 'g-hint' }, withProf ? 'בחרו את השם והפרטים הנכונים' : 'בחרו את השם הנכון')
        ]));
        root.appendChild(el('div', { class: 'g-choices fn-choices' + (withProf ? ' fn-wide' : '') }, buttons));

        function choose(c) {
          if (answered) return;
          answered = true;
          buttons.forEach(function (b) { b.disabled = true; });
          var ok = c === p;
          asked++;
          if (ok) score++;
          choices.forEach(function (x, k) {
            if (x === p) buttons[k].classList.add('is-correct');
            else if (x === c) buttons[k].classList.add('is-wrong');
          });
          ctx.feedback(ok, ok ? undefined : (she ? 'זאת ' : 'זה ') + labelOf(p)).then(function () {
            return ctx.wait(500);
          }).then(function () { ask(order, i + 1, people); });
        }
      }

      // Reverse question: the name and details are shown, the player picks the face.
      function askFace(order, i, people) {
        var p = order[i];
        var she = p.g === 'f';
        ctx.setStatus(she ? 'איזו דמות היא?' : 'איזו דמות הוא?');
        var choices = ctx.shuffle([p].concat(ctx.shuffle(people.filter(function (q) { return q !== p; })).slice(0, 3)));
        var answered = false;
        var buttons = choices.map(function (c) {
          return el('button', {
            class: 'g-choice fn-face-choice', type: 'button', 'aria-label': 'דמות ' + c.emoji,
            onclick: function () { choose(c); }
          }, el('span', { class: 'fn-face', 'aria-hidden': 'true' }, c.emoji));
        });
        root.appendChild(el('div', { class: 'fn-ask' }, [
          el('p', { class: 'fn-label-q' }, labelOf(p)),
          el('p', { class: 'g-hint' }, 'בחרו את הדמות הנכונה')
        ]));
        root.appendChild(el('div', { class: 'g-choices fn-choices fn-faces' }, buttons));

        function choose(c) {
          if (answered) return;
          answered = true;
          buttons.forEach(function (b) { b.disabled = true; });
          var ok = c === p;
          asked++;
          if (ok) score++;
          choices.forEach(function (x, k) {
            if (x === p) buttons[k].classList.add('is-correct');
            else if (x === c) buttons[k].classList.add('is-wrong');
          });
          ctx.feedback(ok, ok ? undefined : labelOf(p) + ' ' + (she ? 'היא ' : 'הוא ') + p.emoji).then(function () {
            return ctx.wait(500);
          }).then(function () { ask(order, i + 1, people); });
        }
      }

      // Shared body for the text questions (35+): a question box and four answers taken from the board.
      function askText(order, i, people, question, status, values, right, fullAnswer) {
        var p = order[i];
        ctx.setStatus(status);
        var choices = ctx.shuffle(values);
        var answered = false;
        var buttons = choices.map(function (v) {
          return el('button', { class: 'g-choice', type: 'button', onclick: function () { choose(v); } }, v);
        });
        root.appendChild(el('div', { class: 'fn-ask' }, [
          el('p', { class: 'fn-label-q' }, question),
          el('p', { class: 'g-hint' }, 'בחרו את התשובה הנכונה')
        ]));
        root.appendChild(el('div', { class: 'g-choices fn-choices fn-wide' }, buttons));

        function choose(v) {
          if (answered) return;
          answered = true;
          buttons.forEach(function (b) { b.disabled = true; });
          var ok = v === right;
          asked++;
          if (ok) score++;
          choices.forEach(function (x, k) {
            if (x === right) buttons[k].classList.add('is-correct');
            else if (x === v) buttons[k].classList.add('is-wrong');
          });
          ctx.feedback(ok, ok ? undefined : fullAnswer + ' ' + p.emoji).then(function () {
            return ctx.wait(500);
          }).then(function () { ask(order, i + 1, people); });
        }
      }

      // Four answers: the right one and three from other people on the board (all different).
      function boardValues(p, people, valueOf) {
        var right = valueOf(p);
        var out = [right];
        ctx.shuffle(people.filter(function (q) { return q !== p; })).forEach(function (q) {
          var v = valueOf(q);
          if (out.length < 4 && out.indexOf(v) === -1) out.push(v);
        });
        return out;
      }
      function cityOf(p) { return CITIES[p.city]; }

      // 35+: only the name is shown; which profession / city goes with it?
      function askDetail(order, i, people) {
        var p = order[i];
        var she = p.g === 'f';
        var full = p.name + ' ' + (she ? 'היא ' : 'הוא ') + detailOf(p).trim();
        if (Math.random() < 0.5) {
          askText(order, i, people, 'מה המקצוע של ' + p.name + '?', 'מה המקצוע?', boardValues(p, people, profOf), profOf(p), full);
        } else {
          askText(order, i, people, 'מאיפה ' + p.name + '?', 'מאיזו עיר?', boardValues(p, people, cityOf), cityOf(p), full);
        }
      }

      // 41+: no face and no name: from one detail to the other ("what does the one from Haifa do?").
      function askChain(order, i, people) {
        var p = order[i];
        var she = p.g === 'f';
        var full = labelOf(p);
        if (Math.random() < 0.5) {
          askText(order, i, people, 'מה המקצוע של מי ש' + (she ? 'גרה' : 'גר') + ' ב' + cityOf(p) + '?', 'מה המקצוע?',
            boardValues(p, people, profOf), profOf(p), full);
        } else {
          askText(order, i, people, 'באיזו עיר ' + (she ? 'גרה מי שעובדת' : 'גר מי שעובד') + ' כ' + profOf(p) + '?', 'מאיזו עיר?',
            boardValues(p, people, cityOf), cityOf(p), full);
        }
      }

      nextBoard();
    }
  });
})();
