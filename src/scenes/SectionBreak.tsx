// Section separators share the lecture typography and preserve existing content slide IDs.
import React from 'react';
import { C, F } from '../kit/theme';
import { HText, Rich, Stage, bh, inv, type SceneProps } from '../kit/core';

const SECTIONS: Record<string, { label: string; prompt: string; rung: number | null }> = {
  "s30": {
    "label": "PART 1",
    "prompt": "What evidence did the model use?",
    "rung": null
  },
  "s31": {
    "label": "PART 2",
    "prompt": "Make the prediction pass through named concepts",
    "rung": null
  },
  "s32": {
    "label": "PART 3",
    "prompt": "Choose what the model should describe",
    "rung": null
  },
  "s33": {
    "label": "PART 4",
    "prompt": "Follow one image through the task head",
    "rung": null
  },
  "s34": {
    "label": "PART 5",
    "prompt": "What do the labels teach each part of the model?",
    "rung": null
  },
  "s35": {
    "label": "PART 6",
    "prompt": "What changes when a person corrects a concept?",
    "rung": null
  },
  "s36": {
    "label": "PART 7",
    "prompt": "A better concept value need not give a better answer",
    "rung": null
  },
  "s37": {
    "label": "PART 8",
    "prompt": "What if a useful distinction has no name?",
    "rung": null
  },
  "s38": {
    "label": "PART 10",
    "prompt": "Follow the ladder of supervision",
    "rung": null
  },
  "s39": {
    "label": "PART 10 \u00b7 RUNG ONE",
    "prompt": "Next: Concept Embedding Models (CEMs)",
    "rung": 1
  },
  "s40": {
    "label": "PART 10 \u00b7 RUNG TWO",
    "prompt": "Next: Post-hoc Concept Bottleneck Models (PCBMs)",
    "rung": 2
  },
  "s41": {
    "label": "PART 10 \u00b7 RUNG THREE",
    "prompt": "Next: Classification by Description (CBD)",
    "rung": 3
  },
  "s42": {
    "label": "PART 11",
    "prompt": "Check the concepts, predictions and interventions",
    "rung": null
  },
  "s43": {
    "label": "PART 12",
    "prompt": "The same idea with different inputs",
    "rung": null
  },
  "s44": {
    "label": "PART 13",
    "prompt": "An editable interface needs careful checks",
    "rung": null
  },
  "s45": {
    "label": "RECAP",
    "prompt": "From the image to an editable explanation",
    "rung": null
  },
  "s46": {
    "label": "APPENDIX",
    "prompt": "Testing with Concept Activation Vectors (TCAV)",
    "rung": null
  }
};

export const SectionBreak: React.FC<SceneProps> = ({ t, P }) => {
  const section = SECTIONS[P.id];
  const o = inv(0, 0.35, t);
  return <Stage>
    <HText x={128} y={258} size={30} mono weight={600} color={C.concept} o={o}>{section.label}</HText>
    <Rich x={128} y={350} w={1630} size={86} weight={700} lh={1.12} text={bh(P, 1)} o={o} />
    <div style={{ position: 'absolute', left: 128, top: 590, width: 150, height: 5, background: C.concept, opacity: o }} />
    <HText x={128} y={640} w={1610} size={37} color={C.chalk2} lh={1.35} o={o}>{section.prompt}</HText>
    {section.rung && <HText x={128} y={730} w={1610} size={28} color={C.chalk2} o={o}>{[
      'Training uses an image, its concept labels and its class label.',
      'No concept labels on the task images; the concept bank comes from elsewhere.',
      'The pretrained model stays fixed; a fixed rule combines description scores.',
    ][section.rung - 1]}</HText>}
    {section.rung && <div style={{ position: 'absolute', left: 128, top: 820, display: 'flex', gap: 38, opacity: o, fontFamily: F.sans }}>
      {['Concept and class labels', 'Class labels', 'No task fitting'].map((label, i) => <div key={label} style={{
        width: 475, borderTop: `4px solid ${section.rung === i + 1 ? C.concept : C.line2}`, paddingTop: 18,
        color: section.rung === i + 1 ? C.concept : C.mute, fontSize: 25, fontWeight: section.rung === i + 1 ? 700 : 500,
      }}>{label}</div>)}
    </div>}
  </Stage>;
};
