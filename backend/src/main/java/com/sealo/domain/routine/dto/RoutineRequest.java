package com.sealo.domain.routine.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Set;

import com.sealo.domain.routine.AlarmType;

/** 생성/수정 공용 요청. alarmEnabled는 수정 시에만 의미 있고 생성 시 기본 true, alarmType 미지정 시 GENTLE */
public record RoutineRequest(
        @NotBlank @Size(max = 30) String name,
        @NotBlank @Size(max = 10) String icon,
        @NotNull LocalTime alarmTime,
        @NotEmpty Set<DayOfWeek> days,
        Boolean alarmEnabled,
        AlarmType alarmType
) {
}
