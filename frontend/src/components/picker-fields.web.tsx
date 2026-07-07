import { StyleSheet, TextInput } from 'react-native';

import { SealoBorder, SealoColors, SealoRadius } from '@/constants/sealo-theme';

/**
 * 시간/날짜 필드 — 웹 폴백 (텍스트 입력).
 * 네이티브는 picker-fields.tsx의 시스템 피커 사용.
 */

export function TimeField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <TextInput
      style={styles.input}
      placeholder="HH:MM"
      value={value}
      onChangeText={onChange}
      maxLength={5}
    />
  );
}

export function DateField({
  value,
  onChange,
  placeholder = 'YYYY-MM-DD (선택)',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={value}
      onChangeText={onChange}
      maxLength={10}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    borderWidth: SealoBorder.width,
    borderColor: SealoBorder.color,
    borderRadius: SealoRadius.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: SealoColors.textPrimary,
  },
});
