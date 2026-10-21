# Bloodstream

Minimal and intuitive website that tracks medication effectivity and history, starting with
Adderall IR and XR.

- **Live curve:** estimated blood level and felt effect for today's doses, matched to your clock.
  Drag through the day to see any time.
- **Customizable pill** that fades as the dose clears.
- **Plan ahead or correct later:** log a dose you haven't taken yet, or fix the time you actually took one.
- **Stacked doses:** boosters and carry-over from yesterday are added together.
- **Sleep interference** at your planned bedtime.
- **Effectivity snapshot** across focus, self-regulation and body, now or at any time.
- **Local-first:** history lives on your device (IndexedDB), with JSON backup export and import.
- **Works offline** and installs to the iPhone Home Screen.

Live site: https://crsor-a.github.io/Bloodstream/

## Install on iPhone

1. Open the live site in Safari.
2. Tap the three dots next to the address bar, then **Share**, then **Add to Home Screen**.
3. Leave **Open as Web App** on and tap **Add**. Use the icon from then on; it keeps its own data.

## Develop

```sh
npm install
npm run dev      # local dev server
npm test         # model, storage and time tests
npm run build    # production build in dist/
```

Pushes to `main` are tested and deployed to GitHub Pages by `.github/workflows/deploy.yml`.
See `CLAUDE.md` for the architecture, design rules and the pharmacology behind the curves.

---

Bloodstream is not a replacement for doctor advice and information shown may be inaccurate.
Always double-check and never use this website to plan doses not approved by a healthcare
professional.
