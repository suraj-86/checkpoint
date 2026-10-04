package com.checkpoint.progress.dto;

import com.checkpoint.practice.entity.PracticeSession;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/** Shared shape for both the dashboard's "recent sessions" and the full paginated history. */
public record SessionSummary(
        UUID sessionId,
        String sessionType,
        String status,
        Instant startedAt,
        Instant completedAt,
        int correctCount,
        int wrongCount,
        BigDecimal accuracy,
        Integer xpChange
) {
    public static SessionSummary from(PracticeSession s) {
        return new SessionSummary(
                s.getId(),
                s.getSessionType().name(),
                s.getStatus().name(),
                s.getStartedAt(),
                s.getCompletedAt(),
                s.getCorrectCount(),
                s.getWrongCount(),
                s.getAccuracy(),
                s.getXpChange()
        );
    }
}
