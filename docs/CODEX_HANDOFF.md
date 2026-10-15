# Handoff: state of the CBM lecture (15 October 2026)

Read `AGENTS.md` first (how the repository works). This file says what is finished, what is pending, and how Nipun
wants the next round to go.

## What this is
Lecture 21 of ES 667 Deep Learning, "Concept Bottleneck Models". One source in this repository produces the live
slides (`npm run deck`), a vector PDF, the notes page and a narrated film. Each line of `narration/scenes/<id>.txt` is
one slide: `[[heading]] narration`. Each `src/scenes/S<id>.tsx` draws that section, slide k on beat k.
Section order: `narration/order.txt`. Readable full text: `docs/lecture.md` (generated).

## Done
- 28 sections, 322 slides, about 68 minutes of narration. Post-hoc vs ante-hoc motivation; CUB-200-2011 as the
  running benchmark (our own linear CBM run on frozen CLIP features, `cub/cbm_cub.py`); concept types; the arithmetic
  of the task head; training schemes; interventions; incompleteness and leakage; the supervision ladder and the
  variants (CEM, post-hoc CBM, label-free CBM, LaBo, VLG-CBM, classification by description) with worked vectors and
  a "compared with the plain CBM" recap before each summary card; evaluation; beyond images; failure points; replay.
- 15 Oct: saliency is a six-slide worked example (3 × 3 image, three classes, nudge a pixel, gradient, one map per
  class, backpropagation); TCAV moved out of Part 1 into an appendix section `s26` before the end card.
- Deck is click-driven: builds stop at the end of each narration sentence and wait for the next click.
- Every number comes from `src/data.json` (`math/data.py`) and carries an evidence tag (computed, measured, dataset,
  reported, illustrative, constructed, schematic). Tests: `npm run check`.
- Published: see `publishing/README.md` (deck, notes, PDF on the attention site; course page row; YouTube films).

## Pending
1. **Nipun's slide-by-slide review (now, in Codex).** He annotates slides in the deck and asks for changes. For each
   change: edit the narration line and/or the scene, run `npm run content` and `npm run check`, look at the slide in
   `npm run deck`, and add an entry to `review/CHANGES_PENDING_VIDEO.md`. Keep the style rules in `AGENTS.md`.
2. **Remake the film after the review** (not now): regenerate the voice for changed lines, real timeline, music,
   captions, render, upload unlisted. Claude Code runs this pipeline (`tools/build.sh`, see CLAUDE.md); Codex should
   not run TTS, the timeline or renders.
3. **Republish after the review**: rebuild deck + PDF, update `nipunbatra/attention` (`concept-bottlenecks/`) and the
   PDF page count on the course page, by pull request, only when Nipun asks.
4. Open checks, low priority:
   - s24 recap says label-free models are judged "at their own sparsity level"; confirm the wording against the
     LF-CBM paper.
   - Values still illustrative or schematic by design (tagged on the slides): the 6 × 6 map on the deep-network
     saliency slide, the VLG-CBM detector boxes, the TCAV example tiles, the example values in "Beyond images".

## How Nipun likes to work
- One idea per slide, generous space, colour-coded words that match their symbols, words before symbols, a small
  worked example for every new operation, plain British English without em or en dashes.
- Numbers support the story; they are not the story. Never invent a number: compute it in `math/data.py` or tag it.
- Ask before publishing anything. Review images rather than PDFs when sending to him remotely.
