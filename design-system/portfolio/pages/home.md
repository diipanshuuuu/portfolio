# Home page overrides

These rules override `../MASTER.md` for `index.html` (the whole site is one page).
The layout follows the reference portfolio github.com/amxnn05/Portfolio, rebuilt in vanilla HTML/CSS.

## Stack
- Plain HTML + CSS. `script.js` is progressive enhancement only (theme switch, copy email,
  cursor spotlight, click sparks, scroll-reveal fallback). No build step, no frameworks, no GSAP.

## Layout
- Single centered column, `max-width: 42rem`, lowercase section headings.
- Sections: header → today → past & skills → journey → personal projects → currently exploring → links.
- Projects are native `<details name="projects">` (exclusive accordion), first one open.
- Ignore MASTER's "FAQ/Documentation Landing" pattern; it was a mismatch.

## Color (replaces MASTER palette)
| Token | Dark (default) | Light |
|---|---|---|
| `--bg` | `hsl(210 11% 3.5%)` | `#fdf6e3` (cream) |
| `--fg` | `#e0e2e8` | `#2a2825` |
| `--accent` | `#22c55e` | `#15803d` (4.6:1 on cream) |
| text tiers | white at 92 / 80 / 64 / 52% | black at 92 / 80 / 68 / 60% |

Light mode is supported (MASTER said "not recommended"); dark stays the default.

## Typography (replaces MASTER pairing)
- One family: JetBrains Mono (400, 500, 700, italic 400). No IBM Plex Sans on the site.
- Scale: 12 / 14 / 15 / 24px. Body is 15px: the 16px mobile rule exists to stop iOS input
  zoom, and the page has no inputs.

## Motion
- Tokens: `--dur-fast 160ms`, `--dur 280ms`, `--dur-exit 180ms` (exits ~65% of enters),
  `--dur-slow 700ms`, `--ease-out`, `--ease-spring` (CSS `linear()`).
- Only transform / opacity / clip-path animate; the one exception is the `<details>` height.
- No infinite decorative loops: the status dot pings 3×, carets blink a few times then stop.
- `prefers-reduced-motion` shows every final state and disables spotlight + sparks.

## Résumé
- Source: `resume/resume.html` (IBM Plex Sans body + JetBrains Mono headings, A4).
- Export to `resume.pdf` with headless Chromium `--print-to-pdf --no-pdf-header-footer`.
