# Correct title artwork: T-Rex Run!

Catherine spotted that the title artwork says THE T-REX GAME, although the browser title and installed-app manifest already say T-Rex Run! This follow-up corrects the illustrated logo to T-REX RUN!, in matching gold pixel lettering.

## Deliverable and scope

`title-screen-trex-run.png` is the full-resolution 1942×809 replacement artwork. It was assembled from the original production title image with a locally edited title panel only, at rectangle [290,0,880,330]. Every pixel outside that rectangle was verified identical to the current source image (production blob 6760c20adf934e0db09e2a04e753e515a6be1458). Characters, tutorial panel, buttons and world list are unchanged. This is a reviewable art handoff, not a production deployment.

Claude: replace `assets/ui/title-screen.png` with this image. Keep full dimensions and existing button hit areas. Change `titleArt` alt text in index.html from "The T-Rex Game: press start" to "T-Rex Run!: press start". Browser title and manifest are already T-Rex Run!; preserve those. Update the service-worker cache as needed. Show a real browser title-screen screenshot and check button alignment, image load and phone readability. Do not change any gameplay/biome/volcano content.

## Art method

Built-in image generation edited a crop of the original plaque. Prompt: change only THE T-REX GAME to T-REX RUN! in two lines, matching gold/orange extruded pixel lettering; preserve mossy stone plaque, surroundings and 5 WORLDS + ENDLESS subtitle. Edited crop normalized to 880×330 using nearest-neighbour and composited at [290,0]. Original full image remains the production source until integration.
