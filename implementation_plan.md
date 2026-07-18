# Implementation Plan — Mobile Layout, Speed Optimization, and Code Cleanup

This plan details the implementation of fixes for the game aspect ratio on mobile, speed optimizations for slow internet connections, instant photo loading, and cleanup of unused files.

## Proposed Changes

---

### [Styles & Layout]

#### [MODIFY] [styles.css](file:///c:/Users/STUD%20SQUAD/Documents/%D0%A1%D0%B0%D0%B9%D1%82-%D0%B2%D0%B8%D0%B7%D0%B8%D1%82%D0%BA%D0%B0/styles.css)
- Update `.game-modal-inner` style to dynamically size and keep a strict `3:4` aspect ratio, preventing stretching:
  ```css
  .game-modal-inner {
    position: relative;
    width: min(480px, 90vw, calc(90vh * 3 / 4));
    aspect-ratio: 3 / 4;
    border: 4px solid var(--accent);
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.7);
    background: #c8e6f5;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
    container-type: size;
    container-name: gameContainer;
  }
  ```
- Remove explicit `height` and `max-height` constraints on `.game-modal-inner` that override and distort the aspect ratio.
- Set `cursor: zoom-in` on photo wrappers `.sketch-photo-wrap` and `.who-photo-wrap` so users know the entire card is clickable.

---

### [Scripts & Lightbox]

#### [MODIFY] [script.js](file:///c:/Users/STUD%20SQUAD/Documents/%D0%A1%D0%B0%D0%B9%D1%82-%D0%B2%D0%B8%D0%B7%D0%B8%D1%82%D0%BA%D0%B0/script.js)
- Modify photo click listeners to bind to the wrappers (`.sketch-photo-wrap` and `.who-photo-wrap`) instead of only the raw image, making the entire photo frame/card area clickable.
- Update `openPhotoLightbox` to implement **progressive loading**:
  - Immediately set the modal image `src` to the current `previewSrc` (the low-res/compressed image already loaded and cached by the browser). This guarantees the lightbox opens instantly (0ms delay).
  - In the background, load the high-res original `data-orig` image using an in-memory `Image()` element, and swap `photoModalImg.src` to the sharp original as soon as it completes.
- Add background preloading/prefetching of original high-res photos after the initial page load is complete (idle time), staggering them to avoid congesting slow networks.
- Update hero photo download link from `'Кирилл-Данюков-фото-1.png'` to `'Фото/downloads/Фото-1.png'`.

---

### [Service Worker & Cache Optimizations]

#### [MODIFY] [sw.js](file:///c:/Users/STUD%20SQUAD/Documents/%D0%A1%D0%B0%D0%B9%D1%82-%D0%B2%D0%B8%D0%B7%D0%B8%D1%82%D0%BA%D0%B0/sw.js)
- Trim the Service Worker `PRECACHE` array to the absolute bare minimum (critical layout CSS/JS and font dependencies).
- Remove unused fonts, large video cover preview thumbnails, and full fallback photos from precache.
- Optimize navigation/HTML requests by adopting a **Stale-While-Revalidate** caching strategy. This ensures subsequent visits to the website open instantly (0ms network delay), even under high latency (700ms ping).

---

### [Junk Files & Code Cleanup]

#### [MODIFY] [fonts.css](file:///c:/Users/STUD%20SQUAD/Documents/%D0%A1%D0%B0%D0%B9%D1%82-%D0%B2%D0%B8%D0%B7%D0%B8%D1%82%D0%BA%D0%B0/fonts/fonts.css)
- Delete unused `@font-face` blocks for `'Indie Flower'` and `'Patrick Hand'`.

#### [DELETE] [indie-flower-400.woff2](file:///c:/Users/STUD%20SQUAD/Documents/%D0%A1%D0%B0%D0%B9%D1%82-%D0%B2%D0%B8%D0%B7%D0%B8%D1%82%D0%BA%D0%B0/fonts/indie-flower-400.woff2)
- Unused font file.

#### [DELETE] [patrick-hand-400.woff2](file:///c:/Users/STUD%20SQUAD/Documents/%D0%A1%D0%B0%D0%B9%D1%82-%D0%B2%D0%B8%D0%B7%D0%B8%D1%82%D0%BA%D0%B0/fonts/patrick-hand-400.woff2)
- Unused font file.

#### [DELETE] [scores.json](file:///c:/Users/STUD%20SQUAD/Documents/%D0%A1%D0%B0%D0%B9%D1%82-%D0%B2%D0%B8%D0%B7%D0%B8%D1%82%D0%BA%D0%B0/scores.json)
- Unused local records file (game uses localStorage).

#### [DELETE] [Кирилл-Данюков-фото-1.png](file:///c:/Users/STUD%20SQUAD/Documents/%D0%A1%D0%B0%D0%B9%D1%82-%D0%B2%D0%B8%D0%B7%D0%B8%D1%82%D0%BA%D0%B0/%D0%9A%D0%B8%D1%80%D0%B8%D0%BB%D0%BB-%D0%94%D0%B0%D0%BD%D1%8e%D0%BA%D0%BE%D0%B2-%D1%84%D0%BE%D1%82%D0%BE-1.png)
- Duplicate of `Фото/downloads/Фото-1.png`.

---

## Verification Plan

### Automated Build Verification
- Execute `python build.py` to compile the cleaned source assets to `dist/`.
- Ensure no compilation or path resolution errors occur in the build process.

### Manual Verification (Browser)
- Open `http://localhost:8080` (or `dist/index.html`).
- Inspect the game container aspect ratio under mobile responsive viewports:
  - Width and height should scale proportionally (3:4 ratio).
  - Game elements and character should not look stretched.
- Perform network throttling (e.g. Fast 3G or custom 700ms latency) and confirm:
  - Service worker caches correctly and subsequent page reloads load instantly.
  - Clicking any area of a photo opens the modal with the cached low-res preview instantly, and then smoothly updates to high-res.
