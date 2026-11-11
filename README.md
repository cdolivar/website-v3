# charlesdavidolivar.com

[![CI](https://github.com/cdolivar/website-v3/actions/workflows/ci.yml/badge.svg)](https://github.com/cdolivar/website-v3/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/code-MIT-blue.svg)](LICENSE)

**Live: [charlesdavidolivar.com](https://charlesdavidolivar.com)**

My personal site: a cube you can turn, with my resume on its sides, plus a handful of design case studies. It's hand-built with Vite, CSS 3D transforms and GSAP. There's no UI framework, because the interaction is the point.

## Highlights

- **Quaternion-driven rotation.** The cube's orientation is a quaternion ([`src/quat.js`](src/quat.js), unit-tested). That avoids gimbal lock and lets dragging feel the same from any face. Releases carry inertia and then snap to the nearest face, using slerp.
- **Real CSS 3D, no canvas or WebGL.** The faces are ordinary DOM, so text stays selectable, searchable and screen-reader accessible. A light direction shades the faces from the cube's orientation.
- **Accessible by default.** Keyboard navigation, skip links, `prefers-reduced-motion` and `prefers-color-scheme` support, and a theme that's applied before first paint so there's no flash.
- **Multi-page Vite build.** The cube is the landing page. The design case studies are plain scrolling pages that share `src/design.css`. Images are webp and clips are mp4 with posters.
- **Side project: a [job-board](job-board/) pipeline.** It's a Python aggregator and ranker for remote engineering roles, refreshed daily by GitHub Actions. See [`job-board/README.md`](job-board/README.md).

## Stack

Vite 8 · vanilla JS (ES modules) · GSAP · CSS custom properties · IBM Plex Mono (via Fontsource) · GitHub Pages · GitHub Actions · Python 3 (stdlib only) for the job board

## Getting started

Requires Node 20.19 or newer (see [`.nvmrc`](.nvmrc)).

```bash
npm install
npm run dev       # local dev server
npm test          # unit tests (node:test, no extra dependencies)
npm run build     # production build to dist/
npm run deploy    # build and publish dist/ to the gh-pages branch
```

`public/CNAME` keeps the custom domain on each deploy. CI (`.github/workflows/ci.yml`) runs the tests and a production build on every push and pull request.

## Project layout

```
index.html            all cube content: six faces and their flip layers (edit copy here)
src/main.js           drag, inertia, snap, flipping, caption, keyboard and nav
src/quat.js           quaternion helpers for the cube's orientation
src/style.css         styles for the cube page
src/design.{css,js}   shared look and behavior for the case studies
design/               case-study pages (/design/, /design/<name>/)
public/               static assets: images, video, icons, CNAME
job-board/            Python job aggregator and ranker (see its README)
test/                 unit tests
vite.config.js        lists every page for the multi-page build
```

To add a case study, create `design/<name>/index.html`, put its assets in `public/design/<name>/`, and register the page in `build.rollupOptions.input` in `vite.config.js`.

## License

The code is [MIT](LICENSE). The personal content (copy, photos, case-study text, images and video) is © Charles David Olivar and isn't covered by that license.
