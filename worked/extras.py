"""extras.py: a few more real values for the Part 10 slides, from the same CLIP ViT-B/32 run as worked/compute.py.
  - e(x) of the worked zebra photo: the first entries and the last entry of its normalised 512-d CLIP image feature
  - the LF-CBM step-3 targets (CLIP image-concept similarity) for the worked zebra and the first horse and giraffe of
    the test split, for every final label-free concept
Writes worked/extras.json (read by math/data.py into D.worked.extras).
  ~/base/bin/python worked/extras.py
"""
import json, os
from pathlib import Path
import numpy as np, torch
from PIL import Image
from transformers import CLIPModel, CLIPTokenizerFast, CLIPImageProcessor

HERE = Path(__file__).resolve().parent
CLIP_DIR = os.environ.get('CLIP_DIR', '/Volumes/Extreme SSD/cbm-film/clip-vit-base-patch32')
clip = CLIPModel.from_pretrained(CLIP_DIR).eval(); tok = CLIPTokenizerFast.from_pretrained(CLIP_DIR); improc = CLIPImageProcessor.from_pretrained(CLIP_DIR)
feat = lambda o: o if torch.is_tensor(o) else o.pooler_output
W = json.load(open(HERE / 'worked_examples.json'))


@torch.no_grad()
def img(f):
    v = feat(clip.get_image_features(pixel_values=improc(images=[Image.open(HERE / 'photos' / f).convert('RGB')], return_tensors='pt')['pixel_values']))
    return torch.nn.functional.normalize(v, dim=-1).numpy()[0]


@torch.no_grad()
def txt(t):
    v = feat(clip.get_text_features(**tok(t, return_tensors='pt', padding=True)))
    return torch.nn.functional.normalize(v, dim=-1).numpy()


ex = W['example']
e = img(ex)
test = W['test']
pick = {'zebra': ex, 'horse': next(f for f in test if f.startswith('horse')), 'giraffe': next(f for f in test if f.startswith('giraffe'))}
final = W['lfcbm']['final']
T = txt(final)
rows = {c: [round(float(v), 4) for v in T @ img(f)] for c, f in pick.items()}
out = {'example_feature_first': [round(float(v), 4) for v in e[:4]], 'example_feature_last': round(float(e[-1]), 4),
       'feature_dim': int(len(e)), 'lf_targets': {'concepts': final, 'photos': pick, 'rows': rows}}
assert abs(rows['zebra'][0] - W['lfcbm']['example_clip_target'][0]) < 2e-3, 'must reproduce compute.py'
json.dump(out, open(HERE / 'extras.json', 'w'), indent=1)
print(json.dumps(out)[:600])
