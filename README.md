# dipanshu singh — ideas, compiled

Personal portfolio of **Dipanshu Singh**, a first-year B.Tech CSE (AI & ML) student at Newton School of Technology who builds open-source tools, web interfaces and local AI.

It's a single page written in plain HTML and CSS: no frameworks, no dependencies, no build step.

## Features

- **Minimal, monospace layout.** One column, JetBrains Mono, dark by default with a cream light theme. Your theme choice is remembered, and switching grows the new theme out of the toggle in a circle (in browsers with View Transitions).
- **Small moments of motion.** A tagline that types itself, a soft glow that follows the cursor, sparks on click, and sections that fade in as you scroll.
- **Projects as an accordion.** Built on native `<details>` elements, so only one is open at a time. Each project has a mini-terminal preview; Kavach's swaps real values for placeholders the way the extension does.
- **Practical extras.** Click to copy the email, a one-page résumé PDF, an SVG favicon, and Open Graph and JSON-LD metadata.
- **Accessible by default.**
  - Skip link, visible focus rings, and full keyboard support.
  - Readable contrast in both themes.
  - No horizontal scrolling at 375px.
  - With `prefers-reduced-motion`, every animation is switched off and content shows in its final state.

## Structure

```
index.html            the page; all content lives here
styles.css            design tokens, layout, components, motion
script.js             optional enhancements (theme, copy email, glow, sparks)
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
- **Colors, type and motion:** the tokens are at the top of `styles.css`. `:root` holds the dark theme and `:root[data-theme="light"]` the light one.

## Résumé

The PDF is generated from `resume/resume.html`. After editing it, re-export in either of two ways:

- **From the browser:** open `resume/resume.html`, choose Print, then Save as PDF. Set the paper to A4 and turn off headers and footers.
- **From the terminal**, with any Chromium-based browser:

  ```bash
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
    --headless --no-pdf-header-footer --print-to-pdf=resume.pdf resume/resume.html
  ```

## Deploy

It's a static site, so it works as-is on GitHub Pages, Vercel or Netlify. Leave the build command empty and publish the repository root.

## Credits

The layout is inspired by [amxnn05/Portfolio](https://github.com/amxnn05/Portfolio). Fonts are [JetBrains Mono](https://www.jetbrains.com/lp/mono/) and [IBM Plex Sans](https://www.ibm.com/plex/) (résumé only), loaded from Google Fonts.

## Contact

[GitHub](https://github.com/diipanshuuuu) · [GitHub (personal)](https://github.com/htmnsrc) · [LinkedIn](https://www.linkedin.com/in/dipanshu-singh-86b2ba444/) · diipupc@gmail.com
