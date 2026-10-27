import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View, type ScrollViewInstance } from 'react-native';
import type { HiddenObject } from '../../core/model';
import { isCritter, isMainObject } from '../../core/model';
import { colors } from '../../ui/theme';
import { useStableCallback } from '../../ui/useStableCallback';
import { byTool } from '../../ui/toolMarks';
import type { HudLayout } from './HUD';
import { QuestCard } from './QuestCard';
import { ZoomControl } from './ZoomControl';
import { QuestPanelCollapsed } from './quest/QuestPanelCollapsed';
import { QuestPanelChips } from './quest/QuestPanelChips';
import { SecretQuestCard } from './quest/SecretQuestCard';

export interface QuestPanelProps {
  layout: HudLayout;
  objects: HiddenObject[];
  foundIds: string[];
  revealedTextIds: string[]; // Cards a hint has read (core/hints)
  activeHintId?: string;
  activeHintLevel?: number;
  score?: number;
  freeHintUsed?: boolean;
  hintRefusal?: { needed: number; current: number; timestamp: number } | null;
  onHintObject: (id: string) => boolean | void; // Reads an unread card, as a hint
  bottomInset: number;
  insetLeft: number;
  insetRight: number;
  zoom: number;
  onStepZoom: (dir: 1 | -1) => void;
  zoomDisabled?: boolean;
  isPortrait?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const QuestPanel = React.memo<QuestPanelProps>(function QuestPanel({
  layout,
  objects,
  foundIds,
  revealedTextIds: readIds,
  activeHintId,
  activeHintLevel,
  score = 0,
  freeHintUsed = false,
  hintRefusal,
  onHintObject,
  bottomInset,
  insetLeft,
  zoom,
  onStepZoom,
  zoomDisabled = false,
  isPortrait = false,
  collapsed: externalCollapsed,
  onToggleCollapse,
}) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;
  const toggleCollapse = useMemo(
    () => onToggleCollapse ?? (() => setInternalCollapsed((c) => !c)),
    [onToggleCollapse]
  );
  const [expanded, setExpanded] = useState<string | null>(null);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const cardLayouts = useRef<Record<string, number>>({});

  const compact = layout === 'phoneLandscape';
  const normal = objects.filter(isMainObject);
  const secret = objects.find((o) => o.isSecret);
  const critters = objects.filter(isCritter);
  const clues = objects.filter((o) => o.isClue);
  const toolFinds = byTool(objects);
  const normalFound = normal.filter((o) => foundIds.includes(o.id)).length;
  const crittersFound = critters.filter((o) => foundIds.includes(o.id)).length;
  const cluesFound = clues.filter((o) => foundIds.includes(o.id)).length;
  const secretFound = secret ? foundIds.includes(secret.id) : false;

  // Toggle card expansion inline
  const toggle = (id: string) => setExpanded((cur) => (cur === id ? null : id));

  // Tapping a card not read yet reads it (as a hint); only expand if read/found or hint accepted
  const press = useStableCallback((id: string) => {
    if (!foundIds.includes(id) && !readIds.includes(id)) {
      onHintObject(id);
      return;
    }
    toggle(id);
  });

  // Read through a ref: collapsing must not re-run the hint effect, which would expand it again
  const collapsedRef = useRef(isCollapsed);
  collapsedRef.current = isCollapsed;

  // When a hint is triggered: expand sidebar, highlight card, and scroll to it
  useEffect(() => {
    if (!activeHintId) return;
    if (collapsedRef.current) toggleCollapse();
    setExpanded(activeHintId);
    const y = cardLayouts.current[activeHintId];
    if (y !== undefined) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - 20), animated: true });
    }
  }, [activeHintId, activeHintLevel, toggleCollapse]);

  const recordCardLayout = (id: string, y: number) => {
    cardLayouts.current[id] = y;
  };

  /* ------------------------------ Collapsed sidebar ------------------------------ */
  if (isCollapsed && !isPortrait) {
    return (
      <QuestPanelCollapsed
        insetLeft={insetLeft}
        bottomInset={bottomInset}
        compact={compact}
        normalFound={normalFound}
        normalTotal={normal.length}
        freeHintUsed={freeHintUsed}
        score={score}
        zoom={zoom}
        zoomDisabled={zoomDisabled}
        onToggleCollapse={toggleCollapse}
        onStepZoom={onStepZoom}
      />
    );
  }

  /* ------------------------------- Normal / Open ------------------------------- */
  return (
    <View
      style={[
        isPortrait ? styles.containerPortrait : styles.sidebar,
        !isPortrait && { paddingLeft: insetLeft + 8 },
      ]}
    >
      <QuestPanelChips
        compact={compact}
        isPortrait={isPortrait}
        normalFound={normalFound}
        normalTotal={normal.length}
        critters={critters}
        crittersFound={crittersFound}
        clues={clues}
        cluesFound={cluesFound}
        toolFinds={toolFinds}
        secret={secret}
        secretFound={secretFound}
        foundIds={foundIds}
        freeHintUsed={freeHintUsed}
        hintRefusal={hintRefusal}
        score={score}
        onToggleCollapse={toggleCollapse}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.cardsScroll}
        contentContainerStyle={styles.cardsContent}
        showsVerticalScrollIndicator
      >
        {normal.map((obj) => (
          <View
            key={obj.id}
            onLayout={(e) => recordCardLayout(obj.id, e.nativeEvent.layout.y)}
          >
            <QuestCard
              obj={obj}
              found={foundIds.includes(obj.id)}
              read={readIds.includes(obj.id)}
              hinted={activeHintId === obj.id}
              hintLevel={activeHintId === obj.id ? activeHintLevel : undefined}
              expanded={expanded === obj.id}
              compact={compact}
              onPress={press}
            />
          </View>
        ))}

        {secret && (
          <View onLayout={(e) => recordCardLayout(secret.id, e.nativeEvent.layout.y)}>
            <SecretQuestCard
              secret={secret}
              secretFound={secretFound}
              read={readIds.includes(secret.id)}
              expanded={expanded === secret.id}
              hinted={activeHintId === secret.id}
              compact={compact}
              onPress={press}
            />
          </View>
        )}
      </ScrollView>

      <View style={{ paddingBottom: bottomInset > 0 ? bottomInset : 4 }}>
        <ZoomControl
          zoom={zoom}
          onStepZoom={onStepZoom}
          disabled={zoomDisabled}
          compact={compact}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  sidebar: {
    height: '100%',
    backgroundColor: 'rgba(246, 242, 233, 0.98)',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.hairline,
    paddingRight: 8,
    paddingTop: 8,
    zIndex: 80,
  },
  containerPortrait: {
    flex: 1,
    backgroundColor: 'rgba(246, 242, 233, 0.98)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    paddingHorizontal: 12,
    paddingTop: 8,
    zIndex: 80,
  },
  cardsScroll: {
    flex: 1,
    marginTop: 6,
  },
  cardsContent: {
    gap: 8,
    paddingBottom: 12,
    paddingRight: 2,
  },
});
