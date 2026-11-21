/* איפה שמתי? — where did I put it: everyday objects are shown in the rooms of a house plan; remember where each one is,
   then tap the room (or, at higher levels, the piece of furniture). Later levels add a short story in which someone
   moves things around, and questions the other way round ("what is in the kitchen?"). Memory, untimed. */
(function () {
  'use strict';

  /* Rooms in plan order. Each has two spots (pieces of furniture) used from level 21. */
  var ROOMS = [
    { name: 'מטבח', em: '🍳', inn: 'במטבח', to: 'למטבח', c: '--c-yellow',
      spots: [{ em: '🍽️', name: 'שולחן', at: 'על השולחן' }, { em: '🗄️', name: 'מגירה', at: 'במגירה' }] },
    { name: 'סלון', em: '🛋️', inn: 'בסלון', to: 'לסלון', c: '--c-blue',
      spots: [{ em: '🛋️', name: 'ספה', at: 'על הספה' }, { em: '📚', name: 'מדף', at: 'על המדף' }] },
    { name: 'חדר שינה', em: '🛏️', inn: 'בחדר השינה', to: 'לחדר השינה', c: '--c-purple',
      spots: [{ em: '🛏️', name: 'מיטה', at: 'על המיטה' }, { em: '👗', name: 'ארון', at: 'בארון הבגדים' }] },
    { name: 'אמבטיה', em: '🛁', inn: 'באמבטיה', to: 'לאמבטיה', c: '--c-green',
      spots: [{ em: '🚰', name: 'כיור', at: 'ליד הכיור' }, { em: '🧺', name: 'סל', at: 'בסל הכביסה' }] },
    { name: 'מרפסת', em: '🪴', inn: 'במרפסת', to: 'למרפסת', c: '--c-red',
      spots: [{ em: '🪑', name: 'כיסא', at: 'על הכיסא' }, { em: '🌵', name: 'עציץ', at: 'ליד העציץ' }] },
    { name: 'כניסה', em: '🚪', inn: 'בכניסה', to: 'לכניסה', c: '--c-black',
      spots: [{ em: '🧥', name: 'קולב', at: 'על הקולב' }, { em: '👞', name: 'נעליים', at: 'ליד הנעליים' }] }
  ];

  /* emoji, name, name with "the" */
  var OBJECTS = [
    ['👓', 'משקפיים', 'המשקפיים'], ['🔑', 'מפתחות', 'המפתחות'], ['📱', 'טלפון', 'הטלפון'], ['👛', 'ארנק', 'הארנק'],
    ['💊', 'תרופות', 'התרופות'], ['⌚', 'שעון', 'השעון'], ['📖', 'ספר', 'הספר'], ['☂️', 'מטריה', 'המטריה'],
    ['👜', 'תיק', 'התיק'], ['🧣', 'צעיף', 'הצעיף'], ['🎧', 'אוזניות', 'האוזניות'], ['✉️', 'מכתב', 'המכתב'],
    ['🔦', 'פנס', 'הפנס'], ['🧤', 'כפפות', 'הכפפות']
  ].map(function (a) { return { em: a[0], name: a[1], the: a[2] }; });
  // look-alikes, mixed in from level 31
  var LOOKALIKES = [{ em: '🕶️', name: 'משקפי שמש', the: 'משקפי השמש' }, { em: '🗝️', name: 'מפתח ישן', the: 'המפתח הישן' }];

  var MOVERS = [['👦', 'הנכד העביר'], ['👧', 'הנכדה העבירה'], ['👩', 'הבת העבירה'], ['👨', 'הבן העביר'], ['👵', 'השכנה העבירה']];

  /* Level 1–50 → rooms on the plan, objects, furniture (spots), story moves, "what is in the room?" questions. */
  function spec(level) {
    var L = Math.max(1, Math.min(50, level));
    if (L <= 20) return { rooms: L <= 3 ? 3 : L <= 7 ? 4 : L <= 12 ? 5 : 6, objects: Math.min(8, 2 + Math.floor((L - 1) / 3)), spots: false, moves: 0, which: false };
    if (L <= 30) return { rooms: 6, objects: 4 + Math.floor((L - 21) / 2), spots: true, moves: 0, which: L >= 27 };
    if (L <= 40) return { rooms: 6, objects: 5 + Math.floor((L - 31) / 3), spots: false, moves: L <= 35 ? 1 : 2, which: L >= 34, alike: true };
    return { rooms: 6, objects: 5 + Math.floor((L - 41) / 3), spots: true, moves: L <= 44 ? 1 : 2, which: true, alike: true };
  }

  function roundsFor(sp) { return sp.objects <= 3 ? 3 : 2; }

  /* One round: { rooms: [room index], items: [{ obj, room, spot }] (start), moves: [{ who, item, room, spot }],
     final: [{ room, spot }] per item, questions: [...] } */
  function makeRound(sp, rnd) {
    var rooms = rnd.shuffle(ROOMS.map(function (r, i) { return i; })).slice(0, sp.rooms).sort(function (a, b) { return a - b; });
    var bank = OBJECTS.slice();
    var objs = rnd.shuffle(bank).slice(0, sp.objects);
    if (sp.alike) { // swap in a look-alike next to its twin
      LOOKALIKES.forEach(function (o, i) {
        var twin = OBJECTS[i]; // 👓 and 🔑 are the first two
        if (objs.indexOf(twin) !== -1 && rnd.randInt(0, 1)) {
          var j = objs.findIndex(function (x) { return x !== twin && x !== OBJECTS[1 - i]; });
          if (j !== -1) objs[j] = o;
        }
      });
    }
    var cap = sp.spots ? 1 : 2; // per spot or per room
    var used = {};
    function key(r, s) { return sp.spots ? r + ',' + s : String(r); }
    function freePlace(not) {
      var opts = [];
      rooms.forEach(function (r) {
        if (r === not) return;
        (sp.spots ? [0, 1] : [0]).forEach(function (s) { if ((used[key(r, s)] || 0) < cap) opts.push({ room: r, spot: sp.spots ? s : -1 }); });
      });
      return rnd.pick(opts);
    }
    var items = objs.map(function (o) {
      var p = freePlace(-1);
      used[key(p.room, p.spot)] = (used[key(p.room, p.spot)] || 0) + 1;
      return { obj: o, room: p.room, spot: p.spot };
    });
    var final = items.map(function (it) { return { room: it.room, spot: it.spot }; });
    var moves = [];
    var movers = rnd.shuffle(MOVERS);
    rnd.shuffle(items.map(function (x, i) { return i; })).slice(0, sp.moves).forEach(function (i, n) {
      var from = final[i], p = freePlace(from.room);
      used[key(from.room, from.spot)]--;
      used[key(p.room, p.spot)] = (used[key(p.room, p.spot)] || 0) + 1;
      final[i] = { room: p.room, spot: p.spot };
      moves.push({ who: movers[n], item: i, room: p.room, spot: p.spot });
    });

    // questions: every moved object, then others, at most 5; one "what is in …?" when allowed
    var nq = Math.min(sp.objects, 5);
    var movedIdx = moves.map(function (m) { return m.item; });
    var order = movedIdx.concat(rnd.shuffle(items.map(function (x, i) { return i; }).filter(function (i) { return movedIdx.indexOf(i) === -1; })));
    var questions = [];
    var nWhere = sp.which ? nq - 1 : nq;
    order.slice(0, nWhere).forEach(function (i) { questions.push({ type: 'where', item: i, answer: final[i] }); });
    if (sp.which) {
      var full = rooms.filter(function (r) { return final.some(function (f) { return f.room === r; }); });
      var room = rnd.pick(full);
      var inside = items.map(function (x, i) { return i; }).filter(function (i) { return final[i].room === room; });
      var outside = items.map(function (x, i) { return i; }).filter(function (i) { return final[i].room !== room; });
      // prefer asking about a moved object when one ended up in that room
      var ans = inside.filter(function (i) { return movedIdx.indexOf(i) !== -1; })[0];
      if (ans === undefined) ans = rnd.pick(inside);
      var options = rnd.shuffle([ans].concat(rnd.shuffle(outside).slice(0, 3)));
      questions.splice(rnd.randInt(1, questions.length), 0, { type: 'which', room: room, options: options, answer: ans });
    }
    return { rooms: rooms, items: items, moves: moves, final: final, questions: questions, spots: sp.spots };
  }

  var css = [
    '.wi-wrap{display:flex;flex-direction:column;align-items:center;gap:.5rem;width:100%;}',
    '.wi-plan{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.4rem;width:100%;max-width:26rem;',
    'padding:.35rem;border:4px solid var(--ink);border-radius:8px;background:var(--surface-2);}',
    '.wi-room{border:3px solid var(--ink-soft);border-radius:6px;padding:.2rem .25rem;display:flex;flex-direction:column;gap:.2rem;',
    'min-width:0;font:inherit;color:var(--ink);text-align:start;}',
    '.wi-room.wi-btn{cursor:pointer;min-height:4.4rem;align-items:center;justify-content:center;text-align:center;}',
    '.wi-rh{display:flex;align-items:center;gap:.3rem;font-weight:800;font-size:1.05rem;line-height:1.15;}',
    '.wi-btn .wi-rh{flex-direction:column;gap:0;font-size:1.1rem;}',
    '.wi-rh .wi-em{font-size:1.35rem;line-height:1;}',
    '.wi-btn .wi-rh .wi-em{font-size:1.8rem;}',
    '.wi-objs{display:flex;flex-direction:column;gap:.15rem;}',
    '.wi-obj{display:flex;align-items:center;gap:.25rem;background:var(--surface);border:2px solid var(--line);border-radius:999px;',
    'padding:0 .4rem;font-weight:700;font-size:1.05rem;line-height:1.5;white-space:nowrap;overflow:hidden;}',
    '.wi-obj .wi-em{font-size:1.25rem;line-height:1.1;}',
    '.wi-spots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.2rem;}',
    '.wi-spot{display:flex;flex-direction:column;align-items:center;gap:.1rem;min-width:0;padding:.15rem;border:2px dashed var(--ink-soft);',
    'border-radius:6px;background:var(--surface);font:inherit;color:var(--ink);}',
    '.wi-spot-n{font-size:1rem;font-weight:700;line-height:1.1;text-align:center;}',
    '.wi-spot .wi-em{font-size:1.25rem;line-height:1.1;}',
    '.wi-spot .wi-in{display:flex;align-items:center;gap:.15rem;min-height:1.9rem;}',
    '.wi-spot .wi-in .wi-em{font-size:1.1rem;opacity:.85;}',
    '.wi-it{font-size:1.7rem;line-height:1.1;}',
    'button.wi-spot{cursor:pointer;border-style:solid;min-height:3.6rem;justify-content:center;}',
    '.wi-btn:hover:not(:disabled),button.wi-spot:hover:not(:disabled){box-shadow:0 0 0 3px var(--accent);}',
    '.wi-btn:disabled,button.wi-spot:disabled{cursor:default;}',
    '.wi-room.is-correct,.wi-spot.is-correct{box-shadow:0 0 0 4px var(--good);border-color:var(--good);}',
    '.wi-room.is-wrong,.wi-spot.is-wrong{box-shadow:0 0 0 4px var(--bad);border-color:var(--bad);}',
    '.wi-legend{display:flex;flex-wrap:wrap;justify-content:center;gap:.1rem .7rem;font-size:1.05rem;font-weight:700;color:var(--ink-soft);line-height:1.35;}',
    '.wi-legend span{white-space:nowrap;display:inline-flex;align-items:center;gap:.15rem;}',
    '.wi-big{min-width:12rem;align-items:center;padding:.5rem 1rem;}',
    '.wi-big .wi-rh{font-size:1.4rem;}',
    '.wi-big .wi-rh .wi-em{font-size:2.2rem;}',
    '.wi-q{display:flex;align-items:center;gap:.6rem;font-size:1.4rem;font-weight:800;}',
    '.wi-q .wi-em{font-size:2.6rem;line-height:1;}',
    '.wi-story{width:100%;max-width:26rem;display:flex;flex-direction:column;gap:.6rem;}',
    '.wi-move{display:flex;align-items:center;gap:.6rem;background:var(--sun-soft);border:2px solid var(--sun);border-radius:var(--radius-sm);',
    'padding:.7rem .8rem;font-size:1.2rem;font-weight:700;line-height:1.35;}',
    '.wi-move .wi-who{font-size:2.2rem;line-height:1;flex:none;}',
    '.wi-opts{width:100%;max-width:26rem;}',
    '.wi-opts .g-choice{display:flex;align-items:center;justify-content:center;gap:.4rem;font-size:1.2rem;font-weight:700;}',
    '.wi-opts .wi-em{font-size:1.7rem;}'
  ].join('');

  BrainGames.register({
    id: 'where-is-it',
    name: 'איפה שמתי?',
    skill: 'memory',
    isNew: true,
    maxLevel: 50,
    tagline: 'זכרו איפה בבית נמצא כל חפץ',
    benefit: 'זיכרון של מקומות וחפצים יומיומיים',
    instructions: [
      'תופיע תוכנית של דירה, ובחדרים חפצים: משקפיים, מפתחות, טלפון ועוד. זכרו איפה כל חפץ נמצא.',
      'כשתהיו מוכנים לחצו "זכרתי, הלאה".',
      'אחר כך נשאל: "איפה שמתם את המשקפיים?" ולוחצים על החדר. ברמות הגבוהות לוחצים גם על הרהיט: על השולחן, במגירה.',
      'ברמות הגבוהות מישהו מעביר חפצים ממקום למקום. זכרו איפה הם עכשיו. אין שעון.'
    ],
    css: css,
    _model: { spec: spec, makeRound: makeRound, roundsFor: roundsFor, ROOMS: ROOMS },
    start: function (root, ctx) {
      var el = ctx.el;
      var level = Math.max(1, Math.min(50, Math.round(Number(ctx.level)) || 1));
      var sp = spec(level);
      var ROUNDS = roundsFor(sp), round = 0, good = 0, total = 0;

      function nextRound() {
        if (round >= ROUNDS) {
          ctx.finish({ correct: good, total: total, note: 'זכרתם נכון ' + good + ' מתוך ' + total + ' מקומות' });
          return;
        }
        round++;
        ctx.setProgress(round, ROUNDS);
        play(makeRound(sp, ctx));
      }

      function em(s) { return el('span', { class: 'wi-em', 'aria-hidden': 'true' }, s); }
      function placeText(R, p) { var r = ROOMS[p.room]; return R.spots ? r.inn + ', ' + r.spots[p.spot].at : r.inn; }
      function roomHead(r) { return el('div', { class: 'wi-rh' }, [em(r.em), el('span', null, r.name)]); }
      function tint(r) { return { background: 'var(' + r.c + '-soft)' }; }

      // the plan with the objects in it (memorise phase)
      function planWithObjects(R) {
        return el('div', { class: 'wi-plan', 'aria-label': 'תוכנית הדירה' }, R.rooms.map(function (ri) {
          var r = ROOMS[ri];
          function chip(it) { return el('div', { class: 'wi-obj' }, [em(it.obj.em), el('span', null, it.obj.name)]); }
          var body;
          if (R.spots) {
            body = el('div', { class: 'wi-spots' }, r.spots.map(function (s, si) {
              var here = R.items.filter(function (it) { return it.room === ri && it.spot === si; });
              return el('div', { class: 'wi-spot' }, [el('div', { class: 'wi-in' }, [em(s.em)].concat(here.map(function (it) {
                return el('span', { class: 'wi-it', title: it.obj.name, 'aria-label': it.obj.name }, it.obj.em); }))),
                el('div', { class: 'wi-spot-n' }, s.name)]);
            }));
          } else {
            body = el('div', { class: 'wi-objs' }, R.items.filter(function (it) { return it.room === ri; }).map(chip));
          }
          return el('div', { class: 'wi-room', style: tint(r) }, [roomHead(r), body]);
        }));
      }

      function play(R) {
        root.innerHTML = '';
        var wrap = el('div', { class: 'wi-wrap' });
        root.appendChild(wrap);
        ctx.setStatus('זכרו איפה נמצא כל חפץ');
        wrap.appendChild(planWithObjects(R));
        if (R.spots) {
          var names = el('div', { class: 'wi-legend' },
            R.items.map(function (it) { return el('span', null, [em(it.obj.em), it.obj.name]); }));
          wrap.appendChild(names);
        }
        var ready = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: go }, 'זכרתי, הלאה');
        wrap.appendChild(el('div', { class: 'g-actions' }, ready));
        ctx.studyTimer(ready, 4000 + 2500 * R.items.length);
        var gone = false;
        function go() {
          if (gone) return;
          gone = true; ready.disabled = true;
          ctx.sound('tap');
          root.innerHTML = '';
          ctx.wait(300).then(R.moves.length ? story : function () { ask(0); });
        }

        function story() {
          root.innerHTML = '';
          var w = el('div', { class: 'wi-wrap' });
          root.appendChild(w);
          ctx.setStatus(R.moves.length > 1 ? 'אחר כך הזיזו שני חפצים. זכרו!' : 'אחר כך הזיזו חפץ. זכרו!');
          w.appendChild(el('div', { class: 'wi-story' }, R.moves.map(function (m) {
            var it = R.items[m.item], r = ROOMS[m.room];
            return el('div', { class: 'wi-move' }, [el('span', { class: 'wi-who', 'aria-hidden': 'true' }, m.who[0]),
              el('span', null, m.who[1] + ' את ' + it.obj.em + ' ' + it.obj.the + ' ' + r.to + (R.spots ? ', ' + r.spots[m.spot].at : '') + '.')]);
          })));
          var b = el('button', { class: 'btn btn-primary btn-lg', type: 'button', onclick: on }, 'הבנתי, הלאה');
          w.appendChild(el('div', { class: 'g-actions' }, b));
          ctx.studyTimer(b, 5000 + 4000 * R.moves.length);
          var done = false;
          function on() { if (done) return; done = true; b.disabled = true; ctx.sound('tap'); root.innerHTML = ''; ctx.wait(300).then(function () { ask(0); }); }
        }

        function ask(qi) {
          if (qi >= R.questions.length) { nextRound(); return; }
          var q = R.questions[qi];
          root.innerHTML = '';
          var w = el('div', { class: 'wi-wrap' });
          root.appendChild(w);
          var answered = false;
          if (q.type === 'which') {
            var r = ROOMS[q.room];
            ctx.setStatus((R.moves.length ? 'מה נמצא עכשיו ' : 'מה שמתם ') + r.inn + '?');
            w.appendChild(el('div', { class: 'wi-room wi-big', style: tint(r) }, roomHead(r)));
            var box = el('div', { class: 'g-choices wi-opts' });
            q.options.forEach(function (i) {
              var o = R.items[i].obj;
              var b = el('button', { class: 'g-choice', type: 'button', onclick: function () { pick(i === q.answer, b); } }, [em(o.em), el('span', null, o.name)]);
              b._ok = i === q.answer;
              box.appendChild(b);
            });
            w.appendChild(box);
            return;
          }
          var it = R.items[q.item];
          ctx.setStatus(R.spots ? 'לחצו על המקום המדויק: חדר ורהיט' : 'לחצו על החדר');
          w.appendChild(el('div', { class: 'wi-q' }, [em(it.obj.em), el('span', null, (R.moves.length ? 'איפה עכשיו ' : 'איפה שמתם את ') + it.obj.the + '?')]));
          var btns = [];
          var plan = el('div', { class: 'wi-plan' }, R.rooms.map(function (ri) {
            var r = ROOMS[ri];
            if (!R.spots) {
              var b = el('button', { class: 'wi-room wi-btn', type: 'button', style: tint(r), onclick: function () { pick(ri === q.answer.room, b); } }, roomHead(r));
              b._ok = ri === q.answer.room;
              btns.push(b);
              return b;
            }
            return el('div', { class: 'wi-room', style: tint(r) }, [roomHead(r), el('div', { class: 'wi-spots' }, r.spots.map(function (s, si) {
              var b = el('button', { class: 'wi-spot', type: 'button', 'aria-label': r.name + ', ' + s.name,
                onclick: function () { pick(ri === q.answer.room && si === q.answer.spot, b); } }, [em(s.em), el('span', { class: 'wi-spot-n' }, s.name)]);
              b._ok = ri === q.answer.room && si === q.answer.spot;
              btns.push(b);
              return b;
            }))]);
          }));
          w.appendChild(plan);

          function pick(ok, b) {
            if (answered) return;
            answered = true;
            total++;
            if (ok) good++;
            var all = q.type === 'which' ? [].slice.call(w.querySelectorAll('.g-choice')) : btns;
            all.forEach(function (x) { x.disabled = true; if (x._ok) x.classList.add('is-correct'); });
            if (!ok) b.classList.add('is-wrong');
            var msg;
            if (!ok) {
              if (q.type === 'which') { var a = R.items[q.answer].obj; msg = ROOMS[q.room].inn + ': ' + a.em + ' ' + a.name; }
              else msg = it.obj.the + ': ' + placeText(R, q.answer);
            }
            ctx.feedback(ok, msg).then(function () { return ctx.wait(ok ? 200 : 600); }).then(function () { ask(qi + 1); });
          }
        }
      }
      nextRound();
    }
  });
})();
