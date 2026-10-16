#!/usr/bin/env python3
"""numerical_validation.py: independent checks of every number the film shows or speaks.

Recomputes each value from its primary source, by a different route than math/data.py where possible (explicit loops
instead of numpy products, closed-form probabilities instead of sampling, the saved PyTorch checkpoint instead of the
exported weights), and compares with src/data.json.
  ~/base/bin/python -m pytest -q math/numerical_validation.py          (or run it directly)
"""
import hashlib, itertools, json, math
from pathlib import Path

import numpy as np
import pytest

ROOT = Path(__file__).resolve().parents[1]
TEACH = Path.home() / 'git/dl-teaching'
LECT = TEACH / 'attention-followups/concept-bottlenecks-60min'
D = json.load(open(ROOT / 'src/data.json'))
HEADS = json.load(open(LECT / 'output/illustrative-heads.json'))
FAULTY = json.load(open(LECT / 'output/illustrative-counterexample.json'))
METRICS = json.load(open(TEACH / 'results/cbm_toy_metrics.json'))
sig = lambda z: 1 / (1 + math.exp(-z))


def close(a, b, tol=1e-3):
    return abs(a - b) <= tol


def test_real_saliency_provenance_and_gradient():
    """Verify the displayed maps, class probabilities and pixel nudge from raw outputs."""
    from PIL import Image
    s = D['saliency_real']
    archive = ROOT / 'worked/saliency_gradients.npz'
    assert hashlib.sha256(archive.read_bytes()).hexdigest() == s['archive_sha256']
    assert hashlib.sha256((ROOT / s['source_photo']).read_bytes()).hexdigest() == s['source_sha256']
    a = np.load(archive)
    gradients, logits, rgb = a['gradients'], a['logits'], a['rgb']
    assert gradients.shape == (2, 3, 224, 224) and np.isfinite(gradients).all()
    assert rgb.shape == (3, 224, 224) and (rgb >= 0).all() and (rgb <= 1).all()
    maps = np.abs(gradients).max(axis=1)
    scale = np.percentile(maps, s['display']['clip_percentile'])
    assert np.isclose(scale, s['display']['shared_vmax'])
    probabilities = soft(logits.tolist())
    for cl, values in zip(s['classes'], maps):
        assert abs(probabilities[cl['index']] - cl['probability']) < 1e-7
        assert abs(float(logits[cl['index']]) - cl['logit']) < 1e-7
        # Pixel-exact common scaling, no independently normalised class maps.
        image = ROOT / 'public/img' / cl['map']
        expected = np.rint(np.clip(values / scale, 0, 1) * 255).astype(np.uint8)
        assert np.array_equal(np.asarray(Image.open(image)), expected)
        assert hashlib.sha256(image.read_bytes()).hexdigest() == s['image_sha256'][image.name]
    assert s['classes'][0]['index'] == int(logits.argmax())
    assert s['classes'][1]['probability'] < 0.01 and maps[1].max() > 0
    n = s['nudge']
    assert np.isclose(n['derivative'], gradients[0, 0, n['row'], n['col']])
    assert np.isclose(n['score_after'] - n['score_before'], n['score_change'])
    assert np.isclose(n['score_change'] / n['epsilon'], n['finite_difference'])
    assert abs(n['finite_difference'] / n['derivative'] - 1) < 0.02


# ------------------------------------------------------------------ Act 4: the worksheet, multiplied out by hand
def matvec(W, c):
    return [sum(W[i][j] * c[j] for j in range(len(c))) for i in range(len(W))]


def soft(z):
    m = max(z); e = [math.exp(v - m) for v in z]; s = sum(e); return [v / s for v in e]


def test_zoo_matrix_product():
    W = [[3, 1, 0], [-1, 2, -1], [-1, 0, 3]]
    assert D['zoo']['W'] == W
    z0, z1 = matvec(W, [0.1, 0.9, 0.1]), matvec(W, [1.0, 0.9, 0.1])
    for a, b in zip(z0, [1.2, 1.6, 0.2]): assert close(a, b, 1e-9)   # the spoken values
    for a, b in zip(z1, [3.9, 0.7, -0.7]): assert close(a, b, 1e-9)
    assert z0.index(max(z0)) == 1 and z1.index(max(z1)) == 0         # horse, then zebra
    for a, b in zip(z0, D['zoo']['logits']): assert close(a, b, 1e-9)
    for a, b in zip(z1, D['zoo']['logits_new']): assert close(a, b, 1e-9)
    # every displayed term W_ij c_j
    for i in range(3):
        for j in range(3):
            assert close(W[i][j] * [0.1, 0.9, 0.1][j], D['zoo']['terms'][i][j], 1e-9)
            assert close(W[i][j] * [1.0, 0.9, 0.1][j], D['zoo']['terms_new'][i][j], 1e-9)
    # the edit adds 0.9 x the stripes column
    assert [round(z1[i] - z0[i], 9) for i in range(3)] == [round(0.9 * W[i][0], 9) for i in range(3)] == [2.7, -0.9, -0.9]


def test_zoo_softmax():
    s0, s1 = soft([1.2, 1.6, 0.2]), soft([3.9, 0.7, -0.7])
    assert round(s0[1], 2) == 0.52 and round(s1[0], 2) == 0.95        # spoken: "about 0.52", "about 0.95"
    for a, b in zip(s0, D['zoo']['softmax']): assert close(a, b, 1e-4)
    for a, b in zip(s1, D['zoo']['softmax_new']): assert close(a, b, 1e-4)


# ------------------------------------------------------------------ the lecture's illustrative heads
def head(h, c):
    return sig(sum(w * v for w, v in zip(h['weights'], c)) + h['bias'])


@pytest.mark.parametrize('name', ['bird', 'sleep', 'kiln'])
def test_illustrative_heads(name):
    h = HEADS[name]
    for k in ('before', 'after'):
        p1 = head(h, h[k])
        assert close(p1, h[f'output_{k}'][1], 1e-6)                     # the lecture's stored output
        assert close(p1, D[name][k]['share'][1], 1e-4)                 # the film's data
    assert head(h, h['before']) < 0.5 < head(h, h['after'])           # the edit flips the ranking


def test_spoken_head_values():
    b, s = HEADS['bird'], HEADS['sleep']
    assert round(1 - head(b, b['before']), 2) == 0.71 and round(head(b, b['before']), 2) == 0.29 and round(head(b, b['after']), 2) == 0.91
    assert round(1 - head(s, s['before']), 2) == 0.62 and round(head(s, s['before']), 2) == 0.38 and round(head(s, s['after']), 2) == 0.86
    # the edit corrects the whole wing-colour group, and only it
    assert b['before'][2:] == b['after'][2:] and b['after'][:2] == [0.0, 1.0]
    assert s['before'][1:] == s['after'][1:] and (s['before'][0], s['after'][0]) == (0.12, 1.0)


def test_faulty_head():
    h = FAULTY
    assert (h['bias'], h['weights']) == (1.2, [-2.0, 0.6])
    z0 = 1.2 + (-2.0) * 0.2 + 0.6 * 1.0
    z1 = 1.2 + (-2.0) * 1.0 + 0.6 * 1.0
    assert close(z0, 1.4, 1e-9) and close(z1, -0.2, 1e-9)
    assert round(sig(z0), 2) == 0.80 and round(sig(z1), 2) == 0.45
    assert h['after'] == h['true_concepts']                           # the edit is correct
    assert sig(z0) > 0.5 > sig(z1)                                     # yet the routing becomes wrong (true class = billing)
    assert h['true_class'] == 1 and close(D['faulty']['after']['share'][1], sig(z1), 1e-4)


# ------------------------------------------------------------------ Act 8: incompleteness, by brute force
def test_incomplete_vocabulary_caps_accuracy():
    objs = D['incomplete']['objects']
    assert objs[0]['c'] == objs[1]['c'] and objs[0]['y'] != objs[1]['y']
    # every deterministic head from the concept vector to {A, B} gets at most one of the two right
    best = 0
    for out in itertools.product(['class A', 'class B'], repeat=4):  # all functions {0,1}^2 -> {A, B}
        f = dict(zip(itertools.product([0, 1], repeat=2), out))
        best = max(best, sum(f[tuple(o['c'])] == o['y'] for o in objs) / 2)
    assert best == 0.5 == D['incomplete']['best_accuracy']


# ------------------------------------------------------------------ Act 9: leakage, closed form
def test_leakage_threshold():
    L = D['leak']; (m0, m1), sd, thr = L['mu'], L['sd'], L['threshold']
    Phi = lambda x: 0.5 * (1 + math.erf(x / math.sqrt(2)))
    err = 0.5 * (1 - Phi((thr - m0) / sd)) + 0.5 * Phi((thr - m1) / sd)
    assert err < 1e-9                                                  # "almost perfectly"
    assert L['soft_accuracy'] >= 0.999 and L['hard_accuracy'] == 0.5
    assert m0 > 0.5 and m1 > 0.5 and L['hard_label'] == [1, 1]          # both mean "stripes present"
    assert close(thr, (m0 + m1) / 2, 1e-9)


# ------------------------------------------------------------------ Act 10: CEM mixing
def test_cem_mixture():
    C = D['cem']; cp, cm = np.array(C['c_plus']), np.array(C['c_minus'])
    assert np.allclose(C['path'][0], cm) and np.allclose(C['path'][-1], cp)
    assert np.allclose(C['mix_example'], 0.7 * cp + 0.3 * cm, atol=1e-4)


def test_cem_shape_example_resolves_the_constructed_collision():
    C = D['cem_shape']
    mixed = C['blue_probability'] * np.array(C['c_plus']) + (1 - C['blue_probability']) * np.array(C['c_minus'])
    assert np.allclose(mixed, C['blue_embeddings'])
    inputs = np.array(C['head_input'])
    assert np.allclose(inputs[:, :2], mixed)
    assert np.allclose(inputs[:, 2:], C['large_embedding'])
    # Independently evaluate the displayed rule, then check the matrix form.
    scores = np.column_stack([mixed[:, 1], 1 - mixed[:, 1]])
    assert np.allclose(scores, C['scores'])
    assert np.allclose(inputs @ np.array(C['W']).T + C['b'], scores)
    labels = [o['y'] for o in D['incomplete']['objects']]
    assert [labels[i] for i in scores.argmax(axis=1)] == C['predictions'] == labels
    # If both images have the same embedding, the same head again gives a tie
    # between the images' outputs, as in the original collision.
    collapsed = inputs.copy(); collapsed[1] = collapsed[0]
    collapsed_scores = collapsed @ np.array(C['W']).T + C['b']
    assert np.allclose(collapsed_scores[0], collapsed_scores[1])


# ------------------------------------------------------------------ Act 11: the measured experiment, preserved
def test_measured_evidence_unchanged():
    pres = json.load(open(LECT / 'output/preserved-evidence.json'))
    for rel, h in pres.items():
        assert hashlib.sha256((TEACH / rel).read_bytes()).hexdigest() == h, rel


def test_measured_values():
    m = METRICS['models']; I = METRICS['interventions']; md = METRICS['metadata']
    assert (md['test_n'], md['seed'], md['split_seeds'], md['epochs']) == (512, 17, [101, 202, 303], 60)
    assert [round(100 * m[k]['class_accuracy'], 1) for k in ('black_box', 'multitask', 'cbm')] == [78.7, 82.0, 81.6]
    assert round(100 * m['cbm']['concept_accuracy'], 1) == 92.4
    assert round(100 * I['oracle_largest_error'][1], 1) == 97.3 and I['oracle_largest_error'][5] == 1.0
    assert round(100 * I['random_mean'][1], 1) == 87.3 and I['random_repetitions'] == 32
    assert I['all_true_concepts_accuracy'] == 1.0
    # accuracies are fractions of 512 test images
    for k in ('black_box', 'multitask', 'cbm'):
        assert close(m[k]['class_accuracy'] * 512, round(m[k]['class_accuracy'] * 512), 1e-6)
    assert 'unchanged' in METRICS['multitask_intervention']


def test_measured_example_from_checkpoint():
    torch = pytest.importorskip('torch')
    sd = torch.load(TEACH / 'results/cbm_toy/cbm.pt', map_location='cpu', weights_only=True)
    sd = sd.get('state_dict', sd) if isinstance(sd, dict) else sd
    Wt, bt = sd['task_head.weight'].double().numpy(), sd['task_head.bias'].double().numpy()
    ex = D['measured']['example']
    assert ex['index'] == 10 and ex['corrected_index'] == 4                # test image 10, the size concept
    p = np.array(ex['probs']); q = p.copy(); q[4] = 0.0
    z0, z1 = Wt @ p + bt, Wt @ q + bt
    cls = METRICS['classes']
    assert cls[int(z0.argmax())] == 'large red square' and cls[int(z1.argmax())] == 'small red square'
    assert round(p[4], 2) == 0.78 and ex['true'][4] == 0.0
    assert np.allclose(z0, ex['logits'], atol=2e-3) and np.allclose(z1, ex['logits_after'], atol=2e-3)


# ------------------------------------------------------------------ Act 1: CLIP outputs are internally consistent
def test_clip_outputs():
    C = json.load(open(ROOT / 'blackbox/clip_outputs.json'))
    assert C['image_sha256'] == hashlib.sha256((ROOT / 'public/img/gull.jpg').read_bytes()).hexdigest()
    assert close(sum(C['probs']), 1.0, 2e-3)
    order = np.argsort(C['probs'])[::-1]
    assert C['species'][order[0]] == 'American herring gull' and C['species'][order[1]] == 'glaucous-winged gull'
    assert round(C['probs'][order[0]], 2) == 0.54 and round(C['probs'][order[1]], 2) == 0.21
    drop = np.array(C['occlusion']['drop_logprob'])
    r, c = np.unravel_index(drop.argmax(), drop.shape)
    u, v = (c + 0.5) / 14, (r + 0.5) / 14
    bx, by, bw, bh = D['gull']['regions']['head']
    gx, gy, gw, gh = D['gull']['regions']['bill']
    in_box = lambda x0, y0, w, h, pad=0.06: abs(u - x0) <= w / 2 + pad and abs(v - y0) <= h / 2 + pad
    assert in_box(bx, by, bw, bh) or in_box(gx, gy, gw, gh)            # "largest drops on the bill and the head"


# ------------------------------------------------------------------ the schematic EEG: the burst really is near 13 Hz
def test_eeg_spindle_frequency():
    E = D['eeg']; y = np.array(E['y']); fs = E['fs']
    a, b = int(E['spindle']['t0'] * fs), int(E['spindle']['t1'] * fs)
    seg = (y[a:b] - y[a:b].mean()) * np.hanning(b - a)
    f = np.fft.rfftfreq(4096, 1 / fs); P = np.abs(np.fft.rfft(seg, 4096)) ** 2
    band = (f > 9) & (f < 20)
    peak = f[band][P[band].argmax()]
    assert 12 <= peak <= 14 and 11 <= E['spindle']['hz'] <= 16           # AASM spindle band 11 to 16 Hz
    assert E['spindle']['t1'] - E['spindle']['t0'] >= 0.5                  # at least 0.5 s


# ------------------------------------------------------------------ CUB run (cub/cbm_cub.py): data.json mirrors the saved results
def test_cub_results():
    R = json.load(open(ROOT / 'cub/cub_results.json')); C = D['cub']
    assert (C['n_images'], C['n_train'], C['n_test'], C['n_concepts'], C['n_groups']) == (11788, 5994, 5794, 112, 28)
    for k, v in R['task_acc'].items(): assert abs(C['acc'][k] - v) < 1e-4
    assert abs(sum(C['certainty_share'].values()) - 1) < 1e-3
    I = C['intervention']; assert len(I['independent']) == 29 and I['independent'][-1] == 1.0  # true class-level concepts identify the class
    assert all(b >= a - 1e-9 for a, b in zip(I['independent'], I['independent'][1:]))       # averaged curve rises
    assert C['acc']['joint'] > C['acc']['sequential'] > C['acc']['independent']               # Koh et al.'s ordering
    assert I['joint'][-1] < I['independent'][-1]                                                # joint gains least
    g = C['cbd']['gull_photo']; per = g['per_species']
    for k, v in per.items(): assert abs(np.mean(v['cos']) - v['score']) < 1e-6                 # class score = mean descriptor score
    assert g['top'][0][1] >= per['Herring Gull']['score']


@pytest.mark.parametrize('example', D['saliency_toy']['examples'])
def test_saliency_maps_match_pixel_nudges(example):
    toy = D['saliency_toy']
    image = example['image']
    target = example['class']
    weights = toy['W'][target]
    score = lambda pixels, w: sum(pixels[r][c] * w[r][c] for r in range(3) for c in range(3))
    scores = {k: score(image, w) for k, w in toy['W'].items()}
    assert max(scores, key=scores.get) == target
    for r, c in itertools.product(range(3), repeat=2):
        nudged = [row[:] for row in image]
        nudged[r][c] += toy['eps']
        sensitivity = abs((score(nudged, weights) - score(image, weights)) / toy['eps'])
        assert close(sensitivity, toy['saliency'][target][r][c], 1e-9)
    assert close(abs(toy['nudge_centre'][target] / toy['eps']), toy['saliency'][target][1][1], 1e-9)
    assert max(max(row) for row in toy['saliency'][target]) <= toy['saliency_max']


def test_pcbm_multi_image_standardisation():
    """Column-wise training statistics are reused for held-out photos without leakage."""
    from statistics import fmean, pstdev
    scale = D['pcbm_scaling']
    pc = D['worked']['pcbm']
    assert scale['bank'] == pc['bank']
    assert scale['train_files'] == D['worked']['train']
    assert set(scale['photos']).issubset(D['worked']['test'])
    assert set(scale['train_files']).isdisjoint(scale['photos'])
    for f, expected in scale['photo_sha256'].items():
        assert hashlib.sha256((ROOT / 'worked/photos' / f).read_bytes()).hexdigest() == expected
    for j in range(len(scale['bank'])):
        column = [row[j] for row in scale['train_raw']]
        mean = fmean(column)
        spread = pstdev(column) + scale['epsilon']
        assert close(mean, scale['mean'][j], 1e-7)
        assert close(spread, scale['spread'][j], 1e-7)
        assert close(mean, pc['mean'][j], 5.1e-5)
        assert close(spread, pc['std'][j], 5.1e-5)
        for i, row in enumerate(scale['raw']):
            expected = (row[j] - mean) / spread
            assert close(expected, scale['standardised'][i][j], 5e-6)
        assert np.array_equal(np.argsort(np.array(scale['raw'])[:,j]),
                              np.argsort(np.array(scale['standardised'])[:,j]))
    assert np.allclose(scale['raw'][0], pc['scores_raw_example'], atol=5.1e-5)
    assert np.allclose(scale['standardised'][0], pc['z_example'], atol=8e-5)


def test_pcbm_two_feature_direction_and_scores():
    """The CAV is normal to the separating line and scores towards positive examples."""
    toy = D['pcbm_toy']
    pos, neg = np.array(toy['positive']), np.array(toy['negative'])
    direction = np.array(toy['direction'])
    assert close(np.linalg.norm(direction), 1.0)
    assert close(direction @ np.array([0., 1.]), 0.0)  # normal to the vertical boundary
    assert (pos @ direction > toy['boundary']).all()
    assert (neg @ direction < toy['boundary']).all()
    assert close(pos[:, 0].min() - toy['boundary'], toy['boundary'] - neg[:, 0].max())
    assert np.allclose(np.array(toy['new_features']) @ direction, toy['scores'])
    # Movement along feature 2 cannot alter the horizontal CAV's score.
    moved = np.array(toy['new_features']) + np.array([0., 3.])
    assert np.allclose(moved @ direction, toy['scores'])
    clip = toy['clip']
    image, phrase = np.array(clip['image']), np.array(clip['phrase'])
    assert close(np.linalg.norm(image), 1.0) and close(np.linalg.norm(phrase), 1.0)
    assert np.allclose(image * phrase, clip['products'])
    assert close(image @ phrase, clip['score'])


if __name__ == '__main__':
    raise SystemExit(pytest.main(['-q', __file__]))


def test_fixed_random_layer_intuition():
    """The same frozen mix can give different outputs for different image features."""
    d = D['random_layer_toy']
    assert d['weights'] == [0.4, -0.2]
    assert d['features'] == [[2.0, 1.0], [1.0, 2.0]]
    for row, terms, output in zip(d['features'], d['terms'], d['outputs']):
        assert all(close(x * w, term, 1e-9) for x, w, term in zip(row, d['weights'], terms))
        assert close(sum(terms), output, 1e-9)
    assert d['outputs'] == [0.6, 0.0]
