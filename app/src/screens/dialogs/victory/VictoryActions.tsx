import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ArrowRight, RotateCcw, ScanSearch, Trophy } from '../../../ui/icons';
import { PrimaryButton, SecondaryButton } from '../../../ui/Buttons';
import { ShareNote, ShareRow, type ShareActions } from '../../share/ShareRow';
import { colors } from '../../../ui/theme';

interface VictoryActionsProps {
  leftovers: number;
  share?: ShareActions;
  compact: boolean;
  hasNextPage: boolean;
  nextLabel?: string;
  onNextPage: () => void;
  onReplay: () => void;
  onExplore: () => void;
}

export const VictoryActions: React.FC<VictoryActionsProps> = React.memo((props) => {
  const {
    leftovers,
    share,
    compact,
    hasNextPage,
    nextLabel,
    onNextPage,
    onReplay,
    onExplore,
  } = props;

  return (
    <View style={{ gap: compact ? 6 : 10 }}>
      {/* Keep hunting the leftovers (album only, no score) */}
      {leftovers > 0 && (
        <Pressable
          onPress={onExplore}
          style={({ pressed }) => [
            styles.explore,
            compact && styles.exploreCompact,
            pressed && { backgroundColor: 'rgba(45, 122, 79, 0.15)' },
          ]}
        >
          <ScanSearch size={17} color={colors.emerald} />
          <Text style={styles.exploreText}>
            Soi Tiếp Tìm Nốt {leftovers} Vật Ẩn
          </Text>
        </Pressable>
      )}

      {/* Little height: the share buttons are icons beside the stars instead */}
      {share && !compact && <ShareRow {...share} />}
      {share?.note && compact && <ShareNote note={share.note} />}

      <View style={styles.actions}>
        <SecondaryButton
          label="Chơi Lại"
          icon={<RotateCcw size={16} color={colors.ink} />}
          onPress={onReplay}
        />
        <PrimaryButton
          label={nextLabel ?? (hasNextPage ? 'Lật Trang Mới' : 'Hoàn Thành Vụ Án')}
          iconAfter={
            hasNextPage ? (
              <ArrowRight size={18} color="#fff" />
            ) : (
              <Trophy size={18} color="#fff" />
            )
          }
          onPress={onNextPage}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  explore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: 'rgba(45, 122, 79, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(45, 122, 79, 0.3)',
  },
  exploreCompact: {
    paddingVertical: 7,
  },
  exploreText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.emerald,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
});

