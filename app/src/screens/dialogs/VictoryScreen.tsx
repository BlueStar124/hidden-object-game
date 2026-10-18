import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { Sparkles, Trophy } from '../../ui/icons';
import { isCritter, isOptionalObject, type Page } from '../../core/model';
import { colors, fonts } from '../../ui/theme';
import { ModalShell } from '../../ui/ModalShell';
import { useCompact, useShortLandscape } from '../../ui/layout';
import { ShareRow, type ShareActions } from '../share/ShareRow';
import { PopStar } from './victory/PopStar';
import { VictoryCritters } from './victory/VictoryCritters';
import { VictoryScoreSheet } from './victory/VictoryScoreSheet';
import { VictoryActions } from './victory/VictoryActions';

interface VictoryScreenProps {
  page: Page;
  score: number;
  stars: number;
  timeBonus: number;
  timeTaken: number;
  mistakes: number;
  hintsUsed: number;
  isSecretFound: boolean;
  foundIds: string[];
  hasNextPage: boolean;
  nextLabel?: string;
  nightUnlocked?: string; // Title of the night page this victory just unlocked
  /** A friend's challenge: the time they dared the player to beat (seconds) */
  rivalTime?: number;
  /** Postcard & challenge */
  share?: ShareActions;
  onNextPage: () => void;
  onReplay: () => void;
  onExplore: () => void;
}

export const VictoryScreen: React.FC<VictoryScreenProps> = ({
  page,
  score,
  stars,
  timeBonus,
  timeTaken,
  mistakes,
  hintsUsed,
  isSecretFound,
  foundIds,
  hasNextPage,
  nextLabel,
  nightUnlocked,
  rivalTime,
  share,
  onNextPage,
  onReplay,
  onExplore,
}) => {
  const critters = page.objects.filter(isCritter);
  const crittersFound = critters.filter((o) => foundIds.includes(o.id)).length;
  const leftovers = page.objects.filter(
    (o) => isOptionalObject(o) && !foundIds.includes(o.id)
  ).length;

  // Phone held sideways: the verdict on the left, the score sheet and the buttons on the right
  const columns = useShortLandscape();
  const compact = useCompact();
  const float = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withTiming(-6, { duration: 1250, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [float]);

  const trophy = useAnimatedStyle(() => ({ transform: [{ translateY: float.value }] }));

  const actions = (
    <VictoryActions
      leftovers={leftovers}
      share={share}
      compact={compact}
      hasNextPage={hasNextPage}
      nextLabel={nextLabel}
      onNextPage={onNextPage}
      onReplay={onReplay}
      onExplore={onExplore}
    />
  );

  return (
    <ModalShell
      maxWidth={columns ? 860 : 440}
      backdrop="rgba(35, 30, 24, 0.66)"
      contentStyle={compact && styles.contentCompact}
      // Sideways the buttons go under the score sheet: a full-width row would cost the height
      footer={columns ? undefined : actions}
    >
      <View style={columns ? styles.columns : styles.stack}>
        <View style={columns ? styles.column : styles.stack}>
          {!compact && (
            <Animated.View style={[styles.trophy, trophy]}>
              <Trophy size={40} color={colors.gold} />
            </Animated.View>
          )}
          <Text style={styles.tag}>HỒ SƠ KHÉP LẠI</Text>
          <Text style={[styles.title, compact && styles.titleCompact]}>
            ĐÃ PHÁ GIẢI MANH MỐI!
          </Text>
          <Text style={[styles.pageName, compact && styles.gapCompact]}>{page.title}</Text>

          {share && compact ? (
            <View style={[styles.stars, styles.gapCompact]}>
              <ShareRow {...share} layout="flank">
                <View style={styles.starRow}>
                  {[1, 2, 3].map((i) => (
                    <PopStar key={i} index={i} active={i <= stars} size={30} />
                  ))}
                </View>
              </ShareRow>
            </View>
          ) : (
            <View style={[styles.stars, compact && styles.gapCompact]}>
              {[1, 2, 3].map((i) => (
                <PopStar key={i} index={i} active={i <= stars} size={compact ? 30 : 36} />
              ))}
            </View>
          )}

          {isSecretFound && (
            <View style={[styles.secret, compact && styles.gapCompact]}>
              <Sparkles size={15} color="#854d0e" />
              <Text style={styles.secretText}>PHÁT HIỆN CỔ VẬT BÍ MẬT! (+300 ĐIỂM)</Text>
            </View>
          )}

          <VictoryCritters
            critters={critters}
            crittersFound={crittersFound}
            foundIds={foundIds}
            compact={compact}
          />
        </View>

        <View style={columns ? styles.column : styles.stack}>
          <VictoryScoreSheet
            score={score}
            timeBonus={timeBonus}
            timeTaken={timeTaken}
            mistakes={mistakes}
            hintsUsed={hintsUsed}
            rivalTime={rivalTime}
            nightUnlocked={nightUnlocked}
            compact={compact}
          />

          {columns && (
            <View style={[styles.sideActions, compact && styles.sideActionsCompact]}>
              {actions}
            </View>
          )}
        </View>
      </View>
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  stack: {
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  columns: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  trophy: {
    marginBottom: 8,
  },
  tag: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.gold,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 27,
    lineHeight: 32,
    color: colors.ink,
    marginTop: 4,
    marginBottom: 2,
    textAlign: 'center',
  },
  titleCompact: {
    fontSize: 20,
    lineHeight: 24,
  },
  pageName: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    color: colors.inkSoft,
    marginBottom: 14,
  },
  stars: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  starRow: {
    flexDirection: 'row',
    gap: 12,
  },
  secret: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde047',
    marginBottom: 12,
  },
  secretText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#854d0e',
    letterSpacing: 0.5,
  },
  sideActions: {
    alignSelf: 'stretch',
    marginTop: 14,
  },
  sideActionsCompact: {
    marginTop: 8,
  },
  gapCompact: {
    marginBottom: 8,
  },
  contentCompact: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
});
