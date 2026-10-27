import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SpriteIcon } from '../../../ui/SpriteIcon';
import type { Migrant } from '../../../core/model';
import { colors, fonts } from '../../../ui/theme';

interface TravellerProgress {
  m: Migrant;
  met: number;
  total: number;
  where: string;
}

interface PassportMigrantsProps {
  travellers: TravellerProgress[];
}

export const PassportMigrants: React.FC<PassportMigrantsProps> = React.memo((props) => {
  const { travellers } = props;

  return (
    <View style={styles.container}>
      <Text style={styles.section}>BẠN ĐỒNG HÀNH LỮ HÀNH</Text>
      {travellers.map(({ m, met, total: places, where }) => (
        <View key={m.id} style={[styles.traveller, met === places && styles.travellerDone]}>
          <SpriteIcon type={m.spriteType} size={34} revealed={met > 0} />
          <View style={styles.travellerText}>
            <Text style={styles.travellerName}>
              {m.name} · {met}/{places} nơi
            </Text>
            <Text style={styles.travellerWhere}>Hôm nay ghé: {where}</Text>
            {met === places && <Text style={styles.travellerStory}>{m.story}</Text>}
          </View>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
  },
  section: {
    alignSelf: 'stretch',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    color: colors.earth,
    marginTop: 14,
    marginBottom: 6,
  },
  traveller: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    marginBottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.paper,
  },
  travellerDone: {
    borderColor: 'rgba(45, 122, 79, 0.4)',
    backgroundColor: 'rgba(45, 122, 79, 0.06)',
  },
  travellerText: {
    flex: 1,
    gap: 2,
  },
  travellerName: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
  },
  travellerWhere: {
    fontSize: 12,
    color: colors.inkSoft,
  },
  travellerStory: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 20,
    color: colors.ink,
    textAlign: 'justify',
    marginTop: 4,
  },
});

