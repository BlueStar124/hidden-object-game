import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  ChevronDown,
  ChevronUp,
  Lock,
  PawPrint,
  ScrollText,
  Search,
  Sparkles,
} from '../../ui/icons';
import type { HiddenObject } from '../../core/model';
import { isCritter, isMainObject } from '../../core/model';
import { colors, fonts } from '../../ui/theme';
import { useStableCallback } from '../../ui/useStableCallback';
import { SpriteIcon } from '../../ui/SpriteIcon';
import { byTool, TOOL_MARKS } from '../../ui/toolMarks';
import { TOOLS } from '../../content/tools';
import type { HudLayout } from './HUD';
import { cardName, cardStyles, cardText, QuestCard } from './QuestCard';

interface QuestPanelProps {
  layout: HudLayout;
  objects: HiddenObject[];
  foundIds: string[];
  revealedTextIds: string[]; // Cards a hint has read (core/hints)
  activeHintId?: string;
  onHintObject: (id: string) => void; // Reads an unread card, as a hint
  bottomInset: number;
  insetLeft: number;
  insetRight: number;
}


// Memoised: the game re-renders every second for its clock, the clue cards need not follow
export const QuestPanel = React.memo<QuestPanelProps>(({
  layout,
  objects,
  foundIds,
  revealedTextIds: readIds,
  activeHintId,
  onHintObject,
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
  const critters = objects.filter(isCritter);
  const clues = objects.filter((o) => o.isClue);
  const toolFinds = byTool(objects);
  const normalFound = normal.filter((o) => foundIds.includes(o.id)).length;
  const crittersFound = critters.filter((o) => foundIds.includes(o.id)).length;
  const cluesFound = clues.filter((o) => foundIds.includes(o.id)).length;
  const secretFound = secret ? foundIds.includes(secret.id) : false;

  // Long clues are clipped: tapping a card reveals the whole text
  const toggle = (id: string) => setExpanded((cur) => (cur === id ? null : id));
  // Tapping a card not read yet reads it (a hint's first step); afterwards a tap only opens and
  // closes it, so reading a long clue never costs anything
  // Stable: the memoised cards re-render only when what they show changes
  const press = useStableCallback((id: string) => {
    if (!foundIds.includes(id) && !readIds.includes(id)) onHintObject(id);
    toggle(id);
  });
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
              // A golden critter on this visit: its slot glows, so the player knows to look for it
              <SpriteIcon key={o.id} type={o.spriteType} size={17} revealed={foundIds.includes(o.id)} glow={o.rare} />
            ))}
          </View>
          <Text style={styles.critterCount}>
            {crittersFound}/{critters.length}
          </Text>
        </View>
      )}
      {toolFinds.map(([tool, finds]) => {
        // What the player's tools reveal here (invisible ink, the prism's drawings…)
        const { icon: Icon, color } = TOOL_MARKS[tool];
        const spotted = finds.filter((o) => foundIds.includes(o.id)).length;
        return (
          <View
            key={tool}
            style={[styles.secret, spotted === finds.length ? styles.secretOpen : styles.secretLocked]}
            accessibilityLabel={`${TOOLS[tool].finds}: ${spotted} trên ${finds.length}`}
          >
            <Icon size={13} color={color} />
            {wide && <Text style={[styles.secretText, { color }]}>{TOOLS[tool].badge.toUpperCase()}</Text>}
            <Text style={[styles.secretText, { color }]}>
              {spotted}/{finds.length}
            </Text>
          </View>
        );
      })}
      {clues.length > 0 && (
        <View
          style={[styles.secret, cluesFound === clues.length ? styles.secretOpen : styles.secretLocked]}
          accessibilityLabel={`Mảnh manh mối của chương: ${cluesFound} trên ${clues.length}`}
        >
          <ScrollText size={13} color={cluesFound === clues.length ? '#854d0e' : colors.earth} />
          {wide && <Text style={[styles.secretText, { color: colors.earth }]}>MẢNH MANH MỐI</Text>}
          <Text style={[styles.secretText, { color: colors.earth }]}>
            {cluesFound}/{clues.length}
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
          read={readIds.includes(obj.id)}
          hinted={activeHintId === obj.id}
          expanded={grows && expanded === obj.id}
          compact={compact}
          width={grows && expanded === obj.id ? cardWidth + 90 : cardWidth}
          onPress={press}
        />
      ))}
      {secret && (
        <Pressable
          onPress={() => press(secret.id)}
          style={[
            cardStyles.card,
            { width: grows && expanded === secret.id ? cardWidth + 90 : cardWidth },
            compact && cardStyles.cardCompact,
            secretFound ? styles.secretCardFound : styles.secretCard,
            activeHintId === secret.id && cardStyles.cardHint,
          ]}
        >
          {secretFound ? <Sparkles size={18} color="#ca8a04" /> : <Lock size={16} color={colors.inkFaint} />}
          {secretFound && secret.spriteType && <SpriteIcon type={secret.spriteType} size={compact ? 22 : 28} glow />}
          <View style={cardStyles.cardInfo}>
            <Text style={[cardStyles.name, compact && { fontSize: 13 }]} numberOfLines={1}>
              {cardName(secret, secretFound, readIds.includes(secret.id))}
            </Text>
            {grows && (
              <Text style={cardStyles.clue} numberOfLines={expanded === secret.id ? undefined : 2}>
                {cardText(secret, secretFound, readIds.includes(secret.id))}
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
            <Text style={styles.bubbleName}>{cardName(expandedObj, found, readIds.includes(expandedObj.id))}</Text>
            <Text style={styles.bubbleText}>{cardText(expandedObj, found, readIds.includes(expandedObj.id))}</Text>
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
    // Narrow upright phones: the badges go onto a second line rather than off the screen
    flexShrink: 1,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
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
  secretCard: {
    backgroundColor: '#faf6f0',
    borderStyle: 'dashed',
  },
  secretCardFound: {
    backgroundColor: '#fefce8',
    borderColor: '#fde047',
  },
});
