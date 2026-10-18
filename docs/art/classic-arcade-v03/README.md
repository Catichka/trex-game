# The T-Rex Game — Classic Arcade V03

A complete **pixelation pass** over the previously delivered V02/V01 character sprites.
This is a **functional transition pack**, not a faithful redraw of the latest illustrated concept sheet. The art retains the previous prototype silhouettes; the more elaborate approved concept will need manual pixel-art redrawing to match exactly.

## Delivered
- T-Rex: 64×64 frames, 41 total; designed at effective 32×32 pixel grid.
- Pterodactyl: 32×32 frames, 21 total; designed at effective 16×16 grid.
- Caveman: 32×32 frames, 33 total; designed at effective 16×16 grid.
- 95 transparent individual PNG frames, 3 atlas PNGs, 3 animation JSONs.
- `PREVIEW.png` for inspection.

**Size note:** Caveman's canvas is half the T-Rex canvas height. Visible body height depends on sprite padding and drawing scale; Claude should align feet and adjust drawing scale to make the caveman *visibly* approximately half T-Rex's height.

No new environment tiles are included. Do not extract the concept-sheet image as a tile atlas; its checkerboard, labels, and mixed cell sizes make it unsuitable as production sprites.

Nearest-neighbor scaling only; turn off Canvas smoothing.
