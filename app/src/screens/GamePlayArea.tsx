import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Board } from '../board/Board';
import type { Page } from '../core/model';
import type { HudLayout } from './hud/HUD';
import { QuestPanel } from './hud/QuestPanel';

interface GamePlayAreaProps {
  isPortrait: boolean;
  layout: HudLayout;
  page: Page;
  caseState: any;
  radarTargetId: string | null;
  nudgeTarget: any;
  turn: any;
  onTurnComplete: any;
  isFogged: boolean;
  onInspect: any;
  preload: any;
  boardActive: boolean;
  zoom: number;
  setZoom: (zoom: number) => void;
  stepZoomRef: React.MutableRefObject<((dir: 1 | -1) => void) | null>;
  onStepZoom: (dir: 1 | -1) => void;
  hint: any;
  hintRefusal: any;
  requestHint: (id?: string) => boolean | void;
  insets: { top: number; bottom: number; left: number; right: number };
  isTurning: boolean;
  sidebarCollapsed: boolean;
  effectiveSidebarWidth: number;
  onToggleSidebar: () => void;
}

export const GamePlayArea: React.FC<GamePlayAreaProps> = React.memo((props) => {
  const {
    isPortrait,
    layout,
    page,
    caseState: c,
    radarTargetId,
    nudgeTarget,
    turn,
    onTurnComplete,
    isFogged,
    onInspect,
    preload,
    boardActive,
    zoom,
    setZoom,
    stepZoomRef,
    onStepZoom,
    hint,
    hintRefusal,
    requestHint,
    insets,
    isTurning,
    sidebarCollapsed,
    effectiveSidebarWidth,
    onToggleSidebar,
  } = props;

  if (isPortrait) {
    return (
      <View style={styles.bodyPortrait}>
        <View style={styles.boardAreaPortrait}>
          <Board
            page={page}
            foundIds={c.foundItems}
            foundAt={c.foundAt}
            radarTargetId={radarTargetId}
            nudgeTarget={nudgeTarget}
            turn={turn}
            onTurnComplete={onTurnComplete}
            fogged={isFogged}
            onInspect={onInspect}
            preload={preload}
            active={boardActive}
            onZoomChange={setZoom}
            stepZoomRef={stepZoomRef}
          />
        </View>
        <QuestPanel
          layout={layout}
          objects={page.objects}
          foundIds={c.foundItems}
          revealedTextIds={c.revealedTextIds}
          activeHintId={hint?.objectId}
          activeHintLevel={hint?.level}
          score={c.score}
          freeHintUsed={c.freeHintUsed}
          hintRefusal={hintRefusal}
          onHintObject={requestHint}
          bottomInset={insets.bottom}
          insetLeft={insets.left}
          insetRight={insets.right}
          zoom={zoom}
          onStepZoom={onStepZoom}
          zoomDisabled={isTurning || !boardActive}
          isPortrait
        />
      </View>
    );
  }

  return (
    <View style={styles.bodyLandscape}>
      <View style={[styles.sidebarContainer, { width: effectiveSidebarWidth }]}>
        <QuestPanel
          layout={layout}
          objects={page.objects}
          foundIds={c.foundItems}
          revealedTextIds={c.revealedTextIds}
          activeHintId={hint?.objectId}
          activeHintLevel={hint?.level}
          score={c.score}
          freeHintUsed={c.freeHintUsed}
          hintRefusal={hintRefusal}
          onHintObject={requestHint}
          bottomInset={insets.bottom}
          insetLeft={insets.left}
          insetRight={insets.right}
          zoom={zoom}
          onStepZoom={onStepZoom}
          zoomDisabled={isTurning || !boardActive}
          collapsed={sidebarCollapsed}
          onToggleCollapse={onToggleSidebar}
        />
      </View>

      <View style={[styles.boardArea, { paddingRight: insets.right }]}>
        <Board
          page={page}
          foundIds={c.foundItems}
          foundAt={c.foundAt}
          radarTargetId={radarTargetId}
          nudgeTarget={nudgeTarget}
          turn={turn}
          onTurnComplete={onTurnComplete}
          fogged={isFogged}
          onInspect={onInspect}
          preload={preload}
          active={boardActive}
          onZoomChange={setZoom}
          stepZoomRef={stepZoomRef}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  bodyLandscape: {
    flex: 1,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  sidebarContainer: {
    height: '100%',
    position: 'relative',
    zIndex: 10,
    overflow: 'hidden',
  },
  bodyPortrait: {
    flex: 1,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  boardArea: {
    flex: 1,
    height: '100%',
  },
  boardAreaPortrait: {
    flex: 1,
    minHeight: 220,
  },
});

