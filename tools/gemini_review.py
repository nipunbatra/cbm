#!/usr/bin/env python3
"""gemini_review.py — upload the rendered film to the Gemini File API and ask for a timestamped expert critique.
  python3 tools/gemini_review.py <video.mp4> <out.md>"""
import json, os, sys, time, urllib.request
KEY = os.environ['GEMINI_API_KEY']; video, out = sys.argv[1], sys.argv[2]
size = os.path.getsize(video)
req = urllib.request.Request(f'https://generativelanguage.googleapis.com/upload/v1beta/files?key={KEY}', method='POST',
    data=json.dumps({'file': {'display_name': 'cbm_film'}}).encode(),
    headers={'X-Goog-Upload-Protocol': 'resumable', 'X-Goog-Upload-Command': 'start', 'X-Goog-Upload-Header-Content-Length': str(size),
             'X-Goog-Upload-Header-Content-Type': 'video/mp4', 'Content-Type': 'application/json'})
up_url = urllib.request.urlopen(req).headers['X-Goog-Upload-URL']
f = json.load(urllib.request.urlopen(urllib.request.Request(up_url, data=open(video, 'rb').read(), method='POST',
    headers={'X-Goog-Upload-Offset': '0', 'X-Goog-Upload-Command': 'upload, finalize', 'Content-Length': str(size)}), timeout=1800))['file']
while f.get('state') == 'PROCESSING':
    time.sleep(10); f = json.load(urllib.request.urlopen(f"https://generativelanguage.googleapis.com/v1beta/{f['name']}?key={KEY}"))
print('uploaded', f['name'], f.get('state'))
prompt = open(os.path.join(os.path.dirname(__file__), 'gemini_review_prompt.md')).read()
body = {'contents': [{'parts': [{'fileData': {'mimeType': 'video/mp4', 'fileUri': f['uri']}}, {'text': prompt}]}],
        'generationConfig': {'temperature': 0.3, 'mediaResolution': 'MEDIA_RESOLUTION_HIGH'}}
r = json.load(urllib.request.urlopen(urllib.request.Request(
    f'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-pro-preview:generateContent?key={KEY}',
    data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'}), timeout=1800))
text = ''.join(p.get('text', '') for p in r['candidates'][0]['content']['parts'])
open(out, 'w').write(text); print('wrote', out, len(text), 'chars')
