"""
Proves an upgrade keeps saved data: serves an OLD build, logs doses in it, swaps the files for
the NEW build on the same origin, reloads, and reads IndexedDB.

  git worktree add ../bs-old <old-commit>      (then: cd ../bs-old && npm ci && npx vite build --outDir ../old_dist)
  npm run build && cp -r dist ../new_dist
  python scripts/qa/upgrade.py ../old_dist ../new_dist

Uses its own static server on port 4907 and a persistent browser profile in QA_OUT.
Adjust the old-version clicks below if the old onboarding differs.
"""
import asyncio, http.server, os, shutil, sys, threading, time
from functools import partial
from qa_lib import LAUNCH_ARGS, OUT, PHONE, async_playwright

OLD, NEW = sys.argv[1], sys.argv[2]
SITE = os.path.join(OUT, 'upgrade-site')
PORT = 4907


def swap(src):
    shutil.rmtree(SITE, ignore_errors=True)
    shutil.copytree(src, SITE)
    now = time.time() + 5  # fresh mtimes so the server never answers 304 with the old files
    for root, _, files in os.walk(SITE):
        for f in files: os.utime(os.path.join(root, f), (now, now))


async def main():
    swap(OLD)
    handler = partial(http.server.SimpleHTTPRequestHandler, directory=SITE)
    srv = http.server.ThreadingHTTPServer(('localhost', PORT), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    url = f'http://localhost:{PORT}/'
    async with async_playwright() as p:
        profile = os.path.join(OUT, 'upgrade-profile'); shutil.rmtree(profile, ignore_errors=True)
        ctx = await p.chromium.launch_persistent_context(profile, args=LAUNCH_ARGS, **PHONE)
        page = ctx.pages[0] if ctx.pages else await ctx.new_page()
        await page.goto(url); await page.wait_for_timeout(1200)
        # 3.3.0 onboarding: Continue, pick teen, Start tracking. Then add a second dose.
        await page.click('button:has-text("Continue")'); await page.wait_for_timeout(800)
        if await page.locator('button:has-text("13 to 17")').count(): await page.click('button:has-text("13 to 17")')
        await page.locator('button.btn.primary.block').last.click(); await page.wait_for_timeout(2500)
        await page.click('button[aria-label="Add another dose"]'); await page.wait_for_timeout(700)
        await page.locator('.overlay button.btn.primary.block').click(); await page.wait_for_timeout(1500)
        swap(NEW)
        await page.reload(); await page.wait_for_timeout(2500)
        await page.reload(); await page.wait_for_timeout(3000)
        print('version shown:', await page.evaluate("document.body.innerText.match(/version (\\d+\\.\\d+\\.\\d+)/i)?.[1] || 'none'"))
        print('IndexedDB:', await page.evaluate("""new Promise(r=>{const q=indexedDB.open('bloodstream');q.onsuccess=()=>{const db=q.result;const tx=db.transaction(['kv','doses'],'readonly');const out={version:db.version,stores:[...db.objectStoreNames]};tx.objectStore('kv').get('profile').onsuccess=e=>{out.profile=e.target.result;tx.objectStore('doses').count().onsuccess=e2=>{out.doses=e2.target.result;r(out)}}}})"""))
        await page.screenshot(path=OUT + 'upgrade_after.png')
        await ctx.close()
    srv.shutdown()

asyncio.run(main())
