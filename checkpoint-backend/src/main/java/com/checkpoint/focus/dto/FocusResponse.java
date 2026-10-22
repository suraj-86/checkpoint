package com.checkpoint.focus.dto;

import java.util.List;
import java.util.UUID;

public record FocusResponse(
        int todaySeconds,
        int targetMinutes,
        boolean targetReached,
        boolean rewarded,
        RewardChestDto rewardChest,
        List<DayDto> last7Days,
        int streakDays
) {

    /** Set only on the call that granted the day's chest. */
    public record RewardChestDto(UUID id, String tier) {
    }

    public record DayDto(String day, int seconds, boolean targetMet) {
    }
}
