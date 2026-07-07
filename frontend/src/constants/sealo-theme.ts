/**
 * Sealo 디자인 토큰 — 색·간격·모서리·타이포를 여기서만 정의한다.
 * 화면 코드에 hex/px 하드코딩 금지. 브랜드 컬러가 바뀌면 이 파일 한 곳만 수정.
 */
export const SealoColors = {
  background: '#FFFFFF',
  ink: '#111111', // 라인 드로잉 선 색
  stampRed: '#C0392B', // 도장 인주 — 포인트 컬러 (결정로그 #2, docs/06)
  textPrimary: '#111111',
  textSecondary: '#666666',
  disabled: 'rgba(17,17,17,0.35)',
  backdrop: 'rgba(0,0,0,0.35)',
  todayHighlight: '#FDECEA', // stampRed의 옅은 배경
} as const;

export const SealoSpacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 20,
  xl: 32,
} as const;

export const SealoRadius = {
  sm: 10,
  md: 14,
  lg: 20,
} as const;

export const SealoType = {
  title: { fontSize: 22, fontWeight: '800' },
  section: { fontSize: 18, fontWeight: '700' },
  body: { fontSize: 16, fontWeight: '600' },
  caption: { fontSize: 12 },
} as const;

/** 라인 드로잉 테두리 — 브랜드 아이덴티티라 두께도 토큰으로 */
export const SealoBorder = {
  width: 1.5,
  color: SealoColors.ink,
} as const;
