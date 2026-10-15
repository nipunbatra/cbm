// s26 Appendix · Testing with concept activation vectors (TCAV), moved out of s21 (formerly 21.5 to 21.10)
// 26.1 the question (gull -> CLIP -> herring gull; grey wings?)
// 26.2 step 1: photos with / without grey wings (schematic tiles)        26.3 step 2: the concept direction v
// 26.4 step 3: nudge a herring gull activation along v; does the score go up?
// 26.5 the TCAV score, 10 real runs for grey wings (D.cub.tcav)          26.6 random directions vs grey wings (real)
// Slides replace each other: the old one fades out in the gap before a beat, the new one fades in on its first words.
import React from 'react';
import { C } from '../kit/theme';
import { E, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, bs, bw, bh, clamp, inv, type SceneProps } from '../kit/core';
import { CREDIT, Credit, EvTag, MathSvg, PhotoR, Region, type Rect } from '../kit/cbm';
import { rnd } from '../kit/anim';
import { D } from '../kit/data';

const CL = D.clip;

// ------------------------------------------------------------------ helpers
/** one slide: a full-frame layer with its own opacity */
const Slide: React.FC<{ o: number; children?: React.ReactNode }> = ({ o, children }) =>
  o <= 0.001 ? null : <div style={{ position: 'absolute', inset: 0, opacity: o < 0.999 ? o : undefined }}>{children}</div>;

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

// ------------------------------------------------------------------ TCAV on the gull: does CLIP use grey wings when it says herring gull? Real runs in D.cub.tcav.
const TC = D.cub.tcav;
const TG = TC['has_wing_color::grey'];
const TR = TC.random;
const GRUNS: number[] = TG.tcav_runs;
const RRUNS: number[] = TR.tcav_runs;
const GMIN = Math.min(...GRUNS), GMAX = Math.max(...GRUNS);


/** a schematic bird silhouette (stands in for a dataset photo; no CUB image is shown) */
const Bird: React.FC<{ x: number; y: number; s?: number; wing: string; body: string; flip?: boolean }> = ({ x, y, s = 1, wing, body, flip }) => (
  <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
    <line x1={-6} y1={18} x2={-8} y2={36} stroke="#8F98A3" strokeWidth={3} strokeLinecap="round" />
    <line x1={8} y1={18} x2={8} y2={36} stroke="#8F98A3" strokeWidth={3} strokeLinecap="round" />
    <path d="M 30 -2 L 52 -9 L 50 9 Z" fill={wing} />
    <ellipse cx={2} cy={4} rx={34} ry={18} fill={body} />
    <circle cx={-28} cy={-14} r={13} fill={body} />
    <path d="M -40 -16 L -55 -11 L -40 -8 Z" fill="#8A8170" />
    <circle cx={-31} cy={-17} r={2.2} fill="#14181D" />
    <path d="M -10 -4 Q 16 -20 44 -4 Q 22 12 -6 10 Z" fill={wing} />
  </g>
);
/** an opaque network (CLIP): a dark box with a faint, slowly shimmering inner texture (as in s01) */
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

// the two example groups of step 1 (drawn, schematic): wing and body colours per tile
const WITH_B = [
  { wing: '#A3ACB7', body: '#E4E8EC' }, { wing: '#9AA3AE', body: '#D8CFC0' }, { wing: '#AEB6BF', body: '#F0F2F4' },
  { wing: '#959EAA', body: '#C9CFD6' }, { wing: '#A7AFB9', body: '#E9E4DA' }, { wing: '#9CA5B0', body: '#DDE2E8' },
];
const WOUT_B = [
  { wing: '#5A4130', body: '#C7A27A' }, { wing: '#33302C', body: '#E6D9A8' }, { wing: '#8A6A2E', body: '#D9C7A0' },
  { wing: '#6E4B3A', body: '#A88C6A' }, { wing: '#2F2A26', body: '#EADFC8' }, { wing: '#7C6A4A', body: '#C9B48C' },
];
const TILE = { w: 150, h: 116, gap: 20 };
const GRP_X = [260, 1170]; // left edge of the tile grid: with grey wings, without
const GRP_Y = 440;

// 26.3 / 26.4: activations of the two groups (sketch), separated along v = (1, -1)/sqrt 2
const MID: [number, number] = [640, 620];
const VD: [number, number] = [Math.SQRT1_2, -Math.SQRT1_2];
const cloud = (cx: number, cy: number, seed: number, n: number) => Array.from({ length: n }, (_, k) => {
  const a = rnd(seed + k * 1.7) * Math.PI * 2, r = 20 + 70 * Math.sqrt(rnd(seed + k * 3.3));
  return [cx + Math.cos(a) * r * 1.2, cy + Math.sin(a) * r * 0.85] as [number, number];
});
const GREYW = cloud(MID[0] + 200, MID[1] - 110, 11, 13);
const NOGREY = cloud(MID[0] - 200, MID[1] + 110, 47, 13);
const VBASE: [number, number] = [MID[0] - 125, MID[1] - 125]; // where the arrow v leaves the boundary
const G0: [number, number] = [600, 495]; // the herring gull photo's activation (sketch)
const NUDGE = 95;

/** one run as a lollipop: stem from the baseline y0 up to value v (y1 = value 1), p grows it */
const Lolli: React.FC<{ x: number; y0: number; y1: number; v: number; p: number; color: string }> = ({ x, y0, y1, v, p, color }) => {
  if (p <= 0.001) return null;
  const yy = y0 - (y0 - y1) * v * p;
  return (
    <g opacity={clamp(p * 3) < 0.999 ? clamp(p * 3) : undefined}>
      <line x1={x} x2={x} y1={y0} y2={yy} stroke={color} strokeWidth={8} strokeLinecap="round" opacity={0.5} />
      <circle cx={x} cy={yy} r={12} fill={color} />
    </g>
  );
};

// geometry
// 26.1: the question
const PH1: Rect = { x: 200, y: 380, w: 380, h: 380 };
const WING = [0.56, 0.46, 0.4, 0.27]; // the grey wing in gull.jpg (normalized cx, cy, w, h)
const Y1 = 570, CB1 = { x: 820, w: 220 }, OUT1 = 1010;
const SC1: number = CL.probs[CL.top]; // CLIP's share for the top species on the gull photo (Part 1)
// 26.5 / 26.6: run charts (baseline y0 = score 0, y1 = score 1)
const CH5 = { x0: 1090, x1: 1730, y0: 800, y1: 420 };
const CH6 = { x0: 340, x1: 1580, y0: 640, y1: 330, xr: 440, xg: 1060 };

export const S26: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.5) => inv(x, x + d, t);
  const NB = P.beats.length;
  /** slide k: fades in on the beat's first words, fades out (0.3 s) just before the next beat */
  const sl = (k: number) => inv(b(k) - 0.05, b(k) + 0.25, t) * (k < NB ? 1 - inv(b(k + 1) - 0.35, b(k + 1) - 0.05, t) : 1);

  // ---------------- 26.1 the question
  const s1ph = at(b(1) - 0.05, 0.3), s1box = at(w(1, 'model') - 0.1, 0.5), s1a = E.io(inv(w(1, 'model') - 0.1, w(1, 'model') + 0.7, t));
  const s1out = at(w(1, 'herring') - 0.1), s1cite = at(w(1, 'Testing') - 0.1), s1q = at(w(1, 'appendix') - 0.1);
  const s1clip = at(w(1, 'CLIP') - 0.1);
  const s1wing = E.io(inv(w(1, 'grey') - 0.1, w(1, 'grey') + 0.7, t));

  // ---------------- 26.2 step 1: two groups of example photos
  const s2fr = at(b(2) - 0.05, 0.3), s2w = inv(w(2, 'grey') - 0.3, w(2, 'grey') + 0.6, t), s2n = inv(w(2, 'without') - 0.2, w(2, 'without') + 0.7, t);
  const s2cnt = at(w(2, 'labelled') - 0.1), s2none = at(w(2, 'None') - 0.1);

  // ---------------- 26.3 step 2: the concept direction
  const s3ax = at(b(3) - 0.05, 0.3), s3eq = at(w(3, 'activations') - 0.1, 0.6);
  const s3g = inv(w(3, 'activations') - 0.2, w(3, 'activations') + 0.6, t), s3n = inv(w(3, 'activations') + 0.2, w(3, 'activations') + 1.0, t);
  const s3line = at(w(3, 'Fit') - 0.1, 0.6), s3v = E.io(inv(w(3, 'direction') - 0.1, w(3, 'direction') + 0.7, t)), s3c = at(w(3, 'concept') - 0.1);

  // ---------------- 26.4 step 3: nudge one herring gull photo along v
  const s4ctx = at(b(4) - 0.05, 0.3), s4dot = at(w(4, 'herring') - 0.1), s4nud = E.io(inv(w(4, 'moved') - 0.1, w(4, 'moved') + 0.9, t));
  const s4gauge = at(w(4, 'moved') - 0.1), s4q = at(w(4, 'would') - 0.1), s4up = E.io(inv(w(4, 'up') - 0.2, w(4, 'up') + 0.6, t));
  const s4eq = at(w(4, 'gradient') - 0.1, 0.6);

  // ---------------- 26.5 the TCAV score
  const s5w = at(b(5) - 0.05, 0.3), s5eq = at(w(5, 'goes') - 0.1, 0.6), s5ch = at(w(5, 'For') - 0.1);
  const s5r0 = w(5, 'grey'), s5r1 = Math.max(w(5, 'repeats'), s5r0 + 1.5);
  const s5run = (i: number) => E.out(inv(s5r0 + (i / 10) * (s5r1 - s5r0), s5r0 + (i / 10) * (s5r1 - s5r0) + 0.5, t));
  const s5rng = at(w(5, 'repeats') - 0.1);

  // ---------------- 26.6 random directions
  const s6ax = at(b(6) - 0.05, 0.3), s6r0 = w(6, 'random'), s6r1 = Math.max(w(6, 'jump') + 0.6, s6r0 + 1.5);
  const s6run = (i: number) => E.out(inv(s6r0 + (i / 10) * (s6r1 - s6r0), s6r0 + (i / 10) * (s6r1 - s6r0) + 0.45, t));
  const s6c = at(w(6, 'So') - 0.1), s6f = at(w(6, 'even') - 0.1);
  return (
    <Stage>
      <Header t={t} title={P.title} />

      {/* ============================================================ 26.1 TCAV: the question */}
      <Slide o={sl(1)}>
        <SlideHead text={bh(P, 1)} />
        <PhotoR R={PH1} src="gull.jpg" o={s1ph} border={C.input} />
        <Credit x={PH1.x} y={PH1.y + PH1.h + 8} text={CREDIT['gull.jpg']} o={s1ph} />
        <Svg>
          <Region R={PH1} b={WING} color={C.concept} draw={s1wing} sw={4} r={14} />
          <Arr x1={PH1.x + PH1.w + 16} y1={Y1} x2={CB1.x - CB1.w / 2 - 14} y2={Y1} color={C.input} p={s1a} />
          <ClipBox x={CB1.x} y={Y1} w={CB1.w} h={CB1.w} t={t} o={s1box} />
          <Txt x={CB1.x} y={Y1 - CB1.w / 2 - 36} size={40} weight={700} o={s1clip}>CLIP</Txt>
          <Arr x1={CB1.x + CB1.w / 2 + 14} y1={Y1} x2={OUT1 - 18} y2={Y1} color={C.chalk2} p={s1out} />
          <g opacity={s1out < 0.999 ? s1out : undefined}>
            <Txt x={OUT1} y={Y1 - 34} size={36} weight={700} anchor="start">{CL.species[CL.top]}</Txt>
            <rect x={OUT1} y={Y1 + 4} width={340} height={26} rx={5} fill={C.bg3} />
            <rect x={OUT1} y={Y1 + 4} width={340 * SC1} height={26} rx={5} fill={C.chalk} opacity={0.85} />
            <Txt x={OUT1 + 360} y={Y1 + 17} size={30} weight={700} anchor="start" mono>{SC1.toFixed(2)}</Txt>
          </g>
        </Svg>
        <EvTag x={OUT1} y={Y1 + 62} kind="computed" text="CLIP share for the gull, Part 1" o={s1out} />
        <Rich x={200} y={830} size={36} text="one more post-hoc method: it asks about {c:concepts} directly" o={s1q} />
        <Rich x={200} y={892} size={26} color={C.mute} text="TCAV: Kim et al., ICML 2018" o={s1cite} />
      </Slide>

      {/* ============================================================ 26.2 step 1: two groups of photos */}
      <Slide o={sl(2)}>
        <SlideHead text={bh(P, 2)} />
        <Svg>
          {GRP_X.map((x0, g) => {
            const wd = 3 * TILE.w + 2 * TILE.gap, ht = 2 * TILE.h + TILE.gap;
            const p = g === 0 ? s2w : s2n;
            return (
              <g key={g}>
                <rect x={x0 - 24} y={GRP_Y - 24} width={wd + 48} height={ht + 48} rx={18} fill="none" stroke={g === 0 ? C.concept : C.mute}
                  strokeWidth={3} opacity={s2fr * (0.3 + 0.7 * clamp(p * 2))} />
                {(g === 0 ? WITH_B : WOUT_B).map((bd, i) => {
                  const tx = x0 + (i % 3) * (TILE.w + TILE.gap), ty = GRP_Y + Math.floor(i / 3) * (TILE.h + TILE.gap);
                  const o = inv(i / 9, i / 9 + 0.4, p);
                  return o <= 0.001 ? null : (
                    <g key={i} opacity={o < 0.999 ? o : undefined}>
                      <rect x={tx} y={ty} width={TILE.w} height={TILE.h} rx={10} fill={C.bg3} stroke={C.line2} strokeWidth={1.5} />
                      <Bird x={tx + TILE.w / 2} y={ty + TILE.h / 2 - 6} s={0.92 + 0.12 * rnd(i * 5 + g)} flip={rnd(i * 3.3 + g * 7) > 0.5} wing={bd.wing} body={bd.body} />
                    </g>
                  );
                })}
              </g>
            );
          })}
        </Svg>
        <Rich x={GRP_X[0] + 245} y={370} ax="center" ay="middle" size={34} weight={650} text="{c:with grey wings}" o={s2fr * clamp(s2w * 2)} />
        <Rich x={GRP_X[1] + 245} y={370} ax="center" ay="middle" size={34} weight={650} color={C.chalk2} text="without" o={s2fr * clamp(s2n * 2)} />
        <Rich x={960} y={770} ax="center" ay="middle" size={32} color={C.chalk2} text={`${TC.n_per_set} photos in each group`} o={s2cnt} />
        <Rich x={960} y={835} ax="center" ay="middle" size={34} text="none is a {y:herring gull}" o={s2none} />
        <EvTag x={GRP_X[0] - 24} y={884} kind="schematic" text="drawings stand in for labelled bird photos (CUB, Part 2)" o={s2cnt} />
      </Slide>

      {/* ============================================================ 26.3 step 2: the concept direction */}
      <Slide o={sl(3)}>
        <SlideHead text={bh(P, 3)} />
        <Svg>
          <g opacity={s3ax < 0.999 ? s3ax : undefined}>
            <line x1={300} y1={880} x2={1010} y2={880} stroke={C.line2} strokeWidth={2.5} />
            <line x1={300} y1={880} x2={300} y2={320} stroke={C.line2} strokeWidth={2.5} />
          </g>
          {NOGREY.map(([x, y], i) => <circle key={`n${i}`} cx={x} cy={y} r={12} fill={C.mute} opacity={s3n * clamp(s3n * 2 - i / 26)} />)}
          {GREYW.map(([x, y], i) => <circle key={`g${i}`} cx={x} cy={y} r={12} fill={C.concept} opacity={s3g * clamp(s3g * 2 - i / 26)} />)}
          <Txt x={MID[0] + 200} y={MID[1] + 10} size={28} weight={600} fill={C.concept} o={s3g}>with grey wings</Txt>
          <Txt x={MID[0] - 200} y={MID[1] + 230} size={28} weight={600} fill={C.chalk2} o={s3n}>without</Txt>
          <line x1={MID[0] - 250} y1={MID[1] - 250} x2={MID[0] + 250} y2={MID[1] + 250} stroke={C.chalk2} strokeWidth={3} strokeDasharray="10 9" opacity={s3line} />
          <Arr x1={VBASE[0]} y1={VBASE[1]} x2={VBASE[0] + VD[0] * 170} y2={VBASE[1] + VD[1] * 170} color={C.concept} sw={6} head={22} p={s3v} />
          <MathSvg x={VBASE[0] + VD[0] * 170 + 18} y={VBASE[1] + VD[1] * 170 - 20} tex="\ccon{v}" size={46} anchor="start" o={inv(0.7, 1, s3v)} />
        </Svg>
        <Rich x={1110} y={350} size={30} color={C.chalk2} text="activations: the CLIP features" o={s3eq} />
        <Tex x={1110} y={440} size={56} tex="h(\cin{x}) \in \mathbb{R}^{512}" o={s3eq} />
        <Rich x={1110} y={590} w={620} size={34} text="$\ccon{v}$, the {c:concept activation vector}: moving along it means more {c:grey wing}" o={s3c} />
        <EvTag x={300} y={900} kind="schematic" text="2 of 512 dimensions drawn" o={s3ax} />
      </Slide>

      {/* ============================================================ 26.4 step 3: nudge one herring gull photo */}
      <Slide o={sl(4)}>
        <SlideHead text={bh(P, 4)} />
        <Svg>
          <g opacity={s4ctx < 0.999 ? s4ctx : undefined}>
            <line x1={300} y1={880} x2={1010} y2={880} stroke={C.line2} strokeWidth={2.5} />
            <line x1={300} y1={880} x2={300} y2={320} stroke={C.line2} strokeWidth={2.5} />
            {NOGREY.map(([x, y], i) => <circle key={`n${i}`} cx={x} cy={y} r={10} fill={C.mute} opacity={0.18} />)}
            {GREYW.map(([x, y], i) => <circle key={`g${i}`} cx={x} cy={y} r={10} fill={C.concept} opacity={0.18} />)}
            <line x1={MID[0] - 250} y1={MID[1] - 250} x2={MID[0] + 250} y2={MID[1] + 250} stroke={C.chalk2} strokeWidth={2.5} strokeDasharray="10 9" opacity={0.35} />
            <Arr x1={VBASE[0]} y1={VBASE[1]} x2={VBASE[0] + VD[0] * 170} y2={VBASE[1] + VD[1] * 170} color={C.concept} sw={6} head={22} />
            <MathSvg x={VBASE[0] + VD[0] * 170 + 18} y={VBASE[1] + VD[1] * 170 - 20} tex="\ccon{v}" size={46} anchor="start" />
          </g>
          {(() => {
            const px = 28 * Math.SQRT1_2; // the nudge arrow runs beside the dot's path
            const gx = G0[0] + VD[0] * NUDGE * s4nud, gy = G0[1] + VD[1] * NUDGE * s4nud;
            return (
              <g opacity={s4dot < 0.999 ? s4dot : undefined}>
                <circle cx={G0[0]} cy={G0[1]} r={15} fill="none" stroke={C.chalk2} strokeWidth={2.5} strokeDasharray="5 5" opacity={clamp(s4nud * 3)} />
                <Arr x1={G0[0] + px} y1={G0[1] + px} x2={G0[0] + px + VD[0] * NUDGE} y2={G0[1] + px + VD[1] * NUDGE} color={C.concept} sw={4} head={15} p={s4nud} />
                <circle cx={gx} cy={gy} r={16} fill={C.chalk} />
                <Txt x={G0[0] + 34} y={G0[1] + 6} size={26} weight={600} anchor="start" o={1 - clamp(s4nud * 2)}>a herring gull photo</Txt>
              </g>
            );
          })()}
          <g opacity={s4gauge < 0.999 ? s4gauge : undefined}>
            <rect x={1110} y={400} width={520} height={30} rx={5} fill={C.bg3} />
            <rect x={1110} y={400} width={520 * (0.5 + 0.14 * s4up)} height={30} rx={5} fill={C.chalk} opacity={0.85} />
            <line x1={1110 + 260} x2={1110 + 260} y1={390} y2={440} stroke={C.chalk2} strokeWidth={2.5} strokeDasharray="4 4" opacity={clamp(s4up * 3)} />
            <Arr x1={1665} y1={436} x2={1665} y2={392} color={C.chalk} sw={4} head={16} p={s4up} />
          </g>
        </Svg>
        <Rich x={1110} y={330} size={32} text="{y:herring gull} score" o={s4gauge} />
        <Rich x={1110} y={520} size={38} text="does the {y:score} go up?" o={s4q} />
        <Tex x={1110} y={660} size={54} tex="\nabla_h \hat y_{\text{herring gull}} \cdot \ccon{v} > 0 \;?" o={s4eq} />
        <EvTag x={300} y={900} kind="schematic" text="one photo, 2 of 512 dimensions drawn" o={s4ctx} />
      </Slide>

      {/* ============================================================ 26.5 the TCAV score (real runs) */}
      <Slide o={sl(5)}>
        <SlideHead text={bh(P, 5)} />
        <Rich x={200} y={350} w={780} size={36} text={`the share of the {y:${TC.n_class_images} herring gull photos} whose {y:score} goes up`} o={s5w} />
        <Tex x={200} y={560} size={52} o={s5eq}
          tex={`\\text{TCAV} = \\dfrac{\\#\\{\\,\\nabla_h \\hat y \\cdot \\ccon{v} > 0\\,\\}}{${TC.n_class_images}}`} />
        <Rich x={200} y={720} w={780} size={32} o={s5rng}
          text={`{c:grey wings}: between {y:${GMIN.toFixed(2)}} and {y:${GMAX.toFixed(2)}} in all ${TC.n_repeats} repeats`} />
        <Svg>
          <g opacity={s5ch < 0.999 ? s5ch : undefined}>
            <line x1={CH5.x0} x2={CH5.x0} y1={CH5.y1 - 10} y2={CH5.y0} stroke={C.line2} strokeWidth={2.5} />
            <line x1={CH5.x0} x2={CH5.x1} y1={CH5.y0} y2={CH5.y0} stroke={C.line2} strokeWidth={2.5} />
            <line x1={CH5.x0} x2={CH5.x1} y1={CH5.y1} y2={CH5.y1} stroke={C.line} strokeWidth={2} strokeDasharray="4 8" />
            <Txt x={CH5.x0 - 18} y={CH5.y0} size={26} fill={C.mute} anchor="end" mono>0</Txt>
            <Txt x={CH5.x0 - 18} y={CH5.y1} size={26} fill={C.mute} anchor="end" mono>1</Txt>
            <Txt x={(CH5.x0 + CH5.x1) / 2} y={CH5.y0 + 45} size={26} fill={C.mute}>{`repeats 1 to ${TC.n_repeats}, new example photos each time`}</Txt>
          </g>
          {GRUNS.map((v, i) => <Lolli key={i} x={CH5.x0 + 40 + i * 60} y0={CH5.y0} y1={CH5.y1} v={v} p={s5run(i)} color={C.concept} />)}
        </Svg>
        <Rich x={CH5.x0} y={340} size={30} text="{c:grey wings}: one score per repeat" o={s5ch} />
        <EvTag x={200} y={890} kind="computed" text="CLIP ViT-B/32 zero-shot herring gull score, CUB photos; Kim et al.'s method" o={s5ch} />
      </Slide>

      {/* ============================================================ 26.6 random directions (real runs) */}
      <Slide o={sl(6)}>
        <SlideHead text={bh(P, 6)} />
        <Svg>
          <g opacity={s6ax < 0.999 ? s6ax : undefined}>
            <line x1={CH6.x0} x2={CH6.x0} y1={CH6.y1 - 10} y2={CH6.y0} stroke={C.line2} strokeWidth={2.5} />
            <line x1={CH6.x0} x2={CH6.x1} y1={CH6.y0} y2={CH6.y0} stroke={C.line2} strokeWidth={2.5} />
            {[0.5, 1].map((v) => (
              <line key={v} x1={CH6.x0} x2={CH6.x1} y1={CH6.y0 - (CH6.y0 - CH6.y1) * v} y2={CH6.y0 - (CH6.y0 - CH6.y1) * v} stroke={C.line} strokeWidth={2} strokeDasharray="4 8" />
            ))}
            {[0, 0.5, 1].map((v) => (
              <Txt key={v} x={CH6.x0 - 18} y={CH6.y0 - (CH6.y0 - CH6.y1) * v} size={26} fill={C.mute} anchor="end" mono>{v === 0.5 ? '0.5' : String(v)}</Txt>
            ))}
            {GRUNS.map((v, i) => <Lolli key={i} x={CH6.xg + i * 50} y0={CH6.y0} y1={CH6.y1} v={v} p={1} color={C.concept} />)}
            <Txt x={CH6.xg + 225} y={CH6.y0 + 40} size={28} weight={600} fill={C.concept}>grey wings</Txt>
          </g>
          {RRUNS.map((v, i) => <Lolli key={i} x={CH6.xr + i * 50} y0={CH6.y0} y1={CH6.y1} v={v} p={s6run(i)} color={C.chalk2} />)}
          <Txt x={CH6.xr + 225} y={CH6.y0 + 40} size={28} weight={600} fill={C.chalk2} o={at(s6r0 - 0.1)}>random directions</Txt>
        </Svg>
        <Rich x={960} y={760} ax="center" ay="middle" size={34} text="a {c:concept} counts only if its score is steady and differs from random" o={s6c} />
        <Rich x={960} y={828} ax="center" ay="middle" size={32} color={C.chalk2} text="it says what the model responds to, not how to fix it" o={s6f} />
        <EvTag x={CH6.x0} y={884} kind="computed" text="CLIP ViT-B/32 zero-shot herring gull score, CUB photos; Kim et al.'s method" o={s6ax} />
      </Slide>
    </Stage>
  );
};
