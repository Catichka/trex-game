# The T-Rex Game — Art Bible v0.1

## Creative direction
Modern indie pixel art blended with expressive retro-cartoon acting. Warm, playful, colourful prehistoric world. The protagonist is **T-Rex**: green body, pale golden belly, coral-red back spikes, oversized head, huge expressive eyes, tiny arms, lively tail, and a mischievous grin. Silhouette must remain clear at gameplay scale.

## Technical contract
- Current HTML5 canvas logical resolution: **480 × 200** pixels (`game.js`).
- Pixel smoothing disabled. Prefer nearest-neighbour rendering and integer positions/scales.
- Sprite cells: 64 × 64 pixels initially; transparent RGBA PNG.
- T-Rex sprite direction: faces right by default. Flip horizontally in engine if appropriate.
- Animations must use consistent frame canvas, anchor/pivot, and ground alignment. A 64×64 canvas is not a 64×64 collision box.
- Sprite atlas and JSON metadata must travel together. Do not change collision boxes solely because artwork changes.
- Gameplay drawing scale to be agreed with Claude; test at actual canvas size before approval.

## Initial animation inventory
| Action | Frames | Target FPS | Loop |
| --- | ---: | ---: | --- |
| Idle | 4 | 5 | yes |
| Run | 8 | 12 | yes |
| Jump | 4 | 8 | no |
| Fall | 4 | 8 | no |
| Land | 4 | 10 | no |
| Eat | TBD | TBD | no |
| Hurt | TBD | TBD | no |
| Celebrate | TBD | TBD | no |

## World palette & backgrounds
- Grasslands: bright grass, distant rolling hills, warm sky, sparse prehistoric flora.
- Forest: layered trees, dense ferns, sunbeams, depth separation.
- Ice: blue-white glaciers, cold shadows, distant mountains.
- Volcano: red-orange lava, charcoal rock, smoky silhouette mountains.
- Endless: art direction to follow game logic.

Backgrounds should be separated into far/mid/near layers with distinct parallax rates; ground/obstacle silhouettes must remain readable. Art must not obscure hazards.

## Production pipeline
1. Concept and approval.
2. Transparent isolated sprite frames and/or seamlessly tileable layers.
3. Validate frame size, alpha, atlas coordinates, animation loops, anchor points, and game-scale readability.
4. Integrate on a separate branch; Claude owns gameplay logic and integration.
5. Review in-game screenshots and adjust.

## Current status
The bundled `character_trex_v1` is a **functional prototype**, not approved final T-Rex V2 art. It includes 24 frames and JSON atlas coordinates. Rework proportions and polish before final character lock.
