// The lecture deck: the film's own scene components, rendered live (SVG + KaTeX, no screenshots).
// Click-driven builds: every narration beat is split at its sentence ends into build stops; a stop shows the scene as
// it is when that sentence finishes. Next plays a short (< 0.7 s) transition to the next stop and then waits: nothing
// moves on its own. Keys: right / space / page-down / click = next build, left / page-up = back, shift+right = jump
// without transition, up / down = previous / next section, n = notes (current sentence highlighted), o = overview,
// c = controls, m / o = slide map, a = transitions on/off, f = full screen. URL hash #s03.4 opens scene s03 at the end of beat 4.
// ?mode=recording shows complete slides: one click per slide, with no reveal animations. R toggles this mode.
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
import { adjacentPosition, buildStops, lastStopOfBeat as lastStop, recordingFromSearch, sectionStart, slideEndFrame, type Pos } from './navigation';

const recorded = timeline as unknown as Timeline;
const TL: Timeline = { ...recorded, scenes: script.scenes.map((sc) => {
  const previous = recorded.scenes.find((s) => s.id === sc.id);
  return reviewScene(sc, previous, recorded.fps, recorded.tempo);
}) };
const FPS = TL.fps;

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

const stepFrame = (s: number, k: number) => slideEndFrame(TL, s, k);
const STOPS = buildStops(TL);
const lastStopOfBeat = (s: number, beat: number) => lastStop(STOPS, s, beat);
const parseHash = (): Pos => {
  const m = /^#(\w+?)(?:\.(\d+))?$/.exec(location.hash);
  if (!m) return sectionStart(STOPS, 0, recordingFromSearch(location.search));
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
  const [recording, setRecording] = useState(() => recordingFromSearch(location.search));
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
    const onHash = () => { setRecording(recordingFromSearch(location.search)); const p = parseHash(); stopAnim(); shown.current = STOPS[p.s][p.k].frame; setPos(p); player.current?.seekTo(shown.current); };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  // a new section: show its stop immediately (the Player remounts with this frame)
  useEffect(() => { player.current?.seekTo(shown.current); }, [pos.s]);

  const nextPos = adjacentPosition(STOPS, pos, 1, recording);
  const prevPos = adjacentPosition(STOPS, pos, -1, recording);
  const next = useCallback((transition = animate) => {
    const p = adjacentPosition(STOPS, pos, 1, recording);
    if (p) go(p, transition && !recording);
  }, [pos, go, animate, recording]);
  const prev = useCallback(() => {
    const p = adjacentPosition(STOPS, pos, -1, recording);
    if (p) go(p, false);
  }, [pos, go, recording]);
  const toggleNotes = useCallback(() => setNotes((v) => !v), []);
  const toggleAnimate = useCallback(() => { if (!recording) setAnimate((v) => !v); }, [recording]);
  const toggleRecording = useCallback(() => {
    const enabled = !recording;
    const url = new URL(location.href);
    if (enabled) url.searchParams.set('mode', 'recording'); else url.searchParams.delete('mode');
    history.replaceState(null, '', url);
    setRecording(enabled);
    // Finish the current slide immediately, including when toggled halfway through a reveal.
    go({ s: pos.s, k: lastStopOfBeat(pos.s, STOPS[pos.s][pos.k].beat) }, false);
  }, [recording, pos, go]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((recording && e.repeat) || e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]') ||
          (e.target as HTMLElement).closest('input,textarea,select,summary,[contenteditable="true"]') ||
          ((e.target as HTMLElement).closest('button') && [' ', 'Enter'].includes(e.key))) return;
      if (['ArrowRight', ' ', 'PageDown', 'Enter'].includes(e.key)) { e.preventDefault(); next(animate && !e.shiftKey); }
      else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(e.key)) { e.preventDefault(); prev(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); go(sectionStart(STOPS, Math.min(TL.scenes.length - 1, pos.s + 1), recording), false); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); go(sectionStart(STOPS, Math.max(0, pos.s - 1), recording), false); }
      else if (e.key === 'Home') { e.preventDefault(); go(sectionStart(STOPS, 0, recording), false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pos, go, animate, next, prev, recording]);
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
          <div style={{ color: '#7d8894', fontSize: 14, marginBottom: 6 }}>{`${sc.id} · ${sc.title} · slide ${stop.beat + 1} of ${nb} · ${recording ? 'recording: full slide' : `build ${build} of ${builds}`}`}</div>
          {recording ? sc.beats[stop.beat].text : words.length ? (<span><span style={{ color: '#7d8894' }}>{words.slice(0, stop.from).join(' ')} </span>
            <span style={{ color: '#ffffff' }}>{words.slice(stop.from, stop.to).join(' ')}</span>
            <span style={{ color: '#5b6570' }}> {words.slice(stop.to).join(' ')}</span></span>) : sc.beats[stop.beat].text}
          {stop.beat + 1 < nb && stop.to >= words.length ? <div style={{ color: '#6b7680', marginTop: 8, fontSize: 16 }}>Next slide: {sc.beats[stop.beat + 1].text.slice(0, 140)}…</div> : null}
        </div>
      ) : null}
      <Controls sections={script.scenes.map((s) => ({ id: s.id, title: (modernSections as Record<string, {nav: string}>)[s.id]?.nav ?? s.title, slides: s.beats.map((b) =>
        ('head' in b && !String(b.head).includes('$') ? String(b.head).replace(/\{[xcfelkym]:([^{}]*)\}/g, '$1').trim() : '') || b.text.split(/(?<=[.!?])\s/)[0]
      ) }))} section={pos.s} slide={stop.beat}
        build={build} builds={builds}
        notes={notes} animate={animate} recording={recording} canPrev={!!prevPos} canNext={!!nextPos}
        onPrev={prev} onNext={() => next()} onJump={(s, beat) => go({ s, k: lastStopOfBeat(s, beat) }, false)}
        onNotes={toggleNotes} onAnimate={toggleAnimate} onRecording={toggleRecording} />
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
