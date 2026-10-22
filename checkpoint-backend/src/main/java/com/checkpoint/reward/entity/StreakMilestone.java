package com.checkpoint.reward.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "streak_milestones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StreakMilestone {

    @Id
    private int days;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ChestTier tier;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;
}
