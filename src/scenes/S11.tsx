// s11 Part 11 · How should we evaluate a CBM? (revision 2: one idea per slide, 19 slides, one per beat)
// 11.1 motivation: accuracy checks only the end of the chain; four questions, one per part of the model
// 11.2 task accuracy (definition + how to measure)       11.3 the formula read on three predictions (1 + 1 + 0) / 3
// 11.4 concept accuracy worked on test image 10: score, rounded, label, match (4 of 5)
// 11.5 grounding: the wingtip score should come from the wingtip, not the water (gull regions)
// 11.6 faithfulness (the Part 2 gull edit moves the output as the head says)   11.7 intervention utility (schematic curve)
// 11.8 the synthetic shape data (real 64 px test inputs, 2 x 2 x 2 = 8 classes)  11.9 three models, one diagram
// 11.10 task accuracy bars (D.measured.acc)              11.11 concept accuracy (D.measured.concept_acc, per concept)
// 11.12 test image 10: concept vector before/after correcting 'large', prediction changes
// 11.13 the oracle: errors |ĉ − c| of test image 10, the largest is fixed first
// 11.14 oracle correction curve, axes read aloud        11.15 random-order curve (mean, min to max band)
// 11.16 multi-task: a concept edit leaves the class scores unchanged       11.17 caveats      11.18 the lesson
// 11.19 intuition: two small diagrams, multi-task (the class head never reads the concepts) vs strict CBM (the only road)
// Slides replace each other: the old one fades out in the gap before a beat, the new one fades in on its first words.
// Every number of the experiment comes from D.measured.
import React from 'react';
import { C } from '../kit/theme';
import { E, HText, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, be, bh, bs, bw, clamp, inv, type SceneProps } from '../kit/core';
import { ArchMap, Block, CREDIT, ConceptRow, Credit, Cross, EvTag, Flow, MathSvg, Person, PhotoR, Region, ShareBars, rgba, ux, vy, type MapKey, type Rect } from '../kit/cbm';
import { lerp, wob } from '../kit/anim';
import { D } from '../kit/data';

const M = D.measured;
const CN = ['red', 'blue', 'circle', 'square', 'large']; // display names of M.concepts (is_red ... is_large)
const CLS: string[] = M.classes;
const EX = M.example;
const PCC: number[] = M.per_concept_acc_cbm;
const pc = (v: number) => (v * 100).toFixed(1);
const TESTS = ['test_000.png', 'test_001.png', 'test_004.png', 'test_008.png', 'test_010.png', 'test_012.png', 'test_013.png', 'test_015.png', 'test_042.png'];
const HEADC = '#9AA6B5';
const TAGTXT = 'one seed · 512 synthetic test images · oracle corrections';
const B = D.bird;
const BIRD_SHORT = ['glaucous-winged', 'herring'];
/** a list of concept values for KaTeX: 1.00,\\ 0.00, ... */
const V10 = (v: number[]) => v.map((x) => x.toFixed(2)).join(',\\ ');

// ------------------------------------------------------------------ helpers
/** one slide: a full-frame layer with its own opacity */
const Slide: React.FC<{ o: number; children?: React.ReactNode }> = ({ o, children }) =>
  o <= 0.001 ? null : <div style={{ position: 'absolute', inset: 0, opacity: o < 0.999 ? o : undefined }}>{children}</div>;

/** the five-stage chain x -> g -> ĉ -> f -> ŷ centred on cx; lit stages bright; `links` (index of source node) carry dots */
const KEYS: MapKey[] = ['x', 'g', 'c', 'f', 'y'];
const NODE = [
  { t: 'x', c: C.input }, { t: 'g', c: C.input }, { t: '\\hat{c}', c: C.concept }, { t: 'f', c: HEADC }, { t: '\\hat{y}', c: C.chalk },
];
const LINKC = [C.input, C.input, C.concept, C.chalk2];
const nodeX = (cx: number, i: number, step: number) => cx + (i - 2) * step;
const Chain: React.FC<{
  cx: number; y: number; hl: MapKey[]; links: number[]; t: number; live: number; o?: number; step?: number; bw0?: number; bh0?: number; ts?: number;
}> = ({ cx, y, hl, links, t, live, o = 1, step = 150, bw0 = 84, bh0 = 56, ts = 32 }) => {
  if (o <= 0.001) return null;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      {NODE.slice(0, 4).map((_, i) => {
        const on = links.includes(i);
        return (
          <Flow key={`l${i}`} pts={[[nodeX(cx, i, step) + bw0 / 2 + 6, y], [nodeX(cx, i + 1, step) - bw0 / 2 - 6, y]]} color={on ? LINKC[i] : C.line2}
            sw={on ? 3.5 : 2} head={11} t={t + i * 0.4} live={live * (on ? 1 : 0)} n={1} dotR={5} speed={0.25} />
        );
      })}
      {NODE.map((nd, i) => {
        const on = hl.includes(KEYS[i]);
        const x = nodeX(cx, i, step);
        return (
          <g key={i}>
            <rect x={x - bw0 / 2} y={y - bh0 / 2} width={bw0} height={bh0} rx={10} fill={on ? rgba(nd.c, 0.22) : 'none'}
              stroke={on ? nd.c : C.line2} strokeWidth={on ? 3 : 1.6} />
            <MathSvg x={x} y={y} tex={nd.t} size={ts} color={on ? C.chalk : C.mute} />
          </g>
        );
      })}
    </g>
  );
};

/** a small chip with a label */
const Chip: React.FC<{ x: number; y: number; text: string; color?: string; o?: number; s?: number; size?: number; fill?: string }> = ({
  x, y, text, color = C.line2, o = 1, s = 1, size = 28, fill = C.bg2,
}) => {
  if (o <= 0.001 || s <= 0.001) return null;
  const w = text.length * size * 0.56 + 40;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o < 0.999 ? o : undefined}>
      <rect x={-w / 2} y={-size * 0.85} width={w} height={size * 1.7} rx={10} fill={fill} stroke={color} strokeWidth={2.5} />
      <Txt x={0} y={0} size={size} weight={600} fill={C.chalk}>{text}</Txt>
    </g>
  );
};

/** five short teal ticks standing for ĉ, vertical, centred on (x, y); vals 0..1 */
const Ticks: React.FC<{ x: number; y: number; vals: number[]; o?: number; color?: string; w?: number; dy?: number; ghost?: number[] }> = ({
  x, y, vals, o = 1, color = C.concept, w = 46, dy = 20, ghost,
}) => {
  if (o <= 0.001) return null;
  const y0 = y - ((vals.length - 1) * dy) / 2;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      {vals.map((v, i) => (
        <g key={i}>
          <rect x={x - w / 2} y={y0 + i * dy - 6} width={w} height={12} rx={3} fill={C.bg3} stroke={rgba(C.concept, 0.45)} strokeWidth={1.2} />
          {ghost ? <rect x={x - w / 2} y={y0 + i * dy - 6} width={w * ghost[i]} height={12} rx={3} fill="none" stroke={C.concept} strokeWidth={1.5} strokeDasharray="3 3" opacity={0.7} /> : null}
          <rect x={x - w / 2} y={y0 + i * dy - 6} width={w * clamp(v)} height={12} rx={3} fill={color} opacity={0.92} />
        </g>
      ))}
    </g>
  );
};

/** an amber ring around one edited tick row (the 'large' concept set to 0) */
const EditRing: React.FC<{ x: number; y: number; w: number; p: number }> = ({ x, y, w, p }) =>
  p <= 0.001 ? null : <rect x={x - w / 2 - 5} y={y - 10} width={w + 10} height={20} rx={5} fill="none" stroke={C.edit} strokeWidth={2.5} opacity={clamp(p * 2)} />;

/** a tick mark (correct outcome) */
const Tick: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) =>
  o <= 0.001 || s <= 0.001 ? null : (
    <path d={`M ${x - 14 * s} ${y} L ${x - 4 * s} ${y + 11 * s} L ${x + 16 * s} ${y - 12 * s}`} fill="none" stroke={C.good} strokeWidth={5}
      strokeLinecap="round" strokeLinejoin="round" opacity={o} />
  );

/** a numbered marker (the four questions on slide 1) */
const Num: React.FC<{ x: number; y: number; n: number; color: string; o?: number }> = ({ x, y, n, color, o = 1 }) =>
  o <= 0.001 ? null : (
    <g opacity={o < 0.999 ? o : undefined} transform={`translate(${x} ${y}) scale(${0.6 + 0.4 * E.back(o)})`}>
      <circle r={26} fill={rgba(color, 0.16)} stroke={color} strokeWidth={3} />
      <Txt x={0} y={1} size={28} mono weight={700} fill={C.chalk}>{String(n)}</Txt>
    </g>
  );

/** the 'in everyday terms' line: a muted lead-in, then the question in plain words */
const Plain: React.FC<{ x: number; y: number; text: string; o: number; ax?: 'left' | 'center'; w?: number }> = ({ x, y, text, o, ax = 'left', w }) =>
  o <= 0.001 ? null : (
    <Rich x={x} y={y + (1 - o) * 8} ax={ax} w={w} size={34} lh={1.3} text={`{m:In everyday terms:} ${text}`} o={o} />
  );

// ------------------------------------------------------------------ chart geometry (11.11 to 11.12)
const CX0 = 360, CX1 = 1160, CY0 = 340, CY1 = 790;
const cxk = (k: number) => CX0 + (k * (CX1 - CX0)) / 5;
const cyv = (v: number) => CY1 - ((v - 0.8) / 0.2) * (CY1 - CY0);


// slide geometry
const IMG10: Rect = { x: 180, y: 360, w: 330, h: 330 };
const ROWS = [420, 610, 800]; // slide 9 model rows
const ACCY = [440, 570, 700]; // slide 10 bars
const PH5: Rect = { x: 200, y: 430, w: 430, h: 430 }; // slide 5 gull
const WATER = [0.72, 0.17, 0.4, 0.2]; // a patch of water behind the gull (normalized cx, cy, w, h; drawn by hand)
const CHIP5 = { x: 1180, y: 640, w: 300, h: 64 };
/** slide 3: three predictions for teaching; the third is test image 10 (predicted large, truly small) */
const PRED3: [string, string][] = [
  [CLS[0], CLS[0]],
  [CLS[7], CLS[7]],
  [CLS[EX.pred_class], CLS[EX.true_class]],
];
/** slide 4 and 13 table columns */
const TX = { name: 600, score: 720, round: 900, label: 1070, last: 1240 };

export const S11: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const e = (k: number) => be(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.4) => inv(x, x + d, t);
  /** start of the word `off` positions after the n-th word beginning with `word` in beat k */
  const wk = (k: number, word: string, n = 0, off = 1) => {
    const bt = P.beats[k - 1];
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const hits = bt.words.map((x, i) => [x, i] as const).filter(([x]) => norm(x.w).startsWith(norm(word)));
    const i = hits[Math.min(n, hits.length - 1)][1];
    return bt.words[Math.min(bt.words.length - 1, i + off)].s - P.start;
  };
  const NB = 19;
  /** fade in (0.3 s) on the beat's first words, fade out (0.3 s) after beat `k1` ends */
  const span = (k0: number, k1: number) => {
    const fin = inv(b(k0) - 0.05, b(k0) + 0.25, t);
    if (k1 === NB) return fin;
    const z = Math.min(e(k1) + 0.02, b(k1 + 1) - 0.34);
    return fin * (1 - inv(z, z + 0.3, t));
  };
  const S = Array.from({ length: NB + 1 }, (_, k) => (k === 0 ? 0 : span(k, k)));
  const live = (k: number) => at(b(k) + 0.6, 0.5);

  // ================= slide 1: motivation
  const ch1 = at(b(1) + 0.1, 0.5);
  const acc1 = at(w(1, 'Accuracy') - 0.1);
  const four1 = (i: number) => at(w(1, 'four') - 0.1 + i * 0.22, 0.35);
  const CX1C = 960, Y1 = 540, ST1 = 200;

  // ================= slides 2, 4, 6, 7: the four questions share the chain at the top
  const CHY = 360;
  /** the 'in everyday terms' line */
  const ev = (k: number) => at(w(k, 'everyday') - 0.15);
  // slide 2
  const m2 = at(w(2, 'Measure') - 0.1), q2 = at(w(2, 'held') - 0.1), n2 = at(w(2, 'never') - 0.1);
  // slide 3: the formula read on three predictions
  const f3 = at(b(3) + 0.1, 0.5);
  const hd3 = at(w(3, 'bracket') - 0.1);
  const row3 = (i: number) => at(w(3, 'bracket') + 0.3 + i * 0.4, 0.4);
  const zero3 = at(w(3, 'not') - 0.1);
  const sum3 = at(w(3, 'Add') - 0.1, 0.5), res3 = at(w(3, 'two', 1) - 0.1, 0.5);
  // slide 4: concept accuracy on test image 10
  const im4 = at(w(4, 'Take') - 0.1, 0.5);
  const sc4 = (i: number) => at(w(4, 'Round') - 0.1 + i * 0.12, 0.4);
  const rd4 = (i: number) => at(w(4, 'Round') + 0.6 + i * 0.12, 0.4);
  const lb4 = (i: number) => at(w(4, 'compare') - 0.1 + i * 0.12, 0.4);
  const big4 = at(w(4, 'Large') - 0.15, 0.4);
  const mt4 = (i: number) => at(w(4, 'Four') - 0.2 + i * 0.1, 0.35);
  const frac4 = at(w(4, 'Four') + 0.4, 0.5);
  const eq4 = at(w(4, 'averages') - 0.1, 0.5);
  const R4 = EX.probs.map((v: number) => Math.round(v));
  // slide 5: grounding
  const ph5 = at(b(5) - 0.05, 0.3), chip5 = at(w(5, 'wingtip') - 0.2);
  const wing5 = inv(w(5, 'wingtip', 1) - 0.1, w(5, 'wingtip', 1) + 0.6, t), water5 = inv(w(5, 'water') - 0.1, w(5, 'water') + 0.6, t);
  const look5 = at(w(5, 'check') - 0.1);
  // slide 6: faithfulness
  const m6 = at(w(6, 'output') - 0.1);
  const def6 = at(w(6, 'faithful', 1) - 0.15);
  const rows6 = (i: number) => E.out(at(w(6, 'test') - 0.1 + i * 0.1, 0.5));
  const txt6 = at(w(6, 'change') - 0.1);
  const person6 = at(w(6, 'setting') - 0.2);
  const edit6 = inv(w(6, 'setting'), w(6, 'setting') + 0.9, t);
  const pulse6 = Math.sin(Math.PI * inv(w(6, 'lifts') - 0.3, w(6, 'lifts') + 0.6, t));
  const move6 = inv(w(6, 'lifts'), w(6, 'lifts') + 0.9, t);
  // slide 7: intervention utility
  const person7 = at(w(7, 'person') - 0.1);
  const ax7 = at(w(7, 'plot') - 0.1, 0.5);
  const cur7 = inv(w(7, 'against'), w(7, 'corrections') + 0.3, t);
  const early7 = at(w(7, 'early') - 0.1);

  // ================= slide 8: the data
  const img8 = (i: number) => E.back(at(b(8) + 0.2 + i * 0.1, 0.4));
  const cap8 = at(w(8, 'synthetic') - 0.1);
  const pair8 = [w(8, 'red'), w(8, 'circle'), w(8, 'small')].map((x) => at(x - 0.1));
  const cls8 = at(w(8, 'Two') - 0.1);
  const con8 = (i: number) => E.back(at(w(8, 'Five') + i * 0.12, 0.4));
  const det8 = E.io(at(w(8, 'determine') - 0.2, 0.6));

  // ================= slide 9: three models
  const cnn9 = at(b(9) + 0.1, 0.5);
  const same9 = at(w(9, 'training') - 0.1, 0.5);
  const col9 = [w(9, 'black'), w(9, 'multi'), w(9, 'strict')].map((x) => at(x - 0.1, 0.5));
  const mtC9 = at(w(9, 'concept') - 0.1, 0.5), mtK9 = at(w(9, 'class', 1) - 0.1, 0.5);
  const live9 = live(9);

  // ================= slide 10: task accuracy
  const ACC = [M.acc.black_box, M.acc.multitask, M.acc.cbm] as number[];
  const COLT = ['black box', 'multi-task', 'strict CBM'];
  const ax10 = at(b(10) + 0.1, 0.5);
  const acc10 = [w(10, '78'), w(10, '82'), w(10, '81')].map((x) => E.out(at(x - 0.25, 0.9)));
  const same10 = at(w(10, 'alone') - 0.1, 0.5);

  // ================= slide 11: concept accuracy
  const big11 = at(w(11, '92') - 0.15, 0.5);
  const per11 = (i: number) => E.out(at(w(11, 'split') - 0.1 + i * 0.12, 0.6));
  const col11 = at(w(11, 'Colour') - 0.1, 0.5), shp11 = at(w(11, 'shape') - 0.1, 0.5);

  // ================= slide 12: one test image
  const im12 = at(b(12), 0.5);
  const truth12 = at(w(12, 'small') - 0.1);
  const rows12 = (i: number) => E.out(at(w(12, 'Its') - 0.3 + i * 0.12, 0.6));
  const size12 = at(w(12, 'large') - 0.1);
  const pred12 = at(w(12, 'predicts') - 0.1, 0.5);
  const person12 = at(w(12, 'sets') - 0.2, 0.4);
  const edit12 = inv(wk(12, 'sets', 0, 3), wk(12, 'sets', 0, 3) + 0.8, t);
  const pulse12 = Math.sin(Math.PI * inv(w(12, 'same'), w(12, 'same') + 0.8, t));
  const new12 = at(w(12, 'predicts', 1) - 0.1, 0.5);
  const old12 = pred12 * (1 - at(w(12, 'same') + 0.2, 0.3));
  const live12 = live(12);

  // ================= slide 13: the oracle picks the largest error
  const im13 = at(b(13) + 0.1, 0.5);
  const or13 = at(w(13, 'oracle') - 0.1, 0.5);
  const rows13 = (i: number) => E.out(at(w(13, 'largest') - 0.1 + i * 0.12, 0.5));
  const hi13 = at(w(13, 'square') - 0.1, 0.5);
  const eq13 = at(w(13, 'away') - 0.2, 0.5);
  const ERR13: number[] = EX.probs.map((v: number, i: number) => Math.abs(v - EX.true[i]));
  const IMAX = ERR13.indexOf(Math.max(...ERR13));

  // ================= slides 14 to 15: the curve (one chart, kept across both slides)
  const S1415 = span(14, 15);
  const axes14 = at(b(14), 0.5);
  const hor14 = Math.sin(Math.PI * inv(w(14, 'horizontal') - 0.1, w(14, 'horizontal') + 1.4, t));
  const ver14 = Math.sin(Math.PI * inv(w(14, 'vertical') - 0.1, w(14, 'vertical') + 1.4, t));
  const leg14 = at(w(14, 'oracle') - 0.1);
  const p0 = at(w(14, '81') - 0.1);
  const u1 = inv(w(14, '97') - 0.7, w(14, '97'), t);
  const u5 = inv(w(14, 'With'), w(14, '100'), t);
  const oU = p0 > 0 ? u1 + u5 * 4 : 0; // 0..5 drawn length of the oracle line
  const lab97 = at(w(14, '97')), lab100 = at(w(14, '100') - 0.1);
  const rndP = inv(w(15, 'random'), w(15, 'slowly'), t) * 5;
  const lab87 = at(w(15, '87') - 0.1);
  const legR = at(w(15, 'random') - 0.1);
  const band15 = at(w(15, 'shaded') - 0.1, 0.6);
  const why15 = at(w(15, 'already') - 0.3, 0.5);
  const dimOr = 1 - 0.45 * at(w(15, 'random'), 0.5);
  const OR: number[] = M.oracle, RM: number[] = M.random_mean, RMIN: number[] = M.random_min, RMAX: number[] = M.random_max;
  const partial = (vals: number[], u: number): [number, number][] => {
    const pts: [number, number][] = [];
    for (let k = 0; k <= 5; k++) {
      if (k <= u) pts.push([cxk(k), cyv(vals[k])]);
      else {
        const f = u - (k - 1);
        if (f > 0) pts.push([lerp(cxk(k - 1), cxk(k), f), cyv(lerp(vals[k - 1], vals[k], f))]);
        break;
      }
    }
    return pts;
  };
  const orPts = partial(OR, oU), rmPts = partial(RM, rndP);
  const band = `M ${RMAX.map((v, k) => `${cxk(k)} ${cyv(v)}`).join(' L ')} L ${RMIN.map((_, k) => `${cxk(5 - k)} ${cyv(RMIN[5 - k])}`).join(' L ')} Z`;

  // ================= slide 16: the multi-task edit
  const edit16 = at(w(16, 'Edit') - 0.1, 0.5);
  const editP16 = inv(w(16, 'concept'), w(16, 'concept') + 0.8, t);
  const same16 = at(w(16, 'exactly') - 0.1, 0.5);
  const never16t = at(w(16, 'never') - 0.1, 0.5);
  const live16m = live(16);

  // ================= slide 17: caveats
  const cav17 = [w(17, 'one'), w(17, '512'), w(17, 'corrections'), w(17, 'standing')].map((x) => at(x - 0.1, 0.5));
  const real17 = at(w(17, 'Real') - 0.1, 0.5);
  const CAV = ['one training seed: a single training run', '512 synthetic test images', 'oracle corrections from the true labels', 'no human study: a perfect, effortless expert'];

  // ================= slide 18: the lesson
  const row18 = (i: number) => at(b(18) + 0.1 + i * 0.25, 0.4);
  const hi18 = (i: number) => {
    const all = at(w(18, 'Each') - 0.1, 0.4);
    if (i === 0) return Math.max(all, at(w(18, 'similar') - 0.1) * (1 - at(w(18, 'yet'), 0.4)));
    if (i === 3) return Math.max(all, at(w(18, 'intervention') - 0.1));
    return all;
  };
  const L18: { name: string; col: string; main: string; sub: string }[] = [
    { name: 'task accuracy', col: C.chalk, main: `${pc(ACC[0])} %  ·  ${pc(ACC[1])} %  ·  ${pc(ACC[2])} %`, sub: 'black box · multi-task · strict CBM' },
    { name: 'concept accuracy', col: C.concept, main: `${pc(M.concept_acc.cbm)} % of concept values (strict CBM)`, sub: 'grounding: not measured here' },
    { name: 'faithfulness', col: HEADC, main: "strict CBM: the head reads only the concepts", sub: 'multi-task: the class head ignores them' },
    { name: 'intervention utility', col: C.edit, main: `one correction: ${pc(OR[0])} → ${pc(OR[1])} % (strict CBM), no change (multi-task)`, sub: 'human cost: not measured here' },
  ];

  // ================= slide 19: why similar accuracy can hide different intervention utility
  const pan19 = at(b(19) + 0.1, 0.5);
  const acc19 = at(w(19, 'similar') - 0.1, 0.5);
  const line19 = at(w(19, 'marks') - 0.2, 0.5);
  const mt19 = at(w(19, 'multi') - 0.2, 0.5);
  const never19 = inv(w(19, 'never') - 0.1, w(19, 'never') + 0.7, t);
  const editMT = inv(w(19, 'fixing'), w(19, 'fixing') + 0.8, t);
  const noch19 = at(w(19, 'nobody') - 0.1, 0.5);
  const road19 = at(w(19, 'only') - 0.2, 0.6);
  const editCB = inv(w(19, 'fix', 1), w(19, 'fix', 1) + 0.8, t);
  const pulse19 = Math.sin(Math.PI * inv(w(19, 'reaches'), w(19, 'reaches') + 0.9, t));
  const res19 = at(w(19, 'prediction') - 0.1, 0.5);
  const take19 = at(w(19, 'prediction') + 0.5, 0.5);
  const live19 = live(19);
  const V0 = [0.9, 0.1, 0.8, 0.2, 0.7], V1 = [0.9, 0.1, 0.8, 0.2, 0];
  const mix = (p: number) => V0.map((v, i) => lerp(v, V1[i], E.io(p)));
  const PY = 610; // the row both small diagrams sit on

  return (
    <Stage>
      {/* ================= slide 1: motivation ================= */}
      <Slide o={S[1]}>
        <Svg>
          <Chain cx={CX1C} y={Y1} hl={acc1 > 0.5 ? ['y'] : []} links={acc1 > 0.5 ? [3] : []} t={t} live={acc1} o={ch1} step={ST1} bw0={110} bh0={74} ts={40} />
          <Num x={nodeX(CX1C, 4, ST1)} y={Y1 - 92} n={1} color={C.chalk} o={four1(0)} />
          <Num x={nodeX(CX1C, 2, ST1)} y={Y1 - 92} n={2} color={C.concept} o={four1(1)} />
          <Num x={nodeX(CX1C, 3, ST1)} y={Y1 - 92} n={3} color={HEADC} o={four1(2)} />
          <Num x={nodeX(CX1C, 2, ST1) - 40} y={Y1 + 100} n={4} color={C.edit} o={four1(3)} />
          <Person x={nodeX(CX1C, 2, ST1) + 26} y={Y1 + 104} s={0.75} o={four1(3)} />
        </Svg>
        <Rich x={nodeX(CX1C, 4, ST1)} y={Y1 + 64} ax="center" size={30} text="{y:accuracy} looks here" o={acc1} />
        <Rich x={960} y={790} ax="center" size={36} text="four questions, each about a different part of the model" o={four1(0)} />
      </Slide>
      <SlideHead text={bh(P, 1)} o={S[1] * at(b(1) + 0.1)} />

      {/* ================= slide 2: task accuracy ================= */}
      <Slide o={S[2]}>
        <Svg><Chain cx={960} y={CHY} hl={['y']} links={[3]} t={t} live={live(2)} /></Svg>
        <Plain x={960} y={430} ax="center" text="is the final {y:answer} right?" o={ev(2)} />
        <HText x={960} y={580} ax="center" size={24} mono weight={700} color={C.mute} o={m2}>MEASURE</HText>
        <Rich x={960} y={624} ax="center" size={36} text="the share of held-out {x:test images} classified correctly" o={q2} />
        <Rich x={960} y={720} ax="center" size={30} color={C.chalk2} text="held-out: images the model never saw during training" o={n2} />
      </Slide>
      <SlideHead text={bh(P, 2)} o={S[2]} />

      {/* ================= slide 3: the formula on three predictions ================= */}
      <Slide o={S[3]}>
        <Tex x={960} y={350} ax="center" size={52} tex={'\\text{task accuracy} = \\frac{1}{N}\\sum_{i=1}^{N} \\mathbf{1}\\big[\\,\\yh_i = y_i\\,\\big]'} o={f3} />
        <Rich x={960} y={430} ax="center" size={26} color={C.chalk2} text="$N$ test images; $\mathbf{1}[\cdot]$ is 1 when its statement is true, 0 otherwise" o={hd3} />
        <Svg>
          <g opacity={hd3 < 0.999 ? hd3 : undefined}>
            <line x1={400} x2={1520} y1={540} y2={540} stroke={C.line} strokeWidth={2} />
          </g>
          {PRED3.map(([pr, lb], i) => {
            const o = row3(i), y = 584 + i * 66, ok = pr === lb;
            return o <= 0.001 ? null : (
              <g key={i} opacity={o < 0.999 ? o : undefined}>
                <Txt x={600} y={y} size={30} fill={C.chalk}>{pr}</Txt>
                <Txt x={1000} y={y} size={30} fill={C.chalk2}>{lb}</Txt>
                {!ok && zero3 > 0.01 ? <rect x={1290} y={y - 26} width={60} height={52} rx={10} fill={rgba(C.bad, 0.14 * zero3)} stroke={C.bad} strokeWidth={2.5} opacity={zero3} /> : null}
                <Txt x={1320} y={y} size={34} mono weight={700} fill={ok ? C.good : C.bad}>{ok ? '1' : '0'}</Txt>
              </g>
            );
          })}
        </Svg>
        <Rich x={600} y={498} ax="center" size={28} color={C.chalk2} text="prediction $\yh_i$" o={hd3} />
        <Rich x={1000} y={498} ax="center" size={28} color={C.chalk2} text="true label $y_i$" o={hd3} />
        <Rich x={1320} y={498} ax="center" size={28} color={C.chalk2} text="$\mathbf{1}[\yh_i = y_i]$" o={hd3} />
        <Tex x={1080} y={818} ax="right" size={48} tex={'\\text{task accuracy} = \\dfrac{1 + 1 + 0}{3}'} o={sum3} />
        <Tex x={1100} y={818} ax="left" size={48} tex={'= \\dfrac{2}{3}'} o={res3} />
        <EvTag x={1760} y={918} ax="right" kind="illustrative" text="three predictions for teaching" o={row3(0)} />
      </Slide>
      <SlideHead text={bh(P, 3)} o={S[3]} />

      {/* ================= slide 4: concept accuracy on one image ================= */}
      <Slide o={S[4]}>
        <Svg><Chain cx={960} y={CHY} hl={['c']} links={[1]} t={t} live={live(4)} /></Svg>
        <Plain x={960} y={410} ax="center" text="did the model read the {c:evidence} correctly?" o={ev(4)} />
        <PhotoR R={{ x: 200, y: 540, w: 190, h: 190 }} src={EX.image} pixel o={im4} radius={6} />
        <HText x={295} y={746} ax="center" size={24} mono color={C.mute} o={im4}>{`test image ${EX.index}`}</HText>
        <Rich x={295} y={780} ax="center" size={26} color={C.chalk2} text={`{y:${CLS[EX.true_class]}}`} o={im4} />
        <Svg>
          {CN.map((n, i) => {
            const y = 560 + i * 50;
            const isBig = i === EX.corrected_index;
            return (
              <g key={n}>
                {isBig && big4 > 0.01 ? <rect x={460} y={y - 22} width={860} height={44} rx={8} fill={rgba(C.bad, 0.08 * big4)} stroke={C.bad} strokeWidth={2} opacity={big4} /> : null}
                <Txt x={TX.name} y={y} size={28} anchor="end" fill={C.concept} o={sc4(i)}>{n}</Txt>
                <Txt x={TX.score} y={y} size={28} mono fill={C.concept} o={sc4(i)}>{EX.probs[i].toFixed(2)}</Txt>
                <Txt x={TX.round} y={y} size={28} mono fill={C.chalk} o={rd4(i)}>{String(R4[i])}</Txt>
                <Txt x={TX.label} y={y} size={28} mono fill={C.concept} o={lb4(i)}>{EX.true[i].toFixed(0)}</Txt>
                <Txt x={TX.last} y={y} size={30} mono weight={700} fill={R4[i] === EX.true[i] ? C.good : C.bad} o={mt4(i)}>{R4[i] === EX.true[i] ? '1' : '0'}</Txt>
              </g>
            );
          })}
        </Svg>
        <Rich x={TX.score} y={496} ax="center" size={26} color={C.chalk2} text="score $\ch$" o={sc4(0)} />
        <Rich x={TX.round} y={496} ax="center" size={26} color={C.chalk2} text="$\mathrm{round}(\ch)$" o={rd4(0)} />
        <Rich x={TX.label} y={496} ax="center" size={26} color={C.chalk2} text="label $\ccon{c}$" o={lb4(0)} />
        <Rich x={TX.last} y={496} ax="center" size={26} color={C.chalk2} text="match" o={mt4(0)} />
        <HText x={1560} y={640} ax="center" ay="middle" size={72} weight={700} color={C.concept} o={frac4}>4 / 5</HText>
        <Rich x={1560} y={700} ax="center" size={28} color={C.chalk2} text="values right on this image" o={frac4} />
        <Tex x={960} y={872} ax="center" size={40} tex={'\\text{concept acc.} = \\frac{1}{N k}\\sum_{i,j} \\mathbf{1}\\big[\\,\\mathrm{round}(\\ch_{ij}) = \\ccon{c_{ij}}\\,\\big]'} o={eq4} />
        <EvTag x={1760} y={930} ax="right" kind="measured" text={`saved model, test image ${EX.index}`} o={im4} />
      </Slide>
      <SlideHead text={bh(P, 4)} o={S[4]} />

      {/* ================= slide 5: grounding ================= */}
      <Slide o={S[5]}>
        <PhotoR R={PH5} src="gull.jpg" o={ph5} />
        <Credit x={PH5.x} y={PH5.y + PH5.h + 8} text={CREDIT['gull.jpg']} o={ph5} />
        <Svg>
          <Chain cx={1180} y={CHY} hl={['g', 'c']} links={[1]} t={t} live={live(5)} step={130} bw0={76} bh0={52} ts={28} />
          <g opacity={chip5 < 0.999 ? chip5 : undefined}>
            <rect x={CHIP5.x} y={CHIP5.y - CHIP5.h / 2} width={CHIP5.w} height={CHIP5.h} rx={12} fill={rgba(C.concept, 0.14)} stroke={C.concept} strokeWidth={3} />
            <Txt x={CHIP5.x + CHIP5.w / 2} y={CHIP5.y} size={30} weight={600} fill={C.concept}>wingtip black</Txt>
          </g>
          <Region R={PH5} b={D.gull.regions.wingtip} color={C.concept} draw={E.out(wing5)} sw={4} />
          <Flow pts={[[ux(PH5, D.gull.regions.wingtip[0] + D.gull.regions.wingtip[2] / 2) + 6, vy(PH5, D.gull.regions.wingtip[1])], [CHIP5.x - 60, vy(PH5, D.gull.regions.wingtip[1])], [CHIP5.x - 8, CHIP5.y + 18]]}
            color={C.concept} sw={3.5} head={14} p={E.io(inv(0.3, 1, wing5))} />
          <Txt x={CHIP5.x - 330} y={vy(PH5, D.gull.regions.wingtip[1]) + 34} size={28} weight={600} anchor="start" fill={C.concept} o={inv(0.6, 1, wing5)}>intended evidence: wingtip</Txt>
          <Region R={PH5} b={WATER} color={C.bad} draw={E.out(water5)} sw={4} dash={water5 > 0.99 ? '10 8' : undefined} />
          <Flow pts={[[ux(PH5, WATER[0] + WATER[2] / 2) + 6, vy(PH5, WATER[1])], [CHIP5.x - 60, vy(PH5, WATER[1])], [CHIP5.x - 8, CHIP5.y - 18]]}
            color={C.bad} dash="6 9" sw={3.5} head={14} p={E.io(inv(0.3, 1, water5))} />
          <Txt x={CHIP5.x - 330} y={vy(PH5, WATER[1]) - 30} size={28} weight={600} anchor="start" fill={C.bad} o={inv(0.6, 1, water5)}>not this: water</Txt>
        </Svg>
        <Rich x={CHIP5.x - 330} y={830} w={900} size={32} text="{c:grounding}: check where the detector looks" o={look5} />
        <EvTag x={1760} y={910} ax="right" kind="schematic" text="regions drawn by hand" o={wing5} />
      </Slide>
      <SlideHead text={bh(P, 5)} o={S[5]} />

      {/* ================= slide 6: faithfulness ================= */}
      <Slide o={S[6]}>
        <Svg>
          <Chain cx={960} y={CHY} hl={['c', 'f', 'y']} links={[2, 3]} t={t} live={live(6)} o={m6 > 0 ? 1 : at(b(6))} />
          {B.labels.map((l: string, i: number) => (
            <ConceptRow key={l} x={220} y={536 + i * 58} label={l} v={B.before.c[i]} labelW={230} w={200} p={rows6(i)} o={Math.min(1, rows6(i) * 2)} size={26}
              edit={i < 2 ? { to: B.after.c[i], p: edit6 } : undefined} />
          ))}
          <Person x={186} y={574} s={0.62} o={person6} />
          {B.labels.map((_: string, i: number) => (
            <Flow key={i} pts={[[760, 536 + i * 58], [830, 652]]} color={C.concept} sw={2.5} head={0} o={rows6(4)} t={t + i * 0.2} live={live(6)} n={1} dotR={4.5} />
          ))}
          <Block x={895} y={652} w={120} h={90} kind="head" title="head" size={26} o={rows6(4)} hi={pulse6} />
          <Flow pts={[[958, 652], [1020, 652]]} color={C.chalk2} sw={3} head={11} o={rows6(4)} />
          <ShareBars x={1040} y={622} labels={BIRD_SHORT} from={B.before.share} to={B.after.share} k={move6} labelW={230} w={220} rowH={62} o={rows6(4)} p={rows6(4)} />
        </Svg>
        <Rich x={960} y={430} ax="center" w={1500} size={32} text="{m:Faithful:} the explanation tells the truth about how the {y:answer} was made" o={def6} />
        <Rich x={1120} y={832} ax="center" size={32} text="change a {c:concept}: the {y:output} should move as the {f:head} says" o={txt6} />
        <EvTag x={1760} y={900} ax="right" kind="illustrative" text="the gull head from Part 2" o={rows6(0)} />
      </Slide>
      <SlideHead text={bh(P, 6)} o={S[6]} />

      {/* ================= slide 7: intervention utility ================= */}
      <Slide o={S[7]}>
        <Svg>
          <Chain cx={960} y={CHY} hl={['c', 'y']} links={[2, 3]} t={t} live={live(7)} />
          <Person x={nodeX(960, 2, 150) - 8} y={CHY + 76} s={0.7 * E.back(person7)} o={person7} />
          <g opacity={ax7 < 0.999 ? ax7 : undefined}>
            <line x1={640} y1={850} x2={1300} y2={850} stroke={C.line2} strokeWidth={2.5} />
            <line x1={640} y1={850} x2={640} y2={630} stroke={C.line2} strokeWidth={2.5} />
            <Txt x={970} y={886} size={28} fill={C.chalk2}>corrections made (human time)</Txt>
            <Txt x={620} y={740} size={28} anchor="end" fill={C.chalk2}>accuracy</Txt>
          </g>
          {cur7 > 0.001 ? (
            <polyline points={Array.from({ length: Math.max(2, Math.round(60 * cur7)) }, (_: unknown, i: number) => {
              const u = (i / Math.max(1, Math.round(60 * cur7) - 1)) * cur7;
              return `${(640 + u * 640).toFixed(1)},${(830 - 180 * (1 - Math.exp(-u * 3.2)) / (1 - Math.exp(-3.2))).toFixed(1)}`;
            }).join(' ')} fill="none" stroke={C.edit} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
          ) : null}
        </Svg>
        <Rich x={960} y={500} ax="center" w={1300} size={32} text="when a person {e:fixes a concept}, does the {y:answer} improve, and at what cost in time?" o={person7} />
        <Rich x={1330} y={660} size={30} text="rises early: {e:better}" o={early7} />
        <EvTag x={1760} y={900} ax="right" kind="schematic" text="shape of a curve, no data" o={ax7} />
      </Slide>
      <SlideHead text={bh(P, 7)} o={S[7]} />

      {/* ================= slide 8: the data ================= */}
      <Slide o={S[8]}>
        {TESTS.map((src, i) => {
          const s = img8(i), r = Math.floor(i / 3), c = i % 3;
          const x = 200 + c * 128, y = 330 + r * 128;
          return <PhotoR key={src} R={{ x: x + 58 * (1 - s), y: y + 58 * (1 - s), w: 116 * s, h: 116 * s }} src={src} pixel o={Math.min(1, s)} radius={6} />;
        })}
        <Svg>
          {[['red', 'blue'], ['circle', 'square'], ['small', 'large']].map((pr, k) => (
            <g key={k} opacity={pair8[k]}>
              <Chip x={850} y={380 + k * 80} text={pr[0]} />
              <Txt x={960} y={380 + k * 80} size={26} fill={C.mute}>or</Txt>
              <Chip x={1080} y={380 + k * 80} text={pr[1]} />
            </g>
          ))}
          <path d="M 1190 352 q 18 0 18 18 L 1208 522 q 0 18 -18 18" fill="none" stroke={C.chalk2} strokeWidth={3} opacity={cls8} />
          <Flow pts={[[1222, 460], [1290, 460]]} color={C.chalk2} sw={3} head={11} o={cls8} />
          {CN.map((n, i) => (
            <Chip key={n} x={900 + i * 170} y={680} text={n} color={C.concept} fill={rgba(C.concept, 0.12)} s={con8(i)} o={Math.min(1, con8(i))} size={26} />
          ))}
          {[0, 1, 2, 3, 4].map((j) => (
            <Flow key={j} pts={[[900 + j * 170, 712], [1240, 790]]} color={C.concept} p={det8} sw={2.5} head={0} t={t + j * 0.3} live={det8 > 0.98 ? 1 : 0} n={1} dotR={4.5} />
          ))}
        </Svg>
        <HText x={386} y={735} ax="center" size={24} mono color={C.mute} o={cap8}>real test inputs, 64 × 64 px</HText>
        <Rich x={1310} y={440} ay="middle" size={36} text="{y:8 classes}" o={cls8} />
        <HText x={1310} y={490} ay="middle" size={28} mono color={C.chalk2} o={cls8}>2 × 2 × 2</HText>
        <Rich x={812} y={680} ay="middle" ax="right" size={32} text="{c:5 concepts}" o={con8(0) > 0 ? Math.min(1, con8(0)) : 0} />
        <HText x={812} y={718} ax="right" size={22} color={C.mute} o={con8(4) > 0 ? Math.min(1, con8(4)) : 0}>each 1 (yes) or 0 (no)</HText>
        <Rich x={1240} y={812} ax="center" size={32} text="the {c:concepts} fully determine the {y:class}" o={det8} />
        <EvTag x={1760} y={890} ax="right" kind="measured" text={TAGTXT} o={img8(0) > 0 ? Math.min(1, img8(0)) : 0} />
      </Slide>
      <SlideHead text={bh(P, 8)} o={S[8]} />

      {/* ================= slide 9: three models ================= */}
      <Slide o={S[9]}>
        {ROWS.map((y, k) => (
          <PhotoR key={k} R={{ x: 440, y: y - 34, w: 68, h: 68 }} src={['test_000.png', 'test_013.png', 'test_010.png'][k]} pixel o={cnn9} radius={4} />
        ))}
        <Svg>
          {ROWS.map((y, k) => (
            <g key={k}>
              <Flow pts={[[516, y], [580, y]]} color={C.input} o={cnn9} head={10} sw={3} />
              <Block x={645} y={y} w={110} h={70} kind="input" title="CNN" size={26} o={cnn9} />
            </g>
          ))}
          <g opacity={same9 * 0.8}>
            <line x1={645} y1={ROWS[0] + 38} x2={645} y2={ROWS[1] - 38} stroke={C.input} strokeWidth={2.5} strokeDasharray="6 6" />
            <line x1={645} y1={ROWS[1] + 38} x2={645} y2={ROWS[2] - 38} stroke={C.input} strokeWidth={2.5} strokeDasharray="6 6" />
          </g>
          {/* black box */}
          <g opacity={col9[0]}>
            <Flow pts={[[702, ROWS[0]], [790, ROWS[0]]]} color={C.input} head={10} sw={3} t={t} live={live9} n={2} dotR={5} />
            <Block x={850} y={ROWS[0]} w={110} h={70} kind="head" title="head" size={24} />
            <Flow pts={[[907, ROWS[0]], [970, ROWS[0]]]} color={C.chalk2} head={10} sw={3} t={t} live={live9} n={1} dotR={5} />
            <MathSvg x={1000} y={ROWS[0]} tex={'\\hat{y}'} size={34} />
          </g>
          {/* multi-task */}
          <g opacity={col9[1]}>
            <g opacity={mtC9}>
              <Flow pts={[[702, ROWS[1] - 10], [740, ROWS[1] - 46], [790, ROWS[1] - 46]]} color={C.input} head={10} sw={3} t={t} live={live9} n={1} dotR={5} />
              <Block x={862} y={ROWS[1] - 46} w={136} h={54} kind="concept" title="concepts" size={22} />
              <Flow pts={[[932, ROWS[1] - 46], [980, ROWS[1] - 46]]} color={C.concept} head={10} sw={3} t={t} live={live9} n={1} dotR={5} />
              <Ticks x={1016} y={ROWS[1] - 46} vals={[0.9, 0.1, 0.8, 0.2, 0.7]} w={40} dy={11} />
            </g>
            <g opacity={mtK9}>
              <Flow pts={[[702, ROWS[1] + 10], [740, ROWS[1] + 46], [790, ROWS[1] + 46]]} color={C.input} head={10} sw={3} t={t + 0.5} live={live9} n={1} dotR={5} />
              <Block x={862} y={ROWS[1] + 46} w={136} h={54} kind="head" title="class" size={22} />
              <Flow pts={[[932, ROWS[1] + 46], [980, ROWS[1] + 46]]} color={C.chalk2} head={10} sw={3} t={t} live={live9} n={1} dotR={5} />
              <MathSvg x={1010} y={ROWS[1] + 46} tex={'\\hat{y}'} size={34} />
            </g>
          </g>
          {/* strict CBM */}
          <g opacity={col9[2]}>
            <Flow pts={[[702, ROWS[2]], [756, ROWS[2]]]} color={C.input} head={10} sw={3} t={t} live={live9} n={1} dotR={5} />
            <rect x={762} y={ROWS[2] - 56} width={64} height={112} rx={8} fill={rgba(C.concept, 0.1)} stroke={C.concept} strokeWidth={2} />
            <Ticks x={794} y={ROWS[2]} vals={[0.9, 0.1, 0.8, 0.2, 0.7]} w={40} dy={19} />
            <Flow pts={[[830, ROWS[2]], [880, ROWS[2]]]} color={C.concept} head={10} sw={3} t={t} live={live9} n={1} dotR={5} />
            <Block x={935} y={ROWS[2]} w={96} h={70} kind="head" title="head" size={22} />
            <Flow pts={[[985, ROWS[2]], [1030, ROWS[2]]]} color={C.chalk2} head={9} sw={3} t={t} live={live9} n={1} dotR={5} />
            <MathSvg x={1060} y={ROWS[2]} tex={'\\hat{y}'} size={34} />
            <MathSvg x={794} y={ROWS[2] - 80} tex={'\\hat{c}'} size={28} color={C.concept} />
          </g>
        </Svg>
        {COLT.map((n, k) => (
          <HText key={n} x={180} y={ROWS[k]} ay="middle" size={32} weight={600} o={col9[k]}>{n}</HText>
        ))}
        <Rich x={1120} y={ROWS[0]} ay="middle" w={640} size={30} text={`same small {x:CNN}, same data, ${M.protocol.epochs} epochs`} o={same9} />
        <HText x={1120} y={ROWS[0] + 44} ay="middle" size={24} color={C.mute} o={same9}>{`epoch: one pass through the ${M.protocol.train_n} training images`}</HText>
        <Rich x={1120} y={ROWS[1]} ay="middle" w={640} size={28} color={C.chalk2} text="the {f:class head} sits beside the {c:concepts}" o={mtK9} />
        <Rich x={1120} y={ROWS[2]} ay="middle" w={640} size={28} color={C.chalk2} text="the {f:head} reads only the {c:concepts}" o={col9[2]} />
      </Slide>
      <SlideHead text={bh(P, 9)} o={S[9]} />

      {/* ================= slide 10: task accuracy ================= */}
      <Slide o={S[10]}>
        <Svg>
          <g opacity={ax10 < 0.999 ? ax10 : undefined}>
            <line x1={560} y1={ACCY[0] - 60} x2={560} y2={ACCY[2] + 50} stroke={C.line2} strokeWidth={2} />
            <line x1={1560} y1={ACCY[0] - 60} x2={1560} y2={ACCY[2] + 50} stroke={C.line} strokeWidth={1.5} strokeDasharray="6 8" />
            <Txt x={560} y={ACCY[0] - 80} size={22} mono fill={C.mute}>0</Txt>
            <Txt x={1560} y={ACCY[0] - 80} size={22} mono fill={C.mute}>100 %</Txt>
          </g>
          {ACCY.map((y, k) => (
            <g key={k} opacity={inv(0, 0.1, acc10[k])}>
              <Txt x={520} y={y} size={34} anchor="end" weight={600} fill={C.chalk}>{COLT[k]}</Txt>
              <rect x={560} y={y - 28} width={1000 * ACC[k] * acc10[k]} height={56} rx={6} fill={C.chalk} opacity={0.9} />
              <Txt x={560 + 1000 * ACC[k] * acc10[k] + 20} y={y} size={34} mono weight={700} anchor="start" fill={C.chalk} o={inv(0.5, 1, acc10[k])}>{`${pc(ACC[k])} %`}</Txt>
            </g>
          ))}
        </Svg>
        <Rich x={960} y={790} ax="center" size={30} color={C.chalk2} text="each bar: the share of the 512 {x:test images} classified correctly" o={ax10} />
        <Rich x={960} y={842} ax="center" size={32} text="on this question alone, the three look about the same" o={same10} />
        <EvTag x={1760} y={905} ax="right" kind="measured" text={TAGTXT} o={ax10} />
      </Slide>
      <SlideHead text={bh(P, 10)} o={S[10]} />

      {/* ================= slide 11: concept accuracy ================= */}
      <Slide o={S[11]}>
        <Svg>
          {CN.map((n, i) => {
            const y = 420 + i * 72, p = per11(i);
            const hi = i < 2 ? col11 : i < 4 ? shp11 : 0;
            return (
              <g key={n} opacity={inv(0, 0.1, p)}>
                {hi > 0.01 ? <rect x={250} y={y - 26} width={680} height={52} rx={10} fill={rgba(C.concept, 0.08 * hi)} stroke={rgba(C.concept, 0.6 * hi)} strokeWidth={2} /> : null}
                <Txt x={360} y={y} size={30} anchor="end" fill={C.chalk}>{n}</Txt>
                <rect x={390} y={y - 16} width={420} height={32} rx={5} fill={C.bg3} />
                <rect x={390} y={y - 16} width={420 * PCC[i] * p} height={32} rx={5} fill={C.concept} opacity={0.9} />
                <Txt x={830} y={y} size={28} mono anchor="start" fill={C.chalk2} o={inv(0.5, 1, p)}>{`${pc(PCC[i])} %`}</Txt>
              </g>
            );
          })}
        </Svg>
        <HText x={390} y={350} size={24} mono weight={700} color={C.mute} o={per11(0)}>PER CONCEPT</HText>
        <HText x={1380} y={540} ax="center" ay="middle" size={120} weight={700} color={C.concept} o={big11}>{`${pc(M.concept_acc.cbm)} %`}</HText>
        <Rich x={1380} y={630} ax="center" size={34} text="of {c:concept values} correct, strict CBM" o={big11} />
        <Rich x={1380} y={690} ax="center" size={28} color={C.chalk2} text="all 512 images × 5 concepts" o={big11} />
        <EvTag x={1760} y={890} ax="right" kind="measured" text={TAGTXT} o={big11} />
      </Slide>
      <SlideHead text={bh(P, 11)} o={S[11]} />

      {/* ================= slide 12: one test image ================= */}
      <Slide o={S[12]}>
        <PhotoR R={IMG10} src={EX.image} pixel o={im12} />
        <Svg>
          <Flow pts={[[IMG10.x + IMG10.w + 8, 505], [570, 505]]} color={C.input} head={10} sw={3.5} o={im12} t={t} live={live12} n={1} dotR={5} />
          <Block x={630} y={505} w={110} h={86} kind="input" title="CNN" size={26} o={im12} />
          {CN.map((_, i) => (
            <Flow key={i} pts={[[686, 505], [730, 360 + i * 72]]} color={C.input} sw={2.5} head={0} o={rows12(i)} t={t + i * 0.2} live={live12} n={1} dotR={4.5} />
          ))}
          {CN.map((n, i) => (
            <ConceptRow key={n} x={746} y={360 + i * 72} label={n} v={EX.probs[i]} labelW={120} w={230} p={rows12(i)} o={Math.min(1, rows12(i) * 2)}
              hi={i === EX.corrected_index ? size12 : 0} edit={i === EX.corrected_index ? { to: EX.corrected[i], p: edit12 } : undefined} />
          ))}
          {CN.map((_, i) => (
            <Flow key={`h${i}`} pts={[[1206, 360 + i * 72], [1260, 505]]} color={C.concept} sw={2.5} head={0} o={pred12} t={t + i * 0.25} live={live12} n={1} dotR={4.5} />
          ))}
          <Block x={1318} y={505} w={110} h={86} kind="head" title="head" size={26} o={pred12} hi={pulse12} />
          <Flow pts={[[1375, 505], [1420, 505]]} color={C.chalk2} head={10} sw={3.5} o={pred12} t={t} live={live12} n={1} dotR={5} />
          <Tick x={1450} y={580} o={new12} s={E.back(new12)} />
          <Person x={1150} y={740} s={0.8 * E.back(person12)} o={person12} />
        </Svg>
        <HText x={IMG10.x + IMG10.w / 2} y={IMG10.y - 36} ax="center" size={24} mono color={C.mute} o={im12}>{`test image ${EX.index}`}</HText>
        <Rich x={IMG10.x + IMG10.w / 2} y={IMG10.y + IMG10.h + 18} ax="center" size={28} color={C.chalk2} text={`true class: {y:${CLS[EX.true_class]}}`} o={truth12} />
        <HText x={1436} y={430} size={22} mono color={C.mute} o={pred12}>prediction</HText>
        <HText x={1436} y={505} ay="middle" size={36} weight={700} o={old12}>{CLS[EX.pred_class]}</HText>
        <HText x={1436} y={505} ay="middle" size={36} weight={700} o={new12}>{CLS[EX.after_class]}</HText>
        <HText x={1478} y={580} ay="middle" size={24} color={C.good} o={new12}>matches the true class</HText>
        <Rich x={1188} y={740} ay="middle" size={28} text={`{e:correct: large → ${EX.corrected[EX.corrected_index].toFixed(0)}}`} o={person12} />
        <Tex x={1000} y={830} ax="right" size={40} o={rows12(4)} tex={`\\cvec = \\ccon{(${V10(EX.probs)})}`} />
        <Tex x={1024} y={830} ax="left" size={40} o={at(wk(12, 'sets', 0, 3) + 0.3, 0.5)}
          tex={`\\to\\ \\ccon{(${V10(EX.probs.slice(0, 4))},\\ }\\cedit{${EX.corrected[4].toFixed(0)}}\\ccon{)}`} />
        <EvTag x={1760} y={890} ax="right" kind="measured" text={`saved model, test image ${EX.index}`} o={im12} />
      </Slide>
      <SlideHead text={bh(P, 12)} o={S[12]} />

      {/* ================= slide 13: the oracle picks the largest error ================= */}
      <Slide o={S[13]}>
        <PhotoR R={{ x: 200, y: 400, w: 190, h: 190 }} src={EX.image} pixel o={im13} radius={6} />
        <HText x={295} y={606} ax="center" size={24} mono color={C.mute} o={im13}>{`test image ${EX.index}`}</HText>
        <Svg>
          <g transform="translate(0 -30)">
            {CN.map((n, i) => {
              const y = 460 + i * 52, o = rows13(i), big = i === IMAX;
              return o <= 0.001 ? null : (
                <g key={n} opacity={o < 0.999 ? o : undefined}>
                  {big && hi13 > 0.01 ? <rect x={470} y={y - 23} width={960} height={46} rx={8} fill={rgba(C.edit, 0.1 * hi13)} stroke={C.edit} strokeWidth={2.5} opacity={hi13} /> : null}
                  <Txt x={TX.name} y={y} size={28} anchor="end" fill={C.concept}>{n}</Txt>
                  <Txt x={TX.score} y={y} size={28} mono fill={C.concept}>{EX.probs[i].toFixed(2)}</Txt>
                  <Txt x={TX.round - 30} y={y} size={28} mono fill={C.concept}>{EX.true[i].toFixed(0)}</Txt>
                  <rect x={1000} y={y - 12} width={300} height={24} rx={4} fill={C.bg3} />
                  <rect x={1000} y={y - 12} width={300 * ERR13[i]} height={24} rx={4} fill={big ? C.edit : C.chalk2} opacity={0.9} />
                  <Txt x={1320} y={y} size={28} mono anchor="start" fill={big ? C.edit : C.chalk2}>{ERR13[i].toFixed(2)}</Txt>
                </g>
              );
            })}
          </g>
        </Svg>
        <Rich x={TX.score} y={358} ax="center" size={26} color={C.chalk2} text="score $\ch$" o={rows13(0)} />
        <Rich x={TX.round - 30} y={358} ax="center" size={26} color={C.chalk2} text="label $\ccon{c}$" o={rows13(0)} />
        <Rich x={1150} y={358} ax="center" size={26} color={C.chalk2} text="error $|\ch - \ccon{c}|$" o={rows13(0)} />
        <Rich x={1450} y={460 + IMAX * 52 - 30} ay="middle" size={30} text="{e:fix this one first}" o={hi13} />
        <Rich x={960} y={760} ax="center" w={1300} size={32} text="{e:oracle}: the true labels play a perfect expert" o={or13} />
        <Tex x={960} y={850} ax="center" size={44} tex={`|\\,${EX.probs[IMAX].toFixed(2)} - \\ccon{${EX.true[IMAX].toFixed(0)}}\\,| = \\cedit{${ERR13[IMAX].toFixed(2)}}`} o={eq13} />
        <EvTag x={1760} y={910} ax="right" kind="measured" text={`saved model, test image ${EX.index}`} o={im13} />
      </Slide>
      <SlideHead text={bh(P, 13)} o={S[13]} />

      {/* ================= slides 14 and 15: the curve ================= */}
      <Slide o={S1415}>
        <Svg>
          <g opacity={axes14 < 0.999 ? axes14 : undefined}>
            {[0.8, 0.85, 0.9, 0.95, 1].map((v) => (
              <g key={v}>
                <line x1={CX0} y1={cyv(v)} x2={CX1} y2={cyv(v)} stroke={C.line} strokeWidth={1.5} strokeDasharray={v === 0.8 ? undefined : '5 8'} />
                <Txt x={CX0 - 18} y={cyv(v)} size={22} mono anchor="end" fill={ver14 > 0.05 ? C.chalk : C.mute}>{`${(v * 100).toFixed(0)} %`}</Txt>
              </g>
            ))}
            <line x1={CX0} y1={CY0 - 10} x2={CX0} y2={CY1} stroke={ver14 > 0.05 ? C.chalk : C.line2} strokeWidth={2 + 2 * ver14} />
            <line x1={CX0} y1={CY1} x2={CX1} y2={CY1} stroke={hor14 > 0.05 ? C.chalk : C.line} strokeWidth={1.5 + 2.5 * hor14} />
            {[0, 1, 2, 3, 4, 5].map((k) => (
              <Txt key={k} x={cxk(k)} y={CY1 + 32} size={24} mono fill={hor14 > 0.05 ? C.chalk : C.chalk2}>{String(k)}</Txt>
            ))}
            <Txt x={(CX0 + CX1) / 2} y={CY1 + 78} size={26} fill={C.chalk2}>concepts corrected per image (strict CBM)</Txt>
            <Txt x={CX0 - 70} y={CY0 - 40} size={24} anchor="start" fill={C.chalk2}>task accuracy, 512 test images (axis starts at 80 %)</Txt>
          </g>
          <path d={band} fill={rgba(C.edit, 0.16)} stroke="none" opacity={band15} />
          {rmPts.length > 1 ? <polyline points={rmPts.map((q) => q.join(',')).join(' ')} fill="none" stroke={C.edit} strokeWidth={4} strokeDasharray="12 10" strokeLinecap="round" opacity={0.9} /> : null}
          <g opacity={dimOr < 0.999 ? dimOr : undefined}>
            {orPts.length > 1 ? <polyline points={orPts.map((q) => q.join(',')).join(' ')} fill="none" stroke={C.edit} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" /> : null}
            {OR.map((v, k) => (k <= oU + 0.02 && p0 > 0 ? <circle key={k} cx={cxk(k)} cy={cyv(v)} r={8} fill={C.edit} stroke={C.bg} strokeWidth={3} opacity={k === 0 ? p0 : 1} /> : null))}
            <Txt x={cxk(1) + 10} y={cyv(OR[1]) - 40} size={30} mono weight={700} anchor="start" fill={C.edit} o={lab97}>{`${pc(OR[1])} %`}</Txt>
            <Txt x={cxk(5)} y={cyv(OR[5]) - 36} size={28} mono weight={700} fill={C.edit} o={lab100}>{`${pc(OR[5]).replace('.0', '')} %`}</Txt>
          </g>
          {rndP > 1 ? <circle cx={cxk(1)} cy={cyv(RM[1])} r={7} fill={C.bg} stroke={C.edit} strokeWidth={3} /> : null}
          <Txt x={cxk(0) + 18} y={cyv(OR[0]) + 34} size={28} mono weight={700} anchor="start" fill={C.chalk} o={p0}>{`${pc(OR[0])} %`}</Txt>
          <Txt x={cxk(1) + 20} y={cyv(RM[1]) + 46} size={30} mono weight={700} anchor="start" fill={C.edit} o={lab87}>{`${pc(RM[1])} %`}</Txt>
          {/* legend */}
          <g opacity={leg14 < 0.999 ? leg14 : undefined}>
            <line x1={1290} y1={400} x2={1370} y2={400} stroke={C.edit} strokeWidth={5} strokeLinecap="round" />
            <Txt x={1390} y={386} size={28} anchor="start" fill={C.chalk}>oracle order</Txt>
            <Txt x={1390} y={420} size={24} anchor="start" fill={C.chalk2}>largest concept error first</Txt>
          </g>
          <g opacity={legR < 0.999 ? legR : undefined}>
            <line x1={1290} y1={510} x2={1370} y2={510} stroke={C.edit} strokeWidth={4} strokeDasharray="12 10" strokeLinecap="round" />
            <Txt x={1390} y={496} size={28} anchor="start" fill={C.chalk}>random order</Txt>
            <Txt x={1390} y={530} size={24} anchor="start" fill={C.chalk2}>mean over 32 random orders</Txt>
          </g>
          <g opacity={band15 < 0.999 ? band15 : undefined}>
            <rect x={1290} y={600} width={80} height={36} rx={4} fill={rgba(C.edit, 0.2)} />
            <Txt x={1390} y={606} size={28} anchor="start" fill={C.chalk}>lowest to highest</Txt>
            <Txt x={1390} y={640} size={24} anchor="start" fill={C.chalk2}>of the 32 runs</Txt>
          </g>
        </Svg>
        <Rich x={1290} y={720} w={470} size={26} color={C.chalk2} text="a random pick often fixes a {c:concept} that was already right" o={why15} />
        <EvTag x={1760} y={890} ax="right" kind="measured" text={TAGTXT} o={axes14} />
      </Slide>
      <SlideHead text={bh(P, 14)} o={S[14]} />
      <SlideHead text={bh(P, 15)} o={S[15]} />

      {/* ================= slide 16: the multi-task edit ================= */}
      <Slide o={S[16]}>
        <PhotoR R={{ x: 170, y: 540, w: 120, h: 120 }} src={EX.image} pixel radius={6} />
        <Svg>
          <Flow pts={[[300, 600], [400, 600]]} color={C.input} sw={3.5} head={12} t={t} live={live16m} n={2} />
          <Block x={480} y={600} w={150} h={100} kind="input" title="CNN" size={28} />
          <Flow pts={[[555, 570], [620, 470], [690, 470]]} color={C.input} sw={3.5} head={12} t={t} live={live16m} n={2} />
          <Flow pts={[[555, 630], [620, 730], [690, 730]]} color={C.input} sw={3.5} head={12} t={t + 0.6} live={live16m} n={2} />
          <Block x={810} y={470} w={220} h={92} kind="concept" title="concept head" size={28} hi={edit16 * (0.5 + 0.5 * Math.sin(t * 4))} color={edit16 > 0.5 ? C.edit : undefined} />
          <Flow pts={[[920, 470], [990, 470]]} color={C.concept} sw={3.5} head={12} t={t} live={live16m} n={1} />
          <Ticks x={1040} y={470} vals={[0.9, 0.1, 0.8, 0.2, 0.7].map((v, i) => lerp(v, [0.2, 0.7, 0.3, 0.9, 0.1][i], E.io(editP16)))}
            ghost={editP16 > 0.01 ? [0.9, 0.1, 0.8, 0.2, 0.7] : undefined} color={editP16 > 0.01 ? C.edit : C.concept} w={70} dy={20} />
          <MathSvg x={1100} y={470} tex={'\\hat{c}'} size={32} color={C.concept} anchor="start" />
          <Block x={810} y={730} w={220} h={92} kind="head" title="class head" size={28} />
          <Flow pts={[[920, 730], [990, 730]]} color={C.chalk2} sw={3.5} head={12} t={t} live={live16m} n={1} />
          <Txt x={1080} y={730} size={30} weight={600} fill={C.chalk}>class scores</Txt>
          <Person x={810} y={344} s={0.85 * E.back(edit16)} o={edit16} />
          <Flow pts={[[848, 356], [848, 418]]} color={C.edit} sw={4} head={14} p={E.io(inv(0, 0.6, edit16))} />
          <Tick x={1222} y={730} o={same16} s={E.back(same16)} />
        </Svg>
        <Rich x={880} y={344} ay="middle" size={28} text="{e:edit the concept head}" o={edit16} />
        <HText x={1252} y={730} ay="middle" size={30} weight={600} color={C.good} o={same16}>unchanged (verified exactly)</HText>
        <Rich x={1252} y={790} size={26} color={C.chalk2} text="the {f:class head} never reads the {c:concepts}" o={never16t} />
        <EvTag x={1760} y={890} ax="right" kind="measured" text={TAGTXT} o={at(b(16))} />
      </Slide>
      <SlideHead text={bh(P, 16)} o={S[16]} />

      {/* ================= slide 17: caveats ================= */}
      <Slide o={S[17]}>
        <Svg>
          {CAV.map((s, i) => (
            <g key={i} opacity={cav17[i] < 0.999 ? cav17[i] : undefined}>
              <circle cx={420} cy={360 + i * 88} r={22} fill="none" stroke={C.chalk2} strokeWidth={2.5} />
              <Txt x={420} y={360 + i * 88} size={24} mono weight={700} fill={C.chalk2}>{String(i + 1)}</Txt>
              <Txt x={466} y={360 + i * 88} size={34} anchor="start" fill={C.chalk}>{s}</Txt>
            </g>
          ))}
          <g opacity={real17 < 0.999 ? real17 : undefined}>
            <line x1={400} y1={700} x2={1520} y2={700} stroke={C.line} strokeWidth={2} />
            <Person x={440} y={790} s={1.05} />
            <g transform={`translate(478 ${750 + wob(t, 0.8, 2)})`}>
              <circle r={18} fill={C.bad} />
              <Txt x={0} y={1} size={24} weight={800} fill="#0B0F14">?</Txt>
            </g>
          </g>
        </Svg>
        <Rich x={520} y={782} ay="middle" size={34} text="real experts make mistakes, and their time is costly" o={real17} />
      </Slide>
      <SlideHead text={bh(P, 17)} o={S[17]} />

      {/* ================= slide 18: the lesson ================= */}
      <Slide o={S[18]}>
        <Svg>
          {L18.map((r, i) => {
            const y = 370 + i * 135, h = hi18(i);
            return (
              <g key={i} opacity={row18(i) < 0.999 ? row18(i) : undefined}>
                <rect x={160} y={y - 52} width={1600} height={112} rx={14} fill={rgba(r.col, 0.03 + 0.07 * h)} stroke={h > 0.01 ? r.col : C.line} strokeWidth={2 + 1.5 * h}
                  strokeOpacity={0.45 + 0.55 * h} />
              </g>
            );
          })}
        </Svg>
        {L18.map((r, i) => {
          const y = 370 + i * 135;
          return (
            <React.Fragment key={i}>
              <HText x={196} y={y + 4} ay="middle" size={32} weight={700} color={r.col} o={row18(i)}>{r.name}</HText>
              <HText x={620} y={y - 14} ay="middle" size={30} color={C.chalk} o={row18(i)}>{r.main}</HText>
              <HText x={620} y={y + 30} ay="middle" size={24} color={C.mute} o={row18(i)}>{r.sub}</HText>
            </React.Fragment>
          );
        })}
        <EvTag x={1760} y={905} ax="right" kind="measured" text={TAGTXT} o={row18(0)} />
      </Slide>
      <SlideHead text={bh(P, 18)} o={S[18]} />

      {/* ================= slide 19: why similar accuracy can hide different intervention utility ================= */}
      <Slide o={S[19]}>
        <PhotoR R={{ x: 190, y: PY - 36, w: 72, h: 72 }} src={EX.image} pixel radius={4} o={pan19} />
        <PhotoR R={{ x: 1050, y: PY - 36, w: 72, h: 72 }} src={EX.image} pixel radius={4} o={pan19} />
        <Svg>
          <g opacity={pan19 < 0.999 ? pan19 : undefined}>
            <rect x={160} y={400} width={740} height={400} rx={18} fill={rgba(C.chalk, 0.02)} stroke={mt19 > 0.01 && road19 < 0.5 ? C.chalk2 : C.line} strokeWidth={2} />
            <rect x={1020} y={400} width={740} height={400} rx={18} fill={rgba(C.chalk, 0.02)} stroke={road19 > 0.5 ? C.chalk2 : C.line} strokeWidth={2} />
            {/* multi-task: two heads side by side on the CNN */}
            <Flow pts={[[270, PY], [312, PY]]} color={C.input} head={10} sw={3} t={t} live={live19} n={1} dotR={5} />
            <Block x={360} y={PY} w={90} h={64} kind="input" title="CNN" size={24} />
            <Flow pts={[[405, PY - 14], [440, 520], [470, 520]]} color={C.input} head={10} sw={3} t={t} live={live19} n={1} dotR={5} />
            <Block x={540} y={520} w={130} h={56} kind="concept" title="concepts" size={22} color={editMT > 0.01 ? C.edit : undefined} />
            <Flow pts={[[605, 520], [640, 520]]} color={C.concept} head={10} sw={3} t={t} live={live19} n={1} dotR={5} />
            <Ticks x={680} y={520} vals={mix(editMT)} ghost={editMT > 0.01 ? V0 : undefined} w={46} dy={14} />
            <EditRing x={680} y={520 + 2 * 14} w={46} p={editMT} />
            <MathSvg x={716} y={520} tex={'\\hat{c}'} size={28} color={C.concept} anchor="start" />
            <Flow pts={[[405, PY + 14], [440, 700], [470, 700]]} color={C.input} head={10} sw={3} t={t + 0.5} live={live19} n={1} dotR={5} />
            <Block x={540} y={700} w={130} h={56} kind="head" title="class head" size={22} />
            <Flow pts={[[605, 700], [650, 700]]} color={C.chalk2} head={10} sw={3} t={t} live={live19} n={1} dotR={5} />
            <MathSvg x={680} y={700} tex={'\\hat{y}'} size={34} />
            {/* the road that does not exist: from the concepts to the class head */}
            <g opacity={never19 > 0.001 ? 1 : 0}>
              <line x1={680} y1={560} x2={612} y2={668} stroke={C.line2} strokeWidth={3} strokeDasharray="7 7" />
              <Cross x={630} y={598} w={30} h={30} p={never19} sw={4} />
            </g>
            <Person x={790} y={500} s={0.7 * E.back(clamp(editMT * 2))} o={clamp(editMT * 2)} />
            {/* strict CBM: one road */}
            <Flow pts={[[1130, PY], [1172, PY]]} color={C.input} head={10} sw={3} t={t} live={live19} n={1} dotR={5} />
            <Block x={1220} y={PY} w={90} h={64} kind="input" title="CNN" size={24} />
            <Flow pts={[[1266, PY], [1306, PY]]} color={C.input} head={10} sw={3} t={t} live={live19} n={1} dotR={5} />
            <rect x={1312} y={PY - 56} width={64} height={112} rx={8} fill={rgba(C.concept, 0.1)} stroke={editCB > 0.01 ? C.edit : C.concept} strokeWidth={2 + road19} />
            <Ticks x={1344} y={PY} vals={mix(editCB)} ghost={editCB > 0.01 ? V0 : undefined} w={40} dy={19} />
            <EditRing x={1344} y={PY + 2 * 19} w={40} p={editCB} />
            <MathSvg x={1344} y={PY - 82} tex={'\\hat{c}'} size={28} color={C.concept} />
            <Flow pts={[[1380, PY], [1440, PY]]} color={editCB > 0.5 ? C.edit : C.concept} head={10} sw={3 + road19} t={t} live={live19} n={2} dotR={5} />
            <Block x={1500} y={PY} w={100} h={64} kind="head" title="head" size={22} hi={pulse19} />
            <Flow pts={[[1552, PY], [1600, PY]]} color={C.chalk2} head={10} sw={3 + road19} t={t} live={live19} n={1} dotR={5} />
            <MathSvg x={1632} y={PY} tex={'\\hat{y}'} size={34} />
            <Person x={1344} y={PY + 110} s={0.7 * E.back(clamp(editCB * 2))} o={clamp(editCB * 2)} />
          </g>
        </Svg>
        <HText x={190} y={424} size={30} weight={700} o={pan19}>multi-task</HText>
        <HText x={1050} y={424} size={30} weight={700} o={pan19}>strict CBM</HText>
        <Rich x={870} y={428} ax="right" size={28} color={C.chalk2} text={`accuracy {y:${pc(ACC[1])} %}`} o={acc19} />
        <Rich x={1730} y={428} ax="right" size={28} color={C.chalk2} text={`accuracy {y:${pc(ACC[2])} %}`} o={acc19} />
        <Rich x={960} y={318} ax="center" size={34} text="{y:accuracy} marks only the final answer, not the route to it" o={line19} />
        <Rich x={700} y={606} ay="middle" size={26} color={C.chalk2} text="never read" o={never19 > 0.5 ? 1 : 0} />
        <Rich x={190} y={752} size={28} text="after a {e:fix}: no change" o={noch19} />
        <Rich x={1050} y={752} size={28} text={`after one {e:fix}: ${pc(OR[0])} → {y:${pc(OR[1])} %}`} o={res19} />
        <Rich x={960} y={830} ax="center" size={34} text="a {e:fix} helps only if the {f:head} reads the {c:concepts}" o={take19} />
        <EvTag x={1760} y={900} ax="right" kind="measured" text={TAGTXT} o={pan19} />
      </Slide>
      <SlideHead text={bh(P, 19)} o={S[19]} />

      <Header t={t} part={11} title={P.title} />
      <ArchMap on={['c', 'f', 'y']} o={inv(0, 0.5, t)} />
    </Stage>
  );
};
