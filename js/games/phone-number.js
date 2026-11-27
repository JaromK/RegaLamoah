/* מספר טלפון — remember a phone number, then type it on a big phone keypad. Levels go from 4 digits to a full
   Israeli mobile number, then typing it backwards, then two contacts (type the one asked), then a number written
   in Hebrew words ("אפס חמש שתיים…") typed as digits. After checking, every digit shows if it was right. Memory, untimed. */
(function () {
  'use strict';

  var WORDS = ['אפס', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע'];
  var CONTACTS = [['👩', 'רותי'], ['👨', 'דני'], ['👵', 'סבתא שרה'], ['👴', 'סבא משה'], ['👩‍⚕️', 'ד״ר לוי'],
    ['🧑', 'אבי'], ['👧', 'נועה'], ['👨‍🔧', 'השרברב'], ['👩‍🦳', 'השכנה מרים'], ['🧔', 'יוסי']];

  var PLAIN = [4, 4, 5, 5, 6, 6, 7, 7, 9, 10];       // levels 1–10
  var TWO = [6, 6, 7, 7, 9, 9, 10, 10, 10, 10];        // levels 21–30
  var WORD = [7, 7, 9, 9, 10, 10, 10, 10, 10, 10];     // levels 31–40

  /* Level 1–50 → a list of task kinds to cycle through; each { kind: plain|back|two|words, n: digits, words?, alike? } */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    if (L <= 10) return { tasks: [{ kind: 'plain', n: PLAIN[L - 1] }] };
    if (L <= 20) {
      var nb = 4 + Math.floor((L - 11) / 2);           // 4 → 8 digits backwards
      return { tasks: [{ kind: 'back', n: nb }, { kind: 'plain', n: 10 }, { kind: 'back', n: nb }] };
    }
    if (L <= 30) return { tasks: [{ kind: 'two', n: TWO[L - 21], alike: L >= 27 }] };
    if (L <= 40) return { tasks: [{ kind: 'plain', n: WORD[L - 31], words: true }].concat(L >= 36 ? [{ kind: 'back', n: 6 + Math.floor((L - 36) / 2), words: true }] : []) };
    var nb2 = 8 + Math.floor((L - 41) / 4);           // 8 → 10
    var t = [{ kind: 'back', n: nb2 }, { kind: 'two', n: 10, alike: true }, { kind: 'plain', n: 10, words: true }, { kind: 'back', n: Math.min(10, nb2), words: L >= 44 }];
    if (L >= 46) t.push({ kind: 'two', n: 10, alike: true, words: true });
    return { tasks: t };
  }

  function chunks(n) {
    return { 4: [4], 5: [5], 6: [3, 3], 7: [3, 4], 8: [4, 4], 9: [2, 3, 4], 10: [3, 3, 4] }[n] || [n];
  }
  function split(s, sizes) {
    var out = [], i = 0;
    sizes.forEach(function (k) { out.push(s.slice(i, i + k)); i += k; });
    return out;
  }

  function digits(rnd, k) { var s = ''; for (var i = 0; i < k; i++) s += rnd.randInt(0, 9); return s; }
  function makeNumber(n, rnd, prefix) {
    var s;
    for (var guard = 0; guard < 50; guard++) {
      if (prefix) s = prefix + digits(rnd, n - prefix.length);
      else if (n === 10) s = '05' + rnd.pick('0234578'.split('')) + digits(rnd, 7);
      else if (n === 9) s = '0' + rnd.pick('234689'.split('')) + digits(rnd, 7);
      else s = rnd.randInt(n === 7 ? 2 : 1, 9) + digits(rnd, n - 1);
      // no long runs of one digit (too easy) and not all one digit
      if (!/(\d)\1\1/.test(s)) break;
    }
    return s;
  }

  /* One task: { kind, contacts: [{ face, name, num }], ask: index, answer: digits to type, show: chunk sizes, type: chunk sizes, words } */
  function makeTask(t, rnd) {
    // contacts not used in the last questions and games (ctx.fresh), so names do not get mixed up
    var k = t.kind === 'two' ? 2 : 1;
    var people = (rnd.fresh ? rnd.fresh('contacts', CONTACTS, k, function (c) { return c[1]; }) : rnd.shuffle(CONTACTS).slice(0, k))
      .map(function (c) { return { face: c[0], name: c[1] }; });
    var prefix = null;
    people.forEach(function (p, i) {
      if (t.alike && i === 1) prefix = people[0].num.slice(0, t.n >= 9 ? 3 : 2);
      do { p.num = makeNumber(t.n, rnd, prefix); } while (i === 1 && p.num === people[0].num);
    });
    var ask = rnd.randInt(0, people.length - 1);
    var num = people[ask].num;
    var answer = t.kind === 'back' ? num.split('').reverse().join('') : num;
    var show = chunks(t.n);
    return { kind: t.kind, contacts: people, ask: ask, answer: answer, show: show,
      type: t.kind === 'back' ? show.slice().reverse() : show, words: !!t.words };
  }

  function makeSession(sp, rnd, count) {
    var out = [];
    for (var i = 0; i < count; i++) out.push(makeTask(sp.tasks[i % sp.tasks.length], rnd));
    return out;
  }

  // which typed digits are right
  function marks(answer, typed) {
    return answer.split('').map(function (d, i) { return typed[i] === d; });
  }

  var css = [
    '.pn-wrap{display:flex;flex-direction:column;align-items:center;gap:.6rem;width:100%;}',
    '.pn-card{width:100%;max-width:24rem;display:flex;flex-direction:column;align-items:center;gap:.3rem;background:var(--surface-2);border:2px solid var(--line);',
    'border-radius:var(--radius);padding:.55rem .8rem;}',
    '.pn-face{font-size:2.6rem;line-height:1;flex:none;}',
    '.pn-info{display:flex;flex-direction:column;gap:.15rem;min-width:0;flex:1;}',
    '.pn-name{font-size:1.2rem;font-weight:800;}',
    '.pn-num{direction:ltr;text-align:center;font-family:var(--font-display);font-weight:900;font-size:2rem;letter-spacing:.04em;font-variant-numeric:tabular-nums;white-space:nowrap;}',
    '.pn-num.pn-small{font-size:1.75rem;}',
    '.pn-words{display:flex;flex-direction:column;align-items:center;text-align:center;gap:.25rem;font-size:1.25rem;font-weight:800;line-height:1.3;}',
    '.pn-words span{display:block;}',
    '.pn-who{display:flex;align-items:center;gap:.5rem;font-size:1.25rem;font-weight:800;}',
    '.pn-who .pn-face{font-size:2.2rem;}',
    '.pn-slots{display:flex;direction:ltr;gap:.4rem;justify-content:center;max-width:100%;}',
    '.pn-grp{display:flex;gap:.1rem;}',
    '.pn-slot{width:1.75rem;height:2.6rem;flex:none;border-bottom:3px solid var(--ink-soft);display:flex;align-items:center;justify-content:center;',
    'font-family:var(--font-display);font-weight:900;font-size:1.65rem;font-variant-numeric:tabular-nums;border-radius:4px 4px 0 0;}',
    '.pn-slot.pn-cur{border-bottom-color:var(--accent);background:var(--accent-soft);}',
    '.pn-slot.is-correct{background:var(--good-soft);color:var(--good);border-bottom-color:var(--good);}',
    '.pn-slot.is-wrong{background:var(--bad-soft);color:var(--bad);border-bottom-color:var(--bad);}',
    '.pn-pad{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:.45rem;width:100%;max-width:19rem;direction:ltr;}',
    '.pn-key{min-height:3.5rem;border-radius:var(--radius);border:2px solid var(--line);background:var(--surface);color:var(--ink);',
    'font-family:var(--font-display);font-weight:900;font-size:1.8rem;cursor:pointer;}',
    '.pn-key.pn-fn{font-family:inherit;font-size:1.1rem;font-weight:800;background:var(--surface-2);}',
    '.pn-key:hover:not(:disabled){border-color:var(--accent);}',
    '.pn-key:active:not(:disabled){background:var(--accent-soft);}',
    '.pn-key:disabled{opacity:.45;cursor:default;}',
    '.pn-long .pn-slot{width:1.45rem;font-size:1.5rem;}',
    '.pn-right{display:flex;flex-direction:column;align-items:center;gap:.1rem;font-weight:800;font-size:1.1rem;}',
    '.pn-right .pn-num{font-size:1.6rem;color:var(--good);}'
  ].join('');

  BrainGames.register({
    id: 'phone-number',
    name: 'מספר טלפון',
    skill: 'memory',
    isNew: true,
    maxLevel: 50,
    tagline: 'זכרו מספר טלפון והקלידו אותו',
    benefit: 'זיכרון עבודה למספרים',
    instructions: [
      'יופיע מספר טלפון של אחד מאנשי הקשר. זכרו אותו, ולחצו "זכרתי, הלאה".',
      'הקלידו את המספר על המקלדת הגדולה ולחצו "בדיקה". ספרה שגויה תסומן באדום.',
      'ברמות הגבוהות: מקלידים את המספר מהסוף להתחלה, זוכרים שני מספרים, או קוראים מספר שכתוב במילים ("אפס חמש…").',
      'טיפ: זכרו את המספר בקבוצות קטנות, כמו 054 - 123 - 4567. אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makeTask: makeTask, makeSession: makeSession, marks: marks, chunks: chunks, WORDS: WORDS },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var COUNT = 6, tasks = makeSession(sp, ctx, COUNT), idx = 0, good = 0;

      function next() {
        if (idx >= COUNT) {
          ctx.finish({ correct: good, total: COUNT, note: 'הקלדתם נכון ' + good + ' מתוך ' + COUNT + ' מספרים' });
          return;
        }
        var t = tasks[idx++];
        ctx.setProgress(idx, COUNT);
        memorise(t);
      }

      function numText(s, sizes) { return split(s, sizes).join('-'); }
      function wordsBox(s, sizes) {
        return el('div', { class: 'pn-words' }, split(s, sizes).map(function (g) {
          return el('span', null, g.split('').map(function (d) { return WORDS[+d]; }).join(' '));
        }));
      }

      function memorise(t) {
        root.innerHTML = '';
        var w = el('div', { class: 'pn-wrap' });
        root.appendChild(w);
        ctx.setStatus(t.contacts.length > 1 ? 'זכרו את שני המספרים' : 'זכרו את מספר הטלפון');
        t.contacts.forEach(function (c) {
          var body = t.words ? wordsBox(c.num, t.show) : el('div', { class: 'pn-num' + (t.contacts.length > 1 ? ' pn-small' : '') }, numText(c.num, t.show));
          w.appendChild(el('div', { class: 'pn-card' }, [el('div', { class: 'pn-who' }, [el('span', { class: 'pn-face', 'aria-hidden': 'true' }, c.face),
            el('span', { class: 'pn-name' }, c.name)]), body]));
        });
        if (t.kind === 'back') w.appendChild(el('p', { class: 'g-hint', style: { margin: 0, fontSize: '1.1rem', fontWeight: '700' } }, 'שימו לב: תקלידו אותו מהסוף להתחלה'));
        else if (t.words) w.appendChild(el('p', { class: 'g-hint', style: { margin: 0, fontSize: '1.1rem', fontWeight: '700' } }, 'תקלידו אותו בספרות'));
        var ready = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: go }, 'זכרתי, הלאה');
        w.appendChild(el('div', { class: 'g-actions' }, ready));
        ctx.studyTimer(ready, 3000 + 1000 * t.answer.length * t.contacts.length + (t.words ? 3000 : 0));
        var gone = false;
        function go() {
          if (gone) return;
          gone = true; ready.disabled = true; ctx.sound('tap');
          root.innerHTML = '';
          ctx.wait(300).then(function () { typeIt(t); });
        }
      }

      function typeIt(t) {
        root.innerHTML = '';
        var w = el('div', { class: 'pn-wrap' });
        root.appendChild(w);
        var who = t.contacts[t.ask], N = t.answer.length;
        ctx.setStatus(t.kind === 'back' ? 'הקלידו את המספר מהסוף להתחלה' : t.contacts.length > 1 ? 'הקלידו את המספר של ' + who.name : 'הקלידו את המספר');
        w.appendChild(el('div', { class: 'pn-who' }, [el('span', { class: 'pn-face', 'aria-hidden': 'true' }, who.face),
          el('span', null, (t.kind === 'back' ? '↩ ' : '') + who.name)]));
        var slots = [], typed = '';
        var groups = split(t.answer, t.type).map(function (g) {
          return el('div', { class: 'pn-grp' }, g.split('').map(function () { var s = el('span', { class: 'pn-slot' }); slots.push(s); return s; }));
        });
        w.appendChild(el('div', { class: 'pn-slots' + (N >= 9 ? ' pn-long' : ''), 'aria-live': 'polite' }, groups));
        var keys = [];
        function key(label, fn, cls, aria) {
          var b = el('button', { class: 'pn-key ' + (cls || ''), type: 'button', 'aria-label': aria || label, onclick: fn }, label);
          keys.push(b); return b;
        }
        var pad = el('div', { class: 'pn-pad' });
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach(function (d) { pad.appendChild(key(d, function () { press(d); })); });
        pad.appendChild(key('נקה', clearAll, 'pn-fn', 'למחוק הכול'));
        pad.appendChild(key('0', function () { press('0'); }));
        pad.appendChild(key('⌫', back, 'pn-fn', 'למחוק ספרה'));
        w.appendChild(pad);
        var checkBtn = el('button', { class: 'btn btn-primary btn-lg', type: 'button', disabled: true, onclick: check }, 'בדיקה');
        var actions = el('div', { class: 'g-actions' }, checkBtn);
        w.appendChild(actions);
        var done = false;
        draw();

        function draw() {
          slots.forEach(function (s, i) { s.textContent = typed[i] || ''; s.classList.toggle('pn-cur', i === typed.length); });
          checkBtn.disabled = typed.length !== N;
          checkBtn.textContent = typed.length === N ? 'בדיקה' : 'בדיקה (עוד ' + (N - typed.length) + ')';
        }
        function press(d) { if (done || typed.length >= N) return; ctx.sound('tap'); typed += d; draw(); }
        function back() { if (done || !typed) return; ctx.sound('tap'); typed = typed.slice(0, -1); draw(); }
        function clearAll() { if (done) return; typed = ''; draw(); }
        function check() {
          if (done || typed.length !== N) return;
          done = true;
          var m = marks(t.answer, typed), ok = m.every(Boolean);
          if (ok) good++;
          slots.forEach(function (s, i) { s.classList.remove('pn-cur'); s.classList.add(m[i] ? 'is-correct' : 'is-wrong'); });
          keys.forEach(function (k) { k.disabled = true; });
          var right = m.filter(Boolean).length;
          ctx.setStatus(ok ? 'כל הספרות נכונות!' : right + ' מתוך ' + N + ' ספרות נכונות');
          actions.innerHTML = '';
          if (!ok) {
            pad.remove();
            w.insertBefore(el('div', { class: 'pn-right' }, [el('span', null, 'המספר הנכון:'), el('span', { class: 'pn-num' }, numText(t.answer, t.type))]), actions);
            if (t.kind === 'back') w.insertBefore(el('p', { class: 'g-hint', style: { margin: 0 } }, 'המספר המקורי: ' + numText(who.num, t.show)), actions);
          }
          ctx.feedback(ok, ok ? null : 'הספרות באדום לא נכונות').then(function () {
            if (ok) { ctx.wait(600).then(next); return; } // a correct answer moves on by itself
            var nb = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { nb.disabled = true; next(); } },
              idx >= COUNT ? 'לסיכום' : 'למספר הבא');
            actions.appendChild(nb);
          });
        }
      }
      next();
    }
  });
})();
