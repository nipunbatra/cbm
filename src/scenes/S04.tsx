// s04 Part 4 · From concepts to predictions: the arithmetic (revision 2: one idea per slide, 13 slides, one per beat)
// 4.1 motivation: concept values -> task head -> class scores    4.2 three classes (photos) and three concepts (teal chips)
// 4.3 the low-contrast zebra -> g -> the concept vector ĉ (D.zoo.c)  4.4 one row of W in words: the zebra row (D.zoo.W[0])
// 4.5 the full W, key weights ringed                             4.6 the zebra score term by term, as a worksheet (D.zoo.terms)
// 4.7 W ĉ = terms = s, horse and giraffe rows read out           4.8 the largest score and the softmax shares (D.zoo.softmax)
// 4.9 the amber edit: stripes 0.1 -> 1 (D.zoo.c_new)             4.10 recompute with the same W (terms_new, logits_new)
// 4.11 the shares move: zebra leads (softmax_new)                4.12 Δs = 0.9 × the stripes column of W (D.zoo.delta)
// 4.13 closing: edit a belief, keep the weights.
// Slides replace each other: the old one fades out in the gap before a beat, the new one fades in on its first words.
import React from 'react';
import { C } from '../kit/theme';
import { E, HText, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, ROLE, bs, be, bw, bh, inv, type SceneProps } from '../kit/core';
import { ArchMap, Block, CREDIT, Credit, EditMark, EvTag, Flow, Matrix, MathSvg, Person, PhotoR, ShareBars, VecCol, fit, rgba, type Rect } from '../kit/cbm';
import { TexSteps } from '../kit/slots';
import { lerp } from '../kit/anim';
import { D } from '../kit/data';

const Z = D.zoo;
const CLS: string[] = Z.classes;
const CON: string[] = Z.concepts;
const Wm: number[][] = Z.W;
const c0: number[] = Z.c, c1: number[] = Z.c_new;
const T0: number[][] = Z.terms, T1: number[][] = Z.terms_new;
const L0: number[] = Z.logits, L1: number[] = Z.logits_new;
const S0: number[] = Z.softmax, S1: number[] = Z.softmax_new;
const DL: number[] = Z.delta;
const FC = ROLE.f; // task head colour (light grey, readable on the board)
const DC = c1[0] - c0[0]; // the edit's size on stripes

/** number for display: at most 2 decimals, no trailing zeros, no negative zero */
const num = (v: number) => {
  const r = Math.round(v * 100) / 100;
  return String(Object.is(r, -0) ? 0 : r);
};
const sgn = (v: number) => (v > 0 ? `+${num(v)}` : num(v));
/** a term in a running sum: the first plain, the rest with their sign */
const term = (v: number, first: boolean) => (first ? num(v) : v < 0 ? `{}- ${num(-v)}` : `{}+ ${num(v)}`);
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const THUMB = [
  { src: 'zebra_plains.jpg', frac: [0.22, 0.06, 0.94, 0.88] as [number, number, number, number] },
  { src: 'horse.jpg', frac: [0.04, 0.14, 0.76, 0.92] as [number, number, number, number] },
  { src: 'giraffe.jpg', frac: [0, 0.12, 1, 0.69] as [number, number, number, number] },
];
const LOWC = 'contrast(0.35) brightness(0.75) saturate(0.6)';

/** one slide: a full-frame SVG group with its own opacity */
const G: React.FC<{ o: number; children?: React.ReactNode }> = ({ o, children }) =>
  o <= 0.001 ? null : <g opacity={o < 0.999 ? o : undefined}>{children}</g>;

/** a bracket pair around (x, y, w, h) */
const Brk: React.FC<{ x: number; y: number; w: number; h: number; color?: string; o?: number; sw?: number }> = ({ x, y, w, h, color = C.chalk2, o = 1, sw = 3.5 }) =>
  o <= 0.001 ? null : (
    <g opacity={o < 0.999 ? o : undefined} fill="none" stroke={color} strokeWidth={sw}>
      <path d={`M ${x + 14} ${y} L ${x} ${y} L ${x} ${y + h} L ${x + 14} ${y + h}`} />
      <path d={`M ${x + w - 14} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x + w - 14} ${y + h}`} />
    </g>
  );

// ---- shared layout of the product slides (4.7 and 4.10): names | W | ĉ | = | terms | = | s
const PM = { x: 430, y: 404, cw: 112, ch: 100 };
const prY = (i: number) => PM.y + PM.ch * (i + 0.5);
const PC = { x: 820, w: 116 }; // ĉ column
const PT = 1046; // terms (left edge)
const PS = { x: 1500, w: 140 }; // s column

export const S04: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  /** start of the n-th word in beat k whose normalised form equals `word` exactly ("0.1" -> "01") */
  const wx = (k: number, word: string, n = 0) => {
    const bt = P.beats[k - 1];
    const hits = bt.words.filter((x) => norm(x.w) === norm(word));
    const h = hits[Math.min(n, hits.length - 1)];
    if (!h) throw new Error(`no word "${word}" in beat ${k}`);
    return h.s - P.start;
  };
  const at = (x: number, d = 0.4) => inv(x, x + d, t);
  const NB = P.beats.length;
  /** slide k: fades in (0.3 s) on the beat's first words, fades out (0.3 s) after the beat ends */
  const so = (k: number) => {
    const fin = inv(b(k) - 0.05, b(k) + 0.25, t);
    if (k === NB) return fin;
    const z = Math.min(be(P, k) + 0.02, b(k + 1) - 0.34);
    return fin * (1 - inv(z, z + 0.3, t));
  };
  const S = Array.from({ length: NB + 1 }, (_, k) => (k === 0 ? 0 : so(k)));
  const o = (k: number, v = 1) => S[k] * v;
  const tagO = Math.max(...[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((k) => S[k]));

  // ================= 4.1 motivation
  const m1c = at(w(1, 'concept') - 0.1), m1f = at(w(1, 'task') - 0.1), m1y = at(w(1, 'answer') - 0.2);
  const m1live = at(w(1, 'arithmetic'), 0.5);
  const m1txt = at(w(1, 'hand') - 0.3);
  const M1 = { cx: 560, fx: 960, yx: 1360, y: 560 };

  // ================= 4.2 classes and concepts
  const cardIn = [w(2, 'zebra'), w(2, 'horse'), w(2, 'giraffe')].map((x) => at(x - 0.15));
  const chipIn = [w(2, 'stripes'), w(2, 'horse', 1), w(2, 'long')].map((x) => at(x - 0.15));
  const CX = [780, 1140, 1500], CARD = { w: 300, h: 228, y: 312 };

  // ================= 4.3 the concept vector
  const PH3: Rect = fit('zebra_plains.jpg', 190, 380, 430);
  const ph3 = at(b(3) + 0.05);
  const g3 = at(w(3, 'predictor') - 0.2);
  const g3p = E.io(inv(w(3, 'predictor') - 0.2, w(3, 'reports'), t));
  const g3live = at(w(3, 'reports'), 0.4);
  const v3 = [wx(3, '01', 0), wx(3, '09'), wx(3, '01', 1)].map((x) => at(x - 0.1));
  const n3 = [w(3, 'stripes'), w(3, 'horse'), w(3, 'long')].map((x) => at(x - 0.1));
  const col3 = at(w(3, 'Stacked') - 0.1);
  const sym3 = at(w(3, 'hat') - 0.3);
  const V3 = { x: 1010, y: 384, rowH: 96, w: 130 };

  // ================= 4.4 the zebra row
  const r4 = at(w(4, 'matrix') - 0.1);
  const r4lab = at(w(4, 'zebra') - 0.1);
  const r4v = [wx(4, '3'), wx(4, '1'), wx(4, '0')].map((x) => at(x - 0.1));
  const r4ring = at(wx(4, '3'), 0.35);
  const r4txt = at(wx(4, '0') + 0.4);
  const M4 = { x: 780, y: 486, cw: 230, ch: 112 };

  // ================= 4.5 the full matrix
  const r5row = (i: number) => at(b(5) + 0.1 + i * 0.25, 0.35);
  const ringT: Record<string, number> = { '0-0': w(5, 'stripes'), '2-2': w(5, 'neck'), '1-1': w(5, 'mostly') + 0.2, '0-1': w(5, 'mostly') + 0.2 };
  const r5txt = at(be(P, 5) - 1.2);
  const M5 = { x: 780, y: 420, cw: 230, ch: 104 };

  // ================= 4.6 the zebra score, term by term
  const prodT = [wx(6, '3'), wx(6, '1'), wx(6, '0', 0)];
  const resT = [wx(6, '03'), wx(6, '09', 1), wx(6, '0', 1)];
  const sum6 = wx(6, '12');
  const a6 = at(b(6) + 0.05), cv6 = at(w(6, 'concept') - 0.1), rule6 = at(prodT[0] - 0.3);
  const band6 = (j: number) => at(prodT[j] - 0.1, 0.3) * (1 - at(j < 2 ? prodT[j + 1] - 0.2 : sum6 - 0.2, 0.3));
  const X6 = [840, 1080, 1320], Y6 = { head: 330, a: 412, b: 512, c: 650 };

  // ================= 4.7 / 4.10 product slides
  const rows7 = {
    start: [b(7), wx(7, 'horse'), wx(7, 'giraffe')],
    term: [[0, 0, 0], [wx(7, '01', 0), wx(7, '18'), wx(7, '01', 1)], [wx(7, '01', 2), wx(7, '0'), wx(7, '03')]],
    sum: [0, wx(7, '16'), wx(7, '02')],
  };
  const rows10 = {
    start: [wx(10, 'zebra'), wx(10, 'horse'), wx(10, 'giraffe')],
    term: [[wx(10, '3'), wx(10, '09'), wx(10, '0', 0)], [wx(10, '1', 0), wx(10, '18'), wx(10, '01')], [wx(10, '1', 1), wx(10, '0', 1), wx(10, '03')]],
    sum: [wx(10, '39'), wx(10, '07', 0), wx(10, '07', 1)],
  };
  const logit7 = at(w(7, 'class') - 0.1);
  const same10 = at(w(10, 'same') - 0.1);
  const pulse10 = Math.sin(Math.PI * inv(w(10, 'same') - 0.1, w(10, 'same') + 0.9, t));

  // ================= 4.8 softmax
  const ring8 = at(w(8, 'largest') - 0.1);
  const arr8 = E.io(inv(w(8, 'softmax') - 0.1, w(8, 'softmax') + 0.6, t));
  const bars8 = inv(w(8, 'softmax') + 0.3, w(8, 'shares') + 0.8, t);
  const eq8 = at(w(8, 'shares') - 0.1);
  const sum8 = at(w(8, 'sum') - 0.1);
  const hi8 = at(w(8, 'horse', 1) - 0.1);

  // ================= 4.9 the edit
  const PH9: Rect = fit('zebra_plains.jpg', 190, 390, 400);
  const pers9 = at(w(9, 'observer') - 0.1);
  const look9 = at(w(9, 'looks') - 0.1) * (1 - 0.5 * at(w(9, 'coordinate')));
  const ring9 = at(w(9, 'coordinate') - 0.1);
  const editT = wx(9, '01');
  const edit9 = E.io(inv(editT, wx(9, '1') + 0.4, t));
  const eq9 = at(editT - 0.2);

  // ================= 4.11 shares move
  const k11 = inv(w(11, 'softmax'), wx(11, '095') + 0.2, t);
  const prev11 = at(b(11) + 0.2);

  // ================= 4.12 the column view
  const tickI = at(w(12, 'image') - 0.1), tickW = at(w(12, 'matrix') - 0.1);
  const each12 = (j: number) => at(w(12, 'Each') + j * 0.45, 0.3) * (1 - at(w(12, 'Only') - 0.2, 0.3));
  const only12 = at(w(12, 'Only') - 0.1);
  const d12a = at(w(12, 'scores') - 0.1), d12m = at(wx(12, '09', 1) - 0.1), d12c = at(w(12, 'stripes', 1) - 0.1);
  const d12z = at(wx(12, '27') - 0.1), d12o = at(wx(12, '09', 2) - 0.1);
  const stripeHi = Math.max(only12, 0);
  const W12 = { x: 250, y: 470, cw: 96, ch: 84 };

  // ================= 4.13 closing
  const c13 = at(b(13) + 0.05), f13 = at(w(13, 'corrected') - 0.1), y13 = at(w(13, 'belief') - 0.1), t13 = at(w(13, 'retrained') - 0.3);

  // ---------------------------------------------------------------- product slide (4.7 and 4.10)
  type Rows = { start: number[]; term: number[][]; sum: number[] };
  const product = (k: number, cv: number[], T: number[][], L: number[], R: Rows, edited: boolean) => {
    const so = S[k];
    if (so <= 0.001) return { svg: null, html: null };
    const band = (i: number) => {
      const end = i < 2 ? R.start[i + 1] - 0.2 : be(P, k) - 0.3;
      return (k === 7 && i === 0 ? 0 : at(R.start[i] - 0.1, 0.3)) * (1 - at(end, 0.3));
    };
    const shown = (i: number) => (k === 7 && i === 0 ? 1 : at(R.sum[i] - 0.1, 0.35));
    const svg = (
      <G o={so}>
        {[0, 1, 2].map((i) => {
          const a = band(i);
          return a > 0.001 ? (
            <rect key={i} x={170} y={prY(i) - 46} width={PS.x + PS.w + 30 - 170} height={92} rx={14} fill={rgba(C.chalk, 0.05 * a)} stroke={rgba(C.chalk, 0.2 * a)} strokeWidth={2} />
          ) : null;
        })}
        {pulse10 > 0.001 && k === 10 ? <rect x={PM.x - 18} y={PM.y - 18} width={3 * PM.cw + 36} height={3 * PM.ch + 36} rx={20} fill={rgba(FC, 0.2 * pulse10)} /> : null}
        <Matrix x={PM.x} y={PM.y} vals={Wm} cw={PM.cw} ch={PM.ch} size={34} digits={0} rows={CLS} headSize={30} rowColors={[C.chalk, C.chalk, C.chalk]}
          valColor={() => FC} bg={(_, j) => (edited && j === 0 ? rgba(C.edit, 0.1) : null)} />
        <VecCol x={PC.x} y={PM.y} vals={cv} rowH={PM.ch} w={PC.w} size={34} digits={1} cellColor={(i) => (edited && i === 0 ? C.edit : C.concept)}
          ring={(i) => (edited && i === 0 ? 1 : 0)} />
        <Txt x={(PC.x + PC.w + PT) / 2} y={prY(1)} size={46} fill={C.chalk2}>=</Txt>
        <Txt x={PS.x - 44} y={prY(1)} size={46} fill={C.chalk2}>=</Txt>
        <Brk x={PS.x} y={PM.y + 4} w={PS.w} h={3 * PM.ch - 8} color={C.chalk} />
        {[0, 1, 2].map((i) => <Txt key={i} x={PS.x + PS.w / 2} y={prY(i)} size={38} mono weight={700} fill={C.chalk} o={shown(i)}>{num(L[i])}</Txt>)}
      </G>
    );
    const html = (
      <>
        {[0, 1, 2].map((i) => (
          <TexSteps key={i} x={PT} y={prY(i)} t={t} size={40} o={so}
            parts={T[i].map((v, j) => {
              const s = term(v, j === 0);
              return [edited && j === 0 ? `\\cedit{${s}}` : s, k === 7 && i === 0 ? -99 : R.term[i][j]] as [string, number];
            })} />
        ))}
        <Tex x={PM.x + 1.5 * PM.cw} y={762} ax="center" size={48} tex="\chead{W}" o={so} />
        <Tex x={PC.x + PC.w / 2} y={762} ax="center" size={48} tex="\cvec" o={so} />
        <Tex x={PS.x + PS.w / 2} y={762} ax="center" size={48} tex="\cout{\mathbf{s}}" o={so} />
        {k === 7 ? <Rich x={PS.x + PS.w / 2} y={810} ax="center" size={30} text="{y:class scores}, or logits" o={so * logit7} /> : null}
        {k === 10 ? <Rich x={PM.x + 1.5 * PM.cw} y={810} ax="center" size={30} text="{f:same matrix}" o={so * same10} /> : null}
        {k === 10 ? <Rich x={PC.x + PC.w / 2} y={810} ax="center" size={30} text="{e:edited}" o={so * same10} /> : null}
      </>
    );
    return { svg, html };
  };
  const P7 = product(7, c0, T0, L0, rows7, false);
  const P10 = product(10, c1, T1, L1, rows10, true);

  // Δ view tex pieces
  const colTex = `\\begin{bmatrix}${Wm.map((r) => `\\chead{${num(r[0])}}`).join('\\\\')}\\end{bmatrix}`;
  const resTex = (show: boolean[]) =>
    `\\begin{bmatrix}${DL.map((v, i) => (show[i] ? `\\cout{${sgn(v)}}` : `\\phantom{${sgn(v)}}`)).join('\\\\')}\\end{bmatrix}`;
  const dPre = '\\Delta\\cout{\\mathbf{s}} =';
  const dMul = `\\cedit{${num(DC)}}\\times`;
  const ph = (s: string) => `\\phantom{${s}}`;
  const dLayers: [string, number][] = [
    [`${dPre}${ph(dMul)}${ph(colTex)}${ph('=')}${ph(resTex([true, true, true]))}`, d12a],
    [`${ph(dPre)}${dMul}${ph(colTex)}${ph('=')}${ph(resTex([true, true, true]))}`, d12m],
    [`${ph(dPre)}${ph(dMul)}${colTex}${ph('=')}${ph(resTex([true, true, true]))}`, d12c],
    [`${ph(dPre)}${ph(dMul)}${ph(colTex)}=${resTex([true, false, false])}`, d12z],
    [`${ph(dPre)}${ph(dMul)}${ph(colTex)}${ph('=')}${resTex([false, true, true])}`, d12o],
  ];

  // shares on slide 11
  const sh11 = S0.map((v, i) => lerp(v, S1[i], E.io(k11)));

  return (
    <Stage>
      {/* ================= photos ================= */}
      {THUMB.map((th, i) => (
        <PhotoR key={th.src} R={{ x: CX[i] - CARD.w / 2, y: CARD.y, w: CARD.w, h: CARD.h }} src={th.src} frac={th.frac} o={o(2, cardIn[i])} radius={8} />
      ))}
      <PhotoR R={PH3} src="zebra_plains.jpg" o={o(3, ph3)} filter={LOWC} />
      <PhotoR R={{ x: 330, y: M4.y + M4.ch / 2 - 62, w: 164, h: 124 }} src={THUMB[0].src} frac={THUMB[0].frac} o={o(4, r4lab)} radius={6} />
      {THUMB.map((th, i) => (
        <PhotoR key={`t5${i}`} R={{ x: 496, y: M5.y + M5.ch * (i + 0.5) - 44, w: 116, h: 88 }} src={th.src} frac={th.frac} o={o(5, r5row(i))} radius={6} />
      ))}
      <PhotoR R={PH9} src="zebra_plains.jpg" o={o(9)} filter={LOWC} />

      <Svg>
        {/* ---------------- 4.1 motivation ---------------- */}
        <G o={S[1]}>
          {/* concept values: a teal column of three cells */}
          <g opacity={m1c}>
            {[0, 1, 2].map((i) => (
              <rect key={i} x={M1.cx - 50} y={M1.y - 120 + i * 82} width={100} height={70} rx={10} fill={rgba(C.concept, 0.16)} stroke={C.concept} strokeWidth={3} />
            ))}
          </g>
          <Flow pts={[[M1.cx + 70, M1.y], [M1.fx - 130, M1.y]]} color={C.concept} sw={4} head={14} p={E.out(m1f)} t={t} live={m1live} n={2} />
          <Block x={M1.fx} y={M1.y} w={220} h={170} kind="head" o={m1f} />
          <Flow pts={[[M1.fx + 126, M1.y], [M1.yx - 70, M1.y]]} color={C.chalk} sw={4} head={14} p={E.out(m1y)} t={t + 0.3} live={m1live} n={2} />
          <g opacity={m1y}>
            {[0, 1, 2].map((i) => (
              <rect key={i} x={M1.yx - 50} y={M1.y - 120 + i * 82} width={100} height={70} rx={10} fill={C.bg3} stroke={C.chalk} strokeWidth={3} />
            ))}
          </g>
          <Txt x={M1.fx} y={M1.y - 2} size={34} mono weight={600} fill={FC} o={m1f}>× and +</Txt>
        </G>

        {/* ---------------- 4.2 concept chips ---------------- */}
        <G o={S[2]}>
          {CLS.map((n, i) => <Txt key={n} x={CX[i]} y={CARD.y + CARD.h + 40} size={36} weight={700} o={cardIn[i]}>{n}</Txt>)}
          {CON.map((n, i) => (
            <g key={n} opacity={chipIn[i]}>
              <rect x={CX[i] - 150} y={712 - 38} width={300} height={76} rx={14} fill={rgba(C.concept, 0.12)} stroke={C.concept} strokeWidth={2.5} />
              <Txt x={CX[i]} y={712} size={34} weight={600} fill={C.concept}>{n}</Txt>
            </g>
          ))}
        </G>

        {/* ---------------- 4.3 photo -> g -> ĉ ---------------- */}
        <G o={S[3]}>
          <Flow pts={[[PH3.x + PH3.w + 10, PH3.y + PH3.h / 2], [770, PH3.y + PH3.h / 2]]} color={C.input} sw={3.5} head={12} p={g3p} t={t} live={g3live} n={2} />
          <Block x={840} y={PH3.y + PH3.h / 2} w={130} h={96} kind="input" o={g3} />
          <MathSvg x={840} y={PH3.y + PH3.h / 2} tex="\gth" size={38} o={g3} />
          <Flow pts={[[910, PH3.y + PH3.h / 2], [V3.x - 22, PH3.y + PH3.h / 2]]} color={C.concept} sw={3.5} head={12} p={g3p} t={t + 0.2} live={g3live} n={1} />
          <VecCol x={V3.x} y={V3.y} vals={c0} rowH={V3.rowH} w={V3.w} size={38} digits={1} o={Math.max(v3[0], col3)} cellO={(i) => v3[i]} cellColor={() => C.concept} />
          {CON.map((n, i) => <Txt key={n} x={V3.x + V3.w + 34} y={V3.y + V3.rowH * (i + 0.5)} size={32} anchor="start" weight={600} fill={C.concept} o={n3[i]}>{n}</Txt>)}
          <MathSvg x={V3.x + V3.w / 2} y={V3.y - 46} tex="\cvec" size={52} o={sym3} />
        </G>

        {/* ---------------- 4.4 the zebra row ---------------- */}
        <G o={S[4]}>
          <Matrix x={M4.x} y={M4.y} vals={[Wm[0]]} cw={M4.cw} ch={M4.ch} size={46} digits={0} rows={['zebra']} rowColors={[C.chalk]} headSize={34}
            cols={CON} colHeadY={M4.y - 44} o={r4} headO={r4lab} cell={(_, j) => r4v[j]} valColor={() => FC}
            ring={(_, j) => (j === 0 && r4ring > 0.001 ? { color: C.chalk, o: r4ring } : null)} />
        </G>

        {/* ---------------- 4.5 the full matrix ---------------- */}
        <G o={S[5]}>
          <Matrix x={M5.x} y={M5.y} vals={Wm} cw={M5.cw} ch={M5.ch} size={42} digits={0} rows={CLS} rowColors={[C.chalk, C.chalk, C.chalk]} headSize={32}
            cols={CON} colHeadY={M5.y - 40} cell={(i) => r5row(i)} valColor={() => FC}
            ring={(i, j) => {
              const kk = `${i}-${j}`;
              if (!(kk in ringT)) return null;
              const a = at(ringT[kk], 0.35) * (kk === '0-1' ? 0.55 : 1);
              return a > 0.001 ? { color: C.chalk, o: a } : null;
            }} />
        </G>

        {/* ---------------- 4.6 worksheet: zebra row x concept values ---------------- */}
        <G o={S[6]}>
          {[0, 1, 2].map((j) => {
            const a = band6(j);
            return a > 0.001 ? <rect key={j} x={X6[j] - 100} y={Y6.a - 52} width={200} height={Y6.c - Y6.a + 104} rx={16} fill={rgba(C.chalk, 0.05 * a)} stroke={rgba(C.chalk, 0.35 * a)} strokeWidth={2.5} /> : null;
          })}
          {CON.map((n, j) => <Txt key={n} x={X6[j]} y={Y6.head} size={28} weight={600} fill={C.concept} o={a6}>{n}</Txt>)}
          {[0, 1, 2].map((j) => (
            <g key={j}>
              <g opacity={a6}>
                <rect x={X6[j] - 75} y={Y6.a - 38} width={150} height={76} rx={10} fill={C.headFill} stroke="#8792A2" strokeWidth={2.5} />
                <Txt x={X6[j]} y={Y6.a} size={40} mono weight={600} fill={FC}>{num(Wm[0][j])}</Txt>
              </g>
              <g opacity={cv6}>
                <rect x={X6[j] - 75} y={Y6.b - 38} width={150} height={76} rx={10} fill={rgba(C.concept, 0.12)} stroke={C.concept} strokeWidth={2.5} />
                <Txt x={X6[j]} y={Y6.b} size={40} mono weight={600} fill={C.concept}>{num(c0[j])}</Txt>
              </g>
              <Txt x={X6[j] - 100} y={(Y6.a + Y6.b) / 2} size={34} fill={C.chalk2} o={at(prodT[j] - 0.1)}>×</Txt>
              <Txt x={X6[j]} y={Y6.c} size={44} mono weight={700} fill={C.chalk} o={at(resT[j] - 0.1)}>{num(T0[0][j])}</Txt>
              {j > 0 ? <Txt x={X6[j] - 120} y={Y6.c} size={40} fill={C.chalk2} o={at(resT[j] - 0.1)}>+</Txt> : null}
            </g>
          ))}
          <line x1={X6[0] - 110} x2={X6[2] + 110} y1={(Y6.b + Y6.c) / 2 + 6} y2={(Y6.b + Y6.c) / 2 + 6} stroke={C.line2} strokeWidth={2.5} opacity={rule6} />
          <Txt x={X6[2] + 150} y={Y6.c} size={44} fill={C.chalk2} o={at(sum6 - 0.1)}>=</Txt>
          <g opacity={at(sum6 - 0.1)}>
            <rect x={X6[2] + 186} y={Y6.c - 42} width={130} height={84} rx={12} fill={C.bg3} stroke={C.chalk} strokeWidth={3} />
            <Txt x={X6[2] + 251} y={Y6.c} size={46} mono weight={700} fill={C.chalk}>{num(L0[0])}</Txt>
          </g>
        </G>

        {/* ---------------- 4.7 and 4.10 products ---------------- */}
        {P7.svg}
        {P10.svg}

        {/* ---------------- 4.8 softmax ---------------- */}
        <G o={S[8]}>
          <VecCol x={430} y={404} vals={L0} rowH={100} w={130} size={36} digits={1} color={C.chalk} cellColor={() => C.chalk}
            ring={(i) => (i === Z.argmax ? ring8 : 0)} ringColor={C.chalk} />
          {CLS.map((n, i) => <Txt key={n} x={404} y={454 + i * 100} size={30} anchor="end" weight={i === Z.argmax && ring8 > 0.5 ? 700 : 500} fill={C.chalk}>{n}</Txt>)}
          <Flow pts={[[600, 554], [840, 554]]} color={C.chalk} sw={3.5} head={14} p={arr8} />
          <ShareBars x={880} y={454} labels={CLS} from={S0} rowH={100} labelW={160} w={520} size={32} p={bars8} o={at(w(8, 'softmax'))} />
          {hi8 > 0.001 ? <rect x={880 + 160 + 520 + 4} y={554 - 30} width={110} height={60} rx={10} fill="none" stroke={C.chalk} strokeWidth={2.5} opacity={hi8} /> : null}
        </G>

        {/* ---------------- 4.9 the edit ---------------- */}
        <G o={S[9]}>
          {look9 > 0.001 ? <rect x={PH9.x - 10} y={PH9.y - 10} width={PH9.w + 20} height={PH9.h + 20} rx={12} fill="none" stroke={C.edit} strokeWidth={3.5} strokeDasharray="12 9" opacity={look9} /> : null}
          <Person x={PH9.x + PH9.w + 90} y={PH9.y + 40} s={1.1} o={pers9} />
          <VecCol x={940} y={390} vals={[lerp(c0[0], c1[0], edit9), c0[1], c0[2]]} rowH={100} w={150} size={38} digits={1}
            color={C.concept} cellColor={(i) => (i === 0 && edit9 > 0.001 ? C.edit : C.concept)} ring={(i) => (i === 0 ? ring9 : 0)} />
          {CON.map((n, i) => <Txt key={n} x={1124} y={440 + i * 100} size={32} anchor="start" weight={600} fill={i === 0 && edit9 > 0.001 ? C.edit : C.concept}>{n}</Txt>)}
          <EditMark x={905} y={420} s={1.1} o={ring9} />
          <MathSvg x={1015} y={350} tex="\cvec" size={48} />
        </G>

        {/* ---------------- 4.11 shares move ---------------- */}
        <G o={S[11]}>
          <ShareBars x={500} y={430} labels={CLS} from={sh11} rowH={112} labelW={200} w={760} size={36} />
        </G>

        {/* ---------------- 4.12 the column view ---------------- */}
        <G o={S[12]}>
          <Matrix x={W12.x} y={W12.y} vals={Wm} cw={W12.cw} ch={W12.ch} size={32} digits={0} valColor={() => FC} o={tickW}
            bg={(_, j) => {
              const g = Math.max(each12(j), j === 0 ? stripeHi : 0);
              return g > 0.001 ? rgba(C.concept, 0.3 * g) : null;
            }}
            ring={(_, j) => (j === 0 && stripeHi > 0.001 ? { color: C.edit, o: stripeHi } : null)} />
          <Flow pts={[[W12.x + 3 * W12.cw + 30, W12.y + 1.5 * W12.ch], [690, W12.y + 1.5 * W12.ch]]} color={C.chalk2} sw={3} head={12} p={E.out(d12c)} />
        </G>

        {/* ---------------- 4.13 closing ---------------- */}
        <G o={S[13]}>
          <Person x={520} y={400} s={0.95} o={c13} />
          <g opacity={c13}>
            {[0, 1, 2].map((i) => (
              <rect key={i} x={470} y={470 + i * 76} width={100} height={64} rx={10} fill={i === 0 ? rgba(C.edit, 0.25) : rgba(C.concept, 0.16)} stroke={i === 0 ? C.edit : C.concept} strokeWidth={3} />
            ))}
          </g>
          <Flow pts={[[600, 572], [820, 572]]} color={C.concept} sw={4} head={14} p={E.out(f13)} t={t} live={f13} n={2} />
          <Block x={960} y={572} w={240} h={170} kind="head" o={f13} />
          <MathSvg x={960} y={572} tex="\chead{W}" size={54} o={f13} />
          <Flow pts={[[1090, 572], [1300, 572]]} color={C.chalk} sw={4} head={14} p={E.out(y13)} t={t + 0.3} live={y13} n={2} />
          <g opacity={y13}>
            <rect x={1320} y={530} width={230} height={84} rx={14} fill={C.bg3} stroke={C.chalk} strokeWidth={3} />
            <Txt x={1435} y={572} size={36} weight={700} fill={C.chalk}>zebra</Txt>
          </g>
        </G>
      </Svg>

      {/* ================= HTML text and maths ================= */}
      {/* 4.1 */}
      <SlideHead text={bh(P, 1)} o={o(1)} />
      <Rich x={M1.cx} y={700} ax="center" size={32} text="{c:concept values}" o={o(1, m1c)} />
      <Rich x={M1.fx} y={700} ax="center" size={32} text="{f:task head}" o={o(1, m1f)} />
      <Rich x={M1.yx} y={700} ax="center" size={32} text="{y:class scores}" o={o(1, m1y)} />
      <HText x={960} y={820} ax="center" size={34} color={C.chalk2} o={o(1, m1txt)}>multiply and add, small enough to do by hand</HText>

      {/* 4.2 */}
      <SlideHead text={bh(P, 2)} o={o(2)} />
      <Rich x={180} y={CARD.y + CARD.h / 2} ay="middle" size={34} text="{y:classes}" o={o(2, cardIn[0])} />
      <Rich x={180} y={712} ay="middle" size={34} text="{c:concepts}" o={o(2, chipIn[0])} />
      {THUMB.map((th, i) => (
        <Credit key={th.src} x={1760} y={846 + i * 22} ax="right" text={`${CLS[i]}: ${CREDIT[th.src]}`} o={o(2, cardIn[i])} />
      ))}

      {/* 4.3 */}
      <SlideHead text={bh(P, 3)} o={o(3)} />
      <HText x={PH3.x} y={PH3.y + PH3.h + 12} size={26} color={C.chalk2} o={o(3, ph3)}>low-contrast photo</HText>
      <Credit x={PH3.x} y={PH3.y + PH3.h + 48} text={CREDIT['zebra_plains.jpg']} o={o(3, ph3)} />
      <Rich x={840} y={PH3.y + PH3.h / 2 - 84} ax="center" size={26} text="{x:concept predictor}" o={o(3, g3)} />
      <Rich x={V3.x + V3.w / 2} y={V3.y + 3 * V3.rowH + 34} ax="center" size={28} text="{c:concept vector}" o={o(3, col3)} />

      {/* 4.4 */}
      <SlideHead text={bh(P, 4)} o={o(4)} />
      <Rich x={M4.x} y={360} size={30} text="the zebra row of the {f:weight matrix} $\chead{W}$" o={o(4, r4)} />
      <Rich x={M4.x + 1.5 * M4.cw} y={700} ax="center" size={32} color={C.chalk2} text="a {f:weight} says how strongly a {c:concept} counts toward a {y:class}" o={o(4, r4txt)} />

      {/* 4.5 */}
      <SlideHead text={bh(P, 5)} o={o(5)} />
      <Rich x={M5.x + 1.5 * M5.cw} y={770} ax="center" size={32} color={C.chalk2} text="one row per {y:class}, one column per {c:concept}" o={o(5, r5txt)} />

      {/* 4.6 */}
      <SlideHead text={bh(P, 6)} o={o(6)} />
      <Rich x={X6[0] - 140} y={Y6.a} ax="right" ay="middle" size={30} text="{f:zebra weights}" o={o(6, a6)} />
      <Rich x={X6[0] - 140} y={Y6.b} ax="right" ay="middle" size={30} text="{c:concept values}" o={o(6, cv6)} />
      <Rich x={X6[0] - 140} y={Y6.c} ax="right" ay="middle" size={30} color={C.chalk2} text="products" o={o(6, at(resT[0] - 0.1))} />
      <TexSteps x={1080} y={810} ax="center" t={t} size={48} o={S[6]}
        parts={[
          ['\\cout{s}_{\\text{zebra}} = {}', prodT[0] - 0.2],
          ...[0, 1, 2].map((j) => [`${j ? '{}+' : ''}\\chead{${num(Wm[0][j])}}\\times\\ccon{${num(c0[j])}}`, prodT[j]] as [string, number]),
          [`{}= \\cout{${num(L0[0])}}`, sum6],
        ]} />

      {/* 4.7 and 4.10 */}
      <SlideHead text={bh(P, 7)} o={o(7)} />
      {P7.html}
      <SlideHead text={bh(P, 10)} o={o(10)} />
      {P10.html}

      {/* 4.8 */}
      <SlideHead text={bh(P, 8)} o={o(8)} />
      <Tex x={720} y={508} ax="center" size={36} tex="\mathrm{softmax}" o={o(8, arr8)} />
      <Rich x={495} y={724} ax="center" size={30} text="{y:scores}" o={o(8)} />
      <Rich x={1300} y={724} ax="center" size={30} text="{y:shares}, summing to one" o={o(8, sum8)} />
      <Tex x={960} y={830} ax="center" size={48} tex="\hat{y}_k = \dfrac{e^{\cout{s_k}}}{\sum_j e^{\cout{s_j}}}" o={o(8, eq8)} />

      {/* 4.9 */}
      <SlideHead text={bh(P, 9)} o={o(9)} />
      <Credit x={PH9.x} y={PH9.y + PH9.h + 12} text={CREDIT['zebra_plains.jpg']} o={o(9)} />
      <Tex x={1015} y={780} ax="center" size={52} tex={`\\ch_{\\text{stripes}}:\\ \\ccon{${num(c0[0])}} \\;\\to\\; \\cedit{${num(c1[0])}}`} o={o(9, eq9)} />

      {/* 4.11 */}
      <SlideHead text={bh(P, 11)} o={o(11)} />
      <Rich x={960} y={790} ax="center" size={30} color={C.chalk2} text={`before the edit: horse ${S0[1].toFixed(2)}`} o={o(11, prev11)} />

      {/* 4.12 */}
      <SlideHead text={bh(P, 12)} o={o(12)} />
      <Rich x={180} y={330} size={32} text="{x:image}: unchanged" o={o(12, tickI)} />
      <Rich x={560} y={330} size={32} text="{f:matrix W}: unchanged" o={o(12, tickW)} />
      <Tex x={W12.x + 1.5 * W12.cw} y={W12.y - 44} ax="center" size={44} tex="\chead{W}" o={o(12, tickW)} />
      <Rich x={W12.x + 1.5 * W12.cw} y={W12.y + 3 * W12.ch + 22} ax="center" size={26} color={C.chalk2} text="each {c:value} scales its column" o={o(12, at(w(12, 'Each') - 0.1))} />
      {dLayers.map(([tex, t0], i) => <Tex key={i} x={720} y={W12.y + 1.5 * W12.ch} size={56} tex={tex} o={o(12, at(t0))} />)}
      <Rich x={720} y={790} size={32} text={`only {c:stripes} moved: $\\Delta\\ch_{\\text{stripes}} = \\cedit{${num(DC)}}$`} o={o(12, only12)} />

      {/* 4.13 */}
      <SlideHead text={bh(P, 13)} o={o(13)} />
      <Rich x={520} y={710} ax="center" size={30} text="{e:edited} {c:belief}" o={o(13, c13)} />
      <Rich x={960} y={710} ax="center" size={30} text="{f:same weights}" o={o(13, f13)} />
      <Rich x={1435} y={710} ax="center" size={30} text="{y:new answer}" o={o(13, y13)} />
      <HText x={960} y={820} ax="center" size={36} weight={600} color={C.chalk} o={o(13, t13)}>no retraining</HText>

      <EvTag x={1760} y={890} ax="right" kind="illustrative" text="hand-chosen worksheet" o={tagO} />
      <Header t={t} part={4} title={P.title} />
      <ArchMap on={['c', 'f']} o={inv(0, 0.5, t)} />
    </Stage>
  );
};
