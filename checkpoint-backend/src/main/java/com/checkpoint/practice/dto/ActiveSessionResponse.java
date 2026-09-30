package com.checkpoint.practice.dto;

import java.util.UUID;

public record ActiveSessionResponse(
        UUID sessionId,
        String sessionType,
        int primaryQuestionCount,
        int answeredPrimaryCount,
        int totalSlots,
        int answeredSlots,
        StudentQuestionResponse currentQuestion
) {
}
