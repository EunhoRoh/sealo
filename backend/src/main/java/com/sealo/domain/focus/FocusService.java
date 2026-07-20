package com.sealo.domain.focus;

import com.sealo.domain.member.Member;
import com.sealo.domain.member.MemberRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 집중 모드 (docs/12 M1.5, 결정로그 #27) — 조기 포기 시 조개 차감.
 * 잔액이 부족하면 공짜로 포기시키되 paid=0 반환 (물범이 크게 실망하는 연출은 프론트 몫).
 * 결정로그 #11 원칙: 실패 과금은 현금이 아니라 재화로.
 */
@Service
@RequiredArgsConstructor
public class FocusService {

    public static final int GIVE_UP_COST = 50;

    private final MemberRepository memberRepository;

    public record GiveUpResult(int paidShells, int shellBalance) {
    }

    @Transactional
    public GiveUpResult giveUp(Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("회원을 찾을 수 없습니다."));
        int paid = 0;
        if (member.getShellBalance() >= GIVE_UP_COST) {
            member.spendShells(GIVE_UP_COST);
            paid = GIVE_UP_COST;
        }
        return new GiveUpResult(paid, member.getShellBalance());
    }
}
