# Sealo 🦭 — 작업 가이드 (Claude Code용)

물범이 도장을 찍어주는 루틴 앱. Seal(물범) = Seal(도장), "Seal of Approval".

## 세션 시작 시 반드시 읽을 것 (순서대로)
1. **[README.md](README.md) "현재 상태 / 다음 작업"** — 어디까지 했고 무엇을 할 차례인지
2. **[docs/03-결정로그.md](docs/03-결정로그.md)** — 확정된 결정. 번복하려면 새 항목으로 추가 (줄 긋기 금지)
3. 작업 영역에 따라: 기능 범위 [docs/04](docs/04-MVP-기능정의.md) / 화면 [docs/06](docs/06-화면설계.md) / 상점 [docs/08](docs/08-상점기획.md)

## 작업 규칙
- **결정이 생기면** → docs/03-결정로그.md에 추가
- **마일스톤 완료 시** → README 현재 상태 갱신 + **docs/10-포트폴리오.md**에 스토리(상황→고민→결정→근거→결과) 추가 — 면접·자소서용이라 수치 필수
- **기능 제안 시** → "군더더기 없이 최소한" 원칙 (결정로그 #3). 확장 아이디어는 v2 목록으로
- 커밋은 EunhoRoh 계정(저장소 로컬 설정됨), 원격: github.com/EunhoRoh/sealo (private)

## 유지보수 원칙 (docs/07 — 위반 금지)
- 물범/도장 렌더: `frontend/src/components/seal-character.tsx`, `stamp-splash.tsx` **두 파일에서만**. 화면에 🦭 직접 쓰기 금지
- 색/간격/테두리: `frontend/src/constants/sealo-theme.ts` 토큰만. hex/px 하드코딩 금지
- API 호출: `frontend/src/api/` 훅으로만. 알림 로직: `frontend/src/notifications/`에 격리
- 서버 아이템은 assetKey 논리 키만 저장 (그림은 프론트 매핑)
- **N+1 금지**: 연관관계 LAZY, 목록 조회는 프로젝션/fetch join, 화면당 쿼리 수 확인 (backend/CLAUDE.md 상세)

## 실행
[docs/11-시스템구성-배포.md](docs/11-시스템구성-배포.md) 참고. 요약: `backend`에서 `docker compose up -d` + `./gradlew bootRun`, `frontend`에서 `npx expo start`(w=웹).

## 검증 (커밋 전 필수)
- backend: `./gradlew build` (테스트 포함)
- frontend: `npx tsc --noEmit`
