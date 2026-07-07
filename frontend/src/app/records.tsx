import { StyleSheet, Text, View } from 'react-native';

// TODO: MVP 기록 — 캘린더 도장판 + 스트릭 (docs/06-화면설계.md #4), API: GET /api/stamps/calendar
export default function RecordsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>📅</Text>
      <Text style={styles.text}>기록 준비 중이에요</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  emoji: { fontSize: 48, marginBottom: 12 },
  text: { fontSize: 16, color: '#666' },
});
