#!/usr/bin/env python3
"""qa_video.py — sampled-frame review of a rendered film.

  .venv/bin/python tools/qa_video.py <video.mp4> [--every 3] [--ocr-every 6]
Writes qa/frames/f_XXXX.jpg (one frame every --every seconds, 960 px wide), qa/sheets/sheet_XX.jpg (4 x 4 contact
sheets with timecodes), and qa/ocr.json: Tesseract OCR of full-resolution frames every --ocr-every seconds. OCR words
that appear nowhere in the source (scene files, kit, narration, data labels) are listed as suspects: they usually mean
clipped, overlapping or garbled text. Equations are not OCR-checked (KaTeX output is validated from source).
"""
import argparse, json, re, subprocess, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ap = argparse.ArgumentParser()
ap.add_argument('video'); ap.add_argument('--every', type=float, default=3); ap.add_argument('--ocr-every', type=float, default=6)
a = ap.parse_args()
dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', a.video],
                           capture_output=True, text=True).stdout)
fr, sh = ROOT / 'qa' / 'frames', ROOT / 'qa' / 'sheets'
for d in (fr, sh):
    d.mkdir(parents=True, exist_ok=True)
    for f in d.glob('*.jpg'): f.unlink(missing_ok=True)  # exFAT AppleDouble ._ files vanish with their main file
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', a.video, '-vf', f'fps=1/{a.every},scale=960:-2',
                '-q:v', '4', str(fr / 'f_%04d.jpg')], check=True)
frames = sorted(fr.glob('f_*.jpg'))  # (does not match ._f_*)
from PIL import Image, ImageDraw
for k in range(0, len(frames), 16):
    sheet = Image.new('RGB', (1920, 1080), 'black'); d = ImageDraw.Draw(sheet)
    for i, f in enumerate(frames[k:k + 16]):
        t = (k + i) * a.every
        im = Image.open(f).convert('RGB').resize((480, 270))
        x, y = (i % 4) * 480, (i // 4) * 270
        sheet.paste(im, (x, y))
        d.rectangle([x, y, x + 92, y + 22], fill='black'); d.text((x + 6, y + 5), f'{int(t // 60):02d}:{t % 60:04.1f}', fill='white')
    sheet.save(sh / f'sheet_{k // 16:02d}.jpg', quality=88)

# vocabulary from the sources
vocab = set()
for p in list((ROOT / 'src').rglob('*.tsx')) + list((ROOT / 'src').rglob('*.ts')) + list((ROOT / 'narration' / 'scenes').glob('*.txt')) + [ROOT / 'narration' / 'order.txt', ROOT / 'src' / 'data.json']:
    vocab |= {w.lower() for w in re.findall(r'[A-Za-z]{2,}', p.read_text())}
ocr, suspects = {}, {}
with tempfile.TemporaryDirectory() as td:
    t = 1.0
    while t < dur:
        img = Path(td) / 'o.png'
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t:.2f}', '-i', a.video, '-frames:v', '1', '-vf', 'scale=1920:-2', str(img)], check=True)
        tsv = subprocess.run(['tesseract', str(img), '-', '--psm', '11', 'tsv'], capture_output=True, text=True).stdout
        rows = [r.split('\t') for r in tsv.splitlines()[1:]]
        good = [r[11] for r in rows if len(r) == 12 and r[11].strip() and float(r[10]) >= 88]
        txt = ' '.join(good)
        words = re.findall(r'[A-Za-z]{4,}', txt)
        bad = sorted({w for w in words if w.lower() not in vocab})
        ocr[f'{t:.1f}'] = txt.strip()
        if bad: suspects[f'{t:.1f}'] = bad
        t += a.ocr_every
json.dump({'video': a.video, 'duration': dur, 'suspects': suspects, 'ocr': ocr}, open(ROOT / 'qa' / 'ocr.json', 'w'), indent=1)
print(f'{len(frames)} frames, {len(list(sh.glob("*.jpg")))} sheets; OCR on {len(ocr)} frames, {len(suspects)} with suspect words')
for k, v in list(suspects.items())[:60]:
    print(' ', k, v)
