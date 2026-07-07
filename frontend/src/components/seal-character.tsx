import { StyleSheet, Text, View } from 'react-native';

import { SealoBorder, SealoRadius, SealoSpacing } from '@/constants/sealo-theme';

export type SealPose = 'idle' | 'stamp' | 'celebrate';

/**
 * 물범 캐릭터의 유일한 렌더 지점.
 * 지금은 이모지 플레이스홀더지만, 일러스트(docs/assets/seal-poses.svg)나
 * Lottie로 교체할 때 이 파일 하나만 바꾸면 앱 전체에 반영된다.
 * 화면 코드에서 🦭 를 직접 쓰지 말 것.
 */
const POSE_ASSET: Record<SealPose, string> = {
  idle: '🦭',
  stamp: '🦭💥',
  celebrate: '🦭🎉',
};

/**
 * 상점 아이템 assetKey → 렌더 자산.
 * 서버는 논리 키만 알고, 실제 그림은 여기서만 결정 (이미지 교체 시 이 맵만 수정)
 */
const ACCESSORY_ASSET: Record<string, string> = {
  acc_starfish_pin: '⭐',
  acc_seaweed_scarf: '🧣',
  acc_round_glasses: '👓',
  acc_straw_hat: '👒',
  acc_sailor_hat: '⛵',
  acc_conch_hat: '🐚',
};

export function accessoryAsset(assetKey: string): string {
  return ACCESSORY_ASSET[assetKey] ?? '🎁';
}

interface Props {
  pose?: SealPose;
  size?: 'sm' | 'lg';
  /** 말풍선 문구. 없으면 말풍선 미표시 */
  message?: string;
  /** 착용 중인 꾸미기 아이템 assetKey */
  accessoryKey?: string;
}

export function SealCharacter({ pose = 'idle', size = 'lg', message, accessoryKey }: Props) {
  return (
    <View style={styles.container}>
      <View>
        <Text style={size === 'lg' ? styles.sealLg : styles.sealSm}>{POSE_ASSET[pose]}</Text>
        {accessoryKey != null && (
          <Text style={styles.accessory}>{accessoryAsset(accessoryKey)}</Text>
        )}
      </View>
      {message != null && (
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>{message}</Text>
        </View>
      )}
    </View>
  );
}

/** 캘린더 등에서 쓰는 도장 마크 — 도장 이미지 교체 지점도 여기로 단일화 */
export function StampMark({ dimmed = false }: { dimmed?: boolean }) {
  return <Text style={[styles.stampMark, dimmed && styles.stampMarkDimmed]}>🦭</Text>;
}

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  sealLg: { fontSize: 72 },
  sealSm: { fontSize: 28 },
  accessory: {
    position: 'absolute',
    top: -12,
    right: -6,
    fontSize: 26,
    transform: [{ rotate: '15deg' }],
  },
  bubble: {
    marginTop: SealoSpacing.sm,
    borderWidth: SealoBorder.width,
    borderColor: SealoBorder.color,
    borderRadius: SealoRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: SealoSpacing.sm,
  },
  bubbleText: { fontSize: 14 },
  stampMark: { fontSize: 18 },
  stampMarkDimmed: { opacity: 0.35 },
});
