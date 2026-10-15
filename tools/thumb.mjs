// thumb.mjs — render the thumbnail composition: out/cbm_thumbnail_4k.png (3840 x 2160) and out/cbm_thumbnail.jpg (1280 x 720)
// Remotion's frame and audio scratch files go to os.tmpdir(): keep them on the SSD (the internal disk is nearly full)
process.env.TMPDIR = process.env.CBM_TMP || '/Volumes/Extreme SSD/cbm-film/tmp';
import { bundle } from '@remotion/bundler';
import { renderStill, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const chrome = path.join(os.homedir(), '.cache/puppeteer/chrome-headless-shell/mac_arm-148.0.7778.97/chrome-headless-shell-mac-arm64/chrome-headless-shell');
const outDir = path.join(process.env.CBM_BUNDLES || '/Volumes/Extreme SSD/cbm-film/bundles', `t-${process.pid}`);
process.on('exit', () => fs.rmSync(outDir, { recursive: true, force: true }));
const serveUrl = await bundle({ entryPoint: path.join(ROOT, 'src/index.ts'), outDir, publicDir: path.join(ROOT, 'public-stills') });
const composition = await selectComposition({ serveUrl, id: 'Thumb', browserExecutable: chrome, inputProps: {} });
const png = path.join(ROOT, 'out/cbm_thumbnail_4k.png');
await renderStill({ composition, serveUrl, output: png, frame: 0, scale: 2, imageFormat: 'png', browserExecutable: chrome });
execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', png, '-vf', 'scale=1280:720', '-q:v', '2', path.join(ROOT, 'out/cbm_thumbnail.jpg')]);
console.log('wrote', png);
