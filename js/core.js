/*
 * רגע למוח — core runtime.
 * Games register with BrainGames.register({...}) and receive a `ctx` helper
 * object when started. See GAME_API.md for the full contract.
 */
(function () {
  'use strict';

  var registry = [];
  var injectedCss = {};

  var SKILLS = {
    memory:    { label: 'זיכרון', hue: 'memory' },
    attention: { label: 'קשב וריכוז', hue: 'attention' },
    logic:     { label: 'חשיבה וחשבון', hue: 'logic' },
    language:  { label: 'שפה', hue: 'language' }
  };

  var MIN_LEVEL = 1;
  var MAX_LEVEL = 20;
  var START_LEVEL = 3; // level 1–2 stay available as warm-ups

  /* Levels are grouped into named stages shown on the level path. */
  var STAGES = [
    { from: 1,  to: 5,  name: 'צעדים ראשונים' },
    { from: 6,  to: 10, name: 'מתחממים' },
    { from: 11, to: 15, name: 'בכושר' },
    { from: 16, to: 20, name: 'אלופים' }
  ];

  function stageOf(level) {
    for (var i = 0; i < STAGES.length; i++) if (level <= STAGES[i].to) return STAGES[i];
    return STAGES[STAGES.length - 1];
  }

  /* ---------- storage (always fail-safe) ---------- */
  var STORE_KEY = 'rega-lamoach-v1';
  var STATE_VERSION = 2;
  var memoryFallback = null;

  function loadState() {
    var base = {
      version: STATE_VERSION, name: '', welcomed: false,
      levels: {}, best: {}, history: {}, prefs: { sound: true, bigText: false }
    };
    try {
      var raw = window.localStorage.getItem(STORE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        base.name = parsed.name || '';
        base.welcomed = !!parsed.welcomed;
        base.levels = parsed.levels || {};
        base.best = parsed.best || {};
        base.history = parsed.history || {};
        base.prefs = Object.assign(base.prefs, parsed.prefs || {});
        if ((parsed.version || 1) < 2) {
          // v1 used levels 1–10; the same difficulty now sits on a 1–20 scale
          Object.keys(base.levels).forEach(function (id) {
            base.levels[id] = Math.round(1 + (base.levels[id] - 1) * 14 / 9);
          });
          base.welcomed = Object.keys(base.history).length > 0;
        }
        Object.keys(base.levels).forEach(function (id) {
          base.best[id] = Math.max(base.best[id] || 1, base.levels[id]);
        });
      }
    } catch (e) {
      if (memoryFallback) return memoryFallback;
    }
    return base;
  }

  function saveState(state) {
    memoryFallback = state;
    try { window.localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  /* ---------- dates & seeded randomness ---------- */
  function dateKey(d) {
    d = d || new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function hashString(str) {
    var h = 2166136261;
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function makeRng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(arr, rng) {
    rng = rng || Math.random;
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function randInt(min, max, rng) {
    rng = rng || Math.random;
    return min + Math.floor(rng() * (max - min + 1));
  }

  function pick(arr, rng) {
    rng = rng || Math.random;
    return arr[Math.floor(rng() * arr.length)];
  }

  /* ---------- DOM helper ---------- */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'text') node.textContent = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') {
          Object.keys(v).forEach(function (p) {
            // custom properties (--cols) are only settable through setProperty
            if (p.slice(0, 2) === '--') node.style.setProperty(p, v[p]);
            else node.style[p] = v[p];
          });
        }
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else if (v === true) node.setAttribute(k, '');
        else node.setAttribute(k, v);
      });
    }
    if (children !== undefined && children !== null) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c === null || c === undefined || c === false) return;
        node.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
      });
    }
    return node;
  }

  /* ---------- sound (gentle tones) ---------- */
  var audioCtx = null;
  function tone(freq, duration, delay, type) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var t0 = audioCtx.currentTime + (delay || 0);
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start(t0); osc.stop(t0 + duration + 0.05);
    } catch (e) { /* audio unavailable */ }
  }

  var soundEnabled = function () { return BrainGames.state.prefs.sound; };

  function playSound(kind, note) {
    if (!soundEnabled()) return;
    if (kind === 'good') { tone(660, 0.18); tone(880, 0.28, 0.12); }
    else if (kind === 'bad') { tone(300, 0.3, 0, 'triangle'); }
    else if (kind === 'done') { tone(523, 0.2); tone(659, 0.2, 0.15); tone(784, 0.4, 0.3); }
    else if (kind === 'tap') { tone(520, 0.08); }
    else if (kind === 'note') { tone(note || 440, 0.45); }
  }

  /* ---------- speech (Hebrew voice when available) ---------- */
  function hebrewVoice() {
    if (!('speechSynthesis' in window)) return null;
    var voices = window.speechSynthesis.getVoices() || [];
    for (var i = 0; i < voices.length; i++) {
      if (/^(he|iw)/i.test(voices[i].lang)) return voices[i];
    }
    return null;
  }

  function canSpeak() { return !!hebrewVoice(); }

  function speak(text) {
    var v = hebrewVoice();
    if (!v) return false;
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(text);
    u.voice = v; u.lang = v.lang; u.rate = 0.85;
    window.speechSynthesis.speak(u);
    return true;
  }

  function stopSpeaking() {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }

  /* ---------- registry ---------- */
  function register(game) {
    var required = ['id', 'name', 'skill', 'tagline', 'instructions', 'start'];
    for (var i = 0; i < required.length; i++) {
      if (!game[required[i]]) { console.error('Game is missing "' + required[i] + '"', game); return; }
    }
    if (!SKILLS[game.skill]) { console.error('Unknown skill "' + game.skill + '" for', game.id); return; }
    if (game.css && !injectedCss[game.id]) {
      injectedCss[game.id] = true;
      document.head.appendChild(el('style', { 'data-game': game.id, text: game.css }));
    }
    registry.push(game);
  }

  function getGame(id) {
    for (var i = 0; i < registry.length; i++) if (registry[i].id === id) return registry[i];
    return null;
  }

  /* Today's workout: 4 games, seeded by the date, covering as many skills as possible. */
  function dailyGames(dKey, count) {
    count = count || 4;
    var rng = makeRng(hashString('daily:' + (dKey || dateKey())));
    var pool = shuffle(registry, rng);
    var chosen = [];
    var usedSkills = {};
    pool.forEach(function (g) {
      if (chosen.length < count && !usedSkills[g.skill]) { chosen.push(g); usedSkills[g.skill] = true; }
    });
    pool.forEach(function (g) {
      if (chosen.length < count && chosen.indexOf(g) === -1) chosen.push(g);
    });
    return chosen;
  }

  window.BrainGames = {
    SKILLS: SKILLS,
    MIN_LEVEL: MIN_LEVEL,
    MAX_LEVEL: MAX_LEVEL,
    START_LEVEL: START_LEVEL,
    STAGES: STAGES,
    stageOf: stageOf,
    register: register,
    getGame: getGame,
    all: function () { return registry.slice(); },
    dailyGames: dailyGames,
    state: loadState(),
    save: function () { saveState(this.state); },
    util: {
      el: el, shuffle: shuffle, randInt: randInt, pick: pick,
      makeRng: makeRng, hashString: hashString, dateKey: dateKey,
      playSound: playSound, speak: speak, canSpeak: canSpeak, stopSpeaking: stopSpeaking
    }
  };
})();
