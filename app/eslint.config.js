// https://docs.expo.dev/guides/using-eslint/
const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  // src/generated is written by ../tools/generate-assets.mjs; public/ holds copied web files
  globalIgnores(['dist/*', 'public/*', 'src/generated/*']),
  expoConfig,
  {
    rules: {
      // These rules are for the React Compiler, which the app does not use. They misread what
      // it does on purpose: Reanimated shared values written as `sv.value = …`, and refs that
      // hold the latest callback for native gestures and listeners.
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/set-state-in-effect': 'off',
      // Components are React.memo'd arrow functions throughout
      'react/display-name': 'off',
    },
  },
]);
