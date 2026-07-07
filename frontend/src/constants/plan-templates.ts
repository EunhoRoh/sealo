import { PlanTheme } from "@/api/plans";

/**
 * 테마 플랜 템플릿 (docs/12 M3) — 테마를 고르면 항목이 미리 채워지고,
 * 사용자는 지우거나 추가해서 자기 것으로 만든다. 텍스트뿐이라 유지보수 비용 0.
 */
export interface PlanTemplate {
  theme: PlanTheme;
  label: string;
  icon: string;
  defaultTitle: string;
  /** 목표일(D-day) 입력을 보여줄지 */
  usesTargetDate: boolean;
  sealComment: string;
  items: string[];
}

export const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    theme: "TRAVEL",
    label: "여행",
    icon: "✈️",
    defaultTitle: "여행 준비",
    usesTargetDate: true,
    sealComment: "어디 가? 나도 데려가… 🦭",
    items: [
      "숙소 예약 확인",
      "교통편 예매",
      "여권/신분증 챙기기",
      "충전기 + 보조배터리",
      "상비약 (소화제/밴드)",
      "세면도구",
      "갈 곳 리스트 정하기",
      "환전/체크카드 확인",
    ],
  },
  {
    theme: "SKINCARE",
    label: "세안",
    icon: "🧴",
    defaultTitle: "저녁 스킨케어 순서",
    usesTargetDate: false,
    sealComment: "물범처럼 매끈해지자!",
    items: ["클렌징", "토너", "세럼 (비타민C)", "아이크림", "수분크림", "립밤"],
  },
  {
    theme: "WORKOUT",
    label: "운동",
    icon: "💪",
    defaultTitle: "오늘의 운동",
    usesTargetDate: false,
    sealComment: "뒹굴기도 코어 운동이야",
    items: ["스트레칭 5분", "스쿼트 15개 × 3세트", "푸시업 10개 × 3세트", "플랭크 1분", "마무리 스트레칭"],
  },
  {
    theme: "STUDY",
    label: "공부",
    icon: "📚",
    defaultTitle: "이번 주 공부 계획",
    usesTargetDate: true,
    sealComment: "뽀모도로 하나에 도장 하나!",
    items: [
      "이번 주 목표 정하기",
      "월: 개념 정리",
      "화: 문제 풀이",
      "수: 오답 복습",
      "목: 모의 테스트",
      "금: 부족한 부분 보완",
      "주말: 가볍게 총정리",
    ],
  },
  {
    theme: "CUSTOM",
    label: "커스텀",
    icon: "📝",
    defaultTitle: "",
    usesTargetDate: true,
    sealComment: "너만의 계획을 만들어봐!",
    items: [],
  },
];

/** 테마 아이콘/라벨 조회 (목록 카드용) */
export function templateFor(theme: PlanTheme): PlanTemplate {
  return PLAN_TEMPLATES.find((t) => t.theme === theme) ?? PLAN_TEMPLATES[PLAN_TEMPLATES.length - 1];
}
