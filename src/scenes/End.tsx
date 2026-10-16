// end: end card. "Concept Bottleneck Models" large, a teal rule, the one-line summary, small credits, then a fade to black
// over the last 1.6 s. Matches the YOLO and DETR films' end cards.
import React from 'react';
import { C } from '../kit/theme';
import { E, HText, Stage, bw, inv, type SceneProps } from '../kit/core';

export const End: React.FC<SceneProps> = ({ t, P }) => {
  const black = E.io(inv(P.dur - 1.6, P.dur - 0.15, t));
  const line = bw(P, 1, 'Predicting');
  const rule = inv(0.6, 1.4, t);
  return (
    <Stage>
      <HText x={960} y={420} ax="center" ay="middle" size={132} weight={700} o={inv(0.2, 0.9, t)} s={0.96 + 0.04 * E.out(inv(0.2, 1.2, t))}>
        Concept Bottleneck Models
      </HText>
      <div style={{ position: 'absolute', left: 960 - 80 * rule, top: 548, width: 160 * rule, height: 5, background: C.concept }} />
      <HText x={960} y={630} ax="center" ay="middle" size={46} weight={500} color={C.chalk} o={inv(line, line + 0.6, t)}>
        Predicting through interpretable concepts.
      </HText>
      <HText x={960} y={830} ax="center" ay="middle" w={1600} size={22} color={C.mute} lh={1.5} o={inv(2.6, 3.4, t)}>
        Narration: synthetic voice (Gemini TTS). Photographs: Rhododendrites, Yathin S Krishnappa, Gzen92, Dietmar Rabich,
        Hans Hillewaert, Stillwaterising, and the authors of the 36 Part 10 photographs, via Wikimedia Commons (CC BY-SA, CC BY,
        CC0, public domain); knee X-ray from Koh et al. 2020 (CC BY 4.0).
        <br />
        Satellite imagery: Sentinel-2, SentinelKilnDB. Data: CUB-200-2011. Models: CLIP ViT-B/32, ResNet-50; concept lists: Gemini.
        <br />
        Sources: Koh et al. 2020; Wah et al. 2011; Simonyan et al. 2014; Kim et al. 2018; Adebayo et al. 2018; Zech et al. 2018;
        Rudin 2019; Chen et al. 2019; Zarlenga et al. 2022; Yuksekgonul et al. 2023;
        Menon and Vondrick 2023; Mahinpei et al. 2021; Havasi et al. 2022; Knab et al. 2026.
      </HText>
      {black > 0 ? <div style={{ position: 'absolute', inset: 0, background: '#000', opacity: black }} /> : null}
    </Stage>
  );
};
