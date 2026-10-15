#!/usr/bin/env python3
"""llm_concepts.py: real language-model concept proposals for the Part 10 worked examples.

Two prompt styles, one per method, for the classes zebra / horse / giraffe:
  * Label-free CBM (Oikarinen et al. 2023) asks GPT-3 three questions per class: important features, things commonly
    seen around it, superclasses. We ask the same three questions.
  * LaBo (Yang et al. 2023) asks the LLM for sentences describing what the class looks like.
We use Gemini (not GPT-3) with temperature 0 and a JSON response. The raw replies are saved verbatim in
worked/llm_concepts.json together with the model name and date, so the film and the slides can show them exactly.
  source ~/.zsh_secrets; python3 worked/llm_concepts.py
"""
import datetime, json, os, urllib.request
from pathlib import Path

KEY = os.environ['GEMINI_API_KEY']
MODEL = os.environ.get('LLM_MODEL', 'gemini-3.1-pro-preview')
CLASSES = ['zebra', 'horse', 'giraffe']
LF_PROMPTS = {
    'features': 'List the most important features for recognizing something as a "{c}".',
    'around': 'List the things most commonly seen around a "{c}".',
    'superclasses': 'Give superclasses for the word "{c}".',
}
LABO_PROMPT = 'Describe what a {c} looks like in a photograph, as 8 short visual sentences that would help tell it apart from similar animals.'
SCHEMA = {'type': 'OBJECT', 'properties': {'items': {'type': 'ARRAY', 'items': {'type': 'STRING'}}}, 'required': ['items']}


def ask(prompt):
    body = {'contents': [{'parts': [{'text': prompt + ' Answer with short phrases only, at most 8 items.'}]}],
            'generationConfig': {'temperature': 0, 'responseMimeType': 'application/json', 'responseSchema': SCHEMA}}
    r = json.load(urllib.request.urlopen(urllib.request.Request(
        f'https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent?key={KEY}',
        data=json.dumps(body).encode(), headers={'Content-Type': 'application/json'}), timeout=300))
    text = ''.join(p.get('text', '') for p in r['candidates'][0]['content']['parts'])
    return text, json.loads(text)['items']


out = {'model': MODEL, 'date': datetime.date.today().isoformat(), 'temperature': 0, 'label_free': {}, 'labo': {}}
for c in CLASSES:
    out['label_free'][c] = {}
    for k, p in LF_PROMPTS.items():
        raw, items = ask(p.format(c=c))
        out['label_free'][c][k] = {'prompt': p.format(c=c), 'raw': raw, 'items': items}
    raw, items = ask(LABO_PROMPT.format(c=c))
    out['labo'][c] = {'prompt': LABO_PROMPT.format(c=c), 'raw': raw, 'items': items}
json.dump(out, open(Path(__file__).with_name('llm_concepts.json'), 'w'), indent=1, ensure_ascii=False)
for c in CLASSES:
    print(c, '| LF features:', out['label_free'][c]['features']['items'])
    print(c, '| LaBo:', out['labo'][c]['items'][:4])
