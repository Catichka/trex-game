# Approved smaller grasslands logs — follow-up to #52

Catherine playtested #52 on a phone and found the 54px-wide logs absurdly big. She approved the attached one-third-smaller renderer preview: "thats a lot better". Integrate this size adjustment only.

## Approved visual target

- Plain fallen trunk: rendered **36×16**, formerly 54×24.
- Branch trunk: rendered **36×26**, formerly 54×39.
- Same artwork, reduced to **2/3 of original linear size** with nearest-neighbour rendering.
- Keep T-Rex, big rock, original small log, scenery and all other sprites unchanged.

The two JSON files here are candidate production sidecars with `scale: 0.6666666666666666`. Copy their scale into `assets/obstacles/` when implementing the matching physics. Existing source PNGs remain unchanged; do not scale both the PNG and metadata. The preview used the existing Assets.drawSprite scale handling, matching-size logical boxes and current character/background assets. It is a staged renderer preview, not an integrated browser playtest. Native and 3× images are included.

## Collision integration is required at the same time

1. Update OBJ.fT to 36×16 and OBJ.fB to 36×26. Update the branch's solid-part rectangles proportionally (roughly trunk [0,13,36,13], branch [14,0,12,15]); inspect alignment and leave empty upper corners open.
2. Do not leave the old 54px-wide collision boxes behind.
3. **Both tree variants must still require jumping.** The ordinary small log and small rock stay harmless in grasslands. A naive proportional resize is insufficient: checkCollisions currently shrinks both the player's box and obstacle boxes by a 5px margin, so the shortened 16px trunk can stop overlapping the standing player altogether. Use an appropriate tree-only collision treatment/margin, keeping solid areas inside the visible wood and keeping other obstacles/biomes unchanged.
4. Test running into each tree without jumping causes death; single jumps and double jumps can clear each; no collision occurs in the branch's empty corners. Preserve the fair gap/no paired trees behavior from #52.
5. Preserve other biome props and rules. **Do not change volcano.**

Please supply an actual browser screenshot at phone scale, including hitboxes for review, and report the running/jumping checks. This PR only supplies preview/spec/candidate metadata; production scale and physics are intentionally left for Claude to change together.
