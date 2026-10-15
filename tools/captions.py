#!/usr/bin/env python3
"""captions.py — subtitles from the narration timeline.

  .venv/bin/python tools/captions.py
Writes out/concept_bottleneck_models.srt, out/concept_bottleneck_models.vtt and src/captions.json (burned into the captioned
master by src/Film.tsx). Each beat is split at sentence and clause boundaries into cues of at most two lines of 42
characters; cue times come from the beat's word timings. Spoken forms are rewritten into readable notation
("64 by 256" -> "64 × 256", "lambda g" -> "λ_g").
"""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
T = json.load(open(ROOT / 'src' / 'timeline.json'))
MAXC = 84

READ = [
    (r'\bYOLO version (\d+)\b', r'YOLOv\1'),
    (r'\bb (\d)\b', r'b\1'),
    (r'\bq (\d) to q (\d)\b', r'q\1 to q\2'),
    (r'\bQ obj\b', 'Q_obj'),
    (r'\bz i equals f i plus p i\b', 'zᵢ = fᵢ + pᵢ'),
    (r'\bd equals 256\b', 'd = 256'),
    (r'\bh i\b', 'hᵢ'),
    (r'\bC plus 1\b', 'C + 1'),
    (r'\bN by C plus 1\b', 'N × (C + 1)'),
    (r'\balpha i j is the softmax over j of q i dot k j, over root d k\b', 'αᵢⱼ = softmaxⱼ(qᵢ·kⱼ / √dₖ)'),
    (r'\bThe output o i is the sum of alpha i j times v j\b', 'The output oᵢ = Σⱼ αᵢⱼ vⱼ'),
    (r'\bsigma hat\b', 'σ̂'), (r'\bsigma of i\b', 'σ(i)'), (r'\bsigma\b', 'σ'),
    (r'\blambda 1\b', 'λ₁'), (r'\blambda g\b', 'λ_g'), (r'\blambda L1\b', 'λ_L1'), (r'\blambda GIoU\b', 'λ_GIoU'),
    (r'\bminus log (\d)', r'−log \1'),
    (r'\bminus (\d)', r'−\1'),
    (r'\b1 minus GIoU\b', '1 − GIoU'),
    (r'(\d) times (\d)', r'\1 × \2'),
    (r'(\d) plus (\d)', r'\1 + \2'),
    (r'\b(\d+) by (\d+) by (\d+)\b', r'\1 × \2 × \3'),
    (r'\b(\d+) by (\d+)\b', r'\1 × \2'),
    (r'\bN by L\b', 'N × L'), (r'\bN by d\b', 'N × d'), (r'\bL by d\b', 'L × d'), (r'\bL by L\b', 'L × L'), (r'\bN by 4\b', 'N × 4'),
    (r'\b(\d+) divided by (\d+(?:\.\d+)?)', r'\1 / \2'),
    (r'\bwritten with this symbol\b', 'written with this symbol, ∅'),
]


def readable(s):
    for a, b in READ:
        s = re.sub(a, b, s)
    return s


def chunks(text):
    """split into pieces of <= MAXC characters at sentence, then clause, then word boundaries"""
    out = []
    for sent in re.split(r'(?<=[.?!])\s+', text.strip()):
        if len(sent) <= MAXC:
            out.append(sent); continue
        parts, cur = re.split(r'(?<=[,:;])\s+', sent), ''
        for p in parts:
            if len(cur) + len(p) + 1 <= MAXC:
                cur = f'{cur} {p}'.strip()
            else:
                if cur: out.append(cur)
                while len(p) > MAXC:
                    cut = p.rfind(' ', 0, MAXC)
                    out.append(p[:cut]); p = p[cut + 1:]
                cur = p
        if cur: out.append(cur)
    return out


def two_lines(s):
    if len(s) <= 42: return s
    mid = len(s) // 2
    cands = [i for i, ch in enumerate(s) if ch == ' ']
    i = min(cands, key=lambda k: abs(k - mid))
    return s[:i] + '\n' + s[i + 1:]


cues = []
for sc in T['scenes']:
    for b in sc['beats']:
        words = b['words']
        pieces = chunks(b['text'])
        k = 0
        for piece in pieces:
            n = len(piece.split())
            ws = words[k:k + n] or words[-1:]
            t0, t1 = ws[0]['s'], ws[-1]['e']
            k += n
            cues.append({'s': round(t0, 3), 'e': round(t1 + 0.25, 3), 'text': readable(piece)})
        cues[-1]['e'] = round(max(cues[-1]['e'], b['end'] + 0.2), 3)
# no overlaps, a minimum display time
for a, c in zip(cues, cues[1:]):
    a['e'] = min(a['e'], c['s'] - 0.04)
for c in cues:
    c['e'] = max(c['e'], c['s'] + 0.9)


def ts(t, sep):
    h, r = divmod(t, 3600); m, s = divmod(r, 60)
    return f'{int(h):02d}:{int(m):02d}:{int(s):02d}{sep}{int(round((s - int(s)) * 1000)):03d}'


(ROOT / 'out').mkdir(exist_ok=True)
srt = [f'{i}\n{ts(c["s"], ",")} --> {ts(c["e"], ",")}\n{two_lines(c["text"])}\n' for i, c in enumerate(cues, 1)]
(ROOT / 'out' / 'concept_bottleneck_models.srt').write_text('\n'.join(srt))
vtt = ['WEBVTT\n'] + [f'{ts(c["s"], ".")} --> {ts(c["e"], ".")}\n{two_lines(c["text"])}\n' for c in cues]
(ROOT / 'out' / 'concept_bottleneck_models.vtt').write_text('\n'.join(vtt))
json.dump([{'s': c['s'], 'e': c['e'], 'text': two_lines(c['text'])} for c in cues], open(ROOT / 'src' / 'captions.json', 'w'), indent=0, ensure_ascii=False)
print(len(cues), 'cues; longest', max(len(c['text']) for c in cues), 'chars')
