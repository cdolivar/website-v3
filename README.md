# charlesdavidolivar.com

My site: a cube you can turn, with my resume on its sides. Built with Vite, CSS 3D transforms and GSAP.

- `index.html` — all content: the six cube faces and their flip layers (edit copy here)
- `src/main.js` — drag/inertia/snap rotation, flipping, caption, keyboard and nav
- `src/quat.js` — small quaternion helpers for the cube's orientation
- `src/style.css` — all styles
- `public/photos/` — the one photo (front face, 1997)

```bash
npm install
npm run dev      # local dev server
npm run deploy   # build to dist/ and publish to the gh-pages branch
```

`public/CNAME` keeps the custom domain on each deploy.
