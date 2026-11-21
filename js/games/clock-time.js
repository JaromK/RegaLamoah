/*
 * מה השעה? — read an analog clock, then calculate with time.
 */
(function () {
  'use strict';

  var ROUNDS = 7;

  function clampLevel(l) {
    l = Math.round(Number(l));
    if (!isFinite(l)) l = 3;
    return Math.max(1, Math.min(50, l));
  }

  /* Isolate a time / math snippet as LTR inside Hebrew text (LRI ... PDI). */
  function ltr(s) { return '⁦' + s + '⁩'; }

  var POOLS = {
    1: ['read0'], 2: ['read0', 'read30'], 3: ['read30', 'read15'], 4: ['read15'], 5: ['read15'],
    6: ['read5'], 7: ['read5'], 8: ['read5', 'later'], 9: ['read5', 'later'],
    10: ['later', 'earlier'], 11: ['later', 'earlier', 'read5'], 12: ['later', 'elapsed'],
    13: ['later', 'earlier', 'elapsed'], 14: ['elapsed', 'later'], 15: ['elapsed', 'later', 'earlier'],
    16: ['read24', 'later24'], 17: ['read24', 'later24', 'elapsed'],
    18: ['read1', 'later24', 'elapsed24'], 19: ['read1', 'later24', 'elapsed24', 'elapsed'],
    20: ['read1', 'later24', 'elapsed24', 'earlier'],
    // 21–30: read the clock yourself and then calculate, earlier in 24-hour time, and across midnight
    21: ['read1', 'laterRead', 'elapsed24'], 22: ['laterRead', 'earlier24', 'later24'],
    23: ['laterRead', 'earlierRead', 'elapsed24'], 24: ['earlier24', 'overnight', 'laterRead'],
    25: ['overnight', 'laterRead', 'earlierRead', 'later24'], 26: ['laterRead', 'overnight', 'earlier24'],
    27: ['earlierRead', 'overnight', 'later24', 'elapsed24'], 28: ['laterRead', 'earlierRead', 'overnight', 'earlier24'],
    29: ['laterRead', 'earlierRead', 'overnight', 'elapsed24', 'earlier24'],
    30: ['laterRead', 'earlierRead', 'overnight', 'earlier24', 'later24'],
    // 31–35: read the clock (with "morning / afternoon / evening") and answer in 24-hour time;
    // the clock shows any minute; time between two clocks with no times written under them
    31: ['laterRead', 'earlierRead', 'overnight', 'earlier24', 'later24Read'],
    32: ['later24Read', 'earlierRead', 'overnight', 'earlier24'],
    33: ['later24Read', 'earlier24Read', 'laterRead', 'overnight'],
    34: ['later24Read', 'earlier24Read', 'elapsedAny', 'overnight'],
    35: ['later24Read', 'earlier24Read', 'elapsedAny', 'earlierRead', 'overnightAny'],
    // 36–40: two steps in one story (walk there, then shop; or work back from when you must arrive)
    36: ['chain', 'later24Read', 'elapsedAny', 'overnightAny'],
    37: ['chain', 'earlier24Read', 'elapsedAny', 'overnightAny'],
    38: ['chain', 'later24Read', 'earlier24Read', 'elapsedAny', 'overnightAny'],
    39: ['chain', 'chainBack', 'later24Read', 'elapsedAny', 'overnightAny'],
    40: ['chain', 'chainBack', 'earlier24Read', 'elapsedAny', 'overnightAny'],
    // 41–45: how long between a morning clock and an afternoon clock (read both, cross noon)
    41: ['chain', 'chainBack', 'elapsed24Read', 'later24Read', 'overnightAny'],
    42: ['chainBack', 'elapsed24Read', 'earlier24Read', 'elapsedAny', 'chain'],
    43: ['chain', 'chainBack', 'elapsed24Read', 'overnightAny', 'earlier24Read'],
    44: ['chain', 'chainBack', 'elapsed24Read', 'elapsedAny', 'later24Read'],
    45: ['chain', 'chainBack', 'elapsed24Read', 'overnightAny', 'earlier24Read'],
    // 46–50: two-step stories read from the clock and answered in 24-hour time, any minute
    46: ['chain24', 'chainBack', 'elapsed24Read', 'overnightAny', 'later24Read'],
    47: ['chain24', 'chainBack24', 'elapsed24Read', 'chain', 'earlier24Read'],
    48: ['chain24', 'chainBack24', 'elapsed24Read', 'overnightAny', 'chainBack'],
    49: ['chain24', 'chainBack24', 'elapsed24Read', 'overnightAny'],
    50: ['chain24', 'chainBack24', 'elapsed24Read', 'overnightAny', 'chainBack']
  };

  var HOURS = ['', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר', 'אחת־עשרה', 'שתים־עשרה'];

  /* ---------- time helpers (t = minutes since 0:00) ---------- */
  function norm12(t) { return ((t % 720) + 720) % 720; }
  function hour12(t) { var h = Math.floor(norm12(t) / 60); return h === 0 ? 12 : h; }
  function minOf(t) { return ((t % 60) + 60) % 60; }
  function pad(m) { return (m < 10 ? '0' : '') + m; }
  function fmt12(t) { return hour12(t) + ':' + pad(minOf(t)); }
  function fmt24(t) { t = ((t % 1440) + 1440) % 1440; return Math.floor(t / 60) + ':' + pad(minOf(t)); }

  function words(t) {
    var h = hour12(t), m = minOf(t), next = HOURS[hour12(t + 60)], H = HOURS[h];
    switch (m) {
      case 0: return H + ' בדיוק';
      case 5: return H + ' וחמש';
      case 10: return H + ' ועשרה';
      case 15: return H + ' ורבע';
      case 20: return H + ' ועשרים';
      case 25: return H + ' עשרים וחמש';
      case 30: return H + ' וחצי';
      case 35: return H + ' שלושים וחמש';
      case 40: return 'עשרים ל' + next;
      case 45: return 'רבע ל' + next;
      case 50: return 'עשרה ל' + next;
      case 55: return 'חמש ל' + next;
      default: return '';
    }
  }

  function dur(d) {
    var h = Math.floor(d / 60), m = d % 60;
    if (h === 0) return m === 15 ? 'רבע שעה' : m === 30 ? 'חצי שעה' : m === 1 ? 'דקה אחת' : m + ' דקות';
    var hw = h === 1 ? 'שעה' : h === 2 ? 'שעתיים' : h + ' שעות';
    if (m === 0) return hw;
    if (m === 15) return hw + ' ורבע';
    if (m === 30) return hw + ' וחצי';
    return hw + ' ו־' + m + ' דקות';
  }

  /* ---------- explanations ---------- */
  function readExplain(t) {
    var h = hour12(t), m = minOf(t);
    var minPart;
    if (m === 0) minPart = 'על 12 (שעה עגולה)';
    else if (m % 5 === 0) minPart = 'על ' + (m / 5) + ' = ' + m + ' דקות';
    else minPart = (m % 5 === 1 ? 'שנתה אחת' : (m % 5) + ' שנתות') + ' אחרי ה־' + (Math.floor(m / 5) || 12) + ' = ' + m + ' דקות';
    return 'המחוג הקצר ' + (m === 0 ? 'על ' : 'אחרי ה־') + h + ', הארוך ' + minPart + '.';
  }

  /* Short step-by-step chain: "3:45 ועוד שעתיים = 5:45, ועוד 15 דקות = 6:00, ועוד 20 דקות = 6:20." */
  function addExplain(t, d, f) {
    var parts = [];
    var cur = t, h = Math.floor(d / 60), r = d % 60;
    if (h > 0) { cur += h * 60; parts.push('ועוד ' + dur(h * 60) + ' = ' + ltr(f(cur))); }
    if (r > 0) {
      var m = minOf(cur);
      if (m > 0 && m + r > 60) {
        var x = 60 - m;
        cur += x;
        parts.push('ועוד ' + x + ' דקות = ' + ltr(f(cur)));
        r -= x;
      }
      parts.push('ועוד ' + dur(r) + ' = ' + ltr(f(t + d)));
    }
    return ltr(f(t)) + ' ' + parts.join(', ') + '.';
  }

  function subExplain(t, d, f) {
    var parts = [];
    var cur = t, h = Math.floor(d / 60), r = d % 60;
    if (h > 0) { cur -= h * 60; parts.push('פחות ' + dur(h * 60) + ' = ' + ltr(f(cur))); }
    if (r > 0) {
      var m = minOf(cur);
      if (m > 0 && r > m) {
        cur -= m;
        parts.push('פחות ' + m + ' דקות = ' + ltr(f(cur)));
        r -= m;
      }
      parts.push('פחות ' + dur(r) + ' = ' + ltr(f(t - d)));
    }
    return ltr(f(t)) + ' ' + parts.join(', ') + '.';
  }

  function elapsedExplain(t1, t2, f) {
    var d = t2 - t1;
    var m1 = minOf(t1);
    var firstRound = m1 === 0 ? t1 : t1 + (60 - m1);
    if (firstRound > t2) return 'מ־' + ltr(f(t1)) + ' עד ' + ltr(f(t2)) + ': ' + dur(d) + '.';
    var parts = [];
    if (firstRound > t1) parts.push('עד ' + ltr(f(firstRound)) + ': ' + dur(firstRound - t1));
    var lastRound = t2 - minOf(t2);
    if (lastRound > firstRound) parts.push('עד ' + ltr(f(lastRound)) + ': ' + dur(lastRound - firstRound));
    if (t2 > lastRound) parts.push('עד ' + ltr(f(t2)) + ': ' + dur(t2 - lastRound));
    return 'מ־' + ltr(f(t1)) + ' ' + parts.join(', ') + '. ביחד: ' + dur(d) + '.';
  }

  /* ---------- choices ---------- */
  function pickDistinct(answerKey, cands, keyFn, R, fallback) {
    var seen = {}; seen[answerKey] = true;
    var out = [];
    cands.forEach(function (c) {
      if (c === null || c === undefined || out.length >= 3) return;
      var k = keyFn(c);
      if (k && !seen[k]) { seen[k] = true; out.push(c); }
    });
    var g = 0;
    while (out.length < 3 && g++ < 200) {
      var c = fallback();
      var k = keyFn(c);
      if (k && !seen[k]) { seen[k] = true; out.push(c); }
    }
    return out;
  }

  function swappedHands(t) {
    var m = minOf(t), h = Math.floor(norm12(t) / 60);
    if (m % 5 !== 0) return null;
    return ((m / 5) % 12) * 60 + h * 5;
  }

  function timeQ(L, R, kind) {
    var h = R.randInt(1, 12), m;
    if (kind === 'read0') m = 0;
    else if (kind === 'read30') m = L <= 2 && R.randInt(0, 2) === 0 ? 0 : 30;
    else if (kind === 'read15') m = R.pick(L <= 3 ? [15, 30, 45] : [15, 45, 15, 45, 30, 0]);
    else if (kind === 'read5') m = R.pick([5, 10, 20, 25, 35, 40, 50, 55, 15, 45]);
    else { do { m = R.randInt(1, 59); } while (m % 5 === 0); }
    var t = norm12(h * 60 + m);
    var cands;
    if (kind === 'read0') cands = R.shuffle([t + 60, t - 60, swappedHands(t)]).concat([t + 120, t - 120, t + 180]);
    else if (kind === 'read30') cands = R.shuffle([t + 60, swappedHands(t), t - 60]).concat([t + 30, t - 30]);
    else if (kind === 'read15') cands = (L <= 3 ? R.shuffle([t + 60, swappedHands(t), t - 60]) : R.shuffle([t + 60, h * 60 + (60 - m) % 60, swappedHands(t), t - 60]))
      .concat([t + 15, t - 15, t + 30]);
    else if (kind === 'read5') cands = (L <= 6 ? R.shuffle([t + 60, swappedHands(t), t + 30, t - 60]) : R.shuffle([t + 60, t + 5, t - 5, h * 60 + (60 - m) % 60, swappedHands(t)]))
      .concat([t - 10, t + 10, t - 60]);
    else cands = R.shuffle([t + 1, t - 1, t + 5, t - 5, t + 60, t + 10]).concat([t - 2, t + 2]);
    cands = cands.map(function (c) { return c === null ? null : norm12(c); });
    var step = kind === 'read0' ? 60 : kind === 'read30' ? 30 : kind === 'read15' ? 15 : kind === 'read5' ? 5 : 1;
    var dis = pickDistinct(fmt12(t), cands, fmt12, R, function () { return norm12(t + R.randInt(1, 40) * step); });
    var mode = L >= 8 ? 'digits' : (L >= 4 && R.randInt(1, 10) <= 4) ? 'words' : 'both';
    if (kind === 'read1') mode = 'digits';
    var opts = [t].concat(dis).map(function (x) {
      return { key: fmt12(x), main: fmt12(x), sub: words(x) };
    });
    return {
      kind: kind, clocks: [{ t: t }], status: 'מה השעה בשעון?',
      prompt: mode === 'words' ? 'בחרו את השעה במילים' : '',
      mode: mode, answer: fmt12(t), answerText: mode === 'words' ? words(t) : fmt12(t),
      options: R.shuffle(opts), explain: readExplain(t),
      check: { t: t }
    };
  }

  function laterQ(L, R, kind) {
    var back = kind === 'earlier';
    var stepStart = L <= 9 ? 15 : 5;
    var t = norm12(R.randInt(1, 12) * 60 + R.randInt(0, 60 / stepStart - 1) * stepStart);
    var d;
    if (L === 8) d = R.pick([30, 60]);
    else if (L === 9) d = R.pick([15, 30, 45, 60]);
    else if (L <= 11) d = R.randInt(2, 12) * 5;
    else if (L <= 13) d = R.randInt(3, 18) * 5;
    else if (L <= 15) d = R.randInt(7, 30) * 5;
    else d = R.randInt(8, 36) * 5;
    var ans = norm12(back ? t - d : t + d);
    var cands = R.shuffle([ans + 60, ans - 60, back ? t + d : t - d, ans + 10, ans - 10])
      .concat([ans + 5, ans - 5, ans + 30]);
    // forgetting to carry the hour
    if (!back && minOf(t) + d % 60 >= 60) cands.unshift(ans - 60);
    cands = cands.map(norm12);
    var dis = pickDistinct(fmt12(ans), cands, fmt12, R, function () { return norm12(ans + R.randInt(1, 20) * 5); });
    var opts = [ans].concat(dis).map(function (x) { return { key: fmt12(x), main: fmt12(x), sub: '' }; });
    return {
      kind: kind, clocks: [{ t: t }],
      status: back ? 'מה הייתה השעה לפני ' + dur(d) + '?' : 'מה תהיה השעה בעוד ' + dur(d) + '?',
      prompt: 'השעה עכשיו: ' + ltr(fmt12(t)),
      mode: 'digits', answer: fmt12(ans), answerText: fmt12(ans), options: R.shuffle(opts),
      explain: back ? subExplain(t, d, fmt12) : addExplain(t, d, fmt12),
      check: { t: t, d: d, back: back, ans: ans }
    };
  }

  function durOptions(d, R) {
    var cands = R.shuffle([d + 60, d - 60, d + 15, d - 15, d + 5, d - 5]).concat([d + 30, d - 30, d + 10]);
    var dis = pickDistinct(dur(d), cands, function (x) { return x > 0 ? dur(x) : null; }, R, function () {
      var x = d + R.randInt(-12, 12) * 5; return x > 0 ? x : null;
    }).filter(function (x) { return x; });
    return R.shuffle([d].concat(dis).map(function (x) { return { key: dur(x), main: dur(x), sub: '', rtl: true }; }));
  }

  function elapsedQ(L, R) {
    var step = L <= 13 ? 15 : 5;
    var t1 = R.randInt(1, 11) * 60 + R.randInt(0, 60 / step - 1) * step;
    var maxD = L <= 13 ? 180 : L >= 19 ? 300 : 240;
    var d = R.randInt(Math.ceil(20 / step), maxD / step) * step;
    var t2 = t1 + d;
    return {
      kind: 'elapsed', clocks: [{ t: t1, label: 'התחלה' }, { t: t2, label: 'סוף' }],
      status: 'כמה זמן עבר מהשעון הראשון עד השני?',
      prompt: 'מ־' + ltr(fmt12(t1)) + ' עד ' + ltr(fmt12(t2)) + ' (פחות מ־6 שעות)',
      mode: 'dur', answer: dur(d), answerText: dur(d), options: durOptions(d, R),
      explain: elapsedExplain(t1, t2, fmt12),
      check: { t1: t1, t2: t2, d: d }
    };
  }

  function read24Q(L, R) {
    var t = R.randInt(13, 21) * 60 + R.randInt(0, 11) * 5;
    var part = t >= 18 * 60 ? 'בערב' : 'אחר הצהריים';
    var t12 = t - 720;
    var cands = R.shuffle([t12, t + 60, t - 60, t + 120]).concat([t + 5, t - 5, t + 30]);
    var dis = pickDistinct(fmt24(t), cands, function (x) { return x < 720 ? fmt12(x) : fmt24(x); }, R, function () { return t + R.randInt(-20, 20) * 5; });
    var opts = [t].concat(dis).map(function (x) { var s = x < 720 ? fmt12(x) : fmt24(x); return { key: s, main: s, sub: '' }; });
    var h12 = hour12(t12);
    return {
      kind: 'read24', clocks: [{ t: t12, label: part, sun: t < 18 * 60 ? 'sun' : 'moon' }],
      status: 'איך כותבים את השעה בשעון של 24 שעות?',
      prompt: '',
      mode: 'digits', answer: fmt24(t), answerText: fmt24(t), options: R.shuffle(opts),
      explain: 'השעון מראה ' + ltr(fmt12(t12)) + ' ' + part + '. אחרי 12 בצהריים מוסיפים 12 לשעה: ' +
        ltr(h12 + ' + 12 = ' + (h12 + 12)) + ', ולכן ' + ltr(fmt24(t)) + '.',
      check: { t: t }
    };
  }

  function partOfDay(t) { return t < 12 * 60 ? 'בבוקר' : t < 18 * 60 ? 'אחר הצהריים' : 'בערב'; }

  function later24Q(L, R) {
    var t, d;
    if (L <= 17 || R.randInt(0, 1)) {
      t = R.randInt(10, 12) * 60 + R.randInt(0, 11) * 5;          // crosses noon
      d = Math.max(R.randInt(4, 30) * 5, 12 * 60 - t + 5);
      d = Math.ceil(d / 5) * 5;
      if (d > 240) d = 240;
    } else {
      t = R.randInt(8, 19) * 60 + R.randInt(0, 11) * 5;
      d = R.randInt(5, 48) * 5;
    }
    var ans = t + d;
    var cands = [];
    if (ans >= 780) cands.push(ans - 720); // answer written in 12h style
    cands = cands.concat(R.shuffle([ans + 60, ans - 60, ans + 10, ans - 10]));
    if (minOf(t) + d % 60 >= 60) cands.unshift(ans - 60);
    cands = cands.concat([ans + 5, ans - 5, ans + 30]);
    function k(x) { return fmt24(x); }
    var dis = pickDistinct(k(ans), cands, k, R, function () { return ans + R.randInt(-20, 20) * 5; });
    var opts = [ans].concat(dis).map(function (x) { return { key: k(x), main: k(x), sub: '' }; });
    return {
      kind: 'later24', clocks: [{ t: norm12(t) }],
      status: 'מה תהיה השעה בעוד ' + dur(d) + '?',
      prompt: 'עכשיו ' + ltr(fmt24(t)) + ' ' + partOfDay(t) + '. ענו בשעון של 24 שעות.',
      mode: 'digits', answer: fmt24(ans), answerText: fmt24(ans), options: R.shuffle(opts),
      explain: addExplain(t, d, fmt24),
      check: { t: t, d: d, ans: ans }
    };
  }

  var TRIPS = [
    ['הרכבת יצאה ב־', ' והגיעה ב־', 'כמה זמן נמשכה הנסיעה?'],
    ['הסרט התחיל ב־', ' ונגמר ב־', 'כמה זמן נמשך הסרט?'],
    ['הטיול התחיל ב־', ' והסתיים ב־', 'כמה זמן נמשך הטיול?'],
    ['יצאנו מהבית ב־', ' וחזרנו ב־', 'כמה זמן לא היינו בבית?'],
    ['המסיבה התחילה ב־', ' ונגמרה ב־', 'כמה זמן נמשכה המסיבה?']
  ];

  function elapsed24Q(L, R) {
    var t1 = R.randInt(7, 15) * 60 + R.randInt(0, 11) * 5;
    var d = R.randInt(8, L >= 20 ? 72 : 60) * 5;
    var t2 = t1 + d;
    var trip = R.pick(TRIPS);
    return {
      kind: 'elapsed24', clocks: [], digital: [t1, t2],
      status: trip[2],
      prompt: trip[0] + ltr(fmt24(t1)) + trip[1] + ltr(fmt24(t2)) + '.',
      mode: 'dur', answer: dur(d), answerText: dur(d), options: durOptions(d, R),
      explain: elapsedExplain(t1, t2, fmt24),
      check: { t1: t1, t2: t2, d: d }
    };
  }

  /* "Read the clock, then calculate": the current time is only on the clock face.
     From level 26 the clock shows any minute, not only multiples of 5. */
  function laterReadQ(L, R, kind) {
    var back = kind === 'earlierRead';
    var t = norm12(R.randInt(1, 12) * 60 + (L >= 26 ? R.randInt(0, 59) : R.randInt(0, 11) * 5));
    var d = R.randInt(L >= 26 ? 9 : 6, L >= 26 ? 60 : 48) * 5;
    var ans = norm12(back ? t - d : t + d);
    var cands = R.shuffle([ans + 60, ans - 60, back ? t + d : t - d, ans + 5, ans - 5])
      .concat([ans + 10, ans - 10, ans + 30, ans + 1, ans - 1]);
    if (!back && minOf(t) + d % 60 >= 60) cands.unshift(ans - 60);
    cands = cands.map(norm12);
    var dis = pickDistinct(fmt12(ans), cands, fmt12, R, function () { return norm12(ans + R.randInt(1, 20) * 5); });
    var opts = [ans].concat(dis).map(function (x) { return { key: fmt12(x), main: fmt12(x), sub: '' }; });
    return {
      kind: kind, clocks: [{ t: t }],
      status: back ? 'מה הייתה השעה לפני ' + dur(d) + '?' : 'מה תהיה השעה בעוד ' + dur(d) + '?',
      prompt: 'קראו קודם את השעה בשעון, ואז חשבו.',
      mode: 'digits', answer: fmt12(ans), answerText: fmt12(ans), options: R.shuffle(opts),
      explain: readExplain(t) + ' ' + (back ? subExplain(t, d, fmt12) : addExplain(t, d, fmt12)),
      check: { t: t, d: d, back: back, ans: ans }
    };
  }

  /* Going back in 24-hour time, usually across noon: "עכשיו 13:20, מה השעה לפני שעתיים ורבע?" */
  function earlier24Q(L, R) {
    var t, d;
    if (R.randInt(0, 2)) {
      t = R.randInt(12, 14) * 60 + R.randInt(0, 11) * 5;          // crosses noon backwards
      d = Math.ceil(Math.max(t - 12 * 60 + 5, R.randInt(6, 30) * 5) / 5) * 5;
      if (d > 270) d = 270;
    } else {
      t = R.randInt(13, 22) * 60 + R.randInt(0, 11) * 5;
      d = R.randInt(8, 54) * 5;
    }
    var ans = t - d;
    var cands = [];
    if (ans < 780 && ans >= 720) cands.push(ans + 720);              // 12:xx written as 0:xx / 24:xx mix-up
    cands = cands.concat(R.shuffle([ans + 60, ans - 60, t + d, ans + 10, ans - 10]));
    if (minOf(t) < d % 60) cands.unshift(ans + 60);                // forgetting to borrow the hour
    cands = cands.concat([ans + 5, ans - 5, ans + 30]);
    var dis = pickDistinct(fmt24(ans), cands, fmt24, R, function () { return ans + R.randInt(-20, 20) * 5; });
    var opts = [ans].concat(dis).map(function (x) { return { key: fmt24(x), main: fmt24(x), sub: '' }; });
    return {
      kind: 'earlier24', clocks: [{ t: norm12(t) }],
      status: 'מה הייתה השעה לפני ' + dur(d) + '?',
      prompt: 'עכשיו ' + ltr(fmt24(t)) + ' ' + partOfDay(t) + '. ענו בשעון של 24 שעות.',
      mode: 'digits', answer: fmt24(ans), answerText: fmt24(ans), options: R.shuffle(opts),
      explain: subExplain(t, d, fmt24),
      check: { t: t, d: d, ans: ans }
    };
  }

  var NIGHTS = [
    ['הלכנו לישון ב־', ' וקמנו ב־', 'כמה זמן ישנו?'],
    ['הטיסה המריאה ב־', ' ונחתה ב־', 'כמה זמן נמשכה הטיסה?'],
    ['המשמרת התחילה ב־', ' ונגמרה ב־', 'כמה זמן נמשכה המשמרת?'],
    ['האוטובוס הלילי יצא ב־', ' והגיע ב־', 'כמה זמן נמשכה הנסיעה?']
  ];

  /* Time that passes over midnight, e.g. from 22:40 to 6:15 the next morning. */
  function overnightQ(L, R) {
    var t1 = R.randInt(20, 23) * 60 + R.randInt(0, 11) * 5;
    var d = R.randInt(L >= 27 ? 30 : 24, L >= 27 ? 120 : 108) * 5;  // 2 to 10 hours
    var t2 = t1 + d;
    if (t2 <= 1440) { t2 = 1440 + R.randInt(1, 6) * 60 + R.randInt(0, 11) * 5; d = t2 - t1; }
    var trip = R.pick(NIGHTS);
    return {
      kind: 'overnight', clocks: [], digital: [t1, t2],
      status: trip[2],
      prompt: trip[0] + ltr(fmt24(t1)) + (t1 < 22 * 60 ? ' בערב' : ' בלילה') + trip[1] + ltr(fmt24(t2)) + ' למחרת.',
      mode: 'dur', answer: dur(d), answerText: dur(d), options: durOptions(d, R),
      explain: elapsedExplain(t1, t2, fmt24),
      check: { t1: t1, t2: t2, d: d }
    };
  }

  /* ---------- levels 31–50 ---------- */
  function partIcon(t) { return t < 18 * 60 ? 'sun' : 'moon'; }
  function anyMin(L, R) { return L >= 33 ? R.randInt(0, 59) : R.randInt(0, 11) * 5; }
  function opts24(ans, cands, R) {
    var dis = pickDistinct(fmt24(ans), cands, fmt24, R, function () { return ans + R.randInt(-20, 20) * 5; });
    return R.shuffle([ans].concat(dis).map(function (x) { return { key: fmt24(x), main: fmt24(x), sub: '' }; }));
  }
  function opts12(ans, cands, R) {
    var dis = pickDistinct(fmt12(ans), cands.map(norm12), fmt12, R, function () { return norm12(ans + R.randInt(1, 20) * 5); });
    return R.shuffle([ans].concat(dis).map(function (x) { return { key: fmt12(x), main: fmt12(x), sub: '' }; }));
  }
  function readAs24(t) {
    return 'השעון מראה ' + ltr(fmt12(t)) + ' ' + partOfDay(t) + ', כלומר ' + ltr(fmt24(t)) + '. ';
  }

  /* The time is only on the clock (with "בבוקר / אחר הצהריים / בערב" above it); answer in 24-hour time. */
  function later24ReadQ(L, R, back) {
    var t = back ? R.randInt(12, 22) * 60 + anyMin(L, R) : R.randInt(9, 19) * 60 + anyMin(L, R);
    var d = R.randInt(6, 48) * 5;
    if (back) d = Math.min(d, t - 6 * 60);
    else d = Math.min(d, 23 * 60 + 55 - t);
    var ans = back ? t - d : t + d;
    var cands = [];
    if (ans >= 780) cands.push(ans - 720);                           // written as on the 12-hour clock
    if (!back && minOf(t) + d % 60 >= 60) cands.push(ans - 60);       // forgot to carry the hour
    if (back && minOf(t) < d % 60) cands.push(ans + 60);              // forgot to borrow the hour
    cands = cands.concat(R.shuffle([back ? t + d : t - d, ans + 1, ans - 1, ans + 10, ans - 10, ans + 60]));
    return {
      kind: back ? 'earlier24Read' : 'later24Read', clocks: [{ t: norm12(t), label: partOfDay(t), sun: partIcon(t) }],
      status: back ? 'מה הייתה השעה לפני ' + dur(d) + '?' : 'מה תהיה השעה בעוד ' + dur(d) + '?',
      prompt: 'קראו את השעון, וענו בשעון של 24 שעות.',
      mode: 'digits', answer: fmt24(ans), answerText: fmt24(ans), options: opts24(ans, cands, R),
      explain: readAs24(t) + (back ? subExplain(t, d, fmt24) : addExplain(t, d, fmt24)),
      check: { t: t, d: d, back: back, ans: ans }
    };
  }

  /* Two clocks, any minute, and no times written: read both and say how long passed. */
  function elapsedAnyQ(L, R) {
    var t1 = R.randInt(1, 11) * 60 + R.randInt(0, 59);
    var d = R.randInt(25, 330);
    if (d % 5 === 0) d += R.randInt(1, 4);
    var t2 = t1 + d;
    return {
      kind: 'elapsedAny', clocks: [{ t: t1, label: 'התחלה' }, { t: t2, label: 'סוף' }],
      status: 'כמה זמן עבר מהשעון הראשון עד השני?',
      prompt: 'קראו את שני השעונים (פחות מ־6 שעות)',
      mode: 'dur', answer: dur(d), answerText: dur(d), options: durOptionsFine(d, R),
      explain: elapsedExplain(t1, t2, fmt12),
      check: { t1: t1, t2: t2, d: d }
    };
  }

  /* Like durOptions, but with one-minute look-alikes too. */
  function durOptionsFine(d, R) {
    var cands = R.shuffle([d + 60, d - 60, d + 1, d - 1, d + 10, d - 10]).concat([d + 5, d - 5, d + 30, d - 30]);
    var dis = pickDistinct(dur(d), cands, function (x) { return x > 0 ? dur(x) : null; }, R, function () {
      var x = d + R.randInt(-12, 12) * 5; return x > 0 ? x : null;
    }).filter(function (x) { return x; });
    return R.shuffle([d].concat(dis).map(function (x) { return { key: dur(x), main: dur(x), sub: '', rtl: true }; }));
  }

  /* Over midnight with any minute: 22:47 to 6:09. */
  function overnightAnyQ(L, R) {
    var t1 = R.randInt(20, 23) * 60 + R.randInt(0, 59);
    var t2 = 1440 + R.randInt(4, 8) * 60 + R.randInt(0, 59);
    var d = t2 - t1;
    var trip = R.pick(NIGHTS);
    return {
      kind: 'overnightAny', clocks: [], digital: [t1, t2],
      status: trip[2],
      prompt: trip[0] + ltr(fmt24(t1)) + (t1 < 22 * 60 ? ' בערב' : ' בלילה') + trip[1] + ltr(fmt24(t2)) + ' למחרת.',
      mode: 'dur', answer: dur(d), answerText: dur(d), options: durOptionsFine(d, R),
      explain: elapsedExplain(t1, t2, fmt24),
      check: { t1: t1, t2: t2, d: d }
    };
  }

  var CHAINS = [
    ['יצאנו בשעה שבשעון: ', ' הליכה ועוד ', ' קניות.', 'מתי סיימנו לקנות?'],
    ['העוגה נכנסה לתנור בשעה שבשעון: ', ' אפייה ועוד ', ' צינון.', 'מתי אוכלים את העוגה?'],
    ['הרכבת יצאה בשעה שבשעון: ', ' נסיעה ועוד ', ' באוטובוס.', 'באיזו שעה הגענו?']
  ];
  var CHAINS_BACK = [
    ['התור לרופא בשעה שבשעון. נסיעה ', ' והתארגנות ', '.', 'מתי מתחילים להתארגן?'],
    ['האורחים מגיעים בשעה שבשעון. בישול ', ' ועריכת שולחן ', '.', 'מתי מתחילים לבשל?'],
    ['ההצגה בשעה שבשעון. נסיעה ', ' והליכה מהחניה ', '.', 'מתי יוצאים מהבית?']
  ];

  /* Two steps in one story; the starting (or arrival) time is only on the clock. h24: answer in 24-hour time. */
  function chainQ(L, R, back, h24) {
    var t = (h24 ? (back ? R.randInt(13, 21) : R.randInt(9, 17)) : R.randInt(1, 12)) * 60 + (L >= 39 ? R.randInt(0, 59) : R.randInt(0, 11) * 5);
    var d1 = R.randInt(3, 30) * 5, d2 = R.randInt(3, 18) * 5;
    var d = d1 + d2;
    var ans = back ? t - d : t + d;
    var f = h24 ? fmt24 : fmt12;
    var st = back ? R.pick(CHAINS_BACK) : R.pick(CHAINS);
    var cands = [back ? ans + d2 : ans - d2, back ? ans + d1 : ans - d1, back ? t + d : t - d, ans + 1, ans - 1, ans + 60, ans - 60];
    if (h24 && ans >= 780) cands.unshift(ans - 720);
    var options = h24 ? opts24(ans, cands, R) : opts12(norm12(ans), cands, R);
    var start = (h24 ? readAs24(t) : 'השעון מראה ' + ltr(fmt12(t)) + '. ') + 'ביחד ' + dur(d1) + ' ועוד ' + dur(d2) + ' = ' + dur(d) + '. ';
    return {
      kind: (back ? 'chainBack' : 'chain') + (h24 ? '24' : ''),
      clocks: [h24 ? { t: norm12(t), label: partOfDay(t), sun: partIcon(t) } : { t: norm12(t) }],
      status: st[3],
      prompt: st[0] + dur(d1) + st[1] + dur(d2) + st[2] + (h24 ? ' ענו ב־24 שעות.' : ''),
      mode: 'digits', answer: f(h24 ? ans : norm12(ans)), answerText: f(h24 ? ans : norm12(ans)), options: options,
      explain: start + (back ? subExplain(t, d, f) : addExplain(t, d, f)),
      check: { t: t, d: d, back: back, ans: ans }
    };
  }

  /* A morning clock and an afternoon clock: how long between them (across noon, up to 10 hours)? */
  function elapsed24ReadQ(L, R) {
    var t1 = R.randInt(6, 11) * 60 + R.randInt(0, 59);
    var t2 = R.randInt(12, 17) * 60 + R.randInt(0, 59);
    var d = t2 - t1;
    var opts = durOptionsFine(d, R);
    return {
      kind: 'elapsed24Read', clocks: [{ t: norm12(t1), label: 'בבוקר', sun: 'sun' }, { t: norm12(t2), label: 'אחר הצהריים', sun: 'sun' }],
      status: 'כמה זמן עבר מהשעון הראשון עד השני?',
      prompt: 'הימני בבוקר, השמאלי אחר הצהריים',
      mode: 'dur', answer: dur(d), answerText: dur(d), options: opts,
      explain: elapsedExplain(t1, t2, fmt24),
      check: { t1: t1, t2: t2, d: d }
    };
  }

  function makeQuestion(level, R, prevKind) {
    var L = clampLevel(level);
    var pool = POOLS[L];
    var kind = R.pick(pool), tries = 0;
    while (pool.length > 1 && kind === prevKind && tries++ < 10) kind = R.pick(pool);
    if (kind === 'later24Read' || kind === 'earlier24Read') return later24ReadQ(L, R, kind === 'earlier24Read');
    if (kind === 'elapsedAny') return elapsedAnyQ(L, R);
    if (kind === 'overnightAny') return overnightAnyQ(L, R);
    if (kind === 'elapsed24Read') return elapsed24ReadQ(L, R);
    if (kind.slice(0, 5) === 'chain') return chainQ(L, R, kind.indexOf('Back') !== -1, kind.slice(-2) === '24');
    if (kind === 'laterRead' || kind === 'earlierRead') return laterReadQ(L, R, kind);
    if (kind === 'earlier24') return earlier24Q(L, R);
    if (kind === 'overnight') return overnightQ(L, R);
    if (kind.slice(0, 4) === 'read' && kind !== 'read24') return timeQ(L, R, kind);
    if (kind === 'later' || kind === 'earlier') return laterQ(L, R, kind);
    if (kind === 'elapsed') return elapsedQ(L, R);
    if (kind === 'read24') return read24Q(L, R);
    if (kind === 'later24') return later24Q(L, R);
    return elapsed24Q(L, R);
  }

  /* ---------- drawing ---------- */
  function clockSvg(t) {
    var h = Math.floor(norm12(t) / 60), m = minOf(t);
    var s = ['<svg class="ct-svg" viewBox="-100 -100 200 200" role="img" aria-label="שעון מחוגים" direction="ltr">'];
    s.push('<circle class="ct-face" r="95"/>');
    for (var i = 0; i < 60; i++) {
      var a = i * Math.PI / 30, big = i % 5 === 0;
      var r1 = big ? 82 : 87, r2 = 92;
      s.push('<line class="' + (big ? 'ct-tick5' : 'ct-tick') + '" x1="' + (Math.sin(a) * r1).toFixed(2) + '" y1="' + (-Math.cos(a) * r1).toFixed(2) +
        '" x2="' + (Math.sin(a) * r2).toFixed(2) + '" y2="' + (-Math.cos(a) * r2).toFixed(2) + '"/>');
    }
    for (var n = 1; n <= 12; n++) {
      var b = n * Math.PI / 6;
      s.push('<text class="ct-num" x="' + (Math.sin(b) * 69).toFixed(2) + '" y="' + (-Math.cos(b) * 69).toFixed(2) + '">' + n + '</text>');
    }
    var ha = ((h % 12) + m / 60) * Math.PI / 6, ma = m * Math.PI / 30;
    s.push('<line class="ct-hour" x1="0" y1="0" x2="' + (Math.sin(ha) * 44).toFixed(2) + '" y2="' + (-Math.cos(ha) * 44).toFixed(2) + '"/>');
    s.push('<line class="ct-min" x1="0" y1="0" x2="' + (Math.sin(ma) * 74).toFixed(2) + '" y2="' + (-Math.cos(ma) * 74).toFixed(2) + '"/>');
    s.push('<circle class="ct-pin" r="6"/>');
    s.push('</svg>');
    return s.join('');
  }

  BrainGames.register({
    id: 'clock-time',
    name: 'מה השעה?',
    skill: 'logic',
    tagline: 'קראו את השעון וחשבו כמה זמן עבר',
    benefit: 'התמצאות בזמן, תכנון וחשבון יומיומי',
    instructions: [
      'הסתכלו על השעון: המחוג הקצר מראה שעות, המחוג הארוך מראה דקות.',
      'קראו את השאלה שמעל השעון.',
      'בחרו את התשובה הנכונה מבין ארבע האפשרויות.',
      'ברמות הגבוהות קוראים את השעון בעצמכם ועונים בשעון של 24 שעות, ויש שאלות של שני שלבים.',
      'אחרי כל תשובה יופיע הסבר. לחצו "לשאלה הבאה" כשתהיו מוכנים.'
    ],
    css: [
      '.ct-clocks{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;width:100%}',
      '.ct-clock{display:flex;flex-direction:column;align-items:center;gap:4px;flex:0 1 13rem;min-width:0}',
      '.ct-clocks.ct-two .ct-clock{flex-basis:13rem;max-width:calc(50% - 6px)}',
      '.ct-svg{display:block;width:min(100%,12.5rem,28svh);height:auto;color:var(--ink)}',
      '.ct-face{fill:var(--surface);stroke:var(--ink);stroke-width:4}',
      '.ct-tick{stroke:var(--ink-soft);stroke-width:1.5}',
      '.ct-tick5{stroke:var(--ink);stroke-width:3.5;stroke-linecap:round}',
      '.ct-num{fill:var(--ink);font-family:var(--font-body);font-weight:800;font-size:19px;text-anchor:middle;dominant-baseline:central}',
      '.ct-hour{stroke:var(--ink);stroke-width:9;stroke-linecap:round}',
      '.ct-min{stroke:var(--logic);stroke-width:5;stroke-linecap:round}',
      '.ct-pin{fill:var(--ink)}',
      '.ct-label{font-weight:800;font-size:1.1rem;padding:.1rem .8rem;border-radius:999px;background:var(--logic-soft);color:var(--ink)}',
      '.ct-legend{display:flex;flex-wrap:wrap;justify-content:center;gap:.2rem 1rem;color:var(--ink-soft);font-size:1.1rem}',
      '.ct-legend i{display:inline-block;vertical-align:middle;width:1.6rem;border-radius:4px;margin-inline-end:.35rem}',
      '.ct-lg-h{height:7px;background:var(--ink)}.ct-lg-m{height:4px;background:var(--logic)}',
      '.ct-digital{display:flex;flex-wrap:wrap;justify-content:center;gap:12px}',
      '.ct-dig{display:flex;flex-direction:column;align-items:center;gap:.1rem;padding:.4rem 1.2rem;border-radius:var(--radius);',
      'background:var(--surface-2);border:2px solid var(--line)}',
      '.ct-dig b{font-family:var(--font-display);font-size:2rem;font-variant-numeric:tabular-nums;direction:ltr}',
      '.ct-prompt{margin:0;font-size:1.2rem}',
      '.ct-choices .g-choice.ct-gone{display:none}',
      '.play-board .g-choices.ct-choices{grid-template-columns:repeat(2,minmax(0,1fr));max-width:28rem}',
      '.ct-choices .g-choice{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:.15rem;padding:.6rem .5rem}',
      '.ct-main{font-size:1.6rem;font-variant-numeric:tabular-nums;line-height:1.1;text-wrap:balance}',
      '.ct-rtl .ct-main{font-size:1.25rem}',
      '.ct-sub{font-size:1.1rem;line-height:1.2;font-weight:600;color:var(--ink-soft)}',
      '.g-choice.is-correct .ct-sub{color:var(--good)}.g-choice.is-wrong .ct-sub{color:var(--bad)}',
      '.ct-words .ct-main{font-size:1.25rem}',
      '.ct-explain{margin:0;font-size:1.15rem;font-weight:700;text-align:center;background:var(--sun-soft);color:var(--ink);',
      'padding:.4rem .9rem;border-radius:var(--radius-sm);max-width:100%;text-wrap:balance;line-height:1.4}',
      '.ct-clocks.ct-small .ct-svg{width:min(100%,8rem,18svh)}',
      '.ct-explain.ct-long{font-size:1.05rem;line-height:1.3;padding-block:.3rem}'
    ].join(''),
    generate: makeQuestion,
    _util: { fmt12: fmt12, fmt24: fmt24, words: words, dur: dur, norm12: norm12 },
    start: function (root, ctx) {
      var round = 0;
      var correct = 0;
      var prevKind = null;

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: correct, total: ROUNDS, note: 'עניתם נכון על ' + correct + ' שאלות זמן מתוך ' + ROUNDS + '.' });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        var q = makeQuestion(ctx.level, ctx, prevKind);
        prevKind = q.kind;
        ctx.setStatus(q.status);

        root.innerHTML = '';
        if (q.clocks.length) {
          var wrap = ctx.el('div', { class: 'ct-clocks' + (q.clocks.length > 1 ? ' ct-two' : '') });
          q.clocks.forEach(function (c) {
            var box = ctx.el('div', { class: 'ct-clock' });
            if (c.label) box.appendChild(ctx.el('span', { class: 'ct-label' }, (c.sun === 'sun' ? '☀️ ' : c.sun === 'moon' ? '🌙 ' : '') + c.label));
            box.appendChild(ctx.el('div', { style: { width: '100%', display: 'flex', justifyContent: 'center' }, html: clockSvg(c.t) }));
            wrap.appendChild(box);
          });
          root.appendChild(wrap);
          if (ctx.level <= 7) {
            root.appendChild(ctx.el('div', { class: 'ct-legend' }, [
              ctx.el('span', null, [ctx.el('i', { class: 'ct-lg-h' }), 'קצר = שעות']),
              ctx.el('span', null, [ctx.el('i', { class: 'ct-lg-m' }), 'ארוך = דקות'])
            ]));
          }
        }
        if (q.digital) {
          root.appendChild(ctx.el('div', { class: 'ct-digital' }, q.digital.map(function (t, i) {
            return ctx.el('div', { class: 'ct-dig' }, [ctx.el('span', null, i === 0 ? 'התחלה' : 'סוף'), ctx.el('b', { dir: 'ltr' }, fmt24(t))]);
          })));
        }
        var promptEl = q.prompt ? ctx.el('p', { class: 'g-prompt ct-prompt' }, q.prompt) : null;
        if (promptEl) root.appendChild(promptEl);
        var legendEl = root.querySelector('.ct-legend');

        var buttons = [];
        var answered = false;
        var grid = ctx.el('div', { class: 'g-choices ct-choices' + (q.mode === 'words' ? ' ct-words' : '') });
        q.options.forEach(function (o) {
          var isRtl = q.mode === 'words' || q.mode === 'dur';
          var mainText = q.mode === 'words' ? o.sub : o.main;
          var kids = [ctx.el('span', { class: 'ct-main', dir: isRtl ? 'rtl' : 'ltr' }, mainText)];
          if (q.mode === 'both' && o.sub) kids.push(ctx.el('span', { class: 'ct-sub', dir: 'rtl' }, o.sub));
          var b = ctx.el('button', {
            class: 'g-choice' + (isRtl ? ' ct-rtl' : ''), type: 'button',
            onclick: function () { choose(o.key, b); }
          }, kids);
          buttons.push({ key: o.key, btn: b });
          grid.appendChild(b);
        });
        root.appendChild(grid);

        function choose(key, btn) {
          if (answered) return;
          answered = true;
          buttons.forEach(function (o) {
            o.btn.disabled = true;
            if (o.key === q.answer) o.btn.classList.add('is-correct');
            else if (o.btn !== btn) o.btn.classList.add('ct-gone'); // keep only the chosen and the right answer
          });
          var ok = key === q.answer;
          if (ok) correct++;
          else btn.classList.add('is-wrong');
          // one short explanation line takes the place of the prompt (and the hand legend)
          // a long explanation gets a smaller clock (and slightly smaller text) so it all fits a phone screen
          var long = q.explain.length > 90;
          var explain = ctx.el('p', { class: 'ct-explain' + (long ? ' ct-long' : ''), 'aria-live': 'polite' }, q.explain);
          var clocksEl = root.querySelector('.ct-clocks');
          if (long && clocksEl) clocksEl.classList.add('ct-small');
          if (legendEl) legendEl.remove();
          if (promptEl) promptEl.replaceWith(explain); else root.insertBefore(explain, grid);
          var nextBtn = ctx.el('button', {
            class: 'btn btn-primary btn-lg', type: 'button',
            onclick: function () { nextBtn.disabled = true; nextRound(); }
          }, round >= ROUNDS ? 'לסיכום' : 'לשאלה הבאה');
          root.appendChild(nextBtn);
          ctx.feedback(ok, ok ? 'נכון! ' + ltr(q.answerText) : 'התשובה הנכונה: ' + ltr(q.answerText));
          ctx.wait(50).then(function () { try { nextBtn.focus({ preventScroll: true }); } catch (e) { /* ignore */ } });
        }
      }

      nextRound();
    }
  });
})();
