// s22 Part 2 · The CUB benchmark (revision 2: one idea per slide, 9 beats, each beat replaces the previous slide)
// 22.1 our gull photo + "Caltech-UCSD Birds-200-2011 (CUB)"; 22.2 two big numbers (D.cub.n_images photographs,
// 200 species) and the 8 gull species; 22.3 the 28 attribute groups (D.cub.groups), the spoken four highlighted,
// 312 yes-or-no attributes; 22.4 two attribute questions answered 1 and a "no" answered 0, then c_j in {0, 1};
// 22.5 annotator certainty (D.cub.certainty_share); 22.6 majority vote within a species (noisy photo rows are
// illustrative, the voted row is Herring Gull's real CUB row); 22.7 312 -> 112 attributes present in >= 10 species;
// 22.8 one training record (Herring Gull's real class-level vector); 22.9 the record in symbols, then c hat.
import React from 'react';
import { C } from '../kit/theme';
import { E, HText, Header, Rich, SlideHead, Stage, Svg, Tex, Txt, be, bs, bw, bh, inv, type SceneProps } from '../kit/core';
import { ArchMap, CREDIT, Credit, EvTag, Flow, PhotoR, rgba } from '../kit/cbm';
import { Brace } from '../kit/slots';
import { D } from '../kit/data';

const CUB = D.cub;
const GROUPS: string[] = CUB.groups;
const GULLS: string[] = Object.keys(CUB.cbd.gull_descriptors); // CUB's gull species (8)
const N_SPECIES = 200; // CUB structural constant
const N_ATTR = 312; // CUB structural constant
const MIN_SPECIES = 10; // Koh et al.'s threshold (structural)
const NC: number = CUB.n_concepts; // 112
const commas = (v: number) => String(Math.round(v)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const pc = (v: number) => (v * 100).toFixed(1);
/** "has_wing_color" -> "wing colour" (British spelling on screen) */
const gname = (g: string) => g.replace(/^has_/, '').replace(/_/g, ' ').replace('color', 'colour');
const CERT: { k: string; name: string; col: string; a: number }[] = [
  { k: '4', name: 'definitely', col: C.concept, a: 0.95 },
  { k: '3', name: 'probably', col: C.concept, a: 0.6 },
  { k: '2', name: 'guessing', col: C.concept, a: 0.3 },
  { k: '1', name: 'not visible', col: C.mute, a: 0.9 },
];
// Herring Gull's class-level concept labels in CUB (Koh et al.'s vote, 112 entries, our CUB run)
const HG = (D as unknown as { cub: { herring_gull: { vector: number[]; names: string[] } } }).cub.herring_gull;
const NCELL = 20;
const CELLV = HG.vector.slice(0, NCELL);
const NAMED: [number, string][] = [1, 5, 11].map((i) => [i, HG.names[i]] as [number, string]);
// slide 4 questions: hooked bill (1), grey wing (5), yellow wing (6), answers read from Herring Gull's row
const QS: { i: number; q: string }[] = [
  { i: 1, q: 'Does it have a hooked bill?' },
  { i: 5, q: 'Is its wing grey?' },
  { i: 6, q: 'Is its wing yellow?' },
];
// slide 6 columns (Herring Gull's real voted values) and illustrative single-photo noise (one flip per photo)
const VCOL: { i: number; name: string }[] = [
  { i: 1, name: 'hooked bill' }, { i: 5, name: 'grey wing' }, { i: 6, name: 'yellow wing' },
  { i: 35, name: 'white upper tail' }, { i: 50, name: 'black eye' },
];
const VOTED = VCOL.map((c) => HG.vector[c.i]);
const FLIP: number[] = [2, 4, 0]; // photo r has its column FLIP[r] wrong (illustrative)
const noisy = (r: number, c: number) => (c === FLIP[r] ? 1 - VOTED[c] : VOTED[c]);

export const S22: React.FC<SceneProps> = ({ t, P }) => {
  const b = (k: number) => bs(P, k);
  const w = (k: number, word: string, n = 0) => bw(P, k, word, n);
  const at = (x: number, d = 0.4) => inv(x, x + d, t);
  const NB = 9;
  /** slide k: fades in (0.3 s) on the beat's first words, fades out (0.3 s) after the beat ends */
  const so = (k: number) => {
    const fin = inv(b(k) - 0.05, b(k) + 0.25, t);
    if (k === NB) return fin;
    const z = Math.min(be(P, k) + 0.02, b(k + 1) - 0.34);
    return fin * (1 - inv(z, z + 0.3, t));
  };
  const S = Array.from({ length: NB + 1 }, (_, k) => (k === 0 ? 0 : so(k)));

  // ================= slide 1: the benchmark
  const ph1 = { x: 240, y: 320, w: 440, h: 440 };
  const h1 = at(w(1, 'standard') - 0.1);
  const name1 = at(w(1, 'Caltech') - 0.1);
  const cub1 = at(w(1, 'CUB') - 0.15, 0.3);

  // ================= slide 2: two numbers
  const n2a = at(w(2, '11788') - 0.15), n2b = at(w(2, '200') - 0.15);
  const g2 = at(w(2, 'eight') - 0.1), g2n = at(w(2, 'gulls') - 0.2, 0.3);

  // ================= slide 3: 28 groups
  const l3 = at(w(3, '312') - 0.15);
  const chipIn = (i: number) => inv(w(3, '28') + i * 0.03, w(3, '28') + i * 0.03 + 0.3, t);
  const spoken: Record<string, number> = {
    has_bill_shape: at(w(3, 'bill'), 0.3), has_wing_color: at(w(3, 'wing'), 0.3),
    has_wing_pattern: at(w(3, 'wing', 1), 0.3), has_eye_color: at(w(3, 'eye'), 0.3),
  };
  const GX = 960 - 2 * 370, GCW = 370, GY = 410, GRH = 62;

  // ================= slide 4: yes-or-no questions
  const ph4 = { x: 200, y: 330, w: 380, h: 380 };
  const qIn = [at(w(4, 'hooked') - 0.4), at(w(4, 'wing') - 0.3), at(w(4, 'no', 1) - 0.2, 0.3)];
  const yesIn = [at(w(4, 'bill') + 0.2, 0.3), at(w(4, 'grey') + 0.2, 0.3), at(w(4, 'no', 1), 0.3)];
  const digIn = [at(w(4, 'one') - 0.1, 0.3), at(w(4, 'one') - 0.1, 0.3), at(w(4, 'zero') - 0.15, 0.3)];
  const eqW4 = at(w(4, 'yes', 1) - 0.1);
  const eq4 = at(w(4, 'zero') - 0.1, 0.35);
  const QX = 680, QW = 640, QY = [400, 510, 620];

  // ================= slide 5: certainty
  const BX = 260, BW = 1400, BY = 540;
  const segIn = (i: number) => {
    const s = w(5, ['definitely', 'probably', 'guessing', 'not'][i]) - 0.1;
    return inv(s, s + 0.5, t);
  };
  const tenth = at(w(5, 'About') - 0.1);
  let acc = 0;
  const segs = CERT.map((c, i) => {
    const v = CUB.certainty_share[c.k] as number;
    const s = { ...c, v, x0: BX + acc * BW, x1: BX + (acc + v) * BW, i };
    acc += v;
    return s;
  });

  // ================= slide 6: majority vote
  const VX0 = 580, VCW = 172, VCH = 58, VRY = [470, 550, 630], VY = 790;
  const v6rows = at(b(6) + 0.1);
  const v6ring = at(w(6, 'noisy') - 0.1);
  const v6vote = at(w(6, 'majority') - 0.1, 0.5);
  const v6live = at(w(6, 'majority'), 0.5) * (1 - at(w(6, 'every') + 0.6, 0.5));
  const v6fixOut = at(w(6, 'every') - 0.1, 0.2); // flipped cells fade out ...
  const v6fixIn = at(w(6, 'every') + 0.1, 0.25); // ... then in with the voted value
  const v6same = at(w(6, 'same') - 0.1);
  const v6cite = at(w(6, 'Koh') - 0.1);

  // ================= slide 7: 312 -> 112
  const top7 = at(b(7) + 0.1);
  const fun7 = at(w(7, '112') - 0.2, 0.6);
  const rule7 = at(w(7, 'present') - 0.1);
  const B7X = 260, B7W = 1400, B7Y = 430, B7H = 70;
  const k7w = (B7W * NC) / N_ATTR, k7x = 960 - k7w / 2, K7Y = 650;

  // ================= slide 8: the record
  const recPh = { x: 160, y: 470, w: 220, h: 220 };
  const RX0 = 470, CW = 44, RY = 580;
  const r8ph = at(w(8, 'photograph') - 0.2);
  const cellIn = (i: number) => inv(w(8, '112') - 0.1 + i * 0.03, w(8, '112') + i * 0.03 + 0.2, t);
  const named8 = at(w(8, 'ones') - 0.1);
  const spec8 = at(w(8, 'species') - 0.2, 0.3);
  const live8 = at(w(8, 'species'), 0.5);

  // ================= slide 9: symbols
  const w9a = at(w(9, 'concept') - 0.1), s9a = at(w(9, 'vector') - 0.1);
  const w9b = at(w(9, 'label') - 0.1), s9b = at(w(9, 'y') - 0.1);
  const dim9 = 1 - 0.5 * at(w(9, 'model') - 0.1, 0.5);
  const w9c = at(w(9, 'model') - 0.1), s9c = at(w(9, 'predicts') - 0.1), s9d = at(w(9, 'between') - 0.15);
  const w9d = at(w(9, 'value') - 0.1);

  const o = (k: number, v = 1) => S[k] * v;

  return (
    <Stage>
      {/* ================= photos ================= */}
      <PhotoR R={ph1} src="gull.jpg" o={o(1)} />
      <PhotoR R={ph4} src="gull.jpg" o={o(4)} />
      <PhotoR R={recPh} src="gull.jpg" o={o(8, r8ph)} />

      <Svg>
        {/* ---------------- slide 3: group grid ---------------- */}
        {S[3] > 0.001 ? (
          <g opacity={S[3] < 0.999 ? S[3] : undefined}>
            {GROUPS.map((g, i) => {
              const col = i % 4, row = Math.floor(i / 4);
              const x = GX + col * GCW, y = GY + row * GRH;
              const hi = spoken[g] ?? 0;
              const oc = chipIn(i);
              return oc <= 0.001 ? null : (
                <g key={g} opacity={oc < 0.999 ? oc : undefined}>
                  <rect x={x + 8} y={y - 22} width={GCW - 24} height={44} rx={8} fill={rgba(C.concept, 0.04 + 0.24 * hi)}
                    stroke={rgba(C.concept, 0.45 + 0.55 * hi)} strokeWidth={1.6 + 1.4 * hi} />
                  <Txt x={x + 26} y={y} size={26} anchor="start" weight={hi > 0.5 ? 700 : 500} fill={hi > 0.5 ? C.chalk : C.chalk2}>{gname(g)}</Txt>
                </g>
              );
            })}
          </g>
        ) : null}

        {/* ---------------- slide 4: question cards ---------------- */}
        {S[4] > 0.001 ? (
          <g opacity={S[4] < 0.999 ? S[4] : undefined}>
            {QS.map((q, k) => {
              const y = QY[k];
              const v = HG.vector[q.i];
              return qIn[k] <= 0.001 ? null : (
                <g key={k} opacity={qIn[k] < 0.999 ? qIn[k] : undefined}>
                  <rect x={QX} y={y - 40} width={QW} height={80} rx={12} fill={C.bg2} stroke={C.line2} strokeWidth={2} />
                  <Txt x={QX + 30} y={y} size={34} anchor="start" fill={C.chalk}>{q.q}</Txt>
                  <Txt x={QX + QW + 70} y={y} size={32} weight={600} fill={C.chalk2} o={yesIn[k]}>{v ? 'yes' : 'no'}</Txt>
                  <Flow pts={[[QX + QW + 120, y], [QX + QW + 196, y]]} color={C.concept} sw={3} head={12} p={E.out(digIn[k])} />
                  <rect x={QX + QW + 212} y={y - 36} width={72} height={72} rx={10} fill={v ? rgba(C.concept, 0.85) : C.bg3}
                    stroke={C.concept} strokeWidth={2} opacity={digIn[k]} />
                  <Txt x={QX + QW + 248} y={y + 1} size={44} mono weight={700} fill={v ? '#0B0F14' : C.concept} o={digIn[k]}>{String(v)}</Txt>
                </g>
              );
            })}
          </g>
        ) : null}

        {/* ---------------- slide 5: certainty bar ---------------- */}
        {S[5] > 0.001 ? (
          <g opacity={S[5] < 0.999 ? S[5] : undefined}>
            <rect x={BX} y={BY - 32} width={BW} height={64} rx={8} fill={C.bg3} opacity={segIn(0)} />
            {segs.map((s) => {
              const p = segIn(s.i);
              if (p <= 0.001) return null;
              const wv = (s.x1 - s.x0) * E.out(p);
              const below = s.k === '2';
              const cx = (s.x0 + s.x1) / 2;
              const nv = s.k === '1';
              return (
                <g key={s.k} opacity={Math.min(1, p * 2)}>
                  <rect x={s.x0 + 1.5} y={BY - 32} width={Math.max(0, wv - 3)} height={64} rx={6} fill={rgba(s.col, s.a)} />
                  <Txt x={cx} y={below ? BY + 74 : BY - 92} size={30} weight={nv ? 700 : 500} fill={nv ? C.chalk : C.chalk2} o={inv(0.4, 1, p)}>{s.name}</Txt>
                  <Txt x={cx} y={below ? BY + 112 : BY - 56} size={26} mono fill={nv ? C.chalk : C.chalk2} o={inv(0.4, 1, p)}>{`${pc(s.v)} %`}</Txt>
                  {nv ? <rect x={s.x0 - 4} y={BY - 37} width={s.x1 - s.x0 + 8} height={74} rx={9} fill="none" stroke={C.chalk} strokeWidth={3} opacity={tenth} /> : null}
                </g>
              );
            })}
          </g>
        ) : null}

        {/* ---------------- slide 6: majority vote ---------------- */}
        {S[6] > 0.001 ? (
          <g opacity={S[6] < 0.999 ? S[6] : undefined}>
            {VRY.map((y, r) => (
              <g key={r} opacity={v6rows < 0.999 ? v6rows : undefined}>
                <Txt x={VX0 - 30} y={y} size={30} anchor="end" fill={C.chalk2}>{`photo ${r + 1}`}</Txt>
                {VCOL.map((_, c) => {
                  const bad = c === FLIP[r];
                  const val = bad && v6fixIn > 0 ? VOTED[c] : noisy(r, c);
                  const oc = bad ? (v6fixOut > 0 && v6fixIn <= 0 ? 1 - v6fixOut : v6fixIn > 0 ? v6fixIn : 1) : 1;
                  const x = VX0 + c * VCW;
                  return (
                    <g key={c}>
                      <rect x={x + 8} y={y - VCH / 2} width={VCW - 16} height={VCH} rx={8} fill={val ? rgba(C.concept, 0.32) : C.bg3}
                        stroke={rgba(C.concept, 0.5)} strokeWidth={1.5} opacity={oc} />
                      <Txt x={x + VCW / 2} y={y + 1} size={32} mono weight={700} fill={val ? C.concept : C.chalk2} o={oc}>{String(val)}</Txt>
                      {bad ? (
                        <rect x={x + 2} y={y - VCH / 2 - 6} width={VCW - 4} height={VCH + 12} rx={11} fill="none" stroke={C.chalk}
                          strokeWidth={2.5} strokeDasharray="6 7" opacity={v6ring * (1 - v6fixOut)} />
                      ) : null}
                    </g>
                  );
                })}
              </g>
            ))}
            {/* vote: per column, the three photos flow into the species row */}
            {VCOL.map((_, c) => (
              <Flow key={c} pts={[[VX0 + c * VCW + VCW / 2, VRY[2] + 40], [VX0 + c * VCW + VCW / 2, VY - 40]]} color={C.concept} sw={3} head={12}
                p={E.out(v6vote)} t={t + c * 0.17} live={v6live} n={1} dotR={5} />
            ))}
            <line x1={VX0 - 200} x2={VX0 + VCOL.length * VCW} y1={VY - 50} y2={VY - 50} stroke={C.line2} strokeWidth={2} opacity={v6vote} />
            <g opacity={v6vote < 0.999 ? v6vote : undefined}>
              <Txt x={VX0 - 30} y={VY} size={30} weight={700} anchor="end" fill={C.chalk}>Herring Gull</Txt>
              {VCOL.map((_, c) => {
                const x = VX0 + c * VCW, v = VOTED[c];
                return (
                  <g key={c}>
                    <rect x={x + 8} y={VY - VCH / 2} width={VCW - 16} height={VCH} rx={8} fill={v ? rgba(C.concept, 0.85) : C.bg3}
                      stroke={C.concept} strokeWidth={2} />
                    <Txt x={x + VCW / 2} y={VY + 1} size={32} mono weight={700} fill={v ? '#0B0F14' : C.chalk2}>{String(v)}</Txt>
                  </g>
                );
              })}
            </g>
            {/* "same labels": a brace on the right gathers the three photo rows */}
            <g opacity={v6same < 0.999 ? v6same : undefined}>
              <path d={`M ${VX0 + VCOL.length * VCW + 20} ${VRY[0] - 30} q 18 0 18 18 L ${VX0 + VCOL.length * VCW + 38} ${VRY[2] + 12} q 0 18 -18 18`}
                fill="none" stroke={C.chalk2} strokeWidth={3} />
            </g>
          </g>
        ) : null}

        {/* ---------------- slide 7: 312 -> 112 ---------------- */}
        {S[7] > 0.001 ? (
          <g opacity={S[7] < 0.999 ? S[7] : undefined}>
            <rect x={B7X} y={B7Y - B7H / 2} width={B7W * E.out(top7)} height={B7H} rx={10} fill={C.bg3} stroke={C.line2} strokeWidth={2} opacity={top7} />
            <path d={`M ${B7X} ${B7Y + B7H / 2 + 6} L ${B7X + B7W} ${B7Y + B7H / 2 + 6} L ${k7x + k7w} ${K7Y - B7H / 2 - 6} L ${k7x} ${K7Y - B7H / 2 - 6} Z`}
              fill={rgba(C.concept, 0.07)} stroke={rgba(C.concept, 0.35)} strokeWidth={1.5} opacity={fun7} />
            <rect x={k7x} y={K7Y - B7H / 2} width={k7w} height={B7H} rx={10} fill={rgba(C.concept, 0.85)} opacity={inv(0.3, 1, fun7)} />
            <Txt x={960} y={K7Y + 1} size={34} weight={700} fill="#0B0F14" o={inv(0.5, 1, fun7)}>{`${NC} concepts`}</Txt>
          </g>
        ) : null}

        {/* ---------------- slide 8: the record ---------------- */}
        {S[8] > 0.001 ? (
          <g opacity={S[8] < 0.999 ? S[8] : undefined}>
            <Flow pts={[[recPh.x + recPh.w + 12, RY], [RX0 - 14, RY]]} color={C.input} sw={3.5} head={12} o={r8ph} t={t} live={live8} n={1} dotR={5} />
            {CELLV.map((v, i) => {
              const oc = cellIn(i);
              if (oc <= 0.001) return null;
              const x = RX0 + i * CW;
              const named = NAMED.some(([j]) => j === i);
              return (
                <g key={i} opacity={oc < 0.999 ? oc : undefined}>
                  <rect x={x} y={RY - 30} width={CW - 6} height={60} rx={5} fill={v ? rgba(C.concept, 0.85) : C.bg3}
                    stroke={named && named8 > 0.5 ? C.chalk : rgba(C.concept, 0.6)} strokeWidth={named && named8 > 0.5 ? 3 : 1.5} />
                  <Txt x={x + (CW - 6) / 2} y={RY} size={24} mono weight={700} fill={v ? '#0B0F14' : C.chalk2}>{String(v)}</Txt>
                </g>
              );
            })}
            <Txt x={RX0 + NCELL * CW + 30} y={RY} size={34} mono weight={700} fill={C.chalk2} o={cellIn(NCELL - 1)}>…</Txt>
            <Brace x1={RX0} x2={RX0 + NCELL * CW + 56} y={RY - 46} down={false} color={C.concept} p={cellIn(NCELL - 1)} />
            {NAMED.map(([i, name], k) => {
              const x = RX0 + i * CW + (CW - 6) / 2;
              const ly = RY + 84 + (NAMED.length - 1 - k) * 46;
              return (
                <g key={name} opacity={named8 < 0.999 ? named8 : undefined}>
                  <path d={`M ${x} ${RY + 32} L ${x} ${ly} L ${x + 18} ${ly}`} fill="none" stroke={C.chalk2} strokeWidth={2} />
                  <Txt x={x + 26} y={ly} size={24} mono anchor="start" fill={C.concept}>{`${name} = 1`}</Txt>
                </g>
              );
            })}
            <Flow pts={[[RX0 + NCELL * CW + 66, RY], [1468, RY]]} color={C.concept} sw={3.5} head={12} o={spec8} t={t + 0.4} live={live8} n={1} dotR={5} />
            <g opacity={spec8 < 0.999 ? spec8 : undefined}>
              <rect x={1484} y={RY - 64} width={276} height={128} rx={14} fill={C.bg2} stroke={C.chalk2} strokeWidth={2.5} />
              <Txt x={1622} y={RY - 18} size={32} weight={700} fill={C.chalk}>Herring Gull</Txt>
              <Txt x={1622} y={RY + 28} size={22} mono fill={C.chalk2}>{`one of ${N_SPECIES}`}</Txt>
            </g>
          </g>
        ) : null}
      </Svg>

      {/* ================= HTML text ================= */}
      {/* slide 1 */}
      <SlideHead text={bh(P, 1)} o={o(1, h1)} />
      <Credit x={ph1.x} y={ph1.y + ph1.h + 10} text={CREDIT['gull.jpg']} o={o(1)} />
      <HText x={ph1.x} y={ph1.y + ph1.h + 38} size={26} color={C.chalk2} o={o(1)}>our photo, not from CUB</HText>
      <HText x={800} y={410} size={50} weight={700} o={o(1, name1)}>Caltech-UCSD Birds-200-2011</HText>
      <HText x={800} y={490} size={110} weight={700} o={o(1, cub1)}>CUB</HText>
      <HText x={800} y={650} size={30} color={C.chalk2} o={o(1, cub1)}>Wah et al., Caltech 2011</HText>

      {/* slide 2 */}
      <SlideHead text={bh(P, 2)} o={o(2)} />
      <HText x={600} y={480} ax="center" ay="middle" size={128} mono weight={700} o={o(2, n2a)}>{commas(CUB.n_images)}</HText>
      <HText x={600} y={580} ax="center" size={36} color={C.chalk2} o={o(2, n2a)}>photographs</HText>
      <HText x={1320} y={480} ax="center" ay="middle" size={128} mono weight={700} o={o(2, n2b)}>{String(N_SPECIES)}</HText>
      <HText x={1320} y={580} ax="center" size={36} color={C.chalk2} o={o(2, n2b)}>species</HText>
      <Rich x={960} y={710} ax="center" size={36} text={`${GULLS.length} of the species are gulls`} o={o(2, g2)} />
      <HText x={960} y={772} w={1500} ax="center" size={26} mono color={C.mute} lh={1.45} o={o(2, g2n)}>
        {GULLS.map((g, i) => (
          <span key={g} style={{ color: g === 'Herring Gull' ? C.chalk : undefined }}>{g.replace(' Gull', '')}{i < GULLS.length - 1 ? ' · ' : ''}</span>
        ))}
      </HText>
      <EvTag x={1760} y={880} ax="right" kind="data" text="CUB-200-2011, counted" o={o(2, n2a)} />

      {/* slide 3 */}
      <SlideHead text={bh(P, 3)} o={o(3)} />
      <Rich x={960} y={308} ax="center" size={36} text={`{c:${N_ATTR}} yes-or-no attributes, in {c:${CUB.n_groups}} groups`} o={o(3, l3)} />

      {/* slide 4 */}
      <SlideHead text={bh(P, 4)} o={o(4)} />
      <Credit x={ph4.x} y={ph4.y + ph4.h + 10} text={CREDIT['gull.jpg']} o={o(4)} />
      <Rich x={1130} y={738} ax="center" size={32} color={C.chalk2} text="the {c:answer} to question $j$: yes is 1, no is 0" o={o(4, eqW4)} />
      <Tex x={1130} y={828} ax="center" size={60} tex="\ccon{c_j} \in \{0, 1\}" o={o(4, eq4)} />

      {/* slide 5 */}
      <SlideHead text={bh(P, 5)} o={o(5)} />
      <Rich x={960} y={720} ax="center" size={36} text="about one label in ten: {m:not visible}" o={o(5, tenth)} />
      <EvTag x={1760} y={880} ax="right" kind="data" text="CUB annotations, counted" o={o(5, segIn(0))} />

      {/* slide 6 */}
      <SlideHead text={bh(P, 6)} o={o(6)} />
      {VCOL.map((c, k) => (
        <HText key={c.name} x={VX0 + k * VCW + VCW / 2} y={398} w={VCW - 8} ax="center" ay="bottom" size={26} lh={1.15} color={C.concept} o={o(6, v6rows)}>
          {c.name}
        </HText>
      ))}
      <HText x={VX0 + VCOL.length * VCW + 56} y={VRY[1]} ay="middle" size={28} color={C.chalk} o={o(6, v6same)}>same labels</HText>
      <HText x={160} y={880} size={26} color={C.chalk2} o={o(6, v6cite)}>Koh et al., 2020</HText>
      <EvTag x={1760} y={880} ax="right" kind="illustrative" text="photo rows; the voted row is Herring Gull's in CUB" o={o(6, v6rows)} />

      {/* slide 7 */}
      <SlideHead text={bh(P, 7)} o={o(7)} />
      <HText x={960} y={B7Y} ax="center" ay="middle" size={34} weight={700} o={o(7, inv(0.5, 1, top7))}>{`${N_ATTR} attributes`}</HText>
      <HText x={960} y={K7Y + 70} ax="center" size={34} o={o(7, rule7)}>{`present in at least ${MIN_SPECIES} species`}</HText>
      <EvTag x={1760} y={880} ax="right" kind="data" text="CUB, filtered as in Koh et al. 2020" o={o(7, fun7)} />

      {/* slide 8 */}
      <SlideHead text={bh(P, 8)} o={o(8)} />
      <Rich x={recPh.x + recPh.w / 2} y={RY - 150} ax="center" size={30} text="{x:photo}" o={o(8, r8ph)} />
      <Rich x={RX0 + (NCELL * CW + 56) / 2} y={RY - 150} ax="center" size={30} text={`{c:${NC} concept labels, 0 or 1}`} o={o(8, cellIn(NCELL - 1))} />
      <Rich x={1622} y={RY - 150} ax="center" size={30} text="{y:species}" o={o(8, spec8)} />
      <Credit x={recPh.x} y={recPh.y + recPh.h + 10} text="Photo: Rhododendrites, CC BY-SA 4.0" o={o(8, r8ph)} />
      <EvTag x={1760} y={880} ax="right" kind="data" text={`Herring Gull's labels in CUB, first ${NCELL} of ${NC}; our photo`} o={o(8, cellIn(0))} />

      {/* slide 9 */}
      <SlideHead text={bh(P, 9)} o={o(9)} />
      <Rich x={600} y={350} ax="center" size={32} text="{c:concept labels}, each 0 or 1" o={o(9, w9a * dim9)} />
      <Tex x={600} y={450} ax="center" size={60} tex={`\\ccon{\\mathbf{c}} \\in \\{0, 1\\}^{${NC}}`} o={o(9, s9a * dim9)} />
      <Rich x={1320} y={350} ax="center" size={32} text="{y:species label}" o={o(9, w9b * dim9)} />
      <Tex x={1320} y={450} ax="center" size={60} tex={`y \\in \\{1, \\dots, ${N_SPECIES}\\}`} o={o(9, s9b * dim9)} />
      <Rich x={635} y={640} ax="center" size={28} text="{c:predicted concepts}" o={o(9, w9c)} />
      <Rich x={935} y={640} ax="center" size={28} text="{x:concept predictor}" o={o(9, w9c)} />
      <Rich x={1255} y={640} ax="center" size={28} color={C.chalk2} text="one value per concept" o={o(9, w9d)} />
      <Tex x={635} y={740} ax="center" size={64} tex="\cvec" o={o(9, s9c)} />
      <Tex x={755} y={740} ax="center" size={64} tex="=" o={o(9, s9c)} />
      <Tex x={935} y={740} ax="center" size={64} tex="\gth(\cin{x})" o={o(9, s9c)} />
      <Tex x={1255} y={740} ax="center" size={64} tex={`\\in [0, 1]^{${NC}}`} o={o(9, s9d)} />

      <Header t={t} part={2} title={P.title} />
      <ArchMap on={['c']} o={inv(0, 0.5, t)} />
    </Stage>
  );
};
