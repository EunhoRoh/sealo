import { useEffect } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';

import { SealoColors } from '@/constants/sealo-theme';

/**
 * 도장 쾅 연출의 유일한 렌더 지점 (Sealo의 핵심 손맛).
 * - 네이티브: Ethan이 Lottie Creator로 제작한 발도장 애니메이션 (stamp.json,
 *   흰 배경은 스크립트로 투명 처리 — docs/10 트러블슈팅 참고)
 * - 웹: lottie-react-native 웹 지원이 불안정하여 Reanimated 폴백 유지
 * 에셋 교체 시 이 파일만 수정 (docs/07)
 */
interface Props {
  visible: boolean;
  /** 연출이 끝나면 호출 (부모가 visible을 false로) */
  onDone: () => void;
}

const WEB_FALLBACK_DURATION_MS = 900;

export function StampSplash({ visible, onDone }: Props) {
  useEffect(() => {
    if (!visible) return;
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      return; // 네이티브는 Lottie onAnimationFinish가 종료를 알림
    }
    const timer = setTimeout(onDone, WEB_FALLBACK_DURATION_MS);
    return () => clearTimeout(timer);
  }, [visible, onDone]);

  if (!visible) return null;

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.overlay} pointerEvents="none">
        <LottieView
          source={require('../../assets/animations/stamp.json')}
          autoPlay
          loop={false}
          speed={1.4}
          onAnimationFinish={onDone}
          style={styles.lottie}
        />
      </View>
    );
  }

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
  lottie: { width: 260, height: 260 },
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
