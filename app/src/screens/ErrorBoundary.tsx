import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, SecondaryButton } from '../ui/Buttons';
import { colors, fonts } from '../ui/theme';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Catches render errors anywhere below it, displaying a graceful recovery screen
 * instead of a blank crash, while preserving player save data intact.
 */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an unhandled render error:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  private handleReload = (): void => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    } else {
      this.handleReset();
    }
  };

  override render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.badge}>SỔ KÝ HỌA TẠM DỪNG</Text>
          <Text style={styles.title}>Đã xảy ra sự cố</Text>
          <Text style={styles.message}>
            Trang ký họa gặp lỗi kỹ thuật ngoài ý muốn. Tiến độ và các phát hiện của bạn vẫn an toàn trên thiết bị.
          </Text>
          {this.state.error?.message && (
            <Text style={styles.details} numberOfLines={3}>
              Chi tiết: {this.state.error.message}
            </Text>
          )}
          <View style={styles.actions}>
            <PrimaryButton label="Thử lại" onPress={this.handleReset} style={styles.btn} />
            <SecondaryButton label="Tải lại trang" onPress={this.handleReload} style={styles.btn} />
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.night,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.paper,
    borderRadius: 16,
    padding: 28,
    maxWidth: 520,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.hairline,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  badge: {
    fontFamily: fonts.displayBold,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.crimson,
    marginBottom: 8,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: 24,
    color: colors.ink,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkFaint,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 16,
  },
  details: {
    fontFamily: fonts.bodyItalic,
    fontSize: 12,
    color: colors.crimson,
    backgroundColor: colors.paperCard,
    padding: 8,
    borderRadius: 8,
    marginBottom: 20,
    width: '100%',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
  },
  btn: {
    flex: 1,
  },
});
