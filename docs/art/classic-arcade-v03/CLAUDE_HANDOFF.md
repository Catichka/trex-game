# Claude Code — V03 integration

This package supersedes the earlier character PNGs/atlases, **not** the game code.
Copy `assets/characters/` into the project, replacing the three previous character asset directories.
JSON files remain next to their matching atlases; load each `*_atlas.json` for frame rectangles.
Note breaking change: caveman is now 32×32 instead of 48×48. Update render offsets and feet anchoring, **but preserve the gameplay hitbox unless playtesting suggests a change**.
T-Rex remains 64×64, pterodactyl 32×32. Character animations retain their existing names and fps.
Keep `ctx.imageSmoothingEnabled = false` and integer screen coordinates where possible.
Make caveman appear approximately half the T-Rex's visible height; don't rely only on cell size.
Test jumping, eating collisions, player ground contact, animation cycling, and both desktop/mobile.
This is a first-pass pixelation of functional prototypes. Please do not call these exact conversions of the concept illustration.
Commit to GitHub after visual QA.
