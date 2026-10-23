"""Clicks through the main v4 flows and saves screenshots to QA_OUT. Prints console errors at the end."""
import asyncio
from qa_lib import OUT, async_playwright, contact_sheet, setup, shot


async def main():
    async with async_playwright() as p:
        b, page, errs = await setup(p)
        await page.screenshot(path=OUT + 'dash_top.png')
        for sel, name in [('section[aria-labelledby="hEff"]', 'effectivity'), ('section[aria-labelledby="hData"]', 'data'), ('section[aria-labelledby="hLook"]', 'appearance')]:
            await shot(page, sel, name)

        # Doctor logging: a serious suggestion shows the stop guidance
        await page.click('button[aria-label="Log for your doctor"]'); await page.wait_for_timeout(600)
        await page.click('button.type-tile:has-text("Side effect")'); await page.wait_for_timeout(400)
        await page.click('.cat-chips button:has-text("Mood & emotions")'); await page.wait_for_timeout(500)
        await page.click('.dd-opt:has-text("Hearing or seeing")'); await page.wait_for_timeout(500)
        await page.screenshot(path=OUT + 'log.png')
        await page.click('button:has-text("Add to library")'); await page.wait_for_timeout(700)

        # Library, entry details, linked article
        await page.click('button[aria-label="Log for your doctor"]'); await page.wait_for_timeout(500)
        await page.click('.lib-link'); await page.wait_for_timeout(800)
        await page.click('.entry-main >> nth=0'); await page.wait_for_timeout(600)
        await page.screenshot(path=OUT + 'library.png')
        await page.click('.entry.open .linked .u-link'); await page.wait_for_timeout(900)
        await page.screenshot(path=OUT + 'reader.png')
        await page.click('.viewer.reader .back'); await page.wait_for_timeout(500)
        await page.click('.library .back'); await page.wait_for_timeout(600)

        # Adaptive area article from an effectivity bar
        await page.locator('.eff-row:has-text("Impulse control")').click(); await page.wait_for_timeout(900)
        await page.screenshot(path=OUT + 'area_article.png')
        await page.click('.viewer.reader .back'); await page.wait_for_timeout(500)

        # Incognito survives a reload
        await page.click('button[aria-label="Incognito"]'); await page.wait_for_timeout(600)
        await page.click('.overlay button:has-text("Turn on incognito")'); await page.wait_for_timeout(800)
        await page.reload(); await page.wait_for_timeout(1500)
        print('incognito after reload:', await page.locator('.inc-view').count() == 1)
        await page.screenshot(path=OUT + 'incognito.png')

        contact_sheet([OUT + n + '.png' for n in ['dash_top', 'log', 'library', 'reader', 'area_article', 'incognito']], OUT + 'sheet_walkthrough.png')
        print('\n'.join(errs) or 'no console errors')
        await b.close()

asyncio.run(main())
