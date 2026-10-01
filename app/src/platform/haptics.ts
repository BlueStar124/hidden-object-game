import * as Haptics from 'expo-haptics';

/**
 * Touch feedback that goes with each game sound. Fire-and-forget: devices without a vibration
 * motor (or browsers without the API) simply ignore it.
 */
const run = (p: Promise<void>) => {
  p.catch(() => {});
};

export const haptics = {
  found: (combo: number) =>
    run(Haptics.impactAsync(combo >= 3 ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Medium)),
  wrong: () => run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)),
  fog: () => run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  hint: () => run(Haptics.selectionAsync()),
  rustle: () => run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)),
  pageTurn: () => run(Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  victory: () => run(Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  tick: () => run(Haptics.selectionAsync()),
};
