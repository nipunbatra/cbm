# Concept Bottleneck Models: lecture slides and lecture film

One source makes three things: live HTML slides, a vector PDF, and a narrated lecture film (ES 667 Deep Learning,
lecture 21, IIT Gandhinagar). The slides are the film's own scene components played in the browser, so a change to a
slide is a change to the film. Published deck: https://nipunbatra.github.io/attention/concept-bottlenecks/

## First run in a new worktree
```sh
sh tools/setup_worktree.sh     # links node_modules and the SSD media (audio, renders) kept outside git
npm run deck                    # builds deck/ and serves it at http://localhost:8766
```
Keys in the deck: right arrow, space or click = next build; left = back; up/down = previous/next section; N = notes
(the narration, current sentence highlighted); O = overview; A = transitions on/off; F = full screen.
`#s04.6` opens section s04 at slide 6. Builds stop at the end of each narration sentence and wait for a click.

## Where things live
- **Narration and slide headings (the content):** `narration/order.txt` lists the sections in order;
  `narration/scenes/<id>.txt` has one line per slide: `[[Slide heading]] narration text || pause`.
  The heading takes colour markup: `{x:input}` blue, `{c:concept}` teal, `{f:task head}` grey, `{e:edit}` amber,
  `{l:loss}` coral, `{k:leak}` purple, `{y:answer}` white bold, `{m:muted}`, `$...$` KaTeX.
- **Drawings:** `src/scenes/S<id>.tsx`, one component per section; beat k of the narration file is slide k.
  Timing helpers: `bs(P,k)` / `be(P,k)` beat start/end, `bw(P,k,'word')` when a word is spoken, `bh(P,k)` the heading.
  Kit: `src/kit/core.tsx` (Rich, SlideHead, Tex, Header), `src/kit/cbm.tsx` (photos, EvTag, ConceptRow, VariantCard),
  `src/kit/theme.ts` (colours = meaning, KaTeX macros `\cin \ccon \chead \cedit \closs \cleak \gth \fph \ch \cvec \yh`).
- **Numbers:** `math/data.py` writes `src/data.json` (scenes read it as `D`). Never type a number on a slide that
  exists in data.json; spoken numbers must trace to it (`math/test_narration.py` checks).
- **Readable lecture:** `docs/lecture.md` (generated: every heading and its narration). Style rules for slides:
  `docs/SCENE-GUIDE.md` and the "Revision 2" sections at the end of `docs/scene_plan.md`.
- **Change log for the next film:** `review/CHANGES_PENDING_VIDEO.md`. Add an entry for every slide or narration
  change; the film is remade from it later.

## Editing workflow
1. Edit the narration line(s) in `narration/scenes/<id>.txt` (one idea per slide; plain, active British English,
   no em or en dashes).
2. `npm run content` rebuilds script.json, docs/lecture.md, the timeline (estimated from the text when audio is out of
   date) and docs/beats.txt, and checks spoken numbers.
3. Edit the scene; keep one idea per slide, at least a third of the canvas empty, words before symbols, every
   number-bearing visual tagged with an `EvTag` (computed, measured, dataset, reported, illustrative, constructed,
   schematic). Photos need their `Credit`.
4. Check: `npm run check`; render a slide's final frame with
   `TMPDIR="/Volumes/Extreme SSD/cbm-film/tmp" node tools/stills.mjs s21 <seconds>` (beat end minus 0.05 s from
   docs/beats.txt), or just look at it in `npm run deck`.
5. Note the change in `review/CHANGES_PENDING_VIDEO.md`.

## Do not
- Do not run `tools/tts.py`, `tools/timeline.py` or the renders unless asked: the film is remade later in one pass.
- Do not publish (attention site, course site, YouTube) unless asked.
- The internal disk is nearly full: keep large outputs on the SSD (`TMPDIR` above).
