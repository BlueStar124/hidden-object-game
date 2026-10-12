import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { STAMPS_FOR_SEAL, stampsByCountry } from '../../core/daily';
import { progress } from '../../core/progress';
import { hashString } from '../../core/random';
import { codeOf, COUNTRIES } from '../../content';
import { PrimaryButton } from '../../ui/Buttons';
import { DialogHeader } from '../../ui/DialogHeader';
import { CalendarDays, ChevronLeft, ChevronRight, Sparkles, Stamp } from '../../ui/icons';
import { ModalShell } from '../../ui/ModalShell';
import { colors, fonts } from '../../ui/theme';

interface PassportProps {
  /** The player's day (core/random.localDay) */
  today: string;
  /** Today's daily page is there to play (and not done yet) */
  canPlayToday: boolean;
  onPlayDaily: () => void;
  onClose: () => void;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
// Ink of each country's stamp (by its place in COUNTRIES)
const INKS = [colors.crimson, colors.emerald, '#1d4ed8', colors.earth, '#7c3aed', '#0f766e'];

const dayKey = (y: number, m: number, d: number) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

/**
 * The detective's passport: a stamp for every daily page done, month by month, and a gold seal for
 * each country once it has enough. Missing a day loses nothing — there is no streak to keep.
 */
export const Passport: React.FC<PassportProps> = ({ today, canPlayToday, onPlayDaily, onClose }) => {
  const stamps = useMemo(() => progress.stamps(), []);
  const [year0, month0] = today.split('-').map(Number);
  const [shift, setShift] = useState(0); // months back from today's
  const shown = new Date(year0, month0 - 1 - shift, 1);
  const year = shown.getFullYear();
  const month = shown.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const lead = (shown.getDay() + 6) % 7; // Monday first

  const inkOf = (countryId: string) => INKS[Math.max(0, COUNTRIES.findIndex((c) => c.id === countryId)) % INKS.length];
  const perCountry = useMemo(() => stampsByCountry(stamps), [stamps]);
  const total = Object.keys(stamps).length;

  return (
    <ModalShell
      scroll
      maxWidth={560}
      zIndex={350}
      backdrop="rgba(28, 24, 20, 0.74)"
      onBackdropPress={onClose}
      header={
        <DialogHeader
          icon={<Stamp size={24} color={colors.crimson} />}
          title="Hộ Chiếu Thám Tử"
          description={`${total} con dấu · đủ ${STAMPS_FOR_SEAL} dấu một nước: tem vàng và bưu thiếp viền vàng`}
          onClose={onClose}
        />
      }
      footer={
        canPlayToday ? <PrimaryButton label="Chơi Trang Của Ngày" icon={<CalendarDays size={18} color="#fff" />} onPress={onPlayDaily} /> : undefined
      }
    >
      <View style={styles.month}>
        <Pressable onPress={() => setShift((s) => s + 1)} accessibilityLabel="Tháng trước" hitSlop={8} style={styles.arrow}>
          <ChevronLeft size={20} color={colors.ink} />
        </Pressable>
        <Text style={styles.monthName}>
          Tháng {month + 1} / {year}
        </Text>
        <Pressable
          onPress={() => setShift((s) => Math.max(0, s - 1))}
          disabled={shift === 0}
          accessibilityLabel="Tháng sau"
          hitSlop={8}
          style={[styles.arrow, shift === 0 && styles.disabled]}
        >
          <ChevronRight size={20} color={colors.ink} />
        </Pressable>
      </View>

      <View style={styles.grid}>
        {WEEKDAYS.map((w) => (
          <Text key={w} style={[styles.cell, styles.weekday]}>
            {w}
          </Text>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <View key={`lead${i}`} style={styles.cell} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const key = dayKey(year, month, i + 1);
          const stamp = stamps[key];
          const country = stamp ? COUNTRIES.find((c) => c.id === stamp.countryId) : undefined;
          // Each stamp lands a little askew, the same way every time
          const tilt = (hashString(key) % 31) - 15;
          return (
            <View key={key} style={[styles.cell, key === today && styles.today]}>
              <Text style={[styles.dayNumber, stamp && styles.dayStamped]}>{i + 1}</Text>
              {stamp && (
                <View
                  style={[styles.stamp, { borderColor: inkOf(stamp.countryId), transform: [{ rotate: `${tilt}deg` }] }]}
                  accessibilityLabel={`Ngày ${i + 1}: đã đóng dấu ${country?.name ?? ''}`}
                >
                  <Text style={[styles.stampText, { color: inkOf(stamp.countryId) }]}>{country ? codeOf(country) : '★'}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.seals}>
        {COUNTRIES.map((c) => {
          const count = perCountry.get(c.id) ?? 0;
          const sealed = count >= STAMPS_FOR_SEAL;
          return (
            <View key={c.id} style={[styles.seal, sealed && styles.sealDone]}>
              {sealed ? <Sparkles size={15} color="#854d0e" /> : <Stamp size={15} color={inkOf(c.id)} />}
              <Text style={styles.sealName}>{c.name}</Text>
              <Text style={styles.sealCount}>{sealed ? 'Tem vàng!' : `${count}/${STAMPS_FOR_SEAL}`}</Text>
            </View>
          );
        })}
      </View>
    </ModalShell>
  );
};

const CELL = `${100 / 7}%` as const;

const styles = StyleSheet.create({
  month: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
  },
  arrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  disabled: {
    opacity: 0.3,
  },
  monthName: {
    fontFamily: fonts.displayBold,
    fontSize: 17,
    color: colors.ink,
    minWidth: 130,
    textAlign: 'center',
  },
  grid: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    width: CELL,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekday: {
    height: 24,
    fontSize: 11,
    fontWeight: '700',
    color: colors.earth,
    textAlign: 'center',
  },
  today: {
    backgroundColor: 'rgba(216, 168, 94, 0.18)',
    borderRadius: 10,
  },
  dayNumber: {
    fontSize: 12,
    color: colors.inkSoft,
  },
  dayStamped: {
    position: 'absolute',
    top: 2,
    left: 6,
    fontSize: 10,
  },
  stamp: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  seals: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 6,
  },
  seal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.paper,
  },
  sealDone: {
    backgroundColor: '#fef08a',
    borderColor: '#facc15',
  },
  sealName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
  sealCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.earth,
  },
});
