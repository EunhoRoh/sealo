package com.sealo.domain.stamp;

import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface StampRepository extends JpaRepository<Stamp, Long> {

    /**
     * 기간 내 도장 목록 (캘린더 화면용).
     * routine을 fetch join으로 한 번에 가져온다 — 루프에서 s.getRoutine() 접근 시 N+1 방지 (docs/07-개발원칙.md)
     */
    @Query("""
            select s from Stamp s
            join fetch s.routine
            where s.member.id = :memberId
              and s.stampDate between :start and :end
            """)
    List<Stamp> findAllWithRoutineByMemberAndPeriod(
            @Param("memberId") Long memberId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    boolean existsByRoutineIdAndStampDate(Long routineId, LocalDate stampDate);
}
