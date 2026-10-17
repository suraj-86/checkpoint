package com.checkpoint.progress.dto;

import java.util.List;

public record SessionHistoryItem(
        SessionSummary summary,
        int totalQuestions,
        List<String> topics
) {
}
