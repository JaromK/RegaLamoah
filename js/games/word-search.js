/* תפזורת — find the hidden words in a grid of letters (language, attention). Tap the first letter of a word,
   then its last letter. Words run right-to-left, later also top-down, diagonally and backwards. Untimed. */
(function () {
  'use strict';

  var LETTERS = 'אבגדהוזחטיכלמנסעפצקרשת';
  var FINAL = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };

  // themes of our own, next to the photo-bank categories
  var EXTRA = {
    'ערים בארץ': 'ירושלים חיפה עכו צפת טבריה אילת נתניה חולון רמלה לוד ערד דימונה אשדוד אשקלון רחובות נהריה כרמיאל עפולה חדרה הרצליה',
    'צבעים': 'אדום כחול צהוב ירוק סגול כתום ורוד חום לבן שחור אפור תכלת זהב כסף',
    'מקצועות': 'רופא מורה נהג טבח שוטר חייל זמר צייר נגר חשמלאי אופה ספר גנן דוור אחות טייס שחקן סופר',
    'חגים ומועדים': 'פסח סוכות חנוכה פורים שבועות שבת ראש השנה כיפור מימונה סדר מצה סביבון לביבה',
    'בגוף שלנו': 'ראש יד רגל אף פה עין אוזן לב בטן גב כתף ברך מרפק אצבע שן לשון צוואר שיער'
  };
  var THEME_NAMES = { animal: 'בעלי חיים', fruit: 'פירות', veg: 'ירקות', food: 'אוכל ושתייה', home: 'דברים בבית',
    tool: 'כלי עבודה', vehicle: 'כלי תחבורה', nature: 'בטבע', clothes: 'לבוש ותכשיטים', music: 'כלי נגינה' };

  function themes() {
    var out = {};
    var bank = (window.PhotoBank && window.PhotoBank.items) || [];
    bank.forEach(function (it) {
      if (it.w.indexOf(' ') !== -1) return;
      var name = THEME_NAMES[it.cat] || it.label;
      (out[name] = out[name] || []).push(it.w);
    });
    Object.keys(EXTRA).forEach(function (k) {
      out[k] = EXTRA[k].split(' ').filter(function (w) { return w.length >= 2; });
    });
    return out;
  }

  /* Directions as [dRow, dCol]. The grid is shown right-to-left, so column 0 is the rightmost:
     [0, 1] reads like Hebrew (right to left). */
  var DIRS = {
    rtl: [0, 1], down: [1, 0], diag: [1, 1], diag2: [1, -1],
    ltr: [0, -1], up: [-1, 0], diagUp: [-1, -1], diagUp2: [-1, 1]
  };

  /* Level 1–50: n = grid size, words = how many to find, dirs = allowed directions, decoys = near-misses
     (a word with its last letter changed) hidden in the grid. */
  function spec(level) {
    var n = Math.min(10, 5 + Math.floor((level - 1) / 6));
    var words = Math.min(11, 3 + Math.floor(level / 4));
    var dirs = ['rtl'];
    if (level >= 6) dirs.push('down');
    if (level >= 14) dirs.push('diag', 'diag2');
    if (level >= 24) dirs.push('ltr');
    if (level >= 32) dirs.push('up');
    if (level >= 40) dirs.push('diagUp', 'diagUp2');
    return { n: n, words: words, dirs: dirs, decoys: level >= 36 ? Math.min(4, Math.floor((level - 32) / 4)) : 0,
      // long words first make the higher boards denser
      longFirst: level >= 20 };
  }

  function place(grid, n, word, dirs, rnd) {
    for (var t = 0; t < 300; t++) {
      var d = DIRS[rnd.pick(dirs)];
      var r = rnd.randInt(0, n - 1), c = rnd.randInt(0, n - 1);
      var er = r + d[0] * (word.length - 1), ec = c + d[1] * (word.length - 1);
      if (er < 0 || er >= n || ec < 0 || ec >= n) continue;
      var ok = true;
      for (var i = 0; i < word.length; i++) {
        var ch = grid[r + d[0] * i][c + d[1] * i];
        if (ch && ch !== word[i]) { ok = false; break; }
      }
      if (!ok) continue;
      var cells = [];
      for (var j = 0; j < word.length; j++) {
        grid[r + d[0] * j][c + d[1] * j] = word[j];
        cells.push((r + d[0] * j) * n + (c + d[1] * j));
      }
      return cells;
    }
    return null;
  }

  function makeBoard(sp, rnd) {
    var all = themes();
    var names = Object.keys(all).filter(function (k) {
      return all[k].filter(function (w) { return w.length <= sp.n && w.length >= 2; }).length >= sp.words;
    });
    for (var attempt = 0; attempt < 30; attempt++) {
      var theme = rnd.pick(names);
      var pool = rnd.shuffle(all[theme].filter(function (w) { return w.length <= sp.n && w.length >= 2; }));
      // shorter words on small boards keep them solvable; prefer 3+ letters
      pool.sort(function (a, b) { return (b.length >= 3) - (a.length >= 3); });
      var chosen = pool.slice(0, sp.words);
      if (sp.longFirst) chosen.sort(function (a, b) { return b.length - a.length; });
      var grid = [];
      for (var r = 0; r < sp.n; r++) { grid.push([]); for (var c = 0; c < sp.n; c++) grid[r].push(''); }
      var placed = [], fail = false;
      for (var i = 0; i < chosen.length; i++) {
        var cells = place(grid, sp.n, chosen[i], sp.dirs, rnd);
        if (!cells) { fail = true; break; }
        placed.push({ w: chosen[i], cells: cells });
      }
      if (fail) continue;
      for (var k = 0; k < sp.decoys; k++) {
        var base = rnd.pick(chosen);
        if (base.length < 3) continue;
        var fake = base.slice(0, -1) + rnd.pick(LETTERS.split('').filter(function (l) { return l !== base[base.length - 1]; }));
        place(grid, sp.n, fake, sp.dirs, rnd);
      }
      // filler: mostly letters from the words themselves, so the words do not stand out
      var bag = chosen.join('').split('').map(function (l) { return FINAL[l] || l; });
      for (var rr = 0; rr < sp.n; rr++) for (var cc = 0; cc < sp.n; cc++) {
        if (!grid[rr][cc]) grid[rr][cc] = rnd.randInt(1, 100) <= 60 ? rnd.pick(bag) : rnd.pick(LETTERS.split(''));
      }
      return { theme: theme, grid: grid, words: placed, n: sp.n };
    }
    return null;
  }

  var HUES = ['--c-blue', '--c-red', '--c-green', '--c-purple', '--c-yellow'];

  var css = [
    '.wsr-grid{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:2px;width:min(100%,calc(100svh - 19rem),30rem);',
    'aspect-ratio:1;direction:rtl;background:var(--line);border:3px solid var(--ink);border-radius:var(--radius-sm);overflow:hidden;touch-action:manipulation;}',
    '.wsr-cell{min-width:0;min-height:0;padding:0;border:0;background:var(--surface);color:var(--ink);font-family:var(--font-display);',
    'font-weight:900;font-size:calc(min(100vw - 2.5rem,30rem) / var(--n) * .6);line-height:1;cursor:pointer;display:grid;place-items:center;}',
    '.wsr-cell.is-start{background:var(--sun);color:var(--c-on-yellow);}',
    '.wsr-cell.is-found{color:#fff;}',
    '.wsr-cell.is-hint{box-shadow:inset 0 0 0 4px var(--sun);}',
    '.wsr-words{display:flex;flex-wrap:wrap;gap:.4rem .5rem;justify-content:center;max-width:30rem;margin:0;padding:0;list-style:none;}',
    '.wsr-words li{font-size:1.2rem;font-weight:800;padding:.15rem .7rem;border-radius:999px;background:var(--surface-2);border:2px solid var(--line);}',
    '.wsr-words li.is-found{text-decoration:line-through;color:#fff;border-color:transparent;}',
    '.wsr-theme{margin:0;font-size:1.2rem;font-weight:800;color:var(--language);}'
  ].join('');

  BrainGames.register({
    id: 'word-search',
    name: 'תפזורת',
    skill: 'language',
    isNew: true,
    tagline: 'מצאו את המילים שמסתתרות בין האותיות',
    benefit: 'סריקה חזותית, ריכוז ואוצר מילים',
    instructions: [
      'בלוח האותיות מסתתרות המילים שברשימה שמתחת ללוח.',
      'לחצו על האות הראשונה של מילה, ואז על האות האחרונה שלה. מילה שנמצאה נצבעת.',
      'בהתחלה המילים כתובות רק מימין לשמאל. בהמשך גם מלמעלה למטה, באלכסון ואפילו הפוך.',
      'אין שעון. תקועים? לחצו "רמז" ונסמן לכם אות ראשונה.'
    ],
    css: css,
    _model: { spec: spec, makeBoard: makeBoard },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = 2;
      var round = 0, good = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: good, total: ROUNDS, note: 'פתרתם ' + good + ' מתוך ' + ROUNDS + ' לוחות בלי עזרה (או עם רמז אחד)' });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var b = null;
        for (var t = 0; t < 5 && !b; t++) b = makeBoard(sp, ctx);
        play(b);
      }

      function play(B) {
        root.innerHTML = '';
        var n = B.n, start = -1, found = 0, hints = 0, done = false;
        var colorOf = {}; // cell → css var of the first word found through it
        var cells = [];
        for (var k = 0; k < n * n; k++) {
          (function (k) {
            cells.push(el('button', { class: 'wsr-cell', type: 'button', 'aria-label': B.grid[Math.floor(k / n)][k % n],
              onclick: function () { tap(k); } }, B.grid[Math.floor(k / n)][k % n]));
          })(k);
        }
        var grid = el('div', { class: 'wsr-grid', style: { '--n': n } }, cells);
        var chips = B.words.map(function (w) { return el('li', null, w.w); });
        var list = el('ul', { class: 'wsr-words' }, chips);
        var hintBtn = el('button', { class: 'btn btn-secondary', type: 'button', onclick: hint }, 'רמז');
        var showBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: reveal }, 'הראו את המילים');
        var actions = el('div', { class: 'g-actions' }, [hintBtn, showBtn]);
        root.appendChild(el('p', { class: 'wsr-theme' }, 'הנושא: ' + B.theme));
        root.appendChild(grid);
        root.appendChild(list);
        root.appendChild(actions);
        ctx.setStatus('לחצו על האות הראשונה של מילה, ואז על האחרונה');

        function line(a, b) {
          var r1 = Math.floor(a / n), c1 = a % n, r2 = Math.floor(b / n), c2 = b % n;
          var dr = Math.sign(r2 - r1), dc = Math.sign(c2 - c1);
          var len = Math.max(Math.abs(r2 - r1), Math.abs(c2 - c1));
          if ((r1 !== r2 && c1 !== c2 && Math.abs(r2 - r1) !== Math.abs(c2 - c1))) return null;
          var out = [];
          for (var i = 0; i <= len; i++) out.push((r1 + dr * i) * n + (c1 + dc * i));
          return out;
        }

        function tap(k) {
          if (done) return;
          if (start < 0) { start = k; cells[k].classList.add('is-start'); ctx.sound('tap'); ctx.setStatus('עכשיו לחצו על האות האחרונה של המילה'); return; }
          cells[start].classList.remove('is-start');
          if (k === start) { start = -1; ctx.setStatus('לחצו על האות הראשונה של מילה, ואז על האחרונה'); return; }
          var path = line(start, k);
          start = -1;
          var hit = null;
          // the letters decide, so a word that happens to appear twice counts wherever it is found
          var text = path ? path.map(function (c) { return B.grid[Math.floor(c / n)][c % n]; }).join('') : '';
          var back = text.split('').reverse().join('');
          if (path) B.words.forEach(function (w) {
            if (!hit && !w.found && (w.w === text || w.w === back)) { hit = w; w.cells = w.w === text ? path : path.slice().reverse(); }
          });
          if (!hit) {
            ctx.sound('bad');
            ctx.setStatus(path ? 'בין שתי האותיות האלה אין מילה מהרשימה. נסו שוב' : 'האותיות צריכות להיות באותה שורה, טור או אלכסון');
            return;
          }
          hit.found = true;
          found++;
          var hue = HUES[(found - 1) % HUES.length];
          hit.cells.forEach(function (c) {
            if (!colorOf[c]) colorOf[c] = hue;
            cells[c].classList.add('is-found');
            cells[c].classList.remove('is-hint');
            cells[c].style.background = 'var(' + colorOf[c] + ')';
            if (colorOf[c] === '--c-yellow') cells[c].style.color = 'var(--c-on-yellow)';
          });
          var chip = chips[B.words.indexOf(hit)];
          chip.classList.add('is-found');
          chip.style.background = 'var(' + hue + ')';
          if (hue === '--c-yellow') chip.style.color = 'var(--c-on-yellow)';
          ctx.sound('good');
          if (found === B.words.length) finishBoard();
          else ctx.setStatus('מצאתם: ' + hit.w + '. נשארו ' + (B.words.length - found));
        }

        function hint() {
          if (done) return;
          var w = B.words.filter(function (x) { return !x.found; })[0];
          if (!w) return;
          hints++;
          cells[w.cells[0]].classList.add('is-hint');
          ctx.setStatus('רמז: המילה "' + w.w + '" מתחילה במשבצת המסומנת');
        }

        function reveal() {
          if (done) return;
          hints = 99;
          B.words.forEach(function (w) {
            if (w.found) return;
            w.cells.forEach(function (c) { cells[c].classList.add('is-hint'); });
          });
          finishBoard();
        }

        function finishBoard() {
          done = true;
          cells.forEach(function (c) { c.disabled = true; });
          var ok = hints <= 1;
          if (ok) good++;
          ctx.setStatus(hints === 99 ? 'המילים שנשארו מסומנות' : ok ? 'מצאתם את כל המילים!' : 'מצאתם הכול, בעזרת רמזים');
          ctx.feedback(ok, hints === 99 ? 'הנה המילים' : undefined).then(function () {
            actions.innerHTML = '';
            var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { next.disabled = true; nextRound(); } },
              round >= ROUNDS ? 'לסיכום' : 'ללוח הבא');
            actions.appendChild(next);
          });
        }
      }

      nextRound();
    }
  });
})();
