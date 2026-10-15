// s12 Part 12 · Beyond images (revision 2: one idea per slide, 8 beats; the medicine slide spans beats 2 and 3)
// 12.1 motivation: the gull pipeline we know (photo -> named concepts -> species); CBMs fit wherever experts reason with
//      named findings.
// 12.2 to 12.6 one domain per slide, the same layout each time: input x (blue) -> a small named concept vector ĉ (teal,
//      illustrative values, tagged) -> task ŷ, plus the source. Medicine: OAI knee X-ray (knee.jpg, Credit), a radiologist
//      corrects one finding (amber, beat 3) and the grade is recomputed. Language: an illustrative review -> food / service /
//      ambiance / noise (CEBaB) -> stars. ICU: schematic vital-sign traces -> learned summary concepts -> vasopressor onset.
//      Wearables: a schematic sensor trace -> simple activities (Nurse data concepts) -> complex activity (X-CHAR).
//      Sleep: the schematic EEG -> spindle, K-complex, slow waves (D.sleep, the Part 6 head) -> stage.
// Each domain slide carries one 'why it fits' line: experts in that domain already use these terms.
// 12.8 recap: the five domains as small chips, and the recipe in words with the same steps in symbols underneath.
// Slides replace each other: the old one fades out in the gap before a beat, the new one fades in on its first words.
import React from 'react';
import { C, F } from '../kit/theme';
import { E, HText, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, be, bh, bs, bw, inv, type SceneProps } from '../kit/core';
import { ArchMap, CREDIT, Credit, EvTag, Flow, Person, PhotoR, Region, VecCol, Wave, fit, rgba, type Rect } from '../kit/cbm';
import { D } from '../kit/data';

const LIT = D.lit;
const EEG = D.eeg;
const SL = D.sleep;
const CEB: string[] = LIT.cebab.concepts;

// ---------------------------------------------------------------- schematic traces (drawn for illustration)
const FS = 50, SEC = 6;
const sig = (f: (s: number) => number) => Array.from({ length: FS * SEC + 1 }, (_, i) => f(i / FS));
// ICU: heart rate drifting up, blood pressure drifting down (arbitrary units)
const HR = sig((s) => 0.25 * Math.sin(2 * Math.PI * 1.6 * s) + 0.12 * Math.sin(2 * Math.PI * 0.31 * s + 1) + 0.09 * s - 0.25);
const BP = sig((s) => 0.18 * Math.sin(2 * Math.PI * 1.6 * s + 0.6) + 0.08 * Math.sin(2 * Math.PI * 0.23 * s) - 0.11 * s + 0.3);
// wearable: three segments with different rhythms (three simple activities in sequence)
const ACC = sig((s) => {
  if (s < 2) return 0.18 * Math.sin(2 * Math.PI * 1.1 * s) + 0.08 * Math.sin(2 * Math.PI * 4.3 * s);
  if (s < 4) return 0.55 * Math.sin(2 * Math.PI * 0.8 * s) * Math.exp(-((s - 3) ** 2) * 1.2) + 0.1 * Math.sin(2 * Math.PI * 5.1 * s);
  return 0.45 * Math.sin(2 * Math.PI * 3.2 * s) * (0.6 + 0.4 * Math.sin(2 * Math.PI * 0.5 * s));
});
const SEG: [number, number][] = [[0.1, 1.95], [2.05, 3.95], [4.05, 5.9]];

// ---------------------------------------------------------------- shared domain-slide geometry
const IN: Rect = { x: 160, y: 370, w: 440, h: 330 }; // input glyph area
const YC = IN.y + IN.h / 2; // 505: the row everything sits on
const VX = 1030, VW = 120, VRH = 64; // concept vector column
const TB = { x: 1290, y: YC - 115, w: 450, h: 230 }; // task box
const KNEE: Rect = (() => {
  const r = fit('knee.jpg', 0, 0, 330);
  return { ...r, x: IN.x + (IN.w - r.w) / 2, y: YC - r.h / 2 };
})();

// ---------------------------------------------------------------- helpers
/** one slide: a full-frame layer with its own opacity */
const Slide: React.FC<{ o: number; children?: React.ReactNode }> = ({ o, children }) =>
  o <= 0.001 ? null : <div style={{ position: 'absolute', inset: 0, opacity: o < 0.999 ? o : undefined }}>{children}</div>;

/** a teal concept chip (HTML), centred on (x, y) */
const Chip: React.FC<{ x: number; y: number; text: React.ReactNode; o: number; size?: number }> = ({ x, y, text, o, size = 26 }) =>
  o <= 0.001 ? null : (
    <div style={{
      position: 'absolute', left: x, top: y + (1 - o) * 8, transform: 'translate(-50%, -50%)', opacity: o, whiteSpace: 'nowrap',
      fontFamily: F.sans, fontSize: size, fontWeight: 600, color: C.chalk, lineHeight: 1.2, padding: '5px 16px', borderRadius: 10,
      border: `2px solid ${C.concept}`, background: rgba(C.concept, 0.12),
    }}>{text}</div>
  );

/** a named concept vector: labels right-aligned left of a bracketed value column; rows appear with rowO(i) */
const NamedVec: React.FC<{
  names: string[]; vals: string[]; rowO: (i: number) => number; hi?: (i: number) => number; edit?: { i: number; to: string; p: number };
}> = ({ names, vals, rowO, hi, edit }) => {
  const n = names.length, y0 = YC - (n * VRH) / 2;
  const allO = rowO(0);
  return (
    <g>
      <g opacity={allO}>
        <VecCol x={VX} y={y0} vals={vals.map((v, i) => (edit && edit.i === i && edit.p > 0.5 ? edit.to : v))} rowH={VRH} w={VW} size={32}
          cellO={(i) => rowO(i)} cellColor={(i) => (edit && edit.i === i && edit.p > 0.5 ? C.edit : C.chalk)}
          ring={(i) => (edit && edit.i === i ? edit.p : 0)} />
      </g>
      {names.map((nm, i) => {
        const h = hi ? hi(i) : 0;
        return (
          <g key={nm} opacity={rowO(i) < 0.999 ? rowO(i) : undefined}>
            {h > 0.01 ? <rect x={VX - 330} y={y0 + i * VRH + 8} width={318} height={VRH - 16} rx={8} fill={rgba(C.concept, 0.14 * h)} stroke={rgba(C.concept, 0.7 * h)} strokeWidth={2} /> : null}
            <Txt x={VX - 22} y={y0 + (i + 0.5) * VRH} size={28} anchor="end" weight={h > 0.5 ? 700 : 500} fill={C.concept}>{nm}</Txt>
          </g>
        );
      })}
    </g>
  );
};

/** the common frame of a domain slide: column headers, arrows, the task box */
const DomainFrame: React.FC<{ t: number; inO: number; vecO: number; taskO: number; live: number; pulse?: number; rows: number }> = ({
  t, inO, vecO, taskO, live, pulse = 0, rows,
}) => {
  return (
    <>
      <Svg>
        <Flow pts={[[IN.x + IN.w + 14, YC], [VX - 340, YC]]} color={C.input} sw={3.5} head={13} p={E.out(vecO)} t={t} live={live} n={1} dotR={5} />
        <Flow pts={[[VX + VW + 18, YC], [TB.x - 14, YC]]} color={C.concept} sw={3.5} head={13} p={E.out(taskO)} t={t + 0.4} live={live} n={1} dotR={5} />
        <g opacity={taskO < 0.999 ? taskO : undefined}>
          {pulse > 0.01 ? <rect x={TB.x - 10} y={TB.y - 10} width={TB.w + 20} height={TB.h + 20} rx={20} fill={rgba(C.chalk, 0.1 * pulse)} /> : null}
          <rect x={TB.x} y={TB.y} width={TB.w} height={TB.h} rx={16} fill={C.bg2} stroke={C.chalk2} strokeWidth={2} />
        </g>
      </Svg>
      <Rich x={IN.x + IN.w / 2} y={320} ax="center" size={30} text="{x:input} $\cin{x}$" o={inO} />
      <Rich x={VX - 100} y={320} ax="center" size={30} text="{c:named concepts} $\cvec$" o={vecO} />
      <Rich x={TB.x + TB.w / 2} y={320} ax="center" size={30} text="{y:task} $\yh$" o={taskO} />
    </>
  );
};

/** the 'why it fits' line of a domain slide (one line, below the diagram) */
const Why: React.FC<{ text: string; o: number }> = ({ text, o }) =>
  o <= 0.001 ? null : <Rich x={160} y={774 + (1 - o) * 8} size={32} text={`{m:Why it fits:} ${text}`} o={o} />;

export const S12: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const e = (k: number) => be(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.4) => inv(x, x + d, t);
  const NB = 8;
  /** slide k: fades in (0.3 s) on the beat's first words, fades out (0.3 s) after the beat ends */
  const so = (k: number) => {
    const fin = inv(b(k) - 0.05, b(k) + 0.25, t);
    if (k === NB) return fin;
    const z = Math.min(e(k) + 0.02, b(k + 1) - 0.34);
    return fin * (1 - inv(z, z + 0.3, t));
  };
  /** a slide that spans beats k0 to k1 */
  const span = (k0: number, k1: number) => {
    const fin = inv(b(k0) - 0.05, b(k0) + 0.25, t);
    if (k1 === NB) return fin;
    const z = Math.min(e(k1) + 0.02, b(k1 + 1) - 0.34);
    return fin * (1 - inv(z, z + 0.3, t));
  };
  // slide index -> opacity: 1 claim, 2 medicine (beats 2 and 3), 3 language (beat 4), ..., 7 recap (beat 8)
  const S = [0, so(1), span(2, 3), so(4), so(5), so(6), so(7), so(8)];
  const live = (k: number) => at(b(k) + 1.2, 0.5);

  // ================= slide 1: the claim
  const GULL: Rect = { x: 300, y: 360, w: 280, h: 280 };
  const g1 = at(b(1) + 0.1, 0.5);
  const gChip = [0, 1, 2].map((i) => at(w(1, 'photographs') + 0.1 + i * 0.25));
  const gOut = at(w(1, 'birds') - 0.1, 0.5);
  const claim = at(w(1, 'Concept') - 0.1, 0.5);
  const named = at(w(1, 'named') - 0.1);
  const G1Y = GULL.y + GULL.h / 2;

  // ================= slide 2: medicine
  const in2 = at(w(2, 'knee') - 0.1, 0.5);
  const jsn2 = at(w(2, 'joint'), 0.8);
  const row2 = [w(2, 'joint'), w(2, 'bone'), w(2, 'bone') + 0.5, w(2, 'bone') + 0.9].map((x) => at(x - 0.1));
  const task2 = at(w(2, 'severe') - 0.1);
  const lev2 = at(w(2, 'four') - 0.1);
  const scale2 = at(w(2, 'scale') - 0.1);
  const src2 = at(w(2, 'Koh') - 0.1);
  const rad2 = at(w(3, 'radiologist') - 0.1);
  const corr2 = inv(w(3, 'goes'), w(3, 'goes') + 0.6, t);
  const rec2t = w(3, 'goes', 1);
  const pulse2 = Math.sin(Math.PI * inv(rec2t - 0.2, rec2t + 0.7, t));
  const new2 = at(rec2t + 0.1, 0.3);

  // ================= slide 3: language
  const in3 = at(w(4, 'restaurant') - 0.1, 0.5);
  const row3 = CEB.map((c) => at(w(4, c) - 0.1));
  const ul3 = [at(w(4, 'praised')), at(w(4, 'criticised'))];
  const unk3 = at(w(4, 'mentioned') - 0.2);
  const task3 = at(w(4, 'star') - 0.1);
  const drove3 = at(w(4, 'aspect') - 0.1);
  const src3 = at(w(4, 'CEBaB') - 0.1), tbm3 = at(w(4, 'Text') - 0.1);
  const stars3 = at(w(4, 'rating') - 0.1);

  // ================= slide 4: intensive care
  const in4 = at(w(5, 'patients') - 0.2, 0.8);
  const row4 = [0, 1, 2].map((i) => at(w(5, 'summaries') - 0.1 + i * 0.3));
  const task4 = at(w(5, 'vasopressor') - 0.1);
  const src4 = at(w(5, 'Wu') - 0.1);

  // ================= slide 5: wearables
  const in5 = at(w(6, 'sensing') - 0.2, 0.8);
  const row5 = [0, 1, 2, 3].map((i) => at(w(6, 'simpler') + i * 0.3));
  const task5 = at(w(6, 'complex') - 0.1);
  const src5 = at(w(6, 'X') - 0.1);
  const seg5 = at(w(6, 'recognise') - 0.1);
  const nurse5 = at(w(6, 'nurse') - 0.1);

  // ================= slide 6: sleep
  const in6 = at(w(7, 'sleep') - 0.2, 0.8);
  const row6 = [at(w(7, 'spindles') - 0.1), at(w(7, 'K') - 0.1), at(w(7, 'slow') - 0.1)];
  const task6 = at(w(7, 'staging') - 0.1);
  const leg6 = at(w(7, 'stage') - 0.1);
  const src6 = at(w(7, 'scorers') - 0.1);

  // ================= slide 7: recap
  const chip7 = (i: number) => at(b(8) + 0.1 + i * 0.15);
  const R1 = at(w(8, 'Name') - 0.1), R2 = at(w(8, 'predict') - 0.1), R3 = at(w(8, 'decision') - 0.1);
  const RX = [400, 960, 1520];
  const DOM: [string, string][] = [
    ['Medicine', 'knee X-ray → grade'], ['Language', 'review → stars'], ['Intensive care', 'vital signs → drug need'],
    ['Wearables', 'sensor signal → activity'], ['Sleep', 'EEG → sleep stage'],
  ];

  /** the 'why it fits' line appears with the word 'already' */
  const why = (k: number, n = 0) => at(w(k, 'already', n) - 0.15);

  const grades = Array.from({ length: LIT.oai.grades }, (_, i) => i).join(',');
  const nf = (n: number) => n.toLocaleString('en-GB');
  const SRC = { x: 160, y: 836 };

  return (
    <Stage>
      {/* ================= slide 1: the claim ================= */}
      <Slide o={S[1]}>
        <PhotoR R={GULL} src="gull.jpg" o={g1} />
        <Svg>
          <Flow pts={[[GULL.x + GULL.w + 16, G1Y], [800, G1Y]]} color={C.input} o={gChip[0]} t={t} live={gChip[0]} head={14} />
          <Flow pts={[[1120, G1Y], [1270, G1Y]]} color={C.concept} o={gOut} t={t} live={gOut} head={14} />
          <g opacity={gOut}>
            <rect x={1286} y={G1Y - 44} width={250} height={88} rx={14} fill={C.bg3} stroke={C.chalk2} strokeWidth={2} />
            <Txt x={1411} y={G1Y} size={30} weight={600} fill={C.chalk}>species</Txt>
          </g>
        </Svg>
        {[0, 1, 2].map((i) => (
          <Chip key={i} x={960} y={G1Y - 64 + i * 64} text={D.bird.concepts[[1, 2, 3][i]]} o={gChip[i]} />
        ))}
        <HText x={GULL.x} y={GULL.y - 48} size={24} color={C.mute} o={g1} mono>SO FAR: PHOTOGRAPHS OF BIRDS</HText>
        <Credit x={GULL.x} y={GULL.y + GULL.h + 8} text={CREDIT['gull.jpg']} o={g1} />
        <Rich x={GULL.x + GULL.w / 2} y={GULL.y + GULL.h + 40} ax="center" size={30} text="{x:photo} $\cin{x}$" o={g1} />
        <Rich x={960} y={GULL.y + GULL.h + 40} ax="center" size={30} text="{c:concepts} $\cvec$" o={gChip[2]} />
        <Rich x={1411} y={GULL.y + GULL.h + 40} ax="center" size={30} text="{y:species} $\yh$" o={gOut} />
        <Rich x={960} y={820} ax="center" size={38} text={`they fit wherever experts reason with ${named > 0.5 ? '{c:named findings}' : 'named findings'}`} o={claim} />
      </Slide>
      <SlideHead text={bh(P, 1)} o={S[1]} />

      {/* ================= slide 2: medicine ================= */}
      <Slide o={S[2]}>
        <PhotoR R={KNEE} src="knee.jpg" o={in2} radius={6} />
        <Svg>
          <Region R={KNEE} b={[0.5, 0.585, 0.66, 0.14]} color={C.concept} draw={jsn2} sw={3} r={8} />
          <NamedVec names={['joint space narrowing', 'bone spurs', 'sclerosis', `${LIT.oai.concepts - 3} more findings`]} vals={['1', '2', '1', '⋮']}
            rowO={(i) => row2[i]} edit={{ i: 0, to: '2', p: corr2 }} />
          <Person x={VX - 236} y={YC + 2 * VRH + 66} s={0.7 * E.back(rad2)} o={rad2} />
        </Svg>
        <DomainFrame t={t} inO={in2} vecO={row2[0]} taskO={task2} live={live(2)} pulse={pulse2} rows={4} />
        <HText x={TB.x + TB.w / 2} y={TB.y + 52} ax="center" ay="middle" size={32} weight={700} o={task2}>osteoarthritis grade</HText>
        <Tex x={TB.x + TB.w / 2} y={TB.y + 116} ax="center" size={40} o={task2} tex={`\\yh \\in \\{${grades}\\}`} />
        <Tex x={TB.x + TB.w / 2} y={TB.y + 178} ax="center" size={40} o={task2 * (1 - new2)} tex={'\\yh = 2'} />
        <Tex x={TB.x + TB.w / 2} y={TB.y + 178} ax="center" size={40} o={new2} tex={'\\yh = \\cedit{3}'} />
        <Rich x={VX - 204} y={YC + 2 * VRH + 60} ay="middle" size={28} text="{e:radiologist corrects a finding}" o={rad2} />
        <HText x={VX - 100} y={356} ax="center" size={22} color={C.mute} o={scale2}>each finding is a small grade, 0 = none</HText>
        <HText x={TB.x + TB.w / 2} y={TB.y + TB.h + 22} ax="center" size={24} color={C.chalk2} o={lev2}>0 none or doubtful · 3 severe</HText>
        <Credit x={KNEE.x} y={KNEE.y + KNEE.h + 8} text={CREDIT['knee.jpg']} o={in2} />
        <Why text="radiologists already write their reports in these terms" o={why(3)} />
        <HText x={SRC.x} y={SRC.y} size={26} color={C.chalk2} o={src2}>Koh et al., ICML 2020 · Osteoarthritis Initiative</HText>
        <EvTag x={1760} y={890} ax="right" kind="illustrative" text="values for teaching" o={row2[0]} />
      </Slide>
      <SlideHead text={bh(P, 2)} o={S[2] * (1 - at(b(3) - 0.3, 0.3))} />
      <SlideHead text={bh(P, 3)} o={S[2] * at(b(3) - 0.05, 0.3)} />

      {/* ================= slide 3: language ================= */}
      <Slide o={S[3]}>
        <Svg>
          <rect x={IN.x} y={IN.y + 40} width={IN.w} height={IN.h - 80} rx={14} fill={C.bg2} stroke={rgba(C.input, 0.6)} strokeWidth={2} opacity={in3} />
          <NamedVec names={CEB} vals={['+', '−', '?', '?']} rowO={(i) => row3[i]} hi={(i) => (i < 2 ? drove3 : 0)} />
        </Svg>
        <DomainFrame t={t} inO={in3} vecO={row3[0]} taskO={task3} live={live(4)} rows={4} />
        <Svg>
          {[0, 1, 2, 3, 4].map((i) => (
            <text key={i} x={TB.x + TB.w / 2 + (i - 2) * 52} y={TB.y + 182} fontSize={44} textAnchor="middle" dominantBaseline="central"
              fill={i < 3 ? C.chalk : C.line2} opacity={stars3}>★</text>
          ))}
        </Svg>
        <HText x={IN.x + 30} y={IN.y + 70} w={IN.w - 60} size={30} lh={1.4} color={C.chalk} o={in3}>
          <span style={{ fontStyle: 'italic' }}>
            "The <span style={{ textDecoration: 'underline', textDecorationThickness: 3, textUnderlineOffset: 6, textDecorationColor: rgba(C.concept, ul3[0]) }}>pasta was superb</span> but
            the <span style={{ textDecoration: 'underline', textDecorationThickness: 3, textUnderlineOffset: 6, textDecorationColor: rgba(C.concept, ul3[1]) }}>waiter ignored us</span> for
            twenty minutes."
          </span>
        </HText>
        <HText x={VX + VW / 2} y={YC + 2 * VRH + 30} ax="center" size={24} color={C.mute} o={unk3}>+ praised · − criticised · ? not mentioned</HText>
        <HText x={TB.x + TB.w / 2} y={TB.y + 52} ax="center" ay="middle" size={32} weight={700} o={task3}>star rating</HText>
        <Tex x={TB.x + TB.w / 2} y={TB.y + 116} ax="center" size={40} o={task3} tex={'\\yh \\in \\{1,\\dots,5\\}'} />
        <Why text="reviewers already write about the {c:food} and the {c:service}" o={why(4)} />
        <HText x={SRC.x} y={SRC.y} size={26} color={C.chalk2} o={src3}>
          CEBaB, Abraham et al., NeurIPS 2022<span style={{ opacity: tbm3 }}> · text bottleneck models, Ludan et al. 2023</span>
        </HText>
        <EvTag x={1760} y={890} ax="right" kind="illustrative" text="review and values for teaching" o={in3} />
      </Slide>
      <SlideHead text={bh(P, 4)} o={S[3]} />

      {/* ================= slide 4: intensive care ================= */}
      <Slide o={S[4]}>
        <Svg>
          <rect x={IN.x} y={IN.y} width={IN.w} height={IN.h} rx={14} fill={C.bg2} stroke={rgba(C.input, 0.4)} strokeWidth={1.5} opacity={in4} />
          <Wave x={IN.x + 24} y={IN.y + 50} w={IN.w - 48} h={100} ys={HR} fs={FS} amp={70} sw={3} axis={false} p={in4} o={in4} />
          <Wave x={IN.x + 24} y={IN.y + 198} w={IN.w - 48} h={100} ys={BP} fs={FS} amp={70} sw={3} axis={false} p={in4} o={in4} />
          <Txt x={IN.x + 24} y={IN.y + 30} size={24} anchor="start" fill={C.chalk2} o={in4}>heart rate</Txt>
          <Txt x={IN.x + 24} y={IN.y + 178} size={24} anchor="start" fill={C.chalk2} o={in4}>blood pressure</Txt>
          <NamedVec names={['illness severity', 'kidney function', 'more summaries']} vals={['0.82', '0.35', '⋮']} rowO={(i) => row4[i]} />
        </Svg>
        <DomainFrame t={t} inO={in4} vecO={row4[0]} taskO={task4} live={live(5)} rows={3} />
        <HText x={VX - 100} y={YC + 1.5 * VRH + 28} ax="center" size={24} color={C.mute} o={row4[2]}>learned from the data, not labelled</HText>
        <HText x={TB.x + TB.w / 2} y={TB.y + 52} ax="center" ay="middle" size={32} weight={700} o={task4}>drugs needed soon?</HText>
        <Tex x={TB.x + TB.w / 2} y={TB.y + 120} ax="center" size={40} o={task4} tex={'\\yh \\in [0, 1]'} />
        <HText x={TB.x + TB.w / 2} y={TB.y + 176} ax="center" ay="middle" size={24} color={C.chalk2} o={task4}>vasopressors: support blood pressure</HText>
        <Why text="doctors already sum up a patient in terms like {c:illness severity} and {c:kidney function}" o={why(5)} />
        <HText x={SRC.x} y={SRC.y} size={26} color={C.chalk2} o={src4}>{`Wu et al., MLHC 2022 · MIMIC-III, ${nf(LIT.wu_icu_patients)} patients`}</HText>
        <EvTag x={1760} y={890} ax="right" kind="illustrative" text="schematic traces, values for teaching" o={in4} />
      </Slide>
      <SlideHead text={bh(P, 5)} o={S[4]} />

      {/* ================= slide 5: wearables ================= */}
      <Slide o={S[5]}>
        <Svg>
          <rect x={IN.x} y={IN.y} width={IN.w} height={IN.h} rx={14} fill={C.bg2} stroke={rgba(C.input, 0.4)} strokeWidth={1.5} opacity={in5} />
          {(() => {
            const X = (s: number) => IN.x + 16 + (s / SEC) * (IN.w - 32);
            return SEG.map(([s0, s1], i) => (
              <g key={i} opacity={row5[i]}>
                <rect x={X(s0)} y={IN.y + 70} width={X(s1) - X(s0)} height={IN.h - 110} rx={8} fill={rgba(C.concept, 0.03 + 0.08 * seg5)} stroke={C.concept} strokeWidth={1.5 + seg5} />
                <Txt x={(X(s0) + X(s1)) / 2} y={IN.y + 44} size={26} weight={700} fill={C.concept}>{String(i + 1)}</Txt>
              </g>
            ));
          })()}
          <Wave x={IN.x + 16} y={IN.y + 110} w={IN.w - 32} h={130} ys={ACC} fs={FS} amp={95} sw={3} axis={false} p={in5} o={in5} />
          <NamedVec names={['1  check vitals', '2  collect blood', '3  oral care', 'check blood glucose']} vals={['0.9', '0.8', '0.7', '0.1']} rowO={(i) => row5[i]} />
        </Svg>
        <DomainFrame t={t} inO={in5} vecO={row5[0]} taskO={task5} live={live(6)} rows={4} />
        <HText x={TB.x + TB.w / 2} y={TB.y + 52} ax="center" ay="middle" size={32} weight={700} o={task5}>complex activity</HText>
        <Tex x={TB.x + TB.w / 2} y={TB.y + 120} ax="center" size={40} o={task5} tex={'\\yh \\in \\{1,\\dots,K\\}'} />
        <HText x={TB.x + TB.w / 2} y={TB.y + 176} ax="center" ay="middle" size={24} color={C.chalk2} o={task5}>a sequence of simple activities</HText>
        <Why text="people already describe a {y:complex activity} as its {c:simple steps}" o={why(6)} />
        <HText x={SRC.x} y={SRC.y} size={26} color={C.chalk2} o={src5}>X-CHAR, Jeyakumar et al., IMWUT 2023<span style={{ opacity: nurse5 }}> · concepts from its nurse data</span></HText>
        <EvTag x={1760} y={890} ax="right" kind="illustrative" text="schematic trace, values for teaching" o={in5} />
      </Slide>
      <SlideHead text={bh(P, 6)} o={S[5]} />

      {/* ================= slide 6: sleep ================= */}
      <Slide o={S[6]}>
        <Svg>
          <rect x={IN.x} y={IN.y} width={IN.w} height={IN.h} rx={14} fill={C.bg2} stroke={rgba(C.input, 0.4)} strokeWidth={1.5} opacity={in6} />
          <Wave x={IN.x + 16} y={IN.y + 120} w={IN.w - 32} h={110} ys={EEG.y} fs={EEG.fs} t0={1} t1={5} amp={34} sw={2.4} axis={false} p={in6} o={in6}
            marks={[[EEG.kcomplex.t0, EEG.kcomplex.t1, C.concept, 'K-complex', row6[1]], [EEG.spindle.t0, EEG.spindle.t1, C.concept, 'spindle', row6[0]]]}
            hiWindow={[EEG.spindle.t0, EEG.spindle.t1, C.concept, row6[0]]} />
          <NamedVec names={['spindle', 'K-complex', 'slow waves']} vals={SL.after.c.map((v: number) => v.toFixed(2))} rowO={(i) => row6[i]} />
        </Svg>
        <DomainFrame t={t} inO={in6} vecO={row6[0]} taskO={task6} live={live(7)} rows={3} />
        <HText x={TB.x + TB.w / 2} y={TB.y + 52} ax="center" ay="middle" size={32} weight={700} o={task6}>sleep stage</HText>
        <Tex x={TB.x + TB.w / 2} y={TB.y + 120} ax="center" size={31} o={task6} tex={'\\yh \\in \\{\\mathrm{W},\\mathrm{N1},\\mathrm{N2},\\mathrm{N3},\\mathrm{R}\\}'} />
        <HText x={TB.x + TB.w / 2} y={TB.y + 178} ax="center" ay="middle" size={26} color={C.chalk2} o={task6}>
          {`${SL.classes[1]}: `}<b style={{ color: C.chalk }}>{SL.after.share[1].toFixed(2)}</b>
        </HText>
        <HText x={TB.x + TB.w / 2} y={TB.y + TB.h + 22} ax="center" size={22} color={C.chalk2} o={leg6}>W wake · N1, N2, N3: stages one to three · R: REM</HText>
        <Why text="scorers already mark these {c:patterns} by hand" o={why(7, 1)} />
        <HText x={SRC.x} y={SRC.y} size={26} color={C.chalk2} o={src6}>patterns from the AASM scoring manual (Berry et al.)</HText>
        <EvTag x={1760} y={890} ax="right" kind="illustrative" text="schematic EEG, the sleep head from Part 6" o={in6} />
      </Slide>
      <SlideHead text={bh(P, 7)} o={S[6]} />

      {/* ================= slide 7: recap ================= */}
      <Slide o={S[7]}>
        <Svg>
          {DOM.map((_, i) => {
            const x = 160 + i * 325, o = chip7(i);
            return <rect key={i} x={x} y={330} width={300} height={120} rx={14} fill={C.bg2} stroke={rgba(C.concept, 0.55)} strokeWidth={2} opacity={o} />;
          })}
        </Svg>
        {DOM.map(([d, s], i) => (
          <React.Fragment key={d}>
            <HText x={310 + i * 325} y={372} ax="center" ay="middle" size={30} weight={700} o={chip7(i)}>{d}</HText>
            <HText x={310 + i * 325} y={414} ax="center" ay="middle" size={22} color={C.chalk2} o={chip7(i)}>{s}</HText>
          </React.Fragment>
        ))}
        <HText x={960} y={540} ax="center" size={24} mono weight={700} color={C.mute} o={R1}>THE RECIPE</HText>
        <Rich x={RX[0]} y={640} ax="center" ay="middle" w={520} size={30} text="name the {c:findings} an expert checks" o={R1} />
        <Rich x={RX[1]} y={640} ax="center" ay="middle" w={520} size={30} text="predict them from the {x:raw signal}" o={R2} />
        <Rich x={RX[2]} y={640} ax="center" ay="middle" w={520} size={30} text="let the {y:decision} use them alone" o={R3} />
        <Tex x={RX[0]} y={760} ax="center" size={48} o={R1} tex={'\\ccon{c_1, \\dots, c_k}'} />
        <Tex x={RX[1]} y={760} ax="center" size={48} o={R2} tex={'\\cvec = \\gth(\\cin{x})'} />
        <Tex x={RX[2]} y={760} ax="center" size={48} o={R3} tex={'\\yh = \\fph(\\cvec)'} />
      </Slide>
      <SlideHead text={bh(P, 8)} o={S[7]} />

      <Header t={t} part={12} title={P.title} />
      <ArchMap on={['c']} o={inv(0, 0.5, t)} />
    </Stage>
  );
};

