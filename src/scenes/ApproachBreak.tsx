// One rung-two example: frozen CLIP concept scores and a learned class head.
import React from 'react';
import { C } from '../kit/theme';
import { HText, Rich, Stage, Svg, Txt, bh, inv, type SceneProps } from '../kit/core';
import { Block, EvTag, Flow } from '../kit/cbm';

export const ApproachBreak: React.FC<SceneProps> = ({t,P}) => {
  const o=inv(0,.35,t);
  return <Stage>
    <HText x={128} y={135} size={30} mono weight={600} color={C.concept} o={o}>PART 10 · RUNG TWO</HText>
    <Rich x={128} y={235} w={1660} size={72} weight={700} text={bh(P,1)} o={o} />
    <HText x={128} y={360} size={31} color={C.chalk2} o={o}>Post-hoc concept bottleneck: the CLIP phrase example</HText>
    <HText x={128} y={590} size={25} mono color={C.chalk2} o={o}>PREDICTION PATH</HText>
    <Svg o={o}>
      <Block x={230} y={695} w={200} h={120} title="image + phrases" kind="input" size={24} />
      <Flow pts={[[345,695],[420,695]]} color={C.input} />
      <Block x={610} y={695} w={350} h={120} title="frozen CLIP" sub="image and text" kind="input" size={30} subSize={23} />
      <Flow pts={[[800,695],[850,695]]} color={C.concept} />
      <Block x={1010} y={695} w={290} h={120} title="cosine scores" sub="one per phrase" kind="concept" size={29} subSize={23} />
      <Flow pts={[[1170,695],[1240,695]]} color={C.concept} />
      <Block x={1380} y={695} w={250} h={120} title="class head" sub="learned" kind="head" size={30} subSize={23} />
      <Flow pts={[[1520,695],[1640,695]]} color={C.chalk} />
      <Txt x={1680} y={695} size={32}>class</Txt>
    </Svg>
    <Rich x={128} y={860} w={1640} size={33} text="Fit the {f:class head} using {y:class labels}; keep CLIP fixed." o={o} />
    <HText x={128} y={930} size={29} color={C.chalk2} o={o}>Next: follow the phrase bank, image scores and class prediction.</HText>
    <EvTag x={128} y={1005} kind="schematic" text="predict the class through named concepts" o={o} />
  </Stage>;
};
