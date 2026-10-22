package com.checkpoint.reward.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "reward_odds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RewardOdds {

    @Id
    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private ChestTier tier;

    @Column(name = "sticker_pct", nullable = false)
    private int stickerPct;

    @Column(name = "boost_pct", nullable = false)
    private int boostPct;

    @Column(name = "skin_pct", nullable = false)
    private int skinPct;
}
