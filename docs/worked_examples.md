# Worked examples for Parts 9 and 10

Reference for the film (scenes s09, s20, s10, s15 to s19) and for slides. Every number here is in `src/data.json`; sources: `leakage/probe_shapes.py`, `worked/compute.py`, `worked/llm_concepts.py` (raw replies in `worked/llm_concepts.json`). The Part 10 photo set is 36 Wikimedia Commons photographs (CC BY-SA / CC BY / public domain; credits in `worked/photos/meta.json`), 8 train and 4 test per class. These are teaching computations, not benchmarks.

## Part 9A: leakage, constructed (zebra species)

- Concept *stripes present*; true label 1 for both plains and Grévy's zebras.
- Constructed scores: plains ≈ 0.72, Grévy's ≈ 0.96 (sd 0.017). Threshold 0.84 separates them (accuracy 1.00); the binary label alone gives 0.50.
- Intervention cost: correcting a plains zebra's stripes to 1 (its true value) crosses the head's 0.84 cut, so the head outputs Grévy's zebra.
- Implicit leakage = extra information inside a continuous score. Explicit leakage = a side path (e.g. a residual) around the concepts.

## Part 9B: leakage, measured (shape model, saved predictions, no retraining)

| radius (px) | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| mean p(large) | 0.00 | 0.00 | 0.00 | 0.01 | 0.09 | 0.25 | 0.63 | 0.87 | 0.99 | 1.00 | 1.00 | 1.00 |
| n images | 45 | 40 | 43 | 48 | 43 | 37 | 30 | 50 | 37 | 35 | 55 | 49 |

- Label: large = radius ≥ 14 px. Within-class correlation of radius with p(large): small 0.40, large 0.50.
- Linear probes (8-fold cross-validated R²) from the five soft scores: position x -0.008, y 0.022, background shade -0.022, object shade 0.020: essentially none.
- Mitigations: hard concepts; independent training (head fit on true binary concepts); remove or report side paths; measure with probes and intervention tests.

## Part 10.0: a supervised CBM record

```json
{"image": "zebra_12.jpg", "concepts": {"stripes": 1, "horse_like_shape": 1, "long_neck": 0}, "label": "zebra"}
```
Koh et al. used 112 binary concepts per CUB bird photograph.

## Part 10.1: Concept Embedding Model (illustrative numbers)

- ĉ_i = p_i c_i⁺ + (1 − p_i) c_i⁻. Stripes: c⁺ = [0.82, 0.3], c⁻ = [0.22, 0.74], p = 0.1 → [0.28, 0.696].
- Head reads all three 2-D embeddings (6 numbers). Shares (zebra, horse, giraffe): [0.1436, 0.7227, 0.1336] → after setting p_stripes = 1: [0.8599, 0.1182, 0.0219].
- Training: random interventions (true probabilities substituted at random) teach the head to respond to corrections. Cost: unnamed coordinates.

## Part 10.2: Post-hoc CBM (real computation)

- Frozen CLIP ViT-B/32 image encoder (512-d). Concept bank (CLIP text directions): black and white stripes, a long neck, a flowing mane, brown patches on a pale coat, hooves, a saddle, green grass, a wooden fence.
- Worked photo `zebra_12.jpg`: raw cosine scores black and white stripes 0.274, a long neck 0.243, a flowing mane 0.234, brown patches on a pale coat 0.257, hooves 0.243, a saddle 0.223, green grass 0.217, a wooden fence 0.211.
- Standardised on the 24 training photos: black and white stripes 1.41, a long neck 0.10, a flowing mane 0.32, brown patches on a pale coat 0.72, hooves 0.34, a saddle -0.09, green grass 0.54, a wooden fence 1.12.
- Sparse head (L1 logistic): 4 of 24 weights non-zero: zebra ← black and white stripes +1.49; horse ← a long neck -0.27, a flowing mane +0.28; giraffe ← a long neck +1.02.
- Shares for the worked photo: [0.774, 0.1127, 0.1133]; test accuracy 1.00 on 12 photos.
- Edit stripes z 1.4062 → -0.6594 (mean of non-zebra training photos): [0.1373, 0.4303, 0.4324].
- PCBM-h residual logits [0.3075, -0.2969, -0.0107]; hybrid shares [0.8431, 0.0671, 0.0898] → after the same edit [0.1999, 0.3423, 0.4578].

## Part 10.3: Label-free CBM (real computation)

Language model: `gemini-3.1-pro-preview` (2026-10-10, temperature 0). Prompts and raw JSON replies for zebra:

- *List the most important features for recognizing something as a "zebra".* → `{"items": ["Black and white stripes", "Horse-like body", "Erect mane", "Hooved feet", "Long tufted tail", "Large rounded ears", "Elongated muzzle"]}`
- *List the things most commonly seen around a "zebra".* → `{"items":["Tall savanna grass","Acacia trees","Wildebeest herds","Waterholes","Lions","Oxpecker birds","Safari vehicles","Dust clouds"]}`
- *Give superclasses for the word "zebra".* → `{"items":["equine animal","odd-toed ungulate","hoofed mammal","herbivorous mammal","placental mammal","vertebrate animal","wild animal","living organism"]}`

- 59 candidates → 34 after filters (cutoffs {'max_len': 30, 'class_sim': 0.85, 'dup_sim': 0.85, 'top5_clip': 0.24, 'interp': 0.45}). Removed:
  - horse-like body: contains the class name (horse)
  - large rounded ears: barely active on the photos (CLIP top-5 mean below 0.24)
  - lions: barely active on the photos (CLIP top-5 mean below 0.24)
  - dust clouds: barely active on the photos (CLIP top-5 mean below 0.24)
  - placental mammal: barely active on the photos (CLIP top-5 mean below 0.24)
  - living organism: barely active on the photos (CLIP top-5 mean below 0.24)
  - large eyes on sides: barely active on the photos (CLIP top-5 mean below 0.24)
  - leather saddle: barely active on the photos (CLIP top-5 mean below 0.24)
  - metal horseshoes: barely active on the photos (CLIP top-5 mean below 0.24)
  - bale of hay: barely active on the photos (CLIP top-5 mean below 0.24)
  - water trough: barely active on the photos (CLIP top-5 mean below 0.24)
  - nylon halter: barely active on the photos (CLIP top-5 mean below 0.24)
  - grooming brush: barely active on the photos (CLIP top-5 mean below 0.24)
  - equine: near-duplicate of 'equine animal'
  - vertebrate: near-duplicate of 'vertebrate animal'
  - beast of burden: barely active on the photos (CLIP top-5 mean below 0.24)
  - long slender legs: near-duplicate of 'four long slender legs'
  - ossicones on head: barely active on the photos (CLIP top-5 mean below 0.24)
  - sloping back: barely active on the photos (CLIP top-5 mean below 0.24)
  - tufted tail: near-duplicate of 'long tufted tail'
  - small head: barely active on the photos (CLIP top-5 mean below 0.24)
  - other giraffes: contains the class name (giraffe)
  - zebras: contains the class name (zebra)
  - organism: barely active on the photos (CLIP top-5 mean below 0.24)
  - living thing: barely active on the photos (CLIP top-5 mean below 0.24)
- Projection: ResNet-50 (torchvision IMAGENET1K_V2), 2048-d pooled features → 34 concepts; learned on 60 unlabelled photos x 6 random crops = 360 images with the cos³ objective (no labels). Interpretability cut 0.45: none removed.
- Sparse final layer: 6 of 102 weights non-zero: zebra ← black and white stripes +1.46, wildebeest herds +0.06; horse ← safari vehicles -0.38, muscular equine build +0.39, riding bridle +0.16; giraffe ← extremely long neck +1.18.
- Worked photo shares [0.8212, 0.0728, 0.106]; test accuracy 1.00. Context concepts (riding bridle, safari vehicles, wildebeest herds) carry weight.

## Part 10.4: LaBo (real computation)

- zebra: *Describe what a zebra looks like in a photograph, as 8 short visual sentences that would help tell it apart from similar animals.* → `{"items":["Bold black and white stripes.","Short stiff upright mane.","Stocky horse-like body.","Dark rounded muzzle.","Large striped ears.","Tail with a dark tuft.","Striped legs down to the hooves.","Unique facial stripe patterns."]}`
- horse: *Describe what a horse looks like in a photograph, as 8 short visual sentences that would help tell it apart from similar animals.* → `{"items": ["Long flowing mane along the neck.", "Elongated straight or convex facial profile.", "Large wide-set eyes on the sides.", "Pointed mobile ears standing upright.", "Muscular deep chest and sloping shoulders.", "Long slender legs ending in single solid hooves.", "Tail covered entirely in long flowing hair.", "Smooth short coat in various colors."]}`
- giraffe: *Describe what a giraffe looks like in a photograph, as 8 short visual sentences that would help tell it apart from similar animals.* → `{"items": ["Extremely long vertical neck", "Large brown polygonal coat patches", "Thin cream lines between patches", "Two small fur-covered horn-like ossicones", "Very long slender legs", "Distinctly sloping back from shoulders", "Long tail with dark hair tuft", "Elongated face with dark lips"]}`

- Selection: 0.7 x normalised discriminability + 0.3 x coverage gain (facility location on CLIP text similarity), greedy, 3 per class.
  - zebra: Bold black and white stripes (discriminability 1.0, coverage gain 0.692)
  - zebra: Unique facial stripe patterns (discriminability 0.6802, coverage gain 0.1025)
  - zebra: Large striped ears (discriminability 0.6592, coverage gain 0.0404)
  - horse: Long flowing mane along the neck (discriminability 1.0, coverage gain 0.7874)
  - horse: Tail covered entirely in long flowing hair (discriminability 0.7494, coverage gain 0.0225)
  - horse: Smooth short coat in various colors (discriminability 0.5932, coverage gain 0.0439)
  - giraffe: Extremely long vertical neck (discriminability 1.0, coverage gain 0.7712)
  - giraffe: Very long slender legs (discriminability 0.7046, coverage gain 0.0228)
  - giraffe: Long tail with dark hair tuft (discriminability 0.5536, coverage gain 0.0366)
- Bottleneck: 100 × CLIP cosine with the 9 selected sentences; worked photo: [27.8183, 28.064, 28.5195, 24.4031, 24.2559, 20.0152, 24.133, 22.2518, 24.6095].
- Language prior (1/3 on each class's own sentences): shares [0.9835, 0.0052, 0.0113], test accuracy 0.92. After training: shares [0.9953, 0.0041, 0.0006], test accuracy 1.00.
