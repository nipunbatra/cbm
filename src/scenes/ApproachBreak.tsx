// Rung two is a family of design choices, not a sequence of papers to memorise.
import React from 'react';
import { C } from '../kit/theme';
import { HText, Rich, Stage, Svg, Txt, bh, inv, bw, type SceneProps } from '../kit/core';
import { Block, EvTag, Flow } from '../kit/cbm';

const GROUPS = [
  {letter:'A', title:'Use CLIP scores directly', methods:'PCBM phrase route · LaBo', source:'CLIP similarities'},
  {letter:'B', title:'Learn a concept predictor', methods:'Label-Free CBM', source:'CLIP score targets'},
  {letter:'C', title:'Ground the concept targets', methods:'Vision-Language-Guided CBM', source:'detected image regions'},
];

export const ApproachBreak: React.FC<SceneProps> = ({t,P}) => {
  const o=inv(0,.35,t), map=P.id==='s40', active={s47:0,s48:1,s49:2}[P.id];
  const g=GROUPS[active??0], direct=active===0;
  const cue=(word:string)=>inv(bw(P,1,word)-.1,bw(P,1,word)+.3,t);
  return <Stage>
    <HText x={128} y={135} size={30} mono weight={600} color={C.concept} o={o}>PART 10 · RUNG TWO{map?'':` · ${g.letter}`}</HText>
    <Rich x={128} y={235} w={1660} size={map?61:72} weight={700} text={bh(P,1)} o={o} />
    {map ? <>
      <HText x={128} y={350} size={31} color={C.chalk2} o={o}>All three: class labels train the head; no human concept labels on each task image.</HText>
      {GROUPS.map((row,i)=><React.Fragment key={row.letter}>
        <HText x={140} y={495+i*145} size={46} weight={700} color={C.concept} o={o}>{row.letter}</HText>
        <HText x={230} y={488+i*145} size={36} weight={650} o={o}>{row.title}</HText>
        <HText x={230} y={540+i*145} size={27} color={C.chalk2} o={o}>{row.methods}</HText>
        <HText x={1260} y={510+i*145} size={30} color={C.concept} o={o}>{row.source}</HText>
      </React.Fragment>)}
      <HText x={128} y={970} size={31} color={C.chalk2} o={o}>Remember the source of the concept values, then the prediction path.</HText>
    </> : <>
      <HText x={128} y={360} size={31} color={C.chalk2} o={o}>{g.methods}</HText>
      {!direct && <Svg o={o*cue('training')}>
        <Block x={1010} y={490} w={480} h={100} title={active===1?'CLIP concept scores':'detector concept targets'} sub="training supervision" kind="loss" size={29} subSize={23} />
        <Flow pts={[[1010,550],[1010,615]]} color={C.loss} dash="8 6" />
      </Svg>}
      <HText x={128} y={590} size={25} mono color={C.chalk2} o={o}>PREDICTION PATH</HText>
      <Svg o={o}>
        <Block x={230} y={695} w={200} h={120} title={direct?'image + phrases':'image'} kind="input" size={direct?24:30} />
        <Flow pts={[[345,695],[420,695]]} color={C.input} />
        <Block x={610} y={695} w={350} h={120} title={direct?'frozen CLIP':'image encoder'} sub={direct?'image and text':active===1?'frozen backbone':'pretrained backbone'} kind="input" size={30} subSize={23} />
        <Flow pts={[[800,695],[850,695]]} color={C.concept} />
        <Block x={1010} y={695} w={290} h={120} title={direct?'cosine scores':'concept layer'} sub={direct?'one per phrase':'learned'} kind="concept" size={29} subSize={23} />
        <Flow pts={[[1170,695],[1240,695]]} color={C.concept} />
        <Block x={1380} y={695} w={250} h={120} title="class head" sub="learned" kind="head" size={30} subSize={23} />
        <Flow pts={[[1520,695],[1640,695]]} color={C.chalk} />
        <Txt x={1680} y={695} size={32}>class</Txt>
      </Svg>
      <Rich x={128} y={860} w={1640} size={33} text={direct?'Fit the {f:class head} using {y:class labels}; keep CLIP fixed.':`Train the {c:concept layer} from ${active===1?'{x:CLIP scores}':'{c:detected regions}'}; train the {f:head} from {y:class labels}.`} o={o} />
      <HText x={128} y={930} size={29} color={C.chalk2} o={o}>{direct?'Next: a basic phrase bank, then selecting descriptions.':active===1?'At test time, the CLIP teacher is no longer needed.':'The detector supplies targets during training.'}</HText>
      <EvTag x={128} y={1010} kind="schematic" text="shared task: predict the class through named concepts" o={o} />
    </>}
  </Stage>;
};
