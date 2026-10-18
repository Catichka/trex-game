# Claude Code integration — Caveman V01

1. Extract and copy `assets/characters/caveman/` into the project.
2. Load `caveman_atlas.png` and `caveman_atlas.json`. The atlas is 384×336 with 48×48 cells; use frame rectangles from JSON.
3. Disable canvas image smoothing for crisp pixels.
4. Map existing caveman states to run/idle/jump/hurt/caught/defeated/respawn, using run as fallback.
5. The character is 48×48 versus T-Rex 64×64 and pterodactyl 32×32. Keep the existing collision boxes; do not use the full transparent sprite cell as a hitbox.
6. Align the visual feet around local y=45 to ground, then test running, catching and camera scroll.
7. Cartoon caught/defeated animation: no gore. Ensure score/events fire only once.
8. Test on mobile and desktop; commit to GitHub after verifying.

Note: this pack is an integration prototype, not final illustrated art.
