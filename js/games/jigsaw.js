/* פאזל תמונה — a real photo cut into squares and mixed up; tap two pieces to swap them until the picture is
   whole. Later some pieces are also turned and need turning back (perception, planning). Untimed. */
(function () {
  'use strict';

  /* Level 1–50: g = pieces per side, turn = share of pieces that are turned, preview = the small picture is shown,
     mark = pieces in the right place get a green frame. */
  function spec(level) {
    var L = level;
    var g = L <= 3 ? 2 : L <= 12 ? 3 : L <= 24 ? 4 : L <= 36 ? 5 : 6;
    return { g: g, turn: L < 18 ? 0 : Math.min(0.6, (L - 17) * 0.03), preview: L < 30, mark: L < 22 };
  }

  var css = [
    '.jg-wrap{display:flex;flex-direction:column;align-items:center;gap:.5rem;width:100%;}',
    '.jg-board{display:grid;grid-template-columns:repeat(var(--g),minmax(0,1fr));gap:2px;width:min(100%,max(calc(100svh - 19rem), 82vw),28rem);aspect-ratio:1;',
    'background:var(--ink);border:3px solid var(--ink);border-radius:var(--radius-sm);overflow:hidden;direction:ltr;}',
    '.jg-p{aspect-ratio:1;min-width:0;padding:0;border:0;cursor:pointer;background-repeat:no-repeat;background-size:calc(var(--g) * 100%) calc(var(--g) * 100%);',
    'transition:transform .2s;position:relative;}',
    '.jg-board{touch-action:none;}',
    '.jg-ghost{position:fixed;z-index:60;pointer-events:none;opacity:.92;box-shadow:0 8px 24px rgba(0,0,0,.35);border-radius:6px;}',
    '.jg-p.jg-lifted{opacity:.3;}',
    '.jg-p.is-sel{outline:5px solid var(--sun);outline-offset:-5px;z-index:1;}',
    '.jg-p.is-home::after{content:"";position:absolute;inset:0;box-shadow:inset 0 0 0 3px var(--c-green);pointer-events:none;}',
    '.jg-p.is-tip{outline:6px solid var(--c-purple);outline-offset:-6px;z-index:2;}',
    '.jg-p.is-tiprow{box-shadow:inset 0 0 0 4px var(--c-purple);}',
    '.jg-p.is-tiprow::before{content:"";position:absolute;inset:0;background:var(--c-purple);opacity:.18;pointer-events:none;}',
    '.jg-done .jg-board{gap:0;}',
    '.jg-done .jg-p.is-home::after{box-shadow:none;}',
    '.jg-peek{width:5.5rem;height:5.5rem;border-radius:var(--radius-sm);border:2px solid var(--line);background-size:100% 100%;flex:none;}',
    '.jg-top{display:flex;align-items:center;gap:.7rem;}',
    '.jg-top p{margin:0;font-weight:700;max-width:14rem;}',
    '.jg-top{order:-1;}', // on a phone the picture stays above the board
    '.jg-peek-now{width:9rem;height:9rem;}',
    /* a computer: the picture, big, right beside the puzzle */
    '@media (min-width:900px){',
    '.app:has(.jg-wrap){max-width:72rem;}',
    '.jg-wrap{flex-direction:row;justify-content:center;align-items:center;gap:2.5rem;}',
    '.jg-wrap .jg-board{width:min(calc(100svh - 12.5rem),38rem);flex:none;}',
    '.jg-side{display:flex;flex-direction:column;align-items:center;gap:1rem;width:min(24rem,40%);}',
    '.jg-side .jg-top{flex-direction:column;}',
    '.jg-side .jg-peek{width:min(20rem,calc(100svh - 22rem));height:auto;aspect-ratio:1;}',
    '.jg-side .jg-peek-now{width:min(20rem,calc(100svh - 22rem));height:auto;}',
    '.jg-side .jg-top p{max-width:none;text-align:center;font-size:1.15rem;}',
    '}'
  ].join('');

  BrainGames.register({
    id: 'jigsaw',
    name: 'פאזל תמונה',
    skill: 'perception',
    isNew: true,
    tagline: 'החזירו את חלקי התמונה למקום',
    benefit: 'תפיסה חזותית ותכנון',
    instructions: [
      'תמונה אמיתית נחתכה לריבועים וכל החלקים התערבבו.',
      'גררו חלק אל המקום שלו, או לחצו על חלק אחד ואז על חלק אחר. שני החלקים יתחלפו במקום.',
      'בהמשך יש חלקים הפוכים: לחצו על חלק ואז על "סיבוב" כדי לסובב אותו.',
      'התמונה הקטנה למעלה מראה איך זה צריך להיראות. אין שעון.',
      'תקועים? "רמז" מסמן חלק אחד ואומר לאיזה חלק של התמונה הוא שייך. לחיצה נוספת מסמנת את השורה שלו.'
    ],
    css: css,
    _model: { spec: spec },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = sp.g <= 3 ? 3 : 2;
      var photos = ctx.shuffle((window.PhotoBank && window.PhotoBank.items) || []);
      var round = 0, good = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) { ctx.finish({ correct: good, total: ROUNDS, note: 'הרכבתם ' + good + ' מתוך ' + ROUNDS + ' תמונות בלי עזרה' }); return; }
        ctx.setProgress(round, ROUNDS);
        play(photos[round - 1]);
      }

      function play(photo) {
        root.innerHTML = '';
        var g = sp.g, N = g * g;
        // at[i] = piece shown in cell i; rot[piece] = quarter turns
        var at = [], rot = [];
        for (var i = 0; i < N; i++) { at.push(i); rot.push(0); }
        do { at = ctx.shuffle(at); } while (at.every(function (p, i) { return p === i; }));
        ctx.shuffle(at.slice()).slice(0, Math.round(N * sp.turn)).forEach(function (p) { rot[p] = ctx.randInt(1, 3); });
        var sel = -1, done = false, helps = 0;
        var tip = null; // { p, step }: the piece the last hint was about
        // pieces that look the same (plain sky, plain wall) may swap places: found by comparing small copies
        var looks = null;
        (function () {
          var img = new Image();
          img.onload = function () {
            try {
              var S = 8, cv = document.createElement('canvas');
              cv.width = cv.height = S * g;
              var c2 = cv.getContext('2d');
              c2.drawImage(img, 0, 0, S * g, S * g);
              looks = [];
              for (var p = 0; p < N; p++) looks.push(c2.getImageData((p % g) * S, Math.floor(p / g) * S, S, S).data);
              if (ctx.isActive() && !done) { draw(); check(); }
            } catch (e) { looks = null; } // a page opened from a file may not read pixels: then only the exact place counts
          };
          img.src = photo.src;
        })();
        function alike(a, b) {
          if (a === b) return true;
          if (!looks) return false;
          var d = 0, A = looks[a], B = looks[b];
          for (var i = 0; i < A.length; i += 4) d += Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]);
          return d / (A.length / 4 * 3) < 7;
        }
        function home(c) { return alike(at[c], c) && !rot[at[c]]; }
        var cells = [];
        var dragged = false; // a drag just ended: ignore the click that follows it
        for (var c = 0; c < N; c++) (function (c) {
          var b = el('button', { class: 'jg-p', type: 'button', 'aria-label': 'חלק ' + (c + 1),
            onclick: function () { if (dragged) { dragged = false; return; } tap(c); } });
          b.addEventListener('pointerdown', function (e) { startDrag(e, c); });
          cells.push(b);
        })(c);

        /* Drag a piece onto another one to swap them (tapping two pieces still works too). */
        function startDrag(e, from) {
          if (done || e.button > 0) return;
          var x0 = e.clientX, y0 = e.clientY, ghost = null, src = cells[from];
          var r = src.getBoundingClientRect();
          function move(ev) {
            if (!ghost) {
              if (Math.abs(ev.clientX - x0) + Math.abs(ev.clientY - y0) < 10) return;
              ghost = src.cloneNode(false);
              ghost.className = 'jg-p jg-ghost';
              ghost.style.width = r.width + 'px'; ghost.style.height = r.height + 'px';
              document.body.appendChild(ghost);
              src.classList.add('jg-lifted');
            }
            ev.preventDefault();
            ghost.style.left = (ev.clientX - r.width / 2) + 'px';
            ghost.style.top = (ev.clientY - r.height / 2) + 'px';
          }
          function up(ev) {
            document.removeEventListener('pointermove', move);
            document.removeEventListener('pointerup', up);
            document.removeEventListener('pointercancel', up);
            if (!ghost) return; // it was a tap: the click handler takes it
            ghost.remove();
            src.classList.remove('jg-lifted');
            dragged = true;
            setTimeout(function () { dragged = false; }, 400);
            var under = document.elementFromPoint(ev.clientX, ev.clientY);
            var to = cells.indexOf(under);
            if (to < 0 || to === from || done) return;
            ctx.sound('tap');
            var t = at[from]; at[from] = at[to]; at[to] = t;
            sel = -1;
            clearTip();
            draw(); check();
          }
          document.addEventListener('pointermove', move, { passive: false });
          document.addEventListener('pointerup', up);
          document.addEventListener('pointercancel', up);
        }
        var board = el('div', { class: 'jg-board', style: { '--g': g } }, cells);
        var turnBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: turn, hidden: !sp.turn }, 'סיבוב ↻');
        var peekBtn = el('button', { class: 'btn btn-quiet', type: 'button', hidden: sp.preview, onclick: peek }, 'הצצה בתמונה');
        var hintBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: hint }, 'רמז');
        var actions = el('div', { class: 'g-actions' }, [turnBtn, hintBtn, peekBtn]);
        // the board first; the picture and the buttons in a side part (beside the board on a computer, above/below on a phone)
        var wrap = el('div', { class: 'jg-wrap' }, [
          board,
          el('div', { class: 'g-side jg-side' }, [
            sp.preview ? el('div', { class: 'jg-top' }, [el('div', { class: 'jg-peek', style: { backgroundImage: 'url(' + photo.src + ')' }, 'aria-hidden': 'true' }),
              el('p', null, 'כך התמונה צריכה להיראות: ' + photo.w)]) : null,
            actions
          ])
        ]);
        root.appendChild(wrap);
        ctx.setStatus('גררו חלק למקומו, או לחצו על שני חלקים כדי להחליף');
        draw();

        function draw() {
          cells.forEach(function (b, c) {
            var p = at[c], px = p % g, py = Math.floor(p / g);
            b.style.backgroundImage = 'url(' + photo.src + ')';
            b.style.backgroundPosition = (g === 1 ? 0 : px * 100 / (g - 1)) + '% ' + (g === 1 ? 0 : py * 100 / (g - 1)) + '%';
            b.style.transform = 'rotate(' + rot[p] * 90 + 'deg)';
            b.classList.toggle('is-sel', c === sel && !done);
            b.classList.toggle('is-home', sp.mark && home(c));
            b.classList.toggle('is-tip', !!tip && at[c] === tip.p && !done);
            b.classList.toggle('is-tiprow', !!tip && tip.step === 2 && Math.floor(c / g) === Math.floor(tip.p / g) && !done);
            b.disabled = done;
          });
          turnBtn.disabled = done || sel < 0;
          hintBtn.disabled = peekBtn.disabled = done;
        }
        function tap(c) {
          if (done) return;
          ctx.sound('tap');
          if (sel < 0) { sel = c; draw(); return; }
          if (sel === c) { sel = -1; draw(); return; }
          var t = at[sel]; at[sel] = at[c]; at[c] = t;
          sel = -1;
          clearTip();
          draw(); check();
        }
        // the hint marks go away once its piece is in place
        function clearTip() { if (tip && placed(tip.p)) tip = null; }
        function turn() { if (done || sel < 0) return; ctx.sound('tap'); rot[at[sel]] = (rot[at[sel]] + 1) % 4; clearTip(); draw(); check(); }
        /* A hint that teaches where to look, never moves a piece: it marks one piece and says which part of the
           picture it comes from; a second tap marks the row it belongs in. A turned piece is pointed out. */
        function rowWords(p) {
          var r = Math.floor(p / g);
          if (g === 2) return r === 0 ? 'לחצי העליון של התמונה' : 'לחצי התחתון של התמונה';
          if (r === 0) return 'לשורה העליונה של התמונה';
          if (r === g - 1) return 'לשורה התחתונה של התמונה';
          return 'לאמצע התמונה (לא לשורה העליונה ולא לתחתונה)';
        }
        function where(p) { return at.indexOf(p); }
        function placed(p) { var c = where(p); return alike(at[c], c) && !rot[p]; }
        function hint() {
          if (done) return;
          // the row is marked already: say it again, it is not another hint
          if (tip && tip.step === 2 && !placed(tip.p)) { ctx.setStatus('רמז: החלק המסומן שייך לשורה המסומנת. באיזה מקום בשורה? גררו אותו לשם'); return; }
          helps++;
          var look = sp.preview ? ' השוו לתמונה הקטנה.' : ' חשבו מה רואים בו.';
          // the same piece again: mark the row it belongs in
          if (tip && tip.step === 1 && !placed(tip.p)) {
            tip.step = 2;
            if (alike(at[where(tip.p)], where(tip.p)) && rot[tip.p]) {
              ctx.setStatus('רמז: החלק המסומן כבר במקום, אבל הפוך. לחצו עליו ואז על "סיבוב ↻" עד שהוא נראה נכון');
            } else {
              ctx.setStatus('רמז: החלק המסומן שייך לשורה המסומנת. באיזה מקום בשורה? גררו אותו לשם' + (rot[tip.p] ? ', ואז סובבו אותו' : ''));
            }
            draw(); return;
          }
          // a new piece: the one picked, or else a corner piece (the easiest to place), or else any piece not in place
          var todo = [];
          for (var p = 0; p < N; p++) if (!placed(p)) todo.push(p);
          if (!todo.length) return;
          var corner = function (x) { return (x % g === 0 || x % g === g - 1) && (x < g || x >= N - g); };
          var pick = sel >= 0 && todo.indexOf(at[sel]) !== -1 ? at[sel] : todo.filter(corner)[0];
          if (pick === undefined) pick = todo[0];
          tip = { p: pick, step: 1 }; sel = -1;
          var c0 = where(pick);
          if (alike(at[c0], c0) && rot[pick]) {
            ctx.setStatus('רמז: החלק המסומן בסגול נמצא במקום הנכון, אבל הוא הפוך. לחצו עליו ואז על "סיבוב ↻"');
          } else {
            ctx.setStatus('רמז: החלק המסומן בסגול שייך ' + rowWords(pick) + '.' + look + (rot[pick] ? ' הוא גם הפוך: אחרי שתזיזו אותו, סובבו אותו.' : '') +
              ' (לחיצה נוספת על "רמז" תסמן את השורה שלו)');
          }
          draw();
        }
        function peek() {
          if (done) return;
          helps++;
          // shown in the side part: beside the puzzle on a computer, above it on a phone
          var img = el('div', { class: 'jg-peek jg-peek-now', style: { backgroundImage: 'url(' + photo.src + ')', order: '-1' } });
          var side = wrap.querySelector('.jg-side');
          side.insertBefore(img, side.firstChild);
          ctx.wait(2500).then(function () { img.remove(); });
        }
        function check() {
          for (var c = 0; c < N; c++) if (!home(c)) return;
          done = true;
          var ok = helps <= (g >= 5 ? 3 : 2);
          if (ok) good++;
          wrap.classList.add('jg-done');
          draw();
          ctx.setStatus('התמונה שלמה: ' + photo.w + '!');
          ctx.feedback(ok, ok ? undefined : 'התמונה שלמה, בעזרת רמזים').then(function () {
            actions.innerHTML = '';
            { ctx.wait(600).then(nextRound); return; } // a correct answer moves on by itself
            var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { next.disabled = true; nextRound(); } },
              round >= ROUNDS ? 'לסיכום' : 'לתמונה הבאה');
            actions.appendChild(next);
          });
        }
      }
      nextRound();
    }
  });
})();
