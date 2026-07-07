package com.sealo.global.config;

import com.sealo.domain.member.AuthProvider;
import com.sealo.domain.member.Member;
import com.sealo.domain.member.MemberRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * 개발용 기본 회원 생성 (memberId=1).
 * TODO: 소셜 로그인 도입 시 제거
 */
@Component
@RequiredArgsConstructor
public class DevDataInitializer implements CommandLineRunner {

    private final MemberRepository memberRepository;

    @Override
    public void run(String... args) {
        if (memberRepository.count() == 0) {
            memberRepository.save(Member.builder()
                    .nickname("물범집사")
                    .provider(AuthProvider.GOOGLE)
                    .providerId("dev-local")
                    .build());
        }
    }
}
