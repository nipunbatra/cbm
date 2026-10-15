#!/usr/bin/env python3
"""probe_shapes.py: a measured look at leakage in the saved shape experiment (no retraining).

The training script's generator is deterministic, so the test split (seed 303, 512 images) can be regenerated
together with its nuisance variables (exact radius, centre, background shade, object shade), which the saved
predictions do not store. We check that the regenerated concepts and classes equal the saved ones, then ask what the
strict CBM's soft concept scores carry beyond their binary meaning:
  1. radius within each size class vs the soft 'large' score (extra information about the declared concept),
  2. linear probes from the five soft scores to nuisance variables that are not concepts (position, shade),
     compared with the same probes on the five hard 0/1 truths (which carry none by construction).
Writes leakage/shape_probe.json.
"""
import importlib.util, json
from pathlib import Path
import numpy as np

TEACH = Path.home() / 'git/dl-teaching'
spec = importlib.util.spec_from_file_location('toy', TEACH / 'scripts/train_concept_bottleneck_toy.py')
toy = importlib.util.module_from_spec(spec); spec.loader.exec_module(toy)
M = json.load(open(TEACH / 'results/cbm_toy_metrics.json')); P = json.load(open(TEACH / 'results/cbm_toy/test_predictions.json'))
seed = M['metadata']['split_seeds'][2]; n = M['metadata']['test_n']

# regenerate the test split with the same random calls, recording the nuisances
rng = np.random.default_rng(seed)
y = np.tile(np.arange(8), n // 8); rng.shuffle(y)
nu = []
for label in y:
    blue, square, large = label // 4, (label // 2) % 2, label % 2
    r = rng.integers(14, 20) if large else rng.integers(8, 14)
    cx, cy = rng.integers(23, 41, size=2)
    bg = rng.uniform(.84, .98); shade = rng.uniform(.75, 1.08)
    rng.normal(0, .045, (64, 64, 3))  # pixel noise draw, same order as the script
    nu.append(dict(r=int(r), cx=int(cx), cy=int(cy), bg=float(bg), shade=float(shade)))
assert list(map(int, y)) == P['true_classes'], 'regenerated split differs from the saved one'
_, Cs, Ys = toy.make_data(n, seed)
assert np.array_equal(Ys.numpy(), y) and np.array_equal(Cs.numpy(), np.array(P['true_concepts'], dtype=np.float32))

soft = np.array(P['predictions']['cbm']['concept_probabilities'])
hard = np.array(P['true_concepts'])
r = np.array([d['r'] for d in nu]); large = hard[:, 4] == 1


def r2_cv(X, t, k=8, lam=1e-3):
    """ridge regression R^2 with k-fold cross-validation (held-out folds)"""
    idx = np.arange(len(t)); out = np.zeros(len(t))
    for f in range(k):
        te = idx % k == f; tr = ~te
        A = np.c_[X[tr], np.ones(tr.sum())]; w = np.linalg.solve(A.T @ A + lam * np.eye(A.shape[1]), A.T @ t[tr])
        out[te] = np.c_[X[te], np.ones(te.sum())] @ w
    return float(1 - ((t - out) ** 2).sum() / ((t - t.mean()) ** 2).sum())


res = {'seed': int(seed), 'n': int(n), 'model': 'strict CBM (saved predictions, not retrained)'}
# 1. the soft 'large' score against the exact radius
res['large_by_radius'] = {str(int(k)): {'n': int((r == k).sum()), 'mean_p_large': float(soft[r == k, 4].mean())} for k in np.unique(r)}
res['corr_r_plarge_within_small'] = float(np.corrcoef(r[~large], soft[~large, 4])[0, 1])
res['corr_r_plarge_within_large'] = float(np.corrcoef(r[large], soft[large, 4])[0, 1])
res['r2_radius_from_soft'] = r2_cv(soft, r.astype(float)); res['r2_radius_from_hard'] = r2_cv(hard, r.astype(float))
# 2. nuisance probes
for key in ('cx', 'cy', 'bg', 'shade'):
    t = np.array([d[key] for d in nu], dtype=float)
    res[f'r2_{key}_from_soft'] = r2_cv(soft, t); res[f'r2_{key}_from_hard'] = r2_cv(hard, t)
json.dump(res, open(Path(__file__).with_name('shape_probe.json'), 'w'), indent=1)
for k, v in res.items(): print(k, v if not isinstance(v, float) else round(v, 3))
