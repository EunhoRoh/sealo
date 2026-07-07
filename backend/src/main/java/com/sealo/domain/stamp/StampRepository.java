package com.sealo.domain.stamp;

import com.sealo.domain.stamp.dto.DailyStampCount;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
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

    /** 오늘 완료된 루틴 id만 — 엔티티 대신 id 프로젝션으로 단일 쿼리 (docs/07) */
    @Query("""
            select s.routine.id from Stamp s
            where s.member.id = :memberId and s.stampDate = :date
            """)
    Set<Long> findStampedRoutineIds(@Param("memberId") Long memberId, @Param("date") LocalDate date);

    /** 캘린더용 날짜별 도장 수 — DTO 프로젝션 + group by 단일 쿼리 (docs/07) */
    @Query("""
            select new com.sealo.domain.stamp.dto.DailyStampCount(s.stampDate, count(s))
            from Stamp s
            where s.member.id = :memberId
              and s.stampDate between :start and :end
            group by s.stampDate
            order by s.stampDate
            """)
    List<DailyStampCount> countByDate(
            @Param("memberId") Long memberId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    void deleteAllByRoutineId(Long routineId);
}
