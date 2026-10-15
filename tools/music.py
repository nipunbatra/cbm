#!/usr/bin/env python3
"""music.py — a very light, original ambient bed under the narration, and the final mix.

  .venv/bin/python tools/music.py [--seed 7] [--level -33]
Reads src/timeline.json and narration/voice.wav. Writes narration/music.wav (the bed alone) and public/mix.wav (voice +
ducked music, normalised to -16 LUFS, true peak -1.5 dBTP), which the film plays.

Fully synthesised (no samples or loops, so nothing for Content ID to match): slow 7th-chord pads, a soft sub bass, sparse
bell tones and a quiet low-passed saw arpeggio pulse (84 bpm eighth notes), no drums. The bed ducks under speech (sidechain from the voice envelope), rises a little in
the pauses, and lifts on the title and end cards.
"""
import argparse, json, os, subprocess
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser(); ap.add_argument('--seed', type=int, default=7); ap.add_argument('--level', type=float, default=-33)
a = ap.parse_args()
SR = 48000
T = json.load(open(os.path.join(ROOT, 'src/timeline.json')))
D = T['duration']; N = int(D * SR); t = np.arange(N) / SR
rng = np.random.default_rng(a.seed)


def read_wav(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)


def write_wav(p, x):
    x = np.atleast_2d(x.T).T if x.ndim == 1 else x
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', str(x.shape[1]), '-i', '-', '-c:a', 'pcm_s24le', p],
                   input=x.astype(np.float32).tobytes(), check=True)


def lp(x, hz):  # one-pole low-pass, applied twice
    a1 = np.exp(-2 * np.pi * hz / SR)
    from scipy.signal import lfilter
    for _ in range(2): x = lfilter([1 - a1], [1, -a1], x)
    return x


midi = lambda n: 440.0 * 2 ** ((n - 69) / 12)
key = 50  # D
# I maj7, vi 7, IV maj7, V sus  (semitone offsets from the key, as chord tones)
CHORDS = [[0, 4, 7, 11], [-3, 0, 4, 7], [5, 9, 12, 16], [7, 12, 14, 19]]
bpm = 60.0; bar = 4 * 60 / bpm; seg = 2 * bar  # a chord every 8 s

pad = np.zeros(N); bass = np.zeros(N)
for i in range(int(D // seg) + 2):
    s0 = i * seg; ch = CHORDS[i % len(CHORDS)]
    i0, i1 = max(0, int((s0 - 1.5) * SR)), min(N, int((s0 + seg + 1.5) * SR))
    if i0 >= i1: continue
    tt = t[i0:i1]
    w = np.clip(np.minimum((tt - (s0 - 1.5)) / 3.0, ((s0 + seg + 1.5) - tt) / 3.0), 0, 1)  # 3 s crossfades
    w = np.sin(w * np.pi / 2) ** 2
    for k, n in enumerate(ch):
        f = midi(key + n)
        for det in (-0.08, 0.0, 0.07):
            ph = rng.uniform(0, 2 * np.pi)
            pad[i0:i1] += w * (np.sin(2 * np.pi * f * (1 + det / 100) * tt + ph) + 0.18 * np.sin(4 * np.pi * f * tt + ph)) / 14
    fb = midi(key + ch[0] - 24)
    bass[i0:i1] += w * np.sin(2 * np.pi * fb * tt) * 0.5
lfo = 0.75 + 0.25 * np.sin(2 * np.pi * t / 23.0)  # slow breathing
pad = lp(pad, 1500) * lfo
bass = lp(bass, 220)

# sparse bell tones: one every 2 beats with probability 0.45, notes from the current chord, an octave up
bell = np.zeros(N); bt = np.arange(int(3.5 * SR)) / SR
for i in range(int(D // 2)):
    if rng.random() > 0.45: continue
    s0 = i * 2.0 + rng.uniform(-0.03, 0.03); ch = CHORDS[int(s0 // seg) % len(CHORDS)]
    f = midi(key + 12 + ch[int(rng.integers(0, 4))])
    tone = (np.sin(2 * np.pi * f * bt) + 0.3 * np.sin(2 * np.pi * 2.01 * f * bt) * np.exp(-bt * 3)) * np.exp(-bt * 1.3) * np.minimum(bt / 0.008, 1)
    i0 = max(0, int(s0 * SR)); i1 = min(N, i0 + len(bt))
    if i0 < N: bell[i0:i1] += tone[:i1 - i0] * rng.uniform(0.6, 1.0)
bell = lp(bell, 3500)

# a soft electronic pulse: band-limited saw arpeggio of the current chord in eighth notes at 84 bpm, low-passed,
# with a slow filter sweep so it breathes rather than ticks
arp = np.zeros(N); step = 60 / 84 / 2; at = np.arange(int(0.5 * SR)) / SR
pattern = [0, 2, 1, 3, 2, 1, 3, 2]
for i in range(int(D // step)):
    s0 = i * step; ch = CHORDS[int(s0 // seg) % len(CHORDS)]
    f = midi(key + 12 + ch[pattern[i % 8]])
    saw = sum(np.sin(2 * np.pi * f * h * at) / h for h in range(1, 7))
    tone = saw * np.exp(-at * 7) * np.minimum(at / 0.012, 1) * (1.0 if i % 2 == 0 else 0.7)
    i0 = int(s0 * SR); i1 = min(N, i0 + len(at))
    if i0 < N: arp[i0:i1] += tone[:i1 - i0]
sweep = 0.55 + 0.45 * np.sin(2 * np.pi * t / 41.0 - 1.2)
arp = lp(arp, 900) * sweep

music = pad * 1.0 + bass * 0.55 + bell * 0.18 + arp * 0.10

# sections: lift on the title and end cards, gentle fades at both ends
sc = {s['id']: s for s in T['scenes']}
sect = np.ones(N)
for sid in ('s00', 'end'):
    s = sc[sid]; m = (t >= s['start']) & (t <= s['end']); sect[m] = 1.8
sect = lp(sect, 0.4)
fade = np.clip(t / 3.0, 0, 1) * np.clip((D - t) / 4.0, 0, 1)
music *= sect * fade

# sidechain ducking from the voice envelope
voice = read_wav(os.path.join(ROOT, 'narration/voice.wav'))[:N]
voice = np.pad(voice, (0, N - len(voice)))
hop = int(0.02 * SR)
rms = np.sqrt(np.convolve(voice ** 2, np.ones(hop) / hop, mode='same'))
speech = np.clip(rms / 0.03, 0, 1)
env = np.zeros(N); att, rel = np.exp(-1 / (0.08 * SR)), np.exp(-1 / (0.9 * SR))
# attack/release follower (vectorised in blocks for speed)
blk = 480; e = 0.0
for k in range(0, N, blk):
    v = speech[k:k + blk].max()
    c = att if v > e else rel
    e = v + (e - v) * c ** blk
    env[k:k + blk] = e
duck = 1 - 0.55 * env
music *= duck

# stereo: slight width from a short delay on the right
d = int(0.011 * SR)
right = np.concatenate([np.zeros(d), music[:-d]])
st = np.stack([music, 0.8 * music + 0.2 * right], axis=1)


def lufs(path):
    out = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'loudnorm=print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(json.loads(out[out.rindex('{'):out.rindex('}') + 1])['input_i'])


mpath = os.path.join(ROOT, 'narration/music.wav')
write_wav(mpath, st / (np.abs(st).max() + 1e-9) * 0.5)
gain = 10 ** ((a.level - lufs(mpath)) / 20)
st *= gain / (np.abs(st).max() + 1e-9) * 0.5
write_wav(mpath, st)
print('music bed', round(lufs(mpath), 1), 'LUFS')

# final mix: voice (already -16 LUFS in public/voice.wav) + bed, then normalise
vpath = os.path.join(ROOT, 'public/voice.wav')
import tempfile
mix_tmp = os.path.join(tempfile.gettempdir(), 'cbm_mix_raw.wav')  # TMPDIR may point at the SSD (internal disk is nearly full)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', vpath, '-i', mpath, '-filter_complex',
                '[0:a]aformat=channel_layouts=stereo[v];[v][1:a]amix=inputs=2:duration=first:normalize=0[m]', '-map', '[m]', '-ar', str(SR), mix_tmp], check=True)
J = subprocess.run(['ffmpeg', '-hide_banner', '-i', mix_tmp, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True).stderr
J = json.loads(J[J.rindex('{'):J.rindex('}') + 1])
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mix_tmp, '-af',
                f"loudnorm=I=-16:TP=-1.5:LRA=11:measured_I={J['input_i']}:measured_TP={J['input_tp']}:measured_LRA={J['input_lra']}:measured_thresh={J['input_thresh']}:offset={J['target_offset']}:linear=true",
                '-ar', str(SR), '-c:a', 'pcm_s16le', os.path.join(ROOT, 'public/mix.wav')], check=True)
os.remove(mix_tmp)
print('mix', round(lufs(os.path.join(ROOT, 'public/mix.wav')), 1), 'LUFS ->', 'public/mix.wav')
