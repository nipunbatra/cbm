#!/usr/bin/env python3
"""compute.py: the worked examples of Part 10 (and the bypass example of Part 9), computed for real.

A tiny, licensed photo set: 12 Wikimedia Commons photographs each of zebras, horses and giraffes (worked/photos/,
licences in worked/photos/meta.json), split 8 train / 4 test per class by file order. Everything below runs on it:

  PCBM        CLIP ViT-B/32 image embeddings f(x) projected onto CLIP text vectors of a small concept bank, scores
              standardised on the training split, then a sparse (L1) multinomial logistic head. PCBM-h adds a
              residual linear model on f(x), fitted with the concept head frozen.
  LF-CBM      the Gemini concept lists (worked/llm_concepts.json, label-free prompts) -> filters (length, too similar
              to a class name, near-duplicates, not active on the images) -> CLIP image-concept similarity matrix P ->
              a projection W_c learned on ResNet-50 features to match P with the cos^3 objective -> interpretability
              cut -> sparse final layer trained with the task labels.
  LaBo        the Gemini sentences per class (LaBo prompt) -> greedy selection of 3 per class by discriminability and
              coverage -> CLIP scores as the bottleneck -> class-concept weights initialised from the language prior,
              then trained with the task labels.
  CEM         a hand-built 2-D embedding example on the Part 4 concepts (illustrative, not trained).

This is a teaching computation on 36 photos, not a benchmark. Writes worked/worked_examples.json.
  HF_HUB_OFFLINE=1 ~/base/bin/python worked/compute.py
"""
import json, math, os
from pathlib import Path
import numpy as np, torch
from PIL import Image

torch.manual_seed(0); np.random.seed(0)
HERE = Path(__file__).resolve().parent
PH = HERE / 'photos'
CLIP_DIR = os.environ.get('CLIP_DIR', '/Volumes/Extreme SSD/cbm-film/clip-vit-base-patch32')
CLASSES = ['zebra', 'horse', 'giraffe']
META = json.load(open(PH / 'meta.json'))
FILES = {c: sorted(f for f in META if f.startswith(c)) for c in CLASSES}
assert all(len(v) == 12 for v in FILES.values())
TRAIN = [(f, i) for i, c in enumerate(CLASSES) for f in FILES[c][:8]]
TEST = [(f, i) for i, c in enumerate(CLASSES) for f in FILES[c][8:]]
r4 = lambda a: np.round(np.asarray(a, float), 4).tolist()

# ------------------------------------------------------------------ encoders
from transformers import CLIPModel, CLIPTokenizerFast, CLIPImageProcessor
clip = CLIPModel.from_pretrained(CLIP_DIR).eval(); tok = CLIPTokenizerFast.from_pretrained(CLIP_DIR); improc = CLIPImageProcessor.from_pretrained(CLIP_DIR)
feat = lambda o: o if torch.is_tensor(o) else o.pooler_output
imgs = {f: Image.open(PH / f).convert('RGB') for f, _ in TRAIN + TEST}


@torch.no_grad()
def clip_img(files):
    v = feat(clip.get_image_features(pixel_values=improc(images=[imgs[f] for f in files], return_tensors='pt')['pixel_values']))
    return torch.nn.functional.normalize(v, dim=-1).numpy()


@torch.no_grad()
def clip_txt(texts):
    v = feat(clip.get_text_features(**tok(texts, return_tensors='pt', padding=True)))
    return torch.nn.functional.normalize(v, dim=-1).numpy()


import torchvision
rn = torchvision.models.resnet50(); rn.load_state_dict(torch.load(Path.home() / '.cache/torch/hub/checkpoints/resnet50-11ad3fa6.pth', weights_only=True))
rn.fc = torch.nn.Identity(); rn.eval()
rtf = torchvision.transforms.Compose([torchvision.transforms.Resize(256), torchvision.transforms.CenterCrop(224), torchvision.transforms.ToTensor(),
                                      torchvision.transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])])


@torch.no_grad()
def resnet(files):
    return rn(torch.stack([rtf(imgs[f]) for f in files])).numpy()


tr_f, tr_y = [f for f, _ in TRAIN], np.array([y for _, y in TRAIN])
te_f, te_y = [f for f, _ in TEST], np.array([y for _, y in TEST])
F_tr, F_te = clip_img(tr_f), clip_img(te_f)
EX = FILES['zebra'][8]  # the worked test image (first zebra of the test split)
ex_i = te_f.index(EX)


def softmax(z):
    z = np.asarray(z, float); e = np.exp(z - z.max(-1, keepdims=True)); return e / e.sum(-1, keepdims=True)


from sklearn.linear_model import LogisticRegression
OUT = {'classes': CLASSES, 'train': tr_f, 'test': te_f, 'example': EX, 'n_train': len(tr_f), 'n_test': len(te_f),
       'note': 'teaching computation on 36 Commons photographs (8 train / 4 test per class), not a benchmark'}

# ------------------------------------------------------------------ PCBM
BANK = ['black and white stripes', 'a long neck', 'a flowing mane', 'brown patches on a pale coat', 'hooves', 'a saddle', 'green grass', 'a wooden fence']
V = clip_txt(BANK)
S_tr, S_te = F_tr @ V.T, F_te @ V.T
mu, sd = S_tr.mean(0), S_tr.std(0) + 1e-6
Z_tr, Z_te = (S_tr - mu) / sd, (S_te - mu) / sd
pc = LogisticRegression(l1_ratio=1.0, C=0.3, solver='saga', max_iter=20000, random_state=0).fit(Z_tr, tr_y)
Wp, bp = pc.coef_, pc.intercept_
lg = Wp @ Z_te[ex_i] + bp
# PCBM-h: residual linear model on f(x), concept head frozen (fit by gradient descent on the residual logits)
Fr = torch.tensor(F_tr, dtype=torch.float32); base = torch.tensor(Z_tr @ Wp.T + bp, dtype=torch.float32)
Wr = torch.zeros(3, F_tr.shape[1], requires_grad=True); opt = torch.optim.Adam([Wr], lr=0.01)
for _ in range(400):
    opt.zero_grad(); loss = torch.nn.functional.cross_entropy(base + Fr @ Wr.T, torch.tensor(tr_y)) + 0.01 * (Wr ** 2).sum(); loss.backward(); opt.step()
Wr = Wr.detach().numpy(); res_ex = Wr @ F_te[ex_i]
# an intervention on PCBM: set the stripes score of the worked zebra to the mean of non-zebra training photos
zi = Z_te[ex_i].copy(); zi_edit = zi.copy(); zi_edit[0] = Z_tr[tr_y != 0, 0].mean()
OUT['pcbm'] = {
    'bank': BANK, 'scores_raw_example': r4(S_te[ex_i]), 'mean': r4(mu), 'std': r4(sd), 'z_example': r4(zi),
    'W': r4(Wp), 'b': r4(bp), 'nonzero': int((np.abs(Wp) > 1e-6).sum()), 'total_weights': int(Wp.size),
    'train_acc': float(pc.score(Z_tr, tr_y)), 'test_acc': float(pc.score(Z_te, te_y)),
    'logits_example': r4(lg), 'probs_example': r4(softmax(lg)),
    'edit': {'concept': BANK[0], 'z_from': round(float(zi[0]), 4), 'z_to': round(float(zi_edit[0]), 4),
             'logits': r4(Wp @ zi_edit + bp), 'probs': r4(softmax(Wp @ zi_edit + bp))},
    'hybrid': {'residual_logits_example': r4(res_ex), 'total_logits_example': r4(lg + res_ex), 'probs_example': r4(softmax(lg + res_ex)),
               'edited_total_logits': r4(Wp @ zi_edit + bp + res_ex), 'edited_probs': r4(softmax(Wp @ zi_edit + bp + res_ex)),
               'test_acc': float(((Z_te @ Wp.T + bp + F_te @ Wr.T).argmax(1) == te_y).mean())},
}

# ------------------------------------------------------------------ LF-CBM
LLM = json.load(open(HERE / 'llm_concepts.json'))
raw = []
for c in CLASSES:
    for k in ('features', 'around', 'superclasses'):
        for s in LLM['label_free'][c][k]['items']:
            s = s.strip().rstrip('.').lower()
            if s not in [r['concept'] for r in raw]: raw.append({'concept': s, 'from': f'{c}: {k}'})
names = [r['concept'] for r in raw]
T = clip_txt(names)
P_all = F_tr @ T.T                                # CLIP image-concept similarities on the training photos
top5 = np.sort(P_all, 0)[-5:].mean(0)
# text similarity for the name and duplicate filters: a sentence-embedding model, as in LF-CBM (which uses mpnet;
# all-MiniLM-L6-v2 is the small model in the local cache), mean-pooled and normalised
from transformers import AutoModel, AutoTokenizer
from huggingface_hub import snapshot_download
_st = snapshot_download('sentence-transformers/all-MiniLM-L6-v2', local_files_only=True)
_stm, _stt = AutoModel.from_pretrained(_st).eval(), AutoTokenizer.from_pretrained(_st)


@torch.no_grad()
def sent(texts):
    b = _stt(texts, return_tensors='pt', padding=True); h = _stm(**b).last_hidden_state
    m = b['attention_mask'].unsqueeze(-1).float(); v = (h * m).sum(1) / m.sum(1)
    return torch.nn.functional.normalize(v, dim=-1).numpy()


Es, Ec = sent(names), sent(CLASSES)
CUT = {'max_len': 30, 'class_sim': 0.85, 'dup_sim': 0.85, 'top5_clip': 0.24, 'interp': 0.45}
keep = []
for j, r in enumerate(raw):
    why = None
    words = r['concept'].replace('-', ' ').split()
    hit = [c for c in CLASSES if c in words or c + 's' in words or c + '-like' in r['concept']]
    if len(r['concept']) > CUT['max_len']: why = 'longer than 30 characters'
    elif hit: why = f"contains the class name ({hit[0]})"
    elif (Es[j] @ Ec.T).max() > CUT['class_sim']: why = f"too similar to a class name ({CLASSES[int((Es[j] @ Ec.T).argmax())]})"
    elif any(Es[j] @ Es[k] > CUT['dup_sim'] for k in keep): why = f"near-duplicate of '{names[[k for k in keep if Es[j] @ Es[k] > CUT['dup_sim']][0]]}'"
    elif top5[j] < CUT['top5_clip']: why = 'barely active on the photos (CLIP top-5 mean below 0.24)'
    r['top5_clip'] = round(float(top5[j]), 4); r['class_sim'] = round(float((Es[j] @ Ec.T).max()), 4)
    r['removed'] = why
    if why is None: keep.append(j)
# the projection needs no labels: learn it on every unlabelled photo we have except the 12 test photos
# (worked/photos_raw, 72 candidates), each seen in 6 random crops and flips; P is CLIP's score for the same crops
RAW = HERE / 'photos_raw'
pool_files = sorted(f for f in os.listdir(RAW) if f.endswith('.jpg') and f not in te_f)
aug = torchvision.transforms.Compose([torchvision.transforms.RandomResizedCrop(320, scale=(0.5, 1.0)), torchvision.transforms.RandomHorizontalFlip()])
g = torch.Generator().manual_seed(0); torch.manual_seed(0)
pool_imgs = [aug(Image.open(RAW / f).convert('RGB')) for f in pool_files for _ in range(6)]
with torch.no_grad():
    B_pool = rn(torch.stack([rtf(im) for im in pool_imgs])).numpy()
    Fp = torch.nn.functional.normalize(feat(clip.get_image_features(pixel_values=improc(images=pool_imgs, return_tensors='pt')['pixel_values'])), dim=-1).numpy()
B_tr, B_te = resnet(tr_f), resnet(te_f)
bm, bs = B_pool.mean(0), B_pool.std(0) + 1e-6
Bpool = torch.tensor((B_pool - bm) / bs, dtype=torch.float32)
Btr, Bte = torch.tensor((B_tr - bm) / bs, dtype=torch.float32), torch.tensor((B_te - bm) / bs, dtype=torch.float32)
P = torch.tensor((Fp @ T.T)[:, keep], dtype=torch.float32)


def cos3(q, p):  # LF-CBM similarity: standardise each column over images, cube elementwise, cosine
    q = (q - q.mean(0)) / (q.std(0) + 1e-6); p = (p - p.mean(0)) / (p.std(0) + 1e-6)
    q, p = q ** 3, p ** 3
    return (q * p).sum(0) / (q.norm(dim=0) * p.norm(dim=0) + 1e-9)


Wc = (0.001 * torch.randn(len(keep), Btr.shape[1])).requires_grad_(); opt = torch.optim.Adam([Wc], lr=1e-3, weight_decay=1e-3)
for step in range(1500):
    opt.zero_grad(); loss = -cos3(Bpool @ Wc.T, P).mean(); loss.backward(); opt.step()
# interpretability cut, measured on the 24 labelled training photos (not used to learn the projection)
sim = cos3(Btr @ Wc.T, torch.tensor(P_all[:, keep], dtype=torch.float32)).detach().numpy()
kept2 = [i for i, s in enumerate(sim) if s >= CUT['interp']]
for i, j in enumerate(keep):
    raw[j]['projection_sim'] = round(float(sim[i]), 4)
    if i not in kept2: raw[j]['removed'] = 'projection does not match its CLIP target (cos^3 similarity below 0.45)'
final = [keep[i] for i in kept2]
A_tr = (Btr @ Wc.T).detach().numpy()[:, kept2]; A_te = (Bte @ Wc.T).detach().numpy()[:, kept2]
am, asd = A_tr.mean(0), A_tr.std(0) + 1e-6
Az_tr, Az_te = (A_tr - am) / asd, (A_te - am) / asd
lf = LogisticRegression(l1_ratio=1.0, C=0.4, solver='saga', max_iter=20000, random_state=0).fit(Az_tr, tr_y)
Wl, bl = lf.coef_, lf.intercept_
lgl = Wl @ Az_te[ex_i] + bl
clip_ex = (F_te[ex_i] @ T.T)[final]
OUT['lfcbm'] = {
    'llm_model': LLM['model'], 'llm_date': LLM['date'], 'cutoffs': CUT, 'candidates': raw, 'n_candidates': len(raw),
    'n_after_filters': len(keep), 'final': [names[j] for j in final], 'n_final': len(final),
    'backbone': 'ResNet-50 (torchvision IMAGENET1K_V2), 2048-d pooled features', 'projection_steps': 1500, 'projection_pool': f'{len(pool_files)} unlabelled photos x 6 random crops = {len(pool_imgs)} images',
    'example_activation_z': r4(Az_te[ex_i]), 'example_clip_target': r4(clip_ex),
    'example_corr_projection_vs_clip': round(float(np.corrcoef(A_te[ex_i], clip_ex)[0, 1]), 4),
    'W': r4(Wl), 'b': r4(bl), 'nonzero': int((np.abs(Wl) > 1e-6).sum()), 'total_weights': int(Wl.size),
    'train_acc': float(lf.score(Az_tr, tr_y)), 'test_acc': float(lf.score(Az_te, te_y)),
    'logits_example': r4(lgl), 'probs_example': r4(softmax(lgl)),
}

# ------------------------------------------------------------------ LaBo
cands = [(s.strip().rstrip('.'), i) for i, c in enumerate(CLASSES) for s in LLM['labo'][c]['items']]
Tl = clip_txt([s for s, _ in cands]); Ml = F_tr @ Tl.T
cls_mean = np.stack([Ml[tr_y == k].mean(0) for k in range(3)], 1)          # candidate x class
disc = np.array([cls_mean[j, y] - np.delete(cls_mean[j], y).max() for j, (_, y) in enumerate(cands)])
K = 3; sel = []
for y in range(3):
    idx = [j for j, (_, yy) in enumerate(cands) if yy == y]
    S_txt = Tl[idx] @ Tl[idx].T; chosen = []
    dn = (disc[idx] - disc[idx].min()) / (np.ptp(disc[idx]) + 1e-9)
    for _ in range(K):
        best, bestv, parts = None, -1e9, None
        for a in range(len(idx)):
            if a in chosen: continue
            cov_now = S_txt[:, chosen].max(1).sum() if chosen else 0.0
            gain = S_txt[:, chosen + [a]].max(1).sum() - cov_now
            v = 0.7 * dn[a] + 0.3 * gain / len(idx)
            if v > bestv: best, bestv, parts = a, v, (float(dn[a]), float(gain / len(idx)))
        chosen.append(best)
        sel.append({'class': CLASSES[y], 'concept': cands[idx[best]][0], 'disc_norm': round(parts[0], 4), 'coverage_gain': round(parts[1], 4), 'score': round(float(bestv), 4)})
sidx = [next(j for j, (s, _) in enumerate(cands) if s == r['concept']) for r in sel]
Xl_tr, Xl_te = 100 * (F_tr @ Tl[sidx].T), 100 * (F_te @ Tl[sidx].T)  # CLIP logit scale
W0 = np.zeros((3, len(sidx)))
for j, r in enumerate(sel): W0[CLASSES.index(r['class']), j] = 1.0 / K
lg0 = W0 @ Xl_te[ex_i]
Wt = torch.tensor(W0, dtype=torch.float32, requires_grad=True); bt = torch.zeros(3, requires_grad=True)
xm, xs = Xl_tr.mean(0), Xl_tr.std(0) + 1e-6
Xtr = torch.tensor(Xl_tr, dtype=torch.float32); opt = torch.optim.Adam([Wt, bt], lr=0.01)
for _ in range(300):
    opt.zero_grad(); loss = torch.nn.functional.cross_entropy(Xtr @ Wt.T + bt, torch.tensor(tr_y)) + 1e-3 * ((Wt - torch.tensor(W0, dtype=torch.float32)) ** 2).sum(); loss.backward(); opt.step()
Wt, bt = Wt.detach().numpy(), bt.detach().numpy()
lgt = Wt @ Xl_te[ex_i] + bt
OUT['labo'] = {
    'llm_model': LLM['model'], 'candidates': [{'concept': s, 'class': CLASSES[y], 'disc': round(float(disc[j]), 4)} for j, (s, y) in enumerate(cands)],
    'selected': sel, 'selection_rule': '0.7 x normalised discriminability + 0.3 x coverage gain (facility location on CLIP text similarity), greedy, 3 per class',
    'example_scores': r4(Xl_te[ex_i]), 'W_prior': r4(W0), 'W_trained': r4(Wt), 'b_trained': r4(bt),
    'logits_prior': r4(lg0), 'probs_prior': r4(softmax(lg0)), 'logits_trained': r4(lgt), 'probs_trained': r4(softmax(lgt)),
    'test_acc_prior': float(((Xl_te @ W0.T).argmax(1) == te_y).mean()), 'test_acc_trained': float(((Xl_te @ Wt.T + bt).argmax(1) == te_y).mean()),
}

# ------------------------------------------------------------------ CEM (illustrative, on the Part 4 concepts)
cplus = {'stripes': [0.82, 0.30], 'horse-like shape': [0.75, 0.40], 'long neck': [0.85, 0.20]}
cminus = {'stripes': [0.22, 0.74], 'horse-like shape': [0.30, 0.80], 'long neck': [0.20, 0.70]}
pz = {'stripes': 0.1, 'horse-like shape': 0.9, 'long neck': 0.1}
Wpart4 = np.array([[3, 1, 0], [-1, 2, -1], [-1, 0, 3]], float)
u = {k: (np.array(cplus[k]) - np.array(cminus[k])) / np.sum((np.array(cplus[k]) - np.array(cminus[k])) ** 2) for k in cplus}
We = np.concatenate([np.outer(Wpart4[:, i], u[k]) for i, k in enumerate(cplus)], 1)  # head reading each embedding along c+ - c-


def cem(p):
    e = np.concatenate([p[k] * np.array(cplus[k]) + (1 - p[k]) * np.array(cminus[k]) for k in cplus])
    return e, We @ e


e0, l0 = cem(pz); p1 = dict(pz, stripes=1.0); e1, l1 = cem(p1)
OUT['cem'] = {'concepts': list(cplus), 'c_plus': cplus, 'c_minus': cminus, 'p': pz, 'embedding': r4(e0), 'embedding_edit': r4(e1),
              'head': r4(We), 'logits': r4(l0), 'logits_edit': r4(l1), 'probs': r4(softmax(l0)), 'probs_edit': r4(softmax(l1)),
              'note': 'illustrative embeddings; the head reads each concept embedding along c+ minus c-, so its scores equal Part 4 plus a constant'}

json.dump(OUT, open(HERE / 'worked_examples.json', 'w'), indent=1, ensure_ascii=False)
print('PCBM test acc', OUT['pcbm']['test_acc'], 'nonzero', OUT['pcbm']['nonzero'], '/', OUT['pcbm']['total_weights'], 'probs', OUT['pcbm']['probs_example'])
print('PCBM edit', OUT['pcbm']['edit']['probs'], 'hybrid', OUT['pcbm']['hybrid']['probs_example'], '->', OUT['pcbm']['hybrid']['edited_probs'])
print('LF candidates', len(raw), 'after filters', len(keep), 'final', len(final), OUT['lfcbm']['final'])
print('LF removed:', [(r['concept'], r['removed']) for r in raw if r['removed']][:12])
print('LF test acc', OUT['lfcbm']['test_acc'], 'nonzero', OUT['lfcbm']['nonzero'], 'corr', OUT['lfcbm']['example_corr_projection_vs_clip'], 'probs', OUT['lfcbm']['probs_example'])
print('LaBo selected', [(r['class'], r['concept']) for r in sel])
print('LaBo prior acc', OUT['labo']['test_acc_prior'], 'trained', OUT['labo']['test_acc_trained'], OUT['labo']['probs_prior'], OUT['labo']['probs_trained'])
print('CEM', OUT['cem']['logits'], '->', OUT['cem']['logits_edit'])
