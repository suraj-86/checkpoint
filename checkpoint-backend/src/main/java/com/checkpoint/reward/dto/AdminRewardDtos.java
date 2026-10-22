package com.checkpoint.reward.dto;

import java.util.List;
import java.util.UUID;

/** Admin-facing rewards shapes. */
public final class AdminRewardDtos {

    private AdminRewardDtos() {
    }

    public record AdminItemDto(UUID id, String kind, String code, String name, boolean enabled, long ownedCount) {
    }

    public record OddsDto(String tier, int stickerPct, int boostPct, int skinPct) {
    }

    public record MilestoneDto(int days, String tier, boolean enabled) {
    }

    public record StatsDto(long chestsGranted, long chestsOpened, long boostsUsed) {
    }

    public record AdminRewardsResponse(
            List<AdminItemDto> items,
            List<OddsDto> odds,
            List<MilestoneDto> milestones,
            StatsDto stats
    ) {
    }

    public record ItemUpdateRequest(Boolean enabled, String name) {
    }

    public record OddsUpdateRequest(List<OddsDto> odds) {
    }

    public record MilestonesUpdateRequest(List<MilestoneDto> milestones) {
    }
}
