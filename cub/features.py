"""features.py: frozen CLIP ViT-B/32 image features for all 11,788 CUB-200-2011 images (whole image, no crop),
plus CLIP text features for the 312 attribute phrases and 200 class names. Writes $CUB_DIR/clip_b32.npz.
  ~/base/bin/python cub/features.py
"""
import os, re, numpy as np, torch
from pathlib import Path
from PIL import Image
from transformers import CLIPModel, CLIPTokenizerFast, CLIPImageProcessor

CUB = Path(os.environ.get('CUB_DIR', '/Volumes/Extreme SSD/cbm-film/cub'))
ROOT = CUB / 'CUB_200_2011'
LOCAL = os.environ.get('CLIP_DIR', '/Volumes/Extreme SSD/cbm-film/clip-vit-base-patch32')
dev = 'mps' if torch.backends.mps.is_available() else 'cpu'
model = CLIPModel.from_pretrained(LOCAL).eval().to(dev)
tok = CLIPTokenizerFast.from_pretrained(LOCAL); improc = CLIPImageProcessor.from_pretrained(LOCAL)
feat = lambda o: o if torch.is_tensor(o) else o.pooler_output

paths = [l.split()[1] for l in open(ROOT / 'images.txt')]
classes = [re.sub(r'^\d+\.', '', l.split()[1]).replace('_', ' ') for l in open(ROOT / 'classes.txt')]
attrs = [l.split()[1] for l in open(CUB / 'attributes.txt')]

def phrase(a):  # has_wing_color::grey -> "a bird with grey wing color"
    part, val = a.split('::'); part = part.replace('has_', '').replace('_', ' ')
    return f'a photo of a bird with {val.replace("_", " ")} {part}'

@torch.no_grad()
def text(ps):
    out = []
    for i in range(0, len(ps), 256):
        t = tok(ps[i:i + 256], padding=True, return_tensors='pt').to(dev)
        out.append(feat(model.get_text_features(**t)).float().cpu())
    return torch.cat(out).numpy()

X = []
with torch.no_grad():
    for i in range(0, len(paths), 64):
        ims = [Image.open(ROOT / 'images' / p).convert('RGB') for p in paths[i:i + 64]]
        px = improc(images=ims, return_tensors='pt')['pixel_values'].to(dev)
        X.append(feat(model.get_image_features(pixel_values=px)).float().cpu().numpy())
        if i % 1280 == 0: print(i, flush=True)
X = np.concatenate(X)
T_attr = text([phrase(a) for a in attrs]); T_cls = text([f'a photo of a {c}, a type of bird.' for c in classes])
np.savez(CUB / 'clip_b32.npz', X=X, T_attr=T_attr, T_cls=T_cls, logit_scale=model.logit_scale.exp().item())
print('saved', X.shape, T_attr.shape, T_cls.shape)
