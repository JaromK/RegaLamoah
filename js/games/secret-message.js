/* פענוח מסר — a short Hebrew message is written in a secret code; use the key (or the rule) to turn it back
   into letters (attention, working memory, logic). Untimed. */
(function () {
  'use strict';

  var ABC = 'אבגדהוזחטיכלמנסעפצקרשת'.split('');
  var BASE = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
  var FINAL = { 'כ': 'ך', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ' };
  var SYMBOLS = ['★', '●', '▲', '■', '◆', '♥', '♣', '♠', '☀', '☂', '☎', '✿', '✈', '♫', '☺', '⚑', '✂', '⌂', '☘', '✉', '⚓', '❄'];

  /* the messages: family news, plans, little secrets and sayings. Each level takes those of a length that fits it
     (counted in letters), and a player does not see the same message again soon (ctx.fresh). */
  var MESSAGES = [
    'נולד לנו נכד חדש', 'הנכדה עברה את מבחן הנהיגה', 'הבן שלנו התקבל לעבודה חדשה', 'החתונה תהיה בחודש הבא',
    'אנחנו מגיעים אליכם בשבת בצהריים', 'אמא מזמינה את כולם לארוחת שישי', 'סבא תיקן את האופניים של הנכד',
    'הנכד ניצח בתחרות השחמט', 'הנכדים שתלו עץ לימון', 'סבתא לימדה אותי לאפות חלה', 'השכנה הביאה לנו ריבת תות',
    'הכלב של השכנים מצא את הכדור', 'פתחו מסעדה חדשה ליד הבנק', 'הדואר הביא חבילה בשבילך', 'הרופא אמר שהכול תקין',
    'היום למדתי להשתמש במחשב', 'החלטתי ללמוד לנגן בפסנתר', 'הצלחתי לפתור את התשבץ כולו', 'היום הלכתי חמישה קילומטרים',
    'סיימתי לסרוג את הצעיף', 'מצאתי את התמונות מהחתונה', 'בחוג השירה למדנו שיר חדש', 'הגעתי הביתה בשלום',
    'מחר בשמונה נפגשים בפארק', 'ניפגש בכניסה לקניון', 'אני מחכה לכם בתחנה', 'בואו לראות את השקיעה בחוף',
    'בואו נצא לטיול בשבת', 'בשבוע הבא נוסעים לים המלח', 'הטיול לגליל נדחה לשבוע הבא',
    'קניתי כרטיסים לקונצרט ביום חמישי', 'בערב יש הופעה בכיכר העיר', 'ההצגה מתחילה בשעה תשע', 'הרכבת לחיפה יוצאת בעשר',
    'האוטובוס מגיע כל רבע שעה', 'הפגישה עם הרופא נקבעה ליום שני', 'הזמנו שולחן במסעדה האיטלקית',
    'בקיץ נטוס לבקר את המשפחה', 'מחר בבוקר הולכים לשוק', 'אחרי הצהריים נשחק שש בש', 'בחנוכה נדליק נרות יחד',
    'צלצלו כשאתם יוצאים מהבית', 'תביאו מעיל כי קר בערב', 'בואו נשתה קפה במרפסת', 'הנכדים באים לישון אצלנו',
    'הכנתי לכם עוגת גבינה', 'הקפה מוכן והעוגה בתנור', 'המרק של סבתא הכי טעים בעולם', 'השולחן ערוך והנרות דולקים',
    'מצאתי מתכון לעוגת שוקולד', 'הכנו סלט גדול לפיקניק', 'יש מבצע על תפוזים בשוק', 'תזכירו לי לקנות חלב ולחם',
    'אל תשכחו להשקות את העציצים', 'הכביסה כבר יבשה על החבל', 'קניתי גרביים חמות לחורף', 'השעון בסלון מקדים בעשר דקות',
    'הלימונים מהעץ שלנו מתוקים', 'התפוחים בגינה כבר בשלים', 'הגינה פורחת אחרי הגשם', 'הפרחים שקיבלתי מריחים נפלא',
    'החתול ישן על הכורסה כל היום', 'שכחתי את המשקפיים אצלכם', 'הטלפון שלי נטען בסלון',
    'מישהו ראה את השלט של הטלוויזיה', 'הגשם הפסיק ויצאה קשת בענן', 'הים היה שקט ונעים', 'הספר שהמלצת עליו מצוין',
    'השיר הזה מזכיר לי את הנעורים', 'המפתח מחכה מתחת לעציץ', 'השוקולד מוחבא במגירה העליונה',
    'האוצר מוסתר מתחת לעץ הגדול', 'הסיסמה היא חתול כתום', 'פגישה סודית ליד המזרקה', 'הכרטיס הזוכה בכיס של המעיל',
    'מי שמפענח מקבל עוגייה', 'יש לי סוד קטן לספר לך', 'המתנה של סבתא בארון הלבן', 'אל תגלו לאבא על המסיבה',
    'מסיבת הפתעה ביום שלישי בערב', 'העוגה מחכה במקרר למטה', 'החבילה תגיע מחר בבוקר', 'הכסף בקופסה הכחולה',
    'המכתב נמצא בתוך הספר האדום', 'תודה על הפרחים היפים', 'היה נעים לדבר איתך', 'הארוחה הייתה טעימה מאוד',
    'מחכה לשמוע ממך', 'שמרו על עצמכם', 'אתם המשפחה הכי טובה', 'כל הכבוד על ההצלחה', 'מתגעגעים אליכם מאוד',
    'החיוך שלך משמח אותי', 'איזה כיף שבאתם', 'אין דבר העומד בפני הרצון', 'סוף מעשה במחשבה תחילה', 'כל ההתחלות קשות',
    'טוב מאוחר מאשר לעולם לא', 'אל תדחה למחר את מה שאפשר לעשות היום', 'מכל מלמדי השכלתי', 'טוב שכן קרוב מאח רחוק',
    'השמש תזרח גם מחר', 'לאט לאט מגיעים רחוק', 'מי שמחפש מוצא', 'חבר טוב שווה זהב', 'צחוק הוא התרופה הטובה ביותר',
    'כל יום הוא הזדמנות חדשה', 'שתיקה שווה זהב', 'אין חכם כבעל ניסיון', 'מילה טובה משמחת את הלב',
    'מה ששנוא עליך אל תעשה לחברך', 'אם אין אני לי מי לי', 'איזהו עשיר השמח בחלקו', 'תפסת מרובה לא תפסת',
    'מה שהיה הוא שיהיה', 'דרך ארץ קדמה לתורה', 'המוח אוהב אתגרים', 'הכל לטובה', 'יום יפה היום', 'יש לי חבר טוב',
    'נתראה מחר בבוקר', 'אני אוהב אותך', 'ברוכים הבאים', 'שלום עליכם', 'רפואה שלמה', 'יום הולדת שמח'
  ];

  /* Level 1–50: mode = how the letters are hidden; keyShare = part of the key shown (the rest is worked out
     from the message); len = which messages. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    // len = letters in the message (min–max): longer as the levels go, a bit shorter where a key takes room on screen
    if (L <= 4) return { mode: 'symbol', keyShare: 1, len: [8, 13] };
    if (L <= 10) return { mode: 'symbol', keyShare: 1, len: [10, 16] };
    if (L <= 20) return { mode: 'symbol', keyShare: 1 - (L - 10) * 0.05, len: [11, 17] };          // 95% → 50% of the key
    if (L <= 25) return { mode: 'number', keyShare: 1, len: [11, 17] };
    if (L <= 30) return { mode: 'number', keyShare: 0, len: [15, 24] };
    if (L <= 35) return { mode: 'shift', shift: 1, len: [15, 24] };
    if (L <= 40) return { mode: 'shift', shift: L <= 38 ? 1 : 2, len: [17, 28] };
    if (L <= 45) return { mode: 'atbash', keyShare: 0.5, len: [15, 24] };
    return { mode: 'atbash', keyShare: 0, len: [18, 30] };
  }
  function letterCount(m) { return m.replace(/ /g, '').length; }
  function messagesFor(sp) {
    return MESSAGES.filter(function (m) { var n = letterCount(m); return n >= sp.len[0] && n <= sp.len[1]; });
  }

  // the code shown for a (base) letter
  function codeFor(sp, map, l) {
    var i = ABC.indexOf(l);
    if (sp.mode === 'symbol') return map[l];
    if (sp.mode === 'number') return String(i + 1);
    if (sp.mode === 'shift') return ABC[(i + sp.shift) % ABC.length];
    return ABC[ABC.length - 1 - i]; // atbash: א↔ת, ב↔ש…
  }

  function ruleText(sp) {
    if (sp.mode === 'symbol') return sp.keyShare >= 1 ? 'כל סימן מחליף אות. היעזרו במפתח' : 'חלק מהמפתח חסר. נחשו מתוך המילים';
    if (sp.mode === 'number') return sp.keyShare ? 'כל מספר הוא מקום האות באלף-בית' : 'כל מספר הוא מקום האות באלף-בית: א=1, ב=2, ג=3…';
    if (sp.mode === 'shift') return sp.shift === 1 ? 'כל אות הוחלפה באות שאחריה: א נכתבה ב, ב נכתבה ג…' : 'כל אות הוחלפה באות שתיים אחריה: א נכתבה ג, ב נכתבה ד…';
    return 'א↔ת, ב↔ש, ג↔ר… כל אות הוחלפה באות שבצד השני של האלף-בית';
  }

  var css = [
    '.sm-rule{margin:0;max-width:28rem;text-align:center;font-size:1.05rem;font-weight:700;line-height:1.3;}',
    /* the key: on a phone 7 to a row, sign and letter side by side; on a computer a column of its own beside the message */
    '.sm-key{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;width:100%;max-width:28rem;direction:rtl;order:-1;}',
    '.sm-k{display:flex;flex-direction:row;align-items:center;justify-content:center;gap:3px;background:var(--surface-2);border-radius:8px;',
    'padding:.1rem 0;line-height:1.1;border:1px solid var(--line);}',
    '.sm-k .c{font-size:1.4rem;color:var(--c-blue);font-weight:900;}',
    '.sm-key.is-num .sm-k .c{font-size:1.15rem;}',
    '.sm-k .l{font-family:var(--font-display);font-size:1.45rem;font-weight:900;}',
    '@media (min-width:900px){',
    '.play-board.g-split > .g-side.sm-side{width:auto;}',
    '.g-split .sm-key{grid-template-columns:repeat(4,4.4rem);width:auto;max-width:none;gap:6px;order:0;}',
    '.g-split .sm-k{flex-direction:column;gap:0;padding:.3rem 0;border-radius:10px;}',
    '.g-split .sm-k .c,.g-split .sm-key.is-num .sm-k .c{font-size:1.9rem;}.g-split .sm-k .l{font-size:2rem;}',
    '.sm-key-title{margin:0;font-weight:800;font-size:1.1rem;text-align:center;}',
    
    '.g-split .sm-kb{max-width:26rem;}.g-split .sm-kb .g-choice{min-height:2.7rem;font-size:1.35rem;}}',
    '.sm-key-title{display:none;}@media (min-width:900px){.g-split .sm-key-title{display:block;}}',
    '.sm-msg{display:flex;flex-wrap:wrap;justify-content:center;gap:.25rem .6rem;width:100%;max-width:28rem;direction:rtl;}',
    '.sm-word{display:flex;gap:2px;}',
    /* --bs = the size of a letter box, chosen per message so the whole screen fits (fitBoxes) */
    '.sm-box{width:var(--bs,2.55rem);padding:0;border:2px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);cursor:pointer;',
    'display:flex;flex-direction:column;align-items:center;font:inherit;}',
    '.sm-box .c{font-size:calc(var(--bs,2.55rem) * .53);font-weight:900;color:var(--c-blue);min-height:calc(var(--bs,2.55rem) * .56);line-height:1.15;}',
    '.sm-box .l{font-family:var(--font-display);font-size:calc(var(--bs,2.55rem) * .69);font-weight:900;min-height:calc(var(--bs,2.55rem) * .78);width:100%;border-top:2px dashed var(--line);line-height:1.15;}',
    '.sm-box.is-sel{border-color:var(--sun);background:var(--sun-soft);box-shadow:0 0 0 3px var(--sun);}',
    '.sm-box.is-same{border-color:var(--sun);}',
    '.sm-box.is-bad .l{color:var(--c-red);}',
    '.sm-box.is-given .l{color:var(--ink-soft);}',
    '.sm-done .sm-box{background:var(--good-soft);border-color:var(--good);}',
    '.sm-kb{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:.2rem;width:100%;max-width:23rem;direction:rtl;}',
    '.sm-main{display:contents;}@media (min-width:900px){.g-split .sm-main{display:flex;flex-direction:column;align-items:center;gap:1rem;}}',
    '.sm-kb .g-choice{min-height:2.1rem;font-size:1.2rem;min-width:0;padding:0;font-family:var(--font-display);}'
  ].join('');

  BrainGames.register({
    id: 'secret-message',
    name: 'פענוח מסר',
    skill: 'executive',
    isNew: true,
    tagline: 'הגיעה הודעה מוצפנת: עזרו לפענח אותה',
    benefit: 'קשב, זיכרון עבודה וחשיבה',
    instructions: [
      'הגיעה הודעה, אבל היא מוצפנת: כל אות הוחלפה בסימן, במספר או באות אחרת. עזרו לפענח אותה!',
      'כדי להתחיל, אות או שתיים כבר מפוענחות (באפור). הן מראות איך הקוד עובד.',
      'לחצו על משבצת ואז על האות הנכונה. אותה אות תתמלא בכל המקומות שבהם מופיע אותו קוד.',
      'בהתחלה יש מפתח מלא. בהמשך רק חלק ממנו, ובשלבים המתקדמים רק כלל ("כל אות הוחלפה באות שאחריה").',
      'אין שעון. תקועים? "רמז" מסביר איך לפענח אחד הקודים, בלי לגלות את האות.'
    ],
    css: css,
    _model: { spec: spec, codeFor: codeFor, messagesFor: messagesFor, MESSAGES: MESSAGES },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = 3, round = 0, good = 0;
      var msgs = ctx.fresh('messages', messagesFor(sp), ROUNDS); // not the ones of the last games

      function nextRound() {
        round++;
        if (round > ROUNDS) { ctx.finish({ correct: good, total: ROUNDS, note: 'פענחתם ' + good + ' מתוך ' + ROUNDS + ' הודעות' }); return; }
        ctx.setProgress(round, ROUNDS);
        play(msgs[(round - 1) % msgs.length]);
      }

      function play(text) {
        root.innerHTML = '';
        root.__sm = text; // read by the automated tests
        var map = {};
        var sym = ctx.shuffle(SYMBOLS);
        ABC.forEach(function (l, i) { map[l] = sym[i]; });
        var letters = text.split('').filter(function (ch) { return ch !== ' '; }).map(function (ch) { return BASE[ch] || ch; });
        var used = letters.filter(function (l, i) { return letters.indexOf(l) === i; });
        var guess = {};      // base letter → guessed letter
        var given = {};      // letters filled in for the player (hints)
        var sel = null, hints = 0, done = false;
        var tip = null, badL = null; // tip = { l, step }: the letter the last hint was about; badL = a guess marked wrong

        // the key on screen: code above, letter below
        var keyItems = null;
        if (sp.mode === 'atbash' && sp.keyShare) {
          // pairs א↔ת, ב↔ש…: show some of the 11 pairs
          var pairs = ctx.shuffle(ABC.slice(0, 11)).slice(0, Math.round(11 * sp.keyShare)).sort(function (x, y) { return ABC.indexOf(x) - ABC.indexOf(y); });
          keyItems = pairs.map(function (l) { return [ABC[ABC.length - 1 - ABC.indexOf(l)], l]; });
        } else if (sp.mode === 'symbol' || sp.mode === 'number' && sp.keyShare) {
          var show = ABC.slice();
          if (sp.keyShare < 1) {
            // hide part of the key, but only letters that are in the message (otherwise hiding them is pointless)
            var hide = ctx.shuffle(used).slice(0, Math.round(used.length * (1 - sp.keyShare)));
            show = show.filter(function (l) { return hide.indexOf(l) === -1; });
          }
          keyItems = show.map(function (l) { return [codeFor(sp, map, l), l]; });
        }
        var keyEl = keyItems ? el('div', { class: 'sm-key' + (sp.mode === 'number' ? ' is-num' : ''), 'aria-label': 'מפתח',
          style: keyItems.length > 21 ? { gridTemplateColumns: 'repeat(8,minmax(0,1fr))' } : null }, keyItems.map(function (kv) {
          return el('div', { class: 'sm-k' }, [el('span', { class: 'c' }, kv[0]), el('span', { class: 'l' }, kv[1])]);
        })) : null;
        root.appendChild(el('p', { class: 'sm-rule' }, ruleText(sp)));

        var boxes = [];
        var words = text.split(' ').map(function (w) {
          return el('div', { class: 'sm-word' }, w.split('').map(function (ch, i) {
            var base = BASE[ch] || ch;
            var b = el('button', { class: 'sm-box', type: 'button', onclick: function () { select(base); } }, [
              el('span', { class: 'c' }, codeFor(sp, map, base)), el('span', { class: 'l' })
            ]);
            boxes.push({ b: b, base: base, last: i === w.length - 1 });
            return b;
          }));
        });
        var msg = el('div', { class: 'sm-msg' }, words);
        root.appendChild(msg);
        var kb = el('div', { class: 'sm-kb' }, ABC.map(function (l) {
          return el('button', { class: 'g-choice', type: 'button', onclick: function () { put(l); } }, l);
        }).concat([
          el('button', { class: 'g-choice', type: 'button', 'aria-label': 'מחיקה', onclick: function () { put(''); } }, '⌫'),
          el('button', { class: 'g-choice', type: 'button', style: { fontSize: '.95rem', fontFamily: 'inherit' }, onclick: hint }, 'רמז')
        ]));
        root.appendChild(kb);
        var actions = el('div', { class: 'g-actions' });
        root.appendChild(actions);
        // the biggest letter boxes with which the whole screen still fits (short messages get big boxes)
        function fitBoxes() {
          var big = window.matchMedia && window.matchMedia('(min-width: 900px)').matches;
          var sizes = big ? [3.4, 3.2, 3, 2.8, 2.6, 2.4, 2.2] : [2.6, 2.45, 2.3, 2.15, 2, 1.9, 1.8];
          var de = document.documentElement;
          for (var i = 0; i < sizes.length; i++) {
            msg.style.setProperty('--bs', sizes[i] + 'rem');
            if (de.scrollHeight <= window.innerHeight + 1 && de.scrollWidth <= window.innerWidth + 1 && msg.scrollWidth <= msg.clientWidth + 1) break;
          }
        }
        // on a computer the key stands beside the message, big (shared .g-split layout); on a phone above it (order:-1)
        if (keyEl) {
          root.classList.add('g-split');
          var main = el('div', { class: 'sm-main' });
          while (root.firstChild) main.appendChild(root.firstChild);
          root.appendChild(main);
          root.appendChild(el('div', { class: 'g-side sm-side' }, [el('p', { class: 'sm-key-title' }, '🔑 המפתח'), keyEl]));
        }
        // one or two letters are decoded for the player at the start: they show how the code works
        var starters = used.slice().sort(function (a, b) {
          return letters.filter(function (x) { return x === b; }).length - letters.filter(function (x) { return x === a; }).length;
        }).slice(0, used.length >= 8 ? 2 : 1);
        starters.forEach(function (l) { guess[l] = l; given[l] = true; });
        var from = ctx.pick(['הנכדה', 'הנכד', 'השכנה', 'חבר ותיק', 'הבת', 'הבן', 'חברה מהחוג']);
        ctx.setStatus('📩 הודעה סודית מ' + from + '. פענחו אותה!');
        sel = used.filter(function (l) { return !given[l]; })[0];
        render();
        fitBoxes();

        function render() {
          var full = used.every(function (l) { return guess[l]; });
          boxes.forEach(function (x) {
            var g = guess[x.base] || '';
            x.b.querySelector('.l').textContent = g && x.last && FINAL[g] ? FINAL[g] : g;
            x.b.classList.toggle('is-sel', x.base === sel && !done);
            x.b.classList.toggle('is-bad', (full || x.base === badL) && !!g && g !== x.base);
            x.b.classList.toggle('is-given', !!given[x.base]);
            x.b.disabled = done;
          });
          [].forEach.call(kb.children, function (b) { b.disabled = done; });
        }
        function select(base) { if (done) return; if (given[base]) return; ctx.sound('tap'); sel = base; render(); }
        function put(l) {
          if (done || !sel) return;
          ctx.sound('tap');
          if (sel === badL) badL = null;
          if (l) guess[sel] = l; else delete guess[sel];
          if (l) { var nx = used.filter(function (x) { return !guess[x]; })[0]; if (nx) sel = nx; }
          render();
          check();
        }
        /* A hint that teaches how to read one code, never fills in the letter: first how the code works for it,
           then a word it is in, with the letters already found. A wrong guess is pointed out, not corrected. */
        var keyHas = {};
        (keyItems || []).forEach(function (kv) { keyHas[kv[1]] = true; if (sp.mode === 'atbash') keyHas[kv[0]] = true; });
        function q(s) { return '"' + s + '"'; }
        function codeHow(l) {
          var i = ABC.indexOf(l), code = codeFor(sp, map, l);
          if (sp.mode === 'symbol') {
            if (keyHas[l]) return 'חפשו את הסימן ' + code + ' במפתח למעלה. האות שמתחתיו היא התשובה';
            var miss = ABC.filter(function (x) { return !keyHas[x] && !(guess[x] === x && x !== l); });
            return 'הסימן ' + code + ' לא מופיע במפתח, אז האות שלו היא אחת מהאותיות שחסרות במפתח: ' + miss.join(' ') + '. איזו מהן מתאימה למילה?';
          }
          if (sp.mode === 'number') {
            if (keyHas[l]) return 'חפשו את המספר ' + code + ' במפתח למעלה. האות שמתחתיו היא התשובה';
            var anchors = [[1, 'א'], [5, 'ה'], [10, 'י'], [15, 'ס'], [20, 'ר']].filter(function (a) { return a[0] < i + 1; });
            if (!anchors.length) return 'המספר 1 הוא האות הראשונה באלף-בית';
            var a = anchors[anchors.length - 1], more = i + 1 - a[0];
            return 'המספר ' + code + ' הוא האות ה-' + code + ' באלף-בית. עזרה: ' + a[1] + ' היא ' + a[0] + ', אז ספרו מ-' + a[1] + ' עוד ' + (more === 1 ? 'אות אחת' : more + ' אותיות') + ' קדימה';
          }
          if (sp.mode === 'shift') {
            var wrap = i + sp.shift >= ABC.length ? ' (האלף-בית חוזר על עצמו: לפני א באה ת)' : '';
            return 'כאן כתוב ' + q(code) + '. האות האמיתית היא ' + (sp.shift === 1 ? 'האות שבאה לפני ' : 'שתי אותיות לפני ') + code + ' באלף-בית' + wrap;
          }
          if (keyHas[l]) return 'חפשו את ' + code + ' במפתח למעלה. האות שאיתה בזוג היא התשובה';
          var ci = ABC.indexOf(code);
          if (ci < 11) return 'כאן כתוב ' + q(code) + '. ' + code + ' היא האות ה-' + (ci + 1) + ' מההתחלה, אז התשובה היא האות ה-' + (ci + 1) + ' מהסוף (ת היא הראשונה מהסוף, ש השנייה…)';
          return 'כאן כתוב ' + q(code) + '. ' + code + ' היא האות ה-' + (22 - ci) + ' מהסוף, אז התשובה היא האות ה-' + (22 - ci) + ' מההתחלה (א היא הראשונה, ב השנייה…)';
        }
        // the word with the target letter that has the most letters found already, as a pattern: ש ? _ ם
        function wordTip(l) {
          var best = null;
          text.split(' ').forEach(function (w) {
            var bs = w.split('').map(function (ch) { return BASE[ch] || ch; });
            if (bs.indexOf(l) === -1) return;
            var found = bs.filter(function (b) { return b !== l && guess[b] === b; }).length;
            if (!best || found > best.found) best = { w: w, found: found };
          });
          var pat = best.w.split('').map(function (ch) {
            var b = BASE[ch] || ch;
            return b === l ? '?' : guess[b] === b ? ch : '_';
          }).join(' ');
          if (!best.found) return 'הוא מופיע במילה של ' + best.w.length + ' אותיות: ' + pat + '. פענחו קודם עוד אות במילה הזאת, ואז נסו לנחש את כל המילה';
          return 'הסתכלו על המילה ' + pat + '. איזו אות מתאימה במקום הסימן ?';
        }
        function hint() {
          if (done) return;
          // 1. a wrong guess comes first: mark it, without saying what is right
          var wrong = used.filter(function (l) { return guess[l] && guess[l] !== l && !given[l]; })[0];
          if (wrong) {
            if (wrong !== badL) hints++; // the same mark again is not another hint
            badL = wrong; sel = wrong; tip = null;
            ctx.setStatus('רמז: הקוד ' + codeFor(sp, map, wrong) + ' הוא לא ' + guess[wrong] + ' (מסומן באדום). ' + codeHow(wrong));
            render(); return;
          }
          var todo = used.filter(function (x) { return guess[x] !== x; });
          if (!todo.length) return;
          if (tip && tip.step === 2 && guess[tip.l] !== tip.l) { sel = tip.l; ctx.setStatus('רמז: ' + wordTip(tip.l)); render(); return; } // said already
          hints++;
          // 2. pressing again on the same letter: a word it is in
          if (tip && tip.step === 1 && guess[tip.l] !== tip.l) {
            tip.step = 2; sel = tip.l;
            ctx.setStatus('רמז: ' + wordTip(tip.l));
            render(); return;
          }
          // 3. a new letter: the one picked, or else the one that appears most often in the message
          var count = function (x) { return letters.filter(function (y) { return y === x; }).length; };
          var l = sel && todo.indexOf(sel) !== -1 ? sel : todo.slice().sort(function (a, b) { return count(b) - count(a); })[0];
          tip = { l: l, step: 1 }; sel = l;
          ctx.setStatus('רמז: ' + codeHow(l) + '. (לחיצה נוספת על "רמז" תראה מילה שבה הוא מופיע)');
          render();
        }
        function check() {
          if (!used.every(function (l) { return guess[l]; })) return;
          if (!used.every(function (l) { return guess[l] === l; })) { ctx.setStatus('יש אותיות שלא מתאימות. האדומות צריכות תיקון'); return; }
          done = true;
          var ok = hints <= Math.max(2, Math.floor(used.length / 6) + 1);
          if (ok) good++;
          msg.classList.add('sm-done');
          render();
          ctx.setStatus('ההודעה: ' + text);
          ctx.feedback(ok, ok ? undefined : 'פענחתם, בעזרת רמזים').then(function () {
            { ctx.wait(600).then(nextRound); return; } // a correct answer moves on by itself
            var next = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { next.disabled = true; nextRound(); } },
              round >= ROUNDS ? 'לסיכום' : 'למסר הבא');
            actions.appendChild(next);
          });
        }
      }

      nextRound();
    }
  });
})();
