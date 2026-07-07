/**
 * Sealo 디자인 토큰 — 색·간격·모서리·타이포를 여기서만 정의한다.
 * 화면 코드에 hex/px 하드코딩 금지. 브랜드 컬러가 바뀌면 이 파일 한 곳만 수정.
 *
 * v2 팔레트 (2026-07-08): "눈밭 위 하프물범" — 옅은 아이스블루 배경 위에
 * 흰 카드(빙하), 딥네이비 잉크 라인, 인주 코랄 포인트, 조개 골드.
 */
export const SealoColors = {
  /** 눈밭 하늘 — 흰 물범이 도드라지는 옅은 아이스블루 */
  background: '#F2F8FD',
  /** 카드/모달 표면 (빙하) */
  surface: '#FFFFFF',
  /** 라인 드로잉 잉크 — 순검정 대신 딥 네이비 (부드럽고 트렌디) */
  ink: '#1C2B3A',
  /** 도장 인주 — 채도 올린 코랄 레드 */
  stampRed: '#E8503A',
  /** 아이스 하이라이트 (칩/선택 배경) */
  ice: '#DCEDFA',
  /** 조개(재화) 골드 */
  shell: '#F4A93C',
  textPrimary: '#1C2B3A',
  textSecondary: '#5E6E7E',
  disabled: 'rgba(28,43,58,0.32)',
  backdrop: 'rgba(12,28,44,0.42)',
  /** 오늘 날짜 하이라이트 (인주 계열 옅은) */
  todayHighlight: '#FFE9E4',
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

/** 카드 그림자 (빙하가 눈밭 위에 살짝 떠 있는 느낌) */
export const SealoShadow = {
  shadowColor: '#1C2B3A',
  shadowOpacity: 0.06,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 2,
} as const;
