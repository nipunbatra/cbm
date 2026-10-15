// s13 Part 13 · An interpretable interface is not the end of the story (revision 2: one idea per slide, 9 beats).
// 13.1 the path x -> g -> c hat -> f -> y hat, large, with five numbered places where it can fail.
// 13.2 to 13.6 one failure per slide, each with a small path glyph on top (its stage ringed) and one example from earlier:
//   13.2 distribution shift: p_new(x) differs from p_train(x); 13.3 the same slide: the chest X-ray model's AUC at a new
//        hospital (Zech, D.lit.zech, Part 1), with AUC defined in words
//   13.4 wrong grounding: the wingtip score fed by the water instead of the wingtip (gull regions, Part 3)
//   13.5 missing information: blue circle and blue square share one concept vector (D.incomplete, Part 8)
//   13.6 wrong head: the billing head's wrong sign, a correct edit lowers billing (D.faulty, Part 7)
//   13.7 wrong or costly intervention: accuracy vs number of oracle corrections (D.measured, Part 11)
// Each failure slide carries one 'in practice' line: what the failure looks like when it happens.
// 13.8 a calm checklist of five questions. 13.9 the survey card (Knab et al., TMLR 2026).
// Slides replace each other: the old one fades out just before a beat, the new one fades in on its first words.
import React from 'react';
import { C } from '../kit/theme';
import { E, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, ROLE, bs, bw, bh, clamp, inv, type SceneProps } from '../kit/core';
import { ArchMap, CREDIT, Credit, EvTag, Flow, MathSvg, PhotoR, Person, Region, ConceptRow, VecCol, EditMark, fit, rgba, ux, vy, type Rect } from '../kit/cbm';
import { D } from '../kit/data';

const FC = ROLE.f; // task head colour (light grey)
const OBJ_BLUE = '#3B6FD8'; // the physical colour of the synthetic objects in Part 8 (not a role colour)
const ZE = D.lit.zech;
const FA = D.faulty;
const ME = D.measured;
const INC = D.incomplete;
const pc = (v: number) => (v * 100).toFixed(1);

// ------------------------------------------------------------------ helpers
/** one slide: a full-frame layer with its own opacity */
const Slide: React.FC<{ o: number; children?: React.ReactNode }> = ({ o, children }) =>
  o <= 0.001 ? null : <div style={{ position: 'absolute', inset: 0, opacity: o < 0.999 ? o : undefined }}>{children}</div>;

/** stage colours for the five failure points: encoder, concept detector, vocabulary, head, intervention */
const STAGE_COL = [C.input, C.input, C.concept, FC, C.edit];

/** a numbered marker (circle with a number) in a stage colour */
const Num: React.FC<{ x: number; y: number; n: number; col: string; s?: number; r?: number }> = ({ x, y, n, col, s = 1, r = 22 }) =>
  s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={r} fill={C.bg} stroke={col} strokeWidth={3} />
      <Txt x={0} y={1} size={r * 1.15} weight={700} fill={col}>{String(n)}</Txt>
    </g>
  );

// ------------------------------------------------------------------ 13.1 the large path
const AY = 590;
const XX = 300, GX = 620, CX = 960, FX = 1300, YX = 1620;
const CV = [0.82, 0.18, 0.74, 0.35, 0.6]; // concept bars drawn without numbers (a diagram, not data)

// ------------------------------------------------------------------ 13.2-13.6 the small path glyph
const SY = 340;
const SX = { x: 700, g: 830, c: 960, f: 1090, y: 1215 };
/** the path in miniature; `hi` (0..4) rings the stage this slide is about */
const Strip: React.FC<{ hi: number }> = ({ hi }) => {
  const col = STAGE_COL[hi];
  // the ringed span for each stage
  const span = [
    [SX.x - 44, SX.g + 64], // encoder: input and g
    [SX.g - 62, SX.c + 34], // concept detector: g and its link to c hat
    [SX.c - 34, SX.c + 34], // vocabulary: c hat
    [SX.f - 62, SX.f + 62], // head
    [SX.c - 34, SX.c + 34], // intervention: on c hat, from a person
  ][hi];
  const dimO = (k: number[]) => (k.includes(hi) ? 1 : 0.55);
  return (
    <g>
      <rect x={span[0] - 12} y={SY - 56} width={span[1] - span[0] + 24} height={112} rx={16} fill={rgba(col, 0.1)} stroke={col} strokeWidth={2.5} />
      <g opacity={dimO([0])}>
        <rect x={SX.x - 30} y={SY - 30} width={60} height={60} rx={10} fill={rgba(C.input, 0.14)} stroke={C.input} strokeWidth={2.5} />
        <MathSvg x={SX.x} y={SY} tex="x" size={32} />
      </g>
      <line x1={SX.x + 34} x2={SX.g - 54} y1={SY} y2={SY} stroke={C.input} strokeWidth={3} opacity={dimO([0])} />
      <g opacity={dimO([0, 1])}>
        <rect x={SX.g - 50} y={SY - 32} width={100} height={64} rx={12} fill={rgba(C.input, 0.15)} stroke={C.input} strokeWidth={2.5} />
        <MathSvg x={SX.g} y={SY} tex="g_\theta" size={30} />
      </g>
      <line x1={SX.g + 54} x2={SX.c - 30} y1={SY} y2={SY} stroke={hi === 1 ? C.bad : C.concept} strokeWidth={3} strokeDasharray={hi === 1 ? '6 6' : undefined}
        opacity={dimO([1])} />
      <g opacity={dimO([2, 4])}>
        <rect x={SX.c - 26} y={SY - 44} width={52} height={88} rx={9} fill={rgba(C.concept, 0.08)} stroke={hi === 4 ? C.edit : C.concept} strokeWidth={2.5} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={SX.c - 16} y={SY - 30 + i * 22} width={32 * [0.8, 0.3, 0.6][i]} height={12} rx={3} fill={hi === 4 && i === 1 ? C.edit : C.concept} />
        ))}
        {hi === 2 ? <rect x={SX.c - 16} y={SY + 50} width={32} height={14} rx={3} fill="none" stroke={C.bad} strokeWidth={2} strokeDasharray="4 4" /> : null}
      </g>
      <line x1={SX.c + 30} x2={SX.f - 54} y1={SY} y2={SY} stroke={C.concept} strokeWidth={3} opacity={dimO([3])} />
      <g opacity={dimO([3])}>
        <rect x={SX.f - 50} y={SY - 32} width={100} height={64} rx={12} fill={C.headFill} stroke="#8792A2" strokeWidth={2.5} />
        <MathSvg x={SX.f} y={SY} tex="f_\phi" size={30} />
      </g>
      <line x1={SX.f + 54} x2={SX.y - 30} y1={SY} y2={SY} stroke={C.chalk2} strokeWidth={3} opacity={0.55} />
      <g opacity={0.55}>
        <circle cx={SX.y} cy={SY} r={28} fill={rgba(C.chalk, 0.08)} stroke={C.chalk} strokeWidth={2.5} />
        <MathSvg x={SX.y} y={SY} tex="\hat{y}" size={30} />
      </g>
      {hi === 4 ? <Person x={SX.c + 78} y={SY - 12} s={0.62} /> : null}
      <Num x={span[0] - 12} y={SY - 56} n={hi + 1} col={col} r={20} />
    </g>
  );
};

/** a plain arrow with a filled head, drawn on with p */
const Arr: React.FC<{ x1: number; y1: number; x2: number; y2: number; color?: string; sw?: number; p?: number; o?: number; head?: number; dash?: string }> = ({
  x1, y1, x2, y2, color = C.chalk2, sw = 3.5, p = 1, o = 1, head = 16, dash,
}) => {
  if (o <= 0.001 || p <= 0.001) return null;
  const xe = x1 + (x2 - x1) * p, ye = y1 + (y2 - y1) * p;
  const a = Math.atan2(ye - y1, xe - x1);
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <line x1={x1} y1={y1} x2={xe - Math.cos(a) * head * 0.6} y2={ye - Math.sin(a) * head * 0.6} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={dash} />
      <path d={`M ${xe} ${ye} L ${xe - head * Math.cos(a - 0.42)} ${ye - head * Math.sin(a - 0.42)} L ${xe - head * Math.cos(a + 0.42)} ${ye - head * Math.sin(a + 0.42)} Z`} fill={color} />
    </g>
  );
};

/** the 'in practice' line of a failure slide */
const Practice: React.FC<{ x: number; y: number; text: string; o: number; w?: number; ax?: 'left' | 'center' }> = ({ x, y, text, o, w, ax = 'left' }) =>
  o <= 0.001 ? null : <Rich x={x} y={y + (1 - o) * 8} w={w} ax={ax} size={30} lh={1.35} text={`{m:In practice:} ${text}`} o={o} />;

// ------------------------------------------------------------------ fixed geometry
const XR: Rect = fit('chest.jpg', 220, 590, 300);
const PH3: Rect = { x: 260, y: 420, w: 450, h: 450 };
const WATER = [0.72, 0.17, 0.4, 0.2]; // a patch of water behind the gull (normalized cx, cy, w, h; drawn by hand)
const WING: number[] = D.gull.regions.wingtip;
const CHIP3 = { x: 1180, y: 600, w: 300, h: 64 };
// 13.6 chart
const CH = { x0: 900, x1: 1620, y0: 820, y1: 480, a0: 0.75, a1: 1.0 };
const chx = (k: number) => CH.x0 + (k / 5) * (CH.x1 - CH.x0);
const chy = (a: number) => CH.y0 - ((a - CH.a0) / (CH.a1 - CH.a0)) * (CH.y0 - CH.y1);
// 13.7 questions: marker colour = the stage each question tests
const QS: { q: string; col: string }[] = [
  { q: 'Are the {c:concepts} meaningful?', col: C.concept },
  { q: 'Are they {x:grounded} correctly?', col: C.input },
  { q: 'Are they {c:sufficient} for the task?', col: C.concept },
  { q: 'Does the {f:model} actually use them?', col: FC },
  { q: 'Do {e:corrections} improve decisions?', col: C.edit },
];
const PARTS: { n: string; col: string; word: string }[] = [
  { n: 'input', col: C.input, word: 'input' },
  { n: 'concepts', col: C.concept, word: 'concepts' },
  { n: 'output', col: C.chalk, word: 'output' },
  { n: 'training', col: C.loss, word: 'training' },
];

export const S13: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.5) => inv(x, x + d, t);
  const NB = P.beats.length;
  /** slide k: fades in on the beat's first words, fades out (0.3 s) just before the next beat */
  const sl = (k: number) => inv(b(k) - 0.05, b(k) + 0.25, t) * (k < NB ? 1 - inv(b(k + 1) - 0.35, b(k + 1) - 0.05, t) : 1);
  /** a slide that spans beats k0 to k1 */
  const sp = (k0: number, k1: number) => inv(b(k0) - 0.05, b(k0) + 0.25, t) * (k1 < NB ? 1 - inv(b(k1 + 1) - 0.35, b(k1 + 1) - 0.05, t) : 1);

  // ---------------- 13.1
  const build = (i: number) => at(b(1) + 0.1 + i * 0.3, 0.45);
  const live = at(b(1) + 1.6, 0.6);
  const pulse = (x: number) => Math.sin(Math.PI * inv(x, x + 0.9, t));
  const hx = pulse(w(1, 'x')), hc = pulse(w(1, 'hat', 0)), hy = pulse(w(1, 'hat', 1));
  const mk = (i: number) => E.back(at(w(1, 'each') + i * 0.28, 0.4));
  const ring = (x: number, y: number, ww: number, hh: number, a: number, col: string) =>
    a > 0.01 ? <rect x={x - ww / 2 - 14} y={y - hh / 2 - 14} width={ww + 28} height={hh + 28} rx={24} fill={rgba(col, 0.12 * a)} stroke={col} strokeWidth={3} opacity={a} /> : null;

  // ---------------- 13.2
  const s2w = at(w(2, 'encoder') - 0.1), s2eq = at(w(2, 'symbols') - 0.1, 0.6);
  const s2x = at(w(2, 'chest') - 0.1), s2auc = at(w(3, 'score') - 0.1);
  const s2b1 = E.out(inv(w(3, 'hospitals') - 0.3, w(3, 'hospitals') + 0.5, t)), s2b2 = E.out(inv(w(3, 'new') - 0.1, w(3, 'new') + 0.8, t));
  const s2h2 = at(b(3) - 0.3, 0.3);

  // ---------------- 13.3
  const s3ph = at(b(4) - 0.05, 0.3), s3chip = at(w(4, 'evidence') - 0.2);
  const s3water = inv(w(4, 'water') - 0.1, w(4, 'water') + 0.6, t), s3wing = inv(w(4, 'wingtip') - 0.1, w(4, 'wingtip') + 0.6, t);

  // ---------------- 13.4
  const s4a = E.back(at(w(5, 'blue', 0) - 0.1, 0.45)), s4b = E.back(at(w(5, 'blue', 1) - 0.1, 0.45));
  const s4v = at(w(5, 'shared') - 0.1, 0.5), s4eq = at(w(5, 'vector') - 0.1, 0.6), s4acc = at(w(5, 'guess') - 0.2, 0.6);
  const s4cls = at(w(5, 'blue', 1) + 0.4);

  // ---------------- 13.5
  const s5eq = at(w(6, 'takes') - 0.2, 0.6), s5rows = at(w(6, 'billing') - 0.2, 0.5);
  const s5edit = inv(w(6, 'sets') - 0.1, w(6, 'sets') + 0.8, t), s5hi = pulse(w(6, 'falls') - 0.2);
  const s5out = inv(w(6, 'falls'), w(6, 'falls') + 1.4, t), s5txt = at(w(6, 'falls') - 0.1);

  // ---------------- 13.6
  const s6p = E.back(at(w(7, 'intervention') - 0.1, 0.5)), s6edit = inv(w(7, 'wrong') - 0.1, w(7, 'wrong') + 0.7, t);
  const s6ax = at(w(7, 'chart') - 0.1), s6line = inv(w(7, 'step'), w(7, 'time') + 0.6, t), s6true = at(w(7, 'true') - 0.1);

  // ---------------- 13.7
  const qT = [w(8, 'Are', 0), w(8, 'Are', 1), w(8, 'Are', 2), w(8, 'Does'), w(8, 'And')];
  const qIn = (i: number) => at(qT[i] - 0.15, 0.45);
  const s7box = at(b(8) + 0.1, 0.5);

  // ---------------- 13.8
  const s8c = at(b(9) - 0.05, 0.4);
  const s8p = PARTS.map((p) => E.back(at(w(9, p.word) - 0.1, 0.4)));
  const s8o = at(w(9, 'open') - 0.2);

  /** the 'in practice' line of slide k appears with the word 'practice' */
  const pr = (k: number) => at(w(k, 'practice') - 0.15, 0.4);

  // derived numbers
  const fb0 = FA.before.share[1], fb1 = FA.after.share[1];
  const billing = fb0 + (fb1 - fb0) * E.io(s5out);
  const ORA: number[] = ME.oracle, RND: number[] = ME.random_mean;
  /** the polyline through (k, a[k]) drawn on up to progress p (0..1 over the five steps) */
  const path = (a: number[], p: number) => {
    const q = clamp(p) * (a.length - 1), n = Math.floor(q);
    const pts: [number, number][] = a.slice(0, n + 1).map((v, k) => [chx(k), chy(v)]);
    if (n < a.length - 1) pts.push([chx(q), chy(a[n] + (a[n + 1] - a[n]) * (q - n))]);
    return pts.map(([x, y], k) => `${k ? 'L' : 'M'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  };

  return (
    <Stage>
      <Header t={t} part={13} title={P.title} />

      {/* ============================================================ 13.1 the path and its five weak points */}
      <Slide o={sl(1)}>
        <SlideHead text={bh(P, 1)} />
        <Svg>
          {ring(XX, AY, 120, 120, hx, C.input)}
          {ring(CX, AY, 160, 256, hc, C.concept)}
          {ring(YX, AY, 100, 100, hy, C.chalk)}
          <Flow pts={[[XX + 70, AY], [GX - 100, AY]]} color={C.input} sw={4} head={14} o={build(1)} t={t} live={live} n={2} dotR={7} />
          <Flow pts={[[GX + 100, AY], [CX - 92, AY]]} color={C.concept} sw={4} head={14} o={build(2)} t={t + 0.3} live={live} n={3} dotR={7} />
          <Flow pts={[[CX + 92, AY], [FX - 100, AY]]} color={C.concept} sw={4} head={14} o={build(3)} t={t + 0.6} live={live} n={3} dotR={7} />
          <Flow pts={[[FX + 100, AY], [YX - 58, AY]]} color={C.chalk2} sw={4} head={14} o={build(4)} t={t + 0.9} live={live} n={2} dotR={7} />
          <g opacity={build(0)}>
            <rect x={XX - 60} y={AY - 60} width={120} height={120} rx={14} fill={rgba(C.input, 0.14)} stroke={C.input} strokeWidth={3} />
            <MathSvg x={XX} y={AY} tex="x" size={56} />
          </g>
          <g opacity={build(1)}>
            <rect x={GX - 90} y={AY - 65} width={180} height={130} rx={18} fill={rgba(C.input, 0.15)} stroke={C.input} strokeWidth={3} />
            <MathSvg x={GX} y={AY} tex="g_\theta" size={56} />
          </g>
          <g opacity={build(2)}>
            <rect x={CX - 80} y={AY - 128} width={160} height={256} rx={16} fill={rgba(C.concept, 0.08)} stroke={C.concept} strokeWidth={3} />
            {CV.map((v, i) => (
              <g key={i}>
                <rect x={CX - 56} y={AY - 100 + i * 50 - 11} width={112} height={22} rx={5} fill={C.bg3} />
                <rect x={CX - 56} y={AY - 100 + i * 50 - 11} width={112 * v} height={22} rx={5} fill={C.concept} opacity={0.9} />
              </g>
            ))}
          </g>
          <g opacity={build(3)}>
            <rect x={FX - 90} y={AY - 65} width={180} height={130} rx={18} fill={C.headFill} stroke="#8792A2" strokeWidth={3} />
            <MathSvg x={FX} y={AY} tex="f_\phi" size={56} />
          </g>
          <g opacity={build(4)}>
            <circle cx={YX} cy={AY} r={50} fill={rgba(C.chalk, 0.08)} stroke={C.chalk} strokeWidth={3} />
            <MathSvg x={YX} y={AY} tex="\hat{y}" size={52} />
          </g>
          {/* five numbered weak points */}
          <Num x={(XX + GX) / 2 - 10} y={AY - 100} n={1} col={STAGE_COL[0]} s={mk(0)} />
          <Num x={(GX + CX) / 2 + 4} y={AY - 100} n={2} col={STAGE_COL[1]} s={mk(1)} />
          <Num x={CX} y={AY + 180} n={3} col={STAGE_COL[2]} s={mk(2)} />
          <Num x={FX} y={AY - 100} n={4} col={STAGE_COL[3]} s={mk(3)} />
          <Person x={CX + 140} y={AY - 150} s={0.8 * mk(4)} />
          <Num x={CX + 190} y={AY - 176} n={5} col={STAGE_COL[4]} s={mk(4)} />
          <Arr x1={CX + 120} y1={AY - 124} x2={CX + 90} y2={AY - 104} color={C.edit} sw={3} head={12} o={mk(4) > 0.9 ? 1 : 0} />
        </Svg>
        <Rich x={XX} y={AY + 82} ax="center" size={28} text="{x:input}" o={build(0)} />
        <Rich x={GX} y={AY + 82} ax="center" size={28} text="{x:concept predictor}" o={build(1)} />
        <Rich x={CX} y={AY + 214} ax="center" size={28} text="{c:concepts}" o={build(2)} />
        <Rich x={FX} y={AY + 82} ax="center" size={28} text="{f:task head}" o={build(3)} />
        <Rich x={YX} y={AY + 82} ax="center" size={28} text="{y:prediction}" o={build(4)} />
      </Slide>

      {/* ============================================================ 13.2 distribution shift */}
      <Slide o={sp(2, 3)}>
        <SlideHead text={bh(P, 2)} o={1 - s2h2} />
        <SlideHead text={bh(P, 3)} o={s2h2} />
        <Svg>
          <Strip hi={0} />
          <g opacity={s2b1 > 0.001 ? 1 : 0}>
            <Txt x={720} y={630} size={28} anchor="start" fill={C.chalk2} o={s2auc}>pneumonia detection, AUC</Txt>
            {[
              { lab: 'same hospitals', v: ZE.auc_internal, p: s2b1, y: 700 },
              { lab: 'new hospital', v: ZE.auc_external, p: s2b2, y: 776 },
            ].map((r) => (
              <g key={r.lab} opacity={inv(0, 0.3, r.p)}>
                <Txt x={720} y={r.y} size={30} anchor="start">{r.lab}</Txt>
                <rect x={980} y={r.y - 18} width={520} height={36} rx={5} fill={C.bg3} />
                <rect x={980} y={r.y - 18} width={520 * r.v * r.p} height={36} rx={5} fill={C.chalk} opacity={0.85} />
                <Txt x={1520} y={r.y} size={32} anchor="start" mono weight={700} o={inv(0.4, 1, r.p)}>{r.v.toFixed(3)}</Txt>
              </g>
            ))}
          </g>
        </Svg>
        <Rich x={960} y={430} ax="center" size={34} text="new {x:inputs} unlike the {x:training inputs}" o={s2w} />
        <Tex x={960} y={520} ax="center" size={56} tex="p_{\text{new}}(\cin{x}) \neq p_{\text{train}}(\cin{x})" o={s2eq} />
        <PhotoR R={XR} src="chest.jpg" o={s2x} />
        <Credit x={XR.x} y={XR.y + XR.h + 8} text={CREDIT['chest.jpg']} o={s2x} />
        <Rich x={1090} y={630} ay="middle" size={24} color={C.mute} text="(1 = perfect ranking, 0.5 = guessing)" o={s2auc} />
        <Practice x={720} y={836} text="fine where it was built, worse at the new site" o={pr(3)} />
        <EvTag x={1760} y={905} ax="right" kind="reported" text="Zech et al., PLOS Medicine 2018 (Part 1)" o={s2b1} />
      </Slide>

      {/* ============================================================ 13.3 wrong grounding */}
      <Slide o={sl(4)}>
        <SlideHead text={bh(P, 4)} />
        <PhotoR R={PH3} src="gull.jpg" o={s3ph} />
        <Credit x={PH3.x} y={PH3.y + PH3.h + 8} text={CREDIT['gull.jpg']} o={s3ph} />
        <Svg>
          <Strip hi={1} />
          <g opacity={s3chip < 0.999 ? s3chip : undefined}>
            <rect x={CHIP3.x} y={CHIP3.y - CHIP3.h / 2} width={CHIP3.w} height={CHIP3.h} rx={12} fill={rgba(C.concept, 0.14)} stroke={C.concept} strokeWidth={3} />
            <Txt x={CHIP3.x + CHIP3.w / 2} y={CHIP3.y} size={30} weight={600} fill={C.concept}>wingtip black</Txt>
          </g>
          {/* wrong evidence: the water */}
          <Region R={PH3} b={WATER} color={C.bad} draw={E.out(s3water)} sw={4} dash={s3water > 0.99 ? '10 8' : undefined} />
          <Flow pts={[[ux(PH3, WATER[0] + WATER[2] / 2) + 6, vy(PH3, WATER[1])], [CHIP3.x - 60, vy(PH3, WATER[1])], [CHIP3.x - 8, CHIP3.y - 18]]}
            color={C.bad} dash="6 9" sw={3.5} head={14} p={E.io(inv(0.3, 1, s3water))} />
          <Txt x={CHIP3.x - 300} y={vy(PH3, WATER[1]) - 30} size={28} weight={600} anchor="start" fill={C.bad} o={inv(0.6, 1, s3water)}>wrong evidence: water</Txt>
          {/* intended evidence: the wingtip */}
          <Region R={PH3} b={WING} color={C.concept} draw={E.out(s3wing)} sw={4} />
          <Flow pts={[[ux(PH3, WING[0] + WING[2] / 2) + 6, vy(PH3, WING[1])], [CHIP3.x - 60, vy(PH3, WING[1])], [CHIP3.x - 8, CHIP3.y + 18]]}
            color={C.concept} sw={3.5} head={14} p={E.io(inv(0.3, 1, s3wing))} />
          <Txt x={CHIP3.x - 300} y={vy(PH3, WING[1]) + 34} size={28} weight={600} anchor="start" fill={C.concept} o={inv(0.6, 1, s3wing)}>intended evidence: wingtip</Txt>
        </Svg>
        <Practice x={CHIP3.x - 300} y={790} w={880} text="the score is right for the wrong reason, until a gull turns up away from water" o={pr(4)} />
        <EvTag x={1760} y={905} ax="right" kind="schematic" text="regions drawn by hand" o={s3water} />
      </Slide>

      {/* ============================================================ 13.4 missing information */}
      <Slide o={sl(5)}>
        <SlideHead text={bh(P, 5)} />
        <Svg>
          <Strip hi={2} />
          {/* the two objects */}
          {s4a > 0.001 ? <circle cx={460} cy={500} r={62 * s4a} fill={OBJ_BLUE} stroke={C.chalk} strokeWidth={4} /> : null}
          {s4b > 0.001 ? <rect x={800 - 58 * s4b} y={500 - 58 * s4b} width={116 * s4b} height={116 * s4b} rx={6} fill={OBJ_BLUE} stroke={C.chalk} strokeWidth={4} /> : null}
          <Txt x={460} y={598} size={28} fill={C.chalk2} o={s4cls}>{INC.objects[0].y}</Txt>
          <Txt x={800} y={598} size={28} fill={C.chalk2} o={s4cls}>{INC.objects[1].y}</Txt>
          {/* their concept vectors */}
          <g opacity={s4v < 0.999 ? s4v : undefined}>
            {(INC.vocab as string[]).map((n, i) => (
              <Txt key={n} x={330} y={680 + i * 70} size={28} anchor="end" weight={600} fill={C.concept}>{n}</Txt>
            ))}
            <VecCol x={400} y={645} vals={INC.objects[0].c as number[]} rowH={70} w={120} size={36} digits={0} />
            <Txt x={630} y={715} size={52} weight={600} fill={C.chalk}>=</Txt>
            <VecCol x={740} y={645} vals={INC.objects[1].c as number[]} rowH={70} w={120} size={36} digits={0} />
          </g>
        </Svg>
        <Rich x={1060} y={500} size={34} text="the same {c:concept vector}, different {y:classes}" o={s4v} />
        <Tex x={1060} y={620} size={52} tex="\ccon{\mathbf{c}}(\cin{x_1}) = \ccon{\mathbf{c}}(\cin{x_2}), \quad y_1 \neq y_2" o={s4eq} />
        <Rich x={1060} y={710} size={30} color={C.chalk2} text={`shape never reaches the {f:head}: best accuracy {y:${(INC.best_accuracy * 100).toFixed(0)}%}`} o={s4acc} />
        <Practice x={1060} y={790} w={700} text="two cases an expert tells apart look identical to the {f:head}" o={pr(5)} />
        <EvTag x={1760} y={905} ax="right" kind="constructed" text="the blue circle and square of Part 8" o={s4a} />
      </Slide>

      {/* ============================================================ 13.5 wrong head */}
      <Slide o={sl(6)}>
        <SlideHead text={bh(P, 6)} />
        <Svg>
          <Strip hi={3} />
          <g opacity={s5rows < 0.999 ? s5rows : undefined}>
            <ConceptRow x={170} y={620} label={FA.concepts[0]} v={FA.before.c[0]} w={170} labelW={260} size={28} barH={26}
              edit={s5edit > 0.001 ? { to: FA.after.c[0], p: s5edit } : undefined} />
            <ConceptRow x={170} y={700} label={FA.concepts[1]} v={FA.before.c[1]} w={170} labelW={260} size={28} barH={26} />
            <Flow pts={[[720, 620], [800, 660], [880, 660]]} color={s5edit > 0.001 ? C.edit : C.concept} sw={3} head={0} t={t} live={1} n={1} dotR={5} />
            <Flow pts={[[720, 700], [800, 660], [880, 660]]} color={C.concept} sw={3} head={12} t={t + 0.4} live={1} n={1} dotR={5} />
            {s5hi > 0.01 ? <rect x={884} y={590} width={190} height={140} rx={22} fill={rgba(FC, 0.16 * s5hi)} /> : null}
            <rect x={894} y={600} width={170} height={120} rx={16} fill={C.headFill} stroke="#8792A2" strokeWidth={3} />
            <Txt x={979} y={645} size={28} weight={600}>billing</Txt>
            <Txt x={979} y={680} size={28} weight={600}>head</Txt>
            <Flow pts={[[1072, 660], [1180, 660]]} color={C.chalk2} sw={3} head={12} t={t} live={1} n={1} dotR={5} />
            <Txt x={1200} y={610} size={28} anchor="start" fill={C.chalk2}>billing share</Txt>
            <rect x={1200} y={642} width={380} height={36} rx={5} fill={C.bg3} />
            <rect x={1200} y={642} width={380 * billing} height={36} rx={5} fill={C.chalk} opacity={0.9} />
            <line x1={1200 + 190} x2={1200 + 190} y1={632} y2={688} stroke={C.mute} strokeWidth={2} strokeDasharray="4 5" />
            <Txt x={1598} y={660} size={32} anchor="start" mono weight={700}>{billing.toFixed(2)}</Txt>
            <Txt x={1200} y={716} size={26} anchor="start" fill={billing >= 0.5 ? C.chalk : C.bad} weight={600}>
              {billing >= 0.5 ? `routed to ${FA.classes[1].toLowerCase()}` : `routed to ${FA.classes[0].toLowerCase()}`}
            </Txt>
          </g>
        </Svg>
        <Tex x={960} y={470} ax="center" size={50}
          tex={`\\chead{\\text{score}} = ${FA.bias} \\cbad{\\,-\\,${Math.abs(FA.weights[0])}}\\;\\ccon{\\text{duplicate charge}} + ${FA.weights[1]}\\;\\ccon{\\text{refund requested}}`} o={s5eq} />
        <Rich x={960} y={786} ax="center" size={32} text={`a {e:correct edit} meets a wrong {f:rule}: billing falls from ${fb0.toFixed(2)} to ${fb1.toFixed(2)}`} o={s5txt} />
        <Practice x={960} y={844} ax="center" text="the expert's {e:fix} is right, yet the decision moves the wrong way" o={pr(6)} />
        <EvTag x={1760} y={905} ax="right" kind="constructed" text="head built faulty on purpose, Part 7" o={s5rows} />
      </Slide>

      {/* ============================================================ 13.6 wrong or costly intervention */}
      <Slide o={sl(7)}>
        <SlideHead text={bh(P, 7)} />
        <Svg>
          <Strip hi={4} />
          {/* the person and the edit */}
          <Person x={330} y={520} s={1.3 * s6p} />
          <EditMark x={420} y={540} s={1.3} o={s6edit} />
          <ConceptRow x={190} y={640} label="size: large" v={ME.example.probs[4]} w={150} labelW={170} size={28} barH={26} o={s6p}
            edit={s6edit > 0.001 ? { to: ME.example.corrected[4], p: s6edit } : undefined} />
          {/* the measured curve */}
          <g opacity={s6ax < 0.999 ? s6ax : undefined}>
            <line x1={CH.x0} x2={CH.x1} y1={CH.y0} y2={CH.y0} stroke={C.line2} strokeWidth={2.5} />
            <line x1={CH.x0} x2={CH.x0} y1={CH.y0} y2={CH.y1 - 20} stroke={C.line2} strokeWidth={2.5} />
            {[0, 1, 2, 3, 4, 5].map((k) => <Txt key={k} x={chx(k)} y={CH.y0 + 26} size={24} mono fill={C.chalk2}>{String(k)}</Txt>)}
            {[0.8, 0.9, 1.0].map((a) => (
              <g key={a}>
                <line x1={CH.x0 - 8} x2={CH.x1} y1={chy(a)} y2={chy(a)} stroke={C.line} strokeWidth={1.5} />
                <Txt x={CH.x0 - 16} y={chy(a)} size={24} mono anchor="end" fill={C.chalk2}>{`${(a * 100).toFixed(0)}%`}</Txt>
              </g>
            ))}
            <Txt x={(CH.x0 + CH.x1) / 2} y={CH.y0 + 62} size={26} fill={C.chalk2}>corrections per image: expert time</Txt>
          </g>
          {s6line > 0.001 ? (
            <g>
              <path d={path(RND, s6line)} fill="none" stroke={C.edit} strokeWidth={3.5} strokeDasharray="8 8" opacity={0.6} />
              <path d={path(ORA, s6line)} fill="none" stroke={C.edit} strokeWidth={4.5} />
              {ORA.map((v, k) => (k / 5 <= s6line ? <circle key={k} cx={chx(k)} cy={chy(v)} r={7} fill={C.edit} /> : null))}
            </g>
          ) : null}
          <g opacity={inv(0.25, 0.45, s6line)}>
            <Txt x={chx(1) + 18} y={chy(ORA[1]) + 30} size={26} mono weight={700} anchor="start" fill={C.chalk}>{`${pc(ORA[1])}%`}</Txt>
            <Txt x={chx(1) + 18} y={chy(RND[1]) + 26} size={26} mono anchor="start" fill={C.chalk2}>{`${pc(RND[1])}%`}</Txt>
            <Txt x={chx(0) + 18} y={chy(ORA[0]) + 26} size={26} mono anchor="start" fill={C.chalk2}>{`${pc(ORA[0])}%`}</Txt>
          </g>
          <g opacity={inv(0.8, 1, s6line)}>
            <line x1={chx(3) - 20} x2={chx(3) + 20} y1={chy(0.905)} y2={chy(0.905)} stroke={C.edit} strokeWidth={4.5} />
            <Txt x={chx(3) + 32} y={chy(0.905)} size={24} anchor="start" fill={C.chalk2}>largest error first</Txt>
            <line x1={chx(3) - 20} x2={chx(3) + 20} y1={chy(0.865)} y2={chy(0.865)} stroke={C.edit} strokeWidth={3.5} strokeDasharray="8 8" opacity={0.6} />
            <Txt x={chx(3) + 32} y={chy(0.865)} size={24} anchor="start" fill={C.chalk2}>random order</Txt>
          </g>
        </Svg>
        <Rich x={170} y={700} w={600} size={30} lh={1.4} text="Part 11 took corrections from {e:true labels}: an expert who never errs" o={s6true} />
        <Practice x={170} y={806} w={600} text="real experts misjudge too, and every check costs their time" o={pr(7)} />
        <Rich x={CH.x0 + 14} y={CH.y1 - 48} size={26} color={C.chalk2} text="accuracy" o={s6ax} />
        <EvTag x={1760} y={916} ax="right" kind="measured" text="Part 11: one seed, 512 synthetic test images, oracle corrections" o={s6ax} />
      </Slide>

      {/* ============================================================ 13.7 five questions */}
      <Slide o={sl(8)}>
        <SlideHead text={bh(P, 8)} />
        <Svg>
          {QS.map((q, i) => {
            const y = 380 + i * 104, o = qIn(i);
            return o <= 0.001 ? null : (
              <g key={i} opacity={o < 0.999 ? o : undefined}>
                <Num x={580} y={y} n={i + 1} col={q.col} r={24} />
                <rect x={640} y={y - 20} width={40} height={40} rx={8} fill="none" stroke={C.chalk2} strokeWidth={2.5} />
              </g>
            );
          })}
          <line x1={520} x2={1560} y1={318} y2={318} stroke={C.line} strokeWidth={2} opacity={s7box} />
          <line x1={520} x2={1560} y1={898} y2={898} stroke={C.line} strokeWidth={2} opacity={s7box} />
        </Svg>
        {QS.map((q, i) => (
          <Rich key={i} x={710} y={380 + i * 104} ay="middle" size={40} text={q.q} o={qIn(i)} />
        ))}
      </Slide>

      {/* ============================================================ 13.8 the survey */}
      <Slide o={sl(9)}>
        <SlideHead text={bh(P, 9)} />
        <Svg>
          <g opacity={s8c < 0.999 ? s8c : undefined}>
            <rect x={300} y={330} width={1320} height={540} rx={20} fill={C.bg2} stroke={C.line2} strokeWidth={2} />
            <rect x={300} y={330} width={10} height={540} rx={4} fill={C.concept} />
            <Txt x={350} y={380} size={24} mono weight={700} anchor="start" fill={C.mute} track={1.5}>SURVEY · TMLR 2026</Txt>
            <line x1={350} y1={600} x2={1570} y2={600} stroke={C.line} strokeWidth={2} />
          </g>
          {PARTS.map((p, i) => {
            const x = 350 + i * 300, s = s8p[i];
            return s <= 0.001 ? null : (
              <g key={p.n} transform={`translate(${x + 130} 668) scale(${s}) translate(${-(x + 130)} -668)`}>
                <rect x={x} y={636} width={260} height={64} rx={12} fill={rgba(p.col, 0.12)} stroke={p.col} strokeWidth={2.5} />
                <Txt x={x + 130} y={668} size={30} weight={600} fill={C.chalk}>{p.n}</Txt>
              </g>
            );
          })}
        </Svg>
        <Rich x={350} y={410} w={1220} size={42} weight={600} lh={1.25} text="What's in the Bottle? A Survey and Roadmap of Concept Bottleneck Models" o={s8c} />
        <Rich x={350} y={540} size={28} color={C.chalk2} text="P. Knab, D. Steinmann, C. Bartelt, K. Kersting, B. Schiele, T. Seidl, U. Schlegel, W. Stammer" o={s8c} />
        <Rich x={350} y={740} w={1220} size={30} lh={1.4} color={C.chalk2}
          text="open challenges include {x:grounding}, {c:completeness}, {k:leakage} and {e:intervention reliability}" o={s8o} />
      </Slide>

      <ArchMap on={['x', 'g', 'c', 'f', 'y']} o={inv(0, 0.5, t)} />
    </Stage>
  );
};
