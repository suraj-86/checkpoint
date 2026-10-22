package com.checkpoint.reward.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Student-facing rewards shapes. */
public final class RewardDtos {

    private RewardDtos() {
    }

    public record ChestDto(UUID id, String tier, String source, Instant earnedAt) {
    }

    public record BoostDto(UUID id, String type, String label) {
    }

    public record ItemDto(String code, String name, boolean owned) {
    }

    public record RewardsResponse(
            List<ChestDto> chests,
            BoostDto activeBoost,
            List<BoostDto> queuedBoosts,
            List<ItemDto> stickers,
            List<ItemDto> skins,
            String equippedSkin,
            List<String> equippedStickers
    ) {
    }

    public record OpenChestResponse(
            String kind,
            String code,
            String name,
            String label,
            boolean duplicateConvertedToBoost
    ) {
    }

    public record EquipRequest(String skin, List<String> stickers) {
    }
}
