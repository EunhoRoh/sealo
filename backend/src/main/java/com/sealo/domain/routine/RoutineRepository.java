package com.sealo.domain.routine;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RoutineRepository extends JpaRepository<Routine, Long> {

    List<Routine> findAllByMemberId(Long memberId);
}
