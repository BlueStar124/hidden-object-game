import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Moon } from '../../../ui/icons';
import { formatDuration, formatNumber } from '../../../ui/format';
import { colors, fonts } from '../../../ui/theme';

interface VictoryScoreSheetProps {
  score: number;
  timeBonus: number;
  timeTaken: number;
  mistakes: number;
  hintsUsed: number;
  rivalTime?: number;
  nightUnlocked?: string;
  compact: boolean;
}

const Stat: React.FC<{ label: string; value: string; tone?: 'positive' | 'negative' }> = ({
  label,
  value,
  tone,
}) => (
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

export const VictoryScoreSheet: React.FC<VictoryScoreSheetProps> = React.memo((props) => {
  const {
    score,
    timeBonus,
    timeTaken,
    mistakes,
    hintsUsed,
    rivalTime,
    nightUnlocked,
    compact,
  } = props;

  return (
    <View style={styles.container}>
      {nightUnlocked && (
        <View style={[styles.night, compact && styles.nightCompact]}>
          <Moon size={15} color={colors.moonlight} />
          <Text style={styles.nightText}>
            Đã mở khóa trang đêm:{' '}
            <Text style={{ fontFamily: fonts.bodyBold }}>{nightUnlocked}</Text>
          </Text>
        </View>
      )}

      <View style={[styles.stats, compact && styles.statsCompact]}>
        {/* A friend's time: its own row, or beside the player's when height is short */}
        <Stat
          label={rivalTime !== undefined && compact ? 'Thời gian:' : 'Thời gian hoàn thành:'}
          value={
            rivalTime !== undefined && compact
              ? `${formatDuration(timeTaken)} · bạn bè ${formatDuration(rivalTime)}`
              : formatDuration(timeTaken)
          }
          tone={
            rivalTime !== undefined && compact
              ? timeTaken <= rivalTime
                ? 'positive'
                : 'negative'
              : undefined
          }
        />
        {rivalTime !== undefined && !compact && (
          <Stat
            label="Thử thách bạn bè:"
            value={
              timeTaken <= rivalTime
                ? `Thắng, nhanh hơn ${formatDuration(rivalTime - timeTaken)}`
                : `Chậm hơn ${formatDuration(timeTaken - rivalTime)}`
            }
            tone={timeTaken <= rivalTime ? 'positive' : 'negative'}
          />
        )}
        <Stat label="Thưởng thời gian:" value={`+${timeBonus}`} tone="positive" />
        <Stat
          label="Số lần đoán nhầm:"
          value={String(mistakes)}
          tone={mistakes > 0 ? 'negative' : undefined}
        />
        <Stat label="Gợi ý đã dùng:" value={String(hintsUsed)} />
        <View style={styles.divider} />
        <View style={styles.statRow}>
          <Text style={styles.totalLabel}>TỔNG ĐIỂM ĐIỀU TRA:</Text>
          <Text style={styles.total}>{formatNumber(score)}</Text>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  night: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.night,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 10,
  },
  nightCompact: {
    paddingVertical: 6,
    marginBottom: 6,
  },
  nightText: {
    color: colors.moonlight,
    fontSize: 12.5,
    flex: 1,
  },
  stats: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255, 255, 255, 0.65)',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsCompact: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  statLabel: {
    fontSize: 13,
    color: colors.inkSoft,
  },
  statValue: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.earth,
    letterSpacing: 0.8,
  },
  total: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.gold,
  },
});

