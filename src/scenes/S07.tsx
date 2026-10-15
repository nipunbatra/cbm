// s07 Part 7 · A correct edit can still hurt (revision 2: one idea per slide, 11 slides, one per beat; slides replace each other)
// 7.1 why: every edit so far helped (D.bird, D.zoo, D.sleep shares) ... does it always?   7.2 the support message (D.faulty.message)
// 7.3 the concept values as a named vector (D.faulty.before.c)   7.4 the head in words   7.5 the same head in symbols, aligned under
// the words, and the sigmoid   7.6 the score before the edit, term by term (D.faulty.before), billing 0.80, routed to billing
// 7.7 the reviewer's correct edit, duplicate charge -> 1 (amber)  7.8 the score after, term by term (D.faulty.after), billing 0.45,
// general support   7.9 the wrong sign   7.10 the lesson   7.11 the caveat: a constructed head (existence, not frequency)
import React from 'react';
import { C, F } from '../kit/theme';
import { E, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, bs, bw, bh, inv, type SceneProps } from '../kit/core';
import { ArchMap, Block, Cross, EvTag, Flow, MathSvg, Person, rgba } from '../kit/cbm';
import { D } from '../kit/data';
import { lerp } from '../kit/anim';

const FT = D.faulty;
const CON: string[] = FT.concepts; // duplicate charge, refund requested
const CLS: string[] = FT.classes; // General support, Billing queue
const W: number[] = FT.weights;
const MSG: string = FT.message;
const HEADC = '#9AA6B5';

/** number for display: at most 2 decimals, no trailing zeros, no negative zero */
const num = (v: number) => {
  const r = Math.round(v * 100) / 100;
  return String(Object.is(r, -0) ? 0 : r);
};
const abs = (v: number) => num(Math.abs(v));
const op = (v: number) => (v < 0 ? '-' : '+');

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

/** the support message card (HTML); rev 0..1 types it, under 0..1 underlines "charged twice" */
const Message: React.FC<{ x: number; y: number; w: number; size: number; o: number; rev?: number; under?: number; underCol?: string }> = ({
  x, y, w, size, o, rev = 1, under = 0, underCol = C.concept,
}) => {
  if (o <= 0.001) return null;
  const key = 'charged twice';
  const i = MSG.indexOf(key);
  const parts = [MSG.slice(0, i), MSG.slice(i, i + key.length), MSG.slice(i + key.length)];
  const nShow = Math.floor(rev * MSG.length);
  let k = 0;
  const span = (s: string, j: number, u: boolean) => {
    const start = k;
    k += s.length;
    const vis = s.slice(0, Math.max(0, Math.min(s.length, nShow - start)));
    return (
      <span key={j} style={u ? {
        backgroundImage: `linear-gradient(${underCol}, ${underCol})`, backgroundSize: `${under * 100}% 4px`, backgroundPosition: 'left 100%',
        backgroundRepeat: 'no-repeat', paddingBottom: 2,
      } : undefined}>
        {vis}<span style={{ opacity: 0 }}>{s.slice(vis.length)}</span>
      </span>
    );
  };
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, boxSizing: 'border-box', opacity: o < 0.999 ? o : undefined,
      background: C.bg2, border: `2px solid ${C.line2}`, borderRadius: 14, padding: '18px 26px',
    }}>
      <div style={{ fontFamily: F.mono, fontSize: 20, fontWeight: 600, color: C.mute, letterSpacing: 1 }}>SUPPORT MESSAGE</div>
      <div style={{ fontFamily: F.sans, fontSize: size, fontWeight: 500, color: C.chalk, lineHeight: 1.36, marginTop: 10 }}>
        {parts.map((s, j) => span(s, j, j === 1))}
      </div>
    </div>
  );
};

/** a destination queue box, (x, y) = top-left */
const Queue: React.FC<{ x: number; y: number; label: string; o: number; lit: number }> = ({ x, y, label, o, lit }) =>
  o <= 0.001 ? null : (
    <g opacity={o < 0.999 ? o : undefined}>
      <rect x={x} y={y} width={300} height={84} rx={12} fill={rgba(C.chalk, 0.04 + 0.08 * lit)} stroke={lit > 0.5 ? C.chalk : C.line2} strokeWidth={lit > 0.5 ? 3 : 2} />
      <Txt x={x + 150} y={y + 42} size={24} mono weight={700} fill={lit > 0.5 ? C.chalk : C.chalk2} track={1}>{label}</Txt>
    </g>
  );

/** the routed message: a small envelope token */
const Token: React.FC<{ x: number; y: number; o: number; s?: number }> = ({ x, y, o, s = 1 }) =>
  o <= 0.001 ? null : (
    <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o < 0.999 ? o : undefined}>
      <rect x={-34} y={-23} width={68} height={46} rx={6} fill={C.bg3} stroke={C.chalk} strokeWidth={2.5} />
      <path d="M -34 -21 L 0 4 L 34 -21" fill="none" stroke={C.chalk} strokeWidth={2.5} strokeLinejoin="round" />
    </g>
  );

/** the billing share as one bar with its value; (x, y) = left end, vertical centre */
const BillBar: React.FC<{ x: number; y: number; v: number; o: number }> = ({ x, y, v, o }) =>
  o <= 0.001 ? null : (
    <g opacity={o < 0.999 ? o : undefined}>
      <rect x={x} y={y - 18} width={360} height={36} rx={5} fill={C.bg3} />
      <rect x={x} y={y - 18} width={360 * v} height={36} rx={5} fill={C.chalk} opacity={0.92} />
      <line x1={x + 180} x2={x + 180} y1={y - 28} y2={y + 28} stroke={C.mute} strokeWidth={2} strokeDasharray="4 5" />
      <Txt x={x + 380} y={y} size={34} anchor="start" mono weight={700}>{v.toFixed(2)}</Txt>
    </g>
  );

// ------------------------------------------------------------------ geometry
const CARDX = [330, 750, 1170, 1590]; // 7.1
// 7.5, 7.6, 7.8, 7.9: one column per term so words, symbols and the numbers line up
const COL = { s: 340, eq: 430, b: 540, d: 830, r: 1250, z: 1580 };
const EQY = 520;
const QX = 1380, QY = [640, 760]; // queues: billing, general support
const BARX = 300, BARY = 760;

export const S07: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.5) => inv(x, x + d, t);
  const NB = P.beats.length;
  const sl = (k: number) => inv(b(k) - 0.05, b(k) + 0.25, t) * (k < NB ? 1 - inv(b(k + 1) - 0.35, b(k + 1) - 0.05, t) : 1);

  // ---------------- 7.1
  const c1 = [0, 1, 2].map((i) => at(w(1, 'far') + i * 0.35, 0.4));
  const c1t = [0, 1, 2].map((i) => inv(w(1, 'helped') + i * 0.2, w(1, 'helped') + i * 0.2 + 0.4, t));
  const c1q = at(w(1, 'Does') - 0.1), c1x = inv(w(1, 'not') - 0.1, w(1, 'not') + 0.4, t);

  // ---------------- 7.2
  const m2 = at(w(2, 'support') - 0.1);
  const rev2 = inv(w(2, 'The') - 0.05, w(2, 'payment') + 0.4, t);
  const und2 = E.io(inv(w(2, 'charged'), w(2, 'twice') + 0.35, t));
  const q2 = E.io(inv(w(2, 'belongs') - 0.1, w(2, 'billing') + 0.3, t));

  // ---------------- 7.3
  const m3 = at(b(3) - 0.05, 0.3), g3 = at(w(3, 'concept') - 0.1);
  const r3 = [at(w(3, 'duplicate') - 0.1), at(w(3, 'refund') - 0.1)];

  // ---------------- 7.4
  const h4 = at(w(4, 'task') - 0.1);
  const l4 = [at(w(4, 'starts') - 0.1), at(w(4, 'takes') - 0.1), at(w(4, 'adds') - 0.1)];

  // ---------------- 7.5
  const s5 = [at(w(5, 'score') - 0.1), at(w(5, '12') - 0.1), at(w(5, 'minus') - 0.1), at(w(5, 'plus') - 0.1)];
  const sg5 = at(w(5, 'sigmoid') - 0.1);

  // ---------------- 7.6
  const e6 = [at(b(6) - 0.05, 0.3), at(w(6, '12') - 0.1), at(w(6, 'minus') - 0.1), at(w(6, 'plus') - 0.1), at(w(6, 'gives') + 0.1)];
  const bar6 = at(w(6, 'Billing') - 0.1, 0.6);
  const tok6 = E.io(inv(w(6, 'routed') - 0.3, w(6, 'correctly') + 0.2, t));
  const tick6 = inv(w(6, 'correctly'), w(6, 'correctly') + 0.5, t);

  // ---------------- 7.7
  const m7 = at(b(7) - 0.05, 0.3), p7 = at(w(7, 'reviewer') - 0.1, 0.4);
  const e7 = E.io(inv(w(7, 'duplicate') - 0.1, w(7, '1') + 0.35, t));
  const ok7 = inv(w(7, 'correctly') - 0.1, w(7, 'correctly') + 0.4, t);

  // ---------------- 7.8
  const e8 = [at(b(8) - 0.05, 0.3), at(w(8, '12') - 0.1), at(w(8, 'minus') - 0.1), at(w(8, 'plus') - 0.1), at(w(8, 'gives') + 0.1)];
  const k8 = E.io(inv(w(8, 'falls') - 0.1, w(8, '045') + 0.4, t));
  const tok8 = E.io(inv(w(8, 'goes') - 0.1, w(8, 'support') + 0.1, t));
  const x8 = inv(w(8, 'support'), w(8, 'support') + 0.5, t);

  // ---------------- 7.9
  const f9 = at(b(9) - 0.05, 0.3), ok9 = at(w(9, 'correct') - 0.1), bad9 = E.back(inv(w(9, 'negative') - 0.1, w(9, 'negative') + 0.4, t));
  const sign9 = at(w(9, 'wrong') - 0.1);

  // ---------------- 7.10
  const d10 = [at(w(10, 'Correcting') - 0.1), at(w(10, 'decision') - 0.1), at(w(10, 'head') - 0.1)];
  const m10 = at(w(10, 'measured') - 0.1);

  // ---------------- 7.11
  const a11 = at(w(11, 'faulty') - 0.1), b11 = at(w(11, 'nothing') - 0.1);

  // term labels shared by 7.5 / 7.6 / 7.8
  const terms = (vals: [string, string, string, string, string], o: number[], dupEdit = false) => (
    <>
      <Tex x={COL.s} y={EQY} ax="center" size={60} tex={vals[0]} o={o[0]} />
      <Tex x={COL.eq} y={EQY} ax="center" size={60} tex="=" o={o[1]} />
      <Tex x={COL.b} y={EQY} ax="center" size={60} tex={vals[1]} o={o[1]} />
      <Tex x={COL.d} y={EQY} ax="center" size={60} tex={dupEdit ? `\\cedit{${vals[2]}}` : vals[2]} o={o[2]} />
      <Tex x={COL.r} y={EQY} ax="center" size={60} tex={vals[3]} o={o[3]} />
      <Tex x={COL.z} y={EQY} ax="center" size={60} tex={vals[4]} o={o[4]} />
    </>
  );
  const sh6 = FT.before.share[1], sh8 = lerp(FT.before.share[1], FT.after.share[1], k8);
  const qc = (i: number): [number, number] => [QX + 150, QY[i] + 42];

  return (
    <Stage bg="#0B1218">
      <Header t={t} part={7} title={P.title} />
      <ArchMap on={['f']} o={inv(0, 0.5, t)} />

      {/* ============================================================ 7.1 why */}
      <Slide o={sl(1)}>
        <SlideHead text={bh(P, 1)} />
        <Svg>
          {[0, 1, 2, 3].map((i) => {
            const o = i < 3 ? c1[i] : c1q;
            if (o <= 0.001) return null;
            const x = CARDX[i];
            return (
              <g key={i} opacity={o < 0.999 ? o : undefined}>
                <rect x={x - 180} y={420} width={360} height={200} rx={16} fill={C.bg2} stroke={i < 3 ? C.line2 : C.chalk2} strokeWidth={2} strokeDasharray={i < 3 ? undefined : '9 8'} />
                {i < 3 ? <Tick x={x} y={680} p={c1t[i]} s={1.3} /> : <Txt x={x} y={555} size={80} weight={700} fill={C.chalk2}>?</Txt>}
              </g>
            );
          })}
          <Cross x={CARDX[3] - 22} y={660} w={44} h={44} p={c1x} />
        </Svg>
        {[
          { h: 'gull, Part 2', l: `{y:herring gull} ${B2(D.bird.before.share[1])} {e:→} ${B2(D.bird.after.share[1])}` },
          { h: 'zebra, Part 4', l: `{y:zebra} ${B2(D.zoo.softmax[0])} {e:→} ${B2(D.zoo.softmax_new[0])}` },
          { h: 'EEG, Part 6', l: `{y:N2 candidate} ${B2(D.sleep.before.share[1])} {e:→} ${B2(D.sleep.after.share[1])}` },
        ].map((c, i) => (
          <React.Fragment key={c.h}>
            <Rich x={CARDX[i]} y={455} ax="center" size={26} color={C.chalk2} text={c.h} o={c1[i]} />
            <Rich x={CARDX[i]} y={530} ax="center" size={28} text={c.l} o={c1[i]} />
          </React.Fragment>
        ))}
        <Rich x={CARDX[3]} y={455} ax="center" size={26} color={C.chalk2} text="a correct edit" o={c1q} />
        <Rich x={960} y={780} ax="center" size={32} text="so far, every {e:correction} helped" o={c1t[2]} />
      </Slide>

      {/* ============================================================ 7.2 the message */}
      <Slide o={sl(2)}>
        <SlideHead text={bh(P, 2)} />
        <Message x={220} y={380} w={800} size={38} o={m2} rev={rev2} under={und2} />
        <Svg>
          <Flow pts={[[1040, 500], [QX - 20, 500]]} color={C.chalk2} sw={4} head={14} p={q2} />
          <Queue x={QX} y={458} label="BILLING QUEUE" o={q2} lit={q2 > 0.9 ? 1 : 0} />
        </Svg>
        <Rich x={QX + 150} y={570} ax="center" size={26} color={C.chalk2} text="where it belongs" o={q2} />
        <EvTag x={1760} y={880} ax="right" kind="constructed" text="an invented message" o={m2} />
      </Slide>

      {/* ============================================================ 7.3 concept values */}
      <Slide o={sl(3)}>
        <SlideHead text={bh(P, 3)} />
        <Message x={160} y={390} w={520} size={28} o={m3} />
        <Svg>
          <Flow pts={[[700, 510], [770, 510]]} color={C.input} sw={4} head={14} o={g3} t={t} live={g3} n={1} dotR={5} />
          <Block x={880} y={510} w={200} h={120} kind="input" title="concept" sub="predictor" size={28} o={g3} />
          <Flow pts={[[990, 510], [1090, 510]]} color={C.concept} sw={4} head={14} o={r3[0]} t={t + 0.3} live={g3} n={1} dotR={5} />
          <Brackets x0={1360} x1={1500} y={430} h={160} color={C.concept} o={r3[0]} />
          <MathSvg x={1430} y={395} tex="\cvec" size={38} o={r3[0]} />
          {CON.map((c, i) => (
            <g key={c} opacity={r3[i] < 0.999 ? r3[i] : undefined}>
              <Txt x={1340} y={470 + i * 80} size={30} anchor="end" fill={C.concept}>{c}</Txt>
              <Txt x={1430} y={470 + i * 80} size={36} mono weight={600}>{FT.before.c[i].toFixed(2)}</Txt>
            </g>
          ))}
        </Svg>
        <EvTag x={1760} y={880} ax="right" kind="illustrative" text="hand-written concept values" o={g3} />
      </Slide>

      {/* ============================================================ 7.4 the head in words */}
      <Slide o={sl(4)}>
        <SlideHead text={bh(P, 4)} />
        <Svg>
          <Block x={380} y={560} w={240} h={150} kind="head" title="task head" sub="billing score" size={32} subSize={24} o={h4} />
          {[0, 1, 2].map((i) => <Flow key={i} pts={[[510, 560], [560, 440 + i * 120], [610, 440 + i * 120]]} color={HEADC} sw={3} head={0} o={l4[i]} />)}
        </Svg>
        <Rich x={640} y={440} ay="middle" size={38} text={`start at {f:${num(FT.bias)}}`} o={l4[0]} />
        <Rich x={640} y={560} ay="middle" size={38} text={`take away {f:${abs(W[0])}} for each unit of {c:${CON[0]}}`} o={l4[1]} />
        <Rich x={640} y={680} ay="middle" size={38} text={`add {f:${abs(W[1])}} for each unit of {c:${CON[1]}}`} o={l4[2]} />
        <EvTag x={1760} y={880} ax="right" kind="constructed" text="a hand-written head" o={h4} />
      </Slide>

      {/* ============================================================ 7.5 the head in symbols */}
      <Slide o={sl(5)}>
        <SlideHead text={bh(P, 5)} />
        <Rich x={COL.s} y={410} ax="center" size={26} color={C.chalk2} text="score" o={s5[0]} />
        <Rich x={COL.b} y={410} ax="center" size={26} color={C.chalk2} text="start" o={s5[1]} />
        <Rich x={COL.d} y={410} ax="center" size={26} text={`{c:${CON[0]}}`} o={s5[2]} />
        <Rich x={COL.r} y={410} ax="center" size={26} text={`{c:${CON[1]}}`} o={s5[3]} />
        {terms(['s', `\\chead{${num(FT.bias)}}`, `${op(W[0])}\\,\\chead{${abs(W[0])}}\\,\\ch_{\\text{dup}}`, `${op(W[1])}\\,\\chead{${abs(W[1])}}\\,\\ch_{\\text{refund}}`, ''], [s5[0], s5[1], s5[2], s5[3], 0])}
        <Svg>
          <g opacity={sg5 < 0.999 ? sg5 : undefined}>
            <line x1={1220} x2={1640} y1={790} y2={790} stroke={C.line2} strokeWidth={2} />
            <line x1={1430} x2={1430} y1={650} y2={800} stroke={C.line2} strokeWidth={2} />
            <polyline fill="none" stroke={C.chalk} strokeWidth={4}
              points={Array.from({ length: 41 }, (_, i) => { const s = -5 + i * 0.25; return `${1430 + s * 40},${790 - 130 / (1 + Math.exp(-s))}`; }).join(' ')} />
            <Txt x={1650} y={790} size={24} anchor="start" fill={C.chalk2}>s</Txt>
          </g>
        </Svg>
        <Rich x={300} y={700} ay="middle" size={34} text="a sigmoid turns the score $s$ into the {y:billing share}" o={sg5} />
        <Rich x={1440} y={630} ax="center" ay="bottom" size={28} text="$\sigma(s)$" o={sg5} />
      </Slide>

      {/* ============================================================ 7.6 before the edit */}
      <Slide o={sl(6)}>
        <SlideHead text={bh(P, 6)} />
        {terms(['s', `\\chead{${num(FT.bias)}}`, `${op(FT.before.terms[0])}\\,${abs(FT.before.terms[0])}`, `${op(FT.before.terms[1])}\\,${abs(FT.before.terms[1])}`,
          `=\\,${num(FT.before.z)}`], e6)}
        <Rich x={COL.d} y={590} ax="center" size={26} color={C.mute} text={`$${num(W[0])} \\times \\ccon{${FT.before.c[0].toFixed(2)}}$`} o={e6[2]} />
        <Rich x={COL.r} y={590} ax="center" size={26} color={C.mute} text={`$${num(W[1])} \\times \\ccon{${FT.before.c[1].toFixed(2)}}$`} o={e6[3]} />
        <Svg>
          <BillBar x={BARX} y={BARY} v={sh6} o={bar6} />
          <Queue x={QX} y={QY[0]} label="BILLING QUEUE" o={bar6} lit={tick6 > 0.3 ? 1 : 0} />
          <Queue x={QX} y={QY[1]} label="GENERAL SUPPORT" o={bar6 * 0.6} lit={0} />
          <Token x={lerp(1160, qc(0)[0] - 210, tok6)} y={lerp(BARY, qc(0)[1], tok6)} o={at(w(6, 'routed') - 0.3, 0.3)} s={0.85} />
          <Tick x={QX + 340} y={qc(0)[1]} p={tick6} />
        </Svg>
        <Tex x={BARX} y={BARY - 50} size={32} color={C.chalk2} tex={`\\text{billing share} = \\sigma(${num(FT.before.z)})`} o={bar6} />
        <EvTag x={160} y={880} kind="constructed" text="hand-written head" o={e6[0]} />
      </Slide>

      {/* ============================================================ 7.7 the edit */}
      <Slide o={sl(7)}>
        <SlideHead text={bh(P, 7)} />
        <Message x={160} y={390} w={560} size={30} o={m7} under={1} underCol={e7 > 0.3 ? C.edit : C.concept} />
        <Svg>
          <Person x={850} y={500} s={1.0 * E.back(p7)} o={p7} />
          <Brackets x0={1300} x1={1440} y={430} h={160} color={C.concept} o={m7} />
          <MathSvg x={1370} y={395} tex="\cvec" size={38} o={m7} />
          {CON.map((c, i) => {
            const v = i === 0 ? lerp(FT.before.c[0], FT.after.c[0], e7) : FT.before.c[i];
            const ed = i === 0 && e7 > 0.001;
            return (
              <g key={c} opacity={m7 < 0.999 ? m7 : undefined}>
                {ed ? <rect x={1308} y={470 + i * 80 - 32} width={124} height={64} rx={10} fill={rgba(C.edit, 0.14)} stroke={C.edit} strokeWidth={2.5} /> : null}
                <Txt x={1280} y={470 + i * 80} size={30} anchor="end" fill={C.concept}>{c}</Txt>
                <Txt x={1370} y={470 + i * 80} size={36} mono weight={ed ? 700 : 600} fill={ed ? C.edit : C.chalk}>{v.toFixed(2)}</Txt>
              </g>
            );
          })}
          <Flow pts={[[900, 470], [1010, 470]]} color={C.edit} sw={4} head={14} p={e7} dash="3 10" />
          <Tick x={1490} y={470} p={ok7} />
        </Svg>
        <Rich x={1300} y={640} size={28} color={C.chalk2} text="matches the message: {e:charged twice}" o={ok7} />
      </Slide>

      {/* ============================================================ 7.8 after the edit */}
      <Slide o={sl(8)}>
        <SlideHead text={bh(P, 8)} />
        {terms(['s', `\\chead{${num(FT.bias)}}`, `${op(FT.after.terms[0])}\\,${abs(FT.after.terms[0])}`, `${op(FT.after.terms[1])}\\,${abs(FT.after.terms[1])}`,
          `=\\,${num(FT.after.z)}`], e8, true)}
        <Rich x={COL.d} y={590} ax="center" size={26} color={C.mute} text={`$${num(W[0])} \\times \\cedit{${FT.after.c[0].toFixed(2)}}$`} o={e8[2]} />
        <Rich x={COL.r} y={590} ax="center" size={26} color={C.mute} text={`$${num(W[1])} \\times \\ccon{${FT.after.c[1].toFixed(2)}}$`} o={e8[3]} />
        <Svg>
          <BillBar x={BARX} y={BARY} v={sh8} o={e8[0]} />
          <Queue x={QX} y={QY[0]} label="BILLING QUEUE" o={e8[0]} lit={tok8 < 0.5 ? 1 : 0} />
          <Queue x={QX} y={QY[1]} label="GENERAL SUPPORT" o={e8[0] * (0.6 + 0.4 * tok8)} lit={tok8 > 0.5 ? 1 : 0} />
          <Token x={qc(0)[0] - 210} y={lerp(qc(0)[1], qc(1)[1], tok8)} o={e8[0]} s={0.85} />
          <Cross x={QX + 324} y={qc(1)[1] - 18} w={36} h={36} p={x8} />
        </Svg>
        <Tex x={BARX} y={BARY - 50} size={32} color={C.chalk2} tex={`\\text{billing share} = \\sigma(${num(k8 > 0.5 ? FT.after.z : FT.before.z)})`} o={e8[0]} />
        <EvTag x={160} y={880} kind="constructed" text="hand-written head" o={e8[0]} />
      </Slide>

      {/* ============================================================ 7.9 the wrong sign */}
      <Slide o={sl(9)}>
        <SlideHead text={bh(P, 9)} />
        {terms(['s', `\\chead{${num(FT.bias)}}`, `${op(W[0])}\\,\\chead{${abs(W[0])}}\\,\\ch_{\\text{dup}}`, `${op(W[1])}\\,\\chead{${abs(W[1])}}\\,\\ch_{\\text{refund}}`, ''], [f9, f9, f9 * (1 - bad9), f9, 0])}
        <Tex x={COL.d} y={EQY} ax="center" size={60} tex={`\\cbad{${op(W[0])}\\,${abs(W[0])}}\\,\\ch_{\\text{dup}}`} o={bad9 > 0.001 ? Math.min(1, bad9) : 0} />
        <Svg>
          <ellipse cx={COL.d - 62} cy={EQY} rx={64 * Math.max(0.01, bad9)} ry={54 * Math.max(0.01, bad9)} fill="none" stroke={C.bad} strokeWidth={4} opacity={Math.min(1, bad9)} />
          <Tick x={500} y={720} p={ok9} s={1.3} />
          <Cross x={1170} y={700} w={40} h={40} p={sign9} />
        </Svg>
        <Rich x={540} y={720} ay="middle" size={32} text="the {e:edit}: correct" o={ok9} />
        <Rich x={1230} y={720} ay="middle" size={32} text="the {f:weight}: wrong sign" o={sign9} />
        <Rich x={COL.d} y={610} ax="center" size={26} color={C.chalk2} text="pushes {y:billing} down as duplicate charge rises" o={sign9} />
        <EvTag x={1760} y={880} ax="right" kind="constructed" text="deliberately faulty head" o={f9} />
      </Slide>

      {/* ============================================================ 7.10 the lesson */}
      <Slide o={sl(10)}>
        <SlideHead text={bh(P, 10)} />
        <Svg>
          <g opacity={d10[0] < 0.999 ? d10[0] : undefined}>
            <rect x={300} y={430} width={340} height={140} rx={16} fill={rgba(C.edit, 0.1)} stroke={C.edit} strokeWidth={3} />
            <Txt x={470} y={480} size={30} weight={600} fill={C.edit}>corrected concept</Txt>
            <Tick x={470} y={530} p={1} />
          </g>
          <Flow pts={[[650, 500], [790, 500]]} color={C.edit} sw={4} head={14} o={d10[1]} />
          <g opacity={d10[1] < 0.999 ? d10[1] : undefined}>
            <Block x={970} y={500} w={340} h={140} kind="head" />
            <Txt x={970} y={470} size={30} weight={600} fill={C.chalk}>decision rule</Txt>
            <Cross x={952} y={512} w={36} h={36} p={1} />
          </g>
          <Flow pts={[[1150, 500], [1290, 500]]} color={C.chalk2} sw={4} head={14} o={d10[2]} />
          <g opacity={d10[2] < 0.999 ? d10[2] : undefined}>
            <rect x={1300} y={430} width={320} height={140} rx={16} fill={C.bg2} stroke={C.chalk2} strokeWidth={2.5} />
            <Txt x={1460} y={480} size={30} weight={600} fill={C.chalk}>outcome</Txt>
            <Txt x={1460} y={530} size={26} fill={C.chalk2}>only as good as the head</Txt>
          </g>
        </Svg>
        <Rich x={960} y={700} ax="center" size={34} text="measure the effect of an {e:intervention}; do not assume it" o={m10} />
      </Slide>

      {/* ============================================================ 7.11 the caveat */}
      <Slide o={sl(11)}>
        <SlideHead text={bh(P, 11)} />
        <Svg>
          <g opacity={a11 < 0.999 ? a11 : undefined}>
            <rect x={560} y={400} width={800} height={150} rx={16} fill="none" stroke={C.line2} strokeWidth={2.5} strokeDasharray="10 8" />
          </g>
        </Svg>
        <Tex x={960} y={475} ax="center" size={52} tex={`s = \\chead{${num(FT.bias)}}\\ \\cbad{${op(W[0])}\\,${abs(W[0])}}\\,\\ch_{\\text{dup}} ${op(W[1])}\\,\\chead{${abs(W[1])}}\\,\\ch_{\\text{refund}}`} o={a11} />
        <Rich x={960} y={620} ax="center" size={34} text="built faulty on purpose: the failure {y:can} happen" o={a11} />
        <Rich x={960} y={690} ax="center" size={30} color={C.chalk2} text="it says nothing about how often it does" o={b11} />
        <EvTag x={620} y={790} kind="constructed" text="deliberately faulty head: existence, not frequency" o={a11} />
      </Slide>
    </Stage>
  );
};

/** two decimals for a share */
function B2(v: number) {
  return v.toFixed(2);
}
