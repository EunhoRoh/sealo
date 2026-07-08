import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AlarmType,
  Routine,
  TodayRoutine,
  useCreateRoutine,
  useRoutines,
  useStampRoutine,
  useStreak,
  useTodayRoutines,
} from '@/api/routines';
import { useEquippedAccessory, useMe } from '@/api/shop';
import { RoutineFormModal } from '@/components/routine-form-modal';
import { SealCharacter, StampMark } from '@/components/seal-character';
import { StampSplash } from '@/components/stamp-splash';
import { sealLevel } from '@/constants/seal-growth';
import { SealoColors, SealoShadow } from '@/constants/sealo-theme';
import { usePlanAlarmSync } from '@/notifications/plan-alarms';
import { silenceRoutineForToday, useRoutineAlarmSync } from '@/notifications/routine-alarms';

const STAMP_RED = SealoColors.stampRed;
const ALL_DAYS = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
];

function sealMessage(routines: TodayRoutine[] | undefined): string {
  if (!routines || routines.length === 0) return '첫 루틴을 만들어볼까? 🦭';
  const remaining = routines.filter((r) => !r.completed).length;
  if (remaining === 0) return '오늘 도장 다 찍었어! 최고야!';

  // 시간대별 인사 (M5) — 물범이 하루의 흐름을 같이 산다
  const hour = new Date().getHours();
  if (hour < 5) return `이 시간까지 깨어있어? 얼른 자야지…`;
  if (hour < 11) return `좋은 아침! 오늘 ${remaining}개, 가볍게 가자`;
  if (hour < 17) return `오늘 ${remaining}개 남았어, 화이팅!`;
  if (hour < 21) return `저녁이야~ 남은 ${remaining}개 마무리하자`;
  return `자기 전에 ${remaining}개만 딱 찍자!`;
}

export default function HomeScreen() {
  useRoutineAlarmSync(); // 루틴 변경 시 로컬 알림 재등록
  usePlanAlarmSync(); // 플랜 일정(여행 코스 등) 알람 동기화
  const { data: routines, isLoading, isError } = useTodayRoutines();
  const { data: allRoutines } = useRoutines();
  const { data: streak } = useStreak();
  const { data: me } = useMe();
  const stamp = useStampRoutine();
  const create = useCreateRoutine();
  const equippedAccessory = useEquippedAccessory();
  const [lastEarned, setLastEarned] = useState<number | null>(null);
  const [formVisible, setFormVisible] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [showSplash, setShowSplash] = useState(false);

  const bubbleMessage = useMemo(() => sealMessage(routines), [routines]);

  const onStamp = (routine: TodayRoutine) => {
    if (routine.completed || stamp.isPending) return;
    stamp.mutate(routine.id, {
      onSuccess: (result) => {
        setLastEarned(result.earnedShells);
        setShowSplash(true); // 도장 쾅 연출
        silenceRoutineForToday(routine.id).catch(() => {}); // 오늘 남은 따르릉 끄기
      },
    });
  };

  /** 길게 누르면 수정/삭제 (전체 루틴 데이터에서 요일·알람 설정까지 로드) */
  const onEditRoutine = (routine: TodayRoutine) => {
    const full = allRoutines?.find((r) => r.id === routine.id);
    if (full) {
      setEditingRoutine(full);
      setFormVisible(true);
    }
  };

  /** 첫 사용자용 — 물범 추천 루틴 3개 원탭 생성 (docs/13 P0) */
  const seedStarterRoutines = async () => {
    if (create.isPending) return;
    const starters = [
      { name: '기상', icon: '🌅', alarmTime: '07:00', days: ALL_DAYS, alarmType: 'LOUD' as AlarmType },
      { name: '물 한 잔', icon: '💧', alarmTime: '09:00', days: ALL_DAYS, alarmType: 'GENTLE' as AlarmType },
      { name: '취침 준비', icon: '🌙', alarmTime: '23:00', days: ALL_DAYS, alarmType: 'LOUD' as AlarmType },
    ];
    for (const starter of starters) {
      await create.mutateAsync(starter).catch(() => {});
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.homeHeader}>
        <Text style={styles.title}>Sealo</Text>
        <View style={styles.balanceBadge}>
          <Text style={styles.balanceText}>🐚 {me?.shellBalance ?? 0}</Text>
        </View>
      </View>

      <View style={styles.sealArea}>
        <SealCharacter
          pose={routines?.length && routines.every((r) => r.completed) ? 'celebrate' : 'idle'}
          message={bubbleMessage}
          accessoryKey={equippedAccessory}
        />
        {lastEarned != null && <Text style={styles.earned}>🐚 +{lastEarned}</Text>}
        {(streak?.current ?? 0) > 0 && (
          <View style={styles.streakChip}>
            <Text style={styles.streakText}>
              🔥 {streak?.current}일 · {sealLevel(streak?.current ?? 0).title}
            </Text>
          </View>
        )}
      </View>

      {routines != null && routines.length > 0 && (
        <View style={styles.goalCard}>
          <View style={styles.goalTrack}>
            <View
              style={[
                styles.goalFill,
                {
                  width: `${Math.round(
                    (routines.filter((r) => r.completed).length / routines.length) * 100,
                  )}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.goalLabel}>
            오늘 목표 {routines.filter((r) => r.completed).length}/{routines.length}
          </Text>
        </View>
      )}

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>오늘의 루틴</Text>
        <Pressable
          onPress={() => {
            setEditingRoutine(null);
            setFormVisible(true);
          }}
          hitSlop={8}>
          <Text style={styles.addButton}>+ 추가</Text>
        </Pressable>
      </View>

      {isLoading && <ActivityIndicator style={styles.center} />}
      {isError && (
        <Text style={styles.errorText}>
          서버에 연결할 수 없어요. 백엔드가 켜져 있는지 확인해주세요.
        </Text>
      )}

      <FlatList
        data={routines}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !isLoading && !isError ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>아직 루틴이 없어요.</Text>
              <Pressable style={styles.starterButton} onPress={seedStarterRoutines}>
                <Text style={styles.starterButtonText}>🦭 물범 추천 루틴으로 시작하기</Text>
              </Pressable>
              <Text style={styles.starterHint}>기상 · 물 한 잔 · 취침 준비 3개를 만들어줘요</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onStamp(item)}
            onLongPress={() => onEditRoutine(item)}
            delayLongPress={500}
            style={[styles.routineRow, item.completed && styles.routineRowDone]}>
            <Text style={styles.routineIcon}>{item.icon}</Text>
            <View style={styles.routineInfo}>
              <Text style={[styles.routineName, item.completed && styles.routineNameDone]}>
                {item.name}
              </Text>
              <Text style={styles.routineTime}>{item.alarmTime.slice(0, 5)}</Text>
            </View>
            {item.completed ? <StampMark /> : <Text style={styles.stampMark}>⬜</Text>}
          </Pressable>
        )}
      />

      <RoutineFormModal
        visible={formVisible}
        editing={editingRoutine}
        onClose={() => setFormVisible(false)}
      />
      <StampSplash visible={showSplash} onDone={() => setShowSplash(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SealoColors.background },
  homeHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceBadge: {
    position: 'absolute',
    right: 20,
    borderWidth: 1.5,
    borderColor: SealoColors.ink,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: SealoColors.surface,
  },
  balanceText: { fontWeight: '700', color: SealoColors.ink },
  emptyBox: { alignItems: 'center', marginTop: 24, gap: 12 },
  starterButton: {
    backgroundColor: SealoColors.ink,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 22,
  },
  starterButtonText: { color: SealoColors.surface, fontWeight: '700', fontSize: 15 },
  starterHint: { fontSize: 12, color: SealoColors.textSecondary },
  streakChip: {
    marginTop: 8,
    backgroundColor: SealoColors.ice,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  streakText: { fontWeight: '700', color: SealoColors.ink },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 4,
  },
  goalTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: SealoColors.ice,
    overflow: 'hidden',
  },
  goalFill: { height: '100%', backgroundColor: SealoColors.stampRed, borderRadius: 5 },
  goalLabel: { fontSize: 12, fontWeight: '700', color: SealoColors.textSecondary },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginVertical: 8,
  },
  sealArea: { alignItems: 'center', paddingVertical: 12 },
  earned: { marginTop: 6, fontSize: 14, fontWeight: '700', color: STAMP_RED },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
  },
  listTitle: { fontSize: 18, fontWeight: '700' },
  addButton: { fontSize: 15, fontWeight: '600', color: STAMP_RED },
  listContent: { paddingHorizontal: 20, paddingVertical: 8, gap: 8 },
  routineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: SealoColors.ink,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: SealoColors.surface,
    ...SealoShadow,
  },
  routineRowDone: { opacity: 0.5 },
  routineIcon: { fontSize: 22 },
  routineInfo: { flex: 1 },
  routineName: { fontSize: 16, fontWeight: '600' },
  routineNameDone: { textDecorationLine: 'line-through' },
  routineTime: { fontSize: 12, color: SealoColors.textSecondary, marginTop: 2 },
  stampMark: { fontSize: 20 },
  center: { marginTop: 24 },
  errorText: { textAlign: 'center', color: STAMP_RED, marginTop: 16, paddingHorizontal: 24 },
  emptyText: { textAlign: 'center', color: SealoColors.textSecondary, marginTop: 24 },
});
