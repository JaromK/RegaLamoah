/* איזו תמונה? — read a word and tap the real photo that shows it (reading, naming, visual recognition).
   50 levels: more photos, look-alike photos (same kind, then truly similar), zoomed-in photos, and finally
   two words at once. Photos come from js/photo-bank.js. Untimed. */
(function () {
  'use strict';

  var BANK = window.PhotoBank;
  if (!BANK) return;
  var ITEMS = BANK.items;

  /* Per level: n = photos on the board, t = tiers of the target word, d = how the other photos are chosen
     ('any' = other kinds, 'cat' = the same kind, 'sim' = look-alikes first), zoom = show a zoomed-in part,
     find = how many words to find at once. */
  var LEVELS = [
    { n: 2, t: [1], d: 'any' },                       // 1
    { n: 3, t: [1], d: 'any' },                       // 2
    { n: 3, t: [1, 2], d: 'any' },                    // 3
    { n: 4, t: [1], d: 'any' },                       // 4
    { n: 4, t: [1, 2], d: 'any' },                    // 5
    { n: 4, t: [1], d: 'cat' },                       // 6
    { n: 4, t: [1, 2], d: 'any' },                    // 7
    { n: 4, t: [1, 2], d: 'cat' },                    // 8
    { n: 4, t: [2], d: 'any' },                       // 9
    { n: 4, t: [2], d: 'cat' },                       // 10
    { n: 6, t: [1, 2], d: 'any' },                    // 11
    { n: 4, t: [1, 2], d: 'sim' },                    // 12
    { n: 6, t: [1, 2], d: 'cat' },                    // 13
    { n: 4, t: [2, 3], d: 'cat' },                    // 14
    { n: 6, t: [2], d: 'cat' },                       // 15
    { n: 4, t: [2, 3], d: 'sim' },                    // 16
    { n: 6, t: [2, 3], d: 'any' },                    // 17
    { n: 6, t: [1, 2], d: 'sim' },                    // 18
    { n: 6, t: [2, 3], d: 'cat' },                    // 19
    { n: 6, t: [2, 3], d: 'sim' },                    // 20
    { n: 6, t: [3], d: 'cat' },                       // 21
    { n: 6, t: [3], d: 'sim' },                       // 22
    { n: 4, t: [1, 2], d: 'any', zoom: 1.5 },         // 23 zoomed-in photos start gently
    { n: 6, t: [2, 3], d: 'sim' },                    // 24
    { n: 4, t: [1, 2], d: 'cat', zoom: 1.5 },         // 25
    { n: 6, t: [1, 2, 3], d: 'sim' },                 // 26
    { n: 6, t: [1, 2], d: 'any', zoom: 1.6 },         // 27
    { n: 4, t: [2, 3], d: 'sim', zoom: 1.6 },         // 28
    { n: 6, t: [1, 2], d: 'cat', zoom: 1.7 },         // 29
    { n: 6, t: [2, 3], d: 'cat', zoom: 1.7 },         // 30
    { n: 6, t: [1, 2, 3], d: 'sim', zoom: 1.8 },      // 31
    { n: 6, t: [2, 3], d: 'cat', zoom: 1.9 },         // 32
    { n: 6, t: [2, 3], d: 'sim', zoom: 1.9 },         // 33
    { n: 6, t: [3], d: 'cat', zoom: 2 },              // 34
    { n: 6, t: [2, 3], d: 'sim', zoom: 2.1 },         // 35
    { n: 6, t: [1, 2], d: 'any', find: 2 },           // 36 two words at once
    { n: 6, t: [1, 2], d: 'cat', find: 2 },           // 37
    { n: 6, t: [2, 3], d: 'cat', find: 2 },           // 38
    { n: 6, t: [1, 2, 3], d: 'sim', find: 2 },        // 39
    { n: 6, t: [2, 3], d: 'sim', find: 2 },           // 40
    { n: 6, t: [1, 2], d: 'any', find: 2, zoom: 1.5 },   // 41
    { n: 6, t: [1, 2, 3], d: 'cat', find: 2, zoom: 1.6 }, // 42
    { n: 6, t: [2, 3], d: 'cat', find: 2, zoom: 1.7 },   // 43
    { n: 6, t: [2, 3], d: 'sim', find: 2, zoom: 1.7 },   // 44
    { n: 6, t: [1, 2], d: 'any', find: 3 },              // 45 three words
    { n: 6, t: [2, 3], d: 'cat', find: 3 },              // 46
    { n: 6, t: [2, 3], d: 'sim', find: 3 },              // 47
    { n: 6, t: [2, 3], d: 'cat', find: 2, zoom: 2 },     // 48
    { n: 6, t: [2, 3], d: 'sim', find: 3, zoom: 1.6 },   // 49
    { n: 6, t: [2, 3], d: 'sim', find: 3, zoom: 1.9 }    // 50
  ];

  var simOf = {};
  (BANK.groups || []).forEach(function (g) { g.forEach(function (id) { simOf[id] = g; }); });
  var byId = {};
  ITEMS.forEach(function (it) { byId[it.id] = it; });

  /* The photos of one round: the targets plus look-alikes / same kind / others, by the level's rule. */
  function makeRound(spec, used, shuffle) {
    var find = spec.find || 1;
    var fresh = ITEMS.filter(function (o) { return !used[o.id]; });
    if (fresh.length < 10) { Object.keys(used).forEach(function (k) { delete used[k]; }); fresh = ITEMS.slice(); }
    var first = shuffle(fresh.filter(function (o) { return spec.t.indexOf(o.tier) !== -1; }))[0] || shuffle(fresh)[0];
    var chosen = [first];
    function add(list) {
      shuffle(list).forEach(function (o) {
        if (chosen.length < spec.n && chosen.indexOf(o) === -1 && !chosen.some(function (c) { return c.w === o.w; })) chosen.push(o);
      });
    }
    if (spec.d === 'sim' && simOf[first.id]) add(simOf[first.id].map(function (id) { return byId[id]; }).filter(Boolean));
    if (spec.d !== 'any') add(ITEMS.filter(function (o) { return o.cat === first.cat; }));
    // 'any': one photo per other kind first, so the board looks varied
    var others = shuffle(ITEMS.filter(function (o) { return o.cat !== first.cat; }));
    var seenCat = {};
    add(others.filter(function (o) { if (seenCat[o.cat]) return false; seenCat[o.cat] = true; return true; }));
    add(others);
    // the other targets come from the board (so with 'sim' they are look-alikes of the first)
    var targets = [first].concat(shuffle(chosen.slice(1)).slice(0, find - 1));
    targets.forEach(function (o) { used[o.id] = true; });
    return { targets: targets, photos: shuffle(chosen) };
  }

  var css = [
    '.pp-wrap{width:100%;display:flex;flex-direction:column;align-items:center;gap:.6rem}',
    '.pp-words{display:flex;flex-wrap:wrap;justify-content:center;gap:.4rem .6rem}',
    '.pp-word{font-family:var(--font-display);font-weight:900;font-size:2rem;line-height:1.1;padding:.25rem 1.1rem;border-radius:999px;',
    'background:var(--language-soft);color:var(--ink);border:3px solid var(--language)}',
    /* two or three words share one line */
    '.pp-words.pp-many .pp-word{font-size:1.45rem;padding:.15rem .8rem}',
    '.pp-word.is-found{background:var(--good-soft);border-color:var(--good);color:var(--good)}',
    '.pp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.55rem;width:100%}',
    '.pp-grid.pp-odd>:last-child{grid-column:1 / -1;justify-self:center;width:calc(50% - .275rem)}',
    '.pp-photo{position:relative;aspect-ratio:1;padding:0;border-radius:var(--radius);overflow:hidden;cursor:pointer;',
    'border:3px solid var(--line);background:var(--surface)}',
    '.pp-photo img{width:100%;height:100%;display:block;object-fit:cover;transform-origin:var(--pp-ox,50%) var(--pp-oy,50%);',
    'transform:scale(var(--pp-z,1));pointer-events:none}',
    '.pp-photo:hover:not(:disabled){border-color:var(--language)}',
    '.pp-photo:disabled{cursor:default}',
    '.pp-photo.is-correct{border-color:var(--good);box-shadow:0 0 0 3px var(--good)}',
    '.pp-photo.is-wrong{border-color:var(--bad);box-shadow:0 0 0 3px var(--bad)}',
    '.pp-photo.is-missed{border:4px dashed var(--good)}',
    '.pp-mark{position:absolute;top:.3rem;inset-inline-start:.3rem;width:2rem;height:2rem;border-radius:50%;display:grid;place-items:center;',
    'font-size:1.2rem;font-weight:900;color:var(--surface);background:var(--good)}',
    '.is-wrong .pp-mark{background:var(--bad)}',
    /* after the answer every photo gets its name */
    '.pp-name{position:absolute;inset-inline:0;bottom:0;padding:.15rem .3rem;background:rgba(0,0,0,.62);color:#fff;font-weight:800;',
    'font-size:1.05rem;text-align:center;line-height:1.25}'
  ].join('');

  BrainGames.register({
    id: 'photo-pick',
    name: 'איזו תמונה?',
    skill: 'language',
    tagline: 'קראו את המילה ובחרו את התמונה המתאימה',
    benefit: 'קריאה, אוצר מילים וזיהוי חזותי',
    maxLevel: 50,
    instructions: [
      'למעלה כתובה מילה, ולמטה יש כמה תמונות אמיתיות.',
      'לחצו על התמונה שמתאימה למילה.',
      'ככל שמתקדמים יש יותר תמונות, והן דומות יותר זו לזו. ברמות גבוהות התמונות מוגדלות, ויש שתיים ושלוש מילים בבת אחת.',
      'אחרי כל תשובה מופיע השם של כל תמונה. אין שעון.'
    ],
    css: css,
    _levels: LEVELS,
    _makeRound: makeRound,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var find = spec.find || 1;
      var ROUNDS = find > 1 ? 6 : 8;
      var round = 0, score = 0;
      var used = {};

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: score, total: ROUNDS, note: 'מצאתם את התמונה הנכונה ב-' + score + ' מתוך ' + ROUNDS + ' לוחות' });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        play(makeRound(spec, used, ctx.shuffle));
      }

      function play(r) {
        root.innerHTML = '';
        var found = [];
        var done = false;
        var words = r.targets.map(function (t) { return el('span', { class: 'pp-word' }, t.w); });
        var rows = Math.ceil(r.photos.length / 2);
        var grid = el('div', { class: 'pp-grid' + (r.photos.length % 2 ? ' pp-odd' : ''),
          // square photos as big as the free height allows: header, status, words and gaps take about 300px
          style: { maxWidth: 'min(26rem, calc((100svh - ' + (find > 2 ? 340 : find > 1 ? 300 : 290) + 'px) * 2 / ' + rows + '))' } });
        var btns = r.photos.map(function (o) {
          var b = el('button', { class: 'pp-photo', type: 'button', 'aria-label': 'תמונה', onclick: function () { tap(o, b); } },
            el('img', { src: o.src, alt: '', draggable: 'false' }));
          if (spec.zoom) {
            b.style.setProperty('--pp-z', String(spec.zoom));
            b.style.setProperty('--pp-ox', (35 + Math.random() * 30).toFixed(0) + '%');
            b.style.setProperty('--pp-oy', (35 + Math.random() * 30).toFixed(0) + '%');
          }
          grid.appendChild(b);
          return { o: o, b: b };
        });
        root.appendChild(el('div', { class: 'pp-wrap' }, [el('div', { class: 'pp-words' + (find > 1 ? ' pp-many' : '') }, words), grid]));
        ctx.setStatus(find === 1 ? (spec.zoom ? 'איזו תמונה מוגדלת מתאימה למילה?' : 'איזו תמונה מתאימה למילה?')
          : 'מצאו ' + (find === 2 ? 'את שתי' : 'את שלוש') + ' התמונות, בכל סדר');

        function mark(b, ok) {
          b.classList.add(ok ? 'is-correct' : 'is-wrong');
          b.appendChild(el('span', { class: 'pp-mark', 'aria-hidden': 'true' }, ok ? '✓' : '✗'));
        }

        function tap(o, b) {
          if (done || b.disabled) return;
          var ti = r.targets.indexOf(o);
          if (ti !== -1) {
            ctx.sound('tap');
            b.disabled = true;
            mark(b, true);
            found.push(o);
            words[ti].classList.add('is-found');
            if (found.length < find) { ctx.setStatus('נכון! ' + (find - found.length === 1 ? 'עוד תמונה אחת' : 'עוד ' + (find - found.length) + ' תמונות')); return; }
            end(true, o);
            return;
          }
          mark(b, false);
          end(false, o);
        }

        function end(ok, last) { // last = the photo tapped last
          done = true;
          if (ok) score++;
          btns.forEach(function (x) {
            x.b.disabled = true;
            x.b.setAttribute('aria-label', x.o.w);
            if (r.targets.indexOf(x.o) !== -1 && found.indexOf(x.o) === -1) x.b.classList.add('is-missed');
            x.b.appendChild(el('span', { class: 'pp-name' }, x.o.w));
          });
          ctx.setStatus(ok ? 'מצוין! כך קוראים לכל התמונות' : 'התמונה הנכונה מסומנת במסגרת ירוקה');
          ctx.feedback(ok, ok ? undefined : 'בחרתם: ' + last.w).then(function () {
            if (ok) return ctx.wait(1200).then(nextRound);
            // after a miss the player looks at the names as long as they like
            // the button takes the place of the words (every photo now shows its name), so nothing moves down
            var next = el('button', { class: 'btn btn-primary', type: 'button', onclick: function () { next.disabled = true; nextRound(); } },
              round >= ROUNDS ? 'לסיכום' : 'הלאה');
            root.querySelector('.pp-words').replaceWith(next);
            try { next.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
          });
        }
      }

      nextRound();
      return function cleanup() { root.innerHTML = ''; };
    }
  });
})();
