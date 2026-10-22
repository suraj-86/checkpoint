package com.checkpoint.progress.dto;

import java.util.List;
import java.util.UUID;

public record SessionDetailResponse(
        SessionSummary summary,
        int totalQuestions,
        int unansweredCount,
        List<QuestionReview> questions
) {

    public record QuestionReview(
            int number,
            UUID questionId,
            String question,
            String type,
            String difficulty,
            String topic,
            UUID topicId,
            String subject,
            String subtopic,
            List<String> options,
            String status,
            Object yourAnswer,
            Object correctAnswer,
            String explanation
    ) {
    }
}
