/**
 * "물범에게 부탁하기" 질문 스키마 (docs/14) — 데이터 기반 위저드.
 * 질문 추가/수정 = 이 파일만 편집 (렌더링은 AiPlanModal이 제네릭하게 처리).
 * 듀오링고 원칙: 한 화면에 한 질문, 타이핑 최소화(칩 우선).
 * key는 백엔드 TemplateGenerators의 answers 키와 짝.
 */

export type AiPlanType = "TRAVEL" | "WORKOUT" | "DIET" | "READING" | "STUDY" | "SKINCARE";

export interface AiQuestion {
  key: string;
  title: string; // 물범의 질문 말풍선
  type: "text" | "chips" | "multi" | "date";
  options?: string[]; // chips/multi
  placeholder?: string; // text
  optional?: boolean;
}

export interface AiPlanSpec {
  type: AiPlanType;
  label: string;
  icon: string;
  intro: string; // 시작 말풍선
  questions: AiQuestion[];
}

export const AI_PLAN_SPECS: AiPlanSpec[] = [
  {
    type: "TRAVEL",
    label: "여행",
    icon: "✈️",
    intro: "어디로 떠나? 물범이 코스랑 준비물 챙겨올게!",
    questions: [
      { key: "destination", title: "어디로 가?", type: "text", placeholder: "예: 제주, 오사카" },
      { key: "days", title: "며칠 동안?", type: "chips", options: ["1", "2", "3", "4", "5", "7"] },
      { key: "companions", title: "누구랑 가?", type: "chips", options: ["혼자", "연인", "친구", "가족"] },
      { key: "startDate", title: "출발일은? (선택)", type: "date", optional: true },
    ],
  },
  {
    type: "WORKOUT",
    label: "운동",
    icon: "💪",
    intro: "오늘 어떤 운동? 물범이 세트까지 짜줄게!",
    questions: [
      { key: "parts", title: "어느 부위?", type: "multi", options: ["가슴", "등", "하체", "어깨", "코어"] },
      { key: "equipment", title: "어디서 해?", type: "chips", options: ["맨몸", "헬스장"] },
      { key: "restMinutes", title: "세트 간 휴식은?", type: "chips", options: ["1", "2", "3"] },
    ],
  },
  {
    type: "DIET",
    label: "식단",
    icon: "🍚",
    intro: "목표에 맞춰 하루 식단을 짜줄게! (참고용이야)",
    questions: [
      { key: "goal", title: "목표가 뭐야?", type: "chips", options: ["다이어트", "유지", "벌크업"] },
      { key: "calories", title: "하루 목표 칼로리는?", type: "chips", options: ["1500", "1800", "2200", "2800"] },
      { key: "protein", title: "단백질은 하루 몇 g?", type: "chips", options: ["80", "100", "120", "150"] },
    ],
  },
  {
    type: "READING",
    label: "독서",
    icon: "📖",
    intro: "무슨 책이야? 완독까지 분량을 나눠줄게!",
    questions: [
      { key: "book", title: "책 제목은?", type: "text", placeholder: "예: 마션" },
      { key: "pages", title: "총 몇 쪽이야?", type: "chips", options: ["200", "300", "400", "500"] },
      { key: "targetDate", title: "언제까지 다 읽을래?", type: "date" },
    ],
  },
  {
    type: "STUDY",
    label: "공부",
    icon: "📚",
    intro: "시험까지 단계별로 계획을 짜줄게!",
    questions: [
      { key: "subject", title: "무슨 공부야?", type: "text", placeholder: "예: 정보처리기사" },
      { key: "examDate", title: "시험일은?", type: "date" },
      { key: "hoursPerDay", title: "하루 몇 시간 가능해?", type: "chips", options: ["1", "2", "3", "4"] },
    ],
  },
  {
    type: "SKINCARE",
    label: "세안",
    icon: "🧴",
    intro: "가진 제품을 알려줘 — 성분 궁합까지 맞춰서 배치해줄게!",
    questions: [
      {
        key: "products",
        title: "어떤 성분을 갖고 있어?",
        type: "multi",
        options: ["비타민C", "레티놀", "나이아신아마이드", "AHA/BHA", "히알루론산", "선크림"],
      },
    ],
  },
];
