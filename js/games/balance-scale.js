/* מאזניים — read balanced scales of fruit and work out how many fruits balance the last one (logic). */
(function () {
  'use strict';

  var ROUNDS = 7;
  var MAX_ANSWER = 30;
  var MAX_PAN = 30;   // most items we ever put on one pan
  var SPELL_OUT = 6;  // up to this many items a pan shows each fruit; above it shows "8 × 🍎"

  var FRUITS = [
    { e: '🍎', n: 'תפוח' }, { e: '🍐', n: 'אגס' }, { e: '🍌', n: 'בננה' },
    { e: '🍊', n: 'תפוז' }, { e: '🍇', n: 'ענבים' }, { e: '🍓', n: 'תות' }
  ];

  /* Per level (1–20).
     kind 'one'   – one relation 🍎 = k × 🍐 (multi: chance of "a 🍎 = b 🍐" with both sides > 1)
     kind 'chain' – 🍎 = k1 🍐, 🍐 = k2 🍌  → 🍎 in 🍌
     kind 'combo' – 🍎🍐 = c 🍌, 🍐 = d 🍌 (three: chance of a third relation in the chain;
                    mix: chance the question pan holds two kinds of fruit)
     k = multiplier range, n = how many fruits are asked about, rev = chance of the reverse question. */
  var LEVELS = [
    { kind: 'one', k: [2, 2], n: [2, 3] },                          // 1
    { kind: 'one', k: [2, 3], n: [2, 3] },                          // 2
    { kind: 'one', k: [2, 3], n: [2, 4] },                          // 3
    { kind: 'one', k: [2, 4], n: [2, 4], rev: 0.25 },               // 4
    { kind: 'one', k: [2, 4], n: [2, 5], rev: 0.35 },               // 5
    { kind: 'one', k: [3, 5], n: [2, 5], rev: 0.3 },                // 6
    { kind: 'one', k: [3, 6], n: [2, 5], rev: 0.3, multi: 0.4 },    // 7
    { kind: 'one', k: [3, 6], n: [2, 6], rev: 0.3, multi: 0.55 },   // 8
    { kind: 'one', k: [4, 7], n: [2, 6], rev: 0.3, multi: 0.7 },    // 9
    { kind: 'one', k: [4, 8], n: [2, 6], rev: 0.35, multi: 0.8 },   // 10
    { kind: 'chain', k: [2, 2], n: [1, 2] },                        // 11
    { kind: 'chain', k: [2, 3], n: [1, 2] },                        // 12
    { kind: 'chain', k: [2, 3], n: [1, 3] },                        // 13
    { kind: 'chain', k: [2, 4], n: [1, 3], rev: 0.25 },             // 14
    { kind: 'chain', k: [2, 4], n: [1, 4], rev: 0.35 },             // 15
    { kind: 'combo', k: [2, 3], n: [1, 2] },                        // 16
    { kind: 'combo', k: [2, 4], n: [1, 3], mix: 0.3 },              // 17
    { kind: 'combo', k: [2, 4], n: [1, 3], mix: 0.3, three: 0.5 },  // 18
    { kind: 'combo', k: [2, 4], n: [1, 3], mix: 0.4, three: 0.65 }, // 19
    { kind: 'combo', k: [2, 5], n: [1, 3], mix: 0.5, three: 0.8 }   // 20
  ];

  /* ---------- text helpers ---------- */
  function qty(n, f) { return n === 1 ? f.e : n + ' ' + f.e; }
  function eq(n) { return n === 1 ? 'שווה' : 'שווים'; }
  function total(groups) { return groups.reduce(function (s, g) { return s + g[1]; }, 0); }
  function panText(groups) {
    if (total(groups) <= SPELL_OUT) {
      return groups.map(function (g) { var s = ''; for (var i = 0; i < g[1]; i++) s += g[0].e; return s; }).join('');
    }
    return groups.map(function (g) { return qty(g[1], g[0]); }).join(' + ');
  }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }

  /* ---------- puzzle generation ----------
     A puzzle: rels (balanced scales: { l: [[fruit, count]...], r: [...] }), q (question pan),
     t (fruit to answer in), ans, why (explanation), traps (likely wrong answers), w (weights). */

  function weightOf(groups, w) {
    return groups.reduce(function (s, g) { return s + w[g[0].e] * g[1]; }, 0);
  }

  /* Every puzzle is checked against the hidden weights before it is shown. */
  function verify(p) {
    if (!p) return false;
    for (var i = 0; i < p.rels.length; i++) {
      var r = p.rels[i];
      if (weightOf(r.l, p.w) !== weightOf(r.r, p.w)) return false;
      if (total(r.l) > MAX_PAN || total(r.r) > MAX_PAN) return false;
    }
    if (total(p.q) > MAX_PAN) return false;
    var need = weightOf(p.q, p.w);
    var unit = p.w[p.t.e];
    if (!(unit > 0) || need % unit !== 0) return false;
    if (need / unit !== p.ans) return false;
    return p.ans >= 1 && p.ans <= MAX_ANSWER && Math.floor(p.ans) === p.ans;
  }

  function makeOne(spec, ctx, F) {
    var A = F[0], B = F[1];
    var rev = Math.random() < (spec.rev || 0);
    var w = {};
    if (Math.random() < (spec.multi || 0)) {
      // a 🍎 = b 🍐 with a, b co-prime, both > 1 (e.g. 2 🍎 = 3 🍐)
      var a = ctx.randInt(2, 3);
      var b = ctx.randInt(a + 1, Math.max(a + 1, Math.min(7, spec.k[1])));
      if (gcd(a, b) !== 1) return null;
      var m = ctx.randInt(2, 4);
      w[A.e] = b; w[B.e] = a;
      var rel = { l: [[A, a]], r: [[B, b]] };
      if (rev) {
        return {
          rels: [rel], q: [[B, b * m]], t: A, ans: a * m, w: w,
          why: a + ' ' + A.e + ' ' + eq(a) + ' ' + b + ' ' + B.e + '. ' + (b * m) + ' ' + B.e + ' הם פי ' + m +
            ', אז הם שווים ' + (a * m) + ' ' + A.e + '.',
          traps: [b * m, b * m - a, a + m, b, m * (b - a)]
        };
      }
      return {
        rels: [rel], q: [[A, a * m]], t: B, ans: b * m, w: w,
        why: a + ' ' + A.e + ' ' + eq(a) + ' ' + b + ' ' + B.e + '. ' + (a * m) + ' ' + A.e + ' הם פי ' + m +
          ', אז הם שווים ' + (b * m) + ' ' + B.e + '.',
        traps: [a * m * b, a * m, b + m, a * m + b, b * (m + 1)]
      };
    }
    var k = ctx.randInt(spec.k[0], spec.k[1]);
    var n = ctx.randInt(spec.n[0], spec.n[1]);
    w[A.e] = k; w[B.e] = 1;
    var r1 = { l: [[A, 1]], r: [[B, k]] };
    if (rev) {
      return {
        rels: [r1], q: [[B, n * k]], t: A, ans: n, w: w,
        why: 'כל ' + A.e + ' ' + eq(1) + ' ' + qty(k, B) + ', אז ' + qty(n * k, B) + ' ' + eq(n * k) + ' ' + qty(n, A) + '.',
        traps: [n * k, k, n + k, n * k - k, k * k]
      };
    }
    return {
      rels: [r1], q: [[A, n]], t: B, ans: n * k, w: w,
      why: 'כל ' + A.e + ' ' + eq(1) + ' ' + qty(k, B) + ', אז ' + qty(n, A) + ' ' + eq(n) + ' ' + qty(n * k, B) + '.',
      traps: [n + k, (n + 1) * k, (n - 1) * k, k, n * k + 1]
    };
  }

  function makeChain(spec, ctx, F) {
    var A = F[0], B = F[1], C = F[2];
    var k1 = ctx.randInt(spec.k[0], spec.k[1]);
    var k2 = ctx.randInt(spec.k[0], spec.k[1]);
    var n = ctx.randInt(spec.n[0], spec.n[1]);
    var per = k1 * k2;
    var w = {}; w[A.e] = per; w[B.e] = k2; w[C.e] = 1;
    var rels = ctx.shuffle([{ l: [[A, 1]], r: [[B, k1]] }, { l: [[B, 1]], r: [[C, k2]] }]);
    var base = 'כל ' + A.e + ' שווה ' + qty(k1, B) + ', וכל ' + B.e + ' שווה ' + qty(k2, C) +
      ', אז כל ' + A.e + ' שווה ' + k1 + '×' + k2 + ' = ' + qty(per, C) + '. ';
    if (Math.random() < (spec.rev || 0)) {
      return {
        rels: rels, q: [[C, n * per]], t: A, ans: n, w: w,
        why: base + 'לכן ' + qty(n * per, C) + ' ' + eq(n * per) + ' ' + qty(n, A) + '.',
        traps: [n * k1, n * k2, k1 + k2, n + 1, per]
      };
    }
    return {
      rels: rels, q: [[A, n]], t: C, ans: n * per, w: w,
      why: (base + (n === 1 ? '' : 'לכן ' + qty(n, A) + ' שווים ' + qty(n * per, C) + '.')).trim(),
      traps: [n * k1, n * k2, n * (k1 + k2), n * per + k2, n * per - 1]
    };
  }

  function makeCombo(spec, ctx, F) {
    var A = F[0], B = F[1], C = F[2], D = F[3];
    var three = Math.random() < (spec.three || 0);
    var mix = Math.random() < (spec.mix || 0);
    var n = ctx.randInt(spec.n[0], spec.n[1]);
    var w = {}, rels, unitFruit, a, bw, mixFruit, mixW, why;
    if (three) {
      // 🍎🍐 = c 🍓, 🍐 = k 🍊, 🍊 = e 🍓
      var k = ctx.randInt(2, 3), e = ctx.randInt(2, 3);
      bw = k * e;
      a = ctx.randInt(1, 4);
      var c3 = a + bw;
      unitFruit = D;
      w[D.e] = 1; w[C.e] = e; w[B.e] = bw; w[A.e] = a;
      rels = [
        { l: [[A, 1], [B, 1]], r: [[D, c3]] },
        { l: [[B, 1]], r: [[C, k]] },
        { l: [[C, 1]], r: [[D, e]] }
      ];
      mixFruit = C; mixW = e;
      why = 'כל ' + C.e + ' שווה ' + qty(e, D) + ', וכל ' + B.e + ' שווה ' + qty(k, C) + ', אז ' + B.e + ' שווה ' +
        k + '×' + e + ' = ' + qty(bw, D) + '. ' + A.e + B.e + ' שווים ' + qty(c3, D) + ', אז ' + A.e + ' שווה ' +
        c3 + '−' + bw + ' = ' + a + ' ' + D.e + '. ';
    } else {
      // 🍎🍐 = c 🍌, 🍐 = d 🍌
      bw = ctx.randInt(spec.k[0], spec.k[1]);
      a = ctx.randInt(1, spec.k[1] + 1);
      if (a === bw) a = bw + 1;
      var c = a + bw;
      unitFruit = C;
      w[C.e] = 1; w[B.e] = bw; w[A.e] = a;
      rels = [
        { l: [[A, 1], [B, 1]], r: [[C, c]] },
        { l: [[B, 1]], r: [[C, bw]] }
      ];
      mixFruit = B; mixW = bw;
      why = A.e + B.e + ' שווים ' + qty(c, C) + ', ו־' + B.e + ' לבד שווה ' + qty(bw, C) + '. אז ' + A.e +
        ' שווה ' + c + '−' + bw + ' = ' + a + ' ' + C.e + '. ';
    }
    var q = [[A, n]];
    var ans = n * a;
    var traps = [n * (a + bw), n * bw, a + bw, ans + 1, ans + bw];
    if (mix) {
      var m = ctx.randInt(1, 2);
      q.push([mixFruit, m]);
      ans += m * mixW;
      why += 'לכן ' + qty(n, A) + ' ' + eq(n) + ' ' + qty(n * a, unitFruit) + ', ' + qty(m, mixFruit) + ' ' + eq(m) + ' ' +
        qty(m * mixW, unitFruit) + ', וביחד ' + qty(ans, unitFruit) + '.';
      traps = [n * a, n * a + m, ans + mixW, ans - 1, n * (a + bw) + m * mixW];
    } else if (n > 1) {
      why += 'לכן ' + qty(n, A) + ' שווים ' + qty(ans, unitFruit) + '.';
    }
    return { rels: rels, q: q, t: unitFruit, ans: ans, w: w, why: why.trim(), traps: traps };
  }

  function generate(spec, ctx) {
    var F = ctx.shuffle(FRUITS);
    if (spec.kind === 'chain') return makeChain(spec, ctx, F);
    if (spec.kind === 'combo') return makeCombo(spec, ctx, F);
    return makeOne(spec, ctx, F);
  }

  function puzzleKey(p) {
    return p.rels.map(function (r) { return panText(r.l) + '=' + panText(r.r); }).join('|') + '?' + panText(p.q) + p.t.e;
  }

  /* Four answers: the right one, likely mistakes first, then near numbers. */
  function makeChoices(p, ctx) {
    var out = [p.ans];
    var ok = function (x) { return x >= 1 && x <= MAX_ANSWER + 6 && Math.floor(x) === x && out.indexOf(x) === -1; };
    ctx.shuffle(p.traps).forEach(function (x) { if (out.length < 3 && ok(x)) out.push(x); });
    var near = ctx.shuffle([p.ans + 1, p.ans - 1, p.ans + 2, p.ans - 2, p.ans + 3, p.ans * 2, p.ans + 4, p.ans + 5]);
    near.forEach(function (x) { if (out.length < 4 && ok(x)) out.push(x); });
    return out.sort(function (x, y) { return x - y; });
  }

  var css = [
    '.bs-wrap{width:100%;display:flex;flex-direction:column;align-items:center;gap:.7rem}',
    '.bs-label{font-size:1.1rem;font-weight:700;color:var(--ink-soft);margin:0}',
    '.bs-known{width:100%;display:flex;flex-direction:column;align-items:center;gap:.5rem}',
    '.bs-scale{width:100%;max-width:26rem;display:grid;grid-template-columns:minmax(0,1fr) 2.5rem minmax(0,1fr);',
    'grid-template-rows:auto auto auto;align-items:start;column-gap:.3rem;padding:.4rem 0 0}',
    '.bs-beam{grid-column:1/-1;grid-row:1;height:.45rem;border-radius:999px;background:var(--ink-soft);',
    'margin:0 6%;transition:transform .6s ease}',
    '.bs-post{grid-column:2;grid-row:2/4;display:flex;flex-direction:column;align-items:center;align-self:stretch}',
    '.bs-post::before{content:"";width:.4rem;flex:1;background:var(--ink-soft);min-height:1.2rem}',
    '.bs-badge{order:-1;margin-top:-.2rem;width:2.2rem;height:2.2rem;border-radius:50%;display:grid;place-items:center;',
    'font-weight:900;font-size:1.25rem;background:var(--logic-soft);color:var(--logic);border:2px solid var(--logic)}',
    '.bs-base{width:2.5rem;height:1rem;color:var(--ink-soft);display:block}',
    '.bs-pan{grid-row:2;min-height:3.4rem;margin-top:.5rem;padding:.3rem .2rem .45rem;border:3px solid var(--line);',
    'border-top-width:4px;border-top-color:var(--ink-soft);border-radius:.4rem .4rem 2rem 2rem;background:var(--surface);',
    'display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:0 .1rem;transition:transform .6s ease}',
    '.bs-known .bs-scale{padding:0;grid-template-columns:minmax(0,1fr) 2.1rem minmax(0,1fr)}',
    '.bs-known .bs-beam{height:.3rem}',
    '.bs-known .bs-pan{min-height:2.7rem;margin-top:.25rem;padding:.1rem .2rem .3rem;border-width:2px;border-top-width:3px;',
    'border-radius:.4rem .4rem 1.4rem 1.4rem}',
    '.bs-known .bs-badge{width:1.9rem;height:1.9rem;font-size:1.15rem;margin-top:-.15rem}',
    '.bs-known .bs-base{display:none}',
    '.bs-fruit{font-size:clamp(1.2rem,5vw,1.55rem);line-height:1.2}',
    '.bs-known.bs-many .bs-fruit{font-size:clamp(1.1rem,4.6vw,1.4rem)}',
    '.bs-chip{display:inline-flex;align-items:center;gap:.2rem;font-weight:800;font-size:1.15rem;color:var(--ink);',
    'font-variant-numeric:tabular-nums;white-space:nowrap}',
    '.bs-chip .bs-fruit{font-size:clamp(1.2rem,5vw,1.5rem)}',
    '.bs-ask{padding:.1rem .4rem;border-radius:var(--radius-sm);border:2px dashed var(--sun);background:var(--sun-soft)}',
    '.bs-ask.is-done{border-style:solid;border-color:var(--good);background:var(--good-soft);color:var(--good)}',
    '.bs-question .bs-badge{background:var(--sun-soft);color:var(--ink);border-color:var(--sun)}',
    '.bs-question.bs-tilt .bs-beam{transform:rotate(5deg)}',
    '.bs-question.bs-tilt .bs-pan.bs-heavy{transform:translateY(.75rem)}',
    '.bs-question.bs-tilt .bs-pan.bs-light{transform:translateY(-.55rem)}',
    '.play-board .g-choices.bs-choices{max-width:26rem;grid-template-columns:repeat(2,minmax(0,1fr))}',
    '.bs-choice{font-size:clamp(1.35rem,5.5vw,1.6rem);min-height:4rem;font-variant-numeric:tabular-nums}',
    '.bs-choices .bs-choice.bs-gone{display:none}',
    '.bs-explain{font-size:1.1rem;font-weight:600;text-align:center;text-wrap:balance;line-height:1.45;',
    'padding:.45rem .8rem;border-radius:var(--radius-sm);max-width:34rem;width:100%;margin:0}',
    '.bs-explain:empty{display:none}',
    '.bs-explain.is-good{background:var(--good-soft);color:var(--good)}',
    '.bs-explain.is-bad{background:var(--bad-soft);color:var(--ink)}',
    '@media (prefers-reduced-motion:reduce){.bs-beam,.bs-pan{transition:none}}'
  ].join('');

  BrainGames.register({
    id: 'balance-scale',
    name: 'מאזניים',
    skill: 'logic',
    tagline: 'כמה פירות צריך כדי לאזן?',
    benefit: 'חשיבה לוגית, יחסים וחשבון בראש',
    instructions: [
      'הסתכלו על המאזניים המאוזנים: מה שבצד אחד שווה למה שבצד השני.',
      'בשאלה מופיעים מאזניים שעוד לא מאוזנים.',
      'חשבו כמה פירות צריך לשים בצד הריק כדי לאזן, ובחרו את המספר.',
      'אין מה למהר. אם תטעו, נסביר את הדרך.'
    ],
    css: css,
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(LEVELS.length, Math.round(Number(ctx.level)) || 1));
      var spec = LEVELS[level - 1];
      var round = 0;
      var score = 0;
      var seen = {};

      function newPuzzle() {
        for (var tries = 0; tries < 300; tries++) {
          var p = generate(spec, ctx);
          if (!verify(p)) continue;
          var key = puzzleKey(p);
          if (seen[key] && tries < 250) continue;
          seen[key] = true;
          return p;
        }
        // Safe fallback: the simplest puzzle, verified like every other.
        var fb = makeOne({ k: [2, 2], n: [2, 3] }, ctx, ctx.shuffle(FRUITS));
        return verify(fb) ? fb : null;
      }

      function fulcrum() {
        var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 60 22');
        svg.setAttribute('class', 'bs-base');
        svg.setAttribute('aria-hidden', 'true');
        var poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        poly.setAttribute('points', '30,0 56,22 4,22');
        poly.setAttribute('fill', 'currentColor');
        svg.appendChild(poly);
        return svg;
      }

      function fruitNodes(groups) {
        var nodes = [];
        if (total(groups) <= SPELL_OUT) {
          groups.forEach(function (g) {
            for (var i = 0; i < g[1]; i++) nodes.push(el('span', { class: 'bs-fruit' }, g[0].e));
          });
        } else {
          groups.forEach(function (g, gi) {
            if (gi > 0) nodes.push(el('span', { class: 'bs-chip' }, '+'));
            nodes.push(el('span', { class: 'bs-chip' }, [String(g[1]), ' × ', el('span', { class: 'bs-fruit' }, g[0].e)]));
          });
        }
        return nodes;
      }

      function panLabel(groups) {
        return groups.map(function (g) { return g[1] + ' ' + g[0].n; }).join(' ו');
      }

      /* first pan sits on the right (RTL), second on the left */
      function scaleEl(first, second, badge, extraClass) {
        first.style.gridColumn = '1';
        second.style.gridColumn = '3';
        return el('div', { class: 'bs-scale' + (extraClass ? ' ' + extraClass : '') }, [
          el('div', { class: 'bs-beam', 'aria-hidden': 'true' }),
          first,
          el('div', { class: 'bs-post', 'aria-hidden': 'true' }, [el('span', { class: 'bs-badge' }, badge), fulcrum()]),
          second
        ]);
      }

      function knownScale(rel) {
        var a = el('div', { class: 'bs-pan', role: 'img', 'aria-label': panLabel(rel.l) }, fruitNodes(rel.l));
        var b = el('div', { class: 'bs-pan', role: 'img', 'aria-label': panLabel(rel.r) }, fruitNodes(rel.r));
        var s = scaleEl(a, b, '=');
        s.setAttribute('aria-label', panLabel(rel.l) + ' שווים ' + panLabel(rel.r));
        return s;
      }

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({
            correct: score,
            total: ROUNDS,
            note: 'איזנתם נכון ' + score + ' מתוך ' + ROUNDS + ' מאזניים'
          });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        playRound(newPuzzle());
      }

      function playRound(p) {
        root.innerHTML = '';
        if (!p) { nextRound(); return; }
        var T = p.t;

        var known = el('div', { class: 'bs-known' + (p.rels.length > 2 ? ' bs-many' : '') }, p.rels.map(knownScale));
        var heavy = el('div', { class: 'bs-pan bs-heavy', role: 'img', 'aria-label': panLabel(p.q) }, fruitNodes(p.q));
        var ask = el('span', { class: 'bs-chip bs-ask' }, ['?', ' × ', el('span', { class: 'bs-fruit' }, T.e)]);
        var light = el('div', { class: 'bs-pan bs-light' }, ask);
        var qScale = scaleEl(heavy, light, '?', 'bs-question bs-tilt');
        var knownLabel = el('p', { class: 'bs-label' }, 'המאזניים האלה מאוזנים:');
        var explain = el('p', { class: 'bs-explain', 'aria-live': 'polite' });
        var choices = el('div', { class: 'g-choices bs-choices' });
        var actions = el('div', { class: 'g-actions' });
        var buttons = [];
        var answered = false;

        makeChoices(p, ctx).forEach(function (v) {
          var b = el('button', {
            class: 'g-choice bs-choice', type: 'button', 'aria-label': v + ' ' + T.n,
            onclick: function () { answer(v, b); }
          }, v + ' ' + T.e);
          buttons.push({ v: v, btn: b });
          choices.appendChild(b);
        });

        root.appendChild(el('div', { class: 'bs-wrap' }, [
          knownLabel,
          known,
          qScale,
          choices,
          explain,
          actions
        ]));
        ctx.setStatus('כמה ' + T.e + ' צריך כדי לאזן?');

        function answer(v, btn) {
          if (answered) return;
          answered = true;
          var ok = v === p.ans;
          buttons.forEach(function (o) {
            o.btn.disabled = true;
            if (o.v === p.ans) o.btn.classList.add('is-correct');
            else if (o.btn !== btn) o.btn.classList.add('bs-gone'); // keep only the chosen and the right answer
          });
          if (!ok) btn.classList.add('is-wrong');
          // show the balancing amount and level the scale
          ask.innerHTML = '';
          ask.classList.add('is-done');
          ask.appendChild(document.createTextNode(p.ans + ' × '));
          ask.appendChild(el('span', { class: 'bs-fruit' }, T.e));
          qScale.querySelector('.bs-badge').textContent = '=';
          ctx.wait(250).then(function () { qScale.classList.remove('bs-tilt'); });

          if (ok) {
            score++;
            explain.className = 'bs-explain is-good';
            explain.textContent = 'נכון! ' + p.why;
            ctx.setStatus('מצוין, המאזניים מאוזנים!');
            ctx.feedback(true)
              .then(function () { return ctx.wait(1400); })
              .then(nextRound);
          } else {
            explain.className = 'bs-explain is-bad';
            explain.textContent = p.why;
            ctx.setStatus('כך מגיעים לתשובה');
            ctx.feedback(false, 'התשובה הנכונה: ' + p.ans + ' ' + T.e).then(function () {
              var next = el('button', {
                class: 'btn btn-primary btn-lg', type: 'button',
                onclick: function () { next.disabled = true; nextRound(); }
              }, round >= ROUNDS ? 'לסיכום' : 'הבנתי, הלאה');
              // the scale now shows the answer: the choices and the label make room for the button
              choices.style.display = 'none';
              knownLabel.style.display = 'none';
              actions.appendChild(next);
              try { next.focus({ preventScroll: true }); } catch (e) { /* ignore */ }
            });
          }
        }
      }

      nextRound();
      return function cleanup() { root.innerHTML = ''; };
    }
  });
})();
