# Claude Code — integrate character assets

Please integrate this pack into the existing game without rewriting game logic or level design.

1. Copy `assets/characters/t-rex/` into the game's assets folder.
2. Preload `trex_atlas.png` once; read `trex_atlas.json`.
3. Render using `drawImage(image, sx, sy, 64, 64, dx, dy, 64, 64)` with smoothing off.
4. Derive animation from existing player state (run, jump, fall, land, hurt, eat, celebrate, idle).
   Missing states can safely fall back to `run` or `idle`.
5. Use metadata fps and frame counts. Don't use the entire atlas as one image.
6. Align visual feet near sprite-local y=56 with ground at y=152; preserve existing hitbox.
7. Test on desktop and mobile; avoid altering score, Supabase, music, or gameplay.
8. Commit to GitHub only after previewing animations and checking no regressions.

This V02 pack is a technical sprite implementation with consistent frame cells, NOT
the final high-detail illustration. Please flag visual improvements after integration.
