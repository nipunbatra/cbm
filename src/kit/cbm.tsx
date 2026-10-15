// The CBM film's drawing vocabulary: photographs in rectangular frames, pipeline blocks joined by live flows, concept
// rows with editable values, output bars, matrices, waveforms, sensitivity maps and evidence tags.
// All positions are 1920 x 1080 design units. Colour roles come from theme.ts and never change meaning.
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { C, F } from './theme';
import { E, clamp, inv, lerp } from './anim';
import { HText, Tex, Txt, texHTML } from './core';

export const rgba = (h: string, a: number) => {
  const n = parseInt(h.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};

// ------------------------------------------------------------------ images
/** pixel sizes of the images in public/img (for aspect ratios) */
export const IMG: Record<string, [number, number]> = {
  'gull.jpg': [2048, 2048],
  'zebra_plains.jpg': [2048, 1365],
  'zebra_grevy.jpg': [2048, 1391],
  'horse.jpg': [2048, 1432],
  'giraffe.jpg': [1536, 2048],
  'kilns_obb.png': [694, 694],
  'chimney-pair.png': [1774, 887],
  'test_010.png': [64, 64],
  'knee.jpg': [322, 324],
  'chest.jpg': [1000, 811],
};

/** a rectangular photo frame. The image fills (x, y, w, h) exactly: choose h = w * imgH / imgW, or crop with
 *  crop = [cx, cy, zoom] (normalized centre, zoom >= 1) to show a window. `pixel` keeps hard pixels (64 px inputs). */
export type Rect = { x: number; y: number; w: number; h: number };
export const PhotoR: React.FC<{
  R: Rect; src: string; o?: number; dim?: number; crop?: [number, number, number]; radius?: number; filter?: string; pixel?: boolean;
  shadow?: boolean; border?: string; frac?: [number, number, number, number];
}> = ({ R, src, o = 1, dim = 0, crop, radius = 8, filter, pixel, shadow = true, border, frac }) => {
  if (o <= 0.001) return null;
  // frac = [u0, v0, u1, v1]: show this normalized window of the image stretched to R (caller keeps the aspect right)
  let u0 = 0, v0 = 0, u1 = 1, v1 = 1;
  if (frac) [u0, v0, u1, v1] = frac;
  else if (crop) {
    const z = crop[2];
    u0 = clamp(crop[0] - 0.5 / z, 0, 1 - 1 / z); v0 = clamp(crop[1] - 0.5 / z, 0, 1 - 1 / z); u1 = u0 + 1 / z; v1 = v0 + 1 / z;
  }
  const W = R.w / (u1 - u0), Hh = R.h / (v1 - v0);
  return (
    <div style={{
      position: 'absolute', left: R.x, top: R.y, width: R.w, height: R.h, overflow: 'hidden', borderRadius: radius, opacity: o,
      boxShadow: shadow ? '0 18px 50px rgba(0,0,0,0.45)' : undefined, border: border ? `3px solid ${border}` : undefined, boxSizing: 'border-box',
    }}>
      <Img src={staticFile(`img/${src}`)} style={{
        position: 'absolute', width: W, height: Hh, left: -u0 * W, top: -v0 * Hh, filter,
        imageRendering: pixel ? 'pixelated' : undefined,
      }} />
      {dim > 0 ? <div style={{ position: 'absolute', inset: 0, background: `rgba(8,11,15,${dim})` }} /> : null}
    </div>
  );
};
/** map normalized image coordinates (u, v) to design units for a full-image frame R */
export const ux = (R: Rect, u: number) => R.x + u * R.w;
export const vy = (R: Rect, v: number) => R.y + v * R.h;
/** a frame for a full image of width w at (x, y), keeping its aspect */
export const fit = (src: string, x: number, y: number, w: number): Rect => ({ x, y, w, h: (w * IMG[src][1]) / IMG[src][0] });
/** the same, sized by height */
export const fitH = (src: string, x: number, y: number, h: number): Rect => ({ x, y, h, w: (h * IMG[src][0]) / IMG[src][1] });

/** a region of a photo (normalized cx, cy, w, h) outlined, with an optional label tag. `draw` 0..1 draws the outline on. */
export const Region: React.FC<{ R: Rect; b: number[]; color?: string; draw?: number; o?: number; sw?: number; label?: string; labelSide?: 'top' | 'bottom'; size?: number; dash?: string; r?: number }> = ({
  R, b, color = C.concept, draw = 1, o = 1, sw = 4, label, labelSide = 'top', size = 22, dash, r = 10,
}) => {
  if (o <= 0.001 || draw <= 0.001) return null;
  const x0 = ux(R, b[0] - b[2] / 2), y0 = vy(R, b[1] - b[3] / 2), w = b[2] * R.w, h = b[3] * R.h;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <rect x={x0} y={y0} width={w} height={h} rx={r} fill="none" stroke={color} strokeWidth={sw} pathLength={1}
        strokeDasharray={dash ?? (draw < 0.999 ? `${draw} 1` : undefined)} />
      {label && draw > 0.6 ? <Pill x={x0} y={labelSide === 'top' ? y0 - 8 : y0 + h + 8} text={label} color={color} size={size}
        o={inv(0.6, 1, draw)} anchorY={labelSide === 'top' ? 'bottom' : 'top'} /> : null}
    </g>
  );
};

/** a solid pill label with dark text (anchor: left edge; anchorY: which edge sits on y) */
export const Pill: React.FC<{ x: number; y: number; text: string; color: string; size?: number; o?: number; anchorY?: 'top' | 'middle' | 'bottom'; anchorX?: 'start' | 'middle' | 'end'; dark?: boolean; mono?: boolean }> = ({
  x, y, text, color, size = 22, o = 1, anchorY = 'middle', anchorX = 'start', dark = true, mono = true,
}) => {
  if (o <= 0.001) return null;
  const w = text.length * size * (mono ? 0.62 : 0.56) + size * 0.9, h = size * 1.45;
  const xx = anchorX === 'start' ? x : anchorX === 'middle' ? x - w / 2 : x - w;
  const yy = anchorY === 'top' ? y : anchorY === 'middle' ? y - h / 2 : y - h;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <rect x={xx} y={yy} width={w} height={h} rx={6} fill={color} />
      <text x={xx + size * 0.45} y={yy + h / 2 + 1} fontSize={size} fontWeight={700} fill={dark ? '#0B0F14' : C.chalk} dominantBaseline="central"
        fontFamily={mono ? F.mono : F.sans}>{text}</text>
    </g>
  );
};

// ------------------------------------------------------------------ evidence tags (HTML, top layer)
export type TagKind = 'computed' | 'illustrative' | 'measured' | 'constructed' | 'generated' | 'schematic' | 'data' | 'reported';
const TAGC: Record<TagKind, { head: string; color: string; solid: boolean }> = {
  computed: { head: 'COMPUTED · REAL MODEL', color: C.input, solid: true },
  measured: { head: 'MEASURED', color: C.good, solid: true },
  illustrative: { head: 'ILLUSTRATIVE VALUES', color: C.mute, solid: false },
  constructed: { head: 'CONSTRUCTED EXAMPLE', color: C.mute, solid: false },
  generated: { head: 'GENERATED IMAGE', color: C.mute, solid: false },
  schematic: { head: 'SCHEMATIC', color: C.mute, solid: false },
  data: { head: 'DATASET', color: C.chalk2, solid: true },
  reported: { head: 'REPORTED', color: C.chalk2, solid: false },
};
/** the provenance label every number-bearing visual carries (kind decides the wording and border) */
export const EvTag: React.FC<{ x: number; y: number; kind: TagKind; text?: string; o?: number; w?: number; ax?: 'left' | 'right' }> = ({ x, y, kind, text, o = 1, w, ax = 'left' }) => {
  if (o <= 0.001) return null;
  const k = TAGC[kind];
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, opacity: o, fontFamily: F.mono, fontSize: 20, fontWeight: 600, color: C.chalk2,
      background: 'rgba(8,11,15,0.78)', border: `1.5px ${k.solid ? 'solid' : 'dashed'} ${k.solid ? k.color : C.line2}`, borderRadius: 6,
      padding: '4px 10px', lineHeight: 1.3, transform: ax === 'right' ? 'translateX(-100%)' : undefined, whiteSpace: w ? 'normal' : 'nowrap',
    }}>
      <span style={{ color: k.solid ? k.color : C.chalk2 }}>{k.head}</span>{text ? ` · ${text}` : ''}
    </div>
  );
};
/** photo credit line (small, muted), for licensed photographs */
export const Credit: React.FC<{ x: number; y: number; text: string; o?: number; ax?: 'left' | 'right' }> = ({ x, y, text, o = 1, ax = 'left' }) =>
  o <= 0.001 ? null : (
    <div style={{ position: 'absolute', left: x, top: y, opacity: o * 0.85, fontFamily: F.sans, fontSize: 17, color: C.mute,
      transform: ax === 'right' ? 'translateX(-100%)' : undefined, whiteSpace: 'nowrap' }}>{text}</div>
  );
export const CREDIT: Record<string, string> = {
  'gull.jpg': 'Photo: Rhododendrites, Wikimedia Commons, CC BY-SA 4.0 (cropped)',
  'zebra_plains.jpg': 'Photo: Yathin S Krishnappa, Wikimedia Commons, CC BY-SA 3.0',
  'zebra_grevy.jpg': 'Photo: Gzen92, Wikimedia Commons, CC BY-SA 4.0',
  'horse.jpg': 'Photo: Dietmar Rabich, Wikimedia Commons, CC BY-SA 4.0',
  'giraffe.jpg': 'Photo: Hans Hillewaert, Wikimedia Commons, CC BY-SA 4.0',
  'kilns_obb.png': 'Sentinel-2 (contains modified Copernicus data), SentinelKilnDB, CC BY-NC 4.0',
  'chimney-pair.png': 'Generated illustration of a fictional site',
  'knee.jpg': 'Knee X-ray: Koh et al. 2020, Fig. 1 (CC BY 4.0), Osteoarthritis Initiative',
  'chest.jpg': 'Chest X-ray: Stillwaterising, Wikimedia Commons, CC0',
};

// ------------------------------------------------------------------ pipeline blocks and flows
export type Kind = 'input' | 'concept' | 'head' | 'output' | 'neutral' | 'edit' | 'loss' | 'leak';
export const KC: Record<Kind, string> = {
  input: C.input, concept: C.concept, head: C.head, output: C.chalk, neutral: C.line2, edit: C.edit, loss: C.loss, leak: C.leak,
};
/** a pipeline block: rounded box, title (and optional sub). (x, y) is its centre. hi 0..1 adds a glow. */
export const Block: React.FC<{
  x: number; y: number; w?: number; h?: number; kind?: Kind; title?: string; sub?: string; o?: number; s?: number; hi?: number;
  size?: number; subSize?: number; dash?: boolean; dim?: number; children?: React.ReactNode; color?: string;
}> = ({ x, y, w = 200, h = 110, kind = 'neutral', title, sub, o = 1, s = 1, hi = 0, size = 30, subSize = 20, dash, dim = 0, children, color }) => {
  if (o <= 0.001 || s <= 0.001) return null;
  const col = color ?? KC[kind];
  const fill = kind === 'head' ? C.headFill : rgba(col, 0.13 + 0.12 * hi);
  const stroke = kind === 'head' ? '#8792A2' : col;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={(o * (1 - 0.6 * dim)) < 0.999 ? o * (1 - 0.6 * dim) : undefined}>
      {hi > 0.001 ? <rect x={-w / 2 - 10} y={-h / 2 - 10} width={w + 20} height={h + 20} rx={22} fill={rgba(kind === 'head' ? '#9AA6B5' : col, 0.16 * hi)} /> : null}
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={16} fill={fill} stroke={stroke} strokeWidth={3} strokeDasharray={dash ? '10 8' : undefined} />
      {title ? <Txt x={0} y={sub ? -subSize * 0.7 : 0} size={size} weight={600} fill={C.chalk}>{title}</Txt> : null}
      {sub ? <Txt x={0} y={size * 0.62} size={subSize} weight={500} fill={C.chalk2} mono>{sub}</Txt> : null}
      {children}
    </g>
  );
};

/** a connection along a polyline: drawn on with p, with dots travelling along it while `live` (t = scene time).
 *  rev sends the dots backwards (gradients). dash draws a dotted path (bypass). */
export const Flow: React.FC<{
  pts: [number, number][]; color?: string; p?: number; o?: number; sw?: number; t?: number; live?: number; rev?: boolean; dash?: string;
  head?: number; speed?: number; n?: number; dotR?: number;
}> = ({ pts, color = C.chalk2, p = 1, o = 1, sw = 3.5, t = 0, live = 0, rev, dash, head = 16, speed = 0.45, n = 3, dotR = 6 }) => {
  if (o <= 0.001 || p <= 0.001) return null;
  const L: number[] = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const tot = L[L.length - 1];
  const at = (u: number): [number, number, number] => {
    const d = clamp(u) * tot;
    let i = 1;
    while (i < pts.length - 1 && L[i] < d) i++;
    const k = (d - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]);
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    return [lerp(x0, x1, k), lerp(y0, y1, k), Math.atan2(y1 - y0, x1 - x0)];
  };
  // the visible part of the path
  const dEnd = p * tot;
  const vis: [number, number][] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    if (L[i] <= dEnd) vis.push(pts[i]);
    else { const [x, y] = at(p); vis.push([x, y]); break; }
  }
  const [ex, ey, ang] = at(p);
  const back = rev ? 0 : head * 0.6;
  const dpath = vis.map((q, i) => `${i ? 'L' : 'M'}${(i === vis.length - 1 ? q[0] - Math.cos(ang) * back : q[0]).toFixed(1)} ${(i === vis.length - 1 ? q[1] - Math.sin(ang) * back : q[1]).toFixed(1)}`).join(' ');
  const hx = rev ? pts[0][0] : ex, hy = rev ? pts[0][1] : ey;
  const ha = rev ? Math.atan2(pts[0][1] - pts[1][1], pts[0][0] - pts[1][0]) : ang;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <path d={dpath} fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dash} />
      {head > 0 && (rev ? p > 0.98 : true) ? (
        <path d={`M ${hx} ${hy} L ${hx - head * Math.cos(ha - 0.42)} ${hy - head * Math.sin(ha - 0.42)} L ${hx - head * Math.cos(ha + 0.42)} ${hy - head * Math.sin(ha + 0.42)} Z`} fill={color} />
      ) : null}
      {live > 0.001 && p > 0.98 ? Array.from({ length: n }, (_, k) => {
        let u = ((t * speed * 300) / tot + k / n) % 1;
        if (rev) u = 1 - u;
        const [x, y] = at(u);
        const fade = Math.sin(Math.PI * (rev ? 1 - u : u));
        return <circle key={k} cx={x} cy={y} r={dotR} fill={color} opacity={live * fade} />;
      }) : null}
    </g>
  );
};

// ------------------------------------------------------------------ concepts
/** one concept row: label, a teal bar for its value, the value. An edit (amber) animates from `v` to `edit.to` with
 *  progress edit.p; the old value stays as a faint ghost outline. (x, y) = left end of the label, vertical centre. */
export const ConceptRow: React.FC<{
  x: number; y: number; label: string; v: number; w?: number; labelW?: number; size?: number; o?: number; p?: number;
  edit?: { to: number; p: number }; digits?: number; hi?: number; barH?: number; color?: string; valueW?: number; dim?: number;
}> = ({ x, y, label, v, w = 260, labelW = 250, size = 26, o = 1, p = 1, edit, digits = 2, hi = 0, barH = 26, color = C.concept, valueW = 80, dim = 0 }) => {
  if (o <= 0.001) return null;
  const ep = edit ? E.io(clamp(edit.p)) : 0;
  const cur = edit ? lerp(v, edit.to, ep) : v;
  const edited = edit && edit.p > 0.001;
  const col = edited ? C.edit : color;
  const bx = x + labelW;
  return (
    <g opacity={(o * (1 - 0.55 * dim)) < 0.999 ? o * (1 - 0.55 * dim) : undefined}>
      {hi > 0.001 ? <rect x={x - 14} y={y - barH * 0.95} width={labelW + w + valueW + 40} height={barH * 1.9} rx={10} fill={rgba(edited ? C.edit : C.concept, 0.12 * hi)}
        stroke={rgba(edited ? C.edit : C.concept, 0.6 * hi)} strokeWidth={2} /> : null}
      <Txt x={x} y={y} size={size} anchor="start" weight={500} fill={C.chalk}>{label}</Txt>
      <rect x={bx} y={y - barH / 2} width={w} height={barH} rx={5} fill={C.bg3} />
      {edited ? <rect x={bx} y={y - barH / 2} width={w * v} height={barH} rx={5} fill="none" stroke={C.concept} strokeWidth={2} strokeDasharray="5 5" opacity={0.7} /> : null}
      <rect x={bx} y={y - barH / 2} width={Math.max(0, w * cur * E.out(clamp(p)))} height={barH} rx={5} fill={col} opacity={0.92} />
      <Txt x={bx + w + 16} y={y} size={size} anchor="start" mono weight={600} fill={edited ? C.edit : C.chalk} o={inv(0.3, 1, p)}>{cur.toFixed(digits)}</Txt>
    </g>
  );
};

/** a column vector of values in brackets: (x, y) = top-left of the bracket, rowH per entry */
export const VecCol: React.FC<{
  x: number; y: number; vals: (number | string)[]; rowH?: number; w?: number; size?: number; color?: string; o?: number; digits?: number;
  cellO?: (i: number) => number; cellColor?: (i: number) => string | undefined; ring?: (i: number) => number; ringColor?: string;
}> = ({ x, y, vals, rowH = 70, w = 120, size = 34, color = C.concept, o = 1, digits = 1, cellO, cellColor, ring, ringColor = C.edit }) => {
  if (o <= 0.001) return null;
  const h = vals.length * rowH;
  const br = (side: 1 | -1) => {
    const xx = side === 1 ? x : x + w;
    return <path d={`M ${xx + 14 * side} ${y} L ${xx} ${y} L ${xx} ${y + h} L ${xx + 14 * side} ${y + h}`} fill="none" stroke={color} strokeWidth={3.5} />;
  };
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      {br(1)}{br(-1)}
      {vals.map((v, i) => {
        const a = cellO ? cellO(i) : 1, rg = ring ? ring(i) : 0;
        return (
          <g key={i}>
            {rg > 0.001 ? <rect x={x + 10} y={y + i * rowH + 6} width={w - 20} height={rowH - 12} rx={8} fill={rgba(ringColor, 0.16 * rg)} stroke={ringColor} strokeWidth={3} opacity={rg} /> : null}
            <Txt x={x + w / 2} y={y + (i + 0.5) * rowH} size={size} mono weight={600} fill={cellColor?.(i) ?? C.chalk} o={a}>
              {typeof v === 'number' ? v.toFixed(digits) : v}
            </Txt>
          </g>
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------------ outputs
/** class shares as horizontal bars that can move between two states: values = lerp(from, to, k).
 *  The leading class is drawn in chalk, the others muted. (x, y) = first row's label start, vertical centre. */
export const ShareBars: React.FC<{
  x: number; y: number; labels: string[]; from: number[]; to?: number[]; k?: number; w?: number; rowH?: number; labelW?: number; size?: number;
  o?: number; p?: number; digits?: number; lead?: boolean; color?: string; valueColor?: string;
}> = ({ x, y, labels, from, to, k = 0, w = 300, rowH = 58, labelW = 330, size = 26, o = 1, p = 1, digits = 2, lead = true, color = C.chalk, valueColor }) => {
  if (o <= 0.001) return null;
  const vals = from.map((v, i) => (to ? lerp(v, to[i], E.io(clamp(k))) : v));
  const top = vals.indexOf(Math.max(...vals));
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      {labels.map((l, i) => {
        const pi = clamp(p * 1.4 - i * 0.2), yy = y + i * rowH, isTop = lead && i === top;
        return (
          <g key={l}>
            <Txt x={x} y={yy} size={size} anchor="start" weight={isTop ? 700 : 500} fill={isTop ? C.chalk : C.chalk2}>{l}</Txt>
            <rect x={x + labelW} y={yy - rowH * 0.27} width={w} height={rowH * 0.54} rx={4} fill={C.bg3} />
            <rect x={x + labelW} y={yy - rowH * 0.27} width={w * vals[i] * E.out(pi)} height={rowH * 0.54} rx={4} fill={color} opacity={isTop || !lead ? 0.95 : 0.4} />
            <Txt x={x + labelW + w + 16} y={yy} size={size} anchor="start" mono weight={isTop ? 700 : 500} fill={valueColor ?? (isTop ? C.chalk : C.chalk2)} o={inv(0.3, 1, pi)}>
              {vals[i].toFixed(digits)}
            </Txt>
          </g>
        );
      })}
    </g>
  );
};

// ------------------------------------------------------------------ matrix
export type MatrixProps = {
  x: number; y: number; vals: (number | string)[][]; cw?: number; ch?: number; size?: number; digits?: number;
  rows?: string[]; rowColors?: string[]; cols?: string[]; colColors?: string[]; headSize?: number;
  cell?: (i: number, j: number) => number; bg?: (i: number, j: number) => string | null; ring?: (i: number, j: number) => { color: string; o: number } | null;
  valColor?: (i: number, j: number) => string; o?: number; headO?: number; frame?: boolean; colHeadY?: number;
};
/** a matrix of numbers with optional row / column headers, per-cell reveal, background tints and rings */
export const Matrix: React.FC<MatrixProps> = ({
  x, y, vals, cw = 120, ch = 70, size = 30, digits = 0, rows, rowColors, cols, colColors, headSize = 24, cell, bg, ring, valColor, o = 1, headO = 1, frame = true, colHeadY,
}) => {
  if (o <= 0.001) return null;
  const R = vals.length, K = vals[0].length;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      {frame ? <rect x={x - 6} y={y - 6} width={K * cw + 12} height={R * ch + 12} rx={10} fill={C.headFill} stroke="#8792A2" strokeWidth={2.5} /> : null}
      {vals.map((row, i) => row.map((v, j) => {
        const a = cell ? cell(i, j) : 1, b = bg ? bg(i, j) : null, rg = ring ? ring(i, j) : null;
        return (
          <g key={`${i}-${j}`}>
            <rect x={x + j * cw + 3} y={y + i * ch + 3} width={cw - 6} height={ch - 6} rx={6} fill={b ?? C.bg3} />
            {a > 0.001 ? <Txt x={x + j * cw + cw / 2} y={y + i * ch + ch / 2} size={size} mono weight={600} o={a}
              fill={valColor ? valColor(i, j) : C.chalk}>{typeof v === 'number' ? v.toFixed(digits) : v}</Txt> : null}
            {rg && rg.o > 0.001 ? <rect x={x + j * cw + 1} y={y + i * ch + 1} width={cw - 2} height={ch - 2} rx={7} fill="none" stroke={rg.color} strokeWidth={4} opacity={rg.o} /> : null}
          </g>
        );
      }))}
      <g opacity={headO < 0.999 ? headO : undefined}>
        {rows?.map((r, i) => (
          <Txt key={`r${i}`} x={x - 22} y={y + i * ch + ch / 2} size={headSize} anchor="end" weight={600} fill={rowColors?.[i] ?? C.chalk2}>{r}</Txt>
        ))}
        {cols?.map((c, j) => (
          <Txt key={`c${j}`} x={x + j * cw + cw / 2} y={colHeadY ?? y - 34} size={headSize} weight={600} fill={colColors?.[j] ?? C.concept}>{c}</Txt>
        ))}
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ signals
/** a waveform: ys sampled at fs, drawn in (x, y, w, h) between seconds t0..t1, drawn on with p.
 *  marks = shaded time windows [s0, s1, colour, label]. Amplitude is scaled by `amp` design units per signal unit. */
export const Wave: React.FC<{
  x: number; y: number; w: number; h: number; ys: number[]; fs: number; t0?: number; t1?: number; color?: string; p?: number; o?: number;
  amp?: number; sw?: number; marks?: [number, number, string, string?, number?][]; axis?: boolean; axisO?: number; hiWindow?: [number, number, string, number];
}> = ({ x, y, w, h, ys, fs, t0 = 0, t1, color = C.input, p = 1, o = 1, amp = 60, sw = 2.6, marks = [], axis = true, axisO = 1, hiWindow }) => {
  if (o <= 0.001) return null;
  const T1 = t1 ?? ys.length / fs;
  const i0 = Math.floor(t0 * fs), i1 = Math.min(ys.length - 1, Math.ceil(T1 * fs));
  const n = Math.max(2, Math.floor(i0 + (i1 - i0) * clamp(p)));
  const X = (s: number) => x + ((s - t0) / (T1 - t0)) * w;
  const pts: string[] = [];
  for (let i = i0; i <= n; i++) pts.push(`${X(i / fs).toFixed(1)},${(y + h / 2 - ys[i] * amp).toFixed(1)}`);
  const seg = (a: number, b: number) => {
    const out: string[] = [];
    for (let i = Math.max(i0, Math.floor(a * fs)); i <= Math.min(n, Math.ceil(b * fs)); i++) out.push(`${X(i / fs).toFixed(1)},${(y + h / 2 - ys[i] * amp).toFixed(1)}`);
    return out.join(' ');
  };
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      {marks.map(([s0, s1, col, label, mo = 1], k) => (mo > 0.001 ? (
        <g key={k} opacity={mo}>
          <rect x={X(s0)} y={y - 6} width={X(s1) - X(s0)} height={h + 12} rx={8} fill={rgba(col, 0.14)} stroke={col} strokeWidth={2.5} />
          {label ? <Txt x={(X(s0) + X(s1)) / 2} y={y - 26} size={22} weight={600} fill={col}>{label}</Txt> : null}
        </g>
      ) : null))}
      {axis ? (
        <g opacity={axisO}>
          <line x1={x} y1={y + h + 14} x2={x + w} y2={y + h + 14} stroke={C.line2} strokeWidth={2} />
          {Array.from({ length: Math.floor(T1 - t0) + 1 }, (_, k) => (
            <g key={k}>
              <line x1={X(t0 + k)} y1={y + h + 14} x2={X(t0 + k)} y2={y + h + 22} stroke={C.line2} strokeWidth={2} />
              <Txt x={X(t0 + k)} y={y + h + 40} size={20} mono fill={C.mute}>{`${t0 + k} s`}</Txt>
            </g>
          ))}
        </g>
      ) : null}
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
      {hiWindow && hiWindow[3] > 0.001 ? <polyline points={seg(hiWindow[0], hiWindow[1])} fill="none" stroke={hiWindow[2]} strokeWidth={sw + 1.5} opacity={hiWindow[3]} strokeLinejoin="round" /> : null}
    </g>
  );
};

// ------------------------------------------------------------------ sensitivity map
/** an occlusion-sensitivity grid drawn as white luminance over a photo frame. vals[r][c] >= 0; vmax normalizes. */
export const SensMap: React.FC<{ R: Rect; vals: number[][]; vmax?: number; o?: number; draw?: number; gamma?: number; id?: string }> = ({
  R, vals, vmax, o = 1, draw = 1, gamma = 1.3, id = 'sens',
}) => {
  if (o <= 0.001 || draw <= 0.001) return null;
  const n = vals.length, m = vals[0].length;
  const mx = vmax ?? Math.max(...vals.flat());
  const cw = R.w / m, chh = R.h / n;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <defs>
        <filter id={id} x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation={cw * 0.45} /></filter>
        <clipPath id={`${id}-clip`}><rect x={R.x} y={R.y} width={R.w} height={R.h} rx={8} /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-clip)`}>
        <g filter={`url(#${id})`}>
          {vals.map((row, r) => row.map((v, c) => {
            const a = Math.pow(clamp(v / mx), gamma) * clamp(draw * 1.8 - ((r + c) / (n + m)) * 0.8);
            return a > 0.01 ? <rect key={`${r}-${c}`} x={R.x + c * cw} y={R.y + r * chh} width={cw + 0.5} height={chh + 0.5} fill={C.heat} opacity={a * 0.82} /> : null;
          }))}
        </g>
      </g>
    </g>
  );
};

// ------------------------------------------------------------------ intervention slider
/** an amber slider for a human edit: track 0..1, knob at value v (which the caller animates) */
export const Slider: React.FC<{ x: number; y: number; w: number; v: number; o?: number; color?: string; label?: string; size?: number; from?: number }> = ({
  x, y, w, v, o = 1, color = C.edit, label, size = 22, from,
}) => {
  if (o <= 0.001) return null;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <rect x={x} y={y - 4} width={w} height={8} rx={4} fill={C.line2} />
      <rect x={x} y={y - 4} width={w * clamp(v)} height={8} rx={4} fill={color} />
      {from !== undefined ? <circle cx={x + w * from} cy={y} r={9} fill="none" stroke={C.concept} strokeWidth={2.5} strokeDasharray="4 3" /> : null}
      <circle cx={x + w * clamp(v)} cy={y} r={15} fill={color} stroke="#0B0F14" strokeWidth={3} />
      {label ? <Txt x={x + w + 24} y={y} size={size} anchor="start" mono weight={700} fill={color}>{label}</Txt> : null}
    </g>
  );
};

// ------------------------------------------------------------------ maths inside SVG
/** KaTeX inside an SVG layer (foreignObject), centred on (x, y) by default. Use this for every symbol such as
 *  \\hat{c}, \\hat{y}, g_\\theta, f_\\phi: plain-text Unicode accents and Greek render poorly in the UI fonts. */
export const MathSvg: React.FC<{ x: number; y: number; tex: string; size?: number; color?: string; o?: number; anchor?: 'start' | 'middle' | 'end' }> = ({
  x, y, tex, size = 30, color = C.chalk, o = 1, anchor = 'middle',
}) => {
  if (o <= 0.001) return null;
  const W = Math.max(200, size * 12), Hh = size * 3;
  const x0 = anchor === 'start' ? x : anchor === 'end' ? x - W : x - W / 2;
  const jc = anchor === 'start' ? 'flex-start' : anchor === 'end' ? 'flex-end' : 'center';
  return (
    <foreignObject x={x0} y={y - Hh / 2} width={W} height={Hh} opacity={o < 0.999 ? o : undefined} style={{ overflow: 'visible', pointerEvents: 'none' }}>
      <div className="tex" style={{ width: W, height: Hh, display: 'flex', alignItems: 'center', justifyContent: jc, fontSize: size, color, lineHeight: 1 }}
        dangerouslySetInnerHTML={{ __html: texHTML(tex, false) }} />
    </foreignObject>
  );
};

// ------------------------------------------------------------------ the small architecture map, top right
export type MapKey = 'x' | 'g' | 'c' | 'f' | 'y';
const MAP: { k: MapKey; t: string; kind: Kind }[] = [
  { k: 'x', t: 'x', kind: 'input' }, { k: 'g', t: 'g_\\theta', kind: 'input' }, { k: 'c', t: '\\hat{c}', kind: 'concept' },
  { k: 'f', t: 'f_\\phi', kind: 'head' }, { k: 'y', t: '\\hat{y}', kind: 'output' },
];
/** x -> g_theta -> c hat -> f_phi -> y hat, top right; highlighted blocks are the ones the scene is about */
export const ArchMap: React.FC<{ on?: MapKey[]; o?: number; x?: number; y?: number }> = ({ on = [], o = 1, x = 1430, y = 62 }) => {
  if (o <= 0.001) return null;
  const bw = 66, gap = 12, bh = 36;
  return (
    <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0, opacity: o < 0.999 ? o : undefined }}>
      {MAP.map(({ k, t, kind }, i) => {
        const a = on.includes(k);
        const col = kind === 'head' ? '#9AA6B5' : KC[kind];
        const xx = x + i * (bw + gap);
        return (
          <g key={k}>
            {i > 0 ? <line x1={xx - gap} y1={y + bh / 2} x2={xx} y2={y + bh / 2} stroke={C.line2} strokeWidth={2} /> : null}
            <rect x={xx} y={y} width={bw} height={bh} rx={7} fill={a ? rgba(col, 0.26) : 'none'} stroke={a ? col : C.line2} strokeWidth={a ? 2.5 : 1.5} />
            <MathSvg x={xx + bw / 2} y={y + bh / 2} tex={t} size={22} color={a ? C.chalk : C.mute} />
          </g>
        );
      })}
    </svg>
  );
};

/** a pencil glyph marking a human edit (amber), centred on (x, y) */
export const EditMark: React.FC<{ x: number; y: number; s?: number; o?: number; color?: string }> = ({ x, y, s = 1, o = 1, color = C.edit }) =>
  o <= 0.001 || s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s}) rotate(-45)`} opacity={o < 0.999 ? o : undefined}>
      <rect x={-6} y={-22} width={12} height={34} rx={2} fill={color} />
      <path d="M -6 12 L 6 12 L 0 24 Z" fill={color} />
      <rect x={-6} y={-28} width={12} height={5} rx={1.5} fill="#0B0F14" opacity={0.6} />
    </g>
  );

/** a person glyph (head + shoulders) for "a human checks", in the edit colour */
export const Person: React.FC<{ x: number; y: number; s?: number; o?: number; color?: string }> = ({ x, y, s = 1, o = 1, color = C.edit }) =>
  o <= 0.001 || s <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o < 0.999 ? o : undefined}>
      <circle cx={0} cy={-18} r={15} fill={color} />
      <path d="M -28 26 Q -28 2 0 2 Q 28 2 28 26 Z" fill={color} />
    </g>
  );

/** a cross-out (two strokes) over a rectangle, drawn on with p */
export const Cross: React.FC<{ x: number; y: number; w: number; h: number; p?: number; o?: number; color?: string; sw?: number }> = ({ x, y, w, h, p = 1, o = 1, color = C.bad, sw = 5 }) =>
  o <= 0.001 || p <= 0.001 ? null : (
    <g opacity={o < 0.999 ? o : undefined} stroke={color} strokeWidth={sw} strokeLinecap="round">
      <line x1={x} y1={y} x2={x + w * clamp(p * 2)} y2={y + h * clamp(p * 2)} />
      {p > 0.5 ? <line x1={x + w} y1={y} x2={x + w - w * clamp(p * 2 - 1)} y2={y + h * clamp(p * 2 - 1)} /> : null}
    </g>
  );

// ------------------------------------------------------------------ the variant maths card (revision of 11 October)
// Every variant scene ends on the same card: how the path x -> c -> y is computed, what is trained, and what data it needs.
// rows are KaTeX strings; `p` reveals the rows one after another (0..1). Centred, x 240 to 1680, y 250 to 900.
export type VariantRows = { g: string; c: string; f: string; train: string; data: string };
const VLABEL: [keyof VariantRows, string][] = [
  ['g', 'concept predictor'], ['c', 'what reaches the head'], ['f', 'task head'], ['train', 'what is trained'], ['data', 'data needed'],
];
export const VariantCard: React.FC<{ name: string; rows: VariantRows; o?: number; p?: number; y0?: number }> = ({ name, rows, o = 1, p = 1, y0 = 250 }) => {
  if (o <= 0.001) return null;
  const rowH = 118;
  return (
    <AbsoluteFill style={{ opacity: o }}>
      <svg viewBox="0 0 1920 1080" width={1920} height={1080} style={{ position: 'absolute', left: 0, top: 0 }}>
        <rect x={240} y={y0} width={1440} height={110 + rowH * 5} rx={18} fill={C.bg2} stroke={C.line} strokeWidth={2} />
        {VLABEL.map(([, ], i) => (i ? <line key={i} x1={280} x2={1640} y1={y0 + 96 + rowH * i} y2={y0 + 96 + rowH * i} stroke={C.line} strokeWidth={1.5} opacity={clamp(p * 5 - i)} /> : null))}
      </svg>
      <HText x={290} y={y0 + 52} ay="middle" size={34} weight={700} color={C.chalk}>{name}</HText>
      <HText x={1630} y={y0 + 52} ax="right" ay="middle" size={22} color={C.mute} mono>x → ĉ → ŷ</HText>
      {VLABEL.map(([k, lab], i) => {
        const oi = clamp(p * 5 - i);
        const y = y0 + 96 + rowH * i + rowH / 2;
        return (
          <React.Fragment key={k}>
            <HText x={290} y={y} ay="middle" size={24} color={C.chalk2} o={oi}>{lab}</HText>
            <Tex x={720} y={y} tex={rows[k]} size={k === 'train' || k === 'data' ? 34 : 40} o={oi} />
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};
