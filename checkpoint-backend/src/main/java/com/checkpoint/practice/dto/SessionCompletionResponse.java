package com.checkpoint.practice.dto;

import com.checkpoint.reward.dto.SessionRewards;

import java.math.BigDecimal;
import java.util.UUID;

public record SessionCompletionResponse(
        UUID sessionId,
        String status,
        int primaryQuestionCount,
        int correctCount,
        int wrongCount,
        BigDecimal accuracy,
        int xpChange,
        int totalXp,
        int level,
        boolean leveledUp,
        int currentStreak,
        int longestStreak,
        int streakMilestoneBonus,
        int answeredCount,
        int unattemptedCount,
        String performanceBand,
        double performancePercent,
        int sessionXp,
        int levelBefore,
        SessionRewards rewards
) {

    public SessionCompletionResponse(
            UUID sessionId, String status, int primaryQuestionCount, int correctCount, int wrongCount,
            BigDecimal accuracy, int xpChange, int totalXp, int level, boolean leveledUp, int currentStreak,
            int longestStreak, int streakMilestoneBonus, int answeredCount, int unattemptedCount,
            String performanceBand, double performancePercent, int sessionXp, int levelBefore
    ) {
        this(sessionId, status, primaryQuestionCount, correctCount, wrongCount, accuracy, xpChange, totalXp,
                level, leveledUp, currentStreak, longestStreak, streakMilestoneBonus, answeredCount,
                unattemptedCount, performanceBand, performancePercent, sessionXp, levelBefore, null);
    }
}
