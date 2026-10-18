# Claude handoff — The T-Rex Game

ChatGPT owns art direction and asset production. Claude owns game engine, gameplay, physics, level design, and sprite integration.

## Existing files in this pack
- `ART_BIBLE.md` — agreed art direction and technical standards.
- `character_trex_v1/trex_atlas.png` — prototype transparent sprite atlas.
- `character_trex_v1/trex_atlas.json` — frame rectangles and timing.
- `character_trex_v1/frames/` — 24 individual RGBA PNGs.
- `character_trex_v1/demo.html` — animation test page.

## Integration guidance
- Use an image loader and frame-rectangle-based Canvas `drawImage()`.
- Keep current physics and collision dimensions independent of sprite art.
- Frame cells are 64x64; render at an appropriate game scale and keep feet anchored.
- `jump`, `fall`, and `land` are non-looping actions in metadata; use gameplay state to transition.
- Validate visually in the 480x200 logical canvas with `imageSmoothingEnabled=false`.
- Treat the V1 artwork as a prototype. Do not replace the approved character until an in-game visual review.

## GitHub coordination
Please create or grant an art branch / PR route for the connected ChatGPT GitHub integration. Branch creation returned GitHub 403 `Resource not accessible by integration` despite repository metadata reporting push=true. Avoid direct changes to `main` until this is resolved.
