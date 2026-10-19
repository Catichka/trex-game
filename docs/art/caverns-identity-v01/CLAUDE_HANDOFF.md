# Remaining biome duplicate replacements — Claude handoff

## Intent and approval

Catherine asked to change the other biomes ONLY where objects were duplicated. We audited the ground-obstacle pools in main/game.js on 19 October 2026. After seeing the native-scale renderer previews, she chose to keep the purple stalagmite exactly as shown and see what feedback players give. Do not redesign its swirled silhouette before that feedback.

This completes the ground-obstacle identity proposal following grasslands PR #49 and desert PR #50. Integration remains Claude's responsibility. This is an asset-only handoff, not a gameplay implementation.

## Only these replacements

| Biome | Existing shared object | Replacement asset under assets/obstacles/ | Frame | Pivot |
| --- | --- | --- | --- | --- |
| Swamp | ordinary log `gl`, also used in grasslands | swamp-root.png + .json | 27×9 | [13,8] |
| Caverns | stump `st`, also used in swamp | cave-stalagmite.png + .json | 18×21 | [9,20] |
| Caverns | large grey rock `rL`, shared with grasslands/desert | amethyst-outcrop.png + .json | 27×24 | [13,23] |

All are transparent single-frame `idle` sprites, native scale, nearest-neighbour rendering. Ground line y=152. Dimensions/pivots match the previous sprite counterparts. Add entries in the manifest and sprite loader; use new obstacle IDs or biome-specific mappings, not a global replacement of shared originals. Preserve existing collision rules and spawn weights/gaps. Small props being harmless was a GRASSLANDS-ONLY decision in PR #49; do not extend it into swamp or caverns through shared code.

## Keep the rest

- Swamp: keep the current mushroom, fern-log, stump and all background layers.
- Caverns: keep current small and tall crystal sprites (iS/iT) and all background layers. The `ice-shard-*` filenames refer to these existing cavern sprites; their names are not a request to redesign them.
- Shared flying characters, prey, encounters and bosses remain unchanged.
- Preserve separate approved grasslands/desert work. **Both cactus sizes remain in DESERT.**
- **DO NOT CHANGE VOLCANO:** assets, obstacle pools, encounters, collisions or tuning.

## Preview and verification

Previews are in `docs/art/swamp-identity-v01/` and `docs/art/caverns-identity-v01/`, each at native 480×200 and 3×. They were rendered with actual existing game draw functions/T-Rex/environment assets plus these exact new sprites in a Node canvas runtime. HUD fonts can differ slightly from a browser. Positions are staged to show the art, not a spawn-spacing specification.

Verified PNG dimensions/transparency against metadata and reviewed all three at game scale. Claude: verify manifest loading/no fallbacks, ground anchors, original collision behavior, jump clearance at these levels' speeds, unchanged spawn weights/gaps, preservation of existing unique props and no volcano changes. Show actual browser screenshots after integration. Keep the stalagmite art unchanged for player feedback.
