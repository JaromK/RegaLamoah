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
    /* a game board: a covered secret code on top, then a row for each guess with its answer pegs beside it */
    '.cb-board{--pg:2.3rem;width:100%;max-width:24rem;background:#6b4a33;border-radius:18px;padding:.4rem;display:flex;flex-direction:column;gap:.15rem;',
    'box-shadow:inset 0 2px 0 rgba(255,255,255,.18),0 4px 10px rgba(0,0,0,.25);}',
    '.cb-row{display:grid;grid-template-columns:1.4rem auto 1fr;align-items:center;gap:.45rem;padding:.2rem .45rem;border-radius:12px;background:#80593e;direction:rtl;}',
    '.cb-row.is-past{--pg:1.3rem;padding-block:.08rem;line-height:1;}.cb-row.is-past .cb-num{line-height:1;}.cb-pegs{line-height:1;}',
    '.cb-row.cb-top{--pg:1.9rem;}',
    '.cb-row.is-now{background:#f7e7c6;box-shadow:0 0 0 3px var(--c-yellow);}',
    '.cb-row.is-future{display:none;}',
    '.cb-row.is-tip{box-shadow:0 0 0 3px var(--c-purple);}',
    '.cb-num{text-align:center;font-weight:900;color:#f3dfc4;font-size:.95rem;}.is-now .cb-num{color:#6b4a33;}',
    '.cb-pegs{display:flex;gap:.35rem;direction:ltr;}',
    /* a peg: a shiny ball of colour with its sign; an empty hole is a dark dip */
    '.cb-peg{width:var(--pg);height:var(--pg);border-radius:50%;display:grid;place-items:center;font-size:calc(var(--pg) * .45);color:#fff;padding:0;',
    'font-family:inherit;line-height:1;border:0;background:#4a3324;box-shadow:inset 0 3px 5px rgba(0,0,0,.55);}',
    '.is-now .cb-peg:not(.on){background:#e5cfa6;box-shadow:inset 0 3px 5px rgba(0,0,0,.3);}',
    '.cb-peg.on,.cb-pal button{background-image:radial-gradient(circle at 34% 28%,rgba(255,255,255,.65),rgba(255,255,255,0) 42%);',
    'box-shadow:0 2px 3px rgba(0,0,0,.45),inset 0 -3px 4px rgba(0,0,0,.25);}',
    'button.cb-peg{cursor:pointer;}',
    '.cb-peg.drop{animation:cb-drop .25s ease-out;}@keyframes cb-drop{from{transform:scale(.4);}to{transform:scale(1);}}',
    /* the answer: one small dot per place. green ✓ = right colour in the right place, yellow ↔ = right colour, another place */
    /* the answer dots: on a phone in one line, on a computer in two (like the classic board) */
    '.cb-fb{justify-self:start;display:grid;grid-template-columns:repeat(var(--fk),auto);gap:2px;direction:ltr;}',
    '.cb-dot{width:.8rem;height:.8rem;border-radius:50%;display:grid;place-items:center;font-size:.58rem;font-weight:900;font-style:normal;line-height:1;',
    'background:#4a3324;box-shadow:inset 0 2px 3px rgba(0,0,0,.5);color:transparent;}',
    '.cb-dot.ex{background:var(--c-green);color:#fff;box-shadow:0 1px 2px rgba(0,0,0,.4);}',
    '.cb-dot.nr{background:var(--c-yellow);color:var(--c-on-yellow);box-shadow:0 1px 2px rgba(0,0,0,.4);}',
    '.cb-dot.pop{animation:cb-pop .3s ease-out both;}@keyframes cb-pop{0%{transform:scale(0);}70%{transform:scale(1.35);}100%{transform:scale(1);}}',
    '.cb-left{justify-self:start;font-weight:800;font-size:.9rem;color:#6b4a33;white-space:nowrap;}',
    /* the secret, under a cover until the end */
    '.cb-row.cb-top{background:#3f2b1e;}',
    '.cb-cover{width:var(--pg);height:var(--pg);border-radius:50%;display:grid;place-items:center;background:#2c1d13;color:#f3dfc4;font-weight:900;',
    'font-size:calc(var(--pg) * .5);box-shadow:inset 0 3px 5px rgba(0,0,0,.6);}',
    '.cb-top .cb-left{color:#f3dfc4;}',
    '.cb-top .cb-peg.on{animation:cb-open .5s ease-out both;}@keyframes cb-open{from{transform:rotateY(90deg);}to{transform:rotateY(0);}}',
    /* five pegs on a phone: no room for words beside the rows */
    '.cb-board.k5 .cb-left{display:none;}',
    '.cb-legend{margin:0;font-size:.95rem;font-weight:700;text-align:center;display:flex;flex-wrap:wrap;justify-content:center;gap:.15rem .8rem;}',
    '.cb-legend span{display:inline-flex;align-items:center;gap:.3rem;white-space:nowrap;}',
    '.cb-pal{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:.45rem;width:100%;max-width:24rem;direction:ltr;}',
    '.cb-pal button{min-height:2.9rem;border-radius:50%;aspect-ratio:1;justify-self:center;width:min(3rem,100%);border:0;',
    'color:#fff;font-size:1.35rem;cursor:pointer;padding:0;}',
    '.cb-pal button:disabled{opacity:.45;cursor:default;}',
    '.cb-red{background-color:var(--c-red);}.cb-blue{background-color:var(--c-blue);}.cb-yellow{background-color:var(--c-yellow);color:var(--c-on-yellow) !important;}',
    '.cb-green{background-color:var(--c-green);}.cb-purple{background-color:var(--c-purple);}.cb-black{background-color:#222;color:#fff !important;}',
    '.cb-acts{flex-wrap:nowrap;gap:.3rem;width:100%;max-width:24rem;}.cb-acts .btn{flex:1 1 auto;min-width:0;padding-inline:.4rem;font-size:.95rem;white-space:nowrap;min-height:2.8rem;padding-block:.3rem;}',
    '.cb-legend .cb-dot{width:1.05rem;height:1.05rem;font-size:.7rem;}',
    /* on a computer: the whole board with all its rows, the colours and buttons beside it */
    '@media (min-width:900px){',
    '.g-split .cb-board{--pg:min(2.5rem,calc((100svh - 17rem) / var(--rows) - .5rem));max-width:none;width:auto;gap:.22rem;padding:.55rem;}',
    '.g-split .cb-row{gap:.7rem;padding:.12rem .6rem;}.g-split .cb-row.is-past{--pg:inherit;}',
    '.g-split .cb-row.is-future{display:grid;opacity:.75;}',
    '.g-split .cb-fb{gap:3px;grid-template-columns:repeat(var(--fh),auto);}.g-split .cb-row.cb-top{--pg:inherit;}',
    '.g-split .cb-dot{width:calc(var(--pg) * .45);height:calc(var(--pg) * .45);font-size:calc(var(--pg) * .3);}',
    '.g-split .cb-board.k5 .cb-left{display:block;}',
    '.play-board.g-split > .g-side.cb-side{width:22rem;}',
    '.g-split .cb-pal{grid-template-columns:repeat(3,4rem);width:auto;gap:.7rem;}.g-split .cb-pal button{width:4rem;min-height:4rem;font-size:1.6rem;}',
    '.g-split .cb-acts{flex-wrap:wrap;}.g-split .cb-acts .btn{flex:1 1 40%;}',
    '}'
  ].join('');

  BrainGames.register({
    id: 'code-breaker',
    name: 'פצחו את הקוד',
    skill: 'fun',
    isNew: true,
    tagline: 'נחשו את קוד הצבעים הסודי לפי הרמזים',
    benefit: 'הסקת מסקנות וזיכרון עבודה',
    instructions: [
      'המחשב בחר קוד סודי של צבעים. לכל צבע יש גם סימן משלו.',
      'בחרו צבעים לשורה ולחצו "בדיקה". ליד השורה יופיעו נקודות קטנות: ✓ ירוקה לכל צבע נכון במקום הנכון, ↔ צהובה לכל צבע נכון שנמצא במקום אחר.',
      'השתמשו בנקודות כדי לנחש טוב יותר, עד שכל הנקודות ירוקות. בהמשך הקוד ארוך יותר, ואפשר שצבע יופיע פעמיים.',
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
        var rowsEl = el('div', { class: 'cb-board' + (sp.k >= 5 ? ' k5' : ''), style: { '--rows': sp.tries + 1 } });
        var legend = el('p', { class: 'cb-legend' }, [
          el('span', null, [el('i', { class: 'cb-dot ex' }, '✓'), 'במקום הנכון']),
          el('span', null, [el('i', { class: 'cb-dot nr' }, '↔'), 'נמצא, במקום אחר'])]);
        var palEl = el('div', { class: 'cb-pal', style: { '--n': sp.n } }, pal.map(function (ci) {
          return el('button', { class: 'cb-' + COLORS[ci].c, type: 'button', 'aria-label': COLORS[ci].name, onclick: function () { add(ci); } }, COLORS[ci].s);
        }));
        var checkBtn = el('button', { class: 'btn btn-primary', type: 'button', onclick: check }, 'בדיקה');
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var undoBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: undo }, '↶ בטלו');
        var delBtn = el('button', { class: 'btn btn-quiet', type: 'button', 'aria-label': 'מחיקה', onclick: function () { if (cur.length) { past.push(cur.slice()); cur.pop(); draw(); } } }, '⌫');
        var acts = el('div', { class: 'g-actions cb-acts' }, [checkBtn, hintBtn, undoBtn, delBtn]);
        // on a computer the colours and buttons sit beside the board (shared .g-split layout); on a phone below it
        root.classList.add('g-split');
        root.appendChild(rowsEl);
        root.appendChild(el('div', { class: 'g-side cb-side' }, [legend, palEl, acts]));
        var fresh = -1, opened = false; // the row whose answer dots pop in; the secret shown at the end
        ctx.setStatus('בחרו ' + sp.k + ' צבעים ולחצו "בדיקה"');
        draw();

        function peg(ci, onclick) {
          var cls = 'cb-peg' + (ci === undefined ? '' : ' on cb-' + COLORS[ci].c);
          var label = ci === undefined ? 'ריק' : COLORS[ci].name;
          return onclick ? el('button', { class: cls, type: 'button', 'aria-label': label, onclick: onclick }, ci === undefined ? '' : COLORS[ci].s)
            : el('span', { class: cls, 'aria-label': label }, ci === undefined ? '' : COLORS[ci].s);
        }
        // the answer dots: green first, then yellow, then empty ones
        function dots(fb, pop) {
          var out = [];
          for (var i = 0; i < sp.k; i++) {
            var kind = i < fb.exact ? 'ex' : i < fb.exact + fb.near ? 'nr' : '';
            var d = el('i', { class: 'cb-dot' + (kind ? ' ' + kind : '') + (pop ? ' pop' : '') }, kind === 'ex' ? '✓' : kind === 'nr' ? '↔' : '');
            if (pop) d.style.animationDelay = (i * 0.15) + 's';
            out.push(d);
          }
          return el('span', { class: 'cb-fb', style: { '--fk': sp.k, '--fh': Math.ceil(sp.k / 2) }, role: 'img',
            'aria-label': fb.exact + ' במקום הנכון, ' + fb.near + ' צבע נכון במקום אחר' }, out);
        }
        function draw() {
          rowsEl.innerHTML = '';
          // the secret, covered until the end
          var top = [];
          for (var t = 0; t < sp.k; t++) top.push(opened ? peg(pal[secret[t]]) : el('span', { class: 'cb-cover', 'aria-hidden': 'true' }, '?'));
          rowsEl.appendChild(el('div', { class: 'cb-row cb-top', 'aria-label': opened ? 'הקוד הסודי' : 'הקוד הסודי מוסתר' },
            [el('span', { class: 'cb-num' }, '🔒'), el('span', { class: 'cb-pegs' }, top), el('span', { class: 'cb-left' }, opened ? 'הקוד הסודי' : 'הקוד הסודי')]));
          guesses.forEach(function (g, i) {
            rowsEl.appendChild(el('div', { class: 'cb-row is-past' }, [
              el('span', { class: 'cb-num' }, String(i + 1)),
              el('span', { class: 'cb-pegs' }, g.code.map(function (ci) { return peg(ci); })),
              dots(g.fb, i === fresh)
            ]));
          });
          fresh = -1;
          if (!done) {
            var slots = [];
            for (var i = 0; i < sp.k; i++) (function (i) {
              var p = peg(cur[i], cur[i] === undefined ? null : function () { past.push(cur.slice()); cur.splice(i, 1); draw(); });
              if (i === cur.length - 1 && lastAdd) p.classList.add('drop');
              slots.push(p);
            })(i);
            lastAdd = false;
            rowsEl.appendChild(el('div', { class: 'cb-row is-now' }, [el('span', { class: 'cb-num' }, String(guesses.length + 1)),
              el('span', { class: 'cb-pegs' }, slots), el('span', { class: 'cb-left' }, 'נשארו ' + (sp.tries - guesses.length))]));
          }
          // the rows still to come (shown on a computer, like a real board)
          for (var f = guesses.length + (done ? 0 : 1); f < sp.tries; f++) {
            var holes = [];
            for (var h = 0; h < sp.k; h++) holes.push(peg());
            rowsEl.appendChild(el('div', { class: 'cb-row is-future', 'aria-hidden': 'true' }, [el('span', { class: 'cb-num' }, String(f + 1)),
              el('span', { class: 'cb-pegs' }, holes), dots({ exact: 0, near: 0 })]));
          }
          checkBtn.disabled = done || cur.length < sp.k;
          [].forEach.call(palEl.children, function (b) { b.disabled = done || cur.length >= sp.k; });
          undoBtn.disabled = done || !past.length; delBtn.disabled = done || !cur.length; hintBtn.disabled = done;
        }
        var lastAdd = false;
        function add(ci) {
          if (done || cur.length >= sp.k) return;
          if (!sp.rep && cur.indexOf(ci) !== -1) { ctx.setStatus('ברמה הזאת כל צבע מופיע בקוד פעם אחת לכל היותר'); return; }
          ctx.sound('tap'); past.push(cur.slice()); cur.push(ci); lastAdd = true; draw();
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
          fresh = guesses.length - 1;
          cur = []; past = [];
          ctx.sound(fb.exact === sp.k ? 'good' : 'tap');
          if (fb.exact === sp.k) { finish(true); return; }
          if (guesses.length >= sp.tries) { finish(false); return; }
          var left = possible().length;
          ctx.setStatus(fb.exact + fb.near === 0 ? 'אף צבע מהשורה לא נמצא בקוד. גם זה מידע טוב!'
            : '✓ ' + fb.exact + ' במקום הנכון · ↔ ' + fb.near + ' במקום אחר' + (left === 1 ? '. עכשיו רק קוד אחד מתאים!' : ''));
          draw();
        }
        /* a hint is a deduction from the answers so far, never the code itself */
        /* a hint teaches a deduction from the rows so far, a different one each time, never the code itself */
        var told = {};
        function hint() {
          if (done) return;
          hints++;
          var ps = possible();
          if (!guesses.length) { ctx.setStatus('רמז: התחילו בניחוש עם צבעים שונים. הנקודות יגלו כמה מהם בקוד'); return; }
          // a guess that does not fit what was learned: point at it
          var bad = cur.length === sp.k && !ps.some(function (c) { return c.join() === cur.join(); });
          if (bad) { ctx.setStatus('רמז: השורה שאתם ממלאים לא מתאימה לנקודות של השורות הקודמות. בדקו אותה מולן'); return; }
          function say(key, text) { if (told[key]) return false; told[key] = true; ctx.setStatus('רמז: ' + text); return true; }
          // what a row tells by itself: no dots at all, or a dot for every peg
          for (var r = 0; r < guesses.length; r++) {
            var g = guesses[r], n = g.fb.exact + g.fb.near;
            if (n === 0 && say('none' + r, 'בשורה ' + (r + 1) + ' אין אף נקודה. אז אף צבע מהשורה הזאת לא נמצא בקוד')) return;
            if (n === sp.k && g.fb.exact < sp.k && say('all' + r, 'בשורה ' + (r + 1) + ' יש נקודה לכל עיגול. אז כל הצבעים שלה בקוד, רק צריך לסדר אותם אחרת')) return;
          }
          var used = {}; ps.forEach(function (c) { c.forEach(function (x) { used[x] = true; }); });
          var tried = {}; guesses.forEach(function (gg) { gg.code.forEach(function (x) { tried[x] = true; }); });
          var outTried = pal.filter(function (ci) { return !used[ci] && tried[ci] && !told['out' + ci]; });
          if (outTried.length && say('out' + outTried[0], 'לפי הנקודות, הצבע ה' + COLORS[outTried[0]].name + ' לא נמצא בקוד בכלל. אפשר לוותר עליו')) return;
          var sure = pal.filter(function (ci) { return ps.every(function (c) { return c.indexOf(ci) !== -1; }) && !told['in' + ci]; });
          if (sure.length && say('in' + sure[0], 'לפי הנקודות, הצבע ה' + COLORS[sure[0]].name + ' בטוח נמצא בקוד. באיזה מקום הוא יכול להיות?')) return;
          if (hints > 2) {
            for (var i = 0; i < sp.k; i++) {
              var v = ps[0][i];
              if (ps.every(function (c) { return c[i] === v; }) && say('at' + i, 'לפי הנקודות, במקום ה-' + (i + 1) + ' משמאל חייב להיות ' + COLORS[v].name)) return;
            }
          }
          ctx.setStatus('רמז: ' + (ps.length === 1 ? 'רק קוד אחד מתאים לכל הנקודות. נסו למצוא אותו'
            : 'נחשו שורה שמתאימה לכל הנקודות עד עכשיו: בדקו אותה מול כל שורה למעלה'));
        }
        function finish(won) {
          done = true; opened = true; draw();
          var ok = won && hints <= 1;
          if (ok) good++;
          if (won) {
            ctx.setStatus('פיצחתם את הקוד ב-' + guesses.length + ' ניחושים!');
            ctx.feedback(ok, ok ? undefined : 'פיצחתם, בעזרת רמזים').then(function () { return ctx.wait(800); }).then(nextRound);
            return;
          }
          ctx.setStatus('נגמרו הניחושים. הקוד הסודי נפתח למעלה');
          palEl.hidden = true; acts.hidden = true; legend.hidden = true;
          ctx.feedback(false, 'נגמרו הניחושים').then(function () { return ctx.next(round >= ROUNDS ? 'לסיכום' : 'לקוד הבא'); }).then(nextRound);
        }
      }

      nextRound();
    }
  });
})();
