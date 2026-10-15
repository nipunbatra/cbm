// s09 Part 9 · Concept leakage (revision 2, shortened: 7 slides, one per beat)
// 9.1 motivation: one number per concept travels to the head; what does it carry?
// 9.2 definition: the value should answer one question (one bit); a purple thread = anything more, leakage if used
// 9.3 two zebra photos, both stripes = 1 (same binary label); constructed
// 9.4 the soft scores: two constructed distributions on 0.6 to 1.0 (D.leak), about 0.72 and 0.96, small photos above
//     each; the head's cut at 0.84; accuracy reading the score 1.00 vs reading the bit 0.50 (chance)
// 9.5 the pipeline: the stripes wire carries a purple core, stripe density, unnamed and uninspectable
// 9.6 the edit: stripes 0.72 -> 1.00 (before / after, its true value); on the head's axis 1.00 > 0.84 -> Grévy's, wrong
// 9.7 implicit (purple core in the score) and explicit (a purple side path with latent features); an amber edit leaves
//     the side path flowing; caveat: ordinary variation is not leakage, leakage is systematic and used
// Slides replace each other: the old one fades out just before a beat, the new one fades in on its first words.
import React from 'react';
import { C } from '../kit/theme';
import { E, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, bs, bw, bh, clamp, inv, type SceneProps } from '../kit/core';
import { ArchMap, Block, CREDIT, Credit, Cross, EvTag, Flow, Person, PhotoR, Pill, fit, rgba } from '../kit/cbm';
import { lerp, wob } from '../kit/anim';
import { BText } from '../kit/slots';
import { D } from '../kit/data';

const L = D.leak;
const XS: number[] = L.xs;
const PDF: number[][] = L.pdf;
const MU: number[] = L.mu;
const THR: number = L.threshold;
const CLS: string[] = L.classes; // plains zebra, Grévy's zebra
const HARD: number[] = L.hard_label;
const SHORT = ['plains', "Grévy's"];
const HEADC = '#9AA6B5'; // the task head's light grey (words and lines)

/** one slide: a full-frame layer with its own opacity */
const Slide: React.FC<{ o: number; children?: React.ReactNode }> = ({ o, children }) =>
  o <= 0.001 ? null : <div style={{ position: 'absolute', inset: 0, opacity: o < 0.999 ? o : undefined }}>{children}</div>;

/** score distributions over [lo, hi] mapped to x..x+w, baseline y, height h; g grows them */
const Humps: React.FC<{ x: number; y: number; w: number; h: number; lo?: number; hi?: number; which?: number[]; g?: number[]; col?: string; sw?: number }> = ({
  x, y, w, h, lo = 0.6, hi = 1.0, which = [0, 1], g = [1, 1], col = C.concept, sw = 3,
}) => {
  const X = (v: number) => x + ((v - lo) / (hi - lo)) * w;
  return (
    <g>
      {which.map((k, j) => {
        const gg = E.out(clamp(g[j] ?? 1));
        if (gg <= 0.001) return null;
        const pts = XS.map((v, i) => `${X(v).toFixed(1)},${(y - PDF[k][i] * h * gg).toFixed(1)}`);
        return <path key={k} d={`M ${X(XS[0])},${y} L ${pts.join(' L ')} L ${X(XS[XS.length - 1])},${y} Z`} fill={rgba(col, 0.2)} stroke={col} strokeWidth={sw} strokeLinejoin="round" />;
      })}
    </g>
  );
};

/** an axis with ticks from lo to hi (step), x..x+w at baseline y */
const Axis: React.FC<{ x: number; y: number; w: number; lo: number; hi: number; ticks: number[]; p?: number; size?: number }> = ({ x, y, w, lo, hi, ticks, p = 1, size = 22 }) => {
  const X = (v: number) => x + ((v - lo) / (hi - lo)) * w;
  return (
    <g>
      <line x1={x} y1={y} x2={x + w * p} y2={y} stroke={C.line2} strokeWidth={3} />
      {ticks.map((v, i) => (
        <g key={v} opacity={inv(0.2 + i * 0.1, 0.5 + i * 0.1, p)}>
          <line x1={X(v)} y1={y} x2={X(v)} y2={y + 10} stroke={C.line2} strokeWidth={2.5} />
          <Txt x={X(v)} y={y + 34} size={size} mono fill={C.mute}>{v.toFixed(1)}</Txt>
        </g>
      ))}
    </g>
  );
};

/** a concept node: title, optional value bar; an amber edit moves v to vTo with progress ep */
const ConceptNode: React.FC<{ x: number; y: number; w: number; h: number; o?: number; v?: number; vTo?: number; ep?: number; bar?: boolean; glow?: number; ts?: number }> = ({
  x, y, w, h, o = 1, v = 0, vTo, ep = 0, bar = false, glow = 0, ts = 32,
}) => {
  if (o <= 0.001) return null;
  const edited = vTo !== undefined && ep > 0.001;
  const cur = vTo !== undefined ? lerp(v, vTo, E.io(clamp(ep))) : v;
  const col = edited ? C.edit : C.concept;
  const bw0 = w - 160, bx = x - w / 2 + 28, by = y + h * 0.2;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      {glow > 0.001 ? <rect x={x - w / 2 - 12} y={y - h / 2 - 12} width={w + 24} height={h + 24} rx={24} fill={rgba(C.leak, 0.18 * glow)} /> : null}
      <rect x={x - w / 2} y={y - h / 2} width={w} height={h} rx={16} fill={rgba(col, 0.12)} stroke={col} strokeWidth={3} />
      <Txt x={x} y={bar ? y - h * 0.2 : y} size={ts} weight={600} fill={C.chalk}>stripes present</Txt>
      {bar ? (
        <g>
          <rect x={bx} y={by - 12} width={bw0} height={24} rx={5} fill={C.bg3} />
          {edited ? <rect x={bx} y={by - 12} width={bw0 * v} height={24} rx={5} fill="none" stroke={C.concept} strokeWidth={2} strokeDasharray="5 5" opacity={0.75} /> : null}
          <rect x={bx} y={by - 12} width={bw0 * cur} height={24} rx={5} fill={col} opacity={0.92} />
          <Txt x={bx + bw0 + 18} y={by} size={30} anchor="start" mono weight={700} fill={edited ? C.edit : C.chalk}>{cur.toFixed(2)}</Txt>
        </g>
      ) : null}
    </g>
  );
};

/** a tick mark (a correct value) */
const Tick: React.FC<{ x: number; y: number; s?: number; o?: number }> = ({ x, y, s = 1, o = 1 }) =>
  o <= 0.001 ? null : (
    <path d={`M ${x - 13 * s} ${y} L ${x - 3 * s} ${y + 11 * s} L ${x + 15 * s} ${y - 13 * s}`} fill="none" stroke={C.good} strokeWidth={5.5}
      strokeLinecap="round" strokeLinejoin="round" opacity={o < 0.999 ? o : undefined} />
  );

// ---- geometry
// 9.3 photos
const RP = fit('zebra_plains.jpg', 260, 330, 580), RG = fit('zebra_grevy.jpg', 1080, 330, 580);
// 9.4 the score axis (0.6 to 1.0) with the head's cut
const A4 = { x: 220, y: 780, w: 960, h: 240 };
const SX4 = (v: number) => A4.x + ((v - 0.6) / 0.4) * A4.w;
const PH4 = 170; // photo width above each hump
// the pipeline (9.5, 9.7)
const PY = 540;
const ENC = { x: 470, y: PY }, NODE = { x: 830, y: PY, w: 320, h: 120 }, HEAD = { x: 1480, y: PY };
const WIRE: [number, number][] = [[NODE.x + NODE.w / 2 + 6, PY], [HEAD.x - 104, PY]];
const WM = (WIRE[0][0] + WIRE[1][0]) / 2;
const TH1 = fit('zebra_plains.jpg', 160, PY - 118, 170), TH2 = fit('zebra_grevy.jpg', 160, PY + 12, 170);
const BYP: [number, number][] = [[ENC.x, ENC.y + 58], [ENC.x, 740], [HEAD.x, 740], [HEAD.x, HEAD.y + 64]];
// 9.6 the head's view of the stripes value
const MX0 = 300, MX1 = 1180, MY = 740;
const MX = (v: number) => MX0 + ((v - 0.6) / 0.4) * (MX1 - MX0);
const R6 = fit('zebra_plains.jpg', 200, 330, 270);

export const S09: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.4) => inv(x, x + d, t);
  const NB = P.beats.length;
  const sl = (k: number) => inv(b(k) - 0.05, b(k) + 0.25, t) * (k < NB ? 1 - inv(b(k + 1) - 0.35, b(k + 1) - 0.05, t) : 1);
  /** a token travelling along a wire from x0 to x1, period per seconds, starting at t0 */
  const tokU = (t0: number, per = 2.1) => (t > t0 ? ((t - t0) / per) % 1 : -1);

  // ---------------- 9.1 motivation
  const s1n = at(w(1, 'concept') - 0.1, 0.5), s1h = at(w(1, 'task') - 0.1, 0.5);
  const s1tok = tokU(w(1, 'single'));
  const s1q = at(w(1, 'carry') - 0.2);
  const s1line = at(w(1, 'number') - 0.1);
  const N1 = { x: 620, y: 560 }, H1 = { x: 1320, y: 560 };
  const W1: [number, number][] = [[N1.x + 166, N1.y], [H1.x - 116, H1.y]];

  // ---------------- 9.2 definition
  const N2 = { x: 600, y: 600 }, H2 = { x: 1360, y: 600 };
  const W2: [number, number][] = [[N2.x + 166, N2.y - 20], [H2.x - 116, N2.y - 20]];
  const T2: [number, number][] = [[N2.x + 166, N2.y + 22], [H2.x - 116, N2.y + 22]];
  const s2n = at(b(2) - 0.05, 0.3);
  const s2q = at(w(2, 'question') - 0.1);
  const s2bit = tokU(w(2, 'present'));
  const s2thr = E.io(inv(w(2, 'more'), w(2, 'more') + 0.9, t));
  const s2more = at(w(2, 'more'));
  const s2uses = at(w(2, 'uses') - 0.1);

  // ---------------- 9.3 two zebras
  const s3ph = [at(w(3, 'plains') - 0.2, 0.5), at(w(3, 'Gr') - 0.2, 0.5)];
  const s3lab = [at(w(3, 'stripes', 1) - 0.2), at(w(3, 'equals'))];
  const s3bin = at(w(3, 'label') - 0.1);
  const s3tag = at(w(3, 'constructed') - 0.1);

  // ---------------- 9.4 soft scores and the head's cut
  const s4ax = E.io(inv(b(4) - 0.05, w(4, 'soft') + 0.5, t));
  const s4g = [inv(w(4, 'plains'), w(4, 'plains') + 1.2, t), inv(w(4, 'Gr'), w(4, 'Gr') + 1.2, t)];
  const s4ph = [at(w(4, 'plains') - 0.1), at(w(4, 'Gr') - 0.1)];
  const s4mu = [at(w(4, '072') - 0.1), at(w(4, '096') - 0.1)];
  const s4lab = at(w(4, 'soft') - 0.1);
  const s4mean = at(w(4, 'mean') - 0.1);
  const s4cut = E.out(inv(w(4, 'threshold') - 0.1, w(4, 'threshold') + 0.7, t));
  const s4cutL = at(w(4, '084') - 0.1);
  const s4aS = at(w(4, 'perfectly') - 0.1), s4aH = at(w(4, 'binary') - 0.1), s4ch = at(w(4, 'chance') - 0.1);

  // ---------------- 9.5 stripe density (the pipeline)
  const s5p = at(b(5) - 0.05, 0.3);
  const s5glow = at(w(5, 'also') - 0.1, 0.8);
  const s5hump = inv(w(5, 'carries'), w(5, 'carries') + 1.0, t);
  const s5dens = at(w(5, 'density') - 0.1), s5uni = at(w(5, 'inspect') - 0.1);
  const s5leak = at(w(5, 'leakage') - 0.1);

  // ---------------- 9.6 the edit and the head's view
  const s6ph = at(b(6) - 0.05, 0.3);
  const s6person = at(w(6, 'correct') - 0.4, 0.4);
  const s6eq = at(w(6, 'correct') - 0.1);
  const s6ep = E.io(inv(w(6, 'correct') + 0.2, w(6, '1') + 0.4, t));
  const s6tick = at(w(6, 'true') - 0.1);
  const s6ax = at(w(6, 'reads') - 0.3, 0.4);
  const s6cut = E.out(inv(w(6, '084') - 0.2, w(6, '084') + 0.5, t));
  const s6reg = at(w(6, 'Gr') - 0.1);
  const tMv = w(6, 'Gr');
  const s6mv = E.io(inv(tMv - 0.3, tMv + 0.6, t));
  const s6out = at(w(6, 'wrong') - 0.2);
  const s6x = inv(w(6, 'wrong'), w(6, 'wrong') + 0.5, t);

  // ---------------- 9.7 implicit, explicit, the edit, the caveat
  const s7p = at(b(7) - 0.05, 0.3);
  const s7imp = at(w(7, 'implicit') - 0.1);
  const s7pulse = Math.sin(Math.PI * inv(w(7, 'continuous'), w(7, 'score') + 0.9, t));
  const s7byp = E.io(inv(w(7, 'Explicit') - 0.1, w(7, 'side') + 1.2, t));
  const s7lat = at(w(7, 'latent') - 0.1);
  const s7exp = at(w(7, 'Explicit') - 0.1);
  const s7person = at(w(7, 'edit') - 0.4, 0.4);
  const s7ep = inv(w(7, 'edit'), w(7, 'controls') + 0.4, t);
  const s7hp = Math.sin(Math.PI * inv(w(7, 'sees') - 0.1, w(7, 'sees') + 0.9, t));
  const s7c1 = at(w(7, 'Ordinary') - 0.1, 0.5), s7c2 = at(w(7, 'leakage', 3) - 0.1, 0.5);

  // the pipeline drawing shared by 9.5 and 9.7
  const pipe = (o: number, opt: { core?: number; pulse?: number; byp?: number; bypLive?: number; ep?: number; hp?: number; humps?: number }) => {
    if (o <= 0.001) return null;
    const core = opt.core ?? 0, ep = opt.ep ?? 0;
    const edited = ep > 0.5;
    const pulse = opt.pulse ?? 0;
    return (
      <g>
        <Flow pts={[[TH1.x + TH1.w + 8, ENC.y], [ENC.x - 92, ENC.y]]} color={C.input} t={t} live={1} sw={3.5} head={12} n={2} />
        <Block x={ENC.x} y={ENC.y} w={170} h={116} kind="input" title="encoder" />
        <Flow pts={[[ENC.x + 88, ENC.y], [NODE.x - NODE.w / 2 - 8, NODE.y]]} color={C.input} t={t} live={1} sw={3.5} head={14} n={2} />
        {/* the concept wire: teal (amber when edited) with a purple core */}
        <path d={`M ${WIRE[0][0]} ${PY} L ${WIRE[1][0]} ${PY}`} stroke={rgba(C.leak, 0.22 * core)} strokeWidth={30} strokeLinecap="round" />
        <Flow pts={WIRE} color={edited ? C.edit : C.concept} t={t} live={1} sw={11} head={20} n={3} dotR={0.01} />
        {core > 0.001 ? <path d={`M ${WIRE[0][0]} ${PY} L ${WIRE[1][0] - 22} ${PY}`} stroke={C.leak} strokeWidth={4 + 3 * pulse} opacity={core} strokeLinecap="round" /> : null}
        <Flow pts={WIRE} color={edited ? C.edit : C.concept} t={t} live={1} sw={0.01} head={0} n={3} dotR={12} />
        <Flow pts={WIRE} color={C.leak} t={t} live={core} sw={0.01} head={0} n={3} dotR={5.5 + 2 * pulse} />
        {(opt.byp ?? 0) > 0.001 ? <Flow pts={BYP} color={C.leak} p={opt.byp} t={t} live={opt.bypLive ?? 0} sw={4} dash="3 10" head={16} n={4} dotR={6} /> : null}
        <Block x={HEAD.x} y={HEAD.y} w={200} h={120} kind="head" title="task head" hi={opt.hp ?? 0} />
        {(opt.humps ?? 0) > 0.001 ? (
          <g>
            <line x1={WM - 150} y1={400} x2={WM + 150} y2={400} stroke={C.line2} strokeWidth={2} />
            <Humps x={WM - 150} y={400} w={300} h={70} g={[opt.humps ?? 0, opt.humps ?? 0]} col={C.leak} sw={2.5} />
            <Txt x={WM - 150 + 0.3 * 300} y={424} size={22} fill={C.chalk2} o={opt.humps}>{SHORT[0]}</Txt>
            <Txt x={WM - 150 + 0.9 * 300} y={424} size={22} fill={C.chalk2} o={opt.humps}>{SHORT[1]}</Txt>
          </g>
        ) : null}
      </g>
    );
  };
  const pipeNode = (o: number, glow: number, ep = 0, person = 0) => (o <= 0.001 ? null : (
    <g>
      <ConceptNode x={NODE.x} y={NODE.y} w={NODE.w} h={NODE.h} v={MU[0]} vTo={HARD[0]} ep={ep} bar={ep > 0.001 || person > 0.001} glow={glow} />
      <Person x={NODE.x - NODE.w / 2 + 10} y={NODE.y - 120} s={0.9 + 0.04 * wob(t, 0.6)} o={person} />
    </g>
  ));

  const vNow = lerp(MU[0], HARD[0], s6mv);
  return (
    <Stage>
      <Header t={t} part={9} title={P.title} />
      <ArchMap on={['c', 'f']} o={inv(0, 0.5, t)} />

      {/* ============================================================ 9.1 what travels? */}
      <Slide o={sl(1)}>
        <SlideHead text={bh(P, 1)} />
        <Svg>
          <ConceptNode x={N1.x} y={N1.y} w={320} h={120} o={s1n} />
          <Flow pts={W1} color={C.concept} p={s1h} sw={4} head={16} />
          <Block x={H1.x} y={H1.y} w={220} h={120} kind="head" title="task head" o={s1h} />
          {s1tok >= 0 ? (
            <g opacity={Math.sin(Math.PI * s1tok) * s1h}>
              <rect x={lerp(W1[0][0] + 30, W1[1][0] - 30, s1tok) - 30} y={N1.y - 30} width={60} height={60} rx={10} fill={rgba(C.concept, 0.25)} stroke={C.concept} strokeWidth={2.5} />
              <Txt x={lerp(W1[0][0] + 30, W1[1][0] - 30, s1tok)} y={N1.y + 1} size={34} mono weight={700} fill={C.chalk} o={s1q}>?</Txt>
            </g>
          ) : null}
        </Svg>
        <Rich x={960} y={720} ax="center" size={34} text="one {c:number} per concept, on its way to the {f:task head}" o={s1line} />
      </Slide>

      {/* ============================================================ 9.2 definition */}
      <Slide o={sl(2)}>
        <SlideHead text={bh(P, 2)} />
        <Svg>
          <ConceptNode x={N2.x} y={N2.y} w={320} h={120} o={s2n} />
          <g opacity={s2q < 0.999 ? s2q : undefined}>
            <rect x={N2.x - 150} y={N2.y - 170} width={300} height={62} rx={14} fill={C.bg3} stroke={C.concept} strokeWidth={2.5} />
            <path d={`M ${N2.x - 14} ${N2.y - 109} L ${N2.x} ${N2.y - 90} L ${N2.x + 14} ${N2.y - 109} Z`} fill={C.bg3} stroke={C.concept} strokeWidth={2.5} strokeLinejoin="round" />
            <rect x={N2.x - 15} y={N2.y - 113} width={30} height={5} fill={C.bg3} />
            <Txt x={N2.x} y={N2.y - 139} size={30} weight={600} fill={C.chalk}>is it present?</Txt>
          </g>
          <Flow pts={W2} color={C.concept} p={s2n} sw={4} head={16} />
          {s2bit >= 0 ? (
            <g opacity={Math.sin(Math.PI * s2bit)}>
              <rect x={lerp(W2[0][0] + 30, W2[1][0] - 30, s2bit) - 22} y={W2[0][1] - 22} width={44} height={44} rx={8} fill={C.concept} />
              <Txt x={lerp(W2[0][0] + 30, W2[1][0] - 30, s2bit)} y={W2[0][1] + 1} size={28} mono weight={700} fill="#0B0F14">1</Txt>
            </g>
          ) : null}
          <rect x={H2.x - 124} y={H2.y - 74} width={248} height={148} rx={24} fill={rgba(C.leak, 0.2 * s2uses)} />
          <Block x={H2.x} y={H2.y} w={220} h={120} kind="head" title="task head" o={s2n} />
          <Flow pts={T2} color={C.leak} p={s2thr} sw={4} head={14} t={t} live={s2uses} n={3} dotR={5.5} />
        </Svg>
        <Rich x={(T2[0][0] + T2[1][0]) / 2} y={N2.y + 64} ax="center" size={32} weight={600} text="{k:anything more}" o={s2more} />
        <Rich x={(T2[0][0] + T2[1][0]) / 2} y={N2.y + 112} ax="center" size={30} text="{k:= leakage}, if the {f:head} uses it" o={s2uses} />
        <Rich x={H2.x} y={H2.y - 96} ax="center" ay="bottom" size={24} color={C.mute} text="expects one bit: 0 or 1" o={s2q} />
      </Slide>

      {/* ============================================================ 9.3 two zebras */}
      <Slide o={sl(3)}>
        <SlideHead text={bh(P, 3)} />
        <PhotoR R={RP} src="zebra_plains.jpg" o={s3ph[0]} />
        <PhotoR R={RG} src="zebra_grevy.jpg" o={s3ph[1]} />
        <Credit x={RP.x} y={RP.y + RP.h + 8} text={CREDIT['zebra_plains.jpg']} o={s3ph[0]} />
        <Credit x={RG.x + RG.w} y={RG.y + RG.h + 8} ax="right" text={CREDIT['zebra_grevy.jpg']} o={s3ph[1]} />
        <Svg>
          <BText x={RP.x + 16} y={RP.y + 30} text={CLS[0]} size={28} o={s3ph[0]} />
          <BText x={RG.x + 16} y={RG.y + 30} text={CLS[1]} size={28} o={s3ph[1]} />
          {[RP, RG].map((R, i) => (
            <Pill key={i} x={R.x + R.w / 2} y={Math.max(RP.y + RP.h, RG.y + RG.h) + 76} anchorX="middle" text={`stripes = ${HARD[i]}`} color={C.concept} size={30} o={s3lab[i]} />
          ))}
        </Svg>
        <Rich x={960} y={Math.max(RP.y + RP.h, RG.y + RG.h) + 76} ax="center" ay="middle" size={30} color={C.chalk2} text="same {c:binary label}" o={s3bin} />
        <EvTag x={1760} y={890} ax="right" kind="constructed" text="hand-built example" o={s3tag} />
      </Slide>

      {/* ============================================================ 9.4 soft scores and the head's cut */}
      <Slide o={sl(4)}>
        <SlideHead text={bh(P, 4)} />
        {[0, 1].map((i) => (
          <PhotoR key={i} R={fit(i ? 'zebra_grevy.jpg' : 'zebra_plains.jpg', SX4(MU[i]) - PH4 / 2, 300, PH4)} src={i ? 'zebra_grevy.jpg' : 'zebra_plains.jpg'} o={s4ph[i]} />
        ))}
        <Svg>
          <Axis x={A4.x} y={A4.y} w={A4.w} lo={0.6} hi={1} ticks={[0.6, 0.7, 0.8, 0.9, 1.0]} p={s4ax} />
          <Humps x={A4.x} y={A4.y} w={A4.w} h={A4.h} g={s4g} />
          {[0, 1].map((i) => (
            <g key={i} opacity={s4mu[i]}>
              <line x1={SX4(MU[i])} y1={A4.y - A4.h + 40} x2={SX4(MU[i])} y2={A4.y} stroke={C.concept} strokeWidth={2} strokeDasharray="4 6" opacity={0.7} />
              <Txt x={SX4(MU[i])} y={A4.y - A4.h - 34} size={32} mono weight={700} fill={C.concept}>{`≈ ${MU[i].toFixed(2)}`}</Txt>
            </g>
          ))}
          <line x1={SX4(THR)} y1={A4.y + 4} x2={SX4(THR)} y2={A4.y + 4 - (A4.h + 70) * s4cut} stroke={HEADC} strokeWidth={4} strokeDasharray="10 8" opacity={s4cut > 0.001 ? 1 : 0} />
          <Pill x={SX4(THR)} y={A4.y - A4.h - 92} anchorX="middle" text={`head's cut ${THR.toFixed(2)}`} color={HEADC} size={26} o={s4cutL} />
          {/* accuracy readouts */}
          {[
            { lab: 'head reads the score', v: L.soft_accuracy, o: s4aS },
            { lab: 'head reads the bit', v: L.hard_accuracy, o: s4aH },
          ].map((r, i) => {
            const y = 500 + i * 150;
            return (
              <g key={i} opacity={r.o < 0.999 ? r.o : undefined}>
                <Txt x={1300} y={y - 36} size={26} anchor="start" fill={C.chalk2}>{r.lab}</Txt>
                <rect x={1300} y={y - 14} width={330} height={30} rx={6} fill={C.bg3} />
                <rect x={1300} y={y - 14} width={330 * r.v * r.o} height={30} rx={6} fill={C.chalk} />
                <Txt x={1650} y={y + 1} size={34} anchor="start" mono weight={700}>{r.v.toFixed(2)}</Txt>
              </g>
            );
          })}
          <Txt x={1300} y={420} size={22} anchor="start" mono fill={C.mute} o={s4aS}>ACCURACY</Txt>
          <Txt x={1300} y={698} size={24} anchor="start" fill={C.mute} o={s4ch}>chance</Txt>
        </Svg>
        <Rich x={A4.x + A4.w / 2} y={846} ax="center" size={28} color={C.chalk2} text={s4mean > 0.5 ? 'both mean {c:stripes present}' : 'soft {c:score} for stripes present'}
          o={s4mean > 0.001 ? (s4mean > 0.5 ? s4mean : 1 - s4mean) * s4lab : s4lab} />
        <EvTag x={1760} y={890} ax="right" kind="constructed" text="hand-built score distributions" o={s4ax} />
      </Slide>

      {/* ============================================================ 9.5 stripe density */}
      <Slide o={sl(5)}>
        <SlideHead text={bh(P, 5)} />
        <PhotoR R={TH1} src="zebra_plains.jpg" o={s5p} />
        <PhotoR R={TH2} src="zebra_grevy.jpg" o={s5p} />
        <Svg>
          {pipe(s5p, { core: s5glow, humps: s5hump })}
          {pipeNode(s5p, s5glow)}
        </Svg>
        <Rich x={WM} y={PY - 50} ax="center" ay="bottom" size={30} weight={700} text="{k:stripe density}" o={s5dens} />
        <Rich x={WM} y={PY + 40} ax="center" size={28} text="{k:unnamed, uninspectable}" o={s5uni} />
        <Rich x={960} y={800} ax="center" size={34} weight={650} text="that hidden part is the {k:leakage}" o={s5leak} />
      </Slide>

      {/* ============================================================ 9.6 a correct edit, the wrong species */}
      <Slide o={sl(6)}>
        <SlideHead text={bh(P, 6)} />
        <PhotoR R={R6} src="zebra_plains.jpg" o={s6ph} border={C.input} />
        <Svg>
          <BText x={R6.x + 12} y={R6.y + 26} text={CLS[0]} size={24} o={s6ph} />
          <Person x={R6.x + R6.w + 90} y={R6.y + R6.h / 2 - 4} s={1 + 0.04 * wob(t, 0.6)} o={s6person} />
          <Tick x={R6.x + R6.w + 196} y={R6.y + R6.h / 2 + 70} s={0.9} o={s6tick} />
          {/* the head's view of the stripes value */}
          <rect x={MX(THR)} y={MY - 56} width={(MX1 - MX(THR)) * s6cut} height={56} fill={rgba(C.chalk, 0.06)} />
          <Axis x={MX0} y={MY} w={MX1 - MX0} lo={0.6} hi={1} ticks={[0.6, 0.7, 0.8, 0.9, 1.0]} p={s6ax} />
          <line x1={MX(THR)} y1={MY + 8} x2={MX(THR)} y2={MY + 8 - 86 * s6cut} stroke={HEADC} strokeWidth={4} strokeDasharray="9 7" opacity={s6cut > 0.001 ? 1 : 0} />
          <Txt x={MX(THR)} y={MY - 100} size={24} mono fill={HEADC} o={s6cut}>{THR.toFixed(2)}</Txt>
          <Txt x={(MX0 + MX(THR)) / 2} y={MY + 78} size={26} weight={600} fill={C.chalk2} o={s6reg}>{`→ ${CLS[0]}`}</Txt>
          <Txt x={(MX(THR) + MX1) / 2} y={MY + 78} size={26} weight={600} fill={C.chalk} o={s6reg}>{`→ ${CLS[1]}`}</Txt>
          {s6mv > 0.001 ? <circle cx={MX(MU[0])} cy={MY} r={13} fill="none" stroke={C.concept} strokeWidth={2.5} strokeDasharray="4 4" opacity={s6ax} /> : null}
          <circle cx={MX(vNow)} cy={MY} r={15} fill={s6mv > 0.5 ? C.edit : C.concept} stroke="#0B0F14" strokeWidth={3} opacity={s6ax} />
          <BText x={MX(vNow)} y={MY - 36} anchor="middle" text={vNow.toFixed(2)} size={28} mono weight={700} color={s6mv > 0.5 ? C.edit : C.concept} o={s6ax} />
          {/* the output */}
          <g opacity={s6out < 0.999 ? s6out : undefined}>
            <Flow pts={[[MX1 + 40, MY], [1344, MY]]} color={C.chalk} sw={3.5} head={14} t={t} live={1} n={1} dotR={5} />
            <rect x={1360} y={MY - 40} width={300} height={80} rx={12} fill={rgba(C.bad, 0.1)} stroke={C.bad} strokeWidth={2.5} />
            <Txt x={1510} y={MY + 1} size={32} weight={700}>{CLS[1]}</Txt>
            <Cross x={1676} y={MY - 16} w={32} h={32} p={s6x} sw={6} />
            <Txt x={1510} y={MY + 78} size={26} weight={600} fill={C.bad}>wrong species</Txt>
          </g>
        </Svg>
        <Tex x={R6.x + R6.w + 170} y={R6.y + R6.h / 2 - 4} ay="middle" size={56}
          tex={`\\ch_{\\text{stripes}}:\\ \\ccon{${MU[0].toFixed(2)}} \\;\\to\\; ${s6ep > 0.5 ? `\\cedit{${HARD[0].toFixed(2)}}` : '\\phantom{1.00}'}`} o={s6eq} />
        <Rich x={R6.x + R6.w + 226} y={R6.y + R6.h / 2 + 70} ay="middle" size={28} color={C.good} text="its true value" o={s6tick} />
        <Rich x={MX0} y={MY - 130} size={24} color={C.mute} text="what the {f:head} reads" o={s6ax} />
        <Credit x={R6.x} y={R6.y + R6.h + 8} text={CREDIT['zebra_plains.jpg']} o={s6ph} />
      </Slide>

      {/* ============================================================ 9.7 implicit, explicit, and the caveat */}
      <Slide o={sl(7)}>
        <SlideHead text={bh(P, 7)} />
        <PhotoR R={TH1} src="zebra_plains.jpg" o={s7p} />
        <PhotoR R={TH2} src="zebra_grevy.jpg" o={s7p} />
        <Svg>
          {pipe(s7p, { core: 1, pulse: s7pulse, humps: 1, byp: s7byp, bypLive: s7lat, ep: s7ep, hp: s7hp })}
          {pipeNode(s7p, 1 + 0.5 * s7pulse, s7ep, s7person)}
        </Svg>
        <Rich x={WM} y={PY + 40} ax="center" size={30} weight={600} text="{k:implicit}: inside the score" o={s7imp} />
        <Rich x={(ENC.x + HEAD.x) / 2} y={760} ax="center" size={30} weight={600} text="{k:explicit}: latent features on a side path" o={s7exp} />
        <Rich x={160} y={846} size={28} color={C.chalk2} text="ordinary variation in confidence: not leakage" o={s7c1} />
        <Rich x={160} y={890} size={28} text="{k:leakage}: systematic, and the {f:head} uses it" o={s7c2} />
        <EvTag x={1760} y={890} ax="right" kind="constructed" text="hand-built example" o={s7p} />
      </Slide>
    </Stage>
  );
};
