// s24 Part 10 · Grounding the concepts: VLG-CBM (Srivastava et al., NeurIPS 2024). Revision 2: one idea per slide.
// 24.1 motivation: a language model names a concept, CLIP scores it, nothing checks the image.
// 24.2 intuition: naming (a chip with no place in the photo) vs pointing (a box on the bill); only found concepts count.
// 24.3 three ways a concept fails (not visual / the setting / scores high where absent), three cards.
// 24.4 random-layer control: fixed image encoder and random layer, trained head; accuracy does not establish concept meaning.
// 24.5 the detector step: boxes on the gull at D.gull.regions (illustrative boxes) and the pipeline.
// 24.6 boxes become a 0/1 vector c^det for the gull's concepts (symbol named).  24.7 the concept layer; L_C in words, then symbols.
// 24.8 one BCE term worked out for a label 1 and a label 0 (same numbers as Part 5; predictions illustrative).
// 24.9 NEC on a small sparse 3 x 6 head (illustrative weights): count per row, average.
// 24.10 intuition: a dense row (every weight non-zero) can fit anything; random concepts suffice (Theorem 4.1, reported).
// 24.11 intuition: a fair comparison at the same budget; the dense row is cut to the same count, then accuracy bars.
// 24.12 NEC formula, words over symbols, with the Herring Gull row of 24.9 counted.  24.13 held at 5: five named concepts.
// 24.14 recap: what changed compared with label-free models.  24.15 VariantCard.
import React from 'react';
import modernSections from '../modernSections.json';
import { C } from '../kit/theme';
import { E, Header, HText, Rich, SlideHead, Stage, Svg, Tex, Txt, ROLE, bs, bw, bh, inv, type SceneProps } from '../kit/core';
import { ArchMap, Block, Credit, CREDIT, Cross, EvTag, Flow, MathSvg, PhotoR, Pill, Region, VariantCard, VecCol, rgba, ux, vy, type Rect, type VariantRows } from '../kit/cbm';
import { D } from '../kit/data';
import { TexSteps } from '../kit/slots';

const REG: Record<string, number[]> = D.gull.regions;
const FC = ROLE.f;

const Slide: React.FC<{ o: number; children?: React.ReactNode }> = ({ o, children }) =>
  o <= 0.001 ? null : <div style={{ position: 'absolute', inset: 0, opacity: o < 0.999 ? o : undefined }}>{children}</div>;

const pillW = (s: string, size: number) => s.length * size * 0.62 + size * 0.9;

// detector boxes (illustrative) and the grounded labels of 24.5
const BOXES: { key: string; label: string; side: 'top' | 'bottom' }[] = [
  { key: 'bill', label: 'yellow bill', side: 'bottom' },
  { key: 'head', label: 'white head', side: 'top' },
  { key: 'wingtip', label: 'black wingtips', side: 'bottom' },
];
const LABELS = [...BOXES.map((b) => b.label), 'loud laughing call'];
const CDET = [1, 1, 1, 0];

// 24.7 a small sparse head (illustrative weights): 3 gull species x 6 concepts
const MCOLS = ['grey back', 'black wingtips', 'yellow bill', 'red bill spot', 'dark back', 'pink legs'];
const MROWS = ['Herring Gull', 'California Gull', 'Western Gull'];
const MW: number[][] = [
  [1.2, 0.8, 0, 0.9, 0, 0],
  [0.7, 0, 1.1, 0, 0, 0],
  [0, 0.5, 0, 0.4, 1.3, 0.6],
];
const NNZ = MW.map((r) => r.filter((v) => v !== 0).length);
const NEC7 = NNZ.reduce((s, v) => s + v, 0) / NNZ.length;

// 24.8 the Herring Gull row of a head held at NEC = 5 (illustrative)
const HROW = [1.2, 0.8, 0, 1.0, 0.9, 0, 0.6, 0];
const HNAMES = ['grey back', 'black wingtips', 'yellow bill', 'red bill spot', 'white head'];
const HNZ = HROW.map((v, i) => (v !== 0 ? i : -1)).filter((i) => i >= 0);

// 24.9 a dense Herring Gull row: every weight non-zero (illustrative)
const DENSE = [0.3, -0.1, 0.2, 0.4, -0.2, 0.1, 0.3, -0.3, 0.2, 0.1, -0.1, 0.4, 0.2, -0.2, 0.3, 0.1, -0.4, 0.2, 0.1, -0.1];
// 24.10 two heads over the same 12 concepts (illustrative): A is sparse; B starts dense and is cut to the same count
const BUD_A = [0.9, 0, 0, 0.7, 0, 0.5, 0, 0, 0.8, 0, 0.4, 0];
const BUD_B = [0.3, 0.2, 0.4, 0.1, 0.3, 0.2, 0.5, 0.1, 0.2, 0.3, 0.1, 0.2];
const NBUD = BUD_A.filter((v) => v !== 0).length;
const KEEP_B = BUD_B.map((v, j) => [v, j]).sort((a, c) => c[0] - a[0] || a[1] - c[1]).slice(0, NBUD).map((r) => r[1]);
const ACC_AB = [0.62, 0.55]; // bar lengths only, no numbers shown

// 24.8 one BCE term per label value (illustrative predictions; the same -log 0.8 as Part 5)
const BCE_ROWS = [
  { chip: 'black wingtips', box: true, c: 1, p: 0.8, tex: '-\\log 0.8', v: -Math.log(0.8) },
  { chip: 'loud laughing call', box: false, c: 0, p: 0.2, tex: '-\\log(1 - 0.2)', v: -Math.log(1 - 0.2) },
];
// 24.14 recap rows: label-free models vs VLG-CBM
const RECAP: { lab: string; lf: string; vlg: string }[] = [
  { lab: 'the concept layer learns from', lf: 'copying {x:CLIP} scores', vlg: '{c:detector boxes}' },
  { lab: 'the head is judged at', lf: 'its own sparsity level', vlg: 'a fixed number per class' },
];

const VROWS: VariantRows = {
  g: '\\ch = W_c\\,\\cin{e(x)},\\ \\text{trained on detector labels } \\ccon{c^{\\text{det}}}',
  c: '\\text{concept scores } \\ch_1, \\dots, \\ch_k',
  f: '\\yh = \\fph(\\ch) = W\\ch + b,\\ \\text{sparse, NEC fixed}',
  train: 'W_c,\\ \\fph',
  data: '\\{(\\cin{x}, y)\\}\\ +\\ \\text{an open-vocabulary detector}',
};

/** a loudspeaker with sound arcs (for the non-visual concept) */
const Sound: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`} stroke={C.chalk2} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M -70 -18 L -46 -18 L -16 -44 L -16 44 L -46 18 L -70 18 Z" fill={C.chalk2} stroke="none" />
    <path d="M 4 -22 Q 22 0 4 22" />
    <path d="M 22 -42 Q 54 0 22 42" />
    <path d="M 40 -62 Q 86 0 40 62" />
  </g>
);

export const S24: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.4) => inv(x, x + d, t);
  const NB = 15;
  const sl = (k: number) => inv(b(k) - 0.05, b(k) + 0.25, t) * (k < NB ? 1 - inv(b(k + 1) - 0.35, b(k + 1) - 0.05, t) : 1);

  // ---------------- 24.1
  const PH1: Rect = { x: 200, y: 330, w: 440, h: 440 };
  const s1lm = at(w(1, 'weakness') - 0.3), s1chip = at(w(1, 'weakness') + 0.1), s1clip = at(w(1, 'weakness') + 0.5);
  const s1q = at(w(1, 'nothing') - 0.1, 0.6), s1line = at(w(1, 'visible') - 0.2);
  // ---------------- 24.2 intuition: naming vs pointing
  const s2name = at(w(2, 'Naming') - 0.2, 0.5), s2point = at(w(2, 'pointing') - 0.2, 0.5);
  const s2box = E.out(inv(w(2, 'detector') - 0.1, w(2, 'detector') + 0.7, t)), s2link = at(w(2, 'point', 1) - 0.1, 0.5);
  const s2cnt = at(w(2, 'count') - 0.2, 0.5), s2no = at(w(2, 'find') - 0.3, 0.5);
  // ---------------- 24.3
  const s2 = [at(w(3, 'visual') - 0.3, 0.5), at(w(3, 'setting') - 0.3, 0.5), at(w(3, 'score') - 0.3, 0.5)];
  const s3white = at(w(3, 'white') - 0.3, 0.5);
  // ---------------- 24.4 random-layer control
  const s4input = at(w(4, 'photo') - 0.2), s4random = at(w(4, 'randomly') - 0.2);
  const s4head = at(w(4, 'Train') - 0.2), s4result = at(w(4, 'many') - 0.2);
  const s4meaning = at(w(4, 'survived') - 0.2), s4check = at(w(4, 'check') - 0.2);
  const PHCONTROL: Rect = { x: 130, y: 390, w: 210, h: 210 };
  // ---------------- 24.5
  const PH4: Rect = { x: 200, y: 310, w: 560, h: 560 };
  const s4names = at(w(5, 'grounds') - 0.1), s4det = at(w(5, 'open') - 0.2), s4def = at(w(5, 'search') - 0.3, 0.5), s4each = at(w(5, 'looks') - 0.1);
  const s4box = (i: number) => E.out(inv(w(5, 'draws') - 0.2 + i * 0.3, w(5, 'draws') + 0.5 + i * 0.3, t));
  const s4out = at(w(5, 'box') - 0.2), live4 = at(w(5, 'looks'), 0.5);
  // ---------------- 24.6
  const PH5: Rect = { x: 200, y: 370, w: 380, h: 380 };
  const s5rows = at(b(6) + 0.05, 0.5), s5grp = at(w(6, 'present') - 0.2);
  const s5v = [w(6, 'bill'), w(6, 'head'), w(6, 'wingtips'), w(6, 'call')].map((x) => at(x - 0.1, 0.3));
  const s5sym = at(w(6, 'det') - 0.5, 0.5);
  // ---------------- 24.7
  const s6layer = at(w(7, 'linear') - 0.2, 0.5);
  const s6w = [at(w(7, 'loss') - 0.2), at(w(7, 'loss') + 0.1), at(w(7, 'binary') - 0.2), at(w(7, 'binary') + 0.3), at(w(7, 'loss') + 0.3)];
  const s6s = at(w(7, 'binary') + 0.6, 0.5), s6line = at(w(7, 'original') - 0.2);
  // ---------------- 24.8 one BCE term
  const s8eqn = at(b(8) + 0.1, 0.5);
  const s8r = [
    { row: at(w(8, 'wingtips') - 0.3), lab: at(w(8, 'label') - 0.1), pr: at(w(8, 'predicts') - 0.1), term: at(w(8, 'minus') - 0.1), val: at(w(8, 'about') - 0.1) },
    { row: at(w(8, 'call') - 0.3), lab: at(w(8, 'label', 1) - 0.1), pr: at(w(8, 'prediction') - 0.1), term: at(w(8, 'costs') - 0.1), val: at(w(8, 'minus', 1) + 0.3) },
  ];
  const s8close = at(w(8, 'minus', 2) + 0.4, 0.5);
  const T8 = [[w(8, 'minus') - 0.1, w(8, 'about') - 0.1], [w(8, 'costs') - 0.1, w(8, 'minus', 1) + 0.3]];
  // ---------------- 24.9 NEC counted
  const s7m = at(w(9, 'number') - 0.2, 0.5), s7rows = at(w(9, 'row') - 0.2, 0.5), s7nz = at(w(9, 'non') - 0.2, 0.5), s7cnt = at(w(9, 'three') - 0.3, 0.5);
  const s7avg = at(w(9, 'average') - 0.2, 0.5);
  // ---------------- 24.10 a dense head explains nothing
  const s9row = (j: number) => at(w(10, 'puts') - 0.3 + j * 0.05, 0.3), s9cnt = at(w(10, 'every') - 0.1, 0.5);
  const s9rand = at(w(10, 'random') - 0.2, 0.6), s9thm = at(w(10, 'approximate') - 0.3, 0.5), s9line = at(w(10, 'accurate') - 0.2, 0.5);
  // ---------------- 24.11 the same budget
  const s10rows = at(b(11) + 0.05, 0.5), s10cut = E.io(inv(w(11, 'budget') - 0.2, w(11, 'budget') + 0.8, t));
  const s10badge = at(w(11, 'number') - 0.1, 0.5), s10acc = E.out(inv(w(11, 'higher') - 0.3, w(11, 'higher') + 0.6, t));
  const s10line = at(w(11, 'concepts', 1) - 0.4, 0.5);
  // ---------------- 24.12 the count in symbols
  const s12w = [at(b(12) + 0.1), at(w(12, 'zero') - 0.2), at(w(12, 'averages') - 0.2)];
  const s12row = at(w(12, 'number') - 0.2, 0.5), s12cnt = at(w(12, 'zero', 1) - 0.1, 0.5);
  // ---------------- 24.13 held at five
  const s8eq = at(b(13) + 0.1, 0.5), s8five = at(w(13, 'five') - 0.2), s8row = at(w(13, 'head') - 0.2, 0.5);
  const s8read = (i: number) => at(w(13, 'read') - 0.4 + i * 0.15, 0.3), s8cmp = at(w(13, 'handful') - 0.2);
  // ---------------- 24.14 recap
  const s14h = at(b(14) + 0.1, 0.5), s14r = [at(w(14, 'concept') - 0.2, 0.5), at(w(14, 'judged') - 0.2, 0.5)];
  const s14vlg = [at(w(14, 'boxes') - 0.3, 0.5), at(w(14, 'fixed') - 0.2, 0.5)];
  // ---------------- 24.15
  const cardP = [w(15, 'g'), w(15, 'f'), w(15, 'f') + 0.5, w(15, 'held'), w(15, 'data')].reduce((s, x) => s + inv(x - 0.1, x + 0.4, t), 0) / 5;

  // layout constants
  const MX = 560, MY = 440, MCW = 150, MCH = 78;
  const HX = 360, HY = 560, HCW = 150, HCH = 76;
  const chipX = (() => {
    const ws = HNAMES.map((s) => pillW(s, 26));
    const tot = ws.reduce((s, v) => s + v, 0) + 24 * (ws.length - 1);
    let x = 960 - tot / 2;
    return ws.map((v) => { const c = x + v / 2; x += v + 24; return c; });
  })();
  const EQX = 220; // centring offset for the loss pieces
  const PL: Rect = { x: 240, y: 350, w: 400, h: 400 }, PR: Rect = { x: 1060, y: 350, w: 400, h: 400 }; // 24.2
  const DX = 400, DY = 470, DCW = 64, DCH = 72; // 24.9 dense row
  const BX0 = 520, BY = 400, BRH = 104, BCW = 80, BCH = 76; // 24.11 budget rows
  const ZX = 560, ZY = 620, ZCW = 110, ZCH = 72; // 24.12 one counted row
  const NECX = [995, 1228]; // 24.12 word labels over the average and the count

  return (
    <Stage>
      <Header t={t} part={modernSections.s24.part} title={P.title} />
      <ArchMap on={['g', 'c']} o={inv(0, 0.5, t)} />

      {/* ============================================================ 24.1 nothing checks the image */}
      <Slide o={sl(1)}>
        <SlideHead text={bh(P, 1)} />
        <PhotoR R={PH1} src="gull.jpg" />
        <Credit x={PH1.x} y={PH1.y + PH1.h + 8} text={CREDIT['gull.jpg']} />
        <Svg>
          <Block x={880} y={470} w={260} h={100} kind="neutral" title="language model" sub="names a concept" size={28} o={s1lm} />
          <Flow pts={[[1012, 470], [1084, 470]]} color={C.concept} sw={3} head={12} p={s1chip} />
          <Pill x={1094} y={470} text="grey back" color={C.concept} size={30} o={s1chip} />
          <Flow pts={[[1290, 470], [1356, 470]]} color={C.concept} sw={3} head={12} p={s1clip} />
          <Block x={1460} y={470} w={200} h={100} kind="input" title="CLIP" sub="scores it" size={30} o={s1clip} />
          <Flow pts={[[1562, 470], [1626, 470]]} color={C.concept} sw={3} head={12} p={s1clip} />
          <MathSvg x={1680} y={470} tex="\ch_j" size={44} o={s1clip} />
          {/* the missing check: from the concept back to the photo */}
          <g opacity={s1q < 0.999 ? s1q : undefined}>
            <path d={`M 1191 500 L 1191 640 L ${PH1.x + PH1.w + 14} 640`} fill="none" stroke={C.mute} strokeWidth={3} strokeDasharray="8 9" />
            <circle cx={920} cy={640} r={34} fill={C.bg} stroke={C.mute} strokeWidth={3} />
            <Txt x={920} y={642} size={40} weight={700} fill={C.chalk}>?</Txt>
            <Txt x={920} y={706} size={28} fill={C.chalk2}>is it in the image?</Txt>
          </g>
        </Svg>
        <Rich x={750} y={840} w={1010} size={34} text="A CLIP score alone does not locate the {c:concept} in the {x:image}." o={s1line} />
      </Slide>

      {/* ============================================================ 24.2 intuition: naming vs pointing */}
      <Slide o={sl(2)}>
        <SlideHead text={bh(P, 2)} />
        <Rich x={PL.x + PL.w / 2} y={296} ax="center" size={30} weight={600} color={C.chalk2} text="naming" o={s2name} />
        <Rich x={PR.x + PR.w / 2} y={296} ax="center" size={30} weight={600} color={C.chalk2} text="pointing" o={s2point} />
        <PhotoR R={PL} src="gull.jpg" o={s2name} />
        <PhotoR R={PR} src="gull.jpg" o={s2point} />
        <Credit x={PL.x} y={PL.y + PL.h + 8} text={CREDIT['gull.jpg']} o={s2name} />
        <Svg>
          {/* naming: the chip floats beside the photo, tied to no place in it */}
          <Pill x={PL.x + PL.w + 40} y={PL.y + 110} text="yellow bill" color={C.concept} size={28} o={s2name} />
          <g opacity={s2name < 0.999 ? s2name : undefined}>
            <path d={`M ${PL.x + PL.w + 150} ${PL.y + 135} L ${PL.x + PL.w + 150} ${PL.y + 210}`} fill="none" stroke={C.mute} strokeWidth={3} strokeDasharray="7 8" />
            <circle cx={PL.x + PL.w + 150} cy={PL.y + 250} r={32} fill={C.bg} stroke={C.mute} strokeWidth={3} />
            <Txt x={PL.x + PL.w + 150} y={PL.y + 252} size={38} weight={700} fill={C.chalk}>?</Txt>
            <Txt x={PL.x + PL.w + 150} y={PL.y + 316} size={26} fill={C.chalk2}>where?</Txt>
          </g>
          {/* pointing: a box on the bill, the chip tied to it */}
          <Region R={PR} b={REG.bill} color={C.concept} draw={s2box} sw={4} r={6} />
          <Flow pts={[[ux(PR, REG.bill[0] + REG.bill[2] / 2) + 6, vy(PR, REG.bill[1])], [PR.x + PR.w + 34, vy(PR, REG.bill[1])]]} color={C.concept} sw={3} head={0} p={s2link} />
          <Pill x={PR.x + PR.w + 40} y={vy(PR, REG.bill[1])} text="yellow bill" color={C.concept} size={28} o={s2link} />
          {/* only found concepts count */}
          <g opacity={s2cnt < 0.999 ? s2cnt : undefined}>
            <path d={`M ${PR.x + 4} ${801} L ${PR.x + 14} ${811} L ${PR.x + 34} ${789}`} fill="none" stroke={C.concept} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
            <Pill x={PR.x + 56} y={800} text="yellow bill" color={C.concept} size={26} />
            <Txt x={PR.x + 300} y={800} size={28} anchor="start" fill={C.chalk}>box found: counts</Txt>
          </g>
          <g opacity={s2no < 0.999 ? s2no : undefined}>
            <Cross x={PR.x + 6} y={852} w={26} h={26} color={C.mute} sw={4} />
            <Pill x={PR.x + 56} y={866} text="loud laughing call" color={C.mute} size={26} />
            <Txt x={PR.x + 400} y={866} size={28} anchor="start" fill={C.chalk2}>no box: not counted</Txt>
          </g>
        </Svg>
        <Rich x={PL.x} y={800} w={600} size={30} color={C.chalk2} text="a {c:name}, with no place in the {x:image}" o={s2name} />
        <EvTag x={1760} y={900} ax="right" kind="illustrative" text="box drawn for teaching" o={s2box} />
      </Slide>

      {/* ============================================================ 24.3 three ways to fail */}
      <Slide o={sl(3)}>
        <SlideHead text={bh(P, 3)} />
        {[
          { chip: 'loud laughing call', cap: 'not visual', frac: null },
          { chip: 'near the sea', cap: 'the setting, not the bird', frac: [0.5, 0.03, 1, 0.28] as [number, number, number, number] },
          { chip: 'black head', cap: 'high score, yet absent', frac: [0.08, 0.17, 0.48, 0.37] as [number, number, number, number] },
        ].map((c, i) => {
          const x = 200 + i * 530;
          const o = s2[i];
          return (
            <React.Fragment key={i}>
              <Svg o={o}>
                <rect x={x} y={330} width={460} height={470} rx={16} fill={C.bg2} stroke={C.line} strokeWidth={2} />
                <Txt x={x + 30} y={378} size={26} mono weight={700} anchor="start" fill={C.mute}>{String(i + 1)}</Txt>
                <Pill x={x + 66} y={378} text={c.chip} color={C.concept} size={26} />
                {!c.frac ? (
                  <g>
                    <rect x={x + 30} y={420} width={400} height={200} rx={8} fill={C.bg3} />
                    <Sound x={x + 230} y={520} />
                  </g>
                ) : null}
              </Svg>
              {c.frac ? <PhotoR R={{ x: x + 30, y: 420, w: 400, h: 200 }} src="gull.jpg" frac={c.frac} o={o} shadow={false} /> : null}
              <Rich x={x + 230} y={660} w={400} ax="center" size={32} weight={600} text={c.cap} o={o} />
            </React.Fragment>
          );
        })}
        <Rich x={200 + 2 * 530 + 230} y={716} ax="center" size={26} color={C.chalk2} text="but this gull's head is white" o={s3white} />
        <Credit x={200} y={812} text={CREDIT['gull.jpg']} o={s2[1]} />
        <EvTag x={1760} y={880} ax="right" kind="illustrative" text="example concepts chosen for teaching" o={s2[0]} />
      </Slide>

      {/* ============================================================ 24.4 random-layer control */}
      <Slide o={sl(4)}>
        <SlideHead text={bh(P, 4)} />
        <PhotoR R={PHCONTROL} src="gull.jpg" o={s4input} />
        <Credit x={130} y={640} text={CREDIT['gull.jpg']} o={s4input} />
        <Svg>
          <Txt x={235} y={355} size={28} fill={C.input} o={s4input}>input photo</Txt>
          <Flow pts={[[345,495],[398,495]]} color={C.input} o={s4input} />
          <Block x={535} y={495} w={270} h={120} kind="input" title="image encoder" sub="pretrained, fixed" size={29} subSize={20} o={s4input} />
          <Flow pts={[[672,495],[758,495]]} color={C.input} o={s4random} />
          <Txt x={715} y={407} size={24} fill={C.input} o={s4random}>features</Txt>
          <Block x={910} y={495} w={300} h={120} kind="neutral" title="concept layer" sub="random weights, fixed" size={30} subSize={20} o={s4random} />
          <Flow pts={[[1062,495],[1148,495]]} color={C.mute} o={s4head} />
          <Txt x={1105} y={407} size={24} fill={C.chalk2} o={s4head}>values</Txt>
          <Block x={1270} y={495} w={240} h={120} kind="head" title="class head" sub="trained" size={30} subSize={22} o={s4head} />
          <Txt x={1270} y={330} size={27} fill={C.loss} o={s4head}>fit using class labels</Txt>
          <Flow pts={[[1270,355],[1270,429]]} color={C.loss} o={s4head} />
          <Flow pts={[[1392,495],[1498,495]]} color={C.chalk} o={s4head} />
          <Block x={1630} y={495} w={260} h={120} kind="output" title="bird species" sub="predicted class" size={30} subSize={21} o={s4head} />
        </Svg>
        <Rich x={910} y={580} ax="center" w={430} align="center" size={26} color={C.chalk2} text="Never trained to detect {c:yellow bill}." o={s4random} />
        <Rich x={960} y={730} ax="center" size={34} text="With many outputs, this baseline can be {y:almost as accurate as concept models}." o={s4result} />
        <Rich x={960} y={795} ax="center" size={29} color={C.chalk2} text="Useful image information can survive without named concept meanings." o={s4meaning} />
        <Rich x={960} y={900} ax="center" size={34} text="Check: does a high {c:yellow-bill score} really mean a {c:yellow bill} is present?" o={s4check} />
        <EvTag x={1760} y={1000} ax="right" kind="reported" text="Srivastava et al. 2024, Section 4 and Figure 3; prediction path schematic" o={s4result} />
      </Slide>

      {/* ============================================================ 24.5 the detector */}
      <Slide o={sl(5)}>
        <SlideHead text={bh(P, 5)} />
        <Rich x={160} y={260} size={28} text="Vision-Language-Guided Concept Bottleneck Model (VLG-CBM)" />
        <PhotoR R={PH4} src="gull.jpg" />
        <Credit x={PH4.x} y={PH4.y + PH4.h + 8} text={CREDIT['gull.jpg']} />
        <Svg>
          {BOXES.map((bx, i) => (
            <Region key={bx.key} R={PH4} b={REG[bx.key]} color={C.concept} draw={s4box(i)} label={bx.label} labelSide={bx.side} size={24} r={6} />
          ))}
          <Block x={1340} y={370} w={380} h={86} kind="concept" title="concept names" size={30} o={s4names} />
          <Flow pts={[[1340, 415], [1340, 482]]} color={C.concept} sw={3} head={12} p={s4det} t={t} live={live4} n={1} />
          <Block x={1340} y={540} w={460} h={110} kind="neutral" title="open-vocabulary detector" sub="one image at a time" size={30} o={s4det} hi={live4 * 0.4} />
          <Flow pts={[[1108, 540], [PH4.x + PH4.w + 16, 540]]} color={C.input} sw={3} head={12} p={s4each} t={t + 0.3} live={live4} n={2} />
          <Txt x={940} y={510} size={26} fill={C.chalk2} o={s4each}>each training image</Txt>
          <Flow pts={[[1340, 597], [1340, 660]]} color={C.concept} sw={3} head={12} p={s4out} />
          <Block x={1340} y={706} w={380} h={86} kind="concept" title="a box where it is found" size={28} o={s4out} />
        </Svg>
        <Rich x={1110} y={772} w={650} size={27} lh={1.3} color={C.chalk2} text="open-vocabulary: it searches for any phrase you give it, not only a fixed list of objects" o={s4def} />
        <EvTag x={1760} y={880} ax="right" kind="illustrative" text="boxes drawn for teaching, not a detector run" o={s4box(0)} />
      </Slide>

      {/* ============================================================ 24.6 grounded labels: a 0/1 vector */}
      <Slide o={sl(6)}>
        <SlideHead text={bh(P, 6)} />
        <PhotoR R={PH5} src="gull.jpg" />
        <Credit x={PH5.x} y={PH5.y + PH5.h + 8} text={CREDIT['gull.jpg']} />
        <Svg>
          {BOXES.map((bx) => <Region key={bx.key} R={PH5} b={REG[bx.key]} color={C.concept} sw={3} r={5} />)}
          <Txt x={680} y={350} size={24} mono weight={600} anchor="start" fill={C.mute} o={s5rows}>CONCEPT</Txt>
          <Txt x={1120} y={350} size={24} mono weight={600} fill={C.mute} o={s5rows}>BOX?</Txt>
          {LABELS.map((l, i) => {
            const y = 420 + i * 80;
            const found = CDET[i] === 1;
            return (
              <g key={l} opacity={s5rows < 0.999 ? s5rows : undefined}>
                <Txt x={680} y={y} size={32} anchor="start" fill={found ? C.chalk : C.chalk2}>{l}</Txt>
                <g opacity={s5v[i] < 0.999 ? s5v[i] : undefined}>
                  {found ? (
                    <path d={`M ${1106} ${y + 1} L ${1116} ${y + 11} L ${1136} ${y - 11}`} fill="none" stroke={C.concept} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" />
                  ) : <Txt x={1120} y={y} size={28} fill={C.mute}>none</Txt>}
                </g>
              </g>
            );
          })}
          <VecCol x={1420} y={380} vals={CDET} rowH={80} w={110} size={40} digits={0} o={s5grp}
            cellO={(i) => s5v[i]} cellColor={(i) => (CDET[i] ? C.concept : C.chalk2)} />
        </Svg>
        <Rich x={1475} y={318} ax="center" size={30} text="{c:grounded labels}" o={s5grp} />
        <Tex x={1390} y={580} ax="right" size={56} tex="\ccon{\mathbf{c}^{\text{det}}} =" o={s5sym} />
        <Rich x={1475} y={740} ax="center" size={28} color={C.chalk2} text="concept labels from the detector" o={s5sym} />
        <EvTag x={1760} y={880} ax="right" kind="illustrative" text="boxes drawn for teaching" o={s5rows} />
      </Slide>

      {/* ============================================================ 24.7 the loss, words then symbols */}
      <Slide o={sl(7)}>
        <SlideHead text={bh(P, 7)} />
        <Rich x={960} y={330} ax="center" size={32} text="concept layer: {x:backbone features} → one {c:score per concept}" o={s6layer} />
        {[
          { x: 380, word: '{l:concept loss}', tex: '\\closs{\\mathcal{L}_C}', o: s6w[0] },
          { x: 490, word: '', tex: '=', o: s6w[1] },
          { x: 590, word: 'sum over {c:concepts}', tex: '\\sum_j', o: s6w[4] },
          { x: 760, word: 'binary cross-entropy', tex: '\\text{BCE}\\big(', o: s6w[2] },
          { x: 930, word: '{c:detector label}', tex: '\\ccon{c_j^{\\text{det}}},', o: s6w[3] },
          { x: 1095, word: '{c:predicted concept}', tex: '\\ch_j\\big)', o: s6w[3] },
        ].map((p, i) => (
          <React.Fragment key={i}>
            {p.word ? <Rich x={p.x + EQX} y={530} w={160} ax="center" ay="bottom" size={26} lh={1.2} text={p.word} o={p.o} /> : null}
            <Tex x={p.x + EQX} y={620} ax="center" size={60} tex={p.tex} o={s6s} />
          </React.Fragment>
        ))}
        <Rich x={960} y={770} ax="center" size={32} color={C.chalk2} text="as in the original CBM, but no person draws the labels" o={s6line} />
      </Slide>

      {/* ============================================================ 24.8 one BCE term, worked out */}
      <Slide o={sl(8)}>
        <SlideHead text={bh(P, 8)} />
        <Tex x={960} y={350} ax="center" size={46} o={s8eqn}
          tex="\text{BCE}(\ccon{c}, \ch) = -\log \ch\ \ \text{if } \ccon{c} = 1, \qquad -\log(1 - \ch)\ \ \text{if } \ccon{c} = 0" />
        <Svg>
          {['CONCEPT', 'BOX?', 'LABEL', 'PREDICTED', 'TERM'].map((h, j) => (
            <Txt key={h} x={[200, 700, 880, 1060, 1300][j]} y={470} size={22} mono weight={600} anchor={j === 0 || j === 4 ? 'start' : 'middle'} fill={C.mute} o={s8r[0].row}>{h}</Txt>
          ))}
          {BCE_ROWS.map((r, i) => {
            const y = 560 + i * 120, o = s8r[i];
            return (
              <g key={r.chip}>
                <Pill x={200} y={y} text={r.chip} color={r.box ? C.concept : C.mute} size={28} o={o.row} />
                {r.box ? (
                  <path d={`M ${686} ${y + 1} L ${696} ${y + 11} L ${716} ${y - 11}`} fill="none" stroke={C.concept} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" opacity={o.row} />
                ) : <Txt x={700} y={y} size={28} fill={C.mute} o={o.row}>none</Txt>}
                <Txt x={880} y={y} size={40} mono weight={700} fill={r.c ? C.concept : C.chalk2} o={o.lab}>{String(r.c)}</Txt>
                <Txt x={1060} y={y} size={40} mono weight={600} fill={C.chalk} o={o.pr}>{r.p.toFixed(1)}</Txt>
              </g>
            );
          })}
        </Svg>
        {BCE_ROWS.map((r, i) => {
          const y = 560 + i * 120, o = s8r[i];
          return (
            <React.Fragment key={r.chip}>
              <TexSteps x={1300} y={y} t={t} size={44} parts={[[`\\closs{${r.tex}}`, T8[i][0]], [`\\ \\approx \\closs{${r.v.toFixed(2)}}`, T8[i][1]]]} />
            </React.Fragment>
          );
        })}
        <Rich x={960} y={810} ax="center" size={32} color={C.chalk2} text="a prediction close to its label costs little" o={s8close} />
        <EvTag x={1760} y={900} ax="right" kind="illustrative" text="predictions made up for teaching" o={s8r[0].row} />
      </Slide>

      {/* ============================================================ 24.9 NEC on a small sparse head */}
      <Slide o={sl(9)}>
        <SlideHead text={bh(P, 9)} />
        <Svg>
          <g opacity={s7m < 0.999 ? s7m : undefined}>
            <rect x={MX - 6} y={MY - 6} width={MCOLS.length * MCW + 12} height={MROWS.length * MCH + 12} rx={10} fill={C.headFill} stroke="#8792A2" strokeWidth={2.5} />
            {MROWS.map((r, i) => (
              <React.Fragment key={r}>
                <Txt x={MX - 24} y={MY + i * MCH + MCH / 2} size={28} anchor="end" weight={600} fill={C.chalk}>{r}</Txt>
                {MW[i].map((v, j) => {
                  const nz = v !== 0;
                  const cx = MX + j * MCW, cy = MY + i * MCH;
                  return (
                    <g key={j}>
                      <rect x={cx + 3} y={cy + 3} width={MCW - 6} height={MCH - 6} rx={6} fill={nz ? rgba(FC, 0.12 + 0.3 * s7nz * (v / 1.3)) : C.bg3} />
                      {nz ? <rect x={cx + 2} y={cy + 2} width={MCW - 4} height={MCH - 4} rx={7} fill="none" stroke={FC} strokeWidth={3} opacity={s7nz} /> : null}
                      <Txt x={cx + MCW / 2} y={cy + MCH / 2} size={30} mono weight={nz ? 700 : 500} fill={nz ? C.chalk : C.mute}>{nz ? v.toFixed(1) : '0'}</Txt>
                    </g>
                  );
                })}
                <Txt x={MX + MCOLS.length * MCW + 90} y={MY + i * MCH + MCH / 2} size={36} mono weight={700} fill={C.chalk} o={s7cnt}>{String(NNZ[i])}</Txt>
              </React.Fragment>
            ))}
          </g>
        </Svg>
        {MCOLS.map((c, j) => (
          <HText key={c} x={MX + j * MCW + MCW / 2} y={MY - 14} w={MCW - 6} ax="center" ay="bottom" size={26} lh={1.1} color={C.concept} o={s7m}>{c}</HText>
        ))}
        <HText x={MX + MCOLS.length * MCW + 90} y={MY - 14} ax="center" ay="bottom" size={26} lh={1.1} color={C.chalk2} o={s7cnt} w={140}>non-zero</HText>
        <Rich x={MX + (MCOLS.length * MCW) / 2} y={312} ax="center" size={28} color={C.chalk2} text="the {f:head}: one weight per {c:concept}" o={s7m} />
        <Rich x={MX - 24} y={MY - 20} ax="right" ay="bottom" size={26} color={C.chalk2} text="one row per class" o={s7rows} />
        <Rich x={960} y={720} ax="center" size={32} text="{c:number of effective concepts} (NEC): the average count" o={s7avg} />
        <Tex x={960} y={820} ax="center" size={56} tex={`\\text{NEC} = \\frac{${NNZ.join('\\,+\\,')}}{${NNZ.length}} = ${NEC7}`} o={s7avg} />
        <EvTag x={1760} y={900} ax="right" kind="illustrative" text="weights drawn for teaching" o={s7m} />
      </Slide>

      {/* ============================================================ 24.10 a dense head explains nothing */}
      <Slide o={sl(10)}>
        <SlideHead text={bh(P, 10)} />
        <Svg>
          {DENSE.map((v, j) => {
            const x = DX + j * DCW, o = s9row(j);
            return (
              <g key={j} opacity={o < 0.999 ? o : undefined}>
                <rect x={x + 8} y={DY - 52} width={DCW - 16} height={26} rx={5} fill={s9rand > 0.5 ? C.bg3 : rgba(C.concept, 0.85)} stroke={s9rand > 0.5 ? C.mute : 'none'} strokeWidth={2} />
                {s9rand > 0.5 ? <Txt x={x + DCW / 2} y={DY - 39} size={20} weight={700} fill={C.mute} o={inv(0.5, 1, s9rand)}>?</Txt> : null}
                <rect x={x + 3} y={DY + 3} width={DCW - 6} height={DCH - 6} rx={6} fill={rgba(FC, 0.14 + 0.5 * Math.abs(v))} stroke={FC} strokeWidth={2} />
                <Txt x={x + DCW / 2} y={DY + DCH / 2} size={22} mono weight={700} fill={C.chalk}>{v.toFixed(1)}</Txt>
              </g>
            );
          })}
          <Txt x={DX + DENSE.length * DCW} y={DY + DCH + 44} size={28} anchor="end" fill={C.chalk2} o={s9cnt}>{`${DENSE.length} of ${DENSE.length} weights non-zero`}</Txt>
        </Svg>
        <Rich x={DX - 20} y={DY + DCH / 2} ax="right" ay="middle" size={28} weight={600} text="Herring Gull" o={s9row(0)} />
        <Rich x={DX - 20} y={DY - 39} ax="right" ay="middle" size={26} text={s9rand > 0.5 ? '{m:random}' : '{c:concepts}'} o={s9row(0) * (s9rand > 0.5 ? inv(0.5, 1, s9rand) : 1 - inv(0, 0.5, s9rand))} />
        <Rich x={960} y={680} ax="center" size={32} text="Even {m:random, untrained concepts}, given enough of them, can approximate any linear classifier." o={s9thm} />
        <Rich x={960} y={770} ax="center" size={34} weight={700} text="Accurate, and still nothing to read." o={s9line} />
        <EvTag x={1760} y={852} ax="right" kind="reported" text="Theorem 4.1, Srivastava et al. 2024" o={s9thm} />
        <EvTag x={1760} y={900} ax="right" kind="illustrative" text="weights drawn for teaching" o={s9row(0)} />
      </Slide>

      {/* ============================================================ 24.11 a fair comparison: the same budget */}
      <Slide o={sl(11)}>
        <SlideHead text={bh(P, 11)} />
        <Svg>
          {[BUD_A, BUD_B].map((row, i) => {
            const y = BY + i * BRH;
            const nz = i === 0 ? NBUD : Math.round(BUD_B.length - (BUD_B.length - NBUD) * s10cut);
            return (
              <g key={i} opacity={s10rows < 0.999 ? s10rows : undefined}>
                {row.map((v, j) => {
                  const cut = i === 1 && !KEEP_B.includes(j) ? s10cut : 0;
                  const x = BX0 + j * BCW;
                  const val = v === 0 ? 0 : v * (1 - cut);
                  return (
                    <g key={j}>
                      <rect x={x + 3} y={y + 3} width={BCW - 6} height={BCH - 6} rx={6} fill={val > 0.001 ? rgba(FC, 0.14 + 0.4 * val) : C.bg3} />
                      {v !== 0 ? <rect x={x + 2} y={y + 2} width={BCW - 4} height={BCH - 4} rx={7} fill="none" stroke={FC} strokeWidth={2.5} opacity={1 - cut} /> : null}
                      {v === 0 ? <Txt x={x + BCW / 2} y={y + BCH / 2} size={26} mono fill={C.mute}>0</Txt> : (
                        <>
                          <Txt x={x + BCW / 2} y={y + BCH / 2} size={26} mono weight={700} fill={C.chalk} o={1 - inv(0, 0.5, cut)}>{v.toFixed(1)}</Txt>
                          <Txt x={x + BCW / 2} y={y + BCH / 2} size={26} mono fill={C.mute} o={inv(0.5, 1, cut)}>0</Txt>
                        </>
                      )}
                    </g>
                  );
                })}
                <Txt x={BX0 + 12 * BCW + 90} y={y + BCH / 2} size={36} mono weight={700} fill={C.chalk}>{String(nz)}</Txt>
              </g>
            );
          })}
          {/* accuracy at the same budget: bars only */}
          <Txt x={BX0} y={696} size={22} mono weight={600} anchor="start" fill={C.mute} o={s10acc > 0.001 ? 1 : 0}>ACCURACY AT THE SAME BUDGET</Txt>
          {ACC_AB.map((a, i) => (
            <g key={i} opacity={s10acc > 0.001 ? 1 : 0}>
              <rect x={BX0} y={730 + i * 62} width={800} height={40} rx={6} fill={C.bg3} />
              <rect x={BX0} y={730 + i * 62} width={800 * a * s10acc} height={40} rx={6} fill={C.chalk} opacity={i ? 0.6 : 0.92} />
            </g>
          ))}
        </Svg>
        {['model A', 'model B'].map((m, i) => (
          <React.Fragment key={m}>
            <Rich x={BX0 - 22} y={BY + i * BRH + BCH / 2} ax="right" ay="middle" size={28} weight={600} text={m} o={s10rows} />
            <Rich x={BX0 - 22} y={750 + i * 62} ax="right" ay="middle" size={26} color={C.chalk2} text={m} o={s10acc > 0.001 ? 1 : 0} />
          </React.Fragment>
        ))}
        <HText x={BX0 + 12 * BCW + 90} y={BY - 14} ax="center" ay="bottom" size={24} color={C.chalk2} o={s10rows}>non-zero</HText>
        <Rich x={BX0 + 12 * BCW + 90} y={BY + 2 * BRH + 6} ax="center" size={26} weight={600} text="{c:same budget}" o={s10badge} />
        <Rich x={BX0 + 870} y={780} ay="middle" w={460} size={30} text="the gap now says something about the {c:concepts}" o={s10line} />
        <EvTag x={1760} y={900} ax="right" kind="illustrative" text="weights and bars drawn for teaching" o={s10rows} />
      </Slide>

      {/* ============================================================ 24.12 the count in symbols, words first */}
      <Slide o={sl(12)}>
        <SlideHead text={bh(P, 12)} />
        <TexSteps x={960} y={510} t={t} size={60} ax="center" parts={[
          ['\\text{NEC} = ', b(12) + 0.1], ['\\frac{1}{K}\\sum_{k=1}^{K}', w(12, 'averages') - 0.2], ['\\|\\chead{W_{k}}\\|_0', w(12, 'zero') - 0.2],
        ]} />
        <Rich x={NECX[0]} y={420} w={210} ax="center" ay="bottom" size={26} lh={1.2} text="average over the {y:K classes}" o={s12w[2]} />
        <Rich x={NECX[1]} y={420} w={210} ax="center" ay="bottom" size={26} lh={1.2} text="non-zero {f:weights} in row k" o={s12w[1]} />
        <Svg>
          <g opacity={s12row < 0.999 ? s12row : undefined}>
            <rect x={ZX - 6} y={ZY - 6} width={MW[0].length * ZCW + 12} height={ZCH + 12} rx={10} fill={C.headFill} stroke="#8792A2" strokeWidth={2.5} />
            {MW[0].map((v, j) => {
              const nz = v !== 0;
              return (
                <g key={j}>
                  <rect x={ZX + j * ZCW + 3} y={ZY + 3} width={ZCW - 6} height={ZCH - 6} rx={6} fill={nz ? rgba(FC, 0.12 + 0.3 * (v / 1.3)) : C.bg3} />
                  {nz ? <rect x={ZX + j * ZCW + 2} y={ZY + 2} width={ZCW - 4} height={ZCH - 4} rx={7} fill="none" stroke={FC} strokeWidth={3} opacity={s12cnt} /> : null}
                  <Txt x={ZX + j * ZCW + ZCW / 2} y={ZY + ZCH / 2} size={28} mono weight={nz ? 700 : 500} fill={nz ? C.chalk : C.mute}>{nz ? v.toFixed(1) : '0'}</Txt>
                </g>
              );
            })}
          </g>
        </Svg>
        <Rich x={ZX - 24} y={ZY + ZCH / 2} ax="right" ay="middle" size={28} weight={600} text="Herring Gull" o={s12row} />
        <Tex x={ZX + MW[0].length * ZCW + 40} y={ZY + ZCH / 2} size={48} tex={`\\|\\chead{W_{\\text{Herring}}}\\|_0 = ${NNZ[0]}`} o={s12cnt} />
        <Rich x={960} y={800} ax="center" size={30} color={C.chalk2} text="$\|\cdot\|_0$ counts the entries that are not zero" o={s12cnt} />
        <EvTag x={1760} y={900} ax="right" kind="illustrative" text="weights drawn for teaching (the row from the count slide)" o={s12row} />
      </Slide>

      {/* ============================================================ 24.13 NEC held at five */}
      <Slide o={sl(13)}>
        <SlideHead text={bh(P, 13)} />
        <Tex x={990} y={380} ax="right" size={60} tex="\text{NEC} =" o={s8eq} />
        <Tex x={1010} y={380} ax="left" size={60} tex="5" o={s8five} />
        <Svg>
          <g opacity={s8row < 0.999 ? s8row : undefined}>
            <rect x={HX - 6} y={HY - 6} width={HROW.length * HCW + 12} height={HCH + 12} rx={10} fill={C.headFill} stroke="#8792A2" strokeWidth={2.5} />
            {HROW.map((v, j) => {
              const nz = v !== 0;
              return (
                <g key={j}>
                  <rect x={HX + j * HCW + 3} y={HY + 3} width={HCW - 6} height={HCH - 6} rx={6} fill={nz ? rgba(FC, 0.12 + 0.3 * (v / 1.3)) : C.bg3} />
                  <Txt x={HX + j * HCW + HCW / 2} y={HY + HCH / 2} size={30} mono weight={nz ? 700 : 500} fill={nz ? C.chalk : C.mute}>{nz ? v.toFixed(1) : '0'}</Txt>
                </g>
              );
            })}
          </g>
          {HNZ.map((j, i) => (
            <g key={j} opacity={s8read(i)}>
              <path d={`M ${HX + j * HCW + HCW / 2} ${HY + HCH + 8} L ${chipX[i]} ${742}`} stroke={C.concept} strokeWidth={2} opacity={0.6} />
              <Pill x={chipX[i]} y={770} text={HNAMES[i]} color={C.concept} size={26} anchorX="middle" />
            </g>
          ))}
        </Svg>
        <Rich x={HX - 24} y={HY + HCH / 2} ax="right" ay="middle" size={28} weight={600} text="Herring Gull" o={s8row} />
        <Rich x={960} y={850} ax="center" size={30} color={C.chalk2} text="each class: a handful of named {c:concepts}" o={s8cmp} />
        <EvTag x={1760} y={900} ax="right" kind="illustrative" text="weights drawn for teaching" o={s8row} />
      </Slide>

      {/* ============================================================ 24.14 recap: what changed compared with label-free models */}
      <Slide o={sl(14)}>
        <SlideHead text={bh(P, 14)} />
        <Rich x={980} y={360} ax="center" size={30} weight={700} color={C.chalk2} text="label-free models" o={s14h} />
        <Rich x={1460} y={360} ax="center" size={30} weight={700} text="VLG-CBM" o={s14h} />
        <Svg o={s14h}>
          <line x1={200} x2={1720} y1={400} y2={400} stroke={C.line2} strokeWidth={2} />
        </Svg>
        {RECAP.map((r, i) => {
          const y = 490 + i * 150;
          return (
            <React.Fragment key={r.lab}>
              <Rich x={200} y={y} ay="middle" w={500} size={30} color={C.chalk2} text={r.lab} o={s14r[i]} />
              <Rich x={980} y={y} ax="center" ay="middle" size={32} color={C.chalk2} text={r.lf} o={s14r[i]} />
              <Rich x={1210} y={y} ax="center" ay="middle" size={36} color={C.mute} text="→" o={s14vlg[i]} />
              <Rich x={1460} y={y} ax="center" ay="middle" size={34} weight={700} text={r.vlg} o={s14vlg[i]} />
            </React.Fragment>
          );
        })}
      </Slide>

      {/* ============================================================ 24.15 the card */}
      <Slide o={sl(15)}>
        <SlideHead text={bh(P, 15)} />
        <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.92)', transformOrigin: '960px 270px' }}>
          <VariantCard name="VLG-CBM (Srivastava et al., NeurIPS 2024)" rows={VROWS} p={cardP} y0={270} />
        </div>
      </Slide>
    </Stage>
  );
};
