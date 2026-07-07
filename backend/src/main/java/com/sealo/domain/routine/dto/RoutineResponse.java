package com.sealo.domain.routine.dto;

import com.sealo.domain.routine.Routine;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Set;

public record RoutineResponse(
        Long id,
        String name,
        String icon,
        LocalTime alarmTime,
        Set<DayOfWeek> days,
        boolean alarmEnabled
) {
    public static RoutineResponse from(Routine routine) {
        return new RoutineResponse(
                routine.getId(),
                routine.getName(),
                routine.getIcon(),
                routine.getAlarmTime(),
                routine.getDays(),
                routine.isAlarmEnabled()
        );
    }
}
