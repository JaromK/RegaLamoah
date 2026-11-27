/* 7 בום — friends sit in a circle and count; every number that is a multiple of 7 or has the digit 7 in it is
   replaced by "בום!". On your turn, say the right thing (attention, inhibition, arithmetic). Untimed. */
(function () {
  'use strict';

  var FRIENDS = [
    { name: 'רותי', face: '👵' }, { name: 'משה', face: '👴' }, { name: 'שרה', face: '👩‍🦳' },
    { name: 'דוד', face: '🧔' }, { name: 'יעל', face: '👩' }, { name: 'אבי', face: '👨' },
    { name: 'חנה', face: '👵' }, { name: 'יוסף', face: '👴' }, { name: 'מירי', face: '👩‍🦰' }, { name: 'עמוס', face: '👨‍🦳' }
  ]; // the friends change from game to game (ctx.fresh)

  /* Level 1–50:
     a = the "בום" number, contains = also when the digit appears, b = a second number that says "טראח"
     (both = "בום טראח"), step = count by, down = count down, friends = how many friends before your turn,
     hide = the friends' words disappear (keep the count in your head). */
  function spec(level) {
    var L = level;
    var s = { a: 7, contains: true, b: 0, step: 1, down: false, friends: 1, hide: false, from: 1 };
    if (L >= 3) s.friends = 2;
    if (L >= 6) s.from = 1 + 10 * ((L - 6) % 5);                // start further on: 11, 21…
    if (L >= 11 && L <= 20) s.a = [3, 4, 6, 8, 9][(L - 11) % 5]; // other numbers
    if (L >= 16) s.friends = 3;
    if (L >= 21 && L <= 30) { s.down = true; s.from = 50 + 10 * ((L - 21) % 5); }
    if (L >= 26 && L <= 30) s.a = [3, 4, 6, 8, 9][(L - 26) % 5];
    if (L >= 31) { s.a = 7; s.b = [3, 4, 5, 3, 4][(L - 31) % 5]; s.from = 1 + 10 * ((L - 31) % 4); }
    if (L >= 36) s.friends = 4;
    if (L >= 41) { s.step = 2; s.from = 2 * (1 + (L % 4)); }
    if (L >= 46) { s.step = 3; s.from = 3; s.hide = true; }
    if (L >= 44) s.hide = true;
    return s;
  }

  function hits(n, k, contains) { return n % k === 0 || (contains && String(n).indexOf(String(k)) !== -1); }

  // what is said for the number n
  function say(n, s) {
    var A = hits(n, s.a, s.contains), B = s.b ? hits(n, s.b, s.contains) : false;
    if (A && B) return 'בום טראח!';
    if (A) return 'בום!';
    if (B) return 'טראח!';
    return String(n);
  }

  // why a number is (or is not) a "בום": "21 = 3 × 7", "יש בו את הספרה 7"
  function because(n, k, contains) {
    var r = [];
    if (n % k === 0) r.push(n + ' = ' + (n / k) + ' × ' + k);
    if (contains && String(n).indexOf(String(k)) !== -1) r.push('יש בו את הספרה ' + k);
    return r.join(' וגם ');
  }
  function why(n, s) {
    var A = hits(n, s.a, s.contains), B = s.b ? hits(n, s.b, s.contains) : false;
    if (!A && !B) return n + ' הוא מספר רגיל: לא מתחלק ב-' + s.a + (s.contains ? ' ואין בו ' + s.a : '') +
      (s.b ? ', וגם לא ב-' + s.b : '');
    var parts = [];
    if (A) parts.push(because(n, s.a, s.contains));
    if (B) parts.push(because(n, s.b, s.contains));
    return 'במקום ' + n + ' אומרים "' + say(n, s) + '", כי ' + parts.join(', וגם ');
  }

  // the rule as one or two short lines
  function ruleLines(s) {
    var out = ['"בום!" = מתחלק ב-' + s.a + (s.contains ? ' או שיש בו ' + s.a : '')];
    if (s.b) out.push('"טראח!" = מתחלק ב-' + s.b + (s.contains ? ' או שיש בו ' + s.b : '') + '. שניהם: "בום טראח!"');
    if (s.down) out.push('סופרים לאחור');
    if (s.step > 1) out.push('סופרים בקפיצות של ' + s.step);
    return out;
  }

  var css = [
    '.sb-rule{margin:0;max-width:26rem;text-align:center;font-size:1.05rem;line-height:1.3;font-weight:700;background:var(--sun-soft);border:2px solid var(--sun);border-radius:var(--radius-sm);padding:.4rem .7rem;}',
    '.sb-circle{display:flex;justify-content:center;gap:.25rem;width:100%;max-width:26rem;}',
    '.sb-seat{display:flex;flex-direction:column;align-items:center;gap:.15rem;flex:1;min-width:0;max-width:5.5rem;}',
    '.sb-face{font-size:2rem;line-height:1;width:3.2rem;height:3.2rem;border-radius:50%;display:grid;place-items:center;background:var(--surface-2);border:3px solid var(--line);}',
    '.sb-seat.is-turn .sb-face{border-color:var(--c-blue);box-shadow:0 0 0 4px var(--c-blue-soft);}',
    '.sb-name{font-weight:800;font-size:1rem;}',
    '.sb-bubble{min-height:2.6rem;width:100%;padding:.1rem .2rem;line-height:1.1;text-align:center;border-radius:var(--radius-sm);background:var(--surface);border:2px solid var(--line);',
    'font-weight:900;font-size:1.3rem;display:grid;place-items:center;}',
    '.sb-bubble.is-boom{background:var(--c-red-soft);border-color:var(--c-red);color:var(--c-red);font-size:.95rem;}',
    '.sb-bubble:empty{visibility:hidden;}',
    '.sb-you .sb-face{background:var(--c-blue-soft);}',
    '.sb-choices{width:100%;max-width:26rem;}',
    '.sb-choices .g-choice{min-height:4rem;font-size:1.6rem;}',
    '.sb-choices .g-choice.sb-boom{color:var(--c-red);}'
  ].join('');

  BrainGames.register({
    id: 'seven-boom',
    name: '7 בום',
    skill: 'attention',
    isNew: true,
    tagline: 'סופרים יחד, ובמקום 7 אומרים "בום!"',
    benefit: 'קשב, עצירת תגובה אוטומטית וחשבון',
    instructions: [
      'אתם יושבים במעגל עם חברים וסופרים בתורות: 1, 2, 3…',
      'במקום מספר שמתחלק ב-7 (או שיש בו את הספרה 7) אומרים "בום!". למשל: 6, בום!, 8.',
      'כשמגיע התור שלכם, בחרו מה להגיד: את המספר הבא, או "בום!".',
      'בהמשך: מספרים אחרים במקום 7, ספירה לאחור, ו"טראח!" למספר שני. אין שעון.'
    ],
    css: css,
    _model: { spec: spec, say: say },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var s = spec(level);
      var TURNS = 12;
      var turn = 0, good = 0;
      var n = s.from;               // the next number to be counted
      var friends = ctx.fresh('friends', FRIENDS, s.friends, function (f) { return f.name; });
      var seats = friends.map(function (f) { return { f: f, bubble: el('div', { class: 'sb-bubble' }) }; });
      var you = { f: { name: 'אתם', face: '🙂' }, bubble: el('div', { class: 'sb-bubble' }) };
      var all = seats.concat([you]);
      var seatEls = all.map(function (st) {
        st.el = el('div', { class: 'sb-seat' + (st === you ? ' sb-you' : '') }, [
          st.bubble, el('span', { class: 'sb-face', 'aria-hidden': 'true' }, st.f.face), el('span', { class: 'sb-name' }, st.f.name)
        ]);
        return st.el;
      });
      var choices = el('div', { class: 'g-choices sb-choices' });
      root.appendChild(el('p', { class: 'sb-rule' }, ruleLines(s).map(function (t, i) { return [i ? el('br') : null, t]; }).reduce(function (a, b) { return a.concat(b); }, [])));
      root.appendChild(el('div', { class: 'sb-circle' }, seatEls));
      root.appendChild(choices);

      function next() { var v = n; n += s.down ? -s.step : s.step; return v; }

      function setBubble(st, text) {
        st.bubble.textContent = text;
        st.bubble.classList.toggle('is-boom', isNaN(Number(text)));
      }

      // "הבנתי, ממשיכים" in the answer area (empty while the friends count), so it never pushes the page down
      function waitTap() {
        return new Promise(function (resolve) {
          var b = el('button', { class: 'btn btn-primary btn-lg', type: 'button', style: { gridColumn: '1 / -1' }, onclick: function () {
            b.remove(); resolve();
          } }, 'הבנתי, ממשיכים');
          choices.appendChild(b);
        });
      }
      function friendsSpeak(i) {
        if (i >= seats.length) { yourTurn(); return; }
        all.forEach(function (st) { st.el.classList.toggle('is-turn', st === seats[i]); });
        var v = next();
        setBubble(seats[i], say(v, s));
        // a friend's "בום" is explained too (unless the numbers are hidden on this level)
        if (!s.hide) ctx.setStatus(say(v, s) === String(v) ? 'החברים סופרים…' : seats[i].f.name + ': ' + why(v, s));
        ctx.sound('note', 440 + i * 60);
        // a friend's בום: the game waits on its reason until the player taps, so there is time to read it
        var explained = !s.hide && say(v, s) !== String(v);
        (explained ? ctx.wait(500).then(waitTap) : ctx.wait(1100)).then(function () {
          if (s.hide) setBubble(seats[i], '');
          friendsSpeak(i + 1);
        });
      }

      function round() {
        if (turn >= TURNS) {
          ctx.finish({ correct: good, total: TURNS, note: 'אמרתם נכון ' + good + ' פעמים מתוך ' + TURNS });
          return;
        }
        turn++;
        ctx.setProgress(turn, TURNS);
        choices.innerHTML = '';
        setBubble(you, '');
        ctx.setStatus(s.hide ? 'הקשיבו לחברים וזכרו איפה הספירה' : 'החברים סופרים…');
        // every few turns make sure a "boom" comes up on the player's turn
        friendsSpeak(0);
      }

      function yourTurn() {
        all.forEach(function (st) { st.el.classList.toggle('is-turn', st === you); });
        var v = n;
        var right = say(v, s);
        // options: the number itself, its neighbours, and the boom words in play
        var opts = [String(v)];
        var near = s.down ? v - s.step : v + s.step;
        if (near > 0) opts.push(String(near));
        if (s.b) opts = [String(v), 'בום!', 'טראח!', 'בום טראח!'];
        else {
          opts.push('בום!');
          opts.push(String(s.down ? v + s.step : Math.max(1, v - s.step)));
          opts = opts.filter(function (o, i) { return opts.indexOf(o) === i; }).slice(0, 4);
        }
        if (opts.indexOf(right) === -1) opts[1] = right;
        opts = ctx.shuffle(opts);
        ctx.setStatus('התור שלכם! מה אומרים?');
        opts.forEach(function (o) {
          var b = el('button', { class: 'g-choice' + (isNaN(Number(o)) ? ' sb-boom' : ''), type: 'button', onclick: function () { answer(o, b); } }, o);
          choices.appendChild(b);
        });
        function answer(o, b) {
          if (choices.dataset.done) return;
          choices.dataset.done = '1';
          [].forEach.call(choices.children, function (x) { x.disabled = true; });
          next();
          setBubble(you, right);
          var ok = o === right;
          if (ok) good++;
          b.classList.add(ok ? 'is-correct' : 'is-wrong');
          if (!ok) [].forEach.call(choices.children, function (x) { if (x.textContent === right) x.classList.add('is-correct'); });
          var text = why(v, s);
          ctx.setStatus((ok ? 'נכון! ' : 'לא בדיוק. ') + text);
          // the toast is short; the full reason stays in the status line. After a mistake the game waits for a tap.
          ctx.feedback(ok, ok ? undefined : 'אומרים: ' + right).then(function () {
            // a right בום keeps its reason on screen a while before going on (a plain number moves on quickly)
            if (ok) return ctx.wait(right === String(v) ? 300 : 3500);
            // after a mistake only the chosen and the right answer stay, and the continue button takes the free row
            [].slice.call(choices.children).forEach(function (x) { if (!x.classList.contains('is-correct') && !x.classList.contains('is-wrong')) x.remove(); });
            return waitTap();
          }).then(function () {
            delete choices.dataset.done;
            seats.forEach(function (st) { setBubble(st, ''); });
            round();
          });
        }
      }

      // make the run more interesting: start a little before a "boom" now and then
      round();
    }
  });
})();
