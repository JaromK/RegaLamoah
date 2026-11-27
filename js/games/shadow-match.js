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
  /* The first ten levels were too easy (user request): level 1 is what used to be level 11, and so on up to 40;
     41–50 are new and harder (a partly hidden shadow or an outline, with the object's own mirror image among the
     answers). Players' saved levels moved down by 10 once (core.js), so nobody jumps ten levels. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    if (L > 40) return L <= 45
      ? { kinds: ['comboFlip', 'overlap', 'partialFlip', 'outlineFlip', 'reverseFlip'], same: 3 }
      : { kinds: ['partialFlip', 'outlineFlip', 'overlap', 'comboFlip', 'partial'], same: 3 };
    return oldSpec(L + 10);
  }
  function oldSpec(L) {
    // an outline only (11), a shadow partly covered (15), two shadows on top of each other (21)
    if (L <= 14) return { kinds: ['basic', 'outline'], same: 2 };
    if (L <= 20) return { kinds: ['basic', 'outline', 'partial'], same: 3 };
    if (L <= 26) return { kinds: ['mirror', 'basic', 'partial', 'overlap', 'outline'], same: 3 };
    if (L <= 32) return { kinds: ['turn', 'mirror', 'outlineOpt', 'partialOpt', 'overlap'], same: 3 };
    if (L <= 36) return { kinds: ['reverse', 'turn', 'partial', 'outlineOpt', 'overlap'], same: 3 };
    if (L <= 40) return { kinds: ['reverse', 'reverseFlip', 'partialOpt', 'overlap', 'outline'], same: 3 };
    if (L <= 45) return { kinds: ['combo', 'reverseFlip', 'overlap', 'partialOpt', 'outlineOpt'], same: 3 };
    return { kinds: ['comboFlip', 'reverseFlip', 'overlap', 'partial', 'partialOpt', 'outline', 'turn'], same: 3 };
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
    var big = function (x) { return GROUPS[x.g].length >= 4; };
    if (kind === 'outline' || kind === 'partial') {
      // an outline, or a shadow partly behind a curtain: which object is it? (look-alikes to choose from)
      it = rnd.pick(ALL.filter(big));
      show = { parts: [part(it)], sil: kind === 'outline' ? 'outline' : true, cover: kind === 'partial' ? rnd.pick(['l', 'r', 't', 'b']) : null };
      ans = { parts: [part(it)] };
      opts = [ans].concat(others(it, rnd, 3, true).map(function (d) { return { parts: [part(d)] }; }));
      return done(kind, show, ans, opts, rnd);
    }
    if (kind === 'outlineOpt' || kind === 'partialOpt') {
      // the object is shown; the four answers are outlines, or shadows all covered on the same side
      it = rnd.pick(ALL.filter(big));
      var side = rnd.pick(['l', 'r', 't', 'b']), mk = function (x) {
        return kind === 'outlineOpt' ? { parts: [part(x)], sil: 'outline' } : { parts: [part(x)], sil: true, cover: side };
      };
      show = { parts: [part(it)] };
      ans = mk(it);
      opts = [ans].concat(others(it, rnd, 3, true).map(mk));
      return done(kind, show, ans, opts, rnd);
    }
    if (kind === 'outlineFlip' || kind === 'partialFlip') {
      // the object is shown; the answers are outlines (or partly hidden shadows) and one of them is its mirror image
      it = rnd.pick(ALL.filter(function (x) { return x.m && GROUPS[x.g].filter(function (y) { return y.m; }).length >= 3; }));
      var side2 = rnd.pick(['l', 'r', 't', 'b']), mk2 = function (x, flip) {
        return kind === 'outlineFlip' ? { parts: [part(x, { flip: flip })], sil: 'outline' } : { parts: [part(x, { flip: flip })], sil: true, cover: side2 };
      };
      show = { parts: [part(it)] };
      ans = mk2(it, false);
      opts = [ans, mk2(it, true)].concat(others(it, rnd, 2, true, true).map(function (d) { return mk2(d, rnd.randInt(0, 1) === 1); }));
      return done(kind, show, ans, opts, rnd);
    }
    if (kind === 'overlap') {
      // two shadows on top of each other: which two objects make them? Each answer is a pair of pictures
      var A = rnd.pick(ALL.filter(big)), B = rnd.pick(ALL.filter(function (x) { return big(x) && x.g !== A.g; }));
      var A2 = others(A, rnd, 1, true)[0], B2 = others(B, rnd, 1, true)[0];
      show = { parts: [part(A, { pos: 'ovA' }), part(B, { pos: 'ovB' })], sil: true, lay: 'ovl' };
      var pair = function (x, y) { return { parts: [part(x, { pos: 'pa' }), part(y, { pos: 'pb' })], lay: 'pair' }; };
      ans = pair(A, B);
      opts = [ans, pair(A, B2), pair(A2, B), pair(A2, B2)];
      return done(kind, show, ans, opts, rnd);
    }
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
    opts.forEach(function (o) { var k = key(o) + (o.sil ? 's' + o.sil : ''); if (!seen[k]) { seen[k] = true; out.push(o); } });
    for (var guard = 0; out.length < 4 && guard < 200; guard++) {
      // fill up with another object (in a pair: the small one swapped for another)
      var d = rnd.pick(ALL);
      var o = ans.parts.length === 1 ? { parts: [part(d)], sil: ans.sil, cover: ans.cover }
        : ans.lay === 'pair' ? { parts: [ans.parts[0], part(d, { pos: 'pb' })], lay: 'pair' }
        : { parts: [ans.parts[0], part(d, { pos: 'top' })], sil: ans.sil };
      var k = key(o) + (o.sil ? 's' + o.sil : '');
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
    '.sh-opts{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:.7rem;width:100%;max-width:24rem;}',
    '.sh-opt{display:grid;place-items:center;min-width:0;min-height:7.3rem;padding:.3rem;border-radius:var(--radius);border:3px solid var(--line);background:var(--surface);cursor:pointer;}',
    '.sh-opt.is-sil{background:var(--c-yellow-soft);}',
    '.sh-opt .sh-pic{font-size:4.2rem;}',
    '.sh-opt.is-correct{border-color:var(--good);box-shadow:0 0 0 3px var(--good);}',
    '.sh-opt.is-wrong{border-color:var(--bad);box-shadow:0 0 0 3px var(--bad);opacity:.8;}',
    '.sh-opt:disabled{cursor:default;}',
    '.sh-sil .sh-pic{filter:brightness(0);}',
    /* an outline only: the shape filled like the card, with a dark line around it */
    '.sh-show.is-outline,.sh-opt.is-outline{background:#fff;}',
    '.is-outline .sh-pic{filter:brightness(0) invert(1) drop-shadow(2px 0 0 #1b1b1b) drop-shadow(-2px 0 0 #1b1b1b) drop-shadow(0 2px 0 #1b1b1b) drop-shadow(0 -2px 0 #1b1b1b);}',
    /* a curtain over part of a shadow (drawn outside the darkened picture, so it keeps its stripes) */
    '.sh-frame{position:relative;display:inline-grid;place-items:center;}',
    '.sh-cover{position:absolute;background:repeating-linear-gradient(45deg,var(--surface-2) 0 7px,var(--line) 7px 10px);border:2px solid var(--ink-soft);border-radius:6px;}',
    '.sh-cover.l{left:-.5rem;top:-.4rem;bottom:-.4rem;width:52%;}.sh-cover.r{right:-.5rem;top:-.4rem;bottom:-.4rem;width:52%;}',
    '.sh-cover.t{top:-.4rem;left:-.5rem;right:-.5rem;height:52%;}.sh-cover.b{bottom:-.4rem;left:-.5rem;right:-.5rem;height:52%;}',
    /* two shadows on top of each other; and a pair of pictures as an answer */
    '.sh-pic.ovl{width:1.75em;height:1.2em;}',
    '.sh-pic.ovl .ovA{position:absolute;left:0;top:.1em;font-size:.95em;}.sh-pic.ovl .ovB{position:absolute;right:0;top:0;font-size:.95em;}',
    '.sh-show .sh-pic.ovl{font-size:4.6rem;}',
    '.sh-pic.pair{display:flex;gap:.15em;width:auto;height:auto;}',
    '.sh-opt .sh-pic.pair{font-size:2.5rem;}',
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
      'אחר כך זה מתהפך: רואים צל ובוחרים את הציור. בהמשך: רק קו מתאר, צל שחלק ממנו מוסתר, ושני צללים זה על זה. אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makeQuestion: makeQuestion, key: key, GROUPS: GROUPS },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var Q = 8, q = 0, good = 0;

      function picEl(pic) {
        var lay = pic.lay || (pic.parts.length > 1 ? 'two' : 'one');
        var img = el('span', { class: 'sh-pic ' + lay, 'aria-hidden': 'true' }, pic.parts.map(function (p) {
          var tr = (p.flip ? 'scaleX(-1) ' : '') + (p.rot ? 'rotate(' + p.rot + 'deg)' : '');
          return el('span', { class: p.pos, style: tr ? { transform: tr } : null }, p.e);
        }));
        return pic.cover ? el('span', { class: 'sh-frame' }, [img, el('span', { class: 'sh-cover ' + pic.cover })]) : img;
      }
      function silClass(pic) { return pic.sil === 'outline' ? ' is-outline' : pic.sil ? ' is-sil sh-sil' : ''; }

      function nextQ() {
        if (q >= Q) { ctx.finish({ correct: good, total: Q, note: 'מצאתם ' + good + ' מתוך ' + Q + ' התאמות' }); return; }
        q++;
        ctx.setProgress(q, Q);
        var it = makeQuestion(sp, ctx);
        root.innerHTML = '';
        var rev = !it.options[0].sil;
        root.appendChild(el('div', { class: 'sh-show' + silClass(it.show) }, picEl(it.show)));
        var ASK = {
          outline: 'של מי קו המתאר הזה?', partial: 'של מי הצל? חלק ממנו מוסתר', overlap: 'שני צללים זה על זה. של מי הם?',
          outlineOpt: 'איזה קו מתאר מתאים לציור?', partialOpt: 'איזה צל מתאים? בכל צל חלק מוסתר',
          outlineFlip: 'איזה קו מתאר מתאים? שימו לב לאיזה צד הוא פונה', partialFlip: 'איזה צל מתאים? חלק מוסתר, ושימו לב לצד'
        };
        ctx.setStatus(ASK[it.kind] || (rev ? 'של מי הצל הזה?' : it.show.parts.length > 1 ? 'איזה צל מתאים לשניהם יחד?' : 'איזה צל מתאים לציור?'));
        var box = el('div', { class: 'sh-opts' });
        box._ans = it.answer; // read by automated tests only
        var answered = false;
        it.options.forEach(function (o, i) {
          var b = el('button', { class: 'sh-opt' + silClass(o), type: 'button', 'aria-label': 'אפשרות ' + (i + 1), onclick: function () { answer(i, b); } }, picEl(o));
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
          var msg = ok ? undefined : it.kind === 'partial' || it.kind === 'partialOpt' ? 'הנכון מסומן בירוק. הסתכלו על החלק שרואים'
            : it.kind === 'overlap' ? 'הנכון מסומן בירוק. חפשו בצל את הצורה של כל אחד'
            : it.kind === 'outlineFlip' || it.kind === 'partialFlip' ? 'הנכון מסומן בירוק. שימו לב לאיזה צד הציור פונה'
            : it.kind === 'outline' || it.kind === 'outlineOpt' ? 'הנכון מסומן בירוק. עקבו אחרי הקו מסביב'
            : it.kind === 'mirror' || it.kind === 'turn' || it.kind === 'reverseFlip' || it.kind === 'comboFlip' ? 'הנכון מסומן בירוק. שימו לב לאיזה צד הוא פונה' : 'הנכון מסומן בירוק';
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
