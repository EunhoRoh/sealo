package com.sealo.domain.routine;

import com.sealo.domain.routine.dto.RoutineRequest;
import com.sealo.domain.routine.dto.RoutineResponse;
import com.sealo.domain.routine.dto.TodayRoutineResponse;
import com.sealo.domain.stamp.StampService;
import com.sealo.domain.stamp.dto.StampResponse;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

// TODO: JWT 인증 도입 시 X-Member-Id 헤더를 SecurityContext 기반으로 교체
@RestController
@RequestMapping("/api/routines")
@RequiredArgsConstructor
public class RoutineController {

    private final RoutineService routineService;
    private final StampService stampService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RoutineResponse create(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId,
            @Valid @RequestBody RoutineRequest request) {
        return routineService.create(memberId, request);
    }

    @GetMapping
    public List<RoutineResponse> getAll(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId) {
        return routineService.getAll(memberId);
    }

    /** 홈 화면 — 오늘의 루틴 + 완료 여부 */
    @GetMapping("/today")
    public List<TodayRoutineResponse> getToday(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId) {
        return routineService.getToday(memberId, LocalDate.now());
    }

    @PutMapping("/{routineId}")
    public RoutineResponse update(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId,
            @PathVariable Long routineId,
            @Valid @RequestBody RoutineRequest request) {
        return routineService.update(memberId, routineId, request);
    }

    @DeleteMapping("/{routineId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId,
            @PathVariable Long routineId) {
        routineService.delete(memberId, routineId);
    }

    /** 도장 쾅 🦭 */
    @PostMapping("/{routineId}/stamp")
    @ResponseStatus(HttpStatus.CREATED)
    public StampResponse stamp(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId,
            @PathVariable Long routineId) {
        return stampService.stamp(memberId, routineId, LocalDate.now());
    }
}
