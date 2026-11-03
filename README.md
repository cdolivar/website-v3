# charlesdavidolivar.com

Interactive resume — a draggable acrylic cube built with Vite, CSS 3D transforms and GSAP.

- `index.html` — all content: the six cube faces and their flip layers (edit copy here)
- `src/main.js` — drag/inertia/snap rotation, flipping, caption, keyboard and nav
- `src/quat.js` — small quaternion helpers for the cube's orientation
- `src/style.css` — all styles
- `public/photos/` — cropped, metadata-stripped photos

```bash
npm install
npm run dev      # local dev server
npm run deploy   # build to dist/ and publish to the gh-pages branch
```

`public/CNAME` keeps the custom domain on each deploy.
