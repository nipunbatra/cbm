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
19. **Clarify rungs two and three (PDF revision 2 page 150; s10.3-8).** Replaced the spotter/field-guide analogy
    with matching diagrams on s10.6-7. Both retain the same image, descriptions and pretrained CLIP scorer. The
    LaBo example learns a task head from class-labelled images; classification by description uses fixed averages
    within each class. Explicitly distinguished no training for the new task from no pretraining. The ladder
    retains class labels on rung two, and the next slide asks for concept checks when per-image labels are absent.
    Diagrams are schematic, with no invented numerical scores. Updated narration and generated notes. Content,
    type checking, 21 Python tests and three deck tests passed. Inspected the deck, notes and arrow builds, with
    no browser errors. Saved film timelines and the beat list retain their original hashes.
20. **Annotation PDF revision 5.** Saved `review/cbm-lecture-review-2026-10-15-r5.pdf`, with all earlier revisions
    retained. Updated pages 135-140 only; the other 301 page content streams are unchanged. Verified 307 page
    footers and 27 section bookmarks, and visually checked all six changed PDF pages. The matching diagrams are
    on pages 138-139; the annotated old page 150 corresponds to page 139. Earlier PDFs are preserved. No audio,
    film rebuild or publishing was performed.
21. **CEM embeddings, training and testing (PDF revision 4 page 146; s15).** Replaced the ambiguous prototype/dimmer
    introduction with a definition of image-specific vectors and an image -> encoder -> two learned layers diagram.
    Both vectors are computed for each image; they are not stored photos or class averages. Explained the learned
    probability scorer and added a joint-training diagram with concept and task labels feeding their separate
    losses. Moved RandInt to the next slide, clarified ordinary test-time mixing and optional expert correction,
    and replaced the redundant recap with a training-versus-test comparison. Kept the existing 16-slide section.
    Checked the mechanism against the original CEM paper, Sections 3.1-3.2, and recorded the source clarification
    in docs/lineage_facts.md. All animal vectors and head values remain explicitly illustrative. The head-input
    view now uses three decimals consistently, avoiding the previous 0.71 versus 0.70 display of the same 0.705.
    Verified mixing, correction and fixed-head softmax against D.worked.cem. Content, type checking, 21 Python tests
    and three deck tests passed. Visually checked revised slides, narration and arrow builds; no browser errors.
    Saved film timelines and the beat list retain their original hashes.
22. **Annotation PDF revision 6.** Saved `review/cbm-lecture-review-2026-10-15-r6.pdf`, retaining the earlier reviews.
    Replaced pages 146, 147, 149, 152, 153, 154, 155 and 159; the other 299 page content streams are unchanged from
    revision 5. Verified all 307 footers and 27 section bookmarks, and visually checked all eight changed PDF pages.
    Page 146 defines the vectors, page 154 explains training and page 159 compares training with testing. Previous
    annotation PDFs remain available. No audio, saved timeline, film or publication work was performed.
23. **Remove RandInt from the CEM explanation (PDF revision 4 page 154).** Removed the dedicated random-training-
    intervention slide (s15.11 in revision 6), its dice animation, and the recap/card references. Kept the general
    joint-training diagram and optional expert correction. CEM now has 15 slides; later beats move up one and the
    lecture has 306 slides. Source notes retain the paper detail outside the lecture. Content, type checking,
    21 Python tests and three deck tests passed. Inspected the training-to-capacity transition, notes, revised
    recap and final card in the deck, with no browser errors. Saved film timelines and the beat list are unchanged.
24. **Annotation PDF revision 7.** Saved `review/cbm-lecture-review-2026-10-15-r7.pdf`, preserving earlier copies.
    It has 306 pages and 27 section bookmarks. Removed revision 6 page 155; pages 1-154 retain their numbers and
    old pages 156-307 move up one. Verified every footer, no RandInt references, and unchanged body text for all
    304 retained slides except the revised recap and card (now pages 158-159). Visually checked pages 153-160 and
    the final page. No audio generation, saved timeline rebuild, film render or publication was performed.
25. **Explain how embeddings resolve the missing-shape example (PDF revision 4 page 157).** Expanded s15.11-13
    into five slides, now s15.11-15: identical concept values lose shape; equal blue probabilities can coexist with
    different image-specific vectors; concept and class labels provide different training signals; one fixed
    illustrative head gives A for the circle and B for the square; the extra information still has no named
    shape concept. Made class targets, vector entries, head rule and scores explicit. Added D.cem_shape in
    math/data.py, with hand-chosen candidates/head and computed mixtures/scores; all previous data is unchanged.
    A new numerical test checks mixing, the displayed rule, predictions and the return of identical outputs if
    the embeddings collapse. Mechanism checked against CEM Section 3.1. Content, type checking, 22 Python tests
    and three deck tests passed. Inspected all five slides, notes, arrow navigation and the renumbered final card;
    no browser errors. CEM now has 17 slides and the lecture 308. Film timing, audio and publication remain pending.
26. **Annotation PDF revision 8.** Saved `review/cbm-lecture-review-2026-10-15-r8.pdf`, preserving earlier copies.
    It has 308 pages and 27 section bookmarks. The expanded example is on pages 155-159; revision 7 pages 158-306
    move to 160-308. Verified every footer and unchanged body text for all 303 slides outside the expanded example.
    Visually checked pages 154-162 and the final page. Saved timeline and beat-list hashes remain unchanged.
    No audio generation, film render or publication was performed.
27. **Slow down CAVs and the post-hoc prediction path (PDF revision 4 page 164 onwards).** Expanded s16 from 22
    to 26 slides. Separate concept-labelled examples, two unnamed encoder features, a separating line, its CAV,
    and two new-image scores before introducing the alternative CLIP text route. Return explicitly to the real
    512-feature animal example and its eight phrase scores, explain training-only scaling, then show what the
    class-labelled task data trains and the complete fixed test-time path. Corrected the opening claim so it
    does not imply that the CAV route needs no concept labels. Added D.pcbm_toy with constructed features and
    calculated separator/scores; moved the existing two-entry dot product into this data source. All previous
    data is unchanged. Numerical validation checks the boundary, normal, scores and dot product. The narration
    provenance check now accepts three-decimal rounding from source data, needed for the real raw cosine score.
    Content, type checking, 23 Python tests and three deck tests passed. Inspected new slides, notes, builds,
    the retained calculations and final card in the deck, with no browser errors. Source facts were checked
    against PCBM Section 2. Saved film timelines and beat-list hashes are unchanged.
28. **Annotation PDF revision 9.** Saved `review/cbm-lecture-review-2026-10-15-r9.pdf`, with 312 pages and 27
    section bookmarks. The expanded PCBM explanation is on pages 166-179. Revision 4 page 164 corresponds to
    page 165; revision 8 pages 184-308 move to 188-312. Verified every footer and unchanged body text for all
    302 slides outside the revised drawings. Visually checked 19 PDF pages, including the new sequence,
    section transition and final page. All earlier annotation PDFs are preserved. No audio generation,
    saved timeline rebuild, film render or publishing was performed.
29. **Standardisation across images and prompts (PDF revision 4 page 170).** Expanded s16.12-13 into four slides,
    now s16.12-15: the same three prompts on zebra, horse and giraffe test photos; a mean and spread per prompt
    from all 24 training photos; the existing worked formula; a matching table showing every raw score becoming
    a standardised score. Explain zero, positive and negative values, and that below average does not prove
    absence. Keep the test photos out of the scaling statistics and show their complete images. The section
    now has 28 slides and the lecture 314. Added worked/standardisation.py for offline frozen CLIP inference,
    its raw output with photo/checkpoint hashes, and D.pcbm_scaling arithmetic in math/data.py. Reproduced the
    existing zebra values and training statistics; all previous data is unchanged. No head was retrained.
    Content, type checking, 24 Python tests and three deck tests passed, including independent column statistics,
    split separation, photo provenance and preserved image ordering. Inspected the new slides, notes and builds
    in the deck. Saved film timelines and the beat list are unchanged.
30. **Annotation PDF revision 10.** Saved `review/cbm-lecture-review-2026-10-15-r10.pdf`, with 314 pages and 27
    section bookmarks. The expanded standardisation example is on pages 173-176; the annotated revision 4
    page 170 is now page 175. Revision 9 pages 175-312 become pages 177-314. Verified every footer, all 311
    retained slides' body text, and the new numerical tables. Visually checked nine PDF pages including the
    example, adjacent slides, section transition and final page. Earlier PDFs remain available. No audio,
    saved timeline rebuild, film render or publication was performed.
31. **Reduce PCBM-h to two slides (PDF revision 5 page 177).** Replaced four residual slides with s16.23-24.
    Keep one two-path diagram: image features feed the concept model and an extra linear residual head; add
    class scores before softmax. One saved zebra score addition illustrates the operation. Explain that the
    concept model stays fixed while the extra head is fitted with class labels, and both paths run at test time.
    The second slide marks the stripes edit and the unchanged residual path, comparing the saved zebra
    probabilities 0.14 and 0.20 after the same edit. State that prediction can change while some evidence bypasses
    named concepts. The section now has 26 slides and the lecture 312. Content, type checking, 24 Python tests
    and three deck tests passed. Inspected both slides, narration, progressive builds and the renumbered final
    card in the deck; no browser warnings or errors. Saved film timelines and beat-list hashes are unchanged.
32. **Annotation PDF revision 11.** Saved `review/cbm-lecture-review-2026-10-15-r11.pdf`, preserving all previous
    reviews. It has 312 pages and 27 section bookmarks. The two residual slides are on pages 184-185; revision 10
    pages 188-314 move to 186-312. Verified every footer and unchanged body text on all 310 retained slides.
    Visually checked the new slides, adjacent pages, section transition and final page. No audio generation,
    saved timeline rebuild, film render or publication was performed.
33. **Clarify the random-concept comparison (PDF revision 5 page 223).** Reworked s24.4 as one explicit
    random-layer control: input photo, fixed pretrained image encoder, fixed random concept layer, a class head
    fitted using class labels, and the predicted species. Removed the unexplained illustrative accuracy bars.
    Explain that outputs still depend on the image and that high accuracy with many outputs does not establish
    concept meaning. End by asking whether a high yellow-bill score corresponds to a visible yellow bill,
    leading into the detector slide. Scoped the claim to the random, untrained CBL in Section 4.1 and Figure 3
    of Srivastava et al.; updated docs/lineage_facts.md. Content, type checking, 24 Python tests and three deck
    tests passed. Inspected the diagram, narration, builds and transition in the deck; no browser errors.
34. **Annotation PDF revision 12.** Saved `review/cbm-lecture-review-2026-10-15-r12.pdf`, keeping 312 pages and
    27 section bookmarks. The revised slide is page 228 (s24.4), corresponding to revision 5 page 223. Every
    footer and bookmark destination was checked; the other 311 pages retain identical content streams and
    extracted text. Visually checked the revised page and its neighbours. Prior PDFs remain available.
    No audio generation, saved timeline rebuild, film render or publication was performed.
35. **Expand model names at introduction (PDF revision 5 page 224).** Added Vision-Language-Guided Concept
    Bottleneck Model beside VLG-CBM on s24.5 and in its narration. Expanded LaBo and VLG-CBM on the initial
    supervision ladder, and made the CLIP, CEM, PCBM, PCBM-h, LF-CBM and CBD name mappings explicit at their
    introductions. CBD is identified as this lecture's comparison-table shorthand. No slides were added.
    Recorded the full-name convention in AGENTS.md. Content, type checking, 24 Python tests and three deck
    tests passed. Inspected all ten affected slides and VLG-CBM's notes in the live deck; no browser errors.
36. **Annotation PDF revision 13.** Saved `review/cbm-lecture-review-2026-10-15-r13.pdf`, with 312 pages and
    27 section bookmarks. Name expansions appear on pages 3, 136-138, 145, 162, 184, 188, 229 and 240.
    Page 229 corresponds to the annotated revision 5 page 224. Verified all footers, bookmark destinations,
    expanded names and unchanged content streams/text for the other 302 pages. Visually inspected all ten
    revised PDF pages. Earlier PDFs remain available. Saved timelines and the beat list are unchanged;
    no audio generation, film render or publication was performed.
37. **Carry one row from LF-CBM step 3 to step 4 (PDF revision 6 page 190).** Highlight the worked zebra
    row on s17.7 and keep its exact photo, concept order, five raw CLIP scores, positions and colour scale on
    s17.8. Draw the student's separate image-to-activation path below it. Delay the unexplained standardised
    student values; s17.9 now explicitly follows the first row entry, 0.274 for stripes, through the existing
    scaling calculation before comparing teacher 1.41 with student 1.36. Clarify that matching is across images,
    not exact raw-value copying, and that the worked zebra is held out from fitting. Existing data is unchanged.
    Content, type checking, 24 Python tests and three deck tests passed. Checked row identity, split provenance,
    scaling arithmetic, all three slides, narration and progressive builds; no browser warnings or errors.
38. **Annotation PDF revision 14.** Saved `review/cbm-lecture-review-2026-10-15-r14.pdf`, with 312 pages and
    27 section bookmarks. Revised pages 194-196 correspond to revision 6 pages 189-191. Verified all footers
    and bookmark destinations, identical five-score rows on pages 194-195, and unchanged content streams/text
    for the other 309 pages. Visually checked all three revised PDF pages. Earlier PDFs, saved timelines and
    the beat list are preserved. No audio generation, film render or publication was performed.
39. **Remove the CUB accuracy comparison (PDF revision 7 page 242).** Removed former s25.9, including
    its class-name/descriptor accuracy bars, paper comparison and narration. The worked gull example now
    leads directly into when classification by description is useful. Renumbered the remaining five s25
    slides and their animation cues; source data and the other examples are unchanged. The lecture has
    311 slides. Content, type checking, 24 Python tests and three deck tests passed. Checked the transition,
    narration and final section card in the deck; no browser warnings or errors. Saved film timing is unchanged.
40. **Annotation PDF revision 15.** Saved `review/cbm-lecture-review-2026-10-15-r15.pdf`, with 311 pages and
    27 section bookmarks. Revision 14 page 248 (revision 7 page 242) is removed; old revision 14 pages 249-312
    become pages 248-311. Verified every footer and bookmark destination and unchanged body text for all 311
    retained slides. Visually checked the transition, neighbouring slides, section boundary and final page.
    Earlier PDFs are preserved. No audio generation, saved timeline rebuild, film render or publication occurred.
41. **Make the description risks concrete (PDF revision 7 page 245).** Replaced the four abstract rows on
    s25.11 with our herring gull photo, the mismatched California Gull phrase, its saved CLIP score 0.325 and
    the path into the class average. Explain that similarity is not a probability that the words are true.
    End with two checks: are the words correct and visible, and does changing the named feature change its
    score? Other unobservable or background descriptions remain in the narration. No data or slide counts
    changed. Content, type checking, 24 Python tests and three deck tests passed. Inspected the slide,
    narration and progressive builds in the deck; no browser warnings or errors. Saved film timing is unchanged.
42. **Annotation PDF revision 16.** Saved `review/cbm-lecture-review-2026-10-15-r16.pdf`, with 311 pages and
    27 section bookmarks. Page 250 (s25.11, revision 7 page 245) is revised. Verified every footer and bookmark
    destination, visually inspected the revised PDF page, and confirmed identical content streams and text
    for the other 310 pages. Earlier PDFs remain available. No audio generation, saved timeline rebuild,
    film render or publication was performed.
43. **Publish the reviewed slides and notes, 15 October 2026.** Nipun authorised publication through r16.
    Merged attention PR 7 (`e6118e8`) and DL 2026 PR 9 (`872dd22`); both deployments succeeded. The live
    deck, notes and exact r16 PDF are current, and the course's lecture 20 row shows 311 pages. Added content
    hashes to script/style URLs. Verified live release bytes and browser views. All slide and narration edits
    above still await the film rebuild; no audio, saved timeline or video was regenerated or published.
44. **Use a real photo for class-specific saliency (browser s21.4).** Replaced the three shape/class pairs
    with one zebra photo and computed ResNet-50 maps for the predicted zebra class and low-probability tiger
    class. Slide s21.3 now follows a measured pixel nudge before introducing the derivative; s21.4 changes
    only the chosen class. Clearly distinguish softmax probability from score sensitivity, use one brightness
    scale, and explain that noisy/background responses are not object outlines. Reproduction and provenance
    are in `worked/saliency.py`, `worked/saliency.json` and `docs/saliency_example.md`. The old toy data remains.
    Content, type checking, 25 Python tests and three deck tests passed. Checked both slides, their builds and
    narration in the deck with no browser warnings or errors. Saved film timing remains unchanged.
45. **Remove the final two CUB slides (browser s23.7).** Removed s23.7's soft-score/leakage explanation and
    s23.8's comparison with Koh et al., including their narration and animation code. The section now has six
    slides and the lecture 309. Verified that s23.6 leads directly to s06.1, Human interventions. Source results
    are preserved; the full content and check commands passed. No audio or film work was performed.
46. **Standalone CBM repository and Pages migration.** Created `nipunbatra/cbm`, pushed the full source
    history to `main`, and published the website from `gh-pages` at `/cbm/`. Attention PR 8 adds deck/notes
    redirects that preserve anchors; DL 2026 PR 10 points the course resources to the new site. Verified
    the live redirects and course URLs. The existing attention PDF remains available for old references.
47. **Annotation PDF revision 17 and publication.** Rebuilt the matching PDF with 309 pages and 27 bookmarks.
    Revised pages 14-15; removed revision 16 pages 97-98. Verified every footer and bookmark and unchanged
    body text for all other 307 retained slides. Inspected revised pages and the section transition. Published
    release `381c30f` on CBM Pages and updated the course count through DL 2026 PR 11. Deployments succeeded;
    live deck, notes, PDF and saliency images match the release bytes. Previous PDFs are preserved. All review
    changes still await the film rebuild; audio and saved timelines were not changed.
48. **Auto-hiding deck controls and slide map, 16 October 2026.** Added an Attention-style corner toggle and
    toolbar with previous/next build, slide/build counts, searchable map, narration, animation and full screen.
    The controls hide after three idle seconds, recover at the bottom-right corner or with C, and stay visible
    for pointer hover or keyboard focus. The map groups all slides by section and jumps to completed builds.
    Verified desktop/phone layouts, map search, Escape and focus restoration, native button activation,
    keyboard navigation, notes, animation, full screen, idle hiding and first/last boundaries. Type checking,
    25 Python tests and three deck tests passed. This is browser UI only; it requires no film changes.
49. **Explain the hospital shortcut setup (browser s21.8), 16 October 2026.** Separate training on X-rays
    and report-derived labels from testing on a new X-ray with its label hidden. Define a positive label,
    expand NIH, show the two dataset label rates and state why hospital identity can be a shortcut. Removed
    sample counts and decorative scans to make space for these reminders. Rates now come from math/data.py
    and src/data.json; verified the setup against Zech et al.'s methods and Table 1. Expanded the narration.
    Content compilation, type checking, 25 Python tests and three deck tests passed. Inspected the slide and
    narration in the deck. Saved timelines and the beat list are unchanged; this narration awaits the film rebuild.
50. **Annotation PDF revision 18.** Saved `review/cbm-lecture-review-2026-10-16-r18.pdf`: 309 pages and
    27 section bookmarks. Replaced page 19 (s21.8); verified every footer and bookmark and identical content
    streams and text on the other 308 pages. Rendered and visually checked the revised page. Prior PDFs remain.
51. **Publish controls and review revision 18.** Pages release `cbfa536` deployed successfully. Live HTML,
    JavaScript, CSS, notes and PDF match the local files. Verified the published controls, map and revised
    slide in the browser. Existing course links and the 309-page label remain correct. No audio or film
    work was performed.
52. **Remove Part 9 (browser s09.1), 16 October 2026.** Removed s09 from the active lecture order;
    s20 was already excluded. Navigation now goes directly from Part 8 to Part 10. Old s09 and s20
    deck links continue at s10.1. Recorded scene sources remain for the later film rebuild.
53. **Remove the extended CEM shape example (browser s15.11).** Removed former s15.11-15, including
    narration and drawings. Training now leads directly to the training/test recap and summary card,
    renumbered s15.11-12. The existing zebra worked example remains. Together with Part 9, this removes
    six slides. Content, type checking, 25 Python tests and three deck tests passed; checked the transition.
54. **Annotation PDF revision 19.** Saved review/cbm-lecture-review-2026-10-16-r19.pdf with 303 pages
    and 26 bookmarks. Removed r18 page 130 and pages 153-157. Verified all retained slide bodies,
    new footers and bookmark destinations, and visually inspected the CEM recap, summary, Part 10
    transition and final page. Earlier PDFs, audio, saved timelines and the beat list remain unchanged.
55. **Add section and supervision-rung separators (browser s16.1).** Added 17 short title cards before
    the main parts, recap and appendix, and before each of Part 10's three rungs. Rung two explicitly
    distinguishes class labels on task images from the separate concept-bank source; PCBM follows this
    card. New cards use s30-s46 so existing content slide links do not move. Each has narration. The deck
    can preview new scenes without recorded audio, covered by a regression test. Content compilation,
    type checking, 25 Python tests and four deck tests passed. Inspected every separator and the
    CEM-to-rung-two-to-PCBM transition. No audio, saved timeline or film changes were made.
56. **Annotation PDF revision 20.** Saved review/cbm-lecture-review-2026-10-16-r20.pdf with 320 pages:
    303 content slides plus 17 separators. All 303 retained slide bodies match revision 19, and every
    footer and all 43 navigation bookmarks are checked. Inspected all new separators and the transitions.
    The earlier review PDFs remain available for annotations.
57. **Publish review revision 20 and course count.** Source changes `46033e3` and `3b47d6d` are pushed.
    Pages release `34cf249` and DL 2026 PR 12 (merge `751a0e0`) deployed successfully. Live HTML, JS,
    CSS, notes and PDF match the local files. The course links remain correct and its visible/accessibility
    PDF labels show 320 pages. Verified the live separator and course row. Audio, saved timelines,
    the beat list and film remain unchanged; the review narration still awaits the later film rebuild.
58. **Show the unit CAV on the scoring plot (browser s16.8), 16 October 2026.** Added a labelled teal
    arrow with the direction and length from D.pcbm_toy, matching the vector entries and calculation.
    A short reminder states length one, one step right and no step up. The narration now names the arrow.
    Content, type checking, 25 Python tests and four deck tests passed. Inspected the completed slide.
    Saved film timelines and the beat list are unchanged; the narration awaits the film rebuild.
59. **Annotation PDF revision 21.** Replaced page 172 (s16.8) in the 320-page, 43-bookmark PDF.
    All other 319 page streams and text are identical to r20; every footer and bookmark is checked.
    Rendered and inspected the revised PDF page. Previous review PDFs remain available.
60. **Publish review revision 21.** Source commit 9b7773d and Pages release 2d7dc63 are pushed.
    Deployment succeeded. Live HTML, JS, CSS, notes and PDF match the release bytes; the revised slide
    was inspected in the browser. Existing course links and 320-page labels remain correct.
61. **Clarify the alternative to fitting a CAV (browser s16.9), 16 October 2026.** Replaced the ambiguous
    handover with two aligned routes to a concept direction: labelled image features through a fitted
    classifier, or a phrase through CLIP's frozen text encoder. Marked the CAV example as complete and
    identified the phrase route used in the following animal example. Both routes lead to concept scores
    and a task head. The narration explicitly says they are alternatives, not consecutive steps.
    Checked the distinction against PCBM Figure 1 and Section 2 (https://arxiv.org/abs/2205.15480).
    Content, type checking, 25 Python tests and four deck tests passed. Inspected the full slide, first
    and phrase-route builds, narration and transition from s16.8. Saved film timing remains unchanged.
62. **Annotation PDF revision 22.** Updated page 173 (s16.9), retaining 320 pages and 43 bookmarks.
    All other 319 page streams and text match revision 21. Every footer and bookmark was checked,
    and the revised page was rendered and visually inspected. Earlier PDFs remain available.
63. **Publish review revision 22.** Source commit d5919d2 and Pages release 56964cb are pushed.
    Deployment succeeded. Live HTML, JS, CSS, notes and PDF match the local release bytes. Inspected
    the published slide; existing course links and visible/accessibility 320-page labels remain correct.
64. **Define e and v before the dot product (browser s16.10), 16 October 2026.** Replaced the abstract
    vector plot with two labelled paths: photo through the frozen image encoder to image features e,
    and the stripes phrase through the frozen text encoder to concept direction v. Explicitly continues
    s16.9's phrase route. Words and symbols appear before the illustrative values and worked calculation.
    Existing vectors, products and score come from D.pcbm_toy.clip. Narration links this scoring step
    to the earlier CAV example and distinguishes the score from a probability. Content, type checking,
    25 Python tests and four deck tests passed. Inspected final layout, definitions build and narration.
    Audio, saved film timelines and the beat list are unchanged.
65. **Annotation PDF revision 23.** Updated page 174 (s16.10), retaining 320 pages and 43 bookmarks.
    All other 319 page streams and text match revision 22. Every footer and bookmark was checked,
    and the revised page was rendered and visually inspected. Earlier PDFs remain available.
66. **Publish review revision 23.** Source commit 18f1057 and Pages release 02f39ae are pushed.
    Deployment succeeded. Live HTML, JS, CSS, notes and PDF match the local release bytes. Inspected
    the published slide; existing course links and visible/accessibility 320-page labels remain correct.
67. **Use the CLIP phrase route throughout the PCBM introduction (browser s16.2), 16 October 2026.**
    Replaced the first eleven slides with four: animal classes and an illustrative LLM prompt, a reviewed
    shared phrase bank, a photo/phrase cosine comparison, then the complete named score vector. Removed
    CAV fitting, feature-space direction plots and the two-dimensional dot-product detour. The LLM exchange
    is explicitly illustrative; the unchanged measured scores use the saved hand-chosen bank. Updated the
    training/test path, comparison and symbol card to use phrase vectors and cosine similarity consistently.
    PCBM now has 19 slides, seven fewer; the lecture has 313 pages including 17 separators. Content, type
    checking, 25 Python tests and four deck tests passed. Inspected the four new slides and the continuation
    in the browser, and all 19 exported PCBM pages. Saved audio, film timelines and beat list are unchanged.
68. **Annotation PDF revision 24.** Updated PCBM pages 165-183, retaining 43 bookmarks. All 294 slide bodies
    outside s16 are preserved. Every slide footer and bookmark destination was checked. Pages after the
    old PCBM section move up seven. Earlier PDFs remain available for existing annotation references.
69. **Publish review revision 24.** Source commit b9b6565 and Pages release 340e05d are pushed; deployment
    succeeded. The live HTML, JavaScript, CSS, notes and PDF match the local release byte for byte. The
    published cosine slide was inspected. Course PR #13 is merged and deployed, with matching visible and
    accessible 313-page labels; all three course links point to the standalone CBM site.
70. **Organise modern methods by supervision rung and design choice (browser s17.1), 16 October 2026.**
    Rung two now has a map and three subsection separators: A uses CLIP scores directly (the PCBM
    phrase example, then LaBo); B learns a concept predictor from CLIP (LF-CBM); C learns from targets
    grounded in image regions (VLG-CBM). Each separator shows the prediction path and training signal.
    Persistent headers, slide-map entries, notes headings and PDF bookmarks name the rung and group.
    Revised introductions explain what changes between groups; the LF-CBM opening compares both
    prediction paths. The recap follows the new order and distinguishes task fitting from pretraining.
    Checked the distinction against LF-CBM Section 3 (https://arxiv.org/abs/2304.06129) and the VLG-CBM
    pipeline (https://lilywenglab.github.io/VLG-CBM/). Content, type checking, 25 Python tests and four
    deck tests passed. Inspected separators, revised openings, representative labelled slides, recap,
    speaker notes and the searchable map. Saved audio, film timelines and beat list are unchanged.
71. **Annotation PDF revision 25.** Saved review/cbm-lecture-review-2026-10-16-r25.pdf with 316 pages:
    296 content slides and 20 separators, with 46 navigation bookmarks. Exported 109 pages with new
    layouts or hierarchy labels. All 299 other slide bodies match r24 after allowing the new headers
    and PDF text spacing; 207 pages outside the modern sections retain their body text exactly.
    Every footer and bookmark destination was verified. Earlier annotation PDFs remain available.
72. **Publish review revision 25.** Source 42a14d5 and Pages release 3a9eec8 are pushed and deployed.
    Live HTML, JavaScript, CSS, notes and PDF match the local release bytes. Inspected the published
    rung-two map and LF-CBM handover. Course PR #14 is merged and deployed; the visible and accessible
    labels show 316 pages and all three links point to the standalone CBM site. Audio and film timing remain unchanged.
73. **Remove the paper-specific LF-CBM walkthrough (browser s17.19), 16 October 2026.**
    Removed s17's 19 slides and its s48 separator from the active lecture. Archived source remains for
    older reviews and the film. Rung two now has two groups: A uses direct CLIP scores (the PCBM phrase
    example and LaBo), and B learns concepts from grounded region targets (VLG-CBM). Updated the map,
    separators, persistent headers, navigation, ladder, comparisons, recap and references accordingly.
    The preceding shared phrase-bank slide now explains rejecting class names, merging duplicates and
    checking weak matches, with concrete illustrative review examples. The saved hand-chosen phrase bank
    and measured scores are unchanged. Content, type checking, 25 Python tests and four deck tests pass.
    Inspected revised layouts and the direct LaBo-to-grounded-section transition. Saved film timing is unchanged.
74. **Annotation PDF revision 26.** Saved review/cbm-lecture-review-2026-10-16-r26.pdf with 296 pages:
    277 content slides and 19 separators, with 44 navigation bookmarks. Exported 41 revised pages;
    all 255 other slide bodies are preserved. Every footer and bookmark destination was verified.
    No LF-CBM or Oikarinen text remains in the PDF. Rendered and inspected the revised map, phrase review,
    ladder, grounded-method comparison, recap and references. Earlier annotation PDFs remain available.
75. **Publish review revision 26.** Source c2aa678 and Pages release 0ed3f85 are pushed and deployed.
    Live HTML, JavaScript, CSS, notes and PDF match the local release bytes. Inspected the published
    two-group map. Course PR #15 is merged and deployed; both visible and accessible labels show
    296 pages, and all three course links remain correct. Audio and film timing remain unchanged.
76. **Remove LaBo and move directly to rung three (browser s18.1), 16 October 2026.**
    Removed LaBo's 18 slides from the active lecture. Interpreted the requested direct move to rung three
    as also skipping the remaining 15-slide VLG-CBM walkthrough and its separator. Removed the redundant
    two-group map; one rung-two separator now introduces the existing CLIP phrase example, which leads
    directly to s41 and classification by description. Archived all removed narration, scenes and data.
    Updated the ladder, headers, notes, references and four-row recap. Rung three now compares its fixed
    average with the preceding learned head, without referring to LaBo. Concept-checking principles
    remain in the recap and evaluation. Content, type checking, 25 Python tests and four deck tests passed.
    Inspected revised PDF layouts and verified the s16-to-s41 browser transition. Film timing is unchanged.
77. **Annotation PDF revision 27.** Saved review/cbm-lecture-review-2026-10-16-r27.pdf with 261 pages:
    244 content slides and 17 separators, with 40 navigation bookmarks. Exported 44 revised pages and
    preserved all 217 other slide bodies. Every footer and bookmark destination was verified, along with
    the absence of LaBo, LF-CBM and VLG-CBM text. Earlier PDFs remain available for annotation references.
78. **Publish review revision 27.** Source af64f30 and Pages release 92d82ad are pushed and deployed.
    Live HTML, JavaScript, CSS, notes and PDF match the local release bytes. Verified the published
    direct transition from s16 to rung three, map count and revised comparison slide. Course PR #16
    is merged and deployed with both PDF labels showing 261 pages and all three course links correct.
    Audio, saved film timelines and beat list remain unchanged.
79. **Explain random weights and fixed layers (browser old s24.4), 16 October 2026.**
    Kept the requested random-layer control in the recap (s19.7), followed by two new intuitive slides.
    s19.8 defines weights as mixing coefficients chosen by chance without learning from labels; its
    illustrative arithmetic uses features [2,1] and weights [0.4,-0.2] to produce 0.6. s19.9 explains
    that the encoder and mixing layer stay fixed during training, while only the class head learns.
    A second feature vector [1,2] produces 0 using the same weights, distinguishing fixed weights
    from fixed outputs. The two remaining recap slides move to s19.10-11. The full VLG-CBM walkthrough
    remains archived. Checked the control against Srivastava et al. 2024, Section 4 and Figure 3
    (https://arxiv.org/html/2408.01432v2). Toy values are explicitly illustrative and computed centrally.
    Type checking, 26 Python tests and four deck tests passed. Inspected completed slides, progressive
    reveals and speaker notes. Saved audio, both film timelines and the beat list are unchanged.
80. **Annotation PDF revision 28.** Saved review/cbm-lecture-review-2026-10-16-r28.pdf with 263 pages:
    246 content slides and 17 separators, with 40 navigation bookmarks. Exported all 11 recap pages
    and the references page; all 251 other slide bodies are preserved. Every footer and bookmark
    destination was verified. Rendered the new examples and neighbouring slides for visual QA.
    Earlier annotation PDFs remain available.
81. **Publish review revision 28.** Source 783f444 and Pages release b28644d are pushed and deployed.
    Live HTML, JavaScript, CSS, notes and PDF match local bytes. Inspected both published new slides
    and the 263-slide map. Course PR #17 is merged and deployed, with both PDF labels showing
    263 pages and all three standalone CBM links correct. Audio and film timing remain unchanged.
82. **Move grounding to the final optional appendix (browser s24.1), 16 October 2026.**
    Restored the grounding material as optional further reading after TCAV, preceded by separator
    s49. The active order ends s46, s26, s49, s24, end. Persistent headers, slide-map entries, notes
    headings and PDF bookmarks identify it as optional appendix material. Its opening no longer
    assumes a preceding rung-two subgroup. Moved the random-layer control and two explanations from
    the main recap into s24.4-6; later grounding slides shift by two. The main recap now has eight
    slides and retains the general concept-checking takeaway. LaBo and LF-CBM remain archived.
    Type checking, 26 Python tests and four deck tests passed. Rendered every appendix slide,
    inspected the shorter recap, and checked the TCAV-to-appendix browser transition. Saved audio,
    both film timelines and docs/beats.txt are unchanged.
83. **Annotation PDF revision 29.** Saved review/cbm-lecture-review-2026-10-16-r29.pdf with 278 pages:
    260 content slides and 18 separators, with 42 navigation bookmarks. Exported 26 changed or restored
    pages and preserved all 252 other slide bodies. Verified every footer and bookmark destination.
    The final appendix separator is page 260; grounding occupies pages 261-277, before the end card.
    Earlier annotation PDFs remain available.
84. **Publish review revision 29.** Source 753ed5d and Pages release 5b6f25b are pushed and deployed.
    Live HTML, JavaScript, CSS, notes and PDF match local bytes. Verified the optional final appendix
    separator, grounding opening and last-section navigation on the published site. Course PR #18 is
    merged and deployed; both PDF labels show 278 pages and all three standalone CBM links are correct.
    Audio and saved film timing remain unchanged.
85. **Shorten Part 11 from 19 slides to three (browser s11.19), 16 October 2026.**
    Replaced the detailed evaluation walkthrough with four evaluation questions, one measured concept
    correction, and a multi-task versus strict-CBM comparison. Removed metric arithmetic, per-concept
    breakdowns, the separate dataset/training setup, correction-order curves and repeated summaries.
    The remaining comparison defines its oracle policy and states the experiment's limitations beside
    the result. All values still come from D.measured and the saved checkpoint. The 19-slide scene and
    narration remain archived, outside the active lecture. Type checking, 26 Python tests and four deck
    tests passed; checked all three rendered layouts, notes and the transition directly to Part 12.
    Audio, both saved film timelines and docs/beats.txt are unchanged.
86. **Annotation PDF revision 30.** Saved review/cbm-lecture-review-2026-10-16-r30.pdf with 262 pages:
    244 content slides and 18 separators, with 42 navigation bookmarks. Exported the three evaluation
    slides, preserving all 259 other slide bodies. Verified every footer and bookmark destination.
    Earlier annotation PDFs remain available.
87. **Publish review revision 30.** Source af8ac78 and Pages release e16b208 are pushed and deployed.
    Live HTML, JavaScript, CSS, notes and PDF match local bytes. Verified the live three-slide evaluation
    section and map. Course PR #19 is merged and deployed; both PDF labels show 262 pages and all three
    standalone CBM links are correct. Audio and saved film timing remain unchanged.
