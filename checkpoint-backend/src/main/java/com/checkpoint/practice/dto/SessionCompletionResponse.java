package com.checkpoint.practice.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record SessionCompletionResponse(
        UUID sessionId,
        String status,
        int primaryQuestionCount,
        int correctCount,
        int wrongCount,
        BigDecimal accuracy,
        Integer xpChange
) {
}
