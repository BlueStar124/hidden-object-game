import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { hasMystery } from '../../core/mystery';
import { progress } from '../../core/progress';
import { allChapters, COUNTRIES } from '../../content';
import { PrimaryButton } from '../../ui/Buttons';
import { BookHeart, CircleCheckBig, Sparkles, Stamp, Star } from '../../ui/icons';
import { useCompact, useShortLandscape } from '../../ui/layout';
import { ModalShell } from '../../ui/ModalShell';
import { colors, fonts } from '../../ui/theme';
import { albumProgress, bookSummary } from '../home/summary';
import { ShareRow, type ShareActions } from '../share/ShareRow';

interface FinaleProps {
  /** The certificate as a postcard */
  share: ShareActions;
  onClose: () => void;
}

/** What the journey added up to (read once, when the certificate opens). */
export function journeyStats() {
  const books = COUNTRIES.map(bookSummary);
  const mysteries = allChapters().filter(hasMystery);
  return {
    pages: books.reduce((n, b) => n + b.cleared, 0),
    pageCount: books.reduce((n, b) => n + b.pages, 0),
    stars: books.reduce((n, b) => n + b.stars, 0),
    album: albumProgress(),
    golden: progress.rareFound().length,
    stamps: Object.keys(progress.stamps()).length,
    mysteries: mysteries.filter((c) => progress.isMysterySolved(c.id)).length,
    mysteryCount: mysteries.length,
  };
}

/**
 * The end of the story: the last mystery solved, the architect hands the sketchbook on and the player
 * becomes its fourth keeper. A certificate of the whole journey, to keep or to send.
 */
export const Finale: React.FC<FinaleProps> = ({ share, onClose }) => {
  const stats = useMemo(() => journeyStats(), []);
  // Phone held sideways: the title and the words on the left, the journey and the share on the right
  const columns = useShortLandscape();
  const compact = useCompact();
  const rows: [React.ReactNode, string, string][] = [
    [<CircleCheckBig key="p" size={15} color={colors.emerald} />, 'Trang ký họa đã giải', `${stats.pages}/${stats.pageCount}`],
    [<Star key="s" size={15} color="#eab308" fill="#eab308" />, 'Sao thám tử', String(stats.stars)],
    [<BookHeart key="a" size={15} color={colors.emerald} />, 'Loài và cổ vật trong Sổ Tay', `${stats.album.found}/${stats.album.total}`],
    [<Sparkles key="g" size={15} color="#ca8a04" />, 'Sinh vật ánh vàng', String(stats.golden)],
    [<Stamp key="t" size={15} color={colors.crimson} />, 'Con dấu hộ chiếu', String(stats.stamps)],
  ];

  return (
    <ModalShell
      maxWidth={columns ? 820 : 520}
      zIndex={370}
      backdrop="rgba(20, 16, 12, 0.82)"
      cardStyle={styles.card}
      footer={<PrimaryButton label="Mở Trang Giấy Trắng Đầu Tiên" icon={<BookHeart size={18} color="#fff" />} onPress={onClose} />}
    >
      <View style={columns ? styles.columns : styles.stack}>
      <View style={columns ? styles.column : styles.stack}>
      <Text style={styles.tag}>CHỨNG NHẬN</Text>
      <Text style={[styles.title, compact && styles.titleCompact]}>Người Giữ Sổ Thứ Tư</Text>
      <Text style={styles.subtitle}>
        Đã giải {stats.mysteries}/{stats.mysteryCount} bí ẩn qua Singapore, Thái Lan và Việt Nam
      </Text>
      <View style={[styles.rule, compact && styles.ruleCompact]} />
      <Text style={styles.quote}>
        “Thầy của ta đã đi khắp Đông Dương. Ta đi qua ba đất nước. Còn con, những trang tiếp theo là của con.”
      </Text>
      </View>
      <View style={columns ? styles.column : styles.stack}>
      <View style={[styles.stats, compact && styles.statsCompact]}>
        {rows.map(([icon, label, value]) => (
          <View key={label} style={styles.row}>
            {icon}
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}
      </View>
      {!compact && <Text style={styles.note}>Những cuốn sổ mới sẽ được thêm vào khi có trang ký họa mới. Hẹn gặp lại, thám tử.</Text>}
      <View style={[styles.share, compact && styles.shareCompact]}>
        <ShareRow {...share} />
      </View>
      </View>
      </View>
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  stack: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  columns: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  titleCompact: {
    fontSize: 23,
    lineHeight: 28,
  },
  ruleCompact: {
    marginVertical: 7,
  },
  statsCompact: {
    marginTop: 8,
    paddingVertical: 8,
    gap: 3,
  },
  shareCompact: {
    marginTop: 6,
  },
  // (ModalShell sizes the card for a 1px border: keep that width, only gild it)
  card: {
    borderColor: '#d4a017',
  },
  tag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    color: '#a16207',
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 2,
  },
  rule: {
    width: 80,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#d4a017',
    marginVertical: 12,
  },
  quote: {
    fontFamily: fonts.bodyItalic,
    fontSize: 14,
    lineHeight: 21,
    color: colors.ink,
    textAlign: 'center',
  },
  stats: {
    alignSelf: 'stretch',
    gap: 6,
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(250, 204, 21, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.35)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    flex: 1,
    fontSize: 13,
    color: colors.ink,
  },
  value: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.earth,
  },
  note: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 12,
  },
  share: {
    alignSelf: 'stretch',
    marginTop: 10,
    marginBottom: 6,
  },
});
