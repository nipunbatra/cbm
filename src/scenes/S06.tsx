// s06 Part 6 · Human interventions (revision 2: one idea per slide, 11 slides, one per beat; slides replace each other)
// 6.1 why: a person can see what the model got wrong (gull photo, wingtip black 0.20, D.bird.before.c)
// 6.2 the four-step loop on its own, words with the symbols underneath
// 6.3 the canonical gull pipeline (kit pipe): the wing colour group edit, grey -> 0, black -> 1 (amber)
// 6.4 the impossible states: both on, neither (crossed out) next to the valid edit
// 6.5 c hat before / after as named vectors, the same head, shares 0.29 -> 0.91 (D.bird)
// 6.6 the schematic EEG (D.eeg) and its spindle-like burst     6.7 the predicted concepts (D.sleep.before.c)
// 6.8 the illustrative stage head and its shares (D.sleep.before.share)
// 6.9 the expert marks the spindle: 0.12 -> 1 (amber)          6.10 same head, N2 candidate 0.38 -> 0.86
// 6.11 the caveat: a 30 s scoring epoch against our 6 s schematic window; the head was written by hand
import React from 'react';
import { C } from '../kit/theme';
import { E, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, bs, bw, bh, inv, type SceneProps } from '../kit/core';
import { ArchMap, Block, CREDIT, ConceptRow, Credit, Cross, EditMark, EvTag, Flow, MathSvg, Person, PhotoR, Region, ShareBars, Wave, rgba, type Rect } from '../kit/cbm';
import { GullPipePhoto, GullPipeSvg, PIPE, rowY, type PipeState } from '../kit/pipe';
import { D } from '../kit/data';

const B = D.bird;
const BL: string[] = B.labels;
const S = D.sleep;
const EEG = D.eeg;
const SLC: string[] = S.concepts;
const SCL: string[] = S.classes;
const EPOCH = 30; // seconds per sleep-scoring epoch (structural)
const HEADC = '#9AA6B5';

// ------------------------------------------------------------------ helpers
const Slide: React.FC<{ o: number; children?: React.ReactNode }> = ({ o, children }) =>
  o <= 0.001 ? null : <div style={{ position: 'absolute', inset: 0, opacity: o < 0.999 ? o : undefined }}>{children}</div>;

/** square brackets around a column at x0..x1 */
const Brackets: React.FC<{ x0: number; x1: number; y: number; h: number; color: string; o?: number }> = ({ x0, x1, y, h, color, o = 1 }) =>
  o <= 0.001 ? null : (
    <g opacity={o < 0.999 ? o : undefined} fill="none" stroke={color} strokeWidth={3.5}>
      <path d={`M ${x0 + 14} ${y} L ${x0} ${y} L ${x0} ${y + h} L ${x0 + 14} ${y + h}`} />
      <path d={`M ${x1 - 14} ${y} L ${x1} ${y} L ${x1} ${y + h} L ${x1 - 14} ${y + h}`} />
    </g>
  );

/** a tick mark drawn on with p */
const Tick: React.FC<{ x: number; y: number; p: number; s?: number }> = ({ x, y, p, s = 1 }) =>
  p <= 0.001 ? null : (
    <path d={`M ${x - 14 * s} ${y} L ${x - 4 * s} ${y + 11 * s} L ${x + 16 * s} ${y - 13 * s}`} fill="none" stroke={C.good} strokeWidth={5} strokeLinecap="round"
      strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 1`} />
  );

/**
 * the edit as two named column vectors (before teal, after with the edited entries amber), the same head, and the
 * class shares moving from `sh0` to `sh1` with k. Used for the gull (6.5) and the EEG (6.10) so both read the same way.
 */
const EditPair: React.FC<{
  t: number; labels: string[]; c0: number[]; c1: number[]; edited: number[]; classes: string[]; sh0: number[]; sh1: number[];
  vecO: number; editP: number; headO: number; headHi: number; k: number; shO: number; headTitle: string;
}> = ({ t, labels, c0, c1, edited, classes, sh0, sh1, vecO, editP, headO, headHi, k, shO, headTitle }) => {
  const n = labels.length, rh = 64, y0 = 560 - (n * rh) / 2;
  const X0 = [420, 540], X1 = [690, 810];
  const yc = 560;
  return (
    <g>
      <g opacity={vecO < 0.999 ? vecO : undefined}>
        {labels.map((l, i) => (
          <Txt key={l} x={400} y={y0 + (i + 0.5) * rh} size={26} anchor="end" fill={C.concept}>{l}</Txt>
        ))}
        <Brackets x0={X0[0]} x1={X0[1]} y={y0} h={n * rh} color={C.concept} />
        {c0.map((v, i) => <Txt key={i} x={(X0[0] + X0[1]) / 2} y={y0 + (i + 0.5) * rh} size={30} mono weight={600}>{v.toFixed(2)}</Txt>)}
        <MathSvg x={(X0[0] + X0[1]) / 2} y={y0 - 40} tex="\cvec" size={36} />
        <Txt x={(X0[0] + X0[1]) / 2} y={y0 + n * rh + 34} size={22} fill={C.chalk2}>before</Txt>
      </g>
      <Person x={615} y={yc - 60} s={0.75 * E.back(Math.min(1, editP * 3))} o={Math.min(1, editP * 3)} />
      <Flow pts={[[X0[1] + 14, yc], [X1[0] - 14, yc]]} color={C.edit} sw={4} head={12} p={Math.min(1, editP * 2)} />
      <g opacity={editP > 0.001 ? Math.min(1, editP * 2) : 0}>
        <Brackets x0={X1[0]} x1={X1[1]} y={y0} h={n * rh} color={C.concept} />
        {c0.map((v, i) => {
          const ed = edited.includes(i);
          const val = ed ? v + (c1[i] - v) * E.io(editP) : v;
          return (
            <g key={i}>
              {ed ? <rect x={X1[0] + 8} y={y0 + i * rh + 7} width={X1[1] - X1[0] - 16} height={rh - 14} rx={8} fill={rgba(C.edit, 0.14)} stroke={C.edit} strokeWidth={2.5} /> : null}
              <Txt x={(X1[0] + X1[1]) / 2} y={y0 + (i + 0.5) * rh} size={30} mono weight={ed ? 700 : 600} fill={ed ? C.edit : C.chalk}>{val.toFixed(2)}</Txt>
            </g>
          );
        })}
        <Txt x={(X1[0] + X1[1]) / 2} y={y0 + n * rh + 34} size={22} fill={C.edit}>after the edit</Txt>
      </g>
      <Flow pts={[[X1[1] + 14, yc], [930, yc]]} color={C.edit} sw={4} head={12} o={headO} t={t} live={headO * (1 - k)} n={2} dotR={5} />
      <Block x={1020} y={yc} w={170} h={120} kind="head" title="same" sub={headTitle} size={28} o={headO} hi={headHi} />
      <Flow pts={[[1110, yc], [1162, yc]]} color={C.chalk2} sw={4} head={12} o={shO} />
      <ShareBars x={1180} y={yc - 40} labels={classes} from={sh0} to={sh1} k={k} w={180} labelW={285} rowH={80} size={26} o={shO} />
    </g>
  );
};

/** a wing colour mini card: two concept rows (grey, black) with a title; crossed out or ticked */
const StateCard: React.FC<{ x: number; title: string; vals: [number, number]; o: number; cross?: number; tick?: number; edit?: boolean }> = ({ x, title, vals, o, cross = 0, tick = 0, edit }) => {
  if (o <= 0.001) return null;
  const w = 380, h = 170, y = 430;
  return (
    <g opacity={o < 0.999 ? o : undefined}>
      <rect x={x - w / 2} y={y} width={w} height={h} rx={14} fill={C.bg2} stroke={edit ? C.edit : C.line2} strokeWidth={2.5} strokeDasharray={edit ? undefined : '8 7'} />
      <Txt x={x} y={y - 30} size={28} weight={600} fill={edit ? C.edit : C.chalk2}>{title}</Txt>
      {['wingtip grey', 'wingtip black'].map((l, i) => (
        <ConceptRow key={l} x={x - w / 2 + 26} y={y + 55 + i * 60} label={l} v={vals[i]} w={110} labelW={170} size={24} barH={22}
          color={edit ? C.edit : C.concept} />
      ))}
      <Cross x={x - w / 2 + 14} y={y + 14} w={w - 28} h={h - 28} p={cross} />
      <Tick x={x} y={y + h + 50} p={tick} s={1.3} />
    </g>
  );
};

// ------------------------------------------------------------------ geometry
const PH1: Rect = { x: 220, y: 330, w: 420, h: 420 };
const STX = [340, 747, 1153, 1560], STW = 360, STY = 380, STH = 170; // 6.2 cards
const WV = { x: 200, y: 400, w: 1520, h: 230 }; // 6.6 large trace
const WS = { x: 360, y: 350, w: 1200, h: 90 }; // 6.7 / 6.9 context strip
const tX = (R: { x: number; w: number }, s: number) => R.x + (s / EEG.seconds) * R.w;

export const S06: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.5) => inv(x, x + d, t);
  const NB = P.beats.length;
  const sl = (k: number) => inv(b(k) - 0.05, b(k) + 0.25, t) * (k < NB ? 1 - inv(b(k + 1) - 0.35, b(k + 1) - 0.05, t) : 1);

  // ---------------- 6.1
  const s1ph = at(b(1) - 0.05, 0.3), s1reg = E.io(inv(w(1, 'check') - 0.1, w(1, 'check') + 0.7, t));
  const s1row = at(w(1, 'wrong') - 0.3), s1p = at(w(1, 'someone') - 0.1, 0.4), s1e = at(w(1, 'correct') - 0.1, 0.4);
  const s1nr = at(w(1, 'retraining') - 0.2);

  // ---------------- 6.2
  const st = [w(2, 'model'), w(2, 'person'), w(2, 'fixed'), w(2, 'new')].map((x) => at(x - 0.15, 0.45));

  // ---------------- 6.3 (kit pipe)
  const p3 = at(b(3) - 0.05, 0.3);
  const editP = E.io(inv(w(3, 'grey') - 0.1, w(3, '1') + 0.4, t));
  const ps: PipeState = {
    t, o: 1, live: 1, edit: editP, outK: 0,
    bracket: at(w(3, 'group'), 0.5),
    wingRegion: E.io(inv(w(3, 'Wing'), w(3, 'Wing') + 0.9, t)),
    rowHi: (i) => (i < 2 ? at(w(3, 'Wing'), 0.5) : 0),
    dimRows: (i) => (i < 2 ? 0 : 0.6 * at(w(3, 'Wing'), 0.5)),
  };
  const p3per = at(w(3, 'observer') - 0.1, 0.4);
  const p3lab = at(w(3, 'categorical') - 0.1);

  // ---------------- 6.4
  const s4v = at(b(4) - 0.05, 0.3), s4tick = inv(b(4) + 0.3, b(4) + 0.8, t);
  const s4b = at(w(4, 'both') - 0.1, 0.4), s4bx = inv(w(4, 'colours'), w(4, 'colours') + 0.5, t);
  const s4n = at(w(4, 'neither') - 0.1, 0.4), s4nx = inv(w(4, 'neither') + 0.3, w(4, 'neither') + 0.8, t);

  // ---------------- 6.5
  const s5h = Math.sin(Math.PI * inv(w(5, 'head'), w(5, 'head') + 1.1, t));
  const s5k = inv(w(5, 'moves'), w(5, '091') + 0.3, t);

  // ---------------- 6.6
  const s6tag = at(w(6, 'schematic') - 0.1), s6wave = E.io(inv(w(6, 'schematic'), w(6, 'patient') + 0.3, t));
  const s6sp = at(w(6, 'short') - 0.1), s6lab = at(w(6, 'about') - 0.1), s6hi = at(w(6, 'spindle') - 0.1);

  // ---------------- 6.7
  const s7ctx = at(b(7) - 0.05, 0.3), s7g = at(w(7, 'concept') - 0.1);
  const s7r = [w(7, 'spindle'), w(7, 'K'), w(7, 'slow')].map((x) => at(x - 0.1, 0.4));
  const s7f = [w(7, '012'), w(7, '08'), w(7, '015')].map((x) => E.out(inv(x - 0.15, x + 0.6, t)));
  const s7k = at(w(7, 'K') - 0.1);

  // ---------------- 6.8
  const s8c = at(b(8) - 0.05, 0.3), s8f = at(w(8, 'stage') - 0.1), s8o = at(w(8, 'other') - 0.1, 0.8), s8n = at(w(8, 'N2') - 0.1, 0.6);

  // ---------------- 6.9
  const s9ctx = at(b(9) - 0.05, 0.3), s9p = at(w(9, 'expert') - 0.1, 0.4);
  const s9m = E.io(inv(w(9, 'marks') - 0.1, w(9, 'present') + 0.3, t));
  const s9e = E.io(inv(w(9, '012') - 0.1, w(9, '1') + 0.45, t));

  // ---------------- 6.10
  const s10h = Math.sin(Math.PI * inv(w(10, 'Same'), w(10, 'input') + 0.6, t));
  const s10k = inv(w(10, 'rises'), w(10, '086') + 0.3, t);

  // ---------------- 6.11
  const s11a = at(w(11, 'Real') - 0.1, 0.6), s11b = at(w(11, 'thirty') - 0.1, 0.6), s11c = at(w(11, 'head') - 0.1);

  const sleepRows = (x: number, y0: number, dy: number, o: number[], p: number[], editI?: number, ep = 0, size = 28) =>
    SLC.map((l, i) => (
      <ConceptRow key={l} x={x} y={y0 + i * dy} label={l} v={S.before.c[i]} w={240} labelW={300} size={size} barH={28} o={o[i]} p={p[i]}
        edit={editI === i && ep > 0.001 ? { to: S.after.c[i], p: ep } : undefined} hi={editI === i ? ep : 0} />
    ));

  return (
    <Stage>
      <Header t={t} part={6} title={P.title} />
      <ArchMap on={['c', 'f']} o={inv(0, 0.5, t)} />

      {/* ============================================================ 6.1 why */}
      <Slide o={sl(1)}>
        <SlideHead text={bh(P, 1)} />
        <PhotoR R={PH1} src="gull.jpg" o={s1ph} />
        <Credit x={PH1.x} y={PH1.y + PH1.h + 8} text={CREDIT['gull.jpg']} o={s1ph} />
        <Svg>
          <Region R={PH1} b={D.gull.regions.wingtip} color={C.concept} draw={s1reg} sw={4} />
          <Flow pts={[[PH1.x + PH1.w * 0.93, PH1.y + PH1.h * 0.55], [840, 540]]} color={C.concept} sw={3} head={12} p={s1row} dash="3 10" />
          <ConceptRow x={880} y={540} label="wingtip black" v={B.before.c[1]} w={260} labelW={230} size={32} barH={32} o={s1row} hi={s1row} />
          <Person x={1560} y={460} s={1.1 * E.back(s1p)} o={s1p} />
          <EditMark x={1560} y={560} s={1.2 * s1e} o={s1e} />
        </Svg>
        <Rich x={880} y={640} w={860} size={32} lh={1.35} text="the {x:photo} and the {f:head} stay the same; only a {e:value} changes" o={s1nr} />
        <EvTag x={1760} y={880} ax="right" kind="illustrative" text="hand-written concept value (Part 2)" o={s1row} />
      </Slide>

      {/* ============================================================ 6.2 four steps */}
      <Slide o={sl(2)}>
        <SlideHead text={bh(P, 2)} />
        <Svg>
          {STX.map((x, i) => {
            const o = st[i];
            if (o <= 0.001) return null;
            const col = [C.concept, C.edit, HEADC, C.chalk][i];
            return (
              <g key={i} opacity={o < 0.999 ? o : undefined}>
                {i > 0 ? <Flow pts={[[x - STW / 2 - 40, STY + STH / 2], [x - STW / 2 - 8, STY + STH / 2]]} color={C.line2} sw={3} head={12} /> : null}
                <rect x={x - STW / 2 + 12} y={STY} width={STW - 24} height={STH} rx={16} fill={rgba(col, 0.08)} stroke={col} strokeWidth={2.5} />
                <circle cx={x} cy={STY} r={22} fill={col} />
                <Txt x={x} y={STY + 1} size={24} mono weight={700} fill="#0B0F14">{String(i + 1)}</Txt>
              </g>
            );
          })}
        </Svg>
        {['{c:predict} concept values', 'a {e:person checks} one and corrects it', 'the fixed {f:head} recomputes', 'a new {y:prediction}'].map((s, i) => (
          <Rich key={i} x={STX[i]} y={STY + STH / 2 + 6} ax="center" ay="middle" w={STW - 70} size={30} lh={1.25} text={s} o={st[i]} />
        ))}
        {['\\cvec = \\gth(\\cin{x})', '\\ch_j \\leftarrow \\cedit{c_j}', '\\fph \\text{ unchanged}', '\\yh_{\\text{new}} = \\fph(\\cvec_{\\cedit{\\text{edited}}})'].map((s, i) => (
          <Tex key={i} x={STX[i]} y={STY + STH + 90} ax="center" size={i === 3 ? 38 : 44} tex={s} o={st[i]} />
        ))}
      </Slide>

      {/* ============================================================ 6.3 the gull group edit */}
      <Slide o={sl(3)}>
        <SlideHead text={bh(P, 3)} />
        <GullPipePhoto s={{ ...ps, o: p3 }} />
        <Svg>
          <GullPipeSvg s={{ ...ps, o: p3 }} />
          <Person x={PIPE.rowX - 80} y={rowY(0) + 26} s={0.8 * E.back(p3per)} o={p3per} />
        </Svg>
        <Credit x={PIPE.photo.x} y={PIPE.photo.y + PIPE.photo.h + 10} text={CREDIT['gull.jpg']} o={p3} />
        <Rich x={PIPE.col.x + PIPE.col.w / 2} y={720} ax="center" size={32} text="wing colour is one {c:categorical} concept: {e:grey → 0, black → 1}, together" o={p3lab} />
        <EvTag x={1760} y={880} ax="right" kind="illustrative" text="hand-written concept values and head" o={p3} />
      </Slide>

      {/* ============================================================ 6.4 impossible states */}
      <Slide o={sl(4)}>
        <SlideHead text={bh(P, 4)} />
        <Svg>
          <StateCard x={480} title="the group edit" vals={[B.after.c[0], B.after.c[1]]} o={s4v} tick={s4tick} edit />
          <StateCard x={960} title="both on" vals={[1, 1]} o={s4b} cross={s4bx} />
          <StateCard x={1440} title="neither" vals={[0, 0]} o={s4n} cross={s4nx} />
        </Svg>
        <Rich x={960} y={760} ax="center" size={30} color={C.chalk2} text="a wingtip has one colour, so the group changes as one" o={s4nx} />
      </Slide>

      {/* ============================================================ 6.5 before / after, the gull */}
      <Slide o={sl(5)}>
        <SlideHead text={bh(P, 5)} />
        <Svg>
          <EditPair t={t} labels={BL} c0={B.before.c} c1={B.after.c} edited={[0, 1]} classes={B.classes} sh0={B.before.share} sh1={B.after.share}
            vecO={1} editP={1} headO={1} headHi={s5h} k={s5k} shO={1} headTitle="task head" />
        </Svg>
        <EvTag x={1760} y={880} ax="right" kind="illustrative" text="hand-written concept values and head" o={1} />
      </Slide>

      {/* ============================================================ 6.6 the EEG */}
      <Slide o={sl(6)}>
        <SlideHead text={bh(P, 6)} />
        <Svg>
          <Wave x={WV.x} y={WV.y} w={WV.w} h={WV.h} ys={EEG.y} fs={EEG.fs} t1={EEG.seconds} color={C.input} p={s6wave} amp={62} sw={2.8}
            marks={[[EEG.spindle.t0, EEG.spindle.t1, C.concept, undefined, s6sp]]} hiWindow={[EEG.spindle.t0, EEG.spindle.t1, C.concept, s6hi]} axisO={s6wave > 0 ? 1 : 0} />
        </Svg>
        <Rich x={tX(WV, (EEG.spindle.t0 + EEG.spindle.t1) / 2)} y={WV.y - 30} ax="center" ay="bottom" size={30}
          text={`{c:spindle-like burst}, about ${EEG.spindle.hz.toFixed(0)} Hz`} o={s6lab} />
        <EvTag x={1760} y={880} ax="right" kind="schematic" text="authored trace, not a recording" o={s6tag} />
      </Slide>

      {/* ============================================================ 6.7 predicted concepts */}
      <Slide o={sl(7)}>
        <SlideHead text={bh(P, 7)} />
        <Svg>
          <Wave x={WS.x} y={WS.y} w={WS.w} h={WS.h} ys={EEG.y} fs={EEG.fs} t1={EEG.seconds} color={C.input} amp={24} sw={2} axis={false}
            marks={[[EEG.spindle.t0, EEG.spindle.t1, C.concept, undefined, 1], [EEG.kcomplex.t0, EEG.kcomplex.t1, C.concept, undefined, 0.5 * s7k]]} o={s7ctx} />
          <Flow pts={[[460, WS.y + WS.h + 20], [460, 560]]} color={C.input} sw={4} head={14} o={s7g} t={t} live={s7g} n={1} dotR={5} />
          <Block x={460} y={630} w={200} h={120} kind="input" title="concept" sub="predictor" size={28} o={s7g} />
          {SLC.map((_, i) => (
            <Flow key={i} pts={[[566, 630], [610, 630], [690, 540 + i * 90]]} color={C.concept} sw={2.5} head={0} p={s7r[i]} t={t + i * 0.3} live={s7g} n={1} dotR={5} />
          ))}
          {sleepRows(720, 540, 90, s7r, s7f)}
        </Svg>
        <Rich x={tX(WS, (EEG.kcomplex.t0 + EEG.kcomplex.t1) / 2)} y={WS.y - 12} ax="center" ay="bottom" size={24} color={C.chalk2} text="K-complex" o={s7k} />
        <Rich x={tX(WS, (EEG.spindle.t0 + EEG.spindle.t1) / 2)} y={WS.y - 12} ax="center" ay="bottom" size={24} text="{c:spindle-like burst}" o={s7ctx} />
        <EvTag x={1760} y={880} ax="right" kind="illustrative" text="hand-written concept values; schematic trace" o={s7g} />
      </Slide>

      {/* ============================================================ 6.8 the stage head */}
      <Slide o={sl(8)}>
        <SlideHead text={bh(P, 8)} />
        <Svg>
          {sleepRows(200, 470, 90, [s8c, s8c, s8c], [1, 1, 1], undefined, 0, 26)}
          {SLC.map((_, i) => (
            <Flow key={i} pts={[[900, 470 + i * 90], [1010, 560], [1046, 560]]} color={C.concept} sw={2.5} head={i === 1 ? 12 : 0} p={s8f} t={t + i * 0.3} live={s8f} n={1} dotR={5} />
          ))}
          <Block x={1130} y={560} w={160} h={120} kind="head" title="stage" sub="head" size={28} o={s8f} />
          <Flow pts={[[1214, 560], [1270, 560]]} color={C.chalk2} sw={4} head={12} o={s8o} />
          <ShareBars x={1290} y={520} labels={SCL} from={S.before.share} w={190} labelW={200} rowH={80} size={26} o={s8o} p={Math.min(s8o, 0.3 + 0.7 * s8n)} />
        </Svg>
        <EvTag x={1760} y={880} ax="right" kind="illustrative" text="hand-written stage head" o={s8f} />
      </Slide>

      {/* ============================================================ 6.9 the expert's edit */}
      <Slide o={sl(9)}>
        <SlideHead text={bh(P, 9)} />
        <Svg>
          <Wave x={WS.x} y={WS.y} w={WS.w} h={WS.h} ys={EEG.y} fs={EEG.fs} t1={EEG.seconds} color={C.input} amp={24} sw={2} axis={false}
            marks={[[EEG.spindle.t0, EEG.spindle.t1, s9m > 0.5 ? C.edit : C.concept, undefined, 1]]} o={s9ctx} />
          <Person x={tX(WS, EEG.spindle.t1) + 60} y={WS.y + 30} s={0.85 * E.back(s9p)} o={s9p} />
          <Flow pts={[[tX(WS, (EEG.spindle.t0 + EEG.spindle.t1) / 2), WS.y + WS.h + 14], [tX(WS, (EEG.spindle.t0 + EEG.spindle.t1) / 2), 476], [1030, 516]]}
            color={C.edit} sw={3} head={12} dash="3 10" p={s9m} />
          {sleepRows(600, 540, 90, [s9ctx, s9ctx, s9ctx], [1, 1, 1], 0, s9e)}
        </Svg>
        <Rich x={tX(WS, (EEG.spindle.t0 + EEG.spindle.t1) / 2)} y={WS.y - 12} ax="center" ay="bottom" size={24} text="{e:spindle: marked present}" o={s9m} />
        <EvTag x={1760} y={880} ax="right" kind="illustrative" text="hand-written concept values; schematic trace" o={s9ctx} />
      </Slide>

      {/* ============================================================ 6.10 same head, new input */}
      <Slide o={sl(10)}>
        <SlideHead text={bh(P, 10)} />
        <Svg>
          <EditPair t={t} labels={SLC} c0={S.before.c} c1={S.after.c} edited={[0]} classes={SCL} sh0={S.before.share} sh1={S.after.share}
            vecO={1} editP={1} headO={1} headHi={s10h} k={s10k} shO={1} headTitle="stage head" />
        </Svg>
        <EvTag x={1760} y={880} ax="right" kind="illustrative" text="hand-written stage head" o={1} />
      </Slide>

      {/* ============================================================ 6.11 caveat */}
      <Slide o={sl(11)}>
        <SlideHead text={bh(P, 11)} />
        <Svg>
          <g opacity={s11b < 0.999 ? s11b : undefined}>
            <rect x={260} y={470} width={1400} height={70} rx={10} fill={C.bg3} stroke={C.line2} strokeWidth={2} />
            <rect x={260 + 1400 * 0.45} y={470} width={(1400 * EEG.seconds) / EPOCH} height={70} rx={8} fill={rgba(C.input, 0.18)} stroke={C.input} strokeWidth={2.5} />
            <Wave x={260 + 1400 * 0.45} y={475} w={(1400 * EEG.seconds) / EPOCH} h={60} ys={EEG.y} fs={EEG.fs} t1={EEG.seconds} color={C.input} amp={14} sw={1.6} axis={false} />
            <Txt x={260} y={575} size={24} anchor="start" mono fill={C.mute}>0 s</Txt>
            <Txt x={1660} y={575} size={24} anchor="end" mono fill={C.mute}>{`${EPOCH} s`}</Txt>
            <Txt x={260 + 1400 * 0.45 + (700 * EEG.seconds) / EPOCH} y={575} size={24} fill={C.input}>{`our ${EEG.seconds.toFixed(0)} s trace`}</Txt>
          </g>
        </Svg>
        <Rich x={960} y={400} ax="center" size={32} text={`real staging: scoring rules applied to ${EPOCH} s epochs`} o={s11a} />
        <Rich x={960} y={680} ax="center" size={32} text="this {f:stage head} was written by hand" o={s11c} />
        <EvTag x={160} y={880} kind="schematic" text="authored EEG trace" o={s11a} />
        <EvTag x={1760} y={880} ax="right" kind="illustrative" text="hand-written stage head" o={s11c} />
      </Slide>
    </Stage>
  );
};
