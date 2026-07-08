package com.sealo.domain.ai;

import com.sealo.domain.member.Member;
import com.sealo.domain.member.MemberRepository;
import com.sealo.domain.plan.PlanService;
import com.sealo.domain.plan.dto.PlanDetailResponse;
import com.sealo.domain.plan.dto.PlanRequest;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * "물범에게 부탁하기" (docs/14) — 생성기가 만든 초안을 기존 플랜 파이프라인에 태운다.
 * 과금: 첫 1회 무료, 이후 조개 300개 (현금 아님 — 결정로그 #11 원칙)
 */
@Service
@Transactional(readOnly = true)
public class AiPlanService {

    public static final int AI_PLAN_COST_SHELLS = 300;

    private final Map<String, PlanDraftGenerator> generators;
    private final PlanService planService;
    private final MemberRepository memberRepository;

    public AiPlanService(List<PlanDraftGenerator> generatorList, PlanService planService,
                         MemberRepository memberRepository) {
        this.generators = generatorList.stream()
                .collect(Collectors.toMap(PlanDraftGenerator::key, Function.identity()));
        this.planService = planService;
        this.memberRepository = memberRepository;
    }

    public record AiPlanResult(PlanDetailResponse plan, boolean freeUsed, int paidShells, int shellBalance) {
    }

    @Transactional
    public AiPlanResult generate(Long memberId, String type, Map<String, String> answers) {
        PlanDraftGenerator generator = generators.get(type);
        if (generator == null) {
            throw new IllegalArgumentException("지원하지 않는 플랜 종류입니다: " + type);
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("회원을 찾을 수 없습니다."));

        boolean free = member.getAiPlanUses() == 0;
        int paid = 0;
        if (!free) {
            member.spendShells(AI_PLAN_COST_SHELLS); // 부족 시 IllegalStateException → 409
            paid = AI_PLAN_COST_SHELLS;
        }
        member.increaseAiPlanUses();

        PlanDraft draft = generator.generate(answers != null ? answers : Map.of());
        PlanDetailResponse created = planService.create(memberId, new PlanRequest(
                draft.title(), generator.theme(), draft.icon(), draft.targetDate(), draft.items()));

        // 날짜 있는 일정 항목 추가 (Plan v2) → 캘린더 표시 + 프론트 로컬 알람 대상
        planService.addScheduledItems(memberId, created.id(), draft.schedule().stream()
                .map(s -> new PlanService.ScheduledItemInput(s.name(), s.date(), s.time()))
                .toList());

        PlanDetailResponse plan = planService.getDetail(memberId, created.id());
        return new AiPlanResult(plan, free, paid, member.getShellBalance());
    }
}
