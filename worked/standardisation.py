"""Reproduce raw PCBM concept scores for a multi-image standardisation example.

Frozen inference only. Uses the original split, images, phrase bank and cached CLIP
checkpoint. No head is trained and existing worked results are never overwritten.
Run: HF_HUB_OFFLINE=1 ~/base/bin/python worked/standardisation.py
"""
import hashlib, json, os
from pathlib import Path
import numpy as np
import torch
from PIL import Image
from transformers import CLIPModel, CLIPTokenizerFast, CLIPImageProcessor

HERE = Path(__file__).resolve().parent
MODEL = Path(os.environ.get('CLIP_DIR', '/Volumes/Extreme SSD/cbm-film/clip-vit-base-patch32'))
W = json.loads((HERE / 'worked_examples.json').read_text())
PC = W['pcbm']
photos = [next(f for f in W['test'] if f.startswith(c)) for c in W['classes']]
files = W['train'] + photos
model = CLIPModel.from_pretrained(MODEL, local_files_only=True).eval()
tokenizer = CLIPTokenizerFast.from_pretrained(MODEL, local_files_only=True)
processor = CLIPImageProcessor.from_pretrained(MODEL, local_files_only=True)
feat = lambda v: v if torch.is_tensor(v) else v.pooler_output
with torch.inference_mode():
    images = [Image.open(HERE / 'photos' / f).convert('RGB') for f in files]
    image_vectors = feat(model.get_image_features(**processor(images=images,return_tensors='pt')))
    text_vectors = feat(model.get_text_features(**tokenizer(PC['bank'],padding=True,return_tensors='pt')))
    image_vectors = torch.nn.functional.normalize(image_vectors,dim=-1)
    text_vectors = torch.nn.functional.normalize(text_vectors,dim=-1)
    scores = (image_vectors @ text_vectors.T).numpy()
train = scores[:W['n_train']]
raw = scores[W['n_train']:]
mu, sd = train.mean(0), train.std(0) + 1e-6
z = (raw - mu) / sd
assert np.allclose(mu,PC['mean'],atol=5.1e-5)
assert np.allclose(sd,PC['std'],atol=5.1e-5)
assert np.allclose(raw[0],PC['scores_raw_example'],atol=5.1e-5)
assert np.allclose(z[0],PC['z_example'],atol=8e-5)
out = {
    'model':'openai/clip-vit-base-patch32',
    'model_sha256':hashlib.sha256((MODEL/'model.safetensors').read_bytes()).hexdigest(),
    'photo_sha256':{f:hashlib.sha256((HERE/'photos'/f).read_bytes()).hexdigest() for f in files},
    'note':'Frozen inference using original training split and exact phrases; no head retraining.',
    'bank':PC['bank'],'train_files':W['train'],'photos':photos,'classes':W['classes'],
    'shown_concept_indices':[0,1,2], 'epsilon':1e-6,
    'train_raw':train.tolist(),'raw':raw.tolist(),
}
(HERE/'standardisation.json').write_text(json.dumps(out,indent=1)+'\n')
print('Raw scores:\n',raw[:,:3])
print('Standardised:\n',z[:,:3])
print('Reproduced original zebra scores and training statistics.')
