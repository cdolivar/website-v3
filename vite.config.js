import { resolve } from "node:path";
import { defineConfig } from "vite";

// Multi-page build: the cube (index.html) plus the design case studies, which
// are ordinary scrolling pages that share the site's look via src/design.css.
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "index.html"),
        design: resolve(import.meta.dirname, "design/index.html"),
        indeed: resolve(import.meta.dirname, "design/indeed/index.html"),
        skyalert: resolve(import.meta.dirname, "design/skyalert/index.html"),
        socratic: resolve(import.meta.dirname, "design/socratic/index.html"),
      },
    },
  },
});
