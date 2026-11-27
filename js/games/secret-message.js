/* פענוח מסר — a short Hebrew message is written in a secret code; use the key (or the rule) to turn it back
   into letters (attention, working memory, logic). Untimed. */
(function () {
  'use strict';

  var ABC = 'אבגדהוזחטיכלמנסעפצקרשת'.split('');
  var BASE = { 'ך': 'כ', 'ם': 'מ', 'ן': 'נ', 'ף': 'פ', 'ץ': 'צ' };
  var FINAL = { 'כ': 'ך', 'מ': 'ם', 'נ': 'ן', 'פ': 'ף', 'צ': 'ץ' };
  var SYMBOLS = ['★', '●', '▲', '■', '◆', '♥', '♣', '♠', '☀', '☂', '☎', '✿', '✈', '♫', '☺', '⚑', '✂', '⌂', '☘', '✉', '⚓', '❄'];

  var MESSAGES = [
    // short
    'שבת שלום', 'בוקר טוב', 'מזל טוב', 'ערב טוב', 'לילה טוב', 'תודה רבה', 'חג שמח', 'בתיאבון', 'לחיים', 'שנה טובה',
    'כל הכבוד', 'בהצלחה', 'רפואה שלמה', 'יום הולדת שמח',
    // medium
    'הכל לטובה', 'שלום עליכם', 'ברוכים הבאים', 'הכל בסדר', 'יום יפה היום', 'נתראה מחר בבוקר', 'אני אוהב אותך',
    'בואו נשתה קפה', 'הנכדים באים בשבת', 'יש לי חבר טוב', 'המוח אוהב אתגרים',
    // long
    'אין דבר העומד בפני הרצון', 'סוף מעשה במחשבה תחילה', 'כל ההתחלות קשות', 'טוב מאוחר מאשר לעולם לא',
    'אל תדחה למחר את מה שאפשר לעשות היום', 'מכל מלמדי השכלתי', 'טוב שכן קרוב מאח רחוק', 'השמש תזרח גם מחר'
  ];

  /* Level 1–50: mode = how the letters are hidden; keyShare = part of the key shown (the rest is worked out
     from the message); len = which messages. */
  function spec(level) {
    var L = level;
    var len = L <= 6 ? [0, 14] : [0, 25]; // long sayings only where no key takes room on screen
    if (L <= 10) return { mode: 'symbol', keyShare: 1, len: L <= 4 ? [0, 14] : len };
    if (L <= 20) return { mode: 'symbol', keyShare: 1 - (L - 10) * 0.05, len: len };          // 95% → 50% of the key
    if (L <= 25) return { mode: 'number', keyShare: 1, len: [0, 25] };
    if (L <= 30) return { mode: 'number', keyShare: 0, len: [14, MESSAGES.length] };
    if (L <= 35) return { mode: 'shift', shift: 1, len: [0, 25] };
    if (L <= 40) return { mode: 'shift', shift: L <= 38 ? 1 : 2, len: [14, MESSAGES.length] };
    if (L <= 45) return { mode: 'atbash', keyShare: 0.5, len: [0, MESSAGES.length] };
    return { mode: 'atbash', keyShare: 0, len: [14, MESSAGES.length] };
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
    if (sp.mode === 'symbol') return sp.keyShare >= 1 ? 'כל סימן מחליף אות. היעזרו במפתח' : 'רק חלק מהמפתח מופיע. את שאר האותיות נחשו מתוך המילים';
    if (sp.mode === 'number') return sp.keyShare ? 'כל מספר הוא מקום האות באלף-בית' : 'כל מספר הוא מקום האות באלף-בית: א=1, ב=2, ג=3…';
    if (sp.mode === 'shift') return sp.shift === 1 ? 'כל אות הוחלפה באות שאחריה: א נכתבה ב, ב נכתבה ג…' : 'כל אות הוחלפה באות שתיים אחריה: א נכתבה ג, ב נכתבה ד…';
    return 'א↔ת, ב↔ש, ג↔ר… כל אות הוחלפה באות שבצד השני של האלף-בית';
  }

  var css = [
    '.sm-rule{margin:0;max-width:28rem;text-align:center;font-size:1.05rem;font-weight:700;line-height:1.3;}',
    '.sm-key{display:grid;grid-template-columns:repeat(11,minmax(0,1fr));gap:3px;width:100%;max-width:28rem;direction:rtl;}',
    '.sm-k{display:flex;flex-direction:column;align-items:center;background:var(--surface-2);border-radius:6px;padding:.05rem 0;line-height:1.1;}',
    '.sm-k .c{font-size:1.15rem;color:var(--c-blue);font-weight:900;}',
    '.sm-k .l{font-family:var(--font-display);font-size:1.15rem;font-weight:900;}',
    '.sm-msg{display:flex;flex-wrap:wrap;justify-content:center;gap:.3rem .8rem;width:100%;max-width:28rem;direction:rtl;}',
    '.sm-word{display:flex;gap:3px;}',
    '.sm-box{width:2.1rem;padding:0;border:2px solid var(--line);border-radius:8px;background:var(--surface);color:var(--ink);cursor:pointer;',
    'display:flex;flex-direction:column;align-items:center;font:inherit;}',
    '.sm-box .c{font-size:1.1rem;font-weight:900;color:var(--c-blue);min-height:1.35rem;line-height:1.3;}',
    '.sm-box .l{font-family:var(--font-display);font-size:1.4rem;font-weight:900;min-height:1.8rem;width:100%;border-top:2px dashed var(--line);line-height:1.35;}',
    '.sm-box.is-sel{border-color:var(--sun);background:var(--sun-soft);box-shadow:0 0 0 3px var(--sun);}',
    '.sm-box.is-same{border-color:var(--sun);}',
    '.sm-box.is-bad .l{color:var(--c-red);}',
    '.sm-box.is-given .l{color:var(--ink-soft);}',
    '.sm-done .sm-box{background:var(--good-soft);border-color:var(--good);}',
    '.sm-kb{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));gap:.25rem;width:100%;max-width:28rem;direction:rtl;}',
    '.sm-kb .g-choice{min-height:3rem;font-size:1.45rem;min-width:0;padding:0;font-family:var(--font-display);}'
  ].join('');

  BrainGames.register({
    id: 'secret-message',
    name: 'פענוח מסר',
    skill: 'executive',
    isNew: true,
    tagline: 'מסר סודי בקוד: פענחו מה כתוב',
    benefit: 'קשב, זיכרון עבודה וחשיבה',
    instructions: [
      'מסר קצר כתוב בקוד: כל אות הוחלפה בסימן, במספר או באות אחרת.',
      'לחצו על משבצת ואז על האות הנכונה. אותה אות תתמלא בכל המקומות שבהם מופיע אותו קוד.',
      'בהתחלה יש מפתח מלא. בהמשך רק חלק ממנו, ובשלבים המתקדמים רק כלל ("כל אות הוחלפה באות שאחריה").',
      'אין שעון. תקועים? "רמז" מסביר איך לפענח אחד הקודים, בלי לגלות את האות.'
    ],
    css: css,
    _model: { spec: spec, codeFor: codeFor },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = 3, round = 0, good = 0;
      var msgs = ctx.shuffle(MESSAGES.slice(sp.len[0], sp.len[1]));

      function nextRound() {
        round++;
        if (round > ROUNDS) { ctx.finish({ correct: good, total: ROUNDS, note: 'פענחתם ' + good + ' מתוך ' + ROUNDS + ' מסרים' }); return; }
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
        if (keyItems) root.appendChild(el('div', { class: 'sm-key', 'aria-label': 'מפתח' }, keyItems.map(function (kv) {
          return el('div', { class: 'sm-k' }, [el('span', { class: 'c' }, kv[0]), el('span', { class: 'l' }, kv[1])]);
        })));
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
        ctx.setStatus('לחצו על משבצת ואז על אות');
        sel = used[0];
        render();

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
          ctx.setStatus('המסר: ' + text);
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
