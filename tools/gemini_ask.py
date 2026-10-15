#!/usr/bin/env python3
"""gemini_ask.py — ask Gemini (with Google Search grounding) a question from a file; write the answer.
  python3 tools/gemini_ask.py prompt.md out.md [--model gemini-3.1-pro-preview] [--files a.txt b.txt]"""
import argparse, json, os, urllib.request
ap = argparse.ArgumentParser(); ap.add_argument('prompt'); ap.add_argument('out'); ap.add_argument('--model', default='gemini-3.1-pro-preview')
ap.add_argument('--files', nargs='*', default=[]); ap.add_argument('--nosearch', action='store_true')
a = ap.parse_args()
text = open(a.prompt).read() + ''.join(f'\n\n=== FILE {f} ===\n' + open(f).read() for f in a.files)
body = {'contents': [{'parts': [{'text': text}]}], 'generationConfig': {'temperature': 0.2}}
if not a.nosearch: body['tools'] = [{'google_search': {}}]
r = json.load(urllib.request.urlopen(urllib.request.Request(
    f"https://generativelanguage.googleapis.com/v1beta/models/{a.model}:generateContent?key={os.environ['GEMINI_API_KEY']}",
    data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'}), timeout=1800))
out = ''.join(p.get('text', '') for p in r['candidates'][0]['content']['parts'])
open(a.out, 'w').write(out); print('wrote', a.out, len(out), 'chars')
