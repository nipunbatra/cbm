// The lecture deck: the film's own scene components, rendered live (SVG + KaTeX, no screenshots).
// Click-driven builds: every narration beat is split at its sentence ends into build stops; a stop shows the scene as
// it is when that sentence finishes. Next plays a short (< 0.7 s) transition to the next stop and then waits: nothing
// moves on its own. Keys: right / space / page-down / click = next build, left / page-up = back, shift+right = jump
// without transition, up / down = previous / next section, n = notes (current sentence highlighted), o = overview,
// c = controls, m / o = slide map, a = transitions on/off, f = full screen. URL hash #s03.4 opens scene s03 at the end of beat 4.
// ?print renders every beat's end state as its own page (for the PDF).
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Player, type PlayerRef } from '@remotion/player';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { C, F, H, W } from '../kit/theme';
import { HText, Stage, type SceneProps } from '../kit/core';
import { useFontsReady } from '../kit/fonts';
import { scenePlan, type Timeline } from '../kit/timeline';
import timeline from '../timeline.json';
import script from '../../narration/script.json';
import { reviewScene } from './reviewContent';
import { SCENES } from '../scenes';
import { Controls } from './Controls';
import modernSections from '../modernSections.json';

const recorded = timeline as unknown as Timeline;
const TL: Timeline = { ...recorded, scenes: script.scenes.map((sc) => {
  const previous = recorded.scenes.find((s) => s.id === sc.id);
  return reviewScene(sc, previous, recorded.fps, recorded.tempo);
}) };
const FPS = TL.fps;
const HOLD = -0.05; // the beat's end state (scene authors design and check the frame at beat end - 0.05 s)

const Placeholder: React.FC<SceneProps> = ({ P }) => (
  <Stage>
    <HText x={960} y={480} ax="center" size={64} weight={600}>{P.title}</HText>
    <HText x={960} y={580} ax="center" size={28} color={C.mute} mono>{`${P.id} (scene not drawn yet)`}</HText>
  </Stage>
);

const SceneOnly: React.FC<{ id: string }> = ({ id }) => {
  const ready = useFontsReady();
  const P = useMemo(() => scenePlan(TL, id), [id]);
  const Comp = SCENES[id] ?? Placeholder;
  const frame = useCurrentFrame(); // the Player's frame clock is the scene clock
  if (!ready) return <AbsoluteFill style={{ background: C.bg }} />;
  return <Comp t={frame / FPS} P={P} />;
};

type Pos = { s: number; k: number }; // scene index, build-stop index within the scene
const stepFrame = (s: number, k: number) => {
  const sc = TL.scenes[s];
  const b = sc.beats[k];
  const end = b.end - sc.start + HOLD;
  return Math.max(0, Math.min(Math.round(end * FPS), Math.round(sc.dur * FPS) - 1));
};
// build stops of a scene: the end of every sentence inside a beat (if it is not right at the beat's end), then the
// beat's end. Each stop remembers its beat and the sentence span, for the notes.
type Stop = { frame: number; beat: number; from: number; to: number };
const MIN_GAP = 1.0; // seconds: a sentence ending closer than this to the next stop is not a stop of its own
const STOPS: Stop[][] = TL.scenes.map((sc, s) => sc.beats.flatMap((b, k) => {
  const end = stepFrame(s, k);
  const out: Stop[] = []; let from = 0;
  const ws = b.words ?? [];
  ws.forEach((w, i) => {
    if (i === ws.length - 1 || !/[.?!]["')]?$/.test(w.w) || /^(al|e\.g|i\.e|etc)\.$/i.test(w.w)) return;
    const f = Math.round((w.e - sc.start + 0.15) * FPS);
    const prev = out.length ? out[out.length - 1].frame : -Infinity;
    if (f > prev + MIN_GAP * FPS && f < end - MIN_GAP * FPS) { out.push({ frame: f, beat: k, from, to: i + 1 }); from = i + 1; }
  });
  out.push({ frame: end, beat: k, from, to: ws.length });
  return out;
}));
const lastStopOfBeat = (s: number, k: number) => STOPS[s].reduce((a, st, i) => (st.beat === k ? i : a), 0);
const parseHash = (): Pos => {
  const m = /^#(\w+?)(?:\.(\d+))?$/.exec(location.hash);
  if (!m) return { s: 0, k: 0 };
  // Existing review links to the removed Part 9 continue at the next section.
  const removed = m[1] === 's09' || m[1] === 's20';
  const id = removed ? 's10' : m[1];
  if (removed) history.replaceState(null, '', '#s10.1');
  const s = Math.max(0, TL.scenes.findIndex((x) => x.id === id));
  const beat = removed ? 0 : Math.max(0, Math.min(TL.scenes[s].beats.length - 1, (Number(m[2]) || 1) - 1));
  return { s, k: lastStopOfBeat(s, beat) };
};

export const Deck: React.FC = () => {
  const [pos, setPos] = useState<Pos>(parseHash);
  const [notes, setNotes] = useState(false);
  const [animate, setAnimate] = useState(true);
  const player = useRef<PlayerRef>(null);
  const anim = useRef<number | null>(null);
  const shown = useRef<number>(STOPS[pos.s][pos.k].frame);
  const sc = TL.scenes[pos.s];

  const stopAnim = () => { if (anim.current !== null) cancelAnimationFrame(anim.current); anim.current = null; };
  // a short build: run the scene from frame a to frame b in at most 0.7 s (6x speed), then hold
  const runTo = useCallback((a: number, b: number) => {
    stopAnim();
    const pl = player.current; if (!pl) return;
    const ms = Math.min(700, Math.max(250, ((b - a) / FPS) * 1000 / 6));
    const t0 = performance.now();
    const tick = (now: number) => {
      const u = Math.min(1, (now - t0) / ms);
      const f = Math.round(a + (b - a) * u); pl.seekTo(f); shown.current = f;
      anim.current = u < 1 ? requestAnimationFrame(tick) : null;
    };
    anim.current = requestAnimationFrame(tick);
  }, []);

  const go = useCallback((p: Pos, transition: boolean) => {
    const f = STOPS[p.s][p.k].frame;
    setPos((old) => {
      const pl = player.current;
      if (pl && old.s === p.s) {
        if (transition && p.k === old.k + 1) runTo(shown.current, f);
        else { stopAnim(); pl.pause(); pl.seekTo(f); shown.current = f; }
      } else { stopAnim(); shown.current = f; }
      return p;
    });
    history.replaceState(null, '', `#${TL.scenes[p.s].id}.${STOPS[p.s][p.k].beat + 1}`);
  }, [runTo]);

  useEffect(() => {
    const onHash = () => { const p = parseHash(); stopAnim(); shown.current = STOPS[p.s][p.k].frame; setPos(p); player.current?.seekTo(shown.current); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  // a new section: show its stop immediately (the Player remounts with this frame)
  useEffect(() => { player.current?.seekTo(shown.current); }, [pos.s]);

  const next = useCallback((transition = animate) => {
    if (pos.k + 1 < STOPS[pos.s].length) go({ s: pos.s, k: pos.k + 1 }, transition);
    else if (pos.s + 1 < TL.scenes.length) go({ s: pos.s + 1, k: 0 }, false);
  }, [pos, go, animate]);
  const prev = useCallback(() => {
    if (pos.k > 0) go({ s: pos.s, k: pos.k - 1 }, false);
    else if (pos.s > 0) go({ s: pos.s - 1, k: STOPS[pos.s - 1].length - 1 }, false);
  }, [pos, go]);
  const toggleNotes = useCallback(() => setNotes((v) => !v), []);
  const toggleAnimate = useCallback(() => setAnimate((v) => !v), []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]') ||
          (e.target as HTMLElement).closest('input,textarea,select,summary,[contenteditable="true"]') ||
          ((e.target as HTMLElement).closest('button') && [' ', 'Enter'].includes(e.key))) return;
      if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); next(animate && !e.shiftKey); }
      else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); prev(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); go({ s: Math.min(TL.scenes.length - 1, pos.s + 1), k: 0 }, false); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); go({ s: Math.max(0, pos.s - 1), k: 0 }, false); }
      else if (e.key === 'Home') { e.preventDefault(); go({ s: 0, k: 0 }, false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pos, go, animate, next, prev]);
  useEffect(() => () => stopAnim(), []);

  const stop = STOPS[pos.s][pos.k];
  const nb = sc.beats.length;
  const build = STOPS[pos.s].slice(0, pos.k + 1).filter((s) => s.beat === stop.beat).length;
  const builds = STOPS[pos.s].filter((s) => s.beat === stop.beat).length;
  const words = (sc.beats[stop.beat].words ?? []).map((w) => w.w);
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', display: 'flex', flexDirection: 'column', fontFamily: F.sans }}>
      <div id="deck-stage" tabIndex={-1} aria-label="Lecture slide" style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none' }}
        onClick={(e) => { e.currentTarget.focus({ preventScroll: true }); e.clientX > window.innerWidth / 3 ? next() : prev(); }}>
        <div style={{ width: `min(100vw, calc((100vh - ${notes ? 190 : 0}px) * 16 / 9))`, aspectRatio: '16 / 9' }}>
          <Player key={sc.id} ref={player} component={SceneOnly} inputProps={{ id: sc.id }} durationInFrames={Math.max(1, Math.round(sc.dur * FPS))}
            fps={FPS} compositionWidth={W} compositionHeight={H} style={{ width: '100%', height: '100%' }} controls={false}
            initialFrame={shown.current} acknowledgeRemotionLicense />
        </div>
      </div>
      <div style={{ height: 3, background: '#111' }}>
        <div style={{ height: 3, width: `${((pos.s + (pos.k + 1) / STOPS[pos.s].length) / TL.scenes.length) * 100}%`, background: C.concept }} />
      </div>
      {notes ? (
        <div style={{ height: 187, flexShrink: 0, boxSizing: 'border-box', overflow: 'auto', padding: '14px 28px', background: '#0b0d10', color: '#cfd6dd', fontSize: 19, lineHeight: 1.45 }}>
          <div style={{ color: '#7d8894', fontSize: 14, marginBottom: 6 }}>{`${sc.id} · ${sc.title} · slide ${stop.beat + 1} of ${nb} · build ${build} of ${builds}`}</div>
          {words.length ? (<span><span style={{ color: '#7d8894' }}>{words.slice(0, stop.from).join(' ')} </span>
            <span style={{ color: '#ffffff' }}>{words.slice(stop.from, stop.to).join(' ')}</span>
            <span style={{ color: '#5b6570' }}> {words.slice(stop.to).join(' ')}</span></span>) : sc.beats[stop.beat].text}
          {stop.beat + 1 < nb && stop.to >= words.length ? <div style={{ color: '#6b7680', marginTop: 8, fontSize: 16 }}>Next slide: {sc.beats[stop.beat + 1].text.slice(0, 140)}…</div> : null}
        </div>
      ) : null}
      <Controls sections={script.scenes.map((s) => ({ id: s.id, title: (modernSections as Record<string, {nav: string}>)[s.id]?.nav ?? s.title, slides: s.beats.map((b) =>
        ('head' in b && !String(b.head).includes('$') ? String(b.head).replace(/\{[xcfelkym]:([^{}]*)\}/g, '$1').trim() : '') || b.text.split(/(?<=[.!?])\s/)[0]
      ) }))} section={pos.s} slide={stop.beat}
        build={build} builds={builds}
        notes={notes} animate={animate} canPrev={pos.s > 0 || pos.k > 0}
        canNext={pos.s < TL.scenes.length - 1 || pos.k < STOPS[pos.s].length - 1}
        onPrev={prev} onNext={() => next()} onJump={(s, beat) => go({ s, k: lastStopOfBeat(s, beat) }, false)}
        onNotes={toggleNotes} onAnimate={toggleAnimate} />
    </div>
  );
};

/** ?print: every step of every scene as a page, in order (tools/deck_pdf.mjs prints this page) */
export const PrintAll: React.FC<{ only?: string; step?: number }> = ({ only, step }) => {
  const ready = useFontsReady();
  if (!ready) return null;
  return (
    <div>
      {TL.scenes.flatMap((sc, s) => (only && only !== sc.id ? [] : sc.beats.map((b, k) => (step !== undefined && step !== k + 1 ? null : (
        <div key={b.id} className="page" style={{ width: W, height: H, position: 'relative', overflow: 'hidden', breakAfter: 'page' }}>
          <Player component={SceneOnly} inputProps={{ id: sc.id }} durationInFrames={Math.max(1, Math.round(sc.dur * FPS))} fps={FPS}
            compositionWidth={W} compositionHeight={H} style={{ width: W, height: H }} initialFrame={stepFrame(s, k)} acknowledgeRemotionLicense />
          <div style={{ position: 'absolute', bottom: 18, right: 48, color: C.mute, fontFamily: F.mono, fontSize: 20 }}>
            {`${sc.id}.${k + 1} · ${TL.scenes.slice(0, s).reduce((n, x) => n + x.beats.length, 0) + k + 1} / ${TL.scenes.reduce((n, x) => n + x.beats.length, 0)}`}
          </div>
        </div>
      )))))}
    </div>
  );
};
