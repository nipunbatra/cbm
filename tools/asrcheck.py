#!/usr/bin/env python3
"""asrcheck.py — transcribe every narration clip with Gemini 3.5 Transcribe and diff it against the script.

TTS models occasionally add words, skip words or speak their style tags aloud; this catches that.
  python3 tools/asrcheck.py episodes/ep01 [--only 0.2,3.4] [--fix N]
With --fix N it regenerates flagged clips (tools/tts.py --force) and re-checks, up to N rounds.
Writes <episode>/qa/asr.json (id -> transcript, ratio).
"""
import argparse, base64, concurrent.futures as cf, difflib, json, os, re, subprocess, sys, urllib.request

ap = argparse.ArgumentParser()
ap.add_argument('episode'); ap.add_argument('--only', default=''); ap.add_argument('--fix', type=int, default=0)
ap.add_argument('--threshold', type=float, default=0.95)
a = ap.parse_args()
KEY = os.environ['GEMINI_API_KEY']; EP = os.path.abspath(a.episode)
S = json.load(open(os.path.join(EP, 'narration/script.json')))
ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS = 'zero ten twenty thirty forty fifty sixty seventy eighty ninety'.split()
SPELL = {'centre': 'center', 'centres': 'centers', 'neighbouring': 'neighboring', 'colour': 'color', 'normalized': 'normalised',
         'percent': '%', 'postprocessing': 'post processing', 'noobj': 'no object', 'iou': 'i o u', 'iou.': 'i o u',
         'recognise': 'recognize', 'organises': 'organizes', 'favours': 'favors', 'metres': 'meters', 'colours': 'colors',
         'behaviour': 'behavior', 'grey': 'gray', 'okay': 'ok', 'labelled': 'labeled', 'modelling': 'modeling'}


def words(n):
    n = int(n)
    if n < 20: return ONES[n]
    if n < 100: return TENS[n // 10] + ('' if n % 10 == 0 else ' ' + ONES[n % 10])
    if n < 1000: return ONES[n // 100] + ' hundred' + ('' if n % 100 == 0 else ' ' + words(n % 100))
    return words(n // 1000) + ' thousand' + ('' if n % 1000 == 0 else ' ' + words(n % 1000))


def num(m):
    t = m.group(0).replace(',', '')
    if '.' in t:
        a, b = t.split('.')
        return ' ' + words(a or 0) + ' point ' + ' '.join(ONES[int(d)] for d in b) + ' '
    return ' ' + words(t) + ' '


def norm(s):
    s = s.lower().replace('é', 'e').replace('−', '-')
    s = re.sub(r'(?<![a-z0-9])-\s*(?=\d)', ' minus ', s)  # a minus sign before a number
    s = s.replace('+', ' plus ').replace('=', ' equals ')
    for a_, b_ in (('heat map', 'heatmap'), ('wing tips', 'wingtips'), ('wing tip', 'wingtip'), ('pre-trained', 'pretrained'), ('pre trained', 'pretrained'),
                   ('multitask', 'multi task'), ('multi-task', 'multi task')):
        s = s.replace(a_, b_)
    s = s.replace('–', ' ').replace('-', ' ').replace('×', ' by ')
    s = re.sub(r'(?<=\d)\s*x\s*(?=\d)', ' by ', s)
    s = re.sub(r'(\d)%', r'\1 percent', s)
    s = re.sub(r'\d[\d,]*\.?\d*', num, s)
    s = re.sub(r"[^a-z' ]", ' ', s).replace("'", '')
    out = []
    for w in s.split():
        out.extend(SPELL.get(w, w).split())
    return [w for w in out if w not in ('a', 'the', 'and')]


def transcribe(path):
    data = base64.b64encode(open(path, 'rb').read()).decode()
    body = {'contents': [{'parts': [{'inlineData': {'mimeType': 'audio/wav', 'data': data}},
                                    {'text': 'Transcribe verbatim.'}]}]}
    url = f'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-transcribe:generateContent?key={KEY}'
    for _ in range(4):
        try:
            r = json.load(urllib.request.urlopen(urllib.request.Request(url, data=json.dumps(body).encode(),
                                                 headers={'Content-Type': 'application/json'}), timeout=300))
            out = []
            for p in r['candidates'][0]['content']['parts']:
                out.append(p.get('audioTranscription', {}).get('text') or p.get('text', ''))
            return ' '.join(out).strip()
        except Exception as e:
            print('retry', e, file=sys.stderr)
    return ''


beats = [b for sc in S['scenes'] for b in sc['beats']]
only = set(x for x in a.only.split(',') if x)
qpath = os.path.join(EP, 'qa/asr.json'); os.makedirs(os.path.dirname(qpath), exist_ok=True)
Q = json.load(open(qpath)) if os.path.exists(qpath) else {}
for rnd in range(a.fix + 1):
    todo = [b for b in beats if not only or b['id'] in only]
    with cf.ThreadPoolExecutor(6) as ex:
        res = dict(zip([b['id'] for b in todo], ex.map(lambda b: transcribe(os.path.join(EP, f"narration/seg/{b['id']}.wav")), todo)))
    bad = []
    for b in todo:
        x, y = norm(b['text']), norm(res[b['id']])
        r = difflib.SequenceMatcher(None, x, y).ratio()
        Q[b['id']] = {'script': b['text'], 'heard': res[b['id']], 'ratio': round(r, 3)}
        if r < a.threshold:
            bad.append(b['id'])
            ops = [(op, ' '.join(x[i1:i2]), ' '.join(y[j1:j2])) for op, i1, i2, j1, j2 in
                   difflib.SequenceMatcher(None, x, y).get_opcodes() if op != 'equal']
            print(f"  {b['id']} ratio {r:.3f}: {ops[:5]}")
    json.dump(Q, open(qpath, 'w'), indent=1, ensure_ascii=False)
    print(f'round {rnd}: flagged', ','.join(bad) or 'none', f'({len(todo)} checked)', flush=True)
    if not bad or rnd == a.fix: break
    subprocess.run([sys.executable, os.path.join(os.path.dirname(__file__), 'tts.py'), EP, '--only', ','.join(bad), '--force'], check=True)
    only = set(bad)
