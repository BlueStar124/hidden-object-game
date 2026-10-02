import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { BookHeart, Check, Moon, X } from '../../ui/icons';
import type { Page, SpriteType } from '../../core/model';
import { BESTIARY } from '../../content/bestiary';
import { progress } from '../../core/progress';
import { COUNTRIES, pageRefOf } from '../../content';
import { colors, fonts } from '../../ui/theme';
import { ModalShell } from '../../ui/ModalShell';
import { RoundIconButton } from '../../ui/Buttons';
import { SpriteIcon } from '../../ui/SpriteIcon';

interface CreatureAlbumProps {
  pages: Page[]; // Day pages followed by night pages
  onClose: () => void;
}

type Filter = 'all' | 'creature' | 'object';

interface Sighting {
  label: string;
  night: boolean;
  found: boolean;
}

interface AlbumEntry {
  type: Exclude<SpriteType, 'seal'>;
  discovered: boolean;
  sightings: Sighting[];
}

const TABS: [Filter, string][] = [
  ['all', 'Tất cả'],
  ['creature', 'Sinh vật'],
  ['object', 'Đồ vật'],
];

/** "Sổ Tay Sinh Vật" — every creature and object the player has ever spotted, with a fun fact. */
export const CreatureAlbum: React.FC<CreatureAlbumProps> = ({ pages, onClose }) => {
  const [filter, setFilter] = useState<Filter>('all');
  const { width } = useWindowDimensions();
  // Columns follow the width the grid really gets (dialog padding, notch insets…)
  const [gridWidth, setGridWidth] = useState(Math.min(920, width - 24) - 32);
  const columns = gridWidth >= 700 ? 3 : gridWidth >= 460 ? 2 : 1;
  const cardWidth = Math.floor((gridWidth - (columns - 1) * 10) / columns);

  const entries = useMemo<AlbumEntry[]>(() => {
    const byType = new Map<Exclude<SpriteType, 'seal'>, AlbumEntry>();
    for (const page of pages) {
      const seen = new Set(progress.discovered(page.id));
      const ref = pageRefOf(page);
      // "Trang 3", or "Việt Nam · Trang 3" once there are several sketchbooks
      const label = `${COUNTRIES.length > 1 && ref ? `${ref.country.name} · ` : ''}Trang ${ref?.number ?? '?'}`;
      for (const obj of page.objects) {
        if (!obj.spriteType || obj.spriteType === 'seal') continue;
        const type = obj.spriteType;
        const entry = byType.get(type) ?? { type, discovered: false, sightings: [] };
        const found = seen.has(obj.id);
        entry.discovered ||= found;
        entry.sightings.push({ label, night: !!page.isNight, found });
        byType.set(type, entry);
      }
    }
    // Creatures first, then objects; each group in bestiary order
    const order = Object.keys(BESTIARY);
    return [...byType.values()].sort((a, b) => {
      const ka = BESTIARY[a.type].kind === 'creature' ? 0 : 1;
      const kb = BESTIARY[b.type].kind === 'creature' ? 0 : 1;
      return ka - kb || order.indexOf(a.type) - order.indexOf(b.type);
    });
  }, [pages]);

  const shown = entries.filter((e) => filter === 'all' || BESTIARY[e.type].kind === filter);
  const discovered = entries.filter((e) => e.discovered).length;
  const pct = Math.round((discovered / Math.max(1, entries.length)) * 100);
  const count = (kind: Filter) => {
    const list = entries.filter((e) => kind === 'all' || BESTIARY[e.type].kind === kind);
    return `${list.filter((e) => e.discovered).length}/${list.length}`;
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
        <View>
          <View style={styles.header}>
            <View style={styles.titleGroup}>
              <BookHeart size={24} color={colors.emerald} />
              <View style={{ flexShrink: 1 }}>
                <Text style={styles.title}>Sổ Tay Sinh Vật</Text>
                <Text style={styles.desc}>
                  Đã phát hiện {discovered}/{entries.length} loài & cổ vật · {pct}%
                </Text>
              </View>
            </View>
            <RoundIconButton onPress={onClose} accessibilityLabel="Đóng">
              <X size={20} color={colors.ink} />
            </RoundIconButton>
          </View>
          <View style={styles.progress}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <View style={styles.tabs}>
            {TABS.map(([key, label]) => (
              <Pressable
                key={key}
                accessibilityRole="tab"
                accessibilityState={{ selected: filter === key }}
                onPress={() => setFilter(key)}
                style={[styles.tab, filter === key && styles.tabActive]}
              >
                <Text style={[styles.tabText, filter === key && { color: '#fff' }]}>
                  {label} <Text style={{ opacity: 0.75 }}>{count(key)}</Text>
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      }
    >
      <View style={styles.grid} onLayout={(e) => setGridWidth(e.nativeEvent.layout.width)}>
        {shown.map((entry) => {
          const info = BESTIARY[entry.type];
          return (
            <View key={entry.type} style={[styles.card, { width: cardWidth }, !entry.discovered && styles.cardUnknown]}>
              <View style={styles.sprite}>
                <SpriteIcon type={entry.type} size={44} revealed={entry.discovered} />
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.name, !entry.discovered && styles.nameUnknown]}>{entry.discovered ? info.name : '???'}</Text>
                <Text style={styles.fact}>
                  {entry.discovered ? info.fact : 'Chưa phát hiện — hãy soi kỹ các trang bên dưới.'}
                </Text>
                <View style={styles.chips}>
                  {entry.sightings.map((s, i) => (
                    <View key={i} style={[styles.chip, s.night && styles.chipNight, s.found && styles.chipFound]}>
                      {s.night && <Moon size={10} color={s.found ? colors.emerald : '#3b4a7a'} />}
                      <Text style={[styles.chipText, s.night && { color: '#3b4a7a' }, s.found && { color: colors.emerald }]}>
                        {s.label}
                      </Text>
                      {s.found && <Check size={10} color={colors.emerald} />}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          );
        })}
      </View>
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
    paddingTop: 16,
    paddingBottom: 10,
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
  progress: {
    height: 6,
    marginHorizontal: 18,
    marginBottom: 10,
    borderRadius: 999,
    backgroundColor: 'rgba(43, 39, 33, 0.08)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#4f9d63',
  },
  tabs: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  tab: {
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tabActive: {
    backgroundColor: colors.emerald,
    borderColor: colors.emerald,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.inkSoft,
  },
  body: {
    alignItems: 'stretch',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 10,
  },
  card: {
    flexDirection: 'row',
    gap: 10,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#fff',
  },
  cardUnknown: {
    backgroundColor: '#faf6f0',
    borderStyle: 'dashed',
  },
  sprite: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(179, 131, 59, 0.08)',
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  name: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 15,
    color: colors.ink,
  },
  nameUnknown: {
    color: colors.inkFaint,
    letterSpacing: 1.5,
  },
  fact: {
    fontFamily: fonts.body,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.inkSoft,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(43, 39, 33, 0.06)',
  },
  chipNight: {
    backgroundColor: 'rgba(27, 36, 64, 0.1)',
  },
  chipFound: {
    backgroundColor: 'rgba(45, 122, 79, 0.12)',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.inkFaint,
  },
});
