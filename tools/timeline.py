#!/usr/bin/env python3
"""timeline.py — place the narration clips on the film clock.

  python3 tools/timeline.py episodes/ep01 [--tempo 1.04] [--maxpause 0.55]

Each clip in narration/seg is trimmed (leading/trailing silence), long internal pauses are shortened,
an optional tempo factor is applied (ffmpeg atempo), and the clips are laid end to end with the
scene leads, beat gaps and holds from script.json. Writes
  <episode>/narration/voice.wav       48 kHz mono voice track
  <episode>/narration/timeline.json   scenes and beats with start/end seconds (frame-quantised)
  src/<ep>/timeline.json              the same, imported by the Remotion composition
  public/<ep>/voice.wav               for preview in Remotion Studio
"""
import argparse, json, os, shutil, subprocess, tempfile, wave
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('episode'); ap.add_argument('--tempo', type=float, default=1.0)
ap.add_argument('--maxpause', type=float, default=0.55); ap.add_argument('--fps', type=int, default=30)
a = ap.parse_args()
EP = os.path.abspath(a.episode)  # the project root (narration/ lives here)
S = json.load(open(os.path.join(EP, 'narration/script.json')))
SR = 24000


def read(path):
    with wave.open(path) as w:
        assert w.getframerate() == SR and w.getnchannels() == 1
        return np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768


def tidy(x):
    hop = int(.01 * SR)
    n = len(x) // hop
    db = 20 * np.log10(np.sqrt((x[:n * hop].reshape(n, hop) ** 2).mean(1)) + 1e-9)
    on = np.where(db > -42)[0]
    if not len(on): return x
    a0, a1 = max(0, on[0] * hop - int(.03 * SR)), min(len(x), (on[-1] + 1) * hop + int(.09 * SR))
    x, db = x[a0:a1], db[on[0]:on[-1] + 1]
    # shorten internal pauses longer than maxpause
    quiet = db < -42; out, i, base = [], 0, on[0] * hop - a0
    segs, run = [], None
    for k, q in enumerate(quiet):
        if q and run is None: run = k
        if not q and run is not None: segs.append((run, k)); run = None
    keep = np.ones(len(x), bool); mp = int(a.maxpause * 100)
    for s0, s1 in segs:
        if s1 - s0 > mp:
            c = (s0 + s1) // 2; cut = (s1 - s0 - mp) // 2
            keep[base + (c - cut) * hop: base + (c + cut) * hop] = False
    return x[keep]


def tempo(x):
    if abs(a.tempo - 1) < 1e-3: return x
    with tempfile.TemporaryDirectory() as d:
        i, o = os.path.join(d, 'i.wav'), os.path.join(d, 'o.wav')
        write(i, x, SR)
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', i, '-af', f'atempo={a.tempo}', '-ar', str(SR), o], check=True)
        return read(o)


def words_estimate(text, t0, t1):
    """word timings spread over the clip by character weight, with extra weight at punctuation.
    Replaced by real alignments when tools/align.py has run (narration/words.json)."""
    import re
    toks = text.split()
    wts = [len(re.sub(r'[^A-Za-z0-9]', '', w)) + 1.5 + (4 if w[-1] in '.:;?!' else 2 if w[-1] == ',' else 0) for w in toks]
    tot = sum(wts); out, acc = [], 0.0
    for w, k in zip(toks, wts):
        a0 = t0 + (t1 - t0) * acc / tot
        a1 = t0 + (t1 - t0) * (acc + k - (4 if w[-1] in '.:;?!' else 2 if w[-1] == ',' else 0)) / tot
        out.append({'w': w, 's': round(a0, 3), 'e': round(a1, 3)}); acc += k
    return out


def write(path, x, sr):
    with wave.open(path, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes((np.clip(x, -1, 1) * 32767).astype(np.int16).tobytes())


q = lambda t: round(t * a.fps) / a.fps
# word alignments relative to each trimmed, tempo-adjusted clip (written by tools/align.py)
_ap = os.path.join(EP, 'narration/words.json')
ALIGN = json.load(open(_ap)) if os.path.exists(_ap) else {}
t, scenes, clips = 0.0, [], []
for sc in S['scenes']:
    s = {'id': sc['id'], 'title': sc['title'], 'start': q(t), 'beats': []}
    t = q(t) + sc.get('lead', 0)
    for b in sc['beats']:
        x = tempo(tidy(read(os.path.join(EP, f"narration/seg/{b['id']}.wav"))))
        d = len(x) / SR
        lead_in = (len(x) - len(np.trim_zeros(np.where(np.abs(x) > 0.02, x, 0), 'f'))) / SR
        s['beats'].append({'id': b['id'], 'start': round(t, 3), 'end': round(t + d, 3),
                           'text': b['text'], 'caption': b.get('caption', b['text']), **({'head': b['head']} if b.get('head') else {}),
                           'words': ALIGN.get(b['id']) and [{'w': w['w'], 's': round(t + w['s'], 3), 'e': round(t + w['e'], 3)} for w in ALIGN[b['id']]]
                                    or words_estimate(b['text'], t + lead_in, t + d - 0.08)})
        clips.append((t, x)); t += d + b['gap'] / a.tempo
    t += sc.get('hold', 0)
    s['end'] = q(t); t = s['end']
    s['dur'] = round(s['end'] - s['start'], 3)
    scenes.append(s)
total = q(t)
voice = np.zeros(int(total * SR) + SR)
for t0, x in clips:
    i = int(round(t0 * SR)); voice[i:i + len(x)] += x
voice = voice[:int(total * SR)]
tmp = os.path.join(tempfile.gettempdir(), 'cbm_voice24.wav'); write(tmp, voice, SR)  # TMPDIR may point at the SSD
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', tmp, '-af', 'aresample=48000:filter_size=64:cutoff=0.97', '-c:a', 'pcm_s16le',
                os.path.join(EP, 'narration/voice.wav')], check=True)
os.remove(tmp)
T = {'fps': a.fps, 'duration': total, 'tempo': a.tempo, 'scenes': scenes}
json.dump(T, open(os.path.join(EP, 'narration/timeline.json'), 'w'), indent=1, ensure_ascii=False)
json.dump(T, open(os.path.join(EP, 'src', 'timeline.json'), 'w'), indent=1, ensure_ascii=False)
os.makedirs(os.path.join(EP, 'public'), exist_ok=True)
shutil.copy(os.path.join(EP, 'narration/voice.wav'), os.path.join(EP, 'public', 'voice.wav'))
speech = sum(b['end'] - b['start'] for s in scenes for b in s['beats'])
print(f'duration {total:.2f}s ({int(total // 60)}:{total % 60:05.2f})  speech {speech:.1f}s  tempo {a.tempo}')
for s in scenes: print(f"  {s['id']:6s} {s['start']:7.2f} – {s['end']:7.2f}  ({s['dur']:5.2f})  {s['title']}")
