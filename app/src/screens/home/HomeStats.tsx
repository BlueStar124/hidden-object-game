import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CircleCheckBig, PawPrint, Trophy } from '../../ui/icons';
import { formatNumber } from '../../ui/format';
import { colors, controlIcon, fonts } from '../../ui/theme';

interface HomeStatsProps {
  score: number;
  cleared: number;
  pageCount: number;
  album: { found: number; total: number };
  tight?: boolean;
  centred?: boolean;
}

export const HomeStats: React.FC<HomeStatsProps> = React.memo((props) => {
  const { score, cleared, pageCount, album, tight, centred } = props;

  return (
    <View style={[styles.stats, tight && styles.statsTight, centred && styles.centredRow]}>
      <View style={styles.stat}>
        <Trophy size={13} color={controlIcon.color} />
        <Text style={styles.statText}>{`${formatNumber(score)} điểm`}</Text>
      </View>
      <View style={styles.stat}>
        <CircleCheckBig size={13} color={controlIcon.color} />
        <Text style={styles.statText}>{`${cleared}/${pageCount} trang`}</Text>
      </View>
      <View style={styles.stat}>
        <PawPrint size={13} color={colors.earth} />
        <Text style={styles.statText}>{`${album.found}/${album.total} loài`}</Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  stats: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 14,
  },
  statsTight: {
    marginTop: 8,
    gap: 10,
  },
  centredRow: {
    justifyContent: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
  },
});

