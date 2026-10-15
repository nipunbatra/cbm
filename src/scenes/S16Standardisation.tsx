// Multi-image scaling example. Real frozen CLIP scores, with arithmetic in math/data.py.
import React from 'react';
import { C } from '../kit/theme';
import { HText, Rich, SlideHead, Svg, Txt, bs, be, bw, bh, inv, type SceneProps } from '../kit/core';
import { Credit, EvTag, PhotoR } from '../kit/cbm';
import { D } from '../kit/data';

const SC = D.pcbm_scaling, WK = D.worked;
const JS: number[] = SC.shown_concept_indices;
const CX = [820, 1190, 1560], RY = [470, 640, 810];
const signed = (v: number) => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(2)}`;
const credit = SC.photos.map((f: string) => {
  const m = WK.photo_credit[f]; return `${m.artist} (${m.license})`;
}).join('; ');
const photoRect = (f: string, row: number) => {
  const [iw,ih] = WK.photo_size[f], scale = Math.min(210/iw,150/ih);
  const w=iw*scale, h=ih*scale;
  return {x:285-w/2,y:RY[row]-h/2,w,h};
};

export const S16Standardisation: React.FC<SceneProps> = ({t,P}) => {
  const so = (k: number) => {
    const z = Math.min(be(P,k)+.02,bs(P,k+1)-.34);
    return inv(bs(P,k)-.05,bs(P,k)+.25,t)*(1-inv(z,z+.3,t));
  };
  const cue = (k: number,word: string) => inv(bw(P,k,word)-.1,bw(P,k,word)+.3,t);
  const raw=so(12), stats=so(13), after=so(15);
  const showRaw=cue(12,'cell'), showAfter=cue(15,'units');
  return <>
    {[12,13,15].map(k=><SlideHead key={k} text={bh(P,k)} o={so(k)} />)}
    {[{o:raw,k:12,changed:false},{o:after,k:15,changed:true}].map(({o,k,changed})=><React.Fragment key={k}>
      <HText x={180} y={295} size={28} color={C.chalk2} o={o}>Three held-out photos</HText>
      <HText x={1190} y={282} ax="center" size={28} color={C.chalk2} o={o}>
        {changed ? 'raw cosine → standardised score' : 'raw cosine similarity: three prompts from the same bank'}
      </HText>
      {JS.map((j,ci)=><HText key={j} x={CX[ci]} y={340} ax="center" w={330} align="center" size={30} weight={650} color={C.concept} o={o}>“{SC.bank[j]}”</HText>)}
      {SC.photos.map((f: string,i: number)=><PhotoR key={f} R={photoRect(f,i)} src={`worked/${f}`} o={o} />)}
      <Svg o={o}>
        {SC.classes.map((name: string,i: number)=><React.Fragment key={name}>
          <Txt x={425} y={RY[i]} anchor="start" size={30} fill={C.input}>{name}</Txt>
          {JS.map((j,ci)=><g key={j}>
            <line x1={CX[ci]-155} y1={RY[i]+70} x2={CX[ci]+155} y2={RY[i]+70} stroke={C.line2} strokeWidth={1} />
            {changed ? <>
              <Txt x={CX[ci]-88} y={RY[i]} size={30} mono fill={C.mute}>{SC.raw[i][j].toFixed(3)}</Txt>
              <Txt x={CX[ci]} y={RY[i]} size={28} fill={C.chalk2} o={showAfter}>→</Txt>
              <Txt x={CX[ci]+95} y={RY[i]} size={40} mono weight={650} fill={SC.standardised[i][j] > 0 ? C.concept : C.chalk2} o={showAfter}>{signed(SC.standardised[i][j])}</Txt>
            </> : <Txt x={CX[ci]} y={RY[i]} size={52} mono fill={C.chalk} o={showRaw}>{SC.raw[i][j].toFixed(3)}</Txt>}
          </g>)}
        </React.Fragment>)}
      </Svg>
      {changed ? <>
        <Rich x={960} y={910} ax="center" size={28} text="0 = training average   ·   {c:positive = above}   ·   negative = below" o={o*cue(k,'positive')} />
        <HText x={960} y={955} ax="center" size={26} color={C.chalk2} o={o*cue(k,'negative')}>Below average does not mean absent.</HText>
      </> : <Rich x={960} y={915} ax="center" size={30} text="Same {x:encoder}. Same {c:prompts}. One score per image and concept." o={o*showRaw} />}
      <EvTag x={180} y={1000} kind="computed" text={changed ? 'training statistics reused; values rounded for display' : 'frozen CLIP ViT-B/32; cosine scores, not probabilities'} o={o} />
      <Credit x={180} y={1040} text={`Commons photos: ${credit}`} o={o} />
    </React.Fragment>)}

    <Rich x={960} y={305} ax="center" size={34} text={`Score all {x:${SC.train_files.length} training photos} with the same {c:prompts}.`} o={stats} />
    {JS.map((j,ci)=><HText key={j} x={CX[ci]} y={425} ax="center" w={330} align="center" size={30} weight={650} color={C.concept} o={stats}>“{SC.bank[j]}”</HText>)}
    <Svg o={stats}>
      <Txt x={180} y={565} anchor="start" size={34}>training average</Txt>
      <Txt x={180} y={700} anchor="start" size={34}>training spread</Txt>
      {JS.map((j,ci)=><g key={j} opacity={cue(13,'Compute')}>
        <line x1={CX[ci]-155} y1={505} x2={CX[ci]+155} y2={505} stroke={C.concept} strokeWidth={2} />
        <Txt x={CX[ci]} y={565} size={50} mono>{SC.mean[j].toFixed(3)}</Txt>
        <Txt x={CX[ci]} y={700} size={50} mono>{SC.spread[j].toFixed(3)}</Txt>
      </g>)}
    </Svg>
    <HText x={180} y={740} size={25} color={C.chalk2} o={stats}>standard deviation</HText>
    <Rich x={960} y={845} ax="center" size={34} text="Calculate down each {c:prompt column}, across training images." o={stats*cue(13,'column')} />
    <HText x={960} y={915} ax="center" size={30} color={C.chalk2} o={stats*cue(13,'test')}>The three test photos do not set the scale.</HText>
    <EvTag x={180} y={1000} kind="computed" text="saved training split; each prompt has its own mean and spread" o={stats} />
  </>;
};
