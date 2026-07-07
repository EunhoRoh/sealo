package com.sealo.domain.routine;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoutineRepository extends JpaRepository<Routine, Long> {

    List<Routine> findAllByMemberId(Long memberId);

    /** 소유권 검증을 쿼리 레벨에서 처리 — member 지연 로딩을 건드리지 않아 추가 쿼리 없음 (docs/07) */
    Optional<Routine> findByIdAndMemberId(Long id, Long memberId);
}
