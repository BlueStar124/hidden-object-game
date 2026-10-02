// Learn more https://docs.expo.dev/guides/customizing-metro
const path = require('node:path');
const { getDefaultConfig } = require('expo/metro-config');

// Everything the game ships lives in this folder: Expo's default configuration is all it needs
const config = getDefaultConfig(__dirname);

// The screen-size tests (../tools/test-screens.mjs) build the web app with the dialog gallery as
// its root. Only resolution changes, so no other build can pick it up from Metro's cache.
if (process.env.SKETCHBOOK_SCREEN_TESTS === '1') {
  const gallery = path.join(__dirname, 'test/screens/Gallery.tsx');
  const resolveRequest = config.resolver.resolveRequest;
  config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === './App' && /index\.web\.ts$/.test(context.originModulePath)) {
      return { type: 'sourceFile', filePath: gallery };
    }
    return (resolveRequest ?? context.resolveRequest)(context, moduleName, platform);
  };
}

module.exports = config;
