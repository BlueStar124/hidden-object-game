import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ChevronLeft,
  CircleQuestionMark,
  Lock,
  PawPrint,
  ScrollText,
  Search,
  Sparkles,
} from '../../../ui/icons';
import type { HiddenObject } from '../../../core/model';
import { hintCost } from '../../../core/scoring';
import { SpriteIcon } from '../../../ui/SpriteIcon';
import { TOOL_MARKS } from '../../../ui/toolMarks';
import { TOOLS } from '../../../content/tools';
import { colors } from '../../../ui/theme';

interface QuestPanelChipsProps {
  compact: boolean;
  isPortrait: boolean;
  normalFound: number;
  normalTotal: number;
  critters: HiddenObject[];
  crittersFound: number;
  clues: HiddenObject[];
  cluesFound: number;
  toolFinds: ReturnType<typeof import('../../../ui/toolMarks').byTool>;
  secret?: HiddenObject;
  secretFound: boolean;
  foundIds: string[];
  freeHintUsed: boolean;
  hintRefusal?: { needed: number; current: number; timestamp: number } | null;
  score: number;
  onToggleCollapse: () => void;
}

export const QuestPanelChips: React.FC<QuestPanelChipsProps> = React.memo((props) => {
  const {
    compact,
    isPortrait,
    normalFound,
    normalTotal,
    critters,
    crittersFound,
    clues,
    cluesFound,
    toolFinds,
    secret,
    secretFound,
    foundIds,
    freeHintUsed,
    hintRefusal,
    score,
    onToggleCollapse,
  } = props;

  return (
    <View style={[styles.header, compact && styles.headerCompact]}>
      <View style={styles.headerTitleRow}>
        <View style={styles.titleGroup}>
          <Search size={15} color={colors.ink} />
          <Text
            style={[styles.titleText, compact && styles.titleTextCompact]}
            numberOfLines={1}
          >
            {compact ? 'Manh mối' : 'Manh mối cần tìm'}
          </Text>
          <Text style={[styles.badge, compact && styles.badgeCompact]}>
            {normalFound}/{normalTotal}
          </Text>
        </View>

        {!isPortrait && (
          <Pressable
            onPress={onToggleCollapse}
            accessibilityRole="button"
            accessibilityLabel="Thu gọn cột manh mối"
            hitSlop={8}
            style={({ pressed }) => [styles.toggleBtn, pressed && styles.pressed]}
          >
            <ChevronLeft size={20} color={colors.ink} />
          </Pressable>
        )}
      </View>

      {/* Group chips */}
      <View style={styles.chipsRow}>
        {critters.length > 0 && (
          <View
            style={[styles.chip, compact && styles.chipCompact, crittersFound === critters.length && styles.chipDone]}
            accessibilityLabel={`Sinh vật ẩn nấp: ${crittersFound} trên ${critters.length}`}
          >
            <PawPrint size={13} color={colors.emerald} />
            <Text style={[styles.chipText, compact && styles.chipTextCompact]}>
              {crittersFound}/{critters.length}
            </Text>
            {/* Phones: the counts alone, so every chip fits on one line */}
            {!compact && (
            <View style={styles.miniIcons}>
              {critters.map((o) => (
                <SpriteIcon
                  key={o.id}
                  type={o.spriteType}
                  size={15}
                  revealed={foundIds.includes(o.id)}
                  glow={o.rare}
                />
              ))}
            </View>
            )}
          </View>
        )}

        {clues.length > 0 && (
          <View
            style={[styles.chip, compact && styles.chipCompact, cluesFound === clues.length && styles.chipDone]}
            accessibilityLabel={`Mảnh manh mối: ${cluesFound} trên ${clues.length}`}
          >
            <ScrollText size={13} color="#854d0e" />
            <Text style={[styles.chipText, compact && styles.chipTextCompact]}>
              {cluesFound}/{clues.length}
            </Text>
          </View>
        )}

        {toolFinds.map(([tool, finds]) => {
          const { icon: Icon, color } = TOOL_MARKS[tool];
          const spotted = finds.filter((o) => foundIds.includes(o.id)).length;
          return (
            <View
              key={tool}
              style={[styles.chip, compact && styles.chipCompact, spotted === finds.length && styles.chipDone]}
              accessibilityLabel={`${TOOLS[tool].finds}: ${spotted} trên ${finds.length}`}
            >
              <Icon size={13} color={color} />
              <Text style={[styles.chipText, compact && styles.chipTextCompact, { color }]}>
                {spotted}/{finds.length}
              </Text>
            </View>
          );
        })}

        {secret && (
          <View
            style={[styles.chip, compact && styles.chipCompact, secretFound && styles.chipDone]}
            accessibilityLabel={secretFound ? 'Bí mật đã mở' : 'Vật thể bí mật đang ẩn'}
          >
            {secretFound ? (
              <Sparkles size={13} color="#ca8a04" />
            ) : (
              <Lock size={13} color="#6D6255" />
            )}
            {!compact && (
              <Text style={[styles.chipText, secretFound && { color: '#ca8a04' }]}>
                {secretFound ? 'Bí mật' : '1 Bí mật'}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Hint status indicator */}
      {!freeHintUsed ? (
        <View style={[styles.hintStatusBar, compact && styles.hintStatusBarCompact]}>
          <Sparkles size={13} color="#b45309" />
          <Text style={[styles.hintStatusTextFree, compact && styles.hintTextCompact]} numberOfLines={1}>
            {compact ? 'Gợi ý đầu miễn phí' : '1 lượt gợi ý đầu: Miễn phí (0đ)'}
          </Text>
        </View>
      ) : hintRefusal || score < hintCost(1) ? (
        <View style={[styles.hintStatusBar, compact && styles.hintStatusBarCompact, styles.hintStatusBarAlert]}>
          <CircleQuestionMark size={13} color="#b91c1c" />
          <Text style={[styles.hintStatusTextAlert, compact && styles.hintTextCompact]} numberOfLines={compact ? 1 : undefined}>
            {compact
              ? `Gợi ý cần ${hintRefusal?.needed ?? hintCost(1)}đ · có ${score}đ`
              : hintRefusal
              ? `Cần ${hintRefusal.needed}đ để gợi ý · Bạn có ${score}đ`
              : `Gợi ý tiếp: Cần ${hintCost(1)}đ · Bạn có ${score}đ`}
          </Text>
        </View>
      ) : (
        <View style={[styles.hintStatusBar, compact && styles.hintStatusBarCompact]}>
          <CircleQuestionMark size={13} color="#6F4D2C" />
          <Text style={[styles.hintStatusText, compact && styles.hintTextCompact]} numberOfLines={compact ? 1 : undefined}>
            {compact ? `Gợi ý: ${hintCost(1)}đ · có ${score}đ` : `Gợi ý tiếp: ${hintCost(1)}đ · Bạn có ${score}đ`}
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  header: {
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(43, 39, 33, 0.1)',
    gap: 6,
  },
  headerCompact: {
    paddingBottom: 5,
    gap: 4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  titleGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleText: {
    fontSize: 16.5,
    fontWeight: '700',
    color: '#2B2721',
  },
  titleTextCompact: {
    fontSize: 14,
  },
  badge: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#fff',
    backgroundColor: '#6F4D2C',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  badgeCompact: {
    fontSize: 11.5,
    paddingHorizontal: 6,
  },
  toggleBtn: {
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    paddingHorizontal: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(43, 39, 33, 0.12)',
  },
  chipCompact: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    gap: 3,
  },
  chipDone: {
    backgroundColor: '#f3f9f4',
    borderColor: '#86efac',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6F4D2C',
  },
  chipTextCompact: {
    fontSize: 11,
  },
  miniIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginLeft: 2,
  },
  hintStatusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(254, 243, 199, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginHorizontal: 2,
  },
  hintStatusBarCompact: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  hintStatusBarAlert: {
    backgroundColor: 'rgba(254, 226, 226, 0.85)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  hintStatusTextFree: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#b45309',
  },
  hintStatusText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#6F4D2C',
  },
  hintStatusTextAlert: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#b91c1c',
  },
  hintTextCompact: {
    fontSize: 10.5,
  },
  pressed: {
    opacity: 0.7,
  },
});

