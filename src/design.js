// Shared behavior for the design pages: theme toggle, header state, reading
// progress, section tracking in the contents list, and the row preview.
import "./design.css";

const root = document.documentElement;
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Theme (same storage key as the cube page) ---------- */

const toggle = document.querySelector("[data-theme-toggle]");
const themeColor = document.querySelector('meta[name="theme-color"]');

function renderTheme() {
  const dark = root.dataset.theme !== "light";
  toggle?.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} theme`);
  if (themeColor) themeColor.content = dark ? "#000000" : "#ffffff";
}

toggle?.addEventListener("click", () => {
  const next = root.dataset.theme === "light" ? "dark" : "light";
  root.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {}
  renderTheme();
});
renderTheme();

/* ---------- Header border + reading progress ---------- */

const top = document.querySelector(".top");
const bar = document.querySelector(".progress");

function onScroll() {
  top?.classList.toggle("is-scrolled", scrollY > 8);
  if (bar) {
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
  }
}
addEventListener("scroll", onScroll, { passive: true });
addEventListener("resize", onScroll);
onScroll();

/* ---------- Contents list follows the section in view ---------- */

const links = [...document.querySelectorAll(".toc a")];
if (links.length && "IntersectionObserver" in window) {
  const sections = links.map((a) => document.querySelector(a.hash)).filter(Boolean);
  const visible = new Set();
  const mark = () => {
    // the topmost section that is currently in the reading band wins
    const current = sections.find((s) => visible.has(s)) ?? sections.filter((s) => s.getBoundingClientRect().top < innerHeight * 0.4).pop();
    links.forEach((a) => a.setAttribute("aria-current", String(!!current && a.hash === `#${current.id}`)));
  };
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      mark();
    },
    { rootMargin: "-20% 0px -65% 0px" }
  );
  sections.forEach((s) => io.observe(s));
  mark();
}

/* ---------- Looping clips: still for reduced motion, paused off screen ---------- */

const clips = [...document.querySelectorAll("video[data-loop]")];
if (clips.length) {
  if (reducedMotion) {
    clips.forEach((v) => {
      v.removeAttribute("autoplay");
      v.pause();
      v.controls = true;
    });
  } else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => (e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause())),
      { threshold: 0.25 }
    );
    clips.forEach((v) => io.observe(v));
  }
}

/* ---------- Index: a preview that trails the pointer over a linked row ---------- */

const preview = document.querySelector(".preview");
const rows = [...document.querySelectorAll("a.work__row[data-preview]")];
if (preview && rows.length && matchMedia("(hover: hover) and (min-width: 861px)").matches) {
  let tx = 0;
  let ty = 0;
  let x = 0;
  let y = 0;
  let raf = 0;
  const follow = () => {
    x += (tx - x) * (reducedMotion ? 1 : 0.18);
    y += (ty - y) * (reducedMotion ? 1 : 0.18);
    preview.style.transform = `translate(${x}px, ${y}px)`;
    raf = preview.classList.contains("is-on") ? requestAnimationFrame(follow) : 0;
  };
  const place = (e) => {
    tx = Math.min(e.clientX + 24, innerWidth - 320 - 16);
    ty = Math.min(Math.max(e.clientY - 90, 72), innerHeight - 180 - 16);
  };
  rows.forEach((row) => {
    row.addEventListener("pointerenter", (e) => {
      preview.style.backgroundImage = `url("${row.dataset.preview}")`;
      place(e);
      if (!raf) {
        x = tx;
        y = ty;
      }
      preview.classList.add("is-on");
      if (!raf) raf = requestAnimationFrame(follow);
    });
    row.addEventListener("pointermove", place);
    row.addEventListener("pointerleave", () => preview.classList.remove("is-on"));
  });
}
