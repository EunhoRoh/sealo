package com.sealo.domain.shop;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MemberItemRepository extends JpaRepository<MemberItem, Long> {

    /** 카탈로그 병합용 — 엔티티 대신 (itemId, equipped)만 프로젝션, 단일 쿼리 (docs/07) */
    record OwnedItem(Long itemId, boolean equipped) {
    }

    @Query("""
            select new com.sealo.domain.shop.MemberItemRepository$OwnedItem(mi.item.id, mi.equipped)
            from MemberItem mi
            where mi.member.id = :memberId
            """)
    List<OwnedItem> findOwnedItems(@Param("memberId") Long memberId);

    boolean existsByMemberIdAndItemId(Long memberId, Long itemId);

    Optional<MemberItem> findByMemberIdAndItemId(Long memberId, Long itemId);

    /** 착용 처리용 — 카테고리 판단에 item이 필요하므로 fetch join (docs/07) */
    @Query("""
            select mi from MemberItem mi
            join fetch mi.item
            where mi.member.id = :memberId and mi.item.id = :itemId
            """)
    Optional<MemberItem> findWithItem(@Param("memberId") Long memberId, @Param("itemId") Long itemId);

    /**
     * 같은 카테고리 착용 해제 — 벌크 update 한 방 (조회 후 루프 세이브 금지, docs/07).
     * 주의: clearAutomatically를 쓰면 앞서 조회한 엔티티가 detach되어 이후 dirty checking이 무시됨.
     * 이 쿼리 뒤에 target.equip()으로 다시 true를 쓰므로 컨텍스트 유지가 맞다.
     */
    @Modifying
    @Query("""
            update MemberItem mi set mi.equipped = false
            where mi.member.id = :memberId
              and mi.equipped = true
              and mi.item.id in (select i.id from Item i where i.category = :category)
            """)
    void unequipCategory(@Param("memberId") Long memberId, @Param("category") ItemCategory category);
}
