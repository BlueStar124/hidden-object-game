import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Chapter } from '../../core/model';
import { cluesOf, isRightAnswer } from '../../core/mystery';
import { progress } from '../../core/progress';
import { PrimaryButton } from '../../ui/Buttons';
import { DialogHeader } from '../../ui/DialogHeader';
import { CircleCheckBig, Lightbulb, Lock, Sparkles } from '../../ui/icons';
import { ModalShell } from '../../ui/ModalShell';
import { colors, fonts } from '../../ui/theme';
import { DeductionNotes } from './deduction/DeductionNotes';
import { DeductionEpilogue } from './deduction/DeductionEpilogue';

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
export const Deduction: React.FC<DeductionProps> = ({
  chapter,
  chapterNumber,
  onFinale,
  onClose,
}) => {
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
    setNudge(
      mystery.options[option].nudge ?? 'Chưa đúng. Hãy đọc lại các mảnh manh mối trên bảng.'
    );
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
            <PrimaryButton
              label="Nhận Chứng Nhận Người Giữ Sổ"
              icon={<Sparkles size={18} color="#fff" />}
              onPress={onFinale}
            />
          ) : (
            <PrimaryButton
              label="Gấp Hồ Sơ Lại"
              icon={<CircleCheckBig size={18} color="#fff" />}
              onPress={onClose}
            />
          )
        ) : undefined
      }
    >
      {/* The fragments, pinned to the board */}
      <DeductionNotes clues={clues} />

      {solved ? (
        <DeductionEpilogue chapter={chapter} />
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
                style={({ pressed }) => [
                  styles.option,
                  wrong && styles.optionWrong,
                  pressed && styles.optionPressed,
                ]}
              >
                {wrong && <Lock size={13} color={colors.inkFaint} />}
                <Text style={[styles.optionText, wrong && styles.optionTextWrong]}>
                  {o.text}
                </Text>
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
});
