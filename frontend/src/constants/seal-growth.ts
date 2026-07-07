/**
 * 물범 성장 시스템 (docs/12 M5) — 스트릭이 쌓일수록 물범의 칭호가 올라간다.
 * 66일 = 습관 형성에 평균 66일이 걸린다는 UCL 연구에서 (재밌는 스토리 포인트)
 */
export interface SealLevel {
  minStreak: number;
  title: string;
  cheer: string;
}

const LEVELS: SealLevel[] = [
  { minStreak: 0, title: '아기물범', cheer: '이제 시작이야!' },
  { minStreak: 3, title: '뒹굴물범', cheer: '3일 넘겼다, 작심삼일 탈출!' },
  { minStreak: 7, title: '성실물범', cheer: '일주일 연속! 물범이 감동했어' },
  { minStreak: 14, title: '도장꾼', cheer: '2주째 도장 소리가 경쾌해' },
  { minStreak: 30, title: '도장 장인', cheer: '한 달 완주… 존경해' },
  { minStreak: 66, title: '습관의 신', cheer: '66일 — 이제 루틴이 너의 일부야' },
];

export function sealLevel(streak: number): SealLevel {
  let current = LEVELS[0];
  for (const level of LEVELS) {
    if (streak >= level.minStreak) current = level;
  }
  return current;
}

/** 다음 칭호까지 남은 일수 (최고 레벨이면 null) */
export function daysToNextLevel(streak: number): { next: SealLevel; days: number } | null {
  const next = LEVELS.find((level) => level.minStreak > streak);
  return next ? { next, days: next.minStreak - streak } : null;
}
