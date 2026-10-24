import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  formatRank,
  medalForRank,
  type LeaderboardEntry,
} from '../../../core/leaderboard';
import { formatNumber } from '../../../ui/format';
import { colors, fonts, shadow } from '../../../ui/theme';

interface LeaderboardItemRowProps {
  entry: LeaderboardEntry;
  isCurrentUser: boolean;
}

export const LeaderboardItemRow: React.FC<LeaderboardItemRowProps> = React.memo(
  ({ entry, isCurrentUser }) => {
    const medal = medalForRank(entry.rank);

    return (
      <View style={[styles.itemRow, isCurrentUser && styles.currentUserRow]}>
        <View style={styles.rankCol}>
          {medal === 'gold' ? (
            <View style={[styles.medalBadge, styles.goldBadge]}>
              <Text style={styles.medalText}>1</Text>
            </View>
          ) : medal === 'silver' ? (
            <View style={[styles.medalBadge, styles.silverBadge]}>
              <Text style={styles.medalText}>2</Text>
            </View>
          ) : medal === 'bronze' ? (
            <View style={[styles.medalBadge, styles.bronzeBadge]}>
              <Text style={styles.medalText}>3</Text>
            </View>
          ) : (
            <Text style={styles.rankNumText}>{formatRank(entry.rank)}</Text>
          )}
        </View>

        <View style={styles.nameCol}>
          <View style={styles.nameRow}>
            <Text
              style={[styles.nameText, isCurrentUser && styles.currentUserNameText]}
              numberOfLines={1}
            >
              {entry.displayName}
            </Text>
            {isCurrentUser && (
              <View style={styles.youPill}>
                <Text style={styles.youPillText}>Bạn</Text>
              </View>
            )}
          </View>
          <Text style={styles.subtext}>
            {entry.pagesCleared}/{entry.totalPages} trang cốt truyện
          </Text>
        </View>

        <View style={styles.scoreCol}>
          <Text style={[styles.scoreValue, isCurrentUser && styles.currentUserScore]}>
            {formatNumber(entry.totalScore)}
          </Text>
          <Text style={styles.scoreUnit}>điểm</Text>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    ...shadow(2, 0.04),
  },
  currentUserRow: {
    backgroundColor: 'rgba(216, 168, 94, 0.16)',
    borderColor: colors.gold,
    borderWidth: 1.2,
  },
  rankCol: {
    width: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  medalBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(2, 0.15),
  },
  goldBadge: {
    backgroundColor: '#f59e0b',
  },
  silverBadge: {
    backgroundColor: '#9ca3af',
  },
  bronzeBadge: {
    backgroundColor: '#b45309',
  },
  medalText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: '#fff',
  },
  rankNumText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.inkSoft,
  },
  nameCol: {
    flex: 1,
    marginRight: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    flexShrink: 1,
  },
  currentUserNameText: {
    fontFamily: fonts.bodyBold,
    color: colors.ink,
  },
  youPill: {
    backgroundColor: colors.gold,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  youPillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    color: '#fff',
  },
  subtext: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkFaint,
    marginTop: 1,
  },
  scoreCol: {
    alignItems: 'flex-end',
  },
  scoreValue: {
    fontFamily: fonts.displayBold,
    fontSize: 14,
    color: colors.gold,
  },
  currentUserScore: {
    color: colors.earth,
  },
  scoreUnit: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkFaint,
  },
});

