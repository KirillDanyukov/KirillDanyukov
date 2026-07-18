"""
Конвертирует Влево.png / Вправо.png → влево.webp / вправо.webp.
Убирает белый фон, обрезает пустые края, масштабирует под игру.

Запуск:  python generate_sprites.py
Требует: pip install Pillow
"""
import os
import sys

try:
    from PIL import Image
except ImportError:
    sys.exit("Установи Pillow:  pip install Pillow")

BASE = os.path.dirname(os.path.abspath(__file__))

# Итоговый размер спрайта в игре (px)
SPRITE_W = 90
SPRITE_H = 120

# (исходный файл, выходной файл)
PAIRS = [
    ("Влево.png",  "влево.webp"),
    ("Вправо.png", "вправо.webp"),
]


def remove_white(img, threshold=235):
    """Делает почти-белые и светло-серые пиксели прозрачными."""
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r >= threshold and g >= threshold and b >= threshold:
                px[x, y] = (r, g, b, 0)
    return img


def process(src_name, dst_name):
    src = os.path.join(BASE, src_name)
    dst = os.path.join(BASE, dst_name)

    if not os.path.exists(src):
        print(f"  [!] Не найден: {src}")
        return False

    print(f"  {src_name}", end="  ->  ")
    img = Image.open(src)

    # Убираем белый фон
    img = remove_white(img)

    # Обрезаем пустые края
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)

    # Масштабируем с сохранением пропорций, помещаем в canvas SPRITE_W × SPRITE_H
    img.thumbnail((SPRITE_W, SPRITE_H), Image.LANCZOS)
    canvas = Image.new("RGBA", (SPRITE_W, SPRITE_H), (0, 0, 0, 0))
    x_off = (SPRITE_W - img.width) // 2
    # Выравниваем по нижнему краю — ноги персонажа ровно на земле
    y_off = SPRITE_H - img.height
    canvas.paste(img, (x_off, y_off), img)

    canvas.save(dst, "WEBP", quality=85, method=4)
    size_kb = os.path.getsize(dst) / 1024
    print(f"{dst_name}  ({size_kb:.1f} KB)")
    return True


print("=== generate_sprites.py ===")
for src_n, dst_n in PAIRS:
    process(src_n, dst_n)
print("Готово!")
