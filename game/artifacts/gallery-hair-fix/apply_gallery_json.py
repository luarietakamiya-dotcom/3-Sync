#!/usr/bin/env python3
"""Swap replaced gallery slots to v2 filenames, surgically (compact JSON kept)."""
import json
import re
import sys
from pathlib import Path

SLOTS = sys.argv[1:]
path = Path(__file__).resolve().parents[2] / "data" / "gallery.json"
raw = path.read_text(encoding="utf-8")
for slot in SLOTS:
    pattern = re.compile(
        r'("id":"' + slot + r'".*?)"img":"gallery/' + slot + r'\.webp","thumb":"gallery/thumb/' + slot + r'\.webp"'
    )
    new, n = pattern.subn(
        r'\1"img":"gallery/' + slot + r'v2.webp","thumb":"gallery/thumb/' + slot + r'v2.webp"', raw, count=1
    )
    if n != 1:
        raise SystemExit(f"FAILED to patch {slot} (n={n})")
    raw = new
data = json.loads(raw)
by_id = {it["id"]: it for it in data}
for slot in SLOTS:
    assert by_id[slot]["img"] == f"gallery/{slot}v2.webp", slot
    assert by_id[slot]["thumb"] == f"gallery/thumb/{slot}v2.webp", slot
path.write_text(raw, encoding="utf-8")
print("gallery.json updated for", len(SLOTS), "slots")
