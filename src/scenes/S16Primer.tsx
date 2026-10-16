// Expanded PCBM primer. Current narration beat IDs; all numeric examples live in data.json.
import React from 'react';
import { C } from '../kit/theme';
import { HText, Rich, SlideHead, Svg, Txt, bs, be, bw, bh, inv, type SceneProps } from '../kit/core';
import { Block, Credit, EvTag, Flow, PhotoR, ShareBars, rgba } from '../kit/cbm';
import { D } from '../kit/data';

const WK = D.worked, PC = WK.pcbm, TOY = D.pcbm_toy;
const NX = PC.bank.length;
const X = (v: number) => 570 + v * 120;
const Y = (v: number) => 840 - v * 120;
const fmt = (v: number) => String(v).replace('-', '−');
const feature = (v: number[]) => `(${v.map(fmt).join(', ')})`;
const stripes = WK.train.find((f: string) => f.startsWith('zebra'));
const plain = WK.train.find((f: string) => f.startsWith('giraffe'));
const crop = (f: string, ratio: number): [number, number, number, number] => {
  const [w, h] = WK.photo_size[f]; const a = h / w;
  if (a > ratio) { const q = ratio / a; return [0, (1-q)/2, 1, (1+q)/2]; }
  const q = a / ratio; return [(1-q)/2, 0, (1+q)/2, 1];
};
const credit = (f: string) => `Photo: ${WK.photo_credit[f].artist}, Wikimedia Commons, ${WK.photo_credit[f].license}`;

const Plane: React.FC<{ boundary?: number; direction?: number; points?: number; children?: React.ReactNode }> = ({ boundary = 0, direction = 0, points = 1, children }) => <>
  <Flow pts={[[190,840],[960,840]]} color={C.line2} />
  <Flow pts={[[210,860],[210,330]]} color={C.line2} />
  <Txt x={580} y={900} size={26} fill={C.input}>feature 1</Txt>
  <Txt x={210} y={300} size={26} fill={C.input}>feature 2</Txt>
  <g opacity={points}>
    {TOY.positive.map(([x,y]: number[],i: number) => <circle key={`p${i}`} cx={X(x)} cy={Y(y)} r={15} fill={C.concept} />)}
    {TOY.negative.map(([x,y]: number[],i: number) => <circle key={`n${i}`} cx={X(x)} cy={Y(y)} r={15} fill={C.bg} stroke={C.chalk2} strokeWidth={3} />)}
  </g>
  <line x1={X(TOY.boundary)} y1={350} x2={X(TOY.boundary)} y2={850} stroke={C.chalk2} strokeWidth={3} strokeDasharray="8 8" opacity={boundary} />
  <Txt x={X(TOY.boundary)} y={318} size={26} o={boundary}>boundary</Txt>
  <Flow pts={[[X(0),Y(2)],[X(1.3),Y(2)]]} color={C.concept} o={direction} sw={6} />
  <Txt x={X(.65)} y={Y(2)-45} size={30} weight={700} fill={C.concept} o={direction}>CAV</Txt>
  {children}
</>;

export const S16Primer: React.FC<SceneProps> = ({t,P}) => {
  // This primer's original beat IDs shift after the expanded scaling example.
  const current = (k: number) => k >= 13 ? k + 2 : k;
  const so = (original: number) => {
    const k = current(original);
    const z = Math.min(be(P,k)+.02, bs(P,k+1)-.34);
    return inv(bs(P,k)-.05, bs(P,k)+.25,t) * (1-inv(z,z+.3,t));
  };
  const cue = (k: number, word: string) => inv(bw(P,current(k),word)-.1,bw(P,current(k),word)+.3,t);
  const s5=so(5),s6=so(6),s7=so(7),s8=so(8),s9=so(9),s11=so(11),s15=so(15),s18=so(18);
  const c5=cue(5,'Pass'), c7=cue(7,'Across'), c8=cue(8,'second'), c9=cue(9,'Both');
  const c11=cue(11,'Repeat'), c15=cue(15,'Compare'), c18=cue(18,'softmax');
  const a=TOY.new_features[0], v=TOY.direction;
  return <>
    {[5,6,7,8,9,11,15,18].map(k=><SlideHead key={k} text={bh(P,current(k))} o={so(k)} />)}

    <PhotoR R={{x:190,y:350,w:300,h:200}} src={`worked/${stripes}`} frac={crop(stripes,2/3)} o={s5} />
    <PhotoR R={{x:190,y:650,w:300,h:200}} src={`worked/${plain}`} frac={crop(plain,2/3)} o={s5} />
    <Svg o={s5}>
      <Flow pts={[[510,450],[690,580],[790,580]]} color={C.input} o={c5} />
      <Flow pts={[[510,750],[690,580]]} color={C.input} o={c5} head={0} />
      <Block x={940} y={580} w={290} h={130} title="image encoder" sub="frozen" kind="input" o={c5} />
      <Flow pts={[[1100,580],[1250,580]]} color={C.input} o={c5} />
      <Block x={1480} y={580} w={440} h={130} title="feature vectors" sub="retain concept labels" size={32} subSize={24} kind="concept" o={c5} />
    </Svg>
    <Rich x={190} y={562} text="{c:stripes present}" size={30} o={s5} />
    <HText x={190} y={862} size={30} o={s5}>stripes absent</HText>
    <Rich x={710} y={740} w={1010} size={32} text="Labels describe {c:the concept}, not the animal class." o={s5*cue(5,'labels')} />
    <HText x={710} y={800} w={980} size={28} color={C.chalk2} o={s5*cue(5,'separate')}>These examples can come from a separate dataset.</HText>
    <Credit x={190} y={950} text={`${credit(stripes)}; ${credit(plain)}`} o={s5} />

    <Svg o={s6}><Plane /></Svg>
    <Rich x={1100} y={380} w={650} text="One point = one {x:image}." size={38} o={s6} />
    <Rich x={1100} y={495} w={650} text="{c:Filled points}: stripes present" size={32} o={s6*cue(6,'striped')} />
    <HText x={1100} y={555} w={650} size={32} o={s6*cue(6,'unstriped')}>Hollow points: stripes absent</HText>
    <HText x={1100} y={685} w={620} size={30} color={C.chalk2} o={s6*cue(6,'colours')}>People supply these concept labels.</HText>
    <Rich x={1100} y={790} w={650} text="The {x:encoder} stays fixed." size={30} o={s6*cue(6,'moved')} />
    <EvTag x={210} y={960} kind="constructed" text="two chosen features; not a plot of CLIP outputs" o={s6} />

    <Svg o={s7}><Plane boundary={cue(7,'boundary')} direction={c7} /></Svg>
    <HText x={1090} y={385} w={650} size={34} o={s7}>Fit a line between the two labelled groups.</HText>
    <Rich x={1090} y={545} w={650} size={34} text="The arrow points towards {c:striped examples}." o={s7*c7} />
    <Rich x={1090} y={700} w={650} size={34} text="{c:Concept activation vector} (CAV)" o={s7*cue(7,'activation')} />
    <HText x={1090} y={815} w={650} size={28} color={C.chalk2} o={s7*cue(7,'Keep')}>Save this direction for new images.</HText>
    <EvTag x={210} y={960} kind="constructed" text="chosen features; separating line calculated" o={s7} />

    <Svg o={s8}>
      <Plane boundary={1} points={.22}>
        <g opacity={cue(8,'unit')}>
          {/* Translate the unit direction to the boundary at the new images' height. */}
          <circle cx={X(TOY.boundary)} cy={Y(a[1])} r={6} fill={C.concept} />
          <Flow pts={[[X(TOY.boundary),Y(a[1])],[X(TOY.boundary+v[0]),Y(a[1]+v[1])]]}
            color={C.concept} sw={6} head={16} />
          <Txt x={X(TOY.boundary+v[0]/2)} y={Y(a[1])+52} size={28} weight={700} fill={C.concept}>unit CAV</Txt>
        </g>
        {TOY.new_features.map(([x,y]: number[],i: number) => <g key={i} opacity={i ? c8 : 1}>
          <line x1={X(x)} y1={Y(y)} x2={X(x)} y2={840} stroke={C.input} strokeWidth={3} strokeDasharray="7 7" />
          <circle cx={X(x)} cy={Y(y)} r={17} fill={C.input} stroke={C.chalk} strokeWidth={3} />
          <Txt x={X(x)} y={Y(y)-40} size={28} fill={C.input}>{feature([x,y])}</Txt>
          <Txt x={X(x)} y={870} size={28} fill={C.concept}>{fmt(TOY.scores[i])}</Txt>
        </g>)}
        <Txt x={X(0)} y={870} size={24} fill={C.chalk2}>{fmt(TOY.boundary)}</Txt>
      </Plane>
    </Svg>
    <Rich x={1080} y={370} text={`unit {c:CAV} = {c:${feature(v)}}`} size={36} o={s8*cue(8,'unit')} />
    <HText x={1080} y={425} size={27} color={C.chalk2} o={s8*cue(8,'unit')}>{`length ${fmt(Math.hypot(...v))}: one step right, no step up`}</HText>
    <HText x={1080} y={470} w={640} size={32} o={s8*cue(8,'horizontal')}>Here, only the horizontal feature counts.</HText>
    <Rich x={1080} y={590} text={`{x:${fmt(a[0])}} × {c:${v[0]}} + {x:${a[1]}} × {c:${v[1]}} = {c:${fmt(TOY.scores[0])}}`} size={38} o={s8*cue(8,'gives')} />
    <Rich x={1080} y={720} w={640} text="Higher score = further towards {c:striped}." size={32} o={s8*cue(8,'higher')} />
    <HText x={1080} y={825} w={650} size={28} color={C.chalk2} o={s8*cue(8,'probabilities')}>A concept score is not a probability.</HText>
    <EvTag x={210} y={960} kind="constructed" text="chosen features and unit CAV; dot products calculated" o={s8} />

    <Rich x={190} y={330} text="Alternative to labelled concept examples" size={32} o={s9} />
    <Svg o={s9}>
      <Block x={440} y={525} w={500} h={130} title='“black and white stripes”' size={32} kind="concept" />
      <Flow pts={[[710,525],[840,525]]} color={C.concept} o={cue(9,'text')} />
      <Block x={1000} y={525} w={300} h={130} title="CLIP text encoder" sub="pretrained, frozen" size={28} kind="head" o={cue(9,'text')} />
      <Flow pts={[[1170,525],[1320,525]]} color={C.concept} o={cue(9,'vector')} />
      <Block x={1510} y={525} w={360} h={130} title="concept direction" sub="save in the bank" kind="concept" o={cue(9,'vector')} />
    </Svg>
    <Rich x={960} y={710} ax="center" w={1500} size={36} text="Text and image vectors share the same {x:CLIP feature space}." o={s9*cue(9,'same')} />
    <HText x={960} y={815} ax="center" size={32} weight={700} o={s9*c9}>Our animal example uses this route. Both encoders stay frozen.</HText>
    <EvTag x={190} y={950} kind="schematic" text="CLIP text route; no concept classifier is fitted" o={s9} />

    <PhotoR R={{x:180,y:350,w:310,h:210}} src={`worked/${WK.example}`} frac={crop(WK.example,210/310)} o={s11} />
    <Svg o={s11}>
      <Flow pts={[[500,455],[585,455]]} color={C.input} />
      <Block x={735} y={455} w={280} h={130} title="image encoder" sub="512 features" kind="input" />
      <Flow pts={[[735,535],[735,640]]} color={C.input} />
      <Block x={735} y={710} w={400} h={130} title="compare with each" sub="saved phrase vector" kind="concept" />
      <Flow pts={[[950,710],[1030,710],[1030,530],[1100,530]]} color={C.concept} o={c11} />
      {PC.bank.map((name: string,i: number)=><g key={name} opacity={c11}>
        <Txt x={1130} y={360+i*62} anchor="start" size={28} fill={i===0?C.concept:C.chalk2}>{name.replace(/^an? /,'')}</Txt>
        <Txt x={1730} y={360+i*62} anchor="end" size={28} mono fill={i===0?C.concept:C.chalk2}>{PC.scores_raw_example[i].toFixed(3)}</Txt>
      </g>)}
    </Svg>
    <Rich x={1130} y={835} w={610} text={`{c:${NX} named scores}; not probabilities`} size={30} o={s11*cue(11,'probabilities')} />
    <HText x={180} y={835} w={810} size={28} color={C.chalk2} o={s11*cue(11,'length')}>Unit-length vectors: dot product = cosine similarity</HText>
    <Credit x={180} y={915} text={credit(WK.example)} o={s11} />
    <EvTag x={180} y={950} kind="computed" text="frozen CLIP ViT-B/32; saved phrase vectors" o={s11} />

    <Svg o={s15}>
      <Block x={330} y={475} w={300} h={130} title="training photos" sub="animal images" kind="input" />
      <Flow pts={[[495,475],[605,475]]} color={C.input} />
      <Block x={825} y={475} w={420} h={130} title="encoder, bank, scale" sub="all fixed" kind="concept" />
      <Flow pts={[[1050,475],[1240,475]]} color={C.concept} />
      <Txt x={1145} y={420} size={27} fill={C.concept}>{NX} scores</Txt>
      <Block x={1390} y={475} w={280} h={130} title="linear head" sub="train this" kind="head" />
      <Flow pts={[[1545,475],[1690,475],[1690,720],[1530,720]]} color={C.chalk2} o={c15} />
      <Block x={1390} y={720} w={280} h={110} title="class loss" kind="loss" o={c15} />
      <Block x={825} y={720} w={420} h={110} title="true class label" sub="e.g. zebra" kind="output" o={c15} />
      <Flow pts={[[1050,720],[1235,720]]} color={C.chalk} o={c15} />
      <Flow pts={[[1390,650],[1390,555]]} color={C.loss} o={cue(15,'update')} />
      <Txt x={1475} y={605} size={25} anchor="start" fill={C.loss} o={cue(15,'update')}>update</Txt>
    </Svg>
    <HText x={330} y={580} ax="center" size={28} color={C.chalk2} o={s15}>{WK.n_train} class-labelled photos</HText>
    <Rich x={960} y={870} ax="center" w={1550} size={34} text="Class labels teach the {f:head} which {c:concepts} predict each animal." o={s15*cue(15,'learns')} />
    <EvTag x={180} y={965} kind="schematic" text="animal example: CLIP phrase bank, then a sparse task head" o={s15} />

    <PhotoR R={{x:175,y:400,w:250,h:170}} src={`worked/${WK.example}`} frac={crop(WK.example,170/250)} o={s18} />
    <Svg o={s18}>
      <Flow pts={[[445,485],[525,485]]} color={C.input} />
      <Block x={650} y={485} w={230} h={130} title="encoder" sub="512 features" kind="input" />
      <Flow pts={[[785,485],[885,485]]} color={C.input} />
      <Block x={1050} y={485} w={310} h={130} title="bank + scale" sub={`${NX} concept scores`} kind="concept" />
      <Flow pts={[[1225,485],[1325,485]]} color={C.concept} />
      <Block x={1470} y={485} w={270} h={130} title="trained head" sub="class scores" kind="head" />
      <Flow pts={[[1470,565],[1470,650]]} color={C.chalk} o={c18} />
      <Txt x={1545} y={605} size={28} anchor="start" o={c18}>softmax</Txt>
      <ShareBars x={1190} y={710} labels={WK.classes} from={PC.probs_example} labelW={150} w={290} rowH={60} size={28} o={c18} />
    </Svg>
    <Rich x={175} y={650} w={860} size={36} text="Input: one {x:image}." o={s18} />
    <HText x={175} y={735} w={860} size={32} o={s18*cue(18,'No')}>No concept labels. No class label.</HText>
    <HText x={175} y={815} w={860} size={32} color={C.chalk2} o={s18*cue(18,'nothing')}>Everything is saved. Nothing is fitted again.</HText>
    <Credit x={175} y={915} text={credit(WK.example)} o={s18} />
    <EvTag x={175} y={950} kind="computed" text="same held-out zebra; fixed encoder, bank, scale and head" o={s18} />
  </>;
};
