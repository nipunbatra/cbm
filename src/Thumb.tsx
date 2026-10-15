// Thumbnail (filled in after the film is approved).
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C } from './kit/theme';
import { HText, Stage } from './kit/core';
import { useFontsReady } from './kit/fonts';

export const Thumb: React.FC = () => {
  const ready = useFontsReady();
  if (!ready) return <AbsoluteFill style={{ background: C.bg }} />;
  return (
    <Stage>
      <HText x={960} y={540} ax="center" ay="middle" size={110} weight={700}>Concept Bottleneck Models</HText>
    </Stage>
  );
};
