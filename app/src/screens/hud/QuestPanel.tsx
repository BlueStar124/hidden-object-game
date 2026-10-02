import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { cancelAnimation, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import {
  CircleCheck,
  ChevronDown,
  ChevronUp,
  Feather,
  Footprints,
  Layers,
  Lock,
  Microscope,
  Palette,
  PawPrint,
  ScanEye,
  Search,
  Sparkles,
  Stamp,
  Timer,
  type LucideIcon,
} from '../../ui/icons';
import type { HiddenObject } from '../../core/model';
import { isMainObject } from '../../core/model';
import { colors, fonts } from '../../ui/theme';
import { SpriteIcon } from '../../ui/SpriteIcon';
import type { HudLayout } from './HUD';

interface QuestPanelProps {
  layout: HudLayout;
  objects: HiddenObject[];
  foundIds: string[];
  activeHintId?: string;
  bottomInset: number;
  insetLeft: number;
  insetRight: number;
}

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

const QuestCard: React.FC<{
  obj: HiddenObject;
  found: boolean;
  hinted: boolean;
  expanded: boolean;
  compact: boolean;
  width: number;
  onPress: () => void;
}> = ({ obj, found, hinted, expanded, compact, width, onPress }) => {
  const trait = camoTrait(obj);
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
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${obj.name}. ${found ? (obj.foundText ?? 'Đã tìm thấy!') : obj.clue}`}
        style={[styles.card, { width }, compact && styles.cardCompact, found && styles.cardFound, hinted && styles.cardHint]}
      >
        <View style={[styles.thumb, compact && styles.thumbCompact]}>
          {obj.spriteType && obj.spriteType !== 'seal' ? (
            // Only the silhouette until found — the colours are part of the surprise
            <SpriteIcon type={obj.spriteType} size={compact ? 22 : 28} revealed={found} />
          ) : (
            <Stamp size={20} color={colors.crimson} opacity={0.75} />
          )}
          {found && (
            <View style={styles.check}>
              <CircleCheck size={14} color={colors.emerald} />
            </View>
          )}
        </View>
        <View style={styles.cardInfo}>
          {trait && !compact && (
            <View style={[styles.trait, found && { opacity: 0.6 }]}>
              <trait.icon size={10} color={TRAIT_COLOR[trait.key]} />
              <Text style={[styles.traitText, { color: TRAIT_COLOR[trait.key] }]} numberOfLines={1}>
                {trait.label}
              </Text>
            </View>
          )}
          <Text style={[styles.name, compact && { fontSize: 13 }, found && styles.nameFound]} numberOfLines={1}>
            {obj.name}
          </Text>
          {(!compact || expanded) && (
            <Text style={styles.clue} numberOfLines={expanded ? undefined : 2}>
              {found ? obj.foundText || 'Đã tìm thấy!' : obj.clue}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

// Memoised: the game re-renders every second for its clock, the clue cards need not follow
export const QuestPanel = React.memo<QuestPanelProps>(({
  layout,
  objects,
  foundIds,
  activeHintId,
  bottomInset,
  insetLeft,
  insetRight,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const compact = layout === 'phoneLandscape';
  const wide = layout === 'wide';
  const cardWidth = wide ? 196 : compact ? 150 : 160;

  const normal = objects.filter(isMainObject);
  const secret = objects.find((o) => o.isSecret);
  const critters = objects.filter((o) => o.isBonus);
  const normalFound = normal.filter((o) => foundIds.includes(o.id)).length;
  const crittersFound = critters.filter((o) => foundIds.includes(o.id)).length;
  const secretFound = secret ? foundIds.includes(secret.id) : false;

  // Long clues are clipped: tapping a card reveals the whole text
  const toggle = (id: string) => setExpanded((cur) => (cur === id ? null : id));
  const expandedObj = expanded ? objects.find((o) => o.id === expanded) : undefined;

  // The landscape clue bubble closes by itself after a few seconds
  useEffect(() => {
    if (!compact || !expanded) return;
    const t = setTimeout(() => setExpanded(null), 5000);
    return () => clearTimeout(t);
  }, [compact, expanded]);

  const counter = (
    <View style={[styles.count, compact && styles.countCompact]}>
      <Search size={compact ? 14 : 15} color={colors.earth} />
      {!compact && <Text style={styles.countLabel}>{wide ? 'MANH MỐI CẦN TÌM' : 'MANH MỐI'}</Text>}
      <Text style={styles.badge}>
        {normalFound} / {normal.length}
      </Text>
    </View>
  );

  const badges = (
    <View style={styles.headerRight}>
      {critters.length > 0 && (
        <View style={[styles.critters, crittersFound === critters.length && styles.crittersDone]}>
          <PawPrint size={13} color={colors.emerald} />
          {wide && <Text style={styles.critterLabel}>SINH VẬT ẨN NẤP</Text>}
          <View style={styles.slots}>
            {critters.map((o) => (
              <SpriteIcon key={o.id} type={o.spriteType} size={17} revealed={foundIds.includes(o.id)} />
            ))}
          </View>
          <Text style={styles.critterCount}>
            {crittersFound}/{critters.length}
          </Text>
        </View>
      )}
      {secret && (
        <View style={[styles.secret, secretFound ? styles.secretOpen : styles.secretLocked]}>
          {secretFound ? <Sparkles size={13} color="#854d0e" /> : <Lock size={13} color={colors.inkFaint} />}
          {wide && (
            <Text style={[styles.secretText, { color: secretFound ? '#854d0e' : colors.inkFaint }]}>
              {secretFound ? 'BÍ MẬT ĐÃ MỞ' : '1 VẬT THỂ ẨN BÍ MẬT'}
            </Text>
          )}
        </View>
      )}
    </View>
  );

  // In the slim landscape strip a card does not grow: its clue opens in a bubble above the strip
  const grows = !compact;
  const cards = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.cards}
      style={compact && { flex: 1 }}
    >
      {normal.map((obj) => (
        <QuestCard
          key={obj.id}
          obj={obj}
          found={foundIds.includes(obj.id)}
          hinted={activeHintId === obj.id}
          expanded={grows && expanded === obj.id}
          compact={compact}
          width={grows && expanded === obj.id ? cardWidth + 90 : cardWidth}
          onPress={() => toggle(obj.id)}
        />
      ))}
      {secret && (
        <Pressable
          onPress={() => toggle(secret.id)}
          style={[
            styles.card,
            { width: grows && expanded === secret.id ? cardWidth + 90 : cardWidth },
            compact && styles.cardCompact,
            secretFound ? styles.secretCardFound : styles.secretCard,
          ]}
        >
          {secretFound ? <Sparkles size={18} color="#ca8a04" /> : <Lock size={16} color={colors.inkFaint} />}
          {secretFound && secret.spriteType && <SpriteIcon type={secret.spriteType} size={compact ? 22 : 28} glow />}
          <View style={styles.cardInfo}>
            <Text style={[styles.name, compact && { fontSize: 13 }]} numberOfLines={1}>
              {secretFound ? secret.name : '??? Vật Phẩm Bí Mật'}
            </Text>
            {grows && (
              <Text style={styles.clue} numberOfLines={expanded === secret.id ? undefined : 2}>
                {secretFound ? secret.foundText : SECRET_CLUE}
              </Text>
            )}
          </View>
        </Pressable>
      )}
    </ScrollView>
  );

  const dockStyle = [
    styles.dock,
    { paddingBottom: bottomInset + (compact ? 5 : 10), paddingLeft: insetLeft + 10, paddingRight: insetRight + 10 },
    compact && styles.dockCompact,
    collapsed && { paddingTop: 0, paddingBottom: bottomInset + 6, gap: 0 },
  ];

  const found = expandedObj ? foundIds.includes(expandedObj.id) : false;
  return (
    <View style={styles.shell} pointerEvents="box-none">
      <Pressable
        onPress={() => {
          setCollapsed(value => !value);
          setExpanded(null);
        }}
        accessibilityRole="button"
        accessibilityLabel={collapsed ? 'Hiện thanh manh mối' : 'Ẩn thanh manh mối'}
        accessibilityState={{ expanded: !collapsed }}
        hitSlop={6}
        style={({ pressed }) => [styles.toggle, { left: insetLeft + 16 }, pressed && { opacity: 0.7 }]}
      >
        {collapsed ? <ChevronUp size={20} color={colors.ink} /> : <ChevronDown size={20} color={colors.ink} />}
      </Pressable>
      <View style={dockStyle}>
      {!collapsed && (compact ? <>
        {expandedObj && (
          // Read-only and touch-through: it floats over the sketchbook, whose taps must still land
          <View pointerEvents="none" style={[styles.bubble, { left: insetLeft + 10, right: insetRight + 10 }]}>
            <Text style={styles.bubbleName}>{expandedObj.isSecret && !found ? '??? Vật Phẩm Bí Mật' : expandedObj.name}</Text>
            <Text style={styles.bubbleText}>
              {found ? expandedObj.foundText || 'Đã tìm thấy!' : expandedObj.isSecret ? SECRET_CLUE : expandedObj.clue}
            </Text>
          </View>
        )}
        {counter}
        {cards}
        {badges}
      </> : <>
      <View style={styles.header}>
        {counter}
        {badges}
      </View>
      {cards}
      </>)}
      </View>
    </View>
  );
});

const SECRET_CLUE = 'Vật được giấu kỹ nhất trang — hãy rê kính lúp thật chậm.';

const styles = StyleSheet.create({
  shell: {
    zIndex: 90,
    paddingTop: 32,
    marginTop: -32,
  },
  toggle: {
    position: 'absolute',
    top: 0,
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.hairline,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: 'rgba(246, 242, 233, 0.97)',
  },
  dock: {
    zIndex: 90,
    backgroundColor: 'rgba(246, 242, 233, 0.95)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    paddingTop: 7,
    gap: 7,
  },
  dockCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 5,
    gap: 8,
  },
  countCompact: {
    flexDirection: 'column',
    gap: 2,
  },
  bubble: {
    position: 'absolute',
    bottom: '100%',
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 252, 245, 0.97)',
    borderWidth: 1,
    borderColor: colors.hairline,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    gap: 2,
  },
  bubbleName: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 14,
    color: colors.ink,
  },
  bubbleText: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    lineHeight: 17,
    color: colors.inkSoft,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 2,
  },
  count: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.ink,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.earth,
    backgroundColor: 'rgba(43, 39, 33, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 1,
    borderRadius: 999,
    overflow: 'hidden',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  critters: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 7,
    paddingRight: 9,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(45, 122, 79, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(45, 122, 79, 0.18)',
  },
  crittersDone: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  critterLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: colors.emerald,
  },
  slots: {
    flexDirection: 'row',
    gap: 2,
  },
  critterCount: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.emerald,
  },
  secret: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  secretLocked: {
    backgroundColor: 'rgba(43, 39, 33, 0.06)',
  },
  secretOpen: {
    backgroundColor: '#fef08a',
    borderWidth: 1,
    borderColor: '#facc15',
  },
  secretText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cards: {
    gap: 8,
    paddingBottom: 2,
    alignItems: 'stretch',
  },
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
  cardFound: {
    backgroundColor: '#f8faf8',
    borderColor: '#bbf7d0',
    opacity: 0.88,
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
  cardInfo: {
    flex: 1,
    minWidth: 0,
    gap: 2,
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
  name: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 14,
    color: colors.ink,
  },
  nameFound: {
    textDecorationLine: 'line-through',
    color: colors.emerald,
  },
  clue: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    lineHeight: 13.5,
    color: colors.inkSoft,
  },
  secretCard: {
    backgroundColor: '#faf6f0',
    borderStyle: 'dashed',
  },
  secretCardFound: {
    backgroundColor: '#fefce8',
    borderColor: '#fde047',
  },
});
