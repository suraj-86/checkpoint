package com.checkpoint.reward.dto;

import java.util.UUID;

/** What a finished session earned, returned inside the completion response. */
public record SessionRewards(ChestEarned chestEarned, StreakChest streakChest, BoostApplied boostApplied) {

    public record ChestEarned(UUID id, String tier, String reason) {
    }

    public record StreakChest(UUID id, String tier, int days) {
    }

    public record BoostApplied(String label, int bonusXp) {
    }
}
