// The review deck must follow edited narration without changing the saved film timeline.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { build } from 'esbuild';

const result = await build({ entryPoints: ['src/deck/reviewContent.ts'], bundle: true, write: false, format: 'esm' });
const { reviewScene } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
const recorded = JSON.parse(readFileSync('src/timeline.json', 'utf8'));
const script = JSON.parse(readFileSync('narration/script.json', 'utf8'));
const current = (sc) => reviewScene(sc, recorded.scenes.find((s) => s.id === sc.id), recorded.fps, recorded.tempo);
const sourceOf = (sc) => ({
  id: sc.id, title: sc.title, lead: sc.beats[0].start - sc.start, hold: 0.8,
  beats: sc.beats.map((b) => ({ id: b.id, text: b.text, head: b.head, gap: 0.8 })),
});

test('unchanged narration keeps exact recorded timing', () => {
  const original = recorded.scenes[0];
  assert.equal(current(sourceOf(original)), original);
});

test('a new separator previews without recorded audio or changes to the film timeline', () => {
  const before = JSON.stringify(recorded);
  const sc = { id: 's40', title: 'Rung two', lead: 0.4, hold: 0.8,
    beats: [{ id: '40.1', head: 'Class labels for the task', text: 'Next, post-hoc concept bottleneck models.', gap: 0.8 }] };
  const preview = current(sc);
  assert.equal(preview.start, 0);
  assert.ok(preview.dur > 0);
  assert.equal(preview.beats[0].start, sc.lead);
  assert.deepEqual(preview.beats[0].words.map((w) => w.w), sc.beats[0].text.split(' '));
  assert.ok(preview.end > preview.beats[0].end);
  assert.equal(JSON.stringify(recorded), before);
});

test('revised scene follows the current slide order and every word is inside its beat', () => {
  const before = JSON.stringify(recorded);
  for (const sc of script.scenes) {
    const preview = current(sc);
    assert.deepEqual(preview.beats.map((b) => [b.id, b.head, b.text]), sc.beats.map((b) => [b.id, b.head, b.text]));
    let end = preview.start;
    for (const b of preview.beats) {
      assert.ok(b.start >= end && b.end > b.start, b.id);
      assert.deepEqual(b.words.map((w) => w.w), b.text.trim().split(/\s+/), b.id);
      for (const w of b.words) assert.ok(w.s >= b.start - 0.001 && w.e <= b.end + 0.001 && w.e >= w.s, b.id);
      end = b.end;
    }
    assert.ok(preview.end >= end);
  }
  assert.equal(JSON.stringify(recorded), before);
});

test('deleting earlier slides preserves the surviving narration word offsets', () => {
  const old = recorded.scenes.find((s) => s.id === 's21');
  const sc = sourceOf(old);
  sc.beats = sc.beats.slice(1).map((b, i) => ({ ...b, id: `21.${i + 1}` }));
  const preview = current(sc);
  const last = preview.beats.at(-1);
  const original = old.beats.find((b) => b.text === last.text);
  assert.notEqual(last.id, original.id);
  last.words.forEach((w, i) => assert.ok(Math.abs((w.s - last.start) - (original.words[i].s - original.start)) < 0.000001));
});
