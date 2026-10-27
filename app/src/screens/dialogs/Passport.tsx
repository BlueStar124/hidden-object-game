import React, { useMemo } from 'react';
import { STAMPS_FOR_SEAL, stampsByCountry } from '../../core/daily';
import { migrantProgress, migrantSpot } from '../../core/migrants';
import { progress } from '../../core/progress';
import { COUNTRIES, placeOf } from '../../content';
import { MIGRANTS } from '../../content/migrants';
import { PrimaryButton } from '../../ui/Buttons';
import { DialogHeader } from '../../ui/DialogHeader';
import { CalendarDays, Stamp } from '../../ui/icons';
import { ModalShell } from '../../ui/ModalShell';
import { colors } from '../../ui/theme';
import { PassportCalendar } from './passport/PassportCalendar';
import { PassportMigrants } from './passport/PassportMigrants';
import { PassportSeals } from './passport/PassportSeals';

interface PassportProps {
  /** The player's day (core/random.localDay) */
  today: string;
  /** Today's daily page is there to play (and not done yet) */
  canPlayToday: boolean;
  onPlayDaily: () => void;
  onClose: () => void;
}

// Ink of each country's stamp (by its place in COUNTRIES)
const INKS = [colors.crimson, colors.emerald, '#1d4ed8', colors.earth, '#7c3aed', '#0f766e'];

/**
 * The detective's passport: a stamp for every daily page done, month by month, and a gold seal for
 * each country once it has enough. Missing a day loses nothing — there is no streak to keep.
 */
export const Passport: React.FC<PassportProps> = ({
  today,
  canPlayToday,
  onPlayDaily,
  onClose,
}) => {
  const stamps = useMemo(() => progress.stamps(), []);
  const inkOf = (countryId: string) =>
    INKS[Math.max(0, COUNTRIES.findIndex((c) => c.id === countryId)) % INKS.length];
  const perCountry = useMemo(() => stampsByCountry(stamps), [stamps]);
  const total = Object.keys(stamps).length;

  // The travelling creatures: where each one is today, and how far the player has followed it
  const travellers = useMemo(
    () =>
      MIGRANTS.map((m) => {
        const at = placeOf(m.spots[migrantSpot(m, today)].pageId)?.ref;
        return {
          m,
          ...migrantProgress(m, progress.discovered),
          where: at ? `${at.country.name} · Trang ${at.number}` : '',
        };
      }),
    [today]
  );

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
        canPlayToday ? (
          <PrimaryButton
            label="Chơi Trang Của Ngày"
            icon={<CalendarDays size={18} color="#fff" />}
            onPress={onPlayDaily}
          />
        ) : undefined
      }
    >
      <PassportCalendar today={today} stamps={stamps} inkOf={inkOf} />
      <PassportMigrants travellers={travellers} />
      <PassportSeals perCountry={perCountry} inkOf={inkOf} />
    </ModalShell>
  );
};
