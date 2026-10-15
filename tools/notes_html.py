#!/usr/bin/env python3
"""notes_html.py: the lecture notes page (deck/notes.html) from the same content as the slides and the film:
every section, every slide heading and its narration, with links that open the deck at that slide.
  ~/base/bin/python tools/notes_html.py
"""
import html, json, re
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
S = json.load(open(ROOT / 'narration/script.json'))
SYM = [(r'\cvec', 'ĉ'), (r'\ch', 'ĉ'), (r'\yh', 'ŷ'), (r'\gth', 'g<sub>θ</sub>'), (r'\fph', 'f<sub>φ</sub>'), (r'\lambda', 'λ'),
       (r'\mathbf', ''), (r'\theta', 'θ'), (r'\phi', 'φ'), (r'\in', '∈'), (r'\to', '→'), (r'\cdot', '·')]
ROLE = {'x': '#5B9BFF', 'c': '#2DD4BF', 'f': '#9AA6B5', 'e': '#F5B342', 'l': '#FF7F6B', 'k': '#B98CFF', 'y': '#EEF1F4', 'm': '#7A8696'}


def rich(h):
    def tex(m):
        t = re.sub(r'\\c(?:in|con|head|edit|loss|leak|mu|bad|out)\{([^}]*)\}', r'\1', m.group(1))
        for a, b in SYM: t = re.sub(re.escape(a) + r'(?![A-Za-z])', b, t)
        return '<i>' + t.replace('{', '').replace('}', '').replace('\\', '') + '</i>'
    h = html.escape(h, quote=False)
    h = re.sub(r'\$([^$]+)\$', tex, h)
    return re.sub(r'\{([xcfelkym]):([^}]*)\}', lambda m: f'<span style="color:{ROLE[m.group(1)]}">{m.group(2)}</span>', h)


body = []
for i, sc in enumerate(S['scenes']):
    if sc['id'] in ('s00', 'end'): continue
    items = ''.join(
        f'<li><a href="index.html#{sc["id"]}.{k}" title="open this slide">{rich(b["head"]) if b.get("head") else ""}</a>'
        f'<p>{html.escape(b["text"])}</p></li>' for k, b in enumerate(sc['beats'], 1))
    body.append(f'<section id="{sc["id"]}"><h2>{html.escape(sc["title"])}</h2><ol>{items}</ol></section>')
toc = ''.join(f'<li><a href="#{sc["id"]}">{html.escape(sc["title"])}</a></li>' for sc in S['scenes'] if sc['id'] not in ('s00', 'end'))
page = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Concept Bottleneck Models: lecture notes</title>
<link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>
:root{{--bg:#0E1318;--panel:#151C24;--ink:#EEF1F4;--ink2:#B4BEC9;--mute:#7A8696;--line:#2B3542;--teal:#2DD4BF}}
body{{margin:0;background:var(--bg);color:var(--ink);font:17px/1.6 "Avenir Next","Nunito Sans",system-ui,sans-serif}}
main{{max-width:860px;margin:0 auto;padding:32px 16px 80px}} h1{{font-size:30px;margin:0 0 4px}} .sub{{color:var(--ink2);margin:0 0 20px}}
nav{{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 18px;margin:18px 0 28px}} nav ol{{columns:2;margin:0;padding-left:20px}}
nav a,.links a{{color:var(--teal);text-decoration:none}} h2{{font-size:22px;border-top:1px solid var(--line);padding-top:22px;margin-top:34px}}
li{{margin:0 0 12px}} li>a{{color:var(--ink);font-weight:650;text-decoration:none}} li>a:hover{{text-decoration:underline}} li p{{margin:2px 0 0;color:var(--ink2)}}
.links{{display:flex;gap:18px;flex-wrap:wrap}} @media(max-width:640px){{nav ol{{columns:1}}}}
</style></head><body><main>
<h1>Concept Bottleneck Models</h1><p class="sub">Lecture notes: every slide heading with its narration. Click a heading to open that slide.</p>
<p class="links"><a href="index.html">Open the slides</a><a href="concept-bottleneck-models.pdf">PDF</a></p>
<nav><ol>{toc}</ol></nav>{''.join(body)}
</main></body></html>'''
(ROOT / 'deck' / 'notes.html').write_text(page)
print('wrote deck/notes.html', sum(len(s['beats']) for s in S['scenes']), 'slides')
