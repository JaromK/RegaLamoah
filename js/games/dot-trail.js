/* חיבור נקודות — classic connect-the-dots: tap the dots in order and a picture appears (a house, a fish, a boat…).
   When all dots are joined the outline is drawn nicely and the player chooses its name from four. The order rule
   changes with the level: 1-2-3…, counting by 2/3/4/5 among extra (decoy) numbers, counting down, and number/letter
   in turn (1-א-2-ב…). Both the connecting and the naming count (executive, perception). Untimed. */
(function () {
  'use strict';

  var LETTERS = 'אבגדהוזחטיכלמנסעפצקרשת'.split('');

  /* ---------- drawings: point lists in a 0–100 box (y down). s = strokes (c: closed), deco = details drawn
     only in the finished picture, g = group of look-alikes (used for harder name choices). ---------- */
  function arc(cx, cy, rx, ry, a0, a1, n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var a = (a0 + (a1 - a0) * i / (n - 1)) * Math.PI / 180;
      out.push([Math.round((cx + rx * Math.cos(a)) * 10) / 10, Math.round((cy + ry * Math.sin(a)) * 10) / 10]);
    }
    return out;
  }
  function ring(cx, cy, r, n, a0) { return arc(cx, cy, r, r, a0 || -90, (a0 || -90) + 360 - 360 / n, n); }
  function starPts(cx, cy, R, r, k) {
    var out = [];
    for (var i = 0; i < k * 2; i++) {
      var a = (-90 + i * 180 / k) * Math.PI / 180, rr = i % 2 ? r : R;
      out.push([Math.round((cx + rr * Math.cos(a)) * 10) / 10, Math.round((cy + rr * Math.sin(a)) * 10) / 10]);
    }
    return out;
  }
  function heartPts(n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var t = Math.PI * 2 * i / n;
      var x = 16 * Math.pow(Math.sin(t), 3), y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      out.push([Math.round((50 + x * 2.8) * 10) / 10, Math.round((46 - y * 2.8) * 10) / 10]);
    }
    return out;
  }
  function flowerPts(cx, cy, n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var a = Math.PI * 2 * i / n - Math.PI / 2, r = 24 + 11 * Math.cos(5 * (a + Math.PI / 2));
      out.push([Math.round((cx + r * Math.cos(a)) * 10) / 10, Math.round((cy + r * Math.sin(a)) * 10) / 10]);
    }
    return out;
  }
  function S(p, c) { return { p: p, c: c !== false }; }

  var DRAWINGS = [
    { name: 'בית', g: 'build', s: [S([[20, 95], [20, 50], [10, 50], [50, 12], [68, 29], [68, 14], [76, 14], [76, 37], [90, 50], [80, 50], [80, 95], [58, 95], [58, 68], [42, 68], [42, 95]])],
      deco: [{ r: [27, 58, 10, 10] }] },
    { name: 'דג', g: 'animal', s: [S([[8, 50], [16, 38], [30, 29], [46, 26], [60, 29], [72, 38], [78, 46], [94, 30], [90, 50], [94, 70], [78, 54], [72, 62], [60, 71], [46, 74], [30, 71], [16, 62]])],
      deco: [{ dot: [24, 45] }, { l: [[40, 36], [44, 50], [40, 64]] }] },
    { name: 'כוכב', g: 'star', s: [S(starPts(50, 53, 48, 19, 5))] },
    { name: 'לב', g: 'round', s: [S(heartPts(20))] },
    { name: 'סירה', g: 'vehicle', s: [S([[6, 66], [94, 66], [80, 88], [20, 88]]), S([[50, 60], [50, 6], [84, 60]])], deco: [{ l: [[50, 60], [50, 66]] }] },
    { name: 'חתול', g: 'animal', s: [S([[20, 40], [16, 8], [38, 26], [62, 26], [84, 8], [80, 40], [86, 58], [78, 78], [62, 90], [38, 90], [22, 78], [14, 58]])],
      deco: [{ dot: [36, 52] }, { dot: [64, 52] }, { l: [[46, 64], [54, 64], [50, 70], [46, 64]] }, { l: [[40, 70], [18, 66]] }, { l: [[40, 74], [18, 78]] }, { l: [[60, 70], [82, 66]] }, { l: [[60, 74], [82, 78]] }] },
    { name: 'עץ', g: 'plant', s: [S([[50, 4], [72, 30], [62, 30], [82, 54], [68, 54], [90, 78], [56, 78], [56, 96], [44, 96], [44, 78], [10, 78], [32, 54], [18, 54], [38, 30], [28, 30]])] },
    { name: 'ספל', g: 'dish', s: [S([[18, 20], [70, 20], [66, 88], [22, 88]]), S([[69, 34], [84, 34], [91, 46], [88, 60], [80, 68], [67, 68]], false)],
      deco: [{ l: [[34, 12], [32, 6]] }, { l: [[46, 12], [48, 4]] }, { l: [[58, 12], [56, 6]] }] },
    { name: 'ציפור', g: 'animal', s: [S([[4, 40], [16, 33], [22, 24], [32, 19], [42, 22], [48, 32], [62, 40], [80, 36], [96, 26], [90, 46], [78, 58], [60, 66], [44, 66], [30, 60], [22, 50], [16, 44]])],
      deco: [{ dot: [31, 28] }, { l: [[46, 66], [44, 82]] }, { l: [[56, 66], [58, 82]] }, { l: [[46, 44], [60, 52], [74, 46]] }] },
    { name: 'מטרייה', g: 'tool', s: [S([[6, 50], [12, 32], [26, 16], [50, 8], [74, 16], [88, 32], [94, 50], [83, 44], [72, 50], [61, 44], [50, 50], [39, 44], [28, 50], [17, 44]]), S([[50, 50], [50, 86], [46, 94], [38, 94], [34, 86]], false)] },
    { name: 'מכונית', g: 'vehicle', s: [S([[6, 70], [6, 52], [22, 48], [32, 30], [68, 30], [80, 48], [94, 52], [94, 70]])],
      deco: [{ r: [26, 72, 9] }, { r: [74, 72, 9] }, { l: [[36, 34], [36, 48], [64, 48], [64, 34]] }, { l: [[50, 30], [50, 48]] }] },
    { name: 'תפוח', g: 'fruit', s: [S([[50, 26], [62, 18], [78, 20], [90, 34], [92, 52], [86, 72], [74, 88], [60, 92], [50, 88], [40, 92], [26, 88], [14, 72], [8, 52], [10, 34], [22, 20], [38, 18]])],
      deco: [{ l: [[50, 26], [53, 8]] }, { l: [[54, 14], [64, 6], [72, 10], [60, 16], [54, 14]] }] },
    { name: 'ירח', g: 'round', s: [S(arc(50, 50, 44, 44, 60, 300, 12).concat(arc(68, 50, 34, 38, 250, 110, 9)))] },
    { name: 'שמש', g: 'star', s: [S(starPts(50, 50, 48, 32, 10))], deco: [{ r: [50, 50, 22] }, { dot: [42, 46] }, { dot: [58, 46] }, { l: [[42, 57], [50, 61], [58, 57]] }] },
    { name: 'פרח', g: 'plant', s: [S(flowerPts(50, 36, 20)), S([[50, 72], [50, 84], [64, 74], [76, 74], [68, 84], [50, 90], [50, 99]], false)], deco: [{ r: [50, 36, 9] }] },
    { name: 'מפתח', g: 'tool', s: [S([[40, 45], [92, 45], [92, 62], [84, 62], [84, 55], [76, 55], [76, 64], [68, 64], [68, 55], [40, 55]].concat(arc(24, 50, 18, 18, 18, 342, 9)))], deco: [{ r: [22, 50, 7] }] },
    { name: 'פעמון', g: 'tool', s: [S([[50, 8], [58, 12], [66, 24], [70, 44], [74, 62], [86, 74], [86, 80], [14, 80], [14, 74], [26, 62], [30, 44], [34, 24], [42, 12]])], deco: [{ r: [50, 87, 6] }, { l: [[50, 8], [50, 3]] }] },
    { name: 'פרפר', g: 'animal', s: [S([[50, 30], [64, 12], [84, 8], [94, 20], [88, 40], [72, 50], [86, 62], [86, 82], [70, 90], [54, 74], [50, 80], [46, 74], [30, 90], [14, 82], [14, 62], [28, 50], [12, 40], [6, 20], [16, 8], [36, 12]])],
      deco: [{ l: [[50, 24], [50, 80]] }, { l: [[50, 26], [42, 10]] }, { l: [[50, 26], [58, 10]] }, { r: [72, 28, 6] }, { r: [28, 28, 6] }] },
    { name: 'עלה', g: 'plant', s: [S([[50, 4], [64, 16], [74, 32], [78, 50], [72, 68], [60, 80], [50, 86], [40, 80], [28, 68], [22, 50], [26, 32], [36, 16]]), S([[50, 86], [50, 99]], false)],
      deco: [{ l: [[50, 10], [50, 86]] }, { l: [[50, 34], [66, 24]] }, { l: [[50, 34], [34, 24]] }, { l: [[50, 54], [70, 42]] }, { l: [[50, 54], [30, 42]] }] },
    { name: 'דגל', g: 'tool', s: [S([[20, 98], [20, 6]], false), S([[22, 8], [40, 14], [60, 6], [82, 12], [82, 46], [60, 40], [40, 48], [22, 42]])] },
    { name: 'בלון', g: 'round', s: [S([[50, 6], [66, 10], [78, 22], [82, 38], [78, 54], [66, 68], [54, 76], [58, 82], [42, 82], [46, 76], [34, 68], [22, 54], [18, 38], [22, 22], [34, 10]]), S([[50, 82], [42, 90], [56, 94], [48, 100]], false)] },
    { name: 'אגס', g: 'fruit', s: [S([[50, 10], [58, 14], [62, 26], [66, 40], [78, 52], [84, 68], [80, 84], [66, 94], [50, 96], [34, 94], [20, 84], [16, 68], [22, 52], [34, 40], [38, 26], [42, 14]])], deco: [{ l: [[50, 10], [52, 2]] }] },
    { name: 'ארנב', g: 'animal', s: [S([[36, 50], [28, 30], [26, 10], [32, 2], [40, 8], [44, 28], [46, 44], [54, 44], [56, 28], [60, 8], [68, 2], [74, 10], [72, 30], [64, 50], [74, 60], [78, 74], [72, 88], [58, 96], [42, 96], [28, 88], [22, 74], [26, 60]])],
      deco: [{ dot: [40, 68] }, { dot: [60, 68] }, { l: [[46, 80], [50, 84], [54, 80]] }, { l: [[32, 12], [38, 36]] }, { l: [[68, 12], [62, 36]] }] },
    { name: 'טירה', g: 'build', s: [S([[10, 96], [10, 26], [4, 26], [4, 12], [12, 12], [12, 20], [18, 20], [18, 12], [26, 12], [26, 40], [40, 40], [40, 32], [48, 32], [48, 40], [52, 40], [52, 32], [60, 32], [60, 40], [74, 40], [74, 12], [82, 12], [82, 20], [88, 20], [88, 12], [96, 12], [96, 26], [90, 26], [90, 96], [60, 96], [60, 76], [56, 68], [50, 65], [44, 68], [40, 76], [40, 96]])] },
    { name: 'כתר', g: 'tool', s: [S([[10, 80], [6, 30], [28, 52], [38, 16], [50, 44], [62, 16], [72, 52], [94, 30], [90, 80]])], deco: [{ l: [[12, 70], [88, 70]] }, { r: [38, 12, 3] }, { r: [62, 12, 3] }] },
    { name: 'כוס יין', g: 'dish', s: [S([[24, 6], [76, 6], [74, 26], [64, 42], [54, 48], [54, 82], [72, 90], [72, 94], [28, 94], [28, 90], [46, 82], [46, 48], [36, 42], [26, 26]])], deco: [{ l: [[26, 20], [74, 20]] }] },
    { name: 'מגף', g: 'cloth', s: [S([[30, 6], [56, 6], [56, 58], [70, 64], [88, 70], [94, 80], [94, 92], [30, 92]])], deco: [{ l: [[30, 16], [56, 16]] }] },
    { name: 'חולצה', g: 'cloth', s: [S([[34, 10], [42, 16], [50, 18], [58, 16], [66, 10], [88, 22], [96, 40], [80, 48], [76, 40], [76, 92], [24, 92], [24, 40], [20, 48], [4, 40], [12, 22]])] },
    { name: 'מטוס', g: 'vehicle', s: [S([[50, 4], [56, 12], [56, 36], [94, 56], [94, 64], [56, 54], [56, 80], [68, 90], [68, 96], [50, 92], [32, 96], [32, 90], [44, 80], [44, 54], [6, 64], [6, 56], [44, 36], [44, 12]])] },
    { name: 'טיל', g: 'vehicle', s: [S([[50, 4], [62, 18], [66, 36], [66, 66], [80, 80], [80, 94], [66, 86], [34, 86], [20, 94], [20, 80], [34, 66], [34, 36], [38, 18]])], deco: [{ r: [50, 40, 8] }, { l: [[42, 90], [46, 99]] }, { l: [[58, 90], [54, 99]] }] },
    { name: 'פטרייה', g: 'plant', s: [S([[8, 48], [12, 30], [26, 14], [50, 8], [74, 14], [88, 30], [92, 48], [62, 48], [64, 80], [66, 92], [34, 92], [36, 80], [38, 48]])], deco: [{ r: [32, 30, 5] }, { r: [56, 22, 6] }, { r: [74, 36, 4] }] },
    { name: 'עפיפון', g: 'tool', s: [S([[50, 4], [80, 34], [50, 74], [20, 34]]), S([[50, 74], [42, 82], [56, 88], [46, 96]], false)], deco: [{ l: [[50, 4], [50, 74]] }, { l: [[20, 34], [80, 34]] }] },
    { name: 'שעון', g: 'round', s: [S(ring(50, 50, 46, 24))], deco: [{ l: [[50, 50], [50, 20]] }, { l: [[50, 50], [70, 58]] }, { dot: [50, 50] }, { dot: [50, 10] }, { dot: [90, 50] }, { dot: [50, 90] }, { dot: [10, 50] }] },
    { name: 'בקבוק', g: 'dish', s: [S([[42, 4], [58, 4], [58, 20], [64, 30], [70, 42], [70, 94], [30, 94], [30, 42], [36, 30], [42, 20]])], deco: [{ l: [[30, 56], [70, 56]] }, { l: [[30, 76], [70, 76]] }] },
    { name: 'אוהל', g: 'build', s: [S([[50, 6], [74, 48], [96, 90], [60, 90], [50, 62], [40, 90], [4, 90], [26, 48]])], deco: [{ l: [[50, 6], [50, 0]] }] },
    { name: 'צב', g: 'animal', s: [S([[10, 64], [16, 56], [20, 42], [32, 28], [50, 22], [68, 26], [80, 38], [84, 46], [90, 40], [98, 44], [98, 54], [90, 58], [86, 62], [80, 62], [80, 74], [70, 74], [70, 62], [38, 62], [38, 74], [28, 74], [28, 62]])],
      deco: [{ dot: [93, 46] }, { l: [[32, 48], [50, 36], [68, 46]] }, { l: [[50, 36], [50, 60]] }] },
    { name: 'יהלום', g: 'star', s: [S([[24, 10], [50, 10], [76, 10], [96, 34], [73, 64], [50, 94], [27, 64], [4, 34]])], deco: [{ l: [[4, 34], [96, 34]] }, { l: [[24, 10], [36, 34], [50, 94]] }, { l: [[76, 10], [64, 34], [50, 94]] }, { l: [[50, 10], [36, 34]] }, { l: [[50, 10], [64, 34]] }] },
    { name: 'מגן דוד', g: 'star', s: [S([[50, 4], [90, 74], [10, 74]]), S([[50, 96], [10, 26], [90, 26]])] },
    { name: 'משקפיים', g: 'tool', s: [S(ring(25, 52, 19, 10)), S(ring(75, 52, 19, 10))], deco: [{ l: [[42, 46], [50, 42], [58, 46]] }, { l: [[6, 48], [2, 36]] }, { l: [[94, 48], [98, 36]] }] },
    { name: 'נר', g: 'tool', s: [S([[36, 40], [64, 40], [64, 96], [36, 96]]), S([[50, 4], [58, 18], [60, 28], [50, 36], [40, 28], [42, 18]])] },
    { name: 'ענן', g: 'round', s: [S([[10, 70], [6, 58], [12, 46], [24, 42], [28, 30], [40, 22], [54, 24], [62, 32], [72, 28], [84, 34], [88, 46], [96, 56], [92, 68], [82, 72], [46, 72]])] }
  ];

  /* ---------- the order of the dots ---------- */
  /* Level 1–50 → [kind, step, decoys]. kinds: num (step, step·2, …), down (counting down), mix (1, א, 2, ב…),
     mixdown (counting down, number and letter: 5, ה, 4, ד…). The dot count grows from 8 to 40. */
  var RULES = [
    ['num', 1, 0], ['num', 1, 0], ['num', 1, 0], ['num', 1, 0], ['num', 1, 0],              // 1–5
    ['mix'], ['num', 1, 0], ['num', 2, 3], ['mix'], ['num', 1, 0],                          // 6–10
    ['num', 3, 4], ['mix'], ['num', 2, 5], ['down', 1, 0], ['mix'],                         // 11–15
    ['num', 5, 5], ['num', 1, 0], ['mixdown'], ['mix'], ['num', 2, 6],                      // 16–20
    ['down', 1, 0], ['down', 2, 6], ['mix'], ['num', 4, 6], ['down', 1, 0],                 // 21–25
    ['mixdown'], ['num', 3, 7], ['mix'], ['down', 3, 7], ['num', 5, 7]                      // 26–30
  ];
  var LATE = [['mix'], ['down', 2, 8], ['num', 3, 8], ['mixdown'], ['num', 4, 8], ['down', 1, 0], ['num', 5, 8], ['mix'], ['down', 3, 8], ['num', 2, 8]];

  function spec(level) {
    var L = Math.max(1, Math.min(50, Math.round(Number(level)) || 1));
    var r = L <= 30 ? RULES[L - 1] : LATE[(L - 31) % LATE.length];
    var decoys = r[2] || 0;
    if (L > 40 && decoys) decoys += 2;
    var n = 8 + Math.round((L - 1) * 32 / 49), step = r[1] || 1;
    // numbers stay at most two digits, so every label fits its dot
    if (r[0] === 'num' || r[0] === 'down') n = Math.min(n, Math.floor(99 / step));
    return { level: L, n: n, kind: r[0], step: step, decoys: decoys };
  }

  /* The labels to tap, in order (n of them). */
  function labels(sp, n) {
    var out = [], i;
    if (sp.kind === 'num') { for (i = 1; i <= n; i++) out.push(String(i * sp.step)); return out; }
    if (sp.kind === 'down') { for (i = n; i >= 1; i--) out.push(String(i * sp.step)); return out; }
    var half = Math.ceil(n / 2);
    for (var k = 0; k < half; k++) {
      var num = sp.kind === 'mixdown' ? half - k : k + 1;
      out.push(String(num));
      if (out.length < n) out.push(LETTERS[num - 1]);
    }
    return out;
  }

  /* Decoys: numbers inside the sequence's range that it skips (e.g. odd numbers among 2, 4, 6…). */
  function decoyLabels(sp, order, count, R) {
    if (!count || (sp.kind !== 'num' && sp.kind !== 'down')) return [];
    var nums = order.map(Number), lo = Math.min.apply(null, nums), hi = Math.max.apply(null, nums), pool = [];
    for (var v = lo; v <= hi; v++) if (nums.indexOf(v) === -1) pool.push(String(v));
    return R.shuffle(pool).slice(0, count);
  }

  /* ---------- geometry ---------- */
  function dist(a, b) { return Math.sqrt((a[0] - b[0]) * (a[0] - b[0]) + (a[1] - b[1]) * (a[1] - b[1])); }
  function segDist(p, a, b) {
    var dx = b[0] - a[0], dy = b[1] - a[1], L2 = dx * dx + dy * dy;
    var t = L2 ? Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L2)) : 0;
    return dist(p, [a[0] + t * dx, a[1] + t * dy]);
  }
  function strokeLen(st) {
    var L = 0, p = st.p;
    for (var i = 1; i < p.length; i++) L += dist(p[i - 1], p[i]);
    if (st.c) L += dist(p[p.length - 1], p[0]);
    return L;
  }
  function area(a, b, c) { return Math.abs((b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1])) / 2; }
  // how much a point matters to the shape (Visvalingam): the triangle it makes with its neighbours
  function weight(p, i, closed) {
    var n = p.length;
    if (!closed && (i === 0 || i === n - 1)) return Infinity;
    return area(p[(i - 1 + n) % n], p[i], p[(i + 1) % n]);
  }
  function bbox(d) {
    var xs = [], ys = [];
    d.s.forEach(function (st) { st.p.forEach(function (q) { xs.push(q[0]); ys.push(q[1]); }); });
    return [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)];
  }

  /* Map a drawing into a W×H px board (margin m); returns a function for points and the scaled strokes. */
  function fit(d, W, H, m) {
    var b = bbox(d), bw = Math.max(1, b[2] - b[0]), bh = Math.max(1, b[3] - b[1]);
    var s = Math.min((W - 2 * m) / bw, (H - 2 * m) / bh);
    var ox = (W - bw * s) / 2 - b[0] * s, oy = (H - bh * s) / 2 - b[1] * s;
    var f = function (q) { return [ox + q[0] * s, oy + q[1] * s]; };
    return { f: f, s: s, strokes: d.s.map(function (st) { return { p: st.p.map(f), c: st.c }; }) };
  }

  var MIN_D = 32, MAX_D = 54;

  /* k dots along one stroke, evenly spaced by length, each corner of the outline pulling the nearest dot onto it
     (the sharpest corners first), so the dots keep the picture's shape. */
  function resample(st, k, gap) {
    var p = st.p, n = p.length, segs = st.c ? n : n - 1, cum = [0];
    for (var i = 0; i < segs; i++) cum.push(cum[i] + dist(p[i], p[(i + 1) % n]));
    var Ls = cum[segs];
    function at(t) {
      t = ((t % Ls) + Ls) % Ls;
      if (!st.c && t >= Ls) return p[n - 1].slice();
      for (var j = 0; j < segs; j++) if (t <= cum[j + 1] || j === segs - 1) {
        var f = (t - cum[j]) / Math.max(1e-9, cum[j + 1] - cum[j]), A = p[j], B = p[(j + 1) % n];
        return [A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f];
      }
    }
    var step = st.c ? Ls / k : Ls / (k - 1), ts = [];
    for (var m = 0; m < k; m++) ts.push(m * step);
    var pts = ts.map(at), fixed = {};
    if (!st.c) { fixed[0] = true; fixed[k - 1] = true; }
    var corners = [];
    for (var c = 0; c < n; c++) {
      if (!st.c && (c === 0 || c === n - 1)) continue;
      var A = p[(c - 1 + n) % n], B = p[c], C = p[(c + 1) % n];
      var a1 = Math.atan2(B[1] - A[1], B[0] - A[0]), a2 = Math.atan2(C[1] - B[1], C[0] - B[0]);
      var turn = Math.abs(((a2 - a1) * 180 / Math.PI + 540) % 360 - 180);
      if (turn >= 28) corners.push({ i: c, w: turn, t: cum[c] });
    }
    corners.sort(function (x, y) { return y.w - x.w; });
    corners.forEach(function (cn) {
      var bj = -1, bd = Infinity;
      for (var j = 0; j < k; j++) {
        if (fixed[j]) continue;
        var dd = Math.abs(ts[j] - cn.t);
        if (st.c) dd = Math.min(dd, Ls - dd);
        if (dd < bd) { bd = dd; bj = j; }
      }
      if (bj < 0 || bd > step * 0.55) return;
      var q = p[cn.i], prev = st.c ? (bj - 1 + k) % k : bj - 1, next = st.c ? (bj + 1) % k : bj + 1;
      if (prev >= 0 && prev !== bj && dist(q, pts[prev]) < gap) return;
      if (next < k && next !== bj && dist(q, pts[next]) < gap) return;
      pts[bj] = q.slice(); fixed[bj] = true;
    });
    return pts;
  }

  /* Dots for a drawing on a W×H board: about `want` of them, no two closer than the dot size + 3 px (the biggest
     dot size that still gives enough dots). Returns { dots: [{x, y, stroke, first, last, closed}], D, strokes (px,
     full detail), fit }. */
  function plan(d, want, W, H) {
    var F = fit(d, W, H, MAX_D / 2 + 4);
    var strokes = F.strokes;
    var lens = strokes.map(strokeLen), total = lens.reduce(function (a, b) { return a + b; }, 0);
    var best = null;
    for (var D = MAX_D; D >= MIN_D; D -= 2) {
      var gap = D + 3;
      var ks = strokes.map(function (st, i) {
        var most = st.c ? Math.floor(lens[i] / gap) : Math.floor(lens[i] / gap) + 1;
        return Math.max(st.c ? 3 : 2, Math.min(most, Math.round(want * lens[i] / total)));
      });
      var pts = strokes.map(function (st, i) { return resample(st, ks[i], gap); });
      // a later stroke that starts (or ends) on a dot of an earlier one: that dot is shared, its own copy goes
      var att = strokes.map(function () { return { s: null, e: null }; });
      for (var si = 1; si < pts.length; si++) {
        var earlier = [].concat.apply([], pts.slice(0, si));
        var near = function (q) { for (var e = 0; e < earlier.length; e++) if (dist(q, earlier[e]) < gap) return earlier[e]; return null; };
        var hs = near(pts[si][0]);
        if (hs && pts[si].length > 1) { att[si].s = hs; pts[si].shift(); }
        var he = !strokes[si].c && pts[si].length > 1 ? near(pts[si][pts[si].length - 1]) : null;
        if (he) { att[si].e = he; pts[si].pop(); }
      }
      var minOf = function (i) { return att[i].s || att[i].e ? 1 : strokes[i].c ? 3 : 2; };
      // no two dots closer than the gap: of the closest pair drop the less important dot (on a later stroke first)
      for (var guard = 0; guard < 300; guard++) {
        var worst = null;
        for (var s1 = 0; s1 < pts.length; s1++) for (var i1 = 0; i1 < pts[s1].length; i1++)
          for (var s3 = s1; s3 < pts.length; s3++) for (var i3 = s3 === s1 ? i1 + 1 : 0; i3 < pts[s3].length; i3++) {
            var dd = dist(pts[s1][i1], pts[s3][i3]);
            if (dd < gap && (!worst || dd < worst.d)) worst = { d: dd, a: [s1, i1], b: [s3, i3] };
          }
        if (!worst) break;
        var cand = [worst.a, worst.b].filter(function (c) { return pts[c[0]].length > minOf(c[0]); });
        if (!cand.length) { pts = null; break; }
        if (cand.length === 2 && cand[0][0] !== cand[1][0]) cand = [cand[1]];
        cand.sort(function (x, y) { return weight(pts[x[0]], x[1], strokes[x[0]].c) - weight(pts[y[0]], y[1], strokes[y[0]].c); });
        pts[cand[0][0]].splice(cand[0][1], 1);
      }
      if (!pts) continue;
      var cnt = pts.reduce(function (x, q) { return x + q.length; }, 0);
      if (!best || cnt > best.c) best = { pts: pts, c: cnt, D: D, att: att };
      if (cnt >= want * 0.92) break;
    }
    if (!best) best = { pts: strokes.map(function (st) { return resample(st, st.c ? 3 : 2, MIN_D); }), D: MIN_D, att: strokes.map(function () { return { s: null, e: null }; }) };
    var dots = [];
    best.pts.forEach(function (q, si) {
      q.forEach(function (r, k) {
        dots.push({ x: r[0], y: r[1], stroke: si, first: k === 0, last: k === q.length - 1, closed: strokes[si].c,
          from: k === 0 ? best.att[si].s : null, to: k === q.length - 1 ? best.att[si].e : null });
      });
    });
    return { dots: dots, D: best.D, strokes: strokes, fit: F };
  }

  /* How many dots a drawing can hold on this board (cached per board size). */
  var capCache = {};
  function capacity(d, W, H) {
    var key = d.name + '|' + Math.round(W) + 'x' + Math.round(H);
    if (capCache[key] == null) capCache[key] = Math.floor(fit(d, W, H, MAX_D / 2 + 4).strokes.map(strokeLen).reduce(function (a, b) { return a + b; }, 0) / (MIN_D + 3) * 0.85);
    return capCache[key];
  }
  function vertexCount(d) { return d.s.reduce(function (a, st) { return a + st.p.length; }, 0); }

  /* Choose a drawing: one that holds the wanted dots, and whose own corner count is close to it. */
  function chooseDrawing(want, W, H, used, R) {
    var list = DRAWINGS.map(function (d, i) { return { i: i, cap: capacity(d, W, H), v: vertexCount(d) }; })
      .filter(function (x) { return used.indexOf(x.i) === -1; });
    var fits = list.filter(function (x) { return x.cap >= want * 0.9; });
    if (fits.length < 3) fits = list.slice().sort(function (a, b) { return b.cap - a.cap; }).slice(0, 4);
    fits.sort(function (a, b) { return Math.abs(a.v - want) - Math.abs(b.v - want); });
    return R.pick(fits.slice(0, 7)).i;
  }

  /* Four names: the right one and three others (look-alikes from the same group at higher levels). */
  function nameOptions(di, level, R) {
    var d = DRAWINGS[di], others = DRAWINGS.filter(function (x, i) { return i !== di; });
    var same = R.shuffle(others.filter(function (x) { return x.g === d.g; }));
    var rest = R.shuffle(others.filter(function (x) { return x.g !== d.g; }));
    var nSame = level >= 30 ? 2 : level >= 15 ? 1 : 0;
    var pick = same.slice(0, nSame).concat(rest).slice(0, 3);
    return R.shuffle([d.name].concat(pick.map(function (x) { return x.name; })));
  }

  /* Decoy positions: away from every dot and from the picture's lines. */
  function placeDecoys(count, pl, W, H, rnd) {
    var out = [], D = pl.D, m = D / 2 + 4;
    var segs = [];
    pl.strokes.forEach(function (st) {
      for (var i = 1; i < st.p.length; i++) segs.push([st.p[i - 1], st.p[i]]);
      if (st.c) segs.push([st.p[st.p.length - 1], st.p[0]]);
    });
    for (var t = 0; t < 600 && out.length < count; t++) {
      var p = [m + rnd() * (W - 2 * m), m + rnd() * (H - 2 * m)];
      if (pl.dots.some(function (d) { return dist(p, [d.x, d.y]) < D + 8; })) continue;
      if (out.some(function (q) { return dist(p, q) < D + 8; })) continue;
      if (segs.some(function (s) { return segDist(p, s[0], s[1]) < D * 0.8; })) continue;
      out.push(p);
    }
    return out;
  }

  var css = [
    '.dt-board{position:relative;width:100%;max-width:24rem;height:min(34rem,calc(100svh - 15.5rem));min-height:18rem;',
    'background:var(--surface-2);border:2px solid var(--line);border-radius:var(--radius);touch-action:manipulation;}',
    '.dt-board.is-named{height:min(22rem,calc(100svh - 27rem));min-height:12rem;}',
    '.dt-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;}',
    '.dt-svg .dt-ln{stroke:var(--c-blue);stroke-width:3;stroke-linecap:round;fill:none;}',
    '.dt-svg .dt-final{stroke:var(--c-blue);stroke-width:6;stroke-linejoin:round;stroke-linecap:round;fill:var(--c-blue-soft);}',
    '.dt-svg .dt-final.dt-open{fill:none;}',
    '.dt-svg .dt-deco{stroke:var(--c-blue);stroke-width:4;stroke-linecap:round;stroke-linejoin:round;fill:none;}',
    '.dt-svg .dt-dot{fill:var(--c-blue);stroke:none;}',
    '.dt-dot{--d:3rem;position:absolute;transform:translate(-50%,-50%);min-width:var(--d);height:var(--d);padding:0 .2rem;border-radius:999px;',
    'border:3px solid var(--ink-soft);background:var(--surface);color:var(--ink);font-weight:900;font-size:max(1.05rem,calc(var(--d) * .44));line-height:1;cursor:pointer;',
    'display:grid;place-items:center;white-space:nowrap;font-variant-numeric:tabular-nums;}',
    '.dt-dot.is-done{background:var(--c-blue);border-color:var(--c-blue);color:#fff;}',
    '.dt-dot.is-last{box-shadow:0 0 0 4px var(--c-blue-soft);}',
    '.dt-dot.is-next-hint{border-color:var(--c-yellow);box-shadow:0 0 0 5px var(--c-yellow);}',
    '.dt-dot.is-miss{animation:dt-shake .35s;}',
    '.is-named .dt-dot{display:none;}',
    '@keyframes dt-shake{25%{transform:translate(-56%,-50%)}75%{transform:translate(-44%,-50%)}}',
    '@media (prefers-reduced-motion: reduce){.dt-dot.is-miss{animation:none;}}',
    '.dt-next{margin:0;font-size:1.15rem;font-weight:800;text-align:center;min-height:1.6rem;}',
    '.dt-names{width:100%;max-width:24rem;grid-template-columns:1fr 1fr;}',
    '.dt-names .g-choice{font-size:1.45rem;min-height:3.6rem;}'
  ].join('');

  function intro(sp, order) {
    var seq = order.slice(0, 4).join(', ') + '…';
    if (sp.kind === 'mix') return 'לסירוגין מספר ואות: ' + seq;
    if (sp.kind === 'mixdown') return 'לאחור, מספר ואות: ' + seq;
    if (sp.kind === 'down') return (sp.step === 1 ? 'סופרים לאחור: ' : 'לאחור בקפיצות של ' + sp.step + ': ') + seq;
    if (sp.step === 1) return 'חברו לפי הסדר: ' + seq;
    return 'קופצים ב-' + sp.step + ': ' + seq;
  }

  BrainGames.register({
    id: 'dot-trail',
    name: 'חיבור נקודות',
    skill: 'executive',
    tagline: 'חברו את הנקודות לפי הסדר וגלו איזה ציור יצא',
    benefit: 'קשב, סריקה, מעבר בין רצפים וזיהוי צורות',
    instructions: [
      'על הלוח יש נקודות עם מספרים. לחצו עליהן לפי הסדר, וקו יחבר ביניהן.',
      'כשכל הנקודות מחוברות מופיע ציור. בחרו מה ציירתם: בית, דג, סירה…',
      'בשלבים מתקדמים הסדר משתנה: קופצים ב-2 או ב-5 (ויש גם נקודות מיותרות), סופרים לאחור, או מספר ואות לסירוגין (1, א, 2, ב…).',
      'אין שעון. לחיצה לא נכונה לא מוחקת כלום, פשוט ממשיכים.'
    ],
    css: css,
    _model: { DRAWINGS: DRAWINGS, spec: spec, labels: labels, decoyLabels: decoyLabels, plan: plan, capacity: capacity, chooseDrawing: chooseDrawing, nameOptions: nameOptions, placeDecoys: placeDecoys, dist: dist },
    start: function (root, ctx) {
      var el = ctx.el;
      var sp = spec(ctx.level);
      var ROUNDS = sp.n <= 20 ? 3 : 2;
      var round = 0, good = 0, total = 0, named = 0, totalMiss = 0, used = [];
      var SVGNS = 'http://www.w3.org/2000/svg';

      function svgEl(tag, attrs) {
        var e = document.createElementNS(SVGNS, tag);
        Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
        return e;
      }

      function nextRound() {
        round++;
        if (round > ROUNDS) {
          ctx.finish({ correct: good, total: total,
            note: 'זיהיתם ' + named + ' ציורים מתוך ' + ROUNDS + (totalMiss ? ' · לחיצות לא נכונות: ' + totalMiss : ' · חיברתם בלי אף טעות!') });
          return;
        }
        ctx.setProgress(round, ROUNDS);
        play();
      }

      function play() {
        root.innerHTML = '';
        var board = el('div', { class: 'dt-board' });
        var next = el('p', { class: 'dt-next', 'aria-live': 'polite' });
        root.appendChild(board);
        root.appendChild(next);
        var W = board.clientWidth || 300, H = board.clientHeight || 420;
        var di = chooseDrawing(sp.n, W, H, used, ctx);
        used.push(di);
        var drawing = DRAWINGS[di];
        var pl = plan(drawing, sp.n, W, H);
        var order = labels(sp, pl.dots.length);
        var dl = decoyLabels(sp, order, sp.decoys, ctx);
        var dpos = placeDecoys(dl.length, pl, W, H, Math.random);
        dl = dl.slice(0, dpos.length);

        var svg = svgEl('svg', { class: 'dt-svg', viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'xMidYMid meet', 'aria-hidden': 'true' });
        board.appendChild(svg);
        // dots: the picture's dots (index = place in the order), then the decoys; random DOM order
        var all = pl.dots.map(function (d, i) { return { x: d.x, y: d.y, lab: order[i], i: i }; })
          .concat(dpos.map(function (p, k) { return { x: p[0], y: p[1], lab: dl[k], i: -1 - k }; }));
        var btns = {};
        board._order = order; // (for tests) not in the DOM, so reading order gives nothing away
        ctx.shuffle(all).forEach(function (o) {
          var b = el('button', { class: 'dt-dot', type: 'button', 'aria-label': o.lab,
            style: { left: (o.x / W * 100) + '%', top: (o.y / H * 100) + '%', '--d': pl.D + 'px' }, onclick: function () { tap(o.i, b); } }, o.lab);
          btns[o.i] = b;
          board.appendChild(b);
        });

        var pos = 0, misses = 0, stepMiss = 0, n = pl.dots.length;
        var INTRO = intro(sp, order);
        ctx.setStatus(INTRO);
        update();

        function update() {
          next.textContent = pos === 0 ? 'מתחילים ב-' + order[0] : pos < n ? 'אחרי ' + order[pos - 1] + ' בא…' : '';
        }
        function line(a, b) {
          svg.appendChild(svgEl('line', { class: 'dt-ln', x1: a.x, y1: a.y, x2: b.x, y2: b.y }));
        }

        function tap(i, b) {
          if (pos >= n) return;
          if (i >= 0 && i < pos) return; // already joined
          if (i !== pos) {
            misses++; stepMiss++; totalMiss++;
            ctx.sound('bad');
            b.classList.remove('is-miss'); void b.offsetWidth; b.classList.add('is-miss');
            if (stepMiss >= 3) {
              btns[pos].classList.add('is-next-hint');
              ctx.setStatus('הנקודה הבאה מסומנת בצהוב: ' + order[pos]);
            } else {
              ctx.setStatus('לא זו. ' + (pos === 0 ? 'מתחילים ב-' + order[0] : 'מה בא אחרי ' + order[pos - 1] + '?'));
            }
            return;
          }
          ctx.sound('tap');
          stepMiss = 0;
          b.classList.remove('is-next-hint');
          var d = pl.dots[i];
          if (pos > 0) btns[pos - 1].classList.remove('is-last');
          if (!d.first) line(pl.dots[pos - 1], d);           // a new stroke starts without a line…
          else if (d.from) line({ x: d.from[0], y: d.from[1] }, d); // …unless it grows out of an earlier dot
          if (d.last && d.to) line(d, { x: d.to[0], y: d.to[1] });
          if (d.last && d.closed) { // close the shape back to where it started
            for (var k = i; k >= 0; k--) if (pl.dots[k].first) { var f0 = pl.dots[k]; line(d, f0.from ? { x: f0.from[0], y: f0.from[1] } : f0); break; }
          }
          b.classList.add('is-done', 'is-last');
          pos++;
          update();
          if (pos < n) { ctx.setStatus(INTRO); return; }
          finishDrawing();
        }

        function finishDrawing() {
          var ok = misses <= 1 + Math.floor(n / 15);
          total++; if (ok) good++;
          ctx.sound('good');
          // the finished picture: the full outline, thick and softly filled, with its details
          [].slice.call(svg.querySelectorAll('.dt-ln')).forEach(function (x) { x.remove(); });
          pl.strokes.forEach(function (st) {
            var dstr = st.p.map(function (q, k) { return (k ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join(' ') + (st.c ? ' Z' : '');
            svg.appendChild(svgEl('path', { class: 'dt-final' + (st.c ? '' : ' dt-open'), d: dstr }));
          });
          var f = pl.fit.f, sc = pl.fit.s;
          (drawing.deco || []).forEach(function (o) {
            if (o.l) svg.appendChild(svgEl('polyline', { class: 'dt-deco', points: o.l.map(function (q) { var p = f(q); return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' ') }));
            if (o.r) {
              var c = f(o.r); svg.appendChild(svgEl('ellipse', { class: 'dt-deco', cx: c[0], cy: c[1], rx: o.r[2] * sc, ry: (o.r[3] || o.r[2]) * sc }));
            }
            if (o.dot) { var p = f(o.dot); svg.appendChild(svgEl('circle', { class: 'dt-dot', cx: p[0], cy: p[1], r: Math.max(4, 2.6 * sc) })); }
          });
          board.classList.add('is-named');
          next.remove();
          ctx.setStatus(ok ? 'יפה! מה ציירתם?' : 'סיימתם! מה ציירתם?');
          var answered = false;
          var opts = nameOptions(di, sp.level, ctx);
          var grid = el('div', { class: 'g-choices dt-names' });
          var actions = el('div', { class: 'g-actions' });
          opts.forEach(function (name) {
            var nb = el('button', { class: 'g-choice', type: 'button', 'data-pick': '1', onclick: function () {
              if (answered) return;
              answered = true;
              var right = name === drawing.name;
              total++; if (right) { good++; named++; }
              [].forEach.call(grid.children, function (x) { x.disabled = true; if (x.textContent === drawing.name) x.classList.add('is-correct'); });
              if (!right) nb.classList.add('is-wrong');
              ctx.setStatus(right ? 'נכון! זה ' + drawing.name : 'זה ' + drawing.name);
              ctx.feedback(right, right ? undefined : 'זה ציור של ' + drawing.name).then(function () {
                if (right) { ctx.wait(600).then(nextRound); return; } // a correct answer moves on by itself
                var go = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: function () { go.disabled = true; nextRound(); } },
                  round >= ROUNDS ? 'לסיכום' : 'לציור הבא');
                actions.appendChild(go);
              });
            } }, name);
            grid.appendChild(nb);
          });
          root.appendChild(grid);
          root.appendChild(actions);
        }
      }

      nextRound();
    }
  });
})();
