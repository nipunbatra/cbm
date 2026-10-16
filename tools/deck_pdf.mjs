// deck_pdf.mjs: vector PDF of the lecture deck, one page per build step (the scene at the end of each beat).
//   node tools/deck_pdf.mjs [deckDir] [out.pdf] [sceneId ...]
// Prints <deckDir>/index.html?print&only=<scene> per scene with headless Chrome, then merges the pages (pypdf).
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
const require = createRequire(path.join(os.homedir(), 'node_modules/'));
const puppeteer = require('puppeteer');
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const deck = path.resolve(process.argv[2] || path.join(root, 'deck'));
const out = path.resolve(process.argv[3] || path.join(deck, 'concept-bottleneck-models.pdf'));
// Review narration may have fewer slides than the saved film. Export the current script's page list.
const scriptPath = path.join(root, 'narration/script.json');
const tl = JSON.parse(fs.readFileSync(scriptPath, 'utf8'));
const want = process.argv.slice(4);
const ids = tl.scenes.map((s) => s.id).filter((id) => !want.length || want.includes(id));
const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'deckpdf-'));
// serve the deck over http (images do not load from file:// inside the player)
import http from 'node:http';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.svg': 'image/svg+xml' };
const server = http.createServer((q, r) => {
  const f = path.join(deck, decodeURIComponent(new URL(q.url, 'http://x').pathname));
  fs.readFile(f.endsWith('/') ? path.join(f, 'index.html') : f, (e, b) => { if (e) { r.writeHead(404); r.end(); } else { r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(b); } });
}).listen(0);
const base = `http://127.0.0.1:${server.address().port}`;
const browser = await puppeteer.launch({ headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--allow-file-access-from-files'] });
const page = await browser.newPage();
let pageError;
page.on('pageerror', (error) => { pageError = error; });
await page.setViewport({ width: 1920, height: 1080 });
const parts = [];
const steps = ids.flatMap((id) => tl.scenes.find((s) => s.id === id).beats.map((_, k) => [id, k + 1]));
for (const [id, k] of steps) {
  pageError = undefined;
  await page.goto(`${base}/index.html?print&only=${id}&step=${k}`, { waitUntil: 'load', timeout: 30000 });
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (let i = 0; i < 100 && !document.querySelector('.page'); i++) await new Promise((r) => setTimeout(r, 100));
    await Promise.all([...document.images].map((im) => (im.complete ? 0 : new Promise((r) => { im.onload = im.onerror = r; }))));
    await new Promise((r) => setTimeout(r, 400));
    if (document.querySelectorAll('.page').length !== 1) throw new Error('Expected exactly one slide');
    if ([...document.images].some((im) => !im.naturalWidth)) throw new Error('Slide has an unloaded image');
  });
  if (pageError) throw pageError;
  const f = path.join(tmp, `${id}_${String(k).padStart(2, '0')}.pdf`);
  await page.pdf({ path: f, width: '1920px', height: '1080px', printBackground: true, pageRanges: '', timeout: 0 });
  parts.push(f); if (k === 1) process.stdout.write(`${id} `);
}
await browser.close(); server.close();
execFileSync(path.join(os.homedir(), 'base/bin/python'), ['-c', `
import sys, json, pathlib, pypdf
modern = json.load(open(pathlib.Path(sys.argv[2]).parents[1] / 'src/modernSections.json'))
titles = {s['id']: modern.get(s['id'], {}).get('nav', s['title']) for s in json.load(open(sys.argv[2]))['scenes']}
w = pypdf.PdfWriter()
previous = None
for f in sys.argv[3:]:
    r = pypdf.PdfReader(f)
    assert len(r.pages) == 1, f
    scene = pathlib.Path(f).stem.split('_')[0]
    index = len(w.pages)
    w.append(r)
    if scene != previous:
        w.add_outline_item(f'{scene}: {titles[scene]}', index)
        previous = scene
w.add_metadata({'/Title': 'Concept Bottleneck Models: slide review', '/Author': 'Nipun Batra'})
w.compress_identical_objects(remove_identicals=True, remove_orphans=True)
w.write(sys.argv[1])
`, out, scriptPath, ...parts]);
// Chrome embeds each photo once per page: ghostscript deduplicates and downsamples them (text stays vector)
const gs = '/opt/homebrew/bin/gs';
if (fs.existsSync(gs)) {
  const raw = out.replace(/\.pdf$/, '.raw.pdf'); fs.renameSync(out, raw);
  execFileSync(gs, ['-q', '-dNOPAUSE', '-dBATCH', '-sDEVICE=pdfwrite', '-dDetectDuplicateImages=true', '-dDownsampleColorImages=true',
    '-dColorImageResolution=150', '-dCompatibilityLevel=1.6', `-sOutputFile=${out}`, raw]);
  fs.rmSync(raw);
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\nwrote ${out}`);
