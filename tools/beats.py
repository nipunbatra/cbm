#!/usr/bin/env python3
"""beats.py — docs/beats.txt: every beat's text and its start-end time inside its scene (seconds), for scene authors."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
T = json.load(open(ROOT / 'src' / 'timeline.json'))
L = []
for s in T['scenes']:
    L.append(f"## {s['id']}  {s['title']}  (duration {s['dur']:.2f} s)")
    for k, b in enumerate(s['beats'], 1):
        L.append(f"  beat {k} [{b['id']}]  {b['start'] - s['start']:6.2f} - {b['end'] - s['start']:6.2f}   " + (f"[[{b['head']}]] " if b.get('head') else '') + b['text'])
    L.append('')
import os
tmp = ROOT / 'docs' / f'beats.txt.tmp{os.getpid()}'; tmp.write_text('\n'.join(L)); os.replace(tmp, ROOT / 'docs' / 'beats.txt')
print('wrote docs/beats.txt')
