// s17 Part 10 · Label-free concept bottleneck models (Oikarinen et al., ICLR 2023). Revision 2: one slide per beat.
// 17.1 motivation: a person labelling concepts, crossed out   17.2 intuition: teacher (CLIP) scores phrases, the student
// (frozen ResNet + one linear layer) copies, the language model writes the questions (real CLIP scores of the worked photo)
// 17.3 the five steps, each with its helper   17.4 step 1: three questions, the REAL Gemini JSON reply to question 1
// 17.5 59 candidates as a class x question count table   17.6 step 2: the filter, 59 - 3 - 4 - 18 = 34
// 17.7 step 3: CLIP image x concept score matrix (real rows: D.worked.extras.lf_targets)
// 17.8 step 4: retain the exact zebra teacher row, then trace the same image through the student
// 17.9 standardising: CLIP's stripes score 0.274 -> z 1.41 (D.worked.pcbm, same phrase, same photo), student z 1.36
// 17.10 copying = rise and fall together (illustrative curves)   17.11 cubing stretches the top (illustrative z -> z^3 bars)
// 17.12 the cosine of two lists, three made-up examples (1, 0, -1)   17.13 the cos^3 match with q-bar and P-bar named
// 17.14 step 5: the sparse final layer as a 3 x 7 matrix (D.worked.lfcbm.W, 6 of 102 non-zero), L1 in one line
// 17.15 one prediction: zebra score = 1.46 x 1.36 + 0.06 x 1.09 - 0.02 = 2.02 -> shares (D.worked.lfcbm)
// 17.16 why sparse: a dense 3 x 34 grid vs the six readable weights   17.17 the risk: setting concepts
// 17.18 what changed compared with the plain CBM (three rows) and three sources of supervision   17.19 VariantCard.
import React from 'react';
import modernSections from '../modernSections.json';
import { C, F } from '../kit/theme';
import { E, HText, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, bs, be, bw, bh, clamp, inv, type SceneProps } from '../kit/core';
import { TexSteps } from '../kit/slots';
import { Block, Credit, Cross, EvTag, Flow, MathSvg, Person, PhotoR, ShareBars, VecCol, rgba, type Rect, VariantCard, type VariantRows } from '../kit/cbm';
import { D } from '../kit/data';

const WK = D.worked;
const LF = WK.lfcbm;
const LLMZ = WK.llm.lf_zebra;
const MODEL: string = WK.llm.model;
const CLASSES: string[] = WK.classes;
const PS: Record<string, [number, number]> = WK.photo_size;
const EX: string = WK.example;
const HEADC = '#9AA6B5';
const N_CAND: number = LF.n_candidates;
const N_KEEP: number = LF.n_after_filters;
const N_W: number = LF.total_weights;
const N_NZ: number = LF.nonzero;
const FEAT_DIM = Number((LF.backbone as string).match(/(\d+)-d/)?.[1] ?? 0);
const POOL = ((LF.projection_pool as string).match(/\d+/g) ?? []).map(Number); // [photos, crops each, total]
const FINAL: string[] = LF.final;
const WMAT: number[][] = LF.W;
const CAND: { concept: string; from: string; removed: string | null; top5_clip: number }[] = LF.candidates;
const CUT_TOP5: number = LF.cutoffs.top5_clip;
const credit = (f: string) => `Photo: ${WK.photo_credit[f].artist}, Wikimedia Commons, ${WK.photo_credit[f].license}`;
const CREDIT36 = '36 Wikimedia Commons photographs (CC BY-SA / CC BY / public domain)';
const EVTXT = 'CLIP ViT-B/32 on 36 Commons photos, teaching example';
const sgn = (v: number) => `${v >= 0 ? '+' : '−'}${Math.abs(v).toFixed(2)}`;

/** normalized window of photo f with the given aspect (w / h), centred */
const cropTo = (f: string, aspect: number): [number, number, number, number] => {
  const [w, h] = PS[f];
  const a = w / h;
  if (a > aspect) { const fw = aspect / a; return [(1 - fw) / 2, 0, (1 + fw) / 2, 1]; }
  const fh = a / aspect; return [0, (1 - fh) / 2, 1, (1 + fh) / 2];
};

// ------------------------------------------------------------------ 17.3 candidate counts (class x question)
const QKEYS = ['features', 'around', 'superclasses'] as const;
const QNAME = ['features', 'seen around', 'superclasses'];
const COUNT = CLASSES.map((c) => QKEYS.map((q) => CAND.filter((d) => d.from === `${c}: ${q}`).length));
const ROWSUM = COUNT.map((r) => r.reduce((a, b) => a + b, 0));

// ------------------------------------------------------------------ 17.4 filter reasons
const isName = (d: { removed: string | null }) => !!d.removed && d.removed.startsWith('contains the class name');
const isDup = (d: { removed: string | null }) => !!d.removed && d.removed.startsWith('near-duplicate');
const isWeak = (d: { removed: string | null }) => !!d.removed && d.removed.startsWith('barely active');
const N_NAME = CAND.filter(isName).length, N_DUP = CAND.filter(isDup).length, N_WEAK = CAND.filter(isWeak).length;
const top5 = (s: string) => CAND.find((d) => d.concept === s)?.top5_clip ?? 0;

// ------------------------------------------------------------------ 17.5 CLIP score matrix columns (real row for the worked photo)
const M5: string[] = ['black and white stripes', 'wildebeest herds', 'safari vehicles', 'riding bridle', 'extremely long neck'];
// real CLIP similarities of one photo per class (D.worked.extras.lf_targets; the zebra row is the worked photo,
// identical to LF.example_clip_target); columns picked by name from the final concept list
const LFT = WK.extras.lf_targets;
const M5ROWS = ['zebra', 'horse', 'giraffe'];
const M5IMG: string[] = M5ROWS.map((k) => LFT.photos[k] as string);
const M5V: number[][] = M5ROWS.map((k) => M5.map((s) => LFT.rows[k][(LFT.concepts as string[]).indexOf(s)] as number));
const M5lo = Math.min(...M5V.flat()), M5hi = Math.max(...M5V.flat());

// ------------------------------------------------------------------ 17.7 illustrative curves (shape only, not our numbers)
const C7IMG = ['zebra_03.jpg', 'horse_05.jpg', 'giraffe_03.jpg', 'zebra_09.jpg', 'horse_10.jpg', 'zebra_14.jpg', 'giraffe_12.jpg', 'horse_08.jpg'];
const C7T = [0.88, 0.22, 0.16, 0.8, 0.3, 0.93, 0.12, 0.26];
const C7A = [0.78, 0.32, 0.22, 0.86, 0.18, 0.84, 0.24, 0.2];

// ------------------------------------------------------------------ 17.2 intuition: the teacher's real scores on three phrases (worked photo)
const Q2: string[] = ['black and white stripes', 'extremely long neck', 'safari vehicles'];
const Q2V: number[] = Q2.map((s) => LFT.rows.zebra[(LFT.concepts as string[]).indexOf(s)] as number);

// ------------------------------------------------------------------ 17.10 / 17.11 illustrative standardised scores (5 images)
const Z10 = [2, 1, 0.5, 0, -1]; // CLIP, standardised over images (chosen to show the effect of cubing)
const Z10IMG = ['zebra_03.jpg', 'zebra_09.jpg', 'horse_05.jpg', 'giraffe_03.jpg', 'horse_10.jpg'];
const Q11 = [1.6, 1.3, 0.2, 0.1, -1.1]; // a student's standardised activations (illustrative)
const cube = (v: number) => v * v * v;
const P3 = Z10.map(cube), Q3 = Q11.map(cube);
const COS11 = (() => {
  const d = P3.reduce((s, v, i) => s + v * Q3[i], 0);
  return d / Math.hypot(...P3) / Math.hypot(...Q3);
})();
const frac = (v: number) => (v === 0.5 ? '\\tfrac12' : v === 0.125 ? '\\tfrac18' : String(v));

// ------------------------------------------------------------------ 17.8 sparse layer: the six concepts that survive, grouped by class
const M8: { name: string; short: [string, string] }[] = [
  { name: 'black and white stripes', short: ['black and', 'white stripes'] },
  { name: 'wildebeest herds', short: ['wildebeest', 'herds'] },
  { name: 'muscular equine build', short: ['muscular', 'equine build'] },
  { name: 'riding bridle', short: ['riding', 'bridle'] },
  { name: 'safari vehicles', short: ['safari', 'vehicles'] },
  { name: 'extremely long neck', short: ['extremely', 'long neck'] },
];
const M8J = M8.map((m) => FINAL.indexOf(m.name));
const N_OTHER = FINAL.length - M8.length;
const wOf = (cls: number, name: string) => WMAT[cls][FINAL.indexOf(name)] as number;

// ------------------------------------------------------------------ 17.9 animal vs setting
const ANIMAL: { name: string; cls: number }[] = [
  { name: 'black and white stripes', cls: 0 }, { name: 'muscular equine build', cls: 1 }, { name: 'extremely long neck', cls: 2 },
];
const SETTING: { name: string; cls: number; word: string }[] = [
  { name: 'riding bridle', cls: 1, word: 'Riding' }, { name: 'safari vehicles', cls: 1, word: 'safari' }, { name: 'wildebeest herds', cls: 0, word: 'wildebeest' },
];

// ------------------------------------------------------------------ 17.9 standardising (real numbers)
// the same phrase on the same photo with the same CLIP model in Part 10.2 (post-hoc), standardised over the 24 training
// photos; the student's activation for the same concept is standardised over the same photos
const PC = WK.pcbm;
const SJ = (PC.bank as string[]).indexOf('black and white stripes');
const S_RAW: number = PC.scores_raw_example[SJ], S_MU: number = PC.mean[SJ], S_SD: number = PC.std[SJ], S_Z: number = PC.z_example[SJ];
const ZA: number[] = LF.example_activation_z;
const J_ST = FINAL.indexOf('black and white stripes'), J_WH = FINAL.indexOf('wildebeest herds');
const STU_Z = ZA[J_ST];

// ------------------------------------------------------------------ 17.12 the cosine of two lists (illustrative)
const CA = [2, 1, -1];
const CB: { v: number[]; lab: string }[] = [
  { v: [4, 2, -2], lab: 'rise and fall together' }, { v: [1, -1, 1], lab: 'unrelated' }, { v: [-2, -1, 1], lab: 'opposite directions' },
];
const cosOf = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0) / Math.hypot(...a) / Math.hypot(...b);

// ------------------------------------------------------------------ 17.15 one prediction (real numbers)
const LOG: number[] = LF.logits_example;
const PROB: number[] = LF.probs_example;
const BIAS: number[] = LF.b;

// final beat ("In symbols"): the variant card
const VROWS: VariantRows = {
  g: '\\ch = W_c\\, \\cin{e(x)}\\ \\ \\text{fitted to CLIP scores}\\ (\\cos^3)',
  c: `\\ch \\in \\mathbb{R}^{k},\\ k = ${N_KEEP}\\ \\ \\text{one per named concept}`,
  f: '\\yh = \\fph(\\ch)\\ \\ \\text{sparse linear}',
  train: 'W_c,\\ \\fph\\ \\ (\\cin{e}\\ \\text{frozen})',
  data: '\\{(x, y)\\},\\ \\text{no concept labels}',
};

// ------------------------------------------------------------------ helpers
const Slide: React.FC<{ o: number; children?: React.ReactNode }> = ({ o, children }) =>
  o <= 0.001 ? null : <div style={{ position: 'absolute', inset: 0, opacity: o < 0.999 ? o : undefined }}>{children}</div>;

/** a clipboard of concept checkboxes (what a person would fill in) */
const Clipboard: React.FC<{ x: number; y: number; o?: number; ticks: number }> = ({ x, y, o = 1, ticks }) =>
  o <= 0.001 ? null : (
    <g transform={`translate(${x} ${y})`} opacity={o < 0.999 ? o : undefined}>
      <rect x={-120} y={-150} width={240} height={300} rx={14} fill={C.bg2} stroke={C.line2} strokeWidth={2.5} />
      <rect x={-46} y={-164} width={92} height={28} rx={8} fill={C.line2} />
      {Array.from({ length: 5 }, (_, i) => (
        <g key={i}>
          <rect x={-90} y={-104 + i * 52} width={30} height={30} rx={5} fill="none" stroke={C.concept} strokeWidth={2.5} />
          {i < ticks ? <path d={`M ${-84} ${-89 + i * 52} L ${-76} ${-80 + i * 52} L ${-64} ${-98 + i * 52}`} fill="none" stroke={C.edit} strokeWidth={4} strokeLinecap="round" /> : null}
          <rect x={-46} y={-94 + i * 52} width={i % 2 ? 110 : 140} height={10} rx={5} fill={C.line2} />
        </g>
      ))}
    </g>
  );

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

/** five small step dots, top right: which step of five the slide is about */
const StepTrack: React.FC<{ cur: number; o: number }> = ({ cur, o }) =>
  o <= 0.001 ? null : (
    <g opacity={o < 0.999 ? o : undefined}>
      <Txt x={1556} y={80} size={20} mono weight={600} anchor="end" fill={C.mute}>STEP</Txt>
      {[0, 1, 2, 3, 4].map((i) => {
        const x = 1588 + i * 46, on = i + 1 === cur, done = i + 1 < cur;
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

/** a concept chip (teal outline), optionally struck through */
const Chip: React.FC<{ x: number; y: number; text: string; o?: number; strike?: number; size?: number; hi?: number }> = ({ x, y, text, o = 1, strike = 0, size = 26, hi = 0 }) => {
  if (o <= 0.001) return null;
  const w = text.length * size * 0.53 + 30;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <rect x={x} y={y - 24} width={w} height={48} rx={10} fill={rgba(C.concept, 0.07 + 0.12 * hi)} stroke={rgba(C.concept, 0.55 + 0.4 * hi)} strokeWidth={2} />
      <Txt x={x + 15} y={y + 1} size={size} anchor="start" fill={C.chalk}>{text}</Txt>
      {strike > 0.001 ? <line x1={x + 8} y1={y + 1} x2={x + 8 + (w - 16) * E.out(strike)} y2={y + 1} stroke={C.bad} strokeWidth={3.5} strokeLinecap="round" /> : null}
    </g>
  );
};

export const S17: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.5) => inv(x, x + d, t);
  const NB = P.beats.length;
  /** slide k: fades in on the beat's first words, fades out (0.3 s) just before the next beat */
  const sl = (k: number) => inv(b(k) - 0.05, b(k) + 0.25, t) * (k < NB ? 1 - inv(b(k + 1) - 0.35, b(k + 1) - 0.05, t) : 1);
  void be;

  // step track: beats 4..17 belong to steps 1, 1, 2, 3, 4 (x6: student, standardise, copy, cube, cosine, match), 5 (x4)
  const STEP = [0, 0, 0, 0, 1, 1, 2, 3, 4, 4, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0];
  const beatNow = (() => { let k = 1; for (let i = 1; i <= NB; i++) if (t >= b(i) - 0.35) k = i; return k; })();
  const trackO = at(b(4) - 0.2, 0.4) * (1 - at(b(18) - 0.35, 0.3));

  const bridgeNow = at(w(1, 'Now') - .1);

  // ---------------- 17.2 intuition: teacher, student, questions
  const s2tc = at(w(2, 'CLIP') - 0.1), s2sc = (i: number) => at(w(2, 'score') + i * 0.2, 0.4);
  const s2q = at(w(2, 'phrase') - 0.2);
  const s2st = at(w(2, 'student') - 0.1), s2fz = at(w(2, 'frozen') - 0.1);
  const s2cp = at(w(2, 'copy') - 0.1, 0.6);
  const s2lm = at(w(2, 'language') - 0.1), s2lmq = at(w(2, 'exam') - 0.1, 0.5);

  // ---------------- 17.3 five steps
  const s3st = [at(w(3, 'proposes') - 0.2), at(w(3, 'filters') - 0.2), at(w(3, 'scores') - 0.2), at(w(3, 'student') - 0.2), at(w(3, 'sparse') - 0.2)];
  const s3lab = at(w(3, 'trained') - 0.1);

  // ---------------- 17.4 step 1
  const s4q = [at(w(4, 'important') - 0.3), at(w(4, 'commonly') - 0.3), at(w(4, 'superclasses') - 0.3)];
  const s4sup = at(w(4, 'broader') - 0.1);
  const s4card = at(w(4, 'real') - 0.2, 0.4);
  const s4n = Math.floor(clamp((t - w(4, 'real') + 0.1) * 9, 0, 9));

  // ---------------- 17.5 candidate counts
  const s5row = (i: number) => at(w(5, 'Three') + 0.2 + i * 0.25, 0.4);
  const s5tot = at(w(5, '59') - 0.15, 0.4);

  // ---------------- 17.6 filter
  const s6r = [at(w(6, 'Phrases') - 0.1), at(w(6, 'Equine') - 0.1), at(w(6, 'Leather') - 0.1)];
  const s6st: Record<string, number> = {
    zebras: at(w(6, 'zebras') + 0.1, 0.4), 'horse-like body': at(w(6, 'horse') + 0.2, 0.4), equine: at(w(6, 'near') - 0.1, 0.4),
    'leather saddle': at(w(6, 'saddle') + 0.1, 0.4), 'ossicones on head': at(w(6, 'ossicones') + 0.2, 0.4),
  };
  const s6n = [at(w(6, 'Phrases') + 0.6), at(w(6, 'Equine') + 0.6), at(w(6, 'even') - 0.1)];
  const s6eq = at(w(6, '34') - 0.15, 0.4);

  // ---------------- 17.7 CLIP scores (the teacher's answers)
  const s7img = (i: number) => at(b(7) + 0.1 + i * 0.15, 0.4);
  const s7head = at(w(7, 'every', 1) - 0.1, 0.5);
  const s7cell = (i: number, j: number) => at(w(7, 'scores') + i * 0.45 + j * 0.1, 0.35);
  const s7l1 = at(w(7, 'higher') - 0.1), s7l2 = at(w(7, 'teacher') - 0.1);
  const s7x = inv(w(7, 'not') - 0.05, w(7, 'not') + 0.5, t);

  const s7pick = at(w(7, 'Follow') - 0.1);

  // ---------------- 17.8 same teacher row, separate student path
  const s8row = at(b(8) + 0.1), s8rn = at(w(8, 'student') - 0.1);
  const s8e = at(w(8, '2048') - 0.1), s8w = at(w(8, 'linear') - 0.1);
  const s8c = at(w(8, '34') - 0.1), s8train = at(w(8, 'Training') - 0.1);
  const s8next = at(w(8, 'Next') - 0.1);

  // ---------------- 17.9 standardising
  const s9f = at(w(9, 'subtract') - 0.1, 0.5);
  const s9t0 = w(9, 'CLIP') - 0.1, s9z = w(9, '1.41') - 0.1;
  const s9ax = at(s9t0, 0.5), s9mt = at(s9z, 0.4), s9ms = at(w(9, '1.36') - 0.1, 0.4);
  const s9cap = at(s9t0 + 0.3);

  // ---------------- 17.10 rise and fall together
  const s10ax = at(b(10) + 0.1);
  const s10t = E.io(inv(w(10, 'high') - 0.2, w(10, 'high') + 1.0, t)), s10a = E.io(inv(w(10, 'low') - 0.2, w(10, 'low') + 1.0, t));
  const s10w = at(w(10, 'high') - 0.2), s10pat = at(w(10, 'Only') - 0.1);

  // ---------------- 17.11 cubing
  const s11b = (i: number) => at(b(11) + 0.2 + i * 0.12, 0.4);
  const s11k = E.io(inv(w(11, 'stretches') - 0.1, w(11, 'stretches') + 1.2, t));
  const s11h0 = at(w(11, 'two') - 0.15, 0.3) * (1 - at(w(11, 'half') - 0.2, 0.3));
  const s11h2 = at(w(11, 'half') - 0.15, 0.3) * (1 - at(w(11, 'So') - 0.2, 0.3));
  const s11eq = at(w(11, 'cubed') - 0.1, 0.4), s11so = at(w(11, 'So') - 0.1);

  // ---------------- 17.12 the cosine
  const s12f = at(w(12, 'multiply') - 0.1, 0.5), s12len = at(w(12, 'divide') - 0.1);
  const s12p = [at(w(12, 'together') - 0.3), at(w(12, 'unrelated') - 0.2), at(w(12, 'opposite') - 0.2)];
  const s12ex = w(12, 'together') - 0.2;

  // ---------------- 17.13 the match in symbols
  const s13v = at(b(13) + 0.1), s13q = at(w(13, 'Let') - 0.1), s13P = at(w(13, 'P') - 0.1);
  const s13eq = at(w(13, 'cosine') - 0.1, 0.5), s13cos = at(w(13, 'cubes') - 0.1);
  const s13nl = at(w(13, 'trained') - 0.1);

  // ---------------- 17.14 sparse layer
  const s14m = at(w(14, 'final') - 0.1, 0.5);
  const s14l1 = at(w(14, 'L1') - 0.1);
  const s14v = at(w(14, 'survive') - 0.1, 0.5);
  const ringT: Record<string, [number, number]> = {
    'black and white stripes': [w(14, 'Zebra'), w(14, 'giraffe')],
    'extremely long neck': [w(14, 'giraffe'), w(14, 'Horse')],
    'muscular equine build': [w(14, 'muscular'), w(14, 'riding')],
    'riding bridle': [w(14, 'riding'), w(14, 'safari')],
    'safari vehicles': [w(14, 'safari'), w(14, 'against') + 0.2],
  };
  const s14ring = (name: string) => { const r = ringT[name]; return r ? at(r[0] - 0.15, 0.3) * (1 - at(r[1] - 0.2, 0.3)) : 0; };

  // ---------------- 17.15 one prediction
  const s15w = at(b(15) + 0.1), s15ph = at(w(15, 'zebra') - 0.2);
  const s15eq: [string, number][] = [
    ['\\text{zebra} = ', w(15, 'score') - 0.1],
    [`\\underbrace{\\chead{${WMAT[0][J_ST].toFixed(2)}} \\times \\ccon{${ZA[J_ST].toFixed(2)}}}_{\\text{stripes}}`, w(15, '1.46') - 0.1],
    [`{} + \\underbrace{\\chead{${WMAT[0][J_WH].toFixed(2)}} \\times \\ccon{${ZA[J_WH].toFixed(2)}}}_{\\text{wildebeest herds}}`, w(15, 'little') - 0.1],
    [`{} ${BIAS[0] < 0 ? '-' : '+'} ${Math.abs(BIAS[0]).toFixed(2)}`, w(15, 'constant') - 0.1],
    [`{} = ${LOG[0].toFixed(2)}`, w(15, '2.02') - 0.1],
  ];
  const s15row = [at(w(15, '2.02') - 0.1), at(w(15, 'Horse') - 0.1), at(w(15, 'giraffe') - 0.1)];
  const s15sh = at(w(15, 'shares') - 0.2, 0.3), s15shp = inv(w(15, 'shares') - 0.1, w(15, 'shares') + 0.9, t);

  // ---------------- 17.16 why sparse
  const s16d = at(w(16, 'dense') - 0.1, 0.6), s16dim = at(w(16, 'nobody') - 0.1, 0.6);
  const s16s = (i: number) => at(w(16, 'Six') - 0.1 + i * 0.15, 0.4);
  const s16hi = at(w(16, 'such') - 0.1, 0.4), s16l = at(w(16, 'claim') - 0.2);

  // ---------------- 17.17 the risk: setting concepts
  const s17a = at(b(17) + 0.1);
  const s17s = SETTING.map((s) => at(w(17, s.word) - 0.15, 0.4));
  const s17e = at(w(17, 'context') - 0.2), s17h = at(w(17, 'horse') - 0.2);

  // ---------------- 17.18 what changed compared with the plain CBM
  const s18h = at(b(18) + 0.1);
  const s18r = [at(w(18, 'language') - 0.1), at(w(18, 'layer') - 0.1), at(w(18, 'head') - 0.1)];
  const s18u = at(w(18, 'unsupervised') - 0.2), s18c = [at(w(18, 'language', 1) - 0.1), at(w(18, 'CLIP', 1) - 0.1), at(w(18, 'class', 1) - 0.1)];

  // ---------------- 17.19 card
  const L = NB;
  const cardP = [w(L, 'g'), w(L, 'cosine'), w(L, 'f', 3), w(L, 'layer', 1), w(L, 'data')].reduce((s, x) => s + inv(x - 0.1, x + 0.4, t), 0) / 5;

  // geometry
  const Y2 = [540, 616, 692]; // 17.2 rows
  const T5X = 820, T5CW = 200, T5Y = 430, T5RH = 74; // 17.5 table
  const R6Y = [400, 545, 690]; // 17.6 rows
  const M7X = 760, M7CW = 196, M7Y = 420, M7RH = 100; // 17.7 matrix
  const NL = { x0: 1000, x1: 1720, y: 600, lo: -1, hi: 2.5 }; // 17.9 number line
  const nlx = (v: number) => NL.x0 + ((v - NL.lo) * (NL.x1 - NL.x0)) / (NL.hi - NL.lo);
  const P10 = { x: 200, y: 360, w: 760, h: 300 }; // 17.10 plot area
  const p10x = (i: number) => P10.x + 40 + (i * (P10.w - 80)) / (C7T.length - 1);
  const p10y = (v: number) => P10.y + P10.h - v * P10.h;
  const B11X = 300, B11DX = 170, B11Y = 690, B11U = 36; // 17.11 bars: baseline y, px per unit
  const PX12 = [420, 980, 1540]; // 17.12 example panels (centres)
  const M14X = 470, M14CW = 172, M14Y = 470, M14RH = 92;
  const G16X = 330, G16Y = 440, G16CW = 18, G16RH = 58; // 17.16 dense grid
  const R18Y = [450, 565, 680], C18 = [1010, 1450]; // 17.18 comparison rows, column centres
  const [PW, PH] = PS[EX];
  const ph15: Rect = { x: 1500, y: 300, w: 260, h: (260 * PH) / PW };

  return (
    <Stage>
      <Header t={t} part={modernSections.s17.part} title={P.title} />
      <Svg><StepTrack cur={STEP[beatNow] ?? 0} o={trackO} /></Svg>

      {/* ============================================================ 17.1 motivation */}
      <Slide o={sl(1)}>
        <SlideHead text={bh(P, 1)} />
        <Rich x={160} y={285} size={28} text="Label-Free Concept Bottleneck Model (LF-CBM)" />
        <HText x={160} y={360} size={30} color={C.chalk2}>Earlier · A · use CLIP scores directly</HText>
        <HText x={160} y={625} size={30} color={C.concept} o={bridgeNow}>Now · B · learn a concept predictor</HText>
        <Svg>
          {[455,720].map((y,i)=><g key={y} opacity={i?bridgeNow:1}>
            <Block x={255} y={y} w={190} h={105} title="image" kind="input" />
            <Flow pts={[[365,y],[430,y]]} color={C.input} />
            <Block x={620} y={y} w={360} h={105} title={i?'image encoder':'CLIP + phrases'} sub="frozen" kind="input" size={30} />
            <Flow pts={[[815,y],[860,y]]} color={C.concept} />
            <Block x={1030} y={y} w={310} h={105} title={i?'learned concepts':'cosine scores'} sub={i?'taught by CLIP':undefined} kind="concept" size={29} />
            <Flow pts={[[1200,y],[1270,y]]} color={C.concept} />
            <Block x={1400} y={y} w={230} h={105} title="class head" sub="learned" kind="head" size={29} />
            <Flow pts={[[1530,y],[1650,y]]} color={C.chalk} />
            <Txt x={1670} y={y} anchor="start" size={32}>class</Txt>
          </g>)}
        </Svg>
        <Rich x={960} y={880} ax="center" size={32} text="Same {y:class labels}. Different source of {c:concept values}." o={bridgeNow} />
        <EvTag x={160} y={965} kind="schematic" text="prediction paths; CLIP teaches the lower concept layer during training" />
      </Slide>

      {/* ============================================================ 17.2 intuition: teacher and student */}
      <Slide o={sl(2)}>
        <SlideHead text={bh(P, 2)} />
        <Svg>
          {/* the language model writes the questions */}
          <Block x={360} y={410} w={360} h={110} kind="neutral" title="language model" sub="writes the questions" size={30} o={s2lm} />
          {Q2.map((q, i) => (
            <Chip key={q} x={360 - (q.length * 26 * 0.53 + 30) / 2} y={Y2[i]} text={q} o={s2q} hi={s2lmq} />
          ))}
          <Flow pts={[[548, 410], [740, 410]]} color={C.chalk2} sw={2.5} p={s2lm} head={12} dash="7 6" />
          {/* the teacher */}
          <Block x={960} y={410} w={400} h={110} kind="input" title="teacher: CLIP" sub="how well a phrase fits a photo" size={30} o={s2tc} />
          {Q2.map((q, i) => (
            <g key={q} opacity={s2sc(i) < 0.999 ? s2sc(i) : undefined}>
              <rect x={900} y={Y2[i] - 26} width={140} height={52} rx={8} fill={rgba(C.input, 0.14)} stroke={rgba(C.input, 0.6)} strokeWidth={1.5} />
              <Txt x={970} y={Y2[i] + 1} size={30} mono weight={600} fill={C.chalk}>{Q2V[i].toFixed(3)}</Txt>
              <Flow pts={[[580, Y2[i]], [890, Y2[i]]]} color={C.concept} sw={2} head={10} o={0.6} />
            </g>
          ))}
          {/* the student copies */}
          <Block x={1560} y={410} w={400} h={110} kind="input" title="student" sub="ResNet + linear layer" size={30} o={s2st} />
          {Q2.map((q, i) => (
            <g key={q} opacity={s2st < 0.999 ? s2st : undefined}>
              <rect x={1490} y={Y2[i] - 26} width={140} height={52} rx={8} fill={rgba(C.concept, 0.1)} stroke={rgba(C.concept, 0.6)} strokeWidth={1.5} />
              <Txt x={1560} y={Y2[i] + 1} size={30} mono weight={600} fill={C.chalk2}>?</Txt>
              <Flow pts={[[1050, Y2[i]], [1480, Y2[i]]]} color={C.loss} sw={2.5} p={s2cp} head={12} dash="9 7" t={t} live={s2cp} />
            </g>
          ))}
          <Flow pts={[[1160, 410], [1358, 410]]} color={C.loss} sw={3} p={s2cp} head={14} dash="9 7" />
          <Txt x={1260} y={384} size={24} weight={600} fill={C.loss} o={s2cp}>copy</Txt>
        </Svg>
        <PhotoR R={{ x: 885, y: 770, w: 170, h: 113 }} src={`worked/${EX}`} frac={cropTo(EX, 170 / 113)} o={s2sc(0)} radius={6} shadow={false} border={C.input} />
        <Svg><Flow pts={[[970, 764], [970, 726]]} color={C.input} p={s2sc(0)} head={10} sw={2.5} /></Svg>
        <Credit x={160} y={906} text={credit(EX)} o={s2sc(0)} />
        <Rich x={1560} y={760} w={420} ax="center" size={28} color={C.chalk2} text="the ResNet stays frozen: only the linear layer on top learns" o={s2fz} />
        <EvTag x={1760} y={900} ax="right" kind="computed" text="CLIP ViT-B/32 scores of the worked zebra photo" o={s2sc(0)} />
      </Slide>

      {/* ============================================================ 17.3 five steps */}
      <Slide o={sl(3)}>
        <SlideHead text={bh(P, 3)} />
        <Svg>
          {[
            ['ask a language model', 'language model', C.chalk2],
            ['filter the phrases', 'CLIP', C.input],
            ['score every image', 'the teacher, CLIP', C.input],
            ['learn to copy the scores', 'the student', C.input],
            ['fit a sparse final layer', 'class labels', C.chalk],
          ].map(([s, who, col], i) => {
            const o = s3st[i];
            if (o <= 0.001) return null;
            const y = 360 + i * 98;
            return (
              <g key={s} opacity={o < 0.999 ? o : undefined}>
                <circle cx={420} cy={y} r={26} fill="none" stroke={C.chalk2} strokeWidth={2.5} />
                <Txt x={420} y={y + 1} size={26} mono weight={700} fill={C.chalk}>{String(i + 1)}</Txt>
                <Txt x={476} y={y} size={36} anchor="start" fill={C.chalk}>{s}</Txt>
                <line x1={1010} x2={1110} y1={y} y2={y} stroke={C.line2} strokeWidth={2} strokeDasharray="5 6" />
                <Txt x={1140} y={y} size={32} anchor="start" weight={i === 4 ? 700 : 600} fill={col}>{who}</Txt>
              </g>
            );
          })}
          {s3lab > 0.001 ? <rect x={1120} y={360 + 4 * 98 - 34} width={250} height={68} rx={12} fill="none" stroke={C.chalk} strokeWidth={2.5} opacity={s3lab} /> : null}
        </Svg>
        <Rich x={960} y={860} ax="center" size={30} color={C.chalk2} text="only step 5 uses labels, and only the {y:class labels}" o={s3lab} />
      </Slide>

      {/* ============================================================ 17.4 step 1: ask a language model */}
      <Slide o={sl(4)}>
        <SlideHead text={bh(P, 4)} />
        {QKEYS.map((q, i) => (
          <HText key={q} x={160} y={350 + i * 150} w={620} size={28} lh={1.35} color={i === 0 && s4card > 0.5 ? C.chalk : C.chalk2} o={s4q[i]}>
            <span style={{ fontFamily: F.mono, fontSize: 22, color: C.mute }}>{`QUESTION ${i + 1}  `}</span><br />{LLMZ[q].prompt}
          </HText>
        ))}
        <HText x={160} y={350 + 2 * 150 + 84} w={620} size={24} color={C.mute} o={s4sup}>superclasses: the broader groups it belongs to</HText>
        <Svg>
          <Flow pts={[[800, 400], [890, 400]]} color={C.concept} p={s4card} head={14} />
        </Svg>
        <HText x={910} y={300} size={22} mono color={C.mute} o={s4card}>REPLY TO QUESTION 1 · zebra</HText>
        <JsonCard x={910} y={340} w={680} raw={LLMZ.features.raw} n={s4n} o={s4card} />
        <EvTag x={910} y={760} kind="computed" text={`real reply · ${MODEL}`} o={s4card} />
      </Slide>

      {/* ============================================================ 17.5 59 candidates */}
      <Slide o={sl(5)}>
        <SlideHead text={bh(P, 5)} />
        <Svg>
          {QNAME.map((q, j) => (
            <Txt key={q} x={T5X + j * T5CW} y={T5Y - 64} size={26} weight={600} fill={C.chalk2} o={s5row(0)}>{q}</Txt>
          ))}
          <Txt x={T5X + 3 * T5CW + 10} y={T5Y - 64} size={26} weight={600} fill={C.chalk2} o={s5row(0)}>new phrases</Txt>
          {CLASSES.map((c, i) => {
            const o = s5row(i);
            if (o <= 0.001) return null;
            const y = T5Y + i * T5RH;
            return (
              <g key={c} opacity={o < 0.999 ? o : undefined}>
                <rect x={T5X - 330} y={y - 30} width={4 * T5CW + 360} height={60} rx={10} fill={C.bg2} />
                <Txt x={T5X - 300} y={y} size={32} weight={700} anchor="start" fill={C.chalk}>{c}</Txt>
                {COUNT[i].map((n, j) => <Txt key={j} x={T5X + j * T5CW} y={y} size={32} mono fill={C.chalk}>{String(n)}</Txt>)}
                <Txt x={T5X + 3 * T5CW + 10} y={y} size={32} mono weight={700} fill={C.concept}>{String(ROWSUM[i])}</Txt>
              </g>
            );
          })}
          <line x1={T5X - 330} x2={T5X + 3 * T5CW + 30} y1={T5Y + 2.5 * T5RH + 6} y2={T5Y + 2.5 * T5RH + 6} stroke={C.line2} strokeWidth={2} opacity={s5tot} />
          <Txt x={T5X - 300} y={T5Y + 3 * T5RH + 20} size={32} weight={700} anchor="start" fill={C.chalk} o={s5tot}>candidates</Txt>
          <Txt x={T5X + 3 * T5CW + 10} y={T5Y + 3 * T5RH + 20} size={48} mono weight={700} fill={C.concept} o={s5tot}>{String(N_CAND)}</Txt>
        </Svg>
        <HText x={T5X - 330} y={T5Y + 3 * T5RH + 80} size={26} color={C.mute} o={s5tot}>a phrase already listed for an earlier class is counted once</HText>
        <EvTag x={1760} y={880} ax="right" kind="computed" text={`counted from the real replies, ${MODEL}`} o={s5row(0)} />
      </Slide>

      {/* ============================================================ 17.6 step 2: filter */}
      <Slide o={sl(6)}>
        <SlideHead text={bh(P, 6)} />
        <Svg>
          {[
            { n: N_NAME, chips: ['zebras', 'horse-like body'] },
            { n: N_DUP, chips: ['equine'] },
            { n: N_WEAK, chips: ['leather saddle', 'ossicones on head'] },
          ].map((r, k) => {
            const o = s6r[k];
            if (o <= 0.001) return null;
            let x = 1010;
            return (
              <g key={k} opacity={o < 0.999 ? o : undefined}>
                <Txt x={870} y={R6Y[k]} size={30} mono weight={700} fill={C.bad} o={s6n[k]}>{`−${r.n}`}</Txt>
                {r.chips.map((c) => {
                  const g = <Chip key={c} x={x} y={R6Y[k]} text={c} strike={s6st[c]} />;
                  x += c.length * 26 * 0.53 + 30 + 20;
                  return g;
                })}
              </g>
            );
          })}
        </Svg>
        <HText x={160} y={R6Y[0]} ay="middle" size={32} weight={600} o={s6r[0]}>contains a class name</HText>
        <HText x={160} y={R6Y[1] - 20} ay="middle" size={32} weight={600} o={s6r[1]}>near-duplicate</HText>
        <HText x={160} y={R6Y[1] + 22} ay="middle" size={24} color={C.chalk2} o={s6r[1]}>of "equine animal"</HText>
        <HText x={160} y={R6Y[2] - 26} ay="middle" size={32} weight={600} o={s6r[2]}>CLIP barely sees it</HText>
        <HText x={160} y={R6Y[2] + 18} ay="middle" size={24} color={C.chalk2} o={s6n[2]}>
          {`its 5 best-matching photos average below ${CUT_TOP5}`}
        </HText>
        <HText x={160} y={R6Y[2] + 52} ay="middle" size={24} color={C.mute} o={s6n[2]}>
          {`here ${top5('leather saddle').toFixed(3)} and ${top5('ossicones on head').toFixed(3)}; stripes: ${top5('black and white stripes').toFixed(3)}`}
        </HText>
        <Tex x={960} y={840} ax="center" size={56} o={s6eq}
          tex={`${N_CAND} - ${N_NAME} - ${N_DUP} - ${N_WEAK} = \\ccon{${N_KEEP}}\\ \\text{concepts}`} />
        <EvTag x={1760} y={900} ax="right" kind="computed" text={EVTXT} o={s6r[2]} />
      </Slide>

      {/* ============================================================ 17.7 step 3: CLIP scores */}
      <Slide o={sl(7)}>
        <SlideHead text={bh(P, 7)} />
        <HText x={160} y={M7Y + 20} w={370} size={30} color={C.input} o={s7pick}>Follow this zebra row</HText>
        <HText x={160} y={M7Y + 76} size={24} color={C.chalk2} o={s7pick}>held-out example photo</HText>
        <HText x={160} y={M7Y - 40} w={400} size={24} color={C.mute} o={s7head}>5 of the 34 concepts</HText>
        {M5IMG.map((f, i) => (
          <PhotoR key={f} R={{ x: M7X - 170, y: M7Y + i * M7RH + 8, w: 126, h: 84 }} src={`worked/${f}`} frac={cropTo(f, 1.5)}
            o={s7img(i) * (i ? 1 - 0.55 * s7pick : 1)} radius={6} shadow={false} border={i ? undefined : C.input} />
        ))}
        {M5.map((s, j) => (
          <HText key={s} x={M7X + j * M7CW + M7CW / 2} y={M7Y - 10} w={M7CW - 16} ax="center" ay="bottom" size={24} lh={1.15} color={C.concept} o={s7head}>{s}</HText>
        ))}
        <Svg>
          {M5IMG.map((_, i) => M5.map((__, j) => {
            const y = M7Y + i * M7RH, x = M7X + j * M7CW;
            const o = s7cell(i, j) * (i ? 1 - 0.55 * s7pick : 1);
            if (o <= 0.001) return null;
            const a = (M5V[i][j] - M5lo) / (M5hi - M5lo);
            return (
              <g key={`${i}-${j}`} opacity={o < 0.999 ? o : undefined}>
                <rect x={x + 4} y={y + 8} width={M7CW - 8} height={M7RH - 16} rx={8} fill={rgba(C.concept, 0.1 + 0.45 * a)}
                  stroke={rgba(C.concept, 0.6)} strokeWidth={1.5} />
                <Txt x={x + M7CW / 2} y={y + M7RH / 2} size={32} mono weight={600} fill={C.chalk}>{M5V[i][j].toFixed(3)}</Txt>
              </g>
            );
          }))}
          <rect x={M7X - 180} y={M7Y - 6} width={5 * M7CW + 192} height={M7RH + 12} rx={10}
            fill="none" stroke={C.input} strokeWidth={3} opacity={s7pick} />
          <Txt x={M7X + 5 * M7CW + 30} y={M7Y + 1.5 * M7RH} size={30} mono fill={C.mute} o={s7head}>…</Txt>
          <Person x={1640} y={M7Y + 3 * M7RH + 104} s={0.9} o={s7l2} />
          <Cross x={1605} y={M7Y + 3 * M7RH + 68} w={70} h={70} p={s7x} sw={5} />
        </Svg>
        <Rich x={M7X - 170} y={M7Y + 3 * M7RH + 30} size={30} text="higher score = the {c:phrase} fits the {x:image} better" o={s7l1} />
        <Rich x={M7X - 170} y={M7Y + 3 * M7RH + 82} size={30} text="the {x:teacher}'s answers: {c:targets} for the {x:student}, not labels from a person" o={s7l2} />
        <Credit x={160} y={906} text={CREDIT36} o={s7img(0)} />
        <EvTag x={1760} y={900} ax="right" kind="computed" text="CLIP ViT-B/32, one photo per class; row 1 = worked photo" o={s7cell(0, 0)} />
      </Slide>

      {/* ============================================================ 17.8 same zebra, same teacher row */}
      <Slide o={sl(8)}>
        <SlideHead text={bh(P, 8)} />
        <HText x={160} y={M7Y + 20} w={370} size={30} color={C.input} o={s8row}>Same teacher row</HText>
        <HText x={160} y={M7Y + 76} size={24} color={C.chalk2} o={s8row}>raw CLIP scores</HText>
        <PhotoR R={{x: M7X - 170, y: M7Y + 8, w: 126, h: 84}} src={`worked/${M5IMG[0]}`}
          frac={cropTo(M5IMG[0], 1.5)} o={s8row} radius={6} shadow={false} border={C.input} />
        {M5.map((name, j) => (
          <HText key={name} x={M7X + j * M7CW + M7CW / 2} y={M7Y - 10} w={M7CW - 16}
            ax="center" ay="bottom" size={24} lh={1.15} color={C.concept} o={s8row}>{name}</HText>
        ))}
        <Svg>
          {/* The same data row, column order, formatting, geometry and colour scale as step 3. */}
          {M5V[0].map((value, j) => {
            const x = M7X + j * M7CW;
            const a = (value - M5lo) / (M5hi - M5lo);
            return <g key={M5[j]} opacity={s8row}>
              <rect x={x + 4} y={M7Y + 8} width={M7CW - 8} height={M7RH - 16} rx={8}
                fill={rgba(C.concept, 0.1 + 0.45 * a)} stroke={rgba(C.concept, 0.6)} strokeWidth={1.5} />
              <Txt x={x + M7CW / 2} y={M7Y + M7RH / 2} size={32} mono weight={600}>{value.toFixed(3)}</Txt>
            </g>;
          })}
          <rect x={M7X - 180} y={M7Y - 6} width={5 * M7CW + 192} height={M7RH + 12} rx={10}
            fill="none" stroke={C.input} strokeWidth={3} opacity={s8row} />
          <Flow pts={[[653, 534], [653, 626]]} color={C.input} p={s8rn} head={12} />
          <Block x={653} y={690} w={210} h={120} kind="input" title="ResNet-50" sub="frozen" size={28} o={s8rn} />
          <Flow pts={[[760, 690], [820, 690]]} color={C.input} p={s8e} head={12} />
          <Block x={940} y={690} w={230} h={120} kind="input" title={`${FEAT_DIM} features`} sub="from the photo" size={27} subSize={21} o={s8e} />
          <Flow pts={[[1057, 690], [1117, 690]]} color={C.input} p={s8w} head={12} />
          <Block x={1250} y={690} w={260} h={120} kind="head" title="linear projection" sub="learned weights" size={28} o={s8w} />
          <MathSvg x={1250} y={795} tex="W_c" size={34} o={s8w} />
          <Flow pts={[[1383, 690], [1417, 690]]} color={C.concept} p={s8c} head={12} />
          <Block x={1590} y={690} w={340} h={120} kind="concept" title={`${N_KEEP} activations`} sub="one per concept" size={28} subSize={22} o={s8c} />
        </Svg>
        <Rich x={730} y={565} size={29} text="the {c:student} reads the same {x:photo}" o={s8rn} />
        <Rich x={960} y={865} ax="center" size={30} text="Fit the {c:student activations} to the {x:teacher's pattern} across training images." o={s8train} />
        <Rich x={960} y={920} ax="center" size={27} color={C.chalk2} text="Next: put the two outputs on a comparable scale." o={s8next} />
        <Credit x={160} y={970} text={credit(EX)} o={s8row} />
        <EvTag x={1760} y={1000} ax="right" kind="computed" text="CLIP scores for the held-out zebra; this photo is not used for fitting" o={s8row} />
      </Slide>

      {/* ============================================================ 17.9 standardising: one scale for both */}
      <Slide o={sl(9)}>
        <SlideHead text={bh(P, 9)} />
        <PhotoR R={{x: 160, y: 280, w: 126, h: 84}} src={`worked/${M5IMG[0]}`}
          frac={cropTo(M5IMG[0], 1.5)} radius={6} shadow={false} border={C.input} />
        <Rich x={320} y={300} size={29} text="same zebra, first column: {c:black and white stripes}" />
        <Tex x={160} y={470} size={52} o={s9f} tex={'z = \\dfrac{\\text{value} - \\text{average}}{\\text{spread}}'} />
        <HText x={160} y={550} size={24} color={C.mute} o={s9f}>average and spread (standard deviation) over the training photos</HText>
        <HText x={160} y={640} size={24} mono color={C.mute} o={s9cap}>{"CLIP'S STRIPES SCORE, THIS ZEBRA"}</HText>
        <TexSteps x={160} y={740} t={t} size={50} parts={[
          [`\\cin{z} = \\dfrac{${S_RAW.toFixed(3)} - ${S_MU.toFixed(3)}}{${S_SD.toFixed(3)}}`, s9t0],
          [`{} = \\cin{${S_Z.toFixed(2)}}`, s9z],
        ]} />
        <Svg>
          <g opacity={s9ax < 0.999 ? s9ax : undefined}>
            <line x1={NL.x0} x2={NL.x1} y1={NL.y} y2={NL.y} stroke={C.line2} strokeWidth={3} />
            {[-1, 0, 1, 2].map((v) => (
              <g key={v}>
                <line x1={nlx(v)} x2={nlx(v)} y1={NL.y - 10} y2={NL.y + 10} stroke={C.chalk2} strokeWidth={2} />
                <Txt x={nlx(v)} y={NL.y + 34} size={24} mono fill={C.mute}>{v < 0 ? `−${-v}` : String(v)}</Txt>
              </g>
            ))}
          </g>
          <g opacity={s9mt < 0.999 ? s9mt : undefined}>
            <line x1={nlx(S_Z)} x2={nlx(S_Z)} y1={NL.y - 70} y2={NL.y} stroke={C.input} strokeWidth={3} />
            <circle cx={nlx(S_Z)} cy={NL.y} r={11} fill={C.input} />
            <Txt x={nlx(S_Z)} y={NL.y - 92} size={28} weight={600} fill={C.input}>{`CLIP ${S_Z.toFixed(2)}`}</Txt>
          </g>
          <g opacity={s9ms < 0.999 ? s9ms : undefined}>
            <line x1={nlx(STU_Z)} x2={nlx(STU_Z)} y1={NL.y} y2={NL.y + 80} stroke={C.concept} strokeWidth={3} />
            <circle cx={nlx(STU_Z)} cy={NL.y} r={8} fill={C.concept} />
            <Txt x={nlx(STU_Z)} y={NL.y + 104} size={28} weight={600} fill={C.concept}>{`student ${STU_Z.toFixed(2)}`}</Txt>
          </g>
        </Svg>
        <HText x={(NL.x0 + NL.x1) / 2} y={NL.y - 170} ax="center" size={24} color={C.chalk2} o={s9ax}>standard deviations above average</HText>
        <Rich x={960} y={870} ax="center" size={30} text="now the {x:teacher} and the {c:student} can be compared" o={s9ms} />
        <EvTag x={1760} y={950} ax="right" kind="computed" text={`${EVTXT}; worked photo, ${WK.train.length} training photos`} o={s9cap} />
      </Slide>

      {/* ============================================================ 17.10 copying: rise and fall together */}
      <Slide o={sl(10)}>
        <SlideHead text={bh(P, 10)} />
        {C7IMG.map((f, i) => (
          <PhotoR key={f} R={{ x: p10x(i) - 40, y: P10.y + P10.h + 26, w: 80, h: 60 }} src={`worked/${f}`} frac={cropTo(f, 80 / 60)} o={s10ax} radius={5} shadow={false} />
        ))}
        <Svg>
          <g opacity={s10ax < 0.999 ? s10ax : undefined}>
            <line x1={P10.x} x2={P10.x + P10.w} y1={P10.y + P10.h} y2={P10.y + P10.h} stroke={C.line2} strokeWidth={2} />
            <line x1={P10.x} x2={P10.x} y1={P10.y} y2={P10.y + P10.h} stroke={C.line2} strokeWidth={2} />
          </g>
          {[[C7T, s10t, C.input, '8 7'], [C7A, s10a, C.concept, undefined]].map(([vals, p, col, dash], k) => {
            const pp = p as number;
            if (pp <= 0.001) return null;
            const v = vals as number[];
            const n = 1 + (v.length - 1) * pp;
            const pts: string[] = [];
            for (let i = 0; i < v.length && i <= n; i++) pts.push(`${p10x(i)},${p10y(v[i])}`);
            const fi = Math.floor(n), fr = n - fi;
            if (fi < v.length - 1 && fr > 0) pts.push(`${p10x(fi) + (p10x(fi + 1) - p10x(fi)) * fr},${p10y(v[fi] + (v[fi + 1] - v[fi]) * fr)}`);
            return (
              <g key={k}>
                <polyline points={pts.join(' ')} fill="none" stroke={col as string} strokeWidth={4} strokeDasharray={dash as string | undefined} strokeLinejoin="round" />
                {v.map((y, i) => (i <= n ? <circle key={i} cx={p10x(i)} cy={p10y(y)} r={7} fill={col as string} /> : null))}
              </g>
            );
          })}
        </Svg>
        <Rich x={P10.x} y={P10.y - 50} size={26} text="concept: {c:black and white stripes}" o={s10ax} />
        <Rich x={P10.x + P10.w - 10} y={P10.y - 50} ax="right" size={24} text="{x:CLIP score} (teacher)" o={s10t} />
        <Rich x={P10.x + P10.w - 10} y={P10.y - 18} ax="right" size={24} text="{c:activation} (student)" o={s10a} />
        <Rich x={1080} y={420} w={680} size={34} text="high where {x:CLIP} is high, low where it is low" o={s10w} />
        <Rich x={1080} y={560} w={680} size={30} color={C.chalk2} text="only the pattern across images matters, not the exact values" o={s10pat} />
        <EvTag x={P10.x} y={900} kind="illustrative" text="curve shapes drawn by hand" o={s10ax} />
        <Credit x={P10.x} y={P10.y + P10.h + 96} text={CREDIT36} o={s10ax} />
      </Slide>

      {/* ============================================================ 17.11 cubing stretches the top */}
      <Slide o={sl(11)}>
        <SlideHead text={bh(P, 11)} />
        {Z10IMG.map((f, i) => (
          <PhotoR key={f} R={{ x: B11X + i * B11DX - 40, y: B11Y + 60, w: 80, h: 60 }} src={`worked/${f}`} frac={cropTo(f, 80 / 60)} o={s11b(i)} radius={5} shadow={false} />
        ))}
        <Svg>
          <line x1={B11X - 80} x2={B11X + 4 * B11DX + 80} y1={B11Y} y2={B11Y} stroke={C.line2} strokeWidth={2} opacity={s11b(0)} />
          {Z10.map((z, i) => {
            const o = s11b(i);
            if (o <= 0.001) return null;
            const v = z + (cube(z) - z) * s11k;
            const x = B11X + i * B11DX;
            const top = B11Y - Math.max(v, 0) * B11U, hgt = Math.abs(v) * B11U;
            const hi = i === 0 ? s11h0 : i === 2 ? s11h2 : 0;
            const lab = s11k < 0.5 ? (Math.abs(z - 0.5) < 1e-9 ? '0.5' : String(z)) : (Math.abs(z - 0.5) < 1e-9 ? '0.125' : String(cube(z)));
            return (
              <g key={i} opacity={o < 0.999 ? o : undefined}>
                <rect x={x - 42} y={top} width={84} height={Math.max(hgt, 2)} rx={6} fill={rgba(C.input, 0.35 + 0.45 * hi)} stroke={C.input} strokeWidth={2} />
                <Txt x={x} y={v >= 0 ? top - 26 : B11Y + hgt + 0} size={30} mono weight={700} fill={C.chalk} o={v >= 0 ? 1 : 0}>{lab}</Txt>
                {v < 0 ? <Txt x={x} y={B11Y - 26} size={30} mono weight={700} fill={C.chalk}>{lab}</Txt> : null}
                {hi > 0.001 ? <rect x={x - 54} y={top - 54} width={108} height={hgt + 64} rx={10} fill="none" stroke={C.chalk} strokeWidth={3} opacity={hi} /> : null}
              </g>
            );
          })}
        </Svg>
        <Rich x={B11X - 80} y={300} size={28} color={C.chalk2} text="one {c:concept}, five images: {x:CLIP scores}, standardised" o={s11b(0)} />
        <Tex x={1220} y={420} size={60} tex="z \;\longrightarrow\; z^{3} = z \times z \times z" o={s11eq} />
        <HText x={1220} y={466} size={24} color={C.mute} o={s11eq}>z: a standardised value</HText>
        <Tex x={1220} y={560} size={48} tex={`2^3 = 8`} o={s11h0 > 0.001 || s11h2 > 0.001 || s11so > 0.001 ? 1 : 0} />
        <Tex x={1220} y={650} size={48} tex={`\\big(${frac(0.5)}\\big)^3 = ${frac(0.125)}`} o={at(w(11, 'half') - 0.1, 0.4)} />
        <Rich x={1220} y={740} w={540} size={32} text="the images {x:CLIP} scores highest count the most" o={s11so} />
        <EvTag x={1760} y={900} ax="right" kind="illustrative" text="values chosen to show the effect of cubing" o={s11b(0)} />
        <Credit x={B11X - 80} y={B11Y + 130} text={CREDIT36} o={s11b(0)} />
      </Slide>

      {/* ============================================================ 17.12 the cosine of two lists */}
      <Slide o={sl(12)}>
        <SlideHead text={bh(P, 12)} />
        <Tex x={160} y={370} size={48} o={s12f}
          tex={'\\cos(\\cin{a}, \\ccon{b}) = \\dfrac{\\cin{a_1}\\ccon{b_1} + \\cin{a_2}\\ccon{b_2} + \\cin{a_3}\\ccon{b_3}}{\\text{length}(\\cin{a}) \\times \\text{length}(\\ccon{b})}'} />
        <Tex x={1110} y={370} size={34} o={s12len} tex={'\\text{length}(\\cin{a}) = \\sqrt{\\cin{a_1}^2 + \\cin{a_2}^2 + \\cin{a_3}^2}'} />
        <TexSteps x={160} y={540} t={t} size={40} parts={[
          ['\\cos = \\dfrac{2\\cdot 4 + 1\\cdot 2 + (-1)(-2)}{\\sqrt{6}\\,\\times\\sqrt{24}}', s12ex],
          ['{} = \\dfrac{12}{12} = 1', s12ex + 0.8],
        ]} />
        <Svg>
          {CB.map((ex, k) => {
            const o = s12p[k];
            if (o <= 0.001) return null;
            const cx = PX12[k];
            return (
              <g key={k} opacity={o < 0.999 ? o : undefined}>
                <rect x={cx - 250} y={660} width={500} height={226} rx={16} fill={C.bg2} stroke={C.line2} strokeWidth={1.5} />
                <VecCol x={cx - 220} y={686} vals={CA} rowH={50} w={80} size={28} digits={0} color={C.input} />
                <VecCol x={cx - 120} y={686} vals={ex.v} rowH={50} w={80} size={28} digits={0} color={C.concept} />
                <MathSvg x={cx - 180} y={862} tex="\cin{a}" size={26} />
                <MathSvg x={cx - 80} y={862} tex="\ccon{b}" size={26} />
                <Txt x={cx + 110} y={720} size={26} fill={C.chalk2}>{ex.lab}</Txt>
                <Txt x={cx + 110} y={800} size={48} mono weight={700} fill={C.chalk}>{`cos = ${cosOf(CA, ex.v) < -1e-9 ? '−' : ''}${Math.abs(Math.round(cosOf(CA, ex.v)))}`}</Txt>
              </g>
            );
          })}
        </Svg>
        <EvTag x={1760} y={905} ax="right" kind="illustrative" text="lists made up to show the cosine" o={s12f} />
      </Slide>

      {/* ============================================================ 17.13 the match in symbols */}
      <Slide o={sl(13)}>
        <SlideHead text={bh(P, 13)} />
        <Svg>
          <MathSvg x={295} y={330} tex="\ccon{\bar q_j}^{\,3}" size={40} o={s13v} />
          <MathSvg x={505} y={330} tex="\cin{\bar P_j}^{\,3}" size={40} o={s13v} />
          <VecCol x={230} y={370} vals={Q3} rowH={64} w={130} size={28} digits={2} color={C.concept} o={s13v} />
          <VecCol x={440} y={370} vals={P3} rowH={64} w={130} size={28} digits={2} color={C.input} o={s13v} />
          {Z10IMG.map((_, i) => <Txt key={i} x={200} y={370 + (i + 0.5) * 64} size={22} anchor="end" fill={C.mute} o={s13v}>{`image ${i + 1}`}</Txt>)}
          <Txt x={295} y={712} size={22} fill={C.concept} o={s13v}>student, cubed</Txt>
          <Txt x={505} y={712} size={22} fill={C.input} o={s13v}>CLIP, cubed</Txt>
        </Svg>
        <Tex x={400} y={790} ax="center" size={44} tex={`\\cos = ${COS11.toFixed(2)}`} o={s13cos} />
        <Rich x={760} y={360} w={1000} size={30} text="$\ccon{\bar q_j}$: the {c:student}'s standardised activations for concept $j$" o={s13q} />
        <Rich x={760} y={420} w={1000} size={30} text="$\cin{\bar P_j}$: {x:CLIP}'s standardised scores for concept $j$" o={s13P} />
        <Tex x={760} y={580} size={58} tex={'\\text{match}_j = \\cos\\!\\big(\\ccon{\\bar q_j}^{\\,3},\\ \\cin{\\bar P_j}^{\\,3}\\big)'} o={s13eq} />
        <Rich x={760} y={700} w={1000} size={30} text={`$W_c$ makes the match large for every {c:concept}, with no labels: ${POOL[0]} unlabelled photos × ${POOL[1]} crops`} o={s13nl} />
        <EvTag x={160} y={900} kind="illustrative" text="the vectors on the left are made up" o={s13v} />
      </Slide>

      {/* ============================================================ 17.14 step 5: sparse final layer */}
      <Slide o={sl(14)}>
        <SlideHead text={bh(P, 14)} />
        {M8.map((m, j) => (
          <HText key={m.name} x={M14X + j * M14CW + M14CW / 2} y={M14Y - 12} ax="center" ay="bottom" size={24} lh={1.15} color={C.concept} o={s14m}>
            {m.short[0]}<br />{m.short[1]}
          </HText>
        ))}
        <HText x={M14X + 6 * M14CW + M14CW / 2} y={M14Y - 12} ax="center" ay="bottom" size={24} lh={1.15} color={C.mute} o={s14m}>
          {`${N_OTHER} other`}<br />concepts
        </HText>
        <Svg>
          <g opacity={s14m < 0.999 ? s14m : undefined}>
            <rect x={M14X - 6} y={M14Y - 6} width={7 * M14CW + 12} height={3 * M14RH + 12} rx={12} fill={C.headFill} stroke="#8792A2" strokeWidth={2.5} />
            {CLASSES.map((c, i) => (
              <Txt key={c} x={M14X - 28} y={M14Y + (i + 0.5) * M14RH} size={32} anchor="end" weight={700} fill={C.chalk}>{c}</Txt>
            ))}
            {CLASSES.map((_, i) => [...M8, null].map((m, j) => {
              const v = m ? wOf(i, m.name) : 0;
              const nz = Math.abs(v) > 1e-9;
              const x = M14X + j * M14CW, y = M14Y + i * M14RH;
              const lit = nz ? s14v : 0;
              const rg = nz && m ? s14ring(m.name) : 0;
              return (
                <g key={`${i}-${j}`}>
                  <rect x={x + 4} y={y + 4} width={M14CW - 8} height={M14RH - 8} rx={8} fill={nz ? rgba(HEADC, 0.08 + 0.4 * lit * Math.min(1, Math.abs(v))) : C.bg3}
                    stroke={nz && v < 0 ? rgba(HEADC, 0.8 * lit) : 'none'} strokeWidth={2} strokeDasharray="6 5" />
                  {nz ? (
                    <>
                      <Txt x={x + M14CW / 2} y={y + M14RH / 2} size={26} mono fill={C.mute} o={1 - lit}>0</Txt>
                      <Txt x={x + M14CW / 2} y={y + M14RH / 2} size={32} mono weight={700} fill={C.chalk} o={lit}>{sgn(v)}</Txt>
                    </>
                  ) : <Txt x={x + M14CW / 2} y={y + M14RH / 2} size={26} mono fill={C.mute}>{m ? '0' : '0 … 0'}</Txt>}
                  {rg > 0.001 ? <rect x={x + 1} y={y + 1} width={M14CW - 2} height={M14RH - 2} rx={10} fill="none" stroke={C.chalk} strokeWidth={4} opacity={rg} /> : null}
                </g>
              );
            }))}
          </g>
        </Svg>
        <Rich x={960} y={M14Y + 3 * M14RH + 40} ax="center" size={30}
          text={`${CLASSES.length} {y:classes} × ${N_KEEP} {c:concepts} = ${N_W} {f:weights}; an L1 penalty sets ${N_W - N_NZ} of them to exactly 0`} o={s14l1} />
        <EvTag x={1760} y={900} ax="right" kind="computed" text={`sparse final layer, trained on ${WK.train.length} labelled photos`} o={s14v} />
      </Slide>

      {/* ============================================================ 17.15 one prediction */}
      <Slide o={sl(15)}>
        <SlideHead text={bh(P, 15)} />
        <Rich x={160} y={310} w={1250} size={30} color={C.chalk2} text="{y:class score} = sum of {f:weight} × {c:activation}, plus a small constant" o={s15w} />
        <TexSteps x={160} y={460} t={t} size={50} parts={s15eq} />
        <PhotoR R={ph15} src={`worked/${EX}`} o={s15ph} border={C.input} radius={6} />
        <Svg>
          <Txt x={300} y={640} size={24} weight={600} fill={C.mute} o={s15row[0]}>class scores</Txt>
          {CLASSES.map((c, i) => (
            <g key={c} opacity={s15row[i] < 0.999 ? s15row[i] : undefined}>
              <Txt x={300} y={700 + i * 62} size={32} anchor="end" weight={i === 0 ? 700 : 500} fill={i === 0 ? C.chalk : C.chalk2}>{c}</Txt>
              <Txt x={420} y={700 + i * 62} size={32} anchor="end" mono weight={i === 0 ? 700 : 500} fill={i === 0 ? C.chalk : C.chalk2}>
                {`${LOG[i] < 0 ? '−' : ''}${Math.abs(LOG[i]).toFixed(2)}`}
              </Txt>
            </g>
          ))}
          <Flow pts={[[480, 762], [640, 762]]} color={C.chalk2} p={s15sh} head={14} />
          <Txt x={560} y={734} size={22} fill={C.mute} o={s15sh}>softmax</Txt>
          <Txt x={680} y={640} size={24} weight={600} fill={C.mute} o={s15sh} anchor="start">shares</Txt>
          <ShareBars x={680} y={700} labels={CLASSES} from={PROB} rowH={62} labelW={150} w={420} size={30} o={s15sh} p={s15shp} />
        </Svg>
        <Credit x={ph15.x + ph15.w} y={ph15.y + ph15.h + 8} ax="right" text={credit(EX)} o={s15ph} />
        <EvTag x={1760} y={900} ax="right" kind="computed" text="sparse final layer on the worked photo" o={s15w} />
      </Slide>

      {/* ============================================================ 17.16 why sparse */}
      <Slide o={sl(16)}>
        <SlideHead text={bh(P, 16)} />
        <Svg>
          <g opacity={s16d * (1 - 0.55 * s16dim) < 0.999 ? s16d * (1 - 0.55 * s16dim) : undefined}>
            {CLASSES.map((c, i) => (
              <Txt key={c} x={G16X - 20} y={G16Y + (i + 0.5) * G16RH} size={28} anchor="end" weight={700} fill={C.chalk}>{c}</Txt>
            ))}
            {CLASSES.map((_, i) => FINAL.map((__, j) => {
              const a = 0.15 + 0.6 * (((i * 34 + j) * 7919) % 97) / 96;
              return <rect key={`${i}-${j}`} x={G16X + j * G16CW} y={G16Y + i * G16RH + 3} width={G16CW - 4} height={G16RH - 6} rx={3} fill={rgba(HEADC, a)} />;
            }))}
          </g>
        </Svg>
        <Rich x={G16X} y={G16Y - 70} size={30} weight={650} text={`dense: all ${N_W} {f:weights} in use`} o={s16d} />
        <Rich x={G16X} y={G16Y + 3 * G16RH + 24} size={28} color={C.chalk2} text={`nobody can check ${N_W} numbers per decision`} o={s16dim} />
        <Rich x={1080} y={G16Y - 70} size={30} weight={650} text={`sparse: ${N_NZ} {f:weights}`} o={s16s(0)} />
        {M8.map((m, i) => {
          const cls = WMAT.findIndex((row) => Math.abs(row[FINAL.indexOf(m.name)] as number) > 1e-9);
          const v = wOf(cls, m.name);
          const hi = m.name === 'black and white stripes' ? s16hi : 0;
          return (
            <div key={m.name} style={{
              position: 'absolute', left: 1080, top: G16Y - 8 + i * 58, width: 640, height: 50, boxSizing: 'border-box', display: 'flex', alignItems: 'center',
              gap: 14, padding: '0 14px', borderRadius: 10, opacity: s16s(i), fontFamily: F.sans, fontSize: 28, color: C.chalk,
              background: rgba(C.concept, 0.05 + 0.12 * hi), border: `2px solid ${rgba(C.concept, 0.25 + 0.6 * hi)}`,
            }}>
              <span style={{ color: C.concept, flex: '0 0 300px' }}>{m.name}</span>
              <span style={{ color: C.chalk2 }}>→</span>
              <span style={{ fontWeight: 700, flex: '0 0 120px' }}>{CLASSES[cls]}</span>
              <span style={{ fontFamily: F.mono, fontWeight: 700, color: HEADC }}>{sgn(v)}</span>
            </div>
          );
        })}
        <Rich x={1080} y={G16Y + 6 * 58 + 30} w={680} size={30} text="each weight is a claim a person can check" o={s16l} />
        <EvTag x={G16X - 170} y={900} kind="schematic" text="dense layer drawn for scale, values not shown" o={s16d} />
        <EvTag x={1760} y={900} ax="right" kind="computed" text="weights of the sparse final layer" o={s16s(0)} />
      </Slide>

      {/* ============================================================ 17.17 the risk: setting concepts */}
      <Slide o={sl(17)}>
        <SlideHead text={bh(P, 17)} />
        <Svg>
          {[ANIMAL, SETTING].map((list, g) => list.map((it, i) => {
            const o = g === 0 ? s17a : s17s[i];
            if (o <= 0.001) return null;
            const x = g === 0 ? 220 : 1010, y = 450 + i * 96;
            const v = wOf(it.cls, it.name);
            return (
              <g key={it.name} opacity={o < 0.999 ? o : undefined}>
                <rect x={x} y={y - 34} width={360} height={68} rx={12} fill={rgba(C.concept, g ? 0.16 : 0.07)} stroke={rgba(C.concept, g ? 0.95 : 0.55)} strokeWidth={g ? 3 : 2} />
                <Txt x={x + 20} y={y + 1} size={28} anchor="start" fill={C.chalk}>{it.name}</Txt>
                <Txt x={x + 390} y={y + 1} size={28} mono weight={700} anchor="start" fill={HEADC}>{sgn(v)}</Txt>
                <Txt x={x + 500} y={y + 1} size={28} anchor="start" weight={600} fill={C.chalk}>{`→ ${CLASSES[it.cls]}`}</Txt>
              </g>
            );
          }))}
        </Svg>
        <Rich x={220} y={370} size={32} weight={650} text="about the {y:animal}" o={s17a} />
        <Rich x={1010} y={370} size={32} weight={650} text="about the setting" o={s17s[0]} />
        <Rich x={960} y={790} ax="center" size={34} text="the {f:head} uses context as evidence" o={s17e} />
        <Rich x={960} y={845} ax="center" size={30} color={C.chalk2} text="a horse beside a safari vehicle loses evidence for {y:horse}" o={s17h} />
        <EvTag x={1760} y={910} ax="right" kind="computed" text="weights of the sparse final layer" o={s17a} />
      </Slide>

      {/* ============================================================ 17.18 what changed compared with the plain CBM */}
      <Slide o={sl(18)}>
        <SlideHead text={bh(P, 18)} />
        <HText x={C18[0]} y={350} ax="center" size={30} weight={600} color={C.chalk2} o={s18h}>plain CBM</HText>
        <HText x={C18[1]} y={350} ax="center" size={30} weight={700} o={s18h}>label-free CBM</HText>
        {[
          { lab: 'who names the {c:concepts}', a: 'a person', b: 'a language model' },
          { lab: 'the {c:concept layer} learns from', a: 'concept labels', b: "CLIP's scores" },
          { lab: 'the {f:head} learns from', a: 'class labels', b: 'class labels, sparse' },
        ].map((r, i) => {
          const o = s18r[i];
          if (o <= 0.001) return null;
          const y = R18Y[i];
          return (
            <React.Fragment key={i}>
              <Rich x={160} y={y} ay="middle" size={30} text={r.lab} o={o} />
              <HText x={C18[0]} y={y} ax="center" ay="middle" size={30} color={C.chalk2} o={o}>{r.a}</HText>
              <div style={{
                position: 'absolute', left: C18[1] - 210, top: y - 34, width: 420, height: 68, boxSizing: 'border-box', borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: o, fontFamily: F.sans, fontSize: 30, fontWeight: 600, color: C.chalk,
                background: rgba(C.concept, i < 2 ? 0.12 : 0.03), border: `2px solid ${rgba(C.concept, i < 2 ? 0.8 : 0.25)}`,
              }}>{r.b}</div>
            </React.Fragment>
          );
        })}
        <Svg><line x1={160} x2={1760} y1={400} y2={400} stroke={C.line2} strokeWidth={2} opacity={s18h} /></Svg>
        <Rich x={960} y={790} ax="center" size={32} text="label-free is not unsupervised:" o={s18u} />
        {['language model', '{x:CLIP}', '{y:class labels}'].map((s, i) => (
          <Rich key={i} x={700 + i * 260} y={860} ax="center" size={30} color={C.chalk2} text={s} o={s18c[i]} />
        ))}
      </Slide>

      {/* ============================================================ 17.19 in symbols */}
      <Slide o={sl(19)}>
        <SlideHead text={bh(P, 19)} />
        <VariantCard name="Label-free CBM (Oikarinen et al., ICLR 2023)" rows={VROWS} p={cardP} y0={262} />
      </Slide>
    </Stage>
  );
};
