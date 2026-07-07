import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';
import LottieView from 'lottie-react-native';

// 도장 "쿵" 효과음 — 코드로 합성한 WAV (scratchpad/make-stamp-sound.js, docs/13 P2)
const STAMP_SOUND = require('../../assets/sounds/stamp-thud.wav');

/**
 * 도장 쾅 연출 — 네이티브(iOS/Android) 버전.
 * Ethan이 Lottie Creator로 제작한 발도장 애니메이션 (stamp.json, 흰 배경 투명 처리본).
 * 웹은 stamp-splash.web.tsx (Reanimated 폴백) — lottie-react-native가 웹 번들을 깨뜨려 파일 분리.
 * 에셋 교체 시 이 파일들만 수정 (docs/07)
 */
interface Props {
  visible: boolean;
  /** 연출이 끝나면 호출 (부모가 visible을 false로) */
  onDone: () => void;
}

export function StampSplash({ visible, onDone }: Props) {
  const player = useAudioPlayer(STAMP_SOUND);

  useEffect(() => {
    if (!visible) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      player.seekTo(0);
      player.play();
    } catch {
      // 사운드 실패는 연출을 막지 않는다
    }
  }, [visible, player]);

  if (!visible) return null;

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
});
