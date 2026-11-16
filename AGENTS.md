# Study Guides

Static GitHub Pages site (served from `main` at /study-guides/), one folder per guide, plain HTML/CSS/JS with no build step.

## Building a guide

- Design each guide for its subject. Don't copy an earlier guide's modes, layout, or look just because it exists. Ask what the student actually has to do on the test (label a diagram, place commas, find places on a map, write essays) and build the practice around that skill.
- Work from the student's own materials (worksheets, notes, review sheets). Keep their teacher's terms and methods, and correct mistakes in the source rather than copying them, with a note saying what was fixed.
- Keep facts in a readable data file separate from the code, so they can be checked and edited.

## Shared site plumbing (keep these consistent)

- Add the guide to `GUIDES` and the `<noscript>` list in the root `index.html`.
- Add every file the guide needs to `PRECACHE` in `sw.js` and bump `VERSION`.
- Each guide page links `../manifest.webmanifest`, loads `../offline.js`, and links back to `../`.
