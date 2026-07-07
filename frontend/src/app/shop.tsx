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
  ItemCategory,
  ShopItem,
  useEquipItem,
  useMe,
  usePurchaseItem,
  useShopItems,
} from '@/api/shop';
import { accessoryAsset } from '@/components/seal-character';
import {
  SealoBorder,
  SealoColors,
  SealoRadius,
  SealoSpacing,
  SealoType,
} from '@/constants/sealo-theme';
import { notify } from '@/utils/notify';

const CATEGORY_LABELS: Record<'ALL' | ItemCategory, string> = {
  ALL: '전체',
  ACCESSORY: '꾸미기',
  STAMP: '도장',
  THEME: '보금자리',
  VOICE: '한마디',
};

export default function ShopScreen() {
  const { data: items, isLoading } = useShopItems();
  const { data: me } = useMe();
  const purchase = usePurchaseItem();
  const equip = useEquipItem();
  const [category, setCategory] = useState<'ALL' | ItemCategory>('ALL');

  // 카탈로그에 실제 존재하는 카테고리만 칩으로 노출 (카테고리 추가 시 자동 확장)
  const categories = useMemo<('ALL' | ItemCategory)[]>(() => {
    const present = [...new Set(items?.map((item) => item.category) ?? [])];
    return present.length > 1 ? ['ALL', ...present] : present;
  }, [items]);

  const visible = useMemo(
    () => items?.filter((item) => category === 'ALL' || item.category === category),
    [items, category],
  );

  const onPressItem = (item: ShopItem) => {
    if (purchase.isPending || equip.isPending) return;
    if (!item.owned) {
      if ((me?.shellBalance ?? 0) < item.price) {
        notify(`조개가 부족해요! (보유 ${me?.shellBalance ?? 0} / 필요 ${item.price})`);
        return;
      }
      purchase.mutate(item.id, {
        onError: () => notify('구매에 실패했어요. 잠시 후 다시 시도해주세요.'),
      });
    } else {
      equip.mutate({ itemId: item.id, equip: !item.equipped });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>상점</Text>
        <View style={styles.balanceBadge}>
          <Text style={styles.balanceText}>🐚 {me?.shellBalance ?? 0}</Text>
        </View>
      </View>

      {categories.length > 0 && (
        <View style={styles.chipRow}>
          {categories.map((key) => (
            <Pressable
              key={key}
              onPress={() => setCategory(key)}
              style={[styles.chip, category === key && styles.chipActive]}>
              <Text style={[styles.chipText, category === key && styles.chipTextActive]}>
                {CATEGORY_LABELS[key]}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator style={styles.loading} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => String(item.id)}
          numColumns={3}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.gridContent}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onPressItem(item)}
              style={[styles.card, item.equipped && styles.cardEquipped]}>
              <Text style={styles.cardAsset}>{accessoryAsset(item.assetKey)}</Text>
              <Text style={styles.cardName} numberOfLines={1}>
                {item.name}
              </Text>
              <View style={[styles.priceBadge, item.owned && styles.ownedBadge]}>
                <Text style={[styles.priceText, item.owned && styles.ownedText]}>
                  {item.owned ? (item.equipped ? '착용 중' : '보유 중') : `🐚 ${item.price}`}
                </Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: SealoColors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: SealoSpacing.sm,
  },
  title: { ...SealoType.title },
  balanceBadge: {
    position: 'absolute',
    right: SealoSpacing.lg,
    borderWidth: SealoBorder.width,
    borderColor: SealoBorder.color,
    borderRadius: SealoRadius.lg,
    paddingHorizontal: SealoSpacing.md,
    paddingVertical: SealoSpacing.xs,
  },
  balanceText: { fontWeight: '700' },
  chipRow: {
    flexDirection: 'row',
    gap: SealoSpacing.sm,
    paddingHorizontal: SealoSpacing.lg,
    marginBottom: SealoSpacing.md,
  },
  chip: {
    borderWidth: SealoBorder.width,
    borderColor: SealoBorder.color,
    borderRadius: SealoRadius.lg,
    paddingHorizontal: SealoSpacing.md,
    paddingVertical: SealoSpacing.xs,
  },
  chipActive: { backgroundColor: SealoColors.ink },
  chipText: { fontSize: 13, color: SealoColors.textPrimary },
  chipTextActive: { color: SealoColors.background, fontWeight: '700' },
  gridRow: { gap: SealoSpacing.sm, paddingHorizontal: SealoSpacing.lg },
  gridContent: { gap: SealoSpacing.sm, paddingBottom: SealoSpacing.xl },
  card: {
    flex: 1,
    alignItems: 'center',
    borderWidth: SealoBorder.width,
    borderColor: SealoBorder.color,
    borderRadius: SealoRadius.md,
    paddingVertical: SealoSpacing.md,
    gap: SealoSpacing.xs,
  },
  cardEquipped: { borderColor: SealoColors.stampRed, borderWidth: 2.5 },
  cardAsset: { fontSize: 34 },
  cardName: { fontSize: 12, fontWeight: '600' },
  priceBadge: {
    borderRadius: SealoRadius.lg,
    backgroundColor: SealoColors.ink,
    paddingHorizontal: SealoSpacing.sm,
    paddingVertical: 2,
  },
  ownedBadge: { backgroundColor: SealoColors.todayHighlight },
  priceText: { fontSize: 11, color: SealoColors.background, fontWeight: '600' },
  ownedText: { color: SealoColors.stampRed },
  loading: { marginTop: SealoSpacing.xl },
});
