import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  ChevronRight,
  CircleQuestionMark,
  Search,
  Sparkles,
} from '../../../ui/icons';
import { colors } from '../../../ui/theme';
import { ZoomControl } from '../ZoomControl';

interface QuestPanelCollapsedProps {
  insetLeft: number;
  bottomInset: number;
  compact: boolean;
  normalFound: number;
  normalTotal: number;
  freeHintUsed: boolean;
  score: number;
  zoom: number;
  zoomDisabled: boolean;
  onToggleCollapse: () => void;
  onStepZoom: (dir: 1 | -1) => void;
}

export const QuestPanelCollapsed: React.FC<QuestPanelCollapsedProps> = React.memo((props) => {
  const {
    insetLeft,
    bottomInset,
    compact,
    normalFound,
    normalTotal,
    freeHintUsed,
    score,
    zoom,
    zoomDisabled,
    onToggleCollapse,
    onStepZoom,
  } = props;

  return (
    <View style={[styles.sidebarCollapsed, { paddingLeft: insetLeft + 4 }]}>
      <View style={styles.collapsedHeader}>
        <Pressable
          onPress={onToggleCollapse}
          accessibilityRole="button"
          accessibilityLabel="Mở rộng cột manh mối"
          hitSlop={8}
          style={({ pressed }) => [styles.toggleBtn, pressed && styles.pressed]}
        >
          <ChevronRight size={22} color={colors.ink} />
        </Pressable>

        <View style={styles.collapsedBadge}>
          <Search size={14} color={colors.ink} />
          <Text style={styles.collapsedBadgeText}>
            {normalFound}/{normalTotal}
          </Text>
        </View>

        {!freeHintUsed ? (
          <View style={styles.collapsedHintBadge} accessibilityLabel="Gợi ý đầu miễn phí">
            <Sparkles size={13} color="#ca8a04" />
            <Text style={styles.collapsedHintText}>Free</Text>
          </View>
        ) : score < 50 ? (
          <View
            style={[styles.collapsedHintBadge, styles.collapsedHintBadgeAlert]}
            accessibilityLabel={`Cần 50 điểm để gợi ý, hiện có ${score} điểm`}
          >
            <CircleQuestionMark size={13} color="#b91c1c" />
            <Text style={[styles.collapsedHintText, { color: '#b91c1c' }]}>{score}đ</Text>
          </View>
        ) : null}
      </View>

      <View style={{ flex: 1 }} />

      <View style={{ paddingBottom: bottomInset + 4 }}>
        <ZoomControl
          zoom={zoom}
          onStepZoom={onStepZoom}
          disabled={zoomDisabled}
          collapsed
          compact={compact}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  sidebarCollapsed: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(246, 242, 233, 0.98)',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.hairline,
    paddingRight: 4,
    paddingTop: 8,
    alignItems: 'center',
    zIndex: 80,
  },
  collapsedHeader: {
    alignItems: 'center',
    gap: 8,
  },
  toggleBtn: {
    padding: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  collapsedBadge: {
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 2,
    gap: 3,
  },
  collapsedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6F4D2C',
  },
  collapsedHintBadge: {
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(254, 243, 199, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.25)',
    gap: 2,
  },
  collapsedHintBadgeAlert: {
    backgroundColor: 'rgba(254, 226, 226, 0.7)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  collapsedHintText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ca8a04',
  },
  pressed: {
    opacity: 0.7,
  },
});

