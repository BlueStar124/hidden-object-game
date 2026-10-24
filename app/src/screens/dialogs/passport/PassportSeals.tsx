import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Sparkles, Stamp } from '../../../ui/icons';
import { STAMPS_FOR_SEAL } from '../../../core/daily';
import { COUNTRIES } from '../../../content';
import { colors } from '../../../ui/theme';

interface PassportSealsProps {
  perCountry: Map<string, number>;
  inkOf: (countryId: string) => string;
}

export const PassportSeals: React.FC<PassportSealsProps> = React.memo((props) => {
  const { perCountry, inkOf } = props;

  return (
    <View style={styles.seals}>
      {COUNTRIES.map((c) => {
        const count = perCountry.get(c.id) ?? 0;
        const sealed = count >= STAMPS_FOR_SEAL;
        return (
          <View key={c.id} style={[styles.seal, sealed && styles.sealDone]}>
            {sealed ? (
              <Sparkles size={15} color="#854d0e" />
            ) : (
              <Stamp size={15} color={inkOf(c.id)} />
            )}
            <Text style={styles.sealName}>{c.name}</Text>
            <Text style={styles.sealCount}>
              {sealed ? 'Tem vàng!' : `${count}/${STAMPS_FOR_SEAL}`}
            </Text>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  seals: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
    marginBottom: 6,
  },
  seal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.paper,
  },
  sealDone: {
    backgroundColor: '#fef08a',
    borderColor: '#facc15',
  },
  sealName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink,
  },
  sealCount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.earth,
  },
});

