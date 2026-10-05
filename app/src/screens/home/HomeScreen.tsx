import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { PageRef } from '../../core/model';
import { progress } from '../../core/progress';
import { COUNTRIES } from '../../content';
import { PrimaryButton, SecondaryButton } from '../../ui/Buttons';
import { formatNumber } from '../../ui/format';
import {
  BookHeart,
  BookOpen,
  ChevronRight,
  CircleCheckBig,
  Moon,
  PawPrint,
  Play,
  Star,
  Trophy,
  Volume2,
  VolumeX,
} from '../../ui/icons';
import { SpriteIcon } from '../../ui/SpriteIcon';
import { colors, fonts, shadow } from '../../ui/theme';
import { BookThumb } from '../BookThumb';
import { albumProgress, bookSummary, type BookSummary } from './summary';

interface HomeScreenProps {
  /** The page the book is open at: "Chơi tiếp" goes on there */
  current: PageRef;
  isNight: boolean;
  /** The player has been in the books before (a new one gets "Bắt đầu điều tra") */
  returning: boolean;
  soundEnabled: boolean;
  onPlay: () => void;
  /** Opens a page of a country's sketchbook (its index), as the page index does */
  onSelect: (index: number, night: boolean, countryId: string) => void;
  onOpenIndex: () => void;
  onOpenAlbum: () => void;
  onToggleSound: () => void;
}

/**
 * The home screen, over the sketchbook when the game opens (and from the pause menu): carry on
 * where the player left off, pick a country's sketchbook, or browse the index and the album. The
 * book is laid out underneath meanwhile, so playing starts at once.
 */
export const HomeScreen = React.memo<HomeScreenProps>(
  ({ current, isNight, returning, soundEnabled, onPlay, onSelect, onOpenIndex, onOpenAlbum, onToggleSound }) => {
    const { width, height } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    // Side by side unless the screen is narrow (a phone held upright); little height: tighter
    const columns = width >= 600;
    const tight = height < 420;
    const pad = tight ? 10 : 18;
    const available = height - insets.top - insets.bottom - 2 * pad;

    // Read once each time the home screen opens: progress only changes while playing
    const books = useMemo(() => COUNTRIES.map(bookSummary), []);
    const album = useMemo(() => albumProgress(), []);
    const score = useMemo(() => progress.totalScore(), []);
    const cleared = books.reduce((n, b) => n + b.cleared, 0);
    const pageCount = books.reduce((n, b) => n + b.pages, 0);

    const intro = (
      <View style={[styles.intro, !columns && styles.centred]}>
        {!tight && <SpriteIcon type="magnifying-glass" size={50} />}
        <Text style={styles.tag}>HỒ SƠ THÁM TỬ</Text>
        <Text style={[styles.title, tight && styles.titleTight, !columns && styles.centredText]}>The Lost Sketchbook</Text>
        <Text style={[styles.subtitle, !columns && styles.centredText]}>
          Cuốn sổ ký họa thất lạc · soi kính lúp, tìm vật ẩn trong tranh
        </Text>
        <View style={[styles.divider, tight && styles.dividerTight]} />
      </View>
    );

    const actions = (
      <View style={styles.actions}>
        <PrimaryButton
          tall={!tight}
          label={returning ? 'Chơi Tiếp' : 'Bắt Đầu Điều Tra'}
          icon={returning ? <Play size={19} color="#fff" /> : <BookOpen size={19} color="#fff" />}
          onPress={onPlay}
          style={styles.full}
        />
        <View style={[styles.resume, !columns && styles.centredRow]}>
          {isNight && <Moon size={12} color={colors.earth} />}
          <Text style={styles.resumeText} numberOfLines={1}>
            {current.country.name} · Trang {current.number}
            {isNight ? ' · Đêm' : ''} — {isNight && current.night ? current.night.title : current.day.title}
          </Text>
        </View>
        <View style={[styles.row, tight && styles.rowTight]}>
          <SecondaryButton label="Mục Lục" icon={<BookOpen size={17} color={colors.ink} />} onPress={onOpenIndex} />
          <SecondaryButton label="Sổ Tay" icon={<BookHeart size={17} color={colors.emerald} />} onPress={onOpenAlbum} />
          <Pressable
            onPress={onToggleSound}
            accessibilityRole="button"
            accessibilityLabel={soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh'}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            {soundEnabled ? <Volume2 size={18} color={colors.ink} /> : <VolumeX size={18} color={colors.inkSoft} />}
          </Pressable>
        </View>
        <View style={[styles.stats, !columns && styles.centredRow]}>
          <Stat icon={<Trophy size={13} color={colors.gold} />} text={`${formatNumber(score)} điểm`} />
          <Stat icon={<CircleCheckBig size={13} color={colors.emerald} />} text={`${cleared}/${pageCount} trang`} />
          <Stat icon={<PawPrint size={13} color={colors.earth} />} text={`${album.found}/${album.total} loài`} />
        </View>
      </View>
    );

    const cards = books.map((book) => (
      <BookCard
        key={book.country.id}
        book={book}
        here={book.country.id === current.country.id}
        thumbWidth={tight ? 100 : 128}
        onPress={onSelect}
      />
    ));
    const shelfHeader = (
      <View style={styles.shelfHeader}>
        <BookOpen size={15} color={colors.earth} />
        <Text style={styles.shelfTitle}>CÁC CUỐN SỔ KÝ HỌA</Text>
      </View>
    );

    return (
      <Animated.View
        // No exit animation: a fading overlay would swallow the touches meant for the book (see ModalShell)
        entering={FadeIn.duration(250)}
        style={[
          StyleSheet.absoluteFill,
          styles.root,
          {
            paddingTop: insets.top + pad,
            paddingBottom: insets.bottom + pad,
            paddingLeft: insets.left + pad,
            paddingRight: insets.right + pad,
          },
        ]}
      >
        {/* A paper wash: on a roomy screen the book shows faintly in the middle, the HUD and the clue
            cards at the edges all but hidden. A small screen puts the title right over the HUD, and a
            dark night page would turn the wash grey: both get a denser one */}
        <LinearGradient
          colors={isNight || tight || !columns ? DENSE_WASH : LIGHT_WASH}
          locations={WASH_STOPS}
          style={StyleSheet.absoluteFill}
        />
        {/* Catch every touch: nothing reaches the sketchbook underneath */}
        <Pressable style={StyleSheet.absoluteFill} accessible={false} />

        {columns ? (
          <View style={[styles.columns, tight && styles.columnsTight]}>
            <View style={styles.left}>
              {intro}
              {actions}
            </View>
            <View style={[styles.shelf, styles.shelfSide, { maxHeight: available }]}>
              {shelfHeader}
              <ScrollView style={styles.shelfScroll} contentContainerStyle={styles.shelfList} showsVerticalScrollIndicator={false}>
                {cards}
              </ScrollView>
            </View>
          </View>
        ) : (
          <ScrollView style={styles.stackScroll} contentContainerStyle={styles.stack} showsVerticalScrollIndicator={false}>
            {intro}
            {actions}
            <View style={styles.shelf}>
              {shelfHeader}
              <View style={styles.shelfList}>{cards}</View>
            </View>
          </ScrollView>
        )}
      </Animated.View>
    );
  }
);

// colors.paper, more or less see-through
const wash = (edge: number, middle: number) =>
  [`rgba(236, 231, 220, ${edge})`, `rgba(236, 231, 220, ${middle})`, `rgba(236, 231, 220, ${middle})`, `rgba(236, 231, 220, ${edge})`] as const;
const LIGHT_WASH = wash(0.97, 0.88);
const DENSE_WASH = wash(1, 0.95);
const WASH_STOPS = [0, 0.25, 0.75, 1] as const;

const Stat: React.FC<{ icon: React.ReactNode; text: string }> = ({ icon, text }) => (
  <View style={styles.stat}>
    {icon}
    <Text style={styles.statText}>{text}</Text>
  </View>
);

/** One country's sketchbook: its cover, how far the player is, and the page it opens at. */
const BookCard = React.memo<{
  book: BookSummary;
  here: boolean;
  thumbWidth: number;
  onPress: (index: number, night: boolean, countryId: string) => void;
}>(({ book, here, thumbWidth, onPress }) => {
  const done = book.cleared === book.pages;
  return (
    <Pressable
      onPress={() => onPress(book.next.index, false, book.country.id)}
      accessibilityRole="button"
      accessibilityLabel={`Mở cuốn sổ ${book.country.name}`}
      style={({ pressed }) => [styles.card, here && styles.cardHere, pressed && styles.pressed]}
    >
      <View style={styles.thumb}>
        <BookThumb scene={book.cover} width={thumbWidth} />
        {here && <Text style={styles.hereBadge}>Đang mở</Text>}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {book.country.name}
        </Text>
        <View style={styles.cardMeta}>
          <Text style={styles.cardMetaText}>
            {book.cleared}/{book.pages} trang
          </Text>
          <Star size={11} color="#f59e0b" fill="#f59e0b" />
          <Text style={styles.cardMetaText}>
            {book.stars}/{book.maxStars}
          </Text>
        </View>
        <View style={styles.bar}>
          <View style={[styles.barFill, { width: `${(book.cleared / Math.max(1, book.pages)) * 100}%` }]} />
        </View>
        <Text style={styles.cardNext} numberOfLines={1}>
          {done ? 'Đã hoàn tất · chơi lại từ' : book.started ? 'Tiếp theo' : 'Bắt đầu'}: Trang {book.next.number} — {book.next.title}
        </Text>
      </View>
      <ChevronRight size={18} color={colors.inkFaint} />
    </Pressable>
  );
});

const styles = StyleSheet.create({
  root: {
    zIndex: 180, // over the HUD and the clue cards, under every dialog
    alignItems: 'center',
    justifyContent: 'center',
  },
  columns: {
    width: '100%',
    maxWidth: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  columnsTight: {
    gap: 18,
  },
  left: {
    flex: 1,
    maxWidth: 430,
  },
  stackScroll: {
    alignSelf: 'stretch',
  },
  stack: {
    flexGrow: 1,
    justifyContent: 'center',
    gap: 18,
    paddingVertical: 4,
  },
  centred: {
    alignItems: 'center',
  },
  centredText: {
    textAlign: 'center',
  },
  centredRow: {
    justifyContent: 'center',
  },

  /* Title */
  intro: {
    alignItems: 'flex-start',
  },
  tag: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2.5,
    color: colors.earth,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 34,
    lineHeight: 42,
    color: colors.ink,
  },
  titleTight: {
    fontSize: 26,
    lineHeight: 32,
  },
  subtitle: {
    fontFamily: fonts.bodyItalic,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.inkSoft,
  },
  divider: {
    width: 64,
    height: 2,
    borderRadius: 1,
    backgroundColor: colors.goldLight,
    marginVertical: 16,
  },
  dividerTight: {
    marginVertical: 9,
  },

  /* Actions */
  actions: {
    alignSelf: 'stretch',
  },
  full: {
    flex: 0,
    alignSelf: 'stretch',
  },
  resume: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
  },
  resumeText: {
    flexShrink: 1,
    fontSize: 12,
    color: colors.inkSoft,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  rowTight: {
    marginTop: 9,
  },
  iconButton: {
    width: 46,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 10,
  },
  pressed: {
    backgroundColor: '#fff',
  },
  stats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 14,
    rowGap: 4,
    marginTop: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.earth,
  },

  /* Sketchbooks */
  shelf: {
    backgroundColor: colors.paperCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: 'hidden',
    ...shadow(18, 0.12, 8),
  },
  shelfSide: {
    flex: 1.15,
  },
  shelfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    backgroundColor: 'rgba(240, 236, 226, 0.95)',
  },
  shelfTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.8,
    color: colors.earth,
  },
  shelfScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  shelfList: {
    padding: 10,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    paddingRight: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  cardHere: {
    borderColor: colors.goldLight,
    backgroundColor: '#fff',
  },
  thumb: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  hereBadge: {
    position: 'absolute',
    left: 5,
    top: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.earth,
    color: '#fff',
    fontSize: 9.5,
    fontWeight: '700',
  },
  cardInfo: {
    flex: 1,
    gap: 4,
  },
  cardTitle: {
    fontFamily: fonts.displayMedium,
    fontSize: 18,
    color: colors.ink,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: colors.inkSoft,
    marginRight: 4,
  },
  bar: {
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.paperDark,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: colors.emerald,
  },
  cardNext: {
    fontSize: 11,
    color: colors.inkFaint,
  },
});
