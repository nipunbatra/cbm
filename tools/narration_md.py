#!/usr/bin/env python3
"""narration_md.py — docs/narration.md: the full narration with film timecodes, from src/timeline.json."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
T = json.load(open(ROOT / 'src' / 'timeline.json'))
S = json.load(open(ROOT / 'narration' / 'script.json'))
mmss = lambda t: f'{int(t // 60):02d}:{t % 60:05.2f}'
L = ['# Narration', '', f"Voice: Gemini TTS `{S['model']}`, voice **{S['voice']}**, direction `{S['tags']}`, tempo {T['tempo']}.",
     f"Running time {mmss(T['duration'])}. Source: `narration/order.txt` + `narration/scenes/*.txt` (one line per beat). Timecodes are film time.", '']
for sc in T['scenes']:
    L += [f"## {mmss(sc['start'])}  {sc['id']}  {sc['title']}", '']
    for b in sc['beats']:
        L.append(f"`{mmss(b['start'])}`  {b['text']}  ")
    L.append('')
(ROOT / 'docs' / 'narration.md').write_text('\n'.join(L))
print('words', sum(len(b['text'].split()) for s in T['scenes'] for b in s['beats']))
