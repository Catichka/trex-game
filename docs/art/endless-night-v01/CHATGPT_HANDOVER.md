# Endless Night and Phantom Raptor

All ten PNGs are in this inbox. Use nearest-neighbor rendering to preserve the 1× pixels. Use zero-based coordinates.

## Endless Night layers

All layers are 480 × 200. Back-to-front order:

1. `endless-night-sky.png` — opaque and stationary.
2. `endless-night-clouds.png` — scrolling clouds.
3. `endless-night-far-hills.png` — distant ridge and volcano.
4. `endless-night-mid.png` — rolling hills, trees and rock spires.
5. `endless-night-near.png` — grass tips on rows 150–151.
6. `endless-night-ground.png` — ground starts at row 152.
7. `endless-night-foreground.png` — grass clumps at the bottom edge.

Layers 2–7 wrap horizontally at 480 px. Place obstacles and characters at the existing gameplay depth.

## Obstacles

| File | Size | Bottom-center anchor |
|---|---|---|
| `moonstone-boulder.png` | 27 × 24 | (13, 23) |
| `night-stump.png` | 18 × 21 | (9, 20) |

## Phantom Raptor

`phantom-raptor-sheet.png` is 480 × 300, arranged as six columns by five rows of 80 × 60 frames. The raptor faces left. The contact row is 58 within each cell.

| Row | Animation | Used columns |
|---|---|---|
| 0 | run | 0–5 |
| 1 | telegraph | 0–2 |
| 2 | cloak | 0–3 |
| 3 | stun | 0–3 |
| 4 | defeat | 0–2 |

Unused cells are transparent. The cloak effect uses dithered transparency baked into the PNG. Claude handles animation timing, game integration and JSON.
