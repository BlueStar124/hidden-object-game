/** Design tokens shared by every screen (the palette of the original web version). */
export const colors = {
  paper: '#ece7dc',
  paperCard: '#f5f1e8',
  paperDark: '#ded7c8',
  ink: '#2b2721',
  inkSoft: 'rgba(43, 39, 33, 0.65)',
  inkFaint: 'rgba(43, 39, 33, 0.38)',
  hairline: 'rgba(43, 39, 33, 0.15)',
  gold: '#b3833b',
  goldLight: '#d8a85e',
  earth: '#9a6a3e',
  crimson: '#a63232',
  emerald: '#2d7a4f',
  danger: '#dc2626',
  night: '#1b2440',
  nightLight: '#28325a',
  moonlight: '#f4ecd0',
  moonGold: '#f4d58d',
  backdrop: 'rgba(35, 30, 24, 0.66)',
};

/**
 * Font families loaded in App.tsx: Playfair Display for titles, Lora for body text.
 * The sans-serif UI text uses the system font.
 */
export const fonts = {
  display: 'PlayfairDisplay_400Regular',
  displayMedium: 'PlayfairDisplay_500Medium',
  displaySemiBold: 'PlayfairDisplay_600SemiBold',
  displayBold: 'PlayfairDisplay_700Bold',
  body: 'Lora_400Regular',
  bodyItalic: 'Lora_400Regular_Italic',
  bodyMedium: 'Lora_500Medium',
  bodySemiBold: 'Lora_600SemiBold',
  bodySemiBoldItalic: 'Lora_600SemiBold_Italic',
  bodyBold: 'Lora_700Bold',
};

export const gradients = {
  primary: ['#b3833b', '#9a6a3e'] as const,
  night: ['#1b2440', '#28325a'] as const,
  combo: ['#f59e0b', '#d97706'] as const,
};

export const shadow = (radius: number, opacity: number, y = Math.round(radius / 2)) => ({
  shadowColor: '#000',
  shadowOpacity: opacity,
  shadowRadius: radius,
  shadowOffset: { width: 0, height: y },
  elevation: Math.max(1, Math.round(radius / 2)),
});
