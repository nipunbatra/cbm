import type { Timeline } from '../kit/timeline';

export type Pos = { s: number; k: number };
export type Stop = { frame: number; beat: number; from: number; to: number };
export const recordingFromSearch = (search: string) => new URLSearchParams(search).get('mode') === 'recording';

/** Same completed frame used by the PDF. Never change the recorded timeline. */
export const slideEndFrame = (timeline: Timeline, s: number, k: number) => {
  const sc = timeline.scenes[s];
  return Math.max(0, Math.min(Math.round((sc.beats[k].end - sc.start - 0.05) * timeline.fps), Math.round(sc.dur * timeline.fps) - 1));
};

/** Sentence stops for teaching; recording navigation visits only each beat's last stop. */
export const buildStops = (timeline: Timeline): Stop[][] => timeline.scenes.map((sc, s) => sc.beats.flatMap((b, k) => {
  const end = slideEndFrame(timeline, s, k);
  const out: Stop[] = []; let from = 0;
  const ws = b.words ?? [];
  ws.forEach((w, i) => {
    if (i === ws.length - 1 || !/[.?!]["')]?$/.test(w.w) || /^(al|e\.g|i\.e|etc)\.$/i.test(w.w)) return;
    const f = Math.round((w.e - sc.start + 0.15) * timeline.fps);
    const prev = out.length ? out[out.length - 1].frame : -Infinity;
    if (f > prev + timeline.fps && f < end - timeline.fps) {
      out.push({ frame: f, beat: k, from, to: i + 1 }); from = i + 1;
    }
  });
  out.push({ frame: end, beat: k, from, to: ws.length });
  return out;
}));

export const lastStopOfBeat = (stops: Stop[][], s: number, beat: number) =>
  stops[s].reduce((last, stop, i) => stop.beat === beat ? i : last, 0);
export const sectionStart = (stops: Stop[][], s: number, recording: boolean): Pos =>
  ({ s, k: recording ? lastStopOfBeat(stops, s, 0) : 0 });

/** Null at either end prevents a click from wrapping or leaving the deck. */
export const adjacentPosition = (stops: Stop[][], pos: Pos, direction: 1 | -1, recording: boolean): Pos | null => {
  let { s, k } = pos;
  if (recording) {
    const beat = stops[s][k].beat + direction;
    if (beat >= 0 && beat <= stops[s].at(-1)!.beat) return { s, k: lastStopOfBeat(stops, s, beat) };
  } else if (k + direction >= 0 && k + direction < stops[s].length) {
    return { s, k: k + direction };
  }
  s += direction;
  if (s < 0 || s >= stops.length) return null;
  return direction === 1 ? sectionStart(stops, s, recording) : { s, k: stops[s].length - 1 };
};
