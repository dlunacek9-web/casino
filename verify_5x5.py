import os
from playwright.sync_api import sync_playwright

def run_cuj():
    os.makedirs("/home/jules/verification/videos", exist_ok=True)
    os.makedirs("/home/jules/verification/screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            record_video_dir="/home/jules/verification/videos",
            viewport={"width": 1280, "height": 900}
        )
        page = context.new_page()

        try:
            # 1. Open app
            page.goto("http://127.0.0.1:8080/index.html")
            page.wait_for_timeout(1000)

            # 2. Adjust bet
            page.click("#btnBetPlus")
            page.wait_for_timeout(500)

            # Quick bet button
            page.click(".btn-quick-bet[data-bet='100']")
            page.wait_for_timeout(500)

            # 3. Spin 5x5 grid
            page.click("#btnSpin")
            page.wait_for_timeout(2500)

            # 4. Second Spin
            page.click("#btnSpin")
            page.wait_for_timeout(2500)

            # 5. Reload balance
            page.click("#btnReload")
            page.wait_for_timeout(1000)

            # Take final screenshot
            page.screenshot(path="/home/jules/verification/screenshots/verification.png")
            page.wait_for_timeout(1000)

        finally:
            context.close()
            browser.close()

if __name__ == "__main__":
    run_cuj()
