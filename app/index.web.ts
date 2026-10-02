import { registerRootComponent } from 'expo';
import { LoadSkiaWeb } from '@shopify/react-native-skia/lib/module/web';

// The sketchbook is drawn with Skia, which runs on CanvasKit (WebAssembly) in the browser:
// load it before the app — and anything importing Skia — is evaluated.
LoadSkiaWeb({ locateFile: (file: string) => `/${file}` }).then(() => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- evaluated once CanvasKit is ready
  registerRootComponent(require('./App').default);
});
