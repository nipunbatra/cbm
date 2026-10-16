// s19 Part 10 · Comparing the variants (revision 2). The one dense slide of the part, built gently, one column per beat.
// Columns in the order they appear: variant | data needed | concepts from | what the head reads | trained.
// 19.1 how to read it: the variant names, one row each; the empty column headers previewed (dim).
// 19.2 "data needed" with the x / c / y key (CBM, CEM filled: the supervision ladder starts);
// 19.3 the rest of the "data needed" column (concept labels dropped; CBD: none);
// 19.4 "concepts from"; 19.5 "what the head reads" (the PCBM-h residual in purple); 19.6 "trained" (symbols + words);
// 19.7 the table clears: the grounding warning alone, with breathing space.
// 19.8 intuition: who supplies the concepts, and who checks them (one line per variant family).
// 19.9 intuition: the ladder as a staircase rising rung by rung; human labour and human checking fall together (schematic).
import React from 'react';
import modernSections from '../modernSections.json';
import { C, F } from '../kit/theme';
import { E, HText, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, bs, bw, bh, inv, texHTML, type SceneProps } from '../kit/core';
import { EvTag, MathSvg, Person, rgba } from '../kit/cbm';

type Cell = { tex?: string; text?: string; sub?: string };
type Row = { name: string; cite: string; data: Cell; from: Cell; head: Cell; train: Cell };
const X = '\\cin{x}';
const ROWS: Row[] = [
  { name: 'CBM', cite: 'Koh et al. 2020', data: { tex: `\\{(${X},\\ \\ccon{c},\\ y)\\}` }, from: { text: 'human labels' },
    head: { tex: '\\ch_j \\in [0,1]', sub: 'one number per concept' }, train: { tex: '\\gth,\\ \\fph', sub: 'predictor + head' } },
  { name: 'CEM', cite: 'Espinosa Zarlenga et al. 2022', data: { tex: `\\{(${X},\\ \\ccon{c},\\ y)\\}` }, from: { text: 'human labels' },
    head: { tex: '\\ch_j \\in \\mathbb{R}^m', sub: 'a vector per concept' }, train: { tex: '\\gth,\\ \\fph', sub: 'predictor + head' } },
  { name: 'PCBM', cite: 'Yuksekgonul et al. 2023', data: { tex: `\\{(${X},\\ y)\\}`, sub: '+ a concept bank' }, from: { text: 'a concept bank' },
    head: { text: 'scaled cosine scores', sub: 'phrase example' }, train: { tex: '\\fph', sub: 'head only' } },
  { name: 'LaBo', cite: 'Yang et al. 2023', data: { tex: `\\{(${X},\\ y)\\}` }, from: { text: 'a language model, CLIP' },
    head: { tex: `\\cos(\\phi(${X}),\\, \\psi(s_j))`, sub: 'raw CLIP scores' }, train: { tex: '\\fph', sub: 'head only' } },
  { name: 'LF-CBM', cite: 'Oikarinen et al. 2023', data: { tex: `\\{(${X},\\ y)\\}` }, from: { text: 'a language model' },
    head: { tex: `\\ch = W_c\\, e(${X})`, sub: 'a learned concept layer' }, train: { tex: 'W_c,\\ \\fph', sub: 'concept layer + head' } },
  { name: 'VLG-CBM', cite: 'Srivastava et al. 2024', data: { tex: `\\{(${X},\\ y)\\}`, sub: '+ a detector' }, from: { text: 'a language model, a detector' },
    head: { tex: `\\ch = W_c\\, e(${X})`, sub: 'a learned concept layer' }, train: { tex: 'W_c,\\ \\fph', sub: 'concept layer + head' } },
  { name: 'CBD', cite: 'Menon and Vondrick 2023', data: { text: 'none for new task' }, from: { text: 'a language model' },
    head: { tex: `\\cos(\\phi(${X}),\\, \\psi(d))`, sub: 'raw CLIP scores' }, train: { text: 'no task fitting' } },
];

// 19.7 who supplies the concepts, who checks them
const WHO: { v: string; sup: string; chk: string; human?: boolean; none?: boolean }[] = [
  { v: 'CBM, CEM', sup: 'people label them', chk: 'people', human: true },
  { v: 'PCBM', sup: 'a concept bank', chk: 'whoever built the bank' },
  { v: 'LF-CBM, LaBo', sup: 'a language model', chk: 'a CLIP similarity only' },
  { v: 'VLG-CBM', sup: 'a language model', chk: 'a detector' },
  { v: 'CBD', sup: 'a language model', chk: 'nobody', none: true },
];
const WY = 400, WH = 92, WX = [200, 640, 1160, 1720]; // first row centre, row pitch, column edges
// 19.8 the staircase (schematic levels of human labour and human checking per rung)
const STEPS = [
  { tex: '\\{\\cin{x},\\ \\ccon{c},\\ y\\}', who: 'CBM, CEM', labour: 1, check: 1, people: 2 },
  { tex: '\\{\\cin{x},\\ y\\}', who: 'PCBM, LF-CBM, LaBo, VLG-CBM', labour: 0.4, check: 0.3, people: 1 },
  { tex: '\\varnothing', who: 'by description', labour: 0, check: 0, people: 0 },
];
const COLS = ['variant', 'data needed', 'concepts from', 'what the head reads', 'trained'];
const CX = [160, 454, 726, 1044, 1474, 1760]; // column edges
const cmid = (j: number) => (CX[j] + CX[j + 1]) / 2;
const HY = 342, R0 = 370, RH = 77;
const ry = (i: number) => R0 + i * RH;
const RB = ry(ROWS.length);

const CellView: React.FC<{ c: Cell; x: number; y: number; w: number; o: number }> = ({ c, x, y, w, o }) => {
  if (o <= 0.001) return null;
  const two = !!c.sub;
  const yy = two ? y - 13 : y;
  const strong = c.text === 'none' || c.text === 'nothing';
  return (
    <>
      {c.tex ? <Tex x={x} y={yy} ax="center" size={28} o={o} dy={(1 - o) * 6} tex={c.tex} /> : null}
      {c.text ? <HText x={x} y={yy} ax="center" ay="middle" w={w} size={strong ? 28 : 26} weight={strong ? 700 : 500}
        color={C.chalk} o={o} lh={1.15} dy={(1 - o) * 6}>{c.text}</HText> : null}
      {c.sub ? <HText x={x} y={y + 22} ax="center" ay="middle" w={w} size={22} color={C.chalk2} o={o}>{c.sub}</HText> : null}
    </>
  );
};

export const S19: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.45) => inv(x - 0.1, x - 0.1 + d, t);
  const NB = 9;
  /** heading of beat k: in on the beat, out just before the next */
  const ho = (k: number) => inv(b(k) - 0.05, b(k) + 0.25, t) * (k < NB ? 1 - inv(b(k + 1) - 0.35, b(k + 1) - 0.05, t) : 1);
  const tableO = inv(b(1) - 0.05, b(1) + 0.25, t) * (1 - inv(b(7) - 0.35, b(7) - 0.05, t));

  // cell appearance times [data, from, head, train] per row
  const T: number[][] = [
    [w(2, 'Supervised'), w(4, 'people'), w(5, 'number'), w(6, 'predictor')],
    [w(2, 'embedding'), w(4, 'people') + 0.15, w(5, 'vector'), w(6, 'predictor') + 0.15],
    [w(3, 'Post'), w(4, 'bank'), w(5, 'scaled'), w(6, 'only')],
    [w(3, 'LaBo'), w(4, 'CLIP'), w(5, 'raw'), w(6, 'only') + 0.2],
    [w(3, 'label'), w(4, 'language'), w(5, 'Label'), w(6, 'layer')],
    [w(3, 'VLG'), w(4, 'detector'), w(5, 'VLG'), w(6, 'layer') + 0.2],
    [w(3, 'no'), w(4, 'language') + 0.3, w(5, 'raw') + 0.3, w(6, 'nothing')],
  ];
  // column headers: previewed dim on "one column at a time", full on their beat
  const prev = at(w(1, 'column') - 0.2, 0.5);
  const colIn = [at(b(1)), at(b(2)), at(b(4)), at(b(5)), at(b(6))];
  const nameIn = (i: number) => at(w(1, 'row') - 0.3 + i * 0.12, 0.4);
  const colNow = [0, ho(2) + ho(3), ho(4), ho(5), ho(6)];
  const keyO = at(w(2, 'Here') - 0.1, 0.5);
  const drop = at(w(3, 'drop'), 0.5) * (1 - at(b(4) - 0.3, 0.4)); // concept-labelled rows step back during "drop the concept labels"

  // 19.7 the warning
  const out7 = 1 - inv(b(8) - 0.35, b(8) - 0.05, t);
  const f1 = at(b(7) + 0.1) * out7, f2 = at(w(7, 'None')) * out7, f3 = at(w(7, 'phrase'), 0.6) * out7, f4 = at(w(7, 'checked')) * out7;
  // 19.8 who supplies, who checks
  const s7 = ho(8), s7h = at(w(8, 'who') - 0.1);
  const s7r = [w(8, 'CBMs'), w(8, 'post'), w(8, 'label', 1), w(8, 'VLG'), w(8, 'classification')].map((x) => at(x - 0.1, 0.5));
  // 19.9 the staircase
  const s8 = ho(9), s8step = (i: number) => at(b(9) + 0.15 + i * 0.3, 0.5);
  const s8lab = E.io(inv(w(9, 'labour') - 0.2, w(9, 'labour') + 0.8, t)), s8chk = E.io(inv(w(9, 'check') - 0.2, w(9, 'check') + 0.8, t));
  const s8line = at(w(9, 'saved') - 0.3, 0.5);

  return (
    <Stage>
      <Header t={t} part={modernSections.s19.part} title={P.title} />
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => <SlideHead key={k} text={bh(P, k)} o={ho(k)} />)}

      {/* ============================================================ 19.1 to 19.6 the table, one column per beat */}
      <Svg o={tableO}>
        {ROWS.map((_, i) => (
          <rect key={i} x={CX[0]} y={ry(i) + 3} width={CX[5] - CX[0]} height={RH - 6} rx={10}
            fill={rgba(C.chalk, i % 2 ? 0.015 : 0.035)} opacity={nameIn(i)} />
        ))}
        <line x1={CX[0]} x2={CX[5]} y1={R0 - 2} y2={R0 - 2} stroke={C.line2} strokeWidth={2} opacity={colIn[0]} />
        {[1, 2, 3, 4].map((j) => <line key={j} x1={CX[j]} x2={CX[j]} y1={HY - 22} y2={RB} stroke={C.line} strokeWidth={1.5} opacity={Math.max(prev * 0.5, colIn[j])} />)}
        {colNow.map((h, j) => (h > 0.001 ? (
          <rect key={j} x={CX[j] + 4} y={HY - 28} width={CX[j + 1] - CX[j] - 8} height={RB - HY + 30} rx={12}
            fill={rgba(C.chalk, 0.04 * h)} stroke={rgba(C.chalk, 0.6 * h)} strokeWidth={2.5} />
        ) : null))}
        {drop > 0.001 ? <rect x={CX[0]} y={ry(0)} width={CX[5] - CX[0]} height={2 * RH} rx={10} fill={rgba(C.bg, 0.5 * drop)} /> : null}
      </Svg>
      {tableO > 0.001 ? (
        <div style={{ position: 'absolute', inset: 0, opacity: tableO < 0.999 ? tableO : undefined }}>
          {COLS.map((c, j) => (
            <HText key={c} x={j === 0 ? CX[0] + 18 : cmid(j)} y={HY} ax={j === 0 ? 'left' : 'center'} ay="middle" size={26} weight={700}
              color={colNow[j] > 0.5 ? C.chalk : C.chalk2} o={j === 0 ? colIn[0] : Math.max(prev * 0.4, colIn[j])}>{c}</HText>
          ))}
          <Rich x={CX[1] + 6} y={284} ay="middle" size={26} color={C.chalk2} o={keyO}
            text="key: $\cin{x}$ an image, $\ccon{c}$ its concept labels, $y$ its class label" />
          {ROWS.map((r, i) => {
            const y = ry(i) + RH / 2;
            const cells = [r.data, r.from, r.head, r.train];
            return (
              <React.Fragment key={r.name}>
                <HText x={CX[0] + 18} y={y - 13} ay="middle" size={28} weight={700} color={C.chalk} o={nameIn(i)}>{r.name}</HText>
                <HText x={CX[0] + 18} y={y + 19} ay="middle" size={20} color={C.mute} o={nameIn(i)}>{r.cite}</HText>
                {r.name === 'CBD' ? <HText x={CX[0] + 96} y={y - 12} ay="middle" size={22} color={C.chalk2} o={nameIn(i)}>(by description)</HText> : null}
                {cells.map((c, j) => (
                  <CellView key={j} c={c} x={cmid(j + 1)} y={y} w={CX[j + 2] - CX[j + 1] - 24} o={at(T[i][j])} />
                ))}
              </React.Fragment>
            );
          })}
        </div>
      ) : null}

      {/* ============================================================ 19.7 the grounding warning, alone */}
      <Rich x={960} y={400} ax="center" size={36} text="Each change: cheaper {c:concepts}, or more accurate {y:predictions}." o={f1} />
      <Rich x={960} y={480} ax="center" size={40} weight={700} text="None makes grounding automatic." o={f2} />
      {f3 > 0.001 ? (
        <div style={{ position: 'absolute', left: 960, top: 640, transform: 'translate(-50%, -50%)', opacity: f3, whiteSpace: 'nowrap',
          fontFamily: F.sans, fontSize: 34, color: C.chalk2, textAlign: 'center' }}>
          a <span style={{ color: C.concept }}>phrase</span> from a language model, or a high{' '}
          <span className="tex" style={{ fontSize: 38, color: C.chalk }} dangerouslySetInnerHTML={{ __html: texHTML(`\\ccon{\\cos}(\\cin{\\phi(x)},\\psi(s))`, false) }} />
        </div>
      ) : null}
      <Rich x={960} y={720} ax="center" size={32} color={C.chalk2} text="does not show that" o={f3} />
      <Rich x={960} y={790} ax="center" size={34} text="the model sees that property in the {x:image}" o={f3} />
      <Rich x={960} y={890} ax="center" size={36} weight={700} color={C.bad} text="check it" o={f4} />

      {/* ============================================================ 19.8 who supplies the concepts, who checks them */}
      {s7 > 0.001 ? (
        <div style={{ position: 'absolute', inset: 0, opacity: s7 < 0.999 ? s7 : undefined }}>
          <Svg>
            {WHO.map((r, i) => (
              <rect key={i} x={WX[0] - 20} y={WY + i * WH - WH / 2 + 4} width={WX[3] - WX[0] + 20} height={WH - 8} rx={10}
                fill={rgba(C.chalk, i % 2 ? 0.015 : 0.035)} opacity={s7r[i]} />
            ))}
            <line x1={WX[0] - 20} x2={WX[3]} y1={WY - WH / 2 - 4} y2={WY - WH / 2 - 4} stroke={C.line2} strokeWidth={2} opacity={s7h} />
            {WHO.map((r, i) => (r.human ? (
              <g key={i}>
                <Person x={WX[2] + 150} y={WY + i * WH + 2} s={0.8} o={s7r[i]} />
                <Person x={WX[2] + 196} y={WY + i * WH + 2} s={0.8} o={s7r[i]} />
              </g>
            ) : null))}
          </Svg>
          <Rich x={WX[0]} y={WY - WH / 2 - 16} ay="bottom" size={26} weight={700} color={C.chalk2} text="variant" o={s7h} />
          <Rich x={(WX[1] + WX[2]) / 2} y={WY - WH / 2 - 16} ax="center" ay="bottom" size={26} weight={700} color={C.chalk2} text="who supplies the {c:concepts}" o={s7h} />
          <Rich x={(WX[2] + WX[3]) / 2} y={WY - WH / 2 - 16} ax="center" ay="bottom" size={26} weight={700} color={C.chalk2} text="who checks them" o={s7h} />
          {WHO.map((r, i) => {
            const y = WY + i * WH, o = s7r[i];
            return (
              <React.Fragment key={r.v}>
                <Rich x={WX[0]} y={y} ay="middle" size={30} weight={700} text={r.v} o={o} />
                <Rich x={(WX[1] + WX[2]) / 2} y={y} ax="center" ay="middle" size={30} text={r.sup} o={o} />
                <Rich x={r.human ? WX[2] + 236 : (WX[2] + WX[3]) / 2} y={y} ax={r.human ? 'left' : 'center'} ay="middle" size={30}
                  weight={r.none || r.human ? 700 : 500} color={r.none ? C.bad : r.human ? C.edit : C.chalk} text={r.chk} o={o} />
              </React.Fragment>
            );
          })}
        </div>
      ) : null}

      {/* ============================================================ 19.9 each rung up removes a cost and a check */}
      {s8 > 0.001 ? (
        <div style={{ position: 'absolute', inset: 0, opacity: s8 < 0.999 ? s8 : undefined }}>
          <Svg>
            {STEPS.map((st, i) => {
              const x = 200 + i * 530, y = 460 - i * 60, o = s8step(i), wd = 480; // rises rung by rung
              const by = 620;
              return (
                <g key={i} opacity={o < 0.999 ? o : undefined}>
                  <rect x={x} y={y} width={wd} height={84} rx={42} fill={rgba(C.chalk, 0.04)} stroke={C.line2} strokeWidth={2} />
                  <MathSvg x={x + 70} y={y + 42} tex={st.tex} size={32} color={C.chalk} />
                  <Txt x={x + (i === 1 ? 130 : 150)} y={y + 42} size={i === 1 ? 22 : 26} anchor="start" fill={C.chalk2}>{st.who}</Txt>
                  {i < 2 ? <path d={`M ${x + wd + 6} ${y + 42} L ${x + wd + 30} ${y + 42} L ${x + wd + 30} ${y - 18}`} fill="none" stroke={C.line2} strokeWidth={2.5} /> : null}
                  {Array.from({ length: st.people }, (_, k) => <Person key={k} x={x + 60 + k * 50} y={by + 14} s={0.9} />)}
                  {st.people === 0 ? <Txt x={x + 60} y={by + 14} size={26} anchor="start" weight={700} fill={C.bad}>nobody</Txt> : null}
                  <Txt x={x} y={by + 100} size={24} anchor="start" fill={C.chalk2}>human labour</Txt>
                  <rect x={x + 180} y={by + 88} width={260} height={24} rx={4} fill={C.bg3} />
                  <rect x={x + 180} y={by + 88} width={260 * (1 - (1 - st.labour) * s8lab)} height={24} rx={4} fill={C.edit} opacity={0.9} />
                  <Txt x={x} y={by + 160} size={24} anchor="start" fill={C.chalk2}>human check</Txt>
                  <rect x={x + 180} y={by + 148} width={260} height={24} rx={4} fill={C.bg3} />
                  <rect x={x + 180} y={by + 148} width={260 * (1 - (1 - st.check) * s8chk)} height={24} rx={4} fill={C.edit} opacity={0.9} />
                </g>
              );
            })}
          </Svg>
          <Rich x={960} y={846} ax="center" size={32} text="Labour saved on {c:labels} has to be spent later, on {e:checking}." o={s8line} />
          <EvTag x={1760} y={900} ax="right" kind="schematic" text="bar levels drawn for teaching" o={s8step(0)} />
        </div>
      ) : null}
    </Stage>
  );
};
