import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatNumber } from '../../ui/format';
import { colors, fonts } from '../../ui/theme';

interface ScoreBoxProps {
  score: number;
  wide: boolean;
  isNarrowScore: boolean;
  isNight: boolean;
  scoreLabelText: string;
}

export const ScoreBox: React.FC<ScoreBoxProps> = React.memo((props) => {
  const { score, wide, isNarrowScore, isNight, scoreLabelText } = props;

  return (
    <View
      style={[
        styles.score,
        wide && styles.scoreWide,
        isNarrowScore && styles.scoreNarrow,
        isNight && styles.scoreNight,
      ]}
    >
      <Text style={[styles.scoreLine, isNight && styles.scoreLineNight]} numberOfLines={1}>
        <Text
          style={[
            styles.scoreLabel,
            isNarrowScore && styles.scoreLabelNarrow,
            isNight && styles.scoreLabelNight,
          ]}
        >
          {scoreLabelText}
        </Text>
        <Text style={styles.scoreSpace}> </Text>
        <Text
          style={[
            styles.scoreValue,
            isNarrowScore && styles.scoreValueNarrow,
            isNight && styles.scoreValueNight,
          ]}
        >
          {formatNumber(score)}
        </Text>
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  score: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 35,
    paddingHorizontal: 9,
    borderRadius: 10,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  scoreWide: {
    height: 36,
    paddingHorizontal: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  scoreNarrow: {
    height: 32,
    paddingHorizontal: 7,
  },
  scoreNight: {
    backgroundColor: 'rgba(27, 36, 64, 0.6)',
    borderColor: 'rgba(244, 236, 208, 0.18)',
  },
  scoreLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    includeFontPadding: false,
  },
  scoreLineNight: {},
  scoreLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.8,
    color: '#6D6255',
    includeFontPadding: false,
  },
  scoreLabelNarrow: {
    fontSize: 10,
    letterSpacing: 0.5,
  },
  scoreLabelNight: {
    color: 'rgba(244, 236, 208, 0.7)',
  },
  scoreSpace: {
    fontSize: 12,
  },
  scoreValue: {
    fontFamily: fonts.displayBold,
    fontSize: 15.5,
    color: colors.ink,
    includeFontPadding: false,
  },
  scoreValueNarrow: {
    fontSize: 14,
  },
  scoreValueNight: {
    color: colors.moonlight,
  },
});

