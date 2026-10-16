// CLIP phrase workflow: propose a vocabulary, review it, then score photos.
import React from 'react';
import { C } from '../kit/theme';
import { HText, Rich, SlideHead, Svg, Txt, bs, be, bw, bh, inv, type SceneProps } from '../kit/core';
import { Block, Credit, EvTag, Flow, PhotoR, ShareBars } from '../kit/cbm';
import { D } from '../kit/data';

const WK = D.worked, PC = WK.pcbm, NX = PC.bank.length;
const crop = (f: string, ratio: number): [number, number, number, number] => {
  const [w, h] = WK.photo_size[f]; const a = h / w;
  if (a > ratio) { const q = ratio / a; return [0, (1-q)/2, 1, (1+q)/2]; }
  const q = a / ratio; return [(1-q)/2, 0, (1+q)/2, 1];
};
const credit = (f: string) => `Photo: ${WK.photo_credit[f].artist}, Wikimedia Commons, ${WK.photo_credit[f].license}`;

export const S16Primer: React.FC<SceneProps> = ({t,P}) => {
  const so = (k: number) => {
    const z = Math.min(be(P,k)+.02, bs(P,k+1)-.34);
    return inv(bs(P,k)-.05, bs(P,k)+.25,t) * (1-inv(z,z+.3,t));
  };
  const cue = (k: number, word: string) => inv(bw(P,k,word)-.1,bw(P,k,word)+.3,t);
  const s1=so(1),s2=so(2),s3=so(3),s4=so(4),s10=so(10),s13=so(13);
  const c4=cue(4,'Repeat'), c10=cue(10,'Compare'), c13=cue(13,'softmax');
  return <>
    {[1,2,3,4,10,13].map(k=><SlideHead key={k} text={bh(P,k)} o={so(k)} />)}
    <HText x={180} y={290} size={27} color={C.chalk2} o={s1}>Post-hoc Concept Bottleneck Model (PCBM): the CLIP phrase route</HText>
    <Rich x={180} y={385} size={34} text={`Animal classes: {x:${WK.classes.join(', ')}}`} o={s1} />
    <Svg o={s1}>
      <Block x={560} y={575} w={760} h={230} kind="input" o={cue(1,'Ask')} />
      <Flow pts={[[965,575],[1100,575]]} color={C.concept} o={cue(1,'suggest')} />
    </Svg>
    <HText x={220} y={485} size={31} weight={650} o={s1*cue(1,'Ask')}>Ask a large language model (LLM)</HText>
    <HText x={220} y={555} w={680} size={30} o={s1*cue(1,'Ask')}>“Suggest visible properties that distinguish these animals. Avoid class names.”</HText>
    {PC.bank.slice(0,3).map((p: string,i: number)=><Rich key={p} x={1160} y={480+i*90} size={36} text={`{c:${p}}`} o={s1*cue(1,'suggest')} />)}
    <HText x={960} y={820} ax="center" size={32} o={s1*cue(1,'vocabulary')}>The LLM proposes words. CLIP will score the photos.</HText>
    <EvTag x={180} y={965} kind="illustrative" text="example prompt and possible suggestions; not a recorded LLM response" o={s1} />

    <Rich x={180} y={315} size={32} text="Keep visible, clear phrases. Remove duplicates and vague wording." o={s2} />
    {PC.bank.map((p: string,i: number)=><Rich key={p} x={i<4?230:1090} y={460+(i%4)*90} size={34} text={`{c:${p}}`} o={s2*cue(2,'eight')} />)}
    <Rich x={960} y={875} ax="center" size={34} text="Every {x:image} is scored against this same {c:list}." o={s2*cue(2,'Every')} />
    <EvTag x={180} y={965} kind="data" text="saved animal experiment: eight hand-chosen phrases, not LLM-generated" o={s2} />

    <PhotoR R={{x:180,y:350,w:310,h:210}} src={`worked/${WK.example}`} frac={crop(WK.example,210/310)} o={s3} />
    <Svg o={s3}>
      <Flow pts={[[510,455],[635,455]]} color={C.input} o={cue(3,'image')} />
      <Block x={825} y={455} w={360} h={120} title="CLIP image encoder" sub="frozen" size={29} kind="input" o={cue(3,'image')} />
      <Flow pts={[[1020,455],[1160,455]]} color={C.input} o={cue(3,'image')} />
      <Block x={1375} y={455} w={400} h={120} title="image vector" size={32} kind="input" o={cue(3,'image')} />
      <Block x={335} y={690} w={390} h={120} title="black and white stripes" size={28} kind="concept" />
      <Flow pts={[[550,690],[635,690]]} color={C.concept} o={cue(3,'text')} />
      <Block x={825} y={690} w={360} h={120} title="CLIP text encoder" sub="frozen" size={29} kind="concept" o={cue(3,'text')} />
      <Flow pts={[[1020,690],[1160,690]]} color={C.concept} o={cue(3,'text')} />
      <Block x={1375} y={690} w={400} h={120} title="phrase vector" size={32} kind="concept" o={cue(3,'text')} />
    </Svg>
    <Rich x={960} y={830} ax="center" size={40} text={`cosine({x:image vector}, {c:phrase vector}) = {c:${PC.scores_raw_example[0].toFixed(3)}}`} o={s3*cue(3,'Compare')} />
    <HText x={960} y={905} ax="center" size={29} color={C.chalk2} o={s3*cue(3,'probability')}>A match score, not a probability of stripes.</HText>
    <Credit x={180} y={960} text={credit(WK.example)} o={s3} />
    <EvTag x={180} y={1000} kind="computed" text="frozen CLIP ViT-B/32; saved photo and exact phrase" o={s3} />

    <PhotoR R={{x:180,y:350,w:310,h:210}} src={`worked/${WK.example}`} frac={crop(WK.example,210/310)} o={s4} />
    <Svg o={s4}>
      <Flow pts={[[500,455],[585,455]]} color={C.input} />
      <Block x={735} y={455} w={280} h={130} title="image encoder" sub="512 features" kind="input" />
      <Flow pts={[[735,535],[735,640]]} color={C.input} />
      <Block x={735} y={710} w={400} h={130} title="cosine similarity" sub="with each phrase" kind="concept" />
      <Flow pts={[[950,710],[1030,710],[1030,530],[1100,530]]} color={C.concept} o={c4} />
      {PC.bank.map((name: string,i: number)=><g key={name} opacity={c4}>
        <Txt x={1130} y={360+i*62} anchor="start" size={28} fill={i===0?C.concept:C.chalk2}>{name.replace(/^an? /,'')}</Txt>
        <Txt x={1730} y={360+i*62} anchor="end" size={28} mono fill={i===0?C.concept:C.chalk2}>{PC.scores_raw_example[i].toFixed(3)}</Txt>
      </g>)}
    </Svg>
    <Rich x={1130} y={835} w={610} text={`{c:${NX} named scores}; not probabilities`} size={30} o={s4*cue(4,'probabilities')} />
    <HText x={180} y={835} w={810} size={28} color={C.chalk2} o={s4*cue(4,'Next')}>Next: standardise scores, then train the class head.</HText>
    <Credit x={180} y={915} text={credit(WK.example)} o={s4} />
    <EvTag x={180} y={950} kind="computed" text="frozen CLIP ViT-B/32; saved phrase vectors" o={s4} />

    <Svg o={s10}>
      <Block x={330} y={475} w={300} h={130} title="training photos" sub="animal images" kind="input" />
      <Flow pts={[[495,475],[605,475]]} color={C.input} />
      <Block x={825} y={475} w={420} h={130} title="encoder, bank, scale" sub="all fixed" kind="concept" />
      <Flow pts={[[1050,475],[1240,475]]} color={C.concept} />
      <Txt x={1145} y={420} size={27} fill={C.concept}>{NX} scores</Txt>
      <Block x={1390} y={475} w={280} h={130} title="linear head" sub="train this" kind="head" />
      <Flow pts={[[1545,475],[1690,475],[1690,720],[1530,720]]} color={C.chalk2} o={c10} />
      <Block x={1390} y={720} w={280} h={110} title="class loss" kind="loss" o={c10} />
      <Block x={825} y={720} w={420} h={110} title="true class label" sub="e.g. zebra" kind="output" o={c10} />
      <Flow pts={[[1050,720],[1235,720]]} color={C.chalk} o={c10} />
      <Flow pts={[[1390,650],[1390,555]]} color={C.loss} o={cue(10,'update')} />
      <Txt x={1475} y={605} size={25} anchor="start" fill={C.loss} o={cue(10,'update')}>update</Txt>
    </Svg>
    <HText x={330} y={580} ax="center" size={28} color={C.chalk2} o={s10}>{WK.n_train} class-labelled photos</HText>
    <Rich x={960} y={870} ax="center" w={1550} size={34} text="Class labels teach the {f:head} which {c:concepts} predict each animal." o={s10*cue(10,'learns')} />
    <EvTag x={180} y={965} kind="schematic" text="animal example: CLIP phrase bank, then a sparse task head" o={s10} />

    <PhotoR R={{x:175,y:400,w:250,h:170}} src={`worked/${WK.example}`} frac={crop(WK.example,170/250)} o={s13} />
    <Svg o={s13}>
      <Flow pts={[[445,485],[525,485]]} color={C.input} />
      <Block x={650} y={485} w={230} h={130} title="encoder" sub="512 features" kind="input" />
      <Flow pts={[[785,485],[885,485]]} color={C.input} />
      <Block x={1050} y={485} w={310} h={130} title="cosine + scale" sub={`${NX} concept scores`} kind="concept" />
      <Flow pts={[[1225,485],[1325,485]]} color={C.concept} />
      <Block x={1470} y={485} w={270} h={130} title="trained head" sub="class scores" kind="head" />
      <Flow pts={[[1470,565],[1470,650]]} color={C.chalk} o={c13} />
      <Txt x={1545} y={605} size={28} anchor="start" o={c13}>softmax</Txt>
      <ShareBars x={1190} y={710} labels={WK.classes} from={PC.probs_example} labelW={150} w={290} rowH={60} size={28} o={c13} />
    </Svg>
    <Rich x={175} y={650} w={860} size={36} text="Input: one {x:image}." o={s13} />
    <HText x={175} y={735} w={860} size={32} o={s13*cue(13,'No')}>No concept labels. No class label.</HText>
    <HText x={175} y={815} w={860} size={32} color={C.chalk2} o={s13*cue(13,'nothing')}>Everything is saved. Nothing is fitted again.</HText>
    <Credit x={175} y={915} text={credit(WK.example)} o={s13} />
    <EvTag x={175} y={950} kind="computed" text="same held-out zebra; fixed encoder, bank, scale and head" o={s13} />
  </>;
};
