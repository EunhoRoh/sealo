package com.sealo.domain.routine;

import com.sealo.domain.member.Member;
import com.sealo.domain.member.MemberRepository;
import com.sealo.domain.routine.dto.RoutineRequest;
import com.sealo.domain.routine.dto.RoutineResponse;
import com.sealo.domain.routine.dto.TodayRoutineResponse;
import com.sealo.domain.stamp.StampRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RoutineService {

    private final RoutineRepository routineRepository;
    private final MemberRepository memberRepository;
    private final StampRepository stampRepository;

    @Transactional
    public RoutineResponse create(Long memberId, RoutineRequest request) {
        // getReferenceById: SELECT 없이 FK만 채움 — 회원 조회 쿼리 절약 (docs/07)
        Member member = memberRepository.getReferenceById(memberId);
        Routine routine = Routine.builder()
                .member(member)
                .name(request.name())
                .icon(request.icon())
                .alarmTime(request.alarmTime())
                .days(request.days())
                .build();
        return RoutineResponse.from(routineRepository.save(routine));
    }

    public List<RoutineResponse> getAll(Long memberId) {
        return routineRepository.findAllByMemberId(memberId).stream()
                .map(RoutineResponse::from)
                .toList();
    }

    /** 홈 화면 "오늘의 루틴" — 쿼리 2번으로 끝 (루틴 목록 + 오늘 도장 id 프로젝션) */
    public List<TodayRoutineResponse> getToday(Long memberId, LocalDate date) {
        List<Routine> routines = routineRepository.findAllByMemberId(memberId);
        Set<Long> stampedIds = stampRepository.findStampedRoutineIds(memberId, date);

        return routines.stream()
                .filter(routine -> routine.isScheduledOn(date.getDayOfWeek()))
                .sorted(Comparator.comparing(Routine::getAlarmTime))
                .map(routine -> TodayRoutineResponse.of(routine, stampedIds.contains(routine.getId())))
                .toList();
    }

    @Transactional
    public RoutineResponse update(Long memberId, Long routineId, RoutineRequest request) {
        Routine routine = getOwned(memberId, routineId);
        boolean alarmEnabled = request.alarmEnabled() == null || request.alarmEnabled();
        routine.update(request.name(), request.icon(), request.alarmTime(), request.days(), alarmEnabled);
        return RoutineResponse.from(routine);
    }

    @Transactional
    public void delete(Long memberId, Long routineId) {
        Routine routine = getOwned(memberId, routineId);
        stampRepository.deleteAllByRoutineId(routine.getId());
        routineRepository.delete(routine);
    }

    private Routine getOwned(Long memberId, Long routineId) {
        // 소유권 검증을 쿼리 조건으로 — 남의 루틴이면 404 (존재 여부도 숨김)
        return routineRepository.findByIdAndMemberId(routineId, memberId)
                .orElseThrow(() -> new EntityNotFoundException("루틴을 찾을 수 없습니다."));
    }
}
