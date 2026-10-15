// s16 Part 10 · Post-hoc concept bottleneck models (Yuksekgonul et al. 2023). Review revision, 28 beats.
// Real numbers from D.worked.pcbm (CLIP ViT-B/32 on the 36 Commons photos, a teaching example).
// 16.1 motivation: a concept predictor trained from scratch (crossed out) vs a pretrained, frozen encoder (padlock).
// 16.2 to 16.3 intuition (one stage, a sketch): photos arranged in the encoder's feature space, a 'more striped'
//      direction; the bank names it (and 'a long neck'); the worked photo's distance along stripes is its score.
// 16.4 the worked photo -> frozen CLIP image encoder -> e(x) in R^512 (its real first entries and the last one).
// 16.5 to 16.9: labelled concept examples, a 2-D space, the CAV, scoring, and the alternative CLIP route.
// 16.10: dot product. 16.11: real phrase scores. 16.12 to 16.15: multi-image scaling. 16.16: bottleneck.
// 16.17 to 16.20: fit the head, inspect sparse weights, calculate an answer, then the full test-time path.
// 16.21 to 16.28: held-out photos, intervention, optional residual, comparison and summary.
// Legacy drawings use old-to-current beat mapping; the expanded primer uses current beat IDs.
import React from 'react';
import { C, F } from '../kit/theme';
import { E, HText, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, bs, be, bw, bh, clamp, inv, type SceneProps } from '../kit/core';
import { ArchMap, Block, Credit, Cross, EvTag, Flow, MathSvg, Person, PhotoR, Pill, ShareBars, VecCol, rgba, VariantCard, type VariantRows } from '../kit/cbm';
import { lerp } from '../kit/anim';
import { TexSteps } from '../kit/slots';
import { D } from '../kit/data';
import { S16Primer } from './S16Primer';
import { S16Standardisation } from './S16Standardisation';

const WK = D.worked;
const PC = WK.pcbm;
const BANK: string[] = PC.bank;
const RAW: number[] = PC.scores_raw_example;
const MEAN: number[] = PC.mean;
const STD: number[] = PC.std;
const Z: number[] = PC.z_example;
const W: number[][] = PC.W;
const B: number[] = PC.b;
const LOG: number[] = PC.logits_example;
const PRB: number[] = PC.probs_example;
const ED = PC.edit;
const HY = PC.hybrid;
const RES: number[] = HY.residual_logits_example;
const CLS: string[] = WK.classes;
const EX: string = WK.example;
const EXC = WK.photo_credit[EX];
const SIZE: Record<string, [number, number]> = WK.photo_size;
const TRAIN: string[] = WK.train;
const TEST: string[] = WK.test;
const NCORRECT = Math.round(PC.test_acc * WK.n_test);
const COLLECTIVE = '36 Wikimedia Commons photographs (CC BY-SA / CC BY / public domain)';
const FEAT_DIM = 512; // CLIP ViT-B/32 image embedding width (structural)
const sg = (v: number, d: number) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(d)}`;
const sgp = (v: number, d: number) => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(d)}`;
// e(x): the worked photo's real CLIP ViT-B/32 image feature (normalised): first entries and the last one (index 512)
const E_FIRST: number[] = D.worked.extras.example_feature_first;
const E_REAL: string[] = [...E_FIRST.slice(0, 3).map((v) => sgp(v, 3)), '⋮', sgp(D.worked.extras.example_feature_last, 3)];
const E_IDX = ['1', '2', '3', '', String(FEAT_DIM)];
const tn = (v: number, d: number) => `${v < 0 ? '-' : ''}${Math.abs(v).toFixed(d)}`;
const short = (s: string) => s.replace(/^an? /, '');

const thumbFrac = (file: string, a: number): [number, number, number, number] => {
  const [iw, ih] = SIZE[file];
  const r = ih / iw;
  if (r > a) { const s = a / r; return [0, (1 - s) / 2, 1, (1 + s) / 2]; }
  const s = r / a; return [(1 - s) / 2, 0, (1 + s) / 2, 1];
};

/** a padlock glyph centred on (x, y) */
const Lock: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) =>
  o <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o < 0.999 ? o : undefined}>
      <circle r={30} fill={C.bg} stroke={C.input} strokeWidth={2.5} />
      <path d="M -9 -2 L -9 -10 A 9 9 0 0 1 9 -10 L 9 -2" fill="none" stroke={C.chalk} strokeWidth={3.5} />
      <rect x={-13} y={-3} width={26} height={20} rx={4} fill={C.chalk} />
      <circle cx={0} cy={6} r={3} fill={C.bg} />
    </g>
  );

// ---- 16.2 and 16.3 the intuition: photos arranged in feature space along directions (a sketch, positions drawn)
const SO: [number, number] = [300, 860]; // origin of the sketch
const deg = (a: number): [number, number] => [Math.cos((a * Math.PI) / 180), -Math.sin((a * Math.PI) / 180)];
const U_ST = deg(16), U_NK = deg(68); // the stripes and long-neck directions
const at2 = (u: [number, number], d: number, e: number): [number, number] => [SO[0] + d * u[0] - e * u[1], SO[1] + d * u[1] + e * u[0]];
const L_ST = 1420, L_NK = 600;
const byCls = (c: string) => WK.train.filter((f: string) => f.startsWith(c));
const SPACE: { f: string; p: [number, number] }[] = [
  { f: byCls('zebra').find((f: string) => f !== WK.example) ?? WK.example, p: at2(U_ST, 960, -40) },
  { f: byCls('zebra').filter((f: string) => f !== WK.example)[1] ?? WK.example, p: at2(U_ST, 1200, 95) },
  { f: byCls('giraffe')[0], p: at2(U_NK, 330, 70) },
  { f: byCls('giraffe')[1], p: at2(U_NK, 480, -60) },
  { f: byCls('giraffe')[2], p: at2(U_NK, 230, -70) },
  { f: byCls('horse')[0], p: [720, 610] },
  { f: byCls('horse')[1], p: [870, 500] },
  { f: byCls('horse')[2], p: [700, 440] },
];
const EXD = 1120, EXE = -170; // the worked photo: how far along stripes, and its offset from the axis
const EXP = at2(U_ST, EXD, EXE);
const TW = 112, THH = 75; // thumbnail size

// ---- 16.8 the dot product on two entries (illustrative unit vectors)
const DE: [number, number] = D.pcbm_toy.clip.image, DV: [number, number] = D.pcbm_toy.clip.phrase;
const DOT: number = D.pcbm_toy.clip.score;
const DP = { ox: 260, oy: 820, s: 440 }; // plot origin and scale (1 unit = s px)
// ---- 16.10 the stripes score on a number line (real mean, spread and score)
const NL = { x0: 300, x1: 1620, v0: 0.17, v1: 0.3, y: 470 };
const nlx = (v: number) => NL.x0 + ((v - NL.v0) / (NL.v1 - NL.v0)) * (NL.x1 - NL.x0);
// ---- 16.21 recap: the four rows of s10 ("what changes"), plain CBM against this variant
const CMP_ROWS = ['concept source', 'detector', 'representation', 'what reaches the head'];
const CMP_CBM = ['people label every concept', 'a trained concept predictor', 'one number per concept', 'only the concept values'];
const CMP_PC = ['a concept bank of phrases', 'a frozen encoder and a projection', 'one number per concept', 'concept scores, plus a residual in PCBM-h'];
const CMP_CHANGED = [true, true, false, true];
const CT = { lx: 196, c1: 600, c1w: 540, c2: 1180, c2w: 580, hy: 330, y0: 400, rh: 112, bh: 84 };
const CompareSvg: React.FC<{ o: number; rowO: (i: number) => number; hiO: (i: number) => number; changed: boolean[] }> = ({ o, rowO, hiO, changed }) =>
  o <= 0.001 ? null : (
    <g opacity={o < 0.999 ? o : undefined}>
      <line x1={160} y1={CT.hy + 30} x2={CT.c2 + CT.c2w} y2={CT.hy + 30} stroke={C.line2} strokeWidth={2} />
      {CMP_ROWS.map((_, i) => {
        const y = CT.y0 + i * CT.rh;
        const h = changed[i] ? hiO(i) : 0;
        return (
          <g key={i} opacity={rowO(i)}>
            <rect x={CT.c1} y={y - CT.bh / 2} width={CT.c1w} height={CT.bh} rx={10} fill={C.bg2} stroke={C.line2} strokeWidth={1.5} />
            <rect x={CT.c2} y={y - CT.bh / 2} width={CT.c2w} height={CT.bh} rx={10} fill={h > 0 ? rgba(C.concept, 0.12 * h) : C.bg2}
              stroke={h > 0.5 ? C.concept : C.line2} strokeWidth={h > 0.5 ? 2.5 : 1.5} />
            {changed[i] ? <circle cx={172} cy={y} r={8} fill={C.concept} opacity={h} /> : null}
          </g>
        );
      })}
    </g>
  );
const CompareText: React.FC<{ o: number; name: string; cells: string[]; rowO: (i: number) => number; hiO: (i: number) => number; changed: boolean[] }> = ({ o, name, cells, rowO, hiO, changed }) =>
  o <= 0.001 ? null : (
    <>
      <HText x={CT.lx} y={CT.hy} ay="middle" size={24} mono weight={600} color={C.mute} o={o}>what changes</HText>
      <HText x={CT.c1 + 20} y={CT.hy} ay="middle" size={28} weight={700} color={C.chalk2} o={o}>plain CBM</HText>
      <HText x={CT.c2 + 20} y={CT.hy} ay="middle" size={28} weight={700} color={C.chalk} o={o}>{name}</HText>
      {CMP_ROWS.map((r, i) => {
        const y = CT.y0 + i * CT.rh;
        const oi = o * rowO(i);
        const h = changed[i] ? hiO(i) : 0;
        return (
          <React.Fragment key={r}>
            <HText x={CT.lx} y={y} ay="middle" size={30} weight={600} color={C.chalk} o={oi}>{r}</HText>
            <HText x={CT.c1 + 20} y={y} ay="middle" w={CT.c1w - 40} size={27} color={C.chalk2} o={oi}>{CMP_CBM[i]}</HText>
            <HText x={CT.c2 + 20} y={y} ay="middle" w={CT.c2w - 40} size={27} weight={h > 0.5 ? 700 : 500} color={h > 0.5 ? C.concept : C.chalk2} o={oi}>{cells[i]}</HText>
          </React.Fragment>
        );
      })}
    </>
  );

// final beat ("In symbols"): the variant card
const VROWS: VariantRows = {
  g: '\\ch_j = \\langle \\cin{e}(x),\\ \\ccon{v_j} \\rangle\\ \\ \\text{(}\\cin{e}\\text{ frozen, }\\ccon{v}\\text{: concept bank)}',
  c: '\\ch = (\\ch_1, \\dots, \\ch_k)\\ \\ \\text{concept projections}',
  f: '\\yh = \\fph(\\ch)\\ \\text{sparse linear}\\ \\ \\cleak{+\\,r(e(x))_{\\,\\text{PCBM-h}}}',
  train: '\\fph\\ \\text{only}\\ \\ (\\text{and } \\cleak{r} \\text{ in PCBM-h})',
  data: '\\{(x, y)\\}\\ +\\ \\text{concept bank}',
};

// ---- geometry
const PH2 = { x: 160, y: 380, w: 390, h: 260 };
const ENC2 = { x: 820, y: 510, w: 260, h: 130 };
const V2 = { x: 1200, y: 360, rh: 62, w: 150 };
const ZR = (i: number) => 360 + i * 54; // slide 5 rows
const ZX = 820, ZS = 170;
const MR = (i: number) => 366 + i * 54; // slide 7 matrix rows
const MX = 800, MCW = 140;
const ST9 = { y: 470 }; // slide 9 row
const PIPE = { y: 380, ry: 540 }; // slides 10 to 11
const TAB = { x: 640, y: 700, rh: 48, cx: [1020, 1220, 1420] };
const HO = { x0: 330, y0: 330, dx: 215, dy: 165, w: 195, h: 130 }; // slide 15: the 12 held-out photos, 2 rows of 6

export const S16: React.FC<SceneProps> = ({ t, P }) => {
  const current = (k: number) => [0, 1, 2, 3, 4, 0, 0, 0, 10, 0, 14, 16, 0, 18, 19, 21, 22, 23, 24, 25, 26, 27, 28][k];
  const b = (k: number) => bs(P, current(k));
  const w = (k: number, word: string, n = 0) => bw(P, current(k), word, n);
  const at = (x: number, d = 0.4) => inv(x, x + d, t);
  const NB = P.beats.length;
  const span = (k0: number, k1: number) => {
    const fin = inv(b(k0) - 0.05, b(k0) + 0.25, t);
    if (current(k1) >= NB) return fin;
    const z = Math.min(be(P, current(k1)) + 0.02, bs(P, current(k1) + 1) - 0.34);
    return fin * (1 - inv(z, z + 0.3, t));
  };
  const so = (k: number) => span(k, k);
  const oo = (s: number, v = 1) => s * v;

  // ---------------- 16.1
  const s1 = so(1);
  const pred1 = at(w(1, 'Instead') - 0.1, 0.5);
  const cross1 = inv(w(1, 'scratch'), w(1, 'scratch') + 0.6, t);
  const enc1 = at(w(1, 'reuse') - 0.1, 0.5);
  const lock1 = at(w(1, 'pretrained') - 0.1);
  const arr1 = E.io(inv(w(1, 'reuse') - 0.2, w(1, 'reuse') + 0.5, t));
  const l1 = at(w(1, 'nobody') - 0.1);

  // ---------------- new 16.2 and 16.3: the intuition (one stage)
  const sI = span(2, 3), i2 = so(2), i3 = so(3);
  const iPh = (k: number) => at(w(2, 'arranges') - 0.1 + k * 0.12, 0.35);
  const iDir = E.io(inv(w(2, 'directions') - 0.1, w(2, 'directions') + 0.8, t));
  const iStr = at(w(2, 'striped') - 0.1);
  const iName = at(w(3, 'names') - 0.1);
  const iEx = at(w(3, 'score') - 0.2, 0.4);
  const iProj = E.io(inv(w(3, 'far') - 0.1, w(3, 'far') + 0.9, t));
  const iQ = at(w(3, 'far') + 0.2);

  // ---------------- new 16.15 and 16.16 (inside the PCBM-h stage)
  const h15 = so(18), h16 = so(19);
  const h15a = at(w(18, 'Eight') - 0.1), h15b = at(w(18, 'rest') - 0.2), h15c = at(w(18, 'paper') - 0.1), h15d = at(w(18, 'pure') - 0.1);
  const h16e = at(w(19, 'edit') - 0.1, 0.5), h16r = at(w(19, 'directly') - 0.3), h16v = at(w(19, 'vote') - 0.1);
  const tabVis = 1 - at(b(18) - 0.34, 0.3) * (1 - at(b(20) - 0.05, 0.3));

  // ---------------- 16.2
  const s2 = so(4);
  const ph2 = at(b(4) - 0.05, 0.3);
  const enc2 = at(w(4, 'frozen') - 0.1, 0.5);
  const lock2 = at(w(4, 'frozen') + 0.2);
  const clip2 = at(w(4, 'CLIPs') - 0.1);
  const vec2 = at(w(4, 'photograph') - 0.1, 0.5);
  const eq2 = at(w(4, '512') - 0.1);

  // ---------------- 16.5
  const s5 = so(11);
  const z5 = (i: number) => E.out(inv(b(11) + 0.1 + i * 0.08, b(11) + 0.6 + i * 0.08, t));
  const hi5 = at(w(11, 'black') - 0.1);
  // ---------------- 16.8 the dot product (two entries)
  const d8 = so(8);
  const d8p = at(b(8) + 0.1, 0.5), d8e = at(w(8, 'features') - 0.1, 0.5), d8v = at(w(8, 'direction', 1) - 0.1, 0.5);
  const d8w = at(w(8, 'Multiply') - 0.1), d8f = at(w(8, 'dot') - 0.1);
  const d8proj = E.io(inv(w(8, 'products') - 0.1, w(8, 'products') + 0.8, t));
  const d8n: [string, number][] = [
    [`\\cin{${DE[0]}} \\times \\ccon{${DV[0]}}`, w(8, 'first') - 0.1],
    [`{} + \\cin{${DE[1]}} \\times \\ccon{${DV[1]}}`, w(8, 'plus') - 0.1],
  ];
  const d8r: [string, number][] = [
    [`{} = ${(DE[0] * DV[0]).toFixed(2)} + ${(DE[1] * DV[1]).toFixed(2)}`, w(8, 'second') + 0.2],
    [`{} = ${DOT.toFixed(2)}`, w(8, 'second', 1) - 0.1],
  ];
  // ---------------- 16.10 standardising, on a number line
  const n10 = so(10);
  const n10a = at(b(10) + 0.1, 0.5), n10m = at(w(10, 'Subtract') - 0.1, 0.5), n10s = at(w(10, 'divide') - 0.1, 0.5);
  const n10w = at(w(10, 'standardised') - 0.1), n10z = at(w(10, 'gives') - 0.1, 0.6);
  const eq5: [string, number][] = [
    ['\\ccon{z} = ', w(10, 'Subtract') - 0.1],
    [`\\dfrac{\\ccon{${RAW[0].toFixed(3)}} - ${MEAN[0].toFixed(3)}}{${STD[0].toFixed(3)}}`, w(10, 'divide') - 0.1],
    [`{} \\approx \\ccon{${Z[0].toFixed(2)}}`, w(10, 'gives') - 0.1],
  ];
  const tr5 = at(w(11, 'training') - 0.2);

  // ---------------- 16.7
  const s7 = so(13);
  const mat7 = at(b(13) + 0.05, 0.5);
  const zero7 = at(w(13, 'only') - 0.1);
  const litT = [w(13, 'zebra'), w(13, 'horse'), w(13, 'giraffe')];
  const lit7 = (k: number) => at(litT[k] - 0.1);
  const big7 = at(w(13, 'nonzero') - 0.2);
  const l1t = at(w(13, 'L1') - 0.1), cnt7 = at(w(13, '8') - 0.1);

  // ---------------- 16.8
  const s8 = so(14);
  const eq8: [string, number][] = [
    [`\\ccon{${Z[0].toFixed(3)}}`, w(14, 'stripes', 1) - 0.1],
    [`{} \\times \\chead{${W[0][0].toFixed(3)}}`, w(14, 'weight', 1) - 0.1],
    [`{} ${B[0] < 0 ? '-' : '+'} \\chead{${Math.abs(B[0]).toFixed(3)}}`, w(14, 'constant') - 0.1],
    [`{} \\approx ${tn(LOG[0], 3)}`, w(14, 'gives') - 0.1],
  ];
  const wd8 = at(w(14, 'stripes', 1) - 0.2);
  const lg8 = at(w(14, 'gives') - 0.2, 0.5);
  const sh8 = at(w(14, 'softmax') - 0.2, 0.7);
  // ---------------- 16.15 held-out photos
  const s15h = so(15);
  const th8 = (k: number) => at(b(15) + 0.05 + k * 0.06, 0.3);
  const tk8 = at(w(15, 'classified') - 0.1);
  const tiny8 = at(w(15, 'tiny') - 0.1);

  // ---------------- 16.9
  const s9 = so(16);
  const per9 = at(b(16) + 0.05);
  const ed9 = E.io(inv(w(16, 'Lower'), w(16, 'value') + 0.2, t));
  const cap9 = at(w(16, 'usual') - 0.1);
  const hi9 = at(w(16, 'animals'), 0.25) * (1 - at(w(16, 'animals') + 0.6, 0.4));
  const eq9 = at(w(16, 'animals') - 0.1);
  const shk9 = at(w(16, 'falls') - 0.1, 0.8);

  // ---------------- 16.10 to 16.11
  const sH = span(17, 20);
  const s10 = so(17), s11 = so(20);
  const pipe10 = at(b(17) + 0.05, 0.5);
  const res10 = at(w(17, 'residual') - 0.1, 0.5);
  const path10 = E.io(inv(w(17, 'second') - 0.1, w(17, 'second') + 0.9, t));
  const up10 = E.io(inv(w(17, 'recovers') - 0.1, w(17, 'recovers') + 0.7, t));
  const tab10 = at(w(17, 'reads') - 0.1, 0.5);
  const tabR = at(w(17, 'what') - 0.1);
  const tabT = at(w(17, 'miss') - 0.1);
  const add17 = at(w(17, 'added') - 0.1);
  const side11 = at(b(20) + 0.1);
  const ed11 = E.io(inv(w(20, 'After') - 0.1, w(20, 'edit') + 0.4, t));
  const sh11 = at(w(20, 'zebra') - 0.1, 0.7);
  const ghost11 = at(w(20, 'rather') - 0.1);
  const bec11 = at(w(20, 'because') - 0.1);
  const logC = LOG.map((v, k) => (k === 0 ? lerp(v, ED.logits[0], ed11) : v));
  const tot = logC.map((v, k) => v + RES[k]);
  const shares11 = HY.probs_example.map((v: number, k: number) => lerp(v, HY.edited_probs[k], sh11));

  // ---------------- 16.12
  const s12 = so(22);
  const legO = at(w(22, 'j') - 0.1);
  // ---------------- 16.21 recap
  const sR = so(21);
  const cmpRow = (i: number) => at(b(21) + 0.15 + i * 0.15, 0.35);
  const cmpT = [w(21, 'concepts'), w(21, 'frozen'), 0, w(21, 'hybrid')];
  const cmpHi = (i: number) => at(cmpT[i] - 0.1, 0.4);
  const cmpSame = at(w(21, 'still') - 0.1);
  const cardP = [w(22, 'g'), w(22, 'projection'), w(22, 'f', 3), w(22, 'Only'), w(22, 'images')].reduce((s, x) => s + inv(x - 0.1, x + 0.4, t), 0) / 5;


  return (
    <Stage>
      {/* ================= photos ================= */}
      {sI > 0.001 ? SPACE.map(({ f, p }, k) => (
        <PhotoR key={f} R={{ x: p[0] - TW / 2, y: p[1] - THH / 2, w: TW, h: THH }} src={`worked/${f}`} frac={thumbFrac(f, THH / TW)} o={sI * iPh(k) * (1 - 0.45 * iEx)} radius={5} shadow={false} />
      )) : null}
      <PhotoR R={{ x: EXP[0] - TW * 0.6, y: EXP[1] - THH * 0.6, w: TW * 1.2, h: THH * 1.2 }} src={`worked/${EX}`} frac={thumbFrac(EX, THH / TW)} o={oo(sI, iEx)} radius={6} />
      <PhotoR R={PH2} src={`worked/${EX}`} o={oo(s2, ph2)} />
      {s15h > 0.001 ? TEST.map((f, k) => (
        <PhotoR key={f} R={{ x: HO.x0 + (k % 6) * HO.dx, y: HO.y0 + Math.floor(k / 6) * HO.dy, w: HO.w, h: HO.h }} src={`worked/${f}`} frac={thumbFrac(f, HO.h / HO.w)} o={s15h * th8(k)} radius={6} shadow={false} />
      )) : null}

      <Svg>
        {/* ---------------- slide 1 ---------------- */}
        {s1 > 0.001 ? (
          <g opacity={s1 < 0.999 ? s1 : undefined}>
            <Block x={560} y={470} w={460} h={160} kind="concept" dash title="concept predictor" sub="trained from scratch" size={34} subSize={24} o={pred1} />
            <Cross x={350} y={410} w={420} h={120} p={cross1} o={pred1 * 0.7} />
            <Flow pts={[[820, 470], [1090, 470]]} color={C.chalk2} p={arr1} o={arr1} head={16} />
            <Block x={1360} y={470} w={460} h={160} kind="input" title="pretrained encoder" sub="already exists" size={34} subSize={24} o={enc1} />
            <Lock x={1580} y={398} o={lock1} />
          </g>
        ) : null}

        {/* ---------------- slides 2 and 3: the intuition ---------------- */}
        {sI > 0.001 ? (() => {
          const eSt: [number, number] = [SO[0] + U_ST[0] * L_ST * iDir, SO[1] + U_ST[1] * L_ST * iDir];
          const eNk: [number, number] = [SO[0] + U_NK[0] * L_NK * iDir, SO[1] + U_NK[1] * L_NK * iDir];
          const foot: [number, number] = [SO[0] + U_ST[0] * EXD, SO[1] + U_ST[1] * EXD];
          const col = iName > 0.5 ? C.concept : C.chalk2;
          return (
            <g opacity={sI < 0.999 ? sI : undefined}>
              <circle cx={SO[0]} cy={SO[1]} r={6} fill={C.input} opacity={iPh(0)} />
              {iDir > 0.001 ? (
                <g>
                  <Flow pts={[SO, eSt]} color={col} sw={iName > 0.5 ? 4 : 3} dash={iName > 0.5 ? undefined : '10 9'} head={18} />
                  <Flow pts={[SO, eNk]} color={col} sw={iName > 0.5 ? 4 : 3} dash={iName > 0.5 ? undefined : '10 9'} head={18} />
                </g>
              ) : null}
              {iProj > 0.001 ? (
                <g>
                  <line x1={EXP[0]} y1={EXP[1]} x2={lerp(EXP[0], foot[0], iProj)} y2={lerp(EXP[1], foot[1], iProj)} stroke={C.chalk2} strokeWidth={2.5} strokeDasharray="6 6" />
                  {(() => {
                    const off = 26, nx = -U_ST[1] * off, ny = U_ST[0] * off; // a measuring bar just below the axis
                    const x2 = lerp(SO[0], foot[0], iProj) + nx, y2 = lerp(SO[1], foot[1], iProj) + ny;
                    return (
                      <g>
                        <line x1={SO[0] + nx} y1={SO[1] + ny} x2={x2} y2={y2} stroke={C.concept} strokeWidth={10} strokeLinecap="round" opacity={0.85} />
                        <line x1={x2 - nx * 0.6} y1={y2 - ny * 0.6} x2={x2 + nx * 0.6} y2={y2 + ny * 0.6} stroke={C.concept} strokeWidth={4} opacity={iProj} />
                      </g>
                    );
                  })()}
                </g>
              ) : null}
            </g>
          );
        })() : null}

        {/* ---------------- slide 4 (was 2) ---------------- */}
        {s2 > 0.001 ? (
          <g opacity={s2 < 0.999 ? s2 : undefined}>
            <Flow pts={[[PH2.x + PH2.w + 10, ENC2.y], [ENC2.x - ENC2.w / 2 - 10, ENC2.y]]} color={C.input} p={enc2} t={t} live={enc2} n={2} head={14} dotR={5} />
            <Block x={ENC2.x} y={ENC2.y} w={ENC2.w} h={ENC2.h} kind="input" title="image encoder" sub="CLIP ViT-B/32" size={30} subSize={22} o={enc2} />
            <Lock x={ENC2.x + ENC2.w / 2 - 8} y={ENC2.y - ENC2.h / 2 + 4} s={0.9} o={lock2} />
            <Flow pts={[[ENC2.x + ENC2.w / 2 + 10, ENC2.y], [V2.x - 70, ENC2.y]]} color={C.input} p={vec2} t={t} live={vec2} n={1} head={14} dotR={5} />
            <VecCol x={V2.x} y={V2.y} vals={E_REAL} rowH={V2.rh} w={V2.w} size={30} color={C.input} o={vec2} />
            {E_IDX.map((s, i) => <Txt key={i} x={V2.x - 20} y={V2.y + (i + 0.5) * V2.rh} size={20} mono anchor="end" fill={C.mute} o={vec2}>{s}</Txt>)}
          </g>
        ) : null}

        {/* ---------------- slide 5: standardised scores ---------------- */}
        {s5 > 0.001 ? (
          <g opacity={s5 < 0.999 ? s5 : undefined}>
            {hi5 > 0.001 ? <rect x={300} y={ZR(0) - 25} width={ZX + ZS * Z[0] + 130 - 300} height={50} rx={10} fill={rgba(C.concept, 0.1 * hi5)} stroke={rgba(C.concept, 0.7 * hi5)} strokeWidth={2} /> : null}
            <line x1={ZX} y1={ZR(0) - 30} x2={ZX} y2={ZR(7) + 30} stroke={C.line2} strokeWidth={2} />
            {BANK.map((ph, i) => {
              const z = Z[i] * z5(i);
              return (
                <g key={ph} opacity={z5(i) > 0 ? 1 : 0}>
                  <Txt x={ZX - 40} y={ZR(i)} size={26} anchor="end" fill={C.concept} weight={i === 0 ? 700 : 500}>{short(ph)}</Txt>
                  <rect x={z >= 0 ? ZX : ZX + z * ZS} y={ZR(i) - 13} width={Math.abs(z) * ZS} height={26} rx={4} fill={C.concept} opacity={i === 0 ? 0.95 : 0.6} />
                  <Txt x={ZX + Math.max(z, 0) * ZS + 16} y={ZR(i)} size={26} anchor="start" mono weight={i === 0 ? 700 : 500} fill={C.chalk} o={z5(i)}>{sg(Z[i], 2)}</Txt>
                </g>
              );
            })}
          </g>
        ) : null}

        {/* ---------------- slide 7: the weight matrix ---------------- */}
        {s7 > 0.001 ? (
          <g opacity={s7 * mat7 < 0.999 ? s7 * mat7 : undefined}>
            {CLS.map((c, k) => <Txt key={c} x={MX + (k + 0.5) * MCW} y={MR(0) - 50} size={28} weight={600} fill={C.chalk}>{c}</Txt>)}
            <rect x={MX - 6} y={MR(0) - 30} width={3 * MCW + 12} height={8 * 54 + 6} rx={10} fill={C.headFill} stroke="#8792A2" strokeWidth={2.5} />
            {BANK.map((ph, j) => (
              <g key={ph}>
                <Txt x={MX - 26} y={MR(j)} size={26} anchor="end" fill={C.concept}>{short(ph)}</Txt>
                {CLS.map((_, k) => {
                  const v = W[k][j];
                  const nz = v !== 0;
                  const lit = nz ? lit7(k) : 0;
                  const x = MX + k * MCW + 5, y = MR(j) - 22;
                  return (
                    <g key={k}>
                      <rect x={x} y={y} width={MCW - 10} height={44} rx={6} fill={lit > 0 ? rgba(C.chalk, 0.12 + 0.2 * lit) : C.bg3} stroke={lit > 0.5 ? C.chalk : 'none'} strokeWidth={2} />
                      {nz ? <Txt x={x + (MCW - 10) / 2} y={MR(j)} size={26} mono weight={700} fill={C.chalk} o={lit}>{sgp(v, 2)}</Txt>
                        : <Txt x={x + (MCW - 10) / 2} y={MR(j)} size={22} mono fill={C.mute} o={zero7}>0</Txt>}
                    </g>
                  );
                })}
              </g>
            ))}
          </g>
        ) : null}

        {/* ---------------- slide 8: logits and shares ---------------- */}
        {s8 > 0.001 ? (
          <g opacity={s8 < 0.999 ? s8 : undefined}>
            <g opacity={lg8}>
              {CLS.map((c, k) => <Txt key={c} x={520} y={562 + k * 64} size={28} anchor="end" fill={C.chalk2}>{c}</Txt>)}
              <VecCol x={550} y={530} vals={LOG} rowH={64} w={150} size={30} digits={3} color={C.chalk} />
            </g>
            <Flow pts={[[730, 626], [900, 626]]} color={C.chalk} p={sh8} o={sh8} t={t} live={sh8} n={1} head={14} dotR={5} />
            <ShareBars x={950} y={562} labels={CLS} from={PRB} labelW={140} w={360} rowH={64} size={28} p={sh8} o={sh8} />
          </g>
        ) : null}

        {/* ---------------- slide 15: the held-out photos ---------------- */}
        {s15h > 0.001 ? (
          <g opacity={s15h < 0.999 ? s15h : undefined}>
            {TEST.map((f, k) => {
              const cx = HO.x0 + (k % 6) * HO.dx + HO.w - 4, cy = HO.y0 + Math.floor(k / 6) * HO.dy + 4;
              return (
                <g key={f} opacity={th8(k) * tk8}>
                  <circle cx={cx} cy={cy} r={16} fill={C.good} />
                  <path d={`M ${cx - 8} ${cy} l 5 6 l 11 -12`} fill="none" stroke="#0B0F14" strokeWidth={3.2} strokeLinecap="round" />
                </g>
              );
            })}
          </g>
        ) : null}

        {/* ---------------- slide 8: the dot product on two entries ---------------- */}
        {d8 > 0.001 ? (() => {
          const X = (u: number) => DP.ox + u * DP.s, Y = (v: number) => DP.oy - v * DP.s;
          const foot = DOT; // v has length 1: the foot of e on v is DOT * v
          const fx = X(DV[0] * foot), fy = Y(DV[1] * foot);
          return (
            <g opacity={d8 < 0.999 ? d8 : undefined}>
              <g opacity={d8p}>
                <line x1={DP.ox} y1={DP.oy} x2={DP.ox + DP.s + 30} y2={DP.oy} stroke={C.line2} strokeWidth={2} />
                <line x1={DP.ox} y1={DP.oy} x2={DP.ox} y2={DP.oy - DP.s - 30} stroke={C.line2} strokeWidth={2} />
                <Txt x={X(1)} y={DP.oy + 26} size={22} mono fill={C.mute}>1</Txt>
                <Txt x={DP.ox - 20} y={Y(1)} size={22} mono fill={C.mute}>1</Txt>
                <Txt x={DP.ox - 20} y={DP.oy + 22} size={22} mono fill={C.mute}>0</Txt>
              </g>
              {d8e > 0.001 ? <Flow pts={[[DP.ox, DP.oy], [lerp(DP.ox, X(DE[0]), d8e), lerp(DP.oy, Y(DE[1]), d8e)]]} color={C.input} sw={5} head={18} /> : null}
              {d8v > 0.001 ? <Flow pts={[[DP.ox, DP.oy], [lerp(DP.ox, X(DV[0]), d8v), lerp(DP.oy, Y(DV[1]), d8v)]]} color={C.concept} sw={5} head={18} /> : null}
              {d8proj > 0.001 ? (
                <g>
                  <line x1={X(DE[0])} y1={Y(DE[1])} x2={lerp(X(DE[0]), fx, d8proj)} y2={lerp(Y(DE[1]), fy, d8proj)} stroke={C.chalk2} strokeWidth={2.5} strokeDasharray="6 6" />
                  <line x1={DP.ox} y1={DP.oy} x2={lerp(DP.ox, fx, d8proj)} y2={lerp(DP.oy, fy, d8proj)} stroke={C.concept} strokeWidth={11} strokeLinecap="round" opacity={0.45} />
                </g>
              ) : null}
            </g>
          );
        })() : null}

        {/* ---------------- slide 10: standardising on a number line ---------------- */}
        {n10 > 0.001 ? (() => {
          const m = MEAN[0], sd = STD[0], r = RAW[0];
          return (
            <g opacity={n10 < 0.999 ? n10 : undefined}>
              <g opacity={n10a}>
                <line x1={NL.x0} y1={NL.y} x2={NL.x1} y2={NL.y} stroke={C.line2} strokeWidth={3} />
                {[0.2, 0.25, 0.3].map((v) => (
                  <g key={v}>
                    <line x1={nlx(v)} y1={NL.y - 10} x2={nlx(v)} y2={NL.y + 10} stroke={C.line2} strokeWidth={2} />
                    <Txt x={nlx(v)} y={NL.y + 34} size={22} mono fill={C.mute}>{v.toFixed(2)}</Txt>
                  </g>
                ))}
                <circle cx={nlx(r)} cy={NL.y} r={13} fill={C.concept} stroke={C.chalk} strokeWidth={3} />
              </g>
              <g opacity={n10m}>
                <line x1={nlx(m)} y1={NL.y - 44} x2={nlx(m)} y2={NL.y + 14} stroke={C.chalk2} strokeWidth={4} />
              </g>
              <g opacity={n10s}>
                <line x1={nlx(m)} y1={NL.y - 74} x2={nlx(m + sd)} y2={NL.y - 74} stroke={C.chalk2} strokeWidth={3} />
                <line x1={nlx(m)} y1={NL.y - 84} x2={nlx(m)} y2={NL.y - 64} stroke={C.chalk2} strokeWidth={3} />
                <line x1={nlx(m + sd)} y1={NL.y - 84} x2={nlx(m + sd)} y2={NL.y - 64} stroke={C.chalk2} strokeWidth={3} />
              </g>
              {n10z > 0.001 ? <Flow pts={[[nlx(m), NL.y + 62], [lerp(nlx(m), nlx(r), n10z), NL.y + 62]]} color={C.concept} sw={4} head={14} /> : null}
            </g>
          );
        })() : null}

        {/* ---------------- slide 9: the edit ---------------- */}
        {s9 > 0.001 ? (() => {
          const zx = 420, zs = 160;
          const z = lerp(Z[0], ED.z_to, ed9);
          const editing = ed9 > 0.001;
          const col = editing ? C.edit : C.concept;
          return (
            <g opacity={s9 < 0.999 ? s9 : undefined}>
              <Txt x={200} y={ST9.y - 60} size={28} anchor="start" weight={600} fill={editing ? C.edit : C.concept}>{BANK[0]}</Txt>
              <line x1={zx} y1={ST9.y - 30} x2={zx} y2={ST9.y + 30} stroke={C.line2} strokeWidth={2} />
              {editing ? <rect x={zx} y={ST9.y - 15} width={Z[0] * zs} height={30} rx={5} fill="none" stroke={C.concept} strokeWidth={2} strokeDasharray="5 5" opacity={0.75} /> : null}
              <rect x={z >= 0 ? zx : zx + z * zs} y={ST9.y - 15} width={Math.abs(z) * zs} height={30} rx={5} fill={col} opacity={0.92} />
              <Txt x={zx + Math.max(Z[0], 0) * zs + 24} y={ST9.y} size={30} anchor="start" mono weight={700} fill={editing ? C.edit : C.chalk}>{sg(z, 2)}</Txt>
              <Person x={240} y={ST9.y + 4} s={0.75} o={per9} />
              <Flow pts={[[820, ST9.y], [960, ST9.y]]} color={editing ? C.edit : C.concept} p={1} t={t} live={hi9} n={1} head={14} dotR={5} />
              <Block x={1080} y={ST9.y} w={200} h={130} kind="head" hi={hi9} />
              <MathSvg x={1080} y={ST9.y} tex="\fph" size={44} />
              <Flow pts={[[1186, ST9.y], [1260, ST9.y]]} color={C.chalk} p={1} t={t} live={hi9} n={1} head={14} dotR={5} />
              <ShareBars x={1290} y={ST9.y - 64} labels={CLS} from={PRB} to={ED.probs} k={shk9} labelW={120} w={220} rowH={64} size={28} />
            </g>
          );
        })() : null}

        {/* ---------------- slide 21: recap ---------------- */}
        <CompareSvg o={sR} rowO={cmpRow} hiO={cmpHi} changed={CMP_CHANGED} />

        {/* ---------------- slides 10 and 11: PCBM-h ---------------- */}
        {sH > 0.001 ? (
          <g opacity={sH < 0.999 ? sH : undefined}>
            <g opacity={pipe10}>
              <Block x={300} y={PIPE.y} w={240} h={110} kind="input" title="features" sub={`e(x), ${FEAT_DIM} numbers`} size={28} subSize={20} />
              <Flow pts={[[422, PIPE.y], [548, PIPE.y]]} color={C.input} p={1} t={t} live={1} n={1} head={13} dotR={5} />
              <Block x={680} y={PIPE.y} w={250} h={110} kind="concept" title="8 concept scores" size={26} color={h16e > 0.5 ? C.edit : undefined} />
              <Flow pts={[[807, PIPE.y], [920, PIPE.y]]} color={h16e > 0.5 ? C.edit : C.concept} p={1} t={t} live={1} n={1} head={13} dotR={5} />
              <Block x={1050} y={PIPE.y} w={240} h={110} kind="head" title="sparse head" size={26} />
              <Flow pts={[[1172, PIPE.y], [1300, PIPE.y]]} color={C.chalk} p={1} t={t} live={1} n={1} head={13} dotR={5} />
              <circle cx={1340} cy={PIPE.y} r={34} fill={C.bg2} stroke={C.chalk} strokeWidth={3} />
              <Txt x={1340} y={PIPE.y - 2} size={40} weight={700} fill={C.chalk}>+</Txt>
              <Flow pts={[[1376, PIPE.y], [1480, PIPE.y]]} color={C.chalk} p={1} t={t} live={1} n={1} head={13} dotR={5} />
              <Txt x={1500} y={PIPE.y} size={30} anchor="start" weight={700} fill={C.chalk}>shares</Txt>
            </g>
            <Flow pts={[[300, PIPE.y + 57], [300, PIPE.ry], [560, PIPE.ry]]} color={C.leak} dash="3 10" sw={4} p={path10} t={t} live={path10} n={3} head={14} dotR={5} />
            <Block x={700} y={PIPE.ry} w={270} h={100} kind="leak" title="residual" sub={`linear, reads all ${FEAT_DIM}`} size={28} subSize={20} o={res10} hi={Math.max(side11, h15 * h15b, h16 * h16r) * (0.5 + 0.5 * Math.sin(t * 4))} />
            <Flow pts={[[837, PIPE.ry], [1340, PIPE.ry], [1340, PIPE.y + 38]]} color={C.leak} dash="3 10" sw={4} p={up10} t={t} live={up10} n={3} head={14} dotR={5} />
            {/* the logits table */}
            <g opacity={tab10 * tabVis}>
              {CLS.map((c, k) => <Txt key={c} x={TAB.cx[k]} y={TAB.y - 40} size={28} weight={600} fill={C.chalk}>{c}</Txt>)}
              <Txt x={TAB.x} y={TAB.y} size={26} anchor="start" fill={ed11 > 0.05 ? C.edit : C.chalk2}>concepts</Txt>
              {logC.map((v, k) => <Txt key={k} x={TAB.cx[k]} y={TAB.y} size={28} mono weight={600} fill={k === 0 && ed11 > 0.05 ? C.edit : C.chalk}>{sg(v, 3)}</Txt>)}
              <g opacity={tabR}>
                <Txt x={TAB.x} y={TAB.y + TAB.rh} size={26} anchor="start" fill={C.leak}>+ residual</Txt>
                {RES.map((v, k) => <Txt key={k} x={TAB.cx[k]} y={TAB.y + TAB.rh} size={28} mono weight={600} fill={C.leak}>{sg(v, 3)}</Txt>)}
              </g>
              <g opacity={tabT}>
                <line x1={TAB.x} y1={TAB.y + 1.5 * TAB.rh} x2={TAB.cx[2] + 90} y2={TAB.y + 1.5 * TAB.rh} stroke={C.line2} strokeWidth={2} />
                <Txt x={TAB.x} y={TAB.y + 2 * TAB.rh} size={26} anchor="start" fill={C.chalk}>= total</Txt>
                {tot.map((v, k) => <Txt key={k} x={TAB.cx[k]} y={TAB.y + 2 * TAB.rh} size={28} mono weight={700} fill={k === 0 && ed11 > 0.05 ? C.edit : C.chalk}>{sg(v, 3)}</Txt>)}
                <Txt x={TAB.x} y={TAB.y + 3 * TAB.rh} size={26} anchor="start" weight={700} fill={C.chalk}>shares</Txt>
                {shares11.map((v: number, k: number) => <Txt key={k} x={TAB.cx[k]} y={TAB.y + 3 * TAB.rh} size={30} mono weight={700} fill={C.chalk}>{v.toFixed(2)}</Txt>)}
                {ghost11 > 0.001 ? (
                  <g opacity={ghost11}>
                    <rect x={TAB.cx[0] - 70} y={TAB.y + 3 * TAB.rh - 26} width={140} height={52} rx={8} fill="none" stroke={C.chalk} strokeWidth={2} />
                    <Txt x={TAB.cx[2] + 80} y={TAB.y + 3 * TAB.rh} size={22} anchor="start" mono fill={C.chalk2}>{`PCBM alone: ${ED.probs[0].toFixed(2)}`}</Txt>
                  </g>
                ) : null}
              </g>
            </g>
            <Person x={680} y={PIPE.y - 96} s={0.7} o={at(w(19, 'edit') - 0.3)} />
          </g>
        ) : null}
      </Svg>

      {/* ================= HTML text ================= */}
      <Header t={t} part={10} title={P.title} />

      {/* slide 1 */}
      <SlideHead text={bh(P, current(1))} o={s1} />
      <Rich x={560} y={590} ax="center" size={28} color={C.chalk2} text="needs {c:concept labels}" o={oo(s1, pred1)} />
      <Rich x={1360} y={590} ax="center" size={28} color={C.chalk2} text="{x:frozen}: never trained here" o={oo(s1, enc1)} />
      <Rich x={960} y={740} ax="center" size={34} text="no need to label every {c:concept} on every training {x:image}" o={oo(s1, l1)} />

      {/* new slides 2 and 3: the intuition */}
      <SlideHead text={bh(P, current(2))} o={i2} />
      <SlideHead text={bh(P, current(3))} o={i3} />
      <Rich x={1760} y={SO[1] + U_ST[1] * L_ST - 26} ax="right" ay="bottom" size={28} color={C.chalk2} text="more striped" o={oo(i2, iStr)} />
      <Rich x={1760} y={SO[1] + U_ST[1] * L_ST - 26} ax="right" ay="bottom" size={30} weight={700} text="{c:black and white stripes}" o={oo(i3, iName)} />
      <Rich x={SO[0] + U_NK[0] * L_NK + 24} y={SO[1] + U_NK[1] * L_NK} ay="middle" size={30} weight={700} text="{c:a long neck}" o={oo(i3, iName)} />
      <Rich x={1050} y={720} w={700} size={32} text="how far along {c:stripes} is this {x:photo}?" o={oo(i3, iQ)} />
      <Rich x={1050} y={772} w={700} size={28} color={C.chalk2} text="that distance is its {c:concept score}" o={oo(i3, iQ)} />
      <HText x={SO[0] + 40} y={SO[1] + 30} size={22} color={C.mute} o={oo(sI, iPh(0))}>{`feature space of the frozen encoder (sketch: ${FEAT_DIM} dimensions drawn as 2)`}</HText>
      <EvTag x={1760} y={890} ax="right" kind="schematic" text="photo positions drawn for teaching" o={oo(sI, iPh(0))} />

      {/* slide 4 (was 2) */}
      <SlideHead text={bh(P, current(4))} o={s2} />
      <Credit x={PH2.x} y={PH2.y + PH2.h + 10} text={`Photo: ${EXC.artist}, Wikimedia Commons, ${EXC.license}`} o={oo(s2, ph2)} />
      <Rich x={V2.x + V2.w / 2} y={300} ax="center" size={30} text="{x:image features}" o={oo(s2, vec2)} />
      <Tex x={V2.x + V2.w / 2} y={760} ax="center" size={56} tex={`\\cin{e}(\\cin{x}) \\in \\mathbb{R}^{${FEAT_DIM}}`} o={oo(s2, eq2)} />
      <Rich x={ENC2.x} y={600} ax="center" size={26} color={C.chalk2} text="{x:frozen}" o={oo(s2, clip2)} />
      <EvTag x={1760} y={890} ax="right" kind="computed" text={`CLIP ViT-B/32 image feature of this photo (normalised); 4 of ${FEAT_DIM} entries shown`} o={oo(s2, vec2)} />

      {/* new slide 8: the dot product on two entries */}
      <SlideHead text={bh(P, current(8))} o={d8} />
      <Tex x={DP.ox + DE[0] * DP.s + 14} y={DP.oy - DE[1] * DP.s - 24} size={34} tex={`\\cin{e} = (${DE[0]},\\ ${DE[1]})`} o={oo(d8, d8e)} />
      <Tex x={DP.ox + DV[0] * DP.s + 18} y={DP.oy - DV[1] * DP.s + 6} size={34} tex={`\\ccon{v} = (${DV[0]},\\ ${DV[1]})`} o={oo(d8, d8v)} />
      <Rich x={900} y={330} w={860} size={32} text="{x:features} · {c:direction} = first × first + second × second" o={oo(d8, d8w)} />
      <Tex x={900} y={430} size={52} tex="\langle \cin{e},\ \ccon{v} \rangle = \cin{e_1}\ccon{v_1} + \cin{e_2}\ccon{v_2}" o={oo(d8, d8f)} />
      <TexSteps x={900} y={560} t={t} size={44} o={d8} parts={d8n} />
      <TexSteps x={900} y={650} t={t} size={44} o={d8} parts={d8r} />
      <Rich x={900} y={740} w={860} size={28} color={C.chalk2} text={`the dot product; CLIP does the same over ${FEAT_DIM} entries`} o={oo(d8, at(w(8, 'second', 1) - 0.1))} />
      <EvTag x={1760} y={890} ax="right" kind="illustrative" text={`two entries instead of ${FEAT_DIM}`} o={oo(d8, d8e)} />

      {/* new slide 10: standardising */}
      <SlideHead text={bh(P, current(10))} o={n10} />
      <Rich x={nlx(RAW[0])} y={NL.y - 30} ax="center" ay="bottom" size={26} text={`{c:this photo ${RAW[0].toFixed(3)}}`} o={oo(n10, n10a)} />
      <Rich x={nlx(MEAN[0]) - 16} y={NL.y - 12} ax="right" ay="bottom" size={26} color={C.chalk2} text={`training mean ${MEAN[0].toFixed(3)}`} o={oo(n10, n10m)} />
      <Rich x={(nlx(MEAN[0]) + nlx(MEAN[0] + STD[0])) / 2} y={NL.y - 92} ax="center" ay="bottom" size={26} color={C.chalk2} text={`one spread ${STD[0].toFixed(3)}`} o={oo(n10, n10s)} />
      <Rich x={(nlx(MEAN[0]) + nlx(RAW[0])) / 2} y={NL.y + 84} ax="center" size={26} text={`{c:${Z[0].toFixed(2)} spreads above the mean}`} o={oo(n10, n10z)} />
      <Rich x={960} y={620} ax="center" size={32} text="{c:standardised score} = (score − training mean) ÷ training spread" o={oo(n10, n10w)} />
      <TexSteps x={960} y={760} ax="center" t={t} size={48} o={n10} parts={eq5} />
      <EvTag x={1760} y={890} ax="right" kind="computed" text={`stripes scores, mean and spread over the ${WK.n_train} training photos`} o={oo(n10, n10a)} />

      {/* slide 5 */}
      <SlideHead text={bh(P, current(11))} o={s5} />
      <Rich x={300} y={300} size={28} color={C.chalk2} text="{c:concept scores} for this photo, standardised" o={oo(s5, z5(0))} />
      <Rich x={1220} y={480} w={520} size={30} color={C.chalk2} text="each bar: (score − training mean) ÷ training spread" o={oo(s5, z5(0))} />
      <Rich x={1220} y={600} w={520} size={30} text={`{c:stripes}: ${Z[0].toFixed(2)} spreads above its average`} o={oo(s5, tr5)} />
      <EvTag x={1760} y={890} ax="right" kind="computed" text="CLIP ViT-B/32 on 36 Commons photos, teaching example" o={oo(s5, z5(0))} />

      {/* slide 7 */}
      <SlideHead text={bh(P, current(13))} o={s7} />
      <HText x={1500} y={480} ax="center" size={96} mono weight={700} o={oo(s7, big7)}>{`${PC.nonzero} / ${PC.total_weights}`}</HText>
      <Rich x={1500} y={600} ax="center" size={30} color={C.chalk2} text="{f:weights} are non-zero" o={oo(s7, big7)} />
      <Rich x={1500} y={360} ax="center" size={28} color={C.chalk2} text="8 concepts × 3 classes = 24 weights" o={oo(s7, cnt7)} />
      <Rich x={1500} y={700} ax="center" w={440} size={28} color={C.chalk2} text="L1 penalty: the size of every weight is added to the loss" o={oo(s7, l1t)} />
      <EvTag x={1760} y={890} ax="right" kind="computed" text="L1 logistic head fit on 24 photos" o={oo(s7, mat7)} />

      {/* slide 8 */}
      <SlideHead text={bh(P, current(14))} o={s8} />
      <Rich x={200} y={320} size={32} text="{c:stripes score} × {f:weight} + {f:constant} = {y:zebra score}" o={oo(s8, wd8)} />
      <TexSteps x={200} y={420} t={t} size={46} o={s8} parts={eq8} />
      <Rich x={625} y={760} ax="center" size={26} color={C.chalk2} text="class scores" o={oo(s8, lg8)} />
      <Rich x={1130} y={760} ax="center" size={26} color={C.chalk2} text="shares, after the softmax" o={oo(s8, sh8)} />
      <EvTag x={1760} y={890} ax="right" kind="computed" text="CLIP ViT-B/32 on 36 Commons photos" o={oo(s8, lg8)} />

      {/* new slide 15: held-out photos */}
      <SlideHead text={bh(P, current(15))} o={s15h} />
      <Rich x={960} y={720} ax="center" size={34} text={`{y:${NCORRECT} of ${WK.n_test}} held-out photos correct`} o={oo(s15h, tk8)} />
      <Rich x={960} y={780} ax="center" size={28} color={C.chalk2} text="a tiny teaching example, not a benchmark" o={oo(s15h, tiny8)} />
      <Credit x={HO.x0} y={HO.y0 + HO.dy + HO.h + 10} text={COLLECTIVE} o={oo(s15h, th8(0))} />

      {/* slide 9 */}
      <SlideHead text={bh(P, current(16))} o={s9} />
      <Rich x={200} y={560} w={760} size={28} color={C.chalk2} text={`set to {e:${sg(ED.z_to, 2)}}, its mean on non-zebra training photos`} o={oo(s9, cap9)} />
      <Tex x={960} y={720} ax="center" size={50} tex={`\\cedit{${tn(ED.z_to, 3)}} \\times \\chead{${W[0][0].toFixed(3)}} ${B[0] < 0 ? '-' : '+'} \\chead{${Math.abs(B[0]).toFixed(3)}} \\approx \\cedit{${tn(ED.logits[0], 3)}}`} o={oo(s9, eq9)} />
      <Rich x={960} y={790} ax="center" size={28} color={C.chalk2} text="the new zebra logit; the photo and the head stay the same" o={oo(s9, eq9)} />
      <EvTag x={1760} y={890} ax="right" kind="computed" text="the same head, one score edited" o={oo(s9, per9)} />

      {/* new slides 15 and 16, on the PCBM-h stage */}
      <SlideHead text={bh(P, current(18))} o={h15} />
      <SlideHead text={bh(P, current(19))} o={h16} />
      <Rich x={300} y={PIPE.ry + 80} size={26} color={C.leak} text="evidence no phrase names" o={oo(h15, h15b)} />
      <Rich x={300} y={720} w={1300} size={32} text="eight phrases cannot describe everything the {x:encoder} sees" o={oo(h15, h15a)} />
      <Rich x={300} y={772} w={1300} size={32} text="the {k:residual} picks up the rest" o={oo(h15, h15b)} />
      <Rich x={300} y={836} size={28} color={C.chalk2} text="in the paper: {k:PCBM-h} comes close to the original model; PCBM alone falls behind" o={oo(h15, h15c)} />
      <EvTag x={1760} y={900} ax="right" kind="reported" text="Yuksekgonul et al., ICLR 2023, Table 1" o={oo(h15, h15c)} />
      <Rich x={300} y={720} w={1300} size={32} text="an {e:edit} changes a {c:concept score}" o={oo(h16, h16e)} />
      <Rich x={300} y={772} w={1300} size={32} text="the {k:residual} reads the raw {x:features} directly, so the edit never reaches it" o={oo(h16, h16r)} />
      <Rich x={1380} y={PIPE.ry - 20} size={28} color={C.leak} text="still votes for zebra" o={oo(h16, h16v)} />

      {/* slides 14 and 17 */}
      <SlideHead text={bh(P, current(17))} o={s10} />
      <SlideHead text={bh(P, current(20))} o={s11} />
      <Rich x={1500} y={PIPE.ry - 20} w={300} size={26} color={C.chalk2} text="class scores are added, then the softmax" o={oo(s10, add17)} />
      <Rich x={1500} y={PIPE.ry - 40} w={300} size={28} text="part of the evidence {k:never passed through a named concept}" o={oo(s11, bec11)} />
      <EvTag x={TAB.x} y={TAB.y + 3 * TAB.rh + 40} kind="computed" text="CLIP ViT-B/32 on 36 Commons photos, teaching example" o={oo(sH, tab10 * tabVis)} />

      {/* slide 18 */}
      <SlideHead text={bh(P, current(22))} o={s12} />
      <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.86)', transformOrigin: '960px 290px' }}>
        <VariantCard name="Post-hoc CBM (Yuksekgonul et al., ICLR 2023)" rows={VROWS} o={s12} p={cardP} y0={290} />
      </div>
      <Rich x={960} y={912} ax="center" size={28} color={C.chalk2} text="$j$: one concept   ·   $k$: number of concepts   ·   $\cleak{r}$: the residual" o={oo(s12, legO)} />

      {/* new slide 21: recap against the plain CBM */}
      <SlideHead text={bh(P, current(21))} o={sR} />
      <CompareText o={sR} name="post-hoc CBM" cells={CMP_PC} rowO={cmpRow} hiO={cmpHi} changed={CMP_CHANGED} />
      <Rich x={196} y={850} size={30} color={C.chalk2} text="{c:3 of 4} changed; each concept is still one number" o={oo(sR, cmpSame)} />

      <S16Primer t={t} P={P} />
      <S16Standardisation t={t} P={P} />
      <ArchMap on={['g', 'c']} o={inv(0, 0.5, t)} />
    </Stage>
  );
};
