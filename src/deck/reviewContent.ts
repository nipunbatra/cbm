// Slide review uses current narration. Saved film timing stays untouched until the audio is remade.
// Unchanged scenes retain their exact word alignment; only revised scenes need preview timing.
import type { Beat, SceneT, Word } from '../kit/timeline';

type ScriptBeat = { id: string; text: string; head?: string; caption?: string; gap: number };
type ScriptScene = { id: string; title: string; lead: number; hold: number; beats: ScriptBeat[] };

function previewWords(text: string, start: number, end: number): Word[] {
  const tokens = text.trim().split(/\s+/);
  const pause = (w: string) => /[.!?;:]$/.test(w) ? 4 : /,$/.test(w) ? 2 : 0;
  const weights = tokens.map((w) => w.replace(/[^a-z0-9]/gi, '').length + 1.5 + pause(w));
  const total = weights.reduce((a, b) => a + b, 0);
  let used = 0;
  return tokens.map((w, i) => {
    const s = start + (end - start) * used / total;
    used += weights[i];
    return { w, s, e: start + (end - start) * (used - pause(w)) / total };
  });
}

export function reviewScene(script: ScriptScene, recorded: SceneT | undefined, fps: number, tempo: number): SceneT {
  // New review sections have no audio yet. Give them local preview timing only.
  recorded ??= { id: script.id, title: '', start: 0, end: 0, dur: 0, beats: [] };
  if (script.title === recorded.title && script.beats.length === recorded.beats.length &&
      script.beats.every((b, i) => b.id === recorded.beats[i].id && b.text === recorded.beats[i].text &&
        b.head === recorded.beats[i].head)) return recorded;

  const speech = recorded.beats.reduce((n, b) => n + b.end - b.start, 0);
  const characters = recorded.beats.reduce((n, b) => n + b.text.length, 0);
  const secondsPerCharacter = characters ? speech / characters : 0.0625;
  let cursor = recorded.start + script.lead;
  const beats: Beat[] = script.beats.map((b) => {
    // Match by narration, not position: deleting a slide must not misalign the following slides.
    const old = recorded.beats.find((r) => r.text === b.text);
    const start = cursor;
    const end = start + (old ? old.end - old.start : Math.max(1.2, b.text.length * secondsPerCharacter));
    const words = old?.words.length
      ? old.words.map((w) => ({ ...w, s: w.s + start - old.start, e: w.e + start - old.start }))
      : previewWords(b.text, start + 0.05, end - 0.08);
    cursor = end + b.gap / tempo;
    return { id: b.id, text: b.text, caption: b.caption ?? b.text, head: b.head, start, end, words };
  });
  const end = Math.ceil((cursor + script.hold) * fps) / fps;
  return { id: script.id, title: script.title, start: recorded.start, end, dur: end - recorded.start, beats };
}
