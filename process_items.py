import os
import sys
from PIL import Image

BASE = os.path.dirname(os.path.abspath(__file__))
ITEMS_DIR = os.path.join(BASE, "Предметы")

def process_image(src_path, dst_path):
    print(f"Processing {os.path.basename(src_path)}...")
    img = Image.open(src_path).convert("RGBA")
    w, h = img.size
    
    # We want to identify the light background. 
    # Let's perform a flood-fill starting from all border pixels.
    # A pixel is considered background if its R, G, B components are all above 215.
    pixels = img.load()
    mask = Image.new("L", (w, h), 255) # 255 means foreground, 0 means background
    mask_pixels = mask.load()
    
    # Queue for flood fill
    queue = []
    is_bg_color = lambda r, g, b: (r > 215 and g > 215 and b > 215)
    
    # Scan borders for seed points
    for x in range(w):
        if is_bg_color(*pixels[x, 0][:3]):
            queue.append((x, 0))
            mask_pixels[x, 0] = 0
        if is_bg_color(*pixels[x, h - 1][:3]):
            queue.append((x, h - 1))
            mask_pixels[x, h - 1] = 0
    for y in range(h):
        if is_bg_color(*pixels[0, y][:3]):
            queue.append((0, y))
            mask_pixels[0, y] = 0
        if is_bg_color(*pixels[w - 1, y][:3]):
            queue.append((w - 1, y))
            mask_pixels[w - 1, y] = 0
            
    # Breadth-first search flood-fill
    directions = [(1, 0), (-1, 0), (0, 1), (0, -1)]
    while queue:
        cx, cy = queue.pop(0)
        for dx, dy in directions:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h:
                if mask_pixels[nx, ny] == 255:
                    r, g, b, a = pixels[nx, ny]
                    if is_bg_color(r, g, b):
                        mask_pixels[nx, ny] = 0
                        queue.append((nx, ny))
                        
    # Apply mask and feather edges
    # We check if a pixel is adjacent to the background and has a high color value.
    # To prevent white outlines (which are common in extracted elements), we reduce their alpha
    # and blend them slightly with dark values to eliminate the white fringe.
    for y in range(h):
        for x in range(w):
            if mask_pixels[x, y] == 0:
                pixels[x, y] = (0, 0, 0, 0)
            else:
                # Check for anti-aliasing near borders
                is_near_bg = False
                for dx, dy in directions:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and mask_pixels[nx, ny] == 0:
                        is_near_bg = True
                        break
                if is_near_bg:
                    r, g, b, a = pixels[x, y]
                    brightness = (r + g + b) / 3
                    if brightness > 140:
                        # Soften alpha based on brightness
                        alpha_reduction = int((brightness - 140) * 2.2)
                        new_a = max(0, 255 - alpha_reduction)
                        # Darken the pixel to blend away the white fringe
                        pixels[x, y] = (int(r * 0.7), int(g * 0.7), int(b * 0.7), new_a)

    # Crop out transparent border regions
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    
    # Save as WebP
    img.save(dst_path, "WEBP", quality=92, method=6)
    size_kb = os.path.getsize(dst_path) / 1024
    print(f"  Saved to {os.path.basename(dst_path)} ({size_kb:.1f} KB, dimensions: {img.size[0]}x{img.size[1]})")

def main():
    if not os.path.exists(ITEMS_DIR):
        print(f"Directory {ITEMS_DIR} not found!")
        sys.exit(1)
        
    # Find all PNG files starting with 'ChatGPT Image'
    png_files = [f for f in os.listdir(ITEMS_DIR) if f.lower().endswith(".png") and f.startswith("ChatGPT")]
    png_files.sort()
    
    if not png_files:
        print("No ChatGPT PNG images found in Предметы directory!")
        sys.exit(1)
        
    for i, file_name in enumerate(png_files):
        src_path = os.path.join(ITEMS_DIR, file_name)
        dst_path = os.path.join(ITEMS_DIR, f"item{i+1}.webp")
        process_image(src_path, dst_path)
        
    print("All items processed successfully!")

if __name__ == "__main__":
    main()
