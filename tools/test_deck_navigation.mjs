// Recording must visit every slide exactly once, forwards and backwards, across section boundaries.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { build } from 'esbuild';
const load = async (path) => {
  const result = await build({ entryPoints: [path], bundle: true, write: false, format: 'esm' });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
};
const { reviewScene } = await load('src/deck/reviewContent.ts');
const { buildStops, lastStopOfBeat, sectionStart, adjacentPosition, recordingFromSearch } = await load('src/deck/navigation.ts');
const recorded = JSON.parse(readFileSync('src/timeline.json', 'utf8'));
const script = JSON.parse(readFileSync('narration/script.json', 'utf8'));
const timeline = { ...recorded, scenes: script.scenes.map(sc => reviewScene(sc, recorded.scenes.find(s => s.id === sc.id), recorded.fps, recorded.tempo)) };
const stops = buildStops(timeline);
const expected = timeline.scenes.flatMap((sc, s) => sc.beats.map((b, beat) => `${s}.${beat}`));
const identify = p => `${p.s}.${stops[p.s][p.k].beat}`;
const walk = (start, direction, recording) => {
  const visited = [];
  for (let p = start; p; p = adjacentPosition(stops, p, direction, recording)) {
    assert.ok(visited.length < 10000, 'navigation must terminate');
    visited.push(p);
  }
  return visited;
};

test('recording visits each current slide once and always shows its complete narration', () => {
  const before = JSON.stringify(timeline);
  const forward = walk(sectionStart(stops, 0, true), 1, true);
  assert.deepEqual(forward.map(identify), expected);
  for (const p of forward) {
    const stop = stops[p.s][p.k];
    assert.equal(stop.to, timeline.scenes[p.s].beats[stop.beat].words.length);
    assert.ok(!stops[p.s][p.k + 1] || stops[p.s][p.k + 1].beat !== stop.beat);
  }
  assert.equal(JSON.stringify(timeline), before);
});

test('recording reverses through every slide and stops at both ends', () => {
  const last = { s: stops.length - 1, k: stops.at(-1).length - 1 };
  assert.equal(adjacentPosition(stops, last, 1, true), null);
  assert.deepEqual(walk(last, -1, true).map(identify), [...expected].reverse());
  assert.equal(adjacentPosition(stops, sectionStart(stops, 0, true), -1, true), null);
});

test('switching during any partial reveal retains that slide and advances exactly one slide', () => {
  for (const [s, scene] of stops.entries()) for (const [k, stop] of scene.entries()) {
    const finished = { s, k: lastStopOfBeat(stops, s, stop.beat) };
    assert.equal(identify(finished), identify({ s, k }));
    const next = adjacentPosition(stops, finished, 1, true);
    assert.equal(next && identify(next), expected[expected.indexOf(identify(finished)) + 1] ?? null);
  }
});

test('the default teaching route still visits every sentence stop; recording is explicit in the URL', () => {
  assert.equal(recordingFromSearch(''), false);
  assert.equal(recordingFromSearch('?mode=recording'), true);
  assert.equal(recordingFromSearch('?v=31&mode=recording'), true);
  assert.equal(recordingFromSearch('?mode=teaching'), false);
  const builds = walk(sectionStart(stops, 0, false), 1, false);
  assert.equal(builds.length, stops.flat().length);
  assert.ok(builds.length > expected.length * 2);
  assert.deepEqual(walk(builds.at(-1), -1, false), [...builds].reverse());
  console.log(`Current deck: ${builds.length} teaching stops; ${expected.length} complete recording slides.`);
});
