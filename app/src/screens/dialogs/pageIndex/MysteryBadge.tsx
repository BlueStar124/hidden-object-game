import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CircleCheckBig, Lightbulb, ScrollText } from '../../../ui/icons';
import type { Chapter } from '../../../core/model';
import { canDeduce, mysteryProgress } from '../../../core/mystery';
import { progress } from '../../../core/progress';
import { colors } from '../../../ui/theme';

interface MysteryBadgeProps {
  chapter: Chapter;
  onOpen: () => void;
}

/** A chapter's mystery in its heading: fragments found, then the way to the deduction board. */
export const MysteryBadge: React.FC<MysteryBadgeProps> = React.memo(({ chapter, onOpen }) => {
  const { found, total } = mysteryProgress(chapter, progress.discovered);

  if (!canDeduce(chapter, progress.discovered)) {
    return (
      <View
        style={styles.clues}
        accessibilityLabel={`Đã tìm ${found} trên ${total} mảnh manh mối của chương`}
      >
        <ScrollText size={12} color={colors.earth} />
        <Text style={styles.cluesText}>
          {found}/{total} mảnh manh mối
        </Text>
      </View>
    );
  }

  const solved = progress.isMysterySolved(chapter.id);
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.deduce,
        solved && styles.deduceSolved,
        pressed && { opacity: 0.8 },
      ]}
    >
      {solved ? (
        <CircleCheckBig size={13} color={colors.emerald} />
      ) : (
        <Lightbulb size={13} color="#fff" />
      )}
      <Text style={[styles.deduceText, solved && { color: colors.emerald }]}>
        {solved ? 'Bí ẩn đã giải' : 'Suy luận ngay!'}
      </Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  clues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(154, 106, 62, 0.1)',
  },
  cluesText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.earth,
  },
  deduce: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.gold,
  },
  deduceSolved: {
    backgroundColor: 'rgba(45, 122, 79, 0.12)',
  },
  deduceText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#fff',
  },
});

