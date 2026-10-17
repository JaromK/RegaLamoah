/*
 * עודף בקופה — everyday shekel arithmetic: totals and change.
 * All amounts are handled internally in agorot (integers) to avoid rounding errors.
 */
(function () {
  'use strict';

  var ROUNDS = 7;
  var NOTES = [20, 50, 100, 200];

  // [name, min ₪, max ₪]
  var ITEMS = [
    ['לחם', 7, 10],
    ['חלב', 6, 7],
    ['ביצים', 12, 16],
    ['עגבניות', 6, 10],
    ['גבינה לבנה', 5, 7],
    ['קפה', 15, 25],
    ['תפוחים', 8, 12],
    ['במבה', 4, 6],
    ['אורז', 8, 12],
    ['שמן זית', 30, 45],
    ['קוטג׳', 5, 7],
    ['פסטה', 5, 8],
    ['יוגורט', 3, 5],
    ['בננות', 7, 10],
    ['שוקולד', 6, 9],
    ['מלפפונים', 5, 8],
    ['טחינה', 12, 18],
    ['חומוס', 8, 12],
    ['סוכר', 4, 6],
    ['קמח', 5, 7]
  ];

  function ltr(s) { return '⁦' + s + '⁩'; }

  /* agorot -> '₪12' or '₪12.50' */
  function money(ag) {
    var sh = Math.floor(ag / 100), r = ag % 100;
    return '₪' + sh + (r ? '.' + (r < 10 ? '0' : '') + r : '');
  }
  function moneyText(ag) { return ltr(money(ag)); }

  var MAX_L = 20;

  /* Per level: item count [min,max], price type, most expensive item allowed, cap on the total (agorot),
     chance of paying with a bigger note than needed, special offer, and how the player pays. */
  var LEVELS = {
    1:  { count: [2, 2], price: 'whole', maxPrice: 16, cap: 1900, up: 0 },
    2:  { count: [2, 2], price: 'whole', maxPrice: 16, cap: 1900, up: 0 },
    3:  { count: [2, 2], price: 'whole', maxPrice: 16, cap: 4900, up: 0 },
    4:  { count: [3, 3], price: 'whole', maxPrice: 16, cap: 4900, up: 0 },
    5:  { count: [2, 2], price: 'half', maxPrice: 25, cap: 4900, up: 0 },
    6:  { count: [2, 3], price: 'half', maxPrice: 25, cap: 4900, up: 0 },
    7:  { count: [3, 3], price: 'half', maxPrice: 25, cap: 19000, up: 0.4 },
    8:  { count: [3, 3], price: 'half', maxPrice: 99, cap: 19000, up: 0.4 },
    9:  { count: [2, 2], price: 'mix', maxPrice: 99, cap: 19000, up: 0.2 },
    10: { count: [3, 3], price: 'mix', maxPrice: 99, cap: 19000, up: 0.2 },
    11: { count: [3, 3], price: 'mix', maxPrice: 99, cap: 19000, up: 0.4 },
    12: { count: [3, 4], price: 'mix', maxPrice: 99, cap: 19000, up: 0.4 },
    13: { count: [4, 4], price: 'mix', maxPrice: 99, cap: 19000, up: 0.2 },
    14: { count: [4, 4], price: 'mix', maxPrice: 99, cap: 19000, up: 0.4 },
    15: { count: [4, 4], price: 'mix', maxPrice: 99, cap: 19000, up: 0.5 },
    16: { count: [5, 5], price: 'mix', maxPrice: 99, cap: 19000, up: 0.4 },
    17: { count: [3, 3], price: 'half', maxPrice: 99, cap: 19000, up: 0.3, special: 'deal' },
    18: { count: [3, 3], price: 'half', maxPrice: 99, cap: 19000, up: 0.3, special: 'discount' },
    19: { count: [4, 4], price: 'half', maxPrice: 99, cap: 19000, up: 0, pay: 'multi' },
    20: { count: [4, 5], price: 'mix', maxPrice: 99, cap: 19000, up: 0.3, special: 'any', pay: 'any' }
  };

  var TWO_NOTES = [[2000, 2000], [5000, 2000], [5000, 5000], [10000, 2000], [10000, 5000], [20000, 5000], [20000, 10000]];

  function itemCount(L, cfg, kind, R) {
    if (L === 1 && kind === 'change') return R.randInt(1, 2);
    return R.randInt(cfg.count[0], cfg.count[1]);
  }

  function price(item, type, R) {
    var lo = item[1], hi = item[2];
    if (type === 'whole') return R.randInt(lo, hi) * 100;
    if (type === 'half') return R.randInt(lo * 2, hi * 2) * 50;
    var r = R.randInt(1, 10);
    if (r <= 6) return R.randInt(lo, hi - 1) * 100 + 90;
    if (r <= 8) return R.randInt(lo, hi - 1) * 100 + 50;
    return R.randInt(lo, hi) * 100;
  }

  function swapShekels(ag) {
    var sh = Math.floor(ag / 100), r = ag % 100;
    var s = String(sh);
    if (s.length !== 2 || s.charAt(0) === s.charAt(1) || s.charAt(1) === '0') return null;
    return parseInt(s.charAt(1) + s.charAt(0), 10) * 100 + r;
  }

  function makeDistractors(ans, frac, upper, R, extras) {
    var seen = {}; seen[ans] = true;
    var out = [];
    function take(v) {
      if (typeof v === 'number' && v === Math.round(v) && v > 0 && v < upper && !seen[v] && out.length < 3) { seen[v] = true; out.push(v); }
    }
    // a mistake typical for the special offer (ignoring the deal / the discount) comes first
    R.shuffle((extras || []).slice()).forEach(function (v) { if (out.length < 1) take(v); });
    var smart = [swapShekels(ans), ans + 1000, ans - 1000];
    if (frac) smart.push(ans + 100, ans - 100);
    smart = R.shuffle(smart.filter(function (v) { return v !== null; }));
    if (smart.length) take(smart[0]);
    var near = frac === 'ninety' ? [ans + 100, ans - 100, ans + 10, ans - 10, ans + 200, ans - 200]
      : frac === 'half' ? [ans + 100, ans - 100, ans + 50, ans - 50, ans + 200, ans - 200]
      : [ans + 100, ans - 100, ans + 200, ans - 200, ans + 1000, ans - 1000];
    R.shuffle(near).forEach(take);
    var g = 0;
    while (out.length < 3 && g++ < 60) take(ans + R.randInt(3, 9) * 100 * (R.randInt(0, 1) ? 1 : -1));
    return out;
  }

  /* "2 ב־₪10": several units for one price. Returns the line plus the typical mistakes' line prices. */
  function dealLine(it, R) {
    var n = R.pick([2, 3]);
    var deal = Math.max(n, n * R.randInt(it[1], it[2]) - R.randInt(1, n));
    var m = R.randInt(1, 2), qty = n * m;
    var dealText = n + ' ב־' + moneyText(deal * 100);
    return {
      name: it[0] + ', ' + qty + ' יח׳',
      tag: 'מבצע: ' + dealText,
      price: m * deal * 100,
      priceText: null,
      explain: it[0] + ': ' + qty + ' יחידות במבצע ' + dealText + ' = ' + moneyText(m * deal * 100),
      hint: 'שימו לב למבצע: "' + dealText + '" זה ' + n + ' יחידות ביחד ב־' + moneyText(deal * 100) + '.',
      wrongPrices: [qty * deal * 100, m === 2 ? deal * 100 : null]
    };
  }

  /* "20% הנחה" on one item, whole-shekel shelf price */
  function discountLine(it, R) {
    var pct = R.pick([10, 20, 25, 50]);
    var mult = pct === 25 ? 4 : pct === 50 ? 2 : 5;
    var lo = Math.ceil(it[1] / mult), hi = Math.max(lo, Math.floor(it[2] / mult));
    var shelf = R.randInt(lo, hi) * mult;
    var paid = shelf * (100 - pct); // agorot
    return {
      name: it[0],
      tag: pct + '% הנחה',
      price: paid,
      priceText: money(shelf * 100),
      explain: it[0] + ': ' + moneyText(shelf * 100) + ' פחות ' + pct + '% = ' + moneyText(paid),
      hint: 'שימו לב: "' + pct + '% הנחה" אומר שמורידים ' + pct + '% מהמחיר שעל המדף.',
      wrongPrices: [shelf * 100, shelf > pct ? (shelf - pct) * 100 : null, shelf * pct]
    };
  }

  function coinsFor(ag) {
    var out = [];
    [500, 200, 100, 50].forEach(function (c) { while (ag >= c) { out.push(c); ag -= c; } });
    return out;
  }

  function smallestNoteIdx(total) {
    var idx = 0;
    while (idx < NOTES.length - 1 && NOTES[idx] * 100 <= total) idx++;
    return idx;
  }

  /* What the player hands over: one note, two notes, or a note plus coins (for round change). */
  function choosePay(total, cfg, R) {
    var mode = cfg.pay === 'multi' ? R.pick(['notes', 'coins'])
      : cfg.pay === 'any' ? R.pick(['one', 'notes', 'coins']) : 'one';
    var order = mode === 'one' ? [] : mode === 'notes' ? ['notes', 'coins'] : ['coins', 'notes'];
    for (var i = 0; i < order.length; i++) {
      if (order[i] === 'notes') {
        for (var j = 0; j < TWO_NOTES.length; j++) {
          var c = TWO_NOTES[j];
          if (Math.max(c[0], c[1]) < total && total < c[0] + c[1]) return c.slice();
        }
      } else {
        var rest = total % 1000;
        if (total % 50 === 0 && rest !== 0 && total >= 1000) {
          var nt = NOTES[smallestNoteIdx(total)] * 100;
          if (nt > total) return [nt].concat(coinsFor(rest));
        }
      }
    }
    var idx = smallestNoteIdx(total);
    if (cfg.up && idx < NOTES.length - 1 && R.randInt(1, 100) <= cfg.up * 100) idx++;
    return [NOTES[idx] * 100];
  }

  function makeQuestion(level, R, kind) {
    var L = Math.max(1, Math.min(MAX_L, level | 0)) || 1;
    var cfg = LEVELS[L] || LEVELS[1];
    kind = kind || (R.randInt(0, 1) ? 'total' : 'change');
    var pool = ITEMS.filter(function (it) { return it[2] <= cfg.maxPrice; });
    var count = itemCount(L, cfg, kind, R);
    var special = cfg.special === 'any' ? R.pick(['deal', 'discount', null]) : (cfg.special || null);
    var lines, total, spec, tries = 0;
    do {
      spec = null;
      var plain = R.shuffle(pool);
      if (special) {
        var sItem = R.pick(ITEMS.filter(function (it) { return special === 'deal' ? it[2] <= 12 : it[2] >= 10; }));
        plain = plain.filter(function (it) { return it !== sItem; });
        spec = special === 'deal' ? dealLine(sItem, R) : discountLine(sItem, R);
      }
      lines = plain.slice(0, special ? count - 1 : count).map(function (it) { return { name: it[0], price: price(it, cfg.price, R) }; });
      if (spec) lines.splice(R.randInt(0, lines.length), 0, spec);
      total = lines.reduce(function (s, x) { return s + x.price; }, 0);
    } while (total > cfg.cap && tries++ < 40);

    var pay = choosePay(total, cfg, R);
    var note = pay.reduce(function (s, x) { return s + x; }, 0);
    var change = note - total;
    var frac = lines.some(function (x) { return x.price % 100 === 90; }) ? 'ninety'
      : lines.some(function (x) { return x.price % 100 !== 0; }) ? 'half' : '';
    var ans = kind === 'total' ? total : change;
    var upper = kind === 'total' ? 100000 : note;
    var extras = [];
    if (spec) {
      spec.wrongPrices.forEach(function (wp) {
        if (wp === null || wp === spec.price) return;
        var wrongTotal = total - spec.price + wp;
        extras.push(kind === 'total' ? wrongTotal : note - wrongTotal);
      });
    }
    var hints = [];
    if (spec) hints.push(spec.hint);
    if (kind === 'change' && pay.length > 1) hints.push('משלמים בכמה שטרות ומטבעות: חברו אותם קודם.');
    return {
      kind: kind,
      lines: lines,
      total: total,
      note: note,
      pay: pay,
      change: change,
      answer: ans,
      hint: hints.length ? hints.join(' ') : null,
      special: spec ? spec.explain : null,
      choices: R.shuffle([ans].concat(makeDistractors(ans, frac, upper, R, extras)))
    };
  }

  var NOTE_TONES = { 20: 'sc-n20', 50: 'sc-n50', 100: 'sc-n100', 200: 'sc-n200' };

  BrainGames.register({
    id: 'shop-change',
    name: 'עודף בקופה',
    skill: 'logic',
    tagline: 'חשבו כמה עולה הקנייה וכמה עודף מגיע',
    benefit: 'חשבון שימושי ליום־יום וזיכרון עבודה',
    instructions: [
      'קראו את רשימת הקניות ואת המחירים.',
      'שימו לב באיזה שטר משלמים.',
      'ענו על השאלה: כמה עולה הכול יחד, או כמה עודף תקבלו.',
      'בחרו את התשובה הנכונה, ולחצו "לשאלה הבאה" כשתהיו מוכנים.'
    ],
    css: [
      '.sc-scene{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:1rem 1.5rem;width:100%}',
      '.sc-receipt{background:var(--surface-2);border:1px solid var(--line);border-radius:var(--radius-sm);padding:.8rem 1rem;width:100%;max-width:18rem}',
      '.sc-receipt-title{font-weight:800;text-align:center;color:var(--ink-soft);border-bottom:2px dashed var(--line);padding-bottom:.35rem;margin-bottom:.35rem}',
      '.sc-row{display:flex;justify-content:space-between;align-items:baseline;gap:1rem;font-size:1.2rem;padding:.2rem 0}',
      '.sc-price{font-weight:800;font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:isolate;white-space:nowrap}',
      '.sc-sum{border-top:2px dashed var(--line);margin-top:.35rem;padding-top:.45rem;font-weight:800}',
      '.sc-sum .sc-price{color:var(--accent)}',
      '.sc-pay{display:flex;flex-direction:column;align-items:center;gap:.4rem}',
      '.sc-pay-label{color:var(--ink-soft);font-weight:700}',
      '.sc-note{--sc-c:var(--language);--sc-s:var(--language-soft);display:flex;align-items:center;justify-content:center;gap:.6rem;',
      'min-width:10rem;min-height:5rem;padding:.6rem 1.2rem;border-radius:10px;background:var(--sc-s);color:var(--sc-c);',
      'border:2px solid var(--sc-c);box-shadow:inset 0 0 0 .3rem var(--sc-s),inset 0 0 0 .45rem var(--sc-c)}',
      '.sc-note-value{font-family:var(--font-display);font-weight:900;font-size:2.2rem;line-height:1;direction:ltr;unicode-bidi:isolate}',
      '.sc-note-seal{width:1.6rem;height:1.6rem;border-radius:50%;border:2px solid var(--sc-c);flex:none}',
      '.sc-name{display:flex;flex-direction:column;gap:.15rem}',
      '.sc-tag{align-self:flex-start;font-size:.95rem;font-weight:800;color:var(--ink);border:1px solid var(--accent);background:var(--accent-soft);',
      'border-radius:var(--radius-sm);padding:.05rem .45rem}',
      '.sc-pay-items{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:.6rem;max-width:100%}',
      '.sc-coin{display:grid;place-items:center;width:3.8rem;height:3.8rem;border-radius:50%;background:var(--sun-soft);color:var(--ink);',
      'border:3px solid var(--sun);font-weight:900;font-size:1.05rem;font-variant-numeric:tabular-nums;flex:none}',
      '.sc-n20{--sc-c:var(--attention);--sc-s:var(--attention-soft)}',
      '.sc-n50{--sc-c:var(--language);--sc-s:var(--language-soft)}',
      '.sc-n100{--sc-c:var(--ink);--sc-s:var(--sun-soft)}',
      '.sc-n200{--sc-c:var(--logic);--sc-s:var(--logic-soft)}',
      '.sc-choices{grid-template-columns:repeat(2,minmax(0,1fr));max-width:26rem}',
      '.sc-choices .g-choice{font-size:1.5rem;font-variant-numeric:tabular-nums;padding-inline:.5rem}',
      '.sc-after{display:flex;flex-direction:column;align-items:center;gap:.75rem;width:100%}',
      '.sc-after:empty{display:none}',
      '.sc-explain{font-size:1.2rem;font-weight:700;text-align:center;background:var(--sun-soft);color:var(--ink);',
      'padding:.8rem 1.1rem;border-radius:var(--radius);max-width:100%;text-wrap:balance}'
    ].join(''),
    generate: makeQuestion,
    start: function (root, ctx) {
      var round = 0;
      var correct = 0;
      var firstKind = ctx.randInt(0, 1) ? 'total' : 'change';

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: correct, total: ROUNDS, note: 'עניתם נכון על ' + correct + ' חשבונות קנייה מתוך ' + ROUNDS + '.' });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var kind = (round % 2 === 1) === (firstKind === 'total') ? 'total' : 'change';
        var q = makeQuestion(ctx.level, ctx, kind);
        var question = kind === 'total' ? 'כמה עולה הכול יחד?' : 'כמה עודף תקבלו?';
        ctx.setStatus(q.hint || question);

        root.innerHTML = '';
        var sumPrice = ctx.el('span', { class: 'sc-price', dir: 'ltr' }, '?');
        var receipt = ctx.el('div', { class: 'sc-receipt' }, [ctx.el('div', { class: 'sc-receipt-title' }, 'קבלה')]
          .concat(q.lines.map(function (x) {
            var nameEl = x.tag
              ? ctx.el('span', { class: 'sc-name' }, [x.name, ctx.el('span', { class: 'sc-tag' }, x.tag)])
              : ctx.el('span', null, x.name);
            return ctx.el('div', { class: 'sc-row' }, [
              nameEl,
              x.tag && !x.priceText ? null : ctx.el('span', { class: 'sc-price', dir: 'ltr' }, x.priceText || money(x.price))
            ]);
          }))
          .concat([ctx.el('div', { class: 'sc-row sc-sum' }, [ctx.el('span', null, 'סך הכול'), sumPrice])]));
        var notes = 0;
        var payEls = q.pay.map(function (v) {
          if (v >= 2000) {
            notes++;
            return ctx.el('div', { class: 'sc-note ' + (NOTE_TONES[v / 100] || ''), role: 'img', 'aria-label': 'שטר של ' + (v / 100) + ' שקלים' }, [
              ctx.el('span', { class: 'sc-note-seal', 'aria-hidden': 'true' }),
              ctx.el('span', { class: 'sc-note-value', dir: 'ltr' }, money(v))
            ]);
          }
          return ctx.el('div', { class: 'sc-coin', role: 'img', dir: 'ltr', 'aria-label': v === 50 ? 'מטבע של חצי שקל' : 'מטבע של ' + (v / 100) + ' שקלים' }, money(v));
        });
        var payLabel = q.pay.length === 1 ? 'משלמים בשטר:' : notes === q.pay.length ? 'משלמים בשטרות:' : 'משלמים בשטר ובמטבעות:';
        root.appendChild(ctx.el('div', { class: 'sc-scene' }, [
          receipt,
          ctx.el('div', { class: 'sc-pay' }, [ctx.el('span', { class: 'sc-pay-label' }, payLabel),
            ctx.el('div', { class: 'sc-pay-items' }, payEls)])
        ]));
        root.appendChild(ctx.el('p', { class: 'g-prompt' }, question));

        var buttons = [];
        var answered = false;
        var grid = ctx.el('div', { class: 'g-choices sc-choices' });
        q.choices.forEach(function (val) {
          var b = ctx.el('button', {
            class: 'g-choice', type: 'button', dir: 'ltr',
            onclick: function () { choose(val, b); }
          }, money(val));
          buttons.push({ val: val, btn: b });
          grid.appendChild(b);
        });
        root.appendChild(grid);
        var after = ctx.el('div', { class: 'sc-after', 'aria-live': 'polite' });
        root.appendChild(after);

        function choose(val, btn) {
          if (answered) return;
          answered = true;
          buttons.forEach(function (o) {
            o.btn.disabled = true;
            if (o.val === q.answer) o.btn.classList.add('is-correct');
          });
          sumPrice.textContent = money(q.total);
          var ok = val === q.answer;
          if (ok) correct++;
          else btn.classList.add('is-wrong');

          var summary = 'סך הכול ' + moneyText(q.total) + ', ועודף ' + moneyText(q.change);
          var paid = q.pay.length > 1
            ? 'שילמתם ' + ltr(q.pay.map(money).join(' + ') + ' = ' + money(q.note)) + '. '
            : '';
          var detail = (q.special ? q.special + '. ' : '') + (kind === 'total'
            ? 'סך הכול: ' + ltr(q.lines.map(function (x) { return money(x.price); }).join(' + ') + ' = ' + money(q.total))
            : 'סך הכול ' + moneyText(q.total) + '. ' + paid + 'העודף: ' + ltr(money(q.note) + ' − ' + money(q.total) + ' = ' + money(q.change)));
          after.appendChild(ctx.el('p', { class: 'sc-explain' },
            (ok ? '' : 'התשובה הנכונה: ' + moneyText(q.answer) + '. ') + detail));
          var nextBtn = ctx.el('button', {
            class: 'btn btn-primary btn-lg', type: 'button',
            onclick: function () { nextBtn.disabled = true; nextRound(); }
          }, round >= ROUNDS ? 'לסיכום' : 'לשאלה הבאה');
          after.appendChild(nextBtn);
          ctx.feedback(ok, (ok ? 'נכון! ' : '') + summary);
        }
      }

      nextRound();
    }
  });
})();
