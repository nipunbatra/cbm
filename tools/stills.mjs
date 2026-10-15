// stills.mjs — render review stills of one scene at scene-relative times (or at every beat start + mid + end).
//   node tools/stills.mjs s07                 one still per beat (start + 60% through) and the last frame
//   node tools/stills.mjs s07 3.5 12 20.2     stills at these scene-relative seconds
//   node tools/stills.mjs all                 four stills per scene for every scene
// Writes qa/stills/<scene>/<scene>_<t>.jpg (1920 x 1080). Reuses one bundle per call.
// Remotion's frame and audio scratch files go to os.tmpdir(): keep them on the SSD (the internal disk is nearly full)
process.env.TMPDIR = process.env.CBM_TMP || '/Volumes/Extreme SSD/cbm-film/tmp';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TL = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/timeline.json'), 'utf8'));
const [which, ...ts] = process.argv.slice(2);
import { chrome } from './chrome.mjs';

const jobs = [];
for (const sc of TL.scenes) {
  if (which !== 'all' && sc.id !== which) continue;
  let times = ts.map(Number);
  if (!times.length) {
    if (which === 'all') times = [0.25, 0.5, 0.75, 0.97].map((f) => f * sc.dur);
    else {
      for (const b of sc.beats) times.push(b.start - sc.start + 0.3, b.start - sc.start + 0.6 * (b.end - b.start));
      times.push(sc.dur - 0.1);
    }
  }
  for (const t of times) jobs.push({ sc, t });
}
// bundle onto the external SSD (each bundle copies public/, ~150 MB) and delete it afterwards
const BUNDLES = process.env.CBM_BUNDLES || '/Volumes/Extreme SSD/cbm-film/bundles';
fs.mkdirSync(BUNDLES, { recursive: true });
const outDir = path.join(BUNDLES, `b-${process.pid}-${Date.now()}`);
process.on('exit', () => fs.rmSync(outDir, { recursive: true, force: true }));
// stills need no audio: bundle a public dir with only the images (public-stills/img -> public/img)
const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src/index.ts'), onProgress: () => {}, outDir, publicDir: path.join(ROOT, 'public-stills') });
const comp = await selectComposition({ serveUrl, id: 'CBM', inputProps: { noAudio: true }, browserExecutable: chrome });
for (const { sc, t } of jobs) {
  const dir = path.join(ROOT, 'qa/stills', which === 'all' ? 'all' : sc.id);
  fs.mkdirSync(dir, { recursive: true });
  const frame = Math.min(comp.durationInFrames - 1, Math.round((sc.start + t) * 30));
  const out = path.join(dir, `${sc.id}_${t.toFixed(1).padStart(5, '0')}.jpg`);
  await renderStill({ composition: comp, serveUrl, output: out, frame, imageFormat: 'jpeg', jpegQuality: 85, browserExecutable: chrome, inputProps: { noAudio: true } });
  console.log(out);
}
