"""
Generate responsive image variants for the website.

Creates:
  Фото/responsive/Фото-N-{480,768,1200,1600,1920}.{avif,webp}
  Фото/downloads/Фото-N.png        (full-size PNG, for user download)
  Видео/responsive/Обложка-N-{480,768,1200}.{avif,webp}

Usage:
  python generate_images.py           # skip already-existing files
  python generate_images.py --force   # regenerate everything
"""

import io
import os
import re
import sys
from io import BytesIO
from pathlib import Path

# Force UTF-8 output on Windows (avoids cp1251 encode errors in print)
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

ROOT = Path(__file__).parent

# ── Install Pillow if needed ────────────────────────────────────────────────

def _ensure(import_name, pip_name=None):
    try:
        __import__(import_name)
        return True
    except ImportError:
        print(f"  Installing {pip_name or import_name}...")
        os.system(f'pip install {pip_name or import_name} -q')
        try:
            __import__(import_name)
            return True
        except ImportError:
            return False

print("Checking dependencies...")
if not _ensure('PIL', 'Pillow'):
    print("ERROR: Pillow installation failed. Run: pip install Pillow")
    sys.exit(1)

from PIL import Image

# Try AVIF ──────────────────────────────────────────────────────────────────
AVIF_OK = False
if _ensure('pillow_avif_plugin', 'pillow-avif-plugin'):
    try:
        import pillow_avif_plugin  # noqa: registers AVIF codec with Pillow
        _buf = BytesIO()
        Image.new('RGB', (4, 4)).save(_buf, 'AVIF', quality=60)
        AVIF_OK = True
        print("  AVIF support: YES")
    except Exception as e:
        print(f"  AVIF support: NO ({e})")
else:
    print("  AVIF support: NO (install failed)")

if not AVIF_OK:
    print("  Tip: pip install pillow-avif-plugin  (requires Windows Visual C++ Redist)")

# ── Settings ────────────────────────────────────────────────────────────────

PHOTO_SIZES  = [480, 768, 1200, 1600, 1920]  # widths for photos
THUMB_SIZES  = [480, 768, 1200]              # widths for video thumbnails

WEBP_QUALITY = 80
AVIF_QUALITY = 60

FORCE = '--force' in sys.argv

# ── Helpers ─────────────────────────────────────────────────────────────────

def file_slug(stem: str) -> str:
    """'Фото 3' → 'Фото-3', 'Обложка 1' → 'Обложка-1'"""
    return re.sub(r'\s+', '-', stem.strip())


def generate(src: Path, out_dir: Path, slug: str, sizes: list, dl_dir=None):
    """
    Resize src to each width in sizes, save as WebP (+ AVIF if available).
    Also saves a full-size PNG to dl_dir if given.
    Returns number of files written.
    """
    out_dir.mkdir(parents=True, exist_ok=True)

    img = Image.open(src)
    if img.mode not in ('RGB', 'RGBA'):
        img = img.convert('RGB')
    orig_w, orig_h = img.size

    written = 0

    for w in sizes:
        if w > orig_w:
            continue  # never upscale

        h = round(orig_h * w / orig_w)
        resized = img.copy()
        resized.thumbnail((w, h), Image.LANCZOS)

        # WebP
        webp_path = out_dir / f'{slug}-{w}.webp'
        if FORCE or not webp_path.exists():
            resized.save(webp_path, 'WEBP', quality=WEBP_QUALITY, method=6)
            written += 1

        # AVIF (if codec loaded)
        if AVIF_OK:
            avif_path = out_dir / f'{slug}-{w}.avif'
            if FORCE or not avif_path.exists():
                resized.save(avif_path, 'AVIF', quality=AVIF_QUALITY)
                written += 1

    # PNG download — original resolution, lossless
    if dl_dir is not None:
        dl_dir.mkdir(parents=True, exist_ok=True)
        png_path = dl_dir / f'{slug}.png'
        if FORCE or not png_path.exists():
            dl_img = img.convert('RGB')
            dl_img.save(png_path, 'PNG', optimize=True)
            written += 1

    return written, orig_w, orig_h


# ── Main ─────────────────────────────────────────────────────────────────────

def main():
    total_written = 0

    # ── Photos ──────────────────────────────────────────────────────────────
    photo_dir = ROOT / 'Фото'
    resp_dir  = photo_dir / 'responsive'
    dl_dir    = photo_dir / 'downloads'

    photos = sorted(photo_dir.glob('*.webp'), key=lambda p: p.name)
    print(f'\n[Photos] {len(photos)} source files -> Foto/responsive/ + Foto/downloads/')
    for src in photos:
        s = file_slug(src.stem)
        written, w, h = generate(src, resp_dir, s, PHOTO_SIZES, dl_dir)
        total_written += written
        status = f'+{written} new' if written else 'skip (exists)'
        orig_kb = src.stat().st_size // 1024
        print(f'  {src.name:26} {w}x{h}px  {orig_kb} KB  -> {status}')

    # ── Video thumbnails ────────────────────────────────────────────────────
    video_dir  = ROOT / 'Видео'
    vresp_dir  = video_dir / 'responsive'

    thumbs = sorted(video_dir.glob('Обложка*.webp'), key=lambda p: p.name)
    print(f'\n[Thumbnails] {len(thumbs)} source files -> Video/responsive/')
    for src in thumbs:
        s = file_slug(src.stem)
        written, w, h = generate(src, vresp_dir, s, THUMB_SIZES)
        total_written += written
        status = f'+{written} new' if written else 'skip (exists)'
        orig_kb = src.stat().st_size // 1024
        print(f'  {src.name:26} {w}x{h}px  {orig_kb} KB  -> {status}')

    formats = 'AVIF + WebP' if AVIF_OK else 'WebP only'
    print(f'\nDone! {total_written} files generated ({formats})')
    if not AVIF_OK:
        print('AVIF not generated. To enable: pip install pillow-avif-plugin')


if __name__ == '__main__':
    main()
