# Screenshot QA

Python Playwright scripts used to check Bloodstream in a phone-sized Chromium (390x844 @2x).
They are a review aid, not part of `npm test`.

```bash
pip install playwright pillow && python -m playwright install chromium
npm run build && npx vite preview --port 4831 --strictPort     # keep running in another terminal
python scripts/qa/walkthrough.py        # onboarding, logging, library, reader, area article, incognito
python scripts/qa/backgrounds.py fx     # raw shader output for each effect
python scripts/qa/backgrounds.py sky    # the living sky at 7 times of day
python scripts/qa/upgrade.py OLD_DIST NEW_DIST   # data survives an upgrade (see the file header)
```

Screenshots and contact sheets land in `qa-out/` (gitignored). Override with `QA_OUT` and `QA_URL`.
Headless Chromium uses SwiftShader for WebGL, so shaders render but slowly; judge looks, not speed.
