import { registerRootComponent } from 'expo';
// Synchronous localStorage on iOS/Android (SQLite-backed), where progress is saved (core/progress).
// A no-op on web, where the browser's localStorage is used.
import 'expo-sqlite/localStorage/install';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
// eslint-disable-next-line @typescript-eslint/no-require-imports -- loaded after localStorage is installed
registerRootComponent(require('./App').default);
