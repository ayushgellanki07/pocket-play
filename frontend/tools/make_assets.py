"""Asset pipeline for PocketPlay.
1. Compresses the supplied world illustrations into web-sized backgrounds.
2. Cuts Pappu (the player) out of his dark backdrop so he can stand in any scene.
3. Generates NPC portraits + the classroom ending in the same pixel-art style.
Run: python3 tools/make_assets.py <uploads_dir>
"""
import sys, os
import numpy as np
from PIL import Image, ImageDraw
from collections import deque

SRC = sys.argv[1] if len(sys.argv) > 1 else "/mnt/user-data/uploads"
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "assets")

# ---------- 1. backgrounds ----------
BGS = {
    "bg_frontier_outpost": "high_quality_slide_1__jpg_1.jpeg",
    "bg_banking_guild": "Slide_2_Bank_guild_jpg.jpeg",
    "bg_citadel_debt": "slide_3_debt_jpg.jpeg",
    "bg_grand_exchange": "slide_4_exchange_jpg.jpeg",
    "bg_master_citadel": "slide_5_jpg.jpeg",
}
for name, f in BGS.items():
    im = Image.open(os.path.join(SRC, f)).convert("RGB")
    # crop off the tiny watermark sparkle in the bottom-right corner
    w, h = im.size
    im = im.crop((0, 0, w, int(h * 0.965)))
    im = im.resize((1920, int(1920 * im.size[1] / im.size[0])), Image.LANCZOS)
    im.save(os.path.join(OUT, "bg", name + ".jpg"), quality=80, optimize=True, progressive=True)

# ---------- 2. Pappu cut-outs ----------
PAPPU = {
    "neutral": "pappu_jpg.jpeg", "confused": "Confused_pappu_jpg.jpeg",
    "excited": "Excited_Pappu_jpg.jpeg", "skeptical": "skeptical_pappu_jpg.jpeg",
    "worried": "Woried_pappu_jpg.jpeg", "success": "successful_pappu_jpg.jpeg",
}
def cutout(img):
    a = np.array(img.convert("RGB")).astype(int)
    h, w, _ = a.shape
    bg = a[5, 5]
    # A pixel is "backdrop" only if it is close to the indigo backdrop AND bluish (blue clearly above red).
    # v1 used colour distance alone, which also ate Pappu's very dark maroon hair and left holes in it.
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    near = (np.abs(a - bg).sum(2) < 48) & (b - r > 18)
    alpha = np.full((h, w), 255, np.uint8)
    seen = np.zeros((h, w), bool)
    q = deque([(y, x) for y in range(h) for x in (0, w - 1)] + [(y, x) for x in range(w) for y in (0, h - 1)])
    while q:                                     # flood-fill from the edges only,
        y, x = q.popleft()                       # so dark pixels *inside* Pappu survive
        if y < 0 or x < 0 or y >= h or x >= w or seen[y, x] or not near[y, x]:
            continue
        seen[y, x] = True; alpha[y, x] = 0
        q.extend(((y+1, x), (y-1, x), (y, x+1), (y, x-1)))
    return np.dstack([a.astype(np.uint8), alpha])

def brighten_hair(rgba):
    """Lift the near-black maroon hair to a readable chestnut and add a soft top rim light.
    Shading order is preserved (darker strands stay darker), so the hairstyle is unchanged."""
    import colorsys
    out = rgba.copy()
    h = out.shape[0]
    a = out[:, :, :3].astype(int)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    mx = a.max(2)
    rows = np.arange(h)[:, None]
    hair = (out[:, :, 3] > 0) & (rows < h * 0.34) & (r >= b) & (r - g >= 12) & (mx >= 34) & (mx < 125)
    # rim: hair pixels with transparency within 4px above them (the top edge of the silhouette)
    transparent = out[:, :, 3] == 0
    above = np.zeros_like(transparent)
    for d in range(1, 5):
        above[d:] |= transparent[:-d]
    ys, xs = np.nonzero(hair)
    for y, x in zip(ys, xs):
        hh, s, v = colorsys.rgb_to_hsv(*(a[y, x] / 255))
        v = min(1.0, v * 1.55 + 0.07 + (0.10 if above[y, x] else 0))
        rr, gg, bb = colorsys.hsv_to_rgb(0.055, min(s, 0.62), v)   # warm chestnut hue
        out[y, x, :3] = (int(rr * 255), int(gg * 255), int(bb * 255))
    return out

for mood, f in PAPPU.items():
    im = Image.open(os.path.join(SRC, f)).crop((960, 110, 1660, 1400))
    im = im.resize((350, 645), Image.NEAREST)
    Image.fromarray(brighten_hair(cutout(im)), "RGBA").save(os.path.join(OUT, "chars", f"pappu_{mood}.png"), optimize=True)

# ---------- 3. NPC pixel portraits ----------
OUTLINE = (20, 14, 30, 255)
def finish(c, scale=12):
    """Add a 1px dark outline around the sprite, then upscale with hard pixels."""
    a = np.array(c)
    op = a[:, :, 3] > 0
    edge = np.zeros_like(op)
    edge[1:] |= op[:-1]; edge[:-1] |= op[1:]; edge[:, 1:] |= op[:, :-1]; edge[:, :-1] |= op[:, 1:]
    edge &= ~op
    a[edge] = OUTLINE
    im = Image.fromarray(a, "RGBA")
    return im.resize((im.width * scale, im.height * scale), Image.NEAREST)

def px(d, pts, col):
    for p in pts: d.point(p, fill=col)

def base(skin, skin_sh, coat, coat_sh, w=36, h=46):
    c = Image.new("RGBA", (w, h), (0, 0, 0, 0)); d = ImageDraw.Draw(c)
    d.polygon([(3, 45), (6, 33), (12, 30), (24, 30), (30, 33), (33, 45)], fill=coat)   # shoulders
    d.polygon([(3, 45), (6, 33), (9, 32), (8, 45)], fill=coat_sh)
    d.rectangle((15, 25, 21, 31), fill=skin_sh)                                         # neck
    d.ellipse((10, 9, 26, 28), fill=skin)                                               # head
    d.ellipse((10, 9, 14, 28), fill=skin_sh)                                            # shade side
    d.ellipse((11, 9, 26, 28), fill=skin)
    d.rectangle((9, 18, 10, 21), fill=skin_sh); d.rectangle((26, 18, 27, 21), fill=skin_sh)  # ears
    return c, d

def eyes(d, col=(30, 20, 30), y=19, glow=None):
    white = glow or (240, 236, 228)
    for x in (14, 21):
        d.rectangle((x, y, x + 1, y), fill=white)
        if not glow: d.point((x + 1, y), fill=col)
    d.line((13, y - 2, 16, y - 2), fill=(50, 30, 30)); d.line((20, y - 2, 23, y - 2), fill=(50, 30, 30))

def save(img, name):
    img.save(os.path.join(OUT, "chars", name + ".png"), optimize=True)

# Master Kaelen — weathered quartermaster: grey beard, dusty hat, leather vest, cyan goggles
c, d = base((205, 150, 105), (170, 115, 80), (120, 78, 45), (90, 55, 32))
d.polygon([(14, 30), (18, 36), (22, 30)], fill=(225, 210, 175))                       # shirt V
d.rectangle((17, 33, 18, 45), fill=(225, 210, 175))
eyes(d)
d.polygon([(11, 22), (12, 28), (16, 31), (20, 31), (24, 28), (25, 22), (22, 25), (14, 25)], fill=(200, 200, 205))  # beard
d.line((15, 24, 21, 24), fill=(170, 170, 178))
d.line((16, 26, 20, 26), fill=(110, 60, 50))                                          # mouth
d.rectangle((5, 10, 31, 12), fill=(140, 100, 60))                                      # hat brim
d.polygon([(10, 10), (12, 3), (24, 3), (26, 10)], fill=(160, 118, 72))
d.rectangle((11, 8, 25, 9), fill=(95, 60, 35))                                          # band
d.ellipse((13, 5, 16, 8), fill=(60, 230, 240)); d.ellipse((20, 5, 23, 8), fill=(60, 230, 240))  # goggles
d.line((16, 6, 20, 6), fill=(60, 60, 70))
px(d, [(28, 38), (29, 38), (28, 39), (29, 39)], (220, 180, 70))                       # badge
save(finish(c), "npc_kaelen")

# Aditi — Guild Chief Teller: black bun, navy coat, gold trim, holo badge
c, d = base((180, 120, 85), (150, 95, 65), (30, 45, 95), (20, 30, 70))
d.polygon([(14, 30), (18, 35), (22, 30)], fill=(235, 235, 245))
d.line((18, 35, 18, 45), fill=(214, 175, 80)); d.line((6, 33, 12, 30), fill=(214, 175, 80)); d.line((24, 30, 30, 33), fill=(214, 175, 80))
d.rectangle((5, 32, 9, 33), fill=(214, 175, 80)); d.rectangle((27, 32, 31, 33), fill=(214, 175, 80))  # epaulettes
d.ellipse((10, 7, 26, 18), fill=(25, 20, 30)); d.ellipse((14, 2, 22, 9), fill=(25, 20, 30))  # hair + bun
d.rectangle((10, 13, 11, 24), fill=(25, 20, 30)); d.rectangle((25, 13, 26, 24), fill=(25, 20, 30))
d.point((18, 6), fill=(214, 175, 80))
eyes(d)
d.line((16, 24, 20, 24), fill=(150, 55, 70))
d.point((18, 14), fill=(200, 40, 60))                                                   # bindi
d.rectangle((25, 37, 28, 40), fill=(70, 200, 255)); d.point((26, 38), fill=(220, 250, 255))
save(finish(c), "npc_aditi")

# Virendra — Moneylender: slick black hair, goatee, crimson high-collar robe, gold chain
c, d = base((215, 175, 150), (180, 135, 115), (130, 20, 35), (90, 10, 25))
d.polygon([(11, 28), (13, 33), (16, 30)], fill=(160, 30, 45)); d.polygon([(25, 28), (23, 33), (20, 30)], fill=(160, 30, 45))  # collar
d.line((8, 34, 18, 41), fill=(220, 180, 60)); d.line((28, 34, 18, 41), fill=(220, 180, 60))
d.ellipse((16, 40, 20, 44), fill=(220, 180, 60))
d.ellipse((10, 7, 26, 16), fill=(20, 18, 26)); d.polygon([(10, 12), (26, 12), (26, 17), (24, 14), (12, 14), (10, 17)], fill=(20, 18, 26))
d.line((14, 9, 21, 9), fill=(70, 70, 90))
eyes(d)
d.line((13, 17, 16, 18), fill=(40, 20, 20)); d.line((23, 17, 20, 18), fill=(40, 20, 20))     # sharp brows
d.line((15, 23, 21, 23), fill=(30, 20, 25)); d.polygon([(16, 25), (20, 25), (18, 29)], fill=(30, 20, 25))  # moustache + goatee
d.line((16, 24, 20, 24), fill=(120, 40, 50))
save(finish(c), "npc_virendra")

# Broker Vikram — top hat, teal goggles, green coat, red vest, grey moustache
c, d = base((200, 145, 105), (165, 110, 80), (30, 90, 55), (20, 65, 40))
d.polygon([(13, 30), (18, 40), (23, 30)], fill=(150, 30, 35)); d.polygon([(15, 30), (18, 34), (21, 30)], fill=(240, 240, 240))
d.point((18, 36), fill=(214, 175, 80)); d.point((18, 38), fill=(214, 175, 80))
d.rectangle((7, 9, 29, 10), fill=(25, 25, 32)); d.rectangle((11, 0, 25, 9), fill=(35, 35, 45))
d.rectangle((11, 6, 25, 7), fill=(150, 30, 35))
d.rectangle((12, 17, 17, 20), fill=(60, 200, 190)); d.rectangle((19, 17, 24, 20), fill=(60, 200, 190))
d.line((17, 18, 19, 18), fill=(80, 60, 40)); d.point((13, 18), fill=(200, 255, 250)); d.point((20, 18), fill=(200, 255, 250))
d.polygon([(13, 23), (18, 22), (23, 23), (21, 25), (18, 24), (15, 25)], fill=(190, 190, 195))
d.line((16, 26, 20, 26), fill=(110, 55, 45))
d.rectangle((26, 36, 29, 40), fill=(230, 225, 210)); d.line((26, 38, 29, 38), fill=(120, 110, 100))  # ticker paper
save(finish(c), "npc_vikram")

# The Overseer — hooded celestial guardian, glowing eyes, gold circlet
c, d = base((60, 55, 110), (40, 36, 80), (60, 45, 140), (40, 30, 100))
d.polygon([(6, 32), (8, 12), (13, 4), (23, 4), (28, 12), (30, 32), (25, 30), (25, 14), (11, 14), (11, 30)], fill=(75, 55, 160))
d.polygon([(8, 12), (13, 4), (16, 4), (11, 14), (11, 30), (6, 32)], fill=(55, 40, 125))
d.ellipse((12, 13, 24, 28), fill=(22, 18, 45))
d.line((12, 14, 24, 14), fill=(230, 195, 90)); d.point((18, 13), fill=(120, 240, 255))
for x in (14, 21):
    d.rectangle((x, 19, x + 1, 19), fill=(120, 240, 255))
d.line((18, 30, 18, 45), fill=(230, 195, 90)); d.line((7, 34, 11, 45), fill=(230, 195, 90)); d.line((29, 34, 25, 45), fill=(230, 195, 90))
d.ellipse((16, 36, 20, 40), fill=(120, 240, 255))
save(finish(c), "npc_overseer")

# ---------- 4. classroom ending backdrop (low-res pixel scene, upscaled) ----------
W, H = 160, 90
c = Image.new("RGB", (W, H), (60, 52, 80)); d = ImageDraw.Draw(c)
d.rectangle((0, 0, W, 58), fill=(214, 196, 160))                    # warm wall
d.rectangle((0, 58, W, H), fill=(150, 104, 70))                      # floor
for x in range(0, W, 10): d.line((x, 58, x - 8, H), fill=(130, 88, 58))
d.rectangle((14, 8, 74, 40), fill=(55, 80, 60)); d.rectangle((12, 6, 76, 8), fill=(120, 85, 50)); d.rectangle((12, 40, 76, 42), fill=(120, 85, 50))
for i, t in enumerate([(18, 13, 40), (18, 19, 56), (18, 25, 34), (18, 31, 48)]):  # chalk scribbles
    d.line((t[0], t[1], t[2], t[1]), fill=(225, 230, 220))
d.text((50, 26), "72/r", fill=(240, 240, 200))
d.rectangle((100, 6, 146, 36), fill=(150, 200, 235)); d.rectangle((99, 5, 147, 37), outline=(240, 240, 240))
d.line((123, 5, 123, 37), fill=(240, 240, 240)); d.line((99, 21, 147, 21), fill=(240, 240, 240))
d.ellipse((104, 10, 116, 16), fill=(250, 250, 255)); d.ellipse((128, 24, 142, 30), fill=(250, 250, 255))
d.rectangle((40, 54, 120, 60), fill=(160, 110, 65)); d.rectangle((40, 60, 120, 62), fill=(120, 80, 48))  # desk
d.rectangle((44, 62, 47, 84), fill=(110, 72, 44)); d.rectangle((113, 62, 116, 84), fill=(110, 72, 44))
d.rectangle((52, 50, 72, 54), fill=(240, 236, 220)); d.line((62, 50, 62, 54), fill=(180, 170, 150))   # open notebook
d.rectangle((80, 49, 92, 54), fill=(40, 120, 200)); d.rectangle((96, 51, 100, 54), fill=(240, 200, 60))  # book + mug
d.rectangle((88, 47, 91, 49), fill=(80, 220, 230))                   # glowing phone
c = c.resize((1920, 1080), Image.NEAREST)
c.save(os.path.join(OUT, "bg", "bg_classroom.jpg"), quality=85)
print("assets ok")
