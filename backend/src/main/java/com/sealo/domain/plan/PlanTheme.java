package com.sealo.domain.plan;

/**
 * 테마 플랜 (docs/12 M3): 세안/운동/공부/여행/커스텀 —
 * 전부 "이름 + 항목 리스트 + 날짜 + 알림"의 변형이라 Plan 도메인 하나로 일반화 (docs/04)
 */
public enum PlanTheme {
    SKINCARE, // 🧴 세안 — 제품 바르는 순서
    WORKOUT,  // 💪 운동 — 운동 구성
    STUDY,    // 📚 공부 — 계획 체크리스트
    TRAVEL,   // ✈️ 여행 — 준비물/방문지, targetDate = 출발일(D-day)
    CUSTOM    // ➕ 커스텀
}
