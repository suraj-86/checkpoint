package com.checkpoint.admin.dto;

import com.checkpoint.question.entity.QuestionDataset;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record DatasetSummary(
        UUID id,
        String name,
        String version,
        Instant importedAt,
        long questionCount,
        long activeQuestionCount,
        List<DatasetTopicRef> topics
) {
    public static DatasetSummary from(
            QuestionDataset d, long questionCount, long activeQuestionCount, List<DatasetTopicRef> topics) {
        return new DatasetSummary(
                d.getId(), d.getName(), d.getVersion(), d.getImportedAt(), questionCount, activeQuestionCount, topics);
    }
}
