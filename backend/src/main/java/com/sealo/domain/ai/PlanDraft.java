package com.sealo.domain.ai;

import java.time.LocalDate;
import java.util.List;

/** 생성기의 출력 — PlanRequest로 변환되어 기존 플랜 파이프라인을 그대로 탄다 (docs/14) */
public record PlanDraft(
        String title,
        String icon,
        LocalDate targetDate,
        List<String> items,
        /** 날짜/시간이 있는 일정 항목 (Plan v2) — 캘린더 표시 + 알람 대상 */
        List<ScheduledItem> schedule
) {
    public record ScheduledItem(String name, LocalDate date, java.time.LocalTime time) {
    }
}
