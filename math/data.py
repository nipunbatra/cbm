#!/usr/bin/env python3
"""data.py: every number the film shows or speaks, computed in one place -> src/data.json.

Sources (never retyped by hand in a scene):
  1. the lecture's labelled illustrative heads: dl-teaching/.../output/illustrative-heads.json and
     illustrative-counterexample.json (recomputed here, and checked against the stored outputs);
  2. the lecture's saved measured experiment: dl-teaching/results/cbm_toy_metrics.json (read, never retrained);
  3. new, reproducible calculations: the zebra / horse / giraffe worksheet (the lecture's hand-chosen matrix), the
     constructed leakage distributions, the blue circle / blue square collision, the CEM mixing picture, the schematic
     EEG trace, and the CLIP black box (blackbox/clip_outputs.json, written by blackbox/clip_blackbox.py).
  ~/base/bin/python math/data.py
"""
import hashlib, json, math
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
TEACH = Path.home() / 'git/dl-teaching'
LECT = TEACH / 'attention-followups/concept-bottlenecks-60min'
HEADS = json.load(open(LECT / 'output/illustrative-heads.json'))
FAULTY = json.load(open(LECT / 'output/illustrative-counterexample.json'))
METRICS_PATH = TEACH / 'results/cbm_toy_metrics.json'
METRICS = json.load(open(METRICS_PATH))
PRESERVED = json.load(open(LECT / 'output/preserved-evidence.json'))
CLIP = json.load(open(ROOT / 'blackbox/clip_outputs.json'))

sig = lambda z: 1 / (1 + math.exp(-z))
r = lambda v, d=4: round(float(v), d)


def softmax(z):
    z = np.asarray(z, float); e = np.exp(z - z.max()); return e / e.sum()


def binary_head(h):
    """two-class illustrative head of the lecture: score z = w.c + b, share of class 1 = sigmoid(z)"""
    out = {}
    for k in ('before', 'after'):
        z = float(np.dot(h['weights'], h[k]) + h['bias'])
        out[k] = {'c': h[k], 'z': r(z), 'terms': [r(w * c) for w, c in zip(h['weights'], h[k])], 'share': [r(1 - sig(z)), r(sig(z))]}
    # the stored lecture outputs must agree with this recomputation
    for k in ('before', 'after'):
        assert np.allclose(out[k]['share'], h[f'output_{k}'], atol=1e-4), (h, out)
    return {'concepts': h['concepts'], 'weights': h['weights'], 'bias': h['bias'], **out}


D = {}

# ---------------------------------------------------------------- Act 1: the CLIP black box (genuine model output)
D['clip'] = {'model': CLIP['model'], 'species': CLIP['species'], 'probs': CLIP['probs'], 'top': CLIP['top'],
             'template': CLIP['template'], 'grid': CLIP['occlusion']['grid'], 'patch': CLIP['occlusion']['patch_frac'],
             'drop': CLIP['occlusion']['drop_logprob'],
             'drop_max': r(max(max(row) for row in CLIP['occlusion']['drop_logprob']))}

# gull photograph (public/img/gull.jpg, a 2048 px square crop of the Commons original): concept regions, normalized
# (cx, cy, w, h), measured by eye on a gridded copy of the crop
D['gull'] = {'regions': {
    'wingtip': [0.785, 0.555, 0.27, 0.12],
    'bill': [0.14, 0.295, 0.14, 0.08],
    'tail': [0.80, 0.505, 0.18, 0.06],
    'head': [0.31, 0.26, 0.24, 0.17]}}

# ---------------------------------------------------------------- Acts 2, 6, 14: the gull intervention (illustrative)
bird = binary_head(HEADS['bird'])
bird['classes'] = ['Glaucous-winged gull', 'American herring gull']  # candidate A, candidate B of the lecture's head
bird['labels'] = ['wingtip grey', 'wingtip black', 'bill pointed', 'head white', 'tail rounded']
bird['concepts'] = bird['labels']  # the film's wording (the lecture JSON's own names are not shown)
D['bird'] = bird

# ---------------------------------------------------------------- Act 4: the zebra / horse / giraffe worksheet
W = np.array([[3, 1, 0], [-1, 2, -1], [-1, 0, 3]], float)
c0 = np.array([0.1, 0.9, 0.1]); c1 = np.array([1.0, 0.9, 0.1])
z0, z1 = W @ c0, W @ c1
D['zoo'] = {
    'classes': ['zebra', 'horse', 'giraffe'], 'concepts': ['stripes', 'horse-like shape', 'long neck'],
    'W': W.tolist(), 'c': c0.tolist(), 'c_new': c1.tolist(),
    'terms': (W * c0).round(4).tolist(),          # terms[i][j] = W_ij c_j
    'terms_new': (W * c1).round(4).tolist(),
    'logits': z0.round(4).tolist(), 'logits_new': z1.round(4).tolist(),
    'softmax': softmax(z0).round(4).tolist(), 'softmax_new': softmax(z1).round(4).tolist(),
    'delta': ((c1 - c0)[0] * W[:, 0]).round(4).tolist(),
    'argmax': int(z0.argmax()), 'argmax_new': int(z1.argmax())}

# ---------------------------------------------------------------- Act 5: training (constants of the measured run)
md = METRICS['metadata']
D['train'] = {'lambda_c': md['concept_loss_weight'], 'lambda_y': md['task_loss_weight'], 'strategy': 'joint',
              'optimizer': md['optimizer'], 'lr': md['learning_rate'], 'epochs': md['epochs'], 'batch': md['batch_size']}

# ---------------------------------------------------------------- Act 6 and 12: sleep (illustrative head + schematic EEG)
sleep = binary_head(HEADS['sleep']); sleep['classes'] = HEADS['sleep']['classes']
D['sleep'] = sleep
# schematic EEG: 6 s at 100 Hz, arbitrary units. Background = sum of seeded low-frequency sinusoids (theta / alpha-ish),
# a K-complex (biphasic slow wave) near 1.6 s and a spindle (13 Hz, Gaussian envelope, about 1 s long) near 3.9 s.
fs, T = 100, 6.0
t = np.arange(int(fs * T)) / fs
rng = np.random.default_rng(7)
bg = sum(a * np.sin(2 * np.pi * f * t + p) for a, f, p in zip(rng.uniform(0.12, 0.3, 7), [4.3, 5.1, 6.2, 7.4, 2.7, 9.1, 3.5], rng.uniform(0, 6.3, 7)))
bg += 0.06 * rng.standard_normal(len(t))
kc = -1.4 * np.exp(-0.5 * ((t - 1.55) / 0.12) ** 2) + 0.9 * np.exp(-0.5 * ((t - 1.95) / 0.2) ** 2)
sp_c, sp_f = 3.9, 13.0
spindle = 0.75 * np.exp(-0.5 * ((t - sp_c) / 0.22) ** 2) * np.sin(2 * np.pi * sp_f * (t - sp_c))
eeg = bg + kc + spindle
D['eeg'] = {'fs': fs, 'seconds': T, 'y': eeg.round(3).tolist(), 'spindle': {'t0': r(sp_c - 0.5, 2), 't1': r(sp_c + 0.5, 2), 'hz': sp_f},
            'kcomplex': {'t0': 1.35, 't1': 2.3}, 'note': 'schematic: seeded sinusoids + authored events, arbitrary units, not a recording'}

# ---------------------------------------------------------------- Act 7: the deliberately faulty billing head
faulty = binary_head(FAULTY); faulty['classes'] = FAULTY['classes']; faulty['true_concepts'] = FAULTY['true_concepts']
faulty['message'] = 'The app works, but I was charged twice. Please refund the extra payment.'
D['faulty'] = faulty
# the lecture's well-behaved text head, for contrast (not narrated)
D['text_ok'] = binary_head(HEADS['text'])

# ---------------------------------------------------------------- Act 8: incomplete vocabulary
D['incomplete'] = {'vocab': ['blue', 'large'], 'objects': [
    {'name': 'blue circle', 'shape': 'circle', 'c': [1, 0], 'y': 'class A'},
    {'name': 'blue square', 'shape': 'square', 'c': [1, 0], 'y': 'class B'}],
    'best_accuracy': 0.5}

# ---------------------------------------------------------------- Act 9: leakage (constructed distributions)
mu, sd, thr = [0.72, 0.96], 0.017, 0.84
rs = np.random.default_rng(11); n = 5000
s_a, s_b = rs.normal(mu[0], sd, n), rs.normal(mu[1], sd, n)
soft_acc = ((s_a < thr).sum() + (s_b >= thr).sum()) / (2 * n)
xs = np.linspace(0.6, 1.0, 161)
D['leak'] = {'classes': ['plains zebra', "Grévy's zebra"], 'mu': mu, 'sd': sd, 'threshold': thr,
             'hard_label': [1, 1], 'soft_accuracy': r(soft_acc), 'hard_accuracy': 0.5, 'n_per_class': n, 'seed': 11,
             'xs': xs.round(4).tolist(),
             'pdf': [[r(math.exp(-0.5 * ((x - m) / sd) ** 2), 4) for x in xs] for m in mu]}

# ---------------------------------------------------------------- Act 10: CEM mixing picture (illustrative 2-D embeddings)
cp, cm = np.array([0.82, 0.30]), np.array([0.22, 0.74])
D['cem'] = {'c_plus': cp.tolist(), 'c_minus': cm.tolist(),
            'path': [(p * cp + (1 - p) * cm).round(4).tolist() for p in np.linspace(0, 1, 11)], 'p_example': 0.7,
            'mix_example': (0.7 * cp + 0.3 * cm).round(4).tolist()}

# A constructed CEM counterexample to the Part 8 collision. These are hand-chosen
# candidate vectors and a fixed illustrative head, not fitted model outputs.
_shape_p = 0.9
_shape_plus = np.array([[0.8, 0.7], [1.0, 0.3]])
_shape_minus = np.array([[0.0, 0.5], [0.0, 0.3]])
_shape_mixed = _shape_p * _shape_plus + (1 - _shape_p) * _shape_minus
_shape_large = np.array([0.2, 0.4])  # held identical for both images
_shape_input = np.concatenate([_shape_mixed, np.tile(_shape_large, (2, 1))], axis=1)
_shape_W = np.array([[0, 1, 0, 0], [0, -1, 0, 0]])
_shape_b = np.array([0, 1])
_shape_scores = _shape_input @ _shape_W.T + _shape_b
D['cem_shape'] = {
    'evidence': 'illustrative: hand-chosen vectors and head; arithmetic computed',
    'blue_probability': _shape_p, 'c_plus': _shape_plus.tolist(), 'c_minus': _shape_minus.tolist(),
    'blue_embeddings': _shape_mixed.round(4).tolist(), 'large_embedding': _shape_large.tolist(),
    'head_input': _shape_input.round(4).tolist(), 'W': _shape_W.tolist(), 'b': _shape_b.tolist(),
    'scores': _shape_scores.round(4).tolist(),
    'predictions': [D['incomplete']['objects'][i]['y'] for i in _shape_scores.argmax(axis=1)],
}

# PCBM primer: two-dimensional features, not a projection of the real CLIP run.
# The two rectangles are symmetric. The hard-margin separator is halfway between
# the nearest x coordinates; its unit normal points towards the positive group.
_pc_pos = np.array([[1, 1], [2, 1], [1, 3], [2, 3]], float)
_pc_neg = np.array([[-2, 1], [-1, 1], [-2, 3], [-1, 3]], float)
_pc_boundary = (_pc_pos[:, 0].min() + _pc_neg[:, 0].max()) / 2
_pc_direction = np.array([1., 0.])
_pc_new = np.array([[1.5, 2.], [-0.5, 2.]])
_pc_image, _pc_phrase = np.array([0.6, 0.8]), np.array([0.8, 0.6])
D['pcbm_toy'] = {
    'evidence': 'constructed 2-D features; separator and scores calculated',
    'positive': _pc_pos.tolist(), 'negative': _pc_neg.tolist(), 'boundary': r(_pc_boundary),
    'direction': _pc_direction.tolist(), 'new_features': _pc_new.tolist(),
    'scores': (_pc_new @ _pc_direction).tolist(),
    'clip': {'image': _pc_image.tolist(), 'phrase': _pc_phrase.tolist(),
             'products': (_pc_image * _pc_phrase).tolist(), 'score': r(_pc_image @ _pc_phrase)},
}

# ---------------------------------------------------------------- Act 11: the measured shape experiment (read only)
M = METRICS['models']; I = METRICS['interventions']; demo = METRICS['demo']
ex = next(e for e in demo['examples'] if e['index'] == demo.get('selected_index', 10))
Wd, bd = np.array(demo['weight']), np.array(demo['bias'])
lg0 = Wd @ np.array(ex['probabilities']) + bd; lg1 = Wd @ np.array(ex['corrected']) + bd
assert np.allclose(lg0, ex['class_logits'], atol=1e-4)
assert int(lg0.argmax()) == ex['predicted_class'] and int(lg1.argmax()) == ex['after_class']
D['measured'] = {
    'protocol': {'seed': md['seed'], 'epochs': md['epochs'], 'train_n': md['train_n'], 'val_n': md['val_n'], 'test_n': md['test_n'],
                 'n_seeds': 1, 'image_px': 64, 'policy': 'oracle: replace the concept with the largest absolute error by its true 0/1 value',
                 'random_repetitions': I['random_repetitions'], 'human': False},
    'concepts': METRICS['concepts'], 'classes': METRICS['classes'],
    'acc': {k: r(M[k]['class_accuracy']) for k in ('black_box', 'multitask', 'cbm')},
    'concept_acc': {k: r(M[k]['concept_accuracy']) for k in ('multitask', 'cbm')},
    'per_concept_acc_cbm': [r(v) for v in M['cbm']['per_concept_accuracy']],
    'params': {k: M[k]['parameter_count'] for k in ('black_box', 'multitask', 'cbm')},
    'oracle': [r(v) for v in I['oracle_largest_error']], 'random_mean': [r(v) for v in I['random_mean']],
    'random_min': [r(v) for v in I['random_min']], 'random_max': [r(v) for v in I['random_max']],
    'all_true': I['all_true_concepts_accuracy'], 'one_wrong_bit': I['exactly_one_wrong_bit'],
    'multitask_unchanged': METRICS['multitask_intervention'],
    'example': {'index': ex['index'], 'image': 'test_010.png', 'probs': [r(v) for v in ex['probabilities']],
                'corrected': [r(v) for v in ex['corrected']], 'corrected_index': ex['corrected_index'],
                'true': ex['concepts'], 'pred_class': ex['predicted_class'], 'true_class': ex['true_class'],
                'after_class': ex['after_class'], 'logits': lg0.round(4).tolist(), 'logits_after': lg1.round(4).tolist(),
                'softmax': softmax(lg0).round(4).tolist(), 'softmax_after': softmax(lg1).round(4).tolist()},
    'metrics_sha256': hashlib.sha256(METRICS_PATH.read_bytes()).hexdigest()}
assert D['measured']['metrics_sha256'] == PRESERVED['results/cbm_toy_metrics.json'], 'the saved experiment changed'

# ---------------------------------------------------------------- Act 12: kilns (illustrative concepts, lecture's kiln head)
kiln = binary_head(HEADS['kiln']); kiln['classes'] = HEADS['kiln']['classes']
D['kiln'] = kiln

# ---------------------------------------------------------------- Parts 9 and 10: measured probe and worked examples
# leakage/probe_shapes.py (saved predictions of the shape model, regenerated test split; no retraining) and
# worked/compute.py (36 Commons photographs; CLIP ViT-B/32, ResNet-50, Gemini concept lists in worked/llm_concepts.json)
from PIL import Image as _Im
PROBE = json.load(open(ROOT / 'leakage/shape_probe.json'))
D['probe'] = {k: PROBE[k] for k in PROBE if k != 'large_by_radius'}
D['probe']['radius'] = [int(k) for k in PROBE['large_by_radius']]
D['probe']['mean_p_large'] = [r(v['mean_p_large']) for v in PROBE['large_by_radius'].values()]
D['probe']['n_per_radius'] = [v['n'] for v in PROBE['large_by_radius'].values()]
WK = json.load(open(ROOT / 'worked/worked_examples.json'))
WK['photo_size'] = {f: list(_Im.open(ROOT / 'worked/photos' / f).size) for f in WK['train'] + WK['test']}
WK['photo_credit'] = {f: v for f, v in json.load(open(ROOT / 'worked/photos/meta.json')).items()}
LLM = json.load(open(ROOT / 'worked/llm_concepts.json'))
WK['llm'] = {'model': LLM['model'], 'date': LLM['date'],
             'lf_zebra': {k: {'prompt': v['prompt'], 'raw': v['raw']} for k, v in LLM['label_free']['zebra'].items()},
             'labo': {c: {'prompt': LLM['labo'][c]['prompt'], 'raw': LLM['labo'][c]['raw'], 'items': LLM['labo'][c]['items']} for c in LLM['labo']}}
WK['extras'] = json.load(open(ROOT / 'worked/extras.json'))  # worked/extras.py: real e(x) entries, LF-CBM targets
D['worked'] = WK

# ---------------------------------------------------------------- CUB (revision of 11 October): our own linear run
# cub/cbm_cub.py on frozen CLIP ViT-B/32 features of CUB-200-2011 (Koh et al.'s 112 attributes, official split)
CUBR = json.load(open(ROOT / 'cub/cub_results.json'))
D['cub'] = {k: CUBR[k] for k in ('n_images', 'n_train', 'n_test', 'n_concepts', 'n_groups')}
D['cub']['certainty_share'] = {k: r(v) for k, v in CUBR['certainty_share'].items()}
D['cub']['acc'] = {k: r(v) for k, v in CUBR['task_acc'].items()}; D['cub']['acc']['standard'] = r(CUBR['standard_acc'])
D['cub']['concept_acc'] = r(CUBR['concept_acc']); D['cub']['joint_concept_acc'] = r(CUBR['joint_concept_acc'])
D['cub']['intervention'] = {k: [r(x) for x in v] if k != 'groups' else v for k, v in CUBR['intervention'].items()}
D['cub']['pcbm'] = {k: r(v) for k, v in CUBR['pcbm'].items()}
D['cub']['cbd'] = {'acc': r(CUBR['cbd']['acc']), 'classname_acc': r(CUBR['cbd']['classname_acc']),
                   'gull_descriptors': CUBR['cbd']['gull_examples'], 'gull_photo': CUBR['cbd']['gull_photo']}
D['cub']['tcav'] = json.load(open(ROOT / 'cub/tcav.json'))  # cub/tcav.py: real TCAV, CLIP zero-shot herring gull
D['cub']['gull'] = CUBR['gull']; D['cub']['groups'] = CUBR['groups']; D['cub']['herring_gull'] = CUBR['herring_gull']
# literature values (docs/lineage_facts.md; primary papers)
D['lit'] = {
  'koh_cub_err': {'independent': 0.240, 'sequential': 0.243, 'joint': 0.199, 'standard': 0.175},
  'koh_oai_rmse': {'independent': 0.435, 'sequential': 0.418, 'joint': 0.418, 'standard': 0.441},
  'oai': {'concepts': 10, 'grades': 4},
  'menon_b32': {'cbd': 52.57, 'classname': 51.95},
  'zech': {'auc_internal': 0.931, 'auc_external': 0.815, 'hospital_id_nih': 99.95},
  'cebab': {'concepts': ['food', 'service', 'ambiance', 'noise'], 'texts': 15089},
  'wu_icu_patients': 15552,
  'labo_cub_1shot': {'labo': 54.19, 'linear_probe': 47.69},  # Yang et al. 2023, App. Table 10, ViT-L/14
}

# ---------------------------------------------------------------- saliency, worked (revision of 15 October)
# A constructed teaching example: a 3 x 3 image of a vertical bar and a linear model with three classes. For a linear
# score s_k = sum_i W_k,i x_i, the gradient ds_k/dx_i is W_k,i, so a nudge of eps to pixel i moves s_k by eps * W_k,i,
# and the saliency map of class k is |W_k|.
_img = np.array([[0, 1, 0], [0, 1, 0], [0, 1, 0]], float)
_W = {'vertical bar': np.array([[-0.5, 1, -0.5]] * 3), 'horizontal bar': np.array([[-0.5] * 3, [1] * 3, [-0.5] * 3]),
      'dot': np.array([[-0.25] * 3, [-0.25, 2, -0.25], [-0.25] * 3])}
_eps = 0.1
_dot = np.zeros_like(_img); _dot[1, 1] = 1
_examples = {'vertical bar': _img, 'horizontal bar': _img.T, 'dot': _dot}
D['saliency_toy'] = {
    'classes': list(_W), 'image': _img.tolist(), 'W': {k: v.tolist() for k, v in _W.items()},
    'scores': {k: r(float((v * _img).sum())) for k, v in _W.items()}, 'eps': _eps,
    'nudge_centre': {k: r(_eps * v[1, 1]) for k, v in _W.items()},     # brighten pixel (row 2, col 2)
    'nudge_corner': {k: r(_eps * v[0, 0]) for k, v in _W.items()},     # brighten pixel (row 1, col 1)
    'saliency': {k: np.abs(v).tolist() for k, v in _W.items()},
    'examples': [{'class': k, 'image': v.tolist()} for k, v in _examples.items()],
    'saliency_max': r(max(np.abs(w).max() for w in _W.values())),
}

json.dump(D, open(ROOT / 'src/data.json', 'w'), indent=1, ensure_ascii=False)
print('wrote src/data.json')
print('bird', D['bird']['before']['share'], '->', D['bird']['after']['share'])
print('zoo', D['zoo']['logits'], D['zoo']['softmax'], '->', D['zoo']['logits_new'], D['zoo']['softmax_new'])
print('sleep', D['sleep']['before']['share'], '->', D['sleep']['after']['share'])
print('faulty', D['faulty']['before']['z'], D['faulty']['before']['share'], '->', D['faulty']['after']['z'], D['faulty']['after']['share'])
print('leak soft acc', D['leak']['soft_accuracy'])
print('measured', D['measured']['acc'], D['measured']['concept_acc'], D['measured']['oracle'][1], D['measured']['random_mean'][1])
print('example logits', [round(x, 2) for x in D['measured']['example']['logits']], '->', [round(x, 2) for x in D['measured']['example']['logits_after']])
