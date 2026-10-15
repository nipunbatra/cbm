# Mathematical notes

Notation, equations and every worked calculation in *Concept Bottleneck Models*. All numbers are produced by
`math/data.py` (written to `src/data.json`) and independently re-derived by `math/numerical_validation.py`.

## 1. The architecture

$$x \xrightarrow{\;g_\theta\;} \hat{\mathbf c} \xrightarrow{\;f_\phi\;} \hat y$$

- $x$: the input (image, signal, text). $g_\theta$: the concept predictor (an encoder followed by concept outputs).
- $\hat{\mathbf c} = (\hat c_1, \dots, \hat c_k)$: predicted concept values. In the film they are soft scores in
  $[0, 1]$ (sigmoid outputs). Binary concepts $c_i \in \{0, 1\}$, categorical and continuous concepts are also possible.
- $f_\phi$: the task head. In a **strict** CBM, $\hat y = f_\phi(\hat{\mathbf c})$: no other function of $x$ reaches the
  head.
- **Multi-task contrast.** A multi-task model computes $h = e(x)$, then $\hat{\mathbf c} = q(h)$ and $\hat y = r(h)$:
  the concept head is a side branch, so editing $\hat{\mathbf c}$ cannot change $\hat y$.
- Knab et al. (TMLR 2026) organise the design space into input, concept (semantics, grounding), output and training
  modules; $g_\theta$ combines their input encoder and grounding model.

## 2. A linear task head and an intervention (Part 4)

Scores (logits) $\mathbf s = W\hat{\mathbf c}$, with rows = classes (zebra, horse, giraffe) and columns = concepts
(stripes, horse-like shape, long neck). The lecture's hand-chosen worksheet (no bias):

$$W=\begin{bmatrix}3&1&0\\-1&2&-1\\-1&0&3\end{bmatrix},\qquad
\hat{\mathbf c}=\begin{bmatrix}0.1\\0.9\\0.1\end{bmatrix}.$$

Column view (as animated): $W\hat{\mathbf c} = \hat c_1 W_{:,1} + \hat c_2 W_{:,2} + \hat c_3 W_{:,3}$.

| class | $W_{i1}\hat c_1$ | $W_{i2}\hat c_2$ | $W_{i3}\hat c_3$ | $s_i$ | softmax |
|---|---:|---:|---:|---:|---:|
| zebra | 0.3 | 0.9 | 0 | **1.2** | 0.350 |
| horse | −0.1 | 1.8 | −0.1 | **1.6** | **0.522** |
| giraffe | −0.1 | 0 | 0.3 | **0.2** | 0.129 |

Intervention: $\hat c_1: 0.1 \to 1.0$, so $\hat{\mathbf c}_{\text{new}} = (1.0, 0.9, 0.1)^\top$.

| class | $W_{i1}\hat c_1$ | $W_{i2}\hat c_2$ | $W_{i3}\hat c_3$ | $s_i$ | softmax |
|---|---:|---:|---:|---:|---:|
| zebra | 3 | 0.9 | 0 | **3.9** | **0.952** |
| horse | −1 | 1.8 | −0.1 | **0.7** | 0.039 |
| giraffe | −1 | 0 | 0.3 | **−0.7** | 0.010 |

Because the head is linear, the change is exactly $\Delta\mathbf s = W\,\Delta\hat{\mathbf c} = 0.9\,W_{:,1} =
(2.7, -0.9, -0.9)^\top$. Neither $x$ nor $W$ changes. (For a non-linear head the same edit is applied, but the change in
the output is no longer a fixed column.)

## 3. Two-class illustrative heads (Parts 2, 6, 7, 12)

The lecture's heads (`output/illustrative-heads.json`, `illustrative-counterexample.json`) compute a score
$z = \mathbf w^\top \hat{\mathbf c} + b$ and the share of the second class $\sigma(z) = 1/(1+e^{-z})$ (the first class
receives $1-\sigma(z)$, i.e. a softmax over the logits $(0, z)$).

**Gull** (concepts: wingtip grey, wingtip black, bill pointed, head white, tail rounded;
$\mathbf w = (-2, 2, 0.4, -0.2, 0.2)$, $b = 0$; classes glaucous-winged gull / American herring gull):

- before $\hat{\mathbf c} = (0.8, 0.2, 0.9, 0.85, 0.6)$: $z = -1.6 + 0.4 + 0.36 - 0.17 + 0.12 = -0.89$,
  shares $(0.709, 0.291)$;
- after the categorical group edit (grey $\to 0$, black $\to 1$): $z = 0 + 2 + 0.36 - 0.17 + 0.12 = 2.31$,
  shares $(0.090, 0.910)$.

Wing colour is categorical (one-hot), so both members are corrected together; editing one alone could leave both
or neither active.

**Sleep** (spindle present, K-complex present, slow-wave dominance; $\mathbf w = (2.6, 1.2, -1.8)$, $b = -1.5$;
classes other stage / N2 candidate):
before $(0.12, 0.8, 0.15)$: $z = 0.312 + 0.96 - 0.27 - 1.5 = -0.498$, N2 share $0.378$;
after spindle $\to 1$: $z = 2.6 + 0.96 - 0.27 - 1.5 = 1.79$, N2 share $0.857$.

**Faulty billing head** (Part 7; duplicate charge, refund requested; $\mathbf w = (-2, 0.6)$, $b = 1.2$; classes general
support / billing queue):
before $(0.2, 1)$: $z = 1.2 - 0.4 + 0.6 = 1.4$, billing $0.802$ (correct routing);
after the correct edit $(1, 1)$: $z = 1.2 - 2 + 0.6 = -0.2$, billing $0.450$ (wrong routing).
The edit equals the true concepts; the decrease comes entirely from the wrong-signed weight $-2$. This is an existence
example, not a frequency estimate.

**Kiln** (Part 12, design example only; chimney visible, elongated footprint, circular footprint, smoke plume;
$\mathbf w = (3, 0.6, -0.6, 0.2)$, $b = -1.5$): before $(0.21, 0.88, 0.12, 0.3)$ gives $0.412$ for candidate B, after
chimney $\to 1$ gives $0.882$. (Shown only as illustrative values, not narrated.)

## 4. Training (Part 5)

Data $\{(x_i, \mathbf c_i, y_i)\}_{i=1}^n$. With sigmoid concept outputs $\hat c_{ij}$ and class probabilities
$\hat p_i = \mathrm{softmax}(f_\phi(\hat{\mathbf c}_i))$:

$$\mathcal L_c = \frac1{nk}\sum_{i,j} \mathrm{BCE}(\hat c_{ij}, c_{ij}),\qquad
\mathcal L_y = \frac1n\sum_i -\log \hat p_{i,y_i},\qquad
\mathcal L = \lambda_c \mathcal L_c + \lambda_y \mathcal L_y .$$

Koh et al. (2020): **independent** ($g$ fit to $\mathbf c$; $f$ fit on true $\mathbf c$; at test time $f$ receives
$\hat{\mathbf c}$), **sequential** ($g$ fit, frozen; $f$ fit on $\hat{\mathbf c} = g(x)$), **joint** (minimise
$\mathcal L$ over $\theta, \phi$ together). In joint training the task gradient reaches the concept predictor through
the bottleneck:

$$\frac{\partial \mathcal L_y}{\partial \theta} = \frac{\partial \mathcal L_y}{\partial \hat{\mathbf c}}\,\frac{\partial \hat{\mathbf c}}{\partial \theta}.$$

The measured shape experiment used joint training with $\lambda_c = 2$, $\lambda_y = 1$, Adam, learning rate 0.003,
batch 64, 60 epochs (`scripts/train_concept_bottleneck_toy.py`: `loss = CE + 2 * BCEWithLogits`).

## 5. Incompleteness (Part 8)

Vocabulary (colour, size). Blue circle and blue square both map to $\mathbf c = (\text{blue}=1, \text{large}=0)$ with
different labels. Any deterministic head $f$ gives $f(\mathbf c(x_1)) = f(\mathbf c(x_2))$, so at most one of the two
is classified correctly: maximum accuracy 1/2 on this pair (checked by enumerating all 16 functions
$\{0,1\}^2 \to \{A, B\}$). Sufficiency would require $Y \perp\!\!\!\perp X \mid C$; a strict CBM guarantees only that
$\hat Y$ depends on $X$ through $\hat C$.

## 6. Leakage (Part 9)

Constructed score distributions for the single concept "stripes present" (true label 1 for both classes):
$\hat c \sim \mathcal N(0.72, 0.017^2)$ for plains zebras and $\mathcal N(0.96, 0.017^2)$ for Grévy's zebras.
A head thresholding at $0.84$ errs with probability
$\tfrac12[1-\Phi(0.12/0.017)] + \tfrac12\Phi(-0.12/0.017) = \Phi(-7.06) \approx 8\times10^{-13}$, so "almost perfectly"
(5000 seeded samples per class: accuracy 1.000). The binary label is identical for both classes, so a head reading only
the bit is at chance, 0.5. The difference is information carried by the score beyond its declared binary meaning.
An explicit bypass (e.g. PCBM-h's residual, or any side path from features to the head) leaks by construction.

## 7. Concept embeddings (Part 10)

CEM (Zarlenga et al. 2022): for concept $i$, embeddings $\mathbf c_i^{+}, \mathbf c_i^{-}$ are computed from the input,
a probability $\hat p_i$ is predicted, and the head receives
$\hat{\mathbf c}_i = \hat p_i\,\mathbf c_i^{+} + (1-\hat p_i)\,\mathbf c_i^{-}$. An intervention sets $\hat p_i \in \{0, 1\}$.
The film's 2-D points $\mathbf c^{+} = (0.82, 0.30)$, $\mathbf c^{-} = (0.22, 0.74)$ are illustrative.

## 8. Post-hoc and language-based CBMs (Part 10)

- PCBM (Yuksekgonul et al. 2023): frozen backbone features $f(x)$; concept vectors $\mathbf v_i$ (CAVs from examples, or
  CLIP text embeddings); concept scores $\langle f(x), \mathbf v_i\rangle / \lVert \mathbf v_i\rVert^2$; sparse linear
  head. PCBM-h adds a residual predictor on $f(x)$.
- Label-free CBM (Oikarinen et al. 2023): GPT-3-generated concept set, filtered; a projection $W_c$ on backbone
  features fit so activations match CLIP image–text similarities (CLIP-Dissect, cos³ objective); sparse final layer
  (GLM-SAGA) trained with task labels.
- LaBo (Yang et al. 2023): GPT-3 proposes class-conditioned concept sentences; submodular selection; CLIP image–text
  similarity forms the bottleneck; a linear layer, initialised from language priors, is trained with task labels.

## 9. The CLIP black box (Part 1)

CLIP ViT-B/32 (`openai/clip-vit-base-patch32`), prompt "a photo of a {species}, a type of bird.", six species names,
softmax of $100\cdot\cos$ similarities: American herring gull 0.543, glaucous-winged gull 0.209, great black-backed gull
0.108, ring-billed gull 0.091, glaucous gull 0.048, laughing gull 0.000. Occlusion sensitivity: for each of 14 × 14 patch
centres, a square of side 0.16 of the image is filled with the image's mean colour and the drop in
$\log p(\text{top})$ is recorded (`blackbox/clip_blackbox.py`). Maximum drop 0.92, on the bill/head region.

## 10. Measured shape experiment (Part 11)

Saved, never rerun: one seed (17), 60 epochs, train / val / test = 768 / 256 / 512 synthetic 64 × 64 images, eight
classes = colour × shape × size, five concepts (red, blue, circle, square, large) that determine the class.

| model | test class accuracy | mean concept accuracy |
|---|---:|---:|
| black box | 0.7871 (403/512) | n/a |
| multi-task | 0.8203 (420/512) | 0.9234 |
| strict CBM | 0.8164 (418/512) | 0.9242 |

Oracle intervention (replace the concept with the largest absolute error by its true 0/1 value, repeat):
0.8164, **0.9727**, 0.9844, 1.0, 1.0, 1.0 for 0 to 5 corrections. Random order (mean of 32 seeded orders):
0.8164, **0.8730**, 0.9214, 0.9578, 0.9858, 1.0; range over orders shown as a band, not a confidence interval.
Test image 10: true small red square; size score 0.782; predicted large red square; with size set to 0 the same
learned head predicts small red square. Editing the multi-task model's concept head leaves its class logits exactly
unchanged.
