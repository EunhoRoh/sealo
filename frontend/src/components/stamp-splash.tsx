import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { SealoColors } from '@/constants/sealo-theme';

/**
 * 도장 쾅 연출의 유일한 렌더 지점 (Sealo의 핵심 손맛).
 * 지금은 Reanimated 스케일 바운스 + 햅틱.
 * Lottie JSON(docs/assets/stamp-designs.svg 기반 제작) 준비되면
 * 이 컴포넌트 내부만 lottie-react-native로 교체 — 화면 코드는 무수정 (docs/07)
 */
interface Props {
  visible: boolean;
  /** 연출이 끝나면 호출 (부모가 visible을 false로) */
  onDone: () => void;
}

const DURATION_MS = 900;

export function StampSplash({ visible, onDone }: Props) {
  useEffect(() => {
    if (!visible) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }
    const timer = setTimeout(onDone, DURATION_MS);
    return () => clearTimeout(timer);
  }, [visible, onDone]);

  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View
        entering={ZoomIn.springify().damping(11).stiffness(220)}
        exiting={FadeOut.duration(200)}
        style={styles.stamp}>
        <Text style={styles.stampInner}>🦭</Text>
        <Text style={styles.stampLabel}>쾅!</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  stamp: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 5,
    borderColor: SealoColors.stampRed,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-8deg' }],
  },
  stampInner: { fontSize: 64 },
  stampLabel: {
    position: 'absolute',
    bottom: 16,
    color: SealoColors.stampRed,
    fontWeight: '900',
    fontSize: 18,
  },
});
