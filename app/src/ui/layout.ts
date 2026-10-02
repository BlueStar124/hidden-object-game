import { useWindowDimensions } from 'react-native';

/** A phone held sideways: little height, so dialogs lay their content out in two columns. */
export function useShortLandscape() {
  const { width, height } = useWindowDimensions();
  return width > height && height < 560;
}

/**
 * Little height — a phone, either way up: dialogs tighten their spacing and leave out what is
 * only decoration, so that they fit the screen without shrinking much (see ui/ModalShell).
 */
export function useCompact() {
  return useWindowDimensions().height < 680;
}
