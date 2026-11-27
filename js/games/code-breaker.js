/* פצחו את הקוד — a secret code of colours (each colour also has its own symbol). Guess it: after each guess the
   game says how many are the right colour in the right place (✓) and how many are a right colour in another
   place (◐). Deduction, working memory. Untimed. */
(function () {
  'use strict';

  var COLORS = [
    { c: 'red', s: '●', name: 'אדום' }, { c: 'blue', s: '■', name: 'כחול' }, { c: 'yellow', s: '▲', name: 'צהוב' },
    { c: 'green', s: '★', name: 'ירוק' }, { c: 'purple', s: '♥', name: 'סגול' }, { c: 'black', s: '◆', name: 'שחור' }
  ];

  /* Level 1–50: k = places in the code, n = colours to choose from, rep = a colour may come twice,
     tries = guesses allowed. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    if (L <= 5) return { k: 3, n: 4, rep: false, tries: 7 };
    if (L <= 10) return { k: 3, n: 5, rep: false, tries: 7 };
    if (L <= 15) return { k: 4, n: 5, rep: false, tries: 8 };
    if (L <= 22) return { k: 4, n: 6, rep: false, tries: 8 };
    if (L <= 30) return { k: 4, n: 6, rep: true, tries: 8 };
    if (L <= 40) return { k: 5, n: 6, rep: false, tries: 9 };
    return { k: 5, n: 6, rep: true, tries: 9 };
  }

  // ✓ = right colour, right place; ◐ = right colour, other place
  function score(code, guess) {
    var exact = 0, cc = {}, gc = {};
    for (var i = 0; i < code.length; i++) {
      if (code[i] === guess[i]) exact++;
      else { cc[code[i]] = (cc[code[i]] || 0) + 1; gc[guess[i]] = (gc[guess[i]] || 0) + 1; }
    }
    var near = 0;
    Object.keys(gc).forEach(function (c) { near += Math.min(gc[c], cc[c] || 0); });
    return { exact: exact, near: near };
  }
  function allCodes(sp) {
    var out = [];
    (function go(a) {
      if (a.length === sp.k) { out.push(a); return; }
      for (var c = 0; c < sp.n; c++) if (sp.rep || a.indexOf(c) === -1) go(a.concat([c]));
    })([]);
    return out;
  }

  var css = [
    '.cb-rows{display:flex;flex-direction:column;gap:.1rem;width:100%;max-width:24rem;}',
    '.cb-row{display:flex;align-items:center;gap:.5rem;padding:.15rem .4rem;border-radius:10px;background:var(--surface-2);}',
    /* the rows already guessed are small, the row being filled is big, so all guesses fit one screen */
    '.cb-row.is-past{padding-block:.05rem;}.cb-row.is-past .cb-peg{width:1.5rem;height:1.5rem;font-size:.72rem;border-width:1px;}.cb-row.is-past .cb-fb{font-size:.95rem;}',
    '.cb-row.is-now{background:var(--c-yellow-soft);box-shadow:inset 0 0 0 2px var(--c-yellow);}',
    '.cb-row.is-tip{box-shadow:inset 0 0 0 3px var(--c-purple);}',
    '.cb-num{width:1.3rem;text-align:center;font-weight:800;color:var(--ink-soft);font-size:.9rem;}',
    '.cb-pegs{display:flex;gap:.3rem;direction:ltr;}',
    '.cb-peg{width:2.15rem;height:2.15rem;border-radius:50%;border:2px dashed var(--ink-soft);display:grid;place-items:center;font-size:1rem;color:#fff;',
    'background:transparent;padding:0;font-family:inherit;line-height:1;}',
    '.cb-peg.on{border:2px solid rgba(0,0,0,.25);}',
    'button.cb-peg{cursor:pointer;}',
    '.cb-fb{margin-inline-start:auto;display:flex;gap:.35rem;font-weight:900;font-size:1.05rem;white-space:nowrap;}',
    '.cb-fb .ex{color:var(--c-green);}.cb-fb .nr{color:var(--c-yellow);}',
    '.cb-legend{margin:0;font-size:.92rem;font-weight:700;color:var(--ink-soft);text-align:center;}',
    '.cb-legend b{color:var(--c-green);}.cb-legend i{font-style:normal;color:var(--c-yellow);font-weight:900;}',
    '.cb-pal{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:.4rem;width:100%;max-width:24rem;direction:ltr;}',
    '.cb-pal button{min-height:3.1rem;border-radius:50%;aspect-ratio:1;justify-self:center;width:min(3.3rem,100%);border:2px solid rgba(0,0,0,.25);',
    'color:#fff;font-size:1.3rem;cursor:pointer;padding:0;}',
    '.cb-red{background:var(--c-red);}.cb-blue{background:var(--c-blue);}.cb-yellow{background:var(--c-yellow);color:var(--c-on-yellow) !important;}',
    '.cb-green{background:var(--c-green);}.cb-purple{background:var(--c-purple);}.cb-black{background:var(--c-black);color:var(--surface) !important;}',
    '.cb-acts{flex-wrap:nowrap;gap:.3rem;width:100%;max-width:24rem;}.cb-acts .btn{flex:1 1 auto;min-width:0;padding-inline:.4rem;font-size:.95rem;white-space:nowrap;}',
    '.cb-secret{display:flex;gap:.3rem;direction:ltr;}'
  ].join('');

  BrainGames.register({
    id: 'code-breaker',
    name: 'פצחו את הקוד',
    skill: 'logic',
    isNew: true,
    tagline: 'נחשו את קוד הצבעים הסודי לפי הרמזים',
    benefit: 'הסקת מסקנות וזיכרון עבודה',
    instructions: [
      'המחשב בחר קוד סודי של צבעים. לכל צבע יש גם סימן משלו.',
      'בחרו צבעים לשורה ולחצו "בדיקה". ✓ = צבע נכון במקום הנכון. ◐ = צבע שנמצא בקוד, אבל במקום אחר.',
      'השתמשו בתשובות כדי לנחש טוב יותר, עד שכל העיגולים ✓. בהמשך הקוד ארוך יותר, ואפשר שצבע יופיע פעמיים.',
      'לחיצה על עיגול בשורה מוחקת אותו. יש "רמז" ו"↶ בטלו". אין שעון.'
    ],
    css: css,
    _model: { spec: spec, score: score, allCodes: allCodes },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = sp.k === 3 ? 3 : 2, round = 0, good = 0;
      var ALL = allCodes(sp);

      function nextRound() {
        round++;
        if (round > ROUNDS) { ctx.finish({ correct: good, total: ROUNDS, note: 'פיצחתם ' + good + ' מתוך ' + ROUNDS + ' קודים' }); return; }
        ctx.setProgress(round, ROUNDS);
        play(ctx.pick(ALL));
      }

      function play(secret) {
        root.innerHTML = '';
        root.__cb = secret; // read by the automated tests
        var pal = ctx.fresh('colors', COLORS.map(function (_, i) { return i; }), sp.n); // which colours this round
        var guesses = [], cur = [], done = false, hints = 0, past = [];
        var rowsEl = el('div', { class: 'cb-rows' });
        var legend = el('p', { class: 'cb-legend' }, ['', el('b', null, '✓'), ' = צבע ומקום נכונים · ', el('i', null, '◐'), ' = צבע נכון, מקום אחר']);
        var palEl = el('div', { class: 'cb-pal', style: { '--n': sp.n } }, pal.map(function (ci) {
          return el('button', { class: 'cb-' + COLORS[ci].c, type: 'button', 'aria-label': COLORS[ci].name, onclick: function () { add(ci); } }, COLORS[ci].s);
        }));
        var checkBtn = el('button', { class: 'btn btn-primary', type: 'button', onclick: check }, 'בדיקה');
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var undoBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: undo }, '↶ בטלו');
        var delBtn = el('button', { class: 'btn btn-quiet', type: 'button', 'aria-label': 'מחיקה', onclick: function () { if (cur.length) { past.push(cur.slice()); cur.pop(); draw(); } } }, '⌫');
        var acts = el('div', { class: 'g-actions cb-acts' }, [checkBtn, hintBtn, undoBtn, delBtn]);
        root.appendChild(rowsEl); root.appendChild(legend); root.appendChild(palEl); root.appendChild(acts);
        ctx.setStatus('בחרו ' + sp.k + ' צבעים ולחצו "בדיקה"');
        draw();

        function peg(ci, onclick) {
          var cls = 'cb-peg' + (ci === undefined ? '' : ' on cb-' + COLORS[ci].c);
          var label = ci === undefined ? 'ריק' : COLORS[ci].name;
          return onclick ? el('button', { class: cls, type: 'button', 'aria-label': label, onclick: onclick }, ci === undefined ? '' : COLORS[ci].s)
            : el('span', { class: cls, 'aria-label': label }, ci === undefined ? '' : COLORS[ci].s);
        }
        function draw() {
          rowsEl.innerHTML = '';
          // the rows so far, then the row being filled; the empty rows are not drawn (they would only take room)
          guesses.forEach(function (g, i) {
            rowsEl.appendChild(el('div', { class: 'cb-row is-past' }, [
              el('span', { class: 'cb-num' }, String(i + 1)),
              el('span', { class: 'cb-pegs' }, g.code.map(function (ci) { return peg(ci); })),
              el('span', { class: 'cb-fb', 'aria-label': g.fb.exact + ' במקום, ' + g.fb.near + ' צבע נכון במקום אחר' }, [
                el('span', { class: 'ex' }, '✓' + g.fb.exact), el('span', { class: 'nr' }, '◐' + g.fb.near)])
            ]));
          });
          if (!done) {
            var slots = [];
            for (var i = 0; i < sp.k; i++) (function (i) {
              slots.push(peg(cur[i], cur[i] === undefined ? null : function () { past.push(cur.slice()); cur.splice(i, 1); draw(); }));
            })(i);
            rowsEl.appendChild(el('div', { class: 'cb-row is-now' }, [el('span', { class: 'cb-num' }, String(guesses.length + 1)),
              el('span', { class: 'cb-pegs' }, slots), el('span', { class: 'cb-fb' }, 'נשארו ' + (sp.tries - guesses.length))]));
          }
          checkBtn.disabled = done || cur.length < sp.k;
          [].forEach.call(palEl.children, function (b) { b.disabled = done || cur.length >= sp.k; });
          undoBtn.disabled = done || !past.length; delBtn.disabled = done || !cur.length; hintBtn.disabled = done;
        }
        function add(ci) {
          if (done || cur.length >= sp.k) return;
          if (!sp.rep && cur.indexOf(ci) !== -1) { ctx.setStatus('ברמה הזאת כל צבע מופיע בקוד פעם אחת לכל היותר'); return; }
          ctx.sound('tap'); past.push(cur.slice()); cur.push(ci); draw();
        }
        function undo() { if (done || !past.length) return; ctx.sound('tap'); cur = past.pop(); draw(); }
        // the codes that fit every answer so far
        function possible() {
          return ALL.filter(function (c) {
            var code = c.map(function (x) { return pal[x]; });
            return guesses.every(function (g) { var s = score(code, g.code); return s.exact === g.fb.exact && s.near === g.fb.near; });
          }).map(function (c) { return c.map(function (x) { return pal[x]; }); });
        }
        function check() {
          if (done || cur.length < sp.k) return;
          var fb = score(secret.map(function (x) { return pal[x]; }), cur);
          guesses.push({ code: cur.slice(), fb: fb });
          cur = []; past = [];
          ctx.sound(fb.exact === sp.k ? 'good' : 'tap');
          if (fb.exact === sp.k) { finish(true); return; }
          if (guesses.length >= sp.tries) { finish(false); return; }
          var left = possible().length;
          ctx.setStatus(fb.exact + ' במקום, ' + fb.near + ' צבע נכון במקום אחר. ' + (left === 1 ? 'עכשיו יש רק קוד אחד שמתאים לכל התשובות!' : 'נסו שוב'));
          draw();
        }
        /* a hint is a deduction from the answers so far, never the code itself */
        function hint() {
          if (done) return;
          hints++;
          var ps = possible();
          if (!guesses.length) { ctx.setStatus('רמז: התחילו בניחוש עם צבעים שונים. התשובה תגלה כמה מהם בקוד'); return; }
          // a guess that does not fit what was learned: point at it
          var bad = cur.length === sp.k && !ps.some(function (c) { return c.join() === cur.join(); });
          if (bad) { ctx.setStatus('רמז: השורה הזאת לא מתאימה לתשובות הקודמות. בדקו אותה מול השורות שלמעלה'); return; }
          var used = {}; ps.forEach(function (c) { c.forEach(function (x) { used[x] = true; }); });
          var out = pal.filter(function (ci) { return !used[ci]; });
          var tried = {}; guesses.forEach(function (g) { g.code.forEach(function (x) { tried[x] = true; }); });
          var outTried = out.filter(function (ci) { return tried[ci]; });
          if (outTried.length) { ctx.setStatus('רמז: הצבע ה' + COLORS[outTried[0]].name + ' לא נמצא בקוד בכלל. אפשר לוותר עליו'); return; }
          for (var i = 0; i < sp.k; i++) {
            var v = ps[0][i];
            if (ps.every(function (c) { return c[i] === v; }) && hints > 1) {
              ctx.setStatus('רמז: לפי התשובות, במקום ה-' + (i + 1) + ' משמאל חייב להיות ' + COLORS[v].name); return;
            }
          }
          ctx.setStatus('רמז: ' + (ps.length === 1 ? 'רק קוד אחד מתאים לכל התשובות. נסו למצוא אותו' : 'עוד ' + ps.length + ' קודים מתאימים לכל התשובות. נחשו אחד שמתאים לכולן'));
        }
        function finish(won) {
          done = true; draw();
          var ok = won && hints <= 1;
          if (ok) good++;
          if (won) {
            ctx.setStatus('פיצחתם את הקוד ב-' + guesses.length + ' ניחושים!');
            ctx.feedback(ok, ok ? undefined : 'פיצחתם, בעזרת רמזים').then(function () { return ctx.wait(800); }).then(nextRound);
            return;
          }
          ctx.setStatus('נגמרו הניחושים. הקוד היה:');
          rowsEl.appendChild(el('div', { class: 'cb-row is-now' }, [el('span', { class: 'cb-num' }, '🔓'),
            el('span', { class: 'cb-pegs' }, secret.map(function (x) { return peg(pal[x]); }))]));
          palEl.hidden = true; acts.hidden = true;
          ctx.feedback(false, 'נגמרו הניחושים').then(function () { return ctx.next(round >= ROUNDS ? 'לסיכום' : 'לקוד הבא'); }).then(nextRound);
        }
      }

      nextRound();
    }
  });
})();
