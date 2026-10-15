// s21 Part 1 · Post-hoc or interpretable by design? (revision 2: one idea per slide, 20 slides, one per beat)
// 21.1 two routes, two columns         21.2 post-hoc: evidence = E(f, x)
// 21.3 to 21.8 saliency, worked on a constructed 3 x 3 image (D.saliency_toy):
//   21.3 the image and three classes   21.4 weights, s_k = sum_i W_ki x_i, the three scores
//   21.5 nudge the centre / a corner pixel by eps, every score moves     21.6 change / nudge = the gradient
//   21.7 one saliency map |W| per class 21.8 a deep network: backpropagation gives the gradient (Simonyan)
// 21.9 occlusion (real CLIP map)
// 21.10 limit 1 setup: trained vs layer-by-layer randomised network, each -> E -> explanation (Adebayo)
// 21.11 result: guided backprop maps barely change (edge detector); plain gradient / Grad-CAM change (pass)
// 21.12 limit 2 setup: two hospitals, pneumonia rate 34.2% vs 1.2% (reported), one detector trained on both (Zech)
// 21.13 the shortcut: corner marker, hospital identified 99.95%; hospital -> marker, hospital -> pneumonia rate
// 21.14 exposed, not fixed: heatmap lights the marker; AUC same hospitals vs new hospital; fix = new data
// 21.15 limit 3: the gull occlusion map + three questions (yellow bill? red spot? head shape?)
// 21.16 findings vs knobs: teal findings, a black box with no wingtip-colour knob; pointer to the CBM
// 21.17 ante-hoc examples              21.18 Rudin                              21.19 the CBM in words
// 21.20 the same line in symbols, aligned under the words.
// TCAV (formerly 21.5 to 21.10) now lives in the appendix scene s26 (S26.tsx).
// Slides replace each other: the old one fades out in the gap before a beat, the new one fades in on its first words.
import React from 'react';
import { C } from '../kit/theme';
import { E, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, ROLE, bs, be, bw, bh, clamp, inv, type SceneProps } from '../kit/core';
import { CREDIT, Credit, EvTag, Flow, MathSvg, PhotoR, Pill, Region, SensMap, Block, Cross, Person, fit, rgba, ux, vy, type Rect } from '../kit/cbm';
import { rnd } from '../kit/anim';
import { D } from '../kit/data';

const CL = D.clip;
const DROP: number[][] = CL.drop;
const NG: number = CL.grid;
const FC = ROLE.f; // task head / trained model colour (light grey)

// the hottest occlusion cell (the patch drawn on slide 9)
const HOT = (() => {
  let r0 = 0, c0 = 0;
  DROP.forEach((row, r) => row.forEach((v, c) => { if (v > DROP[r0][c0]) { r0 = r; c0 = c; } }));
  return { r: r0, c: c0 };
})();

// ------------------------------------------------------------------ helpers
/** one slide: a full-frame layer with its own opacity */
const Slide: React.FC<{ o: number; children?: React.ReactNode }> = ({ o, children }) =>
  o <= 0.001 ? null : <div style={{ position: 'absolute', inset: 0, opacity: o < 0.999 ? o : undefined }}>{children}</div>;

/** a small schematic heatmap glyph: a few blurred white blobs on a dark square (no model run) */
const HeatGlyph: React.FC<{ x: number; y: number; s: number; id: string; o?: number }> = ({ x, y, s, id, o = 1 }) => {
  if (o <= 0.001) return null;
  const u = s / 100;
  return (
    <g transform={`translate(${x} ${y})`} opacity={o < 0.999 ? o : undefined}>
      <defs>
        <filter id={id} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation={s * 0.07} /></filter>
        <clipPath id={`${id}-c`}><rect width={s} height={s} rx={10} /></clipPath>
      </defs>
      <rect width={s} height={s} rx={10} fill="#06080B" stroke={C.line2} strokeWidth={2} />
      <g clipPath={`url(#${id}-c)`} filter={`url(#${id})`}>
        <circle cx={32 * u} cy={36 * u} r={17 * u} fill={C.heat} opacity={0.9} />
        <circle cx={18 * u} cy={44 * u} r={10 * u} fill={C.heat} opacity={0.75} />
        <circle cx={64 * u} cy={62 * u} r={13 * u} fill={C.heat} opacity={0.4} />
      </g>
    </g>
  );
};

/** a schematic saliency map: a blurred edge-like outline of a bird (no model run); jit perturbs it slightly */
const SchemMap: React.FC<{ x: number; y: number; s: number; id: string; jit?: number; o?: number }> = ({ x, y, s, id, jit = 0, o = 1 }) => {
  if (o <= 0.001) return null;
  const j = (k: number) => (rnd(k + jit * 17) - 0.5) * jit * 6;
  const u = s / 100;
  const P = (px: number, py: number, k: number) => `${(px + j(k)) * u} ${(py + j(k + 50)) * u}`;
  const body = `M ${P(16, 44, 1)} Q ${P(26, 30, 2)} ${P(38, 36, 3)} Q ${P(62, 44, 4)} ${P(90, 46, 5)} Q ${P(70, 66, 6)} ${P(40, 64, 7)} Q ${P(26, 60, 8)} ${P(16, 44, 1)}`;
  const wing = `M ${P(44, 52, 9)} Q ${P(66, 50, 10)} ${P(88, 47, 11)}`;
  return (
    <g transform={`translate(${x} ${y})`} opacity={o < 0.999 ? o : undefined}>
      <defs>
        <filter id={id} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={s * 0.016} /></filter>
        <clipPath id={`${id}-c`}><rect width={s} height={s} rx={10} /></clipPath>
      </defs>
      <rect width={s} height={s} rx={10} fill="#06080B" stroke={C.line2} strokeWidth={2} />
      <g clipPath={`url(#${id}-c)`} filter={`url(#${id})`}>
        <path d={body} fill="none" stroke={C.heat} strokeWidth={s * 0.032} opacity={0.85} />
        <path d={wing} fill="none" stroke={C.heat} strokeWidth={s * 0.028} opacity={0.7} />
        <path d={`M ${P(16, 44, 12)} L ${P(6, 47, 13)}`} stroke={C.heat} strokeWidth={s * 0.028} opacity={0.8} />
        <circle cx={(24 + j(14)) * u} cy={(39 + j(15)) * u} r={s * 0.05} fill={C.heat} opacity={0.55} />
        {Array.from({ length: 14 }, (_, k) => (
          <circle key={k} cx={(10 + rnd(k * 3.1 + jit) * 80) * u} cy={(18 + rnd(k * 7.7 + jit) * 64) * u} r={s * 0.011} fill={C.heat} opacity={0.35} />
        ))}
      </g>
    </g>
  );
};

/** a plain arrow with a filled head (x1,y1) -> (x2,y2), drawn on with p */
const Arr: React.FC<{ x1: number; y1: number; x2: number; y2: number; color?: string; sw?: number; p?: number; o?: number; head?: number }> = ({
  x1, y1, x2, y2, color = C.chalk2, sw = 3.5, p = 1, o = 1, head = 16,
}) => {
  if (o <= 0.001 || p <= 0.001) return null;
  const xe = x1 + (x2 - x1) * p, ye = y1 + (y2 - y1) * p;
  const a = Math.atan2(ye - y1, xe - x1);
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <line x1={x1} y1={y1} x2={xe - Math.cos(a) * head * 0.6} y2={ye - Math.sin(a) * head * 0.6} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <path d={`M ${xe} ${ye} L ${xe - head * Math.cos(a - 0.42)} ${ye - head * Math.sin(a - 0.42)} L ${xe - head * Math.cos(a + 0.42)} ${ye - head * Math.sin(a + 0.42)} Z`} fill={color} />
    </g>
  );
};

// ------------------------------------------------------------------ fixed illustrative data
// 21.8: a 6 x 6 saliency map (illustrative values in 0..1)
const SAL: number[][] = Array.from({ length: 6 }, (_, r) => Array.from({ length: 6 }, (_, c) =>
  clamp(Math.exp(-((r - 2) ** 2 + (c - 1.5) ** 2) / 2.2) + 0.45 * Math.exp(-((r - 3.6) ** 2 + (c - 4.2) ** 2) / 1.4) + 0.06 * rnd(r * 6 + c))));


// 21.3 to 21.7: the constructed 3 x 3 saliency example (D.saliency_toy): a linear model, score_k = sum_i W_ki x_i
const ST = D.saliency_toy;
const TCL: string[] = ST.classes; // vertical bar, horizontal bar, dot
const IMG: number[][] = ST.image;
const WK: number[][][] = TCL.map((k) => ST.W[k]);
const SCORE: number[] = TCL.map((k) => ST.scores[k]);
const EPS: number = ST.eps;
const DC: number[] = TCL.map((k) => ST.nudge_centre[k]); // score changes when the centre pixel rises by EPS
const DK: number[] = TCL.map((k) => ST.nudge_corner[k]); // ... when a corner pixel rises by EPS
const SALT: number[][][] = TCL.map((k) => ST.saliency[k]);
const WIN = SCORE.indexOf(Math.max(...SCORE));
const CORNER = { r: 0, c: 0 }; // the nudged corner pixel (any corner gives the same deltas)
const TOYTAG = 'a 3 × 3 teaching example';
/** a number as written on the board: no trailing zeros; txt uses a true minus sign, tex a plain one */
const fm = (v: number) => String(parseFloat(v.toFixed(3)));
const fmt = (v: number) => fm(v).replace('-', '−');
const sgn = (v: number) => (v > 0 ? '+' : '') + fmt(v);

/** a 3 x 3 image: lit pixels in input blue, dark pixels near black, the pixel value small in each cell.
 *  lift brightens chosen cells (a nudge); ring outlines them */
const PixGrid: React.FC<{
  x: number; y: number; cell: number; img: number[][]; o?: number; lit?: number; vals?: number;
  lift?: { r: number; c: number; a: number }[];
}> = ({ x, y, cell, img, o = 1, lit = 1, vals = 1, lift = [] }) => {
  if (o <= 0.001) return null;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      {img.map((row, r) => row.map((v, c) => {
        const up = lift.filter((q) => q.r === r && q.c === c).reduce((s, q) => s + q.a, 0);
        return (
          <g key={`${r}-${c}`}>
            <rect x={x + c * cell} y={y + r * cell} width={cell} height={cell} fill="#080B0F" />
            <rect x={x + c * cell} y={y + r * cell} width={cell} height={cell} fill={C.input} opacity={clamp(0.88 * v * lit + 0.35 * up)} />
            <Txt x={x + c * cell + cell - 12} y={y + r * cell + cell - 16} size={Math.max(20, cell * 0.17)} anchor="end" mono
              fill={v * lit > 0.5 ? '#0B1220' : C.mute} o={vals}>{fm(v)}</Txt>
          </g>
        );
      }))}
      {Array.from({ length: 4 }, (_, i) => (
        <g key={i}>
          <line x1={x + i * cell} x2={x + i * cell} y1={y} y2={y + 3 * cell} stroke={C.line2} strokeWidth={2} />
          <line y1={y + i * cell} y2={y + i * cell} x1={x} x2={x + 3 * cell} stroke={C.line2} strokeWidth={2} />
        </g>
      ))}
    </g>
  );
};

/** a 3 x 3 weight grid of one class: signed numbers, positive cells shaded in the head colour, negative cells dark */
const WGrid: React.FC<{ x: number; y: number; cell: number; W: number[][]; o?: number; ring?: number }> = ({ x, y, cell, W, o = 1, ring = 0 }) => {
  if (o <= 0.001) return null;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      {W.map((row, r) => row.map((v, c) => (
        <g key={`${r}-${c}`}>
          <rect x={x + c * cell} y={y + r * cell} width={cell} height={cell} fill={v > 0 ? rgba(FC, 0.2 + 0.25 * Math.min(1, v / 2)) : '#080B0F'}
            stroke={C.line2} strokeWidth={1.5} />
          <Txt x={x + c * cell + cell / 2} y={y + r * cell + cell / 2} size={Math.min(cell * 0.3, 22)} mono weight={v > 0 ? 700 : 500}
            fill={v > 0 ? C.chalk : C.mute}>{fmt(v)}</Txt>
        </g>
      )))}
      {/* the lit pixels of the image (its middle column) */}
      <rect x={x + cell} y={y} width={cell} height={3 * cell} fill="none" stroke={C.input} strokeWidth={4} opacity={ring} />
    </g>
  );
};

/** a 3 x 3 saliency map: white luminance on dark (scaled to the map's largest value), values small */
const SalGrid: React.FC<{ x: number; y: number; cell: number; S: number[][]; o?: number; p?: number }> = ({ x, y, cell, S, o = 1, p = 1 }) => {
  if (o <= 0.001) return null;
  const mx = Math.max(...S.flat());
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <rect x={x} y={y} width={3 * cell} height={3 * cell} fill="#06080B" />
      {S.map((row, r) => row.map((v, c) => (
        <g key={`${r}-${c}`}>
          <rect x={x + c * cell} y={y + r * cell} width={cell} height={cell} fill={C.heat} opacity={0.92 * (v / mx) * p} />
          <Txt x={x + c * cell + cell / 2} y={y + r * cell + cell / 2} size={24} mono fill={v / mx > 0.55 ? '#0B1220' : C.chalk2} o={p}>{fmt(v)}</Txt>
        </g>
      )))}
      {Array.from({ length: 4 }, (_, i) => (
        <g key={i}>
          <line x1={x + i * cell} x2={x + i * cell} y1={y} y2={y + 3 * cell} stroke={C.line2} strokeWidth={2} />
          <line y1={y + i * cell} y2={y + i * cell} x1={x} x2={x + 3 * cell} stroke={C.line2} strokeWidth={2} />
        </g>
      ))}
    </g>
  );
};

// 21.4: score table (rows = classes); 21.5: score bars with nudge arrows
const T4 = { x: [160, 505, 850], gy: 370, cell: 88, k: 64 };
const T5 = { gx: 200, gy: 380, cell: 120, lab: 1000, bx: 1030, k: 180, y: [430, 580, 730] };
const T7 = { cell: 110, x: [285, 795, 1305], y: 400 };
const PH8: Rect = { x: 200, y: 320, w: 240, h: 240 };
const NET8 = { x: 760, y: 440 };

/** an opaque network: a dark box with a faint, slowly shimmering inner texture (as in s01) */
const ClipBox: React.FC<{ x: number; y: number; w: number; h: number; t: number; o?: number }> = ({ x, y, w, h, t, o = 1 }) => {
  if (o <= 0.001) return null;
  const nx = Math.max(4, Math.round(w / 27)), ny = Math.max(4, Math.round(h / 27));
  const dots = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const k = i * ny + j;
    const a = 0.06 + 0.16 * Math.abs(Math.sin(t * (0.35 + rnd(k) * 0.5) + rnd(k + 50) * 6));
    dots.push(<circle key={k} cx={x - w / 2 + ((i + 0.5) / nx) * w} cy={y - h / 2 + ((j + 0.5) / ny) * h} r={3} fill={C.input} opacity={a} />);
  }
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={16} fill="#05070A" stroke={C.input} strokeWidth={3} />
      {dots}
    </g>
  );
};

// ------------------------------------------------------------------ 21.10 to 21.16: the limits
/** a small schematic network: 4 columns of 4 nodes. R (0..3) randomises its 3 weight layers from the output end
 *  (the cascading randomisation of Adebayo et al.): a randomised layer is drawn dashed with scrambled strengths. */
const NetGlyph: React.FC<{ x: number; y: number; R?: number; o?: number; seed?: number }> = ({ x, y, R = 0, o = 1, seed = 3 }) => {
  if (o <= 0.001) return null;
  const cx = [-105, -35, 35, 105], cy = [-54, -18, 18, 54];
  const edges = [];
  for (let l = 0; l < 3; l++) {
    const r = clamp(R - (2 - l));
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
      const k = l * 16 + i * 4 + j;
      const a0 = 0.12 + 0.6 * rnd(seed + k * 1.31), a1 = 0.1 + 0.55 * rnd(seed + 400 + k * 2.17);
      const p = { x1: x + cx[l], y1: y + cy[i], x2: x + cx[l + 1], y2: y + cy[j] };
      if (r < 0.999) edges.push(<line key={`t${k}`} {...p} stroke="#9AA6B5" strokeWidth={2.5} opacity={a0 * (1 - r)} />);
      if (r > 0.001) edges.push(<line key={`r${k}`} {...p} stroke={C.chalk2} strokeWidth={2.5} strokeDasharray="3 6" opacity={a1 * r} />);
    }
  }
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <rect x={x - 150} y={y - 85} width={300} height={170} rx={16} fill={C.headFill} stroke="#8792A2" strokeWidth={3} />
      {edges}
      {cx.map((ax) => cy.map((ay) => <circle key={`${ax}-${ay}`} cx={x + ax} cy={y + ay} r={9} fill={C.bg3} stroke="#9AA6B5" strokeWidth={2.5} />))}
    </g>
  );
};

/** a schematic map with no structure: scattered speckle (what a map of a randomised model should look like) */
const NoiseGlyph: React.FC<{ x: number; y: number; s: number; id: string; o?: number }> = ({ x, y, s, id, o = 1 }) => {
  if (o <= 0.001) return null;
  return (
    <g transform={`translate(${x} ${y})`} opacity={o < 0.999 ? o : undefined}>
      <defs>
        <filter id={id} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation={s * 0.012} /></filter>
        <clipPath id={`${id}-c`}><rect width={s} height={s} rx={10} /></clipPath>
      </defs>
      <rect width={s} height={s} rx={10} fill="#06080B" stroke={C.line2} strokeWidth={2} />
      <g clipPath={`url(#${id}-c)`} filter={`url(#${id})`}>
        {Array.from({ length: 70 }, (_, k) => (
          <circle key={k} cx={s * (0.04 + 0.92 * rnd(k * 2.3 + 9))} cy={s * (0.04 + 0.92 * rnd(k * 5.1 + 2))} r={s * (0.01 + 0.018 * rnd(k * 1.9))}
            fill={C.heat} opacity={0.25 + 0.45 * rnd(k * 3.7)} />
        ))}
      </g>
    </g>
  );
};

/** a tick mark (drawn on with p) */
const Tick: React.FC<{ x: number; y: number; s?: number; p?: number; o?: number; color?: string }> = ({ x, y, s = 1, p = 1, o = 1, color = C.good }) =>
  o <= 0.001 || p <= 0.001 ? null : (
    <path d={`M ${x - 14 * s} ${y} L ${x - 4 * s} ${y + 11 * s} L ${x + 16 * s} ${y - 13 * s}`} fill="none" stroke={color} strokeWidth={6 * s}
      strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={p < 0.999 ? `${p} 1` : undefined} opacity={o < 0.999 ? o : undefined} />
  );

/** a hospital building glyph centred on (x, y) */
const Hospital: React.FC<{ x: number; y: number; o?: number }> = ({ x, y, o = 1 }) =>
  o <= 0.001 ? null : (
    <g transform={`translate(${x} ${y})`} opacity={o < 0.999 ? o : undefined} stroke={C.chalk2} strokeWidth={3}>
      <rect x={-62} y={-26} width={124} height={76} rx={5} fill={C.bg3} />
      <rect x={-30} y={-64} width={60} height={40} rx={4} fill={C.bg3} />
      <rect x={-5} y={-58} width={10} height={28} fill={C.chalk} stroke="none" />
      <rect x={-14} y={-49} width={28} height={10} fill={C.chalk} stroke="none" />
      {[-44, -22, 14, 36].map((wx) => <rect key={wx} x={wx} y={-12} width={10} height={12} fill={C.line2} stroke="none" />)}
      <rect x={-12} y={18} width={24} height={32} fill={C.line2} stroke="none" />
    </g>
  );

/** an edit knob (amber, dashed: a control the model does not have); v 0..1 turns it from "grey" to "black" */
const Knob: React.FC<{ x: number; y: number; r?: number; v?: number; o?: number }> = ({ x, y, r = 52, v = 0, o = 1 }) => {
  if (o <= 0.001) return null;
  const a = (-150 + 120 * v) * (Math.PI / 180);
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <circle cx={x} cy={y} r={r} fill={C.bg3} stroke={C.edit} strokeWidth={3.5} strokeDasharray="9 7" />
      <line x1={x} y1={y} x2={x + Math.cos(a) * r * 0.78} y2={y + Math.sin(a) * r * 0.78} stroke={C.edit} strokeWidth={6} strokeLinecap="round" />
      <circle cx={x} cy={y} r={7} fill={C.edit} />
      <Txt x={x - r - 12} y={y - r + 6} size={24} fill={C.chalk2} anchor="end">grey</Txt>
      <Txt x={x + r + 12} y={y - r + 6} size={24} fill={C.chalk2} anchor="start">black</Txt>
    </g>
  );
};

// Zech et al. 2018 (PLOS Medicine), reported values that are shown but not spoken (D.lit.zech holds the spoken ones)
const ZR = { prevMSH: 34.2, prevNIH: 1.2, nMSH: 42396, nNIH: 112120 };
const ZE = D.lit.zech;
const TOKEN = [0.857, 0.062, 0.085, 0.13]; // the corner marker on the X-ray (normalized cx, cy, w, h)
// 21.12 rows (hospital A = Mount Sinai, B = NIH), bar scale in px per percentage point
const R12 = [440, 700], BAR12 = { x: 640, k: 13 };
// 21.13 / 21.14 X-ray frames
const XR13: Rect = fit('chest.jpg', 180, 330, 500);
const XR14: Rect = fit('chest.jpg', 180, 330, 520);
// 21.15 the gull with its occlusion map; question points (normalized) for head shape, yellow bill, red spot
const PH15: Rect = { x: 700, y: 300, w: 540, h: 540 };
const Q15 = [
  { text: 'head shape?', u: 0.3, v: 0.215, y: 380 },
  { text: 'yellow bill?', u: 0.19, v: 0.285, y: 480 },
  { text: 'red spot?', u: 0.105, v: 0.306, y: 580 },
];

// 21.17: the decision tree
const TREE = {
  root: { x: 880, y: 445, text: 'wingtip black?' },
  leafL: { x: 790, y: 580, a: 'glaucous', b: 'gull' },
  node: { x: 1060, y: 575, text: 'back dark?' },
  leafA: { x: 975, y: 700, a: 'herring', b: 'gull' },
  leafB: { x: 1140, y: 700, a: 'black-', b: 'backed' },
};

// geometry
const PH2: Rect = { x: 200, y: 330, w: 170, h: 170 };
const PH9: Rect = { x: 200, y: 300, w: 540, h: 540 };
const COLS = [520, 960, 1400]; // 21.19 / 21.20 columns: photo, concepts, answer
const ROWW = 430, ROWS = 575;

export const S21: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const e = (k: number) => be(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.5) => inv(x, x + d, t);
  const NB = P.beats.length;
  /** slide k: fades in on the beat's first words, fades out (0.3 s) just before the next beat */
  const sl = (k: number) => inv(b(k) - 0.05, b(k) + 0.25, t) * (k < NB ? 1 - inv(b(k + 1) - 0.35, b(k + 1) - 0.05, t) : 1);
  void e;

  // ---------------- 21.1
  const c1L = at(w(1, 'train') - 0.1), c1Lt = at(w(1, 'posthoc') - 0.1), c1R = at(w(1, 'build') - 0.1), c1Rt = at(w(1, 'antehoc') - 0.1);
  const c1Rs = at(w(1, 'interpretable') - 0.1);
  const c1Lp = E.io(inv(w(1, 'explain'), w(1, 'explain') + 0.9, t));

  // ---------------- 21.2
  const s2f = at(w(2, 'model') - 0.1), s2x = at(w(2, 'input') - 0.2), s2E = at(w(2, 'explanation') - 0.1);
  const s2a = E.io(inv(w(2, 'takes'), w(2, 'takes') + 0.8, t));
  const s2ev = at(w(2, 'evidence') - 0.2), s2eq = at(w(2, 'evidence') + 0.2, 0.6);


  // ---------------- 21.3 the 3 x 3 image and three classes
  const t3g = at(b(3) - 0.05, 0.3), t3bar = E.io(inv(w(3, 'vertical') - 0.1, w(3, 'vertical') + 0.7, t));
  const t3m = at(w(3, 'model') - 0.1), t3a = E.io(inv(w(3, 'model') - 0.1, w(3, 'model') + 0.6, t));
  const t3c = [at(w(3, 'vertical', 1) - 0.1), at(w(3, 'horizontal') - 0.1), at(w(3, 'dot') - 0.1)];
  const t3in = at(w(3, 'three') - 0.1);

  // ---------------- 21.4 weights, the weighted sum, the scores
  const t4l = at(b(4) - 0.05, 0.3);
  const t4g = [0, 1, 2].map((i) => at(w(4, 'weights') - 0.3 + i * 0.25, 0.4));
  const t4wd = at(w(4, 'weighted') - 0.1), t4ring = at(w(4, 'pixels') - 0.1), t4eq = at(w(4, 'pixels') + 0.5, 0.6);
  const t4s = [w(4, 'scores'), w(4, 'horizontal'), w(4, 'dot')].map((x) => E.out(inv(x - 0.1, x + 0.7, t)));
  const t4win = E.io(inv(w(4, 'says') - 0.1, w(4, 'says') + 0.5, t));

  // ---------------- 21.5 the nudge: centre pixel, then a corner pixel
  const t5ctx = at(b(5) - 0.05, 0.3);
  const t5k = inv(w(5, 'Brighten', 1) - 0.1, w(5, 'Brighten', 1) + 0.4, t); // switch from the centre to the corner
  const t5c = at(w(5, 'centre') - 0.1) * (1 - t5k), t5cv = at(w(5, '0.1') - 0.1) * (1 - t5k);
  const t5d = [at(w(5, 'rise') - 0.1), at(w(5, 'rise') + 0.1), at(w(5, '0.2') - 0.3)].map((v) => E.out(v) * (1 - t5k));
  const t5kc = at(w(5, 'corner') - 0.1), t5kd = E.out(at(w(5, 'falls') - 0.1));

  // ---------------- 21.6 the gradient
  const t6wd = at(w(6, 'Divide') - 0.1), t6eq = at(w(6, 'gradient') - 0.1, 0.6);
  const t6r = [at(w(6, '1') - 0.1), at(w(6, '2') - 0.1), at(w(6, 'minus') - 0.1)];
  const t6s = at(w(6, 'saliency') - 0.1);

  // ---------------- 21.7 one saliency map per class
  const t7f = at(b(7) - 0.05, 0.3);
  const t7m = [at(w(7, 'vertical') - 0.1, 0.6), at(w(7, 'horizontal') - 0.1, 0.6), at(w(7, 'dot') - 0.1, 0.6)];
  const t7l = at(w(7, 'always') - 0.1);

  // ---------------- 21.8 a deep network: backpropagation
  const t8ph = at(b(8) - 0.05, 0.3), t8n = at(w(8, 'deep') - 0.1), t8a = E.io(inv(w(8, 'deep') - 0.1, w(8, 'deep') + 0.6, t));
  const t8s = at(w(8, 'score') - 0.1), t8ch = at(w(8, 'changes') - 0.1);
  const t8bp = E.io(inv(w(8, 'Backpropagation') - 0.1, w(8, 'Backpropagation') + 1.0, t));
  const t8map = inv(w(8, 'every') - 0.1, w(8, 'every') + 1.0, t);
  const t8wd = at(w(8, 'one') - 0.1), t8eq = at(w(8, 'Simonyan') - 0.1, 0.6);

  // ---------------- 21.9
  const s9ph = at(b(9) - 0.05, 0.3);
  const s9patch = at(w(9, 'Grey') - 0.1, 0.4);
  const s9map = inv(w(9, 'occlusion') - 0.3, w(9, 'occlusion') + 1.2, t);
  const s9w = at(w(9, 'measure') - 0.1), s9eq = at(w(9, 'drops') - 0.1, 0.6);


  // ---------------- 21.10 limit 1 setup
  const s10n1 = at(w(10, 'sanity') - 0.1), s10e1 = E.io(inv(w(10, 'explanation') - 0.1, w(10, 'explanation') + 0.8, t));
  const s10pr = at(w(10, 'should') - 0.1);
  const s10n2 = at(w(10, 'Adebayo') - 0.1), s10l2 = at(w(10, 'randomising') - 0.1);
  const s10R = 3 * E.io(inv(w(10, 'randomising'), w(10, 'nothing'), t));
  const s10e2 = E.io(inv(w(10, 'nothing') - 0.3, w(10, 'nothing') + 0.5, t));

  // ---------------- 21.11 result
  const s11a = at(w(11, 'guided') - 0.1, 0.6), s11b = at(w(11, 'randomised') - 0.1, 0.6), s11eq = at(w(11, 'randomised') + 0.4);
  const s11edge = at(w(11, 'edges') - 0.1), s11pan = at(w(11, 'Plain') - 0.1, 0.6);
  const s11pass = E.io(inv(w(11, 'pass') - 0.1, w(11, 'pass') + 0.5, t));

  // ---------------- 21.12 limit 2 setup
  const s12det = at(w(12, 'pneumonia') - 0.1), s12hA = at(w(12, 'chest') - 0.1), s12hB = at(w(12, 'two') - 0.1);
  const s12br = E.io(inv(w(12, 'systems') - 0.1, w(12, 'systems') + 0.6, t));
  const s12bA = E.out(inv(w(12, 'third') - 0.1, w(12, 'third') + 0.9, t)), s12bB = E.out(inv(w(12, 'other') - 0.1, w(12, 'other') + 0.9, t));

  // ---------------- 21.13 the shortcut
  const s13x = at(b(13) - 0.05, 0.3), s13q = at(w(13, 'which') - 0.1), s13pc = at(w(13, 'almost') - 0.1);
  const s13m = E.io(inv(w(13, 'markers') - 0.1, w(13, 'markers') + 0.6, t));
  const s13hm = E.io(inv(w(13, 'markers') + 0.2, w(13, 'markers') + 0.9, t));
  const s13hp = E.io(inv(w(13, 'predicts') - 0.1, w(13, 'predicts') + 0.7, t));
  const s13sc = E.io(inv(w(13, 'detector') - 0.1, w(13, 'detector') + 0.7, t)), s13end = at(w(13, 'shortcut') - 0.3);

  // ---------------- 21.14 exposed, not fixed
  const s14x = at(b(14) - 0.05, 0.3), s14heat = inv(w(14, 'light') - 0.1, w(14, 'light') + 0.9, t);
  const s14ok = E.io(inv(w(14, 'expose') - 0.1, w(14, 'expose') + 0.5, t)), s14no = inv(w(14, 'cannot') - 0.1, w(14, 'cannot') + 0.6, t);
  const s14b1 = E.out(inv(w(14, 'On') - 0.1, w(14, 'On') + 0.8, t)), s14b2 = E.out(inv(w(14, 'worse') - 0.4, w(14, 'worse') + 0.6, t));
  const s14fix = at(w(14, 'fix') - 0.1);

  // ---------------- 21.15 limit 3
  const s15ph = at(w(15, 'heatmap') - 0.1, 0.5), s15map = inv(w(15, 'heatmap'), w(15, 'heatmap') + 1.0, t);
  const s15wh = E.io(inv(w(15, 'where') - 0.1, w(15, 'where') + 0.5, t)), s15wt = at(w(15, 'what') - 0.1);
  const s15q = [at(w(15, 'head') - 0.1), at(w(15, 'yellow') - 0.1), at(w(15, 'red') - 0.1)];

  // ---------------- 21.16 findings vs knobs
  const s16f = at(w(16, 'findings') - 0.1), s16c = [at(w(16, 'narrowed') - 0.1, 0.4), at(w(16, 'bone') - 0.1, 0.4), at(w(16, 'black') - 0.1, 0.4)];
  const s16box = at(w(16, 'Even') - 0.1), s16p = at(w(16, 'expert') - 0.1), s16arr = E.io(inv(w(16, 'mistake') - 0.2, w(16, 'mistake') + 0.7, t));
  const s16no = at(w(16, 'named', 1) - 0.1), s16k = at(w(16, 'setting') - 0.1), s16kv = E.io(inv(w(16, 'switch'), w(16, 'black', 1) + 0.3, t));
  const s16x = inv(w(16, 'colour') + 0.1, w(16, 'colour') + 0.7, t), s16fw = at(w(16, 'switch') - 0.1);

  // ---------------- 21.17
  const s17fr = at(w(17, 'computed') - 0.1, 0.6);
  const s17a = at(w(17, 'sparse') - 0.1, 0.6), s17b = at(w(17, 'decision') - 0.1, 0.6), s17c = at(w(17, 'Prototype') - 0.1, 0.6);

  // ---------------- 21.18
  const s18q = at(w(18, 'high') - 0.3, 0.7), s18c = at(w(18, 'over') - 0.1, 0.6);

  // ---------------- 21.19 / 21.20 (the words row stays from 21.19 into 21.20)
  const rowO = inv(b(19) - 0.05, b(19) + 0.25, t);
  const r19 = [at(w(19, 'photo') - 0.1), at(w(19, 'concepts') - 0.1), at(w(19, 'answer') - 0.1)];
  const r20a = [at(w(19, 'concepts') - 0.3), at(w(19, 'answer') - 0.3)];
  const s19vis = 1 - inv(b(20) - 0.35, b(20) - 0.05, t);
  const s19al = at(w(19, 'alone') - 0.6);
  const s20 = [at(w(20, 'x') - 0.1), at(w(20, 'c') - 0.1), at(w(20, 'y') - 0.1)];
  const s20g = E.io(inv(w(20, 'predictor') - 0.2, w(20, 'predictor') + 0.6, t)), s20f = E.io(inv(w(20, 'task') - 0.2, w(20, 'task') + 0.6, t));

  return (
    <Stage>
      <Header t={t} part={1} title={P.title} />

      {/* ============================================================ 21.1 two routes */}
      <Slide o={sl(1)}>
        <SlideHead text={bh(P, 1)} />
        <Svg>
          <line x1={960} x2={960} y1={340} y2={880} stroke={C.line} strokeWidth={2} opacity={at(b(1), 0.5)} />
          {/* post-hoc: trained model -> explanation method -> heatmap */}
          <g opacity={c1L < 0.999 ? c1L : undefined}>
            <Block x={300} y={640} w={210} h={130} kind="head"><Txt x={0} y={-17} size={28} weight={600}>trained</Txt><Txt x={0} y={19} size={28} weight={600}>model</Txt></Block>
          </g>
          <Arr x1={410} y1={640} x2={478} y2={640} p={c1Lp} />
          <g opacity={c1Lp < 0.999 ? c1Lp : undefined}>
            <Block x={600} y={640} w={230} h={130} kind="neutral"><Txt x={0} y={-17} size={28} weight={600}>explanation</Txt><Txt x={0} y={19} size={28} weight={600}>method</Txt></Block>
          </g>
          <Arr x1={720} y1={640} x2={772} y2={640} p={inv(0.5, 1, c1Lp)} />
          <HeatGlyph x={782} y={580} s={120} id="s21g1" o={inv(0.6, 1, c1Lp)} />
          <Txt x={842} y={732} size={26} fill={C.chalk2} o={inv(0.6, 1, c1Lp)}>heatmap</Txt>
          {/* ante-hoc: a model whose middle is a column of named values -> answer */}
          <g opacity={c1R < 0.999 ? c1R : undefined}>
            <rect x={1080} y={500} width={300} height={280} rx={18} fill={C.headFill} stroke="#8792A2" strokeWidth={3} />
            {['wingtip black', 'bill pointed', 'head white'].map((s, i) => (
              <g key={s}>
                <Txt x={1104} y={560 + i * 80} size={24} anchor="start" fill={C.concept} weight={600}>{s}</Txt>
                <rect x={1104} y={580 + i * 80} width={250} height={10} rx={5} fill={C.bg3} />
                <rect x={1104} y={580 + i * 80} width={250 * [0.9, 0.7, 0.95][i]} height={10} rx={5} fill={C.concept} />
              </g>
            ))}
            <Arr x1={1396} y1={640} x2={1470} y2={640} color={C.chalk} />
            <Txt x={1486} y={640} size={34} weight={700} anchor="start">answer</Txt>
          </g>
        </Svg>
        <Rich x={560} y={380} ax="center" ay="middle" size={40} weight={650} text="post-hoc" o={c1Lt} />
        <Rich x={560} y={436} ax="center" ay="middle" size={30} color={C.chalk2} text="explain it afterwards" o={c1Lt} />
        <Rich x={1360} y={380} ax="center" ay="middle" size={40} weight={650} text="ante-hoc" o={c1Rt} />
        <Rich x={1360} y={436} ax="center" ay="middle" size={30} color={C.chalk2} text="interpretable by design" o={c1Rs} />
      </Slide>

      {/* ============================================================ 21.2 post-hoc */}
      <Slide o={sl(2)}>
        <SlideHead text={bh(P, 2)} />
        <PhotoR R={PH2} src="gull.jpg" o={s2x} border={C.input} />
        <Credit x={PH2.x} y={PH2.y + PH2.h + 8} text={CREDIT['gull.jpg']} o={s2x} />
        <Svg>
          <g opacity={s2f < 0.999 ? s2f : undefined}>
            <Block x={285} y={650} w={170} h={110} kind="head" />
            <MathSvg x={285} y={650} tex="\chead{f}" size={56} />
          </g>
          <g opacity={s2E < 0.999 ? s2E : undefined}>
            <Block x={830} y={520} w={220} h={140} kind="neutral" />
            <MathSvg x={830} y={520} tex="E" size={60} />
          </g>
          <Arr x1={385} y1={415} x2={710} y2={492} color={C.input} p={s2a} />
          <Arr x1={385} y1={645} x2={710} y2={548} color={FC} p={s2a} />
          <Arr x1={950} y1={520} x2={1060} y2={520} p={inv(0.5, 1, s2a)} />
          <HeatGlyph x={1075} y={450} s={140} id="s21g2" o={s2ev} />
        </Svg>
        <Rich x={390} y={340} size={32} text="{x:input} $\cin{x}$" o={s2x} />
        <Rich x={285} y={720} ax="center" size={32} text="{f:trained model} $\chead{f}$" o={s2f} />
        <Rich x={830} y={605} ax="center" size={32} text="explanation method $E$" o={s2E} />
        <Rich x={1145} y={605} ax="center" size={32} text="evidence" o={s2ev} />
        <Tex x={960} y={850} ax="center" size={56} tex="\text{evidence} = E(\chead{f}, \cin{x})" o={s2eq} />
      </Slide>

{/* ============================================================ 21.3 the 3 x 3 image, three classes */}
      <Slide o={sl(3)}>
        <SlideHead text={bh(P, 3)} />
        <Svg>
          <PixGrid x={300} y={340} cell={140} img={IMG} o={t3g} lit={t3bar} vals={t3bar} />
          <Arr x1={750} y1={550} x2={880} y2={550} color={C.input} p={t3a} />
          <g opacity={t3m < 0.999 ? t3m : undefined}>
            <Block x={1010} y={550} w={220} h={130} kind="head"><Txt x={0} y={0} size={32} weight={600}>model</Txt></Block>
          </g>
          {TCL.map((k, i) => <Arr key={k} x1={1130} y1={550} x2={1262} y2={430 + i * 120} color={C.chalk2} p={E.io(t3c[i])} />)}
        </Svg>
        {TCL.map((k, i) => <Rich key={k} x={1290} y={430 + i * 120} ay="middle" size={38} weight={650} text={`{y:${k}}`} o={t3c[i]} />)}
        <Rich x={510} y={790} ax="center" size={32} text="{x:image} $\cin{x}$: 3 × 3 pixels" o={t3in} />
        <EvTag x={300} y={872} kind="constructed" text={TOYTAG} o={t3in} />
      </Slide>

      {/* ============================================================ 21.4 weights and scores */}
      <Slide o={sl(4)}>
        <SlideHead text={bh(P, 4)} />
        <Svg>
          {TCL.map((k, i) => {
            const x0 = T4.x[i], len = T4.k * SCORE[i] * t4s[i], yb = T4.gy + 3 * T4.cell + 62;
            return (
              <g key={k}>
                <Txt x={x0 + 1.5 * T4.cell} y={T4.gy - 38} size={32} weight={650} o={t4l}>{k}</Txt>
                <WGrid x={x0} y={T4.gy} cell={T4.cell} W={WK[i]} o={t4g[i]} ring={t4ring} />
                <g opacity={t4s[i] > 0.001 ? 1 : 0}>
                  <line x1={x0} x2={x0} y1={yb - 30} y2={yb + 30} stroke={C.line2} strokeWidth={2.5} />
                  <rect x={x0} y={yb - 20} width={Math.max(3, len)} height={40} rx={5} fill={C.chalk} opacity={0.85} />
                  <Txt x={x0 + len + 16} y={yb} size={34} weight={700} anchor="start" mono o={inv(0.4, 1, t4s[i])}>{fmt(SCORE[i])}</Txt>
                </g>
              </g>
            );
          })}
          <Txt x={T4.x[0] - 24} y={T4.gy + 3 * T4.cell + 62} size={24} fill={C.mute} anchor="end" o={t4s[0]}>score</Txt>
          <PixGrid x={1240} y={720} cell={40} img={IMG} o={t4ring} vals={0} />
          <Pill x={T4.x[WIN] + 1.5 * T4.cell} y={T4.gy + 3 * T4.cell + 140} text="the answer" color={C.chalk} size={28} mono={false} anchorX="middle" o={t4win} />
        </Svg>
        <Rich x={1240} y={350} w={520} size={32} text="{y:score}: add up {f:weight} × {x:pixel} over the nine pixels" o={t4wd} />
        <Tex x={1240} y={580} size={52} tex="s_k = \displaystyle\sum_{i=1}^{9} \chead{W_{k,i}}\, \cin{x_i}" o={t4eq} />
        <Rich x={1380} y={780} ay="middle" size={28} color={C.chalk2} text="the {x:image} $\cin{x}$" o={t4ring} />
        <EvTag x={T4.x[0]} y={890} kind="constructed" text={TOYTAG} o={t4l} />
      </Slide>

      {/* ============================================================ 21.5 the nudge */}
      <Slide o={sl(5)}>
        <SlideHead text={bh(P, 5)} />
        <Svg>
          <PixGrid x={T5.gx} y={T5.gy} cell={T5.cell} img={IMG} o={t5ctx}
            lift={[{ r: 1, c: 1, a: t5cv }, { r: CORNER.r, c: CORNER.c, a: t5kc }]} />
          {[{ r: 1, c: 1, o: t5c }, { r: CORNER.r, c: CORNER.c, o: t5kc }].map((q, j) => (
            <g key={j} opacity={q.o < 0.999 ? q.o : undefined}>
              {q.o > 0.001 ? <rect x={T5.gx + q.c * T5.cell + 3} y={T5.gy + q.r * T5.cell + 3} width={T5.cell - 6} height={T5.cell - 6} fill="none" stroke={C.chalk} strokeWidth={5} /> : null}
              <Txt x={T5.gx + (q.c + 0.5) * T5.cell} y={T5.gy - 34} size={34} weight={700} fill={C.input} o={j === 0 ? t5cv : t5kc}>{sgn(EPS)}</Txt>
            </g>
          ))}
          {TCL.map((k, i) => {
            const yc = T5.y[i], end = T5.bx + T5.k * SCORE[i];
            const dl = (d: number, o: number, big: boolean) => {
              if (o <= 0.001) return null;
              const dir = d > 0 ? 1 : -1, ay = yc - 46;
              return (
                <g opacity={o < 0.999 ? o : undefined}>
                  <Arr x1={end} y1={ay} x2={end + dir * 56} y2={ay} color={big ? C.chalk : C.chalk2} sw={big ? 4 : 3} head={big ? 15 : 12} p={o} />
                  <Txt x={end + dir * 68} y={ay} size={big ? 32 : 24} weight={big ? 700 : 500} anchor={dir > 0 ? 'start' : 'end'} mono
                    fill={big ? C.chalk : C.chalk2}>{sgn(d)}</Txt>
                </g>
              );
            };
            return (
              <g key={k} opacity={t5ctx < 0.999 ? t5ctx : undefined}>
                <Txt x={T5.lab} y={yc} size={30} weight={650} anchor="end">{k}</Txt>
                <line x1={T5.bx} x2={T5.bx} y1={yc - 30} y2={yc + 30} stroke={C.line2} strokeWidth={2.5} />
                <rect x={T5.bx} y={yc - 18} width={Math.max(3, T5.k * SCORE[i])} height={36} rx={5} fill={C.chalk} opacity={0.85} />
                <Txt x={end + 16} y={yc + 2} size={28} weight={600} anchor="start" mono fill={C.chalk2}>{fmt(SCORE[i])}</Txt>
                {dl(DC[i], t5d[i], true)}
                {dl(DK[i], t5kd, i === 0)}
              </g>
            );
          })}
        </Svg>
        <Rich x={T5.gx + 1.5 * T5.cell} y={790} ax="center" size={32} text={`brighten one {x:pixel} by ${fm(EPS)}`} o={t5ctx} />
        <EvTag x={T5.gx} y={872} kind="constructed" text={TOYTAG} o={t5ctx} />
      </Slide>

      {/* ============================================================ 21.6 the gradient */}
      <Slide o={sl(6)}>
        <SlideHead text={bh(P, 6)} />
        <Rich x={960} y={320} ax="center" size={36} text="change in {y:score} ÷ size of the {x:nudge}" o={t6wd} />
        <Tex x={960} y={455} ax="center" size={58} o={t6eq}
          tex={`\\closs{\\text{gradient}} = \\dfrac{\\closs{\\partial}\\, s_k}{\\closs{\\partial}\\, \\cin{x_i}} = \\dfrac{\\Delta s_k}{\\cin{${fm(EPS)}}}`} />
        {[
          { lab: `{y:${TCL[0]}}, {x:centre}`, d: DC[0] },
          { lab: `{y:${TCL[2]}}, {x:centre}`, d: DC[2] },
          { lab: `{y:${TCL[0]}}, {x:corner}`, d: DK[0] },
        ].map((r, i) => (
          <React.Fragment key={i}>
            <Rich x={900} y={605 + i * 78} ax="right" ay="middle" size={30} text={r.lab} o={t6r[i]} />
            <Tex x={940} y={605 + i * 78} size={42} o={t6r[i]} tex={`${fm(r.d)} \\div \\cin{${fm(EPS)}} = \\closs{${fm(r.d / EPS)}}`} />
          </React.Fragment>
        ))}
        <Rich x={960} y={858} ax="center" ay="middle" size={34} text="saliency of a {x:pixel} = | {l:gradient} |, the sign ignored" o={t6s} />
        <EvTag x={160} y={900} kind="constructed" text={TOYTAG} o={t6wd} />
      </Slide>

      {/* ============================================================ 21.7 one saliency map per class */}
      <Slide o={sl(7)}>
        <SlideHead text={bh(P, 7)} />
        <Svg>
          {TCL.map((k, i) => (
            <g key={k}>
              <SalGrid x={T7.x[i]} y={T7.y} cell={T7.cell} S={SALT[i]} o={t7f} p={t7m[i]} />
              <Txt x={T7.x[i] + 1.5 * T7.cell} y={T7.y - 40} size={32} weight={650} o={t7f}>{k}</Txt>
              <Txt x={T7.x[i] + 1.5 * T7.cell} y={T7.y + 3 * T7.cell + 40} size={26} fill={C.chalk2} o={t7m[i]}>{['middle column', 'middle row', 'centre'][i]}</Txt>
            </g>
          ))}
        </Svg>
        <Rich x={960} y={830} ax="center" ay="middle" size={36} text="a saliency map answers a question about one {y:class}" o={t7l} />
        <EvTag x={T7.x[0]} y={890} kind="constructed" text={`${TOYTAG}: saliency = |W| for this linear model`} o={t7f} />
      </Slide>

      {/* ============================================================ 21.8 a deep network: backpropagation */}
      <Slide o={sl(8)}>
        <SlideHead text={bh(P, 8)} />
        <PhotoR R={PH8} src="gull.jpg" o={t8ph} border={C.input} />
        <Credit x={PH8.x} y={PH8.y + PH8.h + 8} text={CREDIT['gull.jpg']} o={t8ph} />
        <Svg>
          <Arr x1={PH8.x + PH8.w + 16} y1={NET8.y} x2={NET8.x - 165} y2={NET8.y} color={C.input} p={t8a} />
          <NetGlyph x={NET8.x} y={NET8.y} o={t8n} seed={5} />
          <Txt x={NET8.x} y={NET8.y - 118} size={30} weight={600} fill={C.chalk2} o={t8n}>deep network</Txt>
          <Arr x1={NET8.x + 165} y1={NET8.y} x2={NET8.x + 255} y2={NET8.y} color={C.chalk2} p={E.io(t8s)} />
          <Txt x={NET8.x + 275} y={NET8.y - 18} size={36} weight={700} anchor="start" o={t8s}>herring gull</Txt>
          <Flow pts={[[NET8.x + 420, NET8.y + 62], [NET8.x + 420, 775], [PH8.x + PH8.w + 22, 775]]} color={C.loss} sw={4} p={t8bp} t={t} live={t8bp > 0.99 ? 1 : 0} />
          <g opacity={t8map > 0.001 ? 1 : 0}>
            {SAL.map((row, r) => row.map((v, c) => (
              <rect key={`${r}-${c}`} x={PH8.x + c * 40} y={655 + r * 40} width={40} height={40} fill={C.heat}
                opacity={0.06 + 0.86 * v * clamp(t8map * 1.6 - (r + c) / 14)} />
            )))}
            <rect x={PH8.x} y={655} width={240} height={240} fill="none" stroke={C.line2} strokeWidth={2} />
          </g>
        </Svg>
        <Rich x={NET8.x + 275} y={NET8.y + 12} size={28} color={C.chalk2} text="score $\hat y_k$" o={t8s} />
        <Rich x={NET8.x + 130} y={NET8.y + 160} ax="center" size={28} color={C.chalk2} text="the {l:gradient} changes from image to image" o={t8ch} />
        <Rich x={(PH8.x + PH8.w + NET8.x + 420) / 2} y={736} ax="center" ay="middle" size={30} weight={650} color={C.loss} text="backpropagation" o={t8bp} />
        <Rich x={PH8.x} y={612} size={26} color={C.chalk2} text="saliency map" o={t8map} />
        <EvTag x={PH8.x + PH8.w + 22} y={860} kind="illustrative" text="6 × 6 example map, not computed" o={t8map} />
        <Rich x={1260} y={660} size={30} text="{x:pixel i}: how far the {y:score} moves" o={t8wd} />
        <Tex x={1260} y={800} size={54} tex="s_i = \left|\dfrac{\closs{\partial}\,\hat y_k}{\closs{\partial}\,\cin{x_i}}\right|" o={t8eq} />
        <Rich x={1760} y={900} ax="right" ay="middle" size={26} color={C.mute} text="Simonyan et al. 2014" o={t8eq} />
      </Slide>

      {/* ============================================================ 21.9 occlusion */}
      <Slide o={sl(9)}>
        <SlideHead text={bh(P, 9)} />
        <PhotoR R={PH9} src="gull.jpg" o={s9ph} dim={0.6 * s9map} />
        <Svg>
          <SensMap R={PH9} vals={DROP} vmax={CL.drop_max} draw={s9map} id="s21occ" />
          {(() => {
            const sd = CL.patch * PH9.w, cx = ux(PH9, (HOT.c + 0.5) / NG), cy = vy(PH9, (HOT.r + 0.5) / NG);
            return (
              <g opacity={s9patch < 0.999 ? s9patch : undefined}>
                <rect x={cx - sd / 2} y={cy - sd / 2} width={sd} height={sd} fill="#7F7F7F" opacity={1 - s9map} />
                <rect x={cx - sd / 2} y={cy - sd / 2} width={sd} height={sd} fill="none" stroke={C.input} strokeWidth={3.5} strokeDasharray="8 6" />
                <MathSvg x={cx + sd / 2 + 26} y={cy - sd / 2 - 16} tex="\cin{p}" size={36} />
              </g>
            );
          })()}
        </Svg>
        <Credit x={PH9.x} y={PH9.y + PH9.h + 8} text={CREDIT['gull.jpg']} o={s9ph} />
        <EvTag x={PH9.x} y={PH9.y + PH9.h + 40} kind="computed" text="CLIP occlusion map of the gull, Part 1" o={s9map} />
        <Rich x={830} y={440} w={900} size={34} text="{y:score} on the {x:photo} minus {y:score} with {x:patch p} greyed" o={s9w} />
        <Tex x={830} y={590} size={50} tex="\Delta_{\cin{p}} = \hat y_k(\cin{x}) - \hat y_k(\cin{x}\ \text{with}\ \cin{p}\ \text{greyed})" o={s9eq} />
      </Slide>


      {/* ============================================================ 21.10 limit 1 setup: the sanity check */}
      <Slide o={sl(10)}>
        <SlideHead text={bh(P, 10)} />
        <Svg>
          {[{ R: 440, net: s10n1, e: s10e1, rr: 0 }, { R: 690, net: s10n2, e: s10e2, rr: s10R }].map((row, i) => (
            <g key={i}>
              <NetGlyph x={370} y={row.R} R={row.rr} o={row.net} seed={3} />
              <Arr x1={530} y1={row.R} x2={698} y2={row.R} color={FC} p={row.e} />
              <g opacity={inv(0.3, 0.7, row.e) < 0.999 ? inv(0.3, 0.7, row.e) : undefined}>
                <Block x={770} y={row.R} w={130} h={100} kind="neutral" />
                <MathSvg x={770} y={row.R} tex="E" size={52} />
              </g>
              <Arr x1={845} y1={row.R} x2={938} y2={row.R} p={inv(0.5, 1, row.e)} />
            </g>
          ))}
          <SchemMap x={950} y={440 - 75} s={150} id="s21n1" o={inv(0.7, 1, s10e1)} />
          <Txt x={1025} y={340} size={26} fill={C.chalk2} o={inv(0.7, 1, s10e1)}>explanation</Txt>
          <g opacity={inv(0.7, 1, s10e2) < 0.999 ? inv(0.7, 1, s10e2) : undefined}>
            <rect x={950} y={690 - 75} width={150} height={150} rx={10} fill="none" stroke={C.line2} strokeWidth={2.5} strokeDasharray="8 7" />
            <Txt x={1025} y={692} size={72} weight={600} fill={C.chalk2}>?</Txt>
          </g>
        </Svg>
        <Rich x={220} y={315} size={30} weight={600} text="{f:trained network}" o={s10n1} />
        <Rich x={220} y={565} size={30} weight={600} text="{f:same network}" o={s10n2} />
        <Rich x={220} y={790} size={28} color={C.chalk2} text="weights randomised layer by layer" o={s10l2} />
        <Rich x={1240} y={400} w={560} size={36} lh={1.4} text="a faithful explanation should {y:change} when the {f:model} changes" o={s10pr} />
        <Rich x={1240} y={690} ay="middle" size={26} color={C.mute} text="the test: Adebayo et al., NeurIPS 2018" o={s10n2} />
        <EvTag x={220} y={862} kind="schematic" text="networks and maps drawn" o={s10n1} />
      </Slide>

      {/* ============================================================ 21.11 the result */}
      <Slide o={sl(11)}>
        <SlideHead text={bh(P, 11)} />
        <Svg>
          <SchemMap x={260} y={390} s={300} id="s21sA" o={s11a} />
          <SchemMap x={720} y={390} s={300} id="s21sB" jit={1} o={s11b} />
          <Txt x={640} y={550} size={80} weight={600} o={s11eq}>≈</Txt>
          <Txt x={410} y={735} size={30} fill={C.chalk2} o={s11a}>trained</Txt>
          <Txt x={870} y={735} size={30} fill={C.chalk2} o={s11b}>randomised</Txt>
          {/* the methods that pass */}
          <g opacity={s11pan < 0.999 ? s11pan : undefined}>
            <rect x={1180} y={370} width={560} height={420} rx={16} fill={C.bg2} stroke={C.line} strokeWidth={2} />
            <HeatGlyph x={1225} y={470} s={170} id="s21pg" />
            <Txt x={1460} y={555} size={60} weight={600}>≠</Txt>
            <NoiseGlyph x={1525} y={470} s={170} id="s21pn" />
            <Txt x={1310} y={672} size={24} fill={C.chalk2}>trained</Txt>
            <Txt x={1610} y={672} size={24} fill={C.chalk2}>randomised</Txt>
          </g>
          <Tick x={1250} y={735} p={s11pass} />
        </Svg>
        <Rich x={640} y={330} ax="center" ay="middle" size={34} weight={650} text="guided backpropagation" o={s11a} />
        <Rich x={640} y={810} ax="center" ay="middle" size={32} text="these maps trace edges, like an edge detector" o={s11edge} />
        <Rich x={1460} y={415} ax="center" ay="middle" size={30} weight={650} text="plain gradient, Grad-CAM" o={s11pan} />
        <Rich x={1285} y={735} ay="middle" size={30} text="changes: passes the test" o={s11pass} />
        <EvTag x={260} y={872} kind="schematic" text="maps drawn, after Adebayo et al., NeurIPS 2018" o={s11a} />
      </Slide>

      {/* ============================================================ 21.12 limit 2 setup: two hospitals */}
      <Slide o={sl(12)}>
        <SlideHead text={bh(P, 12)} />
        {R12.map((ry, i) => {
          const o = i === 0 ? s12hA : s12hB;
          return [16, 8, 0].map((d) => (
            <PhotoR key={`${i}-${d}`} R={{ x: 400 + d, y: ry - 49 + d, w: 120, h: 97 }} src="chest.jpg" o={o} dim={d ? 0.55 : 0} radius={5} shadow={false} />
          ));
        })}
        <Svg>
          {R12.map((ry, i) => {
            const o = i === 0 ? s12hA : s12hB, p = i === 0 ? s12bA : s12bB, v = i === 0 ? ZR.prevMSH : ZR.prevNIH;
            return (
              <g key={i}>
                <Hospital x={290} y={ry - 8} o={o} />
                <Txt x={290} y={ry + 78} size={26} weight={600} o={o}>{i === 0 ? 'A: Mount Sinai' : 'B: NIH'}</Txt>
                <Txt x={290} y={ry + 110} size={22} fill={C.mute} mono o={o}>{`${(i === 0 ? ZR.nMSH : ZR.nNIH).toLocaleString('en-GB')} X-rays`}</Txt>
                <g opacity={inv(0, 0.3, p) < 0.999 ? inv(0, 0.3, p) : undefined}>
                  <rect x={BAR12.x} y={ry - 22} width={Math.max(4, BAR12.k * v * p)} height={44} rx={5} fill={C.chalk} opacity={0.85} />
                  <Txt x={BAR12.x + BAR12.k * v * p + 22} y={ry} size={34} weight={700} anchor="start" mono o={inv(0.5, 1, p)}>{`${v.toFixed(1)}%`}</Txt>
                </g>
              </g>
            );
          })}
          <line x1={BAR12.x} x2={BAR12.x} y1={385} y2={755} stroke={C.line2} strokeWidth={2.5} opacity={s12bA} />
          {/* one detector trained on both */}
          <path d="M 1262 375 Q 1292 375 1292 400 L 1292 545 Q 1292 570 1318 570 Q 1292 570 1292 595 L 1292 740 Q 1292 765 1262 765" fill="none"
            stroke={C.chalk2} strokeWidth={3} pathLength={1} strokeDasharray={s12br < 0.999 ? `${s12br} 1` : undefined} opacity={s12br > 0.001 ? 1 : 0} />
          <Arr x1={1328} y1={570} x2={1398} y2={570} p={inv(0.6, 1, s12br)} />
          <g opacity={s12det < 0.999 ? s12det : undefined}>
            <Block x={1560} y={570} w={300} h={130} kind="head">
              <Txt x={0} y={-18} size={30} weight={600}>pneumonia</Txt>
              <Txt x={0} y={20} size={30} weight={600}>detector</Txt>
            </Block>
          </g>
        </Svg>
        <Rich x={BAR12.x} y={330} ay="middle" size={30} color={C.chalk2} text="patients with pneumonia" o={s12bA} />
        <Rich x={1560} y={672} ax="center" ay="middle" size={30} text="trained on both" o={s12br} />
        <EvTag x={BAR12.x} y={872} kind="reported" text="Zech et al., PLOS Medicine 2018" o={s12hA} />
      </Slide>

      {/* ============================================================ 21.13 the shortcut */}
      <Slide o={sl(13)}>
        <SlideHead text={bh(P, 13)} />
        <PhotoR R={XR13} src="chest.jpg" o={s13x} />
        <Credit x={XR13.x} y={XR13.y + XR13.h + 8} text={CREDIT['chest.jpg']} o={s13x} />
        <Svg>
          <Region R={XR13} b={TOKEN} color={C.leak} draw={s13m} sw={4} r={6} />
          <path d={`M ${ux(XR13, TOKEN[0] + TOKEN[2] / 2) + 8} ${vy(XR13, TOKEN[1])} L 750 ${vy(XR13, TOKEN[1])}`} stroke={C.leak} strokeWidth={3}
            strokeDasharray="3 9" strokeLinecap="round" fill="none" opacity={inv(0.6, 1, s13m)} />
          <Pill x={762} y={vy(XR13, TOKEN[1])} text="which hospital?" color={C.leak} size={30} o={s13q} mono={false} />
          {/* hospital -> marker, hospital -> pneumonia rate, so marker -> pneumonia */}
          <Pill x={920} y={690} text="hospital" color={C.leak} size={30} anchorX="middle" mono={false} o={s13hm} />
          <Pill x={1400} y={570} text="corner marker" color={C.leak} size={30} anchorX="middle" mono={false} o={s13hm} />
          <Arr x1={1005} y1={672} x2={1270} y2={588} color={C.leak} p={s13hm} />
          <Pill x={1400} y={810} text="pneumonia rate" color={C.chalk} size={30} anchorX="middle" mono={false} o={s13hp} />
          <Arr x1={1005} y1={708} x2={1255} y2={792} color={C.leak} p={s13hp} />
          <path d={`M 1400 ${598} L 1400 ${598 + (782 - 598) * s13sc}`} stroke={C.leak} strokeWidth={4} strokeDasharray="10 9" fill="none" opacity={s13sc > 0.001 ? 1 : 0} />
          {s13sc > 0.95 ? <path d="M 1400 784 L 1389 764 L 1411 764 Z" fill={C.leak} /> : null}
        </Svg>
        <Rich x={762} y={410} size={30} text={`hospital named correctly for {k:${ZE.hospital_id_nih.toFixed(2)}%} of NIH X-rays`} o={s13pc} />
        <Rich x={1428} y={690} ay="middle" size={28} color={C.leak} weight={650} text="shortcut" o={s13sc} />
        <Rich x={762} y={880} ay="middle" size={30} text="it can predict pneumonia without looking at the lungs" o={s13end} />
        <EvTag x={XR13.x} y={XR13.y + XR13.h + 40} kind="reported" text="Zech et al., PLOS Medicine 2018" o={s13pc} />
      </Slide>

      {/* ============================================================ 21.14 exposed, not fixed */}
      <Slide o={sl(14)}>
        <SlideHead text={bh(P, 14)} />
        <PhotoR R={XR14} src="chest.jpg" o={s14x} dim={0.55 * s14heat} />
        <Credit x={XR14.x} y={XR14.y + XR14.h + 8} text={CREDIT['chest.jpg']} o={s14x} />
        <Svg>
          <defs>
            <radialGradient id="s21hx">
              <stop offset="0%" stopColor={C.heat} stopOpacity={0.95} />
              <stop offset="45%" stopColor={C.heat} stopOpacity={0.55} />
              <stop offset="100%" stopColor={C.heat} stopOpacity={0} />
            </radialGradient>
            <clipPath id="s21hxc"><rect x={XR14.x} y={XR14.y} width={XR14.w} height={XR14.h} rx={8} /></clipPath>
          </defs>
          <g clipPath="url(#s21hxc)" opacity={s14heat}>
            <circle cx={ux(XR14, TOKEN[0])} cy={vy(XR14, TOKEN[1])} r={78} fill="url(#s21hx)" />
            <circle cx={ux(XR14, 0.36)} cy={vy(XR14, 0.5)} r={70} fill="url(#s21hx)" opacity={0.18} />
          </g>
          <Region R={XR14} b={TOKEN} color={C.leak} draw={inv(0.5, 1, s14heat)} sw={4} r={6} />
          <Tick x={800} y={400} p={s14ok} />
          <Cross x={786} y={460} w={30} h={30} p={s14no} sw={6} />
          {/* AUC bars */}
          <g opacity={s14b1 > 0.001 ? 1 : 0}>
            {[
              { lab: 'same hospitals', v: ZE.auc_internal, p: s14b1, y: 640 },
              { lab: 'a new hospital', v: ZE.auc_external, p: s14b2, y: 715 },
            ].map((r) => (
              <g key={r.lab} opacity={inv(0, 0.3, r.p)}>
                <Txt x={790} y={r.y} size={30} anchor="start">{r.lab}</Txt>
                <rect x={1040} y={r.y - 19} width={560} height={38} rx={5} fill={C.bg3} />
                <rect x={1040} y={r.y - 19} width={560 * r.v * r.p} height={38} rx={5} fill={C.chalk} opacity={0.85} />
                <Txt x={1618} y={r.y} size={32} anchor="start" mono weight={700} o={inv(0.4, 1, r.p)}>{r.v.toFixed(3)}</Txt>
              </g>
            ))}
          </g>
        </Svg>
        <Rich x={840} y={400} ay="middle" size={34} text="exposes the {k:shortcut}" o={s14ok} />
        <Rich x={840} y={475} ay="middle" size={34} text="cannot remove it" o={inv(0, 0.5, s14no)} />
        <Rich x={790} y={575} ay="middle" size={28} color={C.chalk2} text="pneumonia AUC" o={s14b1} />
        <Rich x={790} y={830} ay="middle" size={34} text="fix: {y:new data} and retraining" o={s14fix} />
        <EvTag x={XR14.x} y={XR14.y + XR14.h + 40} kind="reported" text="Zech et al., PLOS Medicine 2018" o={s14b1} />
      </Slide>

      {/* ============================================================ 21.15 limit 3: where, not what */}
      <Slide o={sl(15)}>
        <SlideHead text={bh(P, 15)} />
        <PhotoR R={PH15} src="gull.jpg" o={s15ph} dim={0.6 * s15map} />
        <Svg>
          <SensMap R={PH15} vals={DROP} vmax={CL.drop_max} draw={s15map} id="s21occ16" />
          <circle cx={ux(PH15, (HOT.c + 0.5) / NG)} cy={vy(PH15, (HOT.r + 0.5) / NG)} r={58} fill="none" stroke={C.input} strokeWidth={4}
            strokeDasharray="10 7" opacity={s15wh} />
          {Q15.map((q, i) => {
            const px = ux(PH15, q.u), py = vy(PH15, q.v);
            return (
              <g key={q.text} opacity={s15q[i] < 0.999 ? s15q[i] : undefined}>
                <line x1={572} y1={q.y} x2={px} y2={py} stroke={C.concept} strokeWidth={2.5} strokeDasharray="5 6" />
                <circle cx={px} cy={py} r={7} fill={C.concept} />
                <Pill x={562} y={q.y} text={q.text} color={C.concept} size={30} anchorX="end" mono={false} />
              </g>
            );
          })}
        </Svg>
        <Credit x={PH15.x} y={PH15.y + PH15.h + 8} text={CREDIT['gull.jpg']} o={s15ph} />
        <EvTag x={PH15.x} y={PH15.y + PH15.h + 36} kind="computed" text="CLIP occlusion map of the gull, Part 1" o={s15map} />
        <Rich x={1320} y={430} w={440} size={34} text="{x:where}: the score was sensitive here" o={s15wh} />
        <Rich x={1320} y={600} w={440} size={34} text="{c:what} the model saw there: not said" o={s15wt} />
      </Slide>

      {/* ============================================================ 21.16 findings, and no knob for them */}
      <Slide o={sl(16)}>
        <SlideHead text={bh(P, 16)} />
        <Svg>
          {['narrowed joint space', 'bone spur', 'black wingtips'].map((s, i) => (
            <Pill key={s} x={200} y={440 + i * 80} text={s} color={C.concept} size={32} o={s16c[i]} mono={false} />
          ))}
          <Person x={250} y={770} s={1.3} o={s16p} />
          <Txt x={300} y={790} size={28} fill={C.chalk2} anchor="start" o={s16p}>expert</Txt>
          <Arr x1={410} y1={760} x2={1055} y2={630} color={C.edit} p={s16arr} />
          <ClipBox x={1250} y={520} w={360} h={300} t={t} o={s16box} />
          <Txt x={1250} y={340} size={30} fill={C.chalk2} o={s16box}>black-box model</Txt>
          <g opacity={s16k < 0.999 ? s16k : undefined}>
            <line x1={1436} y1={520} x2={1562} y2={520} stroke={C.edit} strokeWidth={3} strokeDasharray="9 7" />
            <Knob x={1620} y={520} v={s16kv} />
            <Txt x={1620} y={614} size={26} fill={C.edit}>wingtip colour</Txt>
          </g>
          <Cross x={1562} y={462} w={116} h={116} p={s16x} sw={6} />
        </Svg>
        <Rich x={200} y={350} ay="middle" size={36} weight={650} text="{c:findings}" o={s16f} />
        <Rich x={1250} y={720} ax="center" ay="middle" size={34} text="no named part to correct" o={s16no} />
        <Rich x={1760} y={860} ax="right" ay="middle" size={28} color={C.chalk2} text="next: a {c:concept bottleneck} adds that knob (Part 2)" o={s16fw} />
      </Slide>

      {/* ============================================================ 21.17 ante-hoc examples */}
      <Slide o={sl(17)}>
        <SlideHead text={bh(P, 17)} />
        <Svg>
          {[{ x: 160, o: s17fr }, { x: 710, o: s17fr }, { x: 1260, o: s17fr }].map((p, i) => (
            <rect key={i} x={p.x} y={320} width={500} height={480} rx={16} fill={C.bg2} stroke={C.line} strokeWidth={2} opacity={p.o} />
          ))}
          {/* the tree */}
          <g opacity={s17b < 0.999 ? s17b : undefined}>
            {[[TREE.root, TREE.leafL, 'no'], [TREE.root, TREE.node, 'yes'], [TREE.node, TREE.leafA, 'no'], [TREE.node, TREE.leafB, 'yes']].map(([a, c, lab], i) => {
              const A = a as { x: number; y: number }, B = c as { x: number; y: number };
              return (
                <g key={i}>
                  <line x1={A.x} y1={A.y + 24} x2={B.x} y2={B.y - 26} stroke={C.line2} strokeWidth={3} />
                  <Txt x={(A.x + B.x) / 2 + (B.x < A.x ? -34 : 34)} y={(A.y + B.y) / 2 - 6} size={22} fill={C.mute}>{lab as string}</Txt>
                </g>
              );
            })}
            <Pill x={TREE.root.x} y={TREE.root.y} text={TREE.root.text} color={C.concept} size={24} anchorX="middle" mono={false} />
            <Pill x={TREE.node.x} y={TREE.node.y} text={TREE.node.text} color={C.concept} size={24} anchorX="middle" mono={false} />
            {[TREE.leafL, TREE.leafA, TREE.leafB].map((l, i) => (
              <g key={i}>
                <Txt x={l.x} y={l.y} size={25} weight={700}>{l.a}</Txt>
                <Txt x={l.x} y={l.y + 32} size={25} weight={700}>{l.b}</Txt>
              </g>
            ))}
          </g>
          {/* prototypes */}
          <g opacity={s17c < 0.999 ? s17c : undefined}>
            <Txt x={1510} y={541} size={40} weight={600}>≈</Txt>
            <Txt x={1385} y={672} size={24} fill={C.chalk2}>this part</Txt>
            <Txt x={1635} y={672} size={24} fill={C.chalk2}>looks like that</Txt>
          </g>
        </Svg>
        <PhotoR R={{ x: 1290, y: 450, w: 190, h: 190 }} src="gull.jpg" crop={[0.24, 0.27, 4.2]} o={s17c} border={C.chalk2} />
        <PhotoR R={{ x: 1540, y: 450, w: 190, h: 190 }} src="gull.jpg" crop={[0.2, 0.3, 3.3]} o={s17c} border={C.concept} />
        <Rich x={410} y={370} ax="center" ay="middle" size={30} weight={650} text="sparse linear model" o={s17a} />
        <Rich x={960} y={370} ax="center" ay="middle" size={30} weight={650} text="short decision tree" o={s17b} />
        <Rich x={1510} y={370} ax="center" ay="middle" size={30} weight={650} text="prototype network" o={s17c} />
        <Tex x={410} y={580} ax="center" size={40} o={s17a}
          tex="\begin{aligned} \hat y &= 2.1\,\ccon{\text{wingtip black}} \\ &\quad - 1.3\,\ccon{\text{bill hooked}} \\ &\quad + \dots \end{aligned}" />
        <Rich x={1510} y={740} ax="center" ay="middle" size={24} color={C.mute} text="Chen et al. 2019" o={s17c} />
        <EvTag x={160} y={826} kind="illustrative" text="hand-written examples" o={s17a} />
        <Credit x={1760} y={812} ax="right" text={CREDIT['gull.jpg']} o={s17c} />
      </Slide>

      {/* ============================================================ 21.18 Rudin */}
      <Slide o={sl(18)}>
        <SlideHead text={bh(P, 18)} />
        <Svg>
          <rect x={360} y={390} width={1200} height={380} rx={20} fill={C.bg2} stroke={C.line} strokeWidth={2} opacity={s18q} />
          <Txt x={420} y={450} size={110} weight={700} fill={C.line2} o={s18q}>“</Txt>
        </Svg>
        <Rich x={960} y={560} w={980} ax="center" ay="middle" size={40} weight={550} lh={1.4} o={s18q}
          text="For high-stakes decisions, prefer models people can read over black boxes explained afterwards." />
        <Rich x={960} y={710} ax="center" ay="middle" size={26} color={C.mute} text="Rudin, Nature Machine Intelligence 2019 (paraphrase)" o={s18c} />
      </Slide>

      {/* ============================================================ 21.19 / 21.20 the CBM: words, then symbols */}
      <Slide o={sl(19)}>
        <SlideHead text={bh(P, 19)} />
      </Slide>
      <Slide o={sl(20)}>
        <SlideHead text={bh(P, 20)} />
      </Slide>
      <Slide o={rowO}>
        <Svg>
          <Arr x1={COLS[0] + 105} y1={ROWW} x2={COLS[1] - 160} y2={ROWW} color={C.chalk2} p={E.io(r20a[0])} />
          <Arr x1={COLS[1] + 160} y1={ROWW} x2={COLS[2] - 135} y2={ROWW} color={C.chalk2} p={E.io(r20a[1])} />
        </Svg>
        <Rich x={COLS[0]} y={ROWW} ax="center" ay="middle" size={60} weight={700} text="{x:photo}" o={r19[0]} />
        <Rich x={COLS[1]} y={ROWW} ax="center" ay="middle" size={60} weight={700} text="{c:concepts}" o={r19[1]} />
        <Rich x={COLS[2]} y={ROWW} ax="center" ay="middle" size={60} weight={700} text="{y:answer}" o={r19[2]} />
      </Slide>
      <Slide o={sl(19) * s19vis}>
        <PhotoR R={{ x: COLS[0] - 115, y: 515, w: 230, h: 230 }} src="gull.jpg" o={r19[0]} border={C.input} />
        <Credit x={COLS[0] - 115} y={752} text={CREDIT['gull.jpg']} o={r19[0]} />
        <Svg>
          {['wingtip black', 'bill pointed', 'head white'].map((s, i) => (
            <Pill key={s} x={COLS[1]} y={560 + i * 70} text={s} color={C.concept} size={28} anchorX="middle" mono={false} o={inv(i * 0.2, i * 0.2 + 0.6, r19[1])} />
          ))}
          <Txt x={COLS[2]} y={630} size={38} weight={700} o={r19[2]}>herring gull</Txt>
        </Svg>
        <Rich x={960} y={850} ax="center" ay="middle" size={34} text="the {y:answer} is computed from the {c:concepts} alone" o={s19al} />
      </Slide>
      <Slide o={sl(20)}>
        <Svg>
          {COLS.map((x, i) => (
            <line key={i} x1={x} x2={x} y1={ROWW + 48} y2={ROWS - 52} stroke={C.line2} strokeWidth={2} strokeDasharray="4 8" opacity={s20[i]} />
          ))}
          <Arr x1={COLS[0] + 60} y1={ROWS} x2={COLS[1] - 60} y2={ROWS} color={C.input} sw={4} p={s20g} />
          <Arr x1={COLS[1] + 60} y1={ROWS} x2={COLS[2] - 60} y2={ROWS} color={FC} sw={4} p={s20f} />
          <MathSvg x={(COLS[0] + COLS[1]) / 2} y={ROWS - 46} tex="\gth" size={48} o={inv(0.5, 1, s20g)} />
          <MathSvg x={(COLS[1] + COLS[2]) / 2} y={ROWS - 46} tex="\fph" size={48} o={inv(0.5, 1, s20f)} />
        </Svg>
        <Tex x={COLS[0]} y={ROWS} ax="center" size={64} tex="\cin{x}" o={s20[0]} />
        <Tex x={COLS[1]} y={ROWS} ax="center" size={64} tex="\cvec" o={s20[1]} />
        <Tex x={COLS[2]} y={ROWS} ax="center" size={64} tex="\hat y" o={s20[2]} />
        <Rich x={(COLS[0] + COLS[1]) / 2} y={ROWS + 70} ax="center" ay="middle" size={30} text="{x:concept predictor} $\gth$" o={s20g} />
        <Rich x={(COLS[1] + COLS[2]) / 2} y={ROWS + 70} ax="center" ay="middle" size={30} text="{f:task head} $\fph$" o={s20f} />
        <Rich x={960} y={800} ax="center" ay="middle" size={34} color={C.chalk2}
          text="$\cvec$: one predicted value per {c:concept}" o={s20[1]} />
      </Slide>
    </Stage>
  );
};
