import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Lock } from '../../ui/icons';
import type { Chapter, Country, PageRef } from '../../core/model';
import { ownedTools } from '../../game/ownedTools';
import { hasMystery } from '../../core/mystery';
import { pagesOf, story } from '../../content';
import { colors, fonts } from '../../ui/theme';
import { ModalShell } from '../../ui/ModalShell';
import { PageIndexHeader } from './pageIndex/PageIndexHeader';
import { PageIndexCard } from './pageIndex/PageIndexCard';
import { MysteryBadge } from './pageIndex/MysteryBadge';

interface PageIndexProps {
  /** The sketchbook being played (the index opens on it) */
  country: Country;
  current: PageRef;
  isNight: boolean;
  /** A page of a country's book (its index), day or night */
  onSelect: (index: number, night: boolean, countryId: string) => void;
  /** The deduction board of a chapter whose clue fragments are all found */
  onOpenDeduction: (chapter: Chapter, chapterNumber: number) => void;
  onClose: () => void;
}

/**
 * "Mục Lục" — every page of a country's sketchbook, with progress and the night variants. With
 * several sketchbooks, a row of tabs switches between the countries.
 */
export const PageIndex: React.FC<PageIndexProps> = ({
  country: playing,
  current,
  isNight,
  onSelect,
  onOpenDeduction,
  onClose,
}) => {
  const [country, setCountry] = useState(playing);
  const [notice, setNotice] = useState<string | null>(null);
  const tools = useMemo(() => ownedTools(), []);
  const pages = pagesOf(country);
  const here = country.id === playing.id; // the book being played is the one shown
  const { width } = useWindowDimensions();
  // Columns follow the width the grid really gets (dialog padding, notch insets…)
  const [gridWidth, setGridWidth] = useState(Math.min(920, width - 24) - 32);
  const columns = gridWidth >= 700 ? 3 : gridWidth >= 460 ? 2 : 1;
  const cardWidth = Math.floor((gridWidth - (columns - 1) * 14) / columns);

  const isCurrentCountryUnlocked = story.isCountryUnlocked(country.id);

  const handleSelectCountry = (c: Country) => {
    setCountry(c);
    if (!story.isCountryUnlocked(c.id)) {
      setNotice(story.countryLockReason(c.id) ?? 'Quốc gia này chưa mở');
    }
  };

  return (
    <ModalShell
      scroll
      maxWidth={920}
      zIndex={350}
      backdrop="rgba(28, 24, 20, 0.74)"
      onBackdropPress={onClose}
      contentStyle={styles.body}
      header={
        <PageIndexHeader
          pageCount={pages.length}
          activeCountry={country}
          onSelectCountry={handleSelectCountry}
          onClose={onClose}
        />
      }
    >
      {notice && (
        <Pressable
          onPress={() => setNotice(null)}
          style={styles.noticeBanner}
          accessibilityRole="alert"
        >
          <Lock size={14} color="#b45309" />
          <Text style={styles.noticeText}>{notice}</Text>
          <Text style={styles.noticeClose}>✕</Text>
        </Pressable>
      )}

      {!isCurrentCountryUnlocked && (
        <View style={styles.countryLockedBox}>
          <Lock size={16} color="#b45309" />
          <Text style={styles.countryLockedText}>
            {story.countryLockReason(country.id) ??
              'Hãy hoàn thành cuốn sổ trước để mở khóa ký họa này.'}
          </Text>
        </View>
      )}

      {country.chapters.map((chapter, c) => {
        const refs = pages.filter((ref) => ref.chapter === chapter);
        return (
          <View key={chapter.id} style={styles.chapter}>
            <View style={styles.chapterHead}>
              <Text style={styles.chapterBadge}>CHƯƠNG {c + 1}</Text>
              <Text style={styles.chapterName}>{chapter.title}</Text>
              {columns > 1 && <Text style={styles.chapterSub}> — {chapter.subtitle}</Text>}
              {hasMystery(chapter) && (
                <MysteryBadge
                  chapter={chapter}
                  onOpen={() => onOpenDeduction(chapter, c + 1)}
                />
              )}
            </View>
            <View
              style={styles.grid}
              onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}
            >
              {refs.map((ref) => {
                const scene = ref.day;
                const idx = ref.index;
                const isCurrent = here && idx === current.index && !isNight;
                const isCurrentNight = here && idx === current.index && isNight;

                return (
                  <PageIndexCard
                    key={scene.id}
                    scene={scene}
                    night={ref.night}
                    idx={idx}
                    cardWidth={cardWidth}
                    isCurrent={isCurrent}
                    isCurrentNight={isCurrentNight}
                    countryId={country.id}
                    tools={tools}
                    onSelect={onSelect}
                    onNotice={setNotice}
                    onClose={onClose}
                  />
                );
              })}
            </View>
          </View>
        );
      })}
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: 'rgba(254, 243, 199, 0.96)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.35)',
    marginBottom: 4,
  },
  noticeText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    color: '#92400e',
  },
  noticeClose: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
    paddingHorizontal: 6,
  },
  countryLockedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 238, 225, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  countryLockedText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#92400e',
  },
  body: {
    alignItems: 'stretch',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 22,
  },
  chapter: {
    gap: 12,
  },
  chapterHead: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderBottomColor: colors.hairline,
  },
  chapterBadge: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#fff',
    backgroundColor: colors.earth,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    overflow: 'hidden',
  },
  chapterName: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  chapterSub: {
    fontSize: 12,
    color: colors.inkFaint,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
});
