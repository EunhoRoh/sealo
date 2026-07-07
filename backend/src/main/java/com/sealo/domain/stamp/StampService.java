package com.sealo.domain.stamp;

import com.sealo.domain.member.Member;
import com.sealo.domain.member.MemberRepository;
import com.sealo.domain.routine.Routine;
import com.sealo.domain.routine.RoutineRepository;
import com.sealo.domain.stamp.dto.DailyStampCount;
import com.sealo.domain.stamp.dto.StampResponse;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StampService {

    /** 도장 1개당 조개 보상 — 밸런스 조정은 여기 한 곳에서 */
    public static final int SHELLS_PER_STAMP = 10;

    private final StampRepository stampRepository;
    private final RoutineRepository routineRepository;
    private final MemberRepository memberRepository;

    /** 도장 쾅 — 루틴 완료 처리 + 조개 지급 */
    @Transactional
    public StampResponse stamp(Long memberId, Long routineId, LocalDate date) {
        Routine routine = routineRepository.findByIdAndMemberId(routineId, memberId)
                .orElseThrow(() -> new EntityNotFoundException("루틴을 찾을 수 없습니다."));

        if (stampRepository.existsByRoutineIdAndStampDate(routineId, date)) {
            throw new IllegalStateException("이미 도장을 찍은 루틴입니다.");
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("회원을 찾을 수 없습니다."));
        member.earnShells(SHELLS_PER_STAMP);

        stampRepository.save(Stamp.builder()
                .routine(routine)
                .member(member)
                .stampDate(date)
                .build());

        return new StampResponse(routineId, date, SHELLS_PER_STAMP, member.getShellBalance());
    }

    /** 기록 탭 캘린더 — 날짜별 도장 수 (단일 group by 쿼리) */
    public List<DailyStampCount> calendar(Long memberId, YearMonth month) {
        return stampRepository.countByDate(memberId, month.atDay(1), month.atEndOfMonth());
    }
}
