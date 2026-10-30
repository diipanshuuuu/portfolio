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
- Each project body has a 16:10 `.preview` on top, then the description.
  - The preview loads only when its project opens.
  - Order of preference: `data-live` (scaled iframe of the live site, inert) → `data-override` (`preview.png` in the repo) → `data-shots` (screenshots from the repo) → the animated demo tile.
- Hero tagline: "exploring." (typed; `--chars` must equal its length).
- Several screenshots show as a one-at-a-time crossfade (3.5s, pauses on hover, dots to jump; no autoplay with reduced motion).

## Voice: an explorer's field notes
- Title: "dipanshu singh — still exploring".
- Sections: where i am · what i carry · the trail so far · built along the way · on the horizon · find me.
- Clock reads like a map position: `26.79°n 82.20°e · 19:12 ist`.
- Shell: "you wandered off the map", plus `where`, `map`, `goto <place>`, `compass`, and the footer hint "off the map".
- Keep facts plain: project descriptions, "open to work" and the résumé stay literal and professional.
- Avoid the old "ideas, compiled" wording.

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
