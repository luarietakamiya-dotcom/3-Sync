#!/usr/bin/env python3
"""Convert an album original to a WebP image and a centered 16:9 thumbnail."""

import argparse
import re
from pathlib import Path

from PIL import Image, ImageOps


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("original", type=Path)
    parser.add_argument("slot_id")
    args = parser.parse_args()
    if not re.fullmatch(r"g_[a-z0-9]+", args.slot_id):
        parser.error("slot_id must look like g_ar01")

    gallery = Path(__file__).resolve().parents[1] / "gallery"
    thumbs = gallery / "thumb"
    thumbs.mkdir(parents=True, exist_ok=True)
    filename = args.slot_id + ".webp"
    with Image.open(args.original) as source:
        has_alpha = "A" in source.getbands() or "transparency" in source.info
        image = ImageOps.exif_transpose(source).convert("RGBA" if has_alpha else "RGB")
        scale = 1920 / max(image.size)
        size = tuple(max(1, round(side * scale)) for side in image.size)
        full = image.resize(size, Image.Resampling.LANCZOS)
        full.save(gallery / filename, "WEBP", quality=82)
        thumb = ImageOps.fit(image, (480, 270), method=Image.Resampling.LANCZOS)
        thumb.save(thumbs / filename, "WEBP", quality=80)


if __name__ == "__main__":
    main()
