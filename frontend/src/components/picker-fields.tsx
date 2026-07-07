import { useState } from 'react';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Platform, Pressable, StyleSheet, Text } from 'react-native';

import { SealoBorder, SealoColors, SealoRadius } from '@/constants/sealo-theme';

/**
 * 네이티브 시간/날짜 피커 (UX P1, docs/13).
 * 웹은 picker-fields.web.tsx (텍스트 입력 폴백) — datetimepicker가 웹 미지원이라 파일 분리.
 */

const pad = (n: number) => String(n).padStart(2, '0');

/** value: "HH:MM" */
export function TimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [show, setShow] = useState(false);
  const [h, m] = value.split(':').map(Number);
  const date = new Date();
  date.setHours(Number.isFinite(h) ? h : 8, Number.isFinite(m) ? m : 0, 0, 0);

  const handle = (_: DateTimePickerEvent, picked?: Date) => {
    setShow(false);
    if (picked) onChange(`${pad(picked.getHours())}:${pad(picked.getMinutes())}`);
  };

  // iOS는 compact 인라인 피커가 자연스럽고, Android는 탭 → 시스템 다이얼로그
  if (Platform.OS === 'ios') {
    return (
      <DateTimePicker
        mode="time"
        value={date}
        onChange={(_, picked) => picked && onChange(`${pad(picked.getHours())}:${pad(picked.getMinutes())}`)}
        display="compact"
      />
    );
  }

  return (
    <>
      <Pressable style={styles.box} onPress={() => setShow(true)}>
        <Text style={styles.boxText}>⏰ {value}</Text>
      </Pressable>
      {show && <DateTimePicker mode="time" value={date} onChange={handle} />}
    </>
  );
}

/** value: "YYYY-MM-DD" 또는 "" (미설정) */
export function DateField({
  value,
  onChange,
  placeholder = '날짜 선택 (선택)',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  const date = value ? new Date(value + 'T00:00:00') : new Date();

  const handle = (_: DateTimePickerEvent, picked?: Date) => {
    setShow(false);
    if (picked) {
      onChange(`${picked.getFullYear()}-${pad(picked.getMonth() + 1)}-${pad(picked.getDate())}`);
    }
  };

  return (
    <>
      <Pressable style={styles.box} onPress={() => setShow(true)}>
        <Text style={[styles.boxText, !value && styles.placeholder]}>
          📅 {value !== '' ? value : placeholder}
        </Text>
        {value !== '' && (
          <Pressable onPress={() => onChange('')} hitSlop={8}>
            <Text style={styles.clear}>✕</Text>
          </Pressable>
        )}
      </Pressable>
      {show && <DateTimePicker mode="date" value={date} onChange={handle} />}
    </>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: SealoBorder.width,
    borderColor: SealoBorder.color,
    borderRadius: SealoRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  boxText: { fontSize: 15, color: SealoColors.textPrimary },
  placeholder: { color: SealoColors.disabled },
  clear: { fontSize: 14, color: SealoColors.textSecondary, paddingHorizontal: 4 },
});
