import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeOut, ZoomIn } from 'react-native-reanimated';

import { SealoColors } from '@/constants/sealo-theme';

/**
 * 도장 쾅 연출 — 웹 폴백 (Reanimated 스케일 바운스).
 * lottie-react-native는 웹 번들을 깨뜨려서 네이티브(stamp-splash.tsx)와 파일 분리.
 */
interface Props {
  visible: boolean;
  onDone: () => void;
}

const DURATION_MS = 900;

export function StampSplash({ visible, onDone }: Props) {
  useEffect(() => {
    if (!visible) return;
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
