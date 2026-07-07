package com.sealo.domain.plan;

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
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "plan_item", indexes = {
        @Index(name = "ix_plan_item_plan", columnList = "plan_id")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PlanItem extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "plan_id")
    private Plan plan;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false)
    private boolean done;

    @Column(nullable = false)
    private int sortOrder;

    @Builder
    private PlanItem(Plan plan, String name, int sortOrder) {
        this.plan = plan;
        this.name = name;
        this.sortOrder = sortOrder;
        this.done = false;
    }

    public void toggle() {
        this.done = !this.done;
    }
}
