import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Moon } from '../../ui/icons';
import { colors } from '../../ui/theme';

export const NightBadge = React.memo(() => (
  <View style={styles.nightBadge}>
    <Moon size={11} color={colors.moonGold} />
    <Text style={styles.nightText}>ĐÊM</Text>
  </View>
));

const styles = StyleSheet.create({
  nightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: colors.night,
  },
  nightText: {
    color: colors.moonGold,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
});

