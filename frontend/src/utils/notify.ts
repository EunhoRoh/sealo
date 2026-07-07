import { Alert, Platform } from 'react-native';

/** 간단 알림 — RN Web은 Alert 미지원이라 분기 */
export function notify(message: string) {
  if (Platform.OS === 'web') {
    window.alert(message);
  } else {
    Alert.alert('Sealo', message);
  }
}
