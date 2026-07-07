import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AlarmType,
  TodayRoutine,
  useCreateRoutine,
  useStampRoutine,
  useStreak,
  useTodayRoutines,
} from '@/api/routines';
import { useEquippedAccessory } from '@/api/shop';
import { SealCharacter, StampMark } from '@/components/seal-character';
import { StampSplash } from '@/components/stamp-splash';
import { sealLevel } from '@/constants/seal-growth';
import { SealoColors, SealoShadow } from '@/constants/sealo-theme';
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
  const { data: routines, isLoading, isError } = useTodayRoutines();
  const { data: streak } = useStreak();
  const stamp = useStampRoutine();
  const equippedAccessory = useEquippedAccessory();
  const [lastEarned, setLastEarned] = useState<number | null>(null);
  const [showAdd, setShowAdd] = useState(false);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Sealo</Text>

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

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>오늘의 루틴</Text>
        <Pressable onPress={() => setShowAdd(true)} hitSlop={8}>
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
            <Text style={styles.emptyText}>아직 루틴이 없어요. 하나 만들어볼까요?</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => onStamp(item)}
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

      <AddRoutineModal visible={showAdd} onClose={() => setShowAdd(false)} />
      <StampSplash visible={showSplash} onDone={() => setShowSplash(false)} />
    </SafeAreaView>
  );
}

function AddRoutineModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const create = useCreateRoutine();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('⭐');
  const [time, setTime] = useState('08:00');
  const [alarmType, setAlarmType] = useState<AlarmType>('GENTLE');

  const valid = name.trim().length > 0 && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

  const onSave = () => {
    if (!valid || create.isPending) return;
    create.mutate(
      { name: name.trim(), icon, alarmTime: time, days: ALL_DAYS, alarmType },
      {
        onSuccess: () => {
          setName('');
          setTime('08:00');
          onClose();
        },
      },
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>루틴 만들기</Text>
          <TextInput
            style={styles.input}
            placeholder="이름 (예: 점심 산책)"
            value={name}
            onChangeText={setName}
            maxLength={30}
          />
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.inputSmall]}
              placeholder="아이콘"
              value={icon}
              onChangeText={setIcon}
              maxLength={2}
            />
            <TextInput
              style={[styles.input, styles.inputSmall]}
              placeholder="HH:MM"
              value={time}
              onChangeText={setTime}
              maxLength={5}
            />
          </View>
          <Pressable
            style={[styles.tarrungToggle, alarmType === 'LOUD' && styles.tarrungToggleOn]}
            onPress={() => setAlarmType(alarmType === 'LOUD' ? 'GENTLE' : 'LOUD')}>
            <Text style={styles.tarrungIcon}>{alarmType === 'LOUD' ? '🔔' : '🔕'}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.tarrungTitle}>
                따르릉 모드 {alarmType === 'LOUD' ? 'ON' : 'OFF'}
              </Text>
              <Text style={styles.tarrungDesc}>
                {alarmType === 'LOUD'
                  ? '도장 찍을 때까지 물범이 3번 깨워요 (0·3·7분)'
                  : '한 번만 조용히 알려줘요'}
              </Text>
            </View>
          </Pressable>
          <Text style={styles.modalHint}>반복: 매일 (요일 선택은 곧 추가돼요)</Text>
          <View style={styles.modalButtons}>
            <Pressable onPress={onClose} style={styles.cancelButton}>
              <Text>취소</Text>
            </Pressable>
            <Pressable
              onPress={onSave}
              style={[styles.saveButton, !valid && styles.saveButtonDisabled]}>
              <Text style={styles.saveButtonText}>저장</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SealoColors.background },
  streakChip: {
    marginTop: 8,
    backgroundColor: SealoColors.ice,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  streakText: { fontWeight: '700', color: SealoColors.ink },
  tarrungToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: SealoColors.ink,
    borderRadius: 10,
    padding: 12,
  },
  tarrungToggleOn: { backgroundColor: SealoColors.todayHighlight, borderColor: SealoColors.stampRed },
  tarrungIcon: { fontSize: 22 },
  tarrungTitle: { fontWeight: '700', color: SealoColors.ink },
  tarrungDesc: { fontSize: 12, color: SealoColors.textSecondary, marginTop: 2 },
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
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: SealoColors.backdrop,
  },
  modalSheet: {
    backgroundColor: SealoColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    gap: 12,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  input: {
    borderWidth: 1.5,
    borderColor: SealoColors.ink,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  inputRow: { flexDirection: 'row', gap: 12 },
  inputSmall: { flex: 1 },
  modalHint: { fontSize: 12, color: SealoColors.textSecondary },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 4 },
  cancelButton: { paddingVertical: 10, paddingHorizontal: 16 },
  saveButton: {
    backgroundColor: SealoColors.ink,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  saveButtonDisabled: { opacity: 0.3 },
  saveButtonText: { color: SealoColors.surface, fontWeight: '700' },
});
