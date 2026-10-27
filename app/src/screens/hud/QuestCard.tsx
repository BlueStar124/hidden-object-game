import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import type { HiddenObject } from '../../core/model';
import {
  CircleCheck,
  CircleQuestionMark,
  ScanEye,
  Stamp,
} from '../../ui/icons';
import { SpriteIcon } from '../../ui/SpriteIcon';
import { colors, fonts } from '../../ui/theme';
import {
  camoTrait,
  cardName,
  cardText,
  HOW_TO_READ,
  TRAIT_COLOR,
} from './quest/questTraits';

export { cardName, cardText };

export interface QuestCardProps {
  obj: HiddenObject;
  found: boolean;
  read: boolean;
  hinted: boolean;
  hintLevel?: number;
  expanded: boolean;
  compact: boolean;
  width?: number | string;
  onPress: (id: string) => void;
}

/** One clue card (memoised: a find re-renders only the cards it changes). */
export const QuestCard = React.memo<QuestCardProps>(function QuestCard({
  obj,
  found,
  read,
  hinted,
  hintLevel,
  expanded,
  compact,
  width = '100%',
  onPress,
}) {
  const trait = camoTrait(obj);
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
  const clue = cardText(obj, found, read);

  return (
    <Animated.View style={[style, { width: width as any }]}>
      <Pressable
        onPress={() => onPress(obj.id)}
        accessibilityRole="button"
        accessibilityLabel={
          sealed
            ? 'Thẻ chưa đọc. Chạm để đọc tên và manh mối (tốn một lượt gợi ý).'
            : `${cardName(obj, found, read)}. ${clue}`
        }
        style={[
          styles.card,
          compact && styles.cardCompact,
          sealed && styles.cardSealed,
          found && styles.cardFound,
          expanded && styles.cardExpanded,
          hinted && styles.cardHint,
        ]}
      >
        <View style={[styles.thumb, compact && styles.thumbCompact]}>
          {obj.riddle && !found && !read ? (
            <CircleQuestionMark size={compact ? 18 : 24} color={colors.earth} />
          ) : obj.spriteType && obj.spriteType !== 'seal' ? (
            <SpriteIcon type={obj.spriteType} size={compact ? 20 : 30} revealed={found} />
          ) : (
            <Stamp size={compact ? 17 : 22} color={colors.crimson} opacity={0.75} />
          )}
          {obj.order !== undefined && (
            <View style={styles.order}>
              <Text style={styles.orderText}>{obj.order}</Text>
            </View>
          )}
          {found && (
            <View style={styles.check}>
              <CircleCheck size={16} color={colors.emerald} />
            </View>
          )}
        </View>

        <View style={styles.cardInfo}>
          {hinted && hintLevel === 2 && !found && (
            <View style={styles.radarPill}>
              <ScanEye size={12} color="#b45309" />
              <Text style={styles.radarPillText}>🎯 Đang định vị bằng kính lúp</Text>
            </View>
          )}

          {trait && (found || read) && (
            <View style={[styles.trait, found && { opacity: 0.6 }]}>
              <trait.icon size={12} color={TRAIT_COLOR[trait.key]} />
              <Text
                style={[styles.traitText, { color: TRAIT_COLOR[trait.key] }]}
                numberOfLines={1}
              >
                {trait.label}
              </Text>
            </View>
          )}

          <Text
            style={[
              styles.name,
              compact && styles.nameCompact,
              found && styles.nameFound,
              sealed && styles.nameSealed,
            ]}
            numberOfLines={expanded ? undefined : 2}
          >
            {cardName(obj, found, read)}
          </Text>

          {!(compact && clue === HOW_TO_READ) && (
          <Text
            style={[
              styles.clue,
              compact && styles.clueCompact,
              sealed && styles.clueSealed,
              found && styles.clueFound,
            ]}
            numberOfLines={expanded ? undefined : 2}
          >
            {clue}
          </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
});

/** Shared card styles */
export const cardStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fffdf8',
    borderWidth: 1.5,
    borderColor: 'rgba(43, 39, 33, 0.14)',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardCompact: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 7,
  },
  cardExpanded: {
    borderColor: colors.earth,
    backgroundColor: '#fffdf5',
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  cardHint: {
    borderColor: colors.gold,
    borderWidth: 2,
    backgroundColor: '#fffdf0',
    shadowColor: colors.gold,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  cardInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    fontSize: 17.5,
    fontWeight: '600',
    color: '#2B2721',
  },
  nameCompact: {
    fontSize: 13.5,
  },
  clue: {
    fontFamily: fonts.body,
    fontSize: 15.5,
    lineHeight: 23,
    color: '#4B463F',
  },
  clueCompact: {
    fontSize: 12.5,
    lineHeight: 17,
  },
});

const styles = StyleSheet.create({
  ...cardStyles,
  cardFound: {
    backgroundColor: '#f3f9f4',
    borderColor: '#86efac',
    opacity: 0.9,
  },
  cardSealed: {
    backgroundColor: '#f8f4eb',
    borderColor: '#e2dbce',
  },
  thumb: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  thumbCompact: {
    width: 24,
    height: 24,
    marginTop: 0,
  },
  check: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    backgroundColor: '#fff',
    borderRadius: 9,
  },
  order: {
    position: 'absolute',
    left: -6,
    top: -6,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.earth,
  },
  orderText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  trait: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  traitText: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
  },
  nameFound: {
    textDecorationLine: 'line-through',
    color: colors.emerald,
  },
  nameSealed: {
    color: '#6D6255',
    letterSpacing: 1.5,
    fontWeight: '700',
  },
  clueSealed: {
    color: '#6D6255',
    fontStyle: 'italic',
  },
  clueFound: {
    color: '#55725d',
  },
  radarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  radarPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#b45309',
  },
});
