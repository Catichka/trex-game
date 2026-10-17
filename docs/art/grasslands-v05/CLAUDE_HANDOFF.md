# Claude Code — Grasslands V05 Background Replacement

Scope: **environment artwork only**. Do not change character atlases, pivots, roar, obstacles, hitboxes, scoring, or physics.

Replace only the seven PNG layers and `environment.json` in `assets/environments/grasslands/`.

All images are 480×200 PNGs; no prescaling, antialiasing or filtering.
Keep each layer drawn at y=0. Ground surface remains y=152.
`environment.json` retains V04 layer order, names, and scroll factors.
Layer tiles are 480px wide and edge-aligned for horizontal repeat.

Suggested QA:
- compare screenshots at real 480×200 resolution, plus 3× nearest-neighbor
- inspect moving layer seams across a full wrap
- confirm clouds, hills and plants don't obscure gameplay silhouettes
- verify ground line and foreground draw order
- verify levels 1, 3, 5 still run and V04 roar/collision remain unchanged

Please send back a real gameplay screenshot and visual feedback before we polish further.
The RAWR gameplay feature is intentionally reserved for a subsequent dedicated milestone.
