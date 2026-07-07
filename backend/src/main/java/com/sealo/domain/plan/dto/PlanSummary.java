package com.sealo.domain.plan.dto;

import com.sealo.domain.plan.PlanTheme;
import java.time.LocalDate;

/** 플랜 목록 카드용 프로젝션 */
public record PlanSummary(
        Long id,
        String title,
        PlanTheme theme,
        String icon,
        LocalDate targetDate,
        long totalItems,
        long doneItems
) {
}
