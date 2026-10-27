import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SpriteIcon } from '../../ui/SpriteIcon';
import { colors, fonts } from '../../ui/theme';

interface HomeIntroProps {
  columns: boolean;
  tight: boolean;
}

export const HomeIntro: React.FC<HomeIntroProps> = React.memo(({ columns, tight }) => {
  return (
    <View style={[styles.intro, !columns && styles.centred]}>
      {!tight && <SpriteIcon type="magnifying-glass" size={50} />}
      <Text style={styles.tag}>HỒ SƠ THÁM TỬ</Text>
      <Text style={[styles.title, tight && styles.titleTight, !columns && styles.centredText]}>
        The Lost Sketchbook
      </Text>
      <Text style={[styles.subtitle, !columns && styles.centredText]}>
        Cuốn sổ ký họa thất lạc · soi kính lúp, tìm vật ẩn trong tranh
      </Text>
      <View style={[styles.divider, tight && styles.dividerTight]} />
    </View>
  );
});

const styles = StyleSheet.create({
  intro: {
    gap: 3,
  },
  centred: {
    alignItems: 'center',
  },
  centredText: {
    textAlign: 'center',
  },
  tag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.earth,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 27,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  titleTight: {
    fontSize: 22,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.inkSoft,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
    marginTop: 8,
  },
  dividerTight: {
    marginTop: 4,
  },
});

