package com.sealo.domain.shop;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 상점 카탈로그 아이템.
 * assetKey: 프론트가 실제 이미지/이모지로 매핑하는 논리 키 (예: "hat_straw").
 * 서버는 이미지를 모른다 — 에셋 교체는 프론트 seal-character.tsx 한 곳에서 (docs/07 유지보수 원칙)
 */
@Entity
@Table(name = "item")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 30)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ItemCategory category;

    @Column(nullable = false, unique = true, length = 40)
    private String assetKey;

    /** 가격 (조개) */
    @Column(nullable = false)
    private int price;

    @Column(nullable = false)
    private int sortOrder;

    @Builder
    private Item(String name, ItemCategory category, String assetKey, int price, int sortOrder) {
        this.name = name;
        this.category = category;
        this.assetKey = assetKey;
        this.price = price;
        this.sortOrder = sortOrder;
    }
}
