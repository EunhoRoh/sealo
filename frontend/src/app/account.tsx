import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useMe } from '@/api/shop';
import { SealCharacter } from '@/components/seal-character';
import {
  SealoBorder,
  SealoColors,
  SealoRadius,
  SealoSpacing,
  SealoType,
} from '@/constants/sealo-theme';

export default function AccountScreen() {
  const { data: me } = useMe();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>계정</Text>

      <View style={styles.profileCard}>
        <SealCharacter size="sm" />
        <View style={styles.profileInfo}>
          <Text style={styles.nickname}>{me?.nickname ?? '...'}</Text>
          <Text style={styles.balance}>🐚 {me?.shellBalance ?? 0}</Text>
        </View>
      </View>

      {/* TODO: 소셜 로그인(카카오/구글) + JWT 도입 시 로그인/로그아웃 버튼 활성화 */}
      <View style={styles.menuList}>
        <Text style={styles.menuItemDisabled}>로그인 · 소셜 계정 연결 (준비 중)</Text>
        <Text style={styles.menuItemDisabled}>알림 설정 (준비 중)</Text>
        <Text style={styles.menuItemDisabled}>문의하기 (준비 중)</Text>
      </View>

      <Text style={styles.version}>Sealo v0.1.0 (MVP)</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SealoColors.background },
  title: { ...SealoType.title, textAlign: 'center', marginVertical: SealoSpacing.sm },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SealoSpacing.md,
    marginHorizontal: SealoSpacing.lg,
    borderWidth: SealoBorder.width,
    borderColor: SealoBorder.color,
    borderRadius: SealoRadius.md,
    padding: SealoSpacing.lg,
  },
  profileInfo: { gap: SealoSpacing.xs },
  nickname: { ...SealoType.section },
  balance: { color: SealoColors.textSecondary },
  menuList: {
    marginTop: SealoSpacing.lg,
    marginHorizontal: SealoSpacing.lg,
    gap: SealoSpacing.md,
  },
  menuItemDisabled: {
    ...SealoType.body,
    color: SealoColors.disabled,
    paddingVertical: SealoSpacing.sm,
  },
  version: {
    marginTop: 'auto',
    marginBottom: SealoSpacing.lg,
    textAlign: 'center',
    ...SealoType.caption,
    color: SealoColors.textSecondary,
  },
});
