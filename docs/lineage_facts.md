# CBM lineage: fact sheet (verified against primary sources)

Checked 2026-10-11. Every number below was read from the primary PDF (arXiv, PMLR, NeurIPS proceedings, PMC full text) or the official GitHub repo. "≈" means read off a plot, not printed as a number. "UNVERIFIED" means I could not find the number in a primary source.

---

## 1. Koh et al. 2020, Concept Bottleneck Models

**Citation:** Pang Wei Koh\*, Thao Nguyen\*, Yew Siang Tang\*, Stephen Mussmann, Emma Pierson, Been Kim, Percy Liang. *Concept Bottleneck Models.* ICML 2020 (PMLR 119). arXiv:2007.04612 (v3). Code: github.com/yewsiang/ConceptBottleneck

### (a) CUB preprocessing (Sec 4.1 and App. A.2; code `CUB/data_processing.py`, `CUB/tti.py`)

| Item | Value | Source |
|---|---|---|
| Images | 11,788 | Sec 4.1 and App. A.2 |
| Classes | 200 species | App. A.2 |
| Original attributes | 312 binary attributes, each with per-image visibility | App. A.2 (the CUB README header says "322", a typo; `attributes.txt` and `class_attribute_labels_continuous.txt` have 312) |
| Kept concepts | **k = 112** | Sec 4.1 and App. A.2 |
| Filtering rule | (1) Majority vote per class: "if more than 50% of crows have black wings… set all crows to have black wings", giving class-level concepts. (2) Keep attributes "present after majority voting in at least 10 classes". The code also skips annotations marked `is_present=0` with certainty 1 ("not visible") when it counts votes. | App. A.2; code: `mask = np.where(attr_class_count >= 10)` |
| Official split | 5,994 train / 5,794 test | Counted from `train_test_split.txt`; Havasi et al. 2022 Sec 5.1 gives the same split |
| Koh split | "randomly split 20% of the data from the official train set to make a validation set" | App. A.2 |
| Implied sizes | train 4,796 / val 1,198 / test 5,794 | Derived: `int(0.2 × 5994) = 1198` (code `val_ratio = 0.2`). **The paper does not print these numbers.** |
| Attribute groups | **28** | Code `tti.py`: `-n_groups … default=28`. Groups share a name prefix, e.g. "has_back_pattern::…" (App. B.3). The CUB Figure 4 x-axis also runs to about 28. The paper text never says "28". |
| Backbone / heads | Inception-v3 (x→c); c→y is a single linear layer (CUB). OAI: ResNet-18 + 3-layer MLP | Sec 4.1 |
| Joint λ | λ = 0.01 (CUB), λ = 1 (OAI) | Sec 4.1 |
| Final training | Models are retrained on train+val after the hyperparameter search | App. B.2 |

### (b) Task and concept error (test set, ±2SD over seeds)

Table 1 (task) and Table 2 (concept):

| Model | y RMSE (OAI) | y error (CUB) | c RMSE (OAI) | c error (CUB) |
|---|---|---|---|---|
| Independent | 0.435 ± 0.024 | 0.240 ± 0.012 | 0.529 ± 0.004 | 0.034 ± 0.002 |
| Sequential | 0.418 ± 0.004 | 0.243 ± 0.006 | 0.527 ± 0.004 | 0.034 ± 0.002 |
| Joint | 0.418 ± 0.004 | 0.199 ± 0.006 | 0.543 ± 0.014 | 0.031 ± 0.000 |
| Standard | 0.441 ± 0.006 | 0.175 ± 0.008 | 0.680 ± 0.038 (linear probe) | 0.093 ± 0.004 (linear probe) |
| Standard, no bottleneck | 0.443 ± 0.008 | 0.173 ± 0.003 | – | – |
| Multitask | 0.425 ± 0.010 | 0.162 ± 0.002 | – | – |
| SENN (linear probe) | – | – (could not run on CUB, footnote 4) | 0.676 ± 0.026 | – |

- **CUB accuracy:** Joint 80.1%, Independent 76.0%, Sequential 75.7%, Standard 82.5%.
- **"Joint, from sigmoid"** (c→y uses probabilities instead of logits) has task error **0.224**, against 0.199 for the normal joint model (Sec 6.2).
- **TravelingBirds background shift** (Table 3), y error: Standard 0.627, Joint 0.482, Sequential 0.496, Independent 0.482.

### (c) Test-time intervention (Fig. 4; Sec 6)

**OAI (text):** "querying for just 2 concepts reduces task RMSE from >0.4 to ≈0.3". OAI interventions follow a fixed order, ranked on the validation set (App. B.3). Independent is best once all k = 10 concepts are replaced, but slightly worse with no intervention.

OAI curves, read off Fig. 4-Left (nonlinear c→y), y RMSE:

| Model | 0 concepts | all 10 concepts |
|---|---|---|
| Independent | ≈0.43 | ≈0.16 |
| Sequential | ≈0.42 | ≈0.235 |
| Joint | ≈0.43 | ≈0.245 |
| Control (joint, λ = 0.01) | ≈0.44 | ≈0.455 (gets worse) |

**CUB:**
- Interventions use concept groups, chosen in random order.
- For sequential and joint models, the logit is set to the 5th or 95th percentile.
- Concepts that are not visible are set to 0.

CUB curves, read off Fig. 4-Right, y error (x-axis 0 to ≈28 groups):

| Model | 0 groups | all groups |
|---|---|---|
| Independent | ≈0.24 | ≈0.025 |
| Sequential | ≈0.245 | ≈0.11 |
| Joint (from logits) | ≈0.20 | ≈0.11 (minimum ≈0.095 near 20 groups) |
| Joint, from sigmoid | ≈0.23 | ≈0.06 |

- **Text:** "it took intervention on several concept groups to see a large gain". Intervention was "more effective on independent bottleneck models than on the sequential and joint models".
- **Caveat stated in the paper:** the CUB numbers are optimistic. They use denoised class-level concepts and an oracle that makes no mistakes.

### (d) OAI setup (Sec 4.1, App. A.1)

| Item | Value |
|---|---|
| Size | 36,369 observations (one knee, one patient, one timepoint) from 4,172 patients |
| Split (by patient) | Train 21,340 obs / 2,456 people; val 3,709 / 421; test 11,320 / 1,295 |
| Target | Kellgren–Lawrence grade (KLG), originally 0–4. KLG 0 and 1 were merged, giving a 4-level target (0–3), treated as regression |
| Concepts | **k = 10** ordinal clinical concepts, kept from 18 by dropping any concept whose dominant class is ≥ 95% of the training data. The 10 are osteophytes (femur/tibia × medial/lateral), sclerosis (femur/tibia × medial/lateral) and joint space narrowing (medial/lateral) |
| Images | Downsampled to 512×512 |

---

## 2. CUB certainty levels (dataset files)

**Citation:** Wah, Branson, Welinder, Perona, Belongie. *The Caltech-UCSD Birds-200-2011 Dataset.* Caltech Tech Report CNS-TR-2011-001, 2011.

| certainty_id | name (`attributes/certainties.txt`) |
|---|---|
| 1 | not visible |
| 2 | guessing |
| 3 | probably |
| 4 | definitely |

- **Format:** each line of `image_attribute_labels.txt` is `<image_id> <attribute_id> <is_present> <certainty_id> <time>`, with one line per image/attribute/worker (CUB README).
- **Koh code:** has the same mapping as a comment, "1 = not visible, 2 = guessing, 3 = probably, 4 = definitely" (`CUB/data_processing.py`).
- **Where I checked it:** a verbatim copy of `certainties.txt` and the README in public mirrors of the dataset on GitHub, plus Koh's code. I did not download the official tarball.

---

## 3. Espinosa Zarlenga et al. 2022, Concept Embedding Models (CEM)

**Citation:** M. Espinosa Zarlenga, P. Barbiero, G. Ciravegna, G. Marra, F. Giannini, M. Diligenti, Z. Shams, F. Precioso, S. Melacci, A. Weller, P. Liò, M. Jamnik. *Concept Embedding Models: Beyond the Accuracy-Explainability Trade-Off.* NeurIPS 2022. arXiv:2209.09056 (v2).

**Embedding (Sec 3.1):** ĉ_i = p̂_i ĉ_i⁺ + (1 − p̂_i) ĉ_i⁻
- p̂_i comes from a scoring function shared across concepts, applied to [ĉ_i⁺, ĉ_i⁻].
- The bottleneck has k·m units, with m = 16 for CUB.
- The label predictor f is a single linear layer.
- **Intervention:** set p̂_i := c_i, which swaps in ĉ_i⁺ or ĉ_i⁻.

**RandInt:** during training, each concept is intervened on independently with probability **p_int = 0.25** (Sec 3.2, App. A.5/A.6).

**Slide-review clarification (15 October 2026):** [Sections 3.1 and 3.2 of the original paper](https://arxiv.org/html/2209.09056v2#S3.SS1)
confirm that the two embeddings are outputs of concept-specific learned layers applied to the current image's
features. They are not stored example photos or fixed class centroids. The shared scoring layer reads both
embeddings to predict concept probability. Joint training uses concept and task losses; there are no supplied
coordinate targets for the embeddings. At ordinary test time the weights stay fixed, all embeddings and probabilities
are computed from the new image, and mixing uses predicted probabilities. RandInt changes the mixing probability
during training while the concept loss still supervises the original prediction. The lecture's animal CEM vectors
and head remain illustrative, not outputs of a trained animal CEM.


**CUB setup:**
- k = 112, Koh's splits, ResNet-34 backbone (App. A.6).
- Concept loss weight α = 5.

**CUB task accuracy (App. Table 1, mean with 95% CI):**

| Model | CUB task acc (%) |
|---|---|
| No concepts (black box) | 73.41 (71.83, 74.70) |
| Boolean-CBM (joint, hard threshold) | 67.11 (65.29, 68.56) |
| Fuzzy-CBM (joint, sigmoid) | 72.98 (70.39, 76.30) |
| Hybrid-CBM (joint + extra unsupervised units) | 70.70 (64.28, 77.68) |
| **CEM** | **77.11 (75.89, 78.10)** |

**CUB concept alignment score (CAS, App. Table 2):** CEM 86.14; Hybrid 83.19; Bool 81.18; Fuzzy 80.79; No concepts 82.12.

**CUB mean concept accuracy:** no table. The bar plot (Fig. A.10a) puts all CBM variants at ≈95–96%.
- The text says "all concept-based models achieve a similar high mean concept accuracy across all datasets."
- An exact CEM-vs-joint concept accuracy number is **UNVERIFIED** (plot only).
- Related number from App. A.9 (25% of concepts given): Hybrid-CBM reached 77.15 ± 0.33% task and 95.3 ± 0.31% concept accuracy; CEM reached 76.76 ± 0.27% and 95.47 ± 0.19%.

---

## 4. Yuksekgonul et al. 2023, Post-hoc CBMs (PCBM)

**Citation:** Mert Yuksekgonul, Maggie Wang, James Zou. *Post-hoc Concept Bottleneck Models.* ICLR 2023. arXiv:2205.15480 (v2).

**CUB, Table 1** (accuracy; mean ± SE over 10 seeds). Backbone is ResNet-18 pretrained on CUB (imgclsmob); concepts are Koh's 112 with Koh's splits.

| Model | CUB acc |
|---|---|
| Original model | 0.612 |
| PCBM | 0.588 ± 0.008 |
| PCBM-h | 0.610 ± 0.010 |

**Other columns of Table 1** (original / PCBM / PCBM-h):

| Dataset | Original | PCBM | PCBM-h |
|---|---|---|---|
| CIFAR10 | 0.888 | 0.777 | 0.871 |
| CIFAR100 | 0.701 | 0.520 | 0.680 |
| HAM10000 (AUROC) | 0.963 | 0.947 | 0.962 |
| ISIC (AUROC) | 0.821 | 0.736 | 0.801 |

**How concepts are obtained:**
1. **CAVs:**
   - For each concept, a linear SVM separates the embeddings of positive and negative examples. The normal to the boundary is the CAV.
   - 50 pairs of images per concept.
   - On CUB, the CAVs come from the CUB attribute annotations. On other datasets they come from separate held-out concept datasets: BRODEN (170 concepts) or Derm7pt (8 concepts).
2. **Multimodal (CLIP) concepts:**
   - Concept names are taken from ConceptNet relations (206 / 527 / 822 concepts for CIFAR10 / CIFAR100 / COCO-Stuff).
   - They are embedded with the CLIP-RN50 text encoder.
   - Table 2: PCBM with CLIP concepts gets 0.833 on CIFAR10 and 0.600 on CIFAR100. Not run on CUB.

**PCBM-h:** a residual predictor is fit sequentially on top of the fixed PCBM.

**Comparison to CBM:** CBM "can only reach a similar performance to PCBM with 20x more annotations" (App. C).

---

## 5. Oikarinen et al. 2023, Label-Free CBM (LF-CBM)

**Citation:** Tuomas Oikarinen, Subhro Das, Lam M. Nguyen, Tsui-Wei Weng. *Label-Free Concept Bottleneck Models.* ICLR 2023. arXiv:2304.06129 (v2).

**Table 2 (accuracy):**

| Model | Sparse final layer | CUB200 |
|---|---|---|
| Standard | No | 76.70% |
| Standard (sparse) | Yes | 75.96% |
| P-CBM | Yes | 59.60%\* (as reported by Yuksekgonul; the PCBM paper itself gives 0.588) |
| **LF-CBM** | Yes | **74.31% ± 0.29%** |

- \* means the number was taken from the cited paper.
- The CUB backbone is the same ResNet-18 as PCBM.
- **Number of concepts:** 211 for CUB. Others: 128 (CIFAR-10), 824 (CIFAR-100), 2202 (Places365), 4505 (ImageNet).
  - Concepts are generated by GPT-3 and then filtered.
  - The paper notes that CUB's 312 annotated attributes exist, but LF-CBM does not use them.

**cos³ objective (Eq. 1):**
- L(W_c) = Σ_i −sim(t_i, q_i), with sim = cos( q̄_i³ , P̄_{:,i}³ ).
- Both vectors are standardised (mean 0, sd 1) and cubed element-wise.
- Purpose: "make the similarity more sensitive to highly activating inputs."
- Concepts with validation sim < 0.45 are dropped.

**Sparse final layer (Eq. 2):**
- Elastic net solved with GLM-SAGA, α = 0.99.
- λ is chosen to give **25 to 35 nonzero weights per output class**.

---

## 6. Yang et al. 2023, LaBo (Language in a Bottle)

**Citation:** Yue Yang, Artemis Panagopoulou, Shenghao Zhou, Daniel Jin, Chris Callison-Burch, Mark Yatskar. *Language in a Bottle: Language Model Guided Concept Bottlenecks for Interpretable Image Classification.* CVPR 2023. arXiv:2211.11158 (v2).

**CUB test accuracy (App. Table 10; CLIP ViT-L/14; 50 concepts per class):**

| Shots | 1 | 2 | 4 | 8 | 16 | Full |
|---|---|---|---|---|---|---|
| Linear probe | 47.69 | 61.06 | 72.82 | 79.60 | 83.74 | 84.54 |
| **LaBo** | **54.19** | 64.60 | 71.21 | 77.22 | 80.69 | **81.90** |

**Table 3 (CUB, ViT-B/32, vs CompDL):**

| Model | 1-shot | 5-shot | Full |
|---|---|---|---|
| LaBo | 35.1 | 55.7 | 71.8 |
| Linear probe | 28.4 | 55.4 | 75.5 |
| CompDL | 13.6 | 33.2 | 52.6 |

**Average over 11 datasets (Table 1):** LaBo 63.35 at 1-shot vs 51.69 for the linear probe; 85.72 vs 87.38 at full data.

**Concept selection (Sec 3.2, Eq. 2):**
- Monotone submodular F(C_y) = α·Σ D(c) (discriminability) + β·Σ_{c1∈S_y} max_{c2∈C_y} φ(c1, c2) (coverage).
- Optimised greedily with the `apricot` package.
- Candidate concepts come from GPT-3 (text-davinci-002), with class names removed.

**Ablation (Table 5, 11-dataset mean, full data):** submodular 85.71; random 85.06; similarity 84.88.

---

## 7. Srivastava et al. 2024, VLG-CBM

**Citation:** Divyansh Srivastava\*, Ge Yan\*, Tsui-Wei Weng. *VLG-CBM: Training Concept Bottleneck Models with Vision-Language Guidance.* NeurIPS 2024. arXiv:2408.01432 (v3).

**NEC (Eq. 9):** NEC(W_F) = (1/C) Σ_{i=1..C} Σ_{j=1..k} 1{(W_F)_ij ≠ 0}
- In words: "the average number of concepts the model uses to predict a class."
- ANEC-5 is accuracy at NEC = 5.
- ANEC-avg is mean accuracy over NEC ∈ {5, 10, 15, 20, 25, 30}.

**CUB results:**

| Backbone | Model | ANEC-5 | ANEC-avg |
|---|---|---|---|
| CLIP-RN50 (Table 2) | Random CBL (512 neurons) | 25.37% | 40.13% |
| CLIP-RN50 | LF-CBM | 31.35% | 52.70% |
| CLIP-RN50 | LM4CV | 3.63% | 15.25% |
| CLIP-RN50 | LaBo | 41.97% | 59.27% |
| CLIP-RN50 | **VLG-CBM** | **60.38%** | **66.03%** |
| Non-CLIP, CUB ResNet-18 (Table 3) | Random CBL | 68.91% | 73.44% |
| Non-CLIP | LF-CBM | 53.51% | 69.11% |
| Non-CLIP | **VLG-CBM** | **75.79%** | **75.82%** |

On the non-CLIP backbone, the random CBL beats LF-CBM.

**Critique of LF-CBM and LaBo (Sec 1, Sec 4):**
1. **Inaccurate concept prediction.** Predicted concepts "often contain factual errors i.e. the predicted concepts do not match the image". LLM-generated concepts include non-visual ones, "loud music" or "location" in LF-CBM.
2. **Information leakage.** "even a set of random concepts could achieve comparable test accuracy to state-of-the-art CBMs". This builds on Yan et al. 2023 (LM4CV, ICCV) and on Mahinpei 2021 / Margeloiu 2021.
   - Theorem 4.1 shows that a random, untrained CBL can approximate any linear classifier once there are enough concepts.
   - This is why VLG-CBM controls NEC.
   - Roth et al. are cited for random words and characters matching CLIP zero-shot accuracy.

---

## 8. Menon & Vondrick 2023, Classification by Description

**Citation:** Sachit Menon, Carl Vondrick. *Visual Classification via Description from Large Language Models.* ICLR 2023. arXiv:2210.07183 (v2).

**Score (Eq. 1):** s(c, x) = (1/|D(c)|) Σ_{d∈D(c)} φ(d, x). The prediction is argmax_c s(c, x).
- The paper calls φ "the log probability that descriptor d pertains to the image x".
- The released code computes it as the CLIP image–text dot product and takes the **mean** per class (`aggregate_similarity(..., 'mean')`).
- Descriptor text template: "{class} which (is/has) {descriptor}".

**CUB accuracy (Table 1; "Ours" vs the CLIP class-name baseline):**

| Backbone | Ours | CLIP | Δ |
|---|---|---|---|
| ViT-B/32 | 52.57 | 51.95 | 0.62 |
| ViT-B/16 | 57.75 | 56.35 | 1.40 |
| ViT-L/14 | 63.46 | 63.08 | 0.38 |
| ViT-L/14@336px | 65.257 | 63.41 | 1.847 |

ImageNet for comparison: ViT-B/32 62.97 vs 58.46 (+4.51). The text calls the CUB gain "∼1-2%".

**CUB descriptors file:**
- URL: https://raw.githubusercontent.com/sachit-menon/classify_by_description_release/master/descriptors/descriptors_cub.json
- The default branch is `master`.
- 200 classes, ≈6.6 descriptors per class on average.
- Example: "Black-footed Albatross" → "a seabird", "black and white", "a long, hooked bill", "long, narrow wings", "black feet", "a white head and neck".

---

## 9. Non-visual CBM examples

### (a) CEBaB

**Citation:** E. D. Abraham\*, K. D'Oosterlinck\*, A. Feder\*, Y. Gat\*, A. Geiger\*, C. Potts\*, R. Reichart\*, Z. Wu\*. *CEBaB: Estimating the Causal Effects of Real-World Concepts on NLP Model Behavior.* NeurIPS 2022. arXiv:2205.14140.

- **Source data:** 2,299 original OpenTable reviews (1,084 restaurants), expanded by crowdsourced edits to **15,089 texts**.
- **Concepts:** four aspects (**food, service, ambiance, noise**). Each is labelled positive, negative or unknown.
- **Task label:** overall rating on a **five-star scale**, assigned by 5 crowdworkers.
- **Note:** CEBaB is a causal-explanation benchmark. The paper never uses the word "bottleneck". It works as a CBM dataset because it has concept labels, and TBM uses it (below).

### (b) Text CBMs

**Text Bottleneck Model (TBM).** Josh Magnus Ludan, Qing Lyu, Yue Yang, Liam Dugan, Mark Yatskar, Chris Callison-Burch. *Interpretable-by-Design Text Understanding with Iteratively Generated Concept Bottleneck.* arXiv:2310.19660 (v2, preprint "under review").
- Concepts are generated and measured by GPT-4; a linear model sits on top.
- 250 training and 250 test examples per dataset.
- Headline (Table 2): mean accuracy over 3 sentiment classification sets is **0.896**, against 0.900 for fine-tuned GPT-3.5 and 0.825 for DeBERTa.
- CEBaB MSE: 0.367 (TBM) vs 0.346 (DeBERTa) vs 0.300 (fine-tuned GPT-3.5).

**CB-LLM.** Chung-En Sun, Tuomas Oikarinen, Berk Ustun, Tsui-Wei Weng. *Concept Bottleneck Large Language Models.* ICLR 2025. arXiv:2412.07992 (v4).
- Concept counts: 208 (SST2), 248 (YelpP), 216 (AGnews), 476 (DBpedia).
- Table 2 (test accuracy):

| Model | SST2 | YelpP | AGnews | DBpedia |
|---|---|---|---|---|
| CB-LLM w/ ACC | 0.9407 | 0.9806 | 0.9453 | 0.9928 |
| RoBERTa-base fine-tuned (black box) | 0.9462 | 0.9778 | 0.9508 | 0.9917 |
| TBM & C3M | 0.9270 | 0.9534 | 0.8972 | 0.9843 |

### (c) X-CHAR (human activity recognition)

**Citation:** Jeya Vikranth Jeyakumar, Ankur Sarker, Luis Antonio Garcia, Mani Srivastava. *X-CHAR: A Concept-based Explainable Complex Human Activity Recognition Model.* Proc. ACM IMWUT 7(1), Article 17, 2023. DOI 10.1145/3580804 (PMC10961595; no arXiv found).

- **Concepts:** simple or low-level activities, modelled as a sequence with CTC loss, so no exact start and end times are needed.
  - Nurse dataset, 6 concepts: check vitals, collect blood, check blood glucose, oral care, clean patient, drips.
  - Opportunity: 17 concepts.
  - CRAA (audio): 11 concepts.
- **Table 5:**

| Dataset | X-CHAR F1 | Vanilla CBM F1 | X-CHAR concept acc | CBM concept acc |
|---|---|---|---|---|
| Nurse | 0.9698 | 0.9244 | 89.35% | 87.40% |
| Opportunity | 0.8357 | 0.7726 | – | – |
| CRAA | 0.9886 | 0.9032 | – | – |

### (d) Clinical time series

**Citation:** Carissa Wu, Sonali Parbhoo, Marton Havasi, Finale Doshi-Velez. *Learning Optimal Summaries of Clinical Time-series with Concept Bottleneck Models.* MLHC 2022, PMLR 182:1–25.

- **Task:** predict vasopressor onset in the ICU, using MIMIC-III.
- **Cohort:** 15,552 adult patients, 1,528 (9.83%) of whom needed vasopressors.
- **Concepts:** learned without labels. They are sparse groups of time-series summary features, e.g. "illness severity" or "kidney function", with a feature budget.
- **Claim:** "comparable" to the state of the art, and better than an LSTM. AUC values appear only in Fig. 5, so the AUC number is **UNVERIFIED**.
- **Citation count:** I did not check citation counts.

### (e) Derm7pt / skin lesions

- **Derm7pt** (Kawahara et al., IEEE JBHI 23(2):538–546, 2019): 7-point checklist dataset.
  - Criteria: pigment network, blue-whitish veil, vascular structures, pigmentation, streaks, dots and globules, regression structures.
  - The 1,011-case count comes from the CCBM paper (arXiv:2410.15446, Sec 4). I did not check it in the Kawahara paper itself.
- **PCBM:**
  - Trains on **HAM10000**, using 8 concepts from Derm7pt (e.g. Blue Whitish Veil, Pigmented Networks, Regression Structures), following Lucieri et al. 2020.
  - Transfers to **SIIM-ISIC**.
  - Results (AUROC):

| Dataset | Original | PCBM | PCBM-h |
|---|---|---|---|
| HAM10000 | 0.963 | 0.947 | 0.962 |
| SIIM-ISIC | 0.821 | 0.736 | 0.801 |

- **Uses Derm7pt directly as a CBM dataset:**
  - Wang, Hou, Chen, *Concept Complement Bottleneck Model for Interpretable Medical Image Diagnosis*, arXiv:2410.15446. It follows PCBM's Inception-v3 setup and uses 7 concepts.
  - LaBo reports HAM10000 but not Derm7pt.

---

## 10. Motivation evidence

### (a) Adebayo et al. 2018

**Citation:** J. Adebayo, J. Gilmer, M. Muelly, I. Goodfellow, M. Hardt, B. Kim. *Sanity Checks for Saliency Maps.* NeurIPS 2018. arXiv:1810.03292.

- **Finding:** under the model-parameter randomization test, "some existing saliency methods are independent both of the model and of the data generating process".
- **Pass and fail:** "Gradients & GradCAM pass the sanity checks, while Guided BackProp & Guided GradCAM are invariant to higher layer parameters".
- **Analogy:** these maps behave like an edge detector.

### (b) Zech et al. 2018

**Citation:** J. R. Zech, M. A. Badgeley, M. Liu, A. B. Costa, J. J. Titano, E. K. Oermann. *Variable generalization performance of a deep learning model to detect pneumonia in chest radiographs: A cross-sectional study.* PLOS Medicine 15(11):e1002683, 2018. arXiv:1807.00431 (preprint title: "Confounding variables can degrade generalization performance of radiological deep learning models").

- **Data:** 158,323 chest x-rays.
  - NIH: 112,120
  - Mount Sinai (MSH): 42,396
  - Indiana (IU): 3,807
- **Detecting the hospital:** a CNN identified the hospital system for 99.95% of NIH images (22,050/22,062), 99.98% of MSH (8,386/8,388) and 95.59% of IU (737/771). It could also tell which department within a hospital an image came from.
- **Prevalence alone:** pneumonia prevalence was 34.2% at MSH vs 1.2% at NIH, so sorting by hospital alone gives an AUC of 0.861 on joint MSH+NIH data.
- **Generalisation:** the best internal model (MSH+NIH) had AUC 0.931 (95% CI 0.927–0.936). On external IU data it dropped to AUC 0.815 (0.745–0.885), P = 0.001.

### (c) Rudin 2019

**Citation:** Cynthia Rudin. *Stop explaining black box machine learning models for high stakes decisions and use interpretable models instead.* Nature Machine Intelligence 1(5):206–215, 2019, doi:10.1038/s42256-019-0048-x. arXiv:1811.10154.

**Core claim:** "trying to explain black box models, rather than creating models that are interpretable in the first place, is likely to perpetuate bad practices and can potentially cause catastrophic harm to society". In high-stakes settings, use inherently interpretable models, whose explanations are faithful by construction.

### (d) Leakage

**Mahinpei et al. 2021.** A. Mahinpei, J. Clark, I. Lage, F. Doshi-Velez, W. Pan. *Promises and Pitfalls of Black-Box Concept Learning Models.* arXiv:2106.13314, 2021. The arXiv page lists no venue; it is commonly cited as an ICML 2021 XAI workshop paper (venue UNVERIFIED).
- **Finding:** soft concept probabilities "encode information beyond the pre-defined concepts", even with sequential training.
- **Experiment:** MNIST parity (even vs odd), with concepts "is 4" and "is 5", and no 4s or 5s anywhere in the data. A downstream model on the soft concept probabilities reaches **69%** test accuracy, where 50% is expected.

**Havasi et al. 2022.** Marton Havasi, Sonali Parbhoo, Finale Doshi-Velez. *Addressing Leakage in Concept Bottleneck Models.* NeurIPS 2022 (proceedings only; no arXiv version found).
- **Finding:** soft joint and sequential CBMs leak label information through the concept probabilities. This damages concept accuracy and intervenability.
- **Fix:** hard concepts, plus an autoregressive concept predictor and a latent side-channel.

| CUB, Table 1 (%) | Concept acc | Label acc |
|---|---|---|
| Soft joint, λ = 0.01 | 0.1 | 82.1 |
| Soft independent | 48.1 | 72.8 |
| Hard | 68.0 | 79.5 |
| Hard AR | 81.4 | 81.7 |

- **Caution:** these concept accuracies look like all-concepts-correct accuracy, not Koh's per-concept error. Do not compare them directly with Koh's c error.
- **Filtering rule:** Havasi describes it as "present for at least 10% of the dataset". Koh says "at least 10 classes".
