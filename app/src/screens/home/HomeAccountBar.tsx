import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { UserRound } from '../../ui/icons';
import { colors, controlIcon, fonts } from '../../ui/theme';

interface HomeAccountBarProps {
  accountEmail: string;
  accountName: string | null;
  centred?: boolean;
  onEditName: () => void;
  onSignIn: () => void;
  onSignOut: () => void;
}

export const HomeAccountBar: React.FC<HomeAccountBarProps> = React.memo((props) => {
  const {
    accountEmail,
    accountName,
    centred,
    onEditName,
    onSignIn,
    onSignOut,
  } = props;

  if (accountEmail) {
    return (
      <View style={[styles.account, centred && styles.centredRow]}>
        <UserRound size={13} color={controlIcon.color} />
        <Text
          style={[styles.accountEmail, !!accountName && styles.accountName]}
          numberOfLines={1}
        >
          {accountName ?? accountEmail}
        </Text>
        <Pressable
          onPress={onEditName}
          accessibilityRole="button"
          accessibilityLabel="Đổi tên trong game"
        >
          <Text style={styles.signOut}>Đổi tên</Text>
        </Pressable>
        <Pressable
          onPress={onSignOut}
          accessibilityRole="button"
          accessibilityLabel="Đăng xuất khỏi tài khoản"
        >
          <Text style={styles.signOut}>Đăng xuất</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={onSignIn}
      accessibilityRole="button"
      accessibilityLabel="Đăng nhập để đồng bộ tiến độ và tạo thử thách"
      style={({ pressed }) => [
        styles.account,
        centred && styles.centredRow,
        pressed && styles.pressed,
      ]}
    >
      <UserRound size={13} color={controlIcon.color} />
      <Text style={styles.signIn}>Đăng nhập để đồng bộ tiến độ</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  account: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 10,
    minHeight: 24,
  },
  centredRow: {
    justifyContent: 'center',
  },
  accountEmail: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkFaint,
    maxWidth: 180,
  },
  accountName: {
    fontFamily: fonts.bodyBold,
    color: colors.inkSoft,
  },
  signIn: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.earth,
    textDecorationLine: 'underline',
  },
  signOut: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.earth,
    textDecorationLine: 'underline',
    marginLeft: 6,
  },
  pressed: {
    opacity: 0.6,
  },
});

