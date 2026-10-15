import React from 'react';
import { Composition } from 'remotion';
import { FPS, H, W } from './kit/theme';
import { Film, TL } from './Film';
import { Thumb } from './Thumb';

export const RemotionRoot: React.FC = () => (
  <>
    <Composition id="CBM" component={Film} durationInFrames={Math.round(TL.duration * FPS)} fps={FPS} width={W} height={H}
      defaultProps={{ captions: false, only: '' }} />
    <Composition id="CBMCaptioned" component={Film} durationInFrames={Math.round(TL.duration * FPS)} fps={FPS} width={W} height={H}
      defaultProps={{ captions: true, only: '' }} />
    <Composition id="Thumb" component={Thumb} durationInFrames={1} fps={FPS} width={W} height={H} />
  </>
);
