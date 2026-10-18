package com.checkpoint.progress.dto;

import java.util.UUID;

public record TopicMastery(
        UUID topicId,
        String topicName,
        UUID subjectId,
        String subjectName,
        long activeQuestions,
        long questionsSeen,
        long answers,
        long correct,
        int accuracy,
        long stableQuestions,
        MasteryTier tier
) {
}
