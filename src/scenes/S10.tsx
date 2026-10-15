// s10 Part 10 · Modern concept bottleneck architectures (12 beats; one idea per slide).
// 10.1 the cost: six training photos, each with three 0 / 1 concept boxes that a person fills one by one.
// 10.2 one supervised record: the worked photo (D.worked.example) and its JSON card; then CUB's 112 labels per
//      photograph, drawn as Herring Gull's real class-level row (D.cub.herring_gull, 112 cells).
// 10.3 to 10.5 the supervision ladder, one rung per slide, as a descending staircase of cards joined by labelled
//      arrows: {x, c, y} CBM, CEM; {x, y} PCBM, LF-CBM, LaBo, VLG-CBM; no task training: CBD.
// 10.6 to 10.7 matching workflows: LaBo learns a task head from class-labelled images; classification by
//      description averages scores with a fixed rule. Both retain pretrained CLIP and text descriptions.
// 10.8 the trade-off: concept labels written by people (12 boxes, none, none) and who checks each concept against the
//      photo (a person, ?, ?).   10.9 the question to carry: is the named concept really visible in the image?
// 10.10 the four things a variant can change, with the plain CBM's answers (s19 reuses the rows).
// 10.11 the running example: the 36 Commons photos by class, 24 train and 12 test (D.worked.train / test).
// 10.12 the path in symbols, x -> c hat -> y hat, and the empty card every variant scene ends on.
// Slides replace each other: the old one fades out just before a beat, the new one fades in on its first words.
import React from 'react';
import { C, F } from '../kit/theme';
import { E, HText, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, bs, be, bw, bh, clamp, inv, type SceneProps } from '../kit/core';
import { ArchMap, Credit, EvTag, Flow, Person, PhotoR, Pill, rgba } from '../kit/cbm';
import { lerp } from '../kit/anim';
import { TexSteps } from '../kit/slots';
import { D } from '../kit/data';

const WK = D.worked;
const SIZE: Record<string, [number, number]> = WK.photo_size;
const TRAIN: string[] = WK.train;
const TEST: string[] = WK.test;
const CLS: string[] = WK.classes;
const EX: string = WK.example;
const EXC = WK.photo_credit[EX];
const COLLECTIVE = '36 Wikimedia Commons photographs (CC BY-SA / CC BY / public domain)';
const HG = (D as unknown as { cub: { herring_gull: { vector: number[] } } }).cub.herring_gull;
const NC_CUB: number = HG.vector.length; // 112 (Koh et al.'s CUB concepts)

/** a centred window of a worked photo with aspect h / w = a (so PhotoR never stretches it) */
const thumbFrac = (file: string, a: number): [number, number, number, number] => {
  const [iw, ih] = SIZE[file];
  const r = ih / iw;
  if (r > a) { const s = a / r; return [0, (1 - s) / 2, 1, (1 + s) / 2]; }
  const s = r / a; return [(1 - s) / 2, 0, (1 + s) / 2, 1];
};

// ---------------------------------------------------------------- 10.1 the labelling row
const CONCEPTS3 = ['stripes', 'horse-like shape', 'long neck'];
const TRUTH: Record<string, number[]> = { zebra: [1, 1, 0], horse: [0, 1, 0], giraffe: [0, 0, 1] };
const byClass = (c: string) => TRAIN.filter((f) => f.startsWith(c));
const CARDS: string[] = CLS.flatMap((c) => (c === 'horse' ? [byClass(c)[0], byClass(c)[2]] : byClass(c).slice(0, 2)));
const CW = 200, CH = 134, CG = 30, CX0 = 410, CY = 320;
const cardX = (k: number) => CX0 + k * (CW + CG);
const BOX = 34, BOXG = 50;
const boxY = (r: number) => CY + CH + 46 + r * BOXG;

// ---------------------------------------------------------------- 10.2 the JSON card
type Tok = [string, string];
const KEY = C.chalk2, STR = C.concept, NUM = C.chalk, PUN = C.mute;
const JSON_LINES: Tok[][] = [
  [['{', PUN]],
  [['  "image"', KEY], [': ', PUN], [`"${EX}"`, STR], [',', PUN]],
  [['  "concepts"', KEY], [': {', PUN]],
  [['    "stripes"', KEY], [': ', PUN], ['1', NUM], [',', PUN]],
  [['    "horse_like_shape"', KEY], [': ', PUN], ['1', NUM], [',', PUN]],
  [['    "long_neck"', KEY], [': ', PUN], ['0', NUM]],
  [['  },', PUN]],
  [['  "label"', KEY], [': ', PUN], ['"zebra"', STR]],
  [['}', PUN]],
];
const PH2 = { x: 160, y: 340, w: 390, h: 260 };
const JX = 640, JY = 312, JW = 560, JLH = 40, JSZ = 26;
const GX0 = 1260, GY0 = 380, GCS = 32; // CUB grid: 14 x 8 cells

const JsonCard: React.FC<{ o: number; lineO: (i: number) => number; hi: (i: number) => number }> = ({ o, lineO, hi }) =>
  o <= 0.001 ? null : (
    <div style={{
      position: 'absolute', left: JX, top: JY, width: JW, opacity: o < 0.999 ? o : undefined, background: rgba(C.bg2, 0.96),
      border: `2px solid ${C.line2}`, borderRadius: 14, padding: '20px 26px', boxSizing: 'border-box', fontFamily: F.mono, fontSize: JSZ,
      lineHeight: `${JLH}px`, whiteSpace: 'pre', boxShadow: '0 18px 50px rgba(0,0,0,0.4)',
    }}>
      {JSON_LINES.map((ln, i) => (
        <div key={i} style={{ opacity: lineO(i), background: hi(i) > 0.01 ? rgba(C.concept, 0.12 * hi(i)) : undefined, borderRadius: 6, margin: '0 -8px', padding: '0 8px' }}>
          {ln.map(([s, col], j) => <span key={j} style={{ color: col }}>{s}</span>)}
        </div>
      ))}
    </div>
  );

// ---------------------------------------------------------------- 10.3 to 10.5 the ladder
type Rung = { tex: string; desc: string; who: string };
const RUNGS: Rung[] = [
  { tex: '\\{\\cin{x},\\ \\ccon{c},\\ y\\}', desc: '{x:images}, {c:concept labels}, {y:class labels}', who: 'CBM, concept embedding model (CEM)' },
  { tex: '\\{\\cin{x},\\ y\\}', desc: '{x:images} and {y:class labels}', who: 'post-hoc CBM, label-free CBM, LaBo, VLG-CBM' },
  { tex: '\\varnothing', desc: 'no training for this task', who: 'classification by description' },
];
// a staircase of three wide cards, each step a little lower, connected by labelled arrows
const LW = 400, LH = 372, LPAD = 32, LSTEP = 64;
const LX = (k: number) => 160 + k * 600, LY = (k: number) => 308 + k * LSTEP;
const LDIV = 250; // divider between data and methods, from the card top
const AXY = 872; // the "less supervision" axis
/** arrow from card k - 1 into card k: horizontal, at a height both cards cover */
const arrowY = (k: number) => LY(k) + 196;

// ---------------------------------------------------------------- 10.6 and 10.7 matching workflows
// The same photograph, descriptions and frozen scorer stay in the same positions.
// Only the combination changes: a learned task head versus a fixed class average.
const RPH = { x: 160, y: 438, w: 240, h: 160 };
const FLOW_BOXES = [
  { x: 520, w: 280, color: C.input },
  { x: 890, w: 250, color: C.concept },
  { x: 1230, w: 320, color: C.head },
];

// ---------------------------------------------------------------- 10.8 and 10.9 the trade-off
const QX = [820, 1160, 1500]; // rung columns
const QR = [470, 680]; // the two rows
const QPH = { x: 180, y: 340, w: 470, h: 313 }; // slide 9 photo

// ---------------------------------------------------------------- 10.10 the four rows
const ROWS = ['concept source', 'detector', 'representation', 'what reaches the head'];
const CBM_CELLS = ['people label every concept', 'a trained concept predictor', 'one number per concept', 'only the concept values'];
const TX0 = 380, TC1 = 880, TC1W = 640, TRH = 96, TY0 = 350;

// ---------------------------------------------------------------- 10.7 the photo strip
const SW = 104, SH = 70, SG = 8, SX0 = 360, STX0 = 1292, SY0 = 420, SRH = 92;

// ---------------------------------------------------------------- 10.8 the card skeleton
const VROWS: [string, string][] = [
  ['concept predictor', '\\gth'], ['what reaches the head', '\\ch'], ['task head', '\\fph'], ['what is trained', ''], ['data needed', ''],
];
const VX = 460, VW = 1000, VY = 450, VRH = 74;

export const S10: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.4) => inv(x, x + d, t);
  const NB = P.beats.length;
  /** slides k0..k1 as one stage: fade in on beat k0's first words, fade out (0.3 s) just before beat k1 + 1 */
  const span = (k0: number, k1: number) => {
    const fin = inv(b(k0) - 0.05, b(k0) + 0.25, t);
    if (k1 >= NB) return fin;
    const z = Math.min(be(P, k1) + 0.02, b(k1 + 1) - 0.34);
    return fin * (1 - inv(z, z + 0.3, t));
  };
  const so = (k: number) => span(k, k);

  // ---------------- 10.1
  const s1 = so(1);
  const cardO = (k: number) => at(b(1) + 0.1 + k * 0.07, 0.4);
  const T0 = w(1, 'person') + 0.2, T1 = w(1, 'main') - 0.2;
  const dt = (T1 - T0) / CARDS.length;
  const fillAt = (k: number, r: number) => T0 + k * dt + ((r + 0.3) * dt) / 3.4;
  const kNow = clamp(Math.floor((t - T0) / dt), 0, CARDS.length - 1);
  const hopU = t < T0 ? 0 : E.io(clamp((((t - T0) / dt) % 1) * 2.4));
  const pX = t < T0 ? cardX(0) : t > T1 ? cardX(CARDS.length - 1) : lerp(cardX(Math.max(0, kNow - 1)), cardX(kNow), kNow === 0 ? 1 : hopU);
  const personX = pX + CW + 16;
  const personY = CY + CH * 0.5 - (t > T0 && t < T1 && kNow > 0 ? Math.sin(Math.PI * hopU) * 24 : 0);
  const personO = at(w(1, 'person') - 0.2) * (1 - at(T1 + 0.4, 0.5));
  const l1a = at(w(1, 'every') - 0.1), l1b = at(w(1, 'main') - 0.1);

  // ---------------- 10.2
  const s2 = so(2);
  const ph2 = at(w(2, 'image') - 0.3);
  const lineT = [w(2, 'record'), w(2, 'image'), w(2, '0') - 0.2, w(2, '0'), w(2, '1') + 0.05, w(2, 'each') + 0.05, w(2, 'named'), w(2, 'class'), w(2, 'class')];
  const lineO = (i: number) => at(lineT[i] - 0.1, 0.35);
  const hiJ = (i: number) => {
    if (i === 1) return at(w(2, 'image')) * (1 - at(w(2, '0') - 0.2));
    if (i >= 3 && i <= 5) return at(w(2, '0')) * (1 - at(w(2, 'class') - 0.1));
    if (i === 7) return at(w(2, 'class')) * (1 - at(w(2, 'On')));
    return 0;
  };
  const cubO = at(w(2, 'CUB') - 0.1);
  const cub0 = w(2, '112') - 0.1, cub1 = w(2, 'photograph') + 0.2;
  const cubTxt = at(w(2, '112') - 0.1);

  // ---------------- 10.3 to 10.5 the ladder (one stage, rung by rung)
  const sL = span(3, 5);
  const rungO = [at(w(3, 'first') - 0.2), at(b(4) - 0.05), at(b(5) - 0.05)];
  // the current rung is highlighted; earlier rungs stay readable (0.6)
  const hl = [1 - at(b(4) - 0.05), at(b(4) - 0.05) * (1 - at(b(5) - 0.05)), at(b(5) - 0.05)];
  const rungDim = hl.map((h) => 0.6 + 0.4 * h);
  const dropO = [0, at(w(4, 'drop') - 0.15), at(w(5, 'drops') - 0.15)];
  const lessO = at(w(3, 'ladder') - 0.1);
  // the steps still to come, as dashed outlines, from "ladder" until each rung arrives
  const ghostO = (k: number) => lessO * (1 - rungO[k]);

  // ---------------- 10.6 and 10.7 matching workflows
  const workflow = [6, 7].map((k) => ({
    k, o: so(k),
    input: at(b(k) + 0.15),
    scores: at(w(k, 'CLIP') - 0.1),
    head: at(w(k, k === 6 ? 'training' : 'average') - 0.1),
    result: at(w(k, k === 6 ? 'predicts' : 'choose') - 0.1),
    takeaway: at(w(k, k === 6 ? 'need' : 'difference') - 0.1),
  }));

  // ---------------- 10.8 and 10.9 the trade-off
  const s8q = so(8), s9q = so(9);
  const qRow = [at(w(8, 'saves') - 0.15, 0.5), at(w(8, 'removes') - 0.1, 0.5)];
  const qTick = at(w(8, 'person') - 0.1);
  const qQ = at(w(8, 'higher') - 0.1);
  const q9ph = at(b(9) - 0.05, 0.4);
  const q9chip = at(w(9, 'named') - 0.2);
  const q9mark = at(w(9, 'visible') - 0.1);
  const q9txt = at(w(9, 'watch') - 0.1);
  const q9back = at(w(9, 'back') - 0.1);

  // ---------------- 10.10
  const s6 = so(10);
  const rowT = [w(10, 'where'), w(10, 'how'), w(10, 'how', 1), w(10, 'what')];

  // ---------------- 10.7
  const s7 = so(11);
  const rowS = [w(11, 'zebras'), w(11, 'horses'), w(11, 'giraffes')];
  const trO = at(w(11, '24') - 0.1), teO = at(w(11, '12') - 0.1);
  const p4 = at(w(11, 'Part') - 0.1);

  // ---------------- 10.8
  const s8 = so(12);
  const pathO = at(w(12, 'path') - 0.1);
  const pathParts: [string, number][] = [['\\cin{x}', w(12, 'x')], ['\\;\\longrightarrow\\;\\ch', w(12, 'hat')], ['\\;\\longrightarrow\\;\\yh', w(12, 'hat', 1)]];
  const skel = at(w(12, 'write') - 0.1);
  const skelRow = (i: number) => at(w(12, 'write') + 0.1 + i * 0.18, 0.35);

  const oo = (s: number, v = 1) => s * v;

  return (
    <Stage>
      {/* ================= photos ================= */}
      {s1 > 0.001 ? CARDS.map((f, k) => (
        <PhotoR key={f} R={{ x: cardX(k), y: CY, w: CW, h: CH }} src={`worked/${f}`} frac={thumbFrac(f, CH / CW)} o={s1 * cardO(k)} radius={8} />
      )) : null}
      <PhotoR R={PH2} src={`worked/${EX}`} o={s2 * ph2} />
      {workflow.map(({ k, o, input }) => (
        <PhotoR key={k} R={RPH} src={`worked/${EX}`} frac={thumbFrac(EX, RPH.h / RPH.w)} o={o * input} radius={8} />
      ))}
      <PhotoR R={QPH} src={`worked/${EX}`} frac={thumbFrac(EX, QPH.h / QPH.w)} o={s9q * q9ph} />
      {s7 > 0.001 ? CLS.map((c, r) => {
        const files = [...TRAIN.filter((f) => f.startsWith(c)), ...TEST.filter((f) => f.startsWith(c))];
        return files.map((f, k) => {
          const x = k < 8 ? SX0 + k * (SW + SG) : STX0 + (k - 8) * (SW + SG);
          const o = at(rowS[r] - 0.15 + k * 0.035, 0.35);
          return <PhotoR key={f} R={{ x, y: SY0 + r * SRH, w: SW, h: SH }} src={`worked/${f}`} frac={thumbFrac(f, SH / SW)} o={s7 * o} radius={6} shadow={false} />;
        });
      }) : null}

      <Svg>
        {/* ---------------- slide 1: concept boxes, filled by a person ---------------- */}
        {s1 > 0.001 ? (
          <g opacity={s1 < 0.999 ? s1 : undefined}>
            {CONCEPTS3.map((c, r) => (
              <Txt key={c} x={CX0 - 30} y={boxY(r)} size={26} anchor="end" fill={C.concept} o={at(b(1) + 0.4)}>{c}</Txt>
            ))}
            {CARDS.map((f, k) => {
              const cls = CLS.find((c) => f.startsWith(c)) as string;
              return CONCEPTS3.map((_, r) => {
                const bx = cardX(k) + CW / 2 - BOX / 2, by = boxY(r) - BOX / 2;
                const v = TRUTH[cls][r];
                const f1 = at(fillAt(k, r), 0.18);
                return (
                  <g key={`${k}-${r}`} opacity={cardO(k)}>
                    <rect x={bx} y={by} width={BOX} height={BOX} rx={6} fill={v && f1 > 0 ? rgba(C.concept, 0.24 * f1) : C.bg3}
                      stroke={f1 > 0.5 ? (v ? C.concept : C.line2) : C.line2} strokeWidth={2} />
                    <Txt x={bx + BOX / 2} y={by + BOX / 2 + 1} size={22} mono weight={700} fill={v ? C.concept : C.mute} o={f1}>{String(v)}</Txt>
                  </g>
                );
              });
            })}
            <Person x={personX} y={personY} s={0.75} o={personO} />
          </g>
        ) : null}

        {/* ---------------- slide 2: photo -> record, CUB grid ---------------- */}
        {s2 > 0.001 ? (
          <g opacity={s2 < 0.999 ? s2 : undefined}>
            <Flow pts={[[PH2.x + PH2.w + 10, JY + 20 + JLH * 1.5], [JX - 10, JY + 20 + JLH * 1.5]]} color={C.input} p={at(w(2, 'image'))} t={t} live={1} n={1} head={13} dotR={5} />
            {cubO > 0.001 ? (
              <g opacity={cubO < 0.999 ? cubO : undefined}>
                <Txt x={GX0} y={GY0 - 34} size={26} anchor="start" weight={600} fill={C.chalk2}>CUB birds, as used by Koh et al. 2020</Txt>
                {HG.vector.map((v, i) => {
                  const c = i % 14, r = Math.floor(i / 14);
                  const f = at(lerp(cub0, cub1, i / NC_CUB), 0.15);
                  return (
                    <rect key={i} x={GX0 + c * GCS} y={GY0 + r * GCS} width={GCS - 6} height={GCS - 6} rx={4} fill={f > 0 && v ? rgba(C.concept, 0.8 * f) : C.bg3}
                      stroke={f > 0.5 ? rgba(C.concept, 0.7) : C.line2} strokeWidth={1.5} />
                  );
                })}
              </g>
            ) : null}
          </g>
        ) : null}

        {/* ---------------- slides 3 to 5: the ladder ---------------- */}
        {sL > 0.001 ? (
          <g opacity={sL < 0.999 ? sL : undefined}>
            {[1, 2].map((k) => (
              <rect key={`g${k}`} x={LX(k)} y={LY(k)} width={LW} height={LH} rx={18} fill="none" stroke={C.line2} strokeWidth={2}
                strokeDasharray="10 10" opacity={ghostO(k)} />
            ))}
            {RUNGS.map((_, k) => (
              <g key={k} opacity={rungO[k] * rungDim[k]}>
                <rect x={LX(k)} y={LY(k)} width={LW} height={LH} rx={18} fill={hl[k] > 0.5 ? C.bg3 : C.bg2}
                  stroke={hl[k] > 0.5 ? C.chalk2 : C.line2} strokeWidth={hl[k] > 0.5 ? 3 : 2} />
                <line x1={LX(k) + LPAD} x2={LX(k) + LW - LPAD} y1={LY(k) + LDIV} y2={LY(k) + LDIV} stroke={C.line2} strokeWidth={1.5} />
              </g>
            ))}
            {[1, 2].map((k) => {
              const x0 = LX(k - 1) + LW + 18, x1 = LX(k) - 18, y = arrowY(k);
              return (
                <g key={k} opacity={rungO[k]}>
                  <line x1={x0} y1={y} x2={x1 - 16} y2={y} stroke={C.chalk2} strokeWidth={3} />
                  <path d={`M ${x1} ${y} L ${x1 - 20} ${y - 11} L ${x1 - 20} ${y + 11} Z`} fill={C.chalk2} />
                </g>
              );
            })}
            <g opacity={lessO}>
              <line x1={160} y1={AXY} x2={1736} y2={AXY} stroke={C.line2} strokeWidth={2.5} />
              <path d={`M 1760 ${AXY} L 1736 ${AXY - 12} L 1736 ${AXY + 12} Z`} fill={C.line2} />
            </g>
          </g>
        ) : null}

        {/* ---------------- slides 6 and 7: shared inputs, different combination ---------------- */}
        {workflow.map(({ k, o, input, scores, head, result }) => o > 0.001 ? (
          <g key={k} opacity={o < 0.999 ? o : undefined}>
            {FLOW_BOXES.map((box, i) => (
              <rect key={i} x={box.x} y={438} width={box.w} height={160} rx={14}
                fill={rgba(box.color, 0.1)} stroke={box.color} strokeWidth={i === 2 ? 3 : 2}
                opacity={i === 2 ? head : scores} />
            ))}
            <rect x={160} y={714} width={400} height={88} rx={12} fill={rgba(C.concept, 0.08)} stroke={C.concept} strokeWidth={2} opacity={input} />
            <Flow pts={[[420, 518], [500, 518]]} color={C.input} o={scores} />
            <Flow pts={[[560, 758], [660, 758], [660, 618]]} color={C.concept} o={scores} />
            <Flow pts={[[820, 518], [870, 518]]} color={C.concept} o={scores} />
            <Flow pts={[[1160, 518], [1210, 518]]} color={C.head} o={head} />
            <Flow pts={[[1570, 518], [1640, 518]]} color={C.chalk} o={result} />
            {k === 6 ? <Flow pts={[[1390, 382], [1390, 418]]} color={C.head} o={head} /> : null}
          </g>
        ) : null)}

        {/* ---------------- slide 8: less labelling, fewer checks ---------------- */}
        {s8q > 0.001 ? (
          <g opacity={s8q < 0.999 ? s8q : undefined}>
            <line x1={160} y1={QR[0] + 105} x2={1760} y2={QR[0] + 105} stroke={C.line} strokeWidth={1.5} opacity={qRow[1]} />
            {/* row 1: concept labels written by people */}
            <g opacity={qRow[0]}>
              {Array.from({ length: 12 }, (_, i) => (
                <rect key={i} x={QX[0] - 92 + (i % 4) * 48} y={QR[0] - 62 + Math.floor(i / 4) * 44} width={38} height={34} rx={6}
                  fill={rgba(C.concept, 0.22)} stroke={C.concept} strokeWidth={1.8} />
              ))}
              {[1, 2].map((k) => (
                <rect key={k} x={QX[k] - 92} y={QR[0] - 62} width={182} height={122} rx={10} fill="none" stroke={C.line2} strokeWidth={2} strokeDasharray="8 8" />
              ))}
            </g>
            {/* row 2: a person checks each concept against the photo */}
            <g opacity={qRow[1]}>
              <Person x={QX[0] - 30} y={QR[1] + 6} s={0.85} />
              <g opacity={qTick}>
                <circle cx={QX[0] + 50} cy={QR[1]} r={24} fill={C.good} />
                <path d={`M ${QX[0] + 38} ${QR[1]} l 8 9 l 16 -18`} fill="none" stroke="#0B0F14" strokeWidth={4} strokeLinecap="round" />
              </g>
              {[1, 2].map((k) => <Txt key={k} x={QX[k]} y={QR[1]} size={64} weight={700} fill={C.chalk2} o={qQ}>?</Txt>)}
            </g>
          </g>
        ) : null}

        {/* ---------------- slide 9: the question to carry ---------------- */}
        {s9q > 0.001 ? (
          <g opacity={s9q < 0.999 ? s9q : undefined}>
            <Flow pts={[[QPH.x + QPH.w + 150, QPH.y + QPH.h + 70], [QPH.x + QPH.w * 0.62, QPH.y + QPH.h * 0.62]]} color={C.concept} sw={3} dash="4 9" head={16} p={q9chip} o={q9chip} />
            <Pill x={QPH.x + QPH.w + 150} y={QPH.y + QPH.h + 70} text="black and white stripes" color={C.concept} size={30} anchorX="start" anchorY="middle" o={q9chip} />
            <g opacity={q9mark}>
              <circle cx={QPH.x + QPH.w * 0.62} cy={QPH.y + QPH.h * 0.62} r={36} fill={rgba(C.bg, 0.75)} stroke={C.chalk} strokeWidth={3} />
              <Txt x={QPH.x + QPH.w * 0.62} y={QPH.y + QPH.h * 0.62 + 2} size={44} weight={700} fill={C.chalk}>?</Txt>
            </g>
          </g>
        ) : null}

        {/* ---------------- slide 10: the four rows ---------------- */}
        {s6 > 0.001 ? (
          <g opacity={s6 < 0.999 ? s6 : undefined}>
            <Txt x={TX0} y={TY0} size={26} anchor="start" mono weight={600} fill={C.mute}>what changes</Txt>
            <Txt x={TC1 + 22} y={TY0} size={30} anchor="start" weight={700} fill={C.chalk}>plain CBM</Txt>
            <line x1={TX0} y1={TY0 + 36} x2={TC1 + TC1W} y2={TY0 + 36} stroke={C.line2} strokeWidth={2} />
            {ROWS.map((r, i) => {
              const y = TY0 + 36 + TRH * (i + 0.5);
              const o = at(rowT[i] - 0.15);
              const oc = at(rowT[i] + 0.4);
              return o > 0.001 ? (
                <g key={r} opacity={o < 0.999 ? o : undefined}>
                  <Txt x={TX0} y={y} size={32} anchor="start" weight={600} fill={C.chalk}>{r}</Txt>
                  <rect x={TC1} y={y - TRH / 2 + 12} width={TC1W} height={TRH - 24} rx={10} fill={rgba(C.concept, 0.07)} stroke={rgba(C.concept, 0.5)} strokeWidth={1.5} opacity={oc} />
                  <Txt x={TC1 + 22} y={y} size={30} anchor="start" fill={C.chalk} o={oc}>{CBM_CELLS[i]}</Txt>
                  {i < ROWS.length - 1 ? <line x1={TX0} y1={y + TRH / 2} x2={TC1 + TC1W} y2={y + TRH / 2} stroke={C.line} strokeWidth={1.5} /> : null}
                </g>
              ) : null;
            })}
          </g>
        ) : null}

        {/* ---------------- slide 7: class labels, train / test split ---------------- */}
        {s7 > 0.001 ? (
          <g opacity={s7 < 0.999 ? s7 : undefined}>
            {CLS.map((c, r) => (
              <Txt key={c} x={160} y={SY0 + r * SRH + SH / 2} size={32} anchor="start" weight={600} fill={C.chalk} o={at(rowS[r] - 0.15, 0.35)}>{c}</Txt>
            ))}
            <line x1={STX0 - 18} y1={SY0 - 6} x2={STX0 - 18} y2={SY0 + 2 * SRH + SH + 6} stroke={C.line2} strokeWidth={2} strokeDasharray="5 6" opacity={trO} />
          </g>
        ) : null}

        {/* ---------------- slide 8: the card skeleton ---------------- */}
        {s8 > 0.001 && skel > 0.001 ? (
          <g opacity={s8 * skel < 0.999 ? s8 * skel : undefined}>
            <rect x={VX} y={VY} width={VW} height={66 + VRH * 5 + 8} rx={16} fill={C.bg2} stroke={C.line} strokeWidth={2} />
            <line x1={VX + 24} x2={VX + VW - 24} y1={VY + 66} y2={VY + 66} stroke={C.line2} strokeWidth={2} />
            {VROWS.map((_, i) => (i ? <line key={i} x1={VX + 24} x2={VX + VW - 24} y1={VY + 66 + VRH * i} y2={VY + 66 + VRH * i} stroke={C.line} strokeWidth={1.5} opacity={skelRow(i)} /> : null))}
          </g>
        ) : null}
      </Svg>

      {/* ================= HTML text ================= */}
      <Header t={t} part={10} title={P.title} />

      {/* slide 1 */}
      <SlideHead text={bh(P, 1)} o={s1} />
      <Rich x={960} y={690} ax="center" size={36} text="a person labels every {c:concept} on every {x:image}" o={oo(s1, l1a)} />
      <Rich x={960} y={756} ax="center" size={32} color={C.chalk2} text="the main cost, which newer methods try to reduce" o={oo(s1, l1b)} />
      <Credit x={CX0} y={boxY(2) + 32} text={COLLECTIVE} o={oo(s1, cardO(0))} />

      {/* slide 2 */}
      <SlideHead text={bh(P, 2)} o={s2} />
      <Credit x={PH2.x} y={PH2.y + PH2.h + 10} text={`Photo: ${EXC.artist}, Wikimedia Commons, ${EXC.license}`} o={oo(s2, ph2)} />
      <JsonCard o={s2} lineO={lineO} hi={hiJ} />
      <EvTag x={JX} y={JY + 420} kind="constructed" text="a teaching record" o={oo(s2, lineO(8))} />
      <Rich x={GX0} y={GY0 + 8 * GCS + 18} size={30} text={`{c:${NC_CUB}} concept labels per photograph`} o={oo(s2, cubTxt)} />
      <EvTag x={GX0} y={GY0 + 8 * GCS + 80} kind="data" text="Herring Gull's labels in CUB" o={oo(s2, cubTxt)} />

      {/* slides 3 to 5: one heading per rung */}
      <SlideHead text={bh(P, 3)} o={so(3)} />
      <SlideHead text={bh(P, 4)} o={so(4)} />
      <SlideHead text={bh(P, 5)} o={so(5)} />
      {RUNGS.map((r, k) => {
        const o = sL * rungO[k] * rungDim[k];
        const x = LX(k) + LPAD, y = LY(k);
        return (
          <React.Fragment key={k}>
            <HText x={x} y={y + 26} size={24} mono weight={600} color={hl[k] > 0.5 ? C.chalk2 : C.mute} o={o}>{`rung ${k + 1} · task data`}</HText>
            {k === 0 ? (
              <TexSteps x={x} y={y + 112} t={t} size={64} o={sL * rungDim[k]}
                parts={[['\\{\\cin{x}', w(3, 'image') - 0.1], [',\\ \\ccon{c}', w(3, 'concept', 1) - 0.1], [',\\ y\\}', w(3, 'class') - 0.1]]} />
            ) : (
              <Tex x={x} y={y + 112} size={64} o={o} tex={r.tex} />
            )}
            <Rich x={x} y={y + 166} w={LW - 2 * LPAD} size={28} lh={1.3} color={C.chalk2} text={r.desc}
              o={k === 0 ? sL * rungDim[k] * at(w(3, 'class')) : o} />
            <HText x={x} y={y + LDIV + 20} w={LW - 2 * LPAD} size={27} weight={700} lh={1.3}
              o={k === 0 ? sL * rungDim[k] * at(w(3, 'CBMs') - 0.1) : o}>{r.who}</HText>
          </React.Fragment>
        );
      })}
      {[1, 2].map((k) => {
        const cx = (LX(k - 1) + LW + LX(k)) / 2, y = arrowY(k);
        const o = sL * dropO[k];
        return (
          <React.Fragment key={k}>
            <Rich x={cx} y={y - 16} ax="center" ay="bottom" size={26} color={C.chalk2} text="drop" o={o} />
            <Rich x={cx} y={y + 16} ax="center" size={26} color={C.chalk2} text={k === 1 ? '{c:concept labels}' : 'task training'} o={o} />
          </React.Fragment>
        );
      })}
      {[1, 2].map((k) => (
        <HText key={`g${k}`} x={LX(k) + LPAD} y={LY(k) + 26} size={24} mono weight={600} color={C.mute} o={sL * ghostO(k)}>{`rung ${k + 1}`}</HText>
      ))}
      <Rich x={1760} y={AXY + 16} ax="right" size={28} color={C.chalk2} text="less supervision" o={oo(sL, lessO)} />

      <Rich x={160} y={936} size={28} text="Language in a Bottle (LaBo)" o={oo(sL, rungO[1])} />
      <Rich x={160} y={978} size={28} text="Vision-Language-Guided Concept Bottleneck Model (VLG-CBM)" o={oo(sL, rungO[1])} />

      {/* slides 6 and 7: keep the common pipeline in place, change the combination */}
      {workflow.map(({ k, o, input, scores, head, result, takeaway }) => (
        <React.Fragment key={k}>
          <SlideHead text={bh(P, k)} o={o} />
          <HText x={160} y={302} size={28} weight={600} color={C.chalk2} o={o}>
            {k === 6 ? 'Example: Language in a Bottle (LaBo)' : 'Classification by description'}
          </HText>
          <HText x={160} y={610} size={28} color={C.input} o={o * input}>image to classify</HText>
          <HText x={160} y={670} size={26} color={C.concept} o={o * input}>descriptions from a language model</HText>
          <HText x={360} y={758} ax="center" ay="middle" size={26} color={C.concept} o={o * input}>
            e.g. black and white stripes
          </HText>
          <HText x={660} y={490} ax="center" size={32} weight={700} color={C.input} o={o * scores}>pretrained CLIP</HText>
          <HText x={660} y={542} ax="center" size={28} color={C.chalk2} o={o * scores}>kept fixed</HText>
          <HText x={1015} y={518} w={230} ax="center" ay="middle" size={30} lh={1.4} color={C.concept} o={o * scores}>
            description<br />match scores
          </HText>
          <HText x={1390} y={518} w={290} ax="center" ay="middle" size={32} weight={700} lh={1.4} o={o * head}>
            {k === 6 ? <>learned<br />task head</> : <>fixed<br />class averages</>}
          </HText>
          <HText x={1390} y={620} w={340} ax="center" size={26} lh={1.4} color={C.chalk2} o={o * head}>
            {k === 6 ? 'weights learned from class labels' : 'average the description scores within each class'}
          </HText>
          <HText x={1390} y={310} w={420} ax="center" size={28} weight={600} lh={1.4} color={C.chalk2} o={o * head}>
            {k === 6 ? <>class-labelled images<br />teach the head</> : <>no task-labelled examples<br />no fitting</>}
          </HText>
          <HText x={1670} y={518} ay="middle" size={36} weight={700} o={o * result}>zebra</HText>
          <HText x={1670} y={570} size={25} color={C.mute} o={o * result}>{k === 6 ? 'class' : 'highest average'}</HText>
          <Rich x={160} y={870} w={1600} size={34} text={k === 6
            ? 'Rung two: {y:class labels} teach us how to combine the {c:scores}.'
            : 'Rung three: combine the {c:scores} with a {y:fixed average}.'} o={o * takeaway} />
          <EvTag x={160} y={940} kind="schematic" text="example path; no measured scores shown" o={o * input} />
          <Credit x={160} y={988} text={`Photo: ${EXC.artist}, Wikimedia Commons, ${EXC.license}`} o={o * input} />
        </React.Fragment>
      ))}

      {/* slide 8: the trade-off */}
      <SlideHead text={bh(P, 8)} o={s8q} />
      {['rung 1', 'rung 2', 'rung 3'].map((r, k) => (
        <HText key={r} x={QX[k]} y={QR[0] - 120} ax="center" size={24} mono weight={600} color={C.mute} o={oo(s8q, qRow[0])}>{r}</HText>
      ))}
      <Rich x={160} y={QR[0]} ay="middle" w={460} size={32} text="{c:concept labels} for each task image" o={oo(s8q, qRow[0])} />
      <Rich x={QX[1]} y={QR[0]} ax="center" ay="middle" size={30} color={C.mute} text="none" o={oo(s8q, qRow[0])} />
      <Rich x={QX[2]} y={QR[0]} ax="center" ay="middle" size={30} color={C.mute} text="none" o={oo(s8q, qRow[0])} />
      <Rich x={160} y={QR[1]} ay="middle" w={460} size={32} text="someone checks each {c:concept} against the {x:photo}" o={oo(s8q, qRow[1])} />
      <Rich x={960} y={QR[1] + 130} ax="center" size={30} color={C.chalk2} text="without per-image concept labels, check the concepts another way" o={oo(s8q, qQ)} />

      {/* slide 9: the question */}
      <SlideHead text={bh(P, 9)} o={s9q} />
      <Credit x={QPH.x} y={QPH.y + QPH.h + 10} text={`Photo: ${EXC.artist}, Wikimedia Commons, ${EXC.license}`} o={oo(s9q, q9ph)} />
      <Rich x={820} y={380} w={900} size={36} lh={1.4} text="who checks that a named {c:concept} is really visible in the {x:image}?" o={oo(s9q, q9txt)} />
      <Rich x={820} y={540} w={900} size={30} color={C.chalk2} text="we come back to it later in this part: grounding the concepts" o={oo(s9q, q9back)} />

      {/* slide 10 */}
      <SlideHead text={bh(P, 10)} o={s6} />

      {/* slide 11 */}
      <SlideHead text={bh(P, 11)} o={s7} />
      <HText x={SX0} y={SY0 - 52} size={28} weight={600} color={C.chalk2} o={oo(s7, trO)}>
        <span style={{ fontFamily: F.mono, color: C.chalk }}>{WK.n_train}</span> train
      </HText>
      <HText x={STX0} y={SY0 - 52} size={28} weight={600} color={C.chalk2} o={oo(s7, teO)}>
        <span style={{ fontFamily: F.mono, color: C.chalk }}>{WK.n_test}</span> test
      </HText>
      <Credit x={SX0} y={SY0 + 2 * SRH + SH + 14} text={COLLECTIVE} o={oo(s7, at(rowS[0]))} />
      <Rich x={960} y={760} ax="center" size={32} color={C.chalk2} text="the three classes from Part 4" o={oo(s7, p4)} />

      {/* slide 12 */}
      <SlideHead text={bh(P, 12)} o={s8} />
      <TexSteps x={960} y={358} ax="center" t={t} size={60} o={oo(s8, pathO)} parts={pathParts} />
      <HText x={VX + 28} y={VY + 33} ay="middle" size={28} weight={700} o={oo(s8, skel)}>each variant, in symbols</HText>
      {VROWS.map(([lab, tex], i) => {
        const y = VY + 66 + VRH * i + VRH / 2;
        const o = s8 * skel * skelRow(i);
        return (
          <React.Fragment key={lab}>
            <HText x={VX + 28} y={y} ay="middle" size={28} color={C.chalk2} o={o}>{lab}</HText>
            {tex ? <Tex x={VX + 400} y={y} size={36} o={o} tex={tex} /> : null}
            <Tex x={VX + 520} y={y} size={36} o={o} tex={'\\cmu{\\cdots}'} />
          </React.Fragment>
        );
      })}

      <ArchMap on={['c']} o={inv(0, 0.5, t)} />
    </Stage>
  );
};
