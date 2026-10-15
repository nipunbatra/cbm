// Shared helpers carried over from the YOLO film: slots, braces, gauges, backed labels.
import React from 'react';
import { C, F } from './theme';
import { E, clamp, inv } from './anim';
import { Tex, Txt } from './core';

/** one output slot: a rounded box with a symbol; (x, y) is its centre; s pops it in (0..1) */
export const Slot: React.FC<{
  x: number; y: number; w?: number; h?: number; label: string; color?: string; text?: string; o?: number; s?: number;
  size?: number; italic?: boolean; fill?: string; sw?: number; mono?: boolean; glow?: number;
}> = ({ x, y, w = 92, h = 92, label, color = C.chalk2, text, o = 1, s = 1, size = 40, italic = true, fill = C.bg3, sw = 3, mono, glow = 0 }) => {
  if (o <= 0.001 || s <= 0.001) return null;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o < 0.999 ? o : undefined}>
      {glow > 0 ? <rect x={-w / 2 - 8} y={-h / 2 - 8} width={w + 16} height={h + 16} rx={16} fill={color} opacity={0.25 * glow} /> : null}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={12} fill={fill} stroke={color} strokeWidth={sw} />
      <Txt x={0} y={0} size={size} weight={600} fill={text ?? C.chalk} italic={italic} mono={mono}>{label}</Txt>
    </g>
  );
};

/** a horizontal curly brace under (down = true) or over the span x1..x2 at y, drawn on with p */
export const Brace: React.FC<{ x1: number; x2: number; y: number; d?: number; color?: string; p?: number; o?: number; down?: boolean; sw?: number }> = ({
  x1, x2, y, d = 26, color = C.chalk2, p = 1, o = 1, down = true, sw = 3.5,
}) => {
  if (o <= 0.001 || p <= 0.001) return null;
  const k = down ? 1 : -1;
  const xm = (x1 + x2) / 2, r = Math.min(18, (x2 - x1) / 6), h = (d / 2) * k;
  const path = `M ${x1} ${y} Q ${x1} ${y + h} ${x1 + r} ${y + h} L ${xm - r} ${y + h} Q ${xm} ${y + h} ${xm} ${y + d * k} Q ${xm} ${y + h} ${xm + r} ${y + h} L ${x2 - r} ${y + h} Q ${x2} ${y + h} ${x2} ${y}`;
  return (
    <path d={path} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" pathLength={1}
      strokeDasharray={p < 0.999 ? `${p} 1` : undefined} opacity={o < 0.999 ? o : undefined} />
  );
};

/** a horizontal gauge bar filled to v (0..1) with progress p */
export const Gauge: React.FC<{ x: number; y: number; w: number; h?: number; v: number; p?: number; o?: number; color?: string; label?: string; size?: number }> = ({
  x, y, w, h = 30, v, p = 1, o = 1, color = C.concept, label, size = 30,
}) => {
  if (o <= 0.001) return null;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <rect x={x} y={y - h / 2} width={w} height={h} rx={6} fill={C.bg3} stroke={C.line2} strokeWidth={2} />
      <rect x={x} y={y - h / 2} width={Math.max(0, w * v * E.out(clamp(p)))} height={h} rx={6} fill={color} />
      {label ? <Txt x={x + w + 16} y={y} size={size} anchor="start" mono weight={600} fill={C.chalk} o={inv(0.4, 1, p)}>{label}</Txt> : null}
    </g>
  );
};

/** small SVG text with a dark backing, for labels over the photo; (x, y) is the left/centre/right middle point */
export const BText: React.FC<{ x: number; y: number; text: string; color?: string; size?: number; o?: number; anchor?: 'start' | 'middle' | 'end'; weight?: number; mono?: boolean; pad?: number }> = ({
  x, y, text, color = C.chalk, size = 24, o = 1, anchor = 'start', weight = 600, mono, pad = 8,
}) => {
  if (o <= 0.001) return null;
  const w = text.length * size * (mono ? 0.62 : 0.56) + pad * 2, h = size * 1.45;
  const x0 = anchor === 'start' ? x - pad : anchor === 'end' ? x - w + pad : x - w / 2;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <rect x={x0} y={y - h / 2} width={w} height={h} rx={6} fill="rgba(8,11,15,0.78)" />
      <text x={anchor === 'middle' ? x : anchor === 'end' ? x : x} y={y + 1} fontSize={size} fontWeight={weight} fill={color} textAnchor={anchor}
        dominantBaseline="central" fontFamily={mono ? F.mono : F.sans}>{text}</text>
    </g>
  );
};

/**
 * an equation revealed part by part: each part fades in at its own time while the layout stays fixed
 * (unrevealed parts are \phantom). Start a part with "{}" when it begins with = or + so spacing is kept.
 */
export const TexSteps: React.FC<{ x: number; y: number; t: number; parts: [string, number][]; size?: number; ax?: 'left' | 'center' | 'right'; o?: number; fade?: number }> = ({
  x, y, t, parts, size = 44, ax = 'left', o = 1, fade = 0.4,
}) => (
  <>
    {parts.map(([, t0], i) => (
      <Tex key={i} x={x} y={y} ax={ax} size={size} o={o * inv(t0, t0 + fade, t)}
        tex={parts.map(([p], j) => (j === i ? `{${p}}` : `\\phantom{${p}}`)).join('')} />
    ))}
  </>
);
