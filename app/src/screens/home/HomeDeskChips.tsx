import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CalendarDays,
  Check,
  Stamp,
  Sticker,
  Swords,
  UserRound,
} from '../../ui/icons';
import { accentControl, colors, controlIcon } from '../../ui/theme';

interface HomeDeskChipsProps {
  daily: 'open' | 'done' | 'none';
  tight: boolean;
  centred?: boolean;
  accountEmail: string;
  accountName: string | null;
  onOpenDaily: () => void;
  onOpenPassport: () => void;
  onOpenCover: () => void;
  onEnterChallenge: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const HomeDeskChips: React.FC<HomeDeskChipsProps> = React.memo((props) => {
  const {
    daily,
    tight,
    centred,
    accountEmail,
    accountName,
    onOpenDaily,
    onOpenPassport,
    onOpenCover,
    onEnterChallenge,
    onSignIn,
    onSignOut,
  } = props;

  return (
    <View style={[styles.desk, tight && styles.rowTight, centred && styles.centredRow]}>
      {daily !== 'none' && (
        <Chip
          label={daily === 'done' ? 'Đã xong hôm nay' : 'Trang của ngày'}
          icon={
            daily === 'done' ? (
              <Check size={controlIcon.small} color={controlIcon.color} />
            ) : (
              <CalendarDays size={controlIcon.small} color={controlIcon.color} />
            )
          }
          onPress={daily === 'done' ? onOpenPassport : onOpenDaily}
          highlight={daily === 'open'}
          iconOnly={tight}
        />
      )}
      <Chip
        label="Hộ chiếu"
        icon={<Stamp size={controlIcon.small} color={controlIcon.color} />}
        onPress={onOpenPassport}
        iconOnly={tight}
      />
      <Chip
        label="Trang bìa"
        icon={<Sticker size={controlIcon.small} color={controlIcon.color} />}
        onPress={onOpenCover}
        iconOnly={tight}
      />
      <Chip
        label="Thử thách"
        icon={<Swords size={controlIcon.small} color={controlIcon.color} />}
        onPress={onEnterChallenge}
        iconOnly={tight}
      />
      {tight && (
        <Chip
          label={
            accountEmail
              ? `Đăng xuất (${accountName ?? accountEmail})`
              : 'Đăng nhập để đồng bộ tiến độ'
          }
          icon={<UserRound size={controlIcon.small} color={controlIcon.color} />}
          onPress={accountEmail ? onSignOut : onSignIn}
          iconOnly
        />
      )}
    </View>
  );
});

const Chip: React.FC<{
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  highlight?: boolean;
  iconOnly?: boolean;
}> = ({ label, icon, onPress, highlight, iconOnly }) => (
  <Pressable
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={label}
    style={({ pressed }) => [
      styles.chip,
      iconOnly && styles.chipIcon,
      highlight && styles.chipHighlight,
      pressed && styles.pressed,
    ]}
  >
    {icon}
    {!iconOnly && (
      <Text style={styles.chipText} numberOfLines={1}>
        {label}
      </Text>
    )}
  </Pressable>
);

const styles = StyleSheet.create({
  desk: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  rowTight: {
    marginTop: 6,
    gap: 6,
  },
  centredRow: {
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(238, 230, 216, 0.7)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
  },
  chipIcon: {
    width: 28,
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  chipHighlight: accentControl,
  chipText: {
    fontSize: 11,
    color: colors.inkSoft,
  },
  pressed: {
    opacity: 0.6,
  },
});
