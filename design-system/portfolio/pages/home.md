# Home page overrides

These rules override `../MASTER.md` for `index.html` (the whole site is one page).
Direction as of 2026-10-30: **maximal**. The owner asked for it to look "as crazy as possible".
The earlier minimal, single-column version (modeled on github.com/amxnn05/Portfolio) is retired.

## Stack
- Plain HTML + CSS + vanilla JS. No frameworks, libraries, GSAP or build step.
- Raw WebGL for the background shader. `script.js` is progressive enhancement: with JS off,
  every section renders over a static CSS gradient.

## Style
- Neon brutalism + cyberpunk: huge variable type, visible grid, scanlines, film grain,
  sharp borders, glitch bursts, RGB split on fast scroll.
- Background: domain-warped fbm plasma, rendered at 1/3 resolution, Bayer-dithered
  (`image-rendering: pixelated`). Dimmed to ~32% below the hero so body text stays readable.
- Hero name uses `mix-blend-mode: difference` so it reads over any shader color
  (switched off in paper mode).

## Color modes (`html[data-mode]`)
| Mode | --bg | --accent | --accent-2 | --accent-3 |
|---|---|---|---|---|
| acid (default) | `#050607` | `#c6ff3d` | `#ff2bd6` | `#23f0ff` |
| inferno | `#050607` | `#ff5a1f` | `#ffd400` | `#ff2d55` |
| ice | `#050607` | `#4df3ff` | `#8b5cff` | `#ff4fd8` |
| paper (light) | `#f2ede1` | `#d62f00` | `#0047ff` | `#ff2bd6` |

Mock screens and the shell stay dark in every mode (`--screen-bg`), using `--term-accent`.

## Typography
- One family: **Recursive** variable (wght 300–1000, CASL, MONO, slnt, CRSV).
  - Display: wght 1000, CASL 1.
  - Body: wght 420, CASL 0.2.
  - UI/mono: MONO 1.
- Hero and footer letters are driven per-letter by the cursor through `--w/--s/--m/--c/--f`.
- Outlined text must use `paint-order: stroke fill` with an opaque fill. Plain `text-stroke` on
  transparent text shows the variable font's overlapping contours.

## Motion
- One rAF loop in `script.js`; it pauses when the tab is hidden. Expensive parts only run when visible.
- Work section is pinned and scrolls sideways at ≥1000px wide (with motion allowed); otherwise it stacks vertically.
- `prefers-reduced-motion`: no boot, no custom cursor, no horizontal pin, no word reveal, and the shader renders one still frame.

## Résumé
- Source: `resume/resume.html` (IBM Plex Sans + JetBrains Mono, A4) → `resume.pdf` via headless Chromium.
