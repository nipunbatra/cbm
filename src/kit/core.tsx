// Core drawing vocabulary (shared with the YOLO film). All positions are in 1920 x 1080 design units (rendered x2 for 4K).
// Scenes stack layers inside <Stage>: photos (HTML <Img>), then <Svg> drawing layers, then <Tex>/<HText> HTML text.
import React from 'react';
import katex from 'katex';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { C, F, H, TEX_MACROS, W } from './theme';
import { clamp, inv, E } from './anim';
import type { ScenePlan } from './timeline';

export type SceneProps = { t: number; P: ScenePlan };

// ------------------------------------------------------------------ beat timing helpers
/** start (s, scene-relative) of the k-th beat of this scene, 1-indexed */
export const bs = (P: ScenePlan, k: number) => P.beats[k - 1].start - P.start;
/** the slide heading of beat k (from the narration file's [[...]]), or '' */
export const bh = (P: ScenePlan, k: number) => P.beats[k - 1].head ?? '';
/** end of the k-th beat */
export const be = (P: ScenePlan, k: number) => P.beats[k - 1].end - P.start;
/** start of a word inside beat k (first word beginning with `word`, n-th hit) */
export const bw = (P: ScenePlan, k: number, word: string, n = 0) => P.w(P.beats[k - 1].id, word, n);

// ------------------------------------------------------------------ stage and layers
export const Stage: React.FC<{ children?: React.ReactNode; bg?: string }> = ({ children, bg = C.bg }) => (
  <AbsoluteFill style={{ background: bg, overflow: 'hidden' }}>
    <AbsoluteFill
      style={{
        background: 'radial-gradient(ellipse 80% 70% at 50% 45%, rgba(255,255,255,0.035) 0%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.35) 100%)',
      }}
    />
    {children}
  </AbsoluteFill>
);

/** a full-frame SVG drawing layer in design units */
export const Svg: React.FC<{ children?: React.ReactNode; o?: number }> = ({ children, o = 1 }) =>
  o <= 0.001 ? null : (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, opacity: o < 0.999 ? o : undefined, overflow: 'visible' }}>
      {children}
    </svg>
  );

type GP = { x?: number; y?: number; s?: number; r?: number; o?: number; children?: React.ReactNode };
export const G: React.FC<GP> = ({ x = 0, y = 0, s = 1, r = 0, o = 1, children }) =>
  o <= 0.001 ? null : (
    <g transform={`translate(${x} ${y})${r ? ` rotate(${r})` : ''}${s !== 1 ? ` scale(${s})` : ''}`} opacity={o < 0.999 ? o : undefined}>
      {children}
    </g>
  );

// ------------------------------------------------------------------ text
type TxtP = {
  x?: number; y?: number; size?: number; weight?: number; fill?: string; anchor?: 'start' | 'middle' | 'end';
  mono?: boolean; o?: number; children: React.ReactNode; track?: number; italic?: boolean;
};
/** SVG text, vertically centred on y */
export const Txt: React.FC<TxtP> = ({ x = 0, y = 0, size = 30, weight = 500, fill = C.chalk, anchor = 'middle', mono, o = 1, children, track = 0, italic }) =>
  o <= 0.001 ? null : (
    <text x={x} y={y} fontSize={size} fontWeight={weight} fill={fill} textAnchor={anchor} dominantBaseline="central"
      fontFamily={mono ? F.mono : F.sans} opacity={o < 0.999 ? o : undefined} letterSpacing={track || undefined} fontStyle={italic ? 'italic' : undefined}>
      {children}
    </text>
  );

type AnchorX = 'left' | 'center' | 'right';
type AnchorY = 'top' | 'middle' | 'bottom';
const tf = (ax: AnchorX, ay: AnchorY) => `translate(${ax === 'left' ? '0' : ax === 'center' ? '-50%' : '-100%'}, ${ay === 'top' ? '0' : ay === 'middle' ? '-50%' : '-100%'})`;

/** HTML text block (wraps at width), positioned by an anchor point */
export const HText: React.FC<{
  x: number; y: number; w?: number; size?: number; weight?: number; color?: string; o?: number; ax?: AnchorX; ay?: AnchorY;
  align?: 'left' | 'center' | 'right'; mono?: boolean; lh?: number; children: React.ReactNode; dy?: number; s?: number;
}> = ({ x, y, w, size = 30, weight = 500, color = C.chalk, o = 1, ax = 'left', ay = 'top', align, mono, lh = 1.3, children, dy = 0, s = 1 }) =>
  o <= 0.001 ? null : (
    <div style={{
      position: 'absolute', left: x, top: y + dy, width: w, transform: `${tf(ax, ay)}${s !== 1 ? ` scale(${s})` : ''}`, transformOrigin: 'center',
      fontFamily: mono ? F.mono : F.sans, fontSize: size, fontWeight: weight, color, opacity: o, lineHeight: lh,
      textAlign: align ?? (ax === 'center' ? 'center' : ax === 'right' ? 'right' : 'left'), whiteSpace: w ? 'normal' : 'nowrap',
    }}>
      {children}
    </div>
  );

const texCache = new Map<string, string>();
export const texHTML = (tex: string, display = true) => {
  const k = `${display ? 'D' : 'I'}${tex}`;
  let h = texCache.get(k);
  if (!h) {
    h = katex.renderToString(tex, { displayMode: display, throwOnError: true, macros: { ...TEX_MACROS }, output: 'html', strict: 'ignore' });
    texCache.set(k, h);
  }
  return h;
};

/** KaTeX equation positioned by an anchor point */
export const Tex: React.FC<{
  x: number; y: number; tex: string; size?: number; color?: string; o?: number; ax?: AnchorX; ay?: AnchorY; s?: number; dy?: number; dx?: number;
}> = ({ x, y, tex, size = 44, color = C.chalk, o = 1, ax = 'left', ay = 'middle', s = 1, dy = 0, dx = 0 }) =>
  o <= 0.001 ? null : (
    <div
      className="tex"
      style={{
        position: 'absolute', left: x + dx, top: y + dy, fontSize: size, color, opacity: o, whiteSpace: 'nowrap',
        transform: `${tf(ax, ay)}${s !== 1 ? ` scale(${s})` : ''}`, transformOrigin: ax === 'left' ? 'left center' : ax === 'right' ? 'right center' : 'center',
      }}
      dangerouslySetInnerHTML={{ __html: texHTML(tex, false) }}
    />
  );

// ------------------------------------------------------------------ header and captions
/** part number and title, top left; fades in at t0 */
export const Header: React.FC<{ t: number; part?: number | string; title: string; sub?: string; t0?: number }> = ({ t, part, title, sub, t0 = 0 }) => {
  if ((globalThis as unknown as { CBM_CLEAN?: boolean }).CBM_CLEAN) return null; // slide stills: the slide supplies its own title
  const o = inv(t0, t0 + 0.5, t);
  return (
    <>
      {part !== undefined ? <HText x={96} y={58} size={22} weight={600} color={C.mute} o={o} mono>{`PART ${part}`}</HText> : null}
      <HText x={96} y={86} size={44} weight={600} color={C.chalk} o={o}>{title}</HText>
      {sub ? <HText x={96} y={146} size={26} weight={500} color={C.chalk2} o={o}>{sub}</HText> : null}
    </>
  );
};

// ------------------------------------------------------------------ the photograph and normalized coordinates
/** a square photo frame: normalized image coords (0..1) map to design units through x0, y0 and size s */
export type Frame = { x: number; y: number; s: number };
export const fx = (Fr: Frame, v: number) => Fr.x + v * Fr.s;
export const fy = (Fr: Frame, v: number) => Fr.y + v * Fr.s;

export const Photo: React.FC<{ Fr: Frame; src: string; o?: number; dim?: number; crop?: [number, number, number]; radius?: number }> = ({ Fr, src, o = 1, dim = 0, crop, radius = 6 }) => {
  if (o <= 0.001) return null;
  // crop = [cx, cy, zoom]: show a zoomed window of the image centred on (cx, cy) (normalized), zoom >= 1
  const z = crop ? crop[2] : 1;
  const ox = crop ? clamp(crop[0] - 0.5 / z, 0, 1 - 1 / z) : 0;
  const oy = crop ? clamp(crop[1] - 0.5 / z, 0, 1 - 1 / z) : 0;
  return (
    <div style={{ position: 'absolute', left: Fr.x, top: Fr.y, width: Fr.s, height: Fr.s, overflow: 'hidden', borderRadius: radius, opacity: o, boxShadow: '0 18px 50px rgba(0,0,0,0.45)' }}>
      <Img src={staticFile(`img/${src}`)} style={{ position: 'absolute', width: Fr.s * z, height: Fr.s * z, left: -ox * Fr.s * z, top: -oy * Fr.s * z }} />
      {dim > 0 ? <div style={{ position: 'absolute', inset: 0, background: `rgba(8,11,15,${dim})` }} /> : null}
    </div>
  );
};

/** map a box given in the full image's normalized coords into a cropped/zoomed frame */
export const cropFrame = (Fr: Frame, crop: [number, number, number]): Frame => {
  const z = crop[2];
  const ox = clamp(crop[0] - 0.5 / z, 0, 1 - 1 / z), oy = clamp(crop[1] - 0.5 / z, 0, 1 - 1 / z);
  return { x: Fr.x - ox * Fr.s * z, y: Fr.y - oy * Fr.s * z, s: Fr.s * z };
};

export type Bx = [number, number, number, number] | number[]; // xc, yc, w, h (normalized)

/** a box in normalized image coords, drawn on (draw 0..1), with an optional label tag */
export const NBox: React.FC<{
  Fr: Frame; b: Bx; color: string; draw?: number; o?: number; sw?: number; dash?: string; fill?: number;
  label?: string; labelSide?: 'top' | 'bottom' | 'inside'; labelSize?: number; cross?: number; clip?: boolean;
}> = ({ Fr, b, color, draw = 1, o = 1, sw = 4, dash, fill = 0, label, labelSide = 'top', labelSize = 22, cross = 0 }) => {
  if (o <= 0.001 || draw <= 0.001) return null;
  const x0 = fx(Fr, b[0] - b[2] / 2), y0 = fy(Fr, b[1] - b[3] / 2), w = b[2] * Fr.s, h = b[3] * Fr.s;
  const per = 2 * (w + h);
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      {fill > 0 ? <rect x={x0} y={y0} width={w} height={h} fill={color} opacity={fill * draw} /> : null}
      <rect x={x0} y={y0} width={w} height={h} fill="none" stroke={color} strokeWidth={sw} strokeLinejoin="round"
        strokeDasharray={dash ?? (draw < 0.999 ? `${per * draw} ${per}` : undefined)} />
      {label && draw > 0.6 ? <Tag x={x0 - sw / 2} y={labelSide === 'bottom' ? y0 + h + sw / 2 : labelSide === 'inside' ? y0 + sw / 2 : y0 - sw / 2}
        text={label} color={color} size={labelSize} o={inv(0.6, 1, draw)} below={labelSide !== 'top'} /> : null}
      {cross > 0 ? (
        <g stroke={C.bad} strokeWidth={sw + 1} strokeLinecap="round" opacity={0.95}>
          <line x1={x0} y1={y0} x2={x0 + w * cross} y2={y0 + h * cross} />
          <line x1={x0 + w} y1={y0} x2={x0 + w - w * cross} y2={y0 + h * cross} />
        </g>
      ) : null}
    </g>
  );
};

/** a filled label tag; (x, y) is its bottom-left corner (or top-left when below) */
export const Tag: React.FC<{ x: number; y: number; text: string; color: string; size?: number; o?: number; below?: boolean; dark?: boolean; anchor?: 'start' | 'end' }> = ({
  x, y, text, color, size = 22, o = 1, below, dark = true, anchor = 'start',
}) => {
  if (o <= 0.001) return null;
  const w = text.length * size * 0.62 + size * 0.9, h = size * 1.45;
  const xx = anchor === 'end' ? x - w : x;
  const yy = below ? y : y - h;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <rect x={xx} y={yy} width={w} height={h} rx={4} fill={color} />
      <text x={xx + size * 0.45} y={yy + h / 2 + 1} fontSize={size} fontWeight={700} fill={dark ? '#0B0F14' : C.chalk} dominantBaseline="central"
        fontFamily={F.mono}>{text}</text>
    </g>
  );
};

/** the S x S grid over a frame, lines drawn on progressively (draw 0..1) */
export const Grid: React.FC<{ Fr: Frame; n?: number; draw?: number; o?: number; color?: string; sw?: number; labels?: number }> = ({
  Fr, n = 7, draw = 1, o = 1, color = C.line2, sw = 2, labels = 0,
}) => {
  if (o <= 0.001 || draw <= 0.001) return null;
  const lines = [];
  for (let i = 0; i <= n; i++) {
    const d = clamp(draw * 1.6 - (i / n) * 0.6);
    const v = Fr.x + (i / n) * Fr.s, u = Fr.y + (i / n) * Fr.s;
    lines.push(<line key={`v${i}`} x1={v} y1={Fr.y} x2={v} y2={Fr.y + Fr.s * d} stroke={color} strokeWidth={sw} />);
    lines.push(<line key={`h${i}`} x1={Fr.x} y1={u} x2={Fr.x + Fr.s * d} y2={u} stroke={color} strokeWidth={sw} />);
  }
  const cs = Fr.s / n;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      {lines}
      {labels > 0.001 ? (
        <g opacity={labels}>
          {Array.from({ length: n }, (_, i) => (
            <React.Fragment key={i}>
              <Txt x={Fr.x + (i + 0.5) * cs} y={Fr.y - 22} size={22} mono fill={C.chalk2}>{String(i)}</Txt>
              <Txt x={Fr.x - 22} y={Fr.y + (i + 0.5) * cs} size={22} mono fill={C.chalk2}>{String(i)}</Txt>
            </React.Fragment>
          ))}
        </g>
      ) : null}
    </g>
  );
};

/** highlight one grid cell (row r, column c) */
export const Cell: React.FC<{ Fr: Frame; r: number; c: number; n?: number; o?: number; color?: string; fill?: number; sw?: number; pulse?: number }> = ({
  Fr, r, c, n = 8, o = 1, color = C.input, fill = 0.22, sw = 5, pulse = 0,
}) => {
  if (o <= 0.001) return null;
  const cs = Fr.s / n;
  const g = pulse * 6;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <rect x={Fr.x + c * cs - g / 2} y={Fr.y + r * cs - g / 2} width={cs + g} height={cs + g} fill={color} fillOpacity={fill} stroke={color} strokeWidth={sw} />
    </g>
  );
};

/** centre marker: a dot with a small cross */
export const Centre: React.FC<{ x: number; y: number; color: string; o?: number; s?: number; r?: number }> = ({ x, y, color, o = 1, s = 1, r = 9 }) =>
  o <= 0.001 || s <= 0.001 ? null : (
    <g opacity={o < 0.999 ? o : undefined} transform={`translate(${x} ${y}) scale(${s})`}>
      <circle r={r + 4} fill="#0B0F14" opacity={0.55} />
      <circle r={r} fill={color} />
      <line x1={-r * 2.2} x2={r * 2.2} y1={0} y2={0} stroke={color} strokeWidth={2.5} />
      <line y1={-r * 2.2} y2={r * 2.2} x1={0} x2={0} stroke={color} strokeWidth={2.5} />
    </g>
  );

/** straight arrow from (x1,y1) to (x2,y2), drawn on with p */
export const Arrow: React.FC<{ x1: number; y1: number; x2: number; y2: number; color?: string; sw?: number; p?: number; o?: number; head?: number; dash?: string }> = ({
  x1, y1, x2, y2, color = C.chalk2, sw = 3.5, p = 1, o = 1, head = 16, dash,
}) => {
  if (o <= 0.001 || p <= 0.001) return null;
  const xe = x1 + (x2 - x1) * p, ye = y1 + (y2 - y1) * p;
  const a = Math.atan2(ye - y1, xe - x1);
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <line x1={x1} y1={y1} x2={xe - Math.cos(a) * head * 0.6} y2={ye - Math.sin(a) * head * 0.6} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeDasharray={dash} />
      <path d={`M ${xe} ${ye} L ${xe - head * Math.cos(a - 0.42)} ${ye - head * Math.sin(a - 0.42)} L ${xe - head * Math.cos(a + 0.42)} ${ye - head * Math.sin(a + 0.42)} Z`} fill={color} />
    </g>
  );
};

/** rounded panel */
export const Panel: React.FC<{ x: number; y: number; w: number; h: number; o?: number; fill?: string; stroke?: string; r?: number; sw?: number }> = ({
  x, y, w, h, o = 1, fill = C.bg2, stroke = C.line, r = 14, sw = 2,
}) => (o <= 0.001 ? null : <rect x={x} y={y} width={w} height={h} rx={r} fill={fill} stroke={stroke} strokeWidth={sw} opacity={o < 0.999 ? o : undefined} />);

/** horizontal probability bars: labels, values in 0..1, grow with p */
export const Bars: React.FC<{
  x: number; y: number; labels: string[]; values: number[]; color?: string; w?: number; rowH?: number; p?: number; o?: number; size?: number;
  highlight?: number; labelW?: number; digits?: number;
}> = ({ x, y, labels, values, color = C.chalk2, w = 360, rowH = 58, p = 1, o = 1, size = 28, highlight = -1, labelW = 150, digits = 2 }) => {
  if (o <= 0.001) return null;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      {labels.map((l, i) => {
        const pi = clamp(p * 1.4 - i * 0.2);
        const yy = y + i * rowH;
        return (
          <g key={l}>
            <Txt x={x} y={yy} size={size} anchor="start" mono weight={i === highlight ? 700 : 500} fill={i === highlight ? C.chalk : C.chalk2}>{l}</Txt>
            <rect x={x + labelW} y={yy - rowH * 0.28} width={w} height={rowH * 0.56} rx={4} fill={C.bg3} />
            <rect x={x + labelW} y={yy - rowH * 0.28} width={w * values[i] * E.out(pi)} height={rowH * 0.56} rx={4} fill={color} opacity={i === highlight || highlight < 0 ? 1 : 0.55} />
            <Txt x={x + labelW + w + 18} y={yy} size={size} anchor="start" mono fill={C.chalk} o={inv(0.3, 1, pi)}>{values[i].toFixed(digits)}</Txt>
          </g>
        );
      })}
    </g>
  );
};

/** captions burned into the captioned master: the current beat's caption, bottom centre */
export const CaptionBar: React.FC<{ text: string; o?: number }> = ({ text, o = 1 }) =>
  !text || o <= 0.001 ? null : (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 34, display: 'flex', justifyContent: 'center', opacity: o }}>
      <div style={{
        maxWidth: 1500, padding: '10px 26px', background: 'rgba(5,8,11,0.82)', borderRadius: 8, color: '#FFFFFF',
        fontFamily: F.sans, fontWeight: 500, fontSize: 34, lineHeight: 1.3, textAlign: 'center', whiteSpace: 'pre-line',
      }}>{text}</div>
    </div>
  );

export const fmt = (v: number, d = 2) => v.toFixed(d);
export { E, clamp, inv };

// ------------------------------------------------------------------ slide-style text (revision 2, 11 October)
// Colour-coded prose: words take the colour of the symbol they name, so text and maths read as one system.
//   {x:photo}  input (blue)      {c:concepts}  concepts (teal)     {f:task head}  head (light grey)
//   {e:edit}   human edit (amber) {l:loss}     loss (coral)        {k:leak}       leakage (purple)
//   {y:answer} output (white, bold) {m:muted}   muted               $...$          inline KaTeX (macros allowed)
export const ROLE: Record<string, string> = {
  x: C.input, c: C.concept, f: '#9AA6B5', e: C.edit, l: C.loss, k: C.leak, y: C.chalk, m: C.mute,
};
export function richHTML(src: string): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let out = '', i = 0;
  const re = /\$([^$]+)\$|\{([xcfelkym]):([^}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src))) {
    out += esc(src.slice(i, m.index));
    if (m[1] !== undefined) out += `<span class="tex">${texHTML(m[1], false)}</span>`;
    else out += `<span style="color:${ROLE[m[2]]};${m[2] === 'y' ? 'font-weight:700;' : ''}">${esc(m[3])}</span>`;
    i = re.lastIndex;
  }
  return out + esc(src.slice(i));
}
/** a paragraph of colour-coded prose (see richHTML); width w wraps */
export const Rich: React.FC<{
  x: number; y: number; text: string; w?: number; size?: number; weight?: number; color?: string; o?: number;
  ax?: AnchorX; ay?: AnchorY; align?: 'left' | 'center' | 'right'; lh?: number;
}> = ({ x, y, text, w, size = 34, weight = 500, color = C.chalk, o = 1, ax = 'left', ay = 'top', align, lh = 1.35 }) =>
  o <= 0.001 ? null : (
    <div style={{ position: 'absolute', left: x, top: y, width: w, fontSize: size, fontWeight: weight, color, opacity: o < 0.999 ? o : undefined,
      lineHeight: lh, fontFamily: F.sans, textAlign: align ?? (ax === 'center' ? 'center' : ax === 'right' ? 'right' : 'left'),
      transform: tf(ax, ay), whiteSpace: w ? 'normal' : 'nowrap' }}
      dangerouslySetInnerHTML={{ __html: richHTML(text) }} />
  );
/** the slide's own heading: one sentence that states the slide's single idea (below the scene header) */
export const SlideHead: React.FC<{ text: string; o?: number; y?: number }> = ({ text, o = 1, y = 196 }) => (
  <Rich x={96} y={y} text={text} size={44} weight={650} o={o} w={1600} />
);
