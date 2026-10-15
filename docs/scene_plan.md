# Scene plan: Concept Bottleneck Models

Visual plan for every scene. Beat numbers (`7.4` = scene s07, beat 4) refer to `narration/script.txt`, compiled into
`narration/script.json`; `docs/beats.txt` lists each beat's exact text and its start and end inside its scene. Every
number on screen comes from `src/data.json` (written by `math/data.py`, checked by `math/numerical_validation.py`).
Scene `sNN` lives in `src/scenes/SNN.tsx`. Same blackboard, type, motion grammar and pipeline as the YOLO and DETR
lecture-films (`../yolo`, `../detr`).

## Global rules (binding)

**Canvas.** 1920 x 1080 design units, rendered at scale 2 for 4K. Header (part number + title) top left, y 58 to 130,
title ends before x 1380. The small architecture map `<ArchMap on={[...]}/>` (x 1430 to 1800, y 62 to 98) appears in
s02 to s13 and highlights the stage the scene is about (`x`, `g`, `c`, `f`, `y`). Keep content above y 960 (captions
band in the captioned master) and inside 96 px side margins.

**Colour = meaning** (`src/kit/theme.ts`; KaTeX macros in brackets). Never use a role colour for anything else.

| meaning | token | colour | KaTeX |
|---|---|---|---|
| input x, encoder g_theta, input features | `C.input` | blue | `\cin{}` |
| concepts, concept values, concept predictor outputs | `C.concept` | teal | `\ccon{}` |
| task head f_phi | `C.head` stroke, `C.headFill` fill | dark grey | `\chead{}` |
| human edits, interventions, the person glyph | `C.edit` | amber | `\cedit{}` |
| losses and gradients | `C.loss` | coral | `\closs{}` |
| leakage, bypass paths | `C.leak` | purple | `\cleak{}` |
| predictions, outputs | `C.chalk` | white | `\cout{}` |
| occlusion sensitivity (s01 only) | `C.heat` | white luminance over a dimmed photo | |

Notation macros: `\gth` (g_theta, blue), `\fph` (f_phi, grey), `\ch` (c hat, teal), `\cvec` (bold c hat), `\yh`.

**Provenance (binding).** Every number-bearing visual carries an `<EvTag kind=...>`:
`computed` (real model run: CLIP in s01), `measured` (the saved shape experiment, s11), `illustrative` (hand-written
heads: gull, sleep, billing, kiln, zebra worksheet), `constructed` (leakage distributions, blue circle / square),
`generated` (the generated kiln view), `schematic` (the EEG trace). Licensed photos carry `<Credit>` with `CREDIT[src]`.
Never present an illustrative or constructed number as measured.

**Intervention grammar (the recurring metaphor).** Concept values are teal bars (`ConceptRow`). A human edit is amber:
the person glyph appears, the edited row turns amber, the old value stays as a dashed teal ghost, the number counts to
the new value. The task head (grey block) pulses once as it recomputes (`hi`), then the output bars move
(`ShareBars from/to/k`). The image and the head never change during an edit: hold them visibly still.

**Living architecture.** Connections are `<Flow>` paths with travelling dots while information moves (`live`).
Forward flow uses the colour of what travels (blue features, teal concepts, white prediction). Gradients are coral
dots travelling backwards (`rev`). Bypass / leakage paths are purple and dotted (`dash="3 10"`, round caps).

**Motion.** Build step by step; nothing appears before it is spoken (drive every appearance from `bs`, `be`, `bw`);
hold finished states; fade out before fading something else in at the same place. Arithmetic reveals one term at a
time, in step with the voice, slowly enough to copy down. Before a reveal that follows a deliberate pause in the
narration (gaps of 1.2 s or more), hold the frame still. On-screen prose: plain, short, no em or en dashes, no hype.
British spelling in on-screen text (colour, centre, grey).

**Typography.** Body text >= 26, labels >= 22, equations 40 to 64. Use `HText` for prose and `Tex` for maths.

---

## s00 Title (0:00, ~13 s)
The gull photograph fades in on the right (square, x 1040, y 150, 760), dimmed 0.25. A thin pipeline sketch draws
across it: a blue line from the bird into a small column of five teal concept ticks, then a grey head, then a white
dot. Left: "A GRADUATE LECTURE" (mono, muted), title "Concept Bottleneck Models" (96 px), subtitle "From black-box
predictions to interpretable, editable concepts", a short teal rule. Credit line small at the bottom of the photo.

## s01 Part 1 · The black box (~80 s)
1.1 Black frame, the question appears as text, centred, two lines: "A neural network makes a prediction." / "How can a
person inspect, and correct, the evidence it used?" (correct in amber). Fade out at the end of the beat.
1.2 Gull photo (square, left: x 110, y 200, s 640). `EvTag computed` "CLIP ViT-B/32, zero-shot over 6 species names".
1.3 Pipeline to the right: photo → blue block "encoder" (CLIP image encoder) → white bars of six species (from
`D.clip.probs`, sorted, `ShareBars`), American herring gull 0.54 leading, glaucous-winged 0.21. The encoder block is
an opaque dark box with a faint inner texture (a black box). Dots flow while "Image in" is spoken.
1.4 Hold. A small "?" pulses between the encoder and the bars.
1.5 The bars recede to the right. A grey square patch (the occlusion probe) sweeps over the photo in a raster (fast,
a few rows), and a small readout shows the score dropping when it covers the head.
1.6 The sensitivity map (`SensMap` from `D.clip.drop`, 14 x 14) fades in over the dimmed photo: brightest on the bill
and head. Tag "occlusion sensitivity, computed".
1.7 Four question callouts appear one at a time next to the bright region, each pointing to a part: "yellow bill?",
"red spot near the tip?", "head shape?", "water behind it?" (white text on dark backing).
1.8 The callouts dim. A single line: "Where the score is sensitive. Not which property."
1.9 The map fades; three named property labels (teal outline pills) attach to wingtip, bill, head regions
(`D.gull.regions`), each with an empty value slot: the idea of named evidence. Transition: the pills slide right into
a column (they become the concept layer of s02).

## s02 Part 2 · Introducing the concept bottleneck (~120 s)
Canonical layout (also used by s06 and s14, see `src/kit/pipe.tsx`): gull photo x 96, y 300, 330 square; g_theta block
centre (590, 465); five concept rows from x 720, y 300 to 630; f_phi block centre (1420, 465); output bars
x 1530 to 1830, y 420 and 478 for the two candidates.
2.1 The same photo; a gap opens between it and the right side; the five-row concept layer slides in.
2.2 `Tex` under the pipeline: x →g_θ→ ĉ →f_φ→ ŷ, terms appearing with "concept predictor", "c hat", "task head".
Blocks get their names.
2.3 Concept rows fill one by one with their values (`D.bird.before.c`), labels from `D.bird.labels`.
2.4 The bottleneck: every connection into f_phi comes from the five rows; a dashed outline wraps the concept column
and is labelled "the only input to the task head". Briefly show a faint direct path from the encoder to the head,
crossed out (red cross) and removed.
2.5 Split comparison strip (top, small): "black box: x → y" vs "CBM: x → c → y".
2.6 A small "heatmap" thumbnail (from s01) on the left labelled "after the fact"; the concept column labelled "on the
prediction path". Fade both.
2.7 `EvTag illustrative` "hand-written concept values and head".
2.8 Output bars appear: Glaucous-winged gull 0.71, American herring gull 0.29 (`D.bird.before.share`, classes from
`D.bird.classes`). The wingtip grey row (0.80) and black row (0.20) highlight.
2.9 Zoom inset of the black wingtips on the photo (crop around `D.gull.regions.wingtip`). Person glyph. Edit: grey →
0, black → 1, amber, both rows together (bracket labelled "wing colour, one group").
2.10 f_phi pulses; bars move to 0.09 / 0.91. Herring gull now leads. The photo and the head visibly unchanged.
2.11 Hold the edited state; a caption "edited belief → new prediction".
2.12 Multi-task comparison panel replaces the pipeline: shared encoder, two branches: concept head and class head side
by side. An amber edit on the concept branch output; the class output does not move; label "class head never reads
it".
2.13 Back to the CBM pipeline: the concept column is on the path; flow dots move through it.

## s03 Part 3 · What is a concept? (~80 s)
3.1 Title card-like statement: "A concept is more than a neuron with a name." A single node with a name tag, the tag
falls off, leaving a bare neuron.
3.2 to 3.4 Three columns, side by side: MEANING (definition card, "Grey wingtip: the tips of the folded flight
feathers are grey, not black."), GROUNDING (gull photo with the wingtip region outlined in teal; water and rock
regions marked "not here" in muted grey), REPRESENTATION (four small rows: binary {0,1}, soft [0,1], categorical
{grey, black, white}, continuous e.g. bill length in mm).
3.5 Under REPRESENTATION: "0.8 is a score, not automatically a probability." A small reliability-diagram sketch with a
diagonal and an "unchecked" curve, labelled "calibration must be measured".
3.6 to 3.7 Three small cards slide in (bottom row): EEG trace with a spindle burst, "sleep spindle present"; the kiln
overhead image crop, "chimney visible"; a text snippet "charged twice", "duplicate charge reported". Each shows the
same x → c → y mini-glyph.
3.8 Hold; the three cards share one teal "named claim" outline.

## s04 Part 4 · From concepts to predictions: the arithmetic (~150 s)
Layout: left column class photos (zebra, horse, giraffe thumbnails as row headers of W); centre the matrix W (3 x 3,
grey frame), concept vector ĉ to its right as a teal column; results column on the far right.
4.1 Three class cards with photos (zebra_plains, horse, giraffe) with names.
4.2 Input: the zebra photo with reduced contrast (CSS filter contrast(0.35) brightness(0.8)), labelled "low-contrast
photo". Concept vector appears: stripes 0.1, horse-like shape 0.9, long neck 0.1 (`D.zoo.c`). EvTag illustrative.
4.3 W appears row by row (`D.zoo.W`), rows labelled zebra/horse/giraffe, columns stripes/shape/neck (teal headers).
Circle the 3 (stripes, zebra), the 3 (neck, giraffe), the 2 (shape, horse), the 1 (shape, zebra) as spoken.
4.4 Column view: each concept value flies to its column and the column lights up in teal with the value above it.
4.5 "0.1 ×", "0.9 ×", "0.1 ×" scale the three columns, shown as three scaled column vectors side by side, + signs
between.
4.6 Row sums one row at a time with the voice: zebra 0.3 + 0.9 + 0 = 1.2; horse −0.1 + 1.8 − 0.1 = 1.6; giraffe
−0.1 + 0 + 0.3 = 0.2 (`D.zoo.terms`, `D.zoo.logits`). Results column fills.
4.7 Logits labelled "class scores (logits)"; horse highlighted; small softmax bars (`D.zoo.softmax`): horse 0.52.
4.8 Hold (1.4 s pause). Person glyph; stripes cell turns amber, 0.1 → 1.0.
4.9 Only the stripes column's scaling changes (1.0 ×); recompute row sums term by term: 3 + 0.9 + 0 = 3.9; −1 + 1.8
− 0.1 = 0.7; −1 + 0 + 0.3 = −0.7 (`D.zoo.terms_new`, `D.zoo.logits_new`).
4.10 Softmax bars move: zebra 0.95 (`D.zoo.softmax_new`).
4.11 Δ view: "image: same", "W: same" with ticks; Δĉ = 0.9 on stripes; Δscores = 0.9 × stripes column = (+2.7,
−0.9, −0.9) (`D.zoo.delta`).
4.12 Hold; caption "edit a belief, not the weights".

## s05 Part 5 · How does the model learn the concepts? (~100 s)
5.1 A training record card: (x_i, c_i, y_i) with the gull thumbnail (blue), a teal concept label vector, a white
class label.
5.2 to 5.4 The pipeline (compact): concept outputs compared with c_i → coral L_c; output compared with y_i → coral
L_y; then L = λ_c L_c + λ_y L_y (KaTeX, λ terms highlighted).
5.5 to 5.7 Three side-by-side mini-diagrams: INDEPENDENT (two separate boxes: x → g → ĉ vs c (true) → f → y, with a
note "test time: f receives ĉ"), SEQUENTIAL (g trained, padlock icon "frozen", then f trained on ĉ), JOINT (one
system, both losses).
5.8 Joint diagram enlarges; coral gradient dots flow backwards from L_y through f_phi, through ĉ, into g_theta.
Label ∂L_y/∂ĉ on the ĉ link. A second, coral flow from L_c into g_theta.
5.9 A small tension sketch: a concept bar pulled by two coral arrows, "concept label" vs "task benefit". Text: "can
help the task, can pull against concept fidelity: measure it".
5.10 Caption: "measured experiment (Part 11): joint training, λ_c = 2, λ_y = 1" (`D.train`).

## s06 Part 6 · Human interventions (~95 s)
6.1 Four-step strip across the top: predict concepts → person checks → fixed head recomputes → new prediction.
6.2 Canonical gull pipeline (as s02 end state reset to before): grey and black wingtip rows highlighted with a group
bracket "categorical: correct together"; a ghost of an invalid state (both on) crossed out.
6.3 Edit plays (amber), bars 0.29 → 0.91 for herring gull.
6.4 Transition to the EEG: schematic trace (`D.eeg`, 6 s), spindle window highlighted in teal at 3.4 to 4.4 s
("spindle-like burst, about 13 Hz"), K-complex marked lightly. EvTag schematic.
6.5 Concept rows (spindle 0.12, K-complex 0.80, slow-wave dominance 0.15, `D.sleep.before.c`).
6.6 Stage head output bars: other stage 0.62, N2 candidate 0.38 (`D.sleep.before.share`, labels `D.sleep.classes`).
EvTag illustrative.
6.7 Person glyph over the burst; spindle row edited 0.12 → 1.00 (amber).
6.8 Head pulses; bars move: N2 candidate 0.86.
6.9 Caption block: "a mechanism demonstration, not a clinical result; real staging uses 30 s epochs and scoring
rules".

## s07 Part 7 · A correct edit can still hurt (~100 s)
Tone: investigative. Slightly cooler lighting (no music change needed).
7.1 Title text "When a correct edit hurts".
7.2 The support message in a message card; "charged twice" underlined; destination "BILLING QUEUE" (target).
7.3 Concept rows: duplicate charge 0.20, refund requested 1.00 (`D.faulty.before.c`).
7.4 The head's formula (KaTeX): s = 1.2 − 2 c_dup + 0.6 c_refund; the −2 coefficient small at first. Sigmoid → billing
share.
7.5 Term-by-term: 1.2 − 0.4 + 0.6 = 1.4 → billing 0.80 (`D.faulty.before`). Routed to billing (tick).
7.6 Pause. Person glyph; duplicate charge 0.20 → 1.00 (amber), correct (tick "matches the message").
7.7 Recompute: 1.2 − 2 + 0.6 = −0.2 → billing 0.45; the message slides to GENERAL SUPPORT (wrong, red cross).
7.8 The −2 coefficient highlights in coral, magnified: "wrong sign".
7.9 Statement: "Correcting a concept does not repair a wrong decision rule."
7.10 EvTag constructed "deliberately faulty head"; caption "existence, not frequency".

## s08 Part 8 · What if the concepts are incomplete? (~85 s)
8.1 Two large shapes: blue circle, blue square (drawn in SVG, same blue as the synthetic data: use '#3B6FD8' for the
physical colour, not a role colour; explain in a tiny note "object colour"), labels class A, class B.
8.2 Vocabulary card: colour, size. Each object gets [blue = 1, large = 0].
8.3 `Tex`: c(x₁) = c(x₂), y₁ ≠ y₂ (the ≠ in coral).
8.4 Both shapes travel into the bottleneck: their outline (shape) visibly peels off and fades at the bottleneck
boundary; two identical teal vectors emerge.
8.5 Task head receives two identical vectors, outputs the same; a 50 % meter.
8.6 `Tex`: Y ⫫ X | C ("ideal: sufficiency").
8.7 Contrast: "strict CBM guarantees: ŷ depends on x only through ĉ" vs "sufficiency: a property of the vocabulary".
8.8 Fix: add "shape" to the vocabulary; vectors now differ.

## s09 Part 9 · Concept leakage (~2.3 min)
Keep the existing visual language (zebra photos, score axis with the two constructed distributions, threshold, accuracy
readouts, purple leakage), rebuilt to the new beats:
9.1 Definition card first: a teal concept node "stripes present" with a question "is it present?" and a single bit
going to the head; then a second, purple thread appears beside the bit: "anything more = leakage (if the head uses it)".
9.2 Photos (plains, Grévy's), both "stripes = 1". EvTag constructed.
9.3 Score axis 0.6 to 1.0, two distributions (D.leak), labels ≈ 0.72 / ≈ 0.96.
9.4 "both above 0.5, same binary meaning"; bracket "the exact value separates the species".
9.5 Threshold 0.84 (head's cut); readouts soft 1.00 vs binary 0.50 (chance).
9.6 The teal concept wire with a purple core labelled "stripe density: unnamed, uninspectable".
9.7 to 9.8 The intervention cost, slowly: a plains zebra with score ≈ 0.72 → a person sets it to 1 (true value, tick
"correct") → the head compares 1.00 > 0.84 → "Grévy's zebra" with a red cross; caption "the person fixed the concept;
the head was reading the number".
9.9 Implicit (inside the score) vs explicit (purple dotted side path from the encoder around the concept to the head).
9.10 With the side path, an amber edit leaves the purple path flowing; "a named bottleneck constrains routing, not
reasoning".
9.11 Caveat: constructed distributions; ordinary confidence variation is not leakage.

## s20 Part 9 · Leakage in a trained model (~1.8 min)
20.1 The shape model: a few real 64 × 64 test images (pixelated), the five concepts, the size concept highlighted.
EvTag measured "saved predictions of the shape model, no retraining".
20.2 A chart: x = true radius in pixels (8 to 19, D.probe.radius), y = mean p(large) (D.probe.mean_p_large), dots sized by
n; a vertical dashed line at 14 px "label: large from 14 px"; a step function (the binary label, teal) overlaid on the
smooth measured curve (white); call out 0.09 (12), 0.25 (13), 0.63 (14), 0.87 (15) as spoken.
20.3 Caption: "the score carries a graded size, not just large / not large".
20.4 Probe panel: four small bars for R² of position x, position y, background shade, object shade (D.probe.r2_*_from_soft),
all ≈ 0, with a 0 to 1 axis; label "linear probes, 8-fold cross-validated"; conclusion "extra information is about the
concept's own quantity, not an unrelated side channel".
20.5 A "how to test" card: concept scores → probe → can they predict X beyond their labels?
20.6 to 20.8 Four mitigations as cards appearing one by one: hard concepts (0/1 only; cost: loses graded evidence),
independent training (head fit on true binary concepts), remove or report side paths, measure (probes + intervention
tests on held-out data). Cite Havasi et al. 2022 small.

## s10 Part 10 · Modern concept bottleneck architectures (~0.9 min)
10.1 The cost: a grid of photos each with five concept checkboxes being ticked by a person icon; "every concept, every
image".
10.2 A JSON training record (monospace card): {"image": "zebra_12.jpg", "concepts": {"stripes": 1, "horse_like_shape": 1,
"long_neck": 0}, "label": "zebra"}; then "CUB (Koh et al.): 112 concepts per photograph".
10.3 A four-row "what changes" table, rows appearing with the voice: concept source · detector · representation ·
what reaches the head. These four rows are reused in s19.
10.4 The running example: a strip of the 36 Commons photos (public/img/worked/*.jpg, D.worked.train / test), zebra /
horse / giraffe rows; "24 train · 12 test"; a small credit "36 Wikimedia Commons photos, CC BY-SA / CC BY / PD".

## s15 Part 10 · Concept embedding models (~1.4 min)
Use D.worked.cem (illustrative; EvTag illustrative "hand-chosen 2-D embeddings").
15.1 Recall: one scalar per concept, narrow; small callback to Part 8's collision.
15.2 Per concept: two points c⁺ (active) and c⁻ (inactive) in a 2-D plane, computed from the image (arrows from the
encoder); a p gauge.
15.3 ĉ = p c⁺ + (1 − p) c⁻ (KaTeX); stripes p = 0.1 → point near c⁻ (show (0.28, 0.70)); the head reads three planes
(6 numbers) → shares zebra 0.14, horse 0.72, giraffe 0.13 (D.worked.cem.probs).
15.4 Amber: p → 1, the point slides to c⁺ (0.82, 0.30); shares → zebra 0.86 (probs_edit).
15.5 Training with random interventions: during training, dice icon replaces some p with true 0/1.
15.6 Gain vs cost: "capacity" vs "unnamed coordinates" (the plane axes have "?" labels).

## s16 Part 10 · Post-hoc concept bottleneck models (~1.8 min)
Real numbers from D.worked.pcbm (EvTag computed "CLIP ViT-B/32 on 36 Commons photos, teaching example").
16.1 A pretrained, frozen encoder (padlock) reused.
16.2 The worked photo (worked/zebra_12.jpg) → CLIP image encoder → a 512-number vector strip; the concept bank: eight
phrases, each turned into a direction by CLIP's text encoder.
16.3 Projection bars for the eight concepts (raw cosine, then standardised z, D.worked.pcbm.z_example); stripes highest,
1.4.
16.4 The sparse head as a 3 × 8 weight grid: only 4 cells lit (D.worked.pcbm.W): zebra ← stripes, horse ← mane (+) and
long neck (−), giraffe ← long neck; "4 of 24 non-zero".
16.5 Worked logits → shares 0.77 / 0.11 / 0.11; "12 / 12 test photos (tiny example)"; amber edit: stripes z 1.41 →
−0.66 → zebra 0.14 (D.worked.pcbm.edit).
16.6 to 16.7 PCBM-h: a purple dotted residual path from the 512 features to the output adds logits (residual_logits_example);
after the same edit the hybrid still gives zebra 0.20 (hybrid.edited_probs) vs 0.14: "part of the evidence never passed
through a named concept".

## s17 Part 10 · Label-free concept bottleneck models (~2.0 min)
Real numbers from D.worked.lfcbm and the Gemini JSON (D.worked.llm.lf_zebra). A five-step rail across the top
(1 ask an LLM · 2 filter · 3 CLIP targets · 4 learn projection · 5 sparse layer), the current step lit.
17.2 The three prompts and the real JSON reply for zebra in a code card (monospace, syntax-coloured), tagged
"real reply · <model>"; counter "59 candidates".
17.3 Filter: candidate chips with strike-throughs and reason tags appearing as spoken (contains class name: zebras,
horse-like body; near-duplicate: equine; barely matches the photos: leather saddle, ossicones on head); "34 remain".
17.4 CLIP targets: a heat grid images × concepts (a slice), labelled "targets, not human labels".
17.5 Projection: ResNet-50 (frozen, 2048) → linear layer → 34 activations; two small line plots over images: CLIP target
vs learned activation for "black and white stripes" moving together; "no labels needed: 360 unlabelled crops".
17.6 Sparse final layer: 3 × 34 grid with 6 lit cells (D.worked.lfcbm.W), labels on the lit cells.
17.7 The context concepts (riding bridle, safari vehicles, wildebeest herds) get a "setting, not animal" tag; "readable
→ we can spot it".
17.8 "label-free ≠ unsupervised": three supervision sources (LLM, CLIP, class labels).

## s18 Part 10 · Language in a Bottle (~1.6 min)
Real numbers from D.worked.labo and D.worked.llm.labo.
18.1 Compared with label-free: CLIP stays the detector.
18.2 JSON of eight zebra sentences (real reply); selection: each candidate with two small bars (discriminability,
coverage gain) and the greedy pick order 1, 2, 3 (D.worked.labo.selected).
18.3 The chosen nine sentences (3 per class) as a column.
18.4 Bottleneck: CLIP scores × 100 for the worked photo (example_scores) as nine bars.
18.5 Weight grid 3 × 9: the language prior (block diagonal, 1/3) → shares 0.98 zebra; "11 / 12 test photos";
after training the grid shifts slightly → "12 / 12".
18.6 The three zebra sentences highlighted: all about stripes; a magnifier "striped ears, or stripes anywhere?"

## s19 Part 10 · Comparing the variants (~0.8 min)
The four-row table from s10 becomes a comparison table: columns supervised CBM · CEM · PCBM (and -h) · label-free ·
LaBo; rows concept source · detector · representation · what reaches the head. Cells fill as spoken. Final line:
"naming a concept ≠ detecting it: check grounding".

## s11 Part 11 · How should we evaluate a CBM? (~160 s)
11.1 to 11.5 Dashboard of four tiles, revealed in order: TASK ACCURACY, CONCEPT ACCURACY AND GROUNDING, FAITHFULNESS,
INTERVENTION UTILITY, each with its question.
11.6 The synthetic data: the real 64 x 64 test images (pixelated), the 5 concepts, 8 classes. EvTag measured "one
seed, 512 test images, synthetic".
11.7 Three architecture glyphs: black box, multi-task (concept head beside), strict CBM.
11.8 Accuracy bars: 78.7, 82.0, 81.6 (`D.measured.acc`).
11.9 Concept accuracy 92.4 (`D.measured.concept_acc.cbm`).
11.10 Test image 10 (pixelated, large): concept bars from `D.measured.example.probs`; size 0.78 highlighted;
prediction "large red square"; edit size → 0 (amber, "oracle: true value"); prediction "small red square".
11.11 to 11.12 Curve: accuracy vs number of corrected concepts 0..5: oracle (amber solid, `D.measured.oracle`) and
random mean (amber dashed) with min to max band (`random_min`, `random_max`). Label 97.3 at 1, 87.3 random at 1.
11.13 Multi-task: an edit arrow into its concept head, class scores "unchanged (verified exactly)".
11.14 Caveat panel: "one training seed · 512 synthetic test images · oracle corrections from true labels · no human
study".
11.15 Dashboard returns, each tile now holding its measured value or "not measured" (grounding, faithfulness beyond
routing, human cost).

## s12 Part 12 · Concept bottlenecks in scientific sensing (~85 s)
12.1 to 12.2 EEG x(t) with three concepts and a stage output (reuse s06 trace).
12.3 to 12.4 Kilns: concepts list for kiln type.
12.5 Side by side: Sentinel-2 crop (`kilns_obb.png`, 10 m/pixel, real) and the generated overhead view
(`chimney-pair.png` right half). Scale bars. EvTag generated on the second.
12.6 "chimney visible: unknown" (not "absent") at 10 m.
12.7 Workflow loop: inspect → correct → recompute.
12.8 "validate against ground truth".

## s13 Part 13 · Not the end of the story (~70 s)
13.1 The clean architecture x → g → ĉ → f → ŷ, large.
13.2 to 13.6 A warning marker at each stage, appearing with its beat: encoder "distribution shift", concept detector
"wrong grounding", vocabulary "missing information", head "wrong relationship", intervention "wrong or costly".
13.7 Boxed checklist of five questions (KaTeX array or HTML list).
13.8 Reference card: "Knab et al., What's in the Bottle? A Survey and Roadmap of Concept Bottleneck Models, TMLR
2026": input, concepts, output, training.

## s14 Final replay (~55 s)
14.1 Gull photo → black box → species.
14.2 The black box opens into the canonical pipeline, each stage labelled as spoken.
14.3 Edit (amber) and prediction change.
14.4 Four brief branches flicker from the pipeline: missing concept (empty slot), wrong grounding (region on the
water), soft leakage (purple undertone), faulty head (coral −2). Then they retract.
14.5 to 14.6 Clean pipeline with live flows; the final words appear as text, slowly.

## end End card
"Concept Bottleneck Models" / "Predicting through interpretable concepts." / teal rule / credits / fade to black.

---------------------------------------------------------------------------------------------------------------------
# Revision of 11 October (reviewer feedback): slides first, one source

The film and the lecture deck are now the same object. `tools/deck.mjs` bundles the scene components into a live
web deck (one slide per scene, one build step per beat; a step shows the scene **at the end of its beat**). So:

**Slide rule (binding).** The end state of every beat is a slide that a student reads without the voice: complete,
uncluttered, the key equation or numbers visible, a short heading or caption where useful. Nothing important may exist
only mid-beat. Prefer dense, information-rich end states (equations, small tables, labelled diagrams) over decorative
motion; fewer colours (role colours only; no decorative tints). Numbers support the story; they are not the story.

Timing is provisional (`src/timeline.json` is estimated from the text, `"estimated": true`); always use bs/be/bw.

## s21 Part 1 · Why not explain the black box afterwards? (new, 8 beats)
21.1 Question card: "Why not keep the black box and explain it afterwards?" Left: small black-box pipeline (gull ->
black box -> species) with a heatmap glyph labelled "post-hoc explanation". 21.2 Three numbered limit slots appear
empty on the right (1, 2, 3), titled "Three limits".
21.3 Limit 1 "Can look convincing without reflecting the model": two small saliency maps side by side, "trained
weights" and "randomised weights", nearly identical blobs (schematic, EvTag schematic "after Adebayo et al. 2018"),
an approximately-equal sign. Cite "Adebayo et al., NeurIPS 2018".
21.4 Limit 2 "Reveals a shortcut, cannot fix it": the chest X-ray (`chest.jpg`, Credit), a corner token highlighted,
arrow to "which hospital?"; small two-bar AUC chart: internal `D.lit.zech.auc_internal`, external
`D.lit.zech.auc_external` (EvTag "reported, Zech et al. 2018"). 21.5 the shortcut stays: a loop arrow "retrain
with new data" from the explanation back to the model, struck through "explanation alone".
21.6 Limit 3 "Pixels, not findings": heatmap blob vs a list of findings in teal ("joint space narrowed", "bone spur",
"black wingtips").
21.7 Right side resolves: "Interpretable by design" with the Rudin quote card ("Rudin, Nature Machine Intelligence
2019"); 21.8 the idea in one line of maths: `x -> \cvec = \gth(x) -> \yh = \fph(\cvec)` and the words "predict named
properties first, then the answer from them alone". End state: all three limits + the idea (a complete summary slide).

## s22 Part 2 · The CUB benchmark (new, 6 beats)
22.1 Title strip "Caltech-UCSD Birds-200-2011 (CUB)" with our gull photo (Credit; say on screen "our photo, not from
CUB" small). 22.2 stat cards: `D.cub.n_images` photographs, 200 species, 8 gull species. 22.3 attribute groups: a
grid of group names from `D.cub.groups` (28; show them all, small, teal outline), 312 binary attributes.
22.4 certainty: four labels with a horizontal stacked bar from `D.cub.certainty_share` (keys 4 definitely, 3
probably, 2 guessing, 1 not visible), "not visible" in grey; EvTag computed "CUB annotations, counted".
22.5 Koh's cleaning as a tiny diagram: noisy image labels -> majority vote per species -> keep attributes present in
>= 10 species -> 112 (`D.cub.n_concepts`). 22.6 the training record: photo | a 112-long 0/1 strip (show ~20 cells
then "...") with 3 named cells (e.g. has_wing_color::grey, has_bill_shape::hooked_seabird, has_upper_tail_color::white)
| species. Below: `\cvec \in \{0,1\}^{112}`, `\yh \in \{1..200\}`. End state = complete dataset summary slide.

## s23 Part 5 · The three schemes on CUB (new, 5 beats)
23.1 pipeline: CLIP image features (frozen, blue) -> linear g -> 112 concepts -> linear f -> 200 species; EvTag
measured "our run: frozen CLIP ViT-B/32 + linear models, CUB official split, one run". 23.2 horizontal bars of task
accuracy: standard `D.cub.acc.standard`, joint, sequential, independent (`D.cub.acc.*`), percent. Also concept
accuracy small: `D.cub.concept_acc` (independent and sequential share the predictor), joint `D.cub.joint_concept_acc`.
23.3 intervention axes: x = attribute groups corrected (0 to 28), y = accuracy; 23.4 draw curves from
`D.cub.intervention.{independent,sequential,joint}` (amber for corrections is the edit colour: draw the curves in
chalk/teal/grey styles with labels; mark "all groups corrected: independent reaches 100%" with the reason "each
species has its own attribute pattern"). 23.5 caption: "joint: the head reads detail in soft scores (leakage, Part 9)"
plus "Koh et al. report the same pattern (Table 1, Fig. 4)" with `D.lit.koh_cub_err` as a tiny table of errors.

## s24 Part 10 · Grounding the concepts: VLG-CBM (new, 6 beats)
24.1 title card + problem: the gull photo with three LLM concepts as chips: "grey back" (visible, tick), "loud
laughing call" (non-visual, cross), "webbed feet" (hidden behind the rock? use "not visible" grey). 24.2 "random
words reach similar accuracy" (Srivastava et al. 2024): two bars, illustrative (EvTag "reported qualitatively, VLG-CBM
paper"; do not invent numbers: draw bars without numbers, labelled "LLM concepts" and "random words", nearly equal).
24.3 detector step: the gull photo with boxes drawn at `D.gull.regions` (bill, head, wingtip, tail) labelled with
concept names (EvTag illustrative "boxes drawn for teaching, not a detector run"). 24.4 grounded labels -> BCE:
`\closs{L_C} = \sum_j \text{BCE}(c_j^{\text{det}}, \ch_j)`. 24.5 NEC: a head matrix with 5 non-zero weights per class
highlighted; `\text{NEC} = \frac{1}{K}\sum_k \|W_{k,:}\|_0`. 24.6 `VariantCard` (kit) name "VLG-CBM (Srivastava et al.,
NeurIPS 2024)" rows: g `\ch = W_c\, e(x)` trained on detector labels; c "concept scores"; f sparse linear, NEC fixed;
train `W_c,\ f`; data images + class labels + a detector.

## s25 Part 10 · Classification by description (new, 6 beats)
25.1 ladder strip at top: {x,c,y} -> {x,y} -> none, the last rung lit. Title "Menon and Vondrick, ICLR 2023".
25.2 JSON-like card of the LLM descriptors for "Herring Gull" from `D.cub.cbd.gull_photo.per_species["Herring Gull"]
.descriptors` (mono, teal strings). 25.3 the formula `\yh_k = \frac{1}{|D_k|}\sum_{d\in D_k} \cos(\phi(x), \psi(d))`,
"no training". 25.4 our gull photo + per-descriptor bars for two species (Herring Gull, and the winner from
`D.cub.cbd.gull_photo.top[0]`), each with its average; the winner edges ahead (show 3 decimals: the gap is tiny);
EvTag computed "CLIP ViT-B/32, Menon et al.'s released descriptors". 25.5 two facts: on CUB, CBD `D.cub.cbd.acc` vs
class names `D.cub.cbd.classname_acc` (ours; paper `D.lit.menon_b32`); a wrong descriptor: California Gull "a white
bird with a black head and bill" from `D.cub.cbd.gull_descriptors["California Gull"][0]` flagged amber/cross "it
does not". 25.6 `VariantCard` name "Classification by description" rows: g CLIP image and text encoders; c
`\ch_d = \cos(\phi(x),\psi(d))`; f `\yh_k = \text{mean}_{d \in D_k}\, \ch_d` (fixed); train nothing; data none.

## s03 revisions (beats re-numbered!)
Representation is now 6 beats (3.4 to 3.9): binary `c_j \in \{0,1\}`; soft `\ch_j = \sigma(z_j)\in[0,1]` + the
calibration caveat; categorical `\ch_{\text{wing}} = \text{softmax}(z)` over a list (grey, black, white, brown) summing
to 1; continuous `\ch_{\text{bill}} \in \mathbb{R}` (mm, regression); embedding / distribution `\ch_j \in \mathbb{R}^m`,
`p(c_j \mid x)` ("Part 10"); unknown: CUB "not visible" (`c_j = \varnothing`, grey), "unknown is not absent".
End state of 3.9 = a complete table of the six representations with their maths. Then EEG spindle (2 beats), the
support message (1 beat), closing line. The kiln beat is gone.

## s10 revisions
New beat 10.3: the supervision ladder, three rungs with the data each needs: CBM / CEM {x, c, y}; PCBM, LF-CBM,
LaBo, VLG-CBM {x, y}; CBD: none. Keep it on screen (smaller) for the rest of the scene. 10.5 mentions "for each, the
path from x to c to y": show the `VariantCard` skeleton (labels only) as a preview.

## s15, s16, s17, s18: final beat (new) = VariantCard
Each scene gains one final beat "In symbols: ...". Fade the scene's content to 0.15 opacity and show `VariantCard`:
- CEM (Espinosa Zarlenga et al., NeurIPS 2022): g `\gth: x \mapsto (p_j, c_j^+, c_j^-)`; c `\ch_j = p_j c_j^+ + (1-p_j)c_j^- \in \mathbb{R}^m`;
  f `\fph(\ch_1,\dots,\ch_k)`; train `\gth,\ \fph` (RandInt); data `\{(x, c, y)\}`.
- PCBM (Yuksekgonul et al., ICLR 2023): g `\ch_j = \langle e(x), v_j\rangle` (frozen e, concept bank v); c concept projections;
  f `\fph` sparse linear (+ residual `r(e(x))` in PCBM-h); train `\fph` only; data `\{(x, y)\}` + concept bank.
- LF-CBM (Oikarinen et al., ICLR 2023): g `\ch = W_c\, e(x)`, `W_c` fitted to CLIP scores with cos³; f sparse linear;
  train `W_c,\ \fph`; data `\{(x, y)\}`, no concept labels.
- LaBo (Yang et al., CVPR 2023): g `\ch_j = \cos(\phi(x), \psi(s_j))` (CLIP); f linear, initialised from the language
  prior; train `\fph`; data `\{(x, y)\}`.

## s19 revision: the comparison table
Columns: variant | concepts from | what reaches the head | trained | data needed. Rows: CBM, CEM, PCBM, LF-CBM, LaBo,
VLG-CBM, CBD (7). 19.1 reveals the "data needed" column first (highlight); 19.2 the rest by row; 19.3 what reaches
the head; 19.4 the grounding warning as a footer. Maths in KaTeX, compact. End state = the summary table.

## s12 rewrite: Beyond images (7 beats)
Five cards in a row (or 3+2), each: domain, input glyph, concepts (teal chips), task, source.
12.2 Medicine: `knee.jpg` (Credit) "Osteoarthritis Initiative knee X-rays", concepts "joint space narrowing, bone
spurs, sclerosis ..." (`D.lit.oai.concepts` = 10 findings), task "KL grade (4 levels)", "Koh et al. 2020".
12.3 Language: a short illustrative review card ("The pasta was superb but the waiter ignored us for twenty minutes.")
-> food +, service -, ambiance, noise (`D.lit.cebab.concepts`) -> stars; "CEBaB (Abraham et al. 2022); text bottleneck
models (Ludan et al. 2023)". 12.4 ICU: a vital-sign trace (Wave) -> clinical concepts -> "vasopressor needed soon?",
"Wu et al., MLHC 2022". 12.5 Wearables: accelerometer trace -> low-level activities (walking, bending, lifting) ->
complex activity; "X-CHAR, Jeyakumar et al. 2023". 12.6 Sleep: EEG (Wave, schematic) -> spindle, K-complex, slow
waves -> stage. 12.7 the recipe line across the bottom: "name the findings experts check -> predict them -> decide
from them alone". End state: all five cards + recipe.

---------------------------------------------------------------------------------------------------------------------
# Revision 2 of 11 October: breathing space (binding for every scene written or revised from now on)

Nipun's direction: freer slides with more breathing space; break content into more slides; more gradual; colour-code
the maths and the matching words; introduce maths gently; good motivation; examples with actual or illustrative
vectors for every method.

**One idea per slide.** Each beat is one slide. Its end state shows: the slide heading (`SlideHead`, one sentence that
states the idea, colour-coded), ONE focal visual, at most ONE equation line, at most TWO short text lines. Leave at
least a third of the canvas empty. Content inside x 160..1760, y 290..930 (heading at y 196).

**Replace, do not accumulate.** When the idea changes, clear the stage: fade the old slide out (0.3 s), then fade the
new one in (0.3 s) on the beat's first words. Nothing from the previous slide stays except, where it genuinely helps,
a small context element (for example a tiny pipeline glyph in a corner). No summary walls: a final recap slide may
list at most 4 short items.

**Colour = role, in maths AND in words.** Use the kit's `Rich` / `SlideHead` mini-markup: `{x:photo}` blue,
`{c:concepts}` teal, `{f:task head}` light grey, `{e:edit}` amber, `{l:loss}` coral, `{k:leak}` purple, `{y:answer}`
white bold, `$...$` inline KaTeX with the colour macros (`\cin{}`, `\ccon{}`, `\chead{}`, `\cedit{}`, `\closs{}`,
`\cleak{}`, `\gth`, `\fph`, `\ch`, `\cvec`, `\yh`). A word that names a symbol always has that symbol's colour.

**Gentle maths.** Words first, then symbols: show the idea in coloured words (e.g. "{x:photo} → {c:concepts} →
{y:answer}"), and only then the same line in symbols directly underneath, aligned term by term, same colours. At most
one new symbol per slide. Equations 52 to 64 px; body text 32 to 38 px; labels >= 26 px.

**Concrete vectors.** Whenever a method maps one thing to another, show a small example vector or matrix with named
entries (3 to 6 entries, values from `D` when they exist, otherwise tagged `illustrative`).

**Text.** Plain, active, specific. No em or en dashes, no "not X but Y" unless X is defined first, no dramatic
fragments, British spelling. On-screen text is shorter than the narration (a phrase, not the sentence).

Kit additions: `Rich`, `SlideHead`, `ROLE` in `src/kit/core.tsx`; EvTag kinds `data` and `reported`.

## s21 · Post-hoc or interpretable by design? (rewritten, 13 beats, Part 1)
21.1 Two columns, each a simple diagram. Left "post-hoc": [trained model] → [explanation method] → heatmap glyph.
     Right "ante-hoc (interpretable by design)": [model whose middle is a column of named values] → answer.
21.2 Post-hoc: `{f:trained model f}` and `{x:input x}` → [explanation method] → "evidence". Equation:
     `\text{evidence} = E(\chead{f}, \cin{x})`.
21.3 Saliency: a small 6×6 pixel grid (illustrative values) beside the formula `s_i = \left|\partial \hat y_k / \partial \cin{x_i}\right|`
     with the words "how much the {y:score} changes when {x:pixel i} changes". Cite "Simonyan et al. 2014".
21.4 Occlusion: the real gull occlusion map (`D.clip.drop`, as in s01) and `\Delta_p = \hat y_k(\cin{x}) - \hat y_k(\cin{x}\ \text{with patch } p\ \text{greyed})`.
     EvTag computed (CLIP, Part 1).
21.5 TCAV, step 1: a 2-D scatter of activations: teal dots "images with stripes", grey dots "without", a linear
     boundary and the arrow `\ccon{v}_{\text{stripes}}` normal to it. Words: "{c:concept direction} in the activations
     $h(\cin{x}) \in \mathbb{R}^d$". Cite "Kim et al., ICML 2018". Illustrative tag.
21.6 TCAV, step 2: a few zebra images as dots with small gradient arrows; those with positive dot product
     `\nabla_h \hat y_{\text{zebra}} \cdot \ccon{v} > 0` turn white; the score = fraction (illustrative, e.g. 8 of 10;
     tag illustrative). One sentence: "how often the {y:zebra score} rises along {c:stripes}".
21.7 Limit 1 alone (Adebayo): trained vs randomised saliency, ≈. Schematic tag, citation.
21.8 Limit 2 alone (Zech): chest X-ray (`chest.jpg`, Credit) with the corner marker, "which hospital?", and the AUC
     pair `D.lit.zech.auc_internal` / `auc_external` as two bars. Line: "fix = new data + retraining". Reported tag.
21.9 Limit 3 alone: heatmap (gull occlusion) on the left labelled "pixels"; on the right three teal finding chips
     "joint space narrowed", "bone spur", "black wingtips" labelled "findings"; a struck-through pencil: "nothing to
     correct inside the model".
21.10 Ante-hoc examples, three small panels: sparse linear model ($\yh = 2.1\,\ccon{\text{wingtip black}} - 1.3\,\ccon{\text{bill hooked}} + \dots$),
     a 2-level decision tree on named features, a prototype panel ("this part looks like that part", Chen et al. 2019,
     two image crops of the gull head). All illustrative.
21.11 Rudin quote card alone, centred, generous whitespace: paraphrase + "Rudin, Nature Machine Intelligence 2019".
21.12 The CBM idea in WORDS only: "{x:photo} → {c:concepts} → {y:answer}", big, centred, with the gull thumbnail
     under "photo", three teal chips under "concepts", "herring gull" under "answer".
21.13 The same line with SYMBOLS directly beneath each word: `\cin{x} \xrightarrow{\gth} \cvec \xrightarrow{\fph} \yh`,
     colours matching; small labels "concept predictor $\gth$", "task head $\fph$".

## s22 · The CUB benchmark (rewritten, 9 beats, Part 2): one idea per slide
22.1 Our gull photo (Credit, "our photo, not from CUB") + "Caltech-UCSD Birds-200-2011 (CUB)", "Wah et al. 2011".
22.2 Two big numbers: `D.cub.n_images` photographs, 200 species; below, "8 gull species" with their names small.
22.3 The 28 group names (`D.cub.groups`) in a calm grid, the four spoken ones highlighted; "312 yes-or-no attributes".
22.4 Two attribute questions as cards: "has a hooked bill?" → {c:1}, "wing colour grey?" → {c:1}, and a "no" example →
     0; then `c_j \in \{0, 1\}` (gentle first symbol, teal).
22.5 Certainty: the stacked bar from `D.cub.certainty_share`, "not visible" grey; DATASET tag.
22.6 Majority vote: three small rows of noisy 0/1 labels for three photos of one species → one species row (amber
     not used; teal for agreed values). Words: "vote within each {y:species}".
22.7 312 → 112: a funnel or two stacked bars with "present in at least 10 species".
22.8 The training record strip with the real Herring Gull vector (`D.cub.herring_gull`, first 20 of 112, 3 named),
     DATASET tag (reuse the current S22 implementation).
22.9 Symbols, gently: words row "{c:concept labels}  {y:species}" above `\ccon{c} \in \{0,1\}^{112}`,
     `y \in \{1,\dots,200\}`, then `\cvec = \gth(\cin{x}) \in [0,1]^{112}` "one value per concept".

## Revision 2 rollout: workflow (binding)
Content lives in `narration/order.txt` + `narration/scenes/<id>.txt` (one line per slide step:
`[[Slide heading with colour markup]] Spoken narration ... || pause`). `docs/lecture.md` is generated from them and
is what Nipun reviews as text. A scene author OWNS the narration file(s) and scene file(s) of their scenes:
1. Rewrite the narration file in the Revision 2 style: one idea per line, usually 1–2 sentences (split long beats;
   add a motivation line at the start of each scene: why this matters / what problem it solves), every line gets a
   `[[heading]]` (short sentence, colour markup for role words). Keep every fact and every number; add no new facts
   (you may use facts in docs/lineage_facts.md and values in src/data.json). Keep the scene's total words within
   about ±15%. Humanizer rules: plain and active, no em/en dashes, no "not X but Y" before X is defined, no dramatic
   fragments, no "let's dive in", British spelling, numbers written as spoken. Keep "{tags: [calm]}" where present.
2. Run `tools/content.sh` (rebuilds script.json, lecture.md, the provisional timeline and beats.txt, and tests the
   spoken numbers; fix any untraceable number).
3. Rewrite the scene in the Revision 2 style (see the pilots `src/scenes/S21.tsx`, `S22.tsx`): one slide per beat,
   `<SlideHead text={bh(P, k)} o=... />` (heading text ONLY from the narration file), slides replace each other
   (fade out 0.3 s before the next beat, fade in on its first words), one focal visual, ≤ 1 equation line, ≤ 2 short
   text lines, ≥ a third of the canvas empty, colour-coded words (`Rich`) and maths (macros), words before symbols.
   Reuse good drawings from the current scene file; existing numbers stay read from `D`.
4. For every method or mapping, show concrete vectors: small named column vectors / matrices (3–6 entries) for
   e(x), ĉ, W rows and ŷ, from `D` where they exist (e.g. `D.worked.*`, `D.zoo`, `D.bird`, `D.cub`), otherwise tagged
   illustrative.
5. Check every beat-end frame (beat end − 0.05 s) with `node tools/stills.mjs <id> <t1> <t2> ...` (times listed
   explicitly; TMPDIR on the SSD), contact sheets, Read them; 2–3 rounds; `npx tsc --noEmit -p .` clean for your files.
Never edit another author's files or the shared kit/data/tools. If you need a kit change or a new number, say so in
the report.
