This is The Lost Sketchbook — the whole game, one Expo (React Native) codebase for iOS, Android and web. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

```bash
npx expo install <package>  # ALWAYS use instead of npm add — resolves SDK-compatible versions
npx expo start              # dev server (Expo Go)
npm run check               # lint + typecheck + test + check:architecture (what CI runs, plus expo-doctor and the web export)
npm run lint                # ESLint (eslint-config-expo)
npm run typecheck           # tsc over the whole app
npm test                    # Jest (jest-expo): rules, saved progress, every page's content — in test/
npm run check:architecture  # the layers of src/ depend one way (../tools/check-architecture.mjs)
npm run test:screens        # the game and every dialog on 13 screen sizes, phones either way up (Playwright, ../tools/test-screens.mjs)
npm run build:web           # web export to dist/
npm run generate            # regenerate sprite art + sounds with ../tools (needs `npm install` at the repo root)
npx expo-doctor             # diagnose dependency and config issues
```

Run `npm run check` (and the web export when touching web-specific code) before declaring a task done. A rule change in `src/core/` gets a test in `test/`.

## Project layout

Layers depend one way: `core` ← `content` ← `game` ← `screens`; `board` draws what `game` tells it; `platform` and `ui` are leaves. See README.md (Kiến trúc) for the full map.

- `src/core/` — game rules in plain TypeScript (no React Native, no Skia): the model (`model.ts`: Country → Chapter → Page → HiddenObject, CaseState), case transitions (`caseFile.ts`), detection, scoring, hints, creature motion (worklets: they run on the JS and UI threads), saved progress. Keep rules here, pure.
- `src/content/` — data only: `countries/<country>/` (chapters, page JSON, art table) registered in `content/index.ts`, and the bestiary. Page ids are unique across countries (progress is keyed by them). Adding a country: README.md, "Thêm Một Quốc Gia".
- `src/game/` — session state as hooks: `useNavigation` (country, page, turns), `useCase` (the page's case), composed by `useGame`.
- `src/board/` — the sketchbook, drawn imperatively with Skia: one SkPicture per frame on the UI thread (`render/`, worklets), passed directly to the Canvas picture-view API; pages laid out on the JS thread (`scene/`). A cold turn waits for its destination before starting the animation, then reports completion to the game. Retired resources are released after the frame mapper stops using them. Gestures are native, so the board must stay inactive under dialogs (`active` prop). Frame callbacks stop under overlays except during warm-up or a flip. The order of the hooks in `Board.tsx` is the order their effects run in — keep it (see `usePageTurn`).
- `src/platform/` — per-platform files picked by Metro: `sound.native.ts` / `sound.web.ts` (contract in `sound.d.ts`), `sceneImage.ts` / `sceneImage.web.ts`. `platform/synth/` is the Web Audio synth: the source of every sound.
- `src/generated/` is written by `../tools/generate-assets.mjs` — never edit it by hand. The sprite drawings' source is `../tools/sprites/ObjectSprite.tsx`.
- Single screen, no navigation library: dialogs are overlays (`src/ui/ModalShell.tsx`). The app is locked to landscape.
- Dialogs shrink to fit the screen instead of scrolling (ModalShell, down to 0.75×); only long lists (page index, album) pass `scroll`. On little height they tighten up with `useCompact()` (`src/ui/layout.ts`). After changing a dialog or the HUD, run `npm run test:screens`; a new dialog also gets an entry in `test/screens/Gallery.tsx` (and in `DIALOGS` of the test).

## Rules

- `ios/` and `android/` are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Stay within the modules bundled in Expo Go (the app is developed and tested in Expo Go). Adding a library with native code means everyone needs a development build: `npx expo run:ios|android` or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries. Docs: https://docs.expo.dev/versions/latest/index.md
