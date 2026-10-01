import { useWindowDimensions } from 'react-native';

/** A phone held sideways: little height, so dialogs lay their content out in two columns. */
export function useShortLandscape() {
  const { width, height } = useWindowDimensions();
  return width > height && height < 560;
}
