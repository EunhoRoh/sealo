import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SealoBorder, SealoColors } from '@/constants/sealo-theme';

/** 요일 선택 칩 (UX P1, docs/13) — 최소 1개는 유지 */
const DAY_ORDER = [
  { key: 'MONDAY', label: '월' },
  { key: 'TUESDAY', label: '화' },
  { key: 'WEDNESDAY', label: '수' },
  { key: 'THURSDAY', label: '목' },
  { key: 'FRIDAY', label: '금' },
  { key: 'SATURDAY', label: '토' },
  { key: 'SUNDAY', label: '일' },
] as const;

export function DaysField({
  value,
  onChange,
}: {
  value: string[];
  onChange: (days: string[]) => void;
}) {
  const toggle = (day: string) => {
    if (value.includes(day)) {
      if (value.length === 1) return; // 최소 1개
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day]);
    }
  };

  return (
    <View style={styles.row}>
      {DAY_ORDER.map(({ key, label }) => {
        const on = value.includes(key);
        return (
          <Pressable
            key={key}
            onPress={() => toggle(key)}
            style={[styles.chip, on && styles.chipOn]}
            hitSlop={4}>
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 6, justifyContent: 'space-between' },
  chip: {
    flex: 1,
    aspectRatio: 1,
    maxWidth: 44,
    borderWidth: SealoBorder.width,
    borderColor: SealoBorder.color,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: SealoColors.ink },
  chipText: { fontSize: 14, fontWeight: '600', color: SealoColors.ink },
  chipTextOn: { color: SealoColors.surface },
});
