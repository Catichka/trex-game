# T-Rex short BITE animation — sprite implementation brief
**Status:** art production needed; this is not a completed atlas change.

Target: existing `trex_atlas` 64×64 cell grid, pivot `[35,56]`. Reuse the current T-Rex palette, silhouette, line thickness and facing. One animation works on ground and in air.

| Frame | Duration | Pose |
|---|---:|---|
| 0 | 0.045s | anticipation: head leans forward, upper jaw starts lifting |
| 1 | 0.065s | maximum gape: unmistakable upper/lower jaws and visible teeth |
| 2 | 0.055s | snap: jaws fully closed, head lunges ~2px forward |
| 3 | 0.045s | recover to normal head position, feet and body align with original pose |

Total **0.210s**, inside 0.23s attack window. Hold active bite hitbox only during the intended attack interval, not the longer existing eat follow-through. Use nearest-neighbour sampling, no interpolation. Keep all four feet/torso positions compatible with airborne playback. No sprite should shift its pivot: `[35,56]` is constant across cells.

**Gameplay:** BITE button starts attack even when no enemy is nearby; passive collisions never consume enemies. On successful hit, transition to the existing longer eat row. On miss, return to run/jump state after frame 3. RAWR remains a separate hold action. Input priority must avoid cancelling jump physics.

**Claude integration checklist:** identify atlas file and animation metadata, allocate four unused consecutive 64×64 cells without overwriting existing art, draw four matching T-Rex frames, register a `bite` animation with exact per-frame durations, verify both ground and mid-jump, and test hitbox overlap against pterodactyls, dinos and cavemen. The atlas itself is NOT supplied by this design-only PR.
