# Deck controls verification, 16 October 2026

Tested in the Codex browser against the local production build, at 1280 x 720 and 390 x 844.

- C opens the tray and focuses Next. The stage bounds remain unchanged.
- Pointer controls hide after three idle seconds; incidental pointer focus returns to the slide.
- Keyboard focus keeps the tray visible beyond the idle interval.
- The map searches both headings and IDs, including s21.8 and end.1. An unmatched query has a clear empty state.
- Selecting a slide shows its completed build. First/last navigation buttons are disabled at the boundaries.
- The modal isolates focus. Escape closes it even with text in the search field and restores the invoking control.
- Enter on Notes toggles narration without advancing the slide. Arrow keys still navigate from a focused button.
- Animation and full screen toggles update their pressed states; entering and leaving full screen both work.
- The phone toolbar wraps without horizontal overflow. The map is readable and its close button remains available.
- Corner recovery and pointer hover were checked with real mouse events. Synthetic touch input is not supported by the in-app browser; physical-touch recovery was not exercised.
- Notes and the toolbar use the same within-slide build count.
- Slide content, print mode, audio and recorded film timing are independent of the controls.

Reproduce from `npm run deck`, open `http://localhost:8766/#s21.8`, then use C and M.
Evidence is under `qa/review-2026-10-16/` on the media volume.
