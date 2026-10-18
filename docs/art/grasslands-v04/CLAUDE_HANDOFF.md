# Claude Code handoff — Grasslands Production V04

Deliverables:
- `assets/characters/trex/trex_atlas.png` + `trex_atlas.json`: full V3 atlas with one additional 4-frame `rawr` row at y=512. **Replace both existing files together**. Existing animation rectangles and timing are preserved. Pivot [35,56]. 64x64. rawr 10fps looping. Existing atlas size 512x512 -> new 512x576.
- `assets/obstacles/`: five independent PNG+JSON pairs. Their PNGs are exactly 15x12, 21x15, 27x9, 12x21, 18x27. Pivot is bottom-centre `[floor(w/2),h-1]`; ground line y=152.
- `assets/environments/grasslands/`: seven 480x200 layers, painted at absolute viewport coordinates (no pre-scaling). `environment.json` lists draw order, x scroll factors, tiling.
- `assets/fx/`: three horizontal 6-frame atlases, each 144x24 with 24x24 cells, 20fps, non-looping.

Important:
- Preserve the engine's collision boxes, player pivots, animation state transitions and ground at y=152.
- No interpolation or fractional destination pixel positions; `imageSmoothingEnabled=false`.
- For scrolling layer L, compute dx = -(cameraX * L.scroll_factor) % 480; draw at dx and dx+480 (and dx-480 if needed). Sky is static.
- Ground layer is designed to draw behind characters, with walkable surface at y=152.
- The optional foreground layer is minimal so it will not obscure characters.
- `rawr` is a small incremental animation based on the integrated V3 idle artwork, not a wholesale redesign.
- Visual QA: verify feet anchoring for rawr, inspect obstacle ground contact, check wrap seams, and verify no animation fallback.
- Sprite JSONs follow the same `animations` schema as V3; also include `frame_size` and `pivot`.
