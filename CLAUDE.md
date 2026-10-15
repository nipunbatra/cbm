# CBM lecture-film

"Concept Bottleneck Models: from black-box predictions to interpretable, editable concepts", a ~23-minute graduate
lecture-film in the series after `../yolo` and `../detr` (same stack, look, voice and pipeline). Remotion + React + SVG +
KaTeX, Gemini TTS (voice Orus, tempo 1.12), original synthesised music bed, every number computed in code.

## Pipeline (`tools/build.sh` runs it in order; failing tests stop the build)
1. `blackbox/clip_blackbox.py` (run once; needs the local CLIP cache, see the script) → `blackbox/clip_outputs.json`.
2. `math/data.py` → `src/data.json`. Reads the lecture's illustrative heads and the saved shape experiment from
   `~/git/dl-teaching` (read only; the preserved-evidence hashes are asserted), plus the CLIP outputs.
3. Tests: `math/numerical_validation.py` (independent recomputation, incl. the saved checkpoint) and
   `math/test_narration.py` (every spoken number traceable).
4. `narration/order.txt` + `narration/scenes/*.txt` → `narration/compile.py` → `script.json`; `tools/tts.py .` (missing or changed beats only);
   `tools/asrcheck.py . --only ... --fix 2`; then `tools/asr_beats.py` on the final track (catches spoken style tags:
   beats opening with a title-like phrase leaked; `{tags: [calm]}` fixed 0.1 and 10.3). Reviewed exceptions:
   `qa/asr_reviewed.json` (hash-pinned).
5. `tools/timeline.py . --tempo 1.12`; `tools/loudnorm.sh`; `tools/music.py` (pads, bells, a quiet saw arpeggio; ducked;
   bed ≈ −33 LUFS under a −16 LUFS voice); `tools/captions.py`; `tools/narration_md.py`; `tools/beats.py`.
6. Render: `node tools/render.mjs animatic|1080|4k|4k-cc` → `$CBM_OUT` (default `/Volumes/Extreme SSD/cbm-film`).
   Stills: `node tools/stills.mjs s07 [t ...]`. Frame QA + OCR: `~/base/bin/python tools/qa_video.py <mp4>`.

Internal disk is nearly full: audio lives in `/Volumes/Extreme SSD/cbm-film/audio` (symlinks in `narration/` and
`public/`); `node_modules` is a symlink to `../detr/node_modules`.

## Content-first workflow (since 11 October): one source for slides and film
- Content: `narration/order.txt` (voice settings + scene order) and `narration/scenes/<id>.txt`, one line per slide
  step: `[[Slide heading]] narration || pause`. `narration/compile.py` -> `script.json` + `docs/lecture.md` (the
  readable lecture). `tools/content.sh` rebuilds script.json, lecture.md, the provisional timeline
  (`tools/timeline_est.py`, no audio needed) and docs/beats.txt, and runs the spoken-number test.
- Visuals: one scene component per section; one beat = one slide; headings come from the content via `bh(P, k)`;
  style rules in docs/scene_plan.md ("Revision 2": breathing space, colour-coded words and maths via kit `Rich`).
- Slides: `node tools/deck.mjs` -> `deck/` (live scene components in @remotion/player; keys: arrows, n notes,
  o overview, f full screen; `#s04.7` deep links). Vector PDF: `node tools/deck_pdf.mjs deck out.pdf` (one page per
  step, printed one step per page load over http).
- Film (after slide review): TTS from script.json, `tools/timeline.py` replaces the provisional timeline, render as
  before. Our CUB run: `cub/cbm_cub.py` (CLIP features on the SSD) -> `cub/cub_results.json` -> data.json `cub`.
- Internal disk is nearly full: `export TMPDIR="/Volumes/Extreme SSD/cbm-film/tmp"`; `qa/` and `out/` are symlinks
  to the SSD.

## Scenes
`src/scenes/SNN.tsx`, registry `src/scenes/index.ts`. Kit: `src/kit/core.tsx` (shared with YOLO/DETR),
`src/kit/cbm.tsx` (CBM vocabulary), `src/kit/pipe.tsx` (the recurring gull pipeline, used by s02, s06, s14),
`src/kit/theme.ts` (colour = meaning: input blue, concepts teal, head dark grey, human edits amber, losses/gradients
coral, leakage/bypass purple). Read `docs/SCENE-GUIDE.md` and `docs/scene_plan.md` before editing a scene.

## Evidence rules
Every number-bearing visual carries an `EvTag`: computed (CLIP, s01), measured (shape experiment), illustrative
(hand-written heads), constructed (leakage, blue circle/square, faulty head), schematic (EEG), generated (chimney view).
Never relabel illustrative values as measured. Photos are CC BY-SA from Wikimedia Commons (`assets/image_sources.json`);
show `CREDIT[src]`.
