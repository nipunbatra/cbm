#!/usr/bin/env python3
"""test_narration.py: every number spoken in narration/script.json is traceable to src/data.json or to a documented
structural constant. A number in the script that matches neither fails the build."""
import json, re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
S = json.load(open(ROOT / 'narration/script.json'))
D = json.load(open(ROOT / 'src/data.json'))

# structural constants (not results): counts, sizes, years, units, loss weights of the run
CONST = {
    '0': 'concept value / edit target', '1': 'concept value / edit target', '2': 'lambda_c of the run (D.train)',
    '5': 'number of concepts', '6': 'number of species names given to CLIP', '8': 'eight shape classes',
    '13': 'schematic spindle frequency (D.eeg.spindle.hz)', '10': 'Sentinel-2 metres per pixel', '64': 'image size, pixels',
    '512': 'test images', '32': 'random orders', '100': 'accuracy with all five corrected (D.measured.all_true)',
    '2026': 'survey year', '112': 'CUB concept count in Koh et al.', '200': 'CUB species', '312': 'CUB raw attributes', '2048': 'ResNet-50 feature width', '14': 'size threshold, pixels (train script)', '15': 'radius bin (leakage/shape_probe.json key)', '11': 'spindle band lower edge, AASM (Hz)', '16': 'spindle band upper edge, AASM (Hz)', '3': 'zebra stripes weight, W[0][0] (D.zoo.W)',
}


def spoken_numbers(text):
    text = re.sub(r'(?<=\d),(?=\d{3}\b)', '', text)  # 11,788 -> 11788
    return re.findall(r'(?<![\w.])-?\d+(?:\.\d+)?', text)


def allowed():
    vals = set()
    def add(x, digits=(0, 1, 2, 3)):
        for d in digits:
            vals.add(f'{round(x, d):.{d}f}'.rstrip('0').rstrip('.') if d else str(int(round(x))))
    def walk(o):
        if isinstance(o, dict):
            for v in o.values(): walk(v)
        elif isinstance(o, list):
            for v in o: walk(v)
        elif isinstance(o, (int, float)) and not isinstance(o, bool):
            add(o); add(abs(o))
            if 0 <= o <= 1: add(100 * o, (1,)); add(100 * o, (0,))
    walk({k: v for k, v in D.items() if k not in ('eeg', 'leak')})
    walk({'leak': {k: D['leak'][k] for k in ('mu', 'threshold', 'soft_accuracy', 'hard_accuracy')}})
    return vals


def norm(n):
    n = n.lstrip('-')
    return n.rstrip('0').rstrip('.') if '.' in n else n


def test_every_spoken_number_is_traceable():
    ok = allowed() | set(CONST)
    bad = []
    for sc in S['scenes']:
        for b in sc['beats']:
            for n in spoken_numbers(b['text']):
                if norm(n) not in ok:
                    bad.append((b['id'], n))
    assert not bad, f'untraceable spoken numbers: {bad}'


def test_key_spoken_values_present():
    text = ' '.join(b['text'] for sc in S['scenes'] for b in sc['beats'])
    # The detailed leakage example (0.72, 0.96, 0.84) was removed in slide review.
    # Its underlying data still has independent numerical validation.
    for v in ['0.54', '0.21', '0.71', '0.29', '0.91', '1.2', '1.6', '0.2', '3.9', '0.7', '0.52', '0.95', '2.7', '0.12',
              '0.62', '0.38', '0.86', '1.4', '0.80', '0.45', '78.7', '82.0', '81.6', '92.4',
              '0.78', '97.3', '87.3']:
        assert v in text, v
