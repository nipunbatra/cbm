// render.mjs — render the film with Remotion.
//   node tools/render.mjs animatic     1920x1080, quick review master (crf 23)
//   node tools/render.mjs 1080         1920x1080 master
//   node tools/render.mjs 4k           3840x2160 master (scale 2)
//   node tools/render.mjs 4k-cc        3840x2160 with burned-in captions
// Output goes to $CBM_OUT (default: /Volumes/Extreme SSD/cbm-film), because the internal disk is nearly full.
// Remotion's frame and audio scratch files go to os.tmpdir(): keep them on the SSD (the internal disk is nearly full)
process.env.TMPDIR = process.env.CBM_TMP || '/Volumes/Extreme SSD/cbm-film/tmp';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const OUT = process.env.CBM_OUT || '/Volumes/Extreme SSD/cbm-film';
const mode = process.argv[2] || 'animatic';
import { chrome } from './chrome.mjs';
const M = {
  animatic: { id: 'CBM', scale: 1, crf: 23, preset: 'veryfast', file: 'concept_bottleneck_models_animatic.mp4' },
  1080: { id: 'CBM', scale: 1, crf: 16, preset: 'slow', file: 'concept_bottleneck_models_1080p.mp4' },
  '4k': { id: 'CBM', scale: 2, crf: 16, preset: 'medium', file: 'concept_bottleneck_models_4k.mp4' },
  '4k-cc': { id: 'CBMCaptioned', scale: 2, crf: 16, preset: 'medium', file: 'concept_bottleneck_models_captioned_4k.mp4' },
}[mode];
if (!M) throw new Error(`unknown mode ${mode}`);
fs.mkdirSync(OUT, { recursive: true });
// bundle onto the external SSD (each bundle copies public/, ~150 MB) and delete it afterwards
const BUNDLES = process.env.CBM_BUNDLES || '/Volumes/Extreme SSD/cbm-film/bundles';
fs.mkdirSync(BUNDLES, { recursive: true });
const outDir = path.join(BUNDLES, `b-${process.pid}-${Date.now()}`);
process.on('exit', () => fs.rmSync(outDir, { recursive: true, force: true }));
// public/ holds symlinks into the SSD (the internal disk is nearly full) and the bundler does not follow them:
// assemble a real public dir on the SSD (images + the final mix) and bundle that.
const PUB = path.join(OUT, `public-render-${process.pid}`);  // one staging dir per render, removed on exit
process.on('exit', () => fs.rmSync(PUB, { recursive: true, force: true }));
fs.rmSync(PUB, { recursive: true, force: true });
fs.mkdirSync(path.join(PUB, 'img'), { recursive: true });
fs.cpSync(path.join(ROOT, 'public/img'), path.join(PUB, 'img'), { recursive: true });
fs.copyFileSync(fs.realpathSync(path.join(ROOT, 'public/mix.wav')), path.join(PUB, 'mix.wav'));
const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src/index.ts'), onProgress: () => {}, outDir, publicDir: PUB });
const composition = await selectComposition({ serveUrl, id: M.id, inputProps: {}, browserExecutable: chrome });
const out = path.join(OUT, M.file);
const t0 = Date.now();
let last = -1;
await renderMedia({
  composition, serveUrl, codec: 'h264', outputLocation: out, scale: M.scale, crf: M.crf, x264Preset: M.preset,
  pixelFormat: 'yuv420p', audioCodec: 'aac', audioBitrate: '256k', imageFormat: 'jpeg', jpegQuality: 95,
  concurrency: Number(process.env.CONC || 8), browserExecutable: chrome, inputProps: {},
  colorSpace: 'bt709',
  onProgress: ({ progress, renderedFrames }) => {
    const pct = Math.floor(progress * 100);
    if (pct !== last) {
      last = pct;
      const el = (Date.now() - t0) / 1000;
      console.log(`${mode} ${pct}%  frames ${renderedFrames}/${composition.durationInFrames}  ${el.toFixed(0)} s`);
    }
  },
});
console.log('wrote', out, `${((Date.now() - t0) / 60000).toFixed(1)} min`);
