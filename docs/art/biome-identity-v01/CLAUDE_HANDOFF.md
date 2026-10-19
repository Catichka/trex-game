# Approved grasslands fallen trees — Claude integration

Catherine approved the actual-scale renderer preview on 19 October 2026 and requested this handoff. This is an asset-only PR; Claude owns gameplay integration.

## Hard scope

**DO NOT CHANGE THE VOLCANO LEVEL.** Preserve its assets, theme, obstacle pools, encounters, collision behavior and tuning. Keep this integration confined to grasslands; do not change desert, swamp or caverns behavior. Shared collision functions must retain the current behavior outside grasslands.

## Production assets

| PNG + matching JSON under assets/obstacles/ | Native frame | Anchor/pivot |
| --- | --- | --- |
| fallen-trunk | 54×24 | [27,23] |
| fallen-trunk-branch | 54×39 | [27,38] |

One transparent frame each, animation `idle`. Use native size, nearest-neighbour drawing, ground line y=152, and existing `Assets.drawSprite` anchor semantics. Do not regenerate, enlarge or redraw approved art. Existing T-Rex and grasslands layers stay as they are.

## Requested behavior

1. Register the two new sprites in the production manifest and loader/mapping.
2. Replace grasslands cactus entries with these fallen-tree variants. Retain cactus assets and desert spawning.
3. In GRASSLANDS ONLY, small rocks (`rS`) and the ordinary little log (`gl`) are harmless walk-over scenery. Keep them visible and make sure they do not kill or block T-Rex.
4. Large rocks (`rL`) and both new fallen-tree variants remain jump-required ground obstacles.
5. Give the new trunks sensible collision shapes matching their visible solid wood. Do not reuse the narrow cactus boxes: the trunks are 54 pixels wide. Avoid treating the tall branch's empty upper corners as solid if practicable.
6. Preserve fair gaps and verify a normal jump/double jump can clear both trunks at grasslands speed, including landing clearance. The approved art changes widths, so this needs an explicit gameplay check.

## Preview and verification

`grasslands-fallen-trees-480x200.png` is the native staged art preview; `grasslands-fallen-trees-3x.png` is its nearest-neighbour enlargement. These were drawn using current game functions and the actual T-Rex/background assets in a Node canvas runtime. HUD fonts may differ slightly from the browser. The chosen positions are an asset showcase, not an example of random spawn spacing. The preview does not implement collisions or spawning.

Please verify: sprite loading without fallbacks; bases align to ground; small rock/log traversal is harmless; big rock/new trunks cause collision when running into them and can be jumped; desert cactus behavior is unchanged; volcano behavior is unchanged. Supply a browser gameplay screenshot and describe checks in the integration PR.
