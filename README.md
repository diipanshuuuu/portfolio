# dipanshu singh — still exploring

> **Live site**: [https://dipannshuuuu.web.app](https://dipannshuuuu.web.app)

Personal portfolio of **Dipanshu Singh**, a first-year B.Tech CSE (AI & ML) student at Newton School of Technology who builds open-source tools, web interfaces and local AI.

It's a single, minimal page written in plain HTML and CSS with a little vanilla JavaScript: no frameworks, no dependencies, no build step. It looks quiet, and has a few small surprises for people who poke around. The copy reads like an explorer's field notes: where i am, what i carry, the trail so far.

## Features

- **Minimal, monospace layout.** One column in JetBrains Mono, dark by default with a cream light theme. Switching themes grows the new one out of the toggle in a circle.
- **Subtle details:**
  - The name decrypts on load, and its letters thin out as the cursor gets close. JetBrains Mono is a variable font with fixed-width letters, so nothing shifts.
  - A faint dot grid appears only around the cursor.
  - Section titles and links scramble for a beat on hover.
  - The tagline types itself, and a live clock shows the time in Ayodhya.
  - Clicking anywhere throws sparks.
- **Projects.** Clean one-line rows; hovering one slides it open with its preview, description and links (click or keyboard also toggle it, and on touch screens you tap). Previews load the first time a row opens, and each one stays up to date on its own:
  - **Websites** are embedded live and scaled down, so a new deploy shows up immediately.
  - **Apps** pull their screenshots straight from their GitHub repo, so replacing a screenshot there updates the portfolio. No redeploy needed. With several screenshots, they crossfade one at a time, with dots to jump between them.
  - If neither is available, a small animated demo is shown.
- **Live signal from Discord.** A plain "now ›" line under the tagline shows the most interesting thing happening on my Discord: the song I'm listening to (with a small equalizer), what I'm doing ("coding in VS Code · 47m"), or just "idle on discord". It rotates when there's more than one. It uses [Lanyard](https://github.com/Phineas/lanyard): one REST call to paint immediately, then a WebSocket that updates the moment my status changes. It needs my account to stay in the Lanyard Discord server; if Lanyard is unreachable, the card stays hidden.
- **Secrets:**
  - Press `/` (or click "off the map" in the footer) to open a hidden shell. Try `help`, `map`, `goto trail`, `compass`, `neofetch` or `sudo hire-me`.
  - The Konami code cycles the accent color.
- **Accessible:**
  - Skip link, visible focus and keyboard support.
  - The shell is a modal dialog that keeps focus inside and closes on Escape.
  - No horizontal scrolling at 375px.
  - With `prefers-reduced-motion`, nothing moves and all content shows in its final state.

## Structure

```
index.html            the page; all content lives here
styles.css            design tokens, layout, components, motion
script.js             theme, copy email, name effect, scramble, spotlight, sparks, shell, clock, easter eggs
favicon.svg           "d." mark
apple-touch-icon.png  180×180 home-screen icon
resume.pdf            exported résumé, linked from the page
resume/resume.html    résumé source
design-system/        UI/UX Pro Max design notes (pages/home.md overrides MASTER.md)
```

`script.js` is progressive enhancement only. With JavaScript off, the page still renders, the projects still open, and the scroll reveals still run in browsers that support CSS scroll-driven animations.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Editing

- **Content:** everything is in `index.html`, and each section is marked with a comment such as `===== Today =====`.
- **Tagline:** after changing the text, set `--chars` on the `.typed` element to the new character count so the typing animation lines up.
- **Projects:** copy a `<details class="project" name="projects">` block. Keeping the shared `name` means only one project is open at a time.
- **Project previews:** each `.preview` reads one of three attributes.
  - `data-live`: a URL to embed live.
  - `data-shots`: image URLs, separated by spaces.
  - `data-override`: an image that wins over the shots if it exists. It's set to `preview.png` in each repo, so you can add or replace a screenshot there at any time.
- **Discord:** the user ID is `DISCORD_ID` near the presence code in `script.js`.
- **Shell commands:** they live in the `commands` object in `script.js`.
- **Colors, type and motion:** the tokens are at the top of `styles.css`, with the light theme in `:root[data-theme="light"]` and the extra accents in `[data-accent]` blocks.

## Résumé

The PDF is generated from `resume/resume.html`. After editing it, re-export in either of two ways:

- **From the browser:** open `resume/resume.html`, choose Print, then Save as PDF. Set the paper to A4 and turn off headers and footers.
- **From the terminal**, with any Chromium-based browser:

  ```bash
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --headless --no-pdf-header-footer --print-to-pdf=resume.pdf resume/resume.html
  ```

## Deploy

It's a static site, hosted on Firebase (`firebase deploy`). It also works as-is on GitHub Pages, Vercel or Netlify: leave the build command empty and publish the repository root.

## Credits

The layout is inspired by [amxnn05/Portfolio](https://github.com/amxnn05/Portfolio). Fonts are [JetBrains Mono](https://www.jetbrains.com/lp/mono/) and [IBM Plex Sans](https://www.ibm.com/plex/) (résumé only), loaded from Google Fonts.

## Contact

[GitHub](https://github.com/diipanshuuuu) · [GitHub (personal)](https://github.com/htmnsrc) · [LinkedIn](https://www.linkedin.com/in/dipanshu-singh-86b2ba444/) · diipupc@gmail.com
