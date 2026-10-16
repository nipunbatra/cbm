// s25 Part 10 · Classification by description (Menon and Vondrick, ICLR 2023). Revision 2: one idea per slide.
// Real numbers from D.cub.cbd (CLIP ViT-B/32 on our gull photo with Menon et al.'s released CUB descriptors).
// 25.1 the supervision ladder, last rung lit; title.
// 25.2 intuition: three checklists (real descriptors, illustrative soft ticks), the best average wins.
// 25.3 the Herring Gull descriptors as a JSON card; "descriptor" defined in one line.
// 25.4 the scoring rule in words (photo -> descriptor scores = soft ticks -> average).
// 25.5 one descriptor score: phi(x) and psi(d) as two unit vectors (illustrative), cos worked out = sum of products.
// 25.6 the class score in symbols, words first; D_k defined.
// 25.7 our gull: per-descriptor cosines for Herring Gull and their average, the sum written out.
// 25.8 the five class averages as one compact line; the winner's (Slaty-backed Gull) and Herring Gull's descriptor bars; near miss.
// 25.9 when it is attractive: no labelled images; a new class needs only a new checklist (Ivory Gull, real descriptors).
// 25.10 the wrong California Gull descriptor.
// 25.11 a match score is not a fact check: our photo + a mismatched phrase still feed the class average.
// 25.12 recap: what changed compared with the rung-two phrase example.  25.13 VariantCard + the cost line.
import React from 'react';
import modernSections from '../modernSections.json';
import { C, F } from '../kit/theme';
import { E, Header, HText, Rich, SlideHead, Stage, Svg, Tex, Txt, bs, bw, bh, inv, type SceneProps } from '../kit/core';
import { ArchMap, Block, Credit, CREDIT, Cross, EvTag, Flow, MathSvg, PhotoR, Pill, VariantCard, rgba, type Rect, type VariantRows } from '../kit/cbm';
import { D } from '../kit/data';
import { TexSteps } from '../kit/slots';

const CBD = D.cub.cbd;
const HG = CBD.gull_photo.per_species['Herring Gull'];
const HDESC: string[] = HG.descriptors;
const HCOS: number[] = HG.cos;
const HSCORE: number = HG.score;
const TOP: [string, number][] = CBD.gull_photo.top;
const WINNER: string = TOP[0][0];
const WG = CBD.gull_photo.per_species[WINNER]; // the winner's descriptors and cosines (Slaty-backed Gull)
const shortName = (s: string) => s.replace(/ Gull$/, '');
const GAP = TOP[0][1] - (TOP.find((r) => r[0] === 'Herring Gull') as [string, number])[1];
const CAL: string = CBD.gull_descriptors['California Gull'][0];
const NCAL: number = CBD.gull_descriptors['California Gull'].length;

// 25.2 the checklist intuition: real descriptors from the released file, illustrative soft ticks
const CHECK: { name: string; items: string[]; ticks: number[] }[] = [
  { name: 'Herring Gull', idx: [1, 2, 3], ticks: [0.9, 0.8, 0.7] },
  { name: 'Ivory Gull', idx: [0, 2, 3], ticks: [0.8, 0.2, 0.3] },
  { name: 'Ring-billed Gull', idx: [4, 5, 2], ticks: [0.2, 0.6, 0.4] },
].map((c) => ({ name: c.name, items: c.idx.map((i) => CBD.gull_descriptors[c.name][i] as string), ticks: c.ticks }));
const CAVG = CHECK.map((c) => c.ticks.reduce((s, v) => s + v, 0) / c.ticks.length);
const CWIN = CAVG.indexOf(Math.max(...CAVG));
// 25.9 a new class: its descriptors from the released file
const NEWC = 'Ivory Gull';
const NEWD: string[] = CBD.gull_descriptors[NEWC];
// 25.11 the risks: the wrong California Gull item still gets a CLIP score on our photo (computed)
const CALS = CBD.gull_photo.per_species['California Gull'];
const CAL_COS: number = CALS.cos[0];

// 25.5 two unit vectors (illustrative): phi(x) and psi(d)
const VPHI: [number, number] = [0.6, 0.8], VPSI: [number, number] = [0.8, 0.6];
const VO: [number, number] = [300, 830], VL = 420;
const vtip = (v: [number, number]): [number, number] => [VO[0] + v[0] * VL, VO[1] - v[1] * VL];
const arc = (r: number) => {
  const a0 = Math.atan2(VPSI[1], VPSI[0]), a1 = Math.atan2(VPHI[1], VPHI[0]);
  return `M ${VO[0] + r * Math.cos(a0)} ${VO[1] - r * Math.sin(a0)} A ${r} ${r} 0 0 0 ${VO[0] + r * Math.cos(a1)} ${VO[1] - r * Math.sin(a1)}`;
};

// cosine axis window for the bars (bars start at AX0, not at zero)
const AX0 = 0.3, AX1 = 0.35;
const ax = (v: number) => (v - AX0) / (AX1 - AX0);

const Slide: React.FC<{ o: number; children?: React.ReactNode }> = ({ o, children }) =>
  o <= 0.001 ? null : <div style={{ position: 'absolute', inset: 0, opacity: o < 0.999 ? o : undefined }}>{children}</div>;

const VROWS: VariantRows = {
  g: '\\text{CLIP: image encoder } \\cin{\\phi},\\ \\text{text encoder } \\psi',
  c: '\\ch_d = \\cos\\big(\\cin{\\phi(x)},\\ \\psi(d)\\big),\\ \\ d \\in D_k',
  f: '\\yh_k = \\tfrac{1}{|D_k|}\\textstyle\\sum_{d \\in D_k} \\ch_d\\ \\ \\text{(fixed)}',
  train: '\\text{nothing}',
  data: '\\text{none: a language model writes the descriptors } D_k',
};

// 25.12 recap rows: rung two vs classification by description
const RECAP: { lab: string; rungTwo: string; cbd: string }[] = [
  { lab: 'the {f:task head}', rungTwo: 'a linear layer', cbd: 'a fixed average' },
  { lab: 'what is trained', rungTwo: 'the {f:head}', cbd: 'nothing' },
  { lab: 'data needed', rungTwo: 'images and {y:class labels}', cbd: 'none' },
];

// the ladder strip
const RUNGS: { tex: string; who: string; x: number; w: number; mx: number }[] = [
  { tex: '\\{\\cin{x},\\ \\ccon{c},\\ y\\}', who: 'CBM, CEM', x: 200, w: 340, mx: 80 },
  { tex: '\\{\\cin{x},\\ y\\}', who: 'PCBM', x: 610, w: 560, mx: 66 },
  { tex: '\\varnothing', who: 'by description', x: 1240, w: 480, mx: 50 },
];

// JSON card (HTML): keys chalk2, strings teal
const JsonCard: React.FC<{ x: number; y: number; w: number; name: string; items: string[]; n: number; o?: number; size?: number; hi?: (i: number) => number; more?: boolean }> = ({
  x, y, w, name, items, n, o = 1, size = 28, hi, more,
}) => {
  if (o <= 0.001) return null;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, opacity: o, fontFamily: F.mono, fontSize: size, lineHeight: 1.55, color: C.mute,
      background: C.bg2, border: `1.5px solid ${C.line2}`, borderRadius: 12, padding: '16px 26px', boxSizing: 'border-box', whiteSpace: 'pre',
    }}>
      <div>{'{ '}<span style={{ color: C.chalk2 }}>{`"${name}"`}</span>{': ['}</div>
      {items.map((s, i) => {
        const h = hi ? hi(i) : 0;
        return (
          <div key={i} style={{ opacity: i < n ? 1 : 0, background: h > 0.001 ? rgba(C.concept, 0.16 * h) : undefined, borderRadius: 6 }}>
            {'    '}<span style={{ color: C.concept }}>{`"${s}"`}</span>{i < items.length - 1 || more ? ',' : ''}
          </div>
        );
      })}
      {more ? <div style={{ opacity: n >= items.length ? 1 : 0 }}>{'    ...'}</div> : null}
      <div style={{ opacity: n >= items.length ? 1 : 0 }}>{']}'}</div>
    </div>
  );
};

export const S25: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.4) => inv(x, x + d, t);
  const NB = P.beats.length;
  const sl = (k: number) => inv(b(k) - 0.05, b(k) + 0.25, t) * (k < NB ? 1 - inv(b(k + 1) - 0.35, b(k + 1) - 0.05, t) : 1);

  // ---------------- 25.1
  const rungIn = (i: number) => at(b(1) + 0.2 + i * 0.35);
  const lastLit = at(w(1, 'last') - 0.1, 0.5);
  const s1t = at(w(1, 'Menon') - 0.2, 0.5), s1n = at(w(1, 'removes') - 0.1, 0.5);
  // ---------------- 25.2 intuition: checklists and soft ticks
  const s2cards = (i: number) => at(w(2, 'checklist', 1) - 0.3 + i * 0.25, 0.4);
  const s2tick = (i: number, j: number) => E.out(at(w(2, 'ticks') - 0.1 + i * 0.35 + j * 0.12, 0.5));
  const s2val = at(w(2, 'score') - 0.2, 0.5), s2avg = E.out(at(w(2, 'best') - 0.2, 0.6)), s2win = at(w(2, 'wins') - 0.2, 0.5);
  // ---------------- 25.3
  const s2lm = at(w(3, 'language') - 0.2), s2card = at(w(3, 'For', 1) - 0.2), s3def = at(w(3, 'short') - 0.2, 0.5);
  const nLines = Math.floor(Math.max(0, (t - w(3, 'herring') + 0.2) * 4));
  const spoken = [-1, w(3, 'white'), w(3, 'yellow'), w(3, 'red'), -1];
  const hiLine = (i: number) => (spoken[i] < 0 ? 0 : at(spoken[i] - 0.2, 0.3));
  // ---------------- 25.4
  const s3ph = at(b(4) + 0.05), s3fan = at(w(4, 'descriptor') - 0.2, 0.5), live3 = s3fan;
  const s3soft = at(w(4, 'soft') - 0.2, 0.5);
  const s3avg = at(w(4, 'average') - 0.2, 0.5), s3win = at(w(4, 'highest') - 0.2, 0.5);
  // ---------------- 25.5 one descriptor score: a cosine
  const s5ax = at(w(5, 'encoders') - 0.2, 0.5), s5phi = E.out(at(w(5, 'phi') - 0.2, 0.6)), s5psi = E.out(at(w(5, 'psi') - 0.2, 0.6));
  const s5cos = at(w(5, 'cosine') - 0.2, 0.5), s5work = at(w(5, 'cosine') + 0.7, 0.5), s5near = at(w(5, 'near') - 0.2, 0.5);
  // ---------------- 25.6 the class score averages
  const s4w = [at(w(6, 'y') - 0.1), at(w(6, 'averages') - 0.1), at(w(6, 'descriptor') - 0.1)];
  const s4dk = at(w(6, 'list') + 0.2, 0.5), s4fit = at(w(6, 'Nothing') - 0.2);
  // ---------------- 25.7
  const s5ph = at(b(7) + 0.05);
  const s5bar = (i: number) => E.out(at(w(7, 'descriptor') - 0.1 + i * 0.18, 0.6));
  const s5avg = E.out(at(w(7, 'average', 1) - 0.2, 0.6)), s5sum = at(w(7, 'between') - 0.2, 0.5);
  // ---------------- 25.8
  const s6line = at(b(8) + 0.05, 0.4);
  const s6hg = (i: number) => E.out(at(b(8) + 0.1 + i * 0.06, 0.5)); // Herring Gull: just seen, comes back at once
  const s6sb = (i: number) => E.out(at(w(8, 'slaty') - 0.1 + i * 0.12, 0.6));
  const s6win = at(w(8, 'edges') - 0.2, 0.5), s6gap = at(w(8, 'tiny') - 0.2, 0.5), s6miss = at(w(8, 'photo') - 0.2, 0.5);
  // ---------------- 25.9 when it is attractive
  const s9none = at(w(9, 'no') - 0.2, 0.5), s9x = at(w(9, 'labelled') - 0.1, 0.6);
  const s9list = at(w(9, 'new') - 0.3, 0.5), s9new = at(w(9, 'write') - 0.2, 0.5);
  const s9lines = Math.floor(Math.max(0, (t - w(9, 'write')) * 5));
  const s9score = at(w(9, 'scored') - 0.2, 0.5), s9retrain = at(w(9, 'retraining') - 0.3, 0.5);
  // ---------------- 25.10
  const s8card = at(w(10, 'California') - 0.4, 0.5), s8x = E.out(at(w(10, 'does') - 0.1, 0.6)), s8w = at(w(10, 'wrong') - 0.2);
  // ---------------- 25.11 follow one mismatched phrase through the scoring rule
  const s11photo = at(b(11) + 0.1, 0.5), s11phrase = at(w(11, 'California') - 0.2, 0.5);
  const s11score = at(w(11, 'CLIP') - 0.2, 0.5), s11meaning = at(w(11, 'probability') - 0.2, 0.5);
  const s11average = at(w(11, 'fixed') - 0.2, 0.5), s11checks = at(w(11, 'takeaway') - 0.2, 0.5);
  // ---------------- 25.12 recap: compared with the rung-two phrase example
  const s13h = at(b(12) + 0.1, 0.5);
  const s13r = [at(w(12, 'head') - 0.2, 0.5), at(w(12, 'nothing') - 0.2, 0.5), at(w(12, 'labelled') - 0.2, 0.5)];
  const s13cbd = [at(w(12, 'fixed') - 0.2, 0.5), at(w(12, 'nothing') + 0.2, 0.5), at(w(12, 'needed') - 0.2, 0.5)];
  // ---------------- 25.13
  const cardP = [w(13, 'g'), w(13, 'hat'), w(13, 'f'), w(13, 'data') - 0.6, w(13, 'data')].reduce((s, x) => s + inv(x - 0.1, x + 0.4, t), 0) / 5;
  const s9cost = at(w(13, 'cost') - 0.2, 0.5);

  // layouts
  const PH3: Rect = { x: 200, y: 360, w: 380, h: 380 };
  const D3X = 760, D3Y = 380, D3H = 72;
  const PH5: Rect = { x: 200, y: 360, w: 340, h: 340 };
  const BX = 700, BW = 600, R0 = 360, RH = 92;
  const COL6 = [{ x: 160, sp: WG, name: WINNER, win: true, p: s6sb }, { x: 1010, sp: HG, name: 'Herring Gull', win: false, p: s6hg }];
  const C6W = 520, C6T = 380, C6R0 = 448, C6RH = 64; // column bar width, title row, first descriptor row, row pitch
  const AVX = [728, 985, 1215]; // 25.6 word labels over the terms
  const PH2: Rect = { x: 170, y: 440, w: 190, h: 190 }; // 25.2 photo
  const K2X = 400, K2Y = 320, K2W = 440, K2G = 20, K2H = 450; // 25.2 checklist cards
  const PH11: Rect = { x: 160, y: 355, w: 350, h: 350 };

  return (
    <Stage>
      <Header t={t} part={modernSections.s25.part} title={P.title} />
      <ArchMap on={['c', 'f']} o={inv(0, 0.5, t)} />

      {/* ============================================================ 25.1 the last rung */}
      <Slide o={sl(1)}>
        <SlideHead text={bh(P, 1)} />
        <Svg>
          <Txt x={200} y={392} size={24} anchor="start" weight={600} fill={C.mute} mono o={rungIn(0)}>DATA EACH VARIANT NEEDS</Txt>
          {RUNGS.map((r, i) => {
            const lit = i === 2 ? lastLit : 0;
            const y = 470, h = 76;
            return (
              <g key={i} opacity={rungIn(i)}>
                {i > 0 ? <Flow pts={[[r.x - 62, y], [r.x - 8, y]]} color={C.line2} sw={2.5} head={12} /> : null}
                <rect x={r.x} y={y - h / 2} width={r.w} height={h} rx={h / 2} fill={rgba(C.chalk, 0.03 + 0.1 * lit)} stroke={lit > 0.5 ? C.chalk : C.line2} strokeWidth={1.5 + 1.5 * lit} />
                <MathSvg x={r.x + r.mx} y={y} tex={r.tex} size={34} color={C.chalk} />
                <Txt x={r.x + r.mx * 2 + 6} y={y} size={26} anchor="start" weight={lit > 0.5 ? 700 : 500} fill={lit > 0.5 ? C.chalk : C.chalk2}>{r.who}</Txt>
              </g>
            );
          })}
        </Svg>
        <HText x={960} y={640} ax="center" ay="middle" size={60} weight={700} o={s1t}>Classification by description (CBD)</HText>
        <HText x={960} y={720} ax="center" size={30} color={C.chalk2} o={s1t}>Menon and Vondrick, ICLR 2023</HText>
        <Rich x={960} y={820} ax="center" size={32} text="no task {c:concept labels}, no task {y:class labels}, no fitting" o={s1n} />
      </Slide>

      {/* ============================================================ 25.2 intuition: a checklist per class, soft ticks */}
      <Slide o={sl(2)}>
        <SlideHead text={bh(P, 2)} />
        <Rich x={PH2.x + PH2.w / 2} y={PH2.y - 50} ax="center" size={28} text="{x:photo}" o={s2cards(0)} />
        <PhotoR R={PH2} src="gull.jpg" o={s2cards(0)} />
        <Credit x={170} y={905} text={CREDIT['gull.jpg']} o={s2cards(0)} />
        <Svg>
          {CHECK.map((c, i) => {
            const x = K2X + i * (K2W + K2G), o = s2cards(i), win = i === CWIN ? s2win : 0;
            return (
              <g key={c.name} opacity={o < 0.999 ? o : undefined}>
                <rect x={x} y={K2Y} width={K2W} height={K2H} rx={14} fill={rgba(C.chalk, 0.03 + 0.05 * win)} stroke={win > 0.5 ? C.chalk : C.line2} strokeWidth={1.5 + 1.5 * win} />
                <Txt x={x + 24} y={K2Y + 42} size={28} anchor="start" weight={700} fill={C.chalk}>{c.name}</Txt>
                {c.items.map((_, j) => {
                  const y = K2Y + 110 + j * 84, tk = s2tick(i, j), v = c.ticks[j];
                  return (
                    <g key={j}>
                      <rect x={x + 22} y={y - 18} width={36} height={36} rx={6} fill={rgba(C.concept, 0.85 * v * tk)} stroke={C.chalk2} strokeWidth={2} />
                      <path d={`M ${x + 30} ${y} L ${x + 38} ${y + 9} L ${x + 52} ${y - 9}`} fill="none" stroke={C.chalk} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" opacity={v * tk} />
                      <Txt x={x + K2W - 22} y={y} size={24} anchor="end" mono weight={600} fill={C.concept} o={s2val}>{v.toFixed(1)}</Txt>
                    </g>
                  );
                })}
                <line x1={x + 22} x2={x + K2W - 22} y1={K2Y + K2H - 76} y2={K2Y + K2H - 76} stroke={C.line} strokeWidth={1.5} opacity={s2avg} />
                <g opacity={s2avg < 0.999 ? s2avg : undefined}>
                  <Txt x={x + 24} y={K2Y + K2H - 38} size={24} anchor="start" fill={C.chalk2}>average</Txt>
                  <rect x={x + 130} y={K2Y + K2H - 50} width={200} height={24} rx={4} fill={C.bg3} />
                  <rect x={x + 130} y={K2Y + K2H - 50} width={200 * CAVG[i] * s2avg} height={24} rx={4} fill={C.chalk} opacity={i === CWIN ? 0.95 : 0.55} />
                  <Txt x={x + K2W - 22} y={K2Y + K2H - 38} size={26} anchor="end" mono weight={700} fill={C.chalk}>{CAVG[i].toFixed(2)}</Txt>
                </g>
              </g>
            );
          })}
        </Svg>
        {CHECK.map((c, i) => c.items.map((d, j) => (
          <HText key={`${i}.${j}`} x={K2X + i * (K2W + K2G) + 72} y={K2Y + 110 + j * 84} ay="middle" w={K2W - 150} size={24} lh={1.15} color={C.chalk} o={s2cards(i)}>{d}</HText>
        )))}
        <Rich x={K2X + CWIN * (K2W + K2G) + K2W / 2} y={K2Y + K2H + 22} ax="center" size={30} text="best average: {y:wins}" o={s2win} />
        <EvTag x={1760} y={900} ax="right" kind="illustrative" text="real descriptors; tick strengths drawn for teaching" o={s2val} />
      </Slide>

      {/* ============================================================ 25.3 descriptors */}
      <Slide o={sl(3)}>
        <SlideHead text={bh(P, 3)} />
        <Svg>
          <Block x={330} y={520} w={260} h={110} kind="neutral" title="language model" sub="writes descriptors" size={28} o={s2lm} />
          <Flow pts={[[462, 520], [540, 520]]} color={C.concept} sw={3} head={12} p={s2card} />
        </Svg>
        <JsonCard x={560} y={350} w={1180} name="Herring Gull" items={HDESC} n={nLines} o={s2card} hi={hiLine} />
        <Rich x={560} y={740} size={30} color={C.chalk2} text="descriptor: a short phrase about what the {y:class} looks like" o={s3def} />
        <EvTag x={1760} y={880} ax="right" kind="data" text="Menon and Vondrick's released CUB descriptors" o={s2card} />
      </Slide>

      {/* ============================================================ 25.4 the rule in words */}
      <Slide o={sl(4)}>
        <SlideHead text={bh(P, 4)} />
        <PhotoR R={PH3} src="gull.jpg" o={s3ph} />
        <Credit x={PH3.x} y={PH3.y + PH3.h + 8} text={CREDIT['gull.jpg']} o={s3ph} />
        <Svg>
          {HDESC.map((d, i) => {
            const y = D3Y + i * D3H;
            return (
              <g key={i} opacity={s3fan < 0.999 ? s3fan : undefined}>
                <Flow pts={[[PH3.x + PH3.w + 10, PH3.y + PH3.h / 2], [D3X - 14, y]]} color={C.input} sw={2.5} head={10} t={t + i * 0.3} live={live3} n={1} dotR={5} speed={0.25} />
                <Txt x={D3X} y={y} size={28} anchor="start" fill={C.concept}>{d}</Txt>
              </g>
            );
          })}
          <path d={`M 1500 ${D3Y - 26} q 18 0 18 18 L 1518 ${D3Y + 2 * D3H - 12} l 14 12 l -14 12 L 1518 ${D3Y + 4 * D3H + 8} q 0 18 -18 18`}
            fill="none" stroke={C.chalk2} strokeWidth={3} opacity={s3avg} />
        </Svg>
        <Rich x={D3X} y={D3Y - 74} size={28} color={C.chalk2} text="each score: a {c:soft tick}" o={s3soft} />
        <Rich x={1550} y={D3Y + 2 * D3H} ay="middle" w={210} size={30} lh={1.3} text="{y:class score}: the average" o={s3avg} />
        <Rich x={D3X} y={790} size={32} text="The {y:highest average} wins." o={s3win} />
      </Slide>

      {/* ============================================================ 25.5 one descriptor score: a cosine (illustrative 2-entry vectors) */}
      <Slide o={sl(5)}>
        <SlideHead text={bh(P, 5)} />
        <Svg>
          <g opacity={s5ax < 0.999 ? s5ax : undefined}>
            <line x1={VO[0] - 20} x2={VO[0] + VL + 40} y1={VO[1]} y2={VO[1]} stroke={C.line2} strokeWidth={2} />
            <line x1={VO[0]} x2={VO[0]} y1={VO[1] + 20} y2={VO[1] - VL - 40} stroke={C.line2} strokeWidth={2} />
          </g>
          <Flow pts={[VO, vtip(VPHI)]} color={C.input} sw={5} head={18} p={s5phi} />
          <Flow pts={[VO, vtip(VPSI)]} color={C.chalk2} sw={5} head={18} p={s5psi} />
          <path d={arc(150)} fill="none" stroke={C.concept} strokeWidth={3} opacity={s5cos} />
          <MathSvg x={vtip(VPHI)[0] - 10} y={vtip(VPHI)[1] - 40} tex="\cin{\phi(x)}" size={40} o={s5phi} />
          <Txt x={vtip(VPHI)[0] - 10} y={vtip(VPHI)[1] - 84} size={26} fill={C.input} o={s5phi}>image</Txt>
          <MathSvg x={vtip(VPSI)[0] + 76} y={vtip(VPSI)[1] + 4} tex="\psi(d)" size={40} o={s5psi} />
          <Txt x={vtip(VPSI)[0] + 76} y={vtip(VPSI)[1] - 40} size={26} fill={C.chalk2} o={s5psi}>descriptor</Txt>
        </Svg>
        <Tex x={880} y={420} size={52} tex="\ccon{\ch_d} = \cos\big(\cin{\phi(x)},\ \psi(d)\big)" o={s5cos} />
        <TexSteps x={1010} y={520} t={t} size={48} parts={[
          ['= \\cin{0.6} \\times 0.8 + \\cin{0.8} \\times 0.6', w(5, 'cosine') + 0.7],
          ['\\ = \\ccon{' + (VPHI[0] * VPSI[0] + VPHI[1] * VPSI[1]).toFixed(2) + '}', w(5, 'cosine') + 1.4],
        ]} />
        <Rich x={880} y={610} w={880} size={28} color={C.chalk2} text="both vectors have length 1, so the cosine is the sum of products" o={s5work} />
        <Rich x={880} y={700} w={880} size={30} text="near 1: they point the same way; smaller: they point apart" o={s5near} />
        <Rich x={VO[0] + 60} y={VO[1] + 30} size={26} color={C.mute} text="entries (0.6, 0.8) and (0.8, 0.6)" o={s5work} />
        <EvTag x={1760} y={900} ax="right" kind="illustrative" text="two-entry vectors for teaching; CLIP's have 512 entries" o={s5phi} />
      </Slide>

      {/* ============================================================ 25.6 the class score averages its descriptor scores */}
      <Slide o={sl(6)}>
        <SlideHead text={bh(P, 6)} />
        <TexSteps x={960} y={540} t={t} size={60} ax="center" parts={[
          ['\\yh_k = ', w(6, 'y') - 0.1], ['\\dfrac{1}{|D_k|}\\displaystyle\\sum_{d \\in D_k}\\,', w(6, 'averages') - 0.1], ['\\ccon{\\ch_d}', w(6, 'descriptor') - 0.1],
        ]} />
        {[
          { cx: AVX[0], word: '{y:class score}', o: s4w[0] },
          { cx: AVX[1], word: "average over the class's descriptors", o: s4w[1] },
          { cx: AVX[2], word: '{c:descriptor score}', o: s4w[2] },
        ].map((p, i) => <Rich key={i} x={p.cx} y={400} w={i === 1 ? 230 : 170} ax="center" ay="bottom" size={28} lh={1.2} text={p.word} o={p.o} />)}
        <Rich x={960} y={700} ax="center" size={30} color={C.chalk2} text="$D_k$: the list of descriptors of class k, and $|D_k|$ how many there are" o={s4dk} />
        <Rich x={960} y={780} ax="center" size={32} text="Nothing is fitted to the target data." o={s4fit} />
      </Slide>

      {/* ============================================================ 25.7 our gull, Herring Gull descriptor scores */}
      <Slide o={sl(7)}>
        <SlideHead text={bh(P, 7)} />
        <PhotoR R={PH5} src="gull.jpg" o={s5ph} />
        <Credit x={PH5.x} y={905} text={CREDIT['gull.jpg']} o={s5ph} />
        <Svg>
          {HDESC.map((d, i) => {
            const y = R0 + i * RH;
            const p = s5bar(i);
            return (
              <g key={i} opacity={inv(0, 0.3, p)}>
                <Txt x={BX} y={y} size={26} anchor="start" fill={C.chalk}>{d}</Txt>
                <rect x={BX} y={y + 22} width={BW} height={26} rx={4} fill={C.bg3} />
                <rect x={BX} y={y + 22} width={BW * ax(HCOS[i]) * p} height={26} rx={4} fill={C.concept} opacity={0.9} />
                <Txt x={BX + BW + 20} y={y + 35} size={28} anchor="start" mono weight={600} fill={C.concept} o={inv(0.4, 1, p)}>{HCOS[i].toFixed(3)}</Txt>
              </g>
            );
          })}
          <g opacity={s5avg < 0.999 ? s5avg : undefined}>
            <line x1={BX + BW * ax(HSCORE)} x2={BX + BW * ax(HSCORE)} y1={R0 + 12} y2={R0 + 4 * RH + 58} stroke={C.chalk} strokeWidth={3} strokeDasharray="7 6" />
          </g>
        </Svg>
        <Tex x={960} y={R0 + 4 * RH + 118} ax="center" size={34} o={s5avg}
          tex={`\\yh_{\\text{Herring}} = \\tfrac{1}{${HCOS.length}}\\big(${HCOS.map((v) => `\\ccon{${v.toFixed(3)}}`).join(' + ')}\\big) = ${HSCORE.toFixed(3)}`} />
        <HText x={PH5.x} y={PH5.y + PH5.h + 20} size={24} color={C.mute} o={s5sum}>bars start at 0.30</HText>
        <EvTag x={1760} y={900} ax="right" kind="computed" text="CLIP ViT-B/32 on our gull photo, released CUB descriptors" o={s5bar(0)} />
      </Slide>

      {/* ============================================================ 25.8 the winner's reasons beside Herring Gull's */}
      <Slide o={sl(8)}>
        <SlideHead text={bh(P, 8)} />
        <Rich x={960} y={292} ax="center" size={26} color={C.chalk2} o={s6line}
          text={`{y:class scores}: ${TOP.map(([n, v], i) => (i === 0 ? `{y:${shortName(n)} ${v.toFixed(3)}}` : `${shortName(n)} ${v.toFixed(3)}`)).join(' · ')}`} />
        <Svg>
          {COL6.map((c) => {
            const desc: string[] = c.sp.descriptors, cos: number[] = c.sp.cos, sc: number = c.sp.score;
            const p0 = c.p(0), last = c.p(desc.length - 1);
            const xa = c.x + C6W * ax(sc);
            return (
              <g key={c.name}>
                {c.win && s6win > 0.001 ? <rect x={c.x - 18} y={C6T - 34} width={C6W + 130} height={68} rx={10} fill={rgba(C.chalk, 0.06 * s6win)} stroke={rgba(C.chalk, 0.75 * s6win)} strokeWidth={2.5} /> : null}
                <g opacity={inv(0, 0.3, p0)}>
                  <Txt x={c.x} y={C6T} size={32} anchor="start" weight={700} fill={C.chalk}>{c.name}</Txt>
                  <Txt x={c.x + C6W + 100} y={C6T} size={28} anchor="end" mono weight={c.win ? 700 : 500} fill={c.win ? C.chalk : C.chalk2}>{sc.toFixed(3)}</Txt>
                </g>
                {desc.map((d, i) => {
                  const y = C6R0 + i * C6RH, p = c.p(i);
                  return (
                    <g key={i} opacity={inv(0, 0.3, p)}>
                      <Txt x={c.x} y={y} size={24} anchor="start" fill={C.chalk}>{d}</Txt>
                      <rect x={c.x} y={y + 18} width={C6W} height={20} rx={4} fill={C.bg3} />
                      <rect x={c.x} y={y + 18} width={C6W * ax(cos[i]) * p} height={20} rx={4} fill={C.concept} opacity={0.9} />
                      <Txt x={c.x + C6W + 16} y={y + 28} size={24} anchor="start" mono weight={600} fill={C.concept} o={inv(0.4, 1, p)}>{cos[i].toFixed(3)}</Txt>
                    </g>
                  );
                })}
                {/* the class average: a dashed tick across every bar (kept off the descriptor text) */}
                {desc.map((_, i) => (
                  <line key={i} x1={xa} x2={xa} y1={C6R0 + i * C6RH + 12} y2={C6R0 + i * C6RH + 44} stroke={C.chalk} strokeWidth={3} strokeDasharray="5 4" opacity={inv(0.5, 1, last)} />
                ))}
              </g>
            );
          })}
        </Svg>
        <Rich x={160} y={C6R0 + 6 * C6RH + 4} size={32} text={`{y:${WINNER}} edges ahead by ${GAP.toFixed(3)}`} o={s6gap} />
        <HText x={1010} y={C6R0 + 6 * C6RH + 8} size={24} color={C.mute} o={s6hg(0)}>bars start at 0.30; dashed line: the average</HText>
        <Rich x={160} y={C6R0 + 6 * C6RH + 54} size={28} color={C.chalk2} text="Our photo shows a {y:herring gull}: a near miss." o={s6miss} />
        <EvTag x={1760} y={900} ax="right" kind="computed" text="CLIP ViT-B/32 on our gull photo, released CUB descriptors" o={s6hg(0)} />
      </Slide>

      {/* ============================================================ 25.9 when it is attractive */}
      <Slide o={sl(9)}>
        <SlideHead text={bh(P, 9)} />
        {[2, 1, 0].map((k) => (
          <PhotoR key={k} R={{ x: 220 + k * 34, y: 360 + k * 34, w: 300, h: 300 }} src="gull.jpg" o={s9none} shadow={k === 0} />
        ))}
        <Credit x={220} y={905} text={CREDIT['gull.jpg']} o={s9none} />
        <Svg>
          <Pill x={234} y={624} text="label: Herring Gull" color={C.chalk2} size={22} o={s9none} />
          <Cross x={210} y={350} w={400} h={400} p={s9x} />
        </Svg>
        <Rich x={415} y={790} ax="center" size={32} text="no {y:labelled images}" o={s9x} />
        <Rich x={860} y={340} size={26} color={C.chalk2} text={`classes we already score: ${TOP.slice(0, 3).map(([n]) => shortName(n)).join(', ')}, ...`} o={s9list} />
        <Rich x={860} y={392} size={28} weight={700} text="+ one more class" o={s9new} />
        <JsonCard x={860} y={440} w={880} name={NEWC} items={NEWD} n={s9lines} o={s9new} size={26} />
        <Rich x={860} y={780} size={32} text="its {c:checklist} is scored at once" o={s9score} />
        <Rich x={860} y={834} size={32} weight={700} text="no retraining" o={s9retrain} />
        <EvTag x={1760} y={900} ax="right" kind="data" text="Menon and Vondrick's released CUB descriptors" o={s9new} />
      </Slide>

      {/* ============================================================ 25.10 a wrong descriptor */}
      <Slide o={sl(10)}>
        <SlideHead text={bh(P, 10)} />
        <Rich x={460} y={380} size={30} color={C.chalk2} text="The language model says:" o={s8w} />
        <JsonCard x={460} y={440} w={1000} name="California Gull" items={[CAL]} n={s8card > 0.001 ? 1 : 0} o={s8card} more />
        <Svg o={s8card}>
          <line x1={460 + 26 + 4 * 16.9} x2={460 + 26 + 4 * 16.9 + (CAL.length + 2) * 16.9 * s8x} y1={440 + 16 + 43 + 22} y2={440 + 16 + 43 + 22}
            stroke={C.bad} strokeWidth={4} strokeLinecap="round" />
        </Svg>
        <Rich x={460} y={700} size={34} weight={700} color={C.bad} text="It does not have a black head." o={s8x} />
        <Rich x={460} y={760} w={1000} size={28} color={C.chalk2} text={`The wrong descriptor is still averaged into the score, one of ${NCAL}.`} o={s8x} />
        <EvTag x={1760} y={880} ax="right" kind="data" text="Menon and Vondrick's released CUB descriptors" o={s8card} />
      </Slide>

      {/* ============================================================ 25.11 the score does not verify the words */}
      <Slide o={sl(11)}>
        <SlideHead text={bh(P, 11)} />
        <Rich x={160} y={305} size={28} text="Our {x:herring gull photo}" o={s11photo} />
        <PhotoR R={PH11} src="gull.jpg" o={s11photo} />
        <Rich x={160} y={725} size={28} text="White head, yellow bill" o={s11photo} />
        <Rich x={740} y={305} size={26} color={C.chalk2} text="From the California Gull checklist:" o={s11phrase} />
        <Rich x={740} y={355} size={36} w={1040} text={`"${CAL.replace('black head and bill', '{l:black head and bill}')}"`} o={s11phrase} />
        <Rich x={740} y={418} size={26} color={C.bad} text="These words do not match this photo." o={s11phrase} />
        <Svg>
          <Flow pts={[[530, 575], [735, 575]]} color={C.input} p={s11score} />
          <Flow pts={[[850, 468], [850, 520]]} color={C.concept} p={s11score} />
          <Block x={850} y={575} w={230} h={110} kind="input" title="CLIP" size={34} o={s11score} />
          <Flow pts={[[980, 575], [1110, 575]]} color={C.concept} p={s11score} />
          <Flow pts={[[1340, 575], [1460, 575]]} color={C.head} p={s11average} />
        </Svg>
        <Rich x={1220} y={505} ax="center" size={28} text="{c:Match score}" o={s11score} />
        <Rich x={1220} y={555} ax="center" size={50} weight={700} text={`{c:${CAL_COS.toFixed(3)}}`} o={s11score} />
        <Rich x={1220} y={640} ax="center" size={24} color={C.chalk2} text="Similarity, not a probability" o={s11meaning} />
        <Rich x={1500} y={493} size={24} color={C.chalk2} text="California Gull" o={s11average} />
        <Rich x={1500} y={535} size={30} weight={700} text="{f:Class average}" o={s11average} />
        <Rich x={1500} y={585} w={280} size={26} color={C.chalk2} text="still includes this score" o={s11average} />
        <Rich x={160} y={825} size={32} weight={700} text="Check the {c:words}" o={s11checks} />
        <Rich x={160} y={875} size={28} text="Correct and visible in the photo?" o={s11checks} />
        <Rich x={960} y={825} size={32} weight={700} text="Check the {c:score}" o={s11checks} />
        <Rich x={960} y={875} size={28} text="Does changing that feature change its score?" o={s11checks} />
        <Credit x={160} y={955} text={CREDIT['gull.jpg']} o={s11photo} />
        <EvTag x={1760} y={995} ax="right" kind="computed" text="CLIP ViT-B/32 on this photo; released CUB descriptor" o={s11score} />
      </Slide>

      {/* ============================================================ 25.12 recap: what changed compared with the rung-two phrase example */}
      <Slide o={sl(12)}>
        <SlideHead text={bh(P, 12)} />
        <Rich x={980} y={360} ax="center" size={30} weight={700} color={C.chalk2} text="rung two: learned head" o={s13h} />
        <Rich x={1460} y={360} ax="center" size={30} weight={700} text="by description" o={s13h} />
        <Svg o={s13h}>
          <line x1={200} x2={1720} y1={400} y2={400} stroke={C.line2} strokeWidth={2} />
        </Svg>
        {RECAP.map((r, i) => {
          const y = 480 + i * 130;
          return (
            <React.Fragment key={r.lab}>
              <Rich x={200} y={y} ay="middle" w={460} size={30} color={C.chalk2} text={r.lab} o={s13r[i]} />
              <Rich x={980} y={y} ax="center" ay="middle" size={32} color={C.chalk2} text={r.rungTwo} o={s13r[i]} />
              <Rich x={1210} y={y} ax="center" ay="middle" size={36} color={C.mute} text="→" o={s13cbd[i]} />
              <Rich x={1460} y={y} ax="center" ay="middle" size={34} weight={700} text={r.cbd} o={s13cbd[i]} />
            </React.Fragment>
          );
        })}
      </Slide>

      {/* ============================================================ 25.13 the card */}
      <Slide o={sl(13)}>
        <SlideHead text={bh(P, 13)} />
        <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.86)', transformOrigin: '960px 270px' }}>
          <VariantCard name="Classification by description (Menon and Vondrick, ICLR 2023)" rows={VROWS} p={cardP} y0={270} />
        </div>
        <Rich x={960} y={905} ax="center" ay="middle" size={30} weight={600} text="The cost: nothing guarantees that the descriptors are correct, or grounded." o={s9cost} />
      </Slide>
    </Stage>
  );
};
