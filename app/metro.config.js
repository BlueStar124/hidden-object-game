// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

// Everything the game ships lives in this folder: Expo's default configuration is all it needs
module.exports = getDefaultConfig(__dirname);
