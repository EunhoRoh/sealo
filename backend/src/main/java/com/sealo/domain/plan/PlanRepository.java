package com.sealo.domain.plan;

import com.sealo.domain.plan.dto.PlanSummary;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PlanRepository extends JpaRepository<Plan, Long> {

    /** 플랜 목록 + 진행률 — 항목 엔티티를 안 끌고 오는 group by 단일 쿼리 (docs/07) */
    @Query("""
            select new com.sealo.domain.plan.dto.PlanSummary(
                p.id, p.title, p.theme, p.icon, p.targetDate,
                count(i), coalesce(sum(case when i.done = true then 1 else 0 end), 0))
            from Plan p
            left join PlanItem i on i.plan = p
            where p.member.id = :memberId
            group by p.id, p.title, p.theme, p.icon, p.targetDate
            order by p.id desc
            """)
    List<PlanSummary> findSummaries(@Param("memberId") Long memberId);

    Optional<Plan> findByIdAndMemberId(Long id, Long memberId);
}
