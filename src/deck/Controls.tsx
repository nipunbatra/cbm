import React, { useCallback, useEffect, useRef, useState } from 'react';
import './controls.css';

type Section = { id: string; title: string; slides: string[] };
type Props = {
  sections: Section[]; section: number; slide: number; build: number; builds: number;
  notes: boolean; animate: boolean; recording: boolean; canPrev: boolean; canNext: boolean;
  onPrev: () => void; onNext: () => void; onJump: (section: number, slide: number) => void;
  onNotes: () => void; onAnimate: () => void; onRecording: () => void;
};

/** Browser chrome only. It is absent from the PDF and the film. */
export const Controls: React.FC<Props> = (p) => {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [map, setMap] = useState(false);
  const [query, setQuery] = useState('');
  const [fullscreen, setFullscreen] = useState(!!document.fullscreenElement);
  const [message, setMessage] = useState('');
  const chrome = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const mapButton = useRef<HTMLButtonElement>(null);
  const nextButton = useRef<HTMLButtonElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerInside = useRef(false);
  const keyboardFocus = useRef(false);
  const focusNext = useRef(false);

  const idle = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      if (dialog.current?.open || pointerInside.current ||
          (keyboardFocus.current && chrome.current?.contains(document.activeElement))) return;
      if (chrome.current?.contains(document.activeElement)) {
        document.getElementById('deck-stage')?.focus({ preventScroll: true });
      }
      setOpen(false); setVisible(false);
    }, 3000);
  }, []);
  const wake = useCallback(() => { setVisible(true); idle(); }, [idle]);
  const showMap = useCallback(() => { setQuery(''); setMap(true); wake(); }, [wake]);
  const closeMap = useCallback(() => { setMap(false); wake(); }, [wake]);
  const toggleFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
      setMessage('');
    } catch { setMessage('Full screen is unavailable in this browser.'); }
  }, []);

  useEffect(() => {
    if (open && focusNext.current) {
      focusNext.current = false;
      (nextButton.current?.disabled ? mapButton.current : nextButton.current)?.focus();
    }
  }, [open]);
  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (map) {
      el.showModal();
      el.scrollTop = 0;
      el.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
    } else if (el.open) {
      el.close();
      (open ? mapButton.current : toggle.current)?.focus({ preventScroll: true });
    }
  }, [map]);

  useEffect(() => {
    idle();
    const pointer = (e: PointerEvent) => {
      keyboardFocus.current = false;
      if (chrome.current?.contains(e.target as Node) || dialog.current?.open) { wake(); return; }
      setOpen(false);
      if (e.pointerType !== 'mouse') wake(); else idle();
    };
    const move = (e: PointerEvent) => {
      const bottom = window.innerHeight - (p.notes ? 190 : 0);
      if (e.clientX > window.innerWidth - 150 && e.clientY > bottom - 70 && e.clientY <= bottom) wake();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Tab') { keyboardFocus.current = true; return; }
      if (e.ctrlKey || e.metaKey || e.altKey || dialog.current?.open ||
          (e.target as HTMLElement).closest('input,textarea,select,[contenteditable="true"]')) return;
      const k = e.key.toLowerCase();
      if (e.repeat || !['c', 'm', 'o', 'n', 'a', 'r', 'f', 'escape'].includes(k)) return;
      e.preventDefault();
      keyboardFocus.current = true;
      if (k === 'c') {
        if (open) { setOpen(false); toggle.current?.focus(); }
        else { focusNext.current = true; setOpen(true); }
      } else if (k === 'm' || k === 'o') showMap();
      else if (k === 'n') p.onNotes();
      else if (k === 'a') p.onAnimate();
      else if (k === 'r') p.onRecording();
      else if (k === 'f') void toggleFullscreen();
      else { setOpen(false); document.getElementById('deck-stage')?.focus(); }
      wake();
    };
    const full = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('pointerdown', pointer);
    document.addEventListener('pointermove', move);
    document.addEventListener('keydown', key);
    document.addEventListener('fullscreenchange', full);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      document.removeEventListener('pointerdown', pointer);
      document.removeEventListener('pointermove', move);
      document.removeEventListener('keydown', key);
      document.removeEventListener('fullscreenchange', full);
    };
  }, [open, p.notes, p.onNotes, p.onAnimate, p.onRecording, idle, wake, showMap, toggleFullscreen]);

  const count = p.sections.slice(0, p.section).reduce((n, s) => n + s.slides.length, 0) + p.slide + 1;
  const total = p.sections.reduce((n, s) => n + s.slides.length, 0);
  const term = query.trim().toLocaleLowerCase();
  const matches = p.sections.map((s, section) => ({ ...s, section, matches: s.slides
    .map((title, slide) => ({ title, slide }))
    .filter((x) => `${s.id}.${x.slide + 1} ${s.title} ${x.title}`.toLocaleLowerCase().includes(term))
  })).filter((s) => s.matches.length);
  return <>
    <div ref={chrome} className={`deck-chrome${visible || open ? '' : ' is-idle'}`}
      style={{ '--notes-height': p.notes ? '190px' : '0px' } as React.CSSProperties}
      onPointerEnter={(e) => { pointerInside.current = e.pointerType === 'mouse'; wake(); }}
      onPointerLeave={() => { pointerInside.current = false; idle(); }}
      onPointerMove={wake} onFocusCapture={wake} onBlurCapture={idle}>
      <nav id="deck-controls" className="deck-toolbar" aria-label="Slide controls" hidden={!open}>
        <span className="deck-counter">Slide {count} / {total}<small>{p.recording ? 'Recording · one click per slide' : `Build ${p.build} / ${p.builds}`}</small></span>
        <button onClick={p.onPrev} disabled={!p.canPrev} title={`Previous ${p.recording ? 'slide' : 'build'} (left arrow)`}>← Previous</button>
        <button ref={nextButton} onClick={p.onNext} disabled={!p.canNext} title={`Next ${p.recording ? 'slide' : 'build'} (right arrow)`}>Next →</button>
        <button ref={mapButton} onClick={showMap} aria-haspopup="dialog" title="Slide map (M or O)">Map</button>
        <button onClick={p.onNotes} aria-pressed={p.notes} title="Narration (N)">Notes</button>
        <button onClick={p.onRecording} aria-pressed={p.recording} title="Recording mode: one click per complete slide (R)">Recording {p.recording ? 'on' : 'off'}</button>
        {!p.recording && <button onClick={p.onAnimate} aria-pressed={p.animate} title="Build animations (A)">Animation {p.animate ? 'on' : 'off'}</button>}
        <button onClick={() => void toggleFullscreen()} aria-pressed={fullscreen}
          disabled={!document.fullscreenEnabled} title="Full screen (F)">{fullscreen ? 'Exit full screen' : 'Full screen'}</button>
        {message && <span role="status" className="deck-message">{message}</span>}
      </nav>
      <button ref={toggle} className="deck-controls-toggle" aria-expanded={open} aria-controls="deck-controls"
        onClick={() => { setOpen(!open); wake(); }} title="Show or hide controls (C)">{open ? 'Close controls' : 'Controls'} <kbd>C</kbd></button>
    </div>
    <dialog ref={dialog} className="deck-map" aria-labelledby="deck-map-title"
      onKeyDown={(e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeMap(); } }} onCancel={(e) => { e.preventDefault(); closeMap(); }}>
      <header className="deck-map-header">
        <div><h1 id="deck-map-title">Slide map</h1><p>{total} slides · select a slide to jump to its completed build</p></div>
        <button onClick={closeMap}>Close <kbd>Esc</kbd></button>
        <input type="search" aria-label="Find a slide" placeholder="Find a topic or slide, e.g. interventions or s05.1"
          value={query} onChange={(e) => setQuery(e.target.value)} autoFocus />
      </header>
      <div className="deck-map-grid">
        {matches.map((s) => <details key={`${s.id}-${!!term}`} open={term || s.section === p.section ? true : undefined} className={s.section === p.section ? 'is-current' : ''}>
          <summary>{s.title}<small>{s.id} · {s.slides.length} {s.slides.length === 1 ? 'slide' : 'slides'}{s.section === p.section ? ' · current section' : ''}</small></summary>
          <div className="deck-map-slides">{s.matches.map((x) => <button key={x.slide}
            aria-current={s.section === p.section && x.slide === p.slide ? 'page' : undefined}
            onClick={() => { p.onJump(s.section, x.slide); closeMap(); }}>
            <span>{s.id}.{x.slide + 1}</span>{x.title}
          </button>)}</div>
        </details>)}
        {!matches.length && <p className="deck-map-empty">No matching slides. Try a different topic.</p>}
      </div>
      <footer>← → {p.recording ? 'slide by slide' : 'build by build'} · ↑ ↓ section by section · R recording mode · N notes · {!p.recording && 'A animation · '}F full screen</footer>
    </dialog>
  </>;
};
