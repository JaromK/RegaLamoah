/* פנים ושמות — remember who is who: name (and at higher levels profession and city) (memory). */
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
    '.fn-detail{font-size:1.05rem;font-weight:600;color:var(--ink-soft);line-height:1.3;overflow-wrap:break-word;max-width:100%;}',
    '.fn-ask{display:flex;flex-direction:column;align-items:center;gap:.4rem;}',
    '.fn-ask .fn-face{font-size:5rem;background:var(--memory-soft);border:3px solid var(--memory);border-radius:50%;',
    'width:8rem;height:8rem;display:grid;place-items:center;}',
    '.fn-choices{max-width:30rem;}',
    '.fn-choices.fn-wide{grid-template-columns:1fr;}',
    '.fn-choices .g-choice{font-size:1.25rem;line-height:1.3;}'
  ].join('');

  function clampLevel(l) {
    l = Math.round(Number(l) || 1);
    return Math.max(1, Math.min(20, l));
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
      'כל דמות תופיע שוב לבד. בחרו את השם הנכון מתוך ארבע אפשרויות.'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = clampLevel(ctx.level);
      var n = Math.min(8, 2 + Math.round((level - 1) * 6 / 19));   // 2 → 8 people
      var withProf = level >= 8;
      var withCity = level >= 15;
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

      function makePeople() {
        var chars = ctx.shuffle(CHARS).slice(0, n);
        var usedNames = {};
        var profs = ctx.shuffle(PROFS.map(function (_, i) { return i; }));
        var cities = ctx.shuffle(CITIES.map(function (_, i) { return i; }));
        return chars.map(function (c, i) {
          var g = c.g === 'n' ? ctx.pick(['m', 'f']) : c.g;
          var name;
          do { name = ctx.pick(NAMES[g]); } while (usedNames[name]);
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
        // Mix of "right name, wrong detail" and "wrong name, right detail" so both links are tested.
        var cands = [];
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
          return el('div', { class: 'fn-card' }, [
            el('span', { class: 'fn-face', 'aria-hidden': 'true' }, p.emoji),
            el('span', { class: 'fn-name' }, p.name),
            withProf ? el('span', { class: 'fn-detail' }, detailOf(p)) : null
          ]);
        });
        var readyBtn = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: go }, 'זכרתי, הלאה');
        root.appendChild(el('div', { class: 'fn-people' }, cards));
        root.appendChild(el('p', { class: 'g-hint' }, 'אין מגבלת זמן. קחו את הזמן שאתם צריכים.'));
        root.appendChild(el('div', { class: 'g-actions' }, readyBtn));

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

      nextBoard();
    }
  });
})();
