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

  var SKILL_ICONS = {
    memory: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="6" y="10" width="16" height="22" rx="3"/><rect x="26" y="16" width="16" height="22" rx="3"/></svg>',
    attention: '<svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="15" fill="none" stroke-width="4"/><circle cx="24" cy="24" r="6"/></svg>',
    logic: '<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="21" y="8" width="6" height="32" rx="3"/><rect x="8" y="21" width="32" height="6" rx="3"/></svg>',
    language: '<svg viewBox="0 0 48 48" aria-hidden="true"><text x="24" y="36" text-anchor="middle" font-size="32" font-weight="800" font-family="Frank Ruhl Libre, serif">א</text></svg>'
  };

  /* ---------- helpers ---------- */
  function clear() {
    U.stopSpeaking();
    app.innerHTML = '';
    window.scrollTo(0, 0);
  }

  function clampLevel(n) { return Math.max(BG.MIN_LEVEL, Math.min(BG.MAX_LEVEL, n | 0)); }

  function getLevel(id) {
    var lv = BG.state.levels[id];
    return typeof lv === 'number' ? clampLevel(lv) : BG.START_LEVEL;
  }

  // new players may still pick the warm-up levels below the starting level
  function getBest(id) {
    return Math.max(getLevel(id), BG.state.best[id] || BG.START_LEVEL);
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

  function skillIcon(skill) {
    return el('span', { class: 'skill-icon skill-' + skill, html: SKILL_ICONS[skill] });
  }

  function skillChip(skill) {
    return el('span', { class: 'chip skill-' + skill }, BG.SKILLS[skill].label);
  }

  function levelPill(level) {
    return el('span', { class: 'level-pill' }, 'רמה ' + level);
  }

  /* ---------- welcome (first visit) ---------- */
  function renderWelcome(isEdit) {
    endCurrent();
    clear();
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
        el('button', { class: 'btn btn-primary btn-lg', type: 'submit' }, isEdit ? 'שמירה' : 'בואו נתחיל'),
        isEdit ? el('button', { class: 'btn btn-quiet', type: 'button', onclick: renderHome }, 'ביטול') : null
      ])
    ]);

    app.appendChild(el('section', { class: 'welcome' }, [
      el('span', { class: 'welcome-mark', 'aria-hidden': 'true' }),
      el('h1', { class: 'hero-title' }, isEdit ? 'ההגדרות שלי' : 'שלום וברוכים הבאים!'),
      isEdit ? null : el('p', { class: 'hero-lead' },
        'כאן מתאמנים כמה דקות בכל יום במשחקים קצרים לזיכרון, לקשב, לחשיבה ולשפה. ' +
        'אין שעון ואין לחץ. כל משחק מתחיל בקלות ונעשה מאתגר יותר ככל שמצליחים.'),
      form
    ]));
    if (!isEdit) setTimeout(function () { try { nameInput.focus(); } catch (e) {} }, 50);
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

  function renderHome() {
    endCurrent();
    if (!BG.state.welcomed) { renderWelcome(false); return; }
    clear();
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
        skillIcon(g.skill),
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
      el('p', { class: 'section-lead' }, 'רוצים לשחק עוד? בחרו כל משחק שתרצו. בכל משחק יש ' + BG.MAX_LEVEL + ' רמות.'),
      el('div', { class: 'skill-groups' }, Object.keys(BG.SKILLS).map(function (skill) {
        var games = BG.all().filter(function (g) { return g.skill === skill; });
        if (!games.length) return null;
        return el('div', { class: 'skill-group' }, [
          el('h3', { class: 'skill-group-title' }, [skillIcon(skill), BG.SKILLS[skill].label]),
          el('ul', { class: 'game-grid' }, games.map(function (g) {
            var lv = getLevel(g.id);
            return el('li', null, el('button', { class: 'game-card', type: 'button', onclick: function () { renderIntro(g, false); } }, [
              el('span', { class: 'game-card-name' }, g.name),
              el('span', { class: 'game-card-tag' }, g.tagline),
              el('span', { class: 'game-card-level' }, [
                levelPill(lv),
                el('span', { class: 'game-card-stage' }, BG.stageOf(lv).name)
              ]),
              el('span', { class: 'mini-bar', 'aria-hidden': 'true' },
                el('span', { class: 'mini-bar-fill', style: { width: Math.round(lv / BG.MAX_LEVEL * 100) + '%' } }))
            ]));
          }))
        ]);
      }))
    ]);

    app.appendChild(hero);
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
    app.appendChild(allSection);
    app.appendChild(el('section', { class: 'section tips' }, [
      el('h2', { class: 'section-title' }, 'איך זה עובד'),
      el('ul', { class: 'tips-list' }, [
        el('li', null, [el('strong', null, 'אין שעון. '), 'קחו את הזמן לחשוב. הדיוק חשוב יותר מהמהירות.']),
        el('li', null, [el('strong', null, BG.MAX_LEVEL + ' רמות בכל משחק. '), 'כשמצליחים עולים רמה, וכשקשה יורדים רמה. אפשר גם לבחור רמה קלה יותר בעצמכם.']),
        el('li', null, [el('strong', null, 'קצת בכל יום. '), 'עשר דקות ביום עדיפות על שעה פעם בשבוע.'])
      ]),
      el('button', { class: 'btn btn-quiet btn-sm', type: 'button', onclick: function () { renderWelcome(true); } },
        BG.state.name ? 'שינוי שם וגודל טקסט' : 'הוספת שם וגודל טקסט')
    ]));
  }

  /* ---------- level path ---------- */
  function levelPath(opts) {
    // opts: { level, best, selected, onPick, from }
    return el('div', { class: 'path' }, BG.STAGES.map(function (stage) {
      var dots = [];
      for (var lv = stage.from; lv <= stage.to; lv++) {
        (function (lv) {
          var reached = lv <= opts.best;
          var cls = 'path-dot' +
            (reached ? ' is-reached' : '') +
            (lv === opts.level ? ' is-current' : '') +
            (opts.selected === lv ? ' is-selected' : '') +
            (opts.from === lv ? ' is-from' : '');
          if (opts.onPick && reached) {
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
  function renderIntro(game, daily, chosenLevel) {
    endCurrent();
    clear();
    var level = getLevel(game.id);
    var best = getBest(game.id);
    var selected = chosenLevel ? clampLevel(Math.min(chosenLevel, best)) : level;
    var speakText = game.name + '. ' + game.instructions.join(' ');

    var startBtn = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { startGame(game, daily, selected); } },
      'התחלה ברמה ' + selected);
    var speakBtn = el('button', { class: 'btn btn-secondary', type: 'button', hidden: true, onclick: function () { U.speak(speakText); } }, 'הקראת ההוראות');
    function checkVoice() { if (U.canSpeak()) speakBtn.hidden = false; }
    checkVoice();
    if ('speechSynthesis' in window) window.speechSynthesis.addEventListener('voiceschanged', checkVoice, { once: true });

    var pathWrap = el('div', { class: 'path-wrap' });
    function drawPath() {
      pathWrap.innerHTML = '';
      pathWrap.appendChild(levelPath({
        level: level, best: best, selected: selected,
        onPick: function (lv) { selected = lv; startBtn.textContent = 'התחלה ברמה ' + lv; drawPath(); }
      }));
    }
    drawPath();

    app.appendChild(el('section', { class: 'intro' }, [
      el('div', { class: 'intro-head' }, [
        skillIcon(game.skill),
        el('div', null, [
          el('div', { class: 'intro-chips' }, [skillChip(game.skill), el('span', { class: 'level-pill' }, 'רמה ' + level + ' מתוך ' + BG.MAX_LEVEL)]),
          el('h1', { class: 'intro-title' }, game.name),
          el('p', { class: 'intro-tag' }, game.tagline)
        ])
      ]),
      el('h2', { class: 'intro-sub' }, 'איך משחקים'),
      el('ol', { class: 'steps' }, game.instructions.map(function (s) { return el('li', null, s); })),
      game.benefit ? el('p', { class: 'benefit' }, [el('strong', null, 'מה זה מאמן: '), game.benefit]) : null,
      el('div', { class: 'intro-actions' }, [
        startBtn,
        speakBtn,
        el('button', { class: 'btn btn-quiet', type: 'button', onclick: renderHome }, 'חזרה לדף הבית')
      ]),
      el('div', { class: 'level-box' }, [
        el('h2', { class: 'intro-sub' }, 'הדרך שלי במשחק'),
        el('p', { class: 'g-hint level-box-hint' },
          'אפשר לבחור כל רמה שכבר הגעתם אליה. רמה קלה יותר היא דרך טובה להתחמם, וכל הצלחה פותחת את הרמה הבאה.'),
        pathWrap
      ])
    ]));
  }

  /* ---------- game ---------- */
  function endCurrent() {
    if (current) {
      current.active = false;
      if (typeof current.cleanup === 'function') { try { current.cleanup(); } catch (e) { console.error(e); } }
      current = null;
    }
  }

  function startGame(game, daily, level) {
    endCurrent();
    clear();
    level = clampLevel(level || getLevel(game.id));
    var session = { game: game, active: true, daily: daily, cleanup: null };
    current = session;

    var progressText = el('span', { class: 'play-progress' }, '');
    var progressBar = el('span', { class: 'play-bar-fill' });
    var status = el('p', { class: 'play-status' }, '');
    var board = el('div', { class: 'play-board' });
    var toast = el('div', { class: 'toast', role: 'status', hidden: true });

    var exitBtn = el('button', { class: 'btn btn-quiet btn-sm', type: 'button', onclick: function () { confirmBox.hidden = false; exitBtn.hidden = true; } }, 'יציאה');
    var confirmBox = el('div', { class: 'confirm', hidden: true, role: 'group', 'aria-label': 'יציאה מהמשחק' }, [
      el('span', null, 'לצאת מהמשחק? הסיבוב הזה לא יישמר.'),
      el('span', { class: 'confirm-actions' }, [
        el('button', { class: 'btn btn-primary btn-sm', type: 'button', onclick: function () { confirmBox.hidden = true; exitBtn.hidden = false; } }, 'להמשיך לשחק'),
        el('button', { class: 'btn btn-quiet btn-sm', type: 'button', onclick: function () { renderIntro(game, daily); } }, 'כן, לצאת')
      ])
    ]);

    var head = el('div', { class: 'play-head' }, [
      el('div', { class: 'play-title' }, [skillIcon(game.skill), el('span', null, game.name), levelPill(level)]),
      progressText,
      exitBtn
    ]);

    app.appendChild(el('section', { class: 'play' }, [
      head,
      confirmBox,
      el('span', { class: 'play-bar', 'aria-hidden': 'true' }, progressBar),
      status,
      board,
      toast
    ]));

    function guard(fn) {
      return function () { if (session.active) return fn.apply(null, arguments); };
    }

    var ctx = {
      level: level,
      el: el,
      shuffle: function (a) { return U.shuffle(a); },
      randInt: function (a, b) { return U.randInt(a, b); },
      pick: function (a) { return U.pick(a); },
      isActive: function () { return session.active; },
      wait: function (ms) {
        return new Promise(function (resolve) {
          setTimeout(function () { if (session.active) resolve(); }, ms);
        });
      },
      setProgress: guard(function (cur, total) {
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
        if (typeof session.cleanup === 'function') { try { session.cleanup(); } catch (e) { console.error(e); } }
        current = null;
        renderResult(game, daily, level, result || { correct: 0, total: 0 });
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
  function renderResult(game, daily, playedLevel, result) {
    clear();
    var correct = Math.max(0, result.correct | 0);
    var total = Math.max(0, result.total | 0);
    var acc = total ? correct / total : 0;
    var newLevel = playedLevel;
    if (acc >= 0.85) newLevel = Math.min(BG.MAX_LEVEL, playedLevel + 1);
    else if (acc < 0.5) newLevel = Math.max(BG.MIN_LEVEL, playedLevel - 1);

    var oldBest = getBest(game.id);
    var oldStage = BG.stageOf(playedLevel);
    var newStage = BG.stageOf(newLevel);
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
    if (leveledUp && newStage !== oldStage) levelMsg = 'עליתם לרמה ' + newLevel + ' ונכנסתם לשלב חדש: ' + newStage.name + '!';
    else if (leveledUp && newLevel === BG.MAX_LEVEL) levelMsg = 'הגעתם לרמה הגבוהה ביותר, ' + BG.MAX_LEVEL + '. מדהים!';
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
    actions.push(el('button', { class: 'btn ' + (actions.length ? 'btn-secondary' : 'btn-primary btn-lg'), type: 'button', onclick: function () { startGame(game, daily, newLevel); } }, 'לשחק שוב (רמה ' + newLevel + ')'));
    actions.push(el('button', { class: 'btn btn-quiet', type: 'button', onclick: renderHome }, 'לדף הבית'));

    app.appendChild(el('section', { class: 'result' }, [
      skillIcon(game.skill),
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
      el('p', { class: 'result-level' + (leveledUp ? ' is-up' : '') }, levelMsg),
      el('div', { class: 'result-path' }, levelPath({
        level: newLevel, best: Math.max(oldBest, newLevel), from: newLevel !== playedLevel ? playedLevel : null
      })),
      el('div', { class: 'result-actions' }, actions)
    ]));

    if (leveledUp) confetti();
  }

  /* ---------- top bar ---------- */
  function applyPrefs() {
    var p = BG.state.prefs;
    document.documentElement.classList.toggle('big-text', !!p.bigText);
    var s = document.getElementById('btn-sound');
    s.textContent = p.sound ? 'צלילים: פועל' : 'צלילים: כבוי';
    s.setAttribute('aria-pressed', p.sound ? 'true' : 'false');
    var t = document.getElementById('btn-textsize');
    t.textContent = p.bigText ? 'טקסט רגיל' : 'הגדלת טקסט';
    t.setAttribute('aria-pressed', p.bigText ? 'true' : 'false');
  }

  document.getElementById('btn-sound').addEventListener('click', function () {
    BG.state.prefs.sound = !BG.state.prefs.sound; BG.save(); applyPrefs();
  });
  document.getElementById('btn-textsize').addEventListener('click', function () {
    BG.state.prefs.bigText = !BG.state.prefs.bigText; BG.save(); applyPrefs();
  });
  document.getElementById('brand-home').addEventListener('click', renderHome);

  applyPrefs();
  renderHome();
})();
