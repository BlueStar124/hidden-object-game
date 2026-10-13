import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { progress } from '../../core/progress';
import { PrimaryButton, SecondaryButton } from '../../ui/Buttons';
import { ModalShell } from '../../ui/ModalShell';
import { colors, fonts } from '../../ui/theme';

interface SaveBackupDialogProps {
  onClose: () => void;
}

export const SaveBackupDialog: React.FC<SaveBackupDialogProps> = ({ onClose }) => {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [pasteInput, setPasteInput] = useState('');
  const [importMessage, setImportMessage] = useState<{ text: string; error?: boolean } | null>(null);

  const handleCopy = () => {
    try {
      const code = progress.exportSave();
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(code).then(
          () => setCopyStatus('Đã sao chép mã lưu vào bộ nhớ tạm!'),
          () => setCopyStatus('Mã lưu:\n' + code.slice(0, 32) + '...')
        );
      } else {
        setCopyStatus('Mã lưu:\n' + code.slice(0, 32) + '...');
      }
    } catch {
      setCopyStatus('Không thể xuất bản lưu.');
    }
  };

  const handleImport = () => {
    if (!pasteInput.trim()) {
      setImportMessage({ text: 'Vui lòng dán mã lưu vào ô bên dưới.', error: true });
      return;
    }
    const res = progress.importSave(pasteInput.trim());
    if (res.success) {
      setImportMessage({ text: 'Khôi phục tiến độ thành công! Vui lòng tải lại trang.' });
    } else {
      setImportMessage({ text: res.error || 'Mã lưu không hợp lệ.', error: true });
    }
  };

  return (
    <ModalShell maxWidth={480} backdrop="rgba(35, 30, 24, 0.62)" onBackdropPress={onClose}>
      <View style={styles.container}>
        <Text style={styles.tag}>HỒ SƠ THÁM TỬ</Text>
        <Text style={styles.title}>SAO LƯU TIẾN ĐỘ</Text>

        <Text style={styles.desc}>
          Bản lưu trò chơi được lưu trữ trên thiết bị của bạn. Bạn có thể sao chép mã này để đồng bộ sang máy khác hoặc dự phòng.
        </Text>

        <View style={styles.section}>
          <PrimaryButton label="Sao Chép Mã Lưu Trữ" onPress={handleCopy} style={styles.btn} />
          {copyStatus && <Text style={styles.infoText}>{copyStatus}</Text>}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.subTitle}>Khôi phục từ mã lưu:</Text>
          <TextInput
            style={styles.input}
            placeholder="Dán mã lưu (chuỗi ký tự) vào đây..."
            placeholderTextColor={colors.inkFaint}
            value={pasteInput}
            onChangeText={setPasteInput}
            multiline
            numberOfLines={2}
          />
          <SecondaryButton label="Áp Dụng Bản Lưu Này" onPress={handleImport} style={styles.btn} />
          {importMessage && (
            <Text style={[styles.infoText, importMessage.error ? styles.errorText : styles.successText]}>
              {importMessage.text}
            </Text>
          )}
        </View>

        <SecondaryButton label="Đóng" onPress={onClose} style={[styles.btn, styles.closeBtn]} />
      </View>
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'stretch',
    alignItems: 'center',
    padding: 8,
  },
  tag: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: colors.inkFaint,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.ink,
    marginTop: 4,
    marginBottom: 8,
    textAlign: 'center',
  },
  desc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkFaint,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  section: {
    alignSelf: 'stretch',
    alignItems: 'center',
    gap: 8,
  },
  subTitle: {
    alignSelf: 'flex-start',
    fontFamily: fonts.displayBold,
    fontSize: 13,
    color: colors.ink,
    marginTop: 4,
  },
  input: {
    alignSelf: 'stretch',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.hairline,
    borderRadius: 8,
    padding: 10,
    fontSize: 12,
    color: colors.ink,
    maxHeight: 60,
  },
  btn: {
    alignSelf: 'stretch',
  },
  closeBtn: {
    marginTop: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hairline,
    alignSelf: 'stretch',
    marginVertical: 14,
  },
  infoText: {
    fontFamily: fonts.bodyItalic,
    fontSize: 12,
    color: colors.ink,
    textAlign: 'center',
  },
  successText: {
    color: colors.emerald,
  },
  errorText: {
    color: colors.crimson,
  },
});
