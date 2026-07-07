# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# Sealo Frontend — 작업 규칙

Expo SDK 57 + TypeScript + expo-router (src/app 파일 라우팅) + TanStack Query + Zustand.

## 유지보수 규칙 (docs/07 — 위반 금지)
- 물범/도장/아이템 그림은 `src/components/seal-character.tsx`와 `stamp-splash.tsx`에서만 렌더. 화면 코드에 🦭 등 이모지 직접 쓰기 금지. 서버 assetKey → 그림 매핑도 seal-character.tsx의 맵에서만
- 색/간격/모서리/테두리는 `src/constants/sealo-theme.ts` 토큰만 사용 (hex/px 하드코딩 금지)
- 서버 통신은 `src/api/`의 TanStack Query 훅으로만 (화면에서 axios 직접 호출 금지)
- 알림 로직은 `src/notifications/`에 격리 (루틴 알림 = 로컬 알림, FCM 아님 — 결정로그 #16)

## 화면 구조 (하단 탭 4개, docs/06)
- `src/app/index.tsx` 홈 (오늘의 루틴 + 도장) / `shop.tsx` 상점 / `records.tsx` 기록(캘린더 도장판) / `account.tsx` 계정
- 탭 정의: `src/components/app-tabs.tsx`(네이티브) + `app-tabs.web.tsx`(웹) — 둘 다 수정해야 함

## 검증
`npx tsc --noEmit` 통과 필수. 실행: `npx expo start` (w=웹, 실기기는 Expo Go QR)
