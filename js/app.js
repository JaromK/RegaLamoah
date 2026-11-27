/*
 * רגע למוח — screens: welcome, home, instructions, game, results.
 */
(function () {
  'use strict';

  var BG = window.BrainGames;
  var U = BG.util;
  var el = U.el;
  var app = document.getElementById('app');

  var current = null; // { game, cleanup, active, daily }

  var PRAISE = ['נכון מאוד!', 'יפה מאוד!', 'מצוין!', 'כל הכבוד!', 'בדיוק!', 'איזה יופי!'];
  var ENCOURAGE = ['לא נורא, ממשיכים', 'כמעט! ננסה את הבא', 'זה בסדר, לומדים מכל ניסיון', 'קורה לכולם, ממשיכים בנחת'];

  var DAILY_THOUGHTS = [
    'המוח אוהב חידושים. גם הליכה במסלול חדש לשכונה היא אימון.',
    'שינה טובה עוזרת לזיכרון להתקבע. לילה טוב הוא חלק מהאימון.',
    'שתייה של מים לאורך היום עוזרת לריכוז.',
    'שיחה עם חבר או חברה מפעילה את המוח לא פחות ממשחק.',
    'טעויות הן חלק מהלמידה. כל ניסיון מחזק את המוח.',
    'עשר דקות ביום, כל יום, שוות יותר משעה פעם בשבוע.',
    'הליכה קלה של חצי שעה משפרת את זרימת הדם למוח.',
    'נסו היום לזכור רשימת קניות קצרה בלי לכתוב אותה.',
    'קריאה של כמה עמודים לפני השינה היא אימון מצוין לשפה.',
    'שירה של שיר מוכר מפעילה זיכרון, שפה ושמחה בבת אחת.',
    'נסו לכתוב היום כמה מילים ביד שאינה הדומיננטית.',
    'ארוחה עם ירקות, דגים ואגוזים טובה גם למוח.',
    'סקרנות שומרת על מוח צעיר. מה תרצו ללמוד השבוע?',
    'נשימה איטית ועמוקה לפני משחק עוזרת להתרכז.',
    'ספרו לבן משפחה על משהו שלמדתם היום. כך זוכרים טוב יותר.',
    'פאזל, תשבץ או משחק קלפים עם חברים הם אימון נהדר.',
    'אין צורך למהר. הדיוק חשוב יותר מהמהירות.',
    'נסו לזכור את שמות האנשים שפגשתם היום.',
    'צחוק משחרר מתח ועוזר למוח לעבוד טוב יותר.',
    'כל יום שאתם מתאמנים הוא הישג. כל הכבוד שאתם כאן.'
  ];

  var WEEKDAYS = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];


  /* ---------- helpers ---------- */
  function clear() {
    U.stopSpeaking();
    screenGame = null;
    document.body.classList.remove('is-playing', 'on-home', 'on-intro');
    app.innerHTML = '';
    window.scrollTo(0, 0);
  }

  // id: clamp to that game's own top level (a game may stop before BG.MAX_LEVEL, see GAME_API.md)
  function clampLevel(n, id) { return Math.max(BG.MIN_LEVEL, Math.min(id ? BG.maxLevelOf(id) : BG.MAX_LEVEL, n | 0)); }

  // a game may start new players lower than the usual level (its `startLevel`)
  function startLevel(id) {
    var g = BG.getGame(id);
    return g && g.startLevel ? clampLevel(g.startLevel, id) : BG.START_LEVEL;
  }

  function getLevel(id) {
    var lv = BG.state.levels[id];
    return typeof lv === 'number' ? clampLevel(lv, id) : startLevel(id);
  }

  // new players may still pick the warm-up levels below the starting level
  function getBest(id) {
    return Math.max(getLevel(id), BG.state.best[id] || startLevel(id));
  }

  function todayRecord() {
    return BG.state.history[U.dateKey()] || {};
  }

  function streakDays() {
    var count = 0;
    var d = new Date();
    // today counts if done; otherwise start from yesterday so the streak isn't "broken" mid-day
    if (!BG.state.history[U.dateKey(d)]) d.setDate(d.getDate() - 1);
    while (BG.state.history[U.dateKey(d)]) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  }

  function greeting() {
    var h = new Date().getHours();
    var g = h < 5 ? 'לילה טוב' : h < 12 ? 'בוקר טוב' : h < 17 ? 'צהריים טובים' : 'ערב טוב';
    return BG.state.name ? g + ', ' + BG.state.name : g;
  }

  function hebrewDate() {
    try {
      return new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' });
    } catch (e) { return U.dateKey(); }
  }

  // each category and each game has its own picture (emoji), on the category's soft colour
  var SKILL_EMOJI = { memory: '🧠', attention: '🎯', logic: '🧮', language: '💬', perception: '📐', executive: '🧭' };
  var GAME_ICONS = {
    'memory-pairs': '🃏', 'sequence-lights': '🚦', 'grid-memory': '🔲', 'mental-math': '➕', 'number-series': '📈', 'shop-change': '🪙',
    'odd-one-out': '🙃', 'color-word': '🎨', 'whats-new': '✨', 'shopping-list': '📝', 'face-names': '🙂', 'count-items': '🍏',
    'word-scramble': '🔀', 'proverbs': '📜', 'synonyms': '🤝', 'spot-difference': '🔎', 'clock-time': '🕰️', 'route-arrows': '↗️',
    'word-pairs': '🔗', 'symbol-search': '🔣', 'balance-scale': '⚖️', 'word-links': '🧷', 'mirror-image': '🪞', 'rotate-shape': '🔄',
    'ball-tower': '🔴', 'daily-order': '🗓️', 'middle-arrow': '➡️', 'unique-one': '⭐', 'follow-fish': '🐟', 'delivery-route': '🚚',
    'brain-shift': '🔃', 'bigger-sum': '🔼', 'split-evenly': '🍕', 'bumper-path': '🎱', 'fit-piece': '🧱', 'what-is-this': '❓',
    'photo-name': '🖼️', 'photo-pick': '📷', 'trios': '🎴', 'word-points': '💯', 'tangram': '🔷', 'nonogram': '🖌️', 'math-cages': '➗',
    'dot-trail': '✏️', 'story-recall': '📖', 'analogies': '🟰', 'paper-fold': '📄', 'cube-count': '🧊', 'word-search': '🔤',
    'kakuro': '🔢', 'seven-boom': '💥', 'gematria': '🔠', 'secret-message': '🔐', 'eretz-ir': '🌍', 'fractions': '🥧',
    'jigsaw': '🧩', 'pill-box': '💊', 'water-pour': '🫗', 'sliding-puzzle': '🟦', 'hanoi': '🗼', 'lights-out': '💡',
    'crossword': '✍️', 'guess-word': '💭', 'opposites': '☯️', 'who-lives-where': '🏘️', 'maze': '🌀', 'shadow-match': '👤',
    'target-number': '🏹', 'where-is-it': '🔑', 'phone-number': '📞', 'appointments': '📅', 'block-rows': '🟥', 'mystery': '🕵️',
    'code-breaker': '🔓'
  };
  function skillIcon(skill) {
    return el('span', { class: 'skill-icon skill-' + skill, 'aria-hidden': 'true' }, SKILL_EMOJI[skill] || '');
  }
  function gameIcon(g) {
    return el('span', { class: 'skill-icon skill-' + g.skill, 'aria-hidden': 'true' }, g.icon || GAME_ICONS[g.id] || SKILL_EMOJI[g.skill] || '');
  }

  function skillChip(skill) {
    return el('span', { class: 'chip skill-' + skill }, BG.SKILLS[skill].label);
  }

  function levelPill(level) {
    return el('span', { class: 'level-pill' }, 'רמה ' + level);
  }

  /* ---------- welcome (first visit) ---------- */
  function renderWelcome() {
    endCurrent();
    clear();
    document.body.classList.add('on-home');
    refreshScreen = null;
    var nameInput = el('input', {
      class: 'text-input', id: 'welcome-name', type: 'text', autocomplete: 'given-name',
      maxlength: '24', placeholder: 'לדוגמה: רותי', value: BG.state.name || ''
    });

    function sizeBtn(big, label) {
      var b = el('button', {
        class: 'size-option' + (big ? ' is-big' : '') + (!!BG.state.prefs.bigText === big ? ' is-selected' : ''),
        type: 'button', 'aria-pressed': !!BG.state.prefs.bigText === big ? 'true' : 'false',
        onclick: function () {
          BG.state.prefs.bigText = big; BG.save(); applyPrefs();
          Array.prototype.forEach.call(document.querySelectorAll('.size-option'), function (o) {
            var sel = o === b; o.classList.toggle('is-selected', sel); o.setAttribute('aria-pressed', sel ? 'true' : 'false');
          });
        }
      }, [el('span', { class: 'size-sample', 'aria-hidden': 'true' }, 'אבג'), el('span', null, label)]);
      return b;
    }

    var form = el('form', { class: 'welcome-form', onsubmit: function (e) {
      e.preventDefault();
      BG.state.name = nameInput.value.trim().slice(0, 24);
      BG.state.welcomed = true;
      BG.save();
      renderHome();
    } }, [
      el('label', { class: 'field-label', for: 'welcome-name' }, 'איך לקרוא לכם? (לא חובה)'),
      nameInput,
      el('p', { class: 'field-label' }, 'איזה גודל טקסט נוח לכם?'),
      el('div', { class: 'size-options' }, [sizeBtn(false, 'רגיל'), sizeBtn(true, 'גדול')]),
      el('div', { class: 'intro-actions' }, [
        el('button', { class: 'btn btn-primary btn-lg', type: 'submit' }, 'בואו נתחיל')
      ])
    ]);

    app.appendChild(el('section', { class: 'welcome' }, [
      el('span', { class: 'welcome-mark', 'aria-hidden': 'true' }),
      el('h1', { class: 'hero-title' }, 'שלום וברוכים הבאים!'),
      el('p', { class: 'hero-lead' },
        'כאן מתאמנים כמה דקות בכל יום במשחקים קצרים לזיכרון, לקשב, לחשיבה, לשפה, לתפיסה מרחבית ולתכנון. ' +
        'אין שעון ואין לחץ. כל משחק מתחיל בקלות ונעשה מאתגר יותר ככל שמצליחים.'),
      form
    ]));
    setTimeout(function () { try { nameInput.focus(); } catch (e) {} }, 50);
  }

  /* ---------- settings: one dialog for name, text, sound, clock and levels ---------- */
  var refreshScreen = null; // redraws home/instructions after a settings change; null mid-game
  var screenGame = null;    // the game on screen (intro, play, result): settings opens on its levels

  /* ---------- phone "back" button ----------
     Each screen keeps some extra history entries above the site's own one, so the phone's back button walks
     back inside the site: instructions / results: 1 (back → home); a game: 3 (back → "leave?", back again →
     the instructions, back again → home); the settings dialog adds 1 (back → it closes). Home has none, so
     back there leaves the site as usual.
     The entries are added when the player taps (opening a game, starting it, opening settings): Chrome on
     phones skips entries that a page adds without a tap, which made the second back leave the whole site. */
  var depth = 0;        // our entries in the history right now
  var want = 0;         // entries the screen on show should have
  var dialogEntry = 0;  // 1 while the settings dialog has its own entry
  var skipPop = 0;      // pops we caused ourselves (history.go)
  function setDepth(n) {
    want = n;
    n += dialogEntry;
    if (skipPop) return; // a jump back is under way: the popstate handler finishes the job
    if (depth > n) { var d = depth - n; depth = n; skipPop++; history.go(-d); return; }
    while (depth < n) { try { history.pushState({ rl: depth + 1 }, ''); depth++; } catch (e) { return; } }
  }
  window.addEventListener('popstate', function () {
    if (skipPop) { skipPop--; setDepth(want); return; }
    depth = Math.max(0, depth - 1);
    var dialog = document.querySelector('dialog.settings[open]');
    if (dialog && dialogEntry) { dialogEntry = 0; dialog.__byBack = true; dialog.close(); return; }
    if (current && current.active && current.onBack) { current.onBack(depth); return; }
    if (!document.body.classList.contains('on-home')) renderHome();
  });

  /* ---------- typing on a real keyboard ----------
     In every game, a letter or number key presses the on-screen button that shows the same letter or number
     (keypads, letter boards, number answers), Backspace presses ⌫, and Enter presses the game's one main button.
     An English keyboard layout types the Hebrew letter on the same key. Numbers of two digits can be typed too.
     Games that read the keyboard themselves (they call preventDefault) and text fields are left alone. */
  var EN_HE = { q: '/', w: "'", e: 'ק', r: 'ר', t: 'א', y: 'ט', u: 'ו', i: 'ן', o: 'ם', p: 'פ', a: 'ש', s: 'ד', d: 'ג', f: 'כ', g: 'ע',
    h: 'י', j: 'ח', k: 'ל', l: 'ך', ';': 'ף', z: 'ז', x: 'ס', c: 'ב', v: 'ה', b: 'נ', n: 'מ', m: 'צ', ',': 'ת', '.': 'ץ' };
  var FINAL_BASE = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
  var typed = '', typedTimer = null;
  function keyButtons() {
    return [].slice.call(document.querySelectorAll('.play-board button')).filter(function (b) {
      return !b.disabled && b.offsetParent !== null && !b.closest('[hidden]');
    });
  }
  function keyText(b) { return (b.textContent || '').replace(/\s+/g, ' ').trim(); }
  // the best button for a text: keypad-like buttons first, then the last one on the page (keypads are below boards)
  function buttonFor(text, list) {
    var hits = list.filter(function (b) { var t = keyText(b); return t === text || (text.length === 1 && FINAL_BASE[t] === text); });
    if (!hits.length) return null;
    var pads = hits.filter(function (b) { return /choice|key|pad|opt/.test(b.className) || /pad|kb|keys/.test(b.parentNode.className || ''); });
    return (pads.length ? pads : hits)[(pads.length ? pads : hits).length - 1];
  }
  function pressTyped(final) {
    var list = keyButtons(), exact = buttonFor(typed, list);
    var longer = list.some(function (b) { var t = keyText(b); return t.length > typed.length && t.indexOf(typed) === 0 && /^\d+$/.test(t); });
    if (exact && (final || !longer)) { exact.click(); typed = ''; return; }
    if (final || !longer) typed = '';
  }
  window.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || !current || !current.active) return;
    if (document.querySelector('dialog[open]')) return;
    var ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.tagName === 'SELECT' || ae.isContentEditable)) return;
    var k = e.key;
    if (k === 'Backspace' || k === 'Delete') {
      var del = keyButtons().filter(function (b) { return /⌫/.test(keyText(b)) || b.getAttribute('aria-label') === 'מחיקה'; }).pop();
      if (del) { e.preventDefault(); del.click(); }
      return;
    }
    if (k === 'Enter') {
      if (ae && ae.tagName === 'BUTTON') return; // the browser presses the focused button itself
      var main = keyButtons().filter(function (b) { return b.classList.contains('btn-primary'); });
      if (main.length === 1) { e.preventDefault(); main[0].click(); }
      return;
    }
    if (k.length !== 1) return;
    var ch = EN_HE[k.toLowerCase()] && !/[א-ת]/.test(k) ? EN_HE[k.toLowerCase()] : k;
    ch = FINAL_BASE[ch] || ch;
    if (/^\d$/.test(ch)) {
      // digits: wait a moment when a longer number could still be meant ("1" then "2" = 12)
      typed += ch; e.preventDefault();
      clearTimeout(typedTimer);
      pressTyped(false);
      if (typed) typedTimer = setTimeout(function () { pressTyped(true); }, 900);
      return;
    }
    if (!/[א-ת]/.test(ch)) return;
    var b = buttonFor(ch, keyButtons());
    if (b) { e.preventDefault(); b.click(); }
  });

  function optionGroup(label, options, value, onChange) {
    var buttons = options.map(function (o) {
      var b = el('button', {
        class: 'seg-option', type: 'button', 'aria-pressed': o.value === value ? 'true' : 'false',
        onclick: function () {
          buttons.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
          onChange(o.value);
        }
      }, o.label);
      return b;
    });
    return el('div', { class: 'seg', role: 'group', 'aria-label': label }, buttons);
  }

  function settingsSection(title, children) {
    return el('section', { class: 'settings-section' }, [el('h3', null, title)].concat(children));
  }

  // opts.gameId: open on this game's level picker
  function openSettings(opts) {
    opts = opts || {};
    if (document.querySelector('dialog.settings')) return;
    var p = BG.state.prefs;
    var games = BG.all();
    var gameId = opts.gameId || (screenGame && screenGame.id) || (games[0] && games[0].id);
    var dirty = false;

    var nameInput = el('input', {
      class: 'text-input', id: 'set-name', type: 'text', autocomplete: 'given-name',
      maxlength: '24', placeholder: 'לדוגמה: רותי', value: BG.state.name || '',
      oninput: function () { BG.state.name = nameInput.value.trim().slice(0, 24); BG.save(); dirty = true; }
    });

    var select = el('select', {
      class: 'select-input', id: 'set-game',
      onchange: function () { gameId = select.value; levelNote.textContent = ''; drawLevels(); }
    }, Object.keys(BG.SKILLS).map(function (skill) {
      var gs = games.filter(function (g) { return g.skill === skill; });
      if (!gs.length) return null;
      return el('optgroup', { label: BG.SKILLS[skill].label }, gs.map(function (g) {
        return el('option', { value: g.id, selected: g.id === gameId }, g.name);
      }));
    }));
    var levelNow = el('p', { class: 'level-now' });
    var pathWrap = el('div', { class: 'path-wrap' });
    var levelNote = el('p', { class: 'pick-note', 'aria-live': 'polite' });

    function drawLevels() {
      var lv = getLevel(gameId);
      levelNow.innerHTML = '';
      levelNow.appendChild(levelPill(lv));
      levelNow.appendChild(el('span', null, BG.stageOf(lv).name));
      pathWrap.innerHTML = '';
      pathWrap.appendChild(levelPath({
        level: lv, best: getBest(gameId), max: BG.maxLevelOf(gameId),
        onPick: function (picked) {
          var best = getBest(gameId);
          var name = BG.getGame(gameId).name;
          BG.state.levels[gameId] = picked;
          BG.save();
          dirty = true;
          levelNote.textContent = picked > best
            ? 'רמה ' + picked + ' נשמרה ל"' + name + '". עוד לא הגעתם אליה, זה יהיה אתגר. בהצלחה!'
            : 'רמה ' + picked + ' נשמרה ל"' + name + '".';
          drawLevels();
          // choosing a level is enough: save it and close the settings
          setTimeout(function () { if (dialog.open) dialog.close(); }, 250);
        }
      }));
      levelNote.hidden = !levelNote.textContent;
    }
    drawLevels();

    var levelSection = settingsSection('רמת משחק', [
      el('label', { class: 'settings-hint', for: 'set-game' }, 'בחרו משחק, ואז לחצו על הרמה שבה תרצו לשחק בו.'),
      select,
      levelNow,
      pathWrap,
      levelNote,
      el('p', { class: 'settings-hint' }, 'העיגול המלא הוא הרמה הנוכחית, והעיגולים המסומנים הם רמות שכבר הגעתם אליהן. הרמה עדיין עולה ויורדת לבד לפי ההצלחה.')
    ]);

    var dialog = el('dialog', { class: 'settings', 'aria-labelledby': 'settings-title' }, el('div', { class: 'settings-body' }, [
      el('div', { class: 'settings-head' }, [
        el('h2', { class: 'settings-title', id: 'settings-title' }, 'הגדרות'),
        el('button', { class: 'btn btn-quiet btn-sm', type: 'button', onclick: function () { dialog.close(); } }, 'סגירה')
      ]),
      settingsSection('השם שלי', [
        el('label', { class: 'settings-hint', for: 'set-name' }, 'איך לקרוא לכם? (לא חובה)'),
        nameInput
      ]),
      settingsSection('גודל טקסט', [
        optionGroup('גודל טקסט', [{ value: false, label: 'רגיל' }, { value: true, label: 'גדול' }], !!p.bigText,
          function (v) { p.bigText = v; BG.save(); applyPrefs(); })
      ]),
      settingsSection('צלילים', [
        optionGroup('צלילים', [{ value: true, label: 'פועל' }, { value: false, label: 'כבוי' }], !!p.sound,
          function (v) { p.sound = v; BG.save(); })
      ]),
      settingsSection('שעון', [
        optionGroup('שעון', [{ value: false, label: 'כבוי' }, { value: true, label: 'פועל' }], !!p.timer,
          function (v) { p.timer = v; BG.save(); }),
        // takes effect from the next game started, so a running round never changes mid-way
        el('p', { class: 'settings-hint' }, 'כשהשעון כבוי אין שום לחץ זמן. כשהוא פועל רואים כמה זמן עבר, וזמן הזכירה מוגבל. השינוי חל מהמשחק הבא.')
      ]),
      levelSection
    ]));

    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); }); // backdrop
    dialog.addEventListener('close', function () {
      dialog.remove();
      if (dialogEntry && !dialog.__byBack) { dialogEntry = 0; setDepth(want); } // closed by a tap: drop its entry
      if (dirty && refreshScreen) refreshScreen();
    });
    document.body.appendChild(dialog);
    dialog.showModal();
    dialogEntry = 1; setDepth(want); // opened by a tap: back closes it
    if (opts.gameId || screenGame) levelSection.scrollIntoView({ block: 'start' });
  }

  /* ---------- home ---------- */
  function weekStrip() {
    var today = new Date();
    var start = new Date(today);
    start.setDate(today.getDate() - today.getDay()); // Sunday
    var days = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(start); d.setDate(start.getDate() + i);
      var key = U.dateKey(d);
      var done = !!BG.state.history[key];
      var isToday = key === U.dateKey(today);
      var future = d > today && !isToday;
      days.push(el('li', {
        class: 'week-day' + (done ? ' is-done' : '') + (isToday ? ' is-today' : '') + (future ? ' is-future' : '')
      }, [
        el('span', { class: 'week-name' }, WEEKDAYS[i]),
        el('span', { class: 'week-dot', 'aria-hidden': 'true' }, done ? '✓' : String(d.getDate())),
        el('span', { class: 'sr-only' }, done ? 'התאמנתם' : 'לא התאמנתם')
      ]));
    }
    return el('div', { class: 'week' }, [
      el('h2', { class: 'week-title' }, 'השבוע שלי'),
      el('ol', { class: 'week-days' }, days)
    ]);
  }

  /* One card in the "all games" list (also used by the search results). */
  /* Games that live in their own app: the card opens that site. */
  var LINKED_GAMES = [
    { skill: 'logic', name: 'סודוקו', url: 'https://jaromk.github.io/Sudoku/',
      tagline: 'מלאו את הלוח במספרים 1 עד 9, בלי לחזור על מספר בשורה, בטור ובריבוע' }
  ];
  function linkCard(g) {
    return el('li', null, el('a', { class: 'game-card is-new is-link', href: g.url }, [
      el('span', { class: 'game-card-name' }, [g.name, el('span', { class: 'card-new' }, 'חדש')]),
      el('span', { class: 'game-card-tag' }, g.tagline),
      el('span', { class: 'card-link-note' }, 'נפתח באתר הסודוקו שלנו ←')
    ]));
  }

  function gameCard(g) {
    var lv = getLevel(g.id);
    return el('li', null, el('button', { class: 'game-card' + (g.isNew ? ' is-new' : ''), type: 'button', onclick: function () { renderIntro(g, false); } }, [
      el('span', { class: 'game-card-head' }, [gameIcon(g), el('span', { class: 'game-card-name' }, [
        g.name,
        g.isNew ? el('span', { class: 'card-new' }, 'חדש') : null,
        trophyKind(g.id) ? el('span', {
          class: 'card-trophy' + trophyClass(trophyKind(g.id)),
          title: 'זכיתם בגביע ה' + trophyInfo(trophyKind(g.id)).label, html: TROPHY_SVG
        }) : null
      ])]),
      el('span', { class: 'game-card-tag' }, g.tagline),
      el('span', { class: 'game-card-level' }, [
        levelPill(lv),
        el('span', { class: 'game-card-stage' }, BG.stageOf(lv).name)
      ]),
      el('span', { class: 'mini-bar', 'aria-hidden': 'true' },
        el('span', { class: 'mini-bar-fill', style: { width: Math.round(lv / BG.maxLevelOf(g.id) * 100) + '%' } }))
    ]));
  }

  /* ---------- game search ---------- */
  // Forgiving match: no niqqud, final letters = regular letters, no punctuation, any word order.
  // loose = also ignore ו and י (זכרון = זיכרון); used only when the exact spelling finds nothing.
  function searchKey(text, loose) {
    var t = String(text || '').toLowerCase().replace(/[֑-ׇ]/g, '');
    if (loose) t = t.replace(/[וי]/g, '');
    return t
      .replace(/ך/g, 'כ').replace(/ם/g, 'מ').replace(/ן/g, 'נ').replace(/ף/g, 'פ').replace(/ץ/g, 'צ')
      .replace(/["'״׳?!.,:;()\-–]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function findGames(query, loose) {
    var words = searchKey(query, loose).split(' ').filter(Boolean);
    if (!words.length) return [];
    var hits = [];
    BG.all().forEach(function (g) {
      var name = searchKey(g.name, loose);
      var all = [name, searchKey(g.tagline, loose), searchKey(BG.SKILLS[g.skill] && BG.SKILLS[g.skill].label, loose),
        searchKey(g.benefit, loose)].join(' ').split(' ');
      // each query word starts a word of the text, maybe after one prefix letter (וחשבון, השעה, לזכור…)
      function has(w) {
        return all.some(function (t) { return t.indexOf(w) === 0 || (t.indexOf(w) === 1 && 'בהולמשכ'.indexOf(t[0]) !== -1); });
      }
      if (!words.every(has)) return;
      // the name first: starts with the query, then contains it, then found elsewhere
      var q = words.join(' ');
      hits.push({ g: g, rank: name.indexOf(q) === 0 ? 0 : name.indexOf(q) !== -1 ? 1 : words.every(function (w) { return name.indexOf(w) !== -1; }) ? 2 : 3 });
    });
    if (!hits.length && !loose) return findGames(query, true); // other spelling (with/without ו, י)
    return hits.sort(function (a, b) { return a.rank - b.rank; }).map(function (h) { return h.g; });
  }
  function searchSection() {
    var results = el('ul', { class: 'game-grid search-results' });
    var note = el('p', { class: 'search-note', 'aria-live': 'polite' });
    var suggest = el('ul', { class: 'search-suggest', id: 'game-suggest', role: 'listbox', hidden: true });
    var input = el('input', {
      class: 'text-input search-input', id: 'game-search', type: 'search', autocomplete: 'off', enterkeyhint: 'search',
      placeholder: 'שם המשחק', role: 'combobox', 'aria-autocomplete': 'list', 'aria-controls': 'game-suggest', 'aria-expanded': 'false',
      oninput: show, onkeydown: keys, onblur: function () { setTimeout(hideSuggest, 150); }
    });
    // the drop-down: up to 8 games whose name fits what is typed so far; a tap opens the game
    var active = -1;
    function hideSuggest() { suggest.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; }
    function fillSuggest(q) {
      suggest.innerHTML = ''; active = -1;
      var key = searchKey(q);
      var list = BG.all().filter(function (g) { return searchKey(g.name).indexOf(key) !== -1; });
      if (!list.length) list = findGames(q);
      list.slice(0, 8).forEach(function (g) {
        suggest.appendChild(el('li', { role: 'option' }, el('button', { type: 'button', tabindex: '-1',
          onmousedown: function (e) { e.preventDefault(); }, onclick: function () { hideSuggest(); renderIntro(g, false); } },
          [gameIcon(g), el('span', null, g.name), el('small', null, BG.SKILLS[g.skill].label)])));
      });
      suggest.hidden = !suggest.children.length;
      input.setAttribute('aria-expanded', String(!suggest.hidden));
    }
    function keys(e) {
      var items = [].slice.call(suggest.querySelectorAll('button'));
      if (suggest.hidden || !items.length) return;
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        active = (active + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
        items.forEach(function (b, i) { b.classList.toggle('is-active', i === active); });
        items[active].scrollIntoView({ block: 'nearest' });
      } else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); items[active].click(); }
      else if (e.key === 'Escape') hideSuggest();
    }
    function show() {
      var q = input.value.trim();
      results.innerHTML = '';
      if (!q) { note.textContent = ''; hideSuggest(); return; }
      fillSuggest(q);
      var found = findGames(q);
      note.textContent = found.length
        ? (found.length === 1 ? 'נמצא משחק אחד' : 'נמצאו ' + found.length + ' משחקים')
        : 'לא נמצא משחק. נסו מילה אחרת.';
      found.forEach(function (g) { results.appendChild(gameCard(g)); });
    }
    var clearBtn = el('button', { class: 'btn btn-quiet btn-sm search-clear', type: 'button', 'aria-label': 'ניקוי החיפוש',
      onclick: function () { input.value = ''; show(); input.focus(); } }, 'ניקוי');
    var box = el('div', { class: 'search-box' }, [input, suggest]);
    return el('section', { class: 'section search' }, [
      el('h2', { class: 'section-title' }, el('label', { for: 'game-search' }, 'חיפוש משחק')),
      el('form', { class: 'search-row', role: 'search', onsubmit: function (e) { e.preventDefault(); hideSuggest(); input.blur(); } }, [box, clearBtn]),
      note,
      results
    ]);
  }

  function renderHome() {
    endCurrent();
    if (!BG.state.welcomed) { renderWelcome(); return; }
    setDepth(0);
    clear();
    document.body.classList.add('on-home');
    refreshScreen = renderHome;
    var daily = BG.dailyGames();
    var done = todayRecord();
    var doneCount = daily.filter(function (g) { return done[g.id]; }).length;
    var nextGame = daily.filter(function (g) { return !done[g.id]; })[0];
    var streak = streakDays();
    var totalDays = Object.keys(BG.state.history).length;
    var thoughtRng = U.makeRng(U.hashString('thought:' + U.dateKey()));

    var lead = doneCount === 0
      ? 'האימון של היום מחכה לכם: ' + daily.length + ' משחקים קצרים, כל אחד כשלוש דקות. מחר יחכו לכם משחקים אחרים.'
      : nextGame
        ? 'כבר שיחקתם ' + doneCount + ' מתוך ' + daily.length + ' משחקים היום. נשארו עוד קצת.'
        : 'השלמתם את האימון של היום. כל הכבוד!';

    var hero = el('section', { class: 'hero' }, [
      el('p', { class: 'eyebrow' }, hebrewDate()),
      el('h1', { class: 'hero-title' }, greeting()),
      el('p', { class: 'hero-lead' }, lead),
      el('div', { class: 'hero-actions' }, [
        nextGame
          ? el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { renderIntro(nextGame, true); } },
              doneCount === 0 ? 'התחילו את האימון של היום' : 'המשיכו: ' + nextGame.name)
          : el('div', { class: 'done-banner' }, 'נתראה מחר עם משחקים חדשים. בינתיים אפשר לשחק בחופשיות למטה.')
      ]),
      el('dl', { class: 'stats' }, [
        el('div', { class: 'stat' }, [el('dt', null, 'ימים ברצף'), el('dd', null, String(streak))]),
        el('div', { class: 'stat' }, [el('dt', null, 'ימי אימון בסך הכול'), el('dd', null, String(totalDays))]),
        el('div', { class: 'stat' }, [el('dt', null, 'הושלמו היום'), el('dd', null, doneCount + '/' + daily.length)])
      ])
    ]);

    var dailyList = el('ol', { class: 'daily-list' }, daily.map(function (g, i) {
      var isDone = !!done[g.id];
      return el('li', null, el('button', {
        class: 'daily-item' + (isDone ? ' is-done' : ''), type: 'button',
        onclick: function () { renderIntro(g, true); }
      }, [
        el('span', { class: 'daily-num', 'aria-hidden': 'true' }, isDone ? '✓' : String(i + 1)),
        gameIcon(g),
        el('span', { class: 'daily-text' }, [
          el('span', { class: 'daily-name' }, g.name),
          el('span', { class: 'daily-tag' }, g.tagline)
        ]),
        el('span', { class: 'daily-meta' }, [
          skillChip(g.skill),
          levelPill(getLevel(g.id)),
          isDone ? el('span', { class: 'sr-only' }, 'הושלם') : null
        ])
      ]));
    }));

    var allSection = el('section', { class: 'section' }, [
      el('h2', { class: 'section-title' }, 'כל המשחקים'),
      el('p', { class: 'section-lead' }, 'רוצים לשחק עוד? בחרו כל משחק שתרצו. בכל משחק יש ' + BG.MAX_LEVEL + ' רמות או יותר.'),
      el('div', { class: 'skill-groups' }, Object.keys(BG.SKILLS).map(function (skill) {
        // every game in its own skill group; new games (isNew) come first there and carry a "חדש" label
        var games = BG.all().filter(function (g) { return g.skill === skill; });
        games = games.filter(function (g) { return g.isNew; }).concat(games.filter(function (g) { return !g.isNew; }));
        if (!games.length) return null;
        var links = LINKED_GAMES.filter(function (g) { return g.skill === skill; });
        return el('div', { class: 'skill-group' }, [
          el('h3', { class: 'skill-group-title' }, [skillIcon(skill), BG.SKILLS[skill].label]),
          el('ul', { class: 'game-grid' }, links.map(linkCard).concat(games.map(gameCard)))
        ]);
      }))
    ]);

    app.appendChild(hero);
    app.appendChild(searchSection());
    app.appendChild(el('section', { class: 'section' }, [
      el('h2', { class: 'section-title' }, 'האימון של היום'),
      dailyList
    ]));
    app.appendChild(el('div', { class: 'home-pair' }, [
      weekStrip(),
      el('aside', { class: 'thought' }, [
        el('h2', { class: 'thought-title' }, 'מחשבה ליום'),
        el('p', { class: 'thought-text' }, U.pick(DAILY_THOUGHTS, thoughtRng))
      ])
    ]));
    // Best trophies first; each game shows its best trophy once.
    var won = BG.all().filter(function (g) { return trophyKind(g.id); }).sort(function (a, b) {
      return TROPHY_RANK[trophyKind(b.id)] - TROPHY_RANK[trophyKind(a.id)];
    });
    if (won.length) {
      // how many games reached each trophy (a game with diamond also counts for the trophies below it)
      var counts = BG.TROPHIES.slice().reverse().map(function (tr) {
        var n = BG.all().filter(function (g) {
          var k = trophyKind(g.id);
          return k && TROPHY_RANK[k] >= TROPHY_RANK[tr.kind] && (tr.kind === 'gold' || BG.maxLevelOf(g.id) >= tr.level);
        }).length;
        return el('span', null, [el('span', { class: 'trophy-icon' + trophyClass(tr.kind), html: TROPHY_SVG }), tr.label + ': ' + n]);
      });
      var atTop = won.some(function (g) { return trophyKind(g.id) === trophyForLevel(g.id, BG.maxLevelOf(g.id)); });
      app.appendChild(el('section', { class: 'section trophies' }, [
        el('h2', { class: 'section-title' }, 'הגביעים שלי'),
        el('p', { class: 'trophy-counts' }, counts),
        el('ul', { class: 'trophy-list' }, won.map(function (g) {
          var k = trophyKind(g.id);
          return el('li', { class: 'trophy-item' + trophyClass(k) }, [
            el('span', { class: 'trophy-icon' + trophyClass(k), html: TROPHY_SVG }),
            el('span', null, g.name),
            el('span', { class: 'trophy-kind' }, trophyInfo(k).label)
          ]);
        })),
        atTop ? el('p', { class: 'trophy-call' }, 'רוצים עוד רמות? התקשרו לירון.') : null
      ]));
    }
    app.appendChild(allSection);
    app.appendChild(el('section', { class: 'section tips' }, [
      el('h2', { class: 'section-title' }, 'איך זה עובד'),
      el('ul', { class: 'tips-list' }, [
        el('li', null, [el('strong', null, 'אין שעון. '), 'קחו את הזמן לחשוב. הדיוק חשוב יותר מהמהירות. מי שרוצה אתגר יכול להפעיל את השעון ב"הגדרות" למעלה.']),
        el('li', null, [el('strong', null, 'גביעים לאלופים. '), 'מי שמנצח במשחק ברמה 20 מקבל גביע כסף, ברמה 30 גביע זהב, ברמה 40 גביע פלטינה וברמה 50 גביע יהלום.']),
        el('li', null, [el('strong', null, BG.MAX_LEVEL + ' רמות בכל משחק, ובחלק מהמשחקים יותר. '), 'כשמצליחים עולים רמה, וכשקשה יורדים רמה. אפשר גם לבחור רמה בעצמכם ב"הגדרות".']),
        el('li', null, [el('strong', null, 'קצת בכל יום. '), 'עשר דקות ביום עדיפות על שעה פעם בשבוע.'])
      ]),
      el('button', { class: 'btn btn-quiet btn-sm', type: 'button', onclick: function () { openSettings(); } },
        'הגדרות: שם, טקסט, צלילים, שעון ורמות')
    ]));
  }

  /* ---------- level path ---------- */
  function levelPath(opts) {
    // opts: { level, best, selected, onPick, from }
    var max = opts.max || BG.MAX_LEVEL;
    return el('div', { class: 'path' }, BG.STAGES.filter(function (stage) { return stage.from <= max; }).map(function (stage) {
      var dots = [];
      for (var lv = stage.from; lv <= stage.to; lv++) {
        (function (lv) {
          var reached = lv <= opts.best;
          var cls = 'path-dot' +
            (reached ? ' is-reached' : '') +
            (lv === opts.level ? ' is-current' : '') +
            (opts.selected === lv ? ' is-selected' : '') +
            (opts.from === lv ? ' is-from' : '');
          if (opts.onPick) {
            dots.push(el('button', {
              class: cls, type: 'button', 'aria-pressed': opts.selected === lv ? 'true' : 'false',
              'aria-label': 'רמה ' + lv, onclick: function () { opts.onPick(lv); }
            }, String(lv)));
          } else {
            dots.push(el('span', { class: cls, 'aria-label': 'רמה ' + lv + (reached ? '' : ', עוד לא נפתחה') }, String(lv)));
          }
        })(lv);
      }
      var active = opts.level >= stage.from && opts.level <= stage.to;
      return el('div', { class: 'path-stage' + (active ? ' is-active' : '') }, [
        el('span', { class: 'path-stage-name' }, stage.name),
        el('span', { class: 'path-dots' }, dots)
      ]);
    }));
  }

  /* ---------- instructions ---------- */
  function renderIntro(game, daily) {
    endCurrent();
    clear();
    document.body.classList.add('on-intro');
    screenGame = game;
    setDepth(1);
    refreshScreen = function () { renderIntro(game, daily); };
    var level = getLevel(game.id);
    var speakText = game.name + '. ' + game.instructions.join(' ');

    var startBtn = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { startGame(game, daily, level); } },
      'התחלה ברמה ' + level);
    var speakBtn = el('button', { class: 'btn btn-secondary btn-sm', type: 'button', hidden: true, onclick: function () { U.speak(speakText); } }, 'הקראת ההוראות');
    function checkVoice() { if (U.canSpeak()) speakBtn.hidden = false; }
    checkVoice();
    if ('speechSynthesis' in window) window.speechSynthesis.addEventListener('voiceschanged', checkVoice, { once: true });

    /* Two parts: the description (intro-main) and the start panel (intro-side). On a wide screen they sit side by
       side, so the instructions and the start button are seen together; on a phone the start button stays pinned
       to the bottom of the screen while the instructions scroll. */
    app.appendChild(el('section', { class: 'intro' }, [
      el('div', { class: 'intro-main' }, [
        el('div', { class: 'intro-head' }, [
          gameIcon(game),
          el('div', null, [
            el('div', { class: 'intro-chips' }, [skillChip(game.skill), el('span', { class: 'level-pill' }, 'רמה ' + level + ' מתוך ' + BG.maxLevelOf(game.id))]),
            el('h1', { class: 'intro-title' }, game.name),
            el('p', { class: 'intro-tag' }, game.tagline)
          ])
        ]),
        el('div', { class: 'intro-sub-row' }, [el('h2', { class: 'intro-sub' }, 'איך משחקים'), speakBtn]),
        el('ol', { class: 'steps' }, game.instructions.map(function (s) { return el('li', null, s); })),
        game.benefit ? el('p', { class: 'benefit' }, [el('strong', null, 'מה זה מאמן: '), game.benefit]) : null,
        // games with levelPicker show the levels right here: tap one to play it
        game.levelPicker ? el('div', { class: 'intro-levels' }, [
          el('h2', { class: 'intro-levels-title' }, 'בחרו רמה'),
          levelPath({
            level: level, best: getBest(game.id), max: BG.maxLevelOf(game.id),
            onPick: function (picked) { BG.state.levels[game.id] = picked; BG.save(); renderIntro(game, daily); }
          })
        ]) : null
      ]),
      el('div', { class: 'intro-side' }, [
        game.levelPicker ? null : el('div', { class: 'level-box level-box-compact' }, [
          el('p', { class: 'level-now' }, [
            el('strong', null, 'הרמה שלכם:'),
            el('span', { class: 'level-pill' }, 'רמה ' + level + ' מתוך ' + BG.maxLevelOf(game.id)),
            el('span', null, BG.stageOf(level).name)
          ]),
          el('button', { class: 'btn btn-quiet btn-sm', type: 'button', onclick: function () { openSettings({ gameId: game.id }); } },
            'שינוי רמה')
        ]),
        el('div', { class: 'intro-actions intro-start' }, [startBtn]),
        el('div', { class: 'intro-back' }, [
          el('button', { class: 'btn btn-quiet', type: 'button', onclick: renderHome }, 'חזרה לדף הבית')
        ])
      ])
    ]));
  }

  /* ---------- game ---------- */
  function stopTimers(session) {
    session.intervals.forEach(function (id) { clearInterval(id); });
    session.intervals = [];
    if (session.unfit) { session.unfit(); session.unfit = null; }
  }

  /* Keep the round on one screen: shrink tile grids that would push the page past the
     viewport (never below 48px tiles), and scroll a newly shown button into view
     instead of leaving the player to look for it. Returns a stop function. */
  function fitToScreen(board) {
    var queued = false;
    var minTile = 56, gap = 10; // older players: keep targets roomy even when shrinking
    function fit() {
      queued = false;
      var grids = Array.prototype.slice.call(board.querySelectorAll('.g-grid'));
      grids.forEach(function (g) { g.style.maxWidth = ''; });
      var over = document.documentElement.scrollHeight - window.innerHeight;
      if (over > 0) {
        grids.forEach(function (g) {
          var cols = parseInt(window.getComputedStyle(g).getPropertyValue('--cols'), 10) || 4;
          var rows = Math.max(1, Math.ceil(g.children.length / cols));
          var w = g.getBoundingClientRect().width;
          var target = Math.max(cols * minTile + (cols - 1) * gap, w - (over / grids.length) * cols / rows);
          if (target < w) g.style.maxWidth = Math.floor(target) + 'px';
        });
      }
      var buttons = board.querySelectorAll('button:not([disabled])');
      var last = buttons[buttons.length - 1];
      if (last && last.getBoundingClientRect().bottom > window.innerHeight) {
        last.scrollIntoView({ block: 'end', behavior: 'smooth' });
      }
    }
    function queue() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(fit);
    }
    var observer = new MutationObserver(queue);
    observer.observe(board, { childList: true, subtree: true });
    window.addEventListener('resize', queue);
    queue();
    return function () { observer.disconnect(); window.removeEventListener('resize', queue); };
  }

  function formatTime(ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  function endCurrent() {
    if (current) {
      current.active = false;
      stopTimers(current);
      if (typeof current.cleanup === 'function') { try { current.cleanup(); } catch (e) { console.error(e); } }
      current = null;
    }
  }

  function startGame(game, daily, level) {
    endCurrent();
    clear();
    screenGame = game;
    setDepth(3); // back → "leave?", back → instructions, back → home
    refreshScreen = null;
    level = clampLevel(level || getLevel(game.id), game.id);
    var timed = !!BG.state.prefs.timer;
    var session = { game: game, active: true, daily: daily, cleanup: null, intervals: [], startedAt: Date.now() };
    current = session;

    var clock = el('span', { class: 'play-clock', hidden: !timed, 'aria-label': 'זמן שעבר' }, '0:00');
    if (timed) {
      session.intervals.push(setInterval(function () {
        clock.textContent = formatTime(Date.now() - session.startedAt);
      }, 1000));
    }

    var progressText = el('span', { class: 'play-progress' }, '');
    var progressBar = el('span', { class: 'play-bar-fill' });
    var status = el('p', { class: 'play-status' }, '');
    var board = el('div', { class: 'play-board' });
    var toast = el('div', { class: 'toast', role: 'status', hidden: true });

    // both leave the round, so both ask first; "exit" goes back to the instructions, the house to home
    var leaveTo = null;
    function askLeave(target) { leaveTo = target; confirmBox.hidden = false; exitBtn.hidden = true; homeBtn.hidden = true; }
    function keepPlaying() { confirmBox.hidden = true; exitBtn.hidden = false; homeBtn.hidden = false; setDepth(3); }
    // the phone's back button: first it asks "leave?"; pressed again, it leaves the game for its instructions
    session.onBack = function (left) {
      if (confirmBox.hidden && left >= 1) askLeave('intro');
      else if (left >= 1) renderIntro(game, daily);
      else renderHome();
    };
    var exitBtn = el('button', { class: 'btn btn-quiet btn-sm', type: 'button', onclick: function () { askLeave('intro'); } }, 'יציאה');
    var homeBtn = el('button', {
      class: 'btn btn-quiet btn-sm play-settings', type: 'button', 'aria-label': 'לדף הבית', title: 'לדף הבית',
      html: document.querySelector('#btn-home svg').outerHTML, onclick: function () { askLeave('home'); }
    });
    var confirmBox = el('div', { class: 'confirm', hidden: true, role: 'group', 'aria-label': 'יציאה מהמשחק' }, [
      el('span', null, 'לצאת מהמשחק? הסיבוב הזה לא יישמר.'),
      el('span', { class: 'confirm-actions' }, [
        el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: keepPlaying }, 'להמשיך לשחק'),
        el('button', { class: 'btn btn-quiet btn-sm', type: 'button', onclick: function () { if (leaveTo === 'home') renderHome(); else renderIntro(game, daily); } }, 'כן, לצאת')
      ])
    ]);

    // the top bar is hidden while playing, so settings stay reachable from the game header
    var settingsBtn = el('button', {
      class: 'btn btn-quiet btn-sm play-settings', type: 'button', 'aria-label': 'הגדרות', title: 'הגדרות',
      html: document.querySelector('#btn-settings svg').outerHTML, onclick: function () { openSettings({ gameId: game.id }); }
    });
    var head = el('div', { class: 'play-head' }, [
      el('div', { class: 'play-title' }, [gameIcon(game), el('span', { class: 'play-name' }, game.name)]),
      homeBtn,
      settingsBtn,
      exitBtn
    ]);

    document.body.classList.add('is-playing');
    app.appendChild(el('section', { class: 'play' }, [
      head,
      confirmBox,
      el('div', { class: 'play-progress-row' }, [
        el('span', { class: 'play-bar', 'aria-hidden': 'true' }, progressBar),
        progressText,
        levelPill(level), // here rather than beside the name, which needs the room next to the home/settings/exit buttons
        clock
      ]),
      status,
      board,
      toast
    ]));
    session.unfit = fitToScreen(board);

    function guard(fn) {
      return function () { if (session.active) return fn.apply(null, arguments); };
    }

    var ctx = {
      level: level,
      timed: timed,
      /* Timer mode only: a countdown bar above `button`'s row that presses it when time runs out.
         With the timer off (the default) it does nothing and the player sets the pace. */
      studyTimer: function (button, ms) {
        if (!timed || !session.active || !button) return function () {};
        var fill = el('span', { class: 'study-timer-fill' });
        var label = el('span', { class: 'study-timer-label' }, '');
        var wrap = el('div', { class: 'study-timer', role: 'timer' }, [el('span', { class: 'study-timer-bar', 'aria-hidden': 'true' }, fill), label]);
        var row = button.parentNode && button.parentNode !== board ? button.parentNode : button;
        if (row.parentNode) row.parentNode.insertBefore(wrap, row);
        var end = Date.now() + ms;
        var id = null;
        function stop() {
          if (id !== null) { clearInterval(id); id = null; }
          wrap.remove();
          button.removeEventListener('click', stop);
        }
        function tick() {
          var left = end - Date.now();
          fill.style.width = Math.max(0, left / ms * 100) + '%';
          label.textContent = 'נותרו ' + Math.max(0, Math.ceil(left / 1000)) + ' שניות';
          if (left <= 0) {
            stop();
            if (session.active && button.isConnected && !button.disabled) button.click();
          }
        }
        button.addEventListener('click', stop);
        id = setInterval(tick, 200);
        session.intervals.push(id);
        tick();
        return stop;
      },
      el: el,
      shuffle: function (a) { return U.shuffle(a); },
      randInt: function (a, b) { return U.randInt(a, b); },
      pick: function (a) { return U.pick(a); },
      /* n items of pool that this game has not used lately (people's names, animals, stories): the ones used
         longest ago come first, so the same level and the next levels bring different ones and nothing gets
         mixed up with the game before. kind names the list; keyOf gives a short key for an item. */
      fresh: function (kind, pool, n, keyOf) {
        keyOf = keyOf || function (x) { return typeof x === 'object' ? JSON.stringify(x) : String(x); };
        var all = BG.state.recent || (BG.state.recent = {});
        var id = game.id + ':' + kind, mem = all[id] || [];
        var rank = function (x) { return mem.indexOf(keyOf(x)); }; // -1 = not used lately; small = used long ago
        var out = U.shuffle(pool.slice()).sort(function (a, b) { return rank(a) - rank(b); }).slice(0, n);
        out.forEach(function (x) { var k = keyOf(x), j = mem.indexOf(k); if (j >= 0) mem.splice(j, 1); mem.push(k); });
        var cap = Math.max(n, Math.floor(pool.length * 0.8));
        all[id] = mem.slice(Math.max(0, mem.length - cap));
        BG.save();
        return out;
      },
      isActive: function () { return session.active; },
      wait: function (ms) {
        return new Promise(function (resolve) {
          setTimeout(function () { if (session.active) resolve(); }, ms);
        });
      },
      /* After a mistake: keep the explanation on screen and wait for the player to tap "הבנתי, ממשיכים"
         instead of moving on by itself. Resolves when tapped. */
      next: function (label) {
        return new Promise(function (resolve) {
          if (!session.active) return;
          var b = el('button', { class: 'btn btn-primary btn-lg g-next', type: 'button', onclick: function () {
            b.remove(); if (session.active) resolve();
          } }, label || 'הבנתי, ממשיכים');
          board.appendChild(b);
          setTimeout(function () { try { b.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (e) {} }, 50);
        });
      },
      setProgress: guard(function (cur, total) {
        if (window.scrollY > 0) window.scrollTo({ top: 0, behavior: 'smooth' }); // each round starts at the top
        progressText.textContent = 'שלב ' + cur + ' מתוך ' + total;
        progressBar.style.width = Math.round(((cur - 1) / total) * 100) + '%';
      }),
      setStatus: guard(function (text) { status.textContent = text || ''; }),
      sound: function (kind, note) { if (session.active) U.playSound(kind, note); },
      feedback: function (ok, message) {
        if (!session.active) return new Promise(function () {});
        U.playSound(ok ? 'good' : 'bad');
        toast.textContent = message || U.pick(ok ? PRAISE : ENCOURAGE);
        toast.className = 'toast ' + (ok ? 'is-good' : 'is-bad');
        toast.hidden = false;
        return ctx.wait(1500).then(function () { toast.hidden = true; });
      },
      finish: guard(function (result) {
        session.active = false;
        stopTimers(session);
        if (typeof session.cleanup === 'function') { try { session.cleanup(); } catch (e) { console.error(e); } }
        current = null;
        renderResult(game, daily, level, result || { correct: 0, total: 0 }, timed ? Date.now() - session.startedAt : null);
      })
    };

    try {
      session.cleanup = game.start(board, ctx) || null;
    } catch (e) {
      console.error(e);
      board.appendChild(el('p', { class: 'error' }, 'אירעה תקלה בטעינת המשחק. נסו לחזור לדף הבית ולבחור שוב.'));
    }
  }

  /* ---------- celebration ---------- */
  function confetti() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var canvas = el('canvas', { class: 'confetti', 'aria-hidden': 'true' });
    document.body.appendChild(canvas);
    var c = canvas.getContext('2d');
    var w = canvas.width = window.innerWidth;
    var h = canvas.height = window.innerHeight;
    var styles = getComputedStyle(document.documentElement);
    var colors = ['--sun', '--accent', '--memory', '--attention', '--logic', '--language'].map(function (v) {
      return styles.getPropertyValue(v).trim() || '#f2b33d';
    });
    var parts = [];
    for (var i = 0; i < 120; i++) {
      parts.push({
        x: Math.random() * w, y: -20 - Math.random() * h * 0.5,
        vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3,
        r: 5 + Math.random() * 6, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.2,
        color: colors[i % colors.length]
      });
    }
    var start = performance.now();
    function frame(t) {
      c.clearRect(0, 0, w, h);
      parts.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.rot += p.vr;
        c.save(); c.translate(p.x, p.y); c.rotate(p.rot);
        c.fillStyle = p.color; c.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2);
        c.restore();
      });
      if (t - start < 3200) requestAnimationFrame(frame);
      else canvas.remove();
    }
    requestAnimationFrame(frame);
  }

  /* ---------- results ---------- */
  var TROPHY_SVG =
    '<svg viewBox="0 0 64 64" aria-hidden="true">' +
    '<path class="tr-cup" d="M18 8h28v14c0 9-6 16-14 16S18 31 18 22z"/>' +
    '<path class="tr-handle" d="M18 12H9v4c0 7 5 11 10 11M46 12h9v4c0 7-5 11-10 11" fill="none" stroke-width="4" stroke-linecap="round"/>' +
    '<rect class="tr-cup" x="29" y="37" width="6" height="10"/>' +
    '<rect class="tr-base" x="20" y="47" width="24" height="8" rx="2"/>' +
    '<path class="tr-star" d="M32 14l2.4 4.9 5.4.8-3.9 3.8.9 5.4-4.8-2.6-4.8 2.6.9-5.4-3.9-3.8 5.4-.8z"/>' +
    '</svg>';

  var TROPHY_RANK = { silver: 1, gold: 2, platinum: 3, diamond: 4 };
  function trophyInfo(kind) {
    for (var i = 0; i < BG.TROPHIES.length; i++) if (BG.TROPHIES[i].kind === kind) return BG.TROPHIES[i];
    return BG.TROPHIES[0];
  }
  function trophyClass(kind) { return kind === 'gold' ? '' : ' is-' + kind; }

  // the trophy won by winning `level` in a game, or null
  function trophyForLevel(id, level) {
    var top = BG.maxLevelOf(id);
    // a game that stops at level 20 gives its gold trophy there (no silver step)
    if (level === top && top <= BG.SILVER_LEVEL) return 'gold';
    for (var i = 0; i < BG.TROPHIES.length; i++) if (BG.TROPHIES[i].level === level && level <= top) return BG.TROPHIES[i].kind;
    return null;
  }

  // 'diamond', 'platinum', 'gold', 'silver' or null: the best trophy won in a game
  function trophyKind(id) {
    var t = BG.state.trophies[id];
    if (!t) return null;
    var best = null;
    Object.keys(TROPHY_RANK).forEach(function (k) {
      if (!t[k]) return;
      // in a game that stops at level 20, winning 20 is its top: that counts as gold
      var kk = k === 'silver' && BG.maxLevelOf(id) <= BG.SILVER_LEVEL ? 'gold' : k;
      if (!best || TROPHY_RANK[kk] > TROPHY_RANK[best]) best = kk;
    });
    return best;
  }

  function trophyCard(game, kind, level) {
    var info = trophyInfo(kind);
    var top = BG.maxLevelOf(game.id);
    var next = BG.TROPHIES.filter(function (t) { return t.level > level && t.level <= top; })[0];
    return el('div', { class: 'trophy-card' + trophyClass(kind) }, [
      el('span', { class: 'trophy-icon' + trophyClass(kind), html: TROPHY_SVG }),
      el('div', { class: 'trophy-text' }, level >= top ? [
        el('h2', { class: 'trophy-title' }, 'זכיתם בגביע ה' + info.label + '!'),
        el('p', null, 'ניצחתם ברמה ' + top + ', הרמה הגבוהה ביותר ב"' + game.name + '". הישג מרשים במיוחד.'),
        el('p', { class: 'trophy-call' }, 'רוצים עוד רמות? התקשרו לירון.')
      ] : [
        el('h2', { class: 'trophy-title' }, 'זכיתם בגביע ה' + info.label + '!'),
        el('p', null, 'ניצחתם ברמה ' + level + ' ב"' + game.name + '". הישג מרשים!'),
        next ? el('p', null, 'הגביע הבא: ' + next.label + ', ברמה ' + next.level + '.') : null
      ])
    ]);
  }

  function renderResult(game, daily, playedLevel, result, elapsedMs) {
    clear();
    screenGame = game;
    setDepth(Math.max(1, depth - dialogEntry)); // back → home (the game's entries are reused; nothing is added without a tap)
    refreshScreen = null;
    var correct = Math.max(0, result.correct | 0);
    var total = Math.max(0, result.total | 0);
    var acc = total ? correct / total : 0;
    var newLevel = playedLevel;
    var top = BG.maxLevelOf(game.id);
    if (acc >= 0.85) newLevel = Math.min(top, playedLevel + 1);
    else if (acc < 0.5) newLevel = Math.max(BG.MIN_LEVEL, playedLevel - 1);

    var oldBest = getBest(game.id);
    var oldStage = BG.stageOf(playedLevel);
    var newStage = BG.stageOf(newLevel);
    // Winning level 20, 30, 40 or 50 earns silver, gold, platinum or diamond
    // (each once per game; replays still show the card)
    var won = acc >= 0.85;
    var wonTop = playedLevel === top && won;
    var trophyWon = won ? trophyForLevel(game.id, playedLevel) : null;
    if (trophyWon) {
      var tr = BG.state.trophies[game.id] || {};
      if (!tr[trophyWon]) tr[trophyWon] = U.dateKey();
      BG.state.trophies[game.id] = tr;
    }

    BG.state.levels[game.id] = newLevel;
    BG.state.best[game.id] = Math.max(oldBest, newLevel);
    var dk = U.dateKey();
    BG.state.history[dk] = BG.state.history[dk] || {};
    BG.state.history[dk][game.id] = { correct: correct, total: total, level: playedLevel };
    BG.save();
    U.playSound('done');

    var leveledUp = newLevel > playedLevel;
    var headline = acc >= 0.85 ? 'מצוין!' : acc >= 0.6 ? 'עבודה טובה!' : 'כל הכבוד על ההתמדה!';
    var levelMsg;
    if (wonTop) levelMsg = 'סיימתם בהצלחה את רמה ' + top + '!';
    else if (leveledUp && newStage !== oldStage) levelMsg = 'עליתם לרמה ' + newLevel + ' ונכנסתם לשלב חדש: ' + newStage.name + '!';
    else if (leveledUp && newLevel === top) levelMsg = 'הגעתם לרמה הגבוהה ביותר, ' + top + '. מדהים!';
    else if (leveledUp) levelMsg = 'עליתם לרמה ' + newLevel + '. בפעם הבאה יהיה קצת יותר מאתגר.';
    else if (newLevel < playedLevel) levelMsg = 'בפעם הבאה נשחק ברמה ' + newLevel + ', כדי שיהיה נוח יותר. זה חלק טבעי מהאימון.';
    else levelMsg = 'נשארים ברמה ' + newLevel + '. עוד קצת תרגול ותעלו רמה.';

    var daily4 = BG.dailyGames();
    var done = todayRecord();
    var nextDaily = daily ? daily4.filter(function (g) { return !done[g.id]; })[0] : null;

    var actions = [];
    if (daily && nextDaily) {
      actions.push(el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { renderIntro(nextDaily, true); } }, 'למשחק הבא: ' + nextDaily.name));
    } else if (daily) {
      actions.push(el('div', { class: 'done-banner' }, 'סיימתם את כל האימון של היום! נתראה מחר עם משחקים חדשים.'));
    }
    // "play again" uses the saved level, so a level picked in settings after the round counts
    var againBtn = el('button', { class: 'btn ' + (actions.length ? 'btn-secondary' : 'btn-primary btn-lg'), type: 'button',
      onclick: function () { startGame(game, daily, getLevel(game.id)); } }, 'לשחק שוב (רמה ' + newLevel + ')');
    // the player may pick the next level here: − / + change the saved level, "play again" uses it
    var pickNum = el('span', { class: 'result-pick-num', 'aria-live': 'polite' });
    var minusBtn = el('button', { class: 'btn btn-secondary result-pick-btn', type: 'button', 'aria-label': 'רמה אחת פחות', onclick: function () { stepLevel(-1); } }, '−');
    var plusBtn = el('button', { class: 'btn btn-secondary result-pick-btn', type: 'button', 'aria-label': 'רמה אחת יותר', onclick: function () { stepLevel(1); } }, '+');
    function showPick() {
      var lv = getLevel(game.id);
      pickNum.textContent = String(lv);
      minusBtn.disabled = lv <= BG.MIN_LEVEL; plusBtn.disabled = lv >= top;
      againBtn.textContent = 'לשחק שוב (רמה ' + lv + ')';
    }
    function stepLevel(d) {
      var lv = Math.max(BG.MIN_LEVEL, Math.min(top, getLevel(game.id) + d));
      BG.state.levels[game.id] = lv; BG.save();
      showPick();
    }
    actions.push(el('div', { class: 'result-pick', role: 'group', 'aria-label': 'בחירת הרמה הבאה' }, [
      el('span', { class: 'result-pick-label' }, 'הרמה הבאה:'), plusBtn, pickNum, minusBtn
    ]));
    actions.push(againBtn);
    showPick();
    refreshScreen = showPick;
    actions.push(el('button', { class: 'btn btn-quiet', type: 'button', onclick: renderHome }, 'לדף הבית'));

    app.appendChild(el('section', { class: 'result' }, [
      gameIcon(game),
      el('h1', { class: 'result-title' }, headline),
      el('p', { class: 'result-score' }, [
        'עניתם נכון על ',
        el('strong', null, String(correct)),
        ' מתוך ',
        el('strong', null, String(total))
      ]),
      el('div', { class: 'meter', role: 'img', 'aria-label': Math.round(acc * 100) + ' אחוז הצלחה' },
        el('span', { class: 'meter-fill', style: { width: Math.round(acc * 100) + '%' } })),
      result.note ? el('p', { class: 'result-note' }, result.note) : null,
      elapsedMs !== null && elapsedMs !== undefined ? el('p', { class: 'result-time' }, 'זמן המשחק: ' + formatTime(elapsedMs)) : null,
      trophyWon ? trophyCard(game, trophyWon, playedLevel) : null,
      el('p', { class: 'result-level' + (leveledUp || wonTop ? ' is-up' : '') }, levelMsg),
      el('div', { class: 'result-actions' }, actions)
    ]));

    if (leveledUp || wonTop) confetti();
  }

  /* ---------- top bar ---------- */
  function applyPrefs() {
    document.documentElement.classList.toggle('big-text', !!BG.state.prefs.bigText);
  }

  document.getElementById('btn-settings').addEventListener('click', function () { openSettings(); });
  document.getElementById('brand-home').addEventListener('click', renderHome);
  document.getElementById('btn-home').addEventListener('click', renderHome);

  applyPrefs();
  renderHome();
})();
