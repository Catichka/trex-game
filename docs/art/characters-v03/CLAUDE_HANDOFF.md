# Characters V03 — Claude handoff

Replace only the two character PNG+JSON pairs under `assets/characters/stegosaurus/` and `assets/characters/small-dino/`.

Stegosaurus: 48x32, pivot [24,31]. Small dino: 24x24, pivot [12,23]. Same atlas layout, JSON, frame counts, FPS, animation names, orientation and caught animations as V02.

V03 changes only RUN and PANIC lower-leg pixels: far leg darker, near leg lighter; four distinct stride poses; stegosaurus shins extended into the lower band, feet on bottom row. No code changes intended. Colour palette and plate shapes are otherwise unchanged (optional suggestions deferred to avoid regression).

**Please test before approval:** view all four run frames at 1x, ensure frame 1 vs frame 3 distinguishable, confirm grounded alignment, confirm panic/caught/score once, and inspect both characters against Grasslands and Swamp. Keep V02 rollback until approved.
