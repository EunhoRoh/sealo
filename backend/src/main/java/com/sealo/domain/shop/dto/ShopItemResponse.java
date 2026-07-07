package com.sealo.domain.shop.dto;

import com.sealo.domain.shop.Item;
import com.sealo.domain.shop.ItemCategory;

public record ShopItemResponse(
        Long id,
        String name,
        ItemCategory category,
        String assetKey,
        int price,
        boolean owned,
        boolean equipped
) {
    public static ShopItemResponse of(Item item, boolean owned, boolean equipped) {
        return new ShopItemResponse(
                item.getId(),
                item.getName(),
                item.getCategory(),
                item.getAssetKey(),
                item.getPrice(),
                owned,
                equipped
        );
    }
}
