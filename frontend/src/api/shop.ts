import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "./client";

export type ItemCategory = "ACCESSORY" | "STAMP" | "THEME" | "VOICE";

export interface ShopItem {
  id: number;
  name: string;
  category: ItemCategory;
  assetKey: string;
  price: number;
  owned: boolean;
  equipped: boolean;
}

export interface Me {
  nickname: string;
  shellBalance: number;
}

export function useMe() {
  return useQuery({
    queryKey: ["members", "me"],
    queryFn: async () => (await api.get<Me>("/api/members/me")).data,
  });
}

export function useShopItems() {
  return useQuery({
    queryKey: ["shop", "items"],
    queryFn: async () => (await api.get<ShopItem[]>("/api/shop/items")).data,
  });
}

/** 현재 착용 중인 꾸미기 아이템의 assetKey (홈 물범 렌더용) */
export function useEquippedAccessory(): string | undefined {
  const { data } = useShopItems();
  return data?.find((item) => item.category === "ACCESSORY" && item.equipped)?.assetKey;
}

export function usePurchaseItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: number) =>
      (await api.post(`/api/shop/items/${itemId}/purchase`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop"] });
      queryClient.invalidateQueries({ queryKey: ["members", "me"] }); // 잔액 갱신
    },
  });
}

export function useEquipItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, equip }: { itemId: number; equip: boolean }) =>
      (await api.post(`/api/shop/items/${itemId}/${equip ? "equip" : "unequip"}`)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop"] });
    },
  });
}
