# Claude — Five Worlds Balanced V02 (playtest pack)

This is an **original layered pixel-art technical prototype**, not a faithful conversion of the detailed concept image. Please judge it in gameplay before adopting it as final art.

Copy `assets/environments/{grasslands,volcano,desert,swamp,caverns}/` into the repository, keeping each `environment.json` alongside its seven 480x200 PNG layers.

Mapping: Level 1 grasslands, Level 2 volcano, Level 3 desert, Level 4 swamp, Level 5 caverns.

Metadata fields: `viewport`, `ground_y`, `layers` (name, image, scroll_factor, repeat_x, width, height, offset_y). These match the earlier V04-style environment contract.

Important: retain original T-Rex, pterodactyl, caveman, obstacles, effects, collision boxes and roar. No art scaling. Ground remains y=152. Disable image smoothing. Sky static. All other layers wrap every 480 px. Draw all layers at their authored screen position (y=0).

QA: Test all 5 levels; compare object contrast at native 480x200; check seams, pivots, ground contact, and foreground draw order. Capture gameplay screenshots and report if scenery is too sparse or if background features compete with obstacles.

Art direction note: This pack is *intentionally simplified and more restrained* than the rich illustrated reference. It does not yet match that reference's complexity or polish; treat it as a functional evaluation, not final production approval.
