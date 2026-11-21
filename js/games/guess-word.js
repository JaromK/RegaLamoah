/* נחשו את המילה — a hidden everyday word with a category hint (and a picture at the low levels). Tap letters on a
   big Hebrew keyboard: right letters appear in all their places, wrong letters are marked. No hanging figure,
   only a calm count of wrong guesses (language). Untimed. */
(function () {
  'use strict';

  var ABC = 'אבגדהוזחטיכלמנסעפצקרשת';
  var TO_BASE = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
  function base(ch) { return TO_BASE[ch] || ch; }

  /* category → three tiers (1 common … 3 less common). An item is word or word:emoji. */
  var BANK = {
    'פירות': ['תפוח:🍎 בננה:🍌 ענב:🍇 לימון:🍋 תות:🍓 אגס:🍐 תפוז:🍊 אבטיח:🍉',
      'אננס:🍍 דובדבן:🍒 אפרסק:🍑 קוקוס:🥥 מלון:🍈 קיווי:🥝 מנגו:🥭 רימון',
      'אוכמניות:🫐 תמר שזיף אבוקדו:🥑 תאנה משמש פומלה'],
    'ירקות': ['גזר:🥕 תירס:🌽 בצל:🧅 שום:🧄 פלפל:🫑 חסה:🥬',
      'עגבנייה:🍅 מלפפון:🥒 חציל:🍆 ברוקולי:🥦 פטרייה:🍄 כרוב:🥬',
      'קישוא דלעת:🎃 צנונית סלק כרפס בטטה:🍠 אפונה:🫛 שעועית:🫘'],
    'בעלי חיים': ['כלב:🐕 חתול:🐈 פרה:🐄 סוס:🐎 דוב:🐻 פיל:🐘 קוף:🐒 נמר:🐅 גמל:🐫 כבש:🐑 נחש:🐍',
      'אריה:🦁 ארנב:🐇 עכבר:🐁 זאב:🐺 שועל:🦊 חמור:🫏 ברווז:🦆 יונה:🕊️ דבורה:🐝 פרפר:🦋 נמלה:🐜 זברה:🦓 תוכי:🦜 ינשוף:🦉 תרנגול:🐓',
      'עכביש:🕷️ קנגורו:🦘 פינגווין:🐧 דולפין:🐬 תמנון:🐙 לוויתן:🐋 צבי:🦌 קיפוד:🦔 תנין:🐊 צפרדע:🐸 חילזון:🐌 עטלף:🦇 סנאי:🐿️'],
    'דברים בבית': ['כיסא:🪑 מיטה:🛏️ דלת:🚪 שעון:⏰ ספר:📖 כוס:🥛 מפתח:🔑',
      'מנורה:💡 טלפון:☎️ מראה:🪞 כרית סבון:🧼 מטאטא:🧹 מספריים:✂️ מקרר מגבת נר:🕯️',
      'מטרייה:☂️ שטיח וילון ספה:🛋️ אמבטיה:🛁 כביסה מחבת:🍳 קומקום ארון מדף'],
    'בגדים ותכשיטים': ['כובע:🧢 נעל:👞 גרב:🧦 שמלה:👗 חולצה:👕',
      'מעיל:🧥 צעיף:🧣 כפפה:🧤 משקפיים:👓 טבעת:💍 מכנסיים:👖',
      'עניבה:👔 חגורה שרשרת:📿 ארנק:👛 תיק:👜 מגפיים:👢 עגיל סינר'],
    'אוכל ושתייה': ['לחם:🍞 עוגה:🍰 גבינה:🧀 ביצה:🥚 חלב:🥛 דבש:🍯',
      'פיצה:🍕 גלידה:🍦 שוקולד:🍫 עוגייה:🍪 מרק:🍲 אורז:🍚 סוכרייה:🍬 פיתה:🥙',
      'פלאפל:🧆 חומוס סלט:🥗 נקניק:🌭 חביתה:🍳 לביבה פסטה:🍝 קפה:☕ ממרח ריבה'],
    'כלי תחבורה': ['רכבת:🚆 מטוס:✈️ סירה:⛵',
      'אוטובוס:🚌 מכונית:🚗 משאית:🚚 מונית:🚕 אופניים:🚲 אונייה:🚢',
      'אופנוע:🏍️ טרקטור:🚜 מסוק:🚁 רקטה:🚀 קטנוע:🛵 אמבולנס:🚑 עגלה'],
    'מקצועות': ['רופא:🩺 מורה:🧑‍🏫 טבח:🧑‍🍳',
      'שוטר:👮 טייס:🧑‍✈️ זמר:🎤 צייר:🎨 נגר:🪚 דוור:📬 אופה:🥖',
      'חקלאי:🧑‍🌾 כבאי:🧑‍🚒 שחקן:🎭 ספרן:📚 צלם:📷 מדען:🔬 חשמלאי ספר'],
    'בטבע': ['שמש:☀️ ירח:🌙 פרח:🌸 גשם:🌧️ שלג:❄️ ענן:☁️',
      'כוכב:⭐ קשת:🌈 נהר אבן:🪨 עלה:🍃 ברק:⚡ גלים:🌊',
      'מדבר:🏜️ אגם יער:🌲 מפל חוף:🏖️ מערה סלע גבעה אדמה'],
    'הגוף שלנו': ['ראש עין:👁️ אוזן:👂 רגל:🦵 לב:❤️',
      'אצבע:☝️ בטן שיער כתף ברך מרפק לשון:👅 שפתיים:👄',
      'צוואר סנטר לחי גבה ריסים ציפורן עקב קרסול'],
    'כלי נגינה': ['תוף:🥁',
      'גיטרה:🎸 כינור:🎻 פסנתר:🎹 חצוצרה:🎺',
      'חליל נבל קלרינט אקורדיון:🪗 מפוחית משולש'],
    'משחקים וספורט': ['כדור:⚽ בובה:🪆',
      'שחמט:♟️ קלפים:🃏 שחייה:🏊 ריצה:🏃 קובייה:🎲',
      'טניס:🎾 כדורסל:🏀 כדורגל באולינג:🎳 דמקה פאזל:🧩 שבשבת'],
    'ערים בארץ': ['',
      'חיפה אילת טבריה עכו צפת נתניה חולון רמלה',
      'אשדוד אשקלון רחובות נהריה כרמיאל עפולה חדרה הרצליה דימונה'],
    'חגים ומועדים': ['פסח שבת חנוכה פורים',
      'סוכות שבועות מצה:🫓 סביבון חנוכייה:🕎',
      'מגילה לולב אתרוג שופר כיפור מימונה'],
    'כלי עבודה ומטבח': ['פטיש:🔨',
      'מברג:🪛 מסור:🪚 סולם:🪜 מזלג:🍴 סכין:🔪 מסמר',
      'צבת מחבת קערה:🥣 מגהץ מחט:🪡 סיר מצקת'],
    'צבעים': ['אדום:🔴 כחול:🔵 ירוק:🟢 צהוב:🟡',
      'סגול:🟣 כתום:🟠 לבן:⚪ שחור:⚫',
      'ורוד חום:🟤 אפור תכלת זהב כסף בורדו']
  };

  /* two-word phrases, for the top levels */
  var PHRASES = ['בית ספר', 'ראש השנה', 'יום הולדת', 'גן ילדים', 'כדור רגל', 'תפוח אדמה', 'בית חולים', 'ים המלח',
    'ליל הסדר', 'שמן זית', 'חוף הים', 'כוס תה', 'ארוחת ערב', 'שעון יד', 'חדר שינה', 'בית כנסת', 'דג זהב',
    'סלט ירקות', 'לוח שנה', 'עוגת גבינה', 'מרק עוף', 'כוכב נופל', 'נר שבת', 'בית קפה', 'ערב חג', 'ספר תורה',
    'מיץ ענבים', 'כרטיס טיסה', 'חג שמח', 'שנה טובה', 'מזל טוב', 'לילה טוב', 'בוקר טוב', 'עץ זית', 'יין אדום',
    'שמש חמה', 'גשם ראשון', 'שקית חלב', 'כוס קפה', 'חופש גדול'];

  var WORDS = (function () {
    var out = [], seen = {};
    Object.keys(BANK).forEach(function (cat) {
      BANK[cat].forEach(function (line, ti) {
        line.split(' ').forEach(function (item) {
          if (!item) return;
          var p = item.split(':'), w = p[0];
          if (seen[w] || w.length < 3) return;
          seen[w] = 1;
          out.push({ w: w, cat: cat, emoji: p[1] || '', tier: ti + 1 });
        });
      });
    });
    PHRASES.forEach(function (w) { if (!seen[w]) { seen[w] = 1; out.push({ w: w, cat: 'צירוף', emoji: '', tier: 3, phrase: true }); } });
    return out;
  })();

  /* Level 1–50 → which words, which hints, how many wrong guesses still count as success. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    var s = { allowed: Math.max(4, 7 - Math.floor((L - 1) / 12)), emoji: L <= 20, cat: L <= 40, phrases: 0 };
    if (L <= 10) { s.tiers = L <= 5 ? [1] : [1, 2]; s.len = [3, L <= 5 ? 4 : 5]; }
    else if (L <= 20) { s.tiers = [1, 2]; s.len = [4, 6]; }
    else if (L <= 30) { s.tiers = [1, 2, 3]; s.len = [4, 7]; }
    else if (L <= 40) { s.tiers = [2, 3]; s.len = [5, 9]; }
    else { s.tiers = [2, 3]; s.len = [5, 9]; s.phrases = L <= 45 ? 2 : 3; }
    return s;
  }

  function pool(sp) {
    return WORDS.filter(function (e) {
      return !e.phrase && sp.tiers.indexOf(e.tier) >= 0 && e.w.length >= sp.len[0] && e.w.length <= sp.len[1] && (!sp.emoji || e.emoji);
    });
  }

  /* The words for one session: no repeats, mostly from different categories; phrases at the top levels. */
  function pickWords(sp, n, rnd) {
    var list = rnd.shuffle(pool(sp)), out = [], cats = {};
    list.forEach(function (e) { if (out.length < n - sp.phrases && !cats[e.cat]) { cats[e.cat] = 1; out.push(e); } });
    list.forEach(function (e) { if (out.length < n - sp.phrases && out.indexOf(e) < 0) out.push(e); });
    if (sp.phrases) out = out.concat(rnd.shuffle(WORDS.filter(function (e) { return e.phrase; })).slice(0, sp.phrases));
    return rnd.shuffle(out);
  }

  // the base letters a word still needs
  function needed(word) {
    var s = {};
    word.split('').forEach(function (ch) { if (ch !== ' ') s[base(ch)] = 1; });
    return Object.keys(s);
  }

  var css = [
    '.gw-pic{font-size:3.6rem;line-height:1;margin:0;}',
    '.gw-cat{margin:0;font-size:1.3rem;font-weight:800;color:var(--language);text-align:center;}',
    '.gw-slots{display:flex;gap:5px;justify-content:center;direction:rtl;flex-wrap:nowrap;max-width:100%;}',
    '.gw-slot{--s:min(3.2rem, calc((100vw - 3.5rem) / var(--n) - 5px));width:var(--s);height:calc(var(--s) * 1.2);border-bottom:4px solid var(--ink);',
    'display:grid;place-items:center;font-family:var(--font-display);font-weight:900;font-size:calc(var(--s) * .8);line-height:1;color:var(--ink);background:var(--surface-2);border-radius:6px 6px 0 0;}',
    '.gw-slot.is-gap{background:transparent;border-color:transparent;width:calc(var(--s) * .45);}',
    '.gw-slot.is-new{background:var(--c-green-soft);}',
    '.gw-slot.is-shown{color:var(--c-red);}',
    '.gw-count{margin:0;font-size:1.15rem;font-weight:700;text-align:center;color:var(--ink-soft);}',
    '.gw-count b{color:var(--ink);}',
    '.gw-kbd{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:5px;width:100%;max-width:30rem;direction:rtl;}',
    '.gw-key{min-height:3rem;line-height:1;padding:0;border:2px solid var(--line);border-radius:10px;background:var(--surface-2);color:var(--ink);',
    'font-size:1.5rem;font-weight:800;cursor:pointer;touch-action:manipulation;}',
    '.gw-key.is-good{background:var(--c-green);border-color:var(--c-green);color:#fff;}',
    '.gw-key.is-bad{background:var(--c-red-soft);border-color:var(--c-red);color:var(--c-red);text-decoration:line-through;}',
    '.gw-key:disabled{cursor:default;}'
  ].join('');

  BrainGames.register({
    id: 'guess-word',
    name: 'נחשו את המילה',
    skill: 'language',
    isNew: true,
    tagline: 'נחשו מילה נסתרת, אות אחרי אות',
    benefit: 'אוצר מילים, איות והסקת מסקנות',
    instructions: [
      'מסתתרת כאן מילה. מעליה כתוב מאיזה נושא היא.',
      'לחצו על אותיות במקלדת. אות נכונה תופיע בכל המקומות שלה במילה.',
      'אות שאינה במילה תסומן באדום. נסו לגלות את המילה עם מעט טעויות.',
      'אין שעון. אין צורך ללחוץ על אותיות סופיות: ם, ן, ץ, ף, ך מתגלות לבד.'
    ],
    css: css,
    _model: { spec: spec, pool: pool, pickWords: pickWords, words: WORDS, needed: needed, base: base },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = 6;
      var list = pickWords(sp, ROUNDS, ctx);
      var round = 0, good = 0;

      function next() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: good, total: ROUNDS, note: 'ניחשתם ' + good + ' מתוך ' + ROUNDS + ' מילים עם עד ' + sp.allowed + ' טעויות' });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        play(list[round - 1]);
      }

      function play(item) {
        root.innerHTML = '';
        root.__gw = item; // read by the automated tests
        var word = item.w, need = needed(word), got = {}, wrong = 0, done = false;
        var letters = word.split('');
        if (item.emoji && sp.emoji) root.appendChild(el('p', { class: 'gw-pic', 'aria-hidden': 'true' }, item.emoji));
        var hintText = sp.cat && !item.phrase ? 'נושא: ' + item.cat
          : item.phrase ? 'צירוף של שתי מילים' : 'מילה של ' + word.length + ' אותיות';
        root.appendChild(el('p', { class: 'gw-cat' }, hintText));
        var slots = letters.map(function (ch) {
          return el('div', { class: 'gw-slot' + (ch === ' ' ? ' is-gap' : ''), style: { '--n': letters.length } });
        });
        root.appendChild(el('div', { class: 'gw-slots', 'aria-label': 'המילה' }, slots));
        var count = el('p', { class: 'gw-count' });
        root.appendChild(count);
        var keys = {};
        var kbd = el('div', { class: 'gw-kbd' }, ABC.split('').map(function (l) {
          keys[l] = el('button', { class: 'gw-key', type: 'button', onclick: function () { guess(l); } }, l);
          return keys[l];
        }));
        root.appendChild(kbd);
        var showBtn = el('button', { class: 'btn btn-quiet', type: 'button', onclick: function () { end(false, true); } }, 'הראו את המילה');
        var acts = el('div', { class: 'g-actions' }, [showBtn]);
        root.appendChild(acts);
        ctx.setStatus('לחצו על אותיות כדי לגלות את המילה');
        updateCount();

        function updateCount() {
          count.innerHTML = '';
          count.appendChild(document.createTextNode('טעויות: '));
          count.appendChild(el('b', null, String(wrong)));
          count.appendChild(document.createTextNode(wrong <= sp.allowed ? ' (אפשר עד ' + sp.allowed + ')' : ' (ממשיכים בכל זאת)'));
        }

        function guess(l) {
          if (done || got[l]) return;
          got[l] = 1;
          keys[l].disabled = true;
          if (need.indexOf(l) >= 0) {
            keys[l].classList.add('is-good');
            ctx.sound('good');
            letters.forEach(function (ch, i) {
              if (base(ch) === l) { slots[i].textContent = ch; slots[i].classList.add('is-new'); }
            });
            if (need.every(function (x) { return got[x]; })) end(wrong <= sp.allowed, false);
          } else {
            keys[l].classList.add('is-bad');
            ctx.sound('bad');
            wrong++;
            updateCount();
            ctx.setStatus('האות ' + l + ' לא נמצאת במילה');
            if (wrong >= sp.allowed + 4) end(false, true);
          }
        }

        function end(ok, reveal) {
          if (done) return;
          done = true;
          if (reveal) letters.forEach(function (ch, i) { if (ch !== ' ' && !slots[i].textContent) { slots[i].textContent = ch; slots[i].classList.add('is-shown'); } });
          Object.keys(keys).forEach(function (k) { keys[k].disabled = true; });
          if (ok) good++;
          ctx.setStatus(ok ? 'נכון! המילה היא: ' + word : reveal ? 'המילה היא: ' + word : 'גיליתם את המילה, עם הרבה טעויות');
          ctx.feedback(ok, ok ? undefined : 'המילה: ' + word).then(function () {
            kbd.remove();
            acts.innerHTML = '';
            var b = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { b.disabled = true; next(); } },
              round >= ROUNDS ? 'לסיכום' : 'למילה הבאה');
            acts.appendChild(b);
          });
        }
      }

      next();
    }
  });
})();
