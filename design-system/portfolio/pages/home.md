# Home page overrides

These rules override `../MASTER.md` for `index.html` (the whole site is one page).

**Direction (2026-10-30): "minimally crazy, subtly awesome".**
The base is the minimal single-column layout modeled on github.com/amxnn05/Portfolio, plus a few small, delightful details.
A full maximal redesign (WebGL shader, boot screen, kinetic type) was tried in commit `67f86c0` and rejected as too much.
Don't bring that back unless asked.

## Stack
- Plain HTML + CSS. `script.js` is vanilla, progressive enhancement only.
- No frameworks, no build step.

## Layout
- Single centered column, `max-width: 42rem`, lowercase section headings.
- Sections: header → today → past & skills → journey → personal projects → currently exploring → links.
- Projects are native `<details name="projects">`, first one open.

## Color
| Token | Dark (default) | Light |
|---|---|---|
| `--bg` | `hsl(210 11% 3.5%)` | `#fdf6e3` (cream) |
| `--fg` | `#e0e2e8` | `#2a2825` |
| `--accent` | `#22c55e` | `#15803d` |

Hidden accents (`html[data-accent]`, via the Konami code or the shell's `accent` command):
- orange `#fb923c` / light `#c2410c`
- blue `#38bdf8` / light `#0369a1`
- pink `#f472b6` / light `#be185d`

Every light shade keeps 4.5:1 on cream.

## Typography
- JetBrains Mono **variable** (wght 100–800). Every weight has the same advance width, so per-letter weight can animate without layout shift.
- Scale: 12 / 14 / 15 / 24px.

## The subtle layer (keep it this restrained)
- Name decrypts on load; letters thin from 700 to about 180 within 120px of the cursor (fine pointers only).
- Faint dot grid inside the cursor spotlight.
- Section titles, footer links and project names scramble for 360ms on hover.
- Tagline types itself, with a live Ayodhya clock under the theme toggle.
- Hidden shell (`/` key or the footer "secret shell" button) is a modal dialog: focus stays inside and Escape closes it.
- Easter eggs: Konami → accent cycle, `sudo hire-me`, a console hello, and a tab title that changes when you leave.
- `prefers-reduced-motion` disables all of it except the shell and the clock.

## Motion
- Tokens: `--dur-fast 160ms`, `--dur 280ms`, `--dur-exit 180ms`, `--dur-slow 700ms`, `--ease-out`, `--ease-spring`.
- Animate transform, opacity and clip-path only. The one exception is the `<details>` height.

## Résumé
- Source: `resume/resume.html` → `resume.pdf` via headless Chromium print.
