# רגע למוח

אימון מוח יומי בעברית למבוגרים: 18 משחקי זיכרון, קשב, חשיבה ושפה, 20 רמות בכל משחק, בלי שעון ובלי לחץ.

Daily Hebrew brain-training games for adults. Plain static site (HTML/CSS/JS), no build step.

**Live site:** https://jaromk.github.io/RegaLamoah/

## Run locally
Open `index.html` in a browser. That's it.

## Publish with GitHub Pages
1. Push this folder to the `master` branch of `JaromK/RegaLamoah`.
2. On GitHub: **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: **master**, folder: **/ (root)** → Save
3. After a minute or two the site is live at the address above. Every push to `master` redeploys it.

`.nojekyll` tells Pages to serve the files as-is (no Jekyll processing). `404.html` is the friendly "page not found" page.

## Structure
- `index.html` – page shell
- `css/style.css` – design tokens (light + dark) and shared game styles
- `js/core.js` – registry, daily rotation, levels, storage, sound, speech
- `js/app.js` – screens: welcome, home, instructions, game, results
- `js/games/*.js` – one file per game; see `GAME_API.md` to add a game

## Data & privacy
Progress is kept only in the visitor's browser (`localStorage`, key `rega-lamoach-v1`). No cookies, no server, nothing is sent anywhere.
