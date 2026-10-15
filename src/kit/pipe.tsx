// The recurring gull pipeline (s02, s06, s14): photo -> g_theta -> five named concepts -> f_phi -> two species.
// One component, so the central metaphor looks identical every time it returns. Every visible part has its own
// opacity / progress prop; scenes animate those from beat times. Values come from D.bird (math/data.py).
import React from 'react';
import { C } from './theme';
import { E, clamp, inv, lerp } from './anim';
import { Txt } from './core';
import { Block, ConceptRow, Flow, PhotoR, Region, rgba, type Rect } from './cbm';
import { D } from './data';

export const PIPE = {
  photo: { x: 96, y: 300, w: 330, h: 330 } as Rect,
  g: { x: 585, y: 465, w: 170, h: 124 },
  rowX: 724, rowY0: 337, rowDY: 64, labelW: 236, barW: 170,
  f: { x: 1405, y: 465, w: 150, h: 124 },
  outX: 1530, outY: [400, 500], outW: 210,
  col: { x: 704, y: 296, w: 548, h: 338 }, // the concept column outline
};
export const rowY = (i: number) => PIPE.rowY0 + i * PIPE.rowDY;

export type PipeState = {
  t: number; o?: number;
  photoO?: number; gO?: number; colO?: number; rowsO?: number; rowP?: (i: number) => number; headO?: number; outO?: number;
  flowIn?: number; flowC?: number; flowOut?: number; live?: number;
  edit?: number; // 0..1: the wing colour group edit (rows 0 and 1) from D.bird.before to D.bird.after
  outK?: number; // 0..1: output shares move from before to after
  headHi?: number; rowHi?: (i: number) => number; colLabel?: number; bracket?: number;
  gTitle?: string; fTitle?: string; dimRows?: (i: number) => number;
  wingRegion?: number; // outline the wingtip region on the photo
};

/** the photo, blocks, concept rows, flows and output bars of the canonical layout (an SVG layer + the photo) */
export const GullPipePhoto: React.FC<{ s: PipeState }> = ({ s }) => (
  <PhotoR R={PIPE.photo} src="gull.jpg" o={(s.o ?? 1) * (s.photoO ?? 1)} />
);

export const GullPipeSvg: React.FC<{ s: PipeState }> = ({ s }) => {
  const o = s.o ?? 1;
  if (o <= 0.001) return null;
  const B = D.bird;
  const labels: string[] = B.labels;
  const v0: number[] = B.before.c, v1: number[] = B.after.c;
  const ek = clamp(s.edit ?? 0);
  const P = PIPE;
  const live = s.live ?? 0;
  const rowsO = s.rowsO ?? 1;
  const ph = P.photo;
  const shares0: number[] = B.before.share, shares1: number[] = B.after.share;
  const k = E.io(clamp(s.outK ?? 0));
  const sh = shares0.map((v, i) => lerp(v, shares1[i], k));
  const lead = sh[1] > sh[0] ? 1 : 0;
  const cls: string[] = B.classes;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      {/* wingtip region on the photo */}
      <Region R={ph} b={D.gull.regions.wingtip} color={C.concept} draw={s.wingRegion ?? 0} sw={3.5} />
      {/* photo -> g */}
      <Flow pts={[[ph.x + ph.w + 8, P.g.y], [P.g.x - P.g.w / 2 - 6, P.g.y]]} color={C.input} p={s.flowIn ?? 1} t={s.t} live={live} head={14} />
      <Block x={P.g.x} y={P.g.y} w={P.g.w} h={P.g.h} kind="input" title={s.gTitle ?? 'concept'} sub={s.gTitle ? undefined : 'predictor'} o={s.gO ?? 1} size={26} />
      {s.gTitle === undefined ? null : null}
      {/* g -> rows: a fan of teal links */}
      {labels.map((_, i) => (
        <Flow key={`a${i}`} pts={[[P.g.x + P.g.w / 2 + 6, P.g.y], [P.g.x + P.g.w / 2 + 40, P.g.y], [P.rowX - 18, rowY(i)]]} color={C.concept}
          p={s.flowC ?? 1} t={s.t + i * 0.37} live={live} head={0} sw={2.5} n={1} dotR={5} o={rowsO} />
      ))}
      {/* the concept column outline */}
      {(s.colO ?? 0) > 0.001 ? (
        <g opacity={s.colO}>
          <rect x={P.col.x} y={P.col.y} width={P.col.w} height={P.col.h} rx={18} fill={rgba(C.concept, 0.05)} stroke={C.concept} strokeWidth={2.5} strokeDasharray="10 8" />
          <Txt x={P.col.x + P.col.w / 2} y={P.col.y + P.col.h + 30} size={22} weight={600} fill={C.concept} o={s.colLabel ?? 0}>the only input to the task head</Txt>
        </g>
      ) : null}
      {/* rows */}
      {labels.map((l, i) => {
        const isEdit = i < 2 && ek > 0.001;
        return (
          <ConceptRow key={l} x={P.rowX} y={rowY(i)} label={l} v={v0[i]} w={P.barW} labelW={P.labelW} size={25} barH={24}
            o={rowsO} p={s.rowP ? s.rowP(i) : 1} hi={s.rowHi ? s.rowHi(i) : 0} dim={s.dimRows ? s.dimRows(i) : 0}
            edit={isEdit ? { to: v1[i], p: ek } : undefined} />
        );
      })}
      {/* group bracket for wing colour (rows 0 and 1) */}
      {(s.bracket ?? 0) > 0.001 ? (
        <g opacity={s.bracket}>
          <path d={`M ${P.rowX - 22} ${rowY(0) - 18} L ${P.rowX - 32} ${rowY(0) - 18} L ${P.rowX - 32} ${rowY(1) + 18} L ${P.rowX - 22} ${rowY(1) + 18}`}
            fill="none" stroke={ek > 0.001 ? C.edit : C.concept} strokeWidth={3} />
        </g>
      ) : null}
      {/* rows -> f */}
      {labels.map((_, i) => (
        <Flow key={`b${i}`} pts={[[P.rowX + P.labelW + P.barW + 92, rowY(i)], [P.f.x - P.f.w / 2 - 40, P.f.y], [P.f.x - P.f.w / 2 - 6, P.f.y]]}
          color={i < 2 && ek > 0.001 ? C.edit : C.concept} p={s.flowC ?? 1} t={s.t + 0.2 + i * 0.29} live={live} head={i === 2 ? 14 : 0} sw={2.5} n={1} dotR={5} o={rowsO} />
      ))}
      <Block x={P.f.x} y={P.f.y} w={P.f.w} h={P.f.h} kind="head" title={s.fTitle ?? 'task'} sub={s.fTitle ? undefined : 'head'} o={s.headO ?? 1} hi={s.headHi ?? 0} size={26} />
      {/* f -> outputs */}
      {[0, 1].map((i) => (
        <Flow key={`c${i}`} pts={[[P.f.x + P.f.w / 2 + 6, P.f.y], [P.outX - 14, P.outY[i] + 14]]} color={C.chalk2} p={s.flowOut ?? 1} t={s.t + i * 0.5}
          live={live} head={12} sw={2.5} n={1} dotR={5} o={s.outO ?? 1} />
      ))}
      {(s.outO ?? 1) > 0.001 ? (
        <g opacity={s.outO ?? 1}>
          {[0, 1].map((i) => {
            const y = P.outY[i], top = i === lead;
            return (
              <g key={i}>
                <Txt x={P.outX} y={y - 4} size={23} anchor="start" weight={top ? 700 : 500} fill={top ? C.chalk : C.chalk2}>{cls[i]}</Txt>
                <rect x={P.outX} y={y + 18} width={P.outW} height={22} rx={4} fill={C.bg3} />
                <rect x={P.outX} y={y + 18} width={P.outW * sh[i]} height={22} rx={4} fill={C.chalk} opacity={top ? 0.95 : 0.4} />
                <Txt x={P.outX + P.outW + 14} y={y + 29} size={24} anchor="start" mono weight={top ? 700 : 500} fill={top ? C.chalk : C.chalk2}>{sh[i].toFixed(2)}</Txt>
              </g>
            );
          })}
        </g>
      ) : null}
    </g>
  );
};

/** fade helper used by scenes: 0 before a, 1 after a + d */
export const ramp = (t: number, a: number, d = 0.5) => inv(a, a + d, t);
