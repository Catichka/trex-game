# Claude Code — pterodactyl integration

1. Extract this pack and copy `assets/characters/pterodactyl/` into the game.
2. Load `pterodactyl_atlas.png` and `pterodactyl_atlas.json` as external assets.
3. Render 32×32 sprite frames with image smoothing disabled; do not resize to T-Rex's 64×64.
4. Animate `fly` while moving horizontally, `glide` when coasting, `dive` for downward attack/movement, `hurt` on impact and `eaten` on capture.
5. T-Rex should eat the pterodactyl only when its **mouth attack area** overlaps the prey, rather than treating any full-body collision as a successful bite. The exact attack area should be tuned to the game's existing T-Rex hitbox and gameplay.
6. On successful capture, freeze/remove the prey collider immediately, play `eaten` once, award points once, and play T-Rex's `eat` animation. No repeated score events.
7. Add optional small feather particles after capture (the `eaten` sequence already includes a few).
8. Check rendering, timing and collisions on mobile and desktop; preserve Claude's level and physics code. Commit after tests.

The artwork is a functional small sprite implementation. Please flag any design or gameplay adjustments after testing.
