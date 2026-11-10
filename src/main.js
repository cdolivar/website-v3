import "./style.css";
import gsap from "gsap";
import * as Q from "./quat.js";

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const stage = document.querySelector(".stage");
const cube = document.querySelector(".cube");
const shadow = document.querySelector(".shadow");
const faces = [...cube.querySelectorAll(".face")];
const glass = [...cube.querySelectorAll(".glass")];
const navButtons = [...document.querySelectorAll(".strip [data-goto]")];
const ambient = [...document.querySelectorAll(".ambient__layer")];
const caption = {
  frame: document.querySelector("[data-cap=frame]"),
  label: document.querySelector("[data-cap=label]"),
  title: document.querySelector("[data-cap=title]"),
  sub: document.querySelector("[data-cap=sub]"),
};

// Same order as the faces in the markup: front, right, back, left, top, bottom.
// These must match each face's CSS --t transform.
const deg = Math.PI / 180;
const PLACEMENT = [
  Q.identity(),
  Q.fromAxisAngle(0, 1, 0, 90 * deg),
  Q.fromAxisAngle(0, 1, 0, 180 * deg),
  Q.fromAxisAngle(0, 1, 0, -90 * deg),
  Q.fromAxisAngle(1, 0, 0, 90 * deg),
  Q.fromAxisAngle(1, 0, 0, -90 * deg),
];
const NORMALS = PLACEMENT.map((p) => Q.rotateVector(p, [0, 0, 1]));
const FACING = PLACEMENT.map((p) => Q.conjugate(p)); // cube orientation that shows face i, upright
const LIGHT = (() => {
  const v = [-0.45, -0.6, 0.75]; // upper left, in front
  const l = Math.hypot(...v);
  return v.map((c) => c / l);
})();

/* ---------- State ---------- */

let q = Q.identity();
let mode = "idle"; // drag | inertia | snap | idle
let snapTarget = 0;
let lockedActive = 0; // set while flying to a chosen face
let vel = [0, 0]; // screen-space angular velocity, rad/ms
let active = -1;

const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
const pointer = { down: null, dragging: false, lastX: 0, lastY: 0, lastT: 0 };
let suppressClick = false;

function cubeSize() {
  return stage.querySelector(".scene").offsetWidth || 400;
}

function applyRotation(wx, wy) {
  const angle = Math.hypot(wx, wy);
  if (angle < 1e-7) return;
  q = Q.normalize(Q.multiply(Q.fromAxisAngle(wx, wy, 0, angle), q));
}

function nearestFace(orientation) {
  let best = 0;
  let bestZ = -Infinity;
  NORMALS.forEach((n, i) => {
    const z = Q.rotateVector(orientation, n)[2];
    if (z > bestZ) {
      bestZ = z;
      best = i;
    }
  });
  return best;
}

function goTo(i) {
  snapTarget = i;
  lockedActive = i;
  mode = "snap";
  vel = [0, 0];
  setActive(i);
}

/* ---------- Active face → caption, nav, ambient light ---------- */

// Each side is a stack of layers; a tap develops the next one over the last.
const layers = faces.map((f) => [...f.querySelectorAll(".layer")]);
const shown = faces.map(() => 0);
faces.forEach((f, i) => {
  f.classList.toggle("has-flip", layers[i].length > 1);
  updateBadge(i);
  syncInert(i);
});

// Layers that haven't been developed yet are invisible, so keep their links out of the tab order.
function syncInert(i) {
  layers[i].forEach((layer, n) => (layer.inert = n > shown[i]));
}

function updateBadge(i) {
  const badge = faces[i].querySelector(".flip-badge");
  if (badge) badge.textContent = `↻ ${shown[i] + 1}/${layers[i].length}`;
}

// The room takes the color of the shown layer's photo, if it has one.
function currentBackdrop(i) {
  const img = layers[i][shown[i]].querySelector("img");
  return img ? `url("${img.currentSrc || img.src}")` : null;
}

let ambientIndex = 0;
function setAmbient(src) {
  const on = ambient[ambientIndex];
  if (on.dataset.src === src) return;
  ambientIndex = 1 - ambientIndex;
  const next = ambient[ambientIndex];
  on.classList.remove("is-on");
  if (src) {
    next.style.backgroundImage = src;
    next.dataset.src = src;
    next.classList.add("is-on");
  } else {
    next.dataset.src = "";
  }
}

// The title is split into letters so each can rise in on its own.
function setTitle(text, split) {
  caption.title.textContent = "";
  caption.title.setAttribute("aria-label", text);
  if (!split) return void (caption.title.textContent = text);
  for (const c of text) {
    const span = document.createElement("span");
    span.className = "ch";
    span.setAttribute("aria-hidden", "true");
    span.textContent = c;
    caption.title.append(span);
  }
}

function renderCaption(animate) {
  const face = faces[active];
  const layer = layers[active][shown[active]];
  const count = layers[active].length;
  const fallback = shown[active] < count - 1 ? "Tap to see more." : "Tap for the next side.";
  const update = () => {
    caption.frame.textContent = String(active + 1).padStart(2, "0");
    caption.label.textContent = layer.dataset.label || "";
    setTitle(face.dataset.name, animate && !reducedMotion);
    caption.sub.textContent = layer.dataset.sub || face.dataset.sub || fallback;
  };
  if (!animate || reducedMotion) return update();
  gsap.killTweensOf([caption.title, caption.title.children, caption.sub, caption.label]);
  gsap.to([caption.title, caption.sub, caption.label], {
    y: -8,
    autoAlpha: 0,
    duration: 0.16,
    ease: "power2.in",
    onComplete: () => {
      update();
      gsap.set(caption.title, { y: 0, autoAlpha: 1 });
      gsap.fromTo(caption.title.children, { yPercent: 70, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.55, stagger: 0.03, ease: "power3.out" });
      gsap.fromTo([caption.sub, caption.label], { y: 10, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.45, stagger: 0.04, delay: 0.1, ease: "power3.out" });
    },
  });
}

function setActive(i) {
  if (i === active) return;
  active = i;
  faces.forEach((f, n) => f.classList.toggle("is-active", n === i));
  navButtons.forEach((b) => b.setAttribute("aria-current", String(+b.dataset.goto === i)));
  renderCaption(true);
  setAmbient(currentBackdrop(i));
}

// A tap moves the tour forward: every layer on this side, then the next side.
function advance(i) {
  if (shown[i] < layers[i].length - 1) return flip(i);
  goTo((i + 1) % faces.length);
  resetFace(i);
}

function resetFace(i) {
  shown[i] = 0;
  layers[i].forEach((layer) => layer.classList.remove("is-shown"));
  updateBadge(i);
  syncInert(i);
}

function flip(i) {
  const stack = layers[i];
  if (stack.length < 2) return;
  shown[i] = (shown[i] + 1) % stack.length;
  stack.forEach((layer, n) => layer.classList.toggle("is-shown", n > 0 && n <= shown[i]));
  syncInert(i);
  const flash = faces[i].querySelector(".flash");
  flash.classList.remove("is-on");
  void flash.offsetWidth; // restart the animation
  flash.classList.add("is-on");
  updateBadge(i);
  renderCaption(true);
  setAmbient(currentBackdrop(i));
}

/* ---------- Input ---------- */

stage.addEventListener("pointerdown", (e) => {
  if (e.button !== 0) return;
  pointer.down = { id: e.pointerId, x: e.clientX, y: e.clientY };
  pointer.lastX = e.clientX;
  pointer.lastY = e.clientY;
  pointer.lastT = performance.now();
  vel = [0, 0];
});

window.addEventListener("pointermove", (e) => {
  // gentle parallax toward the pointer while idle
  if (!pointer.dragging) {
    tilt.tx = (e.clientY / innerHeight - 0.5) * -0.18;
    tilt.ty = (e.clientX / innerWidth - 0.5) * 0.24;
  }
  const d = pointer.down;
  if (!d || d.id !== e.pointerId) return;

  if (!pointer.dragging) {
    if (Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6) return;
    pointer.dragging = true;
    stage.setPointerCapture(e.pointerId);
    stage.classList.add("is-dragging");
    lockedActive = null;
    mode = "drag";
    tilt.tx = tilt.ty = 0;
  }

  const now = performance.now();
  const dt = Math.max(now - pointer.lastT, 1);
  const k = 2.6 / cubeSize(); // radians per pixel
  const wx = -(e.clientY - pointer.lastY) * k;
  const wy = (e.clientX - pointer.lastX) * k;
  applyRotation(wx, wy);
  vel = [vel[0] * 0.5 + (wx / dt) * 0.5, vel[1] * 0.5 + (wy / dt) * 0.5];
  pointer.lastX = e.clientX;
  pointer.lastY = e.clientY;
  pointer.lastT = now;
});

function endPointer(e) {
  const d = pointer.down;
  if (!d || d.id !== e.pointerId) return;
  if (pointer.dragging) {
    stage.releasePointerCapture?.(e.pointerId);
    stage.classList.remove("is-dragging");
    // a drag that stopped before release shouldn't fling
    if (performance.now() - pointer.lastT > 80) vel = [0, 0];
    // cap the fling so a hard flick lands a face or two away, not a random spin
    const speed = Math.hypot(vel[0], vel[1]);
    const maxSpeed = 0.009;
    if (speed > maxSpeed) vel = [(vel[0] / speed) * maxSpeed, (vel[1] / speed) * maxSpeed];
    mode = reducedMotion ? "snap" : "inertia";
    if (reducedMotion) snapTarget = nearestFace(q);
    suppressClick = true;
    setTimeout(() => (suppressClick = false), 0);
  }
  pointer.down = null;
  pointer.dragging = false;
}
window.addEventListener("pointerup", endPointer);
window.addEventListener("pointercancel", endPointer);

// A drag that ends over a face or link shouldn't count as a click
window.addEventListener(
  "click",
  (e) => {
    if (!suppressClick) return;
    e.preventDefault();
    e.stopPropagation();
  },
  true
);

// The browser can't hit-test the side faces while the cube is edge-on to the page,
// so a click on them never reaches the face. Decide from the active face's box instead.
function overActiveFace(x, y) {
  const r = faces[active].getBoundingClientRect();
  return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

// Show the resume bullet behind whichever stat the pointer is over
const statRows = [...document.querySelectorAll(".stats li")];
function updateStatHover(e) {
  const x = e.clientX;
  const y = e.clientY;
  const over =
    !pointer.dragging &&
    overActiveFace(x, y) &&
    statRows.find((li) => {
      if (!faces[active].contains(li)) return false;
      const r = li.getBoundingClientRect();
      return r.width > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
    });
  statRows.forEach((li) => {
    // hold the row's height so the swap doesn't shift the rows around under the pointer
    if (li === over && !li.classList.contains("is-open")) li.style.minHeight = `${li.offsetHeight}px`;
    li.classList.toggle("is-open", li === over);
  });
}
window.addEventListener("pointermove", updateStatHover);
document.addEventListener("pointerleave", () => statRows.forEach((li) => li.classList.remove("is-open")));

// Links on the side faces never receive the browser's own hit test (see overActiveFace),
// so find one under the pointer in the face's top layer and follow it ourselves.
function linkUnder(x, y) {
  return [...layers[active][shown[active]].querySelectorAll("a[href]")].find((a) => {
    const r = a.getBoundingClientRect();
    return r.width > 0 && x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
  });
}

stage.addEventListener("click", (e) => {
  if (e.target.closest("a, button")) return;
  if (!overActiveFace(e.clientX, e.clientY)) return;
  const link = linkUnder(e.clientX, e.clientY);
  if (!link) return advance(active);
  if (link.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) window.open(link.href, "_blank", "noopener");
  else location.assign(link.href);
});

document.querySelectorAll("[data-goto]").forEach((el) => {
  el.addEventListener("click", (e) => {
    e.preventDefault();
    goTo(+el.dataset.goto);
  });
});

document.addEventListener("keydown", (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const onControl = e.target.closest?.("a, button");
  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    e.preventDefault();
    goTo((active + 1) % faces.length);
  } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    goTo((active + faces.length - 1) % faces.length);
  } else if (/^[1-6]$/.test(e.key)) {
    goTo(+e.key - 1);
  } else if ((e.key === "Enter" || e.key === " ") && !onControl) {
    e.preventDefault();
    advance(active);
  }
});

/* ---------- Render loop ---------- */

let lastFrame = performance.now();
const t0 = lastFrame;

function frame(now) {
  const dt = Math.min(now - lastFrame, 50);
  lastFrame = now;

  if (mode === "inertia") {
    applyRotation(vel[0] * dt, vel[1] * dt);
    const decay = Math.exp(-dt / 300);
    vel = [vel[0] * decay, vel[1] * decay];
    if (Math.hypot(vel[0], vel[1]) < 0.0007) {
      mode = "snap";
      snapTarget = nearestFace(q);
    }
  } else if (mode === "snap") {
    const target = FACING[snapTarget];
    q = Q.slerp(q, target, 1 - Math.exp(-dt / (reducedMotion ? 50 : 130)));
    if (Q.angleBetween(q, target) < 0.002) {
      q = target.slice();
      mode = "idle";
      lockedActive = null;
    }
  }

  if (lockedActive === null) setActive(nearestFace(q));

  // display-only motion layered on top of the real orientation
  let bob = 0;
  let floatX = 0;
  let floatY = 0;
  if (!reducedMotion) {
    const k = 1 - Math.exp(-dt / 220);
    tilt.x += (tilt.tx - tilt.x) * k;
    tilt.y += (tilt.ty - tilt.y) * k;
    const t = (now - t0) / 1000;
    if (!pointer.dragging) {
      floatX = Math.sin(t * 0.9) * 0.03;
      floatY = Math.cos(t * 0.7) * 0.04;
      bob = Math.sin(t * 1.3) * 5;
    }
  }
  const wobble = Q.multiply(
    Q.fromAxisAngle(1, 0, 0, tilt.x + floatX),
    Q.fromAxisAngle(0, 1, 0, tilt.y + floatY)
  );
  const view = Q.multiply(wobble, q);
  cube.style.transform = `translateY(${bob.toFixed(2)}px) ${Q.toCSS(view)}`;
  shadow.style.setProperty("--shadow-scale", (1 - bob * 0.012).toFixed(3));
  shadow.style.setProperty("--shadow-opacity", (0.85 - bob * 0.02).toFixed(3));

  // simple Lambert shading so the block reads as a solid object
  NORMALS.forEach((n, i) => {
    const w = Q.rotateVector(view, n);
    const lambert = Math.max(0, w[0] * LIGHT[0] + w[1] * LIGHT[1] + w[2] * LIGHT[2]);
    faces[i].style.setProperty("--dark", ((1 - lambert) * 0.55).toFixed(3));
    glass[i].style.setProperty("--gloss", (0.04 + Math.pow(lambert, 3) * 0.22).toFixed(3));
  });

  requestAnimationFrame(frame);
}

/* ---------- Intro ---------- */

// The cube is already assembled and facing front; it only fades in. The page stays
// covered (see .is-loading) until fonts are in and the fade's start state is painted.
setActive(0);
requestAnimationFrame(frame);

if (!reducedMotion) {
  gsap.from(".scene", { y: 14, autoAlpha: 0, duration: 0.9, ease: "power3.out", lazy: false });
  gsap.from([".caption", ".strip", ".top"], { y: 12, autoAlpha: 0, duration: 0.8, stagger: 0.06, delay: 0.2, ease: "power3.out", lazy: false });
}

const uncover = () => requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.classList.remove("is-loading")));
Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(uncover);

/* ---------- Local time ---------- */

const clock = document.querySelector("[data-time]");
if (clock) {
  const fmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
  const tick = () => (clock.textContent = fmt.format(new Date()));
  tick();
  setInterval(tick, 15000);
}

/* ---------- Cursor ---------- */

if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
  const dot = Object.assign(document.createElement("div"), { className: "cursor cursor--dot" });
  const ring = Object.assign(document.createElement("div"), { className: "cursor cursor--ring" });
  document.body.append(ring, dot);
  document.body.classList.add("has-cursor");
  let mx = -100, my = -100, rx = -100, ry = -100;
  window.addEventListener("pointermove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    ring.classList.toggle("is-link", !!e.target.closest?.("a, button") || overActiveFace(e.clientX, e.clientY));
  });
  window.addEventListener("pointerdown", () => ring.classList.add("is-drag"));
  window.addEventListener("pointerup", () => ring.classList.remove("is-drag"));
  const follow = () => {
    rx += (mx - rx) * (reducedMotion ? 1 : 0.2);
    ry += (my - ry) * (reducedMotion ? 1 : 0.2);
    dot.style.transform = `translate(${mx}px, ${my}px)`;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(follow);
  };
  follow();
}

/* ---------- Theme ---------- */

const toggle = document.querySelector("[data-theme-toggle]");
const themeColor = document.querySelector('meta[name="theme-color"]');

function renderTheme() {
  const dark = document.documentElement.dataset.theme !== "light";
  toggle.setAttribute("aria-label", `Switch to ${dark ? "light" : "dark"} theme`);
  themeColor.content = dark ? "#000000" : "#ffffff";
}

toggle.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("theme", next);
  } catch {}
  renderTheme();
});
renderTheme();
