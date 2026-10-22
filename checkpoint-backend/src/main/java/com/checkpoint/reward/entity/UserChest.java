package com.checkpoint.reward.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "user_chests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserChest {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ChestTier tier;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private ChestSource source;

    @Column(name = "source_key", nullable = false, length = 100)
    private String sourceKey;

    @Column(name = "earned_at", nullable = false)
    private Instant earnedAt;

    @Column(name = "opened_at")
    private Instant openedAt;

    @Column(name = "result_kind", length = 10)
    private String resultKind;

    @Column(name = "result_ref", length = 60)
    private String resultRef;
}
