#!/usr/bin/env python3
"""tts.py — narration with Gemini TTS.

Each beat of <episode>/narration/script.json becomes <episode>/narration/seg/<id>.wav (24 kHz mono, 16-bit),
and <episode>/narration/durations.json records its length. Existing clips are kept unless --force.

  python3 tools/tts.py episodes/ep01                       # all missing beats
  python3 tools/tts.py episodes/ep01 --only 3.2,4.1 --force
  python3 tools/tts.py episodes/ep01 --test "Some text" out.wav --voice Charon

Needs GEMINI_API_KEY (source ~/.zsh_secrets).
"""
import argparse, base64, concurrent.futures as cf, json, os, struct, sys, time, urllib.request, wave

ap = argparse.ArgumentParser()
ap.add_argument('episode')
ap.add_argument('--voice')
ap.add_argument('--model')
ap.add_argument('--only', default='')
ap.add_argument('--force', action='store_true')
ap.add_argument('--test', nargs=2, metavar=('TEXT', 'OUT'))
ap.add_argument('--jobs', type=int, default=4)
a = ap.parse_args()

KEY = os.environ['GEMINI_API_KEY']
EP = os.path.abspath(a.episode)
S = json.load(open(os.path.join(EP, 'narration/script.json')))
VOICE = a.voice or S['voice']
MODEL = a.model or S['model']


def speak(text, out, tags=None):
    body = {'contents': [{'parts': [{'text': f"{tags or S['tags']} {text}"}]}],
            'generationConfig': {'responseModalities': ['AUDIO'],
                                 'speechConfig': {'voiceConfig': {'prebuiltVoiceConfig': {'voiceName': VOICE}}}}}
    url = f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}'
    for attempt in range(6):
        try:
            req = urllib.request.Request(url, data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'})
            r = json.load(urllib.request.urlopen(req, timeout=300))
            part = r['candidates'][0]['content']['parts'][0]['inlineData']
            pcm, rate = base64.b64decode(part['data']), 24000
            if pcm[:4] == b'RIFF':  # a whole WAV file: keep only its samples
                pos = 12
                while pos + 8 <= len(pcm):
                    cid, size = pcm[pos:pos + 4], struct.unpack('<I', pcm[pos + 4:pos + 8])[0]
                    if cid == b'fmt ': rate = struct.unpack('<I', pcm[pos + 12:pos + 16])[0]
                    if cid == b'data': pcm = pcm[pos + 8:pos + 8 + size]; break
                    pos += 8 + size + (size & 1)
            mt = part.get('mimeType', '')
            if 'rate=' in mt: rate = int(mt.split('rate=')[1].split(';')[0])
            with wave.open(out, 'wb') as w:
                w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate); w.writeframes(pcm)
            return len(pcm) / 2 / rate
        except Exception as e:
            print(f'  retry {attempt + 1} ({os.path.basename(out)}): {e}', file=sys.stderr); time.sleep(5 * (attempt + 1))
    raise SystemExit(f'failed: {out}')


if a.test:
    print(round(speak(a.test[0], a.test[1]), 2)); sys.exit()

os.makedirs(os.path.join(EP, 'narration/seg'), exist_ok=True)
only = set(x for x in a.only.split(',') if x)
dpath = os.path.join(EP, 'narration/durations.json')
tpath = os.path.join(EP, 'narration/seg_texts.json')
SEEN = json.load(open(tpath)) if os.path.exists(tpath) else {}
D = json.load(open(dpath)) if os.path.exists(dpath) else {}
todo = []
for sc in S['scenes']:
    for b in sc['beats']:
        if only and b['id'] not in only: continue
        out = os.path.join(EP, f"narration/seg/{b['id']}.wav")
        # regenerate when the beat's text, voice direction, voice or model changed since its clip was made (narration/seg_texts.json)
        same = SEEN.get(b['id']) == [b['text'], b.get('tags', S['tags']), VOICE, MODEL]
        if os.path.exists(out) and not a.force and b['id'] in D and same: continue
        todo.append((b, out))
with cf.ThreadPoolExecutor(a.jobs) as ex:
    for (b, out), d in zip(todo, ex.map(lambda t: speak(t[0]['text'], t[1], t[0].get('tags')), todo)):
        D[b['id']] = round(d, 3); SEEN[b['id']] = [b['text'], b.get('tags', S['tags']), VOICE, MODEL]; print(b['id'], D[b['id']], flush=True)
json.dump(dict(sorted(D.items(), key=lambda kv: [int(x) for x in kv[0].split('.')])), open(dpath, 'w'), indent=1)
print('total speech', round(sum(D.values()), 1), 's')
json.dump(SEEN, open(tpath, 'w'), indent=1, ensure_ascii=False)
