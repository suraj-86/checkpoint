package com.checkpoint.reward.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "reward_items")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RewardItem {

    @Id
    @GeneratedValue
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private RewardKind kind;

    @Column(nullable = false, length = 30, unique = true)
    private String code;

    @Column(nullable = false, length = 60)
    private String name;

    @Column(nullable = false)
    @Builder.Default
    private boolean enabled = true;
}
