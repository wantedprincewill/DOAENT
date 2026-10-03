# DOA ENT

Marketing site for **DOA ENT (Doa Entertainment)**, the entertainment design studio of Doa Designz.

Static site with no build step: `index.html`, `styles.css`, `main.js`. GSAP, ScrollTrigger and Lenis are kept in `assets/vendor/`.

## Run locally

```bash
python3 -m http.server 4173   # or: npx serve .
# open http://localhost:4173
```

Deploy by uploading the folder to any static host (Netlify, Vercel, GitHub Pages, cPanel).

## Structure

| Section | Notes |
| --- | --- |
| Loader + hero | Counter intro, line-mask headline, live TV static drawn on a canvas over the hero photo |
| Stats + ticker | Count-up numbers; the marquee speeds up with scroll velocity |
| Services | Scroll-scrubbed wireframe hand and globe; big rows with a cursor-following poster preview |
| Built for | Light section: heavy caps with inline poster images that open on scroll |
| Selected work | Two looping poster rows going opposite ways; hovering pauses them and spotlights a poster |
| Trusted by / Why DOA ENT | Client logos; three studio pillars |
| Packages / FAQ / Contact | Flash ₦100k, Strobe ₦650k/mo, Prism ₦1.5M/mo + add-ons; animated accordion; validated form |

Motion respects `prefers-reduced-motion`. The cursor and magnetic effects only turn on for fine pointers.

## Before launch

- **Contact form** opens the visitor's mail client, sending to `hello@doaent.studio` (a placeholder). To use a real form service (Formspree, Netlify Forms, etc.), change the submit handler in `main.js`.
- **Social links** in the footer point to `#`.
- **Poster images** in `assets/work/` came from the Figma file at 1x (about 260px wide). Swap in higher-resolution exports, keeping the same file names.
- **FAQ answers and package inclusions** are draft copy; confirm them against how the studio actually works.
- **Logo** in `assets/logo/doa-ent.svg` is a vector rebuild of the supplied lockup. Replace it with the master file if you have one.
