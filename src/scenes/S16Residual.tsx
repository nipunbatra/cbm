// Two-slide residual explanation. All model values come from the saved worked example.
import React from 'react';
import { C } from '../kit/theme';
import { HText, Rich, SlideHead, Svg, Txt, bs, be, bw, bh, inv, type SceneProps } from '../kit/core';
import { Block, EvTag, Flow } from '../kit/cbm';
import { D } from '../kit/data';

const PC = D.worked.pcbm;

export const S16Residual: React.FC<SceneProps> = ({t,P}) => {
  const so = (k: number) => {
    const z = Math.min(be(P,k)+.02,bs(P,k+1)-.34);
    return inv(bs(P,k)-.05,bs(P,k)+.25,t)*(1-inv(z,z+.3,t));
  };
  const cue = (k: number,word: string) => inv(bw(P,k,word)-.1,bw(P,k,word)+.3,t);
  const first=so(23), second=so(24);
  return <>
    {[23,24].map(k => {
      const o=so(k), editing=k===24, extra=editing ? 1 : cue(k,'residual');
      const edit=editing ? cue(k,'edit') : 0;
      const score=editing ? C.edit : C.concept;
      return <React.Fragment key={k}>
        <SlideHead text={bh(P,k)} o={o} />
        <Svg o={o}>
          <Block x={280} y={430} w={260} h={120} kind="input" title="image features" sub="frozen encoder" size={29} subSize={20} />
          <Flow pts={[[412,430],[518,430]]} color={C.input} />
          <Block x={660} y={430} w={280} h={120} kind="concept" color={editing ? score : undefined} title="concept scores" size={29} />
          <Flow pts={[[802,430],[878,430]]} color={score} />
          <Block x={1000} y={430} w={240} h={120} kind="head" title="concept head" size={28} />
          <Flow pts={[[1122,430],[1318,430]]} color={editing ? C.edit : C.chalk} />
          <Txt x={1220} y={390} size={23} fill={C.chalk2}>class scores</Txt>
          <circle cx={1360} cy={430} r={38} fill={C.bg2} stroke={C.chalk} strokeWidth={2.5} />
          <Txt x={1360} y={429} size={42} weight={650}>+</Txt>
          <Flow pts={[[1400,430],[1538,430]]} color={C.chalk} />
          <Txt x={1470} y={390} size={23} fill={C.chalk2}>softmax</Txt>
          <Block x={1670} y={430} w={260} h={120} kind="output" title="probabilities" size={28} />
          <g opacity={extra}>
            <Flow pts={[[280,492],[280,640],[628,640]]} color={C.leak} sw={4} />
            <Block x={820} y={640} w={380} h={110} kind="leak" title="residual head" sub="reads image features" size={30} subSize={21} />
            <Flow pts={[[1012,640],[1360,640],[1360,472]]} color={C.leak} sw={4} />
            <Txt x={1185} y={605} size={25} fill={C.leak}>{editing ? 'unchanged by the edit' : 'extra class scores'}</Txt>
          </g>
          {editing ? <g opacity={edit}>
            <Txt x={660} y={307} size={29} weight={650} fill={C.edit}>lower the stripes score</Txt>
            <Flow pts={[[660,332],[660,366]]} color={C.edit} sw={3} />
          </g> : null}
        </Svg>
      </React.Fragment>;
    })}

    <HText x={960} y={755} ax="center" size={28} color={C.chalk2} o={first*cue(23,'zebra')}>Worked photo: zebra class score, before softmax</HText>
    <Rich x={960} y={805} ax="center" size={44} text={`{f:${PC.logits_example[0].toFixed(2)}} + {k:${PC.hybrid.residual_logits_example[0].toFixed(2)}} ≈ {y:${PC.hybrid.total_logits_example[0].toFixed(2)}}`} o={first*cue(23,'zebra')} />
    <Rich x={960} y={910} ax="center" size={30} text="Train the {k:extra head} with class labels; keep the concept model fixed." o={first*cue(23,'training')} />
    <EvTag x={180} y={1000} kind="computed" text="saved CLIP animal example; scores rounded for display" o={first*cue(23,'zebra')} />

    <HText x={960} y={750} ax="center" size={29} color={C.chalk2} o={second*cue(24,'After')}>Zebra probability after the same stripes edit</HText>
    <Rich x={570} y={810} ax="center" size={38} text={`concept model: {y:${PC.edit.probs[0].toFixed(2)}}`} o={second*cue(24,'After')} />
    <Rich x={1320} y={810} ax="center" size={38} text={`with {k:residual}: {y:${PC.hybrid.edited_probs[0].toFixed(2)}}`} o={second*cue(24,'After')} />
    <Rich x={960} y={925} ax="center" size={32} text="The prediction can change, but some evidence {k:bypasses the concepts}." o={second*cue(24,'prediction')} />
    <EvTag x={180} y={1000} kind="computed" text="same held-out zebra photo; same edit; residual contribution fixed" o={second*cue(24,'After')} />
  </>;
};
