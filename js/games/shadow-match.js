/* איזה צל? — match a picture to its shadow (perception). Shadows are the same emoji made solid black. Wrong
   shadows come from look-alike objects chosen by hand, then from the same object flipped or turned, then the
   question is asked the other way round (shadow → object), and at the top two objects stand together. Untimed. */
(function () {
  'use strict';

  /* Groups of look-alikes. A "*" after an emoji = its mirror image looks different (used for flipped shadows). */
  var GROUPS = [
    '🐕* 🐈* 🐄* 🐖* 🐎* 🐐* 🐑* 🐪* 🦓* 🦏* 🐘* 🦒* 🦘* 🐿️* 🦔* 🐇*',
    '🐓* 🦆* 🐦* 🦅* 🦜* 🦢* 🕊️* 🦉 🐧',
    '🍎* 🍐* 🍋* 🍌* 🍇* 🍊 🍓 🍒',
    '🚗* 🚙* 🚚* 🚜* 🚑* 🚒* 🛵* 🚕 🚌 🚲',
    '🔨* 🪓* 🔧* 🪛* ⛏️* 🔑* ✂️',
    '🎸* 🎻* 🎺* 🎷* 🪕*',
    '🐟* 🐠* 🐡* 🦈* 🐬* 🐳* 🐋*',
    '☕* 🍺* 🍵 🫖 🥛',
    '👕 👗 👖 🧥 👔 🩳',
    '👟* 👞* 👠* 👢* 🥾* 🩴',
    '🐌* 🐛* 🐝* 🦗* 🐜 🐞 🦋 🕷️',
    '🌹* 🌲 🌳 🌴 🌵 🌷 🌻 🍄',
    '🛋️* 🛏️* 🪜* 🪑 🚪',
    '🌙* ⚡* ☁️* 🔥* ☂️ ⭐ ☀️ ❄️',
    '✋* 👍* ✌️* 👆* 👌*',
    '⛺* 🏠 ⛪ 🏰'
  ].map(function (g, gi) {
    return g.split(' ').map(function (t) { var m = t.slice(-1) === '*'; return { e: m ? t.slice(0, -1) : t, m: m, g: gi }; });
  });
  var ALL = [].concat.apply([], GROUPS);

  /* Level 1–50: which kinds of question, and how many wrong shadows come from the same group (look-alikes). */
  function spec(level) {
    var L = level;
    if (L <= 6) return { kinds: ['basic'], same: 0 };
    if (L <= 10) return { kinds: ['basic'], same: 1 };
    if (L <= 14) return { kinds: ['basic'], same: 2 };
    if (L <= 20) return { kinds: ['basic'], same: 3 };
    if (L <= 26) return { kinds: ['mirror', 'basic'], same: 3 };
    if (L <= 32) return { kinds: ['turn', 'mirror'], same: 3 };
    if (L <= 36) return { kinds: ['reverse', 'turn'], same: 3 };
    if (L <= 40) return { kinds: ['reverse', 'reverseFlip', 'turn'], same: 3 };
    if (L <= 45) return { kinds: ['combo', 'reverseFlip'], same: 3 };
    return { kinds: ['combo', 'comboFlip', 'reverseFlip', 'turn'], same: 3 };
  }

  /* A picture = list of parts { e, flip, rot, pos } (+ sil: shown as a shadow). key() tells pictures apart. */
  function part(it, o) { return { e: it.e, flip: !!(o && o.flip), rot: (o && o.rot) || 0, pos: (o && o.pos) || 'one' }; }
  function key(pic) { return pic.parts.map(function (p) { return p.e + (p.flip ? 'f' : '') + p.rot + p.pos; }).join('|'); }

  function others(it, rnd, n, sameGroup, needM) {
    var pool = ALL.filter(function (x) { return x.e !== it.e && (sameGroup ? x.g === it.g : x.g !== it.g) && (!needM || x.m); });
    return rnd.shuffle(pool).slice(0, n);
  }

  function makeQuestion(sp, rnd) {
    var kind = rnd.pick(sp.kinds), it, opts, show, ans, flipM;
    if (kind === 'basic') {
      it = rnd.pick(ALL);
      var same = Math.min(sp.same, GROUPS[it.g].length - 1);
      var ds = others(it, rnd, same, true).concat(others(it, rnd, 3 - same, false));
      show = { parts: [part(it)] };
      ans = { parts: [part(it)], sil: true };
      opts = [ans].concat(ds.map(function (d) { return { parts: [part(d)], sil: true }; }));
      return done(kind, show, ans, opts, rnd);
    }
    if (kind === 'mirror' || kind === 'turn') {
      it = rnd.pick(ALL.filter(function (x) { return x.m && GROUPS[x.g].filter(function (y) { return y.m; }).length >= 3; }));
      show = { parts: [part(it)] };
      ans = { parts: [part(it)], sil: true };
      opts = [ans, { parts: [part(it, { flip: true })], sil: true }];
      if (kind === 'turn') opts.push({ parts: [part(it, { rot: rnd.pick([90, 270]) })], sil: true });
      var look = others(it, rnd, 4 - opts.length, true, true);
      look.forEach(function (d, i) { opts.push({ parts: [part(d, { flip: kind === 'mirror' && i === 0 })], sil: true }); });
      return done(kind, show, ans, opts, rnd);
    }
    if (kind === 'reverse' || kind === 'reverseFlip') {
      // shadow shown, choose the object
      flipM = kind === 'reverseFlip';
      it = rnd.pick(ALL.filter(function (x) { return (!flipM || x.m) && GROUPS[x.g].length >= 4; }));
      show = { parts: [part(it)], sil: true };
      ans = { parts: [part(it)] };
      opts = [ans];
      if (flipM) opts.push({ parts: [part(it, { flip: true })] });
      others(it, rnd, 4 - opts.length, true).forEach(function (d) { opts.push({ parts: [part(d)] }); });
      return done(kind, show, ans, opts, rnd);
    }
    // combo: two objects together; flip variants at the top levels
    flipM = kind === 'comboFlip';
    var a = rnd.pick(ALL.filter(function (x) { return !flipM || x.m; }));
    var b = rnd.pick(ALL.filter(function (x) { return x.g !== a.g; }));
    function pic(A, B, o) {
      o = o || {};
      return { parts: [part(A, { pos: o.swap ? 'top' : 'big', flip: o.flipA }), part(B, { pos: o.swap ? 'big' : 'top' })], sil: true };
    }
    show = pic(a, b); show.sil = false;
    ans = pic(a, b);
    opts = [ans, pic(a, b, { swap: true })];
    var b2 = others(b, rnd, 1, true)[0], a2 = others(a, rnd, 1, true)[0];
    if (flipM) opts.push(pic(a, b, { flipA: true }));
    if (b2) opts.push(pic(a, b2));
    if (a2 && opts.length < 4) opts.push(pic(a2, b));
    while (opts.length < 4) opts.push(pic(others(a, rnd, 1, false)[0], b));
    return done(kind, show, ans, opts.slice(0, 4), rnd);
  }

  function done(kind, show, ans, opts, rnd) {
    // four different pictures, exactly one equal to the answer
    var seen = {}, out = [];
    opts.forEach(function (o) { var k = key(o) + (o.sil ? 's' : ''); if (!seen[k]) { seen[k] = true; out.push(o); } });
    for (var guard = 0; out.length < 4 && guard < 200; guard++) {
      // fill up with another object (in a pair: the small one swapped for another)
      var d = rnd.pick(ALL);
      var o = ans.parts.length === 1 ? { parts: [part(d)], sil: ans.sil } : { parts: [ans.parts[0], part(d, { pos: 'top' })], sil: ans.sil };
      var k = key(o) + (o.sil ? 's' : '');
      if (!seen[k]) { seen[k] = true; out.push(o); }
    }
    out = rnd.shuffle(out);
    return { kind: kind, show: show, options: out, answer: out.indexOf(ans) };
  }

  var css = [
    '.sh-show{display:grid;place-items:center;width:10rem;height:8rem;border-radius:var(--radius);background:var(--surface-2);border:2px solid var(--line);}',
    '.sh-show.is-sil{background:var(--c-yellow-soft);}',
    '.sh-pic{position:relative;display:grid;place-items:center;line-height:1;font-family:"Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif;}',
    '.sh-pic.one{width:1.25em;height:1.25em;}',
    '.sh-pic.two{width:1.55em;height:1.45em;}',
    '.sh-pic span{display:block;line-height:1;}',
    '.sh-pic.two .big{position:absolute;left:0;bottom:0;font-size:.82em;}',
    '.sh-pic.two .top{position:absolute;right:0;top:0;font-size:.6em;}',
    '.sh-show .sh-pic{font-size:5.2rem;}',
    '.sh-opts{display:grid;grid-template-columns:1fr 1fr;gap:.7rem;width:100%;max-width:24rem;}',
    '.sh-opt{display:grid;place-items:center;min-height:7.3rem;padding:.3rem;border-radius:var(--radius);border:3px solid var(--line);background:var(--surface);cursor:pointer;}',
    '.sh-opt.is-sil{background:var(--c-yellow-soft);}',
    '.sh-opt .sh-pic{font-size:4.2rem;}',
    '.sh-opt.is-correct{border-color:var(--good);box-shadow:0 0 0 3px var(--good);}',
    '.sh-opt.is-wrong{border-color:var(--bad);box-shadow:0 0 0 3px var(--bad);opacity:.8;}',
    '.sh-opt:disabled{cursor:default;}',
    '.sh-sil .sh-pic{filter:brightness(0);}',
    /* dark mode: the shadows turn light so they stay visible on the dark cards */
    '@media (prefers-color-scheme: dark){:root:not([data-theme="light"]) .sh-sil .sh-pic{filter:brightness(0) invert(1);}}',
    ':root[data-theme="dark"] .sh-sil .sh-pic{filter:brightness(0) invert(1);}'
  ].join('');

  BrainGames.register({
    id: 'shadow-match',
    name: 'איזה צל?',
    skill: 'perception',
    isNew: true,
    tagline: 'התאימו כל ציור לצל שלו',
    benefit: 'תפיסה חזותית וזיהוי צורות',
    instructions: [
      'למעלה יש ציור. למטה ארבעה צללים שחורים.',
      'בחרו את הצל שיש לו בדיוק אותה צורה. שימו לב לפרטים הקטנים: אוזניים, ידיות, זנבות.',
      'ברמות גבוהות יש צללים הפוכים או מסובבים. הצל הנכון פונה לאותו צד כמו הציור.',
      'אחר כך זה מתהפך: רואים צל ובוחרים את הציור, ובסוף שני חפצים יחד. אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makeQuestion: makeQuestion, key: key, GROUPS: GROUPS },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var Q = 8, q = 0, good = 0;

      function picEl(pic) {
        var two = pic.parts.length > 1;
        return el('span', { class: 'sh-pic ' + (two ? 'two' : 'one'), 'aria-hidden': 'true' }, pic.parts.map(function (p) {
          var tr = (p.flip ? 'scaleX(-1) ' : '') + (p.rot ? 'rotate(' + p.rot + 'deg)' : '');
          return el('span', { class: p.pos, style: tr ? { transform: tr } : null }, p.e);
        }));
      }

      function nextQ() {
        if (q >= Q) { ctx.finish({ correct: good, total: Q, note: 'מצאתם ' + good + ' מתוך ' + Q + ' התאמות' }); return; }
        q++;
        ctx.setProgress(q, Q);
        var it = makeQuestion(sp, ctx);
        root.innerHTML = '';
        var rev = !it.options[0].sil;
        root.appendChild(el('div', { class: 'sh-show' + (it.show.sil ? ' is-sil sh-sil' : '') }, picEl(it.show)));
        ctx.setStatus(rev ? 'של מי הצל הזה?' : it.show.parts.length > 1 ? 'איזה צל מתאים לשניהם יחד?' : 'איזה צל מתאים לציור?');
        var box = el('div', { class: 'sh-opts' });
        box._ans = it.answer; // read by automated tests only
        var answered = false;
        it.options.forEach(function (o, i) {
          var b = el('button', { class: 'sh-opt' + (o.sil ? ' is-sil sh-sil' : ''), type: 'button', 'aria-label': 'אפשרות ' + (i + 1), onclick: function () { answer(i, b); } }, picEl(o));
          box.appendChild(b);
        });
        root.appendChild(box);
        var actions = el('div', { class: 'g-actions' });
        root.appendChild(actions);

        function answer(i, b) {
          if (answered) return;
          answered = true;
          var ok = i === it.answer;
          if (ok) good++;
          [].forEach.call(box.children, function (x, j) { x.disabled = true; if (j === it.answer) x.classList.add('is-correct'); });
          if (!ok) b.classList.add('is-wrong');
          var msg = ok ? undefined : it.kind === 'mirror' || it.kind === 'turn' || it.kind === 'reverseFlip' || it.kind === 'comboFlip' ? 'הנכון מסומן בירוק. שימו לב לאיזה צד הוא פונה' : 'הנכון מסומן בירוק';
          ctx.feedback(ok, msg).then(function () {
            if (ok) { nextQ(); return; }
            var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { next.disabled = true; nextQ(); } }, q >= Q ? 'לסיכום' : 'לשאלה הבאה');
            actions.appendChild(next);
          });
        }
      }
      nextQ();
    }
  });
})();
