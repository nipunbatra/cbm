// Part 9: one high-level caution. The detailed distributions, probes and remedies
// have been removed from the review lecture; the saved film is rebuilt after review.
import React from 'react';
import { C } from '../kit/theme';
import { Header, Rich, SlideHead, Stage, Svg, Txt, bs, bw, bh, inv, type SceneProps } from '../kit/core';
import { ArchMap, Block, EvTag, Flow, rgba } from '../kit/cbm';

export const S09: React.FC<SceneProps> = ({ t, P }) => {
  const at = (word: string) => inv(bw(P, 1, word) - 0.05, bw(P, 1, word) + 0.35, t);
  const enter = inv(bs(P, 1) - 0.05, bs(P, 1) + 0.3, t);
  const named = at('stripes'), extra = at('extra'), head = at('task'), used = at('uses');
  const takeaway = at('practical');
  return <Stage>
    <Svg o={enter}>
      {/* Both kinds of information are carried by the same concept score. */}
      <g opacity={named}>
        <rect x={220} y={375} width={660} height={300} rx={20} fill={rgba(C.concept, 0.06)} stroke={C.concept} strokeWidth={3} />
        <Txt x={550} y={320} size={32} fill={C.concept} weight={600}>concept score</Txt>
        <Txt x={550} y={455} size={36} fill={C.concept} weight={600}>stripes present</Txt>
      </g>
      <g opacity={extra}>
        <rect x={265} y={520} width={570} height={108} rx={12} fill={rgba(C.leak, 0.12)} stroke={C.leak} strokeWidth={2} strokeDasharray="9 7" />
        <Txt x={550} y={574} size={32} fill={C.leak}>extra species information</Txt>
      </g>
      <Flow pts={[[900, 525], [1080, 525]]} color={C.concept} p={head} t={t} live={head} head={14} />
      {/* Purple travels along the concept connection, not around the bottleneck. */}
      <Flow pts={[[900, 525], [1080, 525]]} color={C.leak} p={used} sw={2} t={t} live={used} head={8} dotR={4} />
      <Block x={1260} y={525} w={310} h={170} kind="head" title="task head" size={36} o={head} />
      <Flow pts={[[1435, 525], [1570, 525]]} color={C.chalk} p={used} head={14} />
      <Txt x={1680} y={525} size={32} weight={600} o={used}>prediction</Txt>
    </Svg>
    <Rich x={1260} y={680} ax="center" size={30} text="may use the {k:extra information}" o={used} />
    <Rich x={960} y={805} ax="center" size={36} text="Test whether {e:correcting a concept} has the intended effect" o={takeaway} />
    <EvTag x={220} y={915} kind="schematic" text="possible information inside a score, not a measured model output" o={enter} />
    <SlideHead text={bh(P, 1)} o={enter} />
    <Header t={t} part={9} title={P.title} />
    <ArchMap on={['c', 'f']} o={enter} />
  </Stage>;
};
