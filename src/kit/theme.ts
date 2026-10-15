// Design tokens for the Concept Bottleneck Models lecture-film (same blackboard, type and motion as the YOLO and DETR films).
// Colours are semantic: each meaning keeps its colour for the whole film (see docs/scene_plan.md).
export const W = 1920;
export const H = 1080;
export const FPS = 30;

export const C = {
  // blackboard (identical to the YOLO and DETR films)
  bg: '#0E1318',
  bg2: '#151C24', // panels
  bg3: '#1C2530', // raised panels, cells
  line: '#2B3542',
  line2: '#3A4656',
  chalk: '#EEF1F4', // primary text, predictions / outputs
  chalk2: '#B4BEC9', // secondary text
  mute: '#7A8696',

  // the brief's stable colour roles
  input: '#5B9BFF', // input x, encoder, input features (blue)
  concept: '#2DD4BF', // concepts c, concept predictor outputs, concept values (teal)
  head: '#5E6B7C', // the task head f_phi (dark grey: fill headFill, stroke head)
  headFill: '#262E38',
  edit: '#F5B342', // human edits and interventions (amber)
  loss: '#FF7F6B', // losses and gradients (coral)
  leak: '#B98CFF', // leakage and bypass paths (purple)

  // supporting
  bad: '#F26D6D', // error, cross-out (used sparingly, close to the loss family)
  good: '#9BE3B0', // a correct outcome tick (sparingly)
  heat: '#FFFFFF', // occlusion sensitivity is drawn as white luminance over a dimmed photo
} as const;

export const F = {
  sans: '"Avenir Next", "Nunito Sans", "Helvetica Neue", Arial, sans-serif',
  mono: '"JetBrains Mono", Menlo, monospace',
};

const hex = (c: string) => c.slice(1);
// KaTeX colour macros, so every equation uses the same colours as the drawings
export const TEX_MACROS: Record<string, string> = {
  '\\cin': `\\textcolor{${hex(C.input)}}{#1}`,
  '\\ccon': `\\textcolor{${hex(C.concept)}}{#1}`,
  '\\chead': `\\textcolor{${hex('#9AA6B5')}}{#1}`, // head colour lifted for legibility on the blackboard
  '\\cedit': `\\textcolor{${hex(C.edit)}}{#1}`,
  '\\closs': `\\textcolor{${hex(C.loss)}}{#1}`,
  '\\cleak': `\\textcolor{${hex(C.leak)}}{#1}`,
  '\\cmu': `\\textcolor{${hex(C.mute)}}{#1}`,
  '\\cbad': `\\textcolor{${hex(C.bad)}}{#1}`,
  '\\cout': `\\textcolor{${hex(C.chalk)}}{#1}`,
  // the film's notation: x -> g_theta -> c hat -> f_phi -> y hat
  '\\gth': '\\cin{g}_{\\cin{\\theta}}',
  '\\fph': '\\chead{f}_{\\chead{\\phi}}',
  '\\ch': '\\ccon{\\hat{c}}',
  '\\cvec': '\\ccon{\\hat{\\mathbf{c}}}',
  '\\yh': '\\hat{y}',
};
