import { useEffect, useState } from 'react';
import { AppState, BackHandler, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';

import { SealCharacter } from '@/components/seal-character';
import { SealoColors, SealoRadius, SealoSpacing, SealoType } from '@/constants/sealo-theme';
import { giveUpFocus, useFocusStore } from '@/focus/focus-session';
import { confirmAction, notify } from '@/utils/notify';

/**
 * 집중 모드 풀스크린 (docs/12 M1.5) — 세션 중엔 앱 전체를 덮는다.
 * 앱을 나갔다 오면 물범이 봤다(👀) 카운트. 뒤로가기도 못 뚫는다 (포기 버튼만이 출구).
 */
export function FocusOverlay() {
  const { session, hydrate, recordEscape, end } = useFocusStore();
  const queryClient = useQueryClient();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    hydrate(); // 앱 재시작 시 세션 복원 — 종료해도 잠금 유지
  }, [hydrate]);

  // 1초 시계
  useEffect(() => {
    if (!session) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [session]);

  // 앱 이탈 감지 (Forest 방식)
  useEffect(() => {
    if (!session || Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && useFocusStore.getState().session) {
        recordEscape();
      }
    });
    return () => sub.remove();
  }, [session, recordEscape]);

  // 뒤로가기 무력화 — 집중 중엔 출구가 포기 버튼뿐
  useEffect(() => {
    if (!session || Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [session]);

  if (!session) return null;

  const remainMs = session.endsAt - now;

  // 완주!
  if (remainMs <= 0) {
    return (
      <View style={styles.overlay}>
        <SealCharacter pose="celebrate" message={`${session.minutes}분 집중 완주! 대단해!`} />
        <Pressable
          style={styles.doneButton}
          onPress={() => {
            end();
          }}>
          <Text style={styles.doneButtonText}>🦭 고마워, 물범!</Text>
        </Pressable>
      </View>
    );
  }

  const mm = String(Math.floor(remainMs / 60000)).padStart(2, '0');
  const ss = String(Math.floor((remainMs % 60000) / 1000)).padStart(2, '0');

  const onGiveUp = () => {
    confirmAction('정말 포기할까요? 물범에게 🐚 50개를 줘야 해요…', () => {
      giveUpFocus()
        .then((result) => {
          notify(
            result.paidShells > 0
              ? `🐚 ${result.paidShells}개를 물범이 가져갔어요… (잔액 ${result.shellBalance})`
              : '조개도 없이 도망…! 물범이 크게 실망했어요 🥺',
          );
          queryClient.invalidateQueries({ queryKey: ['members', 'me'] });
        })
        .catch(() => {})
        .finally(end);
    });
  };

  return (
    <View style={styles.overlay}>
      <Text style={styles.clock}>
        {mm}:{ss}
      </Text>
      <SealCharacter
        message={
          session.escapes === 0
            ? '물범도 옆에서 집중 중… 조용! 🤫'
            : `어디 갔었어! 물범이 ${session.escapes}번 봤어 👀`
        }
      />
      <Text style={styles.hint}>폰을 내려놓고 하던 일에 집중해요</Text>
      <Pressable style={styles.giveUpButton} onPress={onGiveUp} hitSlop={8}>
        <Text style={styles.giveUpText}>포기하기 (🐚 50)</Text>
      </Pressable>
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
    zIndex: 200, // 알람 화면(100)보다 위
    backgroundColor: SealoColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SealoSpacing.lg,
    padding: SealoSpacing.xl,
  },
  clock: { fontSize: 64, fontWeight: '900', color: SealoColors.ink, fontVariant: ['tabular-nums'] },
  hint: { ...SealoType.caption, color: SealoColors.textSecondary, fontSize: 13 },
  giveUpButton: { marginTop: SealoSpacing.xl, padding: SealoSpacing.sm },
  giveUpText: { color: SealoColors.disabled, fontWeight: '600', fontSize: 13 },
  doneButton: {
    backgroundColor: SealoColors.stampRed,
    borderRadius: SealoRadius.lg,
    paddingVertical: 16,
    paddingHorizontal: SealoSpacing.xl,
  },
  doneButtonText: { color: SealoColors.surface, fontWeight: '800', fontSize: 17 },
});
