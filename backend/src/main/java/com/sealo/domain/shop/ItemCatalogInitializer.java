package com.sealo.domain.shop;

import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * 상점 카탈로그 시드 (docs/08-상점기획.md).
 * MVP는 꾸미기(ACCESSORY)만 판매. 도장/테마/말투 팩은 v1.1+.
 * TODO: 카탈로그가 커지면 Flyway 마이그레이션 데이터로 이전
 */
@Component
@RequiredArgsConstructor
public class ItemCatalogInitializer implements CommandLineRunner {

    private final ItemRepository itemRepository;

    @Override
    public void run(String... args) {
        if (itemRepository.count() > 0) {
            return;
        }
        itemRepository.saveAll(List.of(
                item("불가사리 머리핀", "acc_starfish_pin", 50, 1),
                item("해초 목도리", "acc_seaweed_scarf", 60, 2),
                item("동그란 안경", "acc_round_glasses", 70, 3),
                item("밀짚모자", "acc_straw_hat", 80, 4),
                item("선원 모자", "acc_sailor_hat", 100, 5),
                item("소라고둥 모자", "acc_conch_hat", 120, 6)
        ));
    }

    private static Item item(String name, String assetKey, int price, int sortOrder) {
        return Item.builder()
                .name(name)
                .category(ItemCategory.ACCESSORY)
                .assetKey(assetKey)
                .price(price)
                .sortOrder(sortOrder)
                .build();
    }
}
