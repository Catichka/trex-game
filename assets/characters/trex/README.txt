THE T-REX GAME — T-REX CHARACTER ASSETS V1

CONTENTS
- trex_atlas.png: transparent RGBA sprite atlas, 512 x 320 pixels.
- trex_atlas.json: frame rectangles, FPS and animation metadata.
- frames/: 24 individual 64 x 64 RGBA PNG files.
- demo.html: browser demo. Open it with a local web server (e.g. python -m http.server 8000) and navigate to /demo.html.

ANIMATIONS
Rows in atlas, top to bottom:
0 idle: 4 frames, 5 FPS
1 run: 8 frames, 12 FPS
2 jump: 4 frames, 8 FPS
3 fall: 4 frames, 8 FPS
4 land: 4 frames, 10 FPS

Each frame is 64x64 pixels; source rectangle x=frame_index*64, y=row*64.
All images have true alpha transparency. Character faces right.

NOTE
These are clean, programmatically drawn first-pass sprites, not exact reproductions of the illustrated concept art. They are suitable for prototyping, and can be replaced with higher-detail art later without changing the 64x64 frame contract.
