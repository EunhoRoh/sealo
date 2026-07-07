package com.sealo.domain.plan;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlanItemRepository extends JpaRepository<PlanItem, Long> {

    List<PlanItem> findAllByPlanIdOrderBySortOrder(Long planId);

    /** 소유권 검증 포함 단건 조회 — plan을 fetch join (완료 보너스 판단에 필요, docs/07) */
    @Query("""
            select i from PlanItem i
            join fetch i.plan p
            where i.id = :itemId and p.member.id = :memberId
            """)
    Optional<PlanItem> findOwnedWithPlan(@Param("itemId") Long itemId, @Param("memberId") Long memberId);

    long countByPlanId(Long planId);

    long countByPlanIdAndDoneTrue(Long planId);

    void deleteAllByPlanId(Long planId);

    @Query("select coalesce(max(i.sortOrder), 0) from PlanItem i where i.plan.id = :planId")
    int maxSortOrder(@Param("planId") Long planId);
}
