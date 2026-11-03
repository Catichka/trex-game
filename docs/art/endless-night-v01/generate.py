"""Endless Night v01: code-generated pixel art for world 6.

Writes the 7 parallax layers (480x200, tile horizontally) to
assets/environments/endless-night/ and two obstacles to assets/obstacles/.
Every horizontal shape uses periodic functions with a 480 px period, so the
layers tile without seams. Run from the repo root: python3 docs/art/endless-night-v01/generate.py
"""
import math, json, random, os
from PIL import Image

W, H, G = 480, 200, 152
ENV = 'assets/environments/endless-night'
os.makedirs(ENV, exist_ok=True)

def hexc(s, a=255):
    s = s.lstrip('#'); return (int(s[0:2], 16), int(s[2:4], 16), int(s[4:6], 16), a)

def wave(x, parts):  # periodic in 480
    return sum(a * math.sin(2 * math.pi * (k * x / W) + p) for k, a, p in parts)

def new(): return Image.new('RGBA', (W, H), (0, 0, 0, 0))

# ── sky: banded gradient (ordered dither), stars, moon ─────────────
BANDS = ['#070821', '#0b0d2c', '#111338', '#171a46', '#1f2054', '#2a2663', '#372c6e', '#463476']
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
sky = new(); px = sky.load()
for y in range(H):
    t = min(1, y / G) * (len(BANDS) - 1)
    i = int(t); f = t - i
    for x in range(W):
        j = i + (1 if f * 16 > BAYER[y % 4][x % 4] else 0)
        px[x, y] = hexc(BANDS[min(j, len(BANDS) - 1)])
rnd = random.Random(6)
for _ in range(150):
    x, y = rnd.randrange(W), rnd.randrange(int(G * 0.75))
    c = rnd.choice(['#5a5ea0', '#7a80c0', '#a8b0e8', '#e8ecff'])
    px[x, y] = hexc(c)
for _ in range(9):  # bright twinkle crosses
    x, y = rnd.randrange(4, W - 4), rnd.randrange(4, 80)
    px[x, y] = hexc('#ffffff')
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)): px[x + dx, y + dy] = hexc('#9aa4e0')
# moon (static, upper right, clear of the HUD)
MX, MY, MR = 392, 46, 17
for y in range(MY - MR - 8, MY + MR + 9):
    for x in range(MX - MR - 8, MX + MR + 9):
        d = math.hypot(x - MX, y - MY)
        if d <= MR:
            lit = (x - MX) * -0.5 + (y - MY) * -0.5
            px[x, y] = hexc('#fff6d8' if lit > 4 else '#f0e6c0' if lit > -6 else '#d8cca4')
        elif d <= MR + 3 and (x + y) % 2 == 0:
            px[x, y] = hexc('#4a3f86')
        elif d <= MR + 7 and (x + y) % 4 == 0:
            px[x, y] = hexc('#3d3480')
for cx, cy, r in ((-6, 3, 4), (5, -6, 3), (6, 7, 2), (-3, -9, 2), (-9, -3, 2)):
    for y in range(-r, r + 1):
        for x in range(-r, r + 1):
            if x * x + y * y <= r * r: px[MX + cx + x, MY + cy + y] = hexc('#c8bc94' if x + y > 0 else '#b8ac84')
sky.save(ENV + '/sky.png')

# ── clouds: long thin violet strands, moonlit top edge ─────────────
cl = new(); px = cl.load()
for (cx, cy, ln, th) in ((40, 30, 120, 4), (230, 18, 90, 3), (330, 62, 140, 5), (150, 78, 70, 3)):
    for x in range(-ln // 2, ln // 2):
        h = int(th * math.sqrt(max(0, 1 - (2 * x / ln) ** 2)) + 0.5)
        for y in range(h):
            X = (cx + x) % W
            px[X, cy + y] = hexc('#8a84c8' if y == 0 else '#3a3478', 200 if y == 0 else 170)
cl.save(ENV + '/clouds.png')

# ── far hills: distant peaks, a far volcano with a faint ember ─────
fh = new(); px = fh.load()
for x in range(W):
    top = 112 + wave(x, [(1, 9, 0.4), (3, 7, 1.7), (5, 4, 0.2), (11, 2, 2.2)])
    d = abs(x - 120)
    if d < 50: top = min(top, 78 + d * 0.75 + (3 if d < 4 else 0))  # far volcano, notched crater
    for y in range(int(top), G + 1):
        c = '#1c1d4a' if y > top + 1 else '#3a3c7a'
        if abs(x - 120) < 4 and y < top + 3: c = '#7a3a6a'  # cool ember glow at the crater
        px[x, y] = hexc(c)
fh.save(ENV + '/far_hills.png')

# ── mid: silhouette fern trees + rock spires with moon rim ─────────
md = new(); px = md.load()
for x in range(W):  # rolling base
    top = 136 + wave(x, [(2, 4, 1.0), (7, 2, 0.3)])
    for y in range(int(top), G + 1): px[x, y] = hexc('#141538' if y > top else '#2e3070')
def tree(bx, h):
    for y in range(G - h, G):
        for dx in (0, 1, 2):
            px[(bx + dx) % W, y] = hexc('#101130')
    for k in range(5):  # fronds
        fy = G - h + k * 3
        for s in (-1, 1):
            for i in range(10 - k):
                X, Y = (bx + 1 + s * i) % W, fy + int((i * i) / 9)
                px[X, Y] = hexc('#101130')
                if Y - 1 >= 0 and s == 1 and k == 0: px[X, Y - 1] = hexc('#34387a')
for bx, h in ((20, 40), (98, 30), (170, 46), (260, 34), (330, 42), (420, 28)): tree(bx, h)
for bx, h, w in ((60, 26, 14), (215, 20, 11), (380, 30, 16)):  # spires
    for y in range(G - h, G):
        ww = int(w * (y - (G - h)) / h) + 2
        for x in range(bx - ww // 2, bx + ww // 2):
            px[x % W, y] = hexc('#3a3e86' if x == bx + ww // 2 - 1 else '#17183e')
md.save(ENV + '/mid.png')

# ── near: tiny grass tufts on the horizon line (scenery, 3px) ──────
nr = new(); px = nr.load()
for x in range(0, W, 1):
    if (x * 37) % 23 < 3: px[x, G - 1] = hexc('#24405a')
    if (x * 53) % 61 < 2: px[x, G - 2] = hexc('#2c4c66'); px[x, G - 1] = hexc('#24405a')
nr.save(ENV + '/near.png')

# ── ground: moonlit grass edge, dark soil, pebbles, glowing moss ───
gd = new(); px = gd.load()
for x in range(W):
    for y in range(G, H):
        d = y - G
        if d == 0: c = '#6a9cb0'
        elif d == 1: c = '#4a7c90' if x % 3 else '#6a9cb0'
        elif d < 4: c = '#2e5468'
        else: c = '#1a1c3a' if (x // 4 + y // 4) % 2 else '#1d2042'
        px[x, y] = hexc(c)
    if x % 7 == 0: px[x, G - 1] = hexc('#4a7c90')  # grass tips above the line
rnd = random.Random(60)
for _ in range(60):
    x, y = rnd.randrange(W - 3), rnd.randrange(G + 7, H - 2)
    c = rnd.choice(['#2a2c56', '#30335e', '#272a50'])
    for dx in range(rnd.choice((2, 3))): px[x + dx, y] = hexc(c); px[x + dx, y + 1] = hexc('#121330')
for _ in range(14):
    x, y = rnd.randrange(W), rnd.randrange(G + 6, H - 1)
    px[x, y] = hexc('#7af0d8')  # glow-moss specks
gd.save(ENV + '/ground.png')

# ── foreground: a few dark grass blades at the bottom edge ─────────
fg = new(); px = fg.load()
for bx in (30, 140, 255, 370, 450):
    for i, hgt in enumerate((5, 8, 6, 9, 4)):
        for y in range(H - hgt, H): px[(bx + i * 2) % W, y] = hexc('#0c0d24')
fg.save(ENV + '/foreground.png')

layers = [('sky', 0), ('clouds', 0.1), ('far_hills', 0.18), ('mid', 0.32), ('near', 0.55), ('ground', 1), ('foreground', 1.12)]
json.dump({'name': 'endless-night', 'display_name': 'Endless Night', 'viewport': [W, H], 'ground_y': G,
           'layers': [{'name': n, 'image': n + '.png', 'scroll_factor': s, 'repeat_x': n != 'sky', 'width': W, 'height': H, 'offset_y': 0} for n, s in layers],
           'rendering': 'nearest-neighbor', 'version': 'endless-night-v01'}, open(ENV + '/environment.json', 'w'), indent=2)

# ── obstacles ──────────────────────────────────────────────────────
def sprite(name, img, pivot):
    img.save('assets/obstacles/%s.png' % name)
    w, h = img.size
    json.dump({'name': name, 'image': name + '.png', 'frame_size': [w, h], 'pivot': pivot,
               'animations': {'idle': {'fps': 1, 'loop': True, 'frames': [{'x': 0, 'y': 0, 'w': w, 'h': h}]}},
               'ground_y': G, 'rendering': 'nearest-neighbor'}, open('assets/obstacles/%s.json' % name, 'w'), indent=2)

# Moonstone boulder 27x24 (= large rock): dark stone, moonlit rim, glowing runes.
b = Image.new('RGBA', (27, 24), (0, 0, 0, 0)); p = b.load()
for y in range(24):
    for x in range(27):
        nx, ny = (x - 13) / 13.5, (y - 15) / 11.5
        if ny > 0.75: continue
        if nx * nx + ny * ny * (1.3 if ny < 0 else 0.9) > 1: continue
        e = nx * nx + ny * ny
        lit = -nx * 0.6 - ny
        c = '#0e0f26' if e > 0.82 else '#c8e0ff' if lit > 1.0 else '#7a90c8' if lit > 0.55 else '#3c4478' if lit > -0.2 else '#262a52'
        p[x, y] = hexc(c)
for (x, y) in ((9, 12), (10, 13), (11, 12), (15, 15), (16, 16), (17, 15), (16, 14)):
    p[x, y] = hexc('#7af0d8')
for x in range(27):  # flat base on the ground row
    if p[x, 23][3] == 0 and 3 < x < 24: p[x, 23] = hexc('#0e0f26')
sprite('moonstone-boulder', b, [13, 23])

# Night stump 18x21 (= stump): dead stump with glowing blue mushrooms.
s = Image.new('RGBA', (18, 21), (0, 0, 0, 0)); p = s.load()
for y in range(5, 21):
    half = 6 + (2 if y > 17 else 0) + (1 if y > 19 else 0)
    for x in range(9 - half, 9 + half):
        c = '#2a2240' if x < 9 - half + 2 else '#5a5090' if x > 9 + half - 3 else '#3e3462'
        if (x * 3 + y) % 7 == 0: c = '#221c36'
        p[x, y] = hexc(c)
for x in range(3, 15): p[x, 5] = hexc('#8a80c0'); p[x, 6] = hexc('#6a5ea0')  # cut top
for x in (5, 8, 12): p[x, 4] = hexc('#3e3462')  # jagged top
for (mx, my) in ((2, 13), (14, 9), (13, 15)):  # glow mushrooms
    for dx in (-1, 0, 1): p[mx + dx, my] = hexc('#7af0ff')
    p[mx, my - 1] = hexc('#c8fcff'); p[mx, my + 1] = hexc('#3a8a9a')
sprite('night-stump', s, [9, 20])
print('ok')
