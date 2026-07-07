package com.sealo.domain.stamp;

import com.sealo.domain.stamp.dto.DailyStampCount;
import java.time.YearMonth;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/stamps")
@RequiredArgsConstructor
public class StampController {

    private final StampService stampService;

    /** 기록 탭 캘린더 — ?month=2026-07 */
    @GetMapping("/calendar")
    public List<DailyStampCount> calendar(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId,
            @RequestParam YearMonth month) {
        return stampService.calendar(memberId, month);
    }

    public record StreakResponse(int current) {
    }

    /** 기록 탭 스트릭 — 연속 달성일 */
    @GetMapping("/streak")
    public StreakResponse streak(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId) {
        return new StreakResponse(stampService.currentStreak(memberId, java.time.LocalDate.now()));
    }
}
