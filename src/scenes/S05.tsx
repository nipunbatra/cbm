// s05 Part 5 · How does the model learn the concepts? (revision 2: one idea per slide, 13 slides, one per beat)
// 5.1 motivation: photo -> g -> concept values (given in Part 4) -> "?"   5.2 one training record (x_i, c_i, y_i): symbols
//     first, then the real CUB record of the herring gull (D.cub.herring_gull, 4 of 112 labels named) with our photo
// 5.3 the concept loss: words above each piece of the binary cross-entropy    5.4 one worked term: c = 1, ĉ = 0.8 (a
//     hand-chosen prediction, tagged illustrative) -> −log 0.8 ≈ 0.22 on the curve −log ĉ   5.5 the task loss: −log of the
//     correct class's share, with the Part 4 worksheet's shares (D.zoo.softmax)   5.6 L = λ_c L_c + λ_y L_y, words above
// 5.7 Koh et al.'s three ways to train   5.8 independent   5.9 sequential (frozen predictor)   5.10 joint (both losses)
// 5.11 joint: the task-loss gradient runs back through f and ĉ into g   5.12 a concept score pulled two ways
// 5.13 our measured run: joint, λ_c = 2, λ_y = 1 (D.train).
// Diagrams: blue input / predictor, teal concepts, grey head, white outputs, coral losses and gradients (dots run backwards).
import React from 'react';
import { C } from '../kit/theme';
import { E, HText, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, bs, be, bw, bh, inv, type SceneProps } from '../kit/core';
import { ArchMap, Block, CREDIT, Credit, EvTag, Flow, MathSvg, PhotoR, ShareBars, rgba, type Kind } from '../kit/cbm';
import { TexSteps } from '../kit/slots';
import { wob } from '../kit/anim';
import { D } from '../kit/data';

const TR = D.train;
const Z = D.zoo;
const HG = (D as unknown as { cub: { herring_gull: { vector: number[]; names: string[] } } }).cub.herring_gull;
const NC: number = D.cub.n_concepts;
// four named CUB attributes of the herring gull's record (class-level labels after Koh et al.'s vote)
const REC: { key: string; name: string; v: number }[] = ([
  { key: 'has_bill_shape::hooked_seabird', name: 'hooked bill' },
  { key: 'has_wing_color::grey', name: 'grey wing' },
  { key: 'has_wing_color::yellow', name: 'yellow wing' },
  { key: 'has_throat_color::white', name: 'white throat' },
] as { key: string; name: string }[]).map((r) => ({ ...r, v: HG.vector[HG.names.indexOf(r.key)] }));
const LAB_GREY = REC[1].v; // grey wing's label (1)
// the worked binary cross-entropy term: a hand-chosen prediction (illustrative, not a model output)
const P_EX = 0.8;
const BCE = -Math.log(P_EX);
const ZS: number = Z.softmax[0]; // the zebra share in the Part 4 worksheet (the photo was a zebra)
const LY_EX = -Math.log(ZS);
const f2 = (v: number) => v.toFixed(2);
const f1 = (v: number) => v.toFixed(1);

/** one slide: an SVG group with its own opacity */
const G: React.FC<{ o: number; children?: React.ReactNode }> = ({ o, children }) =>
  o <= 0.001 ? null : <g opacity={o < 0.999 ? o : undefined}>{children}</g>;

/** a diagram node: a pipeline block with a KaTeX symbol */
const Nd: React.FC<{ x: number; y: number; kind: Kind; tex: string; o?: number; dash?: boolean; w?: number; h?: number; hi?: number; size?: number; dim?: number }> = ({
  x, y, kind, tex, o = 1, dash, w, h, hi = 0, size = 36, dim = 0,
}) => {
  if (o <= 0.001) return null;
  const big = kind === 'input' || kind === 'head';
  const ww = w ?? (kind === 'loss' ? 130 : big ? 140 : 118), hh = h ?? (kind === 'loss' ? 78 : big ? 96 : 84);
  return (
    <g opacity={(o * (1 - 0.65 * dim)) < 0.999 ? o * (1 - 0.65 * dim) : undefined}>
      <Block x={x} y={y} w={ww} h={hh} kind={kind} dash={dash} hi={hi} />
      <MathSvg x={x} y={y} tex={tex} size={size} />
    </g>
  );
};

/** a padlock glyph centred on (x, y) */
const Lock: React.FC<{ x: number; y: number; s?: number; o?: number; color?: string }> = ({ x, y, s = 1, o = 1, color = C.chalk2 }) =>
  o <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o < 0.999 ? o : undefined}>
      <path d="M -11 -2 L -11 -12 A 11 11 0 0 1 11 -12 L 11 -2" fill="none" stroke={color} strokeWidth={4} />
      <rect x={-16} y={-4} width={32} height={26} rx={5} fill={color} />
      <circle cx={0} cy={8} r={3.5} fill="#0B0F14" />
    </g>
  );

/** a small chain of coloured cells (overview icons on slide 7) */
const Chip: React.FC<{ x: number; y: number; color: string; dash?: boolean; o?: number }> = ({ x, y, color, dash, o = 1 }) => (
  <rect x={x - 26} y={y - 18} width={52} height={36} rx={7} fill={rgba(color, 0.16)} stroke={color} strokeWidth={2.5} strokeDasharray={dash ? '6 5' : undefined} opacity={o} />
);

export const S05: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.4) => inv(x, x + d, t);
  const NB = P.beats.length;
  /** slide k: fades in (0.3 s) on the beat's first words, fades out (0.3 s) after the beat ends */
  const outT = (k: number) => Math.min(be(P, k) + 0.02, b(k + 1) - 0.34);
  const so = (k: number) => {
    const fin = inv(b(k) - 0.05, b(k) + 0.25, t);
    if (k === NB) return fin;
    const z = outT(k);
    return fin * (1 - inv(z, z + 0.3, t));
  };
  const S = Array.from({ length: NB + 1 }, (_, k) => (k === 0 ? 0 : so(k)));
  const o = (k: number, v = 1) => S[k] * v;

  // ================= 5.1 motivation
  const m1 = { gx: 640, cx: 900, fx: 1170, yx: 1400, y: 540 };
  const ph1 = { x: 220, y: m1.y - 110, w: 220, h: 220 };
  const given1 = at(w(1, 'given') - 0.2);
  const q1 = at(w(1, 'Where') - 0.1);
  const learn1 = at(w(1, 'learns') - 0.1);
  const live1 = at(b(1) + 0.3, 0.5);

  // ================= 5.2 the record
  const s2x = at(w(2, 'input') - 0.1), s2c = at(w(2, 'concept') - 0.1), s2y = at(w(2, 'task') - 0.1);
  const r2ph = at(w(2, 'herring') - 0.1), r2lab = at(w(2, 'zeros') - 0.15), r2sp = at(w(2, 'species') - 0.15);
  const R2 = { phx: 230, cx: 680, sx: 1460, y: 340 };

  // ================= 5.3 the concept loss
  const w3 = at(w(3, 'compares') - 0.1);
  const e3a = at(w(3, 'binary') - 0.1), e3b = at(w(3, 'binary') + 0.4), e3c = at(w(3, 'binary') + 0.9);
  const avg3 = at(w(3, 'averaged') - 0.1);

  // ================= 5.4 one worked term
  const pl4 = at(b(4) + 0.05);
  const lab4 = at(w(4, 'grey') - 0.1);
  const pt4 = at(w(4, '0.8') - 0.1);
  const res4 = at(w(4, '0.22') - 0.1);
  const clo4 = inv(w(4, 'Closer') - 0.1, w(4, 'Closer') + 0.9, t);
  const PL = { x0: 230, x1: 790, y0: 820, y1: 380, ymax: 3 }; // plot frame: ĉ 0..1 across, loss 0..3 up
  const px = (u: number) => PL.x0 + u * (PL.x1 - PL.x0);
  const py = (v: number) => PL.y0 - (Math.min(v, PL.ymax) / PL.ymax) * (PL.y0 - PL.y1);
  const curve = Array.from({ length: 80 }, (_, i) => 0.05 + (0.95 * i) / 79)
    .map((u, i) => `${i ? 'L' : 'M'}${px(u).toFixed(1)} ${py(-Math.log(u)).toFixed(1)}`).join(' ');

  // ================= 5.5 the task loss
  const w5 = at(w(5, 'task') - 0.1), s5 = at(w(5, 'cross') - 0.1);
  const bars5 = at(w(5, 'share') - 0.2, 0.6), ring5 = at(w(5, 'correct') - 0.1), ex5 = at(w(5, 'class', 1) - 0.1);

  // ================= 5.6 the weighted sum
  const p6 = [at(w(6, 'weighted') - 0.1), at(w(6, 'weighted') + 0.3), at(w(6, 'combines') + 0.1)];
  const lam6 = at(w(6, 'Lambda') - 0.1);

  // ================= 5.7 three ways
  const card7 = [0, 1, 2].map((i) => at(w(7, 'three') - 0.1 + i * 0.35));
  const koh7 = at(w(7, 'Koh') - 0.1);
  const CX7 = [520, 960, 1400];

  // ================= 5.8 to 5.11 diagrams
  const X = [470, 690, 910, 1170, 1410], Y1 = 430, Y2 = 690;
  // independent
  const i8a = at(w(8, 'fit') - 0.1), i8b = at(w(8, 'separately') - 0.1), i8t = at(w(8, 'test') - 0.1);
  const i8live = at(w(8, 'fit') + 0.4, 0.4);
  // sequential
  const q9a = at(b(9) + 0.05), q9lock = at(w(9, 'freeze') - 0.1), q9b = at(w(9, 'then') - 0.1), q9m = at(w(9, 'mistakes') - 0.4);
  const q9g1 = (1 - at(w(9, 'freeze') - 0.1, 0.3)) * at(b(9) + 0.3, 0.4);
  // joint (slides 10 and 11 share one diagram, which stays put between them)
  const jo = inv(b(10) - 0.05, b(10) + 0.25, t) * (1 - inv(outT(11), outT(11) + 0.3, t));
  const j10both = at(w(10, 'both') - 0.1);
  const JY = 470, JX = [280, 490, 700, 910, 1120, 1340, 1580];
  const LCY = 720;
  const j11 = at(b(11) + 0.1);
  const j11g = inv(w(11, 'gradient') - 0.1, w(11, 'gradient') + 1.6, t) * (1 - at(outT(11), 0.3));
  const j11d = at(w(11, 'concept') - 0.1);
  const j11s = at(w(11, 'shaped') - 0.2);
  const j11live = at(w(11, 'gradient') + 1.2, 0.4);

  // ================= 5.12 tension
  const t12 = at(b(12) + 0.05), h12 = at(w(12, 'improve') - 0.1), p12 = at(w(12, 'hurt') - 0.1), m12 = at(w(12, 'measured') - 0.4);
  const knob = 0.55 + wob(t, 0.5, 0.045) * p12;

  // ================= 5.13 the measured run
  const r13 = at(b(13) + 0.05), lc13 = at(w(13, 'concept') - 0.1), ly13 = at(w(13, 'task') - 0.1);

  // forward flows with dots
  const fl = (pts: [number, number][], color: string, op: number, live = 0, tt = 0, head = 12) =>
    <Flow pts={pts} color={color} sw={3} head={head} o={op} t={t + tt} live={live} n={1} dotR={5} />;
  /** a gradient path: drawn from the receiving block to the loss, dots run back (rev) */
  const grad = (pts: [number, number][], op: number, p = 1, live = 0) =>
    <Flow pts={pts} color={C.loss} sw={3.5} head={14} o={op} p={p} rev t={t} live={live} n={3} dotR={6} speed={0.7} />;

  return (
    <Stage>
      {/* ================= photos ================= */}
      <PhotoR R={ph1} src="gull.jpg" o={o(1)} border={C.input} />
      <PhotoR R={{ x: R2.phx, y: R2.y + 20, w: 300, h: 300 }} src="gull.jpg" o={o(2, r2ph)} border={C.input} />

      <Svg>
        {/* ---------------- 5.1 ---------------- */}
        <G o={S[1]}>
          {fl([[ph1.x + ph1.w + 10, m1.y], [m1.gx - 80, m1.y]], C.input, 1, live1)}
          <Nd x={m1.gx} y={m1.y} kind="input" tex="\gth" size={40} />
          {fl([[m1.gx + 74, m1.y], [m1.cx - 64, m1.y]], C.concept, 1, live1, 0.3)}
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={m1.cx - 50} y={m1.y - 118 + i * 80} width={100} height={68} rx={10} fill={rgba(C.concept, 0.14)} stroke={C.concept} strokeWidth={3} />
              <Txt x={m1.cx} y={m1.y - 84 + i * 80} size={32} mono weight={600} fill={C.concept} o={given1 * (1 - q1)}>{f1(Z.c[i])}</Txt>
              <Txt x={m1.cx} y={m1.y - 84 + i * 80} size={40} weight={700} fill={C.concept} o={q1}>?</Txt>
            </g>
          ))}
          <g opacity={0.35}>
            <Flow pts={[[m1.cx + 64, m1.y], [m1.fx - 76, m1.y]]} color={C.concept} sw={3} head={12} />
            <Block x={m1.fx} y={m1.y} w={140} h={96} kind="head" />
            <Flow pts={[[m1.fx + 74, m1.y], [m1.yx - 58, m1.y]]} color={C.chalk} sw={3} head={12} />
            <Block x={m1.yx} y={m1.y} w={104} h={84} kind="output" />
          </g>
          <MathSvg x={m1.fx} y={m1.y} tex="\fph" size={38} o={0.5} />
          <MathSvg x={m1.yx} y={m1.y} tex="\hat{y}" size={38} o={0.5} />
          {learn1 > 0.001 ? <rect x={m1.gx - 84} y={m1.y - 62} width={168} height={124} rx={20} fill="none" stroke={C.input} strokeWidth={3} strokeDasharray="8 7" opacity={learn1} /> : null}
        </G>

        {/* ---------------- 5.2 the record ---------------- */}
        <G o={S[2]}>
          {/* empty slots first (symbols), then the concrete gull record */}
          <rect x={R2.phx} y={R2.y + 20} width={300} height={300} rx={10} fill="none" stroke={C.input} strokeWidth={2.5} strokeDasharray="10 8" opacity={s2x * (1 - r2ph)} />
          <rect x={R2.cx} y={R2.y} width={520} height={340} rx={12} fill={rgba(C.concept, 0.04)} stroke={rgba(C.concept, 0.6)} strokeWidth={2.5} strokeDasharray="10 8" opacity={s2c} />
          {REC.map((r, i) => {
            const y = R2.y + 50 + i * 66, oc = at(w(2, 'zeros') - 0.15 + i * 0.2, 0.3);
            return (
              <g key={r.key} opacity={oc < 0.999 ? oc : undefined}>
                <Txt x={R2.cx + 36} y={y} size={30} anchor="start" weight={600} fill={C.concept}>{r.name}</Txt>
                <rect x={R2.cx + 400} y={y - 26} width={64} height={52} rx={8} fill={r.v ? rgba(C.concept, 0.85) : C.bg3} stroke={C.concept} strokeWidth={2} />
                <Txt x={R2.cx + 432} y={y + 1} size={32} mono weight={700} fill={r.v ? '#0B0F14' : C.concept}>{String(r.v)}</Txt>
              </g>
            );
          })}
          <Txt x={R2.cx + 36} y={R2.y + 50 + 4 * 66} size={26} anchor="start" fill={C.chalk2} o={r2lab}>{`… ${NC} labels in all`}</Txt>
          <rect x={R2.sx - 150} y={R2.y + 120} width={300} height={100} rx={14} fill={C.bg2} stroke={C.chalk} strokeWidth={2.5} strokeDasharray={r2sp > 0.5 ? undefined : '10 8'} opacity={Math.max(s2y, r2sp)} />
          <Txt x={R2.sx} y={R2.y + 170} size={34} weight={700} fill={C.chalk} o={r2sp}>Herring Gull</Txt>
        </G>

        {/* ---------------- 5.4 the curve −log ĉ ---------------- */}
        <G o={S[4]}>
          <g opacity={pl4}>
            <line x1={PL.x0} y1={PL.y0} x2={PL.x1 + 20} y2={PL.y0} stroke={C.line2} strokeWidth={2.5} />
            <line x1={PL.x0} y1={PL.y0} x2={PL.x0} y2={PL.y1 - 20} stroke={C.line2} strokeWidth={2.5} />
            {[0, 0.5, 1].map((u) => <Txt key={u} x={px(u)} y={PL.y0 + 30} size={24} mono fill={C.chalk2}>{String(u)}</Txt>)}
            {[1, 2, 3].map((v) => <Txt key={v} x={PL.x0 - 18} y={py(v)} size={24} mono anchor="end" fill={C.chalk2}>{String(v)}</Txt>)}
            <path d={curve} fill="none" stroke={C.loss} strokeWidth={4} strokeLinecap="round" />
            <MathSvg x={(PL.x0 + PL.x1) / 2} y={PL.y0 + 74} tex="\text{prediction } \ch" size={28} />
            <Txt x={PL.x0 + 20} y={PL.y1 - 30} size={26} anchor="start" fill={C.loss}>loss when the label is 1</Txt>
          </g>
          <g opacity={pt4}>
            <line x1={px(P_EX)} y1={PL.y0} x2={px(P_EX)} y2={py(BCE)} stroke={C.concept} strokeWidth={2} strokeDasharray="6 6" />
            <line x1={PL.x0} y1={py(BCE)} x2={px(P_EX)} y2={py(BCE)} stroke={C.loss} strokeWidth={2} strokeDasharray="6 6" opacity={res4} />
            <circle cx={px(P_EX)} cy={py(BCE)} r={11} fill={C.loss} stroke="#0B0F14" strokeWidth={3} />
            <Txt x={px(P_EX)} y={PL.y0 + 30} size={24} mono weight={700} fill={C.concept}>{String(P_EX)}</Txt>
            <Txt x={px(P_EX) + 22} y={py(BCE) - 30} size={28} mono weight={700} fill={C.loss} o={res4} anchor="start">{f2(BCE)}</Txt>
          </g>
          {/* closer to 1: the point slides down the curve */}
          {clo4 > 0.001 ? (() => {
            const pts = Array.from({ length: 20 }, (_, i) => P_EX + 0.06 + (0.13 * i) / 19).map((u) => [px(u), py(-Math.log(u)) - 22] as [number, number]);
            return <Flow pts={pts} color={C.chalk} sw={3} head={13} p={E.out(clo4)} />;
          })() : null}
        </G>

        {/* ---------------- 5.5 shares ---------------- */}
        <G o={S[5]}>
          <ShareBars x={560} y={560} labels={Z.classes} from={Z.softmax} rowH={74} labelW={180} w={520} size={30} p={bars5} o={bars5} lead={false} />
          {ring5 > 0.001 ? <rect x={540} y={560 - 32} width={180 + 520 + 140} height={64} rx={12} fill="none" stroke={C.chalk} strokeWidth={3} opacity={ring5} /> : null}
        </G>

        {/* ---------------- 5.7 three ways ---------------- */}
        <G o={S[7]}>
          {CX7.map((cx, k) => (
            <g key={k} opacity={card7[k]}>
              <rect x={cx - 200} y={370} width={400} height={330} rx={18} fill={rgba(C.chalk, 0.03)} stroke={C.line2} strokeWidth={2} />
              <Txt x={cx} y={420} size={30} mono weight={700} fill={C.chalk}>{['INDEPENDENT', 'SEQUENTIAL', 'JOINT'][k]}</Txt>
            </g>
          ))}
          {/* icons: blue predictor, teal concepts, grey head; coral = trained by its own loss */}
          <g opacity={card7[0]}>
            <Chip x={CX7[0] - 70} y={520} color={C.input} /><Chip x={CX7[0]} y={520} color={C.concept} />
            <Chip x={CX7[0] - 35} y={600} color={C.concept} dash /><Chip x={CX7[0] + 35} y={600} color={C.chalk2} />
          </g>
          <g opacity={card7[1]}>
            <Chip x={CX7[1] - 90} y={520} color={C.input} /><Chip x={CX7[1] - 20} y={520} color={C.concept} />
            <Lock x={CX7[1] - 90} y={478} s={0.6} />
            <Flow pts={[[CX7[1] + 14, 520], [CX7[1] + 40, 520], [CX7[1] + 40, 600], [CX7[1] + 54, 600]]} color={C.concept} sw={2.5} head={9} />
            <Chip x={CX7[1] + 90} y={600} color={C.chalk2} />
          </g>
          <g opacity={card7[2]}>
            {[0, 1, 2].map((i) => <Chip key={i} x={CX7[2] - 70 + i * 70} y={560} color={[C.input, C.concept, C.chalk2][i]} />)}
          </g>
        </G>

        {/* ---------------- 5.8 independent ---------------- */}
        <G o={S[8]}>
          <g opacity={i8a}>
            {fl([[X[0] + 62, Y1], [X[1] - 76, Y1]], C.input, 1, i8live)}
            {fl([[X[1] + 74, Y1], [X[2] - 64, Y1]], C.concept, 1, i8live, 0.3)}
            {fl([[X[2] + 62, Y1], [X[3] - 70, Y1]], C.concept, 1)}
            {fl([[X[4] - 62, Y1], [X[3] + 70, Y1]], C.concept, 1)}
            <Nd x={X[0]} y={Y1} kind="input" tex="\cin{x}" w={110} h={84} />
            <Nd x={X[1]} y={Y1} kind="input" tex="\gth" size={40} />
            <Nd x={X[2]} y={Y1} kind="concept" tex="\cvec" />
            <Nd x={X[3]} y={Y1} kind="loss" tex="\closs{L_c}" />
            <Nd x={X[4]} y={Y1} kind="concept" tex="\ccon{\mathbf{c}}" dash />
            {grad([[X[1], Y1 - 50], [X[1], Y1 - 86], [X[3], Y1 - 86], [X[3], Y1 - 42]], 1, 1, i8live)}
          </g>
          <g opacity={i8b}>
            {fl([[X[0] + 62, Y2], [X[1] - 76, Y2]], C.concept, 1, i8b)}
            {fl([[X[1] + 74, Y2], [X[2] - 64, Y2]], C.chalk, 1, i8b, 0.3)}
            {fl([[X[2] + 62, Y2], [X[3] - 70, Y2]], C.chalk, 1)}
            {fl([[X[4] - 62, Y2], [X[3] + 70, Y2]], C.chalk, 1)}
            <Nd x={X[0]} y={Y2} kind="concept" tex="\ccon{\mathbf{c}}" dash />
            <Nd x={X[1]} y={Y2} kind="head" tex="\fph" size={40} />
            <Nd x={X[2]} y={Y2} kind="output" tex="\hat{y}" />
            <Nd x={X[3]} y={Y2} kind="loss" tex="\closs{L_y}" />
            <Nd x={X[4]} y={Y2} kind="output" tex="y" dash />
            {grad([[X[1], Y2 + 50], [X[1], Y2 + 86], [X[3], Y2 + 86], [X[3], Y2 + 42]], 1, 1, i8b)}
          </g>
          <Flow pts={[[X[2], Y1 + 44], [X[2], 562], [X[1] - 30, 562], [X[1] - 30, Y2 - 50]]} color={C.chalk} sw={3} head={13} dash="8 8" o={i8t} p={E.io(i8t)} />
        </G>

        {/* ---------------- 5.9 sequential ---------------- */}
        <G o={S[9]}>
          <g opacity={q9a}>
            {fl([[X[0] + 62, Y1], [X[1] - 76, Y1]], C.input, 1, q9a)}
            {fl([[X[1] + 74, Y1], [X[2] - 64, Y1]], C.concept, 1, q9a, 0.3)}
            {fl([[X[2] + 62, Y1], [X[3] - 70, Y1]], C.concept, 1 - 0.6 * q9lock)}
            {fl([[X[4] - 62, Y1], [X[3] + 70, Y1]], C.concept, 1 - 0.6 * q9lock)}
            <Nd x={X[0]} y={Y1} kind="input" tex="\cin{x}" w={110} h={84} />
            <Nd x={X[1]} y={Y1} kind="input" tex="\gth" size={40} />
            <Nd x={X[2]} y={Y1} kind="concept" tex="\cvec" />
            <Nd x={X[3]} y={Y1} kind="loss" tex="\closs{L_c}" dim={q9lock} />
            <Nd x={X[4]} y={Y1} kind="concept" tex="\ccon{\mathbf{c}}" dash dim={q9lock} />
            {grad([[X[1], Y1 - 50], [X[1], Y1 - 86], [X[3], Y1 - 86], [X[3], Y1 - 42]], q9g1, 1, q9g1)}
            <Lock x={X[1]} y={Y1 - 76} s={1.1} o={q9lock} />
          </g>
          <g opacity={q9b}>
            <Flow pts={[[X[2], Y1 + 44], [X[2], 562], [X[0], 562], [X[0], Y2 - 46]]} color={C.concept} sw={3} head={12} t={t} live={q9b} n={2} dotR={5} />
            {fl([[X[0] + 62, Y2], [X[1] - 76, Y2]], C.concept, 1, q9b)}
            {fl([[X[1] + 74, Y2], [X[2] - 64, Y2]], C.chalk, 1, q9b, 0.3)}
            {fl([[X[2] + 62, Y2], [X[3] - 70, Y2]], C.chalk, 1)}
            {fl([[X[4] - 62, Y2], [X[3] + 70, Y2]], C.chalk, 1)}
            <Nd x={X[0]} y={Y2} kind="concept" tex="\cvec" />
            <Nd x={X[1]} y={Y2} kind="head" tex="\fph" size={40} />
            <Nd x={X[2]} y={Y2} kind="output" tex="\hat{y}" />
            <Nd x={X[3]} y={Y2} kind="loss" tex="\closs{L_y}" />
            <Nd x={X[4]} y={Y2} kind="output" tex="y" dash />
            {grad([[X[1], Y2 + 50], [X[1], Y2 + 86], [X[3], Y2 + 86], [X[3], Y2 + 42]], 1, 1, q9b)}
          </g>
        </G>

        {/* ---------------- 5.10 and 5.11 joint ---------------- */}
        <G o={jo}>
          {fl([[JX[0] + 58, JY], [JX[1] - 76, JY]], C.input, 1, 0.6)}
          {fl([[JX[1] + 74, JY], [JX[2] - 64, JY]], C.concept, 1, 0.6, 0.2)}
          {fl([[JX[2] + 62, JY], [JX[3] - 76, JY]], C.concept, 1, 0.6, 0.4)}
          {fl([[JX[3] + 74, JY], [JX[4] - 56, JY]], C.chalk, 1, 0.6, 0.6)}
          {fl([[JX[4] + 56, JY], [JX[5] - 70, JY]], C.chalk, j10both)}
          {fl([[JX[6] - 56, JY], [JX[5] + 70, JY]], C.chalk, j10both)}
          {fl([[JX[2], JY + 44], [JX[2], LCY - 44]], C.concept, j10both)}
          {fl([[JX[2] + 240 - 62, LCY], [JX[2] + 70, LCY]], C.concept, j10both)}
          <Nd x={JX[0]} y={JY} kind="input" tex="\cin{x}" w={104} h={84} />
          <Nd x={JX[1]} y={JY} kind="input" tex="\gth" size={40} hi={j11s} />
          <Nd x={JX[2]} y={JY} kind="concept" tex="\cvec" />
          <Nd x={JX[3]} y={JY} kind="head" tex="\fph" size={40} />
          <Nd x={JX[4]} y={JY} kind="output" tex="\hat{y}" w={104} />
          <Nd x={JX[5]} y={JY} kind="loss" tex="\closs{L_y}" o={j10both} />
          <Nd x={JX[6]} y={JY} kind="output" tex="y" dash w={104} o={j10both} />
          <Nd x={JX[2]} y={LCY} kind="loss" tex="\closs{L_c}" o={j10both} />
          <Nd x={JX[2] + 240} y={LCY} kind="concept" tex="\ccon{\mathbf{c}}" dash o={j10both} />
          {/* gradients: the task loss back along the top into g; the concept loss into g from below */}
          {grad([[JX[1], JY - 50], [JX[1], JY - 96], [JX[5], JY - 96], [JX[5], JY - 42]], j10both, 1, Math.max(0.35 * j10both * (1 - j11), j11live))}
          {grad([[JX[1], JY + 50], [JX[1], LCY], [JX[2] - 68, LCY]], j10both, 1, 0.35 * j10both)}
          {/* 5.11: the task-loss gradient, step by step, as dots over the path */}
          {j11g > 0.001 ? (
            <Flow pts={[[JX[5], JY - 42], [JX[5], JY - 96], [JX[1], JY - 96], [JX[1], JY - 50]]} color={C.loss} sw={7} head={0} p={j11g} o={0.45} />
          ) : null}
        </G>

        {/* ---------------- 5.12 tension ---------------- */}
        <G o={S[12]}>
          <g opacity={t12}>
            <Txt x={560} y={590} size={30} anchor="end" weight={600} fill={C.concept}>grey wing score</Txt>
            <rect x={600} y={572} width={720} height={36} rx={8} fill={C.bg3} stroke={C.line2} strokeWidth={2} />
            <rect x={600} y={572} width={720 * knob} height={36} rx={8} fill={C.concept} opacity={0.9} />
            <circle cx={600 + 720 * knob} cy={590} r={22} fill={C.concept} stroke="#0B0F14" strokeWidth={3} />
          </g>
          <Flow pts={[[600 + 720 * knob - 34, 660], [600 + 720 * knob - 230 - wob(t, 0.5, 8), 660]]} color={C.loss} head={18} sw={4.5} o={p12} />
          <Flow pts={[[600 + 720 * knob + 34, 660], [600 + 720 * knob + 230 + wob(t, 0.5, 8), 660]]} color={C.loss} head={18} sw={4.5} o={h12} />
        </G>

        
      </Svg>

      {/* ================= HTML text and maths ================= */}
      {/* 5.1 */}
      <SlideHead text={bh(P, 1)} o={o(1)} />
      <Rich x={ph1.x + ph1.w / 2} y={m1.y + 150} ax="center" size={30} text="{x:photo}" o={o(1)} />
      <Rich x={m1.gx} y={m1.y + 150} ax="center" size={30} text="{x:concept predictor}" o={o(1)} />
      <Rich x={m1.cx} y={m1.y + 150} ax="center" size={30} text="{c:concept values}" o={o(1)} />
      <Rich x={m1.gx} y={m1.y + 230} ax="center" size={32} color={C.chalk2} text="learned from labelled examples" o={o(1, learn1)} />
      <Credit x={ph1.x} y={ph1.y + ph1.h + 10} text={CREDIT['gull.jpg']} o={o(1)} />

      {/* 5.2 */}
      <SlideHead text={bh(P, 2)} o={o(2)} />
      <Rich x={R2.phx + 150} y={720} ax="center" size={30} text="{x:input}" o={o(2, s2x)} />
      <Tex x={R2.phx + 150} y={800} ax="center" size={56} tex="\cin{x_i}" o={o(2, s2x)} />
      <Rich x={R2.cx + 260} y={720} ax="center" size={30} text="{c:concept labels}, 0 or 1" o={o(2, s2c)} />
      <Tex x={R2.cx + 260} y={800} ax="center" size={56} tex="\ccon{\mathbf{c}_i}" o={o(2, s2c)} />
      <Rich x={R2.sx} y={720} ax="center" size={30} text="{y:task label}" o={o(2, s2y)} />
      <Tex x={R2.sx} y={800} ax="center" size={56} tex="y_i" o={o(2, s2y)} />
      <Credit x={R2.phx} y={860} text={CREDIT['gull.jpg']} o={o(2, r2ph)} />
      <EvTag x={1760} y={890} ax="right" kind="data" text={`Herring Gull's labels in CUB, 4 of ${NC}; our photo`} o={o(2, r2lab)} />

      {/* 5.3 */}
      <SlideHead text={bh(P, 3)} o={o(3)} />
      <Rich x={960} y={330} ax="center" size={34} text="for each concept, compare the {c:prediction} $\ch_k$ with the {c:label} $\ccon{c_k}$" o={o(3, w3)} />
      <Rich x={380} y={470} ax="center" size={28} text="{l:loss for concept k}" o={o(3, e3a)} />
      <Rich x={820} y={470} ax="center" size={28} text="label 1: a low {c:prediction} costs" o={o(3, e3b)} />
      <Rich x={1380} y={470} ax="center" size={28} text="label 0: a high {c:prediction} costs" o={o(3, e3c)} />
      <Tex x={380} y={580} ax="center" size={60} tex="\closs{\ell_k}" o={o(3, e3a)} />
      <Tex x={540} y={580} ax="center" size={60} tex="=" o={o(3, e3a)} />
      <Tex x={820} y={580} ax="center" size={60} tex="-\,\ccon{c_k}\log \ch_k" o={o(3, e3b)} />
      <Tex x={1380} y={580} ax="center" size={60} tex="-\,(1-\ccon{c_k})\log(1-\ch_k)" o={o(3, e3c)} />
      <Rich x={960} y={720} ax="center" size={34} text="binary cross-entropy, averaged over the concepts: $\closs{L_c} = \tfrac{1}{K}\sum_k \closs{\ell_k}$" o={o(3, avg3)} />

      {/* 5.4 */}
      <SlideHead text={bh(P, 4)} o={o(4)} />
      <Rich x={920} y={380} size={34} text={`grey wing: label {c:${LAB_GREY}}, prediction {c:${P_EX}}`} o={o(4, lab4)} />
      <TexSteps x={920} y={520} t={t} size={46} o={S[4]}
        parts={[
          [`\\closs{\\ell} = -\\big[\\ccon{${LAB_GREY}}\\cdot\\log \\ccon{${P_EX}}`, w(4, '0.8') - 0.1],
          [`{}+ \\ccon{${1 - LAB_GREY}}\\cdot\\log(1-\\ccon{${P_EX}})\\big]`, w(4, 'term') - 0.2],
        ]} />
      <TexSteps x={920} y={630} t={t} size={46} o={S[4]}
        parts={[
          [`\\phantom{\\closs{\\ell}} = -\\log \\ccon{${P_EX}}`, w(4, 'minus') - 0.1],
          [`{}\\approx \\closs{${f2(BCE)}}`, w(4, '0.22') - 0.1],
        ]} />
      <Rich x={920} y={760} size={30} color={C.chalk2} text="closer to 1, smaller {l:loss}" o={o(4, clo4)} />
      <EvTag x={1760} y={890} ax="right" kind="illustrative" text="a hand-chosen prediction" o={o(4, pt4)} />

      {/* 5.5 */}
      <SlideHead text={bh(P, 5)} o={o(5)} />
      <Rich x={960} y={320} ax="center" size={34} text="{l:task loss}: minus the log of the share given to the correct {y:class}" o={o(5, w5)} />
      <Tex x={960} y={430} ax="center" size={60} tex="\closs{L_y} = -\log \hat{y}_{\,y_i}" o={o(5, s5)} />
      <Rich x={960} y={790} ax="center" size={30} color={C.chalk2} text={`the zebra photo of Part 4: $\\closs{L_y} = -\\log ${f2(ZS)} \\approx \\closs{${f2(LY_EX)}}$`} o={o(5, ex5)} />
      <HText x={1410} y={560} ay="middle" size={26} color={C.chalk} o={o(5, ring5)}>correct class</HText>
      <EvTag x={1760} y={890} ax="right" kind="illustrative" text="shares from the Part 4 worksheet" o={o(5, bars5)} />

      {/* 5.6 */}
      <SlideHead text={bh(P, 6)} o={o(6)} />
      <Rich x={420} y={430} ax="center" size={30} text="{l:total loss}" o={o(6, p6[0])} />
      <Rich x={850} y={430} ax="center" size={30} text="weight × {l:concept loss}" o={o(6, p6[1])} />
      <Rich x={1360} y={430} ax="center" size={30} text="weight × {l:task loss}" o={o(6, p6[2])} />
      <Tex x={420} y={550} ax="center" size={64} tex="\closs{L}" o={o(6, p6[0])} />
      <Tex x={600} y={550} ax="center" size={64} tex="=" o={o(6, p6[1])} />
      <Tex x={850} y={550} ax="center" size={64} tex="\lambda_c\,\closs{L_c}" o={o(6, p6[1])} />
      <Tex x={1105} y={550} ax="center" size={64} tex="+" o={o(6, p6[2])} />
      <Tex x={1360} y={550} ax="center" size={64} tex="\lambda_y\,\closs{L_y}" o={o(6, p6[2])} />
      <Rich x={960} y={700} ax="center" size={34} color={C.chalk2} text="$\lambda_c$ and $\lambda_y$ set how much each objective counts" o={o(6, lam6)} />

      {/* 5.7 */}
      <SlideHead text={bh(P, 7)} o={o(7)} />
      {['each part on its own labels', 'predictor first, then the head', 'everything at once'].map((s, k) => (
        <HText key={k} x={CX7[k]} y={660} ax="center" ay="middle" size={26} color={C.chalk2} o={o(7, card7[k])}>{s}</HText>
      ))}
      <HText x={960} y={790} ax="center" size={28} color={C.chalk2} o={o(7, koh7)}>Koh et al., ICML 2020</HText>

      {/* 5.8 */}
      <SlideHead text={bh(P, 8)} o={o(8)} />
      <Rich x={180} y={Y1} ay="middle" size={28} text="{x:predictor}" o={o(8, i8a)} />
      <Rich x={180} y={Y2} ay="middle" size={28} text="{f:head}" o={o(8, i8b)} />
      <HText x={X[4]} y={Y1 + 56} ax="center" size={22} color={C.chalk2} o={o(8, i8a)}>concept labels</HText>
      <HText x={X[0]} y={Y2 + 56} ax="center" size={22} color={C.chalk2} o={o(8, i8b)}>true concepts</HText>
      <Rich x={X[2] + 60} y={562} ay="middle" size={28} text="test time: the {f:head} receives {c:predicted concepts}" o={o(8, i8t)} />
      <Rich x={960} y={850} ax="center" size={26} color={C.chalk2} text="{l:coral}: the gradient of each loss, flowing back to what it trains" o={o(8, i8a)} />

      {/* 5.9 */}
      <SlideHead text={bh(P, 9)} o={o(9)} />
      <Rich x={180} y={Y1} ay="middle" size={28} text="{x:step 1}" o={o(9, q9a)} />
      <Rich x={180} y={Y2} ay="middle" size={28} text="{f:step 2}" o={o(9, q9b)} />
      <HText x={X[1] + 30} y={Y1 - 76} ay="middle" size={26} weight={600} color={C.chalk2} o={o(9, q9lock)}>frozen</HText>
      <Rich x={960} y={850} ax="center" size={30} text="the {f:head} learns from the {x:predictor}'s actual mistakes" o={o(9, q9m)} />

      {/* 5.10 and 5.11 */}
      <SlideHead text={bh(P, 10)} o={o(10)} />
      <Rich x={960} y={850} ax="center" size={30} text="both {l:losses} train the whole system" o={o(10, j10both)} />
      <SlideHead text={bh(P, 11)} o={o(11)} />
      <Tex x={(JX[2] + JX[3]) / 2} y={JY - 136} ax="center" size={44} tex="\closs{\partial L_y / \partial \ch}" o={o(11, j11d)} />
      <Rich x={960} y={850} ax="center" size={30} text="the {x:concept predictor} is shaped by both {l:losses}" o={o(11, j11s)} />

      {/* 5.12 */}
      <SlideHead text={bh(P, 12)} o={o(12)} />
      <HText x={1300} y={660} ay="middle" size={28} color={C.loss} o={o(12, h12)}>toward what helps the task</HText>
      <HText x={700} y={660} ax="right" ay="middle" size={28} color={C.loss} o={o(12, p12)}>toward its label</HText>
      <Rich x={960} y={380} ax="center" size={34} text="can improve {y:task accuracy}, can hurt {c:concept fidelity}" o={o(12, h12)} />
      <HText x={960} y={790} ax="center" size={34} weight={700} color={C.chalk} o={o(12, m12)}>whether it happens has to be measured</HText>

      {/* 5.13 */}
      <SlideHead text={bh(P, 13)} o={o(13)} />
      <Rich x={790} y={440} ax="center" size={30} text={`{l:concept loss}, weight ${TR.lambda_c}`} o={o(13, lc13)} />
      <Rich x={1120} y={440} ax="center" size={30} text={`{l:task loss}, weight ${TR.lambda_y}`} o={o(13, ly13)} />
      <Tex x={560} y={550} ax="center" size={64} tex="\closs{L}" o={o(13, r13)} />
      <Tex x={650} y={550} ax="center" size={64} tex="=" o={o(13, r13)} />
      <Tex x={790} y={550} ax="center" size={64} tex={`${TR.lambda_c}\\,\\closs{L_c}`} o={o(13, lc13)} />
      <Tex x={950} y={550} ax="center" size={64} tex="+" o={o(13, ly13)} />
      <Tex x={1100} y={550} ax="center" size={64} tex={`${TR.lambda_y}\\,\\closs{L_y}`} o={o(13, ly13)} />
      <Rich x={960} y={790} ax="center" size={30} text={`${TR.strategy} training, in the experiment of Part 11`} o={o(13, r13)} />
      <EvTag x={1760} y={890} ax="right" kind="measured" text="settings of the trained shape model, Part 11" o={o(13, r13)} />

      <Header t={t} part={5} title={P.title} />
      <ArchMap on={['g', 'c', 'f']} o={inv(0, 0.5, t)} />
    </Stage>
  );
};
