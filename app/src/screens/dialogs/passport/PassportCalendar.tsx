import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from '../../../ui/icons';
import { codeOf, COUNTRIES } from '../../../content';
import { hashString } from '../../../core/random';
import { colors, fonts } from '../../../ui/theme';

interface PassportCalendarProps {
  today: string;
  stamps: Record<string, { countryId: string }>;
  inkOf: (countryId: string) => string;
}

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const dayKey = (y: number, m: number, d: number) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

const CELL = `${100 / 7}%` as const;

export const PassportCalendar: React.FC<PassportCalendarProps> = React.memo((props) => {
  const { today, stamps, inkOf } = props;
  const [year0, month0] = today.split('-').map(Number);
  const [shift, setShift] = useState(0); // months back from today's
  const shown = new Date(year0, month0 - 1 - shift, 1);
  const year = shown.getFullYear();
  const month = shown.getMonth();
  const days = new Date(year, month + 1, 0).getDate();
  const lead = (shown.getDay() + 6) % 7; // Monday first

  return (
    <View style={styles.container}>
      <View style={styles.month}>
        <Pressable
          onPress={() => setShift((s) => s + 1)}
          accessibilityLabel="Tháng trước"
          hitSlop={8}
          style={styles.arrow}
        >
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
          const country = stamp
            ? COUNTRIES.find((c) => c.id === stamp.countryId)
            : undefined;
          const tilt = (hashString(key) % 31) - 15;
          return (
            <View key={key} style={[styles.cell, key === today && styles.today]}>
              <Text style={[styles.dayNumber, stamp && styles.dayStamped]}>{i + 1}</Text>
              {stamp && (
                <View
                  style={[
                    styles.stamp,
                    {
                      borderColor: inkOf(stamp.countryId),
                      transform: [{ rotate: `${tilt}deg` }],
                    },
                  ]}
                  accessibilityLabel={`Ngày ${i + 1}: đã đóng dấu ${country?.name ?? ''}`}
                >
                  <Text style={[styles.stampText, { color: inkOf(stamp.countryId) }]}>
                    {country ? codeOf(country) : '★'}
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
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
});

