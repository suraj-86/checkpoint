package com.checkpoint.progress.dto;

import java.math.BigDecimal;

/** GET /api/progress — question-level learning progress (distinct from the XP/streak gamification view in ProfileResponse). */
public record ProgressOverallResponse(
        long distinctQuestionsAttempted,
        long totalAttempts,
        long correctAttempts,
        long wrongAttempts,
        BigDecimal overallAccuracy,
        long needsReviewCount,
        long stableCount
) {
}
