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
  6. optional readability pass for dark enemies on dark ground (--readable),
     applied to each finished frame:
       a. rim: a 2 px light blue-grey edge only where the outline carries the
          shape: edges facing up (head, ears, back, shoulders), the front of
          the head/chest (--facing side) and the bottom of the paws. Thin parts
          (tail cable, speed lines) and glow pixels are left alone. 2 px so it
          survives the in-game nearest-neighbour shrink (64 -> ~33 px).
       b. lift: dark body pixels are raised one step toward blue-grey, more on
          the solid masses (face, torso) than on thin legs, so head and torso
          read without the cyan lines; still a dark machine.
       c. glow: existing cyan pixels get a small boost only (no new glow, no
          blur).
     Strengths: --rim-mix, --lift (0 disables a step).
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


RIM = np.array([142.0, 160.0, 186.0])     # light blue-grey edge
LIFT_TO = np.array([118.0, 124.0, 148.0])  # blue-grey the body is pulled toward


def glow_mask(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    cyan = (b > 140) & (g > 120) & (r < 120) & (b - r > 60)
    magenta = (r > 150) & (g < 100) & (r - g > 70)
    return cyan, magenta


def readable(tile, facing="left", rim_mix=0.7, lift=0.22):
    """Step 6 of the docstring. tile: SxSx4 uint8 with alpha 0/255."""
    m = tile[..., 3] > 0
    if not m.any():
        return tile
    rgb = tile[..., :3].astype(np.float64)
    cyan, magenta = glow_mask(rgb)
    glow = cyan | magenta
    inside = nd.distance_transform_edt(m)              # 1 = outermost px
    thick = nd.maximum_filter(inside, size=5)           # local half-thickness
    ys, xs = np.nonzero(m)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    hgt, wid = y1 - y0 + 1, x1 - x0 + 1
    yy, xx = np.mgrid[0:m.shape[0], 0:m.shape[1]]

    # b. lift: weight 1 on solid masses, ~0.4 on thin legs/cables
    if lift > 0:
        w = np.clip((thick - 1.5) / 2.5, 0.4, 1.0)
        k = (lift * w)[..., None]
        body = m & ~glow
        rgb[body] = (rgb + (LIFT_TO - rgb) * k)[body]

    # c. glow: small boost of existing cyan only
    if lift > 0:
        rgb[cyan] = np.minimum(255, rgb[cyan] * 1.08 + 6)

    # a. rim on selected edges
    if rim_mix > 0:
        sm = nd.gaussian_filter(m.astype(np.float64), 1.6)
        gy, gx = np.gradient(sm)
        n = np.hypot(gx, gy) + 1e-9
        nx, ny = -gx / n, -gy / n                       # outward normal
        band = m & (inside <= 2)
        solid = thick >= 2.5                              # not tail cable / effects
        up = ny < -0.45
        front_x = -1 if facing == "left" else 1
        front_zone = (xx - x0 < wid * 0.4) if facing == "left" else (x1 - xx < wid * 0.4)
        front = (nx * front_x > 0.55) & front_zone & (yy - y0 < hgt * 0.75)
        paws = (ny > 0.45) & (yy - y0 > hgt * 0.7)
        sel = band & solid & ~glow & (up | front | paws)
        mix = np.where(inside <= 1, rim_mix, rim_mix * 0.65)[..., None]
        # never darken: the rim only lightens
        target = np.maximum(RIM, rgb)
        rgb[sel] = (rgb + (target - rgb) * mix)[sel]

    out = tile.copy()
    out[..., :3] = np.where(m[..., None], np.clip(np.round(rgb), 0, 255), 0).astype(np.uint8)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("out")
    ap.add_argument("frames", nargs="+")
    ap.add_argument("--size", type=int, default=64)
    ap.add_argument("--margin", type=int, default=1, help="free px kept at the frame sides/top")
    ap.add_argument("--open", type=int, default=31, help="opening size (source px) for body measuring")
    ap.add_argument("--report", action="store_true")
    ap.add_argument("--readable", action="store_true", help="step 6: rim + lift for dark enemies")
    ap.add_argument("--facing", choices=["left", "right"], default="left", help="side the head faces (step 6 front rim)")
    ap.add_argument("--rim-mix", type=float, default=0.7)
    ap.add_argument("--lift", type=float, default=0.22)
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
        if o.readable:
            tile = readable(tile, o.facing, o.rim_mix, o.lift)
        sheet[:, i * S:(i + 1) * S] = tile
        ys, xs = np.nonzero(tile[..., 3])
        print(f"frame {i}: {f['path'].rsplit('/', 1)[-1][:48]} flip={f['flip']} air={f['air']} "
              f"bbox x{xs.min()}-{xs.max()} y{ys.min()}-{ys.max()} clipped_px={lost}")
    print(f"scale {s:.5f}  -> {sheet.shape[1]}x{sheet.shape[0]}")
    Image.fromarray(sheet, "RGBA").save(o.out, optimize=True)


if __name__ == "__main__":
    main()
