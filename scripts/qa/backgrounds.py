"""
Renders each background effect with the UI hidden (raw shader output), plus the living sky at
several times of day by shifting Date.now(). Usage: python backgrounds.py fx | sky
"""
import asyncio, sys
from qa_lib import OUT, async_playwright, contact_sheet, setup


async def raw(p, effects, tag, hour=None):
    b, page, errs = await setup(p)
    if hour is not None:
        await page.evaluate(f"(()=>{{const real=Date.now.bind(Date);const t=new Date();t.setHours({int(hour)},{int((hour % 1) * 60)},0,0);const d=t.getTime()-real();Date.now=()=>real()+d;}})()")
    await page.locator('button.fx:has-text("Aurora")').click(); await page.wait_for_timeout(300)
    await page.evaluate("const r=document.getElementById('dimR'); r.value='0'; r.dispatchEvent(new Event('input',{bubbles:true}))")
    files = []
    for fx in effects:
        await page.locator('button.fx:has-text("Black")').click(); await page.wait_for_timeout(300)
        await page.locator(f'button.fx:has-text("{fx}")').click(); await page.wait_for_timeout(1500)
        await page.add_style_tag(content='.wrap{visibility:hidden}.bg::after{display:none}'); await page.wait_for_timeout(300)
        f = OUT + f'raw_{tag}_{fx.split()[0].lower()}.png'
        await page.screenshot(path=f); files.append(f)
        await page.add_style_tag(content='.wrap{visibility:visible}')
    if errs: print(tag, errs)
    await b.close()
    return files


async def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else 'fx'
    async with async_playwright() as p:
        if mode == 'fx':
            files = await raw(p, ['Aurora', 'Rain on glass', 'Snowfall', 'Nebula', 'Gradient'], 'fx')
        else:
            files = []
            for h in [6.9, 9, 13, 17.6, 18.3, 19, 23]:
                files += await raw(p, ['Living sky'], f'sky{h}', h)
    contact_sheet(files, OUT + f'sheet_{mode}.png')
    print('saved', OUT + f'sheet_{mode}.png')

asyncio.run(main())
