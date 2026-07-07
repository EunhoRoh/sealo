import { StyleSheet, Text, View } from 'react-native';

// TODO: MVP 계정 — 소셜 로그인(카카오/구글) + 알림 설정 (docs/06-화면설계.md #5)
export default function AccountScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>👤</Text>
      <Text style={styles.text}>계정 준비 중이에요</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  emoji: { fontSize: 48, marginBottom: 12 },
  text: { fontSize: 16, color: '#666' },
});
