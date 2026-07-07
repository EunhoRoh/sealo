package com.sealo.domain.stamp.dto;

import java.time.LocalDate;

public record DailyStampCount(LocalDate date, long count) {
}
