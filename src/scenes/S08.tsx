// s08 Part 8 · What if the concepts are incomplete? (revision 2: one idea per slide, 11 slides, one per beat)
// 8.1 motivation: only named properties pass the vocabulary; "shape" is dropped at the gate
// 8.2 the two objects: blue circle (class A), blue square (class B), drawn in the object's own colour
// 8.3 the vocabulary (colour, size) and the two concept vectors [blue = 1, large = 0] (D.incomplete)
// 8.4 the vectors side by side are equal; c(x1) = c(x2), y1 != y2
// 8.5 both objects travel into the bottleneck: the outline (shape) peels off, two identical vectors go on
// 8.6 the task head receives identical vectors and gives the same output (any head, linear, neural net)
// 8.7 best possible accuracy: one right, one wrong, 50 % (D.incomplete.best_accuracy)
// 8.8 sufficiency in words: x -> c -> y, the direct x -> y arc adds nothing once c is known
// 8.9 the same in symbols, aligned under the words; it fails here
// 8.10 what a strict CBM guarantees: y hat = f(c hat), c hat = g(x); the true label is a property of the vocabulary
// 8.11 the fix: more exact values do not help; add shape, the vectors now differ
// Slides replace each other: the old one fades out just before a beat, the new one fades in on its first words.
import React from 'react';
import { C } from '../kit/theme';
import { E, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, bs, bw, bh, inv, type SceneProps } from '../kit/core';
import { ArchMap, Block, Cross, EvTag, Flow, MathSvg, Pill, VecCol, rgba } from '../kit/cbm';
import { TexSteps } from '../kit/slots';
import { lerp, rnd } from '../kit/anim';
import { D } from '../kit/data';

const INC = D.incomplete;
const VOC: string[] = INC.vocab; // blue, large
const OBJ: { name: string; shape: string; c: number[]; y: string }[] = INC.objects;
const OBJ_BLUE = '#3B6FD8'; // the physical colour of the synthetic objects (not a role colour)
const PCT = Math.round(INC.best_accuracy * 100);
const SHAPEV = [0, 1]; // the added concept "square?" for circle / square (constructed, structural 0 / 1)

/** one slide: a full-frame layer with its own opacity */
const Slide: React.FC<{ o: number; children?: React.ReactNode }> = ({ o, children }) =>
  o <= 0.001 ? null : <div style={{ position: 'absolute', inset: 0, opacity: o < 0.999 ? o : undefined }}>{children}</div>;

/** an object in its physical colour: circle (r) or square (side 2r); outline 0..1 */
const Obj: React.FC<{ kind: string; x: number; y: number; r: number; s?: number; o?: number; outline?: number; glow?: number }> = ({ kind, x, y, r, s = 1, o = 1, outline = 1, glow = 0 }) => {
  if (o <= 0.001 || s <= 0.001) return null;
  const R = r * s;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      {glow > 0.001 ? (kind === 'circle'
        ? <circle cx={x} cy={y} r={R + 14} fill="none" stroke={C.chalk} strokeWidth={3} opacity={0.6 * glow} strokeDasharray="6 8" />
        : <rect x={x - R - 14} y={y - R - 14} width={2 * R + 28} height={2 * R + 28} rx={10} fill="none" stroke={C.chalk} strokeWidth={3} opacity={0.6 * glow} strokeDasharray="6 8" />) : null}
      {kind === 'circle'
        ? <circle cx={x} cy={y} r={R} fill={OBJ_BLUE} stroke={C.chalk} strokeWidth={5 * outline} strokeOpacity={outline} />
        : <rect x={x - R} y={y - R} width={2 * R} height={2 * R} rx={6} fill={OBJ_BLUE} stroke={C.chalk} strokeWidth={5 * outline} strokeOpacity={outline} />}
    </g>
  );
};

/** a tick mark */
const Tick: React.FC<{ x: number; y: number; o?: number }> = ({ x, y, o = 1 }) =>
  o <= 0.001 ? null : <path d={`M ${x - 14} ${y} l 11 12 l 22 -26`} fill="none" stroke={C.good} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={o} />;

// ------------------------------------------------------------------ 8.5 the bottleneck animation
const LY = [420, 720], OX = 300, RAD = 86;
const MOUTH = 610, THROAT = 740, EXIT = 820; // the gate
const VX5 = 900, VW = 100, VRH = 62;
const HX5 = 1400, HY5 = 570;

/** outline segments of a shape centred at (0, 0): [x1, y1, x2, y2, nx, ny, front] */
const segs = (kind: string): number[][] => {
  const out: number[][] = [];
  if (kind === 'circle') {
    const n = 28;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2;
      out.push([Math.cos(a0) * RAD, Math.sin(a0) * RAD, Math.cos(a1) * RAD, Math.sin(a1) * RAD, Math.cos(am), Math.sin(am), (Math.cos(am) + 1) / 2]);
    }
  } else {
    const h = RAD, m = 7;
    const sides: [number, number, number, number, number, number][] = [[h, -h, h, h, 1, 0], [h, h, -h, h, 0, 1], [-h, h, -h, -h, -1, 0], [-h, -h, h, -h, 0, -1]];
    for (const [x0, y0, x1, y1, nx, ny] of sides) {
      for (let j = 0; j < m; j++) {
        const ax = lerp(x0, x1, j / m), ay = lerp(y0, y1, j / m), bx = lerp(x0, x1, (j + 1) / m), by = lerp(y0, y1, (j + 1) / m);
        out.push([ax, ay, bx, by, nx, ny, ((ax + bx) / 2 / h + 1) / 2]);
      }
    }
  }
  return out;
};
const SEGS: Record<string, number[][]> = { circle: segs('circle'), square: segs('square') };

/** the travelling copy: moves to the gate (mv), its outline peels off (k), its fill condenses into a teal bead */
const Traveller: React.FC<{ kind: string; lane: number; mv: number; k: number; o: number; seed: number }> = ({ kind, lane, mv, k, o, seed }) => {
  if (o <= 0.001) return null;
  const y = LY[lane];
  const cx = lerp(OX, MOUTH - RAD + 30, E.io2(mv));
  const fillS = 1 - 0.9 * E.in(k);
  const beadP = inv(0.55, 1, k);
  const beadX = lerp(cx, EXIT + 30, E.io(beadP));
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      {kind === 'circle'
        ? <circle cx={cx} cy={y} r={RAD * fillS} fill={OBJ_BLUE} opacity={1 - 0.7 * k} />
        : <rect x={cx - RAD * fillS} y={y - RAD * fillS} width={2 * RAD * fillS} height={2 * RAD * fillS} rx={6} fill={OBJ_BLUE} opacity={1 - 0.7 * k} />}
      {SEGS[kind].map(([x1, y1, x2, y2, nx, ny, front], i) => {
        const ki = E.out(Math.min(1, Math.max(0, k * 1.7 - (1 - front) * 0.7)));
        if (ki >= 0.999) return null;
        const jit = rnd(seed * 31 + i * 7.3);
        const dx = nx * ki * (60 + 90 * jit) - ki * (120 + 80 * rnd(seed + i));
        const dy = ny * ki * (50 + 70 * jit) + (jit - 0.5) * 50 * ki;
        const rot = (jit - 0.5) * 140 * ki;
        const mx = cx + ((x1 + x2) / 2) * (1 - 0.15 * ki), my = y + ((y1 + y2) / 2) * (1 - 0.15 * ki);
        return (
          <g key={i} transform={`translate(${mx + dx} ${my + dy}) rotate(${rot})`} opacity={1 - ki}>
            <line x1={(x1 - x2) / 2} y1={(y1 - y2) / 2} x2={(x2 - x1) / 2} y2={(y2 - y1) / 2} stroke={C.chalk} strokeWidth={5} strokeLinecap="round" />
          </g>
        );
      })}
      {beadP > 0.001 && beadP < 0.999 ? (
        <g>
          <circle cx={beadX} cy={y} r={20} fill={C.concept} opacity={0.25} />
          <circle cx={beadX} cy={y} r={11} fill={C.concept} />
        </g>
      ) : null}
    </g>
  );
};

/** the bottleneck gate for one lane: a funnel narrowing to a throat */
const Gate: React.FC<{ lane: number; p: number; glow: number }> = ({ lane, p, glow }) => {
  if (p <= 0.001) return null;
  const y = LY[lane], open = 32;
  const d = (s: 1 | -1) => `M ${MOUTH} ${y + s * 122} L ${THROAT} ${y + s * open} L ${EXIT} ${y + s * open}`;
  return (
    <g>
      <rect x={THROAT} y={y - open} width={EXIT - THROAT} height={2 * open} fill={rgba(C.concept, 0.06 + 0.2 * glow)} />
      {[1, -1].map((s) => (
        <path key={s} d={d(s as 1 | -1)} fill="none" stroke={C.concept} strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" pathLength={1}
          strokeDasharray={p < 0.999 ? `${p} 1` : undefined} />
      ))}
    </g>
  );
};

/** a concept vector with row labels on the right (rows = VOC, plus "square?" when rows = 3) */
const CVec: React.FC<{ x: number; y: number; vals: (number | string)[]; o?: number; cellO?: (i: number) => number; ring?: (i: number) => number; labels?: boolean; labO?: (i: number) => number; rowH?: number }> = ({
  x, y, vals, o = 1, cellO, ring, labels = true, labO, rowH = VRH,
}) => {
  if (o <= 0.001) return null;
  const names = [...VOC, 'square'];
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <VecCol x={x} y={y} vals={vals} rowH={rowH} w={VW} size={36} digits={0} cellO={cellO} ring={ring} ringColor={C.concept}
        cellColor={(r) => (r === 2 ? C.concept : undefined)} />
      {labels ? names.slice(0, vals.length).map((l, r) => (
        <Txt key={l} x={x + VW + 20} y={y + (r + 0.5) * rowH} size={26} anchor="start" weight={600} fill={C.concept} o={labO ? labO(r) : 1}>{`${l}?`}</Txt>
      )) : null}
    </g>
  );
};

export const S08: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.4) => inv(x, x + d, t);
  const NB = P.beats.length;
  /** slide k: fades in on the beat's first words, fades out (0.3 s) just before the next beat */
  const sl = (k: number) => inv(b(k) - 0.05, b(k) + 0.25, t) * (k < NB ? 1 - inv(b(k + 1) - 0.35, b(k + 1) - 0.05, t) : 1);

  // ---------------- 8.1 only what the vocabulary names passes
  const s1obj = at(b(1) + 0.1, 0.5);
  const s1box = at(w(1, 'vocabulary') - 0.1, 0.5);
  const s1mv = E.io(inv(w(1, 'passes') - 0.1, w(1, 'name') + 0.3, t));
  const s1drop = at(w(1, 'name') - 0.1, 0.5);
  const TOK = [
    { l: 'colour', y: 470, named: true }, { l: 'size', y: 570, named: true }, { l: 'shape', y: 670, named: false },
  ];
  const BOX = { x: 880, y: 400, w: 300, h: 340 };

  // ---------------- 8.2 the two objects
  const s2c = E.back(at(w(2, 'circle') - 0.2, 0.5)), s2s = E.back(at(w(2, 'square') - 0.2, 0.5));
  const s2cls = at(w(2, 'different') - 0.1);

  // ---------------- 8.3 the vocabulary and the vectors
  const s3voc = at(w(3, 'vocabulary') - 0.1);
  const s3vec = at(w(3, 'Both') - 0.3);
  const s3map = E.io(inv(w(3, 'Both') - 0.3, w(3, 'Both') + 0.5, t));
  const s3cell = (i: number) => (i === 0 ? at(w(3, 'blue', 1) - 0.1) : at(w(3, 'small') - 0.1));
  const s3line = at(w(3, 'small') + 0.4);

  // ---------------- 8.4 equal vectors, different labels
  const s4v = at(b(4) - 0.05, 0.3);
  const s4eq = at(w(4, 'same') - 0.1);
  const s4cls = at(w(4, 'yet') - 0.2);
  const s4tA = w(4, 'c', 1), s4tB = w(4, 'yet');

  // ---------------- 8.5 travel through the bottleneck
  const s5gate = E.io(inv(w(5, 'Watch'), w(5, 'Watch') + 0.9, t));
  const s5head = at(w(5, 'task') - 0.1, 0.5);
  const s5glow = at(w(5, 'Shape') - 0.1) * (1 - inv(w(5, 'disappears') + 0.4, w(5, 'disappears') + 1.2, t));
  const s5mv = inv(w(5, 'Shape') + 0.3, w(5, 'bottleneck'), t);
  const s5peel = inv(w(5, 'bottleneck') - 0.2, w(5, 'disappears') + 0.5, t);
  const s5trav = at(w(5, 'Shape') + 0.3, 0.2) * (1 - inv(w(5, 'disappears') + 0.4, w(5, 'disappears') + 0.6, t));
  const s5orig = 1 - 0.55 * at(w(5, 'Shape') + 0.3, 0.4);
  const s5vec = at(w(5, 'disappears') + 0.2, 0.5);
  const s5line = at(w(5, 'disappears') + 0.3, 0.5);

  // ---------------- 8.6 identical input, identical output
  const s6in = at(b(6) - 0.05, 0.3);
  const s6hi = Math.sin(Math.PI * inv(w(6, 'head'), w(6, 'vector') + 0.6, t));
  const s6out = [at(w(6, 'same') - 0.1), at(w(6, 'same') + 0.1)];
  const subT = w(6, 'linear'), subT2 = w(6, 'large');
  const sub = t < subT - 0.15 ? 'any head' : t < subT2 - 0.15 ? 'linear' : 'neural net';
  const subO = t < subT - 0.3 ? 1 : t < subT ? inv(subT, subT - 0.3, t) : t < subT2 - 0.3 ? at(subT, 0.3) : t < subT2 ? inv(subT2, subT2 - 0.3, t) : at(subT2, 0.3);
  const s6line = at(w(6, 'recover') - 0.2);

  // ---------------- 8.7 best accuracy
  const s7rows = at(b(7) - 0.05, 0.3);
  const s7marks = at(w(7, 'best') - 0.2);
  const s7m = E.out(inv(w(7, 'accuracy'), w(7, 'fifty') + 0.5, t));

  // ---------------- 8.8 sufficiency in words
  const s8n = [at(b(8) + 0.05), at(w(8, 'concepts') - 0.1), at(w(8, 'label') - 0.1)];
  const s8chain = E.io(inv(w(8, 'concepts'), w(8, 'concepts') + 0.6, t));
  const s8arc = E.io(inv(w(8, 'input') - 0.1, w(8, 'input') + 0.8, t));
  const s8x = inv(w(8, 'nothing') - 0.1, w(8, 'nothing') + 0.5, t);
  const s8lab = at(w(8, 'more') - 0.1);
  const s8suf = at(w(8, 'sufficiency') - 0.1);

  // ---------------- 8.9 in symbols
  const S9 = [
    { word: 'label', tex: '\\cout{Y}', x: 620, at: at(w(9, 'Y') - 0.1) },
    { word: 'independent of', tex: '\\perp\\!\\!\\!\\perp', x: 815, at: at(w(9, 'independent') - 0.1) },
    { word: 'input', tex: '\\cin{X}', x: 1010, at: at(w(9, 'X') - 0.1) },
    { word: 'given', tex: '\\mid', x: 1160, at: at(w(9, 'given') - 0.1) },
    { word: 'concepts', tex: '\\ccon{C}', x: 1310, at: at(w(9, 'C') - 0.1) },
  ];
  const s9fail = at(w(9, 'fails') - 0.1);
  const s9x = inv(w(9, 'fails'), w(9, 'fails') + 0.5, t);
  const s9why = at(w(9, 'label') - 0.1);

  // ---------------- 8.10 the strict CBM guarantee
  const s10arch = E.io(inv(w(10, 'strict') - 0.1, w(10, 'strict') + 0.9, t));
  const s10no = at(w(10, 'only') - 0.1);
  const s10w = at(w(10, 'prediction') - 0.1), s10eq = at(w(10, 'through') - 0.1);
  const s10voc = at(w(10, 'Whether') - 0.1);

  // ---------------- 8.11 the fix
  const s11in = at(b(11) - 0.05, 0.3);
  const s11ring = Math.sin(Math.PI * inv(w(11, 'accurate'), w(11, 'help') + 0.5, t));
  const s11grow = E.io(inv(w(11, 'shape') - 0.1, w(11, 'shape') + 0.6, t));
  const s11differ = at(w(11, 'differ') - 0.2);
  const rows11 = s11grow > 0.001 ? 3 : 2;

  return (
    <Stage>
      <Header t={t} part={8} title={P.title} />
      <ArchMap on={['c']} o={inv(0, 0.5, t)} />

      {/* ============================================================ 8.1 only named properties pass */}
      <Slide o={sl(1)}>
        <SlideHead text={bh(P, 1)} />
        <Svg>
          <Obj kind="circle" x={330} y={570} r={110} o={s1obj} />
          {/* the vocabulary: a teal box with two named slots */}
          <g opacity={s1box < 0.999 ? s1box : undefined}>
            <rect x={BOX.x} y={BOX.y} width={BOX.w} height={BOX.h} rx={18} fill={rgba(C.concept, 0.06)} stroke={C.concept} strokeWidth={3} />
            {TOK.slice(0, 2).map((k) => (
              <rect key={k.l} x={BOX.x + 40} y={k.y - 30} width={BOX.w - 80} height={60} rx={10} fill="none" stroke={rgba(C.concept, 0.6)} strokeWidth={2} strokeDasharray="6 6" />
            ))}
          </g>
          <Flow pts={[[BOX.x + BOX.w + 10, 520], [1440, 520]]} color={C.concept} p={inv(0.6, 1, s1mv)} t={t} live={s1drop} sw={3.5} head={14} n={2} />
          <Block x={1560} y={520} w={220} h={110} kind="head" title="task head" o={inv(0.6, 1, s1mv)} size={28} />
          {/* the property tokens: named ones enter their slots, "shape" stops at the wall and fades */}
          {TOK.map((k, i) => {
            const x0 = 520, xs = BOX.x + BOX.w / 2;
            const x = k.named ? lerp(x0, xs, s1mv) : lerp(x0, BOX.x - 120, Math.min(1, s1mv * 1.25));
            const o = s1obj * (k.named ? 1 : 1 - 0.5 * s1drop);
            const col = k.named ? C.concept : C.chalk2;
            return (
              <g key={k.l} opacity={o < 0.999 ? o : undefined}>
                <rect x={x - 80} y={k.y - 26} width={160} height={52} rx={26} fill={k.named ? rgba(C.concept, 0.16) : C.bg3} stroke={col} strokeWidth={2.5}
                  strokeDasharray={k.named ? undefined : '6 6'} />
                <Txt x={x} y={k.y + 1} size={28} weight={600} fill={k.named ? C.chalk : C.chalk2}>{k.l}</Txt>
                {i === 2 ? <Cross x={x - 22} y={k.y - 22} w={44} h={44} p={s1drop} sw={5} /> : null}
              </g>
            );
          })}
        </Svg>
        <Rich x={BOX.x + BOX.w / 2} y={BOX.y - 52} ax="center" size={30} weight={600} text="{c:concept vocabulary}" o={s1box} />
        <Rich x={BOX.x - 40} y={TOK[2].y + 50} ax="right" size={28} color={C.mute} text="not named: dropped" o={s1drop} />
      </Slide>

      {/* ============================================================ 8.2 two objects, two classes */}
      <Slide o={sl(2)}>
        <SlideHead text={bh(P, 2)} />
        <Svg>
          <Obj kind="circle" x={660} y={560} r={130} s={s2c} />
          <Obj kind="square" x={1260} y={560} r={125} s={s2s} />
          <MathSvg x={660} y={370} tex="\cin{x_1}" size={44} o={s2c} />
          <MathSvg x={1260} y={370} tex="\cin{x_2}" size={44} o={s2s} />
          <Txt x={660} y={760} size={36} weight={700} o={s2cls}>{OBJ[0].y}</Txt>
          <Txt x={1260} y={760} size={36} weight={700} o={s2cls}>{OBJ[1].y}</Txt>
        </Svg>
        <Rich x={960} y={840} ax="center" size={26} color={C.mute} text="fill: the object's own colour" o={s2s} />
        <EvTag x={1760} y={880} ax="right" kind="constructed" text="two-object example" o={s2c} />
      </Slide>

      {/* ============================================================ 8.3 the vocabulary and the vectors */}
      <Slide o={sl(3)}>
        <SlideHead text={bh(P, 3)} />
        <Svg>
          <Obj kind="circle" x={420} y={LY[0]} r={78} />
          <Obj kind="square" x={420} y={LY[1]} r={74} />
          {[0, 1].map((i) => (
            <Flow key={i} pts={[[540, LY[i]], [760, LY[i]]]} color={C.input} p={s3map} t={t + i * 0.5} live={s3vec} sw={3.5} head={14} n={2} />
          ))}
          {[0, 1].map((i) => (
            <CVec key={i} x={800} y={LY[i] - VRH} vals={OBJ[i].c} o={s3vec} cellO={s3cell} labO={s3cell} />
          ))}
        </Svg>
        <Rich x={960} y={290} ax="center" size={34} text="vocabulary: {c:colour}, {c:size}" o={s3voc} />
        <Rich x={1200} y={(LY[0] + LY[1]) / 2} ay="middle" size={32} color={C.chalk2} text="both: {c:blue} = 1, {c:large} = 0" o={s3line} />
        <EvTag x={1760} y={880} ax="right" kind="constructed" text="two-object example" o={s3vec} />
      </Slide>

      {/* ============================================================ 8.4 equal vectors */}
      <Slide o={sl(4)}>
        <SlideHead text={bh(P, 4)} />
        <Svg>
          <Obj kind="circle" x={700} y={340} r={36} o={s4v} />
          <Obj kind="square" x={1220} y={340} r={34} o={s4v} />
          <CVec x={650} y={420} vals={OBJ[0].c} o={s4v} labels={false} rowH={76} />
          <CVec x={1170} y={420} vals={OBJ[1].c} o={s4v} labels={false} rowH={76} />
          {VOC.map((l, r) => (
            <Txt key={l} x={610} y={420 + (r + 0.5) * 76} size={26} anchor="end" weight={600} fill={C.concept} o={s4v}>{`${l}?`}</Txt>
          ))}
          <Txt x={700} y={630} size={30} weight={700} o={s4cls}>{OBJ[0].y}</Txt>
          <Txt x={1220} y={630} size={30} weight={700} o={s4cls}>{OBJ[1].y}</Txt>
        </Svg>
        <Tex x={960} y={496} ax="center" size={72} tex="\ccon{=}" o={s4eq} />
        <Tex x={960} y={630} ax="center" size={52} tex="\ne" o={s4cls} />
        <TexSteps x={960} y={800} ax="center" t={t} o={s4v} size={56} parts={[
          ['\\ccon{c}(\\cin{x_1}) = \\ccon{c}(\\cin{x_2}),', s4tA],
          ['\\quad y_1 \\ne y_2', s4tB],
        ]} />
      </Slide>

      {/* ============================================================ 8.5 what reaches the head */}
      <Slide o={sl(5)}>
        <SlideHead text={bh(P, 5)} />
        <Svg>
          <Obj kind="circle" x={OX} y={LY[0]} r={RAD} o={s5orig} glow={s5glow} />
          <Obj kind="square" x={OX} y={LY[1]} r={RAD} o={s5orig} glow={s5glow} />
          {[0, 1].map((i) => (
            <Pill key={i} x={OX - RAD - 4} y={LY[i] - RAD - 34} text="shape" color={C.chalk} size={24} o={s5glow} />
          ))}
          <Gate lane={0} p={s5gate} glow={Math.sin(Math.PI * inv(w(5, 'bottleneck'), w(5, 'disappears') + 0.6, t))} />
          <Gate lane={1} p={s5gate} glow={Math.sin(Math.PI * inv(w(5, 'bottleneck'), w(5, 'disappears') + 0.6, t))} />
          <Traveller kind="circle" lane={0} mv={s5mv} k={s5peel} o={s5trav} seed={1} />
          <Traveller kind="square" lane={1} mv={s5mv} k={s5peel} o={s5trav} seed={2} />
          {[0, 1].map((i) => (
            <CVec key={i} x={VX5} y={LY[i] - VRH} vals={OBJ[i].c} o={s5vec} />
          ))}
          {[0, 1].map((i) => (
            <Flow key={`h${i}`} pts={[[VX5 + VW + 110, LY[i]], [HX5 - 150, LY[i]], [HX5 - 100, HY5 + (i ? 22 : -22)]]} color={C.concept} p={E.io(s5head)}
              t={t + i * 0.5} live={s5vec} head={12} sw={3} n={2} />
          ))}
          <Block x={HX5} y={HY5} w={190} h={120} kind="head" title="task head" o={s5head} size={28} />
        </Svg>
        <Rich x={THROAT - 40} y={(LY[0] + LY[1]) / 2} ax="center" ay="middle" size={26} weight={600} color={C.concept} text="concept bottleneck" o={s5gate} />
        <Rich x={960} y={880} ax="center" size={30} text="{x:shape}: in the image, not in the {c:vector}" o={s5line} />
      </Slide>

      {/* ============================================================ 8.6 same input, same output */}
      <Slide o={sl(6)}>
        <SlideHead text={bh(P, 6)} />
        <Svg>
          {[0, 1].map((i) => (
            <CVec key={i} x={420} y={LY[i] - VRH} vals={OBJ[i].c} o={s6in} />
          ))}
          <Obj kind="circle" x={330} y={LY[0]} r={30} o={s6in} />
          <Obj kind="square" x={330} y={LY[1]} r={28} o={s6in} />
          {[0, 1].map((i) => (
            <Flow key={`h${i}`} pts={[[640, LY[i]], [820, LY[i]], [880, 570 + (i ? 22 : -22)]]} color={C.concept} p={1} o={s6in} t={t + i * 0.5} live={s6in} head={12} sw={3} n={2} />
          ))}
          <Block x={990} y={570} w={210} h={140} kind="head" title="task head" o={s6in} hi={s6hi} size={28}>
            <Txt x={0} y={34} size={22} mono fill={C.chalk2} o={subO}>{sub}</Txt>
          </Block>
          {[0, 1].map((i) => (
            <Flow key={`o${i}`} pts={[[1100, 570 + (i ? 22 : -22)], [1260, LY[i]]]} color={C.chalk} p={E.io(s6out[i])} t={t + i * 0.5} live={s6out[i]} head={12} sw={3} n={1} dotR={5} />
          ))}
          {[0, 1].map((i) => (
            <Pill key={i} x={1280} y={LY[i]} text={OBJ[0].y} color={C.chalk} size={30} o={s6out[i]} mono={false} />
          ))}
        </Svg>
        <Rich x={960} y={850} ax="center" size={32} color={C.chalk2} text="no head can recover what never reached it" o={s6line} />
      </Slide>

      {/* ============================================================ 8.7 best possible accuracy */}
      <Slide o={sl(7)}>
        <SlideHead text={bh(P, 7)} />
        <Svg>
          {[0, 1].map((i) => {
            const y = 400 + i * 130;
            return (
              <g key={i} opacity={s7rows < 0.999 ? s7rows : undefined}>
                <Obj kind={OBJ[i].shape} x={480} y={y} r={i ? 40 : 42} />
                <Flow pts={[[560, y], [700, y]]} color={C.chalk} sw={3} head={12} />
                <Pill x={720} y={y} text={`output: ${OBJ[0].y}`} color={C.chalk} size={30} mono={false} />
                <Txt x={1090} y={y} size={28} anchor="start" fill={C.chalk2} o={s7marks}>{`true: ${OBJ[i].y}`}</Txt>
                {i === 0 ? <Tick x={1380} y={y} o={s7marks} /> : <Cross x={1366} y={y - 16} w={32} h={32} p={s7marks} sw={6} />}
              </g>
            );
          })}
          {/* the meter */}
          <g opacity={s7marks < 0.999 ? s7marks : undefined}>
            <rect x={560} y={740} width={800} height={44} rx={10} fill={C.bg3} stroke={C.line2} strokeWidth={2} />
            <rect x={560} y={740} width={800 * INC.best_accuracy * s7m} height={44} rx={10} fill={C.chalk} />
            <Txt x={1390} y={763} size={44} anchor="start" mono weight={700} o={inv(0.5, 1, s7m)}>{`${PCT}%`}</Txt>
            <Txt x={560} y={712} size={28} anchor="start" weight={600} fill={C.chalk2}>best possible accuracy</Txt>
          </g>
        </Svg>
        <EvTag x={1760} y={880} ax="right" kind="constructed" text="two-object example" o={s7rows} />
      </Slide>

      {/* ============================================================ 8.8 sufficiency in words */}
      <Slide o={sl(8)}>
        <SlideHead text={bh(P, 8)} />
        <Svg>
          {[
            { x: 460, col: C.input, l: 'input', o: s8n[0] },
            { x: 960, col: C.concept, l: 'concepts', o: s8n[1] },
            { x: 1460, col: C.chalk, l: 'label', o: s8n[2] },
          ].map((n) => (
            <g key={n.l} opacity={n.o < 0.999 ? n.o : undefined}>
              <circle cx={n.x} cy={600} r={86} fill={rgba(n.col, 0.14)} stroke={n.col} strokeWidth={3.5} />
              <Txt x={n.x} y={601} size={30} weight={650} fill={n.col}>{n.l}</Txt>
            </g>
          ))}
          <Flow pts={[[552, 600], [868, 600]]} color={C.input} p={s8chain} sw={4} head={16} />
          <Flow pts={[[1052, 600], [1368, 600]]} color={C.concept} p={s8chain} sw={4} head={16} />
          {/* the direct route: adds nothing once the concepts are known */}
          <path d="M 500 530 Q 960 280 1420 530" fill="none" stroke={C.chalk2} strokeWidth={3} strokeDasharray="8 10" opacity={s8arc} />
          <Cross x={940} y={385} w={40} h={40} p={s8x} sw={6} />
        </Svg>
        <Rich x={960} y={340} ax="center" ay="bottom" size={30} color={C.chalk2} text="adds nothing more about the {y:label}" o={s8lab} />
        <Rich x={960} y={760} ax="center" size={34} weight={650} text="{m:ideal:} sufficiency" o={s8suf} />
      </Slide>

      {/* ============================================================ 8.9 sufficiency in symbols */}
      <Slide o={sl(9)}>
        <SlideHead text={bh(P, 9)} />
        {S9.map((s) => (
          <React.Fragment key={s.word}>
            <Rich x={s.x} y={400} ax="center" ay="middle" size={30} color={C.chalk2}
              text={s.word === 'label' ? '{y:label}' : s.word === 'input' ? '{x:input}' : s.word === 'concepts' ? '{c:concepts}' : s.word} o={s.at} />
            <Tex x={s.x} y={500} ax="center" size={64} tex={s.tex} o={s.at} />
          </React.Fragment>
        ))}
        <Svg>
          <Cross x={770} y={455} w={90} h={90} p={s9x} sw={6} />
          <Obj kind="circle" x={640} y={720} r={34} o={s9why} />
          <Obj kind="square" x={740} y={720} r={32} o={s9why} />
        </Svg>
        <Rich x={960} y={620} ax="center" size={32} weight={600} color={C.bad} text="here it fails" o={s9fail} />
        <Rich x={820} y={720} ay="middle" size={32} text="the {y:label} depends on shape, which $\ccon{C}$ lacks" o={s9why} />
      </Slide>

      {/* ============================================================ 8.10 the strict CBM guarantee */}
      <Slide o={sl(10)}>
        <SlideHead text={bh(P, 10)} />
        <Svg>
          {[
            { x: 420, kind: 'input' as const, tex: '\\cin{x}' },
            { x: 690, kind: 'input' as const, tex: '\\gth' },
            { x: 960, kind: 'concept' as const, tex: '\\cvec' },
            { x: 1230, kind: 'head' as const, tex: '\\fph' },
            { x: 1500, kind: 'output' as const, tex: '\\yh' },
          ].map((n, i) => (
            <g key={i} opacity={inv(i * 0.15, i * 0.15 + 0.3, s10arch)}>
              <Block x={n.x} y={430} w={150} h={96} kind={n.kind} />
              <MathSvg x={n.x} y={430} tex={n.tex} size={44} />
              {i > 0 ? <Flow pts={[[n.x - 195, 430], [n.x - 80, 430]]} color={i === 4 ? C.chalk : i === 3 ? C.concept : C.input} sw={3.5} head={14} t={t + i * 0.3} live={s10arch} n={1} dotR={5} /> : null}
            </g>
          ))}
          {/* no other path from x to y hat */}
          <g opacity={s10no < 0.999 ? s10no : undefined}>
            <path d="M 420 370 Q 960 230 1500 370" fill="none" stroke={C.chalk2} strokeWidth={3} strokeDasharray="8 10" />
            <Cross x={940} y={281} w={40} h={40} sw={6} />
          </g>
        </Svg>
        <Rich x={960} y={560} ax="center" size={34} text="the {y:prediction} depends on the {x:input} only through the {c:concepts}" o={s10w} />
        <Tex x={960} y={680} ax="center" size={56} tex="\yh = \fph(\cvec), \qquad \cvec = \gth(\cin{x})" o={s10eq} />
        <Rich x={960} y={800} ax="center" size={32} color={C.chalk2} text="whether the true {y:label} does: a property of the vocabulary" o={s10voc} />
      </Slide>

      {/* ============================================================ 8.11 the fix: add shape */}
      <Slide o={sl(11)}>
        <SlideHead text={bh(P, 11)} />
        <Svg>
          <Obj kind="circle" x={700} y={400} r={36} o={s11in} />
          <Obj kind="square" x={1220} y={400} r={34} o={s11in} />
          {[0, 1].map((i) => (
            <CVec key={i} x={i ? 1170 : 650} y={470} vals={rows11 === 3 ? [...OBJ[i].c, SHAPEV[i]] : OBJ[i].c} o={s11in} labels={false} rowH={76}
              cellO={(r) => (r === 2 ? s11grow : 1)} ring={(r) => (r < 2 ? 0.8 * s11ring : 0)} />
          ))}
          {[...VOC, 'square'].slice(0, rows11).map((l, r) => (
            <Txt key={l} x={610} y={470 + (r + 0.5) * 76} size={26} anchor="end" weight={600} fill={C.concept} o={r === 2 ? s11grow : s11in}>{`${l}?`}</Txt>
          ))}
        </Svg>
        <Tex x={960} y={470 + 76 * (rows11 === 3 ? 1.5 : 1)} ax="center" size={72} tex="\ccon{=}" o={s11in * (1 - s11differ)} />
        <Tex x={960} y={470 + 76 * 1.5} ax="center" size={72} tex="\ne" o={s11differ} />
        <Rich x={960} y={300} ax="center" size={32} text="vocabulary: {c:colour}, {c:size}, {c:+ shape}" o={s11grow} />
        <Rich x={960} y={300} ax="center" size={32} color={C.chalk2} text="more exact values: still equal" o={s11ring * (1 - s11grow)} />
        <Rich x={960} y={760} ax="center" size={32} text="the two {c:vectors} now differ" o={s11differ} />
        <EvTag x={1760} y={880} ax="right" kind="constructed" text="two-object example" o={s11in} />
      </Slide>
    </Stage>
  );
};
