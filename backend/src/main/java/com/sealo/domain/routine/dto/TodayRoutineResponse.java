package com.sealo.domain.routine.dto;

import com.sealo.domain.routine.Routine;
import java.time.LocalTime;

/** 홈 화면 "오늘의 루틴" 한 줄 */
public record TodayRoutineResponse(
        Long id,
        String name,
        String icon,
        LocalTime alarmTime,
        boolean completed
) {
    public static TodayRoutineResponse of(Routine routine, boolean completed) {
        return new TodayRoutineResponse(
                routine.getId(),
                routine.getName(),
                routine.getIcon(),
                routine.getAlarmTime(),
                completed
        );
    }
}
