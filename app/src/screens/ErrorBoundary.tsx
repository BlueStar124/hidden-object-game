import React, { Component, Fragment, useState, type ErrorInfo, type ReactNode } from 'react';
import { Share, StyleSheet, Text, View } from 'react-native';
import { crashLog } from '../platform/crashLog';
import { PrimaryButton, SecondaryButton } from '../ui/Buttons';
import { RotateCcw } from '../ui/icons';
import { colors, fonts, shadow } from '../ui/theme';

/**
 * Catches what a component throws while rendering (the board, a dialog…): rather than a blank
 * screen, the player gets a way back into the game. Reopening remounts the game, which starts on
 * the home screen; the progress is untouched, being saved as the player goes.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean; attempt: number }> {
  state = { failed: false, attempt: 0 };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    crashLog.record(error, 'render', info.componentStack ?? undefined);
  }

  private reopen = () => {
    this.setState((s) => ({ failed: false, attempt: s.attempt + 1 }));
  };

  render() {
    if (this.state.failed) return <CrashScreen onReopen={this.reopen} />;
    // A new key on every reopen: the game comes back fresh, not with the state that broke it
    return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>;
  }
}

function CrashScreen({ onReopen }: { onReopen: () => void }) {
  const [note, setNote] = useState<string | null>(null);

  const sendReport = async () => {
    const report = `The Lost Sketchbook — báo lỗi\n\n${crashLog.report()}`;
    try {
      await Share.share({ message: report });
      return;
    } catch {
      // No share sheet (most desktop browsers): copy the report instead
    }
    try {
      await navigator.clipboard.writeText(report);
      setNote('Đã chép thông tin lỗi, bạn có thể dán vào tin nhắn gửi nhóm phát triển.');
    } catch {
      setNote('Không gửi được báo lỗi trên thiết bị này.');
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.card} accessibilityRole="alert">
        <Text style={styles.title}>Cuốn sổ gặp chút sự cố</Text>
        <Text style={styles.body}>
          Có lỗi xảy ra khi mở trang này. Tiến độ của bạn vẫn được giữ nguyên, hãy mở lại cuốn sổ để chơi tiếp.
        </Text>
        <View style={styles.actions}>
          <SecondaryButton label="Gửi báo lỗi" onPress={sendReport} />
          <PrimaryButton label="Mở lại cuốn sổ" icon={<RotateCcw size={17} color="#fff" />} onPress={onReopen} />
        </View>
        {note && <Text style={styles.note}>{note}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.paper,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    padding: 22,
    gap: 12,
    borderRadius: 14,
    backgroundColor: colors.paperCard,
    borderWidth: 1,
    borderColor: colors.hairline,
    ...shadow(12, 0.12),
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 22,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    lineHeight: 22,
    color: colors.inkSoft,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  note: {
    fontSize: 13,
    color: colors.inkSoft,
  },
});
