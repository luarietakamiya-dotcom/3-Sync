#!/usr/bin/env python3
"""Generate placeholder walk sheets for the town passers-by (data/npcs.json "townspeople").

Usage:
  python3 game/tools/build_town_placeholder.py [OUTDIR]     (default: game/sprites/npc)

Writes town_shopper.png / town_courier.png / town_elder.png / town_guest.png.
Format (same as the player's walk sheets sprites/walk_*.png):
  768x128 = 12 frames of 64x128 in one row, transparent background
  [down(front): walk, stand, walk][left: walk, stand, walk][right: walk, stand, walk][up(back): walk, stand, walk]
  foot centre at (32,126) in every frame (shoe soles on y=126).
The game draws a frame at half size and then x1.45, like the player in town.

These are flat single-colour silhouettes, one colour per kind plus a prop that tells the
kinds apart (shopper = bag, courier = cap + parcel, elder = cane + stoop, guest = glow
stick). Replace the PNGs with the real art later; nothing else needs to change.
"""
import os
import sys

from PIL import Image, ImageDraw

FW, FH, FOOT_X, FOOT_Y = 64, 128, 32, 126
KINDS = {
    # id: body colour, dark outline/shade, height (sole to top of head), prop
    "shopper": ((246, 168, 69), (120, 70, 20), 104, "bag"),
    "courier": ((95, 211, 138), (25, 95, 55), 108, "parcel"),
    "elder": ((184, 168, 216), (80, 66, 110), 96, "cane"),
    "guest": ((255, 79, 168), (120, 20, 80), 104, "stick"),
}
SKIN = (236, 214, 196)
HAIR = {"shopper": (90, 55, 40), "courier": (40, 40, 48), "elder": (225, 225, 232), "guest": (60, 30, 80)}


def figure(d, kind, view, step):
    """view: down/left/right/up, step: -1 / 0 / +1 (walk A, stand, walk B)."""
    col, dark, h, prop = KINDS[kind]
    top = FOOT_Y - h
    head_r = 9
    hx = FOOT_X + (2 if view == "right" else -2 if view == "left" else 0)
    stoop = 4 if kind == "elder" else 0
    if view == "left":
        hx -= stoop
    elif view == "right":
        hx += stoop
    hy = top + head_r + (2 if kind == "elder" else 0)
    torso_t, torso_b = hy + head_r + 2, FOOT_Y - int(h * 0.42)
    tw = 11 if view in ("left", "right") else 15
    bob = 0 if step == 0 else -1  # body rises a little on walk frames

    # legs
    leg_top = torso_b - 2 + bob
    if view in ("left", "right"):
        s = 1 if view == "right" else -1
        for k, (dx, lift) in enumerate(((step * 6 * s, 0), (-step * 6 * s, 0))):
            c = dark if k == 1 else col
            fx = FOOT_X + dx
            d.polygon([(FOOT_X - 3, leg_top), (FOOT_X + 3, leg_top), (fx + 3, FOOT_Y - lift), (fx - 3, FOOT_Y - lift)], fill=c)
            d.rectangle([fx - 3 + (2 * s if s > 0 else -2), FOOT_Y - 3, fx + 3 + (2 * s if s > 0 else -2), FOOT_Y], fill=dark)
    else:
        for k, sx in enumerate((-4, 4)):
            lift = 3 if (step == -1 and k == 0) or (step == 1 and k == 1) else 0
            d.rectangle([FOOT_X + sx - 3, leg_top, FOOT_X + sx + 3, FOOT_Y - lift], fill=col)
            d.rectangle([FOOT_X + sx - 4, FOOT_Y - lift - 3, FOOT_X + sx + 4, FOOT_Y - lift], fill=dark)

    # torso (coat)
    cx = (FOOT_X + hx) // 2
    d.rounded_rectangle([cx - tw, torso_t + bob, cx + tw, torso_b + bob], radius=5, fill=col, outline=dark)

    # arms
    swing = step * 4
    if view in ("left", "right"):
        s = 1 if view == "right" else -1
        d.line([(cx, torso_t + 4 + bob), (cx + swing * s, torso_t + 26 + bob)], fill=dark, width=5)
    else:
        for sx in (-1, 1):
            d.line([(cx + sx * (tw + 1), torso_t + 4 + bob), (cx + sx * (tw + 3), torso_t + 26 + bob - sx * swing // 2)], fill=dark, width=4)

    # head
    d.ellipse([hx - head_r, hy - head_r + bob, hx + head_r, hy + head_r + bob], fill=HAIR[kind] if view == "up" else SKIN, outline=dark)
    if view != "up":
        hair = HAIR[kind]
        d.chord([hx - head_r, hy - head_r + bob, hx + head_r, hy + head_r + bob], 180, 360, fill=hair)
        if view == "down":
            for ex in (-3, 3):
                d.point((hx + ex, hy + 2 + bob), fill=(30, 25, 40))
        else:
            d.point((hx + (4 if view == "right" else -4), hy + 2 + bob), fill=(30, 25, 40))

    # props
    hand_y = torso_t + 26 + bob
    if prop == "bag":
        if view in ("down", "up"):
            bx = cx + (tw + 3 if view == "down" else -tw - 3)
        else:
            bx = cx + (-swing if view == "right" else swing)
        d.rectangle([bx - 5, hand_y, bx + 5, hand_y + 12], fill=(250, 240, 220), outline=dark)
        d.arc([bx - 3, hand_y - 4, bx + 3, hand_y + 2], 180, 360, fill=dark)
    elif prop == "parcel":
        d.rectangle([hx - head_r - 1, hy - head_r - 2 + bob, hx + head_r + 1, hy - 3 + bob], fill=(40, 120, 70))  # cap
        if view != "up":
            px = cx + (6 if view == "right" else -6 if view == "left" else 0)
            d.rectangle([px - 9, torso_t + 10 + bob, px + 9, torso_t + 24 + bob], fill=(196, 150, 96), outline=(110, 75, 40))
            d.line([(px - 9, torso_t + 17 + bob), (px + 9, torso_t + 17 + bob)], fill=(110, 75, 40))
        else:
            d.rectangle([cx - 8, torso_t + 4 + bob, cx + 8, torso_t + 20 + bob], fill=(40, 120, 70))  # backpack strap area
    elif prop == "cane":
        if view in ("left", "right"):
            s = 1 if view == "right" else -1
            tx = cx + 10 * s + (step * 2 * s)
        else:
            tx = cx + (tw + 5 if view == "down" else -tw - 5)
        d.line([(tx, hand_y - 2), (tx, FOOT_Y)], fill=(120, 80, 50), width=3)
        d.arc([tx - 4, hand_y - 6, tx + 4, hand_y + 2], 180, 360, fill=(120, 80, 50), width=2)
    elif prop == "stick":
        if view in ("left", "right"):
            s = 1 if view == "right" else -1
            sx = cx + 6 * s
        else:
            sx = cx + (tw + 4 if view == "down" else -tw - 4)
        d.line([(sx, torso_t + 2 + bob), (sx, torso_t - 14 + bob)], fill=(63, 224, 255), width=4)
        d.line([(sx, torso_t + 2 + bob), (sx, torso_t - 14 + bob)], fill=(220, 250, 255), width=1)


def sheet(kind):
    im = Image.new("RGBA", (FW * 12, FH), (0, 0, 0, 0))
    for vi, view in enumerate(("down", "left", "right", "up")):
        for fi, step in enumerate((-1, 0, 1)):
            fr = Image.new("RGBA", (FW, FH), (0, 0, 0, 0))
            figure(ImageDraw.Draw(fr), kind, view, step)
            im.paste(fr, ((vi * 3 + fi) * FW, 0))
    return im


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sprites", "npc")
    os.makedirs(out, exist_ok=True)
    for kind in KINDS:
        p = os.path.join(out, f"town_{kind}.png")
        sheet(kind).save(p)
        print("wrote", os.path.normpath(p))


if __name__ == "__main__":
    main()
