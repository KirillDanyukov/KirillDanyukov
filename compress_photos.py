"""
Compress photos in Фото/ folder to 85% WebP quality.
Run once: python compress_photos.py
Requires: pip install Pillow
"""
import os
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("Pillow not found. Installing...")
    os.system("pip install Pillow")
    from PIL import Image

folder = Path(__file__).parent / "Фото"
quality = 70

total_before = 0
total_after = 0

for f in sorted(folder.glob("*.webp")):
    before = f.stat().st_size
    total_before += before

    img = Image.open(f)
    img.save(f, "WEBP", quality=quality, method=6)

    after = f.stat().st_size
    total_after += after

    saved = before - after
    pct = round(saved / before * 100)
    print(f"{f.name}: {before//1024} KB -> {after//1024} KB  (-{pct}%)")

print()
print(f"Total: {total_before//1024} KB -> {total_after//1024} KB  (saved {(total_before-total_after)//1024} KB, -{round((total_before-total_after)/total_before*100)}%)")
