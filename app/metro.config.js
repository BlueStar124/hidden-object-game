// Learn more https://docs.expo.dev/guides/customizing-metro
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const appRoot = __dirname;
const repoRoot = path.resolve(appRoot, '..');
// Game core shared with the web (Vite) version: types, levels, engines and the useGame hook
const sharedSrc = path.join(repoRoot, 'src');
// Artwork shared with the web version (scenes, paper wash, foliage)
const sharedPublic = path.join(repoRoot, 'public');

/**
 * Shared modules that are bound to a platform get an app-side twin:
 * - AudioManager: native plays pre-rendered sounds + haptics; web keeps the Web Audio synth
 *   (`src/platform/AudioManager.web.ts` re-exports the shared one).
 * - CreatureMotion: same maths written as worklets, so the UI thread draws shy & roaming
 *   creatures on exactly the clock that click detection uses.
 * Only imports made *from inside* the shared code are redirected; app code imports the twins.
 */
const TWINS = {
  [path.join(sharedSrc, 'game', 'AudioManager')]: path.join(appRoot, 'src', 'platform', 'AudioManager'),
  [path.join(sharedSrc, 'game', 'CreatureMotion')]: path.join(appRoot, 'src', 'game', 'CreatureMotion'),
};

const config = getDefaultConfig(appRoot);

config.watchFolders = [sharedSrc, sharedPublic];

const isBare = (name) => !name.startsWith('.') && !path.isAbsolute(name);
const stripExt = (file) => file.replace(/\.(tsx?|jsx?)$/, '');

// `@core/…` = the shared game code. (Resolved here rather than through tsconfig `paths`, which
// also maps `react` to this app's types for the shared files — a typecheck-only concern.)
const CORE_PREFIX = '@core/';

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith(CORE_PREFIX)) {
    return context.resolveRequest(context, path.join(sharedSrc, moduleName.slice(CORE_PREFIX.length)), platform);
  }
  const origin = context.originModulePath;
  if (origin && origin.startsWith(sharedSrc + path.sep)) {
    if (isBare(moduleName)) {
      // `react` & co. imported by shared code must come from this app's node_modules
      // (the web project has its own React 18 next door)
      return context.resolveRequest({ ...context, originModulePath: path.join(appRoot, 'index.ts') }, moduleName, platform);
    }
    const twin = TWINS[stripExt(path.resolve(path.dirname(origin), moduleName))];
    if (twin) return context.resolveRequest(context, twin, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
