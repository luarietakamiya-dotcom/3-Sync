#!/usr/bin/env python3
"""Head-crop contact sheet for replaced gallery images (from converted webps)."""
import sys
from pathlib import Path
from PIL import Image, ImageDraw

slots = sys.argv[1:]
gallery = Path.home() / "workspace/ai-orchestra/3-Sync/game/gallery"
cell_w, cell_h, label_h = 480, 300, 26
cols = 3
rows = (len(slots) + cols - 1) // cols
sheet = Image.new("RGB", (cols * cell_w, rows * (cell_h + label_h)), (24, 24, 32))
d = ImageDraw.Draw(sheet)
for i, slot in enumerate(slots):
    im = Image.open(gallery / f"{slot}v2.webp").convert("RGB")
    w, h = im.size
    crop = im.crop((0, 0, w, int(h * 0.62)))
    crop.thumbnail((cell_w, cell_h))
    x = (i % cols) * cell_w + (cell_w - crop.width) // 2
    y = (i // cols) * (cell_h + label_h) + label_h
    sheet.paste(crop, (x, y))
    d.text(((i % cols) * cell_w + 8, (i // cols) * (cell_h + label_h) + 6), slot + " v2", fill=(255, 255, 120))
out = Path(__file__).resolve().parent / "head_crops_sheet.png"
sheet.save(out)
print("saved", out, sheet.size)
