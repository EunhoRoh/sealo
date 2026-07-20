package com.sealo.domain.focus;

import com.sealo.domain.focus.FocusService.GiveUpResult;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/focus")
@RequiredArgsConstructor
public class FocusController {

    private final FocusService focusService;

    /** 집중 세션 조기 포기 — 조개 50 차감 (부족하면 0 차감, 물범만 실망) */
    @PostMapping("/give-up")
    public GiveUpResult giveUp(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId) {
        return focusService.giveUp(memberId);
    }
}
