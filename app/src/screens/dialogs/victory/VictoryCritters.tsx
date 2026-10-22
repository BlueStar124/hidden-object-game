import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PawPrint } from '../../../ui/icons';
import type { HiddenObject } from '../../../core/model';
import { SpriteIcon } from '../../../ui/SpriteIcon';
import { colors } from '../../../ui/theme';

interface VictoryCrittersProps {
  critters: HiddenObject[];
  crittersFound: number;
  foundIds: string[];
  compact: boolean;
}

export const VictoryCritters: React.FC<VictoryCrittersProps> = React.memo((props) => {
  const { critters, crittersFound, foundIds, compact } = props;

  if (critters.length === 0) return null;

  return (
    <View
      style={[
        styles.critters,
        compact && styles.crittersCompact,
        crittersFound === critters.length && styles.crittersDone,
      ]}
    >
      <View style={[styles.crittersHead, compact && { marginBottom: 4 }]}>
        <PawPrint size={14} color={colors.emerald} />
        <Text style={styles.crittersLabel}>
          SINH VẬT ẨN NẤP: {crittersFound}/{critters.length}
        </Text>
      </View>
      <View style={styles.crittersRow}>
        {critters.map((o) => {
          const found = foundIds.includes(o.id);
          return (
            <View key={o.id} style={styles.critter}>
              <SpriteIcon type={o.spriteType} size={compact ? 28 : 34} revealed={found} />
              <Text style={styles.critterName} numberOfLines={2}>
                {found ? o.name : '???'}
              </Text>
            </View>
          );
        })}
      </View>
      {crittersFound < critters.length && (
        <Text style={[styles.crittersNote, compact && { marginTop: 4 }]}>
          Vẫn còn sinh vật nấp trong tranh — bấm “Soi Tiếp” để tìm nốt cho Sổ Tay!
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  critters: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  crittersCompact: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginTop: 2,
  },
  crittersDone: {
    backgroundColor: 'rgba(45, 122, 79, 0.08)',
    borderColor: 'rgba(45, 122, 79, 0.3)',
  },
  crittersHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  crittersLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.emerald,
  },
  crittersRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flexWrap: 'wrap',
  },
  critter: {
    alignItems: 'center',
    width: 60,
    gap: 3,
  },
  critterName: {
    fontSize: 10,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  crittersNote: {
    fontSize: 11,
    color: colors.inkFaint,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
});

