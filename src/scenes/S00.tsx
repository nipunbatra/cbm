// s00 Title card: the gull photograph on the right, dimmed; a thin pipeline sketch draws across it (a blue line from the
// bird into five teal concept ticks, a grey head, a white output dot). Title and subtitle on the left.
import React from 'react';
import { C } from '../kit/theme';
import { E, HText, Stage, Svg, bw, inv, type SceneProps } from '../kit/core';
import { CREDIT, Credit, Flow, PhotoR } from '../kit/cbm';

export const S00: React.FC<SceneProps> = ({ t, P }) => {
  const R = { x: 1040, y: 150, w: 760, h: 760 };
  const out = 1 - inv(P.dur - 0.6, P.dur, t);
  const ticks = [0, 1, 2, 3, 4].map((i) => 330 + i * 70);
  const cx = 1500, hx = 1660, ox = 1760;
  const tk = (i: number) => E.out(inv(2.2 + i * 0.12, 2.7 + i * 0.12, t));
  // title with its first spoken word, subtitle with "From" (the voice reads both)
  const tIn = bw(P, 1, 'Concept') - 0.4, sIn = bw(P, 1, 'From') - 0.3;
  return (
    <Stage>
      <PhotoR R={R} src="gull.jpg" o={inv(0, 1.2, t) * out} dim={0.45} />
      <Svg o={out}>
        {/* bird -> concepts */}
        {ticks.map((y, i) => (
          <Flow key={i} pts={[[1250, 470], [1330, 470], [cx - 20, y]]} color={C.input} p={E.io(inv(1.4, 2.4, t))} t={t + i * 0.3} live={inv(3.6, 4.2, t)} head={0} sw={2.5} n={1} />
        ))}
        {ticks.map((y, i) => (
          <g key={`t${i}`} opacity={tk(i)}>
            <rect x={cx - 8} y={y - 13} width={96} height={26} rx={5} fill={C.bg3} stroke={C.concept} strokeWidth={2} />
            <rect x={cx - 8} y={y - 13} width={96 * [0.8, 0.2, 0.9, 0.85, 0.6][i]} height={26} rx={5} fill={C.concept} opacity={0.85} />
          </g>
        ))}
        {ticks.map((y, i) => (
          <Flow key={`f${i}`} pts={[[cx + 96, y], [hx - 40, 470]]} color={C.concept} p={E.io(inv(2.8, 3.5, t))} t={t + i * 0.25} live={inv(3.6, 4.2, t)} head={0} sw={2.5} n={1} />
        ))}
        <g opacity={inv(3.2, 3.7, t)}>
          <rect x={hx - 40} y={430} width={80} height={80} rx={12} fill={C.headFill} stroke="#8792A2" strokeWidth={3} />
        </g>
        <Flow pts={[[hx + 40, 470], [ox - 12, 470]]} color={C.chalk2} p={E.io(inv(3.6, 4.0, t))} head={10} sw={2.5} />
        <circle cx={ox} cy={470} r={12 * E.back(inv(3.9, 4.3, t))} fill={C.chalk} />
      </Svg>
      <Credit x={R.x + R.w} y={R.y + R.h + 10} ax="right" text={CREDIT['gull.jpg']} o={inv(1, 2, t) * out} />
      <HText x={110} y={330} size={30} weight={600} color={C.mute} mono o={inv(0.4, 1.2, t) * out}>A GRADUATE LECTURE</HText>
      <HText x={110} y={380} w={880} size={96} weight={600} lh={1.04} o={inv(Math.min(0.6, tIn), tIn + 0.8, t) * out}>Concept Bottleneck Models</HText>
      <HText x={110} y={612} w={860} size={40} weight={500} color={C.chalk2} lh={1.25} o={inv(sIn, sIn + 0.8, t) * out}>
        From black-box predictions to interpretable, editable concepts
      </HText>
      <div style={{ position: 'absolute', left: 110, top: 730, width: 140 * inv(sIn + 0.3, sIn + 1.3, t), height: 5, background: C.concept, opacity: out }} />
      <HText x={110} y={770} size={24} weight={500} color={C.mute} o={inv(sIn + 1.0, sIn + 1.8, t) * out}>
        Machine Learning Concepts
      </HText>
    </Stage>
  );
};
