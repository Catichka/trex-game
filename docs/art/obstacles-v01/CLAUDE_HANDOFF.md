# Claude handoff — Obstacle V01 + two background fixes V04

Copy `assets/obstacles/*.png` and matching `*.json` into the game. The eight IDs exactly match the master brief. **Do not change existing assets**.

New obstacle IDs and dimensions (frame_size; pivot):
- L2 `lava-rock-small`: 15x15; [7,14]
- L2 `lava-rock-large`: 21x21; [10,20]
- L2 `fire-geyser`: 18x24; [9,23], 4 frames, idle loop 8 fps
- L4 `mushroom`: 18x21; [9,20]
- L4 `fern-log`: 24x21; [12,20]
- L4 `stump`: 18x21; [9,20] (also L5)
- L5 `ice-shard-small`: 15x15; [7,14], **gold/pink cave crystal**
- L5 `ice-shard-tall`: 15x24; [7,23], **pink cave crystal**

All are RGBA PNG, nearest-neighbor, with exactly matching JSON atlas cells and pivots. Single-frame idle except the four-frame fire-geyser. Ground y=152.

**Two targeted environment fixes:** Replace **only** `assets/environments/grasslands/mid.png` and `assets/environments/caverns/mid.png`. Both are based on the approved V03 pack. Grasslands bushes have cooler, darker greens; Caverns' large cool-toned crystals are moved 15 pixels upward and recoloured in subdued violet-blue, so they no longer sit at the obstacle line. Do not replace environment.json or any other layers.

Please test the eight obstacles in their respective levels, check animation and hitbox alignment, confirm no confusion with background props, and verify horizontal wrap in both modified layers. Capture screenshots at native 480x200 and 3x; commit only after testing.

**Scope:** No edits to T-Rex, roar, other characters, or existing effects. The two missing dinosaur characters and RAWR polish are separate future packs.
