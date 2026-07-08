import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { Routine, useRoutines } from '@/api/routines';

/**
 * 루틴 알림 = 로컬 알림 (결정로그 #16). FCM 아님 — 기기가 시간을 알고, 오프라인 동작.
 *
 * M1 "따르릉 모드" (docs/12): LOUD 루틴은 도장을 찍을 때까지 단계별 재알림.
 *   t+0   "따르릉! ~ 시간이야!"
 *   t+3분 "아직이야? 물범이 기다리는 중…"
 *   t+7분 "물범이 기다리다 지쳤어…"
 * 도장을 찍으면 silenceRoutineForToday()가 오늘 남은 재알림을 끈다.
 * 진짜 풀스크린 알람(AlarmManager)은 Expo Dev Client 전환 후 (docs/12 M1 후반).
 *
 * 동기화 전략: 앱 실행/루틴 변경 시 전체 취소 후 재등록 (멱등).
 * 도장으로 끈 알림도 다음 앱 실행 시 sync가 자동 복구한다.
 */

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

// Android는 생성된 채널 설정을 수정할 수 없어, 설정을 바꿀 땐 새 id로
const ANDROID_CHANNEL_ID = 'sealo-tarrung-v1';

interface AlarmStep {
  offsetMin: number;
  body: (r: Pick<Routine, 'name' | 'icon'>) => string;
}

const LOUD_STEPS: AlarmStep[] = [
  { offsetMin: 0, body: (r) => `따르릉! ${r.icon} ${r.name} 시간이야!` },
  { offsetMin: 3, body: (r) => `아직이야? 물범이 ${r.name} 기다리는 중… 🦭` },
  { offsetMin: 7, body: (r) => `물범이 기다리다 지쳤어… ${r.name} 해주라 🥺` },
];

const GENTLE_STEPS: AlarmStep[] = [
  { offsetMin: 0, body: (r) => `${r.icon} ${r.name} 시간이야!` },
];

/** 알림 식별자 규칙 — 루틴/요일 단위 취소의 열쇠 */
const idFor = (routineId: number, weekday: number, step: number) =>
  `r${routineId}-w${weekday}-s${step}`;

export async function ensureNotificationsReady(): Promise<boolean> {
  return ensureReady();
}

export { ANDROID_CHANNEL_ID };

async function ensureReady(): Promise<boolean> {
  if (Platform.OS === 'web') return false; // 웹은 스케줄 알림 미지원

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
      name: '따르릉 루틴 알람',
      importance: Notifications.AndroidImportance.MAX, // 헤드업(화면 상단 팝업) 표시
      vibrationPattern: [0, 400, 200, 400, 200, 600],
      sound: 'default',
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function scheduleRoutine(routine: Routine): Promise<void> {
  if (!routine.alarmEnabled) return;
  const [hour, minute] = routine.alarmTime.split(':').map(Number);
  const steps = routine.alarmType === 'LOUD' ? LOUD_STEPS : GENTLE_STEPS;

  for (const day of routine.days) {
    const weekday = DAY_TO_EXPO_WEEKDAY[day];
    if (weekday == null) continue;

    for (let i = 0; i < steps.length; i++) {
      const total = hour * 60 + minute + steps[i].offsetMin;
      if (total >= 24 * 60) continue; // 자정을 넘어가는 재알림은 생략
      await Notifications.scheduleNotificationAsync({
        identifier: idFor(routine.id, weekday, i),
        content: {
          title: 'Sealo 🦭',
          body: steps[i].body(routine),
          sound: 'default',
          data: { routineId: routine.id, name: routine.name, icon: routine.icon },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday,
          hour: Math.floor(total / 60),
          minute: total % 60,
          channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
        },
      });
    }
  }
}

export async function syncRoutineAlarms(routines: Routine[]): Promise<void> {
  if (!(await ensureReady())) return;
  // 루틴 소유 알림만 취소 (플랜 알람 p*, 스누즈 등은 보존)
  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => /^r\d+-/.test(n.identifier) || n.identifier === 'daily-streak-guard')
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
  for (const routine of routines) {
    await scheduleRoutine(routine);
  }
  if (routines.length > 0) {
    await scheduleDailyStreakGuard();
  }
}

/**
 * 저녁 스트릭 지킴 알림 (docs/13 P0) — 듀오링고식 손실 회피 장치.
 * 매일 21:30 한 번, 잊고 있던 사용자를 잡아준다.
 */
async function scheduleDailyStreakGuard(): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    identifier: 'daily-streak-guard',
    content: {
      title: 'Sealo 🦭',
      body: '오늘 도장 다 찍었어? 자기 전에 확인하자, 스트릭 지켜야지 🔥',
      sound: 'default',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 21,
      minute: 30,
      channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
    },
  });
}

/**
 * 도장 찍은 루틴의 "오늘" 알림(남은 따르릉 재알림 포함)을 끈다.
 * 오늘 요일 등록만 취소 — 다음 앱 실행 시 sync가 다음 주 대비 자동 복구.
 */
export async function silenceRoutineForToday(routineId: number): Promise<void> {
  if (Platform.OS === 'web') return;
  const todayWeekday = new Date().getDay() + 1; // JS 0=일요일 → expo 1=일요일
  const all = await Notifications.getAllScheduledNotificationsAsync();
  const prefix = `r${routineId}-w${todayWeekday}-`;
  await Promise.all(
    all
      .filter((n) => n.identifier.startsWith(prefix))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

/** 알람 화면의 "5분만…" — 일회성 스누즈 */
export async function snoozeRoutine(routine: {
  routineId: number;
  name: string;
  icon: string;
}): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Sealo 🦭',
      body: `5분 지났어! 이제 진짜 ${routine.icon} ${routine.name} 하자!`,
      sound: 'default',
      data: routine,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 300,
      channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
    },
  });
}

/** 화면에서 한 줄로 쓰는 훅 — 루틴 목록이 바뀔 때마다 알림 재동기화 */
export function useRoutineAlarmSync(): void {
  const { data: routines } = useRoutines();

  useEffect(() => {
    if (routines) {
      syncRoutineAlarms(routines).catch((e) => console.warn('루틴 알림 동기화 실패:', e));
    }
  }, [routines]);
}
