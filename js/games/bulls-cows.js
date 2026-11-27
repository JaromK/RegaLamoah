/* בול פגיעה — the computer picks a secret number with different digits. Guess it: after each guess it says how many
   digits are a בול (right digit, right place) and how many a פגיעה (right digit, another place). Deduction,
   working memory. Untimed. */
(function () {
  'use strict';

  /* Level 1–50: k = digits in the number, digits = the digits it may use, tries = guesses allowed. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    var d16 = [1, 2, 3, 4, 5, 6], d19 = [1, 2, 3, 4, 5, 6, 7, 8, 9], d09 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    if (L <= 6) return { k: 3, digits: d16, tries: 8 };
    if (L <= 14) return { k: 3, digits: d19, tries: 8 };
    if (L <= 24) return { k: 4, digits: d19, tries: 9 };
    if (L <= 34) return { k: 4, digits: d09, tries: 9 };
    if (L <= 42) return { k: 4, digits: d09, tries: 7 };
    return { k: 5, digits: d09, tries: 9 };
  }

  // בול = right digit, right place; פגיעה = right digit, another place (the digits of a number are all different)
  function score(code, guess) {
    var bul = 0, hit = 0;
    for (var i = 0; i < guess.length; i++) {
      if (code[i] === guess[i]) bul++;
      else if (code.indexOf(guess[i]) !== -1) hit++;
    }
    return { bul: bul, hit: hit };
  }
  function allCodes(sp) {
    var out = [];
    (function go(a) {
      if (a.length === sp.k) { out.push(a); return; }
      sp.digits.forEach(function (d) { if (a.indexOf(d) === -1) go(a.concat([d])); });
    })([]);
    return out;
  }

  var css = [
    '.bc-rows{display:flex;flex-direction:column;gap:.12rem;width:100%;max-width:24rem;}',
    '.bc-row{display:flex;align-items:center;gap:.5rem;padding:.05rem .45rem;border-radius:10px;background:var(--surface-2);}',
    /* many guesses: the old rows get slimmer still, so all fit one screen */
    '.bc-rows.is-many{gap:.06rem;}.bc-rows.is-many .bc-row:not(.is-now) .bc-d{height:1.35rem;font-size:1rem;border-width:1px;}',
    '.bc-row.is-now{background:var(--c-yellow-soft);box-shadow:inset 0 0 0 2px var(--c-yellow);padding-block:.3rem;}',
    '.bc-num{width:1.3rem;text-align:center;font-weight:800;color:var(--ink-soft);font-size:.9rem;}',
    '.bc-digits{display:flex;gap:.3rem;direction:ltr;}',
    '.bc-d{width:1.6rem;height:1.55rem;border-radius:8px;background:var(--surface);border:2px solid var(--line);display:grid;place-items:center;',
    'font-weight:900;font-size:1.15rem;color:var(--ink);padding:0;font-family:inherit;line-height:1;}',
    '.is-now .bc-d{width:min(2.7rem,calc((100vw - 9.5rem) / var(--k) - .3rem));height:2.9rem;font-size:1.7rem;border-style:dashed;border-color:var(--ink-soft);}',
    '.is-now .bc-d.on{border-style:solid;border-color:var(--c-blue);color:var(--c-blue);cursor:pointer;}',
    '.bc-fb{margin-inline-start:auto;display:flex;gap:.45rem;font-weight:900;font-size:1rem;white-space:nowrap;}',
    '.bc-fb .b{color:var(--c-green);}.bc-fb .h{color:var(--c-purple);}.bc-fb .left{color:var(--ink-soft);font-size:.92rem;}',
    '.bc-legend{margin:0;font-size:.92rem;font-weight:700;color:var(--ink-soft);text-align:center;}',
    '.bc-legend b{color:var(--c-green);}.bc-legend i{font-style:normal;color:var(--c-purple);font-weight:900;}',
    '.bc-pad{display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:.35rem;width:100%;max-width:24rem;direction:ltr;}',
    '.bc-pad button{min-height:3rem;border-radius:12px;border:2px solid var(--line);background:var(--surface);color:var(--ink);',
    'font:inherit;font-weight:900;font-size:1.45rem;cursor:pointer;padding:0;}',
    '.bc-pad button:disabled{opacity:.35;cursor:default;}',
    '.bc-acts{flex-wrap:nowrap;gap:.3rem;width:100%;max-width:24rem;}.bc-acts .btn{flex:1 1 auto;min-width:0;padding-inline:.4rem;font-size:.95rem;white-space:nowrap;}'
  ].join('');

  BrainGames.register({
    id: 'bulls-cows',
    name: 'בול פגיעה',
    skill: 'fun',
    isNew: true,
    tagline: 'נחשו את המספר הסודי לפי "בול" ו"פגיעה"',
    benefit: 'הסקת מסקנות וזיכרון עבודה',
    instructions: [
      'המחשב בחר מספר סודי. כל הספרות בו שונות זו מזו.',
      'הקלידו ניחוש ולחצו "בדיקה". "בול" = ספרה נכונה במקום הנכון. "פגיעה" = ספרה שנמצאת במספר, אבל במקום אחר.',
      'למשל: המספר 123 והניחוש 135 — בול 1 (ה-1), פגיעה 1 (ה-3).',
      'השתמשו בתשובות כדי לנחש טוב יותר, עד שכל הספרות בול. אפשר להקליד גם במקלדת. יש "רמז". אין שעון.'
    ],
    css: css,
    _model: { spec: spec, score: score, allCodes: allCodes },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = sp.k === 3 ? 3 : 2, round = 0, good = 0;
      var ALL = allCodes(sp), seen = {};

      function nextRound() {
        round++;
        if (round > ROUNDS) { ctx.finish({ correct: good, total: ROUNDS, note: 'פיצחתם ' + good + ' מתוך ' + ROUNDS + ' מספרים' }); return; }
        ctx.setProgress(round, ROUNDS);
        var secret;
        do { secret = ctx.pick(ALL); } while (seen[secret.join('')]);
        seen[secret.join('')] = true;
        play(secret);
      }

      function play(secret) {
        root.innerHTML = '';
        root.__bc = secret; // read by the automated tests
        var guesses = [], cur = [], done = false, hints = 0;
        var rowsEl = el('div', { class: 'bc-rows', style: { '--k': sp.k } });
        var legend = el('p', { class: 'bc-legend' }, [el('b', null, 'בול'), ' = ספרה נכונה במקום · ', el('i', null, 'פגיעה'), ' = במקום אחר']);
        var cols = sp.digits.length <= 6 ? sp.digits.length : 5;
        var padBtns = sp.digits.map(function (d) {
          return el('button', { type: 'button', onclick: function () { add(d); } }, String(d));
        });
        var pad = el('div', { class: 'bc-pad', style: { '--cols': cols } }, padBtns);
        var checkBtn = el('button', { class: 'btn btn-primary', type: 'button', onclick: check }, 'בדיקה');
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var clearBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: function () { if (cur.length) { cur = []; draw(); } } }, 'נקו');
        var delBtn = el('button', { class: 'btn btn-quiet', type: 'button', 'aria-label': 'מחיקה', onclick: function () { if (cur.length) { cur.pop(); draw(); } } }, '⌫');
        var acts = el('div', { class: 'g-actions bc-acts' }, [checkBtn, hintBtn, clearBtn, delBtn]);
        root.appendChild(rowsEl); root.appendChild(legend); root.appendChild(pad); root.appendChild(acts);
        ctx.setStatus('נחשו מספר של ' + sp.k + ' ספרות שונות');
        draw();

        function digitBox(d, onclick) {
          var has = d !== undefined;
          return onclick ? el('button', { class: 'bc-d on', type: 'button', 'aria-label': 'מחיקת ' + d, onclick: onclick }, String(d))
            : el('span', { class: 'bc-d' + (has ? ' on' : '') }, has ? String(d) : '');
        }
        function draw() {
          rowsEl.innerHTML = '';
          rowsEl.classList.toggle('is-many', guesses.length >= 5);
          legend.hidden = done || guesses.length >= 4; // by then every row says בול / פגיעה beside it
          guesses.forEach(function (g, i) {
            rowsEl.appendChild(el('div', { class: 'bc-row' }, [
              el('span', { class: 'bc-num' }, String(i + 1)),
              el('span', { class: 'bc-digits' }, g.code.map(function (d) { return digitBox(d); })),
              el('span', { class: 'bc-fb' }, [el('span', { class: 'b' }, 'בול ' + g.fb.bul), el('span', { class: 'h' }, 'פגיעה ' + g.fb.hit)])
            ]));
          });
          if (!done) {
            var boxes = [];
            for (var i = 0; i < sp.k; i++) (function (i) {
              boxes.push(cur[i] === undefined ? digitBox() : digitBox(cur[i], function () { cur.splice(i, 1); draw(); }));
            })(i);
            rowsEl.appendChild(el('div', { class: 'bc-row is-now' }, [el('span', { class: 'bc-num' }, String(guesses.length + 1)),
              el('span', { class: 'bc-digits' }, boxes), el('span', { class: 'bc-fb' }, el('span', { class: 'left' }, 'נשארו ' + (sp.tries - guesses.length)))]));
          }
          checkBtn.disabled = done || cur.length < sp.k;
          padBtns.forEach(function (b, j) { b.disabled = done || cur.length >= sp.k || cur.indexOf(sp.digits[j]) !== -1; });
          delBtn.disabled = clearBtn.disabled = done || !cur.length;
          hintBtn.disabled = done;
        }
        function add(d) {
          if (done || cur.length >= sp.k || cur.indexOf(d) !== -1) return;
          ctx.sound('tap'); cur.push(d); draw();
        }
        // the numbers that fit every answer so far
        function possible() {
          return ALL.filter(function (c) {
            return guesses.every(function (g) { var s = score(c, g.code); return s.bul === g.fb.bul && s.hit === g.fb.hit; });
          });
        }
        function check() {
          if (done || cur.length < sp.k) return;
          var fb = score(secret, cur);
          guesses.push({ code: cur.slice(), fb: fb });
          cur = [];
          ctx.sound(fb.bul === sp.k ? 'good' : 'tap');
          if (fb.bul === sp.k) { finish(true); return; }
          if (guesses.length >= sp.tries) { finish(false); return; }
          var left = possible().length;
          ctx.setStatus((fb.bul + fb.hit === 0 ? 'אף ספרה מהניחוש לא נמצאת במספר. גם זה מידע טוב!'
            : 'בול ' + fb.bul + ', פגיעה ' + fb.hit + '.') + (left === 1 ? ' עכשיו רק מספר אחד מתאים לכל התשובות!' : ''));
          draw();
        }
        /* a hint is a deduction from the answers so far, never the number itself */
        function hint() {
          if (done) return;
          hints++;
          if (!guesses.length) { ctx.setStatus('רמז: התחילו בכל ניחוש שהוא. התשובה תגלה כמה מהספרות שלו נמצאות במספר'); return; }
          var ps = possible();
          if (cur.length === sp.k && !ps.some(function (c) { return c.join() === cur.join(); })) {
            ctx.setStatus('רמז: הניחוש הזה לא מתאים לתשובות הקודמות. בדקו אותו מול השורות שלמעלה'); return;
          }
          var used = {}; ps.forEach(function (c) { c.forEach(function (x) { used[x] = true; }); });
          var tried = {}; guesses.forEach(function (g) { g.code.forEach(function (x) { tried[x] = true; }); });
          var out = sp.digits.filter(function (d) { return !used[d] && tried[d]; });
          if (out.length && hints % 2 === 1) {
            ctx.setStatus('רמז: לפי התשובות, ' + (out.length === 1 ? 'הספרה ' + out[0] + ' לא נמצאת' : 'הספרות ' + out.join(', ') + ' לא נמצאות') + ' במספר בכלל');
            return;
          }
          var sure = sp.digits.filter(function (d) { return ps.every(function (c) { return c.indexOf(d) !== -1; }); })
            .filter(function (d) { return tried[d]; });
          if (sure.length && hints % 2 === 0) {
            ctx.setStatus('רמז: לפי התשובות, הספרה ' + sure[0] + ' בטוח נמצאת במספר. איפה היא יכולה להיות?');
            return;
          }
          ctx.setStatus('רמז: ' + (ps.length === 1 ? 'רק מספר אחד מתאים לכל התשובות. נסו למצוא אותו'
            : 'עוד ' + ps.length + ' מספרים מתאימים לכל התשובות. נחשו מספר שמתאים לכולן'));
        }
        function finish(won) {
          done = true; draw();
          var ok = won && hints <= 1;
          if (ok) good++;
          if (won) {
            ctx.setStatus('בול! מצאתם את ' + secret.join('') + ' ב-' + guesses.length + ' ניחושים');
            ctx.feedback(ok, ok ? undefined : 'מצאתם, בעזרת רמזים').then(function () { return ctx.wait(800); }).then(nextRound);
            return;
          }
          ctx.setStatus('נגמרו הניחושים. המספר היה ' + secret.join(''));
          pad.hidden = true; acts.hidden = true; legend.hidden = true;
          ctx.feedback(false, 'נגמרו הניחושים').then(function () { return ctx.next(round >= ROUNDS ? 'לסיכום' : 'למספר הבא'); }).then(nextRound);
        }
      }

      nextRound();
    }
  });
})();
