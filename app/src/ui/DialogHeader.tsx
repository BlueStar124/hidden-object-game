import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RoundIconButton } from './Buttons';
import { X } from './icons';
import { colors, fonts } from './theme';

interface DialogHeaderProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  /** The close button (none: a dialog that must be answered) */
  onClose?: () => void;
  children?: React.ReactNode; // under the title (tabs…)
}

/** The header of a sheet dialog: icon, title and a line, and the close button (ModalShell `header`). */
export const DialogHeader: React.FC<DialogHeaderProps> = ({ icon, title, description, onClose, children }) => (
  <View style={styles.header}>
    <View style={styles.titleGroup}>
      {icon}
      <View style={styles.texts}>
        <Text style={styles.title}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
        {children}
      </View>
    </View>
    {onClose && (
      <RoundIconButton onPress={onClose} accessibilityLabel="Đóng">
        <X size={20} color={colors.ink} />
      </RoundIconButton>
    )}
  </View>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
    backgroundColor: 'rgba(240, 236, 226, 0.95)',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 1,
  },
  texts: {
    flexShrink: 1,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 20,
    color: colors.ink,
  },
  description: {
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 1,
  },
});
