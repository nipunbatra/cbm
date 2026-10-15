// s03 Part 3 · What is a concept? (revision 2: one idea per slide, 15 slides, one per beat)
// 3.1 motivation: a name tag on a neuron falls off; a concept is a claim a person checks in the input (gull, wingtip).
// 3.2 meaning: the definition card.      3.3 grounding: the wingtip region, "not here" on the water and the rock.
// 3.4 to 3.10 representation, one type per slide: binary {0,1}; soft sigmoid with a worked logit (1.4 -> 0.80);
//     calibration (reliability sketch); categorical softmax over four wing colours (illustrative vector, sums to 1);
//     continuous (bill length in mm, illustrative); vector or distribution (Part 10); unknown (CUB "not visible").
// 3.11 recap table of the six types.     3.12 the schematic EEG with the spindle window; 3.13 the spindle zoomed.
// 3.14 the support message.              3.15 three named claims, each with the person who could check it.
// Slides replace each other: the old one fades out just before a beat, the new one fades in on its first words.
import React from 'react';
import { C, F } from '../kit/theme';
import { E, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, HText, bs, be, bw, bh, inv, type SceneProps } from '../kit/core';
import { ArchMap, CREDIT, Credit, EvTag, MathSvg, Person, PhotoR, Pill, Region, VecCol, Wave, rgba, type Rect } from '../kit/cbm';
import { Brace } from '../kit/slots';
import { D } from '../kit/data';

// ------------------------------------------------------------------ data and fixed illustrative values
const SOFT: number = D.bird.before.c[0]; // the gull's wingtip-grey score in s02 (0.8)
const WING: number[] = D.gull.regions.wingtip;
const BILL: number[] = D.gull.regions.bill;
const NOT_HERE = { water: [0.72, 0.18, 0.4, 0.22], rock: [0.36, 0.86, 0.5, 0.13] }; // normalized cx, cy, w, h
const sig = (z: number) => 1 / (1 + Math.exp(-z));
const ZW = 1.4; // the worked logit (illustrative); sigma(1.4) = 0.802
const CAT = ['grey', 'black', 'white', 'brown'];
const CATZ = [2.0, 0.5, -0.2, -0.9]; // illustrative wing-colour logits
const CATP = (() => { const e = CATZ.map(Math.exp), s = e.reduce((a, b) => a + b, 0); return e.map((v) => v / s); })();
const BILL_MM = 54; // illustrative predicted bill length (mm)
const EMB = [0.31, -1.2, 0.85, 0.02, -0.47]; // an illustrative concept embedding (m = 5)
const EEG = D.eeg;
const SP = EEG.spindle;

/** one slide: a full-frame layer with its own opacity */
const Slide: React.FC<{ o: number; children?: React.ReactNode }> = ({ o, children }) =>
  o <= 0.001 ? null : <div style={{ position: 'absolute', inset: 0, opacity: o < 0.999 ? o : undefined }}>{children}</div>;

/** the three requirements, current one highlighted (small context element, top right) */
const Tracker: React.FC<{ on: number }> = ({ on }) => {
  const items = ['meaning', 'grounding', 'representation'];
  const xs = [1150, 1340, 1555];
  return (
    <g>
      {items.map((s, k) => {
        const a = k === on;
        return (
          <g key={s} opacity={a ? 1 : 0.6}>
            <circle cx={xs[k]} cy={312} r={17} fill={a ? rgba(C.concept, 0.2) : 'none'} stroke={a ? C.concept : C.line2} strokeWidth={2.2} />
            <Txt x={xs[k]} y={313} size={20} mono weight={700} fill={a ? C.concept : C.mute}>{String(k + 1)}</Txt>
            <Txt x={xs[k] + 26} y={312} size={24} anchor="start" weight={a ? 700 : 500} fill={a ? C.concept : C.mute}>{s}</Txt>
          </g>
        );
      })}
    </g>
  );
};

/** which representation (of six) the slide is about: six small dots, top right */
const RepDots: React.FC<{ on: number }> = ({ on }) => (
  <g>
    <Txt x={1560} y={312} size={22} anchor="end" fill={C.mute}>representation</Txt>
    {Array.from({ length: 6 }, (_, k) => (
      <circle key={k} cx={1590 + k * 30} cy={312} r={9} fill={k <= on ? C.concept : 'none'} stroke={k <= on ? C.concept : C.line2} strokeWidth={2}
        opacity={k === on ? 1 : k < on ? 0.45 : 1} />
    ))}
  </g>
);

/** a small answer cell (0, 1 or the unknown symbol) */
const Cell: React.FC<{ x: number; y: number; v: string; on?: boolean; grey?: boolean; o?: number; s?: number }> = ({ x, y, v, on, grey, o = 1, s = 72 }) =>
  o <= 0.001 ? null : (
    <g opacity={o < 0.999 ? o : undefined}>
      <rect x={x} y={y - s / 2} width={s} height={s} rx={10} fill={on ? rgba(C.concept, 0.85) : C.bg3}
        stroke={grey ? C.mute : C.concept} strokeWidth={2.5} strokeDasharray={grey ? '7 6' : undefined} />
      <Txt x={x + s / 2} y={y + 1} size={s * 0.58} mono weight={700} fill={on ? '#0B0F14' : grey ? C.chalk2 : C.concept}>{v}</Txt>
    </g>
  );

/** a plain arrow with a filled head, drawn on with p */
const Arr: React.FC<{ x1: number; y1: number; x2: number; y2: number; color?: string; sw?: number; p?: number; o?: number; head?: number }> = ({
  x1, y1, x2, y2, color = C.chalk2, sw = 3, p = 1, o = 1, head = 14,
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

/** a check mark, drawn on with p */
const Tick: React.FC<{ x: number; y: number; s?: number; p: number; color?: string }> = ({ x, y, s = 1, p, color = C.concept }) =>
  p <= 0.001 ? null : (
    <path d={`M ${x - 16 * s} ${y} L ${x - 4 * s} ${y + 13 * s} L ${x + 20 * s} ${y - 15 * s}`} fill="none" stroke={color} strokeWidth={6}
      strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 1`} />
  );

/** a region of a square photo frame R in design units */
const reg = (R: Rect, bb: number[]) => ({ x0: R.x + (bb[0] - bb[2] / 2) * R.w, y0: R.y + (bb[1] - bb[3] / 2) * R.h, w: bb[2] * R.w, h: bb[3] * R.h });

// ------------------------------------------------------------------ geometry
const PH1: Rect = { x: 1060, y: 360, w: 400, h: 400 };
const PH3: Rect = { x: 300, y: 330, w: 540, h: 540 };
const PH4: Rect = { x: 220, y: 380, w: 340, h: 340 };
const PH10: Rect = { x: 220, y: 350, w: 460, h: 460 };
const BILLC: [number, number, number] = [0.17, 0.3, 2.6]; // crop window around the bill: centre u, v, zoom
const PH8: Rect = { x: 220, y: 360, w: 420, h: 420 };
// slide 5: the sigmoid plot
const PL = { x: 240, y: 380, w: 620, h: 400, z0: -6, z1: 6 };
const pzx = (z: number) => PL.x + ((z - PL.z0) / (PL.z1 - PL.z0)) * PL.w;
const pvy = (v: number) => PL.y + PL.h - v * PL.h;
const SIGPATH = Array.from({ length: 81 }, (_, i) => {
  const z = PL.z0 + (i / 80) * (PL.z1 - PL.z0);
  return `${i ? 'L' : 'M'} ${pzx(z).toFixed(1)} ${pvy(sig(z)).toFixed(1)}`;
}).join(' ');
// slide 6: the reliability sketch
const AX = { x: 300, y: 370, s: 440 };
const relY = (p: number) => 0.32 * p + 0.36 * p * p; // the "unchecked" curve, a shape only (no data)
const RELPATH = Array.from({ length: 41 }, (_, i) => {
  const p = i / 40;
  return `${i ? 'L' : 'M'} ${(AX.x + p * AX.s).toFixed(1)} ${(AX.y + AX.s - relY(p) * AX.s).toFixed(1)}`;
}).join(' ');
// slide 7: rows of the categorical vectors
const R7 = { y: 372, h: 66 };
// slide 11: recap rows
const RECAP: { name: string; tex: string; ex: string }[] = [
  { name: 'binary', tex: '\\ccon{c_j} \\in \\{0,\\ 1\\}', ex: 'grey wingtip: {c:1}' },
  { name: 'soft', tex: '\\ch_j = \\sigma(z_j)', ex: `logit ${ZW.toFixed(1)} gives {c:${sig(ZW).toFixed(2)}}` },
  { name: 'categorical', tex: '\\ch_{\\text{wing}} = \\operatorname{softmax}(\\mathbf{z})', ex: `grey {c:${CATP[0].toFixed(2)}}, scores sum to 1` },
  { name: 'continuous', tex: '\\ch_{\\text{bill}} \\in \\mathbb{R}', ex: `bill length {c:${BILL_MM} mm}` },
  { name: 'vector or distribution', tex: '\\ch_j \\in \\mathbb{R}^m,\\ \\ p(\\ccon{c_j} \\mid \\cin{x})', ex: 'more in Part 10' },
  { name: 'unknown', tex: '\\ccon{c_j} = \\cmu{\\varnothing}', ex: '{m:not visible}, not absent' },
];
const RCY = (i: number) => 384 + i * 88;
// slides 12, 13: the schematic EEG
const W12 = { x: 260, y: 400, w: 1400, h: 250, t0: 2, t1: 5.5 };
const w12 = (s: number) => W12.x + ((s - W12.t0) / (W12.t1 - W12.t0)) * W12.w;
const W13 = { x: 260, y: 430, w: 1400, h: 250, t0: 2.9, t1: 4.9 };
const w13 = (s: number) => W13.x + ((s - W13.t0) / (W13.t1 - W13.t0)) * W13.w;
// slide 15: three claim cards
const CX15 = [480, 960, 1440], CW15 = 400, CY15 = 350, CH15 = 400;

export const S03: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.4) => inv(x, x + d, t);
  const NB = P.beats.length;
  /** slide k: fades in on the beat's first words, fades out (0.3 s) just before the next beat */
  const sl = (k: number) => inv(b(k) - 0.05, b(k) + 0.25, t) * (k < NB ? 1 - inv(b(k + 1) - 0.35, b(k + 1) - 0.05, t) : 1);
  void be;

  // ---------------- 3.1 motivation
  const n1 = at(w(1, 'neuron') - 0.2, 0.5);
  const tag1 = E.back(inv(w(1, 'name'), w(1, 'name') + 0.45, t));
  const fall1 = E.in(inv(w(1, 'promise') - 0.1, w(1, 'promise') + 0.8, t));
  const cap1 = at(w(1, 'attached') - 0.1);
  const ph1 = at(w(1, 'promise') - 0.1, 0.5);
  const reg1 = inv(w(1, 'promise') + 0.2, w(1, 'promise') + 0.9, t);
  const per1 = at(w(1, 'person') - 0.1);
  const look1 = inv(w(1, 'check') - 0.1, w(1, 'check') + 0.5, t);
  const tick1 = inv(w(1, 'claim'), w(1, 'claim') + 0.5, t);
  const cap1b = at(w(1, 'input') - 0.3);

  // ---------------- 3.2 meaning
  const tr2 = at(b(2) - 0.05, 0.3);
  const card2 = at(w(2, 'example') - 0.1, 0.5);
  const def2 = at(w(2, 'tips') - 0.2, 0.5);
  const per2 = at(w(2, 'expert') - 0.2);

  // ---------------- 3.3 grounding
  const ph3 = at(w(3, 'where') - 0.2, 0.5);
  const wing3 = inv(w(3, 'this'), w(3, 'this') + 0.8, t);
  const glow3 = Math.sin(Math.PI * inv(w(3, 'feathers') - 0.1, w(3, 'feathers') + 0.8, t));
  const t3a = at(w(3, 'estimate') - 0.1);
  const water3 = at(w(3, 'water'), 0.4), rock3 = at(w(3, 'rock'), 0.4);

  // ---------------- 3.4 binary
  const ph4 = at(w(4, 'representation') - 0.1, 0.5);
  const q4 = at(w(4, 'number') - 0.1);
  const yes4 = at(w(4, 'binary') - 0.1), no4 = at(w(4, 'binary') + 0.2);
  const c4one = at(w(4, 'one') - 0.15, 0.3), c4zero = at(w(4, 'zero') - 0.15, 0.3);
  const wd4 = at(w(4, 'simplest') - 0.1), eq4 = at(w(4, 'zero') - 0.3);

  // ---------------- 3.5 soft
  const ax5 = at(b(5) - 0.05, 0.3);
  const wd5 = at(w(5, 'soft') - 0.1);
  const cur5 = inv(w(5, 'sigmoid') - 0.1, w(5, 'sigmoid') + 1.0, t);
  const eq5 = at(w(5, 'sigmoid') - 0.1, 0.5);
  const pt5 = E.io(inv(w(5, '1.4') - 0.1, w(5, '1.4') + 0.8, t));
  const val5 = at(w(5, '0.80') - 0.15, 0.3);

  // ---------------- 3.6 calibration
  const ax6 = inv(b(6) - 0.05, b(6) + 0.6, t);
  const t6a = at(w(6, 'automatically') - 0.2);
  const cur6 = inv(w(6, 'calibrated') - 0.1, w(6, 'calibrated') + 1.0, t);
  const mk6 = at(w(6, 'eighty') - 0.1);
  const t6b = at(w(6, 'checked') - 0.2);

  // ---------------- 3.7 categorical
  const lab7 = at(w(7, 'list') - 0.1);
  const z7 = at(w(7, 'softmax') - 0.3);
  const arr7 = inv(w(7, 'softmax') - 0.1, w(7, 'softmax') + 0.5, t);
  const p7 = at(w(7, 'softmax') + 0.3);
  const bar7 = E.out(inv(w(7, 'options') - 0.1, w(7, 'options') + 0.7, t));
  const sum7 = at(w(7, 'sum') - 0.1);
  const wd7 = at(w(7, 'Wing') - 0.1), eq7 = at(w(7, 'sum') - 0.1, 0.5);

  // ---------------- 3.8 continuous
  const ph8 = at(b(8) - 0.05, 0.4);
  const br8 = inv(w(8, 'bill') - 0.1, w(8, 'bill') + 0.5, t);
  const rul8 = at(w(8, 'bill'), 0.5);
  const mk8 = E.out(inv(w(8, 'millimetres') - 0.1, w(8, 'millimetres') + 0.8, t));
  const wd8 = at(w(8, 'continuous') - 0.1), eq8 = at(w(8, 'millimetres') + 0.2), rg8 = at(w(8, 'regression') - 0.1);

  // ---------------- 3.9 vector or distribution
  const v9 = at(w(9, 'vector') - 0.1, 0.5);
  const d9 = inv(w(9, 'distribution') - 0.2, w(9, 'distribution') + 0.7, t);
  const eqv9 = at(w(9, 'embedding') - 0.1), eqd9 = at(w(9, 'distribution') + 0.2);
  const pt9 = at(w(9, 'Part') - 0.2);

  // ---------------- 3.10 unknown
  const ph10 = at(b(10) - 0.05, 0.4);
  const rows10 = at(w(10, 'evidence') - 0.1, 0.5);
  const rock10 = E.out(inv(w(10, 'hidden') - 0.1, w(10, 'hidden') + 0.6, t));
  const nv10 = at(w(10, 'visible') - 0.2);
  const ne10 = at(w(10, 'Unknown') - 0.1);
  const wd10 = at(w(10, 'absent') - 0.1), eq10 = at(w(10, 'say') - 0.3);

  // ---------------- 3.11 recap
  const rowT11 = [w(11, 'binary'), w(11, 'soft'), w(11, 'categorical'), w(11, 'continuous'), w(11, 'vector'), w(11, 'unknown')];
  const hd11 = at(w(11, 'six') - 0.1);

  // ---------------- 3.12 EEG
  const wave12 = inv(w(12, 'EEG') - 0.3, w(12, 'EEG') + 1.2, t);
  const sp12 = at(w(12, 'spindle') - 0.1);
  const g12 = at(w(12, 'concept') - 0.1, 0.5);

  // ---------------- 3.13 spindle zoomed
  const wave13 = at(b(13) - 0.05, 0.3);
  const hi13 = at(w(13, 'burst') - 0.1);
  const hz13 = at(w(13, '11') - 0.15);
  const dur13 = inv(w(13, 'lasting') - 0.1, w(13, 'lasting') + 0.6, t);
  const st13 = at(w(13, 'stage') - 0.3);

  // ---------------- 3.14 message
  const card14 = at(w(14, 'customer') - 0.2, 0.5);
  const hl14 = at(w(14, 'duplicate') - 0.1);
  const pill14 = at(w(14, 'reported') - 0.3);
  const mn14 = at(w(14, 'meaning') - 0.1);
  const g14 = at(w(14, 'billed') - 0.1, 0.5);

  // ---------------- 3.15 closing
  const cards15 = [at(b(15) - 0.05, 0.3), at(w(15, 'named') - 0.2, 0.3), at(w(15, 'claim') - 0.2, 0.3)];
  const ring15 = at(w(15, 'input') - 0.1, 0.5);
  const per15 = at(w(15, 'specialist') - 0.1);
  const tick15 = inv(w(15, 'check') - 0.1, w(15, 'check') + 0.5, t);

  // shared geometry
  const r3w = reg(PH3, WING), r3wa = reg(PH3, NOT_HERE.water), r3ro = reg(PH3, NOT_HERE.rock);
  const r1w = reg(PH1, WING);
  const r10w = reg(PH10, WING);
  // the bill inside the crop on slide 8
  const bu0 = Math.min(Math.max(BILLC[0] - 0.5 / BILLC[2], 0), 1 - 1 / BILLC[2]), bv0 = Math.min(Math.max(BILLC[1] - 0.5 / BILLC[2], 0), 1 - 1 / BILLC[2]);
  const bX = (u: number) => PH8.x + ((u - bu0) * BILLC[2]) * PH8.w, bY = (v: number) => PH8.y + ((v - bv0) * BILLC[2]) * PH8.h;
  const bill = { x0: bX(BILL[0] - BILL[2] / 2), x1: bX(BILL[0] + BILL[2] / 2), y0: bY(BILL[1] - BILL[3] / 2), y1: bY(BILL[1] + BILL[3] / 2) };
  const RUL = { x: 860, y: 520, w: 800, mm: 80 };
  const mmx = (v: number) => RUL.x + (v / RUL.mm) * RUL.w;

  return (
    <Stage>
      <Header t={t} part={3} title={P.title} />

      {/* ============================================================ 3.1 motivation */}
      <Slide o={sl(1)}>
        <SlideHead text={bh(P, 1)} />
        <PhotoR R={PH1} src="gull.jpg" o={ph1} />
        <Credit x={PH1.x} y={PH1.y + PH1.h + 8} text={CREDIT['gull.jpg']} o={ph1} />
        <Svg>
          <g opacity={n1 < 0.999 ? n1 : undefined}>
            {[-60, 0, 60].map((dy, i) => <line key={i} x1={400} y1={560 + dy * 1.4} x2={540} y2={560 + dy * 0.3} stroke={C.line2} strokeWidth={3} />)}
            <line x1={660} y1={560} x2={770} y2={560} stroke={C.line2} strokeWidth={3} />
            <circle cx={600} cy={560} r={58} fill={C.bg3} stroke={C.chalk2} strokeWidth={3.5} />
            {tag1 > 0.001 && fall1 < 0.999 ? (
              <g transform={`translate(0 ${fall1 * 300}) rotate(${fall1 * 38} 680 470)`} opacity={(1 - fall1) * Math.min(1, tag1)}>
                <path d="M 640 520 Q 662 490 680 470" fill="none" stroke={C.chalk2} strokeWidth={2.5} />
                <g transform={`translate(680 470) scale(${tag1})`}>
                  <Pill x={0} y={0} anchorY="bottom" text="black wingtip" color={C.concept} size={26} />
                </g>
              </g>
            ) : null}
          </g>
          <line x1={900} x2={900} y1={380} y2={800} stroke={C.line} strokeWidth={2} opacity={ph1} />
          <Region R={PH1} b={WING} color={C.concept} draw={reg1} sw={4} label="black wingtip" size={24} labelSide="bottom" />
          <Person x={1620} y={520} s={1.5} color={C.chalk2} o={per1} />
          {look1 > 0.001 ? (
            <line x1={1590} y1={500} x2={1590 - (1590 - (r1w.x0 + r1w.w)) * look1} y2={500 + (r1w.y0 + r1w.h / 2 - 500) * look1}
              stroke={C.chalk2} strokeWidth={2.5} strokeDasharray="4 8" strokeLinecap="round" />
          ) : null}
          <Tick x={1626} y={410} s={1.3} p={tick1} />
        </Svg>
        <Rich x={600} y={700} ax="center" size={30} color={C.chalk2} text="a name tag on a neuron" o={cap1} />
        <Rich x={1300} y={820} ax="center" size={32} text="a claim a person checks in the {x:input}" o={cap1b} />
      </Slide>

      {/* ============================================================ 3.2 meaning */}
      <Slide o={sl(2)}>
        <SlideHead text={bh(P, 2)} />
        <Svg>
          <g opacity={tr2}><Tracker on={0} /></g>
          <Person x={250} y={570} s={1.6} color={C.chalk2} o={per2} />
          <Txt x={250} y={640} size={24} fill={C.chalk2} o={per2}>expert</Txt>
          <g opacity={card2 < 0.999 ? card2 : undefined}>
            <rect x={380} y={420} width={1200} height={300} rx={16} fill={C.bg2} stroke={C.line2} strokeWidth={2} />
            <rect x={380} y={420} width={9} height={300} rx={4} fill={C.concept} />
            <Pill x={430} y={480} text="grey wingtip" color={C.concept} size={32} />
          </g>
        </Svg>
        <HText x={430} y={545} w={1100} size={44} lh={1.35} o={def2}>
          the tips of the folded flight feathers are <span style={{ fontWeight: 700 }}>grey</span>, not black
        </HText>
      </Slide>

      {/* ============================================================ 3.3 grounding */}
      <Slide o={sl(3)}>
        <SlideHead text={bh(P, 3)} />
        <PhotoR R={PH3} src="gull.jpg" o={ph3} />
        <Credit x={PH3.x} y={PH3.y + PH3.h + 8} text={CREDIT['gull.jpg']} o={ph3} />
        <Svg>
          <g opacity={tr2}><Tracker on={1} /></g>
          <Region R={PH3} b={WING} color={C.concept} draw={wing3} sw={4} label="wingtip" size={24} labelSide="bottom" />
          {glow3 > 0.001 ? <rect x={r3w.x0 - 6} y={r3w.y0 - 6} width={r3w.w + 12} height={r3w.h + 12} rx={14} fill={rgba(C.concept, 0.28 * glow3)} /> : null}
          {([[r3wa, water3], [r3ro, rock3]] as [ReturnType<typeof reg>, number][]).map(([r, o], k) => (o > 0.001 ? (
            <g key={k} opacity={o}>
              <rect x={r.x0} y={r.y0} width={r.w} height={r.h} rx={10} fill="rgba(8,11,15,0.3)" stroke={C.chalk2} strokeWidth={2.5} strokeDasharray="8 7" />
              <rect x={r.x0 + r.w / 2 - 66} y={r.y0 + r.h / 2 - 20} width={132} height={40} rx={8} fill="rgba(8,11,15,0.82)" />
              <Txt x={r.x0 + r.w / 2} y={r.y0 + r.h / 2} size={24} fill={C.chalk2}>not here</Txt>
            </g>
          ) : null))}
        </Svg>
        <Rich x={980} y={470} w={760} size={36} text="the {c:wingtip colour} estimate should depend on these feathers" o={t3a} />
        <Rich x={980} y={610} w={760} size={34} color={C.chalk2} text="not on the water or the rock" o={water3} />
      </Slide>

      {/* ============================================================ 3.4 binary */}
      <Slide o={sl(4)}>
        <SlideHead text={bh(P, 4)} />
        <PhotoR R={PH4} src="gull.jpg" o={ph4} />
        <Credit x={PH4.x} y={PH4.y + PH4.h + 8} text={CREDIT['gull.jpg']} o={ph4} />
        <Svg>
          <g opacity={tr2}><Tracker on={2} /></g>
          <Region R={PH4} b={WING} color={C.concept} draw={ph4} sw={3.5} />
          <Arr x1={590} y1={550} x2={680} y2={550} p={q4} />
          <Txt x={700} y={550} size={40} anchor="start" weight={600} fill={C.concept} o={q4}>grey wingtip?</Txt>
          <Arr x1={1000} y1={530} x2={1100} y2={470} p={yes4} />
          <Arr x1={1000} y1={570} x2={1100} y2={630} p={no4} />
          <Txt x={1130} y={470} size={34} anchor="start" fill={C.chalk2} o={yes4}>yes</Txt>
          <Txt x={1130} y={630} size={34} anchor="start" fill={C.chalk2} o={no4}>no</Txt>
          <Arr x1={1210} y1={470} x2={1280} y2={470} color={C.concept} p={c4one} />
          <Arr x1={1210} y1={630} x2={1280} y2={630} color={C.concept} p={c4zero} />
          <Cell x={1300} y={470} v="1" on o={c4one} />
          <Cell x={1300} y={630} v="0" o={c4zero} />
        </Svg>
        <Rich x={960} y={770} ax="center" size={32} text="the value of {c:concept j}: 0 or 1" o={wd4} />
        <Tex x={960} y={860} ax="center" size={60} tex="\ccon{c_j} \in \{0,\ 1\}" o={eq4} />
      </Slide>

      {/* ============================================================ 3.5 soft */}
      <Slide o={sl(5)}>
        <SlideHead text={bh(P, 5)} />
        <Svg>
          <g opacity={ax5}><RepDots on={1} /></g>
          <g opacity={ax5 < 0.999 ? ax5 : undefined}>
            <line x1={PL.x} y1={pvy(0)} x2={PL.x + PL.w} y2={pvy(0)} stroke={C.chalk2} strokeWidth={2.5} />
            <line x1={pzx(0)} y1={pvy(0)} x2={pzx(0)} y2={pvy(1) - 20} stroke={C.chalk2} strokeWidth={2.5} />
            <line x1={PL.x} y1={pvy(1)} x2={PL.x + PL.w} y2={pvy(1)} stroke={C.line2} strokeWidth={1.5} strokeDasharray="6 7" />
            {[-4, 4].map((z) => (
              <g key={z}>
                <line x1={pzx(z)} y1={pvy(0)} x2={pzx(z)} y2={pvy(0) + 8} stroke={C.chalk2} strokeWidth={2} />
                <Txt x={pzx(z)} y={pvy(0) + 28} size={22} mono fill={C.mute}>{String(z)}</Txt>
              </g>
            ))}
            <Txt x={pzx(0) - 14} y={pvy(1)} size={22} mono anchor="end" fill={C.mute}>1</Txt>
            <Txt x={pzx(0) - 14} y={pvy(0) - 14} size={22} mono anchor="end" fill={C.mute}>0</Txt>
            <Txt x={PL.x + PL.w} y={pvy(0) + 60} size={24} anchor="end" fill={C.chalk2}>logit</Txt>
            <MathSvg x={PL.x + PL.w + 26} y={pvy(0)} tex="z_j" size={30} />
            <MathSvg x={pzx(0)} y={pvy(1) - 46} tex="\ch_j" size={30} />
          </g>
          {cur5 > 0.001 ? <path d={SIGPATH} fill="none" stroke={C.concept} strokeWidth={4.5} pathLength={1} strokeDasharray={`${cur5} 1`} strokeLinecap="round" /> : null}
          {pt5 > 0.001 ? (
            <g>
              <line x1={pzx(ZW)} y1={pvy(0)} x2={pzx(ZW)} y2={pvy(0) - (pvy(0) - pvy(sig(ZW))) * pt5} stroke={C.chalk} strokeWidth={2.5} strokeDasharray="6 6" />
              {pt5 > 0.5 ? (
                <line x1={pzx(ZW)} y1={pvy(sig(ZW))} x2={pzx(ZW) - (pzx(ZW) - pzx(0)) * inv(0.5, 1, pt5)} y2={pvy(sig(ZW))} stroke={C.concept} strokeWidth={2.5} strokeDasharray="6 6" />
              ) : null}
              <Txt x={pzx(ZW)} y={pvy(0) + 28} size={24} mono weight={700} fill={C.chalk}>{ZW.toFixed(1)}</Txt>
              <circle cx={pzx(ZW)} cy={pvy(sig(ZW))} r={9} fill={C.concept} opacity={inv(0.4, 1, pt5)} />
            </g>
          ) : null}
          <Txt x={pzx(0) - 14} y={pvy(sig(ZW))} size={24} mono weight={700} anchor="end" fill={C.concept} o={val5}>{sig(ZW).toFixed(2)}</Txt>
        </Svg>
        <Rich x={1000} y={420} size={34} text="the {c:soft score} is the sigmoid of a logit" o={wd5} />
        <Tex x={1000} y={540} size={56} tex="\ch_j = \sigma(z_j) = \dfrac{1}{1 + e^{-z_j}}" o={eq5} />
        <Rich x={1000} y={680} size={34} text={`example: $z_j = ${ZW.toFixed(1)}$ gives $\\ch_j = ${sig(ZW).toFixed(2)}$`} o={val5} />
        <EvTag x={1760} y={880} ax="right" kind="illustrative" text="a worked logit" o={pt5} />
      </Slide>

      {/* ============================================================ 3.6 calibration */}
      <Slide o={sl(6)}>
        <SlideHead text={bh(P, 6)} />
        <Svg>
          <g opacity={ax6 > 0 ? 1 : 0}><RepDots on={1} /></g>
          {ax6 > 0.001 ? (
            <g>
              <line x1={AX.x} y1={AX.y + AX.s} x2={AX.x + AX.s * ax6} y2={AX.y + AX.s} stroke={C.chalk2} strokeWidth={2.5} />
              <line x1={AX.x} y1={AX.y + AX.s} x2={AX.x} y2={AX.y + AX.s - AX.s * ax6} stroke={C.chalk2} strokeWidth={2.5} />
              <line x1={AX.x} y1={AX.y + AX.s} x2={AX.x + AX.s * ax6} y2={AX.y + AX.s - AX.s * ax6} stroke={C.mute} strokeWidth={2.5} strokeDasharray="7 7" />
              <Txt x={AX.x + AX.s / 2} y={AX.y + AX.s + 34} size={24} fill={C.chalk2} o={ax6}>predicted score</Txt>
              <text x={0} y={0} transform={`translate(${AX.x - 30} ${AX.y + AX.s / 2}) rotate(-90)`} fontSize={24} fill={C.chalk2} textAnchor="middle"
                fontFamily={F.sans} opacity={ax6}>observed frequency</text>
              <Txt x={AX.x + AX.s - 30} y={AX.y + 10} size={24} anchor="end" fill={C.mute} o={ax6} italic>ideal</Txt>
            </g>
          ) : null}
          {cur6 > 0.001 ? <path d={RELPATH} fill="none" stroke={C.concept} strokeWidth={4} pathLength={1} strokeDasharray={`${cur6} 1`} strokeLinecap="round" /> : null}
          <Txt x={AX.x + AX.s * 0.74} y={AX.y + AX.s * 0.9} size={24} anchor="end" fill={C.concept} o={cur6} italic>unchecked</Txt>
          {mk6 > 0.001 ? (
            <g opacity={mk6}>
              <line x1={AX.x + SOFT * AX.s} y1={AX.y + AX.s} x2={AX.x + SOFT * AX.s} y2={AX.y + AX.s - SOFT * AX.s} stroke={C.chalk2} strokeWidth={2} strokeDasharray="4 6" />
              <circle cx={AX.x + SOFT * AX.s} cy={AX.y + AX.s - SOFT * AX.s} r={9} fill="none" stroke={C.chalk} strokeWidth={3} />
              <circle cx={AX.x + SOFT * AX.s} cy={AX.y + AX.s - relY(SOFT) * AX.s} r={8} fill={C.concept} />
              <Txt x={AX.x + SOFT * AX.s + 22} y={AX.y + AX.s - ((SOFT + relY(SOFT)) / 2) * AX.s} size={34} weight={700} anchor="start" fill={C.chalk}>?</Txt>
              <Txt x={AX.x + SOFT * AX.s} y={AX.y + AX.s + 62} size={22} mono fill={C.concept}>{SOFT.toFixed(1)}</Txt>
            </g>
          ) : null}
        </Svg>
        <Rich x={940} y={440} w={820} size={36} text={`{c:${SOFT.toFixed(1)}} is a score, not automatically a probability`} o={t6a} />
        <Rich x={940} y={590} w={820} size={34} color={C.chalk2} text={`check on data: do ${Math.round(SOFT * 100)} % of the cases scored {c:${SOFT.toFixed(1)}} have grey wingtips?`} o={t6b} />
        <EvTag x={1760} y={880} ax="right" kind="schematic" text="a sketch, no data" o={ax6} />
      </Slide>

      {/* ============================================================ 3.7 categorical */}
      <Slide o={sl(7)}>
        <SlideHead text={bh(P, 7)} />
        <Svg>
          <g opacity={at(b(7) - 0.05, 0.3)}><RepDots on={2} /></g>
          {CAT.map((s, i) => (
            <Txt key={s} x={560} y={R7.y + (i + 0.5) * R7.h} size={30} anchor="end" weight={i === 0 ? 700 : 500} fill={i === 0 ? C.chalk : C.chalk2} o={lab7}>{s}</Txt>
          ))}
          <MathSvg x={670} y={R7.y - 34} tex="\mathbf{z}" size={30} o={z7} />
          <VecCol x={600} y={R7.y} vals={CATZ} rowH={R7.h} w={140} size={30} color={C.chalk2} o={z7} />
          <Arr x1={765} y1={R7.y + 2 * R7.h} x2={895} y2={R7.y + 2 * R7.h} p={arr7} />
          <Txt x={830} y={R7.y + 2 * R7.h - 28} size={24} fill={C.chalk2} o={arr7}>softmax</Txt>
          <MathSvg x={990} y={R7.y - 34} tex="\ch_{\text{wing}}" size={30} o={p7} />
          <VecCol x={920} y={R7.y} vals={CATP} rowH={R7.h} w={140} size={30} digits={2} o={p7} />
          {CATP.map((v, i) => (
            <g key={i} opacity={p7}>
              <rect x={1100} y={R7.y + (i + 0.5) * R7.h - 15} width={400} height={30} rx={5} fill={C.bg3} />
              <rect x={1100} y={R7.y + (i + 0.5) * R7.h - 15} width={400 * v * bar7} height={30} rx={5} fill={C.concept} opacity={i === 0 ? 0.95 : 0.55} />
            </g>
          ))}
          <line x1={930} x2={1050} y1={R7.y + 4 * R7.h + 14} y2={R7.y + 4 * R7.h + 14} stroke={C.concept} strokeWidth={2} opacity={sum7} />
          <Txt x={1060} y={R7.y + 4 * R7.h + 38} size={28} mono anchor="end" fill={C.concept} o={sum7}>
            {`sum = ${CATP.reduce((a, v) => a + Number(v.toFixed(2)), 0).toFixed(2)}`}
          </Txt>
        </Svg>
        <Rich x={960} y={738} ax="center" size={32} text="the {c:wing colour scores} are a softmax of the logits, and they sum to 1" o={wd7} />
        <Tex x={960} y={832} ax="center" size={56} tex="\ch_{\text{wing}} = \operatorname{softmax}(\mathbf{z})" o={eq7} />
        <EvTag x={1760} y={880} ax="right" kind="illustrative" text="logits made up for the example" o={z7} />
      </Slide>

      {/* ============================================================ 3.8 continuous */}
      <Slide o={sl(8)}>
        <SlideHead text={bh(P, 8)} />
        <PhotoR R={PH8} src="gull.jpg" crop={BILLC} o={ph8} />
        <Credit x={PH8.x} y={PH8.y + PH8.h + 8} text={CREDIT['gull.jpg']} o={ph8} />
        <Svg>
          <g opacity={ph8}><RepDots on={3} /></g>
          {br8 > 0.001 ? (
            <g>
              <rect x={bill.x0 - 6} y={bill.y0 - 6} width={bill.x1 - bill.x0 + 12} height={bill.y1 - bill.y0 + 12} rx={8} fill="none" stroke={C.concept} strokeWidth={3.5}
                pathLength={1} strokeDasharray={`${br8} 1`} />
            </g>
          ) : null}
          <g opacity={rul8 < 0.999 ? rul8 : undefined}>
            <rect x={RUL.x} y={RUL.y - 30} width={RUL.w} height={60} rx={6} fill={rgba(C.concept, 0.08)} stroke={C.line2} strokeWidth={2} />
            {Array.from({ length: RUL.mm / 5 + 1 }, (_, k) => (
              <g key={k}>
                <line x1={mmx(k * 5)} y1={RUL.y + 30} x2={mmx(k * 5)} y2={RUL.y + 30 - (k % 2 === 0 ? 24 : 12)} stroke={C.chalk2} strokeWidth={2} />
                {k % 2 === 0 ? <Txt x={mmx(k * 5)} y={RUL.y + 56} size={22} mono fill={C.mute}>{String(k * 5)}</Txt> : null}
              </g>
            ))}
            <Txt x={RUL.x + RUL.w + 40} y={RUL.y + 56} size={22} mono anchor="start" fill={C.mute}>mm</Txt>
          </g>
          {mk8 > 0.001 ? (
            <g>
              <rect x={RUL.x} y={RUL.y - 30} width={(mmx(BILL_MM) - RUL.x) * mk8} height={60} rx={6} fill={rgba(C.concept, 0.35)} />
              <path d={`M ${RUL.x + (mmx(BILL_MM) - RUL.x) * mk8} ${RUL.y - 34} l -12 -20 l 24 0 Z`} fill={C.concept} />
              <Txt x={RUL.x + (mmx(BILL_MM) - RUL.x) * mk8} y={RUL.y - 80} size={34} mono weight={700} fill={C.concept} o={inv(0.6, 1, mk8)}>{`${BILL_MM} mm`}</Txt>
            </g>
          ) : null}
          <Arr x1={bill.x1 + 30} y1={(bill.y0 + bill.y1) / 2} x2={RUL.x - 20} y2={RUL.y} color={C.concept} p={mk8} sw={2.5} />
        </Svg>
        <Rich x={1260} y={660} ax="center" size={32} text="the {c:bill length} is a real number, in mm" o={wd8} />
        <Tex x={1260} y={760} ax="center" size={60} tex="\ch_{\text{bill}} \in \mathbb{R}" o={eq8} />
        <Rich x={1260} y={830} ax="center" size={30} color={C.chalk2} text="predicted by regression" o={rg8} />
        <EvTag x={1760} y={880} ax="right" kind="illustrative" text="value" o={mk8} />
      </Slide>

      {/* ============================================================ 3.9 vector or distribution */}
      <Slide o={sl(9)}>
        <SlideHead text={bh(P, 9)} />
        <Svg>
          <g opacity={at(b(9) - 0.05, 0.3)}><RepDots on={4} /></g>
          <Txt x={600} y={360} size={30} weight={700} fill={C.chalk} o={v9}>a vector (embedding)</Txt>
          <VecCol x={530} y={400} vals={EMB} rowH={60} w={140} size={30} digits={2} o={v9} />
          <Txt x={1320} y={360} size={30} weight={700} fill={C.chalk} o={d9}>a distribution</Txt>
          {d9 > 0.001 ? (() => {
            const X0 = 1090, X1 = 1550, BY = 690, HH = 240;
            const pts = Array.from({ length: 61 }, (_, i) => {
              const u = i / 60, x = X0 + u * (X1 - X0);
              const yv = Math.exp(-((u - 0.58) ** 2) / 0.018) * 0.85 + Math.exp(-((u - 0.3) ** 2) / 0.01) * 0.3;
              return `${x.toFixed(1)} ${(BY - yv * HH).toFixed(1)}`;
            });
            return (
              <g opacity={d9}>
                <line x1={X0} x2={X1} y1={BY} y2={BY} stroke={C.chalk2} strokeWidth={2.5} />
                <path d={`M ${X0} ${BY} L ${pts.join(' L ')} L ${X1} ${BY} Z`} fill={rgba(C.concept, 0.18)} stroke="none" />
                <path d={`M ${pts.join(' L ')}`} fill="none" stroke={C.concept} strokeWidth={4} pathLength={1} strokeDasharray={`${d9} 1`} />
                <Txt x={(X0 + X1) / 2} y={BY + 30} size={22} fill={C.mute}>possible values of the concept</Txt>
              </g>
            );
          })() : null}
        </Svg>
        <Tex x={600} y={800} ax="center" size={56} tex="\ch_j \in \mathbb{R}^m" o={eqv9} />
        <Rich x={960} y={800} ax="center" ay="middle" size={32} color={C.chalk2} text="or" o={eqd9} />
        <Tex x={1320} y={800} ax="center" size={56} tex="p(\ccon{c_j} \mid \cin{x})" o={eqd9} />
        <Rich x={960} y={866} ax="center" size={30} color={C.chalk2} text="we meet these in Part 10" o={pt9} />
        <EvTag x={1760} y={880} ax="right" kind="illustrative" text="values" o={v9} />
      </Slide>

      {/* ============================================================ 3.10 unknown */}
      <Slide o={sl(10)}>
        <SlideHead text={bh(P, 10)} />
        <PhotoR R={PH10} src="gull.jpg" o={ph10} />
        <Credit x={PH10.x} y={PH10.y + PH10.h + 8} text={CREDIT['gull.jpg']} o={ph10} />
        <Svg>
          <g opacity={ph10}><RepDots on={5} /></g>
          {rock10 > 0.001 ? (
            <g opacity={rock10}>
              <path d={`M ${r10w.x0 - 26} ${r10w.y0 + r10w.h + 34} L ${r10w.x0 - 10} ${r10w.y0 - 18} Q ${r10w.x0 + r10w.w * 0.4} ${r10w.y0 - 44} ${r10w.x0 + r10w.w + 18} ${r10w.y0 - 8}
                L ${r10w.x0 + r10w.w + 26} ${r10w.y0 + r10w.h + 34} Z`} fill="#3B4048" stroke={C.mute} strokeWidth={3} />
              <Txt x={r10w.x0 + r10w.w / 2} y={r10w.y0 + r10w.h / 2 + 4} size={44} weight={700} fill={C.chalk2}>?</Txt>
            </g>
          ) : null}
          <g opacity={rows10 < 0.999 ? rows10 : undefined}>
            <Txt x={1100} y={440} size={32} anchor="end" fill={C.chalk2}>present</Txt>
            <Arr x1={1120} y1={440} x2={1200} y2={440} color={C.concept} />
            <Cell x={1220} y={440} v="1" on />
            <Txt x={1100} y={550} size={32} anchor="end" fill={C.chalk2}>absent</Txt>
            <Arr x1={1120} y1={550} x2={1200} y2={550} color={C.concept} />
            <Cell x={1220} y={550} v="0" />
          </g>
          <g opacity={nv10 < 0.999 ? nv10 : undefined}>
            <Txt x={1100} y={660} size={32} anchor="end" weight={700} fill={C.chalk}>not visible</Txt>
            <Arr x1={1120} y1={660} x2={1200} y2={660} color={C.mute} />
            <rect x={1220} y={624} width={72} height={72} rx={10} fill={C.bg3} stroke={C.mute} strokeWidth={2.5} strokeDasharray="7 6" />
            <MathSvg x={1256} y={660} tex="\varnothing" size={40} color={C.chalk2} />
          </g>
          {ne10 > 0.001 ? (
            <g opacity={ne10}>
              <path d="M 1310 560 Q 1370 605 1310 650" fill="none" stroke={C.chalk} strokeWidth={3} />
              <MathSvg x={1400} y={605} tex="\neq" size={48} />
            </g>
          ) : null}
        </Svg>
        <Rich x={1180} y={760} ax="center" size={32} text="CUB label {m:not visible}: unknown, not absent" o={wd10} />
        <Tex x={1180} y={850} ax="center" size={56} tex="\ccon{c_j} = \cmu{\varnothing} \;\neq\; 0" o={eq10} />
        <EvTag x={PH10.x} y={PH10.y - 44} kind="constructed" text="wingtip covered for the example" o={rock10} />
      </Slide>

      {/* ============================================================ 3.11 recap */}
      <Slide o={sl(11)}>
        <SlideHead text={bh(P, 11)} />
        <Svg>
          <g opacity={hd11}>
            <Txt x={200} y={300} size={22} mono anchor="start" fill={C.mute}>type</Txt>
            <Txt x={640} y={300} size={22} mono anchor="start" fill={C.mute}>in symbols</Txt>
            <Txt x={1260} y={300} size={22} mono anchor="start" fill={C.mute}>example</Txt>
          </g>
          {RECAP.map((r, i) => {
            const o = at(rowT11[i] - 0.15);
            return o <= 0.001 ? null : (
              <g key={r.name} opacity={o < 0.999 ? o : undefined}>
                <line x1={180} x2={1760} y1={RCY(i) - 44} y2={RCY(i) - 44} stroke={C.line} strokeWidth={1.5} />
                <Txt x={200} y={RCY(i)} size={32} anchor="start" weight={700} fill={i === 5 ? C.chalk2 : C.chalk}>{r.name}</Txt>
              </g>
            );
          })}
        </Svg>
        {RECAP.map((r, i) => (
          <React.Fragment key={r.name}>
            <Tex x={640} y={RCY(i)} size={38} tex={r.tex} o={at(rowT11[i] - 0.15)} />
            <Rich x={1260} y={RCY(i)} ay="middle" size={30} color={C.chalk2} text={r.ex} o={at(rowT11[i] - 0.15)} />
          </React.Fragment>
        ))}
      </Slide>

      {/* ============================================================ 3.12 EEG */}
      <Slide o={sl(12)}>
        <SlideHead text={bh(P, 12)} />
        <Svg>
          <Wave x={W12.x} y={W12.y} w={W12.w} h={W12.h} ys={EEG.y} fs={EEG.fs} t0={W12.t0} t1={W12.t1} amp={80} p={wave12} axisO={wave12} color={C.input} sw={2.6}
            marks={[[SP.t0, SP.t1, C.concept, undefined, sp12]]} hiWindow={[SP.t0, SP.t1, C.concept, sp12]} />
          <Pill x={(w12(SP.t0) + w12(SP.t1)) / 2} y={W12.y - 22} anchorX="middle" anchorY="bottom" text="sleep spindle present" color={C.concept} size={28} o={sp12} />
          <Txt x={W12.x} y={W12.y - 40} size={24} anchor="start" fill={C.mute} o={wave12}>sleep EEG, one channel</Txt>
        </Svg>
        <Tex x={960} y={820} ax="center" size={46} tex="\cin{\text{EEG trace}} \;\to\; \ccon{\text{spindle present}} \;\to\; \text{sleep stage}" o={g12} />
        <EvTag x={1760} y={880} ax="right" kind="schematic" text="seeded sinusoids, not a recording" o={wave12} />
      </Slide>

      {/* ============================================================ 3.13 spindle */}
      <Slide o={sl(13)}>
        <SlideHead text={bh(P, 13)} />
        <Svg>
          <Wave x={W13.x} y={W13.y} w={W13.w} h={W13.h} ys={EEG.y} fs={EEG.fs} t0={W13.t0} t1={W13.t1} amp={95} p={1} o={wave13} axis={false} color={C.input} sw={2.8}
            marks={[[SP.t0, SP.t1, C.concept, undefined, hi13]]} hiWindow={[SP.t0, SP.t1, C.concept, hi13]} />
          <Brace x1={w13(SP.t0)} x2={w13(SP.t1)} y={W13.y - 24} down={false} color={C.concept} p={dur13} />
          <Txt x={(w13(SP.t0) + w13(SP.t1)) / 2} y={W13.y - 84} size={30} weight={600} fill={C.concept} o={dur13}>spindles last about 0.5 to 2 s</Txt>
        </Svg>
        <Rich x={960} y={730} ax="center" size={34} text="a burst of {c:11 to 16} cycles per second (Hz)" o={hz13} />
        <Rich x={960} y={810} ax="center" size={34} text="sleep scorers: a sign of {y:stage 2 sleep}" o={st13} />
        <EvTag x={1760} y={880} ax="right" kind="schematic" text={`this spindle: ${SP.hz} Hz, ${(SP.t1 - SP.t0).toFixed(0)} s; not a recording`} o={wave13} />
      </Slide>

      {/* ============================================================ 3.14 message */}
      <Slide o={sl(14)}>
        <SlideHead text={bh(P, 14)} />
        <Svg>
          <g opacity={card14 < 0.999 ? card14 : undefined}>
            <rect x={420} y={330} width={1080} height={230} rx={18} fill={C.bg2} stroke={rgba(C.input, 0.7)} strokeWidth={2.5} />
            <Txt x={450} y={364} size={22} mono anchor="start" weight={600} fill={C.mute}>CUSTOMER MESSAGE</Txt>
          </g>
          <Arr x1={960} y1={566} x2={960} y2={612} color={C.concept} p={pill14} />
          <Pill x={960} y={624} anchorX="middle" anchorY="top" text="duplicate charge reported" color={C.concept} size={30} o={pill14} />
        </Svg>
        <HText x={460} y={400} w={1000} size={40} lh={1.45} o={card14}>
          The app works, but I was{' '}
          <span style={{ background: rgba(C.concept, 0.28 * hl14 + 0.0001), borderBottom: `3px solid ${rgba(C.concept, hl14)}`, padding: '0 4px', borderRadius: 4 }}>charged twice</span>.
          Please refund the extra payment.
        </HText>
        <Rich x={960} y={712} ax="center" size={32} color={C.chalk2} text="the customer says one purchase was billed twice" o={mn14} />
        <Tex x={960} y={830} ax="center" size={46} tex="\cin{\text{message}} \;\to\; \ccon{\text{duplicate charge}} \;\to\; \text{support queue}" o={g14} />
        <EvTag x={1760} y={880} ax="right" kind="illustrative" text="an example message" o={card14} />
      </Slide>

      {/* ============================================================ 3.15 named claims */}
      <Slide o={sl(15)}>
        <SlideHead text={bh(P, 15)} />
        <PhotoR R={{ x: CX15[0] - 130, y: CY15 + 40, w: 260, h: 260 }} src="gull.jpg" o={cards15[0]} />
        <Credit x={160} y={905} text={CREDIT['gull.jpg']} o={cards15[0]} />
        <Svg>
          {CX15.map((x, k) => (cards15[k] > 0.001 ? (
            <g key={k} opacity={cards15[k] < 0.999 ? cards15[k] : undefined}>
              <rect x={x - CW15 / 2} y={CY15} width={CW15} height={CH15} rx={16} fill={rgba(C.chalk, 0.02)}
                stroke={ring15 > 0.001 ? rgba(C.concept, 0.35 + 0.65 * ring15) : C.line} strokeWidth={2.5} strokeDasharray={ring15 > 0.001 ? '12 9' : undefined} />
              <Pill x={x} y={CY15 + CH15 - 26} anchorX="middle" anchorY="bottom" text={['black wingtip', 'spindle present', 'duplicate charge'][k]} color={C.concept} size={26} />
            </g>
          ) : null))}
          <Region R={{ x: CX15[0] - 130, y: CY15 + 40, w: 260, h: 260 }} b={WING} color={C.concept} sw={3} o={cards15[0]} />
          {cards15[1] > 0.001 ? (
            <Wave x={CX15[1] - 170} y={CY15 + 90} w={340} h={160} ys={EEG.y} fs={EEG.fs} t0={2.8} t1={5} amp={55} p={1} o={cards15[1]} axis={false} color={C.input} sw={2}
              marks={[[SP.t0, SP.t1, C.concept]]} hiWindow={[SP.t0, SP.t1, C.concept, 1]} />
          ) : null}
          {[0, 1, 2].map((k) => (
            <g key={k}>
              <Person x={CX15[k] - 100} y={CY15 + CH15 + 80} s={1.2} color={C.chalk2} o={per15} />
              <Txt x={CX15[k] - 60} y={CY15 + CH15 + 84} size={26} anchor="start" fill={C.chalk2} o={per15}>{['bird expert', 'sleep scorer', 'support agent'][k]}</Txt>
              <Tick x={CX15[k] + 160} y={CY15 + CH15 + 80} p={tick15} />
            </g>
          ))}
        </Svg>
        <HText x={CX15[2]} y={CY15 + 170} w={CW15 - 30} ax="center" ay="middle" size={30} lh={1.4} align="center" o={cards15[2]}>
          “…I was <span style={{ background: rgba(C.concept, 0.28), borderBottom: `3px solid ${C.concept}`, padding: '0 4px', borderRadius: 4 }}>charged twice</span>…”
        </HText>
      </Slide>

      <ArchMap on={['c']} o={inv(0, 0.5, t)} />
    </Stage>
  );
};
