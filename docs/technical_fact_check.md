# Technical fact check

Every claim in the narration that is not a computed number, with its status and evidence. Computed numbers are covered
by `math/numerical_validation.py` (15 tests) and `math/test_narration.py` (every spoken number traceable to
`src/data.json` or a listed structural constant). Claims A to M were checked by Gemini with Google Search grounding
(`docs/reviews/gemini_factcheck_survey.md`, prompt `docs/reviews/survey_prompt.md`); the survey structure was then
re-checked against the authors' companion site because Gemini's quotation of the module list was inaccurate.

## Evidence classes used in the film
| Class | Where | On-screen tag |
|---|---|---|
| Computed by a real model | s01 CLIP zero-shot shares and occlusion map | COMPUTED · REAL MODEL |
| Measured (saved experiment, one seed) | s05 λ values, s11 all numbers | MEASURED |
| Illustrative (hand-written heads and values) | gull, zebra worksheet, sleep, billing, kiln | ILLUSTRATIVE VALUES |
| Constructed counterexample | leakage distributions, blue circle / square, faulty head | CONSTRUCTED EXAMPLE |
| Schematic | EEG trace | SCHEMATIC |
| Generated image | chimney overhead view | GENERATED IMAGE |

## Claims
| # | Claim (scene) | Status | Evidence |
|---|---|---|---|
| 1 | CLIP chooses by comparing the image with a text description of each class (s01) | true | Radford et al. 2021; `blackbox/clip_blackbox.py` |
| 2 | Occlusion map: largest drops on the bill and head (s01) | true (computed) | `blackbox/clip_outputs.json`; test `test_clip_outputs` |
| 3 | A heatmap marks sensitivity, not which property was detected (s01) | true (interpretive) | standard limitation of saliency; the map has no property names |
| 4 | Strict CBM: the task head receives only the concept values (s02) | true by definition | Koh et al. 2020 |
| 5 | Multi-task: editing the concept head output does not change the class output (s02, s11) | true; measured exactly in the saved experiment | `cbm_toy_metrics.json` `multitask_intervention` |
| 6 | Glaucous-winged gull adults have grey wingtips; adult herring gulls have black wingtips (s02 visual logic) | true | Gemini check L (Cornell / field guides) |
| 7 | A soft score is not automatically a calibrated probability (s03) | true | calibration is an empirical property |
| 7a | A sleep spindle is a brief 11 to 16 Hz burst lasting about 0.5 to 2 s; scorers treat spindles as a sign of stage 2 (N2) sleep (s03) | true | AASM (spindle 11 to 16 Hz, duration ≥ 0.5 s; spindles and K-complexes define N2); Gemini check K |
| 7b | Some brick-kiln designs have a tall fixed chimney and others do not, so "chimney visible" is a clue to kiln type (s03) | true | fixed-chimney designs (FCBK, zigzag) vs traditional clamp kilns without a chimney |
| 8 | Koh et al. compared independent, sequential and joint training; in independent training the head is fit on true concepts (s05) | true | Koh et al. 2020; Gemini check A |
| 9 | Joint training: task gradients reach the concept predictor; can help the task and can pull against concept fidelity; must be measured (s05) | true, stated with appropriate hedging (no claim that it always causes leakage) | Koh et al. 2020; Mahinpei et al. 2021 |
| 10 | The measured experiment used joint training, λ_c = 2, λ_y = 1 (s05) | true | `train_concept_bottleneck_toy.py` line 124: `loss + 2 * BCE`; metadata |
| 11 | Wing colour corrected as a group (s06) | design choice for categorical concepts | lecture teaching guide §14 |
| 12 | Spindle ~13 Hz burst; real staging scores 30 s epochs with rules (s06) | true; trace is schematic | AASM (spindles 11 to 16 Hz, ≥ 0.5 s; 30 s epochs); Gemini check K; test `test_eeg_spindle_frequency` |
| 13 | A correct concept edit can lower the correct class score when the head has a wrong-signed weight (s07) | true (existence, constructed) | `illustrative-counterexample.json`; test `test_faulty_head` |
| 14 | No head can separate inputs with identical concept vectors; best accuracy 50 % on the pair (s08) | true (proof by enumeration) | test `test_incomplete_vocabulary_caps_accuracy` |
| 15 | Sufficiency Y ⫫ X given C is stronger than the routing guarantee of a strict CBM (s08) | true | lecture guide §42 |
| 16 | Grévy's zebras have narrower, denser stripes than plains zebras (s09) | true | Gemini check M |
| 17 | Soft scores can carry information beyond the declared concept (leakage); explicit side paths also leak (s09) | true | Mahinpei et al. 2021; Havasi et al. 2022; Knab et al. 2026 (leakage through continuous activations vs bypass) |
| 18 | Ordinary confidence variation is not by itself leakage (s09) | true (definitional caution) | lecture guide §43 |
| 19 | CEM: two embeddings per concept from the input, mixed by a predicted probability; intervention sets p (s10) | true | Zarlenga et al. 2022; Gemini check C |
| 20 | PCBM: frozen encoder, concept directions from examples or text, projection, sparse linear head; hybrid adds a residual path (s10) | true | Yuksekgonul et al. 2023; Gemini check D |
| 21 | Label-free CBM: VLM similarity targets for a learned projection; sparse final layer trained with task labels (s10) | true | Oikarinen et al. 2023; Gemini check E |
| 22 | LaBo: LLM proposes class concepts, selection, CLIP scores, trained classifier (s10) | true | Yang et al. 2023; Gemini check F |
| 23 | Measured accuracies 78.7 / 82.0 / 81.6 %, concept accuracy 92.4 %, 97.3 % after one oracle correction, 87.3 % random, 100 % with all five (s11) | true (saved evidence, hashes verified) | `cbm_toy_metrics.json`; test `test_measured_values` |
| 24 | Test image 10: size 0.78, large → small red square after setting size to 0 (s11) | true, recomputed from the checkpoint | test `test_measured_example_from_checkpoint` |
| 25 | One seed, 512 synthetic test images, oracle corrections from true labels, no human study (s11) | true | metadata; lecture README |
| 26 | Sentinel-2 at 10 m per pixel; chimneys not resolvable; chimney should be "unknown", not "absent" (s12) | true (10 m bands) / recommended practice | Sentinel-2 specification; lecture guide §15 |
| 27 | Sleep scorers look for spindles, K-complexes and slow waves (s12) | true | AASM; Lucey et al. 2016 |
| 28 | Knab et al. organise the field into input, concept, output and training modules and list grounding, completeness, leakage and intervention reliability among open challenges (s13) | true | companion site (checked 9 Oct 2026); Gemini's quote listed "semantics, grounding, output, training", which mis-states the module names |

## Claims added for the expanded Parts 9 and 10
| # | Claim (scene) | Status | Evidence |
|---|---|---|---|
| 29 | Correcting a leaked concept to its true value can produce a wrong prediction when the head relies on the soft value (s09) | true (constructed demonstration) | follows from the constructed head; consistent with Havasi et al. 2022 on interventions with soft concepts |
| 30 | In the saved shape model, p(large) rises smoothly with the true radius (0.09, 0.25, 0.63, 0.87 at 12 to 15 px) (s20) | true (measured) | `leakage/shape_probe.json`; regenerated split asserted equal to the saved one |
| 31 | Linear probes from the soft scores recover essentially none of position or shade (s20) | true (measured) | cross-validated R² −0.02 to 0.02 |
| 32 | Hard concepts stop extra information at the cost of graded evidence; independent training fits the head on true binary concepts (s20) | true | Havasi et al. 2022; Koh et al. 2020 |
| 33 | Koh et al.'s CUB setup used 112 binary concepts per photograph (s10) | true | Koh et al. 2020, §4 (112 attributes after filtering) |
| 34 | CEM computes positive and negative embeddings per concept from the input and mixes them with p; trained with random interventions (s15) | true | Zarlenga et al. 2022 (RandInt) |
| 35 | PCBM reuses a frozen pretrained encoder, concept directions can come from CLIP text, the head is sparse linear, PCBM-h adds a residual on the features (s16) | true | Yuksekgonul et al. 2023 |
| 36 | Label-free CBM asks an LLM for important features, things seen around, and superclasses; filters by length, class similarity, duplicates and image activation; learns a projection with a cubed-cosine objective; trains a sparse final layer (s17) | true | Oikarinen et al. 2023 (prompts, filters, cos³, GLM-SAGA); our filters follow the same rules with stated cutoffs |
| 37 | LaBo keeps CLIP as the detector, selects concepts by discriminability and coverage, initialises the class-concept weights from a language prior (s18) | true | Yang et al. 2023 |
| 38 | All worked numbers in Part 10 (shares, sparsity, accuracies) | computed on 36 photos; labelled as a teaching example, not a benchmark | `worked/compute.py`, `worked/worked_examples.json` |

## Wording decisions
- "prefers ... with a softmax share of 0.54" rather than "high confidence": 0.54 over six names is a preference, not
  high confidence.
- The gull classes are named species (glaucous-winged gull, American herring gull) because the photograph is labelled
  by its author as an American herring gull and the wingtip field mark separates the two; all CBM scores remain
  illustrative.
- "Grévy's zebras, with their narrower and denser stripes, scores around 0.96" is introduced with "Suppose": the
  dependence of the score on stripe density is part of the constructed example, not a measured detector property.
