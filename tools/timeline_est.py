#!/usr/bin/env python3
"""timeline_est.py: a provisional timeline from the script alone (no audio), for building and reviewing the slides
before any narration is generated. Beat lengths are estimated from the text at the measured speaking rate of the
existing narration (seconds per character, fitted on the last real timeline); leads, gaps and holds come from
script.json exactly as in tools/timeline.py. Writes src/timeline.json (marked "estimated": true).
  ~/base/bin/python tools/timeline_est.py
tools/timeline.py replaces it with the real timeline once the narration exists.
"""
import json, os, re, sys
EP = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.argv = [sys.argv[0], EP]
S = json.load(open(os.path.join(EP, 'narration/script.json')))
FPS, TEMPO = 30, 1.12
q = lambda t: round(t * FPS) / FPS
# speaking rate from the last real (audio-based) timeline, if there is one
ref = os.path.join(EP, 'narration/timeline.json'); spc = 0.0625
if os.path.exists(ref):
    R = json.load(open(ref))
    if not R.get('estimated'):
        n = sum(len(b['text']) for s in R['scenes'] for b in s['beats'])
        d = sum(b['end'] - b['start'] for s in R['scenes'] for b in s['beats'])
        spc = d / n


def words_estimate(text, t0, t1):
    toks = text.split()
    wts = [len(re.sub(r'[^A-Za-z0-9]', '', w)) + 1.5 + (4 if w[-1] in '.:;?!' else 2 if w[-1] == ',' else 0) for w in toks]
    tot = sum(wts); out, acc = [], 0.0
    for w, k in zip(toks, wts):
        pen = 4 if w[-1] in '.:;?!' else 2 if w[-1] == ',' else 0
        out.append({'w': w, 's': round(t0 + (t1 - t0) * acc / tot, 3), 'e': round(t0 + (t1 - t0) * (acc + k - pen) / tot, 3)}); acc += k
    return out


t, scenes = 0.0, []
for sc in S['scenes']:
    s = {'id': sc['id'], 'title': sc['title'], 'start': q(t), 'beats': []}
    t = q(t) + sc.get('lead', 0)
    for b in sc['beats']:
        d = max(1.2, len(b['text']) * spc)
        s['beats'].append({'id': b['id'], 'start': round(t, 3), 'end': round(t + d, 3), 'text': b['text'],
                           'caption': b.get('caption', b['text']), **({'head': b['head']} if b.get('head') else {}), 'words': words_estimate(b['text'], t + 0.05, t + d - 0.08)})
        t += d + b['gap'] / TEMPO
    t += sc.get('hold', 0); s['end'] = q(t); t = s['end']; s['dur'] = round(s['end'] - s['start'], 3)
    scenes.append(s)
T = {'fps': FPS, 'duration': q(t), 'tempo': TEMPO, 'estimated': True, 'scenes': scenes}
tmp = os.path.join(EP, 'src', f'timeline.json.tmp{os.getpid()}')  # atomic: several scene authors may run this at once
json.dump(T, open(tmp, 'w'), indent=1, ensure_ascii=False); os.replace(tmp, os.path.join(EP, 'src', 'timeline.json'))
print(f'estimated timeline {T["duration"]:.1f}s ({int(T["duration"] // 60)} min), {spc:.4f} s/char, {len(scenes)} scenes')
