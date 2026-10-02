This is the Expo (React Native) version of The Lost Sketchbook — one codebase for iOS, Android and web. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

```bash
npx expo install <package>  # ALWAYS use instead of npm add — resolves SDK-compatible versions
npx expo start              # dev server (Expo Go)
npm run typecheck           # tsc: the app and the shared game core in ../src
npm run build:web           # web export to dist/
npm run generate            # regenerate sprite art + sounds from the web sources (needs root npm install)
npx expo-doctor             # diagnose dependency and config issues
```

Run the typecheck (and the web export when touching web-specific code) before declaring a task done.

## Project layout

- The game core lives in `../src` (`@core/*`): `hooks/useGame.ts`, `game/*`, `levels/*`, `data/*`, `types/*`. Do not fork game rules into the app. (The old Vite web UI that also used it is archived in `../archive/web-vite.zip`.)
- `metro.config.js` redirects two shared modules to app twins: `src/game/AudioManager` → `src/platform/AudioManager.(native|web).ts` and `src/game/CreatureMotion` → `src/game/CreatureMotion.ts` (worklet version — keep its maths in sync with the web file).
- The sketchbook is drawn imperatively by `src/board/renderer.ts` (one SkPicture per frame on the UI thread). Gestures live in `src/board/Board.tsx`; they are native, so the board must stay inactive under dialogs (`active` prop).
- `src/sprites/art.generated.ts` and `src/audio/sounds.generated.ts` are generated — never edit them by hand.
- Single screen, no navigation library: dialogs are overlays (`src/ui/ModalShell.tsx`). The app is locked to landscape.

## Rules

- `ios/` and `android/` are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Stay within the modules bundled in Expo Go (the app is developed and tested in Expo Go). Adding a library with native code means everyone needs a development build: `npx expo run:ios|android` or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries. Docs: https://docs.expo.dev/versions/latest/index.md
