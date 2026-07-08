import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePlans } from '@/api/plans';
import { useCalendar, useStreak } from '@/api/routines';
import { StampMark } from '@/components/seal-character';
import { daysToNextLevel, sealLevel } from '@/constants/seal-growth';
import {
  SealoBorder,
  SealoColors,
  SealoRadius,
  SealoSpacing,
  SealoType,
} from '@/constants/sealo-theme';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function toMonthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** 달력 그리드용: 앞쪽 빈 칸 + 날짜 배열 (일요일 시작) */
function buildMonthCells(monthKey: string): (number | null)[] {
  const [year, month] = monthKey.split('-').map(Number);
  const first = new Date(year, month - 1, 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = Array(first.getDay()).fill(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);
  return cells;
}

function shiftMonth(monthKey: string, diff: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  return toMonthKey(new Date(year, month - 1 + diff, 1));
}

export default function RecordsScreen() {
  const [monthKey, setMonthKey] = useState(() => toMonthKey(new Date()));
  const { data: calendar, isLoading } = useCalendar(monthKey);
  const { data: streak } = useStreak();
  const { data: plans } = usePlans();

  // 이 달의 플랜 D-day (여행 출발일 등) — 날짜 → 아이콘
  const planDays = useMemo(() => {
    const map = new Map<number, string>();
    plans?.forEach((plan) => {
      if (plan.targetDate?.startsWith(monthKey)) {
        map.set(Number(plan.targetDate.slice(8, 10)), plan.icon);
      }
    });
    return map;
  }, [plans, monthKey]);

  const stampedDays = useMemo(() => {
    const map = new Map<number, number>();
    calendar?.forEach((entry) => map.set(Number(entry.date.slice(8, 10)), entry.count));
    return map;
  }, [calendar]);

  const cells = useMemo(() => buildMonthCells(monthKey), [monthKey]);

  // M5 인사이트: 이번 달 도장 찍힌 날들의 요일 분포에서 최고 요일 (2일 이상일 때만)
  const bestWeekday = useMemo(() => {
    if (!calendar || calendar.length < 2) return null;
    const byWeekday = new Map<number, number>();
    calendar.forEach((entry) => {
      const weekday = new Date(entry.date + 'T00:00:00').getDay();
      byWeekday.set(weekday, (byWeekday.get(weekday) ?? 0) + 1);
    });
    let best: number | null = null;
    let bestCount = 1; // 최소 2일 이상이어야 의미
    byWeekday.forEach((count, weekday) => {
      if (count > bestCount) {
        best = weekday;
        bestCount = count;
      }
    });
    return best != null ? WEEKDAY_LABELS[best] : null;
  }, [calendar]);
  const todayKey = toMonthKey(new Date());
  const todayDate = new Date().getDate();
  const [year, month] = monthKey.split('-');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>기록</Text>

      <View style={styles.streakCard}>
        <Text style={styles.streakText}>
          🔥 연속 {streak?.current ?? 0}일 · {sealLevel(streak?.current ?? 0).title}
          {(streak?.best ?? 0) > (streak?.current ?? 0) ? `  |  🏆 최고 ${streak?.best}일` : ''}
        </Text>
        {(() => {
          const next = daysToNextLevel(streak?.current ?? 0);
          return next ? (
            <Text style={styles.nextLevel}>
              다음 칭호 「{next.next.title}」까지 {next.days}일!
            </Text>
          ) : (
            <Text style={styles.nextLevel}>최고 칭호 달성 — 물범이 절을 올립니다 🙇</Text>
          );
        })()}
      </View>

      {bestWeekday != null && (
        <Text style={styles.insight}>✨ 이번 달엔 {bestWeekday}요일에 가장 잘 지켰어요</Text>
      )}

      <View style={styles.monthNav}>
        <Pressable onPress={() => setMonthKey(shiftMonth(monthKey, -1))} hitSlop={12}>
          <Text style={styles.navArrow}>‹</Text>
        </Pressable>
        <Text style={styles.monthLabel}>
          {year}년 {Number(month)}월
        </Text>
        <Pressable onPress={() => setMonthKey(shiftMonth(monthKey, 1))} hitSlop={12}>
          <Text style={styles.navArrow}>›</Text>
        </Pressable>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAY_LABELS.map((label) => (
          <Text key={label} style={styles.weekdayLabel}>
            {label}
          </Text>
        ))}
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <View style={styles.grid}>
          {cells.map((day, index) => {
            const isToday = monthKey === todayKey && day === todayDate;
            const count = day != null ? (stampedDays.get(day) ?? 0) : 0;
            return (
              <View key={index} style={[styles.cell, isToday && styles.cellToday]}>
                {day != null && (
                  <>
                    <Text style={styles.cellDay}>{day}</Text>
                    {count > 0 && <StampMark />}
                    {planDays.has(day) && (
                      <Text style={styles.planIcon}>{planDays.get(day)}</Text>
                    )}
                  </>
                )}
              </View>
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SealoColors.background },
  title: {
    ...SealoType.title,
    textAlign: 'center',
    marginVertical: SealoSpacing.sm,
  },
  streakCard: {
    alignSelf: 'center',
    borderWidth: SealoBorder.width,
    borderColor: SealoBorder.color,
    borderRadius: SealoRadius.md,
    paddingHorizontal: SealoSpacing.lg,
    paddingVertical: SealoSpacing.sm,
    marginBottom: SealoSpacing.md,
  },
  streakText: { ...SealoType.body },
  nextLevel: {
    ...SealoType.caption,
    color: SealoColors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  insight: {
    textAlign: 'center',
    color: SealoColors.textSecondary,
    fontSize: 13,
    marginBottom: SealoSpacing.sm,
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SealoSpacing.xl,
    marginVertical: SealoSpacing.sm,
  },
  navArrow: { fontSize: 26, fontWeight: '700', color: SealoColors.textPrimary },
  monthLabel: { ...SealoType.section },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: SealoSpacing.md,
    marginTop: SealoSpacing.sm,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    ...SealoType.caption,
    color: SealoColors.textSecondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: SealoSpacing.md,
  },
  cell: {
    width: `${100 / 7}%`,
    aspectRatio: 0.8,
    alignItems: 'center',
    paddingTop: SealoSpacing.xs,
    borderRadius: SealoRadius.sm,
  },
  cellToday: { backgroundColor: SealoColors.todayHighlight },
  cellDay: { ...SealoType.caption, color: SealoColors.textPrimary, marginBottom: 2 },
  planIcon: { fontSize: 11 },
  loading: { marginTop: SealoSpacing.xl },
});
