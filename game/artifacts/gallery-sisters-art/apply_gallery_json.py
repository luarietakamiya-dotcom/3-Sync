#!/usr/bin/env python3
"""Set img/thumb for the 20 main gallery slots, surgically (compact JSON kept)."""
import json
import re
from pathlib import Path

SLOTS = [
    "g_of01", "g_of02", "g_of03", "g_of04", "g_of05", "g_of06",
    "g_so01", "g_so02", "g_so03",
    "g_cool01", "g_cool02", "g_cool03", "g_cool04", "g_cool05",
    "g_cool06", "g_cool07", "g_cool08", "g_cool09",
    "g_sp01", "g_sp02",
]

path = Path(__file__).resolve().parents[2] / "data" / "gallery.json"
raw = path.read_text(encoding="utf-8")
for slot in SLOTS:
    pattern = re.compile(r'("id":"' + slot + r'".*?)"img":"","thumb":""')
    new, n = pattern.subn(
        r'\1"img":"gallery/' + slot + r'.webp","thumb":"gallery/thumb/' + slot + r'.webp"', raw, count=1
    )
    if n != 1:
        raise SystemExit(f"FAILED to patch {slot} (n={n})")
    raw = new
data = json.loads(raw)
by_id = {it["id"]: it for it in data}
for slot in SLOTS:
    assert by_id[slot]["img"] == f"gallery/{slot}.webp", slot
    assert by_id[slot]["thumb"] == f"gallery/thumb/{slot}.webp", slot
path.write_text(raw, encoding="utf-8")
print("gallery.json updated for", len(SLOTS), "slots; total entries:", len(data))
