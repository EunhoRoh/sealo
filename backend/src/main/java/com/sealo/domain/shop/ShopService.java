package com.sealo.domain.shop;

import com.sealo.domain.member.Member;
import com.sealo.domain.member.MemberRepository;
import com.sealo.domain.shop.MemberItemRepository.OwnedItem;
import com.sealo.domain.shop.dto.PurchaseResponse;
import com.sealo.domain.shop.dto.ShopItemResponse;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShopService {

    private final ItemRepository itemRepository;
    private final MemberItemRepository memberItemRepository;
    private final MemberRepository memberRepository;

    /** 카탈로그 + 보유/착용 여부 — 쿼리 2번으로 끝 (docs/07) */
    public List<ShopItemResponse> getItems(Long memberId) {
        List<Item> items = itemRepository.findAllByOrderByCategoryAscSortOrderAsc();
        Map<Long, OwnedItem> owned = memberItemRepository.findOwnedItems(memberId).stream()
                .collect(java.util.stream.Collectors.toMap(OwnedItem::itemId, Function.identity()));

        return items.stream()
                .map(item -> {
                    OwnedItem ownedItem = owned.get(item.getId());
                    return ShopItemResponse.of(item, ownedItem != null, ownedItem != null && ownedItem.equipped());
                })
                .toList();
    }

    @Transactional
    public PurchaseResponse purchase(Long memberId, Long itemId) {
        Item item = itemRepository.findById(itemId)
                .orElseThrow(() -> new EntityNotFoundException("아이템을 찾을 수 없습니다."));

        if (memberItemRepository.existsByMemberIdAndItemId(memberId, itemId)) {
            throw new IllegalStateException("이미 보유한 아이템입니다.");
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("회원을 찾을 수 없습니다."));
        member.spendShells(item.getPrice()); // 잔액 부족 시 IllegalStateException → 409

        memberItemRepository.save(MemberItem.builder()
                .member(member)
                .item(item)
                .build());

        return new PurchaseResponse(itemId, item.getPrice(), member.getShellBalance());
    }

    /** 착용 — 같은 카테고리는 1개만 착용 가능 (기존 착용 자동 해제) */
    @Transactional
    public void equip(Long memberId, Long itemId) {
        MemberItem target = memberItemRepository.findWithItem(memberId, itemId)
                .orElseThrow(() -> new EntityNotFoundException("보유하지 않은 아이템입니다."));

        ItemCategory category = target.getItem().getCategory();
        memberItemRepository.unequipCategory(memberId, category);
        target.equip();
    }

    @Transactional
    public void unequip(Long memberId, Long itemId) {
        MemberItem target = memberItemRepository.findByMemberIdAndItemId(memberId, itemId)
                .orElseThrow(() -> new EntityNotFoundException("보유하지 않은 아이템입니다."));
        target.unequip();
    }
}
