// s23 Part 5 · The three schemes on CUB (revision 2: one idea per slide, 8 slides, one per beat; slides replace each other)
// 23.1 why: the three schemes as three small cards, then our run on CUB (D.cub.n_train / n_test)
// 23.2 the setup in words with the symbols aligned underneath: x -> frozen CLIP -> e(x) in R^512 -> linear g -> c hat -> linear f -> y hat
// 23.3 one photo through it: e(x) as symbolic entries, c hat as four named CUB concepts (D.cub.gull, computed), f -> species shares
// 23.4 task accuracy, one calm bar chart (D.cub.acc)               23.5 the intervention operator c_j <- c_j with a tiny group vector
// 23.6 intervention curves (D.cub.intervention)                     23.7 why joint gains least: the head also reads detail (leakage pointer)
// 23.8 Koh et al.'s reported results next to ours (D.lit.koh_cub_err)
import React from 'react';
import { C } from '../kit/theme';
import { E, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, bs, bw, bh, inv, type SceneProps } from '../kit/core';
import { ArchMap, Block, CREDIT, ConceptRow, Credit, Cross, EvTag, Flow, MathSvg, Person, PhotoR, ShareBars, rgba, type Rect } from '../kit/cbm';
import { D } from '../kit/data';

const CUB = D.cub;
const KOH = D.lit.koh_cub_err;
const IV = CUB.intervention;
const KS: number[] = IV.groups;
const NG = KS[KS.length - 1];
const NC: number = CUB.n_concepts;
const N_SPECIES = 200; // CUB structural constant
const N_FEAT = 512; // CLIP ViT-B/32 image feature width (structural)
const HEADC = '#9AA6B5';
const pc = (v: number) => (v * 100).toFixed(1);
const commas = (v: number) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const TAG_RUN = 'our run: frozen CLIP ViT-B/32 + linear models, CUB official split, one run';
const TAG_SHORT = 'our CUB run, one run';
// 23.3: the real CLIP ViT-B/32 image feature of our gull photo: its first four entries and the last one
const sg3 = (v: number) => `${v < 0 ? '−' : '+'}${Math.abs(v).toFixed(3)}`;
const E_GULL: string[] = [...(CUB.gull.feature_first as number[]).slice(0, 4).map(sg3), '⋮', sg3(CUB.gull.feature_last)];

// 23.3: the trained CBM on our gull photo (cub/cbm_cub.py, sequential model): four named concepts, top four species
const GULL_C: [string, number][] = CUB.gull.top_concepts;
const cname = (s: string) => {
  const [g, v] = s.replace(/^has_/, '').split('::');
  return `${g.replace(/_color$/, '').replace(/_/g, ' ')}: ${v.replace(/_\(.*\)$/, '').replace(/_/g, ' ')}`;
};
const SHOW_C = [0, 1, 5, 7].map((i) => ({ name: cname(GULL_C[i][0]), v: GULL_C[i][1], key: GULL_C[i][0] }));
const SP: [string, number][] = CUB.gull.top_species;
const sname = (s: string) => s.replace(/ (winged|backed)/, '-$1');

// 23.5: a tiny group edit: our model's predictions for the gull photo; the true values are Herring Gull's CUB labels.
const HG = CUB.herring_gull as { vector: number[]; names: string[] };
const WING = ['grey', 'white', 'black', 'brown'].map((c) => {
  const i = HG.names.indexOf(`has_wing_color::${c}`);
  return { name: c, truth: HG.vector[i] };
});
const GP = (CUB.gull as unknown as { pred_all: Record<string, number> }).pred_all;
const WING_PRED = WING.map((w) => GP[`has_wing_color::${w.name}`]); // computed: our CUB run on the gull photo

// 23.4 rows, ordered by accuracy
type Scheme = 'standard' | 'joint' | 'sequential' | 'independent';
const ROWS: Scheme[] = (['joint', 'standard', 'sequential', 'independent'] as Scheme[]).sort((a, b) => CUB.acc[b] - CUB.acc[a]);

// 23.6 curve styles (amber is only the act of correcting)
const CURVES: { k: 'independent' | 'sequential' | 'joint'; col: string; sw: number; dash?: string; dy: number }[] = [
  { k: 'independent', col: C.chalk, sw: 5, dy: -18 },
  { k: 'sequential', col: C.chalk2, sw: 4, dash: '14 9', dy: 18 },
  { k: 'joint', col: HEADC, sw: 4, dash: '3 9', dy: 0 },
];

// ------------------------------------------------------------------ helpers
const Slide: React.FC<{ o: number; children?: React.ReactNode }> = ({ o, children }) =>
  o <= 0.001 ? null : <div style={{ position: 'absolute', inset: 0, opacity: o < 0.999 ? o : undefined }}>{children}</div>;

/** a padlock glyph centred on (x, y) */
const Lock: React.FC<{ x: number; y: number; s?: number; o?: number; color?: string }> = ({ x, y, s = 1, o = 1, color = C.chalk2 }) =>
  o <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o < 0.999 ? o : undefined}>
      <path d="M -11 -2 L -11 -12 A 11 11 0 0 1 11 -12 L 11 -2" fill="none" stroke={color} strokeWidth={4} />
      <rect x={-16} y={-4} width={32} height={26} rx={5} fill={color} />
      <circle cx={0} cy={8} r={3.5} fill="#0B0F14" />
    </g>
  );

/** a small column of teal bars standing for a concept vector, centred on (x, y) */
const ConceptGlyph: React.FC<{ x: number; y: number; n?: number; h?: number; o?: number }> = ({ x, y, n = 8, h = 120, o = 1 }) =>
  o <= 0.001 ? null : (
    <g opacity={o < 0.999 ? o : undefined}>
      <rect x={x - 34} y={y - h / 2 - 8} width={68} height={h + 16} rx={8} fill="none" stroke={rgba(C.concept, 0.7)} strokeWidth={2} />
      {Array.from({ length: n }, (_, i) => (
        <rect key={i} x={x - 24} y={y - h / 2 + i * (h / n) + 2} width={10 + 38 * (((i * 37) % 11) / 10)} height={h / n - 5} rx={2} fill={rgba(C.concept, 0.85)} />
      ))}
    </g>
  );

/** square brackets around a column of height h at x0..x1 */
const Brackets: React.FC<{ x0: number; x1: number; y: number; h: number; color: string; o?: number }> = ({ x0, x1, y, h, color, o = 1 }) =>
  o <= 0.001 ? null : (
    <g opacity={o < 0.999 ? o : undefined} fill="none" stroke={color} strokeWidth={3.5}>
      <path d={`M ${x0 + 14} ${y} L ${x0} ${y} L ${x0} ${y + h} L ${x0 + 14} ${y + h}`} />
      <path d={`M ${x1 - 14} ${y} L ${x1} ${y} L ${x1} ${y + h} L ${x1 - 14} ${y + h}`} />
    </g>
  );

// ------------------------------------------------------------------ geometry
const CARDX = [500, 960, 1420];
const PH2: Rect = { x: 170, y: 420, w: 160, h: 160 };
const PY = 500; // 23.2 pipeline row
const COLX = { photo: 250, clip: 520, g: 800, c: 1060, f: 1320, y: 1575 };
const PH3: Rect = { x: 170, y: 410, w: 210, h: 210 };
const EV = { x0: 458, x1: 610, y: 347, rh: 56 }; // e(x) column (6 rows: 4 entries, dots, the last)
const CV = { lab: 930, x0: 950, x1: 1070, y: 360, rh: 64 }; // c hat column
const BAR = { x: 300, x0: 580, w: 900, y0: 400, dy: 100 }; // 23.4
const CH = { x0: 420, x1: 1260, y0: 330, y1: 750, v0: 0.4, v1: 1.0 }; // 23.6 chart

export const S23: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.5) => inv(x, x + d, t);
  const NB = P.beats.length;
  const sl = (k: number) => inv(b(k) - 0.05, b(k) + 0.25, t) * (k < NB ? 1 - inv(b(k + 1) - 0.35, b(k + 1) - 0.05, t) : 1);

  // ---------------- 23.1
  const c1 = [at(w(1, 'three') - 0.1), at(w(1, 'three') + 0.3), at(w(1, 'three') + 0.7)];
  const c1run = at(w(1, 'small') - 0.1);

  // ---------------- 23.2
  const p2x = at(w(2, 'photo') - 0.1), p2clip = at(w(2, 'frozen') - 0.1), p2e = at(w(2, '512') - 0.2);
  const p2g = at(w(2, 'linear') - 0.1), p2c = at(w(2, '112') - 0.2), p2f = at(w(2, 'linear', 1) - 0.1), p2y = at(w(2, '200') - 0.2);
  const live2 = at(w(2, '200'), 0.6);
  const split2 = at(w(2, '200') + 0.6);

  // ---------------- 23.3
  const s3ph = at(b(3) - 0.05, 0.3);
  const s3e = at(w(3, 'gull') - 0.1);
  const s3c = at(w(3, 'predictor') - 0.1);
  const s3hi = (key: string) => (key.includes('throat') ? at(w(3, 'throat') - 0.1, 0.3) : key.includes('wing_color') ? at(w(3, 'grey') - 0.2, 0.3) : 0);
  const s3y = E.out(inv(w(3, 'spreads') - 0.1, w(3, 'spreads') + 0.9, t));

  // ---------------- 23.4
  const r4: Record<Scheme, number> = {
    joint: at(w(4, 'Joint') - 0.1, 0.7), standard: at(w(4, 'standard') - 0.1, 0.7),
    sequential: at(w(4, 'Sequential') - 0.1, 0.7), independent: at(w(4, 'independent') - 0.1, 0.7),
  };
  const ax4 = at(b(4) - 0.05, 0.3);

  // ---------------- 23.5
  const w5 = at(w(5, 'replace') - 0.1), eq5 = at(w(5, 'true') - 0.1);
  const v5 = at(w(5, 'Pick') - 0.1), per5 = at(w(5, 'replace') + 0.2, 0.4);
  const e5 = E.io(inv(w(5, 'true'), w(5, 'values', 1) + 0.6, t));
  const h5 = at(w(5, 'same') - 0.1);

  // ---------------- 23.6
  const ax6 = at(b(6) - 0.05, 0.3);
  const draw = E.io(inv(b(6) + 0.2, w(6, 'trusts'), t));
  const kNow = draw * NG;
  const fast = at(w(6, 'fastest') - 0.2);
  const least = at(w(6, 'least') - 0.3);
  const endLab = at(w(6, 'trusts') - 0.2);

  // ---------------- 23.7
  const s7row = at(b(7) - 0.05, 0.3);
  const s7m = E.io(inv(b(7) + 0.1, b(7) + 0.8, t));
  const s7k = E.io(inv(w(7, 'fine') - 0.2, w(7, 'fine') + 0.6, t)), s7kl = at(w(7, 'beyond') - 0.1);
  const s7e = E.io(inv(w(7, 'corrected') - 0.1, w(7, 'corrected') + 0.6, t));
  const s7x = inv(w(7, 'less') - 0.1, w(7, 'less') + 0.4, t);
  const s7l = at(w(7, 'leakage') - 0.15);

  // ---------------- 23.8
  const r8 = [at(b(8) + 0.1, 0.4), at(w(8, 'Koh') - 0.1), at(w(8, 'same') - 0.1), at(w(8, 'fully') - 0.1)];

  // chart helpers
  const cx = (k: number) => CH.x0 + (k / NG) * (CH.x1 - CH.x0);
  const cy = (v: number) => CH.y1 - ((v - CH.v0) / (CH.v1 - CH.v0)) * (CH.y1 - CH.y0);
  const curvePts = (vals: number[]) => {
    const pts: [number, number][] = [];
    for (let k = 0; k <= NG; k++) {
      if (k <= kNow) pts.push([cx(k), cy(vals[k])]);
      else { const f = kNow - (k - 1); if (f > 0) pts.push([cx(kNow), cy(vals[k - 1] + (vals[k] - vals[k - 1]) * f)]); break; }
    }
    return pts;
  };

  return (
    <Stage>
      <Header t={t} part={5} title={P.title} />
      <ArchMap on={['g', 'c', 'f']} o={inv(0, 0.5, t)} />

      {/* ============================================================ 23.1 why */}
      <Slide o={sl(1)}>
        <SlideHead text={bh(P, 1)} />
        <Svg>
          {CARDX.map((x, i) => {
            const o = c1[i];
            if (o <= 0.001) return null;
            const yb = 520;
            return (
              <g key={i} opacity={o < 0.999 ? o : undefined}>
                <rect x={x - 200} y={360} width={400} height={370} rx={16} fill={C.bg2} stroke={C.line2} strokeWidth={2} />
                <Block x={x - 120} y={yb} w={86} h={64} kind="input" />
                <MathSvg x={x - 120} y={yb} tex="\gth" size={32} />
                <ConceptGlyph x={x} y={yb} n={5} h={70} />
                <Block x={x + 120} y={yb} w={86} h={64} kind="head" />
                <MathSvg x={x + 120} y={yb} tex="\fph" size={32} />
                <Flow pts={[[x - 74, yb], [x - 40, yb]]} color={C.input} sw={3} head={10} />
                <Flow pts={[[x + 40, yb], [x + 74, yb]]} color={C.concept} sw={3} head={10} />
                {i === 0 ? (
                  <g>
                    <Flow pts={[[x + 120, yb + 82], [x + 120, yb + 36]]} color={C.concept} sw={3} head={10} />
                    <MathSvg x={x + 120} y={yb + 100} tex="\ccon{c}" size={28} />
                  </g>
                ) : null}
                {i === 1 ? <Lock x={x - 120} y={yb - 62} color={C.input} /> : null}
                {i === 2 ? <Flow pts={[[x + 120, yb - 40], [x + 120, yb - 70], [x - 120, yb - 70], [x - 120, yb - 40]]} color={C.loss} sw={3} head={10} /> : null}
              </g>
            );
          })}
        </Svg>
        {[
          ['independent', '{f:head} fitted on true {c:concepts}'],
          ['sequential', '{x:predictor} frozen, {f:head} fitted on its {c:predictions}'],
          ['joint', 'both trained together on both {l:losses}'],
        ].map(([n, d], i) => (
          <React.Fragment key={n}>
            <Rich x={CARDX[i]} y={392} ax="center" size={34} weight={700} text={n} o={c1[i]} />
            <Rich x={CARDX[i]} y={645} ax="center" w={360} size={26} color={C.chalk2} lh={1.3} text={d} o={c1[i]} />
          </React.Fragment>
        ))}
        <Rich x={960} y={790} ax="center" size={30} color={C.chalk2}
          text={`our small run on CUB: ${commas(CUB.n_train)} training photos, ${commas(CUB.n_test)} test photos`} o={c1run} />
      </Slide>

      {/* ============================================================ 23.2 setup */}
      <Slide o={sl(2)}>
        <SlideHead text={bh(P, 2)} />
        <PhotoR R={PH2} src="gull.jpg" o={p2x} border={C.input} />
        <Svg>
          <Flow pts={[[PH2.x + PH2.w + 8, PY], [COLX.clip - 116, PY]]} color={C.input} sw={4} head={14} o={p2clip} t={t} live={live2} n={1} dotR={5} />
          <Block x={COLX.clip} y={PY} w={220} h={120} kind="input" title="CLIP encoder" sub="frozen" size={28} o={p2clip} />
          <Lock x={COLX.clip + 92} y={PY - 82} o={p2clip} color={C.input} />
          <Flow pts={[[COLX.clip + 116, PY], [COLX.g - 80, PY]]} color={C.input} sw={4} head={14} o={p2e} t={t + 0.3} live={live2} n={2} dotR={5} />
          <Block x={COLX.g} y={PY} w={150} h={120} kind="input" title="linear" sub="predictor" size={28} o={p2g} />
          <Flow pts={[[COLX.g + 80, PY], [COLX.c - 44, PY]]} color={C.concept} sw={4} head={14} o={p2c} t={t + 0.6} live={live2} n={1} dotR={5} />
          <ConceptGlyph x={COLX.c} y={PY} n={10} h={120} o={p2c} />
          <Flow pts={[[COLX.c + 44, PY], [COLX.f - 80, PY]]} color={C.concept} sw={4} head={14} o={p2f} t={t + 0.9} live={live2} n={1} dotR={5} />
          <Block x={COLX.f} y={PY} w={150} h={120} kind="head" title="linear" sub="task head" size={28} o={p2f} />
          <Flow pts={[[COLX.f + 80, PY], [COLX.y - 110, PY]]} color={C.chalk2} sw={4} head={14} o={p2y} t={t + 1.2} live={live2} n={1} dotR={5} />
          <Txt x={COLX.y} y={PY} size={36} weight={700} o={p2y}>{`${N_SPECIES} species`}</Txt>
        </Svg>
        <Credit x={PH2.x} y={PH2.y + PH2.h + 8} text={CREDIT['gull.jpg']} o={p2x} />
        {/* the same path in symbols, aligned under each part */}
        <Tex x={COLX.photo} y={660} ax="center" size={44} tex="\cin{x}" o={p2x} />
        <Tex x={COLX.clip} y={660} ax="center" size={44} tex={`\\cin{e}(\\cin{x}) \\in \\mathbb{R}^{${N_FEAT}}`} o={p2e} />
        <Tex x={COLX.g} y={660} ax="center" size={44} tex="\gth" o={p2g} />
        <Tex x={COLX.c} y={660} ax="center" size={44} tex={`\\cvec \\in [0,1]^{${NC}}`} o={p2c} />
        <Tex x={COLX.f} y={660} ax="center" size={44} tex="\fph" o={p2f} />
        <Tex x={COLX.y} y={660} ax="center" size={44} tex="\yh" o={p2y} />
        <Rich x={960} y={760} ax="center" size={28} color={C.chalk2}
          text={`CUB official split: ${commas(CUB.n_train)} training photos, ${commas(CUB.n_test)} test photos`} o={split2} />
        <EvTag x={1760} y={880} ax="right" kind="measured" text={TAG_RUN} o={p2clip} />
      </Slide>

      {/* ============================================================ 23.3 one photo through */}
      <Slide o={sl(3)}>
        <SlideHead text={bh(P, 3)} />
        <PhotoR R={PH3} src="gull.jpg" o={s3ph} border={C.input} />
        <Credit x={160} y={900} text={CREDIT['gull.jpg']} o={s3ph} />
        <Svg>
          {/* e(x): the real feature entries (first four and the last) */}
          <Flow pts={[[PH3.x + PH3.w + 10, 515], [EV.x0 - 14, 515]]} color={C.input} sw={4} head={14} o={s3e} t={t} live={s3e} n={1} dotR={5} />
          <Brackets x0={EV.x0} x1={EV.x1} y={EV.y} h={E_GULL.length * EV.rh} color={C.input} o={s3e} />
          {E_GULL.map((v, i) => (
            <Txt key={i} x={(EV.x0 + EV.x1) / 2} y={EV.y + (i + 0.5) * EV.rh} size={28} mono weight={600} o={s3e}>{v}</Txt>
          ))}
          <MathSvg x={(EV.x0 + EV.x1) / 2} y={EV.y - 34} tex={`\\cin{e}(\\cin{x}) \\in \\mathbb{R}^{${N_FEAT}}`} size={32} o={s3e} />
          {/* c hat: four named concepts */}
          <Flow pts={[[EV.x1 + 14, 515], [CV.lab - 262, 515]]} color={C.input} sw={4} head={14} o={s3c} t={t + 0.3} live={s3c} n={1} dotR={5} />
          <Brackets x0={CV.x0} x1={CV.x1} y={CV.y} h={5 * CV.rh} color={C.concept} o={s3c} />
          {SHOW_C.map((c, i) => {
            const y = CV.y + (i + 0.5) * CV.rh, hi = s3hi(c.key);
            return (
              <g key={c.key} opacity={s3c < 0.999 ? s3c : undefined}>
                {hi > 0.001 ? <rect x={CV.lab - 250} y={y - 26} width={CV.x1 - CV.lab + 262} height={52} rx={10} fill={rgba(C.concept, 0.12 * hi)} stroke={C.concept} strokeWidth={2} opacity={hi} /> : null}
                <Txt x={CV.lab} y={y} size={26} anchor="end" fill={C.concept}>{c.name}</Txt>
                <Txt x={(CV.x0 + CV.x1) / 2} y={y} size={30} mono weight={600}>{c.v.toFixed(2)}</Txt>
              </g>
            );
          })}
          <MathSvg x={(CV.x0 + CV.x1) / 2} y={CV.y + 4.5 * CV.rh} tex="\ccon{\vdots}" size={32} o={s3c} />
          <MathSvg x={(CV.x0 + CV.x1) / 2} y={CV.y - 34} tex="\cvec" size={34} o={s3c} />
          {/* f -> species */}
          <Flow pts={[[CV.x1 + 14, 515], [1196, 515]]} color={C.concept} sw={4} head={14} o={inv(0, 0.3, s3y)} t={t + 0.6} live={s3y} n={1} dotR={5} />
          <Block x={1250} y={515} w={90} h={80} kind="head" o={inv(0, 0.3, s3y)} />
          <MathSvg x={1250} y={515} tex="\fph" size={32} o={inv(0, 0.3, s3y)} />
          <Flow pts={[[1300, 515], [1340, 515]]} color={C.chalk2} sw={4} head={12} o={inv(0, 0.3, s3y)} />
          <ShareBars x={1360} y={425} labels={SP.map(([s]) => sname(s))} from={SP.map(([, v]) => v)} w={98} labelW={264} rowH={60} size={24} p={s3y} o={inv(0, 0.25, s3y)} />
          <Txt x={1360} y={372} size={22} anchor="start" fill={C.mute} o={s3y}>{`top 4 of ${N_SPECIES} species`}</Txt>
        </Svg>
        <EvTag x={1760} y={880} ax="right" kind="computed" text="our gull photo: CLIP ViT-B/32 feature, our CUB model" o={s3e} />
      </Slide>

      {/* ============================================================ 23.4 accuracy */}
      <Slide o={sl(4)}>
        <SlideHead text={bh(P, 4)} />
        <Svg>
          <g opacity={ax4 < 0.999 ? ax4 : undefined}>
            {[0, 0.5, 1].map((v) => (
              <g key={v}>
                <line x1={BAR.x0 + BAR.w * v} x2={BAR.x0 + BAR.w * v} y1={BAR.y0 - 50} y2={BAR.y0 + 3 * BAR.dy + 40} stroke={C.line} strokeWidth={1.5} strokeDasharray={v ? '5 8' : undefined} />
                <Txt x={BAR.x0 + BAR.w * v} y={BAR.y0 + 3 * BAR.dy + 66} size={22} mono fill={C.mute}>{`${(v * 100).toFixed(0)} %`}</Txt>
              </g>
            ))}
          </g>
          {ROWS.map((k, i) => {
            const p = r4[k], v = CUB.acc[k] as number, y = BAR.y0 + i * BAR.dy;
            return p <= 0.001 ? null : (
              <g key={k} opacity={Math.min(1, p * 2)}>
                <Txt x={BAR.x0 - 30} y={y - (k === 'standard' ? 12 : 0)} size={32} anchor="end" weight={600} fill={k === 'standard' ? C.chalk2 : C.chalk}>{k}</Txt>
                {k === 'standard' ? <Txt x={BAR.x0 - 30} y={y + 22} size={22} anchor="end" fill={C.mute}>no bottleneck</Txt> : null}
                <rect x={BAR.x0} y={y - 24} width={BAR.w * v * E.out(p)} height={48} rx={6} fill={C.chalk} opacity={k === 'standard' ? 0.4 : 0.9} />
                <Txt x={BAR.x0 + BAR.w * v * E.out(p) + 18} y={y} size={32} mono weight={700} anchor="start" fill={k === 'standard' ? C.chalk2 : C.chalk} o={inv(0.5, 1, p)}>{`${pc(v)} %`}</Txt>
              </g>
            );
          })}
        </Svg>
        <Rich x={BAR.x0 + BAR.w / 2} y={BAR.y0 + 3 * BAR.dy + 100} ax="center" size={28} color={C.chalk2} text={`task accuracy on ${commas(CUB.n_test)} test photos`} o={ax4} />
        <EvTag x={1760} y={880} ax="right" kind="measured" text={TAG_SHORT} o={ax4} />
      </Slide>

      {/* ============================================================ 23.5 the intervention operator */}
      <Slide o={sl(5)}>
        <SlideHead text={bh(P, 5)} />
        <Rich x={760} y={330} ax="center" size={30} text="{c:predicted value}" o={w5} />
        <Rich x={1160} y={330} ax="center" size={30} text="{e:true value}" o={w5} />
        <Tex x={760} y={410} ax="center" size={60} tex="\ch_j" o={eq5} />
        <Tex x={960} y={410} ax="center" size={60} tex="\leftarrow" o={eq5} />
        <Tex x={1160} y={410} ax="center" size={60} tex="\cedit{c_j}" o={eq5} />
        <Svg>
          <Txt x={640} y={520} size={26} weight={600} fill={C.chalk2} o={v5}>one group: wing colour</Txt>
          {WING.map((g, i) => (
            <Txt key={g.name} x={590} y={580 + i * 62} size={28} anchor="end" fill={C.concept} o={v5}>{g.name}</Txt>
          ))}
          <Brackets x0={610} x1={730} y={550} h={4 * 62} color={C.concept} o={v5} />
          {WING_PRED.map((v, i) => <Txt key={i} x={670} y={580 + i * 62} size={30} mono weight={600} o={v5}>{v.toFixed(2)}</Txt>)}
          <Person x={860} y={600} s={0.9 * E.back(per5)} o={per5} />
          <Flow pts={[[760, 674], [960, 674]]} color={C.edit} sw={4} head={14} p={e5} />
          <Brackets x0={990} x1={1110} y={550} h={4 * 62} color={C.edit} o={inv(0, 0.3, e5)} />
          {WING.map((g, i) => (
            <Txt key={g.name} x={1050} y={580 + i * 62} size={30} mono weight={700} fill={C.edit} o={e5}>{g.truth.toFixed(0)}</Txt>
          ))}
          <Flow pts={[[1126, 674], [1250, 674]]} color={C.edit} sw={4} head={14} o={h5} />
          <Block x={1340} y={674} w={160} h={100} kind="head" title="same" sub="task head" size={26} o={h5} />
          <Flow pts={[[1424, 674], [1500, 674]]} color={C.chalk2} sw={4} head={14} o={h5} />
          <MathSvg x={1540} y={674} tex="\yh" size={44} o={h5} />
        </Svg>
        <EvTag x={1760} y={880} ax="right" kind="computed" text="our model on our gull photo; true values: Herring Gull's CUB labels" o={v5} />
      </Slide>

      {/* ============================================================ 23.6 curves */}
      <Slide o={sl(6)}>
        <SlideHead text={bh(P, 6)} />
        <Svg>
          <g opacity={ax6 < 0.999 ? ax6 : undefined}>
            {[0.4, 0.6, 0.8, 1.0].map((v) => (
              <g key={v}>
                <line x1={CH.x0} y1={cy(v)} x2={CH.x1} y2={cy(v)} stroke={C.line} strokeWidth={1.5} strokeDasharray={v === CH.v0 ? undefined : '5 8'} />
                <Txt x={CH.x0 - 16} y={cy(v)} size={22} mono anchor="end" fill={C.mute}>{`${(v * 100).toFixed(0)} %`}</Txt>
              </g>
            ))}
            <line x1={CH.x0} y1={CH.y0 - 10} x2={CH.x0} y2={CH.y1} stroke={C.line2} strokeWidth={2} />
            {[0, 7, 14, 21, 28].filter((k) => k <= NG).map((k) => (
              <g key={k}>
                <line x1={cx(k)} y1={CH.y1} x2={cx(k)} y2={CH.y1 + 8} stroke={C.line2} strokeWidth={2} />
                <Txt x={cx(k)} y={CH.y1 + 30} size={22} mono fill={C.chalk2}>{String(k)}</Txt>
              </g>
            ))}
            <Txt x={(CH.x0 + CH.x1) / 2} y={CH.y1 + 72} size={26} fill={C.chalk2}>{`attribute groups corrected, random order (of ${NG})`}</Txt>
            <Txt x={CH.x0 - 90} y={CH.y0 - 30} size={22} anchor="start" fill={C.mute}>task accuracy</Txt>
          </g>
          {/* amber: how many groups the oracle has corrected so far */}
          {draw > 0.001 && draw < 0.999 ? (
            <g>
              <line x1={cx(kNow)} y1={CH.y0} x2={cx(kNow)} y2={CH.y1} stroke={C.edit} strokeWidth={2.5} strokeDasharray="6 6" />
              <Txt x={cx(kNow) + 10} y={CH.y1 - 20} size={22} anchor="start" weight={600} fill={C.edit}>{`${Math.round(kNow)} corrected`}</Txt>
            </g>
          ) : null}
          {CURVES.map((c) => (
            <circle key={c.k} cx={cx(0)} cy={cy(IV[c.k][0])} r={7} fill={c.col} opacity={ax6} />
          ))}
          {draw > 0.001 ? CURVES.map((c) => {
            const pts = curvePts(IV[c.k]);
            const emph = c.k === 'independent' ? fast : c.k === 'joint' ? least : 0;
            return pts.length > 1 ? (
              <polyline key={c.k} points={pts.map((q) => q.join(',')).join(' ')} fill="none" stroke={c.col} strokeWidth={c.sw + 2 * emph}
                strokeDasharray={c.dash} strokeLinejoin="round" strokeLinecap="round" />
            ) : null;
          }) : null}
          {CURVES.map((c) => {
            const v = IV[c.k][NG] as number;
            return (
              <g key={c.k} opacity={endLab}>
                <circle cx={cx(NG)} cy={cy(v)} r={6} fill={c.col} />
                <Txt x={CH.x1 + 24} y={cy(v) + c.dy} size={26} anchor="start" weight={600} fill={c.col}>{c.k}</Txt>
                <Txt x={CH.x1 + 190} y={cy(v) + c.dy} size={26} anchor="start" mono weight={700} fill={c.col}>{`${pc(v)} %`}</Txt>
              </g>
            );
          })}
          {/* start labels at k = 0 */}
          {CURVES.map((c) => (
            <Txt key={c.k} x={cx(0) + 16} y={cy(IV[c.k][0]) + (c.k === 'independent' ? 24 : c.k === 'joint' ? -22 : 22)} size={22} anchor="start" fill={c.col}
              o={ax6 * (1 - inv(0.05, 0.25, draw))}>{c.k}</Txt>
          ))}
        </Svg>
        <Rich x={CH.x1 + 24} y={cy(0.902) + 50} w={470} size={24} color={C.chalk2} lh={1.3}
          text={`all ${NG} groups true: every species has its own pattern, so {y:independent} reaches ${pc(CUB.acc.oracle_true_concepts)} %`} o={endLab} />
        <EvTag x={1760} y={880} ax="right" kind="measured" text={`${TAG_SHORT}, averaged over random orders`} o={ax6} />
      </Slide>

      {/* ============================================================ 23.7 why joint gains least */}
      <Slide o={sl(7)}>
        <SlideHead text={bh(P, 7)} />
        <Svg>
          <ConceptRow x={260} y={560} label="wing: grey" v={WING_PRED[0]} w={240} labelW={180} size={30} barH={30} o={s7row}
            edit={s7e > 0.001 ? { to: WING[0].truth, p: s7e } : undefined} />
          {/* meaning: teal, solid */}
          <Flow pts={[[800, 545], [930, 470], [1220, 470], [1306, 530]]} color={s7e > 0.5 ? C.edit : C.concept} sw={4} head={14} p={s7m} t={t} live={s7row} n={2} dotR={5} />
          {/* extra detail in the exact soft value: purple, dotted */}
          <Flow pts={[[800, 575], [930, 650], [1220, 650], [1306, 590]]} color={C.leak} sw={4} head={14} dash="3 10" p={s7k} t={t + 0.4} live={s7k * (1 - s7e)} n={2} dotR={5}
            o={1 - 0.65 * s7e} />
          <Cross x={1050} y={628} w={44} h={44} p={s7x} />
          <Block x={1400} y={560} w={180} h={130} kind="head" title="joint" sub="task head" size={30} o={s7row} />
        </Svg>
        <Rich x={1075} y={420} ax="center" size={28} text="{c:what the concept means}" o={s7m} />
        <Rich x={1075} y={680} ax="center" size={28} text="{k:extra detail in the exact score}" o={s7kl} />
        <Rich x={960} y={765} ax="center" size={30} text="a {e:corrected} 0 or 1 carries the meaning, not the detail" o={s7x} />
        <Rich x={960} y={818} ax="center" size={28} color={C.chalk2} text="this is {k:leakage}: Part 9" o={s7l} />
        <EvTag x={260} y={880} kind="schematic" text="one concept drawn; the head reads all 112" o={s7row} />
      </Slide>

      {/* ============================================================ 23.8 Koh et al. */}
      <Slide o={sl(8)}>
        <SlideHead text={bh(P, 8)} />
        <Svg>
          <g opacity={r8[0] < 0.999 ? r8[0] : undefined}>
            <line x1={280} x2={1640} y1={430} y2={430} stroke={C.line2} strokeWidth={2} />
            {[1, 2].map((i) => <line key={i} x1={280} x2={1640} y1={430 + i * 100} y2={430 + i * 100} stroke={C.line} strokeWidth={1.5} opacity={r8[i + 1]} />)}
          </g>
        </Svg>
        <Rich x={900} y={385} ax="center" ay="middle" size={30} weight={700} text="ours" o={r8[0]} />
        <Rich x={1380} y={385} ax="center" ay="middle" size={30} weight={700} text="Koh et al. 2020" o={r8[1]} />
        {[
          { lab: 'network', ours: '{x:frozen CLIP} + linear', koh: '{x:Inception-v3}, trained fully', o: r8[1] },
          { lab: 'accuracy: joint / independent', ours: `${pc(CUB.acc.joint)} % / ${pc(CUB.acc.independent)} %`, koh: `${pc(1 - KOH.joint)} % / ${pc(1 - KOH.independent)} %`, o: r8[2] },
          { lab: 'gains most from intervention', ours: '{y:independent}', koh: '{y:independent}', o: r8[2] },
        ].map((r, i) => (
          <React.Fragment key={r.lab}>
            <Rich x={300} y={480 + i * 100} ay="middle" size={26} color={C.chalk2} text={r.lab} o={r.o} />
            <Rich x={900} y={480 + i * 100} ax="center" ay="middle" size={30} text={r.ours} o={r.o} />
            <Rich x={1380} y={480 + i * 100} ax="center" ay="middle" size={30} text={r.koh} o={r.o} />
          </React.Fragment>
        ))}
        <Rich x={960} y={770} ax="center" size={30} text="fully trained networks: higher accuracy, the same pattern" o={r8[3]} />
        <EvTag x={160} y={880} kind="measured" text={TAG_SHORT} o={r8[0]} />
        <EvTag x={1760} y={880} ax="right" kind="reported" text="Koh et al. 2020, Table 1 and Fig. 4" o={r8[1]} />
      </Slide>
    </Stage>
  );
};
