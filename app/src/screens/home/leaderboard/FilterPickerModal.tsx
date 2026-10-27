import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import type { Country } from '../../../core/model';
import type { LeaderboardFilter } from '../../../core/leaderboard';
import { COUNTRIES } from '../../../content';
import { Check, X } from '../../../ui/icons';
import { colors, fonts, shadow } from '../../../ui/theme';

interface FilterPickerModalProps {
  visible: boolean;
  mode: 'country' | 'chapter' | null;
  currentFilter: LeaderboardFilter;
  activeCountry: Country | null;
  onSelectCountry: (countryId: string | null) => void;
  onSelectChapter: (chapterNumber: number | null) => void;
  onClose: () => void;
}

export const FilterPickerModal: React.FC<FilterPickerModalProps> = React.memo((props) => {
  const {
    visible,
    mode,
    currentFilter,
    activeCountry,
    onSelectCountry,
    onSelectChapter,
    onClose,
  } = props;

  if (!visible || !mode) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {mode === 'country' ? 'CHỌN QUỐC GIA' : 'CHỌN CHƯƠNG'}
            </Text>
            <Pressable
              onPress={onClose}
              style={styles.modalCloseBtn}
              accessibilityRole="button"
              accessibilityLabel="Đóng bộ lọc"
            >
              <X size={18} color={colors.ink} />
            </Pressable>
          </View>

          <View style={styles.modalList}>
            {mode === 'country' ? (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalOption,
                    currentFilter.scope === 'journey' && styles.modalOptionActive,
                    pressed && styles.modalOptionPressed,
                  ]}
                  onPress={() => onSelectCountry(null)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      currentFilter.scope === 'journey' && styles.modalOptionTextActive,
                    ]}
                  >
                    Toàn hành trình (tất cả quốc gia)
                  </Text>
                  {currentFilter.scope === 'journey' && <Check size={16} color={colors.gold} />}
                </Pressable>
                {COUNTRIES.map((c) => {
                  const isSelected = currentFilter.countryId === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      style={({ pressed }) => [
                        styles.modalOption,
                        isSelected && styles.modalOptionActive,
                        pressed && styles.modalOptionPressed,
                      ]}
                      onPress={() => onSelectCountry(c.id)}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          isSelected && styles.modalOptionTextActive,
                        ]}
                      >
                        {c.name}
                      </Text>
                      {isSelected && <Check size={16} color={colors.gold} />}
                    </Pressable>
                  );
                })}
              </>
            ) : (
              <>
                <Pressable
                  style={({ pressed }) => [
                    styles.modalOption,
                    currentFilter.chapterNumber === null && styles.modalOptionActive,
                    pressed && styles.modalOptionPressed,
                  ]}
                  onPress={() => onSelectChapter(null)}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      currentFilter.chapterNumber === null && styles.modalOptionTextActive,
                    ]}
                  >
                    Tất cả chương
                  </Text>
                  {currentFilter.chapterNumber === null && <Check size={16} color={colors.gold} />}
                </Pressable>
                {activeCountry?.chapters.map((ch, idx) => {
                  const chNum = idx + 1;
                  const isSelected = currentFilter.chapterNumber === chNum;
                  return (
                    <Pressable
                      key={ch.id}
                      style={({ pressed }) => [
                        styles.modalOption,
                        isSelected && styles.modalOptionActive,
                        pressed && styles.modalOptionPressed,
                      ]}
                      onPress={() => onSelectChapter(chNum)}
                    >
                      <Text
                        style={[
                          styles.modalOptionText,
                          isSelected && styles.modalOptionTextActive,
                        ]}
                        numberOfLines={1}
                      >
                        Chương {chNum} — {ch.title}
                      </Text>
                      {isSelected && <Check size={16} color={colors.gold} />}
                    </Pressable>
                  );
                })}
              </>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
});

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.paperCard,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    overflow: 'hidden',
    ...shadow(8, 0.2),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    backgroundColor: '#fff',
  },
  modalTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 13,
    color: colors.ink,
    letterSpacing: 0.8,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalList: {
    padding: 8,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: 6,
    minHeight: 44,
  },
  modalOptionPressed: {
    backgroundColor: colors.paperDark,
  },
  modalOptionActive: {
    backgroundColor: '#fff',
    ...shadow(1, 0.05),
  },
  modalOptionText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    flex: 1,
    marginRight: 8,
  },
  modalOptionTextActive: {
    fontFamily: fonts.bodyBold,
    color: colors.earth,
  },
});

