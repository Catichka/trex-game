# Environmental gags — round two (scenery only)

All gags are non-colliding, never obscure a hazard silhouette, never change difficulty, and can be disabled independently. Trigger at most one every 20–35 seconds, only with >=1 second of readable runway. Prefer existing characters and particles.

| World / location | Moment | Trigger | Art needed |
|---|---|---|---|
| Grasslands | **Caveman hide-and-peek.** A caveman peeks from behind a bush, freezes on seeing T-Rex, then ducks. RAWR makes him drop his club and disappear into the foliage. | Random scenery event after 15s; RAWR while bush is visible switches to startled pose. | Reuse existing caveman and bush; optional 2-frame peeking face / dropped club overlay. |
| Desert | **Confused tumbleweed.** A tumbleweed rolls opposite the scroll, stops as if reconsidering, then reverses. A tiny lizard watches it go. | Random scenery event after 20s, away from real obstacles. | 3–4-frame tumbleweed spin; lizard can be a static 8×8 pixel doodle. |
| Volcano / lava world (if present) | **Volcano smoke-ring hiccup.** Distant volcano emits two tiny puffs, then a perfect smoke ring that drifts up and breaks into a heart for an instant. | Rare background event after 25s; purely visual, no hitbox or screen shake. | Reuse existing volcano; 4–6 smoke particle frames / procedural ring. |
| Swamp or Caverns | **Firefly orchestra.** Existing fireflies arrange briefly into three musical-note silhouettes; a RAWR scatters them chaotically before they reform. | Random event when >=6 fireflies visible; RAWR triggers scatter and cancels formation. | No new sprite required; reuse existing firefly particles and positional choreography. |

Implementation: map biome aliases to actual world IDs; do not add a new world. Use seeded spawn selection for QA. Ensure a gag never consumes BITE input, changes enemy AI, or introduces a collision. Respect reduced-motion settings (static pose or skip). Keep Grasslands V4 music unchanged; any audio embellishment should be an optional short SFX, not a soundtrack edit.
