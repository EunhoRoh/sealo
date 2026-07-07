package com.sealo.domain.shop;

import com.sealo.domain.shop.dto.PurchaseResponse;
import com.sealo.domain.shop.dto.ShopItemResponse;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shop/items")
@RequiredArgsConstructor
public class ShopController {

    private final ShopService shopService;

    @GetMapping
    public List<ShopItemResponse> getItems(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId) {
        return shopService.getItems(memberId);
    }

    @PostMapping("/{itemId}/purchase")
    @ResponseStatus(HttpStatus.CREATED)
    public PurchaseResponse purchase(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId,
            @PathVariable Long itemId) {
        return shopService.purchase(memberId, itemId);
    }

    @PostMapping("/{itemId}/equip")
    public void equip(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId,
            @PathVariable Long itemId) {
        shopService.equip(memberId, itemId);
    }

    @PostMapping("/{itemId}/unequip")
    public void unequip(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId,
            @PathVariable Long itemId) {
        shopService.unequip(memberId, itemId);
    }
}
