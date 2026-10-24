import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  DEFAULT_LEADERBOARD_FILTER,
  describeFilter,
  type LeaderboardData,
  type LeaderboardEntry,
  type LeaderboardFilter,
} from '../../core/leaderboard';
import { COUNTRIES } from '../../content';
import { fetchLeaderboard } from '../../platform/leaderboard';
import { RotateCw, Trophy } from '../../ui/icons';
import { colors, fonts } from '../../ui/theme';
import { LeaderboardFiltersBar } from './leaderboard/LeaderboardFiltersBar';
import { FilterPickerModal } from './leaderboard/FilterPickerModal';
import { LeaderboardItemRow } from './leaderboard/LeaderboardItemRow';
import { LeaderboardUserBanner } from './leaderboard/LeaderboardUserBanner';

interface LeaderboardViewProps {
  currentUserId?: string | null;
  onSignIn?: () => void;
  tight?: boolean;
}

export const LeaderboardView: React.FC<LeaderboardViewProps> = ({
  currentUserId,
  onSignIn,
  tight = false,
}) => {
  const [filter, setFilter] = useState<LeaderboardFilter>(DEFAULT_LEADERBOARD_FILTER);
  const [data, setData] = useState<LeaderboardData>({ entries: [], userRank: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pickerModal, setPickerModal] = useState<'country' | 'chapter' | null>(null);

  const reqSeq = useRef(0);

  const activeCountry = useMemo(
    () => (filter.countryId ? COUNTRIES.find((c) => c.id === filter.countryId) ?? null : null),
    [filter.countryId]
  );

  const loadData = useCallback(
    async (isManualRefresh = false) => {
      const reqId = ++reqSeq.current;
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);

      try {
        const res = await fetchLeaderboard(filter, currentUserId);
        if (reqSeq.current !== reqId) return;
        setData(res);
      } finally {
        if (reqSeq.current === reqId) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [filter, currentUserId]
  );

  useEffect(() => {
    const seq = reqSeq;
    loadData();
    return () => {
      // Invalidate pending requests on filter change or unmount
      seq.current++;
    };
  }, [loadData]);

  const handleSelectCountry = (countryId: string | null) => {
    if (countryId === null) {
      setFilter({ scope: 'journey', countryId: null, chapterNumber: null });
    } else {
      setFilter({ scope: 'country', countryId, chapterNumber: null });
    }
    setPickerModal(null);
  };

  const handleSelectChapter = (chapterNumber: number | null) => {
    if (!filter.countryId) return;
    if (chapterNumber === null) {
      setFilter({ scope: 'country', countryId: filter.countryId, chapterNumber: null });
    } else {
      setFilter({ scope: 'chapter', countryId: filter.countryId, chapterNumber });
    }
    setPickerModal(null);
  };

  const selectedCountryName = activeCountry ? activeCountry.name : 'Toàn hành trình';
  const selectedChapterLabel =
    filter.scope === 'journey'
      ? 'Tất cả chương'
      : filter.chapterNumber
      ? `Chương ${filter.chapterNumber}`
      : 'Tất cả chương';

  const userInTop100 = useMemo(() => {
    if (!currentUserId) return false;
    return data.entries.some((e) => e.userId === currentUserId);
  }, [currentUserId, data.entries]);

  const renderItem = useCallback(
    ({ item }: { item: LeaderboardEntry }) => (
      <LeaderboardItemRow
        entry={item}
        isCurrentUser={!!currentUserId && item.userId === currentUserId}
      />
    ),
    [currentUserId]
  );

  return (
    <View style={styles.container}>
      <LeaderboardFiltersBar
        selectedCountryName={selectedCountryName}
        selectedChapterLabel={selectedChapterLabel}
        isJourneyScope={filter.scope === 'journey'}
        scopeDescription={describeFilter(filter, activeCountry?.name)}
        refreshing={refreshing}
        tight={tight}
        onOpenCountryPicker={() => setPickerModal('country')}
        onOpenChapterPicker={() => setPickerModal('chapter')}
        onRefresh={() => loadData(true)}
      />

      {loading ? (
        <View style={styles.centerArea}>
          <ActivityIndicator size="large" color={colors.gold} />
          <Text style={styles.loadingText}>Đang tải bảng xếp hạng...</Text>
        </View>
      ) : data.error ? (
        <View style={styles.centerArea}>
          <Text style={styles.errorText}>{data.error}</Text>
          <Pressable
            style={({ pressed }) => [styles.retryBtn, pressed && styles.pressed]}
            onPress={() => loadData(true)}
          >
            <RotateCw size={14} color="#fff" />
            <Text style={styles.retryBtnText}>Thử Lại</Text>
          </Pressable>
        </View>
      ) : data.entries.length === 0 ? (
        <View style={styles.centerArea}>
          <Trophy size={36} color={colors.goldLight} style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Chưa có thám tử nào ghi danh</Text>
          <Text style={styles.emptySubtitle}>
            Hãy là người đầu tiên hoàn thành trang cốt truyện ban ngày để xác lập kỷ lục!
          </Text>
        </View>
      ) : (
        <FlatList
          data={data.entries}
          keyExtractor={(item) => item.userId}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          style={styles.list}
          initialNumToRender={15}
          maxToRenderPerBatch={20}
          windowSize={7}
        />
      )}

      {!data.error && (
        <LeaderboardUserBanner
          currentUserId={currentUserId}
          userInTop100={userInTop100}
          userRank={data.userRank}
          onSignIn={onSignIn}
        />
      )}

      <FilterPickerModal
        visible={pickerModal !== null}
        mode={pickerModal}
        currentFilter={filter}
        activeCountry={activeCountry}
        onSelectCountry={handleSelectCountry}
        onSelectChapter={handleSelectChapter}
        onClose={() => setPickerModal(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 280,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: 180,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 10,
  },
  emptyIcon: {
    marginBottom: 10,
  },
  emptyTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: colors.ink,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
    maxWidth: 280,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.danger,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.earth,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: '#fff',
  },
  pressed: {
    opacity: 0.7,
  },
});
