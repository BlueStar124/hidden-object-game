import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatRank, type LeaderboardEntry } from '../../../core/leaderboard';
import { formatNumber } from '../../../ui/format';
import { UserRound } from '../../../ui/icons';
import { colors, fonts, shadow } from '../../../ui/theme';

interface LeaderboardUserBannerProps {
  currentUserId?: string | null;
  userInTop100: boolean;
  userRank: LeaderboardEntry | null;
  onSignIn?: () => void;
}

export const LeaderboardUserBanner: React.FC<LeaderboardUserBannerProps> = React.memo(
  ({ currentUserId, userInTop100, userRank, onSignIn }) => {
    if (currentUserId) {
      if (userInTop100) return null;

      if (userRank) {
        return (
          <View style={styles.stickyUserBanner}>
            <View style={styles.stickyRankCol}>
              <Text style={styles.stickyRankLabel}>Hạng của bạn</Text>
              <Text style={styles.stickyRankNum}>{formatRank(userRank.rank)}</Text>
            </View>
            <View style={styles.stickyInfoCol}>
              <Text style={styles.stickyUserName} numberOfLines={1}>
                {userRank.displayName}
              </Text>
              <Text style={styles.stickySubtext}>
                {userRank.pagesCleared}/{userRank.totalPages} trang cốt truyện
              </Text>
            </View>
            <View style={styles.stickyScoreCol}>
              <Text style={styles.stickyScoreNum}>{formatNumber(userRank.totalScore)}</Text>
              <Text style={styles.stickyScoreUnit}>điểm</Text>
            </View>
          </View>
        );
      }

      return (
        <View style={styles.stickyNoScoreBanner}>
          <Text style={styles.noScoreTitle}>Bạn chưa có thứ hạng trong phạm vi này</Text>
          <Text style={styles.noScoreSub}>
            Hoàn thành ít nhất 1 trang cốt truyện ban ngày để ghi danh lên BXH!
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.guestBanner}>
        <View style={styles.guestBannerTextCol}>
          <Text style={styles.guestBannerTitle}>Chế độ khách</Text>
          <Text style={styles.guestBannerSub}>Đăng nhập để ghi danh lên Bảng Xếp Hạng</Text>
        </View>
        {onSignIn && (
          <Pressable
            style={({ pressed }) => [styles.guestSignInBtn, pressed && styles.pressed]}
            onPress={onSignIn}
            accessibilityRole="button"
            accessibilityLabel="Đăng nhập tài khoản"
          >
            <UserRound size={13} color="#fff" />
            <Text style={styles.guestSignInBtnText}>Đăng Nhập</Text>
          </Pressable>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  stickyUserBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopWidth: 1.5,
    borderColor: colors.gold,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...shadow(4, 0.1, -2),
  },
  stickyRankCol: {
    alignItems: 'center',
    marginRight: 10,
    minWidth: 46,
  },
  stickyRankLabel: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.inkFaint,
  },
  stickyRankNum: {
    fontFamily: fonts.displayBold,
    fontSize: 16,
    color: colors.gold,
  },
  stickyInfoCol: {
    flex: 1,
    marginRight: 8,
  },
  stickyUserName: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
  },
  stickySubtext: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkFaint,
  },
  stickyScoreCol: {
    alignItems: 'flex-end',
  },
  stickyScoreNum: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: colors.gold,
  },
  stickyScoreUnit: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkFaint,
  },
  stickyNoScoreBanner: {
    backgroundColor: colors.paperCard,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: 'center',
  },
  noScoreTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.ink,
  },
  noScoreSub: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 2,
  },
  guestBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.paperCard,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  guestBannerTextCol: {
    flex: 1,
    marginRight: 8,
  },
  guestBannerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.ink,
  },
  guestBannerSub: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkSoft,
  },
  guestSignInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.gold,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    ...shadow(2, 0.1),
  },
  guestSignInBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: '#fff',
  },
  pressed: {
    opacity: 0.7,
  },
});

