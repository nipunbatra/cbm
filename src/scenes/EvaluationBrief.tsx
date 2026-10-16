// Part 11: three-slide teaching version. S11.tsx and narration/archive/s11-r29.txt
// retain the detailed walkthrough; the active deck uses only this component.
import React from 'react';
import { C } from '../kit/theme';
import { Stage, Header, SlideHead, HText, Svg, Txt, bs, bw, bh, inv, type SceneProps } from '../kit/core';
import { ArchMap, Block, Flow, PhotoR, EvTag } from '../kit/cbm';
import { D } from '../kit/data';

const M = D.measured;
const EX = M.example;
const pc = (v: number) => (100 * v).toFixed(1);
const Slide: React.FC<{ o: number; children: React.ReactNode }> = ({ o, children }) =>
  o <= 0.001 ? null : <div style={{ position: 'absolute', inset: 0, opacity: o }}>{children}</div>;

export const EvaluationBrief: React.FC<SceneProps> = ({ t, P }) => {
  const show = (k: number) => inv(bs(P, k), bs(P, k) + 0.3, t) *
    (k === P.beats.length ? 1 : 1 - inv(bs(P, k + 1) - 0.2, bs(P, k + 1), t));
  const cue = (k: number, word: string) => inv(bw(P, k, word), bw(P, k, word) + 0.4, t);
  const checks = [
    { name: 'Task accuracy', question: 'Is the final answer right?', how: 'Held-out class labels', word: 'Task', color: C.chalk },
    { name: 'Concept quality', question: 'Are the named values right?', how: 'Concept labels + image evidence', word: 'quality', color: C.concept },
    { name: 'Faithfulness', question: 'Does the answer use the concepts?', how: 'Inspect the path; test concept edits', word: 'Faithfulness', color: C.concept },
    { name: 'Intervention utility', question: 'Do corrections help?', how: 'Accuracy after edits + human effort', word: 'utility', color: C.edit },
  ];
  return <Stage>
    <Slide o={show(1)}>
      <SlideHead text={bh(P, 1)} />
      <HText x={155} y={330} size={24} color={C.mute}>WHAT TO CHECK</HText>
      <HText x={605} y={330} size={24} color={C.mute}>THE QUESTION</HText>
      <HText x={1240} y={330} size={24} color={C.mute}>LOOK AT</HText>
      {checks.map((row, i) => <React.Fragment key={row.name}>
        <Svg o={cue(1, row.word)}>
          <line x1={155} x2={1780} y1={410 + i * 130} y2={410 + i * 130} stroke={C.line} strokeWidth={2} />
        </Svg>
        <HText x={155} y={435 + i * 130} size={34} weight={650} color={row.color} o={cue(1, row.word)}>{row.name}</HText>
        <HText x={605} y={435 + i * 130} w={590} size={32} o={cue(1, row.word)}>{row.question}</HText>
        <HText x={1240} y={435 + i * 130} w={540} size={28} color={C.chalk2} o={cue(1, row.word)}>{row.how}</HText>
      </React.Fragment>)}
    </Slide>
    <Slide o={show(2)}>
      <SlideHead text={bh(P, 2)} />
      <HText x={155} y={310} size={29} color={C.chalk2}>Synthetic shapes: colour, shape and size determine the class.</HText>
      <PhotoR R={{ x: 165, y: 475, w: 240, h: 240 }} src={EX.image} pixel radius={10} />
      <HText x={285} y={415} size={26} ax="center" color={C.input}>test image</HText>
      <HText x={285} y={750} w={300} size={30} ax="center" align="center">Truth: {M.classes[EX.true_class]}</HText>
      {[false, true].map((after) => {
        const y = after ? 730 : 490;
        const o = after ? cue(2, 'Set') : cue(2, 'Before');
        return <React.Fragment key={String(after)}>
          <HText x={560} y={y - 95} size={28} color={after ? C.edit : C.chalk2} o={o}>{after ? 'After: edit only large' : 'Before correction'}</HText>
          <Svg o={o}>
            <Block x={730} y={y} w={340} h={95} kind={after ? 'edit' : 'concept'} title={`large = ${after ? EX.corrected[4] : EX.probs[4].toFixed(2)}`} size={36} />
            <Flow pts={[[912, y], [1008, y]]} color={after ? C.edit : C.concept} />
            <Block x={1125} y={y} w={210} h={95} kind="head" title="same head" size={30} />
            <Flow pts={[[1242, y], [1350, y]]} color={C.chalk2} />
          </Svg>
          <HText x={1390} y={y} w={390} ay="middle" size={38} weight={650} color={after ? C.good : C.chalk} o={o}>{M.classes[after ? EX.after_class : EX.pred_class]}</HText>
        </React.Fragment>;
      })}
      <HText x={1125} y={865} size={28} ax="center" color={C.chalk2} o={cue(2, 'No')}>All other concept values stay the same. No retraining.</HText>
      <EvTag x={1780} y={965} ax="right" kind="measured" text="saved model output on one synthetic test image" />
    </Slide>
    <Slide o={show(3)}>
      <SlideHead text={bh(P, 3)} />
      <HText x={155} y={315} size={29} color={C.chalk2}>Task accuracy: before → after one concept correction per image</HText>
      <Svg>
        <rect x={155} y={385} width={760} height={425} rx={18} fill="none" stroke={C.line2} strokeWidth={2} />
        <rect x={1005} y={385} width={775} height={425} rx={18} fill="none" stroke={C.line2} strokeWidth={2} />
      </Svg>
      <HText x={190} y={420} size={34} weight={650}>Multi-task</HText>
      <HText x={1035} y={420} size={34} weight={650} o={cue(3, 'strict')}>Strict CBM</HText>
      <HText x={880} y={420} size={36} ax="right" weight={650} o={cue(3, '82.0')}>{pc(M.acc.multitask)}% → {pc(M.acc.multitask)}%</HText>
      <HText x={1745} y={420} size={36} ax="right" weight={650} color={C.good} o={cue(3, '81.6')}>{pc(M.acc.cbm)}% → {pc(M.oracle[1])}%</HText>
      <Svg o={cue(3, 'multi-task')}>
        <Block x={310} y={610} w={150} h={90} kind="input" title="CNN" />
        <Flow pts={[[397, 610], [440, 610], [480, 555], [520, 555]]} color={C.input} />
        <Block x={625} y={555} w={190} h={75} kind="concept" title="concepts" size={28} />
        <Flow pts={[[397, 610], [440, 610], [480, 685], [520, 685]]} color={C.input} />
        <Block x={625} y={685} w={190} h={75} kind="head" title="class head" size={28} />
        <Flow pts={[[732, 685], [790, 685]]} color={C.chalk2} />
        <Txt x={835} y={685} size={28}>class</Txt>
        <Txt x={625} y={485} size={25} fill={C.edit} o={cue(3, 'correction')}>edit here ↓</Txt>
      </Svg>
      <HText x={535} y={750} ax="center" size={27} color={C.chalk2} o={cue(3, 'never')}>No path from concepts to class</HText>
      <Svg o={cue(3, 'strict')}>
        <Block x={1110} y={610} w={130} h={90} kind="input" title="CNN" size={28} />
        <Flow pts={[[1187, 610], [1222, 610]]} color={C.input} />
        <Block x={1315} y={610} w={165} h={90} kind="concept" title="concepts" size={28} />
        <Flow pts={[[1410, 610], [1445, 610]]} color={C.concept} />
        <Block x={1535} y={610} w={160} h={90} kind="head" title="head" size={28} />
        <Flow pts={[[1627, 610], [1670, 610]]} color={C.chalk2} />
        <Txt x={1720} y={610} size={28}>class</Txt>
        <Txt x={1315} y={520} size={25} fill={C.edit}>edit here ↓</Txt>
      </Svg>
      <HText x={1390} y={750} ax="center" size={27} color={C.chalk2} o={cue(3, 'strict')}>The correction reaches the class head</HText>
      <HText x={155} y={850} w={1625} size={29} o={cue(3, 'oracle')}><span style={{ color: C.edit }}>Oracle correction:</span> true labels fix the largest concept error first.</HText>
      <HText x={155} y={905} size={27} color={C.chalk2} o={cue(3, 'results')}>Perfect corrections; human time and mistakes were not measured.</HText>
      <EvTag x={1780} y={975} ax="right" kind="measured" text={`${M.protocol.n_seeds} seed · ${M.protocol.test_n} synthetic test images · saved model outputs`} />
    </Slide>
    <Header t={t} part={11} title={P.title} />
    <ArchMap on={['c', 'f', 'y']} o={inv(0, 0.5, t)} />
  </Stage>;
};
