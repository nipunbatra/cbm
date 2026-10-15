// Part 4: follow one image through predicted concepts, a task head, scores and softmax.
// Thirteen beats preserve the review PDF's page references. All numbers are from D.zoo.
import React from 'react';
import { C } from '../kit/theme';
import { G, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, bs, be, bw, bh, inv, type SceneProps } from '../kit/core';
import { ArchMap, Block, CREDIT, Credit, EditMark, EvTag, Flow, Matrix, MathSvg, Person, PhotoR, ShareBars, rgba } from '../kit/cbm';
import { TexSteps } from '../kit/slots';
import { D } from '../kit/data';

const Z = D.zoo;
const CLS: string[] = Z.classes, CON: string[] = Z.concepts;
const Wm: number[][] = Z.W;
const c0: number[] = Z.c, c1: number[] = Z.c_new;
const L0: number[] = Z.logits, L1: number[] = Z.logits_new;
const S0: number[] = Z.softmax, S1: number[] = Z.softmax_new;
const FC = '#9AA6B5';
const num = (v: number) => String(Math.round(v * 100) / 100);
const LOWC = 'contrast(0.35) brightness(0.75) saturate(0.6)';
const PHOTOS = ['zebra_plains.jpg', 'horse.jpg', 'giraffe.jpg'];
const FRACS: [number, number, number, number][] = [[0.22, 0.06, 0.94, 0.88], [0.04, 0.14, 0.76, 0.92], [0, 0.12, 1, 0.69]];

/** Label every value so the reader never has to remember the order of an anonymous vector. */
const Values: React.FC<{ x: number; y: number; labels: string[]; values: number[]; color: string; edited?: boolean; o?: number }> =
  ({ x, y, labels, values, color, edited = false, o = 1 }) => (
    <G o={o}>
      {labels.map((name, i) => (
        <g key={name}>
          <Txt x={x} y={y + i * 90} size={30} anchor="start" fill={edited && i === 0 ? C.edit : color}>{name}</Txt>
          <rect x={x + 280} y={y + i * 90 - 31} width={100} height={62} rx={9}
            fill={rgba(edited && i === 0 ? C.edit : color, 0.1)} stroke={edited && i === 0 ? C.edit : color} strokeWidth={2} />
          <Txt x={x + 330} y={y + i * 90} size={34} mono weight={600} fill={edited && i === 0 ? C.edit : color}>{num(values[i])}</Txt>
        </g>
      ))}
    </G>
  );

export const S04: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const at = (start: number) => inv(start - 0.05, start + 0.3, t);
  const a = (k: number, word: string, n = 0) => at(bw(P, k, word, n));
  const S = Array.from({ length: 14 }, (_, k) => {
    if (!k) return 0;
    const enter = inv(b(k) - 0.05, b(k) + 0.25, t);
    if (k === 13) return enter;
    const end = Math.min(be(P, k) + 0.02, b(k + 1) - 0.34);
    return enter * (1 - inv(end, end + 0.3, t));
  });
  const o = (k: number, reveal = 1) => S[k] * reveal;
  const flow = (x1: number, x2: number, y: number, color: string, reveal = 1) =>
    <Flow pts={[[x1, y], [x2, y]]} color={color} p={reveal} t={t} live={reveal} head={12} n={1} />;

  const pipeline = (k: 1 | 13) => {
    const words = k === 1 ? ['image', 'predictor', 'concepts', 'task', 'scores', 'Softmax', 'probabilities'] :
      ['image', 'predictor', 'vector', 'head', 'scores', 'softmax', 'answer'];
    const show = words.map(word => a(k, word));
    const nodes = [
      { x: 180, w: 140, text: ['image'], tex: '\\cin{x}', kind: 'input' as const },
      { x: 425, w: 210, text: ['concept', 'predictor'], tex: '\\gth', kind: 'input' as const },
      { x: 705, w: 230, text: ['predicted', 'concepts'], tex: '\\cvec', kind: 'concept' as const },
      { x: 990, w: 210, text: ['task head'], tex: '\\fph', kind: 'head' as const },
      { x: 1235, w: 150, text: ['class', 'scores'], tex: '\\cout{\\mathbf{s}}', kind: 'output' as const },
      { x: 1460, w: 160, text: ['softmax'], tex: '', kind: 'output' as const },
      { x: 1715, w: 210, text: ['class', 'probabilities'], tex: '\\cout{\\mathbf{p}}', kind: 'output' as const },
    ];
    return <G o={S[k]}>{nodes.map((node, i) => <g key={node.x}>
      {i > 0 ? flow(nodes[i - 1].x + nodes[i - 1].w / 2 + 10, node.x - node.w / 2 - 10, 530, i < 3 ? C.input : i === 3 ? C.concept : C.chalk2, show[i]) : null}
      <Block x={node.x} y={530} w={node.w} h={140} kind={node.kind} o={show[i]} />
      {node.text.map((line, j) => <Txt key={line} x={node.x} y={node.text.length === 1 ? 530 : 508 + j * 44} size={28} weight={600} o={show[i]}>{line}</Txt>)}
      {node.tex ? <MathSvg x={node.x} y={660} tex={node.tex} size={40} o={show[i]} /> : null}
    </g>)}
    {k === 13 ? <>
      <Person x={705} y={345} s={0.7} o={a(13, 'person')} />
      <Flow pts={[[705, 390], [705, 450]]} color={C.edit} p={a(13, 'correct')} head={12} />
      <EditMark x={830} y={488} o={a(13, 'correct')} />
    </> : null}</G>;
  };

  const headPass = (k: 4 | 7 | 10) => {
    const edited = k === 10;
    const values = edited ? c1 : c0, logits = edited ? L1 : L0;
    const headIn = a(k, k === 4 ? 'head' : k === 7 ? 'layer' : 'linear');
    const outIn = a(k, k === 4 ? 'returns' : k === 7 ? 'returns' : 'scores');
    return <G o={S[k]}>
      <Values x={200} y={450} labels={CON} values={values} color={C.concept} edited={edited} />
      <MathSvg x={385} y={345} tex="\cvec" size={44} />
      {flow(620, 795, 540, C.concept, headIn)}
      <Block x={960} y={540} w={290} h={190} kind="head" o={headIn} />
      <Txt x={960} y={505} size={32} weight={600} o={headIn}>{k === 4 ? 'task head' : 'linear layer'}</Txt>
      <MathSvg x={960} y={572} tex="\fph" size={44} o={headIn} />
      {flow(1125, 1290, 540, C.chalk, outIn)}
      {k === 4 ? CLS.map((cl, i) => <Txt key={cl} x={1480} y={450 + i * 90} size={32} o={outIn}>{cl} score</Txt>) :
        <Values x={1320} y={450} labels={CLS} values={logits} color={C.chalk} o={outIn} />}
      <Txt x={385} y={735} size={30} fill={edited ? C.edit : C.concept}>{edited ? 'corrected concepts' : 'predicted concepts'}</Txt>
      <Txt x={1510} y={735} size={30} o={outIn}>class scores</Txt>
    </G>;
  };

  const probabilityPass = (k: 8 | 11) => {
    const scores = k === 8 ? L0 : L1, probs = k === 8 ? S0 : S1;
    return <G o={S[k]}>
      <Values x={180} y={430} labels={CLS} values={scores} color={C.chalk} />
      {flow(610, 735, 520, C.chalk2, a(k, 'softmax'))}
      <Block x={850} y={520} w={200} h={120} kind="output" title="softmax" o={a(k, 'softmax')} />
      {flow(965, 1090, 520, C.chalk2, a(k, 'softmax'))}
      <ShareBars x={1110} y={430} labels={CLS} from={probs} rowH={90} labelW={150} w={370} size={30} o={a(k, k === 8 ? 'probabilities' : 'probability')} />
      <Txt x={370} y={700} size={30}>class scores</Txt>
      <Txt x={1400} y={700} size={30} o={a(k, k === 8 ? 'probabilities' : 'probability')}>class probabilities</Txt>
    </G>;
  };

  const calcWords = ['Stripes', 'Horse-like', 'Long'];
  const calcX = [720, 1040, 1360];
  const tag = Math.max(...S.slice(2, 13));
  return <Stage>
    {PHOTOS.map((src, i) => <PhotoR key={src} R={{ x: 650 + i * 370, y: 350, w: 280, h: 220 }} src={src} frac={FRACS[i]} o={o(2, a(2, CLS[i]))} />)}
    <PhotoR R={{ x: 170, y: 405, w: 390, h: 300 }} src="zebra_plains.jpg" frac={FRACS[0]} filter={LOWC} o={S[3]} />
    <PhotoR R={{ x: 220, y: 400, w: 400, h: 310 }} src="zebra_plains.jpg" frac={FRACS[0]} filter={LOWC} o={S[9]} />
    <Svg>
      {pipeline(1)}
      <G o={S[2]}>
        <Txt x={170} y={460} size={34} anchor="start">classes</Txt>
        <Txt x={170} y={720} size={34} anchor="start" fill={C.concept}>concepts</Txt>
        {CLS.map((cl, i) => <Txt key={cl} x={790 + i * 370} y={610} size={36} weight={600} o={a(2, cl)}>{cl}</Txt>)}
        {CON.map((con, i) => <Block key={con} x={790 + i * 370} y={720} w={320} h={76} title={con} kind="concept" size={28} o={a(2, ['stripes', 'horse-like', 'long'][i])} />)}
      </G>
      <G o={S[3]}>
        {flow(580, 710, 550, C.input, a(3, 'predictor'))}
        <Block x={870} y={550} w={280} h={190} kind="input" o={a(3, 'predictor')} />
        <Txt x={870} y={510} size={30} o={a(3, 'predictor')}>concept predictor</Txt>
        <MathSvg x={870} y={578} tex="\gth" size={44} o={a(3, 'theta')} />
        {flow(1030, 1150, 550, C.concept, a(3, 'predicts'))}
        <Values x={1180} y={450} labels={CON} values={c0} color={C.concept} o={a(3, 'predicts')} />
        <MathSvg x={1370} y={350} tex="\cvec" size={46} o={a(3, 'hat')} />
        <Txt x={365} y={755} size={28} fill={C.input}>input image</Txt>
      </G>
      {headPass(4)}
      <G o={S[5]}>
        <Values x={190} y={445} labels={CON} values={c0} color={C.concept} />
        <Txt x={380} y={350} size={30} fill={C.concept}>values for this image</Txt>
        <MathSvg x={380} y={755} tex="\cvec" size={44} />
        <line x1={720} x2={720} y1={330} y2={800} stroke={C.line2} strokeWidth={2} />
        <Matrix x={1070} y={445} vals={Wm} rows={CLS} cols={CON} cw={215} ch={90} size={36} headSize={26}
          valColor={() => FC} colColors={CON.map(() => C.concept)} o={a(5, 'table')} />
        <Txt x={1385} y={335} size={30} fill={FC} o={a(5, 'table')}>weights inside the linear layer</Txt>
        <MathSvg x={1385} y={790} tex="\chead{W}" size={44} o={a(5, 'W')} />
      </G>
      <G o={S[6]}>
        <Txt x={430} y={440} size={30} anchor="end" fill={FC}>zebra weights</Txt>
        <Txt x={430} y={540} size={30} anchor="end" fill={C.concept}>this image's values</Txt>
        <Txt x={430} y={670} size={30} anchor="end">contributions</Txt>
        {CON.map((con, j) => <g key={con}>
          <Txt x={calcX[j]} y={350} size={30} fill={C.concept}>{con}</Txt>
          <Txt x={calcX[j]} y={440} size={42} mono fill={FC}>{num(Wm[0][j])}</Txt>
          <Txt x={calcX[j]} y={490} size={30} fill={C.chalk2} o={a(6, calcWords[j])}>×</Txt>
          <Txt x={calcX[j]} y={540} size={42} mono fill={C.concept}>{num(c0[j])}</Txt>
          <line x1={calcX[j] - 110} x2={calcX[j] + 110} y1={600} y2={600} stroke={C.line2} strokeWidth={2} />
          <Txt x={calcX[j]} y={670} size={44} mono o={a(6, 'which', j)}>{num(Z.terms[0][j])}</Txt>
          {j > 0 ? <Txt x={calcX[j] - 160} y={670} size={36} o={a(6, 'Add')}>+</Txt> : null}
        </g>)}
        <Txt x={1570} y={670} size={36} o={a(6, 'Add')}>=</Txt>
        <Txt x={1690} y={670} size={48} mono weight={700} o={a(6, 'get')}>{num(L0[0])}</Txt>
        <Txt x={1690} y={735} size={26} o={a(6, 'output')}>zebra score</Txt>
      </G>
      {headPass(7)}
      {probabilityPass(8)}
      <G o={S[9]}>
        <Person x={730} y={435} s={1} o={a(9, 'observer')} />
        {flow(810, 990, 520, C.edit, a(9, 'correct'))}
        <Values x={1040} y={430} labels={CON} values={a(9, '1.') > 0.5 ? c1 : c0} color={C.concept} edited={a(9, 'correct') > 0.5} />
        <EditMark x={1440} y={405} o={a(9, 'correct')} />
      </G>
      {headPass(10)}
      {probabilityPass(11)}
      <G o={S[12]}>
        <Txt x={500} y={430} size={32} fill={C.concept}>change in stripes</Txt>
        <MathSvg x={500} y={550} size={54} tex={`\\cedit{${num(c1[0] - c0[0])}}`} o={a(12, '0.9')} />
        <Txt x={800} y={550} size={48} o={a(12, 'weight')}>×</Txt>
        <Txt x={1050} y={430} size={32} fill={FC}>zebra's stripes weight</Txt>
        <MathSvg x={1050} y={550} size={54} tex={`\\chead{${num(Wm[0][0])}}`} o={a(12, '3.')} />
        <Txt x={1320} y={550} size={48} o={a(12, 'increases')}>=</Txt>
        <Txt x={1570} y={430} size={32}>change in zebra score</Txt>
        <Txt x={1570} y={550} size={54} mono o={a(12, '2.7')}>+{num(Z.delta[0])}</Txt>
      </G>
      {pipeline(13)}
    </Svg>
    {S.map((alpha, k) => k > 0 ? <SlideHead key={k} text={bh(P, k)} o={alpha} /> : null)}
    <Rich x={960} y={800} ax="center" size={32} text="{f:task head}: a linear layer or a multilayer perceptron (MLP)" o={o(1, a(1, 'single'))} />
    <Rich x={960} y={860} ax="center" size={30} text="our worked example uses one {f:linear layer}" o={o(1, a(1, 'use'))} />
    {PHOTOS.map((src, i) => <Credit key={src} x={1760} y={815 + i * 23} ax="right" text={CREDIT[src]} o={S[2]} />)}
    <Rich x={1370} y={735} ax="center" size={28} text="assumed outputs for this photo" o={o(3, a(3, 'assumed'))} />
    <Tex x={960} y={835} ax="center" size={44} tex="\cvec = \gth(\cin{x})" o={o(3, a(3, 'Together'))} />
    <Rich x={1370} y={800} ax="center" size={28} text="the hat means {c:predicted}" o={o(3, a(3, 'means'))} />
    <Credit x={170} y={885} text={CREDIT['zebra_plains.jpg']} o={S[3]} />
    <Rich x={960} y={840} ax="center" size={32} text="The {f:task head} reads only the {c:concepts}, not the {x:image}" o={o(4, a(4, 'directly'))} />
    <Rich x={380} y={830} ax="center" size={28} text="{c:change with the image}" o={o(5, a(5, 'fixed'))} />
    <Rich x={1385} y={840} ax="center" size={28} text="{f:fixed during prediction}" o={o(5, a(5, 'fixed'))} />
    <Rich x={1385} y={885} ax="center" size={25} text="this example has no bias" o={o(5)} />
    <TexSteps x={960} y={810} ax="center" t={t} size={44} o={S[6]} parts={[
      ['\\text{zebra score} = ', b(6)],
      ...Wm[0].map((weight, j) => [`${j ? '{}+' : ''}\\chead{${num(weight)}}\\times\\ccon{${num(c0[j])}}`, bw(P, 6, calcWords[j])] as [string, number]),
      [`{}=\\cout{${num(L0[0])}}`, bw(P, 6, 'get')],
    ]} />
    <Rich x={960} y={780} ax="center" size={30} text="scores = layer weights × predicted concept values" o={o(7, a(7, 'shorthand'))} />
    <Tex x={960} y={880} ax="center" size={44} tex="\cout{\mathbf{s}} = \fph(\cvec) = \chead{W}\cvec" o={o(7, a(7, 'shorthand'))} />
    <Tex x={960} y={820} ax="center" size={44} tex="p_k = \frac{e^{s_k}}{\sum_j e^{s_j}}" o={o(8, a(8, 'Exponentiate'))} />
    <Rich x={1400} y={770} ax="center" size={28} text="probabilities sum to one" o={o(8, a(8, 'sum'))} />
    <Tex x={1090} y={800} ax="center" size={48} tex={`\\text{stripes: }\\ccon{${num(c0[0])}} \\to \\cedit{${num(c1[0])}}`} o={o(9, a(9, 'correct'))} />
    <Credit x={220} y={885} text={CREDIT['zebra_plains.jpg']} o={S[9]} />
    <Rich x={960} y={840} ax="center" size={32} text="same {x:image}, same {x:predictor}, same {f:weights}; one {e:corrected concept}" o={o(10, a(10, 'image'))} />
    <Rich x={650} y={810} ax="center" size={34} text={`before: horse ${S0[1].toFixed(2)}`} o={o(11, a(11, 'changes'))} />
    <Rich x={1270} y={810} ax="center" size={34} text={`after: zebra ${S1[0].toFixed(2)}`} o={o(11, a(11, 'changes'))} />
    <Tex x={960} y={770} ax="center" size={50} tex={`\\text{zebra score: }${num(L0[0])} + ${num(Z.delta[0])} = ${num(L1[0])}`} o={o(12, a(12, 'takes'))} />
    <Rich x={960} y={860} ax="center" size={30} text="all other contributions stay the same" o={o(12, a(12, 'other'))} />
    <Rich x={960} y={800} ax="center" size={34} text="{e:correct a concept}, then run the {f:same task head} again" o={o(13, a(13, 'correct'))} />
    <Rich x={960} y={870} ax="center" size={32} text="no retraining" o={o(13, a(13, 'retraining'))} />
    <EvTag x={1760} y={930} ax="right" kind="illustrative" text="hand-chosen concept outputs and weights; arithmetic computed from these values" o={tag} />
    <Header t={t} part={4} title={P.title} />
    <ArchMap on={['x', 'g', 'c', 'f', 'y']} o={inv(0, 0.5, t)} />
  </Stage>;
};
