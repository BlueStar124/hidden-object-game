import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ScanSearch } from '../../ui/icons';
import { colors } from '../../ui/theme';

/** Exploration controls live in the HUD so the entire painting stays available. */
export const ExploreStatus = React.memo(function ExploreStatus({ remaining, onFinish }: {
  remaining: number;
  onFinish: () => void;
}) {
  return (
    <View style={styles.root}>
      <ScanSearch size={15} color={colors.emerald} />
      <Text style={styles.text} numberOfLines={2}>Khám phá · còn {remaining} vật ẩn</Text>
      <Pressable onPress={onFinish} accessibilityRole="button" accessibilityLabel="Kết thúc khám phá"
        hitSlop={4} style={({ pressed }) => [styles.done, pressed && { opacity: 0.8 }]}>
        <Text style={styles.doneText}>Xong</Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    minWidth: 0,
    maxWidth: 450,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 8,
    paddingRight: 3,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#86efac',
    backgroundColor: 'rgba(240, 253, 244, 0.97)',
  },
  text: { flex: 1, minWidth: 0, fontSize: 12, lineHeight: 14, color: colors.emerald },
  done: { minHeight: 32, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center',
    borderRadius: 16, backgroundColor: colors.emerald },
  doneText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
