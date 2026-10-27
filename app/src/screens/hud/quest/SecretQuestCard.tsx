import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Lock, Sparkles } from '../../../ui/icons';
import type { HiddenObject } from '../../../core/model';
import { SpriteIcon } from '../../../ui/SpriteIcon';
import { colors } from '../../../ui/theme';
import { cardName, cardText } from './questTraits';
import { cardStyles } from '../QuestCard';

interface SecretQuestCardProps {
  secret: HiddenObject;
  secretFound: boolean;
  read: boolean;
  expanded: boolean;
  hinted: boolean;
  compact: boolean;
  onPress: (id: string) => void;
}

export const SecretQuestCard: React.FC<SecretQuestCardProps> = React.memo((props) => {
  const { secret, secretFound, read, expanded, hinted, compact, onPress } = props;

  const displayName = cardName(secret, secretFound, read);
  const displayClue = cardText(secret, secretFound, read);

  return (
    <Pressable
      onPress={() => onPress(secret.id)}
      accessibilityRole="button"
      accessibilityLabel={`${displayName}. ${displayClue}`}
      style={[
        cardStyles.card,
        compact && cardStyles.cardCompact,
        secretFound ? styles.secretCardFound : styles.secretCard,
        expanded && cardStyles.cardExpanded,
        hinted && cardStyles.cardHint,
      ]}
    >
      <View style={styles.secretThumb}>
        {secretFound ? (
          <Sparkles size={22} color="#ca8a04" />
        ) : (
          <Lock size={20} color="#6D6255" />
        )}
        {secretFound && secret.spriteType && (
          <SpriteIcon type={secret.spriteType} size={compact ? 24 : 30} glow />
        )}
      </View>

      <View style={cardStyles.cardInfo}>
        <Text
          style={[
            cardStyles.name,
            compact && cardStyles.nameCompact,
            secretFound && { color: colors.emerald },
          ]}
          numberOfLines={expanded ? undefined : 2}
        >
          {displayName}
        </Text>

        <Text
          style={[
            cardStyles.clue,
            compact && cardStyles.clueCompact,
            !secretFound && { fontStyle: 'italic', color: '#6D6255' },
          ]}
          numberOfLines={expanded ? undefined : 2}
        >
          {displayClue}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  secretCard: {
    backgroundColor: '#f7f3ea',
    borderColor: '#e0d8c8',
    borderStyle: 'dashed',
  },
  secretCardFound: {
    backgroundColor: '#fefce8',
    borderColor: '#fef08a',
  },
  secretThumb: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    gap: 2,
  },
});

