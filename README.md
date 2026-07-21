# KnitKnit

KnitKnit is a cozy visual workspace for knitters to collect sweater inspiration, manage yarn stash, and connect ideas to the yarn they already own.

## What it does

- Save knitting inspiration from URLs and uploaded images.
- Manage yarn stash with photos, colors, materials, quantities, tags, and notes.
- Link inspiration cards to yarn records.
- Show yarns and inspiration as an interactive visual universe on the homepage.
- Extract a main yarn color from uploaded yarn photos.
- Store data locally in the browser with `localStorage` and `IndexedDB`.
- Support Chinese and English UI with browser-language detection.

## Built with

Next.js, React, TypeScript, Tailwind CSS, Zustand, IndexedDB, localStorage, HTML Canvas, CSS textures, and browser-side image processing.

## How Codex and GPT-5.6 were used

Codex and GPT-5.6 were used as an engineering collaborator throughout the project. They helped:

- Refactor and polish the felt-inspired UI.
- Improve the interactive homepage bubble layout.
- Add bilingual Chinese/English language switching.
- Debug mobile responsive layouts and modal behavior.
- Improve URL-based inspiration image scraping.
- Add image upload, paste support, background removal, and color extraction for yarn photos.
- Fix browser storage quota issues by moving large media assets from `localStorage` to `IndexedDB`.
- Configure the app for static GitHub Pages deployment.

## Local development

```bash
npm install
npm run dev
```

Then open:

```text
http://localhost:3000
```

## GitHub Pages deployment

This project is configured for static export with GitHub Pages.

The GitHub Actions workflow in `.github/workflows/deploy.yml` builds the app and deploys the generated `out` directory to Pages.

For the `guoguoluo/knitknit` repository, the expected Pages URL is:

```text
https://guoguoluo.github.io/knitknit/
```
