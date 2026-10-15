# Concept Bottleneck Models: from black-box predictions to interpretable, editable concepts

A ~31-minute graduate lecture-film in the Machine Learning Concepts series (after *Object Detection and YOLO* and
*Detection Transformers*), built with the same stack: Remotion + React + SVG + KaTeX, Gemini TTS narration (voice
Orus), an original synthesised music bed, and every number computed and tested in code. 3840 × 2160, 30 fps.

Pedagogical source: the 60-minute CBM lecture in `~/git/dl-teaching/attention-followups/concept-bottlenecks-60min`,
with Knab et al., *What's in the Bottle?* (TMLR 2026) and the primary CBM papers (see `docs/sources.md`).

## Deliverables

| Deliverable | Where |
|---|---|
| 4K master | `/Volumes/Extreme SSD/cbm-film/concept_bottleneck_models_4k.mp4` |
| 1080p master | `/Volumes/Extreme SSD/cbm-film/concept_bottleneck_models_1080p.mp4` |
| 4K with burned-in captions | `/Volumes/Extreme SSD/cbm-film/concept_bottleneck_models_captioned_4k.mp4` |
| 1080p animatic (first full cut, reviewed before the final fixes) | `/Volumes/Extreme SSD/cbm-film/concept_bottleneck_models_animatic.mp4` |
| Subtitles | `out/concept_bottleneck_models.srt`, `out/concept_bottleneck_models.vtt` |
| Narration with timecodes | `docs/narration.md` (source `narration/script.txt`) |
| Scene plan | `docs/scene_plan.md` (+ `docs/beats.txt`, `docs/SCENE-GUIDE.md`) |
| Mathematical notes | `docs/mathematical_notes.md` |
| Worked examples (Parts 9, 10; for slides) | `docs/worked_examples.md` |
| Numerical validation | `math/numerical_validation.py` (15 tests), `math/test_narration.py` |
| Technical fact check | `docs/technical_fact_check.md`, `docs/reviews/` |
| Sources and image licences | `docs/sources.md`, `assets/image_sources.json` |
| QA report | `docs/qa_report.md` |
| Editable source | scenes `src/scenes/`, kit `src/kit/` (`cbm.tsx`, `pipe.tsx`), numbers `math/data.py`, CLIP run `blackbox/`, tools `tools/` |

## Structure (22 scenes, about 31 minutes)
Title · 1 The black box (real CLIP run + occlusion map) · 2 Introducing the concept bottleneck · 3 What is a concept? ·
4 From concepts to predictions: the arithmetic · 5 How does the model learn the concepts? · 6 Human interventions ·
7 A correct edit can still hurt · 8 What if the concepts are incomplete? · 9 Concept leakage, and leakage in a trained
model (measured probe) · 10 Modern architectures: what changes, 10.1 CEM, 10.2 post-hoc CBM, 10.3 label-free CBM,
10.4 LaBo, 10.5 side by side (worked on 36 Commons photos, real Gemini JSON) · 11 How should we evaluate a CBM?
(measured experiment) · 12 Concept bottlenecks in scientific sensing · 13 An interpretable interface is not the end of
the story · Final replay · End.

Worked examples for Parts 9 and 10, ready for slides: `docs/worked_examples.md` (sources `leakage/`, `worked/`).

## Rebuild and render

```bash
tools/build.sh
```

```bash
node tools/render.mjs animatic
```

```bash
node tools/render.mjs 4k
```

Render modes: `animatic`, `1080`, `4k`, `4k-cc`, written to `$CBM_OUT` (default `/Volumes/Extreme SSD/cbm-film`).
Stills: `node tools/stills.mjs s07 [t ...]`. Frame QA + OCR: `~/base/bin/python tools/qa_video.py <mp4>`.
See `CLAUDE.md` for the pipeline in detail.
