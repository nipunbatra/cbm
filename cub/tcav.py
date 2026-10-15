"""tcav.py: a real TCAV run (Kim et al. 2018) on CUB with CLIP ViT-B/32, for the post-hoc slides of Part 1.
Question: does CLIP's zero-shot "herring gull" score use the concept "grey wings"?
  activations h(x): the 512-d CLIP image feature (before normalisation)
  class score:      s_k(h) = scale * <h/|h|, t_k>, t_k = text embedding of "a photo of a Herring Gull, a type of bird."
  CAV v:            unit normal of a logistic regression separating concept photos (wing colour grey, labelled definitely
                    or probably) from random photos without it
  TCAV score:       fraction of herring gull photos whose score rises along v: grad_h s_k . v > 0
  baseline:         the same score for CAVs trained on random splits (no concept), repeated
Writes cub/tcav.json (read by math/data.py into D.cub.tcav).  ~/base/bin/python cub/tcav.py
"""
import json, os, re, numpy as np
from pathlib import Path
from sklearn.linear_model import LogisticRegression
rng = np.random.default_rng(0)
CUB = Path(os.environ.get('CUB_DIR', '/Volumes/Extreme SSD/cbm-film/cub')); ROOT = CUB / 'CUB_200_2011'; HERE = Path(__file__).resolve().parent
Z = np.load(CUB / 'clip_b32.npz'); X = Z['X']; scale = float(Z['logit_scale'])
y = np.array([int(l.split()[1]) - 1 for l in open(ROOT / 'image_class_labels.txt')])
classes = [re.sub(r'^\d+\.', '', l.split()[1]).replace('_', ' ') for l in open(ROOT / 'classes.txt')]
attrs = [l.split()[1] for l in open(CUB / 'attributes.txt')]
N = len(X); A = np.zeros((N, 312), np.int8); Ce = np.zeros((N, 312), np.int8)
for l in open(ROOT / 'attributes' / 'image_attribute_labels.txt'):
    p = l.split(); i, a = int(p[0]) - 1, int(p[1]) - 1; A[i, a] = int(p[2]); Ce[i, a] = int(p[3])
k = [i for i, c in enumerate(classes) if c.lower() == 'herring gull'][0]
T = Z['T_cls']; t = T[k] / np.linalg.norm(T[k])


def grad(h):  # d/dh of scale * <h/|h|, t>
    n = np.linalg.norm(h, axis=1, keepdims=True)
    return scale * (t[None] / n - (h @ t)[:, None] * h / n ** 3)


def cav(pos, neg):
    Xs = np.concatenate([X[pos], X[neg]]); ys = np.r_[np.ones(len(pos)), np.zeros(len(neg))]
    clf = LogisticRegression(max_iter=2000, C=1.0).fit(Xs, ys)
    v = clf.coef_[0]; return v / np.linalg.norm(v), clf.score(Xs, ys)


def tcav(v, idx):
    return float(np.mean(grad(X[idx]) @ v > 0))


gulls = np.where(y == k)[0]
not_gull = y != k
out = {'class': classes[k], 'n_class_images': int(len(gulls)), 'scale': round(scale, 2), 'n_repeats': 10, 'n_per_set': 150}
for name in ['has_wing_color::grey', 'has_wing_color::yellow']:
    j = attrs.index(name)
    pos_all = np.where(not_gull & (A[:, j] == 1) & (Ce[:, j] >= 3))[0]
    neg_all = np.where(not_gull & (A[:, j] == 0) & (Ce[:, j] >= 3))[0]
    scores, accs = [], []
    for r in range(10):  # repeat with different concept / random sets, as Kim et al. do
        pos = rng.choice(pos_all, 150, replace=False); neg = rng.choice(neg_all, 150, replace=False)
        v, acc = cav(pos, neg); scores.append(tcav(v, gulls)); accs.append(acc)
    out[name] = {'n_concept_pool': int(len(pos_all)), 'tcav_runs': [round(s, 3) for s in scores],
                 'tcav_mean': round(float(np.mean(scores)), 3), 'cav_train_acc': round(float(np.mean(accs)), 3)}
# random directions: CAVs separating two random photo sets
rand = []
for r in range(10):
    a_, b_ = rng.choice(np.where(not_gull)[0], 300, replace=False).reshape(2, 150)
    v, _ = cav(a_, b_); rand.append(tcav(v, gulls))
out['random'] = {'tcav_runs': [round(s, 3) for s in rand], 'tcav_mean': round(float(np.mean(rand)), 3)}
# one gull image for the slide: its directional derivative along the grey-wing CAV (first run's direction)
json.dump(out, open(HERE / 'tcav.json', 'w'), indent=1)
print(json.dumps(out, indent=1))
