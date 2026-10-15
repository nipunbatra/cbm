# Changes since the last video (https://youtu.be/5fFwnevgY8Y, 11 October, 66:42)

The video is remade from the same source once the slide review is finished. Each entry: what changed in the
slides and narration. Narration files: `narration/scenes/<id>.txt`; scenes: `src/scenes/S<id>.tsx`.

## 15 October

1. **Saliency, worked example (Part 1, s21).** The single abstract saliency slide is now six slides: a 3 × 3 image of
   a vertical bar and a linear model with three classes (vertical bar, horizontal bar, dot); scores as weighted sums
   (3, 1.5, 0); nudging one pixel moves every class score; the gradient as change per unit nudge (1, 2, −0.5);
   one saliency map per class; backpropagation in a deep network. Constructed numbers in `D.saliency_toy`
   (`math/data.py`).
2. **TCAV moved to an appendix.** The six TCAV slides left Part 1 and form a new scene `s26` ("Appendix: testing with
   concept activation vectors"), placed just before the end card; its first line now introduces it as an appendix.
3. **Post-hoc CBM (s16).** The concept-activation-vector line no longer points back to TCAV in Part 1; the slide says
   "the same construction TCAV uses (appendix)".

Audio note: the voice for these lines was already generated and checked (asrcheck + full-track ASR clean), and
`src/timeline.json` is the real timeline as of this entry.
4. **Deck: click-driven builds (slides only, the film is unaffected).** Each narration beat is split at its sentence
   ends into build stops; → plays a short (< 0.7 s) transition to the next stop and waits. Notes highlight the current
   sentence. `src/deck/Deck.tsx`.
5. **Codex setup.** `cbm/` is now its own git repository (AGENTS.md, .gitignore, `tools/setup_worktree.sh`,
   `npm run deck` on port 8766).
6. **Tools: Chrome path.** `tools/chrome.mjs` picks an installed headless Chrome (puppeteer or Playwright cache, or
   `CBM_CHROME`); render, stills and slide_stills use it (the old hard-coded puppeteer copy had been deleted).
7. **Repository moved to `~/git/cbm`** (the old grounding lab that lived there is now `~/git/cbm-grounding`;
   `~/git/dl-summaries/cbm` is a symlink). Added `publishing/` (YouTube descriptions, thumbnail, where everything is
   published) and `docs/CODEX_HANDOFF.md`.
8. **Saliency simplified after slide review (s21.3 to s21.8 become s21.3 and s21.4).** Two slides now show a tiny
   centre-pixel nudge and its effect on the vertical-bar score, then the saliency map for that same class. Removed
   weight tables, the three-class comparison, derivative arithmetic and the deep-network detour. The existing
   constructed values in `D.saliency_toy` are unchanged. Clarified that a score can change without changing the
   predicted class. Remaining s21 slides move up by four; the section has 16 slides, the deck 318.
   Content and numerical checks passed, with both replacement slides inspected in the deck.
9. **Review content no longer rewrites film timing.** `npm run content` updates the script and readable lecture only.
   The deck previews revised narration in memory, retaining recorded word alignment for unchanged narration. Both
   saved timelines and `docs/beats.txt` remain the previous film version. Three deck-content checks cover slide order,
   timing bounds, unchanged alignment and deletion of earlier slides. Audio, film rebuild and publishing remain pending.
10. **Model sanity check simplified (old s21.10 and s21.11, now s21.6 and s21.7).** Replaced network diagrams,
    explanation-method symbols and the multiple-method comparison panel with one before-and-after heatmap comparison.
    Narration keeps the photo and class fixed, explains replacing learned weights with random values, and asks whether
    the heatmap should stay the same. The result slide has one takeaway: a convincing heatmap alone is insufficient.
    The notes retain the distinction between methods that barely changed and methods that passed the test. Maps are
    explicitly schematic. Content checks, all 21 checks and browser inspection passed; notes and arrow navigation work.
11. **Annotation PDF (slides only).** Exported `review/cbm-lecture-review-2026-10-15.pdf`: 318 pages, selectable text,
    28 section bookmarks and a slide ID/page number on each page. The exporter now enumerates the current script,
    rather than the old film timeline, and checks for missing slides, unloaded images and browser errors. The footer
    appears only in the PDF view. All page IDs and the revised pages were verified. Saliency is on pages 14-15 and
    the model check on pages 17-18. No audio, saved timing, film or published output was changed.
12. **Saliency formula and more examples (PDF comment on page 15; s21.3-4, pages 14-15).** Kept the two-slide
    sequence and added the absolute-gradient formula after its meaning in words, with the centre-pixel calculation
    |0.1 / 0.1| = 1. The next slide now shows vertical-bar, horizontal-bar and dot inputs with saliency for each
    matching class score. Values come from `D.saliency_toy`; all maps share a brightness scale. Added three independent
    finite-difference checks covering every pixel in each example. Content, type checks, 21 Python checks and three
    deck checks passed. Both slides were inspected in the browser. Film timing and audio were not changed.
13. **Heatmap workflow and takeaway (PDF comment on page 17; s21.6-7, pages 17-18).** The first slide now shows
    the input gull photo, trained model, chosen herring-gull score, explanation method and heatmap in one row.
    Narration explains that plain gradient saliency uses the pixel sensitivities just introduced. The following
    slide holds the photo, class and method fixed, then compares trained with random weights. Guided
    backpropagation is named as the reported failure example; the notes distinguish it from plain gradients.
    The takeaway is explicit: before trusting a heatmap, check that it depends on the learned weights. Maps are
    labelled schematic, not computed for this photo. Content, type checks, 21 Python checks, three deck checks
    and the deck build passed. Both slides were inspected in the browser. Audio and film timing remain unchanged.
14. **Revised annotation PDF.** Saved `review/cbm-lecture-review-2026-10-15-r2.pdf`, preserving the original annotated
    version. Updated pages 14, 15, 17 and 18 only; the other 314 page content streams are unchanged. Verified all
    318 slide ID/page footers, 28 section bookmarks and the four revised pages visually. Notes and arrow builds
    work in the deck. The saved timelines and beat list retain their original hashes. No film or publication work.
15. **Concept values versus layer weights (PDF comment on page 67; s04.1-13, pages 65-77).** Reworked the section
    around an explicit image -> concept predictor -> predicted concepts -> task head -> scores -> softmax ->
    probabilities diagram. Defined the hat as predicted, and stated that the illustrated concept outputs are
    assumed rather than measured from the photo. The task head can be a linear layer or an MLP; this worked
    example uses one linear layer without bias. Separated the per-image concept values from the layer's fixed
    weight table, labelled every value, and introduced W times c hat only after a single zebra-score calculation.
    Replaced the dense matrix products and column-delta display with layer diagrams and one score-change example.
    The concept edit passes through the same head and softmax. All original D.zoo values are unchanged. Content,
    type checking, 21 Python tests and three deck tests passed; all 13 slides were inspected, including notes and
    arrow-driven builds. Saved film timelines and the beat list retain their original hashes.
16. **Annotation PDF revision 3.** Saved `review/cbm-lecture-review-2026-10-15-r3.pdf`, retaining the original and
    revision 2. Replaced pages 65-77 in revision 2; the other 305 page content streams are unchanged, including the
    earlier saliency edits. Verified all 318 page footers, 28 section bookmarks and all 13 revised pages visually.
    No audio generation, film rebuild or publishing was performed.
17. **Concept Leakage reduced to one slide (PDF comment on page 132; Part 9).** Replaced the seven-slide s09
    explanation and five-slide s20 follow-up with one high-level schematic in s09. It explains that a concept score
    can carry extra information used by the task head, and asks the audience to test whether concept corrections
    have the intended effect. Removed the distributions, numerical threshold example, implicit/explicit taxonomy,
    trained-model probes and remedies from the lecture. s20 remains in the repository but is omitted from
    `narration/order.txt`; its data and the saved film are retained. Later references to leakage remain consistent
    with the brief warning. Updated the narration test to stop requiring the deleted example's numbers; numerical
    provenance checks remain intact. Content, type checking, 21 Python tests and three deck tests passed. Visually
    inspected the slide and notes, and verified that the next build goes directly to Part 10. Saved timeline and
    beat-list hashes are unchanged. The current deck has 27 sections and 307 slides.
18. **Annotation PDF revision 4.** Rebuilt `review/cbm-lecture-review-2026-10-15-r4.pdf` from the current source,
    including the earlier saliency and task-head revisions. It has 307 pages and 27 section bookmarks. The leakage
    warning is on page 132; old pages 133-143 are removed, and old pages 144-318 become pages 133-307. Verified every
    page footer and unchanged body text for all 306 retained slides, and visually checked the warning, its adjacent
    pages and the final page. Previous annotation PDFs are preserved. No audio, film or publishing work was done.
