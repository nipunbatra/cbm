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
