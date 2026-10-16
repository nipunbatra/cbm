// PCBM review: 19 slides, with a four-slide CLIP introduction in S16Primer.
import React from 'react';
import { C } from '../kit/theme';
import { E, HText, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, bs, be, bw, bh, inv, type SceneProps } from '../kit/core';
import { ArchMap, Block, Credit, EvTag, Flow, MathSvg, Person, PhotoR, ShareBars, VecCol, rgba, VariantCard, type VariantRows } from '../kit/cbm';
import { lerp } from '../kit/anim';
import { TexSteps } from '../kit/slots';
import { D } from '../kit/data';
import { S16Primer } from './S16Primer';
import { S16Standardisation } from './S16Standardisation';
import { S16Residual } from './S16Residual';

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
const CLS: string[] = WK.classes;
const SIZE: Record<string, [number, number]> = WK.photo_size;
const TEST: string[] = WK.test;
const NCORRECT = Math.round(PC.test_acc * WK.n_test);
const COLLECTIVE = '36 Wikimedia Commons photographs (CC BY-SA / CC BY / public domain)';
const sg = (v: number, d: number) => `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(d)}`;
const sgp = (v: number, d: number) => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(d)}`;
const tn = (v: number, d: number) => `${v < 0 ? '-' : ''}${Math.abs(v).toFixed(d)}`;
const short = (s: string) => s.replace(/^an? /, '');

const thumbFrac = (file: string, a: number): [number, number, number, number] => {
  const [iw, ih] = SIZE[file];
  const r = ih / iw;
  if (r > a) { const s = a / r; return [0, (1 - s) / 2, 1, (1 + s) / 2]; }
  const s = r / a; return [(1 - s) / 2, 0, (1 + s) / 2, 1];
};

// ---- 16.10 the stripes score on a number line (real mean, spread and score)
const NL = { x0: 300, x1: 1620, v0: 0.17, v1: 0.3, y: 470 };
const nlx = (v: number) => NL.x0 + ((v - NL.v0) / (NL.v1 - NL.v0)) * (NL.x1 - NL.x0);
// ---- 16.21 recap: the four rows of s10 ("what changes"), plain CBM against this variant
const CMP_ROWS = ['concept source', 'detector', 'representation', 'what reaches the head'];
const CMP_CBM = ['people label every concept', 'a trained concept predictor', 'one number per concept', 'only the concept values'];
const CMP_PC = ['a concept bank of phrases', 'frozen CLIP + cosine similarity', 'one number per concept', 'concept scores, plus a residual in PCBM-h'];
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
  g: '\\ch_j = \\operatorname{standardise}(\\cos(\\cin{e}(x),\\ccon{v_j}))',
  c: '\\ch = (\\ch_1, \\dots, \\ch_k)\\ \\ \\text{standardised cosine scores}',
  f: '\\yh = \\fph(\\ch)\\ \\text{sparse linear}\\ \\ \\cleak{+\\,r(e(x))_{\\,\\text{PCBM-h}}}',
  train: '\\fph\\ \\text{only}\\ \\ (\\text{and } \\cleak{r} \\text{ in PCBM-h})',
  data: '\\{(x, y)\\}\\ +\\ \\text{concept bank}',
};

// ---- geometry
const ZR = (i: number) => 360 + i * 54; // slide 5 rows
const ZX = 820, ZS = 170;
const MR = (i: number) => 366 + i * 54; // slide 7 matrix rows
const MX = 800, MCW = 140;
const ST9 = { y: 470 }; // slide 9 row
const HO = { x0: 330, y0: 330, dx: 215, dy: 165, w: 195, h: 130 }; // slide 15: the 12 held-out photos, 2 rows of 6

export const S16: React.FC<SceneProps> = ({ t, P }) => {
  const current = (k: number) => [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 7, 9, 0, 11, 12, 14, 15, 0, 0, 0, 0, 18, 19][k];
  const b = (k: number) => bs(P, current(k));
  const w = (k: number, word: string, n = 0) => bw(P, current(k), word, n);
  const at = (x: number, d = 0.4) => inv(x, x + d, t);
  const NB = P.beats.length;
  const span = (k0: number, k1: number) => {
    if (!current(k0) || !current(k1)) return 0;
    const fin = inv(b(k0) - 0.05, b(k0) + 0.25, t);
    if (current(k1) >= NB) return fin;
    const z = Math.min(be(P, current(k1)) + 0.02, bs(P, current(k1) + 1) - 0.34);
    return fin * (1 - inv(z, z + 0.3, t));
  };
  const so = (k: number) => span(k, k);
  const oo = (s: number, v = 1) => s * v;

  // ---------------- 16.5
  const s5 = so(11);
  const z5 = (i: number) => E.out(inv(b(11) + 0.1 + i * 0.08, b(11) + 0.6 + i * 0.08, t));
  const hi5 = at(w(11, 'black') - 0.1);
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

  // ---------------- 16.12
  const s12 = so(22);
  const legO = at(w(22, 'j') - 0.1);
  // ---------------- 16.21 recap
  const sR = so(21);
  const cmpRow = (i: number) => at(b(21) + 0.15 + i * 0.15, 0.35);
  const cmpT = [w(21, 'concepts'), w(21, 'frozen'), 0, w(21, 'hybrid')];
  const cmpHi = (i: number) => at(cmpT[i] - 0.1, 0.4);
  const cmpSame = at(w(21, 'still') - 0.1);
  const cardP = [w(22, 'cosine'), w(22, 'Standardise'), w(22, 'sparse'), w(22, 'Only'), w(22, 'images')].reduce((s, x) => s + inv(x - 0.1, x + 0.4, t), 0) / 5;


  return (
    <Stage>
      {/* ================= photos ================= */}
      {s15h > 0.001 ? TEST.map((f, k) => (
        <PhotoR key={f} R={{ x: HO.x0 + (k % 6) * HO.dx, y: HO.y0 + Math.floor(k / 6) * HO.dy, w: HO.w, h: HO.h }} src={`worked/${f}`} frac={thumbFrac(f, HO.h / HO.w)} o={s15h * th8(k)} radius={6} shadow={false} />
      )) : null}

      <Svg>
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

      </Svg>

      {/* ================= HTML text ================= */}
      <Header t={t} part={10} title={P.title} />

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

      {/* slide 18 */}
      <SlideHead text={bh(P, current(22))} o={s12} />
      <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.86)', transformOrigin: '960px 290px' }}>
        <VariantCard name="Post-hoc CBM (Yuksekgonul et al., ICLR 2023)" rows={VROWS} o={s12} p={cardP} y0={290} />
      </div>
      <Rich x={960} y={912} ax="center" size={28} color={C.chalk2} text="$\cin{e}$: image vector   ·   $\ccon{v_j}$: phrase vector   ·   $\cleak{r}$: residual" o={oo(s12, legO)} />

      {/* new slide 21: recap against the plain CBM */}
      <SlideHead text={bh(P, current(21))} o={sR} />
      <CompareText o={sR} name="post-hoc CBM" cells={CMP_PC} rowO={cmpRow} hiO={cmpHi} changed={CMP_CHANGED} />
      <Rich x={196} y={850} size={30} color={C.chalk2} text="{c:3 of 4} changed; each concept is still one number" o={oo(sR, cmpSame)} />

      <S16Primer t={t} P={P} />
      <S16Standardisation t={t} P={P} />
      <S16Residual t={t} P={P} />
      <ArchMap on={['g', 'c']} o={inv(0, 0.5, t)} />
    </Stage>
  );
};
