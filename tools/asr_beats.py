#!/usr/bin/env python3
"""asr_beats.py — transcribe every beat as it sounds in the final track (public/voice.wav), sliced by the timeline.
More sensitive than tools/asrcheck.py: it caught style tags read aloud that the per-clip check missed.
  python3 tools/asr_beats.py [--only 5.1,8.2]      prints suspect beats, writes qa/asr_beats.json"""
import argparse, base64, concurrent.futures as cf, difflib, json, os, re, subprocess, tempfile, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument('--only', default=''); a = ap.parse_args()
KEY = os.environ['GEMINI_API_KEY']; T = json.load(open(os.path.join(ROOT, 'src/timeline.json')))
src = open(os.path.join(ROOT, 'tools/asrcheck.py')).read(); ns = {'re': re}
exec(src[src.index('ONES = '):src.index('def transcribe')], ns); norm = ns["norm"]
TAGWORDS = {'calm', 'steady', 'lecturer', 'pace', 'experienced', 'university'}


def tr(b):
    with tempfile.TemporaryDirectory() as td:
        f = os.path.join(td, 'c.wav')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', str(max(0, b['start'] - 0.1)), '-to', str(b['end'] + 0.1),
                        '-i', os.path.join(ROOT, 'public/voice.wav'), '-ac', '1', '-ar', '16000', f], check=True)
        body = {'contents': [{'parts': [{'inlineData': {'mimeType': 'audio/wav', 'data': base64.b64encode(open(f, 'rb').read()).decode()}},
                                        {'text': 'Transcribe verbatim.'}]}]}
        for _ in range(3):
            try:
                r = json.load(urllib.request.urlopen(urllib.request.Request(
                    f'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-transcribe:generateContent?key={KEY}',
                    data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'}), timeout=300))
                return b, ' '.join(p.get('audioTranscription', {}).get('text') or p.get('text', '') for p in r['candidates'][0]['content']['parts'])
            except Exception as e:
                err = e
        return b, None  # transcription failed (reported, and fails the run)


only = set(x for x in a.only.split(',') if x)
beats = [b for s in T['scenes'] for b in s['beats'] if not only or b['id'] in only]
res, bad, failed = {}, [], []
# beats whose flag was listened to / cross-checked and accepted (id -> reason), see docs/qa_report.md
REVIEWED = json.load(open(os.path.join(ROOT, 'qa/asr_reviewed.json'))) if os.path.exists(os.path.join(ROOT, 'qa/asr_reviewed.json')) else {}
import hashlib
def still_reviewed(bid, text):
    # an approval only holds for the exact script text and audio clip that were reviewed
    r = REVIEWED.get(bid)
    if not r: return False
    clip = open(os.path.join(ROOT, f'narration/seg/{bid}.wav'), 'rb').read()
    return r.get('text_sha256') == hashlib.sha256(text.encode()).hexdigest() and r.get('audio_sha256') == hashlib.sha256(clip).hexdigest()
with cf.ThreadPoolExecutor(8) as ex:
    for b, heard in ex.map(tr, beats):
        if heard is None:
            failed.append(b['id']); print(f"{b['id']:6s} TRANSCRIPTION FAILED"); continue
        x, y = norm(b['text']), norm(heard)
        r = difflib.SequenceMatcher(None, x, y).ratio()
        tag = bool(TAGWORDS & set(y) - set(x))
        res[b['id']] = {'script': b['text'], 'heard': heard, 'ratio': round(r, 3), 'tag_spoken': tag}
        if tag or r < 0.85: bad.append(b['id']); print(f"{b['id']:6s} ratio {r:.2f} tag={tag}: {heard}")
json.dump(res, open(os.path.join(ROOT, 'qa/asr_beats.json'), 'w'), indent=1, ensure_ascii=False)
TEXT = {b['id']: b['text'] for b in beats}
open_ = [i for i in bad if not still_reviewed(i, TEXT[i])]
print('suspect:', ','.join(bad) or 'none', f'({len(beats)} beats);', 'unreviewed:', ','.join(open_) or 'none', '; failed:', ','.join(failed) or 'none')
if open_ or failed:
    raise SystemExit(1)
