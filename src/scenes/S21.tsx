// s21 Part 1: Post-hoc or interpretable by design? One slide per narration beat.
// 1-2: two routes and post-hoc. 3-4: sensitivity formula, then three shape/class examples.
// 5: occlusion. 6-7: model randomisation check. 8-10: hospital shortcut.
// 11-12: where versus what, and named controls. 13-16: interpretable models and the CBM.
// TCAV is in the appendix, S26.tsx.
import React from 'react';
import { C } from '../kit/theme';
import { E, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, ROLE, bs, be, bw, bh, clamp, inv, type SceneProps } from '../kit/core';
import { CREDIT, Credit, EvTag, MathSvg, PhotoR, Pill, Region, SensMap, Block, Cross, Person, fit, rgba, ux, vy, type Rect } from '../kit/cbm';
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

// 21.3 and 21.4: one input nudge, one class score, then the saliency map.
// All numerical values come from the existing constructed example in math/data.py.
const ST = D.saliency_toy;
const TOY_CLASS: string = ST.classes[0];
const IMG: number[][] = ST.image;
const EPS: number = ST.eps;
const DELTA: number = ST.nudge_centre[TOY_CLASS];
const TOY_EXAMPLES: { class: string; image: number[][] }[] = ST.examples;
const TOYTAG = 'constructed linear model, not a trained image classifier';
const fm = (v: number) => String(parseFloat(v.toFixed(3)));

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

/** The relative size of each pixel's score change, for the same tiny nudge. */
const SalGrid: React.FC<{ x: number; y: number; cell: number; target?: string; o?: number }> = ({ x, y, cell, target = TOY_CLASS, o = 1 }) => (
  <g opacity={o}>
    {(ST.saliency[target] as number[][]).map((row, r) => row.map((v, c) => (
      <rect key={`${r}-${c}`} x={x + c * cell} y={y + r * cell} width={cell} height={cell}
        fill={rgba(C.heat, 0.92 * v / ST.saliency_max)} stroke={C.line2} strokeWidth={2} />
    )))}
  </g>
);

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

// ------------------------------------------------------------------ 21.6 to 21.12: the limits
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
// 21.8 rows (hospital A = Mount Sinai, B = NIH), bar scale in px per percentage point
const R12 = [440, 700], BAR12 = { x: 640, k: 13 };
// 21.9 / 21.10 X-ray frames
const XR13: Rect = fit('chest.jpg', 180, 330, 500);
const XR14: Rect = fit('chest.jpg', 180, 330, 520);
// 21.11 the gull with its occlusion map; question points (normalized) for head shape, yellow bill, red spot
const PH15: Rect = { x: 700, y: 300, w: 540, h: 540 };
const Q15 = [
  { text: 'head shape?', u: 0.3, v: 0.215, y: 380 },
  { text: 'yellow bill?', u: 0.19, v: 0.285, y: 480 },
  { text: 'red spot?', u: 0.105, v: 0.306, y: 580 },
];

// 21.13: the decision tree
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
const COLS = [520, 960, 1400]; // 21.15 / 21.16 columns: photo, concepts, answer
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


  // ---------------- 21.3 one nudge, one score change
  const nudge = at(w(3, 'brighten') - 0.1);
  const change = at(w(3, 'rises') - 0.1);
  const saliencyWords = at(w(3, 'Saliency') - 0.1);
  const saliencyFormula = at(w(3, 'symbols') - 0.1);

  // ---------------- 21.4 three input/class pairs, with a shared brightness scale
  const examplesIn = [at(w(4, 'vertical') - 0.1), at(w(4, 'horizontal') - 0.1), at(w(4, 'dot') - 0.1)];
  const examplesMap = [at(w(4, 'column') - 0.1), at(w(4, 'row') - 0.1), at(w(4, 'centre') - 0.1)];
  const mapScale = at(w(4, 'All') - 0.1);

  // ---------------- 21.5
  const s9ph = at(b(5) - 0.05, 0.3);
  const s9patch = at(w(5, 'Grey') - 0.1, 0.4);
  const s9map = inv(w(5, 'occlusion') - 0.3, w(5, 'occlusion') + 1.2, t);
  const s9w = at(w(5, 'measure') - 0.1), s9eq = at(w(5, 'drops') - 0.1, 0.6);


  // ---------------- 21.6 all inputs and outputs of the explanation workflow
  const workflowModel = at(w(6, 'trained') - 0.1);
  const workflowScore = at(w(6, 'choose') - 0.1);
  const workflowMethod = at(w(6, 'method') - 0.1);
  const workflowFormula = at(w(6, 'formula') - 0.1);
  const workflowMap = at(w(6, 'heatmap') - 0.1);

  // ---------------- 21.7 repeat that method after removing the learned weights
  const checkBefore = at(w(7, 'Compare') - 0.1);
  const checkAfter = at(w(7, 'random') - 0.1);
  const checkMethod = at(w(7, 'guided') - 0.1);
  const checkSimilar = at(w(7, 'barely') - 0.1);
  const checkTakeaway = at(w(7, 'Before') - 0.1);

  // ---------------- 21.8 limit 2 setup
  const s12det = at(w(8, 'pneumonia') - 0.1), s12hA = at(w(8, 'chest') - 0.1), s12hB = at(w(8, 'two') - 0.1);
  const s12br = E.io(inv(w(8, 'systems') - 0.1, w(8, 'systems') + 0.6, t));
  const s12bA = E.out(inv(w(8, 'third') - 0.1, w(8, 'third') + 0.9, t)), s12bB = E.out(inv(w(8, 'other') - 0.1, w(8, 'other') + 0.9, t));

  // ---------------- 21.9 the shortcut
  const s13x = at(b(9) - 0.05, 0.3), s13q = at(w(9, 'which') - 0.1), s13pc = at(w(9, 'almost') - 0.1);
  const s13m = E.io(inv(w(9, 'markers') - 0.1, w(9, 'markers') + 0.6, t));
  const s13hm = E.io(inv(w(9, 'markers') + 0.2, w(9, 'markers') + 0.9, t));
  const s13hp = E.io(inv(w(9, 'predicts') - 0.1, w(9, 'predicts') + 0.7, t));
  const s13sc = E.io(inv(w(9, 'detector') - 0.1, w(9, 'detector') + 0.7, t)), s13end = at(w(9, 'shortcut') - 0.3);

  // ---------------- 21.10 exposed, not fixed
  const s14x = at(b(10) - 0.05, 0.3), s14heat = inv(w(10, 'light') - 0.1, w(10, 'light') + 0.9, t);
  const s14ok = E.io(inv(w(10, 'expose') - 0.1, w(10, 'expose') + 0.5, t)), s14no = inv(w(10, 'cannot') - 0.1, w(10, 'cannot') + 0.6, t);
  const s14b1 = E.out(inv(w(10, 'On') - 0.1, w(10, 'On') + 0.8, t)), s14b2 = E.out(inv(w(10, 'worse') - 0.4, w(10, 'worse') + 0.6, t));
  const s14fix = at(w(10, 'fix') - 0.1);

  // ---------------- 21.11 limit 3
  const s15ph = at(w(11, 'heatmap') - 0.1, 0.5), s15map = inv(w(11, 'heatmap'), w(11, 'heatmap') + 1.0, t);
  const s15wh = E.io(inv(w(11, 'where') - 0.1, w(11, 'where') + 0.5, t)), s15wt = at(w(11, 'what') - 0.1);
  const s15q = [at(w(11, 'head') - 0.1), at(w(11, 'yellow') - 0.1), at(w(11, 'red') - 0.1)];

  // ---------------- 21.12 findings vs knobs
  const s16f = at(w(12, 'findings') - 0.1), s16c = [at(w(12, 'narrowed') - 0.1, 0.4), at(w(12, 'bone') - 0.1, 0.4), at(w(12, 'black') - 0.1, 0.4)];
  const s16box = at(w(12, 'Even') - 0.1), s16p = at(w(12, 'expert') - 0.1), s16arr = E.io(inv(w(12, 'mistake') - 0.2, w(12, 'mistake') + 0.7, t));
  const s16no = at(w(12, 'named', 1) - 0.1), s16k = at(w(12, 'setting') - 0.1), s16kv = E.io(inv(w(12, 'switch'), w(12, 'black', 1) + 0.3, t));
  const s16x = inv(w(12, 'colour') + 0.1, w(12, 'colour') + 0.7, t), s16fw = at(w(12, 'switch') - 0.1);

  // ---------------- 21.13
  const s17fr = at(w(13, 'computed') - 0.1, 0.6);
  const s17a = at(w(13, 'sparse') - 0.1, 0.6), s17b = at(w(13, 'decision') - 0.1, 0.6), s17c = at(w(13, 'Prototype') - 0.1, 0.6);

  // ---------------- 21.14
  const s18q = at(w(14, 'high') - 0.3, 0.7), s18c = at(w(14, 'over') - 0.1, 0.6);

  // ---------------- 21.15 / 21.16 (the words row stays from 21.15 into 21.16)
  const rowO = inv(b(15) - 0.05, b(15) + 0.25, t);
  const r19 = [at(w(15, 'photo') - 0.1), at(w(15, 'concepts') - 0.1), at(w(15, 'answer') - 0.1)];
  const r20a = [at(w(15, 'concepts') - 0.3), at(w(15, 'answer') - 0.3)];
  const s19vis = 1 - inv(b(16) - 0.35, b(16) - 0.05, t);
  const s19al = at(w(15, 'alone') - 0.6);
  const s20 = [at(w(16, 'x') - 0.1), at(w(16, 'c') - 0.1), at(w(16, 'y') - 0.1)];
  const s20g = E.io(inv(w(16, 'predictor') - 0.2, w(16, 'predictor') + 0.6, t)), s20f = E.io(inv(w(16, 'task') - 0.2, w(16, 'task') + 0.6, t));

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

      {/* ============================================================ 21.3 sensitivity in words, then symbols */}
      <Slide o={sl(3)}>
        <SlideHead text={bh(P, 3)} />
        <Svg>
          <PixGrid x={240} y={325} cell={90} img={IMG} vals={0} lift={[{ r: 1, c: 1, a: nudge }]} />
          <rect x={334} y={419} width={82} height={82} fill="none" stroke={C.input} strokeWidth={5} opacity={nudge} />
          <Arr x1={560} y1={460} x2={800} y2={460} color={C.input} p={nudge} />
          <Block x={960} y={460} w={260} h={140} kind="head">
            <Txt x={0} y={0} size={36} weight={600}>model</Txt>
          </Block>
          <Arr x1={1120} y1={460} x2={1300} y2={460} p={change} />
          <Txt x={1480} y={460} size={80} weight={650} mono o={change}>{'+' + fm(DELTA)}</Txt>
        </Svg>
        <Rich x={375} y={280} ax="center" size={30} text="{x:input image}" />
        <Rich x={375} y={625} ax="center" size={32} text={'centre {x:pixel}: {x:+' + fm(EPS) + '}'} o={nudge} />
        <Rich x={1480} y={330} ax="center" size={32} text={'{y:' + TOY_CLASS + ' score}'} />
        <Rich x={1480} y={550} ax="center" size={30} color={C.chalk2} text="change in score" o={change} />
        <Rich x={960} y={710} ax="center" size={34}
          text="{l:saliency} = size of the {y:score change} ÷ size of the {x:pixel change}" o={saliencyWords} />
        <Tex x={790} y={820} ax="center" size={48} o={saliencyFormula}
          tex="\closs{S_i^{(k)}}=\left|\frac{\partial s_k(\cin{x})}{\partial \cin{x_i}}\right|\approx\left|\frac{\Delta s_k}{\Delta\cin{x_i}}\right|" />
        <Tex x={1480} y={820} ax="center" size={48} o={saliencyWords}
          tex={'\\left|\\frac{' + fm(DELTA) + '}{\\cin{' + fm(EPS) + '}}\\right|=\\closs{' + fm(DELTA / EPS) + '}'} />
        <EvTag x={240} y={930} kind="constructed" text={TOYTAG} />
      </Slide>

      {/* ============================================================ 21.4 three shape/class examples */}
      <Slide o={sl(4)}>
        <SlideHead text={bh(P, 4)} />
        {TOY_EXAMPLES.map((ex, i) => {
          const x = 510 + i * 500;
          return <React.Fragment key={ex.class}>
            <Rich x={x} y={300} ax="center" size={34} weight={650} text={'{y:' + ex.class + '}'} o={examplesIn[i]} />
            <Svg>
              <PixGrid x={x - 90} y={360} cell={60} img={ex.image} vals={0} o={examplesIn[i]} />
              <Arr x1={x} y1={563} x2={x} y2={610} color={C.chalk2} p={examplesMap[i]} />
              <SalGrid x={x - 90} y={635} cell={60} target={ex.class} o={examplesMap[i]} />
            </Svg>
          </React.Fragment>;
        })}
        <Rich x={145} y={425} size={30} text="{x:input}" />
        <Rich x={145} y={700} size={30} text="saliency" />
        <Rich x={960} y={870} ax="center" size={32} text="Shared scale: brighter means more sensitive to that {y:class score}" o={mapScale} />
        <EvTag x={240} y={940} kind="constructed" text="computed from a hand-written linear model, three shape/class pairs" />
      </Slide>

      {/* ============================================================ 21.5 occlusion */}
      <Slide o={sl(5)}>
        <SlideHead text={bh(P, 5)} />
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


      {/* ============================================================ 21.6 the whole explanation workflow */}
      <Slide o={sl(6)}>
        <SlideHead text={bh(P, 6)} />
        <PhotoR R={{ x: 120, y: 400, w: 220, h: 220 }} src="gull.jpg" border={C.input} />
        <Svg>
          <Arr x1={365} y1={510} x2={425} y2={510} color={C.input} p={workflowModel} />
          <g opacity={workflowModel}>
            <Block x={560} y={510} w={230} h={135} kind="head">
              <Txt x={0} y={-20} size={32} weight={600}>trained</Txt>
              <Txt x={0} y={22} size={32} weight={600}>model</Txt>
            </Block>
          </g>
          <Arr x1={695} y1={510} x2={760} y2={510} p={workflowScore} />
          <g opacity={workflowScore}>
            <Txt x={915} y={485} size={34} weight={650}>herring gull</Txt>
            <Txt x={915} y={535} size={34} weight={650}>score</Txt>
          </g>
          <Arr x1={1060} y1={510} x2={1105} y2={510} p={workflowMethod} />
          <g opacity={workflowMethod}>
            <Block x={1260} y={510} w={270} h={135} kind="neutral">
              <Txt x={0} y={-20} size={30} weight={600}>explanation</Txt>
              <Txt x={0} y={22} size={30} weight={600}>method</Txt>
            </Block>
          </g>
          <Arr x1={1415} y1={510} x2={1520} y2={510} p={workflowMap} />
          <HeatGlyph x={1560} y={400} s={220} id="s21workflow-map" o={workflowMap} />
        </Svg>
        <Rich x={230} y={330} ax="center" size={32} text="{x:input}" />
        <Rich x={915} y={330} ax="center" size={32} text="{y:output to explain}" o={workflowScore} />
        <Rich x={1670} y={330} ax="center" size={32} text="heatmap" o={workflowMap} />
        <Rich x={1260} y={630} ax="center" w={390} size={28} text="plain gradients: {l:pixel sensitivities}" o={workflowFormula} />
        <Rich x={960} y={740} ax="center" size={32}
          text="The method uses this {x:photo}, the {f:model} and the chosen {y:class}" o={workflowMethod} />
        <Rich x={960} y={820} ax="center" size={36} weight={650}
          text="Brighter pixels: the chosen {y:score} is more sensitive there" o={workflowMap} />
        <EvTag x={120} y={910} kind="schematic" text="workflow and heatmap illustration, not computed for this photo" />
        <Credit x={120} y={955} text={CREDIT['gull.jpg']} />
      </Slide>

      {/* ============================================================ 21.7 the test and its takeaway */}
      <Slide o={sl(7)}>
        <SlideHead text={bh(P, 7)} />
        <Rich x={960} y={300} ax="center" size={32} text="Same {x:photo}, same {y:herring gull class}, same method" />
        <PhotoR R={{ x: 150, y: 425, w: 250, h: 250 }} src="gull.jpg" border={C.input} />
        <Svg>
          <SchemMap x={680} y={425} s={250} id="s21check-trained" o={checkBefore} />
          <Arr x1={985} y1={550} x2={1255} y2={550} color={FC} p={checkAfter} />
          <SchemMap x={1320} y={425} s={250} id="s21check-random" jit={1} o={checkAfter} />
        </Svg>
        <Rich x={275} y={365} ax="center" size={32} text="{x:input photo}" />
        <Rich x={805} y={365} ax="center" size={32} text="{f:trained weights}" o={checkBefore} />
        <Rich x={1445} y={365} ax="center" size={32} text="{f:random weights}" o={checkAfter} />
        <Rich x={1120} y={425} ax="center" w={270} size={30} text="replace learned weights" o={checkAfter} />
        <Rich x={1120} y={615} ax="center" w={300} size={30} weight={650} text="almost unchanged" o={checkSimilar} />
        <Rich x={1125} y={720} ax="center" size={28} color={C.chalk2} text="reported example: guided backpropagation" o={checkMethod} />
        <Rich x={960} y={815} ax="center" w={1600} size={36} weight={650}
          text="Before trusting a heatmap, check that it depends on the {f:learned weights}" o={checkTakeaway} />
        <EvTag x={150} y={910} kind="schematic" text="drawn maps illustrating a reported failure, Adebayo et al., NeurIPS 2018" />
        <Credit x={150} y={955} text={CREDIT['gull.jpg']} />
      </Slide>

      {/* ============================================================ 21.8 limit 2 setup: two hospitals */}
      <Slide o={sl(8)}>
        <SlideHead text={bh(P, 8)} />
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

      {/* ============================================================ 21.9 the shortcut */}
      <Slide o={sl(9)}>
        <SlideHead text={bh(P, 9)} />
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

      {/* ============================================================ 21.10 exposed, not fixed */}
      <Slide o={sl(10)}>
        <SlideHead text={bh(P, 10)} />
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

      {/* ============================================================ 21.11 limit 3: where, not what */}
      <Slide o={sl(11)}>
        <SlideHead text={bh(P, 11)} />
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

      {/* ============================================================ 21.12 findings, and no knob for them */}
      <Slide o={sl(12)}>
        <SlideHead text={bh(P, 12)} />
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

      {/* ============================================================ 21.13 ante-hoc examples */}
      <Slide o={sl(13)}>
        <SlideHead text={bh(P, 13)} />
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

      {/* ============================================================ 21.14 Rudin */}
      <Slide o={sl(14)}>
        <SlideHead text={bh(P, 14)} />
        <Svg>
          <rect x={360} y={390} width={1200} height={380} rx={20} fill={C.bg2} stroke={C.line} strokeWidth={2} opacity={s18q} />
          <Txt x={420} y={450} size={110} weight={700} fill={C.line2} o={s18q}>“</Txt>
        </Svg>
        <Rich x={960} y={560} w={980} ax="center" ay="middle" size={40} weight={550} lh={1.4} o={s18q}
          text="For high-stakes decisions, prefer models people can read over black boxes explained afterwards." />
        <Rich x={960} y={710} ax="center" ay="middle" size={26} color={C.mute} text="Rudin, Nature Machine Intelligence 2019 (paraphrase)" o={s18c} />
      </Slide>

      {/* ============================================================ 21.15 / 21.16 the CBM: words, then symbols */}
      <Slide o={sl(15)}>
        <SlideHead text={bh(P, 15)} />
      </Slide>
      <Slide o={sl(16)}>
        <SlideHead text={bh(P, 16)} />
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
      <Slide o={sl(15) * s19vis}>
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
      <Slide o={sl(16)}>
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
