# T-Rex Run! — Art Bible v0.3 (production update 2026-10-22)

## Creative direction
Modern indie pixel art blended with expressive retro-cartoon acting, with a playful classic-arcade / Wonder Boy energy. **T-Rex** is our friendly green protagonist: pale golden belly, coral-red back spikes, oversized head, expressive eyes, tiny arms, lively tail, and a mischievous grin. All character and hazard silhouettes must read at native gameplay size.

## Canonical world order (approved by Cat, 2026-10-18)
| Level | World | Palette and atmosphere | Readability guardrail |
|---|---|---|---|
| 1 | **Grasslands** | Sunny gold sky, warm rolling hills, fresh greens, sparse prehistoric plants | Fallen-tree hazards (not cacti) must stand out from bushes and ground decoration. Small rocks and little logs are harmless; don't draw them like lethal obstacles. |
| 2 | **Volcano** | Charcoal basalt, ember orange, hot red, smoky distant mountains | Bright lava and geysers are hazards; distant embers must not masquerade as attacks. |
| 3 | **Desert** | Warm sand and ochre, coral/sunset accents, muted distant mesas | Cacti and the distinct sandstone slab/butte hazards require darker outlines and stronger foreground contrast than scenery. |
| 4 | **Swamp** | Olive/teal greens, dark moss, violet shadow accents, humid atmosphere | Swamp root replaces the generic log; mushroom, fern-log, stump and root must read as grounded, distinct hazards. |
| 5 | **Caverns** (endless) | Deep indigo/blue-violet stone, turquoise/icy crystals, luminous accents | Distinguish lethal stalagmite and amethyst outcrop from decorative crystals in parallax layers; decoration must not appear to stand on the playable ground. |

The older **Forest**, **Ice**, and generic **Endless** palette entries are retired. Ice-shard obstacle art is repurposed as **Caverns crystals**, not an ice world. The snowball is currently unused.

## Canvas, drawing and asset contracts
- Logical canvas **480 × 200**; walking surface **y = 152**.
- **1 art pixel = 1 canvas pixel**. Do not pre-scale assets. Use integer pixel positions and nearest-neighbour rendering; no smoothing, antialiasing, rotation or tinting of sprites.
- Transparent **PNG-32 RGBA** with hard pixel edges; preserve alpha.
- Sprite dimensions, pivots, frame counts, animation keys, and atlas layout are defined by **[`docs/ASSET_SPEC.md`](../ASSET_SPEC.md)**. This file controls the contract; do not rely on early prototype numbers.
- T-Rex atlas: **64 × 64** cells, pivot **[35, 56]**; grounded feet at frame row 55. Existing animations: idle, run, jump, fall, land, hurt, eat, celebrate, rawr.
- Pterodactyl: **32 × 32**, pivot [18, 23]. Caveman: **32 × 32**, pivot [16, 30]. Small dino: **24 × 24**, pivot [12, 23]. Stegosaurus: **48 × 32**, pivot [24, 31].
- Character colour separation matters: green T-Rex, warm ochre/teal stegosaurus, and a distinguishable small dino; never rely solely on hue to distinguish a hazard from scenery.
- Backgrounds: seven independent, seamlessly tileable **480 × 200** layers per world: sky, clouds, far, mid, near, ground, foreground. Respect the actual layer metadata in each `environment.json`. Keep near/foreground scenery low enough not to obscure hazards.

## Animation direction
Exaggerated but readable silhouettes, clear near/far leg separation, grounded foot contact, anticipation before action, and one strong readable pose per beat. Panic should differ visibly from running at 1×. Keep capture reactions playful rather than gruesome.

The existing T-Rex `rawr` animation is four frames at 10 fps in row 8 (y = 512). Its next art revision should make the jaw open more, toss the head subtly, squash/stretch the body without moving grounded feet, and keep any sparkle inside the frame. **Do not alter other animation rows or pivots.** Final art waits for the M2 gameplay spec and M3 prototype feedback.

## Visual gameplay rules
- Gameplay objects have darker outlines and greater local contrast than parallax decorations.
- Never depict a background plant or crystal as an obstacle at the same apparent height, edge contrast and ground position.
- Telegraphs must remain legible at 1×; boss invisibility cannot remove all attack cues.
- Test artwork in motion against the actual world backgrounds, not just on a neutral preview.

## Production workflow
1. Check latest `main`, open PRs, and [`docs/COLLABORATION.md`](../COLLABORATION.md) once merged.
2. Make art on an `art/<topic>` branch; submit PNG+JSON assets with previews and a short `CLAUDE_HANDOFF.md`.
3. Claude checks the assets at 480×200 and 3×, validates pivots, transparency, animations and collision fit.
4. Cat approves; merge only after review. No ZIP handoffs or direct commits to `main`.

## Production changes already integrated (checked 2026-10-22)
- **Official title:** **T-Rex Run!** The title-screen plaque, browser title and app manifest are aligned (PR #56, merged 2026-10-21). Do not revive the old "The T-Rex Game" wording in new art.
- **Grasslands:** two fallen-tree obstacles replace cacti (PR #52). After Cat's phone playtest they were reduced to **2/3 size** (PR #54): plain trunk **36×16 px**, branched trunk **36×26 px**. They remain lethal and must be jumped. Small rocks and little logs are harmless; avoid giving them the same visual urgency as hazards.
- **Desert:** sandstone slab and sandstone butte replace shared grey-rock hazards, while both cactus types remain (PR #52).
- **Swamp:** the new root replaces the generic log; existing mushrooms, fern logs and stumps remain (PR #52).
- **Caverns:** a purple stalagmite replaces the stump, and an amethyst outcrop replaces the large grey rock (PR #52). Cat explicitly approved the purple stalagmite silhouette; **do not redesign it**.
- **Volcano:** Cat explicitly requested **no changes** to this biome while the other worlds' duplicates were being replaced. Preserve the approved Volcano art and its existing obstacle identity.
- **Game-over screen:** a four-frame seated, dizzy T-Rex is already integrated (PR #46). The sprite uses **76×100 cells**, 6 fps, pivot **[38,97]**; this is a deliberate exception to the base 64×64 character contract. Do not re-create the old placeholder hurt pose.

## Current art QA priorities
Tracked historically in issue #2, but its original checklist is stale; compare with merged PRs above before taking work.
1. **1× and phone readability:** confirm lethal fallen trunks remain clearly legible against grass and near/foreground foliage; decorative harmless rocks/logs should not look more dangerous than the trees.
2. **Desert:** ensure the new sandstone obstacles stand out from the sandy ground and each other at speed, without recolouring them to the shared grey-rock look.
3. **Swamp/Caverns:** inspect root, mushrooms and crystals for apparent floating bases or parallax decoration mistaken for hazards. Preserve the approved stalagmite shape.
4. **T-Rex consistency:** use the current in-game atlas as the reference for all future promotional/celebration sprites. The seated dizzy sprite is approved; no redraw without feedback.
5. **RAWR:** keep the current animation unless an explicit gameplay/visual review identifies a change. Never move the feet or other atlas rows for cosmetic polish.

## Status