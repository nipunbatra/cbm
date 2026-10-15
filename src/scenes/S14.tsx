// s14 Final replay (revision 2: one slide per beat, 7 beats). The canonical gull pipeline (src/kit/pipe.tsx) carries
// beats 1 to 5, shifted down below the slide heading: 14.1 photo -> one opaque black box -> species; 14.2 the box opens,
// each stage labelled as it is named; 14.3 the amber wing colour edit, the head recomputes, the prediction changes;
// 14.4 three weak parts, one per phrase (a missing concept, a detector looking at the water, a wrong head weight);
// 14.5 the clean live pipeline and three words. 14.6 the closing sentence, then one plain line under it. 14.7 what to remember (4 intuitive items).
import React from 'react';
import { C } from '../kit/theme';
import { E, HText, Header, Rich, SlideHead, Stage, Svg, Txt, bs, be, bw, bh, clamp, inv, type SceneProps } from '../kit/core';
import { CREDIT, Credit, EvTag, Flow, Person, Pill, Region, rgba, ux, vy } from '../kit/cbm';
import { GullPipePhoto, GullPipeSvg, PIPE, type PipeState } from '../kit/pipe';
import { BText, Brace } from '../kit/slots';
import { rnd } from '../kit/anim';
import { D } from '../kit/data';

const pulse = (t: number, a: number, d = 1.0) => (t < a || t > a + d ? 0 : Math.sin(((t - a) / d) * Math.PI));
const FAULT: number = D.faulty.weights[0];
const fmtSigned = (v: number) => (v < 0 ? `−${Math.abs(v)}` : `${v}`);
const DY = 70; // the pipeline sits this far below its canonical place, clear of the slide heading
const WATER = [0.72, 0.17, 0.4, 0.2]; // a patch of water behind the gull (normalized, drawn by hand)
const REMEMBER: { text: string; word: string }[] = [
  { text: 'Post-hoc methods explain afterwards; a {c:concept bottleneck} makes the {y:answer} pass through named {c:concepts}', word: 'Posthoc' },
  { text: 'Fixing a {e:concept} helps only if the {f:head} reads it the right way', word: 'Fixing' },
  { text: 'A soft {c:score} can carry more than its name says: extra information {k:leaks}', word: 'soft' },
  { text: 'Newer variants need fewer labels, so check each {c:concept} looks at the right {x:evidence}', word: 'newer' },
];

/** the opaque box that hides the pipeline; it opens by splitting into two halves */
const Lid: React.FC<{ t: number; open: number; o: number }> = ({ t, open, o }) => {
  if (o <= 0.001 || open >= 0.999) return null;
  const x0 = 466, x1 = 1498, y0 = 276, y1 = 638, ym = (y0 + y1) / 2;
  const k = E.io(open), d = 150 * k, a = (1 - k) * o;
  const half = (top: boolean) => {
    const yA = top ? y0 - d : ym + d, h = ym - y0;
    const dots = [];
    for (let i = 0; i < 26; i++) for (let j = 0; j < 4; j++) {
      const n = i * 4 + j + (top ? 0 : 500);
      const al = 0.05 + 0.14 * Math.abs(Math.sin(t * (0.3 + rnd(n) * 0.5) + rnd(n + 77) * 6));
      dots.push(<circle key={n} cx={x0 + ((i + 0.5) / 26) * (x1 - x0)} cy={yA + ((j + 0.5) / 4) * h} r={3} fill={C.input} opacity={al} />);
    }
    return (
      <g>
        <rect x={x0} y={yA} width={x1 - x0} height={h} fill="#05070A" />
        {dots}
      </g>
    );
  };
  return (
    <g opacity={a < 0.999 ? a : undefined}>
      {half(true)}
      {half(false)}
      {open < 0.02 ? <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={18} fill="none" stroke={C.input} strokeWidth={3} /> : null}
      {open < 0.02 ? <Txt x={(x0 + x1) / 2} y={ym} size={34} weight={600} fill={C.mute}>black box</Txt> : null}
    </g>
  );
};

export const S14: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const e = (k: number) => be(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.5) => inv(x, x + d, t);
  const NB = P.beats.length;
  /** slide k: fades in on the beat's first words, fades out (0.3 s) just before the next beat */
  const sl = (k: number) => inv(b(k) - 0.05, b(k) + 0.25, t) * (k < NB ? 1 - inv(b(k + 1) - 0.35, b(k + 1) - 0.05, t) : 1);
  /** the heading of beat k: same timing as its slide */
  const ho = sl;

  // the pipeline lives through beats 1 to 5
  const pipeO = inv(0, 0.5, t) * (1 - inv(b(6) - 0.35, b(6) - 0.05, t));

  // 14.1 / 14.2 open
  const open = inv(w(2, 'Open'), w(2, 'Open') + 1.0, t);
  const ph = PIPE.photo;

  // stage labels (named in 14.2, held through 14.3)
  const lblOut = 1 - inv(b(4) - 0.35, b(4) - 0.05, t);
  const L = (word: string) => inv(w(2, word) - 0.1, w(2, word) + 0.4, t) * lblOut;
  const lIn = L('Input'), lEnc = L('Encoder'), lCp = L('Concept'), lNc = L('Named'), lTh = L('Task'), lPr = L('Prediction');

  // 14.3 edit
  const person = at(w(3, 'person') - 0.2) * (1 - inv(b(4) - 0.35, b(4) - 0.05, t));
  const edit = inv(w(3, 'corrects'), w(3, 'corrects') + 0.9, t);
  const outK = inv(w(3, 'head') - 0.1, e(3) - 0.3, t);
  const headHi = clamp(pulse(t, w(3, 'head') - 0.3, 1.1) + pulse(t, w(2, 'Task'), 1.0) * 0.8);

  // 14.4 three weak parts (held to the end of the beat)
  const gone = 1 - inv(b(5) - 0.35, b(5) - 0.05, t);
  const dMiss = at(w(4, 'concepts') - 0.1) * gone;
  const dPlace = at(w(4, 'look') - 0.2) * gone;
  const dHead = at(w(4, 'head') - 0.1) * gone;

  // 14.5 three words and a wave along the rows
  const w5 = w(5, 'inspected');
  const wave = (i: number) => (t > w5 ? (0.5 + 0.5 * Math.sin((t - w5) * 2.6 - i * 0.7)) * at(w5, 0.6) * (1 - inv(b(6) - 0.5, b(6), t)) : 0);
  const W3 = [
    { word: 'inspected', x: 600, color: C.chalk },
    { word: 'evaluated', x: 960, color: C.chalk },
    { word: 'corrected', x: 1320, color: C.edit },
  ];

  // 14.6 the closing sentence, word by word
  const CLOSE = 'The challenge is to make sure the interface faithfully represents the information on which the prediction depends.';
  const cw = CLOSE.split(' ');
  const c0 = b(6), c1 = w(6, 'Put') - 0.4;
  const plain6 = at(w(6, 'Put') - 0.1);

  const rowHi = (i: number) => Math.max(lNc > 0 && t < w(2, 'Named') + 1.4 ? pulse(t, w(2, 'Named') + i * 0.08, 1.2) : 0, wave(i) * 0.6);

  const s: PipeState = {
    t, photoO: 1, colO: 1, colLabel: 0, live: 1, edit, outK, headHi, rowHi,
    bracket: inv(w(3, 'corrects') - 0.3, w(3, 'corrects'), t), wingRegion: inv(w(3, 'person'), w(3, 'person') + 0.6, t),
    gTitle: 'encoder',
  };

  const lab = (x: number, y: number, text: string, color: string, o: number) => (
    <HText x={x} y={y} ax="center" ay="middle" size={30} weight={600} color={color} o={o}>{text}</HText>
  );
  const FL = PIPE.f.x - PIPE.f.w / 2;

  return (
    <Stage>
      <Header t={t} title={P.title} />
      {[1, 2, 3, 4, 5, 6, 7].map((k) => <SlideHead key={k} text={bh(P, k)} o={ho(k)} />)}

      {/* ============================================================ 14.1 to 14.5 the gull pipeline */}
      {pipeO > 0.001 ? (
        <div style={{ position: 'absolute', inset: 0, transform: `translateY(${DY}px)`, opacity: pipeO < 0.999 ? pipeO : undefined }}>
          <GullPipePhoto s={s} />
          <Svg>
            <GullPipeSvg s={s} />
            <Lid t={t} open={open} o={1} />

            {/* 14.2 the concept predictor brace */}
            <Brace x1={PIPE.g.x - PIPE.g.w / 2} x2={PIPE.rowX - 18} y={PIPE.g.y + PIPE.g.h / 2 + 22} color={C.input} p={E.out(lCp)} o={lCp} />

            {/* 14.3 the person */}
            <Person x={652} y={262} s={0.8} o={person} />

            {/* 14.4 the concepts it names: one may be missing */}
            {dMiss > 0.001 ? (
              <g opacity={dMiss}>
                <rect x={PIPE.rowX - 6} y={652} width={PIPE.labelW + PIPE.barW + 90} height={44} rx={9} fill={rgba(C.concept, 0.04)} stroke={C.bad} strokeWidth={2.5} strokeDasharray="7 7" />
                <Txt x={PIPE.rowX + 12} y={674} size={26} anchor="start" weight={700} fill={C.bad}>?</Txt>
                <Txt x={PIPE.rowX + 44} y={674} size={26} anchor="start" weight={500} fill={C.chalk2}>a concept may be missing</Txt>
              </g>
            ) : null}

            {/* 14.4 where they look: a detector reading the water */}
            {dPlace > 0.001 ? (
              <g opacity={dPlace}>
                <Region R={ph} b={WATER} color={C.bad} draw={E.out(clamp(dPlace * 1.4))} sw={3.5} dash={dPlace > 0.7 ? '8 7' : undefined} />
                <Flow pts={[[ux(ph, WATER[0] + WATER[2] / 2) + 4, vy(ph, WATER[1])], [PIPE.rowX - 60, vy(ph, WATER[1])], [PIPE.rowX - 24, PIPE.rowY0 - 6]]}
                  color={C.bad} dash="4 8" sw={2.5} head={10} p={E.io(dPlace)} />
                <BText x={ux(ph, 0.5)} y={ph.y - 26} text="looks in the wrong place" color={C.bad} size={26} anchor="middle" />
              </g>
            ) : null}

            {/* 14.4 the head that reads them: a wrong weight */}
            {dHead > 0.001 ? (
              <g opacity={dHead}>
                <rect x={FL - 10} y={PIPE.f.y - PIPE.f.h / 2 - 10} width={PIPE.f.w + 20} height={PIPE.f.h + 20} rx={22} fill="none" stroke={C.bad} strokeWidth={3} />
                <Pill x={PIPE.f.x} y={372} text={fmtSigned(FAULT)} color={C.bad} size={30} anchorX="middle" />
                <Txt x={PIPE.f.x} y={318} size={26} weight={600} fill={C.bad}>a wrong rule</Txt>
              </g>
            ) : null}
          </Svg>

          {/* 14.2 stage labels */}
          {lab(ph.x + ph.w / 2, 262, 'Input', C.input, lIn)}
          {lab(PIPE.g.x, 368, 'Encoder', C.input, lEnc)}
          {lab(PIPE.g.x - 20, 604, 'Concept predictor', C.input, lCp)}
          {lab(PIPE.col.x + PIPE.col.w / 2, 262, 'Named concepts', C.concept, lNc)}
          {lab(PIPE.f.x, 368, 'Task head', '#9AA6B5', lTh)}
          {lab(PIPE.outX + 140, 340, 'Prediction', C.chalk, lPr)}

          <Credit x={ph.x} y={ph.y + ph.h + 14} text={CREDIT['gull.jpg']} o={1} />
        </div>
      ) : null}
      <EvTag x={1760} y={880} ax="right" kind="illustrative" text="hand-written concept values and head" o={pipeO * inv(0.2, 0.7, t)} />

      {/* 14.5 three words */}
      {W3.map((q) => (
        <HText key={q.word} x={q.x} y={836} ax="center" ay="middle" size={46} weight={600} color={q.color}
          o={at(w(5, q.word) - 0.1) * sl(5)}>{q.word}</HText>
      ))}

      {/* 14.6 the closing sentence, revealed word by word */}
      <HText x={960} y={580} ax="center" ay="middle" w={1400} size={52} weight={500} lh={1.4} o={sl(6)}>
        {cw.map((word, i) => {
          const a = inv(c0 + (i / cw.length) * (c1 - c0), c0 + (i / cw.length) * (c1 - c0) + 0.6, t);
          return <span key={i} style={{ opacity: a }}>{word}{i < cw.length - 1 ? ' ' : ''}</span>;
        })}
      </HText>

      <Rich x={960} y={760} ax="center" w={1400} size={36} color={C.chalk2} text="put simply: whatever the {y:answer} uses should be visible in the {c:concepts}" o={sl(6) * plain6} />

      {/* 14.7 what to remember */}
      {sl(7) > 0.001 ? (
        <>
          <Svg o={sl(7)}>
            {REMEMBER.map((r, i) => {
              const s7 = E.back(at(w(7, r.word) - 0.15, 0.45));
              return s7 <= 0.001 ? null : (
                <g key={i} transform={`translate(260 ${380 + i * 140}) scale(${s7})`}>
                  <circle r={28} fill={C.bg} stroke={C.chalk2} strokeWidth={3} />
                  <Txt x={0} y={1} size={32} weight={700} fill={C.chalk}>{String(i + 1)}</Txt>
                </g>
              );
            })}
          </Svg>
          {REMEMBER.map((r, i) => (
            <Rich key={i} x={330} y={380 + i * 140} ay="middle" w={1360} size={40} text={r.text} o={sl(7) * at(w(7, r.word) - 0.1)} />
          ))}
        </>
      ) : null}
    </Stage>
  );
};
