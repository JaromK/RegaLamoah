/*
 * חשבון בראש — mental arithmetic with four answer choices.
 */
(function () {
  'use strict';

  var ROUNDS = 8;
  var PLUS = '+';
  var MINUS = '−';
  var TIMES = '×';
  var DIV = '÷';

  function swapDigits(n) {
    var s = String(n);
    if (s.length < 2) return null;
    var a = s.charAt(s.length - 2), b = s.charAt(s.length - 1);
    if (a === b) return null;
    var t = s.slice(0, s.length - 2) + b + a;
    if (t.charAt(0) === '0') return null;
    return parseInt(t, 10);
  }

  /* Pick 3 plausible, unique, positive wrong answers. */
  function makeDistractors(ans, extras, R) {
    var seen = {};
    seen[ans] = true;
    function ok(v) { return typeof v === 'number' && isFinite(v) && v === Math.round(v) && v > 0 && !seen[v]; }
    var out = [];
    function take(v) { if (ok(v) && out.length < 3) { seen[v] = true; out.push(v); } }

    // up to one "smart" mistake (wrong order of operations, neighbouring table fact, digit swap)
    var smart = R.shuffle((extras || []).concat([swapDigits(ans)]).filter(ok));
    if (smart.length) take(smart[0]);
    if (smart.length > 1 && R.randInt(0, 1)) take(smart[1]);

    var near = R.shuffle([ans + 1, ans - 1, ans + 2, ans - 2, ans + 10, ans - 10]);
    near.forEach(take);
    var guard = 0;
    while (out.length < 3 && guard++ < 50) take(ans + R.randInt(3, 9) * (R.randInt(0, 1) ? 1 : -1));
    guard = 0;
    while (out.length < 3 && guard++ < 50) take(ans + R.randInt(3, 20));
    return out;
  }

  function simple(a, sym, b) {
    var ans = sym === PLUS ? a + b : sym === MINUS ? a - b : sym === TIMES ? a * b : a / b;
    var extras = [];
    if (sym === TIMES) extras.push(a * (b + 1), a * (b - 1), (a + 1) * b);
    if (sym === MINUS && b < 10 && a > 10) extras.push(a - b + 10, a - b - 10);
    return { text: a + ' ' + sym + ' ' + b, answer: ans, extras: extras, twoStep: false };
  }

  function addSub(R, aMin, aMax, bMin, bMax, allowSub) {
    var a = R.randInt(aMin, aMax), b = R.randInt(bMin, bMax);
    if (allowSub && R.randInt(0, 1)) {
      if (a <= b) { var t = a; a = b; b = t; }
      if (a === b) a += R.randInt(1, 5);
      return simple(a, MINUS, b);
    }
    return simple(a, PLUS, b);
  }

  function times(R, max) {
    var a = R.randInt(2, max), b = R.randInt(2, max);
    if (max > 6 && a < 6 && b < 6) a = R.randInt(6, max);
    return R.randInt(0, 1) ? simple(a, TIMES, b) : simple(b, TIMES, a);
  }

  function twoStep(R, level) {
    var kinds = level >= 10 ? ['a+bc', 'a-bc', 'ab+c', 'ab-c', 'paren', 'ab+cd'] : ['a+bc', 'a-bc', 'ab+c', 'ab-c'];
    var k = R.pick(kinds);
    var a, b, c, d, ans, wrong, text;
    var max = level >= 10 ? 9 : 7;
    if (k === 'a+bc') {
      a = R.randInt(2, 20); b = R.randInt(2, max); c = R.randInt(2, max);
      text = a + ' ' + PLUS + ' ' + b + ' ' + TIMES + ' ' + c; ans = a + b * c; wrong = (a + b) * c;
    } else if (k === 'a-bc') {
      b = R.randInt(2, max); c = R.randInt(2, max); a = b * c + R.randInt(2, 25);
      text = a + ' ' + MINUS + ' ' + b + ' ' + TIMES + ' ' + c; ans = a - b * c; wrong = (a - b) * c;
    } else if (k === 'ab+c') {
      a = R.randInt(2, max); b = R.randInt(2, max); c = R.randInt(2, 20);
      // put the addend first sometimes: c + a × b is covered by a+bc
      text = a + ' ' + TIMES + ' ' + b + ' ' + PLUS + ' ' + c; ans = a * b + c; wrong = a * (b + c);
    } else if (k === 'ab-c') {
      a = R.randInt(2, max); b = R.randInt(3, max); c = R.randInt(1, Math.min(20, a * b - 1));
      text = a + ' ' + TIMES + ' ' + b + ' ' + MINUS + ' ' + c; ans = a * b - c; wrong = a * (b - c);
    } else if (k === 'paren') {
      a = R.randInt(2, 12); b = R.randInt(2, 9); c = R.randInt(2, 6);
      text = '(' + a + ' ' + PLUS + ' ' + b + ') ' + TIMES + ' ' + c; ans = (a + b) * c; wrong = a + b * c;
    } else {
      a = R.randInt(2, 6); b = R.randInt(2, 9); c = R.randInt(2, 6); d = R.randInt(2, 9);
      text = a + ' ' + TIMES + ' ' + b + ' ' + PLUS + ' ' + c + ' ' + TIMES + ' ' + d; ans = a * b + c * d; wrong = (a * b + c) * d;
    }
    return { text: text, answer: ans, extras: [wrong], twoStep: true };
  }

  var MAX_L = 30;

  /* two-digit + one-digit without carrying, or minus without borrowing */
  function noCarrySmall(R, allowSub) {
    var t = R.randInt(1, 8) * 10;
    if (!allowSub || R.randInt(0, 1)) { var u = R.randInt(1, 7); return simple(t + u, PLUS, R.randInt(1, 9 - u)); }
    var u2 = R.randInt(3, 9);
    return simple(t + u2, MINUS, R.randInt(1, u2 - 1));
  }

  /* two-digit + one-digit WITH carrying, or minus WITH borrowing */
  function carrySmall(R) {
    if (R.randInt(0, 1)) {
      var u = R.randInt(2, 9), a = R.randInt(1, 8) * 10 + u;
      return simple(a, PLUS, R.randInt(Math.max(2, 10 - u + 1), 9));
    }
    var u2 = R.randInt(0, 7), a2 = R.randInt(2, 9) * 10 + u2;
    return simple(a2, MINUS, R.randInt(u2 + 1, 9));
  }

  /* two-digit ± two-digit without carrying / borrowing */
  function noCarryBig(R) {
    var t1 = R.randInt(1, 7), t2 = R.randInt(1, 8 - t1), u1 = R.randInt(0, 8), u2 = R.randInt(1, 9 - u1);
    if (R.randInt(0, 2)) return simple(t1 * 10 + u1, PLUS, t2 * 10 + u2);
    var ta = R.randInt(3, 9), tb = R.randInt(1, ta - 1), ua = R.randInt(2, 9), ub = R.randInt(0, ua - 1);
    return simple(ta * 10 + ua, MINUS, tb * 10 + ub);
  }

  /* two-digit + two-digit WITH carrying */
  function carryBig(R) {
    var u1 = R.randInt(2, 9), u2 = R.randInt(Math.max(1, 10 - u1), 9);
    var t1 = R.randInt(1, 5), t2 = R.randInt(1, 8 - t1);
    return simple(t1 * 10 + u1, PLUS, t2 * 10 + u2);
  }

  function easyTables(R) {
    var a = R.pick([2, 5, 10]), b = R.randInt(2, 10);
    return R.randInt(0, 1) ? simple(a, TIMES, b) : simple(b, TIMES, a);
  }

  function division(R, max) {
    var p = R.randInt(3, max), q = R.randInt(3, max);
    var e = simple(p * q, DIV, p);
    e.extras = [q + 1, q - 1, p];
    return e;
  }

  /* doubling / halving a large number */
  function doubleHalf(R, big) {
    var e;
    if (R.randInt(0, 1)) {
      var n = big ? R.randInt(126, 1250) : R.randInt(26, 480);
      e = simple(n, TIMES, 2);
      e.extras = [n * 2 + 10, n * 2 - 10, n * 2 + 100];
    } else {
      var m = (big ? R.randInt(126, 999) : R.randInt(26, 480)) * 2;
      e = simple(m, DIV, 2);
      e.extras = [m / 2 + 10, m / 2 - 10, m / 2 + 5, m / 2 - 5];
    }
    e.hint = 'רמז: × 2 זה כפול, ÷ 2 זה חצי';
    return e;
  }

  var PCT_HINTS = {
    10: 'רמז: 10% זה עשירית, כלומר מחלקים ב־10',
    20: 'רמז: 20% זה פעמיים 10%',
    25: 'רמז: 25% זה רבע, כלומר חצי של החצי',
    50: 'רמז: 50% זה חצי',
    75: 'רמז: 75% זה שלושה רבעים'
  };

  /* percentage of a round number; result is always whole */
  function percent(R, pcts) {
    var p = R.pick(pcts), n;
    if (p === 10) n = R.randInt(2, 90) * 10;
    else if (p === 20) n = R.randInt(2, 45) * 10;
    else if (p === 50) n = R.randInt(10, 200) * 2;
    else n = R.randInt(2, p === 75 ? 20 : 30) * 20; // 25% / 75%
    var ans = n * p / 100;
    var extras = [10, 20, 25, 50, 75].filter(function (o) { return o !== p; })
      .map(function (o) { return n * o / 100; });
    extras.push(n - ans);
    return { text: p + '% ' + TIMES + ' ' + n, answer: ans, extras: extras, twoStep: false, hint: PCT_HINTS[p] };
  }

  /* three operations, mind the order */
  function threeStep(R) {
    var k = R.pick(['a+bc-d', 'ab-c+d', 'ab-cd', 'paren-d', 'ab+c/d']);
    var a, b, c, d, ans, wrong, text, hint = 'זכרו: קודם כפל וחילוק, ואחר כך חיבור וחיסור משמאל לימין';
    if (k === 'a+bc-d') {
      a = R.randInt(2, 30); b = R.randInt(2, 9); c = R.randInt(2, 9); d = R.randInt(1, Math.min(30, a + b * c - 1));
      text = a + ' ' + PLUS + ' ' + b + ' ' + TIMES + ' ' + c + ' ' + MINUS + ' ' + d;
      ans = a + b * c - d; wrong = (a + b) * c - d;
    } else if (k === 'ab-c+d') {
      a = R.randInt(3, 9); b = R.randInt(3, 9); c = R.randInt(1, Math.min(25, a * b - 1)); d = R.randInt(2, 25);
      text = a + ' ' + TIMES + ' ' + b + ' ' + MINUS + ' ' + c + ' ' + PLUS + ' ' + d;
      ans = a * b - c + d; wrong = a * b - (c + d);
    } else if (k === 'ab-cd') {
      a = R.randInt(4, 9); b = R.randInt(4, 9); c = R.randInt(2, 6); d = R.randInt(2, 6);
      if (c * d >= a * b) { c = 2; d = 2; }
      text = a + ' ' + TIMES + ' ' + b + ' ' + MINUS + ' ' + c + ' ' + TIMES + ' ' + d;
      ans = a * b - c * d; wrong = (a * b - c) * d;
    } else if (k === 'paren-d') {
      a = R.randInt(2, 12); b = R.randInt(2, 9); c = R.randInt(2, 6); d = R.randInt(1, Math.min(30, (a + b) * c - 1));
      text = '(' + a + ' ' + PLUS + ' ' + b + ') ' + TIMES + ' ' + c + ' ' + MINUS + ' ' + d;
      ans = (a + b) * c - d; wrong = a + b * c - d;
      hint = 'זכרו: קודם מה שבסוגריים, אחר כך כפל, ובסוף חיסור';
    } else {
      a = R.randInt(2, 9); b = R.randInt(2, 9); d = R.randInt(2, 6); c = d * R.randInt(2, 9);
      text = a + ' ' + TIMES + ' ' + b + ' ' + PLUS + ' ' + c + ' ' + DIV + ' ' + d;
      ans = a * b + c / d; wrong = (a * b + c) / d;
    }
    return { text: text, answer: ans, extras: [wrong], twoStep: true, hint: hint };
  }

  /* ---------- levels 21–30 ---------- */

  /* three-digit ± two- or three-digit, with carrying / borrowing */
  function bigAddSub(R, sub3) {
    if (R.randInt(0, 1)) {
      var a = R.randInt(120, 780), b = R.randInt(sub3 ? 110 : 25, sub3 ? 219 : 99);
      if ((a % 10) + (b % 10) < 10) b += 10 - (b % 10) - (a % 10) + R.randInt(0, 3); // force a carry
      var e = simple(a, PLUS, b);
      e.extras = [a + b - 10, a + b + 10, a + b - 100];
      return e;
    }
    var x = R.randInt(310, 960), y = R.randInt(sub3 ? 120 : 25, sub3 ? 290 : 98);
    if ((x % 10) >= (y % 10)) y = y - (y % 10) + Math.min(9, (x % 10) + 1 + R.randInt(0, 2)); // force a borrow
    var f = simple(x, MINUS, y);
    f.extras = [x - y + 10, x - y - 10, x - y + 100];
    return f;
  }

  /* two-digit × one-digit, e.g. 47 × 6 */
  function mulTwoOne(R, maxA) {
    var a = R.randInt(13, maxA), b = R.randInt(3, 9);
    if (a % 10 === 0) a += R.randInt(1, 9);
    var e = R.randInt(0, 1) ? simple(a, TIMES, b) : simple(b, TIMES, a);
    e.extras = [Math.floor(a / 10) * 10 * b + (a % 10), a * b + 10, a * b - 10, (a + 1) * b];
    e.hint = 'רמז: פרקו לעשרות ואחדות, למשל ' + a + ' = ' + (a - a % 10) + ' + ' + (a % 10);
    return e;
  }

  /* division with a two-digit answer, e.g. 96 ÷ 4 */
  function divTwo(R) {
    var p = R.randInt(3, 9), q = R.randInt(12, p <= 4 ? 30 : 19);
    var e = simple(p * q, DIV, p);
    e.extras = [q + 1, q - 1, q + 10, q - 10];
    return e;
  }

  /* ×11, ×25, ×12 and ×15 tricks */
  function mulTricks(R) {
    var k = R.pick([11, 25, 12, 15]);
    var a = k === 11 ? R.randInt(12, 45) : k === 25 ? R.randInt(3, 16) * 2 : R.randInt(12, 19);
    if (a % 10 === 0) a += 1;
    var e = R.randInt(0, 1) ? simple(a, TIMES, k) : simple(k, TIMES, a);
    e.extras = [a * k + 10, a * k - 10, a * (k - 1), a * (k + 1)];
    e.hint = k === 11 ? 'רמז: × 11 זה × 10 ועוד פעם אחת' : k === 25 ? 'רמז: × 25 זה × 100 ואז ÷ 4'
      : k === 12 ? 'רמז: × 12 זה × 10 ועוד × 2' : 'רמז: × 15 זה × 10 ועוד חצי מזה';
    return e;
  }

  var PCT_HINTS2 = {
    5: 'רמז: 5% זה חצי מ־10%',
    15: 'רמז: 15% זה 10% ועוד 5%',
    30: 'רמז: 30% זה שלוש פעמים 10%',
    40: 'רמז: 40% זה ארבע פעמים 10%',
    60: 'רמז: 60% זה שש פעמים 10%'
  };

  /* the less round percentages */
  function percentHard(R) {
    var p = R.pick([5, 15, 30, 40, 60]);
    var n = p === 5 || p === 15 ? R.randInt(2, 40) * 20 : R.randInt(2, 50) * 10;
    var ans = n * p / 100;
    var extras = [n / 10, n * (p + 10) / 100, n * (p - 5) / 100, n - ans].filter(function (v) { return v === Math.round(v); });
    return { text: p + '% ' + TIMES + ' ' + n, answer: ans, extras: extras, twoStep: false, hint: PCT_HINTS2[p] };
  }

  /* four numbers, three operations: (a + b) × c − d × e  or  a × b + c × d − e */
  function fourStep(R) {
    var a, b, c, d, e, text, ans, wrong;
    if (R.randInt(0, 1)) {
      a = R.randInt(2, 9); b = R.randInt(2, 9); c = R.randInt(2, 5); d = R.randInt(2, 5); e = R.randInt(2, 6);
      if (d * e >= (a + b) * c) { d = 2; e = 2; }
      text = '(' + a + ' ' + PLUS + ' ' + b + ') ' + TIMES + ' ' + c + ' ' + MINUS + ' ' + d + ' ' + TIMES + ' ' + e;
      ans = (a + b) * c - d * e; wrong = ((a + b) * c - d) * e;
    } else {
      a = R.randInt(2, 9); b = R.randInt(2, 9); c = R.randInt(2, 6); d = R.randInt(2, 6);
      e = R.randInt(1, Math.min(20, a * b + c * d - 1));
      text = a + ' ' + TIMES + ' ' + b + ' ' + PLUS + ' ' + c + ' ' + TIMES + ' ' + d + ' ' + MINUS + ' ' + e;
      ans = a * b + c * d - e; wrong = (a * b + c) * d - e;
    }
    return { text: text, answer: ans, extras: [wrong, ans + 10, ans - 10], twoStep: true,
      hint: 'זכרו: קודם סוגריים, אחר כך כפל, ובסוף חיבור וחיסור משמאל לימין' };
  }

  function makeExercise(level, R) {
    var L = Math.max(1, Math.min(MAX_L, level | 0));
    var r;
    switch (L) {
      case 1: // sums and differences up to 10
        if (R.randInt(0, 1)) { var a = R.randInt(1, 8); return simple(a, PLUS, R.randInt(1, 10 - a)); }
        var x = R.randInt(3, 9); return simple(x, MINUS, R.randInt(1, x - 1));
      case 2: return addSub(R, 2, 9, 2, 9, true);              // single digits
      case 3: return noCarrySmall(R, false);                    // 43 + 5
      case 4: return noCarrySmall(R, true);                     // 43 + 5, 47 − 3
      case 5: return carrySmall(R);                             // 47 + 6, 42 − 7
      case 6: return R.randInt(0, 2) ? noCarryBig(R) : carrySmall(R); // 32 + 45
      case 7: return R.randInt(0, 2) ? carryBig(R) : noCarryBig(R);   // 38 + 27
      case 8: return R.randInt(0, 1) ? easyTables(R) : carryBig(R);   // tables of 2, 5, 10
      case 9: return R.randInt(0, 1) ? times(R, 5) : addSub(R, 11, 69, 11, 29, false);
      case 10: return R.randInt(0, 2) ? addSub(R, 21, 89, 11, 49, true) : times(R, 9);
      case 11: return R.randInt(0, 1) ? times(R, 12) : addSub(R, 25, 99, 12, 69, true);
      case 12:
        r = R.randInt(0, 2);
        return r === 0 ? times(R, 12) : r === 1 ? division(R, 9) : addSub(R, 25, 99, 12, 69, true);
      case 13:
        r = R.randInt(0, 3);
        return r === 0 ? times(R, 12) : r === 1 ? division(R, 12) : addSub(R, 35, 99, 15, 89, true);
      case 14: return R.randInt(0, 3) === 0 ? times(R, 12) : twoStep(R, 9);
      case 15: return twoStep(R, 10);
      case 16: return R.randInt(0, 4) < 3 ? doubleHalf(R, false) : twoStep(R, 10);
      case 17: return R.randInt(0, 2) ? percent(R, [10, 50]) : doubleHalf(R, false);
      case 18: return R.randInt(0, 3) ? percent(R, [10, 20, 25, 50]) : doubleHalf(R, true);
      case 19: return R.randInt(0, 3) ? threeStep(R) : percent(R, [10, 20, 25, 50]);
      case 20:
        r = R.randInt(0, 9);
        return r < 5 ? threeStep(R) : r < 8 ? percent(R, [10, 20, 25, 50, 75]) : doubleHalf(R, true);
      case 21: return R.randInt(0, 1) ? bigAddSub(R, false) : threeStep(R);         // 347 + 86
      case 22: return R.randInt(0, 1) ? mulTwoOne(R, 49) : bigAddSub(R, false);     // 47 × 6
      case 23: return R.randInt(0, 1) ? divTwo(R) : mulTwoOne(R, 59);               // 96 ÷ 4
      case 24: return R.randInt(0, 1) ? percentHard(R) : mulTwoOne(R, 69);          // 15% × 80
      case 25:
        r = R.randInt(0, 3);
        return r === 0 ? bigAddSub(R, true) : r === 1 ? mulTwoOne(R, 79) : r === 2 ? divTwo(R) : percentHard(R);
      case 26: return R.randInt(0, 1) ? bigAddSub(R, true) : mulTwoOne(R, 99);      // 512 − 268, 78 × 7
      case 27: return R.randInt(0, 1) ? fourStep(R) : percentHard(R);
      case 28: return R.randInt(0, 1) ? mulTricks(R) : fourStep(R);                 // 25 × 16, 11 × 43
      case 29:
        r = R.randInt(0, 3);
        return r === 0 ? mulTricks(R) : r === 1 ? percentHard(R) : r === 2 ? divTwo(R) : bigAddSub(R, true);
      default:
        r = R.randInt(0, 5);
        return r === 0 ? fourStep(R) : r === 1 ? mulTricks(R) : r === 2 ? percentHard(R)
          : r === 3 ? mulTwoOne(R, 99) : r === 4 ? bigAddSub(R, true) : divTwo(R);
        r = R.randInt(0, 9);
        return r < 5 ? threeStep(R) : r < 8 ? percent(R, [10, 20, 25, 50, 75]) : doubleHalf(R, true);
    }
  }

  var TOP = 50;
  function clampL(level) { return Math.max(1, Math.min(TOP, Math.round(Number(level)) || 1)); }

  /* The 30 steps of single exercises are spread over the 50 levels. */
  function regLevel(level) { return Math.max(1, Math.min(MAX_L, Math.round(1 + (clampL(level) - 1) * (MAX_L - 1) / (TOP - 1)))); }

  function makeQuestion(level, R) {
    var ex = makeExercise(regLevel(level), R);
    var wrong = makeDistractors(ex.answer, ex.extras, R);
    return {
      text: ex.text,
      answer: ex.answer,
      twoStep: ex.twoStep,
      hint: ex.hint || null,
      choices: R.shuffle([ex.answer].concat(wrong))
    };
  }

  /* ---------- chains: start from a number, then one operation at a time ---------- */

  /* mode: 'each' = answer after every step (the running result is shown) · 'show' = the steps stay on screen,
     answer only at the end · 'hide' = each step is shown once, then hidden; answer at the end.
     Every step is player-paced ("הבא"), never timed. */
  function chainSpec(level) {
    var L = clampL(level), mode, steps;
    if (L <= 12) { mode = 'each'; steps = L <= 4 ? 2 : L <= 8 ? 3 : 4; }
    else if (L <= 30) { mode = 'show'; steps = L <= 15 ? 2 : L <= 20 ? 3 : L <= 25 ? 4 : 5; }
    else { mode = 'hide'; steps = L <= 33 ? 2 : L <= 38 ? 3 : L <= 43 ? 4 : L <= 47 ? 5 : 6; }
    var ops = L < 3 ? [PLUS, MINUS] : L < 7 ? [PLUS, MINUS, TIMES] : [PLUS, MINUS, TIMES, DIV];
    var sp = {
      level: L, mode: mode, steps: steps, ops: ops,
      addMax: 5 + Math.floor(L * 0.9),
      mulMax: L < 7 ? 2 : L < 12 ? 3 : L < 20 ? 5 : L < 35 ? 6 : 9,
      cap: 20 + L * 5
    };
    if (mode === 'hide') { sp.cap = 60 + (L - 30) * 6; sp.addMax = 10 + (L - 30); sp.mulMax = L < 45 ? 5 : 9; }
    sp.divMax = sp.mulMax;
    sp.startMax = Math.max(6, Math.min(Math.floor(sp.cap / 2), 8 + L * 2));
    // how many of the 8 rounds are chains: more and more with the level
    sp.count = Math.min(6, 2 + Math.floor(L / 12));
    return sp;
  }

  function apply(v, op, n) { return op === PLUS ? v + n : op === MINUS ? v - n : op === TIMES ? v * n : v / n; }

  var UNDO = { '+': '−', '−': '+', '×': '÷', '÷': '×' };
  function chainStep(v, sp, R, prev) {
    for (var t = 0; t < 80; t++) {
      var s = tryStep(v, sp, R, R.pick(sp.ops));
      if (!s) continue;
      if (prev && t < 40 && (s.op === prev.op || (s.op === UNDO[prev.op] && s.n === prev.n))) continue; // vary; never undo the last step
      return s;
    }
    return v > 2 ? { op: MINUS, n: 1 } : { op: PLUS, n: 1 };
  }
  function tryStep(v, sp, R, op) {
    var n;
    if (op === PLUS) { n = R.randInt(1, sp.addMax); if (v + n <= sp.cap) return { op: op, n: n }; }
    else if (op === MINUS) { if (v > 2) { n = R.randInt(1, Math.min(sp.addMax, v - 1)); return { op: op, n: n }; } }
    else if (op === TIMES) { n = R.randInt(2, sp.mulMax); if (v * n <= sp.cap) return { op: op, n: n }; }
    else {
      var ds = [];
      for (var d = 2; d <= sp.divMax; d++) if (v % d === 0) ds.push(d);
      if (ds.length) return { op: op, n: R.pick(ds) };
    }
    return null;
  }

  /* { start, steps: [{op, n, before, after}], answer, choices } — whole numbers ≥ 1 all the way. */
  function makeChain(level, R) {
    var sp = chainSpec(level);
    var v = R.randInt(sp.level < 5 ? 2 : 3, sp.startMax), start = v, steps = [], prev = null;
    for (var i = 0; i < sp.steps; i++) {
      var s = chainStep(v, sp, R, prev);
      var after = apply(v, s.op, s.n);
      steps.push({ op: s.op, n: s.n, before: v, after: after });
      v = after; prev = s;
    }
    // typical slips: forgetting one step, stopping one step early, a wrong last step
    var extras = [steps[steps.length - 1].before];
    for (var k = 0; k < steps.length; k++) {
      var w = start, okW = true;
      for (var j = 0; j < steps.length; j++) {
        if (j === k) continue;
        w = apply(w, steps[j].op, steps[j].n);
        if (w !== Math.round(w)) { okW = false; break; }
      }
      if (okW) extras.push(w);
    }
    var last = steps[steps.length - 1];
    if (last.op === PLUS) extras.push(last.before - last.n);
    if (last.op === MINUS) extras.push(last.before + last.n);
    var wrong = makeDistractors(v, extras, R);
    return { mode: sp.mode, start: start, steps: steps, answer: v, choices: R.shuffle([v].concat(wrong)) };
  }

  /* one step of an 'each' chain, asked on its own */
  function stepQuestion(step, R) {
    var ex = simple(step.before, step.op, step.n);
    return R.shuffle([ex.answer].concat(makeDistractors(ex.answer, ex.extras, R)));
  }

  /* which rounds of the session are chains */
  function plan(level, R, rounds) {
    var sp = chainSpec(level), out = [];
    for (var i = 0; i < rounds; i++) out.push(i < sp.count ? 'chain' : 'single');
    out = R.shuffle(out);
    if (out[0] === 'chain' && out.indexOf('single') > 0) { var j = out.indexOf('single'); out[j] = 'chain'; out[0] = 'single'; }
    return out;
  }

  BrainGames.register({
    id: 'mental-math',
    name: 'חשבון בראש',
    skill: 'logic',
    tagline: 'תרגילים קצרים ושרשראות חשבון, בלי דף ועט',
    benefit: 'זיכרון עבודה, חישוב בראש וגמישות מספרית',
    instructions: [
      'פתרו את התרגיל בראש ולחצו על התשובה הנכונה מבין ארבע האפשרויות.',
      'בשרשרת מתחילים ממספר, ואז מגיעים צעדים אחד אחרי השני, למשל: 12, אחר כך × 2, אחר כך − 5. כל צעד עושים על התוצאה הקודמת.',
      'בהתחלה עונים אחרי כל צעד. בהמשך עונים רק בסוף, ובשלבים הגבוהים כל צעד מופיע פעם אחת ונעלם. לחצו "הבא" כשאתם מוכנים.',
      'אין שעון. אחרי שרשרת מופיע הפתרון צעד אחרי צעד.'
    ],
    css: [
      '.mm-expr{display:inline-block;direction:ltr;unicode-bidi:isolate;white-space:nowrap;font-size:min(4rem,12vw)}',
      '.mm-expr.mm-m{font-size:min(3.4rem,9vw)}',
      '.mm-expr.mm-l{font-size:min(3rem,7.5vw)}',
      '.mm-expr.mm-xl{font-size:min(2.6rem,6.2vw)}',
      '.mm-q{color:var(--accent)}',
      '.mm-q.mm-done{color:var(--good)}',
      '.mm-choices{grid-template-columns:repeat(2,minmax(0,1fr));max-width:26rem;width:100%}',
      '.mm-choices .g-choice{font-size:1.7rem;font-variant-numeric:tabular-nums;direction:ltr}',
      /* chains */
      '.mm-label{margin:0;font-size:1.15rem;font-weight:800;color:var(--ink-soft);text-align:center}',
      '.mm-cards{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:.45rem;direction:ltr;max-width:24rem}',
      '.mm-card{min-width:4.4rem;padding:.35rem .6rem;border-radius:var(--radius);border:3px solid var(--line);background:var(--surface-2);',
      'font-family:var(--font-display);font-weight:900;font-size:2rem;line-height:1.15;text-align:center;font-variant-numeric:tabular-nums;white-space:nowrap}',
      '.mm-card.mm-start{border-color:var(--c-blue);background:var(--c-blue-soft);color:var(--ink)}',
      '.mm-card.mm-op{border-color:var(--c-yellow);background:var(--c-yellow-soft);color:var(--ink)}',
      '.mm-card.mm-res{border-color:var(--good);background:var(--good-soft);color:var(--ink);font-size:1.6rem;min-width:3.6rem}',
      '.mm-card.mm-now{box-shadow:0 0 0 4px var(--accent)}',
      '.mm-card.mm-huge{font-size:4.2rem;min-width:9rem;padding:.6rem 1.2rem}',
      '.mm-eq{font-family:var(--font-display);font-weight:900;font-size:2rem;direction:ltr}',
      '.mm-hist{margin:0;color:var(--ink-soft);font-weight:700;font-size:1.1rem;direction:ltr;text-align:center;min-height:1.5rem}',
      '.mm-sol{width:100%;max-width:24rem;background:var(--sun-soft);border:2px solid var(--sun);border-radius:var(--radius-sm);',
      'padding:.4rem .7rem;display:flex;flex-direction:column;gap:0;font-weight:800;font-size:1.2rem;line-height:1.45}',
      '.mm-sol h3{margin:0;font-size:1.1rem}',
      '.mm-sol .mm-line{direction:ltr;text-align:center;font-variant-numeric:tabular-nums}',
      '.mm-steps-done{display:flex;gap:.35rem;justify-content:center;direction:ltr}',
      '.mm-steps-done i{width:1rem;height:1rem;border-radius:50%;background:var(--line)}',
      '.mm-steps-done i.on{background:var(--accent)}'
    ].join('\n'),
    generate: makeQuestion,
    _model: { makeQuestion: makeQuestion, makeChain: makeChain, chainSpec: chainSpec, plan: plan, stepQuestion: stepQuestion, regLevel: regLevel },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = clampL(ctx.level);
      var kinds = plan(level, ctx, ROUNDS);
      var round = 0;
      var correct = 0, total = 0, chainsRight = 0, chains = 0;

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          var note = 'פתרתם נכון ' + correct + ' מתוך ' + total + ' תשובות';
          if (chains) note += ' · שרשראות שפתרתם עד הסוף בלי טעות: ' + chainsRight + ' מתוך ' + chains;
          ctx.finish({ correct: correct, total: total, note: note });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        root.innerHTML = '';
        if (kinds[round - 1] === 'chain') chainRound(); else singleRound();
      }

      /* four answer buttons; onPick(ok) after the player chose */
      function choiceGrid(values, answer, onPick) {
        var answered = false, buttons = [];
        var grid = el('div', { class: 'g-choices mm-choices' });
        values.forEach(function (val) {
          var b = el('button', { class: 'g-choice', type: 'button', dir: 'ltr', onclick: function () {
            if (answered) return;
            answered = true;
            buttons.forEach(function (o) { o.btn.disabled = true; if (o.val === answer) o.btn.classList.add('is-correct'); });
            var ok = val === answer;
            if (!ok) b.classList.add('is-wrong');
            total++; if (ok) correct++;
            onPick(ok);
          } }, String(val));
          buttons.push({ val: val, btn: b });
          grid.appendChild(b);
        });
        return grid;
      }

      function singleRound() {
        var q = makeQuestion(level, ctx);
        ctx.setStatus(q.hint || (q.twoStep ? 'זכרו: קודם כפל, ואחר כך חיבור וחיסור' : 'כמה זה?'));
        var len = (q.text + ' = ?').length;
        var qMark = el('span', { class: 'mm-q' }, '?');
        var expr = el('span', { class: 'mm-expr' + (len > 18 ? ' mm-xl' : len > 13 ? ' mm-l' : len > 8 ? ' mm-m' : ''), dir: 'ltr' },
          [q.text + ' = ', qMark]);
        root.appendChild(el('div', { class: 'g-big', 'aria-live': 'polite' }, expr));
        root.appendChild(choiceGrid(q.choices, q.answer, function (ok) {
          qMark.textContent = String(q.answer);
          qMark.classList.add('mm-done');
          ctx.feedback(ok, ok ? null : 'התשובה הנכונה: ' + q.answer)
            .then(function () { return ctx.wait(ok ? 400 : 1200); })
            .then(nextRound);
        }));
      }

      function card(text, cls) { return el('div', { class: 'mm-card ' + cls, dir: 'ltr' }, text); }
      function opText(s) { return s.op + ' ' + s.n; }
      function nextBtn(label, fn) {
        var b = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { b.disabled = true; fn(); } }, label);
        return el('div', { class: 'g-actions' }, b);
      }

      function chainRound() {
        var C = makeChain(level, ctx);
        chains++;
        if (C.mode === 'each') eachChain(C); else endChain(C);
      }

      /* answer after every step; the running result stays on screen */
      function eachChain(C) {
        var i = 0, allOk = true;
        function step() {
          root.innerHTML = '';
          if (i >= C.steps.length) {
            if (allOk) chainsRight++;
            nextRound();
            return;
          }
          var s = C.steps[i];
          ctx.setStatus(i === 0 ? 'שרשרת: מתחילים מ-' + C.start : 'ממשיכים מהתוצאה: ' + s.before);
          var hist = C.steps.slice(0, i).map(function (p) { return p.before + ' ' + opText(p) + ' = ' + p.after; }).join('   ·   ');
          root.appendChild(el('p', { class: 'mm-label' }, 'צעד ' + (i + 1) + ' מתוך ' + C.steps.length));
          var qMark = el('span', { class: 'mm-q' }, '?');
          root.appendChild(el('div', { class: 'mm-cards', 'aria-live': 'polite' }, [card(String(s.before), 'mm-start'), card(opText(s), 'mm-op mm-now'),
            el('span', { class: 'mm-eq' }, ['= ', qMark])]));
          root.appendChild(el('p', { class: 'mm-hist' }, hist));
          root.appendChild(choiceGrid(stepQuestion(s, ctx), s.after, function (ok) {
            if (!ok) allOk = false;
            qMark.textContent = String(s.after);
            qMark.classList.add('mm-done');
            ctx.feedback(ok, ok ? null : '⁦' + s.before + ' ' + opText(s) + ' = ' + s.after + '⁩')
              .then(function () { return ctx.wait(ok ? 300 : 900); })
              .then(function () { i++; step(); });
          }));
        }
        step();
      }

      /* the steps come one by one ("הבא"); the answer is given only at the end */
      function endChain(C) {
        var hide = C.mode === 'hide';
        var shown = -1; // -1 = only the start number
        var label = el('p', { class: 'mm-label' });
        var cards = el('div', { class: 'mm-cards', 'aria-live': 'polite' });
        var dots = el('div', { class: 'mm-steps-done', 'aria-hidden': 'true' });
        var actions = el('div');
        root.appendChild(label);
        root.appendChild(cards);
        if (hide) root.appendChild(dots);
        root.appendChild(actions);
        ctx.setStatus(hide ? 'כל צעד מופיע פעם אחת. זכרו את התוצאה' : 'עשו את הצעדים בראש, אחד אחרי השני');

        function render() {
          cards.innerHTML = '';
          dots.innerHTML = '';
          if (shown < 0) {
            label.textContent = 'מתחילים מ:';
            cards.appendChild(card(String(C.start), 'mm-start mm-huge'));
          } else if (hide) {
            label.textContent = 'צעד ' + (shown + 1) + ' מתוך ' + C.steps.length;
            cards.appendChild(card(opText(C.steps[shown]), 'mm-op mm-huge'));
          } else {
            label.textContent = 'צעד ' + (shown + 1) + ' מתוך ' + C.steps.length;
            cards.appendChild(card(String(C.start), 'mm-start'));
            for (var k = 0; k <= shown; k++) cards.appendChild(card(opText(C.steps[k]), 'mm-op' + (k === shown ? ' mm-now' : '')));
          }
          for (var d = 0; d < C.steps.length; d++) dots.appendChild(el('i', { class: d <= shown ? 'on' : '' }));
          actions.innerHTML = '';
          var lastStep = shown >= C.steps.length - 1;
          actions.appendChild(nextBtn(lastStep ? 'לתשובה' : 'הבא', function () {
            if (lastStep) ask(); else { shown++; render(); }
          }));
        }

        function ask() {
          actions.innerHTML = '';
          dots.remove();
          label.textContent = 'מה התוצאה בסוף?';
          if (hide) {
            cards.innerHTML = '';
            cards.appendChild(card(String(C.start), 'mm-start'));
            C.steps.forEach(function () { cards.appendChild(card('?', 'mm-op')); });
          } else {
            cards.querySelectorAll('.mm-now').forEach(function (c) { c.classList.remove('mm-now'); });
          }
          ctx.setStatus('מה יצא בסוף השרשרת?');
          var grid = choiceGrid(C.choices, C.answer, function (ok) {
            if (ok) chainsRight++;
            // the solution, step by step
            label.remove(); cards.remove();
            var sol = el('div', { class: 'mm-sol', role: 'note' }, [el('h3', null, ok ? 'נכון! כך זה יוצא:' : 'כך פותרים:')].concat(C.steps.map(function (s) {
              return el('div', { class: 'mm-line' }, s.before + ' ' + opText(s) + ' = ' + s.after);
            })));
            root.insertBefore(sol, grid);
            ctx.setStatus(ok ? 'נכון! התוצאה: ' + C.answer : 'התוצאה הנכונה: ' + C.answer);
            ctx.feedback(ok, ok ? null : 'התוצאה הנכונה: ' + C.answer).then(function () {
              root.appendChild(nextBtn(round >= ROUNDS ? 'לסיכום' : 'הבא', nextRound));
            });
          });
          root.insertBefore(grid, actions);
        }
        render();
      }

      nextRound();
    }
  });
})();
