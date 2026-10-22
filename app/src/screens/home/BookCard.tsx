import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight, Lock, Star } from '../../ui/icons';
import { colors, fonts } from '../../ui/theme';
import { BookThumb } from '../BookThumb';
import type { BookSummary } from './summary';

interface BookCardProps {
  book: BookSummary;
  here: boolean;
  thumbWidth: number;
  onPress: (index: number, night: boolean, countryId: string) => void;
  onLockedPress: (reason: string) => void;
}

/** One country's sketchbook: its cover, how far the player is, and the page it opens at. */
export const BookCard = React.memo<BookCardProps>(
  ({ book, here, thumbWidth, onPress, onLockedPress }) => {
    const done = book.cleared === book.pages;
    const locked = !book.unlocked;

    return (
      <Pressable
        onPress={() => {
          if (locked) {
            onLockedPress(book.lockReason ?? 'Cuốn sổ chưa mở khóa');
            return;
          }
          onPress(book.next.index, false, book.country.id);
        }}
        accessibilityRole="button"
        accessibilityLabel={
          locked
            ? `${book.country.name}: Khóa. ${book.lockReason ?? ''}`
            : `Mở cuốn sổ ${book.country.name}`
        }
        style={({ pressed }) => [
          styles.card,
          here && styles.cardHere,
          locked && styles.cardLocked,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.thumb}>
          <BookThumb scene={book.cover} width={thumbWidth} />
          {locked ? (
            <View style={styles.lockedThumbOverlay}>
              <Lock size={22} color="#fff" />
            </View>
          ) : here ? (
            <Text style={styles.hereBadge}>Đang mở</Text>
          ) : null}
        </View>
        <View style={styles.cardInfo}>
          <View style={styles.cardTitleRow}>
            <Text style={[styles.cardTitle, locked && styles.cardTitleLocked]} numberOfLines={1}>
              {book.country.name}
            </Text>
            {locked && (
              <View style={styles.lockBadge}>
                <Lock size={10} color="#b45309" />
                <Text style={styles.lockBadgeText}>Chưa mở</Text>
              </View>
            )}
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.cardMetaText}>
              {book.cleared}/{book.pages} trang
            </Text>
            <Star
              size={11}
              color={locked ? colors.inkFaint : '#f59e0b'}
              fill={locked ? 'transparent' : '#f59e0b'}
            />
            <Text style={styles.cardMetaText}>
              {book.stars}/{book.maxStars}
            </Text>
          </View>
          <View style={styles.bar}>
            <View
              style={[
                styles.barFill,
                { width: `${(book.cleared / Math.max(1, book.pages)) * 100}%` },
                locked && { backgroundColor: colors.inkFaint },
              ]}
            />
          </View>
          <Text style={[styles.cardNext, locked && styles.cardNextLocked]} numberOfLines={1}>
            {locked
              ? `🔒 ${book.lockReason}`
              : done
              ? 'Đã hoàn tất · chơi lại từ: Trang 1'
              : book.started
              ? `Tiếp theo: Trang ${book.next.number} — ${book.next.title}`
              : `Bắt đầu: Trang ${book.next.number} — ${book.next.title}`}
          </Text>
        </View>
        {locked ? (
          <Lock size={16} color={colors.inkFaint} />
        ) : (
          <ChevronRight size={18} color={colors.inkFaint} />
        )}
      </Pressable>
    );
  }
);

const styles = StyleSheet.create({
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
  cardLocked: {
    backgroundColor: 'rgba(235, 230, 220, 0.6)',
    borderColor: 'rgba(43, 39, 33, 0.1)',
  },
  pressed: {
    backgroundColor: '#fff',
  },
  thumb: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  lockedThumbOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(30, 26, 20, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hereBadge: {
    position: 'absolute',
    left: 5,
    top: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(35, 30, 24, 0.85)',
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardInfo: {
    flex: 1,
    gap: 3,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    fontFamily: fonts.displayBold,
    fontSize: 15,
    color: colors.ink,
  },
  cardTitleLocked: {
    color: colors.inkSoft,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: '#fef3c7',
    borderRadius: 4,
  },
  lockBadgeText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#b45309',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardMetaText: {
    fontSize: 11,
    color: colors.inkSoft,
  },
  bar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(43, 39, 33, 0.08)',
    overflow: 'hidden',
    marginTop: 2,
  },
  barFill: {
    height: '100%',
    backgroundColor: colors.gold,
  },
  cardNext: {
    fontSize: 11,
    color: colors.earth,
    marginTop: 1,
  },
  cardNextLocked: {
    color: colors.inkFaint,
  },
});
