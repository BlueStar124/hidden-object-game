import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  CircleCheckBig,
  Lock,
  Moon,
  PawPrint,
  Star,
} from '../../../ui/icons';
import { isCritter, type Page } from '../../../core/model';
import { withTools } from '../../../core/tools';
import type { ownedTools } from '../../../game/ownedTools';
import { progress } from '../../../core/progress';
import { story } from '../../../content';
import { TOOLS } from '../../../content/tools';
import { byTool, TOOL_MARKS } from '../../../ui/toolMarks';
import { BookThumb } from '../../BookThumb';
import { colors, fonts } from '../../../ui/theme';
import { formatNumber } from '../../../ui/format';

interface PageIndexCardProps {
  scene: Page;
  night?: Page;
  idx: number;
  cardWidth: number;
  isCurrent: boolean;
  isCurrentNight: boolean;
  countryId: string;
  tools: ReturnType<typeof ownedTools>;
  onSelect: (index: number, night: boolean, countryId: string) => void;
  onNotice: (msg: string) => void;
  onClose: () => void;
}

const Stars: React.FC<{ count: number; size?: number }> = ({ count, size = 12 }) => (
  <View style={{ flexDirection: 'row', gap: 2 }}>
    {[0, 1, 2].map((i) => (
      <Star
        key={i}
        size={size}
        color={i < count ? '#f59e0b' : '#9ca3af'}
        fill={i < count ? '#f59e0b' : 'transparent'}
      />
    ))}
  </View>
);

function critterProgress(page: Page) {
  const seen = new Set(progress.discovered(page.id));
  const ids = page.objects.filter(isCritter).map((o) => o.id);
  return { total: ids.length, spotted: ids.filter((id) => seen.has(id)).length };
}

function toolProgress(page: Page, tools: ReturnType<typeof ownedTools>) {
  const seen = new Set(progress.discovered(page.id));
  return byTool(withTools(page, tools).objects).map(([tool, finds]) => ({
    tool,
    total: finds.length,
    spotted: finds.filter((o) => seen.has(o.id)).length,
  }));
}

export const PageIndexCard: React.FC<PageIndexCardProps> = React.memo((props) => {
  const {
    scene,
    night,
    idx,
    cardWidth,
    isCurrent,
    isCurrentNight,
    countryId,
    tools,
    onSelect,
    onNotice,
    onClose,
  } = props;

  const result = progress.pageResult(scene.id);
  const passed = !!result && result.stars > 0;
  const isUnlocked = story.isUnlocked(scene.id);
  const nextTarget = story.nextTarget();
  const isNextTarget = !passed && nextTarget?.id === scene.id;
  const lockReason = isUnlocked ? null : story.lockReason(scene.id);
  const critters = critterProgress(scene);
  const toolFinds = toolProgress(scene, tools);
  const nightResult = night ? progress.pageResult(night.id) : undefined;
  const nightCritters = night ? critterProgress(night) : null;

  return (
    <Pressable
      onPress={() => {
        if (!isUnlocked) {
          onNotice(lockReason ?? 'Hoàn thành trang trước để mở khóa');
          return;
        }
        onSelect(idx, false, countryId);
        onClose();
      }}
      style={({ pressed }) => [
        styles.card,
        { width: cardWidth },
        isCurrent && styles.cardActive,
        !isUnlocked && styles.cardLocked,
        pressed && isUnlocked && styles.cardPressed,
      ]}
    >
      <View>
        <BookThumb scene={scene} width={cardWidth - 3} />
        <Text style={styles.numTag}>Trang {idx + 1}</Text>
        {isCurrent && <Text style={styles.currentBadge}>Đang mở</Text>}
        {passed && (
          <View style={styles.passedBadge}>
            <CircleCheckBig size={13} color="#fff" />
            <Text style={styles.passedText}>Hoàn tất</Text>
          </View>
        )}
        {!isUnlocked && (
          <View style={styles.lockedThumbOverlay}>
            <Lock size={22} color="#fff" />
            <Text style={styles.lockedThumbText}>Khóa</Text>
          </View>
        )}
        {isUnlocked && isNextTarget && (
          <View style={styles.nextBadge}>
            <Text style={styles.nextBadgeText}>Tiếp theo</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.cardTitle, !isUnlocked && styles.cardTitleLocked]}>
          {scene.title}
        </Text>
        <Text style={styles.cardSub}>{scene.subtitle}</Text>
        {!isUnlocked ? (
          <View style={styles.lockReasonBox}>
            <Lock size={11} color="#b45309" />
            <Text style={styles.lockReasonText} numberOfLines={2}>
              {lockReason ?? 'Chưa mở khóa'}
            </Text>
          </View>
        ) : (
          <View style={styles.meta}>
            {result ? (
              <View style={styles.row}>
                <Stars count={result.stars} />
                <Text style={styles.score}>{formatNumber(result.highScore)} đ</Text>
              </View>
            ) : (
              <Text style={styles.unplayed}>Chưa giải mã</Text>
            )}
            {critters.total > 0 && (
              <View style={styles.row}>
                <PawPrint
                  size={11}
                  color={
                    critters.spotted === critters.total
                      ? colors.emerald
                      : colors.inkFaint
                  }
                />
                <Text
                  style={[
                    styles.critters,
                    critters.spotted === critters.total && { color: colors.emerald },
                  ]}
                >
                  {critters.spotted}/{critters.total}
                </Text>
              </View>
            )}
            {toolFinds.map(({ tool, spotted, total }) => {
              const { icon: Icon, color } = TOOL_MARKS[tool];
              const done = spotted === total;
              return (
                <View
                  key={tool}
                  style={styles.row}
                  accessibilityLabel={`${TOOLS[tool].finds}: ${spotted} trên ${total}`}
                >
                  <Icon size={11} color={done ? colors.emerald : color} />
                  <Text style={[styles.critters, { color: done ? colors.emerald : color }]}>
                    {spotted}/{total}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
        {night && (
          <Pressable
            onPress={() => {
              if (!passed) {
                onNotice('Hoàn thành trang ngày để mở khóa trang đêm');
                return;
              }
              onSelect(idx, true, countryId);
              onClose();
            }}
            style={[
              styles.nightBtn,
              !passed && styles.nightLocked,
              isCurrentNight && styles.nightActive,
            ]}
          >
            {passed ? (
              <Moon size={13} color={colors.moonlight} />
            ) : (
              <Lock size={12} color={colors.inkFaint} />
            )}
            <Text
              style={[styles.nightName, !passed && { color: colors.inkFaint }]}
              numberOfLines={1}
            >
              {passed ? night.title : 'Trang Đêm · khóa'}
            </Text>
            {passed && nightResult && <Stars count={nightResult.stars} size={11} />}
            {passed && nightCritters && nightCritters.total > 0 && (
              <View style={styles.row}>
                <PawPrint size={10} color={colors.moonlight} />
                <Text style={styles.nightCritters}>
                  {nightCritters.spotted}/{nightCritters.total}
                </Text>
              </View>
            )}
          </Pressable>
        )}
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderColor: colors.hairline,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  cardActive: {
    borderColor: colors.gold,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  cardLocked: {
    backgroundColor: 'rgba(235, 230, 220, 0.6)',
    borderColor: 'rgba(43, 39, 33, 0.15)',
    borderStyle: 'dashed',
  },
  cardPressed: {
    backgroundColor: '#fff',
    borderColor: colors.earth,
  },
  numTag: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 26, 21, 0.82)',
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  currentBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.gold,
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  passedBadge: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(45, 122, 79, 0.92)',
  },
  passedText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  lockedThumbOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(28, 24, 20, 0.58)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  lockedThumbText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  nextBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#059669',
  },
  nextBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  info: {
    padding: 12,
    gap: 3,
  },
  cardTitle: {
    fontFamily: fonts.displaySemiBold,
    fontSize: 15.5,
    color: colors.ink,
  },
  cardTitleLocked: {
    color: colors.inkSoft,
  },
  lockReasonBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(254, 243, 199, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    marginTop: 4,
  },
  lockReasonText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#b45309',
  },
  cardSub: {
    fontSize: 11,
    color: colors.inkFaint,
    marginBottom: 6,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(43, 39, 33, 0.08)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  score: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.earth,
    marginLeft: 4,
  },
  unplayed: {
    fontFamily: fonts.bodyItalic,
    fontSize: 11,
    color: colors.inkFaint,
  },
  critters: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.inkFaint,
  },
  nightBtn: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: colors.night,
    borderWidth: 1,
    borderColor: 'rgba(27, 36, 64, 0.35)',
  },
  nightLocked: {
    backgroundColor: 'rgba(43, 39, 33, 0.06)',
    borderStyle: 'dashed',
    borderColor: colors.hairline,
  },
  nightActive: {
    borderColor: colors.gold,
    borderWidth: 2,
  },
  nightName: {
    flex: 1,
    color: colors.moonlight,
    fontSize: 11.5,
    fontWeight: '700',
  },
  nightCritters: {
    color: colors.moonlight,
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.85,
  },
});

