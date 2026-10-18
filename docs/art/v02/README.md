# The T-Rex Game — Character Art V02

This pack contains **41 real transparent PNG frames**, a 512×512 atlas, and machine-readable JSON.
The sprites are a *clean, programmatically drawn integration prototype* based on the approved green/red/cream character design. They are NOT pixel-perfect cutouts of the detailed concept illustration; further polish is planned.

## Contents
- `assets/characters/t-rex/frames/` — 41 individual 64×64 transparent PNGs
- `assets/characters/t-rex/trex_atlas.png` — 8 columns × 8 rows, 64×64 cells
- `assets/characters/t-rex/trex_atlas.json` — animation names, rectangles, fps, loop flags
- `PREVIEW.png` — enlarged animation pose overview (not a game asset)
- `CLAUDE_HANDOFF.md` — integration checklist
- `demo.html` — standalone animation preview; open in browser

## Animation inventory
idle 4; run 8; jump 6; fall 4; land 4; hurt 3; eat 6; celebrate 6.

All PNGs have true alpha. The 64×64 cell includes transparent padding.
Atlas cells start at x=column×64, y=row×64. Only use the listed frames in JSON.
Draw with nearest-neighbour scaling (`ctx.imageSmoothingEnabled=false`).

## Integration notes
The current game's logical canvas is 480×200, with a ground coordinate around y=152
as observed in `game.js`. Do not assume the sprite's full 64×64 box is the collision box.
Align sprite visual feet around local y=56 to the game's ground; adjust draw position accordingly.
Use existing physics/collision code; keep render-only sprite state independent.

## Licence
New art assets in this pack were generated for The T-Rex Game. The game owner may use and modify them.
