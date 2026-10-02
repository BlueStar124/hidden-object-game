import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BookOpen, CircleCheckBig, Lock, Moon, PawPrint, Star, X } from '../../ui/icons';
import type { Country, Page, PageRef } from '../../core/model';
import { progress } from '../../core/progress';
import { artOf, COUNTRIES, pagesOf } from '../../content';
import { colors, fonts } from '../../ui/theme';
import { formatNumber } from '../../ui/format';
import { ModalShell } from '../../ui/ModalShell';
import { RoundIconButton } from '../../ui/Buttons';

interface PageIndexProps {
  /** The sketchbook being played (the index opens on it) */
  country: Country;
  current: PageRef;
  isNight: boolean;
  /** A page of a country's book (its index), day or night */
  onSelect: (index: number, night: boolean, countryId: string) => void;
  onClose: () => void;
}

const Stars: React.FC<{ count: number; size?: number }> = ({ count, size = 12 }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[0, 1, 2].map((i) => (
      <Star key={i} size={size} color={i < count ? '#f59e0b' : '#9ca3af'} fill={i < count ? '#f59e0b' : 'transparent'} />
    ))}
  </View>
);

function critterProgress(page: Page) {
  const seen = new Set(progress.discovered(page.id));
  const ids = page.objects.filter((o) => o.isBonus).map((o) => o.id);
  return { total: ids.length, spotted: ids.filter((id) => seen.has(id)).length };
}

// The artwork is the open book on a transparent margin: the thumbnail shows just the paper
const BOOK = { x: 0.05, y: 0.218, w: 0.9, h: 0.564 };

const BookThumb: React.FC<{ scene: Page; width: number }> = ({ scene, width }) => {
  const height = (width * 9) / 16;
  // Cover the 16:9 frame with the paper
  const scale = Math.max(width / (BOOK.w * 1760), height / (BOOK.h * 1240));
  const imgW = 1760 * scale;
  const imgH = 1240 * scale;
  const left = -(BOOK.x + BOOK.w / 2) * imgW + width / 2;
  const top = -(BOOK.y + BOOK.h / 2) * imgH + height / 2;
  return (
    <View style={{ width, height, overflow: 'hidden', backgroundColor: '#e3ded3' }}>
      <Image
        source={artOf(scene)}
        style={{ position: 'absolute', width: imgW, height: imgH, left, top }}
        resizeMode="stretch"
      />
    </View>
  );
};

/**
 * "Mục Lục" — every page of a country's sketchbook, with progress and the night variants. With
 * several sketchbooks, a row of tabs switches between the countries.
 */
export const PageIndex: React.FC<PageIndexProps> = ({ country: playing, current, isNight, onSelect, onClose }) => {
  const [country, setCountry] = useState(playing);
  const pages = pagesOf(country);
  const here = country.id === playing.id; // the book being played is the one shown
  const { width } = useWindowDimensions();
  // Columns follow the width the grid really gets (dialog padding, notch insets…)
  const [gridWidth, setGridWidth] = useState(Math.min(920, width - 24) - 32);
  const columns = gridWidth >= 700 ? 3 : gridWidth >= 460 ? 2 : 1;
  const cardWidth = Math.floor((gridWidth - (columns - 1) * 14) / columns);

  return (
    <ModalShell
      scroll
      maxWidth={920}
      zIndex={350}
      backdrop="rgba(28, 24, 20, 0.74)"
      onBackdropPress={onClose}
      contentStyle={styles.body}
      header={
        <View style={styles.header}>
          <View style={styles.titleGroup}>
            <BookOpen size={24} color={colors.earth} />
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.title}>Mục Lục {pages.length} Trang Ký Họa</Text>
              <Text style={styles.desc}>Chọn trang để điều tra · hoàn thành trang ngày để mở khóa 🌙 trang đêm</Text>
              {COUNTRIES.length > 1 && (
                <View style={styles.tabs}>
                  {COUNTRIES.map((c) => (
                    <Pressable
                      key={c.id}
                      onPress={() => setCountry(c)}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: c.id === country.id }}
                      style={[styles.tab, c.id === country.id && styles.tabActive]}
                    >
                      <Text style={[styles.tabText, c.id === country.id && styles.tabTextActive]}>{c.name}</Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </View>
          <RoundIconButton onPress={onClose} accessibilityLabel="Đóng">
            <X size={20} color={colors.ink} />
          </RoundIconButton>
        </View>
      }
    >
      {country.chapters.map((chapter, c) => {
        const refs = pages.filter((ref) => ref.chapter === chapter);
        return (
          <View key={chapter.id} style={styles.chapter}>
            <View style={styles.chapterHead}>
              <Text style={styles.chapterBadge}>CHƯƠNG {c + 1}</Text>
              <Text style={styles.chapterName}>{chapter.title}</Text>
              {columns > 1 && <Text style={styles.chapterSub}> — {chapter.subtitle}</Text>}
            </View>
            <View style={styles.grid} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
              {refs.map((ref) => {
                const scene = ref.day;
                const idx = ref.index;
                const isCurrent = here && idx === current.index && !isNight;
                const result = progress.pageResult(scene.id);
                const passed = !!result && result.stars > 0;
                const critters = critterProgress(scene);
                const night = ref.night;
                const nightResult = night ? progress.pageResult(night.id) : undefined;
                const nightCritters = night ? critterProgress(night) : null;
                const isCurrentNight = here && idx === current.index && isNight;

                return (
                  <Pressable
                    key={scene.id}
                    onPress={() => {
                      onSelect(idx, false, country.id);
                      onClose();
                    }}
                    style={({ pressed }) => [
                      styles.card,
                      { width: cardWidth },
                      isCurrent && styles.cardActive,
                      pressed && styles.cardPressed,
                    ]}
                  >
                    <View>
                      <BookThumb scene={scene} width={cardWidth - 3} />
                      <Text style={styles.numTag}>Trang {idx + 1}</Text>
                      {isCurrent && <Text style={styles.currentBadge}>Đang mở</Text>}
                      {passed && (
                        <View style={styles.passedBadge}>
                          <CircleCheckBig size={13} color="#fff" />
                          <Text style={styles.passedText}>Hoàn tất</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.cardTitle}>{scene.title}</Text>
                      <Text style={styles.cardSub}>{scene.subtitle}</Text>
                      <View style={styles.meta}>
                        {result ? (
                          <View style={styles.row}>
                            <Stars count={result.stars} />
                            <Text style={styles.score}>{formatNumber(result.highScore)} đ</Text>
                          </View>
                        ) : (
                          <Text style={styles.unplayed}>Chưa giải mã</Text>
                        )}
                        {critters.total > 0 && (
                          <View style={styles.row}>
                            <PawPrint size={11} color={critters.spotted === critters.total ? colors.emerald : colors.inkFaint} />
                            <Text style={[styles.critters, critters.spotted === critters.total && { color: colors.emerald }]}>
                              {critters.spotted}/{critters.total}
                            </Text>
                          </View>
                        )}
                      </View>
                      {night && (
                        <Pressable
                          disabled={!passed}
                          onPress={() => {
                            onSelect(idx, true, country.id);
                            onClose();
                          }}
                          style={[styles.nightBtn, !passed && styles.nightLocked, isCurrentNight && styles.nightActive]}
                        >
                          {passed ? <Moon size={13} color={colors.moonlight} /> : <Lock size={12} color={colors.inkFaint} />}
                          <Text style={[styles.nightName, !passed && { color: colors.inkFaint }]} numberOfLines={1}>
                            {passed ? night.title : 'Trang Đêm · khóa'}
                          </Text>
                          {passed && nightResult && <Stars count={nightResult.stars} size={11} />}
                          {passed && nightCritters && nightCritters.total > 0 && (
                            <View style={styles.row}>
                              <PawPrint size={10} color={colors.moonlight} />
                              <Text style={styles.nightCritters}>
                                {nightCritters.spotted}/{nightCritters.total}
                              </Text>
                            </View>
                          )}
                        </Pressable>
                      )}
                    </View>
                  </Pressable>
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
  tabText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.inkSoft,
  },
  tabTextActive: {
    color: '#fff',
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
  card: {
    borderWidth: 1.5,
    borderColor: colors.hairline,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  cardActive: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  cardPressed: {
    backgroundColor: '#fff',
    borderColor: colors.earth,
  },
  numTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 26, 21, 0.82)',
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  currentBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.gold,
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  passedBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(45, 122, 79, 0.92)',
  },
  passedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  info: {
    padding: 12,
    gap: 3,
  },
  cardTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 15.5,
    color: colors.ink,
  },
  cardSub: {
    fontSize: 11,
    color: colors.inkFaint,
    marginBottom: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(43, 39, 33, 0.08)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  score: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.earth,
    marginLeft: 4,
  },
  unplayed: {
    fontFamily: fonts.bodyItalic,
    fontSize: 11,
    color: colors.inkFaint,
  },
  critters: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.inkFaint,
  },
  nightBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: colors.night,
    borderWidth: 1,
    borderColor: 'rgba(27, 36, 64, 0.35)',
  },
  nightLocked: {
    backgroundColor: 'rgba(43, 39, 33, 0.06)',
    borderStyle: 'dashed',
    borderColor: colors.hairline,
  },
  nightActive: {
    borderColor: colors.gold,
    borderWidth: 2,
  },
  nightName: {
    flex: 1,
    color: colors.moonlight,
    fontSize: 11.5,
    fontWeight: '700',
  },
  nightCritters: {
    color: colors.moonlight,
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.85,
  },
});
