import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BookOpen, House, Play, RotateCcw, Volume2, VolumeX } from '../ui/icons';
import type { LevelData } from '@core/types/level';
import { colors, fonts } from '../theme';
import { ModalShell } from '../ui/ModalShell';
import { PrimaryButton, SecondaryButton } from '../ui/Buttons';
import { useShortLandscape } from '../ui/layout';

interface PauseMenuProps {
  level: LevelData;
  soundEnabled: boolean;
  onResume: () => void;
  onRestart: () => void;
  onToggleSound: () => void;
  onExit: () => void;
}

export const PauseMenu: React.FC<PauseMenuProps> = ({ level, soundEnabled, onResume, onRestart, onToggleSound, onExit }) => {
  const columns = useShortLandscape();
  return (
    <ModalShell maxWidth={columns ? 760 : 400} backdrop="rgba(35, 30, 24, 0.62)" onBackdropPress={onResume}>
      <View style={columns ? styles.columns : styles.stack}>
        <View style={columns ? styles.column : styles.stack}>
          <Text style={styles.tag}>HỒ SƠ TẠM DỪNG</Text>
          <Text style={styles.title}>TẠM DỪNG ĐIỀU TRA</Text>

          <View style={styles.recap}>
            <View style={styles.recapHeader}>
              <BookOpen size={14} color={colors.earth} />
              <Text style={styles.recapLabel}>NHẮC LẠI MANH MỐI:</Text>
            </View>
            <Text style={styles.recapText}>{level.storyClue}</Text>
          </View>
        </View>

        <View style={[styles.actions, columns && styles.column]}>
          <PrimaryButton
            label="Tiếp Tục Điều Tra"
            icon={<Play size={18} color="#fff" />}
            onPress={onResume}
            style={styles.full}
          />
          <SecondaryButton
            label="Khởi Động Lại Màn Này"
            icon={<RotateCcw size={17} color={colors.ink} />}
            onPress={onRestart}
            style={styles.full}
          />
          <SecondaryButton
            label={`Âm Thanh: ${soundEnabled ? 'BẬT' : 'TẮT'}`}
            icon={soundEnabled ? <Volume2 size={17} color={colors.ink} /> : <VolumeX size={17} color={colors.ink} />}
            onPress={onToggleSound}
            style={styles.full}
          />
          <SecondaryButton
            label="Về Màn Hình Chính"
            icon={<House size={17} color={colors.crimson} />}
            onPress={onExit}
            tone="danger"
            style={styles.full}
          />
        </View>
      </View>
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  stack: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  columns: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  tag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.inkFaint,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 26,
    color: colors.ink,
    marginTop: 4,
    marginBottom: 14,
    textAlign: 'center',
  },
  recap: {
    alignSelf: 'stretch',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  recapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  recapLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.earth,
  },
  recapText: {
    fontFamily: fonts.bodyItalic,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.inkSoft,
  },
  actions: {
    alignSelf: 'stretch',
    gap: 10,
    marginBottom: 10,
  },
  full: {
    flex: 0,
    alignSelf: 'stretch',
  },
});
