import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '../../ui/Buttons';
import { House, Stamp } from '../../ui/icons';
import { formatDuration } from '../../ui/format';
import { useCompact } from '../../ui/layout';
import { ModalShell } from '../../ui/ModalShell';
import { colors, fonts } from '../../ui/theme';
import { ShareNote, ShareRow, type ShareActions } from '../share/ShareRow';

interface DailyDoneProps {
  /** The page the daily corner was taken from */
  pageTitle: string;
  country: string;
  /** The player's day ('2026-10-12') */
  day: string;
  timeTaken: number;
  /** Postcard */
  share?: ShareActions;
  onOpenPassport: () => void;
  onHome: () => void;
}

/** The daily page done: its stamp in the passport, the time, a postcard to send. */
export const DailyDone: React.FC<DailyDoneProps> = ({ pageTitle, country, day, timeTaken, share, onOpenPassport, onHome }) => {
  const compact = useCompact();
  const [, month, date] = day.split('-');
  const stamp = (
    <View style={[styles.stamp, compact && styles.stampCompact]}>
      <Text style={styles.stampCountry}>{country.toUpperCase()}</Text>
      <Text style={styles.stampDate}>
        {date}/{month}
      </Text>
    </View>
  );
  return (
    <ModalShell
      maxWidth={440}
      backdrop="rgba(35, 30, 24, 0.66)"
      footer={
        <View style={styles.actions}>
          <SecondaryButton label="Hộ Chiếu" icon={<Stamp size={16} color={colors.crimson} />} onPress={onOpenPassport} />
          <PrimaryButton label="Về Trang Chủ" icon={<House size={18} color="#fff" />} onPress={onHome} />
        </View>
      }
    >
      {/* Little height: the postcard button sits beside the stamp */}
      {share && compact ? <ShareRow {...share} layout="flank">{stamp}</ShareRow> : stamp}
      <Text style={styles.tag}>ĐÃ ĐÓNG DẤU HỘ CHIẾU</Text>
      <Text style={[styles.title, compact && styles.titleCompact]}>Trang Của Ngày Hoàn Tất!</Text>
      <Text style={styles.page}>{pageTitle}</Text>
      <Text style={styles.time}>Thời gian: {formatDuration(timeTaken)}</Text>
      {!compact && <Text style={styles.note}>Ngày mai sẽ có một góc tranh mới. Lỡ ngày cũng không sao, con dấu cũ vẫn còn nguyên.</Text>}
      {share && !compact && (
        <View style={styles.share}>
          <ShareRow {...share} />
        </View>
      )}
      {share?.note && compact && <ShareNote note={share.note} />}
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  stamp: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderStyle: 'dashed',
    borderColor: colors.crimson,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-10deg' }],
    marginBottom: 12,
  },
  stampCompact: {
    width: 84,
    height: 84,
    borderRadius: 42,
    marginBottom: 6,
  },
  stampCountry: {
    fontFamily: fonts.displayBold,
    fontSize: 13,
    letterSpacing: 1,
    color: colors.crimson,
  },
  stampDate: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.crimson,
  },
  tag: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.gold,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 25,
    lineHeight: 30,
    color: colors.ink,
    marginTop: 4,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 21,
    lineHeight: 26,
  },
  page: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.inkSoft,
    marginTop: 2,
  },
  time: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.earth,
    marginTop: 10,
  },
  note: {
    fontFamily: fonts.bodyItalic,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 8,
  },
  share: {
    alignSelf: 'stretch',
    marginTop: 12,
    marginBottom: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
});
