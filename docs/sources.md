# Sources

## Pedagogical source
- *Concept Bottleneck Models* 60-minute lecture (`~/git/dl-teaching/attention-followups/concept-bottlenecks-60min`,
  PDF `output/concept-bottleneck-models-60min.pdf`): the teaching order, the illustrative heads
  (`output/illustrative-heads.json`), the faulty-head counterexample (`output/illustrative-counterexample.json`), the
  zebra / horse / giraffe worksheet, the blue circle / square collision, the 0.72 / 0.96 leakage construction, and the
  measured shape experiment (`results/cbm_toy_metrics.json`, `scripts/train_concept_bottleneck_toy.py`, checkpoints in
  `results/cbm_toy/`; hashes in `output/preserved-evidence.json`, re-verified by `math/numerical_validation.py`).

## Survey
- P. Knab, D. Steinmann, C. Bartelt, K. Kersting, B. Schiele, T. Seidl, U. Schlegel, W. Stammer. *What's in the
  Bottle? A Survey and Roadmap of Concept Bottleneck Models.* TMLR 2026. https://openreview.net/forum?id=IF5vnqxBEW ;
  companion site https://patrick-knab.github.io/whats-in-the-bottle/ (input, concept, output, training modules;
  semantics vs grounding; open problems: concept acquisition and semantics, grounding, representation and
  completeness, leakage and enforcement, intervention reliability, validation and scope).

## Primary papers (what each supports in the film)
| Paper | Used for |
|---|---|
| Koh et al., *Concept Bottleneck Models*, ICML 2020. https://proceedings.mlr.press/v119/koh20a.html | the x → c → y architecture, independent / sequential / joint training, test-time interventions (Parts 2, 5, 6) |
| Zarlenga et al., *Concept Embedding Models*, NeurIPS 2022. https://arxiv.org/abs/2209.09056 | positive / negative concept embeddings mixed by a probability (Part 10) |
| Yuksekgonul et al., *Post-hoc Concept Bottleneck Models*, ICLR 2023. https://arxiv.org/abs/2205.15480 | frozen features projected onto concept vectors, sparse head, PCBM-h residual (Part 10) |
| Oikarinen et al., *Label-Free Concept Bottleneck Models*, ICLR 2023. https://arxiv.org/abs/2304.06129 | archived background; the paper-specific walkthrough was removed in review r26 |
| Yang et al., *Language in a Bottle (LaBo)*, CVPR 2023. https://arxiv.org/abs/2211.11158 | Archived background; LaBo walkthrough removed from the current lecture in review r27 |
| Srivastava et al., *VLG-CBM: Training Concept Bottleneck Models with Vision-Language Guidance*, NeurIPS 2024. https://arxiv.org/abs/2408.01432 | Archived background; grounded-model walkthrough removed from the current lecture in review r27 |
| Mahinpei et al., *Promises and Pitfalls of Black-Box Concept Learning Models*, 2021. https://arxiv.org/abs/2106.13314 | information beyond the concepts in soft representations (Part 9) |
| Havasi et al., *Addressing Leakage in Concept Bottleneck Models*, NeurIPS 2022 | leakage through soft concepts and side channels (Part 9, background) |
| Margeloiu et al., *Do Concept Bottleneck Models Learn as Intended?*, 2021. https://arxiv.org/abs/2105.04289 | concepts may not be grounded in the intended input evidence (Parts 3, 13) |
| Shin et al., *A Closer Look at the Intervention Procedure of CBMs*, ICML 2023. https://proceedings.mlr.press/v202/shin23a.html | intervention gains depend on which concepts are corrected and in what order (Part 11) |
| Radford et al., *CLIP*, ICML 2021. https://proceedings.mlr.press/v139/radford21a.html | the Part 1 black box (zero-shot image–text similarity) |
| Berry et al., *The AASM Manual for the Scoring of Sleep and Associated Events* (AASM); Lucey et al. 2016, https://pmc.ncbi.nlm.nih.gov/articles/PMC5135638/ | 30 s epochs; spindles (11 to 16 Hz) and K-complexes in N2 (Parts 6, 12; domain context only) |
| SentinelKilnDB (Sustainability Lab, IIT Gandhinagar) | the Sentinel-2 kiln crop (Part 12) |

## Images (licences)
| File | Source | Licence |
|---|---|---|
| `public/img/gull.jpg` | Rhododendrites, *American herring gull at Jones Beach (04450)*, Wikimedia Commons, https://commons.wikimedia.org/wiki/File:American_herring_gull_at_Jones_Beach_(04450).jpg (2560 px rendition, square crop) | CC BY-SA 4.0 |
| `public/img/zebra_plains.jpg` | Yathin S Krishnappa, *Equus quagga burchellii - Etosha, 2014*, Wikimedia Commons | CC BY-SA 3.0 |
| `public/img/zebra_grevy.jpg` | Gzen92, *Zèbre de Grévy (Equus grevyi)*, Wikimedia Commons | CC BY-SA 4.0 |
| `public/img/horse.jpg` | Dietmar Rabich, *Dülmen, Merfeld, Wildpferdebahn -- 2015 -- 6792*, Wikimedia Commons | CC BY-SA 4.0 |
| `public/img/giraffe.jpg` | Hans Hillewaert, *Giraffa camelopardalis angolensis*, Wikimedia Commons | CC BY-SA 4.0 |
| `public/img/kilns_obb.png` | SentinelKilnDB figure: Sentinel-2 imagery (contains modified Copernicus Sentinel data) with the dataset's oriented-box annotations, from the DETR film | dataset CC BY-NC 4.0 |
| `public/img/chimney-pair.png` | generated illustration of a fictional site (from the CLIP lecture; labelled "generated" on screen) | teaching asset |
| `public/img/test_*.png` | the measured experiment's real 64 × 64 synthetic test inputs | generated by the training script |

Full metadata (artist, licence URL, description, original size): `assets/image_sources.json`. Photos are shown with a
credit line on screen and in the end card. The CC BY-SA licences apply to the photographs, not to the film's code.

## Parts 9 and 10 worked examples (revision of 10 October 2026)
- 36 Wikimedia Commons photographs of zebras, horses and giraffes (12 each; 28 CC BY-SA 4.0, 6 CC BY-SA 3.0, 1 CC BY 4.0,
  1 public domain). Per-photo title, artist, licence and page: `worked/photos/meta.json`. The worked photo
  `zebra_12.jpg` is by Diego Delso (CC BY-SA 4.0). 36 further unlabelled candidates in `worked/photos_raw/` (same
  sources) were used only to learn the label-free projection.
- Concept proposals: Gemini (`gemini-3.1-pro-preview`, temperature 0, JSON output) with the prompts of Oikarinen et al.
  (label-free CBM) and a LaBo-style description prompt; raw replies saved in `worked/llm_concepts.json`.
- Models: CLIP ViT-B/32 (image and text encoders), torchvision ResNet-50 (IMAGENET1K_V2) as the label-free backbone,
  sentence-transformers all-MiniLM-L6-v2 for the text-similarity filters (Oikarinen et al. use mpnet).
- Measured leakage probe: `leakage/probe_shapes.py` reads the saved shape-model predictions and regenerates the
  deterministic test split (seed 303) to recover radius, position and shade; nothing is retrained.
- Havasi et al., *Addressing Leakage in Concept Bottleneck Models*, NeurIPS 2022 (hard concepts, side channels).

## Software and models
Remotion 4, React 19, KaTeX 0.16, Gemini TTS (`gemini-3.8-flash-tts`, voice Orus) for narration, Gemini transcription
for ASR checks, CLIP ViT-B/32 via Hugging Face transformers 5.5 (local cache), PyTorch 2.9, NumPy, FFmpeg, Tesseract.
Music: original, fully synthesised in `tools/music.py` (no samples).
