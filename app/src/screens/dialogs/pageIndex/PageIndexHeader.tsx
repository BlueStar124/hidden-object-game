import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BookOpen, Lock, X } from '../../../ui/icons';
import type { Country } from '../../../core/model';
import { COUNTRIES, story } from '../../../content';
import { colors, fonts } from '../../../ui/theme';
import { RoundIconButton } from '../../../ui/Buttons';

interface PageIndexHeaderProps {
  pageCount: number;
  activeCountry: Country;
  onSelectCountry: (country: Country) => void;
  onClose: () => void;
}

export const PageIndexHeader: React.FC<PageIndexHeaderProps> = React.memo((props) => {
  const { pageCount, activeCountry, onSelectCountry, onClose } = props;

  return (
    <View style={styles.header}>
      <View style={styles.titleGroup}>
        <BookOpen size={24} color={colors.earth} />
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.title}>Mục Lục {pageCount} Trang Ký Họa</Text>
          <Text style={styles.desc}>
            Chọn trang để điều tra · hoàn thành trang ngày để mở khóa 🌙 trang đêm
          </Text>
          {COUNTRIES.length > 1 && (
            <View style={styles.tabs}>
              {COUNTRIES.map((c) => {
                const unlocked = story.isCountryUnlocked(c.id);
                const isSelected = c.id === activeCountry.id;
                return (
                  <Pressable
                    key={c.id}
                    onPress={() => onSelectCountry(c)}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: isSelected }}
                    style={[
                      styles.tab,
                      isSelected && styles.tabActive,
                      !unlocked && styles.tabLocked,
                    ]}
                  >
                    <View style={styles.tabContent}>
                      {!unlocked && (
                        <Lock
                          size={10}
                          color={isSelected ? '#fff' : colors.inkFaint}
                        />
                      )}
                      <Text
                        style={[
                          styles.tabText,
                          isSelected && styles.tabTextActive,
                          !unlocked && styles.tabTextLocked,
                        ]}
                      >
                        {c.name}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </View>
      <RoundIconButton onPress={onClose} accessibilityLabel="Đóng">
        <X size={20} color={colors.ink} />
      </RoundIconButton>
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: 'rgba(240, 236, 226, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexShrink: 1,
  },
  title: {
    fontFamily: fonts.displayMedium,
    fontSize: 22,
    color: colors.ink,
  },
  desc: {
    fontSize: 11.5,
    color: colors.inkSoft,
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  tabActive: {
    backgroundColor: colors.earth,
    borderColor: colors.earth,
  },
  tabLocked: {
    backgroundColor: 'rgba(235, 230, 220, 0.6)',
    borderColor: 'rgba(43, 39, 33, 0.15)',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkSoft,
  },
  tabTextActive: {
    color: '#fff',
  },
  tabTextLocked: {
    color: colors.inkFaint,
  },
});

