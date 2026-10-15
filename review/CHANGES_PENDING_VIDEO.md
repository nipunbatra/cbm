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
