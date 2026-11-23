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

  var MAX_L = 50;

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
    20: { count: [4, 5], price: 'mix', maxPrice: 99, cap: 19000, up: 0.3, special: 'any', pay: 'any' },
    // 21–30: prices in any 10 agorot (₪12.40), and two special offers on one receipt ('both');
    // never more than five lines, so the receipt still fits the screen
    21: { count: [4, 4], price: 'odd', maxPrice: 99, cap: 19000, up: 0.3, pay: 'any' },
    22: { count: [4, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.3, pay: 'any' },
    23: { count: [3, 4], price: 'mix', maxPrice: 99, cap: 19000, up: 0.3, special: 'both', pay: 'any' },
    24: { count: [4, 4], price: 'mix', maxPrice: 99, cap: 19000, up: 0.3, special: 'both', pay: 'any' },
    25: { count: [4, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.3, special: 'any', pay: 'any' },
    26: { count: [3, 4], price: 'odd', maxPrice: 99, cap: 19000, up: 0.3, special: 'both', pay: 'any' },
    27: { count: [4, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.3, special: 'both', pay: 'multi' },
    28: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.4, special: 'any', pay: 'any' },
    29: { count: [4, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.4, special: 'both', pay: 'any' },
    30: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.4, special: 'both', pay: 'any' },
    // 31–40: new offers: sold by weight ('weight': "₪8 לק״ג", 1.5 ק״ג) and "the second at half price" ('half');
    // offers: how many offer lines [min, max], picked from pool; coupon: chance of a "₪10 off" line on the receipt
    31: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.4, offers: [2, 2], pool: ['deal', 'discount', 'weight'], pay: 'any' },
    32: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.4, offers: [2, 2], pool: ['deal', 'discount', 'weight', 'half'], pay: 'any' },
    33: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.4, offers: [2, 2], pool: ['deal', 'discount', 'weight', 'half'], pay: 'multi' },
    34: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.4, offers: [2, 2], pool: ['deal', 'discount', 'weight', 'half'], coupon: 0.3, pay: 'any' },
    35: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.4, offers: [2, 3], pool: ['deal', 'discount', 'weight', 'half'], coupon: 0.3, pay: 'any' },
    36: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.4, offers: [3, 3], pool: ['deal', 'discount', 'weight', 'half'], coupon: 0.3, pay: 'any' },
    37: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.4, offers: [3, 3], pool: ['deal', 'discount', 'weight', 'half'], coupon: 0.4, pay: 'multi' },
    38: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.4, offers: [3, 3], pool: ['deal', 'discount', 'weight', 'half'], coupon: 0.5, pay: 'any' },
    39: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.5, offers: [3, 3], pool: ['deal', 'discount', 'weight', 'half'], coupon: 0.5, pay: 'any' },
    40: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.5, offers: [3, 3], pool: ['deal', 'discount', 'weight', 'half'], coupon: 0.6, pay: 'any' },
    // 41–50: no hint in the status line any more (the tags on the receipt must be read), and up to four offers
    41: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.4, offers: [3, 3], pool: ['deal', 'discount', 'weight', 'half'], coupon: 0.5, pay: 'any', noHint: true },
    42: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.4, offers: [3, 3], pool: ['deal', 'discount', 'weight', 'half'], coupon: 0.5, pay: 'multi', noHint: true },
    43: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.5, offers: [3, 3], pool: ['deal', 'discount', 'weight', 'half'], coupon: 0.6, pay: 'any', noHint: true },
    44: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.5, offers: [3, 3], pool: ['deal', 'discount', 'weight', 'half'], coupon: 0.7, pay: 'any', noHint: true },
    45: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.5, offers: [3, 3], pool: ['deal', 'discount', 'weight', 'half'], coupon: 0.7, pay: 'multi', noHint: true },
    46: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.5, offers: [3, 4], pool: ['deal', 'discount', 'weight', 'half'], coupon: 0.7, pay: 'any', noHint: true },
    47: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.5, offers: [3, 4], pool: ['deal', 'discount', 'weight', 'half'], coupon: 0.8, pay: 'any', noHint: true },
    48: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.5, offers: [3, 4], pool: ['deal', 'discount', 'weight', 'half'], coupon: 0.8, pay: 'multi', noHint: true },
    49: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.5, offers: [4, 4], pool: ['deal', 'discount', 'weight', 'half'], coupon: 0.9, pay: 'any', noHint: true },
    50: { count: [5, 5], price: 'odd', maxPrice: 99, cap: 19000, up: 0.5, offers: [4, 4], pool: ['deal', 'discount', 'weight', 'half'], coupon: 1, pay: 'any', noHint: true }
  };

  // items sold by weight (price per kilo)
  var BY_WEIGHT = ['עגבניות', 'תפוחים', 'בננות', 'מלפפונים'];

  var TWO_NOTES = [[2000, 2000], [5000, 2000], [5000, 5000], [10000, 2000], [10000, 5000], [20000, 5000], [20000, 10000]];

  function itemCount(L, cfg, kind, R) {
    if (L === 1 && kind === 'change') return R.randInt(1, 2);
    return R.randInt(cfg.count[0], cfg.count[1]);
  }

  function price(item, type, R) {
    var lo = item[1], hi = item[2];
    if (type === 'whole') return R.randInt(lo, hi) * 100;
    if (type === 'half') return R.randInt(lo * 2, hi * 2) * 50;
    if (type === 'odd') { // any 10 agorot, mostly not round: ₪12.40, ₪7.80
      var ag = R.randInt(lo * 10, hi * 10 - 1) * 10;
      if (ag % 100 === 0) ag += R.pick([20, 40, 60, 80]);
      return ag;
    }
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
      hint: 'מבצע: ' + n + ' יחידות ב־' + moneyText(deal * 100) + '.',
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
      hint: 'הנחה: מורידים ' + pct + '% מהמחיר.',
      wrongPrices: [shelf * 100, shelf > pct ? (shelf - pct) * 100 : null, shelf * pct]
    };
  }

  /* sold by weight: "₪8 לק״ג", 1.5 ק״ג */
  function weightLine(it, R) {
    var perKg = R.randInt(it[1], it[2]);
    var w = R.pick([0.5, 1.5, 2, 2.5]);
    var wText = w === 0.5 ? 'חצי' : ltr(String(w));
    var paid = Math.round(perKg * w * 100);
    return {
      name: it[0] + ', ' + wText + ' ק״ג',
      tag: moneyText(perKg * 100) + ' לק״ג',
      price: paid,
      priceText: null,
      explain: it[0] + ': ' + (w === 0.5 ? 'חצי ק״ג' : ltr(String(w)) + ' ק״ג') + ' כפול ' + moneyText(perKg * 100) + ' = ' + moneyText(paid),
      hint: 'מחיר לפי משקל: כופלים את המחיר לק״ג במשקל.',
      wrongPrices: [perKg * 100, Math.floor(w) ? Math.floor(w) * perKg * 100 : null, Math.ceil(w) * perKg * 100]
    };
  }

  /* two units, "the second at half price" */
  function halfLine(it, R) {
    var unit = R.randInt(it[1], it[2]) * 100;
    var paid = unit * 3 / 2;
    return {
      name: it[0] + ', 2 יח׳ ב־' + moneyText(unit),
      tag: 'השני בחצי מחיר',
      price: paid,
      priceText: null,
      explain: it[0] + ': ' + moneyText(unit) + ' ועוד חצי, ' + moneyText(unit / 2) + ' = ' + moneyText(paid),
      hint: 'השני בחצי מחיר: משלמים על יחידה אחת וחצי.',
      wrongPrices: [unit * 2, unit, unit / 2]
    };
  }

  /* a coupon on the whole purchase: "קופון הנחה −₪10" */
  function couponLine(R) {
    var v = R.pick([500, 1000, 1000, 1500, 2000]);
    return {
      name: 'קופון: מורידים ' + moneyText(v),
      coupon: true,
      price: -v,
      priceText: '',
      explain: 'קופון: מורידים ' + moneyText(v),
      hint: 'יש קופון: מורידים אותו מהסכום.',
      wrongPrices: [0, v]
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
    var kindsOf = special === 'both' ? ['deal', 'discount'] : special ? [special] : [];
    if (cfg.offers) kindsOf = R.shuffle(cfg.pool.slice()).slice(0, R.randInt(cfg.offers[0], cfg.offers[1]));
    var withCoupon = !!cfg.coupon && R.randInt(1, 100) <= cfg.coupon * 100;
    var lines, total, specs, tries = 0;
    do {
      specs = [];
      var plain = R.shuffle(pool);
      kindsOf.forEach(function (sk) {
        var sItem = R.pick(ITEMS.filter(function (it) {
          var fit = sk === 'deal' ? it[2] <= 12 : sk === 'weight' ? BY_WEIGHT.indexOf(it[0]) !== -1
            : sk === 'half' ? it[2] <= 25 : it[2] >= 10;
          return fit && plain.indexOf(it) !== -1;
        }));
        plain = plain.filter(function (it) { return it !== sItem; });
        specs.push(sk === 'deal' ? dealLine(sItem, R) : sk === 'weight' ? weightLine(sItem, R)
          : sk === 'half' ? halfLine(sItem, R) : discountLine(sItem, R));
      });
      // never more than five lines on the receipt (the coupon line counts too)
      var nPlain = Math.max(cfg.offers ? 0 : 1, count - specs.length - (withCoupon ? 1 : 0));
      lines = plain.slice(0, nPlain).map(function (it) { return { name: it[0], price: price(it, cfg.price, R) }; });
      specs.forEach(function (sp) { lines.splice(R.randInt(0, lines.length), 0, sp); });
      if (withCoupon) { var cp = couponLine(R); specs.push(cp); lines.push(cp); }
      total = lines.reduce(function (s, x) { return s + x.price; }, 0);
    } while ((total > cfg.cap || (withCoupon && total < 1000)) && tries++ < 40);

    var pay = choosePay(total, cfg, R);
    var note = pay.reduce(function (s, x) { return s + x; }, 0);
    var change = note - total;
    var frac = lines.some(function (x) { return x.price % 100 === 90 || x.price % 50 !== 0; }) ? 'ninety'
      : lines.some(function (x) { return x.price % 100 !== 0; }) ? 'half' : '';
    var ans = kind === 'total' ? total : change;
    var upper = kind === 'total' ? 100000 : note;
    var extras = [];
    specs.forEach(function (sp) {
      sp.wrongPrices.forEach(function (wp) {
        if (wp === null || wp === sp.price) return;
        var wrongTotal = total - sp.price + wp;
        extras.push(kind === 'total' ? wrongTotal : note - wrongTotal);
      });
    });
    var hints = [];
    // one offer: explain it in the status line; two offers: the tags on the receipt lines say enough
    if (cfg.noHint) { /* 41–50: the receipt says it all */ }
    else if (specs.length === 1) hints.push(specs[0].hint);
    else if (specs.length > 1) {
      var nOffers = specs.filter(function (sp) { return !sp.coupon; }).length;
      hints.push('יש ' + nOffers + ' מבצעים' + (nOffers < specs.length ? ' וקופון.' : '.'));
    }
    // one hint at most, so the status stays one line on a phone (the payment row says "משלמים בשטרות")
    if (kind === 'change' && pay.length > 1 && !hints.length && !cfg.noHint) hints.push('חברו את השטרות.');
    return {
      kind: kind,
      lines: lines,
      total: total,
      note: note,
      pay: pay,
      change: change,
      answer: ans,
      hint: hints.length ? hints.join(' ') : null,
      // with three offers or more the receipt itself shows each paid price; the line below gives only the sum
      special: specs.length && specs.length <= 2 ? specs.map(function (sp) { return sp.explain; }).join(' · ') : null,
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
      'בחרו את התשובה הנכונה, ולחצו "לשאלה הבאה" כשתהיו מוכנים.',
      'ברמות הגבוהות יש מבצעים: כמה יחידות במחיר אחד, הנחה באחוזים, מחיר לפי ק״ג, "השני בחצי מחיר" וקופון שמורידים מהסכום.'
    ],
    css: [
      '.sc-scene{display:flex;flex-direction:column;align-items:center;gap:.45rem;width:100%}',
      '.sc-receipt{background:var(--surface-2);border:1px solid var(--line);border-radius:var(--radius-sm);padding:.35rem .9rem;width:100%;max-width:20rem}',
      '.sc-row{display:flex;justify-content:space-between;align-items:center;gap:.6rem;font-size:1.15rem;line-height:1.25;padding:.08rem 0}',
      '.sc-price{font-weight:800;font-variant-numeric:tabular-nums;direction:ltr;unicode-bidi:isolate;white-space:nowrap}',
      '.sc-was{text-decoration:line-through;color:var(--ink-soft);font-weight:600;margin-inline-end:.35rem}',
      '.sc-sum{border-top:2px dashed var(--line);margin-top:.2rem;padding-top:.3rem;font-weight:800}',
      '.sc-sum .sc-price{color:var(--accent)}',
      '.sc-pay{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:.6rem}',
      '.sc-pay-label{color:var(--ink-soft);font-weight:700;font-size:1.1rem}',
      /* several notes/coins: the label gets its own line so they share one row */
      '.sc-pay.sc-multi{row-gap:.25rem}.sc-pay.sc-multi .sc-pay-label{flex-basis:100%;text-align:center}',
      '.sc-pay.sc-multi{column-gap:.4rem}.sc-multi .sc-note{min-width:0;padding-inline:.6rem}.sc-multi .sc-note-seal{display:none}',
      /* coins are only shown, not tapped: small enough that a note and four coins share one row */
      '.sc-multi .sc-coin{width:2.5rem;height:2.5rem;font-size:.85rem;border-width:2px}.sc-multi .sc-note-value{font-size:1.5rem}',
      '.sc-note{--sc-c:var(--language);--sc-s:var(--language-soft);display:flex;align-items:center;justify-content:center;gap:.45rem;',
      'min-width:7.5rem;min-height:3.5rem;padding:.35rem .9rem;border-radius:9px;background:var(--sc-s);color:var(--sc-t,var(--sc-c));',
      'border:2px solid var(--sc-c);box-shadow:inset 0 0 0 .22rem var(--sc-s),inset 0 0 0 .34rem var(--sc-c)}',
      '.sc-note-value{font-family:var(--font-display);font-weight:900;font-size:1.75rem;line-height:1;direction:ltr;unicode-bidi:isolate}',
      '.sc-note-seal{width:1.15rem;height:1.15rem;border-radius:50%;border:2px solid var(--sc-c);flex:none}',
      '.sc-name{display:flex;flex-wrap:wrap;align-items:center;gap:.1rem .4rem;min-width:0}',
      '.sc-tag{font-size:1.1rem;font-weight:800;color:var(--ink);border:1px solid var(--accent);background:var(--accent-soft);',
      'border-radius:var(--radius-sm);padding:0 .4rem;white-space:nowrap}',
      '.sc-pay-items{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:.6rem;max-width:100%}',
      '.sc-coin{display:grid;place-items:center;width:3.6rem;height:3.6rem;border-radius:50%;background:var(--sun-soft);color:var(--ink);',
      'border:3px solid var(--sun);font-weight:900;font-size:1.1rem;font-variant-numeric:tabular-nums;flex:none}',
      '.sc-n20{--sc-c:var(--c-red);--sc-s:var(--c-red-soft)}',
      '.sc-n50{--sc-c:var(--c-green);--sc-s:var(--c-green-soft)}',
      '.sc-n100{--sc-c:var(--c-yellow);--sc-s:var(--c-yellow-soft);--sc-t:var(--ink)}',
      '.sc-n200{--sc-c:var(--c-blue);--sc-s:var(--c-blue-soft)}',
      '.sc-ask{margin:0;font-size:1.25rem}',
      '.play-board .g-choices.sc-choices{grid-template-columns:repeat(2,minmax(0,1fr));max-width:26rem}',
      '.play-board .sc-choices .g-choice{font-size:1.5rem;font-variant-numeric:tabular-nums;padding:.3rem .5rem;min-height:3.3rem}',
      '.sc-explain{margin:0;font-size:1.05rem;font-weight:700;text-align:center;background:var(--sun-soft);color:var(--ink);',
      'padding:.35rem .7rem;border-radius:var(--radius-sm);max-width:100%;text-wrap:balance;line-height:1.35}'
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
        var specRows = [];
        var receipt = ctx.el('div', { class: 'sc-receipt', role: 'group', 'aria-label': 'קבלה' }, q.lines.map(function (x) {
          var nameEl = x.tag
            ? ctx.el('span', { class: 'sc-name' }, [x.name, ctx.el('span', { class: 'sc-tag' }, x.tag)])
            : ctx.el('span', null, x.name);
          var priceEl = ctx.el('span', { class: 'sc-price', dir: 'ltr' }, x.coupon || (x.tag && !x.priceText) ? '' : (x.priceText || money(x.price)));
          if (x.tag) specRows.push({ el: priceEl, line: x });
          return ctx.el('div', { class: 'sc-row' }, [nameEl, priceEl]);
        }).concat([ctx.el('div', { class: 'sc-row sc-sum' }, [ctx.el('span', null, 'סך הכול'), sumPrice])]));
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
        var payLabel = q.pay.length === 1 ? 'משלמים בשטר:' : notes === q.pay.length ? 'משלמים בשטרות:' : 'משלמים:';
        var payRow = ctx.el('div', { class: 'sc-pay' + (payEls.length > 1 ? ' sc-multi' : '') }, [ctx.el('span', { class: 'sc-pay-label' }, payLabel)].concat(payEls));
        root.appendChild(ctx.el('div', { class: 'sc-scene' }, [receipt, payRow]));
        // the status line already asks the question unless it carries a hint
        var askEl = q.hint ? ctx.el('p', { class: 'g-prompt sc-ask' }, question) : null;
        if (askEl) root.appendChild(askEl);

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

        function choose(val, btn) {
          if (answered) return;
          answered = true;
          buttons.forEach(function (o) {
            o.btn.disabled = true;
            if (o.val === q.answer) o.btn.classList.add('is-correct');
            // keep only the chosen and the right answer (one row), so the explanation and button fit the screen
            else if (o.btn !== btn) o.btn.style.display = 'none';
          });
          sumPrice.textContent = money(q.total);
          specRows.forEach(function (sr) {
            sr.el.textContent = '';
            if (sr.line.priceText) sr.el.appendChild(ctx.el('span', { class: 'sc-was' }, sr.line.priceText));
            sr.el.appendChild(document.createTextNode(money(sr.line.price)));
          });
          var ok = val === q.answer;
          if (ok) correct++;
          else btn.classList.add('is-wrong');

          // one short line: the special offer (if any) and, for change, the subtraction
          var detail = (q.special ? q.special + '. ' : '') + (kind === 'total'
            ? 'סך הכול: ' + moneyText(q.total)
            : 'העודף: ' + ltr(q.pay.map(money).join(' + ') + ' − ' + money(q.total) + ' = ' + money(q.change)));
          var explain = ctx.el('p', { class: 'sc-explain', 'aria-live': 'polite' }, detail);
          // the explanation (which repeats what was paid) takes the place of the payment row
          payRow.replaceWith(explain);
          if (askEl) askEl.remove();
          var nextBtn = ctx.el('button', {
            class: 'btn btn-primary btn-lg', type: 'button',
            onclick: function () { nextBtn.disabled = true; nextRound(); }
          }, round >= ROUNDS ? 'לסיכום' : 'לשאלה הבאה');
          root.appendChild(nextBtn);
          ctx.feedback(ok, ok ? 'נכון! ' + moneyText(q.answer) : 'התשובה הנכונה: ' + moneyText(q.answer));
          // a correct answer moves on by itself after the toast; after a mistake the button waits
          if (ok) { nextBtn.hidden = true; ctx.wait(2300).then(function () { if (!nextBtn.disabled) { nextBtn.disabled = true; nextRound(); } }); }
        }
      }

      nextRound();
    }
  });
})();
