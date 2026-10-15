"""Reproduce the lecture's real-image, class-specific saliency example.

Run: ~/base/bin/python worked/saliency.py
Uses a cached torchvision ResNet-50 V2 checkpoint, with no training/download.
Raw input gradients follow Simonyan et al. (2014): absolute gradient of a
pre-softmax class score, maximum across RGB at each input pixel.
"""
import hashlib
import json
from pathlib import Path

import numpy as np
import torch
import torchvision
from PIL import Image
from torchvision.models import ResNet50_Weights, resnet50
from torchvision.transforms import functional as TF

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/img/saliency'
OUT.mkdir(exist_ok=True)
checkpoint = Path(torch.hub.get_dir()) / 'checkpoints/resnet50-11ad3fa6.pth'
assert checkpoint.is_file(), f'Cached checkpoint required: {checkpoint}'
torch.set_num_threads(4)
weights = ResNet50_Weights.IMAGENET1K_V2
model = resnet50(weights=None).eval()
model.load_state_dict(torch.load(checkpoint, map_location='cpu', weights_only=True))
model.requires_grad_(False)
transform = weights.transforms()
source = ROOT / 'public/img/zebra_plains.jpg'
photo = Image.open(source).convert('RGB')
crop = TF.center_crop(TF.resize(photo, transform.resize_size,
                               interpolation=transform.interpolation), transform.crop_size)
crop.save(OUT / 'input.png')
rgb = TF.to_tensor(crop).unsqueeze(0).requires_grad_(True)
mean = torch.tensor(transform.mean)[None, :, None, None]
std = torch.tensor(transform.std)[None, :, None, None]
forward = lambda x: model((x - mean) / std)[0]
logits = forward(rgb)
probs = logits.softmax(0)
names = ['zebra', 'tiger']
indices = [weights.meta['categories'].index(name) for name in names]
grads = torch.stack([torch.autograd.grad(logits[i], rgb, retain_graph=True)[0][0]
                     for i in indices]).detach().numpy()
maps = np.abs(grads).max(axis=1)
percentile = 99
vmax = float(np.percentile(maps, percentile))
for name, saliency in zip(names, maps):
    # One linear greyscale for both classes; no smoothing or per-map rescaling.
    pixels = np.rint(np.clip(saliency / vmax, 0, 1) * 255).astype(np.uint8)
    Image.fromarray(pixels).save(OUT / f'{name}.png')

# One actual positive red-channel nudge, chosen by largest positive derivative
# among pixels where the nudge remains in range. No search over model outcomes.
eps = 0.001
eligible = rgb.detach().numpy()[0, 0] < 1 - eps
row, col = np.unravel_index(np.where(eligible, grads[0, 0], -np.inf).argmax(), eligible.shape)
nudged = rgb.detach().clone()
nudged[0, 0, row, col] += eps
with torch.no_grad():
    after = forward(nudged)
nudge = {'row': int(row), 'col': int(col), 'channel': 'red', 'epsilon': eps,
         'pixel_before': float(rgb[0, 0, row, col].detach()),
         'pixel_after': float(nudged[0, 0, row, col]),
         'score_before': float(logits[indices[0]].detach()),
         'score_after': float(after[indices[0]]),
         'derivative': float(grads[0, 0, row, col]),
         'selection': 'Largest positive red-channel derivative with room for the nudge.'}
nudge['score_change'] = nudge['score_after'] - nudge['score_before']
nudge['finite_difference'] = nudge['score_change'] / eps
assert abs(nudge['finite_difference'] / nudge['derivative'] - 1) < 0.02
archive = ROOT / 'worked/saliency_gradients.npz'
np.savez_compressed(archive, gradients=grads, logits=logits.detach().numpy(), rgb=rgb.detach().numpy()[0])
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
result = {
    'model': 'ResNet-50', 'model_full_name': 'Residual Network with 50 layers',
    'weights': 'ResNet50_Weights.IMAGENET1K_V2', 'checkpoint_sha256': sha(checkpoint),
    'torch': torch.__version__, 'torchvision': torchvision.__version__,
    'source_photo': str(source.relative_to(ROOT)), 'source_sha256': sha(source),
    'credit': 'Photo: Yathin S Krishnappa, Wikimedia Commons, CC BY-SA 3.0; centre crop',
    'method_source': 'https://arxiv.org/abs/1312.6034',
    'method': 'max over RGB of absolute raw class-logit derivative with respect to RGB in [0, 1]',
    'preprocess': {'resize_short_side': transform.resize_size[0], 'crop_size': transform.crop_size[0],
                   'mean': transform.mean, 'std': transform.std, 'interpolation': str(transform.interpolation)},
    'predicted_class': weights.meta['categories'][int(logits.argmax())],
    'classes': [{'name': name, 'index': i, 'logit': float(logits[i].detach()),
                 'probability': float(probs[i].detach()), 'map': f'saliency/{name}.png'}
                for name, i in zip(names, indices)],
    'display': {'shared_vmax': vmax, 'clip_percentile': percentile,
                'scale': 'linear greyscale, shared pooled percentile, no smoothing'},
    'nudge': nudge, 'archive_sha256': sha(archive),
    'image_sha256': {p.name: sha(p) for p in sorted(OUT.glob('*.png'))},
}
(ROOT / 'worked/saliency.json').write_text(json.dumps(result, indent=2) + '\n')
print(json.dumps({'classes': result['classes'], 'nudge': nudge}, indent=2))
