import { useEffect, useRef } from 'react';
import { AppState, BackHandler, Platform } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import * as NavigationBar from 'expo-navigation-bar';

/**
 * How the game behaves as an app: the screen stays on, Android runs full screen, leaving the app
 * pauses the investigation, and Android's back button closes the top sheet (or pauses) instead
 * of quitting mid-case.
 */
export function useDeviceBehaviour({
  playing,
  paused,
  onPause,
  closeTopSheet,
}: {
  /** An investigation is running (not paused, not over, no story card open) */
  playing: boolean;
  paused: boolean;
  onPause: () => void;
  /** Closes the sheet on top (album, index…); false when none is open */
  closeTopSheet: () => boolean;
}) {
  useKeepAwake();

  // Full screen on Android (swipe from the edge to bring the system bars back)
  useEffect(() => {
    if (Platform.OS === 'android') NavigationBar.setVisibilityAsync('hidden').catch(() => {});
  }, []);

  // Leaving the app pauses the investigation
  const playingRef = useRef(playing);
  playingRef.current = playing;
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active' && playingRef.current) onPause();
    });
    return () => sub.remove();
  }, [onPause]);

  // Android back button: close the top sheet, or pause instead of quitting mid-case
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (closeTopSheet()) return true;
      if (paused || playing) {
        onPause();
        return true;
      }
      return false; // let Android leave the app
    });
    return () => sub.remove();
  }, [closeTopSheet, paused, playing, onPause]);
}
