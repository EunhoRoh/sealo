package com.sealo.domain.plan;

import com.sealo.domain.member.Member;
import com.sealo.domain.member.MemberRepository;
import com.sealo.domain.plan.dto.PlanDetailResponse;
import com.sealo.domain.plan.dto.PlanRequest;
import com.sealo.domain.plan.dto.PlanSummary;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PlanService {

    /** 플랜 100% 완료 보너스 (1회) — 밸런스 조정은 여기서 */
    public static final int PLAN_COMPLETE_BONUS = 30;

    private final PlanRepository planRepository;
    private final PlanItemRepository planItemRepository;
    private final MemberRepository memberRepository;

    public List<PlanSummary> getSummaries(Long memberId) {
        return planRepository.findSummaries(memberId);
    }

    public PlanDetailResponse getDetail(Long memberId, Long planId) {
        Plan plan = getOwned(memberId, planId);
        return PlanDetailResponse.of(plan, planItemRepository.findAllByPlanIdOrderBySortOrder(planId));
    }

    @Transactional
    public PlanDetailResponse create(Long memberId, PlanRequest request) {
        Member member = memberRepository.getReferenceById(memberId);
        Plan plan = planRepository.save(Plan.builder()
                .member(member)
                .title(request.title())
                .theme(request.theme())
                .icon(request.icon())
                .targetDate(request.targetDate())
                .build());

        List<String> names = request.items() != null ? request.items() : List.of();
        List<PlanItem> items = planItemRepository.saveAll(
                java.util.stream.IntStream.range(0, names.size())
                        .mapToObj(i -> PlanItem.builder()
                                .plan(plan)
                                .name(names.get(i))
                                .sortOrder(i + 1)
                                .build())
                        .toList());
        return PlanDetailResponse.of(plan, items);
    }

    public record ToggleResult(Long itemId, boolean done, long totalItems, long doneItems, int bonusShells) {
    }

    /** 항목 체크/해제. 이 체크로 100% 달성 시 최초 1회 조개 보너스 */
    @Transactional
    public ToggleResult toggleItem(Long memberId, Long itemId) {
        PlanItem item = planItemRepository.findOwnedWithPlan(itemId, memberId)
                .orElseThrow(() -> new EntityNotFoundException("항목을 찾을 수 없습니다."));
        item.toggle();

        Plan plan = item.getPlan();
        long total = planItemRepository.countByPlanId(plan.getId());
        // 방금 토글은 아직 flush 전일 수 있어 카운트 쿼리 전에 반영되도록 계산 보정
        long done = planItemRepository.countByPlanIdAndDoneTrue(plan.getId());

        int bonus = 0;
        if (item.isDone() && done == total && total > 0 && !plan.isRewarded()) {
            Member member = memberRepository.findById(memberId)
                    .orElseThrow(() -> new EntityNotFoundException("회원을 찾을 수 없습니다."));
            member.earnShells(PLAN_COMPLETE_BONUS);
            plan.markRewarded();
            bonus = PLAN_COMPLETE_BONUS;
        }
        return new ToggleResult(item.getId(), item.isDone(), total, done, bonus);
    }

    @Transactional
    public PlanDetailResponse.Item addItem(Long memberId, Long planId, String name) {
        Plan plan = getOwned(memberId, planId);
        PlanItem item = planItemRepository.save(PlanItem.builder()
                .plan(plan)
                .name(name)
                .sortOrder(planItemRepository.maxSortOrder(planId) + 1)
                .build());
        return new PlanDetailResponse.Item(item.getId(), item.getName(), item.isDone());
    }

    @Transactional
    public void deleteItem(Long memberId, Long itemId) {
        PlanItem item = planItemRepository.findOwnedWithPlan(itemId, memberId)
                .orElseThrow(() -> new EntityNotFoundException("항목을 찾을 수 없습니다."));
        planItemRepository.delete(item);
    }

    @Transactional
    public void delete(Long memberId, Long planId) {
        Plan plan = getOwned(memberId, planId);
        planItemRepository.deleteAllByPlanId(plan.getId());
        planRepository.delete(plan);
    }

    private Plan getOwned(Long memberId, Long planId) {
        return planRepository.findByIdAndMemberId(planId, memberId)
                .orElseThrow(() -> new EntityNotFoundException("플랜을 찾을 수 없습니다."));
    }
}
