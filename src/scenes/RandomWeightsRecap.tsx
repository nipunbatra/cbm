// Recap 7-9: the random-layer control, with words before the small arithmetic example.
import React from 'react';
import { C } from '../kit/theme';
import { HText, Rich, Svg, Txt, bs, bw, inv, type SceneProps } from '../kit/core';
import { Block, Credit, CREDIT, EvTag, Flow, PhotoR } from '../kit/cbm';
import { D } from '../kit/data';

const toy = D.random_layer_toy;
const num = (v: number) => String(v).replace('-', '−');
const vector = (v: number[]) => `[${v.map(num).join(', ')}]`;
const Slide: React.FC<{o: number; children: React.ReactNode}> = ({o,children}) =>
  o <= .001 ? null : <div style={{position:'absolute',inset:0,opacity:o}}>{children}</div>;

export const RandomWeightsRecap: React.FC<SceneProps> = ({t,P}) => {
  const b=(k:number)=>bs(P,k), cue=(k:number,word:string)=>inv(bw(P,k,word)-.1,bw(P,k,word)+.4,t);
  const show=(k:number)=>inv(b(k)-.05,b(k)+.25,t)*(1-inv(b(k+1)-.35,b(k+1)-.05,t));
  const input=cue(7,'pretrained'), mix=cue(7,'randomly'), head=cue(7,'train'), finding=cue(7,'reported');
  const arithmetic=cue(8,'Multiply'), features=cue(8,'encoder'), weights=cue(8,'Suppose');
  const frozen=cue(9,'encoder'), learning=cue(9,'Only'), examples=cue(9,'Photo'), takeaway=cue(9,'Check');
  return <>
    <Slide o={show(7)}>
      <HText x={130} y={300} size={29} color={C.chalk2}>Control experiment: keep image knowledge, remove concept learning.</HText>
      <PhotoR R={{x:130,y:390,w:210,h:210}} src="gull.jpg" o={input} />
      <Credit x={130} y={650} text={CREDIT['gull.jpg']} o={input} />
      <Svg>
        <Txt x={235} y={350} size={28} fill={C.input} o={input}>input photo</Txt>
        <Flow pts={[[345,495],[398,495]]} color={C.input} o={input} />
        <Block x={535} y={495} w={270} h={120} kind="input" title="image encoder" sub="pretrained, fixed" size={29} subSize={21} o={input} />
        <Flow pts={[[672,495],[758,495]]} color={C.input} o={mix} />
        <Txt x={715} y={407} size={24} fill={C.input} o={mix}>features</Txt>
        <Block x={910} y={495} w={300} h={120} kind="neutral" title="mixing layer" sub="random weights, fixed" size={30} subSize={21} o={mix} />
        <Flow pts={[[1062,495],[1148,495]]} color={C.mute} o={head} />
        <Txt x={1105} y={407} size={24} fill={C.chalk2} o={head}>values</Txt>
        <Block x={1270} y={495} w={240} h={120} kind="head" title="class head" sub="trained" size={30} subSize={22} o={head} />
        <Txt x={1270} y={330} size={27} fill={C.loss} o={head}>fit using class labels</Txt>
        <Flow pts={[[1270,355],[1270,429]]} color={C.loss} o={head} />
        <Flow pts={[[1392,495],[1498,495]]} color={C.chalk} o={head} />
        <Block x={1630} y={495} w={260} h={120} kind="output" title="bird species" sub="predicted class" size={30} subSize={21} o={head} />
      </Svg>
      <Rich x={910} y={585} ax="center" w={430} align="center" size={27} color={C.chalk2} text="Never taught to detect {c:yellow bill}." o={mix} />
      <Rich x={960} y={750} ax="center" size={34} text="With enough mixed features, the head can still {y:classify well}." o={finding} />
      <HText x={960} y={825} ax="center" size={31} color={C.chalk2} o={cue(7,'means')}>Class accuracy does not establish what each intermediate value means.</HText>
      <Rich x={960} y={925} ax="center" size={31} text="{e:Random}: how the weights are chosen.  {e:Fixed}: whether training changes them." o={cue(7,'describes')} />
      <EvTag x={1760} y={1000} ax="right" kind="reported" text="Srivastava et al. 2024, Section 4 / Figure 3; bird pipeline schematic" o={finding} />
    </Slide>

    <Slide o={show(8)}>
      <HText x={160} y={300} size={30} color={C.chalk2}>Zoom in: the layer mixes features from the image encoder.</HText>
      <Rich x={160} y={365} size={32} text="Draw the {e:weights} once by chance, without learning them from labels." o={cue(8,'Random')} />
      <HText x={300} y={470} ax="center" size={28} color={C.input} o={features}>image features</HText>
      <HText x={575} y={470} ax="center" size={28} color={C.edit} o={weights}>weights</HText>
      <HText x={850} y={470} ax="center" size={28} color={C.chalk2} o={arithmetic}>contributions</HText>
      {toy.features[0].map((value:number,i:number)=><React.Fragment key={i}>
        <HText x={300} y={565+i*140} ax="center" ay="middle" size={58} mono color={C.input} o={features}>{num(value)}</HText>
        <HText x={435} y={565+i*140} ax="center" ay="middle" size={42} color={C.mute} o={weights}>×</HText>
        <HText x={575} y={565+i*140} ax="center" ay="middle" size={58} mono color={C.edit} o={weights}>{num(toy.weights[i])}</HText>
        <HText x={710} y={565+i*140} ax="center" ay="middle" size={42} color={C.mute} o={arithmetic}>=</HText>
        <HText x={850} y={565+i*140} ax="center" ay="middle" size={58} mono o={arithmetic}>{num(toy.terms[0][i])}</HText>
      </React.Fragment>)}
      <Svg o={arithmetic}><Flow pts={[[970,635],[1080,635]]} color={C.chalk2} /></Svg>
      <HText x={1435} y={530} ax="center" size={29} color={C.chalk2} o={arithmetic}>add the contributions</HText>
      <HText x={1435} y={635} ax="center" ay="middle" size={46} mono o={arithmetic}>{`${num(toy.terms[0][0])} − ${num(Math.abs(toy.terms[0][1]))} = ${num(toy.outputs[0])}`}</HText>
      <HText x={1435} y={725} ax="center" size={28} color={C.chalk2} o={arithmetic}>one mixed feature</HText>
      <Rich x={960} y={875} ax="center" size={34} text="Nothing taught this value to mean {c:yellow bill}." o={cue(8,'estimate')} />
      <EvTag x={160} y={1000} kind="illustrative" text="chosen features and possible random weights; arithmetic computed" o={features} />
    </Slide>

    <Slide o={show(9)}>
      <HText x={160} y={300} size={28} color={C.chalk2}>During training of this baseline:</HText>
      {[
        {x:400,title:'image encoder',detail:'keep pretrained weights',colour:C.input,o:frozen},
        {x:960,title:'random mixing layer',detail:'keep the one draw',colour:C.edit,o:frozen},
        {x:1520,title:'class head',detail:'adjust using class labels',colour:C.loss,o:learning},
      ].map(row=><React.Fragment key={row.title}>
        <HText x={row.x} y={375} ax="center" size={32} weight={700} color={row.colour} o={row.o}>{row.title}</HText>
        <HText x={row.x} y={430} ax="center" size={28} color={C.chalk2} o={row.o}>{row.detail}</HText>
      </React.Fragment>)}
      <HText x={160} y={540} size={30} weight={600} o={examples}>The same mixing weights can give different outputs:</HText>
      {['photo','image features','same weights','mixed output'].map((label,i)=><HText key={label} x={[240,650,1110,1590][i]} y={610} ax="center" size={27} color={C.chalk2} o={examples}>{label}</HText>)}
      <Svg o={examples}><line x1={160} y1={655} x2={1760} y2={655} stroke={C.line2} strokeWidth={2} /></Svg>
      {toy.features.map((row:number[],i:number)=><React.Fragment key={i}>
        <HText x={240} y={705+i*100} ax="center" ay="middle" size={34} o={examples}>{i===0?'A':'B'}</HText>
        <HText x={650} y={705+i*100} ax="center" ay="middle" size={38} mono color={C.input} o={examples}>{vector(row)}</HText>
        <HText x={1110} y={705+i*100} ax="center" ay="middle" size={38} mono color={C.edit} o={examples}>{vector(toy.weights)}</HText>
        <HText x={1590} y={705+i*100} ax="center" ay="middle" size={38} mono o={examples}>{num(toy.outputs[i])}</HText>
      </React.Fragment>)}
      <Rich x={960} y={910} ax="center" size={32} weight={600} text="Check the {c:concept meaning} as well as the {y:class accuracy}." o={takeaway} />
      <HText x={960} y={970} ax="center" size={27} color={C.chalk2} o={takeaway}>At test time, the trained class head stays fixed too.</HText>
      <EvTag x={160} y={1020} kind="illustrative" text="same toy weights and two chosen feature vectors" o={examples} />
    </Slide>
  </>;
};
