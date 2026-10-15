import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { progress } from '../../core/progress';
import { localDay } from '../../core/random';
import { pickBackupFile, saveBackupFile } from '../../platform/backupFile';
import { PrimaryButton, SecondaryButton } from '../../ui/Buttons';
import { DialogHeader } from '../../ui/DialogHeader';
import { Download, FolderOpen, ShieldCheck } from '../../ui/icons';
import { ModalShell } from '../../ui/ModalShell';
import { colors, fonts } from '../../ui/theme';

interface BackupProps {
  /** A backup was brought back: what shows the progress must read it again */
  onRestored: () => void;
  onClose: () => void;
}

type Note = { tone: 'ok' | 'error'; text: string } | null;

/**
 * Backing up the save, which lives only on this device: a file to keep, brought back on any device
 * (or after the browser cleared its data). Bringing one back merges it — nothing is ever lost.
 */
export const Backup: React.FC<BackupProps> = ({ onRestored, onClose }) => {
  const [pasted, setPasted] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<Note>(null);

  const restore = (text: string | null) => {
    if (text === null) return; // the chooser was closed
    if (progress.restore(text)) {
      setNote({ tone: 'ok', text: 'Đã khôi phục! Tiến độ trong tệp đã được gộp với tiến độ trên máy này.' });
      setPasted('');
      onRestored();
    } else {
      setNote({ tone: 'error', text: 'Đây không phải tệp sao lưu của The Lost Sketchbook.' });
    }
  };

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setNote(null);
    try {
      await task();
    } finally {
      setBusy(false);
    }
  };

  const backUp = () =>
    run(async () => {
      const outcome = await saveBackupFile(progress.backup(), `so-ky-hoa-${localDay(new Date())}.json`);
      if (outcome === 'downloaded') setNote({ tone: 'ok', text: 'Đã tải tệp sao lưu về máy.' });
      if (outcome === 'failed') setNote({ tone: 'error', text: 'Không lưu được tệp trên thiết bị này.' });
    });

  const fromFile = () => run(async () => restore(await pickBackupFile()));

  return (
    <ModalShell
      scroll
      maxWidth={520}
      zIndex={350}
      backdrop="rgba(28, 24, 20, 0.74)"
      onBackdropPress={onClose}
      header={
        <DialogHeader
          icon={<ShieldCheck size={24} color={colors.emerald} />}
          title="Sao Lưu Tiến Độ"
          description="Giữ cuốn sổ của bạn khi đổi máy hay xóa dữ liệu trình duyệt"
          onClose={onClose}
        />
      }
    >
      <Text style={styles.body}>
        Tiến độ chỉ được lưu trên thiết bị này. Hãy lưu một tệp sao lưu và cất kỹ. Khi khôi phục, tiến độ trong tệp được gộp
        với tiến độ hiện có: sao, điểm cao nhất và mọi vật đã tìm đều được giữ lại.
      </Text>
      <Text style={styles.hint}>Trên Safari, dữ liệu của trang có thể bị xóa sau 7 ngày không mở. Thêm game vào màn hình chính cũng giúp giữ dữ liệu.</Text>

      <View style={styles.actions}>
        <PrimaryButton label="Lưu Ra Tệp" icon={<Download size={18} color="#fff" />} onPress={backUp} disabled={busy} />
        <SecondaryButton label="Khôi Phục Từ Tệp" icon={<FolderOpen size={17} color={colors.ink} />} onPress={fromFile} disabled={busy} />
      </View>

      <Text style={styles.label}>Hoặc dán nội dung tệp sao lưu</Text>
      <TextInput
        value={pasted}
        onChangeText={(t) => {
          setPasted(t);
          setNote(null);
        }}
        placeholder='{"game":"the-lost-sketchbook", …}'
        placeholderTextColor={colors.inkFaint}
        multiline
        autoCorrect={false}
        autoCapitalize="none"
        accessibilityLabel="Nội dung tệp sao lưu"
        style={styles.input}
      />
      <SecondaryButton label="Khôi Phục Từ Nội Dung Dán" onPress={() => restore(pasted)} disabled={busy || !pasted.trim()} style={styles.pasteButton} />

      {note && <Text style={[styles.note, note.tone === 'error' && styles.noteError]}>{note.text}</Text>}
    </ModalShell>
  );
};

const styles = StyleSheet.create({
  body: {
    alignSelf: 'stretch',
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 21,
    color: colors.ink,
  },
  hint: {
    alignSelf: 'stretch',
    fontSize: 12,
    lineHeight: 17,
    color: colors.inkSoft,
    marginTop: 6,
  },
  actions: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  label: {
    alignSelf: 'stretch',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.earth,
    marginTop: 16,
    marginBottom: 6,
  },
  input: {
    alignSelf: 'stretch',
    minHeight: 70,
    maxHeight: 120,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: '#fff',
    fontSize: 12,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  pasteButton: {
    flex: 0,
    alignSelf: 'stretch',
    marginTop: 8,
  },
  note: {
    alignSelf: 'stretch',
    fontSize: 13,
    fontWeight: '600',
    color: colors.emerald,
    marginTop: 10,
    marginBottom: 6,
  },
  noteError: {
    color: colors.crimson,
  },
});
