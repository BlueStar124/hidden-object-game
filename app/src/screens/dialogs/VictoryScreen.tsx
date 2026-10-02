import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { ArrowRight, Moon, PawPrint, RotateCcw, ScanSearch, Sparkles, Star, Trophy } from '../../ui/icons';
import type { Page } from '../../core/model';
import { colors, fonts } from '../../ui/theme';
import { formatDuration, formatNumber } from '../../ui/format';
import { ModalShell } from '../../ui/ModalShell';
import { PrimaryButton, SecondaryButton } from '../../ui/Buttons';
import { SpriteIcon } from '../../ui/SpriteIcon';
import { useCompact, useShortLandscape } from '../../ui/layout';

interface VictoryScreenProps {
  page: Page;
  score: number;
  stars: number;
  timeBonus: number;
  timeTaken: number;
  mistakes: number;
  hintsUsed: number;
  isSecretFound: boolean;
  foundIds: string[];
  hasNextPage: boolean;
  nightUnlocked?: string; // Title of the night page this victory just unlocked
  onNextPage: () => void;
  onReplay: () => void;
  onExplore: () => void;
}

const PopStar: React.FC<{ index: number; active: boolean; size: number }> = ({ index, active, size }) => {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withDelay(index * 250, withTiming(1, { duration: 500, easing: Easing.bezier(0.175, 0.885, 0.32, 1.275) }));
  }, [index, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={[style, active && styles.starGlow]}>
      <Star size={size} color={active ? '#eab308' : 'rgba(43, 39, 33, 0.2)'} fill={active ? '#eab308' : 'none'} />
    </Animated.View>
  );
};

const Stat: React.FC<{ label: string; value: string; tone?: 'positive' | 'negative' }> = ({ label, value, tone }) => (
  <View style={styles.statRow}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text
      style={[
        styles.statValue,
        tone === 'positive' && { color: colors.emerald },
        tone === 'negative' && { color: colors.crimson },
      ]}
    >
      {value}
    </Text>
  </View>
);

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  page,
  score,
  stars,
  timeBonus,
  timeTaken,
  mistakes,
  hintsUsed,
  isSecretFound,
  foundIds,
  hasNextPage,
  nightUnlocked,
  onNextPage,
  onReplay,
  onExplore,
}) => {
  const critters = page.objects.filter((o) => o.isBonus);
  const crittersFound = critters.filter((o) => foundIds.includes(o.id)).length;
  const leftovers = page.objects.filter((o) => (o.isBonus || o.isSecret) && !foundIds.includes(o.id)).length;

  // Phone held sideways: the verdict on the left, the score sheet and the buttons on the right
  const columns = useShortLandscape();
  const compact = useCompact();
  const float = useSharedValue(0);
  useEffect(() => {
    float.value = withRepeat(withTiming(-6, { duration: 1250, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [float]);
  const trophy = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));

  const actions = (
    <View style={{ gap: compact ? 8 : 10 }}>
      {/* Keep hunting the leftovers (album only, no score) */}
      {leftovers > 0 && (
        <Pressable
          onPress={onExplore}
          style={({ pressed }) => [
            styles.explore,
            compact && styles.exploreCompact,
            pressed && { backgroundColor: 'rgba(45, 122, 79, 0.15)' },
          ]}
        >
          <ScanSearch size={17} color={colors.emerald} />
          <Text style={styles.exploreText}>Soi Tiếp Tìm Nốt {leftovers} Vật Ẩn</Text>
        </Pressable>
      )}
      <View style={styles.actions}>
        <SecondaryButton label="Chơi Lại" icon={<RotateCcw size={16} color={colors.ink} />} onPress={onReplay} />
        <PrimaryButton
          label={hasNextPage ? 'Lật Trang Mới' : 'Hoàn Thành Vụ Án'}
          iconAfter={hasNextPage ? <ArrowRight size={18} color="#fff" /> : <Trophy size={18} color="#fff" />}
          onPress={onNextPage}
        />
      </View>
    </View>
  );

  return (
    <ModalShell
      maxWidth={columns ? 860 : 440}
      backdrop="rgba(35, 30, 24, 0.66)"
      contentStyle={compact && styles.contentCompact}
      // Sideways the buttons go under the score sheet: a full-width row would cost the height
      footer={columns ? undefined : actions}
    >
      <View style={columns ? styles.columns : styles.stack}>
        <View style={columns ? styles.column : styles.stack}>
          {!compact && (
            <Animated.View style={[styles.trophy, trophy]}>
              <Trophy size={40} color={colors.gold} />
            </Animated.View>
          )}
          <Text style={styles.tag}>HỒ SƠ KHÉP LẠI</Text>
          <Text style={[styles.title, compact && styles.titleCompact]}>ĐÃ PHÁ GIẢI MANH MỐI!</Text>
          <Text style={[styles.pageName, compact && styles.gapCompact]}>{page.title}</Text>

          <View style={[styles.stars, compact && styles.gapCompact]}>
            {[1, 2, 3].map((i) => (
              <PopStar key={i} index={i} active={i <= stars} size={compact ? 30 : 36} />
            ))}
          </View>

          {isSecretFound && (
            <View style={[styles.secret, compact && styles.gapCompact]}>
              <Sparkles size={15} color="#854d0e" />
              <Text style={styles.secretText}>PHÁT HIỆN CỔ VẬT BÍ MẬT! (+300 ĐIỂM)</Text>
            </View>
          )}

          {critters.length > 0 && (
            <View
              style={[
                styles.critters,
                compact && styles.crittersCompact,
                crittersFound === critters.length && styles.crittersDone,
              ]}
            >
              <View style={[styles.crittersHead, compact && { marginBottom: 4 }]}>
                <PawPrint size={14} color={colors.emerald} />
                <Text style={styles.crittersLabel}>
                  SINH VẬT ẨN NẤP: {crittersFound}/{critters.length}
                </Text>
              </View>
              <View style={styles.crittersRow}>
                {critters.map((o) => {
                  const found = foundIds.includes(o.id);
                  return (
                    <View key={o.id} style={styles.critter}>
                      <SpriteIcon type={o.spriteType} size={compact ? 28 : 34} revealed={found} />
                      <Text style={styles.critterName} numberOfLines={2}>
                        {found ? o.name : '???'}
                      </Text>
                    </View>
                  );
                })}
              </View>
              {crittersFound < critters.length && (
                <Text style={[styles.crittersNote, compact && { marginTop: 4 }]}>
                  Vẫn còn sinh vật nấp trong tranh — bấm “Soi Tiếp” để tìm nốt cho Sổ Tay!
                </Text>
              )}
            </View>
          )}
        </View>

        <View style={columns ? styles.column : styles.stack}>
          {nightUnlocked && (
            <View style={[styles.night, compact && styles.nightCompact]}>
              <Moon size={15} color={colors.moonlight} />
              <Text style={styles.nightText}>
                Đã mở khóa trang đêm: <Text style={{ fontFamily: fonts.bodyBold }}>{nightUnlocked}</Text>
              </Text>
            </View>
          )}

          <View style={[styles.stats, compact && styles.statsCompact]}>
            <Stat label="Thời gian hoàn thành:" value={formatDuration(timeTaken)} />
            <Stat label="Thưởng thời gian:" value={`+${timeBonus}`} tone="positive" />
            <Stat label="Số lần đoán nhầm:" value={String(mistakes)} tone={mistakes > 0 ? 'negative' : undefined} />
            <Stat label="Gợi ý đã dùng:" value={String(hintsUsed)} />
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Text style={styles.totalLabel}>TỔNG ĐIỂM ĐIỀU TRA:</Text>
              <Text style={styles.total}>{formatNumber(score)}</Text>
            </View>
          </View>

          {columns && <View style={styles.sideActions}>{actions}</View>}
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
    gap: 22,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  trophy: {
    marginBottom: 8,
  },
  tag: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.gold,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 27,
    lineHeight: 32,
    color: colors.ink,
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  pageName: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.inkSoft,
    marginBottom: 14,
  },
  stars: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  starGlow: {
    shadowColor: '#eab308',
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  secret: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef08a',
    borderWidth: 1,
    borderColor: '#facc15',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 12,
  },
  secretText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#854d0e',
  },
  critters: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(45, 122, 79, 0.06)',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(45, 122, 79, 0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  crittersDone: {
    backgroundColor: '#f0fdf4',
    borderStyle: 'solid',
    borderColor: '#86efac',
  },
  crittersHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  crittersLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.emerald,
  },
  crittersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 14,
  },
  critter: {
    alignItems: 'center',
    gap: 3,
    maxWidth: 92,
  },
  critterName: {
    fontFamily: fonts.body,
    fontSize: 11,
    lineHeight: 13,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  crittersNote: {
    marginTop: 8,
    fontFamily: fonts.bodyItalic,
    fontSize: 11.5,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  night: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderRadius: 10,
    backgroundColor: colors.night,
  },
  nightText: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.moonlight,
    flexShrink: 1,
  },
  stats: {
    alignSelf: 'stretch',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 7,
    marginBottom: 8,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
  },
  statValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
    marginVertical: 2,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink,
  },
  total: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.earth,
  },
  explore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 44,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(45, 122, 79, 0.55)',
    borderRadius: 10,
    backgroundColor: 'rgba(45, 122, 79, 0.08)',
  },
  exploreText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.emerald,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  sideActions: {
    alignSelf: 'stretch',
    marginTop: 4,
  },
  // Little height (useCompact): tighter spacing, smaller title and stars
  contentCompact: {
    paddingTop: 14,
    paddingBottom: 10,
  },
  titleCompact: {
    fontSize: 22,
    lineHeight: 26,
  },
  gapCompact: {
    marginBottom: 8,
  },
  crittersCompact: {
    padding: 8,
    marginBottom: 8,
  },
  nightCompact: {
    paddingVertical: 6,
    marginBottom: 8,
  },
  statsCompact: {
    paddingVertical: 8,
    gap: 4,
  },
  exploreCompact: {
    minHeight: 40,
  },
});
