package com.checkpoint.practice.dto;

import java.util.List;
import java.util.UUID;

public record ActiveSessionResponse(
        UUID sessionId,
        String sessionType,
        int primaryQuestionCount,
        int answeredPrimaryCount,
        int totalSlots,
        int answeredSlots,
        StudentQuestionResponse currentQuestion,
        List<SlotInfo> slots,
        int currentPosition
) {
}
