// Scene registry: scene id (from narration/order.txt) -> component.
import type React from 'react';
import type { SceneProps } from '../kit/core';
import { S00 } from './S00';
import { S01 } from './S01';
import { S02 } from './S02';
import { S03 } from './S03';
import { S04 } from './S04';
import { S05 } from './S05';
import { S06 } from './S06';
import { S07 } from './S07';
import { S08 } from './S08';
import { S09 } from './S09';
import { S20 } from './S20';
import { S10 } from './S10';
import { S15 } from './S15';
import { S16 } from './S16';
import { S17 } from './S17';
import { S18 } from './S18';
import { S19 } from './S19';
import { S11 } from './S11';
import { S12 } from './S12';
import { S13 } from './S13';
import { S14 } from './S14';
import { S21 } from './S21';
import { S22 } from './S22';
import { S23 } from './S23';
import { S24 } from './S24';
import { S25 } from './S25';
import { S26 } from './S26';
import { End } from './End';
import { SectionBreak } from './SectionBreak';
import { ApproachBreak } from './ApproachBreak';

export const SCENES: Record<string, React.FC<SceneProps>> = {
  s00: S00,
  s01: S01,
  s02: S02,
  s03: S03,
  s04: S04,
  s05: S05,
  s06: S06,
  s07: S07,
  s08: S08,
  s09: S09,
  s20: S20,
  s10: S10,
  s15: S15,
  s16: S16,
  s17: S17,
  s18: S18,
  s19: S19,
  s11: S11,
  s12: S12,
  s13: S13,
  s14: S14,
  s21: S21,
  s22: S22,
  s23: S23,
  s24: S24,
  s25: S25,
  s26: S26,
  s30: SectionBreak,
  s31: SectionBreak,
  s32: SectionBreak,
  s33: SectionBreak,
  s34: SectionBreak,
  s35: SectionBreak,
  s36: SectionBreak,
  s37: SectionBreak,
  s38: SectionBreak,
  s39: SectionBreak,
  s40: ApproachBreak,
  s41: SectionBreak,
  s42: SectionBreak,
  s43: SectionBreak,
  s44: SectionBreak,
  s45: SectionBreak,
  s46: SectionBreak,
  s47: ApproachBreak,
  s49: ApproachBreak,
  end: End,
};
