// s01 Part 1 · The black box (revision 2: one idea per slide, 10 slides, one per beat).
// 1.1 the question: input -> opaque network -> prediction, "inspect?" / "correct?"   1.2 the gull + a real model, CLIP
// 1.3 the prompt template, one sentence per species        1.4 photo -> encoder -> six species shares (D.clip.probs)
// 1.5 right answer, hidden reason: a "?" on the encoder    1.6 occlusion: a grey patch sweeps, a readout of the drop
// 1.7 the sensitivity map (D.clip.drop), bill and head     1.8 four question callouts
// 1.9 what the map tells (where) and what it does not (which property, what to correct)
// 1.10 the wish: named properties on the photo, gathered into a column with empty value slots.
// Slides replace each other; the photo stays in place across 1.4-1.5 and 1.6-1.10.
import React from 'react';
import { C, F } from '../kit/theme';
import { E, HText, Header, Rich, SlideHead, Stage, Svg, Txt, bs, bw, bh, clamp, inv, type SceneProps } from '../kit/core';
import { CREDIT, Credit, Cross, EditMark, EvTag, Flow, PhotoR, Region, SensMap, ShareBars, rgba, ux, vy, type Rect } from '../kit/cbm';
import { BText } from '../kit/slots';
import { rnd } from '../kit/anim';
import { D } from '../kit/data';

const CL = D.clip;
const N: number = CL.grid; // 14
const DROP: number[][] = CL.drop;
const NSP: number = CL.species.length; // 6
const order: number[] = (CL.probs as number[]).map((_, i) => i).sort((a, b) => CL.probs[b] - CL.probs[a]);
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const SPECIES: string[] = order.map((i) => cap(CL.species[i]));
const PROBS: number[] = order.map((i) => CL.probs[i]);
const TOP: string = CL.species[CL.top].replace('American ', '');
const TPL: string = CL.template; // 'a photo of a {}, a type of bird.'
const [TPL0, TPL1] = TPL.split('{}');

// the hottest occlusion cell: where the probe comes to rest on slide 6
const HOT = (() => {
  let r0 = 0, c0 = 0;
  DROP.forEach((row, r) => row.forEach((v, c) => { if (v > DROP[r0][c0]) { r0 = r; c0 = c; } }));
  return { r: r0, c: c0 };
})();

// geometry
const PH2: Rect = { x: 200, y: 310, w: 540, h: 540 }; // slide 2
const PH3: Rect = { x: 180, y: 400, w: 330, h: 330 }; // slide 3
const PH4: Rect = { x: 180, y: 400, w: 330, h: 330 }; // slides 4-5
const ENC = { x: 700, y: 565, w: 180, h: 240 };
const BX = 900, BRH = 66, BY = ENC.y - 2.5 * BRH;
const PH: Rect = { x: 200, y: 310, w: 540, h: 540 }; // slides 6-10

/** one slide: a full-frame layer with its own opacity */
const Slide: React.FC<{ o: number; children?: React.ReactNode }> = ({ o, children }) =>
  o <= 0.001 ? null : <div style={{ position: 'absolute', inset: 0, opacity: o < 0.999 ? o : undefined }}>{children}</div>;

/** an opaque network: a dark box with a faint, slowly shimmering inner texture */
const BlackBox: React.FC<{ x: number; y: number; w: number; h: number; t: number; o?: number; hi?: number }> = ({ x, y, w, h, t, o = 1, hi = 0 }) => {
  if (o <= 0.001) return null;
  const nx = Math.max(4, Math.round(w / 27)), ny = Math.max(4, Math.round(h / 27));
  const dots = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
    const k = i * ny + j;
    const a = 0.06 + 0.16 * Math.abs(Math.sin(t * (0.35 + rnd(k) * 0.5) + rnd(k + 50) * 6));
    dots.push(<circle key={k} cx={x - w / 2 + ((i + 0.5) / nx) * w} cy={y - h / 2 + ((j + 0.5) / ny) * h} r={3} fill={C.input} opacity={a} />);
  }
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      {hi > 0.001 ? <rect x={x - w / 2 - 10} y={y - h / 2 - 10} width={w + 20} height={h + 20} rx={22} fill={rgba(C.input, 0.14 * hi)} /> : null}
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={16} fill="#05070A" stroke={C.input} strokeWidth={3} />
      {dots}
    </g>
  );
};

/** a pulsing question mark on the black box */
const QMark: React.FC<{ x: number; y: number; t: number; o: number }> = ({ x, y, t, o }) =>
  o <= 0.001 ? null : (
    <g opacity={o < 0.999 ? o : undefined}>
      <circle cx={x} cy={y} r={44 + 4 * Math.sin(t * 4)} fill="rgba(5,7,10,0.85)" stroke={C.chalk} strokeWidth={2.5} />
      <Txt x={x} y={y + 2} size={60} weight={700} fill={C.chalk}>?</Txt>
    </g>
  );

/** a question callout: dot on the photo, leader, backed text */
const Callout: React.FC<{ px: number; py: number; lx: number; ly: number; text: string; o: number }> = ({ px, py, lx, ly, text, o }) => {
  if (o <= 0.001) return null;
  const k = E.out(o);
  const ex = px + (lx - 12 - px) * k, ey = py + (ly - py) * k;
  return (
    <g>
      <line x1={px} y1={py} x2={ex} y2={ey} stroke={C.chalk} strokeWidth={2.5} opacity={0.85 * o} />
      <circle cx={px} cy={py} r={9} fill="none" stroke={C.chalk} strokeWidth={3} opacity={o} />
      <circle cx={px} cy={py} r={3.5} fill={C.chalk} opacity={o} />
      <BText x={lx} y={ly} text={text} size={32} o={inv(0.4, 1, o)} weight={600} pad={12} />
    </g>
  );
};

/** a tick mark (white), centred on (x, y) */
const Tick: React.FC<{ x: number; y: number; o: number }> = ({ x, y, o }) =>
  o <= 0.001 ? null : (
    <path d={`M ${x - 16} ${y + 1} L ${x - 4} ${y + 14} L ${x + 18} ${y - 14}`} fill="none" stroke={C.chalk} strokeWidth={6} strokeLinecap="round"
      strokeLinejoin="round" opacity={o < 0.999 ? o : undefined} />
  );

/** a named property: teal outline pill with an empty value slot (left-centre anchor) */
const NPill: React.FC<{ x: number; y: number; text: string; o: number; pulse?: number }> = ({ x, y, text, o, pulse = 0 }) => {
  if (o <= 0.001) return null;
  const size = 30, tw = text.length * size * 0.56, h = 52, sw = 84;
  const w = tw + 36 + sw;
  const s = 0.85 + 0.15 * E.back(clamp(o));
  return (
    <g opacity={o < 0.999 ? o : undefined} transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x={0} y={-h / 2} width={w} height={h} rx={10} fill="rgba(8,11,15,0.86)" stroke={C.concept} strokeWidth={2.5} />
      <text x={16} y={1} fontSize={size} fontWeight={600} fill={C.concept} dominantBaseline="central" fontFamily={F.sans}>{text}</text>
      <rect x={tw + 28} y={-h / 2 + 9} width={sw} height={h - 18} rx={5} fill={rgba(C.concept, 0.08 + 0.25 * pulse)} stroke={C.concept}
        strokeWidth={2} strokeDasharray="5 5" opacity={0.9} />
    </g>
  );
};

export const S01: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.5) => inv(x, x + d, t);
  const NB = P.beats.length;
  /** slide k: fades in on the beat's first words, fades out (0.3 s) just before the next beat */
  const sl = (k: number) => inv(b(k) - 0.05, b(k) + 0.25, t) * (k < NB ? 1 - inv(b(k + 1) - 0.35, b(k + 1) - 0.05, t) : 1);
  /** a layer that stays from slide k1 to slide k2 */
  const span = (k1: number, k2: number) => inv(b(k1) - 0.05, b(k1) + 0.25, t) * (k2 < NB ? 1 - inv(b(k2 + 1) - 0.35, b(k2 + 1) - 0.05, t) : 1);

  // ---------------- 1.1 the question
  const q1net = at(w(1, 'neural') - 0.1, 0.6), q1in = E.io(inv(w(1, 'makes') - 0.2, w(1, 'makes') + 0.6, t));
  const q1out = E.io(inv(w(1, 'prediction') - 0.3, w(1, 'prediction') + 0.4, t));
  const q1insp = at(w(1, 'inspect') - 0.1), q1corr = at(w(1, 'correct') - 0.1);

  // ---------------- 1.2 photo + CLIP
  const s2ph = at(b(2) - 0.05, 0.4), s2m = at(w(2, 'real') - 0.1, 0.5), s2f = E.io(inv(w(2, 'model') - 0.2, w(2, 'model') + 0.6, t));
  const s2clip = at(w(2, 'CLIP') - 0.1);

  // ---------------- 1.3 the prompt template
  const s3ph = at(b(3) - 0.05, 0.4);
  const s3rows = (i: number) => inv(w(3, 'six') - 0.1 + i * 0.12, w(3, 'six') + 0.3 + i * 0.12, t);
  const s3tpl = at(w(3, 'description') - 0.1);
  const s3cmp = E.io(inv(w(3, 'comparing') - 0.1, w(3, 'comparing') + 0.8, t));

  // ---------------- 1.4 / 1.5 encoder and shares (shared layout)
  const m45 = span(4, 5);
  const enc = at(w(4, 'encoder') - 0.3, 0.6);
  const fin = E.io(inv(w(4, 'Image') - 0.1, w(4, 'Image') + 0.6, t));
  const fout = E.io(inv(w(4, 'score') - 0.2, w(4, 'score') + 0.4, t));
  const barsP = inv(w(4, 'score'), w(4, 'score') + 1.4, t);
  const lead = t > w(4, 'prefers');
  const ring2 = at(w(4, 'Glaucous') - 0.1, 0.4) * (1 - at(b(5), 0.4));
  const live4 = inv(w(4, 'Image'), w(4, 'Image') + 0.5, t) * (1 - at(b(5), 0.5));
  const tag4 = at(w(4, 'softmax') - 0.1);
  const s5dim = at(b(5) + 0.1, 0.5), s5tick = at(w(5, 'right') - 0.1, 0.4), s5q = at(w(5, 'what') - 0.1, 0.4);

  // ---------------- 1.6 - 1.10 the occlusion photo (shared)
  const ph610 = span(6, 10);
  const mapIn = inv(b(7) - 0.05, b(7) + 1.4, t);
  const mapOut = 1 - inv(w(10, 'properties') - 0.6, w(10, 'properties') + 0.4, t);
  const dim = 0.6 * Math.max(0.35 * at(w(6, 'grey') - 0.2, 0.5), mapIn) * mapOut;

  // ---------------- 1.6 the probe sweep: raster over rows 0..HOT.r, coming to rest on the hottest cell
  const sw0 = w(6, 'grey'), sw1 = w(6, 'drops') + 0.4;
  const nCells = HOT.r * N + HOT.c + 1;
  const cellK = Math.min(nCells - 1, Math.floor(inv(sw0, sw1, t) * nCells));
  const pr = Math.floor(cellK / N), pc = cellK % N;
  const side = CL.patch as number;
  const probeX = ux(PH, (pc + 0.5) / N), probeY = vy(PH, (pr + 0.5) / N);
  const drop = DROP[pr][pc];
  const probeO = at(sw0 - 0.3, 0.3) * sl(6);
  const s6txt = at(w(6, 'grey') - 0.1), s6read = at(w(6, 'measure') - 0.1), s6tag = at(w(6, 'computed') - 0.1);

  // ---------------- 1.7 map
  const s7bill = at(w(7, 'bill') - 0.1), s7head = at(w(7, 'head') - 0.1), s7leg = at(b(7) + 0.6);

  // ---------------- 1.8 callouts
  const calls = [
    { u: 0.6, v: 0.15, ly: 400, text: 'the water behind it?', word: 'blue' },
    { u: 0.31, v: 0.24, ly: 500, text: 'the shape of the head?', word: 'shape' },
    { u: 0.16, v: 0.29, ly: 600, text: 'the yellow bill?', word: 'yellow' },
    { u: 0.12, v: 0.31, ly: 700, text: 'the red spot near the tip?', word: 'red' },
  ];

  // ---------------- 1.9 what the map tells
  const s9a = at(w(9, 'marks') - 0.1), s9b = at(w(9, 'which') - 0.1), s9c = at(w(9, 'nothing') - 0.1);
  const s9bx = inv(w(9, 'detected') - 0.2, w(9, 'detected') + 0.4, t), s9cx = inv(w(9, 'correct') - 0.2, w(9, 'correct') + 0.4, t);

  // ---------------- 1.10 named properties
  const R = D.gull.regions;
  const COLX = 1000;
  const props = [
    { key: 'wingtip', text: 'wingtip colour', at: [ux(PH, 0.66), vy(PH, 0.66)] as [number, number], col: 690 },
    { key: 'bill', text: 'bill shape', at: [ux(PH, 0.04), vy(PH, 0.4)] as [number, number], col: 580 },
    { key: 'head', text: 'head colour', at: [ux(PH, 0.33), vy(PH, 0.1)] as [number, number], col: 470 },
  ];
  const slide10 = E.io(inv(w(10, 'Each') - 0.2, w(10, 'Each') + 1.0, t));
  const chk = at(w(10, 'checked') - 0.1, 0.6);
  const colHead = at(w(10, 'Each') - 0.1);

  return (
    <Stage>
      <Header t={t} part={1} title={P.title} />

      {/* ============================================================ 1.1 the question */}
      <Slide o={sl(1)}>
        <SlideHead text={bh(P, 1)} />
        <Svg>
          <g opacity={q1net < 0.999 ? q1net : undefined}>
            <circle cx={560} cy={560} r={26} fill={C.input} />
            <Flow pts={[[600, 560], [818, 560]]} color={C.input} p={q1in} t={t} live={q1in} head={16} />
            <BlackBox x={960} y={560} w={260} h={260} t={t} />
            <Flow pts={[[1102, 560], [1300, 560]]} color={C.chalk2} p={q1out} t={t} live={q1out} head={16} />
          </g>
          <Txt x={560} y={624} size={28} fill={C.input} o={q1net}>input</Txt>
          <Txt x={960} y={398} size={28} fill={C.chalk2} o={q1net}>neural network</Txt>
          <Txt x={1320} y={560} size={36} weight={700} anchor="start" o={q1out}>prediction</Txt>
          <Txt x={860} y={760} size={34} weight={600} fill={C.chalk} o={q1insp}>inspect?</Txt>
          <EditMark x={1040} y={758} s={1.0} o={q1corr} />
          <Txt x={1070} y={760} size={34} weight={600} anchor="start" fill={C.edit} o={q1corr}>correct?</Txt>
        </Svg>
      </Slide>

      {/* ============================================================ 1.2 photo + CLIP */}
      <Slide o={sl(2)}>
        <SlideHead text={bh(P, 2)} />
        <PhotoR R={PH2} src="gull.jpg" o={s2ph} />
        <Credit x={PH2.x} y={PH2.y + PH2.h + 10} text={CREDIT['gull.jpg']} o={s2ph} />
        <Svg>
          <Flow pts={[[PH2.x + PH2.w + 14, PH2.y + PH2.h / 2], [1060, PH2.y + PH2.h / 2]]} color={C.input} p={s2f} t={t} live={s2f} head={16} />
          <BlackBox x={1230} y={PH2.y + PH2.h / 2} w={300} h={300} t={t} o={s2m} />
          <Txt x={1230} y={PH2.y + PH2.h / 2 - 196} size={44} weight={700} o={s2clip}>CLIP</Txt>
        </Svg>
        <HText x={1230} y={PH2.y + PH2.h / 2 + 176} ax="center" size={28} color={C.chalk2} o={s2clip}>a real, trained model</HText>
        <EvTag x={1760} y={890} ax="right" kind="computed" text={`CLIP ViT-B/32, zero-shot over ${NSP} species names`} o={s2clip} />
      </Slide>

      {/* ============================================================ 1.3 the prompt template */}
      <Slide o={sl(3)}>
        <SlideHead text={bh(P, 3)} />
        <PhotoR R={PH3} src="gull.jpg" o={s3ph} border={C.input} />
        <Credit x={PH3.x} y={PH3.y + PH3.h + 10} text={CREDIT['gull.jpg']} o={s3ph} />
        <Svg>
          {CL.species.map((s: string, i: number) => {
            const y = 420 + i * 58;
            return (
              <line key={s} x1={PH3.x + PH3.w + 16} y1={PH3.y + PH3.h / 2} x2={720} y2={y} stroke={C.chalk2} strokeWidth={2}
                strokeDasharray="4 7" opacity={0.75 * s3cmp * s3rows(i)} />
            );
          })}
        </Svg>
        <HText x={740} y={322} size={30} mono color={C.chalk2} o={s3tpl}>
          {`“${TPL0}`}<span style={{ color: C.chalk, fontWeight: 700 }}>{'{species}'}</span>{`${TPL1}”`}
        </HText>
        {CL.species.map((s: string, i: number) => (
          <HText key={s} x={740} y={420 + i * 58} ay="middle" size={28} mono color={C.mute} o={s3rows(i)}>
            {TPL0}<span style={{ color: C.chalk, fontWeight: 700 }}>{s}</span>{TPL1}
          </HText>
        ))}
        <Rich x={740} y={800} size={30} color={C.chalk2} text="the {x:image} is compared with each sentence" o={s3cmp} />
      </Slide>

      {/* ============================================================ 1.4 / 1.5 photo -> encoder -> shares */}
      <Slide o={sl(4)}>
        <SlideHead text={bh(P, 4)} />
      </Slide>
      <Slide o={sl(5)}>
        <SlideHead text={bh(P, 5)} />
      </Slide>
      <Slide o={m45}>
        <PhotoR R={PH4} src="gull.jpg" />
        <Credit x={PH4.x} y={PH4.y + PH4.h + 10} text={CREDIT['gull.jpg']} />
        <Svg>
          <Flow pts={[[PH4.x + PH4.w + 12, ENC.y], [ENC.x - ENC.w / 2 - 8, ENC.y]]} color={C.input} p={fin} t={t} live={live4} head={14} />
          <BlackBox x={ENC.x} y={ENC.y} w={ENC.w} h={ENC.h} t={t} o={enc} hi={s5q * (0.5 + 0.5 * Math.sin(t * 4))} />
          <Txt x={ENC.x} y={ENC.y - ENC.h / 2 - 30} size={28} weight={600} fill={C.input} o={enc}>image encoder</Txt>
          <Flow pts={[[ENC.x + ENC.w / 2 + 8, ENC.y], [BX - 26, ENC.y]]} color={C.chalk2} p={fout} t={t} live={inv(w(4, 'score'), w(4, 'score') + 0.5, t) * (1 - at(b(5), 0.5))} head={14} />
          <ShareBars x={BX} y={BY} labels={SPECIES} from={PROBS} p={barsP} lead={lead} w={280} rowH={BRH} labelW={370} size={28} o={at(w(4, 'score') - 0.2)} />
          {ring2 > 0.001 ? <rect x={BX - 14} y={BY + BRH - 28} width={760} height={56} rx={10} fill="none" stroke={C.chalk} strokeWidth={2} opacity={0.7 * ring2} /> : null}
          {/* 1.5: the runners-up recede, the winner stays, the reason is hidden */}
          {s5dim > 0.001 ? <rect x={BX - 16} y={BY + BRH / 2 - 2} width={790} height={BRH * 5} fill={C.bg} opacity={0.72 * s5dim} /> : null}
          <Tick x={BX + 370 + 280 + 112} y={BY} o={s5tick} />
          <QMark x={ENC.x} y={ENC.y} t={t} o={s5q} />
        </Svg>
        <EvTag x={1760} y={890} ax="right" kind="computed" text={`CLIP ViT-B/32, softmax over ${NSP} species names`} o={tag4} />
      </Slide>

      {/* ============================================================ 1.6 - 1.10 the occlusion photo */}
      <PhotoR R={PH} src="gull.jpg" o={ph610} dim={dim} />
      <Credit x={PH.x} y={PH.y + PH.h + 10} text={CREDIT['gull.jpg']} o={ph610} />
      <Svg o={ph610}>
        <SensMap R={PH} vals={DROP} vmax={CL.drop_max} draw={mapIn} o={mapOut} id="s01sens" />
      </Svg>

      {/* 1.6 the probe */}
      <Slide o={sl(6)}>
        <SlideHead text={bh(P, 6)} />
        <Svg>
          {probeO > 0.001 ? (
            <g opacity={probeO}>
              <defs><clipPath id="s01-ph"><rect x={PH.x} y={PH.y} width={PH.w} height={PH.h} rx={8} /></clipPath></defs>
              <g clipPath="url(#s01-ph)">
                <rect x={probeX - (side * PH.w) / 2} y={probeY - (side * PH.h) / 2} width={side * PH.w} height={side * PH.h}
                  fill="#7F7F7F" stroke={C.input} strokeWidth={3} strokeDasharray="8 6" />
              </g>
            </g>
          ) : null}
          {s6read > 0.001 ? (
            <g opacity={s6read}>
              <rect x={860} y={548} width={520} height={34} rx={6} fill={C.bg3} stroke={C.line2} strokeWidth={2} />
              <rect x={860} y={548} width={520 * clamp(drop / CL.drop_max)} height={34} rx={6} fill={C.heat} opacity={0.9} />
              <Txt x={1404} y={566} size={36} anchor="start" mono weight={700} fill={C.chalk}>{(drop < 0 ? '−' : '') + Math.abs(drop).toFixed(2)}</Txt>
            </g>
          ) : null}
        </Svg>
        <Rich x={860} y={380} w={820} size={34} text="grey out one {x:patch}, run the model again" o={s6txt} />
        <Rich x={860} y={490} size={30} color={C.chalk2} text={`drop in the {y:${TOP}} log-probability`} o={s6read} />
        <EvTag x={860} y={680} kind="computed" text={`CLIP, one grey patch at each of ${N} x ${N} positions`} o={s6tag} />
      </Slide>

      {/* 1.7 the map */}
      <Slide o={sl(7)}>
        <SlideHead text={bh(P, 7)} />
        <Svg>
          <BText x={ux(PH, 0.02)} y={vy(PH, 0.42)} text="bill" size={30} o={s7bill} />
          <BText x={ux(PH, 0.28)} y={vy(PH, 0.08)} text="head" size={30} o={s7head} />
        </Svg>
        <Rich x={860} y={460} w={820} size={34} text="brighter: a larger drop in the {y:score}" o={s7leg} />
        <EvTag x={860} y={560} kind="computed" text={`occlusion sensitivity, ${N} x ${N} grey patches`} o={s7leg} />
      </Slide>

      {/* 1.8 the questions */}
      <Slide o={sl(8)}>
        <SlideHead text={bh(P, 8)} />
        <Svg>
          {calls.map((c, i) => (
            <Callout key={i} px={ux(PH, c.u)} py={vy(PH, c.v)} lx={830} ly={c.ly} text={c.text} o={at(w(8, c.word) - 0.1, 0.5)} />
          ))}
        </Svg>
      </Slide>

      {/* 1.9 what the map tells, and what it does not */}
      <Slide o={sl(9)}>
        <SlideHead text={bh(P, 9)} />
        <Svg>
          <Tick x={880} y={440} o={s9a} />
          <Cross x={862} y={522} w={36} h={36} p={s9bx} sw={6} />
          <Cross x={862} y={622} w={36} h={36} p={s9cx} sw={6} />
        </Svg>
        <Rich x={930} y={440} ay="middle" size={36} text="where the {y:score} is sensitive" o={s9a} />
        <Rich x={930} y={540} ay="middle" size={36} text="which property the model detected" o={s9b} />
        <Rich x={930} y={640} ay="middle" size={36} text="what a person could {e:correct}" o={s9c} />
      </Slide>

      {/* 1.10 named properties */}
      <Slide o={sl(10)}>
        <SlideHead text={bh(P, 10)} />
        <Svg>
          {props.map((p, i) => {
            const a = at(w(10, p.key) - 0.1, 0.5);
            const reg = R[p.key] as number[];
            const tx = p.at[0] + (COLX - p.at[0]) * slide10, ty = p.at[1] + (p.col - p.at[1]) * slide10;
            const rx = ux(PH, reg[0] + reg[2] / 2), ry = vy(PH, reg[1]);
            return (
              <g key={p.key}>
                <Region R={PH} b={reg} color={C.concept} draw={E.out(a)} sw={3.5} />
                <Flow pts={[[rx + 4, ry], [COLX - 14, p.col]]} color={C.concept} p={E.io(inv(0.3, 1, slide10))} t={t + i * 0.4} live={inv(0.9, 1, slide10)}
                  head={0} sw={2.5} n={2} dotR={5} o={0.85} />
                <NPill x={tx} y={ty} text={p.text} o={a} pulse={chk * (0.5 + 0.5 * Math.sin((t - i * 0.3) * 3))} />
              </g>
            );
          })}
        </Svg>
        <Rich x={COLX} y={370} size={34} weight={650} text="{c:named properties}" o={colHead} />
        <Rich x={COLX} y={780} size={32} color={C.chalk2} text="each claim can be checked" o={chk} />
      </Slide>
    </Stage>
  );
};
