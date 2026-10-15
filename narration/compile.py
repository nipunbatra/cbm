#!/usr/bin/env python3
"""compile.py: the lecture's content -> narration/script.json (read by tools/tts.py, tools/timeline*.py, the deck).

Source of truth: narration/order.txt (voice settings + scene order) and narration/scenes/<id>.txt (one per scene).
Each non-comment line of a scene file is one slide step = one beat = one TTS clip:
    [[Slide heading]] Spoken narration ... || 1.0
The heading (optional) is shown on the slide (colour markup as in kit `Rich`); the narration is spoken in the film and
shown as speaker notes in the deck. "|| x" sets the pause after the beat (default 0.6 s). "{tags: [calm]}" at the start
of the narration gives a per-beat voice direction. Falls back to the old single narration/script.txt if order.txt is
missing. Also writes docs/lecture.md, the whole lecture as one readable document.
"""
import json, os, re
from pathlib import Path
HERE = Path(__file__).resolve().parent


def lines():
    order = HERE / 'order.txt'
    if not order.exists():
        yield from (HERE / 'script.txt').read_text().splitlines(); return
    for line in order.read_text().splitlines():
        s = line.strip()
        if not s or s.startswith('#'): continue
        if s.startswith('@'): yield s; continue
        yield from (HERE / 'scenes' / f'{s}.txt').read_text().splitlines()


meta, scenes, n = {}, [], 0
for line in lines():
    line = line.strip()
    if not line or line.startswith('#') and not line.startswith('##'): continue
    if line.startswith('@'):
        k, v = line[1:].split(' ', 1); meta[k] = v; continue
    if line.startswith('##'):
        sid, title, lead, hold = [x.strip() for x in line[2:].split('|')]
        scenes.append({'id': sid, 'title': title, 'lead': float(lead), 'hold': float(hold), 'beats': []})
        n = int(sid[1:]) if sid[1:].isdigit() else 29  # beat ids follow the scene name, so removing a scene renumbers nothing
        continue
    head = None
    mh = re.match(r'\[\[(.*?)\]\]\s*(.*)$', line)
    if mh: head, line = mh.group(1).strip(), mh.group(2)
    tags = None
    mt = re.match(r'\{tags:\s*(.*?)\}\s*(.*)$', line)  # optional per-beat voice direction: {tags: [calm]} text
    if mt: tags, line = mt.group(1), mt.group(2)
    m = re.match(r'(.*?)\s*\|\|\s*([\d.]+)\s*$', line)
    text, gap = (m.group(1), float(m.group(2))) if m else (line, 0.6)
    sc = scenes[-1]
    sc['beats'].append({'id': f"{n}.{len(sc['beats']) + 1}", 'gap': gap, 'text': text,
                        **({'head': head} if head else {}), **({'tags': tags} if tags else {})})
S = {'voice': meta['voice'], 'model': meta['model'], 'tags': meta['tags'], 'scenes': scenes}


def atomic(path, text):
    tmp = f'{path}.tmp{os.getpid()}'
    open(tmp, 'w').write(text); os.replace(tmp, path)


atomic(HERE / 'script.json', json.dumps(S, indent=1, ensure_ascii=False))
# the readable lecture document
SYM = [(r'\cvec', 'ĉ'), (r'\ch', 'ĉ'), (r'\yh', 'ŷ'), (r'\gth', 'g_θ'), (r'\fph', 'f_φ'), (r'\lambda', 'λ'), (r'\mathbf', ''),
       (r'\theta', 'θ'), (r'\phi', 'φ'), (r'\in', '∈'), (r'\to', '→'), (r'\cdot', '·')]


def plain(h):  # slide heading markup -> readable text: {c:word} -> word, $\cvec$ -> ĉ, \chead{W} -> W
    h = re.sub(r'\{[a-z]:([^}]*)\}', r'\1', h)
    def tex(m):
        t = re.sub(r'\\c(?:in|con|head|edit|loss|leak|mu|bad|out)\{([^}]*)\}', r'\1', m.group(1))  # colour macros first
        for a, b in SYM: t = re.sub(re.escape(a) + r'(?![A-Za-z])', b, t)
        return t.replace('{', '').replace('}', '').replace('\\', '')
    return re.sub(r'\$([^$]+)\$', tex, h)
md = ['# Concept Bottleneck Models: the lecture', '',
      'Generated from narration/order.txt and narration/scenes/*.txt. Each numbered item is one slide step: its heading as',
      'shown on the slide, then the narration (the film voice and the deck\'s speaker notes).', '']
for sc in scenes:
    md += [f"## {sc['title']}  ({sc['id']})", '']
    for k, b in enumerate(sc['beats'], 1):
        md += [f"{k}. **{plain(b['head'])}**  " if b.get('head') else f'{k}. ', f"   {b['text']}", '']
atomic(HERE.parent / 'docs' / 'lecture.md', '\n'.join(md))
words = sum(len(b['text'].split()) for s in scenes for b in s['beats'])
print(f"{len(scenes)} scenes, {sum(len(s['beats']) for s in scenes)} beats, {words} words")
