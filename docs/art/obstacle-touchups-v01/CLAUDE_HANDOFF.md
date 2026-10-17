# T-Rex Game — Characters V01 + three obstacle touch-ups

## New characters
- `assets/characters/stegosaurus/stegosaurus.png` and `.json`: 48x32 cells, pivot [24,31]; visible approximately 38x27px. Facing RIGHT.
- `assets/characters/small-dino/small-dino.png` and `.json`: 24x24 cells, pivot [12,23]; visible approximately 19x18px. Facing RIGHT.
- Both atlases: 6 columns × 3 rows. Row 0 `run` 4 frames 8fps loop; row 1 `panic` 4 frames 10fps loop; row 2 `caught` 6 frames 12fps one-shot.
- PNG RGBA, no antialiasing; pivot coordinates are constant. Grounded run/panic feet occupy bottom cell row. `caught` intentionally squashes/disappears.

## Minor obstacle fixes
- `assets/obstacles/mushroom.png`: artwork shifted down 1px within unchanged 18x21 cell, pivot [9,20].
- `assets/obstacles/fern-log.png`: artwork shifted down 1px within unchanged 24x21 cell, pivot [12,20].
- `assets/obstacles/ice-shard-small.png`: brighter warm highlights, unchanged 15x15 cell, pivot [7,14].
- JSON included unchanged for all three.

## Integration QA
1. Install files at paths above. Do not rescale; turn smoothing off.
2. Confirm character orientation and JSON animation parser compatibility; engine controls collisions and hitboxes.
3. Confirm `run` and `panic` grounded feet align at y=152 with no frame-to-frame ground jitter.
4. Verify `caught` runs once and transitions/clears correctly.
5. Verify obstacle bases touch ground and warm cave crystal remains visible at 1x.
6. Send native-resolution gameplay screenshots and feedback before committing as approved.

No background changes or roar changes in this pack. Existing V04/V05 assets remain in place.
