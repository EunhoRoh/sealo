import { useRef, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SealCharacter, SealPose } from '@/components/seal-character';
import {
  SealoBorder,
  SealoColors,
  SealoRadius,
  SealoSpacing,
  SealoType,
} from '@/constants/sealo-theme';
import { notify } from '@/utils/notify';

/**
 * 온보딩 3장 (docs/06 #0).
 * 소셜 로그인 키 발급 전이라 [게스트로 시작]으로 입장 (결정로그 #23).
 * 카카오/구글 버튼은 자리만 — 키 준비되면 활성화.
 */
interface Props {
  onStart: () => void;
}

interface Page {
  pose: SealPose;
  title: string;
  body: string;
}

const PAGES: Page[] = [
  {
    pose: 'idle',
    title: '나는 물범!',
    body: '하루 종일 뒹굴거리는 게 특기야.\n그런데 네 하루는 챙겨주고 싶어.',
  },
  {
    pose: 'stamp',
    title: '루틴을 지키면 도장 쾅!',
    body: '네가 루틴을 지킬 때마다\n내가 도장을 쾅 찍어줄게.',
  },
  {
    pose: 'celebrate',
    title: '준비 됐지, 물범집사?',
    body: '조개를 모아서 나를 꾸며줘.\n오늘부터 같이 해보자!',
  },
];

export function Onboarding({ onStart }: Props) {
  const [page, setPage] = useState(0);
  const listRef = useRef<FlatList<Page>>(null);
  const { width } = useWindowDimensions();
  const isLast = page === PAGES.length - 1;

  const goNext = () => {
    if (isLast) return;
    const next = page + 1;
    setPage(next); // 웹에서는 스크롤 이벤트가 안 올 수 있어 상태를 직접 갱신
    listRef.current?.scrollToIndex({ index: next, animated: true });
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ref={listRef}
        data={PAGES}
        keyExtractor={(item) => item.title}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        // scrollToIndex는 getItemLayout 없이 호출하면 에러 → 버튼이 무반응처럼 보임
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        onMomentumScrollEnd={(e) =>
          setPage(Math.round(e.nativeEvent.contentOffset.x / width))
        }
        renderItem={({ item }) => (
          <View style={[styles.page, { width }]}>
            <SealCharacter pose={item.pose} />
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.body}>{item.body}</Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {PAGES.map((_, i) => (
          <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.footer}>
        {isLast ? (
          <>
            <Pressable
              style={styles.socialButton}
              onPress={() => notify('카카오 로그인은 준비 중이에요! 게스트로 먼저 시작해보세요 🦭')}>
              <Text style={styles.socialButtonText}>카카오로 시작하기 (준비 중)</Text>
            </Pressable>
            <Pressable
              style={styles.socialButton}
              onPress={() => notify('Google 로그인은 준비 중이에요! 게스트로 먼저 시작해보세요 🦭')}>
              <Text style={styles.socialButtonText}>Google로 시작하기 (준비 중)</Text>
            </Pressable>
            <Pressable style={styles.startButton} onPress={onStart}>
              <Text style={styles.startButtonText}>게스트로 시작하기</Text>
            </Pressable>
          </>
        ) : (
          <Pressable style={styles.startButton} onPress={goNext}>
            <Text style={styles.startButtonText}>다음</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SealoColors.background },
  page: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SealoSpacing.xl,
    gap: SealoSpacing.md,
  },
  title: { ...SealoType.title, marginTop: SealoSpacing.lg },
  body: {
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    color: SealoColors.textSecondary,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SealoSpacing.sm,
    marginVertical: SealoSpacing.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: SealoColors.disabled,
  },
  dotActive: { backgroundColor: SealoColors.ink },
  footer: {
    paddingHorizontal: SealoSpacing.lg,
    paddingBottom: SealoSpacing.lg,
    gap: SealoSpacing.sm,
  },
  socialButton: {
    borderWidth: SealoBorder.width,
    borderColor: SealoBorder.color,
    borderRadius: SealoRadius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  socialButtonText: { ...SealoType.body },
  startButton: {
    backgroundColor: SealoColors.ink,
    borderRadius: SealoRadius.lg,
    paddingVertical: 16,
    alignItems: 'center',
  },
  startButtonText: { ...SealoType.body, color: SealoColors.background },
});
