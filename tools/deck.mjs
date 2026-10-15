// deck.mjs: bundle the lecture deck (the film's scene components, live in the browser) into a static folder.
//   node tools/deck.mjs [outDir]   (default deck/)  -> index.html, deck.js, deck.css, img/, fonts
// Single source: src/scenes/*, src/kit/*, src/data.json and src/timeline.json are shared with the film.
import esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const out = path.resolve(process.argv[2] || path.join(root, 'deck'));
fs.mkdirSync(out, { recursive: true });
await esbuild.build({
  entryPoints: [path.join(root, 'src/deck/main.tsx')], bundle: true, minify: true, format: 'iife', target: 'es2020',
  outfile: path.join(out, 'deck.js'), jsx: 'automatic', loader: { '.woff2': 'file', '.woff': 'file', '.ttf': 'file' },
  assetNames: 'fonts/[name]', define: { 'process.env.NODE_ENV': '"production"' }, logLevel: 'warning',
});
fs.cpSync(path.join(root, 'public/img'), path.join(out, 'img'), { recursive: true });
// slides need at most ~1400 px per photo: shrink big JPEGs so the deck and its PDF stay light (same aspect, same names)
import { execFileSync } from 'node:child_process';
execFileSync(path.join(process.env.HOME, 'base/bin/python'), ['-c', `
import sys, pathlib
from PIL import Image
for f in pathlib.Path(sys.argv[1]).rglob('*.jpg'):
    im = Image.open(f)
    if max(im.size) > 1400:
        im.thumbnail((1400, 1400)); im.convert('RGB').save(f, quality=86)
`, path.join(out, 'img')]);
// Change asset URLs with their contents so a returning reviewer gets the new build.
const assetVersion = (name) => createHash('sha256').update(fs.readFileSync(path.join(out, name))).digest('hex').slice(0, 12);
fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Concept Bottleneck Models</title><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"><link rel="stylesheet" href="deck.css?v=${assetVersion('deck.css')}">
<script>window.remotion_staticBase = location.pathname.split('/').slice(0, -1).join('/');</script>
<style>html,body{margin:0;background:#000;height:100%;overflow:hidden}@media print{html,body{overflow:visible;height:auto}@page{size:1920px 1080px;margin:0}}</style>
</head><body><div id="root"></div><script src="deck.js?v=${assetVersion('deck.js')}"></script></body></html>
`);
console.log('deck ->', out);
