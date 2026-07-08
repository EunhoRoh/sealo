package com.sealo.domain.ai;

import com.sealo.domain.plan.PlanTheme;
import java.util.Map;

/**
 * AI 플랜 생성기 인터페이스 (docs/14) — 유지보수의 핵심.
 * v1: 룰 기반 템플릿 생성기 (지금 동작, 원가 0원)
 * v2: LLM 생성기(Gemini/Claude 등)를 이 인터페이스로 추가 — 호출부 무수정.
 * answers의 키는 프론트 constants/ai-questions.ts와 짝을 이룬다.
 */
public interface PlanDraftGenerator {

    /** 생성기 식별 키 (프론트 요청의 type) — 예: TRAVEL, DIET */
    String key();

    /** 생성 결과가 저장될 플랜 테마 (식단처럼 전용 테마가 없으면 CUSTOM) */
    PlanTheme theme();

    PlanDraft generate(Map<String, String> answers);
}
