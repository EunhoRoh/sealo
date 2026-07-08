package com.sealo.domain.plan.dto;

import com.sealo.domain.plan.Plan;
import com.sealo.domain.plan.PlanItem;
import com.sealo.domain.plan.PlanTheme;
import java.time.LocalDate;
import java.util.List;

public record PlanDetailResponse(
        Long id,
        String title,
        PlanTheme theme,
        String icon,
        LocalDate targetDate,
        boolean rewarded,
        List<Item> items
) {
    public record Item(Long id, String name, boolean done,
                       java.time.LocalDate scheduledDate, java.time.LocalTime scheduledTime) {
    }

    public static PlanDetailResponse of(Plan plan, List<PlanItem> items) {
        return new PlanDetailResponse(
                plan.getId(),
                plan.getTitle(),
                plan.getTheme(),
                plan.getIcon(),
                plan.getTargetDate(),
                plan.isRewarded(),
                items.stream()
                        .map(i -> new Item(i.getId(), i.getName(), i.isDone(),
                                i.getScheduledDate(), i.getScheduledTime()))
                        .toList()
        );
    }
}
