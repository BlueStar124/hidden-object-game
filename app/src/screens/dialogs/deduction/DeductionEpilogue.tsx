import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ScanEye } from '../../../ui/icons';
import type { Chapter } from '../../../core/model';
import { TOOLS } from '../../../content/tools';
import { colors, fonts } from '../../../ui/theme';

interface DeductionEpilogueProps {
  chapter: Chapter;
}

export const DeductionEpilogue: React.FC<DeductionEpilogueProps> = React.memo(({ chapter }) => {
  const mystery = chapter.mystery!;

  return (
    <View style={styles.epilogue}>
      <Text style={styles.solvedTag}>BÍ ẨN ĐÃ ĐƯỢC GIẢI</Text>
      <Text style={styles.question}>{mystery.question}</Text>
      <Text style={styles.right}>{mystery.options.find((o) => o.correct)?.text}</Text>
      {mystery.epilogue.map((p, i) => (
        <Text key={i} style={styles.paragraph}>
          {p}
        </Text>
      ))}
      {mystery.reward && (
        <View style={styles.reward}>
          <ScanEye size={22} color="#0284c7" />
          <View style={styles.rewardText}>
            <Text style={styles.rewardTitle}>
              Bạn nhận được: {TOOLS[mystery.reward].name}
            </Text>
            <Text style={styles.rewardBody}>{TOOLS[mystery.reward].description}</Text>
          </View>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  epilogue: {
    alignSelf: 'stretch',
    gap: 8,
    marginTop: 16,
    marginBottom: 10,
  },
  solvedTag: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.emerald,
    textAlign: 'center',
  },
  question: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 4,
  },
  right: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.emerald,
    textAlign: 'center',
  },
  paragraph: {
    fontFamily: fonts.body,
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.ink,
    textAlign: 'justify',
  },
  reward: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.35)',
    backgroundColor: 'rgba(2, 132, 199, 0.07)',
  },
  rewardText: {
    flexShrink: 1,
    gap: 3,
  },
  rewardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: '#0369a1',
  },
  rewardBody: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.ink,
  },
});

