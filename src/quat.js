// Minimal quaternion helpers. Quaternions are [x, y, z, w].
// Axes follow CSS: x right, y down, z toward the viewer.

export const identity = () => [0, 0, 0, 1];

export function fromAxisAngle(ax, ay, az, angle) {
  const len = Math.hypot(ax, ay, az) || 1;
  const s = Math.sin(angle / 2) / len;
  return [ax * s, ay * s, az * s, Math.cos(angle / 2)];
}

export function multiply(a, b) {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

export const conjugate = ([x, y, z, w]) => [-x, -y, -z, w];

export function normalize(q) {
  const l = Math.hypot(...q) || 1;
  return q.map((v) => v / l);
}

export const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];

// Angle in radians between two orientations
export const angleBetween = (a, b) => 2 * Math.acos(Math.min(1, Math.abs(dot(a, b))));

export function slerp(a, b, t) {
  let d = dot(a, b);
  let end = b;
  if (d < 0) {
    d = -d;
    end = b.map((v) => -v);
  }
  if (d > 0.9995) return normalize(a.map((v, i) => v + (end[i] - v) * t));
  const theta = Math.acos(d);
  const s = Math.sin(theta);
  const wa = Math.sin((1 - t) * theta) / s;
  const wb = Math.sin(t * theta) / s;
  return a.map((v, i) => v * wa + end[i] * wb);
}

export function rotateVector([x, y, z, w], [vx, vy, vz]) {
  // t = 2 (q.xyz × v);  v' = v + w t + q.xyz × t
  const tx = 2 * (y * vz - z * vy);
  const ty = 2 * (z * vx - x * vz);
  const tz = 2 * (x * vy - y * vx);
  return [
    vx + w * tx + (y * tz - z * ty),
    vy + w * ty + (z * tx - x * tz),
    vz + w * tz + (x * ty - y * tx),
  ];
}

export function toCSS([x, y, z, w]) {
  const m = [
    1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0,
    2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0,
    2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0,
    0, 0, 0, 1,
  ];
  return `matrix3d(${m.map((v) => +v.toFixed(6)).join(",")})`;
}
