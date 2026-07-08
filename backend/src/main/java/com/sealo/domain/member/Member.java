package com.sealo.domain.member;

import com.sealo.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "member", uniqueConstraints = {
        @UniqueConstraint(name = "uk_member_provider", columnNames = {"provider", "provider_id"})
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String nickname;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AuthProvider provider;

    @Column(name = "provider_id", nullable = false)
    private String providerId;

    /** 재화(조개) 잔액 */
    @Column(nullable = false)
    private int shellBalance;

    /** AI 플랜 사용 횟수 — 0이면 첫 1회 무료 (docs/14) */
    @Column(nullable = false, columnDefinition = "integer not null default 0")
    private int aiPlanUses;

    @Builder
    private Member(String nickname, AuthProvider provider, String providerId) {
        this.nickname = nickname;
        this.provider = provider;
        this.providerId = providerId;
        this.shellBalance = 0;
    }

    public void earnShells(int amount) {
        this.shellBalance += amount;
    }

    public void spendShells(int amount) {
        if (shellBalance < amount) {
            throw new IllegalStateException("조개가 부족합니다.");
        }
        this.shellBalance -= amount;
    }

    public void increaseAiPlanUses() {
        this.aiPlanUses++;
    }
}
