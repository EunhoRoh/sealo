import { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, View } from 'react-native';

import { SealoColors, SealoRadius, SealoSpacing } from '@/constants/sealo-theme';

/**
 * 공용 바텀시트 (docs/13 점검 수정) — 모든 모달의 유일한 골격.
 * KeyboardAvoidingView 내장: 키보드가 입력창을 가리지 않는다.
 * onRequestClose로 Android 뒤로가기도 항상 동작.
 */
interface Props {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  minHeight?: number;
}

export function BottomSheet({ visible, onClose, children, minHeight }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.sheet, minHeight != null && { minHeight }]}>{children}</View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: SealoColors.backdrop },
  sheet: {
    backgroundColor: SealoColors.surface,
    borderTopLeftRadius: SealoRadius.lg,
    borderTopRightRadius: SealoRadius.lg,
    padding: SealoSpacing.lg,
    gap: SealoSpacing.md,
    maxHeight: '88%',
  },
});
