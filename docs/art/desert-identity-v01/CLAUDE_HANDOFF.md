# Approved desert sandstone — Claude integration

Catherine approved this game-scale preview on 19 October 2026: "Thats perfect! (and sandstone is one of my fav rocks)". This is the desert step in our biome identity work, following the grasslands fallen-tree handoff in PR #49.

## Scope and protected content

**DO NOT CHANGE VOLCANO.** Integrate these assets in DESERT ONLY. Preserve the independently approved grasslands work, including its fallen trees and grasslands-only harmless small props. Leave swamp and caverns unchanged. Keep the actual T-Rex, existing desert background, cactus sprites and cactus behavior.

## Production sprites

| PNG + matching JSON under assets/obstacles/ | Frame | Pivot | Replaces in desert only |
| --- | --- | --- | --- |
| sandstone-slab | 15×12 | [7,11] | rock-small (`rS`) |
| sandstone-butte | 27×24 | [13,23] | rock-large (`rL`) |

Transparent single-frame `idle`, ground line y=152, nearest-neighbour rendering at native size. Register the sprites in the manifest and loader. Prefer new obstacle IDs in the desert pool or a desert-specific visual mapping; do not globally replace the rock sprites shared by other levels.

Both frame dimensions and pivots match the original rock counterparts. Preserve desert collision behavior and spawn weights/gaps. Catherine's harmless-small-prop request was scoped to grasslands; this approval does not add harmless sandstone in desert. Keep the distinction explicit in shared code.

## Exact approved visual

`desert-sandstone-480x200.png` and its 3× enlargement show the new sandstone slab and butte alongside the existing small/large cactus, actual T-Rex and desert layers. These are staged asset-review scenes using current game draw functions and loaded sprites in Node canvas; HUD fonts can differ slightly from the browser. Positions are for comparison, not requested random spawn spacing. Gameplay integration is not included in this asset-only PR.

## Checks for integration

Verify both sprites load without fallback; their bases touch y=152; desert uses the new sandstone and retains cactus; original rock behavior and gaps are preserved; grasslands integration is preserved; volcano/swamp/caverns are unaffected. Provide a real browser gameplay screenshot and report checks in the integration PR.
