# רגע למוח — Game API

Plain static site, no build step. Opens straight from `index.html` (also via `file://`),
so game files are **classic scripts** (no ES modules, no imports, no fetch).
Each game lives in `js/games/<id>.js`, wraps itself in an IIFE and calls `BrainGames.register`.

## Audience & tone (important)
- Players are adults, often older adults, rebuilding focus and memory. Everything is in **Hebrew** (RTL).
- **No countdown timers, no time pressure.** Never fail a player for being slow.
  When something must be shown and then hidden (memorise phase), show it for a generous time
  (start ≥ 3–4 s, never < 1 s per item) **or** let the player press "זכרתי, הלאה" when ready.
- Instructions: 2–4 short, concrete steps, plain words, address the player in plural ("לחצו", "זכרו").
- Large targets (the shared classes already handle this). Max ~6 choices on screen.
- One session = 6–8 rounds, about 3 minutes.

## Registration
```js
(function () {
  'use strict';
  BrainGames.register({
    id: 'memory-pairs',            // must equal the file name
    name: 'זוגות',                 // short title
    skill: 'memory',               // 'memory' | 'attention' | 'logic' | 'language'
    tagline: 'מצאו את הזוגות של הקלפים', // one line for the cards
    benefit: 'זיכרון עבודה חזותי',  // optional, "מה זה מאמן"
    instructions: ['...', '...', '...'],
    css: '.mp-card{...}',          // optional, injected once; prefix classes with a game-specific prefix
    start: function (root, ctx) {  // root = empty board element
      // build UI inside root; call ctx.finish(...) at the end
      return function cleanup() {}; // optional
    }
  });
})();
```

## ctx
| member | purpose |
|---|---|
| `ctx.level` | integer 1–20, adaptive (app raises it at ≥85% accuracy, lowers it below 50%). New players start at 3; 1–2 are warm-ups. Stages: 1–5 צעדים ראשונים, 6–10 מתחממים, 11–15 בכושר, 16–20 אלופים. Scale *size/complexity* with it in small steps per level, never speed. Clamp defensively. |
| `ctx.el(tag, attrs, children)` | DOM helper. attrs: `class`, `text`, `html`, `style` (object), `onclick` etc., any other attribute. children: node, string, or array. |
| `ctx.shuffle(arr)` / `ctx.randInt(min,max)` / `ctx.pick(arr)` | randomness (inclusive randInt). |
| `ctx.setProgress(cur, total)` | header "שלב cur מתוך total". Call at the start of each round. |
| `ctx.setStatus(text)` | large instruction line above the board ("זכרו את המשבצות הצהובות"). |
| `ctx.feedback(ok, message?)` | plays a sound + shows a toast for 1.5 s; returns a Promise. Default messages are fine; pass one to explain a wrong answer (e.g. `'התשובה הנכונה: 12'`). |
| `ctx.wait(ms)` | Promise; never resolves if the player left the game, so `await`/`then` chains stop safely. |
| `ctx.sound(kind, note?)` | `'tap'`, `'good'`, `'bad'`, `'note'` (with frequency in Hz). |
| `ctx.isActive()` | false after the player left. |
| `ctx.finish({ correct, total, note? })` | ends the game and shows results. `note` = optional one-line Hebrew summary. |

Use `ctx.wait` for every delay instead of raw `setTimeout`. If you use `setInterval`/listeners on
`document`, remove them in the returned cleanup.

## Shared CSS classes (css/style.css)
Use these before writing your own. Use CSS custom properties only (no literal colors) so dark mode works:
`--surface --surface-2 --ink --ink-soft --line --accent --accent-soft --accent-ink --sun --sun-soft --good --good-soft --bad --bad-soft`
and skill hues `--memory --attention --logic --language` (+ `-soft`).

- `.g-prompt` question text · `.g-big` huge number/word · `.g-hint` small grey helper text
- `.g-choices` responsive grid of answers; `.g-choice` big answer button
  with states `.is-selected`, `.is-correct`, `.is-wrong`; disable with `disabled`
- `.g-actions` row of buttons; `.btn .btn-primary | .btn-secondary | .btn-quiet`, `.btn-lg`
- `.g-grid` square grid, set columns with `style: { '--cols': 3 }`; `.g-tile` square cell
  with states `.is-lit`, `.is-correct`, `.is-wrong`

The root board is a centred flex column with `gap: 1.25rem`.
