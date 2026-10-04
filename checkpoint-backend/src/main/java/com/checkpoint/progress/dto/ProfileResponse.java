package com.checkpoint.progress.dto;

import java.util.UUID;

/** GET /api/profile — docs/05-API-Specification.md section 3. */
public record ProfileResponse(
        UUID id,
        String username,
        String role,
        int totalXp,
        int level,
        int currentStreak,
        int longestStreak,
        int totalDailySessions,
        int totalFastSessions
) {
}
