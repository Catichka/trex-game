# The T-Rex Game — Art Bible v0.2

## Creative direction
Modern indie pixel art blended with expressive retro-cartoon acting, with a playful classic-arcade / Wonder Boy energy. **T-Rex** is our friendly green protagonist: pale golden belly, coral-red back spikes, oversized head, expressive eyes, tiny arms, lively tail, and a mischievous grin. All character and hazard silhouettes must read at native gameplay size.

## Canonical world order (approved by Cat, 2026-10-18)
| Level | World | Palette and atmosphere | Readability guardrail |
|---|---|---|---|
| 1 | **Grasslands** | Sunny gold sky, warm rolling hills, fresh greens, sparse prehistoric plants | Background bushes must not share the same saturated dark-green silhouette as cactus hazards. |
| 2 | **Volcano** | Charcoal basalt, ember orange, hot red, smoky distant mountains | Bright lava and geysers are hazards; distant embers must not masquerade as attacks. |
| 3 | **Desert** | Warm sand and ochre, coral/sunset accents, muted distant mesas | Cacti and rocks require darker outlines and stronger foreground contrast than scenery. |
| 4 | **Swamp** | Olive/teal greens, dark moss, violet shadow accents, humid atmosphere | Mushroom, fern-log, log and stump bases must meet the ground line exactly. |
| 5 | **Caverns** (endless) | Deep indigo/blue-violet stone, turquoise/icy crystals, luminous accents | Decorative crystals in mid/parallax layers must be low-contrast, clearly distant and not appear as standing ground hazards. |

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

## Current art backlog
Tracked in issue #2:
- Grasslands bushes: distinguish from cactus green.
- Caverns mid-layer crystals: remove misleading obstacle-like silhouettes.
- Swamp mushroom and fern-log: correct apparent 1px float while preserving contract/pivots.
- Grasslands rock highlights/outlines and cactus-small barrel-cactus distinction.
- RAWR art polish after M2 design decisions.

## Status
Current production art is integrated on `main` after PR #1, including V03 chaseables and T-Rex V04 rawr. Earlier `character_trex_v1` prototype notes are historical and no longer describe the shipped character.
