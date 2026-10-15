// s15 Part 10 · Concept embedding models (Espinosa Zarlenga et al. 2022). Revision 2 + intuition, 15 beats.
// Illustrative numbers from D.worked.cem (hand-chosen 2-D embeddings, three concepts, the worked zebra photo).
// 15.1 the narrow channel: photo -> encoder -> one number per concept; Part 8 callback (same values, D.incomplete).
// 15.2 intuition: two prototypes (stripes absent / present) and a dimmer whose knob slides the concept between them.
// 15.3 the prototypes are computed from each image: photos A and B give different pairs (illustrative positions).
// 15.4 to 15.7 one stage, the stripes plane: c+ (active) and c- (inactive) with their vectors; the probability p;
//      the mixing rule in words, then symbols (the point sweeps the segment); p = 0.1 -> (0.28, 0.70), computed.
// 15.8 to 15.9 one stage: three mixed points -> 6 numbers -> head -> shares (D.worked.cem.probs); amber edit p -> 1:
//      the point slides to c+, the vector updates, the head pulses, shares move to probs_edit.
// 15.10 RandInt: during training dice replace some predicted p with the true 0 / 1; loss and coral gradients.
// 15.11 gain: one number vs a vector per concept.
// 15.12 when it helps: Part 8's blue circle and square get the same values (blue 1, large 0), so one output for both.
// 15.13 with embeddings, the 'blue' vector differs per image, so a head can separate class A and class B.
// 15.14 cost: the coordinates have no names.
// 15.15 recap: s10's four rows, plain CBM vs CEM, the two changed rows in teal.   15.16 the VariantCard (+ symbol legend).
import React from 'react';
import { C, F } from '../kit/theme';
import { E, HText, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, bs, be, bw, bh, clamp, inv, type SceneProps } from '../kit/core';
import { ArchMap, Block, ConceptRow, Credit, EvTag, Flow, MathSvg, Person, PhotoR, ShareBars, VecCol, rgba, VariantCard, type VariantRows } from '../kit/cbm';
import { lerp } from '../kit/anim';
import { TexSteps } from '../kit/slots';
import { D } from '../kit/data';

const CEM = D.worked.cem;
const NAMES: string[] = CEM.concepts;
const CP: [number, number][] = NAMES.map((n) => CEM.c_plus[n]);
const CM: [number, number][] = NAMES.map((n) => CEM.c_minus[n]);
const PV: number[] = NAMES.map((n) => CEM.p[n]);
const EMB: number[] = CEM.embedding;
const EMB_E: number[] = CEM.embedding_edit;
const PR: number[] = CEM.probs;
const PRE: number[] = CEM.probs_edit;
const CLS: string[] = D.worked.classes;
const EX: string = D.worked.example;
const EXC = D.worked.photo_credit[EX];
const TRUE01 = [1, 1, 0]; // the zebra's true binary concept labels: stripes yes, horse-like shape yes, long neck no
const INC = D.incomplete;
const COLLECTIVE = '36 Wikimedia Commons photographs (CC BY-SA / CC BY / public domain)';
const SHAPE_BLUE = '#3B6FD8'; // the physical object colour of Part 8's shapes (not a role colour)
const M_CUB = 16; // embedding size per concept in the CEM paper's CUB model (docs/lineage_facts.md, literature constant)

const f2 = (v: number) => v.toFixed(2);
const f1 = (v: number) => String(Number(v.toFixed(2)));
const mix = (i: number, p: number): [number, number] => [lerp(CM[i][0], CP[i][0], p), lerp(CM[i][1], CP[i][1], p)];
const col2 = (a: number, b: number) => `\\begin{bmatrix}${f2(a)}\\\\ ${f2(b)}\\end{bmatrix}`;

/** a concept plane: the c- / c+ segment, the two points, an optional mixed point; (x, y) top-left, s side */
const Plane: React.FC<{
  x: number; y: number; s: number; i: number; o?: number; pts?: number; ptsM?: number; mixP?: number | null; mixCol?: string; q?: number; seg?: number; ticks?: boolean;
}> = ({ x, y, s, i, o = 1, pts = 1, ptsM, mixP = null, mixCol = C.concept, q = 0, seg = 1, ticks = false }) => {
  if (o <= 0.001) return null;
  const X = (u: number) => x + u * s, Y = (v: number) => y + (1 - v) * s;
  const m = mixP === null ? null : mix(i, mixP);
  const r = s > 300 ? 1 : 0.75;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <rect x={x} y={y} width={s} height={s} rx={10} fill={rgba(C.concept, 0.05)} stroke={rgba(C.concept, 0.55)} strokeWidth={2} />
      {[0.25, 0.5, 0.75].map((g) => (
        <g key={g} opacity={0.5}>
          <line x1={x} y1={y + g * s} x2={x + s} y2={y + g * s} stroke={C.line} strokeWidth={1.5} />
          <line x1={x + g * s} y1={y} x2={x + g * s} y2={y + s} stroke={C.line} strokeWidth={1.5} />
        </g>
      ))}
      {ticks ? (
        <g>
          <Txt x={x} y={y + s + 22} size={20} mono fill={C.mute}>0</Txt>
          <Txt x={x + s} y={y + s + 22} size={20} mono fill={C.mute}>1</Txt>
          <Txt x={x - 18} y={y} size={20} mono fill={C.mute}>1</Txt>
        </g>
      ) : null}
      <line x1={X(CP[i][0])} y1={Y(CP[i][1])} x2={X(CM[i][0])} y2={Y(CM[i][1])} stroke={C.concept} strokeWidth={2.5} strokeDasharray="6 7" opacity={0.75 * seg * Math.min(pts, ptsM ?? pts)} />
      <circle cx={X(CP[i][0])} cy={Y(CP[i][1])} r={11 * r} fill={C.concept} opacity={pts} />
      <circle cx={X(CM[i][0])} cy={Y(CM[i][1])} r={10 * r} fill={C.bg} stroke={C.concept} strokeWidth={3.5} opacity={ptsM ?? pts} />
      {m ? (
        <g>
          <circle cx={X(m[0])} cy={Y(m[1])} r={22 * r} fill={rgba(mixCol, 0.22)} />
          <circle cx={X(m[0])} cy={Y(m[1])} r={9 * r} fill={mixCol} stroke={C.chalk} strokeWidth={3} />
        </g>
      ) : null}
      {q > 0.001 ? (
        <g opacity={q}>
          <Txt x={x + s / 2} y={y + s + 26} size={s > 300 ? 30 : 22} weight={700} fill={C.chalk}>?</Txt>
          <Txt x={x - 24} y={y + s / 2} size={s > 300 ? 30 : 22} weight={700} fill={C.chalk}>?</Txt>
        </g>
      ) : null}
    </g>
  );
};

/** a die glyph (face 1..6) centred on (x, y) */
const PIPS: Record<number, [number, number][]> = {
  1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
  5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
};
const Die: React.FC<{ x: number; y: number; face: number; rot?: number; o?: number; color?: string; s?: number }> = ({ x, y, face, rot = 0, o = 1, color = C.chalk2, s = 1 }) =>
  o <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`} opacity={o < 0.999 ? o : undefined}>
      <rect x={-19} y={-19} width={38} height={38} rx={8} fill={C.bg3} stroke={color} strokeWidth={2.5} />
      {PIPS[face].map(([a, b2], k) => <circle key={k} cx={a * 10} cy={b2 * 10} r={3.6} fill={color} />)}
    </g>
  );

// ---- 15.15 recap: the four rows of s10 ("what changes"), plain CBM against this variant
const CMP_ROWS = ['concept source', 'detector', 'representation', 'what reaches the head'];
const CMP_CBM = ['people label every concept', 'a trained concept predictor', 'one number per concept', 'only the concept values'];
const CMP_CEM = ['people label every concept', 'a trained concept predictor', 'a vector per concept', 'the mixed vectors'];
const CMP_CHANGED = [false, false, true, true];
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
  g: '\\gth: x \\mapsto (\\ccon{p_j},\\ \\ccon{c_j^{+}},\\ \\ccon{c_j^{-}})',
  c: '\\ch_j = \\ccon{p_j}\\,\\ccon{c_j^{+}} + (1-\\ccon{p_j})\\,\\ccon{c_j^{-}} \\in \\mathbb{R}^m',
  f: '\\yh = \\fph(\\ch_1, \\dots, \\ch_k)',
  train: '\\gth,\\ \\fph\\ \\ \\text{(RandInt: random interventions)}',
  data: '\\{(x,\\ \\ccon{c},\\ y)\\}\\ \\ \\text{images, concept labels, class labels}',
};

// ---- 15.2 and 15.3: the intuition (prototypes and a dimmer); 15.12 and 15.13: Part 8's circle and square
const DIM = { x0: 560, x1: 1360, y: 510, ky: 740 }; // prototype segment and the dimmer track below it
const OTHER: string = D.worked.train.find((f: string) => f.startsWith('zebra') && f !== EX) ?? EX;
const PAIR_B = { cp: [0.9, 0.48] as [number, number], cm: [0.32, 0.9] as [number, number] }; // a second photo's prototypes (illustrative positions)
const P3 = { x: 960, y: 330, s: 440 }; // slide 3 plane
const PA = { x: 160, y: 330, w: 270, h: 180 }, PB = { x: 160, y: 590, w: 270, h: 180 }; // slide 3 photos
const SH = { cx: 290, ys: [430, 690], r: 62 }; // slides 12 and 13: circle and square
const SQ_B = { circle: [0.72, 0.68] as [number, number], square: [0.9, 0.3] as [number, number] }; // 'blue' embeddings per shape (illustrative)
const HD = { x: 1240, y: 560, w: 180, h: 120 };
const SAME_OUT = INC.objects.map((o: { y: string }) => o.y);
const SHAPE_OUT_X = 1420;

/** a blue circle or square (the physical object colour of Part 8, not a role colour) */
const Shape: React.FC<{ kind: string; x: number; y: number; r: number; o?: number }> = ({ kind, x, y, r, o = 1 }) =>
  o <= 0.001 ? null : kind === 'circle'
    ? <circle cx={x} cy={y} r={r} fill={SHAPE_BLUE} opacity={o < 0.999 ? o : undefined} />
    : <rect x={x - r * 0.9} y={y - r * 0.9} width={r * 1.8} height={r * 1.8} rx={4} fill={SHAPE_BLUE} opacity={o < 0.999 ? o : undefined} />;

// ---- geometry
const PH1 = { x: 160, y: 340, w: 300, h: 200 };
const ENC1 = { x: 660, y: 440, w: 220, h: 110 };
const ROW1 = [370, 440, 510];
const PH2 = { x: 160, y: 320, w: 240, h: 160 };
const ENC2 = { x: 280, y: 640, w: 240, h: 100 };
const PL = { x: 600, y: 330, s: 400 };
const RX = 1110; // right panel, slides 2 to 5
const P6 = { x: 180, s: 160, ys: [330, 530, 730] };
const V6 = { x: 800, y: 400, rh: 54, w: 130 };
const H6 = { x: 1110, y: 562, w: 170, h: 120 };
const S6X = 1300;
const R8 = [430, 550, 670];
const H8 = { x: 1230, y: 550, w: 170, h: 120 };
const L8 = { x: 1530, y: 550, w: 220, h: 110 };

export const S15: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.4) => inv(x, x + d, t);
  const NB = P.beats.length;
  const span = (k0: number, k1: number) => {
    const fin = inv(b(k0) - 0.05, b(k0) + 0.25, t);
    if (k1 >= NB) return fin;
    const z = Math.min(be(P, k1) + 0.02, b(k1 + 1) - 0.34);
    return fin * (1 - inv(z, z + 0.3, t));
  };
  const so = (k: number) => span(k, k);
  const oo = (s: number, v = 1) => s * v;

  // ---------------- 15.1 narrow channel
  const s1 = so(1);
  const enc1 = at(b(1) + 0.1, 0.5);
  const rowO = (i: number) => at(w(1, 'One') + i * 0.2);
  const narrow = at(w(1, 'narrow') - 0.1);
  const p8 = at(w(1, 'vocabulary') - 0.1, 0.5);
  const p8acc = at(w(1, 'accuracy') - 0.1);

  // ---------------- 15.2 intuition: two prototypes and a dimmer
  const n2 = so(2);
  const n2a = at(w(2, 'prototype') - 0.2, 0.5), n2p = at(w(2, 'present') - 0.15), n2m = at(w(2, 'absent') - 0.15);
  const n2d = at(w(2, 'dimmer') - 0.2, 0.5);
  const sw2a = w(2, 'slides'), sw2b = be(P, 2) - 0.2;
  const dimP = t < sw2a ? 0.5 : (() => {
    const u = inv(sw2a, sw2b, t);
    return u < 0.45 ? lerp(0.5, 0.95, E.io(u / 0.45)) : lerp(0.95, 0.15, E.io((u - 0.45) / 0.55));
  })();

  // ---------------- 15.3 the prototypes come from the image
  const n3 = so(3);
  const n3a = at(b(3) - 0.05, 0.4), n3b = at(w(3, 'differ') - 0.2, 0.5);
  const n3mix = at(w(3, 'detail') - 0.2, 0.5);
  const n3l1 = at(w(3, 'computed') - 0.1), n3l2 = at(w(3, 'detail') - 0.1);

  // ---------------- 15.12 and 15.13 when it helps: Part 8's circle and square
  const n12 = so(12), n13 = so(13);
  const n12s = at(w(12, 'circle') - 0.2, 0.4), n12q = at(w(12, 'square') - 0.2, 0.4);
  const n12v = at(w(12, 'same') - 0.2, 0.5), n12h = at(w(12, 'head') - 0.2, 0.5), n12x = at(w(12, 'apart') - 0.2);
  const n13v = at(w(13, 'computed') - 0.2, 0.5), n13d = at(w(13, 'differ') - 0.1, 0.6);
  const n13h = at(w(13, 'reach') - 0.2, 0.5), n13n = at(w(13, 'named') - 0.2);

  // ---------------- 15.4 to 15.7 the stripes plane
  const sP = span(4, 7);
  const s2 = so(4), s3 = so(5), s4 = so(6), s5 = so(7);
  const encO = at(w(4, 'image') - 0.2, 0.5);
  const cpO = at(w(4, 'active') - 0.1), cmO = at(w(4, 'inactive') - 0.1);
  const every2 = at(w(4, 'every') - 0.1);
  const g3 = at(w(5, 'probability') - 0.2, 0.5);
  const g3v = E.io(inv(w(5, '0.1') - 0.3, w(5, '0.1') + 0.5, t));
  const g3m = at(w(5, 'misses') - 0.1);
  const w4 = at(w(6, 'mixes') - 0.1);
  const eq4: [string, number][] = [
    ['\\ch = ', w(6, 'mixes')], ['\\ccon{p}\\,\\ccon{c^{+}}', w(6, 'p') - 0.1], ['{} + (1-\\ccon{p})\\,\\ccon{c^{-}}', w(6, 'plus') - 0.1],
  ];
  const sw0 = w(6, 'plus'), sw1 = w(6, 'inactive') + 0.3;
  const mix4 = at(w(6, 'p') - 0.1, 0.3);
  const p4 = 1 - E.io(inv(sw0, sw1, t));
  const p5 = lerp(0, PV[0], E.io(inv(w(7, '0.1'), w(7, '0.1') + 0.8, t)));
  const mixP = t >= b(7) - 0.4 ? p5 : p4;
  const endLab = at(w(6, 'one') - 0.1);
  // the first entry, worked: 0.1 x 0.82 + 0.9 x 0.22 = 0.28, then the whole vector
  const ent5: [string, number][] = [
    [`\\ccon{${f1(PV[0])}} \\times ${f2(CP[0][0])}`, w(7, '0.1', 1) - 0.1],
    [`{} + \\ccon{${f1(1 - PV[0])}} \\times ${f2(CM[0][0])}`, w(7, 'plus') - 0.1],
    [`{} = ${f2(EMB[0])}`, w(7, 'gives') - 0.1],
  ];
  const ent5o = at(w(7, 'first') - 0.1);
  const eq5: [string, number][] = [
    [`\\ccon{${f1(PV[0])}}${col2(CP[0][0], CP[0][1])}`, w(7, 'second') - 0.1],
    [`{} + \\ccon{${f1(1 - PV[0])}}${col2(CM[0][0], CM[0][1])}`, w(7, 'second') + 0.2],
    [`{} = ${col2(EMB[0], EMB[1])}`, w(7, 'way') - 0.1],
  ];
  const close5 = at(w(7, 'close') - 0.1);

  // ---------------- 15.6 to 15.7 head and the edit
  const sH = span(8, 9);
  const s6 = so(8), s7 = so(9);
  const pl6 = (i: number) => at(b(8) + 0.05 + i * 0.12);
  const vec6 = at(w(8, 'reads') - 0.1, 0.5);
  const six = at(w(8, 'six') - 0.1);
  const head6 = at(w(8, 'head') - 0.15, 0.5);
  const sh6 = at(w(8, 'favours') - 0.2, 0.8);
  const person7 = at(w(9, 'person') - 0.2);
  const editP = E.io(inv(w(9, 'Setting'), w(9, 'swaps') + 0.2, t));
  const editOn = at(w(9, 'sets') - 0.1, 0.3);
  const headHi = at(w(9, 'embedding'), 0.25) * (1 - at(w(9, 'embedding') + 0.6, 0.5));
  const shareK = at(w(9, 'zebra') - 0.1, 0.8);
  const line7 = at(w(9, 'swaps') - 0.1);
  const pS = editOn > 0.001 ? lerp(PV[0], 1, editP) : PV[0];
  const vec = EMB.map((v, k) => (k < 2 ? mix(0, pS)[k] : v)); // ends at EMB_E when p = 1

  // ---------------- 15.8 RandInt
  const s8 = so(10);
  const rows8 = at(b(10) + 0.05, 0.5);
  const ST = [w(10, 'randomly'), w(10, 'probabilities'), w(10, 'true')];
  const RS: number[][] = [[2], [], [0]];
  const step = ST.reduce((k, s, j) => (t >= s - 0.1 ? j : k), -1);
  const rolling = step >= 0 && t < ST[step] + 0.5;
  const replaced = (i: number) => (step >= 0 && !rolling ? RS[step].includes(i) : false);
  const used = (i: number) => (replaced(i) ? TRUE01[i] : PV[i]);
  const loss8 = at(w(10, 'randomly') - 0.1, 0.5);
  const grad8 = at(w(10, 'so') - 0.1, 0.5);
  const l8a = at(w(10, 'four') - 0.4), l8b = at(w(10, 'respond') - 0.2);

  // ---------------- 15.9 gain, 15.10 cost
  const s9 = so(11), s10 = so(14);
  const g9a = at(b(11) + 0.05, 0.5), g9b = at(w(11, 'vector') - 0.1, 0.5), g9l = at(w(11, 'detail') - 0.2), g9m = at(w(11, 'cannot'), 0.5);
  const c10a = at(b(14) + 0.05, 0.5), c10q = at(w(14, 'no') - 0.1), c10l = at(w(14, 'part') - 0.1);
  const c10r = at(w(14, 'inspectability') - 0.1);
  const c10s = at(w(14, 'separated') - 0.1);

  // ---------------- 15.15 recap, 15.16 the card
  const sR = so(15);
  const cmpRow = (i: number) => at(b(15) + 0.15 + i * 0.15, 0.35);
  const cmpHi = (i: number) => at(i === 2 ? w(15, 'Each') - 0.1 : w(15, 'head') - 0.1, 0.4);
  const cmpSame = at(w(15, 'People') - 0.1);
  const s11 = so(16);
  const cardP = [w(16, 'g'), w(16, 'hat'), w(16, 'f', 1), w(16, 'Training'), w(16, 'images')].reduce((s, x) => s + inv(x - 0.1, x + 0.4, t), 0) / 5;
  const legO = at(w(16, 'j') - 0.1);

  return (
    <Stage>
      {/* ================= photos ================= */}
      <PhotoR R={PH1} src={`worked/${EX}`} o={oo(s1, enc1)} />
      <PhotoR R={PH2} src={`worked/${EX}`} o={oo(sP, encO)} />
      <PhotoR R={PA} src={`worked/${EX}`} o={oo(n3, n3a)} />
      <PhotoR R={PB} src={`worked/${OTHER}`} o={oo(n3, n3b)} />

      <Svg>
        {/* ---------------- slide 1 ---------------- */}
        {s1 > 0.001 ? (
          <g opacity={s1 < 0.999 ? s1 : undefined}>
            <Flow pts={[[PH1.x + PH1.w + 10, ENC1.y], [ENC1.x - ENC1.w / 2 - 8, ENC1.y]]} color={C.input} p={enc1} t={t} live={1} n={1} head={13} dotR={5} />
            <Block x={ENC1.x} y={ENC1.y} w={ENC1.w} h={ENC1.h} kind="input" title="encoder" o={enc1} />
            {NAMES.map((n, i) => (
              <g key={n}>
                <Flow pts={[[ENC1.x + ENC1.w / 2 + 6, ENC1.y + (i - 1) * 28], [880, ROW1[i]], [905, ROW1[i]]]} color={C.concept} sw={2} head={0} p={rowO(i)} t={t + i * 0.3} live={rowO(i)} n={1} dotR={4} />
                <ConceptRow x={920} y={ROW1[i]} label={n} v={PV[i]} labelW={250} w={220} size={28} o={rowO(i)} />
              </g>
            ))}
            {p8 > 0.001 ? (
              <g opacity={p8 < 0.999 ? p8 : undefined}>
                <rect x={560} y={680} width={800} height={200} rx={14} fill={C.bg2} stroke={C.line2} strokeWidth={2} />
                <Txt x={590} y={716} size={26} anchor="start" weight={600} fill={C.chalk2}>Part 8: an incomplete vocabulary</Txt>
                <circle cx={630} cy={790} r={30} fill={SHAPE_BLUE} />
                <rect x={710} y={760} width={60} height={60} rx={4} fill={SHAPE_BLUE} />
                <Txt x={810} y={772} size={28} anchor="start" mono weight={600} fill={C.concept}>
                  {`${INC.vocab.map((v: string, j: number) => `${v} ${INC.objects[0].c[j]}`).join(', ')} for both`}
                </Txt>
                <Txt x={810} y={830} size={28} anchor="start" fill={C.chalk} o={p8acc}>{`same values, so best accuracy ${f2(INC.best_accuracy)}`}</Txt>
              </g>
            ) : null}
          </g>
        ) : null}

        {/* ---------------- slide 2: two prototypes and a dimmer ---------------- */}
        {n2 > 0.001 ? (() => {
          const mx = lerp(DIM.x0, DIM.x1, dimP);
          return (
            <g opacity={n2 < 0.999 ? n2 : undefined}>
              <line x1={DIM.x0} y1={DIM.y} x2={DIM.x1} y2={DIM.y} stroke={C.concept} strokeWidth={3} strokeDasharray="8 9" opacity={0.7 * Math.min(n2p, n2m)} />
              <circle cx={DIM.x0} cy={DIM.y} r={22} fill={C.bg} stroke={C.concept} strokeWidth={5} opacity={n2m} />
              <circle cx={DIM.x1} cy={DIM.y} r={24} fill={C.concept} opacity={n2p} />
              <g opacity={n2d}>
                <circle cx={mx} cy={DIM.y} r={20 + 34 * dimP} fill={rgba(C.concept, 0.1 + 0.18 * dimP)} />
                <circle cx={mx} cy={DIM.y} r={13} fill={C.concept} stroke={C.chalk} strokeWidth={3.5} />
                <line x1={mx} y1={DIM.y + 40} x2={mx} y2={DIM.ky - 30} stroke={C.line2} strokeWidth={2} strokeDasharray="4 6" />
                {/* the dimmer: a plate with a track and a knob */}
                <rect x={DIM.x0 - 50} y={DIM.ky - 44} width={DIM.x1 - DIM.x0 + 100} height={88} rx={20} fill={C.bg2} stroke={C.line2} strokeWidth={2} />
                <rect x={DIM.x0} y={DIM.ky - 6} width={DIM.x1 - DIM.x0} height={12} rx={6} fill={C.bg3} />
                <rect x={DIM.x0} y={DIM.ky - 6} width={mx - DIM.x0} height={12} rx={6} fill={rgba(C.concept, 0.7)} />
                <rect x={mx - 16} y={DIM.ky - 28} width={32} height={56} rx={8} fill={C.chalk} stroke={C.concept} strokeWidth={3} />
                <Txt x={DIM.x0 - 26} y={DIM.ky} size={24} mono fill={C.mute}>0</Txt>
                <Txt x={DIM.x1 + 26} y={DIM.ky} size={24} mono fill={C.mute}>1</Txt>
              </g>
            </g>
          );
        })() : null}

        {/* ---------------- slide 3: each photo computes its own pair ---------------- */}
        {n3 > 0.001 ? (() => {
          const X = (u: number) => P3.x + u * P3.s, Y = (v: number) => P3.y + (1 - v) * P3.s;
          const pairs: { cp: [number, number]; cm: [number, number]; o: number }[] = [{ cp: CP[0], cm: CM[0], o: n3a }, { cp: PAIR_B.cp, cm: PAIR_B.cm, o: n3b }];
          const pm = 0.85; // a photo with clear stripes: the dimmer is turned well up (illustrative)
          return (
            <g opacity={n3 < 0.999 ? n3 : undefined}>
              <rect x={P3.x} y={P3.y} width={P3.s} height={P3.s} rx={10} fill={rgba(C.concept, 0.05)} stroke={rgba(C.concept, 0.55)} strokeWidth={2} opacity={n3a} />
              <Flow pts={[[PA.x + PA.w + 12, PA.y + PA.h / 2], [P3.x - 14, P3.y + P3.s * 0.3]]} color={C.input} p={n3a} t={t} live={n3a} n={1} head={13} dotR={5} />
              <Flow pts={[[PB.x + PB.w + 12, PB.y + PB.h / 2], [P3.x - 14, P3.y + P3.s * 0.72]]} color={C.input} p={n3b} t={t + 0.4} live={n3b} n={1} head={13} dotR={5} />
              {pairs.map((q, k) => {
                const mx = lerp(q.cm[0], q.cp[0], pm), my = lerp(q.cm[1], q.cp[1], pm);
                return (
                  <g key={k} opacity={q.o}>
                    <line x1={X(q.cm[0])} y1={Y(q.cm[1])} x2={X(q.cp[0])} y2={Y(q.cp[1])} stroke={C.concept} strokeWidth={2.5} strokeDasharray="6 7" opacity={k ? 0.5 : 0.75} />
                    <circle cx={X(q.cp[0])} cy={Y(q.cp[1])} r={11} fill={C.concept} opacity={k ? 0.7 : 1} />
                    <circle cx={X(q.cm[0])} cy={Y(q.cm[1])} r={10} fill={C.bg} stroke={C.concept} strokeWidth={3.5} opacity={k ? 0.7 : 1} />
                    <Txt x={X(q.cp[0]) + 26} y={Y(q.cp[1]) + 2} size={22} mono weight={700} fill={C.chalk2} anchor="start">{k ? 'B' : 'A'}</Txt>
                    <g opacity={n3mix}>
                      <circle cx={X(mx)} cy={Y(my)} r={20} fill={rgba(C.concept, 0.22)} />
                      <circle cx={X(mx)} cy={Y(my)} r={8} fill={C.concept} stroke={C.chalk} strokeWidth={3} />
                    </g>
                  </g>
                );
              })}
            </g>
          );
        })() : null}

        {/* ---------------- slides 12 and 13: Part 8's circle and square ---------------- */}
        {n12 + n13 > 0.001 ? (() => {
          const sh = ['circle', 'square'];
          const VX0 = 560; // concept values (12) or embeddings (13)
          const PL13 = { x: 560, y: 360, s: 400 };
          const X = (u: number) => PL13.x + u * PL13.s, Y = (v: number) => PL13.y + (1 - v) * PL13.s;
          return (
            <g>
              {[n12, n13].map((sv, j) => (sv > 0.001 ? (
                <g key={j} opacity={sv < 0.999 ? sv : undefined}>
                  {sh.map((k, i) => (
                    <Shape key={k} kind={k} x={SH.cx} y={SH.ys[i]} r={SH.r} o={j ? 1 : i ? n12q : n12s} />
                  ))}
                </g>
              ) : null))}
              {n12 > 0.001 ? (
                <g opacity={n12 < 0.999 ? n12 : undefined}>
                  {sh.map((k, i) => (
                    <g key={k} opacity={n12v}>
                      <Flow pts={[[SH.cx + SH.r + 16, SH.ys[i]], [VX0 - 16, SH.ys[i]]]} color={C.input} sw={3} head={13} p={n12v} />
                      {INC.vocab.map((v: string, r: number) => (
                        <ConceptRow key={v} x={VX0} y={SH.ys[i] - 26 + r * 52} label={v} v={INC.objects[i].c[r]} labelW={110} w={150} size={28} digits={0} />
                      ))}
                      <Flow pts={[[VX0 + 360, SH.ys[i]], [HD.x - HD.w / 2 - 12, HD.y + (i ? 22 : -22)]]} color={C.concept} sw={3} head={13} p={n12h} t={t + i * 0.3} live={n12h} n={1} dotR={5} />
                    </g>
                  ))}
                  <Block x={HD.x} y={HD.y} w={HD.w} h={HD.h} kind="head" o={n12h} />
                  <MathSvg x={HD.x} y={HD.y} tex="\fph" size={42} o={n12h} />
                  <Flow pts={[[HD.x + HD.w / 2 + 8, HD.y], [SHAPE_OUT_X - 10, HD.y]]} color={C.chalk} sw={3} head={13} p={n12x} o={n12x} />
                </g>
              ) : null}
              {n13 > 0.001 ? (
                <g opacity={n13 < 0.999 ? n13 : undefined}>
                  <rect x={PL13.x} y={PL13.y} width={PL13.s} height={PL13.s} rx={10} fill={rgba(C.concept, 0.05)} stroke={rgba(C.concept, 0.55)} strokeWidth={2} opacity={n13v} />
                  {sh.map((k, i) => {
                    const q = i ? SQ_B.square : SQ_B.circle;
                    const o = i ? n13d : n13v;
                    return (
                      <g key={k} opacity={o}>
                        <Flow pts={[[SH.cx + SH.r + 16, SH.ys[i]], [X(q[0]) - 24, Y(q[1])]]} color={C.input} sw={3} head={13} p={o} t={t + i * 0.3} live={o} n={1} dotR={5} />
                        <circle cx={X(q[0])} cy={Y(q[1])} r={22} fill={rgba(C.concept, 0.22)} />
                        {i ? <rect x={X(q[0]) - 9} y={Y(q[1]) - 9} width={18} height={18} rx={2} fill={C.concept} stroke={C.chalk} strokeWidth={2.5} />
                          : <circle cx={X(q[0])} cy={Y(q[1])} r={10} fill={C.concept} stroke={C.chalk} strokeWidth={2.5} />}
                        <Flow pts={[[X(q[0]) + 26, Y(q[1])], [HD.x - HD.w / 2 - 12, HD.y + (i ? 22 : -22)]]} color={C.concept} sw={3} head={13} p={n13h} t={t + i * 0.3} live={n13h} n={1} dotR={5} />
                        <Flow pts={[[HD.x + HD.w / 2 + 8, HD.y + (i ? 22 : -22)], [SHAPE_OUT_X - 10, SH.ys[i]]]} color={C.chalk} sw={3} head={13} p={n13n} o={n13n} />
                      </g>
                    );
                  })}
                  <Block x={HD.x} y={HD.y} w={HD.w} h={HD.h} kind="head" o={n13h} />
                  <MathSvg x={HD.x} y={HD.y} tex="\fph" size={42} o={n13h} />
                </g>
              ) : null}
            </g>
          );
        })() : null}

        {/* ---------------- slides 2 to 5: the stripes plane ---------------- */}
        {sP > 0.001 ? (
          <g opacity={sP < 0.999 ? sP : undefined}>
            <Flow pts={[[PH2.x + PH2.w / 2, PH2.y + PH2.h + 8], [ENC2.x, ENC2.y - ENC2.h / 2 - 8]]} color={C.input} p={encO} t={t} live={encO} n={1} head={13} dotR={5} />
            <Block x={ENC2.x} y={ENC2.y} w={ENC2.w} h={ENC2.h} kind="input" title="encoder" o={encO} />
            <Flow pts={[[ENC2.x + ENC2.w / 2 + 8, ENC2.y], [PL.x - 60, ENC2.y], [PL.x - 60, PL.y + PL.s / 2], [PL.x - 12, PL.y + PL.s / 2]]} color={C.input} p={at(w(4, 'computes') - 0.3, 0.6)} t={t} live={encO} n={2} head={13} dotR={5} />
            <Plane x={PL.x} y={PL.y} s={PL.s} i={0} o={at(w(4, 'computes') - 0.2, 0.5)} pts={cpO} ptsM={cmO} mixP={t > w(6, 'p') - 0.2 ? mixP : null} ticks />
            <MathSvg x={PL.x + CP[0][0] * PL.s + 4} y={PL.y + (1 - CP[0][1]) * PL.s + 40} tex="\ccon{c^{+}}" size={32} o={cpO} />
            <MathSvg x={PL.x + CM[0][0] * PL.s + 2} y={PL.y + (1 - CM[0][1]) * PL.s - 40} tex="\ccon{c^{-}}" size={32} o={cmO} />
            <Txt x={PL.x + CP[0][0] * PL.s + 2} y={PL.y + (1 - CP[0][1]) * PL.s + 78} size={22} mono fill={C.chalk2} o={endLab * (1 - at(b(7) - 0.4, 0.3))}>p = 1</Txt>
            <Txt x={PL.x + CM[0][0] * PL.s + 2} y={PL.y + (1 - CM[0][1]) * PL.s + 36} size={22} mono fill={C.chalk2} o={endLab * (1 - at(b(7) - 0.4, 0.3))}>p = 0</Txt>
            <Txt x={PL.x + mix(0, PV[0])[0] * PL.s + 34} y={PL.y + (1 - mix(0, PV[0])[1]) * PL.s + 2} size={22} anchor="start" mono weight={700} fill={C.chalk} o={at(w(7, '0.1') + 0.6)}>{`p = ${f1(PV[0])}`}</Txt>

            {/* slide 2: the two vectors */}
            {s2 > 0.001 ? (
              <g opacity={s2 < 0.999 ? s2 : undefined}>
                <VecCol x={RX + 20} y={420} vals={CP[0]} rowH={66} w={140} size={34} digits={2} o={cpO} />
                <VecCol x={RX + 300} y={420} vals={CM[0]} rowH={66} w={140} size={34} digits={2} o={cmO} />
              </g>
            ) : null}

            {/* slide 3: the probability gauge */}
            {s3 > 0.001 ? (
              <g opacity={s3 * g3 < 0.999 ? s3 * g3 : undefined}>
                <rect x={RX} y={500} width={480} height={20} rx={8} fill={C.bg3} />
                <rect x={RX} y={500} width={480 * PV[0] * g3v} height={20} rx={8} fill={C.concept} />
                <circle cx={RX + 480 * PV[0] * g3v} cy={510} r={14} fill={C.concept} stroke="#0B0F14" strokeWidth={3} />
                <Txt x={RX} y={548} size={22} mono fill={C.mute}>0</Txt>
                <Txt x={RX + 480} y={548} size={22} mono fill={C.mute}>1</Txt>
              </g>
            ) : null}
          </g>
        ) : null}

        {/* ---------------- slides 6 and 7: the head reads all three ---------------- */}
        {sH > 0.001 ? (
          <g opacity={sH < 0.999 ? sH : undefined}>
            {NAMES.map((n, i) => {
              const y = P6.ys[i];
              const edited = i === 0 && editOn > 0.5;
              const p = i === 0 ? pS : PV[i];
              const [mx, my] = mix(i, p);
              return (
                <g key={n} opacity={pl6(i)}>
                  <Plane x={P6.x} y={y} s={P6.s} i={i} mixP={p} mixCol={edited ? C.edit : C.concept} />
                  <Txt x={P6.x + P6.s + 26} y={y + 30} size={28} anchor="start" weight={600} fill={C.chalk}>{n}</Txt>
                  <Txt x={P6.x + P6.s + 26} y={y + 72} size={24} anchor="start" mono fill={edited ? C.edit : C.chalk2}>{`p = ${f2(p)}`}</Txt>
                  <Txt x={P6.x + P6.s + 26} y={y + 110} size={24} anchor="start" mono fill={edited ? C.edit : C.concept}>{`(${f2(mx)}, ${f2(my)})`}</Txt>
                  <Flow pts={[[P6.x + P6.s + 270, y + P6.s / 2], [V6.x - 40, y + P6.s / 2], [V6.x - 40, V6.y + (2 * i + 1) * V6.rh], [V6.x - 8, V6.y + (2 * i + 1) * V6.rh]]}
                    color={C.concept} sw={2.5} p={vec6} t={t + i * 0.25} live={vec6} n={1} head={11} dotR={4} />
                </g>
              );
            })}
            <Person x={P6.x + P6.s + 240} y={P6.ys[0] + 64} s={0.62} o={person7} />
            <g opacity={vec6}>
              {[0, 1, 2].map((i) => (
                <rect key={i} x={V6.x + 8} y={V6.y + 2 * i * V6.rh + 5} width={V6.w - 16} height={2 * V6.rh - 10} rx={10} fill="none"
                  stroke={rgba(C.concept, 0.5 * six)} strokeWidth={2} />
              ))}
              <VecCol x={V6.x} y={V6.y} vals={vec} rowH={V6.rh} w={V6.w} size={27} digits={2}
                cellColor={(k) => (k < 2 && editOn > 0.5 ? C.edit : C.chalk)} />
            </g>
            <Flow pts={[[V6.x + V6.w + 10, H6.y], [H6.x - H6.w / 2 - 8, H6.y]]} color={C.concept} p={head6} o={head6} t={t} live={head6} n={1} head={12} dotR={5} />
            <Block x={H6.x} y={H6.y} w={H6.w} h={H6.h} kind="head" o={head6} hi={headHi} />
            <MathSvg x={H6.x} y={H6.y} tex="\fph" size={42} o={head6} />
            <Flow pts={[[H6.x + H6.w / 2 + 6, H6.y], [S6X - 12, H6.y]]} color={C.chalk} p={sh6} o={sh6} t={t} live={sh6} n={1} head={12} dotR={5} />
            <ShareBars x={S6X} y={H6.y - 60} labels={CLS} from={PR} to={PRE} k={shareK} labelW={120} w={200} rowH={60} size={28} p={sh6} o={at(w(8, 'favours') - 0.2)} />
          </g>
        ) : null}

        {/* ---------------- slide 8: random interventions during training ---------------- */}
        {s8 > 0.001 ? (
          <g opacity={s8 < 0.999 ? s8 : undefined}>
            <g opacity={rows8}>
              <Txt x={640} y={352} size={24} weight={600} fill={C.chalk2}>predicted</Txt>
              <Txt x={980} y={352} size={24} weight={600} fill={C.chalk2}>used in training</Txt>
              {NAMES.map((n, i) => {
                const y = R8[i];
                const rep = replaced(i);
                const s0 = step >= 0 ? ST[step] : 0;
                const face = rolling ? 1 + (Math.floor(t * 14 + i * 3) % 6) : rep ? 6 : 2;
                const rot = rolling ? (t - s0) * 720 + i * 40 : 0;
                return (
                  <g key={n}>
                    <Txt x={200} y={y} size={30} anchor="start" weight={600} fill={C.chalk}>{n}</Txt>
                    <Txt x={640} y={y} size={30} mono weight={600} fill={C.concept}>{f2(PV[i])}</Txt>
                    <Die x={800} y={y} face={face} rot={rot} o={at(ST[0] - 0.2)} color={!rolling && rep ? C.edit : C.chalk2} />
                    <Flow pts={[[840, y], [910, y]]} color={rep ? C.edit : C.line2} sw={2.5} head={11} />
                    <rect x={928} y={y - 30} width={104} height={60} rx={10} fill={rep ? rgba(C.edit, 0.16) : C.bg3} stroke={rep ? C.edit : rgba(C.concept, 0.5)} strokeWidth={2} />
                    <Txt x={980} y={y} size={30} mono weight={700} fill={rep ? C.edit : C.concept}>{rep ? String(TRUE01[i]) : f2(used(i))}</Txt>
                    <Flow pts={[[1040, y], [1100, y], [1100, H8.y + (i - 1) * 30], [H8.x - H8.w / 2 - 8, H8.y + (i - 1) * 30]]} color={C.concept} sw={2} head={10}
                      p={1} t={t + i * 0.2} live={rows8} n={1} dotR={4} />
                  </g>
                );
              })}
            </g>
            <Block x={H8.x} y={H8.y} w={H8.w} h={H8.h} kind="head" o={rows8} hi={grad8 * (0.5 + 0.5 * Math.sin(t * 4))} />
            <MathSvg x={H8.x} y={H8.y} tex="\fph" size={42} o={rows8} />
            <Flow pts={[[H8.x + H8.w / 2 + 6, H8.y - 20], [L8.x - L8.w / 2 - 8, H8.y - 20]]} color={C.chalk2} p={loss8} o={loss8} t={t} live={loss8} n={1} head={11} dotR={4} />
            <Block x={L8.x} y={L8.y} w={L8.w} h={L8.h} kind="loss" title="loss" sub="true class: zebra" size={28} o={loss8} />
            <Flow pts={[[L8.x - L8.w / 2 - 6, H8.y + 22], [H8.x + H8.w / 2 + 8, H8.y + 22]]} color={C.loss} p={grad8} o={grad8} t={t} live={grad8} n={2} head={11} dotR={5} />
            <Txt x={1380} y={H8.y + 64} size={22} fill={C.loss} o={grad8}>gradients</Txt>
          </g>
        ) : null}

        {/* ---------------- slide 9: gain ---------------- */}
        {s9 > 0.001 ? (
          <g opacity={s9 < 0.999 ? s9 : undefined}>
            <g opacity={g9a}>
              <rect x={200} y={360} width={640} height={340} rx={16} fill={C.bg2} stroke={C.line} strokeWidth={2} />
              <Txt x={520} y={430} size={30} weight={600} fill={C.chalk}>stripes</Txt>
              <rect x={460} y={480} width={120} height={70} rx={10} fill={rgba(C.concept, 0.12)} stroke={C.concept} strokeWidth={2.5} />
              <Txt x={520} y={516} size={34} mono weight={700} fill={C.concept}>{f2(PV[0])}</Txt>
              <Txt x={520} y={650} size={24} fill={C.chalk2}>one slot</Txt>
            </g>
            <g opacity={g9b}>
              <rect x={1000} y={360} width={720} height={340} rx={16} fill={C.bg2} stroke={C.line} strokeWidth={2} />
              <Txt x={1360} y={400} size={30} weight={600} fill={C.chalk}>stripes</Txt>
              <Plane x={1070} y={430} s={240} i={0} mixP={PV[0]} />
              <VecCol x={1420} y={480} vals={[EMB[0], EMB[1]]} rowH={66} w={140} size={34} digits={2} />
              <Txt x={1490} y={650} size={24} fill={C.chalk2}>a vector</Txt>
            </g>
          </g>
        ) : null}

        {/* ---------------- slide 15: recap ---------------- */}
        <CompareSvg o={sR} rowO={cmpRow} hiO={cmpHi} changed={CMP_CHANGED} />

        {/* ---------------- slide 10: cost ---------------- */}
        {s10 > 0.001 ? (
          <g opacity={s10 < 0.999 ? s10 : undefined}>
            <Plane x={260} y={340} s={380} i={0} mixP={PV[0]} q={c10q} o={c10a} />
            <g opacity={c10r}>
              <rect x={800} y={350} width={920} height={110} rx={14} fill={C.bg2} stroke={C.line} strokeWidth={2} />
              <Txt x={830} y={405} size={28} anchor="start" weight={700} fill={C.chalk2}>CBM</Txt>
              <Txt x={950} y={405} size={30} anchor="start" mono weight={600} fill={C.concept}>{`stripes = ${f2(PV[0])}`}</Txt>
              <Txt x={1300} y={405} size={28} anchor="start" fill={C.chalk}>means: chance of stripes</Txt>
              <rect x={800} y={500} width={920} height={110} rx={14} fill={C.bg2} stroke={C.line} strokeWidth={2} />
              <Txt x={830} y={555} size={28} anchor="start" weight={700} fill={C.chalk2}>CEM</Txt>
              <Txt x={950} y={555} size={30} anchor="start" mono weight={600} fill={C.concept}>{`stripes = (${f2(EMB[0])}, ${f2(EMB[1])})`}</Txt>
              <Txt x={1460} y={555} size={28} anchor="start" fill={C.chalk} o={c10q}>means: ?</Txt>
            </g>
          </g>
        ) : null}
      </Svg>

      {/* ================= HTML text ================= */}
      <Header t={t} part={10} title={P.title} />

      {/* slide 1 */}
      <SlideHead text={bh(P, 1)} o={s1} />
      <Credit x={PH1.x} y={PH1.y + PH1.h + 10} text={`Photo: ${EXC.artist}, Wikimedia Commons, ${EXC.license}`} o={oo(s1, enc1)} />
      <Rich x={920} y={566} size={32} text="{c:one number} per concept: a narrow channel" o={oo(s1, narrow)} />
      <EvTag x={1760} y={890} ax="right" kind="illustrative" text="hand-chosen values" o={oo(s1, rowO(0))} />

      {/* slide 2: the intuition */}
      <SlideHead text={bh(P, 2)} o={n2} />
      <HText x={DIM.x0} y={DIM.y - 92} ax="center" size={22} mono weight={600} color={C.mute} o={oo(n2, n2a)}>prototype</HText>
      <HText x={DIM.x1} y={DIM.y - 92} ax="center" size={22} mono weight={600} color={C.mute} o={oo(n2, n2a)}>prototype</HText>
      <Rich x={DIM.x0} y={DIM.y + 44} ax="center" size={30} text="{c:stripes absent}" o={oo(n2, n2m)} />
      <Rich x={DIM.x1} y={DIM.y + 44} ax="center" size={30} text="{c:stripes present}" o={oo(n2, n2p)} />
      <Rich x={960} y={DIM.ky + 70} ax="center" size={32} text="the {c:probability} works like a dimmer between them" o={oo(n2, n2d)} />
      <Rich x={960} y={DIM.ky + 130} ax="center" size={28} color={C.chalk2} text="a prototype is a typical point, one for each case" o={oo(n2, at(w(2, 'typical') - 0.1))} />

      {/* slide 3: computed from the image */}
      <SlideHead text={bh(P, 3)} o={n3} />
      <Credit x={PB.x} y={PB.y + PB.h + 10} text={COLLECTIVE} o={oo(n3, n3b)} />
      <HText x={PA.x + PA.w + 24} y={PA.y + 8} size={26} mono weight={700} color={C.chalk2} o={oo(n3, n3a)}>A</HText>
      <HText x={PB.x + PB.w + 24} y={PB.y + 8} size={26} mono weight={700} color={C.chalk2} o={oo(n3, n3b)}>B</HText>
      <Rich x={P3.x + P3.s + 50} y={P3.y + 40} w={370} size={30} text="each {x:photo} computes its own pair of prototypes" o={oo(n3, n3l1)} />
      <Rich x={P3.x + P3.s + 50} y={P3.y + 220} w={370} size={30} text="so the {c:stripes} vector carries detail beyond yes or no" o={oo(n3, n3l2)} />
      <EvTag x={1760} y={890} ax="right" kind="illustrative" text="positions drawn for teaching" o={oo(n3, n3a)} />

      {/* slides 4 to 7 */}
      <SlideHead text={bh(P, 4)} o={s2} />
      <SlideHead text={bh(P, 5)} o={s3} />
      <SlideHead text={bh(P, 6)} o={s4} />
      <SlideHead text={bh(P, 7)} o={s5} />
      <Rich x={PL.x + PL.s / 2} y={PL.y + PL.s + 40} ax="center" size={28} color={C.chalk2} text="{c:stripes}: two embeddings in one plane" o={oo(sP, at(w(4, 'computes') - 0.2, 0.5))} />
      <Tex x={RX + 90} y={366} ax="center" size={48} tex="\ccon{c^{+}}" o={oo(s2, cpO)} />
      <Tex x={RX + 370} y={366} ax="center" size={48} tex="\ccon{c^{-}}" o={oo(s2, cmO)} />
      <Rich x={RX + 90} y={572} ax="center" size={30} text="{c:active}" o={oo(s2, cpO)} />
      <Rich x={RX + 370} y={572} ax="center" size={30} text="{c:inactive}" o={oo(s2, cmO)} />
      <Rich x={RX} y={680} w={560} size={30} color={C.chalk2} text="one pair for every concept, computed from the {x:image}" o={oo(s2, every2)} />
      <Rich x={RX} y={800} w={600} size={28} color={C.chalk2} text="embedding: a short list of numbers (here two)" o={oo(s2, at(w(4, 'embedding') - 0.1))} />
      {/* slide 3 */}
      <Rich x={RX} y={400} w={560} size={32} text="the probability that {c:stripes} is present" o={oo(s3, g3)} />
      <Tex x={RX} y={640} size={56} tex={`\\ccon{p} = ${f1(PV[0])}`} o={oo(s3, at(w(5, '0.1') - 0.1))} />
      <Rich x={RX} y={730} w={600} size={28} color={C.chalk2} text="suppose it misses the {c:stripes}, as in Part 4" o={oo(s3, g3m)} />
      {/* slide 4: words, then the same line in symbols */}
      <Rich x={RX} y={390} w={560} size={32} lh={1.5} text="{c:mixed} = {c:p} × {c:active} + (1 − {c:p}) × {c:inactive}" o={oo(s4, w4)} />
      <TexSteps x={RX} y={560} t={t} size={52} o={s4} parts={eq4} />
      <Rich x={RX} y={660} w={560} size={28} color={C.chalk2} text="the mixed point lies on the segment from {c:inactive} to {c:active}" o={oo(s4, endLab)} />
      {/* slide 5: the arithmetic */}
      <Rich x={RX} y={380} w={600} size={32} text={`$\\ch$ for {c:stripes}, with {c:p = ${f1(PV[0])}}:`} o={oo(s5, at(b(7) + 0.1))} />
      <Rich x={RX} y={450} w={600} size={28} color={C.chalk2} text="first entry:" o={oo(s5, ent5o)} />
      <TexSteps x={RX} y={520} t={t} size={40} o={s5} parts={ent5} />
      <TexSteps x={RX} y={660} t={t} size={34} o={s5} parts={eq5} />
      <Rich x={RX} y={760} w={600} size={32} text="close to {c:inactive}" o={oo(s5, close5)} />
      <EvTag x={1760} y={890} ax="right" kind="illustrative" text="hand-chosen 2-D embeddings" o={oo(sP, cpO)} />

      {/* slides 6 and 7 */}
      <SlideHead text={bh(P, 8)} o={s6} />
      <SlideHead text={bh(P, 9)} o={s7} />
      <Rich x={V6.x - 20} y={V6.y - 64} size={26} color={C.chalk2} text="{c:6 numbers}" o={oo(sH, six)} />
      <Rich x={S6X} y={760} w={460} size={30} color={C.chalk2} text="a linear {f:head} reads all six numbers" o={oo(s6, sh6)} />
      <Tex x={S6X} y={790} size={44} tex={`\\cedit{p = 1}:\\ \\ch = \\ccon{c^{+}}`} o={oo(s7, line7)} />
      <Rich x={S6X} y={850} w={460} size={28} color={C.chalk2} text="now {y:zebra} leads" o={oo(s7, shareK)} />
      <EvTag x={1760} y={300} ax="right" kind="illustrative" text="hand-chosen embeddings and head" o={oo(sH, pl6(0))} />

      {/* slide 8 */}
      <SlideHead text={bh(P, 10)} o={s8} />
      <HText x={800} y={352} ax="center" ay="middle" size={22} mono color={C.mute} o={oo(s8, at(ST[0] - 0.2))}>{`step ${Math.max(1, step + 1)}`}</HText>
      <Rich x={200} y={770} size={32} text="about one concept in four is replaced by its {e:true value}" o={oo(s8, l8a)} />
      <Rich x={200} y={830} size={32} color={C.chalk2} text="so the {f:head} learns to respond to corrections" o={oo(s8, l8b)} />
      <EvTag x={1760} y={890} ax="right" kind="illustrative" text="three training steps, hand-chosen" o={oo(s8, rows8)} />

      {/* slide 11 */}
      <SlideHead text={bh(P, 11)} o={s9} />
      <Rich x={520} y={300} ax="center" size={32} text="{c:CBM}: one number" o={oo(s9, g9a)} />
      <Rich x={1360} y={300} ax="center" size={32} text="{c:CEM}: a vector" o={oo(s9, g9b)} />
      <Rich x={960} y={750} ax="center" size={32} text="a vector can carry detail that one number cannot" o={oo(s9, g9l)} />
      <Rich x={960} y={810} ax="center" size={28} color={C.chalk2} text={`the paper's CUB model uses ${M_CUB} numbers per concept`} o={oo(s9, g9m)} />

      {/* slides 12 and 13: Part 8's circle and square */}
      <SlideHead text={bh(P, 12)} o={n12} />
      <SlideHead text={bh(P, 13)} o={n13} />
      <HText x={SH.cx} y={318} ax="center" size={24} mono weight={600} color={C.mute} o={oo(n12, n12s) + oo(n13)}>Part 8</HText>
      <HText x={SHAPE_OUT_X} y={HD.y} ay="middle" size={30} weight={700} color={C.chalk} o={oo(n12, n12x)}>same output for both</HText>
      <Rich x={SHAPE_OUT_X} y={HD.y + 46} size={28} color={C.chalk2} text={`best accuracy ${f2(INC.best_accuracy)}`} o={oo(n12, n12x)} />
      {SAME_OUT.map((y: string, i: number) => (
        <HText key={y} x={SHAPE_OUT_X} y={SH.ys[i]} ay="middle" size={30} weight={700} color={C.chalk} o={oo(n13, n13n)}>{y}</HText>
      ))}
      <Rich x={760} y={300} ax="center" size={28} color={C.chalk2} text="the {c:blue} embedding, computed from each image" o={oo(n13, n13v)} />
      <Rich x={960} y={830} ax="center" size={32} text="shape reaches the {f:head} without a name" o={oo(n13, n13n)} />
      <EvTag x={1760} y={890} ax="right" kind="constructed" text="Part 8's two objects; embedding positions illustrative" o={oo(n13, n13v)} />
      <EvTag x={1760} y={890} ax="right" kind="constructed" text="Part 8's two objects" o={oo(n12, n12s)} />

      {/* slide 14 */}
      <SlideHead text={bh(P, 14)} o={s10} />
      <Rich x={450} y={790} ax="center" size={28} color={C.chalk2} text="the axes have no names" o={oo(s10, c10q)} />
      <Rich x={800} y={680} w={920} size={32} text="part of what the {f:head} uses cannot be inspected" o={oo(s10, c10l)} />
      <Rich x={800} y={750} w={920} size={28} color={C.chalk2} text="including the detail that separated the circle from the square" o={oo(s10, c10s)} />

      {/* slide 15: recap against the plain CBM */}
      <SlideHead text={bh(P, 15)} o={sR} />
      <CompareText o={sR} name="concept embedding model" cells={CMP_CEM} rowO={cmpRow} hiO={cmpHi} changed={CMP_CHANGED} />
      <Rich x={196} y={850} size={30} color={C.chalk2} text="{c:2 of 4} changed; people still label every concept" o={oo(sR, cmpSame)} />

      {/* slide 16 */}
      <SlideHead text={bh(P, 16)} o={s11} />
      <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.86)', transformOrigin: '960px 290px' }}>
        <VariantCard name="Concept embedding models (Espinosa Zarlenga et al., NeurIPS 2022)" rows={VROWS} o={s11} p={cardP} y0={290} />
      </div>
      <Rich x={960} y={912} ax="center" size={28} color={C.chalk2} text="$j$: one concept   ·   $k$: number of concepts   ·   $m$: numbers in each embedding" o={oo(s11, legO)} />

      <ArchMap on={['c']} o={inv(0, 0.5, t)} />
    </Stage>
  );
};
