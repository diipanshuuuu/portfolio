# dipanshu singh — ideas, compiled

> **Live site**: [https://dipannshuuuu.web.app](https://dipannshuuuu.web.app)

Personal portfolio of **Dipanshu Singh**, a first-year B.Tech CSE (AI & ML) student at Newton School of Technology who builds open-source tools, web interfaces and local AI.

It's a single, deliberately unhinged page written in plain HTML, CSS and JavaScript: no frameworks, no dependencies, no build step.

## Features

- **Boot sequence.** First visit per session boots "DipanshuOS" with a fake kernel log and an access-granted glitch. Press any key to skip.
- **Dithered WebGL shader.** A domain-warped plasma, rendered at a third of screen resolution and Bayer-dithered for a retro look. It swirls around your cursor and stretches when you scroll fast.
- **Kinetic type.** The name is set in [Recursive](https://www.recursive.design/), a variable font. Letters near the cursor morph from heavy casual to thin, slanted monospace; on touch screens a wave rolls through them instead. Scroll fast and every headline splits into RGB.
- **Four color modes.** acid, inferno, ice and paper (a light, risograph-style mode). The shader recolors with them, and your choice is remembered.
- **Work section.** Scrolls sideways on wide screens. Each card tilts with a glare, and has a live mock screen: Kavach masks personal data, SysCleanX cleans, and the NST SDC terminal cycles its palette.
- **A working shell.** Try `help`, `neofetch`, `projects`, `open kavach`, `mode inferno`, `matrix` or `sudo hire-me`. Tab autocompletes and ↑ ↓ walk the history.
- **Small extras.** A custom cursor with labels, magnetic buttons, a draggable 3D skills orb, keycaps that press when you type their letter, scroll-reactive marquees, opt-in sound effects, click sparks, and the Konami code.
- **Still accessible.**
  - Skip link, visible focus, and full keyboard support (tabbing into the sideways work section scrolls to the card).
  - Real text everywhere.
  - No horizontal scroll at 375px.
  - With `prefers-reduced-motion` there's no boot, no cursor and no movement: the shader renders one still frame and all content shows immediately.

## Structure

```
index.html            the page; all content lives here
styles.css            design tokens, layout, components, motion
script.js             boot, shader, cursor, kinetic type, work scroll, shell, easter eggs
favicon.svg           "d." mark
apple-touch-icon.png  180×180 home-screen icon
resume.pdf            exported résumé, linked from the page
resume/resume.html    résumé source
design-system/        UI/UX Pro Max design notes (pages/home.md overrides MASTER.md)
```

`script.js` is progressive enhancement only. With JavaScript off, every section still renders in full over a static gradient. Only the shell needs JavaScript.

## Run locally

Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
```

Then visit http://localhost:8000.

## Editing

- **Content:** everything is in `index.html`, and each section is marked with a comment such as `============ 01 Today ============`.
- **Projects:** copy an `<article class="card">` block inside `.work-track`, and update the `01/04` count in the work heading.
- **Shell commands:** they live in the `commands` object in `script.js`.
- **Colors, type and motion:** the tokens are at the top of `styles.css`, with one block per color mode (`[data-mode="inferno"]` and so on).

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

The first version's layout was inspired by [amxnn05/Portfolio](https://github.com/amxnn05/Portfolio). Fonts are [Recursive](https://www.recursive.design/) on the site and [IBM Plex Sans](https://www.ibm.com/plex/) with JetBrains Mono on the résumé, loaded from Google Fonts.

## Contact

[GitHub](https://github.com/diipanshuuuu) · [GitHub (personal)](https://github.com/htmnsrc) · [LinkedIn](https://www.linkedin.com/in/dipanshu-singh-86b2ba444/) · diipupc@gmail.com
