import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BookOpen, ChevronDown, Compass, Lock, RotateCw } from '../../../ui/icons';
import { colors, fonts, shadow } from '../../../ui/theme';

interface LeaderboardFiltersBarProps {
  selectedCountryName: string;
  selectedChapterLabel: string;
  isJourneyScope: boolean;
  scopeDescription: string;
  refreshing: boolean;
  tight: boolean;
  onOpenCountryPicker: () => void;
  onOpenChapterPicker: () => void;
  onRefresh: () => void;
}

export const LeaderboardFiltersBar: React.FC<LeaderboardFiltersBarProps> = React.memo((props) => {
  const {
    selectedCountryName,
    selectedChapterLabel,
    isJourneyScope,
    scopeDescription,
    refreshing,
    tight,
    onOpenCountryPicker,
    onOpenChapterPicker,
    onRefresh,
  } = props;

  return (
    <View>
      <View style={[styles.filtersRow, tight && styles.filtersRowTight]}>
        {/* Country Filter Button */}
        <Pressable
          style={({ pressed }) => [styles.filterBtn, pressed && styles.filterBtnPressed]}
          onPress={onOpenCountryPicker}
          accessibilityRole="button"
          accessibilityLabel={`Lọc theo quốc gia: hiện tại ${selectedCountryName}`}
        >
          <Compass size={14} color={colors.earth} />
          <Text style={styles.filterBtnText} numberOfLines={1}>
            {selectedCountryName}
          </Text>
          <ChevronDown size={14} color={colors.inkSoft} />
        </Pressable>

        {/* Chapter Filter Button */}
        <Pressable
          style={({ pressed }) => [
            styles.filterBtn,
            isJourneyScope && styles.filterBtnDisabled,
            pressed && !isJourneyScope && styles.filterBtnPressed,
          ]}
          onPress={() => {
            if (!isJourneyScope) onOpenChapterPicker();
          }}
          disabled={isJourneyScope}
          accessibilityRole="button"
          accessibilityLabel={`Lọc theo chương: hiện tại ${selectedChapterLabel}`}
        >
          {isJourneyScope ? (
            <Lock size={13} color={colors.inkFaint} />
          ) : (
            <BookOpen size={13} color={colors.earth} />
          )}
          <Text
            style={[styles.filterBtnText, isJourneyScope && styles.filterBtnTextDisabled]}
            numberOfLines={1}
          >
            {selectedChapterLabel}
          </Text>
          {!isJourneyScope && <ChevronDown size={14} color={colors.inkSoft} />}
        </Pressable>

        {/* Refresh button */}
        <Pressable
          style={({ pressed }) => [styles.refreshBtn, pressed && styles.refreshBtnPressed]}
          onPress={onRefresh}
          accessibilityRole="button"
          accessibilityLabel="Làm mới bảng xếp hạng"
        >
          {refreshing ? (
            <ActivityIndicator size="small" color={colors.earth} />
          ) : (
            <RotateCw size={14} color={colors.earth} />
          )}
        </Pressable>
      </View>

      {/* Scope info indicator */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>{scopeDescription} · Điểm cao nhất trang ngày</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  filtersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  filtersRowTight: {
    paddingVertical: 4,
    gap: 6,
  },
  filterBtn: {
    flex: 1,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    gap: 6,
    ...shadow(2, 0.05),
  },
  filterBtnPressed: {
    backgroundColor: colors.paperCard,
  },
  filterBtnDisabled: {
    backgroundColor: colors.paperDark,
    opacity: 0.65,
  },
  filterBtnText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.ink,
  },
  filterBtnTextDisabled: {
    color: colors.inkFaint,
  },
  refreshBtn: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow(2, 0.05),
  },
  refreshBtnPressed: {
    backgroundColor: colors.paperCard,
  },
  infoRow: {
    paddingHorizontal: 14,
    paddingBottom: 6,
  },
  infoText: {
    fontFamily: fonts.bodyItalic,
    fontSize: 11,
    color: colors.inkFaint,
  },
});

