import { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useStampRoutine } from '@/api/routines';
import { SealCharacter } from '@/components/seal-character';
import { StampSplash } from '@/components/stamp-splash';
import {
  SealoColors,
  SealoRadius,
  SealoSpacing,
  SealoType,
} from '@/constants/sealo-theme';
import { silenceRoutineForToday, snoozeRoutine } from '@/notifications/routine-alarms';

/**
 * M1 알람 화면 (docs/12): 루틴 알림을 탭하면 물범이 깨우는 풀스크린이 뜬다.
 * [도장 쾅] = 완료 + 오늘 남은 따르릉 재알림 끄기 / [5분만…] = 스누즈 (물범 시무룩)
 */
interface AlarmData {
  routineId: number;
  name: string;
  icon: string;
}

function extractAlarm(response: Notifications.NotificationResponse | null): AlarmData | null {
  const data = response?.notification.request.content.data as Partial<AlarmData> | undefined;
  if (data && typeof data.routineId === 'number' && typeof data.name === 'string') {
    return { routineId: data.routineId, name: data.name, icon: data.icon ?? '⭐' };
  }
  return null;
}

export function AlarmListener() {
  const [alarm, setAlarm] = useState<AlarmData | null>(null);
  const [splash, setSplash] = useState(false);
  const stamp = useStampRoutine();

  useEffect(() => {
    if (Platform.OS === 'web') return;

    // 앱이 종료 상태에서 알림 탭으로 켜진 경우
    Notifications.getLastNotificationResponseAsync().then((response) => {
      const data = extractAlarm(response);
      if (data) setAlarm(data);
    });

    // 앱이 켜져 있는 동안 알림을 탭한 경우
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = extractAlarm(response);
      if (data) setAlarm(data);
    });
    return () => sub.remove();
  }, []);

  if (!alarm) return null;

  const onStamp = () => {
    if (stamp.isPending) return;
    stamp.mutate(alarm.routineId, {
      onSuccess: () => {
        silenceRoutineForToday(alarm.routineId).catch(() => {});
        setSplash(true); // 도장 연출 후 onDone에서 닫힘
      },
      // 이미 찍었거나(409) 삭제된 루틴이면 조용히 닫는다
      onError: () => setAlarm(null),
    });
  };

  const onSnooze = () => {
    snoozeRoutine(alarm).catch(() => {});
    setAlarm(null);
  };

  return (
    <View style={styles.overlay}>
      <Text style={styles.time}>
        {new Date().toTimeString().slice(0, 5)}
      </Text>
      <SealCharacter pose="idle" message={`${alarm.icon} ${alarm.name} 시간이야!`} />
      <Text style={styles.subtitle}>따르릉따르릉 🔔</Text>

      <View style={styles.buttons}>
        <Pressable style={styles.stampButton} onPress={onStamp}>
          <Text style={styles.stampButtonText}>🦭 도장 쾅</Text>
        </Pressable>
        <Pressable style={styles.snoozeButton} onPress={onSnooze} hitSlop={8}>
          <Text style={styles.snoozeText}>5분만… (물범이 시무룩해져요)</Text>
        </Pressable>
      </View>

      <StampSplash visible={splash} onDone={() => setAlarm(null)} />
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
    zIndex: 100,
    backgroundColor: SealoColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SealoSpacing.lg,
    padding: SealoSpacing.xl,
  },
  time: { fontSize: 56, fontWeight: '900', color: SealoColors.ink },
  subtitle: { ...SealoType.body, color: SealoColors.textSecondary },
  buttons: {
    alignSelf: 'stretch',
    gap: SealoSpacing.md,
    marginTop: SealoSpacing.lg,
  },
  stampButton: {
    backgroundColor: SealoColors.stampRed,
    borderRadius: SealoRadius.lg,
    paddingVertical: 18,
    alignItems: 'center',
  },
  stampButtonText: { fontSize: 20, fontWeight: '800', color: SealoColors.surface },
  snoozeButton: { alignItems: 'center', paddingVertical: SealoSpacing.sm },
  snoozeText: { ...SealoType.caption, color: SealoColors.textSecondary, fontSize: 14 },
});
