package com.checkpoint.practice.dto;

import java.util.UUID;

public record SessionAbandonResponse(
        UUID sessionId,
        String status,
        int answeredCount,
        int correctCount,
        int primaryQuestionCount
) {
}
