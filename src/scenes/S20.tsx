// s20 Part 9 · Leakage in a trained model (revision 2, shortened: 5 slides, one per beat)
// 20.1 does a trained model leak? chart: mean p(large) against the true radius (D.probe), dot area ~ number of images;
//      the binary label (radius >= 14 px) as a teal step and its rule; 0.09, 0.25, 0.63, 0.87 called out; the purple gap
// 20.2 how to probe: soft scores -> linear probe -> position? shade?; R² (8-fold cross-validated) all about 0
// 20.3 remedy, hard concepts: the soft vector thresholded to 0 / 1; our CUB run, hard vs soft (D.cub.acc)
// 20.4 remedies: the head fit on true binary labels (independent training); a side path removed, or reported
// 20.5 measure: probe the scores, test interventions on held-out data
// Slides replace each other: the old one fades out just before a beat, the new one fades in on its first words.
import React from 'react';
import { C } from '../kit/theme';
import { E, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, bs, bw, bh, inv, type SceneProps } from '../kit/core';
import { ArchMap, Block, EvTag, Flow, MathSvg, Person, PhotoR, Pill, VecCol, rgba } from '../kit/cbm';
import { lerp, wob } from '../kit/anim';
import { BText } from '../kit/slots';
import { D } from '../kit/data';

const PR = D.probe;
const RAD: number[] = PR.radius;
const MP: number[] = PR.mean_p_large;
const NR: number[] = PR.n_per_radius;
const CN = ['red', 'blue', 'circle', 'square', 'large']; // display names of D.measured.concepts (is_red ... is_large)
const LARGE_FROM = 14; // the dataset's label rule: large = radius >= 14 px (structural, the training script)
const EX = D.measured.example; // one real test input with its soft scores and true labels
const EXP: number[] = EX.probs, EXT: number[] = EX.true;
const EXH = EXP.map((v) => (v >= 0.5 ? 1 : 0)); // hard concepts: the same scores thresholded at 0.5
const TESTS = ['test_000.png', 'test_001.png', 'test_010.png', 'test_042.png'];
const CUB = D.cub;
const ACC_HARD: number = CUB.acc.hard_sequential, ACC_SOFT: number = CUB.acc.sequential;
const commas = (v: number) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const TAG_SHAPE = 'saved predictions of the shape model, no retraining · one seed';

/** one slide: a full-frame layer with its own opacity */
const Slide: React.FC<{ o: number; children?: React.ReactNode }> = ({ o, children }) =>
  o <= 0.001 ? null : <div style={{ position: 'absolute', inset: 0, opacity: o < 0.999 ? o : undefined }}>{children}</div>;

// ---- the chart (20.3)
const CX0 = 300, CX1 = 1240, CY0 = 330, CY1 = 760;
const R0 = RAD[0] - 0.5, R1 = RAD[RAD.length - 1] + 0.5;
const X = (r: number) => CX0 + ((r - R0) / (R1 - R0)) * (CX1 - CX0);
const Y = (p: number) => CY1 - p * (CY1 - CY0);
const DOTR = (n: number) => 2.1 * Math.sqrt(n); // dot area proportional to n

/** monotone cubic (Fritsch-Carlson) samples through (xs, ys): no overshoot below 0 or above 1 */
function mono(xs: number[], ys: number[], per = 18): [number, number][] {
  const n = xs.length, m: number[] = [], tg: number[] = new Array(n).fill(0);
  for (let i = 0; i < n - 1; i++) m.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  tg[0] = m[0]; tg[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) tg[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (Math.abs(m[i]) < 1e-12) { tg[i] = 0; tg[i + 1] = 0; continue; }
    const a = tg[i] / m[i], b = tg[i + 1] / m[i], s = a * a + b * b;
    if (s > 9) { const k = 3 / Math.sqrt(s); tg[i] = k * a * m[i]; tg[i + 1] = k * b * m[i]; }
  }
  const out: [number, number][] = [];
  for (let i = 0; i < n - 1; i++) {
    const h = xs[i + 1] - xs[i];
    for (let j = 0; j < per; j++) {
      const u = j / per, u2 = u * u, u3 = u2 * u;
      const y = (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * tg[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * tg[i + 1];
      out.push([xs[i] + u * h, y]);
    }
  }
  out.push([xs[n - 1], ys[n - 1]]);
  return out;
}
const CURVE_D = mono(RAD, MP).map(([r, p], i) => `${i ? 'L' : 'M'}${X(r).toFixed(1)} ${Y(p).toFixed(1)}`).join(' ');
const GAP_D = `${CURVE_D} L ${X(RAD[RAD.length - 1])} ${Y(1)} L ${X(LARGE_FROM)} ${Y(1)} L ${X(LARGE_FROM)} ${Y(0)} L ${X(RAD[0])} ${Y(0)} Z`;
const STEP_D = `M ${X(R0)} ${Y(0)} L ${X(LARGE_FROM)} ${Y(0)} L ${X(LARGE_FROM)} ${Y(1)} L ${X(R1)} ${Y(1)}`;
// the four callouts, as spoken: radius 12, 13, 14, 15
const CALL: { r: number; word: string; dx: number; dy: number; anchor: 'start' | 'end' }[] = [
  { r: 12, word: '009', dx: -26, dy: -30, anchor: 'end' },
  { r: 13, word: '025', dx: -30, dy: -4, anchor: 'end' },
  { r: 14, word: '063', dx: 30, dy: 26, anchor: 'start' },
  { r: 15, word: '087', dx: 30, dy: 26, anchor: 'start' },
];

// ---- probes (20.4)
const PROBES: [string, number][] = [
  ['position x', PR.r2_cx_from_soft], ['position y', PR.r2_cy_from_soft],
  ['background shade', PR.r2_bg_from_soft], ['object shade', PR.r2_shade_from_soft],
];
const signed = (v: number) => (v < 0 ? `−${Math.abs(v).toFixed(2)}` : v.toFixed(2));
const PB0 = 900, PBW = 560;

/** a small bracketed vector of concept values with names on the left (names) and an optional highlight row */
const NamedVec: React.FC<{ x: number; y: number; vals: number[]; digits: number; o?: number; names?: boolean; hi?: number; cellO?: (i: number) => number; color?: string; rowH?: number }> = ({
  x, y, vals, digits, o = 1, names = false, hi = -1, cellO, color = C.concept, rowH = 62,
}) => {
  if (o <= 0.001) return null;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      {hi >= 0 ? <rect x={x - 8} y={y + hi * rowH + 4} width={136} height={rowH - 8} rx={8} fill={rgba(C.concept, 0.2)} stroke={C.concept} strokeWidth={2} /> : null}
      <VecCol x={x} y={y} vals={vals} rowH={rowH} w={120} size={30} digits={digits} color={color} cellO={cellO} />
      {names ? CN.map((n, i) => (
        <Txt key={n} x={x - 24} y={y + (i + 0.5) * rowH} size={26} anchor="end" weight={i === hi ? 700 : 500} fill={i === hi ? C.concept : C.chalk2}>{n}</Txt>
      )) : null}
    </g>
  );
};

export const S20: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.4) => inv(x, x + d, t);
  const NB = P.beats.length;
  const sl = (k: number) => inv(b(k) - 0.05, b(k) + 0.25, t) * (k < NB ? 1 - inv(b(k + 1) - 0.35, b(k + 1) - 0.05, t) : 1);

  // ---------------- 20.1 the graded score
  const axes = E.io(inv(b(1) - 0.05, b(1) + 0.8, t));
  const cap1 = at(w(1, 'Part') - 0.2);
  const step = E.io(inv(w(1, 'labelled') - 0.1, w(1, 'labelled') + 0.8, t));
  const rule = at(w(1, '14') - 0.1);
  const tDots = w(1, 'rises');
  const dotO = (i: number) => E.back(inv(tDots + i * 0.11, tDots + i * 0.11 + 0.35, t));
  const curve = E.io(inv(w(1, 'smoothly') - 0.1, w(1, 'radius', 1) + 0.4, t));
  const callO = CALL.map((c) => at(w(1, c.word) - 0.15, 0.35));
  const callNow = CALL.map((c, k) => (t >= w(1, c.word) - 0.15 && (k === CALL.length - 1 || t < w(1, CALL[k + 1].word) - 0.15) ? 1 : 0));
  const gap = at(w(1, 'graded') - 0.2, 0.8);
  const gapLab = at(w(1, 'graded'), 0.5);

  // ---------------- 20.2 probes
  const p2s = at(b(2) - 0.05, 0.3), p2p = at(w(2, 'probe') - 0.1), p2q = at(w(2, 'position') - 0.1);
  const p2row = (i: number) => at(w(2, 'recovers') - 0.1 + i * 0.15);
  const p2bar = E.out(inv(w(2, 'essentially'), w(2, 'essentially') + 0.8, t));
  const p2val = at(w(2, 'nothing') - 0.2);
  const p2look = at(w(2, 'look') - 0.1, 0.5), p2live = at(w(2, 'beyond'), 0.5);

  // ---------------- 20.3 hard concepts and CUB
  const r3s = at(b(3) - 0.05, 0.3), r3t = E.io(inv(w(3, 'pass'), w(3, 'pass') + 0.8, t)), r3h = at(w(3, 'head') - 0.1);
  const r3n = at(w(3, 'nothing') - 0.1);
  const c3h = at(w(3, 'CUB') - 0.1);
  const c3a = E.out(inv(w(3, 'hard', 1) - 0.1, w(3, '53') + 0.3, t)), c3b = E.out(inv(w(3, 'soft') - 0.1, w(3, '69') + 0.3, t));

  // ---------------- 20.4 independent training, side paths
  const i4v = at(w(4, 'true') - 0.3), i4h = at(w(4, 'head') - 0.1), i4live = at(w(4, 'binary'), 0.5), i4n = at(w(4, 'never') - 0.1);
  const s4p = at(w(4, 'Side') - 0.2, 0.3);
  const s4side = E.io(inv(w(4, 'Side') - 0.1, w(4, 'Side') + 0.7, t));
  const s4rm = at(w(4, 'removed') - 0.1, 0.5), s4rep = at(w(4, 'reported') - 0.1, 0.5);

  // ---------------- 20.5 measure
  const m5a = at(w(5, 'probe') - 0.2, 0.5), m5b = at(w(5, 'test') - 0.2, 0.5), m5h = at(w(5, 'held') - 0.2);
  const m5c = at(w(5, 'measure') - 0.1, 0.6);

  // legend rows, 20.1
  const LG = 1340;
  return (
    <Stage>
      <Header t={t} part={9} title={P.title} />
      <ArchMap on={['c', 'f']} o={inv(0, 0.5, t)} />

      {/* ============================================================ 20.1 the score for large rises with the radius */}
      <Slide o={sl(1)}>
        <SlideHead text={bh(P, 1)} />
        <Svg>
          <line x1={CX0 - 16} y1={CY1 + 22} x2={lerp(CX0 - 16, CX1 + 10, axes)} y2={CY1 + 22} stroke={C.line2} strokeWidth={3} />
          <line x1={CX0 - 16} y1={CY1 + 22} x2={CX0 - 16} y2={lerp(CY1 + 22, CY0 - 10, axes)} stroke={C.line2} strokeWidth={3} />
          {RAD.map((r, i) => {
            const k = CALL.findIndex((c) => c.r === r);
            const hot = k >= 0 ? callO[k] : 0;
            return (
              <g key={r} opacity={inv(0.3 + i * 0.04, 0.6 + i * 0.04, axes)}>
                <line x1={X(r)} y1={CY1 + 22} x2={X(r)} y2={CY1 + 31} stroke={C.line2} strokeWidth={2.5} />
                <Txt x={X(r)} y={CY1 + 52} size={22} mono weight={hot > 0.5 ? 700 : 500} fill={hot > 0.5 ? C.chalk : C.mute}>{String(r)}</Txt>
              </g>
            );
          })}
          {[0, 0.5, 1].map((v) => (
            <g key={v} opacity={axes}>
              <line x1={CX0 - 26} y1={Y(v)} x2={CX0 - 16} y2={Y(v)} stroke={C.line2} strokeWidth={2.5} />
              <line x1={CX0 - 16} y1={Y(v)} x2={CX1 + 10} y2={Y(v)} stroke={C.line} strokeWidth={1.5} strokeDasharray="2 8" />
              <Txt x={CX0 - 36} y={Y(v)} size={22} mono anchor="end" fill={C.mute}>{v.toFixed(1)}</Txt>
            </g>
          ))}
          <Txt x={(CX0 + CX1) / 2} y={CY1 + 92} size={26} fill={C.chalk2} o={axes}>true radius (pixels)</Txt>
          <line x1={X(LARGE_FROM)} y1={CY1 + 22} x2={X(LARGE_FROM)} y2={CY0 - 6} stroke={C.chalk2} strokeWidth={2} strokeDasharray="6 8" opacity={step} />
          <path d={GAP_D} fill={rgba(C.leak, 0.32)} fillRule="evenodd" stroke="none" opacity={gap} />
          <path d={STEP_D} fill="none" stroke={C.concept} strokeWidth={5} strokeLinejoin="round" pathLength={1} strokeDasharray={step < 0.999 ? `${step} 1` : undefined} opacity={step > 0.001 ? 1 : 0} />
          <path d={CURVE_D} fill="none" stroke={C.chalk} strokeWidth={4} strokeLinejoin="round" strokeLinecap="round" pathLength={1}
            strokeDasharray={curve < 0.999 ? `${curve} 1` : undefined} opacity={curve > 0.001 ? 1 : 0} />
          {RAD.map((r, i) => {
            const s = dotO(i);
            return s > 0.001 ? <circle key={r} cx={X(r)} cy={Y(MP[i])} r={DOTR(NR[i]) * s} fill={C.chalk} fillOpacity={0.85} stroke={C.bg} strokeWidth={2.5} /> : null;
          })}
          {CALL.map((c, k) => {
            const i = RAD.indexOf(c.r);
            const o = callO[k];
            if (o <= 0.001) return null;
            const x = X(c.r), y = Y(MP[i]);
            return (
              <g key={c.r}>
                <circle cx={x} cy={y} r={DOTR(NR[i]) + 9} fill="none" stroke={C.chalk} strokeWidth={2.5} opacity={o * (callNow[k] ? 1 : 0.45)} />
                <BText x={x + c.dx} y={y + c.dy} anchor={c.anchor} text={MP[i].toFixed(2)} size={30} mono weight={700} o={o} />
              </g>
            );
          })}
          {/* legend, right */}
          <g opacity={step}>
            <line x1={LG} y1={420} x2={LG + 60} y2={420} stroke={C.concept} strokeWidth={5} />
            <Txt x={LG + 78} y={420} size={26} anchor="start" fill={C.chalk2}>binary label</Txt>
          </g>
          <g opacity={curve}>
            <line x1={LG} y1={480} x2={LG + 60} y2={480} stroke={C.chalk} strokeWidth={4} />
            <circle cx={LG + 30} cy={480} r={10} fill={C.chalk} />
            <Txt x={LG + 78} y={480} size={26} anchor="start" fill={C.chalk2}>mean p(large), test images</Txt>
            <Txt x={LG + 78} y={516} size={22} anchor="start" fill={C.mute}>{`dot area: ${Math.min(...NR)} to ${Math.max(...NR)} images`}</Txt>
          </g>
          <g opacity={gapLab}>
            <rect x={LG} y={570} width={60} height={34} rx={4} fill={rgba(C.leak, 0.32)} />
            <Txt x={LG + 78} y={587} size={28} anchor="start" weight={600} fill={C.leak}>a graded size,</Txt>
            <Txt x={LG + 78} y={625} size={28} anchor="start" weight={600} fill={C.leak}>not just large or not</Txt>
          </g>
        </Svg>
        <Rich x={LG} y={330} size={26} color={C.chalk2} text="a small model trained on synthetic shapes (more in Part 11)" o={cap1} />
        <Tex x={LG} y={730} size={44} tex={`\\ccon{c}_{\\text{large}} = 1 \\iff r \\ge ${LARGE_FROM}\\,\\text{px}`} o={rule} />
        <EvTag x={1760} y={890} ax="right" kind="measured" text={TAG_SHAPE} o={axes} />
      </Slide>

      {/* ============================================================ 20.2 position and shade: probe the scores */}
      <Slide o={sl(2)}>
        <SlideHead text={bh(P, 2)} />
        <Svg>
          <Block x={560} y={350} w={260} h={84} kind="concept" title="soft scores" size={28} o={p2s} />
          <Flow pts={[[694, 350], [776, 350]]} color={C.concept} p={p2p} sw={3.5} head={14} t={t} live={p2live} n={1} dotR={5} />
          <Block x={900} y={350} w={230} h={84} kind="head" title="linear probe" size={28} o={p2p} />
          <Flow pts={[[1019, 350], [1110, 350]]} color={C.chalk2} p={p2q} sw={3.5} head={14} t={t} live={p2live} n={1} dotR={5} />
          {PROBES.map(([l, v], i) => {
            const y = 480 + i * 64, o = p2row(i);
            return (
              <g key={l} opacity={o < 0.999 ? o : undefined}>
                <Txt x={PB0 - 40} y={y} size={28} anchor="end" fill={C.chalk}>{l}</Txt>
                <rect x={PB0} y={y - 16} width={PBW} height={32} rx={5} fill={C.bg3} />
                <rect x={PB0} y={y - 16} width={Math.max(0, PBW * v * p2bar)} height={32} rx={3} fill={C.leak} />
                <line x1={PB0} y1={y - 22} x2={PB0} y2={y + 22} stroke={C.chalk2} strokeWidth={2.5} />
                <Txt x={PB0 + PBW + 24} y={y} size={28} anchor="start" mono weight={600} fill={C.chalk} o={p2val}>{signed(v)}</Txt>
              </g>
            );
          })}
          <g opacity={p2row(3)}>
            <line x1={PB0} y1={710} x2={PB0 + PBW} y2={710} stroke={C.line2} strokeWidth={2.5} />
            {[0, 0.5, 1].map((v) => (
              <g key={v}>
                <line x1={PB0 + PBW * v} y1={710} x2={PB0 + PBW * v} y2={720} stroke={C.line2} strokeWidth={2.5} />
                <Txt x={PB0 + PBW * v} y={740} size={22} mono fill={C.mute}>{v.toFixed(1)}</Txt>
              </g>
            ))}
            <Txt x={PB0 + PBW / 2} y={774} size={22} fill={C.chalk2}>R², linear probe, 8-fold cross-validated</Txt>
          </g>
        </Svg>
        <Rich x={1130} y={350} ay="middle" size={30} text="position? shade?" o={p2q} />
        <Rich x={960} y={826} ax="center" size={30} text="to look for leakage: what do the {c:scores} predict beyond their labels?" o={p2look} />
        <EvTag x={1760} y={890} ax="right" kind="measured" text={TAG_SHAPE} o={p2s} />
      </Slide>

      {/* ============================================================ 20.3 hard concepts, and their cost on CUB */}
      <Slide o={sl(3)}>
        <SlideHead text={bh(P, 3)} />
        <Svg>
          <NamedVec x={330} y={350} vals={EXP} digits={2} o={r3s} names rowH={56} />
          <Flow pts={[[468, 490], [574, 490]]} color={C.concept} p={r3t} sw={3.5} head={14} />
          <NamedVec x={600} y={350} vals={EXH} digits={0} o={inv(0.5, 1, r3t)} rowH={56} />
          <Flow pts={[[738, 490], [806, 490]]} color={C.concept} p={r3h} sw={3.5} head={14} t={t} live={r3n} n={1} dotR={5} />
          <Block x={890} y={490} w={150} h={96} kind="head" title="head" o={r3h} size={28} />
          <line x1={1010} y1={330} x2={1010} y2={760} stroke={C.line} strokeWidth={2} opacity={c3h} />
          {[
            { lab: 'head on hard concepts', v: ACC_HARD, p: c3a, a: 0.45 },
            { lab: 'head on soft scores', v: ACC_SOFT, p: c3b, a: 0.9 },
          ].map((r, i) => {
            const y = 520 + i * 150;
            return (
              <g key={i} opacity={r.p > 0.001 ? Math.min(1, r.p * 3) : 0}>
                <Txt x={1080} y={y - 42} size={28} anchor="start" fill={C.chalk}>{r.lab}</Txt>
                <rect x={1080} y={y - 20} width={480} height={40} rx={8} fill={C.bg3} />
                <rect x={1080} y={y - 20} width={480 * r.v * r.p} height={40} rx={8} fill={rgba(C.concept, r.a)} />
                <Txt x={1584} y={y + 1} size={36} anchor="start" mono weight={700} o={inv(0.6, 1, r.p)}>{`${(r.v * 100).toFixed(1)} %`}</Txt>
              </g>
            );
          })}
        </Svg>
        <Rich x={390} y={650} ax="center" size={26} color={C.chalk2} text="soft {c:scores}" o={r3s} />
        <Rich x={660} y={650} ax="center" size={26} color={C.chalk2} text="≥ 0.5 → 1" o={inv(0.5, 1, r3t)} />
        <Rich x={1080} y={370} size={28} color={C.chalk2} text={`test accuracy, ${commas(CUB.n_test)} CUB photographs`} o={c3h} />
        <EvTag x={160} y={720} kind="measured" text="one test image, shape model" o={r3s} />
        <EvTag x={1760} y={890} ax="right" kind="measured" text="our run: frozen CLIP ViT-B/32 + linear models, CUB official split, one run" o={c3h} />
      </Slide>

      {/* ============================================================ 20.4 fit the head on true concepts; side paths */}
      <Slide o={sl(4)}>
        <SlideHead text={bh(P, 4)} />
        <Svg>
          <NamedVec x={360} y={340} vals={EXT} digits={0} o={i4v} names rowH={56} />
          <Flow pts={[[498, 480], [610, 480]]} color={C.concept} p={i4h} sw={3.5} head={14} t={t} live={i4live} n={2} />
          <Block x={710} y={480} w={180} h={100} kind="head" title="task head" o={i4h} size={28} />
          <line x1={940} y1={330} x2={940} y2={760} stroke={C.line} strokeWidth={2} opacity={s4p} />
          <g opacity={s4p < 0.999 ? s4p : undefined}>
            <Block x={1080} y={480} w={150} h={90} kind="input" title="encoder" size={26} />
            <Flow pts={[[1157, 480], [1248, 480]]} color={C.input} sw={3.5} head={12} t={t} live={1} n={1} dotR={5} />
            <Block x={1340} y={480} w={170} h={90} kind="concept" title="concepts" size={26} />
            <Flow pts={[[1427, 480], [1532, 480]]} color={C.concept} sw={3.5} head={12} t={t} live={1} n={1} dotR={5} />
            <Block x={1620} y={480} w={160} h={90} kind="head" title="task head" size={26} />
          </g>
          <Flow pts={[[1080, 527], [1080, 640], [1620, 640], [1620, 527]]} color={C.leak} p={s4side} o={1 - 0.8 * s4rm * (1 - s4rep)} t={t} live={1 - s4rm * (1 - s4rep)}
            sw={4} dash="3 10" head={16} n={3} dotR={6} />
        </Svg>
        <Rich x={540} y={680} ax="center" size={28} text="{f:head} fit on true {c:labels}" o={i4h} />
        <Rich x={540} y={724} ax="center" size={26} color={C.chalk2} text="never learns hidden detail" o={i4n} />
        <Rich x={1350} y={680} ax="center" size={28} text="{k:side path}" o={s4side * (1 - s4rm)} />
        <Rich x={1350} y={680} ax="center" size={28} color={C.chalk2} text="removed" o={s4rm * (1 - s4rep)} />
        <Rich x={1350} y={680} ax="center" size={28} text="{k:or kept, and reported clearly}" o={s4rep} />
      </Slide>

      {/* ============================================================ 20.5 measure */}
      <Slide o={sl(5)}>
        <SlideHead text={bh(P, 5)} />
        <Svg>
          <g opacity={m5a < 0.999 ? m5a : undefined}>
            <rect x={240} y={340} width={640} height={400} rx={18} fill={C.bg2} stroke={C.line} strokeWidth={2} />
            {[0, 1, 2, 3, 4].map((k) => (
              <rect key={k} x={420 + k * 52} y={460} width={40} height={64} rx={6} fill={rgba(C.concept, 0.35 + 0.15 * Math.sin(t * 2 + k))} stroke={C.concept} strokeWidth={2} />
            ))}
            <circle cx={560} cy={492} r={70} fill="none" stroke={C.chalk} strokeWidth={5} />
            <line x1={610} y1={542} x2={660} y2={592} stroke={C.chalk} strokeWidth={9} strokeLinecap="round" />
          </g>
          <g opacity={m5b < 0.999 ? m5b : undefined}>
            <rect x={1040} y={340} width={640} height={400} rx={18} fill={C.bg2} stroke={C.line} strokeWidth={2} />
            <Person x={1220} y={500} s={1.4 + 0.05 * wob(t, 0.6)} />
            <Flow pts={[[1290, 500], [1420, 500]]} color={C.edit} sw={3.5} head={14} t={t} live={m5b} n={1} dotR={5} />
            <Block x={1520} y={500} w={160} h={90} kind="head" title="head" size={28} />
          </g>
        </Svg>
        <Rich x={560} y={640} ax="center" size={30} text="probe the {c:scores}" o={m5a} />
        <Rich x={1360} y={640} ax="center" size={30} text="do {e:interventions} help?" o={m5b} />
        <Rich x={1360} y={690} ax="center" size={26} color={C.chalk2} text="on held-out data" o={m5h} />
        <Rich x={960} y={830} ax="center" size={24} color={C.mute} text="Havasi et al. 2022, Addressing leakage in concept bottleneck models" o={m5c} />
      </Slide>
    </Stage>
  );
};
