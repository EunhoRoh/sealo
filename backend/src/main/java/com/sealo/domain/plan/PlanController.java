package com.sealo.domain.plan;

import com.sealo.domain.plan.PlanService.ToggleResult;
import com.sealo.domain.plan.dto.PlanDetailResponse;
import com.sealo.domain.plan.dto.PlanRequest;
import com.sealo.domain.plan.dto.PlanSummary;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/plans")
@RequiredArgsConstructor
public class PlanController {

    private final PlanService planService;

    @GetMapping
    public List<PlanSummary> getAll(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId) {
        return planService.getSummaries(memberId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PlanDetailResponse create(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId,
            @Valid @RequestBody PlanRequest request) {
        return planService.create(memberId, request);
    }

    /** 다가오는 일정 항목 — 프론트 플랜 알람 동기화 + 캘린더 표시용 */
    @GetMapping("/upcoming")
    public List<PlanItemRepository.UpcomingItem> upcoming(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId) {
        return planService.getUpcoming(memberId, java.time.LocalDate.now());
    }

    @GetMapping("/{planId}")
    public PlanDetailResponse detail(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId,
            @PathVariable Long planId) {
        return planService.getDetail(memberId, planId);
    }

    @DeleteMapping("/{planId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId,
            @PathVariable Long planId) {
        planService.delete(memberId, planId);
    }

    public record AddItemRequest(@NotBlank @Size(max = 50) String name) {
    }

    public record ShiftRequest(int days) {
    }

    /** 계획 재조정 — 하루 밀렸어(+1) / 당겨졌어(-1), 목표일+모든 일정 이동 */
    @PostMapping("/{planId}/shift")
    public PlanDetailResponse shift(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId,
            @PathVariable Long planId,
            @RequestBody ShiftRequest request) {
        return planService.shift(memberId, planId, request.days());
    }

    public record RescheduleRequest(java.time.LocalDate date, java.time.LocalTime time) {
    }

    /** 항목 일정 변경/해제 (date=null이면 알람 해제) */
    @org.springframework.web.bind.annotation.PatchMapping("/items/{itemId}/schedule")
    public PlanDetailResponse.Item reschedule(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId,
            @PathVariable Long itemId,
            @RequestBody RescheduleRequest request) {
        return planService.rescheduleItem(memberId, itemId, request.date(), request.time());
    }

    @PostMapping("/{planId}/items")
    @ResponseStatus(HttpStatus.CREATED)
    public PlanDetailResponse.Item addItem(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId,
            @PathVariable Long planId,
            @Valid @RequestBody AddItemRequest request) {
        return planService.addItem(memberId, planId, request.name());
    }

    /** 체크/해제 토글 — 100% 달성 시 bonusShells > 0 (물범 축하 연출 트리거) */
    @PostMapping("/items/{itemId}/toggle")
    public ToggleResult toggleItem(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId,
            @PathVariable Long itemId) {
        return planService.toggleItem(memberId, itemId);
    }

    @DeleteMapping("/items/{itemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteItem(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId,
            @PathVariable Long itemId) {
        planService.deleteItem(memberId, itemId);
    }
}
