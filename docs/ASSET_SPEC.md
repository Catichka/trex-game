# T-Rex Game — Asset Spec (engine contract)

This is what the engine expects from art files: paths, names, frame layout
and metadata. It's the technical half of the pipeline; the **Art Bible**
(style, palettes, proportions) owns everything about how the art looks.
If the two disagree, raise it in an issue or PR and we'll update whichever
is wrong.

Ownership: art files under `assets/` are made by the art team (ChatGPT) on
their own branches and PRs. The engine (Claude) only reads them. Gameplay
values such as hitboxes, speeds and spawn rates live in code, not in asset
files.

---

## 1. Basics

| Thing | Value |
|---|---|
| Canvas | **480 × 200** logical pixels, scaled up with nearest-neighbour |
| Pixel ratio | **1 art pixel = 1 canvas pixel.** Don't pre-scale. |
| Ground line | Walking surface is at **y = 152** (48 px of ground below it) |
| Format | **PNG-32 (RGBA)** with real transparency. No matte, no background colour. |
| Edges | Hard pixel edges, no anti-aliasing or soft shadows on sprite outlines |
| Frame rate | Game runs at 60 ticks/s; animation `fps` is per animation |
| Names | lowercase, hyphenated: `small-dino`, `rock-large` |

## 2. How the engine finds assets

1. Put the files at the paths below.
2. Add the asset's **id** to `assets/manifest.json`:

```json
{
  "sprites": ["trex", "pterodactyl", "rock-small"],
  "environments": ["grasslands"]
}
```

Only listed ids get loaded. Anything not listed, missing, or broken falls
back to the current placeholder graphics, so assets can arrive one at a
time and the game always runs.

## 3. Sprite sheets (characters, obstacles, fx)

Each sprite is a **PNG + JSON sidecar** with the same base name:

```
assets/characters/trex/trex.png
assets/characters/trex/trex.json
```

**Layout:** every frame in a sheet is the same size. **One row per
animation**, frames left to right, starting at column 0. Unused cells stay
transparent. Rows may have different frame counts; the sheet is as wide as
the longest row.

**Sidecar JSON:** everything is optional. Anything you leave out uses the
defaults in the tables below, so `{}` is valid for a sheet that follows them
exactly.

```json
{
  "frameWidth": 48,
  "frameHeight": 48,
  "anchor": [22, 47],
  "animations": {
    "run":  { "row": 1, "frames": 6, "fps": 12 },
    "bite": { "row": 4, "frames": 4, "fps": 20, "loop": false }
  }
}
```

| Field | Meaning |
|---|---|
| `frameWidth`, `frameHeight` | Size of one frame in px |
| `anchor` | `[x, y]` pixel inside a frame that the engine pins to the **bottom-centre of the character's hitbox**, which is where its feet touch the ground. Default is the bottom-centre of the frame. Use it when the body isn't centred, for example when a long tail sticks out behind. |
| `animations.<name>.row` | Row index (0 = top) |
| `animations.<name>.frames` | Number of frames in that row |
| `animations.<name>.fps` | Playback speed |
| `animations.<name>.loop` | `false` for one-shots (they hold the last frame) |
| `scale` | Integer upscale. Leave at 1 unless agreed otherwise. |

The atlas format ChatGPT delivered also works as-is: `"frame_size": [w, h]`
instead of `frameWidth`/`frameHeight`, per-animation `"rects": [[x, y, w, h], …]`
(used in place of row/column maths when present), and `"pivot": [x, y]` as
a synonym for `anchor`. Unknown keys are ignored. Default animations whose
row lies outside the image are dropped, so they fall back instead of
drawing an empty cell.

Keep the anchor in the **same spot on every frame**. Don't let the feet
drift between frames, or the character will jitter.

Missing animations are fine: the engine substitutes a sensible one (for
example `fall` → `jump` → `run`) until the real one exists.

### 3.1 Characters

Default frame layout. Rows in this order; fps values are the defaults.

**T-Rex**: `assets/characters/trex/trex_atlas.png` + `trex_atlas.json`, id `trex`. Frame **64 × 64** (Art Bible), faces **right**. Engine anchor `[35, 58]`: row 58 is the ground line under the feet, and x 35 puts the torso over the gameplay hitbox, with the tail hanging back. Keep feet on row 58 in every grounded frame.

Rows 0–4 are delivered (prototype v1). Rows 5–7 are still wanted. Until they exist, the engine falls back as noted.

| Row | Animation | Frames | fps | Loop | Used when | Status |
|---|---|---|---|---|---|---|
| 0 | `idle` | 4 | 5 | yes | title screen, level complete | ✅ v1 |
| 1 | `run` | 8 | 12 | yes | on the ground | ✅ v1 |
| 2 | `jump` | 4 | 8 | no | rising | ✅ v1 |
| 3 | `fall` | 4 | 8 | no | falling | ✅ v1 |
| 4 | `land` | 4 | 10 | no | touching down, then back to `run` | ✅ v1 |
| 5 | `bite` | 4 | 20 | no | chomping a pterodactyl mid-air (about 14 ticks) | wanted (shows `run` for now) |
| 6 | `rawr` | 4 | 10 | yes | roaring (0.5 to 0.8 s); the speech bubble is drawn by the engine | wanted (shows `idle`) |
| 7 | `hurt` | 4 | 8 | no | game over | wanted (shows `idle`) |

**Pterodactyl**: `assets/characters/pterodactyl/pterodactyl.png`, id `pterodactyl`. Frame **48 × 32**, faces **left** (it flies toward the T-Rex). Default anchor `[24, 24]` because it flies, so the anchor is the body centre-ish, not feet.

| Row | Animation | Frames | fps | Loop | Used when |
|---|---|---|---|---|---|
| 0 | `fly` | 4 | 10 | yes | default |
| 1 | `attack` | 4 | 12 | yes | within about 110 px of the T-Rex |
| 2 | `frightened` | 4 | 14 | yes | scared off by a big RAWR, flying away up |
| 3 | `eaten` | 6 | 12 | no | bitten; plays where it was caught |

**Caveman**: `assets/characters/caveman/caveman.png`, id `caveman`. Frame **32 × 32**, faces **right** (running away from the T-Rex).

| Row | Animation | Frames | fps | Loop | Used when |
|---|---|---|---|---|---|
| 0 | `run` | 6 | 12 | yes | default |
| 1 | `panic` | 6 | 16 | yes | after a RAWR |
| 2 | `jump` | 2 | 8 | yes | hopping over obstacles |
| 3 | `stumble` | 4 | 12 | no | landing from a jump |
| 4 | `caught` | 6 | 12 | no | caught by the T-Rex |

**Small dino**: `assets/characters/small-dino/small-dino.png`, id `small-dino`. Frame **24 × 24**, faces **right**. Rows: `run` (4), `panic` (4), `caught` (6, one-shot).

**Stegosaurus**: `assets/characters/stegosaurus/stegosaurus.png`, id `stegosaurus`. Frame **48 × 32**, faces **right**. Rows: `run` (4, 8 fps), `panic` (4), `caught` (6, one-shot).

### 3.2 Obstacles

`assets/obstacles/<id>.png` (+ `<id>.json`). Single row. One frame is fine
(static); more frames animate as `idle` (set `"animations": {"idle": {"row":0,"frames":4,"fps":8}}`).
If `frameWidth`/`frameHeight` are omitted, a frame is the image width
divided by the frame count by the full image height. Obstacles sit on the
ground with their bottom-centre on the hitbox's bottom-centre.

Current hitbox sizes (w × h px), so the silhouette reads fairly. Art can be
a little bigger; we'll tune hitboxes after art lands.

| id | World | Hitbox | | id | World | Hitbox |
|---|---|---|---|---|---|---|
| `rock-small` | 1, 2 | 15 × 12 | | `ice-shard-small` | 3 | 15 × 15 |
| `rock-large` | 1, 2 | 21 × 15 | | `ice-shard-tall` | 3, 5 | 15 × 24 |
| `log` | 1 | 27 × 9 | | `snowball` | 3 | 18 × 18 |
| `cactus-small` | 1, 5 | 12 × 21 | | `lava-rock-small` | 4 | 15 × 15 |
| `cactus-large` | 1 | 18 × 27 | | `lava-rock-large` | 4 | 21 × 21 |
| `mushroom` | 2 | 18 × 21 | | `fire-geyser` | 4, 5 | 18 × 24 |
| `stump` | 5 | 18 × 21 | | `fern-log` | (unused) | 24 × 21 |

New obstacle types (boulders and so on) are welcome. Open the PR with the art and
the engine side will add the id and gameplay.

### 3.3 Effects (optional)

`assets/fx/<name>.png`, single row, one-shot animation named `play`
(default 6 frames at 20 fps). Drawn centred on the bottom of the event.

| id | When |
|---|---|
| `fx-dust` (`assets/fx/dust.png`) | T-Rex lands |
| `fx-chomp` (`assets/fx/chomp.png`) | T-Rex bites a pterodactyl |
| `fx-catch` (`assets/fx/catch.png`) | T-Rex catches a caveman or dino |

## 4. Environments (parallax backgrounds)

One folder per world, with an `environment.json` and layer PNGs:

```
assets/environments/grasslands/
  environment.json
  sky.png  clouds.png  far.png  mid.png  near.png  ground.png  foreground.png
```

World ids: `grasslands` (L1), `forest` (L2), `ice` (L3), `volcano` (L4), `endless` (L5).

**Layer images are 200 px tall** (the full canvas height) with
transparency, so you paint each layer in place on a 480 × 200 frame and
nothing needs positioning. Width is free but each layer must **tile
seamlessly left to right**. 480 px or a divisor of it (240, 160, 120…) is
easiest; wider layers repeat less.

`environment.json` lists layers back to front:

```json
{
  "layers": [
    { "file": "sky.png",        "speed": 0 },
    { "file": "clouds.png",     "speed": 0.08, "drift": 0.1 },
    { "file": "far.png",        "speed": 0.12 },
    { "file": "mid.png",        "speed": 0.25 },
    { "file": "near.png",       "speed": 0.5 },
    { "file": "ground.png",     "speed": 1, "ground": true },
    { "file": "foreground.png", "speed": 1.4, "z": "front" }
  ]
}
```

| Field | Meaning |
|---|---|
| `file` | PNG in the same folder |
| `speed` | Scroll speed relative to the ground (0 = fixed, 1 = moves with the ground and obstacles) |
| `drift` | Extra px per tick of movement on its own, for example clouds |
| `y` | Vertical offset (default 0); only needed for layers shorter than 200 px |
| `z` | `"back"` (default, behind characters) or `"front"` (in front of them; keep it sparse and low so it never hides obstacles) |
| `ground` | `true` on the terrain layer. Its walking surface must be at **y = 152**. When present, the engine stops drawing its placeholder ground. |

Any layer can be left out. Without an `environment.json` the default list
above is assumed. Keep the area from about y 100 to 152 (where obstacles and
pterodactyls appear) low-contrast so gameplay objects read clearly.

## 5. Checking your art

Serve the repo folder over HTTP (`python3 -m http.server`, then open
`http://localhost:8000`). Browsers won't load the JSON from `file://`.

- `?debug` draws hitboxes (magenta T-Rex, red obstacles, green prey) and
  each sprite's frame bounds (cyan), to check anchors and sizes.
- `?placeholders` ignores all art, to compare against the old look.
- The browser console warns when a PNG isn't a whole number of frames, or
  when the manifest lists an id the engine doesn't know.

## 6. Changing this spec

Need a different frame size, extra animation, or new layer? Override it
in the JSON sidecar if it's just numbers. For a new animation or asset type,
say so in the PR description or open an issue and the engine side will wire
it up. Changes to this document go through PRs like any other file.
