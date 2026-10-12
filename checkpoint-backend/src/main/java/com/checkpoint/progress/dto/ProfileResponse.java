package com.checkpoint.progress.dto;

import java.util.UUID;
public record ProfileResponse(
        UUID id,
        String username,
        String role,
        int totalXp,
        int level,
        int currentStreak,
        int longestStreak,
        int totalDailySessions,
        int totalFastSessions,
        com.checkpoint.xp.algorithm.LevelProgress levelProgress
) {
}
