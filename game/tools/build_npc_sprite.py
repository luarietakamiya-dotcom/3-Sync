#!/usr/bin/env python3
"""Assemble green-screen NPC frames (facility staff) into a 128x192 sprite strip.

Usage:
  python3 game/tools/build_npc_sprite.py OUT.png --height H [options] FRAME [FRAME ...]

  FRAME   path[,flip]   (flip = mirror left/right so every frame faces the same way)
  Frames in game order: 0,1 = idle, 2,3 = talk (data/npcs.json "anim").

Options:
  --height H     body height in output px, shoe sole to top of the hair (= "bodyH" in
                 data/npcs.json; settle it first with ?npcdebug=1). Max 184, 176 or less
                 recommended so the head keeps some room.
  --fit each     (default) every frame is scaled to exactly H. Image generators draw
                 each frame at a slightly different size; this removes the wobble.
  --fit common   one scale for all frames, taken from frame --ref (default 0). Use it
                 when the frames come from one consistent sheet.
  --anchor feet  (default) centre of the feet on x=64; "box" = centre of the body box.
  --margin N     free px kept at the frame sides (default 2)
  --readable     rim + lift pass of build_enemy_sprite.py for dark figures on dark
                 interiors (--facing / --rim-mix / --lift as there)
  --preview BG.png --at X,FOOTY[,CLIPY] PREVIEW.png
                 also write frame 0 placed on the interior background exactly as the game
                 draws it (scale 1, clipped below CLIPY), plus a 3x crop around it.

Steps:
  1. key out the green (#00FF00) background (same keying as the enemy tool)
  2. per frame, detect the body box (alpha > 0.5, specks under 2% of the largest part
     are ignored) and the foot line (bottom of the body)
  3. scale so the body box height is H (see --fit), area-average downscale, alpha 0/255
  4. foot line at y=188 (4 px free below), feet centred on x=64, frames joined in one row
Fails when a frame would not fit the 128 px width (ask for a narrower pose rather than
shrinking the figure, so the body height stays what was settled in the game).
"""
import os
import sys
import argparse
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_enemy_sprite import key, body_box, downscale, readable  # noqa: E402

FW, FH, FOOT_X, FOOT_Y = 128, 192, 64, 188
MAX_H, REC_H = FOOT_Y - 4, 176


def feet_x(alpha, box, band=0.06):
    """x centre of the opaque pixels in the bottom `band` of the body box (source px)."""
    x0, x1, y0, y1 = box
    yb = max(y0, int(round(y1 - (y1 - y0) * band)))
    m = alpha[yb:y1, x0:x1] > 0.5
    xs = np.nonzero(m)[1]
    return (x0 + x1) / 2 if xs.size == 0 else x0 + xs.mean() + 0.5


def build(o):
    if not 20 <= o.height <= MAX_H:
        raise SystemExit(f"--height must be 20..{MAX_H}")
    if o.height > REC_H:
        print(f"note: height {o.height} > {REC_H}: little room above the head")
    frames = []
    for spec in o.frames:
        parts = spec.split(",")
        rgb, alpha = key(parts[0], "flip" in parts[1:])
        box = body_box(alpha, o.open)
        frames.append(dict(path=parts[0], rgb=rgb, alpha=alpha, box=box))
    if len(frames) != 4:
        print(f"note: {len(frames)} frames (the NPC spec is 4: idle 2 + talk 2)")

    ref_s = o.height / (frames[o.ref]["box"][3] - frames[o.ref]["box"][2])
    sheet = np.zeros((FH, FW * len(frames), 4), np.uint8)
    scales, bad = [], []
    for i, f in enumerate(frames):
        x0, x1, y0, y1 = f["box"]
        s = o.height / (y1 - y0) if o.fit == "each" else ref_s
        scales.append(s)
        small = downscale(f["rgb"], f["alpha"], s)
        # align on the downscaled pixels (rounding in the resize would otherwise shift the sole by 1 px)
        sa = small[..., 3].astype(np.float64) / 255
        sbox = body_box(sa, 1)
        cx = feet_x(sa, sbox) if o.anchor == "feet" else (sbox[0] + sbox[1]) / 2
        ox, oy = round(FOOT_X - cx), FOOT_Y - sbox[3]
        h, w = small.shape[:2]
        tile = np.zeros((FH, FW, 4), np.uint8)
        dx0, dy0, dx1, dy1 = max(0, ox), max(0, oy), min(FW, ox + w), min(FH, oy + h)
        if dx1 > dx0 and dy1 > dy0:
            tile[dy0:dy1, dx0:dx1] = small[dy0 - oy:dy1 - oy, dx0 - ox:dx1 - ox]
        lost = int((small[..., 3] > 0).sum() - (tile[..., 3] > 0).sum())
        if o.readable:
            tile = readable(tile, o.facing, o.rim_mix, o.lift)
        sheet[:, i * FW:(i + 1) * FW] = tile
        ys, xs = np.nonzero(tile[..., 3])
        side = min(xs.min(), FW - 1 - xs.max()) if xs.size else FW
        print(f"frame {i}: {os.path.basename(f['path'])[:44]} scale={s:.5f} "
              f"body x{xs.min()}-{xs.max()} y{ys.min()}-{ys.max()} (h={ys.max() - ys.min() + 1}) clipped_px={lost}")
        if lost or side < o.margin:
            bad.append(i)
    if o.fit == "each" and max(scales) / min(scales) > 1.08:
        print("note: frame scales differ by more than 8% - check that every frame shows the same full body")
    if bad:
        raise SystemExit(f"frames {bad} do not fit 128 px wide with margin {o.margin}: "
                         "use a narrower pose (arms closer to the body) or a smaller --height")
    Image.fromarray(sheet, "RGBA").save(o.out, optimize=True)
    print(f"-> {o.out} {sheet.shape[1]}x{sheet.shape[0]}  foot (64,188)  bodyH {o.height}")
    return sheet


def preview(sheet, o):
    bg = Image.open(o.preview[0]).convert("RGBA")
    at = [int(v) for v in o.at.split(",")]
    x, fy, clip = at[0], at[1], (at[2] if len(at) > 2 else None)
    fr = Image.fromarray(sheet[:, :FW])
    lay = Image.new("RGBA", bg.size, (0, 0, 0, 0))
    lay.paste(fr, (round(x - FOOT_X), round(fy - FOOT_Y)))
    if clip is not None:
        lay.paste((0, 0, 0, 0), (0, clip, bg.size[0], bg.size[1]))
    out = Image.alpha_composite(bg, lay)
    cx0, cy0 = max(0, x - 120), 0
    crop = out.crop((cx0, cy0, min(bg.size[0], cx0 + 240), bg.size[1]))
    crop = crop.resize((crop.width * 3, crop.height * 3), Image.NEAREST)
    sheet_img = Image.new("RGBA", (max(out.width, crop.width), out.height + crop.height), (7, 6, 12, 255))
    sheet_img.paste(out, (0, 0))
    sheet_img.paste(crop, (0, out.height))
    sheet_img.save(o.preview[1])
    print(f"preview -> {o.preview[1]}")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("out")
    ap.add_argument("frames", nargs="+")
    ap.add_argument("--height", type=int, required=True)
    ap.add_argument("--fit", choices=["each", "common"], default="each")
    ap.add_argument("--ref", type=int, default=0)
    ap.add_argument("--anchor", choices=["feet", "box"], default="feet")
    ap.add_argument("--margin", type=int, default=2)
    ap.add_argument("--open", type=int, default=1, help="vertical opening (source px) before measuring; 1 = off")
    ap.add_argument("--readable", action="store_true")
    ap.add_argument("--facing", choices=["left", "right"], default="left")
    ap.add_argument("--rim-mix", type=float, default=0.7)
    ap.add_argument("--lift", type=float, default=0.22)
    ap.add_argument("--preview", nargs=2, metavar=("BG", "OUT"))
    ap.add_argument("--at", help="X,FOOTY[,CLIPY] on the 960x300 background (with --preview)")
    o = ap.parse_args()
    if o.preview and not o.at:
        ap.error("--preview needs --at X,FOOTY[,CLIPY]")
    if not 0 <= o.ref < len(o.frames):
        ap.error("--ref out of range")
    sheet = build(o)
    if o.preview:
        preview(sheet, o)


if __name__ == "__main__":
    main()
