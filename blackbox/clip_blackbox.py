#!/usr/bin/env python3
"""clip_blackbox.py: the film's Act 1 black box is a real model run, not an authored overlay.

CLIP ViT-B/32 (openai/clip-vit-base-patch32) zero-shot classifies the gull photograph among six gull species, and an
occlusion-sensitivity map shows which regions the top score depends on: a grey patch slides over the image and we record
how much the top species' log-probability drops. Writes blackbox/clip_outputs.json.
  ~/base/bin/python blackbox/clip_blackbox.py
"""
import json, hashlib
from pathlib import Path
import numpy as np, torch
from PIL import Image
from transformers import CLIPModel, CLIPTokenizerFast, CLIPImageProcessor

ROOT = Path(__file__).resolve().parents[1]
IMG = ROOT / 'public/img/gull.jpg'
MODEL = 'openai/clip-vit-base-patch32'  # loaded from the local HF cache (see LOCAL)
import os
LOCAL = os.environ.get('CLIP_DIR', '/Volumes/Extreme SSD/cbm-film/clip-vit-base-patch32')  # symlinks: config snapshot 3d74acf + weights snapshot c237dc4
SPECIES = ['American herring gull', 'glaucous-winged gull', 'ring-billed gull', 'great black-backed gull', 'laughing gull', 'glaucous gull']
TEMPLATE = 'a photo of a {}, a type of bird.'
GRID, PATCH = 14, 0.16  # occlusion: 14 x 14 centres, square patch of side 0.16 of the image

torch.manual_seed(0)
model = CLIPModel.from_pretrained(LOCAL).eval(); tok = CLIPTokenizerFast.from_pretrained(LOCAL); improc = CLIPImageProcessor.from_pretrained(LOCAL)
im = Image.open(IMG).convert('RGB')
# transformers 5 returns a model output whose pooler_output holds the projected (512-d) embedding
feat = lambda o: o if torch.is_tensor(o) else o.pooler_output
with torch.no_grad():
    tx = tok([TEMPLATE.format(s) for s in SPECIES], return_tensors='pt', padding=True)
    T = feat(model.get_text_features(**tx)); T = T / T.norm(dim=-1, keepdim=True)
    def logp(imgs):
        px = improc(images=imgs, return_tensors='pt')['pixel_values']
        V = feat(model.get_image_features(pixel_values=px)); V = V / V.norm(dim=-1, keepdim=True)
        return torch.log_softmax(model.logit_scale.exp() * V @ T.T, -1)
    base = logp([im])[0]
probs = base.exp().numpy(); top = int(probs.argmax())
# occlusion sensitivity: replace a square patch with the mean grey and measure the drop in the top class log-probability
W, H = im.size; arr = np.asarray(im).copy(); grey = arr.reshape(-1, 3).mean(0).astype(np.uint8)
side = int(PATCH * W); centres = (np.arange(GRID) + 0.5) / GRID
heat = np.zeros((GRID, GRID)); batch, idx = [], []
for r, cy in enumerate(centres):
    for c, cx in enumerate(centres):
        a = arr.copy(); x0, y0 = int(cx * W - side / 2), int(cy * H - side / 2)
        a[max(0, y0):y0 + side, max(0, x0):x0 + side] = grey
        batch.append(Image.fromarray(a)); idx.append((r, c))
with torch.no_grad():
    for k in range(0, len(batch), 28):
        lp = logp(batch[k:k + 28])[:, top]
        for (r, c), v in zip(idx[k:k + 28], lp.numpy()): heat[r, c] = base[top].item() - v
out = {'model': MODEL, 'image': 'public/img/gull.jpg', 'image_sha256': hashlib.sha256(IMG.read_bytes()).hexdigest(),
       'template': TEMPLATE, 'species': SPECIES, 'probs': [round(float(p), 4) for p in probs], 'top': top,
       'occlusion': {'grid': GRID, 'patch_frac': PATCH, 'fill': 'image mean colour',
                     'drop_logprob': [[round(float(v), 4) for v in row] for row in heat],
                     'note': 'drop in log p(top species) when a patch centred on the cell is greyed out; larger = the score depends more on that region'},
       'torch': torch.__version__}
json.dump(out, open(ROOT / 'blackbox/clip_outputs.json', 'w'), indent=1)
print({s: round(float(p), 3) for s, p in zip(SPECIES, probs)})
print('max drop', heat.max().round(3), 'at', np.unravel_index(heat.argmax(), heat.shape))
