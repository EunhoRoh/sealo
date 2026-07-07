package com.sealo.domain.stamp.dto;

import java.time.LocalDate;

/** 도장 쾅 결과 — 프론트가 애니메이션 + 조개 획득 연출에 사용 */
public record StampResponse(
        Long routineId,
        LocalDate stampDate,
        int earnedShells,
        int shellBalance
) {
}
