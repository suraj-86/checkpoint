package com.checkpoint.progress.dto;

import java.math.BigDecimal;
import java.util.UUID;

public record TopicPerformance(
        UUID topicId,
        String topicName,
        long questionsAttempted,
        long correctCount,
        BigDecimal accuracy
) {
}
