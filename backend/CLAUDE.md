# Sealo Backend — 작업 규칙

Spring Boot **4.1** + Java 21 (Gradle 툴체인 자동 프로비저닝) + JPA + PostgreSQL 16.

## Spring Boot 4 주의사항 (삽질 방지)
- Jackson은 **3.x**: `tools.jackson.databind.ObjectMapper` (com.fasterxml 아님)
- MockMvc 자동설정: `org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc`
- 테스트 스타터가 모듈별 분리됨 (build.gradle 참고)

## 성능 규칙 (docs/07 — PR마다 체크)
- 연관관계는 전부 `fetch = LAZY`. 전역 `default_batch_fetch_size: 100`, `open-in-view: false` 설정돼 있음 (건드리지 말 것)
- 목록 조회는 엔티티 대신 **DTO/id 프로젝션** 또는 fetch join. 예시: `StampRepository.findStampedRoutineIds`, `MemberItemRepository.findOwnedItems`
- 소유권 검증은 `findByIdAndMemberId` 쿼리 조건으로 (지연 로딩 프록시 접근 금지)
- 대량 상태 변경은 벌크 UPDATE (`MemberItemRepository.unequipCategory`). 단 `clearAutomatically=true`는 기조회 엔티티를 detach시켜 dirty checking을 무효화하니 주의
- 조회 조건에는 인덱스 (`stamp`: member_id+stamp_date 복합)

## 구조 관례
- 패키지: `domain/<도메인>/` (entity, repository, service, controller, dto) + `global/` (config, exception)
- 쓰기 서비스만 `@Transactional`, 클래스 기본은 `readOnly = true`
- 정책 값(도장 보상 등)은 상수로 한 곳에 (`StampService.SHELLS_PER_STAMP`)
- 인증은 임시로 `X-Member-Id` 헤더 (기본 1) — JWT 도입 시 일괄 교체 (docs/09)

## 검증
`./gradlew build` — 통합 테스트(MockMvc, H2) 포함. 새 API에는 테스트 필수 (한글 메서드명 관례)
