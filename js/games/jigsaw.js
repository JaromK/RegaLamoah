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
    '.jg-board{display:grid;grid-template-columns:repeat(var(--g),minmax(0,1fr));gap:2px;width:min(100%,calc(100svh - 19rem),28rem);aspect-ratio:1;',
    'background:var(--ink);border:3px solid var(--ink);border-radius:var(--radius-sm);overflow:hidden;direction:ltr;}',
    '.jg-p{aspect-ratio:1;min-width:0;padding:0;border:0;cursor:pointer;background-repeat:no-repeat;background-size:calc(var(--g) * 100%) calc(var(--g) * 100%);',
    'transition:transform .2s;position:relative;}',
    '.jg-board{touch-action:none;}',
    '.jg-ghost{position:fixed;z-index:60;pointer-events:none;opacity:.92;box-shadow:0 8px 24px rgba(0,0,0,.35);border-radius:6px;}',
    '.jg-p.jg-lifted{opacity:.3;}',
    '.jg-p.is-sel{outline:5px solid var(--sun);outline-offset:-5px;z-index:1;}',
    '.jg-p.is-home::after{content:"";position:absolute;inset:0;box-shadow:inset 0 0 0 3px var(--c-green);pointer-events:none;}',
    '.jg-done .jg-board{gap:0;}',
    '.jg-done .jg-p.is-home::after{box-shadow:none;}',
    '.jg-peek{width:5.5rem;height:5.5rem;border-radius:var(--radius-sm);border:2px solid var(--line);background-size:100% 100%;flex:none;}',
    '.jg-top{display:flex;align-items:center;gap:.7rem;}',
    '.jg-top p{margin:0;font-weight:700;max-width:14rem;}'
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
      'התמונה הקטנה למעלה מראה איך זה צריך להיראות. אין שעון.'
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
        var wrap = el('div', { class: 'jg-wrap' }, [
          sp.preview ? el('div', { class: 'jg-top' }, [el('div', { class: 'jg-peek', style: { backgroundImage: 'url(' + photo.src + ')' }, 'aria-hidden': 'true' }),
            el('p', null, 'כך התמונה צריכה להיראות: ' + photo.w)]) : null,
          board, actions
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
            b.classList.toggle('is-home', sp.mark && p === c && !rot[p]);
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
          draw(); check();
        }
        function turn() { if (done || sel < 0) return; ctx.sound('tap'); rot[at[sel]] = (rot[at[sel]] + 1) % 4; draw(); check(); }
        function hint() {
          if (done) return;
          helps++;
          // put one piece in its place (and turn it right)
          for (var c = 0; c < N; c++) if (at[c] !== c || rot[at[c]]) {
            var j = at.indexOf(c);
            at[j] = at[c]; at[c] = c; rot[c] = 0; sel = -1;
            ctx.setStatus('רמז: חלק אחד חזר למקומו');
            draw(); check(); return;
          }
        }
        function peek() {
          if (done) return;
          helps++;
          var img = el('div', { class: 'jg-peek', style: { backgroundImage: 'url(' + photo.src + ')', width: '9rem', height: '9rem' } });
          root.insertBefore(img, wrap);
          ctx.wait(2500).then(function () { img.remove(); });
        }
        function check() {
          for (var c = 0; c < N; c++) if (at[c] !== c || rot[c]) return;
          done = true;
          var ok = helps <= (g >= 5 ? 2 : 1);
          if (ok) good++;
          wrap.classList.add('jg-done');
          draw();
          ctx.setStatus('התמונה שלמה: ' + photo.w + '!');
          ctx.feedback(ok, ok ? undefined : 'התמונה שלמה, בעזרת רמזים').then(function () {
            actions.innerHTML = '';
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
