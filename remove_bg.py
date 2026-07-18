import sys
import os
from PIL import Image, ImageDraw

def remove_white_background(image_path, output_path, tolerance=15):
    print(f"Processing {image_path}...")
    try:
        img = Image.open(image_path)
    except Exception as e:
        print(f"Error opening image: {e}")
        return False

    img = img.convert("RGBA")
    width, height = img.size
    data = img.load()

    # Create a mask for flood fill
    # We want to find all pixels connected to the borders that are white/near-white
    # Using a queue for BFS flood fill
    visited = set()
    queue = []

    # Add all border pixels to queue
    for x in range(width):
        queue.append((x, 0))
        queue.append((x, height - 1))
    for y in range(height):
        queue.append((0, y))
        queue.append((width - 1, y))

    # Perform BFS
    print("Finding background pixels...")
    background_pixels = set()
    
    # We define near-white as R, G, B all above (255 - tolerance)
    threshold = 255 - tolerance

    while queue:
        cx, cy = queue.pop(0)
        if (cx, cy) in visited:
            continue
        visited.add((cx, cy))

        r, g, b, a = data[cx, cy]
        # Check if the pixel is near white
        if r >= threshold and g >= threshold and b >= threshold:
            background_pixels.add((cx, cy))
            
            # Check 4-neighbors
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = cx + dx, cy + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        queue.append((nx, ny))

    # Apply transparency to background pixels
    print(f"Applying transparency to {len(background_pixels)} pixels...")
    for x, y in background_pixels:
        data[x, y] = (0, 0, 0, 0)

    # Let's clean up any isolated white pixels at the edges with a slight border smoothing
    # We can also do a pass to smooth the edges if needed, but simple transparency is usually great.
    
    # Save output
    img.save(output_path, "PNG")
    print(f"Saved transparent image to {output_path}")
    return True

if __name__ == "__main__":
    # Install pillow if not installed
    # (Although ensure_pkg in build.py can do it, we can also do it here)
    artifacts_dir = r"C:\Users\STUD SQUAD\.gemini\antigravity-ide\brain\d6ebbfbc-782b-4541-bfd3-3e0d1652452f"
    img1 = os.path.join(artifacts_dir, "media__1781711636501.png")
    img2 = os.path.join(artifacts_dir, "media__1781711717154.jpg")

    workspace_dir = r"c:\Users\STUD SQUAD\Documents\Сайт-визитка"
    out1 = os.path.join(workspace_dir, "Фото", "character_full.png")
    out2 = os.path.join(workspace_dir, "Фото", "character_portrait.png")

    remove_white_background(img1, out1, tolerance=20)
    remove_white_background(img2, out2, tolerance=20)
