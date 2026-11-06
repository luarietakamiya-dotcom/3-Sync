#!/usr/bin/env python3
"""Assemble green-screen enemy frames into a game sprite strip.

Usage:
  python3 game/tools/build_enemy_sprite.py OUT.png [--size 64] [--margin 1] \
      FRAME [FRAME ...]

FRAME is  path[,flip][,air=N]
  flip   mirror left/right (to make every frame face the same way)
  air=N  frame is airborne: the bottom of its body box sits N px (output px)
         above the foot line instead of on it (jump frames). For a jump pose
         with a dangling tail the box bottom is the tail tip, so the paws stay
         well above the ground.

Steps (see game/README.md "敵のドット絵画像"):
  1. key out the green background (#00FF00) with soft alpha, un-mix the green
     from edge pixels and remove remaining green spill
  2. per frame, detect the body box (thin effects such as speed lines are
     ignored for measuring) and the foot line (bottom of the body)
  3. one scale for the whole enemy (largest that fits every frame), so the
     size never wobbles between frames
  4. area-average downscale, alpha snapped to 0/255
  5. foot line at y = size*56/64, body centred on x = size/2, frames joined in
     one row
"""
import sys, argparse
import numpy as np
from PIL import Image
from scipy import ndimage as nd

GREEN = np.array([3.0, 254.0, 7.0])
GN_BG, GN_FG = 200.0, 40.0   # greenness (G - max(R,B)) for full bg / full fg


def key(path, flip):
    a = np.asarray(Image.open(path).convert("RGB")).astype(np.float64)
    if flip:
        a = a[:, ::-1]
    gn = a[..., 1] - np.maximum(a[..., 0], a[..., 2])
    alpha = np.clip((GN_BG - gn) / (GN_BG - GN_FG), 0, 1)
    # un-mix: obs = alpha*F + (1-alpha)*GREEN
    al = np.maximum(alpha, 1e-3)[..., None]
    rgb = (a - (1 - al) * GREEN) / al
    rgb = np.clip(rgb, 0, 255)
    # spill: green may not exceed the larger of red/blue
    rgb[..., 1] = np.minimum(rgb[..., 1], np.maximum(rgb[..., 0], rgb[..., 2]))
    rgb[alpha <= 0] = 0
    return rgb, alpha


def body_box(alpha, open_px):
    """Box of the solid body; thin horizontal effects (speed lines, sparkles) are opened away.
    Vertical-only opening, so a thin tail/cable that runs sideways is still measured."""
    m = alpha > 0.5
    if open_px > 1:
        m = nd.binary_opening(m, structure=np.ones((open_px, 1), bool))
    lab, n = nd.label(m)
    if n == 0:
        raise SystemExit("empty frame")
    sizes = nd.sum(m, lab, range(1, n + 1))
    big = sizes.max()
    keep = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= big * 0.02])
    ys, xs = np.nonzero(keep)
    return xs.min(), xs.max() + 1, ys.min(), ys.max() + 1


def downscale(rgb, alpha, s):
    h, w = alpha.shape
    nw, nh = max(1, round(w * s)), max(1, round(h * s))
    pre = np.dstack([rgb * alpha[..., None], alpha * 255]).astype(np.float32)
    chans = [np.asarray(Image.fromarray(pre[..., i], "F").resize((nw, nh), Image.BOX)) for i in range(4)]
    out = np.dstack(chans)
    al = out[..., 3] / 255
    col = out[..., :3] / np.maximum(al, 1e-6)[..., None]
    res = np.zeros((nh, nw, 4), np.uint8)
    on = al >= 0.5
    res[..., :3] = np.clip(np.round(col), 0, 255).astype(np.uint8)
    res[..., 3] = np.where(on, 255, 0)
    res[~on, :3] = 0
    return res


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("frames", nargs="+")
    ap.add_argument("--size", type=int, default=64)
    ap.add_argument("--margin", type=int, default=1, help="free px kept at the frame sides/top")
    ap.add_argument("--open", type=int, default=31, help="opening size (source px) for body measuring")
    ap.add_argument("--report", action="store_true")
    o = ap.parse_args()
    S, foot = o.size, o.size * 56 // 64

    frames = []
    for spec in o.frames:
        parts = spec.split(",")
        flip = "flip" in parts[1:]
        air = next((int(p[4:]) for p in parts[1:] if p.startswith("air=")), 0)
        rgb, alpha = key(parts[0], flip)
        x0, x1, y0, y1 = body_box(alpha, o.open)
        frames.append(dict(path=parts[0], flip=flip, air=air, rgb=rgb, alpha=alpha, box=(x0, x1, y0, y1)))

    # one scale for the whole enemy: every body must fit width and height above its foot line
    avail_w = S - 2 * o.margin
    s = min(min(avail_w / (f["box"][1] - f["box"][0]),
                (foot - f["air"] - o.margin) / (f["box"][3] - f["box"][2])) for f in frames)

    sheet = np.zeros((S, S * len(frames), 4), np.uint8)
    for i, f in enumerate(frames):
        small = downscale(f["rgb"], f["alpha"], s)
        x0, x1, y0, y1 = f["box"]
        cx = (x0 + x1) / 2 * s
        by = y1 * s
        ox = round(S / 2 - cx)
        oy = round(foot - f["air"] - by)
        h, w = small.shape[:2]
        # paste with clipping
        dx0, dy0 = max(0, ox), max(0, oy)
        dx1, dy1 = min(S, ox + w), min(S, oy + h)
        tile = np.zeros((S, S, 4), np.uint8)
        tile[dy0:dy1, dx0:dx1] = small[dy0 - oy:dy1 - oy, dx0 - ox:dx1 - ox]
        lost = int((small[..., 3] > 0).sum() - (tile[..., 3] > 0).sum())
        sheet[:, i * S:(i + 1) * S] = tile
        ys, xs = np.nonzero(tile[..., 3])
        print(f"frame {i}: {f['path'].rsplit('/', 1)[-1][:48]} flip={f['flip']} air={f['air']} "
              f"bbox x{xs.min()}-{xs.max()} y{ys.min()}-{ys.max()} clipped_px={lost}")
    print(f"scale {s:.5f}  -> {sheet.shape[1]}x{sheet.shape[0]}")
    Image.fromarray(sheet, "RGBA").save(o.out, optimize=True)


if __name__ == "__main__":
    main()
