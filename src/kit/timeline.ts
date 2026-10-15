// Timeline access shared by every episode: scenes, beats and word times from narration/timeline.json.
// Scenes work in seconds relative to their own start.

export type Word = { w: string; s: number; e: number };
export type Beat = { id: string; start: number; end: number; text: string; caption: string; head?: string; words: Word[] };
export type SceneT = { id: string; title: string; start: number; end: number; dur: number; beats: Beat[] };
export type Timeline = { fps: number; duration: number; tempo: number; estimated?: boolean; scenes: SceneT[] };

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export type ScenePlan = SceneT & {
  /** beat start/end relative to the scene */
  b: (id: string) => { s: number; e: number };
  /** start time of the n-th word in a beat that begins with `word` (relative to the scene) */
  w: (id: string, word: string, n?: number) => number;
  /** end time of that word */
  we: (id: string, word: string, n?: number) => number;
};

export function scenePlan(T: Timeline, id: string): ScenePlan {
  const sc = T.scenes.find((x) => x.id === id);
  if (!sc) throw new Error(`no scene ${id}`);
  const beat = (bid: string) => {
    const b = sc.beats.find((x) => x.id === bid);
    if (!b) throw new Error(`no beat ${bid} in ${id}`);
    return b;
  };
  const find = (bid: string, word: string, n = 0) => {
    const b = beat(bid);
    const k = norm(word);
    const hits = b.words.filter((x) => norm(x.w).startsWith(k));
    const h = hits[Math.min(n, hits.length - 1)];
    if (!h) throw new Error(`no word "${word}" in beat ${bid}`);
    return h;
  };
  return {
    ...sc,
    b: (bid) => ({ s: beat(bid).start - sc.start, e: beat(bid).end - sc.start }),
    w: (bid, word, n = 0) => find(bid, word, n).s - sc.start,
    we: (bid, word, n = 0) => find(bid, word, n).e - sc.start,
  };
}
