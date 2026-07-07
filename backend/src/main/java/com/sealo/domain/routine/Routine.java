package com.sealo.domain.routine;

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
import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Set;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "routine", indexes = {
        @Index(name = "ix_routine_member", columnList = "member_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Routine extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 연관관계는 전부 LAZY — N+1 방지의 출발점 (docs/07-개발원칙.md)
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id")
    private Member member;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(nullable = false, length = 10)
    private String icon;

    @Column(nullable = false)
    private LocalTime alarmTime;

    /** 반복 요일 비트마스크 (MONDAY=1 … SUNDAY=64) — 별도 테이블 조인 없이 조회 */
    @Column(nullable = false)
    private int repeatDays;

    @Column(nullable = false)
    private boolean alarmEnabled;

    /** 따르릉 모드 여부 (docs/12 M1) */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private AlarmType alarmType;

    @Builder
    private Routine(Member member, String name, String icon, LocalTime alarmTime, Set<DayOfWeek> days,
                    AlarmType alarmType) {
        this.member = member;
        this.name = name;
        this.icon = icon;
        this.alarmTime = alarmTime;
        this.repeatDays = toBitmask(days);
        this.alarmEnabled = true;
        this.alarmType = alarmType != null ? alarmType : AlarmType.GENTLE;
    }

    public void update(String name, String icon, LocalTime alarmTime, Set<DayOfWeek> days, boolean alarmEnabled,
                       AlarmType alarmType) {
        this.name = name;
        this.icon = icon;
        this.alarmTime = alarmTime;
        this.repeatDays = toBitmask(days);
        this.alarmEnabled = alarmEnabled;
        this.alarmType = alarmType != null ? alarmType : this.alarmType;
    }

    public boolean isScheduledOn(DayOfWeek day) {
        return (repeatDays & bit(day)) != 0;
    }

    public Set<DayOfWeek> getDays() {
        Set<DayOfWeek> days = java.util.EnumSet.noneOf(DayOfWeek.class);
        for (DayOfWeek day : DayOfWeek.values()) {
            if (isScheduledOn(day)) {
                days.add(day);
            }
        }
        return days;
    }

    private static int toBitmask(Set<DayOfWeek> days) {
        int mask = 0;
        for (DayOfWeek day : days) {
            mask |= bit(day);
        }
        return mask;
    }

    private static int bit(DayOfWeek day) {
        return 1 << (day.getValue() - 1);
    }
}
