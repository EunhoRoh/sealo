package com.sealo.domain.ai;

import com.sealo.domain.plan.PlanTheme;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

/**
 * v1 룰 기반 생성기 모음 (docs/14 "물범의 룰 엔진") — LLM 없이 전 테마 동작.
 * 각 생성기는 독립 @Component라 LLM 버전으로 하나씩 교체 가능.
 */
public final class TemplateGenerators {

    private TemplateGenerators() {
    }

    private static String get(Map<String, String> answers, String key, String fallback) {
        String value = answers.get(key);
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private static int getInt(Map<String, String> answers, String key, int fallback) {
        try {
            return Integer.parseInt(answers.get(key).trim());
        } catch (Exception e) {
            return fallback;
        }
    }

    private static LocalDate getDate(Map<String, String> answers, String key) {
        try {
            return LocalDate.parse(answers.get(key).trim());
        } catch (Exception e) {
            return null;
        }
    }

    /** ✈️ 여행 — 일자별 코스 골격 + 동행 맞춤 준비물 */
    @Component
    static class Travel implements PlanDraftGenerator {
        @Override
        public String key() {
            return "TRAVEL";
        }

        @Override
        public PlanTheme theme() {
            return PlanTheme.TRAVEL;
        }

        @Override
        public PlanDraft generate(Map<String, String> a) {
            String city = get(a, "destination", "여행지");
            int days = Math.min(Math.max(getInt(a, "days", 2), 1), 14);
            String with = get(a, "companions", "");

            List<String> items = new ArrayList<>(List.of(
                    "숙소 예약 확인", "교통편 예매", "신분증/여권", "충전기 + 보조배터리", "세면도구"));
            switch (with) {
                case "가족" -> items.addAll(List.of("상비약 넉넉히", "가족 단체사진 찍을 장소 정하기"));
                case "연인" -> items.addAll(List.of("기념일 서프라이즈 준비(선택)", "인생샷 스팟 3곳 찾아두기"));
                case "친구" -> items.addAll(List.of("회비/정산 방법 정하기", "밤에 할 보드게임·이야깃거리"));
                default -> items.add("혼자만의 플레이리스트 만들기");
            }
            LocalDate start = getDate(a, "startDate");
            List<PlanDraft.ScheduledItem> schedule = new ArrayList<>();
            if (start != null) {
                // 출발일이 있으면 일자별 코스에 실제 날짜/시간 부여 → 캘린더 + 알람 (Plan v2)
                schedule.add(new PlanDraft.ScheduledItem("🧳 짐 다 쌌어? 최종 점검!",
                        start.minusDays(1), java.time.LocalTime.of(21, 0)));
                schedule.add(new PlanDraft.ScheduledItem("1일차: " + city + " 도착 · 숙소 체크인",
                        start, java.time.LocalTime.of(11, 0)));
                schedule.add(new PlanDraft.ScheduledItem("1일차 저녁: " + city + " 맛집 탐방",
                        start, java.time.LocalTime.of(18, 0)));
                for (int d = 2; d < days; d++) {
                    schedule.add(new PlanDraft.ScheduledItem(d + "일차: " + city + " 주요 명소 둘러보기",
                            start.plusDays(d - 1), java.time.LocalTime.of(10, 0)));
                }
                if (days >= 2) {
                    schedule.add(new PlanDraft.ScheduledItem(days + "일차: 기념품 사기 · 여유있게 귀가",
                            start.plusDays(days - 1), java.time.LocalTime.of(10, 0)));
                }
            } else {
                items.add("1일차: " + city + " 도착 · 숙소 체크인");
                items.add("1일차 저녁: " + city + " 맛집 탐방");
                for (int d = 2; d < days; d++) {
                    items.add(d + "일차: " + city + " 주요 명소 둘러보기");
                }
                if (days >= 2) {
                    items.add(days + "일차: 기념품 사기 · 여유있게 귀가");
                }
            }
            return new PlanDraft(city + " 여행", "✈️", start, items, schedule);
        }
    }

    /** 💪 운동 — 부위·기구별 구성 */
    @Component
    static class Workout implements PlanDraftGenerator {
        private static final Map<String, List<String>> BODYWEIGHT = Map.of(
                "가슴", List.of("푸시업 12개 × 3세트", "인클라인 푸시업 10개 × 2세트"),
                "등", List.of("슈퍼맨 자세 30초 × 3세트", "타월 로우 12개 × 3세트"),
                "하체", List.of("스쿼트 15개 × 3세트", "런지 좌우 10개 × 3세트"),
                "어깨", List.of("파이크 푸시업 8개 × 3세트", "암 서클 30초 × 3세트"),
                "코어", List.of("플랭크 40초 × 3세트", "레그레이즈 12개 × 3세트"));
        private static final Map<String, List<String>> GYM = Map.of(
                "가슴", List.of("벤치프레스 10개 × 4세트", "체스트 플라이 12개 × 3세트"),
                "등", List.of("랫풀다운 10개 × 4세트", "시티드 로우 12개 × 3세트"),
                "하체", List.of("레그프레스 12개 × 4세트", "레그컬 12개 × 3세트"),
                "어깨", List.of("숄더프레스 10개 × 4세트", "사이드 레터럴 레이즈 15개 × 3세트"),
                "코어", List.of("케이블 크런치 15개 × 3세트", "행잉 레그레이즈 10개 × 3세트"));

        @Override
        public String key() {
            return "WORKOUT";
        }

        @Override
        public PlanTheme theme() {
            return PlanTheme.WORKOUT;
        }

        @Override
        public PlanDraft generate(Map<String, String> a) {
            boolean gym = "헬스장".equals(get(a, "equipment", "맨몸"));
            int rest = getInt(a, "restMinutes", 1);
            Map<String, List<String>> db = gym ? GYM : BODYWEIGHT;

            List<String> items = new ArrayList<>();
            items.add("워밍업 스트레칭 5분");
            for (String part : get(a, "parts", "전신").split(",")) {
                String key = part.trim();
                items.addAll(db.getOrDefault(key,
                        List.of("스쿼트 15개 × 3세트", "푸시업 10개 × 3세트", "플랭크 40초 × 3세트")));
            }
            items.add("세트 간 휴식 " + rest + "분 지키기");
            items.add("마무리 쿨다운 스트레칭 5분");
            items.add("물 500ml 이상 마시기");
            return new PlanDraft("오늘의 " + get(a, "parts", "전신") + " 운동", "💪", null, items, List.of());
        }
    }

    /** 🍚 식단 — 목표별 칼로리/단백질 분배 */
    @Component
    static class Diet implements PlanDraftGenerator {
        @Override
        public String key() {
            return "DIET";
        }

        @Override
        public PlanTheme theme() {
            return PlanTheme.CUSTOM; // 식단은 커스텀 테마로 저장 (전용 enum은 수요 확인 후)
        }

        @Override
        public PlanDraft generate(Map<String, String> a) {
            String goal = get(a, "goal", "다이어트");
            int kcal = getInt(a, "calories", "벌크업".equals(goal) ? 2800 : 1800);
            int protein = getInt(a, "protein", 120);
            int perMeal = Math.round(protein / 3f);

            List<String> items = new ArrayList<>();
            items.add(String.format("아침 (~%dkcal): 오트밀/계란 — 단백질 %dg", Math.round(kcal * 0.25), perMeal));
            items.add(String.format("점심 (~%dkcal): 잡곡밥+닭가슴살/생선 — 단백질 %dg", Math.round(kcal * 0.35), perMeal));
            items.add(String.format("저녁 (~%dkcal): 두부/살코기+채소 — 단백질 %dg", Math.round(kcal * 0.3), perMeal));
            items.add(String.format("간식 (~%dkcal): 그릭요거트/견과", Math.round(kcal * 0.1)));
            items.add(String.format("💡 단백질 %dg ≈ 닭가슴살 %dg 상당", protein, protein * 100 / 23));
            if ("다이어트".equals(goal)) items.add("취침 3시간 전 금식");
            if ("벌크업".equals(goal)) items.add("운동 직후 단백질 보충 잊지 않기");
            items.add("장보기: 계란·닭가슴살·오트밀·채소·그릭요거트");
            items.add("⚠️ 참고용 계획 — 건강 상태에 따라 전문가와 상의하세요");
            return new PlanDraft(goal + " 식단 (" + kcal + "kcal)", "🍚", null, items, List.of());
        }
    }

    /** 📖 독서 — 완독일까지 분량 자동 분할 */
    @Component
    static class Reading implements PlanDraftGenerator {
        @Override
        public String key() {
            return "READING";
        }

        @Override
        public PlanTheme theme() {
            return PlanTheme.READING;
        }

        @Override
        public PlanDraft generate(Map<String, String> a) {
            String book = get(a, "book", "읽을 책");
            int pages = Math.max(getInt(a, "pages", 300), 1);
            LocalDate target = getDate(a, "targetDate");
            long days = target != null
                    ? Math.max(java.time.temporal.ChronoUnit.DAYS.between(LocalDate.now(), target), 1)
                    : 14;
            int perDay = (int) Math.ceil(pages / (double) days);
            int weeks = (int) Math.ceil(days / 7.0);

            List<String> items = new ArrayList<>();
            items.add(String.format("하루 %d쪽씩 읽기 (%d쪽 ÷ %d일)", perDay, pages, days));
            for (int w = 1; w <= Math.min(weeks, 8); w++) {
                int from = (w - 1) * perDay * 7 + 1;
                int to = Math.min(w * perDay * 7, pages);
                items.add(String.format("%d주차: %d~%d쪽", w, from, to));
                if (to >= pages) break;
            }
            items.add("인상 깊은 문장 3개 기록하기");
            items.add("완독하면 물범에게 한 줄 감상 들려주기 🦭");
            return new PlanDraft("『" + book + "』 완독", "📖", target, items, List.of());
        }
    }

    /** 📚 공부 — 시험일까지 단계 분배 */
    @Component
    static class Study implements PlanDraftGenerator {
        @Override
        public String key() {
            return "STUDY";
        }

        @Override
        public PlanTheme theme() {
            return PlanTheme.STUDY;
        }

        @Override
        public PlanDraft generate(Map<String, String> a) {
            String subject = get(a, "subject", "공부");
            LocalDate exam = getDate(a, "examDate");
            long weeks = exam != null
                    ? Math.max(java.time.temporal.ChronoUnit.WEEKS.between(LocalDate.now(), exam), 1)
                    : 4;
            int hours = getInt(a, "hoursPerDay", 2);

            List<String> items = new ArrayList<>();
            items.add(String.format("매일 %d시간 = 뽀모도로 %d세트 (25분 집중+5분 휴식)", hours, hours * 2));
            long concept = Math.max(Math.round(weeks * 0.4), 1);
            long practice = Math.max(Math.round(weeks * 0.3), 1);
            items.add("1~" + concept + "주차: 개념 정리 (교재 1회독)");
            items.add((concept + 1) + "~" + (concept + practice) + "주차: 문제 풀이 + 오답노트");
            items.add("마지막 주: 모의시험 + 오답 최종 복습");
            items.add("주말마다: 한 주 배운 것 물범에게 설명해보기 (설명 못 하면 모르는 것!)");
            return new PlanDraft(subject + " 정복", "📚", exam, items, List.of());
        }
    }

    /** 🧴 세안 — 성분 궁합 규칙 배치 (docs/14 창의 디테일) */
    @Component
    static class Skincare implements PlanDraftGenerator {
        @Override
        public String key() {
            return "SKINCARE";
        }

        @Override
        public PlanTheme theme() {
            return PlanTheme.SKINCARE;
        }

        @Override
        public PlanDraft generate(Map<String, String> a) {
            List<String> products = List.of(get(a, "products", "").split(","));
            boolean retinol = products.contains("레티놀");
            boolean vitc = products.contains("비타민C");
            boolean aha = products.contains("AHA/BHA");
            boolean niacin = products.contains("나이아신아마이드");

            List<String> items = new ArrayList<>();
            items.add("아침: 물세안 → 토너" + (vitc ? " → 비타민C 세럼" : "") + (niacin ? " → 나이아신아마이드" : "")
                    + " → 수분크림 → ☀️ 선크림 (필수!)");
            items.add("저녁: 클렌징 → 토너" + (niacin ? " → 나이아신아마이드" : "") + " → 수분크림");
            if (retinol) {
                items.add("🌙 레티놀: 화·금 저녁에만 (자극 최소화, 다음날 선크림 필수)");
            }
            if (aha) {
                items.add("🧪 AHA/BHA 각질케어: " + (retinol ? "수·일 저녁 (레티놀과 다른 날!)" : "주 2회 저녁"));
            }
            if (retinol && vitc) {
                items.add("💡 궁합: 비타민C는 아침, 레티놀은 저녁 — 같은 타임에 겹치지 않게 배치했어요");
            }
            if (retinol && aha) {
                items.add("⚠️ 레티놀과 AHA/BHA를 같은 날 쓰면 자극이 커요 — 요일을 나눴어요");
            }
            items.add("주 1회: 피부 상태 사진으로 기록");
            return new PlanDraft("나만의 스킨케어 루틴", "🧴", null, items, List.of());
        }
    }
}
