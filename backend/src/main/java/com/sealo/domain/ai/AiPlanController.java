package com.sealo.domain.ai;

import com.sealo.domain.ai.AiPlanService.AiPlanResult;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/plans")
@RequiredArgsConstructor
public class AiPlanController {

    private final AiPlanService aiPlanService;

    public record GenerateRequest(@NotBlank String type, Map<String, String> answers) {
    }

    /** 물범에게 부탁하기 — type: TRAVEL/WORKOUT/DIET/READING/STUDY/SKINCARE */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AiPlanResult generate(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId,
            @Valid @RequestBody GenerateRequest request) {
        return aiPlanService.generate(memberId, request.type(), request.answers());
    }
}
