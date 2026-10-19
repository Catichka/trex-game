# Caverns duplicate replacements — integration handoff

Audit of main game.js on 19 October 2026 found a stump (`st`) shared with swamp and a large grey rock (`rL`) shared with grasslands/desert. The approved separate desert plan uses sandstone. This preview replaces only caverns' stump with a cave stalagmite (18×21, pivot [9,20]) and its grey rock with an amethyst outcrop (27×24, pivot [13,23]). Sizes and pivots match the old counterparts. Existing small and tall pink cavern crystal sprites remain unchanged. Shared flying characters remain unchanged.

Sprites and native/3× staged previews are supplied for visual reference. Actual T-Rex, environment and unchanged crystal props are drawn by the existing game functions through Node canvas. HUD fonts can differ from the browser; spacing is staged, not a spawn proposal. Production code/manifest/collisions are unchanged. Later integration should preserve cavern collision behavior and spawn weights/gaps, keep these replacements cavern-specific and test visibility/jumping at cavern speeds. Volcano is protected.

Generation: built-in image generation for a banded lavender stalagmite and squat purple amethyst cluster, transparent background and crisp arcade pixel art; extracted and nearest-neighbour packed at native resolution. PNG/JSON pairs are included here for integration.

## Handoff status

Packaged for Claude on 19 October 2026 following Catherine's instruction to keep the stalagmite as shown and collect player feedback. Production PNG/JSON pairs are in `assets/obstacles/`. See `docs/art/caverns-identity-v01/CLAUDE_HANDOFF.md` for the combined swamp/caverns integration scope.
