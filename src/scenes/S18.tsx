// s18 Part 10 · Language in a Bottle (LaBo, Yang et al., CVPR 2023). Revision 2: one slide per beat.
// 18.1 direct scoring continues: PCBM phrase bank to LaBo description selection
// 18.2 intuition: three class sentences, CLIP reads them, the real scores (100 x cosine) of the worked photo are the concepts
// 18.3 the four steps, each with its helper (same layout as 17.3)
// 18.4 step 1: the prompt and the REAL Gemini JSON reply (eight zebra sentences, D.worked.llm.labo.zebra)
// 18.5 intuition, part 1: a good sentence separates its class (real raw margins of two zebra sentences)
// 18.6 intuition, part 2: a good set does not repeat itself (real coverage gains of the three zebra picks)
// 18.7 to 18.9 the selection table for zebra (one visual over three slides): 18.7 discriminability rescaled within the
// class, worked for large striped ears; 18.8 coverage in words, then the greedy score formula; 18.9 the picks, round 1 worked
// 18.10 the nine chosen sentences   18.11 step 3: the worked photo -> CLIP -> nine scores x 100 (D.worked.labo.example_scores),
// phi / psi / s_j named   18.12 step 4: the 3 x 9 language prior (block, 1/3)   18.13 the prior's prediction: three
// averages, shares 0.98, 11 / 12   18.14 why a prior helps: a head from zero vs the prior; linear probe defined
// 18.15 the 18.12 grid after training (W_trained), 12 / 12   18.16 stripes: ears, or stripes anywhere?
// 18.17 what changed compared with the plain CBM   18.18 VariantCard.
import React from 'react';
import { C, F } from '../kit/theme';
import { E, Header, HText, Rich, SlideHead, Stage, Svg, Tex, Txt, bs, be, bw, bh, inv, type SceneProps } from '../kit/core';
import { Block, Credit, EvTag, Flow, MathSvg, PhotoR, ShareBars, rgba, ux, vy, type Rect, VariantCard, type VariantRows } from '../kit/cbm';
import { lerp, wob } from '../kit/anim';
import { BText, TexSteps } from '../kit/slots';
import { D } from '../kit/data';

const WK = D.worked;
const LB = WK.labo;
const MODEL: string = WK.llm.model;
const CLASSES: string[] = WK.classes;
const EX: string = WK.example;
const PS: Record<string, [number, number]> = WK.photo_size;
const HEADC = '#9AA6B5';
const SEL: { class: string; concept: string; disc_norm: number; coverage_gain: number; score: number }[] = LB.selected;
const SCORES: number[] = LB.example_scores;
const W0: number[][] = LB.W_prior;
const WT: number[][] = LB.W_trained;
const N_TEST: number = WK.n_test;
const ACC0 = Math.round(LB.test_acc_prior * N_TEST), ACC1 = Math.round(LB.test_acc_trained * N_TEST);
const N_CAND: number = LB.candidates.length;
const PER = SEL.length / CLASSES.length; // sentences chosen per class (3)
const RULEW = ((LB.selection_rule as string).match(/[\d.]+/g) ?? []).map(Number).slice(0, 2); // [0.7, 0.3]
const credit = (f: string) => `Photo: ${WK.photo_credit[f].artist}, Wikimedia Commons, ${WK.photo_credit[f].license}`;
const EVTXT = 'CLIP ViT-B/32 on 36 Commons photos, teaching example';
const [PW, PH] = PS[EX];
const strip = (s: string) => s.replace(/\.$/, '');

// zebra candidates in the reply's order, discriminability normalised within the class (as in the selection rule)
const ZC: { concept: string; disc: number }[] = (LB.candidates as { concept: string; class: string; disc: number }[]).filter((c) => c.class === 'zebra');
const dmin = Math.min(...ZC.map((c) => c.disc)), dmax = Math.max(...ZC.map((c) => c.disc));
const DN = ZC.map((c) => (c.disc - dmin) / (dmax - dmin));
const ZSEL = SEL.filter((s) => s.class === 'zebra');
const pickOf = (c: string) => ZSEL.findIndex((s) => s.concept === strip(c) || s.concept === c);

// 18.2 intuition: the first pick of each class and its real score on the worked photo
const INT = CLASSES.map((c) => SEL.findIndex((r) => r.class === c));
// 18.4 two zebra sentences with their raw discriminability (own-class mean similarity minus the best other class)
const SEP = ['Bold black and white stripes', 'Stocky horse-like body'].map((c) => ZC.find((z) => z.concept === c) as { concept: string; disc: number });
const DMAX = Math.max(...ZC.map((c) => Math.abs(c.disc)));

// final beat ("In symbols"): the variant card
const VROWS: VariantRows = {
  g: '\\ch_j = 100\\cos(\\cin{\\phi}(x),\\ \\cin{\\psi}(s_j))\\ \\ \\text{(CLIP, frozen)}',
  c: `\\ch \\in \\mathbb{R}^{k},\\ k = ${SEL.length}\\ \\ \\text{one per chosen sentence}`,
  f: '\\yh = \\fph(\\ch)\\ \\ \\text{linear}',
  train: '\\fph\\ \\text{only, initialised from the language prior}',
  data: '\\{(x, y)\\}',
};

// ------------------------------------------------------------------ helpers
const Slide: React.FC<{ o: number; children?: React.ReactNode }> = ({ o, children }) =>
  o <= 0.001 ? null : <div style={{ position: 'absolute', inset: 0, opacity: o < 0.999 ? o : undefined }}>{children}</div>;

/** the real JSON reply, one item per line (monospace; keys chalk2, strings teal) */
const JsonCard: React.FC<{ x: number; y: number; w: number; raw: string; n: number; o?: number; size?: number }> = ({ x, y, w, raw, n, o = 1, size = 26 }) => {
  if (o <= 0.001) return null;
  const items: string[] = JSON.parse(raw).items;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, opacity: o, fontFamily: F.mono, fontSize: size, lineHeight: 1.45, color: C.mute,
      background: C.bg2, border: `1.5px solid ${C.line2}`, borderRadius: 12, padding: '14px 22px', boxSizing: 'border-box', whiteSpace: 'pre',
    }}>
      <div>{'{'}<span style={{ color: C.chalk2 }}>"items"</span>{': ['}</div>
      {items.map((s, i) => (
        <div key={i} style={{ opacity: i < n ? 1 : 0 }}>{'  '}<span style={{ color: C.concept }}>{`"${s}"`}</span>{i < items.length - 1 ? ',' : ''}</div>
      ))}
      <div style={{ opacity: n >= items.length ? 1 : 0 }}>{']}'}</div>
    </div>
  );
};

/** a sentence with every word that starts with "strip" emphasised (18.10) */
const StripeTxt: React.FC<{ x: number; y: number; text: string; size: number; hi: number; fill: string }> = ({ x, y, text, size, hi, fill }) => (
  <text x={x} y={y} fontSize={size} fontWeight={500} fill={fill} dominantBaseline="central" fontFamily={F.sans}>
    {text.split(' ').map((wd, i) => {
      const s = /^strip/i.test(wd) && hi > 0.5;
      return <tspan key={i} fill={s ? C.concept : undefined} fontWeight={s ? 700 : undefined}>{`${i ? ' ' : ''}${wd}`}</tspan>;
    })}
  </text>
);

/** a magnifier glyph: lens centred at (x, y) with radius r, handle to the lower right */
const Magnifier: React.FC<{ x: number; y: number; r: number; o?: number; color?: string }> = ({ x, y, r, o = 1, color = C.chalk }) =>
  o <= 0.001 ? null : (
    <g opacity={o}>
      <circle cx={x} cy={y} r={r + 3} fill="none" stroke="#0B0F14" strokeWidth={8} opacity={0.5} />
      <circle cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={5} />
      <line x1={x + r * 0.72} y1={y + r * 0.72} x2={x + r * 1.45} y2={y + r * 1.45} stroke={color} strokeWidth={10} strokeLinecap="round" />
    </g>
  );

/** four numbered step dots, top right */
const StepTrack: React.FC<{ cur: number; o: number }> = ({ cur, o }) =>
  o <= 0.001 ? null : (
    <g opacity={o < 0.999 ? o : undefined}>
      <Txt x={1602} y={80} size={20} mono weight={600} anchor="end" fill={C.mute}>STEP</Txt>
      {[0, 1, 2, 3].map((i) => {
        const x = 1634 + i * 46, on = i + 1 === cur, done = i + 1 < cur;
        return (
          <g key={i}>
            {i ? <line x1={x - 30} x2={x - 16} y1={80} y2={80} stroke={C.line2} strokeWidth={2} /> : null}
            <circle cx={x} cy={80} r={15} fill={on ? C.chalk : done ? C.mute : 'none'} stroke={on ? C.chalk : C.mute} strokeWidth={2} />
            <Txt x={x} y={81} size={18} mono weight={700} fill={on || done ? '#0B0F14' : C.mute}>{String(i + 1)}</Txt>
          </g>
        );
      })}
    </g>
  );

export const S18: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.5) => inv(x, x + d, t);
  const NB = P.beats.length;
  const fin = (k: number) => inv(b(k) - 0.05, b(k) + 0.25, t);
  const fout = (k: number) => (k <= NB ? 1 - inv(b(k) - 0.35, b(k) - 0.05, t) : 1); // fade before beat k starts
  /** slide k: fades in on the beat's first words, fades out (0.3 s) just before the next beat */
  const sl = (k: number) => fin(k) * (k < NB ? fout(k + 1) : 1);
  /** a visual held over beats k0..k1 */
  const span = (k0: number, k1: number) => fin(k0) * (k1 < NB ? fout(k1 + 1) : 1);
  void be;

  // step track: beats 4..15 are steps 1, 2 (x6: separate, repeat, discriminability, greedy, picks, nine), 3, 4 (x4)
  const STEP = [0, 0, 0, 0, 1, 2, 2, 2, 2, 2, 2, 3, 4, 4, 4, 4, 0, 0, 0];
  const beatNow = (() => { let k = 1; for (let i = 1; i <= NB; i++) if (t >= b(i) - 0.35) k = i; return k; })();
  const trackO = at(b(4) - 0.2, 0.4) * fout(16);

  // ---------------- 18.1 comparison
  const s1lb = at(w(1, 'Language') - .1), s1path = at(w(1, 'prediction') - .1);

  // ---------------- 18.2 intuition
  const s2s = (i: number) => at(w(2, 'sentences') - 0.1 + i * 0.2, 0.4);
  const s2ph = at(w(2, 'CLIP') - 0.2), s2clip = at(w(2, 'CLIP') - 0.1);
  const s2bar = (i: number) => E.out(at(w(2, 'similarity') + i * 0.15, 0.6));
  const s2live = at(w(2, 'similarity'), 0.5);
  const s2dir = at(w(2, 'directly') - 0.1), s2x100 = at(w(2, '100') - 0.1);
  const s2hi = [at(w(2, 'stripes') - 0.1, 0.3), at(w(2, 'mane') - 0.1, 0.3), at(w(2, 'neck') - 0.1, 0.3)];

  // ---------------- 18.3 four steps
  const s3st = [at(w(3, 'writes') - 0.2), at(w(3, 'selection') - 0.2), at(w(3, 'scores') - 0.2), at(w(3, 'linear') - 0.2)];
  const s3g = at(w(3, 'guess') - 0.1);

  // ---------------- 18.4 JSON
  const s4p = at(b(4) + 0.1), s4card = at(w(4, 'JSON') - 0.3, 0.4);
  const s4n = Math.floor(inv(w(4, 'JSON') - 0.2, w(4, 'JSON') + 1.0, t) * 10);
  const s4cnt = at(w(4, 'zebra') - 0.1);

  // ---------------- 18.5 a good sentence separates
  const s5ax = at(w(5, 'average') - 0.1);
  const s5r = [at(w(5, 'Bold') - 0.1), at(w(5, 'Stocky') - 0.1)];
  const s5bar = [E.out(at(w(5, 'Bold') + 0.3, 0.7)), E.out(at(w(5, 'Stocky') + 0.3, 0.7))];
  const s5v = [at(w(5, 'widest') - 0.1), at(w(5, 'nothing') - 0.2)];

  // ---------------- 18.6 a good set does not repeat itself
  const s6r = [at(w(6, 'Once') - 0.1), at(w(6, 'second', 1) - 0.1), at(w(6, 'second', 1) + 0.3)];
  const s6bar = (i: number) => E.out(inv(0.2, 1, s6r[i]));
  const s6l = at(w(6, 'much') - 0.1);

  // ---------------- 18.7 to 18.9 selection table
  const tabO = span(7, 9);
  const rowIn = (i: number) => at(b(7) + 0.1 + i * 0.07, 0.35);
  const discIn = (i: number) => E.out(at(w(7, 'Discriminability') - 0.2 + i * 0.08, 0.6));
  const l3 = at(w(7, 'rescaled') - 0.2) * fout(8);
  const earsHi = at(w(7, 'Large') - 0.1, 0.4) * fout(8);
  const earsEq = at(w(7, 'Large') - 0.1, 0.4) * fout(8);
  const covHead = at(w(8, 'Coverage') - 0.1);
  const l4 = at(w(8, 'Coverage') - 0.1) * fout(9);
  const eq4 = at(w(8, '0.7') - 0.1, 0.5);
  const pickT = [w(9, 'bold'), w(9, 'unique'), w(9, 'large')];
  const pickP = (k: number) => (k < 0 ? 0 : E.out(at(pickT[k] - 0.1, 0.5)));
  const dimRest = at(pickT[2] + 0.8, 0.5);
  const r1: [string, number][] = [
    [`\\text{round 1, stripes: }\\ ${RULEW[0]} \\times ${ZSEL[0].disc_norm.toFixed(2)}`, w(9, '0.7') - 0.1],
    [`{} + ${RULEW[1]} \\times ${ZSEL[0].coverage_gain.toFixed(2)}`, w(9, '0.3') - 0.1],
    [`{} = ${ZSEL[0].score.toFixed(2)}`, w(9, '0.91') - 0.1],
  ];

  // ---------------- 18.10 nine sentences
  const s10col = [at(b(10) + 0.1), at(w(10, 'horse') - 0.2), at(w(10, 'giraffe') - 0.2)];

  // ---------------- 18.11 CLIP scores
  const s11ph = at(b(11) + 0.05), s11clip = at(w(11, 'CLIP') - 0.1);
  const s11bar = (i: number) => E.out(at(w(11, 'scores') + 0.1 + i * 0.1, 0.5));
  const s11live = at(w(11, 'scores') + 0.3, 0.5);
  const s11neck = at(w(11, 'bottleneck') - 0.2);
  const s11eq = at(w(11, 'Score') - 0.1, 0.5), s11phi = at(w(11, 'phi') - 0.1), s11psi = at(w(11, 'psi') - 0.1);

  // ---------------- 18.12 and 18.15 weight grid (prior, then trained)
  const gridO = sl(12) + sl(15);
  const g12 = at(w(12, 'linear') - 0.1);
  const g12prior = (i: number) => at(w(12, 'own') - 0.5 + i * 0.05, 0.35);
  const g12l = at(w(12, 'one') - 0.1) * fout(13);
  const trainK = E.io(inv(w(15, 'moves') - 0.1, w(15, 'moves') + 1.4, t));
  const g15acc = at(w(15, 'all') - 0.1);
  const g15lab = at(b(15) + 0.1);

  // ---------------- 18.13 the prior's prediction
  const s13w = at(b(13) + 0.1);
  const s13sh = at(w(13, 'shares') - 0.2, 0.3), s13shp = inv(w(13, 'shares') - 0.1, w(13, 'shares') + 0.9, t);
  const s13acc = at(w(13, '11') - 0.1);

  // ---------------- 18.14 why a prior helps
  const s14z = at(w(14, 'zero') - 0.2), s14zl = at(w(14, 'labels') - 0.1);
  const s14p = at(w(14, 'prior', 1) - 0.2), s14acc = at(w(14, 'already') + 0.1);
  const s14probe = at(w(14, 'probe') - 0.2), s14pap = at(w(14, 'paper') - 0.1);

  // ---------------- 18.16 stripes
  const s16s = at(b(16) + 0.1), s16hi = at(w(16, 'all') - 0.1, 0.4);
  const s16ph = at(w(16, 'Is') - 0.2), s16mag = at(w(16, 'striped') - 0.1, 0.4), s16any = at(w(16, 'anywhere') - 0.2, 0.4);
  const s16c = at(w(16, 'scores') - 0.1);

  // ---------------- 18.17 what changed compared with the plain CBM
  const s17h = at(b(17) + 0.1);
  const s17r = [at(w(17, 'language') - 0.1), at(w(17, 'directly') - 0.1), at(w(17, 'head') - 0.1)];
  const s17o = at(w(17, 'Only') - 0.1);

  // ---------------- 18.18 card
  const L = NB;
  const cardP = [w(L, 'g'), w(L, 'hat'), w(L, 'f'), w(L, 'starts'), w(L, 'data')].reduce((s, x) => s + inv(x - 0.1, x + 0.4, t), 0) / 5;

  // geometry
  const ex2: Rect = { x: 160, y: 420, w: 300, h: (300 * PH) / PW };
  const Y2 = [440, 560, 680];
  const Y5 = [480, 650], AX5 = 1180, U5 = 300 / DMAX; // 18.5 signed bars around the zero line
  const Y6 = [460, 570, 680], B6X = 920, B6W = 560;
  const TROW = (i: number) => 376 + i * 50; // selection table rows
  const TX = 200, DBX = 900, DBW = 220, CGX = 1290, SCX = 1450, PKX = 1610;
  const EARS = ZC.findIndex((c) => c.concept === 'Large striped ears');
  const ex11: Rect = { x: 160, y: 350, w: 330, h: (330 * PH) / PW };
  const R11 = (i: number) => 350 + i * 48 + Math.floor(i / 3) * 16; // 18.11 rows
  const S11X = 760, B11X = 1290, B11W = 220, BMAX = 30;
  const MX = 430, MCW = 112, MY = 470, MCH = 84; // 18.12 grid: 3 rows (classes) x 9 columns (sentences)
  const G14 = [300, 1100], G14Y = 450, G14C = 52; // 18.14 mini grids
  const big: Rect = { x: 900, y: 330, w: 860, h: (860 * PH) / PW };
  const sharesNow = CLASSES.map((_, c) => lerp(LB.probs_prior[c], LB.probs_trained[c], trainK));
  const R17Y = [450, 565, 680], C17 = [1010, 1450]; // 18.17 comparison rows, column centres
  const f1 = (v: number) => v.toFixed(1);
  const avgTex = (c: number) => `\\tfrac{1}{3}(${[0, 1, 2].map((k) => `\\ccon{${f1(SCORES[c * PER + k])}}`).join(' + ')})`;

  return (
    <Stage>
      <Header t={t} part={10} title={P.title} />
      <Svg><StepTrack cur={STEP[beatNow] ?? 0} o={trackO} /></Svg>

      {/* ============================================================ 18.1 direct scoring: PCBM to LaBo */}
      <Slide o={sl(1)}>
        <SlideHead text={bh(P, 1)} />
        <HText x={180} y={310} size={29} color={C.chalk2}>Language in a Bottle (LaBo)</HText>
        <Rich x={180} y={420} size={33} text="PCBM example: {c:hand-chosen phrases}" />
        <Rich x={180} y={500} size={33} text="LaBo: {c:propose and select descriptions}; initialise the {f:head}" o={s1lb} />
        <Svg o={s1path}>
          <Block x={280} y={710} w={260} h={110} title="image + phrases" kind="input" size={28} />
          <Flow pts={[[425,710],[520,710]]} color={C.input} />
          <Block x={690} y={710} w={310} h={110} title="frozen CLIP" kind="input" />
          <Flow pts={[[860,710],[950,710]]} color={C.concept} />
          <Block x={1120} y={710} w={310} h={110} title="concept scores" kind="concept" />
          <Flow pts={[[1290,710],[1360,710]]} color={C.concept} />
          <Block x={1500} y={710} w={250} h={110} title="class head" sub="learned" kind="head" />
          <Flow pts={[[1640,710],[1720,710]]} color={C.chalk} />
          <Txt x={1760} y={710} size={29}>class</Txt>
        </Svg>
        <HText x={960} y={880} ax="center" size={33} o={s1path}>Same rung. Same prediction path. A different concept bank and head initialisation.</HText>
        <EvTag x={180} y={965} kind="schematic" text="both are direct CLIP scoring approaches in this lecture" />
      </Slide>

      {/* ============================================================ 18.2 intuition: CLIP reads sentences */}
      <Slide o={sl(2)}>
        <SlideHead text={bh(P, 2)} />
        <PhotoR R={ex2} src={`worked/${EX}`} o={s2ph} border={C.input} />
        <Credit x={160} y={906} text={credit(EX)} o={s2ph} />
        <Svg>
          <Flow pts={[[ex2.x + ex2.w + 8, Y2[1]], [570, Y2[1]]]} color={C.input} p={s2clip} t={t} live={s2live} head={12} />
          <Block x={640} y={Y2[1]} w={130} h={96} kind="input" title="CLIP" size={30} o={s2clip} />
          <g opacity={s2clip < 0.999 ? s2clip : undefined}>
            <line x1={705} y1={Y2[1]} x2={730} y2={Y2[1]} stroke={C.input} strokeWidth={3} />
            <line x1={730} y1={Y2[0]} x2={730} y2={Y2[2]} stroke={C.input} strokeWidth={3} />
            {Y2.map((y, i) => <line key={i} x1={730} y1={y} x2={760} y2={y} stroke={C.input} strokeWidth={2.5} />)}
            {s2live > 0.001 ? Y2.map((y, i) => {
              const u = (t * 0.6 + i * 0.37) % 1;
              return <circle key={i} cx={730} cy={lerp(Y2[1], y, u)} r={5} fill={C.input} opacity={s2live * Math.sin(Math.PI * u)} />;
            }) : null}
          </g>
          {INT.map((j, i) => {
            const o = s2s(i);
            if (o <= 0.001) return null;
            const y = Y2[i], p = s2bar(i), hi = s2hi[i];
            return (
              <g key={j} opacity={o < 0.999 ? o : undefined}>
                <rect x={770} y={y - 36} width={660} height={72} rx={12} fill={rgba(C.concept, 0.07 + 0.1 * hi)} stroke={rgba(C.concept, 0.5 + 0.45 * hi)} strokeWidth={2 + hi} />
                <Txt x={790} y={y - 12} size={20} anchor="start" mono fill={C.mute}>{CLASSES[i]}</Txt>
                <Txt x={790} y={y + 14} size={28} anchor="start" fill={C.chalk}>{strip(SEL[j].concept)}</Txt>
                <rect x={1460} y={y - 14} width={200} height={28} rx={4} fill={C.bg3} opacity={p} />
                <rect x={1460} y={y - 14} width={(200 * SCORES[j] * p) / BMAX} height={28} rx={4} fill={C.concept} opacity={0.9} />
                <Txt x={1680} y={y} size={28} anchor="start" mono weight={700} fill={C.chalk} o={inv(0.4, 1, p)}>{SCORES[j].toFixed(1)}</Txt>
              </g>
            );
          })}
        </Svg>
        <Rich x={1560} y={330} ax="center" size={24} color={C.chalk2} text="100 × CLIP's cosine" o={s2bar(0)} />
        <Rich x={1560} y={364} ax="center" size={22} color={C.mute} text={`stripes: ${(SCORES[0] / 100).toFixed(3)} × 100 = ${SCORES[0].toFixed(1)}`} o={s2x100} />
        <Rich x={960} y={790} ax="center" size={32} text="these scores are the {c:concepts}: nothing is trained to imitate {x:CLIP}" o={s2dir} />
        <EvTag x={1760} y={900} ax="right" kind="computed" text={`${EVTXT}; worked photo`} o={s2bar(0)} />
      </Slide>

      {/* ============================================================ 18.3 four steps */}
      <Slide o={sl(3)}>
        <SlideHead text={bh(P, 3)} />
        <Svg>
          {[
            ['write sentences for each class', 'language model', C.chalk2],
            ['keep the most useful sentences', 'a selection rule', C.chalk2],
            ['score every image against them', 'CLIP', C.input],
            ['fit a linear head', 'class labels', C.chalk],
          ].map(([s, who, col], i) => {
            const o = s3st[i];
            if (o <= 0.001) return null;
            const y = 380 + i * 110;
            return (
              <g key={s} opacity={o < 0.999 ? o : undefined}>
                <circle cx={360} cy={y} r={26} fill="none" stroke={C.chalk2} strokeWidth={2.5} />
                <Txt x={360} y={y + 1} size={26} mono weight={700} fill={C.chalk}>{String(i + 1)}</Txt>
                <Txt x={416} y={y} size={36} anchor="start" fill={C.chalk}>{s}</Txt>
                <line x1={1010} x2={1110} y1={y} y2={y} stroke={C.line2} strokeWidth={2} strokeDasharray="5 6" />
                <Txt x={1140} y={y} size={32} anchor="start" weight={i === 3 ? 700 : 600} fill={col}>{who}</Txt>
              </g>
            );
          })}
        </Svg>
        <Rich x={416} y={380 + 3 * 110 + 34} size={28} color={C.chalk2} text="started from a guess: the language prior" o={s3g} />
      </Slide>

      {/* ============================================================ 18.4 step 1: sentences as JSON */}
      <Slide o={sl(4)}>
        <SlideHead text={bh(P, 4)} />
        <HText x={160} y={360} size={22} mono color={C.mute} o={s4p}>PROMPT · zebra</HText>
        <HText x={160} y={396} w={620} size={30} lh={1.35} o={s4p}>{WK.llm.labo.zebra.prompt}</HText>
        <Rich x={160} y={640} w={620} size={30} text={`{c:${WK.llm.labo.zebra.items.length} sentences} × ${CLASSES.length} classes = ${N_CAND} candidates`} o={s4cnt} />
        <Svg><Flow pts={[[800, 430], [880, 430]]} color={C.concept} p={s4card} head={14} /></Svg>
        <JsonCard x={900} y={340} w={820} raw={WK.llm.labo.zebra.raw} n={s4n} o={s4card} />
        <EvTag x={900} y={800} kind="computed" text={`real reply · ${MODEL}`} o={s4card} />
      </Slide>

      {/* ============================================================ 18.5 a good sentence separates its class */}
      <Slide o={sl(5)}>
        <SlideHead text={bh(P, 5)} />
        <Svg>
          <g opacity={s5ax < 0.999 ? s5ax : undefined}>
            <line x1={AX5} x2={AX5} y1={400} y2={730} stroke={C.line2} strokeWidth={2.5} />
            <Txt x={AX5} y={752} size={22} mono fill={C.mute}>0</Txt>
          </g>
          {SEP.map((c, i) => {
            const o = s5r[i];
            if (o <= 0.001) return null;
            const y = Y5[i], v = c.disc, good = v > 0;
            const bw0 = Math.abs(v) * U5 * s5bar[i];
            return (
              <g key={c.concept} opacity={o < 0.999 ? o : undefined}>
                <rect x={160} y={y - 36} width={560} height={72} rx={12} fill={rgba(C.concept, 0.08)} stroke={rgba(C.concept, 0.6)} strokeWidth={2} />
                <Txt x={184} y={y + 1} size={30} anchor="start" fill={C.chalk}>{c.concept}</Txt>
                <rect x={good ? AX5 : AX5 - bw0} y={y - 18} width={bw0} height={36} rx={5} fill={good ? C.concept : C.bad} opacity={0.85} />
                <Txt x={good ? AX5 + bw0 + 14 : AX5 - bw0 - 14} y={y} size={28} mono weight={700} anchor={good ? 'start' : 'end'} fill={C.chalk}
                  o={inv(0.5, 1, s5bar[i])}>{`${good ? '+' : '−'}${Math.abs(v).toFixed(3)}`}</Txt>
              </g>
            );
          })}
        </Svg>
        <Rich x={AX5} y={340} ax="center" size={26} color={C.chalk2} text="margin = average CLIP score on {y:zebra} photos" o={s5ax} />
        <Rich x={AX5} y={376} ax="center" size={26} color={C.chalk2} text="minus the average on the best other class" o={s5ax} />
        <Rich x={1760} y={Y5[0] + 50} ax="right" size={28} weight={650} text="separates: widest margin of the eight" color={C.good} o={s5v[0]} />
        <Rich x={1760} y={Y5[1] + 50} ax="right" size={28} weight={650} text="separates nothing" color={C.bad} o={s5v[1]} />
        <EvTag x={1760} y={900} ax="right" kind="computed" text={`${EVTXT}; mean CLIP similarity on the training photos`} o={s5r[0]} />
      </Slide>

      {/* ============================================================ 18.6 a good set does not repeat itself */}
      <Slide o={sl(6)}>
        <SlideHead text={bh(P, 6)} />
        <Svg>
          {ZSEL.map((s, i) => {
            const o = s6r[i];
            if (o <= 0.001) return null;
            const y = Y6[i], p = s6bar(i);
            return (
              <g key={s.concept} opacity={o < 0.999 ? o : undefined}>
                <Txt x={160} y={y} size={24} anchor="start" mono fill={C.mute}>{['1st', '2nd', '3rd'][i]}</Txt>
                <StripeTxt x={240} y={y} text={s.concept} size={30} hi={1} fill={C.chalk} />
                <rect x={B6X} y={y - 18} width={B6W} height={36} rx={5} fill={C.bg3} />
                <rect x={B6X} y={y - 18} width={(B6W * s.coverage_gain * p) / ZSEL[0].coverage_gain} height={36} rx={5} fill={C.concept} opacity={0.85} />
                <Txt x={B6X + B6W + 20} y={y} size={30} mono weight={700} anchor="start" fill={C.chalk} o={inv(0.5, 1, p)}>{s.coverage_gain.toFixed(2)}</Txt>
              </g>
            );
          })}
        </Svg>
        <Rich x={160} y={380} size={26} color={C.chalk2} text="sentence added to the set" o={s6r[0]} />
        <Rich x={B6X} y={380} size={26} color={C.chalk2} text="what it adds that is new" o={s6r[0]} />
        <Rich x={960} y={790} ax="center" size={32} text="once {c:stripes} are covered, another {c:stripes} sentence adds little" o={s6l} />
        <EvTag x={1760} y={900} ax="right" kind="computed" text={`${EVTXT}; coverage gains of the zebra picks`} o={s6r[0]} />
      </Slide>

      {/* ============================================================ 18.7 to 18.9 selection table (one visual over three slides) */}
      <Slide o={sl(7)}><SlideHead text={bh(P, 7)} /></Slide>
      <Slide o={sl(8)}><SlideHead text={bh(P, 8)} /></Slide>
      <Slide o={sl(9)}><SlideHead text={bh(P, 9)} /></Slide>
      <Slide o={tabO}>
        <Svg>
          <Txt x={TX} y={326} size={22} anchor="start" weight={600} fill={C.mute}>ZEBRA CANDIDATES</Txt>
          <Txt x={DBX + DBW / 2} y={326} size={22} weight={600} fill={C.chalk2} o={discIn(0)}>discriminability</Txt>
          <Txt x={CGX} y={326} size={22} weight={600} fill={C.chalk2} o={covHead}>coverage gain</Txt>
          <Txt x={SCX} y={326} size={22} weight={600} fill={C.chalk2} o={eq4}>score</Txt>
          <Txt x={PKX} y={326} size={22} weight={600} fill={C.chalk2} o={pickP(0)}>pick</Txt>
          {ZC.map((c, i) => {
            const y = TROW(i);
            const pk = pickOf(c.concept);
            const pp = pickP(pk);
            const dim = pk < 0 ? dimRest : 0;
            const eh = i === EARS ? earsHi : 0;
            return (
              <g key={i} opacity={rowIn(i) * (1 - 0.6 * dim)}>
                {pp > 0.001 ? <rect x={TX - 16} y={y - 25} width={PKX + 40 - TX + 16} height={50} rx={10} fill={rgba(C.concept, 0.1 * pp)} stroke={rgba(C.concept, 0.7 * pp)} strokeWidth={2} /> : null}
                {eh > 0.001 ? <rect x={TX - 16} y={y - 25} width={DBX + DBW + 90 - TX + 16} height={50} rx={10} fill="none" stroke={C.chalk} strokeWidth={2.5} opacity={eh} /> : null}
                <Txt x={TX} y={y} size={28} anchor="start" fill={C.chalk}>{strip(c.concept)}</Txt>
                <rect x={DBX} y={y - 12} width={DBW} height={24} rx={4} fill={C.bg3} />
                <rect x={DBX} y={y - 12} width={DBW * DN[i] * discIn(i)} height={24} rx={4} fill={C.concept} opacity={0.85} />
                <Txt x={DBX + DBW + 14} y={y} size={22} anchor="start" mono fill={C.chalk2} o={discIn(i)}>{DN[i].toFixed(2)}</Txt>
                {pk >= 0 ? (
                  <g opacity={pp < 0.999 ? pp : undefined}>
                    <Txt x={CGX} y={y} size={24} mono weight={600} fill={C.chalk}>{ZSEL[pk].coverage_gain.toFixed(2)}</Txt>
                    <Txt x={SCX} y={y} size={24} mono weight={700} fill={C.chalk}>{ZSEL[pk].score.toFixed(2)}</Txt>
                    <circle cx={PKX} cy={y} r={18} fill={C.concept} />
                    <Txt x={PKX} y={y + 1} size={22} weight={700} mono fill="#0B0F14">{String(pk + 1)}</Txt>
                  </g>
                ) : null}
              </g>
            );
          })}
        </Svg>
        <Rich x={TX} y={TROW(7) + 46} w={1500} size={30} text="discriminability: the margin, rescaled within the class so the best is 1 and the worst is 0" o={l3} />
        <Tex x={TX} y={TROW(7) + 132} size={40} o={earsEq}
          tex={`\\text{large striped ears: }\\ (${ZC[EARS].disc.toFixed(3)} - (${dmin.toFixed(3)}))\\ /\\ (${dmax.toFixed(3)} - (${dmin.toFixed(3)})) = ${DN[EARS].toFixed(2)}`} />
        <Rich x={TX} y={TROW(7) + 46} w={1500} size={30} text="coverage gain: what a sentence adds beyond the {c:sentences} already chosen" o={l4} />
        <TexSteps x={TX} y={TROW(7) + 66} t={t} size={40} parts={r1} o={sl(9)} />
        <Tex x={TX} y={TROW(7) + 132} size={44}
          tex={`\\text{score} = ${RULEW[0]} \\times \\text{discriminability} + ${RULEW[1]} \\times \\text{coverage gain}`} o={eq4} />
        <EvTag x={1760} y={905} ax="right" kind="computed" text={EVTXT} o={discIn(0)} />
      </Slide>

      {/* ============================================================ 18.10 the nine sentences */}
      <Slide o={sl(10)}>
        <SlideHead text={bh(P, 10)} />
        {CLASSES.map((c, g) => (
          <React.Fragment key={c}>
            <HText x={420 + g * 540} y={370} ax="center" size={34} weight={700} o={s10col[g]}>{c}</HText>
            {SEL.filter((s) => s.class === c).map((s, i) => (
              <div key={s.concept} style={{
                position: 'absolute', left: 420 + g * 540 - 230, top: 430 + i * 110, width: 460, height: 90, boxSizing: 'border-box',
                display: 'flex', alignItems: 'center', gap: 16, padding: '0 18px', borderRadius: 12, opacity: s10col[g],
                background: rgba(C.concept, 0.08), border: `2px solid ${rgba(C.concept, 0.6)}`, fontFamily: F.sans, fontSize: 27, color: C.chalk, lineHeight: 1.2,
              }}>
                <span style={{ fontFamily: F.mono, fontWeight: 700, color: C.concept, fontSize: 24 }}>{i + 1}</span>
                <span>{strip(s.concept)}</span>
              </div>
            ))}
          </React.Fragment>
        ))}
        <Rich x={960} y={800} ax="center" size={32} text={`${PER} per class, picked greedily: {c:${SEL.length} sentences} in all`} o={s10col[2]} />
        <EvTag x={1760} y={900} ax="right" kind="computed" text={EVTXT} o={s10col[0]} />
      </Slide>

      {/* ============================================================ 18.11 step 3: CLIP scores = the bottleneck */}
      <Slide o={sl(11)}>
        <SlideHead text={bh(P, 11)} />
        <PhotoR R={ex11} src={`worked/${EX}`} o={s11ph} border={C.input} />
        <Credit x={ex11.x} y={ex11.y + ex11.h + 8} text={credit(EX)} o={s11ph} />
        <Svg>
          <Flow pts={[[ex11.x + ex11.w + 10, ex11.y + ex11.h / 2], [598, ex11.y + ex11.h / 2]]} color={C.input} p={s11clip} t={t} live={s11live} head={12} />
          <Block x={652} y={ex11.y + ex11.h / 2} w={100} h={90} kind="input" title="CLIP" size={26} o={s11clip} />
          <g opacity={s11clip < 0.999 ? s11clip : undefined}>
            <line x1={702} y1={ex11.y + ex11.h / 2} x2={726} y2={ex11.y + ex11.h / 2} stroke={C.input} strokeWidth={3} />
            <line x1={726} y1={R11(0)} x2={726} y2={R11(8)} stroke={C.input} strokeWidth={3} />
            {SEL.map((_, i) => <line key={i} x1={726} y1={R11(i)} x2={746} y2={R11(i)} stroke={C.input} strokeWidth={2} />)}
            {s11live > 0.001 ? SEL.map((_, i) => {
              const u = (t * 0.6 + i * 0.37) % 1;
              return <circle key={i} cx={726} cy={lerp(ex11.y + ex11.h / 2, R11(i), u)} r={5} fill={C.input} opacity={s11live * Math.sin(Math.PI * u)} />;
            }) : null}
          </g>
          {SEL.map((s, i) => {
            const y = R11(i), p = s11bar(i);
            return (
              <g key={i} opacity={s11clip < 0.999 ? s11clip : undefined}>
                <Txt x={S11X} y={y} size={24} anchor="start" fill={C.chalk}>{strip(s.concept)}</Txt>
                <rect x={B11X} y={y - 13} width={B11W} height={26} rx={4} fill={C.bg3} opacity={p} />
                <rect x={B11X} y={y - 13} width={(B11W * SCORES[i] * p) / BMAX} height={26} rx={4} fill={C.concept} opacity={0.9} />
                <Txt x={B11X + B11W + 14} y={y} size={24} anchor="start" mono weight={600} fill={C.chalk} o={inv(0.4, 1, p)}>{SCORES[i].toFixed(1)}</Txt>
              </g>
            );
          })}
          {CLASSES.map((c, g) => (
            <Txt key={c} x={1680} y={R11(g * 3 + 1)} size={24} anchor="start" weight={600} fill={C.chalk2} o={s11clip}>{c}</Txt>
          ))}
          <g opacity={s11neck < 0.999 ? s11neck : undefined}>
            <rect x={B11X - 14} y={R11(0) - 32} width={B11W + 112} height={R11(8) - R11(0) + 64} rx={14} fill="none" stroke={C.concept} strokeWidth={3} />
          </g>
        </Svg>
        <Rich x={B11X + B11W / 2 + 42} y={R11(8) + 46} ax="center" size={28} weight={650} text={`{c:the bottleneck: ${SEL.length} numbers}`} o={s11neck} />
        <Tex x={160} y={ex11.y + ex11.h + 90} size={40} tex={'\\ch_j = 100 \\cos\\!\\big(\\cin{\\phi(x)},\\ \\psi(\\ccon{s_j})\\big)'} o={s11eq} />
        <Rich x={160} y={ex11.y + ex11.h + 160} w={560} size={26} text="$\cin{\phi}$: CLIP's image encoder" o={s11phi} />
        <Rich x={160} y={ex11.y + ex11.h + 200} w={560} size={26} text="$\psi$: its text encoder; $\ccon{s_j}$: {c:sentence} $j$" o={s11psi} />
        <EvTag x={1760} y={900} ax="right" kind="computed" text={EVTXT} o={s11bar(0)} />
      </Slide>

      {/* ============================================================ 18.12 and 18.15 the weight grid: prior, then trained */}
      <Slide o={sl(12)}><SlideHead text={bh(P, 12)} /></Slide>
      <Slide o={sl(15)}><SlideHead text={bh(P, 15)} /></Slide>
      <Slide o={gridO}>
        <Svg>
          <g opacity={g12 < 0.999 ? g12 : undefined}>
            {CLASSES.map((c, g) => (
              <g key={c}>
                <Txt x={MX + (g * PER + PER / 2) * MCW} y={MY - 78} size={24} weight={600} fill={C.concept}>{`${c} sentences`}</Txt>
                <line x1={MX + g * PER * MCW + 10} x2={MX + (g + 1) * PER * MCW - 10} y1={MY - 58} y2={MY - 58} stroke={rgba(C.concept, 0.6)} strokeWidth={2} />
              </g>
            ))}
            {SEL.map((_, j) => <MathSvg key={j} x={MX + (j + 0.5) * MCW} y={MY - 26} tex={`\\ccon{s_{${j + 1}}}`} size={26} />)}
            <rect x={MX - 6} y={MY - 6} width={SEL.length * MCW + 12} height={3 * MCH + 12} rx={12} fill={C.headFill} stroke="#8792A2" strokeWidth={2.5} />
            {CLASSES.map((c, i) => (
              <Txt key={c} x={MX - 26} y={MY + (i + 0.5) * MCH} size={30} anchor="end" weight={700} fill={C.chalk}>{c}</Txt>
            ))}
            {CLASSES.map((_, i) => SEL.map((__, j) => {
              const v = lerp(W0[i][j], WT[i][j], trainK);
              const own = Math.floor(j / PER) === i;
              const shown = own ? g12prior(i * PER + (j % PER)) : 1;
              const a = Math.min(1, Math.abs(v) / 0.55);
              const x = MX + j * MCW, y = MY + i * MCH;
              const txt = trainK < 0.001 ? (own ? '1/3' : '0') : Math.abs(v) < 0.005 ? '0' : `${v < 0 ? '−' : ''}${Math.abs(v).toFixed(2)}`;
              return (
                <g key={`${i}-${j}`}>
                  <rect x={x + 4} y={y + 4} width={MCW - 8} height={MCH - 8} rx={7} fill={v > 0 ? rgba(HEADC, 0.06 + 0.5 * a * shown) : C.bg3}
                    stroke={v < -0.005 ? rgba(HEADC, 0.6 * a + 0.2) : 'none'} strokeWidth={2} strokeDasharray="5 4" />
                  <Txt x={x + MCW / 2} y={y + MCH / 2} size={own && trainK < 0.001 ? 28 : 24} mono weight={own ? 700 : 500} o={own ? shown : 1}
                    fill={Math.abs(v) < 0.005 ? C.mute : C.chalk}>{txt}</Txt>
                </g>
              );
            }))}
          </g>
          {/* shares for the worked zebra, after training */}
          <g opacity={g15lab < 0.999 ? g15lab : undefined}>
            <Flow pts={[[MX + SEL.length * MCW + 20, MY + 1.5 * MCH], [1530, MY + 1.5 * MCH]]} color={C.chalk2} head={12} />
            {CLASSES.map((c, i) => (
              <g key={c}>
                <Txt x={1556} y={MY + (i + 0.5) * MCH} size={28} anchor="start" weight={i === 0 ? 700 : 500} fill={i === 0 ? C.chalk : C.chalk2}>{c}</Txt>
                <Txt x={1760} y={MY + (i + 0.5) * MCH} size={28} anchor="end" mono weight={i === 0 ? 700 : 500} fill={i === 0 ? C.chalk : C.chalk2}>
                  {sharesNow[i].toFixed(trainK > 0.001 ? 3 : 2)}
                </Txt>
              </g>
            ))}
          </g>
        </Svg>
        <Rich x={1658} y={MY - 70} ax="center" size={24} color={C.chalk2} text="shares, this zebra" o={g15lab} />
        <Rich x={MX} y={MY + 3 * MCH + 30} size={30} text="language prior: each {y:class} puts 1/3 on each of its own three {c:sentences}, 0 elsewhere" o={g12l} />
        <Rich x={MX} y={MY + 3 * MCH + 30} size={30} text="after training with the {y:class labels}: small changes everywhere" o={g15lab} />
        <HText x={MX} y={MY + 3 * MCH + 100} size={34} weight={700} color={C.good} o={g15acc}>{`test photos right: ${ACC1} of ${N_TEST}`}</HText>
        <EvTag x={1760} y={900} ax="right" kind="computed" text={EVTXT} o={g12} />
      </Slide>

      {/* ============================================================ 18.13 the prior's prediction: three averages */}
      <Slide o={sl(13)}>
        <SlideHead text={bh(P, 13)} />
        <Rich x={160} y={320} w={1000} size={30} color={C.chalk2} text="{y:class score} = average of its own three {c:sentence scores}" o={s13w} />
        {CLASSES.map((c, i) => (
          <React.Fragment key={c}>
            <TexSteps x={160} y={450 + i * 100} t={t} size={46} parts={[
              [`\\text{${c}} = ${avgTex(i)}`, w(13, c) - 0.15],
              [`{} = ${(LB.logits_prior[i] as number).toFixed(1)}`, w(13, (LB.logits_prior[i] as number).toFixed(1)) - 0.1],
            ]} />
          </React.Fragment>
        ))}
        <Svg>
          <Txt x={1150} y={400} size={24} weight={600} fill={C.mute} anchor="start" o={s13sh}>shares</Txt>
          <ShareBars x={1150} y={450} labels={CLASSES} from={LB.probs_prior} rowH={100} labelW={150} w={360} size={30} o={s13sh} p={s13shp} />
        </Svg>
        <Rich x={160} y={780} size={32} text={`with the prior alone: {y:${ACC0} of ${N_TEST}} test photos right`} o={s13acc} />
        <EvTag x={1760} y={900} ax="right" kind="computed" text={`${EVTXT}; worked photo`} o={s13w} />
      </Slide>

      {/* ============================================================ 18.14 why a prior helps */}
      <Slide o={sl(14)}>
        <SlideHead text={bh(P, 14)} />
        <Svg>
          {[0, 1].map((k) => {
            const o = k ? s14p : s14z;
            if (o <= 0.001) return null;
            const X = G14[k];
            return (
              <g key={k} opacity={o < 0.999 ? o : undefined}>
                <rect x={X - 6} y={G14Y - 6} width={SEL.length * G14C + 12} height={3 * G14C + 12} rx={10} fill={C.headFill} stroke="#8792A2" strokeWidth={2} />
                {CLASSES.map((c, i) => (
                  <Txt key={c} x={X - 20} y={G14Y + (i + 0.5) * G14C} size={24} anchor="end" weight={600} fill={C.chalk}>{c}</Txt>
                ))}
                {CLASSES.map((_, i) => SEL.map((__, j) => {
                  const own = k === 1 && Math.floor(j / PER) === i;
                  return (
                    <g key={`${i}-${j}`}>
                      <rect x={X + j * G14C + 3} y={G14Y + i * G14C + 3} width={G14C - 6} height={G14C - 6} rx={5} fill={own ? rgba(HEADC, 0.45) : C.bg3} />
                      <Txt x={X + (j + 0.5) * G14C} y={G14Y + (i + 0.5) * G14C} size={own ? 20 : 18} mono weight={own ? 700 : 500} fill={own ? C.chalk : C.mute}>{own ? '1/3' : '0'}</Txt>
                    </g>
                  );
                }))}
              </g>
            );
          })}
        </Svg>
        <Rich x={G14[0]} y={G14Y - 80} size={30} weight={650} text="start from zero" o={s14z} />
        <Rich x={G14[0]} y={G14Y + 3 * G14C + 30} w={560} size={28} color={C.chalk2} text="the {y:labels} must teach every link" o={s14zl} />
        <Rich x={G14[1]} y={G14Y - 80} size={30} weight={650} text="start from the language prior" o={s14p} />
        <Rich x={G14[1]} y={G14Y + 3 * G14C + 30} w={660} size={30} text={`the links are already there: {y:${ACC0} of ${N_TEST}} right`} o={s14acc} />
        <Rich x={960} y={750} ax="center" size={26} color={C.mute} text="linear probe: a linear layer on CLIP's image features, no concepts" o={s14probe} />
        <Rich x={960} y={800} ax="center" size={28} color={C.chalk2} text="LaBo paper, CUB, one labelled photo per class: LaBo 54.19%, linear probe 47.69%" o={s14pap} />
        <EvTag x={1760} y={900} ax="right" kind="reported" text="Yang et al., CVPR 2023, App. Table 10 (CLIP ViT-L/14)" o={s14pap} />
        <EvTag x={G14[1]} y={G14Y + 3 * G14C + 90} kind="computed" text="CLIP ViT-B/32, teaching example" o={s14acc} />
      </Slide>

      {/* ============================================================ 18.16 stripes anywhere? */}
      <Slide o={sl(16)}>
        <SlideHead text={bh(P, 16)} />
        <PhotoR R={big} src={`worked/${EX}`} o={s16ph} />
        <Credit x={big.x} y={big.y + big.h + 8} text={credit(EX)} o={s16ph} />
        <Svg>
          {ZSEL.map((s, i) => (
            <g key={i} opacity={s16s < 0.999 ? s16s : undefined}>
              <rect x={160} y={400 + i * 90 - 32} width={640} height={64} rx={12} fill={rgba(C.concept, 0.07)} stroke={rgba(C.concept, 0.55)} strokeWidth={2} />
              <StripeTxt x={184} y={400 + i * 90} text={s.concept} size={30} hi={s16hi} fill={C.chalk} />
            </g>
          ))}
          <g opacity={s16ph < 0.999 ? s16ph : undefined}>
            <Magnifier x={ux(big, 0.7)} y={vy(big, 0.15)} r={60} o={s16mag} />
            <BText x={ux(big, 0.7) - 80} y={vy(big, 0.15) - 2} text="striped ears?" anchor="end" size={28} o={s16mag} />
            {[[0.42, 0.45, 80], [0.55, 0.76, 52], [0.27, 0.6, 52], [0.6, 0.3, 46]].map(([u, v, r], k) => (
              <circle key={k} cx={ux(big, u)} cy={vy(big, v)} r={r + wob(t, 0.5, 2, k * 0.3)} fill="none" stroke={C.chalk} strokeWidth={3.5} strokeDasharray="9 7"
                opacity={at(w(16, 'anywhere') - 0.2 + k * 0.12, 0.4)} />
            ))}
            <BText x={ux(big, 0.42)} y={vy(big, 0.45) + 112} text="or stripes anywhere?" anchor="middle" size={28} o={s16any} />
          </g>
        </Svg>
        <Rich x={160} y={300} size={26} color={C.chalk2} text="the three {c:zebra sentences}" o={s16s} />
        <Rich x={160} y={680} w={640} size={32} text="all three are about {c:stripes}" o={s16hi} />
        <Rich x={160} y={760} w={640} size={34} weight={650} text="The scores alone cannot tell." o={s16c} />
      </Slide>

      {/* ============================================================ 18.17 what changed compared with the plain CBM */}
      <Slide o={sl(17)}>
        <SlideHead text={bh(P, 17)} />
        <HText x={C17[0]} y={350} ax="center" size={30} weight={600} color={C.chalk2} o={s17h}>plain CBM</HText>
        <HText x={C17[1]} y={350} ax="center" size={30} weight={700} o={s17h}>LaBo</HText>
        {[
          { lab: 'who names the {c:concepts}', a: 'a person', b: 'a language model, as sentences', ch: true },
          { lab: 'what detects the {c:concepts}', a: 'a trained concept layer', b: 'CLIP, unchanged', ch: true },
          { lab: 'the {f:head} starts from', a: 'scratch', b: 'the language prior', ch: true },
        ].map((r, i) => {
          const o = s17r[i];
          if (o <= 0.001) return null;
          const y = R17Y[i];
          return (
            <React.Fragment key={i}>
              <Rich x={160} y={y} ay="middle" size={30} text={r.lab} o={o} />
              <HText x={C17[0]} y={y} ax="center" ay="middle" size={30} color={C.chalk2} o={o}>{r.a}</HText>
              <div style={{
                position: 'absolute', left: C17[1] - 240, top: y - 34, width: 480, height: 68, boxSizing: 'border-box', borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: o, fontFamily: F.sans, fontSize: 30, fontWeight: 600, color: C.chalk,
                background: rgba(C.concept, 0.12), border: `2px solid ${rgba(C.concept, 0.8)}`,
              }}>{r.b}</div>
            </React.Fragment>
          );
        })}
        <Svg><line x1={160} x2={1760} y1={400} y2={400} stroke={C.line2} strokeWidth={2} opacity={s17h} /></Svg>
        <Rich x={960} y={800} ax="center" size={32} text="only the {f:head} is trained, with the {y:class labels}" o={s17o} />
      </Slide>

      {/* ============================================================ 18.18 in symbols */}
      <Slide o={sl(18)}>
        <SlideHead text={bh(P, 18)} />
        <VariantCard name="LaBo (Yang et al., CVPR 2023)" rows={VROWS} p={cardP} y0={262} />
      </Slide>
    </Stage>
  );
};
