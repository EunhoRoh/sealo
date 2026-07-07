package com.sealo.domain.plan.dto;

import com.sealo.domain.plan.PlanTheme;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public record PlanRequest(
        @NotBlank @Size(max = 30) String title,
        @NotNull PlanTheme theme,
        @NotBlank @Size(max = 10) String icon,
        LocalDate targetDate,
        @Size(max = 50) List<@NotBlank @Size(max = 50) String> items
) {
}
