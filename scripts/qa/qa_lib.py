"""
Shared helpers for Bloodstream's screenshot QA (Python Playwright).

Setup once:  pip install playwright && python -m playwright install chromium
Run:         npm run build && npx vite preview --port 4831 --strictPort   (in another terminal)
             python scripts/qa/walkthrough.py
Env vars:    QA_URL (default http://localhost:4831/), QA_OUT (default qa-out/)
"""
import os
from playwright.async_api import async_playwright  # noqa: F401  (re-exported for the scripts)

URL = os.environ.get('QA_URL', 'http://localhost:4831/')
OUT = os.environ.get('QA_OUT', 'qa-out/')
os.makedirs(OUT, exist_ok=True)
# SwiftShader gives headless Chromium a software WebGL, so the background shaders render.
LAUNCH_ARGS = ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader']
PHONE = dict(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
NOISE = ('swiftshader', 'GPU stall', 'GroupMarkerNotSet')


async def setup(p, hours_ago=4, logging=True, name='Rauf'):
    """Fresh browser, runs the 8-page onboarding, logs a dose taken `hours_ago`, lands on the dashboard."""
    b = await p.chromium.launch(args=LAUNCH_ARGS)
    ctx = await b.new_context(**PHONE)
    page = await ctx.new_page()
    errs = []
    page.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') and not any(n in m.text for n in NOISE) else None)
    page.on('pageerror', lambda e: errs.append(f'pageerror: {e}'))
    await page.goto(URL); await page.wait_for_timeout(700)

    async def nxt():
        await page.locator('.ob-foot button.btn.primary').click(); await page.wait_for_timeout(400)
    await nxt(); await nxt()                                   # scope, how it works
    if name: await page.fill('input[aria-label="Name"]', name)
    await nxt()                                                # about you
    await page.fill('input[aria-label="Medication name"]', 'Morning XR')
    await nxt(); await nxt()                                   # medication, schedule
    if logging:
        await page.click('label[for="obLog"]'); await page.wait_for_timeout(200)
        await page.click('button.choice:has-text("Still adjusting")')
    await nxt(); await nxt()                                   # logging, privacy
    t = await page.evaluate(f"(()=>{{const d=new Date(Date.now()-{hours_ago}*3600e3);return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}})()")
    await page.fill('#obTaken', t)
    await page.locator('.ob-foot button.btn.primary').click(); await page.wait_for_timeout(2600)
    return b, page, errs


async def shot(page, sel, name):
    el = page.locator(sel).first
    await el.scroll_into_view_if_needed(); await page.wait_for_timeout(250)
    await el.screenshot(path=OUT + name + '.png')


def contact_sheet(files, out, width=390):
    """Puts screenshots side by side so a whole flow can be reviewed in one image."""
    from PIL import Image
    ims = [Image.open(f) for f in files]
    ims = [im.resize((width, int(im.height * width / im.width))) for im in ims]
    sheet = Image.new('RGB', ((width + 10) * len(ims), max(im.height for im in ims)), 'white')
    for i, im in enumerate(ims): sheet.paste(im, (i * (width + 10), 0))
    sheet.save(out)
