package com.checkpoint.progress.dto;

import java.util.List;
import java.util.UUID;

public record SubjectMastery(
        UUID subjectId,
        String subjectName,
        long activeQuestions,
        long questionsSeen,
        long answers,
        long correct,
        int accuracy,
        List<TopicMastery> topics
) {
}
