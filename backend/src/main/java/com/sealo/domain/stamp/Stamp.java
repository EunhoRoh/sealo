package com.sealo.domain.stamp;

import com.sealo.domain.member.Member;
import com.sealo.domain.routine.Routine;
import com.sealo.global.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 도장 — 루틴 1개를 완료한 기록. Sealo의 핵심 도메인.
 * 캘린더/스트릭 조회가 많으므로 (member_id, stamp_date) 복합 인덱스 필수 (docs/07-개발원칙.md)
 */
@Entity
@Table(name = "stamp",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_stamp_routine_date", columnNames = {"routine_id", "stamp_date"})
        },
        indexes = {
                @Index(name = "ix_stamp_member_date", columnList = "member_id, stamp_date")
        })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Stamp extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "routine_id")
    private Routine routine;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id")
    private Member member;

    @Column(name = "stamp_date", nullable = false)
    private LocalDate stampDate;

    @Builder
    private Stamp(Routine routine, Member member, LocalDate stampDate) {
        this.routine = routine;
        this.member = member;
        this.stampDate = stampDate;
    }
}
