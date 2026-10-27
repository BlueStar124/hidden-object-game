import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BookOpen, Trophy } from '../../ui/icons';
import { colors } from '../../ui/theme';

export type HomeShelfTab = 'books' | 'leaderboard';

interface HomeTabsProps {
  activeTab: HomeShelfTab;
  onSelectTab: (tab: HomeShelfTab) => void;
}

export const HomeTabs: React.FC<HomeTabsProps> = React.memo(({ activeTab, onSelectTab }) => {
  return (
    <View style={styles.shelfTabsHeader}>
      <Pressable
        style={[styles.shelfTab, activeTab === 'books' && styles.shelfTabActive]}
        onPress={() => onSelectTab('books')}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'books' }}
        accessibilityLabel="Các cuốn sổ ký họa"
      >
        <BookOpen size={14} color={activeTab === 'books' ? colors.earth : colors.inkSoft} />
        <Text
          style={[styles.shelfTabText, activeTab === 'books' && styles.shelfTabTextActive]}
          numberOfLines={1}
        >
          Các cuốn sổ ký họa
        </Text>
      </Pressable>

      <Pressable
        style={[styles.shelfTab, activeTab === 'leaderboard' && styles.shelfTabActive]}
        onPress={() => onSelectTab('leaderboard')}
        accessibilityRole="tab"
        accessibilityState={{ selected: activeTab === 'leaderboard' }}
        accessibilityLabel="Bảng Xếp Hạng"
      >
        <Trophy size={14} color={activeTab === 'leaderboard' ? colors.gold : colors.inkSoft} />
        <Text
          style={[styles.shelfTabText, activeTab === 'leaderboard' && styles.shelfTabTextActive]}
          numberOfLines={1}
        >
          BXH
        </Text>
      </Pressable>
    </View>
  );
});

const styles = StyleSheet.create({
  shelfTabsHeader: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    backgroundColor: 'rgba(240, 236, 226, 0.95)',
  },
  shelfTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    minHeight: 44,
  },
  shelfTabActive: {
    borderBottomColor: colors.gold,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  shelfTabText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: colors.inkSoft,
    textTransform: 'uppercase',
  },
  shelfTabTextActive: {
    color: colors.ink,
  },
});

