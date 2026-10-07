package com.checkpoint.admin.dto;

import com.checkpoint.question.entity.QuestionDataset;

import java.time.Instant;
import java.util.UUID;

public record DatasetSummary(
        UUID id,
        String name,
        String version,
        Instant importedAt,
        long questionCount,
        long activeQuestionCount
) {
    public static DatasetSummary from(QuestionDataset d, long questionCount, long activeQuestionCount) {
        return new DatasetSummary(
                d.getId(), d.getName(), d.getVersion(), d.getImportedAt(), questionCount, activeQuestionCount);
    }
}
