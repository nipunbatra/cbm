// s02 Part 2 · Introducing the concept bottleneck (revision 2: the gull worked example of the s21 idea, one idea per
// slide, 13 slides). The canonical gull pipeline (src/kit/pipe.tsx) returns on slides 1-2, 4, 7-9 and 13.
// 2.1 the photo, a direct path to an answer, then a layer of named slots slides in      2.2 g_theta, c hat, f_phi, y hat
// 2.3 the concept vector c hat as a named column (D.bird.before.c)                       2.4 the rule: a direct path crossed out
// 2.5 black box vs strict CBM, two mini pipelines        2.6 the hand-written head: one weight per concept (D.bird.weights)
// 2.7 the belief and the shares (D.bird.before.share)    2.8 wingtip inset, observer, amber group edit
// 2.9 the same head recomputes (D.bird.after.share)      2.10 before / after vectors and predictions
// 2.11 multi-task: a concept head beside the class head  2.12 an edit there changes nothing
// 2.13 back to the CBM: the concepts lie on the path, flows run through them.
import React from 'react';
import { C } from '../kit/theme';
import { E, Header, Rich, SlideHead, Stage, Svg, Txt, ROLE, bs, bw, bh, clamp, inv, type SceneProps } from '../kit/core';
import { ArchMap, Block, CREDIT, ConceptRow, Credit, Cross, EvTag, Flow, MathSvg, Person, PhotoR, VecCol, rgba, ux, vy, type Rect } from '../kit/cbm';
import { GullPipePhoto, GullPipeSvg, PIPE, rowY, type PipeState } from '../kit/pipe';
import { TexSteps } from '../kit/slots';
import { D } from '../kit/data';

const B = D.bird;
const LABELS: string[] = B.labels;
const V0: number[] = B.before.c, V1: number[] = B.after.c;
const WTS: number[] = B.weights;
const CLS: string[] = B.classes; // [glaucous-winged, American herring]
const SH0: number[] = B.before.share, SH1: number[] = B.after.share;
const WT: number[] = D.gull.regions.wingtip;
const COL = PIPE.col;
const FL = PIPE.f.x - PIPE.f.w / 2; // left edge of the task head
const FC = ROLE.f; // task head colour (light grey)
const ILL = 'hand-written concept values and head, for teaching';
const sgn = (v: number) => (v < 0 ? '−' : '+') + Math.abs(v).toFixed(1);

/** a short pulse 0 -> 1 -> 0 starting at a */
const pulse = (t: number, a: number, d = 1.0) => (t < a || t > a + d ? 0 : Math.sin(((t - a) / d) * Math.PI));

/** one slide: a full-frame layer with its own opacity */
const Slide: React.FC<{ o: number; children?: React.ReactNode }> = ({ o, children }) =>
  o <= 0.001 ? null : <div style={{ position: 'absolute', inset: 0, opacity: o < 0.999 ? o : undefined }}>{children}</div>;

/** a plain arrow with a filled head (x1,y1) -> (x2,y2), drawn on with p */
const Arr: React.FC<{ x1: number; y1: number; x2: number; y2: number; color?: string; sw?: number; p?: number; o?: number; head?: number }> = ({
  x1, y1, x2, y2, color = C.chalk2, sw = 3.5, p = 1, o = 1, head = 16,
}) => {
  if (o <= 0.001 || p <= 0.001) return null;
  const xe = x1 + (x2 - x1) * p, ye = y1 + (y2 - y1) * p;
  const a = Math.atan2(ye - y1, xe - x1);
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <line x1={x1} y1={y1} x2={xe - Math.cos(a) * head * 0.6} y2={ye - Math.sin(a) * head * 0.6} stroke={color} strokeWidth={sw} strokeLinecap="round" />
      <path d={`M ${xe} ${ye} L ${xe - head * Math.cos(a - 0.42)} ${ye - head * Math.sin(a - 0.42)} L ${xe - head * Math.cos(a + 0.42)} ${ye - head * Math.sin(a + 0.42)} Z`} fill={color} />
    </g>
  );
};

// slide 3 / 6 / 10 geometry: a named column of concept values
const VY0 = 380, VRH = 74; // top of the vectors, row height
const vrow = (i: number) => VY0 + (i + 0.5) * VRH;

export const S02: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.5) => inv(x, x + d, t);
  const NB = P.beats.length;
  const sl = (k: number) => inv(b(k) - 0.05, b(k) + 0.25, t) * (k < NB ? 1 - inv(b(k + 1) - 0.35, b(k + 1) - 0.05, t) : 1);
  const span = (k1: number, k2: number) => inv(b(k1) - 0.05, b(k1) + 0.25, t) * (k2 < NB ? 1 - inv(b(k2 + 1) - 0.35, b(k2 + 1) - 0.05, t) : 1);

  // ---------------------------------------------------------------- the pipeline's visibility: slides 1-2, 4, 7-9, 13
  const pipeO = span(1, 2) + sl(4) + span(7, 9) + sl(13);

  // 2.1
  const direct = E.io(inv(b(1) + 0.3, b(1) + 1.2, t)) * (1 - at(w(1, 'insert') - 0.2, 0.4));
  const colIn = E.out(at(w(1, 'insert'), 0.9));
  const named1 = at(w(1, 'named') - 0.1);
  const links1 = E.io(at(w(1, 'variables') - 0.2, 0.6));
  const slots12 = span(1, 2);

  // 2.2
  const gO = at(w(2, 'concept') - 0.2, 0.6);
  const flowIn = E.io(at(w(2, 'concept'), 0.6));
  const flowC = E.io(at(w(2, 'vector'), 0.8));
  const headO = at(w(2, 'task') - 0.2, 0.6);
  const fanR = at(w(2, 'task'), 0.7);
  const yhO = E.io(at(w(2, 'prediction') - 0.2, 0.5));
  const live = at(w(2, 'vector') + 0.6, 0.6);

  // output region: a dashed placeholder until the shares are spoken (2.7)
  const outV = at(w(7, 'ranks') - 0.2, 0.5);
  const phO = 1 - at(w(7, 'ranks') - 0.6, 0.3);
  const ansTxt = 1 - at(w(2, 'prediction') - 0.5, 0.3), yhTxt = at(w(2, 'prediction') - 0.15, 0.3);
  const rowsShown = t > b(3) ? 1 : 0; // the pipeline is hidden during slide 3, so the rows switch on unseen

  // 2.4
  const colGlow = at(w(4, 'only') - 0.2) * (1 - at(b(5) - 0.35, 0.3));
  const rule4 = at(w(4, 'only') - 0.1);
  const byp = E.io(at(w(4, 'No') - 0.1, 0.8));
  const bypX = at(w(4, 'reaches') - 0.1, 0.5);
  const neck4Out = at(w(4, 'bottleneck') - 0.35, 0.25), neck4 = at(w(4, 'bottleneck') - 0.05, 0.3);

  // 2.7 / 2.8 / 2.9
  const hiFade = 1 - at(b(9), 0.6);
  const hi0 = at(w(7, 'grey') - 0.2) * hiFade, hi1 = at(w(7, 'black') - 0.2) * hiFade;
  const reg = at(w(8, 'wingtips') - 0.1, 0.7);
  const inset = at(w(8, 'wingtips') + 0.1, 0.6) * sl(8);
  const person = at(w(8, 'observer') - 0.2, 0.5) * sl(8);
  const bracket = at(w(8, 'colour') - 0.1, 0.4);
  const groupLbl = bracket * sl(8);
  const edit = inv(w(8, 'Grey'), w(8, 'black', 1) + 0.6, t);
  const unch = at(w(9, 'unchanged') - 0.1);
  const rec = w(9, 'recomputes');
  const headHi = pulse(t, rec - 0.1, 1.1);
  const outK = inv(rec + 0.4, w(9, 'receives') + 0.2, t);

  // 2.13
  const pathLbl = at(w(13, 'concepts') - 0.1, 0.6);
  const wave13 = (i: number) => (t > b(13) ? 0.5 + 0.5 * Math.sin((t - b(13)) * 3 - i * 0.7) : 0) * at(b(13), 0.6);
  const rowHi = (i: number) => Math.max(i === 0 ? hi0 : 0, i === 1 ? hi1 : 0, wave13(i) * 0.7);

  const s: PipeState = {
    t, o: pipeO, photoO: 1, gO, colO: colGlow, rowsO: 1, rowP: () => 1, headO, outO: outV, flowIn, flowC, flowOut: outV, live,
    edit, outK, headHi: clamp(headHi), rowHi, bracket, wingRegion: reg,
  };
  const ph = PIPE.photo;
  const INS: Rect = { x: 96, y: 690, w: 330, h: 170 };
  const fr: [number, number, number, number] = [0.62, 0.475, 0.95, 0.645];

  // ---------------------------------------------------------------- 2.3 the named vector
  const ph3: Rect = { x: 200, y: VY0 + 2.5 * VRH - 150, w: 300, h: 300 };
  const s3a = at(w(3, 'concepts') - 0.3, 0.6);
  const labWords = ['grey', 'black', 'pointed', 'white', 'rounded'];
  const lab3 = (i: number) => at(w(3, labWords[i]) - 0.15, 0.4);
  const val3 = (i: number) => at(w(3, 'Each') + i * 0.18, 0.4);
  const rng3 = at(w(3, 'between') - 0.1);

  // ---------------------------------------------------------------- 2.5 black box vs strict CBM
  const r5a = at(w(5, 'black') - 0.1), r5b = at(w(5, 'strict') - 0.1);
  const r5c = pulse(t, w(5, 'first'), 1.4), r5f = pulse(t, w(5, 'task', 0), 1.2);
  const r5alone = at(w(5, 'alone') - 0.2);

  // ---------------------------------------------------------------- 2.6 the hand-written head
  const s6w = (i: number) => at(w(6, 'head') + i * 0.15, 0.4);
  const s6sum = at(w(6, 'written') - 0.1);
  const s6tag = at(w(6, 'hand') - 0.1);

  // ---------------------------------------------------------------- 2.10 before / after
  const s10a = at(b(10) + 0.05, 0.4), s10e = at(w(10, 'edited') - 0.1, 0.5), s10y = at(w(10, 'prediction') - 0.2, 0.5);

  // ---------------------------------------------------------------- 2.11 / 2.12 multi-task
  const mt = span(11, 12);
  const MP: Rect = { x: 160, y: 490, w: 220, h: 220 };
  const ENCX = 570, CY = 600, HX = 900, UY = 430, LY = 790, RX = 1110;
  const ry = (i: number) => UY - 2 * 46 + i * 46;
  const cy2 = [760, 820];
  const mtC = at(w(11, 'concept') - 0.2, 0.5), mtK = at(w(11, 'class') - 0.2, 0.5);
  const mtEdit = inv(w(12, 'Editing'), w(12, 'Editing') + 1.0, t);
  const mtNo = at(w(12, 'nothing') - 0.1, 0.4);
  const mtNever = at(w(12, 'never') - 0.1, 0.5);

  return (
    <Stage>
      <Header t={t} part={2} title={P.title} />
      <ArchMap on={['c']} o={inv(0, 0.5, t)} />

      {/* ================================================================ the pipeline layer (photo) */}
      <GullPipePhoto s={s} />
      <Credit x={ph.x} y={ph.y + ph.h + 8} text={CREDIT['gull.jpg']} o={pipeO * (1 - inset) * (1 - sl(4))} />
      {/* 2.8 inset of the black wingtips */}
      <PhotoR R={INS} src="gull.jpg" frac={fr} o={inset} border={C.concept} />

      <Svg o={pipeO}>
        {/* 2.1 the direct path to an answer, before the layer is inserted */}
        <Flow pts={[[ph.x + ph.w + 10, PIPE.g.y], [PIPE.outX - 14, PIPE.g.y]]} color={C.chalk2} p={direct} head={16} o={direct > 0 ? 1 : 0} />
        {/* the answer placeholder */}
        {phO > 0.001 ? (
          <g opacity={phO < 0.999 ? phO : undefined}>
            <rect x={PIPE.outX} y={425} width={280} height={80} rx={14} fill={C.bg2} stroke={C.chalk2} strokeWidth={2.5} strokeDasharray="8 7" />
            <Txt x={PIPE.outX + 140} y={465} size={30} weight={600} fill={C.chalk2} o={ansTxt}>answer</Txt>
            <MathSvg x={PIPE.outX + 140} y={465} tex="\hat y" size={44} o={yhTxt} />
            <Flow pts={[[PIPE.f.x + PIPE.f.w / 2 + 6, PIPE.f.y], [PIPE.outX - 12, PIPE.f.y]]} color={C.chalk2} p={yhO} t={t} live={live} head={14} />
          </g>
        ) : null}
        {/* slides 1-2: the inserted layer as an outline with five empty slots */}
        {colIn * slots12 > 0.001 ? (
          <g opacity={colIn * slots12} transform={`translate(0 ${30 * (1 - colIn)})`}>
            <rect x={COL.x} y={COL.y} width={COL.w} height={COL.h} rx={18} fill={rgba(C.concept, 0.05)} stroke={C.concept} strokeWidth={2.5} strokeDasharray="10 8" />
            {LABELS.map((_, i) => (
              <rect key={i} x={PIPE.rowX} y={rowY(i) - 17} width={PIPE.labelW + PIPE.barW + 70} height={34} rx={8} fill="none" stroke={C.concept}
                strokeWidth={2} strokeDasharray="4 6" opacity={0.5} />
            ))}
          </g>
        ) : null}
        {/* slide 1: thin links photo -> layer -> answer */}
        {links1 * (1 - gO) > 0.001 ? (
          <g opacity={links1 * (1 - gO)}>
            <Flow pts={[[ph.x + ph.w + 10, PIPE.g.y], [COL.x - 12, PIPE.g.y]]} color={C.chalk2} p={links1} head={14} sw={2.5} />
            <Flow pts={[[COL.x + COL.w + 10, PIPE.g.y], [PIPE.outX - 14, PIPE.g.y]]} color={C.chalk2} p={links1} head={14} sw={2.5} />
          </g>
        ) : null}

        {/* the canonical pipeline, masked so each part shows only once spoken */}
        <defs>
          <mask id="s02-mask" maskUnits="userSpaceOnUse" x={0} y={0} width={1920} height={1080}>
            <rect x={0} y={0} width={1920} height={1080} fill="#fff" />
            <rect x={PIPE.rowX - 16} y={COL.y + 4} width={1218 - PIPE.rowX + 16} height={COL.h - 8} fill="#000" opacity={1 - rowsShown} />
            <rect x={1214} y={290} width={FL - 2 - 1214} height={350} fill="#000" opacity={1 - fanR} />
          </mask>
        </defs>
        <g mask="url(#s02-mask)">
          <GullPipeSvg s={{ ...s, o: 1 }} />
        </g>

        {/* 2.4 a direct path from the image to the head: not allowed */}
        {byp * sl(4) > 0.001 ? (
          <g opacity={sl(4)}>
            <Flow pts={[[PIPE.g.x, PIPE.g.y + PIPE.g.h / 2 + 8], [PIPE.g.x, 760], [PIPE.f.x, 760], [PIPE.f.x, PIPE.f.y + PIPE.f.h / 2 + 10]]}
              color={C.leak} p={byp} dash="3 10" sw={4} head={14} />
            <Cross x={952} y={736} w={48} h={48} p={bypX} sw={6} />
          </g>
        ) : null}

        {/* 2.8 inset connectors and the observer */}
        {inset > 0.001 ? (
          <g opacity={inset} stroke={C.concept} strokeWidth={2}>
            <line x1={ux(ph, WT[0] - WT[2] / 2)} y1={vy(ph, WT[1] + WT[3] / 2)} x2={INS.x + 4} y2={INS.y} opacity={0.7} />
            <line x1={ux(ph, WT[0] + WT[2] / 2)} y1={vy(ph, WT[1] + WT[3] / 2)} x2={INS.x + INS.w - 4} y2={INS.y} opacity={0.7} />
          </g>
        ) : null}
        <Person x={744} y={716} s={0.85} o={person} />
      </Svg>

      {/* ================================================================ pipeline slides: headings and labels */}
      <Slide o={sl(1)}>
        <SlideHead text={bh(P, 1)} />
        <Rich x={COL.x + COL.w / 2} y={662} ax="center" size={32} text="a layer of {c:named variables}" o={named1} />
      </Slide>
      <Slide o={sl(2)}>
        <SlideHead text={bh(P, 2)} />
        <TexSteps x={960} y={790} t={t} ax="center" size={60} parts={[
          ['\\cin{x}', w(2, 'concept') - 0.1],
          ['\\;\\xrightarrow{\\;\\gth\\;}\\;', w(2, 'theta') - 0.1],
          ['\\cvec', w(2, 'hat') - 0.1],
          ['\\;\\xrightarrow{\\;\\fph\\;}\\;', w(2, 'phi') - 0.1],
          ['\\hat y', w(2, 'hat', 1) - 0.1],
        ]} />
      </Slide>
      <Slide o={sl(4)}>
        <SlideHead text={bh(P, 4)} />
        <Rich x={COL.x + COL.w / 2} y={662} ax="center" size={30} text="the only input to the {f:task head}" o={rule4 * (1 - neck4Out)} />
        <Rich x={COL.x + COL.w / 2} y={662} ax="center" size={30} text="{c:the bottleneck}: the only input to the {f:task head}" o={neck4} />
        <Rich x={995} y={812} ax="center" size={30} text="{k:no other path} from the {x:image}" o={bypX} />
        <EvTag x={1760} y={890} ax="right" kind="illustrative" text={ILL} o={rule4} />
      </Slide>
      <Slide o={sl(7)}>
        <SlideHead text={bh(P, 7)} />
        <Rich x={960} y={760} ax="center" size={32} text="{c:grey} high, {c:black} low: the {f:head} favours {y:glaucous-winged gull}" o={outV} />
        <EvTag x={1760} y={890} ax="right" kind="illustrative" text={ILL} o={sl(7)} />
      </Slide>
      <Slide o={sl(8)}>
        <SlideHead text={bh(P, 8)} />
        <Rich x={INS.x} y={INS.y + INS.h + 12} size={28} text="the wingtips are black" o={inset} />
        <Rich x={790} y={716} ay="middle" size={30} text="{e:wing colour}: corrected as one group" o={groupLbl} />
        <EvTag x={1760} y={890} ax="right" kind="illustrative" text={ILL} o={sl(8)} />
      </Slide>
      <Slide o={sl(9)}>
        <SlideHead text={bh(P, 9)} />
        <Rich x={ph.x + ph.w / 2} y={662} ax="center" size={28} color={C.mute} text="unchanged" o={unch} />
        <Rich x={PIPE.f.x} y={550} ax="center" size={28} color={C.mute} text="unchanged" o={unch} />
        <Rich x={960} y={760} ax="center" size={32} text="same {x:image}, same {f:head}, {e:edited concepts}: a new {y:answer}" o={at(w(9, 'receives') - 0.1)} />
        <EvTag x={1760} y={890} ax="right" kind="illustrative" text={ILL} o={sl(9)} />
      </Slide>
      <Slide o={sl(13)}>
        <SlideHead text={bh(P, 13)} />
        <Rich x={COL.x + COL.w / 2} y={662} ax="center" size={32} text="every {y:prediction} passes through the {c:concepts}" o={pathLbl} />
        <EvTag x={1760} y={890} ax="right" kind="illustrative" text={ILL} o={sl(13)} />
      </Slide>

      {/* ================================================================ 2.3 the concept vector */}
      <Slide o={sl(3)}>
        <SlideHead text={bh(P, 3)} />
        <PhotoR R={ph3} src="gull.jpg" o={s3a} border={C.input} />
        <Credit x={ph3.x} y={ph3.y + ph3.h + 8} text={CREDIT['gull.jpg']} o={s3a} />
        <Svg>
          <Arr x1={ph3.x + ph3.w + 16} y1={vrow(2)} x2={720} y2={vrow(2)} color={C.input} p={E.io(s3a)} />
          <MathSvg x={(ph3.x + ph3.w + 720) / 2} y={vrow(2) - 40} tex="\gth" size={44} o={s3a} />
          <VecCol x={900} y={VY0} vals={V0} rowH={VRH} w={150} size={36} digits={2} o={s3a} cellO={val3} />
          {LABELS.map((l, i) => (
            <Txt key={l} x={1090} y={vrow(i)} size={34} anchor="start" weight={600} fill={C.concept} o={lab3(i)}>{l}</Txt>
          ))}
        </Svg>
        <Rich x={838} y={vrow(2)} ax="center" ay="middle" size={60} text="$\cvec =$" o={s3a} />
        <Rich x={975} y={VY0 + 5 * VRH + 40} ax="center" size={32} color={C.chalk2} text="each entry: a value between {c:0} and {c:1}" o={rng3} />
        <EvTag x={1760} y={890} ax="right" kind="illustrative" text="hand-written concept values, for teaching" o={s3a} />
      </Slide>

      {/* ================================================================ 2.5 black box vs strict CBM */}
      <Slide o={sl(5)}>
        <SlideHead text={bh(P, 5)} />
        <PhotoR R={{ x: 600, y: 360, w: 140, h: 140 }} src="gull.jpg" o={r5a} border={C.input} />
        <PhotoR R={{ x: 600, y: 600, w: 140, h: 140 }} src="gull.jpg" o={r5b} border={C.input} />
        <Svg>
          {/* black box row */}
          <g opacity={r5a < 0.999 ? r5a : undefined}>
            <Arr x1={756} y1={430} x2={866} y2={430} color={C.input} />
            <rect x={880} y={370} width={170} height={120} rx={14} fill="#05070A" stroke={C.input} strokeWidth={3} />
            <Arr x1={1066} y1={430} x2={1176} y2={430} color={C.chalk2} />
            <Txt x={1196} y={430} size={34} weight={700} anchor="start">answer</Txt>
          </g>
          {/* strict CBM row */}
          <g opacity={r5b < 0.999 ? r5b : undefined}>
            <Arr x1={756} y1={670} x2={826} y2={670} color={C.input} />
            <Block x={890} y={670} w={110} h={100} kind="input" />
            <MathSvg x={890} y={670} tex="\gth" size={40} />
            <Arr x1={952} y1={670} x2={1000} y2={670} color={C.concept} />
            {[0, 1, 2, 3, 4].map((i) => (
              <rect key={i} x={1012} y={622 + i * 20} width={90} height={14} rx={3} fill={C.concept} opacity={0.6 + 0.4 * r5c} />
            ))}
            {r5c > 0.001 ? <rect x={1000} y={610} width={114} height={120} rx={10} fill="none" stroke={C.concept} strokeWidth={3} opacity={r5c} /> : null}
            <Arr x1={1116} y1={670} x2={1166} y2={670} color={C.concept} />
            <Block x={1226} y={670} w={110} h={100} kind="head" hi={r5f} />
            <MathSvg x={1226} y={670} tex="\fph" size={40} />
            <Arr x1={1288} y1={670} x2={1356} y2={670} color={C.chalk2} />
            <Txt x={1376} y={670} size={34} weight={700} anchor="start">answer</Txt>
          </g>
        </Svg>
        <Rich x={560} y={430} ax="right" ay="middle" size={34} weight={650} text="black box" o={r5a} />
        <Rich x={560} y={670} ax="right" ay="middle" size={34} weight={650} text="strict CBM" o={r5b} />
        <Rich x={1057} y={760} ax="center" size={30} color={C.chalk2} text="the {y:answer} from the {c:concepts} alone" o={r5alone} />
      </Slide>

      {/* ================================================================ 2.6 the hand-written head */}
      <Slide o={sl(6)}>
        <SlideHead text={bh(P, 6)} />
        <Svg>
          <rect x={560} y={VY0 - 70} width={800} height={5 * VRH + 100} rx={18} fill={C.headFill} stroke="#8792A2" strokeWidth={3} opacity={s6w(0)} />
          {LABELS.map((l, i) => (
            <g key={l} opacity={s6w(i)}>
              <Txt x={610} y={vrow(i)} size={34} anchor="start" weight={600} fill={C.concept}>{l}</Txt>
              <Txt x={1120} y={vrow(i)} size={36} anchor="end" mono weight={700} fill={FC}>{sgn(WTS[i])}</Txt>
              <rect x={1150} y={vrow(i) - 13} width={150} height={26} rx={4} fill={C.bg3} />
              <rect x={WTS[i] < 0 ? 1225 - 37 * Math.abs(WTS[i]) : 1225} y={vrow(i) - 13} width={37 * Math.abs(WTS[i])} height={26} rx={4} fill={FC} opacity={0.85} />
              <line x1={1225} x2={1225} y1={vrow(i) - 20} y2={vrow(i) + 20} stroke={C.mute} strokeWidth={2} />
            </g>
          ))}
          <Txt x={1080} y={VY0 - 30} size={26} weight={600} fill={FC} o={s6w(0)}>weight toward American herring gull</Txt>
        </Svg>
        <Rich x={960} y={VY0 + 5 * VRH + 60} ax="center" size={32} text="the {f:head} adds up {f:weight} × {c:value}, then turns the total into two {y:shares}" o={s6sum} />
        <EvTag x={1760} y={890} ax="right" kind="illustrative" text={ILL} o={s6tag} />
      </Slide>

      {/* ================================================================ 2.10 before / after */}
      <Slide o={sl(10)}>
        <SlideHead text={bh(P, 10)} />
        <Svg>
          {LABELS.map((l, i) => (
            <Txt key={l} x={560} y={vrow(i)} size={30} anchor="end" weight={600} fill={C.concept} o={s10a}>{l}</Txt>
          ))}
          <VecCol x={600} y={VY0} vals={V0} rowH={VRH} w={140} size={32} digits={2} o={s10a} />
          <VecCol x={1100} y={VY0} vals={V1} rowH={VRH} w={140} size={32} digits={2} o={s10e} color={C.concept}
            cellColor={(i) => (i < 2 ? C.edit : undefined)} ring={(i) => (i < 2 ? 1 : 0)} />
          <Arr x1={770} y1={vrow(0.5)} x2={1080} y2={vrow(0.5)} color={C.edit} p={E.io(s10e)} />
          <Person x={925} y={vrow(0.5) - 60} s={0.7} o={s10e} />
          {/* the head below each vector */}
          <Arr x1={670} y1={VY0 + 5 * VRH + 14} x2={670} y2={VY0 + 5 * VRH + 82} color={FC} o={s10a} />
          <MathSvg x={706} y={VY0 + 5 * VRH + 48} tex="\fph" size={34} anchor="start" o={s10a} />
          <Arr x1={1170} y1={VY0 + 5 * VRH + 14} x2={1170} y2={VY0 + 5 * VRH + 82} color={FC} o={s10y} />
          <MathSvg x={1206} y={VY0 + 5 * VRH + 48} tex="\fph" size={34} anchor="start" o={s10y} />
        </Svg>
        <Rich x={670} y={VY0 - 30} ax="center" ay="bottom" size={30} color={C.chalk2} text="model's belief $\cvec$" o={s10a} />
        <Rich x={1170} y={VY0 - 30} ax="center" ay="bottom" size={30} text="{e:after the edit}" o={s10e} />
        <Rich x={670} y={VY0 + 5 * VRH + 100} ax="center" size={30} text={`{y:${CLS[0]}} ${SH0[0].toFixed(2)}`} o={s10a} />
        <Rich x={1170} y={VY0 + 5 * VRH + 100} ax="center" size={30} text={`{y:${CLS[1]}} ${SH1[1].toFixed(2)}`} o={s10y} />
        <EvTag x={1760} y={924} ax="right" kind="illustrative" text={ILL} o={s10a} />
      </Slide>

      {/* ================================================================ 2.11 / 2.12 multi-task */}
      <Slide o={sl(11)}>
        <SlideHead text={bh(P, 11)} />
      </Slide>
      <Slide o={sl(12)}>
        <SlideHead text={bh(P, 12)} />
      </Slide>
      <Slide o={mt}>
        <PhotoR R={MP} src="gull.jpg" border={C.input} />
        <Credit x={MP.x} y={MP.y + MP.h + 8} text={CREDIT['gull.jpg']} />
        <Svg>
          <Flow pts={[[MP.x + MP.w + 8, CY], [ENCX - 88, CY]]} color={C.input} t={t} live={1} head={14} />
          <Block x={ENCX} y={CY} w={160} h={110} kind="input" title="shared" sub="encoder" size={28} />
          <Flow pts={[[ENCX + 86, CY], [ENCX + 130, CY], [HX - 140, UY], [HX - 98, UY]]} color={C.input} p={E.io(mtC)} t={t} live={mtC} head={14} />
          <Flow pts={[[ENCX + 86, CY], [ENCX + 130, CY], [HX - 140, LY], [HX - 98, LY]]} color={C.input} p={E.io(mtK)} t={t + 0.3} live={mtK} head={14} />
          <Block x={HX} y={UY} w={180} h={100} kind="concept" title="concept" sub="head" o={mtC} size={28} />
          <Block x={HX} y={LY} w={180} h={100} kind="head" title="class" sub="head" o={mtK} size={28} />
          {LABELS.map((l, i) => (
            <g key={l}>
              <Flow pts={[[HX + 96, UY], [RX - 16, ry(i)]]} color={C.concept} p={E.io(mtC)} t={t + i * 0.3} live={mtC} head={0} sw={2} n={1} dotR={4} />
              <ConceptRow x={RX} y={ry(i)} label={l} v={V0[i]} w={150} labelW={210} size={25} barH={20} o={mtC}
                edit={i < 2 ? { to: V1[i], p: mtEdit } : undefined} hi={i < 2 ? mtEdit * (1 - 0.5 * mtNever) : 0} />
            </g>
          ))}
          <Person x={1610} y={ry(0) + 23} s={0.75} o={at(w(12, 'Editing') - 0.3, 0.5)} />
          {[0, 1].map((i) => (
            <g key={i} opacity={mtK}>
              <Flow pts={[[HX + 96, LY], [RX - 16, cy2[i]]]} color={C.chalk2} t={t + i * 0.4} live={mtK} head={10} sw={2} n={1} dotR={4} />
              <Txt x={RX} y={cy2[i]} size={26} anchor="start" weight={i === 0 ? 700 : 500} fill={i === 0 ? C.chalk : C.chalk2}>{CLS[i]}</Txt>
              <rect x={RX + 300} y={cy2[i] - 12} width={220} height={24} rx={4} fill={C.bg3} />
              <rect x={RX + 300} y={cy2[i] - 12} width={220 * SH0[i]} height={24} rx={4} fill={C.chalk} opacity={i === 0 ? 0.95 : 0.4} />
            </g>
          ))}
          {mtNo > 0.001 ? (
            <g opacity={mtNo}>
              <rect x={RX - 16} y={cy2[0] - 32} width={556} height={cy2[1] - cy2[0] + 64} rx={12} fill="none" stroke={C.chalk2} strokeWidth={2} strokeDasharray="6 6" />
              <Txt x={RX + 540} y={cy2[1] + 58} size={26} anchor="end" weight={600} fill={C.chalk2}>no change</Txt>
            </g>
          ) : null}
          {mtNever > 0.001 ? (
            <g opacity={mtNever}>
              <line x1={RX + 60} y1={ry(4) + 26} x2={HX + 40} y2={LY - 58} stroke={C.mute} strokeWidth={3} strokeDasharray="6 8" />
              <Cross x={(RX + 60 + HX + 40) / 2 - 20} y={(ry(4) + 26 + LY - 58) / 2 - 20} w={40} h={40} p={inv(w(12, 'never') + 0.2, w(12, 'never') + 0.7, t)} sw={5} />
            </g>
          ) : null}
        </Svg>
        <Rich x={160} y={330} size={32} weight={650} text="multi-task learning" o={mtC} />
        <Rich x={160} y={880} size={30} text="the {f:class head} never reads the {c:concept head}" o={mtNever} />
      </Slide>
    </Stage>
  );
};
