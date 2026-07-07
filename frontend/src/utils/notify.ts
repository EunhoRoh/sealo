import { Alert, Platform } from 'react-native';

/** 간단 알림 — RN Web은 Alert 미지원이라 분기 */
export function notify(message: string) {
  if (Platform.OS === 'web') {
    window.alert(message);
  } else {
    Alert.alert('Sealo', message);
  }
}

/** 확인 후 실행 (삭제 등 파괴적 동작용) */
export function confirmAction(message: string, onConfirm: () => void) {
  if (Platform.OS === 'web') {
    if (window.confirm(message)) onConfirm();
    return;
  }
  Alert.alert('Sealo', message, [
    { text: '취소', style: 'cancel' },
    { text: '확인', style: 'destructive', onPress: onConfirm },
  ]);
}
