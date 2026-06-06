import os
for k in ['HTTP_PROXY','HTTPS_PROXY','ALL_PROXY','http_proxy','https_proxy','all_proxy']:
    os.environ.pop(k, None)
os.environ['NO_PROXY'] = '*'

from playwright.sync_api import sync_playwright
import urllib.parse, json

SITE = "c:/Users/STUD SQUAD/Documents/Мой сайт — копия/index.html"
FILE_URL = "file:///" + SITE.replace(" ", "%20").replace("\\", "/")

CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe"

with sync_playwright() as p:
    browser = p.chromium.launch(
        executable_path=CHROME,
        headless=True,
        args=[
            '--no-sandbox',
            '--no-proxy-server',
            '--allow-file-access-from-files',  # allows fetch() on file://
            '--disable-web-security',
        ]
    )
    page = browser.new_page()

    print(f"Opening: {FILE_URL}")
    page.goto(FILE_URL, wait_until="domcontentloaded")
    page.wait_for_timeout(2000)
    print("Page loaded OK")

    # TEST 1: Fetch VTT via JS
    print("\n=== TEST 1: Fetch VTT (Видео 1 ru) ===")
    r1 = page.evaluate("""async () => {
        try {
            const r = await fetch('Субтитры/Видео 1_ru.vtt');
            const t = await r.text();
            return {ok: r.ok, status: r.status, len: t.length, first80: t.substring(0,80)};
        } catch(e) { return {error: e.message}; }
    }""")
    print(json.dumps(r1, ensure_ascii=False, indent=2))

    # TEST 2: Click Video 1 card
    print("\n=== TEST 2: Click Video 1 card ===")
    page.locator('.work-card').first.click()
    page.wait_for_timeout(2000)
    modal = page.evaluate("document.getElementById('videoModal').classList.contains('active')")
    print(f"Modal open: {modal}")

    # TEST 3: Select Russian subtitle
    print("\n=== TEST 3: Select Russian subtitle ===")
    page.evaluate("document.querySelector('.sub-option[data-lang=\"ru\"]').click()")
    page.wait_for_timeout(2000)
    state = page.evaluate("""(() => ({
        lang: currentSubLang,
        cues: currentSubCues.length,
        display: document.getElementById('subtitleDisplay').innerHTML.substring(0,120)
    }))()""")
    print(json.dumps(state, ensure_ascii=False, indent=2))

    # TEST 4: Seek to 3s, check display
    print("\n=== TEST 4: Seek 3s ===")
    page.evaluate("document.getElementById('mainVideo').currentTime = 3")
    page.wait_for_timeout(800)
    disp = page.evaluate("document.getElementById('subtitleDisplay').innerHTML")
    print(f"Display: {disp[:200]}")

    # Screenshot
    page.screenshot(path="c:/Users/STUD SQUAD/Documents/Мой сайт — копия/subtitle_test.png")
    print("Screenshot: subtitle_test.png")

    # TEST 5: All 80 VTT files
    print("\n=== TEST 5: All VTT cue counts ===")
    data = page.evaluate("""async () => {
        const langs = ['ru','en','be','uk','kk','de','fr','zh','ko','ja'];
        const res = {};
        for (let n = 1; n <= 8; n++) {
            res[n] = {};
            for (const l of langs) {
                try {
                    const r = await fetch('Субтитры/Видео ' + n + '_' + l + '.vtt');
                    const t = await r.text();
                    res[n][l] = (t.match(/-->/g) || []).length;
                } catch(e) { res[n][l] = 'ERR:' + e.message; }
            }
        }
        return res;
    }""")
    for n, langs in data.items():
        ok = sum(1 for v in langs.values() if isinstance(v, int) and v > 0)
        bad = {l: v for l, v in langs.items() if not isinstance(v, int) or v == 0}
        status = "ALL OK" if not bad else f"PROBLEMS: {bad}"
        print(f"  Video {n}: {ok}/10 ready — {status}")

    browser.close()
    print("\nDone.")
