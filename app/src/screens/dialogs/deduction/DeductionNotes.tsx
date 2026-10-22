import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SpriteIcon } from '../../../ui/SpriteIcon';
import type { cluesOf } from '../../../core/mystery';
import { colors, fonts } from '../../../ui/theme';

interface DeductionNotesProps {
  clues: ReturnType<typeof cluesOf>;
}

export const DeductionNotes: React.FC<DeductionNotesProps> = React.memo(({ clues }) => {
  return (
    <View style={styles.board}>
      {clues.map(({ object, page }) => (
        <View key={`${page.id}/${object.id}`} style={styles.note}>
          <View style={styles.pin} />
          <SpriteIcon type={object.spriteType} size={34} revealed />
          <Text style={styles.noteName} numberOfLines={2}>
            {object.name}
          </Text>
          {object.foundText && <Text style={styles.noteText}>{object.foundText}</Text>}
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  board: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#c9a477',
    borderWidth: 3,
    borderColor: '#8c6226',
  },
  note: {
    width: 150,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#fffaf0',
    borderRadius: 4,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  pin: {
    position: 'absolute',
    top: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.crimson,
  },
  noteName: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
    textAlign: 'center',
  },
  noteText: {
    fontFamily: fonts.bodyItalic,
    fontSize: 11.5,
    lineHeight: 16,
    color: colors.inkSoft,
    textAlign: 'center',
  },
});
