import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { PageRef } from '../../core/model';
import { PrimaryButton, SecondaryButton } from '../../ui/Buttons';
import {
  BookHeart,
  BookOpen,
  Moon,
  Play,
  Save,
  Volume2,
  VolumeX,
} from '../../ui/icons';
import { colors, controlIcon } from '../../ui/theme';
import { HomeAccountBar } from './HomeAccountBar';
import { HomeDeskChips } from './HomeDeskChips';
import { HomeStats } from './HomeStats';

interface HomeActionsProps {
  current: PageRef;
  isNight: boolean;
  returning: boolean;
  soundEnabled: boolean;
  journeyDone: boolean;
  score: number;
  cleared: number;
  pageCount: number;
  album: { found: number; total: number };
  daily: 'open' | 'done' | 'none';
  accountEmail: string;
  accountName: string | null;
  columns: boolean;
  tight: boolean;
  onPlay: () => void;
  onOpenIndex: () => void;
  onOpenAlbum: () => void;
  onOpenBackup: () => void;
  onToggleSound: () => void;
  onOpenDaily: () => void;
  onOpenPassport: () => void;
  onOpenCover: () => void;
  onEnterChallenge: () => void;
  onEditName: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const HomeActions: React.FC<HomeActionsProps> = React.memo((props) => {
  const {
    current,
    isNight,
    returning,
    soundEnabled,
    journeyDone,
    score,
    cleared,
    pageCount,
    album,
    daily,
    accountEmail,
    accountName,
    columns,
    tight,
    onPlay,
    onOpenIndex,
    onOpenAlbum,
    onOpenBackup,
    onToggleSound,
    onOpenDaily,
    onOpenPassport,
    onOpenCover,
    onEnterChallenge,
    onEditName,
    onSignIn,
    onSignOut,
  } = props;

  return (
    <View style={styles.actions}>
      <PrimaryButton
        tall={!tight}
        label={returning ? 'Chơi Tiếp' : 'Bắt Đầu Điều Tra'}
        icon={returning ? <Play size={19} color="#fff" /> : <BookOpen size={19} color="#fff" />}
        onPress={onPlay}
        style={styles.full}
      />
      <View style={[styles.resume, !columns && styles.centredRow]}>
        {isNight && <Moon size={12} color={colors.earth} />}
        <Text style={styles.resumeText} numberOfLines={1}>
          {journeyDone
            ? `Hành trình hoàn tất! · Chơi lại: ${current.country.name} Trang ${current.number}`
            : `${current.country.name} · Trang ${current.number}${isNight ? ' · Đêm' : ''} — ${
                isNight && current.night ? current.night.title : current.day.title
              }`}
        </Text>
      </View>
      <View style={[styles.row, tight && styles.rowTight]}>
        <SecondaryButton
          label="Mục Lục"
          icon={<BookOpen size={controlIcon.size} color={controlIcon.color} />}
          onPress={onOpenIndex}
        />
        <SecondaryButton
          label="Sổ Tay"
          icon={<BookHeart size={controlIcon.size} color={controlIcon.color} />}
          onPress={onOpenAlbum}
        />
        <Pressable
          onPress={onOpenBackup}
          accessibilityRole="button"
          accessibilityLabel="Sao lưu tiến độ"
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          <Save size={controlIcon.size} color={controlIcon.color} />
        </Pressable>
        <Pressable
          onPress={onToggleSound}
          accessibilityRole="button"
          accessibilityLabel={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
        >
          {soundEnabled ? (
            <Volume2 size={controlIcon.size} color={controlIcon.color} />
          ) : (
            <VolumeX size={controlIcon.size} color={controlIcon.color} />
          )}
        </Pressable>
      </View>

      <HomeDeskChips
        daily={daily}
        tight={tight}
        centred={!columns}
        accountEmail={accountEmail}
        accountName={accountName}
        onOpenDaily={onOpenDaily}
        onOpenPassport={onOpenPassport}
        onOpenCover={onOpenCover}
        onEnterChallenge={onEnterChallenge}
        onSignIn={onSignIn}
        onSignOut={onSignOut}
      />

      <HomeStats
        score={score}
        cleared={cleared}
        pageCount={pageCount}
        album={album}
        tight={tight}
        centred={!columns}
      />

      {!tight && (
        <HomeAccountBar
          accountEmail={accountEmail}
          accountName={accountName}
          centred={!columns}
          onEditName={onEditName}
          onSignIn={onSignIn}
          onSignOut={onSignOut}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  actions: {
    marginTop: 10,
  },
  full: {
    alignSelf: 'stretch',
  },
  resume: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },
  resumeText: {
    flexShrink: 1,
    fontSize: 12,
    color: colors.inkSoft,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  rowTight: {
    marginTop: 8,
    gap: 6,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centredRow: {
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
});

