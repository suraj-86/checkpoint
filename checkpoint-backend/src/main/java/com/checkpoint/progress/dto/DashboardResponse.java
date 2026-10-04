package com.checkpoint.progress.dto;

import java.util.List;

/**
 * GET /api/profile/dashboard — docs section 3: "A single dashboard
 * endpoint avoids forcing the frontend to make many separate requests
 * for one screen." Bundles the gamification snapshot (XP/level/streak),
 * today's status, the review backlog size, and a short recent-activity
 * list — everything a dashboard screen needs in one call.
 */
public record DashboardResponse(
        String username,
        int level,
        int totalXp,
        int currentStreak,
        int longestStreak,
        boolean dailySessionCompletedToday,
        boolean hasActiveSession,
        long questionsNeedingReview,
        List<SessionSummary> recentSessions
) {
}
