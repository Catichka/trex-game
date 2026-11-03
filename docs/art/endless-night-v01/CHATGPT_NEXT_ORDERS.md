# Next orders for ChatGPT: T-Rex Run (Cat, 3 Nov)

Read `CHATGPT_STRICT_RULES.md` first. **One PNG per message, then stop and wait for Cat.** Do them in this order. Claude wires each one into the game and writes the JSON.

## Background: what changed
The game now has 6 worlds. Caverns (world 5) ends with the **Phantom Raptor** boss, and beating it opens world 6, **Endless Night**, the endless level. Claude made placeholder art for both (see `ref-endless-night-placeholder.png` and `ref-phantom-raptor-placeholder.png` in this inbox). Your job is the real art. Keep the layout of the placeholders, but make it beautiful.

Endless Night mood: calm and magical, "you made it out of the caves". Deep indigo night, stars, a big moon, moonlit teal-blue grass edges, a little glow-moss. Not scary.

## Endless Night parallax layers (tasks 1-7)
Every layer is **480 x 200 px**, PNG, and must **tile seamlessly left/right** (the right edge continues into the left edge), except the sky. Ground line is **y = 152**. Keep the top-left 100x30 px and the top-right 80x25 px calm, because the HUD sits there.

1. `endless-night-sky.png`: fully opaque. Night gradient (dithered bands, indigo at the top to violet at the horizon), scattered 1-px stars, a few 3-px twinkles, a big pale moon with craters around x 392, y 46 (about 34 px across). Does not scroll.
2. `endless-night-clouds.png`: transparent. 3-5 thin, long, violet cloud strands with a pale moonlit top edge, all above y 90.
3. `endless-night-far-hills.png`: transparent above the hills. Distant mountain silhouettes from about y 100 down to y 152, with one far volcano peak (with a faint cool ember at the crater). Dark blue-violet, with a lighter rim on the top edge.
4. `endless-night-mid.png`: transparent. A low rolling silhouette band (y ~136-152) with fern/palm-like prehistoric tree silhouettes and 2-3 rock spires, darker than the far hills, with a moonlit rim on the moon side.
5. `endless-night-near.png`: transparent. Only tiny grass-tip pixels on rows 150-151. Nothing taller than 3 px.
6. `endless-night-ground.png`: transparent above y 152, opaque from y 152 to 199. A bright moonlit teal grass edge on rows 152-153, darker teal on 154-155, then dark blue soil with a subtle checker/pebble texture and a few teal glow-moss specks.
7. `endless-night-foreground.png`: transparent. Only a few dark grass blade clumps touching the bottom edge (y >= 190). Nothing higher.

## Endless Night obstacles (tasks 8-9)
Transparent, exact size, sitting on the bottom row (that row is the ground). Same size as the size references in this inbox, because the hit boxes match them.

8. `moonstone-boulder.png`: **27 x 24 px**, bottom-centre at x 13, row 23. A big round dark-blue stone, moonlit on the upper left, with 2 small glowing teal runes. Solid and obviously "jump over me".
9. `night-stump.png`: **18 x 21 px**, bottom-centre at x 9, row 20. A dead tree stump (purple-grey bark, pale cut top) with 2-3 tiny glowing blue mushrooms on its sides.

## Phantom Raptor boss (task 10)
10. `phantom-raptor-sheet.png`: one sprite sheet, **480 x 300 px**, transparent, a grid of **80 x 60 px** frames (6 columns x 5 rows). Each frame: the raptor facing **LEFT** (it runs ahead of the T-Rex and looks back at it), feet on row 58 of the frame, about 70 px nose-to-tail and 50 px tall. Same character in every frame.
   - Row 1, `run`: 6 frames, a full running cycle.
   - Row 2, `telegraph`: 3 frames, crouching wind-up and a claw swipe (it throws an obstacle). Columns 4-6 empty.
   - Row 3, `cloak`: 4 frames, the raptor fading into a see-through ghostly version (dither the fade, no real alpha). Columns 5-6 empty.
   - Row 4, `stun`: 4 frames, dizzy, with stars circling its head. Columns 5-6 empty.
   - Row 5, `defeat`: 3 frames, knocked out and flopping over. Columns 4-6 empty.
   Look: spooky but cute. Purple body, teal belly, glowing yellow eye. It must still read clearly at this tiny size, and kids need to track its eye while it is cloaked.

Deliver each file to Cat for `Games/Trex folder/inbox`, never to GitHub.
