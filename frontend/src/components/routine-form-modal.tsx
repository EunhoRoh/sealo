import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/bottom-sheet';

import {
  AlarmType,
  Routine,
  useCreateRoutine,
  useDeleteRoutine,
  useUpdateRoutine,
} from '@/api/routines';
import { DaysField } from '@/components/days-field';
import { TimeField } from '@/components/picker-fields';
import {
  SealoBorder,
  SealoColors,
  SealoRadius,
  SealoSpacing,
  SealoType,
} from '@/constants/sealo-theme';
import { confirmAction } from '@/utils/notify';

/**
 * 루틴 생성/수정/삭제 통합 모달 (UX P1, docs/13).
 * editing이 있으면 수정 모드 — 값 프리필 + 삭제 버튼 노출.
 */
const ALL_DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

interface Props {
  visible: boolean;
  editing: Routine | null;
  onClose: () => void;
}

export function RoutineFormModal({ visible, editing, onClose }: Props) {
  const create = useCreateRoutine();
  const update = useUpdateRoutine();
  const remove = useDeleteRoutine();

  const [name, setName] = useState('');
  const [icon, setIcon] = useState('⭐');
  const [time, setTime] = useState('08:00');
  const [days, setDays] = useState<string[]>(ALL_DAYS);
  const [alarmType, setAlarmType] = useState<AlarmType>('GENTLE');

  // 열릴 때마다 모드에 맞게 초기화
  useEffect(() => {
    if (!visible) return;
    if (editing) {
      setName(editing.name);
      setIcon(editing.icon);
      setTime(editing.alarmTime.slice(0, 5));
      setDays(editing.days);
      setAlarmType(editing.alarmType);
    } else {
      setName('');
      setIcon('⭐');
      setTime('08:00');
      setDays(ALL_DAYS);
      setAlarmType('GENTLE');
    }
  }, [visible, editing]);

  const pending = create.isPending || update.isPending || remove.isPending;
  const valid =
    name.trim().length > 0 && /^([01]\d|2[0-3]):[0-5]\d$/.test(time) && days.length > 0;

  const onSave = () => {
    if (!valid || pending) return;
    const form = { name: name.trim(), icon, alarmTime: time, days, alarmType };
    if (editing) {
      update.mutate({ routineId: editing.id, form }, { onSuccess: onClose });
    } else {
      create.mutate(form, { onSuccess: onClose });
    }
  };

  const onDelete = () => {
    if (!editing || pending) return;
    confirmAction(`"${editing.name}" 루틴을 삭제할까요?`, () =>
      remove.mutate(editing.id, { onSuccess: onClose }),
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose}>
          <Text style={styles.title}>{editing ? '루틴 수정' : '루틴 만들기'}</Text>

          <TextInput
            style={styles.input}
            placeholder="이름 (예: 점심 산책)"
            value={name}
            onChangeText={setName}
            maxLength={30}
          />
          <View style={styles.row}>
            <TextInput
              style={[styles.input, styles.iconInput]}
              placeholder="아이콘"
              value={icon}
              onChangeText={setIcon}
              maxLength={2}
            />
            <View style={styles.timeBox}>
              <TimeField value={time} onChange={setTime} />
            </View>
          </View>

          <DaysField value={days} onChange={setDays} />

          <Pressable
            style={[styles.tarrung, alarmType === 'LOUD' && styles.tarrungOn]}
            onPress={() => setAlarmType(alarmType === 'LOUD' ? 'GENTLE' : 'LOUD')}>
            <Text style={styles.tarrungIcon}>{alarmType === 'LOUD' ? '🔔' : '🔕'}</Text>
            <View style={styles.tarrungBody}>
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

          <View style={styles.footer}>
            {editing ? (
              <Pressable onPress={onDelete} hitSlop={8}>
                <Text style={styles.deleteText}>삭제</Text>
              </Pressable>
            ) : (
              <View />
            )}
            <View style={styles.footerRight}>
              <Pressable onPress={onClose} style={styles.cancelButton}>
                <Text>취소</Text>
              </Pressable>
              <Pressable
                onPress={onSave}
                style={[styles.saveButton, !valid && styles.saveButtonDisabled]}>
                <Text style={styles.saveButtonText}>{editing ? '저장' : '만들기'}</Text>
              </Pressable>
            </View>
          </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  title: { ...SealoType.section },
  input: {
    borderWidth: SealoBorder.width,
    borderColor: SealoBorder.color,
    borderRadius: SealoRadius.sm,
    paddingHorizontal: SealoSpacing.md,
    paddingVertical: 10,
    fontSize: 15,
  },
  row: { flexDirection: 'row', gap: SealoSpacing.md, alignItems: 'center' },
  iconInput: { width: 88, textAlign: 'center' },
  timeBox: { flex: 1 },
  tarrung: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: SealoBorder.width,
    borderColor: SealoBorder.color,
    borderRadius: SealoRadius.sm,
    padding: SealoSpacing.md,
  },
  tarrungOn: { backgroundColor: SealoColors.todayHighlight, borderColor: SealoColors.stampRed },
  tarrungIcon: { fontSize: 22 },
  tarrungBody: { flex: 1 },
  tarrungTitle: { fontWeight: '700', color: SealoColors.ink },
  tarrungDesc: { fontSize: 12, color: SealoColors.textSecondary, marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerRight: { flexDirection: 'row', gap: SealoSpacing.md, alignItems: 'center' },
  deleteText: { color: SealoColors.stampRed, fontWeight: '700' },
  cancelButton: { paddingVertical: 10, paddingHorizontal: SealoSpacing.md },
  saveButton: {
    backgroundColor: SealoColors.ink,
    borderRadius: SealoRadius.sm,
    paddingVertical: 10,
    paddingHorizontal: SealoSpacing.lg,
  },
  saveButtonDisabled: { opacity: 0.3 },
  saveButtonText: { color: SealoColors.surface, fontWeight: '700' },
});
