import { registerRootComponent } from 'expo';
// Synchronous localStorage on iOS/Android (SQLite-backed), used by the shared SaveManager.
// A no-op on web, where the browser's localStorage is used.
import 'expo-sqlite/localStorage/install';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(require('./App').default);
