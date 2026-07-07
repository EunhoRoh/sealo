package com.sealo.domain.shop;

/**
 * 상점 카테고리 (docs/08-상점기획.md).
 * MVP는 ACCESSORY만 판매, 나머지는 v1.1+ (enum만 추가하면 확장)
 */
public enum ItemCategory {
    ACCESSORY, // 꾸미기 (모자/안경/목도리)
    STAMP,     // 도장 디자인
    THEME,     // 보금자리 (홈 배경)
    VOICE      // 물범의 한마디 (말투 팩)
}
