# qlsos.github.io

Static site for QlsOS. No build step, no dependencies, works offline.

```
index.html           landing page (one page, sections)
404.html             not-found page
.nojekyll            tells GitHub Pages not to run Jekyll
assets/lasurpixel/     LasurPixel design system (css + js), assets/fonts/ Inter + JetBrains Mono
assets/css/style.css site layout
data/                roadmap, metrics, hardware (edited by tools/ or local/editor.html)
local/editor.html    private number editor (git-ignored)
tools/               gen_roadmap.py, gen_metrics.py, build_docs.py, gen_seo.py
assets/js/main.js    menu, active link, copy buttons
assets/img/          logo-mark.svg, wordmark.svg, favicon.svg
```

Deploy: repository named exactly `qlsos.github.io` under the account/org `qlsos`, push to `main`, Settings → Pages → Deploy from branch → `main` / root.
Local preview: `python3 -m http.server` and open http://localhost:8000
