# Swamp duplicate replacement — integration handoff

Audit of main game.js on 19 October 2026 found the ordinary log (`gl`) shared between grasslands and swamp. This preview replaces only swamp's copy with a mossy tangled root, 27×9, pivot [13,8], matching the original log frame/pivot. Swamp mushroom, fern-log and stump remain unchanged. The stump is reserved for swamp by separately replacing the cavern copy.

Sprites and native/3× staged previews are supplied for visual reference. Actual T-Rex, environment and unchanged props are drawn by the existing game functions through Node canvas. HUD fonts can differ from the browser; spacing is staged, not a spawn proposal. Production code/manifest/collisions are unchanged. Any later integration should retain swamp collision behavior, spawn weights and gaps, including treating the root's small holes consistently with the original low obstacle. No grasslands harmless-prop behavior is implied here. Volcano is protected.

Generation: built-in image generation for a single low tangled root with moss and teal slime, transparent background and crisp arcade pixel art; extracted and nearest-neighbour packed at native resolution. PNG/JSON `swamp-root` included here for integration.

## Handoff status

Packaged for Claude on 19 October 2026 following Catherine's instruction to keep the stalagmite as shown and collect player feedback. Production PNG/JSON pairs are in `assets/obstacles/`. See `docs/art/caverns-identity-v01/CLAUDE_HANDOFF.md` for the combined swamp/caverns integration scope.
