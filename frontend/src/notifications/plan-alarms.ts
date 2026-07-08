import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { UpcomingItem, useUpcomingItems } from '@/api/plans';
import { ANDROID_CHANNEL_ID, ensureNotificationsReady } from '@/notifications/routine-alarms';

/**
 * 플랜 일정 알람 (Plan v2, docs/14) — 날짜/시간 있는 플랜 항목을 일회성 알림으로.
 * 식별자 `p{itemId}` — 루틴 알람(r*)과 접두사로 영역을 나눠 서로 지우지 않는다.
 * 동기화: upcoming 목록이 바뀔 때마다 p* 전체 취소 후 재등록 (멱등)
 */
export async function syncPlanAlarms(items: UpcomingItem[]): Promise<void> {
  if (Platform.OS === 'web') return;
  if (!(await ensureNotificationsReady())) return;

  const all = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    all
      .filter((n) => /^p\d+$/.test(n.identifier))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );

  const now = Date.now();
  for (const item of items) {
    const time = item.time ?? '09:00:00'; // 시간 미지정 일정은 오전 9시에
    const fireAt = new Date(`${item.date}T${time}`);
    if (fireAt.getTime() <= now) continue;

    await Notifications.scheduleNotificationAsync({
      identifier: `p${item.itemId}`,
      content: {
        title: 'Sealo 🦭',
        body: `${item.planIcon} ${item.name} — ${item.planTitle}`,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
        channelId: Platform.OS === 'android' ? ANDROID_CHANNEL_ID : undefined,
      },
    });
  }
}

/** 화면에서 한 줄로 쓰는 훅 */
export function usePlanAlarmSync(): void {
  const { data: items } = useUpcomingItems();

  useEffect(() => {
    if (items) {
      syncPlanAlarms(items).catch((e) => console.warn('플랜 알람 동기화 실패:', e));
    }
  }, [items]);
}
