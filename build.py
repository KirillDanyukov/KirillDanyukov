"""
Build script: minify HTML/CSS/JS, inline critical CSS for fast first render.
Creates dist/ folder ready to deploy.

Run: python build.py
Deploy: upload contents of dist/ to your hosting.
Netlify/Vercel: Build command = python build.py, Publish dir = dist
"""
import os
import re
import hashlib
import shutil
from pathlib import Path

ROOT = Path(__file__).parent
DIST = ROOT / 'dist'


def ensure_pkg(import_name, pip_name=None):
    try:
        return __import__(import_name)
    except ImportError:
        print(f"Installing {pip_name or import_name}...")
        os.system(f'pip install {pip_name or import_name} -q')
        return __import__(import_name)


rcssmin = ensure_pkg('rcssmin')
rjsmin  = ensure_pkg('rjsmin')
htmlmin = ensure_pkg('htmlmin')

# --- recreate dist/ ---
if DIST.exists():
    shutil.rmtree(DIST)
DIST.mkdir()

print("Building dist/ ...\n")

# ── 1. CSS: extract critical CSS (above fold) + minify full CSS ───────────────
css_src = (ROOT / 'styles.css').read_text(encoding='utf-8')

# Critical CSS = everything before the Experience section (hero + base styles)
# This is what the user sees without scrolling — inlined in HTML for instant render
split_at = '/* === EXPERIENCE ==='
split_idx = css_src.find(split_at)
critical_raw = css_src[:split_idx] if split_idx > 0 else css_src[:4000]
critical_css = rcssmin.cssmin(critical_raw)

full_css = rcssmin.cssmin(css_src)
(DIST / 'styles.css').write_text(full_css, encoding='utf-8')
print(f"styles.css : {len(css_src.encode())//1024} KB -> {len(full_css.encode())//1024} KB")
print(f"           : {len(critical_css)} bytes extracted as critical CSS (inlined)")

# ── 2. HTML: minify, inline critical CSS, make full CSS non-render-blocking ───
html_src = (ROOT / 'index.html').read_text(encoding='utf-8')
try:
    html_work = htmlmin.minify(
        html_src,
        remove_comments=True,
        remove_empty_space=True,
        reduce_boolean_attributes=True,
        remove_optional_attribute_quotes=False,
    )
except Exception:
    html_work = re.sub(r'<!--(?!\[if).*?-->', '', html_src, flags=re.DOTALL)

# Make styles.css non-render-blocking:
# 1. Inline critical CSS so the hero section renders immediately
# 2. Preload + async-apply the full stylesheet in the background
async_css = (
    f'<style>{critical_css}</style>'
    '<link rel="preload" href="styles.css" as="style"'
    " onload=\"this.onload=null;this.rel='stylesheet'\">"
    '<noscript><link rel="stylesheet" href="styles.css"></noscript>'
)
html_work = re.sub(
    r'<link\s+rel="stylesheet"\s+href="styles\.css">',
    async_css,
    html_work,
    count=1
)

# Preload hero image so it starts downloading before the DOM is rendered
hero_preload = '<link rel="preload" href="Фото/Фото 1.webp" as="image" type="image/webp">'
html_work = html_work.replace('</head>', hero_preload + '</head>', 1)

(DIST / 'index.html').write_text(html_work, encoding='utf-8')
print(f"index.html : {len(html_src.encode())//1024} KB -> {len(html_work.encode())//1024} KB  (critical CSS inlined, async full CSS)")

# ── 3. JS: minify only — no obfuscation (obfuscation adds 33% size overhead) ─
for js_name in ('script.js', 'lang.js'):
    js_src = (ROOT / js_name).read_text(encoding='utf-8')
    js_min = rjsmin.jsmin(js_src)
    (DIST / js_name).write_text(js_min, encoding='utf-8')
    print(f"{js_name:<12}: {len(js_src.encode())//1024} KB -> {len(js_min.encode())//1024} KB")

# ── 4. Service Worker: minify, auto-version based on content hash ─────────────
# Version hash changes automatically whenever any main file is updated,
# which forces all visitors to invalidate the old cache and fetch fresh files.
main_files = ('index.html', 'styles.css', 'script.js', 'lang.js')
content_hash = hashlib.md5(b''.join((ROOT / f).read_bytes() for f in main_files)).hexdigest()[:8]
cache_ver = f'v_{content_hash}'

sw_src = (ROOT / 'sw.js').read_text(encoding='utf-8')
sw_min = rjsmin.jsmin(sw_src).replace("'v2'", f"'{cache_ver}'")
(DIST / 'sw.js').write_text(sw_min, encoding='utf-8')
print(f"sw.js      : cache {cache_ver}  (auto-versioned by content hash)")

# ── 5. Fonts: minify CSS, copy woff2 ─────────────────────────────────────────
fonts_dir = ROOT / 'fonts'
(DIST / 'fonts').mkdir(parents=True, exist_ok=True)
fonts_css_src = (fonts_dir / 'fonts.css').read_text(encoding='utf-8')
(DIST / 'fonts' / 'fonts.css').write_text(rcssmin.cssmin(fonts_css_src), encoding='utf-8')
for woff in fonts_dir.glob('*.woff2'):
    shutil.copy2(woff, DIST / 'fonts' / woff.name)
woff_total = sum(f.stat().st_size for f in fonts_dir.glob('*.woff2')) // 1024
print(f"fonts/     : {len(list(fonts_dir.glob('*.woff2')))} woff2 files ({woff_total} KB)")

# ── 6. Copy assets unchanged ──────────────────────────────────────────────────
for dir_name in ('Фото', 'Видео', 'Субтитры'):
    src = ROOT / dir_name
    if src.exists():
        shutil.copytree(src, DIST / dir_name)
        size_kb = sum(f.stat().st_size for f in src.rglob('*') if f.is_file()) // 1024
        print(f"{dir_name}/ : {size_kb} KB")

for name in ('favicon.svg', 'favicon.ico'):
    f = ROOT / name
    if f.exists():
        shutil.copy2(f, DIST / name)

# ── Summary ───────────────────────────────────────────────────────────────────
total_kb = sum(f.stat().st_size for f in DIST.rglob('*') if f.is_file()) // 1024
print(f"\nDone!  dist/ total: {total_kb} KB")
print(f"Deploy the contents of: {DIST}")
