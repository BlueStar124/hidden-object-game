import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Maximize, RotateCw, Smartphone } from '../../ui/icons';
import { colors, fonts } from '../../ui/theme';
import { ModalShell } from '../../ui/ModalShell';
import { PrimaryButton, SecondaryButton } from '../../ui/Buttons';

/**
 * Browsers cannot lock the orientation of a page, so an upright phone is invited to turn
 * sideways — the sketchbook is a wide spread. Android Chrome can go full screen and lock
 * landscape in one tap; elsewhere the player turns the phone (or keeps playing upright).
 */
type LockableOrientation = ScreenOrientation & { lock?: (o: 'landscape') => Promise<void> };

const canLock = () =>
  typeof document !== 'undefined' &&
  !!document.documentElement.requestFullscreen &&
  typeof screen !== 'undefined' &&
  typeof (screen.orientation as LockableOrientation | undefined)?.lock === 'function';

async function goLandscape() {
  try {
    await document.documentElement.requestFullscreen();
    await (screen.orientation as LockableOrientation).lock?.('landscape');
  } catch {
    // Not allowed here (iOS Safari, desktop…): the player can still rotate by hand
  }
}

export const RotatePrompt: React.FC<{ onKeepPortrait: () => void }> = ({ onKeepPortrait }) => (
  <ModalShell
    maxWidth={380}
    zIndex={400}
    backdrop="rgba(30, 26, 20, 0.82)"
    footer={
      <View style={{ gap: 10 }}>
        {canLock() && (
          <PrimaryButton
            label="Toàn màn hình & xoay ngang"
            icon={<Maximize size={18} color="#fff" />}
            onPress={goLandscape}
            style={{ flex: 0 }}
          />
        )}
        <SecondaryButton
          label="Vẫn chơi màn hình dọc"
          icon={<Smartphone size={16} color={colors.ink} />}
          onPress={onKeepPortrait}
          style={{ flex: 0 }}
        />
      </View>
    }
  >
    <View style={styles.icon}>
      <RotateCw size={34} color={colors.earth} />
    </View>
    <Text style={styles.title}>Xoay ngang điện thoại</Text>
    <Text style={styles.text}>
      Cuốn sổ ký họa là một trang đôi trải rộng — cầm máy nằm ngang để thấy trọn bức tranh và soi kính lúp dễ hơn.
    </Text>
  </ModalShell>
);

const styles = StyleSheet.create({
  icon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(179, 131, 59, 0.12)',
    marginBottom: 10,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.ink,
    marginBottom: 6,
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.inkSoft,
    textAlign: 'center',
    marginBottom: 6,
  },
});
