/* מה בתמונה? — like "מה זה?" but with real photos: see a photo and build its name from letter tiles.
   Levels 1–30 follow "מה זה?"; 31–50 show a zoomed-in part of the photo, closer and closer, with more extra
   letters. Photos come from js/photo-bank.js; the rules from wordPictureGame (what-is-this.js). Untimed. */
(function () {
  'use strict';

  var BANK = window.PhotoBank;
  var make = BrainGames.wordPictureGame;
  if (!BANK || !make) return;

  // one-word names only (the letter tiles build a single word)
  var ITEMS = BANK.items.filter(function (o) { return o.w.indexOf(' ') === -1; }).map(function (o) {
    var n = make.normLetters(o.w);
    return { w: o.w, n: n, len: n.length, tier: o.tier, label: o.label, src: o.src };
  });

  /* 1–30: the levels of "מה זה?". 31–50: zoom = how close the photo is (1.4 → 2.6), plus more and
     look-alike extra letters. */
  var LEVELS = make.LEVELS.slice(0, 30).concat([
    { t: [1], len: [3, 5], dec: 1, cat: true, zoom: 1.4 },  // 31
    { t: [1, 2], len: [3, 5], dec: 2, cat: true, zoom: 1.4 }, // 32
    { t: [1, 2], len: [3, 6], dec: 2, zoom: 1.5 },          // 33
    { t: [2], len: [3, 6], dec: 2, zoom: 1.5 },             // 34
    { t: [1, 2], len: [4, 6], dec: 3, zoom: 1.6 },          // 35
    { t: [2, 3], len: [4, 6], dec: 3, look: 1, zoom: 1.6 }, // 36
    { t: [2], len: [4, 7], dec: 3, look: 1, zoom: 1.7 },    // 37
    { t: [2, 3], len: [4, 7], dec: 3, look: 2, zoom: 1.8 }, // 38
    { t: [3], len: [4, 7], dec: 3, look: 2, zoom: 1.8 },    // 39
    { t: [2, 3], len: [5, 8], dec: 4, look: 2, zoom: 1.9 }, // 40
    { t: [1, 2], len: [3, 6], dec: 3, look: 2, zoom: 2 },   // 41
    { t: [2, 3], len: [4, 7], dec: 4, look: 2, zoom: 2 },   // 42
    { t: [3], len: [4, 8], dec: 4, look: 3, zoom: 2.1 },    // 43
    { t: [2, 3], len: [5, 8], dec: 4, look: 3, zoom: 2.1 }, // 44
    { t: [1, 2, 3], len: [4, 8], dec: 4, look: 3, zoom: 2.2 }, // 45
    { t: [2, 3], len: [5, 9], dec: 4, look: 3, zoom: 2.3 }, // 46
    { t: [3], len: [5, 9], dec: 4, look: 4, zoom: 2.3 },    // 47
    { t: [2, 3], len: [5, 9], dec: 5, look: 4, zoom: 2.4 }, // 48
    { t: [3], len: [5, 9], dec: 5, look: 4, zoom: 2.5 },    // 49
    { t: [2, 3], len: [6, 9], dec: 5, look: 5, zoom: 2.6 }  // 50
  ]);

  BrainGames.register(make({
    id: 'photo-name',
    name: 'מה בתמונה?',
    skill: 'memory',
    tagline: 'תמונה אמיתית: כתבו איך קוראים למה שרואים',
    benefit: 'שליפת שמות מהזיכרון וזיהוי חזותי',
    instructions: [
      'תופיע תמונה אמיתית: בעל חיים, פרי, כלי בבית ועוד.',
      'לחצו על האותיות לפי הסדר כדי לכתוב את השם, מימין לשמאל.',
      'ברמות מתקדמות יש אותיות מיותרות, ומרמה 31 רואים רק חלק מוגדל מהתמונה.',
      'לא נזכרים? לחצו "רמז" ותקבלו את האות הבאה. אין שעון.'
    ],
    items: ITEMS,
    levels: LEVELS,
    maxLevel: 50,
    photo: true
  }));
})();
