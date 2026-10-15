// s15 Part 10 · Concept embedding models (Espinosa Zarlenga et al. 2022). Review revision, 17 beats.
// Illustrative numbers from D.worked.cem (hand-chosen 2-D embeddings, three concepts, the worked zebra photo).
// 15.1 the narrow channel: photo -> encoder -> one number per concept; Part 8 callback (same values, D.incomplete).
// 15.2 define the embeddings as image-specific numeric vectors, not stored example pictures.
// 15.3 image -> feature encoder -> two learned layers -> the present and absent vectors.
// 15.4 to 15.7 one stage, the stripes plane: c+ (active) and c- (inactive) with their vectors; the probability p;
//      the mixing rule in words, then symbols (the point sweeps the segment); p = 0.1 -> (0.28, 0.70), computed.
// 15.8 to 15.9 one stage: three mixed points -> 6 numbers -> head -> shares (D.worked.cem.probs); amber edit p -> 1:
//      the point slides to c+, the vector updates, the head pulses, shares move to probs_edit.
// 15.10 joint training: concept and task losses update the network; no vector-coordinate targets.
// 15.11 to 15.15: Part 8's collision, image-specific mixed vectors, training signal, a worked head, and the tradeoff.
// 15.16 training versus test recap. 15.17 the VariantCard and symbol legend.
import React from 'react';
import { C, F } from '../kit/theme';
import { E, HText, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, bs, be, bw, bh, clamp, inv, type SceneProps } from '../kit/core';
import { ArchMap, Block, ConceptRow, Credit, EvTag, Flow, MathSvg, Person, PhotoR, ShareBars, VecCol, rgba, VariantCard, type VariantRows } from '../kit/cbm';
import { lerp } from '../kit/anim';
import { TexSteps } from '../kit/slots';
import { D } from '../kit/data';

const CEM = D.worked.cem;
const NAMES: string[] = CEM.concepts;
const CP: [number, number][] = NAMES.map((n) => CEM.c_plus[n]);
const CM: [number, number][] = NAMES.map((n) => CEM.c_minus[n]);
const PV: number[] = NAMES.map((n) => CEM.p[n]);
const EMB: number[] = CEM.embedding;
const EMB_E: number[] = CEM.embedding_edit;
const PR: number[] = CEM.probs;
const PRE: number[] = CEM.probs_edit;
const CLS: string[] = D.worked.classes;
const EX: string = D.worked.example;
const EXC = D.worked.photo_credit[EX];
const INC = D.incomplete;
const COLLECTIVE = '36 Wikimedia Commons photographs (CC BY-SA / CC BY / public domain)';
const SHAPE_BLUE = '#3B6FD8'; // the physical object colour of Part 8's shapes (not a role colour)

const f2 = (v: number) => v.toFixed(2);
const f1 = (v: number) => String(Number(v.toFixed(2)));
const mix = (i: number, p: number): [number, number] => [lerp(CM[i][0], CP[i][0], p), lerp(CM[i][1], CP[i][1], p)];
const col2 = (a: number, b: number) => `\\begin{bmatrix}${f2(a)}\\\\ ${f2(b)}\\end{bmatrix}`;

/** a concept plane: the c- / c+ segment, the two points, an optional mixed point; (x, y) top-left, s side */
const Plane: React.FC<{
  x: number; y: number; s: number; i: number; o?: number; pts?: number; ptsM?: number; mixP?: number | null; mixCol?: string; q?: number; seg?: number; ticks?: boolean;
}> = ({ x, y, s, i, o = 1, pts = 1, ptsM, mixP = null, mixCol = C.concept, q = 0, seg = 1, ticks = false }) => {
  if (o <= 0.001) return null;
  const X = (u: number) => x + u * s, Y = (v: number) => y + (1 - v) * s;
  const m = mixP === null ? null : mix(i, mixP);
  const r = s > 300 ? 1 : 0.75;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <rect x={x} y={y} width={s} height={s} rx={10} fill={rgba(C.concept, 0.05)} stroke={rgba(C.concept, 0.55)} strokeWidth={2} />
      {[0.25, 0.5, 0.75].map((g) => (
        <g key={g} opacity={0.5}>
          <line x1={x} y1={y + g * s} x2={x + s} y2={y + g * s} stroke={C.line} strokeWidth={1.5} />
          <line x1={x + g * s} y1={y} x2={x + g * s} y2={y + s} stroke={C.line} strokeWidth={1.5} />
        </g>
      ))}
      {ticks ? (
        <g>
          <Txt x={x} y={y + s + 22} size={20} mono fill={C.mute}>0</Txt>
          <Txt x={x + s} y={y + s + 22} size={20} mono fill={C.mute}>1</Txt>
          <Txt x={x - 18} y={y} size={20} mono fill={C.mute}>1</Txt>
        </g>
      ) : null}
      <line x1={X(CP[i][0])} y1={Y(CP[i][1])} x2={X(CM[i][0])} y2={Y(CM[i][1])} stroke={C.concept} strokeWidth={2.5} strokeDasharray="6 7" opacity={0.75 * seg * Math.min(pts, ptsM ?? pts)} />
      <circle cx={X(CP[i][0])} cy={Y(CP[i][1])} r={11 * r} fill={C.concept} opacity={pts} />
      <circle cx={X(CM[i][0])} cy={Y(CM[i][1])} r={10 * r} fill={C.bg} stroke={C.concept} strokeWidth={3.5} opacity={ptsM ?? pts} />
      {m ? (
        <g>
          <circle cx={X(m[0])} cy={Y(m[1])} r={22 * r} fill={rgba(mixCol, 0.22)} />
          <circle cx={X(m[0])} cy={Y(m[1])} r={9 * r} fill={mixCol} stroke={C.chalk} strokeWidth={3} />
        </g>
      ) : null}
      {q > 0.001 ? (
        <g opacity={q}>
          <Txt x={x + s / 2} y={y + s + 26} size={s > 300 ? 30 : 22} weight={700} fill={C.chalk}>?</Txt>
          <Txt x={x - 24} y={y + s / 2} size={s > 300 ? 30 : 22} weight={700} fill={C.chalk}>?</Txt>
        </g>
      ) : null}
    </g>
  );
};

// ---- 15.16 recap: training inputs and updates versus test-time computation
const CMP_ROWS = ['input', 'network weights', 'vectors and probabilities'];
const CMP_CBM = ['image, concept labels, class label', 'updated using both losses', 'computed from this image'];
const CMP_CEM = ['new image', 'kept fixed', 'computed from the new image'];
const CMP_CHANGED = [false, false, false];
const CT = { lx: 160, c1: 620, c1w: 530, c2: 1190, c2w: 570, hy: 330, y0: 420, rh: 112, bh: 84 };
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
      <HText x={CT.c1 + 20} y={CT.hy} ay="middle" size={28} weight={700} color={C.chalk2} o={o}>training</HText>
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
  g: '\\gth: x \\mapsto (\\ccon{p_j},\\ \\ccon{c_j^{+}},\\ \\ccon{c_j^{-}})',
  c: '\\ch_j = \\ccon{p_j}\\,\\ccon{c_j^{+}} + (1-\\ccon{p_j})\\,\\ccon{c_j^{-}} \\in \\mathbb{R}^m',
  f: '\\yh = \\fph(\\ch_1, \\dots, \\ch_k)',
  train: '\\gth,\\ \\fph\\ \\ \\text{(joint training)}',
  data: '\\{(x,\\ \\ccon{c},\\ y)\\}\\ \\ \\text{images, concept labels, class labels}',
};

// ---- 15.2 and 15.3: define vectors, then show the learned generators
const PA = { x: 160, y: 450, w: 270, h: 180 };
const TRAIN_PH = { x: 160, y: 390, w: 210, h: 140 };
const SHC = D.cem_shape;
const SHAPES: { name: string; shape: string; c: number[]; y: string }[] = INC.objects;
const SHY = [460, 700];

/** a blue circle or square (the physical object colour of Part 8, not a role colour) */
const Shape: React.FC<{ kind: string; x: number; y: number; r: number; o?: number }> = ({ kind, x, y, r, o = 1 }) =>
  o <= 0.001 ? null : kind === 'circle'
    ? <circle cx={x} cy={y} r={r} fill={SHAPE_BLUE} opacity={o < 0.999 ? o : undefined} />
    : <rect x={x - r * 0.9} y={y - r * 0.9} width={r * 1.8} height={r * 1.8} rx={4} fill={SHAPE_BLUE} opacity={o < 0.999 ? o : undefined} />;

// ---- geometry
const PH1 = { x: 160, y: 340, w: 300, h: 200 };
const ENC1 = { x: 660, y: 440, w: 220, h: 110 };
const ROW1 = [370, 440, 510];
const PH2 = { x: 160, y: 320, w: 240, h: 160 };
const ENC2 = { x: 280, y: 640, w: 240, h: 100 };
const PL = { x: 600, y: 330, s: 400 };
const RX = 1110; // right panel, slides 2 to 5
const P6 = { x: 180, s: 160, ys: [330, 530, 730] };
const V6 = { x: 800, y: 400, rh: 54, w: 130 };
const H6 = { x: 1110, y: 562, w: 220, h: 120 };
const S6X = 1300;

export const S15: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.4) => inv(x, x + d, t);
  const NB = P.beats.length;
  const span = (k0: number, k1: number) => {
    const fin = inv(b(k0) - 0.05, b(k0) + 0.25, t);
    if (k1 >= NB) return fin;
    const z = Math.min(be(P, k1) + 0.02, b(k1 + 1) - 0.34);
    return fin * (1 - inv(z, z + 0.3, t));
  };
  const so = (k: number) => span(k, k);
  const oo = (s: number, v = 1) => s * v;

  // ---------------- 15.1 narrow channel
  const s1 = so(1);
  const enc1 = at(b(1) + 0.1, 0.5);
  const rowO = (i: number) => at(w(1, 'One') + i * 0.2);
  const narrow = at(w(1, 'narrow') - 0.1);
  const p8 = at(w(1, 'vocabulary') - 0.1, 0.5);
  const p8acc = at(w(1, 'accuracy') - 0.1);

  // ---------------- 15.2 definition; 15.3 learned layers
  const n2 = so(2), n3 = so(3);
  const n2a = at(w(2, 'embedding') - 0.1), n2pair = at(w(2, 'computes') - 0.1);
  const n2both = at(w(2, 'Both') - 0.1), n2meaning = at(w(2, 'coordinates') - 0.1);
  const n3image = at(w(3, 'image') - 0.1), n3layers = at(w(3, 'two') - 0.1);
  const n3weights = at(w(3, 'Training') - 0.1), n3different = at(w(3, 'different') - 0.1);
  const sTrain = so(10);
  const trainFlow = at(w(10, 'image') - 0.1), trainConcept = at(w(10, 'concept', 1) - 0.1);
  const trainTask = at(w(10, 'task') - 0.1), trainGrad = at(w(10, 'Backpropagation') - 0.1);

  // ---------------- 15.11 to 15.15: one reason or operation per slide
  const shapeOld = so(11), shapeVec = so(12), shapeTrain = so(13), shapeHead = so(14), shapeCost = so(15);
  const oldPair = at(w(11, 'circle') - 0.1), oldValues = at(w(11, 'Both') - 0.1);
  const oldHead = at(w(11, 'identical') - 0.1), oldTake = at(w(11, 'missing') - 0.1);
  const vecImage = at(w(12, 'image') - 0.1), vecNet = at(w(12, 'network') - 0.1);
  const vecP = at(w(12, 'probabilities') - 0.1), vecCircle = at(w(12, 'circle') - 0.1);
  const vecSquare = at(w(12, 'square') - 0.1), vecTake = at(w(12, 'force') - 0.1);
  const trainSame = at(w(13, 'concept') - 0.1), trainDifferent = at(w(13, 'class') - 0.1);
  const trainWhy = at(w(13, 'encourage') - 0.1), trainNoShape = at(w(13, 'no') - 0.1);
  const headRule = at(w(14, 'score') - 0.1), headRuleB = at(w(14, 'B') - 0.1);
  const headCircle = at(w(14, 'circle') - 0.1), headSquare = at(w(14, 'square') - 0.1);
  const headTake = at(w(14, 'removes') - 0.1);
  const costP = at(w(15, 'probability') - 0.1), costVec = at(w(15, 'embedding') - 0.1);
  const costNames = at(w(15, 'coordinates') - 0.1), costTake = at(w(15, 'capacity') - 0.1);

  // ---------------- 15.4 to 15.7 the stripes plane
  const sP = span(4, 7);
  const s2 = so(4), s3 = so(5), s4 = so(6), s5 = so(7);
  const encO = at(w(4, 'image') - 0.2, 0.5);
  const cpO = at(w(4, 'active') - 0.1), cmO = at(w(4, 'inactive') - 0.1);
  const every2 = at(w(4, 'every') - 0.1);
  const g3 = at(w(5, 'probability') - 0.2, 0.5);
  const g3v = E.io(inv(w(5, '0.1') - 0.3, w(5, '0.1') + 0.5, t));
  const g3m = at(w(5, 'misses') - 0.1);
  const w4 = at(w(6, 'mixes') - 0.1);
  const eq4: [string, number][] = [
    ['\\ch = ', w(6, 'mixes')], ['\\ccon{p}\\,\\ccon{c^{+}}', w(6, 'p') - 0.1], ['{} + (1-\\ccon{p})\\,\\ccon{c^{-}}', w(6, 'plus') - 0.1],
  ];
  const sw0 = w(6, 'plus'), sw1 = w(6, 'inactive') + 0.3;
  const mix4 = at(w(6, 'p') - 0.1, 0.3);
  const p4 = 1 - E.io(inv(sw0, sw1, t));
  const p5 = lerp(0, PV[0], E.io(inv(w(7, '0.1'), w(7, '0.1') + 0.8, t)));
  const mixP = t >= b(7) - 0.4 ? p5 : p4;
  const endLab = at(w(6, 'one') - 0.1);
  // the first entry, worked: 0.1 x 0.82 + 0.9 x 0.22 = 0.28, then the whole vector
  const ent5: [string, number][] = [
    [`\\ccon{${f1(PV[0])}} \\times ${f2(CP[0][0])}`, w(7, '0.1', 1) - 0.1],
    [`{} + \\ccon{${f1(1 - PV[0])}} \\times ${f2(CM[0][0])}`, w(7, 'plus') - 0.1],
    [`{} = ${f2(EMB[0])}`, w(7, 'gives') - 0.1],
  ];
  const ent5o = at(w(7, 'first') - 0.1);
  const eq5: [string, number][] = [
    [`\\ccon{${f1(PV[0])}}${col2(CP[0][0], CP[0][1])}`, w(7, 'second') - 0.1],
    [`{} + \\ccon{${f1(1 - PV[0])}}${col2(CM[0][0], CM[0][1])}`, w(7, 'second') + 0.2],
    [`{} = ${col2(EMB[0], EMB[1])}`, w(7, 'way') - 0.1],
  ];
  const close5 = at(w(7, 'close') - 0.1);

  // ---------------- 15.6 to 15.7 head and the edit
  const sH = span(8, 9);
  const s6 = so(8), s7 = so(9);
  const pl6 = (i: number) => at(b(8) + 0.05 + i * 0.12);
  const vec6 = at(w(8, 'reads') - 0.1, 0.5);
  const six = at(w(8, 'six') - 0.1);
  const head6 = at(w(8, 'head') - 0.15, 0.5);
  const sh6 = at(w(8, 'favours') - 0.2, 0.8);
  const person7 = at(w(9, 'person') - 0.2);
  const editP = E.io(inv(w(9, 'Setting'), w(9, 'swaps') + 0.2, t));
  const editOn = at(w(9, 'sets') - 0.1, 0.3);
  const headHi = at(w(9, 'embedding'), 0.25) * (1 - at(w(9, 'embedding') + 0.6, 0.5));
  const shareK = at(w(9, 'zebra') - 0.1, 0.8);
  const line7 = at(w(9, 'swaps') - 0.1);
  const pS = editOn > 0.001 ? lerp(PV[0], 1, editP) : PV[0];
  const vec = EMB.map((v, k) => (k < 2 ? mix(0, pS)[k] : v)); // ends at EMB_E when p = 1

  // ---------------- 15.16 recap, 15.17 the card
  const sR = so(16);
  const cmpRow = (i: number) => at(w(16, ['input', 'weights', 'vectors'][i]) - 0.1);
  const cmpHi = (_i: number) => 0;
  const cmpSame = at(w(16, 'fixed') - 0.1);
  const s11 = so(17);
  const cardP = [w(17, 'g'), w(17, 'hat'), w(17, 'f', 1), w(17, 'Training'), w(17, 'images')].reduce((s, x) => s + inv(x - 0.1, x + 0.4, t), 0) / 5;
  const legO = at(w(17, 'j') - 0.1);

  return (
    <Stage>
      {/* ================= photos ================= */}
      <PhotoR R={PH1} src={`worked/${EX}`} o={oo(s1, enc1)} />
      <PhotoR R={PH2} src={`worked/${EX}`} o={oo(sP, encO)} />
      <PhotoR R={PA} src={`worked/${EX}`} o={oo(n3, n3image)} />
      <PhotoR R={TRAIN_PH} src={`worked/${EX}`} o={sTrain * trainFlow} />

      <Svg>
        {/* ---------------- slide 1 ---------------- */}
        {s1 > 0.001 ? (
          <g opacity={s1 < 0.999 ? s1 : undefined}>
            <Flow pts={[[PH1.x + PH1.w + 10, ENC1.y], [ENC1.x - ENC1.w / 2 - 8, ENC1.y]]} color={C.input} p={enc1} t={t} live={1} n={1} head={13} dotR={5} />
            <Block x={ENC1.x} y={ENC1.y} w={ENC1.w} h={ENC1.h} kind="input" title="encoder" o={enc1} />
            {NAMES.map((n, i) => (
              <g key={n}>
                <Flow pts={[[ENC1.x + ENC1.w / 2 + 6, ENC1.y + (i - 1) * 28], [880, ROW1[i]], [905, ROW1[i]]]} color={C.concept} sw={2} head={0} p={rowO(i)} t={t + i * 0.3} live={rowO(i)} n={1} dotR={4} />
                <ConceptRow x={920} y={ROW1[i]} label={n} v={PV[i]} labelW={250} w={220} size={28} o={rowO(i)} />
              </g>
            ))}
            {p8 > 0.001 ? (
              <g opacity={p8 < 0.999 ? p8 : undefined}>
                <rect x={560} y={680} width={800} height={200} rx={14} fill={C.bg2} stroke={C.line2} strokeWidth={2} />
                <Txt x={590} y={716} size={26} anchor="start" weight={600} fill={C.chalk2}>Part 8: an incomplete vocabulary</Txt>
                <circle cx={630} cy={790} r={30} fill={SHAPE_BLUE} />
                <rect x={710} y={760} width={60} height={60} rx={4} fill={SHAPE_BLUE} />
                <Txt x={810} y={772} size={28} anchor="start" mono weight={600} fill={C.concept}>
                  {`${INC.vocab.map((v: string, j: number) => `${v} ${INC.objects[0].c[j]}`).join(', ')} for both`}
                </Txt>
                <Txt x={810} y={830} size={28} anchor="start" fill={C.chalk} o={p8acc}>{`same values, so best accuracy ${f2(INC.best_accuracy)}`}</Txt>
              </g>
            ) : null}
          </g>
        ) : null}

        {/* ---------------- slide 2: the two numeric vectors ---------------- */}
        <VecCol x={500} y={490} vals={CP[0]} rowH={68} w={150} size={36} digits={2} o={n2 * n2pair} />
        <VecCol x={1210} y={490} vals={CM[0]} rowH={68} w={150} size={36} digits={2} o={n2 * n2pair} />

        {/* ---------------- slide 3: learned layers compute both vectors ---------------- */}
        {n3 > 0.001 ? <g opacity={n3}>
          <Flow pts={[[450, 540], [500, 540]]} color={C.input} o={n3image} />
          <Block x={670} y={540} w={300} h={130} kind="input" title="image encoder" sub="extract features" subSize={24} o={n3image} />
          {[400, 680].map((y, i) => <g key={i} opacity={n3layers}>
            <Flow pts={[[840, 540], [910, 540], [910, y], [980, y]]} color={C.input} />
            <Block x={1150} y={y} w={300} h={120} kind="concept" title="learned layer" sub={i ? 'for stripes absent' : 'for stripes present'} subSize={24} />
            <Flow pts={[[1320, y], [1430, y]]} color={C.concept} />
            <VecCol x={1460} y={y - 68} vals={i ? CM[0] : CP[0]} rowH={68} w={150} size={34} digits={2} />
          </g>)}
        </g> : null}

        {/* ---------------- slide 10: joint training with two labelled targets ---------------- */}
        {sTrain > 0.001 ? <g opacity={sTrain}>
          <Flow pts={[[390, 460], [430, 460]]} color={C.input} o={trainFlow} />
          <Block x={560} y={460} w={230} h={140} kind="input" title="encoder" size={30} o={trainFlow} />
          <Flow pts={[[695, 460], [740, 460]]} color={C.input} o={trainFlow} />
          <Block x={930} y={460} w={340} h={140} kind="concept" title="vectors and p" sub="learned layers + scorer" subSize={24} o={trainFlow} />
          <Flow pts={[[1120, 460], [1240, 460]]} color={C.concept} o={trainFlow} />
          <Block x={1380} y={460} w={240} h={140} kind="head" title="task head" sub="class prediction" subSize={24} o={trainFlow} />
          <Flow pts={[[930, 550], [930, 690]]} color={C.concept} o={trainConcept} />
          <Block x={930} y={770} w={380} h={120} kind="loss" title="concept loss" sub="p versus true concept" subSize={23} o={trainConcept} />
          <Flow pts={[[1380, 550], [1380, 690]]} color={C.chalk} o={trainTask} />
          <Block x={1430} y={770} w={380} h={120} kind="loss" title="task loss" sub="compare with class: zebra" subSize={23} o={trainTask} />
          <Flow pts={[[650, 770], [720, 770]]} color={C.concept} o={trainConcept} />
          <Flow pts={[[1690, 690], [1690, 770], [1640, 770]]} color={C.chalk} o={trainTask} />
        </g> : null}

        {/* ---------------- 15.11: identical semantic values lose shape ---------------- */}
        {shapeOld > 0.001 ? <g opacity={shapeOld}>
          {SHAPES.map((obj, i) => <g key={obj.shape}>
            <Shape kind={obj.shape} x={230} y={SHY[i]} r={58} o={oldPair} />
            <Txt x={230} y={SHY[i] + 100} size={28} fill={C.chalk} o={oldPair}>{`target: ${obj.y}`}</Txt>
            <Flow pts={[[310, SHY[i]], [420, SHY[i]]]} color={C.input} p={oldValues} />
            <Flow pts={[[730, SHY[i]], [810, SHY[i]]]} color={C.concept} p={oldValues} />
            <g opacity={oldValues}>
              {INC.vocab.map((v: string, r: number) => <ConceptRow key={v} x={840} y={SHY[i] - 28 + r * 56} label={v} v={obj.c[r]} labelW={110} w={140} size={28} digits={0} />)}
            </g>
            <Flow pts={[[1140, SHY[i]], [1180, 580 + (i ? 28 : -28)]]} color={C.concept} p={oldHead} />
          </g>)}
          <Block x={575} y={580} w={280} h={380} kind="input" title="concept predictor" sub="blue and large" size={28} subSize={25} o={oldValues} />
          <Block x={1300} y={580} w={220} h={150} kind="head" title="task head" o={oldHead} />
          <Flow pts={[[1420, 580], [1510, 580]]} color={C.chalk} p={oldHead} />
          <Txt x={1650} y={560} size={30} weight={700} o={oldHead}>same prediction</Txt>
          <Txt x={1650} y={606} size={28} fill={C.chalk2} o={oldHead}>for both images</Txt>
        </g> : null}

        {/* ---------------- 15.12: same probability need not mean same vector ---------------- */}
        {shapeVec > 0.001 ? <g opacity={shapeVec}>
          {SHAPES.map((obj, i) => <g key={obj.shape}>
            <Shape kind={obj.shape} x={230} y={SHY[i]} r={58} o={vecImage} />
            <Txt x={230} y={SHY[i] + 100} size={28} o={vecImage}>{obj.name}</Txt>
            <Flow pts={[[310, SHY[i]], [450, SHY[i]]]} color={C.input} p={vecNet} />
            <Flow pts={[[810, SHY[i]], [930, SHY[i]]]} color={C.concept} p={vecP} />
            <rect x={950} y={SHY[i] - 100} width={790} height={200} rx={14} fill={C.bg2} stroke={C.line2} strokeWidth={2} opacity={vecP} />
            <Txt x={1120} y={SHY[i] - 54} size={26} fill={C.chalk2} o={vecP}>blue probability</Txt>
            <Txt x={1120} y={SHY[i] + 20} size={42} mono fill={C.concept} o={vecP}>{f2(SHC.blue_probability)}</Txt>
            <Txt x={1500} y={SHY[i] - 66} size={26} fill={C.chalk2} o={i ? vecSquare : vecCircle}>mixed blue vector</Txt>
            <VecCol x={1430} y={SHY[i] - 42} vals={SHC.blue_embeddings[i]} rowH={56} w={140} size={34} digits={2} o={i ? vecSquare : vecCircle} />
          </g>)}
          <Block x={630} y={580} w={340} h={380} kind="input" title="CEM network" sub="same learned weights" size={32} subSize={24} o={vecNet} />
        </g> : null}

        {/* ---------------- 15.13: what the two training signals ask for ---------------- */}
        {shapeTrain > 0.001 ? <g opacity={shapeTrain}>
          {[trainSame, trainDifferent].map((o, k) => <g key={k} opacity={o}>
            <rect x={160 + k * 880} y={350} width={720} height={420} rx={16} fill={C.bg2} stroke={k ? C.line2 : C.concept} strokeWidth={2} />
            <Txt x={520 + k * 880} y={405} size={34} weight={700} fill={k ? C.chalk : C.concept}>{k ? 'Class labels' : 'Concept labels'}</Txt>
            {SHAPES.map((obj, i) => <g key={obj.shape}>
              <Shape kind={obj.shape} x={350 + k * 880 + i * 340} y={525} r={50} />
              <Txt x={350 + k * 880 + i * 340} y={630} size={29} fill={k ? C.chalk : C.concept}>{k ? obj.y : 'blue, small'}</Txt>
            </g>)}
            <Txt x={520 + k * 880} y={720} size={30} weight={600} fill={k ? C.chalk : C.concept}>{k ? 'Task loss: answers should differ' : 'Concept loss: both should be blue'}</Txt>
          </g>)}
        </g> : null}

        {/* ---------------- 15.14: the same head, with the arithmetic visible ---------------- */}
        {shapeHead > 0.001 ? <g opacity={shapeHead}>
          <Block x={920} y={580} w={240} h={150} kind="head" title="task head" sub="same fixed rule" subSize={24} o={headRuleB} />
          {SHAPES.map((obj, i) => <g key={obj.shape} opacity={i ? headSquare : headCircle}>
            <Shape kind={obj.shape} x={230} y={SHY[i]} r={54} />
            <Txt x={230} y={SHY[i] + 94} size={26}>{obj.name}</Txt>
            <VecCol x={500} y={SHY[i] - 65} vals={SHC.blue_embeddings[i]} rowH={65} w={140} size={34} digits={2} ring={(j) => j === 1 ? 1 : 0} ringColor={C.concept} />
            <Flow pts={[[670, SHY[i]], [790, 580 + (i ? 30 : -30)]]} color={C.concept} />
            <Flow pts={[[1050, 580 + (i ? 30 : -30)], [1160, SHY[i]]]} color={C.chalk} />
            {SHC.scores[i].map((score: number, j: number) => <Txt key={j} x={1290} y={SHY[i] - 25 + j * 56} size={32} mono fill={i === j ? C.chalk : C.chalk2} weight={i === j ? 700 : 500}>{`${j ? 'B' : 'A'}: ${f2(score)}`}</Txt>)}
            <Flow pts={[[1420, SHY[i]], [1510, SHY[i]]]} color={C.chalk} />
            <Txt x={1650} y={SHY[i]} size={36} weight={700}>{SHC.predictions[i]}</Txt>
          </g>)}
        </g> : null}

        {/* ---------------- 15.15: extra information is not another named concept ---------------- */}
        {shapeCost > 0.001 ? <g opacity={shapeCost}>
          <Shape kind="circle" x={230} y={560} r={65} o={costP} />
          <Flow pts={[[315, 560], [420, 560], [420, 430], [520, 430]]} color={C.input} p={costP} />
          <Flow pts={[[420, 560], [420, 690], [520, 690]]} color={C.input} p={costVec} />
          <Block x={770} y={430} w={460} h={160} kind="concept" title="blue probability" sub={f2(SHC.blue_probability)} size={30} subSize={38} o={costP} />
          <Block x={770} y={690} w={460} h={180} kind="concept" title="blue embedding" sub={`(${SHC.blue_embeddings[0].map(f2).join(', ')})`} size={30} subSize={34} o={costVec} />
        </g> : null}

        {/* ---------------- slides 2 to 5: the stripes plane ---------------- */}
        {sP > 0.001 ? (
          <g opacity={sP < 0.999 ? sP : undefined}>
            <Flow pts={[[PH2.x + PH2.w / 2, PH2.y + PH2.h + 8], [ENC2.x, ENC2.y - ENC2.h / 2 - 8]]} color={C.input} p={encO} t={t} live={encO} n={1} head={13} dotR={5} />
            <Block x={ENC2.x} y={ENC2.y} w={ENC2.w} h={ENC2.h} kind="input" title="encoder" o={encO} />
            <Flow pts={[[ENC2.x + ENC2.w / 2 + 8, ENC2.y], [PL.x - 60, ENC2.y], [PL.x - 60, PL.y + PL.s / 2], [PL.x - 12, PL.y + PL.s / 2]]} color={C.input} p={at(w(4, 'computes') - 0.3, 0.6)} t={t} live={encO} n={2} head={13} dotR={5} />
            <Plane x={PL.x} y={PL.y} s={PL.s} i={0} o={at(w(4, 'computes') - 0.2, 0.5)} pts={cpO} ptsM={cmO} mixP={t > w(6, 'p') - 0.2 ? mixP : null} ticks />
            <MathSvg x={PL.x + CP[0][0] * PL.s + 4} y={PL.y + (1 - CP[0][1]) * PL.s + 40} tex="\ccon{c^{+}}" size={32} o={cpO} />
            <MathSvg x={PL.x + CM[0][0] * PL.s + 2} y={PL.y + (1 - CM[0][1]) * PL.s - 40} tex="\ccon{c^{-}}" size={32} o={cmO} />
            <Txt x={PL.x + CP[0][0] * PL.s + 2} y={PL.y + (1 - CP[0][1]) * PL.s + 78} size={22} mono fill={C.chalk2} o={endLab * (1 - at(b(7) - 0.4, 0.3))}>p = 1</Txt>
            <Txt x={PL.x + CM[0][0] * PL.s + 2} y={PL.y + (1 - CM[0][1]) * PL.s + 36} size={22} mono fill={C.chalk2} o={endLab * (1 - at(b(7) - 0.4, 0.3))}>p = 0</Txt>
            <Txt x={PL.x + mix(0, PV[0])[0] * PL.s + 34} y={PL.y + (1 - mix(0, PV[0])[1]) * PL.s + 2} size={22} anchor="start" mono weight={700} fill={C.chalk} o={at(w(7, '0.1') + 0.6)}>{`p = ${f1(PV[0])}`}</Txt>

            {/* slide 2: the two vectors */}
            {s2 > 0.001 ? (
              <g opacity={s2 < 0.999 ? s2 : undefined}>
                <VecCol x={RX + 20} y={420} vals={CP[0]} rowH={66} w={140} size={34} digits={2} o={cpO} />
                <VecCol x={RX + 300} y={420} vals={CM[0]} rowH={66} w={140} size={34} digits={2} o={cmO} />
              </g>
            ) : null}

            {/* slide 3: the probability gauge */}
            {s3 > 0.001 ? (
              <g opacity={s3 * g3 < 0.999 ? s3 * g3 : undefined}>
                <rect x={RX} y={500} width={480} height={20} rx={8} fill={C.bg3} />
                <rect x={RX} y={500} width={480 * PV[0] * g3v} height={20} rx={8} fill={C.concept} />
                <circle cx={RX + 480 * PV[0] * g3v} cy={510} r={14} fill={C.concept} stroke="#0B0F14" strokeWidth={3} />
                <Txt x={RX} y={548} size={22} mono fill={C.mute}>0</Txt>
                <Txt x={RX + 480} y={548} size={22} mono fill={C.mute}>1</Txt>
              </g>
            ) : null}
          </g>
        ) : null}

        {/* ---------------- slides 6 and 7: the head reads all three ---------------- */}
        {sH > 0.001 ? (
          <g opacity={sH < 0.999 ? sH : undefined}>
            {NAMES.map((n, i) => {
              const y = P6.ys[i];
              const edited = i === 0 && editOn > 0.5;
              const p = i === 0 ? pS : PV[i];
              const [mx, my] = [vec[2 * i], vec[2 * i + 1]]; // use the same values as the head input
              return (
                <g key={n} opacity={pl6(i)}>
                  <Plane x={P6.x} y={y} s={P6.s} i={i} mixP={p} mixCol={edited ? C.edit : C.concept} />
                  <Txt x={P6.x + P6.s + 26} y={y + 30} size={28} anchor="start" weight={600} fill={C.chalk}>{n}</Txt>
                  <Txt x={P6.x + P6.s + 26} y={y + 72} size={24} anchor="start" mono fill={edited ? C.edit : C.chalk2}>{`p = ${f2(p)}`}</Txt>
                  <Txt x={P6.x + P6.s + 26} y={y + 110} size={24} anchor="start" mono fill={edited ? C.edit : C.concept}>{`(${mx.toFixed(3)}, ${my.toFixed(3)})`}</Txt>
                  <Flow pts={[[P6.x + P6.s + 270, y + P6.s / 2], [V6.x - 40, y + P6.s / 2], [V6.x - 40, V6.y + (2 * i + 1) * V6.rh], [V6.x - 8, V6.y + (2 * i + 1) * V6.rh]]}
                    color={C.concept} sw={2.5} p={vec6} t={t + i * 0.25} live={vec6} n={1} head={11} dotR={4} />
                </g>
              );
            })}
            <Person x={P6.x + P6.s + 240} y={P6.ys[0] + 64} s={0.62} o={person7} />
            <g opacity={vec6}>
              {[0, 1, 2].map((i) => (
                <rect key={i} x={V6.x + 8} y={V6.y + 2 * i * V6.rh + 5} width={V6.w - 16} height={2 * V6.rh - 10} rx={10} fill="none"
                  stroke={rgba(C.concept, 0.5 * six)} strokeWidth={2} />
              ))}
              <VecCol x={V6.x} y={V6.y} vals={vec} rowH={V6.rh} w={V6.w} size={27} digits={3}
                cellColor={(k) => (k < 2 && editOn > 0.5 ? C.edit : C.chalk)} />
            </g>
            <Flow pts={[[V6.x + V6.w + 10, H6.y], [H6.x - H6.w / 2 - 8, H6.y]]} color={C.concept} p={head6} o={head6} t={t} live={head6} n={1} head={12} dotR={5} />
            <Block x={H6.x} y={H6.y} w={H6.w} h={H6.h} kind="head" title="task head" sub="then softmax" size={28} subSize={23} o={head6} hi={headHi} />
            <Flow pts={[[H6.x + H6.w / 2 + 6, H6.y], [S6X - 12, H6.y]]} color={C.chalk} p={sh6} o={sh6} t={t} live={sh6} n={1} head={12} dotR={5} />
            <ShareBars x={S6X} y={H6.y - 60} labels={CLS} from={PR} to={PRE} k={shareK} labelW={120} w={200} rowH={60} size={28} p={sh6} o={at(w(8, 'favours') - 0.2)} />
          </g>
        ) : null}

        {/* ---------------- slide 16: recap ---------------- */}
        <CompareSvg o={sR} rowO={cmpRow} hiO={cmpHi} changed={CMP_CHANGED} />

      </Svg>

      {/* ================= HTML text ================= */}
      <Header t={t} part={10} title={P.title} />

      {/* slide 1 */}
      <SlideHead text={bh(P, 1)} o={s1} />
      <Credit x={PH1.x} y={PH1.y + PH1.h + 10} text={`Photo: ${EXC.artist}, Wikimedia Commons, ${EXC.license}`} o={oo(s1, enc1)} />
      <Rich x={920} y={566} size={32} text="{c:one number} per concept: a narrow channel" o={oo(s1, narrow)} />
      <EvTag x={1760} y={890} ax="right" kind="illustrative" text="hand-chosen values" o={oo(s1, rowO(0))} />

      {/* slide 2: definition before the mechanics */}
      <SlideHead text={bh(P, 2)} o={n2} />
      <Rich x={160} y={310} w={1600} size={36} text="An {c:embedding} is a short list of learned numbers." o={n2 * n2a} />
      <Rich x={575} y={420} ax="center" size={32} text="{c:stripes present}" o={n2 * n2pair} />
      <Rich x={1285} y={420} ax="center" size={32} text="{c:stripes absent}" o={n2 * n2pair} />
      <Rich x={960} y={700} ax="center" size={34} text="Both vectors come from the {x:current image}." o={n2 * n2both} />
      <Rich x={960} y={770} ax="center" size={28} color={C.chalk2} text="These are not stored reference photos or class averages." o={n2 * n2both} />
      <Rich x={960} y={830} ax="center" size={28} color={C.chalk2} text="The coordinates are learned features, without individual names." o={n2 * n2meaning} />
      <EvTag x={160} y={920} kind="illustrative" text="hand-chosen vector values" o={n2 * n2pair} />

      {/* slide 3: origin of the vectors */}
      <SlideHead text={bh(P, 3)} o={n3} />
      <Rich x={1150} y={290} ax="center" size={28} text="the {c:stripes} concept" o={n3 * n3layers} />
      <Credit x={PA.x} y={PA.y + PA.h + 12} text={`Photo: ${EXC.artist}, Wikimedia Commons, ${EXC.license}`} o={n3 * n3image} />
      <Rich x={160} y={790} size={32} text="Training learns the {y:weights} of these layers." o={n3 * n3weights} />
      <Rich x={160} y={850} size={30} color={C.chalk2} text="Keep the weights fixed: a new image can still produce different vectors." o={n3 * n3different} />
      <EvTag x={1760} y={920} ax="right" kind="illustrative" text="hand-chosen outputs, not a trained run" o={n3 * n3layers} />

      {/* slides 4 to 7 */}
      <SlideHead text={bh(P, 4)} o={s2} />
      <SlideHead text={bh(P, 5)} o={s3} />
      <SlideHead text={bh(P, 6)} o={s4} />
      <SlideHead text={bh(P, 7)} o={s5} />
      <Rich x={PL.x + PL.s / 2} y={PL.y + PL.s + 40} ax="center" size={28} color={C.chalk2} text="{c:stripes}: two embeddings in one plane" o={oo(sP, at(w(4, 'computes') - 0.2, 0.5))} />
      <Tex x={RX + 90} y={366} ax="center" size={48} tex="\ccon{c^{+}}" o={oo(s2, cpO)} />
      <Tex x={RX + 370} y={366} ax="center" size={48} tex="\ccon{c^{-}}" o={oo(s2, cmO)} />
      <Rich x={RX + 90} y={572} ax="center" size={30} text="{c:active}" o={oo(s2, cpO)} />
      <Rich x={RX + 370} y={572} ax="center" size={30} text="{c:inactive}" o={oo(s2, cmO)} />
      <Rich x={RX} y={680} w={560} size={30} color={C.chalk2} text="one pair for every concept, computed from the {x:image}" o={oo(s2, every2)} />
      <Rich x={RX} y={800} w={600} size={28} color={C.chalk2} text="embedding: a short list of numbers (here two)" o={oo(s2, at(w(4, 'embedding') - 0.1))} />
      {/* slide 3 */}
      <Rich x={RX} y={330} w={600} size={30} text="a learned scorer reads {c:both vectors}" o={oo(s3, g3)} />
      <Rich x={RX} y={405} w={560} size={30} text="and predicts the probability of {c:stripes}" o={oo(s3, g3)} />
      <Tex x={RX} y={640} size={56} tex={`\\ccon{p} = ${f1(PV[0])}`} o={oo(s3, at(w(5, '0.1') - 0.1))} />
      <Rich x={RX} y={730} w={600} size={28} color={C.chalk2} text="suppose it misses the {c:stripes}, as in Part 4" o={oo(s3, g3m)} />
      {/* slide 4: words, then the same line in symbols */}
      <Rich x={RX} y={390} w={560} size={32} lh={1.5} text="{c:mixed} = {c:p} × {c:active} + (1 − {c:p}) × {c:inactive}" o={oo(s4, w4)} />
      <TexSteps x={RX} y={560} t={t} size={52} o={s4} parts={eq4} />
      <Rich x={RX} y={660} w={560} size={28} color={C.chalk2} text="the mixed point lies on the segment from {c:inactive} to {c:active}" o={oo(s4, endLab)} />
      {/* slide 5: the arithmetic */}
      <Rich x={RX} y={380} w={600} size={32} text={`$\\ch$ for {c:stripes}, with {c:p = ${f1(PV[0])}}:`} o={oo(s5, at(b(7) + 0.1))} />
      <Rich x={RX} y={450} w={600} size={28} color={C.chalk2} text="first entry:" o={oo(s5, ent5o)} />
      <TexSteps x={RX} y={520} t={t} size={40} o={s5} parts={ent5} />
      <TexSteps x={RX} y={660} t={t} size={34} o={s5} parts={eq5} />
      <Rich x={RX} y={760} w={600} size={32} text="close to {c:inactive}" o={oo(s5, close5)} />
      <EvTag x={1760} y={890} ax="right" kind="illustrative" text="hand-chosen 2-D embeddings" o={oo(sP, cpO)} />

      {/* slides 6 and 7 */}
      <SlideHead text={bh(P, 8)} o={s6} />
      <SlideHead text={bh(P, 9)} o={s7} />
      <Rich x={V6.x - 20} y={V6.y - 64} size={26} color={C.chalk2} text="{c:6 numbers}" o={oo(sH, six)} />
      <Rich x={S6X} y={760} w={460} size={30} color={C.chalk2} text="fixed weights; no true labels needed" o={oo(s6, sh6)} />
      <Tex x={S6X} y={790} size={44} tex={`\\cedit{p = 1}:\\ \\ch = \\ccon{c^{+}}`} o={oo(s7, line7)} />
      <Rich x={S6X} y={850} w={460} size={28} color={C.chalk2} text="now {y:zebra} leads" o={oo(s7, shareK)} />
      <EvTag x={1760} y={300} ax="right" kind="illustrative" text="hand-chosen embeddings and head" o={oo(sH, pl6(0))} />

      {/* slide 10: what teaches the network */}
      <SlideHead text={bh(P, 10)} o={sTrain} />
      <Rich x={160} y={300} size={32} text="Training example: {x:photo} + {c:concept labels} + {y:class label}" o={sTrain * trainFlow} />
      <Credit x={160} y={550} text={`Photo: ${EXC.artist}, Wikimedia Commons, ${EXC.license}`} o={sTrain * trainFlow} />
      <HText x={1180} y={380} w={150} ax="center" size={24} color={C.concept} o={sTrain * trainFlow}>mixed vectors</HText>
      <Rich x={480} y={730} w={280} ax="center" size={28} text="concept label: {c:stripes present}" o={sTrain * trainConcept} />
      <Rich x={1690} y={610} w={200} ax="center" size={28} text="class label: {y:zebra}" o={sTrain * trainTask} />
      <Rich x={160} y={920} size={30} text="{l:Backpropagation} updates the encoder, vector layers, scorer and head." o={sTrain * trainGrad} />

      {/* slides 11 to 15: the missing-shape example, step by step */}
      <SlideHead text={bh(P, 11)} o={shapeOld} />
      <Rich x={160} y={305} size={30} color={C.chalk2} text="Part 8: same colour and size, but different classes" o={shapeOld * oldPair} />
      <Rich x={960} y={870} ax="center" size={34} text="{x:Shape} is visible in the image, but absent from the head's input." o={shapeOld * oldTake} />
      <EvTag x={1760} y={940} ax="right" kind="constructed" text="Part 8's two objects; exact concept values" o={shapeOld * oldValues} />

      <SlideHead text={bh(P, 12)} o={shapeVec} />
      <Rich x={160} y={305} size={29} color={C.chalk2} text="Only {c:blue} is shown. The {c:large} embedding is identical for both images." o={shapeVec * vecNet} />
      <Rich x={960} y={870} ax="center" size={34} text="Same answer to ‘is it blue?’ does not mean the same {c:vector}." o={shapeVec * vecTake} />
      <EvTag x={1760} y={940} ax="right" kind="illustrative" text="hand-chosen vectors; mixing computed; no trained shape CEM" o={shapeVec * vecP} />

      <SlideHead text={bh(P, 13)} o={shapeTrain} />
      <Rich x={960} y={835} ax="center" size={33} text="The {l:task loss} can encourage the vectors to retain {x:shape}." o={shapeTrain * trainWhy} />
      <Rich x={960} y={900} ax="center" size={29} color={C.chalk2} text="We still have no named shape concept." o={shapeTrain * trainNoShape} />

      <SlideHead text={bh(P, 14)} o={shapeHead} />
      <Rich x={160} y={300} size={30} text="Illustrative head: score A = {c:second entry}" o={shapeHead * headRule} />
      <Rich x={1040} y={300} size={30} text="score B = 1 − {c:second entry}" o={shapeHead * headRuleB} />
      <HText x={570} y={360} ax="center" size={24} color={C.chalk2} o={shapeHead * headRuleB}>mixed blue vector</HText>
      <HText x={1290} y={360} ax="center" size={24} color={C.chalk2} o={shapeHead * headRuleB}>class scores</HText>
      <HText x={1650} y={360} ax="center" size={24} color={C.chalk2} o={shapeHead * headRuleB}>higher score wins</HText>
      <Rich x={960} y={870} ax="center" size={34} text="Different inputs to the {f:head} remove the forced tie." o={shapeHead * headTake} />
      <EvTag x={1760} y={940} ax="right" kind="illustrative" text="hand-chosen vectors and head; scores computed" o={shapeHead * headRule} />

      <SlideHead text={bh(P, 15)} o={shapeCost} />
      <Rich x={1100} y={420} w={650} size={32} text="Named meaning: how likely is {c:blue}?" o={shapeCost * costP} />
      <Rich x={1100} y={640} w={650} size={32} text="Extra detail can reach the {f:head}." o={shapeCost * costVec} />
      <Rich x={1100} y={725} w={650} size={30} color={C.chalk2} text="No coordinate is labelled ‘round’ or ‘square’." o={shapeCost * costNames} />
      <Rich x={960} y={870} ax="center" size={33} text="More capacity does not make every detail {c:interpretable}." o={shapeCost * costTake} />
      <EvTag x={1760} y={940} ax="right" kind="illustrative" text="same hand-chosen shape example" o={shapeCost * costVec} />

      {/* slide 16: training versus test recap */}
      <SlideHead text={bh(P, 16)} o={sR} />
      <CompareText o={sR} name="test" cells={CMP_CEM} rowO={cmpRow} hiO={cmpHi} changed={CMP_CHANGED} />
      <Rich x={196} y={850} size={30} color={C.chalk2} text="Test-time vectors are newly computed; the learned weights stay fixed." o={oo(sR, cmpSame)} />

      {/* slide 17 */}
      <SlideHead text={bh(P, 17)} o={s11} />
      <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.86)', transformOrigin: '960px 290px' }}>
        <VariantCard name="Concept embedding models (Espinosa Zarlenga et al., NeurIPS 2022)" rows={VROWS} o={s11} p={cardP} y0={290} />
      </div>
      <Rich x={960} y={912} ax="center" size={28} color={C.chalk2} text="$j$: one concept   ·   $k$: number of concepts   ·   $m$: numbers in each embedding" o={oo(s11, legO)} />

      <ArchMap on={['c']} o={inv(0, 0.5, t)} />
    </Stage>
  );
};
