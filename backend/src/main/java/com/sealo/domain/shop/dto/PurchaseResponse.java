package com.sealo.domain.shop.dto;

public record PurchaseResponse(
        Long itemId,
        int paidShells,
        int shellBalance
) {
}
