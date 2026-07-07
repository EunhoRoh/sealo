package com.sealo.domain.shop;

import com.sealo.domain.member.Member;
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
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 회원이 보유한 아이템 + 착용 상태 */
@Entity
@Table(name = "member_item",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_member_item", columnNames = {"member_id", "item_id"})
        },
        indexes = {
                @Index(name = "ix_member_item_member", columnList = "member_id")
        })
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MemberItem extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id")
    private Member member;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id")
    private Item item;

    @Column(nullable = false)
    private boolean equipped;

    @Builder
    private MemberItem(Member member, Item item) {
        this.member = member;
        this.item = item;
        this.equipped = false;
    }

    public void equip() {
        this.equipped = true;
    }

    public void unequip() {
        this.equipped = false;
    }
}
