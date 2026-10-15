# QA report

*Concept Bottleneck Models*, 9 October 2026. Running time 30:59 (1859.1 s), 3840 × 2160, 30 fps, 55,774 frames.

## 1. Numbers
- `math/data.py` asserts that every illustrative head reproduces the lecture's stored outputs and that the measured
  experiment's metrics file still matches the preserved-evidence hash.
- `math/numerical_validation.py` (15 tests, all pass) recomputes by independent routes: the zebra / horse / giraffe
  matrix product by explicit loops, plus softmax; the gull, sleep and kiln heads; the faulty billing head; the
  incompleteness bound (all 16 functions enumerated); the leakage error in closed form, Φ(−7.06) ≈ 8 × 10⁻¹³; the CEM
  mixture; all seven preserved experiment hashes; the measured accuracies as fractions of 512; test image 10 recomputed
  from the saved `cbm.pt` checkpoint; CLIP output consistency with the image hash; the schematic spindle's FFT peak in
  12 to 14 Hz.
- `math/test_narration.py`: every number spoken in the narration is traceable to `src/data.json` or to a listed
  structural constant, and the 30 key spoken values are present.
- Scene authors read every displayed number from `D` (data.json). No scene needed a number outside it.

## 2. Evidence labelling (data split, sample size, seeds, correction policy, human vs oracle)
- Measured experiment, always tagged MEASURED "one seed · 512 synthetic test images · oracle corrections". Part 11
  states one training seed, 512 synthetic test images, corrections taken from the true labels (oracle), and no human
  study. The random-order band is labelled "range over 32 random orders, not a confidence interval".
- The CLIP black box is tagged COMPUTED · REAL MODEL. Hand-written heads are tagged ILLUSTRATIVE VALUES. The leakage
  distributions, blue circle / square and faulty head are tagged CONSTRUCTED EXAMPLE. The EEG is tagged SCHEMATIC and
  the chimney view GENERATED IMAGE.
- The sleep example states that it demonstrates a mechanism, not a clinical result.

## 3. Narration
- Gemini TTS (gemini-3.8-flash-tts, voice Orus), 140 beats, 3,102 words, tempo 1.12.
- Per-clip ASR (`tools/asrcheck.py`): round 0 flagged spoken style tags in 3.5, 4.7, 11.3 and 13.3, and inserted words
  in 4.4, 4.11, 7.3, 11.6, 13.2 and the end card. These were regenerated; 13.3 needed two rounds.
- Beat-level ASR on the assembled track (`tools/asr_beats.py`) found two more leaks the per-clip pass had missed:
  0.1 (title) and 10.3 (CEM). Both open with a title-like phrase and leaked on every retry. A short per-beat direction,
  `{tags: [calm]}`, fixed both. One reviewed exception, 5.1 ("x i" transcribed as "xi"), is hash-pinned in
  `qa/asr_reviewed.json`. Final run: no suspects in 140 beats.
- Whole-film transcription of the final voice track against the script (`tools/asr_full.py`): weighted similarity
  0.994, no multi-word differences in any of the seven chunks.
- Loudness: voice −16 LUFS, true peak −1.5 dBTP. The music bed sits at −33 LUFS (17 dB below the voice) and is ducked
  further under speech. Final mix −16 LUFS.

## 4. Frames (animatic)
- `tools/qa_video.py`: one frame every 3 s (29 contact sheets, `qa/sheets/`) and Tesseract OCR every 6 s. I inspected
  every sheet. The OCR suspects were credit lines in small type and words caught mid-fade ("Generalsupport" is the
  queue label set in caps; "beyon", "shado" and "includethese" are mid-fade frames).
- Checked: KaTeX typography, matrix alignment and true minus signs, concept labels, waveform legibility and axes,
  relative image sizes, text above y 960, and colour roles (input blue, concepts teal, head grey, edits amber,
  losses coral, leakage purple).

## 5. Review of the animatic and fixes made before the masters
Gemini 3.1 Pro watched the whole animatic (`docs/reviews/gemini_animatic_review.md`). It found evidence labelling
consistent and the audio clean. Its points, with my assessment:

| Point | Assessment | Action |
|---|---|---|
| Knab et al. should be 2024, not 2026 | Incorrect: the survey is TMLR 2026 (brief, OpenReview, companion site). The 2024 date is likely the preprint. | none |
| "wingtip colour" box covers the tail / mantle (1:22) | Incorrect: frame extraction shows the box on the black primaries | none |
| "tail rounded" and W entries hard to read (1:51, 5:08) | Mid-fade frames; settled states are legible | none |
| 8 s static opening of Part 3 | Valid | neuron now appears at the start of beat 3.1 |
| Arithmetic too fast (5:28, 6:50) | Products and results stay on screen in step with the voice; final states hold | none |
| c⁺, c⁻, v_k not defined in audio | Narration defines them ("one for active, one for inactive"; "each concept is a direction ... projected onto these directions") | none |

My own review found:
- s06: the gull shares reached 0.91 only 1.4 s before the EEG replaced them. They now move on "moves" and land on
  "0.91", and the pipeline holds longer.
- s10: the language-model card proposed "grey wingtips" for a herring gull, which is wrong for that species and
  contradicts Part 2. It now reads "black wingtips". The chip "red gape spot" now reads "red bill spot".
- s12: a "1 km" scale bar assumed the SentinelKilnDB figure was at native 10 m resolution. The figure is upsampled about
  5× (measured block spacing ~5.4 px), so the bar was removed rather than guessed.
- s08: the final "add shape" state is held 2.5 s.

## 6. Revision after the first masters (10 October 2026)
- Wording: the gull concept "breast white" is now "head white", and the Part 1 property "breast colour" is now
  "head colour" (it points at the head region). Beats 1.9 and 2.3 were regenerated and passed both ASR checks. The
  head weight and values are unchanged and remain illustrative. Adult herring gulls have white heads.
- Maths typesetting: the top-right architecture map and every small symbol (x, g_θ, ĉ, f_φ, ŷ in s08, s10, s11 and
  s13) were plain-text Unicode in the UI fonts. ĉ looked like χ̂ and φ like ψ. They are now rendered with KaTeX through
  a new `MathSvg` kit component, the same engine as every other equation. Two prose labels that used "ĉ" now say
  "the concepts".

- Part 3: the examples are now explained, not just named (about 25 s more). Beat 3.7 explains a sleep spindle (11 to
  16 Hz, 0.5 to 2 s, a sign of stage 2 sleep), 3.8 explains why "chimney visible" is a clue to kiln type, and 3.9 says
  what a duplicate charge is. Each sentence is matched by a caption under its card and, for the EEG, a label on the
  burst. The gull photo credit in the grounding column overflowed the column; it now wraps inside it. Beats 3.7 to 3.10
  passed both ASR checks. Running time is now 23:30.
- `tools/music.py`: a bell note seeded a few milliseconds before t = 0 crashed the mix for the new length; onsets are now
  clamped at 0.

## 7. Expanded Parts 9 and 10 (10 October 2026)
- Part 9 is now two scenes (s09 rewritten, s20 new). Leakage is defined before the example, the intervention cost is
  staged slowly, and s20 adds a measured probe of the saved shape model plus four mitigations.
- Part 10 is now six scenes (s10 overview, s15 CEM, s16 PCBM, s17 label-free CBM, s18 LaBo, s19 comparison). They are
  worked on 36 Commons photographs, with real CLIP / ResNet-50 computations and real Gemini JSON concept lists
  (`docs/worked_examples.md`). The CEM numbers and the CLIP-target heat grid in s17 are illustrative and tagged so.
- 53 new beats passed per-clip and final-track ASR (16.7 re-phrased after a style-tag leak). All tests pass. Running
  time 30:59.

## 8. Known limitations
- Running time is 30:59, extended on request from the original 18 to 22 minute target to give Parts 9 and 10 room; Acts 1 to 13
  are all kept.
- The animatic was rendered before the fixes in section 5. The masters include them.
- The kiln and EEG parts are design illustrations. No trained kiln or sleep model exists behind them, and the film says so.
