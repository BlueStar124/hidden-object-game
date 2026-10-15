import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import type { HiddenObject } from '../../core/model';
import {
  CircleCheck,
  CircleQuestionMark,
  Feather,
  Footprints,
  Layers,
  Microscope,
  Palette,
  ScanEye,
  Stamp,
  Timer,
  type LucideIcon,
} from '../../ui/icons';
import { SpriteIcon } from '../../ui/SpriteIcon';
import { colors, fonts } from '../../ui/theme';

/** A clue card under the board: what it says, how its target hides, and the card itself (QuestPanel lays them out). */

const SECRET_CLUE = 'Vật được giấu kỹ nhất trang — hãy rê kính lúp thật chậm.';

interface CamoTrait {
  key: keyof typeof TRAIT_COLOR;
  icon: LucideIcon;
  label: string;
}

const TRAIT_COLOR = {
  invisible: '#0284c7',
  roam: '#0f766e',
  shy: '#b45309',
  chameleon: '#4d7c0f',
  peek: '#7c3aed',
  tiny: '#be185d',
  ink: colors.inkFaint,
};

/** How a target is hidden, so players know what kind of searching it takes. */
function camoTrait(obj: HiddenObject): CamoTrait | null {
  if (!obj.spriteType || obj.spriteType === 'seal') return null;
  if (obj.camo === 'invisible') return { key: 'invisible', icon: ScanEye, label: 'Mực tàng hình · chỉ hiện qua kính lúp' };
  if (obj.roam) return { key: 'roam', icon: Footprints, label: 'Di chuyển liên tục · bắt đúng lúc' };
  if (obj.shy) return { key: 'shy', icon: Timer, label: 'Nhút nhát · thỉnh thoảng mới ló ra' };
  if (obj.camo === 'chameleon') return { key: 'chameleon', icon: Palette, label: 'Đổi màu theo nền' };
  if (obj.occluder) return { key: 'peek', icon: Layers, label: 'Nấp sau vật' };
  if ((obj.scale ?? 1) <= 0.45) return { key: 'tiny', icon: Microscope, label: 'Tí hon' };
  return { key: 'ink', icon: Feather, label: 'Hòa vào nét vẽ' };
}

/**
 * What a card is called. Until a hint reads it (`read`) or it is found, only its silhouette tells
 * what to look for; a riddle stands in for the name, and so does a thing that moved since the day.
 */
export function cardName(obj: HiddenObject, found: boolean, read: boolean): string {
  if (found || read) return obj.name;
  if (obj.isSecret) return '??? Vật Phẩm Bí Mật';
  if (obj.riddle) return 'Câu đố';
  return obj.dayAt ? 'Đổi chỗ lúc đêm' : '???';
}

/** What a card says: the found text, the clue once read, else the riddle, where it was by day, or how to read it. */
export function cardText(obj: HiddenObject, found: boolean, read: boolean): string {
  if (found) return obj.foundText || 'Đã tìm thấy!';
  if (read) return obj.clue;
  if (obj.isSecret) return SECRET_CLUE;
  if (obj.riddle) return obj.riddle;
  return obj.dayAt ? `Ban ngày: ${obj.dayAt.clue}` : 'Chạm thẻ hoặc bấm Gợi Ý để đọc tên và manh mối';
}

/** One clue card (memoised: a find re-renders only the cards it changes). */
export const QuestCard = React.memo<{
  obj: HiddenObject;
  found: boolean;
  read: boolean;
  hinted: boolean;
  expanded: boolean;
  compact: boolean;
  width: number;
  onPress: (id: string) => void;
}>(function QuestCard({ obj, found, read, hinted, expanded, compact, width, onPress }) {
  const trait = camoTrait(obj);
  // A card not read yet (a riddle, or where a thing was by day, is read from the start: it is the clue)
  const sealed = !found && !read && !obj.riddle && !obj.dayAt;
  const bounce = useSharedValue(0);
  useEffect(() => {
    if (hinted) bounce.value = withRepeat(withTiming(-4, { duration: 1000 }), -1, true);
    else {
      cancelAnimation(bounce);
      bounce.value = withTiming(0, { duration: 150 });
    }
  }, [hinted, bounce]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: bounce.value }] }));

  return (
    <Animated.View style={style}>
      <Pressable
        onPress={() => onPress(obj.id)}
        accessibilityRole="button"
        accessibilityLabel={sealed ? 'Thẻ chưa đọc. Chạm để đọc tên và manh mối (tốn một lượt gợi ý).' : `${cardName(obj, found, read)}. ${cardText(obj, found, read)}`}
        style={[
          styles.card,
          { width },
          compact && styles.cardCompact,
          sealed && styles.cardSealed,
          found && styles.cardFound,
          hinted && styles.cardHint,
        ]}
      >
        <View style={[styles.thumb, compact && styles.thumbCompact]}>
          {obj.riddle && !found && !read ? (
            // A riddle: even the silhouette would give the answer away
            <CircleQuestionMark size={22} color={colors.earth} />
          ) : obj.spriteType && obj.spriteType !== 'seal' ? (
            // Only the silhouette until found — the colours are part of the surprise
            <SpriteIcon type={obj.spriteType} size={compact ? 22 : 28} revealed={found} />
          ) : (
            <Stamp size={20} color={colors.crimson} opacity={0.75} />
          )}
          {obj.order !== undefined && (
            <View style={styles.order}>
              <Text style={styles.orderText}>{obj.order}</Text>
            </View>
          )}
          {found && (
            <View style={styles.check}>
              <CircleCheck size={14} color={colors.emerald} />
            </View>
          )}
        </View>
        <View style={styles.cardInfo}>
          {trait && !compact && (found || read) && (
            <View style={[styles.trait, found && { opacity: 0.6 }]}>
              <trait.icon size={10} color={TRAIT_COLOR[trait.key]} />
              <Text style={[styles.traitText, { color: TRAIT_COLOR[trait.key] }]} numberOfLines={1}>
                {trait.label}
              </Text>
            </View>
          )}
          <Text style={[styles.name, compact && { fontSize: 13 }, found && styles.nameFound, sealed && styles.nameSealed]} numberOfLines={1}>
            {cardName(obj, found, read)}
          </Text>
          {(!compact || expanded) && (
            <Text style={[styles.clue, sealed && styles.clueSealed]} numberOfLines={expanded ? undefined : 2}>
              {cardText(obj, found, read)}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
});

/** The card's frame, shared with the panel's secret card. */
export const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 10,
    minHeight: 58,
  },
  cardCompact: {
    paddingVertical: 4,
    minHeight: 38,
  },
  cardHint: {
    borderColor: colors.gold,
    backgroundColor: '#fffdf5',
    shadowColor: colors.gold,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  name: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 14,
    color: colors.ink,
  },
  clue: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    lineHeight: 13.5,
    color: colors.inkSoft,
  },
});

const styles = StyleSheet.create({
  ...cardStyles,
  cardFound: {
    backgroundColor: '#f8faf8',
    borderColor: '#bbf7d0',
    opacity: 0.88,
  },
  thumb: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbCompact: {
    width: 24,
    height: 24,
  },
  check: {
    position: 'absolute',
    right: -5,
    bottom: -4,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  order: {
    position: 'absolute',
    left: -5,
    top: -5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.earth,
  },
  orderText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fff',
  },
  trait: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  traitText: {
    flexShrink: 1,
    fontSize: 8.5,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  nameFound: {
    textDecorationLine: 'line-through',
    color: colors.emerald,
  },
  nameSealed: {
    color: colors.inkSoft,
    letterSpacing: 2,
    fontWeight: '700',
  },
  clueSealed: {
    color: colors.inkFaint,
    fontStyle: 'italic',
    fontSize: 9.5,
  },
  cardSealed: {
    backgroundColor: '#faf8f5',
    borderColor: '#e7e0d5',
  },
});
