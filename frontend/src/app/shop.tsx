import { StyleSheet, Text, View } from 'react-native';

// TODO: MVP 상점 — 조개로 꾸미기 아이템 구매 (docs/06-화면설계.md #3)
export default function ShopScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🛍️</Text>
      <Text style={styles.text}>상점 준비 중이에요</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
  emoji: { fontSize: 48, marginBottom: 12 },
  text: { fontSize: 16, color: '#666' },
});
