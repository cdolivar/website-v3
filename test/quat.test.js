import test from "node:test";
import assert from "node:assert/strict";
import * as Q from "../src/quat.js";

const close = (a, b, eps = 1e-9) => a.every((v, i) => Math.abs(v - b[i]) < eps);
const deg = Math.PI / 180;

test("identity leaves vectors unchanged", () => {
  assert.ok(close(Q.rotateVector(Q.identity(), [1, 2, 3]), [1, 2, 3]));
});

test("a 90° turn about y sends +z to +x (CSS axes)", () => {
  const q = Q.fromAxisAngle(0, 1, 0, 90 * deg);
  assert.ok(close(Q.rotateVector(q, [0, 0, 1]), [1, 0, 0]));
});

test("multiply composes rotations", () => {
  const q = Q.fromAxisAngle(0, 1, 0, 90 * deg);
  assert.ok(close(Q.multiply(q, q), Q.fromAxisAngle(0, 1, 0, 180 * deg)));
});

test("conjugate inverts a rotation", () => {
  const q = Q.fromAxisAngle(1, 1, 0, 70 * deg);
  const v = Q.rotateVector(Q.conjugate(q), Q.rotateVector(q, [0.3, -0.5, 0.8]));
  assert.ok(close(v, [0.3, -0.5, 0.8]));
});

test("normalize returns a unit quaternion", () => {
  assert.ok(Math.abs(Math.hypot(...Q.normalize([1, 2, 3, 4])) - 1) < 1e-12);
});

test("angleBetween measures rotation and ignores quaternion sign", () => {
  const q = Q.fromAxisAngle(0, 0, 1, 40 * deg);
  assert.ok(Math.abs(Q.angleBetween(Q.identity(), q) - 40 * deg) < 1e-9);
  assert.ok(Math.abs(Q.angleBetween(Q.identity(), q.map((v) => -v)) - 40 * deg) < 1e-9);
});

test("slerp hits its endpoints and midpoint", () => {
  const a = Q.identity();
  const b = Q.fromAxisAngle(0, 1, 0, 90 * deg);
  assert.ok(close(Q.slerp(a, b, 0), a));
  assert.ok(close(Q.slerp(a, b, 1), b));
  assert.ok(close(Q.slerp(a, b, 0.5), Q.fromAxisAngle(0, 1, 0, 45 * deg)));
});

test("toCSS emits an identity matrix3d for the identity rotation", () => {
  assert.equal(Q.toCSS(Q.identity()), "matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1)");
});
