# Handoff: state of the CBM lecture (15 October 2026)

Read `AGENTS.md` first (how the repository works). This file says what is finished, what is pending, and how Nipun
wants the next round to go.

## What this is
An ES 667 Deep Learning lecture, "Concept Bottleneck Models". One source in this repository produces the live
slides (`npm run deck`), a vector PDF, the notes page and a narrated film. Each line of `narration/scenes/<id>.txt` is
one slide: `[[heading]] narration`. Each `src/scenes/S<id>.tsx` draws that section, slide k on beat k.
Section order: `narration/order.txt`. Readable full text: `docs/lecture.md` (generated).

## Current reviewed release

Revision 17 is live at https://nipunbatra.github.io/cbm/: 309 slides in 27 sections, matching notes and PDF.
The full source history is at https://github.com/nipunbatra/cbm (`main`); Pages deploys `gh-pages`.
The dated entries below preserve the review history. The film remains on its earlier narration.

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
- Annotation PDF revision 4: `review/cbm-lecture-review-2026-10-15-r4.pdf`, rebuilt with all review changes, 307 pages
  and 27 section bookmarks. Page 132 is the single leakage warning. In older PDFs, pages 133-143 are now removed;
  subtract 11 from old pages 144-318 to find the corresponding current page. Pages 1-131 keep their numbers.
  Earlier PDFs remain available, so comments attached to those copies can still be resolved by their slide IDs.

- PDF revision 2 page 150 review: s10.6-7 now use matching diagrams instead of the spotter/field-guide analogy.
  LaBo illustrates rung two: a pretrained CLIP scorer plus a task head learned from class-labelled images.
  Classification by description illustrates rung three: pretrained CLIP plus fixed averages within each class,
  with no fitting for the new task. The ladder and following concept-check takeaway now support that distinction.
- Annotation PDF revision 5: `review/cbm-lecture-review-2026-10-15-r5.pdf`, still 307 pages and 27 section bookmarks.
  Pages 135-140 are updated; all other page content streams are unchanged from revision 4. The matching diagrams
  are on pages 138-139, corresponding to old pages 149-150. Previous annotation PDFs remain available.

- PDF revision 4 page 146 review: s15 now defines the CEM vectors as image-specific network outputs, shows the
  learned layers that produce them, and explains the probability scorer. New training and training-versus-test
  diagrams distinguish labels and losses from ordinary prediction with fixed weights. RandInt remains a separate
  training step, and the optional expert correction is explicit. The section still has 16 slides; its numerical
  animal example remains illustrative. Mechanism checked against the original CEM paper, Sections 3.1-3.2.
- Annotation PDF revision 6: `review/cbm-lecture-review-2026-10-15-r6.pdf`, still 307 pages and 27 section bookmarks.
  Updated CEM pages: 146, 147, 149, 152, 153, 154, 155 and 159. All other page content streams match revision 5.
  Page 146 defines the vectors; page 154 shows training; page 159 compares training with testing.

- PDF revision 4 page 154 review: removed RandInt from s15, including its dedicated slide and recap/card references.
  The general training explanation and optional expert correction remain. The section now has 15 slides and the
  lecture 306. The paper's RandInt details remain only in source notes, outside the lecture. This supersedes the
  earlier decision to retain it separately.
- Annotation PDF revision 7: `review/cbm-lecture-review-2026-10-15-r7.pdf`, 306 pages and 27 section bookmarks.
  Revision 6 page 155 is removed; pages 1-154 keep their numbers and pages 156-307 move up one. The training
  recap is now page 158 and the CEM summary card page 159. Earlier PDFs remain available for annotation references.

- PDF revision 4 page 157 review: expanded the circle/square example into s15.11-15. The sequence revisits the
  identical-value bottleneck, distinguishes concept probability from image-specific embedding, explains the two
  training signals, calculates predictions with one fixed illustrative head, then states the interpretability
  trade-off. Values come from `math/data.py` -> `D.cem_shape`, with numerical validation. These are hand-chosen
  vectors and a head, not a trained shape CEM. Existing data is unchanged. CEM now has 17 slides; the lecture 308.
- Annotation PDF revision 8: `review/cbm-lecture-review-2026-10-15-r8.pdf`, 308 pages and 27 section bookmarks.
  Pages 155-159 contain the expanded example. Revision 7 pages 158-306 become pages 160-308; pages 1-154 retain
  their numbers. All previous PDFs remain available for annotation references.

- PDF revision 4 page 164 onwards review: expanded s16 to 26 slides. After the frozen encoder, show concept
  examples, a constructed two-feature plot, the separating boundary and CAV, then scores for new images.
  Make the CLIP text route explicitly an alternative, return to the eight real phrase scores, explain scaling,
  and distinguish fitting the task head from the complete fixed test-time path. New `D.pcbm_toy` values come
  from `math/data.py`; earlier model results are unchanged. Content, 23 Python tests, three deck tests and
  visual checks passed. Saved film timing and the beat list remain unchanged.
- Annotation PDF revision 9: `review/cbm-lecture-review-2026-10-15-r9.pdf`, 312 pages and 27 section bookmarks.
  The slower explanation is on pages 166-179. The annotated old revision 4 page 164 is now page 165.
  Revision 8 pages 184-308 become pages 188-312. All 302 slides outside the revised drawings retain their body
  text. Earlier PDFs are preserved. No audio, saved timeline rebuild, film render or publication was performed.

- PDF revision 4 page 170 review: s16.12-15 now compare the same three prompts across zebra, horse and giraffe
  test photos. Show raw scores, separate training statistics for each prompt, the worked formula, then matching
  raw-to-standardised values. Explain that below average does not prove absence. `worked/standardisation.py`
  reproduces raw CLIP scores offline without training; `math/data.py` calculates `D.pcbm_scaling`. Original
  model results are unchanged. Tests verify statistics, split separation, photo hashes and preserved ordering.
  Content, 24 Python tests, three deck tests and visual checks passed. Saved film timings remain unchanged.
- Annotation PDF revision 10: `review/cbm-lecture-review-2026-10-15-r10.pdf`, 314 pages and 27 section bookmarks.
  Standardisation is on pages 173-176; the annotated revision 4 page 170 is now page 175. Revision 9 pages
  175-312 become pages 177-314. All 311 retained slides have unchanged body text. Earlier PDFs are preserved.
  No audio generation, saved timeline rebuild, film render or publication was performed.

- PDF revision 5 page 177 review: reduced the PCBM-h residual explanation from four slides to two, now s16.23-24.
  The same diagram shows the extra head adding class scores before softmax, then a concept edit leaving that
  extra path unchanged. Retain one worked score addition and the saved 0.14 versus 0.20 zebra probabilities.
  Narration distinguishes fitting the extra head from test-time use. The section now has 26 slides and the lecture
  312. Content, 24 Python tests, three deck tests and live visual checks passed. Saved film timing is unchanged.
- Annotation PDF revision 11: `review/cbm-lecture-review-2026-10-15-r11.pdf`, 312 pages and 27 section bookmarks.
  The two residual slides are on pages 184-185; revision 10 pages 188-314 move to 186-312. All 310 retained
  slides have unchanged body text. Visually checked both new slides, adjacent pages and the final page.
  Earlier PDFs are preserved. No audio, saved timeline rebuild, film render or publication was performed.

- PDF revision 5 page 223 review: s24.4 now explains the random-layer control with an explicit input-to-output
  diagram. The encoder and random layer are fixed; only the class head is fitted using class labels. The
  takeaway is that high class accuracy does not establish concept meaning. Check that a yellow-bill score
  corresponds to a visible yellow bill. The claim follows the untrained CBL in VLG-CBM Section 4.1 and Figure 3.
  Content, 24 Python tests, three deck tests and live visual checks passed. Saved film timing is unchanged.
- Annotation PDF revision 12: `review/cbm-lecture-review-2026-10-15-r12.pdf`, still 312 pages and 27 section bookmarks.
  Page 228 is revised; all other 311 page content streams and extracted text are unchanged. All page numbers
  and bookmark destinations are retained. Previous annotation PDFs remain available. No audio, film or
  publication work was performed.

- PDF revision 5 page 224 review: VLG-CBM is expanded to Vision-Language-Guided Concept Bottleneck Model
  on s24.5 and in the narration. The initial overview and CLIP, CEM, PCBM, PCBM-h, LF-CBM and CBD introductions
  now make their abbreviation mappings explicit. AGENTS.md records the rule to show and say each full name
  when introducing it. No slides were added. Content, 24 Python tests, three deck tests and live visual checks passed.
- Annotation PDF revision 13: `review/cbm-lecture-review-2026-10-15-r13.pdf`, 312 pages and 27 section bookmarks.
  Model names are expanded on ten pages; VLG-CBM is on page 229 (revision 5 page 224). All page numbers and
  bookmark destinations are unchanged, and the other 302 page content streams and extracted text match revision 12.
  Earlier PDFs are preserved. Saved film timing, audio and publication are untouched.

- PDF revision 6 page 190 review: s17.7-9 now follow the same zebra row from CLIP's score table into the student
  explanation. Step 4 retains the five raw scores in the same order and positions. The following slide tracks
  the stripes entry through standardisation before showing the student's value. The narration distinguishes
  matching patterns from copying raw values and identifies the zebra as a held-out example. No data or slide
  counts changed. Content, 24 Python tests, three deck tests and live visual checks passed.
- Annotation PDF revision 14: `review/cbm-lecture-review-2026-10-15-r14.pdf`, 312 pages and 27 section bookmarks.
  The continuous row example is on pages 194-196 (revision 6 pages 189-191). All numbering and bookmarks are
  preserved; the other 309 page content streams and extracted text match revision 13. Earlier PDFs and saved
  film timing remain unchanged. No audio generation, film render or publication was performed.

- PDF revision 7 page 242 review: removed the CUB accuracy-comparison slide from s25 and its narration.
  The worked gull example now leads directly into the use case with no labelled images. The section has
  13 slides and the lecture 311. All other examples and source data are unchanged. Content, 24 Python tests,
  three deck tests and live transition/narration checks passed. Saved film timing remains unchanged.
- Annotation PDF revision 15: `review/cbm-lecture-review-2026-10-15-r15.pdf`, 311 pages and 27 section bookmarks.
  Revision 14 page 248 is removed; pages 249-312 become 248-311. The removed page corresponds to revision 7
  page 242. All 311 retained slides have unchanged body text. Page numbers and bookmark destinations were
  checked, and the transition and final page were inspected visually. Earlier PDFs and saved film timing remain
  available. No audio generation, film render or publication was performed.

- PDF revision 7 page 245 review: s25.11 now follows a mismatched phrase through CLIP into the class average,
  beside the actual gull photo. The saved score 0.325 is identified as similarity, not a probability. The
  takeaway asks students to check both the description's correctness/visibility and the score's dependence
  on the named feature. No data or slide counts changed. Content, 24 Python tests, three deck tests and live
  visual/narration/build checks passed. Saved film timing remains unchanged.
- Latest annotation PDF: `review/cbm-lecture-review-2026-10-15-r16.pdf`, 311 pages and 27 section bookmarks.
  Page 250 is revised (s25.11, revision 7 page 245). All footers and bookmark destinations are verified; the
  other 310 page content streams and extracted text match revision 15. The revised PDF page was inspected
  visually. Earlier PDFs remain available. No audio generation, film render or publication was performed.

- 15 Oct publication, explicitly requested after review r16: published all current slides, matching notes and
  the exact 311-page r16 PDF through attention PR 7 (merge `e6118e8`). Updated the current CBM course row,
  lecture 20, through DL 2026 PR 9 (merge `872dd22`); both visible and accessible PDF labels show 311 pages.
  Both deployments succeeded. Served HTML, JS, CSS, notes and PDF match local release bytes. Checked the
  live course row and s25.11 visually. The deck now versions script/style URLs by content. See
  `publishing/README.md` for links and verification evidence. Audio, saved timelines and film are unchanged.

- 15 Oct, browser saliency review: s21.3-4 now use an actual zebra photo, fixed pretrained ResNet-50,
  a measured pixel nudge and computed raw score gradients. Compare the predicted zebra class with the
  low-probability tiger class on the same input and common brightness scale. Distinguish probabilities
  from sensitivity and explain background responses. Reproduction: `worked/saliency.py`; provenance and
  interpretation: `docs/saliency_example.md`. Existing numerical results are unchanged.
- 15 Oct, browser s23.7 review: removed s23.7 and s23.8 and their narration. The CUB section has six slides,
  ending at its intervention curves and leading directly to s06.1, Human interventions.
- Latest annotation PDF is revision 17, 309 pages and 27 bookmarks. Pages 14-15 are revised; revision 16
  pages 97-98 are removed. All other 307 retained slide bodies are unchanged, and all footers and bookmarks
  are checked. Earlier PDFs remain available. Content, 25 Python tests, three deck tests and visual checks passed.
- The standalone CBM migration and revision 17 publication are complete. Source is pushed to `nipunbatra/cbm`;
  `gh-pages` release `381c30f` is deployed. Old attention deck/notes links redirect while preserving anchors
  (attention PR 8). Course links now use `/cbm/` and show the 309-page PDF (DL 2026 PRs 10-11).
  Verified live release bytes, course row and browser views. See `publishing/README.md` for evidence.
  Audio, saved timelines and film remain unchanged.

## Pending
1. **Nipun's slide-by-slide review (now, in Codex).** He annotates slides in the deck or PDF and asks for changes. For each
   change: edit the narration line and/or the scene, run `npm run content` and `npm run check`, look at the slide in
   `npm run deck`, and add an entry to `review/CHANGES_PENDING_VIDEO.md`. Keep the style rules in `AGENTS.md`.
2. **Remake the film after the review** (not now): regenerate the voice for changed lines, real timeline, music,
   captions, render, upload unlisted. Claude Code runs this pipeline (`tools/build.sh`, see CLAUDE.md); Codex should
   not run TTS, the timeline or renders.
3. **Publish subsequent review changes when requested**: the slides, notes and PDF through r18 are already live.
   Later edits will need another deck/notes/PDF release on `nipunbatra/cbm` (`gh-pages`) and,
   if the page count changes, the course page through a pull request. The film remains a separate pending rebuild.
4. Open checks, low priority:
   - s24 recap says label-free models are judged "at their own sparsity level"; confirm the wording against the
     LF-CBM paper.
   - Values still illustrative or schematic by design (tagged on the slides): the workflow and sanity-check maps
     on s21.6-7, the VLG-CBM detector boxes, the TCAV example tiles, the example values in "Beyond images".

## How Nipun likes to work
- One idea per slide, generous space, colour-coded words that match their symbols, words before symbols, a small
  worked example for every new operation, plain British English without em or en dashes.
- Numbers support the story; they are not the story. Never invent a number: compute it in `math/data.py` or tag it.
- For each newer architecture, define unfamiliar terms, show how its representations are obtained, explain the
  training inputs and what is learned, and distinguish test-time computation from training.
- Ask before publishing anything. Review images rather than PDFs when sending to him remotely.

## 16 October 2026 review update

- Added an Attention-style auto-hiding controls tray. C toggles it; M or O opens a searchable slide map grouped
  by section. Buttons cover previous/next build, notes, animation and full screen. Three-second idle hiding
  respects pointer hover and keyboard focus. The deck canvas is unchanged by the tray; notes reserve their
  own space. Desktop/phone and keyboard checks are recorded in `review/controls-qa-2026-10-16.md`.
- Clarified s21.8: training examples, report-derived pneumonia labels, dataset label rates, test input/output
  and the hospital shortcut takeaway. The two rates now live in math/data.py and src/data.json.
- Matching PDF: `review/cbm-lecture-review-2026-10-16-r18.pdf`, still 309 pages and 27 bookmarks. Only page 19
  changed; all other page contents and all destinations were verified. The course's page count stays correct.
- No audio generation, saved timeline rebuild or film rendering was performed. The s21.8 narration change
  remains pending for the later film rebuild; the controls are browser-only.

- Published `cbfa536` on `gh-pages`; deployment succeeded. Live HTML, JS, CSS, notes and PDF match the
  release bytes, and the existing deep learning course links are valid. Browser verification includes the
  new controls, map and revised slide. See `publishing/README.md` for the evidence and source commits.

## 16 October 2026: shorter lecture (revision 19, prepared)

- Removed Part 9 from the active order; old s09 and s20 links lead to s10.1. Keep visible part numbers
  and remaining section IDs stable for existing annotations.
- Removed the five-slide CEM shape example (former s15.11-15). The recap and summary are now s15.11-12.
  CEM has 12 slides. The lecture has 303 slides across 26 sections.
- Saved review/cbm-lecture-review-2026-10-16-r19.pdf; all retained bodies, footers and bookmarks verified.
  Content and code checks passed, and the affected transitions were inspected in the browser.
- Audio, saved timelines and the beat list remain unchanged. Publication is pending the next review update.

## 16 October 2026: section separators (revision 20, prepared)

- Added 17 separator scenes, s30-s46, before the main parts, recap, appendix and the three supervision
  rungs within Part 10. Existing content slide IDs are unchanged. Drawings share src/scenes/SectionBreak.tsx;
  their narration lives in the corresponding narration/scenes/s30.txt through s46.txt files.
- Rung two comes immediately before PCBM. It distinguishes class-labelled task images from the source
  of the concept bank, following the PCBM paper (https://arxiv.org/abs/2205.15480). Separate concept
  examples may have labels; the task images do not need dense concept labels.
- The review deck now gives new scenes preview timing without requiring saved audio. The regression
  checks cover this path and confirm that saved film timing is not mutated.
- Matching PDF: review/cbm-lecture-review-2026-10-16-r20.pdf, 320 pages and 43 bookmarks. This is
  303 retained content slides plus 17 separators. All retained bodies, footers and bookmarks are verified.
- Content, type checking, 25 Python tests and four deck tests pass. All new separators were inspected.
  Source, deck, notes and course publication are being completed together. Audio and film remain unchanged.
