# Concept Bottleneck Models

A graduate lecture for ES 667 Deep Learning at IIT Gandhinagar. One editable source produces a live slide deck,
matching narration notes, a vector PDF and a narrated film.

- [Slides](https://nipunbatra.github.io/cbm/)
- [Notes](https://nipunbatra.github.io/cbm/notes.html)
- [PDF](https://nipunbatra.github.io/cbm/concept-bottleneck-models.pdf)
- [Deep Learning course](https://nipunbatra.github.io/dl-2026/schedule.html#lecture-20)

The reviewed lecture currently has 311 slides in 27 sections. The slides, notes and PDF include review revision 16
(15 October 2026). The film still uses the earlier narration and will be rebuilt after the slide review.

## Source and local preview

Read `AGENTS.md`, then `docs/CODEX_HANDOFF.md` for the review workflow and current state.

On the existing lecture workstation:

```sh
sh tools/setup_worktree.sh
npm run deck
```

Open http://localhost:8766. Arrow keys step through builds, N shows narration and O opens the overview.
The setup script links shared dependencies and external media. A fresh machine needs the Node dependencies in
`package-lock.json` and the Python packages in `requirements.txt`; the current build scripts expect the Python
interpreter at `~/base/bin/python`. PDF export also uses local Chrome and Puppeteer.

| Source | Purpose |
|---|---|
| `narration/scenes/` | One slide heading and narration per line |
| `src/scenes/`, `src/kit/` | React, SVG and KaTeX drawings |
| `math/data.py`, `src/data.json` | Computed examples and numerical provenance |
| `docs/lecture.md` | Generated readable lecture |
| `docs/sources.md`, `assets/image_sources.json` | References and image licences |
| `review/CHANGES_PENDING_VIDEO.md` | Review changes still awaiting the film rebuild |
| `publishing/README.md` | Release procedure and publication record |

Run `npm run content` and `npm run check` after a content change. These commands leave saved audio and film
timings untouched. Check the revised slide visually in the deck before committing.

## Publishing and film

The `main` branch holds the source and its history. GitHub Pages serves the built deck, notes and PDF from the
root of `gh-pages`. Publishing is explicit, following `publishing/README.md`; pushing source changes alone does
not publish a new lecture.

Large audio and film files are kept outside Git under `/Volumes/Extreme SSD/cbm-film/`. Film generation is a
separate process described in `CLAUDE.md`; it is not part of a slide or Pages release.
