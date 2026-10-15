// Motion helpers. Scenes work in seconds (t) relative to the scene start.
import { Easing } from 'remotion';

export const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const inv = (a: number, b: number, x: number) => (b === a ? (x >= b ? 1 : 0) : clamp((x - a) / (b - a)));

export type Ease = (x: number) => number;
export const E = {
  lin: (x: number) => x,
  io: Easing.bezier(0.65, 0, 0.35, 1),
  io2: Easing.bezier(0.45, 0, 0.55, 1),
  out: Easing.bezier(0.22, 1, 0.36, 1),
  in: Easing.bezier(0.55, 0, 1, 0.45),
  back: Easing.bezier(0.34, 1.56, 0.64, 1),
  backIn: Easing.bezier(0.36, 0, 0.66, -0.56),
  snap: Easing.bezier(0.2, 1.4, 0.4, 1),
};

/** eased 0→1 progress between t0 and t1 */
export const p = (t: number, t0: number, t1: number, e: Ease = E.io) => e(inv(t0, t1, t));
/** tween a value */
export const tw = (t: number, t0: number, t1: number, v0: number, v1: number, e: Ease = E.io) => lerp(v0, v1, p(t, t0, t1, e));
/** pop-in scale: 0 → 1 with overshoot */
export const pop = (t: number, t0: number, d = 0.4) => (t < t0 ? 0 : E.back(inv(t0, t0 + d, t)));
/** trapezoid visibility: fades in over fi after a, out over fo before b */
export const vis = (t: number, a: number, b = 1e9, fi = 0.3, fo = 0.3) =>
  Math.max(0, Math.min(fi > 0 ? inv(a, a + fi, t) : t >= a ? 1 : 0, fo > 0 ? 1 - inv(b - fo, b, t) : t < b ? 1 : 0));
/** smooth continuous wobble for idle life */
export const wob = (t: number, f = 0.5, a = 1, ph = 0) => Math.sin((t * f + ph) * Math.PI * 2) * a;

/** hop arc between two points (h > 0 is upward), u in 0..1 */
export const hop = (a: [number, number], b: [number, number], u: number, h = 80): [number, number] => [
  lerp(a[0], b[0], u),
  lerp(a[1], b[1], u) - Math.sin(Math.PI * u) * h,
];

export type Pt = [number, number];
/** point and heading at fraction u along a polyline (by length) */
export function along(pts: Pt[], u: number): { x: number; y: number; ang: number } {
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const d = clamp(u) * L[L.length - 1];
  let i = 1;
  while (i < pts.length - 1 && L[i] < d) i++;
  const k = (d - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
  const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
  return { x: lerp(x0, x1, k), y: lerp(y0, y1, k), ang: Math.atan2(y1 - y0, x1 - x0) };
}
export const polyLen = (pts: Pt[]) => pts.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
export const toPath = (pts: Pt[]) => pts.map((q, i) => `${i ? 'L' : 'M'}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(' ');

/** deterministic pseudo-random in [0,1) */
export const rnd = (n: number) => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

/** number of characters of `s` visible when typing at `cps` chars/s starting at t0 */
export const typed = (s: string, t: number, t0: number, cps = 18) => s.slice(0, Math.max(0, Math.floor((t - t0) * cps)));

/** blink: returns eyelid closure 0..1 for a character, deterministic per seed */
export const blink = (t: number, seed = 0) => {
  const period = 3.1 + rnd(seed) * 1.7;
  const ph = (t + rnd(seed + 9) * period) % period;
  return ph < 0.14 ? Math.sin((ph / 0.14) * Math.PI) : 0;
};

export type Move = { t0: number; t1: number; x: number; y: number; h?: number; n?: number; e?: Ease };
/**
 * A character's journey: starts at `start`, and each move carries it to (x, y) during [t0, t1]
 * in n hops of height h. Returns position, hop lift, squash and walking phase for the Packet.
 */
export function travel(start: Pt, moves: Move[], t: number) {
  let x = start[0], y = start[1], lift = 0, squash = 0, step = 0, face = 1, moving = false;
  for (const m of moves) {
    if (t < m.t0) break;
    const u = (m.e ?? E.io2)(inv(m.t0, m.t1, t));
    const n = m.n ?? Math.max(1, Math.round(Math.hypot(m.x - x, m.y - y) / 260));
    const h = m.h ?? 60;
    if (t < m.t1) {
      moving = true;
      face = m.x >= x ? 1 : -1;
      const k = (u * n) % 1;
      lift = Math.sin(Math.PI * k) * h;
      squash = k < 0.12 ? -0.6 : k > 0.88 ? 0.4 : -0.2;
      step = u * n;
      x = lerp(x, m.x, u);
      y = lerp(y, m.y, u);
      return { x, y, lift, squash, step, face, moving };
    }
    // just landed: a small squash
    const since = t - m.t1;
    squash = since < 0.18 ? Math.sin((since / 0.18) * Math.PI) * 0.7 : 0;
    x = m.x; y = m.y;
  }
  return { x, y, lift, squash, step, face, moving };
}
