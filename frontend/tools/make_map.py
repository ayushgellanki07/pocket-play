"""Draws the PocketPlay archipelago as low-res pixel art (320×180), then upscales ×6 to 1920×1080.
Island centres (in %) must match ISLANDS in src/data/islands.ts.
Run: python3 tools/make_map.py
"""
import os, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

W, H = 320, 180
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'map')
os.makedirs(OUT, exist_ok=True)
rnd = random.Random(7)

img = Image.new('RGB', (W, H))
px = img.load()
# ---- ocean: deep at the edges, lighter toward the middle, with dithered noise ----
for y in range(H):
    for x in range(W):
        dx, dy = (x - W / 2) / (W / 2), (y - H / 2) / (H / 2)
        d = min(1, (dx * dx + dy * dy) ** 0.5)
        base = np.array([34, 96, 160]) * (1 - d * 0.45) + np.array([16, 40, 92]) * d * 0.45
        if (x + y) % 2 == 0 and rnd.random() < 0.25:
            base = base * 1.06
        px[x, y] = tuple(int(c) for c in base)
d = ImageDraw.Draw(img)
for _ in range(170):  # wave dashes
    x, y = rnd.randrange(W), rnd.randrange(H)
    L = rnd.choice([2, 3, 4])
    d.line((x, y, x + L, y), fill=(92, 160, 214))

def blob(cx, cy, rx, ry, n=7, seed=0):
    r = random.Random(seed)
    m = Image.new('L', (W, H), 0)
    md = ImageDraw.Draw(m)
    md.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=255)
    for _ in range(n):
        ox, oy = r.uniform(-rx * .7, rx * .7), r.uniform(-ry * .6, ry * .6)
        sx, sy = r.uniform(rx * .35, rx * .6), r.uniform(ry * .35, ry * .6)
        md.ellipse((cx + ox - sx, cy + oy - sy, cx + ox + sx, cy + oy + sy), fill=255)
    return m

def dilate(m, k):
    return m.filter(ImageFilter.MaxFilter(k))

def paint(mask, color):
    img.paste(color, (0, 0), mask)

def island(cx, cy, rx, ry, land, beach, seed, shallow=True, foam=True):
    m = blob(cx, cy, rx, ry, seed=seed)
    if shallow: paint(dilate(m, 11), (52, 132, 196))
    if foam: paint(dilate(m, 3), (196, 232, 250))
    if beach: paint(m, beach); paint(m.filter(ImageFilter.MinFilter(3)), land)
    else: paint(m, land)
    return m

def tree(x, y, leaf=(46, 140, 70), trunk=(96, 60, 30)):
    d.point((x, y + 2), fill=trunk); d.point((x, y + 1), fill=trunk)
    d.rectangle((x - 1, y - 1, x + 1, y), fill=leaf); d.point((x, y - 2), fill=leaf)

def palm(x, y):
    d.line((x, y, x + 1, y - 3), fill=(110, 70, 30))
    for dx, dy in [(-2, -4), (3, -4), (-1, -5), (2, -5), (0, -4)]:
        d.point((x + 1 + dx, y + dy), fill=(52, 160, 80))

def hut(x, y, roof=(166, 70, 42), wall=(232, 206, 156)):
    d.rectangle((x, y, x + 4, y + 3), fill=wall)
    d.polygon([(x - 1, y), (x + 2, y - 3), (x + 5, y)], fill=roof)
    d.point((x + 2, y + 2), fill=(70, 40, 20))

# ======== Island 1 — Frontier Outpost (sand, farms, crates, storeroom) ========
c1 = (55, 126)
island(*c1, 30, 20, (214, 176, 104), (240, 214, 150), seed=1)
for i in range(4):  # farm rows
    d.line((36, 128 + i * 2, 50, 128 + i * 2), fill=(122, 160, 64) if i % 2 == 0 else (196, 160, 58))
for (x, y) in [(56, 113), (64, 118), (47, 117)]: hut(x, y)
d.rectangle((62, 125, 72, 131), fill=(150, 98, 52)); d.polygon([(61, 125), (67, 120), (73, 125)], fill=(122, 59, 30))  # storeroom
d.rectangle((66, 128, 68, 131), fill=(60, 34, 18))
for (x, y) in [(75, 130), (77, 130), (76, 128), (74, 133)]: d.rectangle((x, y, x + 1, y + 1), fill=(138, 90, 43))  # crates
for (x, y) in [(40, 117), (70, 112), (52, 138), (79, 121)]: palm(x, y)
d.rectangle((30, 133, 36, 134), fill=(120, 80, 40))  # dock
for x in (30, 33, 36): d.point((x, 135), fill=(80, 50, 25))

# ======== Island 2 — Banking Guild (lawns, marble hall, dome, vault) ========
c2 = (115, 66)
island(*c2, 30, 21, (86, 158, 82), (226, 210, 160), seed=2)
d.rectangle((103, 60, 125, 70), fill=(236, 234, 244))                     # grand hall
for x in range(104, 125, 3): d.line((x, 62, x, 70), fill=(176, 180, 200))  # columns
d.polygon([(101, 60), (114, 53), (127, 60)], fill=(214, 186, 96))          # pediment
d.ellipse((110, 48, 118, 56), fill=(90, 169, 255)); d.point((114, 47), fill=(245, 197, 66))
d.ellipse((128, 64, 136, 72), fill=(154, 163, 181)); d.ellipse((131, 67, 133, 69), fill=(60, 66, 84))  # vault
d.line((114, 70, 114, 80), fill=(236, 230, 210))                            # marble path
for (x, y) in [(96, 66), (98, 74), (130, 58), (122, 78), (106, 78)]: tree(x, y)
d.rectangle((140, 72, 146, 73), fill=(170, 160, 150))                       # stone pier

# ======== Island 3 — Citadel of Debt (dark rock, fortress, red light) ========
c3 = (176, 130)
island(*c3, 28, 20, (74, 69, 82), (104, 98, 112), seed=3)
d.rectangle((166, 120, 188, 134), fill=(42, 37, 48))                        # keep
for x in range(166, 189, 3): d.rectangle((x, 118, x + 1, 119), fill=(42, 37, 48))  # crenellations
for tx in (162, 189):
    d.rectangle((tx, 113, tx + 4, 134), fill=(34, 30, 40)); d.polygon([(tx - 1, 113), (tx + 2, 108), (tx + 5, 113)], fill=(120, 20, 35))
for (x, y) in [(170, 124), (176, 124), (182, 124), (164, 118), (191, 118), (176, 129)]: d.point((x, y), fill=(255, 77, 94))
d.ellipse((193, 128, 201, 136), fill=(110, 104, 118)); d.ellipse((196, 131, 198, 133), fill=(42, 37, 48))  # gear
for a in range(8):
    import math
    gx = 197 + round(math.cos(a * math.pi / 4) * 5); gy = 132 + round(math.sin(a * math.pi / 4) * 5)
    d.point((gx, gy), fill=(110, 104, 118))
d.rectangle((174, 134, 178, 140), fill=(30, 26, 34))                        # portcullis
for x in (175, 177): d.line((x, 134, x, 140), fill=(90, 84, 96))

# ======== Island 4 — Grand Exchange (green, brass halls, ticker tower, docks) ========
c4 = (246, 86)
island(*c4, 32, 22, (79, 154, 106), (224, 206, 150), seed=4)
d.rectangle((232, 80, 252, 90), fill=(192, 138, 58)); d.rectangle((234, 82, 250, 88), fill=(159, 214, 230))  # glass hall
d.polygon([(230, 80), (242, 73), (254, 80)], fill=(140, 92, 36))
d.rectangle((256, 70, 261, 90), fill=(176, 122, 42))                        # ticker tower
for y in range(72, 89, 3): d.line((257, y, 260, y), fill=(82, 230, 140) if y % 2 else (255, 90, 90))
d.ellipse((255, 66, 262, 72), fill=(214, 168, 70))
for (x, y) in [(238, 95), (244, 96), (228, 90)]: hut(x, y, roof=(30, 110, 70), wall=(214, 196, 150))
d.rectangle((262, 98, 276, 99), fill=(120, 80, 40))                         # merchant dock
for (x, y) in [(226, 76), (266, 82), (248, 101)]: tree(x, y)

# ======== Island 5 — Master Citadel (floating marble, gold dome, shields, portal) ========
c5 = (192, 30)
# cloud bank beneath
for i in range(14):
    cx, cy = 160 + i * 5 + rnd.randint(-2, 2), 44 + rnd.randint(-2, 3)
    d.ellipse((cx - 6, cy - 3, cx + 6, cy + 4), fill=(236, 240, 252))
for i in range(10):
    cx, cy = 166 + i * 6, 46
    d.ellipse((cx - 5, cy - 2, cx + 5, cy + 3), fill=(208, 214, 236))
d.polygon([(170, 32), (214, 32), (204, 44), (192, 52), (180, 44)], fill=(106, 90, 138))   # rock underside
d.polygon([(178, 38), (206, 38), (192, 50)], fill=(84, 70, 116))
d.ellipse((168, 24, 216, 36), fill=(233, 228, 242))                         # marble top
d.ellipse((172, 25, 212, 33), fill=(159, 216, 160))
d.rectangle((184, 18, 200, 28), fill=(244, 238, 250))
for x in range(185, 200, 3): d.line((x, 20, x, 28), fill=(206, 200, 220))
d.ellipse((186, 10, 198, 22), fill=(245, 210, 107)); d.point((192, 9), fill=(255, 245, 200))  # gold dome
d.ellipse((202, 20, 210, 30), outline=(126, 240, 255))                      # portal ring
d.ellipse((204, 22, 208, 28), fill=(190, 250, 255))
for x in (176, 207): d.rectangle((x, 24, x + 1, 29), fill=(245, 210, 107))   # shield pillars

# ---- scattered islets & rocks ----
for (x, y, rx, ry, s) in [(88, 156, 6, 3, 11), (150, 96, 4, 3, 12), (284, 140, 9, 5, 13), (30, 40, 8, 5, 14), (300, 30, 6, 4, 15)]:
    island(x, y, rx, ry, (120, 150, 90), (220, 200, 150), seed=s)
for (x, y) in [(30, 39), (284, 139)]: palm(x, y)
for (x, y) in [(214, 160), (100, 30), (268, 128)]:
    d.rectangle((x, y, x + 2, y + 1), fill=(96, 98, 110)); d.point((x + 1, y - 1), fill=(130, 132, 146))

big = img.resize((W * 6, H * 6), Image.NEAREST)
big.save(os.path.join(OUT, 'archipelago.png'), optimize=True)
img.resize((W * 2, H * 2), Image.NEAREST).save(os.path.join(OUT, 'archipelago_small.png'), optimize=True)
print('map ok', [(round(c[0] / W * 100, 1), round(c[1] / H * 100, 1)) for c in (c1, c2, c3, c4, c5)])
