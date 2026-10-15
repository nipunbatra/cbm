#!/usr/bin/env python3
"""asr_full.py — transcribe the final mixed narration (public/voice.wav) in chunks and compare with the whole script.
Complements tools/asrcheck.py (per clip): this checks the trimmed, tempo-adjusted, normalised track the film uses.
Writes qa/asr_full.json."""
import base64, difflib, json, os, subprocess, sys, tempfile, urllib.request
sys.path.insert(0, os.path.dirname(__file__))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEY = os.environ['GEMINI_API_KEY']
T = json.load(open(os.path.join(ROOT, 'src/timeline.json')))
src = open(os.path.join(ROOT, 'tools/asrcheck.py')).read()
ns = {}
ns['re'] = __import__('re'); exec(src[src.index('ONES = '):src.index('def transcribe')], ns)
norm = ns['norm']
out, chunks = [], []
for sc in T['scenes']:  # chunk on scene boundaries, about 3 minutes each
    if not chunks or chunks[-1][1] - chunks[-1][0] > 170: chunks.append([sc['start'], sc['end'], []])
    chunks[-1][1] = sc['end']; chunks[-1][2] += [b['text'] for b in sc['beats']]
tot_r = []
for a, b, texts in chunks:
    with tempfile.TemporaryDirectory() as td:
        f = os.path.join(td, 'c.wav')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(a), '-to', str(b), '-i', os.path.join(ROOT, 'public/voice.wav'), '-ac', '1', '-ar', '16000', f], check=True)
        body = {'contents': [{'parts': [{'inlineData': {'mimeType': 'audio/wav', 'data': base64.b64encode(open(f, 'rb').read()).decode()}}, {'text': 'Transcribe verbatim.'}]}]}
        r = json.load(urllib.request.urlopen(urllib.request.Request(f'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-transcribe:generateContent?key={KEY}', data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'}), timeout=600))
        heard = ' '.join(p.get('audioTranscription', {}).get('text') or p.get('text', '') for p in r['candidates'][0]['content']['parts'])
    x, y = norm(' '.join(texts)), norm(heard)
    sm = difflib.SequenceMatcher(None, x, y); ratio = sm.ratio(); tot_r.append((ratio, len(x)))
    big = [(op, ' '.join(x[i1:i2]), ' '.join(y[j1:j2])) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal' and max(i2 - i1, j2 - j1) >= 3]
    out.append({'start': a, 'end': b, 'ratio': round(ratio, 3), 'large_diffs': big, 'heard': heard})
    print(f'{a:7.1f}-{b:7.1f}  ratio {ratio:.3f}  large diffs: {big[:4]}')
w = sum(r * n for r, n in tot_r) / sum(n for _, n in tot_r)
print('weighted ratio', round(w, 3))
json.dump({'weighted_ratio': w, 'chunks': out}, open(os.path.join(ROOT, 'qa/asr_full.json'), 'w'), indent=1)
