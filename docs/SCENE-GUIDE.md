# Writing a scene for the CBM film

Project root: `/Users/nipun/git/cbm`. Remotion + React + SVG + KaTeX, the same stack as the YOLO and DETR
lecture-films (`../yolo`, `../detr`). Read before writing:

1. `docs/scene_plan.md`: what each scene shows, beat by beat. The global rules at the top are binding (colour =
   meaning, provenance tags, the intervention grammar, living flows, layout bands).
2. `docs/beats.txt`: every beat's exact narration and its start to end time inside its scene (seconds).
3. The kit:
   - `src/kit/core.tsx`: Stage, Svg, G, Txt (SVG text), HText (HTML text), Tex (KaTeX), Header, Arrow, Panel, Bars,
     bs/be/bw timing helpers, E/clamp/inv.
   - `src/kit/cbm.tsx`: PhotoR (rectangular photo frame; `fit(src, x, y, w)` keeps the aspect; `crop`/`frac` windows;
     `pixel` for the 64 px test images), ux/vy (normalized image coords to design units), Region (outlined photo
     region + label), Pill, EvTag (provenance: computed / measured / illustrative / constructed / generated /
     schematic), Credit + CREDIT (photo credits), Block (pipeline block, kinds input / concept / head / output / edit /
     loss / leak), Flow (polyline connection with travelling dots, `rev` for gradients, `dash` for bypass), ConceptRow
     (teal bar + value, amber edit with ghost), VecCol (bracketed column vector), ShareBars (class shares that move
     between two states), Matrix, Wave (signal trace with marked windows), SensMap (occlusion map), Slider, ArchMap
     (top-right x / g / c / f / y map), EditMark (pencil), Person (human glyph), Cross, rgba.
   - `src/kit/pipe.tsx`: the canonical gull pipeline (GullPipePhoto + GullPipeSvg, state object `PipeState`, layout
     `PIPE`, `rowY(i)`). s02, s06 and s14 must use it so the metaphor looks identical each time.
   - `src/kit/slots.tsx`: Slot, Brace, Gauge, BText (backed SVG label), TexSteps (equation revealed part by part with
     fixed layout: use it for every term-by-term arithmetic line).
   - `src/kit/theme.ts`: colours `C` and the KaTeX macros (`\cin{}`, `\ccon{}`, `\chead{}`, `\cedit{}`, `\closs{}`,
     `\cleak{}`, `\cmu{}`, `\cbad{}`, `\cout{}`, and `\gth`, `\fph`, `\ch`, `\cvec`, `\yh`).
   - `src/kit/anim.ts`: `inv`, `E.out/io/back`, `vis`, `pop`, `tw`, `wob`, `typed`.
   - `src/kit/data.ts`: `D` = `src/data.json`.
4. Reference scenes: `src/scenes/S00.tsx` (title), and the DETR film's finished scenes for idiom
   (`../detr/src/scenes/S13.tsx`, `S07.tsx`, `S14.tsx`). Match the look: dark blackboard, generous spacing, few
   elements at a time, everything animated in step with the voice.
5. `src/data.json` (from `math/data.py`): every number. NEVER type a number that exists in data.json; read it from `D`
   (e.g. `D.zoo.logits[1]`, `D.bird.after.share[1]`, `D.measured.acc.cbm`) and format with `.toFixed(...)`.
   Spoken numbers and displayed numbers must agree (check against beats.txt). Structural constants (64 px, 8 classes,
   5 concepts, 512 test images, 32 random orders, 6 s, 30 s epochs, 10 m) may be typed.

Images in `public/img/` (sizes in `IMG` in cbm.tsx): `gull.jpg` (square crop; concept regions in `D.gull.regions`
as normalized cx, cy, w, h: wingtip, bill, tail, head), `zebra_plains.jpg`, `zebra_grevy.jpg`, `horse.jpg`,
`giraffe.jpg` (all CC BY-SA photos: always show `<Credit text={CREDIT[src]} />` small under the photo, at least once
per scene they appear in), `kilns_obb.png` (real Sentinel-2 crop with SentinelKilnDB boxes, 694 px square),
`chimney-pair.png` (generated, two panels side by side; use the right half `frac={[0.5, 0, 1, 1]}` for the chimney
view; always tag `EvTag kind="generated"`), `test_000.png` ... `test_042.png` (the real 64 x 64 test inputs of the
measured experiment; draw with `pixel`).

## Scene contract
- File `src/scenes/SNN.tsx` exports `SNN: React.FC<SceneProps>` (registered in `src/scenes/index.ts`; a stub exists,
  replace it). `t` = seconds since the scene start (negative during the 0.4 s dissolve in). `P` = scene plan, `P.dur`
  its length.
- Timing: `bs(P, k)` = start of beat k (1-indexed within the scene), `be(P, k)` its end, `bw(P, k, 'word', n)` the
  approximate start of the n-th word in beat k starting with 'word' (case-insensitive; estimated from character
  counts, allow ~0.3 s slack). Drive every appearance from these so visuals follow the voice. Never hard-code
  absolute seconds: the narration may be regenerated and beat lengths will shift.
- Layers inside `<Stage>`: photos (`PhotoR`, HTML), then `<Svg>` drawing layers, then `<Tex>` / `<HText>` HTML text,
  then `<ArchMap>`, `<EvTag>`, `<Credit>` (HTML overlays). Later children draw on top.
- Header: `<Header t={t} part={N} title="..." />` with N from the scene plan ("Part N"); title = the scene title from
  beats.txt. s02 to s13: add `<ArchMap on={[...]} o={inv(0, 0.5, t)} />`.

## Visual rules
- Colours carry meaning for the whole film (scene_plan.md table). Blue only for input / encoder, teal only for
  concepts, dark grey for the task head, amber only for human edits, coral only for losses / gradients, purple only
  for leakage / bypass, white for outputs.
- Keep everything above y = 960 and inside x 96 to 1824. Body text >= 26, labels >= 22, equations 40 to 64.
- Build step by step; nothing appears before it is spoken; hold finished states. At most ~5 text items in one area
  at once; fade earlier items out when crowded (fade out, then fade in: never cross-fade two texts in one place).
  The screen should always show what the voice is talking about. Avoid empty frames and avoid dense slides: this
  must feel like a living computational object, not PowerPoint. Use Flow dots while information moves.
- Text over a photo needs a dark backing (`BText` or `Pill`).
- On-screen prose: plain, short, no em or en dashes (use commas or colons), no hype words, British spelling.
- Do not edit shared files (`src/kit/*`, `src/Film.tsx`, `src/scenes/index.ts`, `src/data.json`, math, narration).
  If you need a helper, define it in your scene file. If you need a number that is not in data.json, say so in your
  final report (do not invent it).
- Technical accuracy (binding): a strict CBM's task head reads only the concept values; illustrative heads are
  hand-written (tag them); the measured experiment is one seed, 512 synthetic test images, oracle corrections from
  true labels, no human study; leakage distributions and the blue circle / square are constructed; the EEG is
  schematic; the chimney view is generated; CLIP outputs in s01 are computed by a real model.

## Check your work (required)
- Stills: `node tools/stills.mjs s05` (one still at each beat's start and 60% through, plus the end) or
  `node tools/stills.mjs s05 3.2 10 18.5` for chosen scene-relative seconds. Output: `qa/stills/s05/*.jpg`.
  Contact sheets: `~/base/bin/python tools/sheet.py out.jpg a.jpg b.jpg c.jpg d.jpg` (2 columns), then look at
  EVERY sheet with the Read tool.
- Look for: overlaps, clipped text, text over busy photo areas without backing, wrong numbers, empty frames, things
  appearing before they are spoken, anything below y 960, inconsistent colours. Fix and re-render, 2 to 3 rounds.
- Type errors: `npx tsc --noEmit -p .` must not report errors in your files.
- If a bundle error mentions another author's scene file, wait a few seconds and retry; do not edit their files.

## Parts 9 and 10 (revision of 10 October)
- New data: `D.probe` (measured leakage probe on the shape model: `radius`, `mean_p_large`, `n_per_radius`,
  `corr_r_plarge_within_small/large`, `r2_{cx,cy,bg,shade}_from_soft/hard`) and `D.worked` (Part 10 worked examples:
  `classes`, `train`, `test`, `example` = the worked photo, `photo_size` {file: [w, h]}, `photo_credit`, `pcbm`, `lfcbm`,
  `labo`, `cem`, `llm` with the real Gemini JSON replies). Read `docs/worked_examples.md` first: it explains every number.
- Photos: `public/img/worked/<file>.jpg` (36 Commons photographs, 512 px wide; use `src="worked/zebra_12.jpg"` with
  `PhotoR`, sizes from `D.worked.photo_size`). Credit them collectively: "36 Wikimedia Commons photographs (CC BY-SA / CC
  BY / public domain)" and, when one photo is shown large, its artist from `D.worked.photo_credit[file].artist` and licence.
- Provenance tags: Part 10 computations on the 36 photos → `EvTag kind="computed"` with text like "CLIP ViT-B/32 on 36
  Commons photos, teaching example"; Gemini JSON → `computed` "real reply, <D.worked.llm.model>"; CEM numbers →
  `illustrative`; the shape probe → `measured` "saved predictions of the shape model, no retraining".
- JSON cards: monospace (`F.mono`), size ≥ 20, keys in chalk2, strings in teal, numbers in chalk; long arrays wrap.
- Use `MathSvg` (kit) for any maths symbol inside SVG; never type ĉ, ŷ, θ, φ as plain text.
