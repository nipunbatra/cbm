// slide_stills.mjs — render film moments for the lecture slides, without the film's own header (clean mode).
//   node tools/slide_stills.mjs shots.json outdir     shots.json: [{"name": "s16-3", "scene": "s16", "t": 42.5}, ...]
// Writes <outdir>/<name>.jpg at 1920 x 1080 (JPEG q 88). Reuses one bundle.
process.env.TMPDIR = process.env.CBM_TMP || '/Volumes/Extreme SSD/cbm-film/tmp';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TL = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/timeline.json'), 'utf8'));
const [shotsFile, outDir] = process.argv.slice(2);
const shots = JSON.parse(fs.readFileSync(shotsFile, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
import { chrome } from './chrome.mjs';
const BUNDLES = process.env.CBM_BUNDLES || '/Volumes/Extreme SSD/cbm-film/bundles';
const bdir = path.join(BUNDLES, `s-${process.pid}`);
process.on('exit', () => fs.rmSync(bdir, { recursive: true, force: true }));
const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src/index.ts'), onProgress: () => {}, outDir: bdir, publicDir: path.join(ROOT, 'public-stills') });
const props = { noAudio: true, clean: true };
const comp = await selectComposition({ serveUrl, id: 'CBM', inputProps: props, browserExecutable: chrome });
for (const s of shots) {
  const sc = TL.scenes.find((x) => x.id === s.scene);
  const frame = Math.min(comp.durationInFrames - 1, Math.round((sc.start + s.t) * 30));
  const out = path.join(outDir, `${s.name}.jpg`);
  await renderStill({ composition: comp, serveUrl, output: out, frame, imageFormat: 'jpeg', jpegQuality: 88, browserExecutable: chrome, inputProps: props });
  console.log(out);
}
