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

## Review updates
- 15 Oct, first review comment: reduced the six saliency slides to two (s21.3 and s21.4). The deck now has 318 slides;
  s21 has 16. Later s21 slide numbers move up by four. See `review/CHANGES_PENDING_VIDEO.md`.
- PDF review: s21.3-4 now introduce the saliency formula with a small pixel-nudge calculation, then show vertical-bar,
  horizontal-bar and dot examples with matching class maps on one brightness scale. Values are in `D.saliency_toy`.
- The model sanity check (old s21.10-11, now s21.6-7) first shows photo, model, chosen class score, explanation method
  and heatmap. It then holds the photo, class and method fixed while replacing learned weights with random values.
  The takeaway is to check whether the map depends on the learned weights. Guided backpropagation is the reported
  failure example; plain gradients are distinguished in the narration. The maps remain explicitly schematic.
- `npm run content` now leaves both saved film timelines and `docs/beats.txt` untouched. The deck reads the updated
  script and uses temporary preview timing in memory for changed scenes. Review via the deck until Claude Code
  remakes the audio and film. The saved film timing still describes the previous narration.
- Annotation PDF: `review/cbm-lecture-review-2026-10-15.pdf` (generated, ignored by git), 318 pages with slide IDs and
  section bookmarks. Both review simplifications are included: pages 14-15 and 17-18. `npm run deck:pdf` now exports
  the current script's slide list, independently of the saved film timeline.
- Revised annotation PDF: `review/cbm-lecture-review-2026-10-15-r2.pdf`. Pages 14, 15, 17 and 18 include the PDF
  comments above; all other page content and all 318 page numbers are preserved. Keep the original PDF for its
  annotation references. The updated narration remains available through N in the deck.
- PDF page 67 review: s04 now follows image, concept predictor, predicted concepts, task head, class scores and
  softmax probabilities. It distinguishes per-image concept estimates from fixed layer weights, explains the
  illustrative values, and introduces the matrix shorthand after a labelled linear-layer calculation. The head
  may generally be an MLP; this example uses one linear layer without bias. The original D.zoo values are unchanged.
- Annotation PDF revision 3: `review/cbm-lecture-review-2026-10-15-r3.pdf`, with revised s04 pages 65-77 and all revision 2
  changes retained. There are still 318 pages and 28 section bookmarks. Earlier PDFs remain for annotation references.
- PDF page 132 review: Part 9 is now one high-level warning in s09. The detailed s09 examples were removed and
  s20 is omitted from `narration/order.txt` while its source and data remain available. The deck now has 27 sections
  and 307 slides, and proceeds directly from s09 to Part 10. The numerical leakage example, probes and remedies
  are no longer part of the current lecture. Other scenes' content and the saved film timing are unchanged.
- Latest annotation PDF: `review/cbm-lecture-review-2026-10-15-r4.pdf`, rebuilt with all review changes, 307 pages
  and 27 section bookmarks. Page 132 is the single leakage warning. In older PDFs, pages 133-143 are now removed;
  subtract 11 from old pages 144-318 to find the corresponding current page. Pages 1-131 keep their numbers.
  Earlier PDFs remain available, so comments attached to those copies can still be resolved by their slide IDs.

## Pending
1. **Nipun's slide-by-slide review (now, in Codex).** He annotates slides in the deck or PDF and asks for changes. For each
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
