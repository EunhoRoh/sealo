package com.sealo.domain.plan;

import com.sealo.domain.member.Member;
import com.sealo.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "plan", indexes = {
        @Index(name = "ix_plan_member", columnList = "member_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Plan extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id")
    private Member member;

    @Column(nullable = false, length = 30)
    private String title;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private PlanTheme theme;

    @Column(nullable = false, length = 10)
    private String icon;

    /** 목표일 (여행 출발일 등, D-day 계산용). 없으면 상시 플랜 */
    @Column
    private LocalDate targetDate;

    /** 100% 완료 보너스 지급 여부 (중복 지급 방지) */
    @Column(nullable = false)
    private boolean rewarded;

    @Builder
    private Plan(Member member, String title, PlanTheme theme, String icon, LocalDate targetDate) {
        this.member = member;
        this.title = title;
        this.theme = theme;
        this.icon = icon;
        this.targetDate = targetDate;
        this.rewarded = false;
    }

    public void markRewarded() {
        this.rewarded = true;
    }

    /** 계획 재조정 — 목표일을 days만큼 이동 (docs/14 킬러 유스케이스) */
    public void shiftTargetDate(int days) {
        if (targetDate != null) {
            this.targetDate = targetDate.plusDays(days);
        }
    }
}
