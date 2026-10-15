"""cbm_cub.py: concept bottleneck variants on CUB-200-2011, all on the same frozen CLIP ViT-B/32 image features.
Measured here (writes cub/cub_results.json, read by math/data.py):
  standard linear probe; CBM independent / sequential / joint (Koh et al. 2020 preprocessing: 112 class-level
  attributes); hard vs soft concepts; test-time intervention curves over the 28 attribute groups; a PCBM-style model
  on CLIP text concepts (+ residual, PCBM-h); classification by description (Menon & Vondrick 2023, released
  CUB descriptors) against the class-name zero-shot baseline; and the film's gull photograph through the trained CBM.
Linear models only (no end-to-end fine-tuning), so absolute numbers sit below the papers' ResNet/Inception results.
  ~/base/bin/python cub/cbm_cub.py
"""
import os, json, re, numpy as np, torch
from pathlib import Path
torch.manual_seed(0); rng = np.random.default_rng(0)
CUB = Path(os.environ.get('CUB_DIR', '/Volumes/Extreme SSD/cbm-film/cub')); ROOT = CUB / 'CUB_200_2011'
HERE = Path(__file__).resolve().parent
Z = np.load(CUB / 'clip_b32.npz'); X = Z['X']; Xn = X / np.linalg.norm(X, axis=1, keepdims=True)
N = len(X)
y = np.array([int(l.split()[1]) - 1 for l in open(ROOT / 'image_class_labels.txt')])
is_train = np.array([int(l.split()[1]) for l in open(ROOT / 'train_test_split.txt')]) == 1
attrs = [l.split()[1] for l in open(CUB / 'attributes.txt')]
classes = [re.sub(r'^\d+\.', '', l.split()[1]).replace('_', ' ') for l in open(ROOT / 'classes.txt')]

# image-level attribute labels: (image, attribute) -> present, certainty
A = np.zeros((N, 312), np.int8); Cert = np.zeros((N, 312), np.int8)
for l in open(ROOT / 'attributes' / 'image_attribute_labels.txt'):
    p = l.split(); i, a = int(p[0]) - 1, int(p[1]) - 1; A[i, a] = int(p[2]); Cert[i, a] = int(p[3])
cert_share = {k: float((Cert == k).mean()) for k in (1, 2, 3, 4)}

# Koh et al. preprocessing: class-level majority vote on the training split, keep attributes present
# (after the vote) in at least 10 classes; every image inherits its class's attribute vector.
# Vote rule as in Koh et al.'s CUB/generate_new_data.py: skip votes that say absent while not visible; ties -> present.
# Their vote ran on an 80% subset of the official train split; the 112 kept indices are published in that file, and we
# use them as given (the same rule on the full official train split keeps 109).
KOH112 = [1, 4, 6, 7, 10, 14, 15, 20, 21, 23, 25, 29, 30, 35, 36, 38, 40, 44, 45, 50, 51, 53, 54, 56, 57, 59, 63, 64, 69,
          70, 72, 75, 80, 84, 90, 91, 93, 99, 101, 106, 110, 111, 116, 117, 119, 125, 126, 131, 132, 134, 145, 149, 151, 152,
          153, 157, 158, 163, 164, 168, 172, 178, 179, 181, 183, 187, 188, 193, 194, 196, 198, 202, 203, 208, 209, 211, 212,
          213, 218, 220, 221, 225, 235, 236, 238, 239, 240, 242, 243, 244, 249, 253, 254, 259, 260, 262, 268, 274, 277, 283,
          289, 292, 293, 294, 298, 299, 304, 305, 308, 309, 310, 311]
cnt1 = np.stack([(A[is_train & (y == k)] == 1).sum(0) for k in range(200)])
cnt0 = np.stack([((A[is_train & (y == k)] == 0) & (Cert[is_train & (y == k)] != 1)).sum(0) for k in range(200)])
cls_attr = cnt1 >= cnt0
keep = np.array(KOH112); assert len(keep) == 112
C = cls_attr[y][:, keep].astype(np.float32)          # N x 112 concept labels
names = [attrs[j] for j in keep]
groups = sorted({n.split('::')[0] for n in names}); gid = np.array([groups.index(n.split('::')[0]) for n in names])

dev = 'cpu'
T = lambda a: torch.tensor(a, dtype=torch.float32, device=dev)
Xtr, Xte = T(Xn[is_train]), T(Xn[~is_train]); ytr, yte = torch.tensor(y[is_train]), torch.tensor(y[~is_train])
Ctr, Cte = T(C[is_train]), T(C[~is_train])
mu, sd = Xtr.mean(0), Xtr.std(0) + 1e-6; Xtr, Xte = (Xtr - mu) / sd, (Xte - mu) / sd

def fit(params, loss_fn, steps=600, lr=0.01):
    opt = torch.optim.Adam(params, lr=lr)
    for _ in range(steps):
        opt.zero_grad(); l = loss_fn(); l.backward(); opt.step()
    return params

def linear(din, dout):
    W = torch.zeros(din, dout, requires_grad=True); b = torch.zeros(dout, requires_grad=True); return W, b

ce = torch.nn.functional.cross_entropy; bce = torch.nn.functional.binary_cross_entropy_with_logits
acc = lambda logits, t: float((logits.argmax(1) == t).float().mean())
wd = 1e-4

# standard: x -> y
Ws, bs = linear(512, 200); fit([Ws, bs], lambda: ce(Xtr @ Ws + bs, ytr) + wd * Ws.pow(2).sum())
std_acc = acc(Xte @ Ws + bs, yte)

# concept predictor g: x -> c (independent / sequential share it)
Wg, bg = linear(512, 112); fit([Wg, bg], lambda: bce(Xtr @ Wg + bg, Ctr) + wd * Wg.pow(2).sum())
with torch.no_grad():
    Ptr, Pte = torch.sigmoid(Xtr @ Wg + bg), torch.sigmoid(Xte @ Wg + bg)
concept_acc = float(((Pte > 0.5).float() == Cte).float().mean())

def head(inputs_tr, steps=800):
    Wf, bf = linear(112, 200); fit([Wf, bf], lambda: ce(inputs_tr @ Wf + bf, ytr) + 1e-4 * Wf.pow(2).sum(), steps, 0.05)
    return lambda c: c @ Wf + bf
f_ind = head(Ctr)                                   # trained on true concepts
f_seq = head(Ptr)                                   # trained on predicted soft concepts
f_hard = head((Ptr > 0.5).float())                  # trained on predicted hard concepts
# joint: L_Y + lambda * L_C, task gradient flows into g
Wj, bj = linear(512, 112); Wjf, bjf = linear(112, 200); lam = 1.0
def joint_loss():
    z = Xtr @ Wj + bj; return ce(torch.sigmoid(z) @ Wjf + bjf, ytr) + lam * bce(z, Ctr) + wd * (Wj.pow(2).sum() + Wjf.pow(2).sum())
fit([Wj, bj, Wjf, bjf], joint_loss, 800, 0.01)
with torch.no_grad(): Pj = torch.sigmoid(Xte @ Wj + bj)
f_joint = lambda c: c @ Wjf + bjf
joint_concept_acc = float(((Pj > 0.5).float() == Cte).float().mean())

res = {'n_images': int(N), 'n_train': int(is_train.sum()), 'n_test': int((~is_train).sum()), 'n_concepts': int(len(keep)),
       'n_groups': len(groups), 'certainty_share': cert_share,
       'standard_acc': std_acc, 'concept_acc': concept_acc, 'joint_concept_acc': joint_concept_acc,
       'task_acc': {'independent': acc(f_ind(Pte), yte), 'sequential': acc(f_seq(Pte), yte),
                    'joint': acc(f_joint(Pj), yte), 'hard_sequential': acc(f_hard((Pte > 0.5).float()), yte),
                    'oracle_true_concepts': acc(f_ind(Cte), yte)}}

# test-time intervention: replace predicted concepts of k random groups by the true class-level values
def curve(f, P, hard=False, reps=5):
    out = []
    for k in range(len(groups) + 1):
        a = []
        for r in range(reps):
            order = np.random.default_rng(r).permutation(len(groups)); m = torch.tensor(np.isin(gid, order[:k]))
            Q = (P > 0.5).float() if hard else P.clone(); Q[:, m] = Cte[:, m]; a.append(acc(f(Q), yte))
        out.append(float(np.mean(a)))
    return out
res['intervention'] = {'groups': list(range(len(groups) + 1)), 'independent': curve(f_ind, Pte), 'sequential': curve(f_seq, Pte),
                       'joint': curve(f_joint, Pj), 'hard_sequential': curve(f_hard, Pte, hard=True)}

# PCBM-style: concepts = cosine similarity to CLIP text embeddings of the 112 attribute phrases; sparse head (+ residual)
Ta = Z['T_attr'][keep]; Ta = Ta / np.linalg.norm(Ta, axis=1, keepdims=True)
S = Xn @ Ta.T; S = (S - S[is_train].mean(0)) / (S[is_train].std(0) + 1e-6); Str, Ste = T(S[is_train]), T(S[~is_train])
Wp, bp = linear(112, 200); l1 = float(os.environ.get("PCBM_L1", 2e-4))
fit([Wp, bp], lambda: ce(Str @ Wp + bp, ytr) + l1 * Wp.abs().sum(), 1000, 0.02)
with torch.no_grad(): Wp_s = torch.where(Wp.abs() > 1e-3, Wp, torch.zeros_like(Wp))
Wr, br = linear(512, 200)
fit([Wr, br], lambda: ce(Str @ Wp_s + bp + Xtr @ Wr + br, ytr) + wd * Wr.pow(2).sum(), 600, 0.01)
res['pcbm'] = {'acc': acc(Ste @ Wp_s + bp, yte), 'acc_h': acc(Ste @ Wp_s + bp + Xte @ Wr + br, yte),
               'nonzero_frac': float((Wp_s != 0).float().mean())}

# classification by description (training-free): score_k = mean_d cos(x, text(class k, descriptor d))
import torch as _t
from transformers import CLIPModel, CLIPTokenizerFast
LOCAL = os.environ.get('CLIP_DIR', '/Volumes/Extreme SSD/cbm-film/clip-vit-base-patch32')
clip = CLIPModel.from_pretrained(LOCAL).eval(); tok = CLIPTokenizerFast.from_pretrained(LOCAL)
feat = lambda o: o if _t.is_tensor(o) else o.pooler_output
D = json.load(open(CUB / 'descriptors_cub.json')); dkeys = list(D)
assert len(dkeys) == 200
def which(d): return 'which' + (' is' if d.startswith(('a ', 'an ')) else ' has')  # Menon's "{c} which (is/has) {d}"
@_t.no_grad()
def temb(ps):
    e = feat(clip.get_text_features(**tok(ps, padding=True, return_tensors='pt'))).numpy(); return e / np.linalg.norm(e, axis=1, keepdims=True)
cbd = np.zeros((N, 200)); n_desc = []
for k, key in enumerate(dkeys):
    E = temb([f'{key}, {which(d)} {d}' for d in D[key]]); n_desc.append(len(E)); cbd[:, k] = (Xn @ E.T).mean(1)
Tc = Z['T_cls']; Tc = Tc / np.linalg.norm(Tc, axis=1, keepdims=True); zs = Xn @ Tc.T
te = ~is_train
res['cbd'] = {'acc': float((cbd[te].argmax(1) == y[te]).mean()), 'classname_acc': float((zs[te].argmax(1) == y[te]).mean()),
              'mean_descriptors': float(np.mean(n_desc)), 'gull_examples': {k: D[k] for k in dkeys if 'Gull' in k}}

# the film's gull photograph through the trained (sequential) CBM
from PIL import Image; from transformers import CLIPImageProcessor
improc = CLIPImageProcessor.from_pretrained(LOCAL)
with _t.no_grad():
    g = feat(clip.get_image_features(pixel_values=improc(images=Image.open(HERE.parent / 'assets' / 'gull_src.jpg').convert('RGB'), return_tensors='pt')['pixel_values'])).numpy()
g = g / np.linalg.norm(g); gx = (T(g) - mu) / sd
with torch.no_grad():
    pc = torch.sigmoid(gx @ Wg + bg)[0]; py = torch.softmax(f_seq(pc[None]), 1)[0]
top_c = pc.argsort(descending=True)[:8]; top_y = py.argsort(descending=True)[:4]
res['gull'] = {'top_concepts': [[names[int(i)], float(pc[i])] for i in top_c], 'top_species': [[classes[int(i)], float(py[i])] for i in top_y]}
res['concept_names'] = names; res['groups'] = groups
json.dump(res, open(HERE / 'cub_results.json', 'w'), indent=1)
print(json.dumps({k: v for k, v in res.items() if k not in ('concept_names', 'groups', 'intervention')}, indent=1)[:3000])
print('intervention ind', [round(v, 3) for v in res['intervention']['independent'][::4]])
print('intervention joint', [round(v, 3) for v in res['intervention']['joint'][::4]])

# classification by description on the film's gull photograph: per-descriptor CLIP cosine for four gull species
gk = ['Herring Gull', 'Western Gull', 'California Gull', 'Glaucous-winged Gull', 'Slaty-backed Gull']
gn = g[0] / np.linalg.norm(g[0]); per = {}
for key in gk:
    E = temb([f'{key}, {which(d)} {d}' for d in D[key]]); s = E @ gn
    per[key] = {'descriptors': D[key], 'cos': [float(v) for v in s], 'score': float(s.mean())}
allscore = np.array([(temb([f'{k}, {which(d)} {d}' for d in D[k]]) @ gn).mean() for k in dkeys])
order = np.argsort(-allscore)[:5]
res['cbd']['gull_photo'] = {'per_species': per, 'top': [[dkeys[i], float(allscore[i])] for i in order],
                            'classname_top': [[classes[i], float(v)] for i, v in zip(np.argsort(-(Tc @ gn))[:5], np.sort(-(Tc @ gn))[:5] * -1)]}
json.dump(res, open(HERE / 'cub_results.json', 'w'), indent=1)
print('gull cbd top', res['cbd']['gull_photo']['top'][:3], 'classname', res['cbd']['gull_photo']['classname_top'][:3])

# the class-level concept vector of one species (Koh et al.'s vote), for the "one training record" slide
hg = [i for i, c in enumerate(classes) if c.lower() == 'herring gull'][0]
res['herring_gull'] = {'class_index': hg, 'vector': [int(v) for v in cls_attr[hg][keep]], 'names': names}
json.dump(res, open(HERE / 'cub_results.json', 'w'), indent=1)

# the gull photo's full predicted concept vector (sequential model's g), for the intervention slide
res['gull']['pred_all'] = {names[i]: float(pc[i]) for i in range(len(names))}
res['gull']['feature_first'] = [float(v) for v in g[0][:4]]; res['gull']['feature_last'] = float(g[0][-1])
json.dump(res, open(HERE / 'cub_results.json', 'w'), indent=1)
