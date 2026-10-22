package com.checkpoint.reward.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "user_rewards_loadout")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RewardLoadout {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "equipped_skin", length = 30)
    private String equippedSkin;

    /** Comma-separated sticker codes, at most three. */
    @Column(name = "equipped_stickers", nullable = false, length = 200)
    @Builder.Default
    private String equippedStickers = "";
}
