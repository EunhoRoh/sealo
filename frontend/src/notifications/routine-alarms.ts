import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { Routine, useRoutines } from '@/api/routines';

/**
 * 루틴 알림 = 로컬 알림 (결정로그 #16).
 * 루틴 시간은 기기가 이미 알고 있으므로 서버 푸시(FCM)가 필요 없다.
 * 오프라인 동작 + FCM 인프라(파이어베이스/토큰 관리/스케줄러) 생략 → 유지보수 최소화.
 * FCM은 v2 리인게이지먼트 메시지용으로 도입 예정.
 *
 * 동기화 전략: 루틴 목록이 바뀌면 "전체 취소 후 재등록" (멱등).
 * 개별 diff 관리보다 단순하고, 루틴 수십 개 수준에서는 비용이 무시 가능.
 */

// 포그라운드에서도 알림 배너 표시
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** java.time.DayOfWeek 이름 → expo weekly trigger weekday (1=일요일 … 7=토요일) */
const DAY_TO_EXPO_WEEKDAY: Record<string, number> = {
  SUNDAY: 1,
  MONDAY: 2,
  TUESDAY: 3,
  WEDNESDAY: 4,
  THURSDAY: 5,
  FRIDAY: 6,
  SATURDAY: 7,
};

const ANDROID_CHANNEL_ID = 'routine-alarms';

async function ensureReady(): Promise<boolean> {
  if (Platform.OS === 'web') return false; // 웹은 로컬 스케줄 알림 미지원

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: '루틴 알림',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function syncRoutineAlarms(routines: Routine[]): Promise<void> {
  if (!(await ensureReady())) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const routine of routines.filter((r) => r.alarmEnabled)) {
    const [hour, minute] = routine.alarmTime.split(':').map(Number);
    for (const day of routine.days) {
      const weekday = DAY_TO_EXPO_WEEKDAY[day];
      if (weekday == null) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Sealo 🦭',
          body: `${routine.icon} ${routine.name} 시간이야!`,
          // TODO: [도장 쾅] 액션 버튼 (notification category + response listener, docs/06 #6)
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour,
          minute,
          channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
        },
      });
    }
  }
}

/** 화면에서 한 줄로 쓰는 훅 — 루틴 목록이 바뀔 때마다 알림 재동기화 */
export function useRoutineAlarmSync(): void {
  const { data: routines } = useRoutines();

  useEffect(() => {
    if (routines) {
      syncRoutineAlarms(routines).catch((e) =>
        console.warn('루틴 알림 동기화 실패:', e),
      );
    }
  }, [routines]);
}
