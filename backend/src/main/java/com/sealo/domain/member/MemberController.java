package com.sealo.domain.member;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberRepository memberRepository;

    public record MemberResponse(String nickname, int shellBalance) {
    }

    /** 계정 탭 + 상점 잔액 표시용 */
    @GetMapping("/me")
    public MemberResponse me(
            @RequestHeader(value = "X-Member-Id", defaultValue = "1") Long memberId) {
        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new EntityNotFoundException("회원을 찾을 수 없습니다."));
        return new MemberResponse(member.getNickname(), member.getShellBalance());
    }
}
