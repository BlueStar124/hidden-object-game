import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Chapter } from '../../core/model';
import { cluesOf, isRightAnswer } from '../../core/mystery';
import { progress } from '../../core/progress';
import { TOOLS } from '../../content/tools';
import { PrimaryButton } from '../../ui/Buttons';
import { DialogHeader } from '../../ui/DialogHeader';
import { CircleCheckBig, Lightbulb, Lock, ScanEye, Sparkles } from '../../ui/icons';
import { ModalShell } from '../../ui/ModalShell';
import { SpriteIcon } from '../../ui/SpriteIcon';
import { colors, fonts } from '../../ui/theme';

interface DeductionProps {
  chapter: Chapter;
  chapterNumber: number;
  /** The last mystery solved: the keeper's certificate */
  onFinale: () => void;
  onClose: () => void;
}

/**
 * The deduction board of a chapter: its clue fragments pinned up, the question, the answers. A wrong
 * answer only shows a nudge back at the clues; the right one reveals the chapter's epilogue.
 */
export const Deduction: React.FC<DeductionProps> = ({ chapter, chapterNumber, onFinale, onClose }) => {
  const mystery = chapter.mystery!;
  const clues = useMemo(() => cluesOf(chapter), [chapter]);
  const [solved, setSolved] = useState(() => progress.isMysterySolved(chapter.id));
  const [nudge, setNudge] = useState<string | null>(null);
  const [picked, setPicked] = useState<number[]>([]);

  const answer = (option: number) => {
    if (isRightAnswer(chapter, option)) {
      progress.recordMysterySolved(chapter.id);
      setSolved(true);
      return;
    }
    setPicked((p) => (p.includes(option) ? p : [...p, option]));
    setNudge(mystery.options[option].nudge ?? 'Chưa đúng. Hãy đọc lại các mảnh manh mối trên bảng.');
  };

  return (
    <ModalShell
      scroll
      maxWidth={640}
      zIndex={360}
      backdrop="rgba(28, 24, 20, 0.78)"
      onBackdropPress={onClose}
      header={
        <DialogHeader
          icon={<Lightbulb size={24} color={colors.earth} />}
          title="Bảng Suy Luận"
          description={`Chương ${chapterNumber} · ${chapter.title}`}
          onClose={onClose}
        />
      }
      footer={
        solved ? (
          mystery.finale ? (
            <PrimaryButton label="Nhận Chứng Nhận Người Giữ Sổ" icon={<Sparkles size={18} color="#fff" />} onPress={onFinale} />
          ) : (
            <PrimaryButton label="Gấp Hồ Sơ Lại" icon={<CircleCheckBig size={18} color="#fff" />} onPress={onClose} />
          )
        ) : undefined
      }
    >
      {/* The fragments, pinned to the board */}
      <View style={styles.board}>
        {clues.map(({ object, page }) => (
          <View key={`${page.id}/${object.id}`} style={styles.note}>
            <View style={styles.pin} />
            <SpriteIcon type={object.spriteType} size={34} revealed />
            <Text style={styles.noteName} numberOfLines={2}>
              {object.name}
            </Text>
            {object.foundText && <Text style={styles.noteText}>{object.foundText}</Text>}
          </View>
        ))}
      </View>

      {solved ? (
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
                <Text style={styles.rewardTitle}>Bạn nhận được: {TOOLS[mystery.reward].name}</Text>
                <Text style={styles.rewardBody}>{TOOLS[mystery.reward].description}</Text>
              </View>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.quiz}>
          <Text style={styles.question}>{mystery.question}</Text>
          {mystery.options.map((o, i) => {
            const wrong = picked.includes(i);
            return (
              <Pressable
                key={o.text}
                onPress={() => answer(i)}
                disabled={wrong}
                accessibilityRole="button"
                style={({ pressed }) => [styles.option, wrong && styles.optionWrong, pressed && styles.optionPressed]}
              >
                {wrong && <Lock size={13} color={colors.inkFaint} />}
                <Text style={[styles.optionText, wrong && styles.optionTextWrong]}>{o.text}</Text>
              </Pressable>
            );
          })}
          {nudge && (
            <View style={styles.nudge}>
              <Lightbulb size={14} color={colors.gold} />
              <Text style={styles.nudgeText}>{nudge}</Text>
            </View>
          )}
        </View>
      )}
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  board: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#c9a477',
    borderWidth: 3,
    borderColor: '#8c6226',
  },
  note: {
    width: 150,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#fffaf0',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pin: {
    position: 'absolute',
    top: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.crimson,
  },
  noteName: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
    textAlign: 'center',
  },
  noteText: {
    fontFamily: fonts.bodyItalic,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  quiz: {
    alignSelf: 'stretch',
    gap: 8,
    marginTop: 16,
    marginBottom: 10,
  },
  question: {
    fontFamily: fonts.displayBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.paper,
  },
  optionPressed: {
    backgroundColor: '#fff',
  },
  optionWrong: {
    opacity: 0.55,
  },
  optionText: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink,
  },
  optionTextWrong: {
    textDecorationLine: 'line-through',
  },
  nudge: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(216, 168, 94, 0.15)',
  },
  nudgeText: {
    flexShrink: 1,
    fontFamily: fonts.bodyItalic,
    fontSize: 13,
    lineHeight: 19,
    color: colors.ink,
  },
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
  right: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.emerald,
    textAlign: 'center',
  },
  paragraph: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 22,
    color: colors.ink,
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
